// Datos de prueba sin red: velas sintéticas con semilla, series y un fetch de
// mentira (también uno que imita las API públicas de los cuatro exchanges).
import { INTERVALOS, prng } from '../lib/comun.mjs';
import { montarSerie } from '../lib/datos.mjs';

export const PATRONES = Object.freeze(['aleatorio', 'tendencia-alcista', 'tendencia-bajista', 'lateral', 'ruptura', 'bandera', 'sobreventa']);

const centimos = x => Math.round(x * 100) / 100;

/**
 * Velas sintéticas reproducibles { t, o, h, l, c, v } (t = apertura en ms UTC).
 * Patrones:
 * - 'aleatorio', 'tendencia-alcista', 'tendencia-bajista', 'lateral'
 * - 'ruptura': lateral estrecho y al final rompe hacia arriba con volumen alto
 * - 'bandera': impulso fuerte, consolidación que retrocede menos del 50 % con
 *   menos volumen y rotura por arriba en las últimas velas
 * - 'sobreventa': caída fuerte (RSI < 30) y rebote en las últimas velas
 */
export function generarVelas({ semilla = 1, n = 500, intervalo = '1h', inicio = Date.UTC(2026, 0, 1), precio = 60000, volatilidad = 0.004, patron = 'aleatorio' } = {}) {
  const ms = INTERVALOS[intervalo];
  if (!ms) throw new Error(`generarVelas: intervalo desconocido «${intervalo}» (hay ${Object.keys(INTERVALOS).join(', ')}).`);
  if (!PATRONES.includes(patron)) throw new Error(`generarVelas: patrón desconocido «${patron}» (hay ${PATRONES.join(', ')}).`);
  if (!Number.isFinite(n) || n < 0) throw new Error(`generarVelas: n debe ser un número de velas ≥ 0 (llegó ${String(n)}).`);
  if (!(Number.isFinite(precio) && precio > 0)) throw new Error(`generarVelas: el precio debe ser positivo (llegó ${String(precio)}).`);
  if (!(Number.isFinite(volatilidad) && volatilidad >= 0)) throw new Error(`generarVelas: la volatilidad debe ser ≥ 0 (llegó ${String(volatilidad)}).`);
  if (!Number.isFinite(inicio)) throw new Error(`generarVelas: el inicio debe ser una hora en ms (llegó ${String(inicio)}).`);
  const total = Math.floor(n);
  const vol = volatilidad;
  const azar = prng(semilla);
  const normal = () => {
    const u = 1 - azar();
    const w = azar();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w);
  };
  const volBase = ms / INTERVALOS['5m']; // ≈ 1 BTC cada 5 minutos
  const t0 = Math.floor(inicio / ms) * ms;
  const velas = [];
  let p = centimos(precio);

  function poner(c, { volumen = 1, mecha = 1 } = {}) {
    const o = p;
    const cierre = centimos(Math.max(0.01, c));
    const arriba = Math.abs(normal()) * vol * 0.5 * mecha;
    const abajo = Math.abs(normal()) * vol * 0.5 * mecha;
    const h = Math.max(centimos(Math.max(o, cierre) * (1 + arriba)), o, cierre);
    const l = Math.max(0.01, Math.min(centimos(Math.min(o, cierre) * (1 - abajo)), o, cierre));
    const v = Number((volBase * volumen * Math.exp(0.35 * normal())).toFixed(8));
    velas.push({ t: t0 + velas.length * ms, o, h, l, c: cierre, v });
    p = cierre;
    return velas.at(-1);
  }
  // Paseo aleatorio con deriva (en múltiplos de la volatilidad).
  const paso = (deriva, ruido = 1) => p * Math.exp(deriva * vol + ruido * vol * normal());
  // Vuelta a la media (Ornstein-Uhlenbeck) alrededor de `ancla`.
  const lateral = (ancla, fuerza, ruido) => p * Math.exp(-fuerza * Math.log(p / ancla) + ruido * vol * normal());

  if (patron === 'aleatorio') {
    while (velas.length < total) poner(paso(0));
  } else if (patron === 'tendencia-alcista' || patron === 'tendencia-bajista') {
    const deriva = patron === 'tendencia-alcista' ? 0.3 : -0.3;
    while (velas.length < total) poner(paso(deriva));
  } else if (patron === 'lateral') {
    while (velas.length < total) poner(lateral(precio, 0.15, 0.6));
  } else if (patron === 'ruptura') {
    const nRotura = Math.min(total, Math.max(2, Math.round(total * 0.01)));
    const b = total - nRotura;
    let techo = -Infinity;
    while (velas.length < b) techo = Math.max(techo, poner(lateral(precio, 0.2, 0.35), { volumen: 0.8, mecha: 0.6 }).h);
    while (velas.length < total) {
      if (velas.length === b) poner(Math.max(paso(2, 0.2), techo * (1 + 1.5 * vol)), { volumen: 5 });
      else poner(paso(0.8, 0.4), { volumen: 2.5 });
    }
  } else if (patron === 'bandera') {
    const nMastil = Math.max(3, Math.round(total * 0.08));
    const nBandera = Math.max(4, Math.round(total * 0.12));
    const nRotura = Math.max(2, Math.round(total * 0.006));
    const iMastil = Math.max(0, total - nRotura - nBandera - nMastil);
    const iBandera = iMastil + nMastil;
    const iRotura = iBandera + nBandera;
    let pie = null;
    let tope = -Infinity;
    let suelo = null;
    let techoBandera = -Infinity;
    while (velas.length < total) {
      const i = velas.length;
      if (i < iMastil) {
        poner(lateral(precio, 0.15, 0.7));
      } else if (i < iBandera) {
        pie ??= p;
        tope = Math.max(tope, poner(paso(0.8, 0.5), { volumen: 2.5 }).c);
      } else if (i < iRotura) {
        pie ??= p;
        if (!Number.isFinite(tope)) tope = p;
        // Suelo al 40 % de retroceso: con las mechas queda por debajo del 50 %.
        suelo ??= tope - 0.4 * (tope - pie);
        let c = paso(-0.15, 0.5);
        if (c < suelo) c = suelo * (1 + 0.2 * vol * Math.abs(normal()));
        if (c > tope) c = tope * (1 - 0.2 * vol * Math.abs(normal()));
        techoBandera = Math.max(techoBandera, poner(c, { volumen: 0.55, mecha: 0.6 }).h);
      } else if (i === iRotura) {
        const techo = Math.max(techoBandera, Number.isFinite(tope) ? tope : p);
        poner(Math.max(paso(1.5, 0.2), techo * (1 + vol)), { volumen: 3.5 });
      } else {
        poner(paso(0.6, 0.3), { volumen: 2.5 });
      }
    }
  } else if (patron === 'sobreventa') {
    const nRebote = Math.max(3, Math.round(total * 0.01));
    const nCaida = Math.max(20, Math.round(total * 0.1));
    const iCaida = Math.max(0, total - nRebote - nCaida);
    const iRebote = Math.max(iCaida, total - nRebote);
    // Caída de al menos ~12 % aunque la serie sea corta (y más si la volatilidad es alta).
    const bajadaPorVela = Math.max(0.8 * vol, 0.13 / nCaida);
    while (velas.length < total) {
      const i = velas.length;
      if (i < iCaida) poner(lateral(precio, 0.15, 0.8));
      else if (i < iRebote) poner(p * Math.exp(-bajadaPorVela + vol * normal()), { volumen: 1.8 });
      else poner(paso(1.5, 0.3), { volumen: 2 });
    }
  }
  return velas;
}

function nombreIntervalo(velas) {
  let minimo = Infinity;
  for (let i = 1; i < velas.length; i++) {
    const d = velas[i].t - velas[i - 1].t;
    if (d > 0 && d < minimo) minimo = d;
  }
  return Object.keys(INTERVALOS).find(k => INTERVALOS[k] === minimo) ?? '1h';
}

/**
 * Serie a partir de velas. Sin `ahora`, todas cuentan como cerradas
 * (ahora = cierre de la última). Sin `intervalo`, se deduce de las velas.
 */
export function serieDe(velas, { intervalo, par = 'BTC-EUR', fuente = 'sintetica', ahora } = {}) {
  const lista = Array.isArray(velas) ? velas : [];
  const nombre = intervalo ?? nombreIntervalo(lista);
  const ms = INTERVALOS[nombre];
  if (!ms) throw new Error(`serieDe: intervalo desconocido «${nombre}».`);
  const momento = ahora ?? (lista.length ? lista.at(-1).t + ms : Date.now());
  return montarSerie({ fuente, par, intervalo: nombre, velas: lista, ahora: momento });
}

// ---------------------------------------------------------------- fetch de mentira

const RESPUESTA = Symbol('respuesta');
const SECUENCIA = Symbol('secuencia');
const COLGADO = Symbol('colgado');

/** Respuesta con código y cabeceras: respuesta(429, { message: '…' }, { 'retry-after': '1' }). */
export function respuesta(status, cuerpo = '', cabeceras = {}) {
  return { [RESPUESTA]: true, status, cuerpo, cabeceras };
}

/** Respuestas sucesivas para la misma ruta (la última se repite). */
export function secuencia(...pasos) {
  return { [SECUENCIA]: pasos };
}

/** Una petición que no contesta nunca (solo acaba si se aborta). */
export const colgado = Object.freeze({ [COLGADO]: true });

/** Fallo de red (fetch rechaza), como un ECONNRESET. */
export function falloRed(codigo = 'ECONNRESET') {
  return new TypeError('fetch failed', { cause: { code: codigo } });
}

function aRespuesta(spec, init) {
  if (spec instanceof Error) return Promise.reject(spec);
  if (spec && spec[COLGADO]) {
    return new Promise((_, rechazar) => {
      init?.signal?.addEventListener('abort', () => rechazar(init.signal.reason ?? new Error('abortada')), { once: true });
    });
  }
  if (spec instanceof Response) return spec.clone();
  if (spec && spec[RESPUESTA]) {
    const cuerpo = typeof spec.cuerpo === 'string' ? spec.cuerpo : JSON.stringify(spec.cuerpo);
    return new Response(cuerpo, { status: spec.status, headers: spec.cabeceras });
  }
  if (typeof spec === 'string') return new Response(spec, { status: 200 });
  return new Response(JSON.stringify(spec ?? null), { status: 200, headers: { 'content-type': 'application/json' } });
}

/**
 * fetch de mentira. `rutas` es un objeto { 'trozo de URL': respuesta }, un Map
 * o un array [[patrón, respuesta]] (patrón: texto contenido, RegExp o función).
 * La respuesta puede ser: datos (JSON 200), texto, Response, respuesta(...),
 * secuencia(...), colgado, un Error (fallo de red) o una función
 * (url, init) => cualquiera de esas. Gana la primera ruta que encaja; si
 * ninguna, 404. Las URL pedidas quedan en `.llamadas`.
 */
export function fetchFalso(rutas = {}) {
  const entradas = rutas instanceof Map ? [...rutas] : Array.isArray(rutas) ? rutas : Object.entries(rutas ?? {});
  const vecesSecuencia = new Map();
  const llamadas = [];
  async function fetchDeMentira(recurso, init = {}) {
    const url = typeof recurso === 'string' ? recurso : recurso instanceof URL ? recurso.href : String(recurso?.url ?? recurso);
    llamadas.push(url);
    if (init?.signal?.aborted) throw init.signal.reason ?? new Error('abortada');
    const indice = entradas.findIndex(([patron]) => (patron instanceof RegExp ? patron.test(url)
      : typeof patron === 'function' ? patron(url) : url.includes(patron)));
    if (indice < 0) return new Response(JSON.stringify({ message: `fetchFalso: sin ruta para ${url}` }), { status: 404 });
    let spec = entradas[indice][1];
    if (spec && spec[SECUENCIA]) {
      const k = vecesSecuencia.get(indice) ?? 0;
      vecesSecuencia.set(indice, k + 1);
      spec = spec[SECUENCIA][Math.min(k, spec[SECUENCIA].length - 1)];
    }
    if (typeof spec === 'function') spec = await spec(url, init);
    return aRespuesta(spec, init);
  }
  fetchDeMentira.llamadas = llamadas;
  return fetchDeMentira;
}

// ---------------------------------------------------------------- mercado de mentira

const KRAKEN_CLAVE = { XBTEUR: 'XXBTZEUR', XBTUSD: 'XXBTZUSD' };
const txt = x => String(x);

/**
 * fetch que imita las API públicas de Coinbase, Binance (data-api), Kraken y
 * Bitstamp con las velas que se le den: { velas: { '5m': [...], '1h': [...] },
 * ahora, fallan: ['coinbase'] }. Respeta los límites reales (Coinbase 300 y
 * sin 4h, Binance 1000, Kraken solo las últimas 720, Bitstamp 1000) y no
 * sirve velas posteriores a `ahora`. El precio de los tickers es el último
 * cierre del intervalo más corto (o `precio`).
 */
export function mercadoFalso({ velas: porIntervalo = {}, ahora = Infinity, fallan = [], precio = null } = {}) {
  const porMs = new Map(Object.entries(porIntervalo).map(([k, v]) => [INTERVALOS[k], v]));
  const visibles = ms => (porMs.get(ms) ?? []).filter(v => v.t <= ahora);
  const masCorto = [...porMs.keys()].sort((a, b) => a - b)[0];
  const ultimo = () => precio ?? visibles(masCorto).at(-1)?.c ?? 60000;
  const caida = fuente => (fallan.includes(fuente) ? respuesta(503, { message: 'Servicio no disponible (simulado)' }) : null);
  const params = url => new URL(url).searchParams;

  return fetchFalso([
    [/api\.exchange\.coinbase\.com\/products\/[^/]+\/candles/, url => {
      if (caida('coinbase')) return caida('coinbase');
      const q = params(url);
      const g = Number(q.get('granularity')) * 1000;
      if (![60_000, 300_000, 900_000, 3_600_000, 21_600_000, 86_400_000].includes(g)) return respuesta(400, { message: 'Unsupported granularity' });
      const s = Date.parse(q.get('start'));
      const e = Date.parse(q.get('end'));
      if ((e - s) / g + 1 > 300) return respuesta(400, { message: 'granularity too small for the requested time range. Count of aggregations requested exceeds 300' });
      return visibles(g).filter(v => v.t >= s && v.t <= e).reverse().map(v => [v.t / 1000, v.l, v.h, v.o, v.c, v.v]);
    }],
    [/api\.exchange\.coinbase\.com\/products\/[^/]+\/ticker/, () => caida('coinbase') ?? {
      ask: txt(ultimo() + 1), bid: txt(ultimo() - 1), price: txt(ultimo()), time: new Date(Math.min(ahora, Date.now())).toISOString(),
    }],
    [/data-api\.binance\.vision\/api\/v3\/klines/, url => {
      if (caida('binance')) return caida('binance');
      const q = params(url);
      const g = INTERVALOS[q.get('interval')];
      if (!g) return respuesta(400, { code: -1120, msg: 'Invalid interval.' });
      const s = Number(q.get('startTime') ?? 0);
      const e = Number(q.get('endTime') ?? Infinity);
      const limite = Math.min(1000, Number(q.get('limit') ?? 500));
      return visibles(g).filter(v => v.t >= s && v.t <= e).slice(0, limite)
        .map(v => [v.t, txt(v.o), txt(v.h), txt(v.l), txt(v.c), txt(v.v), v.t + g - 1, '0', 0, '0', '0', '0']);
    }],
    [/data-api\.binance\.vision\/api\/v3\/ticker\/bookTicker/, () => caida('binance') ?? {
      symbol: 'BTCEUR', bidPrice: txt(ultimo() - 1), bidQty: '0.1', askPrice: txt(ultimo() + 1), askQty: '0.1',
    }],
    [/data-api\.binance\.vision\/api\/v3\/ticker\/price/, () => caida('binance') ?? { symbol: 'BTCEUR', price: txt(ultimo()) }],
    [/api\.kraken\.com\/0\/public\/OHLC/, url => {
      if (caida('kraken')) return caida('kraken');
      const q = params(url);
      const g = Number(q.get('interval')) * 60_000;
      const clave = KRAKEN_CLAVE[q.get('pair')] ?? q.get('pair');
      const desde = Number(q.get('since') ?? 0) * 1000;
      const filas = visibles(g).slice(-720).filter(v => v.t >= desde)
        .map(v => [v.t / 1000, txt(v.o), txt(v.h), txt(v.l), txt(v.c), txt((v.h + v.l + v.c) / 3), txt(v.v), 10]);
      return { error: [], result: { [clave]: filas, last: filas.length ? filas.at(-1)[0] : 0 } };
    }],
    [/api\.kraken\.com\/0\/public\/Ticker/, url => caida('kraken') ?? {
      error: [], result: { [KRAKEN_CLAVE[params(url).get('pair')] ?? 'XXBTZEUR']: { a: [txt(ultimo() + 1), '1', '1.000'], b: [txt(ultimo() - 1), '1', '1.000'], c: [txt(ultimo()), '0.01'] } },
    }],
    [/www\.bitstamp\.net\/api\/v2\/ohlc\//, url => {
      if (caida('bitstamp')) return caida('bitstamp');
      const q = params(url);
      const g = Number(q.get('step')) * 1000;
      const s = Number(q.get('start') ?? 0) * 1000;
      const limite = Math.min(1000, Number(q.get('limit') ?? 1000));
      const ohlc = visibles(g).filter(v => v.t >= s).slice(0, limite).map(v => ({
        timestamp: txt(v.t / 1000), open: txt(v.o), high: txt(v.h), low: txt(v.l), close: txt(v.c), volume: txt(v.v),
      }));
      return { data: { pair: 'BTC/EUR', ohlc } };
    }],
    [/www\.bitstamp\.net\/api\/v2\/ticker\//, () => caida('bitstamp') ?? {
      timestamp: txt(Math.floor(Math.min(ahora, Date.now()) / 1000)), last: txt(ultimo()), bid: txt(ultimo() - 1), ask: txt(ultimo() + 1),
    }],
  ]);
}
