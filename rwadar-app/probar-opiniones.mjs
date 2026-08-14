/* =====================================================================
   RWAdar · pruebas de las opiniones de usuarios
   ---------------------------------------------------------------------
   Lo que se comprueba no es que «funcione», sino que las tres reglas que
   sostienen el diseño se cumplan de verdad: una opinión por persona, el
   correo no sale nunca, y tres denuncias retiran la opinión sola.

       node probar-opiniones.mjs
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

await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _s(uid uuid);
  create function auth.uid() returns uuid language sql stable security definer as $$ select uid from _s limit 1 $$;`);

for (const f of ['01_schema.sql','02_seed.sql','03_app.sql','04_rls.sql','07_cuentas.sql','08_perfil.sql','09_opiniones.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema entero se aplica sin error.\n');

const [ana]  = await n(`insert into auth.users (email) values ('ana@x.com') returning id`);
const [luis] = await n(`insert into auth.users (email) values ('luis@x.com') returning id`);
const [eva]  = await n(`insert into auth.users (email) values ('eva@x.com') returning id`);
const [dani] = await n(`insert into auth.users (email) values ('dani@x.com') returning id`);
await n(`update perfiles set nombre='Ana' where id=$1`, [ana.id]);
const [reental] = await n(`select id from plataformas where slug='reental'`);
const [lofty]   = await n(`select id from plataformas where slug='lofty'`);

const opinar = (u, p, nota, texto) =>
  n(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,$3,$4)`, [u, p, nota, texto]);

/* --- reglas de contenido ------------------------------------------ */
await opinar(ana.id, reental.id, 8, 'Llevo un año con ellos y los repartos han llegado puntuales todos los meses.');
paso('se puede opinar', (await n('select count(*)::int c from opiniones'))[0].c === 1);

await rechaza(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,8,$3)`,
  [ana.id, reental.id, 'Otra opinion distinta sobre la misma plataforma, con texto largo.'],
  'dos opiniones de la misma persona sobre la misma plataforma');
await rechaza(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,11,$3)`,
  [luis.id, reental.id, 'Nota fuera de rango, deberia rechazarse por la restriccion.'], 'una nota de 11');
await rechaza(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,7,$3)`,
  [luis.id, reental.id, 'corto'], 'un texto de cinco caracteres');

/* --- el correo no sale nunca --------------------------------------- */
const pub = await n('select * from opiniones_publicas');
paso('la vista pública no expone el correo',
  !Object.keys(pub[0]).some(k => /email|correo/i.test(k)) && !JSON.stringify(pub[0]).includes('@x.com'));
paso('muestra el nombre de quien lo puso', pub[0].autor === 'Ana');

await opinar(luis.id, lofty.id, 4, 'Tuve problemas para sacar el dinero y tardaron semanas en contestarme.');
const anon = (await n(`select autor from opiniones_publicas where plataforma_id=$1`, [lofty.id]))[0];
paso('sin nombre puesto, firma como Anónimo, no con el correo', anon.autor === 'Anónimo');

/* --- la media --------------------------------------------------- */
let m = (await n(`select * from nota_media where plataforma_id=$1`, [reental.id]))[0];
paso('con 1 opinión NO se publica media', m.opiniones === 1 && m.media === null);
await opinar(luis.id, reental.id, 6, 'Correcto en general, aunque la web se queda colgada a veces al entrar.');
await opinar(eva.id, reental.id, 10, 'Muy buena experiencia, todo claro desde el principio y sin sorpresas.');
m = (await n(`select * from nota_media where plataforma_id=$1`, [reental.id]))[0];
paso('con 3 opiniones sí, y sale bien calculada', m.opiniones === 3 && Number(m.media) === 8);

/* --- denuncias ---------------------------------------------------- */
const den = (quien) => n(`insert into denuncias (denunciante_id,usuario_id,plataforma_id,motivo) values ($1,$2,$3,'falsa')`,
  [quien, luis.id, lofty.id]);
await den(ana.id);
paso('1 denuncia no retira nada',
  (await n(`select estado from opiniones where usuario_id=$1 and plataforma_id=$2`, [luis.id, lofty.id]))[0].estado === 'visible');
await den(eva.id); await den(dani.id);
const tras = (await n(`select estado,denuncias from opiniones where usuario_id=$1 and plataforma_id=$2`, [luis.id, lofty.id]))[0];
paso('3 denuncias la retiran sola', tras.estado === 'oculta' && tras.denuncias === 3);
paso('y deja de aparecer en la vista pública',
  (await n(`select count(*)::int c from opiniones_publicas where plataforma_id=$1`, [lofty.id]))[0].c === 0);
await rechaza(`insert into denuncias (denunciante_id,usuario_id,plataforma_id) values ($1,$2,$3)`,
  [ana.id, luis.id, lofty.id], 'denunciar dos veces lo mismo');

/* --- seguridad por fila ------------------------------------------- */
await db.exec(`insert into _s (uid) values ('${luis.id}')`);
await db.exec(`set role authenticated`);
paso('quien la escribió sí ve su opinión retirada',
  (await n(`select count(*)::int c from opiniones where plataforma_id=$1`, [lofty.id]))[0].c === 1);
/* Ojo con la forma de comprobarlo: RLS en un UPDATE no lanza error, filtra
   filas. El intento «funciona» y afecta a cero. Lo que hay que verificar es
   que la nota ajena siga intacta, no que salte una excepción. */
await n(`update opiniones set nota=1 where usuario_id=$1 and plataforma_id=$2`, [ana.id, reental.id]);
await db.exec(`reset role`);
paso('editar la opinión de otra persona no la cambia',
  (await n(`select nota from opiniones where usuario_id=$1 and plataforma_id=$2`, [ana.id, reental.id]))[0].nota === 8);

await db.exec(`insert into _s (uid) values ('${luis.id}')`);
await db.exec(`set role authenticated`);
await n(`delete from opiniones where usuario_id=$1 and plataforma_id=$2`, [ana.id, reental.id]);
await db.exec(`reset role`);
paso('borrar la opinión de otra persona tampoco',
  (await n(`select count(*)::int c from opiniones where usuario_id=$1 and plataforma_id=$2`, [ana.id, reental.id]))[0].c === 1);

/* --- borrar la cuenta se lleva las opiniones ----------------------- */
await n(`delete from auth.users where id=$1`, [ana.id]);
paso('borrar la cuenta borra sus opiniones',
  (await n(`select count(*)::int c from opiniones where usuario_id=$1`, [ana.id]))[0].c === 0);

/* --- el registro editorial sigue aparte ---------------------------- */
paso('las opiniones no tocan el radar público',
  (await n('select count(*)::int c from radar_publico'))[0].c === 24);

console.log('=== PRUEBAS DE OPINIONES ===');
ok.forEach(t => console.log('  OK   ', t));
fail.forEach(t => console.log('  FALLO', t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);
