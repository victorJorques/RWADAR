import {PGlite} from '@electric-sql/pglite';
import fs from 'fs';
const db=await new PGlite();
const ok=[],fail=[];
const paso=(n,c)=>c?ok.push(n):fail.push(n);
const n=async(s,p=[])=>(await db.query(s,p)).rows;
const rechaza=async(sql,etiqueta)=>{
  try{ await db.query(sql); fail.push('NO rechazo: '+etiqueta); }
  catch(e){ ok.push('rechaza '+etiqueta); }};

// Lo que Supabase aporta y aqui no existe
await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid());
  create role anon; create role authenticated; create role service_role;`);

await db.exec(fs.readFileSync('db/01_schema.sql','utf8'));
await db.exec(fs.readFileSync('db/02_seed.sql','utf8'));
await db.exec(fs.readFileSync('db/03_app.sql','utf8'));
await db.exec(fs.readFileSync('db/04_rls.sql','utf8'));
console.log('Los cuatro ficheros se aplican sin error.\n');

paso('24 en el radar',(await n("select count(*)::int c from plataformas where estado='en_radar'"))[0].c===24);
paso('4 descartadas',(await n("select count(*)::int c from plataformas where estado='descartada'"))[0].c===4);
paso('10 fuentes documentales',(await n('select count(*)::int c from fuentes'))[0].c===10);
/* La regla editorial que cierra el riesgo legal: ninguna empresa señalada
   por su nombre sin una fuente que lo respalde. */
paso('ninguna descartada sin fuente',(await n('select count(*)::int c from descartadas_sin_fuente'))[0].c===0);
paso('toda fuente apunta a una descartada',
  (await n("select count(*)::int c from fuentes f join plataformas p on p.id=f.plataforma_id where p.estado<>'descartada'"))[0].c===0);
paso('vista radar_publico devuelve 24',(await n('select count(*)::int c from radar_publico'))[0].c===24);
paso('RLS activo en plataformas',
  (await n("select relrowsecurity from pg_class where relname='plataformas'"))[0].relrowsecurity===true);
const pol=await n("select tablename, count(*)::int c from pg_policies group by tablename order by tablename");
paso('12 politicas de seguridad repartidas por tabla', pol.reduce((a,r)=>a+r.c,0)===12);
console.log('Politicas por tabla:', pol.map(r=>r.tablename+'='+r.c).join('  '));
console.log('');

// --- restricciones ---
await rechaza(`insert into plataformas (slug,nombre,estado) values ('x','X','en_radar')`,'radar sin datos obligatorios');
await rechaza(`insert into plataformas (slug,nombre,estado,etiqueta_descarte,motivo_descarte) values ('y','Y','descartada','C','corto')`,'motivo demasiado breve');
await rechaza(`insert into dispositivos (instalacion,sistema) values ('i1','windows')`,'sistema no soportado');

// --- FLUJO REAL: seguir una plataforma y recibir el aviso ---
await db.query(`insert into dispositivos (instalacion,token_push,sistema) values ('inst-abc','ExpoTok[123]','ios')`);
const realt=(await n("select id from plataformas where slug='realt'"))[0].id;
const lofty=(await n("select id from plataformas where slug='lofty'"))[0].id;
await db.query(`insert into seguimiento (instalacion,plataforma_id) values ('inst-abc',$1)`,[lofty]);
paso('el dispositivo sigue 1 plataforma',(await n("select count(*)::int c from seguimiento"))[0].c===1);

// Lofty cae del radar: el trigger debe registrarlo solo
await db.query(`update plataformas set estado='descartada',
  etiqueta_descarte='Crisis', motivo_descarte=$1,
  categoria_slug=null,region_slug=null,actor=null,acceso=null,ticket=null,web=null,aval=null,nota=null
  where id=$2`,['Suspende los repartos de renta tras una revision regulatoria en curso.',lofty]);
const camb=await n('select * from cambios_estado');
paso('el cambio de estado se registra solo',camb.length===1);
paso('el titular se genera correctamente',camb[0]?.titular==='Lofty sale del radar');
paso('guarda el estado anterior',camb[0]?.estado_anterior==='en_radar');

const avisos=await n('select * from avisos_pendientes');
paso('genera 1 aviso para quien la seguia',avisos.length===1);
paso('el aviso lleva el token del dispositivo',avisos[0]?.token_push==='ExpoTok[123]');
paso('el radar publico baja a 23',(await n('select count(*)::int c from radar_publico'))[0].c===23);

// Nadie sigue a RealT: no debe generar aviso
await db.query(`update plataformas set nombre=nombre where id=$1`,[realt]);
paso('no genera avisos de lo que nadie sigue',(await n('select count(*)::int c from avisos_pendientes'))[0].c===1);

console.log('=== PRUEBAS ===');
ok.forEach(t=>console.log('  OK   ',t));
fail.forEach(t=>console.log('  FALLO',t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length?1:0);
