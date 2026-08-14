/* =====================================================================
   RWAdar · pruebas de 16_reparacion.sql
   ---------------------------------------------------------------------
   Esta migración se aplica a producción y toca dos cosas delicadas: la
   función que modera y el proceso que manda los correos. Antes de eso
   hay que verla funcionando, y aquí se ve.

       node probar-reparacion.mjs

   Lo que hace distinto a las otras pruebas: **reproduce el estado roto
   de producción antes de reparar**. No basta con comprobar que la
   función nueva funciona en una base limpia; hay que comprobar que
   funciona encima de la vieja, que es donde va a caer de verdad.

   El fichero se aplica VERBATIM salvo dos líneas: `create extension
   pg_net` y `pg_cron`, que un Postgres embebido no tiene. En su lugar
   se montan tres dobles —net, vault y cron— con la misma forma que los
   de Supabase, así que el resto del SQL corre sin tocar una coma. El
   doble de `net` es además lo que permite probar lo que de verdad
   importa: que un aviso solo se marca como enviado cuando el proveedor
   contesta 2xx, y que lo que falla vuelve a la cola.
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = await new PGlite();
const n = async (s, p = []) => (await db.query(s, p)).rows;
const uno = async (s, p = []) => (await n(s, p))[0];
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);
const rechaza = async (s, p, etiqueta) => {
  try { await db.query(s, p); fail.push('NO rechaza: ' + etiqueta); }
  catch { ok.push('rechaza ' + etiqueta); }
};
const como = async (uid) => {
  await db.exec('delete from _s');
  await db.exec(`insert into _s (uid) values ('${uid}')`);
};

/* --- el andamio de siempre ------------------------------------------ */
await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _s(uid uuid);
  create function auth.uid() returns uuid language sql stable security definer as $$ select uid from _s limit 1 $$;`);

/* --- los tres dobles ------------------------------------------------- */
/* `net.http_post` de verdad es asíncrono: devuelve un identificador al
   momento y la respuesta aparece después en `net._http_response`. El
   doble hace exactamente eso —guarda la petición y NO responde— para
   que la prueba pueda decidir cuándo contesta el proveedor y con qué. */
await db.exec(`
  create schema net;
  create table net._peticiones(
    id bigint generated always as identity primary key,
    url text, headers jsonb, body jsonb, creado_el timestamptz default now());
  create table net._http_response(
    id bigint primary key, status_code int, content text, error_msg text);
  create function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}')
    returns bigint language sql as $$
      insert into net._peticiones(url, headers, body) values (url, headers, body) returning id $$;

  create schema vault;
  create table vault.decrypted_secrets(name text primary key, decrypted_secret text);

  create schema cron;
  create table cron.job(jobid bigint generated always as identity primary key,
                        jobname text, schedule text, command text);
  create function cron.schedule(jobname text, schedule text, command text)
    returns bigint language sql as $$
      insert into cron.job(jobname, schedule, command) values (jobname, schedule, command)
      returning jobid $$;
  create function cron.unschedule(jobname text) returns boolean language sql as $$
      delete from cron.job where jobname = $1 returning true $$;
`);

for (const f of ['01_schema.sql','02_seed.sql','03_app.sql','04_rls.sql','07_cuentas.sql',
                 '08_perfil.sql','09_opiniones.sql','10_moderacion.sql','11_fuga_cola.sql',
                 '12_borrado_moderador.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema previo (01→12) se aplica sin error.\n');

/* =====================================================================
   1 · Reproducir producción: la moderación rota
   =====================================================================
   En producción quedó una `moderar()` que pide un id de opinión que no
   existe —la tabla tiene clave compuesta— y la pantalla fallaba. Se
   deja igual aquí: se quita la buena y se pone la rota. */
await db.exec(`
  drop function if exists moderar(uuid, uuid, text, text);
  create function moderar(p_accion text, p_motivo text, p_opinion_id uuid)
    returns void language plpgsql security definer set search_path = public as $$
    begin
      update opiniones set estado = 'oculta' where usuario_id = p_opinion_id;
      if not found then raise exception 'esa opinion no existe'; end if;
    end $$;
`);

/* Y lo otro que le pasa a producción, medido con probar-produccion.mjs:
   al rol `authenticated` le faltan los permisos de tabla, así que
   opinar devuelve 403 · 42501 antes siquiera de mirar las políticas. */
await db.exec(`revoke all on opiniones from authenticated;
               revoke all on denuncias from authenticated;`);

const [jefe] = await n(`insert into auth.users (email) values ('jefe@x.com') returning id`);
const [ana]  = await n(`insert into auth.users (email) values ('ana@x.com') returning id`);
const [luis] = await n(`insert into auth.users (email) values ('luis@x.com') returning id`);
await n(`update perfiles set es_admin = true where id = $1`, [jefe.id]);
await n(`update perfiles set nombre = 'Ana' where id = $1`, [ana.id]);
const reental = await uno(`select id, nombre from plataformas where slug = 'reental'`);
await n(`insert into opiniones (usuario_id,plataforma_id,nota,texto) values ($1,$2,3,$3)`,
  [ana.id, reental.id, 'Una opinion critica pero legitima sobre esta plataforma concreta.']);

console.log('=== ANTES DE REPARAR (el estado de producción) ===');
await como(jefe.id);
await rechaza(`select moderar(p_usuario => $1, p_plataforma => $2, p_accion => 'ocultar', p_motivo => 'x')`,
  [ana.id, reental.id], 'la llamada que hace la web (queda demostrado el fallo)');

const permiso = async (tabla, priv) => (await uno(
  `select has_table_privilege('authenticated', $1, $2) x`, [tabla, priv])).x;
paso('antes de reparar, opinar está prohibido (el 403 de producción)',
  (await permiso('opiniones', 'insert')) === false);

/* =====================================================================
   2 · Aplicar la reparación, tal cual está en el fichero
   ===================================================================== */
const bruto = fs.readFileSync('db/16_reparacion.sql', 'utf8');
const quitadas = (bruto.match(/^create extension if not exists (pg_net|pg_cron);$/gm) || []).length;
const sql = bruto.replace(/^create extension if not exists (pg_net|pg_cron);$/gm, '-- (doble local)');
await db.exec(sql);
console.log(`\n16_reparacion.sql aplicado entero (${quitadas} líneas de extensión sustituidas por dobles).`);
await db.exec(sql);
console.log('Y aplicado dos veces sin error: es idempotente.\n');

/* =====================================================================
   3 · La moderación, reparada
   ===================================================================== */
console.log('=== MODERACIÓN ===');
paso('la firma vieja sigue existiendo (no se borra a ciegas)',
  (await uno(`select count(*)::int c from pg_proc where proname='moderar'`)).c === 2);

await como(luis.id);
await db.exec('set role authenticated');
await rechaza(`select moderar($1,$2,'ocultar','porque si')`, [ana.id, reental.id],
  'que un usuario normal oculte una opinión');
await db.exec('reset role');

await como(jefe.id);
await db.exec('set role authenticated');
await n(`select moderar($1,$2,'ocultar','difamatoria sin pruebas')`, [ana.id, reental.id]);
await db.exec('reset role');
paso('el administrador vuelve a poder ocultar',
  (await uno(`select estado from opiniones where usuario_id=$1`, [ana.id])).estado === 'oculta');
paso('y deja de verse en público',
  (await uno(`select count(*)::int c from opiniones_publicas`)).c === 0);
paso('la decisión queda firmada, fechada y con su motivo',
  (await uno(`select moderador_id, accion, motivo from moderacion`)).motivo === 'difamatoria sin pruebas');

await n(`insert into denuncias (denunciante_id,usuario_id,plataforma_id,motivo) values ($1,$2,$3,'no me gusta')`,
  [luis.id, ana.id, reental.id]);
await como(jefe.id); await db.exec('set role authenticated');
await n(`select moderar($1,$2,'restaurar','revisada, es legitima')`, [ana.id, reental.id]);
await db.exec('reset role');
const tras = await uno(`select estado, denuncias from opiniones where usuario_id=$1`, [ana.id]);
paso('restaurar la deja visible y a cero denuncias', tras.estado === 'visible' && tras.denuncias === 0);
paso('y borra las denuncias viejas', (await uno(`select count(*)::int c from denuncias`)).c === 0);

await como(jefe.id); await db.exec('set role authenticated');
await rechaza(`select moderar($1,$2,'borrar','x')`, [ana.id, reental.id], 'una acción que no existe');
await rechaza(`select moderar($1,$2,'ocultar','x')`, [luis.id, reental.id], 'moderar una opinión inexistente');
await db.exec('reset role');
paso('la moderación no toca el radar público',
  (await uno(`select count(*)::int c from radar_publico`)).c > 20);

/* =====================================================================
   4 · El envío de los avisos
   ===================================================================== */
console.log('\n=== ENVÍO DE AVISOS ===');
await db.exec('reset role'); await como(jefe.id);

/* Alguien que vigila una plataforma y quiere que le avisen. */
await n(`insert into vigilancia (usuario_id, plataforma_id) values ($1,$2)`, [ana.id, reental.id]);
const cambio = await uno(
  `insert into cambios_estado (plataforma_id, estado_anterior, estado_nuevo, titular, detalle)
   values ($1, 'en_radar', 'descartada', 'Reental sale del radar', 'El regulador retiró la licencia.')
   returning id`,
  [reental.id]);
paso('al cambiar el estado, la base encola el aviso sola',
  (await uno(`select count(*)::int c from avisos_correo where cambio_id=$1`, [cambio.id])).c === 1);

/* --- sin clave en el vault: silencio, no error --------------------- */
paso('sin clave configurada no manda nada y NO da error',
  (await uno(`select avisos_soltar() s`)).s === 0);
paso('y el aviso sigue en la cola, sin marcar',
  (await uno(`select count(*)::int c from avisos_correo where enviado_el is null`)).c === 1);

await n(`insert into vault.decrypted_secrets values ('BREVO_API_KEY','clave-de-prueba'),
                                                    ('RWADAR_REMITENTE','rwadar@protonmail.com')`);

/* --- paso uno: soltar ---------------------------------------------- */
paso('con la clave puesta, suelta el aviso', (await uno(`select avisos_soltar() s`)).s === 1);
const soltado = await uno(`select peticion_id, intentos, enviado_el from avisos_correo`);
paso('guarda el identificador de la petición y cuenta el intento',
  soltado.peticion_id !== null && soltado.intentos === 1);
paso('pero NO lo da por enviado todavía', soltado.enviado_el === null);

const pet = await uno(`select url, headers, body from net._peticiones where id=$1`, [soltado.peticion_id]);
paso('va a la API de Brevo con la clave del vault',
  pet.url === 'https://api.brevo.com/v3/smtp/email' && pet.headers['api-key'] === 'clave-de-prueba');
paso('el correo va al que vigilaba, y le llama por su nombre',
  pet.body.to[0].email === 'ana@x.com' && pet.body.to[0].name === 'Ana');
paso('el asunto es el titular del cambio', pet.body.subject === 'Reental sale del radar');
paso('el cuerpo dice qué plataforma vigilaba', pet.body.htmlContent.includes(reental.nombre));
paso('y lleva el aviso de que no es asesoramiento financiero',
  pet.body.htmlContent.includes('no es asesoramiento financiero'));

/* --- paso dos: confirmar -------------------------------------------- */
paso('mientras el proveedor no contesta, no se da por enviado',
  (await uno(`select avisos_confirmar() c`)).c === 0);
paso('y sigue sin marcar',
  (await uno(`select count(*)::int c from avisos_correo where enviado_el is null`)).c === 1);

await n(`insert into net._http_response values ($1, 202, '{"messageId":"ok"}', null)`, [soltado.peticion_id]);
paso('cuando contesta 202, ahí sí se marca como enviado',
  (await uno(`select avisos_confirmar() c`)).c === 1);
const enviado = await uno(`select enviado_el, error from avisos_correo`);
paso('queda con fecha de envío y sin error',
  enviado.enviado_el !== null && enviado.error === null);
paso('y ya no se vuelve a mandar', (await uno(`select avisos_soltar() s`)).s === 0);

/* --- lo que falla vuelve a la cola ---------------------------------- */
const cambio2 = await uno(
  `insert into cambios_estado (plataforma_id, estado_nuevo, titular)
   values ($1, 'en_radar', 'Reental vuelve al radar') returning id`,
  [reental.id]);
await uno(`select avisos_soltar() s`);
const enVuelo = await uno(`select id, peticion_id from avisos_correo where cambio_id=$1`, [cambio2.id]);
await n(`insert into net._http_response values ($1, 500, 'proveedor caido', null)`, [enVuelo.peticion_id]);
await uno(`select avisos_confirmar() c`);
const fallado = await uno(`select peticion_id, intentos, enviado_el, error from avisos_correo where id=$1`,
  [enVuelo.id]);
paso('un 500 NO se da por enviado', fallado.enviado_el === null);
paso('suelta la petición para poder reintentar', fallado.peticion_id === null);
paso('y deja escrito qué pasó', (fallado.error || '').includes('500'));
paso('la siguiente pasada lo reintenta', (await uno(`select avisos_soltar() s`)).s === 1);
paso('y va contando los intentos',
  (await uno(`select intentos from avisos_correo where id=$1`, [enVuelo.id])).intentos === 2);

await n(`update avisos_correo set intentos = 5, peticion_id = null where id = $1`, [enVuelo.id]);
paso('a los cinco intentos deja de insistir', (await uno(`select avisos_soltar() s`)).s === 0);

/* --- el reloj -------------------------------------------------------- */
const ciclo = await uno(`select avisos_ciclo() t`);
paso('el ciclo dice lo que ha hecho', /confirmados \d+, soltados \d+/.test(ciclo.t));
const reloj = await uno(`select schedule, command from cron.job where jobname='rwadar-avisos'`);
paso('el reloj queda puesto cada cinco minutos',
  reloj && reloj.schedule === '*/5 * * * *' && reloj.command.includes('avisos_ciclo'));
paso('y solo hay uno, aunque la migración se aplique dos veces',
  (await uno(`select count(*)::int c from cron.job where jobname='rwadar-avisos'`)).c === 1);

/* --- los permisos, devueltos ------------------------------------------ */
console.log('\n=== PERMISOS ===');
for (const [tabla, priv] of [['opiniones','select'], ['opiniones','insert'], ['opiniones','update'],
                             ['opiniones','delete'], ['denuncias','select'], ['denuncias','insert'],
                             ['opiniones_publicas','select'], ['nota_media','select'],
                             ['moderacion','select'], ['cola_moderacion','select'], ['mi_perfil','select']])
  paso(`authenticated recupera ${priv} sobre ${tabla}`, (await permiso(tabla, priv)) === true);
paso('y anon sigue sin poder escribir opiniones',
  (await uno(`select has_table_privilege('anon','opiniones','insert') x`)).x === false);

/* --- quién puede llamar a esto --------------------------------------- */
for (const f of ['avisos_soltar', 'avisos_confirmar', 'avisos_ciclo'])
  paso(`nadie desde fuera puede llamar a ${f}()`,
    (await uno(`select coalesce(has_function_privilege('authenticated', p.oid, 'execute'), false) x
                  from pg_proc p where p.proname = $1`, [f])).x === false);

/* --------------------------------------------------------------------- */
console.log('');
ok.forEach(t => console.log('  OK    ' + t));
fail.forEach(t => console.log('  FALLA ' + t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);
