'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUPABASE_AUTH = 'https://exgpmjpaaebyoolpwced.supabase.co/auth/v1';
const CLAVE_PUBLICA = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';

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
  comprobarConfiguracionAuth,
  huellaContenido,
  listarArchivosRegulares,
  nombreAssetVersionado,
  validarArbolPublicable,
  versionCacheDesdeEntradas,
};
