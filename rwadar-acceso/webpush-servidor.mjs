/* =====================================================================
   POST /api/interno/webpush · las notificaciones web, enviadas desde Supabase
   ---------------------------------------------------------------------
   Víctor (12/11/2026): «hazlo en Supabase mientras y ya haremos el cambio».
   Con la cuenta gratuita, GitHub no tiene contrato de encargo y vería las
   suscripciones de todos. Supabase y Cloudflare sí lo tienen. Postgres no
   tiene curvas elípticas, así que la base (pg_net, desde el reloj de
   procesar(), como con Expo) manda aquí cada envío, y este servidor lo
   cifra (RFC 8291), lo firma (VAPID, RFC 8292) y lo entrega al servicio de
   push del navegador. Mismo cifrado y mismas cabeceras que
   rwadar-app/enviar-webpush.mjs, pero con WebCrypto (Cloudflare no tiene
   node:crypto).

   Petición (pg_net; nada más la usa):
     POST /api/interno/webpush, sin parámetros en la dirección
     Content-Type: application/json
     x-rwadar-vapid-privada: d de la clave VAPID (32 octetos, base64url), de Vault
     x-rwadar-vapid-publica: la pública (punto P-256 sin comprimir, base64url)
     {"endpoint": …, "p256dh": …, "auth": …,
      "carga": {"v": 1, "titulo": …, "texto": …, "url": …, "etiqueta": …}}
     Exactamente esas claves, sin más. La carga es la de
     rwadar_novedades.webpush_carga (migración 32).

   Respuesta: siempre JSON con «codigo» y Cache-Control: no-store.
     200 {"codigo":n}  n = estado HTTP del servicio de push (201, 404, 410,
                       429, 5xx…; una redirección no se sigue y da su 3xx);
                       0 = sin respuesta (red o plazo de 10 s).
     200 {"codigo":-1,"error":"entrada_invalida"}   con las claves de RWAdar,
                       el envío no sirve (JSON, claves de más o de menos,
                       parámetros en la dirección, host, tamaños, carga, un
                       p256dh fuera de la curva): no sale y es definitivo.
     403 {"codigo":-1,"error":"claves_no_validas"}  la pareja no casa o la
                       pública no es la de RWAdar: no sale.
     405 {"codigo":-1,"error":"metodo_no_permitido"} (Allow: POST)
     429 {"codigo":0,"error":"intentos_excedidos"}  + Retry-After
     503 {"codigo":0,"error":"servicio_no_disponible"} + Retry-After: 30. No
                       se pudo comprobar con Supabase la clave pública: no sale.
     500 {"codigo":0,"error":"error_interno"}
   La base (webpush_codigo, migración 33) solo lee «codigo» de un 200 y lo
   guarda con webpush_resultado: 2xx enviado; 404/410 borra la suscripción;
   0, 429 y 5xx reintentar; -1 y el resto, fallido. Cualquier otro estado
   (403, 429, 503, 500…) es un fallo de este servidor y la base lo reintenta
   (3 intentos como mucho): tras rotar-vapid, la memoria de la clave da 403
   un minuto como mucho.
   pg_net espera 25 s: aquí, como mucho 8 s para la clave (Supabase) y 10 s
   para el servicio de push.

   Quién puede usarlo: solo quien tenga la clave privada de RWAdar. La
   pública de la cabecera tiene que ser la guardada en la base (RPC
   public.clave_publica_webpush_anon, con la clave publicable; se guarda 5
   minutos en memoria y, si no casa, se vuelve a preguntar como mucho cada
   minuto) y la privada tiene que casar con ella (se firma y se verifica un
   reto). Si Supabase no responde, 503 y no se envía nada.

   Límite (servidor.mjs): las claves se comprueban antes de cobrarlo. Las
   peticiones con la clave de RWAdar gastan el cupo «webpush» y las demás,
   otro aparte («webpushSinClave»): quien salga por la misma dirección que
   Supabase y no tenga la privada no puede agotar el de RWAdar.

   Nunca escribe en los registros ni devuelve endpoints, claves ni cargas. Solo
   sale hacia los servicios de push del contrato (la misma regla que la
   base), por https y sin seguir redirecciones. El limitador es el del resto
   del servidor (servidor.mjs).
   ===================================================================== */
const RUTA = '/api/interno/webpush';
// Cupo aparte para las peticiones sin la clave de RWAdar (GRUPO_LIMITE).
const RUTA_SIN_CLAVE = RUTA + ':sin-clave';
const ORIGEN_WEB = 'https://rwadar.pages.dev';
const RPC_CLAVE = '/rest/v1/rpc/clave_publica_webpush_anon';
const SUJETO = 'mailto:rwadares@gmail.com';
const TTL = 86400;
const TAMANO_REGISTRO = 4096;
// 4096 del registro menos la cabecera (86), la etiqueta de AES-GCM (16) y el
// delimitador (1): un solo registro, como en enviar-webpush.mjs.
const CARGA_MAXIMA = TAMANO_REGISTRO - 86 - 16 - 1;
const CACHE_CLAVE_MS = 5 * 60000;
const REPREGUNTA_MS = 60000;
const ESPERA_FALLO_MS = 30000;

// La misma regla que la base (suscripcion_web_endpoint_valido): solo https y
// solo los servicios de push conocidos, sin puerto ni usuario.
const ENDPOINT_VALIDO = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)\/[A-Za-z0-9._~:/?=&%+-]+$/;
const HOST_VALIDO = /^(?:fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)$/;
const PUNTO_P256 = /^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$/;
const ESCALAR_P256 = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const SECRETO_AUTH = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const ETIQUETA = /^rwadar-[A-Za-z0-9_-]{1,64}$/;
const CLAVES_ENVIO = 'auth,carga,endpoint,p256dh';
const CLAVES_CARGA = 'etiqueta,texto,titulo,url,v';

const subtle = () => globalThis.crypto.subtle;
const utf8 = texto => new TextEncoder().encode(texto);
function unir(...partes) {
  const total = partes.reduce((n, p) => n + p.length, 0);
  const salida = new Uint8Array(total); let en = 0;
  for (const p of partes) { salida.set(p, en); en += p.length; }
  return salida;
}
function b64u(bytes) {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deB64u(texto) {
  const binario = atob(texto.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - texto.length % 4) % 4));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}
async function hkdf(sal, ikm, info, largo) {
  const clave = await subtle().importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await subtle().deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: sal, info }, clave, largo * 8));
}

/* ---------------------------------------------------------------- cifrado (RFC 8291) */

// p256dh: punto del navegador (65 octetos); auth: su secreto (16). efimera
// ({ privada, publica } en base64url) y sal solo los pasan las pruebas (el
// vector del apéndice A): la petición no puede elegirlos y en un envío real
// son nuevos cada vez. Un solo registro de 4096 y el relleno mínimo (0x02).
async function cifrar({ carga, p256dh, auth, efimera = null, sal = null }) {
  if (!(p256dh instanceof Uint8Array) || p256dh.length !== 65 || p256dh[0] !== 4) throw new Error('p256dh_invalida');
  if (!(auth instanceof Uint8Array) || auth.length !== 16) throw new Error('auth_invalida');
  if (!(carga instanceof Uint8Array) || carga.length > CARGA_MAXIMA) throw new Error('carga_invalida');
  const curva = { name: 'ECDH', namedCurve: 'P-256' };
  const delNavegador = await subtle().importKey('raw', p256dh, curva, false, []);
  let privada, publica;
  if (efimera) {
    publica = deB64u(efimera.publica);
    privada = await subtle().importKey('jwk', { kty: 'EC', crv: 'P-256', d: efimera.privada,
      x: b64u(publica.subarray(1, 33)), y: b64u(publica.subarray(33)) }, curva, false, ['deriveBits']);
  } else {
    const par = await subtle().generateKey(curva, false, ['deriveBits']);
    privada = par.privateKey;
    publica = new Uint8Array(await subtle().exportKey('raw', par.publicKey));
  }
  const secreto = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: delNavegador }, privada, 256));
  const salt = sal || globalThis.crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(auth, secreto, unir(utf8('WebPush: info\0'), p256dh, publica), 32);
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);
  const aes = await subtle().importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const registro = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aes, unir(carga, Uint8Array.of(2))));
  const cabecera = new Uint8Array(21);
  cabecera.set(salt, 0);
  new DataView(cabecera.buffer).setUint32(16, TAMANO_REGISTRO);
  cabecera[20] = publica.length;
  return unir(cabecera, publica, registro);
}

/* ---------------------------------------------------------------- VAPID (RFC 8292) */

// La clave para firmar, si la privada casa con la pública: se firma un reto
// con la una y se verifica con la otra. null si no casan o no son P-256.
async function prepararClaves(privada, publica) {
  if (typeof privada !== 'string' || !ESCALAR_P256.test(privada) || typeof publica !== 'string' || !PUNTO_P256.test(publica)) return null;
  const punto = deB64u(publica);
  const algoritmo = { name: 'ECDSA', namedCurve: 'P-256' }, firma = { name: 'ECDSA', hash: 'SHA-256' };
  try {
    const clave = await subtle().importKey('jwk', { kty: 'EC', crv: 'P-256', d: privada,
      x: b64u(punto.subarray(1, 33)), y: b64u(punto.subarray(33)) }, algoritmo, false, ['sign']);
    const comprobar = await subtle().importKey('raw', punto, algoritmo, false, ['verify']);
    const reto = globalThis.crypto.getRandomValues(new Uint8Array(32));
    return await subtle().verify(firma, comprobar, await subtle().sign(firma, clave, reto), reto) ? clave : null;
  } catch { return null; }
}

// JWT ES256 (firma r||s de 64 octetos, la de WebCrypto): aud = el origen del
// endpoint, exp a 12 horas y sub = mailto:rwadares@gmail.com.
async function firmarVapid({ audiencia, clave, ahora }) {
  const cabecera = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const datos = b64u(utf8(JSON.stringify({ aud: audiencia, exp: ahora + 12 * 3600, sub: SUJETO })));
  const firma = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, clave, utf8(cabecera + '.' + datos)));
  return cabecera + '.' + datos + '.' + b64u(firma);
}

/* ---------------------------------------------------------------- entrada */

// La carga v1 de webpush_carga, con sus cinco claves y nada más, que abre una
// página de https://rwadar.pages.dev/. Devuelve los octetos que se cifran
// (JSON en UTF-8, en un orden fijo) o null.
function cargaValida(carga) {
  if (!carga || typeof carga !== 'object' || Array.isArray(carga) || Object.keys(carga).sort().join() !== CLAVES_CARGA) return null;
  const { v, titulo, texto, url, etiqueta } = carga;
  if (v !== 1 || typeof titulo !== 'string' || !titulo.length || titulo.length > 200 ||
    typeof texto !== 'string' || !texto.length || texto.length > 1000 ||
    typeof etiqueta !== 'string' || !ETIQUETA.test(etiqueta) ||
    typeof url !== 'string' || url.length > 512 || !url.startsWith(ORIGEN_WEB + '/') || /[\u0000- \u007f\\]/.test(url)) return null;
  let destino;
  try { destino = new URL(url); } catch { return null; }
  if (destino.origin !== ORIGEN_WEB || destino.username || destino.password) return null;
  const claro = utf8(JSON.stringify({ v: 1, titulo, texto, url, etiqueta }));
  return claro.length <= CARGA_MAXIMA ? claro : null;
}
function envioValido(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos) || Object.keys(datos).sort().join() !== CLAVES_ENVIO) return null;
  const { endpoint, p256dh, auth, carga } = datos;
  if (typeof endpoint !== 'string' || endpoint.length > 2048 || !ENDPOINT_VALIDO.test(endpoint)) return null;
  let destino;
  try { destino = new URL(endpoint); } catch { return null; }
  if (destino.protocol !== 'https:' || destino.port || destino.username || destino.password || !HOST_VALIDO.test(destino.hostname)) return null;
  if (typeof p256dh !== 'string' || !PUNTO_P256.test(p256dh) || typeof auth !== 'string' || !SECRETO_AUTH.test(auth)) return null;
  const claro = cargaValida(carga);
  return claro ? { destino, p256dh: deB64u(p256dh), auth: deB64u(auth), claro } : null;
}

/* ---------------------------------------------------------------- servidor */

// Dependencias de servidor.mjs: api (Supabase con la clave publicable),
// cuerpoJSON (JSON de 16 KiB como mucho), respuesta y reservarIntento (el
// limitador). plazoMs: espera máxima al servicio de push.
export function crearWebpushServidor({ fetchImpl, ahora = Date.now, plazoMs = 10000, api, cuerpoJSON, respuesta, reservarIntento }) {
  let guardada = null; // { valor, leidaEn }: la pública de RWAdar (o null si aún no hay)
  let falloHasta = 0;
  let enVuelo = null;

  // Las peticiones que llegan a la vez con la memoria vacía comparten una sola
  // pregunta a Supabase. Un fallo no se repite en 30 segundos.
  function preguntarClave(env) {
    if (!enVuelo) {
      enVuelo = Promise.resolve().then(() => api(env, RPC_CLAVE, { method: 'POST', data: {}, maxBytes: 1024 }))
        .then(valor => {
          if (valor !== null && (typeof valor !== 'string' || !PUNTO_P256.test(valor))) throw new Error('respuesta_invalida');
          guardada = { valor, leidaEn: ahora() };
          return valor;
        })
        .catch(() => { falloHasta = ahora() + ESPERA_FALLO_MS; throw new Error('servicio_no_disponible'); })
        .finally(() => { enVuelo = null; });
    }
    return enVuelo;
  }
  async function esDeRWAdar(env, publica) {
    const t = ahora();
    if (guardada && t - guardada.leidaEn < CACHE_CLAVE_MS && (guardada.valor === publica || t - guardada.leidaEn < REPREGUNTA_MS)) {
      return guardada.valor === publica;
    }
    if (falloHasta > t) throw new Error('servicio_no_disponible');
    return (await preguntarClave(env)) === publica;
  }

  async function entregar(destino, cuerpo, jwt, publica) {
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), plazoMs);
    try {
      // Sin cookies ni datos de nadie; las redirecciones no se siguen.
      const r = await fetchImpl(destino.href, { method: 'POST', redirect: 'manual', signal: abort.signal,
        headers: { Authorization: 'vapid t=' + jwt + ', k=' + publica, TTL: String(TTL), Urgency: 'high',
          'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream' }, body: cuerpo });
      try { await r.body?.cancel(); } catch { /* el cuerpo no importa */ }
      return Number.isInteger(r.status) && r.status >= 100 && r.status <= 599 ? r.status : 0;
    } catch { return 0; } finally { clearTimeout(timer); }
  }

  const salida = (datos, estado = 200, cabeceras = {}) => respuesta(datos, estado, { 'Cache-Control': 'no-store', ...cabeceras });
  // Solo llega aquí quien ya probó tener la clave de RWAdar (pg_net): 200,
  // para que la base lo dé por fallido a la primera, sin reintentar.
  const invalida = () => salida({ codigo: -1, error: 'entrada_invalida' });
  const clavesNoValidas = () => salida({ codigo: -1, error: 'claves_no_validas' }, 403);

  async function atender({ request, env, url }) {
    try {
      if (request.method !== 'POST') return salida({ codigo: -1, error: 'metodo_no_permitido' }, 405, { Allow: 'POST' });
      const privada = request.headers.get('x-rwadar-vapid-privada') || '';
      const publica = request.headers.get('x-rwadar-vapid-publica') || '';
      // Primero las claves (barato: la pública sale de la memoria y la firma
      // es una operación ECDSA); sin forma, ni se pregunta a Supabase.
      let clave = null;
      if (ESCALAR_P256.test(privada) && PUNTO_P256.test(publica)) {
        let deRWAdar;
        try { deRWAdar = await esDeRWAdar(env, publica); }
        catch { return salida({ codigo: 0, error: 'servicio_no_disponible' }, 503, { 'Retry-After': '30' }); }
        if (deRWAdar) clave = await prepararClaves(privada, publica);
      }
      // Después el límite, cada una en su cupo.
      try { reservarIntento(clave ? RUTA : RUTA_SIN_CLAVE, request); }
      catch (error) { return salida({ codigo: 0, error: 'intentos_excedidos' }, 429, { 'Retry-After': error.reintentarTras || '60' }); }
      if (!clave) return clavesNoValidas();
      if (url.search) return invalida();
      let datos;
      try { datos = await cuerpoJSON(request); } catch { return invalida(); }
      const envio = envioValido(datos);
      if (!envio) return invalida();
      let cuerpo;
      // Un p256dh con forma de punto que no está en la curva no se puede cifrar.
      try { cuerpo = await cifrar({ carga: envio.claro, p256dh: envio.p256dh, auth: envio.auth }); } catch { return invalida(); }
      const jwt = await firmarVapid({ audiencia: envio.destino.origin, clave, ahora: Math.floor(ahora() / 1000) });
      return salida({ codigo: await entregar(envio.destino, cuerpo, jwt, publica) });
    } catch {
      return salida({ codigo: 0, error: 'error_interno' }, 500);
    }
  }
  // cifrar, firmarVapid y prepararClaves, para las pruebas (el vector del RFC).
  return { atender, cifrar, firmarVapid, prepararClaves, CARGA_MAXIMA };
}
