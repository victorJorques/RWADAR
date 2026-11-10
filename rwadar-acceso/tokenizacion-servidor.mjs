import tokenizacionModelo from '../rwadar-movil/lib/tokenizacion.js';

/* GET /api/tokenizacion (10/11/2026): la tokenización
   en el mundo para la portada de la web y para la app. Público, sin sesión y
   sin cookies: nunca lee ni reenvía la cookie de nadie.

   El servidor lee CoinGecko (gratis, sin clave) y no el navegador: el
   visitante solo habla con rwadar.pages.dev, así que ni la privacidad ni la
   CSP cambian. La lectura se guarda 30 minutos en la memoria del worker y en
   la Cache API de Cloudflare (si el sitio la tiene; si no, solo memoria). Si
   CoinGecko falla o responde 429, no se le vuelve a preguntar en 5 minutos
   (o lo que diga su Retry-After, hasta 1 hora) y se responde con la última
   foto guardada, con su fecha y «fuente: foto-guardada».

   La historia de fotos diarias es un archivo estático del despliegue
   (/datos/tokenizacion-historico.json): lo copia rwadar-publicar.js desde la
   rama «datos-tokenizacion», que rellena a diario el flujo «Foto diaria de
   la tokenización». Los periodos se calculan en rwadar-movil/lib/tokenizacion.js
   y solo con fotos reales. */
const RUTA_HISTORICO = '/datos/tokenizacion-historico.json';
const CLAVE_CACHE = '/__rwadar-cache/tokenizacion-coingecko-v1';
const FRESCA_MS = 30 * 60000;
const GUARDADA_MAX_MS = 36 * 3600000;
const ESPERA_FALLO_MS = 5 * 60000;
const ESPERA_MAX_MS = 3600000;
const MAX_COINGECKO = 4 * 1024 * 1024;
const MAX_HISTORICO = 2 * 1024 * 1024;
// Fijo y neutro: sin datos del visitante. Las subpeticiones del worker no
// llevan ninguno y la API gratuita limita antes a los clientes anónimos.
const USER_AGENT = 'RWAdar/1.0 (+https://rwadar.pages.dev)';

function entradaValida(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const leidaEn = Number.isFinite(e.leidaEn) ? e.leidaEn : 0;
  const reintentarDesde = Number.isFinite(e.reintentarDesde) ? e.reintentarDesde : 0;
  let foto = null;
  if (e.foto) { try { foto = tokenizacionModelo.validarFoto(e.foto); } catch { foto = null; } }
  return { foto, leidaEn: foto ? leidaEn : 0, reintentarDesde };
}

export function crearTokenizacionServidor({ fetchImpl, ahora = Date.now, plazoMs = 6000, cache, respuesta, leerTexto }) {
  // undefined: la Cache API del worker si existe; null: sin Cache API (pruebas).
  const cacheApi = () => (cache !== undefined ? cache : globalThis.caches?.default || null);
  let memoria = null;
  // Las peticiones que llegan a la vez con la caché fría comparten una sola
  // lectura de CoinGecko: así la portada no provoca un 429 por sí sola.
  let enVuelo = null;

  async function leerCache(origen) {
    const c = cacheApi();
    if (!c) return null;
    try {
      const r = await c.match(new Request(origen + CLAVE_CACHE));
      return r ? entradaValida(JSON.parse(await leerTexto(r, 256 * 1024))) : null;
    } catch { return null; }
  }
  function guardar(origen, entrada, waitUntil) {
    memoria = entrada;
    const c = cacheApi();
    if (!c) return;
    const escribir = Promise.resolve().then(() => c.put(new Request(origen + CLAVE_CACHE), new Response(JSON.stringify(entrada), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=' + Math.ceil(GUARDADA_MAX_MS / 1000) } })))
      .catch(() => {});
    if (typeof waitUntil === 'function') { try { waitUntil(escribir); } catch { /* sin waitUntil */ } }
  }

  async function pedirCoinGecko() {
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), plazoMs);
    try {
      // Sin cookies ni cabeceras del visitante; las redirecciones no se siguen.
      const r = await fetchImpl(tokenizacionModelo.FUENTE.api, { method: 'GET', redirect: 'manual', signal: abort.signal,
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT } });
      if (!r.ok) {
        const error = new Error('coingecko_' + r.status);
        const retry = r.headers.get('retry-after') || '';
        if (/^[0-9]{1,6}$/.test(retry)) error.esperaMs = Math.min(ESPERA_MAX_MS, Math.max(ESPERA_FALLO_MS, Number(retry) * 1000));
        if (r.body) await r.body.cancel().catch(() => {});
        throw error;
      }
      return tokenizacionModelo.extraerFoto(JSON.parse(await leerTexto(r, MAX_COINGECKO)), { ahora: ahora() });
    } finally { clearTimeout(timer); }
  }

  /* { foto, fuente }: la foto de CoinGecko de ahora, o la guardada más reciente. */
  async function fotoActual(origen, waitUntil) {
    const t = ahora();
    const entrada = memoria || await leerCache(origen) || { foto: null, leidaEn: 0, reintentarDesde: 0 };
    if (entrada.foto && t - entrada.leidaEn >= 0 && t - entrada.leidaEn < FRESCA_MS) return { foto: entrada.foto, fuente: 'coingecko' };
    if (!(entrada.reintentarDesde > t)) {
      try {
        const nueva = !enVuelo;
        if (nueva) enVuelo = pedirCoinGecko().finally(() => { enVuelo = null; });
        const pendiente = enVuelo;
        const foto = await pendiente;
        if (nueva) guardar(origen, { foto, leidaEn: t, reintentarDesde: 0 }, waitUntil);
        return { foto, fuente: 'coingecko' };
      } catch (error) {
        guardar(origen, { ...entrada, reintentarDesde: t + (error.esperaMs || ESPERA_FALLO_MS) }, waitUntil);
      }
    } else if (!memoria) memoria = entrada;
    if (entrada.foto && t - entrada.leidaEn < GUARDADA_MAX_MS) return { foto: entrada.foto, fuente: 'foto-guardada' };
    return { foto: null, fuente: 'foto-guardada' };
  }

  async function leerHistorico(activo, origen) {
    try {
      const r = await activo(origen + RUTA_HISTORICO);
      if (!r || r.status !== 200) { await r?.body?.cancel().catch(() => {}); return tokenizacionModelo.historicoVacio(); }
      return tokenizacionModelo.validarHistorico(JSON.parse(await leerTexto(r, MAX_HISTORICO)));
    } catch { return tokenizacionModelo.historicoVacio(); }
  }

  return async function atenderTokenizacion({ request, url, activo, waitUntil }) {
    if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405, { Allow: 'GET' });
    if (url.search) return respuesta({ error: 'solicitud_invalida' }, 400);
    const [historico, actual] = await Promise.all([
      typeof activo === 'function' ? leerHistorico(activo, url.origin) : tokenizacionModelo.historicoVacio(),
      fotoActual(url.origin, waitUntil),
    ]);
    return respuesta(tokenizacionModelo.resumir({ historico, actual: actual.foto, fuente: actual.fuente }));
  };
}
