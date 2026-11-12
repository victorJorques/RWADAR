/* =====================================================================
   RWAdar · el pie de los correos, sin el nombre del titular (migración 34)
   ---------------------------------------------------------------------
   Víctor (12/11/2026): «todo lo que puedas quitar mi nombre hazlo». Su
   nombre completo queda solo en el aviso legal y la privacidad de la web.

   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, 26,
   el refuerzo de sesión, 28, 28_REVERTIR, 29, la 30 con la casilla
   activada, la 31, la 32 (con la clave VAPID creada) y la 33, como hoy en
   producción (envío apagado); encima, la 34, con privilegios por defecto
   hostiles mientras se aplica.

   Auth, pg_net, Vault y pg_cron son dobles locales: no hay red, ni correo,
   ni Supabase. Las peticiones a Lettermint se leen de la cola del doble de
   pg_net. Los pasos de «Avisos a registrados (base)» (comprobar la acción,
   ensayo-34 y verificar) se ejecutan de verdad con bash y un doble de psql
   que pasa cada orden a PGlite.

       node probar-pie-sin-nombre.mjs
   ===================================================================== */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { baseCatalogoHistorico, filas, informe, sesion } from './pruebas-soporte.mjs';
import { generarClaves } from './enviar-webpush.mjs';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const raizRepo = path.join(raiz, '..');
process.chdir(raiz);
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const error = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };
const una = async (db, sql, p = []) => (await filas(db, sql, p))[0];
const numero = async (db, sql, p = []) => Number(Object.values(await una(db, sql, p))[0]);
const sinComentarios = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
const funcionDe = (sql, nombre) => sql.match(new RegExp(`create or replace function ${nombre.replace('.', '\\.')}\\([\\s\\S]*?\\n\\$funcion\\$;`))[0];

const SQL30 = leer('db/30_avisos_registrados.sql');
const SQL31 = leer('db/31_correo_lettermint.sql');
const SQL32 = leer('db/32_notificaciones.sql');
const SQL33 = leer('db/33_webpush_supabase.sql');
const SQL34 = leer('db/34_pie_sin_nombre.sql');
const MIGRACION34 = leer('supabase/migrations/20261112210000_pie_sin_nombre.sql');
const VERIFICAR30 = leer('db/30_avisos_registrados_verificar.sql');
const VERIFICAR31 = leer('db/31_correo_lettermint_verificar.sql');
const VERIFICAR32 = leer('db/32_notificaciones_verificar.sql');
const VERIFICAR33 = leer('db/33_webpush_supabase_verificar.sql');
const VERIFICAR34 = leer('db/34_pie_sin_nombre_verificar.sql');
const ACTIVAR_CASILLA = leer('db/30_avisos_registrados_activar_casilla.sql');
const ACTIVAR_CORREO = leer('db/30_avisos_registrados_activar_correo.sql');
const BASE = leer('../.github/workflows/avisos-base.yml');
const PKG = JSON.parse(leer('package.json'));
const VERSION = 'novedades-v2-2026-11-06';
const LETTERMINT = 'https://api.lettermint.co/v1/send';
const NOMBRE = /jorques|granero|v[ií]ctor manuel/i;
// Token inventado para los dobles (no es de Lettermint ni de nadie).
const TOKEN_LM = ['lm', 'ficticio', 'solo', 'para', 'esta', 'prueba', 'local'].join('-');
const VAULT_LETTERMINT = `insert into vault.decrypted_secrets(name, decrypted_secret) values ('LETTERMINT_API_TOKEN', '${TOKEN_LM}'),
  ('RWADAR_REMITENTE', 'avisos@rwadar.example')`;

// El pie de la 31 y el de la 34: solo cambia quién es el responsable.
const NOMBRE_31 = 'Víctor Manuel Jorques Granero';
const TITULAR_34 = 'el titular de RWAdar';
const RESPONSABLE_34 = 'Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España';
const PIE_HTML_34 = `Te escribe RWAdar, un radar independiente de plataformas de tokenización. ${RESPONSABLE_34} `
  + '(<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a> · '
  + '<a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>';
const PIE_TXT_34 = `\n--\nTe escribe RWAdar, un radar independiente de plataformas de tokenización. ${RESPONSABLE_34}.\n`
  + 'Aviso legal: https://rwadar.pages.dev/privacidad#aviso-legal\nPrivacidad: https://rwadar.pages.dev/privacidad\n';

// Un paso de un flujo de GitHub (« - name: …» a 6 espacios) y su script (run: |).
const pasoDe = (yaml, nombre) => {
  const lineas = yaml.split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === `- name: ${nombre}`);
  if (inicio < 0) return null;
  const fin = lineas.findIndex((l, i) => i > inicio && /^ {6}(- |# )/.test(l));
  return lineas.slice(inicio, fin < 0 ? undefined : fin).join('\n');
};
const scriptDe = (bloque) => {
  const lineas = bloque.split('\n');
  const i = lineas.findIndex((l) => /^ {8}run: \|$/.test(l));
  return lineas.slice(i + 1).map((l) => l.replace(/^ {10}/, '')).join('\n');
};

let db;
let servidor;
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-pie-sin-nombre-'));
try {
/* =====================================================================
   1 · Revisión estática: copias, forma y que solo cambia el nombre
   ===================================================================== */
paso('la migración versionada 20261112210000 es una copia idéntica de db/34', MIGRACION34 === SQL34);
{
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la 34 empieza en «begin;» y termina en su único «commit;»; su verificador empieza en «begin transaction read only;» y termina en «rollback;»',
    primera(SQL34) === 'begin;' && (SQL34.match(/^commit;$/gm) || []).length === 1 && lineas(SQL34).at(-1) === 'commit;'
    && primera(VERIFICAR34) === 'begin transaction read only;' && lineas(VERIFICAR34).at(-1) === 'rollback;'
    && (VERIFICAR34.match(/^begin transaction read only;$/gm) || []).length === 1 && !/^commit;$/m.test(VERIFICAR34));
  const f31 = funcionDe(SQL31, 'rwadar_novedades.correo_mensaje');
  const f34 = funcionDe(SQL34, 'rwadar_novedades.correo_mensaje');
  const comentario31 = '  -- Titular identificable (LSSI art. 20.1) y dirección física (política de\n'
    + '  -- uso de Lettermint): la misma que publica el aviso legal de la web.\n';
  const comentario34 = '  -- Titular identificable (LSSI art. 20.1): «el titular de RWAdar», con el\n'
    + '  -- enlace al aviso legal, que lo identifica con nombre, NIF y domicilio\n'
    + '  -- (desde la 34, sin su nombre aquí). Dirección física (política de uso de\n'
    + '  -- Lettermint): la misma que publica el aviso legal de la web.\n';
  paso('correo_mensaje de la 34 es la de la 31 letra por letra salvo el nombre del pie (dos veces: HTML y texto, por «el titular de RWAdar») y el comentario de encima',
    f31.split(NOMBRE_31).length === 3 && f31.split(comentario31).length === 2
    && f34 === f31.replace(comentario31, comentario34).replaceAll(NOMBRE_31, TITULAR_34) && !NOMBRE.test(f34));
  const codigo = sinComentarios(SQL34.replace(f34, ''));
  paso('la 34 solo redefine correo_mensaje: ni otras funciones, ni tablas, ni filas, ni relojes, ni Vault; solo el revoke de siempre y ningún grant',
    isDeepStrictEqual([...SQL34.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1]), ['rwadar_novedades.correo_mensaje'])
    && !/\b(drop|alter|create\s+(table|index|trigger|policy|schema|view))\b/i.test(codigo)
    && !/\b(insert\s+into|update\s+rwadar_novedades\.|delete\s+from|truncate)\b/i.test(codigo)
    && !/cron\.|vault\.|\bgrant\b/i.test(codigo)
    && isDeepStrictEqual([...codigo.matchAll(/^revoke .*$/gm)].map((m) => m[0]),
      ['revoke all on function rwadar_novedades.correo_mensaje(text, text, text, text, boolean, uuid)']));
  paso('la 34 se niega sin la 31 (envío de Lettermint) y con correos a medias con su clave idempotente, con el cerrojo de procesar()',
    /position\('https:\/\/api\.lettermint\.co\/v1\/send' in\s+pg_get_functiondef\('rwadar_novedades\.enviar_correos\(integer\)'::regprocedure\)\) = 0/.test(codigo)
    && codigo.includes('select pg_advisory_xact_lock(20261105, 30);')
    && /c\.estado in \('enviando', 'pendiente'\) and c\.idempotencia is not null\s+and c\.idempotencia_el > now\(\) - interval '25 minutes'/.test(codigo));
  const sinNombre = ['db/34_pie_sin_nombre.sql', 'db/34_pie_sin_nombre_verificar.sql',
    'supabase/migrations/20261112210000_pie_sin_nombre.sql', 'db/31_correo_lettermint_verificar.sql', 'correo-lettermint.sh',
    'plantillas-auth/confirmar-alta.html', 'plantillas-auth/recuperar-acceso.html', '../rwadar-app/plantillas-auth/LEEME.md',
    'db/30_avisos_registrados_activar_correo.sql']
    .filter((f) => NOMBRE.test(leer(f)));
  paso(`sin el nombre del titular en la 34, su verificador, el verificador 31, la prueba de Lettermint, las plantillas de Auth ni activar_correo (con él: ${sinNombre.join(', ') || 'ninguno'})`,
    sinNombre.length === 0);
  paso('npm test de rwadar-app ejecuta esta prueba justo después de la de las notificaciones web',
    PKG.scripts.test.includes('node probar-webpush-supabase.mjs && node probar-pie-sin-nombre.mjs &&'));
}

/* =====================================================================
   2 · La cadena de producción (30 con la casilla, 31, 32 con la clave, 33)
   ===================================================================== */
const AUTH_DOBLES = `
  alter table auth.users add column is_anonymous boolean default false;
  alter table auth.users add column confirmation_sent_at timestamptz;
  alter table auth.users alter column raw_user_meta_data drop not null;
  create or replace function auth.uid() returns uuid language sql stable security definer
    set search_path='' as $$ select uid from public._sesion limit 1 $$;
  create table auth.sessions(id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
    not_after timestamptz);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  revoke all on auth.users, auth.sessions from public, anon, authenticated;
  create role supabase_auth_admin noinherit;
  grant usage on schema auth to supabase_auth_admin;
  grant select, insert, update, delete on auth.users, auth.sessions to supabase_auth_admin;`;
const VAULT_DOBLES = `
  alter table vault.decrypted_secrets add column id uuid not null default gen_random_uuid(), add column description text;
  create view vault.secrets as select id, name, description, decrypted_secret as secret from vault.decrypted_secrets;`;
const HOSTIL = `alter default privileges grant execute on functions to anon, authenticated, service_role;
  alter default privileges grant all on sequences to anon, authenticated;
  alter default privileges grant all on tables to anon, authenticated, service_role`;

db = await baseCatalogoHistorico();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const ruta of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql', 'db/26_reabrir_cuentas.sql']) await db.exec(leer(ruta));
await db.exec(AUTH_DOBLES);
for (const ruta of ['supabase/migrations/20261011074218_cuentas_sesion_confirmada.sql', 'db/28_catalogo_cuenta_obligatoria.sql',
  'db/28_catalogo_cuenta_obligatoria_REVERTIR.sql', 'db/29_cartera_cuenta.sql']) await db.exec(leer(ruta));
await db.exec(VAULT_DOBLES);
await db.exec(SQL30);
{
  const e = await error(() => db.exec(SQL34));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  paso(`sin la 31 (el correo de Brevo de la 30), la 34 se niega (55000) y no cambia nada («${e?.message}»)`,
    e?.code === '55000' && /falta aplicar antes 31_correo_lettermint\.sql/.test(e.message)
    && !(await una(db, "select pg_get_functiondef('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)'::regprocedure) d")).d.includes(TITULAR_34));
}
await db.exec(ACTIVAR_CASILLA);
await db.exec(SQL31);
await db.exec(SQL32);
{
  const vapid = generarClaves();
  await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_VAPID_PRIVADA', '${vapid.privada}');
    update rwadar_novedades.configuracion set webpush_clave_publica = '${vapid.publica}' where unica`);
}
await db.exec(SQL33);

const verificador = async (sql, prefijo) => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(sql, { onNotice: (n) => avisos.push(n.message) }));
  if (e) { await db.exec('rollback').catch(() => {}); return { ok: false, error: e.message }; }
  const aviso = avisos.find((a) => a.startsWith(prefijo));
  return { ok: !!aviso, aviso };
};
const verificar30 = () => verificador(VERIFICAR30, 'RWAdar 30 OK');
const verificar31 = () => verificador(VERIFICAR31, 'RWAdar 31 OK');
const verificar32 = () => verificador(VERIFICAR32, 'RWAdar 32 OK');
const verificar33 = () => verificador(VERIFICAR33, 'RWAdar 33 OK');
const verificar34 = () => verificador(VERIFICAR34, 'RWAdar 34 OK');
const todos = async () => [await verificar30(), await verificar31(), await verificar32(), await verificar33(), await verificar34()];

// Los correos que construye correo_mensaje: bienvenida sin y con avisos, y un anuncio.
const BAJA = '6f1c2a4e-3b5d-4c7e-8f90-a1b2c3d4e5f6';
const muestras = async () => {
  await sesion(db);
  return (await filas(db, `select rwadar_novedades.correo_mensaje('bienvenida', null, null, null, false, null) a,
      rwadar_novedades.correo_mensaje('bienvenida', null, null, null, true, $1::uuid) b,
      rwadar_novedades.correo_mensaje('anuncio', 'Avisos & <mejoras>', 'Ya puedes elegir "qué" avisos recibir.',
        'https://rwadar.pages.dev/academy/', true, $1::uuid) c`, [BAJA])).flatMap((f) => [f.a, f.b, f.c]);
};
const antes = await muestras();
{
  const v = await todos();
  paso(`hoy (la 31 puesta) pasan los verificadores 30 a 33, también el 31 con el nombre en el pie, y el 34 falla porque el pie lleva el nombre («${v[4].error}»)`,
    v.slice(0, 4).every((x) => x.ok) && !v[4].ok && /vuelve a llevar el nombre del titular/.test(v[4].error)
    && antes.every((c) => c.html.includes(`Responsable: ${NOMBRE_31}, Plaza Generalitat`)));
}
{
  // Sin la 34, encender el correo se niega aunque Vault ya tenga el token y
  // el remitente: ningún aviso sale con el nombre del titular en el pie.
  await sesion(db);
  await db.exec(VAULT_LETTERMINT);
  const e = await error(() => db.exec(ACTIVAR_CORREO));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  const c = await una(db, `select correo_habilitado h, correo_activado_el f,
      (select count(*)::int from cron.job where jobname = 'rwadar-novedades') relojes from rwadar_novedades.configuracion`);
  await db.exec("delete from vault.decrypted_secrets where name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE')");
  paso(`sin la 34 (y con el token y el remitente en Vault), activar-correo se niega (55000) y no enciende nada ni crea el reloj («${e?.message}»)`,
    e?.code === '55000' && /falta aplicar 34_pie_sin_nombre\.sql/.test(e.message) && c.h === false && c.f === null && c.relojes === 0);
}

/* =====================================================================
   3 · Dobles: psql sobre PGlite y los pasos del flujo con bash
   ===================================================================== */
const llamadasPsql = [];
const psqlDoble = async (argv) => {
  llamadasPsql.push(argv);
  const j = argv.indexOf('-f');
  const archivo = j >= 0 ? path.resolve(raizRepo, argv[j + 1]) : null;
  const sql = archivo ? fs.readFileSync(archivo, 'utf8') : argv[argv.indexOf('-c') + 1];
  await sesion(db);
  const avisos = [];
  try {
    await db.exec(sql, { onNotice: (n) => avisos.push(`${n.severity}:  ${n.message}\n`) });
    return { estado: 0, stdout: '', stderr: avisos.join('') };
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    return { estado: archivo ? 3 : 1, stdout: '', stderr: `${avisos.join('')}ERROR:  ${e.message}\n` };
  }
};
servidor = http.createServer(async (req, res) => {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  res.end(JSON.stringify(await psqlDoble(JSON.parse(Buffer.concat(trozos)).argv)));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const LOCAL = `http://127.0.0.1:${servidor.address().port}`;
const hayBash = spawnSync('bash', ['--version'], { encoding: 'utf8' }).status === 0;
const DOBLE_PSQL = `#!/usr/bin/env node
const http = require('node:http');
const peticion = http.request(process.env.PSQL_DOBLE_URL, { method: 'POST' }, (res) => {
  let datos = '';
  res.setEncoding('utf8');
  res.on('data', (t) => { datos += t; });
  res.on('end', () => { const r = JSON.parse(datos); process.stdout.write(r.stdout); process.stderr.write(r.stderr); process.exitCode = r.estado; });
});
peticion.on('error', (e) => { process.stderr.write('doble de psql: ' + e.message + '\\n'); process.exitCode = 2; });
peticion.end(JSON.stringify({ argv: process.argv.slice(2) }));
`;
const correPaso = async (yaml, nombre, entorno = {}) => {
  const dir = fs.mkdtempSync(path.join(temporal, 'paso-'));
  fs.writeFileSync(path.join(dir, 'psql'), DOBLE_PSQL, { mode: 0o755 });
  const githubEnv = path.join(dir, 'github-env');
  fs.writeFileSync(githubEnv, '');
  const bloque = pasoDe(yaml, nombre);
  if (!bloque) throw new Error(`el flujo no tiene el paso «${nombre}»`);
  const desde = llamadasPsql.length;
  const r = await new Promise((resolver) => {
    const hijo = spawn('bash', ['-c', scriptDe(bloque)], { cwd: raizRepo, env: {
      PATH: `${dir}:${process.env.PATH}`, HOME: dir, GITHUB_ENV: githubEnv,
      PSQL_DOBLE_URL: `${LOCAL}/psql`, SUPABASE_DB_URL: 'postgresql://doble-local/sin-red', ...entorno } });
    let stdout = '', stderr = '';
    hijo.stdout.on('data', (t) => { stdout += t; });
    hijo.stderr.on('data', (t) => { stderr += t; });
    hijo.on('close', (estado) => resolver({ estado, stdout, stderr }));
  });
  const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { ...r, texto: `${r.stdout}${r.stderr}`, salida, llamadas: llamadasPsql.slice(desde) };
};
const V = (n) => `rwadar-app/db/${{ 30: '30_avisos_registrados', 31: '31_correo_lettermint', 32: '32_notificaciones',
  33: '33_webpush_supabase', 34: '34_pie_sin_nombre' }[n]}_verificar.sql`;
const V5 = [30, 31, 32, 33, 34].map(V).join(' ');
const compruebaBase = (entradas) => correPaso(BASE, 'Comprobar la acción', { ACCION: 'ensayo-34', CONFIRMAR: '', REMITENTE: '', ...entradas });

/* =====================================================================
   4 · El flujo: acciones de la 34 y su ensayo
   ===================================================================== */
{
  const opciones = BASE.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map((l) => l.trim().slice(2));
  paso('avisos-base.yml añade ensayo-34, verificar-34 y aplicar-34 tras prueba-webpush y conserva las demás',
    isDeepStrictEqual(opciones, ['ensayo-30', 'verificar-30', 'diagnostico-30', 'aplicar-30', 'ensayo-31', 'verificar-31', 'aplicar-31',
      'guardar-correo', 'ensayo-32', 'verificar-32', 'aplicar-32', 'crear-vapid', 'rotar-vapid', 'ensayo-33', 'verificar-33', 'aplicar-33',
      'prueba-webpush', 'ensayo-34', 'verificar-34', 'aplicar-34', 'activar-casilla', 'activar-correo', 'activar-push', 'apagar',
      'apagar-casilla']));
  paso('el flujo comprueba que las dos copias de la 34 son idénticas y avisa de reaplicar la 34 tras aplicar-30 y aplicar-31',
    BASE.includes('cmp -s "$D/34_pie_sin_nombre.sql" rwadar-app/supabase/migrations/20261112210000_pie_sin_nombre.sql')
    && BASE.includes('(aplicar-31, aplicar-32, aplicar-33 y aplicar-34)')
    && /if \[ "\$ACCION" = aplicar-31 \]; then\n\s+echo "Aviso: la 31 pone en el pie de los correos el nombre del titular\. Si la 34 ya estaba aplicada, vuelve a aplicarla \(aplicar-34\) para quitarlo\."/.test(BASE));
}
if (hayBash) {
  const esperados = [
    [{ ACCION: 'ensayo-34' }, { SQL: 'rwadar-app/db/34_pie_sin_nombre.sql', CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: V5 }],
    [{ ACCION: 'verificar-34' }, { SQL: V(34), CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: V5 }],
    [{ ACCION: 'aplicar-34', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/34_pie_sin_nombre.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: V5 }],
    [{ ACCION: 'activar-correo', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/30_avisos_registrados_activar_correo.sql', CAMBIA: 'si', ENSAYO: 'no',
      VERIFICADORES: [30, 31, 34].map(V).join(' ') }],
  ];
  const vistos = [];
  for (const [entradas] of esperados) vistos.push(await compruebaBase(entradas));
  paso(`«Comprobar la acción» elige SQL, copia, ensayo y verificadores de las acciones de la 34 (los 30 a 34) y de activar-correo (30, 31 y 34) (${esperados.length} acciones)`,
    vistos.every((v, i) => v.estado === 0 && isDeepStrictEqual(v.salida, esperados[i][1])));
  const malos = [{ ACCION: 'aplicar-34' }, { ACCION: 'aplicar-34', CONFIRMAR: 'avisos' }, { ACCION: 'aplicar-35', CONFIRMAR: 'AVISOS' }];
  const rechazos = [];
  for (const m of malos) rechazos.push(await compruebaBase(m));
  paso(`y rechaza ${malos.length} entradas (aplicar-34 sin AVISOS, acción desconocida) sin dejar nada en GITHUB_ENV`,
    rechazos.every((v) => v.estado !== 0 && Object.keys(v.salida).length === 0) && /escribe AVISOS/.test(rechazos[0].texto));
  // Con una copia distinta, el flujo para antes de tocar nada.
  const copia = path.join(raiz, 'supabase/migrations/20261112210000_pie_sin_nombre.sql');
  fs.writeFileSync(copia, `${SQL34}-- cambiada\n`);
  let distinta;
  try { distinta = await compruebaBase({ ACCION: 'ensayo-34' }); } finally { fs.writeFileSync(copia, MIGRACION34); }
  paso('si las dos copias de la 34 no coinciden, «Comprobar la acción» falla y no deja nada en GITHUB_ENV',
    distinta.estado !== 0 && /Las dos copias de la 34 no coinciden/.test(distinta.texto) && Object.keys(distinta.salida).length === 0
    && fs.readFileSync(copia, 'utf8') === SQL34);

  const comprobar = await compruebaBase({ ACCION: 'ensayo-34' });
  const ensayo = await correPaso(BASE, 'Ensayo sin cambiar nada (se deshace al final)', comprobar.salida);
  await sesion(db);
  paso(`el ensayo-34 del flujo, ejecutado de verdad, monta la 34 + los verificadores 30 a 34 + rollback, pasa sobre la cadena de producción y no deja nada (${ensayo.estado === 0 ? 'OK' : ensayo.texto.trim()})`,
    comprobar.estado === 0 && ensayo.estado === 0 && ensayo.llamadas.length === 1
    && ensayo.texto.includes('ENSAYO CORRECTO: 34_pie_sin_nombre.sql y sus verificadores pasan')
    && ['30', '31', '32', '33', '34'].every((n) => new RegExp(`NOTICE: {2}RWAdar ${n} OK`).test(ensayo.stderr))
    && isDeepStrictEqual(await muestras(), antes));
} else {
  console.log('  (sin bash en este equipo: los pasos del flujo se comprueban en CI)');
}

/* =====================================================================
   5 · La 34 aplicada: correos a medias, dos veces, privilegios hostiles
   ===================================================================== */
{
  // Una bienvenida «enviando» con su clave de hace 5 minutos: la 34 espera.
  await sesion(db);
  const [u] = await filas(db, `insert into auth.users(email, email_confirmed_at) values ('medias@ejemplo.test', now()) returning id`);
  await db.query('delete from rwadar_novedades.correos where usuario_id = $1', [u.id]);
  const [c] = await filas(db, `insert into rwadar_novedades.correos (usuario_id, tipo, estado, idempotencia, idempotencia_el, peticion_id, peticion_el)
    values ($1, 'bienvenida', 'enviando', gen_random_uuid(), now() - interval '5 minutes', 424242, now() - interval '5 minutes') returning id`, [u.id]);
  const e = await error(() => db.exec(SQL34));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  const sigue = await una(db, 'select estado, peticion_id from rwadar_novedades.correos where id = $1', [c.id]);
  const conNombre = isDeepStrictEqual(await muestras(), antes);
  // Pasados 25 minutos de su clave ya no se reintenta: la 34 entra.
  await db.query("update rwadar_novedades.correos set idempotencia_el = now() - interval '26 minutes' where id = $1", [c.id]);
  const e2 = await error(() => db.exec(SQL34));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  paso(`con un correo a medias con su clave idempotente (menos de 25 minutos), la 34 se niega (55000) sin tocarlo; pasado ese plazo entra («${e?.message}»)`,
    e?.code === '55000' && /hay correos a medias/.test(e.message) && sigue.estado === 'enviando' && Number(sigue.peticion_id) === 424242
    && conNombre && e2 === null);
  await db.query('delete from rwadar_novedades.correos where id = $1', [c.id]);
  await db.query('delete from auth.users where id = $1', [u.id]);
}
await db.exec(HOSTIL);
await db.exec(SQL34);
await db.exec('grant execute on function rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid) to service_role');
await db.exec(SQL34);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
const despues = await muestras();
{
  const v = await todos();
  paso(`la 34 se aplica dos veces (la segunda vuelve a cerrar lo abierto a mano) y pasan los verificadores 30 a 34 («${v[4].aviso || v[4].error}»)`,
    v.every((x) => x.ok)
    && !(await una(db, "select has_function_privilege('service_role', 'rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)', 'EXECUTE') a")).a
    && !(await una(db, "select has_function_privilege('anon', 'rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)', 'EXECUTE') a")).a);
  paso('los tres correos (bienvenida sin y con avisos, anuncio) son los de la 31 cambiando solo el nombre por «el titular de RWAdar»: asunto, cuerpo, botón, motivo, baja y mailto, iguales',
    despues.length === 3 && despues.every((c, i) => isDeepStrictEqual(c, JSON.parse(JSON.stringify(antes[i]).replaceAll(NOMBRE_31, TITULAR_34))))
    && !isDeepStrictEqual(despues, antes));
  paso('el pie dice «Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España», con el aviso legal y la privacidad enlazados (en texto, sus direcciones) y sin el nombre',
    despues.every((c) => c.html.includes(PIE_HTML_34) && c.texto.includes(PIE_TXT_34) && !NOMBRE.test(JSON.stringify(c))));
  paso('se mantiene lo demás del pie: por qué lo recibe y, a quien está apuntado, la baja por enlace y por mailto; sin imágenes ni seguimiento',
    despues[0].texto.includes('Recibes este correo porque se ha confirmado una cuenta de RWAdar con esta dirección.') && !despues[0].html.includes('baja?t=')
    && [despues[1], despues[2]].every((c) => c.html.includes(`href="https://rwadar.pages.dev/baja?t=${BAJA}"`)
      && c.html.includes('href="mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar"')
      && c.texto.includes(`Para darte de baja de los avisos: https://rwadar.pages.dev/baja?t=${BAJA} o escribe a rwadares@gmail.com.`))
    && despues[2].texto.includes('Recibes este aviso porque te apuntaste a los avisos de novedades de RWAdar.')
    && despues.every((c) => !/<img|<script|utm_|pixel/i.test(c.html)));
  const e = await error(() => db.query("select rwadar_novedades.correo_mensaje('anuncio', 't', 'x', 'https://rwadar.pages.dev/', false, null)"));
  await db.exec('rollback').catch(() => {});
  paso('un anuncio sin baja sigue sin construirse (22023)', e?.code === '22023');
}

/* =====================================================================
   6 · De punta a punta: lo que sale hacia Lettermint lleva el pie nuevo
   ===================================================================== */
{
  await sesion(db);
  await db.exec(VAULT_LETTERMINT);
  await db.exec(ACTIVAR_CORREO);
  await sesion(db);
  await db.exec('set role supabase_auth_admin');
  let ana;
  try {
    [ana] = await filas(db, `insert into auth.users(email, raw_user_meta_data, email_confirmed_at, confirmation_sent_at)
      values ('ana-pie@ejemplo.test', $1::jsonb, null, clock_timestamp()) returning id, email`,
      [JSON.stringify({ avisos_novedades: true, avisos_version: VERSION, avisos_canal: 'web' })]);
    await db.query('update auth.users set email_confirmed_at = now() where id = $1', [ana.id]);
  } finally { await db.exec('reset role'); }
  await sesion(db);
  await db.query(`select rwadar_novedades.anunciar('novedad', 'novedad:pie-sin-nombre', 'Pie sin nombre', 'Prueba del pie.', 'https://rwadar.pages.dev/')`);
  const desde = await numero(db, 'select coalesce(max(id), 0)::int from net.http_request_queue');
  await db.query('select rwadar_novedades.procesar()');
  await sesion(db);
  const correos = (await filas(db, 'select body from net._peticiones where id > $1 and url = $2 order by id', [desde, LETTERMINT]))
    .map((f) => f.body).filter((b) => isDeepStrictEqual(b.to, [ana.email]));
  const baja = (await una(db, 'select baja_token::text t from rwadar_novedades.preferencias where usuario_id = $1 and novedades', [ana.id]))?.t;
  paso(`con el correo encendido, la bienvenida y el anuncio que salen hacia Lettermint llevan el pie sin el nombre, la baja, List-Unsubscribe y sin seguimiento (${correos.length} correos)`,
    correos.length === 2 && !!baja
    && isDeepStrictEqual(correos.map((b) => b.subject).sort(), ['Pie sin nombre', 'Te damos la bienvenida a RWAdar'])
    && correos.every((b) => b.html.includes(PIE_HTML_34) && b.text.includes(PIE_TXT_34) && !NOMBRE.test(JSON.stringify(b))
      && b.html.includes(`https://rwadar.pages.dev/baja?t=${baja}`) && isDeepStrictEqual(b.settings, { track_opens: false, track_clicks: false })
      && b.headers?.['List-Unsubscribe']?.startsWith(`<https://rwadar.pages.dev/baja?t=${baja}>`)));
}

/* =====================================================================
   7 · Lo que el verificador 34 detecta y el orden al reaplicar
   ===================================================================== */
{
  const f34 = funcionDe(SQL34, 'rwadar_novedades.correo_mensaje');
  const rompe = async (romper, arreglar = f34) => {
    await sesion(db); await db.exec(romper); const v = await verificar34(); await sesion(db); await db.exec(arreglar); return v;
  };
  const dueno = (await una(db, "select p.proowner::regrole::text d from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure")).d;
  const firma = 'rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)';
  const rotos = {
    'el pie de la 31 (con el nombre)': [await rompe(funcionDe(SQL31, 'rwadar_novedades.correo_mensaje')), /vuelve a llevar el nombre/],
    'el nombre solo en el texto': [await rompe(f34.replace("|| 'Responsable: el titular de RWAdar, Plaza", "|| 'Responsable: Jorques, Plaza")), /vuelve a llevar el nombre/],
    'sin la dirección postal': [await rompe(f34.replaceAll('Plaza Generalitat, s/n, ', '')), /bienvenida no lleva/],
    'sin el aviso legal en texto': [await rompe(f34.replace("|| 'Aviso legal: https://rwadar.pages.dev/privacidad#aviso-legal' || E'\\n'", '')), /bienvenida no lleva/],
    'sin el aviso legal en HTML': [await rompe(f34.replace('privacidad#aviso-legal" style', 'privacidad" style')), /bienvenida no lleva/],
    'sin la baja en el anuncio': [await rompe(f34.replace("|| ' o escribe a <a href=\"' || rwadar_novedades.html(v_mailto)", "|| ' o escribe a <a href=\"' || 'mailto:otro@ejemplo.test'")), /un anuncio no lleva/],
    'sin el motivo': [await rompe(f34.replace("v_motivo := 'Recibes este aviso porque te apuntaste", "v_motivo := 'Te apuntaste")), /un anuncio no lleva/],
    'ejecutable por authenticated': [await rompe(`grant execute on function ${firma} to authenticated`, `revoke execute on function ${firma} from authenticated`), /ejecutable por authenticated/],
    'security invoker': [await rompe(`alter function ${firma} security invoker`, `alter function ${firma} security definer`), /security definer/],
    'otro dueño': [await rompe(`alter function ${firma} owner to service_role`, `alter function ${firma} owner to ${dueno}`), /dueño/],
    'el envío de la 30 (Brevo)': [await rompe(funcionDe(SQL30, 'rwadar_novedades.enviar_correos'), funcionDe(SQL31, 'rwadar_novedades.enviar_correos')), /no es el de Lettermint/],
  };
  const fallan = Object.entries(rotos).filter(([, [v, motivo]]) => v.ok || !motivo.test(v.error || '')).map(([n, [v]]) => `${n}: ${v.error || 'pasa'}`);
  paso(`el verificador 34 detecta ${Object.keys(rotos).length} roturas (el nombre de vuelta, sin dirección, sin aviso legal, sin baja ni motivo, permisos, invoker, dueño y el envío de Brevo)${fallan.length ? ` · no detecta: ${fallan.join(' | ')}` : ''}`,
    fallan.length === 0 && (await verificar34()).ok);
}
{
  // Reaplicar la 31 devuelve el nombre: el verificador 34 lo ve (el 31 sigue
  // pasando) y reaplicar la 34 lo quita. Reaplicar la 30 devuelve el correo a
  // Brevo: la 34 se niega hasta reaplicar la 31.
  // Antes, se cierran los dos correos de arriba (sin respuesta del doble de
  // pg_net) y se apaga el correo, como pide reaplicar la 30.
  await sesion(db);
  await db.exec(`update rwadar_novedades.correos set estado = 'aceptado', terminado_el = now(), peticion_id = null, peticion_el = null
    where estado in ('enviando', 'pendiente')`);
  await db.exec(leer('db/30_avisos_registrados_apagar.sql'));
  await sesion(db);
  await db.exec(SQL31);
  const tras31 = [await verificar31(), await verificar34()];
  const conNombre = isDeepStrictEqual(await muestras(), antes);
  await sesion(db);
  const encender31 = await error(() => db.exec(ACTIVAR_CORREO));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  const apagado31 = (await una(db, 'select correo_habilitado h from rwadar_novedades.configuracion')).h === false;
  await db.exec(SQL34);
  const tras34 = await verificar34();
  await sesion(db);
  await db.exec(SQL30);
  const tras30 = await verificar34();
  const sin31 = await error(() => db.exec(SQL34));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  await db.exec(SQL31);
  await db.exec(SQL32);
  await db.exec(SQL33);
  await db.exec(SQL34);
  paso('reaplicar la 31 devuelve el nombre al pie (el verificador 31 pasa, el 34 lo detecta y activar-correo se niega) y reaplicar la 34 lo quita; tras reaplicar la 30, la 34 se niega hasta la 31, y con la 31, la 32, la 33 y la 34 queda bien',
    tras31[0].ok && !tras31[1].ok && /vuelve a llevar el nombre/.test(tras31[1].error) && conNombre && tras34.ok
    && encender31?.code === '55000' && /se reaplicó la 31 después: vuelve a aplicar la 34/.test(encender31.message) && apagado31
    && !tras30.ok && /no es el de Lettermint/.test(tras30.error) && sin31?.code === '55000'
    && (await todos()).every((x) => x.ok) && isDeepStrictEqual(await muestras(), despues));
}
} catch (e) {
  fail.push(`la prueba se paró: ${e.stack || e.message}`);
} finally {
  if (servidor) servidor.close();
  if (db) await db.close().catch(() => {});
  fs.rmSync(temporal, { recursive: true, force: true });
}

informe('Pie de los correos sin el nombre del titular (migración 34)', ok, fail);
