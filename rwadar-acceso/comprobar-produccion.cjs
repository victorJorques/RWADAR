'use strict';
const { CONFIGURACION_PUBLICA } = require('./compilar.cjs');

async function exigirCatalogoPublico({ fetchImpl = globalThis.fetch, plazoMs = 8000 } = {}) {
  const recursos = [
    ['catalogo_plataformas_publicas_v2', 'slug'],
    ['catalogo_ofertas_publicas_v2', 'slug'],
    ['plataformas', 'slug'],
    ['catalogo_publicacion', 'retirado'],
  ];
  for (const [tabla, campo] of recursos) {
    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), plazoMs);
    try {
      const respuesta = await fetchImpl(CONFIGURACION_PUBLICA.SUPABASE_URL + '/rest/v1/' + tabla + '?select=' + campo + '&limit=1',
        { method: 'GET', headers: { apikey: CONFIGURACION_PUBLICA.SUPABASE_PUBLISHABLE_KEY },
          credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controlador.signal });
      if (respuesta.status !== 200) throw new Error('La lectura anónima de ' + tabla + ' no está disponible. Revisa la restauración de los permisos del catálogo.');
      const filas = await respuesta.json();
      if (!Array.isArray(filas) || filas.length !== 1 || !filas[0] ||
          (campo === 'slug' ? typeof filas[0].slug !== 'string' || !filas[0].slug : filas[0].retirado !== false)) {
        throw new Error('La lectura anónima de ' + tabla + ' no acredita un catálogo público completo y disponible.');
      }
    } finally { clearTimeout(reloj); }
  }
}
module.exports = { exigirCatalogoPublico };
