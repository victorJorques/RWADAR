/* =====================================================================
   RWAdar · panel en la nube · el Worker de Cloudflare
   ---------------------------------------------------------------------
   Sirve la misma página y la misma API (lib/api.js) que el panel del
   ordenador, pero:
     · quien entra lo decide su enlace personal (o Cloudflare Access si
       está configurado), ver acceso.mjs,
     · las claves son secretos del Worker (nunca llegan al navegador),
     · el estado y el registro viven en KV (ALMACEN),
     · el registro apunta quién hace cada cosa,
     · cada hora apunta el uso de la app y las descargas (cron).
   No puede lanzar gh: las tareas de GitHub y las descargas se leen con
   GITHUB_TOKEN si existe. No apaga la web (tampoco el panel del ordenador).
   ===================================================================== */
import { crearApi } from '../lib/api.js';
import { construirConfig } from '../lib/config-base.js';
import { verificarAcceso, entrarConLlave, renovarSesion, cookieSalir, firmaSesion, iguales, modoAcceso } from './acceso.mjs';
import { crearAlmacenKv } from './almacen-kv.mjs';

const MAX_CUERPO = 16 * 1024;
/* Lo único que se sirve sin haber entrado: la puerta y su aspecto. */
const PUBLICOS = /^\/(entrar\.js|panel\.css|icono\.svg|fuentes\/[a-z0-9-]+\.woff2)$/;
const SEGURIDAD = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
});
/* La página de aviso no lleva scripts: solo su propio estilo. */
const CSP_AVISO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function respuesta(cuerpo, estado = 200, tipo = 'application/json; charset=utf-8', extra = {}) {
  return new Response(tipo.startsWith('application/json') ? JSON.stringify(cuerpo) : cuerpo, { status: estado, headers: { ...SEGURIDAD, 'Content-Type': tipo, ...extra } });
}

function paginaAviso(estado, motivo) {
  const texto = String(motivo).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return respuesta(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RWAdar · Panel de control</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0A0A;color:#F7F5F0;font:16px/1.5 system-ui,sans-serif;padding:24px">
<main style="max-width:28rem;text-align:center"><p style="font-weight:700">RW<b style="color:#25E39A">A</b>dar · Panel de control</p><p style="color:#BBB5AB">${texto}</p></main></body></html>`,
  estado, 'text/html; charset=utf-8', { 'Content-Security-Policy': CSP_AVISO });
}

async function recurso(env, request, ruta) {
  const r = await env.ASSETS.fetch(new Request(new URL(ruta, request.url)));
  const cabeceras = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEGURIDAD)) cabeceras.set(k, v);
  return new Response(r.body, { status: r.status, headers: cabeceras });
}

async function leerJson(request) {
  const texto = await request.text();
  if (texto.length > MAX_CUERPO) return { error: respuesta({ ok: false, error: 'Petición demasiado grande' }, 413) };
  try { return { cuerpo: texto ? JSON.parse(texto) : {} }; } catch { return { error: respuesta({ ok: false, error: 'JSON no válido' }, 400) }; }
}

function origenAjeno(request, url) {
  const origen = request.headers.get('origin');
  return Boolean(origen && origen !== url.origin);
}

export function crearManejador(publicos) {
  let api = null;
  let almacen = null;
  const obtenerApi = env => {
    if (!api) {
      const v = clave => String(env[clave] ?? '').trim();
      /* RWADAR_PANEL_DEMO solo existe en la demo local (enseña la franja de datos simulados). */
      const config = construirConfig(publicos, v, { modo: 'nube', modoDemo: v('RWADAR_PANEL_DEMO') === '1', githubPorCli: false });
      almacen = crearAlmacenKv(env.ALMACEN);
      api = crearApi({ config, almacen });
    }
    return api;
  };

  /* La puerta: cambia la llave del enlace por una cookie. */
  async function entrar(request, env, url) {
    if (origenAjeno(request, url)) return respuesta({ ok: false, error: 'Origen no permitido' }, 400);
    if (modoAcceso(env) === 'access') return respuesta({ ok: false, error: 'Este panel se abre con Cloudflare Access, no con enlace.' }, 400);
    const { cuerpo, error } = await leerJson(request);
    if (error) return error;
    const r = await entrarConLlave(cuerpo.llave, env);
    if (!r.ok) return respuesta({ ok: false, error: r.motivo }, r.estado);
    obtenerApi(env);
    await almacen.anotar({ accion: 'Entrar al panel con su enlace', objetivo: null, resultado: 'hecho', quien: r.quien });
    return respuesta({ ok: true, datos: { quien: r.quien } }, 200, 'application/json; charset=utf-8', { 'Set-Cookie': r.cookie });
  }

  async function fetch(request, env) {
    const url = new URL(request.url);
    const metodo = request.method;
    /* Se pide «/entrar» y no «/entrar.html»: Cloudflare redirige las .html
       a su ruta limpia y eso daría un bucle. */
    if (url.pathname === '/entrar' && (metodo === 'GET' || metodo === 'HEAD')) return recurso(env, request, '/entrar');
    if (PUBLICOS.test(url.pathname) && (metodo === 'GET' || metodo === 'HEAD')) return recurso(env, request, url.pathname);
    if (url.pathname === '/api/entrar' && metodo === 'POST') return entrar(request, env, url);
    if (url.pathname === '/api/salir' && metodo === 'POST') {
      return respuesta({ ok: true, datos: { salido: true } }, 200, 'application/json; charset=utf-8', { 'Set-Cookie': cookieSalir() });
    }

    const acceso = await verificarAcceso(request, env);
    if (!acceso.ok) {
      return url.pathname.startsWith('/api/') ? respuesta({ ok: false, error: acceso.motivo }, acceso.estado) : paginaAviso(acceso.estado, acceso.motivo);
    }
    const sesion = await firmaSesion(env.PANEL_SECRETO, acceso.quien);

    if (!url.pathname.startsWith('/api/')) {
      if (metodo !== 'GET' && metodo !== 'HEAD') return respuesta({ ok: false, error: 'Método no permitido' }, 405);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const html = await (await env.ASSETS.fetch(new Request(new URL('/', url)))).text();
        /* Al abrir el panel la sesión vuelve a durar 90 días (con enlaces). */
        const renovada = await renovarSesion(acceso, env);
        return respuesta(html.replace('__TOKEN__', sesion), 200, 'text/html; charset=utf-8', renovada ? { 'Set-Cookie': renovada } : {});
      }
      return recurso(env, request, url.pathname);
    }

    if (!iguales(request.headers.get('x-panel-token') || '', sesion)) {
      return respuesta({ ok: false, error: 'Sesión del panel no válida: recarga la página' }, 403);
    }
    let cuerpo = {};
    if (metodo === 'POST') {
      if (origenAjeno(request, url)) return respuesta({ ok: false, error: 'Origen no permitido' }, 400);
      if (!String(request.headers.get('content-type') || '').startsWith('application/json')) return respuesta({ ok: false, error: 'Se esperaba JSON' }, 400);
      const leido = await leerJson(request);
      if (leido.error) return leido.error;
      cuerpo = leido.cuerpo;
    }
    const r = await obtenerApi(env).manejar({ metodo, url, cuerpo, quien: acceso.quien });
    return respuesta(r.cuerpo, r.estado);
  }

  /* Cron de cada hora: historial de uso de la app y de descargas. */
  async function scheduled(_, env, ctx) {
    ctx.waitUntil(obtenerApi(env).tareaHoraria());
  }

  return { fetch, scheduled };
}
