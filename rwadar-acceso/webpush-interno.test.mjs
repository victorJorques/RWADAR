/* POST /api/interno/webpush (webpush-servidor.mjs): las notificaciones web
   que manda Supabase con pg_net. El cifrado (RFC 8291) y la firma VAPID
   (RFC 8292) con WebCrypto; de punta a punta con un servicio de push falso en
   127.0.0.1 que comprueba la firma y descifra lo que le llega, como el de
   rwadar-app/probar-notificaciones.mjs; los rechazos; y la ruta dentro del
   _worker.js compilado. */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { crearAccesoServidor } from './servidor.mjs';
import { crearWebpushServidor } from './webpush-servidor.mjs';
import { cargarWorker, crearAuthSimulado } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const { construirWorker, CONFIGURACION_PUBLICA } = require('./compilar.cjs');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ORIGEN = 'https://rwadar.pages.dev';
const SUPABASE = CONFIGURACION_PUBLICA.SUPABASE_URL;
const ENV = { SUPABASE_URL: SUPABASE, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const RPC = '/rest/v1/rpc/clave_publica_webpush_anon';
const fetchReal = globalThis.fetch;
const b64u = (b) => Buffer.from(b).toString('base64url');
const hkdf = (sal, ikm, info, largo) => Buffer.from(crypto.hkdfSync('sha256', ikm, sal, info, largo));

// Una pareja VAPID como la de crear-vapid: d (32 octetos) y el punto sin comprimir.
function parVapid() {
  const jwk = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' });
  return { privada: jwk.d, publica: b64u(Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')])) };
}
const VAPID = parVapid();
const OTRA = parVapid();
const CARGA = Object.freeze({ v: 1, titulo: 'Novedad en RWAdar', texto: 'Ya puedes activar las notificaciones. Ñandú: áéíóú',
  url: 'https://rwadar.pages.dev/?avisos=1#emisiones', etiqueta: 'rwadar-7' });

/* ------------------------------------------------ servicio de push falso */

// endpoint → claves del navegador (para descifrar) y estado que responde.
const navegadores = new Map();
const respuestas = new Map();
const recibidos = [];
let relojPush = () => Date.now();
function navegador(endpoint) {
  const ua = crypto.createECDH('prime256v1');
  ua.generateKeys();
  const n = { ua, auth: crypto.randomBytes(16) };
  navegadores.set(endpoint, n);
  return { endpoint, p256dh: ua.getPublicKey('base64url'), auth: n.auth.toString('base64url') };
}
function descifrar(cuerpo, n) {
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
  return { texto: claro.subarray(0, fin).toString('utf8'), rs: cuerpo.readUInt32BE(16), relleno: claro.length - fin - 1,
    sal: b64u(sal), efimera: b64u(publicaServidor) };
}
function comprobarVapid(cabecera, audiencia) {
  const m = /^vapid t=([^,]+), k=([A-Za-z0-9_-]+)$/.exec(cabecera || '');
  if (!m) return { ok: false, k: null };
  const [h, d, f] = m[1].split('.');
  const k = Buffer.from(m[2], 'base64url');
  const clave = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(k.subarray(1, 33)), y: b64u(k.subarray(33)) } });
  const datos = JSON.parse(Buffer.from(d, 'base64url'));
  const ahora = Math.floor(relojPush() / 1000);
  return { k: m[2], ok: crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: clave, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url'))
    && datos.aud === audiencia && datos.exp > ahora + 11 * 3600 && datos.exp <= ahora + 12 * 3600
    && datos.sub === 'mailto:rwadares@gmail.com' };
}
const servicio = http.createServer(async (req, res) => {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  const cuerpo = Buffer.concat(trozos);
  const [, , host, ...resto] = req.url.split('/');
  const endpoint = `https://${host}/${resto.join('/')}`;
  if (resto[0] === 'cuelga') return; // no responde nunca: para el plazo
  const n = navegadores.get(endpoint);
  let claro = null;
  try { claro = n ? descifrar(cuerpo, n) : null; } catch { claro = null; }
  const firma = comprobarVapid(req.headers.authorization, `https://${host}`);
  recibidos.push({ endpoint, metodo: req.method, cabeceras: req.headers, claro, vapid: firma.ok, k: firma.k, largo: cuerpo.length });
  const estado = respuestas.get(endpoint) ?? 201;
  res.writeHead(estado, estado >= 300 && estado < 400 ? { Location: `http://${req.headers.host}/push/${host}/otra` } : {});
  res.end(estado === 201 ? '' : 'detalle del servicio');
});
await new Promise(r => servicio.listen(0, '127.0.0.1', r));
const LOCAL = `http://127.0.0.1:${servicio.address().port}`;
test.after(() => new Promise(r => { servicio.closeAllConnections(); servicio.close(() => r()); }));

const HOSTS_PUSH = new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', 'wns2-par02p.notify.windows.com']);
// Lo que sale hacia un servicio de push va al falso, con las mismas cabeceras y
// el mismo cuerpo. «sin-respuesta» imita un fallo de red.
function haciaElFalso(url, init, salidas) {
  const u = new URL(url);
  salidas.push({ url: u.href, init });
  if (u.pathname.startsWith('/sin-respuesta')) return Promise.reject(new TypeError('fetch failed'));
  return fetchReal(`${LOCAL}/push/${u.hostname}${u.pathname}${u.search}`, init);
}

/* ------------------------------------------------ servidor bajo prueba */

// clave(): lo que responde Supabase a la RPC (por defecto, la pública de RWAdar).
function entorno({ clave = () => Response.json(VAPID.publica), plazoWebpushMs = 2000 } = {}) {
  const reloj = { desfase: 0 };
  const ahora = () => Date.now() + reloj.desfase;
  relojPush = ahora;
  const supabase = []; const salidas = []; const otras = [];
  const server = crearAccesoServidor({ ahora, plazoWebpushMs, fetchImpl: async (url, init = {}) => {
    const u = new URL(url);
    if (u.origin === SUPABASE) {
      supabase.push({ ruta: u.pathname + u.search, metodo: init.method, cabeceras: init.headers, cuerpo: init.body });
      if (u.pathname === RPC) return clave();
      if (u.pathname === '/auth/v1/user') return Response.json({ id: '11111111-1111-4111-8111-111111111111', email: 'cuenta@ejemplo.test',
        email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false });
      if (u.pathname === '/rest/v1/mi_perfil') return Response.json([{ id: '11111111-1111-4111-8111-111111111111' }]);
      return Response.json('ok');
    }
    if (HOSTS_PUSH.has(u.hostname)) return haciaElFalso(url, init, salidas);
    otras.push(u.href);
    throw new Error('no debería salir a ' + u.origin);
  } });
  async function pedir({ cuerpo, privada = VAPID.privada, publica = VAPID.publica, metodo = 'POST', tipo = 'application/json',
    ruta = '/api/interno/webpush', cabeceras = {} } = {}) {
    const headers = { 'content-type': tipo, ...cabeceras };
    if (privada !== null) headers['x-rwadar-vapid-privada'] = privada;
    if (publica !== null) headers['x-rwadar-vapid-publica'] = publica;
    const conCuerpo = !['GET', 'HEAD'].includes(metodo);
    const body = conCuerpo ? (typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo ?? {})) : undefined;
    const r = await server.atender({ env: ENV, request: new Request(ORIGEN + ruta, { method: metodo, headers, body }),
      next: async () => new Response('ARCHIVO') });
    const texto = await r.text();
    return { estado: r.status, cabeceras: r.headers, texto, json: (() => { try { return JSON.parse(texto); } catch { return null; } })() };
  }
  return { pedir, supabase, salidas, otras, reloj };
}
const envio = (endpoint, carga = CARGA) => ({ ...navegador(endpoint), carga });
let numero = 0;
const nuevo = (host = 'fcm.googleapis.com', ruta = 'fcm/send/') => `https://${host}/${ruta}${++numero}-${crypto.randomBytes(4).toString('hex')}`;

async function esperarRechazo(e, peticion, estado, error, codigo = -1) {
  const r = await e.pedir(peticion);
  assert.equal(r.estado, estado, JSON.stringify(r.json));
  assert.deepEqual(r.json, { codigo, error });
  assert.equal(r.cabeceras.get('cache-control'), 'no-store');
  return r;
}

/* ================================================ cifrado y firma */

test('el cifrado con WebCrypto da exactamente el mensaje del RFC 8291 (apéndice A)', async () => {
  const { cifrar } = crearWebpushServidor({});
  const desdeRfc = t => new Uint8Array(Buffer.from(t, 'base64url'));
  const cuerpo = Buffer.from(await cifrar({
    carga: new TextEncoder().encode('When I grow up, I want to be a watermelon'),
    p256dh: desdeRfc('BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'),
    auth: desdeRfc('BTBZMqHH6r4Tts7J_aSIgg'),
    efimera: { privada: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
      publica: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8' },
    sal: desdeRfc('DGv6ra1nlYgDCS1FRnbzlw'),
  }));
  // Sección 5 y apéndice A: cabecera de 86 octetos (sal, rs = 4096, idlen = 65 y
  // la clave efímera), un solo registro, el texto y el delimitador 0x02.
  assert.equal(b64u(cuerpo), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
  assert.equal(cuerpo.length, 86 + 41 + 1 + 16);
  assert.equal(cuerpo.readUInt32BE(16), 4096);
  assert.equal(cuerpo[20], 65);
  // El navegador del RFC lo descifra con su clave privada (ua_private).
  const ua = crypto.createECDH('prime256v1');
  ua.setPrivateKey(Buffer.from('q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94', 'base64url'));
  const claro = descifrar(cuerpo, { ua, auth: Buffer.from('BTBZMqHH6r4Tts7J_aSIgg', 'base64url') });
  assert.equal(claro.texto, 'When I grow up, I want to be a watermelon');
  assert.equal(claro.relleno, 0);
});

test('fuera de las pruebas, cada envío lleva una sal y una clave efímera nuevas, y el navegador lo descifra', async () => {
  const { cifrar } = crearWebpushServidor({});
  const n = navegador('https://web.push.apple.com/vector-propio');
  const datos = { carga: new TextEncoder().encode(JSON.stringify(CARGA)), p256dh: new Uint8Array(Buffer.from(n.p256dh, 'base64url')),
    auth: new Uint8Array(Buffer.from(n.auth, 'base64url')) };
  const a = descifrar(Buffer.from(await cifrar(datos)), navegadores.get(n.endpoint));
  const b = descifrar(Buffer.from(await cifrar(datos)), navegadores.get(n.endpoint));
  assert.deepEqual(JSON.parse(a.texto), CARGA);
  assert.equal(a.texto, b.texto);
  assert.notEqual(a.sal, b.sal);
  assert.notEqual(a.efimera, b.efimera);
  await assert.rejects(cifrar({ ...datos, carga: new Uint8Array(4096 - 86 - 16) }), /carga_invalida/);
  await assert.rejects(cifrar({ ...datos, p256dh: new Uint8Array(65) }), /p256dh_invalida/);
  await assert.rejects(cifrar({ ...datos, auth: new Uint8Array(15) }), /auth_invalida/);
});

test('la firma VAPID es un JWT ES256 que se verifica con la clave pública (aud, exp a 12 h, sub)', async () => {
  const { firmarVapid, prepararClaves } = crearWebpushServidor({});
  const clave = await prepararClaves(VAPID.privada, VAPID.publica);
  assert.ok(clave);
  const ahora = 1_794_484_800;
  const jwt = await firmarVapid({ audiencia: 'https://web.push.apple.com', clave, ahora });
  const [h, d, f] = jwt.split('.');
  const k = Buffer.from(VAPID.publica, 'base64url');
  const publica = crypto.createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: b64u(k.subarray(1, 33)), y: b64u(k.subarray(33)) } });
  assert.ok(crypto.verify('sha256', Buffer.from(`${h}.${d}`), { key: publica, dsaEncoding: 'ieee-p1363' }, Buffer.from(f, 'base64url')));
  assert.equal(Buffer.from(f, 'base64url').length, 64);
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { typ: 'JWT', alg: 'ES256' });
  assert.deepEqual(JSON.parse(Buffer.from(d, 'base64url')), { aud: 'https://web.push.apple.com', exp: ahora + 12 * 3600, sub: 'mailto:rwadares@gmail.com' });
  // La pareja tiene que casar: con otra pública, una privada imposible o un
  // punto fuera de la curva no hay clave para firmar.
  assert.equal(await prepararClaves(VAPID.privada, OTRA.publica), null);
  assert.equal(await prepararClaves(OTRA.privada, VAPID.publica), null);
  assert.equal(await prepararClaves('A'.repeat(43), VAPID.publica), null);
  assert.equal(await prepararClaves(VAPID.privada, 'B' + 'A'.repeat(86)), null);
  assert.equal(await prepararClaves(VAPID.privada.slice(1), VAPID.publica), null);
  assert.equal(await prepararClaves(undefined, VAPID.publica), null);
});

/* ================================================ de punta a punta */

test('de punta a punta: cifra, firma y entrega; el servicio de push falso descifra exactamente la carga', async () => {
  const e = entorno();
  for (const host of HOSTS_PUSH) {
    const datos = envio(nuevo(host, 'push/'));
    const antes = recibidos.length;
    // Como pg_net: sin Origin ni cookies. Una cookie o un Origin ajeno no cambian nada ni se reenvían.
    const r = await e.pedir({ cuerpo: datos, cabeceras: host === 'web.push.apple.com'
      ? { cookie: '__Host-rwadar-acceso=eyJ.eyJ.firma', origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } : {} });
    assert.equal(r.estado, 200, host);
    assert.equal(r.texto, '{"codigo":201}');
    assert.equal(r.cabeceras.get('cache-control'), 'no-store');
    assert.equal(r.cabeceras.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(r.cabeceras.get('set-cookie'), null);
    assert.equal(recibidos.length, antes + 1, host);
    const llegado = recibidos.at(-1);
    assert.equal(llegado.endpoint, datos.endpoint);
    assert.equal(llegado.metodo, 'POST');
    assert.equal(llegado.cabeceras.ttl, '86400');
    assert.equal(llegado.cabeceras.urgency, 'high');
    assert.equal(llegado.cabeceras['content-encoding'], 'aes128gcm');
    assert.equal(llegado.cabeceras['content-type'], 'application/octet-stream');
    assert.equal(llegado.cabeceras.cookie, undefined);
    assert.equal(llegado.cabeceras['x-rwadar-vapid-privada'], undefined);
    assert.ok(llegado.vapid, 'firma VAPID válida para https://' + host);
    assert.equal(llegado.k, VAPID.publica);
    assert.deepEqual(JSON.parse(llegado.claro.texto), CARGA);
    assert.equal(llegado.claro.rs, 4096);
    assert.equal(llegado.claro.relleno, 0);
    assert.equal(llegado.largo, 86 + Buffer.byteLength(JSON.stringify(CARGA)) + 1 + 16);
    assert.equal(e.salidas.at(-1).init.redirect, 'manual');
  }
  // Una sola pregunta a Supabase para los cuatro, con la clave publicable y por POST.
  assert.deepEqual(e.supabase.map(s => [s.ruta, s.metodo, s.cabeceras.apikey, s.cuerpo]), [[RPC, 'POST', 'sb_publishable_prueba', '{}']]);
  assert.deepEqual(e.otras, []);
});

test('devuelve el código del servicio de push: 2xx, 404, 410, 429, 5xx, 413; una redirección sin seguirla; 0 sin respuesta o fuera de plazo', async () => {
  const e = entorno({ plazoWebpushMs: 300 });
  for (const codigo of [201, 202, 404, 410, 429, 500, 503, 413, 400, 403]) {
    const datos = envio(nuevo('updates.push.services.mozilla.com', 'wpush/v2/'));
    respuestas.set(datos.endpoint, codigo);
    const r = await e.pedir({ cuerpo: datos });
    assert.equal(r.estado, 200);
    assert.deepEqual(r.json, { codigo }, String(codigo));
    // El cuerpo del servicio no se devuelve.
    assert.equal(r.texto.includes('detalle'), false);
  }
  const redirige = envio(nuevo('web.push.apple.com', '3/device/'));
  respuestas.set(redirige.endpoint, 301);
  const antes = recibidos.length;
  assert.deepEqual((await e.pedir({ cuerpo: redirige })).json, { codigo: 301 });
  assert.equal(recibidos.length, antes + 1, 'la redirección no se sigue');
  assert.deepEqual((await e.pedir({ cuerpo: envio('https://fcm.googleapis.com/sin-respuesta/1') })).json, { codigo: 0 });
  const t0 = Date.now();
  assert.deepEqual((await e.pedir({ cuerpo: envio('https://fcm.googleapis.com/cuelga/1') })).json, { codigo: 0 });
  assert.ok(Date.now() - t0 < 5000, 'el plazo corta la espera');
});

test('una carga de tamaño máximo cabe en un registro; un byte más ya no', async () => {
  const e = entorno();
  const base = { v: 1, titulo: '€'.repeat(200), texto: '€'.repeat(1000), url: 'https://rwadar.pages.dev/?avisos=1', etiqueta: 'rwadar-prueba' };
  const largo = Buffer.byteLength(JSON.stringify(base));
  const relleno = 'https://rwadar.pages.dev/?avisos=1#' + 'a'.repeat(4096 - 86 - 16 - 1 - largo + base.url.length - 'https://rwadar.pages.dev/?avisos=1#'.length);
  const justa = { ...base, url: relleno };
  assert.equal(Buffer.byteLength(JSON.stringify(justa)), 4096 - 86 - 16 - 1);
  const datos = envio(nuevo(), justa);
  const r = await e.pedir({ cuerpo: datos });
  assert.deepEqual(r.json, { codigo: 201 });
  assert.deepEqual(JSON.parse(recibidos.at(-1).claro.texto), justa);
  assert.equal(recibidos.at(-1).largo, 4096);
  const salidas = e.salidas.length;
  await esperarRechazo(e, { cuerpo: envio(nuevo(), { ...justa, url: justa.url + 'a' }) }, 400, 'entrada_invalida');
  assert.equal(e.salidas.length, salidas);
});

test('la regla de hosts es letra por letra la de la base (migración 32) y la del remitente de GitHub; el módulo no escribe en consola', async () => {
  const fs = await import('node:fs');
  const fuente = fs.readFileSync(path.join(AQUI, 'webpush-servidor.mjs'), 'utf8');
  const js = /const ENDPOINT_VALIDO = \/(.+)\/;\n/.exec(fuente)[1].replace(/\\\//g, '/');
  const sql = fs.readFileSync(path.join(AQUI, '..', 'rwadar-app', 'db', '32_notificaciones.sql'), 'utf8');
  const enBase = [...sql.matchAll(/endpoint !?~\s*'(\^https:\/\/[^']+)'/g)].map(m => m[1]);
  assert.equal(enBase.length, 2, 'la tabla y registrar_aviso_webpush');
  for (const regla of enBase) assert.equal(js, regla);
  // El remitente de GitHub queda solo para la prueba de administración; si se retira, no hay nada que comparar.
  const rutaRemitente = path.join(AQUI, '..', 'rwadar-app', 'enviar-webpush.mjs');
  if (fs.existsSync(rutaRemitente)) {
    assert.equal(/export const ENDPOINT_VALIDO = \/(.+)\/;\n/.exec(fs.readFileSync(rutaRemitente, 'utf8'))[1].replace(/\\\//g, '/'), js);
  }
  assert.equal(/\bconsole\b/.test(fuente), false);
});

/* ================================================ rechazos */

test('solo POST: otros métodos dan 405 sin preguntar a Supabase ni salir a la red', async () => {
  const e = entorno();
  for (const metodo of ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const r = await e.pedir({ metodo, cuerpo: envio(nuevo()) });
    assert.equal(r.estado, 405, metodo);
    assert.equal(r.cabeceras.get('allow'), 'POST');
    assert.equal(r.cabeceras.get('cache-control'), 'no-store');
    if (metodo !== 'HEAD') assert.deepEqual(r.json, { codigo: -1, error: 'metodo_no_permitido' });
  }
  assert.equal(e.supabase.length, 0);
  assert.equal(e.salidas.length, 0);
});

test('solo los servicios de push del contrato, por https y sin puerto ni usuario (400 y -1, sin salir)', async () => {
  const e = entorno();
  const ajenos = [
    'http://fcm.googleapis.com/fcm/send/x', 'https://fcm.googleapis.com.evil.example/fcm/send/x',
    'https://evil.example/https://fcm.googleapis.com/', 'https://fcm.googleapis.com:8443/fcm/send/x',
    'https://fcm.googleapis.com:443/fcm/send/x', 'https://user@fcm.googleapis.com/fcm/send/x',
    'https://FCM.googleapis.com/fcm/send/x', 'https://fcm.googleapis.com./fcm/send/x', 'https://a.b.notify.windows.com/w/x',
    'https://notify.windows.com/w/x', 'https://-a.notify.windows.com/w/x', 'https://web.push.apple.com/', 'https://web.push.apple.com',
    'https://web.push.apple.com/x#y', 'https://web.push.apple.com/x y', 'https://web.push.apple.com/x\n',
    'https://web.push.apple.com\\@evil.example/x', 'https://127.0.0.1/x', 'https://rwadar.pages.dev/x', 'https://push.example/x',
    'https://web.push.apple.com/' + 'a'.repeat(2048), 'wss://web.push.apple.com/x', '//web.push.apple.com/x',
  ];
  for (const endpoint of ajenos) await esperarRechazo(e, { cuerpo: { ...envio('https://web.push.apple.com/ok'), endpoint } }, 400, 'entrada_invalida');
  assert.equal(e.salidas.length, 0);
  assert.deepEqual(e.otras, []);
});

test('rechaza cargas ajenas, claves del navegador sin forma y entradas de más o de menos (400 y -1, sin salir)', async () => {
  const e = entorno();
  const bien = () => envio(nuevo());
  const cargas = [
    { url: 'https://evil.example/' }, { url: 'https://rwadar.pages.dev.evil.example/' }, { url: 'http://rwadar.pages.dev/' },
    { url: 'https://rwadar.pages.dev@evil.example/' }, { url: 'https://rwadar.pages.dev' }, { url: 'javascript:alert(1)//https://rwadar.pages.dev/' },
    { url: 'https://rwadar.pages.dev/\\evil.example' }, { url: 'https://rwadar.pages.dev/ x' }, { url: 'https://rwadar.pages.dev:8443/' },
    { url: 'https://rwadar.pages.dev/' + 'a'.repeat(600) }, { url: 7 },
    { v: 2 }, { v: '1' }, { titulo: '' }, { texto: '' }, { titulo: 'x'.repeat(201) }, { texto: 'x'.repeat(1001) }, { titulo: null },
    { etiqueta: 'otra-1' }, { etiqueta: 'rwadar-' }, { etiqueta: 'rwadar-<b>' }, { icono: 'https://evil.example/i.png' },
  ];
  for (const cambio of cargas) await esperarRechazo(e, { cuerpo: { ...bien(), carga: { ...CARGA, ...cambio } } }, 400, 'entrada_invalida');
  for (const quitar of ['v', 'titulo', 'texto', 'url', 'etiqueta']) {
    const carga = { ...CARGA }; delete carga[quitar];
    await esperarRechazo(e, { cuerpo: { ...bien(), carga } }, 400, 'entrada_invalida');
  }
  for (const carga of [null, [], 'texto', JSON.stringify(CARGA)]) await esperarRechazo(e, { cuerpo: { ...bien(), carga } }, 400, 'entrada_invalida');
  const sinCurva = 'B' + 'A'.repeat(86);
  for (const cambio of [{ p256dh: sinCurva }, { p256dh: bien().p256dh.slice(1) }, { p256dh: bien().p256dh + '=' },
    { p256dh: bien().p256dh.replace(/^B/, 'A') }, { auth: bien().auth.slice(1) }, { auth: bien().auth + '==' }, { auth: 'A'.repeat(21) + 'B' },
    { auth: 7 }, { p256dh: null }]) {
    await esperarRechazo(e, { cuerpo: { ...bien(), ...cambio } }, 400, 'entrada_invalida');
  }
  const completo = bien();
  for (const [nombre, cuerpo] of [['id de más', { ...completo, id: 'e12' }], ['sin auth', { endpoint: completo.endpoint, p256dh: completo.p256dh, carga: CARGA }],
    ['lista', [completo]], ['no es JSON', '{"endpoint":'], ['vacío', ''], ['de más de 16 KiB', { ...completo, relleno: 'x'.repeat(17 * 1024) }]]) {
    await esperarRechazo(e, { cuerpo }, 400, 'entrada_invalida', -1).catch(error => { error.message = nombre + ': ' + error.message; throw error; });
  }
  await esperarRechazo(e, { cuerpo: completo, tipo: 'text/plain' }, 400, 'entrada_invalida');
  await esperarRechazo(e, { cuerpo: completo, ruta: '/api/interno/webpush?id=1' }, 400, 'entrada_invalida');
  assert.equal(e.salidas.length, 0);
});

test('sin la clave privada de RWAdar no sale nada: pareja que no casa o pública ajena (403 y -1)', async () => {
  const e = entorno();
  const datos = envio(nuevo());
  for (const [privada, publica] of [[null, null], [VAPID.privada, null], [null, VAPID.publica], ['', ''],
    [VAPID.privada.slice(1), VAPID.publica], [VAPID.privada + 'A', VAPID.publica], [VAPID.privada, VAPID.publica.slice(1)],
    [VAPID.privada.replace(/.$/, c => (c === 'B' ? 'C' : 'B')), VAPID.publica]]) {
    await esperarRechazo(e, { cuerpo: datos, privada, publica }, 403, 'claves_no_validas');
  }
  // Ninguna de estas preguntó a Supabase: la forma ya no valía.
  assert.equal(e.supabase.length, 0);
  // Una pareja válida que no es la de RWAdar; la pública de RWAdar con otra
  // privada; una privada imposible (d = 0).
  await esperarRechazo(e, { cuerpo: datos, privada: OTRA.privada, publica: OTRA.publica }, 403, 'claves_no_validas');
  await esperarRechazo(e, { cuerpo: datos, privada: OTRA.privada, publica: VAPID.publica }, 403, 'claves_no_validas');
  await esperarRechazo(e, { cuerpo: datos, privada: 'A'.repeat(43), publica: VAPID.publica }, 403, 'claves_no_validas');
  assert.equal(e.salidas.length, 0);
  // Y la buena sí.
  assert.deepEqual((await e.pedir({ cuerpo: datos })).json, { codigo: 201 });
  // Si la base aún no tiene clave (null), nadie puede enviar.
  const sinClave = entorno({ clave: () => Response.json(null) });
  await esperarRechazo(sinClave, { cuerpo: envio(nuevo()) }, 403, 'claves_no_validas');
  assert.equal(sinClave.salidas.length, 0);
});

test('si no se puede comprobar la clave con Supabase, 503 sin enviar; no se vuelve a preguntar en 30 segundos', async () => {
  let modo = 'red';
  const e = entorno({ clave: () => {
    if (modo === 'red') throw new TypeError('fetch failed');
    if (modo === 'sin-funcion') return Response.json({ code: 'PGRST202' }, { status: 404 });
    if (modo === '500') return new Response('error', { status: 500 });
    if (modo === 'redireccion') return new Response(null, { status: 302, headers: { Location: 'https://evil.example/' } });
    if (modo === 'basura') return Response.json('hola');
    if (modo === 'numero') return Response.json(42);
    if (modo === 'enorme') return Response.json('B'.repeat(4096));
    return Response.json(VAPID.publica);
  } });
  const datos = envio(nuevo());
  const r = await esperarRechazo(e, { cuerpo: datos }, 503, 'servicio_no_disponible', 0);
  assert.equal(r.cabeceras.get('retry-after'), '30');
  assert.equal(e.supabase.length, 1);
  await esperarRechazo(e, { cuerpo: datos }, 503, 'servicio_no_disponible', 0);
  assert.equal(e.supabase.length, 1, 'durante 30 segundos no se vuelve a preguntar');
  for (const [i, m] of ['sin-funcion', '500', 'redireccion', 'basura', 'numero', 'enorme'].entries()) {
    modo = m; e.reloj.desfase += 31000;
    await esperarRechazo(e, { cuerpo: datos }, 503, 'servicio_no_disponible', 0);
    assert.equal(e.supabase.length, i + 2, m);
  }
  assert.equal(e.salidas.length, 0);
  modo = 'bien'; e.reloj.desfase += 31000;
  assert.deepEqual((await e.pedir({ cuerpo: datos })).json, { codigo: 201 });
  // Sin la configuración pública de Supabase, tampoco.
  const sinEnv = crearAccesoServidor({ fetchImpl: async () => { throw new Error('no debería salir'); } });
  const s = await sinEnv.atender({ env: {}, request: new Request(ORIGEN + '/api/interno/webpush', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-rwadar-vapid-privada': VAPID.privada, 'x-rwadar-vapid-publica': VAPID.publica },
    body: JSON.stringify(datos) }) });
  assert.equal(s.status, 503);
  assert.deepEqual(await s.json(), { codigo: 0, error: 'servicio_no_disponible' });
});

test('la clave de RWAdar se guarda 5 minutos, una sola pregunta para muchas a la vez, y se vuelve a preguntar si cambia', async () => {
  let actual = VAPID.publica;
  const e = entorno({ clave: () => new Promise(r => setTimeout(() => r(Response.json(actual)), 20)) });
  const lote = await Promise.all(Array.from({ length: 12 }, () => e.pedir({ cuerpo: envio(nuevo()) })));
  assert.deepEqual(lote.map(r => r.json.codigo), Array(12).fill(201));
  assert.equal(e.supabase.length, 1, 'doce a la vez con la memoria vacía: una pregunta');
  e.reloj.desfase += 4 * 60000;
  assert.deepEqual((await e.pedir({ cuerpo: envio(nuevo()) })).json, { codigo: 201 });
  assert.equal(e.supabase.length, 1);
  e.reloj.desfase += 61000;
  assert.deepEqual((await e.pedir({ cuerpo: envio(nuevo()) })).json, { codigo: 201 });
  assert.equal(e.supabase.length, 2, 'pasados 5 minutos se vuelve a preguntar');
  // Clave nueva (crear-vapid otra vez): durante el primer minuto, la guardada manda.
  const NUEVA = parVapid(); actual = NUEVA.publica;
  await esperarRechazo(e, { cuerpo: envio(nuevo()), privada: NUEVA.privada, publica: NUEVA.publica }, 403, 'claves_no_validas');
  assert.equal(e.supabase.length, 2);
  e.reloj.desfase += 61000;
  assert.deepEqual((await e.pedir({ cuerpo: envio(nuevo()), privada: NUEVA.privada, publica: NUEVA.publica })).json, { codigo: 201 });
  assert.equal(recibidos.at(-1).k, NUEVA.publica);
  assert.equal(e.supabase.length, 3);
  // Y la vieja ya no sirve (sin volver a preguntar: la guardada es nueva).
  await esperarRechazo(e, { cuerpo: envio(nuevo()) }, 403, 'claves_no_validas');
  assert.equal(e.supabase.length, 3);
});

test('límite de peticiones por visitante con el limitador del servidor (429 y 0)', async () => {
  const e = entorno();
  const ip = { 'cf-connecting-ip': '203.0.113.9' };
  // Con claves sin forma: barato y sin red, pero cuenta igual.
  for (let i = 0; i < 2000; i++) {
    const r = await e.pedir({ cuerpo: '{}', privada: 'x', cabeceras: ip });
    assert.equal(r.estado, 403);
  }
  const r = await esperarRechazo(e, { cuerpo: envio(nuevo()), cabeceras: ip }, 429, 'intentos_excedidos', 0);
  assert.match(r.cabeceras.get('retry-after'), /^[1-9][0-9]*$/);
  assert.equal(e.salidas.length, 0);
  // Otro visitante sigue; pasada la ventana de 10 minutos, también el primero.
  assert.deepEqual((await e.pedir({ cuerpo: envio(nuevo()), cabeceras: { 'cf-connecting-ip': '203.0.113.10' } })).json, { codigo: 201 });
  e.reloj.desfase += 601000;
  assert.deepEqual((await e.pedir({ cuerpo: envio(nuevo()), cabeceras: ip })).json, { codigo: 201 });
});

test('nunca escribe en los registros ni devuelve endpoints, claves ni cargas', async () => {
  const escritos = [];
  const originales = {};
  for (const nivel of ['log', 'info', 'warn', 'error', 'debug', 'trace']) {
    originales[nivel] = console[nivel];
    console[nivel] = (...args) => escritos.push([nivel, args]);
  }
  const textos = [];
  try {
    let caida = false;
    const e = entorno({ clave: () => { if (caida) throw new Error('caída ' + VAPID.privada); return Response.json(VAPID.publica); }, plazoWebpushMs: 200 });
    const datos = envio(nuevo());
    respuestas.set(datos.endpoint, 410);
    for (const peticion of [{ cuerpo: datos }, { cuerpo: { ...datos, carga: { ...CARGA, url: 'https://evil.example/' } } },
      { cuerpo: { ...datos, endpoint: 'https://evil.example/' + datos.auth } }, { cuerpo: datos, privada: OTRA.privada },
      { cuerpo: envio('https://fcm.googleapis.com/sin-respuesta/2') }, { cuerpo: envio('https://fcm.googleapis.com/cuelga/2') },
      { cuerpo: { ...datos, p256dh: 'B' + 'A'.repeat(86) } }, { metodo: 'GET' }]) {
      textos.push((await e.pedir(peticion)).texto);
    }
    caida = true; e.reloj.desfase += 6 * 60000;
    textos.push((await e.pedir({ cuerpo: datos })).texto);
  } finally { Object.assign(console, originales); }
  assert.deepEqual(escritos, []);
  const secretos = [VAPID.privada, VAPID.publica, OTRA.privada, 'fcm.googleapis.com', 'evil.example', 'Novedad', 'rwadar-7', 'avisos=1', 'detalle'];
  for (const texto of textos) {
    for (const s of secretos) assert.equal(texto.includes(s), false, s);
    assert.match(texto, /^\{"codigo":-?\d+(?:,"error":"[a-z_]+")?\}$/);
  }
});

/* ================================================ en el worker y el resto del servidor */

test('la ruta llega al _worker.js compilado, con las cabeceras de seguridad, y el arnés local sin la función da 503', async () => {
  const codigo = construirWorker();
  assert.equal(codigo.includes("from './webpush-servidor.mjs'"), false);
  assert.ok(codigo.includes('function crearWebpushServidor('));
  const salidas = [];
  let conFuncion = true;
  const supabase = [];
  const worker = await cargarWorker({ raiz: AQUI, fetchSupabase: crearAuthSimulado({ registro: supabase, responder: (url, init) => {
    if (url.origin === SUPABASE) return url.pathname === RPC && conFuncion ? Response.json(VAPID.publica) : null;
    if (HOSTS_PUSH.has(url.hostname)) return haciaElFalso(url.href, init, salidas);
    return null;
  } }) });
  relojPush = () => Date.now();
  const assets = { ASSETS: { fetch: async () => new Response('ARCHIVO') } };
  const pedir = (init, ruta = '/api/interno/webpush') => worker.fetch(new Request(ORIGEN + ruta, init), assets, { waitUntil() {} });
  const datos = envio(nuevo('web.push.apple.com', '3/device/'));
  const cabeceras = { 'content-type': 'application/json', 'x-rwadar-vapid-privada': VAPID.privada, 'x-rwadar-vapid-publica': VAPID.publica };
  const r = await pedir({ method: 'POST', headers: cabeceras, body: JSON.stringify(datos) });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { codigo: 201 });
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual(JSON.parse(recibidos.at(-1).claro.texto), CARGA);
  assert.ok(recibidos.at(-1).vapid);
  assert.deepEqual(supabase.map(s => [s.ruta, s.metodo]), [[RPC, 'POST']]);
  const g = await pedir({ method: 'GET' });
  assert.equal(g.status, 405);
  assert.deepEqual(await g.json(), { codigo: -1, error: 'metodo_no_permitido' });
  // El arnés local tal cual (sin la función en Supabase) responde 503 y no envía.
  const otro = await cargarWorker({ raiz: AQUI, fetchSupabase: crearAuthSimulado({ responder: (url, init) =>
    (HOSTS_PUSH.has(url.hostname) ? haciaElFalso(url.href, init, salidas) : null) }) });
  const n = salidas.length;
  const s = await otro.fetch(new Request(ORIGEN + '/api/interno/webpush', { method: 'POST', headers: cabeceras, body: JSON.stringify(envio(nuevo())) }),
    assets, { waitUntil() {} });
  assert.equal(s.status, 503);
  assert.deepEqual(await s.json(), { codigo: 0, error: 'servicio_no_disponible' });
  assert.equal(salidas.length, n);
  // Y el resto de /api/ sigue igual en el worker: otro POST sin Origin a la
  // pasarela de datos se rechaza aunque lleve las cabeceras VAPID.
  const datosSinOrigen = await pedir({ method: 'POST', headers: cabeceras, body: JSON.stringify({ ruta: '/rpc/clave_publica_webpush' }) }, '/api/acceso/datos');
  assert.equal(datosSinOrigen.status, 403);
  assert.deepEqual(await datosSinOrigen.json(), { error: 'origen_no_permitido' });
  conFuncion = false;
});

test('la pasarela de datos y el resto de /api siguen igual', async () => {
  const e = entorno();
  // Una sesión de mentira con forma de JWT (el Auth simulado la da por buena).
  const sesion = ['cabecera', 'datos', 'firma-de-prueba'].join('.');
  const datos = ruta => e.pedir({ ruta: '/api/acceso/datos', cuerpo: { ruta, metodo: 'POST', cuerpo: {} }, privada: null, publica: null,
    cabeceras: { origin: ORIGEN, cookie: '__Host-rwadar-acceso=' + sesion } });
  // La RPC anónima de la clave no entra por la pasarela; las de la web, sí.
  for (const ruta of ['/rpc/clave_publica_webpush_anon', '/rpc/webpush_pendientes', '/rpc/webpush_prueba', '/rpc/webpush_resultado']) {
    const r = await datos(ruta);
    assert.equal(r.estado, 400, ruta);
    assert.deepEqual(r.json, { error: 'solicitud_invalida' });
  }
  for (const ruta of ['/rpc/clave_publica_webpush', '/rpc/registrar_aviso_webpush', '/rpc/mi_aviso_webpush_registrado']) {
    const r = await datos(ruta);
    assert.equal(r.estado, 200, ruta);
  }
  assert.equal(e.supabase.some(s => s.ruta === RPC), false);
  // Otras rutas de /api/interno/ no existen.
  const p = await e.pedir({ ruta: '/api/interno/otra', cuerpo: envio(nuevo()) });
  assert.equal(p.estado, 405);
  assert.deepEqual(p.json, { error: 'metodo_no_permitido' });
  const g = await e.pedir({ ruta: '/api/interno/otra', metodo: 'GET' });
  assert.equal(g.estado, 404);
  assert.deepEqual(g.json, { error: 'ruta_no_permitida' });
  // /api/acceso/* sigue exigiendo el Origin propio.
  const sinOrigen = await e.pedir({ ruta: '/api/acceso/entrar', cuerpo: { correo: 'a@b.test', clave: 'x' } });
  assert.equal(sinOrigen.estado, 403);
  assert.equal(e.salidas.length, 0);
});
