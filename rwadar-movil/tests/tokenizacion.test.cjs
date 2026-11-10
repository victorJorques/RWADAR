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

/* ---- La sección, con React aislado ---- */
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
    forwardRef: (fn) => (props) => fn(props, null),
    useSyncExternalStore: (_s, leer) => leer(),
    useState(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(inicial) { const i = indice++; if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial }; return slots[i]; },
    useCallback(fn) { indice++; return fn; },
    useEffect(fn) { const i = indice++; if (!Object.hasOwn(slots, i)) { slots[i] = true; efectos.push(fn); } },
  };
  return { react, pintar(componente, props) { indice = 0; const arbol = componente(props); for (const fn of efectos.splice(0)) fn(); return arbol; } };
}
function cargarSeccion(react) {
  const absoluto = path.join(RAIZ, 'componentes', 'TokenizacionMundo.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Platform: { OS: 'android' } };
  for (const tipo of ['Text', 'View', 'Pressable']) nativo[tipo] = tipo;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === 'react-native-svg') return { __esModule: true, default: 'Svg', Circle: 'Circle', Path: 'Path', Polyline: 'Polyline' };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { eleccion() {}, abrir() {} } };
      if (pedido === '../lib/tokenizacion-remota') return { cargarTokenizacion: async () => { throw new Error('sin red en las pruebas'); } };
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    const { code } = babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] });
    modulo._compile(code, ruta);
  };
  delete require.cache[absoluto];
  try { return require(absoluto).default; } finally { Module._load = original; Module._extensions['.js'] = extension; }
}
const esperar = () => new Promise((r) => setTimeout(r, 0));

test('Inicio en la app: cargando, después la cifra, los periodos, las barras y «Datos: CoinGecko» con su hora', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const enlaces = [];
  const props = { cargar: async () => RESUMEN, onAbrirEnlace: (u) => enlaces.push(u) };
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Cargando los datos de CoinGecko…/);
  assert.match(textoDe(arbol), /Datos:.*CoinGecko/, 'la atribución se ve siempre');
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  const texto = textoDe(arbol);
  assert.match(texto, /La tokenización en el mundo/);
  assert.match(texto, /49\.684/);
  assert.match(texto, /−0,9 %/);
  assert.match(texto, /disponible el/);
  assert.match(texto, /15\/11/, 'cuándo llegarán los 7 días');
  assert.match(texto, /en millones de dólares \(M\$\)/);
  assert.match(texto, /Crédito privado/);
  assert.match(texto, /Inmuebles/);
  assert.match(texto, /De ello, oro:/);
  assert.match(texto, /10\/11\/2026, 15:25 UTC/);
  assert.match(texto, /La línea de evolución aparecerá cuando haya dos fotos diarias guardadas\./);
  assert.match(texto, /Las categorías pueden solaparse\. No es una recomendación\./);
  const periodos = nodos(arbol).filter((n) => n?.type === 'View' && n.props.accessible && /^(24 h|7 días|30 días|1 año|Histórico): /.test(n.props.accessibilityLabel));
  assert.deepEqual(periodos.map((n) => n.props.accessibilityLabel), ['24 h: baja −0,9 %', '7 días: disponible el 15/11/2026',
    '30 días: disponible el 08/12/2026', '1 año: disponible el 08/11/2027', 'Histórico: disponible el 11/11/2026']);
  const total = nodos(arbol).find((n) => n?.type === 'View' && /^Valor total de los activos tokenizados: /.test(n.props.accessibilityLabel || ''));
  assert.equal(total.props.accessibilityLabel, 'Valor total de los activos tokenizados: 49.684 millones de dólares');
  const enlace = nodos(arbol).find((n) => n?.type === 'Pressable' && n.props.accessibilityRole === 'link');
  assert.match(enlace.props.accessibilityLabel, /^Datos: CoinGecko · Dato del 10\/11\/2026, 15:25 UTC$/);
  enlace.props.onPress();
  assert.deepEqual(enlaces, ['https://www.coingecko.com/']);
});

test('Inicio en la app: con la red caída la sección lo dice y ofrece reintentar; nunca lanza', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  let intentos = 0;
  const props = { cargar: async () => { intentos++; if (intentos === 1) throw new Error('sin red'); return RESUMEN; } };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Ahora no podemos mostrar los datos de CoinGecko\./);
  assert.doesNotMatch(textoDe(arbol), /M\$/, 'sin datos no hay ninguna cifra');
  const reintentar = nodos(arbol).find((n) => n?.type === 'Pressable' && n.props.accessibilityLabel === 'Reintentar');
  reintentar.props.onPress();
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  assert.equal(intentos, 2);
  assert.match(textoDe(arbol), /49\.684/);
});

test('Inicio en la app: en inglés, cifras en su formato y etiquetas accesibles en inglés', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const props = { cargar: async () => RESUMEN };
    pintar(Seccion, props); await esperar(); await esperar();
    const arbol = pintar(Seccion, props);
    const texto = textoDe(arbol);
    assert.match(texto, /Tokenisation worldwide/);
    assert.match(texto, /\$49,684M/);
    assert.match(texto, /Private credit/);
    assert.match(texto, /available on/);
    assert.match(texto, /All time/);
    assert.match(texto, /10 Nov 2026, 15:25 UTC/);
    const total = nodos(arbol).find((n) => n?.type === 'View' && /^Total value of tokenised assets: /.test(n.props.accessibilityLabel || ''));
    assert.equal(total.props.accessibilityLabel, 'Total value of tokenised assets: 49,684 million dollars');
    const periodos = nodos(arbol).filter((n) => n?.type === 'View' && n.props.accessible && /^(24 h|7 days|All time): /.test(n.props.accessibilityLabel));
    assert.deepEqual(periodos.map((n) => n.props.accessibilityLabel), ['24 h: down −0.9%', '7 days: available on 15 Nov 2026', 'All time: available on 11 Nov 2026']);
    assert.equal(total.props.accessibilityLanguage, 'en-US');
  } finally { await idioma.cambiarIdioma('es'); }
});

/* Un resumen con varias fotos guardadas y CoinGecko caído. */
const RESUMEN_GUARDADO = (() => {
  const f = t.extraerFoto(COINGECKO, { ahora: AHORA });
  const dia = (fecha, factor) => ({ ...f, fecha, actualizado: fecha + 'T06:20:00.000Z', total: { ...f.total, valor: Math.round(f.total.valor * factor) } });
  const h = historico(dia('2026-10-01', 0.95), dia('2026-10-26', 0.98), dia('2026-11-01', 0.99), f);
  return t.resumir({ historico: h });
})();

test('Inicio en la app: con la foto guardada, el aviso con su fecha, «24 h» dice de qué día y cada periodo «desde» qué foto', async () => {
  assert.equal(RESUMEN_GUARDADO.fuente, 'foto-guardada');
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => RESUMEN_GUARDADO };
  pintar(Seccion, props); await esperar(); await esperar();
  const arbol = pintar(Seccion, props);
  const texto = textoDe(arbol);
  assert.match(texto, /CoinGecko no responde ahora\. Enseñamos la última foto guardada, del\s+10\/11\/2026, 15:25 UTC/);
  assert.match(texto, /7 días \+1,0\s%\s▲\s+sube\s+desde\s+01\/11/);
  const periodos = nodos(arbol).filter((n) => n?.type === 'View' && n.props.accessible && /^(24 h|7 días|30 días|1 año|Histórico): /.test(n.props.accessibilityLabel));
  const etiquetas = periodos.map((n) => n.props.accessibilityLabel);
  if (new Date().toISOString().slice(0, 10) !== '2026-11-10') assert.equal(etiquetas[0], '24 h: baja −0,9 %, foto del 10/11/2026');
  else assert.equal(etiquetas[0], '24 h: baja −0,9 %');
  assert.equal(etiquetas[1], '7 días: sube +1,0 %, desde 01/11/2026', 'con ±2 días, «7 días» puede ser 9: se dice');
  assert.equal(etiquetas[2], '30 días: aún sin datos', 'la fecha de llegada ya pasó: no se promete nada');
  assert.equal(etiquetas[4], 'Histórico: sube +5,3 %, desde 01/10/2026');
  const enlace = nodos(arbol).find((n) => n?.type === 'Pressable' && n.props.accessibilityRole === 'link');
  assert.match(enlace.props.accessibilityLabel, /Foto guardada del 10\/11\/2026, 15:25 UTC$/);
});

test('Inicio en la app: con dos o más fotos dibuja la línea (sin relleno) al ancho medido y escribe la escala', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => RESUMEN_GUARDADO };
  pintar(Seccion, props); await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  const caja = nodos(arbol).find((n) => n?.type === 'View' && typeof n.props.onLayout === 'function');
  assert.ok(caja, 'la línea mide su caja');
  assert.equal(caja.props.accessibilityLabel, 'Valor total del 01/10/2026 al 10/11/2026: de 47.199 M$ a 49.684 M$, +5,3 %, 4 fotos diarias');
  caja.props.onLayout({ nativeEvent: { layout: { width: 320 } } });
  arbol = pintar(Seccion, props);
  const tipos = nodos(arbol).map((n) => n?.type);
  assert.ok(tipos.includes('Svg') && tipos.includes('Polyline') && tipos.includes('Circle'));
  assert.ok(!tipos.includes('Path'), 'sin área rellena hasta el suelo');
  const linea = nodos(arbol).find((n) => n?.type === 'Polyline');
  const ys = linea.props.points.split(' ').map((p) => Number(p.split(',')[1]));
  assert.equal(ys.length, 4);
  assert.ok(ys.every((y) => y >= 8 && y <= 104));
  assert.match(textoDe(arbol), /De 47\.199 M\$ \(01\/10\/2026\) a 49\.684 M\$ \(10\/11\/2026\) · \+5,3 %/);
});

test('Inicio en la app: sin datos («sin-datos») ofrece «Reintentar» y no enseña ninguna cifra', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const vacio = t.resumir({ historico: t.historicoVacio() });
  assert.equal(vacio.fuente, 'sin-datos');
  const props = { cargar: async () => vacio };
  pintar(Seccion, props); await esperar(); await esperar();
  const arbol = pintar(Seccion, props);
  assert.ok(nodos(arbol).some((n) => n?.type === 'Pressable' && n.props.accessibilityLabel === 'Reintentar'));
  assert.match(textoDe(arbol), /Ahora no podemos mostrar los datos de CoinGecko\./);
  assert.doesNotMatch(textoDe(arbol), /\d/, 'ningún dígito');
});

test('Inicio pinta la sección justo después de «Recién añadidas» y le pasa el abridor de enlaces', () => {
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes/Inicio.js'), 'utf8');
  assert.match(inicio, /import TokenizacionMundo from '\.\/TokenizacionMundo';/);
  const recien = inicio.indexOf('<RecienAnadidas'), seccion = inicio.indexOf('<TokenizacionMundo onAbrirEnlace={onAbrirEnlace} />');
  assert.ok(recien > 0 && seccion > recien && seccion < inicio.indexOf('{tarjetaAvisos}'));
});
