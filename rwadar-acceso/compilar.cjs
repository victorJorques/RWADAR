'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PAGINAS_FICHAS = require('../rwadar-fichas-manifiesto.js');

/* Fichas retiradas. Cloudflare Pages guarda en cada centro de datos, durante
   una semana, una «copia de conservación» de cada archivo que sirve, y la
   devuelve cuando ese archivo ya no está en el despliegue nuevo
   (@cloudflare/pages-shared, asset-server/handler.ts: ASSET_PRESERVATION_CACHE,
   «public, s-maxage=604800», con x-robots-tag noindex). Para una ficha retirada
   eso enseñaría datos viejos durante días. El worker lleva la lista cerrada de
   fichas publicadas y, en estas carpetas, responde 404 a cualquier otra página
   sin pedírsela a ASSETS. Al retirar una ficha basta con quitarla del
   manifiesto, como hasta ahora. Para el resto de archivos (por ejemplo la
   ilustración de una oferta retirada), el worker reconoce la copia de
   conservación por sus cabeceras y también responde 404.

   Plataforma que cambia de carpeta (04/11/2026, ARTEX pasa a Descartadas).
   Si /plataformas/<slug> ya no está en la lista pero /fuera-del-radar/<slug>
   sí (o al revés, si una descartada vuelve al radar), el worker responde 301
   a la ficha que sí existe, sin pedir nada a ASSETS: así la dirección vieja
   no da 404 ni sirve la copia de conservación. Sale de la misma lista
   cerrada (el destino solo puede ser una ficha publicada) y va con no-store
   para que un navegador no guarde el salto si la plataforma vuelve. */
const CARPETAS_FICHAS = Object.freeze(['ofertas', 'plataformas', 'fuera-del-radar']);
function fichasPublicadas(manifiesto = PAGINAS_FICHAS) {
  const fichas = manifiesto.filter(ruta => {
    const partes = ruta.split('/');
    return partes.length === 2 && CARPETAS_FICHAS.includes(partes[0]) && /^[^/.]+\.html$/.test(partes[1]);
  });
  if (!fichas.some(ruta => ruta.startsWith('ofertas/'))) throw new Error('El manifiesto de fichas no trae ninguna oferta.');
  return [...new Set(fichas)].sort();
}

// Public project coordinates; never an administrative key.
const CONFIGURACION_PUBLICA = Object.freeze({
  SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n',
});
const CABECERAS_SEGURIDAD = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'self'; manifest-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self' data:; img-src 'self' data: https://tile.openstreetmap.org; media-src 'none'; connect-src 'self' https://exgpmjpaaebyoolpwced.supabase.co https://cloudflareinsights.com; form-action 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'accelerometer=(), autoplay=(), browsing-topics=(), camera=(), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
});

/* Código del worker para archivos que ya no están en el despliegue. Va como
   texto literal: se incrusta tal cual en _worker.js. */
const ARCHIVOS_RETIRADOS_WORKER = String.raw`const rutaFichaRWAdar = /^\/(ofertas|plataformas|fuera-del-radar)\/([^/]+?)(?:\.html)?\/?$/;
function rutaNormalizadaRWAdar(request) {
  const cruda = new URL(request.url).pathname;
  let ruta = cruda;
  try { ruta = decodeURIComponent(cruda); } catch {}
  return ruta.replace(/\/{2,}/g, "/");
}
function fichaRetiradaRWAdar(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const partes = rutaFichaRWAdar.exec(rutaNormalizadaRWAdar(request));
  if (!partes || partes[2].includes(".")) return false;
  return !fichasRWAdar.has(partes[1] + "/" + partes[2] + ".html");
}
function fichaTrasladadaRWAdar(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const partes = rutaFichaRWAdar.exec(rutaNormalizadaRWAdar(request));
  if (!partes || partes[2].includes(".") || partes[1] === "ofertas") return null;
  if (fichasRWAdar.has(partes[1] + "/" + partes[2] + ".html")) return null;
  const otra = partes[1] === "plataformas" ? "fuera-del-radar" : "plataformas";
  return fichasRWAdar.has(otra + "/" + partes[2] + ".html") ? "/" + otra + "/" + partes[2] : null;
}
function fichaRedirigidaRWAdar(request, destino) {
  return new Response(null, { status: 301, headers: {
    "Location": destino + new URL(request.url).search, "Cache-Control": "no-store" } });
}
/* El servidor de assets de Pages solo usa la Cache API en notFound(), para
   devolver la copia de conservación de un archivo que ya no está en este
   despliegue, y esa respuesta llega con cf-cache-status HIT y x-robots-tag
   noindex. En /assets/ se respeta: son archivos con huella y la gracia evita
   roturas a quien tenga abierta la versión anterior de la web. */
function copiaConservadaRWAdar(request, respuesta) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (rutaNormalizadaRWAdar(request).startsWith("/assets/")) return false;
  return /^hit$/i.test(respuesta.headers.get("CF-Cache-Status") || "") &&
    /(?:^|[\s,])noindex(?:$|[\s,])/i.test(respuesta.headers.get("X-Robots-Tag") || "");
}
async function paginaNoEncontradaRWAdar(request, env) {
  let pagina = null;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL("/404", request.url), { method: "GET" }));
    if (r.status === 200) pagina = r; else await r.body?.cancel();
  } catch {}
  const headers = new Headers(pagina ? pagina.headers : { "Content-Type": "text/plain; charset=utf-8" });
  for (const nombre of ["ETag", "Last-Modified", "Content-Length", "Age", "CF-Cache-Status"]) headers.delete(nombre);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  if (request.method === "HEAD") { await pagina?.body?.cancel(); return new Response(null, { status: 404, headers }); }
  return new Response(pagina ? pagina.body : "No encontrado", { status: 404, headers });
}
/* Una revalidación (If-None-Match / If-Modified-Since) de una copia de
   conservación recibe un 304 sin cabeceras. Para saber si el 304 viene de una
   copia, se repite la consulta como HEAD sin condiciones. */
async function esCopiaConservadaRWAdar(request, respuesta, env) {
  if (copiaConservadaRWAdar(request, respuesta)) return true;
  if (respuesta.status !== 304 || (request.method !== "GET" && request.method !== "HEAD")) return false;
  if (!request.headers.has("If-None-Match") && !request.headers.has("If-Modified-Since")) return false;
  if (rutaNormalizadaRWAdar(request).startsWith("/assets/")) return false;
  const headers = new Headers(request.headers);
  headers.delete("If-None-Match");
  headers.delete("If-Modified-Since");
  try {
    const comprobacion = await env.ASSETS.fetch(new Request(request.url, { method: "HEAD", headers }));
    await comprobacion.body?.cancel();
    return copiaConservadaRWAdar(request, comprobacion);
  } catch { return false; }
}
async function servirArchivoRWAdar(request, env) {
  const trasladada = fichaTrasladadaRWAdar(request);
  if (trasladada) return fichaRedirigidaRWAdar(request, trasladada);
  if (fichaRetiradaRWAdar(request)) return paginaNoEncontradaRWAdar(request, env);
  const respuesta = await env.ASSETS.fetch(request);
  if (!(await esCopiaConservadaRWAdar(request, respuesta, env))) return respuesta;
  await respuesta.body?.cancel();
  return paginaNoEncontradaRWAdar(request, env);
}
`;

function construirWorker(raiz = __dirname, { fichas = PAGINAS_FICHAS } = {}) {
  const publicadas = fichasPublicadas(fichas);
  const importCartera = "import { crearCarteraServidor } from './cartera-servidor.mjs';";
  const original = fs.readFileSync(path.join(raiz, 'servidor.mjs'), 'utf8');
  if (original.split(importCartera).length !== 2) throw new Error('Falta la integración explícita de cartera.');
  const servidor = original.replace(importCartera, '');
  const modelo = fs.readFileSync(path.join(raiz, '../rwadar-movil/lib/cartera.js'), 'utf8');
  if (/\brequire\s*\(|\bimport\b\s*(?:\(|[{*'"\w])/.test(modelo)) throw new Error('El motor de cartera debe ser autónomo.');
  const importModelo = "import carteraModelo from '../rwadar-movil/lib/cartera.js';";
  const carteraOriginal = fs.readFileSync(path.join(raiz, 'cartera-servidor.mjs'), 'utf8');
  if (carteraOriginal.split(importModelo).length !== 2) throw new Error('Falta el motor canónico de cartera.');
  const cartera = carteraOriginal.replace(importModelo, '');
  if (/\bimport\b\s*(?:\(|[{*'"\w])/.test(cartera)) throw new Error('La cartera no admite dependencias implícitas.');
  // New dependencies require an explicit bundling decision.
  if (/\bimport\s*(?:\(|[{*'"\w])/.test(servidor) || /\bexport\s+default\b/.test(servidor)) {
    throw new Error('El servidor de acceso debe ser autónomo sin export default.');
  }
  return 'const carteraModelo = (() => { const module = { exports: {} };\n' + modelo + '\nreturn module.exports; })();\n' + cartera + '\n' +
    servidor + '\nconst configuracionRWAdar = Object.freeze(' + JSON.stringify(CONFIGURACION_PUBLICA) + ');\n' +
    'const cabecerasRWAdar = Object.freeze(' + JSON.stringify(CABECERAS_SEGURIDAD) + ');\n' +
    'const fichasRWAdar = new Set(' + JSON.stringify(publicadas) + ');\n' +
    ARCHIVOS_RETIRADOS_WORKER +
    'const accesoRWAdar = crearAccesoServidor();\n' +
    'export default { async fetch(request, env, executionCtx) {\n' +
    '  const respuesta = await accesoRWAdar.atender({ request, env: configuracionRWAdar,\n' +
    '    waitUntil: executionCtx.waitUntil.bind(executionCtx),\n' +
    '    next: () => servirArchivoRWAdar(request, env) });\n' +
    '  const headers = new Headers(respuesta.headers);\n' +
    '  for (const [nombre, valor] of Object.entries(cabecerasRWAdar)) {\n' +
    '    if (nombre === "Content-Security-Policy" && headers.has(nombre)) continue;\n' +
    '    headers.set(nombre, valor);\n' +
    '  }\n' +
    '  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers });\n' +
    '} };\n';
}

const RUTAS = Object.freeze({ version: 1, include: ['/*'], exclude: [] });
module.exports = { construirWorker, RUTAS, CONFIGURACION_PUBLICA, CABECERAS_SEGURIDAD, CARPETAS_FICHAS, fichasPublicadas };
