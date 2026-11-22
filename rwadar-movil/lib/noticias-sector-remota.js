import { URL_CREDITOS, URL_DATOS, validarCreditosFotos, validarNoticias } from './noticias-sector';

/* «Noticias del sector» en la app (10/11/2026): la app lee el mismo archivo
   estático que la web, /datos/noticias-v2.json de rwadar.pages.dev. Sin cookies,
   sin sesión y sin datos del usuario. Diez segundos como mucho; si falla, la
   sección lo dice y ofrece reintentar, y el resto de Inicio sigue igual.
   Una respuesta buena se reutiliza 10 minutos en la misma sesión (como la
   tokenización): volver a Inicio no gasta otra llamada. Los fallos no se
   guardan: «Reintentar» pregunta de nuevo. */
export const URL_NOTICIAS = URL_DATOS;
const PLAZO_MS = 10000;
const MAX_CARACTERES = 256 * 1024;
export const REUSO_MS = 10 * 60000;
let ultima = null;

export function olvidarNoticias() { ultima = null; }

export async function cargarNoticias({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now } = {}) {
  const t = ahora();
  if (ultima && t - ultima.en >= 0 && t - ultima.en < REUSO_MS) return ultima.datos;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_NOTICIAS, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || !r.ok) throw new Error('noticias_http_' + (r?.status ?? 0));
    // Si el servidor anuncia un cuerpo que no puede caber, ni se lee: se corta
    // la descarga. Cada carácter (unidad UTF-16) ocupa como mucho 3 bytes en
    // UTF-8, así que más de 3 × 256 k bytes nunca cabe en 256 k caracteres.
    const anunciado = Number(r.headers?.get?.('content-length'));
    if (Number.isFinite(anunciado) && anunciado > MAX_CARACTERES * 3) { abort?.abort(); throw new Error('noticias_tamano'); }
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CARACTERES) throw new Error('noticias_tamano');
    let datos;
    try { datos = validarNoticias(JSON.parse(texto)); } catch (e) { throw new Error('noticias_forma: ' + e.message); }
    ultima = { datos, en: t };
    return datos;
  } finally { clearTimeout(reloj); }
}

/* El origen y el crédito de cada foto (22/11/2026: fotos reales de Wikimedia
   Commons): /datos/fotos-noticias.json de rwadar.pages.dev, aparte de las
   noticias (la app ya instalada no acepta claves nuevas en noticias-v2.json).
   Nunca lanza: si no llega o no vale, devuelve null y la foto se ve sin
   crédito (nunca con uno falso); las de IA siguen diciendo que lo son (el
   modelo conoce sus claves). Una respuesta buena se reutiliza 10 minutos. */
export const URL_CREDITOS_FOTOS = URL_CREDITOS;
const MAX_CREDITOS = 128 * 1024;
let ultimosCreditos = null;
export function olvidarCreditosFotos() { ultimosCreditos = null; }
export async function cargarCreditosFotos({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now } = {}) {
  const t = ahora();
  if (ultimosCreditos && t - ultimosCreditos.en >= 0 && t - ultimosCreditos.en < REUSO_MS) return ultimosCreditos.datos;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_CREDITOS_FOTOS, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || !r.ok) return null;
    const anunciado = Number(r.headers?.get?.('content-length'));
    if (Number.isFinite(anunciado) && anunciado > MAX_CREDITOS * 3) { abort?.abort(); return null; }
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CREDITOS) return null;
    const datos = validarCreditosFotos(JSON.parse(texto));
    ultimosCreditos = { datos, en: t };
    return datos;
  } catch { return null; } finally { clearTimeout(reloj); }
}
