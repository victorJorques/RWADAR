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

/* Academy con cuenta (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
   El worker lleva la lista cerrada de lecciones publicadas y el modo de
   rwadar-academy/academy.json: "cuenta" (cada lección pide una sesión
   confirmada) o "publico" (como antes). Una lección «Próximamente» o inventada
   da 404 sin mirar la cookie. Publicar una lección sigue siendo cambiar
   academy.json, regenerar y publicar: el worker se compila con esa lista. */
const ACCESOS_ACADEMY = Object.freeze(['cuenta', 'publico']);
const RUTA_ACADEMY = path.join(__dirname, '..', 'rwadar-academy', 'academy.json');
function academyPublicada(config = JSON.parse(fs.readFileSync(RUTA_ACADEMY, 'utf8'))) {
  if (!config || !ACCESOS_ACADEMY.includes(config.acceso)) {
    throw new Error('academy.json: "acceso" debe ser "cuenta" o "publico".');
  }
  const lecciones = Array.isArray(config.lecciones) ? config.lecciones : [];
  const slug = l => l && typeof l.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(l.slug);
  if (!lecciones.length || !lecciones.every(slug) || new Set(lecciones.map(l => l.slug)).size !== lecciones.length) {
    throw new Error('academy.json: lecciones repetidas o con un slug no válido.');
  }
  const publicadas = lecciones.filter(l => l.estado === 'publicado').map(l => l.slug).sort();
  if (!publicadas.length) throw new Error('academy.json no publica ninguna lección.');
  return Object.freeze({ acceso: config.acceso, lecciones: Object.freeze(publicadas),
    pendientes: Object.freeze(lecciones.filter(l => l.estado !== 'publicado').map(l => l.slug).sort()) });
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

function construirWorker(raiz = __dirname, { fichas = PAGINAS_FICHAS, academy } = {}) {
  const publicadas = fichasPublicadas(fichas);
  const { acceso, lecciones } = academyPublicada(academy);
  const importCartera = "import { crearCarteraServidor } from './cartera-servidor.mjs';";
  const importTokenizacion = "import { crearTokenizacionServidor, crearTokenizacionDirectoServidor } from './tokenizacion-servidor.mjs';";
  const importWebpush = "import { crearWebpushServidor } from './webpush-servidor.mjs';";
  const original = fs.readFileSync(path.join(raiz, 'servidor.mjs'), 'utf8');
  if (original.split(importCartera).length !== 2) throw new Error('Falta la integración explícita de cartera.');
  if (original.split(importTokenizacion).length !== 2) throw new Error('Falta la integración explícita de la tokenización.');
  if (original.split(importWebpush).length !== 2) throw new Error('Falta la integración explícita de las notificaciones web.');
  const servidor = original.replace(importCartera, '').replace(importTokenizacion, '').replace(importWebpush, '');
  const modelo = fs.readFileSync(path.join(raiz, '../rwadar-movil/lib/cartera.js'), 'utf8');
  if (/\brequire\s*\(|\bimport\b\s*(?:\(|[{*'"\w])/.test(modelo)) throw new Error('El motor de cartera debe ser autónomo.');
  const importModelo = "import carteraModelo from '../rwadar-movil/lib/cartera.js';";
  const carteraOriginal = fs.readFileSync(path.join(raiz, 'cartera-servidor.mjs'), 'utf8');
  if (carteraOriginal.split(importModelo).length !== 2) throw new Error('Falta el motor canónico de cartera.');
  const cartera = carteraOriginal.replace(importModelo, '');
  if (/\bimport\b\s*(?:\(|[{*'"\w])/.test(cartera)) throw new Error('La cartera no admite dependencias implícitas.');
  /* La tokenización en el mundo (10/11/2026): el mismo motor que la web y la
     app (rwadar-movil/lib/tokenizacion.js), autónomo, y su ruta pública. */
  const modeloTokenizacion = fs.readFileSync(path.join(raiz, '../rwadar-movil/lib/tokenizacion.js'), 'utf8');
  if (/\brequire\s*\(|\bimport\b\s*(?:\(|[{*'"\w])/.test(modeloTokenizacion)) throw new Error('El motor de la tokenización debe ser autónomo.');
  const importModeloTokenizacion = "import tokenizacionModelo from '../rwadar-movil/lib/tokenizacion.js';";
  const tokenizacionOriginal = fs.readFileSync(path.join(raiz, 'tokenizacion-servidor.mjs'), 'utf8');
  if (tokenizacionOriginal.split(importModeloTokenizacion).length !== 2) throw new Error('Falta el motor canónico de la tokenización.');
  const tokenizacion = tokenizacionOriginal.replace(importModeloTokenizacion, '');
  if (/\bimport\b\s*(?:\(|[{*'"\w])/.test(tokenizacion)) throw new Error('La tokenización no admite dependencias implícitas.');
  /* Notificaciones web desde Supabase (12/11/2026): POST /api/interno/webpush
     cifra y firma con WebCrypto lo que manda pg_net. Autónomo: sin módulos.
     Va en su propio ámbito (una función que se ejecuta al cargar) para que
     sus constantes no choquen con las de los otros archivos, y solo sale
     crearWebpushServidor, sin exportarse desde _worker.js. */
  const webpush = fs.readFileSync(path.join(raiz, 'webpush-servidor.mjs'), 'utf8');
  if (/\bimport\b\s*(?:\(|[{*'"\w])|\brequire\s*\(/.test(webpush)) throw new Error('Las notificaciones web no admiten dependencias.');
  const exportWebpush = 'export function crearWebpushServidor(';
  if (webpush.split(exportWebpush).length !== 2 || /\bexport\b/.test(webpush.replace(exportWebpush, ''))) {
    throw new Error('webpush-servidor.mjs solo puede exportar crearWebpushServidor.');
  }
  // New dependencies require an explicit bundling decision.
  if (/\bimport\s*(?:\(|[{*'"\w])/.test(servidor) || /\bexport\s+default\b/.test(servidor)) {
    throw new Error('El servidor de acceso debe ser autónomo sin export default.');
  }
  /* Cloudflare (workerd) toma cada exportación con nombre del módulo principal
     como un punto de entrada: una función pasa, pero un texto, un número o un
     booleano exportados hacen que el despliegue falle. Solo se admiten
     «export function» / «export async function» (compilar.test.mjs lo comprueba
     además importando el worker). */
  for (const [nombre, codigo] of [['servidor.mjs', servidor], ['cartera-servidor.mjs', cartera], ['tokenizacion-servidor.mjs', tokenizacion],
    ['webpush-servidor.mjs', webpush]]) {
    const exportaciones = codigo.match(/\bexport\b(?!\s*(?:async\s+)?function\b)[^\n]{0,40}/g);
    if (exportaciones) throw new Error(`${nombre} solo puede exportar funciones: ${exportaciones[0].trim()}`);
  }
  return 'const carteraModelo = (() => { const module = { exports: {} };\n' + modelo + '\nreturn module.exports; })();\n' + cartera + '\n' +
    'const tokenizacionModelo = (() => { const module = { exports: {} };\n' + modeloTokenizacion + '\nreturn module.exports; })();\n' + tokenizacion + '\n' +
    'const crearWebpushServidor = (() => {\n' + webpush.replace(exportWebpush, 'function crearWebpushServidor(') +
    '\nreturn crearWebpushServidor; })();\n' + servidor + '\nconst configuracionRWAdar = Object.freeze(' + JSON.stringify(CONFIGURACION_PUBLICA) + ');\n' +
    'const cabecerasRWAdar = Object.freeze(' + JSON.stringify(CABECERAS_SEGURIDAD) + ');\n' +
    'const fichasRWAdar = new Set(' + JSON.stringify(publicadas) + ');\n' +
    'const academyRWAdar = Object.freeze(' + JSON.stringify({ acceso, lecciones }) + ');\n' +
    ARCHIVOS_RETIRADOS_WORKER +
    'const accesoRWAdar = crearAccesoServidor({ academy: academyRWAdar });\n' +
    'export default { async fetch(request, env, executionCtx) {\n' +
    '  const respuesta = await accesoRWAdar.atender({ request, env: configuracionRWAdar,\n' +
    '    waitUntil: executionCtx.waitUntil.bind(executionCtx),\n' +
    '    activo: ruta => env.ASSETS.fetch(new Request(ruta, { method: "GET" })),\n' +
    '    next: () => servirArchivoRWAdar(request, env),\n' +
    '    noEncontrada: () => paginaNoEncontradaRWAdar(request, env) });\n' +
    '  const headers = new Headers(respuesta.headers);\n' +
    /* Sesión que se mantiene (12/11/2026): entrar y renovar ponen dos cookies.
       Cada Set-Cookie va en su propia cabecera, nunca unidas con comas. */
    '  if (typeof respuesta.headers.getSetCookie === "function") {\n' +
    '    headers.delete("Set-Cookie");\n' +
    '    for (const valor of respuesta.headers.getSetCookie()) headers.append("Set-Cookie", valor);\n' +
    '  }\n' +
    '  for (const [nombre, valor] of Object.entries(cabecerasRWAdar)) {\n' +
    '    if (nombre === "Content-Security-Policy" && headers.has(nombre)) continue;\n' +
    '    headers.set(nombre, valor);\n' +
    '  }\n' +
    '  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers });\n' +
    '} };\n';
}

/* _routes.json: qué peticiones pasan por el worker (07/11/2026).
   Cada petición que entra en el worker gasta del cupo gratis de Pages
   Functions (100.000 al día). Si se agota, Pages está en «fail open» y sirve
   los archivos sin el worker: las lecciones de /academy/ saldrían sin pedir
   cuenta. Por eso no se gasta el cupo en lo que no lo necesita.

   Fuera del worker solo queda /assets/: hojas, scripts con huella, fuentes,
   las imágenes de Leaflet y el JSON del mapa. Ahí el worker no decide nada:
   sirve ASSETS tal cual (respeta la copia de conservación, ver
   copiaConservadaRWAdar) y solo añade CABECERAS_SEGURIDAD, que _headers ya
   pone en /* con los mismos valores (compilar.test.mjs exige que sean
   idénticas, Referrer-Policy incluida; .github/comprobar-publicado.mjs prueba
   tras publicar que «/assets/../academy/…» no abre una lección). Todo lo demás sigue dentro:
   el HTML, /api/*, /academy/* (la puerta de las lecciones), las fichas y sus
   imágenes (el 404 de las retiradas y de su copia de conservación), sw.js,
   los iconos y el resto de archivos de la raíz.

   Reglas de Cloudflare (developers.cloudflare.com/pages/functions/routing/):
   version 1, al menos una regla en include, como mucho 100 reglas entre
   include y exclude, cada una de 100 caracteres como mucho, y exclude manda
   sobre include. comprobarRutas lo exige al cargar este archivo, y además que
   cada exclusión sea un prefijo «/carpeta/*» de EXCLUSIONES_PERMITIDAS: añadir
   otra carpeta es una decisión explícita, con su prueba. */
const EXCLUSIONES_PERMITIDAS = Object.freeze(['/assets/']);
const LIMITES_RUTAS = Object.freeze({ reglas: 100, caracteres: 100 });
function comprobarRutas(rutas) {
  if (!rutas || rutas.version !== 1 || !Array.isArray(rutas.include) || !Array.isArray(rutas.exclude) ||
    Object.keys(rutas).sort().join() !== 'exclude,include,version') throw new Error('_routes.json: formato no válido.');
  if (!rutas.include.length) throw new Error('_routes.json: include necesita al menos una regla.');
  const reglas = [...rutas.include, ...rutas.exclude];
  if (reglas.length > LIMITES_RUTAS.reglas) throw new Error('_routes.json: más de 100 reglas.');
  for (const regla of reglas) {
    if (typeof regla !== 'string' || !regla.startsWith('/') || regla.length > LIMITES_RUTAS.caracteres || /[\s?#]/.test(regla)) {
      throw new Error('_routes.json: regla no válida: ' + regla);
    }
  }
  if (new Set(reglas).size !== reglas.length) throw new Error('_routes.json: reglas repetidas.');
  if (rutas.include.length !== 1 || rutas.include[0] !== '/*') throw new Error('_routes.json: include debe ser ["/*"].');
  for (const regla of rutas.exclude) {
    if (!regla.endsWith('/*') || !EXCLUSIONES_PERMITIDAS.includes(regla.slice(0, -1))) {
      throw new Error('_routes.json: exclusión no permitida: ' + regla);
    }
  }
  return rutas;
}
const RUTAS = Object.freeze(comprobarRutas({ version: 1, include: Object.freeze(['/*']), exclude: Object.freeze(['/assets/*']) }));
module.exports = { construirWorker, RUTAS, CONFIGURACION_PUBLICA, CABECERAS_SEGURIDAD, CARPETAS_FICHAS, fichasPublicadas,
  ACCESOS_ACADEMY, academyPublicada, comprobarRutas, EXCLUSIONES_PERMITIDAS, LIMITES_RUTAS };
