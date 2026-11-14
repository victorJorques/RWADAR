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

/* GET /api/tokenizacion/directo (14/11/2026): el gráfico en directo. La base
   (migración 35) pide a CoinGecko cada 5 minutos y guarda un documento
   compacto; este servidor lo lee con la clave publicable
   (public.tokenizacion_directo(), sin cookies ni sesión de nadie), lo pasa
   al formato de tokenizacion-serie-fina.json con directoAFina (que lo valida
   con validarSerieFina, el de siempre) y lo sirve como
   { version: 1, fina, sinLectura }. Lo lee el servidor y no el navegador ni
   la app: la salida de Supabase es como mucho una lectura cada 5 minutos por
   copia del servidor, la IP del visitante no llega a Supabase, la CSP no
   cambia y, sin parámetros, nadie se salta la memoria.
   Respuestas:
     200 el directo, si casa con la diaria de este despliegue (mismos
         tokens), tiene como mucho 20 minutos (y no más de 5 «del futuro»)
         y la base leyó la diaria hace menos de 45 minutos;
     404 {"error":"directo_apagado"}: sin la 35, deshecha o apagada (sin aviso);
     503 {"error": directo_sin_datos | directo_no_valido | directo_no_casa |
         directo_atrasado | directo_no_responde}. Si Supabase no responde y
         hay uno guardado de 20 minutos o menos, ese (200).
   Memoria: el bueno, hasta su siguiente dato (generado + 6,5 minutos; entre
   15 s y 5 minutos; si ya pasó, 60 s: una racha de 429 no hace leer a
   Supabase cada 15 s); «apagado», 5 minutos; los fallos, 60 s. Las
   peticiones a la vez comparten una sola lectura. */
const DIRECTO_MAX_BYTES = 64 * 1024;
const DIRECTO_MAX_MS = 20 * 60000;
const DIRECTO_FUTURO_MS = 5 * 60000;
const DIARIA_LEIDA_MAX_MS = 45 * 60000;
const RUTA_DIARIA = '/datos/tokenizacion-serie.json';
const MAX_DIARIA = 256 * 1024;
const DIARIA_MEMORIA_MS = 10 * 60000;
const APAGADO_MEMORIA_MS = 5 * 60000;
const FALLO_MEMORIA_MS = 60000;
const SIGUIENTE_MS = 6.5 * 60000;

export function crearTokenizacionDirectoServidor({ api, ahora = Date.now, respuesta, leerTexto }) {
  let bueno = null;   // { estado: 200, cuerpo, generadoMs, hasta }
  let fallo = null;   // { estado, cuerpo, hasta, caido }
  let diaria = null;  // { tokens, hasta }
  let enVuelo = null;

  async function tokensDiaria(activo, origen) {
    const t = ahora();
    if (diaria && diaria.hasta > t) return diaria.tokens;
    let tokens = null;
    try {
      const r = typeof activo === 'function' ? await activo(origen + RUTA_DIARIA) : null;
      if (r && r.status === 200) tokens = tokenizacionModelo.validarSerie(JSON.parse(await leerTexto(r, MAX_DIARIA))).tokens;
      else await r?.body?.cancel().catch(() => {});
    } catch { tokens = null; }
    diaria = { tokens, hasta: t + DIARIA_MEMORIA_MS };
    return tokens;
  }

  /* Lee la base y decide: { estado, cuerpo, hasta } (para servir y guardar). */
  async function leer(env, activo, origen) {
    const t = ahora();
    let r;
    try {
      r = await api(env, '/rest/v1/rpc/tokenizacion_directo', { method: 'POST', data: {}, maxBytes: DIRECTO_MAX_BYTES });
    } catch (error) {
      // PostgREST 404: la función no existe (sin la 35 o deshecha) = apagado.
      if (error?.status === 404) return { estado: 404, cuerpo: { error: 'directo_apagado' }, hasta: t + APAGADO_MEMORIA_MS };
      return { estado: 503, cuerpo: { error: 'directo_no_responde' }, hasta: t + FALLO_MEMORIA_MS, caido: true };
    }
    const no = error => ({ estado: 503, cuerpo: { error }, hasta: t + FALLO_MEMORIA_MS });
    if (!r || typeof r !== 'object' || Array.isArray(r)) return no('directo_no_valido');
    if (r.estado === 'apagado') return { estado: 404, cuerpo: { error: 'directo_apagado' }, hasta: t + APAGADO_MEMORIA_MS };
    if (r.estado === 'sin_datos') return no('directo_sin_datos');
    if (r.estado !== 'ok') return no('directo_no_valido');
    let d;
    try { d = tokenizacionModelo.directoAFina(r.doc); } catch { return no('directo_no_valido'); }
    // Sin ninguna serie no hay nada que pintar: 503 (lo ven la alarma diaria y comprobar-publicado), no un 200 vacío.
    if (!d.fina.series['5m'] && !d.fina.series['1h']) return no('directo_no_valido');
    const generadoMs = Date.parse(d.fina.generado), edad = t - generadoMs;
    if (edad > DIRECTO_MAX_MS || edad < -DIRECTO_FUTURO_MS) return no('directo_atrasado');
    // La base relee la lista de la diaria publicada cada 15 minutos: si lleva
    // más de 45 sin poder, el directo puede estar sumando otra lista.
    const leida = d.diariaLeida ? Date.parse(d.diariaLeida) : NaN;
    if (!(t - leida <= DIARIA_LEIDA_MAX_MS)) return no('directo_atrasado');
    const tokens = await tokensDiaria(activo, origen);
    if (!tokens || tokens.length !== d.fina.tokens.length || !tokens.every(x => d.fina.tokens.includes(x))) return no('directo_no_casa');
    const siguiente = generadoMs + SIGUIENTE_MS;
    const hasta = siguiente <= t ? t + FALLO_MEMORIA_MS : Math.min(Math.max(siguiente, t + 15000), t + APAGADO_MEMORIA_MS);
    return { estado: 200, cuerpo: { version: 1, fina: d.fina, sinLectura: d.sinLectura }, generadoMs, hasta };
  }

  function servir(e, t) {
    const segundos = Math.max(0, Math.ceil((e.hasta - t) / 1000));
    return respuesta(e.cuerpo, e.estado, { 'Cache-Control': 'public, max-age=' + (e.estado === 200 ? Math.min(segundos, 300) : 60) });
  }
  // Supabase caído: lo guardado, mientras tenga 20 minutos o menos.
  const guardado = t => (bueno && t - bueno.generadoMs <= DIRECTO_MAX_MS ? { ...bueno, hasta: Math.min(t + FALLO_MEMORIA_MS, bueno.generadoMs + DIRECTO_MAX_MS) } : null);

  return async function atenderDirecto({ request, url, env, activo }) {
    if (request.method !== 'GET') return respuesta({ error: 'metodo_no_permitido' }, 405, { Allow: 'GET' });
    if (url.search) return respuesta({ error: 'solicitud_invalida' }, 400);
    const t = ahora();
    if (bueno && bueno.hasta > t) return servir(bueno, t);
    if (fallo && fallo.hasta > t) return servir((fallo.caido && guardado(t)) || fallo, t);
    if (!enVuelo) enVuelo = leer(env, activo, url.origin).finally(() => { enVuelo = null; });
    const e = await enVuelo;
    const t2 = ahora();
    if (e.estado === 200) { bueno = e; fallo = null; return servir(e, t2); }
    fallo = e;
    if (e.caido) { const g = guardado(t2); if (g) return servir(g, t2); }
    else bueno = null;
    return servir(e, t2);
  };
}
