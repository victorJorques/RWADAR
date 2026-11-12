/* =====================================================================
   RWAdar · notificaciones (migración 32): push de Expo con prioridad alta
   y notificaciones web (Web Push)
   ---------------------------------------------------------------------
   Postgres real en WebAssembly (PGlite) sobre la cadena de producción: el
   seed anterior a ARTEX, 01-22, 24, 25, las migraciones del catálogo, 26,
   el refuerzo de sesión, 28, 28_REVERTIR, 29, la 30, la 31 y la 32 (con
   privilegios por defecto hostiles mientras se aplica).

   Auth, pg_net, Vault y pg_cron son dobles locales: no hay red, ni push,
   ni Supabase. El remitente (enviar-webpush.mjs) se prueba de verdad:
   el vector del RFC 8291, la firma VAPID y un servidor HTTP local que
   recibe, comprueba la firma y descifra lo enviado. Los pasos de los
   flujos «Avisos a registrados (base)» (ensayo-32, crear-vapid,
   rotar-vapid) y «Notificaciones web» (enviar, prueba) se ejecutan de
   verdad con bash y un doble de psql que pasa cada orden a PGlite; el
   remitente sale hacia ese servidor local en vez de a Google o Apple.

       node probar-notificaciones.mjs
   ===================================================================== */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { alta, baseCatalogoHistorico, filas, informe, sesion } from './pruebas-soporte.mjs';
import {
  CARGA_MAXIMA, ENDPOINT_VALIDO, autorizacionVapid, cifrar, enviarTodos, enviarUno, firmarVapid,
  generarClaves, main as remitente, prepararClaves,
} from './enviar-webpush.mjs';

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

const SQL30 = leer('db/30_avisos_registrados.sql');
const SQL31 = leer('db/31_correo_lettermint.sql');
const SQL32 = leer('db/32_notificaciones.sql');
const MIGRACION32 = leer('supabase/migrations/20261112130000_notificaciones.sql');
const VERIFICAR30 = leer('db/30_avisos_registrados_verificar.sql');
const VERIFICAR31 = leer('db/31_correo_lettermint_verificar.sql');
const VERIFICAR32 = leer('db/32_notificaciones_verificar.sql');
const VAPID32 = leer('db/32_notificaciones_vapid.sql');
const RESULTADO32 = leer('db/32_notificaciones_resultado.sql');
const ACTIVAR_PUSH = leer('db/30_avisos_registrados_activar_push.sql');
const APAGAR = leer('db/30_avisos_registrados_apagar.sql');
const BASE = leer('../.github/workflows/avisos-base.yml');
const WEB = leer('../.github/workflows/notificaciones-web.yml');
const AVISAR = leer('../.github/workflows/avisar-novedad.yml');
const REMITENTE = leer('enviar-webpush.mjs');
const VERSION = 'novedades-v2-2026-11-06';
const PRUEBA_TITULO = 'Prueba de RWAdar';
const PRUEBA_TEXTO = 'Si ves esto, las notificaciones funcionan en este móvil.';
const funcionDe = (sql, nombre) => sql.match(new RegExp(`create or replace function ${nombre.replace('.', '\\.')}\\([\\s\\S]*?\\n\\$funcion\\$;`))[0];

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
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-notificaciones-'));
try {
/* =====================================================================
   1 · Revisión estática: copias, forma y lo que la 32 no toca
   ===================================================================== */
paso('la migración versionada 20261112130000 es una copia idéntica de db/32', MIGRACION32 === SQL32);
{
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la 32 empieza en «begin;» y termina en su único «commit;»; su verificador empieza en «begin transaction read only;» y termina en «rollback;»',
    primera(SQL32) === 'begin;' && (SQL32.match(/^commit;$/gm) || []).length === 1 && lineas(SQL32).at(-1) === 'commit;'
    && primera(VERIFICAR32) === 'begin transaction read only;' && lineas(VERIFICAR32).at(-1) === 'rollback;'
    && (VERIFICAR32.match(/^begin transaction read only;$/gm) || []).length === 1 && !/^commit;$/m.test(VERIFICAR32));
  const envio30 = funcionDe(SQL30, 'rwadar_novedades.enviar_push');
  const envio32 = funcionDe(SQL32, 'rwadar_novedades.enviar_push');
  paso('enviar_push de la 32 es la de la 30 letra por letra salvo «\'priority\', \'high\'» en vez de «\'default\'»',
    (envio30.match(/'priority', 'default'/g) || []).length === 1
    && envio32 === envio30.replace("'priority', 'default'", "'priority', 'high'") && envio32 !== envio30);
  const codigo = sinComentarios(SQL32);
  paso('la 32 no borra tablas ni funciones, no toca relojes, Vault ni las filas de la configuración (no la reinicia) y solo concede EXECUTE a authenticated en sus 4 RPC',
    !/\bdrop\s+(table|function|trigger|schema|policy|index)\b/i.test(codigo)
    && !/cron\.|vault\.(create|update)_secret|insert\s+into\s+vault|update\s+rwadar_novedades\.configuracion|insert\s+into\s+rwadar_novedades\.configuracion|delete\s+from\s+rwadar_novedades\.(configuracion|preferencias|anuncios|historial_permiso|dispositivos|pushes|correos)/i.test(codigo)
    && isDeepStrictEqual([...codigo.matchAll(/^grant .*$/gm)].map((m) => m[0]), [
      'grant execute on function public.registrar_aviso_webpush(text, text, text) to authenticated;',
      'grant execute on function public.quitar_aviso_webpush(text) to authenticated;',
      'grant execute on function public.mi_aviso_webpush_registrado(text) to authenticated;',
      'grant execute on function public.clave_publica_webpush() to authenticated;'])
    && /revoke all on function rwadar_novedades\.enviar_push\(integer\) from public, anon, authenticated, service_role;/.test(codigo));
  // La misma regla de endpoints en la tabla, en la RPC y en el remitente.
  const reglas = [...SQL32.matchAll(/'(\^https:\/\/\(fcm[^']+)'/g)].map((m) => m[1]);
  paso('la regla de endpoints es la misma en la tabla, en registrar_aviso_webpush y en el remitente (solo https y los 4 servicios de push del contrato)',
    reglas.length === 2 && reglas[0] === reglas[1] && reglas[0] === ENDPOINT_VALIDO.source.replace(/\\\//g, '/')
    && /fcm\\\.googleapis\\\.com\|updates\\\.push\\\.services\\\.mozilla\\\.com\|web\\\.push\\\.apple\\\.com\|.*\\\.notify\\\.windows\\\.com/.test(reglas[0]));
  const pkg = JSON.parse(leer('package.json'));
  paso('npm test de rwadar-app ejecuta esta prueba justo después de la de avisos a registrados',
    pkg.scripts.test.includes('node probar-avisos-registrados.mjs && node probar-notificaciones.mjs &&'));
  paso('el remitente solo usa node: (crypto, fs, url) y fetch: nada de npm',
    isDeepStrictEqual([...REMITENTE.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]), ['node:crypto', 'node:fs', 'node:url'])
    && !/require\(|import\(/.test(REMITENTE));
}

/* =====================================================================
   2 · El remitente: RFC 8291, VAPID y un servidor de push local
   ===================================================================== */
{
  // Apéndice A del RFC 8291 (valores públicos del propio RFC).
  const desdeRfc = (t) => Buffer.from(t.replace(/\s+/g, ''), 'base64url');
  const cuerpo = cifrar({
    carga: Buffer.from('When I grow up, I want to be a watermelon'),
    p256dh: desdeRfc('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'),
    auth: desdeRfc('BTBZMqHH6r4Tts7J_aSIgg'),
    privadaEfimera: desdeRfc('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'),
    sal: desdeRfc('DGv6ra1nlYgDCS1FRnbzlw'),
  });
  const esperado = 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN';
  // (La sección 5 del RFC pone «Content-Length: 145», pero su propio cuerpo son 144
  // octetos: 86 de cabecera, 41 del texto, el delimitador y 16 de la etiqueta.)
  paso('cifrar() da exactamente el mensaje del RFC 8291 (sección 5 y apéndice A): cabecera de 86 octetos, registro de 4096 y un solo registro con el delimitador 0x02',
    b64u(cuerpo) === esperado && cuerpo.length === 86 + 41 + 1 + 16 && cuerpo.readUInt32BE(16) === 4096 && cuerpo[20] === 65);
}
const vapid = generarClaves();
const clavesVapid = prepararClaves(vapid.privada, vapid.publica);
{
  const otra = generarClaves();
  const e1 = (() => { try { prepararClaves(vapid.privada, otra.publica); return null; } catch (e) { return e.message; } })();
  const e2 = (() => { try { prepararClaves('x'.repeat(43), vapid.publica); return null; } catch (e) { return e.message; } })();
  const e3 = (() => { try { prepararClaves(undefined, vapid.publica); return null; } catch (e) { return e.message; } })();
  paso('generarClaves da una privada de 32 octetos y una pública de 65 sin comprimir (base64url de 43 y 87); prepararClaves rechaza una pública que no casa, una privada imposible o ausente, sin repetir los valores',
    /^[A-Za-z0-9_-]{43}$/.test(vapid.privada) && /^B[A-Za-z0-9_-]{86}$/.test(vapid.publica)
    && Buffer.from(vapid.publica, 'base64url').length === 65 && Buffer.from(vapid.privada, 'base64url').length === 32
    && /no corresponde/.test(e1 || '') && /no es una clave P-256 válida|forma/.test(e2 || '') && /falta RWADAR_VAPID_PRIVADA/.test(e3 || '')
    && [e1, e2, e3].every((m) => !m.includes(vapid.privada) && !m.includes(otra.publica)));
  const ahora = Math.floor(Date.now() / 1000);
  const jwt = firmarVapid({ audiencia: 'https://web.push.apple.com', clave: clavesVapid.clave, ahora });
  const [h, d, f] = jwt.split('.');
  const publicaKey = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256',
    x: b64u(Buffer.from(vapid.publica, 'base64url').subarray(1, 33)), y: b64u(Buffer.from(vapid.publica, 'base64url').subarray(33)) } });
  const datos = JSON.parse(Buffer.from(d, 'base64url'));
  paso('la firma VAPID (JWT ES256, r||s de 64 octetos) se verifica con la clave pública; aud = origen, exp a 12 h, sub = mailto:rwadares@gmail.com',
    crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: publicaKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'))
    && Buffer.from(f, 'base64url').length === 64
    && isDeepStrictEqual(JSON.parse(Buffer.from(h, 'base64url')), { typ: 'JWT', alg: 'ES256' })
    && isDeepStrictEqual(datos, { aud: 'https://web.push.apple.com', exp: ahora + 12 * 3600, sub: 'mailto:rwadares@gmail.com' })
    && autorizacionVapid(jwt, vapid.publica) === `vapid t=${jwt}, k=${vapid.publica}`);
}

// Servidor local: hace de servicio de push (/push/<host>/<ruta>) y de base
// para el doble de psql (/psql). Cada navegador de la prueba tiene su par de
// claves y su secreto, para descifrar lo que le llega.
const navegadores = new Map();   // endpoint → { ua, auth, p256dh }
const respuestas = new Map();    // endpoint → estado HTTP (201 si no se dice)
const recibidos = [];
const llamadasPsql = [];
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
  return { texto: claro.subarray(0, fin).toString('utf8'), rs: cuerpo.readUInt32BE(16), relleno: claro.length - fin - 1 };
};
const comprobarVapid = (cabecera, audiencia) => {
  const m = /^vapid t=([^,]+), k=([A-Za-z0-9_-]+)$/.exec(cabecera || '');
  if (!m) return { ok: false, k: null };
  const [h, d, f] = m[1].split('.');
  const k = Buffer.from(m[2], 'base64url');
  const clave = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(k.subarray(1, 33)), y: b64u(k.subarray(33)) } });
  const datos = JSON.parse(Buffer.from(d, 'base64url'));
  const ahora = Math.floor(Date.now() / 1000);
  return { k: m[2], ok: crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: clave, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'))
    && datos.aud === audiencia && datos.exp > ahora + 11 * 3600 && datos.exp <= ahora + 12 * 3600
    && datos.sub === 'mailto:rwadares@gmail.com' };
};
const formato = (v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 't' : 'f')
  : typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : String(v));
// psql emulado sobre PGlite: -c con su consulta, o -f con las variables -v
// sustituidas como lo hace psql. Con -At escribe cada fila con «|».
const psqlDoble = async (argv) => {
  llamadasPsql.push(argv);
  const i = argv.indexOf('-c');
  const j = argv.indexOf('-f');
  const archivo = j >= 0 ? path.resolve(raizRepo, argv[j + 1]) : null;
  const sql = archivo ? conVariablesPsql(fs.readFileSync(archivo, 'utf8'), variablesPsql(argv)) : argv[i + 1];
  await sesion(db);
  const avisos = [];
  try {
    const resultados = await db.exec(sql, { rowMode: 'array', onNotice: (n) => avisos.push(`${n.severity}:  ${n.message}\n`) });
    const ultimo = [...resultados].reverse().find((r) => r.fields?.length);
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
    const endpoint = host === 'local' ? `http://${req.headers.host}${req.url}` : `https://${host}/${resto.join('/')}`;
    const n = navegadores.get(endpoint);
    let claro = null;
    try { claro = n ? descifrar(cuerpo, n) : null; } catch { claro = null; }
    const firma = comprobarVapid(req.headers.authorization, host === 'local' ? `http://${req.headers.host}` : `https://${host}`);
    recibidos.push({ endpoint, metodo: req.method, cabeceras: req.headers, claro, vapid: firma.ok, k: firma.k });
    res.statusCode = respuestas.get(endpoint) ?? 201;
    res.end();
  } catch (e) {
    res.statusCode = 599;
    res.end(String(e.message));
  }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const PUERTO = servidor.address().port;
const LOCAL = `http://127.0.0.1:${PUERTO}`;

const CARGA = { v: 1, titulo: 'Novedad en RWAdar', texto: 'Ya puedes activar las notificaciones. Ñandú: áéíóú', url: 'https://rwadar.pages.dev/', etiqueta: 'rwadar-7' };
{
  const ids = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'];
  const envios = ids.map((id, i) => ({ id, ...navegador(`${LOCAL}/push/local/navegador-${i}`), carga: CARGA }));
  [201, 410, 404, 429, 500, 413].forEach((c, i) => respuestas.set(envios[i].endpoint, c));
  // e7: un punto con forma de clave que no está en la curva (no se puede cifrar).
  envios[6].p256dh = `B${'A'.repeat(85)}A`;
  const sinRespuesta = { id: 'e8', ...navegador('http://127.0.0.1:1/push/local/cerrado'), carga: CARGA };
  const { resultados } = await enviarTodos([...envios, sinRespuesta], clavesVapid, { cualquierEndpoint: true });
  paso('el remitente devuelve el código de cada servicio: 201, 410, 404, 429, 500, 413; -1 si las claves del navegador no sirven y 0 sin respuesta',
    isDeepStrictEqual(resultados, [201, 410, 404, 429, 500, 413, -1, 0].map((codigo, i) => ({ id: `e${i + 1}`, codigo }))));
  const llegados = recibidos.filter((r) => r.endpoint.startsWith(`${LOCAL}/push/local/navegador-`));
  paso('el servidor local recibe 6 POST con TTL 86400, Urgency high, Content-Encoding aes128gcm y la firma VAPID válida para su origen',
    llegados.length === 6 && llegados.every((r) => r.metodo === 'POST' && r.cabeceras.ttl === '86400' && r.cabeceras.urgency === 'high'
      && r.cabeceras['content-encoding'] === 'aes128gcm' && r.cabeceras['content-type'] === 'application/octet-stream'
      && r.vapid && r.k === vapid.publica));
  paso('y cada navegador descifra con sus claves exactamente la carga del contrato, en un registro de 4096 con el relleno mínimo',
    llegados.every((r) => r.claro && isDeepStrictEqual(JSON.parse(r.claro.texto), CARGA) && r.claro.rs === 4096 && r.claro.relleno === 0));
  const antes = recibidos.length;
  const raros = await enviarTodos([
    { id: 'e9', ...navegador('http://fcm.googleapis.com/fcm/send/x'), carga: CARGA },
    { id: 'e10', ...navegador('https://fcm.googleapis.com.evil.example/fcm/send/x'), carga: CARGA },
    { id: 'e11', ...navegador('https://evil.example/https://fcm.googleapis.com/'), carga: CARGA },
    { id: 'e12', ...navegador('https://fcm.googleapis.com:8443/fcm/send/x'), carga: CARGA },
    { id: 'e13', ...navegador('https://user@fcm.googleapis.com/fcm/send/x'), carga: CARGA },
    { id: 'e14', ...navegador('https://web.push.apple.com/x'), carga: { ...CARGA, url: 'https://evil.example/' } },
    { id: 'e15', ...navegador('https://web.push.apple.com/x'), carga: { ...CARGA, texto: 'á'.repeat(CARGA_MAXIMA) } },
    { id: 'x16', ...navegador('https://web.push.apple.com/x'), carga: CARGA },
    { id: 'e9', ...navegador('https://web.push.apple.com/y'), carga: CARGA },
  ], clavesVapid, { fetch: () => { throw new Error('no debería salir nada'); } });
  paso('sin la opción de las pruebas, el remitente no sale hacia http, otros hosts, puertos, usuarios ni con una carga que no apunta a rwadar.pages.dev o demasiado grande (-1); un id sin forma o repetido ni se envía ni sale en los resultados',
    isDeepStrictEqual(raros.resultados.map((r) => r.codigo), [-1, -1, -1, -1, -1, -1, -1]) && raros.descartados === 2
    && recibidos.length === antes);
  const conRedireccion = { id: 'e20', ...navegador(`${LOCAL}/push/local/redirige`), carga: CARGA };
  respuestas.set(conRedireccion.endpoint, 301);
  paso('una redirección del servicio no se sigue: se devuelve el 301 (fallido)',
    (await enviarUno(conRedireccion, clavesVapid, { cualquierEndpoint: true })) === 301);
}
{
  // La línea de órdenes, sin red: errores de configuración sin valores.
  const corre = (args, env, entrada = '') => spawnSync(process.execPath, [path.join(raiz, 'enviar-webpush.mjs'), ...args],
    { encoding: 'utf8', input: entrada, env: { PATH: process.env.PATH, ...env } });
  const otra = generarClaves();
  const sinClave = corre([], { RWADAR_VAPID_PUBLICA: vapid.publica }, '{"envios":[]}');
  const noCasa = corre([], { RWADAR_VAPID_PRIVADA: vapid.privada, RWADAR_VAPID_PUBLICA: otra.publica }, '{"envios":[]}');
  const malUso = corre(['--otra', 'x'], { RWADAR_VAPID_PRIVADA: vapid.privada, RWADAR_VAPID_PUBLICA: vapid.publica });
  const vacia = corre([], { RWADAR_VAPID_PRIVADA: vapid.privada, RWADAR_VAPID_PUBLICA: vapid.publica }, '{"v": 1, "push": true, "envios": []}');
  const genera = corre(['generar-claves'], {});
  const [priv, pub] = genera.stdout.trim().split(' ');
  paso('enviar-webpush.mjs: sin clave, con claves que no casan o mal usado sale con 1 y sin imprimir claves; una tanda vacía escribe [] y sale con 0; generar-claves escribe «privada pública» que casan',
    sinClave.status === 1 && /falta RWADAR_VAPID_PRIVADA/.test(sinClave.stderr) && noCasa.status === 1 && /no corresponde/.test(noCasa.stderr)
    && malUso.status === 1 && /uso:/.test(malUso.stderr)
    && [sinClave, noCasa, malUso, vacia].every((r) => !`${r.stdout}${r.stderr}`.includes(vapid.privada))
    && vacia.status === 0 && vacia.stdout === '[]\n' && /0 envío\(s\)/.test(vacia.stderr)
    && genera.status === 0 && genera.stdout.trim().split(' ').length === 2 && !!prepararClaves(priv, pub));
}

/* =====================================================================
   3 · La cadena de producción con la 30 y la 31; ensayo-32 del flujo
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
// Dobles de vault.secrets, vault.create_secret y vault.update_secret (las
// firmas de Supabase Vault) sobre el doble de vault.decrypted_secrets.
const VAULT_DOBLES = `
  alter table vault.decrypted_secrets add column id uuid not null default gen_random_uuid(), add column description text;
  create view vault.secrets as select id, name, description, decrypted_secret as secret from vault.decrypted_secrets;
  create function vault.create_secret(new_secret text, new_name text default null, new_description text default '',
      new_key_id uuid default null) returns uuid language sql as $$
    insert into vault.decrypted_secrets(name, decrypted_secret, description) values (new_name, new_secret, new_description) returning id $$;
  create function vault.update_secret(secret_id uuid, new_secret text default null, new_name text default null,
      new_description text default null, new_key_id uuid default null) returns void language sql as $$
    update vault.decrypted_secrets set decrypted_secret = coalesce(new_secret, decrypted_secret), name = coalesce(new_name, name),
      description = coalesce(new_description, description) where id = secret_id $$;`;
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
{
  // Sin la 30, la 32 se niega y no deja nada.
  const e = await error(() => db.exec(SQL32));
  await db.exec('rollback');
  paso('sin la 30, la 32 se niega (55000) y no deja nada',
    e?.code === '55000' && /falta aplicar antes 30_avisos_registrados/.test(e.message)
    && (await una(db, "select to_regclass('rwadar_novedades.suscripciones_web') t")).t === null);
}
await db.exec(SQL30);
await db.exec(SQL31);

// Un usuario de Supabase con su sesión (dobles de JWT y auth.sessions).
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

// Pasos de los flujos ejecutados de verdad: bash desde la raíz del
// repositorio, GITHUB_ENV, GITHUB_STEP_SUMMARY y RUNNER_TEMP en archivos, y
// un doble de psql que manda cada llamada a PGlite por el servidor local.
// node es el de verdad; el remitente sale hacia el servidor local (un
// --import cambia fetch) en vez de a Google o Apple.
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
const FETCH_LOCAL = path.join(temporal, 'fetch-local.mjs');
fs.writeFileSync(FETCH_LOCAL, `const real = globalThis.fetch;
globalThis.fetch = (url, opciones) => { const u = new URL(url); return real(\`\${process.env.RWADAR_PRUEBA_PUSH}/push/\${u.host}\${u.pathname}\${u.search}\`, opciones); };
`);
const correPaso = async (yaml, nombre, entorno = {}) => {
  const dir = fs.mkdtempSync(path.join(temporal, 'paso-'));
  fs.writeFileSync(path.join(dir, 'psql'), DOBLE_PSQL, { mode: 0o755 });
  const githubEnv = path.join(dir, 'github-env');
  const resumen = path.join(dir, 'resumen.md');
  const runnerTemp = path.join(dir, 'runner-temp');
  fs.mkdirSync(runnerTemp);
  fs.writeFileSync(githubEnv, '');
  fs.writeFileSync(resumen, '');
  const bloque = pasoDe(yaml, nombre);
  if (!bloque) throw new Error(`el flujo no tiene el paso «${nombre}»`);
  const desde = llamadasPsql.length;
  const r = await new Promise((resolver) => {
    const hijo = spawn('bash', ['-c', scriptDe(bloque)], { cwd: raizRepo, env: {
      PATH: `${dir}:${process.env.PATH}`, HOME: dir, GITHUB_ENV: githubEnv, GITHUB_STEP_SUMMARY: resumen, RUNNER_TEMP: runnerTemp,
      PSQL_DOBLE_URL: `${LOCAL}/psql`, RWADAR_PRUEBA_PUSH: LOCAL, NODE_OPTIONS: `--import=${pathToFileURL(FETCH_LOCAL).href}`,
      SUPABASE_DB_URL: 'postgresql://doble-local/sin-red', ...entorno } });
    let stdout = '', stderr = '';
    hijo.stdout.on('data', (t) => { stdout += t; });
    hijo.stderr.on('data', (t) => { stderr += t; });
    hijo.on('close', (estado) => resolver({ estado, stdout, stderr }));
  });
  const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { ...r, texto: `${r.stdout}${r.stderr}`, salida, resumen: fs.readFileSync(resumen, 'utf8'),
    llamadas: llamadasPsql.slice(desde), temporal: runnerTemp };
};
const V30_RUTA = 'rwadar-app/db/30_avisos_registrados_verificar.sql';
const V31_RUTA = 'rwadar-app/db/31_correo_lettermint_verificar.sql';
const V32_RUTA = 'rwadar-app/db/32_notificaciones_verificar.sql';

if (hayBash) {
  const comprobar = await correPaso(BASE, 'Comprobar la acción', { ACCION: 'ensayo-32', CONFIRMAR: '', REMITENTE: '' });
  const ensayo = await correPaso(BASE, 'Ensayo sin cambiar nada (se deshace al final)', comprobar.salida);
  await sesion(db);
  paso(`el ensayo-32 del flujo, ejecutado de verdad, monta la 32 + los verificadores 30, 31 y 32 + rollback, pasa sobre la cadena de producción y no deja nada (${ensayo.estado === 0 ? 'OK' : ensayo.texto.trim()})`,
    comprobar.estado === 0 && ensayo.estado === 0 && ensayo.llamadas.length === 1
    && ensayo.texto.includes('ENSAYO CORRECTO: 32_notificaciones.sql y sus verificadores pasan')
    && /NOTICE: {2}RWAdar 30 OK/.test(ensayo.stderr) && /NOTICE: {2}RWAdar 31 OK/.test(ensayo.stderr)
    && /NOTICE: {2}RWAdar 32 OK: push de Expo con prioridad alta; notificaciones web: 0 suscripción\(es\) en 0 cuenta\(s\), clave VAPID sin crear, push apagado/.test(ensayo.stderr)
    && (await una(db, "select to_regclass('rwadar_novedades.suscripciones_web') t")).t === null
    && (await numero(db, "select count(*) from pg_attribute where attrelid = 'rwadar_novedades.configuracion'::regclass and attname = 'webpush_clave_publica'")) === 0
    && /'priority', 'default'/.test((await una(db, "select pg_get_functiondef('rwadar_novedades.enviar_push(integer)'::regprocedure) d")).d));
}

/* =====================================================================
   4 · La 32 aplicada dos veces con privilegios por defecto hostiles
   ===================================================================== */
const VAPID_ANTERIOR = generarClaves();
await db.exec(HOSTIL);
await db.exec(SQL32);
// Una clave pública guardada y la 32 reaplicada: la clave sigue (no reinicia).
await db.exec(`insert into vault.decrypted_secrets(name, decrypted_secret) values ('RWADAR_VAPID_PRIVADA', '${VAPID_ANTERIOR.privada}');
  update rwadar_novedades.configuracion set webpush_clave_publica = '${VAPID_ANTERIOR.publica}' where unica`);
await db.exec('grant execute on function rwadar_novedades.webpush_pendientes(integer) to service_role');
await db.exec(SQL32);
await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
{
  const config = await una(db, 'select * from rwadar_novedades.configuracion');
  paso('la 32 se aplica dos veces; la segunda no reinicia la configuración (la clave pública sigue) y vuelve a cerrar una función abierta a mano entre medias',
    config.webpush_clave_publica === VAPID_ANTERIOR.publica && config.version_consentimiento === VERSION
    && !config.push_habilitado
    && !(await una(db, "select has_function_privilege('service_role', 'rwadar_novedades.webpush_pendientes(integer)', 'EXECUTE') a")).a);
  const v30 = await verificar30();
  const v31 = await verificar31();
  const v32 = await verificar32();
  paso(`los verificadores 30, 31 y 32 pasan tras la 32 («${v32.aviso || v32.error}»)`,
    v30.ok && v31.ok && v32.ok && /clave VAPID creada, push apagado/.test(v32.aviso));
  const tablas = await filas(db, `select c.relname, c.relrowsecurity rls,
      bool_or(has_table_privilege(r, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) abierta
    from pg_class c, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
   where c.relnamespace = 'rwadar_novedades'::regnamespace and c.relname in ('suscripciones_web', 'envios_web')
   group by c.relname, c.relrowsecurity`);
  const secuencias = await filas(db, `select c.relname from pg_class c, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
   where c.relnamespace = 'rwadar_novedades'::regnamespace and c.relkind = 'S' and has_sequence_privilege(r, c.oid, 'USAGE,SELECT,UPDATE')`);
  paso('suscripciones_web y envios_web: RLS y ningún permiso para public, anon, authenticated ni service_role (tampoco sus secuencias)',
    tablas.length === 2 && tablas.every((t) => t.rls && !t.abierta) && secuencias.length === 0);
  const internas = await filas(db, `select p.oid::regprocedure::text firma, p.prosecdef, p.proconfig,
      p.proowner = (select q.proowner from pg_proc q where q.oid = 'rwadar_novedades.procesar()'::regprocedure) dueno,
      bool_or(has_function_privilege(r, p.oid, 'EXECUTE')) abierta
    from pg_proc p, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
   where p.pronamespace = 'rwadar_novedades'::regnamespace and (p.proname like 'webpush%' or p.proname = 'enviar_push')
   group by 1, 2, 3, 4 order by 1`);
  paso('las 6 funciones internas (enviar_push y las de webpush) son definer, con search_path vacío y el dueño de procesar(), y nadie más las ejecuta',
    isDeepStrictEqual(internas.map((f) => f.firma), ['rwadar_novedades.enviar_push(integer)', 'rwadar_novedades.webpush_carga(text,text,text,text)',
      'rwadar_novedades.webpush_limpiar()', 'rwadar_novedades.webpush_pendientes(integer)', 'rwadar_novedades.webpush_prueba()',
      'rwadar_novedades.webpush_resultado(jsonb)'])
    && internas.every((f) => f.prosecdef && f.proconfig?.some((v) => /^search_path=(""|)$/.test(v)) && f.dueno && !f.abierta));
  const rpc = await filas(db, `select f.firma, p.prosecdef, p.proconfig,
      has_function_privilege('public', p.oid, 'EXECUTE') pub, has_function_privilege('anon', p.oid, 'EXECUTE') anon,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') aut, has_function_privilege('service_role', p.oid, 'EXECUTE') srv
    from (values ('public.registrar_aviso_webpush(text,text,text)'), ('public.quitar_aviso_webpush(text)'),
      ('public.mi_aviso_webpush_registrado(text)'), ('public.clave_publica_webpush()')) f(firma)
    join pg_proc p on p.oid = to_regprocedure(f.firma)`);
  paso('las 4 RPC del contrato existen, definer con search_path vacío; authenticated sí, public, anon y service_role no',
    rpc.length === 4 && rpc.every((f) => f.prosecdef && f.proconfig?.some((v) => /^search_path=(""|)$/.test(v)) && f.aut && !f.pub && !f.anon && !f.srv));
}

/* =====================================================================
   5 · API para la web: sesión, validaciones, cuentas ajenas y límite de 5
   ===================================================================== */
const ana = await alta(db, 'ana-web@ejemplo.test');
const beto = await alta(db, 'beto-web@ejemplo.test');
const vic = await alta(db, 'vic-admin@ejemplo.test');
const dani = await alta(db, 'dani-web@ejemplo.test');
const eva = await alta(db, 'eva-web@ejemplo.test');
const fede = await alta(db, 'fede-web@ejemplo.test');
await sesion(db);
await db.query('update public.perfiles set es_admin = true where id = $1', [vic.id]);
const rpc = async (u, sql, p = []) => { await como(u); try { return Object.values(await una(db, sql, p))[0]; } finally { await sesion(db); } };
const registrar = (u, s) => rpc(u, 'select public.registrar_aviso_webpush($1, $2, $3) r', [s.endpoint, s.p256dh, s.auth]);
const registrado = (u, s) => rpc(u, 'select public.mi_aviso_webpush_registrado($1) r', [s.endpoint]);
const quitar = (u, s) => rpc(u, 'select public.quitar_aviso_webpush($1) r', [s.endpoint]);
const suscripciones = async (u) => { await sesion(db); return filas(db, 'select * from rwadar_novedades.suscripciones_web where usuario_id = $1 order by id', [u.id]); };
const consentir = async (u) => { await como(u); await db.query("select public.configurar_avisos_novedades(true, $1, 'web')", [VERSION]); await sesion(db); };

const fcm = (n) => `https://fcm.googleapis.com/fcm/send/${n}:APA91bH${crypto.randomBytes(24).toString('base64url')}`;
const apple = (n) => `https://web.push.apple.com/Q${n}${crypto.randomBytes(24).toString('base64url')}`;
const sAnaFcm = navegador(fcm('ana'));
const sAnaApple = navegador(apple('ana'));
const sBeto = navegador(`https://updates.push.services.mozilla.com/wpush/v2/gAAAAA${crypto.randomBytes(30).toString('base64url')}`);
const sVic = navegador(apple('vic'));
const sDani = navegador(`https://wns2-par02p.notify.windows.com/w/?token=BQYAAAD${crypto.randomBytes(30).toString('base64')}`);
{
  await sesion(db, null, 'anon');
  const anon = [
    await codigo(() => db.query('select public.registrar_aviso_webpush($1, $2, $3)', [sAnaFcm.endpoint, sAnaFcm.p256dh, sAnaFcm.auth])),
    await codigo(() => db.query('select public.quitar_aviso_webpush($1)', [sAnaFcm.endpoint])),
    await codigo(() => db.query('select public.mi_aviso_webpush_registrado($1)', [sAnaFcm.endpoint])),
    await codigo(() => db.query('select public.clave_publica_webpush()')),
  ];
  await como(ana, { session_id: '99999999-0000-4000-8000-000000000001' });
  const revocada = [
    await codigo(() => db.query('select public.registrar_aviso_webpush($1, $2, $3)', [sAnaFcm.endpoint, sAnaFcm.p256dh, sAnaFcm.auth])),
    await codigo(() => db.query('select public.quitar_aviso_webpush($1)', [sAnaFcm.endpoint])),
    await codigo(() => db.query('select public.mi_aviso_webpush_registrado($1)', [sAnaFcm.endpoint])),
    await codigo(() => db.query('select public.clave_publica_webpush()')),
  ];
  await como(ana, { exp: 1 });
  const caducada = await codigo(() => db.query('select public.clave_publica_webpush()'));
  await como(ana);
  const directo = [
    await codigo(() => db.query('select * from rwadar_novedades.suscripciones_web')),
    await codigo(() => db.query('select * from rwadar_novedades.envios_web')),
    await codigo(() => db.query('select rwadar_novedades.webpush_pendientes(10)')),
    await codigo(() => db.query('select rwadar_novedades.webpush_prueba()')),
    await codigo(() => db.query(`select rwadar_novedades.webpush_resultado('[]')`)),
  ];
  await sesion(db);
  paso('anon, una sesión revocada o caducada no pueden usar las 4 RPC (42501); authenticated no entra en las tablas ni en las funciones internas',
    [...anon, ...revocada, caducada, ...directo].every((c) => c === '42501'));
}
paso('clave_publica_webpush devuelve la clave pública guardada', (await rpc(ana, 'select public.clave_publica_webpush() c')) === VAPID_ANTERIOR.publica);
{
  const malos = [
    'http://fcm.googleapis.com/fcm/send/x', 'https://fcm.googleapis.com.evil.example/fcm/send/x', 'https://evil.example/fcm/send/x',
    'https://fcm.googleapis.com:443/fcm/send/x', 'https://ana@fcm.googleapis.com/fcm/send/x', 'https://fcm.googleapis.com/',
    'https://FCM.googleapis.com/fcm/send/x', 'https://notify.windows.com/w/?token=x', 'https://a.b.notify.windows.com/w/?token=x',
    'https://web.push.apple.com/x y', 'https://web.push.apple.com/x\nhost: otro', `https://web.push.apple.com/${'a'.repeat(2030)}`,
    'javascript:alert(1)', '', null,
  ];
  const codigos = [];
  for (const e of malos) codigos.push(await codigo(() => registrar(ana, { ...sAnaFcm, endpoint: e })));
  const clavesMalas = [
    { p256dh: sAnaFcm.p256dh.slice(1) }, { p256dh: `C${sAnaFcm.p256dh.slice(1)}` }, { p256dh: `${sAnaFcm.p256dh.slice(0, -1)}B` },
    { auth: sAnaFcm.auth.slice(1) }, { auth: `${sAnaFcm.auth.slice(0, -1)}B` }, { auth: null }, { p256dh: '' },
  ];
  for (const c of clavesMalas) codigos.push(await codigo(() => registrar(ana, { ...sAnaFcm, ...c })));
  paso(`registrar_aviso_webpush rechaza (22023) ${malos.length} endpoints (http, otros hosts, puerto, usuario, sin ruta, mayúsculas, espacios, saltos, demasiado largo…) y ${clavesMalas.length} claves sin forma, sin guardar nada`,
    codigos.length === malos.length + clavesMalas.length && codigos.every((c) => c === '22023') && (await suscripciones(ana)).length === 0);
  // PushSubscription.toJSON() da base64url sin relleno; se admite también el
  // relleno «=» y el alfabeto +/ de base64, y se guarda normalizado.
  const conRelleno = { ...sAnaApple, p256dh: `${Buffer.from(sAnaApple.p256dh, 'base64url').toString('base64')}`,
    auth: Buffer.from(sAnaApple.auth, 'base64url').toString('base64') };
  const r1 = await registrar(ana, sAnaFcm);
  const r2 = await registrar(ana, conRelleno);
  const guardadas = await suscripciones(ana);
  paso('las suscripciones de Google y Apple se registran (true), las claves se guardan en base64url aunque lleguen con relleno o con +/, y registrar no crea ningún envío',
    r1 === true && r2 === true && guardadas.length === 2 && guardadas[1].p256dh === sAnaApple.p256dh && guardadas[1].auth === sAnaApple.auth
    && (await numero(db, 'select count(*) from rwadar_novedades.envios_web')) === 0
    && (await numero(db, 'select count(*) from net.http_request_queue')) === 0);
  await registrar(beto, sBeto);
  await registrar(vic, sVic);
  await registrar(dani, sDani);
  paso('Mozilla (updates.push.services.mozilla.com) y Microsoft (*.notify.windows.com) también se registran',
    (await suscripciones(beto)).length === 1 && (await suscripciones(dani)).length === 1);
  paso('mi_aviso_webpush_registrado: true con el endpoint propio, false con el de otra cuenta o uno desconocido',
    (await registrado(ana, sAnaFcm)) === true && (await registrado(beto, sAnaFcm)) === false && (await registrado(ana, sBeto)) === false
    && (await registrado(ana, { endpoint: fcm('nadie') })) === false);
  paso('quitar_aviso_webpush de un endpoint ajeno devuelve false y no lo borra',
    (await quitar(beto, sAnaFcm)) === false && (await registrado(ana, sAnaFcm)) === true);
  // Fede registra el endpoint de un navegador que antes usaba Beto: pasa a Fede.
  const antes = (await suscripciones(beto))[0];
  await registrar(fede, sBeto);
  const deFede = await suscripciones(fede);
  paso('si el endpoint era de otra cuenta, pasa a esta como suscripción nueva (la otra ya no lo tiene)',
    (await suscripciones(beto)).length === 0 && deFede.length === 1 && deFede[0].id !== antes.id
    && (await registrado(beto, sBeto)) === false && (await registrado(fede, sBeto)) === true);
  await quitar(fede, sBeto);
  await registrar(beto, sBeto);
  // Eva registra 7 navegadores: se quedan los 5 últimos; renovar uno lo salva.
  const deEva = Array.from({ length: 7 }, (_, i) => navegador(fcm(`eva-${i}`)));
  for (const s of deEva.slice(0, 5)) await registrar(eva, s);
  await registrar(eva, deEva[0]);
  for (const s of deEva.slice(5)) await registrar(eva, s);
  const quedan = (await suscripciones(eva)).map((s) => s.endpoint).sort();
  paso('como mucho 5 por cuenta: con 7, se borran las que llevan más tiempo sin renovarse (volver a registrar una la renueva)',
    isDeepStrictEqual(quedan, [deEva[0], deEva[3], deEva[4], deEva[5], deEva[6]].map((s) => s.endpoint).sort()));
  const v32 = await verificar32();
  paso(`el verificador 32 cuenta las suscripciones sin enseñar ninguna («${v32.aviso || v32.error}»)`,
    v32.ok && /10 suscripción\(es\) en 5 cuenta\(s\)/.test(v32.aviso) && !v32.aviso.includes('https://'));
}

/* =====================================================================
   6 · Pendientes: interruptor, permiso, fechas y carga del contrato
   ===================================================================== */
const pendientes = async (tanda = 200) => { await sesion(db); return (await una(db, 'select rwadar_novedades.webpush_pendientes($1) p', [tanda])).p; };
const resultado = async (lista) => { await sesion(db); return (await una(db, 'select rwadar_novedades.webpush_resultado($1::jsonb) r', [JSON.stringify(lista)])).r; };
const anunciar = async (clave, titulo, texto, enlace = 'https://rwadar.pages.dev/') => {
  await sesion(db);
  return Number((await una(db, "select rwadar_novedades.anunciar('novedad', $1, $2, $3, $4) id", [clave, titulo, texto, enlace])).id);
};
const envios = async () => { await sesion(db); return filas(db, 'select * from rwadar_novedades.envios_web order by id'); };
await consentir(ana);
await consentir(dani);
await consentir(eva);
await sesion(db);
await db.query("update rwadar_novedades.preferencias set version = 'novedades-v1-2026-11-05' where usuario_id = $1", [dani.id]);
{
  const a1 = await anunciar('novedad:webpush-apagado', 'Antes de encender', 'Este no sale por notificación web.');
  const p = await pendientes();
  paso('con el push apagado, webpush_pendientes no devuelve nada ni marca nada ({"push": false, "envios": []})',
    isDeepStrictEqual(p, { v: 1, push: false, envios: [] }) && (await envios()).length === 0);
  const cola = await numero(db, 'select count(*) from net.http_request_queue');
  await sesion(db);
  await db.exec(ACTIVAR_PUSH);
  const p2 = await pendientes();
  paso('al encender el push (activar-push, el mismo interruptor que Expo), un anuncio publicado antes de encenderlo no sale',
    p2.push === true && p2.envios.length === 0 && a1 > 0);
  // El push de Expo: la bienvenida de un móvil registrado sale con prioridad alta.
  await como(ana);
  await db.query("select public.registrar_aviso_push($1, 'android')", [`ExponentPushToken[${'prueba32'.padEnd(22, 'x')}]`]);
  await sesion(db);
  await db.query('select rwadar_novedades.enviar_push(50)');
  const expo = await filas(db, 'select url, body from net.http_request_queue where id > $1 order by id', [cola]);
  paso('enviar_push manda el push de Expo con priority «high» (y el resto igual que en la 30: canal «cuenta», sonido, título)',
    expo.length === 1 && expo[0].url === 'https://exp.host/--/api/v2/push/send' && expo[0].body.priority === 'high'
    && expo[0].body.channelId === 'cuenta' && expo[0].body.sound === 'default' && expo[0].body.title === 'RWAdar');
}
const a2 = await anunciar('novedad:webpush-uno', 'La Academy tiene lecciones nuevas', 'Dos lecciones nuevas sobre tokenización.', 'https://rwadar.pages.dev/academy/');
const sCarla = navegador(fcm('carla'));
const carla = await alta(db, 'carla-web@ejemplo.test');
await consentir(carla);
await registrar(carla, sCarla);
let lote1;
{
  lote1 = await pendientes();
  const destinos = lote1.envios.map((e) => e.endpoint).sort();
  const deEva = (await suscripciones(eva)).map((s) => s.endpoint);
  paso('el anuncio nuevo va solo a quien tiene el permiso vigente (Ana con sus 2 navegadores y Eva con sus 5), no a Beto (sin permiso), Vic (admin sin permiso), Dani (versión antigua) ni Carla (se suscribió después)',
    lote1.push === true && isDeepStrictEqual(destinos, [sAnaFcm.endpoint, sAnaApple.endpoint, ...deEva].sort()));
  const e = lote1.envios.find((x) => x.endpoint === sAnaFcm.endpoint);
  paso('cada envío lleva id «e…», endpoint, p256dh, auth y la carga del contrato {v, titulo, texto, url (por destino), etiqueta «rwadar-<id>»}',
    /^e[1-9][0-9]*$/.test(e.id) && e.p256dh === sAnaFcm.p256dh && e.auth === sAnaFcm.auth
    && isDeepStrictEqual(e.carga, { v: 1, titulo: 'La Academy tiene lecciones nuevas', texto: 'Dos lecciones nuevas sobre tokenización.',
      url: 'https://rwadar.pages.dev/academy/', etiqueta: `rwadar-${a2}` }));
  const marcados = await envios();
  paso('webpush_pendientes los deja «enviando» con un intento, y otra llamada ya no los devuelve',
    marcados.length === 7 && marcados.every((x) => x.estado === 'enviando' && x.intentos === 1 && x.anuncio_id === a2)
    && (await pendientes()).envios.length === 0);
  const tanda = await (async () => { await anunciar('novedad:webpush-tanda', 'Otra novedad', 'Para probar la tanda.');
    return pendientes(3); })();
  paso('la tanda limita cuántos se marcan; la siguiente llamada da el resto, y una tanda fuera de 1..500 se rechaza',
    tanda.envios.length === 3 && (await pendientes()).envios.length === 5
    && await codigo(() => pendientes(0)) === '22023' && await codigo(() => pendientes(501)) === '22023');
}
{
  // Resultados: 201, 410, 404, 429, 500 y 400.
  await sesion(db);
  const deA2 = await filas(db, `select e.id, s.endpoint from rwadar_novedades.envios_web e
    join rwadar_novedades.suscripciones_web s on s.id = e.suscripcion_id where e.anuncio_id = $1 order by e.id`, [a2]);
  const porEndpoint = Object.fromEntries(deA2.map((x) => [x.endpoint, `e${x.id}`]));
  const deEva = (await suscripciones(eva)).map((s) => s.endpoint);
  const lista = [
    { id: porEndpoint[sAnaFcm.endpoint], codigo: 201 },
    { id: porEndpoint[sAnaApple.endpoint], codigo: 410 },
    { id: porEndpoint[deEva[0]], codigo: 404 },
    { id: porEndpoint[deEva[1]], codigo: 429 },
    { id: porEndpoint[deEva[2]], codigo: 500 },
    { id: porEndpoint[deEva[3]], codigo: 400 },
    { id: porEndpoint[deEva[4]], codigo: 0 },
    { id: 'e999999', codigo: 201 },
  ];
  const r = await resultado(lista);
  const tras = Object.fromEntries((await filas(db, `select e.*, s.endpoint from rwadar_novedades.envios_web e
    join rwadar_novedades.suscripciones_web s on s.id = e.suscripcion_id where e.anuncio_id = $1`, [a2])).map((x) => [x.endpoint, x]));
  paso('webpush_resultado: 201 = enviado (con fecha); 410 y 404 borran la suscripción y sus envíos; 429, 500 y sin respuesta = reintentar; 400 = fallido; un id desconocido se ignora',
    isDeepStrictEqual(r, { enviados: 1, reintentar: 3, fallidos: 1, borradas: 2, ignorados: 1 })
    && tras[sAnaFcm.endpoint].estado === 'enviado' && tras[sAnaFcm.endpoint].codigo === 201 && tras[sAnaFcm.endpoint].enviado_el instanceof Date
    && !tras[sAnaApple.endpoint] && !tras[deEva[0]] && (await registrado(ana, sAnaApple)) === false
    && tras[deEva[1]].estado === 'reintentar' && tras[deEva[1]].codigo === 429
    && tras[deEva[2]].estado === 'reintentar' && tras[deEva[3]].estado === 'fallido' && tras[deEva[3]].codigo === 400
    && tras[deEva[4]].estado === 'reintentar' && tras[deEva[4]].codigo === 0);
  const otraVez = await resultado([{ id: porEndpoint[sAnaFcm.endpoint], codigo: 500 }]);
  paso('un resultado repetido no cambia nada (ignorado): lo enviado sigue enviado',
    otraVez.ignorados === 1 && (await envios()).find((x) => `e${x.id}` === porEndpoint[sAnaFcm.endpoint]).estado === 'enviado');
  const malas = [{}, 'texto', [{ id: 'x1', codigo: 201 }], [{ id: 'e1', codigo: '201' }], [{ id: 'e1', codigo: 600 }],
    [{ id: 'e1', codigo: 201.5 }], [{ id: 'e1' }], [{ id: 'e0', codigo: 201 }], Array.from({ length: 1001 }, () => ({ id: 'e1', codigo: 201 }))];
  const codigosMalos = [];
  for (const m of malas) codigosMalos.push(await codigo(() => resultado(m)));
  paso(`webpush_resultado rechaza (22023) ${malas.length} entradas sin forma (no lista, id o código raros, más de 1000) sin cambiar nada`,
    codigosMalos.every((c) => c === '22023') && (await envios()).filter((x) => x.estado === 'reintentar').length === 3);

  // Reintentos: no antes de 5 minutos; hasta 3 intentos; el tercero falla.
  const reintentos = async () => (await pendientes()).envios.filter((e) => Object.values(porEndpoint).includes(e.id));
  const atrasar = async (minutos) => { await sesion(db); await db.query(`update rwadar_novedades.envios_web set actualizado_el = now() - make_interval(mins => $1) where estado in ('reintentar', 'enviando')`, [minutos]); };
  const r0 = await reintentos();
  await atrasar(6);
  const r1 = await reintentos();
  await resultado(r1.map((e) => ({ id: e.id, codigo: 503 })));
  await atrasar(6);
  const r2 = await reintentos();
  const intentos2 = (await envios()).filter((x) => r2.some((e) => e.id === `e${x.id}`)).map((x) => x.intentos);
  const fin = await resultado(r2.map((e, i) => ({ id: e.id, codigo: i === 0 ? 201 : 500 })));
  await atrasar(6);
  paso('un reintento espera 5 minutos; vuelve con el mismo id y un intento más; al tercer fallo queda «fallido» y ya no vuelve',
    r0.length === 0 && r1.length === 3 && r2.length === 3 && isDeepStrictEqual(r1.map((e) => e.id).sort(), r2.map((e) => e.id).sort())
    && intentos2.every((n) => n === 3) && isDeepStrictEqual(fin, { enviados: 1, reintentar: 0, fallidos: 2, borradas: 0, ignorados: 0 })
    && (await reintentos()).length === 0);
}
{
  // Envíos sin resultado (el flujo se cortó): a los 15 minutos, a reintentar.
  const a3 = await anunciar('novedad:webpush-cortado', 'Un aviso cortado', 'El flujo se cortó a medias.');
  const lote = await pendientes();
  const mios = lote.envios.filter((e) => e.carga.etiqueta === `rwadar-${a3}`);
  const deNuevo = (await pendientes()).envios.length;
  await sesion(db);
  await db.query(`update rwadar_novedades.envios_web set actualizado_el = now() - interval '16 minutes' where anuncio_id = $1`, [a3]);
  const otra = (await pendientes()).envios.filter((e) => e.carga.etiqueta === `rwadar-${a3}`);
  const filasA3 = (await envios()).filter((x) => x.anuncio_id === a3);
  paso('un envío que se quedó «enviando» (flujo cortado) no se repite antes de 15 minutos; pasados, vuelve a salir con el mismo id y su intento contado',
    mios.length > 0 && deNuevo === 0 && isDeepStrictEqual(otra.map((e) => e.id).sort(), mios.map((e) => e.id).sort())
    && filasA3.length === mios.length && filasA3.every((x) => x.estado === 'enviando' && x.intentos === 2));
  // Un anuncio de hace más de 7 días ya no sale y sus reintentos se descartan.
  await resultado(otra.map((e) => ({ id: e.id, codigo: 503 })));
  await sesion(db);
  await db.query(`update rwadar_novedades.anuncios set publicado_el = now() - interval '8 days' where id = $1`, [a3]);
  await db.query(`update rwadar_novedades.envios_web set actualizado_el = now() - interval '6 minutes' where anuncio_id = $1`, [a3]);
  const p = await pendientes();
  paso('un anuncio publicado hace más de 7 días ya no sale y sus reintentos quedan «descartado»',
    p.envios.every((e) => e.carga.etiqueta !== `rwadar-${a3}`)
    && (await envios()).filter((x) => x.anuncio_id === a3).every((x) => x.estado === 'descartado'));
  for (const e of p.envios) await resultado([{ id: e.id, codigo: 201 }]);
}
{
  // Permiso retirado, cuenta anónima, sin confirmar o borrada.
  const a4 = await anunciar('novedad:webpush-permiso', 'Cambios en el permiso', 'Solo para quien sigue apuntado.');
  await como(eva);
  await db.query("select public.configurar_avisos_novedades(false, null, 'web')");
  await sesion(db);
  await db.query('update auth.users set is_anonymous = true where id = $1', [carla.id]);
  const p = await pendientes();
  await db.query('update auth.users set is_anonymous = false where id = $1', [carla.id]);
  paso('sin permiso vigente (baja en Perfil) o con la cuenta anónima, no sale nada para esa cuenta',
    isDeepStrictEqual(p.envios.map((e) => e.endpoint), [sAnaFcm.endpoint]) && p.envios[0].carga.etiqueta === `rwadar-${a4}`);
  await resultado([{ id: p.envios[0].id, codigo: 201 }]);
  const antes = (await suscripciones(carla)).length;
  await sesion(db);
  await db.query('delete from auth.users where id = $1', [carla.id]);
  paso('al borrar la cuenta se borran sus suscripciones (en cascada)', antes === 1
    && (await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web where endpoint = $1', [sCarla.endpoint])) === 0);
}

/* =====================================================================
   7 · Prueba solo a administración y limpieza
   ===================================================================== */
const prueba = async () => { await sesion(db); return (await una(db, 'select rwadar_novedades.webpush_prueba() p')).p; };
{
  const p = await prueba();
  paso('webpush_prueba solo devuelve los navegadores de las cuentas de administración, con «Prueba de RWAdar» y el texto del contrato, id «p…» y sin guardar nada',
    p.push === true && p.envios.length === 1 && p.envios[0].endpoint === sVic.endpoint && /^p[1-9][0-9]*$/.test(p.envios[0].id)
    && isDeepStrictEqual(p.envios[0].carga, { v: 1, titulo: PRUEBA_TITULO, texto: PRUEBA_TEXTO, url: 'https://rwadar.pages.dev/', etiqueta: 'rwadar-prueba' })
    && (await envios()).every((x) => x.suscripcion_id !== Number(p.envios[0].id.slice(1))));
  await sesion(db);
  await db.exec(APAGAR);
  const apagado = await prueba();
  const sinAnuncios = await pendientes();
  paso('con el push apagado, la prueba sigue saliendo solo a administración (la lanza Víctor a mano) y lo pendiente no',
    apagado.push === false && apagado.envios.length === 1 && sinAnuncios.envios.length === 0);
  await db.exec(ACTIVAR_PUSH);
  await db.query('update public.perfiles set es_admin = false where id = $1', [vic.id]);
  const sinAdmin = await prueba();
  await db.query('update public.perfiles set es_admin = true where id = $1', [vic.id]);
  paso('sin cuentas de administración, la prueba no tiene a quién ir', sinAdmin.envios.length === 0);
  const r = await resultado([{ id: apagado.envios[0].id, codigo: 201 }, { id: 'p999999', codigo: 201 }]);
  paso('los resultados de prueba no se guardan: 201 cuenta como enviado y un id desconocido se ignora',
    isDeepStrictEqual(r, { enviados: 1, reintentar: 0, fallidos: 0, borradas: 0, ignorados: 1 }));
}
{
  await sesion(db);
  const viejo = await registrar(beto, navegador(fcm('beto-viejo')));
  await db.query(`update rwadar_novedades.suscripciones_web set actualizado_el = now() - interval '181 days'
    where usuario_id = $1 and endpoint <> $2`, [beto.id, sBeto.endpoint]);
  await db.query(`update rwadar_novedades.envios_web set creado_el = now() - interval '91 days'
    where id = (select min(id) from rwadar_novedades.envios_web)`);
  const antes = await numero(db, 'select count(*) from rwadar_novedades.envios_web');
  const n = await numero(db, 'select rwadar_novedades.webpush_limpiar()');
  paso('webpush_limpiar borra los envíos de hace más de 90 días y las suscripciones sin renovar en 180 días, y nada más',
    viejo === true && n === 2 && (await numero(db, 'select count(*) from rwadar_novedades.envios_web')) === antes - 1
    && (await suscripciones(beto)).length === 1 && (await registrado(beto, sBeto)) === true);
  const definicion = (await una(db, "select lower(pg_get_functiondef('rwadar_novedades.webpush_limpiar()'::regprocedure)) d")).d;
  paso('webpush_limpiar no hace red ni lee Vault, y limpiar() de la 30 sigue igual (no se redefine)',
    !/net\.|http|vault/.test(definicion)
    && (await una(db, "select pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure) d")).d.includes('interval \'3 years\'')
    && !sinComentarios(SQL32).includes('function rwadar_novedades.limpiar('));
}

/* =====================================================================
   8 · Verificador 32: detecta cada rotura
   ===================================================================== */
{
  const envio30 = funcionDe(SQL30, 'rwadar_novedades.enviar_push');
  const envio32 = funcionDe(SQL32, 'rwadar_novedades.enviar_push');
  const prueba32 = funcionDe(SQL32, 'rwadar_novedades.webpush_prueba');
  const regla = (await una(db, `select pg_get_constraintdef(oid) d from pg_constraint where conname = 'suscripcion_web_endpoint_valido'`)).d;
  const rompe = async (romper, arreglar) => { await sesion(db); await db.exec(romper); const v = await verificar32(); await sesion(db); await db.exec(arreglar); return v; };
  const rotos = {
    'enviar_push de la 30 (default)': [await rompe(envio30, envio32), /prioridad alta/],
    'tabla abierta a authenticated': [await rompe('grant select on rwadar_novedades.suscripciones_web to authenticated',
      'revoke select on rwadar_novedades.suscripciones_web from authenticated'), /authenticated tiene permisos sobre/],
    'tabla abierta a service_role': [await rompe('grant delete on rwadar_novedades.envios_web to service_role',
      'revoke delete on rwadar_novedades.envios_web from service_role'), /service_role tiene permisos sobre/],
    'sin RLS': [await rompe('alter table rwadar_novedades.envios_web disable row level security',
      'alter table rwadar_novedades.envios_web enable row level security'), /no tiene RLS/],
    'función interna para service_role': [await rompe('grant execute on function rwadar_novedades.webpush_pendientes(integer) to service_role',
      'revoke execute on function rwadar_novedades.webpush_pendientes(integer) from service_role'), /ejecutable por service_role/],
    'función interna invoker': [await rompe('alter function rwadar_novedades.webpush_resultado(jsonb) security invoker',
      'alter function rwadar_novedades.webpush_resultado(jsonb) security definer'), /security definer/],
    'RPC sin authenticated': [await rompe('revoke execute on function public.registrar_aviso_webpush(text,text,text) from authenticated',
      'grant execute on function public.registrar_aviso_webpush(text,text,text) to authenticated'), /permisos incorrectos/],
    'RPC para anon': [await rompe('grant execute on function public.clave_publica_webpush() to anon',
      'revoke execute on function public.clave_publica_webpush() from anon'), /permisos incorrectos/],
    'sin la regla de endpoints': [await rompe('alter table rwadar_novedades.suscripciones_web drop constraint suscripcion_web_endpoint_valido',
      `alter table rwadar_novedades.suscripciones_web add constraint suscripcion_web_endpoint_valido ${regla}`), /reglas/],
    'sin borrado en cascada': [await rompe(`alter table rwadar_novedades.envios_web drop constraint envios_web_suscripcion_id_fkey;
        alter table rwadar_novedades.envios_web add constraint envios_web_suscripcion_id_fkey foreign key (suscripcion_id) references rwadar_novedades.suscripciones_web(id)`,
      `alter table rwadar_novedades.envios_web drop constraint envios_web_suscripcion_id_fkey;
        alter table rwadar_novedades.envios_web add constraint envios_web_suscripcion_id_fkey foreign key (suscripcion_id) references rwadar_novedades.suscripciones_web(id) on delete cascade`), /cascada/],
    'prueba para todas las cuentas': [await rompe(prueba32.replace("join public.perfiles pf on pf.id = s.usuario_id and pf.es_admin\n", '')
      .replaceAll('es_admin', 'id'), prueba32), /administración/],
    'privada sin pública': [await rompe("update rwadar_novedades.configuracion set webpush_clave_publica = null",
      `update rwadar_novedades.configuracion set webpush_clave_publica = '${VAPID_ANTERIOR.publica}'`), /sin clave pública/],
    'pública sin privada': [await rompe("update vault.decrypted_secrets set name = 'OTRA' where name = 'RWADAR_VAPID_PRIVADA'",
      "update vault.decrypted_secrets set name = 'RWADAR_VAPID_PRIVADA' where name = 'OTRA'"), /RWADAR_VAPID_PRIVADA válida/],
    'más de 5 por cuenta': [await rompe(`insert into rwadar_novedades.suscripciones_web (usuario_id, endpoint, p256dh, auth)
        select $$${eva.id}$$::uuid, 'https://fcm.googleapis.com/fcm/send/sobra-' || g, $$${sAnaFcm.p256dh}$$, $$${sAnaFcm.auth}$$ from generate_series(1, 6) g`,
      "delete from rwadar_novedades.suscripciones_web where endpoint like 'https://fcm.googleapis.com/fcm/send/sobra-%'"), /más de 5/],
  };
  const fallan = Object.entries(rotos).filter(([, [v, motivo]]) => v.ok || !motivo.test(v.error || '')).map(([n, [v]]) => `${n}: ${v.error || 'pasa'}`);
  paso(`el verificador 32 detecta ${Object.keys(rotos).length} roturas (prioridad, permisos de tablas y funciones, RLS, definer, RPC, reglas, cascada, prueba sin filtro, clave a medias y más de 5)${fallan.length ? ` · no detecta: ${fallan.join(' | ')}` : ''}`,
    fallan.length === 0 && (await verificar32()).ok);
}
{
  // Reaplicar la 30 devuelve enviar_push a 'default': el verificador 32 lo
  // detecta; reaplicar la 31 y la 32 lo arregla, sin perder nada de la 32.
  const antes = await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web');
  await sesion(db);
  await db.exec(SQL30);
  const v = await verificar32();
  const clave = (await una(db, 'select webpush_clave_publica c from rwadar_novedades.configuracion')).c;
  await db.exec(SQL31);
  await db.exec(SQL32);
  paso('reaplicar la 30 devuelve el push de Expo a «default» (el verificador 32 lo detecta) y conserva la clave pública y las suscripciones; reaplicar la 31 y la 32 lo deja bien',
    !v.ok && /prioridad alta/.test(v.error) && clave === VAPID_ANTERIOR.publica
    && (await numero(db, 'select count(*) from rwadar_novedades.suscripciones_web')) === antes
    && (await verificar30()).ok && (await verificar31()).ok && (await verificar32()).ok);
  await db.exec(ACTIVAR_PUSH);
}

/* =====================================================================
   9 · Flujo «Avisos a registrados (base)»: acciones de la 32 y la clave
   ===================================================================== */
{
  const opciones = BASE.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map((l) => l.trim().slice(2));
  paso('avisos-base.yml añade ensayo-32, verificar-32, aplicar-32, crear-vapid y rotar-vapid tras guardar-correo y conserva las demás',
    isDeepStrictEqual(opciones, ['ensayo-30', 'verificar-30', 'diagnostico-30', 'aplicar-30', 'ensayo-31', 'verificar-31', 'aplicar-31',
      'guardar-correo', 'ensayo-32', 'verificar-32', 'aplicar-32', 'crear-vapid', 'rotar-vapid', 'activar-casilla', 'activar-correo',
      'activar-push', 'apagar', 'apagar-casilla']));
  paso('el flujo comprueba que las dos copias de la 32 son idénticas',
    BASE.includes('cmp -s "$D/32_notificaciones.sql" rwadar-app/supabase/migrations/20261112130000_notificaciones.sql'));
  paso('el paso «Aplicar» no ejecuta el SQL de la clave VAPID (lo hace su propio paso, con las variables)',
    /- name: Aplicar\n {8}if: env\.CAMBIA == 'si' && inputs\.accion != 'guardar-correo' && inputs\.accion != 'crear-vapid' && inputs\.accion != 'rotar-vapid'\n/.test(BASE));
  const crear = pasoDe(BASE, 'Crear o rotar la clave VAPID de las notificaciones web') || '';
  const nodo = pasoDe(BASE, 'Preparar Node.js (solo crear-vapid y rotar-vapid)') || '';
  paso('crear-vapid: Node 22.23.4 fijado (sin npm), la privada nunca se imprime ni va a GITHUB_ENV/OUTPUT, se enmascara y pasa a psql con -v; la pública va al resumen',
    /if: inputs\.accion == 'crear-vapid' \|\| inputs\.accion == 'rotar-vapid'/.test(crear) && /node-version: 22\.23\.4/.test(nodo)
    && /uses: actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/.test(nodo)
    && /echo "::add-mask::\$PRIVADA"/.test(crear) && /-v privada="\$PRIVADA" -v publica="\$PUBLICA" -v rotar="\$ROTAR"/.test(crear)
    && !/(echo|printf)[^\n]*\$\{?PRIVADA/.test(crear.replace('echo "::add-mask::$PRIVADA"', ''))
    && !/PRIVADA[^\n]*>>\s*"\$GITHUB_(ENV|OUTPUT|STEP_SUMMARY)"/.test(crear) && !/\bnpm\b|npx/.test(crear)
    && /GITHUB_STEP_SUMMARY/.test(crear) && !/secrets\.(?!SUPABASE_DB_URL)/.test(crear));
}
if (hayBash) {
  const comprueba = (entradas) => correPaso(BASE, 'Comprobar la acción', { ACCION: 'ensayo-32', CONFIRMAR: '', REMITENTE: '', ...entradas });
  const v3 = `${V30_RUTA} ${V31_RUTA} ${V32_RUTA}`;
  const esperados = [
    [{ ACCION: 'ensayo-32' }, { SQL: 'rwadar-app/db/32_notificaciones.sql', CAMBIA: 'no', ENSAYO: 'si', VERIFICADORES: v3 }],
    [{ ACCION: 'verificar-32' }, { SQL: V32_RUTA, CAMBIA: 'no', ENSAYO: 'no', VERIFICADORES: v3 }],
    [{ ACCION: 'aplicar-32', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/32_notificaciones.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: v3 }],
    [{ ACCION: 'crear-vapid', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/32_notificaciones_vapid.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: `${V30_RUTA} ${V32_RUTA}` }],
    [{ ACCION: 'rotar-vapid', CONFIRMAR: 'AVISOS' }, { SQL: 'rwadar-app/db/32_notificaciones_vapid.sql', CAMBIA: 'si', ENSAYO: 'no', VERIFICADORES: `${V30_RUTA} ${V32_RUTA}` }],
  ];
  const vistos = [];
  for (const [entradas] of esperados) vistos.push(await comprueba(entradas));
  paso(`«Comprobar la acción» elige SQL, copia, ensayo y verificadores de las ${esperados.length} acciones de la 32 (la migración con los verificadores 30, 31 y 32)`,
    vistos.every((v, i) => v.estado === 0 && isDeepStrictEqual(v.salida, esperados[i][1])));
  const malos = [{ ACCION: 'aplicar-32' }, { ACCION: 'crear-vapid' }, { ACCION: 'rotar-vapid', CONFIRMAR: 'avisos' }, { ACCION: 'crear-vapid-ya' }];
  const rechazos = [];
  for (const m of malos) rechazos.push(await comprueba(m));
  paso(`y rechaza ${malos.length} entradas (sin AVISOS o acción desconocida) sin dejar nada en GITHUB_ENV`,
    rechazos.every((v) => v.estado !== 0 && Object.keys(v.salida).length === 0));
  const verificar = await correPaso(BASE, 'Verificar', (await comprueba({ ACCION: 'aplicar-32', CONFIRMAR: 'AVISOS' })).salida);
  paso('el paso «Verificar», ejecutado de verdad tras aplicar-32, pasa los verificadores 30, 31 y 32 en ese orden sobre PGlite',
    verificar.estado === 0 && isDeepStrictEqual(verificar.llamadas.map((l) => l.at(-1)), [V30_RUTA, V31_RUTA, V32_RUTA])
    && /RWAdar 32 OK/.test(verificar.stderr));

  // crear-vapid y rotar-vapid, de verdad: node genera el par y psql lo guarda.
  const SUSCRIPCIONES = async () => numero(db, 'select count(*) from rwadar_novedades.suscripciones_web');
  const claveGuardada = async () => {
    await sesion(db);
    return { publica: (await una(db, 'select webpush_clave_publica c from rwadar_novedades.configuracion')).c,
      privadas: (await filas(db, "select decrypted_secret v from vault.decrypted_secrets where name = 'RWADAR_VAPID_PRIVADA'")).map((f) => f.v) };
  };
  const PASO_VAPID = 'Crear o rotar la clave VAPID de las notificaciones web';
  const correVapid = async (accion) => correPaso(BASE, PASO_VAPID, { ...(await comprueba({ ACCION: accion, CONFIRMAR: 'AVISOS' })).salida, ACCION: accion });
  // Sin clave todavía: crear-vapid la crea.
  await sesion(db);
  await db.exec(`delete from vault.decrypted_secrets where name = 'RWADAR_VAPID_PRIVADA';
    update rwadar_novedades.configuracion set webpush_clave_publica = null where unica`);
  const subsAntes = await SUSCRIPCIONES();
  const c1 = await correVapid('crear-vapid');
  const subsTras1 = await SUSCRIPCIONES();
  const g1 = await claveGuardada();
  const mascara = c1.stdout.split('\n').filter((l) => l.startsWith('::add-mask::'));
  const privada1 = g1.privadas[0];
  paso(`crear-vapid, ejecutado de verdad: genera el par en la máquina, guarda la privada en Vault y la pública en la configuración, y casan (${c1.estado === 0 ? 'OK' : c1.texto.trim()})`,
    c1.estado === 0 && g1.privadas.length === 1 && !!prepararClaves(privada1, g1.publica) && c1.llamadas.length === 2
    && isDeepStrictEqual(c1.llamadas[0].slice(0, 4), ['postgresql://doble-local/sin-red', '-X', '-v', 'ON_ERROR_STOP=1'])
    && c1.llamadas[0].at(-1) === 'rwadar-app/db/32_notificaciones_vapid.sql' && variablesPsql(c1.llamadas[0]).rotar === 'no');
  paso('las suscripciones que había sin clave pública (no podían ser de esta clave) se borran al crearla', subsAntes > 0 && subsTras1 === 0);
  await registrar(ana, navegador(fcm('tras-crear')));
  paso('la privada solo sale una vez, en la orden ::add-mask:: (que GitHub no enseña); ni en el resto de la salida, ni en el resumen, ni en los avisos de la base; la pública sí va al resumen',
    isDeepStrictEqual(mascara, [`::add-mask::${privada1}`])
    && c1.texto.split(privada1).length === 2 && !c1.resumen.includes(privada1)
    && c1.resumen.includes(g1.publica) && /RWADAR_VAPID_PRIVADA/.test(c1.resumen));
  const c2 = await correVapid('crear-vapid');
  const g2 = await claveGuardada();
  paso('repetir crear-vapid no cambia la clave que ya hay ni borra suscripciones (avisa de rotar-vapid)',
    c2.estado === 0 && isDeepStrictEqual(g2, g1) && /ya hay una clave VAPID y no se cambia/.test(c2.stderr)
    && (await SUSCRIPCIONES()) === 1);
  const c3 = await correVapid('rotar-vapid');
  const g3 = await claveGuardada();
  paso('rotar-vapid la sustituye (una sola privada en Vault, que casa con la nueva pública) y borra las suscripciones web hechas con la anterior',
    c3.estado === 0 && g3.publica !== g1.publica && g3.privadas.length === 1 && g3.privadas[0] !== privada1
    && !!prepararClaves(g3.privadas[0], g3.publica) && (await SUSCRIPCIONES()) === 0
    && variablesPsql(c3.llamadas[0]).rotar === 'si' && !c3.resumen.includes(g3.privadas[0]));
  paso('el verificador 32 pasa con la clave nueva', (await verificar32()).ok);

  // 32_notificaciones_vapid.sql con entradas sin forma: se niega sin repetirlas.
  const vapidSql = async (variables) => {
    await sesion(db);
    const avisos = [];
    const e = await error(() => db.exec(conVariablesPsql(VAPID32, variables), { onNotice: (n) => avisos.push(n.message) }));
    if (e) await db.exec('rollback');
    return { e, avisos };
  };
  const nueva = generarClaves();
  const malas = [{ privada: 'corta', publica: nueva.publica, rotar: 'si' }, { privada: nueva.privada, publica: nueva.publica.slice(1), rotar: 'si' },
    { privada: nueva.privada, publica: nueva.publica, rotar: 'tal-vez' }, { privada: '', publica: nueva.publica, rotar: 'si' }];
  const rs = [];
  for (const m of malas) rs.push(await vapidSql(m));
  paso(`32_notificaciones_vapid.sql rechaza (22023) ${malas.length} entradas sin forma sin cambiar nada y sin repetir la privada en el error`,
    rs.every((r) => r.e?.code === '22023' && !r.e.message.includes(nueva.privada)) && isDeepStrictEqual(await claveGuardada(), g3));
  const variablesVapid = [...new Set([...sinComentarios(VAPID32).matchAll(/:'([a-z_]+)'/g)].map((m) => m[1]))];
  const sentencias = sinComentarios(VAPID32).split('\n').filter((l) => !l.startsWith('\\')).join('\n')
    .split(/(\$[a-z_]*\$[\s\S]*?\$[a-z_]*\$)/).filter((_, i) => i % 2 === 0).join(' ')
    .split(';').map((t) => t.trim()).filter(Boolean).filter((t) => /:'/.test(t));
  paso('las tres entradas solo van en un SELECT (set_config local a la transacción), nunca en una DDL que Supabase registra con el valor; vault.create_secret / update_secret',
    isDeepStrictEqual(variablesVapid, ['privada', 'publica', 'rotar']) && sentencias.length === 1
    && /^select set_config\('rwadar\.vapid_privada', :'privada', true\)/.test(sentencias[0])
    && !/\b(create|alter|insert|update|delete|copy|do|grant|comment)\b/i.test(sentencias[0])
    && /vault\.create_secret\(new_secret := v_privada, new_name := 'RWADAR_VAPID_PRIVADA'/.test(VAPID32)
    && /vault\.update_secret\(secret_id := v_id, new_secret := v_privada\)/.test(VAPID32)
    && /^\\set VERBOSITY terse$/m.test(VAPID32) && !/raise[^;]*v_privada/.test(VAPID32));
}

/* =====================================================================
   10 · Flujo «Notificaciones web»
   ===================================================================== */
{
  const sinAlmohadillas = (t) => t.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  const runs = [...WEB.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map((m) => m[2]);
  const trabajos = WEB.slice(WEB.indexOf('\njobs:\n') + 7).match(/^ {2}[a-z][a-z0-9-]*:$/gm) || [];
  const pasos = [...WEB.matchAll(/\n {6}- name: (.+)/g)].map((m) => m[1]);
  const casa = new Set(fs.readdirSync(path.join(raizRepo, '.github/workflows')).filter((n) => n !== 'notificaciones-web.yml')
    .flatMap((n) => [...fs.readFileSync(path.join(raizRepo, '.github/workflows', n), 'utf8').matchAll(/uses: ([\w./-]+@[0-9a-f]{40})/g)].map((m) => m[1])));
  const enviar = pasoDe(WEB, 'Enviar') || '';
  paso('notificaciones-web.yml: solo a mano (enviar o prueba, escribiendo ENVIAR) o llamado por otro flujo; nunca por horario ni por push',
    /^on:\n {2}workflow_dispatch:\n/m.test(WEB) && /^ {2}workflow_call:\n/m.test(WEB)
    && !/^ {2}(schedule|push|pull_request|pull_request_target|workflow_run|repository_dispatch):/m.test(WEB)
    && /accion:\n(?: {8}.*\n)*? {8}type: choice\n {8}options:\n {10}- enviar\n {10}- prueba\n/.test(WEB)
    && /\[\[ "\$CONFIRMACION" == "ENVIAR" \]\]/.test(WEB));
  paso('un trabajo, permissions: {} y solo contents: read; cola propia; Solo desde main es el primer paso',
    trabajos.length === 1 && /^permissions: \{\}$/m.test(WEB) && (sinAlmohadillas(WEB).match(/permissions:/g) || []).length === 2
    && /^ {4}permissions:\n {6}contents: read\n/m.test(WEB) && !/write/.test(sinAlmohadillas(WEB))
    && /concurrency:\n {6}group: rwadar-notificaciones-web\n {6}cancel-in-progress: false/.test(WEB)
    && pasos[0] === 'Solo desde main' && /if: github\.ref != 'refs\/heads\/main'[\s\S]*?exit 1/.test(pasoDe(WEB, 'Solo desde main')));
  paso('sin npm; Node 22.23.4 y acciones fijadas con los mismos SHA que los demás flujos; el código, sin credenciales persistentes',
    !runs.some((r) => /\bnpm\b|\bnpx\b/.test(r)) && /node-version: 22\.23\.4/.test(WEB) && /node rwadar-node-seguro\.js/.test(enviar)
    && (sinAlmohadillas(WEB).match(/uses: \S+/g) || []).length === 2
    && (sinAlmohadillas(WEB).match(/uses: \S+/g) || []).every((u) => casa.has(u.slice(6)))
    && /persist-credentials: false/.test(WEB));
  paso('nunca ${{ … }} dentro de run:; SUPABASE_DB_URL solo en el paso Enviar (y en los secretos que acepta como flujo llamado)',
    runs.length >= 4 && runs.every((r) => !r.includes('${{'))
    && (WEB.match(/secrets\.SUPABASE_DB_URL/g) || []).length === 1 && enviar.includes('SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}')
    && /^ {4}secrets:\n {6}SUPABASE_DB_URL:\n {8}required: true$/m.test(WEB) && !/secrets\.(?!SUPABASE_DB_URL)/.test(WEB));
  paso('el remitente recibe las claves por el entorno (export, no en la línea de órdenes) y no recibe SUPABASE_DB_URL; la privada se enmascara al llegar y la carpeta temporal se borra siempre',
    /\(\n\s+unset SUPABASE_DB_URL\n\s+export RWADAR_VAPID_PRIVADA="\$PRIVADA" RWADAR_VAPID_PUBLICA="\$PUBLICA"\n\s+exec node rwadar-app\/enviar-webpush\.mjs/.test(enviar)
    && /echo "::add-mask::\$PRIVADA"/.test(enviar) && !/set -[a-z]*x|set -o xtrace/.test(WEB)
    && /- name: Borrar los envíos temporales\n {8}if: always\(\)\n {8}run: rm -rf "\$RUNNER_TEMP\/rwadar-webpush"/.test(WEB));
}
{
  // avisar-novedad.yml lanza las notificaciones web después del anuncio.
  const llamada = AVISAR.slice(AVISAR.indexOf('\n  notificaciones-web:\n'));
  paso('«Avisar novedad» llama a «Notificaciones web» (enviar, ENVIAR) después del anuncio, con contents: read y solo SUPABASE_DB_URL',
    /^ {2}notificaciones-web:\n {4}needs: avisar\n {4}permissions:\n {6}contents: read\n {4}uses: \.\/\.github\/workflows\/notificaciones-web\.yml\n {4}with:\n {6}accion: enviar\n {6}confirmacion: ENVIAR\n {4}secrets:\n {6}SUPABASE_DB_URL: \$\{\{ secrets\.SUPABASE_DB_URL \}\}\n?$/.test(llamada.slice(1))
    && !/secrets: inherit/.test(AVISAR));
}
if (hayBash) {
  const comprueba = (e) => correPaso(WEB, 'Comprobar la entrada', { ACCION: 'enviar', CONFIRMACION: 'ENVIAR', ...e });
  const buenos = [{}, { ACCION: 'prueba' }];
  const malos = [{ CONFIRMACION: 'enviar' }, { CONFIRMACION: '' }, { ACCION: 'borrar' }, { ACCION: '' }, { ACCION: 'enviar; rm -rf /' }];
  const b = [], m = [];
  for (const e of buenos) b.push((await comprueba(e)).estado);
  for (const e of malos) m.push((await comprueba(e)).estado);
  paso(`«Comprobar la entrada» acepta enviar y prueba con ENVIAR y rechaza ${malos.length} entradas malas`,
    b.every((s) => s === 0) && m.every((s) => s !== 0));

  // Navegadores de la prueba del flujo: Ana (Google y Apple) con permiso,
  // Beto sin permiso y Vic (administración).
  await sesion(db);
  const clave = await una(db, "select webpush_clave_publica c, (select decrypted_secret from vault.decrypted_secrets where name = 'RWADAR_VAPID_PRIVADA') p from rwadar_novedades.configuracion");
  const fAnaFcm = navegador(fcm('flujo-ana'));
  const fAnaApple = navegador(apple('flujo-ana'));
  const fBeto = navegador(fcm('flujo-beto'));
  const fVic = navegador(apple('flujo-vic'));
  await consentir(ana);
  for (const [u, s] of [[ana, fAnaFcm], [ana, fAnaApple], [beto, fBeto], [vic, fVic]]) await registrar(u, s);
  respuestas.set(fAnaApple.endpoint, 410);
  const ENVIO = { ACCION: 'enviar' };

  // Push apagado: no sale nada; solo la limpieza.
  await sesion(db);
  await db.exec(APAGAR);
  const aFlujo = await anunciar('novedad:webpush-flujo', 'Las notificaciones ya llegan', 'Actívalas en Perfil desde tu móvil.');
  const antes = recibidos.length;
  const apagado = await correPaso(WEB, 'Enviar', ENVIO);
  paso(`con el push apagado, el paso Enviar no envía nada, no lee la clave y termina bien con el resumen «Push apagado» (${apagado.estado === 0 ? 'OK' : apagado.texto.trim()})`,
    apagado.estado === 0 && recibidos.length === antes && /Push apagado: no sale ninguna notificación/.test(apagado.resumen)
    && apagado.llamadas.every((l) => !l.join(' ').includes('RWADAR_VAPID_PRIVADA')) && (await envios()).every((x) => x.anuncio_id !== aFlujo));
  // Encendido: el anuncio publicado después de encender sale a Ana.
  await db.exec(ACTIVAR_PUSH);
  const aFlujo2 = await anunciar('novedad:webpush-flujo-2', 'Las notificaciones ya llegan', 'Actívalas en Perfil desde tu móvil.');
  const desde = recibidos.length;
  const encendido = await correPaso(WEB, 'Enviar', ENVIO);
  const llegados = recibidos.slice(desde);
  const textoTodo = `${encendido.texto}${encendido.resumen}`;
  paso(`con el push encendido, el paso Enviar (psql + remitente de verdad) manda el anuncio a los 2 navegadores de Ana, firmado y cifrado, y nada a Beto ni a Vic (${encendido.estado === 0 ? 'OK' : encendido.texto.trim()})`,
    encendido.estado === 0 && isDeepStrictEqual(llegados.map((r) => r.endpoint).sort(), [fAnaFcm.endpoint, fAnaApple.endpoint].sort())
    && llegados.every((r) => r.vapid && r.k === clave.c && r.cabeceras.ttl === '86400' && r.cabeceras.urgency === 'high'
      && isDeepStrictEqual(JSON.parse(r.claro.texto), { v: 1, titulo: 'Las notificaciones ya llegan', texto: 'Actívalas en Perfil desde tu móvil.',
        url: 'https://rwadar.pages.dev/', etiqueta: `rwadar-${aFlujo2}` })));
  const deFlujo = (await envios()).filter((x) => x.anuncio_id === aFlujo2);
  paso('los resultados quedan en la base: el de Google «enviado» y el de Apple (410) borrado con su suscripción',
    deFlujo.length === 1 && deFlujo[0].estado === 'enviado' && (await registrado(ana, fAnaApple)) === false && (await registrado(ana, fAnaFcm)) === true);
  paso('el resumen solo lleva cuentas: 1 enviada, 1 suscripción caducada borrada; ni endpoints, ni claves, ni la carga, ni la privada en la salida (salvo ::add-mask::)',
    /Enviadas \(aceptadas por el servicio de push\): 1/.test(encendido.resumen) && /Suscripciones caducadas borradas: 1/.test(encendido.resumen)
    && /Limpieza: \d+ fila\(s\) antiguas borradas/.test(encendido.resumen)
    && [fAnaFcm, fAnaApple, fBeto, fVic].every((s) => !textoTodo.includes(s.endpoint) && !textoTodo.includes(s.p256dh) && !textoTodo.includes(s.auth))
    && !textoTodo.includes('Actívalas en Perfil') && textoTodo.split(clave.p).length === 2 && encendido.stdout.includes(`::add-mask::${clave.p}`)
    && !fs.existsSync(path.join(encendido.temporal, 'rwadar-webpush', 'lote.json')));
  const otraVuelta = await correPaso(WEB, 'Enviar', ENVIO);
  paso('otra vuelta no repite nada (0 enviadas)', otraVuelta.estado === 0 && recibidos.length === desde + 2
    && /Enviadas \(aceptadas por el servicio de push\): 0/.test(otraVuelta.resumen));
  // Prueba: solo Vic.
  const desdeP = recibidos.length;
  const pruebaFlujo = await correPaso(WEB, 'Enviar', { ACCION: 'prueba' });
  const deP = recibidos.slice(desdeP);
  paso(`la acción prueba manda «Prueba de RWAdar» solo al navegador de la cuenta de administración (${pruebaFlujo.estado === 0 ? 'OK' : pruebaFlujo.texto.trim()})`,
    pruebaFlujo.estado === 0 && deP.length === 1 && deP[0].endpoint === fVic.endpoint && deP[0].vapid && deP[0].k === clave.c
    && JSON.parse(deP[0].claro.texto).titulo === PRUEBA_TITULO && JSON.parse(deP[0].claro.texto).texto === PRUEBA_TEXTO
    && /Enviadas \(aceptadas por el servicio de push\): 1/.test(pruebaFlujo.resumen));
  // Sin clave VAPID: enviar avisa y termina bien; prueba falla.
  await sesion(db);
  await db.exec("update vault.decrypted_secrets set name = 'APARTADA' where name = 'RWADAR_VAPID_PRIVADA'");
  const sinClaveEnviar = await correPaso(WEB, 'Enviar', ENVIO);
  const sinClavePrueba = await correPaso(WEB, 'Enviar', { ACCION: 'prueba' });
  await sesion(db);
  await db.exec("update vault.decrypted_secrets set name = 'RWADAR_VAPID_PRIVADA' where name = 'APARTADA'");
  paso('sin clave VAPID, enviar avisa (::warning::) y termina bien, y prueba falla pidiendo crear-vapid',
    sinClaveEnviar.estado === 0 && /::warning::Falta la clave VAPID/.test(sinClaveEnviar.stdout)
    && sinClavePrueba.estado !== 0 && /crear-vapid/.test(sinClavePrueba.stdout));
  // Una clave privada que no casa con la pública: el remitente se para.
  await db.exec(`update vault.decrypted_secrets set decrypted_secret = '${generarClaves().privada}' where name = 'RWADAR_VAPID_PRIVADA'`);
  await anunciar('novedad:webpush-flujo-3', 'Otra novedad más', 'Con la clave cambiada a mano.');
  const desdeM = recibidos.length;
  const noCasa = await correPaso(WEB, 'Enviar', ENVIO);
  await db.exec(`update vault.decrypted_secrets set decrypted_secret = '${clave.p}' where name = 'RWADAR_VAPID_PRIVADA'`);
  paso('si la privada de Vault no casa con la pública, el paso falla sin enviar nada', noCasa.estado !== 0
    && /no corresponde a la pública/.test(noCasa.stderr) && recibidos.length === desdeM);
  const recuperado = await correPaso(WEB, 'Enviar', ENVIO);
  const antesDe15 = recibidos.length;
  await sesion(db);
  await db.exec("update rwadar_novedades.envios_web set actualizado_el = now() - interval '16 minutes' where estado = 'enviando'");
  const pasados15 = await correPaso(WEB, 'Enviar', ENVIO);
  const llegaTarde = recibidos.slice(antesDe15);
  paso('arreglada la clave, lo que quedó «enviando» no sale en la vuelta siguiente, sino pasados 15 minutos (una vez)',
    recuperado.estado === 0 && antesDe15 === desdeM && pasados15.estado === 0
    && llegaTarde.length === 1 && llegaTarde[0].endpoint === fAnaFcm.endpoint && llegaTarde[0].vapid && llegaTarde[0].k === clave.c
    && /Enviadas \(aceptadas por el servicio de push\): 1/.test(pasados15.resumen));
}
} catch (e) {
  fail.push(`la prueba se paró: ${e.stack || e.message}`);
} finally {
  if (servidor) servidor.close();
  if (db) await db.close().catch(() => {});
  fs.rmSync(temporal, { recursive: true, force: true });
}

informe('Notificaciones (migración 32): push de Expo con prioridad alta y notificaciones web', ok, fail);
