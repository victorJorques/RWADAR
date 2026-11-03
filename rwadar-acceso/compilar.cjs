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
   manifiesto, como hasta ahora. */
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

function construirWorker(raiz = __dirname) {
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
    'const fichasRWAdar = new Set(' + JSON.stringify(fichasPublicadas()) + ');\n' +
    'const rutaFichaRWAdar = /^\\/(' + CARPETAS_FICHAS.join('|') + ')\\/([^/]+?)(?:\\.html)?\\/?$/;\n' +
    'function fichaRetiradaRWAdar(request) {\n' +
    '  if (request.method !== "GET" && request.method !== "HEAD") return false;\n' +
    '  let ruta;\n' +
    '  try { ruta = decodeURIComponent(new URL(request.url).pathname); } catch { return false; }\n' +
    '  const partes = rutaFichaRWAdar.exec(ruta);\n' +
    '  if (!partes || partes[2].includes(".")) return false;\n' +
    '  return !fichasRWAdar.has(partes[1] + "/" + partes[2] + ".html");\n' +
    '}\n' +
    'async function fichaNoEncontradaRWAdar(request, env) {\n' +
    '  let pagina = null;\n' +
    '  try {\n' +
    '    const r = await env.ASSETS.fetch(new Request(new URL("/404", request.url), { method: "GET" }));\n' +
    '    if (r.status === 200) pagina = r; else await r.body?.cancel();\n' +
    '  } catch {}\n' +
    '  const headers = new Headers(pagina ? pagina.headers : { "Content-Type": "text/plain; charset=utf-8" });\n' +
    '  for (const nombre of ["ETag", "Last-Modified", "Content-Length", "Age", "CF-Cache-Status"]) headers.delete(nombre);\n' +
    '  headers.set("Cache-Control", "no-store");\n' +
    '  headers.set("X-Robots-Tag", "noindex, nofollow");\n' +
    '  if (request.method === "HEAD") { await pagina?.body?.cancel(); return new Response(null, { status: 404, headers }); }\n' +
    '  return new Response(pagina ? pagina.body : "No encontrado", { status: 404, headers });\n' +
    '}\n' +
    'const accesoRWAdar = crearAccesoServidor();\n' +
    'export default { async fetch(request, env, executionCtx) {\n' +
    '  const respuesta = await accesoRWAdar.atender({ request, env: configuracionRWAdar,\n' +
    '    waitUntil: executionCtx.waitUntil.bind(executionCtx),\n' +
    '    next: () => fichaRetiradaRWAdar(request) ? fichaNoEncontradaRWAdar(request, env) : env.ASSETS.fetch(request) });\n' +
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
