/* =====================================================================
   RWAdar · pruebas de cuentas, vigilancia y avisos por correo
   ---------------------------------------------------------------------
   Levanta un Postgres embebido, aplica el esquema entero y comprueba lo
   que de verdad importa de una cuenta: que el perfil nace solo, que
   vigilar encola el aviso a quien tocaba y a nadie más, que apagar los
   avisos los apaga de verdad, y que borrar la cuenta no deja rastro.

       npm install && node probar-cuentas.mjs
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = await new PGlite();
const n = async (s, p = []) => (await db.query(s, p)).rows;
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);

/* Lo que pone Supabase y aquí no existe: el esquema auth y auth.uid() */
await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _sesion(uid uuid);
  /* security definer: si no, el rol authenticated no puede leer la tabla
     que finge la sesión y falla antes de llegar a evaluar la política */
  create function auth.uid() returns uuid language sql stable security definer
    as $$ select uid from _sesion limit 1 $$;`);

for (const f of ['01_schema.sql', '02_seed.sql', '03_app.sql', '04_rls.sql', '07_cuentas.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema entero se aplica sin error.\n');

/* --- alta de dos personas --------------------------------------- */
const [ana] = await n(`insert into auth.users (email) values ('ana@ejemplo.com') returning id`);
const [luis] = await n(`insert into auth.users (email) values ('luis@ejemplo.com') returning id`);
paso('el perfil se crea solo al registrarse', (await n('select count(*)::int c from perfiles'))[0].c === 2);

/* --- vigilancia --------------------------------------------------- */
const [lofty] = await n(`select id from plataformas where slug='lofty'`);
const [addx] = await n(`select id from plataformas where slug='addx'`);
await n(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [ana.id, lofty.id]);
await n(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [luis.id, addx.id]);
paso('cada cual vigila lo suyo', (await n('select count(*)::int c from vigilancia'))[0].c === 2);

try { await db.query(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [ana.id, lofty.id]); paso('NO rechaza vigilar dos veces lo mismo', false); }
catch { paso('rechaza vigilar dos veces la misma plataforma', true); }

/* --- el aviso: Lofty cae del radar -------------------------------- */
await n(`update plataformas set estado='descartada',
   etiqueta_descarte='Crisis', motivo_descarte=$1,
   categoria_slug=null,region_slug=null,actor=null,acceso=null,ticket=null,web=null,aval=null,nota=null
   where id=$2`, ['Suspende los repartos de renta tras una revision regulatoria en curso.', lofty.id]);

const av = await n('select * from avisos_correo');
paso('encola 1 aviso, solo para quien vigilaba', av.length === 1);
paso('el aviso es de Ana, no de Luis', av[0]?.usuario_id === ana.id);

const pend = await n('select * from avisos_correo_pendientes');
paso('la vista trae el correo de destino', pend[0]?.email === 'ana@ejemplo.com');
paso('la vista trae el titular ya montado', pend[0]?.titular === 'Lofty sale del radar');
paso('la vista trae la plataforma', pend[0]?.plataforma === 'Lofty');
paso('sin nombre puesto, usa la parte del correo', pend[0]?.nombre === 'ana');

/* --- quien apaga los avisos, no recibe ---------------------------- */
await n(`update perfiles set avisos_correo=false where id=$1`, [luis.id]);
await n(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [luis.id, addx.id === lofty.id ? addx.id : addx.id]).catch(() => {});
const [midas] = await n(`select id from plataformas where slug='midas'`);
await n(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [ana.id, midas.id]);
await n(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [luis.id, midas.id]);
await n(`update plataformas set estado='descartada',
   etiqueta_descarte='Crisis', motivo_descarte=$1,
   categoria_slug=null,region_slug=null,actor=null,acceso=null,ticket=null,web=null,aval=null,nota=null
   where id=$2`, ['Cierre anunciado por la propia plataforma tras una votacion publica.', midas.id]);
const tras = await n('select usuario_id from avisos_correo where cambio_id=(select max(id) from cambios_estado)');
paso('quien apagó los avisos no recibe ninguno', tras.length === 1 && tras[0].usuario_id === ana.id);

/* --- seguridad por fila ------------------------------------------- */
await db.exec(`insert into _sesion (uid) values ('${ana.id}')`);
await db.exec(`set role authenticated`);
const veAna = await n('select count(*)::int c from vigilancia');
paso('con RLS, Ana solo ve su vigilancia', veAna[0].c === 2);
const veTodo = await n('select count(*)::int c from perfiles');
paso('con RLS, Ana solo ve su perfil', veTodo[0].c === 1);
try { await db.query(`insert into vigilancia (usuario_id,plataforma_id) values ($1,$2)`, [luis.id, addx.id]); paso('NO impide escribir en nombre de otro', false); }
catch { paso('impide vigilar en nombre de otra persona', true); }
await db.exec(`reset role`);

/* --- borrar la cuenta borra todo ---------------------------------- */
await n(`delete from auth.users where id=$1`, [ana.id]);
const restos = {
  perfiles: (await n(`select count(*)::int c from perfiles where id=$1`, [ana.id]))[0].c,
  vigilancia: (await n(`select count(*)::int c from vigilancia where usuario_id=$1`, [ana.id]))[0].c,
  avisos: (await n(`select count(*)::int c from avisos_correo where usuario_id=$1`, [ana.id]))[0].c,
};
paso('borrar la cuenta no deja perfil, ni vigilancia, ni avisos',
  restos.perfiles === 0 && restos.vigilancia === 0 && restos.avisos === 0);

/* --- el registro público, tras los dos descartes que hace la prueba -
   La prueba tira a Lofty y a Midas del radar para disparar los avisos,
   así que aquí NO deben quedar 24: deben quedar 22. Y las dos que ha
   descartado van sin fuente a propósito, porque lo que se comprueba es
   que el guardián editorial las caza. Si esto diera cero, sería que el
   invariante no vigila nada. */
paso('el radar baja a 22 tras los dos descartes de la prueba',
  (await n('select count(*)::int c from radar_publico'))[0].c === 22);
paso('el guardián detecta las 2 descartadas sin fuente que crea la prueba',
  (await n('select count(*)::int c from descartadas_sin_fuente'))[0].c === 2);
paso('las 4 descartadas reales conservan sus 10 fuentes',
  (await n('select count(*)::int c from fuentes'))[0].c === 10);

console.log('=== PRUEBAS DE CUENTAS ===');
ok.forEach(t => console.log('  OK   ', t));
fail.forEach(t => console.log('  FALLO', t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);
