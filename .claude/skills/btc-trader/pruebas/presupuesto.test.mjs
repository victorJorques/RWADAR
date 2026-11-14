// Pruebas del gestor de presupuesto (sin red; el estado va a una carpeta temporal).
// Cuentas con la config de partida: comisión c = 0,0025 y deslizamiento d = 0,0005,
// así que c + d = 0,003.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-presupuesto-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');

const { RAIZ, prng } = await import('../lib/comun.mjs');
const P = await import('../lib/presupuesto.mjs');

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const CONFIG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.ejemplo.json'), 'utf8'));
const conRiesgo = cambios => ({ ...CONFIG, riesgo: { ...CONFIG.riesgo, ...cambios } });
const cerca = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} debería ser ${b}`);

test('riesgoPorBtc, gananciaPorBtc y costeConCostes siguen las cuentas del contrato', () => {
  const reglas = P.leerReglas(CONFIG);
  assert.equal(reglas.c, 0.0025);
  assert.equal(reglas.d, 0.0005);
  // (61000 − 60000) + 61000·0,003 + 60000·0,003 = 1000 + 183 + 180 = 1363
  cerca(P.riesgoPorBtc(61000, 60000, reglas), 1363);
  // Corto: (62000 − 61000) + 61000·0,003 + 62000·0,003 = 1000 + 183 + 186 = 1369
  cerca(P.riesgoPorBtc(61000, 62000, reglas), 1369);
  // (63000 − 61000) − 61000·0,003 − 63000·0,0025 = 2000 − 183 − 157,5 = 1659,5
  cerca(P.gananciaPorBtc(61000, 63000, reglas), 1659.5);
  // 0,1 · 61000 · 1,003 = 6118,3
  cerca(P.costeConCostes(0.1, 61000, reglas), 6118.3);
});

test('r2 redondea a céntimos sin los fallos del binario', () => {
  assert.equal(P.r2(1.005), 1.01);
  assert.equal(P.r2(-1.005), -1.01);
  assert.equal(P.r2(48.69999), 48.7);
  assert.equal(P.r2(-0.001), 0);
  assert.ok(Number.isNaN(P.r2(NaN)));
  assert.ok(Number.isNaN(P.r2(null)));
});

test('manda la pérdida máxima: 50 / 1363 se redondea HACIA ABAJO a satoshis', () => {
  const d = P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG });
  // 50 / 1363 = 0,036683785766… → 0,03668378 (redondeando normal saldría 0,03668379).
  assert.equal(d.btc, 0.03668378);
  assert.equal(d.limitado_por, 'perdida_max');
  assert.equal(d.lado, 'larga');
  assert.equal(d.riesgo_por_btc, 1363);
  // 0,03668378 · 1363 = 49,99999214 → 50,00 €; un satoshi más (0,03668379 · 1363 = 50,00000577) se pasaría.
  assert.ok(d.btc * 1363 <= 50);
  assert.ok((d.btc + 1e-8) * 1363 > 50);
  assert.equal(d.perdida_si_stop, 50);
  // 0,03668378 · 61000 = 2237,71058 → 2237,71; con costes · 1,003 = 2244,4237… → 2244,42
  assert.equal(d.nominal, 2237.71);
  assert.equal(d.coste, 2244.42);
  // Desglose: 0,03668378 · 1000 = 36,68; 0,03668378 · 121000 = 4438,73738 → ·0,0025 = 11,10 y ·0,0005 = 2,22
  assert.equal(d.riesgo, 36.68);
  assert.equal(d.comisiones, 11.1);
  assert.equal(d.deslizamiento, 2.22);
  assert.deepEqual(d.candidatos, { perdida_max: 0.03668378, posicion_max: 0.04086102, efectivo: 0.08172204 });
  assert.equal(d.cuenta_supuesta, true, 'sin cuenta se supone una recién abierta con el saldo inicial');
  assert.match(d.motivo, /^Compra 0,03668378 BTC a 61\.000,00 €: 2\.237,71 € más 6,71 € de comisión y deslizamiento\./);
  assert.match(d.motivo, /Manda tu pérdida máxima por operación \(50,00 €\)\. Si salta el stop pierdes 50,00 € con comisiones y deslizamiento \(36,68 € por el precio y 13,32 € de costes\)\./);
  assert.match(d.motivo, /recién abierta con 5\.000,00 €/);
});

test('manda el tamaño máximo de la posición (50 % del capital)', () => {
  const d = P.dimensionar({ entrada: 61000, stop: 60000, config: conRiesgo({ perdida_max_operacion: 1000 }), cuenta: { efectivo: 5000, capital: 5000 } });
  // 50 % · 5000 = 2500; 2500 / (61000 · 1,003 = 61183) = 0,0408610… → 0,04086102
  // (61183 · 0,04086102 = 2499,9998 ≤ 2500 y 61183 · 0,04086103 = 2500,0004 > 2500).
  assert.equal(d.btc, 0.04086102);
  assert.equal(d.limitado_por, 'posicion_max');
  assert.equal(d.coste, 2500);
  assert.equal(d.pct_capital, 50);
  // 0,04086102 · 1363 = 55,69357… → 55,69 (cabe en el límite de 1000 €)
  assert.equal(d.perdida_si_stop, 55.69);
  assert.equal(d.nominal, 2492.52);
  assert.equal(d.cuenta_supuesta, false);
  assert.match(d.motivo, /Manda el tamaño máximo de la posición \(50 % de tu capital de 5\.000,00 €, es decir 2\.500,00 €\)/);
  assert.match(d.motivo, /tu límite por operación es 1\.000,00 €\.$/);
});

test('manda el efectivo: sin apalancamiento no se compra más de lo que hay', () => {
  const d = P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, cuenta: { efectivo: 1000, capital: 5000 } });
  // 1000 / 61183 = 0,0163444… → 0,01634440 (61183 · 0,0163444 = 999,9994)
  assert.equal(d.btc, 0.0163444);
  assert.equal(d.limitado_por, 'efectivo');
  assert.equal(d.coste, 1000);
  // 0,0163444 · 1363 = 22,2774… → 22,28
  assert.equal(d.perdida_si_stop, 22.28);
  assert.match(d.motivo, /Manda el efectivo que tienes libre \(1\.000,00 €; sin apalancamiento no se compra más\)/);
});

test('sin capital calculado: efectivo + valor de las posiciones', () => {
  const d = P.dimensionar({
    entrada: 61000, stop: 60000, config: conRiesgo({ perdida_max_operacion: 1000 }),
    cuenta: { efectivo: 2000, posiciones: [{ valor: 3000 }, { valor: 'roto' }] },
  });
  // capital = 2000 + 3000 = 5000 → posición máx 2500 → 0,04086102; pero el efectivo (2000 / 61183 = 0,03268881) manda.
  assert.equal(d.limites.capital, 5000);
  assert.equal(d.btc, 0.03268881);
  assert.equal(d.limitado_por, 'efectivo');
});

test('por debajo del mínimo de orden: 0 BTC y limitado_por «minimo»', () => {
  const d = P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, cuenta: { efectivo: 0.5, capital: 5000 } });
  // 0,5 / 61183 = 0,00000817… < 0,00001
  assert.equal(d.btc, 0);
  assert.equal(d.limitado_por, 'minimo');
  assert.equal(d.nominal, 0);
  assert.equal(d.perdida_si_stop, 0);
  assert.equal(d.candidatos.efectivo, 0.00000817);
  assert.match(d.motivo, /^No hay orden: el efectivo que tienes libre \(0,50 €; sin apalancamiento no se compra más\) solo da para 0,00000817 BTC, por debajo del mínimo de 0,00001000 BTC\./);

  const sinDinero = P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, cuenta: { efectivo: -20, capital: -20 } });
  assert.equal(sinDinero.btc, 0);
  assert.equal(sinDinero.limitado_por, 'minimo');
  assert.equal(sinDinero.pct_capital, null);

  // Justo en el mínimo sí vale: sin costes, 0,01 € / (61000 − 60000) = 0,00001 BTC.
  const sinCostes = { ...conRiesgo({ perdida_max_operacion: 0.01 }), costes: { comision_pct: 0, deslizamiento_pct: 0 } };
  const justo = P.dimensionar({ entrada: 61000, stop: 60000, config: sinCostes });
  assert.equal(justo.btc, 0.00001);
  assert.equal(justo.limitado_por, 'perdida_max');
  assert.equal(justo.perdida_si_stop, 0.01);
});

test('corto: el stop va por encima de la entrada', () => {
  const d = P.dimensionar({ entrada: 61000, stop: 62000, config: CONFIG });
  // 50 / 1369 = 0,0365230… → 0,03652300 (1369 · 0,036523 = 49,999987; 1369 · 0,03652301 = 50,0000007)
  assert.equal(d.lado, 'corta');
  assert.equal(d.btc, 0.036523);
  assert.equal(d.riesgo_por_btc, 1369);
  assert.equal(d.perdida_si_stop, 50);
  assert.match(d.motivo, /^Vende en corto 0,03652300 BTC/);
  assert.equal(P.dimensionar({ entrada: 61000, stop: 62000, config: CONFIG, lado: 'corta' }).btc, 0.036523);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 62000, config: CONFIG, lado: 'larga' }),
    /en una compra el stop \(62\.000,00 €\) debe quedar por debajo de la entrada \(61\.000,00 €\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, lado: 'corta' }), /en un corto el stop/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, lado: 'arriba' }), /el lado debe ser 'larga' o 'corta' \(llegó «arriba»\)/);
});

test('entradas raras: errores en castellano, nunca un TypeError', () => {
  for (const entrada of [NaN, null, undefined, -1, 0, '61000', Infinity]) {
    assert.throws(() => P.dimensionar({ entrada, stop: 60000, config: CONFIG }), /dimensionar: la entrada debe ser un precio positivo/);
  }
  assert.throws(() => P.dimensionar({ entrada: 61000, config: CONFIG }), /el stop debe ser un precio positivo \(llegó undefined\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 61000, config: CONFIG }), /el stop no puede estar en el mismo precio que la entrada \(61\.000,00 €\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, cuenta: 'mucho' }), /la cuenta debe ser el resumen de la cartera/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: CONFIG, cuenta: { efectivo: NaN } }), /la cuenta no trae un efectivo válido \(llegó NaN\)/);
  assert.throws(() => P.dimensionar(), /la entrada debe ser un precio positivo \(llegó undefined\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: conRiesgo({ perdida_max_operacion: 0 }) }),
    /config\.riesgo\.perdida_max_operacion debe ser un número mayor que 0 \(llegó 0\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: conRiesgo({ posicion_max_pct: 150 }) }),
    /config\.riesgo\.posicion_max_pct debe ser un número mayor que 0 y ≤ 100 \(llegó 150\)/);
  assert.throws(() => P.dimensionar({ entrada: 61000, stop: 60000, config: { ...CONFIG, costes: { comision_pct: 'mucha' } } }),
    /config\.costes\.comision_pct debe ser un número ≥ 0 y ≤ 50 \(llegó «mucha»\)/);
  // Sin config: valores de partida.
  assert.equal(P.dimensionar({ entrada: 61000, stop: 60000 }).btc, 0.03668378);
  assert.equal(P.dimensionar({ entrada: 61000, stop: 60000, config: null }).btc, 0.03668378);
});

test('un límite con fracciones de céntimo se cuenta en céntimos hacia abajo', () => {
  // 50,559 € → 50,55 €; 50,55 / 1363 = 0,0370873… → 0,03708730 (· 1363 = 50,549989… → 50,55)
  const d = P.dimensionar({ entrada: 61000, stop: 60000, config: conRiesgo({ perdida_max_operacion: 50.559 }) });
  assert.equal(d.btc, 0.0370873);
  assert.equal(d.perdida_si_stop, 50.55);
});

test('leerReglas: el modo papel solo se activa con true de verdad', () => {
  assert.equal(P.leerReglas(CONFIG).papel, true);
  assert.equal(P.leerReglas({ ...CONFIG, papel: 'true' }).papel, false);
  assert.equal(P.leerReglas({ ...CONFIG, papel: 1 }).papel, false);
  assert.equal(P.leerReglas(undefined).papel, false);
  const r = P.leerReglas({ par: 'BTC-USD' });
  assert.equal(r.moneda, 'USD');
  assert.equal(r.perdida_max_operacion, 50);
  assert.equal(r.ventana_entrada_utc, null);
});

test('10.000 casos al azar: nunca se pasa de la pérdida, del efectivo ni del tamaño máximo', () => {
  const azar = prng(2026);
  for (let k = 0; k < 10_000; k++) {
    const entrada = 1000 + azar() * 99_000;
    const corto = azar() < 0.2;
    const distancia = entrada * (0.001 + azar() * 0.2);
    const stop = corto ? entrada + distancia : entrada - distancia;
    const config = {
      ...CONFIG,
      riesgo: { ...CONFIG.riesgo, perdida_max_operacion: 1 + azar() * 500, posicion_max_pct: 1 + azar() * 99 },
      costes: { comision_pct: azar(), deslizamiento_pct: azar() * 0.5 },
    };
    const efectivo = azar() < 0.05 ? 0 : azar() * 100_000;
    const capital = efectivo + azar() * 50_000;
    const d = P.dimensionar({ entrada, stop, config, cuenta: { efectivo, capital } });
    const reglas = P.leerReglas(config);
    const rpb = P.riesgoPorBtc(entrada, stop, reglas);
    assert.ok(d.btc * rpb <= config.riesgo.perdida_max_operacion + 1e-9, `caso ${k}: pérdida ${d.btc * rpb}`);
    assert.ok(d.perdida_si_stop <= config.riesgo.perdida_max_operacion, `caso ${k}: perdida_si_stop ${d.perdida_si_stop}`);
    assert.ok(P.costeConCostes(d.btc, entrada, reglas) <= efectivo + 1e-6, `caso ${k}: coste sobre efectivo`);
    assert.ok(P.costeConCostes(d.btc, entrada, reglas) <= (config.riesgo.posicion_max_pct / 100) * capital + 1e-6, `caso ${k}: tamaño`);
    assert.ok(Math.abs(d.btc * 1e8 - Math.round(d.btc * 1e8)) < 1e-4, `caso ${k}: ${d.btc} no son satoshis enteros`);
    assert.ok(d.btc === 0 || d.btc >= CONFIG.minimo_orden_btc, `caso ${k}: por debajo del mínimo`);
    assert.equal(d.btc === 0, d.limitado_por === 'minimo', `caso ${k}: limitado_por`);
  }
});
