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
