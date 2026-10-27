import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { crearAccesoServidor } from './servidor.mjs';

const ORIGIN='https://rwadar.pages.dev';
const UID='11111111-1111-4111-8111-111111111111';
const TOKEN='eyJ0ZXN0.e30.ZmlybWE';
const ENV={SUPABASE_URL:'https://exgpmjpaaebyoolpwced.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_prueba'};
const CSP="default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function entorno({revocada=false}={}) {
  const llamadas=[];
  const servidor=crearAccesoServidor({fetchImpl:async(url,opciones)=>{
    llamadas.push({url,opciones});
    assert.equal(opciones.method,'GET');
    return Response.json(url.endsWith('/auth/v1/user')
      ? {id:UID,email:'qa@ejemplo.test',email_confirmed_at:'2026-10-27T00:00:00Z',is_anonymous:false}
      : revocada?[]:[{id:UID}]);
  }});
  const run=(ruta='/api/acceso/tutorial',headers={Authorization:'Bearer '+TOKEN},method='GET')=>servidor.atender({env:ENV,
    request:new Request(ORIGIN+ruta,{method,headers}),next:()=>{throw new Error('No debe servir un recurso publico en lugar del intercambio');}});
  return {run,llamadas};
}

test('bootstrap c20: script real navega solo desde la API hacia destino fijo sin tokens ni cabeceras',async()=>{
  const e=entorno(),response=await e.run('/api/acceso/tutorial-continuar.js',{}),script=await response.text();
  assert.equal(response.status,200);assert.equal(e.llamadas.length,0);
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('content-type'),'application/javascript; charset=utf-8');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  for(const pathname of ['/api/acceso/tutorial','/','/api/acceso/sesion','/api/acceso/tutorial/','/acceso']) {
    const destinos=[];
    const location=new Proxy({pathname,replace(...args){destinos.push(args);}},
      {get(target,key){assert.ok(['pathname','replace'].includes(key),'No leer URL ni credenciales');return target[key];}});
    vm.runInNewContext(script,{location,fetch(){throw new Error('No debe enviar cabeceras ni hacer fetch');}});
    assert.deepEqual(destinos,pathname==='/api/acceso/tutorial'?[['/#explain']]:[]);
  }
});

test('bootstrap c20: respuesta visible 200 conserva cookie y CSP sin redireccion HTTP',async()=>{
  const e=entorno(),r=await e.run(),html=await r.text();
  assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);
  assert.equal(r.headers.get('content-security-policy'),CSP);
  assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal(r.headers.get('cache-control'),'private, no-store');
  assert.equal(r.headers.get('access-control-allow-origin'),null);
  assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  assert.match(html,/<p>Abriendo el tutorial de Academy/);
  assert.match(html,/<a href="\/#explain">Continuar al tutorial<\/a>/);
  assert.match(html,/<script src="\/api\/acceso\/tutorial-continuar\.js" defer><\/script>/);
  assert.equal(html.includes(TOKEN),false);
  assert.doesNotMatch(html,/http-equiv|Authorization|access_token|location\./i);
  assert.equal(e.llamadas.length,2);
});

test('bootstrap c20: Bearer, sesion revocada, query y origen cruzado conservan las compuertas',async()=>{
  for(const caso of [
    {headers:{},status:401,consultas:0},
    {headers:{Cookie:'__Host-rwadar-acceso='+TOKEN},status:401,consultas:0},
    {headers:{Authorization:'Bearer invalido'},status:401,consultas:0},
    {revocada:true,status:401,consultas:2},
    {ruta:'/api/acceso/tutorial?token='+TOKEN,status:400,consultas:0},
    {headers:{Authorization:'Bearer '+TOKEN,'sec-fetch-site':'cross-site'},status:400,consultas:0},
    {method:'HEAD',status:405,consultas:0},
    {method:'POST',headers:{Authorization:'Bearer '+TOKEN,Origin:ORIGIN},status:405,consultas:0},
    {ruta:'/api/acceso/tutorial-continuar.js?token='+TOKEN,status:400,consultas:0},
    {ruta:'/api/acceso/tutorial-continuar.js',headers:{'sec-fetch-site':'cross-site'},status:400,consultas:0},
    {ruta:'/api/acceso/tutorial-continuar.js',method:'HEAD',status:405,consultas:0},
    {ruta:'/api/acceso/tutorial-continuar.js',method:'POST',headers:{Origin:ORIGIN},status:405,consultas:0}
  ]) {
    const e=entorno(caso),r=await e.run(caso.ruta,caso.headers,caso.method);
    assert.equal(r.status,caso.status);assert.equal(r.headers.get('set-cookie'),null);
    assert.equal(r.headers.get('location'),null);assert.equal(e.llamadas.length,caso.consultas);
  }
});
