import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const web=fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js',import.meta.url),'utf8');
const favoritos=web.slice(web.indexOf('const Favoritos=(function(){'),web.indexOf('function botonGuardarOferta'))+'\nglobalThis.favoritos=Favoritos;';
test('favoritos web quedan separados por UUID sin importar la clave anónima anterior',()=>{
  const saved=new Map([['rwadar.favoritos.v1',JSON.stringify({ofertas:['anterior']})]]);
  let uid='11111111-1111-4111-8111-111111111111';const handlers={};
  const context=vm.createContext({window:{RWADAR_ACCESO:{usuario:()=>uid&&{id:uid}},addEventListener(){}},
    document:{addEventListener:(event,handler)=>{handlers[event]=handler;}},
    localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});
  vm.runInContext(favoritos,context);const f=context.favoritos;
  assert.equal(f.total(),0);f.alternar('ofertas','solo-a');
  uid='22222222-2222-4222-8222-222222222222';handlers['rwadar:sesion']();
  assert.equal(f.total(),0);f.alternar('ofertas','solo-b');
  uid='11111111-1111-4111-8111-111111111111';handlers['rwadar:sesion']();
  assert.equal(f.lista('ofertas').join(','),'solo-a');
  uid=null;handlers['rwadar:sesion']();assert.equal(f.total(),0);assert.equal(f.alternar('ofertas','nunca'),false);
});
const bridge=fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js',import.meta.url),'utf8');
test('Guardar como invitado pide cuenta sin cambiar favoritos ni afirmar un guardado',()=>{
  let click,entradas=0,guardados=0,avisos=0;
  const inicio=web.indexOf("if(typeof document!=='undefined'&&document.addEventListener&&typeof fetch!=='undefined')");
  const handler=web.slice(inicio,web.indexOf('/* favoritos-locales:fin */',inicio));
  const context=vm.createContext({window:{RWADAR_ACCESO:{usuario:()=>null,entrar:()=>{entradas++;}}},
    document:{addEventListener:(_,handler)=>{click=handler;}},fetch(){},
    Favoritos:{alternar(){guardados++;}},avisar(){avisos++;}});
  vm.runInContext(handler,context);
  click({target:{closest:()=>({dataset:{guardarOferta:'ejemplo'}})},preventDefault(){}});
  assert.equal(entradas,1);assert.equal(guardados,0);assert.equal(avisos,0);
});
function entornoBridge(fetch) {
  let borrados=0;const destinos=[],storage=new Map();
  const context=vm.createContext({window:{addEventListener(){}},document:{documentElement:{replaceChildren(){borrados++;}},addEventListener(){}},
    location:{hash:'',pathname:'/',search:'',replace:path=>destinos.push(path),assign:path=>destinos.push(path)},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    fetch,setInterval(){},URLSearchParams});
  vm.runInContext(bridge,context);return {bridge:context.window.RWADAR_ACCESO,destinos,storage,borrados:()=>borrados};
}
test('invitado con 401 o sin red conserva toda la lectura pública sin redirección',async()=>{
  for(const fetch of [async()=>({ok:false,status:401}),async()=>{throw new Error('offline');}]) {
    const e=entornoBridge(fetch);await new Promise(resolve=>setImmediate(resolve));
    assert.equal(e.bridge.usuario(),null);assert.equal(e.borrados(),0);assert.deepEqual(e.destinos,[]);
  }
});
test('la lectura pública omite credenciales aunque no haya cuenta',async()=>{
  const llamadas=[];
  const e=entornoBridge(async(path,opciones)=>{
    llamadas.push({path,opciones});return path.endsWith('/sesion')?{ok:false,status:401}:{ok:true,json:async()=>[{slug:'oferta'}]};
  });
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal((await e.bridge.catalogo('catalogo_ofertas_publicas_v2'))[0].slug,'oferta');
  assert.equal(llamadas.at(-1).opciones.credentials,'omit');assert.equal(e.borrados(),0);assert.deepEqual(e.destinos,[]);
});
test('gestionar datos como invitado pide cuenta y no inicia una escritura',async()=>{
  const llamadas=[];
  const e=entornoBridge(async path=>{llamadas.push(path);return {ok:false,status:401};});
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(e.bridge.datos('/vigilancia',{method:'POST',body:'{}'}));
  assert.ok(llamadas.every(path=>path==='/api/acceso/sesion'));
  assert.equal(e.borrados(),0);assert.ok(e.destinos[0].startsWith('/acceso?volver='));
});
test('sesión perdida u offline tras autenticación borra datos de cuenta y vuelve al catálogo',async()=>{
  let valido=true;
  const e=entornoBridge(async()=>{if(!valido)throw new Error('offline');return {ok:true,json:async()=>({autenticada:true,usuario:{id:'cuenta-a'}})};});
  await new Promise(resolve=>setImmediate(resolve));valido=false;
  await assert.rejects(e.bridge.verificar());assert.equal(e.bridge.usuario(),null);assert.ok(e.borrados()>0);
  assert.deepEqual(e.destinos,['/']);
});
test('logout sin confirmación del servidor deja cierre pendiente, borra UI y no lo declara cerrado',async()=>{
  const e=entornoBridge(async path=>({ok:path.endsWith('/sesion'),status:path.endsWith('/sesion')?200:503,
    async json(){return path.endsWith('/sesion')?{autenticada:true,usuario:{id:'cuenta-a'}}:{error:'sin_red'};}}));
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(e.bridge.salir());
  assert.equal(e.bridge.usuario(),null);assert.equal(e.storage.get('rwadar.cierre.pendiente'),'si');assert.ok(e.borrados()>0);
});
test('cambio de cuenta en otra pestaña borra la interfaz anterior antes de continuar',async()=>{
  let uid='cuenta-a';
  const e=entornoBridge(async()=>({ok:true,async json(){return {autenticada:true,usuario:{id:uid}};}}));
  await new Promise(resolve=>setImmediate(resolve));uid='cuenta-b';
  await assert.rejects(e.bridge.verificar());assert.equal(e.bridge.usuario(),null);assert.ok(e.borrados()>0);
});

test('regresion tutorial: datos null y undefined conservan GET privado', async () => {
  const llamadas=[];
  const e=entornoBridge(async(path,opciones)=>{
    llamadas.push({path,opciones});
    return {ok:true,json:async()=>path.endsWith('/sesion')
      ? {autenticada:true,usuario:{id:'cuenta-a'}} : [{id:'cuenta-a'}]};
  });
  await new Promise(resolve=>setImmediate(resolve));
  for (const opciones of [null,undefined]) {
    assert.equal((await e.bridge.datos('/mi_perfil?select=*',opciones))[0].id,'cuenta-a');
    const llamada=llamadas.at(-1);
    assert.equal(llamada.path,'/api/acceso/datos');
    assert.equal(llamada.opciones.credentials,'same-origin');
    assert.deepEqual(JSON.parse(llamada.opciones.body),{ruta:'/mi_perfil?select=*',metodo:'GET'});
  }
  assert.equal(llamadas.some(llamada=>llamada.path.endsWith('/salir')),false);
  assert.equal(e.bridge.usuario().id,'cuenta-a');
});

test('regresion tutorial: arranque Cuenta real conserva la sesion adoptada', async () => {
  const llamadas=[],nodos=new Map();
  function nodo(id) {
    if(!nodos.has(id))nodos.set(id,{addEventListener(){},setAttribute(){},removeAttribute(){},
      classList:{contains:()=>false,add(){},remove(){}}});
    return nodos.get(id);
  }
  const context=vm.createContext({window:{addEventListener(){}},
    document:{getElementById:nodo,addEventListener(){},documentElement:{replaceChildren(){throw new Error('No debe borrar una cuenta valida');}}},
    location:{hash:'',pathname:'/',search:'',replace(){throw new Error('No debe navegar al arrancar');},assign(){throw new Error('No debe pedir acceso');}},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    setInterval(){},URLSearchParams,SERVICIOS_USUARIO_DISPONIBLES:true,OPINIONES_DISPONIBLES:false,
    fetch:async(path,opciones)=>{
      llamadas.push({path,opciones});
      if(path.endsWith('/sesion'))return {ok:true,json:async()=>({autenticada:true,usuario:{id:'cuenta-a',correo:'qa@ejemplo.test',correoConfirmadoEl:'2026-10-27T00:00:00Z'}})};
      if(path.endsWith('/salir'))return {ok:true,json:async()=>({cerrado:true})};
      assert.equal(path,'/api/acceso/datos');
      const {ruta,metodo}=JSON.parse(opciones.body);assert.equal(metodo,'GET');
      const datos=ruta.startsWith('/mi_perfil?')?[{id:'cuenta-a',nombre:'Prueba local'}]:[];
      return {ok:true,json:async()=>datos};
    }});
  vm.runInContext(bridge,context);
  const consentimiento=web.slice(web.indexOf("const VERSION_CONSENTIMIENTO_CORREO="),web.indexOf('/* correo-consentimiento:fin */'));
  const cuenta=web.slice(web.indexOf('const Cuenta = (function(){'),web.indexOf('/* comunidad:inicio */'));
  vm.runInContext(consentimiento+'\n'+cuenta+'\nglobalThis.cuentaPrueba=Cuenta;',context);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(context.cuentaPrueba.hay(),true);
  assert.equal(context.window.RWADAR_ACCESO.usuario().id,'cuenta-a');
  assert.equal(llamadas.some(llamada=>llamada.path.endsWith('/salir')),false);
  const lecturas=llamadas.filter(llamada=>llamada.path==='/api/acceso/datos').map(llamada=>JSON.parse(llamada.opciones.body).ruta);
  assert.ok(lecturas.includes('/mi_perfil?select=*'));
  assert.ok(lecturas.includes('/vigilancia?select=plataforma_id,plataformas(nombre)'));
});

test('regresion tutorial: datos null con 401 borra la cuenta y mantiene el rechazo', async () => {
  const llamadas=[];
  const e=entornoBridge(async(path,opciones)=>{
    llamadas.push({path,opciones});
    if(path.endsWith('/sesion'))return {ok:true,json:async()=>({autenticada:true,usuario:{id:'cuenta-a'}})};
    return {ok:false,status:401,json:async()=>({error:'sesion_necesaria'})};
  });
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(e.bridge.datos('/mi_perfil?select=*',null),error=>error.status===401);
  assert.equal(e.bridge.usuario(),null);assert.ok(e.borrados()>0);
  assert.ok(e.destinos.includes('/'));assert.ok(e.destinos.some(path=>path.startsWith('/acceso?volver=')));
  assert.equal(llamadas.some(llamada=>llamada.path.endsWith('/salir')),false);
});
