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
function entornoBridge(fetch) {
  let borrados=0;const destinos=[],storage=new Map();
  const context=vm.createContext({window:{addEventListener(){}},document:{documentElement:{replaceChildren(){borrados++;}},addEventListener(){}},
    location:{hash:'',pathname:'/',replace:path=>destinos.push(path)},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    fetch,setInterval(){},URLSearchParams});
  vm.runInContext(bridge,context);return {bridge:context.window.RWADAR_ACCESO,destinos,storage,borrados:()=>borrados};
}
test('fallo de red en comprobación borra datos visibles y no conserva usuario anterior',async()=>{
  const e=entornoBridge(async()=>{throw new Error('offline');});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(e.bridge.usuario(),null);assert.ok(e.borrados()>0);assert.ok(e.destinos[0].startsWith('/acceso'));
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
