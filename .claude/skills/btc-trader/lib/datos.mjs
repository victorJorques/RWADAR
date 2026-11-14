// Datos de mercado públicos (solo lectura, sin claves): velas y precio de
// BTC en Coinbase, Binance (data-api.binance.vision), Kraken y Bitstamp.
// Nada aquí opera ni manda órdenes.
import fs from 'node:fs';
import path from 'node:path';
import { INTERVALOS, msIntervalo, dirEstado, escribirJsonAtomico, mediana, esperar as esperarReal } from './comun.mjs';

export const FUENTES = Object.freeze(['coinbase', 'binance', 'kraken', 'bitstamp']);

export const PARES = Object.freeze({
  'BTC-EUR': Object.freeze({ coinbase: 'BTC-EUR', binance: 'BTCEUR', kraken: 'XBTEUR', bitstamp: 'btceur', moneda: 'EUR' }),
  'BTC-USD': Object.freeze({ coinbase: 'BTC-USD', binance: 'BTCUSDT', kraken: 'XBTUSD', bitstamp: 'btcusd', moneda: 'USD' }),
});

const NOMBRE = { coinbase: 'Coinbase', binance: 'Binance', kraken: 'Kraken', bitstamp: 'Bitstamp' };

const BASE = {
  coinbase: 'https://api.exchange.coinbase.com',
  // api.binance.com da 451 desde aquí; el espejo público de datos sí responde.
  binance: 'https://data-api.binance.vision',
  kraken: 'https://api.kraken.com',
  bitstamp: 'https://www.bitstamp.net',
};

// Coinbase no tiene 4h: se agrega desde 1h (ver velasDeFuente).
const COINBASE_GRANULARIDAD = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 };
const KRAKEN_MINUTOS = { '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440 };
const BITSTAMP_PASO = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400 };
const POR_PETICION = { coinbase: 300, binance: 1000, bitstamp: 1000 };
const KRAKEN_MAX = 720; // Kraken solo devuelve las últimas 720 velas, pidas lo que pidas.

const LIMITE_POR_DEFECTO = 300;
const LIMITE_MAXIMO = 200_000;
const VERSION_CACHE = 1;
const MAX_VELAS_CACHE = 50_000;
const AGENTE = 'btc-papel/1.0 (solo lectura)';

/** Error de una fuente de datos, con la fuente y si merece la pena reintentar. */
export class ErrorDatos extends Error {
  constructor(mensaje, { fuente = null, status = null, reintentable = false, esperaMs = null } = {}) {
    super(mensaje);
    this.name = 'ErrorDatos';
    this.fuente = fuente;
    this.status = status;
    this.reintentable = reintentable;
    this.esperaMs = esperaMs;
  }
}

// ---------------------------------------------------------------- utilidades

const num = x => (typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN);

function aMs(x, que) {
  if (x === undefined || x === null) return null;
  const ms = x instanceof Date ? x.getTime() : typeof x === 'string' ? Date.parse(x) : x;
  if (typeof ms !== 'number' || !Number.isFinite(ms)) {
    throw new Error(`«${que}» no es una fecha válida (${String(x)}).`);
  }
  return ms;
}

const iso = ms => new Date(ms).toISOString().replace('.000Z', 'Z');
const fechaUtc = ms => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

/** Vela válida o null: números finitos, precios > 0, l ≤ o,c ≤ h y volumen ≥ 0. */
function hacerVela(t, o, h, l, c, v) {
  const vela = { t: num(t), o: num(o), h: num(h), l: num(l), c: num(c), v: num(v) };
  for (const k of ['t', 'o', 'h', 'l', 'c', 'v']) if (!Number.isFinite(vela[k])) return null;
  if (!Number.isInteger(vela.t) || vela.o <= 0 || vela.l <= 0 || vela.v < 0) return null;
  if (vela.l > Math.min(vela.o, vela.c) || vela.h < Math.max(vela.o, vela.c)) return null;
  return vela;
}

function filas(lista, convertir) {
  const velas = [];
  let descartadas = 0;
  for (const fila of lista) {
    const v = convertir(fila);
    if (v) velas.push(v); else descartadas++;
  }
  return { velas: ordenarUnicas(velas), descartadas };
}

/** Orden ascendente y sin duplicados (si una hora se repite, gana la última que llegó). */
export function ordenarUnicas(velas) {
  const porHora = new Map();
  for (const v of velas) porHora.set(v.t, v);
  return [...porHora.values()].sort((a, b) => a.t - b.t);
}

function malFormato(fuente, que, json) {
  const muestra = JSON.stringify(json)?.slice(0, 120) ?? String(json);
  return new ErrorDatos(`${NOMBRE[fuente]} devolvió algo que no son ${que}: ${muestra}`, { fuente });
}

function precioValido(fuente, p) {
  if (!(Number.isFinite(p.precio) && p.precio > 0)) {
    throw new ErrorDatos(`${NOMBRE[fuente]} devolvió un precio que no es un número válido.`, { fuente });
  }
  for (const k of ['compra', 'venta']) if (!(Number.isFinite(p[k]) && p[k] > 0)) p[k] = null;
  if (!Number.isFinite(p.hora)) p.hora = null;
  return p;
}

function errorKraken(json) {
  const errores = Array.isArray(json?.error) ? json.error : [];
  if (!errores.length) return null;
  const texto = errores.join('; ');
  // Límite de peticiones o servicio ocupado: merece reintentar.
  const reintentable = /rate limit|too many|unavailable|busy|timeout/i.test(texto);
  return new ErrorDatos(`Kraken: ${texto}`, { fuente: 'kraken', reintentable });
}

function claveKraken(result) {
  if (!result || typeof result !== 'object') return null;
  return Object.keys(result).find(k => k !== 'last' && result[k] && typeof result[k] === 'object') ?? null;
}

// ---------------------------------------------------------------- lectores
// Convierten la respuesta real de cada exchange en velas { t, o, h, l, c, v }
// (t = apertura en ms UTC) o en { precio, compra, venta, hora }.
// compra = mejor precio al que se puede COMPRAR (ask); venta = al que se puede VENDER (bid).

export const lectores = Object.freeze({
  coinbase: {
    // [[time s, low, high, open, close, volume], …] del más nuevo al más viejo
    velas(json) {
      if (!Array.isArray(json)) throw malFormato('coinbase', 'velas', json);
      return filas(json, f => (Array.isArray(f) ? hacerVela(num(f[0]) * 1000, f[3], f[2], f[1], f[4], f[5]) : null));
    },
    precio(json) {
      if (!json || typeof json !== 'object') throw malFormato('coinbase', 'un precio', json);
      return precioValido('coinbase', {
        precio: num(json.price), compra: num(json.ask), venta: num(json.bid), hora: Date.parse(json.time),
      });
    },
  },
  binance: {
    // [[openTime ms, "o", "h", "l", "c", "v", closeTime, …], …] ascendente
    velas(json) {
      if (!Array.isArray(json)) throw malFormato('binance', 'velas', json);
      return filas(json, f => (Array.isArray(f) ? hacerVela(f[0], f[1], f[2], f[3], f[4], f[5]) : null));
    },
    // Binance da el libro (bookTicker) y el último precio (ticker/price) por separado.
    precio(libro, ultimo) {
      if (!libro || typeof libro !== 'object' || !ultimo || typeof ultimo !== 'object') {
        throw malFormato('binance', 'un precio', { libro, ultimo });
      }
      return precioValido('binance', {
        precio: num(ultimo.price), compra: num(libro.askPrice), venta: num(libro.bidPrice), hora: null,
      });
    },
  },
  kraken: {
    // { error: [], result: { XXBTZEUR: [[time s, "o", "h", "l", "c", "vwap", "v", n], …], last } }
    velas(json) {
      const error = errorKraken(json);
      if (error) throw error;
      const clave = claveKraken(json?.result);
      if (!clave || !Array.isArray(json.result[clave])) throw malFormato('kraken', 'velas', json);
      return filas(json.result[clave], f => (Array.isArray(f) ? hacerVela(num(f[0]) * 1000, f[1], f[2], f[3], f[4], f[6]) : null));
    },
    precio(json) {
      const error = errorKraken(json);
      if (error) throw error;
      const clave = claveKraken(json?.result);
      const d = clave ? json.result[clave] : null;
      if (!d || !Array.isArray(d.c)) throw malFormato('kraken', 'un precio', json);
      return precioValido('kraken', {
        precio: num(d.c[0]), compra: num(d.a?.[0]), venta: num(d.b?.[0]), hora: null,
      });
    },
  },
  bitstamp: {
    // { data: { pair, ohlc: [{ timestamp: "s", open, high, low, close, volume }, …] } }
    velas(json) {
      const lista = json?.data?.ohlc;
      if (!Array.isArray(lista)) throw malFormato('bitstamp', 'velas', json);
      return filas(lista, f => (f && typeof f === 'object'
        ? hacerVela(num(f.timestamp) * 1000, f.open, f.high, f.low, f.close, f.volume) : null));
    },
    precio(json) {
      if (!json || typeof json !== 'object') throw malFormato('bitstamp', 'un precio', json);
      return precioValido('bitstamp', {
        precio: num(json.last), compra: num(json.ask), venta: num(json.bid), hora: num(json.timestamp) * 1000,
      });
    },
  },
});

// ---------------------------------------------------------------- peticiones

function detalleError(texto) {
  if (!texto) return 'sin cuerpo';
  try {
    const j = JSON.parse(texto);
    const m = j?.message ?? j?.msg ?? j?.reason ?? (Array.isArray(j?.error) ? j.error.join('; ') : j?.error)
      ?? (Array.isArray(j?.errors) ? j.errors.map(e => e?.message ?? e).join('; ') : null);
    if (m) return String(m).slice(0, 200);
  } catch { /* no es JSON: se usa el texto */ }
  return texto.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function esperaDeCabecera(resp) {
  const valor = resp?.headers?.get?.('retry-after');
  const s = Number(valor);
  return Number.isFinite(s) && s >= 0 ? Math.min(s * 1000, 30_000) : null;
}

/**
 * Una petición GET con tiempo máximo. Lanza ErrorDatos marcando si es
 * reintentable (red, tiempo agotado, 429, 5xx o respuesta cortada).
 */
async function unaPeticion(url, fuente, { fetch: f, tiempoMax }) {
  const nombre = NOMBRE[fuente] ?? fuente;
  const control = new AbortController();
  let reloj;
  // La carrera con el reloj protege también de un fetch que ignore la señal.
  const plazo = new Promise((_, rechazar) => {
    reloj = setTimeout(() => {
      const plazoTexto = tiempoMax >= 1000 ? `${String(Math.round(tiempoMax / 100) / 10).replace('.', ',')} s` : `${tiempoMax} ms`;
      const e = new ErrorDatos(`${nombre} tardó más de ${plazoTexto} en responder.`, { fuente, reintentable: true });
      control.abort(e);
      rechazar(e);
    }, tiempoMax);
  });
  let resp;
  let texto;
  try {
    resp = await Promise.race([
      f(url, { signal: control.signal, headers: { 'User-Agent': AGENTE, Accept: 'application/json' } }),
      plazo,
    ]);
    // Vale un Response de verdad o un objeto sencillo con json() (mocks escritos a mano).
    if (typeof resp?.text === 'function') texto = await Promise.race([resp.text(), plazo]);
    else if (typeof resp?.json === 'function') texto = JSON.stringify(await Promise.race([resp.json(), plazo]));
    else throw new ErrorDatos(`${nombre}: la respuesta no se puede leer (ni text() ni json()).`, { fuente });
  } catch (e) {
    if (e instanceof ErrorDatos) throw e;
    const causa = e?.cause?.code ?? e?.code ?? e?.message ?? String(e);
    throw new ErrorDatos(`${nombre}: fallo de red (${causa}).`, { fuente, reintentable: true });
  } finally {
    clearTimeout(reloj);
  }
  const status = Number.isInteger(resp.status) ? resp.status : 200;
  const ok = typeof resp.ok === 'boolean' ? resp.ok : status < 400;
  if (!ok) {
    let detalle = detalleError(texto);
    if (status === 451) detalle = `bloqueado desde esta ubicación; ${detalle}`;
    // 418 de Binance = IP vetada por insistir: reintentar lo empeora.
    const reintentable = status === 429 || (status >= 500 && status !== 501);
    throw new ErrorDatos(`${nombre} respondió HTTP ${status} (${detalle}).`, {
      fuente, status, reintentable, esperaMs: esperaDeCabecera(resp),
    });
  }
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorDatos(`${nombre} devolvió algo que no es JSON: ${detalleError(texto).slice(0, 80)}`, { fuente, reintentable: true });
  }
}

/**
 * GET con reintentos y espera creciente (esperaBase · 2^intento, o lo que
 * pida Retry-After). `comprobar(json)` puede lanzar para rechazar la respuesta.
 */
export async function pedirJSON(url, opciones = {}) {
  const { fuente = 'fuente', fetch: f = globalThis.fetch, esperar = esperarReal, comprobar = null } = opciones;
  // Valores raros (NaN, negativos) vuelven a los de por defecto en vez de romper el bucle.
  const tiempoMax = Number.isFinite(opciones.tiempoMax) && opciones.tiempoMax > 0 ? opciones.tiempoMax : 15_000;
  const reintentos = Number.isInteger(opciones.reintentos) && opciones.reintentos >= 0 ? opciones.reintentos : 4;
  const esperaBase = Number.isFinite(opciones.esperaBase) && opciones.esperaBase >= 0 ? opciones.esperaBase : 500;
  if (typeof f !== 'function') throw new Error('No hay fetch disponible (hace falta Node 18 o superior).');
  let ultimo;
  for (let intento = 0; intento <= reintentos; intento++) {
    if (intento > 0) {
      const creciente = esperaBase * 2 ** (intento - 1);
      await esperar(Math.max(creciente, ultimo?.esperaMs ?? 0));
    }
    try {
      const json = await unaPeticion(url, fuente, { fetch: f, tiempoMax });
      if (comprobar) comprobar(json);
      return json;
    } catch (e) {
      ultimo = e instanceof ErrorDatos ? e : new ErrorDatos(String(e?.message ?? e), { fuente });
      if (!ultimo.reintentable) throw ultimo;
    }
  }
  const n = reintentos + 1;
  throw new ErrorDatos(`${ultimo.message.replace(/\.$/, '')} (${n} ${n === 1 ? 'intento' : 'intentos'}).`, {
    fuente, status: ultimo.status, reintentable: false,
  });
}

// Contexto de una llamada: cuenta peticiones y espera un poco entre ellas.
function crearContexto(opciones) {
  const ctx = {
    peticiones: 0,
    async pedir(fuente, url, comprobar = null) {
      if (ctx.peticiones > 0 && ctx.pausaMs > 0) await ctx.esperar(ctx.pausaMs);
      ctx.peticiones++;
      return pedirJSON(url, { ...ctx.red, fuente, comprobar });
    },
    esperar: opciones.esperar ?? esperarReal,
    pausaMs: opciones.pausaMs ?? 120,
    red: {
      fetch: opciones.fetch ?? globalThis.fetch,
      tiempoMax: opciones.tiempoMax ?? 15_000,
      reintentos: opciones.reintentos ?? 4,
      esperaBase: opciones.esperaBase ?? 500,
      esperar: opciones.esperar ?? esperarReal,
    },
  };
  return ctx;
}

// ---------------------------------------------------------------- descarga por fuente

const comprobarKraken = json => { const e = errorKraken(json); if (e) throw e; };

/** Descarga [desde, hasta) (desde alineado; hasta exclusivo) de una fuente, paginando. */
async function descargar(fuente, simbolo, intervalo, desde, hasta, ctx) {
  const ms = INTERVALOS[intervalo];
  const todas = [];
  let descartadas = 0;
  const anotar = r => { todas.push(...r.velas); descartadas += r.descartadas; };

  if (fuente === 'coinbase') {
    const g = COINBASE_GRANULARIDAD[intervalo];
    const ultimo = Math.floor((hasta - 1) / ms) * ms; // inicio de la última vela pedida
    // Coinbase cuenta start y end inclusive: 300 velas = end − start = 299 intervalos.
    for (let s = desde; s <= ultimo;) {
      const e = Math.min(s + (POR_PETICION.coinbase - 1) * ms, ultimo);
      const url = `${BASE.coinbase}/products/${simbolo}/candles?granularity=${g}&start=${iso(s)}&end=${iso(e)}`;
      anotar(lectores.coinbase.velas(await ctx.pedir('coinbase', url)));
      s = e + ms;
    }
  } else if (fuente === 'binance') {
    for (let s = desde; s < hasta;) {
      const url = `${BASE.binance}/api/v3/klines?symbol=${simbolo}&interval=${intervalo}` +
        `&startTime=${s}&endTime=${hasta - 1}&limit=${POR_PETICION.binance}`;
      const json = await ctx.pedir('binance', url);
      const r = lectores.binance.velas(json);
      anotar(r);
      if (json.length < POR_PETICION.binance || !r.velas.length) break;
      const siguiente = r.velas.at(-1).t + ms;
      if (siguiente <= s) break;
      s = siguiente;
    }
  } else if (fuente === 'bitstamp') {
    for (let s = desde; s < hasta;) {
      const faltan = Math.ceil((hasta - s) / ms);
      const limite = Math.max(1, Math.min(POR_PETICION.bitstamp, faltan));
      const url = `${BASE.bitstamp}/api/v2/ohlc/${simbolo}/?step=${BITSTAMP_PASO[intervalo]}&limit=${limite}&start=${s / 1000}`;
      const json = await ctx.pedir('bitstamp', url);
      const r = lectores.bitstamp.velas(json);
      anotar(r);
      const nFilas = json.data.ohlc.length;
      if (nFilas < limite || !r.velas.length) break;
      const siguiente = r.velas.at(-1).t + ms;
      if (siguiente <= s) break;
      s = siguiente;
    }
  } else if (fuente === 'kraken') {
    // Una sola petición: Kraken ignora lo anterior a sus últimas 720 velas.
    const url = `${BASE.kraken}/0/public/OHLC?pair=${simbolo}&interval=${KRAKEN_MINUTOS[intervalo]}&since=${Math.floor(desde / 1000)}`;
    anotar(lectores.kraken.velas(await ctx.pedir('kraken', url, comprobarKraken)));
  } else {
    throw new Error(`Fuente desconocida: «${fuente}».`);
  }

  const alineadas = ordenarUnicas(todas).filter(v => {
    if (v.t % ms !== 0) { descartadas++; return false; }
    return v.t >= desde && v.t < hasta;
  });
  return { velas: alineadas, descartadas };
}

// ---------------------------------------------------------------- caché

function rutaCache(dir, fuente, par, intervalo) {
  return path.join(dir, `${fuente}-${par}-${intervalo}.json`);
}

/** Lee la caché; si falta, no cuadra o está rota, devuelve null (se rehará). */
function leerCache(ruta, { fuente, par, intervalo, ms }) {
  let j;
  try {
    j = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch {
    return null;
  }
  if (!j || j.version !== VERSION_CACHE || j.fuente !== fuente || j.par !== par || j.intervalo !== intervalo) return null;
  const { cubreDesde, cubreHasta } = j;
  if (!Number.isFinite(cubreDesde) || !Number.isFinite(cubreHasta) || cubreHasta <= cubreDesde || !Array.isArray(j.velas)) return null;
  const velas = [];
  for (const f of j.velas) {
    const v = Array.isArray(f) ? hacerVela(...f) : null;
    // Una sola vela estropeada invalida la caché entera: si no, quedaría un hueco que nadie vuelve a pedir.
    if (!v || v.t % ms !== 0) return null;
    if (v.t >= cubreDesde && v.t < cubreHasta) velas.push(v);
  }
  return { cubreDesde, cubreHasta, velas: ordenarUnicas(velas) };
}

function guardarCache(ruta, cabecera, cubreDesde, cubreHasta, velas) {
  const datos = {
    version: VERSION_CACHE, ...cabecera, cubreDesde, cubreHasta,
    nota: 'Solo velas cerradas: [t, o, h, l, c, v]. Se puede borrar: se vuelve a descargar.',
    velas: velas.map(v => [v.t, v.o, v.h, v.l, v.c, v.v]),
  };
  try {
    escribirJsonAtomico(ruta, datos, { compacto: true });
  } catch { /* sin caché no pasa nada: la próxima vez se descarga otra vez */ }
}

/** Une tramos [a, b) que se tocan o se solapan. */
function unirTramos(tramos) {
  const orden = tramos.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const salida = [];
  for (const [a, b] of orden) {
    const ultimo = salida.at(-1);
    if (ultimo && a <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], b);
    else salida.push([a, b]);
  }
  return salida;
}

// ---------------------------------------------------------------- velas de una fuente

async function velasDeFuente(fuente, p, ctx) {
  if (fuente === 'coinbase' && p.intervalo === '4h') {
    // 4h = agregar 1h alineado a 00/04/08/12/16/20 UTC (d0 ya va alineado a 4h).
    const r = await velasDeFuente('coinbase', { ...p, intervalo: '1h', ms: INTERVALOS['1h'] }, ctx);
    const huecos1h = contarHuecos(r.velas, INTERVALOS['1h']);
    const avisos = huecos1h ? [`Las velas de 4h salen de agregar 1h y a esas 1h les faltan ${huecos1h}.`] : [];
    return { ...r, velas: agregar(r.velas, p.ms), agregadaDesde: '1h', avisos: [...r.avisos, ...avisos] };
  }
  const { par, intervalo, ms, d0, hastaEf, ahora } = p;
  const simbolo = PARES[par][fuente];
  const finCerradas = Math.floor(ahora / ms) * ms; // las velas con t < finCerradas están cerradas
  const avisos = [];
  const ruta = p.cache ? rutaCache(p.dirCache, fuente, par, intervalo) : null;
  const guardada = ruta ? leerCache(ruta, { fuente, par, intervalo, ms }) : null;

  // Qué falta: lo pedido menos lo que ya cubre la caché. Las 2 últimas velas
  // guardadas se vuelven a pedir por si el exchange las retocó al cerrar.
  const tramos = [];
  if (guardada) {
    const usable = Math.max(guardada.cubreDesde, guardada.cubreHasta - 2 * ms);
    if (d0 < guardada.cubreDesde) tramos.push([d0, Math.min(hastaEf, guardada.cubreDesde)]);
    if (hastaEf > usable) tramos.push([Math.max(d0, usable), hastaEf]);
  } else {
    tramos.push([d0, hastaEf]);
  }
  if (fuente === 'kraken') {
    // Lo que queda antes de sus últimas 720 velas no lo va a dar: no se pide.
    const primeraKraken = finCerradas - (KRAKEN_MAX - 1) * ms;
    for (let i = tramos.length - 1; i >= 0; i--) if (tramos[i][1] <= primeraKraken) tramos.splice(i, 1);
  }

  const porHora = new Map((guardada?.velas ?? []).map(v => [v.t, v]));
  const cubiertos = guardada ? [[guardada.cubreDesde, guardada.cubreHasta]] : [];
  let descartadas = 0;
  for (const [a, b] of tramos) {
    const r = await descargar(fuente, simbolo, intervalo, a, b, ctx);
    descartadas += r.descartadas;
    for (const v of r.velas) porHora.set(v.t, v);
    // Qué tramo queda de verdad cubierto (para no volver a pedirlo).
    const bAlineado = Math.ceil(b / ms) * ms;
    const cerradasRecibidas = r.velas.filter(v => v.t < finCerradas);
    let inicio = a;
    if (fuente === 'kraken') inicio = r.velas.length ? Math.max(a, r.velas[0].t) : bAlineado;
    let fin = Math.min(bAlineado, finCerradas);
    // Cerca de ahora el exchange puede ir con retraso: solo cuenta hasta la última recibida.
    if (bAlineado > finCerradas - 2 * ms) {
      const ultima = cerradasRecibidas.at(-1);
      fin = Math.min(fin, ultima ? ultima.t + ms : inicio);
    }
    if (fin > inicio) cubiertos.push([inicio, fin]);
  }
  if (descartadas) avisos.push(`${NOMBRE[fuente]} mandó ${descartadas} velas defectuosas y se han descartado.`);
  if (fuente === 'kraken' && d0 < finCerradas - (KRAKEN_MAX - 1) * ms) {
    avisos.push(`Kraken solo da las últimas ${KRAKEN_MAX} velas: lo anterior no está.`);
  }

  if (ruta && tramos.length) {
    // Se guarda el tramo continuo más reciente, solo con velas cerradas.
    const tramo = unirTramos(cubiertos).sort((x, y) => y[1] - x[1])[0];
    if (tramo) {
      let [cDesde, cHasta] = tramo;
      cHasta = Math.min(cHasta, finCerradas);
      let guardar = [...porHora.values()].filter(v => v.t >= cDesde && v.t < cHasta).sort((x, y) => x.t - y.t);
      if (guardar.length > MAX_VELAS_CACHE) {
        guardar = guardar.slice(-MAX_VELAS_CACHE);
        cDesde = guardar[0].t;
      }
      if (cHasta > cDesde) guardarCache(ruta, { fuente, par, intervalo }, cDesde, cHasta, guardar);
    }
  }

  const velas = [...porHora.values()]
    .filter(v => v.t >= d0 && v.t < hastaEf && v.t <= ahora)
    .sort((x, y) => x.t - y.t);
  return { velas, avisos, desdeCache: Boolean(guardada) };
}

// ---------------------------------------------------------------- serie

/** Velas que faltan entre la primera y la última (sin inventarlas). */
export function contarHuecos(velas, ms) {
  const horas = (Array.isArray(velas) ? velas : []).map(v => v?.t).filter(Number.isFinite);
  let huecos = 0;
  for (let i = 1; i < horas.length; i++) {
    const salto = Math.round((horas[i] - horas[i - 1]) / ms);
    if (salto > 1) huecos += salto - 1;
  }
  return huecos;
}

/**
 * Monta una Serie a partir de velas ya ordenadas:
 * { fuente, par, intervalo, velas, ultimaCerrada, leidaEn, huecos,
 *   faltanAlInicio, faltanAlFinal, avisos }.
 * `desde`/`hasta` (opcionales) permiten contar lo que falta en los bordes.
 */
export function montarSerie({ fuente, par = 'BTC-EUR', intervalo, velas = [], ahora = Date.now(), desde = null, hasta = null, avisos = [] }) {
  const ms = msIntervalo(intervalo);
  const lista = Array.isArray(velas) ? velas : [];
  let ultimaCerrada = -1;
  for (let i = lista.length - 1; i >= 0; i--) {
    if (Number.isFinite(lista[i]?.t) && lista[i].t + ms <= ahora) { ultimaCerrada = i; break; }
  }
  const huecos = contarHuecos(lista, ms);
  let faltanAlInicio = 0;
  let faltanAlFinal = 0;
  if (Number.isFinite(desde)) {
    const d0 = Math.floor(desde / ms) * ms;
    const tope = Math.min(Math.floor(ahora / ms) * ms, Number.isFinite(hasta) ? Math.ceil(hasta / ms) * ms : Infinity);
    const ultimaEsperada = tope - ms; // apertura de la última vela cerrada que debería haber
    if (Number.isFinite(lista[0]?.t)) faltanAlInicio = Math.max(0, Math.round((lista[0].t - d0) / ms));
    if (ultimaEsperada >= d0) {
      const ultimaTenida = ultimaCerrada >= 0 ? lista[ultimaCerrada].t : d0 - ms;
      faltanAlFinal = Math.max(0, Math.round((ultimaEsperada - ultimaTenida) / ms));
      if (!lista.length) faltanAlInicio = 0;
    }
  }
  const notas = [...avisos];
  if (huecos) notas.push(`Faltan ${huecos} velas por el medio (huecos sin datos; no se han rellenado).`);
  if (faltanAlInicio) notas.push(`Los datos empiezan en ${fechaUtc(lista[0].t)}: faltan ${faltanAlInicio} velas al principio del rango pedido.`);
  if (faltanAlFinal) {
    notas.push(ultimaCerrada >= 0
      ? `Los datos van con retraso: faltan ${faltanAlFinal} velas cerradas al final (la última es de ${fechaUtc(lista[ultimaCerrada].t)}).`
      : `No hay ninguna vela cerrada en el rango pedido (faltan ${faltanAlFinal}).`);
  }
  return { fuente, par, intervalo, velas: lista, ultimaCerrada, leidaEn: ahora, huecos, faltanAlInicio, faltanAlFinal, avisos: notas };
}

// Los mensajes de error ya suelen empezar por el nombre de la fuente; si no, se le pone.
const conNombre = (fuente, mensaje) => (mensaje.startsWith(NOMBRE[fuente]) ? mensaje : `${NOMBRE[fuente]}: ${mensaje}`);

function comprobarPar(par) {
  if (!PARES[par]) throw new Error(`Par desconocido: «${par}». Los que hay: ${Object.keys(PARES).join(', ')}.`);
}

function comprobarFuente(fuente) {
  if (fuente !== 'auto' && !FUENTES.includes(fuente)) {
    throw new Error(`Fuente desconocida: «${fuente}». Las que hay: auto, ${FUENTES.join(', ')}.`);
  }
}

/**
 * Velas de un par. Opciones:
 * - par ('BTC-EUR'), intervalo ('1h'), fuente ('auto' | 'coinbase' | 'binance' | 'kraken' | 'bitstamp')
 * - desde / hasta (ms, Date o ISO; hasta por defecto = ahora) y/o limite (por defecto 300).
 *   Con limite se devuelven como mucho las `limite` velas más recientes del rango.
 * - cache (true): guarda en estado/cache/ solo velas cerradas y pide solo lo que falta.
 * - Para pruebas: fetch, ahora, dirCache, esperar, pausaMs (120), tiempoMax (15000),
 *   reintentos (4), esperaBase (500).
 * Devuelve una Serie (ver montarSerie) con además `peticiones` y, si alguna fuente falló, `fallos`.
 * La última vela puede estar abierta: usa `ultimaCerrada`.
 */
export async function velas(opciones = {}) {
  opciones ??= {};
  const { par = 'BTC-EUR', intervalo = '1h', fuente = 'auto', cache = true } = opciones;
  comprobarPar(par);
  comprobarFuente(fuente);
  const ms = msIntervalo(intervalo);
  const ahora = aMs(opciones.ahora, 'ahora') ?? Date.now();
  const hastaPedido = aMs(opciones.hasta, 'hasta');
  const desdePedido = aMs(opciones.desde, 'desde');
  const hastaEf = Math.min(hastaPedido ?? Infinity, ahora + 1);
  let limite = opciones.limite ?? null;
  if (limite !== null && !(Number.isInteger(limite) && limite >= 1 && limite <= LIMITE_MAXIMO)) {
    throw new Error(`«limite» debe ser un entero entre 1 y ${LIMITE_MAXIMO} (llegó ${String(limite)}).`);
  }
  if (desdePedido === null) limite ??= LIMITE_POR_DEFECTO;
  const d0 = desdePedido !== null
    ? Math.floor(desdePedido / ms) * ms
    : Math.floor((hastaEf - 1) / ms) * ms - (limite - 1) * ms;
  if (!(d0 < hastaEf)) {
    throw new Error(`El rango está vacío: «desde» (${fechaUtc(d0)}) tiene que ser anterior a «hasta» (${fechaUtc(hastaEf)}).`);
  }
  if ((hastaEf - d0) / ms > LIMITE_MAXIMO) {
    throw new Error(`Rango demasiado grande: ${Math.ceil((hastaEf - d0) / ms)} velas de ${intervalo} (máximo ${LIMITE_MAXIMO}). Usa un intervalo mayor o un rango más corto.`);
  }

  const ctx = crearContexto(opciones);
  const p = {
    par, intervalo, ms, d0, hastaEf, ahora, cache: Boolean(cache),
    dirCache: opciones.dirCache ?? (cache ? path.join(dirEstado(), 'cache') : null),
  };
  const finCerradas = Math.floor(ahora / ms) * ms;
  let orden = fuente === 'auto' ? [...FUENTES] : [fuente];
  // Si el rango no cabe en las 720 velas de Kraken, mejor Bitstamp antes que Kraken.
  if (fuente === 'auto' && d0 < finCerradas - (KRAKEN_MAX - 1) * ms) orden = [...orden.filter(f => f !== 'kraken'), 'kraken'];
  // Una fuente «atrasada» (sin las últimas velas cerradas) no vale en auto si hay otra.
  const toleranciaRetraso = Math.max(3, Math.ceil(15 * 60_000 / ms));

  const fallos = [];
  let reserva = null;
  for (const f of orden) {
    try {
      const r = await velasDeFuente(f, p, ctx);
      let serie = montarSerie({ fuente: f, par, intervalo, velas: r.velas, ahora, desde: d0, hasta: hastaEf, avisos: r.avisos });
      if (limite !== null && serie.velas.length > limite) {
        serie = montarSerie({ fuente: f, par, intervalo, velas: serie.velas.slice(-limite), ahora, desde: serie.velas.at(-limite).t, hasta: hastaEf, avisos: r.avisos });
      }
      if (r.agregadaDesde) serie.agregadaDesde = r.agregadaDesde;
      serie.peticiones = ctx.peticiones;
      if (fuente !== 'auto') return serie;
      if (!serie.velas.length) throw new Error(`${NOMBRE[f]} no devolvió ninguna vela en el rango pedido.`);
      if (serie.faltanAlFinal > toleranciaRetraso) {
        fallos.push({ fuente: f, error: `${NOMBRE[f]} va con datos atrasados (faltan ${serie.faltanAlFinal} velas cerradas al final).` });
        reserva ??= serie;
        continue;
      }
      if (fallos.length) serie.fallos = fallos;
      return serie;
    } catch (e) {
      if (fuente !== 'auto') throw e;
      fallos.push({ fuente: f, error: e?.message ?? String(e) });
    }
  }
  if (reserva) {
    reserva.fallos = fallos;
    reserva.peticiones = ctx.peticiones;
    return reserva;
  }
  throw new Error(`No se pudieron leer velas de ${par} ${intervalo} de ninguna fuente: ` +
    fallos.map(x => conNombre(x.fuente, x.error)).join(' · '));
}

// ---------------------------------------------------------------- precios

async function precioDe(fuente, par, ctx, ahora) {
  const s = PARES[par][fuente];
  let p;
  if (fuente === 'coinbase') {
    p = lectores.coinbase.precio(await ctx.pedir('coinbase', `${BASE.coinbase}/products/${s}/ticker`));
  } else if (fuente === 'binance') {
    const [libro, ultimo] = await Promise.all([
      pedirJSON(`${BASE.binance}/api/v3/ticker/bookTicker?symbol=${s}`, { ...ctx.red, fuente }),
      pedirJSON(`${BASE.binance}/api/v3/ticker/price?symbol=${s}`, { ...ctx.red, fuente }),
    ]);
    ctx.peticiones += 2;
    p = lectores.binance.precio(libro, ultimo);
  } else if (fuente === 'kraken') {
    p = lectores.kraken.precio(await ctx.pedir('kraken', `${BASE.kraken}/0/public/Ticker?pair=${s}`, comprobarKraken));
  } else {
    p = lectores.bitstamp.precio(await ctx.pedir('bitstamp', `${BASE.bitstamp}/api/v2/ticker/${s}/`));
  }
  return { precio: p.precio, compra: p.compra, venta: p.venta, hora: p.hora ?? ahora, fuente };
}

/**
 * Último precio: { precio, compra, venta, hora, fuente }.
 * compra = al que se puede comprar (ask); venta = al que se puede vender (bid).
 * Con fuente 'auto' prueba coinbase → binance → kraken → bitstamp.
 */
export async function precio(opciones = {}) {
  opciones ??= {};
  const { par = 'BTC-EUR', fuente = 'auto' } = opciones;
  comprobarPar(par);
  comprobarFuente(fuente);
  const ahora = aMs(opciones.ahora, 'ahora') ?? Date.now();
  const ctx = crearContexto({ reintentos: 2, pausaMs: 0, ...opciones });
  const fallos = [];
  for (const f of fuente === 'auto' ? FUENTES : [fuente]) {
    try {
      const r = await precioDe(f, par, ctx, ahora);
      return fallos.length ? { ...r, fallos } : r;
    } catch (e) {
      if (fuente !== 'auto') throw e;
      fallos.push({ fuente: f, error: e?.message ?? String(e) });
    }
  }
  throw new Error(`No se pudo leer el precio de ${par} de ninguna fuente: ` +
    fallos.map(x => conNombre(x.fuente, x.error)).join(' · '));
}

/**
 * Precio en los cuatro exchanges a la vez (los que respondan):
 * { precios: [{ fuente, precio, compra, venta, hora }], mediana, divergencia_pct, fallos, hora }.
 * divergencia_pct = (máx − mín) / mediana · 100; null si no responde ninguno.
 */
export async function preciosCruzados(opciones = {}) {
  opciones ??= {};
  const { par = 'BTC-EUR' } = opciones;
  comprobarPar(par);
  const ahora = aMs(opciones.ahora, 'ahora') ?? Date.now();
  const resultados = await Promise.allSettled(
    FUENTES.map(f => precioDe(f, par, crearContexto({ reintentos: 2, pausaMs: 0, ...opciones }), ahora)),
  );
  const precios = [];
  const fallos = [];
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') precios.push(r.value);
    else fallos.push({ fuente: FUENTES[i], error: r.reason?.message ?? String(r.reason) });
  });
  const valores = precios.map(x => x.precio);
  const med = mediana(valores);
  const divergencia_pct = med ? ((Math.max(...valores) - Math.min(...valores)) / med) * 100 : null;
  return { par, precios, mediana: med, divergencia_pct, fallos, hora: ahora };
}

// ---------------------------------------------------------------- agregar

/**
 * Junta velas en otras más largas alineadas a múltiplos de msIntervalo desde
 * 1970-01-01 UTC (4h → 00/04/08/12/16/20 UTC; 1d → 00:00 UTC).
 * Apertura de la primera, cierre de la última, máximo, mínimo y volumen sumado.
 */
export function agregar(velas, msIntervalo) {
  if (!(Number.isFinite(msIntervalo) && msIntervalo > 0)) {
    throw new Error(`agregar: el intervalo debe ser un número de milisegundos positivo (llegó ${String(msIntervalo)}).`);
  }
  if (!Array.isArray(velas)) return [];
  const validas = velas.filter(v => v && ['t', 'o', 'h', 'l', 'c', 'v'].every(k => Number.isFinite(v[k])));
  const ordenadas = ordenarUnicas(validas);
  const salida = [];
  let actual = null;
  for (const v of ordenadas) {
    const t = Math.floor(v.t / msIntervalo) * msIntervalo;
    if (!actual || actual.t !== t) {
      actual = { t, o: v.o, h: v.h, l: v.l, c: v.c, v: v.v };
      salida.push(actual);
    } else {
      actual.h = Math.max(actual.h, v.h);
      actual.l = Math.min(actual.l, v.l);
      actual.c = v.c;
      actual.v += v.v;
    }
  }
  for (const a of salida) a.v = Number(a.v.toFixed(8));
  return salida;
}
