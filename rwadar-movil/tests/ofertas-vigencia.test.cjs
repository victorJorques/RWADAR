// Rótulos en frase normal, sin mayúsculas (GUIA-ACABADOS §5, aplicada a la web el 04/11/2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const {soporteIdioma}=require('./soporte-idioma.cjs');

const RAIZ = path.resolve(__dirname, '..');
function cargarModulo(ruta, mocks = {}, contexto = {}) {
  const archivo = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
    filename: archivo, babelrc: false, configFile: false, plugins: [commonjs, jsx],
  }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', ...Object.keys(contexto), codigo)(modulo, modulo.exports, (nombre) => {
    if (nombre === './Idioma') return soporteIdioma(mocks.react,mocks['react-native']);
    if (nombre === '../lib/idioma') return require('../lib/idioma');
    if (nombre === './acceso-obligatorio') return require('../lib/acceso-obligatorio');
    assert.ok(Object.hasOwn(mocks, nombre), `Dependencia inesperada: ${nombre}`);
    return mocks[nombre];
  }, ...Object.values(contexto));
  return modulo.exports;
}
const movil = cargarModulo('lib/verificacion-local.js', {
  './contrato-catalogo': require('../lib/contrato-catalogo'),
});
const datosMoviles = cargarModulo('lib/datos.js', {
  '@react-native-async-storage/async-storage': {},
  'react-native': { Platform: { OS: 'android' } },
  './modo-local': { MODO_LOCAL: true, SERVICIOS_USUARIO_REMOTOS: false },
  './verificacion-local': movil,
  './catalogo-remoto': {},
  './academy-progreso': cargarModulo('lib/academy-progreso.js'),
});
const oferta = {
  slug: 'prueba-frescura', titulo: 'Oferta de prueba', plataformaNombre: 'Proveedor',
  tipo: 'rendimiento', categoria: 'Inmobiliario', imagen: 'ofertas/prueba.webp',
  url: 'https://example.test/oferta', verificadaEl: '2026-09-21', vigenciaDias: 1,
  estadoRevision: 'actual', disponibleEs: true, permanente: false,
  rentabilidad: { mostrada: '97,13 %', literal: '97,13 % anual' },
  precio: { mostrado: '9876 €', unidad: 'token' },
  metricas: [{ etiqueta: 'Entrada', valor: 'Desde 1234 €' }],
  resumen: 'Precio en resumen 4455 €', avisos: [],
};
// El catálogo y las dos interfaces usan días UTC, también fuera de España.
const ultimoDia = new Date('2026-09-22T23:59:59Z');
const caducada = new Date('2026-09-23T00:00:00Z');
const centinelas = /97,13|9876|1234|4455/;

function cargarWeb(ahora) {
  const codigo = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'rwadar-20260820.js'), 'utf8');
  const inicio = codigo.indexOf('const textoLocal=');
  const fin = codigo.indexOf('function pintarEscaparateLocal(){', inicio);
  assert.ok(inicio > 0 && fin > inicio);
  class FechaControlada extends Date {
    constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); }
    static now() { return ahora.getTime(); }
  }
  const atributos = {};
  const dialogo = { innerHTML: '', open: false, close() { this.open = false; }, showModal() { this.open = true; }, querySelector() {},
    setAttribute(nombre, valor) { atributos[nombre] = valor; }, getAttribute(nombre) { return atributos[nombre]; },
    removeAttribute(nombre) { delete atributos[nombre]; } };
  const contexto = {
    P: [], EMI: [],
    Date: FechaControlada, URL, emiOrden: 'rent', emiBusquedaLocal: '', emiTipoLocal: 'todos', MODO_LOCAL_SEGURO: true,
    ESCAPARATE_LOCAL: { ofertas: [oferta], secundario: [] },
    MANIFIESTO_EDITORIAL_LOCAL: { porCategoria: { Inmobiliario: { archivo: 'propia.webp', alt: 'Ilustración propia' } },
      porSlug: new Map(), etiqueta: 'Ilustración editorial' },
    EDITORIAL_OFERTA_POR_CATEGORIA: { Inmobiliario: { src: '/propia.webp', alt: 'Ilustración propia' } },
    EDITORIAL_OFERTA_POR_SLUG: {},
    CATMETA: { Inmobiliario: {} }, catClase: () => '',
    RWAdarFichaEditorial: require('../lib/ficha-editorial'),
    // Botón «Guardar» de favoritos locales: vive fuera del fragmento cargado.
    botonGuardarOferta: () => '',
    escHtml: (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    fechaES: (v) => v, urlHttps: (v) => /^https:\/\//.test(v || '') ? v : '',
    document: { getElementById: () => dialogo, body: { classList: { add() {}, remove() {} } } },
  };
  // The transport is mocked, while the real catalog normalizers stay under test.
  contexto.window = { RWADAR_ACCESO: { catalogo: async (tabla, consulta) => {
    const respuesta = await contexto.fetch(contexto.API + '/' + tabla + '?' + consulta);
    if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
    return respuesta.json();
  } } };
  vm.createContext(contexto);
  vm.runInContext(codigo.slice(inicio, fin), contexto);
  return { contexto, dialogo };
}

function cargarFuncionesWeb(contexto, nombres) {
  const codigo = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'rwadar-20260820.js'), 'utf8');
  const ast = babel.parseSync(codigo, { sourceType: 'script', babelrc: false, configFile: false });
  for (const nombre of nombres) {
    const nodo = ast.program.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === nombre ||
      n.type === 'VariableDeclaration' && n.declarations.some(d => d.id.name === nombre));
    assert.ok(nodo, `función web real ${nombre}`);
    vm.runInContext(codigo.slice(nodo.start, nodo.end), contexto);
  }
}

test('web y móvil conservan el último día completo y retiran cifras al siguiente, aunque el lote siga vigente', () => {
  for (const permanente of [false, true]) {
    const dato = { ...oferta, permanente, catalogo: true };
    const vistaVigente = cargarWeb(ultimoDia);
    const vistaCaducada = cargarWeb(caducada);
    const webVigente = vistaVigente.contexto;
    const webCaducada = vistaCaducada.contexto;
    assert.notEqual(webVigente.estadoVigenciaLocal(dato).clase, 'caducado');
    assert.equal(webCaducada.estadoVigenciaLocal(dato).clase, 'caducado');
    assert.equal(movil.cifrasOfertaVigentes(dato, ultimoDia), true);
    assert.equal(movil.cifrasOfertaVigentes(dato, caducada), false);
    assert.doesNotMatch(webVigente.tarjetaOfertaLocal(dato), centinelas);
    // «cifras válidas hasta hoy» (LISTA-FINAL fila 14, 04/11/2026).
    assert.match(webVigente.tarjetaOfertaLocal(dato), /cifras válidas hasta hoy/);
    assert.match(webVigente.tarjetaOfertaLocal(dato), /aria-label="Ver ficha de Oferta de prueba en Proveedor"/);
    assert.doesNotMatch(webCaducada.tarjetaOfertaLocal(dato), centinelas);
    assert.match(webCaducada.tarjetaOfertaLocal(dato), /escaparate-estado-linea caducado/);
    assert.match(webCaducada.tarjetaOfertaLocal(dato), /aria-label="Ver ficha de Oferta de prueba en Proveedor"/);
    for (const vista of [vistaVigente, vistaCaducada]) {
      vista.contexto.ESCAPARATE_LOCAL = { ofertas: [dato], secundario: [] };
      assert.doesNotMatch(vista.contexto.tarjetaOfertaLocal(dato), /href=/);
      vista.contexto.abrirDetalleOfertaLocal(dato.slug);
      assert.ok(vista.dialogo.innerHTML.includes(`href="${dato.url}"`));
    }
    assert.match(vistaVigente.dialogo.innerHTML, /97,13/);
    assert.doesNotMatch(vistaCaducada.dialogo.innerHTML, centinelas);
    assert.equal(movil.ofertaConCifrasVigentes(dato, caducada).precio, null);
  }
});

test('secundario y diálogo web no recuperan cifras vencidas desde métricas o resumen', () => {
  const { contexto, dialogo } = cargarWeb(caducada);
  const secundaria = { ...oferta, tipo: 'secundario' };
  contexto.ESCAPARATE_LOCAL = { ofertas: [oferta], secundario: [secundaria] };
  assert.doesNotMatch(contexto.filaSecundariaLocal(secundaria), centinelas);
  contexto.abrirDetalleOfertaLocal(oferta.slug);
  assert.doesNotMatch(dialogo.innerHTML, centinelas);
  assert.match(dialogo.innerHTML, /Consultar emisor/);
});

test('ambas superficies rechazan revisiones futuras, imposibles, sin TTL o con conflicto', () => {
  const { contexto } = cargarWeb(ultimoDia);
  const casos = [
    { verificadaEl: '2026-09-23' }, { verificadaEl: '2026-02-30' },
    { verificadaEl: '' }, { vigenciaDias: null }, { vigenciaDias: 0 },
    { vigenciaDias: -1 }, { vigenciaDias: 0.5 }, { vigenciaDias: 'mal' },
    { estadoRevision: 'no_verificable' }, { estadoRevision: 'fuentes_en_conflicto' },
    { estadoRevision: 'inventado' },
  ];
  for (const cambio of casos) {
    const dato = { ...oferta, ...cambio };
    assert.equal(movil.cifrasOfertaVigentes(dato, ultimoDia), false, JSON.stringify(cambio));
    assert.equal(contexto.estadoVigenciaLocal(dato).clase, 'caducado', JSON.stringify(cambio));
    assert.doesNotMatch(contexto.tarjetaOfertaLocal(dato), centinelas);
  }
});

test('ordenar web por rentabilidad o entrada no favorece una cifra vencida', () => {
  const { contexto } = cargarWeb(caducada);
  const vigente = { ...oferta, slug: 'vigente', verificadaEl: '2026-09-23',
    rentabilidad: { mostrada: '1 %' }, precio: { mostrado: '9999 €' } };
  for (const orden of ['rent', 'min']) {
    contexto.emiOrden = orden;
    assert.equal(contexto.ordenarOfertasLocales([oferta, vigente])[0].slug, 'vigente');
  }
});

test('una web abierta revisa las cifras a medianoche sin depender de una respuesta de red', () => {
  for (const modoLocal of [true, false]) {
    const reloj = new Date(ultimoDia);
    const { contexto } = cargarWeb(reloj);
    let html = '', temporizador;
    contexto.MODO_LOCAL_SEGURO = modoLocal;
    contexto.EMI = [{ ...oferta, catalogo: true }];
    contexto.comprobarCatalogoEmbebido = () => true;
    contexto.pintarFiltrosEmision = () => {};
    contexto.pintarEmisiones = contexto.pintarEscaparateLocal = () => { html = contexto.tarjetaOfertaLocal(oferta); };
    contexto.setTimeout = (fn, espera) => { assert.ok(espera > 0); temporizador = fn; return 1; };
    const codigo = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'rwadar-20260820.js'), 'utf8');
    const inicio = codigo.indexOf('function refrescarVigenciaOfertas(){');
    const fin = codigo.indexOf('\nprogramarRevisionVigenciaOfertas();', inicio);
    assert.ok(inicio > 0 && fin > inicio);
    vm.runInContext(codigo.slice(inicio, fin), contexto);
    contexto.refrescarVigenciaOfertas();
    assert.match(html, /cifras válidas hasta hoy/);
    contexto.abrirDetalleOfertaLocal(oferta.slug);
    assert.match(contexto.document.getElementById().innerHTML, /97,13/);
    contexto.programarRevisionVigenciaOfertas();
    reloj.setTime(caducada.getTime());
    temporizador();
    assert.doesNotMatch(html, centinelas);
    assert.match(html, /escaparate-estado-linea caducado/);
    contexto.abrirDetalleOfertaLocal(oferta.slug);
    assert.doesNotMatch(contexto.document.getElementById().innerHTML, centinelas);
  }
});

function componentesMoviles(ahora, simulacion = {}) {
  const crear = (type, props, ...children) => typeof type === 'function' && type.name === 'FilaMetrica'
    ? type(props) : { type: typeof type === 'function' ? type.name : type, props, children };
  class FechaControlada extends Date {
    constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); }
  }
  return cargarModulo('componentes/Ofertas.js', {
    react: { createElement: crear, useState: (v) => [typeof v === 'function' ? v() : v, () => {}], useEffect() {}, ...simulacion.react },
    'react-native': { ...Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map((n) => [n, n])), Animated: {View:'AnimatedView'}, StyleSheet: { create: (v) => v }, AppState: simulacion.AppState },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../lib/ficha-editorial': require('../lib/ficha-editorial'),
    // La transparencia de la web (03/11/2026): puntos fuertes y forma corta.
    '../lib/transparencia': cargarModulo('lib/transparencia.js', {
      './transparencia-contenido': cargarModulo('lib/transparencia-contenido.js'),
    }),
    '../fixtures/imagenes-editoriales': { ETIQUETA_EDITORIAL: 'Ilustración editorial', imagenEditorial: () => null,
      imagenEditorialOferta: () => null },
    '../lib/datos': datosMoviles,
    '../lib/verificacion-local': movil,
    '../lib/tema': { C: {}, COLOR_CATEGORIA: {}, F: {}, R: {}, T: {}, UI: {}, iniciales: () => 'PR' },
    './Navegacion': { Icono: 'Icono' },
    './useTransicionFicha': { default: (_visible, cerrar) => ({ cerrar, estilo: {} }), __esModule: true },
  }, { Date: FechaControlada, setTimeout: simulacion.setTimeout || (() => 1), clearTimeout: simulacion.clearTimeout || (() => {}) });
}

// Inspecciona texto y accesibilidad renderizados, no el prop interno del hijo.
function textoRenderizado(nodo) {
  if (nodo == null || nodo === false) return '';
  if (Array.isArray(nodo)) return nodo.map(textoRenderizado).join(' ');
  if (typeof nodo !== 'object') return String(nodo);
  return [nodo.props?.accessibilityLabel, textoRenderizado(nodo.children)].filter(Boolean).join(' ');
}

test('tarjeta, accesibilidad y detalle móvil ocultan precio/yield vencidos sin mutar la fuente', () => {
  const original = structuredClone(oferta);
  const componentes = componentesMoviles(caducada);
  for (const tipo of ['rendimiento', 'valor', 'secundario']) {
    const dato = { ...oferta, tipo };
    for (const render of [componentes.FichaOferta, componentes.DetalleOferta]) {
      const texto = textoRenderizado(render({ oferta: dato }));
      assert.doesNotMatch(texto, centinelas);
      assert.match(texto, render === componentes.FichaOferta ? /cifras ocultas/ : /Consultar emisor/);
      assert.doesNotMatch(texto, /Pendiente de revisión|Producto activo/);
    }
  }
  assert.deepEqual(oferta, original);
  const vigente = componentesMoviles(ultimoDia);
  assert.doesNotMatch(textoRenderizado(vigente.FichaOferta({ oferta })), centinelas);
  assert.match(textoRenderizado(vigente.DetalleOferta({ oferta })), /97,13/);
});

test('una app abierta retira las cifras al cambiar de día y al volver de suspensión', () => {
  for (const evento of ['medianoche', 'reactivacion']) {
    const reloj = new Date(ultimoDia);
    let estado, limpiar, temporizador, reactivar, retiroEscucha = false;
    const componentes = componentesMoviles(reloj, {
      react: {
        useState(inicial) { if (!estado) estado = inicial(); return [estado, (v) => { estado = v; }]; },
        useEffect(efecto) { if (!limpiar) limpiar = efecto(); },
      },
      AppState: { addEventListener(nombre, fn) { assert.equal(nombre, 'change'); reactivar = fn; return { remove() { retiroEscucha = true; } }; } },
      setTimeout(fn, espera) { assert.ok(espera > 0 && espera <= 86400100); temporizador = fn; return 1; },
    });
    // Fila compacta de la web (03/11/2026): una principal vigente enseña su vigencia.
    // «Cifras válidas N días más» desde el 04/11/2026 (LISTA-FINAL fila 14).
    assert.match(textoRenderizado(componentes.FichaOferta({ oferta })), /Cifras válidas/);
    assert.match(textoRenderizado(componentes.DetalleOferta({ oferta })), /97,13/);
    reloj.setTime(caducada.getTime());
    if (evento === 'medianoche') temporizador(); else reactivar('active');
    assert.doesNotMatch(textoRenderizado(componentes.FichaOferta({ oferta })), centinelas);
    assert.match(textoRenderizado(componentes.FichaOferta({ oferta })), /cifras ocultas/);
    assert.doesNotMatch(textoRenderizado(componentes.DetalleOferta({ oferta })), centinelas);
    limpiar();
    assert.equal(retiroEscucha, true);
  }
});

test('las fichas web y móvil muestran la referencia junto a la cifra vigente que se omite en tarjetas', () => {
  const { contexto } = cargarWeb(ultimoDia);
  const componentes = componentesMoviles(ultimoDia);
  for (const dato of [
    { ...oferta, rentabilidad: { mostrada: '97,13 %', literal: 'Anualizada a 30 días; variable, no garantizada.' } },
    { ...oferta, tipo: 'valor', precio: { mostrado: '5 CHF', unidad: 'Última operación 20-09-2026; no es un precio ejecutable.' } },
  ]) {
    const referencia = dato.tipo === 'valor' ? dato.precio.unidad : dato.rentabilidad.literal;
    assert.ok(!contexto.tarjetaOfertaLocal(dato).includes(referencia));
    contexto.ESCAPARATE_LOCAL = { ofertas: [dato], secundario: [] };
    contexto.abrirDetalleOfertaLocal(dato.slug);
    assert.ok(contexto.document.getElementById().innerHTML.includes(referencia));
    const tarjeta = componentes.FichaOferta({ oferta: dato });
    assert.ok(!textoRenderizado(tarjeta).includes(referencia));
    const detalle = componentes.DetalleOferta({ oferta: dato });
    assert.ok(textoRenderizado(detalle).includes(referencia));
    const nodos = [];
    const recorrer = n => {
      if (Array.isArray(n)) return n.forEach(recorrer);
      if (n && typeof n === 'object') { nodos.push(n); recorrer(n.children); }
    };
    recorrer(detalle);
    assert.ok(nodos.some(n => n.type === 'Text' && n.children.includes(referencia) && !n.props.numberOfLines));
  }
});

test('el detalle conserva acceso a fuentes fechadas cuando retira las cifras', () => {
  const componentes = componentesMoviles(caducada);
  const fuente = 'https://example.test/fuente-oficial';
  const detalle = componentes.DetalleOferta({ oferta: { ...oferta, fuentesActuales: [fuente] } });
  const texto = textoRenderizado(detalle);
  assert.match(texto, /Otras fuentes consultadas/);
  assert.match(texto, /Revisión del catálogo:\s*21\/09\/2026/);
  assert.ok(texto.includes(fuente));
  assert.match(texto, /contratación y el pago se realizan directamente con el proveedor/);
  assert.doesNotMatch(texto, centinelas);
});

test('una referencia del 27 de septiembre conserva su revisión documental el día 30 sin revivir cifras ni apertura', () => {
  const ahora = new Date('2026-09-30T12:00:00Z');
  const componentes = componentesMoviles(ahora);
  const fuente = 'https://example.test/fuente-documental';
  for (const estadoRevision of ['actual', 'no_verificable', 'fuentes_en_conflicto']) {
    const dato = { ...oferta, verificadaEl: '2026-09-27', fuentesActuales: [fuente],
      estadoRevision, permanente: true,
      avisos: [{ tono: 'warn', texto: 'La inversión puede perder valor.' }] };
    const original = structuredClone(dato);
    const documentacion = movil.documentacionOferta(dato, ahora);
    assert.equal(documentacion.fecha, '2026-09-27');
    assert.deepEqual(documentacion.fuentes, [fuente]);
    assert.equal(movil.cifrasOfertaVigentes(dato, ahora), false);
    const sanitizada = movil.ofertaConCifrasVigentes(dato, ahora);
    assert.equal(sanitizada.estadoRevision, estadoRevision);
    assert.equal(sanitizada.verificadaEl, '2026-09-27');
    assert.equal(sanitizada.vigenciaDias, 1);
    assert.equal(sanitizada.disponibleEs, null);
    for (const render of [componentes.FichaOferta, componentes.DetalleOferta]) {
      const texto = textoRenderizado(render({ oferta: dato }));
      assert.match(texto, /(?:Revisión documental|Revisión del catálogo:)\s*27\/09\/2026/);
      assert.match(texto, render === componentes.FichaOferta
        ? estadoRevision === 'fuentes_en_conflicto' ? /Las fuentes no coinciden/ : /cifras ocultas/
        : /Consultar emisor/);
      assert.match(texto, /La inversión puede perder valor/);
      assert.doesNotMatch(texto, /Pendiente de revisión|Producto activo|Disponible desde España/);
      assert.doesNotMatch(texto, centinelas);
    }
    const detalle = textoRenderizado(componentes.DetalleOferta({ oferta: dato }));
    assert.ok(detalle.includes(fuente));
    assert.match(detalle, /Sin comprobar desde España/);
    if (estadoRevision === 'no_verificable') assert.match(detalle, /Apertura no confirmada/);
    if (estadoRevision === 'fuentes_en_conflicto') assert.match(detalle, /Fuentes oficiales en conflicto/);
    assert.deepEqual(dato, original);
  }
});

test('el sello documental exige fuentes HTTPS y una fecha real no futura, incluso sin cifras', () => {
  const ahora = new Date('2026-09-30T12:00:00Z');
  const dato = { ...oferta, verificadaEl: '2026-09-27', fuentesActuales: ['https://example.test/fuente'] };
  for (const cambio of [
    { fuentesActuales: [] }, { fuentesActuales: ['javascript:alert(1)'] },
    { fuentesActuales: ['https://usuario:secreto@example.test'] },
    { verificadaEl: '2026-10-01' }, { verificadaEl: '2026-02-30' }, { verificadaEl: '' },
  ]) {
    const sinEvidencia = { ...dato, ...cambio };
    assert.equal(movil.documentacionOferta(sinEvidencia, ahora), null);
    assert.doesNotMatch(textoRenderizado(componentesMoviles(ahora).FichaOferta({ oferta: sinEvidencia })), /Revisión documental|Fuente consultada/);
  }
});

test('la ficha documental y sus referencias históricas sobreviven al TTL sin presentarse como cotización actual', () => {
  const fuente = 'https://example.test/historico';
  const documentacion = {
    revisadaEl: '2026-09-30', descripcion: 'Participación documentada en un edificio residencial.',
    fuentes: [fuente], caracteristicas: [{ etiqueta: 'Tipo de activo', valor: 'Inmobiliario residencial' }],
    referencias: [{ etiqueta: 'Precio publicado', valor: '54,20 CHF', fechaDato: '2026-09-26',
      fechaConsulta: '2026-09-27', fuente, alcance: 'Última operación documentada; no es un precio ejecutable.' }],
  };
  const dato = { ...oferta, verificadaEl: '2026-09-27', documentacion };
  const original = structuredClone(dato);
  const ahora = new Date('2026-09-30T12:00:00Z');
  const vista = movil.ofertaConCifrasVigentes(dato, ahora);
  assert.equal(vista.precio, null);
  assert.equal(vista.rentabilidad, null);
  assert.equal(vista.disponibleEs, null);
  assert.deepEqual(vista.documentacion, documentacion);
  const componentes = componentesMoviles(ahora);
  const tarjeta = textoRenderizado(componentes.FichaOferta({ oferta: dato }));
  assert.match(tarjeta, /Fuente consultada 27\/09\/2026/);
  assert.doesNotMatch(tarjeta, /Fuente consultada 30\/09\/2026/);
  assert.match(tarjeta, /cifras ocultas/);
  assert.doesNotMatch(tarjeta, /54,20|97,13|9876|1234|4455/);
  const detalle = textoRenderizado(componentes.DetalleOferta({ oferta: dato }));
  assert.match(detalle, /Revisión del catálogo:\s*30\/09\/2026/);
  for (const esperado of ['Características documentadas', documentacion.descripcion, 'Inmobiliario residencial',
    'Referencias fechadas', 'No son precios actuales', '54,20 CHF', '26/09/2026',
    '27/09/2026', documentacion.referencias[0].alcance, fuente]) assert.ok(detalle.includes(esperado), esperado);
  assert.doesNotMatch(detalle, centinelas);
  assert.deepEqual(dato, original);
  assert.doesNotMatch(datosMoviles.textoBusquedaOferta({ ...dato, verificadaEl: '2000-01-01' }), /54,20/);
});

test('una referencia documental inválida o de otra fuente no se convierte en información verificada', () => {
  const fuente = 'https://example.test/primaria';
  const documento = {
    revisadaEl: '2026-09-30', descripcion: 'Ficha de prueba con referencias fechadas.',
    fuentes: [fuente], caracteristicas: [{ etiqueta: 'Activo', valor: 'Participación documentada' }], referencias: [{ etiqueta: 'Precio', valor: '54 CHF',
      fechaDato: null, fechaConsulta: '2026-09-30', fuente, alcance: 'Dato histórico sin cotización vigente.' }],
  };
  const ahora = new Date('2026-09-30T12:00:00Z');
  assert.ok(movil.documentacionOferta({ ...oferta, documentacion: documento }, ahora));
  for (const cambio of [
    { fechaDato: '2026-10-01' }, { fechaConsulta: '2026-10-01' },
    { fechaDato: '2026-02-30' }, { fuente: 'https://example.test/otra' },
    { alcance: '' }, { fuente: 'javascript:alert(1)' },
  ]) {
    const documentacion = { ...documento, referencias: [{ ...documento.referencias[0], ...cambio }] };
    assert.equal(movil.documentacionOferta({ ...oferta, documentacion }, ahora), null);
  }
});

test('las 28 fichas reales conservan documentación y referencias fechadas en web pública y móvil el 30/09', () => {
  const raiz = path.join(RAIZ, '..', 'rwadar-app', 'data', 'verificaciones');
  const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, '2026-09-28', 'escaparate-publicacion.json'), 'utf8'));
  const documentos = JSON.parse(fs.readFileSync(path.join(raiz, '2026-09-30', 'documentacion-ofertas.json'), 'utf8'));
  const ahora = new Date('2026-09-30T12:00:00Z');
  const { contexto, dialogo } = cargarWeb(ahora);
  contexto.MODO_LOCAL_SEGURO = false;
  contexto.ESCAPARATE_LOCAL = null;
  contexto.CATALOGO_EMBEBIDO_BLOQUEADO = false;
  const categorias = [...new Set(catalogo.ofertas.map(o => o.categoria))];
  contexto.CATMETA = Object.fromEntries(categorias.map(c => [c, {}]));
  contexto.EDITORIAL_OFERTA_POR_CATEGORIA = Object.fromEntries(categorias.map(c => [c, { src: '/propia.webp', alt: 'Editorial' }]));
  cargarFuncionesWeb(contexto, ['textoDato', 'numeroRemoto', 'booleanoOpcional', 'cifraCatalogoRemota', 'fechaOfertaPublicaValida', 'ofertaCatalogoRemota']);
  const apiOfertas = catalogo.ofertas.map(o => ({ ...o, revision_id: '12345678-1234-4000-8000-123456789012',
    plataforma_slug: o.plataformaSlug, plataforma_nombre: o.plataformaNombre, verificada_el: o.verificadaEl,
    vigencia_dias: o.vigenciaDias, disponible_es: o.disponibleEs, fuera_ladrillo: o.fueraLadrillo,
    estado_revision: o.estadoRevision, fuentes_actuales: o.fuentesActuales, patrocinada: false,
    documentacion: documentos[o.slug] }));
  contexto.EMI = apiOfertas.map(o => contexto.ofertaCatalogoRemota(o, '2026-09-28'));
  const componentes = componentesMoviles(ahora);
  assert.equal(contexto.EMI.length, 28);
  assert.equal(Object.keys(documentos).length, 28);
  const original = structuredClone(contexto.EMI);
  for (const o of contexto.EMI) {
    const doc = documentos[o.slug];
    require('../lib/contrato-catalogo').validarDocumentacionOferta(doc, o.slug, { hoy: ahora });
    assert.ok(contexto.documentacionOfertaLocal(o), o.slug);
    assert.ok(movil.documentacionOferta(o, ahora), o.slug);
    const tarjetaWeb = contexto.tarjetaOfertaLocal(o);
    const tarjetaMovil = textoRenderizado(componentes.FichaOferta({ oferta: o }));
    for (const tarjeta of [tarjetaWeb, tarjetaMovil]) {
      assert.match(tarjeta, /No verificado/);
      assert.match(tarjeta, /Sin confirmar/);
      assert.doesNotMatch(tarjeta, /Pendiente de revisión/);
    }
    assert.match(tarjetaWeb, /Doc\./);
    assert.ok(tarjetaWeb.includes(`datetime="${doc.revisadaEl}"`), o.slug);
    const ultimaConsulta = doc.referencias.map(r => r.fechaConsulta).sort().at(-1);
    assert.ok(tarjetaMovil.includes(ultimaConsulta
      ? `Fuente consultada ${movil.fechaVerificacionLocalVisible(ultimaConsulta)}`
      : `Revisión documental ${movil.fechaVerificacionLocalVisible(doc.revisadaEl)}`), o.slug);
    assert.ok(tarjetaWeb.includes('data-oferta-detalle="'+o.slug+'"'));
    assert.equal(contexto.ofertaDetalleLocalPorSlug(o.slug), o);
    contexto.abrirDetalleOfertaLocal(o.slug);
    const detalleWeb = dialogo.innerHTML;
    const detalleMovil = textoRenderizado(componentes.DetalleOferta({ oferta: o }));
    assert.ok(detalleWeb.includes(contexto.escHtml(doc.descripcion)), o.slug);
    assert.ok(detalleMovil.includes(doc.descripcion), o.slug);
    for (const referencia of doc.referencias) {
      assert.ok(detalleWeb.includes(contexto.escHtml(referencia.valor)), o.slug);
      assert.ok(detalleWeb.includes(contexto.escHtml(referencia.alcance)), o.slug);
      assert.ok(detalleWeb.includes(referencia.fechaConsulta), o.slug);
      assert.ok(detalleMovil.includes(referencia.valor), o.slug);
      assert.ok(detalleMovil.includes(referencia.alcance), o.slug);
    }
    assert.equal(contexto.estadoVigenciaLocal(o).clase, 'caducado', o.slug);
    assert.equal(movil.cifrasOfertaVigentes(o, ahora), false, o.slug);
  }
  assert.deepEqual(structuredClone(contexto.EMI), original);
  contexto.CATALOGO_EMBEBIDO_BLOQUEADO = true;
  assert.equal(contexto.ofertaDetalleLocalPorSlug(contexto.EMI[0].slug), null);
});

test('un modal público abierto actualiza su documento y se cierra al retirarse el lote', () => {
  const { contexto, dialogo } = cargarWeb(new Date('2026-09-30T12:00:00Z'));
  const doc = { revisadaEl: '2026-09-30', descripcion: 'Descripción documental antes de la actualización.',
    fuentes: ['https://example.test/fuente'], caracteristicas: [{ etiqueta: 'Activo', valor: 'Descripción estable' }], referencias: [] };
  const o = { ...oferta, catalogo: true, documentacion: doc };
  contexto.MODO_LOCAL_SEGURO = false; contexto.ESCAPARATE_LOCAL = null;
  contexto.EMI = [o]; contexto.CATALOGO_EMBEBIDO_BLOQUEADO = false;
  contexto.abrirDetalleOfertaLocal(o.slug);
  assert.equal(dialogo.open, true);
  assert.ok(dialogo.innerHTML.includes(doc.descripcion));
  contexto.EMI = [{ ...o, documentacion: { ...doc, descripcion: 'Descripción documental corregida desde la respuesta nueva.' } }];
  contexto.refrescarDetalleOfertaAbierto();
  assert.ok(dialogo.innerHTML.includes('corregida desde la respuesta nueva'));
  assert.ok(!dialogo.innerHTML.includes(doc.descripcion));
  contexto.comprobarCatalogoEmbebido = () => { contexto.EMI.length = 0; contexto.CATALOGO_EMBEBIDO_BLOQUEADO = true; return false; };
  contexto.pintarFiltrosEmision = contexto.pintarEmisiones = () => {};
  contexto.pintarCierreCatalogo = () => {}; // El DOM completo del radar se ensaya en probar-web.mjs.
  cargarFuncionesWeb(contexto, ['refrescarVigenciaOfertas']);
  contexto.refrescarVigenciaOfertas();
  assert.equal(dialogo.open, false);
  assert.equal(dialogo.innerHTML, '');
  assert.equal(dialogo.getAttribute('data-oferta-slug'), undefined);
});

test('el botón público de detalles funciona sin activar la interfaz local ni duplicar el listener', () => {
  const { contexto, dialogo } = cargarWeb(caducada);
  const o = { ...oferta, catalogo: true };
  const escuchas = [];
  const seccion = { dataset: {}, addEventListener(tipo, fn) { escuchas.push([tipo, fn]); } };
  contexto.MODO_LOCAL_SEGURO = false;
  contexto.ESCAPARATE_LOCAL = null;
  contexto.EMI = [o];
  contexto.document.getElementById = id => id === 'emisiones' ? seccion : dialogo;
  contexto.activarDetallesOfertas();
  contexto.activarDetallesOfertas();
  assert.equal(escuchas.length, 1);
  escuchas[0][1]({ target: { closest(selector) {
    assert.equal(selector, '[data-oferta-detalle]'); return { dataset: { ofertaDetalle: o.slug } };
  } } });
  assert.match(dialogo.innerHTML, /Oferta de prueba/);
  assert.match(dialogo.innerHTML, /Consultar emisor/);
  assert.equal(contexto.ESCAPARATE_LOCAL, null);
  contexto.EMI = [{ ...o, catalogo: false }];
  assert.equal(contexto.ofertaDetalleLocalPorSlug(o.slug), null);
});

test('web y contrato compartido rechazan la misma documentación inválida y escapan texto de fuentes', () => {
  const ahora = new Date('2026-09-30T12:00:00Z');
  const { contexto } = cargarWeb(ahora);
  const validar = require('../lib/contrato-catalogo').validarDocumentacionOferta;
  const fuente = 'https://example.test/fuente?a=1&b=2';
  const base = { revisadaEl: '2026-09-30', descripcion: 'Descripción documental <b>con texto</b>', fuentes: [fuente],
    caracteristicas: [{ etiqueta: '<Tipo>', valor: '<script>alert(1)</script>' }],
    referencias: [{ etiqueta: '<precio>', valor: '54 CHF', fechaDato: null, fechaConsulta: '2026-09-29', fuente,
      alcance: 'Referencia histórica sin precio ejecutable.' }] };
  const casos = [base, ...[
    d => { d.revisadaEl = '2026-10-01'; }, d => { d.revisadaEl = '2026-02-30'; },
    d => { d.descripcion = 'corta'; }, d => { d.caracteristicas = []; },
    d => { d.fuentes.push(fuente); }, d => { d.fuentes = ['javascript:alert(1)']; },
    d => { d.referencias[0].fechaDato = '2026-09-30'; }, d => { d.referencias[0].fechaConsulta = '2026-10-01'; },
    d => { d.referencias[0].fuente = 'https://example.test/otra'; },
    d => { d.referencias[0].alcance = ''; }, d => { d.referencias[0].fechaDato = '2026-02-30'; },
  ].map(cambiar => { const d = structuredClone(base); cambiar(d); return d; })];
  for (const documentacion of casos) {
    let valida = true;
    try { validar(documentacion, 'prueba', { hoy: ahora }); } catch { valida = false; }
    assert.equal(!!contexto.documentacionOfertaLocal({ ...oferta, documentacion }), valida);
    assert.equal(!!movil.documentacionOferta({ ...oferta, documentacion }, ahora), valida);
  }
  const html = contexto.documentacionOfertaHtml(base);
  assert.doesNotMatch(html, /<script>|<b>con texto<\/b>|javascript:/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a=1&amp;b=2/);
});

function loteV2Cliente() {
  const fixture = require('../fixtures/escaparate-local.json');
  const meta = { version_esquema: 2, plataformas_esperadas: 26, ofertas_esperadas: 49,
    colecciones_esperadas: { principales: 24, secundario: 21, en_camino: 4 },
    verificado_lote_el: '2026-09-21', vigencia_lote_dias: 7,
    revision_id: '12345678-1234-4000-8000-123456789012' };
  const plataformas = fixture.plataformas.map((p, i) => ({ ...structuredClone(p), ...structuredClone(meta),
    verificada_el: p.verificada_el || p.verificadaEl,
    verificacion_local: structuredClone(p.verificacionLocal),
    plataforma_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}` }));
  const ofertas = [];
  for (const [coleccion, n] of Object.entries(meta.colecciones_esperadas)) {
    for (let i = 0; i < n; i++) {
      const o = structuredClone(fixture.ofertas[i]);
      ofertas.push({ ...o, ...structuredClone(meta), coleccion,
        slug: `${coleccion.replace('_', '-')}-${o.slug}`, plataforma_slug: o.plataformaSlug,
        plataforma_nombre: o.plataformaNombre, verificada_el: o.verificadaEl,
        vigencia_dias: o.vigenciaDias, estado_revision: coleccion === 'principales' ? o.estadoRevision : 'no_verificable',
        disponible_es: null, puntuacion: null, fuentes_actuales: o.fuentesActuales, patrocinada: false,
        precio: coleccion === 'principales' ? o.precio : null,
        rentabilidad: coleccion === 'principales' ? o.rentabilidad : null,
        documentacion: { revisadaEl: '2026-09-27', descripcion: 'Descripción estable del activo documental en esta prueba.',
          fuentes: [o.url], caracteristicas: [{ etiqueta: 'Clase', valor: 'Activo documentado' }],
          referencias: [{ etiqueta: 'Referencia histórica', valor: '9043 CHF', fechaDato: '2026-09-20',
            fechaConsulta: '2026-09-27', fuente: o.url, alcance: 'Dato histórico de prueba, sin cotización ni oferta actual.' }] },
      });
    }
  }
  return { version: 2, plataformas, ofertas };
}

function webV2Cliente(lote, ahora = new Date('2026-09-27T12:00:00Z')) {
  const { contexto, dialogo } = cargarWeb(ahora);
  const clases = { add() {}, remove() {}, toggle() {} };
  const nodos = Object.fromEntries(['emiLista', 'emisiones', 'movilOfertasFuturo', 'emisInformacion', 'movilOfertasEstado',
    'avisoCatalogoRadar', 'avisoCatalogoOfertas']
    .map(id => [id, { innerHTML: '', textContent: '', hidden: true, classList: clases }]));
  contexto.document.getElementById = id => id === 'escaparateDetalleLocal' ? dialogo : nodos[id];
  Object.assign(contexto, { MODO_LOCAL_SEGURO: false, ESCAPARATE_LOCAL: null,
    CATALOGO_EMBEBIDO_BLOQUEADO: false, CATALOGO_CADUCADO: false, CATALOGO_SIN_COMPROBAR: false,
    CATALOGO_RETIRADO: false, emiCat: '', emiOrden: 'rent', emiColeccion: 'principales' });
  cargarFuncionesWeb(contexto, ['CATMETA', 'ACCESOS', 'TICKETS', 'EDITORIAL_OFERTA_POR_CATEGORIA', 'EDITORIAL_OFERTA_POR_SLUG',
    'textoDato', 'numeroRemoto', 'booleanoOpcional', 'cifraCatalogoRemota',
    'ESTADOS_VERIFICACION_LOCAL', 'fuenteVerificacionLocal', 'campoVerificacionLocal', 'validarVerificacionLocal',
    'MANIFIESTO_CATALOGO_V2_ACEPTADO', 'metadatosCatalogoV2', 'validarManifiestoCatalogoV2',
    'recordarManifiestoCatalogoV2', 'edadLoteDias', 'validarRevisionCatalogo',
    'fechaOfertaPublicaValida', 'ofertaCatalogoRemota', 'plataformaRemota', 'plataformaCatalogoRemota',
    'validarLoteCatalogoRemotoV2', 'comprobarCatalogoEmbebido', 'textoAvisoCatalogo', 'textoPieRevision',
    'pintarAvisoCatalogo', 'pintarEmisiones', 'seccionReferenciasCatalogo']);
  const fecha = contexto.validarLoteCatalogoRemotoV2(lote.plataformas, lote.ofertas);
  contexto.P = lote.plataformas.map(p => contexto.plataformaCatalogoRemota(p, fecha));
  contexto.EMI = lote.ofertas.map(o => contexto.ofertaCatalogoRemota(o, fecha));
  return { contexto, dialogo, nodos };
}

test('V2 recorre REST y normalizadores hasta tres grupos web y detalles documentales móviles', () => {
  const lote = loteV2Cliente(), ahora = new Date('2026-09-27T12:00:00Z');
  const { contexto, nodos, dialogo } = webV2Cliente(lote, ahora);
  const adaptado = require('../lib/catalogo-remoto').adaptarCatalogoV2(lote, ahora);
  assert.equal(contexto.comprobarCatalogoEmbebido(), true);
  contexto.pintarEmisiones();
  const html = nodos.emiLista.innerHTML;
  assert.match(nodos.movilOfertasEstado.textContent, /24 de 24 principales/);
  assert.match(html, /21 de 21 referencias/); assert.match(html, /4 de 4 referencias/);
  assert.match(html, /No confirman precio, liquidez ni disponibilidad actuales/);
  assert.match(html, /No confirman apertura, fecha de lanzamiento ni acceso/);
  assert.doesNotMatch(html, /9043 CHF/);
  const principales = html.slice(0, html.indexOf('<details class="catalogo-referencias"'));
  assert.equal((principales.match(/data-oferta-detalle=/g) || []).length, 24);
  const componentes = componentesMoviles(ahora);
  for (const o of adaptado.ofertas.filter(o => o.coleccion !== 'principales')) {
    contexto.abrirDetalleOfertaLocal(o.slug);
    assert.equal(dialogo.open, true); assert.match(dialogo.innerHTML, /9043 CHF/);
    assert.match(dialogo.innerHTML, /2026-09-20/); assert.match(dialogo.innerHTML, /2026-09-27/);
    const tarjeta = textoRenderizado(componentes.FichaOferta({ oferta: o }));
    assert.match(tarjeta, o.coleccion === 'secundario' ? /Referencia de reventa · disponibilidad sin confirmar/ : /Anuncio documentado · apertura sin confirmar/); assert.doesNotMatch(tarjeta, /9043 CHF/);
    assert.match(textoRenderizado(componentes.DetalleOferta({ oferta: o })), /9043 CHF/);
  }
});

test('V2 web y móvil rechazan a la vez manifiestos parciales, metadatos y colecciones adulteradas', () => {
  const base = loteV2Cliente();
  const { contexto } = webV2Cliente(base);
  const adaptar = require('../lib/catalogo-remoto').adaptarCatalogoV2;
  for (const cambiar of [
    l => { l.ofertas.pop(); }, l => { l.plataformas.pop(); },
    l => { l.ofertas[0].revision_id = '87654321-1234-4000-8000-123456789012'; },
    l => { l.ofertas[0].colecciones_esperadas.secundario = 20; },
    l => { l.ofertas[0].vigencia_lote_dias = 1; },
    l => { l.ofertas[24].coleccion = 'principales'; },
    l => { l.ofertas[24].estado_revision = 'actual'; },
    l => { l.ofertas[24].precio = { mostrado: '777 CHF', unidad: 'token' }; },
    l => { l.ofertas[24].disponible_es = true; },
    l => { delete l.ofertas[0].documentacion; },
  ]) {
    const lote = structuredClone(base); cambiar(lote);
    assert.throws(() => contexto.validarLoteCatalogoRemotoV2(lote.plataformas, lote.ofertas), String(cambiar));
    assert.throws(() => adaptar(lote, new Date('2026-09-27T12:00:00Z')), String(cambiar));
  }
});

test('V2 conserva los tres grupos y el detalle abierto al vencer el lote, con el aviso de revisión pendiente', () => {
  const { contexto, dialogo, nodos } = webV2Cliente(loteV2Cliente());
  contexto.abrirDetalleOfertaLocal(contexto.EMI.find(o => o.coleccion === 'secundario').slug);
  assert.equal(dialogo.open, true);
  contexto.Date = class extends Date { constructor(...args) { super(...(args.length ? args : ['2026-09-29T00:00:00Z'])); } };
  contexto.pintarFiltrosEmision = () => {};
  contexto.pintarCierreCatalogo = () => assert.fail('un lote caducado no se retira');
  cargarFuncionesWeb(contexto, ['refrescarVigenciaOfertas']);
  contexto.refrescarVigenciaOfertas();
  assert.equal(contexto.P.length, 26); assert.equal(contexto.EMI.length, 49);
  assert.equal(contexto.CATALOGO_CADUCADO, true); assert.equal(contexto.CATALOGO_EMBEBIDO_BLOQUEADO, false);
  assert.equal(dialogo.open, true);
  assert.match(nodos.emiLista.innerHTML, /data-oferta-detalle=/);
  assert.equal(nodos.avisoCatalogoOfertas.hidden, false);
  assert.match(nodos.avisoCatalogoOfertas.textContent, /^Revisión pendiente\. /);
  assert.ok(contexto.EMI.filter(o => o.coleccion === 'principales')
    .every(o => contexto.estadoVigenciaLocal(o).clase === 'caducado' || o.verificadaEl >= '2026-09-23'));
});

test('las colecciones documentales tampoco recuperan cifras manipuladas al renderizar', () => {
  const ahora = new Date('2026-09-22T12:00:00Z');
  const { contexto } = cargarWeb(ahora);
  const componentes = componentesMoviles(ahora);
  for (const coleccion of ['secundario', 'en_camino']) {
    const o = { ...oferta, coleccion };
    assert.equal(movil.cifrasOfertaVigentes(o, ahora), false);
    assert.doesNotMatch(contexto.tarjetaOfertaLocal(o), centinelas);
    assert.doesNotMatch(textoRenderizado(componentes.FichaOferta({ oferta: o })), centinelas);
    assert.doesNotMatch(textoRenderizado(componentes.DetalleOferta({ oferta: o })), centinelas);
  }
});

test('una recarga web V2 parcial conserva los tres grupos y el diálogo con aviso, sin consultar las vistas V1', async () => {
  const lote = loteV2Cliente();
  const { contexto, dialogo } = webV2Cliente(lote);
  contexto.abrirDetalleOfertaLocal(contexto.EMI[0].slug);
  const rutas = [];
  contexto.API = 'https://example.test/rest/v1'; contexto.CLAVE_PUB = 'public-test';
  contexto.fetch = async url => {
    rutas.push(url);
    const data = url.includes('/catalogo_plataformas_publicas_v2') ? lote.plataformas
      : url.includes('/catalogo_ofertas_publicas_v2') ? lote.ofertas.slice(0, -1) : [{}, {}, {}, {}];
    return { ok: true, json: async () => data };
  };
  contexto.pintarCierreCatalogo = contexto.pintarFiltrosEmision = () => {};
  cargarFuncionesWeb(contexto, ['alDia', 'refrescarVigenciaOfertas']);
  await assert.rejects(() => contexto.alDia(), /incompleto/);
  assert.ok(rutas.some(url => url.includes('/catalogo_ofertas_publicas_v2?')));
  assert.ok(rutas.some(url => url.includes('/catalogo_publicacion?select=retirado,motivo')));
  assert.ok(rutas.every(url => !/catalogo_(?:plataformas|ofertas)_publicas\?/.test(url)));
  assert.equal(contexto.P.length, 26); assert.equal(contexto.EMI.length, 49);
  assert.equal(contexto.CATALOGO_EMBEBIDO_BLOQUEADO, false);
  assert.equal(contexto.CATALOGO_SIN_COMPROBAR, true);
  assert.equal(dialogo.open, true);
});

test('la nueva categoría Crédito privado conserva ilustración propia en las dos interfaces', () => {
  const manifiesto = require('../assets/ofertas-editoriales/manifest.json');
  const mocks = { '../assets/ofertas-editoriales/manifest.json': manifiesto };
  for (const entrada of [...manifiesto.archivos, ...manifiesto.fichas]) {
    mocks[`../assets/ofertas-editoriales/${entrada.archivo}`] = entrada.archivo;
  }
  const imagenes = cargarModulo('fixtures/imagenes-editoriales.js', mocks);
  const editorial = imagenes.imagenEditorial('Crédito privado');
  assert.equal(editorial.archivo, 'capital-privado-rwadar.webp');
  assert.match(editorial.alt, /Ilustración editorial/);
  assert.match(editorial.alt, /no representa un activo concreto/);
  const { contexto } = cargarWeb(ultimoDia);
  cargarFuncionesWeb(contexto, ['EDITORIAL_OFERTA_POR_CATEGORIA']);
  const web = contexto.imagenOfertaLocal({ catalogo: true, slug: 'credito-privado-prueba', categoria: 'Crédito privado' });
  assert.equal(web.src, '/ofertas-editoriales/oferta-credito-privado-prueba.webp');
  assert.equal(web.respaldo, '/ofertas-editoriales/'+editorial.archivo);
  assert.match(web.alt, /generada con IA; no es fotografía del activo/);
  assert.equal(vm.runInContext('EDITORIAL_OFERTA_POR_CATEGORIA', contexto)['Crédito privado'].alt, editorial.alt);
});

test('web y app eligen la misma ilustración de cada ficha y caen a la de su categoría', () => {
  const manifiesto = require('../assets/ofertas-editoriales/manifest.json');
  const mocks = { '../assets/ofertas-editoriales/manifest.json': manifiesto };
  for (const entrada of [...manifiesto.archivos, ...manifiesto.fichas]) {
    mocks[`../assets/ofertas-editoriales/${entrada.archivo}`] = entrada.archivo;
  }
  const imagenes = cargarModulo('fixtures/imagenes-editoriales.js', mocks);
  const { contexto } = cargarWeb(ultimoDia);
  cargarFuncionesWeb(contexto, ['EDITORIAL_OFERTA_POR_CATEGORIA', 'EDITORIAL_OFERTA_POR_SLUG']);
  assert.ok(manifiesto.fichas.length > 0);
  for (const ficha of manifiesto.fichas) {
    const oferta = { catalogo: true, slug: ficha.slug, categoria: ficha.categoria };
    const app = imagenes.imagenEditorialOferta(oferta);
    const web = contexto.imagenOfertaLocal(oferta);
    assert.equal(app.archivo, ficha.archivo, ficha.slug);
    assert.equal(web.src, `/ofertas-editoriales/${ficha.archivo}`, ficha.slug);
    assert.equal(web.alt, app.alt, ficha.slug);
    assert.equal(web.alt, ficha.alt, ficha.slug);
    assert.match(web.respaldo, /^\/ofertas-editoriales\/[a-z-]+-rwadar\.webp$/);
  }
  // Si la ficha cambia de categoría o no tiene ilustración, se usa la de su categoría.
  const primera = manifiesto.fichas[0];
  const otraCategoria = primera.categoria === 'Inmobiliario' ? 'Materias primas' : 'Inmobiliario';
  const cambiada = { catalogo: true, slug: primera.slug, categoria: otraCategoria };
  assert.equal(imagenes.imagenEditorialOferta(cambiada).archivo, imagenes.imagenEditorial(otraCategoria).archivo);
  assert.equal(contexto.imagenOfertaLocal(cambiada).src,
    vm.runInContext('EDITORIAL_OFERTA_POR_CATEGORIA', contexto)[otraCategoria].src);
  for (const slug of ['ficha-nueva', 'constructor', '__proto__', 'toString']) {
    const nueva = { catalogo: true, slug, categoria: 'Inmobiliario' };
    assert.equal(imagenes.imagenEditorialOferta(nueva).archivo, 'inmobiliario-rwadar.webp', slug);
    const web = contexto.imagenOfertaLocal(nueva);
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      assert.equal(web.src, '/ofertas-editoriales/oferta-'+slug+'.webp', slug);
      assert.equal(web.respaldo, '/ofertas-editoriales/inmobiliario-rwadar.webp', slug);
      assert.match(web.alt, /generada con IA; no es fotografía del activo/);
    } else assert.equal(web, null, slug);
  }
});

test('la entrega V2 real y versionada recorre 49 fichas, ambos clientes y el vencimiento de sus cifras', () => {
  const { cargarFuentesLocales, construirSqlImportacion } = require('../../rwadar-app/catalogo-publico');
  const fuentes = cargarFuentesLocales(path.join(RAIZ, '..'), { revision: '2026-09-30', versionEsquema: 2 });
  const { escaparate, radar, manifiesto } = fuentes;
  const importacion = construirSqlImportacion(fuentes);
  const canonicas = require('../fixtures/escaparate-local.json').plataformas;
  const meta = { version_esquema: manifiesto.versionEsquema,
    plataformas_esperadas: manifiesto.plataformasEsperadas, ofertas_esperadas: manifiesto.ofertasEsperadas,
    colecciones_esperadas: manifiesto.coleccionesEsperadas,
    verificado_lote_el: radar.verificadoEl, vigencia_lote_dias: 7, revision_id: importacion.revisionId };
  // Los datos comerciales y documentales vienen íntegros de la entrega versionada.
  // La identidad SQL de plataforma se simula; su revisión es la real del corte.
  const plataformas = escaparate.plataformas.map((p, i) => ({
    ...canonicas.find(c => c.slug === p.slug), ...p, ...meta, verificacion_local: p.verificacionLocal,
    plataforma_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  }));
  const ofertas = escaparate.ofertas.map(o => ({ ...o, ...meta, patrocinada: false,
    plataforma_slug: o.plataformaSlug, plataforma_nombre: o.plataformaNombre,
    verificada_el: o.verificadaEl, vigencia_dias: o.vigenciaDias, disponible_es: o.disponibleEs,
    fuera_ladrillo: o.fueraLadrillo, estado_revision: o.estadoRevision, fuentes_actuales: o.fuentesActuales,
  }));
  const lote = { version: 2, plataformas, ofertas };
  const original = structuredClone(lote);
  for (const instante of ['2026-09-30T12:00:00Z', '2026-10-02T00:00:00Z']) {
    const ahora = new Date(instante), { contexto, dialogo, nodos } = webV2Cliente(lote, ahora);
    const nativo = require('../lib/catalogo-remoto').adaptarCatalogoV2(lote, ahora);
    const componentes = componentesMoviles(ahora);
    assert.equal(contexto.comprobarCatalogoEmbebido(), true);
    assert.equal(nativo.plataformas.length, 26); assert.equal(nativo.ofertas.length, 49);
    assert.equal(nativo.fecha, '2026-09-28');
    contexto.pintarEmisiones();
    assert.match(nodos.movilOfertasEstado.textContent, /24 de 24 principales/);
    assert.match(nodos.emiLista.innerHTML, /21 de 21 referencias/);
    assert.match(nodos.emiLista.innerHTML, /4 de 4 referencias/);
    assert.equal((nodos.emiLista.innerHTML.match(/data-oferta-detalle=/g) || []).length, 49);
    for (const o of nativo.ofertas) {
      const doc = o.documentacion;
      contexto.abrirDetalleOfertaLocal(o.slug);
      assert.equal(dialogo.open, true, o.slug);
      assert.ok(dialogo.innerHTML.includes(contexto.escHtml(doc.descripcion)), o.slug);
      assert.ok(dialogo.innerHTML.includes(doc.revisadaEl), o.slug);
      const detalleNativo = textoRenderizado(componentes.DetalleOferta({ oferta: o }));
      assert.ok(detalleNativo.includes(doc.descripcion), o.slug);
      for (const referencia of doc.referencias) {
        for (const valor of [referencia.valor, referencia.alcance, referencia.fechaConsulta]) {
          assert.ok(dialogo.innerHTML.includes(contexto.escHtml(valor)), `${o.slug}: ${valor}`);
        }
        assert.ok(detalleNativo.includes(referencia.valor), o.slug);
        assert.ok(detalleNativo.includes(referencia.alcance), o.slug);
      }
      if (instante.startsWith('2026-10-02') || o.coleccion !== 'principales') {
        assert.equal(o.rentabilidad, null, o.slug); assert.equal(o.precio, null, o.slug);
        assert.equal(o.disponibleEs, null, o.slug); assert.equal(o.puntuacion, null, o.slug);
        assert.equal(contexto.estadoVigenciaLocal(contexto.ofertaDetalleLocalPorSlug(o.slug)).clase, 'caducado', o.slug);
      }
    }
  }
  assert.deepEqual(lote, original);
});
