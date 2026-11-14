// Pruebas de lib/maquina.mjs (máquina del tiempo) sin red: velas sintéticas
// con semilla y casos construidos a mano.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simular, historico, planPorDefecto, opcionesMaquina, COSTES_POR_DEFECTO } from '../lib/maquina.mjs';
import { ema } from '../lib/indicadores.mjs';
import { generarVelas, serieDe } from './sinteticas.mjs';

const M5 = 300_000;
const H1 = 3_600_000;
const DIA = 86_400_000;
const T0 = Date.UTC(2026, 8, 15); // medianoche UTC
const SIN_COSTES = { comision_pct: 0, deslizamiento_pct: 0 };
const cerca = (a, b, tol = 1e-9, msg) => assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≉ ${b}`);

// 60 días de velas de 5 minutos (17.280), como las que pide la máquina.
const VELAS_60 = generarVelas({ semilla: 7, n: 60 * 288, intervalo: '5m', inicio: T0, precio: 61000, volatilidad: 0.0015 });
const BASE = { velas: VELAS_60, entrada: 61000, stop: 61000 * 0.985, objetivo: 61000 * 1.03, horas: 24 };

/** Días iguales hechos a mano: `forma(franja)` da { h, l, c } relativos a la apertura. */
function diasIguales(dias, forma, { inicio = T0, precio = 100 } = {}) {
  const velas = [];
  let p = precio;
  for (let d = 0; d < dias; d++) {
    for (let f = 0; f < 288; f++) {
      const { h, l, c } = forma(f);
      velas.push({ t: inicio + d * DIA + f * M5, o: p, h: p * h, l: p * l, c: p * c, v: 1 });
      p *= c;
    }
  }
  return velas;
}

// ---------------------------------------------------------------- simular

test('simular: misma semilla, mismo resultado; otra semilla, otro', () => {
  const a = simular({ ...BASE, simulaciones: 2000, semilla: 19 });
  const b = simular({ ...BASE, simulaciones: 2000, semilla: 19 });
  const c = simular({ ...BASE, simulaciones: 2000, semilla: 20 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.resultado_pct, c.resultado_pct);
  assert.notDeepEqual(a.histograma, c.histograma);
  for (const clave of ['simulaciones', 'objetivo_primero_pct', 'stop_primero_pct', 'abierta_pct', 'resultado_pct', 'histograma', 'dias_usados', 'metodo', 'k_volatilidad']) {
    assert.ok(clave in a, `falta ${clave}`);
  }
  assert.equal(a.simulaciones, 2000);
  assert.equal(a.pasos, 288);
  assert.equal(a.direccion, 'larga');
  assert.equal(a.dias_usados, 60);
});

test('simular: los porcentajes suman 100, el histograma tiene 20 tramos seguidos y cuenta todas', () => {
  const r = simular({ ...BASE, simulaciones: 3000 });
  cerca(r.objetivo_primero_pct + r.stop_primero_pct + r.abierta_pct, 100);
  assert.equal(r.conteo.objetivo + r.conteo.stop + r.conteo.abierta, 3000);
  cerca(r.objetivo_primero_pct, (r.conteo.objetivo / 3000) * 100, 0.01);
  assert.equal(r.histograma.length, 20);
  assert.equal(r.histograma.reduce((s, x) => s + x.n, 0), 3000);
  for (let k = 1; k < 20; k++) assert.equal(r.histograma[k].desde, r.histograma[k - 1].hasta);
  const { p5, p25, mediana, p75, p95, media } = r.resultado_pct;
  assert.ok(p5 <= p25 && p25 <= mediana && mediana <= p75 && p75 <= p95, JSON.stringify(r.resultado_pct));
  assert.ok(r.histograma[0].desde <= p5 && r.histograma.at(-1).hasta >= p95);
  assert.ok(Number.isFinite(media) && Number.isFinite(r.esperanza_R));
  // Con stop a −1,5 % y costes, lo peor ronda el stop más los costes, nunca mucho más.
  assert.ok(r.histograma[0].desde > -2.5, `peor resultado ${r.histograma[0].desde}`);
  assert.match(r.metodo, /3\.000 veces las próximas 24 h/);
  assert.match(r.metodo, /misma franja horaria UTC \(± 5 min\)/);
  assert.match(r.metodo, /netos de comisión \(0,25 % por lado\)/);
});

test('simular: con stop y objetivo lejísimos casi todo queda «abierta»', () => {
  const r = simular({ ...BASE, stop: 61000 * 0.5, objetivo: 61000 * 2, simulaciones: 2000 });
  assert.ok(r.abierta_pct >= 99, `abierta ${r.abierta_pct} %`);
  assert.equal(r.horas_medianas.objetivo, null);
  // Al cerrar al final se paga comisión dos veces y deslizamiento dos veces.
  assert.ok(r.resultado_pct.mediana < 0.5 && r.resultado_pct.mediana > -1.5);
});

test('simular: si la misma vela toca stop y objetivo, cuenta como stop (y los costes juegan en contra)', () => {
  const ambas = diasIguales(2, () => ({ h: 1.1, l: 0.9, c: 1 }));
  const sinCostes = simular({ velas: ambas, entrada: 100, stop: 95, objetivo: 105, simulaciones: 500, costes: SIN_COSTES });
  assert.equal(sinCostes.stop_primero_pct, 100);
  assert.equal(sinCostes.objetivo_primero_pct, 0);
  assert.equal(sinCostes.resultado_pct.mediana, -5);
  assert.equal(sinCostes.esperanza_R, -1);
  assert.equal(sinCostes.horas_medianas.stop, 0.08); // a la primera vela (5 min)
  // Sin movimiento de cierre a cierre no se puede ajustar la volatilidad: k = 1 y se avisa.
  assert.equal(sinCostes.k_volatilidad, 1);
  assert.ok(sinCostes.avisos.some(a => /volatilidad cero/.test(a)));

  const conCostes = simular({ velas: ambas, entrada: 100, stop: 95, objetivo: 105, simulaciones: 500, costes: COSTES_POR_DEFECTO });
  // Entra a 100,05 (deslizamiento), sale a 95 · 0,9995 y paga 0,25 % en cada lado.
  const pe = 100 * 1.0005;
  const px = 95 * 0.9995;
  const esperado = ((px - pe - 0.0025 * (pe + px)) / pe) * 100;
  cerca(conCostes.resultado_pct.mediana, esperado, 1e-4);
  assert.ok(conCostes.esperanza_R < -1);

  // Solo el objetivo al alcance: gana siempre, sin deslizamiento en la salida (orden limitada).
  const soloObjetivo = diasIguales(2, () => ({ h: 1.1, l: 0.99, c: 1 }));
  const gana = simular({ velas: soloObjetivo, entrada: 100, stop: 95, objetivo: 105, simulaciones: 500, costes: COSTES_POR_DEFECTO });
  assert.equal(gana.objetivo_primero_pct, 100);
  cerca(gana.resultado_pct.mediana, ((105 - pe - 0.0025 * (pe + 105)) / pe) * 100, 1e-4);
});

test('simular: con deriva alcista fuerte el objetivo gana más que el stop (y en bajista, al revés)', () => {
  const opciones = { semilla: 3, n: 10 * 288, intervalo: '5m', inicio: T0, precio: 61000, volatilidad: 0.0015 };
  const sube = generarVelas({ ...opciones, patron: 'tendencia-alcista' });
  const baja = generarVelas({ ...opciones, patron: 'tendencia-bajista' });
  const plan = { entrada: 61000, stop: 61000 * 0.98, objetivo: 61000 * 1.02, simulaciones: 2000, dias: 10 };
  const rSube = simular({ ...plan, velas: sube });
  const rBaja = simular({ ...plan, velas: baja });
  assert.ok(rSube.objetivo_primero_pct > rSube.stop_primero_pct + 50, JSON.stringify(rSube.conteo));
  assert.ok(rBaja.stop_primero_pct > rBaja.objetivo_primero_pct + 50, JSON.stringify(rBaja.conteo));
  assert.ok(rSube.resultado_pct.media > 0 && rBaja.resultado_pct.media < 0);
  // Un corto en la serie bajista es el espejo: gana el objetivo.
  const corto = simular({ velas: baja, entrada: 61000, stop: 61000 * 1.02, objetivo: 61000 * 0.98, simulaciones: 2000, dias: 10 });
  assert.equal(corto.direccion, 'corta');
  assert.ok(corto.objetivo_primero_pct > corto.stop_primero_pct + 50, JSON.stringify(corto.conteo));
});

test('simular: cada paso sale de la misma franja horaria UTC (y las vecinas dan la vuelta a medianoche)', () => {
  // De 00:00 a 01:00 UTC cada vela sube un 1 %; el resto del día no se mueve.
  const velas = diasIguales(3, f => (f < 12 ? { h: 1.01, l: 1, c: 1.01 } : { h: 1.0001, l: 0.9999, c: 1 }));
  const comun = { velas, entrada: 100, stop: 95, objetivo: 105, horas: 1, franjas_vecinas: 0, simulaciones: 300, costes: SIN_COSTES };
  const medianoche = simular({ ...comun, inicio: T0 + 3 * DIA });
  assert.equal(medianoche.objetivo_primero_pct, 100);
  assert.equal(medianoche.k_volatilidad, 1); // todos los días iguales: nada que ajustar
  const mediodia = simular({ ...comun, inicio: T0 + 2 * DIA + 12 * H1 });
  assert.equal(mediodia.abierta_pct, 100);
  // 23:55 UTC con una franja vecina: la bolsa es {23:50, 23:55, 00:00}; un tercio sube el 1 %.
  const vuelta = simular({ ...comun, inicio: T0 + 2 * DIA + 287 * M5, horas: 5 / 60, franjas_vecinas: 1, objetivo: 100.5, simulaciones: 3000 });
  assert.equal(vuelta.pasos, 1);
  assert.ok(vuelta.objetivo_primero_pct > 28 && vuelta.objetivo_primero_pct < 39, `${vuelta.objetivo_primero_pct} %`);
  const sinVecinas = simular({ ...comun, inicio: T0 + 2 * DIA + 287 * M5, horas: 5 / 60, objetivo: 100.5 });
  assert.equal(sinVecinas.objetivo_primero_pct, 0);
});

test('simular: el ajuste de volatilidad sigue a las últimas 24 h, con límites', () => {
  const tranquilos = generarVelas({ semilla: 5, n: 59 * 288, intervalo: '5m', inicio: T0, precio: 61000, volatilidad: 0.001 });
  const movido = generarVelas({ semilla: 6, n: 288, intervalo: '5m', inicio: T0 + 59 * DIA, precio: tranquilos.at(-1).c, volatilidad: 0.002 });
  const velas = [...tranquilos, ...movido];
  const lejos = { velas, entrada: 61000, stop: 30000, objetivo: 120000, simulaciones: 2000 };
  const ajustada = simular(lejos);
  // Esperado ≈ 0,002 / (0,001 · √(63/60)) ≈ 1,95
  assert.ok(ajustada.k_volatilidad > 1.7 && ajustada.k_volatilidad < 2.2, `k = ${ajustada.k_volatilidad}`);
  assert.equal(ajustada.volatilidad.ajuste, true);
  assert.match(ajustada.metodo, /multiplicado por [12],\d\d para que se muevan como en las últimas 24 h/);
  const tal = simular({ ...lejos, ajuste_volatilidad: false });
  assert.equal(tal.k_volatilidad, 1);
  assert.equal(tal.volatilidad.ajuste, false);
  const ancho = r => r.resultado_pct.p95 - r.resultado_pct.p5;
  assert.ok(ancho(ajustada) > 1.5 * ancho(tal), `${ancho(ajustada)} frente a ${ancho(tal)}`);

  const locura = generarVelas({ semilla: 6, n: 288, intervalo: '5m', inicio: T0 + 59 * DIA, precio: tranquilos.at(-1).c, volatilidad: 0.02 });
  const limitada = simular({ ...lejos, velas: [...tranquilos, ...locura] });
  assert.equal(limitada.k_volatilidad, 2.5);
  assert.ok(limitada.volatilidad.k_sin_limitar > 2.5);
  assert.ok(limitada.avisos.some(a => /se ha limitado a 2,50/.test(a)), limitada.avisos.join(' | '));
});

test('simular: no mira al futuro y solo usa los últimos «dias»', () => {
  const inicio = T0 + 30 * DIA;
  const r = simular({ ...BASE, inicio, dias: 10, simulaciones: 1000 });
  assert.equal(r.dias_usados, 10);
  assert.equal(r.velas_usadas, 10 * 288);
  assert.equal(r.inicio, inicio);
  assert.ok(r.avisos.some(a => /ignorado 8\.640 velas que cierran después del inicio/.test(a)), r.avisos.join(' | '));
  // Cambiar lo que pasa después del inicio no cambia nada.
  const futuroDistinto = VELAS_60.map(v => (v.t >= inicio ? { ...v, h: v.h * 1.5, c: v.h * 1.4 } : v));
  assert.deepEqual(simular({ ...BASE, velas: futuroDistinto, inicio, dias: 10, simulaciones: 1000 }), r);
  // Un inicio a media vela (como Date.now()) sigue contando 10 días, no las 11 fechas que toca.
  const raro = simular({ ...BASE, inicio: inicio + 7 * M5 + 1234, dias: 10, simulaciones: 200 });
  assert.equal(raro.dias_usados, 10);
  assert.equal(raro.velas_usadas, 10 * 288 - 1); // la vela partida por el borde de la ventana no entra
});

test('simular: acepta una serie de lib/datos y usa solo sus velas cerradas', () => {
  const ultima = VELAS_60.at(-1);
  const serie = serieDe(VELAS_60, { intervalo: '5m', ahora: ultima.t + 60_000 }); // la última sigue abierta
  assert.equal(serie.ultimaCerrada, VELAS_60.length - 2);
  const r = simular({ ...BASE, velas: serie, simulaciones: 500 });
  assert.equal(r.inicio, ultima.t); // cierre de la penúltima
  assert.equal(r.velas_usadas, 60 * 288 - 1);
});

test('simular: velas de 1 minuto se juntan en 5 minutos; de 1 hora, error claro', () => {
  const unMinuto = generarVelas({ semilla: 2, n: 2 * 1440, intervalo: '1m', inicio: T0, precio: 61000, volatilidad: 0.0007 });
  const r = simular({ velas: unMinuto, entrada: 61000, stop: 60000, objetivo: 62500, simulaciones: 500 });
  assert.equal(r.velas_usadas, 2 * 288);
  assert.ok(r.avisos.some(a => /llegaron de 1m y se han juntado en velas de 5 minutos/.test(a)));
  const horarias = generarVelas({ semilla: 2, n: 500, intervalo: '1h', inicio: T0 });
  assert.throws(() => simular({ velas: horarias, entrada: 61000, stop: 60000, objetivo: 62500 }),
    /necesita velas de 5 minutos y llegaron de 1h/);
});

test('simular: entradas raras dan errores claros en castellano o se descartan con aviso', () => {
  const plan = { entrada: 61000, stop: 60000, objetivo: 62000 };
  assert.throws(() => simular({ ...plan, velas: [] }), /no hay ninguna vela válida de 5 minutos/);
  assert.throws(() => simular({ ...plan, velas: null }), /faltan las velas/);
  assert.throws(() => simular({ ...plan }), /faltan las velas/);
  assert.throws(() => simular({ ...plan, velas: 'abc' }), /deben ser una lista/);
  assert.throws(() => simular(), /faltan las velas/);
  assert.throws(() => simular(null), /faltan las velas/);
  assert.throws(() => simular({ ...plan, velas: [VELAS_60[0]] }), /hacen falta al menos 288 velas de 5 minutos cerradas/);
  assert.throws(() => simular({ ...plan, velas: [null, NaN, { t: 1 }] }), /no hay ninguna vela válida/);
  assert.throws(() => simular({ ...BASE, entrada: NaN }), /«entrada» debe ser un precio positivo/);
  assert.throws(() => simular({ ...BASE, stop: null }), /«stop» debe ser un precio positivo/);
  assert.throws(() => simular({ ...BASE, stop: 62000, objetivo: 63000 }), /no cuadran con la entrada.*stop 62\.000,00, entrada 61\.000,00/);
  assert.throws(() => simular({ ...BASE, simulaciones: 0 }), /«simulaciones» debe ser un número entero entre 1 y/);
  assert.throws(() => simular({ ...BASE, horas: -1 }), /«horas» debe ser un número mayor que 0/);
  assert.throws(() => simular({ ...BASE, franjas_vecinas: 500 }), /«franjas_vecinas»/);
  assert.throws(() => simular({ ...BASE, dias: 0 }), /«dias»/);
  assert.throws(() => simular({ ...BASE, costes: { comision_pct: -1 } }), /costes\.comision_pct/);
  assert.throws(() => simular({ ...BASE, semilla: 'x' }), /semilla/);
  assert.throws(() => simular({ ...BASE, inicio: 'no es fecha' }), /«inicio» no es una fecha válida/);

  // Velas rotas por medio: se quitan, se avisa y la simulación sigue.
  const rotas = [...VELAS_60];
  rotas.splice(100, 0, null, { t: T0, o: NaN, h: 1, l: 1, c: 1, v: 1 }, { t: T0 + 5, o: 10, h: 5, l: 1, c: 2, v: 1 });
  const r = simular({ ...BASE, velas: rotas, simulaciones: 300 });
  assert.ok(r.avisos.some(a => /descartado 3 velas rotas/.test(a)));
  assert.equal(r.velas_usadas, 60 * 288);
});

test('simular: 10.000 simulaciones de 24 h tardan menos de 2 s', () => {
  const t = performance.now();
  const r = simular({ ...BASE, simulaciones: 10_000 });
  const ms = performance.now() - t;
  assert.equal(r.simulaciones, 10_000);
  assert.ok(ms < 2000, `tardó ${Math.round(ms)} ms`);
});

test('opcionesMaquina: traduce la config a opciones de simular', () => {
  assert.deepEqual(opcionesMaquina({ maquina: { simulaciones: 500, semilla: 1, dias: 30, horas: 12, franjas_vecinas: 2 }, costes: SIN_COSTES }), {
    simulaciones: 500, semilla: 1, dias: 30, horas: 12, franjas_vecinas: 2, ajuste_volatilidad: true, costes: SIN_COSTES,
  });
  assert.deepEqual(opcionesMaquina(null).costes, COSTES_POR_DEFECTO);
  assert.equal(opcionesMaquina({}).simulaciones, 10_000);
});

// ---------------------------------------------------------------- historico

/** Velas de 1 hora a mano: cada entrada es { o, h, l, c, v } (por defecto plana a 100). */
function horarias(lista, inicio = Date.UTC(2026, 10, 1)) {
  return lista.map((x, i) => {
    const o = x.o ?? 100;
    const c = x.c ?? o;
    return { t: inicio + i * H1, o, h: x.h ?? Math.max(o, c), l: x.l ?? Math.min(o, c), c, v: x.v ?? 1 };
  });
}

// Señal donde el volumen vale 98 o 99 (marca puesta a mano); con 98 el plan la salta.
const detectarMarca = (ctx, i) => (ctx.velas[i].v >= 98 ? { nivel_entrada: ctx.velas[i].c, marca: ctx.velas[i].v } : null);
const planFijo = (senal, _ctx, _i, pe) => (senal.marca === 98 ? null : { stop: pe - 2, objetivo: pe + 4, horas: 3 });

const CASO = horarias([
  {}, {}, // 0, 1
  { v: 99 }, // 2: señal A
  { o: 100, h: 101, l: 99.5, c: 100.5, v: 99 }, // 3: entra A; otra señal, pero ya hay una operación abierta
  { o: 100.5, h: 104.5, l: 100, c: 104 }, // 4: A toca el objetivo (104)
  {}, // 5
  { v: 99 }, // 6: señal B
  { o: 100, h: 104.5, l: 97.5, c: 100 }, // 7: entra B; toca stop y objetivo en la misma vela → stop
  {}, // 8
  { v: 99 }, // 9: señal C
  { o: 100, h: 101, l: 99, c: 100.5 }, // 10: entra C
  { o: 100.5, h: 101.5, l: 99.5, c: 101 }, // 11
  { o: 101, h: 101.8, l: 100.2, c: 101 }, // 12: se acaban las 3 h → «abierta» a 101
  { o: 101, h: 110, l: 101, c: 109 }, // 13: habría tocado el objetivo, pero ya es tarde
  {}, // 14
  { v: 98 }, // 15: señal que el plan salta
  {}, // 16
  { v: 99 }, // 17: señal en la última vela: no hay vela siguiente para entrar
]);

test('historico: con una regla honesta cuenta bien objetivo, stop y abiertas (caso a mano)', () => {
  const r = historico({ velas: CASO, intervalo: '1h', detectar: detectarMarca, plan: planFijo, costes: SIN_COSTES });
  const T = CASO[0].t;
  assert.equal(r.senales, 3);
  assert.equal(r.objetivo, 1);
  assert.equal(r.stop, 1);
  assert.equal(r.abiertas, 1);
  assert.equal(r.acierto_pct, 33.33);
  assert.equal(r.esperanza_R, 0.5); // (2 − 1 + 0,5) / 3
  assert.equal(r.resultado_medio_pct, 1); // (4 − 2 + 1) / 3
  assert.equal(r.R_total, 1.5);
  assert.equal(r.detectadas, 6);
  assert.deepEqual(r.descartadas, { con_operacion_abierta: 1, sin_entrada: 1, plan_nulo: 1, plan_invalido: 0 });
  const campos = ({ t_senal, t_entrada, entrada, stop, objetivo, salida, t_salida, resultado, R, pct }) =>
    ({ t_senal, t_entrada, entrada, stop, objetivo, salida, t_salida, resultado, R, pct });
  assert.deepEqual(r.lista.map(campos), [
    { t_senal: T + 2 * H1, t_entrada: T + 3 * H1, entrada: 100, stop: 98, objetivo: 104, salida: 104, t_salida: T + 5 * H1, resultado: 'objetivo', R: 2, pct: 4 },
    { t_senal: T + 6 * H1, t_entrada: T + 7 * H1, entrada: 100, stop: 98, objetivo: 104, salida: 98, t_salida: T + 8 * H1, resultado: 'stop', R: -1, pct: -2 },
    { t_senal: T + 9 * H1, t_entrada: T + 10 * H1, entrada: 100, stop: 98, objetivo: 104, salida: 101, t_salida: T + 13 * H1, resultado: 'abierta', R: 0.5, pct: 1 },
  ]);
  assert.equal(r.verificacion.hecha, true);
  assert.ok(r.verificacion.comprobadas.length >= 6, String(r.verificacion.comprobadas));
  assert.match(r.metodo, /18 velas de 1h/);
});

test('historico: los costes empeoran cada operación (entrada con deslizamiento, R del stop por debajo de −1)', () => {
  const r = historico({ velas: CASO, intervalo: '1h', detectar: detectarMarca, plan: planFijo, costes: COSTES_POR_DEFECTO });
  assert.equal(r.senales, 3);
  const [a, b, c] = r.lista;
  assert.equal(a.entrada, 100.05);
  assert.equal(a.stop, 98.05);
  assert.ok(a.R < 2 && a.R > 1.7, `R objetivo ${a.R}`);
  assert.equal(b.resultado, 'stop');
  assert.ok(b.R < -1, `R stop ${b.R}`);
  cerca(b.salida, 98.05 * 0.9995, 0.01);
  assert.equal(c.resultado, 'abierta');
  assert.ok(r.esperanza_R < 0.5);
});

test('historico: una regla tramposa que mira velas[i+1] hace saltar el error de causalidad', () => {
  const velas = generarVelas({ semilla: 4, n: 400, intervalo: '1h', inicio: T0 });
  const tramposa = (ctx, i) => {
    const siguiente = ctx.velas[i + 1];
    return siguiente && siguiente.c > ctx.velas[i].c * 1.002 ? { nivel_entrada: ctx.velas[i].c, nivel_invalidacion: ctx.velas[i].l * 0.99 } : null;
  };
  assert.throws(() => historico({ velas, intervalo: '1h', detectar: tramposa }),
    /la regla mira al futuro en la vela \d+ \(\d\d\/\d\d\/\d{4} \d\d:\d\d en Madrid, \d\d:\d\d UTC\): con las velas hasta esa vela da «sin señal» y con toda la serie da «\{/);
  // Sin la verificación no se nota (y por eso está activada por defecto).
  const ciega = historico({ velas, intervalo: '1h', detectar: tramposa, verificarCausalidad: false });
  assert.ok(ciega.senales > 0);
  assert.equal(ciega.verificacion.hecha, false);
});

test('historico: también se pilla al que mira al futuro en preparar() o falla con datos cortados', () => {
  const velas = generarVelas({ semilla: 4, n: 300, intervalo: '1h', inicio: T0, patron: 'tendencia-alcista' });
  // preparar usa el máximo de TODA la serie: la señal cambia si se cortan los datos.
  const preparar = v => ({ velas: v, maximo: Math.max(...v.map(x => x.c)) });
  const cercaDelMaximo = (ctx, i) => (ctx.velas[i].c >= 0.97 * ctx.maximo ? { nivel_entrada: ctx.velas[i].c, referencia: ctx.maximo } : null);
  assert.throws(() => historico({ velas, preparar, detectar: cercaDelMaximo }), /la regla mira al futuro en la vela/);
  // Una regla que solo funciona con la vela siguiente delante: falla al cortar, y se dice.
  const fragil = (ctx, i) => (i < ctx.velas.length - 1 && ctx.velas[i + 1].o > 0 && i % 50 === 0 ? { nivel_entrada: ctx.velas[i].c } : null);
  assert.throws(() => historico({ velas, detectar: fragil }), /la regla mira al futuro en la vela \d+/);
});

test('historico: una regla causal con indicadores pasa la verificación y usa el plan por defecto', () => {
  const velas = generarVelas({ semilla: 11, n: 1500, intervalo: '1h', inicio: T0, volatilidad: 0.006 });
  const preparar = v => {
    const cierres = v.map(x => x.c);
    return { velas: v, rapida: ema(cierres, 10), lenta: ema(cierres, 30) };
  };
  // Cruce al alza de medias; stop bajo el mínimo de las 5 últimas velas.
  const cruce = (ctx, i) => {
    const { rapida, lenta, velas: v } = ctx;
    if (i < 1 || rapida[i - 1] === null || lenta[i - 1] === null) return null;
    if (!(rapida[i - 1] <= lenta[i - 1] && rapida[i] > lenta[i])) return null;
    const minimo = Math.min(...v.slice(Math.max(0, i - 4), i + 1).map(x => x.l));
    return { direccion: 'larga', nivel_entrada: v[i].c, nivel_invalidacion: minimo };
  };
  const r = historico({ velas, intervalo: '1h', preparar, detectar: cruce, semilla: 3 });
  assert.ok(r.senales >= 5, `solo ${r.senales} operaciones`);
  assert.equal(r.senales, r.objetivo + r.stop + r.abiertas);
  assert.equal(r.verificacion.hecha, true);
  assert.equal(r.verificacion.comprobadas.length, 10);
  for (const x of r.lista) {
    assert.ok(x.stop < x.entrada && x.entrada < x.objetivo);
    cerca(x.objetivo - x.entrada, 2 * (x.entrada - x.stop), 0.02); // plan por defecto: 2 R
    assert.ok(x.t_entrada > x.t_senal && x.t_salida > x.t_entrada);
  }
  // Una operación a la vez: ninguna empieza antes de que acabe la anterior.
  for (let k = 1; k < r.lista.length; k++) assert.ok(r.lista[k].t_entrada >= r.lista[k - 1].t_salida);
  // Con «dias» solo cuentan las señales recientes.
  const corto = historico({ velas, intervalo: '1h', preparar, detectar: cruce, dias: 20 });
  const corte = velas.at(-1).t + H1 - 20 * DIA;
  assert.ok(corto.lista.every(x => x.t_senal >= corte));
  assert.ok(corto.senales < r.senales);
});

test('historico: con velas de 5 minutos para resolver se sabe qué se tocó antes dentro de la hora', () => {
  // A las 03:00 la vela de 1h toca 104,5 y 97,5: con solo esa vela, cuenta como stop.
  const hora = horarias([{}, {}, { v: 99 }, { o: 100, h: 104.5, l: 97.5, c: 99 }, {}, {}]);
  const T = hora[0].t;
  const cinco = [];
  for (let k = 0; k < 6 * 12; k++) {
    const t = T + k * M5;
    let vela = { t, o: 100, h: 100, l: 100, c: 100, v: 1 };
    if (k === 36) vela = { t, o: 100, h: 104.5, l: 100, c: 104, v: 1 }; // 03:00: primero sube al objetivo…
    if (k === 37) vela = { t, o: 104, h: 104, l: 101, c: 101, v: 1 };
    if (k === 38) vela = { t, o: 101, h: 101, l: 97.5, c: 99, v: 1 }; // …y después baja al stop
    if (k > 38 && k < 48) vela = { t, o: 99, h: 99, l: 99, c: 99, v: 1 };
    cinco.push(vela);
  }
  const comun = { velas: hora, intervalo: '1h', detectar: detectarMarca, plan: planFijo, costes: SIN_COSTES };
  const conHoras = historico(comun);
  assert.equal(conHoras.lista[0].resultado, 'stop');
  const conCinco = historico({ ...comun, resolver: cinco });
  assert.equal(conCinco.lista[0].resultado, 'objetivo');
  assert.equal(conCinco.lista[0].t_salida, T + 37 * M5);
});

test('historico: entradas raras no rompen y los errores se entienden', () => {
  const vacio = historico({ velas: [], detectar: () => ({}) });
  assert.equal(vacio.senales, 0);
  assert.equal(vacio.acierto_pct, null);
  assert.equal(vacio.esperanza_R, null);
  assert.deepEqual(vacio.lista, []);
  assert.ok(vacio.avisos.some(a => /No hay velas/.test(a)));

  const una = historico({ velas: CASO.slice(0, 1), detectar: () => ({ nivel_invalidacion: 90 }) });
  assert.equal(una.senales, 0);
  assert.equal(una.descartadas.sin_entrada, 1);

  assert.throws(() => historico({ velas: CASO }), /falta detectar\(ctx, i\)/);
  assert.throws(() => historico({ velas: null, detectar: () => null }), /faltan las velas/);
  assert.throws(() => historico(), /falta detectar/);
  assert.throws(() => historico({ velas: CASO, detectar: () => null, plan: 'no' }), /«plan» debe ser una función/);
  assert.throws(() => historico({ velas: CASO, intervalo: '2h', detectar: () => null }), /Intervalo desconocido: «2h»/);
  assert.throws(() => historico({ velas: CASO, detectar: () => { throw new Error('rota'); } }), /detectar\(\) falló en la vela 0 .*: rota/);

  // Planes sin sentido (stop por encima de la entrada) se cuentan y se avisa, sin operar.
  const malPlan = historico({ velas: CASO, detectar: detectarMarca, plan: (s, c, i, pe) => ({ stop: pe + 1, objetivo: pe + 4 }) });
  assert.equal(malPlan.senales, 0);
  assert.ok(malPlan.descartadas.plan_invalido >= 1);
  assert.ok(malPlan.avisos.some(a => /Plan sin sentido en la vela/.test(a)));
  // Sin nivel de invalidación, el plan por defecto no opera.
  assert.equal(planPorDefecto({ nivel_entrada: 100 }, null, 0, 100), null);
  assert.deepEqual(planPorDefecto({ nivel_invalidacion: 98 }, null, 0, 100), { stop: 98, objetivo: 104, horas: 24 });

  // Velas rotas por medio: se quitan y se avisa.
  const conRotas = historico({ velas: [null, ...CASO, { t: 5, o: NaN }], intervalo: '1h', detectar: detectarMarca, plan: planFijo, costes: SIN_COSTES });
  assert.equal(conRotas.senales, 3);
  assert.ok(conRotas.avisos.some(a => /descartado 2 velas rotas/.test(a)));

  // Una serie de lib/datos: solo las velas cerradas.
  const serie = serieDe(CASO, { intervalo: '1h', ahora: CASO.at(-1).t + 1000 });
  const deSerie = historico({ velas: serie, detectar: detectarMarca, plan: planFijo, costes: SIN_COSTES });
  assert.equal(deSerie.detectadas, 5); // la última (abierta) no cuenta
});
