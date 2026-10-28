import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAccesoServidor } from './servidor.mjs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {construirWorker}=require('./compilar.cjs');
const uid='11111111-1111-4111-8111-111111111111',otro='22222222-2222-4222-8222-222222222222',token='aaaa.bbbb.cccc';
const pos={id:'manual',nombre:'Prueba',proveedor:'',ofertaSlug:'',moneda:'EUR',creadaEl:'2026-10-01',movimientos:[],valoracion:null};
const env={SUPABASE_URL:'https://exgpmjpaaebyoolpwced.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
function fixture({rows=[],rpc=(d)=>({version:d.p_version+1,posiciones:d.p_documento.posiciones}),confirmado=true,user=uid}={}){
 const llamadas=[];
 const api=crearAccesoServidor({fetchImpl:async(url,op)=>{llamadas.push({url,op});
 if(url.endsWith('/auth/v1/user'))return Response.json({id:user,email:'test@ejemplo.test',email_confirmed_at:confirmado?'2026-10-01T00:00:00Z':null,is_anonymous:false});
 if(url.includes('/rest/v1/mi_perfil'))return Response.json([{id:user}]);
 if(url.includes('/rest/v1/mi_cartera'))return Response.json(rows);
 if(url.endsWith('/rest/v1/rpc/guardar_mi_cartera')){const salida=rpc(JSON.parse(op.body));return salida instanceof Response?salida:Response.json(salida);}
 throw Error('Ruta inesperada '+url);
 }});
 return {api,llamadas};
}
function request(method='GET',data,headers={},path='/api/acceso/cartera'){
 return new Request('https://rwadar.pages.dev'+path,{method,headers:{Cookie:'__Host-rwadar-acceso='+token,'X-RWAdar-Usuario':uid,...(method==='POST'?{'Origin':'https://rwadar.pages.dev','Content-Type':'application/json'}:{}),...headers},...(data===undefined?{}:{body:typeof data==='string'?data:JSON.stringify(data)})});
}
const atender=(f,r)=>f.api.atender({request:r,env,next:()=>{throw Error('no assets');}});
test('GET cartera valida Auth vigente y devuelve version0 sin escritura',async()=>{const f=fixture(),r=await atender(f,request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{posiciones:[],version:0});assert.equal(f.llamadas.length,3);assert.ok(f.llamadas.every(c=>c.op.headers.Authorization==='Bearer '+token));assert.match(r.headers.get('cache-control'),/private, no-store/);});
test('POST usa JWT usuario, versión esperada y documento motor v1',async()=>{const f=fixture();const r=await atender(f,request('POST',{posiciones:[pos],version:0}));assert.equal(r.status,200);assert.equal((await r.json()).version,1);const last=f.llamadas.at(-1);assert.match(last.url,/\/rpc\/guardar_mi_cartera$/);assert.deepEqual(JSON.parse(last.op.body),{p_documento:{version:1,posiciones:[pos]},p_version:0});assert.equal(last.op.headers.apikey,'sb_publishable_fixture');});
test('409 de RPC se conserva sin retry ni overwrite',async()=>{const f=fixture({rpc:()=>Response.json({code:'PT409'},{status:409})});const r=await atender(f,request('POST',{posiciones:[],version:4}));assert.equal(r.status,409);assert.deepEqual(await r.json(),{error:'cartera_conflicto'});assert.equal(f.llamadas.filter(c=>c.url.includes('/rpc/')).length,1);});
test('UUID esperado distinto impide tocar otra cuenta',async()=>{const f=fixture({user:otro});const r=await atender(f,request('POST',{posiciones:[],version:0}));assert.equal(r.status,409);assert.equal((await r.json()).error,'cuenta_cambiada');assert.equal(f.llamadas.length,2);});
test('sin header UUID no consulta Auth ni datos',async()=>{const f=fixture();const r=await atender(f,request('GET',undefined,{'X-RWAdar-Usuario':''}));assert.equal(r.status,400);assert.equal(f.llamadas.length,0);});
test('correo sin confirmar no lee ni escribe cartera',async()=>{const f=fixture({confirmado:false});const r=await atender(f,request());assert.equal(r.status,401);assert.equal(f.llamadas.length,1);});
for(const method of ['GET','POST'])test('cross-site rechazado '+method,async()=>{const f=fixture();const r=await atender(f,request(method,method==='POST'?{}:undefined,{'Sec-Fetch-Site':'cross-site'}));assert.equal(r.status,403);assert.equal(f.llamadas.length,0);});
test('POST origen distinto rechazado',async()=>{const f=fixture();assert.equal((await atender(f,request('POST',{}, {Origin:'https://otro.invalid'}))).status,403);assert.equal(f.llamadas.length,0);});
test('modelo canónico impide venta imposible sin escribir',async()=>{const f=fixture();const r=await atender(f,request('POST',{posiciones:[{...pos,movimientos:[{id:'x',fecha:'2026-10-01',tipo:'venta',cantidad:'1',precio:'1',comision:'0'}]}],version:0}));assert.equal(r.status,400);assert.equal(f.llamadas.length,2);});
test('GET registro corrupto falla sin vacío ni escritura',async()=>{const f=fixture({rows:[{version:1,documento:{version:2,posiciones:[]}}]});const r=await atender(f,request());assert.equal(r.status,502);assert.equal(f.llamadas.length,3);});
test('POST solo JSON sin campos adicionales',async()=>{for(const data of [{posiciones:[],version:-1},{posiciones:[],version:0,usuario_id:otro},[],null]){const f=fixture();assert.equal((await atender(f,request('POST',JSON.stringify(data)))).status,400);assert.equal(f.llamadas.length,2);}});
test('cuerpo cartera mayor de16KiB permitido solo tras motor, autenticación y validación',async()=>{const posiciones=Array.from({length:100},(_,i)=>({...pos,id:'p'+i,nombre:'a'.repeat(160),proveedor:'b'.repeat(120)}));const data={posiciones,version:0};assert.ok(JSON.stringify(data).length>16*1024);const f=fixture();assert.equal((await atender(f,request('POST',data))).status,200);});
test('límite Auth16KiB sigue aplicado al usar /datos',async()=>{const f=fixture();const r=await atender(f,request('POST',{ruta:'/mi_perfil',relleno:'x'.repeat(17000)},{},'/api/acceso/datos'));assert.equal(r.status,400);assert.equal(f.llamadas.length,0);});
test('cuerpo de cartera por encima2MiB rechazado sin RPC',async()=>{const f=fixture();const r=await atender(f,request('POST',' '.repeat(2*1024*1024+1)));assert.equal(r.status,413);assert.equal(f.llamadas.length,2);});
test('worker compilado contiene motor canónico y ruta cartera funcional',async()=>{const worker=(await import('data:text/javascript;base64,'+Buffer.from(construirWorker()).toString('base64'))).default;const r=await worker.fetch(request('GET',undefined,{'X-RWAdar-Usuario':''}),{ASSETS:{fetch(){throw Error('assets');}}},{waitUntil(){}});assert.equal(r.status,400);});
test('revisión int32 final se lee y guardado no desborda',async()=>{const f=fixture({rows:[{version:2147483647,documento:{version:1,posiciones:[pos]}}]});assert.equal((await atender(f,request())).status,200);const g=fixture();assert.equal((await atender(g,request('POST',{version:2147483647,posiciones:[]}))).status,400);assert.equal(g.llamadas.length,2);});
