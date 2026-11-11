'use strict';

/* «Noticias del sector» (10/11/2026): el motor compartido (forma, orden,
   textos por idioma e ilustraciones), la lectura de /datos/noticias-v2.json y
   la sección de Inicio con React aislado. Sin red: las noticias son las
   verificadas del ciclo del 10/11/2026 (rwadar-site/datos/noticias-v2.json). */
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
const TEXTO = fs.readFileSync(path.join(RAIZ, '../rwadar-site/datos/noticias-v2.json'), 'utf8');
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
  // «imagen» (rediseño del 10/11/2026): al leer es opcional (sin ella, fondo oscuro; al publicar se exige)
  // y, si está, solo una clave [a-z0-9-]+, nunca una dirección.
  const sinFoto = JSON.parse(TEXTO); delete sinFoto.noticias[0].imagen;
  const leida = m.validarNoticias(sinFoto).noticias.find(n => n.id === sinFoto.noticias[0].id);
  assert.equal(Object.hasOwn(leida, 'imagen'), false);
  assert.equal(m.rutaFoto(leida), null);
  assert.deepEqual(m.noticiasSinFoto(sinFoto), [sinFoto.noticias[0].id]);
  assert.deepEqual(m.noticiasSinFoto(JSON.parse(TEXTO)), []);
  for (const mala of ['', 'Alerta-Fraude', 'alerta_fraude', 'alerta fraude', '../alerta', 'alerta.webp', 'https://x.test/a.webp', 'x'.repeat(61), 7, null]) {
    assert.throws(roto(d => { d.noticias[0].imagen = mala; }), /clave de foto no válida/, String(mala));
  }
  assert.equal(m.noticiasValidas({}), false);
  assert.equal(m.noticiasValidas(ARCHIVO), true);
});

test('textos y fechas en el idioma elegido: los campos «en» en inglés', () => {
  const n = m.validarNoticias(ARCHIVO).noticias[0];
  // Titulares del ciclo del 10/11 reescritos para atraer (encargo de Víctor), tal cual del archivo.
  assert.equal(m.textos(n).titulo, 'La CNMV destapa un clon de XTB y otros 8 chiringuitos');
  assert.equal(m.textos(n, 'en').titulo, 'CNMV exposes an XTB clone and 8 other unlicensed firms');
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

test('las fotos: cada noticia trae su clave y la foto sale de rwadar.pages.dev, sin ilustraciones SVG', () => {
  const d = m.validarNoticias(ARCHIVO).noticias;
  // La clave de cada noticia, tal cual del archivo verificado; varias pueden compartir foto.
  assert.deepEqual(d.map(n => n.imagen), ARCHIVO.noticias.map(n => n.imagen));
  assert.ok(d.every(n => m.CLAVE_FOTO.test(n.imagen)));
  assert.equal(m.rutaFoto(d[0]), '/noticias-editoriales/alerta-fraude.webp');
  assert.equal(m.rutaFoto(d[0], { base: m.URL_FOTOS }), 'https://rwadar.pages.dev/noticias-editoriales/alerta-fraude.webp');
  assert.equal(m.rutaFoto({ imagen: '../x' }), null);
  assert.equal(m.rutaFoto(null), null);
  assert.deepEqual(m.clavesFotos(ARCHIVO), [...new Set(ARCHIVO.noticias.map(n => n.imagen))]);
  assert.equal(m.NOTA_FOTOS.es, 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.');
  // Las ilustraciones SVG ya no existen: ni en el motor ni en el componente.
  for (const viejo of ['ilustracion', 'variantes', 'RECORTE_DETALLE', 'VARIANTES']) assert.equal(m[viejo], undefined, viejo);
  const componente = fs.readFileSync(path.join(RAIZ, 'componentes/NoticiasSector.js'), 'utf8');
  assert.doesNotMatch(componente, /ilustracion|Ilustracion|Polygon|Ellipse/);
  assert.match(componente, /rutaFoto\(noticia, \{ base: URL_FOTOS \}\)/);
  // Ni la web ni la app piden la foto a nadie más que a RWAdar.
  const web = fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/noticias-sector-20261110.js'), 'utf8');
  assert.match(web, /modelo\.rutaFoto\(n\)/);
  assert.doesNotMatch(web, /https?:\/\/(?!rwadar)/);
});

/* ---- Lectura de /datos/noticias-v2.json ---- */
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

test('la app lee https://rwadar.pages.dev/datos/noticias-v2.json sin cookies, con plazo, y rechaza lo que no tiene forma', async () => {
  const llamadas = [];
  const responde = (status, cuerpo) => async (url, init) => { llamadas.push([url, init]); return { ok: status === 200, status, text: async () => cuerpo }; };
  remota.olvidarNoticias();
  const d = await remota.cargarNoticias({ fetchImpl: responde(200, TEXTO) });
  assert.deepEqual(d, m.validarNoticias(ARCHIVO));
  remota.olvidarNoticias();
  assert.equal(llamadas[0][0], 'https://rwadar.pages.dev/datos/noticias-v2.json');
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
  for (const tipo of ['Text', 'View', 'Pressable', 'ScrollView', 'Image']) nativo[tipo] = tipo;
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

const fotos = (arbol) => buscar(arbol, n => n.type === 'Image').map(n => n.props.source.uri);

test('Inicio en la app («Mercado y noticias»): cargando, después 3 filas compactas con foto pequeña, titular, fuente y fecha', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const abiertas = [];
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_10, modo: 'compacta', onAbrir: (n) => abiertas.push(n && n.id) };
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Cargando las noticias…/);
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  const texto = textoDe(arbol);
  assert.doesNotMatch(texto, /Cargando/);
  const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(filas.length, 3, 'solo 3 en Inicio');
  assert.equal(filas[0].props.accessibilityLabel, 'La CNMV destapa un clon de XTB y otros 8 chiringuitos. CNMV · 10/11/2026. Hoy');
  assert.equal(filas[1].props.accessibilityLabel, `${DATOS.noticias[1].titulo}. Robinhood Assets (Jersey) Limited · 09/11/2026. Ayer`);
  // Titular (3 líneas como mucho), fuente y fecha: sin resumen.
  assert.equal(buscar(arbol, n => n.type === 'Text' && n.props.numberOfLines === 3).length, 3);
  assert.doesNotMatch(texto, /La CNMV avisa de que nueve webs/);
  assert.match(texto, /CNMV · 10\/11\/2026/);
  assert.deepEqual(fotos(arbol), DATOS.noticias.slice(0, 3).map(n => `https://rwadar.pages.dev/noticias-editoriales/${n.imagen}.webp`));
  assert.equal(buscar(arbol, n => n.type === 'Svg').length, 0, 'foto pequeña, sin degradado encima');
  assert.match(texto, /Imágenes ilustrativas generadas con IA, no fotos de la noticia\./);
  assert.equal(buscar(arbol, n => n.type === 'Modal').length, 0, 'en Inicio no hay detalle');
  filas[1].props.onPress();
  assert.deepEqual(abiertas, [DATOS.noticias[1].id]);
});

test('debajo del gráfico: las 8 con la fuente y la fecha, el titular, una línea de resumen y la foto; al tocar, su detalle', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const enlaces = [];
  const props = { cargar: async () => DATOS, onAbrirEnlace: (u) => enlaces.push(u), ahora: EL_10, modo: 'lista' };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(filas.length, 8);
  assert.equal(fotos(arbol).length, 8);
  assert.match(textoDe(arbol), /La CNMV avisa de que nueve webs/, 'en la lista, el resumen');
  assert.equal(filas[0].props.accessibilityLabel, 'La CNMV destapa un clon de XTB y otros 8 chiringuitos. CNMV · 10/11/2026. Hoy');
  assert.equal(buscar(arbol, n => n.type === 'Text' && n.props.numberOfLines === 1).length, 7, 'una línea de resumen (la primera, dos)');
  const fila = filas.find(f => /^Europa busca/.test(f.props.accessibilityLabel));
  fila.props.onPress();
  arbol = pintar(Seccion, props);
  const modal = buscar(arbol, n => n.type === 'Modal')[0];
  assert.ok(modal && modal.props.visible);
  const texto = textoDe(modal);
  const n = DATOS.noticias.find(x => x.id === 'etsg-estandares-tokenizacion');
  assert.match(texto, /09\/11\/2026 · Regulación · UE/);
  assert.equal(buscar(modal, x => x.props?.accessibilityLabel === '09/11/2026 · Regulación · UE · Ayer').length, 1, 'el 10/11 es de ayer');
  assert.ok(!texto.includes(n.tituloInformativo), 'sin repetir el titular con otras palabras');
  assert.deepEqual(fotos(modal), [`https://rwadar.pages.dev/noticias-editoriales/${n.imagen}.webp`]);
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

test('llegando desde una tarjeta de Inicio, la pantalla abre esa noticia', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_10, modo: 'lista', abrirId: 'prosegur-cash-pagares-dlt' };
  pintar(Seccion, props);
  await esperar(); await esperar();
  pintar(Seccion, props);
  const arbol = pintar(Seccion, props);
  const modal = buscar(arbol, n => n.type === 'Modal')[0];
  assert.ok(modal, 'el detalle se abre solo');
  assert.ok(textoDe(modal).includes('Prosegur Cash tokeniza 500.000 € en pagarés'));
});

test('en inglés: los campos «en», la fecha y la interfaz del diccionario', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_10, modo: 'lista' };
    pintar(Seccion, props);
    await esperar(); await esperar();
    let arbol = pintar(Seccion, props);
    let texto = textoDe(arbol);
    assert.match(texto, /Updated on 10 Nov/);
    assert.match(texto, /CNMV exposes an XTB clone and 8 other unlicensed firms/);
    assert.match(texto, /Illustrative AI-generated images, not photos of the news\./);
    assert.doesNotMatch(texto, /La CNMV destapa/);
    const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
    assert.equal(filas[0].props.accessibilityLabel, 'CNMV exposes an XTB clone and 8 other unlicensed firms. CNMV · 10 Nov 2026. Today');
    filas[0].props.onPress();
    arbol = pintar(Seccion, props);
    texto = textoDe(buscar(arbol, n => n.type === 'Modal')[0]);
    for (const parte of ['10 Nov 2026 · Risk · Spain', 'Why it matters to you', ARCHIVO.noticias[0].en.porQueImporta, 'Source', 'Checked on',
      'Read at the source (you leave RWAdar)', 'This is not a recommendation.']) assert.ok(texto.includes(parte), parte);
  } finally { await idioma.cambiarIdioma('es'); }
});

test('con el reloj el 13/11 (sin ciclo nuevo), ninguna tarjeta dice «Hoy» ni «Ayer»; las de hoy siguen primero', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_13, modo: 'compacta', onAbrir() {} };
  pintar(Seccion, props);
  await esperar(); await esperar();
  const arbol = pintar(Seccion, props);
  assert.equal(buscar(arbol, n => n.type === 'Text' && /^(Hoy|Ayer)$/.test(textoDe(n))).length, 0);
  const tarjetas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(tarjetas[0].props.accessibilityLabel, `${DATOS.noticias[0].titulo}. CNMV · 10/11/2026`);
  assert.equal(DATOS.noticias[0].id, 'cnmv-advierte-clones-xtb-pjt');
});

test('con la red caída: lo dice, sin noticias, y «Reintentar» vuelve a preguntar', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  let fallar = true, llamadas = 0;
  const props = { cargar: async () => { llamadas++; if (fallar) throw new Error('sin red'); return DATOS; }, onAbrirEnlace() {}, modo: 'compacta', onAbrir() {} };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Ahora no podemos mostrar las noticias\. Vuelve a intentarlo más tarde\./);
  assert.equal(fotos(arbol).length, 0);
  fallar = false;
  buscar(arbol, n => n.props?.accessibilityLabel === 'Reintentar')[0].props.onPress();
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  assert.equal(llamadas, 2);
  assert.equal(fotos(arbol).length, 3);
});

test('Inicio pinta las noticias en «Mercado y noticias», tras la cotización y antes de «Aprende», y abren su pantalla', () => {
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes/Inicio.js'), 'utf8');
  const tk = inicio.indexOf('<MercadoCotizacion'), nt = inicio.indexOf('<NoticiasSector modo="compacta"'), ap = inicio.indexOf("abrir('aprende')");
  assert.ok(tk > 0 && nt > tk && ap > nt, 'el orden de la web: cotización, noticias, aprende');
  assert.match(inicio, /onAbrir=\{\(noticia\) => abrir\('mercado', \{ noticia: noticia\?\.id \|\| null \}\)\}/);
  assert.match(inicio, /<NoticiasSector modo="lista" abrirId=\{noticiaId\} onAbrirEnlace=\{onAbrirEnlace\} \/>/);
});
