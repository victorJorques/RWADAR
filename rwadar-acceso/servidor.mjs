// Authorization for Pages Functions. No passwords, tokens or user data are logged.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGEN_AUTH = 'https://exgpmjpaaebyoolpwced.supabase.co';
const COOKIE = '__Host-rwadar-acceso';
const MAX_BODY = 16 * 1024;
const PUBLICAS = new Set(['/acceso', '/acceso.html', '/privacidad', '/privacidad.html',
  '/condiciones', '/condiciones.html', '/aviso-legal', '/aviso-legal.html',
  '/transparencia-comercial', '/transparencia-comercial.html', '/robots.txt', '/favicon.ico',
  '/assets/acceso.js', '/assets/acceso.css', '/sw.js',
  '/assets/privacidad-20260820.css', '/assets/idioma-20261022.css',
  '/assets/analitica-20260927.js', '/assets/idioma-en-20261022.js', '/assets/idioma-20261022.js', '/assets/idioma-web-20261022.js',
  '/assets/fuentes/geist-normal-6ab67a4f11f1.woff2', '/assets/fuentes/geist-italic-0138eaff66cd.woff2',
  '/assets/fuentes/geist-mono-normal-7ead591194e0.woff2']);

export function retornoSeguro(value, origin) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n\u0000]/.test(value)) return '/';
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || /^\/(?:api\/|acceso(?:\.html)?(?:\/|$))/.test(target.pathname)) return '/';
    return target.pathname;
  } catch { return '/'; }
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
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) throw new Error('solicitud_invalida');
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
  const data = JSON.parse(new TextDecoder().decode(bytes));
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

export function crearAccesoServidor({ fetchImpl = fetch, plazoMs = 8000 } = {}) {
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
      const body = text ? JSON.parse(text) : null;
      if (!result.ok) { const error = new Error('auth_rechazado'); error.status = result.status; throw error; }
      return body;
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
  async function atender(context) {
    const { request, env } = context; const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const endpoint = path.startsWith('/api/acceso/');
    const recursoCatalogo = path.match(/^\/api\/acceso\/catalogo\/(catalogo_plataformas_publicas_v2|catalogo_ofertas_publicas_v2|catalogo_publicacion|plataformas)$/);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!endpoint || request.method !== 'POST') return respuesta({ error: 'metodo_no_permitido' }, 405);
      // Host-only cookies plus strict Origin and JSON prevent login/logout CSRF.
      if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'origen_no_permitido' }, 403);
    }
    if (!endpoint && (PUBLICAS.has(path) || /^\/assets\/(?:acceso\.[a-f0-9]{8,64}\.(?:js|css)|(?:privacidad-20260820|idioma-20261022)\.[a-f0-9]{8,64}\.css|(?:analitica-20260927|idioma-en-20261022|idioma-20261022|idioma-web-20261022)\.[a-f0-9]{8,64}\.js)$/.test(path))) return context.next();
    if (endpoint && !recursoCatalogo && !['/api/acceso/sesion', '/api/acceso/entrar', '/api/acceso/registrar',
      '/api/acceso/recuperar', '/api/acceso/reenviar', '/api/acceso/inspeccionar',
      '/api/acceso/adoptar', '/api/acceso/nueva-clave', '/api/acceso/salir', '/api/acceso/datos', '/api/acceso/reautenticar', '/api/acceso/tutorial'].includes(path)) return respuesta({ error: 'ruta_no_permitida' }, 404);
    try {
      if (path === '/api/acceso/tutorial') {
        if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405);
        if (url.search || request.headers.get('sec-fetch-site') === 'cross-site') return respuesta({ error: 'solicitud_invalida' }, 400);
        // Native WebView only: no CORS, no URL token, no cookie-only adoption.
        const authorization = request.headers.get('authorization') || '';
        if (!authorization.startsWith('Bearer ')) throw new Error('sin_sesion');
        const token = authorization.slice(7); await verificar(env, token);
        // No HTTP redirect: some WebViews forward Authorization on same-origin
        // redirects. Native switches source to /#explain without headers after load.
        return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><title>Abriendo tutorial de Academy</title></html>', { status: 200, headers: {
          'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie(token),
          'Content-Security-Policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow',
          'Referrer-Policy': 'no-referrer' } });
      }
      if (recursoCatalogo) {
        if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405);
        const token = leerCookie(request); await verificar(env, token);
        const parameters = new URLSearchParams(url.search);
        for (const key of parameters.keys()) if (!['select', 'limit', 'order', 'estado', 'slug', 'nombre'].includes(key)) throw new Error('solicitud_invalida');
        const limit = parameters.get('limit') || '1001';
        if (!/^[0-9]{1,4}$/.test(limit) || Number(limit) < 1 || Number(limit) > 1001) throw new Error('solicitud_invalida');
        parameters.set('limit', limit);
        const data = await api(env, '/rest/v1/' + recursoCatalogo[1] + '?' + parameters, { token, maxBytes: 8 * 1024 * 1024 });
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
          const session = await api(env, '/auth/v1/token?grant_type=password', { method: 'POST',
            data: { email: current.correo, password: clave(data.clave) } });
          const user = await verificar(env, session?.access_token);
          if (user.id !== current.id) throw new Error('sin_sesion');
          return respuesta({ autenticada: true, usuario: user }, 200, { 'Set-Cookie': cookie(session.access_token) });
        }
        if (path === '/api/acceso/datos') {
          const token = leerCookie(request); await verificar(env, token);
          // Closed routes only; each own-account write still goes through existing RLS/RPC.
          const route = typeof data.ruta === 'string' ? data.ruta : '';
          const match = route.match(/^\/(mi_perfil|perfiles|vigilancia|avisos_correo|plataformas|opiniones_publicas|nota_media|mis_opiniones|cola_moderacion|publicaciones|rpc\/(?:guardar_opinion|borrar_mi_opinion|denunciar_opinion|moderar|configurar_avisos_correo|marcar_manual_descargado|borrar_mi_cuenta|mis_publicaciones|publicar|borrar_mi_publicacion|denunciar_publicacion))(\?[^#\r\n]*)?$/);
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
          const result = await api(env, '/rest/v1/' + resource + (query.size ? '?' + query : ''),
            { token, method, data: method === 'GET' ? undefined : data.cuerpo || {}, representacion: true });
          return respuesta(result == null ? [] : result);
        }
        if (path === '/api/acceso/entrar') {
          const session = await api(env, '/auth/v1/token?grant_type=password', { method: 'POST',
            data: { email: correo(data.correo), password: clave(data.clave) } });
          const user = await verificar(env, session?.access_token);
          return respuesta({ autenticada: true, usuario: user }, 200, { 'Set-Cookie': cookie(session.access_token) });
        }
        if (path === '/api/acceso/registrar') {
          if (data.aceptaCondiciones !== true) throw new Error('condiciones');
          const name = typeof data.nombre === 'string' ? data.nombre.trim() : '';
          if (name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('nombre_invalido');
          await api(env, '/auth/v1/signup?redirect_to=' + encodeURIComponent('https://rwadar.pages.dev/'),
            { method: 'POST', data: { email: correo(data.correo), password: clave(data.clave, true), data: { nombre: name } } });
          // Signup never opens the catalog, even if remote autoconfirm is misconfigured.
          return respuesta({ confirmarCorreo: true, mensaje: 'Si el registro se ha completado, recibirás un enlace. Confirma tu correo y después entra.' });
        }
        if (path === '/api/acceso/recuperar' || path === '/api/acceso/reenviar') {
          await api(env, '/auth/v1/' + (path.endsWith('recuperar') ? 'recover' : 'resend') +
            '?redirect_to=' + encodeURIComponent('https://rwadar.pages.dev/'), { method: 'POST',
              data: { email: correo(data.correo), ...(path.endsWith('reenviar') ? { type: 'signup' } : {}) } });
          return respuesta({ mensaje: 'Si hay una cuenta con ese correo, recibirás el enlace. Revisa también el correo no deseado.' });
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
      if (path === '/api/acceso/sesion') return respuesta({ autenticada: true, usuario: user });
      const response = await context.next(); const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store'); headers.set('Vary', 'Cookie');
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      if (error.message === 'configuracion_pendiente') return respuesta({ error: 'configuracion_pendiente' }, 503);
      if (!endpoint) {
        // Redirect HTML navigation; scripts/JSON/images receive an actual denial.
        if ((request.headers.get('accept') || '').includes('text/html')) return new Response(null, { status: 303,
          headers: { Location: '/acceso?volver=' + encodeURIComponent(retornoSeguro(path, url.origin)),
            'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
        return respuesta({ error: 'sesion_necesaria' }, 401);
      }
      const code = ['correo_invalido', 'clave_corta', 'clave_vacia', 'condiciones', 'nombre_invalido', 'solicitud_invalida', 'solicitud_excesiva'].includes(error.message) ? error.message : 'sesion_necesaria';
      // An old failed request must not erase a newer account's cookie.
      return respuesta({ error: code }, error.status === 429 ? 429 : code === 'sesion_necesaria' ? 401 : 400);
    }
  }
  return { atender, verificar };
}
