'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPABASE_AUTH = 'https://exgpmjpaaebyoolpwced.supabase.co/auth/v1';
const CLAVE_PUBLICA = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';
const ORIGEN_PUBLICO = 'https://rwadar.pages.dev';
const ORIGEN_LEGADO = 'https://rwadar.netlify.app';
const PROYECTO_CLOUDFLARE = 'rwadar';
const ESTADOS_LEGALES_PUBLICABLES = Object.freeze(new Set([
  'acuerdo-pendiente-de-documentar',
  'acuerdo-documentado',
]));

/* Lista cerrada del único árbol que puede llegar al artefacto desplegable.
   Un archivo ignorado por Git sigue siendo un archivo publicable si se copia
   a ciegas; por eso aquí no se confía ni en .gitignore ni en extensiones. */
const ARCHIVOS_PUBLICABLES = Object.freeze([
  '.well-known/security.txt',
  '_headers',
  '_redirects',
  '404.html',
  'assets/error-20260820.css',
  'assets/privacidad-20260820.css',
  'assets/rwadar-20260820.css',
  'assets/rwadar-20260820.js',
  'c9417d2d5003bb9a41fee63c7f5ec00f.txt',
  'google6b2e3e5f58b7e557.html',
  'icono-192.png',
  'icono-512.png',
  'icono-maskable-512.png',
  'index.html',
  'manifest.webmanifest',
  'og.png',
  'privacidad.html',
  'robots.txt',
  'rwadar.csv',
  'sitemap.xml',
  'sw.js',
].sort());

function rutaPortable(base, archivo) {
  return path.relative(base, archivo).split(path.sep).join('/');
}

function comprobarOrigenPublico(valor = ORIGEN_PUBLICO) {
  let url;
  try { url = new URL(String(valor || '')); }
  catch { throw new Error('origen público no válido'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      url.pathname !== '/' || url.search || url.hash || url.origin !== String(valor) ||
      url.origin !== ORIGEN_PUBLICO) {
    throw new Error('el origen público debe ser un origen HTTPS exacto, sin credenciales, puerto, ruta, consulta ni fragmento');
  }
  return url.origin;
}

function validarOrigenPublicable(directorio, origen = ORIGEN_PUBLICO) {
  const base = path.resolve(directorio);
  const canonico = comprobarOrigenPublico(origen);
  const leer = nombre => fs.readFileSync(path.join(base, ...nombre.split('/')), 'utf8');
  const index = leer('index.html');
  const privacidad = leer('privacidad.html');
  const robots = leer('robots.txt');
  const sitemap = leer('sitemap.xml');
  const seguridad = leer('.well-known/security.txt');
  const fallos = [];
  if (!index.includes(`<link rel="canonical" href="${canonico}/">`) || index.includes(ORIGEN_LEGADO)) {
    fallos.push('canonical/metadatos de index.html');
  }
  if (!privacidad.includes(`<link rel="canonical" href="${canonico}/privacidad">`)) {
    fallos.push('canonical de privacidad.html');
  }
  if (!robots.includes(`Sitemap: ${canonico}/sitemap.xml`)) fallos.push('robots.txt');
  if (!sitemap.includes(`<loc>${canonico}/</loc>`) ||
      !sitemap.includes(`<loc>${canonico}/privacidad</loc>`) || sitemap.includes(ORIGEN_LEGADO)) {
    fallos.push('sitemap.xml');
  }
  if (!seguridad.includes(`Canonical: ${canonico}/.well-known/security.txt`)) {
    fallos.push('security.txt');
  }
  if (fallos.length) throw new Error(`origen público incoherente en: ${fallos.join(', ')}`);
  return canonico;
}

function listarArchivosRegulares(directorio) {
  const base = path.resolve(directorio);
  const archivos = [];

  function visitar(actual) {
    for (const entrada of fs.readdirSync(actual, { withFileTypes: true })) {
      const archivo = path.join(actual, entrada.name);
      const estado = fs.lstatSync(archivo);
      const relativa = rutaPortable(base, archivo);
      if (estado.isSymbolicLink()) throw new Error(`enlace no permitido: ${relativa}`);
      if (estado.isDirectory()) visitar(archivo);
      else if (estado.isFile()) archivos.push(relativa);
      else throw new Error(`tipo de archivo no permitido: ${relativa}`);
    }
  }

  visitar(base);
  return archivos.sort();
}

function validarArbolPublicable(directorio, esperados = ARCHIVOS_PUBLICABLES) {
  const encontrados = listarArchivosRegulares(directorio);
  const permitidos = [...esperados].sort();
  const conjunto = new Set(permitidos);
  const reales = new Set(encontrados);
  const desconocidos = encontrados.filter(nombre => !conjunto.has(nombre));
  const faltan = permitidos.filter(nombre => !reales.has(nombre));
  if (desconocidos.length) {
    throw new Error(`archivo no permitido en rwadar-site: ${desconocidos.join(', ')}`);
  }
  if (faltan.length) throw new Error(`falta archivo publicable: ${faltan.join(', ')}`);
  return encontrados;
}

function huellaContenido(contenido, longitud = 12) {
  if (!Number.isInteger(longitud) || longitud < 8 || longitud > 64) {
    throw new Error('longitud de huella no válida');
  }
  return crypto.createHash('sha256').update(contenido).digest('hex').slice(0, longitud);
}

function nombreAssetVersionado(nombre, contenido) {
  const normal = String(nombre).split(path.sep).join('/');
  if (!/^assets\/[a-z0-9][a-z0-9._-]*\.(?:css|js)$/i.test(normal)) {
    throw new Error(`asset no versionable: ${nombre}`);
  }
  const extension = path.posix.extname(normal);
  return normal.slice(0, -extension.length) + '.' + huellaContenido(contenido) + extension;
}

function versionCacheDesdeEntradas(entradas) {
  const pares = entradas instanceof Map ? [...entradas.entries()] : Object.entries(entradas);
  const hash = crypto.createHash('sha256');
  /* Orden binario estable: localeCompare puede cambiar entre sistemas/ICU y
     producir una VERSION distinta con exactamente los mismos bytes. */
  for (const [nombre, contenido] of pares.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    hash.update(String(nombre));
    hash.update('\0');
    hash.update(contenido);
    hash.update('\0');
  }
  return `rwadar-v-${hash.digest('hex').slice(0, 16)}`;
}

/* La decisión de publicar con el acuerdo interno aún pendiente debe quedar
   declarada en la propia política. No basta con retirar un blocker: un estado
   ausente, desconocido o contradictorio vuelve a cerrar el despliegue. */
function comprobarEstadoLegalPublicacion(contenido) {
  const privacidad = String(contenido || '');
  if (/\bdata-deploy-blocker\b/i.test(privacidad)) {
    throw new Error('la política de privacidad conserva data-deploy-blocker');
  }
  const patronEstado = /\bdata-deploy-legal-status\s*=\s*(["'])([^"']+)\1/gi;
  const declaraciones = [...privacidad.matchAll(patronEstado)];
  const principales = [...privacidad.matchAll(/<main\b[^>]*>/gi)];
  if (declaraciones.length !== 1 || principales.length !== 1 ||
      !/\bdata-deploy-legal-status\s*=\s*(["'])([^"']+)\1/i.test(principales[0][0])) {
    throw new Error('data-deploy-legal-status debe aparecer una sola vez y dentro de <main>');
  }
  const estado = declaraciones[0][2];
  if (!estado || !ESTADOS_LEGALES_PUBLICABLES.has(estado)) {
    throw new Error('data-deploy-legal-status ausente o no reconocido');
  }
  return estado;
}

async function comprobarConfiguracionAuth({
  fetchFn = globalThis.fetch,
  timeoutMs = 8000,
  signal,
} = {}) {
  if (typeof fetchFn !== 'function') throw new Error('fetch no está disponible');
  const controlador = signal ? null : new AbortController();
  const temporizador = controlador && setTimeout(() => controlador.abort(), timeoutMs);
  if (temporizador && typeof temporizador.unref === 'function') temporizador.unref();

  try {
    const respuesta = await fetchFn(`${SUPABASE_AUTH}/settings`, {
      method: 'GET',
      headers: { apikey: CLAVE_PUBLICA, Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: signal || controlador.signal,
    });
    if (!respuesta || !respuesta.ok) {
      throw new Error(`Auth settings no verificable (HTTP ${respuesta && respuesta.status || 'sin respuesta'})`);
    }
    let ajustes;
    try { ajustes = await respuesta.json(); }
    catch { throw new Error('Auth settings no devolvió JSON válido'); }
    if (!ajustes || ajustes.mailer_autoconfirm !== false) {
      throw new Error('mailer_autoconfirm debe ser exactamente false antes de publicar');
    }
    return ajustes;
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

module.exports = {
  ARCHIVOS_PUBLICABLES,
  ORIGEN_LEGADO,
  ORIGEN_PUBLICO,
  PROYECTO_CLOUDFLARE,
  comprobarConfiguracionAuth,
  comprobarEstadoLegalPublicacion,
  comprobarOrigenPublico,
  huellaContenido,
  listarArchivosRegulares,
  nombreAssetVersionado,
  validarOrigenPublicable,
  validarArbolPublicable,
  versionCacheDesdeEntradas,
};
