// Pruebas de lib/escaner.mjs: setups, tendencia, que no mira al futuro y escanear.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SETUPS, prepararContexto, tendencia, escanear, precioTxt } from '../lib/escaner.mjs';
import { agregar } from '../lib/datos.mjs';
import { generarVelas, serieDe } from './sinteticas.mjs';

const H = 3_600_000;
const M15 = 900_000;
const D = 86_400_000;
const setup = id => SETUPS.find(s => s.id === id);

// Velas quietas: apertura = cierre, mecha ±ancho/2 (ATR = ancho, RSI = 50, volumen relativo = 1).
function planas({ n, inicio, ms, precio, ancho = 100, v = 1 }) {
  return Array.from({ length: n }, (_, k) => ({ t: inicio + k * ms, o: precio, h: precio + ancho / 2, l: precio - ancho / 2, c: precio, v }));
}
const seguir = (velas, ms, resto) => resto.map((x, k) => ({ t: velas.at(-1).t + (k + 1) * ms, v: 1, ...x }));

// ---------------------------------------------------------------- catálogo y contexto

test('SETUPS: los seis del diseño, congelados, con sus temporalidades', () => {
  assert.deepEqual(SETUPS.map(s => s.id), ['ruptura-rango-apertura', 'ruptura-rango', 'bandera-alcista', 'rebote-sobreventa', 'retroceso-tendencia', 'ruptura-bajista']);
  assert.ok(Object.isFrozen(SETUPS));
  for (const s of SETUPS) {
    assert.ok(Object.isFrozen(s) && Object.isFrozen(s.intervalos), s.id);
    assert.equal(typeof s.detectar, 'function');
    assert.ok(s.nombre && s.descripcion);
  }
  assert.deepEqual(setup('ruptura-rango-apertura').intervalos, ['15m', '1h']);
  assert.deepEqual(setup('bandera-alcista').intervalos, ['15m', '1h']);
  for (const id of ['ruptura-rango', 'rebote-sobreventa', 'retroceso-tendencia', 'ruptura-bajista']) assert.deepEqual(setup(id).intervalos, ['1h', '4h']);
  assert.deepEqual(SETUPS.filter(s => s.direccion === 'corta').map(s => s.id), ['ruptura-bajista']);
});

test('prepararContexto: arrays alineados, entradas raras sin romper y error claro con un intervalo malo', () => {
  const velas = generarVelas({ semilla: 2, n: 120, intervalo: '1h' });
  const ctx = prepararContexto(velas, '1h');
  for (const k of ['cierres', 'ema20', 'ema50', 'ema200', 'rsi', 'atr', 'vwap', 'volRel']) assert.equal(ctx[k].length, 120, k);
  assert.equal(ctx.bb.media.length, 120);
  assert.equal(ctx.donchian24.max.length, 120);
  assert.ok(Array.isArray(ctx.pivotes.altos) && Array.isArray(ctx.rangos));
  assert.equal(ctx.ms, H);
  // Con una Serie usa solo las velas cerradas.
  const serie = serieDe(velas, { intervalo: '1h', ahora: velas.at(-1).t + 10 * 60_000 });
  assert.equal(prepararContexto(serie).velas.length, 119);
  for (const raro of [[], null, undefined, 'abc', [velas[0]], [null, { t: 1 }, { t: NaN, h: NaN, l: 1, c: 2 }]]) {
    const c = prepararContexto(raro, '15m');
    for (const s of SETUPS) for (let i = -1; i < 3; i++) assert.equal(s.detectar(c, i, { formandose: true }), null, `${s.id} ${i}`);
    assert.equal(tendencia(c, 0).tendencia, 'lateral');
  }
  assert.throws(() => prepararContexto(velas, '2h'), /Intervalo desconocido: «2h»/);
  for (const s of SETUPS) assert.equal(s.detectar(null, 5), null);
});

// ---------------------------------------------------------------- setups uno a uno

test('ruptura-rango: rompe el máximo de 24 horas con el doble de volumen (motivo en llano)', () => {
  const base = planas({ n: 60, inicio: Date.UTC(2026, 10, 10), ms: H, precio: 61300, ancho: 200 });
  const velas = [...base, ...seguir(base, H, [{ o: 61300, h: 61700, l: 61280, c: 61650, v: 2 }])];
  const r = setup('ruptura-rango').detectar(prepararContexto(velas, '1h'), 60);
  assert.equal(r.estado, 'activo');
  assert.equal(r.nivel_entrada, 61400);
  assert.equal(r.nivel_invalidacion, 61300); // media altura del rango (más alta que 61.400 − 1,5 ATR)
  assert.equal(r.motivo, 'El precio ha roto el máximo de las últimas 24 horas (61.400 €) con el doble de volumen de lo normal.');
  assert.equal(r.datos.intervalo, '1h');
  assert.equal(r.datos.volRel, 2);
  assert.equal(r.datos.rsi, 100);
  assert.ok(r.datos.atr > 200 && r.datos.atr < 230);
  assert.equal(r.datos.comprimido, true);
  assert.ok(Number.isInteger(r.fuerza) && r.fuerza >= 60 && r.fuerza <= 100);
  // Mismo cierre con volumen normal: no es ruptura.
  const flojo = velas.map((x, k) => (k === 60 ? { ...x, v: 1 } : x));
  assert.equal(setup('ruptura-rango').detectar(prepararContexto(flojo, '1h'), 60), null);
  // Formándose: a ≤ 0,25 ATR por debajo con el rango estrecho (solo si se pide).
  const cerca = velas.map((x, k) => (k === 60 ? { ...x, h: 61395, c: 61360, v: 1 } : x));
  const ctxCerca = prepararContexto(cerca, '1h');
  assert.equal(setup('ruptura-rango').detectar(ctxCerca, 60), null);
  const f = setup('ruptura-rango').detectar(ctxCerca, 60, { formandose: true });
  assert.equal(f.estado, 'formandose');
  assert.match(f.motivo, /a 40 € del máximo de las últimas 24 horas \(61\.400 €\)/);
  assert.ok(f.fuerza < r.fuerza);
});

test('ruptura-bajista: simétrica, y solo informativa con cortos apagados', () => {
  const base = planas({ n: 60, inicio: Date.UTC(2026, 10, 10), ms: H, precio: 61300, ancho: 200 });
  const velas = [...base, ...seguir(base, H, [{ o: 61300, h: 61320, l: 60900, c: 60950, v: 2 }])];
  const r = setup('ruptura-bajista').detectar(prepararContexto(velas, '1h'), 60);
  assert.equal(r.estado, 'activo');
  assert.equal(r.nivel_entrada, 61200);
  assert.equal(r.nivel_invalidacion, 61300);
  assert.ok(r.nivel_invalidacion > r.nivel_entrada);
  assert.match(r.motivo, /^El precio ha roto el mínimo de las últimas 24 horas \(61\.200 €\) con el doble de volumen de lo normal: señal de venta en corto\.$/);
  const ahora = velas.at(-1).t + H;
  const apagados = escanear({ series: { '1h': serieDe(velas) }, ahora, config: { riesgo: { cortos: false } } });
  const corto = apagados.setups.find(s => s.id === 'ruptura-bajista');
  assert.equal(corto.operable, false);
  assert.equal(corto.direccion, 'corta');
  assert.match(corto.motivo, /Solo informativa: los cortos están apagados \(cortos = false\), así que no se opera\./);
  assert.equal(apagados.setups.at(-1).id, 'ruptura-bajista', 'lo que no se puede operar va al final');
  assert.notEqual(apagados.mejor?.id, 'ruptura-bajista', 'el mejor nunca es uno que no se puede operar');
  const encendidos = escanear({ series: { '1h': serieDe(velas) }, ahora, config: { riesgo: { cortos: true } } });
  const corto2 = encendidos.setups.find(s => s.id === 'ruptura-bajista');
  assert.equal(corto2.operable, true);
  assert.doesNotMatch(corto2.motivo, /informativa/);
  assert.equal(encendidos.mejor.id, 'ruptura-bajista');
});

test('ruptura-rango-apertura (15m): solo la primera rotura del día, con volumen y con el rango ya cerrado', () => {
  const ayer = planas({ n: 96, inicio: Date.UTC(2026, 10, 13), ms: M15, precio: 61000 });
  const velas = [...ayer, ...seguir(ayer, M15, [
    { o: 61000, h: 61200, l: 60950, c: 61050 }, // 00:00 UTC
    { o: 61050, h: 61100, l: 60900, c: 61000 }, // 00:15
    { o: 61000, h: 61050, l: 60950, c: 61000 }, // 00:30
    { o: 61000, h: 61050, l: 60950, c: 61000 }, // 00:45 → el rango cierra a la 01:00
    { o: 61000, h: 61050, l: 60950, c: 61000 }, // 100
    { o: 61000, h: 61190, l: 60990, c: 61180 }, // 101: a 20 € del máximo
    { o: 61180, h: 61300, l: 61170, c: 61250, v: 3 }, // 102: primera rotura, triple de volumen
    { o: 61250, h: 61260, l: 61080, c: 61100 }, // 103
    { o: 61100, h: 61290, l: 61090, c: 61260, v: 3 }, // 104: segunda rotura del día
  ])];
  const ctx = prepararContexto(velas, '15m');
  const orb = setup('ruptura-rango-apertura');
  assert.equal(orb.detectar(ctx, 97, { formandose: true }), null, 'con el rango a medias no hay nada');
  const r = orb.detectar(ctx, 102);
  assert.equal(r.estado, 'activo');
  assert.equal(r.nivel_entrada, 61200);
  assert.equal(r.nivel_invalidacion, 61050, 'el rango mide más de 2 ATR: invalidación en su punto medio');
  assert.equal(r.datos.rango_dia, '2026-11-14');
  assert.equal(r.datos.rango_min, 60900);
  assert.equal(r.motivo, 'El precio ha cerrado por encima del máximo de la primera hora del día (00:00–01:00 UTC, 61.200 €) con el triple de volumen de lo normal.');
  assert.equal(orb.detectar(ctx, 104), null, 'la segunda rotura del día no cuenta');
  assert.equal(orb.detectar(ctx, 101), null);
  assert.equal(orb.detectar(ctx, 101, { formandose: true }).estado, 'formandose');
  const sinVolumen = prepararContexto(velas.map((x, k) => (k === 102 ? { ...x, v: 1 } : x)), '15m');
  assert.equal(orb.detectar(sinVolumen, 102), null);
  // Rango estrecho (≤ 2 ATR): la invalidación es el mínimo del rango.
  const estrecho = velas.map((x, k) => (k === 96 ? { ...x, h: 61080 } : k === 97 ? { ...x, h: 61060, l: 60980 } : k === 101 ? { ...x, h: 61070, c: 61060 } : k === 102 ? { ...x, o: 61060, h: 61150, c: 61120 } : x));
  const r2 = orb.detectar(prepararContexto(estrecho, '15m'), 102);
  assert.equal(r2.nivel_entrada, 61080);
  assert.equal(r2.nivel_invalidacion, 60950);
  // En 4h no se puede medir la primera hora: el escáner ni lo intenta.
  assert.equal(orb.detectar(prepararContexto(agregar(velas, 4 * H), '4h'), 3), null);
});

test('bandera-alcista: asta + pausa con menos volumen; entrada en su techo e invalidación en su suelo', () => {
  const base = planas({ n: 30, inicio: Date.UTC(2026, 10, 12), ms: H, precio: 60000 });
  const asta = [];
  let c = 60000;
  for (let k = 0; k < 5; k++) { asta.push({ o: c, h: c + 150, l: c - 50, c: c + 100, v: 3 }); c += 100; }
  const pausa = [[60500, 60450], [60450, 60420], [60420, 60400], [60400, 60430], [60430, 60500]]
    .map(([o, cc]) => ({ o, h: Math.max(o, cc) + 40, l: Math.min(o, cc) - 40, c: cc, v: 1 }));
  const sinRotura = [...base, ...seguir(base, H, [...asta, ...pausa])];
  const velas = [...sinRotura, ...seguir(sinRotura, H, [{ o: 60500, h: 60620, l: 60480, c: 60600, v: 3 }])];
  const ctx = prepararContexto(velas, '1h');
  const r = setup('bandera-alcista').detectar(ctx, 40);
  assert.equal(r.estado, 'activo');
  assert.equal(r.nivel_entrada, 60540);
  assert.equal(r.nivel_invalidacion, 60360);
  assert.equal(r.datos.velas_bandera, 5);
  assert.equal(r.datos.velas_asta, 5);
  assert.equal(r.datos.asta, 600);
  assert.ok(r.datos.retroceso_pct <= 50);
  assert.ok(r.datos.volumen_bandera_rel < 1);
  assert.match(r.motivo, /^Tras subir 600 € en 5 velas, el precio ha descansado 5 velas sin devolver la mitad de la subida y ahora rompe el techo de esa pausa \(60\.540 €\)/);
  // En la última vela de la pausa, cerca del techo: formándose.
  const f = setup('bandera-alcista').detectar(ctx, 39, { formandose: true });
  assert.equal(f.estado, 'formandose');
  assert.equal(f.nivel_entrada, 60540);
  // Si la pausa devuelve más de la mitad de la subida, ya no es bandera.
  const honda = velas.map((x, k) => (k === 37 ? { ...x, l: 60200 } : x));
  assert.equal(setup('bandera-alcista').detectar(prepararContexto(honda, '1h'), 40), null);
  // Si la pausa lleva tanto volumen como el asta, tampoco.
  const ruidosa = velas.map((x, k) => (k >= 35 && k <= 39 ? { ...x, v: 4 } : x));
  assert.equal(setup('bandera-alcista').detectar(prepararContexto(ruidosa, '1h'), 40), null);
});

// Lo que dice el diseño de cada setup, comprobado sobre el contexto en cada detección.
function comprobarDeteccion(s, ctx, i, r) {
  const v = ctx.velas[i];
  const tol = 0.011;
  const donde = `${s.id} ${ctx.intervalo} i=${i}`;
  assert.ok(['activo', 'formandose'].includes(r.estado), donde);
  assert.ok(Number.isInteger(r.fuerza) && r.fuerza >= 0 && r.fuerza <= 100, donde);
  assert.ok(typeof r.motivo === 'string' && r.motivo.length > 20 && !r.motivo.includes('undefined') && !r.motivo.includes('NaN'), donde);
  for (const k of ['atr', 'rsi', 'volRel', 'intervalo']) assert.ok(k in r.datos, `${donde}: falta datos.${k}`);
  assert.equal(r.datos.intervalo, ctx.intervalo);
  if (s.direccion === 'larga') assert.ok(r.nivel_invalidacion < r.nivel_entrada, donde);
  else assert.ok(r.nivel_invalidacion > r.nivel_entrada, donde);
  if (r.estado !== 'activo') return;
  const a = ctx.atr[i];
  if (s.id === 'ruptura-rango') {
    assert.ok(v.c > ctx.donchian24.max[i] && ctx.volRel[i] >= 1.2, donde);
    assert.equal(r.nivel_entrada, ctx.donchian24.max[i]);
  } else if (s.id === 'ruptura-bajista') {
    assert.ok(v.c < ctx.donchian24.min[i] && ctx.volRel[i] >= 1.2, donde);
    assert.equal(r.nivel_entrada, ctx.donchian24.min[i]);
  } else if (s.id === 'rebote-sobreventa') {
    const rsis = ctx.rsi.slice(i - 4, i + 1).filter(x => x !== null);
    assert.ok(Math.min(...rsis) < 30, donde);
    assert.ok(v.c > ctx.velas[i - 1].h || (ctx.rsi[i - 1] < 30 && ctx.rsi[i] >= 30), donde);
    assert.equal(r.nivel_entrada, v.h);
    assert.equal(r.nivel_invalidacion, Math.min(...ctx.velas.slice(i - 4, i + 1).map(x => x.l)));
  } else if (s.id === 'retroceso-tendencia') {
    const [e20, e50, e200] = [ctx.ema20[i], ctx.ema50[i], ctx.ema200[i]];
    assert.ok(e50 > e200 && v.c > e200 && v.c > e20, donde);
    assert.ok(v.l <= Math.max(e20, e50) + 0.1 * a + tol, donde);
    assert.equal(r.nivel_entrada, v.h);
    const min3 = Math.min(...ctx.velas.slice(i - 2, i + 1).map(x => x.l));
    assert.ok(Math.abs(r.nivel_invalidacion - Math.min(min3, e50 - 0.5 * a)) <= tol, donde);
  } else if (s.id === 'bandera-alcista') {
    assert.ok(v.c > r.nivel_entrada, donde);
    assert.equal(r.nivel_entrada, r.datos.bandera_max);
    assert.equal(r.nivel_invalidacion, r.datos.bandera_min);
    assert.ok(r.datos.velas_bandera >= 3 && r.datos.velas_bandera <= 12 && r.datos.velas_asta <= 8, donde);
    assert.ok(r.datos.retroceso_pct <= 50 && r.datos.volumen_bandera_rel < 1, donde);
  } else if (s.id === 'ruptura-rango-apertura') {
    assert.ok(v.c > r.datos.rango_max && ctx.volRel[i] >= 1.2, donde);
    assert.equal(r.nivel_entrada, r.datos.rango_max);
    assert.equal(new Date(v.t).toISOString().slice(0, 10), r.datos.rango_dia);
  }
}

// ---------------------------------------------------------------- sin mirar al futuro

test('sin mirar al futuro: detectar(ctx, i) da lo mismo con todas las velas que con velas[0..i]', () => {
  const vistas = {};
  for (const iv of ['15m', '1h', '4h']) {
    const setups = SETUPS.filter(s => s.intervalos.includes(iv));
    for (const patron of ['aleatorio', 'tendencia-alcista', 'tendencia-bajista', 'ruptura', 'bandera', 'sobreventa']) {
      for (const semilla of [3, 11, 29]) {
        const n = patron === 'bandera' ? 60 : 260;
        const velas = generarVelas({ semilla, n, intervalo: iv, patron, inicio: Date.UTC(2026, 9, 1) });
        const todo = prepararContexto(velas, iv);
        for (let i = 0; i < n; i += i >= n - 20 ? 1 : 2) {
          const hasta = prepararContexto(velas.slice(0, i + 1), iv);
          for (const s of setups) {
            for (const op of [undefined, { formandose: true }]) {
              const a = s.detectar(todo, i, op);
              assert.deepEqual(a, s.detectar(hasta, i, op), `${s.id} ${iv} ${patron} semilla ${semilla} i=${i}`);
              if (a) {
                comprobarDeteccion(s, todo, i, a);
                vistas[`${s.id}:${a.estado}`] = (vistas[`${s.id}:${a.estado}`] ?? 0) + 1;
              }
            }
          }
        }
      }
    }
  }
  // Que la prueba no sea vacía: cada setup ha salido activo alguna vez.
  for (const s of SETUPS) assert.ok(vistas[`${s.id}:activo`] > 0, `${s.id} no ha salido nunca`);
});

test('tendencia: alcista, bajista, de lado y sin datos, siempre con su porqué', () => {
  for (const semilla of [1, 2, 3]) {
    const sube = prepararContexto(generarVelas({ semilla, n: 300, intervalo: '1h', patron: 'tendencia-alcista' }), '1h');
    const t = tendencia(sube, 299);
    assert.equal(t.tendencia, 'alcista');
    assert.match(t.motivo, /por encima de la EMA200/);
    assert.equal(tendencia(prepararContexto(generarVelas({ semilla, n: 300, intervalo: '4h', patron: 'tendencia-bajista' }), '4h'), 299).tendencia, 'bajista');
  }
  let lado = 0;
  for (let semilla = 1; semilla <= 8; semilla++) {
    if (tendencia(prepararContexto(generarVelas({ semilla, n: 300, intervalo: '1h', patron: 'lateral' }), '1h'), 299).tendencia === 'lateral') lado++;
  }
  assert.ok(lado >= 6, `de lado solo ${lado} de 8`);
  const pocas = prepararContexto(generarVelas({ semilla: 1, n: 30, intervalo: '1h', patron: 'tendencia-alcista' }), '1h');
  assert.deepEqual(tendencia(pocas, 29).tendencia, 'lateral');
  assert.match(tendencia(pocas, 29).motivo, /No hay velas suficientes/);
  const cien = prepararContexto(generarVelas({ semilla: 1, n: 100, intervalo: '1h', patron: 'tendencia-alcista' }), '1h');
  assert.match(tendencia(cien, 99).motivo, /no hay 200 velas/);
  assert.equal(tendencia(null).tendencia, 'lateral');
});

// ---------------------------------------------------------------- escanear

const finDe = (velas, iv) => velas.at(-1).t + { '15m': M15, '1h': H, '4h': 4 * H, '1d': D }[iv];

test('cada patrón sintético dispara su setup al final de la serie', () => {
  const casos = [['ruptura', 300, '1h', 'ruptura-rango'], ['ruptura', 300, '4h', 'ruptura-rango'],
    ['bandera', 60, '1h', 'bandera-alcista'], ['bandera', 60, '15m', 'bandera-alcista'],
    ['sobreventa', 300, '1h', 'rebote-sobreventa'], ['sobreventa', 300, '4h', 'rebote-sobreventa']];
  for (const [patron, n, iv, id] of casos) {
    for (let semilla = 1; semilla <= 8; semilla++) {
      const velas = generarVelas({ semilla, n, intervalo: iv, patron });
      const r = escanear({ series: { [iv]: serieDe(velas, { intervalo: iv }) }, ahora: finDe(velas, iv) });
      const s = r.setups.find(x => x.id === id && x.estado === 'activo');
      assert.ok(s, `${patron} ${iv} semilla ${semilla}: no salió ${id} (salió ${r.setups.map(x => x.id).join(', ') || 'nada'})`);
      assert.ok(s.velas_desde >= 0 && s.velas_desde <= 3);
      assert.equal(s.vela_t, velas[velas.length - 1 - s.velas_desde].t);
    }
  }
});

test('un mercado de lado casi nunca dispara rupturas', () => {
  let velasVistas = 0;
  const cuenta = { 'ruptura-rango': 0, 'ruptura-bajista': 0, 'ruptura-rango-apertura': 0 };
  for (let semilla = 1; semilla <= 6; semilla++) {
    const velas = generarVelas({ semilla, n: 500, intervalo: '1h', patron: 'lateral' });
    const ctx = prepararContexto(velas, '1h');
    for (let i = 0; i < velas.length; i++) {
      velasVistas++;
      for (const id of Object.keys(cuenta)) if (setup(id).detectar(ctx, i)) cuenta[id]++;
    }
  }
  assert.ok(cuenta['ruptura-rango'] / velasVistas < 0.01, JSON.stringify(cuenta));
  assert.ok(cuenta['ruptura-bajista'] / velasVistas < 0.01, JSON.stringify(cuenta));
  assert.ok(cuenta['ruptura-rango-apertura'] / velasVistas < 0.025, JSON.stringify(cuenta));
  // Y la tendencia de fondo, de lado, no da retrocesos en tendencia.
  let retrocesos = 0;
  for (let semilla = 1; semilla <= 6; semilla++) {
    const velas = generarVelas({ semilla, n: 500, intervalo: '1h', patron: 'lateral' });
    const ctx = prepararContexto(velas, '1h');
    for (let i = 0; i < velas.length; i++) if (setup('retroceso-tendencia').detectar(ctx, i)) retrocesos++;
  }
  assert.ok(retrocesos / velasVistas < 0.01, `retrocesos: ${retrocesos}`);
});

test('escanear ignora la vela abierta (aunque la serie diga que está cerrada)', () => {
  const velas = generarVelas({ semilla: 5, n: 300, intervalo: '1h', patron: 'ruptura' });
  const cerradas = velas.slice(0, -1);
  const ultima = velas.at(-1);
  const ahora = ultima.t + 30 * 60_000; // a media vela
  const locura = { ...ultima, h: ultima.h * 1.3, l: ultima.l * 0.7, c: ultima.c * 1.2, v: ultima.v * 80 };
  const sin = escanear({ series: { '1h': serieDe(cerradas, { intervalo: '1h', ahora }) }, ahora });
  const con = escanear({ series: { '1h': serieDe([...cerradas, locura], { intervalo: '1h', ahora }) }, ahora });
  const mentirosa = { ...serieDe([...cerradas, locura], { intervalo: '1h', ahora }), ultimaCerrada: 299 };
  const conMentira = escanear({ series: { '1h': mentirosa }, ahora });
  assert.deepEqual(con.setups, sin.setups);
  assert.deepEqual(conMentira.setups, sin.setups);
  assert.deepEqual(con.contexto.intervalos, sin.contexto.intervalos);
  assert.ok(sin.setups.length > 0);
  // El precio sí es el último conocido (el de la vela en curso).
  assert.equal(con.precio, locura.c);
  assert.equal(sin.precio, cerradas.at(-1).c);
});

test('escanear: activo durante la vela de la señal y las 3 siguientes, salvo que se invalide', () => {
  const base = planas({ n: 60, inicio: Date.UTC(2026, 10, 10), ms: H, precio: 61300, ancho: 200 });
  const rotura = [...base, ...seguir(base, H, [{ o: 61300, h: 61700, l: 61280, c: 61650, v: 2 }])];
  const calma = { o: 61600, h: 61640, l: 61560, c: 61600 };
  for (let k = 0; k <= 5; k++) {
    const velas = [...rotura, ...seguir(rotura, H, Array(k).fill(calma))];
    const r = escanear({ series: { '1h': serieDe(velas) }, ahora: finDe(velas, '1h') });
    const s = r.setups.find(x => x.id === 'ruptura-rango');
    if (k <= 3) {
      assert.equal(s?.estado, 'activo', `k=${k}`);
      assert.equal(s.velas_desde, k);
      assert.equal(s.vela_t, rotura.at(-1).t);
    } else {
      assert.equal(s, undefined, `k=${k}: ya no debería salir`);
    }
  }
  // Una vela que toca la invalidación (61.300 €) la mata aunque sea reciente.
  const rota = [...rotura, ...seguir(rotura, H, [calma, { o: 61600, h: 61610, l: 61290, c: 61500 }])];
  const r = escanear({ series: { '1h': serieDe(rota) }, ahora: finDe(rota, '1h') });
  assert.equal(r.setups.find(x => x.id === 'ruptura-rango'), undefined);
});

// Cuatro temporalidades que acaban a la vez (las de 4h salen de las de 1h).
function mercado({ semilla = 7, patron1h = 'aleatorio', patron1d = 'tendencia-alcista', fin = Date.UTC(2026, 10, 14, 10) } = {}) {
  const v1h = generarVelas({ semilla, n: 24 * 40, intervalo: '1h', patron: patron1h, inicio: fin - 24 * 40 * H });
  return {
    fin,
    series: {
      '15m': serieDe(generarVelas({ semilla: semilla + 1, n: 400, intervalo: '15m', inicio: fin - 400 * M15 }), { intervalo: '15m', ahora: fin }),
      '1h': serieDe(v1h, { intervalo: '1h', ahora: fin }),
      '4h': serieDe(agregar(v1h, 4 * H), { intervalo: '4h', ahora: fin }),
      '1d': serieDe(generarVelas({ semilla: semilla + 2, n: 300, intervalo: '1d', patron: patron1d, inicio: Date.UTC(2026, 10, 14) - 300 * D }), { intervalo: '1d', ahora: fin }),
    },
  };
}

test('escanear con cuatro temporalidades: tendencias, contexto, niveles clave y qué vigilar', () => {
  const { series, fin } = mercado();
  const r = escanear({ series, ahora: fin, config: { par: 'BTC-EUR', riesgo: { cortos: false }, escaner: { intervalos: ['15m', '1h', '4h', '1d'] } } });
  assert.equal(r.hora, fin);
  assert.equal(r.par, 'BTC-EUR');
  assert.deepEqual(Object.keys(r.tendencias), ['15m', '1h', '4h', '1d']);
  for (const t of Object.values(r.tendencias)) assert.ok(['alcista', 'bajista', 'lateral'].includes(t));
  assert.equal(r.tendencias['1d'], 'alcista');
  for (const iv of ['15m', '1h', '4h', '1d']) {
    const c = r.contexto.intervalos[iv];
    assert.ok(c.rsi >= 0 && c.rsi <= 100 && c.atr > 0 && c.atr_pct > 0, iv);
    assert.equal(c.tendencia, r.tendencias[iv]);
    assert.equal(typeof c.tendencia_motivo, 'string');
  }
  assert.equal(r.contexto.precio, r.precio);
  assert.ok(r.contexto.ema200_diaria > 0);
  const esperado = Math.round(((r.precio - r.contexto.ema200_diaria) / r.contexto.ema200_diaria) * 10000) / 100;
  assert.ok(Math.abs(r.contexto.distancia_ema200_diaria_pct - esperado) <= 0.011);
  assert.ok(Number.isFinite(r.contexto.cambio_24h_pct) && Number.isFinite(r.contexto.cambio_72h_pct));
  // Niveles: por arriba y por abajo, del más cercano al más lejano.
  const { arriba, abajo, resistencia, soporte } = r.niveles_clave;
  assert.ok(arriba.length > 0 && abajo.length > 0 && arriba.length <= 5 && abajo.length <= 5);
  assert.ok(arriba.every(n => n.precio > r.precio && n.distancia_pct > 0));
  assert.ok(abajo.every(n => n.precio < r.precio && n.distancia_pct < 0));
  for (const lado of [arriba, abajo]) for (let k = 1; k < lado.length; k++) assert.ok(Math.abs(lado[k].distancia_pct) >= Math.abs(lado[k - 1].distancia_pct));
  assert.equal(resistencia, arriba[0]);
  assert.equal(soporte, abajo[0]);
  const tipos = new Set([...arriba, ...abajo].map(n => n.tipo));
  assert.ok([...tipos].every(t => ['pivote-alto', 'pivote-bajo', 'max-24h', 'min-24h', 'rango-apertura-max', 'rango-apertura-min', 'vwap', 'ema200-diaria'].includes(t)));
  assert.equal(typeof r.resumen, 'string');
  assert.equal(r.niveles_clave.que_vigilar, r.resumen);
  // Ordenados por fuerza (los operables primero).
  for (let k = 1; k < r.setups.length; k++) {
    const [a, b] = [r.setups[k - 1], r.setups[k]];
    assert.ok(a.operable > b.operable || (a.operable === b.operable && a.fuerza >= b.fuerza));
  }
  for (const s of r.setups) {
    assert.ok(SETUPS.find(x => x.id === s.id).intervalos.includes(s.intervalo));
    assert.ok(['activo', 'formandose'].includes(s.estado));
    assert.ok(Number.isFinite(s.vela_t));
  }
});

test('escanear sin jugada: dice qué vigilar con el nivel más cercano por arriba y por abajo', () => {
  const base = planas({ n: 300, inicio: Date.UTC(2026, 10, 1), ms: H, precio: 61000, ancho: 200 });
  // Un máximo y un mínimo claros en medio para que haya pivotes.
  const velas = base.map((x, k) => (k === 250 ? { ...x, h: 62000 } : k === 270 ? { ...x, l: 60300 } : x));
  const r = escanear({ series: { '1h': serieDe(velas) }, ahora: finDe(velas, '1h') });
  assert.equal(r.setups.filter(s => s.estado === 'activo').length, 0);
  assert.equal(r.niveles_clave.resistencia.precio, 61100);
  assert.equal(r.niveles_clave.soporte.precio, 60900);
  assert.ok(r.niveles_clave.arriba.some(n => n.precio === 62000 && n.tipo === 'pivote-alto'));
  assert.ok(r.niveles_clave.abajo.some(n => n.precio === 60300 && n.tipo === 'pivote-bajo'));
  assert.match(r.resumen, /^No hay jugada clara ahora mismo\. Qué vigilar: por arriba 61\.100 € \(.+, \+0,2 %\); por abajo 60\.900 € \(.+, -0,2 %\)\./);
});

test('rebote-sobreventa pierde fuerza y lo dice si la tendencia diaria es bajista', () => {
  const fin = Date.UTC(2026, 10, 14, 10);
  const v1h = generarVelas({ semilla: 4, n: 300, intervalo: '1h', patron: 'sobreventa', inicio: fin - 300 * H });
  const diaria = patron => serieDe(generarVelas({ semilla: 9, n: 300, intervalo: '1d', patron, inicio: Date.UTC(2026, 10, 14) - 300 * D }), { intervalo: '1d', ahora: fin });
  const conBajista = escanear({ series: { '1h': serieDe(v1h, { ahora: fin }), '1d': diaria('tendencia-bajista') }, ahora: fin });
  const conAlcista = escanear({ series: { '1h': serieDe(v1h, { ahora: fin }), '1d': diaria('tendencia-alcista') }, ahora: fin });
  assert.equal(conBajista.tendencias['1d'], 'bajista');
  assert.equal(conAlcista.tendencias['1d'], 'alcista');
  const a = conBajista.setups.find(s => s.id === 'rebote-sobreventa');
  const b = conAlcista.setups.find(s => s.id === 'rebote-sobreventa');
  assert.ok(a && b);
  assert.ok(a.fuerza < b.fuerza, `${a.fuerza} debería ser menor que ${b.fuerza}`);
  assert.match(a.motivo, /tendencia diaria, que es bajista|tendencia diaria también es bajista/);
  assert.match(a.motivo, /menos fuerza/);
  assert.doesNotMatch(b.motivo, /diaria/);
  assert.deepEqual(a.datos.mayores, { '1d': 'bajista' });
  assert.ok(a.datos.ajuste_mayores < 0 && b.datos.ajuste_mayores > 0);
});

test('escanear no se rompe con entradas raras y lo cuenta en avisos', () => {
  const vacio = escanear();
  assert.deepEqual(vacio.setups, []);
  assert.equal(vacio.precio, null);
  assert.equal(vacio.mejor, null);
  assert.match(vacio.avisos.join(' '), /No se ha pasado ninguna serie/);
  assert.match(escanear({ series: 'hola' }).avisos.join(' '), /«series» debe ser un objeto/);
  const raro = escanear({
    series: {
      '1h': { velas: [] },
      '2h': { velas: [] },
      '15m': serieDe([{ t: Date.UTC(2026, 10, 14), o: 1, h: 2, l: 0.5, c: 1.5, v: 1 }], { intervalo: '15m' }),
      '4h': { velas: [null, { t: NaN }, { t: Date.UTC(2026, 10, 14), o: 1, h: NaN, l: 1, c: 1, v: 1 }] },
      '1d': null,
    },
    ahora: Date.UTC(2026, 10, 15),
    config: { escaner: { intervalos: ['15m', '1h', '4h', '1d'] } },
  });
  assert.deepEqual(raro.setups, []);
  const avisos = raro.avisos.join(' | ');
  assert.match(avisos, /intervalo desconocido «2h»/);
  assert.match(avisos, /No hay velas cerradas de 1h/);
  assert.match(avisos, /Falta la serie de 1d/);
  assert.match(avisos, /no da para la EMA200/);
  assert.equal(raro.precio, 1.5);
  assert.equal(escanear({ series: {}, ahora: 'mañana' }).avisos[0], '«ahora» no es una hora válida (mañana): se usa la hora actual.');
  assert.match(escanear({ series: {}, ahora: 1e20 }).avisos[0], /no es una hora válida/);
  // Una serie con el par en dólares escribe los precios en dólares.
  const usd = generarVelas({ semilla: 1, n: 300, intervalo: '1h', patron: 'ruptura' });
  const r = escanear({ series: { '1h': serieDe(usd, { par: 'BTC-USD' }) }, ahora: finDe(usd, '1h') });
  assert.equal(r.moneda, 'USD');
  assert.match(r.setups[0].motivo, /US\$/);
});

test('precioTxt: precios en llano, sin céntimos en BTC', () => {
  assert.equal(precioTxt(61400), '61.400 €');
  assert.equal(precioTxt(61027.86), '61.028 €');
  assert.equal(precioTxt(5000), '5.000 €');
  assert.equal(precioTxt(42.5), '42,50 €');
  assert.equal(precioTxt(40), '40 €');
  assert.equal(precioTxt(NaN), '—');
  assert.equal(precioTxt(null), '—');
});
