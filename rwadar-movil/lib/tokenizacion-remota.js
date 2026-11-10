import { resumenValido } from './tokenizacion';

/* «La tokenización en el mundo» en la app (10/11/2026): la app lee lo mismo
   que la web, de nuestro servidor (que a su vez lee CoinGecko). Sin cookies,
   sin sesión y sin datos del usuario. Diez segundos como mucho; si falla, la
   sección lo dice y el resto de Inicio sigue igual.
   Una respuesta buena se reutiliza 10 minutos en la misma sesión: volver a
   Inicio no gasta otra llamada al servidor web (cada una cuenta en el cupo
   diario de Pages Functions). Los fallos no se guardan: «Reintentar» pregunta. */
export const URL_TOKENIZACION = 'https://rwadar.pages.dev/api/tokenizacion';
const PLAZO_MS = 10000;
const MAX_CARACTERES = 512 * 1024;
export const REUSO_MS = 10 * 60000;
let ultima = null;

export function olvidarTokenizacion() { ultima = null; }

export async function cargarTokenizacion({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_MS, ahora = Date.now } = {}) {
  const t = ahora();
  if (ultima && t - ultima.en >= 0 && t - ultima.en < REUSO_MS) return ultima.datos;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_TOKENIZACION, { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || !r.ok) throw new Error('tokenizacion_http_' + (r?.status ?? 0));
    const texto = await r.text();
    if (typeof texto !== 'string' || texto.length > MAX_CARACTERES) throw new Error('tokenizacion_tamano');
    const datos = JSON.parse(texto);
    if (!resumenValido(datos)) throw new Error('tokenizacion_forma');
    if (datos.fuente !== 'sin-datos') ultima = { datos, en: t };
    return datos;
  } finally { clearTimeout(reloj); }
}
