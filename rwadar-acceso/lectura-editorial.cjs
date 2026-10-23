'use strict';
const { CONFIGURACION_PUBLICA } = require('./compilar.cjs');

// CLI-only reader. The short-lived account token stays in memory and is never
// written into the generated site, documentation, an argument or a URL.
async function crearLecturaEditorial(token, { fetchImpl = globalThis.fetch, permitirPublicaActual = false } = {}) {
  if ((typeof token !== 'string' || !token) && !permitirPublicaActual) {
    throw new Error('Falta RWADAR_CATALOGO_ACCESS_TOKEN: usa una sesión vigente de cuenta confirmada para sincronizar.');
  }
  if (token) {
    const { crearAccesoServidor } = await import('./servidor.mjs');
    await crearAccesoServidor({ fetchImpl }).verificar(CONFIGURACION_PUBLICA, token);
  }
  return async function leer(url, opciones = {}) {
    const destino = new URL(url);
    if (destino.origin !== CONFIGURACION_PUBLICA.SUPABASE_URL || !destino.pathname.startsWith('/rest/v1/') ||
      destino.username || destino.password || (opciones.method && opciones.method !== 'GET')) {
      throw new Error('La lectura editorial solo admite GET al catálogo del proyecto.');
    }
    const headers = new Headers(opciones.headers);
    headers.set('apikey', CONFIGURACION_PUBLICA.SUPABASE_PUBLISHABLE_KEY);
    if (token) headers.set('Authorization', 'Bearer ' + token);
    else headers.delete('Authorization');
    return fetchImpl(destino.href, { ...opciones, method: 'GET', redirect: 'error', cache: 'no-store', headers });
  };
}
module.exports = { crearLecturaEditorial };
