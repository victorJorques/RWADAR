// Pruebas de lib/indicadores.mjs y de los patrones de pruebas/sinteticas.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sma, ema, rsi, atr, rangoVerdadero, bollinger, donchian, vwapDiario, volumenRel,
  pivotes, pivotesHasta, rangoApertura,
} from '../lib/indicadores.mjs';
import { generarVelas, serieDe, PATRONES } from './sinteticas.mjs';

const cerca = (a, b, tol = 1e-9, msg) => assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≉ ${b}`);
const cercaArray = (a, b, tol = 1e-9) => {
  assert.equal(a.length, b.length);
  a.forEach((x, i) => (b[i] === null ? assert.equal(x, null, `índice ${i}`) : cerca(x, b[i], tol, `índice ${i}: ${x} ≉ ${b[i]}`)));
};
const V = (h, l, c, extra = {}) => ({ t: 0, o: c, h, l, c, v: 1, ...extra });

// ---------------------------------------------------------------- medias

test('sma y ema con cuentas a mano', () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
  assert.deepEqual(sma([1, 2, 3], 1), [1, 2, 3]);
  // ema(3): k = 0,5; arranca con la media simple de los 3 primeros.
  assert.deepEqual(ema([10, 11, 12, 20, 10], 3), [null, null, 11, 15.5, 12.75]);
  assert.deepEqual(ema([5, 5, 5, 5], 2), [null, 5, 5, 5]);
});

test('sma y ema: valores raros dejan null y reinician, sin romper', () => {
  assert.deepEqual(sma([1, NaN, 3, 4, 5], 2), [null, null, null, 3.5, 4.5]);
  assert.deepEqual(sma([1, null, 3], 1), [1, null, 3]);
  cercaArray(ema([1, 2, NaN, 4, 5, 6], 2), [null, 1.5, null, null, 4.5, 5.5]);
  for (const raro of [[], null, undefined, 'abc', [7]]) {
    assert.ok(Array.isArray(sma(raro, 3)));
    assert.ok(Array.isArray(ema(raro, 3)));
  }
  assert.deepEqual(sma([7], 3), [null]);
  assert.throws(() => sma([1, 2], 0), /sma: el periodo debe ser un entero mayor o igual que 1 \(llegó 0\)/);
  assert.throws(() => ema([1, 2], 2.5), /ema: el periodo/);
});

// ---------------------------------------------------------------- RSI

test('rsi de Wilder coincide con la serie de referencia clásica (StockCharts, 14 periodos)', () => {
  const cierres = [44.3389, 44.0902, 44.1497, 43.6124, 44.3278, 44.8264, 45.0955, 45.4245, 45.8433, 46.0826,
    45.8931, 46.0328, 45.6140, 46.2820, 46.2820, 46.0028, 46.0328, 46.4116, 46.2222, 45.6439, 46.2122, 46.2521,
    45.7137, 46.4515, 45.7835, 45.3548, 44.0288, 44.1783, 44.2181, 44.5672, 43.4205, 42.6628, 43.1314];
  const esperado = [70.53, 66.32, 66.55, 69.41, 66.36, 57.97, 62.93, 63.26, 56.06, 62.38, 54.71, 50.42,
    39.99, 41.46, 41.87, 45.46, 37.30, 33.08, 37.77];
  const r = rsi(cierres, 14);
  assert.equal(r.length, cierres.length);
  assert.ok(r.slice(0, 14).every(x => x === null), 'sin valor hasta tener 14 cambios');
  r.slice(14).forEach((x, i) => cerca(x, esperado[i], 0.005, `RSI[${14 + i}] = ${x.toFixed(4)}, la referencia dice ${esperado[i]}`));
});

test('rsi: casos límite (todo sube, todo plano, huecos)', () => {
  assert.equal(rsi([1, 2, 3, 4, 5], 3).at(-1), 100);
  assert.equal(rsi([5, 5, 5, 5, 5], 3).at(-1), 50);
  assert.equal(rsi([5, 4, 3, 2, 1], 3).at(-1), 0);
  assert.deepEqual(rsi([1, 2], 14), [null, null]);
  assert.deepEqual(rsi([], 14), []);
  const conHueco = rsi([1, 2, 3, null, 4, 5, 6, 7], 3);
  assert.deepEqual(conHueco.slice(0, 7), [null, null, null, null, null, null, null], 'tras el hueco vuelve a necesitar 3 cambios');
  assert.equal(conHueco[7], 100);
});

// ---------------------------------------------------------------- ATR

test('atr de Wilder con cuentas a mano (incluye saltos de apertura)', () => {
  const velas = [
    V(10, 8, 9), // RV = 2 (primera: h − l)
    V(11, 9, 10.5), // max(2, 2, 0) = 2
    V(12, 10, 10), // max(2, 1,5, 0,5) = 2
    V(10.5, 7, 8), // max(3,5, 0,5, 3) = 3,5
    V(9, 8.5, 8.8), // max(0,5, |9 − 8| = 1, 0,5) = 1
    V(13, 12, 12.5), // salto: max(1, 4,2, 3,2) = 4,2
  ];
  cercaArray(rangoVerdadero(velas), [2, 2, 2, 3.5, 1, 4.2]);
  // n = 3: primer ATR = media de los 3 primeros; después (previo·2 + RV)/3.
  cercaArray(atr(velas, 3), [null, null, 2, 2.5, 2, 8.2 / 3]);
  assert.deepEqual(atr(velas.slice(0, 1), 14), [null]);
  assert.deepEqual(atr([], 14), []);
  // Una vela rota reinicia el ATR.
  const rota = [...velas.slice(0, 3), { t: 0, o: 1, h: NaN, l: 1, c: 1, v: 1 }, ...velas.slice(3)];
  const r = atr(rota, 3);
  assert.equal(r[3], null);
  assert.equal(r[4], null);
  assert.equal(r[5], null);
  cerca(r[6], (3.5 + 1 + 4.2) / 3);
});

// ---------------------------------------------------------------- Bollinger, Donchian, VWAP, volumen

test('bollinger con desviación poblacional', () => {
  const b = bollinger([1, 2, 3, 4, 5], 5, 2);
  assert.deepEqual(b.media, [null, null, null, null, 3]);
  cerca(b.sup[4], 3 + 2 * Math.SQRT2);
  cerca(b.inf[4], 3 - 2 * Math.SQRT2);
  assert.deepEqual(bollinger([], 20, 2), { media: [], sup: [], inf: [] });
  assert.throws(() => bollinger([1], 20, -1), /k debe ser un número no negativo/);
});

test('donchian usa las n velas ANTERIORES, sin la actual', () => {
  const h = [5, 7, 6, 8, 4];
  const l = [1, 3, 2, 4, 0];
  const velas = h.map((x, i) => V(x, l[i], (x + l[i]) / 2));
  const d = donchian(velas, 2);
  assert.deepEqual(d.max, [null, null, 7, 7, 8]);
  assert.deepEqual(d.min, [null, null, 1, 2, 2]);
  // Una vela rota deja null en las ventanas que la contienen.
  const rota = donchian([...velas.slice(0, 2), { h: NaN, l: 1, c: 1 }, ...velas.slice(3)], 2);
  assert.deepEqual(rota.max, [null, null, 7, null, null]);
  // Coincide con la cuenta directa en una serie larga.
  const largas = generarVelas({ semilla: 5, n: 400 });
  const dn = donchian(largas, 24);
  for (let i = 24; i < largas.length; i++) {
    const ventana = largas.slice(i - 24, i);
    assert.equal(dn.max[i], Math.max(...ventana.map(x => x.h)));
    assert.equal(dn.min[i], Math.min(...ventana.map(x => x.l)));
  }
});

test('vwapDiario se reinicia a las 00:00 UTC', () => {
  const h = (d, hora) => Date.UTC(2026, 10, d, hora);
  const velas = [
    { t: h(13, 22), o: 10, h: 12, l: 8, c: 10, v: 1 }, // típico 10
    { t: h(13, 23), o: 10, h: 14, l: 10, c: 12, v: 3 }, // típico 12 → (10 + 36)/4
    { t: h(14, 0), o: 18, h: 20, l: 16, c: 18, v: 2 }, // día nuevo: típico 18
    { t: h(14, 1), o: 20, h: 22, l: 18, c: 20, v: 2 }, // (36 + 40)/4
  ];
  assert.deepEqual(vwapDiario(velas), [10, 11.5, 18, 19]);
  const sinVolumen = vwapDiario([{ t: h(14, 0), o: 1, h: 1, l: 1, c: 1, v: 0 }, { t: h(14, 1), o: 2, h: 2, l: 2, c: 2, v: 1 }]);
  assert.deepEqual(sinVolumen, [null, 2], 'sin volumen todavía no hay VWAP');
  assert.deepEqual(vwapDiario(null), []);
});

test('volumenRel = volumen / media de las n anteriores', () => {
  const velas = [1, 2, 3, 6, 0, 4].map(v => ({ ...V(2, 1, 1.5), v }));
  cercaArray(volumenRel(velas, 3), [null, null, null, 3, 0, 4 / 3]);
  const ceros = [0, 0, 0, 5].map(v => ({ ...V(2, 1, 1.5), v }));
  assert.deepEqual(volumenRel(ceros, 3), [null, null, null, null], 'media 0: sin dato en vez de Infinity');
});

// ---------------------------------------------------------------- pivotes y rango de apertura

test('pivotes: se confirman en j + der y solo existen desde ahí', () => {
  const h = [1, 2, 5, 3, 2, 4, 6, 4, 3];
  const velas = h.map((x, i) => ({ t: i, o: x - 0.5, h: x, l: x - 1, c: x - 0.5, v: 1 }));
  const p = pivotes(velas, 2, 2);
  assert.deepEqual(p.altos.map(({ i, precio, confirmadoEn }) => ({ i, precio, confirmadoEn })), [
    { i: 2, precio: 5, confirmadoEn: 4 },
    { i: 6, precio: 6, confirmadoEn: 8 },
  ]);
  assert.deepEqual(p.bajos.map(({ i, precio, confirmadoEn }) => ({ i, precio, confirmadoEn })), [
    { i: 4, precio: 1, confirmadoEn: 6 },
  ]);
  // Con una vela menos, el alto de 6 aún no existe.
  assert.deepEqual(pivotes(velas.slice(0, 8), 2, 2).altos.map(x => x.i), [2]);
  assert.deepEqual(pivotesHasta(p, 7).altos.map(x => x.i), [2]);
  assert.deepEqual(pivotesHasta(p, 3), { altos: [], bajos: [] });
  // Empate: gana el primero (sin duplicados).
  const empate = [1, 5, 5, 1, 1].map(x => V(x, x - 0.5, x - 0.25));
  assert.deepEqual(pivotes(empate, 1, 1).altos.map(x => x.i), [1]);
  assert.deepEqual(pivotes([], 2, 2), { altos: [], bajos: [] });
  assert.deepEqual(pivotes([V(1, 0, 0.5)], 2, 2), { altos: [], bajos: [] });
});

test('rangoApertura: primeros minutos del día UTC y cuándo se puede usar', () => {
  const q = 900_000; // 15m
  const t0 = Date.UTC(2026, 10, 13, 23, 0);
  const velas = Array.from({ length: 13 }, (_, i) => {
    const base = 100 + i;
    return { t: t0 + i * q, o: base, h: base + 2, l: base - 2, c: base + 1, v: 1 };
  });
  const r = rangoApertura(velas, 60);
  assert.equal(r.length, 1, 'el día 13 empieza fuera de su rango de apertura');
  const [d] = r;
  assert.equal(d.dia, '2026-11-14');
  assert.equal(d.cierraEn, Date.UTC(2026, 10, 14, 1, 0));
  assert.equal(d.max, 107 + 2, 'velas 4..7 (00:00–00:45)');
  assert.equal(d.min, 104 - 2);
  assert.equal(d.confirmadoEn, 7, 'la vela de 00:45 cierra a la 01:00');
  assert.equal(d.n, 4);
  assert.equal(d.completo, true);
  // A media hora del cierre del rango, aún no está confirmado.
  const aMedias = rangoApertura(velas.slice(0, 6), 60);
  assert.equal(aMedias[0].confirmadoEn, null);
  assert.equal(aMedias[0].completo, false);
  // Si la serie empieza a media mañana del rango, no está completo.
  assert.equal(rangoApertura(velas.slice(6), 60, q)[0].completo, false);
  // Velas más largas que el rango: no se puede medir.
  assert.deepEqual(rangoApertura(generarVelas({ intervalo: '4h', n: 20 }), 60), []);
  assert.deepEqual(rangoApertura([], 60), []);
  assert.throws(() => rangoApertura(velas, 0), /minutos deben estar entre 1 y 1440/);
});

// ---------------------------------------------------------------- causalidad

test('todo es causal: el valor en i no cambia si se quitan las velas posteriores', () => {
  const velas = generarVelas({ semilla: 11, n: 260, intervalo: '15m' });
  const cierres = velas.map(v => v.c);
  const completos = {
    sma: sma(cierres, 20), ema: ema(cierres, 20), rsi: rsi(cierres, 14), atr: atr(velas, 14),
    boll: bollinger(cierres, 20, 2).sup, dmax: donchian(velas, 24).max, vwap: vwapDiario(velas),
    vrel: volumenRel(velas, 20),
  };
  const piv = pivotes(velas, 3, 3);
  for (const i of [0, 1, 13, 14, 19, 20, 50, 97, 150, 200, 259]) {
    const pv = velas.slice(0, i + 1);
    const pc = cierres.slice(0, i + 1);
    const parciales = {
      sma: sma(pc, 20), ema: ema(pc, 20), rsi: rsi(pc, 14), atr: atr(pv, 14),
      boll: bollinger(pc, 20, 2).sup, dmax: donchian(pv, 24).max, vwap: vwapDiario(pv),
      vrel: volumenRel(pv, 20),
    };
    for (const k of Object.keys(completos)) {
      assert.equal(parciales[k][i], completos[k][i], `${k}[${i}] mira al futuro`);
    }
    assert.deepEqual(pivotes(pv, 3, 3), pivotesHasta(piv, i), `pivotes en ${i}`);
  }
  // Y el rango de apertura confirmado antes de i no cambia al añadir velas.
  const rangos = rangoApertura(velas, 60);
  for (const r of rangos.filter(x => x.confirmadoEn !== null)) {
    const parcial = rangoApertura(velas.slice(0, r.confirmadoEn + 1), 60).find(x => x.dia === r.dia);
    assert.deepEqual(parcial, r);
  }
});

// ---------------------------------------------------------------- velas sintéticas

const valida = v => Number.isFinite(v.t) && v.l <= Math.min(v.o, v.c) && v.h >= Math.max(v.o, v.c) && v.l > 0 && v.v > 0;

test('generarVelas: reproducible, ordenada y con velas válidas', () => {
  const a = generarVelas();
  assert.equal(a.length, 500);
  assert.equal(a[0].t, Date.UTC(2026, 0, 1));
  assert.equal(a[0].o, 60000);
  assert.deepEqual(generarVelas(), a, 'misma semilla, mismas velas');
  assert.notDeepEqual(generarVelas({ semilla: 2 }), a);
  for (const patron of PATRONES) {
    for (const n of [0, 1, 2, 5, 13, 60, 300]) {
      const v = generarVelas({ patron, n, semilla: 3, intervalo: '5m' });
      assert.equal(v.length, n, `${patron} n=${n}`);
      v.forEach((x, i) => {
        assert.ok(valida(x), `${patron} n=${n} vela ${i} inválida: ${JSON.stringify(x)}`);
        if (i) {
          assert.equal(x.t - v[i - 1].t, 300_000);
          assert.equal(x.o, v[i - 1].c, 'cada vela abre en el cierre anterior');
        }
      });
    }
  }
  assert.throws(() => generarVelas({ patron: 'cohete' }), /patrón desconocido «cohete»/);
  assert.throws(() => generarVelas({ intervalo: '2h' }), /intervalo desconocido «2h»/);
  assert.throws(() => generarVelas({ n: NaN }), /n debe ser/);
});

test('patrones de tendencia y lateral', () => {
  for (const semilla of [1, 2, 3, 4, 5]) {
    const sube = generarVelas({ patron: 'tendencia-alcista', semilla, n: 300 });
    const c = sube.map(v => v.c);
    assert.ok(c.at(-1) > c[0] * 1.15, `alcista ${semilla}`);
    assert.ok(ema(c, 20).at(-1) > ema(c, 50).at(-1));
    const baja = generarVelas({ patron: 'tendencia-bajista', semilla, n: 300 });
    const cb = baja.map(v => v.c);
    assert.ok(cb.at(-1) < cb[0] * 0.85, `bajista ${semilla}`);
    assert.ok(ema(cb, 20).at(-1) < ema(cb, 50).at(-1));
    const lat = generarVelas({ patron: 'lateral', semilla });
    const ancho = (Math.max(...lat.map(v => v.h)) - Math.min(...lat.map(v => v.l))) / 60000;
    assert.ok(ancho < 0.06, `lateral ${semilla}: ${ancho}`);
  }
});

test('patrón ruptura: rango estrecho y al final cierra por encima con volumen alto', () => {
  for (const semilla of [1, 2, 3, 7, 42]) {
    const v = generarVelas({ patron: 'ruptura', semilla });
    const b = v.length - 5; // la ruptura ocupa el último 1 % (5 velas de 500)
    const lateral = v.slice(0, b);
    const techo = Math.max(...lateral.map(x => x.h));
    const ancho = (techo - Math.min(...lateral.map(x => x.l))) / 60000;
    assert.ok(ancho < 0.03, `rango demasiado ancho: ${ancho}`);
    assert.ok(v[b].c > techo, 'la primera vela de ruptura cierra por encima del rango');
    assert.ok(v[b].c > donchian(v, 50).max[b]);
    assert.ok(volumenRel(v, 20)[b] >= 2.5, `volumen relativo ${volumenRel(v, 20)[b]}`);
    assert.ok(v.at(-1).c > techo);
  }
});

test('patrón bandera: impulso, retroceso < 50 % con menos volumen y rotura', () => {
  for (const semilla of [1, 2, 3, 7, 42]) {
    const n = 500;
    const v = generarVelas({ patron: 'bandera', semilla, n });
    // Tramos como en el generador: mástil 8 %, bandera 12 %, rotura 0,6 %.
    const iRotura = n - Math.max(2, Math.round(n * 0.006));
    const iBandera = iRotura - Math.max(4, Math.round(n * 0.12));
    const iMastil = iBandera - Math.max(3, Math.round(n * 0.08));
    const pie = v[iMastil - 1].c;
    const mastil = v.slice(iMastil, iBandera);
    const bandera = v.slice(iBandera, iRotura);
    const tope = Math.max(...mastil.map(x => x.h));
    assert.ok(tope / pie > 1.08, `impulso de solo ${(tope / pie - 1) * 100} %`);
    const retroceso = (tope - Math.min(...bandera.map(x => x.l))) / (tope - pie);
    assert.ok(retroceso > 0 && retroceso < 0.5, `retroceso ${retroceso}`);
    const media = xs => xs.reduce((s, x) => s + x.v, 0) / xs.length;
    assert.ok(media(bandera) < media(mastil) * 0.5, 'la bandera tiene menos volumen');
    const techoBandera = Math.max(...bandera.map(x => x.h));
    assert.ok(v[iRotura].c > techoBandera && v[iRotura].c > tope, 'rompe por encima');
    assert.ok(volumenRel(v, 20)[iRotura] > 2);
  }
});

test('patrón sobreventa: el RSI baja de 30 y al final rebota', () => {
  for (const n of [500, 120, 40]) {
    for (let semilla = 1; semilla <= 10; semilla++) {
      const v = generarVelas({ patron: 'sobreventa', semilla, n });
      const r = rsi(v.map(x => x.c), 14);
      const minimo = Math.min(...r.filter(x => x !== null));
      assert.ok(minimo < 30, `n=${n} semilla ${semilla}: RSI mínimo ${minimo}`);
      const ultimas = v.slice(-4);
      for (let i = 1; i < ultimas.length; i++) assert.ok(ultimas[i].c > ultimas[i - 1].c, 'rebote: las últimas cierran al alza');
      assert.ok(r.at(-1) > minimo + 10);
      assert.ok(Math.min(...v.map(x => x.l)) < 60000 * 0.92, 'caída fuerte');
    }
  }
});

test('serieDe monta una Serie con ultimaCerrada y huecos', () => {
  const velas = generarVelas({ n: 10, intervalo: '1h' });
  const s = serieDe(velas, { intervalo: '1h' });
  assert.equal(s.fuente, 'sintetica');
  assert.equal(s.par, 'BTC-EUR');
  assert.equal(s.intervalo, '1h');
  assert.equal(s.ultimaCerrada, 9);
  assert.equal(s.leidaEn, velas.at(-1).t + 3_600_000);
  assert.equal(s.huecos, 0);
  // Con «ahora» a mitad de la última vela, esa sigue abierta.
  assert.equal(serieDe(velas, { intervalo: '1h', ahora: velas.at(-1).t + 60_000 }).ultimaCerrada, 8);
  // Sin intervalo se deduce; quitar dos velas deja 2 huecos (no se inventan).
  const conHuecos = serieDe([...velas.slice(0, 3), ...velas.slice(5)]);
  assert.equal(conHuecos.intervalo, '1h');
  assert.equal(conHuecos.huecos, 2);
  assert.equal(conHuecos.velas.length, 8);
  assert.equal(serieDe([], { intervalo: '5m', ahora: 0 }).ultimaCerrada, -1);
  assert.equal(serieDe(velas.slice(0, 1), { intervalo: '1h' }).ultimaCerrada, 0, 'una sola vela');
  assert.throws(() => serieDe(velas, { intervalo: '3h' }), /intervalo desconocido/);
});
