const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');

const RAIZ = path.resolve(__dirname, '..');
function cargarModulo(ruta, mocks = {}, contexto = {}) {
  const archivo = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
    filename: archivo, babelrc: false, configFile: false, plugins: [commonjs, jsx],
  }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', ...Object.keys(contexto), codigo)(modulo, modulo.exports, (nombre) => {
    assert.ok(Object.hasOwn(mocks, nombre), `Dependencia inesperada: ${nombre}`);
    return mocks[nombre];
  }, ...Object.values(contexto));
  return modulo.exports;
}
const movil = cargarModulo('lib/verificacion-local.js');
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
  const dialogo = { innerHTML: '', open: false, close() {}, showModal() {}, querySelector() {}, setAttribute() {} };
  const contexto = {
    Date: FechaControlada, URL, emiOrden: 'rent', emiBusquedaLocal: '', emiTipoLocal: 'todos',
    ESCAPARATE_LOCAL: { ofertas: [oferta], secundario: [] },
    MANIFIESTO_EDITORIAL_LOCAL: { porCategoria: { Inmobiliario: { archivo: 'propia.webp', alt: 'Ilustración propia' } }, etiqueta: 'Ilustración editorial' },
    EDITORIAL_OFERTA_POR_CATEGORIA: { Inmobiliario: { src: '/propia.webp', alt: 'Ilustración propia' } },
    CATMETA: { Inmobiliario: {} }, catClase: () => '', escHtml: (v) => String(v),
    fechaES: (v) => v, urlHttps: (v) => /^https:\/\//.test(v || '') ? v : '',
    document: { getElementById: () => dialogo, body: { classList: { add() {}, remove() {} } } },
  };
  vm.createContext(contexto);
  vm.runInContext(codigo.slice(inicio, fin), contexto);
  return { contexto, dialogo };
}

test('web y móvil conservan el último día completo y retiran cifras al siguiente, aunque el lote siga vigente', () => {
  for (const permanente of [false, true]) {
    const dato = { ...oferta, permanente, catalogo: true };
    const webVigente = cargarWeb(ultimoDia).contexto;
    const webCaducada = cargarWeb(caducada).contexto;
    assert.notEqual(webVigente.estadoVigenciaLocal(dato).clase, 'caducado');
    assert.equal(webCaducada.estadoVigenciaLocal(dato).clase, 'caducado');
    assert.equal(movil.cifrasOfertaVigentes(dato, ultimoDia), true);
    assert.equal(movil.cifrasOfertaVigentes(dato, caducada), false);
    assert.match(webVigente.tarjetaOfertaLocal(dato), /97,13/);
    assert.match(webVigente.tarjetaOfertaLocal(dato), /aria-label="Ver oferta en Proveedor · Oferta de prueba · Proveedor"/);
    assert.doesNotMatch(webCaducada.tarjetaOfertaLocal(dato), centinelas);
    assert.match(webCaducada.tarjetaOfertaLocal(dato), /Pendiente de revisión/);
    assert.match(webCaducada.tarjetaOfertaLocal(dato), /aria-label="Consultar fuente · Oferta de prueba · Proveedor"/);
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
  assert.match(dialogo.innerHTML, /Pendiente de revisión/);
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
    assert.match(html, /97,13/);
    contexto.programarRevisionVigenciaOfertas();
    reloj.setTime(caducada.getTime());
    temporizador();
    assert.doesNotMatch(html, centinelas);
    assert.match(html, /Pendiente de revisión/);
  }
});

function componentesMoviles(ahora, simulacion = {}) {
  const crear = (type, props, ...children) => ({ type: typeof type === 'function' ? type.name : type, props, children });
  class FechaControlada extends Date {
    constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); }
  }
  return cargarModulo('componentes/Ofertas.js', {
    react: { createElement: crear, useState: (v) => [typeof v === 'function' ? v() : v, () => {}], useEffect() {}, ...simulacion.react },
    'react-native': { ...Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map((n) => [n, n])), StyleSheet: { create: (v) => v }, AppState: simulacion.AppState },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../fixtures/imagenes-editoriales': { ETIQUETA_EDITORIAL: 'Ilustración editorial', imagenEditorial: () => null },
    '../lib/datos': { vigenciaOferta: () => ({ estado: 'vencida', etiqueta: 'Datos vencidos' }) },
    '../lib/verificacion-local': { ofertaConCifrasVigentes: (o, fecha) => movil.ofertaConCifrasVigentes(o, fecha) },
    '../lib/tema': { C: {}, COLOR_CATEGORIA: {}, F: {}, R: {}, T: {}, UI: {}, iniciales: () => 'PR' },
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
      assert.match(texto, /Pendiente de revisión/);
    }
  }
  assert.deepEqual(oferta, original);
  const vigente = componentesMoviles(ultimoDia);
  assert.match(textoRenderizado(vigente.FichaOferta({ oferta })), /97,13/);
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
    assert.match(textoRenderizado(componentes.FichaOferta({ oferta })), /97,13/);
    reloj.setTime(caducada.getTime());
    if (evento === 'medianoche') temporizador(); else reactivar('active');
    assert.doesNotMatch(textoRenderizado(componentes.FichaOferta({ oferta })), centinelas);
    limpiar();
    assert.equal(retiroEscucha, true);
  }
});

test('tarjetas web y móvil muestran la ventana o referencia junto a una cifra vigente', () => {
  const { contexto } = cargarWeb(ultimoDia);
  const componentes = componentesMoviles(ultimoDia);
  for (const dato of [
    { ...oferta, rentabilidad: { mostrada: '97,13 %', literal: 'Anualizada a 30 días; variable, no garantizada.' } },
    { ...oferta, tipo: 'valor', precio: { mostrado: '5 CHF', unidad: 'Última operación 20-09-2026; no es un precio ejecutable.' } },
  ]) {
    const referencia = dato.tipo === 'valor' ? dato.precio.unidad : dato.rentabilidad.literal;
    assert.ok(contexto.tarjetaOfertaLocal(dato).includes(`<p class="escaparate-referencia">${referencia}</p>`));
    const tarjeta = componentes.FichaOferta({ oferta: dato });
    assert.ok(textoRenderizado(tarjeta).includes(referencia));
    const nodos = [];
    const recorrer = n => {
      if (Array.isArray(n)) return n.forEach(recorrer);
      if (n && typeof n === 'object') { nodos.push(n); recorrer(n.children); }
    };
    recorrer(tarjeta);
    assert.ok(nodos.some(n => n.type === 'Text' && n.children.includes(referencia) && !n.props.numberOfLines));
  }
});

test('el detalle conserva acceso a fuentes fechadas cuando retira las cifras', () => {
  const componentes = componentesMoviles(caducada);
  const fuente = 'https://example.test/fuente-oficial';
  const detalle = componentes.DetalleOferta({ oferta: { ...oferta, fuentesActuales: [fuente] } });
  const texto = textoRenderizado(detalle);
  assert.match(texto, /FUENTES CONSULTADAS ·\s*2026-09-21/);
  assert.ok(texto.includes(fuente));
  assert.match(texto, /contratación y el pago se realizan directamente con el proveedor/);
  assert.doesNotMatch(texto, centinelas);
});
