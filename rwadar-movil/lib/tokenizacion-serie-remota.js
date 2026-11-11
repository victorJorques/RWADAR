import { serieValida, validarSerie } from './tokenizacion';

/* La serie de un año del gráfico «estilo bolsa» (11/11/2026): la app lee lo
   mismo que la web, el archivo estático /datos/tokenizacion-serie.json de
   rwadar.pages.dev (la suma diaria de los 40 mayores tokens de CoinGecko,
   que rehace cada día el flujo «Foto diaria de la tokenización»). Sin
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
