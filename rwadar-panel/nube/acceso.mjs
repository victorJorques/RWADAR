/* =====================================================================
   RWAdar · panel en la nube · quién puede entrar
   ---------------------------------------------------------------------
   Dos formas, según lo que haya configurado:

   ENLACES (por defecto, lo que pidió Víctor: sin cuentas ni códigos)
     Cada socio tiene su enlace personal …/entrar#llave. La llave va
     detrás de «#», así que no viaja ni en la vista previa de WhatsApp ni
     en los registros. Al abrirlo, la página la cambia por una cookie
     firmada (HttpOnly, Secure, SameSite=Strict) que dura 90 días.
     PANEL_ENLACES guarda solo la huella SHA-256 de cada llave: ni el
     propio Worker tiene las llaves. Si se cambia la llave de alguien,
     su cookie deja de valer al momento.

   CLOUDFLARE ACCESS (opcional, más fuerte: correo + código)
     Si existen TEAM_DOMAIN y POLICY_AUD, manda Access: se comprueba la
     firma del pase (JWT RS256), que sea para este panel, que no haya
     caducado y que el correo esté en PANEL_SOCIOS.

   Sin PANEL_SECRETO o sin ninguna de las dos listas, no abre: falla cerrado.
   ===================================================================== */

const EQUIPO = /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/;
const LOCAL_PRUEBAS = /^http:\/\/127\.0\.0\.1:\d+(\/[a-z]+)?$/;
const MARGEN_S = 60;
const COOKIE = 'rwadar_panel';
const DURACION_S = 90 * 24 * 3600;
const LLAVE = /^[A-Za-z0-9_-]{32,128}$/;
let certificados = { emisor: null, claves: new Map(), hasta: 0 };

const codificar = texto => new TextEncoder().encode(texto);
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64url = texto => Uint8Array.from(atob(texto.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texto.length + 3) % 4)), c => c.charCodeAt(0));
const json = texto => JSON.parse(new TextDecoder().decode(b64url(texto)));
const aB64url = texto => btoa(String.fromCharCode(...codificar(texto))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64url = texto => new TextDecoder().decode(b64url(texto));

export function iguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

async function hmac(secreto, texto) {
  const clave = await crypto.subtle.importKey('raw', codificar(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', clave, codificar(texto)));
}

export async function huellaLlave(llave) {
  return hex(await crypto.subtle.digest('SHA-256', codificar(llave)));
}

export function listaSocios(env) {
  return String(env.PANEL_SOCIOS || '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(s => s.includes('@'));
}

/* PANEL_ENLACES: {"Eric": "<sha256 de su llave>", …} */
export function listaEnlaces(env) {
  try {
    const datos = JSON.parse(String(env.PANEL_ENLACES || '{}'));
    return Object.entries(datos).filter(([nombre, huella]) => nombre.trim() && /^[0-9a-f]{64}$/.test(huella));
  } catch { return []; }
}

export const modoAcceso = env => (String(env.TEAM_DOMAIN || '').trim() && String(env.POLICY_AUD || '').trim() ? 'access' : 'enlaces');

function leerCookie(request, nombre) {
  for (const trozo of String(request.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = trozo.trim().split('=');
    if (k === nombre) return v.join('=');
  }
  return null;
}

const SIN_CONFIGURAR = { ok: false, estado: 503, motivo: 'El panel todavía no está configurado: faltan los enlaces de los socios.' };
const SIN_ENLACE = { ok: false, estado: 401, motivo: 'Para entrar, abre el enlace personal que te mandó Víctor por WhatsApp.' };

/* ---------- Enlaces personales ---------- */

/* Cambia la llave del enlace por una cookie. Devuelve { ok, quien, cookie }. */
export async function entrarConLlave(llave, env, ahora = Date.now()) {
  const enlaces = listaEnlaces(env);
  if (!env.PANEL_SECRETO || !enlaces.length) return SIN_CONFIGURAR;
  if (!LLAVE.test(String(llave || ''))) return { ok: false, estado: 403, motivo: 'Ese enlace no es válido. Pídele a Víctor que te mande el tuyo otra vez.' };
  const huella = await huellaLlave(llave);
  const dueno = enlaces.find(([, h]) => iguales(h, huella));
  if (!dueno) return { ok: false, estado: 403, motivo: 'Ese enlace no es válido o ya no funciona. Pídele a Víctor que te mande el tuyo otra vez.' };
  const [quien] = dueno;
  return { ok: true, quien, cookie: await cookiePara(quien, huella, env, ahora) };
}

async function cookiePara(quien, huella, env, ahora) {
  const expira = Math.floor(ahora / 1000) + DURACION_S;
  const cuerpo = `${aB64url(quien)}.${expira}.${huella.slice(0, 16)}`;
  const valor = `${cuerpo}.${await hmac(env.PANEL_SECRETO, cuerpo)}`;
  return `${COOKIE}=${valor}; Path=/; Max-Age=${DURACION_S}; HttpOnly; Secure; SameSite=Strict`;
}

/* Cada vez que alguien abre el panel su sesión vuelve a durar 90 días:
   mientras lo use, nunca tiene que volver a abrir el enlace. */
export async function renovarSesion(acceso, env, ahora = Date.now()) {
  if (!acceso?.huella) return null;
  return cookiePara(acceso.quien, acceso.huella, env, ahora);
}

export const cookieSalir = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

async function verificarCookie(request, env, ahora) {
  const enlaces = listaEnlaces(env);
  if (!enlaces.length) return SIN_CONFIGURAR;
  const valor = leerCookie(request, COOKIE);
  if (!valor) return SIN_ENLACE;
  const [nombre64, expira, huella, firma] = valor.split('.');
  const buena = await hmac(env.PANEL_SECRETO, `${nombre64}.${expira}.${huella}`);
  if (!firma || !iguales(firma, buena)) return { ok: false, estado: 403, motivo: 'Tu sesión no es válida. Vuelve a abrir tu enlace personal.' };
  if (!(Number(expira) > ahora / 1000)) return { ...SIN_ENLACE, motivo: 'Tu sesión ha caducado. Vuelve a abrir tu enlace personal.' };
  let quien;
  try { quien = deB64url(nombre64); } catch { return { ok: false, estado: 403, motivo: 'Tu sesión no es válida.' }; }
  const actual = enlaces.find(([n]) => n === quien);
  if (!actual || !iguales(actual[1].slice(0, 16), huella)) {
    return { ok: false, estado: 403, motivo: 'Tu enlace ya no funciona. Pídele a Víctor uno nuevo.' };
  }
  return { ok: true, quien, huella: actual[1] };
}

/* ---------- Cloudflare Access ---------- */

async function claveDe(emisor, kid, ahora) {
  if (certificados.emisor !== emisor || certificados.hasta < ahora || !certificados.claves.has(kid)) {
    const res = await fetch(`${emisor}/cdn-cgi/access/certs`, { cf: { cacheTtl: 300 } });
    if (!res.ok) throw new Error(`Access no dio sus claves (${res.status})`);
    const { keys = [] } = await res.json();
    const claves = new Map();
    for (const jwk of keys) {
      if (jwk.kty !== 'RSA' || !jwk.kid) continue;
      claves.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
    }
    certificados = { emisor, claves, hasta: ahora + 10 * 60 * 1000 };
  }
  return certificados.claves.get(kid) || null;
}

async function verificarAccess(request, env, ahora) {
  const emisor = String(env.TEAM_DOMAIN || '').trim().replace(/\/$/, '');
  const aud = String(env.POLICY_AUD || '').trim();
  const socios = listaSocios(env);
  const emisorValido = EQUIPO.test(emisor) || (env.PANEL_PRUEBAS === '1' && LOCAL_PRUEBAS.test(emisor));
  if (!emisorValido || !socios.length) {
    return { ok: false, estado: 503, motivo: 'El panel todavía no está configurado: falta la lista de correos de Cloudflare Access.' };
  }
  const token = request.headers.get('cf-access-jwt-assertion') || leerCookie(request, 'CF_Authorization');
  if (!token) return { ok: false, estado: 401, motivo: 'Entra desde el enlace del panel: Cloudflare te pedirá tu correo y te mandará un código.' };
  try {
    const [cabeza, cuerpo, firma] = token.split('.');
    const cab = json(cabeza);
    const datos = json(cuerpo);
    if (cab.alg !== 'RS256') throw new Error('algoritmo');
    const clave = await claveDe(emisor, cab.kid, ahora);
    if (!clave) throw new Error('clave desconocida');
    const buena = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', clave, b64url(firma), codificar(`${cabeza}.${cuerpo}`));
    if (!buena) throw new Error('firma');
    const audiencias = [].concat(datos.aud || []);
    const segundos = ahora / 1000;
    if (datos.iss !== emisor || !audiencias.includes(aud) || !(datos.exp > segundos) || (datos.nbf && datos.nbf > segundos + MARGEN_S)) {
      throw new Error('pase no válido');
    }
    const email = String(datos.email || '').toLowerCase();
    if (!socios.includes(email)) {
      return { ok: false, estado: 403, motivo: `${email || 'Ese correo'} no está en la lista de socios del panel. Pídele a Víctor que te añada.` };
    }
    return { ok: true, quien: email };
  } catch {
    return { ok: false, estado: 403, motivo: 'El pase de Cloudflare Access no es válido. Cierra la pestaña y vuelve a entrar desde el enlace.' };
  }
}

/* Devuelve { ok: true, quien } o { ok: false, estado, motivo }. */
export async function verificarAcceso(request, env, ahora = Date.now()) {
  if (!env.PANEL_SECRETO) return SIN_CONFIGURAR;
  return modoAcceso(env) === 'access' ? verificarAccess(request, env, ahora) : verificarCookie(request, env, ahora);
}

/* Contraseña de sesión de la página: HMAC de quién es con PANEL_SECRETO.
   Otra web no puede leerla, así que no puede pulsar botones por ti. */
export async function firmaSesion(secreto, quien) {
  return hmac(secreto, `rwadar-panel:${quien}`);
}
