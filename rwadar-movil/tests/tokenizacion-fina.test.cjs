'use strict';

/* Las series finas del gráfico de la tokenización (13/11/2026): un punto
   cada 5 minutos de las últimas 24 horas y uno cada hora de los últimos 30
   días, de los mismos tokens que la diaria. El motor (cubos, arrastre de
   hasta 24 horas, tokens fuera y su peso, validación, unión con la diaria,
   la serie de cada pestaña, la cabecera, la hora de España y el trazo para
   pintar) y la lectura de la app. Sin red: datos hechos a mano con la forma
   de CoinGecko, entre ellos los huecos reales de figure-heloc del
   13/11/2026, los que dejaban sin serie fina con un margen de media hora. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const t = require('../lib/tokenizacion');

const RAIZ = path.resolve(__dirname, '..');
const MIN = 60000, HORA = 3600000, DIA = 86400000;
// Como CoinGecko: puntos en punto cada 5 minutos (o cada hora) y uno más con la hora de la lectura.
const LECTURA = Date.parse('2026-11-13T09:21:20Z');
const GENERADO = '2026-11-13T09:22:05Z';

/* Datos de un token: cada «paso» desde «desde» (redondeado hacia arriba) hasta la
   lectura, más el de la lectura; «valor(ms)» da el valor; «sin» quita los que caen
   en [a, b). */
function datos({ paso, desde, lectura = LECTURA, valor = () => 100e6, sin = [] }) {
  const obs = [];
  for (let ms = Math.ceil(desde / paso) * paso; ms <= lectura; ms += paso) obs.push([ms, valor(ms)]);
  obs.push([lectura, valor(lectura)]);
  return obs.filter(([ms]) => !sin.some(([a, b]) => ms >= a && ms < b));
}
// Como los junta el generador: la lectura de 5 minutos (desde hace 24 horas) con, delante, lo anterior de sus otras lecturas.
const cinco = (o = {}) => datos({ paso: 5 * MIN, desde: (o.lectura || LECTURA) - DIA - HORA, ...o });
const horaria = (o = {}) => datos({ paso: HORA, desde: (o.lectura || LECTURA) - 31 * DIA, ...o });
const VIEJO = '2025-11-14';
const ent = (id, obs, primera = VIEJO) => ({ id, obs, primera });
const construir = (entradas, clave = '5m') => t.construirSerieFina(entradas, clave);
// Un token grande y plano: así los pequeños pesan menos del 1 %.
const GRANDE = 40e9;

/* Una diaria que acaba en «valorFinal» el día de la lectura, con esos tokens y ese «generado». */
function diaria({ valorFinal, tokens = ['token-a', 'token-b'], generado = GENERADO, dias = 365 } = {}) {
  const fin = Date.parse(generado.slice(0, 10) + 'T00:00:00Z');
  const puntos = [...Array(dias)].map((_, i) => ({ fecha: t.fechaDe(fin - (dias - 1 - i) * DIA), valor: Math.round(valorFinal * (0.6 + 0.4 * i / (dias - 1))), tokens: tokens.length }));
  puntos[puntos.length - 1].valor = valorFinal;
  return t.validarSerie({ version: 1, fuente: 'CoinGecko', categoria: 'tokenized-products', generado, pedidos: tokens.length, incluidos: tokens.length,
    discontinuos: 0, cobertura: 80, tokens, puntos });
}
/* Una serie de construirSerieFina como va en el archivo. */
const comoArchivo = (x, paso) => ({ paso, arrastre: x.arrastre, fuera: x.fuera, valorFuera: x.valorFuera, largos: x.largos, puntos: x.puntos });
/* El par diaria + fina, como lo deja serie-diaria.mjs: las tres acaban en el último dato de cada token.
   Con «conC», un tercer token pequeño (150 M$, un 0,36 %): en la de 5 minutos su lectura falla y en la
   horaria le faltan las últimas 30 horas; queda fuera de las dos y la diaria sí lo suma. */
function par({ generado = GENERADO, conC = false } = {}) {
  const va = ms => Math.round(30e9 * (1 + (ms - LECTURA) / (400 * DIA))), vb = ms => Math.round(12e9 * (1 + Math.sin(ms / (7 * HORA)) / 200));
  const e5 = [ent('token-a', cinco({ valor: va })), ent('token-b', cinco({ valor: vb }))];
  const e1 = [ent('token-a', datos({ paso: HORA, desde: LECTURA - 31 * DIA, valor: va })), ent('token-b', datos({ paso: HORA, desde: LECTURA - 31 * DIA, valor: vb }))];
  if (conC) {
    e5.push({ id: 'token-c', obs: null, valor: 150e6 });
    e1.push(ent('token-c', datos({ paso: HORA, desde: LECTURA - 31 * DIA, lectura: LECTURA - 30 * HORA, valor: () => 150e6 })));
  }
  const s5 = construir(e5, '5m'), s1 = construir(e1, '1h');
  const tokens = conC ? ['token-a', 'token-b', 'token-c'] : ['token-a', 'token-b'];
  const fina = t.validarSerieFina({ version: 1, fuente: 'CoinGecko', categoria: 'tokenized-products', generado, tokens,
    series: { '5m': comoArchivo(s5, 300), '1h': comoArchivo(s1, 3600) } });
  return { d: diaria({ valorFinal: va(LECTURA) + vb(LECTURA) + (conC ? 150e6 : 0), tokens, generado }), fina, s5, s1 };
}

test('cubos de 5 minutos en UTC: el último dato de cada token en el cubo; si le falta, el anterior hasta 24 horas; si falta más, ese token queda fuera de esa serie', () => {
  // A: dos datos por cubo (en punto y a los 2 minutos): vale el último.
  const a = cinco({ valor: ms => (ms % (5 * MIN) === 0 ? 100e6 : 101e6) }).flatMap(([ms, v]) => (ms % (5 * MIN) === 0 && ms + 2 * MIN < LECTURA ? [[ms, 100e6], [ms + 2 * MIN, 101e6]] : [[ms, v]]));
  const grande = cinco({ valor: () => GRANDE });
  // B: 3 h 35 min sin datos, como figure-heloc el 13/11/2026 (de las 08:20 a las 11:55 UTC).
  const hueco = [Date.parse('2026-11-12T20:20:00Z'), Date.parse('2026-11-12T23:55:00Z')];
  const b = cinco({ valor: ms => (ms < hueco[1] ? 200e6 : 210e6), sin: [hueco] });
  const r = construir([ent('token-a', a), ent('token-b', b), ent('grande', grande)]);
  // 24 horas justas, de las 09:20 de ayer a las 09:20 de hoy (el cubo de la lectura): 289 cubos seguidos.
  assert.equal(r.puntos.length, 289);
  assert.deepEqual([r.puntos[0][0], r.puntos.at(-1)[0]], ['2026-11-12T09:20Z', '2026-11-13T09:20Z']);
  assert.ok(r.puntos.every(([iso], i) => Date.parse(iso) % (5 * MIN) === 0 && (i === 0 || Date.parse(iso) - Date.parse(r.puntos[i - 1][0]) === 5 * MIN)), 'en punto, en UTC y seguidos');
  assert.equal(r.puntos[10][1], 101e6 + 200e6 + GRANDE, 'de A, el último del cubo (101), no el primero (100)');
  const en = iso => r.puntos.find(p => p[0] === iso);
  assert.equal(en('2026-11-12T23:50Z')[1], 101e6 + 200e6 + GRANDE, 'B, con su último dato de antes del hueco');
  assert.equal(en('2026-11-12T23:55Z')[1], 101e6 + 210e6 + GRANDE);
  assert.deepEqual(r.puntos.at(-1), ['2026-11-13T09:20Z', 101e6 + 210e6 + GRANDE, 3], 'el último: el dato de la lectura de cada uno');
  assert.deepEqual([r.fuera, r.valorFuera, r.largos, r.arrastre], [[], 0, ['token-b'], 288], 'B pasa más de una hora sin dato: «largos»');
  // 24 horas justas sin dato nuevo: entra; 5 minutos más: queda fuera de toda la serie, con su último valor.
  const justo = cinco({ valor: () => 200e6, sin: [[Date.parse('2026-11-12T09:20:00Z'), LECTURA]] });
  assert.deepEqual(['fuera', 'largos'].map(k => construir([ent('token-a', a), ent('token-b', justo), ent('grande', grande)])[k]), [[], ['token-b']]);
  const pasado = cinco({ valor: () => 200e6, sin: [[Date.parse('2026-11-12T09:15:00Z'), LECTURA]] });
  const rf = construir([ent('token-a', a), ent('token-b', pasado), ent('grande', grande)]);
  assert.deepEqual([rf.fuera, rf.valorFuera, rf.largos], [['token-b'], 200e6, []]);
  assert.ok(rf.puntos.every(p => p[2] === 2), 'fuera de toda la serie, no solo donde le faltan datos: ni se inventa ni se hunde');
  assert.equal(rf.puntos.at(-1)[1], 101e6 + GRANDE);
  // Una lectura que falla: fuera, con el valor de su último dato de las otras lecturas.
  const rl = construir([ent('token-a', a), { id: 'token-b', obs: null, valor: 200e6 }, ent('grande', grande)]);
  assert.deepEqual([rl.fuera, rl.valorFuera, rl.puntos.length], [['token-b'], 200e6, 289]);
  // Si los de fuera pesan más del 1 %, esa serie no sale ese día.
  assert.throws(() => construir([ent('token-a', a), ent('token-b', pasado)]), /los que quedan fuera \(token-b\) pesan el 66\.45 % \(como mucho 1 %\)/);
  assert.throws(() => construir([ent('token-a', a), { id: 'token-b', obs: null, valor: 0.5e9 }, ent('grande', grande)]), /pesan el 1\.23 %/);
  // Una hora justa sin dato no es «largo»; 65 minutos, sí.
  const h = Date.parse('2026-11-13T02:00:00Z');
  assert.deepEqual(construir([ent('token-b', cinco({ sin: [[h, h + 60 * MIN]] })), ent('grande', grande)]).largos, []);
  assert.deepEqual(construir([ent('token-b', cinco({ sin: [[h, h + 65 * MIN]] })), ent('grande', grande)]).largos, ['token-b']);
});

test('un token nuevo cuenta 0 hasta su primer dato; uno que ya cotizaba y no tiene datos al empezar la ventana queda fuera; la entrada se comprueba', () => {
  const grande = cinco({ valor: () => GRANDE });
  // Un token que CoinGecko empezó a seguir ayer (el primer día de la ventana): entra a las 03:00 de hoy, como en la diaria.
  const nuevo = cinco({ desde: Date.parse('2026-11-13T03:00:00Z'), valor: () => 50e6 });
  const rn = construir([ent('grande', grande), ent('nuevo', nuevo, '2026-11-12')]);
  assert.equal(rn.puntos.length, 289);
  assert.deepEqual([rn.puntos[0][2], rn.puntos.at(-1)[2], rn.fuera], [1, 2, []], 'de 1 a 2 tokens');
  assert.equal(rn.puntos.find(p => p[0] === '2026-11-13T02:55Z')[1], GRANDE);
  assert.equal(rn.puntos.find(p => p[0] === '2026-11-13T03:00Z')[1], GRANDE + 50e6);
  assert.deepEqual(construir([ent('grande', grande), ent('nuevo', nuevo, '2026-11-13')]).fuera, [], 'también si empezó hoy');
  // El mismo, pero con historia de hace un año: le faltan datos al empezar la ventana y queda fuera.
  assert.deepEqual(['fuera', 'valorFuera'].map(k => construir([ent('grande', grande), ent('nuevo', nuevo, VIEJO)])[k]), [['nuevo'], 50e6]);
  assert.throws(() => construir([]), /sin tokens/);
  assert.throws(() => construir([ent('a', [])]), /no tiene datos/);
  assert.throws(() => construir([ent('../a', grande)]), /no es válido/);
  assert.throws(() => construir([ent('a', grande.slice().reverse())]), /datos del token a no válidos/);
  assert.throws(() => construir([ent('a', [[LECTURA, 0]])]), /datos del token a no válidos/);
  assert.throws(() => construir([{ id: 'a', obs: null }]), /no tiene valor/);
  assert.throws(() => construir([{ id: 'a', obs: null, valor: 1e9 }]), /ningún token con datos/);
  assert.throws(() => construir([ent('a', grande)], '15m'), /resolución no válida/);
});

/* Los huecos reales de figure-heloc en la historia de cada hora de CoinGecko (lectura del 13/11/2026 a
   las 14:22 UTC): el último dato antes de cada hueco y el primero después. Cada mañana (UTC) de 3 a 5
   horas y cada fin de semana casi 24. Es el mayor token (26.617 M$, el 64 % de la suma). */
const HUECOS_FIGURE = [['10-14T07', '10-14T12'], ['10-15T07', '10-15T11'], ['10-18T08', '10-18T12'], ['10-18T13', '10-19T12'],
  ['10-22T07', '10-22T11'], ['10-23T07', '10-23T11'], ['10-24T07', '10-24T11'], ['10-25T06', '10-25T12'], ['10-25T13', '10-26T12'],
  ['10-27T07', '10-27T11'], ['10-28T09', '10-28T11'], ['10-29T09', '10-29T11'], ['10-30T09', '10-30T12'], ['10-31T07', '10-31T11'],
  ['11-01T07', '11-01T12'], ['11-01T13', '11-02T13'], ['11-03T07', '11-03T12'], ['11-04T08', '11-04T11'], ['11-05T08', '11-05T12'],
  ['11-06T10', '11-06T13'], ['11-08T08', '11-08T13'], ['11-08T14', '11-09T13'], ['11-10T07', '11-10T12'], ['11-11T07', '11-11T12'],
  ['11-12T07', '11-12T12'], ['11-13T08', '11-13T11']].map(([a, b]) => [Date.parse(`2026-${a}:00:00Z`) + 1, Date.parse(`2026-${b}:00:00Z`)]);

test('la horaria: 30 días exactos (721 puntos); con los huecos reales de figure-heloc (hasta 24 horas) sale entera y lo dice', () => {
  const r = construir([ent('token-a', horaria()), ent('token-b', horaria({ sin: [[LECTURA - 10 * DIA, LECTURA - 10 * DIA + 3 * HORA]] }))], '1h');
  assert.equal(r.puntos.length, 721);
  assert.deepEqual([r.puntos[0][0], r.puntos.at(-1)[0], r.fuera, r.largos, r.arrastre], ['2026-10-14T09:00Z', '2026-11-13T09:00Z', [], ['token-b'], 24]);
  // figure-heloc con sus huecos reales y otros 29 tokens que no fallan (15.210 M$ en total).
  const lectura = Date.parse('2026-11-13T14:22:00Z');
  const figure = horaria({ lectura, valor: ms => (ms < Date.parse('2026-11-02T13:00:00Z') ? 28320e6 : 26617e6), sin: HUECOS_FIGURE });
  const resto = horaria({ lectura, valor: () => 15210e6 });
  assert.equal(figure.length, 589, 'los mismos 589 datos que dio CoinGecko');
  const rf = construir([ent('figure-heloc', figure), ent('resto', resto)], '1h');
  assert.deepEqual([rf.puntos.length, rf.fuera, rf.largos], [721, [], ['figure-heloc']]);
  // En el hueco de 24 horas del fin de semana vale su último dato (el de las 13:00 del sábado) y luego, el nuevo.
  const en = iso => rf.puntos.find(p => p[0] === iso)[1];
  assert.equal(en('2026-11-02T12:00Z'), 28320e6 + 15210e6, 'arrastrado 23 horas');
  assert.equal(en('2026-11-02T13:00Z'), 26617e6 + 15210e6);
  // Con 5 minutos: su hueco real de esa mañana (de las 08:20 a las 11:55), arrastrado.
  const lectura5 = Date.parse('2026-11-13T14:30:09Z');
  const figure5 = cinco({ lectura: lectura5, valor: () => 26617e6, sin: [[Date.parse('2026-11-13T08:20:00Z') + 1, Date.parse('2026-11-13T11:55:00Z')]] });
  const r5 = construir([ent('figure-heloc', figure5), ent('resto', cinco({ lectura: lectura5, valor: () => 15210e6 }))], '5m');
  assert.deepEqual([r5.puntos.length, r5.fuera, r5.largos], [289, [], ['figure-heloc']]);
  assert.equal(t.urlHistoriaFina('ondo-us-dollar-yield', '1h'), 'https://api.coingecko.com/api/v3/coins/ondo-us-dollar-yield/market_chart?vs_currency=usd&days=31');
  assert.equal(t.urlHistoriaFina('ondo-us-dollar-yield', '5m'), 'https://api.coingecko.com/api/v3/coins/ondo-us-dollar-yield/market_chart?vs_currency=usd&days=1');
  assert.throws(() => t.urlHistoriaFina('../x', '5m'), /id de token no válido/);
  assert.deepEqual(t.observacionesToken([[3, 2e6], [1, null], [2, 1e6]]), [[2, 1e6], [3, 2e6]], 'en orden y sin valores raros');
  assert.throws(() => t.observacionesToken([[1, 2, 3]]), /punto de market_caps no válido/);
});

test('el archivo de la serie fina se valida entero (una línea por punto) y se rechaza lo mal formado', () => {
  const { fina } = par({ conC: true });
  const texto = t.serializarSerieFina(fina);
  assert.deepEqual(t.validarSerieFina(JSON.parse(texto)), fina);
  assert.equal(texto.split('\n').length, 3 + 289 + 721 + 1, 'una línea por punto (y la cabecera, el paso de una serie a otra y el cierre)');
  assert.ok(Buffer.byteLength(texto) < 48 * 1024, `ocupa ${(Buffer.byteLength(texto) / 1024).toFixed(1)} kB`);
  assert.deepEqual([fina.series['5m'].fuera, fina.series['5m'].valorFuera, fina.series['1h'].fuera], [['token-c'], 150e6, ['token-c']]);
  const vacia = t.serieFinaVacia(diaria({ valorFinal: 42e9 }));
  assert.deepEqual(vacia.series, { '5m': null, '1h': null });
  assert.equal(t.serieFinaValida(vacia), true, '«sin serie fina» también es válido');
  const cambia = (clave, cambio) => f => ({ ...f, series: { ...f.series, [clave]: { ...f.series[clave], ...cambio(f.series[clave]) } } });
  const puntos = (clave, cambio) => cambia(clave, x => ({ puntos: cambio(x.puntos) }));
  const mal = [
    f => ({ ...f, version: 2 }),
    f => ({ ...f, extra: 1 }),
    f => ({ ...f, generado: '13/11/2026' }),
    f => ({ ...f, tokens: ['token-a', 'token-a', 'token-c'] }),
    f => ({ ...f, series: { '5m': f.series['5m'] } }),
    cambia('5m', () => ({ paso: 60 })),
    cambia('1h', () => ({ arrastre: 25 })),
    cambia('5m', () => ({ arrastre: 289 })),
    cambia('5m', () => ({ largos: undefined })),
    // Los de fuera: tokens que no están, repetidos, también en «largos», sin su valor o con un valor que pesa más del 1 %.
    cambia('5m', () => ({ fuera: ['token-z'] })),
    cambia('5m', () => ({ fuera: ['token-c', 'token-c'] })),
    cambia('5m', () => ({ largos: ['token-c'] })),
    cambia('5m', () => ({ valorFuera: 0 })),
    cambia('5m', () => ({ valorFuera: 150.5e6 + 0.5 })),
    cambia('5m', () => ({ valorFuera: 1e9 })),
    cambia('5m', () => ({ fuera: [], valorFuera: 0 })),
    cambia('5m', () => ({ fuera: ['token-a', 'token-b', 'token-c'] })),
    // Una hora que no es la de un cubo (09:21 en la de 5 minutos), desordenadas, repetidas, con un hueco o mal escritas.
    puntos('5m', p => [...p.slice(0, -1), ['2026-11-13T09:21Z', 4e10, 2]]),
    puntos('5m', p => p.map(([iso, v, n]) => [t.isoMinuto(Date.parse(iso) + MIN), v, n])),
    puntos('5m', p => p.slice().reverse()),
    puntos('5m', p => [p[0], ...p]),
    puntos('5m', p => [...p.slice(0, 100), ...p.slice(101)]),
    puntos('5m', p => [['2026-11-12 09:20', 4e10, 2], ...p.slice(1)]),
    puntos('5m', p => [['2026-02-30T09:20Z', 4e10, 2], ...p.slice(1)]),
    // Valores y recuentos imposibles; el último punto tiene que sumar todos los de dentro.
    puntos('1h', p => [[p[0][0], 1.5, 2], ...p.slice(1)]),
    puntos('1h', p => [[p[0][0], 4e10, 3], ...p.slice(1)]),
    puntos('1h', p => [[p[0][0], 1e15, 2], ...p.slice(1)]),
    puntos('1h', p => [...p.slice(0, -1), [p.at(-1)[0], p.at(-1)[1], 1]]),
    // Más puntos o más tiempo del previsto, o un último punto que no es de cuando se generó.
    puntos('5m', p => [['2026-11-12T09:15Z', 4e10, 2], ...p]),
    puntos('1h', () => [...Array(801)].map((_, i) => [t.isoMinuto(LECTURA - (800 - i) * HORA - LECTURA % HORA), 4e10, 2])),
    f => ({ ...f, generado: '2026-11-13T12:30:00Z' }),
    f => ({ ...f, generado: '2026-11-13T09:00:00Z' }),
  ];
  for (const [i, cambio] of mal.entries()) assert.equal(t.serieFinaValida(cambio(fina)), false, `caso ${i}`);
  assert.equal(t.serieFinaValida(cambia('5m', () => ({ largos: ['token-a'] }))(fina)), true, 'un «largo» que está dentro, sí');
  assert.equal(t.serieFinaValida(null), false);
  assert.equal(t.msMinuto('2026-11-13T09:20Z'), Date.parse('2026-11-13T09:20:00Z'));
  assert.equal(t.msMinuto('2026-11-13T24:00Z'), null);
});

test('la fina solo se une a su diaria: la misma ejecución, los mismos tokens y el mismo último punto; si no, el gráfico sigue con la diaria', () => {
  const { d, fina } = par();
  const s = t.unirSerieFina(d, fina);
  assert.deepEqual(Object.keys(s.fina.series), ['5m', '1h']);
  assert.equal(t.serieValida(s), true, 'la serie unida sigue siendo una serie válida');
  assert.equal(t.serializarSerie(s), t.serializarSerie(d), 'el archivo de la diaria no cambia: la fina nunca se escribe dentro');
  assert.deepEqual(Object.keys(t.validarSerie(s)).includes('fina'), true);
  // Otra ejecución (otro «generado»): solo la diaria.
  const otra = t.unirSerieFina(diaria({ valorFinal: d.puntos.at(-1).valor, generado: '2026-11-13T06:40:00Z' }), fina);
  assert.equal(otra.fina, undefined);
  assert.equal(t.pestanaDisponible(otra, '1d'), false);
  assert.equal(t.graficoPestana(otra, '1m').resolucion, '1d');
  // Otros tokens, o un último valor distinto en más de un 0,1 %: fuera.
  assert.equal(t.unirSerieFina(diaria({ valorFinal: d.puntos.at(-1).valor, tokens: ['token-a', 'token-c'] }), fina).fina, undefined);
  assert.equal(t.unirSerieFina(diaria({ valorFinal: Math.round(d.puntos.at(-1).valor * 1.002) }), fina).fina, undefined);
  assert.ok(t.unirSerieFina(diaria({ valorFinal: Math.round(d.puntos.at(-1).valor * 1.0009) }), fina).fina, 'un 0,09 % de redondeo, sí');
  // Solo una de las dos casa: se une esa.
  const soloHoraria = { ...fina, series: { ...fina.series, '5m': { ...fina.series['5m'], puntos: fina.series['5m'].puntos.map((p, i, a) => (i === a.length - 1 ? [p[0], p[1] + 1e9, p[2]] : p)) } } };
  assert.deepEqual(Object.keys(t.unirSerieFina(d, soloHoraria).fina.series), ['1h']);
  // Una fina rota o ausente: la diaria tal cual, sin errores.
  assert.deepEqual(t.unirSerieFina(d, { roto: true }), d);
  assert.deepEqual(t.unirSerieFina(d, null), d);
  assert.equal(t.unirSerieFina({ version: 9 }, fina), null);
  // Una «fina» puesta a mano (sin pasar por unirSerieFina) no vale: la serie entera no es válida.
  assert.equal(t.serieValida({ ...d, fina: s.fina.series }), false);
  assert.equal(t.serieValida({ ...d, generado: '2026-11-13T09:22:06Z', fina: s.fina }), false, 'la fina es de su diaria');
});

test('con un token fuera de las finas: casan con la diaria sumando lo que vale, la cifra grande es la de todos y cada pestaña fina dice por qué acaba más abajo', () => {
  const { d, fina } = par({ conC: true });
  const s = t.unirSerieFina(d, fina);
  assert.deepEqual(Object.keys(s.fina.series), ['5m', '1h'], 'las dos casan: su último punto más 150 M$ es el de la diaria');
  const u = d.puntos.at(-1).valor;
  assert.deepEqual(t.cifraGrande(s, null), { valor: u, fecha: '2026-11-13', t: '2026-11-13T09:20Z', fuente: 'serie' }, 'la cifra grande, la de los 3');
  const g24 = t.graficoPestana(s, '1d'), g1m = t.graficoPestana(s, '1m'), g1a = t.graficoPestana(s, '1a');
  assert.equal(g24.estadisticas.fin, u - 150e6, '24 h acaba 150 M$ por debajo');
  assert.equal(g1m.estadisticas.fin, u - 150e6);
  assert.equal(g1a.estadisticas.fin, u, '1 A (la diaria) acaba en la cifra grande');
  assert.deepEqual(g24.fuera, { tokens: ['token-c'], valor: 150e6 });
  const m = t.millones(150e6);
  assert.equal(g24.avisoFuera, `la línea suma 2 de los 3: queda fuera 1 token sin datos de CoinGecko en este periodo (${m}), así que acaba ${m} por debajo de la cifra grande`);
  assert.equal(t.graficoPestana(s, '1d', 'en').avisoFuera, 'the line adds up 2 of the 3: 1 token is left out for lack of CoinGecko data in this period ($150M), so it ends $150M below the big figure');
  assert.equal(g24.alcance, 'suma de 2 de los 3 mayores');
  assert.match(g24.etiqueta, /La línea suma 2 de los 3: .+\.$/);
  assert.deepEqual([g1a.fuera, g1a.avisoFuera, g1a.alcance], [null, '', 'suma de los 3 mayores']);
  assert.ok(t.notaSerie(s, 'es', '1d').endsWith(`(si no tiene, el anterior, como mucho de 24 horas antes). La línea suma 2 de los 3: queda fuera 1 token sin datos de CoinGecko en este periodo (${m}), así que acaba ${m} por debajo de la cifra grande.`));
  assert.equal(t.entranAMitad(s, '1d'), 0, 'el de fuera no «entra a mitad»');
  assert.equal(t.graficoPestana(s, '1d').avisoTokens, '');
  // El cambio en 24 h, de los que suma la línea (los mismos al principio y al final).
  assert.equal(t.cambio24h(s, null).cambio, g24.estadisticas.cambio);
  // Con un «valorFuera» que no es lo que suman, no casa (falta un 0,36 %): el gráfico usa la diaria.
  const sinValor = { ...fina, series: { '5m': { ...fina.series['5m'], valorFuera: 1 }, '1h': null } };
  assert.equal(t.serieFinaValida(sinValor), true);
  assert.equal(t.unirSerieFina(d, sinValor).fina, undefined);
  // Y sin decir quién queda fuera, el archivo no vale: su último punto no suma los 3.
  assert.equal(t.serieFinaValida({ ...fina, series: { ...fina.series, '5m': { ...fina.series['5m'], fuera: [], valorFuera: 0 } } }), false);
});

test('cada pestaña, de la serie más fina que la cubre: 24 h cada 5 minutos, 1 S y 1 M cada hora, el resto la diaria; todas acaban en la cifra grande', () => {
  const { d, fina } = par();
  const s = t.unirSerieFina(d, fina);
  const res = Object.fromEntries(t.PESTANAS.map(p => [p.clave, t.seriePestana(s, p.clave)]));
  assert.deepEqual(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, [v.resolucion, v.puntos.length]])),
    { '1d': ['5m', 289], '1s': ['1h', 169], '1m': ['1h', 721], '3m': ['1d', 92], '6m': ['1d', 183], ytd: ['1d', 317], '1a': ['1d', 365] });
  assert.deepEqual(t.PESTANAS.map(p => t.pestanaDisponible(s, p.clave)), t.PESTANAS.map(() => true));
  const cifra = t.cifraGrande(s, null);
  assert.deepEqual(cifra, { valor: d.puntos.at(-1).valor, fecha: '2026-11-13', t: '2026-11-13T09:20Z', fuente: 'serie' });
  for (const p of t.PESTANAS) {
    const g = t.graficoPestana(s, p.clave);
    assert.equal(g.estadisticas.fin, cifra.valor, `${p.clave}: la línea acaba en la cifra grande`);
    assert.ok(g.estadisticas.max.valor >= cifra.valor && g.estadisticas.min.valor <= cifra.valor, p.clave);
    assert.equal(g.resolucion, res[p.clave].resolucion);
    assert.equal(g.pasoMs, { '5m': 5 * MIN, '1h': HORA, '1d': DIA }[g.resolucion]);
    assert.deepEqual(t.tramosSeguidos(g), [[0, g.puntos.length - 1]], `${p.clave}: sin cortes`);
  }
  // El cambio de cada pestaña sale de su serie: 24 h, del primer al último punto de 5 minutos.
  const g24 = t.graficoPestana(s, '1d');
  const c24 = t.cambio24h(s, { total: { cambio24h: 124 } });
  assert.deepEqual(c24, { cambio: g24.estadisticas.cambio, fuente: 'serie', desde: '2026-11-12', hasta: '2026-11-13', desdeT: '2026-11-12T09:20Z', hastaT: '2026-11-13T09:20Z', resolucion: '5m' });
  assert.equal(g24.cambioFrase, 'en las últimas 24 horas');
  assert.equal(t.graficoPestana(s, '1d', 'en').cambioFrase, 'past 24 hours');
  assert.equal(t.graficoPestana(s, '1s').estadisticas.desdeT, '2026-11-06T09:00Z', '1 S: de la misma hora de hace 7 días');
  // Sin la fina, como antes: 24 h desactivada y el cambio en 24 h de los dos últimos días de la diaria.
  assert.equal(t.seriePestana(d, '1d'), null);
  assert.equal(t.cambio24h(d, null).fuente, 'serie');
  assert.equal(t.cambio24h(d, null).resolucion, undefined);
  assert.deepEqual(t.cifraGrande(d, null), { valor: d.puntos.at(-1).valor, fecha: '2026-11-13', fuente: 'serie' });
  // Sin la de 5 minutos ese día: 24 h sale de la horaria (25 puntos, no la raya de dos de la diaria) y su cambio también.
  const soloHoraria = t.unirSerieFina(d, { ...fina, series: { ...fina.series, '5m': null } });
  assert.deepEqual([t.seriePestana(soloHoraria, '1d').resolucion, t.seriePestana(soloHoraria, '1d').puntos.length], ['1h', 25]);
  assert.equal(t.cambio24h(soloHoraria, null).resolucion, '1h');
  assert.deepEqual(t.cifraGrande(soloHoraria, null), { valor: d.puntos.at(-1).valor, fecha: '2026-11-13', t: '2026-11-13T09:00Z', fuente: 'serie' });
  assert.match(t.notaSerie(soloHoraria, 'es', '1d'), /un punto cada hora/);
  // Una horaria de solo 10 días (como saldría si todos los tokens fueran nuevos): 1 S sigue siendo horaria; 1 M vuelve a la diaria (no la cubre).
  const corta = { ...fina, series: { ...fina.series, '1h': { ...fina.series['1h'], puntos: fina.series['1h'].puntos.slice(-241) } } };
  assert.equal(t.serieFinaValida(corta), true);
  const sc = t.unirSerieFina(d, corta);
  assert.equal(t.seriePestana(sc, '1s').resolucion, '1h');
  assert.equal(t.seriePestana(sc, '1m').resolucion, '1d');
  assert.equal(t.seriePestana(sc, 'nada'), null);
  assert.equal(t.seriePestana({ version: 2 }, '1m'), null);
});

test('la hora de España (sin Intl): UTC+1 en invierno, UTC+2 en verano y el cambio de hora a la 01:00 UTC del último domingo', () => {
  const h = iso => t.horaEspana(Date.parse(iso));
  assert.deepEqual(h('2026-11-13T09:20:00Z'), { fecha: '2026-11-13', hora: '10:20' });
  assert.deepEqual(h('2026-11-13T23:30:00Z'), { fecha: '2026-11-14', hora: '00:30' }, 'pasada la medianoche, ya es el día siguiente');
  assert.deepEqual(h('2026-07-01T12:00:00Z'), { fecha: '2026-07-01', hora: '14:00' });
  assert.deepEqual(h('2026-03-29T00:59:00Z'), { fecha: '2026-03-29', hora: '01:59' });
  assert.deepEqual(h('2026-03-29T01:00:00Z'), { fecha: '2026-03-29', hora: '03:00' });
  assert.deepEqual(h('2026-10-25T00:59:00Z'), { fecha: '2026-10-25', hora: '02:59' });
  assert.deepEqual(h('2026-10-25T01:00:00Z'), { fecha: '2026-10-25', hora: '02:00' });
  assert.deepEqual(h('2027-03-28T01:00:00Z'), { fecha: '2027-03-28', hora: '03:00' });
  assert.deepEqual(h('2027-10-31T00:30:00Z'), { fecha: '2027-10-31', hora: '02:30' });
});

test('el eje y la cruz: 24 h con horas (HH:MM, hora de España), 1 S con días y la cruz con día y hora, 1 M con días; en inglés, igual', () => {
  const { d, fina } = par();
  const s = t.unirSerieFina(d, fina);
  const g24 = t.graficoPestana(s, '1d'), g7 = t.graficoPestana(s, '1s'), g30 = t.graficoPestana(s, '1m'), g1a = t.graficoPestana(s, '1a');
  // 24 h: de las 10:20 de ayer a las 10:20 de hoy (hora de España): cada 6 horas.
  assert.deepEqual(g24.marcasFechas.map(m => m.texto), ['12:00', '18:00', '00:00', '06:00']);
  assert.ok(g24.marcasFechas.every(m => g24.puntos[m.indice].t === m.t && t.textoInstante(g24.puntos[m.indice], 'es', '5m') === m.texto));
  // 1 S: medianoches de España, una cada dos días; 1 M: una cada semana.
  assert.deepEqual(g7.marcasFechas.map(m => m.texto), ['7 nov', '9 nov', '11 nov', '13 nov']);
  assert.deepEqual(t.graficoPestana(s, '1s', 'en').marcasFechas.map(m => m.texto), ['7 Nov', '9 Nov', '11 Nov', '13 Nov']);
  assert.ok(g7.marcasFechas.every(m => t.horaEspana(g7.puntos[m.indice].ms).hora === '00:00'), 'a las 00:00 de España');
  assert.deepEqual(g30.marcasFechas.map(m => m.texto), ['15 oct', '22 oct', '29 oct', '5 nov', '12 nov']);
  assert.ok(g1a.marcasFechas.every(m => /^[a-z]{3}( \d{4})?$/.test(m.texto)), '1 A: meses, como antes');
  for (const g of [g24, g7, g30]) assert.ok(g.marcasFechas.length >= 2 && g.marcasFechas.length <= 5, g.clave);
  // La cruz: la hora en 24 h; el día y la hora en las horarias; con «largo», la fecha entera y «hora de España».
  const p = g24.puntos.at(-1), q = g7.puntos[0];
  assert.equal(t.textoInstante(p, 'es', '5m'), '10:20');
  assert.equal(t.textoInstante(q, 'es', '1h'), '6 nov, 10:00');
  assert.equal(t.textoInstante(q, 'en', '1h'), '6 Nov, 10:00');
  assert.equal(t.textoInstante(p, 'es', '5m', { largo: true }), '13/11/2026, 10:20 (hora de España)');
  assert.equal(t.textoInstante(p, 'en', '5m', { largo: true }), '13 Nov 2026, 10:20 (Spain time)');
  assert.equal(t.textoInstante(d.puntos.at(-1), 'es'), '13/11/2026', 'un punto diario: su fecha');
  // La etiqueta accesible del gráfico y la cabecera, con la hora.
  assert.match(g24.etiqueta, /^Suma de los 2 mayores tokens, últimas 24 horas: de .+ \(12\/11\/2026, 10:20 \(hora de España\)\) a .+ \(13\/11\/2026, 10:20 \(hora de España\)\), /);
  assert.equal(t.subtituloCifra(s), 'Suma de los 2 mayores tokens con historia completa · 13/11/2026, 10:20');
  assert.equal(t.subtituloCifra(s, 'en'), 'Sum of the 2 largest tokens with a complete history · 13 Nov 2026, 10:20');
  assert.equal(t.subtituloCifra(d), 'Suma de los 2 mayores tokens con historia completa · 13/11/2026', 'sin la fina, como antes');
  // «Cómo se calcula» dice cómo se suma cada punto en las pestañas finas; en las diarias, como antes.
  assert.match(t.notaSerie(s, 'es', '1d'), /En esta pestaña, un punto cada 5 minutos, en hora de España peninsular: el último dato de cada token en esos 5 minutos \(si no tiene, el anterior, como mucho de 24 horas antes\)\.$/);
  assert.match(t.notaSerie(s, 'es', '1m'), /un punto cada hora, en hora de España peninsular: el último dato de cada token en esa hora \(si no tiene, el anterior, como mucho de 24 horas antes\)\.$/);
  assert.match(t.notaSerie(s, 'en', '1d'), /In this tab, one point every 5 minutes, in Spain \(mainland\) time/);
  assert.equal(t.notaSerie(s, 'es', '1a'), t.notaSerie(d, 'es', '1a'));
});

test('720 puntos sin tirones: para pintar, como mucho dos por columna de píxel, sin perder el máximo ni el mínimo; la cruz busca en todos', () => {
  const { d, fina } = par();
  const s = t.unirSerieFina(d, fina);
  const g = t.graficoPestana(s, '1m');
  const c = t.coordenadas(g, 150, 100);
  const indices = t.indicesPintar(c, 0, c.length - 1);
  assert.ok(indices.length <= 2 * 151 + 2 && indices.length < c.length, `${indices.length} de ${c.length}`);
  const ys = c.map(p => p.y), elegidos = indices.map(i => c[i].y);
  assert.equal(Math.min(...elegidos), Math.min(...ys), 'el máximo (y más pequeña) se pinta');
  assert.equal(Math.max(...elegidos), Math.max(...ys), 'el mínimo se pinta');
  assert.deepEqual([indices[0], indices.at(-1)], [0, c.length - 1]);
  assert.ok(indices.every((v, i) => i === 0 || v > indices[i - 1]), 'en orden');
  const { linea, area } = t.trazosSvg(c, t.tramosSeguidos(g), 100);
  assert.equal((linea.match(/[ML]/g) || []).length, indices.length);
  assert.equal((area.match(/[ML]/g) || []).length, indices.length + 2);
  // A todo el ancho (720 px o más), ninguno se quita; con la diaria tampoco.
  assert.equal(t.indicesPintar(t.coordenadas(g, 800, 100), 0, c.length - 1).length, c.length);
  const gd = t.graficoPestana(d, '1a'), cd = t.coordenadas(gd, 300, 100);
  assert.equal(t.indicesPintar(cd, 0, cd.length - 1).length, cd.length);
  // La cruz: la misma respuesta que mirar uno a uno.
  const lineal = x => c.reduce((m, p, i) => (Math.abs(p.x - x) < Math.abs(c[m].x - x) ? i : m), 0);
  for (const x of [-5, 0, 0.1, 13.37, 74.9, 75, 149.99, 150, 400]) assert.equal(t.indiceCercano(c, x), lineal(x), `x = ${x}`);
  assert.equal(t.indiceCercano([], 3), 0);
});

/* ---- La app lee /datos/tokenizacion-serie-fina.json ---- */
function cargarLib(ruta, mocks) {
  const nombre = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), { filename: nombre, babelrc: false, configFile: false, plugins: [commonjs] }).code;
  const salida = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(salida, salida.exports, (dep) => {
    if (Object.hasOwn(mocks, dep)) return mocks[dep];
    throw new Error(`Dependencia inesperada: ${dep}`);
  });
  return salida.exports;
}

test('la app lee https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json sin cookies, la reutiliza 30 minutos y, si falla, sigue con la diaria', async () => {
  const remota = cargarLib('lib/tokenizacion-serie-remota.js', { './tokenizacion': t });
  const { d, fina } = par();
  const textos = { 'https://rwadar.pages.dev/datos/tokenizacion-serie.json': t.serializarSerie(d), 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json': t.serializarSerieFina(fina) };
  const llamadas = [];
  const responde = (estado = {}) => async (url, init) => {
    llamadas.push([url, init]);
    const status = estado[url] ?? 200;
    return { ok: status === 200, status, text: async () => (typeof status === 'string' ? status : textos[url]) };
  };
  remota.olvidarSerie(); remota.olvidarSerieFina();
  let ahora = Date.parse('2026-11-13T12:00:00Z');
  assert.deepEqual(await remota.cargarSerieFina({ fetchImpl: responde(), ahora: () => ahora }), fina);
  assert.equal(llamadas[0][0], 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json');
  assert.equal(llamadas[0][1].credentials, 'omit');
  ahora += 29 * MIN;
  await remota.cargarSerieFina({ fetchImpl: responde(), ahora: () => ahora });
  assert.equal(llamadas.length, 1, 'dentro de 30 minutos no vuelve a preguntar');
  // Nunca lanza: 404 (una web aún sin publicar), forma rara o demasiado grande → null.
  for (const estado of [{ 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json': 404 }]) {
    remota.olvidarSerieFina();
    assert.equal(await remota.cargarSerieFina({ fetchImpl: responde(estado) }), null);
  }
  for (const cuerpo of ['{"version":1}', '<!doctype html>', 'x'.repeat(300 * 1024)]) {
    remota.olvidarSerieFina();
    assert.equal(await remota.cargarSerieFina({ fetchImpl: async () => ({ ok: true, status: 200, text: async () => cuerpo }) }), null, cuerpo.slice(0, 15));
  }
  remota.olvidarSerieFina();
  assert.equal(await remota.cargarSerieFina({ fetchImpl: async () => { throw new TypeError('sin red'); } }), null);
  // Las dos juntas: la serie unida; sin la fina, la diaria tal cual; sin la diaria, el error de siempre.
  remota.olvidarSerie(); remota.olvidarSerieFina();
  const unida = await remota.cargarSerieConFina({ fetchImpl: responde() });
  assert.deepEqual(Object.keys(unida.fina.series), ['5m', '1h']);
  assert.equal(t.graficoPestana(unida, '1d').resolucion, '5m');
  remota.olvidarSerie(); remota.olvidarSerieFina();
  assert.deepEqual(await remota.cargarSerieConFina({ fetchImpl: responde({ 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json': 404 }) }), d);
  remota.olvidarSerie(); remota.olvidarSerieFina();
  await assert.rejects(remota.cargarSerieConFina({ fetchImpl: responde({ 'https://rwadar.pages.dev/datos/tokenizacion-serie.json': 503 }) }), /serie_http_503/);
  remota.olvidarSerie(); remota.olvidarSerieFina();
});
