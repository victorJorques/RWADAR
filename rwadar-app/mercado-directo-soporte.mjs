/* =====================================================================
   RWAdar · soporte de las pruebas del gráfico en directo (migración 35)
   ---------------------------------------------------------------------
   Postgres real en WebAssembly (PGlite) con dobles locales de pg_net,
   pg_cron y Vault: no hay red ni Supabase. net.http_get guarda cada
   petición (dirección, cabeceras y espera) y net._http_response tiene las
   columnas reales (status_code, content_type, headers, content, timed_out,
   error_msg, created); la prueba escribe en ella lo que «responde» cada
   petición. El reloj de la 35 (rwadar_mercado.reloj(), que en producción es
   now()) se cambia por uno que mueve la prueba.
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
export const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');
export const SQL35 = leer('db/35_mercado_directo.sql');
export const RELOJ_PRODUCCION = `create or replace function rwadar_mercado.reloj() returns timestamptz
language sql stable security definer set search_path = '' as $funcion$
  select now()
$funcion$;`;
export const URL_MERCADOS = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-products&order=market_cap_desc&per_page=250';
export const URL_DIARIA = 'https://rwadar.pages.dev/datos/tokenizacion-serie.json';
// Privilegios por defecto hostiles mientras se aplica (como en la 33).
export const HOSTIL = `alter default privileges grant execute on functions to anon, authenticated, service_role;
alter default privileges grant all on tables to anon, authenticated, service_role;
alter default privileges grant all on sequences to anon, authenticated, service_role;
alter default privileges grant all on schemas to anon, authenticated, service_role;`;

export const SUPABASE = `
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema vault;
  create table vault.decrypted_secrets(name text primary key, decrypted_secret text);
  create schema net;
  create table net.http_request_queue(
    id bigint generated always as identity primary key,
    method text, url text, headers jsonb, params jsonb, timeout_milliseconds integer);
  create table net._http_response(
    id bigint primary key, status_code integer, content_type text, headers jsonb, content text,
    timed_out boolean, error_msg text, created timestamptz not null default now());
  create function net.http_get(url text, params jsonb default '{}'::jsonb, headers jsonb default '{}'::jsonb,
      timeout_milliseconds integer default 5000)
    returns bigint language sql as $$
      insert into net.http_request_queue(method, url, headers, params, timeout_milliseconds)
      values ('GET', url, headers, params, timeout_milliseconds) returning id $$;
  create schema cron;
  create table cron.job(jobid bigint generated always as identity primary key,
    jobname text unique, schedule text, command text, active boolean not null default true);
  create table cron.job_run_details(runid bigint generated always as identity primary key, jobid bigint, end_time timestamptz);
  create function cron.unschedule(p_jobname text) returns boolean
    language sql as $$ delete from cron.job where jobname = p_jobname returning true $$;
  create function cron.schedule(p_jobname text, p_schedule text, p_command text)
    returns bigint language sql as $$
      insert into cron.job(jobname, schedule, command) values (p_jobname, p_schedule, p_command) returning jobid $$;
`;

export const RELOJ_PRUEBA = `create table if not exists public._reloj(t timestamptz not null);
  insert into public._reloj select now() where not exists (select 1 from public._reloj);
  create or replace function rwadar_mercado.reloj() returns timestamptz
  language sql stable security definer set search_path = '' as $funcion$ select t from public._reloj limit 1 $funcion$;
  revoke all on function rwadar_mercado.reloj() from public, anon, authenticated, service_role;`;

/* Una base con los dobles y la 35 aplicada (con privilegios por defecto
   hostiles si se pide) y el reloj de prueba. */
export async function baseDirecto({ hostil = true, aplicar = true } = {}) {
  const db = await new PGlite();
  await db.exec("set time zone 'UTC'");
  await db.exec(SUPABASE);
  if (hostil) await db.exec(HOSTIL);
  if (aplicar) {
    await db.exec(SQL35);
    await db.exec(RELOJ_PRUEBA);
  }
  if (hostil) await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
  return db;
}

export const filas = async (db, sql, p = []) => (await db.query(sql, p)).rows;
export const una = async (db, sql, p = []) => (await filas(db, sql, p))[0];
export const valor = async (db, sql, p = []) => Object.values(await una(db, sql, p))[0];
export async function fijarReloj(db, cuando) {
  const iso = typeof cuando === 'number' ? new Date(cuando).toISOString() : cuando;
  await db.query('update public._reloj set t = $1', [iso]);
}
export const ahora = async (db) => new Date(await valor(db, 'select t from public._reloj')).getTime();
/* Las peticiones de pg_net desde «desde» (id). */
export const peticiones = (db, desde = 0) => filas(db, 'select * from net.http_request_queue where id > $1 order by id', [desde]);
export async function responder(db, id, { status = 200, contenido = '', headers = {}, creado, timedOut = false, error = null } = {}) {
  await db.query(`insert into net._http_response(id, status_code, content_type, headers, content, timed_out, error_msg, created)
    values ($1, $2, 'application/json', $3, $4, $5, $6, coalesce($7::timestamptz, (select t from public._reloj)))`,
  [id, status, JSON.stringify(headers), contenido, timedOut, error, creado ? new Date(creado).toISOString() : null]);
}
