/* =====================================================================
   RWAdar · notificaciones sin cuenta (migración 36)
   ---------------------------------------------------------------------
   Encargo de la dirección (14/11/2026): «que salga tanto en iPhone como en
   Android; muy importante que funcionen las notificaciones y los avisos
   aunque no tengan cuenta o no hayan iniciado sesión: que puedan
   activarlas».

   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, 26,
   el refuerzo de sesión, 28, 28_REVERTIR, 29, la 30, la 31, la 32 (con la
   clave VAPID creada), la 33 y la 34, como hoy en producción (envío
   apagado); encima, la 36, con privilegios por defecto hostiles mientras se
   aplica.

   Auth, pg_net, Vault y pg_cron son dobles locales: no hay red ni
   Supabase. net.http_post guarda cada petición y net._http_response se
   rellena a mano o con un doble del servidor de la web que sigue el
   contrato de la 33 (comprueba las claves, cifra y firma con
   enviar-webpush.mjs y entrega en un servicio de push local que descifra
   lo que le llega) y, para la prueba, con un doble de Expo. Los pasos de
   «Avisos a registrados (base)» (comprobar la acción, ensayo-36, aplicar,
   verificar y prueba-sin-cuenta) se ejecutan de verdad con bash, un doble
   de psql que pasa cada orden a PGlite y un doble de sleep.

       node probar-avisos-sin-cuenta.mjs
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
import { enviarUno, generarClaves, prepararClaves } from './enviar-webpush.mjs';

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
const b64u = (b) => Buffer.from(b).toString('base64url');
const hkdf = (sal, ikm, info, largo) => Buffer.from(crypto.hkdfSync('sha256', ikm, sal, info, largo));
const funcionDe = (sql, nombre) => sql.match(new RegExp(`create or replace function ${nombre.replace('.', '\\.')}\\([\\s\\S]*?\\n\\$funcion\\$;`))[0];

const SQL30 = leer('db/30_avisos_registrados.sql');
const SQL31 = leer('db/31_correo_lettermint.sql');
const SQL32 = leer('db/32_notificaciones.sql');
const SQL33 = leer('db/33_webpush_supabase.sql');
const SQL34 = leer('db/34_pie_sin_nombre.sql');
const SQL36 = leer('db/36_avisos_sin_cuenta.sql');
const MIGRACION36 = leer('supabase/migrations/20261114180000_avisos_sin_cuenta.sql');
const VERIFICAR = Object.fromEntries([['30', '30_avisos_registrados'], ['31', '31_correo_lettermint'], ['32', '32_notificaciones'],
  ['33', '33_webpush_supabase'], ['34', '34_pie_sin_nombre'], ['36', '36_avisos_sin_cuenta']].map(([n, f]) => [n, leer(`db/${f}_verificar.sql`)]));
const ACTIVAR36 = leer('db/36_avisos_sin_cuenta_activar.sql');
const APAGAR36 = leer('db/36_avisos_sin_cuenta_apagar.sql');
const PRUEBA36 = leer('db/36_avisos_sin_cuenta_prueba.sql');
const ACTIVAR_PUSH = leer('db/30_avisos_registrados_activar_push.sql');
const FALLO_CERRADO = leer('db/fallo_cerrado.sql');
const BASE = leer('../.github/workflows/avisos-base.yml');
const PKG = JSON.parse(leer('package.json'));
const VERSION = 'novedades-v2-2026-11-06';
const VERSION_SC = 'sin-cuenta-v1-2026-11-14';
const TEXTO_ES = 'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It's optional and doesn't need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.";
const URL_SERVIDOR = 'https://rwadar.pages.dev/api/interno/webpush';
const EXPO_SEND = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECIBOS = 'https://exp.host/--/api/v2/push/getReceipts';
const PRUEBA_TITULO = 'Prueba de RWAdar';
const API = ['public.avisos_sin_cuenta_texto()', 'public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)',
  'public.baja_aviso_sin_cuenta_web(text,text)', 'public.aviso_sin_cuenta_web_activo(text,text)',
  'public.alta_aviso_sin_cuenta_movil(text,text,text,text,text)', 'public.baja_aviso_sin_cuenta_movil(text)',
  'public.aviso_sin_cuenta_movil_activo(text)', 'public.avisos_publicos(integer)'];

// Lo único que la 36 añade a procesar() de la 33 y a limpiar() de la 32.
const ANCLA_P = "      raise warning 'rwadar_novedades: envío de notificaciones web omitido (sqlstate %)', sqlstate;\n    end;\n";
const LLAMADAS = ['sin_cuenta_leer_push', 'sin_cuenta_enviar_push', 'sin_cuenta_leer_webpush', 'sin_cuenta_enviar_webpush'];
const ANCLA_L = '  v_total := v_total + rwadar_novedades.webpush_limpiar();\n';
const LINEAS_L = '  -- Sin cuenta (36): sus plazos, los mismos cada día.\n  v_total := v_total + rwadar_novedades.sin_cuenta_limpiar();\n';

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
const variablesPsql = (argv) => Object.fromEntries(argv.flatMap((a, i) =>
  (argv[i - 1] === '-v' && /^[a-z_]+=/.test(a) ? [[a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]] : [])));
const conVariablesPsql = (sql, variables) => sinComentarios(sql).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
  .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/)
  .map((trozo, i) => (i % 2 ? trozo : trozo.replace(/:'([a-z_]+)'/g, (_, nombre) => {
    if (!(nombre in variables)) throw new Error(`falta la variable ${nombre}`);
    return `'${String(variables[nombre]).replace(/'/g, "''")}'`;
  }))).join('');

let db;
let servidor;
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-sin-cuenta-'));
try {
/* =====================================================================
   1 · Revisión estática: copias, forma y lo que la 36 no toca
   ===================================================================== */
const procesar33 = funcionDe(SQL33, 'rwadar_novedades.procesar');
const procesar36 = funcionDe(SQL36, 'rwadar_novedades.procesar');
const limpiar32 = funcionDe(SQL32, 'rwadar_novedades.limpiar');
const limpiar36 = funcionDe(SQL36, 'rwadar_novedades.limpiar');
const BLOQUE_36 = procesar36.slice(procesar36.indexOf(ANCLA_P) + ANCLA_P.length, procesar36.indexOf('  end if;\n  begin\n    v_n := rwadar_novedades.limpiar();'));
{
  paso('la migración versionada 20261114180000 es una copia idéntica de db/36', MIGRACION36 === SQL36);
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la 36, su activación y su apagado empiezan en «begin;» y terminan en su único «commit;»; su verificador, en «begin transaction read only;» … «rollback;»',
    [SQL36, ACTIVAR36, APAGAR36].every((t) => primera(t) === 'begin;' && (t.match(/^commit;$/gm) || []).length === 1 && lineas(t).at(-1) === 'commit;')
    && primera(VERIFICAR['36']) === 'begin transaction read only;' && lineas(VERIFICAR['36']).at(-1) === 'rollback;'
    && !/^commit;$/m.test(VERIFICAR['36']));
  paso('procesar() de la 36 es la de la 33 letra por letra más cuatro bloques sin cuenta (leer y enviar Expo, leer y enviar la web) al final del bloque del push',
    procesar33.split(ANCLA_P).length === 2 && procesar36 === procesar33.replace(ANCLA_P, ANCLA_P + BLOQUE_36)
    && isDeepStrictEqual([...BLOQUE_36.matchAll(/v_n := rwadar_novedades\.(\w+)\(\);/g)].map((m) => m[1]), LLAMADAS)
    && (BLOQUE_36.match(/^ {4}begin$/gm) || []).length === 4 && (BLOQUE_36.match(/^ {4}exception when others then$/gm) || []).length === 4);
  paso('limpiar() de la 36 es la de la 32 letra por letra más sin_cuenta_limpiar() al final',
    limpiar32.split(ANCLA_L).length === 2 && limpiar36 === limpiar32.replace(ANCLA_L, ANCLA_L + LINEAS_L));
  const codigo = sinComentarios(SQL36.replace(procesar36, '').replace(limpiar36, ''));
  paso('la 36 no borra tablas ni columnas, no toca relojes, Vault ni ninguna tabla de cuentas (preferencias, dispositivos, suscripciones_web, pushes, correos, historial_permiso) y solo cambia en la configuración la versión y los textos sin cuenta',
    !/\bdrop\s+(table|function|schema|policy|index|column)\b/i.test(codigo)
    && !/cron\.|vault\.(create|update)_secret|insert\s+into\s+vault/i.test(codigo)
    && !/(insert\s+into|update|delete\s+from)\s+rwadar_novedades\.(preferencias|dispositivos|suscripciones_web|envios_web|pushes|correos|historial_permiso|anuncios)\b/i.test(codigo)
    && isDeepStrictEqual([...codigo.matchAll(/update rwadar_novedades\.configuracion\s+set ([^\n]*)/g)].map((m) => m[1]), ["sin_cuenta_version = 'sin-cuenta-v1-2026-11-14',"]));
  paso('la 36 solo concede EXECUTE de sus 8 funciones públicas a anon y authenticated (y cierra antes todo lo demás del esquema)',
    isDeepStrictEqual([...codigo.matchAll(/^grant .*$/gm)].map((m) => m[0]),
      API.map((f) => `grant execute on function ${f.replace(/,/g, ', ')} to anon, authenticated;`))
    && /revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;/.test(codigo)
    && /revoke all on all tables in schema rwadar_novedades from public, anon, authenticated, service_role;/.test(codigo));
  // Las búsquedas de texto del verificador 33: la privada y el servidor de
  // la web solo en webpush_encolar; leer_webpush()/enviar_webpush() una vez.
  const funciones = [...SQL36.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1]);
  paso(`ninguna de las ${funciones.length} funciones de la 36 nombra la clave privada VAPID ni el servidor de la web, ni llama a pg_net salvo el envío y la prueba de Expo`,
    funciones.length >= 20 && funciones.every((n) => !/RWADAR_VAPID_PRIVADA|\/api\/interno\/webpush/.test(funcionDe(SQL36, n)))
    && isDeepStrictEqual(funciones.filter((n) => funcionDe(SQL36, n).includes('net.http_post(')),
      ['rwadar_novedades.sin_cuenta_enviar_push', 'rwadar_novedades.sin_cuenta_prueba'])
    && (procesar36.match(/rwadar_novedades\.leer_webpush\(\)/g) || []).length === 1
    && (procesar36.match(/rwadar_novedades\.enviar_webpush\(\)/g) || []).length === 1);
  paso('el SQL de la prueba solo usa la variable peticiones, como literal, en un SELECT',
    isDeepStrictEqual([...new Set([...sinComentarios(PRUEBA36).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))], ['peticiones'])
    && /^select r ->> 'envios'/m.test(PRUEBA36) && !/\b(insert|update|delete|create|alter|grant)\b/i.test(sinComentarios(PRUEBA36)));
  paso('fallo_cerrado.sql también apaga el interruptor sin cuenta con su fecha, solo si existe',
    /attname = 'sin_cuenta_activa'/.test(FALLO_CERRADO)
    && /update rwadar_novedades\.configuracion set sin_cuenta_activa = false, sin_cuenta_activada_el = null where unica/.test(FALLO_CERRADO));
  paso('npm test de rwadar-app ejecuta esta prueba justo después de la del pie sin nombre',
    PKG.scripts.test.includes('node probar-pie-sin-nombre.mjs && node probar-avisos-sin-cuenta.mjs &&'));
}

/* =====================================================================
   2 · La cadena de producción (30, 31, 32 con la clave VAPID, 33 y 34)
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
await db.exec(SQL32);
{
  const e = await error(() => db.exec(SQL36));
  await db.exec('rollback').catch(() => {});
  paso('sin la 33, la 36 se niega (55000) y no deja nada',
    e?.code === '55000' && /falta aplicar antes 33_webpush_supabase/.test(e.message)
    && (await una(db, "select to_regclass('rwadar_novedades.sin_cuenta_web') t")).t === null);
}
const VAPID = generarClaves();
await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_VAPID_PRIVADA', '${VAPID.privada}');
  update rwadar_novedades.configuracion set webpush_clave_publica = '${VAPID.publica}' where unica`);
await db.exec(SQL33);
await db.exec(SQL34);

const sesiones = new Map();
const como = async (u) => {
  await sesion(db);
  if (!sesiones.has(u.id)) {
    const [s] = await filas(db, 'insert into auth.sessions(id, user_id) values (gen_random_uuid(), $1) returning id', [u.id]);
    sesiones.set(u.id, s.id);
  }
  const ahora = Number((await una(db, 'select floor(extract(epoch from now()))::bigint t')).t);
  const claims = { sub: u.id, role: 'authenticated', session_id: sesiones.get(u.id), exp: ahora + 3600,
    is_anonymous: false, amr: [{ method: 'password', timestamp: ahora }] };
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
  await sesion(db, u.id, 'authenticated');
};
const codigo = async (fn) => (await error(fn))?.code ?? null;
const verificador = async (n) => {
  await sesion(db);
  const avisos = [];
  const e = await error(() => db.exec(VERIFICAR[n], { onNotice: (x) => avisos.push(x.message) }));
  if (e) { await db.exec('rollback').catch(() => {}); return { ok: false, error: e.message }; }
  const aviso = avisos.find((a) => a.startsWith(`RWAdar ${n} OK`));
  return { ok: !!aviso, aviso, avisos };
};
const todos = async (lista = ['30', '31', '32', '33', '34', '36']) => {
  const r = {};
  for (const n of lista) r[n] = await verificador(n);
  return r;
};
const fallidos = (r) => Object.entries(r).filter(([, v]) => !v.ok).map(([n, v]) => `${n}: ${v.error || 'sin OK'}`).join(' | ');

/* =====================================================================
   3 · Dobles: servicio de push, servidor de la web, Expo, pg_net, psql
   ===================================================================== */
const navegadores = new Map();
const respuestasPush = new Map();
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
  if (!m) return false;
  const [h, d, f] = m[1].split('.');
  const k = Buffer.from(m[2], 'base64url');
  const clave = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(k.subarray(1, 33)), y: b64u(k.subarray(33)) } });
  return crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: clave, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'))
    && JSON.parse(Buffer.from(d, 'base64url')).aud === audiencia && m[2] === VAPID.publica;
};

const llamadasPsql = [];
const formato = (v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 't' : 'f') : String(v));
let atenderPgNet = async () => 0;
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
    if (req.url === '/psql') { res.end(JSON.stringify(await psqlDoble(JSON.parse(cuerpo).argv))); return; }
    const [, , host, ...resto] = req.url.split('/');
    const endpoint = `https://${host}/${resto.join('/')}`;
    const n = navegadores.get(endpoint);
    let claro = null;
    try { claro = n ? descifrar(cuerpo, n) : null; } catch { claro = null; }
    recibidos.push({ endpoint, claro, vapid: comprobarVapid(req.headers.authorization, `https://${host}`) });
    res.statusCode = respuestasPush.get(endpoint) ?? 201;
    res.end();
  } catch (e) { res.statusCode = 599; res.end(String(e.message)); }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const LOCAL = `http://127.0.0.1:${servidor.address().port}`;
const fetchLocal = (url, opciones) => { const u = new URL(url); return fetch(`${LOCAL}/push/${u.host}${u.pathname}${u.search}`, opciones); };
const servidorWeb = async ({ url, headers, body }) => {
  const cab = headers || {};
  if (url !== URL_SERVIDOR || cab['content-type'] !== 'application/json') return { status_code: 400, content: '{"error":"peticion"}' };
  let claves;
  try { claves = prepararClaves(cab['x-rwadar-vapid-privada'], cab['x-rwadar-vapid-publica']); } catch { return { status_code: 403, content: '{"error":"claves"}' }; }
  let oficial;
  try { await sesion(db, null, 'anon'); oficial = (await una(db, 'select public.clave_publica_webpush_anon() k')).k; } finally { await sesion(db); }
  if (oficial !== cab['x-rwadar-vapid-publica']) return { status_code: 403, content: '{"error":"clave_ajena"}' };
  return { status_code: 200, content: JSON.stringify({ codigo: await enviarUno(body, claves, { fetch: fetchLocal }) }) };
};
// pg_net: la web siempre con el doble del servidor (o lo que diga la prueba
// para un endpoint); Expo solo con expoAutomatico (la prueba de la acción),
// con lo que diga respuestaExpo para cada token.
const respuestasServidor = new Map();
const respuestaExpo = new Map();
let expoAutomatico = false;
let pgNetActivo = true;
let ultimaAtendida = 0;
atenderPgNet = async () => {
  if (!pgNetActivo) return 0;
  await sesion(db);
  const nuevas = await filas(db, 'select * from net.http_request_queue where id > $1 order by id', [ultimaAtendida]);
  let n = 0;
  for (const p of nuevas) {
    ultimaAtendida = Number(p.id);
    let r = null;
    if (p.url === URL_SERVIDOR) r = respuestasServidor.get(p.body?.endpoint) ?? await servidorWeb(p);
    else if (p.url === EXPO_SEND && expoAutomatico) {
      r = respuestaExpo.get(p.body?.to) ?? { status_code: 200, content: JSON.stringify({ data: { status: 'ok', id: `ticket-${p.id}` } }) };
    }
    if (!r) continue;
    await sesion(db);
    await db.query('insert into net._http_response(id, status_code, content, error_msg) values ($1, $2, $3, $4)',
      [p.id, r.status_code ?? null, r.content ?? null, r.error_msg ?? null]);
    n++;
  }
  return n;
};
const responder = async (id, status, contenido) => {
  await sesion(db);
  await db.query('insert into net._http_response(id, status_code, content) values ($1, $2, $3)',
    [id, status, typeof contenido === 'string' ? contenido : JSON.stringify(contenido)]);
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
const V = (n) => `rwadar-app/db/${{ 30: '30_avisos_registrados', 31: '31_correo_lettermint', 32: '32_notificaciones',
  33: '33_webpush_supabase', 34: '34_pie_sin_nombre', 36: '36_avisos_sin_cuenta' }[n]}_verificar.sql`;
const compruebaBase = (entradas) => correPaso(BASE, 'Comprobar la acción', { ACCION: 'ensayo-36', CONFIRMAR: '', REMITENTE: '', ...entradas });

/* =====================================================================
   4 · El flujo: acciones de la 36, su ensayo de verdad y la 36 aplicada
   ===================================================================== */
{
  const opciones = BASE.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map((l) => l.trim().slice(2));
  const i34 = opciones?.indexOf('aplicar-34');
  paso('avisos-base.yml añade ensayo-36, verificar-36, aplicar-36, activar-sin-cuenta, apagar-sin-cuenta y prueba-sin-cuenta tras aplicar-34',
    isDeepStrictEqual(opciones?.slice(i34 + 1, i34 + 7), ['ensayo-36', 'verificar-36', 'aplicar-36', 'activar-sin-cuenta', 'apagar-sin-cuenta', 'prueba-sin-cuenta'])
    && opciones.length === new Set(opciones).size);
  paso('el flujo comprueba que las dos copias de la 36 son idénticas y avisa de reaplicar la 36 tras aplicar-30, aplicar-32 y aplicar-33',
    BASE.includes('cmp -s "$D/36_avisos_sin_cuenta.sql" rwadar-app/supabase/migrations/20261114180000_avisos_sin_cuenta.sql')
    && BASE.includes('(aplicar-31, aplicar-32, aplicar-33 y aplicar-34). Si la 36 también lo estaba, después aplicar-36.')
    && /if \[ "\$ACCION" = aplicar-32 \] \|\| \[ "\$ACCION" = aplicar-33 \]; then\n\s+echo "Aviso: .*\(aplicar-36\)\."/.test(BASE));
  const prueba = pasoDe(BASE, 'Probar las notificaciones sin cuenta') || '';
  paso('el paso de la prueba sin cuenta solo corre con prueba-sin-cuenta, solo recibe SUPABASE_DB_URL, sin npm ni node, y nunca ${{ … }} en su script',
    /\n {8}if: inputs\.accion == 'prueba-sin-cuenta'\n/.test(prueba) && /SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}/.test(prueba)
    && !/secrets\.(?!SUPABASE_DB_URL)/.test(prueba) && !scriptDe(prueba).includes('${{') && !/\b(npm|npx|node)\b/.test(scriptDe(prueba))
    && /select rwadar_novedades\.sin_cuenta_prueba\(\)/.test(prueba) && /-v peticiones="\$PETICIONES" -f "\$SQL"/.test(prueba));
}
if (hayBash) {
  const V6 = [30, 31, 32, 33, 34, 36].map(V).join(' ');
  const D = 'rwadar-app/db/';
  const esperados = [
    [{ ACCION: 'ensayo-36' }, { SQL: `${D}36_avisos_sin_cuenta.sql`, CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: V6 }],
    [{ ACCION: 'verificar-36' }, { SQL: V(36), CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: V6 }],
    [{ ACCION: 'aplicar-36', CONFIRMAR: 'AVISOS' }, { SQL: `${D}36_avisos_sin_cuenta.sql`, CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: V6 }],
    [{ ACCION: 'activar-sin-cuenta', CONFIRMAR: 'AVISOS' }, { SQL: `${D}36_avisos_sin_cuenta_activar.sql`, CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: [30, 32, 33, 36].map(V).join(' ') }],
    [{ ACCION: 'apagar-sin-cuenta', CONFIRMAR: 'AVISOS' }, { SQL: `${D}36_avisos_sin_cuenta_apagar.sql`, CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: [30, 36].map(V).join(' ') }],
    [{ ACCION: 'prueba-sin-cuenta', CONFIRMAR: 'AVISOS' }, { SQL: `${D}36_avisos_sin_cuenta_prueba.sql`, CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: [30, 32, 33, 36].map(V).join(' ') }],
  ];
  const vistos = [];
  for (const [entradas] of esperados) vistos.push(await compruebaBase(entradas));
  paso(`«Comprobar la acción» elige SQL, copia, ensayo y verificadores de las ${esperados.length} acciones de la 36`,
    vistos.every((v, i) => v.estado === 0 && isDeepStrictEqual(v.salida, esperados[i][1])));
  const malos = [{ ACCION: 'aplicar-36' }, { ACCION: 'activar-sin-cuenta', CONFIRMAR: 'avisos' }, { ACCION: 'apagar-sin-cuenta' },
    { ACCION: 'prueba-sin-cuenta' }, { ACCION: 'activar-sin-cuentas', CONFIRMAR: 'AVISOS' }];
  const rechazos = [];
  for (const m of malos) rechazos.push(await compruebaBase(m));
  paso(`y rechaza ${malos.length} entradas (las que cambian la base o la prueba sin AVISOS, acción desconocida) sin dejar nada en GITHUB_ENV`,
    rechazos.every((v) => v.estado !== 0 && Object.keys(v.salida).length === 0) && /escribe AVISOS/.test(rechazos[0].texto)
    && /navegadores y móviles sin cuenta: escribe AVISOS/.test(rechazos[3].texto));
  // La copia «cambiada» de la migración va al directorio temporal y el paso la
  // compara en lugar de la versionada, que la prueba no toca nunca.
  const MIGRACION36_RUTA = 'rwadar-app/supabase/migrations/20261114180000_avisos_sin_cuenta.sql';
  const copia = path.join(temporal, '20261114180000_avisos_sin_cuenta.sql');
  fs.writeFileSync(copia, `${MIGRACION36}-- cambiada\n`);
  const distinta = await correPaso(BASE.replace(MIGRACION36_RUTA, '"$COPIA_36"'), 'Comprobar la acción',
    { ACCION: 'ensayo-36', CONFIRMAR: '', REMITENTE: '', COPIA_36: copia });
  paso('si las dos copias de la 36 no coinciden, «Comprobar la acción» falla y no deja nada en GITHUB_ENV',
    BASE.split(MIGRACION36_RUTA).length === 2
    && distinta.estado !== 0 && /Las dos copias de la 36 no coinciden/.test(distinta.texto) && Object.keys(distinta.salida).length === 0
    && leer('supabase/migrations/20261114180000_avisos_sin_cuenta.sql') === SQL36);
  const comprobar = await compruebaBase({ ACCION: 'ensayo-36' });
  const ensayo = await correPaso(BASE, 'Ensayo sin cambiar nada (se deshace al final)', comprobar.salida);
  await sesion(db);
  paso(`el ensayo-36 del flujo, ejecutado de verdad, monta la 36 + los verificadores 30, 31, 32, 33, 34 y 36 + rollback, pasa sobre la cadena de producción y no deja nada (${ensayo.estado === 0 ? 'OK' : ensayo.texto.trim().slice(-400)})`,
    ensayo.estado === 0 && ensayo.llamadas.length === 1
    && ensayo.texto.includes('ENSAYO CORRECTO: 36_avisos_sin_cuenta.sql y sus verificadores pasan')
    && ['30', '31', '32', '33', '34'].every((n) => new RegExp(`NOTICE: {2}RWAdar ${n} OK`).test(ensayo.stderr))
    && /NOTICE: {2}RWAdar 36 OK: sin cuenta apagado, 0 navegador\(es\) y 0 móvil\(es\) sin cuenta, 0 fila\(s\) en su historial, cupos 300 altas nuevas por hora por canal y como mucho 5000 navegadores y 20000 móviles, 0 de 30000 notificaciones web en 24 h, 0 baja\(s\) por fallos en 24 h, push apagado/.test(ensayo.stderr)
    && (await una(db, "select to_regclass('rwadar_novedades.sin_cuenta_web') t")).t === null
    && !(await una(db, "select pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure) d")).d.includes('sin_cuenta'));
}
await db.exec(HOSTIL);
await db.exec(SQL36);
await db.exec('grant execute on function rwadar_novedades.sin_cuenta_enviar_webpush(integer) to service_role; grant execute on function public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text) to public');
await db.exec(SQL36);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
{
  const c = await una(db, 'select * from rwadar_novedades.configuracion');
  const v = await todos();
  paso(`la 36 se aplica dos veces con privilegios por defecto hostiles; nace apagada, con la versión, los textos y los cupos del contrato, y no toca el push ni la clave VAPID${fallidos(v) ? ` · ${fallidos(v)}` : ''}`,
    c.sin_cuenta_activa === false && c.sin_cuenta_activada_el === null && c.sin_cuenta_version === VERSION_SC
    && c.sin_cuenta_texto_es === TEXTO_ES && c.sin_cuenta_texto_en === TEXTO_EN && c.sin_cuenta_cupo_hora === 300 && c.sin_cuenta_maximo === 20000
    && c.sin_cuenta_maximo_web === 5000 && c.sin_cuenta_tope_dia_web === 30000
    && c.push_habilitado === false && c.webpush_clave_publica === VAPID.publica && c.version_consentimiento === VERSION
    && !(await una(db, "select has_function_privilege('service_role', 'rwadar_novedades.sin_cuenta_enviar_webpush(integer)', 'EXECUTE') a")).a
    && !(await una(db, "select has_function_privilege('public', 'public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)', 'EXECUTE') a")).a
    && Object.values(v).every((x) => x.ok) && /sin cuenta apagado, 0 navegador/.test(v['36'].aviso));
  const textoUI = fs.readFileSync(path.join(raizRepo, 'docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md'), 'utf8');
  paso('el contrato de la API (docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md) lleva la versión y los dos textos exactos de la base',
    textoUI.includes(VERSION_SC) && textoUI.includes(TEXTO_ES) && textoUI.includes(TEXTO_EN));
}

/* =====================================================================
   5 · Permisos: anon solo la API sin cuenta
   ===================================================================== */
const ana = await alta(db, 'ana-sc@ejemplo.test');
const beto = await alta(db, 'beto-sc@ejemplo.test');
const consentir = async (u) => { await como(u); await db.query("select public.configurar_avisos_novedades(true, $1, 'web')", [VERSION]); await sesion(db); };
const registrarCuenta = async (u, s) => { await como(u); try { return (await una(db, 'select public.registrar_aviso_webpush($1, $2, $3) r', [s.endpoint, s.p256dh, s.auth])).r; } finally { await sesion(db); } };
const movilCuenta = async (u, token) => { await como(u); try { await db.query("select public.registrar_aviso_push($1, 'android')", [token]); } finally { await sesion(db); } };
const comoAnon = async (sql, p = []) => { await sesion(db, null, 'anon'); try { return (await una(db, sql, p)).r; } finally { await sesion(db); } };
const altaWeb = (s, extra = {}) => comoAnon('select public.alta_aviso_sin_cuenta_web($1, $2, $3, $4, $5, $6) r',
  [s.endpoint, extra.p256dh ?? s.p256dh, extra.auth ?? s.auth, extra.version ?? VERSION_SC, extra.idioma ?? 'es', extra.origen ?? 'novedades']);
const bajaWeb = (s, auth = s.auth) => comoAnon('select public.baja_aviso_sin_cuenta_web($1, $2) r', [s.endpoint, auth]);
const estadoWeb = (s, auth = s.auth) => comoAnon('select public.aviso_sin_cuenta_web_activo($1, $2) r', [s.endpoint, auth]);
const altaMovil = (token, extra = {}) => comoAnon('select public.alta_aviso_sin_cuenta_movil($1, $2, $3, $4, $5) r',
  [token, extra.plataforma ?? 'android', extra.version ?? VERSION_SC, extra.idioma ?? 'es', extra.origen ?? 'perfil']);
const bajaMovil = (token) => comoAnon('select public.baja_aviso_sin_cuenta_movil($1) r', [token]);
const estadoMovil = (token) => comoAnon('select public.aviso_sin_cuenta_movil_activo($1) r', [token]);
const texto = () => comoAnon('select public.avisos_sin_cuenta_texto() r');
const fcm = (n) => `https://fcm.googleapis.com/fcm/send/${n}:APA91bH${crypto.randomBytes(24).toString('base64url')}`;
const apple = (n) => `https://web.push.apple.com/Q${n}${crypto.randomBytes(24).toString('base64url')}`;
const mozilla = (n) => `https://updates.push.services.mozilla.com/wpush/v2/gAAAA${n}${crypto.randomBytes(30).toString('base64url')}`;
const expo = (n) => `ExponentPushToken[${`sc${n}`.padEnd(22, 'x')}]`;
const historial = async (canal) => { await sesion(db); return filas(db, 'select * from rwadar_novedades.historial_sin_cuenta where canal = $1 order by id', [canal]); };
{
  const deAvisos = [...new Set([SQL30, SQL31, SQL32, SQL33, SQL34, SQL36].flatMap((t) => [...t.matchAll(/create or replace function ([\w.]+)\(/g)].map((m) => m[1])))];
  const deAnon = await filas(db, `select p.oid::regprocedure::text f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname || '.' || p.proname = any($1) and has_function_privilege('anon', p.oid, 'EXECUTE') order by 1`, [deAvisos]);
  paso('de todas las funciones de las migraciones 30 a 36, anon ejecuta exactamente la baja por enlace (30), la clave pública (33) y las 8 de la API sin cuenta',
    isDeepStrictEqual(deAnon.map((f) => f.f), ['alta_aviso_sin_cuenta_movil(text,text,text,text,text)', 'alta_aviso_sin_cuenta_web(text,text,text,text,text,text)',
      'aviso_sin_cuenta_movil_activo(text)', 'aviso_sin_cuenta_web_activo(text,text)', 'avisos_publicos(integer)', 'avisos_sin_cuenta_texto()',
      'baja_aviso_sin_cuenta_movil(text)', 'baja_aviso_sin_cuenta_web(text,text)', 'baja_avisos(uuid)', 'clave_publica_webpush_anon()']));
  const anonNo = [];
  await sesion(db, null, 'anon');
  for (const sql of ['select * from rwadar_novedades.sin_cuenta_web', 'select * from rwadar_novedades.historial_sin_cuenta',
    'select rwadar_novedades.sin_cuenta_enviar_webpush(1)', 'select rwadar_novedades.sin_cuenta_prueba()',
    "select rwadar_novedades.sin_cuenta_quitar('web', 1, 'boton')", 'select rwadar_novedades.sin_cuenta_limpiar()']) anonNo.push(await codigo(() => db.query(sql)));
  await sesion(db, null, 'service_role');
  const servicio = await codigo(() => db.query('select public.avisos_sin_cuenta_texto()'));
  await sesion(db);
  paso('anon no lee ni escribe las tablas sin cuenta ni ejecuta sus funciones internas (42501), y service_role no ejecuta la API',
    [...anonNo, servicio].every((c) => c === '42501'));
}

/* =====================================================================
   6 · Apagado: se ve el texto, el alta dice «apagado», la baja funciona
   ===================================================================== */
const sUno = navegador(apple('uno'));
{
  const t = await texto();
  const r = await altaWeb(sUno);
  const m = await altaMovil(expo('apagado'));
  paso('con el interruptor apagado, el texto sale con su versión y la clave pública pero activo = false, y las altas web y móvil dicen «apagado» sin guardar nada',
    isDeepStrictEqual(t, { v: 1, activo: false, version: VERSION_SC, texto_es: TEXTO_ES, texto_en: TEXTO_EN, clave_publica: VAPID.publica })
    && isDeepStrictEqual(r, { ok: false, error: 'apagado' }) && isDeepStrictEqual(m, { ok: false, error: 'apagado' })
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web')) === 0
    && (await numero(db, 'select count(*) from rwadar_novedades.historial_sin_cuenta')) === 0);
  paso('la baja y el estado funcionan con todo apagado (no estaba: borrada = false, activa = false, servicio = false)',
    isDeepStrictEqual(await bajaWeb(sUno), { ok: true, borrada: false }) && isDeepStrictEqual(await bajaMovil(expo('apagado')), { ok: true, borrada: false })
    && isDeepStrictEqual(await estadoWeb(sUno), { ok: true, activa: false, vigente: false, servicio: false }));
  await sesion(db);
  const sinPush = await error(() => db.exec(ACTIVAR36));
  await db.exec('rollback').catch(() => {});
  paso('activar-sin-cuenta se niega con el push apagado (55000) y no enciende nada',
    sinPush?.code === '55000' && /el push está apagado/.test(sinPush.message)
    && (await una(db, 'select sin_cuenta_activa a from rwadar_novedades.configuracion')).a === false);
  await db.exec(ACTIVAR_PUSH);
  await db.exec("update vault.decrypted_secrets set name = 'APARTADA' where name = 'RWADAR_VAPID_PRIVADA'");
  const sinVapid = await error(() => db.exec(ACTIVAR36));
  await db.exec('rollback').catch(() => {});
  await db.exec("update vault.decrypted_secrets set name = 'RWADAR_VAPID_PRIVADA' where name = 'APARTADA'");
  paso('y sin la clave privada VAPID en Vault también se niega (55000), sin decir ningún valor',
    sinVapid?.code === '55000' && /falta la clave VAPID/.test(sinVapid.message) && !sinVapid.message.includes(VAPID.publica));
}
if (hayBash) {
  const entorno = { ...(await compruebaBase({ ACCION: 'activar-sin-cuenta', CONFIRMAR: 'AVISOS' })).salida, ACCION: 'activar-sin-cuenta' };
  const aplicar = await correPaso(BASE, 'Aplicar', entorno);
  const verificar = await correPaso(BASE, 'Verificar', entorno);
  paso(`activar-sin-cuenta, ejecutado de verdad (Aplicar y Verificar), enciende sin cuenta y pasan los verificadores 30, 32, 33 y 36 (${aplicar.estado === 0 && verificar.estado === 0 ? 'OK' : `${aplicar.texto}${verificar.texto}`.trim().slice(-300)})`,
    aplicar.estado === 0 && verificar.estado === 0 && isDeepStrictEqual(verificar.llamadas.map((l) => l.at(-1)), [30, 32, 33, 36].map(V))
    && /RWAdar 36 OK: sin cuenta activo/.test(verificar.stderr));
} else {
  await db.exec(ACTIVAR36);
}
{
  const antes = (await una(db, 'select sin_cuenta_activada_el f from rwadar_novedades.configuracion')).f;
  await db.exec(ACTIVAR36);
  const despues = (await una(db, 'select sin_cuenta_activada_el f, sin_cuenta_activa a from rwadar_novedades.configuracion'));
  paso('volver a activar no cambia la fecha de activación y el texto ya dice activo = true',
    despues.a === true && antes instanceof Date && despues.f.getTime() === antes.getTime() && (await texto()).activo === true);
}

/* =====================================================================
   7 · La prueba (prueba-sin-cuenta), con 5 o menos
   ===================================================================== */
const tUno = expo('uno');
{
  paso('el alta del primer navegador (iPhone) y del primer móvil (Android) sin cuenta funciona',
    isDeepStrictEqual(await altaWeb(sUno, { origen: 'perfil' }), { ok: true, estado: 'activa', nueva: true })
    && isDeepStrictEqual(await altaMovil(tUno), { ok: true, estado: 'activa', nueva: true }));
  if (hayBash) {
    const entorno = (await compruebaBase({ ACCION: 'prueba-sin-cuenta', CONFIRMAR: 'AVISOS' })).salida;
    const PASO = 'Probar las notificaciones sin cuenta';
    const desdeRecibidos = recibidos.length;
    const desdeCola = Number((await una(db, 'select coalesce(max(id), 0) m from net.http_request_queue')).m);
    expoAutomatico = true;
    const bien = await correPaso(BASE, PASO, entorno);
    expoAutomatico = false;
    const llegados = recibidos.slice(desdeRecibidos);
    const expoPedidas = (await filas(db, 'select * from net.http_request_queue where id > $1 and url = $2', [desdeCola, EXPO_SEND]));
    const todo = `${bien.texto}${bien.resumen}`;
    paso(`prueba-sin-cuenta, ejecutado de verdad: pide la prueba al servidor de la web y a Expo, lee las respuestas y las cuenta (${bien.estado === 0 ? 'OK' : bien.texto.trim().slice(-300)})`,
      bien.estado === 0 && llegados.length === 1 && llegados[0].vapid && JSON.parse(llegados[0].claro).titulo === PRUEBA_TITULO
      && JSON.parse(llegados[0].claro).url === 'https://rwadar.pages.dev/?avisos=1'
      && expoPedidas.length === 1 && expoPedidas[0].body.to === tUno && expoPedidas[0].body.priority === 'high'
      && expoPedidas[0].body.channelId === 'novedades' && isDeepStrictEqual(expoPedidas[0].body.data, { tipo: 'novedad', destino: 'inicio' })
      && /Aceptadas: 2/.test(bien.resumen) && /Códigos: \[200, 201\]/.test(bien.resumen)
      && /^\[\[[0-9]+, [0-9]+, 1\], \[[0-9]+, [0-9]+, 2\]\]$/.test(variablesPsql(bien.llamadas[1]).peticiones));
    paso('la salida y el resumen de la prueba solo llevan cuentas y códigos: ni direcciones, ni tokens, ni claves',
      [sUno.endpoint, sUno.auth, sUno.p256dh, tUno, VAPID.privada].every((s) => !todo.includes(s)));
    expoAutomatico = true;
    respuestaExpo.set(tUno, { status_code: 200, content: JSON.stringify({ data: { status: 'error', details: { error: 'DeviceNotRegistered' } } }) });
    respuestasServidor.set(sUno.endpoint, { status_code: 200, content: '{"codigo": 410}' });
    const caducadas = await correPaso(BASE, PASO, entorno);
    expoAutomatico = false;
    respuestaExpo.clear();
    respuestasServidor.clear();
    const bajas = (await filas(db, "select canal, motivo from rwadar_novedades.historial_sin_cuenta where accion = 'baja' order by id"));
    paso('si el navegador da 410 y Expo DeviceNotRegistered, la prueba los borra (baja «servicio» en el historial) y falla porque ninguna se aceptó',
      caducadas.estado !== 0 && /Suscripciones caducadas borradas \(404\/410 o DeviceNotRegistered\): 2/.test(caducadas.resumen)
      && /::error::Ninguna notificación de prueba sin cuenta se aceptó/.test(caducadas.stdout)
      && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web')) === 0
      && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_movil')) === 0
      && isDeepStrictEqual(bajas, [{ canal: 'web', motivo: 'servicio' }, { canal: 'movil', motivo: 'servicio' }]));
    const vacio = await correPaso(BASE, PASO, entorno);
    paso('sin ninguna suscripción sin cuenta, la prueba termina bien y lo dice', vacio.estado === 0 && /No hay ningún navegador ni móvil sin cuenta/.test(vacio.resumen));
  }
  await sesion(db);
  await db.exec('delete from rwadar_novedades.sin_cuenta_web; delete from rwadar_novedades.sin_cuenta_movil');
  for (let i = 0; i < 6; i++) await altaMovil(expo(`seis${i}`));
  const seis = await error(() => db.query('select rwadar_novedades.sin_cuenta_prueba()'));
  await sesion(db);
  paso('con más de 5 suscripciones sin cuenta, la prueba se niega (55000) y no pide nada',
    seis?.code === '55000' && /hay 6 suscripciones sin cuenta y la prueba solo sale con 5 o menos/.test(seis.message));
  for (let i = 0; i < 6; i++) await bajaMovil(expo(`seis${i}`));
}

/* =====================================================================
   8 · Alta, renovación, baja y estado: forma, versión, clave y cupos
   ===================================================================== */
const sDos = navegador(fcm('dos'));
const sTres = navegador(mozilla('tres'));
{
  const malas = [
    ['servicio desconocido', { ...sDos, endpoint: 'https://push.ejemplo.test/x' }],
    ['http', { ...sDos, endpoint: sDos.endpoint.replace('https:', 'http:') }],
    ['p256dh corto', sDos, { p256dh: 'BAAA' }],
    ['auth largo', sDos, { auth: 'A'.repeat(30) }],
    ['idioma', sDos, { idioma: 'fr' }],
    ['origen', sDos, { origen: 'correo' }],
    ['versión sin forma', sDos, { version: 'Versión rara!' }],
  ];
  const codigos = [];
  for (const [, s, extra] of malas) codigos.push(await codigo(() => altaWeb(s, extra)));
  paso(`el alta web rechaza ${malas.length} entradas sin forma con 22023 (servicio desconocido, http, claves, idioma, origen, versión)`, codigos.every((c) => c === '22023'));
  paso('una versión del texto que no es la vigente da «version» y no guarda nada',
    isDeepStrictEqual(await altaWeb(sDos, { version: 'sin-cuenta-v0-2026-11-01' }), { ok: false, error: 'version' })
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web')) === 0);
  // El navegador da las claves en base64 con relleno (algunos, «+/» y «=»).
  const auth64 = Buffer.from(sDos.auth, 'base64url').toString('base64');
  const p64 = Buffer.from(sDos.p256dh, 'base64url').toString('base64');
  const nueva = await altaWeb(sDos, { auth: auth64, p256dh: p64, idioma: 'en', origen: 'avisos' });
  const fila = await una(db, 'select * from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sDos.endpoint]);
  const h1 = await historial('web');
  paso('el alta nueva guarda la suscripción con las claves normalizadas a base64url, la versión, el idioma y el origen, y apunta el alta «nueva» en el historial (sin la dirección)',
    isDeepStrictEqual(nueva, { ok: true, estado: 'activa', nueva: true }) && fila.auth === sDos.auth && fila.p256dh === sDos.p256dh
    && fila.version === VERSION_SC && fila.idioma === 'en' && fila.origen === 'avisos' && fila.fallos === 0
    && h1.at(-1).ref === fila.ref && h1.at(-1).accion === 'alta' && h1.at(-1).motivo === 'nueva' && h1.at(-1).version === VERSION_SC
    && h1.at(-1).idioma === 'en' && h1.at(-1).origen === 'avisos' && !JSON.stringify(h1).includes(sDos.endpoint));
  await sesion(db);
  await db.query("update rwadar_novedades.sin_cuenta_web set actualizado_el = now() - interval '1 day' where id = $1", [fila.id]);
  const renueva = await altaWeb(sDos);
  const fila2 = await una(db, 'select * from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sDos.endpoint]);
  paso('volver a darla de alta la renueva (nueva = false, la misma ref, fecha al día) sin otra fila en el historial',
    isDeepStrictEqual(renueva, { ok: true, estado: 'activa', nueva: false }) && fila2.ref === fila.ref && fila2.idioma === 'es'
    && fila2.actualizado_el > fila.actualizado_el && (await historial('web')).length === h1.length);
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const ajena = { p256dh: ua.getPublicKey('base64url'), auth: crypto.randomBytes(16).toString('base64url') };
  const usurpar = await altaWeb({ ...sDos, p256dh: ajena.p256dh, auth: ajena.auth });
  paso('la misma dirección con otra clave auth se rechaza («en_uso») y no cambia nada; tampoco la da de baja ni la consulta',
    isDeepStrictEqual(usurpar, { ok: false, error: 'en_uso' })
    && (await una(db, 'select auth from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sDos.endpoint])).auth === sDos.auth
    && isDeepStrictEqual(await bajaWeb(sDos, ajena.auth), { ok: true, borrada: false })
    && isDeepStrictEqual(await estadoWeb(sDos, ajena.auth), { ok: true, activa: false, vigente: false, servicio: true }));
  paso('el estado con la clave buena dice activa, vigente y servicio',
    isDeepStrictEqual(await estadoWeb(sDos), { ok: true, activa: true, vigente: true, servicio: true }));
  await sesion(db);
  await db.query("update rwadar_novedades.sin_cuenta_web set version = 'sin-cuenta-v0-2026-11-01' where endpoint = $1", [sDos.endpoint]);
  const vieja = await estadoWeb(sDos);
  await altaWeb(sDos);
  const h2 = await historial('web');
  paso('con una versión antigua guardada, el estado dice vigente = false y renovar con la vigente apunta un alta «version»',
    vieja.activa === true && vieja.vigente === false && h2.length === h1.length + 1 && h2.at(-1).motivo === 'version' && h2.at(-1).ref === fila.ref);
  // Baja y vuelta a dar de alta: ref nueva.
  const baja = await bajaWeb(sDos);
  const h3 = await historial('web');
  const otra = await altaWeb(sDos);
  const fila3 = await una(db, 'select * from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sDos.endpoint]);
  paso('la baja (con su clave auth) borra el navegador y apunta la baja «boton»; un alta después es otra (ref nueva)',
    isDeepStrictEqual(baja, { ok: true, borrada: true }) && h3.at(-1).accion === 'baja' && h3.at(-1).motivo === 'boton' && h3.at(-1).ref === fila.ref
    && otra.nueva === true && fila3.ref !== fila.ref);
  // Móvil.
  const malasM = [[expo('x').replace('[', '('), {}], ['ExponentPushToken[corto]', {}], [expo('ios'), { plataforma: 'ios' }], [expo('v'), { idioma: 'de' }]];
  const codM = [];
  for (const [tk, extra] of malasM) codM.push(await codigo(() => altaMovil(tk, extra)));
  const tDos = expo('dos');
  const m1 = await altaMovil(tDos, { idioma: 'en', origen: 'novedades' });
  const m2 = await altaMovil(tDos);
  paso('el alta del móvil rechaza tokens sin forma, iOS e idiomas raros (22023); guarda y renueva, con su alta «nueva» en el historial',
    codM.every((c) => c === '22023') && m1.nueva === true && m2.nueva === false
    && (await historial('movil')).filter((h) => h.motivo === 'nueva').length >= 2
    && isDeepStrictEqual(await estadoMovil(tDos), { ok: true, activa: true, vigente: true, servicio: true }));
  // Cupos.
  await sesion(db);
  const nuevasHora = await numero(db, "select count(*) from rwadar_novedades.historial_sin_cuenta where canal = 'web' and accion = 'alta' and motivo = 'nueva' and creado_el > now() - interval '1 hour'");
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_cupo_hora = $1', [nuevasHora + 1]);
  const dentro = await altaWeb(sTres);
  const sCuatro = navegador(fcm('cuatro'));
  const fuera = await altaWeb(sCuatro);
  const renovarConCupo = await altaWeb(sTres);
  await sesion(db);
  const total = await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web');
  // El máximo de la web es el suyo (5 000), no el del móvil (20 000).
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_cupo_hora = 300, sin_cuenta_maximo = $1, sin_cuenta_maximo_web = $2', [total, total + 1]);
  const sCuatroBis = navegador(fcm('cuatro-bis'));
  const usaElSuyo = await altaWeb(sCuatroBis);
  await sesion(db);
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_maximo = 20000, sin_cuenta_maximo_web = $1', [total + 1]);
  const lleno = await altaWeb(sCuatro);
  const renovarLleno = await altaWeb(sTres);
  await sesion(db);
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_maximo_web = 5000');
  await bajaWeb(sCuatroBis);
  paso('cupos: pasado el de altas nuevas por hora da «cupo» y llegado al máximo de la web (sin_cuenta_maximo_web, no el del móvil) da «lleno», sin guardar nada; renovar no gasta cupo',
    dentro.nueva === true && isDeepStrictEqual(fuera, { ok: false, error: 'cupo' }) && renovarConCupo.nueva === false
    && usaElSuyo.nueva === true
    && isDeepStrictEqual(lleno, { ok: false, error: 'lleno' }) && renovarLleno.nueva === false
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sCuatro.endpoint])) === 0);
  paso('el historial sin cuenta solo admite añadir: cambiar o borrar una fila reciente da 42501, también al propietario',
    (await codigo(() => db.query("update rwadar_novedades.historial_sin_cuenta set motivo = 'boton' where accion = 'baja'"))) === '42501'
    && (await codigo(() => db.query('delete from rwadar_novedades.historial_sin_cuenta'))) === '42501');
}

/* =====================================================================
   9 · Envío web desde procesar(): a quién, qué y por dónde
   ===================================================================== */
const anunciar = async (clave, titulo, texto, enlace = 'https://rwadar.pages.dev/') => {
  await sesion(db);
  return Number((await una(db, "select rwadar_novedades.anunciar('novedad', $1, $2, $3, $4) id", [clave, titulo, texto, enlace])).id);
};
const procesar = async () => {
  await sesion(db);
  const avisos = [];
  const r = (await db.query('select rwadar_novedades.procesar() r', [], { onNotice: (n) => avisos.push(n.message) })).rows[0].r;
  return { r, avisos };
};
const ultimaPeticion = async () => { await sesion(db); return numero(db, 'select coalesce(max(id), 0) from net.http_request_queue'); };
const cola = async (desde, url) => { await sesion(db); return filas(db, 'select * from net.http_request_queue where id > $1 and url = $2 order by id', [desde, url]); };
const enviosWeb = async (anuncio) => { await sesion(db); return filas(db, `select e.*, w.endpoint from rwadar_novedades.envios_sin_cuenta_web e
  join rwadar_novedades.sin_cuenta_web w on w.id = e.suscripcion_id where e.anuncio_id = $1 order by e.id`, [anuncio]); };
const pushes = async (anuncio) => { await sesion(db); return filas(db, `select s.*, m.token from rwadar_novedades.pushes_sin_cuenta s
  join rwadar_novedades.sin_cuenta_movil m on m.id = s.movil_id where s.anuncio_id = $1 order by s.id`, [anuncio]); };

// Ana (cuenta con permiso) tiene en su cuenta el mismo navegador sAna que
// también se dio de alta sin cuenta: le llega una sola (la de la cuenta).
// Beto (cuenta sin permiso) tiene sBeto en su cuenta y sin cuenta: le llega
// la de sin cuenta. Lo mismo con los móviles.
const sAna = navegador(apple('ana'));
const sBeto = navegador(fcm('beto'));
const tAna = expo('ana');
const tBeto = expo('beto');
const tSolo = expo('solo');
await consentir(ana);
await registrarCuenta(ana, sAna);
await registrarCuenta(beto, sBeto);
await movilCuenta(ana, tAna);
await movilCuenta(beto, tBeto);
for (const s of [sAna, sBeto]) await altaWeb(s);
for (const t of [tAna, tBeto, tSolo]) await altaMovil(t);
let a1;
{
  const sinCuentaWeb = (await filas(db, 'select endpoint from rwadar_novedades.sin_cuenta_web order by id')).map((f) => f.endpoint);
  const desde = await ultimaPeticion();
  a1 = await anunciar('novedad:sc-uno', 'Avisos sin cuenta', 'Ya puedes activar las notificaciones sin cuenta.');
  // Llega después del anuncio: no le llega.
  const sTarde = navegador(fcm('tarde'));
  await altaWeb(sTarde);
  const { r, avisos } = await procesar();
  const web = await cola(desde, URL_SERVIDOR);
  const deSinCuenta = web.map((p) => p.body.endpoint);
  const esperados = sinCuentaWeb.filter((e) => e !== sAna.endpoint).sort();
  paso(`procesar() pide al servidor de la web el anuncio para cada navegador sin cuenta dado de alta antes, salvo el de Ana (su cuenta con permiso ya lo recibe), y no para el que llegó después (${JSON.stringify(r)})`,
    r.estado === 'encendido' && r.sin_cuenta_webpush_enviados === esperados.length && avisos.length === 0
    && isDeepStrictEqual(deSinCuenta.filter((e) => e !== sAna.endpoint).sort(), esperados)
    && web.filter((p) => p.body.endpoint === sAna.endpoint).length === 1
    && !deSinCuenta.includes(sTarde.endpoint) && esperados.includes(sBeto.endpoint));
  const p = web.find((x) => x.body.endpoint === sDos.endpoint);
  paso('cada petición sin cuenta sigue el contrato de la 33: POST al servidor de la web con las cabeceras de la clave VAPID, 25 segundos y la carga de la lista de avisos (?avisos=1)',
    p && p.timeout_milliseconds === 25000
    && isDeepStrictEqual(p.headers, { 'content-type': 'application/json', accept: 'application/json',
      'x-rwadar-vapid-privada': VAPID.privada, 'x-rwadar-vapid-publica': VAPID.publica })
    && isDeepStrictEqual(p.body, { endpoint: sDos.endpoint, p256dh: sDos.p256dh, auth: sDos.auth,
      carga: { v: 1, titulo: 'Avisos sin cuenta', texto: 'Ya puedes activar las notificaciones sin cuenta.', url: 'https://rwadar.pages.dev/?avisos=1', etiqueta: `rwadar-${a1}` } }));
  const filasA1 = await enviosWeb(a1);
  paso('los envíos sin cuenta quedan «enviando», con un intento y su petición; otra vuelta antes de la respuesta no repite nada',
    filasA1.length === esperados.length && filasA1.every((e) => e.estado === 'enviando' && e.intentos === 1 && e.peticion_id !== null)
    && (await (async () => { await sesion(db); return numero(db, 'select rwadar_novedades.sin_cuenta_enviar_webpush(200)'); })()) === 0);
  const desdeRecibidos = recibidos.length;
  await atenderPgNet();
  const llegados = recibidos.slice(desdeRecibidos);
  const { r: r2 } = await procesar();
  const tras = await enviosWeb(a1);
  paso('de punta a punta: cada navegador sin cuenta (y Ana, una sola vez, por su cuenta) recibe la notificación firmada y la descifra; la vuelta siguiente las marca «enviado»',
    llegados.length === esperados.length + 1 && llegados.every((x) => x.vapid && JSON.parse(x.claro).titulo === 'Avisos sin cuenta')
    && llegados.filter((x) => x.endpoint === sAna.endpoint).length === 1
    && r2.sin_cuenta_webpush_leidos === esperados.length && tras.every((e) => e.estado === 'enviado' && e.codigo === 201 && e.peticion_id === null));
}

/* =====================================================================
   10 · Envío de Expo sin cuenta: tickets, recibos y DeviceNotRegistered
   ===================================================================== */
{
  const desde = Number((await una(db, "select coalesce(min(id), 0) - 1 m from net.http_request_queue where url = $1 and body ->> 'title' = 'Avisos sin cuenta'", [EXPO_SEND])).m);
  const expoA1 = (await cola(desde, EXPO_SEND)).filter((x) => x.body.title === 'Avisos sin cuenta');
  const aTokens = expoA1.map((x) => x.body.to);
  const p = expoA1.find((x) => x.body.to === tSolo);
  paso('el mismo procesar() manda el anuncio por Expo a los móviles sin cuenta (Beto, sin permiso en su cuenta, y el suelto) y no al de Ana (su cuenta lo recibe), una sola vez cada uno',
    aTokens.filter((t) => t === tAna).length === 1 && aTokens.filter((t) => t === tBeto).length === 1 && aTokens.filter((t) => t === tSolo).length === 1
    && (await pushes(a1)).map((x) => x.token).sort().join() === [tBeto, expo('dos'), tSolo].sort().join());
  paso('cada push sin cuenta: Expo con prioridad alta, canal novedades, sonido y data {tipo, destino}; sin datos personales',
    p && isDeepStrictEqual(p.body, { to: tSolo, title: 'Avisos sin cuenta', body: 'Ya puedes activar las notificaciones sin cuenta.',
      sound: 'default', priority: 'high', channelId: 'novedades', data: { tipo: 'novedad', destino: 'inicio' } })
    && isDeepStrictEqual(p.headers, { 'content-type': 'application/json', accept: 'application/json' }) && p.timeout_milliseconds === 10000);
  const filasP = await pushes(a1);
  const de = (tk) => filasP.find((x) => x.token === tk);
  await responder(de(tSolo).peticion_id, 200, { data: { status: 'ok', id: 'ticket-solo' } });
  await responder(de(tBeto).peticion_id, 200, { data: [{ status: 'error', message: 'no existe', details: { error: 'DeviceNotRegistered' } }] });
  await responder(de(expo('dos')).peticion_id, 500, 'caído');
  const { r } = await procesar();
  const tras = await pushes(a1);
  const hBeto = (await historial('movil')).at(-1);
  paso(`la lectura de Expo: ticket «ok» → ticket; DeviceNotRegistered → el móvil se borra con su baja «servicio»; un 500 → a reintentar (${JSON.stringify({ leidos: r.sin_cuenta_push_leidos })})`,
    r.sin_cuenta_push_leidos === 3 && tras.find((x) => x.token === tSolo)?.estado === 'ticket' && tras.find((x) => x.token === tSolo)?.ticket_id === 'ticket-solo'
    && !tras.some((x) => x.token === tBeto) && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_movil where token = $1', [tBeto])) === 0
    && hBeto.accion === 'baja' && hBeto.motivo === 'servicio'
    && tras.find((x) => x.token === expo('dos'))?.estado === 'reintentar');
  // Recibo a los 15 minutos.
  await sesion(db);
  await db.query("update rwadar_novedades.pushes_sin_cuenta set ticket_el = now() - interval '16 minutes' where ticket_id = 'ticket-solo'");
  await db.query("update rwadar_novedades.pushes_sin_cuenta set actualizado_el = now() - interval '6 minutes' where estado = 'reintentar'");
  const antes = await ultimaPeticion();
  const n = await numero(db, 'select rwadar_novedades.sin_cuenta_enviar_push(200)');
  const recibos = await cola(antes, EXPO_RECIBOS);
  const reenvios = await cola(antes, EXPO_SEND);
  paso('a los 15 minutos se consulta el recibo del ticket (getReceipts con su id) y el 500 se reintenta (segundo intento)',
    n === 2 && recibos.length === 1 && isDeepStrictEqual(recibos[0].body, { ids: ['ticket-solo'] })
    && reenvios.length === 1 && reenvios[0].body.to === expo('dos') && (await pushes(a1)).find((x) => x.token === expo('dos')).intentos === 2);
  await responder(recibos[0].id, 200, { data: { 'ticket-solo': { status: 'ok' } } });
  await responder(reenvios[0].id, 200, { data: { status: 'ok', id: 'ticket-dos' } });
  await sesion(db);
  await numero(db, 'select rwadar_novedades.sin_cuenta_leer_push()');
  const fin = await pushes(a1);
  paso('el recibo «ok» deja el push «aceptado» y terminado', fin.find((x) => x.token === tSolo)?.estado === 'aceptado'
    && fin.find((x) => x.token === tSolo)?.terminado_el instanceof Date && fin.find((x) => x.token === expo('dos'))?.estado === 'ticket');
}
{
  // Ni dos ni ninguno en el móvil: lo que decide es lo que ya repartió
  // repartir() (30) a las cuentas, no cómo están ahora.
  const carla = await alta(db, 'carla-sc@ejemplo.test');
  const dani = await alta(db, 'dani-sc@ejemplo.test');
  const eva = await alta(db, 'eva-sc@ejemplo.test');
  await consentir(carla);
  await consentir(eva);
  const tCarla = expo('carla');
  const tDani = expo('dani');
  const tEva1 = expo('eva-uno');
  const tEva2 = expo('eva-dos');
  await movilCuenta(dani, tDani);
  await movilCuenta(eva, tEva1);
  for (const t of [tCarla, tDani, tEva2]) await altaMovil(t);
  const deCuentas = async (a) => { await sesion(db); return (await filas(db, "select token from rwadar_novedades.pushes where anuncio_id = $1 and tipo = 'anuncio' and token is not null order by token", [a])).map((x) => x.token); };
  const a = await anunciar('novedad:sc-ni-dos-ni-ninguno', 'Ni dos ni ninguno', 'Una sola por móvil.');
  // Carla mete su móvil en la cuenta después de publicarse y antes de
  // repartir: se lo da su cuenta y no sale el de sin cuenta.
  await movilCuenta(carla, tCarla);
  // Antes de procesar(), repartir() a solas: después Dani da el permiso
  // (su cuenta ya no lo recibe) y Eva mete otro móvil en la cuenta (repartir
  // no se lo dio): a los dos les llega el de sin cuenta.
  await sesion(db);
  await db.query('select rwadar_novedades.repartir()');
  // PGlite guarda la hora con milisegundos y la 36 compara d.creado_el <= p.creado_el: un empate dejaba a Eva sin aviso.
  await new Promise((r) => setTimeout(r, 2));
  await consentir(dani);
  await movilCuenta(eva, tEva2);
  const { r } = await procesar();
  const sc = (await pushes(a)).map((x) => x.token);
  const cuentas = await deCuentas(a);
  paso(`móvil sin cuenta y con cuenta: una sola notificación por móvil, según lo que repartió repartir() (${JSON.stringify({ sin_cuenta: r.sin_cuenta_push_enviados })})`,
    cuentas.includes(tCarla) && !sc.includes(tCarla)
    && !cuentas.includes(tDani) && sc.filter((t) => t === tDani).length === 1
    && cuentas.includes(tEva1) && !cuentas.includes(tEva2) && sc.filter((t) => t === tEva2).length === 1);
  for (const t of [tCarla, tDani, tEva2]) await bajaMovil(t);
}

/* =====================================================================
   11 · Lectura web: 404/410, tres fallos seguidos, reintentos
   ===================================================================== */
{
  const sCinco = navegador(fcm('cinco'));
  const sSeis = navegador(mozilla('seis'));
  const sSiete = navegador(fcm('siete'));
  // Fallos generales nuestros: el servidor de la web (-1, p. ej. al cifrar)
  // y la clave VAPID o la firma (401 y 403, que salen para todos).
  const sNuestros = { '-1': navegador(fcm('nuestro-menos-uno')), 401: navegador(fcm('nuestro-401')), 403: navegador(apple('nuestro-403')) };
  for (const s of [sCinco, sSeis, sSiete, ...Object.values(sNuestros)]) await altaWeb(s);
  const tFallo = expo('fallo');
  await altaMovil(tFallo);
  respuestasServidor.set(sCinco.endpoint, { status_code: 200, content: '{"codigo": 404}' });
  respuestasServidor.set(sSeis.endpoint, { status_code: 200, content: '{"codigo": 413}' });
  respuestasServidor.set(sSiete.endpoint, { status_code: 200, content: '{"codigo": 429}' });
  for (const [c, s] of Object.entries(sNuestros)) respuestasServidor.set(s.endpoint, { status_code: 200, content: `{"codigo": ${c}}` });
  const refSeis = (await una(db, 'select ref from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sSeis.endpoint])).ref;
  const bajasFallosMovilAntes = await numero(db, "select count(*) from rwadar_novedades.historial_sin_cuenta where canal = 'movil' and accion = 'baja' and motivo = 'fallos'");
  const fallosSeis = [];
  const fallosMovil = [];
  const fallosNuestros = [];
  const anunciosFallo = [];
  for (let i = 1; i <= 3; i++) {
    const a = await anunciar(`novedad:sc-fallo-${i}`, `Fallo ${i}`, 'Para contar los fallos seguidos.');
    const desde = await ultimaPeticion();
    await procesar();
    await atenderPgNet();
    for (const x of (await cola(desde, EXPO_SEND)).filter((y) => y.body.to === tFallo)) {
      await responder(x.id, 200, { data: { status: 'error', details: { error: 'MismatchSenderId' } } });
    }
    await procesar();
    fallosSeis.push((await una(db, 'select fallos from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sSeis.endpoint]))?.fallos ?? null);
    fallosMovil.push((await una(db, 'select fallos from rwadar_novedades.sin_cuenta_movil where token = $1', [tFallo]))?.fallos ?? null);
    fallosNuestros.push((await filas(db, 'select fallos from rwadar_novedades.sin_cuenta_web where endpoint = any($1) order by id',
      [Object.values(sNuestros).map((x) => x.endpoint)])).map((x) => x.fallos).join(''));
    anunciosFallo.push(a);
    if (i === 1) {
      const e = await enviosWeb(a);
      paso('404 borra el navegador (con sus envíos) y apunta la baja «servicio»; 429 queda a reintentar',
        !e.some((x) => x.endpoint === sCinco.endpoint) && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sCinco.endpoint])) === 0
        && e.find((x) => x.endpoint === sSiete.endpoint)?.estado === 'reintentar' && e.find((x) => x.endpoint === sSiete.endpoint)?.codigo === 429);
    }
  }
  respuestasServidor.clear();
  const bajaSeis = (await filas(db, "select motivo from rwadar_novedades.historial_sin_cuenta where ref = $1 and accion = 'baja'", [refSeis]));
  paso(`tres fallos seguidos que no se arreglan reintentando (413 del servicio de push) borran el navegador con la baja «fallos» (${fallosSeis.join(',')})`,
    isDeepStrictEqual(fallosSeis, [1, 2, null]) && isDeepStrictEqual(bajaSeis.map((b) => b.motivo), ['fallos']));
  const pushesFallo = [];
  for (const a of anunciosFallo) pushesFallo.push(...(await pushes(a)).filter((x) => x.token === tFallo));
  const enviosNuestros = [];
  for (const a of anunciosFallo) enviosNuestros.push(...(await enviosWeb(a)).filter((x) => Object.values(sNuestros).some((y) => y.endpoint === x.endpoint)));
  paso(`un fallo general nuestro no borra a nadie: MismatchSenderId de Expo (credenciales de FCM del proyecto) y -1, 401 y 403 del servidor de la web dejan cada envío «fallido» sin contar fallos, tres anuncios seguidos (${fallosMovil.join(',')} · ${fallosNuestros.join(',')})`,
    isDeepStrictEqual(fallosMovil, [0, 0, 0]) && isDeepStrictEqual(fallosNuestros, ['000', '000', '000'])
    && pushesFallo.length === 3 && pushesFallo.every((x) => x.estado === 'fallido' && x.error === 'MismatchSenderId')
    && enviosNuestros.length === 9 && enviosNuestros.every((x) => x.estado === 'fallido' && [-1, 401, 403].includes(x.codigo))
    && (await numero(db, "select count(*) from rwadar_novedades.historial_sin_cuenta where canal = 'movil' and accion = 'baja' and motivo = 'fallos'")) === bajasFallosMovilAntes
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web where endpoint = any($1)', [Object.values(sNuestros).map((x) => x.endpoint)])) === 3);
  for (const s of Object.values(sNuestros)) await bajaWeb(s);
  await bajaMovil(tFallo);
  const sOcho = navegador(fcm('ocho'));
  await altaWeb(sOcho);
  respuestasServidor.set(sOcho.endpoint, { status_code: 200, content: '{"codigo": 400}' });
  await anunciar('novedad:sc-bien-1', 'Uno', 'Primero falla.');
  await procesar(); await atenderPgNet(); await procesar();
  respuestasServidor.delete(sOcho.endpoint);
  await anunciar('novedad:sc-bien-2', 'Dos', 'Después llega.');
  await procesar(); await atenderPgNet(); await procesar();
  paso('un envío que llega pone a cero los fallos seguidos',
    (await una(db, 'select fallos from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sOcho.endpoint])).fallos === 0);
}

/* =====================================================================
   12 · Solo con los interruptores y dentro de los 7 días
   ===================================================================== */
{
  const sinPedir = async () => {
    const desde = await ultimaPeticion();
    const r = await procesar();
    return { r: r.r, web: (await cola(desde, URL_SERVIDOR)).length, expo: (await cola(desde, EXPO_SEND)).length };
  };
  await sesion(db);
  await db.exec(APAGAR36);
  const aApagado = await anunciar('novedad:sc-apagado', 'Con sin cuenta apagado', 'No sale para quien no tiene cuenta.');
  const apagado = await sinPedir();
  const altaApagada = await altaWeb(navegador(fcm('apagada')));
  paso('apagar-sin-cuenta: el alta dice «apagado» y procesar() no pide nada sin cuenta (las cuentas siguen igual)',
    isDeepStrictEqual(altaApagada, { ok: false, error: 'apagado' }) && apagado.r.sin_cuenta_webpush_enviados === 0 && apagado.r.sin_cuenta_push_enviados === 0
    && (await enviosWeb(aApagado)).length === 0 && (await pushes(aApagado)).length === 0
    && isDeepStrictEqual(await bajaWeb(sTres), { ok: true, borrada: true }));
  await db.exec(ACTIVAR36);
  const reactivado = await sinPedir();
  paso('al volver a activarlo, lo publicado mientras estaba apagado no sale: nada viejo de golpe',
    reactivado.r.sin_cuenta_webpush_enviados === 0 && (await enviosWeb(aApagado)).length === 0);
  // Push apagado (30): no se envía nada sin cuenta.
  await sesion(db);
  await db.exec("update rwadar_novedades.configuracion set push_habilitado = false, push_activado_el = null");
  const aSinPush = await anunciar('novedad:sc-sin-push', 'Sin push', 'Con el push apagado no sale.');
  await sesion(db);
  const directo = await numero(db, 'select rwadar_novedades.sin_cuenta_enviar_webpush(200) + rwadar_novedades.sin_cuenta_enviar_push(200)');
  const t = await texto();
  await db.exec(ACTIVAR_PUSH);
  paso('con el push de la 30 apagado, ni la web ni Expo sin cuenta piden nada y el texto dice activo = false',
    directo === 0 && (await enviosWeb(aSinPush)).length === 0 && t.activo === false);
  // Los 7 días: con las activaciones de hace un mes y un navegador dado de
  // alta hace un mes, sale el de hace 6 días y no el de hace 8.
  const sNueve = navegador(fcm('nueve'));
  await altaWeb(sNueve);
  const aOcho = await anunciar('novedad:sc-ocho-dias', 'Hace ocho días', 'Fuera de los 7 días.');
  const aSeisDias = await anunciar('novedad:sc-seis-dias', 'Hace seis días', 'Dentro de los 7 días.');
  await sesion(db);
  await db.query("update rwadar_novedades.sin_cuenta_web set creado_el = now() - interval '30 days' where endpoint = $1", [sNueve.endpoint]);
  await db.query("update rwadar_novedades.anuncios set publicado_el = now() - interval '8 days' where id = $1", [aOcho]);
  await db.query("update rwadar_novedades.anuncios set publicado_el = now() - interval '6 days' where id = $1", [aSeisDias]);
  await db.exec("update rwadar_novedades.configuracion set push_activado_el = now() - interval '30 days', sin_cuenta_activada_el = now() - interval '30 days'");
  await numero(db, 'select rwadar_novedades.sin_cuenta_enviar_webpush(500)');
  const ocho = await enviosWeb(aOcho);
  const seis = await enviosWeb(aSeisDias);
  await db.exec('update rwadar_novedades.configuracion set push_activado_el = now(), sin_cuenta_activada_el = now()');
  paso('solo salen los anuncios publicados en los últimos 7 días (el de hace 6 sí, el de hace 8 no) y después del alta de cada navegador',
    ocho.length === 0 && seis.length === 1 && seis[0].endpoint === sNueve.endpoint);
  await atenderPgNet();
  await procesar();
  await sesion(db);
  paso('una tanda fuera de 1..500 se rechaza (22023)',
    (await codigo(() => db.query('select rwadar_novedades.sin_cuenta_enviar_webpush(0)'))) === '22023'
    && (await codigo(() => db.query('select rwadar_novedades.sin_cuenta_enviar_push(501)'))) === '22023');
  // Tope diario de la web (cupo gratis de Cloudflare): llegado, no se pide
  // nada; con hueco para uno, sale uno y los demás esperan a otra vuelta.
  const sDiez = navegador(fcm('diez'));
  const sOnce = navegador(mozilla('once'));
  for (const x of [sDiez, sOnce]) await altaWeb(x);
  const aTope = await anunciar('novedad:sc-tope-diario', 'Tope diario', 'Con el tope diario alcanzado espera.');
  await sesion(db);
  const enDia = await numero(db, "select coalesce(sum(intentos), 0) from rwadar_novedades.envios_sin_cuenta_web where creado_el > now() - interval '24 hours'");
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_tope_dia_web = $1', [enDia]);
  const avisosTope = [];
  const conTope = Number((await db.query('select rwadar_novedades.sin_cuenta_enviar_webpush(200) n', [], { onNotice: (n) => avisosTope.push(n.message) })).rows[0].n);
  const tras0 = (await enviosWeb(aTope)).length;
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_tope_dia_web = $1', [enDia + 1]);
  const conHueco = await numero(db, 'select rwadar_novedades.sin_cuenta_enviar_webpush(200)');
  const tras1 = (await enviosWeb(aTope)).length;
  const vTope = await verificador('36');
  await sesion(db);
  await db.query('update rwadar_novedades.configuracion set sin_cuenta_tope_dia_web = 30000');
  const conTodo = await numero(db, 'select rwadar_novedades.sin_cuenta_enviar_webpush(200)');
  const tras2 = (await enviosWeb(aTope)).length;
  paso(`tope diario de notificaciones web sin cuenta: llegado, no pide nada y lo avisa; con hueco para una, sale una; el verificador 36 lo avisa sin fallar; quitado, sale el resto (${conTope}, ${conHueco}, ${conTodo})`,
    conTope === 0 && tras0 === 0 && avisosTope.some((m) => /tope diario de [0-9]+ notificaciones web sin cuenta alcanzado/.test(m))
    && conHueco === 1 && tras1 === 1 && vTope.ok && /tope diario alcanzado/.test((vTope.avisos || []).join(' '))
    && conTodo >= 1 && tras2 >= 2);
  await atenderPgNet();
  await procesar();
  for (const x of [sDiez, sOnce]) await bajaWeb(x);
}

/* =====================================================================
   13 · Avisos publicados para la lista sin sesión
   ===================================================================== */
{
  await sesion(db);
  const retenido = Number((await una(db, "insert into rwadar_novedades.anuncios (tipo, clave, titulo, texto, enlace) values ('novedad', 'novedad:sc-retenido', 'Retenido', 'No se ve.', 'https://rwadar.pages.dev/') returning id")).id);
  const viejo = await anunciar('novedad:sc-muy-viejo', 'Muy viejo', 'De hace 100 días.');
  await sesion(db);
  await db.query("update rwadar_novedades.anuncios set publicado_el = now() - interval '100 days' where id = $1", [viejo]);
  const lista = await comoAnon('select public.avisos_publicos(50) r');
  const tres = await comoAnon('select public.avisos_publicos(3) r');
  const fechas = lista.map((x) => Date.parse(x.creado_el));
  paso('avisos_publicos (anon) da los anuncios publicados de los últimos 90 días, del más nuevo al más viejo, sin retenidos ni la bienvenida, con {id, tipo, titulo, texto, enlace, creado_el}',
    lista.length > 5 && tres.length === 3 && !lista.some((x) => Number(x.id) === retenido || Number(x.id) === viejo || x.tipo === 'bienvenida')
    && lista.every((x) => isDeepStrictEqual(Object.keys(x).sort(), ['creado_el', 'enlace', 'id', 'texto', 'tipo', 'titulo']))
    && fechas.every((f, i) => i === 0 || f <= fechas[i - 1])
    && (await codigo(() => comoAnon('select public.avisos_publicos(0) r'))) === '22023'
    && (await codigo(() => comoAnon('select public.avisos_publicos(51) r'))) === '22023');
}

/* =====================================================================
   14 · limpiar(): 90 días, 180 días y 3 años
   ===================================================================== */
{
  const sViejo = navegador(fcm('viejo'));
  const tViejo = expo('viejo');
  await altaWeb(sViejo);
  await altaMovil(tViejo);
  await sesion(db);
  const refWeb = (await una(db, 'select ref from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sViejo.endpoint])).ref;
  const refMovil = (await una(db, 'select ref from rwadar_novedades.sin_cuenta_movil where token = $1', [tViejo])).ref;
  await db.query("update rwadar_novedades.sin_cuenta_web set actualizado_el = now() - interval '181 days' where endpoint = $1", [sViejo.endpoint]);
  await db.query("update rwadar_novedades.sin_cuenta_movil set actualizado_el = now() - interval '181 days' where token = $1", [tViejo]);
  await db.query("update rwadar_novedades.envios_sin_cuenta_web set creado_el = now() - interval '91 days' where anuncio_id = $1", [a1]);
  await db.query("update rwadar_novedades.pushes_sin_cuenta set creado_el = now() - interval '91 days' where anuncio_id = $1", [a1]);
  const [r1, r2, r3] = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  await db.query(`insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo, version, idioma, origen, creado_el) values
    ($1, 'web', 'alta', 'nueva', $4, 'es', 'perfil', now() - interval '4 years'),
    ($1, 'web', 'baja', 'boton', null, null, null, now() - interval '3 years 1 day'),
    ($2, 'movil', 'alta', 'nueva', $4, 'en', 'novedades', now() - interval '2 years 1 day'),
    ($2, 'movil', 'baja', 'boton', null, null, null, now() - interval '2 years'),
    ($3, 'web', 'alta', 'nueva', $4, 'es', 'avisos', now() - interval '1 day')`, [r1, r2, r3, VERSION_SC]);
  const vivas = await numero(db, "select count(*) from rwadar_novedades.sin_cuenta_web where actualizado_el > now() - interval '1 day'");
  const n = await numero(db, 'select rwadar_novedades.limpiar()');
  const deRef = async (ref) => (await filas(db, 'select accion, motivo from rwadar_novedades.historial_sin_cuenta where ref = $1 order by id', [ref])).map((h) => `${h.accion}:${h.motivo}`);
  paso(`limpiar() (el reloj diario) borra los envíos y pushes sin cuenta de más de 90 días y el navegador y el móvil sin renovar en 180 días, con su baja «caducada» (${n} filas)`,
    n > 0 && (await enviosWeb(a1)).length === 0 && (await pushes(a1)).length === 0
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_web where endpoint = $1', [sViejo.endpoint])) === 0
    && (await numero(db, 'select count(*) from rwadar_novedades.sin_cuenta_movil where token = $1', [tViejo])) === 0
    && isDeepStrictEqual(await deRef(refWeb), ['alta:nueva', 'baja:caducada']) && isDeepStrictEqual(await deRef(refMovil), ['alta:nueva', 'baja:caducada'])
    && (await numero(db, "select count(*) from rwadar_novedades.sin_cuenta_web where actualizado_el > now() - interval '1 day'")) === vivas);
  paso('y el historial: fuera el de una baja de hace más de 3 años; se queda el de una baja de hace 2; un alta sin fila ni baja recibe hoy su baja «caducada»',
    (await deRef(r1)).length === 0 && isDeepStrictEqual(await deRef(r2), ['alta:nueva', 'baja:boton'])
    && isDeepStrictEqual(await deRef(r3), ['alta:nueva', 'baja:caducada']));
  const { r } = await procesar();
  paso('procesar() también limpia en cada vuelta e informa de los cuatro pasos sin cuenta sin fallos',
    'limpiados' in r && ['sin_cuenta_push_leidos', 'sin_cuenta_push_enviados', 'sin_cuenta_webpush_leidos', 'sin_cuenta_webpush_enviados'].every((k) => k in r)
    && !Object.keys(r).some((k) => k.startsWith('fallo_')));
}

/* =====================================================================
   15 · Verificadores: los 30 a 34 con filas sin cuenta, y lo que detecta el 36
   ===================================================================== */
{
  const v = await todos();
  paso(`con filas sin cuenta, los verificadores 30, 31, 32, 33, 34 y 36 pasan («${v['36'].aviso || v['36'].error}»)${fallidos(v) ? ` · ${fallidos(v)}` : ''}`,
    Object.values(v).every((x) => x.ok) && /sin cuenta activo, [1-9][0-9]* navegador\(es\) y [1-9][0-9]* móvil\(es\) sin cuenta/.test(v['36'].aviso));
  const altaW = funcionDe(SQL36, 'public.alta_aviso_sin_cuenta_web');
  const bajaM = funcionDe(SQL36, 'public.baja_aviso_sin_cuenta_movil');
  const enviarW = funcionDe(SQL36, 'rwadar_novedades.sin_cuenta_enviar_webpush');
  const pruebaF = funcionDe(SQL36, 'rwadar_novedades.sin_cuenta_prueba');
  const enviarP = funcionDe(SQL36, 'rwadar_novedades.sin_cuenta_enviar_push');
  const leerP = funcionDe(SQL36, 'rwadar_novedades.sin_cuenta_leer_push');
  const leerW = funcionDe(SQL36, 'rwadar_novedades.sin_cuenta_leer_webpush');
  const rompe = async (romper, arreglar) => { await sesion(db); await db.exec(romper); const x = await verificador('36'); await sesion(db); await db.exec(arreglar); return x; };
  const textoBueno = `update rwadar_novedades.configuracion set sin_cuenta_texto_es = '${TEXTO_ES.replace(/'/g, "''")}'`;
  const rotos = {
    'procesar() de la 33': [await rompe(procesar33, procesar36), /procesar\(\) no envía las notificaciones sin cuenta/],
    'un bloque sin cuenta dos veces': [await rompe(procesar36.replace(BLOQUE_36, BLOQUE_36 + BLOQUE_36), procesar36), /procesar\(\) no envía/],
    'sin cuenta antes de la web de las cuentas': [await rompe(procesar36.replace(BLOQUE_36, '').replace('  if v_cfg.push_habilitado then\n', `  if v_cfg.push_habilitado then\n${BLOQUE_36}`), procesar36), /procesar\(\) no envía/],
    'limpiar() de la 32': [await rompe(limpiar32, limpiar36), /limpiar\(\) no borra lo de sin cuenta/],
    'otro texto': [await rompe("update rwadar_novedades.configuracion set sin_cuenta_texto_es = 'Otro texto.'", textoBueno), /textos del permiso sin cuenta/],
    'el alta sin cupos': [await rompe(altaW.replace(/v_cfg\.sin_cuenta_cupo_hora/g, '300'), altaW), /cupos/],
    'el alta acepta otra clave auth': [await rompe(altaW.replace("'error', 'en_uso'", "'error', 'otra'"), altaW), /otra clave auth/],
    'la baja depende del interruptor': [await rompe(bajaM.replace('begin\n  if p_token is null', 'begin\n  perform 1 from rwadar_novedades.configuracion where sin_cuenta_activa;\n  if p_token is null'), bajaM), /tiene que funcionar siempre/],
    'el envío sin mirar las cuentas': [await rompe(enviarW.replace('select 1 from rwadar_novedades.suscripciones_web s', 'select 1 from rwadar_novedades.sin_cuenta_web s')
      .replace('join rwadar_novedades.preferencias p on p.usuario_id = s.usuario_id\n               join auth.users u on u.id = s.usuario_id', 'join rwadar_novedades.configuracion p on true\n               join auth.users u on false'), enviarW), /cuentas/],
    'la prueba sin límite': [await rompe(pruebaF.replace('if v_web + v_movil > 5 then', 'if v_web + v_movil > 500 then'), pruebaF), /5 suscripciones/],
    'la prueba con un tipo que la app no conoce': [await rompe(pruebaF.replace("jsonb_build_object('tipo', 'novedad', 'destino', 'inicio')", "jsonb_build_object('tipo', 'prueba', 'destino', 'inicio')"), pruebaF), /aviso de novedad/],
    'MismatchSenderId cuenta como fallo del móvil': [await rompe(leerP.replace("error = left(coalesce(v_error, 'Error de Expo'), 160)\n         where id = r.id;",
      "error = left(coalesce(v_error, 'Error de Expo'), 160)\n         where id = r.id;\n        perform rwadar_novedades.sin_cuenta_fallo('movil', r.movil_id);"), leerP), /fallo general/],
    'la web cuenta 401 y 403 como fallos': [await rompe(leerW.replace('if v_codigo in (400, 413) then', 'if v_codigo in (400, 401, 403, 413) then'), leerW), /fallo general/],
    'el envío web sin tope diario': [await rompe(enviarW.replace('limit least(p_tanda, v_hueco)', 'limit p_tanda'), enviarW), /tope diario/],
    'el móvil sin mirar lo repartido': [await rompe(enviarP.replace('and a.push_repartido_el is not null', ''), enviarP), /cuentas/],
    'el alta web con el máximo del móvil': [await rompe(altaW.replace('v_cfg.sin_cuenta_maximo_web', 'v_cfg.sin_cuenta_maximo'), altaW), /cupos/],
    'la API para service_role': [await rompe('grant execute on function public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text) to service_role',
      'revoke execute on function public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text) from service_role'), /permisos incorrectos/],
    'la API sin anon': [await rompe('revoke execute on function public.avisos_publicos(integer) from anon', 'grant execute on function public.avisos_publicos(integer) to anon'), /permisos incorrectos/],
    'una función interna para anon': [await rompe('grant execute on function rwadar_novedades.sin_cuenta_limpiar() to anon', 'revoke execute on function rwadar_novedades.sin_cuenta_limpiar() from anon'), /ejecutable por anon/],
    'una tabla para authenticated': [await rompe('grant select on rwadar_novedades.historial_sin_cuenta to authenticated', 'revoke select on rwadar_novedades.historial_sin_cuenta from authenticated'), /permisos sobre/],
    'el historial sin su disparador': [await rompe('alter table rwadar_novedades.historial_sin_cuenta disable trigger historial_sin_cuenta_solo_anadir',
      'alter table rwadar_novedades.historial_sin_cuenta enable trigger historial_sin_cuenta_solo_anadir'), /historial_sin_cuenta_solo_anadir/],
    'una tabla sin RLS': [await rompe('alter table rwadar_novedades.sin_cuenta_movil disable row level security', 'alter table rwadar_novedades.sin_cuenta_movil enable row level security'), /no tiene RLS/],
  };
  const noDetecta = Object.entries(rotos).filter(([, [x, motivo]]) => x.ok || !motivo.test(x.error || '')).map(([nombre, [x]]) => `${nombre}: ${x.error || 'pasa'}`);
  paso(`el verificador 36 detecta ${Object.keys(rotos).length} roturas (procesar y limpiar sin lo suyo o fuera de sitio, el texto, los cupos y el tope diario, la clave auth, la baja, las cuentas y lo repartido, la prueba, los fallos generales, permisos, disparador y RLS)${noDetecta.length ? ` · no detecta: ${noDetecta.join(' | ')}` : ''}`,
    noDetecta.length === 0 && (await verificador('36')).ok);
}
{
  // Reaplicar la 33 o la 32 quita lo de sin cuenta; reaplicar la 36 lo
  // devuelve. Reaplicar la 30 obliga a la 31, 32, 33 y 34 antes de la 36.
  const filasAntes = await numero(db, 'select (select count(*) from rwadar_novedades.sin_cuenta_web) + (select count(*) from rwadar_novedades.historial_sin_cuenta)');
  await sesion(db);
  await db.exec(SQL33);
  const tras33 = await todos(['33', '36']);
  await db.exec(SQL36);
  await db.exec(SQL32);
  const tras32 = await todos(['32', '36']);
  await db.exec(SQL36);
  const bien = await todos();
  await db.exec(SQL30);
  const tras30 = await verificador('36');
  const sin33 = await error(() => db.exec(SQL36));
  await db.exec('rollback').catch(() => {});
  await sesion(db);
  const cfg30 = await una(db, 'select * from rwadar_novedades.configuracion');
  for (const sql of [SQL31, SQL32, SQL33, SQL34, SQL36]) await db.exec(sql);
  const cadena = await todos();
  paso('reaplicar la 33 o la 32 quita el envío o la limpieza sin cuenta (el verificador 36 lo detecta y los suyos pasan); reaplicar la 36 lo devuelve',
    tras33['33'].ok && !tras33['36'].ok && /procesar\(\)/.test(tras33['36'].error) && tras32['32'].ok && !tras32['36'].ok && /limpiar\(\)/.test(tras32['36'].error)
    && Object.values(bien).every((x) => x.ok));
  paso('reaplicar la 30 también (y la 36 se niega hasta reaplicar la 31, la 32, la 33 y la 34); la cadena entera deja todo bien sin perder filas ni el texto sin cuenta',
    !tras30.ok && sin33?.code === '55000' && /no son las de la 33 y la 32/.test(sin33.message)
    && cfg30.sin_cuenta_version === VERSION_SC && cfg30.sin_cuenta_texto_es === TEXTO_ES
    && Object.values(cadena).every((x) => x.ok)
    && (await numero(db, 'select (select count(*) from rwadar_novedades.sin_cuenta_web) + (select count(*) from rwadar_novedades.historial_sin_cuenta)')) === filasAntes);
}
if (hayBash) {
  const entorno = { ...(await compruebaBase({ ACCION: 'verificar-36' })).salida, ACCION: 'verificar-36' };
  const verificar = await correPaso(BASE, 'Verificar', entorno);
  paso('el paso «Verificar» de verificar-36, ejecutado de verdad, pasa los verificadores 30, 31, 32, 33, 34 y 36 en ese orden',
    verificar.estado === 0 && isDeepStrictEqual(verificar.llamadas.map((l) => l.at(-1)), [30, 31, 32, 33, 34, 36].map(V))
    && /RWAdar 36 OK/.test(verificar.stderr));
}

/* =====================================================================
   16 · fallo_cerrado.sql
   ===================================================================== */
{
  await sesion(db);
  await db.exec(ACTIVAR_PUSH);
  await db.exec(ACTIVAR36);
  const avisos = [];
  await db.exec(FALLO_CERRADO, { onNotice: (x) => avisos.push(x.message) });
  const cfg = await una(db, 'select sin_cuenta_activa a, sin_cuenta_activada_el f, push_habilitado p from rwadar_novedades.configuracion');
  const cerrada = await codigo(() => altaMovil(expo('cerrado')));
  const filas36 = await numero(db, 'select count(*) from rwadar_novedades.historial_sin_cuenta');
  await db.exec(SQL36);
  const reabierta = await altaMovil(expo('cerrado'));
  paso('fallo_cerrado.sql apaga sin cuenta con su fecha (y el push), cierra la API sin cuenta (42501) y no borra el historial; reaplicar la 36 la reabre, todavía apagada',
    cfg.a === false && cfg.f === null && cfg.p === false && cerrada === '42501' && filas36 > 0
    && avisos.some((a) => /RWAdar 36: notificaciones sin cuenta apagadas/.test(a))
    && isDeepStrictEqual(reabierta, { ok: false, error: 'apagado' }));
}
} catch (e) {
  fail.push(`la prueba se paró: ${e.stack || e.message}`);
} finally {
  if (servidor) servidor.close();
  if (db) await db.close().catch(() => {});
  fs.rmSync(temporal, { recursive: true, force: true });
}

informe('Notificaciones sin cuenta (migración 36)', ok, fail);
