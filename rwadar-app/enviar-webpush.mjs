/* =====================================================================
   RWAdar · remitente de las notificaciones web (Web Push)
   ---------------------------------------------------------------------
   Lo usan el flujo «Notificaciones web» (.github/workflows/notificaciones-web.yml)
   y la acción crear-vapid de «Avisos a registrados (base)». Contrato: la
   migración 32 (db/32_notificaciones.sql). Solo Node: node:crypto y fetch,
   sin npm.

   · Cifrado RFC 8291 (aes128gcm): ECDH P-256 con una clave de un solo uso,
     HKDF-SHA-256, un solo registro y el relleno mínimo (el delimitador 0x02).
   · Firma RFC 8292 (VAPID): JWT ES256 (firma r||s, ieee-p1363) con aud = el
     origen del endpoint, exp a 12 horas y sub = mailto:rwadares@gmail.com.
     Cabecera «Authorization: vapid t=<jwt>, k=<clave pública>».
   · Cabeceras: TTL 86400 (un día), Urgency high, Content-Encoding aes128gcm.
     Sin seguir redirecciones.

   Uso:
     node enviar-webpush.mjs generar-claves
         Escribe una línea «<privada> <pública>» en base64url (la privada es
         el escalar d de 32 octetos; la pública, el punto de 65 octetos sin
         comprimir). La captura el flujo sin imprimirla.

     RWADAR_VAPID_PRIVADA=… RWADAR_VAPID_PUBLICA=… \
       node enviar-webpush.mjs [--entrada lote.json] [--salida resultados.json]
         Lee los envíos (lo que devuelven rwadar_novedades.webpush_pendientes
         o webpush_prueba: {"envios":[{id, endpoint, p256dh, auth, carga}]})
         de --entrada o de la entrada estándar y escribe
         [{"id":"e12","codigo":201}, …] en --salida o en la salida estándar.
         codigo = estado HTTP del servicio de push; 0 = sin respuesta (red o
         tiempo); -1 = no se pudo preparar (envío o claves sin forma válida).
         Comprueba antes que la clave privada corresponde a la pública.

   Nunca escribe endpoints, claves ni cargas: en la salida de error, solo un
   resumen con cuentas.
   ===================================================================== */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SUJETO = 'mailto:rwadares@gmail.com';
export const TTL = 86400;
export const TAMANO_REGISTRO = 4096;
// 4096 del registro menos la cabecera (86), la etiqueta de AES-GCM (16) y el
// delimitador (1).
export const CARGA_MAXIMA = TAMANO_REGISTRO - 86 - 16 - 1;
const SIMULTANEOS = 6;
const ESPERA_MS = 15000;

// La misma regla que la base (suscripcion_web_endpoint_valido): solo https y
// solo los servicios de push conocidos, sin puerto ni usuario.
export const ENDPOINT_VALIDO = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)\/[A-Za-z0-9._~:/?=&%+-]+$/;
const PUNTO_P256 = /^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$/;
const ESCALAR_P256 = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const SECRETO_AUTH = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const ID_ENVIO = /^[ep][1-9][0-9]{0,17}$/;

const b64u = (b) => Buffer.from(b).toString('base64url');
const deB64u = (t) => Buffer.from(t, 'base64url');
const hkdf = (sal, ikm, info, largo) => Buffer.from(crypto.hkdfSync('sha256', ikm, sal, info, largo));

/* ---------------------------------------------------------------- claves */

// Par nuevo P-256. La exportación JWK da d, x e y con su largo completo.
export function generarClaves() {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = privateKey.export({ format: 'jwk' });
  const privada = jwk.d;
  const publica = b64u(Buffer.concat([Buffer.from([4]), deB64u(jwk.x), deB64u(jwk.y)]));
  prepararClaves(privada, publica);
  return { privada, publica };
}

// Comprueba la forma de las dos claves y que la privada corresponde a la
// pública guardada. Los errores nunca llevan los valores.
export function prepararClaves(privada, publica) {
  if (typeof privada !== 'string' || !ESCALAR_P256.test(privada)) {
    throw new Error('falta RWADAR_VAPID_PRIVADA o no tiene forma de clave P-256 (32 octetos en base64url)');
  }
  if (typeof publica !== 'string' || !PUNTO_P256.test(publica)) {
    throw new Error('falta RWADAR_VAPID_PUBLICA o no es un punto P-256 sin comprimir en base64url');
  }
  const d = deB64u(privada);
  const punto = deB64u(publica);
  let derivada;
  try {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(d);
    derivada = ecdh.getPublicKey();
  } catch {
    throw new Error('RWADAR_VAPID_PRIVADA no es una clave P-256 válida');
  }
  if (!derivada.equals(punto)) throw new Error('la clave privada VAPID no corresponde a la pública guardada');
  const clave = crypto.createPrivateKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'P-256', d: privada, x: b64u(punto.subarray(1, 33)), y: b64u(punto.subarray(33)) },
  });
  return { clave, publica };
}

/* ---------------------------------------------------------------- VAPID (RFC 8292) */

export function firmarVapid({ audiencia, clave, ahora = Math.floor(Date.now() / 1000), sujeto = SUJETO }) {
  const cabecera = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const datos = b64u(JSON.stringify({ aud: audiencia, exp: ahora + 12 * 3600, sub: sujeto }));
  const firma = crypto.sign('sha256', Buffer.from(`${cabecera}.${datos}`), { key: clave, dsaEncoding: 'ieee-p1363' });
  return `${cabecera}.${datos}.${b64u(firma)}`;
}

export const autorizacionVapid = (jwt, publica) => `vapid t=${jwt}, k=${publica}`;

/* ---------------------------------------------------------------- cifrado (RFC 8291) */

// p256dh: punto del navegador (65 octetos); auth: su secreto (16 octetos).
// privadaEfimera y sal solo se pasan en las pruebas (vector del RFC): en un
// envío real son nuevas cada vez.
export function cifrar({ carga, p256dh, auth, privadaEfimera = null, sal = null }) {
  if (!Buffer.isBuffer(p256dh) || p256dh.length !== 65 || p256dh[0] !== 4) throw new Error('p256dh no válida');
  if (!Buffer.isBuffer(auth) || auth.length !== 16) throw new Error('auth no válida');
  if (carga.length > CARGA_MAXIMA) throw new Error('carga demasiado grande');
  const ecdh = crypto.createECDH('prime256v1');
  if (privadaEfimera) ecdh.setPrivateKey(privadaEfimera); else ecdh.generateKeys();
  const publicaServidor = ecdh.getPublicKey();
  const salt = sal || crypto.randomBytes(16);
  const secreto = ecdh.computeSecret(p256dh);
  const infoClave = Buffer.concat([Buffer.from('WebPush: info\0'), p256dh, publicaServidor]);
  const ikm = hkdf(auth, secreto, infoClave, 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const cifrador = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const registro = Buffer.concat([cifrador.update(Buffer.concat([carga, Buffer.from([2])])), cifrador.final(), cifrador.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(TAMANO_REGISTRO);
  return Buffer.concat([salt, rs, Buffer.from([publicaServidor.length]), publicaServidor, registro]);
}

/* ---------------------------------------------------------------- envío */

// Comprueba un envío y lo deja listo para cifrar; null si no tiene forma.
export function prepararEnvio(envio, { cualquierEndpoint = false } = {}) {
  if (!envio || typeof envio !== 'object') return null;
  const { endpoint, p256dh, auth, carga } = envio;
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return null;
  if (!cualquierEndpoint && !ENDPOINT_VALIDO.test(endpoint)) return null;
  if (typeof p256dh !== 'string' || !PUNTO_P256.test(p256dh)) return null;
  if (typeof auth !== 'string' || !SECRETO_AUTH.test(auth)) return null;
  if (!carga || typeof carga !== 'object' || carga.v !== 1
      || !['titulo', 'texto', 'url', 'etiqueta'].every((k) => typeof carga[k] === 'string' && carga[k].length > 0)
      || !/^https:\/\/rwadar\.pages\.dev\//.test(carga.url)) return null;
  const texto = Buffer.from(JSON.stringify(carga), 'utf8');
  if (texto.length > CARGA_MAXIMA) return null;
  let url;
  try { url = new URL(endpoint); } catch { return null; }
  return { url, carga: texto, p256dh: deB64u(p256dh), auth: deB64u(auth) };
}

// Un envío: devuelve el código HTTP, 0 sin respuesta o -1 si no se pudo
// preparar. Nunca lanza.
export async function enviarUno(envio, claves, { fetch = globalThis.fetch, jwts = new Map(), cualquierEndpoint = false } = {}) {
  const listo = prepararEnvio(envio, { cualquierEndpoint });
  if (!listo) return -1;
  let cuerpo;
  try {
    cuerpo = cifrar({ carga: listo.carga, p256dh: listo.p256dh, auth: listo.auth });
  } catch {
    return -1;
  }
  const audiencia = listo.url.origin;
  if (!jwts.has(audiencia)) jwts.set(audiencia, firmarVapid({ audiencia, clave: claves.clave }));
  try {
    const respuesta = await fetch(listo.url.href, {
      method: 'POST',
      redirect: 'manual',
      signal: AbortSignal.timeout(ESPERA_MS),
      headers: {
        Authorization: autorizacionVapid(jwts.get(audiencia), claves.publica),
        TTL: String(TTL),
        Urgency: 'high',
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
      },
      body: cuerpo,
    });
    try { await respuesta.arrayBuffer(); } catch { /* el cuerpo no importa */ }
    return Number.isInteger(respuesta.status) && respuesta.status >= 100 && respuesta.status <= 599 ? respuesta.status : 0;
  } catch {
    return 0;
  }
}

// Todos los envíos, unos pocos a la vez. Un id sin forma o repetido no se
// envía y no sale en los resultados (la base no lo conocería).
export async function enviarTodos(envios, claves, opciones = {}) {
  const vistos = new Set();
  const validos = envios.filter((e) => e && typeof e.id === 'string' && ID_ENVIO.test(e.id) && !vistos.has(e.id) && vistos.add(e.id));
  const resultados = new Array(validos.length);
  const jwts = new Map();
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < validos.length) {
      const i = siguiente++;
      resultados[i] = { id: validos[i].id, codigo: await enviarUno(validos[i], claves, { ...opciones, jwts }) };
    }
  };
  await Promise.all(Array.from({ length: Math.min(SIMULTANEOS, validos.length) }, trabajador));
  return { resultados, descartados: envios.length - validos.length };
}

export function resumir(resultados, descartados = 0) {
  const n = (f) => resultados.filter((r) => f(r.codigo)).length;
  const partes = [
    `${resultados.length} envío(s)`,
    `${n((c) => c >= 200 && c <= 299)} aceptado(s)`,
    `${n((c) => c === 404 || c === 410)} caducado(s) (404/410)`,
    `${n((c) => c === 0 || c === 429 || (c >= 500 && c <= 599))} para reintentar`,
    `${n((c) => c === -1 || (c >= 300 && c <= 499 && c !== 404 && c !== 410 && c !== 429))} fallido(s)`,
  ];
  if (descartados) partes.push(`${descartados} sin id válido (no enviados)`);
  return `Notificaciones web: ${partes.join(', ')}.`;
}

/* ---------------------------------------------------------------- línea de órdenes */

function leerEntrada(ruta, stdin) {
  const texto = ruta && ruta !== '-' ? fs.readFileSync(ruta, 'utf8') : fs.readFileSync(stdin ?? 0, 'utf8');
  let datos;
  try { datos = JSON.parse(texto); } catch { throw new Error('la entrada no es JSON'); }
  const envios = Array.isArray(datos) ? datos : datos?.envios;
  if (!Array.isArray(envios)) throw new Error('la entrada no trae una lista de envíos');
  if (envios.length > 1000) throw new Error('demasiados envíos en una tanda (1000 como mucho)');
  return envios;
}

export async function main(argv = process.argv.slice(2), entorno = process.env,
  { stdout = process.stdout, stderr = process.stderr, stdin = 0, fetch = globalThis.fetch } = {}) {
  try {
    if (argv[0] === 'generar-claves') {
      if (argv.length !== 1) throw new Error('generar-claves no lleva más argumentos');
      const { privada, publica } = generarClaves();
      stdout.write(`${privada} ${publica}\n`);
      return 0;
    }
    const opciones = {};
    for (let i = 0; i < argv.length; i += 2) {
      if (!['--entrada', '--salida'].includes(argv[i]) || typeof argv[i + 1] !== 'string') {
        throw new Error('uso: enviar-webpush.mjs [--entrada lote.json] [--salida resultados.json] | generar-claves');
      }
      opciones[argv[i].slice(2)] = argv[i + 1];
    }
    const claves = prepararClaves(entorno.RWADAR_VAPID_PRIVADA, entorno.RWADAR_VAPID_PUBLICA);
    const envios = leerEntrada(opciones.entrada, stdin);
    const { resultados, descartados } = await enviarTodos(envios, claves, { fetch });
    const json = `${JSON.stringify(resultados)}\n`;
    if (opciones.salida && opciones.salida !== '-') fs.writeFileSync(opciones.salida, json, { mode: 0o600 });
    else stdout.write(json);
    stderr.write(`${resumir(resultados, descartados)}\n`);
    return 0;
  } catch (e) {
    stderr.write(`enviar-webpush: ${e.message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  process.exitCode = await main();
}
