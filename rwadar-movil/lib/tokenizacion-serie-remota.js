import { edadDirecto, motivoDirecto, serieFinaValida, serieValida, transcurridoMs, unirDirecto, unirSerieFina, validarDirecto, validarSerie,
  validarSerieFina } from './tokenizacion';

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

/* El gráfico en directo (14/11/2026): Supabase pide a CoinGecko cada 5
   minutos (migración 35) y el servidor de la web lo sirve en
   /api/tokenizacion/directo. Sin cookies ni datos del usuario, 10 s como
   mucho y 128 kB. Nunca lanza: { cuerpo, edadMs } o { motivo } ('apagado',
   'no_casa', 'atrasado', 'no_valido', 'sin_datos', 'no_responde' o 'red').
   La edad del dato se mide con el reloj del servidor (la cabecera Date) más
   lo que ha pasado desde que llegó: el mayor de performance.now() (que en
   algunos móviles se para mientras el aparato duerme) y Date.now() (que
   salta si cambia la hora). Una respuesta buena se reutiliza 4 minutos. */
export const URL_DIRECTO = 'https://rwadar.pages.dev/api/tokenizacion/directo';
const MAX_CARACTERES_DIRECTO = 128 * 1024;
export const REUSO_DIRECTO_MS = 4 * 60000;
const SIGUIENTE_MS = 6.5 * 60000;
export const REFRESCO_MS = 5 * 60000;
let ultimoDirecto = null;
const relojMonotono = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : NaN);

export function olvidarDirecto() { ultimoDirecto = null; }

export async function cargarDirecto({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now, monotono = relojMonotono } = {}) {
  if (ultimoDirecto) {
    const pasado = transcurridoMs({ perf0: ultimoDirecto.perf0, perf1: monotono(), fecha0: ultimoDirecto.fecha0, fecha1: ahora() });
    if (pasado < REUSO_DIRECTO_MS) {
      return { cuerpo: ultimoDirecto.cuerpo, edadMs: edadDirecto({ generado: ultimoDirecto.cuerpo.fina.generado, fechaServidor: ultimoDirecto.fechaServidor,
        transcurrido: pasado, ahora: ahora() }) };
    }
    ultimoDirecto = null;
  }
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_DIRECTO, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r) return { motivo: 'red' };
    const fechaServidor = r.headers && typeof r.headers.get === 'function' ? r.headers.get('date') : null;
    const perf0 = monotono(), fecha0 = ahora();
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CARACTERES_DIRECTO) return { motivo: 'red' };
    let cuerpo = null;
    try { cuerpo = JSON.parse(texto); } catch { cuerpo = null; }
    if (r.status !== 200) return { motivo: motivoDirecto(r.status, cuerpo) };
    try { validarDirecto(cuerpo); } catch { return { motivo: 'no_valido' }; }
    ultimoDirecto = { cuerpo, fechaServidor, perf0, fecha0 };
    const transcurrido = transcurridoMs({ perf0, perf1: monotono(), fecha0, fecha1: ahora() });
    return { cuerpo, edadMs: edadDirecto({ generado: cuerpo.fina.generado, fechaServidor, transcurrido, ahora: ahora() }) };
  } catch {
    return { motivo: 'red' };
  } finally { clearTimeout(reloj); }
}

/* La serie que pinta la app y de dónde sale, como en la web: a la vez la
   diaria y el directo; si el directo vale y casa (unirDirecto), «directo».
   Si no, la fina publicada (solo entonces se pide), si casa con la diaria
   (unirSerieFina): «archivo»; si tampoco, la diaria sola. { serie, origen,
   motivo, proximo } (proximo: cuándo volver a pedir, en Date.now()). Si la
   diaria falla, lanza como cargarSerie. */
export async function cargarSerieConDirecto(opciones = {}) {
  const ahora = opciones.ahora || Date.now;
  const [diaria, directo] = await Promise.all([cargarSerie(opciones), cargarDirecto(opciones)]);
  let motivo = directo.motivo || null;
  if (!motivo) {
    const r = unirDirecto(diaria, directo.cuerpo, { edadMs: directo.edadMs });
    if (r.serie) return { serie: r.serie, origen: 'directo', motivo: null, proximo: ahora() + Math.max(15000, SIGUIENTE_MS - directo.edadMs) };
    motivo = r.motivo;
  }
  const fina = await cargarSerieFina(opciones);
  const unida = fina ? unirSerieFina(diaria, fina) : null;
  // Apagado a propósito no se vuelve a preguntar tan a menudo.
  const proximo = ahora() + (motivo === 'apagado' ? 3 : 1) * REFRESCO_MS;
  if (unida && unida.fina) return { serie: unida, origen: 'archivo', motivo, proximo };
  return { serie: diaria, origen: 'diaria', motivo, proximo };
}
