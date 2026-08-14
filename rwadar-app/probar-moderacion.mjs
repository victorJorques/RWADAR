/* =====================================================================
   RWAdar · pruebas de la moderación
   ---------------------------------------------------------------------
   Lo que hay que demostrar aquí es lo contrario de lo habitual: no que
   el administrador pueda, sino que **quien no lo es, no pueda**. Y que
   ninguna decisión se pueda tomar sin dejar rastro.

       node probar-moderacion.mjs
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = await new PGlite();
const n = async (s, p = []) => (await db.query(s, p)).rows;
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);
const rechaza = async (s, p, etiqueta) => {
  try { await db.query(s, p); fail.push('NO rechaza: ' + etiqueta); }
  catch { ok.push('rechaza ' + etiqueta); }
};
const como = async (uid) => { await db.exec('delete from _s'); await db.exec(`insert into _s (uid) values ('${uid}')`); };

await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _s(uid uuid);
  create function auth.uid() returns uuid language sql stable security definer as $$ select uid from _s limit 1 $$;`);

for (const f of ['01_schema.sql','02_seed.sql','03_app.sql','04_rls.sql',
                 '07_cuentas.sql','08_perfil.sql','09_opiniones.sql','10_moderacion.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema entero se aplica sin error.\n');
await db.exec(fs.readFileSync('db/10_moderacion.sql', 'utf8'));
console.log('10_moderacion.sql es idempotente.\n');

const [jefe] = await n(`insert into auth.users (email) values ('jefe@x.com') returning id`);
const [ana]  = await n(`insert into auth.users (email) values ('ana@x.com') returning id`);
const [luis] = await n(`insert into auth.users (email) values ('luis@x.com') returning id`);
const [eva]  = await n(`insert into auth.users (email) values ('eva@x.com') returning id`);
await n(`update perfiles set es_admin = true where id = $1`, [jefe.id]);
await n(`update perfiles set nombre='Ana' where id=$1`, [ana.id]);
const [reental] = await n(`select id from plataformas where slug='reental'`);

await n(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,3,$3)`,
  [ana.id, reental.id, 'Una opinion critica pero legitima sobre esta plataforma concreta.']);

/* --- quién es admin y quién no ------------------------------------- */
await como(jefe.id); paso('el administrador se reconoce', (await n('select es_admin() a'))[0].a === true);
await como(ana.id);  paso('quien no lo es, no',            (await n('select es_admin() a'))[0].a === false);

/* --- moderar sin ser admin ----------------------------------------- */
await db.exec('set role authenticated');
await rechaza(`select moderar($1,$2,'ocultar','porque si')`, [ana.id, reental.id],
  'que un usuario normal oculte una opinión');
await db.exec('reset role');

/* --- moderar siendo admin ------------------------------------------ */
await como(jefe.id);
await db.exec('set role authenticated');
await n(`select moderar($1,$2,'ocultar','difamatoria sin pruebas')`, [ana.id, reental.id]);
await db.exec('reset role');
paso('el administrador sí puede ocultar',
  (await n(`select estado from opiniones where usuario_id=$1`, [ana.id]))[0].estado === 'oculta');
paso('y deja de verse en público',
  (await n(`select count(*)::int c from opiniones_publicas`))[0].c === 0);

/* --- rastro --------------------------------------------------------- */
const reg = await n('select * from moderacion');
paso('la decisión queda firmada y fechada',
  reg.length === 1 && reg[0].moderador_id === jefe.id && reg[0].accion === 'ocultar'
  && reg[0].motivo === 'difamatoria sin pruebas');

/* --- restaurar limpia las denuncias --------------------------------- */
await n(`update opiniones set estado='visible' where usuario_id=$1`, [ana.id]);
for (const q of [luis, eva]) await n(
  `insert into denuncias (denunciante_id,usuario_id,plataforma_id,motivo) values ($1,$2,$3,'no me gusta')`,
  [q.id, ana.id, reental.id]);
paso('dos denuncias aún no la tumban',
  (await n(`select estado,denuncias from opiniones where usuario_id=$1`, [ana.id]))[0].denuncias === 2);

await como(jefe.id); await db.exec('set role authenticated');
await n(`select moderar($1,$2,'restaurar','revisada, es una queja legitima')`, [ana.id, reental.id]);
await db.exec('reset role');
const tras = (await n(`select estado,denuncias from opiniones where usuario_id=$1`, [ana.id]))[0];
paso('restaurar la deja visible y a cero denuncias', tras.estado === 'visible' && tras.denuncias === 0);
paso('y borra las denuncias viejas, para que no la vuelvan a tumbar',
  (await n(`select count(*)::int c from denuncias where usuario_id=$1`, [ana.id]))[0].c === 0);
paso('quedan las dos decisiones en el historial',
  (await n('select count(*)::int c from moderacion'))[0].c === 2);

/* --- la cola -------------------------------------------------------- */
await n(`insert into denuncias (denunciante_id,usuario_id,plataforma_id,motivo) values ($1,$2,$3,'insultos')`,
  [luis.id, ana.id, reental.id]);
const cola = await n('select * from cola_moderacion');
paso('la cola trae lo denunciado con sus motivos',
  cola.length === 1 && cola[0].autor === 'Ana' && cola[0].motivos.includes('insultos'));
paso('y no expone el correo de nadie', !JSON.stringify(cola).includes('@x.com'));

/* --- una acción imposible ------------------------------------------- */
await como(jefe.id); await db.exec('set role authenticated');
await rechaza(`select moderar($1,$2,'borrar','')`, [ana.id, reental.id], 'una acción que no existe');
await rechaza(`select moderar($1,$2,'ocultar','')`, [luis.id, reental.id], 'moderar una opinión inexistente');
await db.exec('reset role');

/* --- el registro editorial, aparte ---------------------------------- */
paso('la moderación no toca el radar público',
  (await n('select count(*)::int c from radar_publico'))[0].c === 24);

console.log('=== PRUEBAS DE MODERACIÓN ===');
ok.forEach(t => console.log('  OK   ', t));
fail.forEach(t => console.log('  FALLO', t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);
