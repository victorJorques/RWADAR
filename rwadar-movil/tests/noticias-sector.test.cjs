'use strict';

/* «Noticias del sector» (10/11/2026): el motor compartido (forma, orden,
   textos por idioma e ilustraciones), la lectura de /datos/noticias-v2.json y
   la sección de Inicio con React aislado. Sin red: las noticias son las
   publicadas (rwadar-site/datos/noticias-v2.json), y lo que depende de la
   edición (fecha, titulares, fuentes, relojes de «Hoy» y «Ayer») sale del
   archivo, no de una fecha escrita a mano: así una edición nueva no las rompe. */
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
/* Las pruebas de comportamiento usan una edición fija con una noticia de «hoy»
   (la del 12/11/2026, en fixtures/): una edición nueva sin «hoy» o con menos
   noticias no las rompe. La edición publicada se comprueba aparte, con reglas
   que valen para cualquier día. */
const PUBLICADO = JSON.parse(fs.readFileSync(path.join(RAIZ, '../rwadar-site/datos/noticias-v2.json'), 'utf8'));
const TEXTO = fs.readFileSync(path.join(RAIZ, 'fixtures/noticias-ejemplo.json'), 'utf8');
const ARCHIVO = JSON.parse(TEXTO);
const copia = () => JSON.parse(TEXTO);

/* Fechas a partir del archivo, sin pasar por el motor (que es lo que se prueba). */
// n días después de una fecha AAAA-MM-DD (o antes, si n < 0).
const masDias = (iso, n) => { const f = new Date(`${iso}T12:00:00Z`); f.setUTCDate(f.getUTCDate() + n); return f.toISOString().slice(0, 10); };
const ddmmaaaa = iso => iso.split('-').reverse().join('/');
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const enCorta = iso => { const [a, mes, dia] = iso.split('-').map(Number); return `${dia} ${MESES_EN[mes - 1]} ${a}`; };
const enBreve = iso => enCorta(iso).replace(/ \d{4}$/, '');
// La fuente corta, como la escribe RWAdar: lo que va antes de la primera coma.
const corta = n => n.fuente.nombre.split(',')[0].trim();
const CATEGORIA_ES = { regulacion: 'Regulación', mercado: 'Mercado', producto: 'Producto', riesgo: 'Riesgo' };
const CATEGORIA_EN = { regulacion: 'Regulation', mercado: 'Market', producto: 'Product', riesgo: 'Risk' };
const AMBITO_EN = { 'España': 'Spain', UE: 'EU', Mundo: 'World' };
// La noticia de «hoy» va primero; su fecha marca los relojes (en la edición del 12/11, el 11/11).
const HOY = ARCHIVO.noticias[0].fecha;

test('la edición publicada vale para la app: de 1 a 8 noticias, las de hoy primero, textos de la fuente y titulares cortos', () => {
  const d = m.validarNoticias(PUBLICADO);
  assert.match(PUBLICADO.actualizadoEl, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(d.noticias.length >= 1 && d.noticias.length <= 8, `${d.noticias.length} noticias`);
  const secciones = d.noticias.map(n => n.seccion);
  assert.deepEqual(secciones, [...secciones].sort((a, b) => (a === 'hoy' ? 0 : 1) - (b === 'hoy' ? 0 : 1)), 'las de hoy, primero');
  assert.deepEqual(d.noticias.map(n => n.id), PUBLICADO.noticias.map(n => n.id), 'el archivo ya viene en ese orden');
  assert.ok(d.noticias.every(n => /^https:\/\//.test(n.fuente.url)));
  // La guía de titulares (14/11/2026): 60 caracteres como mucho en las dos lenguas, y una foto distinta para cada una.
  assert.ok(d.noticias.every(n => [...n.titulo].length <= 60 && [...n.en.titulo].length <= 60));
  assert.equal(new Set(d.noticias.map(n => n.imagen)).size, d.noticias.length, 'fotos distintas');
  assert.deepEqual(m.revisarEdicion(PUBLICADO).errores, [], 'la edición publicada cumple la guía medible');
});

test('la edición de ejemplo tiene la forma: 6 noticias, las de hoy primero y de la más nueva a la más antigua', () => {
  const d = m.validarNoticias(ARCHIVO);
  assert.match(ARCHIVO.actualizadoEl, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(d.actualizadoEl, ARCHIVO.actualizadoEl);
  assert.equal(d.noticias.length, 6);
  assert.deepEqual(d.noticias.map(n => n.seccion), ['hoy', 'importante', 'importante', 'importante', 'importante', 'importante']);
  assert.deepEqual(d.noticias.map(n => n.id), ARCHIVO.noticias.map(n => n.id), 'el archivo ya viene en ese orden');
  // Ninguna noticia se reescribe: los textos son los del archivo, letra a letra.
  for (const [i, n] of d.noticias.entries()) {
    const o = ARCHIVO.noticias[i];
    for (const k of ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo']) assert.equal(n[k], o[k]);
    for (const k of ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo']) assert.equal(n.en[k], o.en[k]);
    assert.deepEqual(n.fuente, o.fuente);
    assert.match(n.fuente.url, /^https:\/\//);
  }
  // Los titulares en castellano caben en 70 caracteres (la edición de ejemplo es anterior a la guía de 60).
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
  assert.throws(roto(d => { d.noticias[0].fecha = masDias(d.actualizadoEl, 1); }), /posterior a la actualización/);
  assert.throws(roto(d => { d.noticias[2].consultadaEl = masDias(d.noticias[2].fecha, -1); }), /consultada antes/);
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
  // Titulares de la edición publicada, tal cual del archivo verificado: el castellano y el inglés son textos distintos.
  assert.equal(m.textos(n).titulo, ARCHIVO.noticias[0].titulo);
  assert.equal(m.textos(n, 'en').titulo, ARCHIVO.noticias[0].en.titulo);
  assert.notEqual(m.textos(n).titulo, m.textos(n, 'en').titulo);
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
  // Las demás son de «importante»: nunca dicen «Hoy», y «Ayer» solo si son del día anterior al de quien mira.
  const resto = hoy => d.slice(1).map(n => (n.fecha === masDias(hoy, -1) ? 'Ayer' : null));
  // El día de la noticia de «hoy» (en la edición del 12/11, el 11/11): ella dice «Hoy».
  assert.deepEqual(etiquetas(HOY), ['Hoy', ...resto(HOY)]);
  // Al día siguiente (el del ciclo): la de «hoy» ya es de ayer.
  assert.deepEqual(etiquetas(masDias(HOY, 1)), ['Ayer', ...resto(masDias(HOY, 1))]);
  // Una de «importante» del archivo (la segunda; en la del 12/11, del 09/11) dice «Ayer» al día siguiente de su fecha.
  assert.equal(d[1].seccion, 'importante');
  assert.equal(m.etiquetaReciente(d[1], masDias(d[1].fecha, 1)), 'Ayer');
  // Días después (dos tras la de «hoy»), sin ciclo nuevo, ninguna se queda diciendo «Hoy».
  assert.deepEqual(etiquetas(masDias(HOY, 2)), [null, null, null, null, null, null]);
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
  assert.equal(m.rutaFoto(d[0]), `/noticias-editoriales/${ARCHIVO.noticias[0].imagen}.webp`);
  assert.equal(m.rutaFoto(d[0], { base: m.URL_FOTOS }), `https://rwadar.pages.dev/noticias-editoriales/${ARCHIVO.noticias[0].imagen}.webp`);
  assert.equal(m.rutaFoto({ imagen: '../x' }), null);
  assert.equal(m.rutaFoto(null), null);
  assert.deepEqual(m.clavesFotos(ARCHIVO), [...new Set(ARCHIVO.noticias.map(n => n.imagen))]);
  assert.equal(m.NOTA_FOTOS.es, 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.');
  // Las ilustraciones SVG ya no existen: ni en el motor ni en el componente.
  for (const viejo of ['ilustracion', 'variantes', 'RECORTE_DETALLE', 'VARIANTES']) assert.equal(m[viejo], undefined, viejo);
  const componente = fs.readFileSync(path.join(RAIZ, 'componentes/NoticiasSector.js'), 'utf8');
  assert.doesNotMatch(componente, /ilustracion|Ilustracion|Polygon|Ellipse/);
  // La app pide la foto del tamaño que necesita (480, 960 o 1200) y, si falla, la de 1200.
  assert.match(componente, /rutaFoto\(noticia, \{ base: URL_FOTOS, ancho: tamano \}\)/);
  assert.match(componente, /anchoFoto\(PixelRatio\.getPixelSizeForLayoutSize\(ancho\)\)/);
  // Ni la web ni la app piden la foto a nadie más que a RWAdar.
  const web = fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/noticias-sector-20261110.js'), 'utf8');
  // La web, con los atributos del modelo (src, srcset, sizes, loading): ninguno a mano.
  assert.match(web, /modelo\.atributosFoto\(n, papel\)/);
  assert.doesNotMatch(web, /\.(?:srcset|sizes|loading)\s*=|setAttribute\('(?:srcset|sizes|loading)'/);
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
  assert.equal((await remota.cargarNoticias({ fetchImpl: anunciaBien })).noticias.length, 6);
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
// Un texto del archivo con los espacios como los deja textoDe.
const llano = (s) => s.replace(/\s+/g, ' ');
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
/* La pantalla: 390 puntos de ancho, escala 2 y la letra normal, salvo que la prueba diga otra cosa. */
function cargarSeccion(react, { ancho = 390, escala = 2, fontScale = 1 } = {}) {
  const absoluto = path.join(RAIZ, 'componentes', 'NoticiasSector.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s, absoluteFill: {} }, Platform: { OS: 'android' },
    useWindowDimensions: () => ({ width: ancho, height: 844, fontScale }), PixelRatio: { getPixelSizeForLayoutSize: (x) => Math.round(x * escala) } };
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
// Relojes fijos a mediodía (hora local), sacados de la noticia de «hoy» (en la edición del 12/11, del 11/11):
// su día («Hoy»), el siguiente (el del ciclo: «Ayer») y dos después (sin ciclo nuevo: ni «Hoy» ni «Ayer»).
const reloj = iso => () => { const [a, mes, dia] = iso.split('-').map(Number); return new Date(a, mes - 1, dia, 12, 0); };
const EL_DIA_DE_HOY = reloj(HOY);
const AL_DIA_SIGUIENTE = reloj(masDias(HOY, 1));
const DOS_DIAS_DESPUES = reloj(masDias(HOY, 2));
// Y el día siguiente al de la segunda (de «importante»), para su «Ayer».
const AYER_LA_SEGUNDA = reloj(masDias(DATOS.noticias[1].fecha, 1));

const fotos = (arbol) => buscar(arbol, n => n.type === 'Image').map(n => n.props.source.uri);
const URL_FOTOS = 'https://rwadar.pages.dev/noticias-editoriales/';
// El estilo de un Pressable (función de «pressed»), aplanado.
const estiloDe = (n) => Object.assign({}, ...[].concat(typeof n.props.style === 'function' ? n.props.style({ pressed: false }) : n.props.style).flat(9).filter(Boolean));

test('Inicio en la app («Mercado y noticias»): cargando, después la portada con foto grande y dos tarjetas con foto, titular, fuente y fecha', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const abiertas = [];
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir: (n) => abiertas.push(n && n.id) };
  let arbol = pintar(Seccion, props);
  assert.match(textoDe(arbol), /Cargando las noticias…/);
  await esperar(); await esperar();
  arbol = pintar(Seccion, props);
  const texto = textoDe(arbol);
  assert.doesNotMatch(texto, /Cargando/);
  const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(filas.length, 3, 'solo 3 en Inicio');
  const [n0, n1] = DATOS.noticias;
  assert.equal(filas[0].props.accessibilityLabel, `${n0.titulo}. ${corta(n0)} · ${ddmmaaaa(n0.fecha)}. Hoy`);
  // La segunda (de «importante»), el día siguiente al de su fecha, dice «Ayer» también en su etiqueta accesible.
  const filasOtroDia = buscar(pintar(Seccion, { ...props, ahora: AYER_LA_SEGUNDA }), n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(filasOtroDia[1].props.accessibilityLabel, `${n1.titulo}. ${corta(n1)} · ${ddmmaaaa(n1.fecha)}. Ayer`);
  // Titular entero (sin numberOfLines en ningún texto), fuente y fecha: sin resumen. «Hoy» o «Ayer», después de la fuente.
  assert.equal(buscar(arbol, n => n.type === 'Text' && n.props.numberOfLines !== undefined).length, 0, 'ningún titular se corta');
  const hijos = buscar(filasOtroDia[1], n => n.type === 'Text').map(textoDe);
  assert.ok(hijos.indexOf('Ayer') > hijos.indexOf(`${corta(n1)} · ${ddmmaaaa(n1.fecha)}`), 'la etiqueta, después de la fuente');
  for (const n of DATOS.noticias.slice(0, 3)) assert.ok(!texto.includes(llano(n.resumen)), `sin resumen: ${n.id}`);
  assert.ok(texto.includes(`${corta(n0)} · ${ddmmaaaa(n0.fecha)}`));
  // A 390 puntos y escala 2: la portada (358 × 2 = 716 px) baja la de 960; las tarjetas (173 × 2 = 346 px), la de 480.
  assert.deepEqual(fotos(arbol), [`${URL_FOTOS}960/${n0.imagen}.webp`, ...DATOS.noticias.slice(1, 3).map(n => `${URL_FOTOS}480/${n.imagen}.webp`)]);
  // La portada: crece con la letra (minHeight 3:4 del ancho, nunca height), con su velo detrás del texto.
  const portada = buscar(arbol, n => n.props?.testID === 'noticia-portada')[0];
  assert.equal(portada, filas[0]);
  assert.equal(estiloDe(portada).minHeight, Math.round(358 * 3 / 4));
  assert.equal(estiloDe(portada).height, undefined, 'nunca un alto fijo');
  const velos = buscar(arbol, n => n.type === 'Svg');
  assert.equal(velos.length, 1, 'el velo, solo en la portada');
  comprobarVelo(velos[0], buscar(portada, n => n.type === 'View' && n.children?.includes?.(velos[0]))[0] || buscar(portada, n => n.type === 'View' && buscar(n, x => x === velos[0]).length && estiloDe(n).paddingTop)[0]);
  // La píldora de categoría no se lee en voz alta (la etiqueta accesible no cambia).
  const pildora = buscar(portada, n => n.type === 'View' && n.props.accessible === false && n.props.importantForAccessibility === 'no-hide-descendants' && textoDe(n) === CATEGORIA_ES[n0.categoria]);
  assert.equal(pildora.length, 1, 'la píldora de categoría, oculta al lector');
  // Las tarjetas, en dos columnas.
  assert.equal(buscar(arbol, n => n.props?.testID === 'noticias-dos-columnas').length, 1);
  assert.match(texto, /Imágenes ilustrativas generadas con IA, no fotos de la noticia\./);
  assert.equal(buscar(arbol, n => n.type === 'Modal').length, 0, 'en Inicio no hay detalle');
  filas[1].props.onPress();
  assert.deepEqual(abiertas, [DATOS.noticias[1].id]);
});

test('debajo del gráfico: la portada con «Por qué te importa» debajo y las demás en tarjetas con foto, fuente, fecha y titular; al tocar, su detalle', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const enlaces = [];
  const props = { cargar: async () => DATOS, onAbrirEnlace: (u) => enlaces.push(u), ahora: AL_DIA_SIGUIENTE, modo: 'lista' };
  pintar(Seccion, props);
  await esperar(); await esperar();
  let arbol = pintar(Seccion, props);
  const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  assert.equal(filas.length, 6);
  assert.equal(fotos(arbol).length, 6);
  const n0 = DATOS.noticias[0];
  assert.equal(filas[0].props.accessibilityLabel, `${n0.titulo}. ${corta(n0)} · ${ddmmaaaa(n0.fecha)}. Ayer`, 'al día siguiente, la de hoy es de ayer');
  // Debajo de la portada, por qué te importa; las tarjetas, solo titular, fuente y fecha (el resumen, en el detalle).
  const importa = buscar(arbol, n => n.props?.testID === 'noticia-importa');
  assert.equal(importa.length, 1);
  assert.equal(textoDe(importa[0]).replace(/\s+/g, ' '), `Por qué te importa : ${DATOS.noticias[0].porQueImporta}`.replace(/\s+/g, ' '));
  for (const n of DATOS.noticias) assert.ok(!textoDe(arbol).includes(llano(n.resumen)), `sin resumen fuera del detalle: ${n.id}`);
  assert.equal(buscar(arbol, n => n.type === 'Text' && n.props.numberOfLines !== undefined).length, 0, 'ningún titular se corta');
  // 6 noticias: la portada y 5 tarjetas, en filas de dos; la quinta, sola y ancha (sin hueco al lado).
  assert.equal(buscar(arbol, n => n.props?.testID === 'noticia-portada').length, 1);
  assert.deepEqual(fotos(arbol).slice(1, 5).map(u => u.replace(URL_FOTOS, '').split('/')[0]), ['480', '480', '480', '480']);
  assert.equal(fotos(arbol)[5], `${URL_FOTOS}960/${DATOS.noticias[5].imagen}.webp`, 'la tarjeta ancha, con la de 960');
  // La cuarta: anterior al día de la de hoy, así que ni «Hoy» ni «Ayer».
  const n = DATOS.noticias[3];
  assert.ok(n.fecha < HOY);
  const fila = filas.find(f => f.props.accessibilityLabel.startsWith(`${n.titulo}. `));
  fila.props.onPress();
  arbol = pintar(Seccion, props);
  const modal = buscar(arbol, n => n.type === 'Modal')[0];
  assert.ok(modal && modal.props.visible);
  const texto = textoDe(modal);
  const fechaYTema = `${ddmmaaaa(n.fecha)} · ${CATEGORIA_ES[n.categoria]} · ${n.ambito}`;
  assert.ok(texto.includes(fechaYTema), fechaYTema);
  assert.equal(buscar(modal, x => x.props?.accessibilityLabel === fechaYTema).length, 1, `del ${ddmmaaaa(n.fecha)}: ni «Hoy» ni «Ayer»`);
  assert.ok(!texto.includes(n.tituloInformativo), 'sin repetir el titular con otras palabras');
  // El detalle, a 390 puntos (escala 2): la de 960.
  assert.deepEqual(fotos(modal), [`${URL_FOTOS}960/${n.imagen}.webp`]);
  for (const parte of [n.titulo, n.resumen, 'Por qué te importa', n.porQueImporta, 'Fuente', n.fuente.nombre, 'Consultada el', ddmmaaaa(n.consultadaEl),
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
  const n = DATOS.noticias[2];
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_DIA_DE_HOY, modo: 'lista', abrirId: n.id };
  pintar(Seccion, props);
  await esperar(); await esperar();
  pintar(Seccion, props);
  const arbol = pintar(Seccion, props);
  const modal = buscar(arbol, n => n.type === 'Modal')[0];
  assert.ok(modal, 'el detalle se abre solo');
  assert.ok(textoDe(modal).includes(llano(n.titulo)));
});

test('en inglés: los campos «en», la fecha y la interfaz del diccionario', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: EL_DIA_DE_HOY, modo: 'lista' };
    pintar(Seccion, props);
    await esperar(); await esperar();
    let arbol = pintar(Seccion, props);
    let texto = textoDe(arbol);
    const n0 = DATOS.noticias[0];
    assert.ok(texto.includes(`Updated on ${enBreve(ARCHIVO.actualizadoEl)}`), `Updated on ${enBreve(ARCHIVO.actualizadoEl)}`);
    assert.ok(texto.includes(llano(n0.en.titulo)));
    assert.ok(texto.includes(llano(`Why it matters to you : ${n0.en.porQueImporta}`)), '«Por qué te importa», del diccionario, en la primera');
    assert.match(texto, /Illustrative AI-generated images, not photos of the news\./);
    assert.ok(!texto.includes(llano(n0.titulo)));
    const filas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
    // La fuente en inglés: los organismos, traducidos con la tabla del motor (probada en «la fuente corta»); siglas y empresas, igual.
    assert.equal(filas[0].props.accessibilityLabel, `${n0.en.titulo}. ${m.fuenteCorta(n0, 'en')} · ${enCorta(n0.fecha)}. Today`);
    filas[0].props.onPress();
    arbol = pintar(Seccion, props);
    texto = textoDe(buscar(arbol, n => n.type === 'Modal')[0]);
    for (const parte of [`${enCorta(n0.fecha)} · ${CATEGORIA_EN[n0.categoria]} · ${AMBITO_EN[n0.ambito]}`, 'Why it matters to you', ARCHIVO.noticias[0].en.porQueImporta, 'Source', 'Checked on',
      'Read at the source (you leave RWAdar)', 'This is not a recommendation.']) assert.ok(texto.includes(parte), parte);
  } finally { await idioma.cambiarIdioma('es'); }
});

test('con el reloj dos días después de la de hoy (sin ciclo nuevo), ninguna tarjeta dice «Hoy» ni «Ayer»; las de hoy siguen primero', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, onAbrirEnlace() {}, ahora: DOS_DIAS_DESPUES, modo: 'compacta', onAbrir() {} };
  pintar(Seccion, props);
  await esperar(); await esperar();
  const arbol = pintar(Seccion, props);
  assert.equal(buscar(arbol, n => n.type === 'Text' && /^(Hoy|Ayer)$/.test(textoDe(n))).length, 0);
  const tarjetas = buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button');
  const n0 = DATOS.noticias[0];
  assert.equal(tarjetas[0].props.accessibilityLabel, `${n0.titulo}. ${corta(n0)} · ${ddmmaaaa(n0.fecha)}`);
  assert.equal(n0.id, ARCHIVO.noticias.find(n => n.seccion === 'hoy').id);
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

test('la fuente corta: en inglés, los organismos traducidos («Consejo de la UE» salía sin traducir); siglas y empresas, igual', () => {
  const m = require('../lib/noticias-sector');
  const n = (nombre) => ({ fuente: { nombre } });
  assert.equal(m.fuenteCorta(n('Consejo de la UE, orientación general (ST 13779/1/26 REV 1)')), 'Consejo de la UE');
  assert.equal(m.fuenteCorta(n('Consejo de la UE, orientación general (ST 13779/1/26 REV 1)'), 'en'), 'Council of the EU');
  assert.equal(m.fuenteTraducida(n('Consejo de la UE, x'), 'en'), true);
  assert.equal(m.fuenteCorta(n('CNMV, nota de prensa del 15/10/2026'), 'en'), 'CNMV');
  assert.equal(m.fuenteTraducida(n('CNMV, nota'), 'en'), false);
  assert.equal(m.fuenteCorta(n('Robinhood Assets (Jersey) Limited, suplemento'), 'en'), 'Robinhood Assets (Jersey) Limited');
  assert.equal(m.fuenteCorta({}), '');
  // Todas las fuentes de las noticias publicadas salen en inglés sin nada en castellano que tenga traducción.
  // No se exige ninguna fuente en concreto: las noticias cambian cada mañana (noticias automáticas,
  // 14/11/2026) y la del Consejo sale de los 30 días el 04/12; el caso del Consejo ya se prueba arriba.
  const datos = require('../../rwadar-site/datos/noticias-v2.json');
  for (const x of datos.noticias) {
    const corta = m.fuenteCorta(x, 'es');
    const en = m.fuenteCorta(x, 'en');
    if (Object.hasOwn(m.FUENTES_EN, corta)) assert.equal(en, m.FUENTES_EN[corta], `${x.id}: «${corta}» sin traducir`);
    else assert.equal(en, corta, `${x.id}: «${corta}» no tiene traducción y no debe cambiar`);
    assert.ok(!Object.keys(m.FUENTES_EN).includes(en), `${x.id}: «${en}» sigue en castellano`);
  }
});

/* ---- Noticias que entran por los ojos (14/11/2026): el velo, la letra grande, los tamaños y el respaldo ---- */
function comprobarVelo(svg, caja) {
  // Dos tramos: la rampa (de 0 a 0,72, en los primeros puntos) y, desde ahí hasta abajo, nunca menos de 0,72.
  const rects = buscar(svg, n => n.type === 'Rect');
  const grad = id => buscar(svg, n => n.type === 'LinearGradient' && n.props.id === id)[0];
  const opacidades = g => buscar(g, n => n.type === 'Stop').map(x => Number(x.props.stopOpacity));
  const bajo = rects.find(r => Number(r.props.y) > 0);
  assert.ok(bajo, 'falta el tramo de debajo de la rampa');
  const rampa = Number(bajo.props.y);
  assert.ok(Math.min(...opacidades(grad(bajo.props.fill.replace(/^url\(#|\)$/g, '')))) >= 0.72, 'detrás del texto, el velo nunca baja de 0,72');
  assert.ok(Math.max(...opacidades(grad(bajo.props.fill.replace(/^url\(#|\)$/g, '')))) >= 0.9);
  assert.equal(bajo.props.height, '100%', 'el velo llega hasta abajo');
  assert.ok(caja, 'la caja del texto');
  assert.ok(estiloDe(caja).paddingTop >= rampa + 8, 'el texto empieza por debajo de la rampa');
}
function textoPintado(Seccion, pintar, props) { pintar(Seccion, props); return new Promise(r => setTimeout(() => setTimeout(() => r(pintar(Seccion, props)), 0), 0)); }

test('con la letra grande (fontScale 1,3 a 390) las tarjetas van en filas; a 360 con la letra normal, en dos columnas', async () => {
  for (const [ancho, fontScale, dos] of [[390, 1.3, false], [390, 1.15, false], [360, 1, true], [390, 1, true]]) {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react, { ancho, fontScale });
    const arbol = await textoPintado(Seccion, pintar, { cargar: async () => DATOS, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir() {} });
    assert.equal(buscar(arbol, n => n.props?.testID === 'noticias-dos-columnas').length, dos ? 1 : 0, `${ancho} a ${fontScale}`);
    // La portada sigue creciendo con la letra: minHeight, nunca height.
    const portada = buscar(arbol, n => n.props?.testID === 'noticia-portada')[0];
    assert.equal(estiloDe(portada).height, undefined);
    assert.equal(estiloDe(portada).minHeight, Math.round((ancho - 32) * 3 / 4));
    if (!dos) for (const f of buscar(arbol, n => n.type === 'Image').slice(1)) assert.match(f.props.source.uri, /\/480\//, 'foto pequeña en las filas');
  }
});

test('el tamaño de la foto según la pantalla: escala 3 pide 1200 para la portada y 960 para las tarjetas', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react, { escala: 3 });
  const arbol = await textoPintado(Seccion, pintar, { cargar: async () => DATOS, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir() {} });
  const [n0, n1, n2] = DATOS.noticias;
  assert.deepEqual(fotos(arbol), [`${URL_FOTOS}${n0.imagen}.webp`, `${URL_FOTOS}960/${n1.imagen}.webp`, `${URL_FOTOS}960/${n2.imagen}.webp`]);
});

test('si la variante no carga, la app prueba la de 1200; si tampoco, queda el fondo oscuro', async () => {
  const { react, pintar } = crearReact();
  const Seccion = cargarSeccion(react);
  const props = { cargar: async () => DATOS, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir() {} };
  let arbol = await textoPintado(Seccion, pintar, props);
  const n1 = DATOS.noticias[1];
  let img = buscar(arbol, n => n.type === 'Image')[1];
  assert.equal(img.props.source.uri, `${URL_FOTOS}480/${n1.imagen}.webp`);
  img.props.onError();
  arbol = pintar(Seccion, props);
  img = buscar(arbol, n => n.type === 'Image')[1];
  assert.equal(img.props.source.uri, `${URL_FOTOS}${n1.imagen}.webp`, 'después, la de 1200');
  img.props.onError();
  arbol = pintar(Seccion, props);
  assert.equal(buscar(arbol, n => n.type === 'Image').length, 2, 'y si falla también, sin foto');
});

test('una edición de 1 o 2 noticias: la portada sola, o la portada y una tarjeta ancha (sin hueco)', async () => {
  for (const cuantas of [1, 2]) {
    const datos = { ...DATOS, noticias: DATOS.noticias.slice(0, cuantas) };
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const arbol = await textoPintado(Seccion, pintar, { cargar: async () => datos, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir() {} });
    assert.equal(buscar(arbol, n => n.type === 'Pressable' && n.props.accessibilityRole === 'button').length, cuantas);
    if (cuantas === 2) assert.equal(fotos(arbol)[1], `${URL_FOTOS}960/${datos.noticias[1].imagen}.webp`, 'la tarjeta sola ocupa todo el ancho');
  }
});

test('en inglés, la portada y las tarjetas con los campos «en» y la categoría traducida', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { react, pintar } = crearReact();
    const Seccion = cargarSeccion(react);
    const arbol = await textoPintado(Seccion, pintar, { cargar: async () => DATOS, ahora: EL_DIA_DE_HOY, modo: 'compacta', onAbrir() {} });
    const texto = textoDe(arbol);
    for (const n of DATOS.noticias.slice(0, 3)) assert.ok(texto.includes(llano(n.en.titulo)), n.id);
    assert.ok(texto.includes(m.CATEGORIAS[DATOS.noticias[0].categoria].en));
  } finally { await idioma.cambiarIdioma('es'); }
});

/* ---- El modelo de las fotos y de la guía de titulares (14/11/2026) ---- */
test('anchoFoto: el menor de 480, 960 y 1200 que llega; con un valor raro, 1200', () => {
  assert.deepEqual(m.ANCHOS_FOTO, [480, 960, 1200]);
  for (const [px, ancho] of [[1, 480], [480, 480], [481, 960], [960, 960], [961, 1200], [1200, 1200], [5000, 1200], [NaN, 1200], [-3, 1200], [0, 1200], ['500', 1200], [undefined, 1200]]) {
    assert.equal(m.anchoFoto(px), ancho, String(px));
  }
});

test('rutaFoto con y sin ancho, srcsetFoto y atributosFoto por papel', () => {
  const n = { imagen: 'alerta-fraude' };
  assert.equal(m.rutaFoto(n), '/noticias-editoriales/alerta-fraude.webp');
  assert.equal(m.rutaFoto(n, { ancho: 480 }), '/noticias-editoriales/480/alerta-fraude.webp');
  assert.equal(m.rutaFoto(n, { ancho: 960, base: m.URL_FOTOS }), 'https://rwadar.pages.dev/noticias-editoriales/960/alerta-fraude.webp');
  assert.equal(m.rutaFoto(n, { ancho: 1200 }), '/noticias-editoriales/alerta-fraude.webp');
  assert.equal(m.rutaFoto(n, { ancho: 720 }), '/noticias-editoriales/alerta-fraude.webp', 'un ancho que no existe: la de 1200');
  assert.equal(m.rutaFoto({ imagen: '../x' }, { ancho: 480 }), null);
  assert.equal(m.srcsetFoto(n), '/noticias-editoriales/480/alerta-fraude.webp 480w, /noticias-editoriales/960/alerta-fraude.webp 960w, /noticias-editoriales/alerta-fraude.webp 1200w');
  assert.equal(m.srcsetFoto({}), null);
  assert.equal(m.atributosFoto({}, 'portada'), null);
  assert.throws(() => m.atributosFoto(n, 'otro'), /papel/);
  assert.deepEqual(m.SIZES, {
    portada: '(min-width:64em) min(66vw, 860px), calc(100vw - 32px)',
    tarjeta: '(min-width:64em) min(33vw, 420px), (min-width:22em) calc(50vw - 22px), 112px',
    ancha: '(min-width:64em) min(66vw, 860px), (min-width:22em) calc(100vw - 32px), 112px',
    anchaDos: '(min-width:64em) min(33vw, 420px), (min-width:22em) calc(100vw - 32px), 112px',
    anchaTres: '(min-width:64em) min(66vw, 860px), (min-width:22em) calc(50vw - 22px), 112px',
    detalle: '(min-width:601px) 600px, 100vw',
  });
  assert.ok(Object.isFrozen(m.SIZES));
  const portada = m.atributosFoto(n, 'portada');
  assert.deepEqual(portada, { src: '/noticias-editoriales/alerta-fraude.webp', srcset: m.srcsetFoto(n), sizes: m.SIZES.portada, width: 1200, height: 800, decoding: 'async' });
  assert.equal('loading' in portada, false, 'la portada nunca es perezosa (es el LCP en tableta y escritorio)');
  for (const papel of ['tarjeta', 'ancha', 'anchaDos', 'anchaTres', 'detalle']) {
    const a = m.atributosFoto(n, papel);
    assert.equal(a.loading, 'lazy', papel);
    assert.equal(a.sizes, m.SIZES[papel]);
    assert.equal(a.srcset, m.srcsetFoto(n));
  }
  // Nunca de otro sitio: solo la ruta propia o rwadar.pages.dev.
  for (const papel of Object.keys(m.SIZES)) {
    const a = m.atributosFoto(n, papel, { base: m.URL_FOTOS });
    for (const u of [a.src, ...a.srcset.split(', ').map(x => x.split(' ')[0])]) assert.match(u, /^https:\/\/rwadar\.pages\.dev\/noticias-editoriales\//);
  }
});

test('esAncha: la última tarjeta, si queda sola en su fila de dos o de tres columnas', () => {
  const anchas = total => Array.from({ length: total }, (_, i) => m.esAncha(i, total)).map((x, i) => (x ? i : null)).filter(x => x !== null);
  assert.deepEqual(anchas(1), []);
  assert.deepEqual(anchas(2), [1], 'la portada y una tarjeta: sola en dos columnas');
  assert.deepEqual(anchas(3), [], 'Inicio: dos tarjetas, ninguna sola');
  assert.deepEqual(anchas(4), [3]);
  assert.deepEqual(anchas(5), [4], 'en tres columnas, la quinta, con otra al lado');
  assert.deepEqual(anchas(6), [5]);
  assert.deepEqual(anchas(9), []);
  assert.equal(m.esAncha(0, 2), false, 'la portada nunca');
  assert.equal(m.esAncha(1.5, 3), false);
  // Y el tamaño de su foto: estirada solo en la rejilla en que lo está.
  assert.equal(m.papelTarjeta(1, 2), 'anchaDos', 'dos noticias: a todo el ancho en dos columnas; en tres, en su columna');
  assert.equal(m.papelTarjeta(3, 4), 'ancha', 'cuatro: sola en las dos rejillas');
  assert.equal(m.papelTarjeta(4, 5), 'anchaTres', 'cinco: en dos columnas va en pareja; en tres, a dos columnas');
  assert.equal(m.papelTarjeta(1, 3), 'tarjeta');
});

test('firmaPrepintado y debeRepintar: la firma de lo que pinta Inicio, sin reloj', () => {
  const d = m.validarNoticias(PUBLICADO);
  const firma = m.firmaPrepintado(d);
  assert.match(firma, /^[0-9a-f]{8}$/);
  assert.equal(m.firmaPrepintado(m.validarNoticias(PUBLICADO)), firma, 'misma edición, misma firma');
  // Cambia si cambia lo que se ve de las tres primeras; no, si cambia la cuarta o un resumen.
  const otra = structuredClone(PUBLICADO);
  otra.noticias[0].titulo = otra.noticias[0].titulo.replace(/.$/, 'x');
  assert.notEqual(m.firmaPrepintado(m.validarNoticias(otra)), firma);
  const foto = structuredClone(PUBLICADO);
  foto.noticias[1].imagen = 'pago-online';
  assert.notEqual(m.firmaPrepintado(m.validarNoticias(foto)), firma);
  const resumen = structuredClone(PUBLICADO);
  resumen.noticias[0].resumen += ' Más.';
  if (resumen.noticias[3]) resumen.noticias[3].titulo = 'Otro titular de prueba';
  assert.equal(m.firmaPrepintado(m.validarNoticias(resumen)), firma);
  assert.equal(m.debeRepintar({ prepintado: firma, datos: d, idioma: 'es' }), false);
  assert.equal(m.debeRepintar({ prepintado: firma, datos: d, idioma: 'en' }), true, 'en inglés, se rehace');
  assert.equal(m.debeRepintar({ prepintado: '00000000', datos: d, idioma: 'es' }), true, 'otra edición, se rehace');
  assert.equal(m.debeRepintar({ prepintado: d.actualizadoEl, datos: d, idioma: 'es' }), true, 'la fecha no es la firma');
  assert.equal(m.debeRepintar({ prepintado: undefined, datos: d, idioma: 'es' }), true);
  assert.equal(m.debeRepintar({ prepintado: firma, datos: null, idioma: 'es' }), true);
  // Sin reloj ni Intl en el código de la firma.
  const fuente = fs.readFileSync(path.join(RAIZ, 'lib/noticias-sector.js'), 'utf8');
  const cuerpo = fuente.slice(fuente.indexOf('function firmaPrepintado'), fuente.indexOf('function debeRepintar'));
  assert.doesNotMatch(cuerpo, /Date|Intl|toLocale|Math\.random/);
});

const conTitulo = (titulo, campo = 'titulo') => {
  const d = structuredClone(PUBLICADO);
  if (campo === 'titulo') d.noticias[0].titulo = titulo; else d.noticias[0].en.titulo = titulo;
  return d;
};
const codigos = (r, que = 'errores') => r[que].map(x => x.codigo);

test('revisarEdicion: los errores de la guía (largo, promesas, «¡», emojis, punto final, fotos)', () => {
  assert.deepEqual(m.revisarEdicion(PUBLICADO), m.revisarEdicion(structuredClone(PUBLICADO)));
  assert.equal(m.REGLAS_TITULAR.max, 60);
  // 61 caracteres, en castellano y en inglés.
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('a'.repeat(61)))), ['largo']);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('a'.repeat(60)))), []);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('b'.repeat(61), 'en'))), ['largo']);
  // Promesas: error.
  for (const t of ['Rentabilidad garantizada en los bonos tokenizados', 'Garantizamos el capital de los tokens', 'Tokens sin riesgo para todos',
    'Una oportunidad única en la cadena', 'Una oportunidad de oro con el oro tokenizado', 'Hazte rico con los tokens', 'El chollo de los tokens',
    'No te lo pierdas: tokens de bonos', 'Risk-free tokenised bonds', 'Guaranteed returns on tokens', 'Get rich with tokens', 'Un pelotazo con los tokens']) {
    assert.ok(codigos(m.revisarEdicion(conTitulo(t))).includes('prohibida'), t);
  }
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('¡Llegan los bonos tokenizados'))), ['exclamacion']);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('Llegan los bonos tokenizados!', 'en'))), ['exclamacion']);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('Llegan los bonos tokenizados 🚀'))), ['emoji']);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('Llegan los bonos tokenizados ✅'))), ['emoji']);
  assert.deepEqual(codigos(m.revisarEdicion(conTitulo('Llegan los bonos tokenizados.'))), ['punto-final']);
  // Fotos: repetida, sin foto, fuera de la biblioteca.
  const repetida = structuredClone(PUBLICADO);
  repetida.noticias[1].imagen = repetida.noticias[0].imagen;
  assert.deepEqual(codigos(m.revisarEdicion(repetida)), ['foto-repetida']);
  const sinFoto = structuredClone(PUBLICADO);
  delete sinFoto.noticias[2].imagen;
  assert.deepEqual(codigos(m.revisarEdicion(sinFoto)), ['sin-foto']);
  const claves = PUBLICADO.noticias.map(n => n.imagen);
  assert.deepEqual(codigos(m.revisarEdicion(PUBLICADO, { fotos: claves })), []);
  assert.deepEqual(codigos(m.revisarEdicion(PUBLICADO, { fotos: claves.slice(1) })), ['foto-desconocida']);
  // Con la forma rota no lanza: lo dice.
  assert.deepEqual(codigos(m.revisarEdicion({ version: 2 })), ['forma']);
});

test('revisarEdicion: titulares legítimos del sector no paran nada (solo un aviso para el verificador)', () => {
  for (const [t, aviso] of [['Una aseguradora tokeniza 200 millones en bonos', 'raiz-promesa'], ['Bonos garantizados por el Estado llegan a la cadena', 'raiz-promesa'],
    ['State-guaranteed bonds go on-chain', 'raiz-promesa'], ['La CNMV avisa de la falsa oportunidad de los tokens', 'raiz-promesa'],
    ['Robinhood amplía sus acciones tokenizadas de EE. UU.', null], ['Una filial de Ejemplo S. A. tokeniza pagarés', null],
    ['Los tokens de bonos se disparan en la UE', 'dudosa']]) {
    const r = m.revisarEdicion(conTitulo(t));
    assert.deepEqual(codigos(r), [], t);
    if (aviso) assert.ok(codigos(r, 'avisos').includes(aviso), `${t}: ${codigos(r, 'avisos')}`);
  }
  // La cifra que no está en el resumen: aviso (las derivadas, como «50 veces», se comprueban a mano).
  const cifra = m.revisarEdicion(conTitulo('Una gestora tokeniza 999 millones'));
  assert.deepEqual(codigos(cifra), []);
  assert.ok(codigos(cifra, 'avisos').includes('cifra'));
});

test('el modelo no usa \\p{…} ni lookbehind (Hermes, la app instalada, carga este archivo)', () => {
  const fuente = fs.readFileSync(path.join(RAIZ, 'lib/noticias-sector.js'), 'utf8');
  assert.doesNotMatch(fuente, /\\p\{|\(\?<[=!]/);
});
