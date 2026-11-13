'use strict';

/* «La tokenización en el mundo» (10/11/2026): el motor compartido (fotos,
   periodos solo con fotos reales a ±2 días, formato es/en), la lectura de
   /api/tokenizacion y la sección de Inicio con React aislado. Sin red: la
   respuesta de CoinGecko es la real del 10/11/2026, recortada a sus
   categorías (rwadar-app/tokenizacion/prueba-coingecko-20261110.json). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const { soporteIdioma } = require('./soporte-idioma.cjs');
const idioma = require('../lib/idioma');
const t = require('../lib/tokenizacion');

const RAIZ = path.resolve(__dirname, '..');
const COINGECKO = JSON.parse(fs.readFileSync(path.join(RAIZ, '../rwadar-app/tokenizacion/prueba-coingecko-20261110.json'), 'utf8'));
const AHORA = Date.parse('2026-11-10T15:31:37Z');
const foto = (fecha, valor, extra = {}) => ({ fecha, actualizado: fecha + 'T06:23:00.000Z', total: { valor, cambio24h: 0.5 },
  tipos: { 'credito-privado': { valor: Math.round(valor / 2), cambio24h: 1 } }, oro: null, ...extra });
const historico = (...fotos) => fotos.reduce((h, f) => t.anadirFoto(h, f).historico, t.historicoVacio());

test('la foto sale del total «tokenized-products» y de los 8 tipos; nunca de «real-world-assets-rwa»', () => {
  const f = t.extraerFoto(COINGECKO, { ahora: AHORA });
  assert.equal(f.fecha, '2026-11-10');
  assert.equal(f.actualizado, '2026-11-10T15:25:40.000Z');
  assert.deepEqual(f.total, { valor: 49683537033, cambio24h: -0.8626 });
  assert.deepEqual(Object.keys(f.tipos).sort(), t.TIPOS.map(x => x.clave).sort());
  assert.equal(f.tipos['credito-privado'].valor, 27616399208);
  assert.equal(f.oro.valor, 5620076802);
  // El total de RWA de CoinGecko (73.179 M$) incluye tokens de gobierno de protocolos: no se usa.
  assert.ok(!JSON.stringify(f).includes('73179'));
  assert.deepEqual(t.TIPOS.map(x => x.id).filter(id => /real-world-assets-rwa|rwa-protocol/.test(id)), []);
});

test('una respuesta rara no da cifras: sin total, total no numérico, sin hora, del futuro o vieja', () => {
  const sin = COINGECKO.filter(c => c.id !== 'tokenized-products');
  assert.throws(() => t.extraerFoto(sin, { ahora: AHORA }), /falta la categoría tokenized-products/);
  const cambiar = cambio => COINGECKO.map(c => (c.id === 'tokenized-products' ? { ...c, ...cambio } : c));
  assert.throws(() => t.extraerFoto(cambiar({ market_cap: '49e9' }), { ahora: AHORA }), /no es un número válido/);
  assert.throws(() => t.extraerFoto(cambiar({ market_cap: -1 }), { ahora: AHORA }), /no es un número válido/);
  assert.throws(() => t.extraerFoto(cambiar({ updated_at: null }), { ahora: AHORA }), /updated_at/);
  assert.throws(() => t.extraerFoto(cambiar({ updated_at: '2026-11-11T12:00:00Z' }), { ahora: AHORA }), /futuro/);
  assert.throws(() => t.extraerFoto(COINGECKO, { ahora: AHORA + 3 * 86400000 }), /más de 48 h/);
  assert.throws(() => t.extraerFoto({ error: 'rate limit' }, { ahora: AHORA }), /no es una lista/);
  // Un tipo que falta o viene roto se omite; un cambio raro queda en null.
  const parcial = COINGECKO.filter(c => c.id !== 'real-estate').map(c => (c.id === 'tokenized-stock' ? { ...c, market_cap_change_24h: 'x' } : c));
  const f = t.extraerFoto(parcial, { ahora: AHORA });
  assert.equal(f.tipos.inmuebles, undefined);
  assert.equal(f.tipos.acciones.cambio24h, null);
  // El 11/11/2026 CoinGecko daba +124 % en 24 h para toda la categoría con el mercado plano: no se guarda ni se enseña.
  assert.equal(t.CAMBIO_24H_MAX, 25);
  const disparate = t.extraerFoto(cambiar({ market_cap_change_24h: 124.415 }), { ahora: AHORA });
  assert.equal(disparate.total.cambio24h, null);
  assert.equal(disparate.total.valor, 49683537033, 'el valor sí se queda');
  assert.equal(t.extraerFoto(cambiar({ market_cap_change_24h: -24.9 }), { ahora: AHORA }).total.cambio24h, -24.9);
  assert.equal(t.extraerFoto(cambiar({ market_cap_change_24h: 25 }), { ahora: AHORA }).total.cambio24h, null);
  assert.deepEqual([12.5, -30, 124.4, NaN, null, '3'].map(t.cambio24hCreible), [12.5, null, null, null, null, null]);
});

test('el histórico: ordenado, sin repetidos, sin campos de más; una foto por día e idempotente', () => {
  const h = historico(foto('2026-11-12', 3), foto('2026-11-10', 1));
  assert.deepEqual(h.fotos.map(f => f.fecha), ['2026-11-10', '2026-11-12']);
  const otra = t.anadirFoto(h, foto('2026-11-12', 999));
  assert.equal(otra.anadida, false);
  assert.equal(otra.historico.fotos[1].total.valor, 3, 'la primera foto del día se queda');
  assert.throws(() => t.validarHistorico({ ...h, fotos: [h.fotos[1], h.fotos[0]] }), /desordenadas/);
  assert.throws(() => t.validarHistorico({ ...h, extra: 1 }), /forma/);
  assert.throws(() => t.validarHistorico({ ...h, fotos: [{ ...h.fotos[0], nota: '<script>' }] }), /forma/);
  assert.throws(() => t.validarHistorico({ ...h, fotos: [{ ...h.fotos[0], tipos: { bitcoin: { valor: 1, cambio24h: 0 } } }] }), /tipo desconocido/);
  assert.throws(() => t.validarHistorico({ ...h, fotos: [{ ...h.fotos[0], fecha: '2026-02-30' }] }), /fecha/);
  // Una foto por línea; se vuelve a leer igual.
  const texto = t.serializarHistorico(h);
  assert.equal(texto.split('\n').length, 5);
  assert.deepEqual(t.validarHistorico(JSON.parse(texto)), h);
  // La semilla versionada en main es válida y es la foto real del 10/11/2026.
  const semilla = t.validarHistorico(JSON.parse(fs.readFileSync(path.join(RAIZ, '../rwadar-site/datos/tokenizacion-historico.json'), 'utf8')));
  assert.deepEqual(semilla.fotos, [t.extraerFoto(COINGECKO, { ahora: AHORA })]);
});

test('periodos solo con fotos reales: la más cercana a ±2 días; si no, «sin-datos»', () => {
  const hoy = foto('2026-11-10', 110e9);
  // Solo la de hoy: 24 h de CoinGecko y el resto sin datos, con la fecha desde la que se guardan.
  let r = t.resumir({ historico: historico(hoy), actual: hoy });
  assert.deepEqual(r.periodos.map(p => [p.clave, p.estado]), [['24h', 'ok'], ['7d', 'sin-datos'], ['30d', 'sin-datos'], ['1a', 'sin-datos'], ['total', 'sin-datos']]);
  assert.equal(r.periodos[0].cambio, 0.5);
  assert.equal(r.guardadoDesde, '2026-11-10');
  // 7 días: hay foto a 2 días del objetivo (05/11 → objetivo 03/11) pero no a 3 (06/11).
  r = t.resumir({ historico: historico(foto('2026-11-05', 100e9), hoy), actual: hoy });
  assert.deepEqual(r.periodos[1], { clave: '7d', nombre: '7 días', cambio: 10, desde: '2026-11-05', estado: 'ok' });
  r = t.resumir({ historico: historico(foto('2026-11-06', 100e9), hoy), actual: hoy });
  assert.equal(r.periodos[1].estado, 'sin-datos');
  // Entre dos candidatas, la más cercana al objetivo.
  r = t.resumir({ historico: historico(foto('2026-10-10', 50e9), foto('2026-10-12', 100e9), foto('2026-11-02', 88e9), foto('2026-11-04', 100e9), hoy), actual: hoy });
  assert.equal(r.periodos[1].desde, '2026-11-02');
  assert.equal(r.periodos[2].desde, '2026-10-10', '30 días: objetivo 11/10; el 10/10 y el 12/10 empatan y gana la más antigua');
  assert.equal(r.periodos[4].desde, '2026-10-10');
  assert.equal(r.periodos[4].cambio, 120);
  // 1 año, con el margen de ±2 días.
  r = t.resumir({ historico: historico(foto('2025-11-12', 55e9), hoy), actual: hoy });
  assert.deepEqual([r.periodos[3].estado, r.periodos[3].desde, r.periodos[3].cambio], ['ok', '2025-11-12', 100]);
  // Nunca se compara con una foto del mismo día o posterior.
  r = t.resumir({ historico: historico(foto('2026-11-10', 1e9)), actual: hoy });
  assert.equal(r.periodos[4].estado, 'sin-datos');
  // La serie de la línea usa el dato de ahora para el día de hoy.
  r = t.resumir({ historico: historico(foto('2026-11-09', 100e9), foto('2026-11-10', 1e9)), actual: hoy });
  assert.deepEqual(r.serie, [{ fecha: '2026-11-09', valor: 100e9 }, { fecha: '2026-11-10', valor: 110e9 }]);
});

test('sin CoinGecko: la foto guardada más reciente, con su fecha; sin nada, un estado vacío sin cifras', () => {
  const h = historico(foto('2026-11-08', 100e9), foto('2026-11-09', 105e9));
  let r = t.resumir({ historico: h, actual: null });
  assert.equal(r.fuente, 'foto-guardada');
  assert.equal(r.fecha, '2026-11-09');
  assert.equal(r.actualizado, '2026-11-09T06:23:00.000Z');
  // Una foto guardada en caché más vieja que la última del histórico no gana.
  r = t.resumir({ historico: h, actual: foto('2026-11-08', 1), fuente: 'foto-guardada' });
  assert.equal(r.fecha, '2026-11-09');
  r = t.resumir({ historico: t.historicoVacio(), actual: null });
  assert.equal(r.fuente, 'sin-datos');
  assert.equal(r.total, null);
  assert.ok(r.periodos.every(p => p.cambio === null && p.estado === 'sin-datos'));
  assert.equal(t.resumenValido(r), true);
  // Un histórico roto no tumba nada.
  assert.equal(t.resumir({ historico: { basura: true }, actual: null }).fuente, 'sin-datos');
});

test('tipos por valor, con su cuota del total; el oro dentro de materias primas', () => {
  const f = t.extraerFoto(COINGECKO, { ahora: AHORA });
  const r = t.resumir({ historico: historico(f), actual: f });
  assert.deepEqual(r.tipos.map(x => x.nombre), ['Crédito privado', 'Letras del Tesoro', 'Materias primas', 'Acciones',
    'Fondos monetarios', 'Otros créditos', 'ETF', 'Inmuebles']);
  assert.equal(r.tipos[0].cuota, 55.58);
  assert.equal(r.oro.cuotaMateriasPrimas, 95.27);
  assert.equal(r.atribucion.nombre, 'CoinGecko');
  assert.equal(r.atribucion.url, 'https://www.coingecko.com/');
  assert.equal(t.resumenValido(r), true);
  for (const roto of [{ ...r, version: 2 }, { ...r, fuente: 'inventada' }, { ...r, total: { valor: 'mucho' } },
    { ...r, periodos: r.periodos.slice(1) }, { ...r, tipos: [{ ...r.tipos[0], valor: -1 }] }, { ...r, serie: [{ fecha: 'ayer', valor: 1 }] }]) {
    assert.equal(t.resumenValido(roto), false);
  }
});

test('formato español e inglés: «49.684 M$», «+1,2 %», signo menos de verdad y «—» sin dato', () => {
  assert.equal(t.millones(49683537033), '49.684 M$');
  assert.equal(t.millones(49683537033, 'en'), '$49,684M');
  assert.equal(t.millones(106118411), '106 M$');
  assert.equal(t.millones(81118411), '81,1 M$');
  assert.equal(t.millones(1234567890123, 'en'), '$1,234,568M');
  assert.equal(t.porcentaje(1.234), '+1,2 %');
  assert.equal(t.porcentaje(-0.8626), '−0,9 %');
  assert.equal(t.porcentaje(-0.8626, 'en'), '−0.9%');
  assert.equal(t.porcentaje(0.04), '0,0 %');
  assert.equal(t.porcentaje(120.4), '+120 %');
  assert.equal(t.porcentaje(null), '—');
  assert.deepEqual([1, -1, 0.01, null, NaN].map(t.direccion), ['sube', 'baja', 'igual', 'sin-datos', 'sin-datos']);
  assert.equal(t.cuota(55.58), '55,6 %');
  assert.equal(t.cuota(0.05, 'en'), '<0.1%');
  assert.equal(t.fechaCorta('2026-11-10'), '10/11/2026');
  assert.equal(t.horaDato('2026-11-10T15:25:40.000Z'), '10/11/2026, 15:25 UTC');
  assert.equal(t.horaDato('mal'), '—');
  // En inglés, sin el 10/11 que en EE. UU. se lee como 11 de octubre.
  assert.equal(t.fechaCorta('2026-11-10', 'en'), '10 Nov 2026');
  assert.equal(t.horaDato('2026-11-10T15:25:40.000Z', 'en'), '10 Nov 2026, 15:25 UTC');
  assert.equal(t.fechaBreve('2026-11-15', 'es', '2026-11-10'), '15/11');
  assert.equal(t.fechaBreve('2026-11-15', 'en', '2026-11-10'), '15 Nov');
  assert.equal(t.fechaBreve('2027-11-08', 'es', '2026-11-10'), '08/11/2027', 'con el año si no es el mismo');
  assert.equal(t.millonesHablados(49683537033), '49.684 millones de dólares');
  assert.equal(t.millonesHablados(49683537033, 'en'), '49,684 million dollars');
  assert.equal(t.porcentaje(0.01), '0,0 %');
  assert.equal(t.PERIODOS[4].nombre, 'Histórico');
});

test('cuándo llega cada periodo: el histórico al día siguiente; 7 días, 30 días y 1 año con el margen de ±2 días', () => {
  assert.equal(t.fechaLlegada('2026-11-10', 'total', '2026-11-10'), '2026-11-11');
  assert.equal(t.fechaLlegada('2026-11-10', '7d', '2026-11-10'), '2026-11-15');
  assert.equal(t.fechaLlegada('2026-11-10', '30d', '2026-11-10'), '2026-12-08');
  assert.equal(t.fechaLlegada('2026-11-10', '1a', '2026-11-10'), '2027-11-08');
  assert.equal(t.fechaLlegada('2026-11-10', '24h', '2026-11-10'), null);
  // Si esa fecha ya pasó y sigue sin dato (faltan fotos), no se promete nada.
  assert.equal(t.fechaLlegada('2026-11-10', '7d', '2026-11-20'), null);
  assert.equal(t.fechaLlegada(null, '7d', '2026-11-10'), null);
  // Coherente con resumir(): el día que dice, el periodo ya sale.
  const h = historico(foto('2026-11-10', 100));
  assert.equal(t.resumir({ historico: h, actual: foto('2026-11-15', 101) }).periodos[1].estado, 'ok');
  assert.equal(t.resumir({ historico: h, actual: foto('2026-11-14', 101) }).periodos[1].estado, 'sin-datos');
});

test('la línea: un cambio pequeño se ve pequeño (escala mínima del 4 %) y la escala va escrita', () => {
  const H = 112, M = 8;
  const casiIguales = t.alturasLinea([49683537033, 49683537033 * 1.003], H, M);
  assert.ok(Math.abs(casiIguales[0] - casiIguales[1]) < H / 2, 'un 0,3 % no ocupa toda la altura');
  assert.ok(casiIguales.every(y => y >= M && y <= H - M));
  const lejos = t.alturasLinea([40e9, 50e9], H, M);
  assert.equal(Math.round(lejos[0]), H - M);
  assert.equal(Math.round(lejos[1]), M, 'un cambio grande sí usa toda la altura');
  assert.deepEqual(t.alturasLinea([5e9, 5e9], H, M).map(Math.round), [56, 56], 'iguales: en medio');
  const serie = [{ fecha: '2025-10-07', valor: 47120e6 }, { fecha: '2026-11-10', valor: 49684e6 }];
  assert.equal(t.textosLinea(serie).nota, 'De 47.120 M$ (07/10/2025) a 49.684 M$ (10/11/2026) · +5,4 %');
  assert.equal(t.textosLinea(serie, 'en').nota, 'From $47,120M (7 Oct 2025) to $49,684M (10 Nov 2026) · +5.4%');
  assert.equal(t.textosLinea(serie).etiqueta, 'Valor total del 07/10/2025 al 10/11/2026: de 47.120 M$ a 49.684 M$, +5,4 %, 2 fotos diarias');
  assert.equal(t.textosLinea(serie.slice(0, 1)), null);
});

/* ---- Lectura de /api/tokenizacion ---- */
function cargarLib(ruta, mocks) {
  const nombre = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), { filename: nombre, babelrc: false, configFile: false, plugins: [commonjs] }).code;
  const salida = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(salida, salida.exports, (d) => {
    if (Object.hasOwn(mocks, d)) return mocks[d];
    throw new Error(`Dependencia inesperada: ${d}`);
  });
  return salida.exports;
}
const remota = cargarLib('lib/tokenizacion-remota.js', { './tokenizacion': t });
const RESUMEN = (() => { const f = t.extraerFoto(COINGECKO, { ahora: AHORA }); return t.resumir({ historico: historico(f), actual: f }); })();

test('la app lee https://rwadar.pages.dev/api/tokenizacion sin cookies y rechaza lo que no tiene forma', async () => {
  const llamadas = [];
  const responde = (status, cuerpo) => async (url, init) => { llamadas.push([url, init]); return { ok: status === 200, status, text: async () => cuerpo }; };
  remota.olvidarTokenizacion();
  assert.deepEqual(await remota.cargarTokenizacion({ fetchImpl: responde(200, JSON.stringify(RESUMEN)) }), RESUMEN);
  remota.olvidarTokenizacion();
  assert.equal(llamadas[0][0], 'https://rwadar.pages.dev/api/tokenizacion');
  assert.equal(llamadas[0][1].credentials, 'omit');
  assert.equal(llamadas[0][1].method, 'GET');
  assert.ok(!('Authorization' in llamadas[0][1].headers) && !('Cookie' in llamadas[0][1].headers));
  await assert.rejects(remota.cargarTokenizacion({ fetchImpl: responde(503, '{}') }), /tokenizacion_http_503/);
  await assert.rejects(remota.cargarTokenizacion({ fetchImpl: responde(200, '{"version":1}') }), /tokenizacion_forma/);
  await assert.rejects(remota.cargarTokenizacion({ fetchImpl: responde(200, '<html>') }), SyntaxError);
  await assert.rejects(remota.cargarTokenizacion({ fetchImpl: responde(200, 'x'.repeat(600 * 1024)) }), /tokenizacion_tamano/);
  // Con la red colgada, el plazo corta la espera.
  const colgada = (url, init) => new Promise((_, rechazar) => init.signal.addEventListener('abort', () => rechazar(new Error('abortada'))));
  await assert.rejects(remota.cargarTokenizacion({ fetchImpl: colgada, plazoMs: 20 }), /abortada/);
});

test('la app reutiliza una respuesta buena 10 minutos en la sesión; los fallos no se guardan', async () => {
  remota.olvidarTokenizacion();
  let llamadas = 0, ahora = AHORA, estado = 503;
  const fetchImpl = async () => { llamadas++; return { ok: estado === 200, status: estado, text: async () => JSON.stringify(RESUMEN) }; };
  const cargar = () => remota.cargarTokenizacion({ fetchImpl, ahora: () => ahora });
  await assert.rejects(cargar(), /tokenizacion_http_503/);
  estado = 200;
  assert.deepEqual(await cargar(), RESUMEN, 'tras un fallo, «Reintentar» sí pregunta');
  assert.equal(llamadas, 2);
  ahora += 9 * 60000;
  await cargar();
  assert.equal(llamadas, 2, 'dentro de 10 minutos no vuelve a preguntar');
  ahora += 2 * 60000;
  await cargar();
  assert.equal(llamadas, 3);
  assert.equal(remota.REUSO_MS, 600000);
  remota.olvidarTokenizacion();
});

/* ---- La serie del mercado «estilo bolsa» (11/11/2026) ---- */
const SERIE = t.validarSerie(JSON.parse(fs.readFileSync(path.join(RAIZ, '../rwadar-site/datos/tokenizacion-serie.json'), 'utf8')));
const DIA = 86400000;
const caps = (desde, valores) => valores.map((v, i) => [Date.parse(desde + 'T00:00:00Z') + i * DIA, v]);

test('serie: los 40 mayores de la lista de CoinGecko y su cuota del total; descarta lo que no tiene forma', () => {
  const lista = [...Array(45)].map((_, i) => ({ id: 'token-' + i, market_cap: (50 - i) * 1e9 }));
  lista.push({ id: 'token-1', market_cap: 1 }, { id: 'MAL ID', market_cap: 9e12 }, { id: 'sin-valor', market_cap: null }, { id: 'cero', market_cap: 0 });
  const r = t.elegirMayores(lista);
  assert.equal(r.mayores.length, 40);
  assert.equal(r.mayores[0].id, 'token-0');
  assert.ok(!r.mayores.some((m) => m.id === 'MAL ID' || m.id === 'sin-valor'));
  assert.equal(r.cobertura, Math.round(r.mayores.reduce((s, m) => s + m.valor, 0) / r.total * 1000) / 10);
  // Un solo denominador: el total de la categoría (el de la cabecera y los tipos), si llega y no es menor que la lista.
  const suma = r.total;
  const conCategoria = t.elegirMayores(lista, 40, suma * 1.25);
  assert.equal(conCategoria.total, Math.round(suma * 1.25));
  assert.equal(conCategoria.cobertura, Math.round(r.mayores.reduce((s, m) => s + m.valor, 0) / (suma * 1.25) * 1000) / 10);
  assert.equal(t.elegirMayores(lista, 40, suma / 2).total, suma, 'un total menor que la lista no vale: la suma de la lista');
  assert.equal(t.elegirMayores(lista, 40, 'x').total, suma);
  // La historia pide 365 días: la API pública de CoinGecko responde 401 (error 10012) a days=366.
  assert.match(t.urlHistoria('figure-heloc'), /\/coins\/figure-heloc\/market_chart\?vs_currency=usd&days=365&interval=daily$/);
  assert.doesNotMatch(t.urlHistoria('figure-heloc'), /days=36[6-9]/, 'nunca más de 365 días: sin clave, CoinGecko no los da');
  assert.throws(() => t.elegirMayores([{ id: 'a', market_cap: 1e9 }]), /muy pocos tokens/);
  assert.throws(() => t.elegirMayores('x'), /no es válida/);
});

test('serie: suma diaria con el último dato de como mucho 3 días; antes de su primer dato, el token cuenta 0', () => {
  const a = t.historiaToken(caps('2026-11-01', [10e9, 11e9, 12e9, 13e9, 14e9, 15e9, 16e9, 17e9, 18e9, 19e9]));
  // b empieza el 05/11 y le faltan el 07/11 y el 08/11 (se usa el del 06/11).
  const b = t.historiaToken([[Date.parse('2026-11-05T00:00:00Z'), 5e9], [Date.parse('2026-11-06T00:00:00Z'), 6e9],
    [Date.parse('2026-11-09T00:00:00Z'), 9e9], [Date.parse('2026-11-10T00:00:00Z'), 0], [Date.parse('2026-11-10T15:00:00Z'), 10e9]]);
  assert.equal(b.primera, '2026-11-05');
  assert.equal(b.dias.get('2026-11-10'), 10e9, 'el último dato del día y nunca un 0');
  const puntos = t.construirSerie([a, b], '2026-11-10', 9);
  assert.deepEqual(puntos.map((p) => [p.fecha, p.valor / 1e9, p.tokens]), [
    ['2026-11-01', 10, 1], ['2026-11-02', 11, 1], ['2026-11-03', 12, 1], ['2026-11-04', 13, 1],
    ['2026-11-05', 19, 2], ['2026-11-06', 21, 2], ['2026-11-07', 22, 2], ['2026-11-08', 23, 2], ['2026-11-09', 27, 2], ['2026-11-10', 29, 2]]);
});

test('serie: si un token que ya cotizaba lleva más de 3 días sin dato, ese día no se pinta (ni se inventa ni se hunde)', () => {
  const a = t.historiaToken(caps('2026-11-01', [10e9, 10e9, 10e9, 10e9, 10e9, 10e9, 10e9, 10e9]));
  const b = t.historiaToken([[Date.parse('2026-11-01T00:00:00Z'), 5e9], [Date.parse('2026-11-08T00:00:00Z'), 5e9]]);
  const fechas = t.construirSerie([a, b], '2026-11-08', 7).map((p) => p.fecha);
  assert.deepEqual(fechas, ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-08']);
});

test('serie: a un token le faltan días si no tiene dato en los 3 anteriores; los de antes de su primer dato no cuentan', () => {
  const h = t.historiaToken([[Date.parse('2026-11-01T00:00:00Z'), 1e9], [Date.parse('2026-11-08T00:00:00Z'), 1e9]]);
  // Del 01/11 al 10/11: faltan el 05/11, 06/11 y 07/11 (el 08/11 hay dato) y el 10/11 aún tiene el del 08/11.
  assert.equal(t.diasSinDato(h, '2026-11-10', 30), 3);
  assert.equal(t.diasSinDato(h, '2026-11-20', 30), 3 + 9, 'una historia que acaba antes de hoy también falta');
  assert.equal(t.diasSinDato(t.historiaToken([]), '2026-11-10'), 0);
  assert.equal(t.SERIE.maxDiasSinDato, 3);
});

test('serie: el archivo se valida entero, una línea por día, y se rechaza lo que no tiene forma', () => {
  assert.ok(SERIE.puntos.length >= 300, 'la semilla de main trae casi un año');
  assert.equal(SERIE.fuente, 'CoinGecko');
  assert.equal(SERIE.categoria, 'tokenized-products');
  assert.equal(SERIE.tokens.length, SERIE.incluidos);
  assert.ok(SERIE.incluidos >= 25 && SERIE.cobertura >= 75 && SERIE.incluidos + SERIE.discontinuos <= SERIE.pedidos);
  const texto = t.serializarSerie(SERIE);
  assert.equal(texto.split('\n').length, SERIE.puntos.length + 3);
  assert.deepEqual(t.validarSerie(JSON.parse(texto)), SERIE);
  const mal = (cambio) => { const s = JSON.parse(texto); cambio(s); return t.serieValida(s); };
  assert.equal(mal(() => {}), true);
  assert.equal(mal((s) => { s.puntos[1].fecha = s.puntos[0].fecha; }), false);
  assert.equal(mal((s) => { s.puntos[0].valor = -1; }), false);
  assert.equal(mal((s) => { s.puntos[0].tokens = 99; }), false);
  assert.equal(mal((s) => { s.extra = 1; }), false);
  assert.equal(mal((s) => { s.discontinuos = s.pedidos; }), false);
  assert.equal(mal((s) => { delete s.discontinuos; }), false);
  assert.equal(mal((s) => { s.tokens.push('otro'); }), false);
  assert.equal(mal((s) => { s.generado = '2020-01-01T00:00:00Z'; }), false, 'ningún punto posterior a su hora');
  assert.equal(mal((s) => { s.puntos[0].valor = '1'; }), false);
});

test('serie: pestañas 24 h · 1 S · 1 M · 3 M · 6 M · 2026 · 1 A (en inglés, 24H y YTD), 1 M por defecto; la del año parte del 1 de enero', () => {
  // «24 h» (13/11/2026) solo con la serie de 5 minutos: con la diaria sería una raya de dos puntos y sale desactivada.
  assert.deepEqual(t.PESTANAS.map((p) => p.corto), ['24 h', '1 S', '1 M', '3 M', '6 M', 'Año', '1 A']);
  assert.deepEqual(t.etiquetaPestana('1d', 'es', SERIE), { corto: '24 h', nombre: '24 horas' });
  assert.deepEqual(t.etiquetaPestana('1d', 'en', SERIE), { corto: '24H', nombre: '24 hours' });
  assert.equal(t.tramo(SERIE.puntos, '1d'), null, 'con la diaria, «24 h» no tiene datos');
  assert.equal(t.graficoPestana(SERIE, '1d'), null);
  assert.equal(t.pestanaDisponible(SERIE, '1d'), false);
  assert.deepEqual(t.PESTANAS.filter((p) => !t.pestanaDisponible(SERIE, p.clave)).map((p) => p.clave), ['1d'], 'las demás, con la diaria, como antes');
  assert.equal(t.PESTANA_INICIAL, '1m');
  // «YTD» no se entiende en castellano: el año de la serie, y el nombre accesible contiene lo que se ve (WCAG 2.5.3).
  assert.deepEqual(t.etiquetaPestana('ytd', 'es', SERIE), { corto: '2026', nombre: 'En 2026' });
  assert.deepEqual(t.etiquetaPestana('ytd', 'en', SERIE), { corto: 'YTD', nombre: 'YTD, year to date' });
  assert.deepEqual(t.etiquetaPestana('1m', 'es', SERIE), { corto: '1 M', nombre: '1 mes' });
  assert.deepEqual(t.etiquetaPestana('1a', 'en', SERIE), { corto: '1Y', nombre: '1 year' });
  assert.equal(t.etiquetaPestana('ytd', 'es', null, Date.parse('2027-03-01T00:00:00Z')).corto, '2027', 'sin serie, el año del reloj');
  for (const lengua of ['es', 'en']) {
    const et = t.etiquetaPestana('ytd', lengua, SERIE);
    assert.ok(et.nombre.includes(et.corto), `${lengua}: el nombre accesible contiene «${et.corto}»`);
  }
  assert.equal(t.etiquetaPestana('nada'), null);
  const puntos = [...Array(60)].map((_, i) => ({ fecha: t.fechaDe(Date.parse('2025-12-01T00:00:00Z') + i * DIA), valor: (40 + i) * 1e9, tokens: 1 }));
  const ultimo = puntos.at(-1).fecha;
  assert.equal(ultimo, '2026-01-29');
  assert.equal(t.tramo(puntos, '1s')[0].fecha, '2026-01-22');
  assert.equal(t.tramo(puntos, '1s').length, 8);
  assert.equal(t.tramo(puntos, '1m')[0].fecha, '2025-12-30');
  // El dato de las 00:00 UTC del 1 de enero es el cierre del 31/12: el año se mide desde él (QA del 11/11/2026).
  assert.equal(t.tramo(puntos, 'ytd')[0].fecha, '2026-01-01');
  assert.equal(t.tramo(puntos.filter((p) => p.fecha !== '2026-01-01'), 'ytd')[0].fecha, '2026-01-02', 'sin el 01/01, el primero del año');
  assert.equal(t.tramo(SERIE.puntos, 'ytd')[0].fecha, '2026-01-01');
  assert.equal(t.tramo(puntos, '1a')[0].fecha, '2025-12-01', 'con menos de un año, desde el primer día que hay');
  assert.equal(t.tramo(puntos.slice(0, 1), '1m'), null);
  const e = t.estadisticasTramo(t.tramo(puntos, '1s'));
  assert.deepEqual([e.inicio / 1e9, e.fin / 1e9, e.max.fecha, e.min.fecha], [92, 99, '2026-01-29', '2026-01-22']);
  assert.equal(e.cambio, t.cambioPct(99e9, 92e9));
});

test('serie: donde falta un día la línea se corta en tramos, el área de fondo sigue entera y un trazo de puntos une el hueco', () => {
  const puntos = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-06', '2026-11-07', '2026-11-09'].map((fecha, i) => ({ fecha, valor: (10 + i) * 1e9, tokens: 1 }));
  const g = { puntos, escala: { lo: 9e9, hi: 16e9 } };
  assert.deepEqual(t.tramosSeguidos(g), [[0, 2], [3, 4], [5, 5]]);
  const c = t.coordenadas({ ...g }, 80, 70);
  const { linea, area, puentes } = t.trazosSvg(c, t.tramosSeguidos(g), 70);
  assert.equal((linea.match(/M/g) || []).length, 3, 'tres tramos, sin rectas por encima de los huecos');
  assert.equal((area.match(/M/g) || []).length, 1, 'el área de fondo no se corta (el corte parecía una raya negra)');
  assert.equal((area.match(/Z/g) || []).length, 1);
  assert.equal((puentes.match(/M/g) || []).length, 2, 'un trazo de puntos por cada hueco');
  assert.ok(puentes.startsWith(`M${c[2].x.toFixed(1)} ${c[2].y.toFixed(1)} L${c[3].x.toFixed(1)} ${c[3].y.toFixed(1)}`), 'el puente une los dos días a los lados del hueco');
  assert.deepEqual(t.trazosSvg([], [], 70), { linea: '', area: '', puentes: '' });
  const real = t.graficoPestana(SERIE, '1a');
  assert.ok(t.tramosSeguidos(real).length > 1, 'la semilla real tiene días sin pintar');
});

test('serie: el eje va del mínimo al máximo con un 8 % de aire (sin bandas vacías) y lleva marcas redondas dentro; no empieza en cero', () => {
  for (const [min, max] of [[46.1e9, 48.3e9], [20e9, 47e9], [46.70e9, 46.75e9], [1.2e9, 1.9e9], [49.6e9, 49.6e9], [37.6e9, 39.9e9], [23.9e9, 49.7e9]]) {
    const esc = t.escalaValores(min, max);
    assert.ok(esc.marcas.length >= 3 && esc.marcas.length <= 6, `${min}-${max}: ${esc.marcas.length}`);
    assert.ok(esc.lo < min && esc.hi > max && esc.lo > 0);
    assert.ok(esc.marcas.every((m) => m >= esc.lo && m <= esc.hi), 'las marcas, dentro del dibujo');
    const rango = Math.max(max - min, (min + max) / 2 * 0.01);
    assert.ok(Math.abs((esc.hi - esc.lo) - rango * 1.16) < rango * 1e-6, `${min}-${max}: un 8 % arriba y abajo, nada más`);
    const f = esc.paso / 10 ** Math.floor(Math.log10(esc.paso));
    assert.ok([1, 2, 2.5, 5, 10].some((x) => Math.abs(f - x) < 1e-9), 'paso redondo');
    assert.ok((esc.hi - esc.lo) >= (min + max) / 2 * 0.01 - 1, 'un tramo casi plano no parece un desplome');
  }
  // Con la serie real, 4 o 5 marcas en cada pestaña (con la diaria sola, todas menos «24 h»); en 1 A, de 25.000 a 40.000 (antes, de 20.000 a 50.000 con un 30 % vacío).
  for (const p of t.PESTANAS.filter((x) => x.clave !== '1d')) {
    const g = t.graficoPestana(SERIE, p.clave);
    assert.ok(g.marcasValores.length >= 4 && g.marcasValores.length <= 5, `${p.clave}: ${g.marcasValores.length}`);
  }
  assert.deepEqual(t.graficoPestana(SERIE, '1a').marcasValores.map((m) => m.texto), ['25.000', '30.000', '35.000', '40.000']);
  assert.equal(t.marcaValor(48e9, 1e9), '48.000');
  assert.equal(t.marcaValor(48e9, 1e9, 'en'), '48,000');
  assert.equal(t.marcaValor(46.75e9, 5e7), '46.750');
  assert.equal(t.marcaValor(4.255e8, 5e5), '425,5');
  assert.equal(t.escalaValores(0, 1), null);
});

test('serie: las fechas de abajo, de 2 a 6 y legibles; el gráfico de cada pestaña sale de la semilla real', () => {
  // La semilla real es solo la diaria: todas menos «24 h» (las finas, en sus pruebas).
  for (const p of t.PESTANAS.filter((x) => x.clave !== '1d')) {
    const g = t.graficoPestana(SERIE, p.clave);
    assert.ok(g, p.clave);
    assert.ok(g.marcasFechas.length >= 2 && g.marcasFechas.length <= 6, `${p.clave}: ${g.marcasFechas.length}`);
    assert.ok(g.marcasFechas.every((m) => g.puntos[m.indice].fecha === m.fecha && /^[0-9a-z \u2019]+$/i.test(m.texto)));
    assert.ok(g.marcasValores.length >= 4 && g.marcasValores.length <= 5);
    assert.equal(g.estadisticas.fin, SERIE.puntos.at(-1).valor);
    assert.match(g.cambioTexto, /^[+−]?\d/);
    assert.equal(g.direccion, t.direccion(g.estadisticas.cambio));
    const c = t.coordenadas(g, 300, 200);
    assert.ok(c.every((x) => x.x >= 0 && x.x <= 300 && x.y >= 0 && x.y <= 200));
    assert.equal(t.indiceCercano(c, 1000), c.length - 1);
    assert.equal(t.indiceCercano(c, -5), 0);
  }
  assert.equal(t.graficoPestana(SERIE, '1m').periodoTexto, 'último mes');
  assert.equal(t.graficoPestana(SERIE, '1m', 'en').periodoTexto, 'past month');
  assert.match(t.graficoPestana(SERIE, '1a').marcasFechas[0].texto, /^[a-z]{3} \d{4}$/, '«dic 2025», con el año entero');
  const seguidos = [...Array(10)].map((_, i) => ({ fecha: t.fechaDe(Date.parse('2026-11-01T00:00:00Z') + i * DIA), valor: 4e10, tokens: 1 }));
  const base = { ...SERIE, pedidos: 40, incluidos: 40, discontinuos: 0, tokens: [...Array(40)].map((_, i) => 'tk-' + i), cobertura: 93.2, puntos: seguidos };
  assert.equal(t.notaSerie(base), 'Suma de los 40 mayores tokens de activos reales que sigue CoinGecko (93\u00a0% del total de la categoría hoy). Si un token empezó a cotizar dentro del periodo, entra ese día.');
  assert.match(t.notaSerie({ ...base, incluidos: 32, discontinuos: 8, tokens: base.tokens.slice(0, 32), cobertura: 86.3 }),
    /^Suma de 32 de los 40 mayores tokens de activos reales que sigue CoinGecko \(86\s% del total de la categoría hoy\)\. Si un token empezó a cotizar dentro del periodo, entra ese día\. Quedan fuera 8 a los que les faltan días en CoinGecko\.$/);
  assert.match(t.notaSerie({ ...base, incluidos: 37, discontinuos: 1, tokens: base.tokens.slice(0, 37) }), /Quedan fuera 1 a los que les faltan días en CoinGecko\. No se pudieron leer 2\.$/);
  assert.match(t.notaSerie({ ...base, incluidos: 39, tokens: base.tokens.slice(0, 39) }, 'en'), /^Sum of 39 of the 40 largest .* 1 could not be read\.$/);
  assert.match(t.notaSerie({ ...base, puntos: seguidos.filter((_, i) => i !== 4 && i !== 6) }), /\. Faltan el \d\d\/\d\d\/\d{4} y el \d\d\/\d\d\/\d{4}: esos días no hay dato completo y no se pintan\.$/);
  assert.match(t.notaSerie(SERIE), /^Suma de \d+ de los 40 mayores tokens de activos reales que sigue CoinGecko/);
  assert.equal(t.graficoPestana({ version: 2 }, '1m'), null);
});

test('serie: el cambio dice a qué se refiere (la suma de los N mayores, no la cifra total) y avisa si en el periodo entran tokens nuevos', () => {
  const g1m = t.graficoPestana(SERIE, '1m'), g1a = t.graficoPestana(SERIE, '1a'), g1aEn = t.graficoPestana(SERIE, '1a', 'en');
  assert.equal(g1m.cambioFrase, 'en el último mes');
  assert.equal(t.graficoPestana(SERIE, 'ytd').cambioFrase, 'en 2026', 'el año, como en la pestaña');
  assert.equal(t.graficoPestana(SERIE, 'ytd').periodoTexto, 'en 2026');
  assert.equal(t.graficoPestana(SERIE, 'ytd', 'en').cambioFrase, 'year to date');
  assert.equal(t.graficoPestana(SERIE, '1m', 'en').cambioFrase, 'past month');
  assert.equal(g1m.alcance, `suma de los ${SERIE.incluidos} mayores`);
  assert.equal(t.graficoPestana(SERIE, '1m', 'en').alcance, `sum of the ${SERIE.incluidos} largest`);
  // El primer punto de 1 A (12/11/2025) suma 16 tokens y el último 29: parte de la subida son tokens nuevos.
  const [a, b] = [g1a.puntos[0].tokens, g1a.puntos[g1a.puntos.length - 1].tokens];
  assert.ok(a < b, `la semilla real: de ${a} a ${b} tokens en 1 A`);
  assert.equal(g1a.avisoTokens, `de ${a} a ${b} tokens: parte de la subida son tokens nuevos`);
  assert.equal(g1aEn.avisoTokens, `from ${a} to ${b} tokens: part of the rise is new tokens`);
  assert.ok(g1a.etiqueta.endsWith(` De ${a} a ${b} tokens: parte de la subida son tokens nuevos.`), 'también para el lector de pantalla');
  assert.ok(g1aEn.etiqueta.endsWith(` From ${a} to ${b} tokens: part of the rise is new tokens.`));
  assert.equal(g1m.puntos[0].tokens, g1m.puntos[g1m.puntos.length - 1].tokens);
  assert.equal(g1m.avisoTokens, '', 'mismos tokens al principio y al final: sin aviso');
  assert.ok(!/tokens nuevos/.test(g1m.etiqueta));
  const p = (tokens, valor) => ({ valor, tokens });
  assert.equal(t.avisoTokens([p(3, 1), p(5, 2)], 'baja'), 'de 3 a 5 tokens: sin los nuevos, la bajada sería mayor');
  assert.equal(t.avisoTokens([p(5, 1), p(3, 2)], 'sube'), 'de 5 a 3 tokens: algunos dejan de contar en el periodo');
  assert.equal(t.avisoTokens([p(3, 1), p(5, 2)], 'igual', 'en'), 'from 3 to 5 tokens: part of the change is new tokens');
});

test('serie: si se queda vieja (más de 3 días antes del dato de hoy) se dice; la nota corta y los días que faltan, con su fecha', () => {
  const ultimo = SERIE.puntos[SERIE.puntos.length - 1].fecha, ms = Date.parse(ultimo + 'T00:00:00Z');
  assert.equal(t.serieAtrasada(SERIE, new Date(ms + 3 * DIA + 23 * 3600e3).toISOString()), false, '3 días y pico: todavía vale');
  assert.equal(t.serieAtrasada(SERIE, ms + 4 * DIA), true);
  assert.equal(t.serieAtrasada(SERIE, ms - DIA), false, 'una serie más nueva que el dato no está vieja');
  assert.equal(t.serieAtrasada(SERIE, null), false);
  assert.equal(t.serieAtrasada(null, ms), false);
  // La misma coletilla que el subtítulo de la cifra grande: «los 29 mayores tokens con historia completa».
  assert.equal(t.notaCorta(SERIE), `Suma de los ${SERIE.incluidos} mayores tokens con historia completa (86\u00a0% del total de la categoría).`);
  assert.equal(t.notaCorta(SERIE, 'en'), `Sum of the ${SERIE.incluidos} largest tokens with a complete history (86% of the category total).`);
  assert.ok(t.notaCorta(SERIE).includes(t.subtituloCifra(SERIE).split(/\s·\s/)[0].replace(/^Suma de /, '')), 'nota y subtítulo, con las mismas palabras');
  assert.equal(t.notaCorta({ version: 9 }), '');
  assert.match(t.notaSerie(SERIE), /Falta el 29\/07\/2026: ese día no hay dato completo y no se pinta\.$/, 'el hueco real, con su fecha');
  assert.match(t.notaSerie(SERIE, 'en'), /29 Jul 2026 is missing: there is no complete data for that day, so it is not drawn\.$/);
  const seguidos = [...Array(12)].map((_, i) => ({ fecha: t.fechaDe(Date.parse('2026-10-01T00:00:00Z') + i * DIA), valor: 4e10, tokens: 1 }));
  assert.deepEqual(t.diasQueFaltan(seguidos.filter((_, i) => i !== 2 && i !== 3)), ['2026-10-03', '2026-10-04']);
  const muchos = { ...SERIE, pedidos: 40, incluidos: 40, discontinuos: 0, tokens: [...Array(40)].map((_, i) => 'tk-' + i), cobertura: 93.2,
    puntos: seguidos.filter((_, i) => i < 2 || i > 6) };
  assert.match(t.notaSerie(muchos), /Los días sin dato completo no se pintan \(5 en la serie\)\.$/, 'más de 3: se cuentan');
});

test('cabecera: la cifra grande es el último punto de la serie (el de la cruz en el último día) y nunca supera el máximo de ninguna pestaña', () => {
  const vivo = { ...RESUMEN, total: { valor: 49690e6, cambio24h: 124.415 } };
  const c = t.cifraGrande(SERIE, vivo);
  const ultimo = SERIE.puntos[SERIE.puntos.length - 1];
  assert.deepEqual(c, { valor: ultimo.valor, fecha: ultimo.fecha, fuente: 'serie' }, 'la serie, aunque el total en vivo sea otro (49.690 M$)');
  // Con la diaria sola, todas menos «24 h» (con las finas, en su prueba).
  for (const p of t.PESTANAS.filter((x) => t.pestanaDisponible(SERIE, x.clave))) {
    const g = t.graficoPestana(SERIE, p.clave);
    assert.equal(g.puntos[g.puntos.length - 1].valor, c.valor, `${p.clave}: la línea acaba en la cifra grande`);
    assert.ok(g.estadisticas.max.valor >= c.valor, `${p.clave}: el máximo (${g.estadisticas.max.valor}) ≥ la cifra grande (${c.valor})`);
    assert.ok(g.estadisticas.min.valor <= c.valor);
  }
  // Sin serie, el total de la categoría (quien pinta lo avisa); sin nada, null.
  assert.deepEqual(t.cifraGrande(null, vivo), { valor: 49690e6, fecha: RESUMEN.fecha, fuente: 'total' });
  assert.equal(t.cifraGrande(null, null), null);
  assert.equal(t.cifraGrande({ puntos: [] }, { total: null }), null);
});

test('cabecera: «Cambio en 24 h» sale de la serie si sus dos últimos días son seguidos; si no, el de CoinGecko solo si |x| < 25 %; si no, «—»', () => {
  const u = SERIE.puntos[SERIE.puntos.length - 1], a = SERIE.puntos[SERIE.puntos.length - 2];
  const vivo = { ...RESUMEN, total: { valor: 49690e6, cambio24h: 124.415 } };
  assert.deepEqual(t.cambio24h(SERIE, vivo), { cambio: t.cambioPct(u.valor, a.valor), fuente: 'serie', desde: a.fecha, hasta: u.fecha });
  assert.equal(t.porcentaje(t.cambio24h(SERIE, vivo).cambio), '−0,1\u00a0%', 'hoy: −0,09 %, nunca el +124 %');
  const conHueco = { ...SERIE, puntos: [...SERIE.puntos.slice(0, -2), u] };
  assert.deepEqual(t.cambio24h(conHueco, vivo), { cambio: null, fuente: null, desde: null, hasta: null }, 'serie con hueco y CoinGecko disparatado: «—»');
  assert.deepEqual(t.cambio24h(conHueco, { ...vivo, total: { valor: 1, cambio24h: -0.8626 } }), { cambio: -0.8626, fuente: 'coingecko', desde: null, hasta: null });
  assert.equal(t.cambio24h(null, null).cambio, null);
});

test('el total de la categoría, con su hora («hoy» solo si es de hoy), y lo que mide el % del periodo', () => {
  const hoy = Date.parse('2026-11-11T12:00:00Z');
  const vivo = { ...RESUMEN, fuente: 'coingecko', actualizado: '2026-11-11T09:57:00.000Z', total: { valor: 49690e6, cambio24h: null } };
  assert.equal(t.esHoy('2026-11-11T09:57:00.000Z', hoy), true);
  assert.equal(t.esHoy('2026-11-10T15:25:40.000Z', hoy), false);
  assert.equal(t.cuandoDato(vivo, 'es', hoy), 'hoy, 09:57 UTC');
  assert.equal(t.cuandoDato(vivo, 'en', hoy), 'today, 09:57 UTC');
  assert.equal(t.cuandoDato({ ...vivo, actualizado: '2026-11-10T15:25:40.000Z' }, 'es', hoy), 'dato del 10/11/2026, 15:25 UTC', 'si no es de hoy, no dice «hoy»');
  assert.equal(t.cuandoDato({ ...vivo, fuente: 'foto-guardada', actualizado: '2026-11-10T15:25:40.000Z' }, 'es', hoy), 'última foto guardada, del 10/11/2026, 15:25 UTC');
  assert.equal(t.lineaTotalCategoria(SERIE, vivo, 'es', hoy),
    'Total de la categoría en CoinGecko, con todos sus tokens: 49.690\u00a0M$ (hoy, 09:57 UTC).');
  assert.equal(t.lineaTotalCategoria(SERIE, vivo, 'en', hoy), 'CoinGecko category total, all tokens: $49,690M (today, 09:57 UTC).');
  assert.equal(t.lineaTotalCategoria(null, vivo), '', 'sin serie, la cifra grande ya es ese total');
  assert.equal(t.lineaTotalCategoria(SERIE, null), '');
  assert.equal(t.explicacionCambio(), 'Mide cuánto vale en total el mercado: sube también cuando se emiten tokens nuevos. No es lo que habría ganado una inversión.');
  assert.equal(t.explicacionCambio('en'), 'It measures the total size of the market, which also grows when new tokens are issued. It is not the return on any investment.');
  assert.equal(t.subtituloCifra(SERIE), `Suma de los ${SERIE.incluidos} mayores tokens con historia completa\u00a0· ${t.fechaCorta(SERIE.puntos[SERIE.puntos.length - 1].fecha)}`);
  assert.equal(t.subtituloCifra(SERIE, 'en'), `Sum of the ${SERIE.incluidos} largest tokens with a complete history\u00a0· ${t.fechaCorta(SERIE.puntos[SERIE.puntos.length - 1].fecha, 'en')}`);
  assert.equal(t.subtituloCifra(null), 'Total de la categoría en CoinGecko, con todos sus tokens');
  // La misma cuota, con el mismo redondeo, en la nota, «Cómo se calcula» y los datos clave.
  assert.equal(t.coberturaTexto(SERIE), '86 %');
  assert.ok(t.notaCorta(SERIE).includes(t.coberturaTexto(SERIE)) && t.notaSerie(SERIE).includes(t.coberturaTexto(SERIE)));
});

test('«Cómo se calcula» dice cuántos entran a mitad del periodo elegido (13 de los 29 en 1 A y en 2026; ninguno en 1 M)', () => {
  assert.equal(t.entranAMitad(SERIE, '1a'), 13);
  assert.equal(t.entranAMitad(SERIE, 'ytd'), 13);
  assert.equal(t.entranAMitad(SERIE, '1m'), 0);
  assert.equal(t.entranAMitad({ version: 9 }, '1a'), 0);
  assert.ok(t.notaSerie(SERIE, 'es', '1a').includes(`En este periodo, 13 de los ${SERIE.incluidos} entran a mitad (desde el día en que CoinGecko los sigue).`));
  assert.ok(t.notaSerie(SERIE, 'en', '1a').includes(`In this period, 13 of the ${SERIE.incluidos} join midway (from the day CoinGecko starts tracking them).`));
  assert.ok(!/a mitad/.test(t.notaSerie(SERIE, 'es', '1m')));
  assert.ok(!/a mitad/.test(t.notaSerie(SERIE)), 'sin pestaña, sin esa frase');
});

const serieRemota = cargarLib('lib/tokenizacion-serie-remota.js', { './tokenizacion': t });
test('la app lee https://rwadar.pages.dev/datos/tokenizacion-serie.json sin cookies, la reutiliza 30 minutos y rechaza lo que no tiene forma', async () => {
  const llamadas = [];
  const texto = t.serializarSerie(SERIE);
  const responde = (status, cuerpo) => async (url, init) => { llamadas.push([url, init]); return { ok: status === 200, status, text: async () => cuerpo }; };
  serieRemota.olvidarSerie();
  let ahora = AHORA;
  assert.deepEqual(await serieRemota.cargarSerie({ fetchImpl: responde(200, texto), ahora: () => ahora }), SERIE);
  assert.equal(llamadas[0][0], 'https://rwadar.pages.dev/datos/tokenizacion-serie.json');
  assert.equal(llamadas[0][1].credentials, 'omit');
  ahora += 29 * 60000;
  await serieRemota.cargarSerie({ fetchImpl: responde(200, texto), ahora: () => ahora });
  assert.equal(llamadas.length, 1, 'dentro de 30 minutos no vuelve a preguntar');
  serieRemota.olvidarSerie();
  await assert.rejects(serieRemota.cargarSerie({ fetchImpl: responde(404, '') }), /serie_http_404/);
  await assert.rejects(serieRemota.cargarSerie({ fetchImpl: responde(200, '{"version":1}') }), /serie_forma/);
  await assert.rejects(serieRemota.cargarSerie({ fetchImpl: responde(200, 'x'.repeat(600 * 1024)) }), /serie_tamano/);
  serieRemota.olvidarSerie();
});

/* ---- «Mercado y noticias» en la app, con React aislado ---- */
const colores = new Proxy({}, { get: (_, clave) => `#${String(clave)}` });
const tema = { C: colores, F: new Proxy({}, { get: (_, c) => String(c) }), T: { seccion: {}, menor: {}, etiqueta: {}, instrumento: {} },
  R: { s: 8, m: 12, l: 16, p: 999 }, UI: { margen: 16, tactil: 48 }, pulsado: () => ({}) };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (typeof arbol !== 'object') return [arbol];
  return [arbol, ...nodos(arbol.children), ...nodos(arbol.props?.children)];
}
const textoDe = (arbol) => nodos(arbol).filter((n) => typeof n === 'string').join(' ');
function crearReact() {
  const slots = []; const efectos = []; let indice = 0;
  const react = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function') return tipo({ ...props, children: children.length > 1 ? children : children[0] });
      return { type: tipo, props: props || {}, children };
    },
    Fragment: 'Fragment',
    forwardRef: (fn) => (props) => fn(props, null),
    useSyncExternalStore: (_s, leer) => leer(),
    useState(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(inicial) { const i = indice++; if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial }; return slots[i]; },
    useCallback(fn) { indice++; return fn; },
    useMemo(fn) { indice++; return fn(); },
    useEffect(fn) { const i = indice++; if (!Object.hasOwn(slots, i)) { slots[i] = true; efectos.push(fn); } },
  };
  return { react, pintar(componente, props) { indice = 0; const arbol = componente(props); for (const fn of efectos.splice(0)) fn(); return arbol; } };
}
function cargarMercado(react) {
  const absoluto = path.join(RAIZ, 'componentes', 'MercadoBolsa.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Platform: { OS: 'android' },
    PanResponder: { create: (h) => ({ panHandlers: { onResponderGrant: h.onPanResponderGrant, onResponderMove: h.onPanResponderMove, onResponderRelease: h.onPanResponderRelease } }) } };
  for (const tipo of ['Text', 'View', 'Pressable']) nativo[tipo] = tipo;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === 'react-native-svg') return { __esModule: true, default: 'Svg', Circle: 'Circle', Defs: 'Defs', Line: 'Line', LinearGradient: 'LinearGradient', Path: 'Path', Rect: 'Rect', Stop: 'Stop', Text: 'SvgText' };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { eleccion() {}, abrir() {} } };
      if (pedido === '../lib/tokenizacion-remota') return { cargarTokenizacion: async () => { throw new Error('sin red en las pruebas'); } };
      if (pedido === '../lib/tokenizacion-serie-remota') return { cargarSerie: async () => { throw new Error('sin red en las pruebas'); } };
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    const { code } = babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] });
    modulo._compile(code, ruta);
  };
  delete require.cache[absoluto];
  try { return require(absoluto); } finally { Module._load = original; Module._extensions['.js'] = extension; }
}
const esperar = () => new Promise((r) => setTimeout(r, 0));
/* Pinta otra vez cada componente de función que haya dentro (el gráfico mide su ancho con onLayout). */
const conAncho = (arbol, ancho) => { for (const n of nodos(arbol)) if (n?.props?.onLayout) n.props.onLayout({ nativeEvent: { layout: { width: ancho, height: 240 } } }); };

const ULTIMO = SERIE.puntos[SERIE.puntos.length - 1];
const NUM = (texto) => Number(String(texto).match(/\d[\d.]*/)[0].replace(/\./g, ''));

test('la pantalla «Mercado y noticias»: la cifra grande es el final de la línea, el cambio dice qué mide, el total de la categoría debajo, pestañas, datos clave, tipos y noticias', async () => {
  const { react, pintar } = crearReact();
  const { MercadoPantalla } = cargarMercado(react);
  const enlaces = [];
  const props = { cargarVivo: async () => RESUMEN, cargarLaSerie: async () => SERIE, onAbrirEnlace: (u) => enlaces.push(u), children: 'NOTICIAS' };
  let arbol = pintar(MercadoPantalla, props);
  assert.match(textoDe(arbol), /Cargando los datos de CoinGecko…/);
  await esperar(); await esperar();
  arbol = pintar(MercadoPantalla, props);
  const texto = textoDe(arbol);
  const g = t.graficoPestana(SERIE, '1m');
  const porId = (id, a = arbol) => nodos(a).find((n) => n?.props?.testID === id);
  assert.match(texto, /Mercado de activos tokenizados/);
  // La cifra grande: el último punto de la serie (42.947 M$), no el total en vivo (49.684 M$), que va debajo con su nombre.
  const cifraVista = () => textoDe(porId('mercado-cifra')).replace(/\s+/g, ' ');
  assert.equal(cifraVista(), '42.947 M$', 'la cifra y su unidad, más pequeña');
  assert.equal(t.millones(ULTIMO.valor), '42.947\u00a0M$');
  assert.equal(textoDe(porId('mercado-subtitulo')), `Suma de los ${SERIE.incluidos} mayores tokens con historia completa\u00a0· ${t.fechaCorta(ULTIMO.fecha)}`);
  assert.ok(texto.includes(g.cambioTexto) && texto.includes('en el último mes'), 'el cambio del mes con su signo y su texto');
  assert.equal(textoDe(porId('mercado-explica')), t.explicacionCambio(), 'qué mide el %: no es una rentabilidad');
  // El total de la categoría, en gris tras la nota bajo el gráfico (en la cabecera empujaba el gráfico fuera de la primera pantalla).
  assert.equal(textoDe(porId('mercado-total-categoria')).trim(), t.lineaTotalCategoria(SERIE, RESUMEN, 'es'));
  assert.match(textoDe(porId('mercado-total-categoria')).trim(), /^Total de la categoría en CoinGecko, con todos sus tokens: 49\.684\sM\$ \(.+UTC\)\.$/);
  assert.ok(nodos(porId('mercado-nota')).includes(porId('mercado-total-categoria')), 'dentro de la nota del gráfico');
  assert.equal(textoDe(porId('mercado-nota')).replace(/\s+/g, ' '), `${t.notaCorta(SERIE)} ${t.lineaTotalCategoria(SERIE, RESUMEN, 'es')}`.replace(/\s+/g, ' '));
  const cabecera = nodos(arbol).find((n) => typeof n?.props?.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Suma de los'));
  assert.match(cabecera.props.accessibilityLabel, new RegExp(`^Suma de los ${SERIE.incluidos} mayores tokens con historia completa\\s· \\S+: 42\\.947 millones de dólares, (sube|baja|sin cambios) \\S+\\s% en el último mes$`));
  assert.ok(!porId('mercado-aviso-tokens'), '1 M: mismos tokens al principio y al final, sin aviso');
  assert.ok(!porId('mercado-serie-vieja'));
  assert.ok(texto.includes(`${{ sube: '▲', baja: '▼', igual: '=' }[g.direccion]} ${g.cambioTexto}`), 'flecha y signo: el color nunca va solo');
  const pestanas = nodos(arbol).filter((n) => n?.props?.accessibilityRole === 'tab');
  // «24 h», la primera; con la diaria sola (esta pantalla aún no lee la serie fina), desactivada.
  assert.deepEqual(pestanas.map((n) => n.props.accessibilityLabel), ['24 horas', '1 semana', '1 mes', '3 meses', '6 meses', 'En 2026', '1 año']);
  assert.deepEqual(pestanas.map((n) => textoDe(n)), ['24 h', '1 S', '1 M', '3 M', '6 M', '2026', '1 A'], '«2026» en lugar de «YTD»');
  assert.deepEqual(pestanas.map((n) => n.props.accessibilityState.selected), [false, false, true, false, false, false, false]);
  assert.deepEqual(pestanas.map((n) => !!n.props.accessibilityState.disabled), [true, false, false, false, false, false, false]);
  assert.ok(nodos(arbol).some((n) => n?.props?.accessibilityRole === 'tablist'));
  // Datos clave: dos cifras con su nombre; 24 h de la serie (−0,1 %, nunca el +124 % de CoinGecko).
  const claves = nodos(arbol).filter((n) => n?.props?.style?.[0]?.width === '47%').map((n) => n.props.accessibilityLabel);
  assert.deepEqual(claves.map((c) => c.split(':')[0]), [`Valor hoy (${SERIE.incluidos} mayores)`, 'Total de la categoría hoy', 'Cambio en 24 h', 'Máximo del periodo',
    'Mínimo del periodo', 'Tokens en el gráfico', 'El tipo que más pesa']);
  assert.equal(claves[0], `Valor hoy (${SERIE.incluidos} mayores): 42.947\u00a0M$: ${t.fechaCorta(ULTIMO.fecha)}`);
  assert.equal(claves[1], 'Total de la categoría hoy: 49.684\u00a0M$: todos los tokens · CoinGecko');
  assert.equal(claves[2], `Cambio en 24 h: ▼ −0,1\u00a0%: ${SERIE.incluidos} mayores`);
  assert.equal(claves[5], `Tokens en el gráfico: ${SERIE.incluidos}: 86 % del total`, 'el mismo 86 % que la nota');
  assert.ok(NUM(claves[3].split(': ')[1]) >= NUM(claves[0].split(': ')[1]), 'el máximo del periodo no es menor que el valor de hoy');
  assert.match(texto, /Por tipo de activo/);
  const tipos = porId('mercado-tipos');
  assert.equal(tipos.props.accessibilityState.expanded, false, 'los tipos, plegados: las noticias quedan más arriba');
  assert.match(textoDe(tipos), /^Ver los 8 tipos ▾\s+Crédito privado 55,6\s%…$/);
  assert.match(texto, /Noticias relacionadas/);
  assert.match(texto, /NOTICIAS/, 'las noticias van debajo, en la misma pantalla');
  assert.ok(texto.includes(t.notaCorta(SERIE)), 'la nota corta del gráfico, a la vista');
  assert.ok(!texto.includes(t.notaSerie(SERIE, 'es', '1m')), 'el resto, plegado');
  const como = porId('mercado-como');
  assert.equal(como.props.accessibilityState.expanded, false);
  como.props.onPress();
  tipos.props.onPress();
  arbol = pintar(MercadoPantalla, props);
  assert.ok(textoDe(arbol).includes(t.notaSerie(SERIE, 'es', '1m')), '«Cómo se calcula» despliega la nota entera');
  assert.equal(porId('mercado-como').props.accessibilityState.expanded, true);
  assert.equal(nodos(arbol).filter((n) => /^(Crédito privado|Letras del Tesoro): /.test(n?.props?.accessibilityLabel || '')).length, 2, 'desplegados, los tipos');
  const fuente = nodos(arbol).find((n) => n?.props?.accessibilityRole === 'link');
  assert.equal(fuente.props.accessibilityLabel, `En millones de dólares (M$). Datos: CoinGecko · serie diaria hasta el ${t.fechaCorta(ULTIMO.fecha)} · total de la categoría: ${t.cuandoDato(RESUMEN, 'es')}`);
  fuente.props.onPress();
  assert.deepEqual(enlaces, ['https://www.coingecko.com/']);
  // La cruz en el último día dice la cifra grande; en cada pestaña, el máximo es ≥ la cifra grande.
  conAncho(arbol, 358);
  arbol = pintar(MercadoPantalla, props);
  nodos(arbol).find((n) => n?.props?.accessibilityRole === 'adjustable').props.onResponderGrant({ nativeEvent: { locationX: 10000 } });
  arbol = pintar(MercadoPantalla, props);
  const burbuja = nodos(arbol).find((n) => n?.props?.importantForAccessibility === 'no-hide-descendants' && n.type === 'View');
  assert.ok(textoDe(burbuja).replace(/\s+/g, ' ').includes(cifraVista()), `la burbuja del último día (${textoDe(burbuja)}) = la cifra grande (${cifraVista()})`);
  for (let i = 0; i < t.PESTANAS.length; i++) {
    nodos(arbol).filter((n) => n?.props?.accessibilityRole === 'tab')[i].props.onPress();
    arbol = pintar(MercadoPantalla, props);
    const max = nodos(arbol).find((n) => n?.props?.accessibilityLabel?.startsWith?.('Máximo del periodo:')).props.accessibilityLabel;
    assert.ok(NUM(max.split(': ')[1]) >= NUM(cifraVista()), `${t.PESTANAS[i].clave}: ${max} ≥ ${cifraVista()}`);
  }
  // 2026 y 1 A: de 16 a 29 tokens. El aviso, a la vista y para el lector; «Cómo se calcula» dice cuántos entran a mitad.
  const g1a = t.graficoPestana(SERIE, '1a');
  assert.ok(textoDe(arbol).includes('en el último año'));
  const aviso = porId('mercado-aviso-tokens');
  assert.equal(textoDe(aviso), g1a.avisoTokens.charAt(0).toUpperCase() + g1a.avisoTokens.slice(1) + '.');
  assert.match(textoDe(aviso), /^De 16 a 29 tokens: parte de la subida son tokens nuevos\.$/);
  assert.ok(nodos(arbol).find((n) => n?.props?.accessibilityLabel?.startsWith?.('Suma de los')).props.accessibilityLabel.endsWith('. De 16 a 29 tokens: parte de la subida son tokens nuevos'));
  assert.ok(textoDe(arbol).includes('En este periodo, 13 de los 29 entran a mitad'));
  conAncho(arbol, 358);
  arbol = pintar(MercadoPantalla, props);
  assert.ok(nodos(arbol).some((n) => n?.props?.testID === 'mercado-puente'), 'el hueco del 29/07 se une con un trazo de puntos');
  assert.deepEqual(nodos(arbol).filter((n) => n?.props?.accessibilityRole === 'tab').map((n) => n.props.accessibilityState.selected), [false, false, false, false, false, false, true]);
});

test('la serie vieja (más de 3 días antes del dato de hoy): la cifra grande y el cambio son de su último día, y la pantalla y la tarjeta lo dicen', async () => {
  const fin = ULTIMO.fecha;
  const tarde = { ...RESUMEN, actualizado: new Date(Date.parse(fin + 'T00:00:00Z') + 5 * DIA).toISOString() };
  const props = { cargarVivo: async () => tarde, cargarLaSerie: async () => SERIE };
  for (const nombre of ['MercadoPantalla', 'MercadoCotizacion']) {
    const { react, pintar } = crearReact();
    const Componente = cargarMercado(react)[nombre];
    pintar(Componente, props);
    await esperar(); await esperar();
    const arbol = pintar(Componente, props);
    const texto = textoDe(arbol), g = t.graficoPestana(SERIE, '1m');
    assert.ok(texto.includes(g.cambioTexto), `${nombre}: el cambio cuadra con la cifra (las dos son de la serie)`);
    assert.ok(texto.includes(nombre === 'MercadoPantalla' ? `La serie llega hasta el ${t.fechaCorta(fin)}: la cifra grande y el gráfico son de ese día.` : `serie hasta el ${t.fechaCorta(fin)}`), nombre);
    assert.match(texto, /42\.947/, 'la cifra grande es la del último día de la serie');
  }
});

test('el gráfico de la app: área con degradado, línea, eje a la derecha con el último valor en una píldora, fechas abajo, línea de partida y la cruz (solo vertical) al arrastrar o con el lector', (ctx) => {
  ctx.mock.timers.enable({ apis: ['setTimeout'] });
  const { react, pintar } = crearReact();
  const { GraficoBolsa } = cargarMercado(react);
  const g = t.graficoPestana(SERIE, '1m');
  let arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  conAncho(arbol, 358);
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  const raiz = nodos(arbol).find((n) => n?.props?.accessibilityRole === 'adjustable');
  assert.ok(raiz, 'ajustable: el lector de pantalla recorre los días');
  assert.match(raiz.props.accessibilityLabel, /^Gráfico del mercado\. Suma de los \d+ mayores tokens, último mes: de /);
  assert.equal(raiz.props.accessibilityValue.text, `${t.fechaCorta(g.puntos.at(-1).fecha)}: ${t.millonesHablados(g.puntos.at(-1).valor)}`);
  assert.equal(raiz.props.style.height, 270, 'con la franja de 40 px para la burbuja');
  const caminos = nodos(arbol).filter((n) => n?.type === 'Path');
  assert.equal(caminos.length, 2, 'el área y la línea');
  assert.equal(caminos[0].props.fill, 'url(#mkDeg)');
  assert.equal(caminos[1].props.strokeWidth, 2);
  assert.equal(nodos(arbol).filter((n) => n?.type === 'Stop').length, 3, 'el degradado con una parada intermedia');
  const textosEje = nodos(arbol).filter((n) => n?.type === 'SvgText').map((n) => textoDe(n.children));
  // El último valor, en su píldora; las marcas que chocarían con ella no se escriben.
  const pildora = nodos(arbol).find((n) => n?.props?.testID === 'mercado-ultimo');
  assert.ok(pildora && pildora.type === 'Rect');
  assert.ok(textosEje.includes('42.947'), 'la píldora dice la cifra grande');
  const yUltimo = pildora.props.y + 9;
  const escritas = g.marcasValores.filter((m) => textosEje.includes(m.texto));
  assert.ok(escritas.length >= 3 && escritas.length < g.marcasValores.length + 1);
  assert.ok(!textosEje.includes('43.000'), 'la marca de 43.000, junto a la píldora (42.947), no se escribe encima');
  for (const m of g.marcasFechas) assert.ok(textosEje.includes(m.texto), m.texto);
  assert.ok(textosEje.includes('M$'));
  void yUltimo;
  const suelo = nodos(arbol).find((n) => n?.type === 'Line' && n.props.stroke === 'rgba(255,255,255,0.16)');
  assert.ok(suelo.props.x2 < 358 - 50, 'el suelo acaba donde el dibujo: no tacha la marca más baja');
  assert.ok(nodos(arbol).some((n) => n?.type === 'Line' && n.props.strokeDasharray === '2 4'), 'la línea de puntos del valor de partida');
  assert.ok(!nodos(arbol).some((n) => n?.type === 'Circle'), 'sin cruz hasta que se toca');
  const lineasAntes = nodos(arbol).filter((n) => n?.type === 'Line').length;
  // Arrastre: la cruz con la fecha y el valor del punto más cercano.
  raiz.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.ok(nodos(arbol).some((n) => n?.type === 'Circle'));
  assert.equal(nodos(arbol).filter((n) => n?.type === 'Line').length, lineasAntes + 1, 'la cruz es solo una raya vertical');
  assert.ok(textoDe(arbol).includes(t.fechaCorta(g.puntos[0].fecha)) && textoDe(arbol).includes(t.millones(g.puntos[0].valor)));
  assert.ok(nodos(arbol).some((n) => n?.type === 'Text' && /^0,0\s%$/.test(textoDe(n))), 'la burbuja, en una línea: fecha · valor · cambio');
  assert.doesNotMatch(textoDe(arbol), /desde el inicio/);
  // El lector: «subir» avanza un día.
  nodos(arbol).find((n) => n?.props?.accessibilityRole === 'adjustable').props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.equal(nodos(arbol).find((n) => n?.props?.accessibilityRole === 'adjustable').props.accessibilityValue.text,
    `${t.fechaCorta(g.puntos[1].fecha)}: ${t.millonesHablados(g.puntos[1].valor)}`);
  raiz.props.onResponderRelease();
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.ok(nodos(arbol).some((n) => n?.type === 'Circle'), 'al soltar, la cruz se queda para poder leerla (un toque corto no se pierde)');
  ctx.mock.timers.tick(2999);
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.ok(nodos(arbol).some((n) => n?.type === 'Circle'));
  ctx.mock.timers.tick(1);
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.ok(!nodos(arbol).some((n) => n?.type === 'Circle'), 'a los 3 s, la cruz se va');
  // Otro toque antes de los 3 s la mueve y vuelve a contar.
  raiz.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
  raiz.props.onResponderRelease();
  ctx.mock.timers.tick(2000);
  raiz.props.onResponderGrant({ nativeEvent: { locationX: 0 } });
  raiz.props.onResponderRelease();
  ctx.mock.timers.tick(2000);
  arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
  assert.ok(nodos(arbol).some((n) => n?.type === 'Circle'), 'el segundo toque reinicia los 3 s');
  // Con muchos puntos, la línea algo más fina.
  const { react: r2, pintar: p2 } = crearReact();
  const G2 = cargarMercado(r2).GraficoBolsa;
  const g1a = t.graficoPestana(SERIE, '1a');
  let a2 = p2(G2, { g: g1a, idioma: 'es' });
  conAncho(a2, 358);
  a2 = p2(G2, { g: g1a, idioma: 'es' });
  assert.equal(nodos(a2).filter((n) => n?.type === 'Path' && n.props.fill === 'none' && !n.props.strokeDasharray)[0].props.strokeWidth, 1.5);
});

test('la tarjeta de Inicio: la misma cifra que el final de su minigráfico, «Los 29 mayores · CoinGecko», cambio del mes y lo que mide; al tocar abre la pantalla. En inglés, en su formato', async () => {
  for (const lengua of ['es', 'en']) {
    idioma.cambiarIdioma(lengua);
    try {
      const { react, pintar } = crearReact();
      const { MercadoCotizacion } = cargarMercado(react);
      let abierta = 0;
      const props = { cargarVivo: async () => RESUMEN, cargarLaSerie: async () => SERIE, onAbrir: () => { abierta++; } };
      pintar(MercadoCotizacion, props);
      await esperar(); await esperar();
      const arbol = pintar(MercadoCotizacion, props);
      const g = t.graficoPestana(SERIE, '1m', lengua);
      const tarjeta = nodos(arbol).find((n) => n?.props?.testID === 'mercado-cotizacion');
      assert.ok(tarjeta);
      const texto = textoDe(arbol);
      assert.ok(texto.includes(lengua === 'en' ? 'Tokenised assets' : 'Activos tokenizados'));
      assert.ok(texto.includes(lengua === 'en' ? `${SERIE.incluidos} largest · CoinGecko` : `Los ${SERIE.incluidos} mayores · CoinGecko`));
      assert.doesNotMatch(texto, /Mercado mundial|Global market/);
      assert.equal(g.puntos[g.puntos.length - 1].valor, ULTIMO.valor);
      assert.ok(texto.includes(t.millones(ULTIMO.valor, lengua)), 'la cifra del final del minigráfico');
      assert.ok(!texto.includes(t.millones(RESUMEN.total.valor, lengua)), 'y no el total de la categoría');
      assert.ok(texto.includes(g.cambioTexto) && texto.includes(lengua === 'en' ? 'past month' : 'último mes'));
      assert.ok(texto.includes(t.explicacionCambio(lengua)), 'qué mide el %, también en Inicio');
      assert.ok(nodos(arbol).some((n) => n?.type === 'Svg'), 'el minigráfico del mes');
      assert.match(tarjeta.props.accessibilityLabel, lengua === 'en'
        ? new RegExp(`^Tokenised asset market, sum of the ${SERIE.incluidos} largest tokens: 42,947 million dollars, (up|down|unchanged) \\S+ past month\\. See the chart$`)
        : new RegExp(`^Mercado de activos tokenizados, suma de los ${SERIE.incluidos} mayores tokens: 42\\.947 millones de dólares, (sube|baja|sin cambios) \\S+\\s% en el último mes\\. Ver el gráfico$`));
      tarjeta.props.onPress();
      assert.equal(abierta, 1);
    } finally { idioma.cambiarIdioma('es'); }
  }
});

test('sin red: la cotización y la pantalla lo dicen y ofrecen reintentar, sin ninguna cifra; sin serie, la cifra de hoy sigue', async () => {
  const { react, pintar } = crearReact();
  const { MercadoCotizacion, MercadoPantalla } = cargarMercado(react);
  let intentos = 0;
  const props = { cargarVivo: async () => { intentos++; throw new Error('sin red'); }, cargarLaSerie: async () => { throw new Error('sin red'); } };
  pintar(MercadoCotizacion, props);
  await esperar(); await esperar();
  let arbol = pintar(MercadoCotizacion, props);
  assert.match(textoDe(arbol), /Ahora no podemos mostrar los datos de CoinGecko\./);
  assert.doesNotMatch(textoDe(arbol), /M\$/);
  nodos(arbol).find((n) => n?.props?.accessibilityLabel === 'Reintentar').props.onPress();
  await esperar(); await esperar();
  assert.equal(intentos, 2);
  const otro = crearReact();
  const Pantalla = cargarMercado(otro.react).MercadoPantalla;
  const p2 = { cargarVivo: async () => RESUMEN, cargarLaSerie: async () => { throw new Error('sin red'); } };
  otro.pintar(Pantalla, p2);
  await esperar(); await esperar();
  arbol = otro.pintar(Pantalla, p2);
  assert.match(textoDe(arbol), /49\.684/);
  assert.match(textoDe(arbol), /El gráfico no está disponible ahora\. La cifra de hoy sí\./);
  void MercadoPantalla;
});

test('Inicio une «Mercado y noticias» tras «Ofertas»: la cotización, las 3 noticias y «Ver mercado y noticias →»; la pantalla lleva las noticias', () => {
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes/Inicio.js'), 'utf8');
  assert.match(inicio, /import \{ MercadoCotizacion, MercadoPantalla \} from '\.\/MercadoBolsa';/);
  const ofertas = inicio.indexOf('<RecienAnadidas'), cot = inicio.indexOf('<MercadoCotizacion'), nt = inicio.indexOf('<NoticiasSector modo="compacta"'), ap = inicio.indexOf("abrir('aprende')");
  assert.ok(ofertas > 0 && cot > ofertas && nt > cot && ap > nt);
  assert.doesNotMatch(inicio, /TokenizacionMundo|seccion === 'noticias'/);
  assert.match(inicio, /<MercadoPantalla onAbrirEnlace=\{onAbrirEnlace\}>\s*<NoticiasSector modo="lista" abrirId=\{noticiaId\} onAbrirEnlace=\{onAbrirEnlace\} \/>\s*<\/MercadoPantalla>/);
  assert.match(inicio, /onAbrir=\{\(noticia\) => abrir\('mercado', \{ noticia: noticia\?\.id \|\| null \}\)\}/);
});

test('revisión final (11/11/2026): el punto del último día no toca la píldora, los datos clave sin Mono y un tipo sin cambio lo dice con palabras', async () => {
  // El punto de la cruz en el último día, con su borde, acaba antes de la píldora del último valor.
  {
    const { react, pintar } = crearReact();
    const { GraficoBolsa } = cargarMercado(react);
    const g = t.graficoPestana(SERIE, '1a');
    let arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
    conAncho(arbol, 358);
    arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
    nodos(arbol).find((n) => n?.props?.accessibilityRole === 'adjustable').props.onResponderGrant({ nativeEvent: { locationX: 10000 } });
    arbol = pintar(GraficoBolsa, { g, idioma: 'es' });
    const punto = nodos(arbol).find((n) => n?.type === 'Circle'), pildora = nodos(arbol).find((n) => n?.props?.testID === 'mercado-ultimo');
    const borde = punto.props.cx + punto.props.r + punto.props.strokeWidth / 2;
    assert.ok(borde + 3 <= pildora.props.x, `el punto acaba en ${borde} y la píldora empieza en ${pildora.props.x}`);
  }
  const { react, pintar } = crearReact();
  const { MercadoPantalla } = cargarMercado(react);
  const vivo = { ...RESUMEN, tipos: RESUMEN.tipos.map((x, i) => (i === 0 ? { ...x, cambio24h: null } : x)) };
  const props = { cargarVivo: async () => vivo, cargarLaSerie: async () => SERIE };
  pintar(MercadoPantalla, props);
  await esperar(); await esperar();
  let arbol = pintar(MercadoPantalla, props);
  // Las cifras de los datos clave y de los tipos, en la letra de la cabecera (en Mono, «−0,1 %» se leía espaciado).
  const estilos = nodos(arbol).filter((n) => n?.type === 'Text' && Array.isArray(n.props?.style)).map((n) => n.props.style[0]).filter(Boolean);
  assert.ok(estilos.length > 0);
  for (const st of estilos) assert.notEqual(st.fontFamily, 'GeistMono_500Medium', JSON.stringify(st));
  nodos(arbol).find((n) => n?.props?.testID === 'mercado-tipos').props.onPress();
  arbol = pintar(MercadoPantalla, props);
  const primero = nodos(arbol).find((n) => n?.props?.accessibilityLabel?.startsWith?.('Crédito privado: '));
  assert.match(textoDe(primero), /Sin dato en 24 h/, 'sin cambio, con palabras: no un «—» suelto');
  assert.doesNotMatch(textoDe(primero), /—/);
  assert.doesNotMatch(textoDe(nodos(arbol).find((n) => n?.props?.testID === 'mercado-tipos')), /Crédito privado/, 'con la lista abierta, sin avance');
});
