// Pruebas de lib/entrada.mjs: el temporizador de entrada con velas de 5 minutos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vigilarEntrada } from '../lib/entrada.mjs';
import { serieDe } from './sinteticas.mjs';

const M5 = 300_000;
const H = 3_600_000;
const T0 = Date.UTC(2026, 10, 14, 8, 0);
const INICIO = T0 + 30 * M5; // la vela de 1h del setup cerró aquí: desde la vela 30 se vigila
const CONFIG = { par: 'BTC-EUR', entrada: { intervalo: '5m', volumen_minimo_rel: 1, persecucion_max_atr: 0.5, caduca_horas: 12 } };
const SETUP = Object.freeze({
  id: 'ruptura-rango', intervalo: '1h', direccion: 'larga', estado: 'formandose',
  nivel_entrada: 61000, nivel_invalidacion: 60700, vela_t: INICIO - H, datos: { atr: 300 },
});

// 40 velas de 5 min quietas en 60.900 € (±20), volumen 1; `cambios` toca algunas.
function velas(cambios = {}, n = 40) {
  return Array.from({ length: n }, (_, k) => ({ t: T0 + k * M5, o: 60900, h: 60920, l: 60880, c: 60900, v: 1, ...(cambios[k] ?? {}) }));
}
const finDe = vs => vs.at(-1).t + M5;
const vigilar = (vs, extra = {}) => vigilarEntrada({ setup: SETUP, serie: serieDe(vs, { intervalo: '5m' }), ahora: finDe(vs), config: CONFIG, ...extra });
const ROTURA = { o: 60900, h: 61060, l: 60890, c: 61050, v: 2 };

test('disparo: una vela de 5m cierra por encima con volumen y cerca del nivel', () => {
  const vs = velas({ 39: ROTURA });
  const r = vigilar(vs);
  assert.equal(r.estado, 'disparo');
  assert.equal(r.precio, 61050);
  assert.equal(r.vela_t, vs[39].t);
  assert.equal(r.hace_velas, 0);
  assert.equal(r.vol_rel, 2);
  assert.equal(r.atr, 300);
  assert.equal(r.limite_persecucion, 150);
  assert.equal(r.caduca_en, INICIO + 12 * H);
  assert.equal(r.motivo, 'Una vela de 5m ha cerrado por encima de 61.000 € (en 61.050 €, en la última vela cerrada) con 2 veces el volumen normal y sin alejarse más de 0,5 ATR: es el momento de entrar (en papel).');
  assert.deepEqual(r.avisos, []);
});

test('disparo de hace unas velas: sigue valiendo si el precio no se ha ido ni ha tocado la invalidación', () => {
  const calma = { o: 61020, h: 61040, l: 61000, c: 61020 };
  const r = vigilar(velas({ 35: ROTURA, 36: calma, 37: calma, 38: calma, 39: calma }));
  assert.equal(r.estado, 'disparo');
  assert.equal(r.hace_velas, 4);
  assert.equal(r.precio, 61050);
  assert.equal(r.precio_actual, 61020);
  assert.match(r.motivo, /hace 4 velas de 5m/);
});

test('esperar: cierra arriba pero con poco volumen, o todavía no ha llegado', () => {
  const flojo = vigilar(velas({ 39: { ...ROTURA, v: 0.5 } }));
  assert.equal(flojo.estado, 'esperar');
  assert.match(flojo.motivo, /pero con poco volumen \(0,5 veces lo normal; hace falta 1\): todavía no\./);
  const quieto = vigilar(velas());
  assert.equal(quieto.estado, 'esperar');
  assert.equal(quieto.precio, 60900);
  assert.match(quieto.motivo, /^Esperando a que una vela de 5m cierre por encima de 61\.000 €: ahora está en 60\.900 €, a 100 € \(0,16 %\)\. La señal caduca el 14\/11\/2026/);
});

test('demasiado_lejos: no se persigue el precio más allá de medio ATR del nivel', () => {
  const lejos = vigilar(velas({ 39: { o: 60900, h: 61220, l: 60890, c: 61200, v: 3 } }));
  assert.equal(lejos.estado, 'demasiado_lejos');
  assert.equal(lejos.precio, 61200);
  assert.match(lejos.motivo, /ya está a 200 € por encima de la entrada \(61\.000 €\), más de 0.5 ATR \(150 €\): no lo persigas/);
  // Disparó bien, pero después se escapó.
  const escapado = vigilar(velas({ 35: ROTURA, 39: { o: 61050, h: 61320, l: 61040, c: 61300 } }));
  assert.equal(escapado.estado, 'demasiado_lejos');
  assert.match(escapado.motivo, /^Disparó a las .*pero ahora el precio \(61\.300 €\) ya está a 300 € del nivel/);
});

test('invalidado: toca la invalidación antes de entrar, en la misma vela o después del disparo', () => {
  const vs = velas({ 33: { l: 60690 } });
  const antes = vigilar(vs);
  assert.equal(antes.estado, 'invalidado');
  assert.equal(antes.vela_t, vs[33].t);
  assert.match(antes.motivo, /^Antes de entrar, el precio llegó a 60\.690 € y tocó la invalidación \(60\.700 €\): la jugada ya no vale\.$/);
  // Toca la invalidación y cierra arriba en la misma vela: cuenta lo prudente.
  assert.equal(vigilar(velas({ 39: { ...ROTURA, l: 60650 } })).estado, 'invalidado');
  const despues = vigilar(velas({ 35: ROTURA, 38: { o: 61000, h: 61010, l: 60700, c: 60750 } }));
  assert.equal(despues.estado, 'invalidado');
  assert.match(despues.motivo, /^Disparó a las .* pero después el precio llegó a 60\.700 €/);
});

test('solo cuentan las velas cerradas después de la señal', () => {
  // Una rotura antes de que cerrara la vela del setup no vale.
  assert.equal(vigilar(velas({ 25: ROTURA })).estado, 'esperar');
  // La vela en curso tampoco, aunque la serie diga que está cerrada.
  const vs = velas({ 40: ROTURA }, 41);
  const ahora = vs[40].t + 2 * 60_000;
  const serie = { ...serieDe(vs, { intervalo: '5m', ahora }), ultimaCerrada: 40 };
  const r = vigilarEntrada({ setup: SETUP, serie, ahora, config: CONFIG });
  assert.equal(r.estado, 'esperar');
  assert.equal(r.vela_t, vs[39].t);
  // Si aún no ha cerrado ninguna vela desde la señal, lo dice.
  const pronto = vigilarEntrada({ setup: { ...SETUP, vela_t: finDe(velas()) }, serie: serieDe(velas()), ahora: finDe(velas()), config: CONFIG });
  assert.equal(pronto.estado, 'esperar');
  assert.match(pronto.motivo, /^Todavía no ha cerrado ninguna vela de 5m desde la señal/);
});

test('caducado: pasan las horas de la config sin disparo', () => {
  const vs = velas();
  const r = vigilarEntrada({ setup: SETUP, serie: serieDe(vs), ahora: INICIO + 12 * H + 1, config: CONFIG });
  assert.equal(r.estado, 'caducado');
  assert.match(r.motivo, /^Han pasado 12 horas desde la señal/);
  // Una rotura después de caducar ya no cuenta (caduca a los 15 minutos: velas 30, 31 y 32).
  const corta = { ...CONFIG, entrada: { ...CONFIG.entrada, caduca_horas: 0.25 } };
  const tarde = vigilarEntrada({ setup: SETUP, serie: serieDe(velas({ 35: ROTURA })), ahora: finDe(vs), config: corta });
  assert.equal(tarde.estado, 'caducado');
  const aTiempo = vigilarEntrada({ setup: SETUP, serie: serieDe(velas({ 32: ROTURA })), ahora: finDe(vs), config: corta });
  assert.equal(aTiempo.estado, 'disparo');
});

test('cortos: todo simétrico (aunque estén apagados)', () => {
  const corto = { ...SETUP, id: 'ruptura-bajista', direccion: 'corta', nivel_entrada: 60800, nivel_invalidacion: 61100 };
  const vs = velas({ 39: { o: 60900, h: 60910, l: 60740, c: 60750, v: 2 } });
  const r = vigilarEntrada({ setup: corto, serie: serieDe(vs), ahora: finDe(vs), config: CONFIG });
  assert.equal(r.estado, 'disparo');
  assert.equal(r.direccion, 'corta');
  assert.match(r.motivo, /ha cerrado por debajo de 60\.800 €/);
  const tocado = velas({ 34: { h: 61100 } });
  assert.equal(vigilarEntrada({ setup: corto, serie: serieDe(tocado), ahora: finDe(tocado), config: CONFIG }).estado, 'invalidado');
  const lejos = velas({ 39: { o: 60900, h: 60910, l: 60590, c: 60600, v: 2 } });
  assert.equal(vigilarEntrada({ setup: corto, serie: serieDe(lejos), ahora: finDe(lejos), config: CONFIG }).estado, 'demasiado_lejos');
});

test('sin ATR en el setup usa el de la serie (más pequeño) y lo avisa', () => {
  const r = vigilarEntrada({ setup: { ...SETUP, datos: {} }, serie: serieDe(velas({ 39: ROTURA })), ahora: finDe(velas()), config: CONFIG });
  assert.ok(r.atr > 30 && r.atr < 60, String(r.atr));
  assert.equal(r.estado, 'demasiado_lejos', 'con el ATR de 5m, 50 € ya es pasarse');
  assert.match(r.avisos.join(' '), /El setup no trae ATR: se usa el de las velas de 5m/);
});

test('sin vela_t solo mira la última vela cerrada y no caduca', () => {
  const sinVela = { ...SETUP, vela_t: undefined };
  const r = vigilarEntrada({ setup: sinVela, serie: serieDe(velas({ 39: ROTURA })), ahora: finDe(velas()), config: CONFIG });
  assert.equal(r.estado, 'disparo');
  assert.equal(r.caduca_en, null);
  assert.match(r.avisos.join(' '), /no dice de qué vela salió/);
  const viejo = vigilarEntrada({ setup: sinVela, serie: serieDe(velas({ 30: ROTURA })), ahora: finDe(velas()) + 30 * H, config: CONFIG });
  assert.equal(viejo.estado, 'esperar');
});

test('entradas raras: errores claros o «esperar», nunca un fallo raro', () => {
  assert.throws(() => vigilarEntrada(), /vigilarEntrada: falta el setup/);
  assert.throws(() => vigilarEntrada({ setup: null }), /falta el setup/);
  assert.throws(() => vigilarEntrada({ setup: { ...SETUP, nivel_entrada: NaN } }), /no trae un nivel de entrada válido \(llegó NaN\)/);
  assert.throws(() => vigilarEntrada({ setup: SETUP, config: { entrada: { persecucion_max_atr: -1 } } }), /config\.entrada\.persecucion_max_atr debe ser un número mayor que 0 \(llegó -1\)/);
  assert.throws(() => vigilarEntrada({ setup: SETUP, config: { entrada: { intervalo: '7m' } } }), /config\.entrada\.intervalo no es un intervalo válido/);
  assert.throws(() => vigilarEntrada({ setup: SETUP, config: { entrada: { caduca_horas: 'mucho' } } }), /caduca_horas/);
  for (const serie of [undefined, null, { velas: [] }, { velas: 'x' }, serieDe([], { intervalo: '5m' })]) {
    const r = vigilarEntrada({ setup: SETUP, serie, ahora: INICIO, config: CONFIG });
    assert.equal(r.estado, 'esperar');
    assert.equal(r.precio, null);
    assert.match(r.motivo, /No hay velas cerradas de 5m/);
  }
  // Velas rotas por medio: se saltan.
  const rotas = velas({ 31: { h: NaN }, 32: { c: null }, 39: ROTURA });
  assert.equal(vigilar(rotas).estado, 'disparo');
  // Una invalidación al revés no se usa (y se dice).
  const alReves = vigilarEntrada({ setup: { ...SETUP, nivel_invalidacion: 61500 }, serie: serieDe(velas({ 33: { l: 60000 } })), ahora: finDe(velas()), config: CONFIG });
  assert.equal(alReves.estado, 'esperar');
  assert.equal(alReves.nivel_invalidacion, null);
  assert.match(alReves.avisos.join(' '), /no está por debajo de la entrada/);
  // Config sin «entrada»: valores de partida. Serie de otra temporalidad: se usa la suya y se avisa.
  const vs = velas({ 39: ROTURA });
  assert.equal(vigilarEntrada({ setup: SETUP, serie: serieDe(vs), ahora: finDe(vs) }).estado, 'disparo');
  const otra = vigilarEntrada({ setup: SETUP, serie: serieDe(vs), ahora: finDe(vs), config: { entrada: { intervalo: '15m' } } });
  assert.match(otra.avisos.join(' '), /La serie es de 5m y la config pide 15m/);
  // Pocas velas: no se puede medir el volumen y lo dice.
  const pocas = velas({ 9: ROTURA }, 10);
  const sinVolumen = vigilarEntrada({ setup: { ...SETUP, vela_t: T0 - H }, serie: serieDe(pocas), ahora: finDe(pocas), config: CONFIG });
  assert.equal(sinVolumen.estado, 'esperar');
  assert.match(sinVolumen.motivo, /no hay velas suficientes para medir el volumen/);
  // `ahora` como Date vale igual.
  assert.equal(vigilarEntrada({ setup: SETUP, serie: serieDe(vs), ahora: new Date(finDe(vs)), config: CONFIG }).estado, 'disparo');
});
