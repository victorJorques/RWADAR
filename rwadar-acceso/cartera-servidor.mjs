import carteraModelo from '../rwadar-movil/lib/cartera.js';

// Límite dedicado: no amplía JSON de Auth ni /datos (16KiB/128KiB).
const MAX_CARTERA = 2 * 1024 * 1024;
const UUID_CARTERA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function errorCartera(code, status = 400) { const e = new Error(code); e.code = code; e.status = status; return e; }
function versionCartera(v) { return Number.isSafeInteger(v) && v >= 0 && v <= 2147483647; }
function limpiarCartera(posiciones) {
  return carteraModelo.deserializarCartera(carteraModelo.serializarCartera(posiciones));
}
async function cuerpoCartera(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw errorCartera('solicitud_invalida');
  if (Number(request.headers.get('content-length')) > MAX_CARTERA) throw errorCartera('solicitud_excesiva', 413);
  const lector = request.body?.getReader();
  if (!lector) throw errorCartera('solicitud_invalida');
  const partes = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await lector.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_CARTERA) { await lector.cancel(); throw errorCartera('solicitud_excesiva', 413); }
      partes.push(value);
    }
  } finally { lector.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const parte of partes) { bytes.set(parte, offset); offset += parte.byteLength; }
  let d;
  try { d = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw errorCartera('solicitud_invalida'); }
  if (!d || Array.isArray(d) || typeof d !== 'object' || Object.keys(d).some(k => !['version','posiciones'].includes(k))
     || !versionCartera(d.version) || d.version === 2147483647) throw errorCartera('solicitud_invalida');
  return { version: d.version, posiciones: limpiarCartera(d.posiciones) };
}
// sesion(env, request): la del servidor de acceso. Devuelve { usuario, token,
// cookies } y renueva el pase si hace falta; cookies (o error.cookies) va en la
// respuesta, también en la de error.
export function crearCarteraServidor({ api, sesion, respuesta: respuestaBase }) {
  return async function atenderCartera({ request, env }) {
    const url = new URL(request.url);
    let cookies = [];
    const respuesta = (data, status, headers) => respuestaBase(data, status, headers, cookies);
    if (!['GET','POST'].includes(request.method)) return respuesta({ error: 'metodo_no_permitido' }, 405);
    if (url.search || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'origen_no_permitido' }, 403);
    if (request.method === 'POST' && request.headers.get('origin') !== url.origin) return respuesta({ error: 'origen_no_permitido' }, 403);
    try {
      const uid = request.headers.get('x-rwadar-usuario');
      if (!UUID_CARTERA.test(uid || '')) throw errorCartera('solicitud_invalida');
      const actual = await sesion(env, request); cookies = actual.cookies;
      const token = actual.token, usuario = actual.usuario;
      if (usuario.id !== uid) throw errorCartera('cuenta_cambiada', 409);
      if (request.method === 'GET') {
        const rows = await api(env, '/rest/v1/mi_cartera?select=version,documento&limit=1', { token, maxBytes: MAX_CARTERA });
        if (!Array.isArray(rows) || rows.length > 1) throw errorCartera('cartera_no_disponible', 502);
        if (!rows.length) return respuesta({ posiciones: [], version: 0 });
        const r = rows[0];
        if (!versionCartera(r.version) || !r.version || r.documento?.version !== 1) throw errorCartera('cartera_no_disponible', 502);
        return respuesta({ posiciones: limpiarCartera(r.documento.posiciones), version: r.version });
      }
      const body = await cuerpoCartera(request);
      const result = await api(env, '/rest/v1/rpc/guardar_mi_cartera', { token, method: 'POST', maxBytes: MAX_CARTERA,
        data: { p_documento: JSON.parse(carteraModelo.serializarCartera(body.posiciones)), p_version: body.version } });
      if (!result || result.version !== body.version + 1) throw errorCartera('cartera_no_disponible', 502);
      return respuesta({ posiciones: limpiarCartera(result.posiciones), version: result.version });
    } catch (e) {
      if (e.cookies) cookies = e.cookies;
      if (e.status === 409) return respuesta({ error: e.code === 'cuenta_cambiada' ? e.code : 'cartera_conflicto' }, 409);
      if (e.status === 429) return respuesta({ error: 'cartera_limite' }, 429, { 'Retry-After': e.reintentarTras || '60' });
      if (e.message === 'sin_sesion' || e.status === 401 || e.status === 403) return respuesta({ error: 'sesion_necesaria' }, 401);
      if (e.code) return respuesta({ error: e.code }, e.status || 400);
      return respuesta({ error: 'cartera_no_disponible' }, ['auth_rechazado','servicio_no_disponible'].includes(e.message) ? 503 : 400);
    }
  };
}
