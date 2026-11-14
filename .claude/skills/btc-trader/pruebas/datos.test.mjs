// Pruebas de lib/datos.mjs sin red: respuestas reales guardadas (fixtures) y
// un mercado de mentira que imita las API de los cuatro exchanges.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-datos-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const { velas, precio, preciosCruzados, agregar, lectores, pedirJSON, montarSerie, PARES, FUENTES, ErrorDatos } = await import('../lib/datos.mjs');
const { generarVelas, fetchFalso, mercadoFalso, respuesta, secuencia, colgado, falloRed } = await import('./sinteticas.mjs');

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fixture = nombre => JSON.parse(fs.readFileSync(path.join(FIX, nombre), 'utf8'));
const ERRORES = fixture('errores.json');
const M5 = 300_000;
const H1 = 3_600_000;
const DIA = 86_400_000;

// Sin esperas de verdad: se anotan para comprobarlas.
function relojFalso() {
  const esperas = [];
  return { esperas, esperar: async ms => { esperas.push(ms); } };
}
const sinCache = { cache: false };
let carpetas = 0;
const dirNuevo = () => path.join(tmp, `cache-${++carpetas}`);

// Rutas con las respuestas reales guardadas (velas de 5m del 14/11/2026 07:00–09:55 UTC).
function fetchFixtures(extra = {}) {
  return fetchFalso({
    ...extra,
    'coinbase.com/products/BTC-EUR/candles': fixture('coinbase-velas-5m.json'),
    'coinbase.com/products/BTC-EUR/ticker': fixture('coinbase-ticker.json'),
    'binance.vision/api/v3/klines': fixture('binance-klines-5m.json'),
    'binance.vision/api/v3/ticker/bookTicker': fixture('binance-bookticker.json'),
    'binance.vision/api/v3/ticker/price': fixture('binance-precio.json'),
    'kraken.com/0/public/OHLC': fixture('kraken-ohlc-5m.json'),
    'kraken.com/0/public/Ticker': fixture('kraken-ticker.json'),
    'bitstamp.net/api/v2/ohlc/btceur': fixture('bitstamp-ohlc-5m.json'),
    'bitstamp.net/api/v2/ticker/btceur': fixture('bitstamp-ticker.json'),
  });
}
const T_FIX = Date.UTC(2026, 10, 14, 7, 0);
const AHORA_FIX = Date.UTC(2026, 10, 14, 10, 0);

// ---------------------------------------------------------------- lectores

test('lectores: las respuestas reales de los cuatro exchanges dan las mismas 36 velas', () => {
  const r = {
    coinbase: lectores.coinbase.velas(fixture('coinbase-velas-5m.json')),
    binance: lectores.binance.velas(fixture('binance-klines-5m.json')),
    kraken: lectores.kraken.velas(fixture('kraken-ohlc-5m.json')),
    bitstamp: lectores.bitstamp.velas(fixture('bitstamp-ohlc-5m.json')),
  };
  const horas = Array.from({ length: 36 }, (_, i) => T_FIX + i * M5);
  for (const [fuente, { velas: vs, descartadas }] of Object.entries(r)) {
    assert.equal(descartadas, 0, fuente);
    assert.deepEqual(vs.map(v => v.t), horas, `${fuente}: ascendentes, en ms, sin duplicados`);
    for (const v of vs) {
      for (const k of ['t', 'o', 'h', 'l', 'c', 'v']) assert.equal(typeof v[k], 'number', `${fuente}.${k}`);
      assert.ok(v.l <= Math.min(v.o, v.c) && v.h >= Math.max(v.o, v.c));
    }
  }
  // Coinbase manda [time, low, high, open, close, volume] y del más nuevo al más viejo.
  assert.deepEqual(r.coinbase.velas[0], { t: T_FIX, o: 61126.42, h: 61204.1, l: 61100, c: 61184.34, v: 0.476374 });
  assert.deepEqual(r.binance.velas[0], { t: T_FIX, o: 61130.5, h: 61200.9, l: 61106.02, c: 61177.46, v: 0.18851 });
  // Kraken: [time, o, h, l, c, vwap, volume, count]; el volumen es el 7.º, no el vwap.
  assert.deepEqual(r.kraken.velas[0], { t: T_FIX, o: 61131.8, h: 61199.7, l: 61112.5, c: 61181.5, v: 0.78196863 });
  assert.deepEqual(r.bitstamp.velas[0], { t: T_FIX, o: 61130.83, h: 61195.2, l: 61106.36, c: 61187.2, v: 0.31249627 });
  // Es el mismo mercado: los cierres coinciden con margen pequeño.
  for (let i = 0; i < 36; i++) {
    const cierres = Object.values(r).map(x => x.velas[i].c);
    assert.ok((Math.max(...cierres) - Math.min(...cierres)) / cierres[0] < 0.003, `vela ${i}`);
  }
});

test('lectores: filas defectuosas se descartan y se cuentan; formatos ajenos dan error claro', () => {
  const crudo = [
    [1794639900, 61000, 61100, 61050, 61080, 1],
    [1794639600, 'x', 61100, 61050, 61080, 1],
    null,
    [1794639300, 61200, 61100, 61150, 61150, 1], // mínimo > máximo
  ];
  const r = lectores.coinbase.velas(crudo);
  assert.equal(r.velas.length, 1);
  assert.equal(r.descartadas, 3);
  assert.throws(() => lectores.coinbase.velas({ message: 'NotFound' }), /Coinbase devolvió algo que no son velas/);
  assert.throws(() => lectores.bitstamp.velas({ data: {} }), /Bitstamp devolvió algo que no son velas/);
  const kraken = JSON.parse(ERRORES.kraken_par_desconocido.cuerpo);
  assert.throws(() => lectores.kraken.velas(kraken), err => err instanceof ErrorDatos && /Kraken: EQuery:Unknown asset pair/.test(err.message) && !err.reintentable);
  assert.throws(() => lectores.kraken.velas({ error: ['EAPI:Rate limit exceeded'] }), err => err.reintentable === true);
  assert.deepEqual(lectores.binance.velas([]), { velas: [], descartadas: 0 });
});

test('lectores de precio: compra = ask (lo que pagas), venta = bid (lo que te dan)', () => {
  assert.deepEqual(lectores.coinbase.precio(fixture('coinbase-ticker.json')), {
    precio: 61047.26, compra: 61055.23, venta: 61040.98, hora: Date.parse('2026-11-14T10:28:35.870Z'),
  });
  assert.deepEqual(lectores.binance.precio(fixture('binance-bookticker.json'), fixture('binance-precio.json')), {
    precio: 61043.6, compra: 61053.87, venta: 61053.86, hora: null,
  });
  assert.deepEqual(lectores.kraken.precio(fixture('kraken-ticker.json')), {
    precio: 61049.8, compra: 61059, venta: 61047.1, hora: null,
  });
  assert.deepEqual(lectores.bitstamp.precio(fixture('bitstamp-ticker.json')), {
    precio: 61052.72, compra: 61052.72, venta: 61042.41, hora: 1794652120000,
  });
  assert.throws(() => lectores.coinbase.precio({ price: 'nada' }), /precio que no es un número válido/);
});

// ---------------------------------------------------------------- velas() con las respuestas reales

test('velas() de cada fuente con sus respuestas reales: Serie completa', async () => {
  for (const fuente of FUENTES) {
    const s = await velas({ intervalo: '5m', desde: T_FIX, fuente, ahora: AHORA_FIX, fetch: fetchFixtures(), ...sinCache, ...relojFalso() });
    assert.equal(s.fuente, fuente);
    assert.equal(s.par, 'BTC-EUR');
    assert.equal(s.intervalo, '5m');
    assert.equal(s.velas.length, 36, fuente);
    assert.equal(s.ultimaCerrada, 35);
    assert.equal(s.huecos, 0);
    assert.equal(s.faltanAlFinal, 0);
    assert.equal(s.leidaEn, AHORA_FIX);
  }
});

test('las URL llevan el símbolo de cada exchange y los parámetros reales', async () => {
  const f = fetchFixtures();
  for (const fuente of FUENTES) {
    await velas({ intervalo: '5m', desde: T_FIX, fuente, ahora: AHORA_FIX, fetch: f, ...sinCache, ...relojFalso() });
  }
  const [cb, bn, kr, bs] = f.llamadas;
  assert.equal(cb, 'https://api.exchange.coinbase.com/products/BTC-EUR/candles?granularity=300&start=2026-11-14T07:00:00Z&end=2026-11-14T10:00:00Z');
  assert.equal(bn, `https://data-api.binance.vision/api/v3/klines?symbol=BTCEUR&interval=5m&startTime=${T_FIX}&endTime=${AHORA_FIX}&limit=1000`);
  assert.equal(kr, `https://api.kraken.com/0/public/OHLC?pair=XBTEUR&interval=5&since=${T_FIX / 1000}`);
  assert.equal(bs, `https://www.bitstamp.net/api/v2/ohlc/btceur/?step=300&limit=37&start=${T_FIX / 1000}`);
  // BTC-USD usa los símbolos de cada casa.
  const usd = mercadoFalso({ velas: { '1h': generarVelas({ n: 30, intervalo: '1h', inicio: Date.UTC(2026, 10, 13) }) } });
  for (const fuente of FUENTES) {
    await velas({ par: 'BTC-USD', intervalo: '1h', limite: 5, fuente, ahora: Date.UTC(2026, 10, 14, 5, 30), fetch: usd, ...sinCache, ...relojFalso() });
  }
  assert.match(usd.llamadas[0], /products\/BTC-USD\/candles/);
  assert.match(usd.llamadas[1], /symbol=BTCUSDT/);
  assert.match(usd.llamadas[2], /pair=XBTUSD/);
  assert.match(usd.llamadas[3], /ohlc\/btcusd\//);
  assert.deepEqual(Object.keys(PARES), ['BTC-EUR', 'BTC-USD']);
});

// ---------------------------------------------------------------- paginación (60 días de 5m)

const AHORA = Date.UTC(2026, 10, 14, 10, 22); // la vela de 10:20 está abierta
const INICIO_60 = Date.UTC(2026, 8, 1);
const VELAS_5M = generarVelas({ n: (Date.UTC(2026, 10, 14, 10, 20) - INICIO_60) / M5 + 1, intervalo: '5m', inicio: INICIO_60, semilla: 4 });
const DESDE_60 = AHORA - 60 * DIA;

test('60 días de 5m: Coinbase pagina de 300 en 300 (58 peticiones) con pausa entre ellas', async () => {
  const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
  const reloj = relojFalso();
  const s = await velas({ intervalo: '5m', desde: DESDE_60, fuente: 'coinbase', ahora: AHORA, fetch: f, ...sinCache, ...reloj });
  const esperadas = 60 * 288 + 1; // de 10:20 del 15/09 a 10:20 del 14/11, ambas incluidas
  assert.equal(s.velas.length, esperadas);
  assert.equal(s.peticiones, 58);
  assert.equal(f.llamadas.length, 58);
  assert.deepEqual(reloj.esperas, new Array(57).fill(120), 'pausa de 120 ms entre peticiones');
  assert.equal(s.ultimaCerrada, esperadas - 2, 'la última (10:20) sigue abierta');
  assert.equal(s.velas.at(-1).t, Date.UTC(2026, 10, 14, 10, 20));
  assert.equal(s.huecos, 0);
  assert.equal(s.faltanAlInicio, 0);
  assert.equal(s.faltanAlFinal, 0);
  for (let i = 1; i < s.velas.length; i++) assert.equal(s.velas[i].t - s.velas[i - 1].t, M5);
  const primera = VELAS_5M.findIndex(v => v.t === s.velas[0].t);
  assert.deepEqual(s.velas, VELAS_5M.slice(primera, primera + esperadas), 'las mismas velas, sin tocar');
});

test('60 días de 5m: Binance y Bitstamp de 1000 en 1000; Kraken solo da 720 y lo dice', async () => {
  const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
  for (const fuente of ['binance', 'bitstamp']) {
    const s = await velas({ intervalo: '5m', desde: DESDE_60, fuente, ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
    assert.equal(s.velas.length, 60 * 288 + 1, fuente);
    assert.equal(s.peticiones, 18, fuente);
    assert.equal(s.huecos, 0);
  }
  const k = await velas({ intervalo: '5m', desde: DESDE_60, fuente: 'kraken', ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(k.velas.length, 720);
  assert.equal(k.peticiones, 1);
  assert.equal(k.faltanAlInicio, 60 * 288 + 1 - 720);
  assert.ok(k.avisos.some(a => /Kraken solo da las últimas 720 velas/.test(a)));
  assert.ok(k.avisos.some(a => /faltan 16561 velas al principio/.test(a)));
});

test('limite: las N velas más recientes (la última puede estar abierta)', async () => {
  const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
  const s = await velas({ intervalo: '5m', limite: 10, fuente: 'coinbase', ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(s.velas.length, 10);
  assert.equal(s.velas.at(-1).t, Date.UTC(2026, 10, 14, 10, 20));
  assert.equal(s.ultimaCerrada, 8);
  const conDesde = await velas({ intervalo: '5m', desde: AHORA - DIA, limite: 5, fuente: 'binance', ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(conDesde.velas.length, 5);
  assert.equal(conDesde.velas.at(-1).t, Date.UTC(2026, 10, 14, 10, 20));
});

// ---------------------------------------------------------------- huecos y retrasos

test('huecos: se cuentan las velas que faltan y no se inventan', async () => {
  const quitadas = new Set([100, 101, 102, 500].map(i => VELAS_5M.at(-1000 + i).t));
  const conHuecos = VELAS_5M.filter(v => !quitadas.has(v.t));
  const f = mercadoFalso({ velas: { '5m': conHuecos }, ahora: AHORA });
  const s = await velas({ intervalo: '5m', limite: 1000, fuente: 'coinbase', ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(s.huecos, 4);
  assert.equal(s.velas.length, 996);
  assert.ok(s.velas.every(v => !quitadas.has(v.t)));
  assert.ok(s.avisos.some(a => /Faltan 4 velas por el medio/.test(a)));
});

test('auto: una fuente atrasada se salta si otra va al día', async () => {
  const atrasado = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA - 2 * H1 });
  const alDia = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
  const f = (url, init) => (url.includes('coinbase') ? atrasado(url, init) : alDia(url, init));
  const s = await velas({ intervalo: '5m', limite: 100, ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(s.fuente, 'binance');
  assert.equal(s.faltanAlFinal, 0);
  assert.match(s.fallos[0].error, /Coinbase va con datos atrasados/);
  // Con una fuente fija se devuelve lo que hay, avisando del retraso.
  const solo = await velas({ intervalo: '5m', limite: 100, fuente: 'coinbase', ahora: AHORA, fetch: f, ...sinCache, ...relojFalso() });
  assert.equal(solo.faltanAlFinal, 23, 'de 08:20 a 10:15');
  assert.ok(solo.avisos.some(a => /van con retraso: faltan 23 velas cerradas/.test(a)));
});

// ---------------------------------------------------------------- reintentos, errores y auto

test('reintentos con espera creciente ante 429/5xx/red; Retry-After manda si es mayor', async () => {
  const datos = fixture('coinbase-velas-5m.json');
  const reloj = relojFalso();
  const f = fetchFalso({
    'coinbase.com': secuencia(
      respuesta(429, { message: 'Too many requests' }, { 'retry-after': '3' }),
      respuesta(502, '<html>Bad gateway</html>'),
      falloRed('ECONNRESET'),
      '<html>cortado',
      datos,
    ),
  });
  const s = await velas({ intervalo: '5m', desde: T_FIX, fuente: 'coinbase', ahora: AHORA_FIX, fetch: f, ...sinCache, ...reloj });
  assert.equal(s.velas.length, 36);
  assert.equal(f.llamadas.length, 5);
  assert.deepEqual(reloj.esperas, [3000, 1000, 2000, 4000], '500·2^k, salvo los 3 s que pidió Retry-After');
});

test('errores definitivos: 404 no se reintenta y el mensaje dice qué pasó', async () => {
  const reloj = relojFalso();
  const f = fetchFalso({ 'coinbase.com': respuesta(ERRORES.coinbase_par_desconocido.status, ERRORES.coinbase_par_desconocido.cuerpo) });
  await assert.rejects(
    velas({ intervalo: '5m', limite: 5, fuente: 'coinbase', ahora: AHORA_FIX, fetch: f, ...sinCache, ...reloj }),
    /Coinbase respondió HTTP 404 \(NotFound\)/,
  );
  assert.equal(f.llamadas.length, 1);
  assert.deepEqual(reloj.esperas, []);
  const bloqueo = fetchFalso({ 'binance.vision': respuesta(ERRORES.binance_bloqueo_451.status, ERRORES.binance_bloqueo_451.cuerpo) });
  await assert.rejects(
    velas({ intervalo: '5m', limite: 5, fuente: 'binance', ahora: AHORA_FIX, fetch: bloqueo, ...sinCache, ...relojFalso() }),
    /Binance respondió HTTP 451 \(bloqueado desde esta ubicación; Service unavailable from a restricted location/,
  );
  const sinCuerpo = fetchFalso({ 'bitstamp.net': respuesta(404, '') });
  await assert.rejects(
    velas({ intervalo: '5m', limite: 5, fuente: 'bitstamp', ahora: AHORA_FIX, fetch: sinCuerpo, ...sinCache, ...relojFalso() }),
    /Bitstamp respondió HTTP 404 \(sin cuerpo\)/,
  );
  const krakenMal = fetchFalso({ 'kraken.com': JSON.parse(ERRORES.kraken_par_desconocido.cuerpo) });
  await assert.rejects(
    velas({ intervalo: '5m', limite: 5, fuente: 'kraken', ahora: AHORA_FIX, fetch: krakenMal, ...sinCache, ...relojFalso() }),
    /Kraken: EQuery:Unknown asset pair/,
  );
});

test('tiempo máximo por petición: una petición colgada se corta y se reintenta', async () => {
  const reloj = relojFalso();
  const f = fetchFalso({ 'coinbase.com': colgado });
  const inicio = Date.now();
  await assert.rejects(
    pedirJSON('https://api.exchange.coinbase.com/x', { fuente: 'coinbase', fetch: f, tiempoMax: 40, reintentos: 2, ...reloj }),
    /Coinbase tardó más de 40 ms en responder \(3 intentos\)/,
  );
  assert.ok(Date.now() - inicio < 2000);
  assert.equal(f.llamadas.length, 3);
  // Aunque el fetch ignore la señal de cancelar, no se queda esperando.
  const sordo = () => new Promise(() => {});
  await assert.rejects(
    pedirJSON('https://x', { fuente: 'kraken', fetch: sordo, tiempoMax: 30, reintentos: 0, ...relojFalso() }),
    /Kraken tardó más de 30 ms en responder \(1 intento\)/,
  );
});

test('auto: si una fuente falla pasa a la siguiente y la Serie dice cuál sirvió', async () => {
  const reloj = relojFalso();
  const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA, fallan: ['coinbase'] });
  const s = await velas({ intervalo: '5m', limite: 50, ahora: AHORA, fetch: f, ...sinCache, ...reloj });
  assert.equal(s.fuente, 'binance');
  assert.equal(s.velas.length, 50);
  assert.equal(s.fallos.length, 1);
  assert.equal(s.fallos[0].fuente, 'coinbase');
  assert.match(s.fallos[0].error, /Coinbase respondió HTTP 503.*\(5 intentos\)/);
  assert.deepEqual(reloj.esperas.filter(x => x !== 120), [500, 1000, 2000, 4000]);
  // Rango largo: Kraken (720 velas) pasa al final, detrás de Bitstamp.
  const g = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA, fallan: ['coinbase', 'binance'] });
  const largo = await velas({ intervalo: '5m', desde: AHORA - 5 * DIA, ahora: AHORA, fetch: g, ...sinCache, ...relojFalso() });
  assert.equal(largo.fuente, 'bitstamp');
  assert.equal(largo.velas.length, 5 * 288 + 1);
  // Rango corto: el orden es el del contrato (Kraken antes que Bitstamp).
  const corto = await velas({ intervalo: '5m', limite: 100, ahora: AHORA, fetch: g, ...sinCache, ...relojFalso() });
  assert.equal(corto.fuente, 'kraken');
});

test('auto: si fallan todas, el error las nombra a todas', async () => {
  const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA, fallan: [...FUENTES] });
  await assert.rejects(
    velas({ intervalo: '5m', limite: 10, ahora: AHORA, fetch: f, ...sinCache, reintentos: 0, ...relojFalso() }),
    err => /No se pudieron leer velas de BTC-EUR 5m de ninguna fuente/.test(err.message)
      && ['Coinbase', 'Binance', 'Kraken', 'Bitstamp'].every(n => err.message.includes(`${n} respondió HTTP 503`))
      && !err.message.includes('Coinbase: Coinbase'),
  );
});

test('opciones raras: mensajes claros en castellano', async () => {
  const base = { ahora: AHORA, fetch: fetchFalso({}), ...sinCache };
  await assert.rejects(velas({ ...base, par: 'ETH-EUR' }), /Par desconocido: «ETH-EUR»\. Los que hay: BTC-EUR, BTC-USD/);
  await assert.rejects(velas({ ...base, intervalo: '2h' }), /Intervalo desconocido: «2h»/);
  await assert.rejects(velas({ ...base, fuente: 'ftx' }), /Fuente desconocida: «ftx»/);
  await assert.rejects(velas({ ...base, desde: AHORA, hasta: AHORA - DIA }), /El rango está vacío/);
  await assert.rejects(velas({ ...base, desde: 'ayer' }), /«desde» no es una fecha válida/);
  await assert.rejects(velas({ ...base, limite: 0 }), /«limite» debe ser un entero/);
  await assert.rejects(velas({ ...base, intervalo: '1m', desde: AHORA - 400 * DIA }), /Rango demasiado grande/);
  await assert.rejects(precio({ ...base, par: 'BTC-JPY' }), /Par desconocido/);
});

// ---------------------------------------------------------------- caché

test('caché: guarda solo velas cerradas y después pide solo lo que falta', async () => {
  const dirCache = dirNuevo();
  const opc = { intervalo: '5m', desde: AHORA - 2 * DIA, fuente: 'coinbase', dirCache };
  const f1 = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
  const s1 = await velas({ ...opc, ahora: AHORA, fetch: f1, ...relojFalso() });
  assert.equal(s1.peticiones, 2, '577 velas = 2 páginas de Coinbase');
  const archivo = path.join(dirCache, 'coinbase-BTC-EUR-5m.json');
  const guardado = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  assert.equal(guardado.cubreHasta, Date.UTC(2026, 10, 14, 10, 20));
  assert.ok(guardado.velas.every(([t]) => t + M5 <= AHORA), 'la vela abierta no se guarda');
  assert.equal(guardado.velas.length, s1.velas.length - 1);

  // Diez minutos después: una sola petición pequeña (las 2 últimas guardadas + lo nuevo).
  const ahora2 = AHORA + 10 * 60_000;
  const masVelas = VELAS_5M.concat(generarVelas({ n: 3, intervalo: '5m', inicio: Date.UTC(2026, 10, 14, 10, 25), precio: VELAS_5M.at(-1).c }));
  const f2 = mercadoFalso({ velas: { '5m': masVelas }, ahora: ahora2 });
  const s2 = await velas({ ...opc, ahora: ahora2, fetch: f2, ...relojFalso() });
  assert.equal(s2.peticiones, 1);
  assert.match(f2.llamadas[0], /start=2026-11-14T10:10:00Z&end=2026-11-14T10:30:00Z/);
  const directa = await velas({ ...opc, ahora: ahora2, fetch: f2, cache: false, ...relojFalso() });
  assert.deepEqual(s2.velas, directa.velas, 'con caché o sin ella, las mismas velas');
  assert.equal(s2.ultimaCerrada, s2.velas.length - 2);

  // Un rango ya cubierto del pasado no hace ninguna petición.
  const f3 = fetchFalso({});
  const s3 = await velas({ ...opc, desde: AHORA - DIA, hasta: AHORA - 12 * H1, ahora: ahora2, fetch: f3, ...relojFalso() });
  assert.equal(f3.llamadas.length, 0);
  assert.equal(s3.velas.length, 145, 'de 10:20 a 22:20, ambas incluidas');
  assert.equal(s3.ultimaCerrada, 144);

  // Pedir más atrás: solo se descarga el principio que falta (y la cola reciente).
  const f4 = mercadoFalso({ velas: { '5m': masVelas }, ahora: ahora2 });
  const s4 = await velas({ ...opc, desde: AHORA - 3 * DIA, ahora: ahora2, fetch: f4, ...relojFalso() });
  assert.equal(f4.llamadas.length, 2);
  assert.match(f4.llamadas[0], /start=2026-11-11T10:20:00Z&end=2026-11-12T10:15:00Z/);
  assert.equal(s4.huecos, 0);
  assert.equal(s4.velas.length, 3 * 288 + 3);
});

test('caché rota o ajena: se ignora, se descarga y se reescribe bien', async () => {
  const dirCache = dirNuevo();
  fs.mkdirSync(dirCache, { recursive: true });
  const archivo = path.join(dirCache, 'binance-BTC-EUR-5m.json');
  const opc = { intervalo: '5m', limite: 50, fuente: 'binance', ahora: AHORA, dirCache };
  for (const basura of ['{"version": 1, "velas": [', '[]', JSON.stringify({ version: 1, fuente: 'binance', par: 'BTC-EUR', intervalo: '1h', cubreDesde: 0, cubreHasta: 1, velas: [] })]) {
    fs.writeFileSync(archivo, basura);
    const f = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA });
    const s = await velas({ ...opc, fetch: f, ...relojFalso() });
    assert.equal(s.velas.length, 50);
    assert.equal(f.llamadas.length, 1);
    const j = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    assert.equal(j.intervalo, '5m');
    assert.equal(j.velas.length, 49);
  }
  // Velas imposibles dentro de una caché por lo demás válida: se descartan.
  const j = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  j.velas[0] = [j.velas[0][0], 'x', null];
  fs.writeFileSync(archivo, JSON.stringify(j));
  const s = await velas({ ...opc, fetch: mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA }), ...relojFalso() });
  assert.equal(s.velas.length, 50);
});

test('caché: con cache:false no se escribe nada; un exchange con retraso no deja huecos fijos', async () => {
  const dirCache = dirNuevo();
  await velas({ intervalo: '5m', limite: 20, fuente: 'coinbase', ahora: AHORA, dirCache, cache: false, fetch: mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA }), ...relojFalso() });
  assert.equal(fs.existsSync(dirCache), false);
  // El exchange aún no ha publicado las 2 últimas velas cerradas.
  const conRetraso = mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA - 15 * 60_000 });
  const s1 = await velas({ intervalo: '5m', limite: 20, fuente: 'coinbase', ahora: AHORA, dirCache, fetch: conRetraso, ...relojFalso() });
  assert.equal(s1.faltanAlFinal, 2);
  const guardado = JSON.parse(fs.readFileSync(path.join(dirCache, 'coinbase-BTC-EUR-5m.json'), 'utf8'));
  assert.equal(guardado.cubreHasta, AHORA - 15 * 60_000 - 2 * 60_000 + M5, 'solo hasta la última recibida');
  // Cuando ya las publica, se recogen.
  const s2 = await velas({ intervalo: '5m', limite: 20, fuente: 'coinbase', ahora: AHORA, dirCache, fetch: mercadoFalso({ velas: { '5m': VELAS_5M }, ahora: AHORA }), ...relojFalso() });
  assert.equal(s2.faltanAlFinal, 0);
  assert.equal(s2.huecos, 0);
  assert.equal(s2.velas.length, 20);
});

// ---------------------------------------------------------------- 4h y agregar

test('agregar: 4h alineadas a 00/04/08… UTC con cuentas a mano (velas reales de 1h)', () => {
  const unaHora = lectores.coinbase.velas(fixture('coinbase-velas-1h.json')).velas;
  assert.equal(unaHora.length, 24);
  const cuatro = agregar(unaHora, 4 * H1);
  assert.equal(cuatro.length, 6);
  assert.deepEqual(cuatro.map(v => new Date(v.t).toISOString().slice(11, 13)), ['00', '04', '08', '12', '16', '20']);
  // 13/11 de 00:00 a 03:59 UTC: apertura de la primera, cierre de la última, máximo, mínimo y volumen sumado.
  assert.deepEqual(cuatro[0], { t: Date.UTC(2026, 10, 13), o: 64614.22, h: 64671.46, l: 61944.36, c: 62308.2, v: 114.85938892 });
  assert.equal(agregar(unaHora, DIA).length, 1);
  // Entradas raras.
  assert.deepEqual(agregar([], H1), []);
  assert.deepEqual(agregar(null, H1), []);
  assert.deepEqual(agregar([{ t: 0, o: 1, h: 1, l: 1, c: 1, v: 1 }, { t: 1, o: NaN }], H1), [{ t: 0, o: 1, h: 1, l: 1, c: 1, v: 1 }]);
  assert.throws(() => agregar(unaHora, 0), /intervalo debe ser un número de milisegundos positivo/);
});

test('Coinbase no tiene 4h: se agrega desde 1h; Binance las da directas', async () => {
  const horas = generarVelas({ n: 24 * 10 + 11, intervalo: '1h', inicio: Date.UTC(2026, 10, 4), semilla: 9 });
  const ahora = Date.UTC(2026, 10, 14, 10, 30); // la vela de 4h de las 08:00 está abierta
  const dirCache = dirNuevo();
  const s = await velas({ intervalo: '4h', limite: 12, fuente: 'coinbase', ahora, dirCache, fetch: mercadoFalso({ velas: { '1h': horas } }), ...relojFalso() });
  assert.equal(s.fuente, 'coinbase');
  assert.equal(s.agregadaDesde, '1h');
  assert.equal(s.velas.length, 12);
  assert.ok(s.velas.every(v => v.t % (4 * H1) === 0));
  assert.equal(s.velas.at(-1).t, Date.UTC(2026, 10, 14, 8));
  assert.equal(s.ultimaCerrada, 10);
  assert.deepEqual(s.velas, agregar(horas, 4 * H1).slice(-12));
  assert.ok(fs.existsSync(path.join(dirCache, 'coinbase-BTC-EUR-1h.json')), 'la caché es de las velas de 1h');
  const cuatro = agregar(horas, 4 * H1);
  const b = await velas({ intervalo: '4h', limite: 12, fuente: 'binance', ahora, fetch: mercadoFalso({ velas: { '4h': cuatro } }), ...sinCache, ...relojFalso() });
  assert.deepEqual(b.velas, s.velas);
});

// ---------------------------------------------------------------- precios

test('precio(): de una fuente o en auto saltando la que falla', async () => {
  const f = fetchFixtures();
  assert.deepEqual(await precio({ fetch: f, ahora: AHORA_FIX }), {
    precio: 61047.26, compra: 61055.23, venta: 61040.98, hora: Date.parse('2026-11-14T10:28:35.870Z'), fuente: 'coinbase',
  });
  const binance = await precio({ fuente: 'binance', fetch: f, ahora: AHORA_FIX });
  assert.deepEqual(binance, { precio: 61043.6, compra: 61053.87, venta: 61053.86, hora: AHORA_FIX, fuente: 'binance' });
  const caido = fetchFixtures({ 'coinbase.com': respuesta(503, 'mantenimiento') });
  const r = await precio({ fetch: caido, ahora: AHORA_FIX, ...relojFalso() });
  assert.equal(r.fuente, 'binance');
  assert.match(r.fallos[0].error, /Coinbase respondió HTTP 503 \(mantenimiento\)/);
});

test('preciosCruzados: mediana y divergencia de los que respondan', async () => {
  const r = await preciosCruzados({ fetch: fetchFixtures(), ahora: AHORA_FIX });
  assert.deepEqual(r.precios.map(p => [p.fuente, p.precio]), [
    ['coinbase', 61047.26], ['binance', 61043.6], ['kraken', 61049.8], ['bitstamp', 61052.72],
  ]);
  assert.equal(r.mediana, (61047.26 + 61049.8) / 2);
  assert.equal(r.divergencia_pct, ((61052.72 - 61043.6) / r.mediana) * 100);
  assert.ok(r.divergencia_pct < 0.02);
  assert.deepEqual(r.fallos, []);

  const sinKraken = await preciosCruzados({ fetch: fetchFixtures({ 'kraken.com': respuesta(520, '') }), ahora: AHORA_FIX, ...relojFalso() });
  assert.equal(sinKraken.precios.length, 3);
  assert.equal(sinKraken.mediana, 61047.26);
  assert.equal(sinKraken.fallos[0].fuente, 'kraken');

  const nada = await preciosCruzados({ fetch: fetchFalso({}), ahora: AHORA_FIX, ...relojFalso() });
  assert.deepEqual(nada.precios, []);
  assert.equal(nada.mediana, null);
  assert.equal(nada.divergencia_pct, null);
  assert.equal(nada.fallos.length, 4);
});

// ---------------------------------------------------------------- piezas sueltas

test('montarSerie: ultimaCerrada por hora de cierre y entradas vacías', () => {
  const vs = generarVelas({ n: 5, intervalo: '5m', inicio: Date.UTC(2026, 10, 14, 10) });
  assert.equal(montarSerie({ fuente: 'x', intervalo: '5m', velas: vs, ahora: Date.UTC(2026, 10, 14, 10, 25) }).ultimaCerrada, 4);
  assert.equal(montarSerie({ fuente: 'x', intervalo: '5m', velas: vs, ahora: Date.UTC(2026, 10, 14, 10, 24, 59) }).ultimaCerrada, 3);
  const vacia = montarSerie({ fuente: 'x', intervalo: '5m', velas: [], ahora: Date.UTC(2026, 10, 14, 10, 30), desde: Date.UTC(2026, 10, 14, 10) });
  assert.equal(vacia.ultimaCerrada, -1);
  assert.equal(vacia.faltanAlFinal, 6);
  assert.match(vacia.avisos[0], /No hay ninguna vela cerrada/);
  assert.equal(montarSerie({ fuente: 'x', intervalo: '1h', velas: null, ahora: 0 }).velas.length, 0);
  const rara = montarSerie({ fuente: 'x', intervalo: '5m', velas: [null, vs[0], { t: NaN }], ahora: Date.UTC(2026, 10, 14, 11), desde: Date.UTC(2026, 10, 14, 10) });
  assert.equal(rara.ultimaCerrada, 1, 'las entradas sin hora no rompen ni cuentan');
  assert.equal(rara.huecos, 0);
});

test('vale un fetch sencillo escrito a mano ({ ok, status, json }) además de Response', async () => {
  const sencillo = async url => ({
    ok: true, status: 200,
    json: async () => (url.includes('ticker') ? { price: '61000.5', bid: '61000', ask: '61001', time: '2026-11-14T10:00:00Z' } : []),
  });
  const p = await precio({ fuente: 'coinbase', fetch: sencillo, ahora: AHORA_FIX });
  assert.deepEqual(p, { precio: 61000.5, compra: 61001, venta: 61000, hora: Date.UTC(2026, 10, 14, 10), fuente: 'coinbase' });
  const lento = async () => ({ ok: false, status: 429, json: async () => ({ message: 'despacio' }) });
  await assert.rejects(precio({ fuente: 'coinbase', fetch: lento, reintentos: 1, ...relojFalso() }), /Coinbase respondió HTTP 429 \(despacio\) \(2 intentos\)/);
  await assert.rejects(precio({ fuente: 'coinbase', fetch: async () => ({}) }), /la respuesta no se puede leer/);
});

test('fetchFalso: rutas por texto, RegExp o función; secuencias; 404 si no hay ruta', async () => {
  const f = fetchFalso([
    [/^https:\/\/a\.test\/uno/, { n: 1 }],
    [url => url.endsWith('/dos'), () => respuesta(201, { n: 2 })],
    ['tres', secuencia(respuesta(500, 'mal'), 'bien')],
    ['red', falloRed('ETIMEDOUT')],
  ]);
  assert.deepEqual(await (await f('https://a.test/uno')).json(), { n: 1 });
  const dos = await f('https://a.test/dos');
  assert.equal(dos.status, 201);
  assert.equal((await f('https://a.test/tres')).status, 500);
  assert.equal(await (await f('https://a.test/tres')).text(), 'bien');
  assert.equal(await (await f('https://a.test/tres')).text(), 'bien', 'la última se repite');
  await assert.rejects(f('https://a.test/red'), err => err.cause.code === 'ETIMEDOUT');
  assert.equal((await f('https://a.test/otra')).status, 404);
  assert.equal(f.llamadas.length, 7);
});
