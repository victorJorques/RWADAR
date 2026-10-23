'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Public project coordinates; never an administrative key.
const CONFIGURACION_PUBLICA = Object.freeze({
  SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n',
});
const CABECERAS_SEGURIDAD = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; worker-src 'self'; manifest-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self'; font-src 'self' data:; img-src 'self' data:; media-src 'none'; connect-src 'self' https://exgpmjpaaebyoolpwced.supabase.co https://cloudflareinsights.com; form-action 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'accelerometer=(), autoplay=(), browsing-topics=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
});

function construirWorker(raiz = __dirname) {
  const servidor = fs.readFileSync(path.join(raiz, 'servidor.mjs'), 'utf8');
  // New dependencies require an explicit bundling decision.
  if (/\bimport\s*(?:\(|[{*'"\w])/.test(servidor) || /\bexport\s+default\b/.test(servidor)) {
    throw new Error('El servidor de acceso debe ser autónomo sin export default.');
  }
  return servidor + '\nconst configuracionRWAdar = Object.freeze(' + JSON.stringify(CONFIGURACION_PUBLICA) + ');\n' +
    'const cabecerasRWAdar = Object.freeze(' + JSON.stringify(CABECERAS_SEGURIDAD) + ');\n' +
    'const accesoRWAdar = crearAccesoServidor();\n' +
    'export default { async fetch(request, env, executionCtx) {\n' +
    '  const respuesta = await accesoRWAdar.atender({ request, env: configuracionRWAdar,\n' +
    '    waitUntil: executionCtx.waitUntil.bind(executionCtx),\n' +
    '    next: () => env.ASSETS.fetch(request) });\n' +
    '  const headers = new Headers(respuesta.headers);\n' +
    '  for (const [nombre, valor] of Object.entries(cabecerasRWAdar)) {\n' +
    '    if (nombre === "Content-Security-Policy" && headers.has(nombre)) continue;\n' +
    '    headers.set(nombre, valor);\n' +
    '  }\n' +
    '  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers });\n' +
    '} };\n';
}

const RUTAS = Object.freeze({ version: 1, include: ['/*'], exclude: [] });
module.exports = { construirWorker, RUTAS, CONFIGURACION_PUBLICA, CABECERAS_SEGURIDAD };
