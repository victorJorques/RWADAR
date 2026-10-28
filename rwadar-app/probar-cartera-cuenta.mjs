// SQL literal sobre Postgres embebido, sin red ni datos reales. Solo Auth y
// claims son infraestructura sintética; el helper de sesión es el SQL vigente.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { PGlite } = require('@electric-sql/pglite');
const raiz = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(raiz,'db/29_cartera_cuenta.sql'),'utf8');
const repo = process.env.RWADAR_PRUEBAS_RAIZ || path.resolve(raiz,'..');
const anterior = fs.readFileSync(path.join(repo,'rwadar-app/supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql'),'utf8');
const helper = anterior.match(/create or replace function rwadar_cuentas_privadas\.sesion_confirmada\(\)[\s\S]*?\$\$;/)?.[0];
assert.ok(helper);
const ANA='11111111-1111-4111-8111-111111111111', LUIS='22222222-2222-4222-8222-222222222222';
const PEND='33333333-3333-4333-8333-333333333333', ANON='44444444-4444-4444-8444-444444444444';
const SA='10000000-0000-4000-8000-000000000001', SL='20000000-0000-4000-8000-000000000001';
const SP='30000000-0000-4000-8000-000000000001', SN='40000000-0000-4000-8000-000000000001';
const db=await PGlite.create(); let pasadas=0;
const paso=(titulo)=>{pasadas++;console.log('OK '+titulo);};
const doc={version:1,posiciones:[{id:'posicion-local',nombre:'Registro de prueba',proveedor:'Manual',ofertaSlug:'',moneda:'EUR',creadaEl:'2026-10-01',movimientos:[],valoracion:null}]};
const root=()=>db.exec('reset role');
const jwt=async(uid,sid,extra={},rol='authenticated')=>{await root();await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:uid,role:'authenticated',session_id:sid,exp:Math.floor(Date.now()/1000)+3600,is_anonymous:false,...extra})]);await db.exec('set role '+rol);};
const guardar=(documento,version)=>db.query('select public.guardar_mi_cartera($1::jsonb,$2::integer) dato',[JSON.stringify(documento),version]);
const leer=()=>db.query('select * from public.mi_cartera');
const rechaza=async(tarea,code)=>{await assert.rejects(tarea,e=>e.code===code);};
try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key,email_confirmed_at timestamptz,is_anonymous boolean);
   create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
   grant usage on schema auth to authenticated,anon; grant execute on function auth.jwt(),auth.uid() to authenticated,anon;
   create view public.mi_perfil as select auth.uid() id; grant select on public.mi_perfil to authenticated;
   create schema rwadar_cuentas_privadas;
   revoke all on auth.users,auth.sessions from public,anon,authenticated;`);
 await db.exec(helper);
 await db.exec('revoke all on function rwadar_cuentas_privadas.sesion_confirmada() from public,anon; grant execute on function rwadar_cuentas_privadas.sesion_confirmada() to authenticated;');
 for(const [uid,sid,confirmada,anonimo] of [[ANA,SA,true,false],[LUIS,SL,true,false],[PEND,SP,false,false],[ANON,SN,true,true]]){
   await db.query('insert into auth.users values($1,$2,$3)',[uid,confirmada?'2026-10-01T00:00:00Z':null,anonimo]);
   await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
 }
 // Instalación con permisos por defecto amplios: el SQL debe revocarlos.
 await db.exec('alter default privileges grant all on tables to anon,authenticated');
 await db.exec(sql);await db.exec(sql);paso('SQL literal idempotente');
 await jwt(ANA,SA);
 assert.deepEqual((await leer()).rows,[]);paso('sin documento no crea fila al consultar');
 await rechaza(()=>guardar(doc,2),'PT409');paso('versión no cero no crea documento');
 assert.equal((await guardar(doc,0)).rows[0].dato.version,1);paso('primera escritura exige versión cero');
 await rechaza(()=>guardar({...doc,posiciones:[]},0),'PT409');paso('segundo dispositivo con versión cero recibe conflicto');
 assert.equal((await guardar(doc,1)).rows[0].dato.version,2);paso('CAS incrementa exactamente una versión');
 await rechaza(()=>guardar({...doc,posiciones:[]},1),'PT409');
 assert.equal((await leer()).rows[0].version,2);assert.equal((await leer()).rows[0].documento.posiciones.length,1);paso('conflicto no sobrescribe datos anteriores');
 await jwt(LUIS,SL);assert.deepEqual((await leer()).rows,[]);
 await guardar({...doc,posiciones:[{...doc.posiciones[0],id:'luis'}]},0);paso('Luis guarda registro independiente');
 assert.equal((await db.query('update rwadar_cuentas_privadas.carteras set version=100 where usuario_id=$1',[ANA])).affectedRows,0);paso('RLS no actualiza documento ajeno');
 await rechaza(()=>db.query('insert into rwadar_cuentas_privadas.carteras(usuario_id,version,documento) values($1,1,$2)',[PEND,JSON.stringify(doc)]),'42501');paso('no inserta documento a nombre de otro');
 await rechaza(()=>db.query('delete from rwadar_cuentas_privadas.carteras where usuario_id=$1',[ANA]),'42501');paso('sin permiso DELETE propio ni ajeno');
 await rechaza(()=>db.query('update rwadar_cuentas_privadas.carteras set usuario_id=$1 where usuario_id=$2',[ANA,LUIS]),'42501');paso('sin permiso de reasignación de propietario');
 for(const [uid,sid,extra,label] of [[PEND,SP,{},'correo sin confirmar'],[ANON,SN,{},'cuenta anónima'],[ANA,SL,{},'session_id ajeno'],[ANA,SA,{is_anonymous:true},'claim anónimo'],[ANA,SA,{exp:1},'JWT caducado']]){
   await jwt(uid,sid,extra);assert.deepEqual((await leer()).rows,[]);await rechaza(()=>guardar(doc,0),'42501');paso(label+' sin lectura ni escritura');
 }
 await jwt(ANA,SA,{},'anon');await rechaza(leer,'42501');await rechaza(()=>guardar(doc,0),'42501');paso('anon sin ACL directa ni RPC');
 await jwt(ANA,SA);
 for(const malo of [{version:2,posiciones:[]},{version:1,posiciones:Array(101).fill(doc.posiciones[0])},{version:1,posiciones:[{...doc.posiciones[0],extra:'x'}]},{version:1,posiciones:[{...doc.posiciones[0],id:'x'.repeat(2000001)}]}])await rechaza(()=>guardar(malo,2),'22023');paso('límites y forma rechazan registros inválidos antes del CAS');
 await root();await db.query('delete from auth.sessions where id=$1',[SA]);await jwt(ANA,SA);
 assert.deepEqual((await leer()).rows,[]);await rechaza(()=>guardar(doc,2),'42501');paso('JWT aún firmado no sirve tras salir y revocar sesión');
 await root();await db.exec(sql);
 assert.equal((await db.query('select count(*)::int n from rwadar_cuentas_privadas.carteras')).rows[0].n,2);paso('reaplicación conserva ambas carteras');
 await db.query('update rwadar_cuentas_privadas.carteras set version=2147483646 where usuario_id=$1',[LUIS]);
 await jwt(LUIS,SL);assert.equal((await guardar(doc,2147483646)).rows[0].dato.version,2147483647);
 await rechaza(()=>guardar(doc,2147483647),'22023');paso('última revisión int32 aceptada sin riesgo de overflow');await root();
 const acl=(await db.query(`select has_table_privilege('anon','rwadar_cuentas_privadas.carteras','SELECT') a,
 has_table_privilege('authenticated','auth.sessions','SELECT') s,
 (select prosecdef from pg_proc where oid='public.guardar_mi_cartera(jsonb,integer)'::regprocedure) d,
 (select reloptions from pg_class where oid='public.mi_cartera'::regclass) o`)).rows[0];
 assert.equal(acl.a,false);assert.equal(acl.s,false);assert.equal(acl.d,false);assert.ok(acl.o.includes('security_invoker=true'));paso('ACL mínimas, RPC invoker y vista invoker');
 await db.query('delete from auth.users where id=$1',[ANA]);
 const restantes=(await db.query('select usuario_id from rwadar_cuentas_privadas.carteras')).rows;
 assert.deepEqual(restantes,[{usuario_id:LUIS}]);paso('baja de cuenta borra solo su documento por cascada');
 // Regresión: la compra sin valoración no cubría la rama JSONB no nula.
 // Se recrea solo la identidad sintética ya borrada; no se toca ninguna cuenta real.
 await db.query('insert into auth.users values($1,$2,false)',[ANA,'2026-10-01T00:00:00Z']);
 await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[SA,ANA]);
 await jwt(ANA,SA);
 const modelo=require(path.join(repo,'rwadar-movil/lib/cartera.js')), hoy=modelo.fechaHoy();
 let posicion=modelo.crearPosicion({id:'regresion-valoracion',nombre:'Compra local',moneda:'EUR'},hoy);
 posicion=modelo.anadirMovimiento(posicion,{id:'compra',tipo:'compra',fecha:hoy,cantidad:'2',precio:'1',comision:'0'},hoy);
 const compra=JSON.parse(modelo.serializarCartera([posicion]));
 const valorada=JSON.parse(modelo.serializarCartera([modelo.fijarValoracion(posicion,{precio:'1.1',fecha:hoy},hoy)]));
 assert.equal((await guardar(compra,0)).rows[0].dato.version,1);paso('compra canónica2@1 con valoración nula aceptada');
 assert.equal((await guardar(valorada,1)).rows[0].dato.version,2);
 assert.deepEqual((await leer()).rows[0].documento,valorada);paso('valoración manual no nula1.1 aceptada y leída sin cambios');
 const extra=structuredClone(valorada);extra.posiciones[0].valoracion.extra='no permitido';
 await rechaza(()=>guardar(extra,2),'22023');paso('valoración con clave extra rechazada');
 const tipo=structuredClone(valorada);tipo.posiciones[0].valoracion.precio=1.1;
 await rechaza(()=>guardar(tipo,2),'22023');paso('precio numérico no canónico rechazado');
 const escalar=structuredClone(valorada);escalar.posiciones[0].valoracion='no válido';
 await rechaza(()=>guardar(escalar,2),'22023');
 assert.equal((await leer()).rows[0].version,2);assert.deepEqual((await leer()).rows[0].documento,valorada);
 paso('valoración escalar rechazada y fallos conservan documento y versión');
 assert.equal((await guardar(compra,2)).rows[0].dato.version,3);
 assert.equal((await leer()).rows[0].documento.posiciones[0].valoracion,null);paso('volver a valoración nula sigue admitido');
 console.log(`${pasadas} comprobaciones SQL correctas, sin red`);
} finally {await db.close();}
