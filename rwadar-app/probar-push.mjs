/* =====================================================================
   RWAdar · pruebas de 17_avisos_push.sql
   ---------------------------------------------------------------------
       node probar-push.mjs

   El envío de avisos push es la función que justifica que exista la app,
   así que no vale con que «parezca» que funciona. Aquí se comprueba
   entero contra un Postgres real, incluidos los tres casos que de
   verdad duelen:

     · Expo responde 200 y aun así el envío ha fallado — el estado real
       viene DENTRO del cuerpo, no en el código HTTP;
     · el móvil desinstaló la app (DeviceNotRegistered): hay que dejar de
       insistir y limpiar el token, o se reintenta eternamente;
     · un aviso a medio entregar no puede marcar el cambio como avisado.

   `pg_net` y `pg_cron` no existen en un Postgres embebido, así que se
   montan dobles con la misma forma que los de Supabase. El resto del
   fichero se aplica VERBATIM.
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const db = await new PGlite();
const n = async (s, p = []) => (await db.query(s, p)).rows;
const uno = async (s, p = []) => (await n(s, p))[0];
const ok = [], fail = [];
const paso = (t, c) => (c ? ok : fail).push(t);

await db.exec(`create schema auth;
  create table auth.users(id uuid primary key default gen_random_uuid(), email text unique);
  create role anon; create role authenticated; create role service_role;
  create table _s(uid uuid);
  create function auth.uid() returns uuid language sql stable security definer as $$ select uid from _s limit 1 $$;`);

/* Los dobles. `http_post` guarda la petición y NO responde: la respuesta
   la decide la prueba, que es justo lo que hace falta para comprobar el
   comportamiento asíncrono. */
await db.exec(`
  create schema net;
  create table net._peticiones(
    id bigint generated always as identity primary key,
    url text, headers jsonb, body jsonb);
  create table net._http_response(
    id bigint primary key, status_code int, content text, error_msg text);
  create function net.http_post(url text, headers jsonb default '{}', body jsonb default '{}')
    returns bigint language sql as $$
      insert into net._peticiones(url, headers, body) values (url, headers, body) returning id $$;

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

for (const f of ['01_schema.sql', '02_seed.sql', '03_app.sql', '04_rls.sql'])
  await db.exec(fs.readFileSync('db/' + f, 'utf8'));
console.log('El esquema base se aplica sin error.\n');

const bruto = fs.readFileSync('db/17_avisos_push.sql', 'utf8');
const sql = bruto.replace(/^create extension if not exists (pg_net|pg_cron);$/gm, '-- (doble local)');
await db.exec(sql);
await db.exec(sql);
console.log('17_avisos_push.sql aplicado dos veces sin error: es idempotente.\n');

/* --- dos móviles siguiendo la misma plataforma, y uno que no ---------- */
const pl = await uno(`select id, nombre, slug from plataformas where slug = 'reental'`);
const otra = await uno(`select id from plataformas where slug <> 'reental' limit 1`);

for (const [inst, token] of [['inst_ana', 'ExponentPushToken[ana]'], ['inst_luis', 'ExponentPushToken[luis]']])
  await n(`insert into dispositivos (instalacion, token_push, sistema) values ($1,$2,'android')`, [inst, token]);
/* Uno sin token: instaló la app pero no dio permiso de avisos. */
await n(`insert into dispositivos (instalacion, sistema) values ('inst_muda','ios')`);

for (const inst of ['inst_ana', 'inst_luis', 'inst_muda'])
  await n(`insert into seguimiento (instalacion, plataforma_id) values ($1,$2)`, [inst, pl.id]);

/* --- 1 · encolar solo ------------------------------------------------- */
console.log('=== ENCOLADO ===');
const cambio = await uno(
  `insert into cambios_estado (plataforma_id, estado_anterior, estado_nuevo, titular, detalle)
   values ($1,'en_radar','descartada','Reental sale del radar','El regulador retiró la licencia.')
   returning id`, [pl.id]);

paso('al cambiar el estado se encola un aviso por dispositivo con token',
  (await uno(`select count(*)::int c from avisos_push where cambio_id=$1`, [cambio.id])).c === 2);
paso('a quien no dio permiso de avisos no se le encola nada',
  (await uno(`select count(*)::int c from avisos_push where instalacion='inst_muda'`)).c === 0);

const otroCambio = await uno(
  `insert into cambios_estado (plataforma_id, estado_nuevo, titular)
   values ($1,'en_radar','Otra cosa') returning id`, [otra.id]);
paso('y no se avisa de una plataforma que nadie vigila',
  (await uno(`select count(*)::int c from avisos_push where cambio_id=$1`, [otroCambio.id])).c === 0);

/* --- 2 · soltar -------------------------------------------------------- */
console.log('\n=== ENVÍO ===');
paso('suelta los dos avisos', (await uno(`select push_soltar() s`)).s === 2);
const fila = await uno(`select * from avisos_push where instalacion='inst_ana'`);
paso('guarda el identificador de la petición y cuenta el intento',
  fila.peticion_id !== null && fila.intentos === 1);
paso('pero NO lo da por enviado todavía', fila.enviado_el === null);

const pet = await uno(`select url, body from net._peticiones where id=$1`, [fila.peticion_id]);
paso('va a la API de Expo', pet.url === 'https://exp.host/--/api/v2/push/send');
paso('al token de ese móvil y con el titular del cambio',
  pet.body.to === 'ExponentPushToken[ana]' && pet.body.title === 'Reental sale del radar');
paso('lleva el slug dentro, para poder abrir la ficha desde el aviso',
  pet.body.data.slug === pl.slug);
paso('y no se vuelve a soltar lo que ya está en vuelo',
  (await uno(`select push_soltar() s`)).s === 0);

/* --- 3 · Expo dice 200 pero ha fallado ---------------------------------- */
console.log('\n=== LO QUE DE VERDAD DUELE ===');
const luis = await uno(`select * from avisos_push where instalacion='inst_luis'`);
await n(`insert into net._http_response values ($1, 200, $2, null)`,
  [fila.peticion_id, '{"data":{"status":"ok","id":"abc"}}']);
await n(`insert into net._http_response values ($1, 200, $2, null)`,
  [luis.peticion_id, '{"data":{"status":"error","message":"no","details":{"error":"MessageTooBig"}}}']);

paso('con status ok se marca como enviado', (await uno(`select push_confirmar() c`)).c === 1);
paso('el que respondió 200 con error dentro NO se da por enviado',
  (await uno(`select enviado_el from avisos_push where id=$1`, [luis.id])).enviado_el === null);
paso('y vuelve a la cola con el motivo escrito',
  (await uno(`select peticion_id, error from avisos_push where id=$1`, [luis.id])).error === 'MessageTooBig');
paso('el cambio NO se marca como notificado con uno a medias',
  (await uno(`select notificado_el from cambios_estado where id=$1`, [cambio.id])).notificado_el === null);

/* --- 4 · el móvil que desinstaló la app --------------------------------- */
await uno(`select push_soltar() s`);
const reintento = await uno(`select peticion_id from avisos_push where id=$1`, [luis.id]);
await n(`insert into net._http_response values ($1, 200, $2, null)`,
  [reintento.peticion_id, '{"data":{"status":"error","details":{"error":"DeviceNotRegistered"}}}']);
await uno(`select push_confirmar() c`);

paso('si el móvil ya no existe, se deja de insistir',
  (await uno(`select intentos from avisos_push where id=$1`, [luis.id])).intentos === 5);
paso('y se le borra el token, para no encolarle nada más',
  (await uno(`select token_push from dispositivos where instalacion='inst_luis'`)).token_push === null);
paso('ahora sí, el cambio queda marcado como notificado',
  (await uno(`select notificado_el from cambios_estado where id=$1`, [cambio.id])).notificado_el !== null);
paso('y la vista de pendientes se queda vacía',
  (await uno(`select count(*)::int c from avisos_pendientes`)).c === 0);

const nuevo = await uno(
  `insert into cambios_estado (plataforma_id, estado_nuevo, titular)
   values ($1,'en_radar','Vuelve al radar') returning id`, [pl.id]);
paso('al móvil sin token no se le encola el aviso siguiente',
  (await uno(`select count(*)::int c from avisos_push where cambio_id=$1`, [nuevo.id])).c === 1);

/* --- 5 · el reloj y los permisos ---------------------------------------- */
console.log('\n=== RELOJ Y PERMISOS ===');
const reloj = await uno(`select schedule, command from cron.job where jobname='rwadar-push'`);
paso('el reloj queda puesto cada dos minutos',
  reloj && reloj.schedule === '*/2 * * * *' && reloj.command.includes('push_ciclo'));
paso('y solo hay uno aunque se aplique dos veces',
  (await uno(`select count(*)::int c from cron.job where jobname='rwadar-push'`)).c === 1);
paso('el ciclo dice lo que ha hecho',
  /confirmados \d+, soltados \d+/.test((await uno(`select push_ciclo() t`)).t));

for (const f of ['push_soltar', 'push_confirmar', 'push_ciclo'])
  paso(`nadie desde fuera puede llamar a ${f}()`,
    (await uno(`select coalesce(has_function_privilege('authenticated', p.oid, 'execute'), false) x
                  from pg_proc p where p.proname = $1`, [f])).x === false);
for (const rol of ['anon', 'authenticated'])
  paso(`${rol} no puede leer la cola de avisos`,
    (await uno(`select has_table_privilege($1,'avisos_push','select') x`, [rol])).x === false);

/* ------------------------------------------------------------------------ */
console.log('');
ok.forEach(t => console.log('  OK    ' + t));
fail.forEach(t => console.log('  FALLA ' + t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
process.exit(fail.length ? 1 : 0);
