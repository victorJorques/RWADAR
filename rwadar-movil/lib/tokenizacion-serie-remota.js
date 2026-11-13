import { serieFinaValida, serieValida, unirSerieFina, validarSerie, validarSerieFina } from './tokenizacion';

/* La serie de un año del gráfico «estilo bolsa» (11/11/2026): la app lee lo
   mismo que la web, el archivo estático /datos/tokenizacion-serie.json de
   rwadar.pages.dev (la suma diaria de los mayores tokens con historia
   completa en CoinGecko, hoy 29 de los 40 mayores, que rehace cada día el
   flujo «Foto diaria de la tokenización»). Sin
   cookies, sin sesión y sin datos del usuario. Diez segundos como mucho; si
   falla, el gráfico lo dice y la cifra de hoy sigue. Una respuesta buena se
   reutiliza 30 minutos en la misma sesión (la serie cambia una vez al día). */
export const URL_SERIE = 'https://rwadar.pages.dev/datos/tokenizacion-serie.json';
const PLAZO_MS = 10000;
const MAX_CARACTERES = 512 * 1024;
export const REUSO_SERIE_MS = 30 * 60000;
let ultima = null;

export function olvidarSerie() { ultima = null; }

export async function cargarSerie({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now } = {}) {
  const t = ahora();
  if (ultima && t - ultima.en >= 0 && t - ultima.en < REUSO_SERIE_MS) return ultima.datos;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_SERIE, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || !r.ok) throw new Error('serie_http_' + (r?.status ?? 0));
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CARACTERES) throw new Error('serie_tamano');
    const datos = JSON.parse(texto);
    if (!serieValida(datos)) throw new Error('serie_forma');
    const serie = validarSerie(datos);
    ultima = { datos: serie, en: t };
    return serie;
  } finally { clearTimeout(reloj); }
}

/* Las series finas (13/11/2026): un punto cada 5 minutos de las últimas 24
   horas y uno cada hora de los últimos 30 días, en un archivo aparte
   (/datos/tokenizacion-serie-fina.json) para que la app ya instalada siga
   leyendo la diaria de siempre. Igual que la diaria: sin cookies, 10 s
   como mucho y reutilizada 30 minutos. Nunca lanza: sin ella (fallo, forma
   rara, una web sin publicar todavía) devuelve null y el gráfico sigue con
   la diaria. */
export const URL_SERIE_FINA = 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json';
const MAX_CARACTERES_FINA = 256 * 1024;
let ultimaFina = null;

export function olvidarSerieFina() { ultimaFina = null; }

export async function cargarSerieFina({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now } = {}) {
  const t = ahora();
  if (ultimaFina && t - ultimaFina.en >= 0 && t - ultimaFina.en < REUSO_SERIE_MS) return ultimaFina.datos;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_SERIE_FINA, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || !r.ok) return null;
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CARACTERES_FINA) return null;
    const datos = JSON.parse(texto);
    if (!serieFinaValida(datos)) return null;
    const fina = validarSerieFina(datos);
    ultimaFina = { datos: fina, en: t };
    return fina;
  } catch {
    return null;
  } finally { clearTimeout(reloj); }
}

/* La diaria con sus finas dentro (unirSerieFina), lista para el gráfico. Si
   la diaria falla, lanza como cargarSerie; si la fina falla o no casa con
   ella, la diaria sola. */
export async function cargarSerieConFina(opciones = {}) {
  const [diaria, fina] = await Promise.all([cargarSerie(opciones), cargarSerieFina(opciones)]);
  return fina ? unirSerieFina(diaria, fina) || diaria : diaria;
}
