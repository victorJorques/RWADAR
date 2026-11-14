/* =====================================================================
   RWAdar · las notificaciones web salen desde Supabase (migración 33)
   ---------------------------------------------------------------------
   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, 26,
   el refuerzo de sesión, 28, 28_REVERTIR, 29, la 30, la 31, la 32 (con la
   clave VAPID creada, como en producción) y la 33, con privilegios por
   defecto hostiles mientras se aplica.

   Auth, pg_net, Vault y pg_cron son dobles locales: no hay red ni
   Supabase. net.http_post guarda cada petición (dirección, cabeceras,
   cuerpo y espera) y net._http_response se rellena a mano o con un doble
   del servidor de la web que sigue el contrato de la 33: comprueba que las
   claves casan y que la pública es la de RWAdar (la pide como anon con
   clave_publica_webpush_anon), cifra y firma con enviar-webpush.mjs y
   entrega en un servicio de push local que descifra lo que le llega. Los
   pasos de «Avisos a registrados (base)» (ensayo-33, aplicar-33,
   verificar y prueba-webpush) se ejecutan de verdad con bash, un doble de
   psql que pasa cada orden a PGlite (y después hace de pg_net) y un doble
   de sleep.

       node probar-webpush-supabase.mjs
   ===================================================================== */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { alta, baseCatalogoHistorico, filas, informe, sesion } from './pruebas-soporte.mjs';
import { ENDPOINT_VALIDO, enviarUno, generarClaves, prepararClaves } from './enviar-webpush.mjs';

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
const sinAlmohadillas = (t) => t.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const b64u = (b) => Buffer.from(b).toString('base64url');
const hkdf = (sal, ikm, info, largo) => Buffer.from(crypto.hkdfSync('sha256', ikm, sal, info, largo));

const SQL30 = leer('db/30_avisos_registrados.sql');
const SQL31 = leer('db/31_correo_lettermint.sql');
const SQL32 = leer('db/32_notificaciones.sql');
const SQL33 = leer('db/33_webpush_supabase.sql');
const MIGRACION33 = leer('supabase/migrations/20261112170000_webpush_supabase.sql');
const VERIFICAR30 = leer('db/30_avisos_registrados_verificar.sql');
const VERIFICAR31 = leer('db/31_correo_lettermint_verificar.sql');
const VERIFICAR32 = leer('db/32_notificaciones_verificar.sql');
const VERIFICAR33 = leer('db/33_webpush_supabase_verificar.sql');
const PRUEBA33 = leer('db/33_webpush_supabase_prueba.sql');
const ACTIVAR_PUSH = leer('db/30_avisos_registrados_activar_push.sql');
const APAGAR = leer('db/30_avisos_registrados_apagar.sql');
const BASE = leer('../.github/workflows/avisos-base.yml');
const WEB = leer('../.github/workflows/notificaciones-web.yml');
const AVISAR = leer('../.github/workflows/avisar-novedad.yml');
const PKG = JSON.parse(leer('package.json'));
const VERSION = 'novedades-v2-2026-11-06';
const URL_SERVIDOR = 'https://rwadar.pages.dev/api/interno/webpush';
const PRUEBA_TITULO = 'Prueba de RWAdar';
const PRUEBA_TEXTO = 'Si ves esto, las notificaciones funcionan en este móvil.';
const funcionDe = (sql, nombre) => sql.match(new RegExp(`create or replace function ${nombre.replace('.', '\\.')}\\([\\s\\S]*?\\n\\$funcion\\$;`))[0];

// Lo único que la 33 añade a procesar() de la 30: tras el bloque de Expo.
const ANCLA = "      raise warning 'rwadar_novedades: envío de push omitido (sqlstate %)', sqlstate;\n    end;\n";
const BLOQUE_33 = [
  '    -- Notificaciones web (33): con el mismo interruptor, el mismo cerrojo y',
  '    -- su propia tanda. Primero lo que respondió el servidor de la web y',
  '    -- después lo nuevo; cada paso en su bloque, como los de Expo.',
  '    begin',
  '      v_n := rwadar_novedades.leer_webpush();',
  "      v_resultado := v_resultado || jsonb_build_object('webpush_leidos', v_n);",
  '    exception when others then',
  "      v_resultado := v_resultado || jsonb_build_object('fallo_lectura_webpush', sqlstate);",
  "      raise warning 'rwadar_novedades: lectura de notificaciones web omitida (sqlstate %)', sqlstate;",
  '    end;',
  '    begin',
  '      v_n := rwadar_novedades.enviar_webpush();',
  "      v_resultado := v_resultado || jsonb_build_object('webpush_enviados', v_n);",
  '    exception when others then',
  "      v_resultado := v_resultado || jsonb_build_object('fallo_envio_webpush', sqlstate);",
  "      raise warning 'rwadar_novedades: envío de notificaciones web omitido (sqlstate %)', sqlstate;",
  '    end;',
  '',
].join('\n');

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
// Las variables -v nombre=valor de una llamada a psql (no las de ON_ERROR_STOP).
const variablesPsql = (argv) => Object.fromEntries(argv.flatMap((a, i) =>
  (argv[i - 1] === '-v' && /^[a-z_]+=/.test(a) ? [[a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]] : [])));
// Lo que hace psql con un archivo: sin metacomandos (\set…) y con cada
// :'variable' fuera de los bloques $…$ cambiada por su literal escapado.
const conVariablesPsql = (sql, variables) => sinComentarios(sql).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
  .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/)
  .map((trozo, i) => (i % 2 ? trozo : trozo.replace(/:'([a-z_]+)'/g, (_, nombre) => {
    if (!(nombre in variables)) throw new Error(`falta la variable ${nombre}`);
    return `'${String(variables[nombre]).replace(/'/g, "''")}'`;
  }))).join('');

let db;
let servidor;
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-webpush-supabase-'));
try {
/* =====================================================================
   1 · Revisión estática: copias, forma y lo que la 33 no toca
   ===================================================================== */
paso('la migración versionada 20261112170000 es una copia idéntica de db/33', MIGRACION33 === SQL33);
{
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la 33 empieza en «begin;» y termina en su único «commit;»; su verificador empieza en «begin transaction read only;» y termina en «rollback;»',
    primera(SQL33) === 'begin;' && (SQL33.match(/^commit;$/gm) || []).length === 1 && lineas(SQL33).at(-1) === 'commit;'
    && primera(VERIFICAR33) === 'begin transaction read only;' && lineas(VERIFICAR33).at(-1) === 'rollback;'
    && (VERIFICAR33.match(/^begin transaction read only;$/gm) || []).length === 1 && !/^commit;$/m.test(VERIFICAR33));
  const procesar30 = funcionDe(SQL30, 'rwadar_novedades.procesar');
  const procesar33 = funcionDe(SQL33, 'rwadar_novedades.procesar');
  paso('procesar() de la 33 es la de la 30 letra por letra, más leer_webpush() y enviar_webpush() dentro del bloque del push, justo después de Expo',
    procesar30.split(ANCLA).length === 2 && procesar33 === procesar30.replace(ANCLA, ANCLA + BLOQUE_33) && procesar33 !== procesar30);
  // Lo que la 33 añade suyo (procesar() es la de la 30, comprobada arriba).
  const codigo = sinComentarios(SQL33.replace(procesar33, ''));
  paso('la 33 no borra tablas, funciones ni columnas, no toca relojes, Vault ni las filas de la configuración (no la reinicia) y solo concede EXECUTE de clave_publica_webpush_anon a anon y authenticated',
    !/\bdrop\s+(table|function|trigger|schema|policy|index|column)\b/i.test(codigo)
    && !/cron\.|vault\.(create|update)_secret|insert\s+into\s+vault|update\s+rwadar_novedades\.configuracion|insert\s+into\s+rwadar_novedades\.configuracion|delete\s+from\s+rwadar_novedades\.(configuracion|preferencias|anuncios|historial_permiso|dispositivos|pushes|correos|envios_web)\b/i.test(codigo)
    && isDeepStrictEqual([...codigo.matchAll(/^grant .*$/gm)].map((m) => m[0]),
      ['grant execute on function public.clave_publica_webpush_anon() to anon, authenticated;'])
    && /revoke all on function public\.clave_publica_webpush_anon\(\) from public, anon, authenticated, service_role;/.test(codigo)
    && /revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;/.test(codigo));
  const reglas = (sql) => [...sql.matchAll(/'(\^https:\/\/\(fcm[^']+)'/g)].map((m) => m[1]);
  paso('webpush_encolar comprueba el endpoint con la misma regla que la tabla y la RPC de la 32 y que el remitente (solo https y los 4 servicios de push del contrato)',
    reglas(SQL33).length === 1 && reglas(SQL32).every((r) => r === reglas(SQL33)[0])
    && reglas(SQL33)[0] === ENDPOINT_VALIDO.source.replace(/\\\//g, '/'));
  const funciones = [...SQL33.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1]);
  // El cuerpo de cada función, sin su propia cabecera «create or replace…».
  const con = (texto) => funciones.filter((n) => funcionDe(SQL33, n).split('\n').slice(1).join('\n').includes(texto));
  paso('solo webpush_encolar llama a net.http_post y lee RWADAR_VAPID_PRIVADA; el envío y la prueba pasan por ella',
    isDeepStrictEqual(con('net.http_post('), ['rwadar_novedades.webpush_encolar'])
    && isDeepStrictEqual(con('RWADAR_VAPID_PRIVADA'), ['rwadar_novedades.webpush_encolar'])
    && isDeepStrictEqual(con('rwadar_novedades.webpush_encolar('), ['rwadar_novedades.enviar_webpush', 'rwadar_novedades.webpush_prueba_supabase']));
  paso('el SQL de la prueba (33_webpush_supabase_prueba.sql) solo usa la variable peticiones, como literal, en un SELECT',
    isDeepStrictEqual([...new Set([...sinComentarios(PRUEBA33).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))], ['peticiones'])
    && /^select r ->> 'envios'/m.test(PRUEBA33) && !/\b(insert|update|delete|create|alter|grant)\b/i.test(sinComentarios(PRUEBA33)));
  paso('npm test de rwadar-app ejecuta esta prueba justo después de la de notificaciones',
    PKG.scripts.test.includes('node probar-avisos-registrados.mjs && node probar-notificaciones.mjs && node probar-webpush-supabase.mjs &&'));
}

/* =====================================================================
   2 · La cadena de producción (30, 31 y 32 con la clave VAPID)
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
await db.exec(SQL31);
{
  const e = await error(() => db.exec(SQL33));
  await db.exec('rollback');
  paso('sin la 32, la 33 se niega (55000) y no deja nada',
    e?.code === '55000' && /falta aplicar antes 32_notificaciones/.test(e.message)
    && (await una(db, "select to_regprocedure('rwadar_novedades.enviar_webpush(integer)') f")).f === null);
}
await db.exec(SQL32);
// Como en producción: la clave VAPID creada (crear-vapid) y el push apagado.
const VAPID = generarClaves();
await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_VAPID_PRIVADA', '${VAPID.privada}');
  update rwadar_novedades.configuracion set webpush_clave_publica = '${VAPID.publica}' where unica`);
const CLAVES = prepararClaves(VAPID.privada, VAPID.publica);

const sesiones = new Map();
const como = async (u, extras = {}) => {
  await sesion(db);
  if (!sesiones.has(u.id)) {
    const [s] = await filas(db, 'insert into auth.sessions(id, user_id) values (gen_random_uuid(), $1) returning id', [u.id]);
    sesiones.set(u.id, s.id);
  }
  const ahora = Number((await una(db, 'select floor(extract(epoch from now()))::bigint t')).t);
  const claims = { sub: u.id, role: 'authenticated', session_id: sesiones.get(u.id), exp: ahora + 3600,
    is_anonymous: false, amr: [{ method: 'password', timestamp: ahora }], ...extras };
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await sesion(db, u.id, 'authenticated');
};
const codigo = async (fn) => (await error(fn))?.code ?? null;
const verificador = async (sql, prefijo) => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(sql, { onNotice: (n) => avisos.push(n.message) }));
  if (e) { await db.exec('rollback'); return { ok: false, error: e.message }; }
  const aviso = avisos.find((a) => a.startsWith(prefijo));
  return { ok: !!aviso, aviso };
};
const verificar30 = () => verificador(VERIFICAR30, 'RWAdar 30 OK');
const verificar31 = () => verificador(VERIFICAR31, 'RWAdar 31 OK');
const verificar32 = () => verificador(VERIFICAR32, 'RWAdar 32 OK');
const verificar33 = () => verificador(VERIFICAR33, 'RWAdar 33 OK');

/* =====================================================================
   3 · Dobles: servicio de push, servidor de la web, pg_net, psql y sleep
   ===================================================================== */
// Servicio de push local (/push/<host>/<ruta>): cada navegador de la prueba
// tiene su par de claves y su secreto, para descifrar lo que le llega.
const navegadores = new Map();   // endpoint → { ua, auth, p256dh }
const respuestasPush = new Map(); // endpoint → estado HTTP (201 si no se dice)
const recibidos = [];
const navegador = (endpoint) => {
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const n = { ua, auth: crypto.randomBytes(16), p256dh: ua.getPublicKey('base64url') };
  navegadores.set(endpoint, n);
  return { endpoint, p256dh: n.p256dh, auth: n.auth.toString('base64url') };
};
const descifrar = (cuerpo, n) => {
  const sal = cuerpo.subarray(0, 16);
  const idlen = cuerpo[20];
  const publicaServidor = cuerpo.subarray(21, 21 + idlen);
  const registro = cuerpo.subarray(21 + idlen);
  const secreto = n.ua.computeSecret(publicaServidor);
  const ikm = hkdf(n.auth, secreto, Buffer.concat([Buffer.from('WebPush: info\0'), n.ua.getPublicKey(), publicaServidor]), 32);
  const cek = hkdf(sal, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(sal, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(registro.subarray(-16));
  const claro = Buffer.concat([d.update(registro.subarray(0, -16)), d.final()]);
  let fin = claro.length - 1;
  while (fin >= 0 && claro[fin] === 0) fin--;
  if (claro[fin] !== 2) throw new Error('sin delimitador 0x02');
  return claro.subarray(0, fin).toString('utf8');
};
const comprobarVapid = (cabecera, audiencia) => {
  const m = /^vapid t=([^,]+), k=([A-Za-z0-9_-]+)$/.exec(cabecera || '');
  if (!m) return { ok: false, k: null };
  const [h, d, f] = m[1].split('.');
  const k = Buffer.from(m[2], 'base64url');
  const clave = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(k.subarray(1, 33)), y: b64u(k.subarray(33)) } });
  const datos = JSON.parse(Buffer.from(d, 'base64url'));
  return { k: m[2], ok: crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: clave, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'))
    && datos.aud === audiencia && datos.sub === 'mailto:rwadares@gmail.com' };
};

// psql emulado sobre PGlite: -c con su consulta, o -f con las variables -v
// sustituidas como lo hace psql; json y jsonb salen con el texto de
// Postgres. Después hace de pg_net: atiende lo que haya quedado en la cola.
const llamadasPsql = [];
const formato = (v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 't' : 'f') : String(v));
const psqlDoble = async (argv) => {
  llamadasPsql.push(argv);
  const i = argv.indexOf('-c');
  const j = argv.indexOf('-f');
  const archivo = j >= 0 ? path.resolve(raizRepo, argv[j + 1]) : null;
  const sql = archivo ? conVariablesPsql(fs.readFileSync(archivo, 'utf8'), variablesPsql(argv)) : argv[i + 1];
  await sesion(db);
  const avisos = [];
  try {
    const resultados = await db.exec(sql, { rowMode: 'array', parsers: { 114: (x) => x, 3802: (x) => x },
      onNotice: (n) => avisos.push(`${n.severity}:  ${n.message}\n`) });
    const ultimo = [...resultados].reverse().find((r) => r.fields?.length);
    await atenderPgNet();
    return { estado: 0, stdout: ultimo ? ultimo.rows.map((f) => f.map(formato).join('|')).join('\n') + '\n' : '', stderr: avisos.join('') };
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    return { estado: archivo ? 3 : 1, stdout: '', stderr: `${avisos.join('')}ERROR:  ${e.message}\n` };
  }
};
servidor = http.createServer(async (req, res) => {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  const cuerpo = Buffer.concat(trozos);
  try {
    if (req.url === '/psql') {
      res.end(JSON.stringify(await psqlDoble(JSON.parse(cuerpo).argv)));
      return;
    }
    const [, , host, ...resto] = req.url.split('/');
    const endpoint = `https://${host}/${resto.join('/')}`;
    const n = navegadores.get(endpoint);
    let claro = null;
    try { claro = n ? descifrar(cuerpo, n) : null; } catch { claro = null; }
    const firma = comprobarVapid(req.headers.authorization, `https://${host}`);
    recibidos.push({ endpoint, cabeceras: req.headers, claro, vapid: firma.ok, k: firma.k });
    res.statusCode = respuestasPush.get(endpoint) ?? 201;
    res.end();
  } catch (e) {
    res.statusCode = 599;
    res.end(String(e.message));
  }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const LOCAL = `http://127.0.0.1:${servidor.address().port}`;
const fetchLocal = (url, opciones) => { const u = new URL(url); return fetch(`${LOCAL}/push/${u.host}${u.pathname}${u.search}`, opciones); };

// El servidor de la web (/api/interno/webpush), con el contrato de la 33:
// las dos claves casan y la pública es la de RWAdar (la pide como anon);
// cifra, firma y entrega con enviar-webpush.mjs; responde 200 {"codigo": n}.
const servidorWeb = async ({ url, headers, body }) => {
  const cab = headers || {};
  if (url !== URL_SERVIDOR || cab['content-type'] !== 'application/json') return { status_code: 400, content: '{"error":"peticion"}' };
  let claves;
  try { claves = prepararClaves(cab['x-rwadar-vapid-privada'], cab['x-rwadar-vapid-publica']); } catch {
    return { status_code: 403, content: '{"error":"claves"}' };
  }
  let oficial;
  try {
    await sesion(db, null, 'anon');
    oficial = (await una(db, 'select public.clave_publica_webpush_anon() k')).k;
  } finally { await sesion(db); }
  if (oficial !== cab['x-rwadar-vapid-publica']) return { status_code: 403, content: '{"error":"clave_ajena"}' };
  const codigo = await enviarUno(body, claves, { fetch: fetchLocal });
  return { status_code: 200, content: JSON.stringify({ codigo }) };
};
// pg_net: cada petición nueva al servidor de la web recibe su respuesta en
// net._http_response (la del doble del servidor, o la que diga la prueba
// para ese endpoint). Las de Expo se quedan sin respuesta.
const respuestasServidor = new Map(); // endpoint → { status_code, content, error_msg }
let pgNetActivo = true;
let ultimaAtendida = 0;
const atenderPgNet = async () => {
  if (!pgNetActivo) return 0;
  await sesion(db);
  const nuevas = await filas(db, 'select * from net.http_request_queue where id > $1 order by id', [ultimaAtendida]);
  let n = 0;
  for (const p of nuevas) {
    ultimaAtendida = Number(p.id);
    if (p.url !== URL_SERVIDOR) continue;
    const r = respuestasServidor.get(p.body?.endpoint) ?? await servidorWeb(p);
    await sesion(db);
    await db.query('insert into net._http_response(id, status_code, content, error_msg) values ($1, $2, $3, $4)',
      [p.id, r.status_code ?? null, r.content ?? null, r.error_msg ?? null]);
    n++;
  }
  return n;
};

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
  fs.writeFileSync(path.join(dir, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const githubEnv = path.join(dir, 'github-env');
  const resumen = path.join(dir, 'resumen.md');
  fs.writeFileSync(githubEnv, '');
  fs.writeFileSync(resumen, '');
  const bloque = pasoDe(yaml, nombre);
  if (!bloque) throw new Error(`el flujo no tiene el paso «${nombre}»`);
  const desde = llamadasPsql.length;
  const r = await new Promise((resolver) => {
    const hijo = spawn('bash', ['-c', scriptDe(bloque)], { cwd: raizRepo, env: {
      PATH: `${dir}:${process.env.PATH}`, HOME: dir, GITHUB_ENV: githubEnv, GITHUB_STEP_SUMMARY: resumen,
      PSQL_DOBLE_URL: `${LOCAL}/psql`, SUPABASE_DB_URL: 'postgresql://doble-local/sin-red', ...entorno } });
    let stdout = '', stderr = '';
    hijo.stdout.on('data', (t) => { stdout += t; });
    hijo.stderr.on('data', (t) => { stderr += t; });
    hijo.on('close', (estado) => resolver({ estado, stdout, stderr }));
  });
  const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { ...r, texto: `${r.stdout}${r.stderr}`, salida, resumen: fs.readFileSync(resumen, 'utf8'), llamadas: llamadasPsql.slice(desde) };
};
const V30_RUTA = 'rwadar-app/db/30_avisos_registrados_verificar.sql';
const V31_RUTA = 'rwadar-app/db/31_correo_lettermint_verificar.sql';
const V32_RUTA = 'rwadar-app/db/32_notificaciones_verificar.sql';
const V33_RUTA = 'rwadar-app/db/33_webpush_supabase_verificar.sql';
const compruebaBase = (entradas) => correPaso(BASE, 'Comprobar la acción', { ACCION: 'ensayo-33', CONFIRMAR: '', REMITENTE: '', ...entradas });

/* =====================================================================
   4 · ensayo-33 del flujo y la 33 aplicada dos veces
   ===================================================================== */
if (hayBash) {
  const comprobar = await compruebaBase({ ACCION: 'ensayo-33' });
  const ensayo = await correPaso(BASE, 'Ensayo sin cambiar nada (se deshace al final)', comprobar.salida);
  await sesion(db);
  paso(`el ensayo-33 del flujo, ejecutado de verdad, monta la 33 + los verificadores 30, 31, 32 y 33 + rollback, pasa sobre la cadena de producción y no deja nada (${ensayo.estado === 0 ? 'OK' : ensayo.texto.trim()})`,
    comprobar.estado === 0 && ensayo.estado === 0 && ensayo.llamadas.length === 1
    && ensayo.texto.includes('ENSAYO CORRECTO: 33_webpush_supabase.sql y sus verificadores pasan')
    && ['30', '31', '32'].every((n) => new RegExp(`NOTICE: {2}RWAdar ${n} OK`).test(ensayo.stderr))
    && /NOTICE: {2}RWAdar 33 OK: las notificaciones web salen desde Supabase .*0 envío\(s\) esperando respuesta \(0 de hace más de una hora\), clave VAPID creada, push apagado/.test(ensayo.stderr)
    && (await una(db, "select to_regprocedure('rwadar_novedades.enviar_webpush(integer)') f")).f === null
    && (await numero(db, "select count(*) from pg_attribute where attrelid = 'rwadar_novedades.envios_web'::regclass and attname = 'peticion_id'")) === 0
    && !(await una(db, "select pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure) d")).d.includes('webpush'));
}
await db.exec(HOSTIL);
await db.exec(SQL33);
await db.exec('grant execute on function rwadar_novedades.enviar_webpush(integer) to service_role; grant execute on function public.clave_publica_webpush_anon() to service_role');
await db.exec(SQL33);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
{
  const config = await una(db, 'select * from rwadar_novedades.configuracion');
  paso('la 33 se aplica dos veces; la segunda no reinicia la configuración (clave pública y push apagado siguen) y vuelve a cerrar lo abierto a mano entre medias',
    config.webpush_clave_publica === VAPID.publica && config.version_consentimiento === VERSION && !config.push_habilitado
    && !(await una(db, "select has_function_privilege('service_role', 'rwadar_novedades.enviar_webpush(integer)', 'EXECUTE') a")).a
    && !(await una(db, "select has_function_privilege('service_role', 'public.clave_publica_webpush_anon()', 'EXECUTE') a")).a);
  const v = [await verificar30(), await verificar31(), await verificar32(), await verificar33()];
  paso(`los verificadores 30, 31, 32 y 33 pasan tras la 33 («${v[3].aviso || v[3].error}»)`,
    v.every((x) => x.ok) && /clave VAPID creada, push apagado$/.test(v[3].aviso));
  const internas = await filas(db, `select p.oid::regprocedure::text firma, p.prosecdef, p.proconfig,
      p.proowner = (select q.proowner from pg_proc q where q.oid = 'rwadar_novedades.procesar()'::regprocedure) dueno,
      bool_or(has_function_privilege(r, p.oid, 'EXECUTE')) abierta
    from pg_proc p, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
   where p.oid in ('rwadar_novedades.webpush_codigo(integer,text)'::regprocedure, 'rwadar_novedades.webpush_encolar(jsonb)'::regprocedure,
     'rwadar_novedades.enviar_webpush(integer)'::regprocedure, 'rwadar_novedades.leer_webpush()'::regprocedure,
     'rwadar_novedades.procesar()'::regprocedure, 'rwadar_novedades.webpush_prueba_supabase()'::regprocedure,
     'rwadar_novedades.webpush_prueba_supabase_resultado(jsonb)'::regprocedure)
   group by 1, 2, 3, 4`);
  paso('las 7 funciones internas de la 33 (y procesar) son definer, con search_path vacío y el dueño de procesar(), y nadie más las ejecuta',
    internas.length === 7 && internas.every((f) => f.prosecdef && f.proconfig?.some((x) => /^search_path=(""|)$/.test(x)) && f.dueno && !f.abierta));
  const columnas = await filas(db, `select attname, format_type(atttypid, atttypmod) tipo from pg_attribute
    where attrelid = 'rwadar_novedades.envios_web'::regclass and attname in ('peticion_id', 'peticion_el') order by attname`);
  paso('envios_web tiene peticion_id (bigint) y peticion_el (timestamptz), las dos o ninguna',
    isDeepStrictEqual(columnas.map((c) => `${c.attname} ${c.tipo}`), ['peticion_el timestamp with time zone', 'peticion_id bigint'])
    && (await codigo(() => db.query('insert into rwadar_novedades.envios_web (anuncio_id, suscripcion_id, peticion_id) values (0, 0, 1)'))) === '23514'
    && (await codigo(() => db.query('insert into rwadar_novedades.envios_web (anuncio_id, suscripcion_id, peticion_el) values (0, 0, now())'))) === '23514');
}

/* =====================================================================
   5 · Permisos: anon solo la RPC de la clave pública
   ===================================================================== */
const ana = await alta(db, 'ana-ws@ejemplo.test');
const beto = await alta(db, 'beto-ws@ejemplo.test');
const vic = await alta(db, 'vic-admin-ws@ejemplo.test');
const dani = await alta(db, 'dani-ws@ejemplo.test');
const eva = await alta(db, 'eva-ws@ejemplo.test');
await sesion(db);
await db.query('update public.perfiles set es_admin = true where id = $1', [vic.id]);
{
  await sesion(db, null, 'anon');
  const claveAnon = (await una(db, 'select public.clave_publica_webpush_anon() k')).k;
  const anonNo = [];
  for (const sql of ['select rwadar_novedades.enviar_webpush(1)', 'select rwadar_novedades.leer_webpush()',
    "select rwadar_novedades.webpush_encolar('[]')", 'select rwadar_novedades.webpush_prueba_supabase()',
    "select rwadar_novedades.webpush_prueba_supabase_resultado('[]')", "select rwadar_novedades.webpush_codigo(200, '{}')",
    'select rwadar_novedades.procesar()', 'select public.clave_publica_webpush()', 'select * from rwadar_novedades.envios_web',
    'select * from net._http_response']) anonNo.push(await codigo(() => db.query(sql)));
  await como(ana);
  const claveAut = (await una(db, 'select public.clave_publica_webpush_anon() k')).k;
  const autNo = [];
  for (const sql of ['select rwadar_novedades.enviar_webpush(1)', 'select rwadar_novedades.webpush_prueba_supabase()',
    "select rwadar_novedades.webpush_prueba_supabase_resultado('[]')"]) autNo.push(await codigo(() => db.query(sql)));
  await sesion(db, null, 'service_role');
  const servicio = await codigo(() => db.query('select public.clave_publica_webpush_anon()'));
  await sesion(db);
  paso('anon y authenticated leen la clave pública (clave_publica_webpush_anon) y nada más de la 33 (42501); service_role tampoco la ejecuta',
    claveAnon === VAPID.publica && claveAut === VAPID.publica
    && [...anonNo, ...autNo, servicio].every((c) => c === '42501'));
  // Todas las funciones de las migraciones de avisos que anon puede ejecutar.
  const deAvisos = [...new Set([SQL30, SQL31, SQL32, SQL33].flatMap((t) => [...t.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1])))];
  const deAnon = await filas(db, `select p.oid::regprocedure::text f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname || '.' || p.proname = any($1) and has_function_privilege('anon', p.oid, 'EXECUTE') order by 1`, [deAvisos]);
  paso('de todas las funciones de las migraciones 30 a 33, anon solo ejecuta la baja por enlace (30) y la clave pública (33)',
    isDeepStrictEqual(deAnon.map((f) => f.f), ['baja_avisos(uuid)', 'clave_publica_webpush_anon()']));
  const def = (await una(db, "select p.prosrc s, p.provolatile v, p.prorettype::regtype::text t from pg_proc p where p.oid = 'public.clave_publica_webpush_anon()'::regprocedure"));
  paso('clave_publica_webpush_anon solo devuelve configuracion.webpush_clave_publica (stable, texto, sin argumentos)',
    /^\s*select c\.webpush_clave_publica from rwadar_novedades\.configuracion c where c\.unica\s*$/.test(def.s) && def.v === 's' && def.t === 'text');
}

/* =====================================================================
   6 · Envío desde procesar(): a quién, qué y por dónde
   ===================================================================== */
const registrar = async (u, s) => { await como(u); try { return (await una(db, 'select public.registrar_aviso_webpush($1, $2, $3) r', [s.endpoint, s.p256dh, s.auth])).r; } finally { await sesion(db); } };
const consentir = async (u, version = VERSION) => {
  await como(u); await db.query("select public.configurar_avisos_novedades(true, $1, 'web')", [VERSION]); await sesion(db);
  if (version !== VERSION) await db.query('update rwadar_novedades.preferencias set version = $1 where usuario_id = $2', [version, u.id]);
};
const anunciar = async (clave, titulo, texto, enlace = 'https://rwadar.pages.dev/') => {
  await sesion(db);
  return Number((await una(db, "select rwadar_novedades.anunciar('novedad', $1, $2, $3, $4) id", [clave, titulo, texto, enlace])).id);
};
const enviar = async (tanda = 50) => { await sesion(db); return Number((await una(db, 'select rwadar_novedades.enviar_webpush($1) n', [tanda])).n); };
const leerWeb = async () => { await sesion(db); return Number((await una(db, 'select rwadar_novedades.leer_webpush() n')).n); };
const procesar = async () => {
  await sesion(db);
  const avisos = [];
  const r = (await db.query('select rwadar_novedades.procesar() r', [], { onNotice: (n) => avisos.push(n.message) })).rows[0].r;
  return { r, avisos };
};
const cola = async (desde) => { await sesion(db); return filas(db, 'select * from net.http_request_queue where id > $1 order by id', [desde]); };
const ultimaPeticion = async () => { await sesion(db); return numero(db, 'select coalesce(max(id), 0) from net.http_request_queue'); };
const envios = async (anuncio) => { await sesion(db); return filas(db, `select e.*, s.endpoint from rwadar_novedades.envios_web e
  join rwadar_novedades.suscripciones_web s on s.id = e.suscripcion_id where e.anuncio_id = $1 order by e.id`, [anuncio]); };
const fcm = (n) => `https://fcm.googleapis.com/fcm/send/${n}:APA91bH${crypto.randomBytes(24).toString('base64url')}`;
const apple = (n) => `https://web.push.apple.com/Q${n}${crypto.randomBytes(24).toString('base64url')}`;
const mozilla = (n) => `https://updates.push.services.mozilla.com/wpush/v2/gAAAA${n}${crypto.randomBytes(30).toString('base64url')}`;

const sAnaFcm = navegador(fcm('ana'));
const sAnaApple = navegador(apple('ana'));
const sBeto = navegador(mozilla('beto'));
const sVic = navegador(apple('vic'));
const sVic2 = navegador(fcm('vic'));
const sDani = navegador(fcm('dani'));
const sEva = navegador(mozilla('eva'));
for (const [u, s] of [[ana, sAnaFcm], [ana, sAnaApple], [beto, sBeto], [vic, sVic], [vic, sVic2], [dani, sDani], [eva, sEva]]) await registrar(u, s);
await consentir(ana);
await consentir(eva);
await consentir(dani, 'novedades-v1-2026-11-05');
// Un móvil de Expo de Ana: procesar() sigue mandando su push (lo de la 30).
await como(ana);
await db.query("select public.registrar_aviso_push($1, 'android')", [`ExponentPushToken[${'webpush33'.padEnd(22, 'x')}]`]);
await sesion(db);

let a2;
{
  const a1 = await anunciar('novedad:ws-apagado', 'Antes de encender', 'Este no sale por notificación web.');
  const antes = await ultimaPeticion();
  const n = await enviar();
  const { r } = await procesar();
  paso('con el push apagado, enviar_webpush no pide nada ni marca nada, y procesar() solo limpia («apagado»)',
    n === 0 && r.estado === 'apagado' && (await cola(antes)).length === 0 && (await envios(a1)).length === 0);
  await sesion(db);
  await db.exec(ACTIVAR_PUSH);
  paso('al encender el push (activar-push: el mismo interruptor que Expo), un anuncio publicado antes no sale por la web',
    (await enviar()) === 0 && (await envios(a1)).length === 0);

  a2 = await anunciar('novedad:ws-uno', 'La Academy tiene lecciones nuevas', 'Dos lecciones nuevas sobre tokenización.', 'https://rwadar.pages.dev/academy/');
  // Carla se suscribe después del anuncio: no le llega.
  const carla = await alta(db, 'carla-ws@ejemplo.test');
  await consentir(carla);
  await registrar(carla, navegador(fcm('carla')));
  const desde = await ultimaPeticion();
  const { r: r1, avisos } = await procesar();
  const peticiones = (await cola(desde)).filter((p) => p.url === URL_SERVIDOR);
  const destinos = peticiones.map((p) => p.body.endpoint).sort();
  paso(`procesar() (push encendido) pide al servidor de la web el anuncio nuevo solo para quien tiene el permiso vigente: Ana (2 navegadores) y Eva; ni Beto (sin permiso), ni Vic (administración sin permiso), ni Dani (versión antigua), ni Carla (se suscribió después) (${JSON.stringify(r1)})`,
    r1.estado === 'encendido' && r1.webpush_enviados === 3 && r1.webpush_leidos === 0 && !('fallo_envio_webpush' in r1)
    && isDeepStrictEqual(destinos, [sAnaFcm.endpoint, sAnaApple.endpoint, sEva.endpoint].sort()) && avisos.length === 0);
  const expo = (await cola(desde)).filter((p) => p.url === 'https://exp.host/--/api/v2/push/send');
  paso('lo de la 30 sigue en la misma vuelta: el push de Expo de Ana sale (prioridad alta de la 32) y procesar() informa de Expo y de la limpieza',
    expo.length >= 1 && expo.every((x) => x.body.priority === 'high') && expo.some((x) => x.body.title === 'La Academy tiene lecciones nuevas')
    && r1.push_enviados === expo.length && 'push_leidos' in r1 && 'limpiados' in r1 && 'repartidos' in r1);
  const p = peticiones.find((x) => x.body.endpoint === sAnaFcm.endpoint);
  paso('cada petición: POST a https://rwadar.pages.dev/api/interno/webpush con content-type y accept JSON, la privada en x-rwadar-vapid-privada y la pública en x-rwadar-vapid-publica, y 25 segundos de espera (el servidor: 8 s la clave y 10 s el push)',
    peticiones.every((x) => x.url === URL_SERVIDOR && x.timeout_milliseconds === 25000
      && isDeepStrictEqual(x.headers, { 'content-type': 'application/json', accept: 'application/json',
        'x-rwadar-vapid-privada': VAPID.privada, 'x-rwadar-vapid-publica': VAPID.publica })));
  paso('el cuerpo es exactamente {endpoint, p256dh, auth, carga} con la carga del contrato (la lista de avisos con la baja; etiqueta rwadar-<id>)',
    isDeepStrictEqual(p.body, { endpoint: sAnaFcm.endpoint, p256dh: sAnaFcm.p256dh, auth: sAnaFcm.auth,
      carga: { v: 1, titulo: 'La Academy tiene lecciones nuevas', texto: 'Dos lecciones nuevas sobre tokenización.',
        url: 'https://rwadar.pages.dev/?avisos=1', etiqueta: `rwadar-${a2}` } }));
  paso('la clave privada solo va en su cabecera: ni en la dirección, ni en el cuerpo, ni en los parámetros, ni en envios_web',
    peticiones.every((x) => !x.url.includes(VAPID.privada) && !JSON.stringify(x.body).includes(VAPID.privada)
      && !JSON.stringify(x.params ?? {}).includes(VAPID.privada)
      && Object.entries(x.headers).filter(([, v]) => String(v).includes(VAPID.privada)).length === 1)
    && !JSON.stringify(await envios(a2)).includes(VAPID.privada));
  const filasA2 = await envios(a2);
  paso('los envíos quedan «enviando», con un intento y el número de su petición de pg_net y su fecha',
    filasA2.length === 3 && filasA2.every((e) => e.estado === 'enviando' && e.intentos === 1 && e.peticion_el instanceof Date
      && peticiones.some((x) => Number(x.id) === Number(e.peticion_id) && x.body.endpoint === e.endpoint)));
  paso('otra vuelta antes de la respuesta no repite nada', (await enviar()) === 0 && (await cola(desde)).filter((x) => x.url === URL_SERVIDOR).length === 3);

  // De punta a punta: el doble del servidor de la web cifra, firma y entrega.
  const desdeRecibidos = recibidos.length;
  const atendidas = await atenderPgNet();
  const llegados = recibidos.slice(desdeRecibidos);
  paso('de punta a punta: el servidor de la web (doble con el contrato) acepta las claves, y cada navegador recibe su notificación firmada con la clave VAPID de RWAdar y descifra exactamente la carga',
    atendidas === 3 && isDeepStrictEqual(llegados.map((x) => x.endpoint).sort(), destinos)
    && llegados.every((x) => x.vapid && x.k === VAPID.publica && x.cabeceras.ttl === '86400' && x.cabeceras.urgency === 'high'
      && isDeepStrictEqual(JSON.parse(x.claro), { v: 1, titulo: 'La Academy tiene lecciones nuevas', texto: 'Dos lecciones nuevas sobre tokenización.',
        url: 'https://rwadar.pages.dev/?avisos=1', etiqueta: `rwadar-${a2}` })));
  const { r: r2 } = await procesar();
  const tras = await envios(a2);
  paso('la vuelta siguiente de procesar() lee las 3 respuestas (200 {"codigo": 201}): «enviado», con el código, la fecha y sin la petición',
    r2.webpush_leidos === 3 && r2.webpush_enviados === 0
    && tras.every((e) => e.estado === 'enviado' && e.codigo === 201 && e.enviado_el instanceof Date && e.peticion_id === null && e.peticion_el === null));
}
{
  // Tanda y forma.
  // Desde aquí Carla (suscrita después de a2) también recibe: 4 navegadores.
  const a3 = await anunciar('novedad:ws-tanda', 'Otra novedad', 'Para probar la tanda.');
  const uno = await enviar(1);
  const resto = await enviar(50);
  paso('la tanda limita cuántos se piden (1 y después los otros 3: Ana, Eva y Carla), y una tanda fuera de 1..100 se rechaza (22023)',
    uno === 1 && resto === 3 && (await envios(a3)).length === 4 && (await envios(a3)).every((e) => e.peticion_id !== null)
    && (await codigo(() => enviar(0))) === '22023' && (await codigo(() => enviar(101))) === '22023');
  await atenderPgNet();
  await leerWeb();
  // Sin clave pública no pide ni marca nada; con la pública y sin privada, se para.
  const a4 = await anunciar('novedad:ws-sin-clave', 'Sin clave', 'No sale sin la clave VAPID.');
  await db.exec('update rwadar_novedades.configuracion set webpush_clave_publica = null');
  const sinPublica = await enviar();
  await db.exec(`update rwadar_novedades.configuracion set webpush_clave_publica = '${VAPID.publica}'`);
  await db.exec("update vault.decrypted_secrets set name = 'APARTADA' where name = 'RWADAR_VAPID_PRIVADA'");
  const desde = await ultimaPeticion();
  const { r, avisos } = await procesar();
  const sinPrivada = await envios(a4);
  const colaSin = (await cola(desde)).filter((x) => x.url === URL_SERVIDOR);
  await sesion(db);
  await db.exec("update vault.decrypted_secrets set name = 'RWADAR_VAPID_PRIVADA' where name = 'APARTADA'");
  paso('sin clave pública, enviar_webpush no pide ni marca nada; sin la privada en Vault, procesar() avisa solo con el sqlstate (55000), deshace lo marcado y no pide nada',
    sinPublica === 0 && r.fallo_envio_webpush === '55000' && sinPrivada.length === 0 && colaSin.length === 0
    && isDeepStrictEqual(avisos, ['rwadar_novedades: envío de notificaciones web omitido (sqlstate 55000)']));
  const e = await error(async () => { await sesion(db); await db.exec("update vault.decrypted_secrets set decrypted_secret = 'corta' where name = 'RWADAR_VAPID_PRIVADA'"); await db.query('select rwadar_novedades.enviar_webpush(50)'); });
  await sesion(db);
  await db.exec(`update vault.decrypted_secrets set decrypted_secret = '${VAPID.privada}' where name = 'RWADAR_VAPID_PRIVADA'`);
  paso('con una privada sin forma, el error no lleva ningún valor', e?.code === '55000' && /falta la clave VAPID o no es válida/.test(e.message) && !e.message.includes('corta'));
  const { r: r2 } = await procesar();
  await atenderPgNet();
  await leerWeb();
  paso('arreglada la clave, la vuelta siguiente pide el anuncio y llega a los 4 navegadores',
    r2.webpush_enviados === 4 && (await envios(a4)).length === 4 && (await envios(a4)).every((x) => x.estado === 'enviado'));
}

/* =====================================================================
   7 · Lectura: lo que responde el servidor de la web
   ===================================================================== */
{
  // Tres cuentas más con 5 navegadores cada una: un caso por navegador.
  const deLectura = [];
  for (const n of [1, 2, 3]) {
    const u = await alta(db, `lectura${n}-ws@ejemplo.test`);
    await consentir(u);
    for (let i = 0; i < 5; i++) { const s = navegador(fcm(`lectura${n}-${i}`)); await registrar(u, s); deLectura.push(s.endpoint); }
  }
  const CASOS = [
    ['201', { status_code: 200, content: '{"codigo": 201}' }, { estado: 'enviado', codigo: 201 }],
    ['404', { status_code: 200, content: '{"codigo": 404}' }, null],
    ['410', { status_code: 200, content: '{"codigo":410}' }, null],
    ['429', { status_code: 200, content: '{"codigo": 429}' }, { estado: 'reintentar', codigo: 429 }],
    ['500 del servicio de push', { status_code: 200, content: '{"codigo": 500}' }, { estado: 'reintentar', codigo: 500 }],
    ['0 (el servicio no respondió)', { status_code: 200, content: '{"codigo": 0}' }, { estado: 'reintentar', codigo: 0 }],
    ['-1 (la entrada no sirve)', { status_code: 200, content: '{"codigo": -1}' }, { estado: 'fallido', codigo: -1 }],
    ['413', { status_code: 200, content: '{"codigo": 413}' }, { estado: 'fallido', codigo: 413 }],
    ['el servidor responde 400', { status_code: 400, content: '{"codigo": 201}' }, { estado: 'reintentar', codigo: null }],
    ['el servidor responde 500', { status_code: 500, content: '' }, { estado: 'reintentar', codigo: null }],
    ['200 sin JSON', { status_code: 200, content: 'no es JSON' }, { estado: 'reintentar', codigo: null }],
    ['200 con el código en texto', { status_code: 200, content: '{"codigo": "201"}' }, { estado: 'reintentar', codigo: null }],
    ['tiempo agotado (pg_net)', { status_code: null, content: null, error_msg: 'Timeout of 25000 ms reached' }, { estado: 'reintentar', codigo: null }],
    ['sin respuesta todavía', 'nada', { estado: 'enviando', codigo: null }],
    ['sin respuesta a los 11 minutos', 'vieja', { estado: 'reintentar', codigo: null }],
  ];
  const a5 = await anunciar('novedad:ws-lectura', 'Lectura de respuestas', 'Un caso por navegador.');
  pgNetActivo = false;
  const pedidos = await enviar(100);
  pgNetActivo = true;
  const porEndpoint = Object.fromEntries((await envios(a5)).map((e) => [e.endpoint, e]));
  await sesion(db);
  for (const [i, [, respuesta]] of CASOS.entries()) {
    const e = porEndpoint[deLectura[i]];
    if (respuesta === 'vieja') await db.query("update rwadar_novedades.envios_web set peticion_el = now() - interval '11 minutes' where id = $1", [e.id]);
    else if (respuesta !== 'nada') {
      await db.query('insert into net._http_response(id, status_code, content, error_msg) values ($1, $2, $3, $4)',
        [e.peticion_id, respuesta.status_code, respuesta.content, respuesta.error_msg ?? null]);
    }
  }
  // Los demás (Ana, Eva y Carla), aceptados.
  const otros = Object.values(porEndpoint).filter((e) => !deLectura.includes(e.endpoint));
  for (const e of otros) {
    await db.query('insert into net._http_response(id, status_code, content) values ($1, 200, \'{"codigo": 201}\')', [e.peticion_id]);
  }
  ultimaAtendida = await ultimaPeticion();
  const leidos = await leerWeb();
  const tras = Object.fromEntries((await envios(a5)).map((e) => [e.endpoint, e]));
  const mal = CASOS.map(([nombre, , esperado], i) => {
    const e = tras[deLectura[i]];
    if (esperado === null) return e ? nombre : null;
    const bien = e && e.estado === esperado.estado && e.codigo === esperado.codigo && e.intentos === 1
      && (esperado.estado === 'enviando' ? e.peticion_id !== null : e.peticion_id === null && e.peticion_el === null)
      && (esperado.estado === 'enviado') === (e.enviado_el instanceof Date);
    return bien ? null : `${nombre}: ${e ? `${e.estado}/${e.codigo}/${e.intentos}` : 'borrado'}`;
  }).filter(Boolean);
  await sesion(db);
  const borradas = await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web where endpoint = any($1)', [[deLectura[1], deLectura[2]]]);
  paso(`leer_webpush aplica las reglas de la 32 a cada respuesta: 201 enviado; 404 y 410 borran la suscripción; 429, 500 y 0 a reintentar con su código; -1 y 413 fallidos; un 400 o 500 del servidor, un 200 sin la forma, el tiempo agotado y la falta de respuesta a los 10 minutos, a reintentar sin código; lo reciente sin respuesta espera (${pedidos} pedidos, ${leidos} leídos${mal.length ? ` · mal: ${mal.join(' | ')}` : ''})`,
    otros.length === 4 && pedidos === 15 + otros.length && leidos === 14 + otros.length && mal.length === 0 && borradas === 0
    && otros.every((e) => tras[e.endpoint].estado === 'enviado'));
  const tabla = [[200, '{"codigo": 201}', 201], [200, '{"codigo": 201, "otro": 1}', 201], [200, '{"codigo": -1}', -1], [200, '{"codigo": 0}', 0],
    [200, '{"codigo": 201.5}', null], [200, '{"codigo": 700}', null], [200, '{"codigo": -2}', null], [200, '[201]', null],
    [200, '{"otro": 201}', null], [200, '{"codigo": null}', null], [201, '{"codigo": 201}', null], [200, null, null],
    [null, '{"codigo": 201}', null], [200, `{"codigo": 201, "relleno": "${'x'.repeat(200)}"}`, null]];
  const malTabla = [];
  for (const [estado, contenido, esperado] of tabla) {
    const v = (await una(db, 'select rwadar_novedades.webpush_codigo($1, $2) c', [estado, contenido])).c;
    if (v !== esperado) malTabla.push(`${estado} ${contenido?.slice(0, 30)} → ${v}`);
  }
  paso(`webpush_codigo solo acepta 200 con {"codigo": n} entero entre -1 y 599 (${tabla.length} casos)${malTabla.length ? ` · mal: ${malTabla.join(' | ')}` : ''}`, malTabla.length === 0);

  // Reintentos: a los 5 minutos, con otra petición y un intento más; al
  // tercer fallo del servidor, fallido; y no vuelven.
  const reintentar = Object.values(tras).filter((e) => e.estado === 'reintentar').map((e) => e.id);
  const ya = await enviar(100);
  const atrasar = async () => { await sesion(db); await db.query("update rwadar_novedades.envios_web set actualizado_el = now() - interval '6 minutes' where estado = 'reintentar'"); };
  await atrasar();
  const desde = await ultimaPeticion();
  respuestasServidor.clear();
  for (const s of deLectura) respuestasServidor.set(s, { status_code: 503, content: 'Service Unavailable' });
  const segunda = await enviar(100);
  const peticiones2 = (await cola(desde)).filter((x) => x.url === URL_SERVIDOR);
  const tras2 = (await envios(a5)).filter((e) => reintentar.includes(e.id));
  await atenderPgNet();
  await leerWeb();
  await atrasar();
  const tercera = await enviar(100);
  await atenderPgNet();
  await leerWeb();
  await atrasar();
  const cuarta = await enviar(100);
  const fin = (await envios(a5)).filter((e) => reintentar.includes(e.id));
  respuestasServidor.clear();
  paso(`un reintento no sale antes de 5 minutos; después vuelve con otra petición y un intento más; al tercer fallo del servidor queda «fallido» y ya no vuelve (${reintentar.length} a reintentar)`,
    reintentar.length === 9 && ya === 0 && segunda === 9 && peticiones2.length === 9
    && tras2.every((e) => e.estado === 'enviando' && e.intentos === 2 && e.codigo === null && peticiones2.some((x) => Number(x.id) === Number(e.peticion_id)))
    && tercera === 9 && cuarta === 0 && fin.every((e) => e.estado === 'fallido' && e.intentos === 3 && e.peticion_id === null));
  // Lo que quedó sin respuesta, a los 10 minutos.
  const esperando = Object.values(tras).find((e) => e.estado === 'enviando');
  await sesion(db);
  await db.query("update rwadar_novedades.envios_web set peticion_el = now() - interval '9 minutes' where id = $1", [esperando.id]);
  const a9 = await leerWeb();
  await db.query("update rwadar_novedades.envios_web set peticion_el = now() - interval '10 minutes 1 second' where id = $1", [esperando.id]);
  const a10 = await leerWeb();
  const fila = (await envios(a5)).find((e) => e.id === esperando.id);
  paso('una petición sin respuesta espera hasta 10 minutos; pasados, vuelve a la cola (reintentar, sin petición)',
    a9 === 0 && a10 === 1 && fila.estado === 'reintentar' && fila.peticion_id === null && fila.intentos === 1);
  await sesion(db);
  await db.query("update rwadar_novedades.envios_web set estado = 'enviado', enviado_el = now() where anuncio_id = $1 and estado = 'reintentar'", [a5]);
}
{
  // Un envío sin forma (no pasa con las tablas: se fuerza con una carga
  // ajena) no se pide y queda fallido (-1).
  await sesion(db);
  const encolado = (await una(db, `select rwadar_novedades.webpush_encolar($1::jsonb) r`, [JSON.stringify([
    { id: 'e999001', endpoint: 'https://evil.example/x', p256dh: sAnaFcm.p256dh, auth: sAnaFcm.auth, carga: { v: 1, titulo: 't', texto: 't', url: 'https://rwadar.pages.dev/', etiqueta: 'x' } },
    { id: 'e999002', endpoint: sAnaFcm.endpoint, p256dh: sAnaFcm.p256dh, auth: sAnaFcm.auth, carga: { v: 1, titulo: 't', texto: 't', url: 'https://evil.example/', etiqueta: 'x' } },
    { id: 'e999003', endpoint: sAnaFcm.endpoint, p256dh: 'corta', auth: sAnaFcm.auth, carga: { v: 1, titulo: 't', texto: 't', url: 'https://rwadar.pages.dev/', etiqueta: 'x' } },
    { id: 'e999004', endpoint: sAnaFcm.endpoint, p256dh: sAnaFcm.p256dh, auth: sAnaFcm.auth, carga: { v: 2, titulo: 't', texto: 't', url: 'https://rwadar.pages.dev/', etiqueta: 'x' } },
  ])])).r;
  const malId = await codigo(() => db.query(`select rwadar_novedades.webpush_encolar('[{"id": "x1"}]'::jsonb)`));
  const noLista = await codigo(() => db.query(`select rwadar_novedades.webpush_encolar('{}'::jsonb)`));
  await db.exec('rollback').catch(() => {});
  paso('webpush_encolar no pide nada sin forma (otro host, una url ajena en la carga, claves raras, otra versión): peticion null; un id raro o algo que no es lista se rechaza (22023)',
    encolado.every((x) => x.peticion === null) && encolado.length === 4 && malId === '22023' && noLista === '22023');
}

/* =====================================================================
   8 · Prueba de administración desde Supabase
   ===================================================================== */
const pruebaSupabase = async () => { await sesion(db); return (await una(db, 'select rwadar_novedades.webpush_prueba_supabase() p')).p; };
const resultadoPrueba = async (p) => { await sesion(db); return (await una(db, 'select rwadar_novedades.webpush_prueba_supabase_resultado($1::jsonb) r', [JSON.stringify(p)])).r; };
{
  await sesion(db);
  await db.exec(APAGAR);
  const enviosAntes = await numero(db, 'select count(*) from rwadar_novedades.envios_web');
  const desde = await ultimaPeticion();
  pgNetActivo = false;
  const pares = await pruebaSupabase();
  pgNetActivo = true;
  const peticiones = (await cola(desde)).filter((x) => x.url === URL_SERVIDOR);
  await sesion(db);
  const subsVic = (await filas(db, 'select id, endpoint from rwadar_novedades.suscripciones_web where usuario_id = $1 order by id', [vic.id]));
  paso('con el push apagado, webpush_prueba_supabase pide «Prueba de RWAdar» solo para los navegadores de la cuenta de administración, por el mismo camino (dirección, cabeceras y cuerpo del contrato) y sin guardar nada en envios_web',
    pares.length === 2 && isDeepStrictEqual(pares.map((x) => x[1]), subsVic.map((s) => Number(s.id)))
    && isDeepStrictEqual(pares.map((x) => x[0]), peticiones.map((x) => Number(x.id)))
    && isDeepStrictEqual(peticiones.map((x) => x.body.endpoint), subsVic.map((s) => s.endpoint))
    && peticiones.every((x) => x.timeout_milliseconds === 25000 && x.headers['x-rwadar-vapid-privada'] === VAPID.privada
      && x.headers['x-rwadar-vapid-publica'] === VAPID.publica
      && isDeepStrictEqual(x.body.carga, { v: 1, titulo: PRUEBA_TITULO, texto: PRUEBA_TEXTO, url: 'https://rwadar.pages.dev/?avisos=1', etiqueta: 'rwadar-prueba' }))
    && (await numero(db, 'select count(*) from rwadar_novedades.envios_web')) === enviosAntes);
  paso('antes de que pg_net responda, el resultado dice que las 2 esperan',
    isDeepStrictEqual(await resultadoPrueba(pares), { envios: 2, esperando: 2, enviados: 0, caducadas: 0, fallidos: 0, servidor: 0, codigos: [], codigos_servidor: [] }));
  respuestasPush.set(sVic2.endpoint, 410);
  const desdeRecibidos = recibidos.length;
  await atenderPgNet();
  const llegados = recibidos.slice(desdeRecibidos);
  const r = await resultadoPrueba(pares);
  const otra = await resultadoPrueba(pares);
  paso('después: 1 aceptada (201) y 1 caducada (410, su suscripción borrada); Vic descifra «Prueba de RWAdar»; leerlo otra vez da lo mismo',
    isDeepStrictEqual(r, { envios: 2, esperando: 0, enviados: 1, caducadas: 1, fallidos: 0, servidor: 0, codigos: [201, 410], codigos_servidor: [] })
    && isDeepStrictEqual(otra, r) && llegados.length === 2
    && llegados.every((x) => x.vapid && x.k === VAPID.publica && JSON.parse(x.claro).titulo === PRUEBA_TITULO)
    && (await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web where endpoint = $1', [sVic2.endpoint])) === 0);
  respuestasPush.delete(sVic2.endpoint);
  await registrar(vic, sVic2);
  // El servidor de la web falla o no responde.
  respuestasServidor.set(sVic.endpoint, { status_code: 500, content: 'error' });
  respuestasServidor.set(sVic2.endpoint, { status_code: null, content: null, error_msg: 'Couldn\'t connect to server' });
  const pares2 = await pruebaSupabase();
  await atenderPgNet();
  respuestasServidor.clear();
  paso('si el servidor de la web responde 500 o no hay conexión, la prueba lo cuenta aparte con su código (500 y 0), sin tocar las suscripciones',
    isDeepStrictEqual(await resultadoPrueba(pares2), { envios: 2, esperando: 0, enviados: 0, caducadas: 0, fallidos: 0, servidor: 2, codigos: [], codigos_servidor: [0, 500] })
    && (await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web where usuario_id = $1', [vic.id])) === 2);
  // Un 410 con una suscripción que no es de administración no la borra.
  const sAnaId = Number((await una(db, 'select id from rwadar_novedades.suscripciones_web where endpoint = $1', [sAnaFcm.endpoint])).id);
  respuestasPush.set(sVic.endpoint, 410);
  const pares3 = await pruebaSupabase();
  await atenderPgNet();
  respuestasPush.delete(sVic.endpoint);
  const cruzado = await resultadoPrueba([[pares3[0][0], sAnaId]]);
  paso('webpush_prueba_supabase_resultado solo borra suscripciones de cuentas de administración (un 410 con la de Ana no la borra)',
    cruzado.caducadas === 1 && (await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web where id = $1', [sAnaId])) === 1);
  await resultadoPrueba(pares3);
  await registrar(vic, sVic);
  const malas = [{}, 'texto', [[1]], [[1, 2, 3]], [['1', 2]], [[0, 1]], [[1.5, 2]], [[-1, 2]], [{ a: 1 }], Array.from({ length: 51 }, () => [1, 2])];
  const codigos = [];
  for (const m of malas) codigos.push(await codigo(() => resultadoPrueba(m)));
  paso(`webpush_prueba_supabase_resultado rechaza (22023) ${malas.length} entradas sin forma`, codigos.every((c) => c === '22023'));
  await sesion(db);
  await db.query('update public.perfiles set es_admin = false where id = $1', [vic.id]);
  const nadie = await pruebaSupabase();
  await db.query('update public.perfiles set es_admin = true where id = $1', [vic.id]);
  await db.exec("update vault.decrypted_secrets set name = 'APARTADA' where name = 'RWADAR_VAPID_PRIVADA'");
  const sinClave = await error(() => pruebaSupabase());
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  await db.exec("update vault.decrypted_secrets set name = 'RWADAR_VAPID_PRIVADA' where name = 'APARTADA'");
  paso('sin cuentas de administración suscritas no pide nada ([]); sin la clave VAPID se para (55000) sin enseñar valores',
    isDeepStrictEqual(nadie, []) && sinClave?.code === '55000' && /crear-vapid/.test(sinClave.message));
  await db.exec(ACTIVAR_PUSH);
}

/* =====================================================================
   9 · Flujos
   ===================================================================== */
{
  const opciones = BASE.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map((l) => l.trim().slice(2));
  paso('avisos-base.yml añade ensayo-33, verificar-33, aplicar-33 y prueba-webpush tras rotar-vapid y conserva las demás (las de la 34 las mira probar-pie-sin-nombre.mjs y las de la 36, probar-avisos-sin-cuenta.mjs)',
    isDeepStrictEqual(opciones, ['ensayo-30', 'verificar-30', 'diagnostico-30', 'aplicar-30', 'ensayo-31', 'verificar-31', 'aplicar-31',
      'guardar-correo', 'ensayo-32', 'verificar-32', 'aplicar-32', 'crear-vapid', 'rotar-vapid', 'ensayo-33', 'verificar-33', 'aplicar-33',
      'prueba-webpush', 'ensayo-34', 'verificar-34', 'aplicar-34', 'ensayo-36', 'verificar-36', 'aplicar-36', 'activar-sin-cuenta', 'apagar-sin-cuenta', 'prueba-sin-cuenta', 'activar-casilla', 'activar-correo', 'activar-push', 'apagar',
      'apagar-casilla', 'hacer-admin']));
  paso('el flujo comprueba que las dos copias de la 33 son idénticas',
    BASE.includes('cmp -s "$D/33_webpush_supabase.sql" rwadar-app/supabase/migrations/20261112170000_webpush_supabase.sql'));
  const prueba = pasoDe(BASE, 'Probar las notificaciones web desde Supabase') || '';
  paso('el paso de la prueba solo corre con prueba-webpush, solo recibe SUPABASE_DB_URL, sin npm ni node, y nunca ${{ … }} en su script',
    /\n {8}if: inputs\.accion == 'prueba-webpush'\n/.test(prueba) && /SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}/.test(prueba)
    && !/secrets\.(?!SUPABASE_DB_URL)/.test(prueba) && !scriptDe(prueba).includes('${{') && !/\b(npm|npx|node)\b/.test(scriptDe(prueba))
    && /select rwadar_novedades\.webpush_prueba_supabase\(\)/.test(prueba) && /-v peticiones="\$PETICIONES" -f "\$SQL"/.test(prueba));
  paso('prueba-webpush no hace copia ni pasa por «Aplicar» (CAMBIA=no) y sí por «Verificar»',
    /- name: Copia de seguridad antes de cambiar nada\n {8}if: env\.CAMBIA == 'si'\n/.test(BASE)
    && /- name: Aplicar\n {8}if: env\.CAMBIA == 'si' &&/.test(BASE) && /- name: Verificar\n {8}if: env\.ENSAYO != 'si' && inputs\.accion != 'diagnostico-30'\n/.test(BASE));
}
if (hayBash) {
  const v4 = `${V30_RUTA} ${V31_RUTA} ${V32_RUTA} ${V33_RUTA}`;
  const esperados = [
    [{ ACCION: 'ensayo-33' }, { SQL: 'rwadar-app/db/33_webpush_supabase.sql', CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: v4 }],
    [{ ACCION: 'verificar-33' }, { SQL: V33_RUTA, CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: v4 }],
    [{ ACCION: 'aplicar-33', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/33_webpush_supabase.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: v4 }],
    [{ ACCION: 'prueba-webpush', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/33_webpush_supabase_prueba.sql', CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: `${V30_RUTA} ${V32_RUTA} ${V33_RUTA}` }],
  ];
  const vistos = [];
  for (const [entradas] of esperados) vistos.push(await compruebaBase(entradas));
  paso(`«Comprobar la acción» elige SQL, copia, ensayo y verificadores de las ${esperados.length} acciones de la 33`,
    vistos.every((v, i) => v.estado === 0 && isDeepStrictEqual(v.salida, esperados[i][1])));
  const malos = [{ ACCION: 'aplicar-33' }, { ACCION: 'prueba-webpush' }, { ACCION: 'prueba-webpush', CONFIRMAR: 'avisos' }, { ACCION: 'prueba-webpush-ya', CONFIRMAR: 'AVISOS' }];
  const rechazos = [];
  for (const m of malos) rechazos.push(await compruebaBase(m));
  paso(`y rechaza ${malos.length} entradas (aplicar-33 o prueba-webpush sin AVISOS, acción desconocida) sin dejar nada en GITHUB_ENV`,
    rechazos.every((v) => v.estado !== 0 && Object.keys(v.salida).length === 0)
    && /escribe AVISOS/.test(rechazos[1].texto));
  const verificar = await correPaso(BASE, 'Verificar', (await compruebaBase({ ACCION: 'aplicar-33', CONFIRMAR: 'AVISOS' })).salida);
  paso('el paso «Verificar», ejecutado de verdad tras aplicar-33, pasa los verificadores 30, 31, 32 y 33 en ese orden',
    verificar.estado === 0 && isDeepStrictEqual(verificar.llamadas.map((l) => l.at(-1)), [V30_RUTA, V31_RUTA, V32_RUTA, V33_RUTA])
    && /RWAdar 33 OK/.test(verificar.stderr));

  // prueba-webpush, de verdad: bash, el doble de psql, pg_net y el servidor.
  const entorno = (await compruebaBase({ ACCION: 'prueba-webpush', CONFIRMAR: 'AVISOS' })).salida;
  const PASO = 'Probar las notificaciones web desde Supabase';
  const desdeRecibidos = recibidos.length;
  const bien = await correPaso(BASE, PASO, entorno);
  const llegados = recibidos.slice(desdeRecibidos);
  const todo = `${bien.texto}${bien.resumen}`;
  const secretos = [VAPID.privada, sVic.endpoint, sVic2.endpoint, sVic.p256dh, sVic.auth, sVic2.p256dh, sVic2.auth, PRUEBA_TEXTO];
  paso(`prueba-webpush, ejecutado de verdad: encola la prueba, lee la respuesta y la cuenta; llega a los 2 navegadores de Vic (${bien.estado === 0 ? 'OK' : bien.texto.trim()})`,
    bien.estado === 0 && llegados.length === 2 && llegados.every((x) => x.vapid && JSON.parse(x.claro).titulo === PRUEBA_TITULO)
    && /Aceptadas por el servicio de push: 2/.test(bien.resumen) && /Códigos de los servicios de push: \[201, 201\]/.test(bien.resumen)
    && /Sin respuesta todavía \(pg_net\): 0/.test(bien.resumen)
    && bien.llamadas.length === 2 && bien.llamadas[0].includes('select rwadar_novedades.webpush_prueba_supabase()')
    && bien.llamadas[1].at(-1) === 'rwadar-app/db/33_webpush_supabase_prueba.sql'
    && /^\[\[[0-9]+, [0-9]+\], \[[0-9]+, [0-9]+\]\]$/.test(variablesPsql(bien.llamadas[1]).peticiones));
  paso('la salida y el resumen de prueba-webpush solo llevan cuentas y códigos: ni endpoints, ni claves, ni la carga',
    secretos.every((s) => !todo.includes(s)));
  respuestasServidor.set(sVic.endpoint, { status_code: 403, content: '{"error":"claves"}' });
  respuestasServidor.set(sVic2.endpoint, { status_code: 403, content: '{"error":"claves"}' });
  const fallo = await correPaso(BASE, PASO, entorno);
  respuestasServidor.clear();
  paso('si el servidor de la web no acepta ninguna, prueba-webpush falla (::error::) y enseña los códigos del servidor',
    fallo.estado !== 0 && /::error::Ninguna notificación de prueba se aceptó/.test(fallo.stdout)
    && /Códigos del servidor de la web \(cuando no respondió bien\): \[403, 403\]/.test(fallo.resumen));
  pgNetActivo = false;
  const callado = await correPaso(BASE, PASO, entorno);
  pgNetActivo = true;
  await atenderPgNet();
  paso('si pg_net no responde, prueba-webpush lo intenta 12 veces (cada 5 segundos) y falla diciendo cuántas siguen sin respuesta',
    callado.estado !== 0 && callado.llamadas.length === 13 && /Sin respuesta todavía \(pg_net\): 2/.test(callado.resumen));
  await sesion(db);
  await db.query('update public.perfiles set es_admin = false where id = $1', [vic.id]);
  const vacio = await correPaso(BASE, PASO, entorno);
  await db.query('update public.perfiles set es_admin = true where id = $1', [vic.id]);
  paso('sin cuentas de administración suscritas, prueba-webpush termina bien y lo dice',
    vacio.estado === 0 && /Ninguna cuenta de administración tiene la web suscrita/.test(vacio.resumen) && vacio.llamadas.length === 1);
  const verificarPrueba = await correPaso(BASE, 'Verificar', entorno);
  paso('tras prueba-webpush, «Verificar» pasa los verificadores 30, 32 y 33',
    verificarPrueba.estado === 0 && isDeepStrictEqual(verificarPrueba.llamadas.map((l) => l.at(-1)), [V30_RUTA, V32_RUTA, V33_RUTA]));
}
{
  const trabajos = AVISAR.slice(AVISAR.indexOf('\njobs:\n') + 7).match(/^ {2}[a-z][a-z0-9-]*:$/gm) || [];
  paso('«Avisar novedad» ya no lanza «Notificaciones web»: un solo trabajo (el anuncio), ningún uses: de otro flujo y SUPABASE_DB_URL solo en su paso de psql',
    isDeepStrictEqual(trabajos, ['  avisar:']) && !/notificaciones-web/.test(sinAlmohadillas(AVISAR))
    && !/^\s+uses: \.\//m.test(AVISAR) && (AVISAR.match(/secrets\.SUPABASE_DB_URL/g) || []).length === 1);
  const flujos = fs.readdirSync(path.join(raizRepo, '.github/workflows')).map((n) => [n, fs.readFileSync(path.join(raizRepo, '.github/workflows', n), 'utf8')]);
  paso('ningún flujo llama a «Notificaciones web» ni saca de la base los envíos de todos (webpush_pendientes)',
    flujos.every(([, t]) => !/uses: \.\/\.github\/workflows\/notificaciones-web\.yml/.test(t) && !/webpush_pendientes/.test(sinAlmohadillas(t))));
  paso('«Notificaciones web» queda solo con la prueba de administración: acción prueba, a mano, sin workflow_call, sin webpush_pendientes ni limpieza',
    /accion:\n(?: {8}.*\n)*? {8}type: choice\n {8}options:\n {10}- prueba\n {8}default: prueba\n/.test(WEB)
    && !/workflow_call/.test(WEB) && !/^ {2}(schedule|push|pull_request|pull_request_target|workflow_run|repository_dispatch):/m.test(WEB)
    && !/webpush_pendientes|webpush_limpiar|enviar\|prueba/.test(sinAlmohadillas(WEB)) && /select rwadar_novedades\.webpush_prueba\(\)/.test(WEB)
    && (WEB.match(/secrets\.SUPABASE_DB_URL/g) || []).length === 1);
  if (hayBash) {
    const comprueba = (e) => correPaso(WEB, 'Comprobar la entrada', { ACCION: 'prueba', CONFIRMACION: 'ENVIAR', ...e });
    const buena = (await comprueba({})).estado;
    const malas = [];
    for (const e of [{ ACCION: 'enviar' }, { CONFIRMACION: 'enviar' }, { ACCION: '' }]) malas.push((await comprueba(e)).estado);
    paso('«Comprobar la entrada» de «Notificaciones web» acepta prueba con ENVIAR y rechaza enviar (ya lo hace Supabase)',
      buena === 0 && malas.every((s) => s !== 0));
  }
}

/* =====================================================================
   10 · Verificador 33: detecta cada rotura
   ===================================================================== */
{
  const procesar30 = funcionDe(SQL30, 'rwadar_novedades.procesar');
  const procesar33 = funcionDe(SQL33, 'rwadar_novedades.procesar');
  const encolar33 = funcionDe(SQL33, 'rwadar_novedades.webpush_encolar');
  const enviar33 = funcionDe(SQL33, 'rwadar_novedades.enviar_webpush');
  const leer33 = funcionDe(SQL33, 'rwadar_novedades.leer_webpush');
  const prueba33 = funcionDe(SQL33, 'rwadar_novedades.webpush_prueba_supabase');
  const clave33 = funcionDe(SQL33, 'public.clave_publica_webpush_anon');
  const restricciones = "alter table rwadar_novedades.envios_web add constraint envio_web_peticion_con_fecha check ((peticion_id is null) = (peticion_el is null))";
  const rompe = async (romper, arreglar) => { await sesion(db); await db.exec(romper); const v = await verificar33(); await sesion(db); await db.exec(arreglar); return v; };
  const rotos = {
    'procesar() de la 30 (sin la web)': [await rompe(procesar30, procesar33), /procesar\(\) no envía las notificaciones web/],
    'la web fuera del bloque del push': [await rompe(procesar33.replace(BLOQUE_33, '').replace('\n  return v_resultado;\nend\n', `\n${BLOQUE_33}  return v_resultado;\nend\n`), procesar33), /en su sitio/],
    'la web dos veces': [await rompe(procesar33.replace(BLOQUE_33, BLOQUE_33 + BLOQUE_33), procesar33), /en su sitio/],
    'la web antes de Expo': [await rompe(procesar33.replace(BLOQUE_33, '').replace('  if v_cfg.push_habilitado then\n', `  if v_cfg.push_habilitado then\n${BLOQUE_33}`), procesar33), /en su sitio/],
    'otra dirección': [await rompe(encolar33.replace(URL_SERVIDOR, 'https://otro.example/api/interno/webpush'), encolar33), /contrato/],
    'la privada en el cuerpo': [await rompe(encolar33.replace("'carga', r.carga)", "'carga', r.carga, 'k', v_privada)"), encolar33), /contrato/],
    'sin la cabecera de la pública': [await rompe(encolar33.replace("'x-rwadar-vapid-publica', v_publica", "'x-otra', v_publica"), encolar33), /contrato/],
    'otra espera': [await rompe(encolar33.replace('timeout_milliseconds := 25000', 'timeout_milliseconds := 10000'), encolar33), /contrato/],
    'otra función lee la privada': [await rompe(`create function rwadar_novedades.fuga() returns text language sql security definer set search_path = ''
        as $$ select decrypted_secret from vault.decrypted_secrets where name = 'RWADAR_VAPID_PRIVADA' $$;
        revoke all on function rwadar_novedades.fuga() from public, anon, authenticated, service_role`,
      'drop function rwadar_novedades.fuga()'), /fuera de webpush_encolar/],
    'el envío sin pasar por webpush_encolar': [await rompe(enviar33.replace('rwadar_novedades.webpush_encolar(v_lote', 'rwadar_novedades.webpush_prueba_supabase_resultado(v_lote'), enviar33), /por webpush_encolar/],
    'el envío sin el interruptor': [await rompe(enviar33.replace('c.unica and c.push_habilitado and c.push_activado_el is not null', 'c.unica and c.push_activado_el is not null'), enviar33), /interruptor/],
    'la lectura sin las reglas de la 32': [await rompe(leer33.replace('perform rwadar_novedades.webpush_resultado(v_resultados);', 'perform 1;'), leer33), /webpush_resultado/],
    'la prueba a todas las suscripciones': [await rompe(prueba33.replace('rwadar_novedades.webpush_prueba() -> \'envios\'',
      "(select jsonb_build_object('envios', coalesce(jsonb_agg(jsonb_build_object('id', 'p' || s.id)), '[]')) from rwadar_novedades.suscripciones_web s) -> 'envios'"), prueba33), /administración/],
    'función interna para service_role': [await rompe('grant execute on function rwadar_novedades.enviar_webpush(integer) to service_role',
      'revoke execute on function rwadar_novedades.enviar_webpush(integer) from service_role'), /ejecutable por service_role/],
    'función interna para anon': [await rompe('grant execute on function rwadar_novedades.webpush_prueba_supabase() to anon',
      'revoke execute on function rwadar_novedades.webpush_prueba_supabase() from anon'), /ejecutable por anon/],
    'función interna invoker': [await rompe('alter function rwadar_novedades.leer_webpush() security invoker',
      'alter function rwadar_novedades.leer_webpush() security definer'), /security definer/],
    'la clave para public': [await rompe('grant execute on function public.clave_publica_webpush_anon() to public',
      'revoke execute on function public.clave_publica_webpush_anon() from public'), /permisos incorrectos/],
    'la clave para service_role': [await rompe('grant execute on function public.clave_publica_webpush_anon() to service_role',
      'revoke execute on function public.clave_publica_webpush_anon() from service_role'), /permisos incorrectos/],
    'la clave sin anon': [await rompe('revoke execute on function public.clave_publica_webpush_anon() from anon',
      'grant execute on function public.clave_publica_webpush_anon() to anon'), /permisos incorrectos/],
    'la clave sin authenticated': [await rompe('revoke execute on function public.clave_publica_webpush_anon() from authenticated',
      'grant execute on function public.clave_publica_webpush_anon() to authenticated'), /permisos incorrectos/],
    'la clave devuelve más': [await rompe(clave33.replace('select c.webpush_clave_publica from rwadar_novedades.configuracion c where c.unica',
      "select string_agg(s.endpoint, ',') from rwadar_novedades.suscripciones_web s"), clave33), /solo devuelve la clave pública/],
    'sin la columna de la petición': [await rompe('alter table rwadar_novedades.envios_web drop column peticion_el',
      `alter table rwadar_novedades.envios_web add column peticion_el timestamptz; ${restricciones}`), /columnas de la petición/],
    'sin la regla de la petición': [await rompe('alter table rwadar_novedades.envios_web drop constraint envio_web_peticion_con_fecha', restricciones), /columnas de la petición/],
  };
  const fallan = Object.entries(rotos).filter(([, [v, motivo]]) => v.ok || !motivo.test(v.error || '')).map(([n, [v]]) => `${n}: ${v.error || 'pasa'}`);
  paso(`el verificador 33 detecta ${Object.keys(rotos).length} roturas (procesar sin la web o fuera de sitio, el contrato con el servidor, la privada fuera de su función, el interruptor, las reglas de la 32, la prueba sin filtro, permisos de más o de menos, invoker, la clave que devuelve más y las columnas)${fallan.length ? ` · no detecta: ${fallan.join(' | ')}` : ''}`,
    fallan.length === 0 && (await verificar33()).ok);
}
{
  // Reaplicar la 30 devuelve procesar() a su versión: el verificador 33 lo
  // detecta y la 33 se niega hasta reaplicar la 31; con la 31, la 32 y la
  // 33 queda bien, sin perder nada.
  const antes = await numero(db, 'select count(*) from rwadar_novedades.envios_web');
  await sesion(db);
  await db.exec(SQL30);
  const v = await verificar33();
  const sin31 = await error(() => db.exec(SQL33));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  const clave = (await una(db, 'select webpush_clave_publica c from rwadar_novedades.configuracion')).c;
  await db.exec(SQL31);
  await db.exec(SQL32);
  const v32 = await verificar33();
  await db.exec(SQL33);
  paso('reaplicar la 30 quita la web de procesar() (el verificador 33 lo detecta) y la 33 se niega sin la 31; reaplicar la 31, la 32 y la 33 lo deja bien, con la clave y los envíos',
    !v.ok && /procesar\(\) no envía/.test(v.error) && sin31?.code === '55000' && /31_correo_lettermint/.test(sin31.message)
    && clave === VAPID.publica && !v32.ok
    && (await numero(db, 'select count(*) from rwadar_novedades.envios_web')) === antes
    && (await verificar30()).ok && (await verificar31()).ok && (await verificar32()).ok && (await verificar33()).ok);
  await sesion(db);
  await db.exec(SQL32);
  paso('reaplicar la 32 con la 33 puesta no toca nada de la 33 (el verificador 33 pasa)', (await verificar33()).ok && (await verificar32()).ok);
}
} catch (e) {
  fail.push(`la prueba se paró: ${e.stack || e.message}`);
} finally {
  if (servidor) servidor.close();
  if (db) await db.close().catch(() => {});
  fs.rmSync(temporal, { recursive: true, force: true });
}

informe('Notificaciones web desde Supabase (migración 33)', ok, fail);
