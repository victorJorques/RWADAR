/* =====================================================================
   RWAdar · panel en la nube · quién puede entrar
   ---------------------------------------------------------------------
   Delante del panel está Cloudflare Access: pide el correo y manda un
   código. Aun así, el panel no se fía y comprueba cada petición:
     1. la firma del pase de Access (JWT RS256 con las claves públicas
        del equipo, en TEAM_DOMAIN/cdn-cgi/access/certs),
     2. que el pase sea para ESTE panel (POLICY_AUD) y no haya caducado,
     3. que el correo esté en PANEL_SOCIOS (lista separada por comas).
   Si falta cualquiera de esas piezas, el panel no abre: falla cerrado.
   ===================================================================== */

const EQUIPO = /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/;
const LOCAL_PRUEBAS = /^http:\/\/127\.0\.0\.1:\d+(\/[a-z]+)?$/;
const MARGEN_S = 60;
let certificados = { emisor: null, claves: new Map(), hasta: 0 };

const b64url = texto => Uint8Array.from(atob(texto.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((texto.length + 3) % 4)), c => c.charCodeAt(0));
const json = texto => JSON.parse(new TextDecoder().decode(b64url(texto)));

export function listaSocios(env) {
  return String(env.PANEL_SOCIOS || '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(s => s.includes('@'));
}

function leerCookie(request, nombre) {
  for (const trozo of String(request.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = trozo.trim().split('=');
    if (k === nombre) return v.join('=');
  }
  return null;
}

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

/* Devuelve { ok: true, email } o { ok: false, estado, motivo }. */
export async function verificarAcceso(request, env, ahora = Date.now()) {
  const emisor = String(env.TEAM_DOMAIN || '').trim().replace(/\/$/, '');
  const aud = String(env.POLICY_AUD || '').trim();
  const socios = listaSocios(env);
  const emisorValido = EQUIPO.test(emisor) || (env.PANEL_PRUEBAS === '1' && LOCAL_PRUEBAS.test(emisor));
  if (!emisorValido || !aud || !socios.length || !env.PANEL_SECRETO) {
    return { ok: false, estado: 503, motivo: 'El panel todavía no está configurado: falta activar Cloudflare Access o la lista de socios.' };
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
    const buena = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', clave, b64url(firma), new TextEncoder().encode(`${cabeza}.${cuerpo}`));
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
    return { ok: true, email };
  } catch {
    return { ok: false, estado: 403, motivo: 'El pase de Cloudflare Access no es válido. Cierra la pestaña y vuelve a entrar desde el enlace.' };
  }
}

/* Contraseña de sesión de la página: HMAC del correo con PANEL_SECRETO.
   Otra web no puede leerla, así que no puede pulsar botones por ti. */
export async function firmaSesion(secreto, email) {
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`rwadar-panel:${email}`));
  return [...new Uint8Array(firma)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function iguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}
