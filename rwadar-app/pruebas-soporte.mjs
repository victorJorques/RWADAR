import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

export const MIGRACIONES = [
  '01_schema.sql',
  '02_seed.sql',
  '03_app.sql',
  '04_rls.sql',
  '06_archax_republic.sql',
  '07_cuentas.sql',
  '08_perfil.sql',
  '09_opiniones.sql',
  '10_moderacion.sql',
  '11_fuga_cola.sql',
  '12_borrado_moderador.sql',
  '14_seguridad_integral.sql',
  '15_acl_funciones.sql',
  '17_avisos_push.sql',
  '18_emisiones.sql',
  '19_emisiones_estados.sql',
  '20_emisiones_realidad.sql',
  '21_emisiones_continuas.sql',
  '22_cierre_regresiones.sql',
];

// PGlite es Postgres real en WebAssembly, pero no incluye las extensiones
// de infraestructura de Supabase. Estas firmas reproducen su contrato lo
// justo para ejecutar (no saltar) el SQL de la migración 13. No envían red.
const preparaSupabase = async (db) => {
  await db.exec(`
    create schema auth;
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text unique,
      email_confirmed_at timestamptz default now(),
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create table _sesion(uid uuid);
    create function auth.uid() returns uuid
      language sql stable security definer
      as $$ select uid from _sesion limit 1 $$;

    create schema vault;
    create table vault.decrypted_secrets(name text primary key, decrypted_secret text);

    create schema net;
    create table net.http_request_queue(
      id bigint generated always as identity primary key,
      url text, headers jsonb, body jsonb, params jsonb,
      timeout_milliseconds integer
    );
    grant all on table net.http_request_queue to public;
    create view net._peticiones as
      select id,url,headers,body,params,timeout_milliseconds
        from net.http_request_queue;
    create table net._http_response(
      id bigint primary key, status_code integer, content text, error_msg text
    );
    create function net.http_post(
      url text,
      body jsonb default '{}'::jsonb,
      params jsonb default '{}'::jsonb,
      headers jsonb default '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds integer default 1000
    )
      returns bigint language sql as $$
        insert into net.http_request_queue(url, headers, body, params, timeout_milliseconds)
        values (url, headers, body, params, timeout_milliseconds) returning id
      $$;

    create schema cron;
    create table cron.job(
      jobid bigint generated always as identity primary key,
      jobname text unique, schedule text, command text,
      active boolean not null default true
    );
    create function cron.unschedule(p_jobname text) returns boolean
      language sql as $$ delete from cron.job where jobname = p_jobname returning true $$;
    create function cron.schedule(p_jobname text, p_schedule text, p_command text)
      returns bigint language sql as $$
        insert into cron.job(jobname, schedule, command)
        values (p_jobname, p_schedule, p_command) returning jobid
      $$;
  `);
};

const sqlMigracion = (nombre) => {
  let sql = fs.readFileSync(path.join('db', nombre), 'utf8');
  if (['13_envio_avisos.sql', '16_reparacion.sql', '17_avisos_push.sql'].includes(nombre)) {
    // Las extensiones se sustituyen únicamente en el Postgres embebido;
    // el resto del fichero 13 se ejecuta literalmente y en producción no
    // se altera nada.
    sql = sql.replace(/^create extension if not exists (?:pg_net|pg_cron);\s*$/gmi, '');
  }
  return sql;
};

export const leerMigracion = sqlMigracion;

/* Cuántas plataformas y fuentes trae db/02_seed.sql, que es el volcado de producción
   (volcar-seed.js). Las pruebas comparan con esto en vez de fijar 26 y 4: cuando un
   descarte cambia el radar (ARTEX, 04/11/2026), la cuenta sigue al catálogo. */
export const cuentaSeed = (seed = fs.readFileSync(path.join('db', '02_seed.sql'), 'utf8')) => {
  const estado = e => (seed.match(new RegExp(`^insert into plataformas \\([^)]*\\) values \\('[a-z0-9-]+','(?:[^']|'')*','${e}'`, 'gm')) || []).length;
  return { enRadar: estado('en_radar'), descartadas: estado('descartada'),
    fuentes: (seed.match(/^insert into fuentes /gm) || []).length };
};

export const baseConMigraciones = async (migraciones = MIGRACIONES) => {
  const db = await new PGlite();
  // Supabase y los lectores web y móvil fechan en UTC. Con la zona local,
  // entre la medianoche española y la de UTC current_date iba un día por
  // delante y las pruebas del catálogo veían revisiones «del futuro».
  await db.exec("set time zone 'UTC'");
  await preparaSupabase(db);
  for (const nombre of migraciones) {
    await db.exec(sqlMigracion(nombre));
  }
  return db;
};

export const baseCompleta = async () => baseConMigraciones();

export const reaplicaSeguridad = async (db) => {
  await db.exec(sqlMigracion('14_seguridad_integral.sql'));
};

export const filas = async (db, sql, params = []) => (await db.query(sql, params)).rows;

export const sesion = async (db, uid = null, rol = null) => {
  await db.exec('reset role');
  await db.exec('delete from _sesion');
  if (uid) await db.query('insert into _sesion(uid) values ($1)', [uid]);
  if (rol) await db.exec(`set role ${rol}`);
};

export const alta = async (db, email, metadata = {}) => {
  const [usuario] = await filas(
    db,
    'insert into auth.users(email, raw_user_meta_data) values ($1, $2) returning id, email',
    [email, JSON.stringify(metadata)],
  );
  return usuario;
};

export const informe = (titulo, ok, fail) => {
  console.log(`=== ${titulo} ===`);
  ok.forEach((t) => console.log('  OK   ', t));
  fail.forEach((t) => console.log('  FALLO', t));
  console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
  if (fail.length) process.exitCode = 1;
};
