import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {crearAccesoServidor} from './servidor.mjs';
const ORIGIN='https://rwadar.pages.dev',TOKEN='eyJ0ZXN0.e30.ZmlybWE',UID='11111111-1111-4111-8111-111111111111';
const ENV={SUPABASE_URL:'https://exgpmjpaaebyoolpwced.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_prueba'};
for(const status of [400,403,404,409,401])test(`Auth y guardia válidos: rechazo REST${status} conserva estado real y oculta datos`,async()=>{
  const calls=[];
  const server=crearAccesoServidor({fetchImpl:async url=>{
    calls.push(url);
    if(url.includes('/auth/v1/user'))return Response.json({id:UID,email:'local@example.test',email_confirmed_at:'2026-10-28T00:00:00Z'});
    if(url.includes('/mi_perfil?'))return Response.json([{id:UID}]);
    assert.ok(url.includes('/rest/v1/perfiles?'));
    return new Response('PRIVATE_BODY '+TOKEN,{status,headers:{'X-Private':'PRIVATE_HEADER'}});
  }});
  const response=await server.atender({env:ENV,request:new Request(ORIGIN+'/api/acceso/datos',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json',Cookie:'__Host-rwadar-acceso='+TOKEN},body:JSON.stringify({ruta:'/perfiles?select=avisos_correo&id=eq.'+UID,metodo:'GET'})}),next(){throw Error('No ASSETS');}});
  assert.equal(calls.length,3);assert.equal(response.status,status);
  assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('X-Private'),null);
  assert.deepEqual(await response.json(),{error:status===401?'sesion_necesaria':'operacion_rechazada'});
});

const bridge=fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js',import.meta.url),'utf8');
function browser({resourceStatus=403,resourceError='operacion_rechazada',authStatus=200}={}){
  let erased=0;const destinations=[];
  const context=vm.createContext({window:{addEventListener(){}},document:{addEventListener(){},documentElement:{replaceChildren(){erased++;}}},
    location:{hash:'',pathname:'/',search:'',assign:value=>destinations.push(value),replace:value=>destinations.push(value)},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},setInterval(){},URLSearchParams,
    fetch:async path=>path.endsWith('/sesion')?{ok:authStatus===200,status:authStatus,json:async()=>({autenticada:true,usuario:{id:UID}})}:
      {ok:false,status:resourceStatus,json:async()=>({error:resourceError})}});
  vm.runInContext(bridge,context);return {api:context.window.RWADAR_ACCESO,destinations,erased:()=>erased};
}
test('403 de operación privada no borra identidad ni redirige',async()=>{
  const e=browser();await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(e.api.datos('/perfiles?select=avisos_correo'),error=>error.status===403);
  assert.equal(e.api.usuario().id,UID);assert.equal(e.erased(),0);assert.deepEqual(e.destinations,[]);
});
test('401 real del recurso o marcador Auth explícito sigue retirando acceso privado',async()=>{
  for(const options of [{resourceStatus:401,resourceError:'sesion_necesaria'},{resourceStatus:403,resourceError:'sesion_necesaria'}]){
    const e=browser(options);await new Promise(resolve=>setImmediate(resolve));
    await assert.rejects(e.api.datos('/mi_perfil?select=*'));
    assert.equal(e.api.usuario(),null);assert.ok(e.erased()>0);assert.ok(e.destinations.some(d=>d.startsWith('/acceso?volver=')));
  }
});
test('401 en verificación Auth tampoco permite llegar al recurso',async()=>{
  const e=browser({authStatus:401});await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(e.api.datos('/mi_perfil?select=*'));
  assert.equal(e.api.usuario(),null);assert.ok(e.destinations.some(d=>d.startsWith('/acceso?volver=')));
});
