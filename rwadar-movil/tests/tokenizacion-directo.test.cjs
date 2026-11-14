'use strict';

/* El gráfico en directo (14/11/2026, migración 35): del documento compacto
   de la base al formato de tokenizacion-serie-fina.json (validado con el
   validador de siempre), la unión con la diaria publicada (unirDirecto), la
   edad medida con el reloj del servidor, el aviso y la nota. Con los datos
   reales del 13/11 (prueba-serie y prueba-serie-fina del flujo diario),
   puestos en la forma que sirve el directo. Sin red. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const t = require('../lib/tokenizacion');

const MIN = 60000, HORA = 3600000, DIA = 86400000;
const DATOS = path.resolve(__dirname, '../../rwadar-app/tokenizacion');
const DIARIA = require(path.join(DATOS, 'prueba-serie-20261113.json'));
const FINA = require(path.join(DATOS, 'prueba-serie-fina-20261113.json'));
const copia = x => JSON.parse(JSON.stringify(x));

/* Una serie del formato de hoy en compacto (lo que guarda la base). */
function compacta(x, sinLectura = []) {
  if (!x) return null;
  const n = [];
  for (const p of x.puntos) { if (n.length && n[n.length - 1][1] === p[2]) n[n.length - 1][0]++; else n.push([1, p[2]]); }
  return { desde: x.puntos[0][0], arrastre: x.arrastre, fuera: x.fuera, valorFuera: x.valorFuera, largos: x.largos, valores: x.puntos.map(p => p[1]), n, sinLectura };
}
function documento(fina = FINA, { generado = fina.generado, diaria = DIARIA.generado, diariaLeida = '2026-11-13T15:05:00Z', sinLectura = {} } = {}) {
  return { v: 1, generado, diaria, diariaLeida, tokens: fina.tokens.slice(),
    series: { '5m': compacta(fina.series['5m'], sinLectura['5m']), '1h': compacta(fina.series['1h'], sinLectura['1h']) } };
}
/* Lo que sirve /api/tokenizacion/directo. */
const servido = (doc = documento()) => { const d = t.directoAFina(doc); return { version: 1, fina: d.fina, sinLectura: d.sinLectura }; };
const unir = (diaria = DIARIA, directo = servido(), edadMs = 4 * MIN) => t.unirDirecto(diaria, directo, { edadMs });
/* La diaria publicada «dias» días antes: sin los últimos días y con su
   último punto igual al de la horaria del directo en la hora de su «generado». */
function diariaDe(dias, { costura = 0 } = {}) {
  const d = copia(DIARIA);
  const g = Date.parse(d.generado) - dias * DIA;
  d.generado = new Date(g).toISOString().replace(/\.\d{3}Z$/, 'Z');
  d.puntos = d.puntos.filter(p => p.fecha <= d.generado.slice(0, 10));
  const h = FINA.series['1h'].puntos.find(p => t.msMinuto(p[0]) === Math.floor(g / HORA) * HORA);
  // El directo se separa de la diaria un «costura» (directo / diaria − 1).
  d.puntos[d.puntos.length - 1].valor = Math.round(h[1] / (1 + costura));
  return d;
}

test('directoAFina: el documento compacto da exactamente la fina publicada y pasa el validador de siempre', () => {
  const d = t.directoAFina(documento());
  assert.deepEqual(d.fina, t.validarSerieFina(FINA));
  assert.deepEqual(d.sinLectura, { '5m': [], '1h': [] });
  assert.ok(JSON.stringify(documento()).length < JSON.stringify(FINA).length / 2.5, 'el compacto ocupa menos de la mitad');
  const con = t.directoAFina(documento(FINA, { sinLectura: { '5m': [['2026-11-13T10:00Z', '2026-11-13T11:55Z']] } }));
  assert.deepEqual(con.sinLectura['5m'], [['2026-11-13T10:00Z', '2026-11-13T11:55Z']]);
});

test('directoAFina: cualquier forma rota lanza', () => {
  const rotos = {
    'clave de más': d => { d.otra = 1; },
    'sin diariaLeida': d => { delete d.diariaLeida; },
    'v 2': d => { d.v = 2; },
    'generado sin segundos': d => { d.generado = '2026-11-13T15:10Z'; },
    'desde no alineado': d => { d.series['5m'].desde = '2026-11-12T15:07Z'; },
    'valor con decimales': d => { d.series['5m'].valores[3] += 0.5; },
    'valor negativo': d => { d.series['5m'].valores[3] = -1; },
    'tramos que no cuadran': d => { d.series['5m'].n[0][0] += 1; },
    'más puntos de la cuenta': d => { const x = d.series['5m']; x.valores = Array(301).fill(x.valores[0]); x.n = [[301, 30]]; },
    'tokens no válidos': d => { d.tokens[0] = 'Figure Heloc'; },
    'sinLectura desalineado': d => { d.series['5m'].sinLectura = [['2026-11-13T10:01Z', '2026-11-13T10:05Z']]; },
    'sinLectura al revés': d => { d.series['1h'].sinLectura = [['2026-11-13T10:00Z', '2026-11-13T09:00Z']]; },
    'serie sin sinLectura': d => { delete d.series['1h'].sinLectura; },
    'el último punto no es del generado': d => { d.generado = '2026-11-13T19:10:06Z'; },
  };
  for (const [nombre, romper] of Object.entries(rotos)) {
    const d = documento();
    romper(d);
    assert.throws(() => t.directoAFina(d), undefined, nombre);
  }
  assert.throws(() => t.validarDirecto({ version: 1, fina: FINA }), /forma/);
  assert.throws(() => t.validarDirecto({ version: 1, fina: FINA, sinLectura: { '5m': [] } }), /sin lectura/);
});

test('unirDirecto: con el directo bien, la serie del directo; la cifra grande y el final de cada pestaña son ultimo', () => {
  const r = unir();
  assert.equal(r.motivo, null);
  const s = r.serie;
  assert.equal(t.esDirecto(s), true);
  assert.equal(s.generado, FINA.generado);
  const u = s.fina.ultimo;
  assert.deepEqual([u.t, u.valor, u.fecha], ['2026-11-13T15:05Z', 41815579529, '2026-11-13']);
  const cifra = t.cifraGrande(s, null);
  assert.equal(cifra.valor, u.valor);
  assert.equal(cifra.t, u.t);
  for (const p of t.PESTANAS) {
    const e = t.seriePestana(s, p.clave);
    assert.ok(e, p.clave);
    const ultimo = e.puntos[e.puntos.length - 1];
    assert.equal(ultimo.valor + e.valorFuera, cifra.valor, `${p.clave}: el final de la línea más los de fuera es la cifra grande`);
  }
  assert.equal(t.seriePestana(s, '1d').resolucion, '5m');
  assert.equal(t.cambio24h(s, null).resolucion, '5m');
  assert.equal(t.seriePestana(s, '1d').origen, 'directo');
});

test('unirDirecto: lo que no se puede usar, con su motivo (y la regla de hoy, unirSerieFina, sigue igual)', () => {
  // Tokens distintos: no casa (minutos tras publicar otra lista).
  const otra = copia(FINA); otra.tokens[29] = 'otro-token';
  for (const c of ['5m', '1h']) for (const k of ['fuera', 'largos']) otra.series[c][k] = otra.series[c][k].filter(x => otra.tokens.includes(x));
  assert.equal(unir(DIARIA, servido(documento(otra))).motivo, 'no_casa');
  // La diaria más nueva que el directo: no casa.
  const nueva = copia(DIARIA); nueva.generado = '2026-11-13T15:20:00Z';
  assert.equal(unir(nueva).motivo, 'no_casa');
  // Edad: 20 min sí, 21 no; 5 min del futuro sí, 6 no; sin edad, no.
  assert.equal(unir(DIARIA, servido(), 20 * MIN).motivo, null);
  assert.equal(unir(DIARIA, servido(), 21 * MIN).motivo, 'atrasado');
  assert.equal(unir(DIARIA, servido(), -5 * MIN).motivo, null);
  assert.equal(unir(DIARIA, servido(), -6 * MIN).motivo, 'atrasado');
  assert.equal(unir(DIARIA, servido(), NaN).motivo, 'atrasado');
  // Rotos.
  assert.equal(unir({ ...DIARIA, version: 2 }).motivo, 'no_valido');
  assert.equal(unir(DIARIA, { version: 1, fina: FINA, sinLectura: {} }).motivo, 'no_valido');
  const vacia = copia(FINA); vacia.series = { '5m': null, '1h': null };
  assert.equal(unir(DIARIA, { version: 1, fina: vacia, sinLectura: { '5m': [], '1h': [] } }).motivo, 'no_valido');
  // La regla de hoy no cambia: la fina publicada se une como siempre.
  assert.ok(t.unirSerieFina(DIARIA, FINA).fina);
  assert.equal(t.esDirecto(t.unirSerieFina(DIARIA, FINA)), false);
});

test('unirDirecto: freno del 25 % y costura del 5 % (en la de 5 minutos y en la horaria)', () => {
  const conDiaria = (factor, dias = 0) => {
    const d = dias ? diariaDe(dias, { costura: factor }) : copia(DIARIA);
    if (!dias) d.puntos[d.puntos.length - 1].valor = Math.round(d.puntos[d.puntos.length - 1].valor / (1 + factor));
    return unir(d).motivo;
  };
  assert.equal(conDiaria(0.049), null, '5m: 4,9 % sí');
  assert.equal(conDiaria(0.051), 'costura', '5m: 5,1 % no');
  assert.equal(conDiaria(-0.051), 'costura');
  assert.equal(conDiaria(0.049, 3), null, 'horaria (diaria de hace 3 días): 4,9 % sí');
  assert.equal(conDiaria(0.051, 3), 'costura', 'horaria: 5,1 % no');
  assert.equal(conDiaria(0.3), 'costura', 'el freno del 25 %');
  // Una diaria de hace más de 30 días: no hay costura que mirar.
  assert.equal(unir(diariaDe(29)).motivo, null);
  const vieja = copia(DIARIA); vieja.generado = '2026-10-01T10:00:00Z'; vieja.puntos = vieja.puntos.filter(p => p.fecha <= '2026-10-01');
  assert.equal(unir(vieja).motivo, 'costura');
});

test('unirDirecto: los días desde la diaria hasta hoy salen de la horaria del directo (cubo de las 23:00 UTC del día anterior + valorFuera)', () => {
  const h = FINA.series['1h'];
  const del23 = fecha => h.puntos.find(p => p[0] === t.fechaDe(t.msMinuto(fecha + 'T00:00Z') - DIA) + 'T23:00Z');
  for (const dias of [1, 3, 10]) {
    const d = diariaDe(dias);
    const r = unir(d);
    assert.equal(r.motivo, null, `${dias} días`);
    const p = r.serie.puntos;
    assert.equal(p[p.length - 1].fecha, '2026-11-13');
    assert.equal(p[p.length - 1].valor, 41815579529);
    const fechas = p.map(x => x.fecha);
    for (let k = 0; k <= dias; k++) assert.ok(fechas.includes(t.fechaDe(t.msMinuto('2026-11-13T00:00Z') - k * DIA)), `${dias} días: está el ${k}`);
    // Cada día pasado desde el último de la diaria (incluido el suyo): el cubo de las 23:00 del anterior.
    for (let k = 1; k <= dias; k++) {
      const f = t.fechaDe(t.msMinuto('2026-11-13T00:00Z') - k * DIA);
      const q = p.find(x => x.fecha === f);
      assert.equal(q.valor, del23(f)[1] + h.valorFuera, `${dias} días: el ${f}`);
    }
    assert.ok(p.length <= t.SERIE.maxPuntos);
    assert.ok(p[0].fecha >= t.fechaDe(t.msMinuto('2026-11-13T00:00Z') - 365 * DIA));
  }
  // Sin horaria (ese día no salió): el último punto de la diaria se queda como estaba; con una
  // diaria de hace 3 días tampoco hay costura que mirar (la de 5 minutos solo cubre 24 h).
  const sin = copia(FINA); sin.series['1h'] = null;
  const d1 = diariaDe(1), r = unir(d1, servido(documento(sin)));
  assert.equal(r.motivo, null);
  assert.deepEqual(r.serie.puntos.find(x => x.fecha === '2026-11-12'), d1.puntos[d1.puntos.length - 1]);
  assert.equal(r.serie.puntos.at(-1).valor, 41815579529);
  assert.equal(unir(diariaDe(3), servido(documento(sin))).motivo, 'costura');
});

test('unirDirecto: «hoy» es el día UTC del último dato, nunca la hora del aparato (23:58, 00:01, 00:06 UTC)', () => {
  // Un directo cuyo último punto es de las 23:55 del 13/11 y su generado de las 23:58.
  const f = copia(FINA);
  const desplaza = ms => (8 * HORA + 50 * MIN) + ms;
  for (const c of ['5m', '1h']) f.series[c].puntos = f.series[c].puntos.map(([iso, v, n]) => [t.isoMinuto(desplaza(t.msMinuto(iso))), v, n]);
  f.series['1h'].puntos = f.series['1h'].puntos.map(([iso, v, n]) => [iso.slice(0, 14) + '00Z', v, n]);
  f.generado = '2026-11-13T23:58:00Z';
  const d = copia(DIARIA); d.generado = '2026-11-13T23:40:00Z';
  d.puntos[d.puntos.length - 1].valor = f.series['5m'].puntos.find(p => p[0] === '2026-11-13T23:40Z')[1];
  const r = unir(d, servido(documento(f)), 3 * MIN);
  assert.equal(r.motivo, null);
  assert.equal(r.serie.puntos[r.serie.puntos.length - 1].fecha, '2026-11-13');
  assert.equal(r.serie.generado, '2026-11-13T23:58:00Z');
  // A las 00:01 y 00:06 UTC (6 y 8 minutos de edad), lo mismo: el día es el del dato.
  for (const edad of [3, 8]) assert.equal(unir(d, servido(documento(f)), edad * MIN).serie.puntos.at(-1).fecha, '2026-11-13');
});

test('edad del directo: con la cabecera Date del servidor (el reloj del móvil no importa); sin ella, el del aparato', () => {
  const generado = '2026-11-13T15:10:06Z';
  const servidor = 'Fri, 13 Nov 2026 15:14:06 GMT';
  for (const desfase of [-2 * HORA, 0, 2 * HORA]) {
    const ahora = Date.parse('2026-11-13T15:14:06Z') + desfase;
    assert.equal(t.edadDirecto({ generado, fechaServidor: servidor, transcurrido: 30000, ahora }), 4 * MIN + 30000);
  }
  assert.equal(t.edadDirecto({ generado, fechaServidor: null, ahora: Date.parse('2026-11-13T17:14:06Z') }), 2 * HORA + 4 * MIN);
  assert.ok(Number.isNaN(t.edadDirecto({ generado: 'ayer' })));
  // Un móvil que duerme 1 hora: performance.now() no avanza, Date.now() sí → cuenta la hora.
  assert.equal(t.transcurridoMs({ perf0: 1000, perf1: 1500, fecha0: 0, fecha1: HORA }), HORA);
  // Si alguien atrasa la hora del móvil, vale el reloj monótono.
  assert.equal(t.transcurridoMs({ perf0: 1000, perf1: 61000, fecha0: HORA, fecha1: 0 }), 60000);
});

test('avisoDirecto: solo con el directo encendido y fallando; nunca con apagado ni con no_casa', () => {
  const publicada = t.unirSerieFina(DIARIA, FINA), sola = t.validarSerie(DIARIA);
  for (const m of ['no_responde', 'atrasado', 'no_valido', 'sin_datos', 'costura', 'red']) {
    assert.equal(t.avisoDirecto(m, publicada), 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, con datos hasta el 13/11/2026, 16:05 (hora de España).', m);
  }
  assert.equal(t.avisoDirecto('atrasado', publicada, 'en'), 'Live data can’t be used right now: the chart uses the last published copy, with data up to 13 Nov 2026, 16:05 (Spain time).');
  assert.equal(t.avisoDirecto('red', sola), 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, día a día.');
  for (const m of ['apagado', 'no_casa', null, undefined]) assert.equal(t.avisoDirecto(m, publicada), '');
  // Lo que dice el servidor.
  assert.equal(t.motivoDirecto(404, { error: 'directo_apagado' }), 'apagado');
  assert.equal(t.motivoDirecto(404, { error: 'ruta_no_permitida' }), 'red');
  assert.equal(t.motivoDirecto(503, { error: 'directo_no_casa' }), 'no_casa');
  assert.equal(t.motivoDirecto(503, { error: 'directo_atrasado' }), 'atrasado');
  assert.equal(t.motivoDirecto(503, { error: 'otro' }), 'red');
  assert.equal(t.motivoDirecto(500, null), 'red');
});

test('notaFina con el directo: «Se pide a CoinGecko cada 5 minutos» y los ratos sin lectura del propio directo', () => {
  const r = unir(DIARIA, servido(documento(FINA, { sinLectura: { '5m': [['2026-11-13T10:00Z', '2026-11-13T11:55Z']], '1h': [] } })));
  const nota = t.notaSerie(r.serie, 'es', '1d');
  assert.match(nota, /Se pide a CoinGecko cada 5 minutos\. El directo no pudo leer del 13\/11\/2026, 11:00 al 13\/11\/2026, 13:00 \(hora de España\): ahí se repite el último dato\./);
  assert.match(t.notaSerie(r.serie, 'en', '1d'), /Fetched from CoinGecko every 5 minutes\. Live data could not be read from 13 Nov 2026, 11:00 to 13 Nov 2026, 13:00 \(Spain time\)/);
  // En la horaria no hubo cortes: solo lo de cada 5 minutos.
  assert.match(t.notaSerie(r.serie, 'es', '1m'), /Se pide a CoinGecko cada 5 minutos\.$/);
  // La fina publicada no lo dice.
  assert.doesNotMatch(t.notaSerie(t.unirSerieFina(DIARIA, FINA), 'es', '1d'), /cada 5 minutos\./);
});

/* ---- La app lee /api/tokenizacion/directo (lib/tokenizacion-serie-remota.js) ---- */
const fs = require('node:fs');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
function cargarRemota() {
  const nombre = path.resolve(__dirname, '../lib/tokenizacion-serie-remota.js');
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), { filename: nombre, babelrc: false, configFile: false, plugins: [commonjs] }).code;
  const salida = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(salida, salida.exports, dep => { if (dep === './tokenizacion') return t; throw new Error('dependencia: ' + dep); });
  return salida.exports;
}
const URL_DIARIA = 'https://rwadar.pages.dev/datos/tokenizacion-serie.json';
const URL_FINA = 'https://rwadar.pages.dev/datos/tokenizacion-serie-fina.json';
const URL_DIRECTO = 'https://rwadar.pages.dev/api/tokenizacion/directo';
/* Un rwadar.pages.dev de pega: el directo con su cabecera Date (3 minutos después del dato). */
function web({ directo = { status: 200, cuerpo: JSON.stringify(servido()) }, fecha = 'Fri, 13 Nov 2026 15:13:06 GMT', sinFina = false } = {}) {
  const llamadas = [];
  const fetchImpl = async (url, init) => {
    llamadas.push({ url, init });
    if (url === URL_DIRECTO) {
      if (directo === 'red') throw new TypeError('sin red');
      return { status: directo.status, ok: directo.status === 200, headers: { get: n => (n === 'date' ? fecha : null) }, text: async () => directo.cuerpo };
    }
    if (url === URL_DIARIA) return { status: 200, ok: true, text: async () => JSON.stringify(DIARIA) };
    if (url === URL_FINA) return sinFina ? { status: 404, ok: false, text: async () => 'No' } : { status: 200, ok: true, text: async () => JSON.stringify(FINA) };
    throw new Error('petición inesperada ' + url);
  };
  return { fetchImpl, llamadas };
}

test('app: cargarDirecto nunca lanza, sin cookies, mide la edad con la hora del servidor y lo reutiliza 4 minutos (aunque el móvil duerma)', async () => {
  const remota = cargarRemota();
  const w = web();
  let ahora = Date.parse('2026-11-13T17:13:06Z'), mono = 1000;   // el móvil va 2 horas adelantado
  const opciones = { fetchImpl: w.fetchImpl, ahora: () => ahora, monotono: () => mono };
  const r = await remota.cargarDirecto(opciones);
  assert.equal(r.edadMs, 3 * MIN);
  assert.equal(w.llamadas[0].init.credentials, 'omit');
  // 3 minutos después (los dos relojes avanzan): de memoria, con la edad al día.
  ahora += 3 * MIN; mono += 3 * MIN;
  assert.equal((await remota.cargarDirecto(opciones)).edadMs, 6 * MIN);
  assert.equal(w.llamadas.length, 1);
  // El móvil durmió 10 minutos: performance.now() no avanzó, Date.now() sí → se pide otra vez.
  ahora += 10 * MIN;
  await remota.cargarDirecto(opciones);
  assert.equal(w.llamadas.length, 2, 'no se fía del reloj que se para');
  // Lo que no se puede usar, con su motivo; nunca lanza.
  const casos = [[{ status: 404, cuerpo: '{"error":"directo_apagado"}' }, 'apagado'], [{ status: 503, cuerpo: '{"error":"directo_atrasado"}' }, 'atrasado'],
    [{ status: 503, cuerpo: '{"error":"directo_no_casa"}' }, 'no_casa'], [{ status: 502, cuerpo: '<html>' }, 'red'], [{ status: 200, cuerpo: '{"version":1}' }, 'no_valido'],
    [{ status: 200, cuerpo: 'x'.repeat(130 * 1024) }, 'red'], ['red', 'red']];
  for (const [directo, motivo] of casos) {
    remota.olvidarDirecto();
    assert.deepEqual(await remota.cargarDirecto({ fetchImpl: web({ directo }).fetchImpl }), { motivo }, motivo);
  }
});

test('app: cargarSerieConDirecto, la misma cadena que la web (directo → fina publicada → diaria)', async () => {
  const remota = cargarRemota();
  const ahora = () => Date.parse('2026-11-13T15:13:06Z');
  remota.olvidarSerie(); remota.olvidarSerieFina(); remota.olvidarDirecto();
  let w = web();
  let r = await remota.cargarSerieConDirecto({ fetchImpl: w.fetchImpl, ahora });
  assert.deepEqual([r.origen, r.motivo, t.esDirecto(r.serie)], ['directo', null, true]);
  assert.ok(!w.llamadas.some(l => l.url === URL_FINA), 'con el directo bien, la fina publicada ni se pide');
  assert.ok(Math.abs(r.proximo - (ahora() + 3.5 * MIN)) < 1000, 'el dato siguiente: generado + 6,5 minutos');
  remota.olvidarSerieFina(); remota.olvidarDirecto();
  w = web({ directo: { status: 503, cuerpo: '{"error":"directo_no_responde"}' } });
  r = await remota.cargarSerieConDirecto({ fetchImpl: w.fetchImpl, ahora });
  assert.deepEqual([r.origen, r.motivo, !!r.serie.fina], ['archivo', 'no_responde', true]);
  assert.match(t.avisoDirecto(r.motivo, r.serie), /^Ahora no se puede usar el dato en directo/);
  remota.olvidarSerieFina(); remota.olvidarDirecto();
  r = await remota.cargarSerieConDirecto({ fetchImpl: web({ directo: { status: 404, cuerpo: '{"error":"directo_apagado"}' }, sinFina: true }).fetchImpl, ahora });
  assert.deepEqual([r.origen, r.motivo, r.serie.fina], ['diaria', 'apagado', undefined]);
  assert.equal(r.proximo, ahora() + 15 * MIN, 'apagado, cada 15 minutos');
  // El servidor dice que el dato tiene 21 minutos: la copia publicada.
  remota.olvidarSerieFina(); remota.olvidarDirecto();
  r = await remota.cargarSerieConDirecto({ fetchImpl: web({ fecha: 'Fri, 13 Nov 2026 15:31:06 GMT' }).fetchImpl, ahora });
  assert.deepEqual([r.origen, r.motivo], ['archivo', 'atrasado']);
  remota.olvidarSerie(); remota.olvidarSerieFina(); remota.olvidarDirecto();
});
