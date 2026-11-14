// Pruebas de lib/salida.mjs: stop, objetivo y salida por tiempo antes de entrar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planSalida } from '../lib/salida.mjs';
import { escanear } from '../lib/escaner.mjs';
import { generarVelas, serieDe } from './sinteticas.mjs';

const H = 3_600_000;
const AHORA = Date.UTC(2026, 10, 14, 10, 0); // 11:00 en Madrid
const CONFIG = Object.freeze({
  par: 'BTC-EUR',
  riesgo: { rr_minimo: 1.5 },
  costes: { comision_pct: 0.25, deslizamiento_pct: 0.05 },
  salida: { rr_objetivo: 2, stop_atr: 1.5, stop_max_atr: 3, horas_max: 24 },
});
const LARGA = Object.freeze({ id: 'ruptura-rango', intervalo: '1h', direccion: 'larga', nivel_entrada: 61000, nivel_invalidacion: 60400, datos: { atr: 400 } });
const plan = (setup, extra = {}) => planSalida({ setup, entrada: 61000, ahora: AHORA, config: CONFIG, ...extra });

test('largo con la estructura a 1,5 ATR: stop en la estructura y objetivo a 2R', () => {
  const r = plan(LARGA);
  assert.equal(r.entrada, 61000);
  assert.equal(r.stop, 60400);
  assert.equal(r.objetivo, 62200);
  assert.equal(r.rr, 2);
  assert.equal(r.riesgo_por_btc, 600);
  assert.equal(r.recompensa_por_btc, 1200);
  assert.equal(r.stop_origen, 'estructura');
  assert.equal(r.stop_en_atr, 1.5);
  assert.equal(r.direccion, 'larga');
  assert.equal(r.valido, true);
  assert.equal(r.salida_por_tiempo, AHORA + 24 * H);
  assert.equal(r.horas_max, 24);
  assert.equal(r.motivo, 'Entrada en 61.000 €. Stop en 60.400 € (donde la jugada deja de valer, 1,5 ATR): si llega ahí, se sale perdiendo 600 € por BTC. ' +
    'Objetivo en 62.200 € (2 veces lo que se arriesga), 1,97 % por encima. Si a las 15/11/2026 11:00 no ha tocado ninguno, se sale a mercado.');
  // Con un 0,3 % por lado de costes, el R:R real baja mucho: se avisa.
  assert.deepEqual(r.costes_por_btc, { si_stop: 364.2, si_objetivo: 369.6 });
  assert.equal(r.rr_neto, 0.86);
  assert.deepEqual(r.avisos, ['Con comisión y deslizamiento (0,30 % por lado), el R:R real baja a 0,86, por debajo del mínimo (1,5): el gestor de riesgo puede pararla.']);
});

test('estructura lejos: se respeta pero se avisa; estructura pegada: stop por ATR por debajo de ella', () => {
  const lejos = plan({ ...LARGA, nivel_invalidacion: 59000 });
  assert.equal(lejos.stop, 59000);
  assert.equal(lejos.stop_origen, 'estructura');
  assert.equal(lejos.objetivo, 65000);
  assert.match(lejos.avisos[0], /^El stop de la estructura queda a 5 ATR de la entrada, más de 3: el riesgo por BTC es grande/);
  const pegada = plan({ ...LARGA, nivel_invalidacion: 60900 });
  assert.equal(pegada.stop, 60400);
  assert.ok(pegada.stop < 60900, 'el stop queda por debajo de la estructura');
  assert.equal(pegada.stop_origen, 'atr');
  assert.match(pegada.avisos[0], /^La invalidación del setup \(60\.900 €\) está pegada a la entrada \(0,25 ATR\): el stop se pone a 1,5 ATR \(60\.400 €\)/);
  // Justo en el borde (0,5 ATR) ya se usa la estructura.
  assert.equal(plan({ ...LARGA, nivel_invalidacion: 60800 }).stop, 60800);
});

test('sin estructura válida: stop por ATR; si la entrada ya pasó la invalidación, la jugada no vale', () => {
  const sin = plan({ ...LARGA, nivel_invalidacion: undefined });
  assert.equal(sin.stop, 60400);
  assert.equal(sin.stop_origen, 'atr');
  assert.equal(sin.valido, true);
  assert.match(sin.avisos.join(' '), /no trae nivel de invalidación: el stop se pone a 1,5 ATR/);
  const pasada = plan(LARGA, { entrada: 60300 });
  assert.equal(pasada.valido, false);
  assert.equal(pasada.stop, 59700);
  assert.match(pasada.avisos[0], /^La entrada \(60\.300 €\) ya está por debajo de la invalidación del setup \(60\.400 €\): la jugada no vale/);
});

test('corto: todo simétrico', () => {
  const corto = { id: 'ruptura-bajista', intervalo: '1h', direccion: 'corta', nivel_entrada: 60000, nivel_invalidacion: 60600, datos: { atr: 400 } };
  const r = planSalida({ setup: corto, entrada: 60000, ahora: AHORA, config: CONFIG });
  assert.equal(r.stop, 60600);
  assert.equal(r.objetivo, 58800);
  assert.equal(r.rr, 2);
  assert.equal(r.riesgo_por_btc, 600);
  assert.equal(r.direccion, 'corta');
  assert.match(r.motivo, /2 veces lo que se arriesga\), 2,00 % por debajo/);
  const pegado = planSalida({ setup: { ...corto, nivel_invalidacion: 60100 }, entrada: 60000, ahora: AHORA, config: CONFIG });
  assert.equal(pegado.stop, 60600);
  assert.ok(pegado.stop > 60100);
  // Un corto con un stop enorme dejaría el objetivo por debajo de cero: error claro.
  assert.throws(() => planSalida({ setup: { direccion: 'corta' }, entrada: 100, atr: 80, config: CONFIG }), /el objetivo sale negativo/);
});

test('de dónde salen la entrada y el ATR', () => {
  // Lo que devuelve vigilarEntrada vale como entrada (usa su precio).
  assert.equal(plan(LARGA, { entrada: { estado: 'disparo', precio: 61050 } }).entrada, 61050);
  // Sin entrada: el nivel del setup.
  assert.equal(planSalida({ setup: LARGA, ahora: AHORA, config: CONFIG }).entrada, 61000);
  // El ATR que se pasa manda sobre el del setup.
  const conAtr = plan({ ...LARGA, nivel_invalidacion: 60900 }, { atr: 100 });
  assert.equal(conAtr.stop, 60900, 'con ATR 100 la estructura ya no está pegada');
  assert.equal(conAtr.atr, 100);
  // Sin ATR pero con estructura: stop en la estructura y aviso.
  const sinAtr = plan({ ...LARGA, datos: {} });
  assert.equal(sinAtr.stop, 60400);
  assert.equal(sinAtr.stop_en_atr, null);
  assert.match(sinAtr.avisos.join(' '), /Sin ATR no se ha podido comprobar/);
  // `ahora` como Date.
  assert.equal(plan(LARGA, { ahora: new Date(AHORA) }).salida_por_tiempo, AHORA + 24 * H);
});

test('config: valores de partida si falta y errores claros si está mal', () => {
  const r = planSalida({ setup: LARGA, entrada: 61000, ahora: AHORA });
  assert.equal(r.objetivo, 62200);
  assert.equal(r.salida_por_tiempo, AHORA + 24 * H);
  assert.deepEqual(r.avisos, [], 'sin rr_minimo en la config no hay aviso de R:R');
  const tres = plan(LARGA, { config: { salida: { rr_objetivo: 3, horas_max: 6 } } });
  assert.equal(tres.objetivo, 62800);
  assert.equal(tres.rr, 3);
  assert.equal(tres.salida_por_tiempo, AHORA + 6 * H);
  assert.throws(() => plan(LARGA, { config: { salida: { rr_objetivo: 0 } } }), /config\.salida\.rr_objetivo debe ser un número mayor que 0 \(llegó 0\)/);
  assert.throws(() => plan(LARGA, { config: { salida: { stop_atr: 'x' } } }), /config\.salida\.stop_atr/);
  assert.throws(() => plan(LARGA, { config: { costes: { comision_pct: -1 } } }), /config\.costes\.comision_pct debe ser un número ≥ 0/);
});

test('entradas raras: errores en castellano', () => {
  assert.throws(() => planSalida(), /planSalida: falta el precio de entrada/);
  assert.throws(() => planSalida({ entrada: NaN }), /falta el precio de entrada/);
  assert.throws(() => planSalida({ entrada: -5, setup: LARGA }), /falta el precio de entrada/);
  assert.throws(() => planSalida({ entrada: 61000 }), /no se puede poner el stop: falta el ATR y el setup no trae una invalidación válida/);
  assert.throws(() => planSalida({ entrada: 61000, setup: { nivel_invalidacion: 62000 } }), /no se puede poner el stop/);
  // Un setup null con ATR vale: stop por ATR.
  assert.equal(planSalida({ setup: null, entrada: 61000, atr: 400, ahora: AHORA }).stop, 60400);
});

test('del escáner al plan: un setup real sale con stop < entrada < objetivo', () => {
  for (let semilla = 1; semilla <= 5; semilla++) {
    const velas = generarVelas({ semilla, n: 300, intervalo: '1h', patron: 'ruptura' });
    const r = escanear({ series: { '1h': serieDe(velas) }, ahora: velas.at(-1).t + H, config: CONFIG });
    const setup = r.setups.find(s => s.id === 'ruptura-rango');
    const p = planSalida({ setup, entrada: setup.nivel_entrada, ahora: AHORA, config: CONFIG });
    assert.ok(p.stop < p.entrada && p.entrada < p.objetivo, JSON.stringify(p));
    assert.ok(Math.abs(p.rr - 2) <= 0.01);
    assert.ok(p.stop_en_atr > 0 && p.stop_en_atr <= 3);
    assert.ok(p.motivo.startsWith('Entrada en '));
  }
});
