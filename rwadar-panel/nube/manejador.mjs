/* =====================================================================
   RWAdar · panel en la nube · el Worker de Cloudflare
   ---------------------------------------------------------------------
   Sirve la misma página y la misma API (lib/api.js) que el panel del
   ordenador, pero:
     · quien entra lo decide Cloudflare Access + la lista PANEL_SOCIOS,
     · las claves son secretos del Worker (nunca llegan al navegador),
     · el estado y el registro viven en KV (ALMACEN),
     · el registro apunta el correo de quien hace cada cosa.
   No puede lanzar wrangler ni gh: apagar funciona volviendo a la página
   de mantenimiento ya subida (la primera vez se sube desde el ordenador)
   y las tareas de GitHub se leen con GITHUB_TOKEN si existe.
   ===================================================================== */
import { crearApi } from '../lib/api.js';
import { construirConfig } from '../lib/config-base.js';
import { verificarAcceso, firmaSesion, iguales } from './acceso.mjs';
import { crearAlmacenKv } from './almacen-kv.mjs';

const MAX_CUERPO = 16 * 1024;
const SEGURIDAD = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
});

function respuesta(cuerpo, estado = 200, tipo = 'application/json; charset=utf-8', extra = {}) {
  return new Response(tipo.startsWith('application/json') ? JSON.stringify(cuerpo) : cuerpo, { status: estado, headers: { ...SEGURIDAD, 'Content-Type': tipo, ...extra } });
}

/* La página de aviso no lleva scripts: solo su propio estilo. */
const CSP_AVISO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function paginaAviso(estado, motivo) {
  const texto = String(motivo).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return respuesta(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RWAdar · Panel de control</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0A0A;color:#F7F5F0;font:16px/1.5 system-ui,sans-serif;padding:24px">
<main style="max-width:28rem;text-align:center"><p style="font-weight:700">RW<b style="color:#25E39A">A</b>dar · Panel de control</p><p style="color:#BBB5AB">${texto}</p></main></body></html>`,
  estado, 'text/html; charset=utf-8', { 'Content-Security-Policy': CSP_AVISO });
}

export function crearManejador(publicos) {
  let api = null;
  const obtenerApi = env => {
    if (!api) {
      const v = clave => String(env[clave] ?? '').trim();
      const config = construirConfig(publicos, v, { modo: 'nube', modoDemo: false, githubPorCli: false });
      api = crearApi({ config, almacen: crearAlmacenKv(env.ALMACEN) });
    }
    return api;
  };

  async function fetch(request, env) {
    const url = new URL(request.url);
    const acceso = await verificarAcceso(request, env);
    if (!acceso.ok) {
      return url.pathname.startsWith('/api/') ? respuesta({ ok: false, error: acceso.motivo }, acceso.estado) : paginaAviso(acceso.estado, acceso.motivo);
    }
    const sesion = await firmaSesion(env.PANEL_SECRETO, acceso.email);

    if (!url.pathname.startsWith('/api/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return respuesta({ ok: false, error: 'Método no permitido' }, 405);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const html = await (await env.ASSETS.fetch(new Request(new URL('/', url)))).text();
        return respuesta(html.replace('__TOKEN__', sesion), 200, 'text/html; charset=utf-8');
      }
      const recurso = await env.ASSETS.fetch(request);
      const cabeceras = new Headers(recurso.headers);
      for (const [k, v] of Object.entries(SEGURIDAD)) cabeceras.set(k, v);
      return new Response(recurso.body, { status: recurso.status, headers: cabeceras });
    }

    if (!iguales(request.headers.get('x-panel-token') || '', sesion)) {
      return respuesta({ ok: false, error: 'Sesión del panel no válida: recarga la página' }, 403);
    }
    let cuerpo = {};
    if (request.method === 'POST') {
      const origen = request.headers.get('origin');
      if (origen && origen !== url.origin) return respuesta({ ok: false, error: 'Origen no permitido' }, 400);
      if (!String(request.headers.get('content-type') || '').startsWith('application/json')) return respuesta({ ok: false, error: 'Se esperaba JSON' }, 400);
      const texto = await request.text();
      if (texto.length > MAX_CUERPO) return respuesta({ ok: false, error: 'Petición demasiado grande' }, 413);
      try { cuerpo = texto ? JSON.parse(texto) : {}; } catch { return respuesta({ ok: false, error: 'JSON no válido' }, 400); }
    }
    const r = await obtenerApi(env).manejar({ metodo: request.method, url, cuerpo, quien: acceso.email });
    return respuesta(r.cuerpo, r.estado);
  }

  return { fetch };
}
