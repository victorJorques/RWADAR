/* =====================================================================
   RWAdar · panel · velocidad real de la web
   ---------------------------------------------------------------------
   Lo que tarda la web a la gente de verdad (Web Analytics, últimos 7
   días, que es lo que Cloudflare cuenta sin muestreo), separado en móvil
   y ordenador. Se da el valor que cumple el 75 % de las visitas (p75),
   como hace Google, con sus umbrales:
     LCP (cuándo se ve lo principal)    bien ≤ 2,5 s · mal > 4 s
     INP (cuánto tarda en reaccionar)   bien ≤ 200 ms · mal > 500 ms
     CLS (cuánto «salta» la página)     bien ≤ 0,1  · mal > 0,25
   Cloudflare da los tiempos en microsegundos y -1 cuando no hay dato.
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedirJson } = require('./pedir');

const HEX = /^[0-9a-f]{32}$/i;
const UMBRALES = Object.freeze({ lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25] });
/* Con menos visitas medidas no se da nota: una sola visita lenta la
   estropea (el 23/10/2026 el ordenador tenía 7 y salía «mejorable»). */
const MINIMO_MUESTRAS = 10;

const ms = v => (typeof v === 'number' && v >= 0 ? Math.round(v / 1000) : null);
const nota = (valor, [bien, mal]) => valor === null ? 'sin-datos' : valor <= bien ? 'ok' : valor <= mal ? 'aviso' : 'fallo';

function crearVelocidad(config) {
  async function ultimos7Dias(ahora = new Date()) {
    if (!config.cloudflareToken) throw new FaltaCredencial('Cloudflare', 'ver la velocidad de la web');
    if (!HEX.test(config.cloudflareCuenta) || !HEX.test(config.sitioAnalitica)) throw new ErrorPanel('Cuenta o sitio de Cloudflare no válidos', { estado: 400 });
    const iso = d => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const filtro = `{AND: [{datetime_geq: "${iso(new Date(ahora.getTime() - 7 * 86400000))}"}, {datetime_leq: "${iso(ahora)}"}, {siteTag: "${config.sitioAnalitica}"}, {bot: 0}]}`;
    const query = `query { viewer { accounts(filter: {accountTag: "${config.cloudflareCuenta}"}) {
      vitales: rumWebVitalsEventsAdaptiveGroups(filter: ${filtro}, limit: 5) { count quantiles { largestContentfulPaintP75 interactionToNextPaintP75 cumulativeLayoutShiftP75 } dimensions { deviceType } }
      carga: rumPerformanceEventsAdaptiveGroups(filter: ${filtro}, limit: 5) { count quantiles { pageLoadTimeP50 pageLoadTimeP75 } dimensions { deviceType } }
    } } }`;
    const r = await pedirJson(`${config.cloudflareApi}/graphql`, { method: 'POST', headers: { Authorization: `Bearer ${config.cloudflareToken}` }, cuerpo: { query } });
    if (r.datos?.errors?.length) throw new ErrorPanel(`Cloudflare: ${r.datos.errors[0].message}`, { estado: 502 });
    const c = r.datos?.data?.viewer?.accounts?.[0] || {};
    const por = (filas, tipo) => (filas || []).find(f => f.dimensions?.deviceType === tipo);
    const aparato = tipo => {
      const v = por(c.vitales, tipo);
      const p = por(c.carga, tipo);
      const lcp = ms(v?.quantiles?.largestContentfulPaintP75);
      const inp = ms(v?.quantiles?.interactionToNextPaintP75);
      const clsBruto = v?.quantiles?.cumulativeLayoutShiftP75;
      const cls = typeof clsBruto === 'number' && clsBruto >= 0 ? Math.round(clsBruto * 1000) / 1000 : null;
      return {
        muestras: Math.max(v?.count || 0, p?.count || 0),
        cargaMediana: ms(p?.quantiles?.pageLoadTimeP50),
        carga75: ms(p?.quantiles?.pageLoadTimeP75),
        lcp, inp, cls,
        notas: { lcp: nota(lcp, UMBRALES.lcp), inp: nota(inp, UMBRALES.inp), cls: nota(cls, UMBRALES.cls) },
      };
    };
    return { movil: aparato('mobile'), ordenador: aparato('desktop'), umbrales: UMBRALES, minimoMuestras: MINIMO_MUESTRAS };
  }

  return { ultimos7Dias };
}

module.exports = { crearVelocidad, UMBRALES, MINIMO_MUESTRAS };
