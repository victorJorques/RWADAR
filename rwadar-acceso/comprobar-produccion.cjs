'use strict';
const { CONFIGURACION_PUBLICA } = require('./compilar.cjs');

async function exigirCatalogoPrivado({ fetchImpl = globalThis.fetch, plazoMs = 8000 } = {}) {
  for (const tabla of ['catalogo_plataformas_publicas_v2', 'catalogo_ofertas_publicas_v2']) {
    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), plazoMs);
    try {
      const respuesta = await fetchImpl(CONFIGURACION_PUBLICA.SUPABASE_URL + '/rest/v1/' + tabla + '?select=slug&limit=1',
        { method: 'GET', headers: { apikey: CONFIGURACION_PUBLICA.SUPABASE_PUBLISHABLE_KEY },
          cache: 'no-store', redirect: 'error', signal: controlador.signal });
      if (![401, 403].includes(respuesta.status)) {
        throw new Error('La lectura anónima de ' + tabla + ' no está denegada de forma comprobable. Falta activar y verificar el acceso por cuenta.');
      }
    } finally { clearTimeout(reloj); }
  }
}
module.exports = { exigirCatalogoPrivado };
