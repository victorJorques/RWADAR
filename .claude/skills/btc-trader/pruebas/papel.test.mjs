// Pruebas del bróker en papel (sin red; el estado va a una carpeta temporal).
// Orden base: compra de 0,03573 BTC a 61.000 € (stop 60.000 €, objetivo 63.000 €)
// abierta el 14/11/2026 a las 10:22:30 UTC con el precio en 61.000 €.
// Con c = 0,0025 y d = 0,0005:
//   relleno = 61000 · 1,0005 = 61030,50 €
//   nominal = 0,03573 · 61030,50 = 2180,619765 → 2180,62 €; comisión 2180,62 · 0,0025 = 5,45155 → 5,45 €
//   coste = 2186,07 €; efectivo = 5000 − 2186,07 = 2813,93 €
//   si salta el stop: 60000 · 0,9995 = 59970; 0,03573 · 59970 = 2142,7281 → 2142,73; comisión 5,356825 → 5,36;
//     vuelven 2137,37 € → pérdida 2186,07 − 2137,37 = 48,70 € (= 1 R)
//   si llega al objetivo (orden limitada, sin deslizamiento): 0,03573 · 63000 = 2250,99; comisión 5,627475 → 5,63;
//     vuelven 2245,36 € → ganancia 59,29 €
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'btc-papel-'));
process.env.BTC_TRADER_ESTADO = path.join(tmp, 'estado');

const { RAIZ, dirEstado } = await import('../lib/comun.mjs');
const { comprobar } = await import('../lib/riesgo.mjs');
const P = await import('../lib/papel.mjs');

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => fs.rmSync(path.join(dirEstado(), 'papel.json'), { force: true }));

const CONFIG = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config.ejemplo.json'), 'utf8'));
const conRiesgo = cambios => ({ ...CONFIG, riesgo: { ...CONFIG.riesgo, ...cambios } });
const AHORA = Date.UTC(2026, 10, 14, 10, 22, 30); // 11:22:30 en Madrid
const MIN = 60_000;
const HORA = 3_600_000;
const ORDEN = Object.freeze({ lado: 'larga', btc: 0.03573, entrada: 61000, stop: 60000, objetivo: 63000 });
const RUTA = () => path.join(dirEstado(), 'papel.json');

/** Vela de 5 minutos del 14/11/2026 que abre a las hh:mm UTC. */
const vela = (hh, mm, o, h, l, c) => ({ t: Date.UTC(2026, 10, 14, hh, mm), o, h, l, c, v: 1 });
const a = (hh, mm, ss = 0) => Date.UTC(2026, 10, 14, hh, mm, ss);

function riesgoPara(cartera, orden = ORDEN, { ahora = AHORA, precio = 61000, config = CONFIG } = {}) {
  return comprobar({
    orden, config,
    cuenta: P.resumenCartera(cartera, precio, ahora),
    contexto: { ahora, precio_actual: precio, noticias_alto_impacto: [], divergencia_pct: 0.1 },
  });
}

function abrirBase({ orden = ORDEN, ahora = AHORA, precio = 61000, config = CONFIG, cartera = P.cargarCartera(config, { ahora }) } = {}) {
  const riesgo = riesgoPara(cartera, orden, { ahora, precio, config });
  assert.equal(riesgo.veredicto, 'PASA', riesgo.motivos.join(' '));
  return P.abrir({ cartera, orden, riesgo, confirmacion: 'sí', precio, ahora, config });
}

test('cargarCartera sin archivo da una nueva con el saldo inicial y no escribe nada', () => {
  const c = P.cargarCartera(CONFIG, { ahora: AHORA });
  assert.deepEqual(c, {
    version: 1, moneda: 'EUR', saldo_inicial: 5000, efectivo: 5000, posiciones: [], historial: [], creada: AHORA, actualizada: AHORA,
  });
  assert.equal(fs.existsSync(RUTA()), false);
  assert.equal(P.cargarCartera({ ...CONFIG, par: 'BTC-USD', cuenta: { saldo_inicial: 1000 } }, { ahora: AHORA }).moneda, 'USD');
});

test('guardarCartera es atómico: escribe a .tmp y renombra; ida y vuelta igual', () => {
  const { cartera } = abrirBase();
  const renombres = [];
  const original = fs.renameSync;
  fs.renameSync = (de, a) => { renombres.push([de, a]); return original(de, a); };
  try {
    assert.equal(P.guardarCartera(cartera), RUTA());
  } finally {
    fs.renameSync = original;
  }
  assert.equal(renombres.length, 1);
  assert.match(path.basename(renombres[0][0]), /^papel\.json\..+\.tmp$/);
  assert.equal(renombres[0][1], RUTA());
  assert.deepEqual(fs.readdirSync(dirEstado()).filter(n => n.endsWith('.tmp')), []);
  assert.deepEqual(P.cargarCartera(CONFIG), cartera);
  // Una cartera que no vale no llega a escribirse.
  const antes = fs.readFileSync(RUTA(), 'utf8');
  assert.throws(() => P.guardarCartera({ ...cartera, efectivo: NaN }), /no trae un efectivo válido \(llegó NaN\)/);
  assert.throws(() => P.guardarCartera(null), /falta la cartera de papel/);
  assert.equal(fs.readFileSync(RUTA(), 'utf8'), antes);
});

test('una cartera rota no se reinicia en silencio', () => {
  fs.mkdirSync(dirEstado(), { recursive: true });
  fs.writeFileSync(RUTA(), '{"efectivo": 12');
  assert.throws(() => P.cargarCartera(CONFIG), /está rota o vacía y no se puede leer; hay una copia en papel\.roto\.json.*5\.000,00 €/);
  assert.equal(fs.readFileSync(path.join(dirEstado(), 'papel.roto.json'), 'utf8'), '{"efectivo": 12');
  fs.writeFileSync(RUTA(), JSON.stringify({ efectivo: 100, saldo_inicial: 5000, posiciones: [{ id: 'P-1', btc: 'mucho' }] }));
  assert.throws(() => P.cargarCartera(CONFIG), /la posición «P-1» no trae btc \(un número positivo; llegó «mucho»\)/);
});

test('abrir sin «sí» exacto lanza un error y NO toca la cartera (ni en memoria ni en disco)', () => {
  const cartera = P.cargarCartera(CONFIG, { ahora: AHORA });
  P.guardarCartera(cartera);
  const enDisco = fs.readFileSync(RUTA(), 'utf8');
  const copia = structuredClone(cartera);
  const riesgo = riesgoPara(cartera);
  assert.equal(riesgo.veredicto, 'PASA');
  for (const confirmacion of [undefined, null, '', 'Sí', 'SI', 'Si', ' sí', 'sí ', 'sí.', 'yes', 'vale', true, 1, 'sí, claro']) {
    assert.throws(
      () => P.abrir({ cartera, orden: ORDEN, riesgo, confirmacion, precio: 61000, ahora: AHORA, config: CONFIG }),
      /^Error: No se abre nada: para abrir en papel hay que confirmar escribiendo «sí» \(en minúsculas y sin espacios\), y llegó .+\. La cartera no se ha tocado\.$/,
      `confirmación ${JSON.stringify(confirmacion)}`,
    );
  }
  assert.deepEqual(cartera, copia);
  assert.equal(fs.readFileSync(RUTA(), 'utf8'), enDisco);
  // «si» sin tilde y «sí» con la tilde aparte (i + ´) también valen.
  assert.equal(P.abrir({ cartera, orden: ORDEN, riesgo, confirmacion: 'si', precio: 61000, ahora: AHORA, config: CONFIG }).posicion.id, 'P-20261114-1');
  assert.equal(P.abrir({ cartera, orden: ORDEN, riesgo, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }).posicion.id, 'P-20261114-1');
  assert.deepEqual(cartera, copia, 'abrir devuelve una cartera nueva; la de entrada no cambia');
});

test('abrir con el riesgo BLOQUEADA, sin riesgo o con el PASA de otra orden: error y la cartera intacta', () => {
  const cartera = P.cargarCartera(CONFIG, { ahora: AHORA });
  const copia = structuredClone(cartera);
  const bloqueada = riesgoPara(cartera, { ...ORDEN, btc: 0.04 }); // 0,04 · 1363 = 54,52 € > 50 €
  assert.equal(bloqueada.veredicto, 'BLOQUEADA');
  assert.throws(() => P.abrir({ cartera, orden: { ...ORDEN, btc: 0.04 }, riesgo: bloqueada, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /^Error: No se abre nada: el gestor de riesgo dice BLOQUEADA: Si salta el stop pierdes 54,52 €; tu límite por operación es 50,00 €\..* La cartera no se ha tocado\.$/);
  assert.throws(() => P.abrir({ cartera, orden: ORDEN, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /falta el resultado del gestor de riesgo/);
  const pasa = riesgoPara(cartera);
  assert.throws(() => P.abrir({ cartera, orden: { ...ORDEN, btc: 0.04 }, riesgo: pasa, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /el PASA del gestor de riesgo es de otra orden/);
  const trucado = { ...pasa, comprobaciones: pasa.comprobaciones.map((x, k) => (k === 3 ? { ...x, ok: false } : x)) };
  assert.throws(() => P.abrir({ cartera, orden: ORDEN, riesgo: trucado, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /dice PASA pero alguna de sus comprobaciones falla/);
  assert.throws(() => P.abrir({ cartera, orden: ORDEN, riesgo: pasa, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: { ...CONFIG, papel: false } }),
    /config\.papel no está en true/);
  assert.deepEqual(cartera, copia);
  assert.equal(fs.existsSync(RUTA()), false);
});

test('abrir: llena con deslizamiento, cobra comisión y apunta lo que se pierde y se gana', () => {
  const cartera = P.cargarCartera(CONFIG, { ahora: AHORA });
  const r = abrirBase({ cartera });
  assert.deepEqual(r.posicion, {
    id: 'P-20261114-1',
    lado: 'larga',
    btc: 0.03573,
    entrada_plan: 61000,
    precio_mercado: 61000,
    precio_entrada: 61030.5,
    stop: 60000,
    objetivo: 63000,
    abierta: AHORA,
    salida_por_tiempo: AHORA + 24 * HORA,
    nominal_entrada: 2180.62,
    comision_entrada: 5.45,
    coste: 2186.07,
    costes: { comision_pct: 0.25, deslizamiento_pct: 0.05 },
    revisada_hasta: AHORA,
    riesgo_inicial: 48.7,
    ganancia_si_objetivo: 59.29,
  });
  assert.equal(r.cartera.efectivo, 2813.93);
  assert.equal(r.cartera.posiciones.length, 1);
  assert.equal(r.cartera.actualizada, AHORA);
  assert.deepEqual(r.avisos, []);
  assert.equal(r.texto, 'P-20261114-1 abierta EN PAPEL: compra de 0,03573000 BTC a 61.030,50 € (con deslizamiento), 2.186,07 € con comisión. ' +
    'Stop 60.000,00 € (pierdes 48,70 €), objetivo 63.000,00 € (ganas 59,29 €), se cierra sola el 15/11/2026 11:22 (10:22 UTC). Te quedan 2.813,93 € en efectivo.');
  assert.match(r.ticket, /^EN PAPEL/);
  // La segunda del mismo día (de Madrid) es la -2.
  const segunda = abrirBase({ cartera: r.cartera, ahora: AHORA + MIN });
  assert.equal(segunda.posicion.id, 'P-20261114-2');
  assert.equal(segunda.cartera.efectivo, 627.86); // 2813,93 − 2186,07
  // A las 23:30 UTC ya es el 15 en Madrid.
  const tarde = Date.UTC(2026, 10, 14, 23, 30);
  assert.equal(abrirBase({ ahora: tarde }).posicion.id, 'P-20261115-1');
});

test('abrir respeta la hora de salida del plan y rechaza precios que ya no valen', () => {
  const cartera = P.cargarCartera(CONFIG, { ahora: AHORA });
  const salida = a(16, 0);
  const conHora = { ...ORDEN, salida_por_tiempo: salida };
  assert.equal(abrirBase({ cartera, orden: conHora }).posicion.salida_por_tiempo, salida);
  const riesgo = riesgoPara(cartera);
  const abrir = extra => P.abrir({ cartera, orden: ORDEN, riesgo, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG, ...extra });
  // 400 / 61000 = 0,66 % > 0,6 %
  assert.throws(() => abrir({ precio: 61400 }),
    /^Error: No se abre nada: el precio de ahora \(61\.400,00 €\) está a un 0,66 % de la entrada \(61\.000,00 €\), más del 0,60 % permitido\./);
  assert.throws(() => abrir({ precio: 61369 }), /está a un 0,605 % de la entrada \(61\.000,00 €\), más del 0,60 % permitido/);
  assert.throws(() => abrir({ precio: null }), /abrir: falta el precio de ahora/);
  assert.throws(() => abrir({ orden: undefined }), /^Error: No se abre nada: falta la orden/);
  assert.throws(() => abrir({ precio: { precio: 'x' } }), /abrir: falta el precio de ahora .*llegó «x»/);
  const pasada = { ...ORDEN, salida_por_tiempo: AHORA - MIN };
  assert.throws(() => P.abrir({ cartera, orden: pasada, riesgo: riesgoPara(cartera, pasada), confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /la hora de salida del plan \(14\/11\/2026 11:21\) ya ha pasado/);
  const rara = { ...ORDEN, salida_por_tiempo: 24 };
  assert.throws(() => P.abrir({ cartera, orden: rara, riesgo: riesgoPara(cartera, rara), confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /salida_por_tiempo debe ser una hora en ms \(llegó 24\)/);
  // Precio como lo da precio() de datos.mjs: { precio, … }
  assert.equal(abrir({ precio: { precio: 61000, fuente: 'coinbase' } }).posicion.precio_entrada, 61030.5);
});

test('abrir: si el precio de ahora encarece el stop, compra menos para no pasar del límite por operación', () => {
  // 0,03668378 BTC es el tamaño justo para perder 50 € a 61.000. Pero el precio está en 61.200 (0,33 %, vale):
  // relleno 61200 · 1,0005 = 61230,60; stop 59970; por BTC (61230,60 − 59970) + 0,0025 · (61230,60 + 59970)
  // = 1260,60 + 303,0015 = 1563,6015 → 0,03668378 BTC perderían 57,36 €.
  // Caben 50 / 1563,6015 = 0,031977457… → 0,03197745 BTC:
  // entrada 0,03197745 · 61230,60 = 1957,998 → 1958,00 + comisión 4,895 → 4,90 = 1962,90;
  // stop 0,03197745 · 59970 = 1917,688 → 1917,69 − comisión 4,79 = 1912,90 → pérdida 50,00 €.
  const r = abrirBase({ orden: { ...ORDEN, btc: 0.03668378 }, precio: 61200 });
  assert.equal(r.posicion.btc, 0.03197745);
  assert.equal(r.posicion.precio_entrada, 61230.6);
  assert.equal(r.posicion.coste, 1962.9);
  assert.equal(r.posicion.riesgo_inicial, 50);
  assert.deepEqual(r.avisos, ['Al precio de ahora (61.200,00 €) 0,03668378 BTC perderían 57,36 € si salta el stop, más de tu límite por operación (50,00 €): se compran 0,03197745 BTC.']);
  // Al precio de la entrada no hace falta tocar nada.
  assert.deepEqual(abrirBase({ orden: { ...ORDEN, btc: 0.03668378 } }).avisos, []);
});

test('abrir: tampoco se pasa de lo que queda del límite diario', () => {
  // Hoy ya se han perdido 120 €: a esta orden le quedan 150 − 120 = 30 €.
  // A 61.000: 0,022 · 1363 = 29,99 € (PASA). Llenando a 61.200: 0,022 · 1563,6015 = 34,40 € > 30 €.
  // 30 / 1563,6015 = 0,01918647; con céntimos esa pierde 30,01 € y se baja a 0,01918640:
  // entrada 1174,79 + 2,94 = 1177,73; stop 1150,61 − 2,88 = 1147,73 → pérdida 30,00 €.
  const cartera = {
    ...P.cargarCartera(CONFIG, { ahora: AHORA }), efectivo: 4880,
    historial: [{ id: 'P-20261114-1', abierta: AHORA - HORA, cerrada: AHORA - HORA / 2, pnl: -120 }],
  };
  const r = abrirBase({ cartera, orden: { ...ORDEN, btc: 0.022 }, precio: 61200 });
  assert.equal(r.posicion.id, 'P-20261114-2');
  assert.equal(r.posicion.btc, 0.0191864);
  assert.equal(r.posicion.coste, 1177.73);
  assert.equal(r.posicion.riesgo_inicial, 30);
  assert.deepEqual(r.avisos, ['Al precio de ahora (61.200,00 €) 0,02200000 BTC perderían 34,40 € si salta el stop, más de lo que te queda hoy (30,00 €): se compran 0,01918640 BTC.']);
});

test('abrir: si al precio de ahora no llega el efectivo, compra lo que cabe en satoshis', () => {
  // Límite por operación alto para que aquí mande solo el efectivo.
  const config = conRiesgo({ posicion_max_pct: 100, perdida_max_operacion: 1000 });
  const cartera = { ...P.cargarCartera(config, { ahora: AHORA }), saldo_inicial: 2186.07, efectivo: 2186.07 };
  // El riesgo cuenta a 61.000: 2186,06859 ≤ 2186,07. Pero el precio está en 61.100 (0,16 %, vale):
  // relleno 61100 · 1,0005 = 61130,55; 0,03573 BTC costarían 2184,19 + 5,46 = 2189,65 €.
  // Caben 2186,07 / (61130,55 · 1,0025 = 61283,376…) = 0,0356715006… → 0,03567150 BTC:
  // 0,0356715 · 61130,55 = 2180,618… → 2180,62 + comisión 5,45 = 2186,07 €.
  const r = abrirBase({ cartera, precio: 61100, config });
  assert.equal(r.posicion.btc, 0.0356715);
  assert.equal(r.posicion.coste, 2186.07);
  assert.equal(r.cartera.efectivo, 0);
  assert.deepEqual(r.avisos, ['Al precio de ahora 0,03573000 BTC costaban 2.189,65 € y tienes 2.186,07 €: se compran 0,03567150 BTC.']);
});

test('ticket: texto llano con EN PAPEL, importe, stop, objetivo y hora de cierre', () => {
  const t = P.ticket({ ...ORDEN, salida_por_tiempo: AHORA + 24 * HORA }, CONFIG);
  // costes de entrada = 0,03573 · 61000 · 0,003 = 6,53859 → 6,54 €
  assert.equal(t, [
    'EN PAPEL (sin dinero real) · COMPRA 0,03573000 BTC a 61.000,00 €: 2.179,53 € más 6,54 € de comisión y deslizamiento.',
    'Stop en 60.000,00 €: si salta, pierdes 48,70 € con comisiones y deslizamiento.',
    'Objetivo en 63.000,00 €: si llega, ganas 59,29 € ya descontados los costes.',
    'Si no toca ninguno, se cierra sola el 15/11/2026 11:22 (10:22 UTC).',
  ].join('\n'));
  const lineas = P.ticket(ORDEN, CONFIG).split('\n');
  assert.ok(lineas.length >= 3 && lineas.length <= 5);
  assert.equal(lineas.at(-1), 'Si no toca ninguno, se cierra sola 24 h después de abrirla.');
  // Objetivo tan cerca que los costes se lo comen: 0,03573 · (100 − 183 − 61100·0,0025) = −8,42 €
  assert.match(P.ticket({ ...ORDEN, objetivo: 61100 }, CONFIG), /aun llegando, los costes se comen la ganancia y pierdes 8,42 €/);
  assert.match(P.ticket({ lado: 'corta', btc: 0.01, entrada: 61000, stop: 62000, objetivo: 59000 }, CONFIG), /^EN PAPEL \(sin dinero real\) · VENTA EN CORTO de 0,01000000 BTC/);
  assert.throws(() => P.ticket({ ...ORDEN, btc: 0 }, CONFIG), /ticket: la orden no trae btc \(un número positivo; llegó 0\)/);
  assert.throws(() => P.ticket({ ...ORDEN, stop: 62000 }, CONFIG), /ticket: en una compra tiene que ser stop < entrada < objetivo/);
  assert.throws(() => P.ticket(null, CONFIG), /ticket: falta la orden/);
});

// ---------------------------------------------------------------- revisar

const abierta = () => abrirBase().cartera; // P-20261114-1, efectivo 2813,93 €
const revisar = (velas, extra = {}) => P.revisar({ cartera: abierta(), velas, ahora: a(10, 50), intervalo: '5m', ...extra });

test('revisar: el mínimo toca el stop → sale al stop con deslizamiento (−1 R); la vela de la apertura no cuenta', () => {
  const r = revisar([
    vela(10, 20, 61000, 61100, 59000, 61000), // contiene la apertura (10:22:30): no cuenta aunque baje del stop
    vela(10, 25, 61000, 61200, 60500, 61100),
    vela(10, 30, 61100, 61150, 59990, 60100),
  ]);
  assert.equal(r.cerradas.length, 1);
  const h = r.cerradas[0];
  assert.equal(h.motivo, 'stop');
  assert.equal(h.cerrada, a(10, 30));
  assert.equal(h.precio_salida, 59970); // 60000 · 0,9995
  assert.equal(h.nominal_salida, 2142.73);
  assert.equal(h.comision_salida, 5.36);
  assert.equal(h.ingreso, 2137.37);
  assert.equal(h.pnl, -48.7);
  assert.equal(h.pnl_pct, -2.23); // −48,70 / 2186,07 = −2,2277 %
  assert.equal(h.R, -1);
  assert.equal(h.detalle, 'La vela de las 14/11/2026 11:30 bajó hasta 59.990,00 € y tocó el stop (60.000,00 €).');
  assert.equal(r.cartera.efectivo, 4951.3); // 2813,93 + 2137,37
  assert.deepEqual(r.cartera.posiciones, []);
  assert.equal(r.cartera.historial.length, 1);
  assert.equal('revisada_hasta' in h, false);
  assert.equal(r.texto, 'P-20261114-1 cerrada por stop a 59.970,00 €: pierdes 48,70 € (-2,23 %, -1 R). ' + h.detalle);
});

test('revisar: la vela abre ya por debajo del stop → sale a esa apertura con deslizamiento', () => {
  const h = revisar([vela(10, 25, 59800, 59900, 59500, 59600)]).cerradas[0];
  // 59800 · 0,9995 = 59770,10; 0,03573 · 59770,10 = 2135,585673 → 2135,59; comisión 5,338975 → 5,34; vuelven 2130,25
  assert.equal(h.motivo, 'stop');
  assert.equal(h.precio_salida, 59770.1);
  assert.equal(h.ingreso, 2130.25);
  assert.equal(h.pnl, -55.82); // 2130,25 − 2186,07
  assert.equal(h.R, -1.15); // −55,82 / 48,70 = −1,146
  assert.match(h.detalle, /abrió ya por debajo del stop \(59\.800,00 € < 60\.000,00 €\): se sale a esa apertura/);
});

test('revisar: el máximo toca el objetivo → sale al objetivo sin deslizamiento', () => {
  const h = revisar([vela(10, 25, 61000, 61300, 60900, 61200), vela(10, 30, 61500, 63050, 61400, 62900)]).cerradas[0];
  assert.equal(h.motivo, 'objetivo');
  assert.equal(h.cerrada, a(10, 30));
  assert.equal(h.precio_salida, 63000);
  assert.equal(h.ingreso, 2245.36);
  assert.equal(h.pnl, 59.29);
  assert.equal(h.pnl_pct, 2.71); // 59,29 / 2186,07 = 2,712 %
  assert.equal(h.R, 1.22); // 59,29 / 48,70 = 1,217
});

test('revisar: la vela abre ya por encima del objetivo → vende a esa apertura', () => {
  // 0,03573 · 63300 = 2261,709 → 2261,71; comisión 5,654275 → 5,65; vuelven 2256,06 → 2256,06 − 2186,07 = 69,99
  const h = revisar([vela(10, 25, 63300, 63500, 63200, 63400)]).cerradas[0];
  assert.equal(h.motivo, 'objetivo');
  assert.equal(h.precio_salida, 63300);
  assert.equal(h.pnl, 69.99);
});

test('revisar: stop y objetivo en la misma vela cuenta como stop (prudente)', () => {
  const h = revisar([vela(10, 25, 61000, 63100, 59900, 62000)]).cerradas[0];
  assert.equal(h.motivo, 'stop');
  assert.equal(h.pnl, -48.7);
  assert.match(h.detalle, /también tocó el objetivo, pero en la misma vela cuenta el stop \(prudente\)/);
});

test('revisar: pasada la hora de salida, sale al precio de ese momento', () => {
  const orden = { ...ORDEN, salida_por_tiempo: a(10, 40) };
  const cartera = abrirBase({ orden }).cartera;
  const tranquilas = [vela(10, 25, 61000, 61200, 60800, 61100), vela(10, 30, 61100, 61300, 60900, 61200), vela(10, 35, 61200, 61400, 61000, 61200)];
  // Con la vela de las 10:40: a su apertura, 61200 · 0,9995 = 61169,40; 0,03573 · 61169,40 = 2185,582662 → 2185,58;
  // comisión 5,46395 → 5,46; vuelven 2180,12 → 2180,12 − 2186,07 = −5,95
  const porVela = P.revisar({ cartera, velas: [...tranquilas, vela(10, 40, 61200, 63500, 59000, 61000)], ahora: a(10, 50), intervalo: '5m' });
  const h = porVela.cerradas[0];
  assert.equal(h.motivo, 'tiempo');
  assert.equal(h.cerrada, a(10, 40));
  assert.equal(h.precio_salida, 61169.4);
  assert.equal(h.pnl, -5.95);
  assert.match(h.detalle, /^Pasó la hora de salida \(14\/11\/2026 11:40\) sin tocar stop ni objetivo: se sale a la apertura de la vela de las 14\/11\/2026 11:40/);
  // Sin esa vela, al precio de ahora (61.200 €) y a la hora de ahora.
  const porPrecio = P.revisar({ cartera, velas: tranquilas, precio: 61200, ahora: a(10, 41), intervalo: '5m' }).cerradas[0];
  assert.equal(porPrecio.motivo, 'tiempo');
  assert.equal(porPrecio.cerrada, a(10, 41));
  assert.equal(porPrecio.pnl, -5.95);
  // Sin precio: al cierre de la última vela conocida (61.200 €).
  assert.equal(P.revisar({ cartera, velas: tranquilas, ahora: a(10, 41), intervalo: '5m' }).cerradas[0].pnl, -5.95);
  // Sin velas ni precio no se puede cerrar: se avisa y sigue abierta.
  const sinNada = P.revisar({ cartera, velas: [], ahora: a(10, 41) });
  assert.equal(sinNada.cerradas.length, 0);
  assert.match(sinNada.avisos[0], /^P-20261114-1: ya pasó su hora de salida \(14\/11\/2026 11:40\) pero no hay precio para cerrarla/);
});

test('revisar: el precio de ahora también cuenta (stop prudente al precio, objetivo al objetivo)', () => {
  // 59900 · 0,9995 = 59870,05; 0,03573 · 59870,05 = 2139,156887 → 2139,16; comisión 5,3479 → 5,35; vuelven 2133,81 → −52,26
  const stop = revisar([], { precio: 59900 }).cerradas[0];
  assert.equal(stop.motivo, 'stop');
  assert.equal(stop.precio_salida, 59870.05);
  assert.equal(stop.pnl, -52.26);
  assert.equal(stop.cerrada, a(10, 50));
  const objetivo = revisar([], { precio: 63400 }).cerradas[0];
  assert.equal(objetivo.motivo, 'objetivo');
  assert.equal(objetivo.precio_salida, 63000);
  assert.equal(objetivo.pnl, 59.29);
  const nada = revisar([], { precio: { precio: 61500 } });
  assert.equal(nada.cerradas.length, 0);
  assert.equal(nada.texto, 'La posición abierta no ha tocado stop, objetivo ni su hora de salida.');
  assert.equal(nada.cartera.posiciones[0].ultima_revision, a(10, 50));
});

test('revisar solo mira lo nuevo; una vela a medias se vuelve a mirar entera', () => {
  // 10:36: las de 10:25 y 10:30 ya cerraron; la de 10:35 va a medias (sin tocar nada).
  const primera = P.revisar({
    cartera: abierta(), intervalo: '5m', ahora: a(10, 36),
    velas: [vela(10, 25, 61000, 61200, 60800, 61100), vela(10, 30, 61100, 61300, 60900, 61200), vela(10, 35, 61200, 61250, 61100, 61150)],
  });
  assert.equal(primera.cerradas.length, 0);
  assert.equal(primera.cartera.posiciones[0].revisada_hasta, a(10, 35));
  // 10:41: la de 10:25 llega «distinta» (ya revisada: no cuenta) y la de 10:35, ya entera, bajó hasta el stop.
  const segunda = P.revisar({
    cartera: primera.cartera, intervalo: '5m', ahora: a(10, 41),
    velas: [vela(10, 25, 61000, 61200, 59000, 61100), vela(10, 35, 61200, 61250, 59950, 60100)],
  });
  assert.equal(segunda.cerradas.length, 1);
  assert.equal(segunda.cerradas[0].cerrada, a(10, 35));
  assert.equal(segunda.cerradas[0].pnl, -48.7);
});

test('revisar con velas raras no rompe', () => {
  for (const velas of [null, undefined, [], [null, 7, { t: NaN }], [vela(10, 25, 61000, 60000, 61000, 61000)]]) {
    const r = revisar(velas);
    assert.equal(r.cerradas.length, 0, JSON.stringify(velas));
    assert.equal(r.cartera.posiciones.length, 1);
  }
  assert.deepEqual(revisar([null, { t: 1 }]).avisos, ['Se han saltado 2 velas con datos que no son números o con el máximo por debajo del mínimo.']);
  // Una sola vela, sin intervalo: se mira pero no se da por revisada (podría seguir abierta).
  const una = P.revisar({ cartera: abierta(), velas: [vela(10, 25, 61000, 61200, 60800, 61100)], ahora: a(10, 50) });
  assert.equal(una.cartera.posiciones[0].revisada_hasta, AHORA);
  // Una Serie de datos.mjs vale igual (intervalo y velas cerradas salen de ella), y desordenada también.
  const serie = { intervalo: '5m', ultimaCerrada: 1, velas: [vela(10, 30, 61100, 61150, 59990, 60100), vela(10, 25, 61000, 61200, 60500, 61100)] };
  assert.equal(P.revisar({ cartera: abierta(), velas: serie, ahora: a(10, 50) }).cerradas[0].pnl, -48.7);
  assert.throws(() => revisar([], { intervalo: '2h' }), /Intervalo desconocido: «2h»/);
  assert.throws(() => revisar('velas'), /Las velas deben ser una lista o una serie/);
  assert.throws(() => P.revisar({ velas: [] }), /revisar: falta la cartera de papel/);
  // Velas posteriores a «ahora» no existen todavía.
  assert.equal(revisar([vela(10, 55, 61000, 61200, 59000, 61100)]).cerradas.length, 0);
});

test('leerVelas: intervalo deducido, cerradas y fin', () => {
  const { velas, ms } = P.leerVelas([vela(10, 30, 1, 2, 1, 2), vela(10, 25, 1, 2, 1, 2), vela(10, 30, 1, 3, 1, 2)], { ahora: a(10, 34) });
  assert.equal(ms, 300_000);
  assert.deepEqual(velas.map(v => [v.t, v.h, v.fin, v.cerrada]), [
    [a(10, 25), 2, a(10, 30), true],
    [a(10, 30), 3, a(10, 35), false], // duplicada: se queda la última que llega
  ]);
});

test('cerrar a mano: precio con deslizamiento y comisión', () => {
  const cartera = abierta();
  // 61600 · 0,9995 = 61569,20; 0,03573 · 61569,20 = 2199,867516 → 2199,87; comisión 5,499675 → 5,50; vuelven 2194,37 → +8,30
  const r = P.cerrar({ cartera, id: 'P-20261114-1', precio: 61600, ahora: a(11, 0) });
  assert.equal(r.cerrada.motivo, 'manual');
  assert.equal(r.cerrada.precio_salida, 61569.2);
  assert.equal(r.cerrada.ingreso, 2194.37);
  assert.equal(r.cerrada.pnl, 8.3);
  assert.equal(r.cerrada.cerrada, a(11, 0));
  assert.equal(r.cartera.efectivo, 5008.3); // 2813,93 + 2194,37
  assert.deepEqual(r.cartera.posiciones, []);
  assert.equal(r.texto, 'P-20261114-1 cerrada a mano a 61.569,20 €: ganas 8,30 € (+0,38 %, +0,17 R). Cerrada a mano al precio de ahora (61.600,00 €).');
  assert.throws(() => P.cerrar({ cartera, id: 'P-x', precio: 61600 }), /cerrar: no hay ninguna posición abierta con id «P-x»\. Abiertas: P-20261114-1\./);
  assert.throws(() => P.cerrar({ cartera, id: 'P-20261114-1' }), /cerrar: falta el precio de ahora/);
  assert.throws(() => P.cerrar({ cartera: r.cartera, id: 'P-20261114-1', precio: 61600 }), /No hay posiciones abiertas\./);
});

test('cortos (con riesgo.cortos = true): todo al revés', () => {
  const config = conRiesgo({ cortos: true });
  const orden = { lado: 'corta', btc: 0.03573, entrada: 61000, stop: 62000, objetivo: 59000 };
  // relleno 61000 · 0,9995 = 60969,50; nominal 2178,440235 → 2178,44; comisión 5,4461 → 5,45; coste (garantía) 2183,89
  const { cartera, posicion } = abrirBase({ orden, config });
  assert.equal(posicion.precio_entrada, 60969.5);
  assert.equal(posicion.coste, 2183.89);
  assert.equal(cartera.efectivo, 2816.11);
  // Stop: 62000 · 1,0005 = 62031; 0,03573 · 62031 = 2216,36763 → 2216,37; comisión 5,54;
  // vuelve 2·2178,44 − 2216,37 − 5,54 = 2134,97 → −48,92 (= 1 R)
  const stop = P.revisar({ cartera, velas: [vela(10, 25, 61000, 62050, 60900, 61900)], ahora: a(10, 40), intervalo: '5m' });
  assert.equal(stop.cerradas[0].motivo, 'stop');
  assert.equal(stop.cerradas[0].precio_salida, 62031);
  assert.equal(stop.cerradas[0].pnl, -48.92);
  assert.equal(stop.cerradas[0].R, -1);
  assert.equal(stop.cartera.efectivo, 4951.08);
  // Objetivo: 0,03573 · 59000 = 2108,07; comisión 5,27; vuelve 4356,88 − 2108,07 − 5,27 = 2243,54 → +59,65
  const objetivo = P.revisar({ cartera, velas: [vela(10, 25, 61000, 61500, 58950, 59100)], ahora: a(10, 40), intervalo: '5m' });
  assert.equal(objetivo.cerradas[0].motivo, 'objetivo');
  assert.equal(objetivo.cerradas[0].pnl, 59.65);
  // Sin cortos activados, abrir un corto se niega aunque llegue un PASA.
  const pasa = riesgoPara(P.cargarCartera(config, { ahora: AHORA }), orden, { config });
  assert.throws(() => P.abrir({ cartera: P.cargarCartera(CONFIG, { ahora: AHORA }), orden, riesgo: pasa, confirmacion: 'sí', precio: 61000, ahora: AHORA, config: CONFIG }),
    /es un corto y los cortos están desactivados/);
});

test('resumenCartera: capital a precio de ahora, pérdidas si stop y operaciones de hoy', () => {
  const { cartera } = abrirBase();
  const r = P.resumenCartera(cartera, 62000, a(12, 0));
  // 0,03573 · 62000 = 2215,26 → capital 2813,93 + 2215,26 = 5029,19
  assert.equal(r.valor_posiciones, 2215.26);
  assert.equal(r.capital, 5029.19);
  assert.equal(r.pnl_total, 29.19);
  assert.equal(r.pnl_total_pct, 0.58);
  assert.equal(r.pnl_hoy, 0);
  assert.equal(r.operaciones_hoy, 1);
  assert.equal(r.perdida_abierta_si_stop, 48.7);
  assert.equal(r.dia, '2026-11-14');
  assert.deepEqual(r.posiciones[0], {
    id: 'P-20261114-1', lado: 'larga', btc: 0.03573, precio_entrada: 61030.5, stop: 60000, objetivo: 63000,
    abierta: AHORA, salida_por_tiempo: AHORA + 24 * HORA, coste: 2186.07, valor: 2215.26, pnl_latente: 29.19,
    perdida_si_stop: 48.7, ganancia_si_objetivo: 59.29,
  });
  // Sin precio: a precio de entrada, con aviso.
  const sinPrecio = P.resumenCartera(cartera, null, a(12, 0));
  assert.equal(sinPrecio.valor_posiciones, 2180.62);
  assert.deepEqual(sinPrecio.avisos, ['Sin precio de ahora: las posiciones se valoran a su precio de entrada.']);
  // Un stop subido por encima de la entrada ya no puede perder.
  const protegida = structuredClone(cartera);
  protegida.posiciones[0].stop = 61500;
  assert.equal(P.resumenCartera(protegida, 62000, a(12, 0)).posiciones[0].perdida_si_stop, 0);
  assert.match(P.textoCartera(r), /^Cartera EN PAPEL: 5\.029,19 € \(2\.813,93 € en efectivo y 2\.215,26 € en BTC\), ganas 29,19 € desde el inicio \(\+0,58 %\)\./);
  assert.throws(() => P.resumenCartera(undefined), /resumenCartera: falta la cartera de papel/);
  assert.throws(() => P.textoCartera({}), /textoCartera: falta el resumen/);
});

test('el día de Madrid en el cambio de hora: pnl_hoy y operaciones_hoy', () => {
  const ms = iso => Date.parse(iso);
  const cartera = {
    moneda: 'EUR', saldo_inicial: 5000, efectivo: 4930, posiciones: [],
    historial: [
      { id: 'P-20261024-1', abierta: ms('2026-10-24T21:59:00Z'), cerrada: ms('2026-10-24T22:10:00Z'), pnl: -40 }, // 24 23:59 → 25 00:10 (UTC+2)
      { id: 'P-20261025-1', abierta: ms('2026-10-24T22:30:00Z'), cerrada: ms('2026-10-25T01:30:00Z'), pnl: -30 }, // 25 00:30 → 25 02:30 (UTC+1)
      { id: 'P-20261025-2', abierta: ms('2026-10-25T22:59:00Z'), cerrada: ms('2026-10-25T23:00:00Z'), pnl: 15 }, // 25 23:59 → 26 00:00
    ],
  };
  const dia25 = P.resumenCartera(cartera, 61000, ms('2026-10-25T22:59:30Z'));
  assert.equal(dia25.dia, '2026-10-25');
  assert.equal(dia25.operaciones_hoy, 2);
  assert.equal(dia25.pnl_hoy, -70);
  assert.equal(dia25.cerradas_hoy, 2);
  const dia26 = P.resumenCartera(cartera, 61000, ms('2026-10-25T23:00:00Z'));
  assert.equal(dia26.dia, '2026-10-26');
  assert.equal(dia26.operaciones_hoy, 0);
  assert.equal(dia26.pnl_hoy, 15);
  // En verano, medianoche de Madrid son las 22:00 UTC.
  const verano = { ...cartera, historial: [{ id: 'P-20260715-1', abierta: ms('2026-07-14T22:00:00Z'), cerrada: ms('2026-07-14T22:30:00Z'), pnl: -5 }] };
  assert.equal(P.resumenCartera(verano, 61000, ms('2026-07-14T23:00:00Z')).operaciones_hoy, 1);
  assert.equal(P.resumenCartera(verano, 61000, ms('2026-07-14T21:59:00Z')).operaciones_hoy, 0);
  assert.equal(dia25.operaciones_cerradas, 3);
  assert.equal(dia25.ganadas, 1);
  assert.equal(dia25.acierto_pct, 33.33);
});
