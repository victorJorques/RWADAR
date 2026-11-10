'use strict';

/* «Noticias del sector» (10/11/2026): el motor compartido (forma, orden,
   textos por idioma e ilustraciones), la lectura de /datos/noticias.json y
   la sección de Inicio con React aislado. Sin red: las noticias son las
   verificadas del ciclo del 10/11/2026 (rwadar-site/datos/noticias.json). */
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
const m = require('../lib/noticias-sector');

const RAIZ = path.resolve(__dirname, '..');
const TEXTO = fs.readFileSync(path.join(RAIZ, '../rwadar-site/datos/noticias.json'), 'utf8');
const ARCHIVO = JSON.parse(TEXTO);
const copia = () => JSON.parse(TEXTO);

test('el archivo publicado tiene la forma: 8 noticias, las de hoy primero y de la más nueva a la más antigua', () => {
  const d = m.validarNoticias(ARCHIVO);
  assert.equal(d.actualizadoEl, '2026-11-10');
  assert.equal(d.noticias.length, 8);
  assert.deepEqual(d.noticias.map(n => n.seccion), ['hoy', 'hoy', 'hoy', 'importante', 'importante', 'importante', 'importante', 'importante']);
  assert.deepEqual(d.noticias.map(n => n.id), ARCHIVO.noticias.map(n => n.id), 'el archivo ya viene en ese orden');
  // Ninguna noticia se reescribe: los textos son los del archivo, letra a letra.
  for (const [i, n] of d.noticias.entries()) {
    const o = ARCHIVO.noticias[i];
    for (const k of ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo']) assert.equal(n[k], o[k]);
    for (const k of ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo']) assert.equal(n.en[k], o.en[k]);
    assert.deepEqual(n.fuente, o.fuente);
    assert.match(n.fuente.url, /^https:\/\//);
  }
  // Los titulares en castellano caben en 70 caracteres, como pidió Víctor.
  assert.ok(d.noticias.every(n => [...n.titulo].length <= 70));
});

test('una noticia mal formada no pasa: campos de más o de menos, fechas, categorías, enlaces y marcado', () => {
  const roto = (cambio) => { const d = copia(); cambio(d); return () => m.validarNoticias(d); };
  assert.throws(roto(d => { d.version = 2; }), /versión/);
  assert.throws(roto(d => { d.extra = 1; }), /forma inesperada/);
  assert.throws(roto(d => { d.noticias = []; }), /entre 1 y 24/);
  assert.throws(roto(d => { d.noticias[0].foto = 'https://x.test/a.jpg'; }), /forma inesperada/);
  assert.throws(roto(d => { delete d.noticias[0].porQueImporta; }), /falta «porQueImporta»/);
  assert.throws(roto(d => { delete d.noticias[1].en.titulo; }), /falta «titulo»/);
  assert.throws(roto(d => { d.noticias[0].categoria = 'cripto'; }), /categoría desconocida/);
  assert.throws(roto(d => { d.noticias[0].ambito = 'EEUU'; }), /ámbito desconocido/);
  assert.throws(roto(d => { d.noticias[0].seccion = 'portada'; }), /sección desconocida/);
  assert.throws(roto(d => { d.noticias[0].fecha = '2026-02-30'; }), /fecha no válida/);
  assert.throws(roto(d => { d.noticias[0].fecha = '2026-11-11'; }), /posterior a la actualización/);
  assert.throws(roto(d => { d.noticias[2].consultadaEl = '2026-11-01'; }), /consultada antes/);
  assert.throws(roto(d => { d.noticias[0].titulo = '<img src=x onerror=alert(1)>'; }), /caracteres no permitidos/);
  assert.throws(roto(d => { d.noticias[0].titulo = 'x'.repeat(81); }), /más de 80/);
  assert.throws(roto(d => { d.noticias[0].titulo = ' Con espacio'; }), /espacios sobrantes/);
  assert.throws(roto(d => { d.noticias[0].fuente.url = 'http://www.cnmv.es/'; }), /no es https/);
  assert.throws(roto(d => { d.noticias[0].fuente.url = 'javascript:alert(1)'; }), /no es https/);
  assert.throws(roto(d => { d.noticias[0].fuente.url = 'https://usuario:clave@cnmv.es/'; }), /no es https/);
  assert.throws(roto(d => { d.noticias[0].fuente.tipo = 'blog'; }), /tipo de fuente/);
  assert.throws(roto(d => { d.noticias[1].id = d.noticias[0].id; }), /id repetido/);
  assert.throws(roto(d => { d.noticias[0].id = 'Con Mayúsculas'; }), /id no válido/);
  assert.equal(m.noticiasValidas({}), false);
  assert.equal(m.noticiasValidas(ARCHIVO), true);
});

test('textos y fechas en el idioma elegido: los campos «en» en inglés', () => {
  const n = m.validarNoticias(ARCHIVO).noticias[0];
  assert.equal(m.textos(n).titulo, 'Clones de XTB y PJT: la CNMV alerta de 9 webs y apps sin licencia');
  assert.equal(m.textos(n, 'en').titulo, 'XTB and PJT clones: Spain’s CNMV flags 9 unlicensed sites and apps');
  assert.equal(m.textos(n, 'en').porQueImporta, ARCHIVO.noticias[0].en.porQueImporta);
  assert.equal(m.fechaCorta('2026-11-10'), '10/11/2026');
  assert.equal(m.fechaCorta('2026-11-10', 'en'), '10 Nov 2026');
  assert.equal(m.fechaBreve('2026-11-10'), '10/11');
  assert.equal(m.fechaBreve('2026-11-10', 'en'), '10 Nov');
  assert.deepEqual(Object.keys(m.CATEGORIAS).map(c => m.etiquetaCategoria(c, 'en')), ['Regulation', 'Market', 'Product', 'Risk']);
  assert.deepEqual(Object.keys(m.AMBITOS).map(a => m.etiquetaAmbito(a)), ['España', 'UE', 'Mundo']);
  assert.deepEqual(Object.keys(m.AMBITOS).map(a => m.etiquetaAmbito(a, 'en')), ['Spain', 'EU', 'World']);
});

test('«Hoy» y «Ayer» dependen del día de quien mira, no solo de la sección', () => {
  const d = m.validarNoticias(ARCHIVO).noticias;
  const etiquetas = hoy => d.map(n => m.etiquetaReciente(n, hoy));
  // El 10/11: la de la CNMV es de hoy; las dos del 09/11 (aunque estén en «hoy») son de ayer.
  assert.deepEqual(etiquetas('2026-11-10'), ['Hoy', 'Ayer', 'Ayer', null, null, null, null, null]);
  // Días después, sin ciclo nuevo, ninguna se queda diciendo «Hoy».
  assert.deepEqual(etiquetas('2026-11-11'), ['Ayer', null, null, null, null, null, null, null]);
  assert.deepEqual(etiquetas('2026-11-13'), [null, null, null, null, null, null, null, null]);
  // «Ayer» también para una de la sección «importante», y el cambio de mes y de año.
  assert.equal(m.etiquetaReciente({ fecha: '2026-11-06', seccion: 'importante' }, '2026-11-07'), 'Ayer');
  assert.equal(m.etiquetaReciente({ fecha: '2026-10-31', seccion: 'hoy' }, '2026-11-01'), 'Ayer');
  assert.equal(m.etiquetaReciente({ fecha: '2025-12-31', seccion: 'hoy' }, '2026-01-01'), 'Ayer');
  assert.equal(m.etiquetaReciente({ fecha: '2026-11-10', seccion: 'importante' }, '2026-11-10'), null, '«Hoy» solo para la sección de hoy');
  assert.equal(m.etiquetaReciente({ fecha: '2026-11-10', seccion: 'hoy' }, ''), null);
  assert.equal(m.etiquetaReciente(null, '2026-11-10'), null);
  // La fecha local del dispositivo, sin Intl: la hora local, no la UTC.
  assert.equal(m.fechaLocal(new Date(2026, 10, 10, 0, 5)), '2026-11-10');
  assert.equal(m.fechaLocal(new Date(2026, 10, 10, 23, 55)), '2026-11-10');
  assert.equal(m.fechaLocal(new Date(2026, 0, 3)), '2026-01-03');
  assert.equal(m.fechaLocal(new Date('x')), '');
  assert.match(fs.readFileSync(path.join(RAIZ, 'lib/noticias-sector.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''), /^(?![\s\S]*\bIntl\b)/);
  // Las de hoy siguen primero.
  assert.equal(d[0].seccion, 'hoy');
});

test('las ilustraciones: una por categoría y ámbito, deterministas, solo formas (sin texto ni imágenes de fuera)', () => {
  const PERMITIDOS = new Set(['rect', 'circle', 'ellipse', 'path', 'line', 'polyline', 'polygon']);
  const dibujos = [];
  for (const categoria of Object.keys(m.CATEGORIAS)) {
    for (const ambito of Object.keys(m.AMBITOS)) {
      const n = { id: `${categoria}-x`, categoria, ambito };
      const a = m.ilustracion(n, { velo: true }), b = m.ilustracion(n, { velo: true });
      assert.deepEqual(a, b, 'la misma noticia, el mismo dibujo');
      assert.ok(a.formas.every(f => PERMITIDOS.has(f.el)), 'solo formas');
      const texto = JSON.stringify(a);
      assert.doesNotMatch(texto, /"(?:text|image|tspan|use|foreignObject)"|href|https?:/);
      // Los degradados que usa el dibujo existen y llevan el prefijo de la noticia.
      const ids = new Set(a.defs.map(g => g.a.id));
      for (const [, id] of texto.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(id), id);
      assert.ok([...ids].every(id => id.startsWith(`nt-${categoria}-x-`)), 'ids únicos por noticia');
      assert.ok(a.defs.some(g => g.a.id.endsWith('-velo')) && !m.ilustracion(n).defs.some(g => g.a.id.endsWith('-velo')));
      dibujos.push(JSON.stringify(m.ilustracion(n).formas));
    }
  }
  assert.equal(new Set(dibujos).size, 12, 'doce dibujos distintos');
  // Todo cae dentro del lienzo y los números son finitos.
  const todos = JSON.stringify(Object.keys(m.CATEGORIAS).map(c => m.ilustracion({ id: 'a', categoria: c, ambito: 'UE' })));
  assert.doesNotMatch(todos, /NaN|Infinity|undefined/);
  // Las ocho noticias del archivo: ocho dibujos distintos (aunque compartan categoría y ámbito).
  const ocho = m.validarNoticias(ARCHIVO).noticias.map(n => JSON.stringify(m.ilustracion(n).formas));
  assert.equal(new Set(ocho).size, 8);
});

test('regulación tiene cuatro figuras y dos noticias vecinas de la misma categoría no la repiten', () => {
  const d = m.validarNoticias(ARCHIVO).noticias;
  const figuras = m.variantes(d);
  assert.deepEqual(m.variantes(d), figuras, 'determinista');
  assert.equal(m.VARIANTES.regulacion, 4);
  // Cuatro dibujos distintos para la misma noticia de regulación, uno por figura.
  const n = d.find(x => x.categoria === 'regulacion');
  assert.equal(new Set([0, 1, 2, 3].map(v => JSON.stringify(m.ilustracion(n, { variante: v }).formas))).size, 4);
  for (const v of [0, 1, 2, 3]) {
    const a = m.ilustracion(n, { variante: v, velo: true });
    assert.equal(a.variante, v);
    assert.doesNotMatch(JSON.stringify(a), /NaN|Infinity|undefined|"(?:text|image|tspan|use|foreignObject)"|href|https?:/);
  }
  // Las cinco de regulación, por orden: ninguna igual que la anterior de su categoría.
  const reg = d.filter(x => x.categoria === 'regulacion').map(x => figuras[x.id]);
  assert.equal(reg.length, 5);
  for (let i = 1; i < reg.length; i++) assert.notEqual(reg[i], reg[i - 1], `regulación ${i} y ${i + 1}`);
  assert.ok(new Set(reg).size >= 4, 'se usan las cuatro figuras');
  // El detalle recorta el lienzo a la franja del motivo, en 10:7.
  assert.equal(m.RECORTE_DETALLE.viewBox, '0 30 320 224');
  assert.equal(m.RECORTE_DETALLE.proporcion, 0.7);
  assert.equal(224 / 320, m.RECORTE_DETALLE.proporcion);
});

/* ---- Lectura de /datos/noticias.json ---- */
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
const remota = cargarLib('lib/noticias-sector-remota.js', { './noticias-sector': m });

test('la app lee https://rwadar.pages.dev/datos/noticias.json sin cookies, con plazo, y rechaza lo que no tiene forma', async () => {
  const llamadas = [];
  const responde = (status, cuerpo) => async (url, init) => { llamadas.push([url, init]); return { ok: status === 200, status, text: async () => cuerpo }; };
  remota.olvidarNoticias();
  const d = await remota.cargarNoticias({ fetchImpl: responde(200, TEXTO) });
  assert.deepEqual(d, m.validarNoticias(ARCHIVO));
  remota.olvidarNoticias();
  assert.equal(llamadas[0][0], 'https://rwadar.pages.dev/datos/noticias.json');
  assert.equal(llamadas[0][1].credentials, 'omit');
  assert.equal(llamadas[0][1].method, 'GET');
  assert.ok(!('Authorization' in llamadas[0][1].headers) && !('Cookie' in llamadas[0][1].headers));
  await assert.rejects(remota.cargarNoticias({ fetchImpl: responde(404, '') }), /noticias_http_404/);
  await assert.rejects(remota.cargarNoticias({ fetchImpl: responde(200, '{"version":1}') }), /noticias_forma/);
  await assert.rejects(remota.cargarNoticias({ fetchImpl: responde(200, '<html>') }), /noticias_forma/);
  await assert.rejects(remota.cargarNoticias({ fetchImpl: responde(200, 'x'.repeat(300 * 1024)) }), /noticias_tamano/);
  // Si el servidor anuncia un cuerpo que no cabe, ni se lee.
  let leido = false;
  const anunciaGrande = async () => ({ ok: true, status: 200, headers: { get: k => (k === 'content-length' ? String(1024 * 1024) : null) },
    text: async () => { leido = true; return TEXTO; } });
  await assert.rejects(remota.cargarNoticias({ fetchImpl: anunciaGrande }), /noticias_tamano/);
  assert.equal(leido, false);
  const anunciaBien = async () => ({ ok: true, status: 200, headers: { get: k => (k === 'content-length' ? String(Buffer.byteLength(TEXTO)) : null) },
    text: async () => TEXTO });
  assert.equal((await remota.cargarNoticias({ fetchImpl: anunciaBien })).noticias.length, 8);
  remota.olvidarNoticias();
  const colgada = (url, init) => new Promise((_, rechazar) => init.signal.addEventListener('abort', () => rechazar(new Error('abortada'))));
  await assert.rejects(remota.cargarNoticias({ fetchImpl: colgada, plazoMs: 20 }), /abortada/);
});

test('la app reutiliza las noticias 10 minutos en la sesión; los fallos no se guardan', async () => {
  remota.olvidarNoticias();
  let llamadas = 0, ahora = Date.parse('2026-11-10T16:00:00Z'), estado = 503;
  const fetchImpl = async () => { llamadas++; return { ok: estado === 200, status: estado, text: async () => TEXTO }; };
  const cargar = () => remota.cargarNoticias({ fetchImpl, ahora: () => ahora });
  await assert.rejects(cargar(), /noticias_http_503/);
  estado = 200;
  await cargar();
  ahora += 9 * 60000;
  await cargar();
  assert.equal(llamadas, 2, 'dentro de 10 minutos no vuelve a preguntar');
  ahora += 2 * 60000;
  await cargar();
  assert.equal(llamadas, 3);
  remota.olvidarNoticias();
});

/* ---- La sección, con React aislado ---- */
const colores = new Proxy({}, { get: (_, clave) => `#${String(clave)}` });
const tema = { C: colores, F: new Proxy({}, { get: (_, c) => String(c) }), T: { seccion: {}, menor: {}, etiqueta: {}, dato: {}, cuerpo: {} },
  R: { s: 8, m: 12, l: 16, xl: 24, p: 999 }, UI: { margen: 16, tactil: 48 }, pulsado: () => ({}) };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (typeof arbol !== 'object') return [arbol];
  return [arbol, ...nodos(arbol.children), ...nodos(arbol.props?.children)];
}
const textoDe = (arbol) => nodos(arbol).filter((n) => typeof n === 'string').join(' ').replace(/\s+/g, ' ');
const buscar = (arbol, prueba) => nodos(arbol).filter((n) => n && typeof n === 'object' && prueba(n));
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
  const absoluto = path.join(RAIZ, 'componentes', 'NoticiasSector.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s, absoluteFill: {} }, Platform: { OS: 'android' }, useWindowDimensions: () => ({ width: 390, height: 844 }) };
  for (const tipo of ['Text', 'View', 'Pressable', 'ScrollView']) nativo[tipo] = tipo;
  // FlatList pinta sus elementos con renderItem; Modal, su contenido si está visible.
  nativo.FlatList = (p) => ({ type: 'FlatList', props: p, children: p.data.map((item, index) => p.renderItem({ item, index })) });
  nativo.Modal = ({ children, ...p }) => ({ type: 'Modal', props: p, children: p.visible ? [children] : [] });
  const svg = { __esModule: true, default: 'Svg' };
  for (const n of ['Circle', 'Defs', 'Ellipse', 'Line', 'LinearGradient', 'Path', 'Polygon', 'Polyline', 'RadialGradient', 'Rect', 'Stop']) svg[n] = n;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === 'react-native-svg') return svg;
      if (pedido === 'react-native-safe-area-context') return { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { eleccion() {}, abrir() {} } };
      if (pedido === '../lib/noticias-sector-remota') return { cargarNoticias: async () => { throw new Error('sin red en las pruebas'); } };
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
const DATOS = m.validarNoticias(ARCHIVO);
// Un reloj fijo: el 10/11/2026 a mediodía (hora local), el día del ciclo.
const EL_10 = () => new Date(2026, 10, 10, 12, 0);
const EL_13 = () => new Date(2026, 10, 13, 12, 0);

test('Inicio en la app: cargando, después el carrusel con solo el titular, «Hoy» o «Ayer» y el titular entero como nombre', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_10 };
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Noticias del sector/);
  assert.match(textoDe(arbol), /Cargando las noticias…/);
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  const texto = textoDe(arbol);
  assert.match(texto, /Actualizadas el 10\/11/);
  assert.doesNotMatch(texto, /Cargando/);
  const lista = buscar(arbol, n => n.type === 'FlatList')[0];
  assert.equal(lista.props.horizontal, true);
  assert.ok(lista.props.snapToInterval > 0 && lista.props.decelerationRate === 'fast');
  const tarjetas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button' && n.props.accessibilityLabel !== 'Cerrar la noticia');
  assert.equal(tarjetas.length, 8);
  assert.equal(tarjetas[0].props.accessibilityLabel, 'Clones de XTB y PJT: la CNMV alerta de 9 webs y apps sin licencia. Hoy');
  assert.equal(tarjetas[3].props.accessibilityLabel, 'Pagarés de Prosegur Cash en DLT: 500.000 € inscritos en la CNMV');
  assert.equal(tarjetas[1].props.accessibilityLabel, `${DATOS.noticias[1].titulo}. Ayer`);
  assert.equal(tarjetas[2].props.accessibilityLabel, `${DATOS.noticias[2].titulo}. Ayer`);
  // En la tarjeta, solo el titular (3 líneas como mucho) y «Hoy» o «Ayer»: ni resumen ni fuente.
  const titulares = buscar(arbol, n => n.type === 'Text' && n.props.numberOfLines === 3);
  assert.equal(titulares.length, 8);
  assert.doesNotMatch(texto, /La CNMV avisa de que nueve webs/);
  // El 10/11: una de hoy y dos de ayer (las del 09/11).
  assert.equal(buscar(arbol, n => n.type === 'Text' && textoDe(n) === 'Hoy').length, 1);
  assert.equal(buscar(arbol, n => n.type === 'Text' && textoDe(n) === 'Ayer').length, 2);
  // Cada tarjeta lleva su dibujo, oculto para el lector de pantalla y sin texto.
  const dibujos = buscar(arbol, n => n.type === 'Svg');
  assert.equal(dibujos.length, 8);
  assert.ok(dibujos.every(s => s.props.accessible === false && s.props.importantForAccessibility === 'no-hide-descendants'));
  assert.equal(buscar(arbol, n => n.type === 'Modal').length, 0, 'el detalle no se monta cerrado');
  assert.match(texto, /Ilustraciones de RWAdar, no fotos de la noticia/);
});

test('el detalle: fecha, titular, resumen, «Por qué te importa», la fuente y el enlace que sale de RWAdar', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const enlaces = [];
  const props = { cargar: async () => DATOS, onAbrirEnlace: (u) => enlaces.push(u), ahora: EL_10 };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  const tarjeta = buscar(arbol, n => n.type === 'Pressable' && /^Europa busca/.test(n.props.accessibilityLabel || ''))[0];
  tarjeta.props.onPress();
  arbol = pintar(Seccion, props);
  const modal = buscar(arbol, n => n.type === 'Modal')[0];
  assert.ok(modal && modal.props.visible);
  const texto = textoDe(modal);
  const n = DATOS.noticias.find(x => x.id === 'etsg-estandares-tokenizacion');
  assert.match(texto, /09\/11\/2026 · Regulación · UE/);
  assert.equal(buscar(modal, x => x.props?.accessibilityLabel === '09/11/2026 · Regulación · UE · Ayer').length, 1, 'el 10/11 es de ayer');
  assert.ok(!texto.includes(n.tituloInformativo), 'sin repetir el titular con otras palabras');
  // La ilustración apaisada: el lienzo recortado a la franja del motivo, en 10:7.
  const arte = buscar(modal, x => x.type === 'Svg')[0];
  assert.equal(arte.props.viewBox, '0 30 320 224');
  assert.equal(arte.props.preserveAspectRatio, 'xMidYMid slice');
  assert.equal(arte.props.height, Math.round(arte.props.width * 0.7));
  for (const parte of [n.titulo, n.resumen, 'Por qué te importa', n.porQueImporta, 'Fuente', n.fuente.nombre, 'Consultada el', '10/11/2026',
    'Leer en la fuente (sales de RWAdar)', 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.']) {
    assert.ok(texto.includes(parte), parte);
  }
  const titulo = buscar(modal, x => x.type === 'Text' && x.props.accessibilityRole === 'header' && textoDe(x) === n.titulo);
  assert.equal(titulo.length, 1, 'el titular es la cabecera del detalle');
  const ir = buscar(modal, x => x.type === 'Pressable' && x.props.accessibilityRole === 'link')[0];
  assert.equal(ir.props.accessibilityLabel, `Leer en la fuente (sales de RWAdar): ${n.fuente.url}`);
  ir.props.onPress();
  assert.deepEqual(enlaces, [n.fuente.url], 'sale por onAbrirEnlace, como el resto de enlaces externos');
  // «Cerrar la noticia» y el botón atrás de Android cierran.
  assert.equal(modal.props.onRequestClose, buscar(modal, x => x.props?.accessibilityLabel === 'Cerrar la noticia')[0].props.onPress);
  modal.props.onRequestClose();
  arbol = pintar(Seccion, props);
  assert.equal(buscar(arbol, x => x.type === 'Modal').length, 0);
});

test('en inglés: los campos «en», la fecha y la interfaz del diccionario', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_10 };
    pintar(Seccion, props);
    await esperar(); await esperar();
    let arbol = pintar(Seccion, props);
    let texto = textoDe(arbol);
    assert.match(texto, /Industry news/);
    assert.match(texto, /Updated on 10 Nov/);
    assert.match(texto, /XTB and PJT clones: Spain’s CNMV flags 9 unlicensed sites and apps/);
    assert.doesNotMatch(texto, /Clones de XTB/);
    const tarjetas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
    assert.equal(tarjetas[0].props.accessibilityLabel, 'XTB and PJT clones: Spain’s CNMV flags 9 unlicensed sites and apps. Today');
    tarjetas[0].props.onPress();
    arbol = pintar(Seccion, props);
    texto = textoDe(buscar(arbol, n => n.type === 'Modal')[0]);
    assert.equal(tarjetas[1].props.accessibilityLabel, `${ARCHIVO.noticias[1].en.titulo}. Yesterday`);
    for (const parte of ['10 Nov 2026 · Risk · Spain', 'Why it matters to you', ARCHIVO.noticias[0].en.porQueImporta, 'Source', 'Checked on',
      'Read at the source (you leave RWAdar)', 'This is not a recommendation.']) assert.ok(texto.includes(parte), parte);
  } finally { await idioma.cambiarIdioma('es'); }
});

test('con el reloj el 13/11 (sin ciclo nuevo), ninguna tarjeta dice «Hoy» ni «Ayer»; las de hoy siguen primero', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_13 };
  pintar(Seccion, props);
  await esperar(); await esperar();
  const arbol = pintar(Seccion, props);
  assert.equal(buscar(arbol, n => n.type === 'Text' && /^(Hoy|Ayer)$/.test(textoDe(n))).length, 0);
  const tarjetas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(tarjetas[0].props.accessibilityLabel, DATOS.noticias[0].titulo);
  assert.equal(DATOS.noticias[0].id, 'cnmv-advierte-clones-xtb-pjt');
});

test('con la red caída: lo dice, sin noticias, y «Reintentar» vuelve a preguntar', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  let fallar = true, llamadas = 0;
  const props = { cargar: async () => { llamadas++; if (fallar) throw new Error('sin red'); return DATOS; }, onAbrirEnlace() {} };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Ahora no podemos mostrar las noticias\. Vuelve a intentarlo más tarde\./);
  assert.equal(buscar(arbol, n => n.type === 'FlatList').length, 0);
  fallar = false;
  buscar(arbol, n => n.props?.accessibilityLabel === 'Reintentar')[0].props.onPress();
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  assert.equal(llamadas, 2);
  assert.equal(buscar(arbol, n => n.type === 'FlatList').length, 1);
});

test('Inicio pinta las noticias justo después de «La tokenización en el mundo», con el mismo onAbrirEnlace', () => {
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes/Inicio.js'), 'utf8');
  const tk = inicio.indexOf('<TokenizacionMundo onAbrirEnlace={onAbrirEnlace} />'), nt = inicio.indexOf('<NoticiasSector onAbrirEnlace={onAbrirEnlace} />');
  assert.ok(tk > 0 && nt > tk);
  assert.doesNotMatch(inicio.slice(tk + 10, nt).replace(/\{\/\*[\s\S]*?\*\/\}/g, ''), /<[A-Z]/, 'nada entre las dos secciones');
});
