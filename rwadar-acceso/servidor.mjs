// Public reading and private account API. No passwords, tokens or user data are logged.
import { crearCarteraServidor } from './cartera-servidor.mjs';
import { crearTokenizacionServidor } from './tokenizacion-servidor.mjs';
import { crearWebpushServidor } from './webpush-servidor.mjs';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGEN_AUTH = 'https://exgpmjpaaebyoolpwced.supabase.co';
const COOKIE = '__Host-rwadar-acceso';
const MAX_BODY = 16 * 1024;
// Supabase limits Auth by client IP, but every request from this server reaches
// it from the same shared Cloudflare address: one client could exhaust the quota
// for every web visitor. This best-effort limit lives in this isolate's memory,
// is keyed by the visitor (IPv4 address or IPv6 /64) and, like Supabase, counts
// every request that reaches Auth. There is deliberately no per-email limit:
// anyone could use it to lock a stranger out. Maximum per window:
// password attempts; requests that can send an email; unsubscribe links (baja);
// Web Push sends from Supabase (webpush: one request per notification, in
// batches of up to 500 every 5 minutes; see webpush-servidor.mjs)
const LIMITES = Object.freeze({ clave: 30, envio: 10, baja: 20, webpush: 2000 });
const VENTANA_S = 600;
const GRUPO_LIMITE = Object.freeze({ '/api/acceso/entrar': 'clave', '/api/acceso/reautenticar': 'clave',
  '/api/acceso/registrar': 'envio', '/api/acceso/recuperar': 'envio', '/api/acceso/reenviar': 'envio',
  '/api/acceso/baja': 'baja', '/api/interno/webpush': 'webpush' });
// Avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md): la
// casilla del alta es opcional y versionada. Cambiar su texto obliga a otra versión.
// Ninguna de estas constantes se exporta: este archivo acaba dentro de
// _worker.js y Cloudflare (workerd) rechaza el despliegue si una exportación con
// nombre no es un manejador o una clase (un texto o un booleano lo tumban). Las
// pruebas las leen en el objeto que devuelve crearAccesoServidor.
// v2 desde la revisión legal del 06/11/2026; con la v1 no se llegó a recoger
// ningún permiso porque la casilla nunca se mostró.
const VERSION_AVISOS_NOVEDADES = 'novedades-v2-2026-11-06';
// Idioma en que se mostró el texto de la casilla, para acreditar qué texto exacto
// se aceptó (EDPB, Directrices 05/2020, §108). Solo estos dos valores.
const IDIOMAS_AVISOS = Object.freeze(['es', 'en']);
// La casilla de avisos del alta tiene su propio interruptor (12/11/2026), el
// mismo que assets/acceso.js: sigue apagada mientras el correo no esté listo,
// aunque Perfil › Avisos ya esté encendido en la web (AVISOS_NOVEDADES_REMOTOS
// de assets/rwadar-20260820.js). Apagado, el alta sigue exigiendo que
// avisosNovedades, si viene, sea un booleano, pero no lo pasa a los metadatos:
// nadie se apunta a los avisos desde el alta mientras no esté activa.
const AVISOS_CASILLA_ALTA = false;
const MENSAJE_BAJA = 'Si el enlace era válido, ya no recibirás avisos de novedades.';
// Academy con cuenta: modos de academy.json y forma de un slug publicado.
const ACCESOS_ACADEMY = Object.freeze(['cuenta', 'publico']);
const SLUG_ACADEMY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function retornoSeguro(value, origin) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\u0000]/.test(value)) return '/';
  try {
    const target = new URL(value, origin);
    // La ruta normalizada también: '/.//x' o '/a/..//x' dan el pathname '//x',
    // que el navegador resolvería como otra web.
    if (target.origin !== origin || !target.pathname.startsWith('/') || target.pathname.startsWith('//') ||
      target.pathname.includes('\\') || /^\/(?:api\/|acceso(?:\.html)?(?:\/|$))/.test(target.pathname)) return '/';
    return target.pathname;
  } catch { return '/'; }
}

function destinoCorreo(origin) {
  // Both roots are already allowed by Auth. Never copy an arbitrary request
  // origin into an account email or return a temporary deployment hostname.
  return /^https:\/\/(?:revision|[a-f0-9]{8})\.rwadar\.pages\.dev$/.test(origin)
    ? 'https://revision.rwadar.pages.dev/' : 'https://rwadar.pages.dev/';
}

function respuesta(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow', ...headers } });
}
function cookie(token = '') {
  return COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax' + (token ? '' : '; Max-Age=0');
}
function leerCookie(request) {
  const values = (request.headers.get('cookie') || '').split(';').map(s => s.trim())
    .filter(s => s.startsWith(COOKIE + '='));
  return values.length === 1 ? values[0].slice(COOKIE.length + 1) : '';
}
function tokenValido(token) {
  return typeof token === 'string' && token.length <= 3800 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}
async function cuerpoJSON(request) {
  const tipo = (request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (tipo !== 'application/json') throw new Error('solicitud_invalida');
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY) throw new Error('solicitud_excesiva');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('solicitud_invalida');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new Error('solicitud_excesiva'); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error('solicitud_invalida'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('solicitud_invalida');
  return data;
}
function correo(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new Error('correo_invalido');
  return value.trim();
}
function clave(value, nueva = false) {
  if (typeof value !== 'string' || value.length > 256 || value.length < (nueva ? 12 : 1)) throw new Error(nueva ? 'clave_corta' : 'clave_vacia');
  return value;
}
// Optional Cloudflare Turnstile token from the form, forwarded once to Auth.
// Auth validates it when CAPTCHA protection is on; this server never consumes it.
function seguridad(data) {
  if (data.captcha === undefined) return {};
  if (typeof data.captcha !== 'string' || !/^[\x21-\x7e]{1,2048}$/.test(data.captcha)) throw new Error('solicitud_invalida');
  return { gotrue_meta_security: { captcha_token: data.captcha } };
}
// The visitor's IPv4 address, or the /64 prefix of an IPv6 address: a single
// connection usually owns a whole /64 and could rotate addresses to reset counts.
function visitante(request) {
  const ip = (request.headers.get('cf-connecting-ip') || '').toLowerCase();
  const v4 = ip.match(/^(?:::ffff:)?((?:\d{1,3}\.){3}\d{1,3})$/);
  if (v4) return v4[1];
  if (ip.length > 39 || !/^[0-9a-f:]+$/.test(ip) || ip.split('::').length > 2) return '';
  const [izquierda, derecha = null] = ip.split('::');
  const a = izquierda ? izquierda.split(':') : [], b = derecha ? derecha.split(':') : [];
  if (derecha === null ? a.length !== 8 : a.length + b.length > 7) return '';
  const grupos = [...a, ...Array(8 - a.length - b.length).fill('0'), ...b];
  if (!grupos.every(g => /^[0-9a-f]{1,4}$/.test(g))) return '';
  return grupos.slice(0, 4).map(g => g.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}
function crearLimitador(ahora, maxClaves = 10000) {
  const cubos = new Map();
  return {
    // Counts one request. Returns the seconds to wait if the key is over its
    // limit (that request is not counted), or 0 when it may continue.
    reservar(key, maximo) {
      const t = ahora(); let cubo = cubos.get(key);
      if (cubo && cubo.hasta <= t) { cubos.delete(key); cubo = null; }
      if (cubo && cubo.cuenta >= maximo) return Math.max(1, Math.ceil((cubo.hasta - t) / 1000));
      if (!cubo) {
        // Every window lasts VENTANA_S, so the Map's order is expiry order:
        // expired entries sit at the front, then the oldest live one.
        for (const [k, c] of cubos) { if (c.hasta > t && cubos.size < maxClaves) break; cubos.delete(k); }
        cubo = { cuenta: 0, hasta: t + VENTANA_S * 1000 }; cubos.set(key, cubo);
      }
      cubo.cuenta++;
      return 0;
    },
  };
}

/* Lecciones de la Academy solo con cuenta. La ruta se normaliza como
   rutaNormalizadaRWAdar del worker (se decodifica y se juntan las //), pero sin
   perdonar nada: con %2F, %5C, \ o una codificación rota la respuesta es 400.
   El primer segmento no distingue mayúsculas. Devuelve null si la petición no
   va a la Academy o va a su índice (público); { estado: 400 }; o { slug }, con
   slug null si bajo /academy/ hay algo que no tiene forma de lección. */
function peticionAcademy(url) {
  const cruda = url.pathname;
  let ruta = null;
  try { ruta = decodeURIComponent(cruda); } catch { /* codificación rota: 400 más abajo */ }
  const academia = /^\/+academy(?:\/|\\|%2f|%5c|$)/i;
  if (!academia.test(cruda) && !(ruta !== null && academia.test(ruta))) return null;
  if (ruta === null || /%2f|%5c|\\/i.test(cruda) || ruta.includes('\\')) return { estado: 400 };
  const resto = ruta.replace(/\/{2,}/g, '/').replace(/^\/academy/i, '');
  if (resto === '' || resto === '/' || /^\/index(?:\.html)?\/?$/.test(resto)) return null;
  const leccion = /^\/([^/]+?)(?:\.html)?\/?$/.exec(resto);
  return { slug: leccion ? leccion[1] : null };
}
// Una navegación o una petición que acepta HTML: se la manda a entrar.
function pideHTML(request) {
  return request.headers.get('sec-fetch-mode') === 'navigate' || request.headers.get('sec-fetch-dest') === 'document' ||
    /\btext\/html\b/i.test(request.headers.get('accept') || '');
}
// Página mínima para un fallo pasajero de Supabase: sin estilos ni scripts (CSP).
const PAGINA_ACADEMY_NO_DISPONIBLE = '<!doctype html><html lang="es"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">' +
  '<title>Academy no disponible ahora · RWAdar</title><body><h1>No podemos comprobar tu sesión ahora</h1>' +
  '<p>El servicio de cuentas no responde. Tu sesión se conserva: vuelve a intentarlo en unos segundos.</p>' +
  '<p lang="en">We can’t check your session right now. Your session is kept: try again in a few seconds.</p>' +
  '<p><a href="/academy/">Volver a la Academy</a></p></body></html>';

async function leerTexto(result, maxBytes) {
  if (Number(result.headers.get('content-length')) > maxBytes) throw new Error('respuesta_excesiva');
  const reader = result.body?.getReader(); let text = '';
  if (reader) {
    let size = 0; const decoder = new TextDecoder();
    try { while (true) { const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new Error('respuesta_excesiva'); }
      text += decoder.decode(part.value, { stream: true }); } text += decoder.decode();
    } finally { reader.releaseLock(); }
  } else text = await result.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error('respuesta_excesiva');
  return text;
}

// avisosNovedades: solo para las pruebas, que encienden el interruptor sin
// tocar el archivo. El worker y functions/_middleware.js no lo pasan.
// cacheTokenizacion: solo para las pruebas (null, sin Cache API; o un doble).
// plazoWebpushMs: espera máxima al servicio de push (las pruebas la acortan).
export function crearAccesoServidor({ fetchImpl = fetch, plazoMs = 8000, ahora = Date.now, academy = null,
  avisosNovedades = AVISOS_CASILLA_ALTA, cacheTokenizacion = undefined, plazoWebpushMs = 10000 } = {}) {
  if (typeof avisosNovedades !== 'boolean') throw new Error('avisos_invalidos');
  const limitador = crearLimitador(ahora);
  // Sin configuración de la Academy (o con "publico") no hay puerta: como antes.
  // El worker la recibe de construirWorker, sacada de rwadar-academy/academy.json.
  if (academy !== null && (!ACCESOS_ACADEMY.includes(academy?.acceso) || !Array.isArray(academy.lecciones) ||
    !academy.lecciones.every(slug => typeof slug === 'string' && SLUG_ACADEMY.test(slug)))) throw new Error('academy_invalida');
  const academyConCuenta = academy?.acceso === 'cuenta';
  const leccionesAcademy = new Set(academy?.lecciones || []);
  async function api(env, path, { token, method = 'GET', data, maxBytes = 128 * 1024, representacion = false } = {}) {
    if (env.SUPABASE_URL !== ORIGEN_AUTH || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.SUPABASE_PUBLISHABLE_KEY || '')) throw new Error('configuracion_pendiente');
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), plazoMs);
    try {
      // Workers implements follow/manual, not redirect:'error'. Manual plus
      // an explicit 3xx rejection prevents forwarding credentials elsewhere.
      const result = await fetchImpl(ORIGEN_AUTH + path, { method, redirect: 'manual', cache: 'no-store',
        signal: abort.signal, headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY,
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...(data ? { 'Content-Type': 'application/json' } : {}),
          ...(representacion ? { Prefer: 'return=representation' } : {}) },
        ...(data ? { body: JSON.stringify(data) } : {}) });
      if (result.status >= 300 && result.status < 400) throw new Error('redireccion_no_permitida');
      // A provider's HTML/non-JSON rejection must retain its HTTP status.
      // Do not reflect its body or headers containing account information.
      if (!result.ok) {
        const error = new Error('auth_rechazado'); error.status = result.status;
        const retry = result.headers.get('retry-after') || '';
        error.reintentarTras = /^[0-9]{1,6}$/.test(retry) && Number(retry) >= 1 && Number(retry) <= 86400 ? retry : '60';
        // Only a CAPTCHA refusal's error code is read; the rest is discarded.
        if (result.status === 400) {
          try { error.captcha = JSON.parse(await leerTexto(result, 4096))?.error_code === 'captcha_failed'; } catch { /* no detail */ }
        }
        if (result.body) await result.body.cancel().catch(() => {});
        throw error;
      }
      const text = await leerTexto(result, maxBytes);
      const body = text ? JSON.parse(text) : null;
      return body;
    } catch (error) {
      if (error.message === 'auth_rechazado' || error.message === 'redireccion_no_permitida') throw error;
      throw new Error('servicio_no_disponible');
    } finally { clearTimeout(timer); }
  }
  async function verificar(env, token) {
    if (!tokenValido(token)) throw new Error('sin_sesion');
    // Auth verifies the JWT; the existing guarded view verifies the current
    // session_id in auth.sessions. A signed but revoked JWT is insufficient.
    const user = await api(env, '/auth/v1/user', { token });
    if (!UUID.test(user?.id || '') || user.is_anonymous === true || !user.email_confirmed_at ||
      !Number.isFinite(Date.parse(user.email_confirmed_at))) throw new Error('sin_sesion');
    const email = correo(user.email);
    const profile = await api(env, '/rest/v1/mi_perfil?select=id&id=eq.' + user.id + '&limit=1', { token });
    if (!Array.isArray(profile) || profile.length !== 1 || profile[0].id !== user.id) throw new Error('sin_sesion');
    return { id: user.id, correo: email, correoConfirmadoEl: user.email_confirmed_at };
  }
  // Throws 429 while this visitor is over the limit of the route's group.
  function reservarIntento(path, request) {
    const grupo = GRUPO_LIMITE[path], quien = visitante(request);
    // Without a visitor IP (local runs) there is no shared bucket to protect.
    if (!quien) return;
    const espera = limitador.reservar(grupo + ':' + quien, LIMITES[grupo]);
    if (espera) { const error = new Error('intentos_excedidos'); error.status = 429; error.reintentarTras = String(espera); throw error; }
  }
  /* Puerta de las lecciones (contrato AVISOS-Y-ACADEMY-REGISTRO-2026-11-05, punto 1).
     null: la petición sigue su camino normal. Una lección que no está en la
     lista cerrada da 404 sin mirar la cookie. Sin sesión: 303 a /acceso (HTML)
     o 401. Un fallo pasajero de Supabase da 503 y nunca manda a entrar ni toca
     la cookie: solo un 401/403 de Auth (o una sesión que no cuadra) es «sin
     sesión». Con sesión, la lección sale por el camino normal de los archivos,
     privada y sin guardar. No es un candado del contenido: es una puerta. */
  async function puertaAcademy(context, url) {
    if (!academyConCuenta) return null;
    const { request, env } = context;
    const pedida = peticionAcademy(url);
    if (!pedida) return null;
    if (pedida.estado === 400) return respuesta({ error: 'solicitud_invalida' }, 400);
    if (!pedida.slug || !leccionesAcademy.has(pedida.slug)) {
      if (context.noEncontrada) return context.noEncontrada();
      return new Response(request.method === 'HEAD' ? null : 'No encontrado', { status: 404, headers: {
        'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    try { await verificar(env, leerCookie(request)); }
    catch (error) {
      const sinSesion = ['sin_sesion', 'correo_invalido'].includes(error.message) ||
        (error.message === 'auth_rechazado' && [401, 403].includes(error.status));
      if (!sinSesion) {
        const espera = error.status === 429 ? error.reintentarTras || '60' : '30';
        if (!pideHTML(request)) return respuesta({ error: 'servicio_no_disponible' }, 503, { 'Retry-After': espera, Vary: 'Cookie' });
        return new Response(request.method === 'HEAD' ? null : PAGINA_ACADEMY_NO_DISPONIBLE, { status: 503, headers: {
          'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': espera, Vary: 'Cookie',
          'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' } });
      }
      if (!pideHTML(request)) return respuesta({ error: 'sesion_necesaria' }, 401, { Vary: 'Cookie' });
      // El slug sale de la lista cerrada; retornoSeguro lo deja en una ruta propia.
      const volver = retornoSeguro('/academy/' + pedida.slug, url.origin);
      return new Response(null, { status: 303, headers: { Location: '/acceso?volver=' + volver,
        'Cache-Control': 'no-store', Vary: 'Cookie', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' } });
    }
    const servida = await context.next();
    const headers = new Headers(servida.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex');
    const vary = headers.get('Vary');
    headers.set('Vary', !vary ? 'Cookie' : /(?:^|,)\s*cookie\s*(?:,|$)/i.test(vary) ? vary : vary + ', Cookie');
    return new Response(servida.body, { status: servida.status, statusText: servida.statusText, headers });
  }
  const atenderCartera = crearCarteraServidor({ api, verificar, leerCookie, respuesta });
  const atenderTokenizacion = crearTokenizacionServidor({ fetchImpl, ahora, cache: cacheTokenizacion, respuesta, leerTexto });
  const webpush = crearWebpushServidor({ fetchImpl, ahora, plazoMs: plazoWebpushMs, api, cuerpoJSON, respuesta, reservarIntento });
  async function atender(context) {
    const { request, env } = context; const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const endpoint = path.startsWith('/api/acceso/');
    const recursoCatalogo = path.match(/^\/api\/acceso\/catalogo\/(catalogo_plataformas_publicas_v2|catalogo_ofertas_publicas_v2|catalogo_publicacion|plataformas)$/);
    // Notificaciones web desde Supabase (12/11/2026): la llama pg_net, sin
    // Origin ni cookies, con la clave VAPID de RWAdar en sus cabeceras. Va antes
    // de la regla de Origin de /api/acceso/ y no lee ni toca la cookie de nadie.
    if (path === '/api/interno/webpush') return webpush.atender({ request, env, url });
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!endpoint || request.method !== 'POST') return respuesta({ error: 'metodo_no_permitido' }, 405);
      // Host-only cookies plus strict Origin and JSON prevent login/logout CSRF.
      if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'origen_no_permitido' }, 403);
    }
    // La tokenización en el mundo (10/11/2026): pública, sin sesión, solo GET.
    // activo lee un archivo del despliegue (el worker lo recibe de compilar.cjs;
    // en Pages Functions, de env.ASSETS).
    if (path === '/api/tokenizacion') {
      const activo = context.activo || (env?.ASSETS ? ruta => env.ASSETS.fetch(new Request(ruta, { method: 'GET' })) : null);
      return atenderTokenizacion({ request, url, activo, waitUntil: context.waitUntil });
    }
    // The catalog, the Academy index, sources, RSS and SEO pages are public;
    // Academy lessons may require an account (puertaAcademy). Only the
    // closed account API handles identity and private data. ASSETS cannot write.
    if (!endpoint) {
      if (path.startsWith('/api/')) return respuesta({ error: 'ruta_no_permitida' }, 404);
      // Solo las lecciones de la Academy, con "acceso": "cuenta", pasan por la puerta.
      return (await puertaAcademy(context, url)) || context.next();
    }
    if (path === '/api/acceso/cartera') return atenderCartera({ request, env });
    if (endpoint && !recursoCatalogo && !['/api/acceso/sesion', '/api/acceso/entrar', '/api/acceso/registrar',
      '/api/acceso/recuperar', '/api/acceso/reenviar', '/api/acceso/inspeccionar',
      '/api/acceso/adoptar', '/api/acceso/nueva-clave', '/api/acceso/salir', '/api/acceso/datos', '/api/acceso/reautenticar', '/api/acceso/tutorial', '/api/acceso/tutorial-continuar.js',
      '/api/acceso/baja'].includes(path)) return respuesta({ error: 'ruta_no_permitida' }, 404);
    try {
      if (path === '/api/acceso/tutorial-continuar.js') {
        if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405);
        if (url.search || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'solicitud_invalida' }, 400);
        return new Response("(function () { 'use strict'; if (location.pathname !== '/api/acceso/tutorial') return; location.replace('/#explain'); })();", { status: 200, headers: {
          'Content-Type': 'application/javascript; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' } });
      }
      if (path === '/api/acceso/tutorial') {
        if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405);
        if (url.search || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'solicitud_invalida' }, 400);
        // Native WebView only: no CORS, no URL token, no cookie-only adoption.
        const authorization = request.headers.get('authorization') || '';
        if (!authorization.startsWith('Bearer ')) throw new Error('sin_sesion');
        const token = authorization.slice(7); await verificar(env, token);
        // No HTTP redirect: some WebViews forward Authorization on same-origin
        // redirects. The fixed script and native onLoadEnd both continue to /#explain.
        return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abriendo tutorial de Academy</title><body><p>Abriendo el tutorial de Academy.</p><a href="/#explain">Continuar al tutorial</a><script src="/api/acceso/tutorial-continuar.js" defer></script></body></html>', { status: 200, headers: {
          'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie(token),
          'Content-Security-Policy': "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
          'Referrer-Policy': 'no-referrer' } });
      }
      if (recursoCatalogo) {
        if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405);
        // Public GET never forwards a cookie or a user token to the catalog.
        const parameters = new URLSearchParams(url.search);
        for (const key of parameters.keys()) if (!['select', 'limit', 'order', 'estado', 'slug', 'nombre'].includes(key)) throw new Error('solicitud_invalida');
        const limit = parameters.get('limit') || '1001';
        if (!/^[0-9]{1,4}$/.test(limit) || Number(limit) < 1 || Number(limit) > 1001) throw new Error('solicitud_invalida');
        parameters.set('limit', limit);
        const data = await api(env, '/rest/v1/' + recursoCatalogo[1] + '?' + parameters, { maxBytes: 8 * 1024 * 1024 });
        return respuesta(data);
      }
      if (endpoint && path !== '/api/acceso/sesion' && request.method !== 'POST') return respuesta({ error: 'metodo_no_permitido' }, 405);
      if (path === '/api/acceso/salir') {
        const token = leerCookie(request); let remoto = true;
        if (tokenValido(token)) { try { await api(env, '/auth/v1/logout?scope=local', { token, method: 'POST' }); } catch { remoto = false; } }
        return respuesta({ cerrado: true, cierreRemoto: remoto }, 200, { 'Set-Cookie': cookie() });
      }
      if (endpoint && path !== '/api/acceso/sesion') {
        const data = await cuerpoJSON(request);
        if (path === '/api/acceso/reautenticar') {
          const current = await verificar(env, leerCookie(request));
          const password = clave(data.clave), extra = seguridad(data);
          reservarIntento(path, request);
          const session = await api(env, '/auth/v1/token?grant_type=password', { method: 'POST',
            data: { email: current.correo, password, ...extra } });
          const user = await verificar(env, session?.access_token);
          if (user.id !== current.id) throw new Error('sin_sesion');
          return respuesta({ autenticada: true, usuario: user }, 200, { 'Set-Cookie': cookie(session.access_token) });
        }
        if (path === '/api/acceso/datos') {
          const token = leerCookie(request); await verificar(env, token);
          // Closed routes only; each own-account write still goes through existing RLS/RPC.
          const route = typeof data.ruta === 'string' ? data.ruta : '';
          const match = route.match(/^\/(mi_perfil|perfiles|vigilancia|avisos_correo|plataformas|opiniones_publicas|nota_media|mis_opiniones|cola_moderacion|publicaciones|rpc\/(?:guardar_opinion|borrar_mi_opinion|denunciar_opinion|moderar|configurar_avisos_correo|marcar_manual_descargado|borrar_mi_cuenta|mis_publicaciones|publicar|borrar_mi_publicacion|denunciar_publicacion|estado_mis_avisos|configurar_avisos_novedades|mis_avisos_recientes|clave_publica_webpush|registrar_aviso_webpush|quitar_aviso_webpush|mi_aviso_webpush_registrado))(\?[^#\r\n]*)?$/);
          const method = data.metodo || 'GET';
          if (!match || route.length > 4096 || !['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) throw new Error('solicitud_invalida');
          const resource = match[1], rpc = resource.startsWith('rpc/');
          if ((rpc && method !== 'POST') || (!rpc && method !== 'GET' && !['perfiles', 'vigilancia'].includes(resource)) ||
            (resource === 'perfiles' && !['GET', 'PATCH'].includes(method)) ||
            (resource === 'vigilancia' && method === 'PATCH')) throw new Error('solicitud_invalida');
          const query = new URLSearchParams(match[2] || '');
          for (const key of query.keys()) if (!['select', 'limit', 'order', 'id', 'usuario_id', 'plataforma_id', 'nombre', 'estado'].includes(key)) throw new Error('solicitud_invalida');
          if (method === 'GET') {
            const limit = query.get('limit') || '1001';
            if (!/^[0-9]{1,4}$/.test(limit) || Number(limit) < 1 || Number(limit) > 1001) throw new Error('solicitud_invalida');
            query.set('limit', limit);
          }
          if (data.cuerpo !== undefined && (!data.cuerpo || typeof data.cuerpo !== 'object' || Array.isArray(data.cuerpo))) throw new Error('solicitud_invalida');
          let result;
          try {
            result = await api(env, '/rest/v1/' + resource + (query.size ? '?' + query : ''),
              { token, method, data: method === 'GET' ? undefined : data.cuerpo || {}, representacion: true });
          } catch (error) {
            // Identity was already verified. A resource's refusal is not logout.
            // Keep its status while withholding all provider details and data.
            if ([400, 403, 404, 409].includes(error.status)) return respuesta({ error: 'operacion_rechazada' }, error.status);
            throw error;
          }
          return respuesta(result == null ? [] : result);
        }
        if (path === '/api/acceso/entrar') {
          const email = correo(data.correo), password = clave(data.clave), extra = seguridad(data);
          reservarIntento(path, request);
          const session = await api(env, '/auth/v1/token?grant_type=password', { method: 'POST',
            data: { email, password, ...extra } });
          const user = await verificar(env, session?.access_token);
          return respuesta({ autenticada: true, usuario: user }, 200, { 'Set-Cookie': cookie(session.access_token) });
        }
        if (path === '/api/acceso/registrar') {
          if (data.aceptaCondiciones !== true) throw new Error('condiciones');
          const name = typeof data.nombre === 'string' ? data.nombre.trim() : '';
          if (name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('nombre_invalido');
          // Casilla opcional de avisos: solo un booleano JSON. Con true, y solo con
          // el interruptor encendido, viajan la versión vigente, el canal y el
          // idioma del texto mostrado; el permiso lo guarda la base al confirmar.
          // Apagado, se valida y se ignora. idioma, si viene, es 'es' o 'en' tal
          // cual (ni 'EN' ni 'en-US'); si no viene, el texto era el castellano.
          if (data.avisosNovedades !== undefined && typeof data.avisosNovedades !== 'boolean') throw new Error('solicitud_invalida');
          if (data.idioma !== undefined && !IDIOMAS_AVISOS.includes(data.idioma)) throw new Error('solicitud_invalida');
          const avisos = avisosNovedades && data.avisosNovedades === true
            ? { avisos_novedades: true, avisos_version: VERSION_AVISOS_NOVEDADES, avisos_canal: 'web', avisos_idioma: data.idioma ?? 'es' } : {};
          const email = correo(data.correo), password = clave(data.clave, true), extra = seguridad(data);
          reservarIntento(path, request);
          await api(env, '/auth/v1/signup?redirect_to=' + encodeURIComponent(destinoCorreo(url.origin)),
            { method: 'POST', data: { email, password, data: { nombre: name, ...avisos }, ...extra } });
          // Signup never grants account access, even if remote autoconfirm is misconfigured.
          return respuesta({ confirmarCorreo: true, mensaje: 'Si la cuenta es nueva, recibirás un enlace para confirmar el correo antes de entrar. Si ya tenías cuenta, entra con tu contraseña o recupérala.' });
        }
        if (path === '/api/acceso/recuperar' || path === '/api/acceso/reenviar') {
          const email = correo(data.correo), extra = seguridad(data);
          reservarIntento(path, request);
          await api(env, '/auth/v1/' + (path.endsWith('recuperar') ? 'recover' : 'resend') +
            '?redirect_to=' + encodeURIComponent(destinoCorreo(url.origin)), { method: 'POST',
              data: { email, ...(path.endsWith('reenviar') ? { type: 'signup' } : {}), ...extra } });
          return respuesta({ mensaje: 'Si hay una cuenta con ese correo, recibirás el enlace. Revisa también el correo no deseado.' });
        }
        if (path === '/api/acceso/baja') {
          // Baja de los avisos desde el enlace de un correo: sin cuenta y sin la
          // cookie de nadie, con la clave publicable. Solo { token } con un UUID.
          // La respuesta es siempre la misma: no dice si el enlace existía.
          if (Object.keys(data).length !== 1 || typeof data.token !== 'string' || !UUID.test(data.token)) throw new Error('solicitud_invalida');
          reservarIntento(path, request);
          try { await api(env, '/rest/v1/rpc/baja_avisos', { method: 'POST', data: { p_token: data.token }, maxBytes: 1024 }); }
          catch (error) {
            // Un rechazo de la base no depende del enlace: es un fallo del servicio,
            // nunca «sin sesión», y no se finge una baja que no se hizo.
            if (['auth_rechazado', 'redireccion_no_permitida'].includes(error.message) && error.status !== 429) throw new Error('servicio_no_disponible');
            throw error;
          }
          return respuesta({ ok: true, mensaje: MENSAJE_BAJA });
        }
        const user = await verificar(env, data.access_token);
        if (path === '/api/acceso/inspeccionar') return respuesta({ usuario: user });
        if (path === '/api/acceso/nueva-clave') {
          await api(env, '/auth/v1/user', { token: data.access_token, method: 'PUT', data: { password: clave(data.clave, true) } });
          return respuesta({ mensaje: 'Contraseña actualizada. Entra con la nueva contraseña.' }, 200, { 'Set-Cookie': cookie() });
        }
        if (path === '/api/acceso/adoptar' && data.confirmarIdentidad === true) return respuesta({ autenticada: true, usuario: user }, 200, { 'Set-Cookie': cookie(data.access_token) });
        throw new Error('solicitud_invalida');
      }
      const user = await verificar(env, leerCookie(request));
      return respuesta({ autenticada: true, usuario: user });
    } catch (error) {
      if (error.message === 'configuracion_pendiente') return respuesta({ error: 'configuracion_pendiente' }, 503);
      if (error.captcha === true) return respuesta({ error: 'captcha_fallido' }, 400);
      if (error.status === 429) return respuesta({ error: 'intentos_excedidos' }, 429,
        { 'Retry-After': error.reintentarTras || '60' });
      if (error.message === 'servicio_no_disponible' || error.status >= 500)
        return respuesta({ error: 'servicio_no_disponible' }, 503, { 'Retry-After': '30' });
      const code = ['correo_invalido', 'clave_corta', 'clave_vacia', 'condiciones', 'nombre_invalido', 'solicitud_invalida', 'solicitud_excesiva'].includes(error.message) ? error.message : 'sesion_necesaria';
      // An old failed request must not erase a newer account's cookie.
      return respuesta({ error: code }, code === 'sesion_necesaria' ? 401 : 400);
    }
  }
  return { atender, verificar,
    avisosNovedades: Object.freeze({ activos: avisosNovedades, version: VERSION_AVISOS_NOVEDADES }) };
}
