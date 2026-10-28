import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const modelo=fs.readFileSync(new URL('../rwadar-site/assets/cartera-modelo-20261028.js',import.meta.url),'utf8');
const adaptador=fs.readFileSync(new URL('../rwadar-site/assets/cartera-cuenta-20261028.js',import.meta.url),'utf8');
const uid='11111111-1111-4111-8111-111111111111',otro='22222222-2222-4222-8222-222222222222';
const pos={id:'manual',nombre:'Prueba',proveedor:'',ofertaSlug:'',moneda:'EUR',creadaEl:'2026-10-01',movimientos:[],valoracion:null};
function fixture({respuesta=async()=>Response.json({version:0,posiciones:[]}),vigente=()=>true}={}){
 let usuario=uid,cierre=false;const llamadas=[];
 const sandbox={window:{RWADAR_ACCESO:{usuario:()=>usuario?{id:usuario}:null,verificar:async()=>({id:usuario})}},
   sessionStorage:{getItem:()=>cierre?'si':null},fetch:async(url,op)=>{llamadas.push({url,op});return respuesta(url,op);},
   TextEncoder,TextDecoder,AbortController,Response,Headers,console,setTimeout,clearTimeout};
 vm.runInNewContext(modelo+'\n'+adaptador,sandbox);
 return {adapter:sandbox.window.RWAdarCarteraCuenta.paraUsuario(uid,{vigente}),llamadas,sandbox,cambiar(id){usuario=id;},cerrar(){cierre=true;}};
}
test('asset web es el motor canónico sin reglas económicas duplicadas',()=>{const canon=fs.readFileSync(new URL('../rwadar-movil/lib/cartera.js',import.meta.url),'utf8');assert.equal(modelo,"(function () { 'use strict'; const module={exports:{}};\n"+canon+'\nwindow.RWAdarCarteraModelo=module.exports; })();\n');});
test('adapter web GET privado usa identidad esperada y no guarda al cargar',async()=>{const f=fixture();const r=await f.adapter.cargar();assert.equal(r.version,0);assert.equal(r.posiciones.length,0);assert.equal(f.llamadas.length,1);assert.equal(f.llamadas[0].url,'/api/acceso/cartera');assert.equal(f.llamadas[0].op.headers['X-RWAdar-Usuario'],uid);assert.equal(f.llamadas[0].op.credentials,'same-origin');assert.equal(f.llamadas[0].op.method,'GET');});
test('adapter web POST guarda solo versión y posiciones canónicas',async()=>{const f=fixture({respuesta:async(_u,op)=>{const d=JSON.parse(op.body);return Response.json({...d,version:d.version+1});}});const r=await f.adapter.guardar([pos],3);assert.equal(r.version,4);assert.deepEqual(JSON.parse(f.llamadas[0].op.body),{version:3,posiciones:[pos]});});
test('adapter web conflicto409 conserva borrador sin retry',async()=>{const f=fixture({respuesta:async()=>Response.json({error:'cartera_conflicto'},{status:409})}),original=[structuredClone(pos)];await assert.rejects(f.adapter.guardar(original,3),e=>e.code==='cartera_conflicto'&&e.status===409);assert.deepEqual(original,[pos]);assert.equal(f.llamadas.length,1);});
test('adapter web fallo503 no devuelve cartera vacía',async()=>{const f=fixture({respuesta:async()=>Response.json({error:'cartera_no_disponible'},{status:503})});await assert.rejects(f.adapter.cargar(),e=>e.code==='cartera_no_disponible');assert.equal(f.llamadas.length,1);});
test('adapter web cambio UUID antes de guardar no envía',async()=>{const f=fixture();f.cambiar(otro);await assert.rejects(f.adapter.guardar([pos],0),e=>e.code==='cancelada');assert.equal(f.llamadas.length,0);});
test('adapter web cierre pendiente suprime toda petición',async()=>{const f=fixture();f.cerrar();await assert.rejects(f.adapter.cargar(),e=>e.code==='cancelada');assert.equal(f.llamadas.length,0);});
test('adapter web respuesta tardía al cambiar cuenta no adopta datos',async()=>{let finalizar;const f=fixture({respuesta:()=>new Promise(resolve=>{finalizar=resolve;})});const pendiente=f.adapter.cargar();await new Promise(resolve=>setImmediate(resolve));f.cambiar(otro);finalizar(Response.json({version:5,posiciones:[pos]}));await assert.rejects(pendiente,e=>e.code==='cancelada');});
test('adapter web generación de cuenta evita reusar A-B-A',async()=>{let valida=true;const f=fixture({vigente:()=>valida});valida=false;await assert.rejects(f.adapter.cargar(),e=>e.code==='cancelada');valida=true;await assert.rejects(f.adapter.cargar(),e=>e.code==='cancelada');assert.equal(f.llamadas.length,0);});
test('adapter web respuesta malformada no induce guardado',async()=>{const f=fixture({respuesta:async()=>Response.json({version:1,posiciones:[{...pos,moneda:'XXX'}]})});await assert.rejects(f.adapter.cargar());assert.equal(f.llamadas.length,1);});
test('adapter web AbortSignal y destruir impiden adopción',async()=>{const f=fixture(),abort=new AbortController();abort.abort();await assert.rejects(f.adapter.cargar({signal:abort.signal}),e=>e.code==='cancelada');assert.equal(f.llamadas.length,0);const g=fixture();g.adapter.destruir();await assert.rejects(g.adapter.cargar(),e=>e.code==='cancelada');assert.equal(g.llamadas.length,0);});
test('adapter web cancela lectura superior a2MiB',async()=>{const f=fixture({respuesta:async()=>new Response(' '.repeat(2*1024*1024+1))});await assert.rejects(f.adapter.cargar(),e=>e.code==='cartera_respuesta_invalida');});
test('adapter web permite leer revisión int32 final y bloquea overflow',async()=>{const f=fixture({respuesta:async()=>Response.json({version:2147483647,posiciones:[]})});assert.equal((await f.adapter.cargar()).version,2147483647);await assert.rejects(f.adapter.guardar([],2147483647),e=>e.code==='cartera_version_invalida');assert.equal(f.llamadas.length,1);});
