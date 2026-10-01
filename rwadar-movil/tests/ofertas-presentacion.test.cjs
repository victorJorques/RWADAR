'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');

const RAIZ = path.resolve(__dirname, '..');
const AHORA = new Date('2026-09-30T12:00:00Z');
const FUENTE = 'https://www.example.test/documentos/fondo?referencia=actual&idioma=es';

function modulo(ruta, mocks, contexto = {}) {
  const nombre = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), {
    filename: nombre, babelrc: false, configFile: false, plugins: [commonjs, jsx],
  }).code;
  const salida = { exports: {} };
  new Function('module', 'exports', 'require', ...Object.keys(contexto), codigo)(salida, salida.exports, dependencia => {
    assert.ok(Object.hasOwn(mocks, dependencia), `Dependencia inesperada: ${dependencia}`);
    return mocks[dependencia];
  }, ...Object.values(contexto));
  return salida.exports;
}

const verificacion = modulo('lib/verificacion-local.js', {
  './contrato-catalogo': require('../lib/contrato-catalogo'),
});
const datos = modulo('lib/datos.js', {
  '@react-native-async-storage/async-storage': {},
  'react-native': { Platform: { OS: 'android' } },
  './modo-local': { MODO_LOCAL: true, SERVICIOS_USUARIO_REMOTOS: false },
  './verificacion-local': verificacion,
  './catalogo-remoto': {},
});

function componentes(ahora = AHORA) {
  const estilos = {};
  const crear = (tipo, props, ...children) => typeof tipo === 'function' && tipo.name === 'FilaMetrica'
    ? tipo(props) : { tipo: typeof tipo === 'function' ? tipo.name : tipo, props, children };
  class Reloj extends Date { constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); } }
  const render = modulo('componentes/Ofertas.js', {
    react: { createElement: crear, useState: valor => [typeof valor === 'function' ? valor() : valor, () => {}], useEffect() {} },
    'react-native': { ...Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map(nombre => [nombre, nombre])),
      AppState: {}, StyleSheet: { hairlineWidth: 1, create(valor) { Object.assign(estilos, valor); return valor; } } },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../fixtures/imagenes-editoriales': { ETIQUETA_EDITORIAL: 'Ilustración editorial', imagenEditorial: () => null },
    '../lib/datos': datos,
    '../lib/verificacion-local': verificacion,
    '../lib/tema': { C: {}, COLOR_CATEGORIA: {}, F: { media: 'Media', semi: 'Semi' }, R: {}, T: {}, UI: { tactil: 44, boton: 48 }, iniciales: () => 'PR' },
  }, { Date: Reloj, setTimeout: () => 1, clearTimeout() {} });
  return { ...render, estilos };
}

function nodos(arbol) {
  if (arbol == null || arbol === false || typeof arbol !== 'object') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...nodos(arbol.children)];
}

function textoVisible(arbol) {
  if (arbol == null || arbol === false) return '';
  if (Array.isArray(arbol)) return arbol.map(textoVisible).join(' ');
  if (typeof arbol !== 'object') return String(arbol);
  return textoVisible(arbol.children);
}

function dato(cambios = {}) {
  return {
    slug: 'fondo-presentacion', titulo: 'Fondo de prueba', plataformaNombre: 'Proveedor',
    tipo: 'rendimiento', coleccion: 'principales', categoria: 'Crédito privado',
    verificadaEl: '2026-09-30', vigenciaDias: 1, estadoRevision: 'actual',
    disponibleEs: null, permanente: true, patrocinada: false,
    rentabilidad: { mostrada: '7,50 %', literal: 'APY ilustrativo de los últimos siete días; variable y no garantizado.' },
    precio: null, url: FUENTE, fuentesActuales: [FUENTE],
    resumen: 'Resumen extenso reservado para el detalle.',
    metricas: [{ etiqueta: 'Entrada mínima', valor: '999 EUR solo en detalle' }],
    avisos: [{ tono: 'warn', texto: 'La inversión puede perder valor.' }],
    documentacion: {
      revisadaEl: '2026-09-30', descripcion: 'Descripción documental extensa que pertenece a la ficha completa.',
      fuentes: [FUENTE], caracteristicas: [{ etiqueta: 'Estructura', valor: 'Característica documental completa' }],
      referencias: [{ etiqueta: 'Precio histórico', valor: '123 CHF históricos', fechaDato: '2026-09-28',
        fechaConsulta: '2026-09-30', fuente: FUENTE,
        alcance: 'Referencia histórica documentada; no es un precio ejecutable actual.' }],
    },
    ...cambios,
  };
}

test('tarjeta móvil prioriza nombre/proveedor, un dato y fecha breve sin repetir el documento', () => {
  const ui = componentes();
  const oferta = dato();
  const tarjeta = ui.FichaOferta({ oferta });
  const visible = textoVisible(tarjeta);
  const textos = nodos(tarjeta).filter(nodo => nodo.tipo === 'Text').map(textoVisible);
  assert.ok(textos.indexOf(oferta.titulo) < textos.indexOf(oferta.plataformaNombre));
  for (const esperado of [oferta.titulo, oferta.plataformaNombre, '7,50 %', 'Doc. 30/09/2026', 'Ver ficha →']) assert.ok(visible.includes(esperado));
  for (const fuera of [oferta.documentacion.descripcion, 'Referencia documentada', '999 EUR', '123 CHF', oferta.resumen, 'RENT. AJUSTADA']) {
    assert.ok(!visible.includes(fuera), `bloque largo reapareció en la tarjeta: ${fuera}`);
  }
  assert.ok(tarjeta.props.accessibilityLabel.includes('Referencia documentada · 30/09/2026'));
  assert.ok(tarjeta.props.accessibilityLabel.startsWith(`Ver ficha de ${oferta.titulo}`));
  assert.equal(nodos(tarjeta).filter(nodo => nodo.tipo === 'Pressable').length, 1);
  assert.equal(tarjeta.props.accessibilityRole, 'button');
});

test('ventana/unidad vigente queda íntegra, visible y sin truncar junto a su única cifra', () => {
  const ui = componentes();
  for (const oferta of [dato(), dato({ tipo: 'valor', rentabilidad: null,
    precio: { mostrado: '5 CHF', unidad: 'Última operación 30-09-2026; no es un precio ejecutable.' } })]) {
    const tarjeta = ui.FichaOferta({ oferta });
    const referencia = oferta.tipo === 'valor' ? oferta.precio.unidad : oferta.rentabilidad.literal;
    const nodo = nodos(tarjeta).find(elemento => elemento.tipo === 'Text' && textoVisible(elemento) === referencia);
    assert.ok(nodo);
    assert.equal(nodo.props.numberOfLines, undefined);
    assert.ok(tarjeta.props.accessibilityLabel.includes(referencia));
  }
});

test('datos vencidos y colecciones documentales no regresan al simplificar la tarjeta', () => {
  const ofertas = [dato({ verificadaEl: '2026-09-27' }),
    dato({ coleccion: 'secundario', tipo: 'secundario' }), dato({ coleccion: 'en_camino' })];
  for (const oferta of ofertas) {
    const original = structuredClone(oferta);
    const tarjeta = componentes().FichaOferta({ oferta });
    for (const texto of [textoVisible(tarjeta), tarjeta.props.accessibilityLabel]) {
      assert.doesNotMatch(texto, /7,50|999 EUR|123 CHF|APY ilustrativo/);
    }
    assert.ok(textoVisible(tarjeta).includes('Doc. 30/09/2026'));
    assert.match(textoVisible(tarjeta), /Consultar emisor|Consultar fuente/);
    assert.deepEqual(oferta, original);
  }
});

test('patrocinio y aviso bloqueante principal permanecen visibles y sin elipsis', () => {
  const oferta = dato({ patrocinada: true, avisos: [
    { tono: 'warn', esAntiguedad: true, texto: 'Revisión antigua repetida' },
    { tono: 'warn', texto: 'Aviso adicional de riesgo' },
    { tono: 'stop', texto: 'La apertura de nuevas inversiones no está confirmada.' },
  ] });
  const tarjeta = componentes().FichaOferta({ oferta });
  const visible = textoVisible(tarjeta);
  assert.match(visible, /PATROCINADA/);
  assert.match(visible, /La apertura de nuevas inversiones no está confirmada/);
  assert.match(visible, /1 más en la ficha/);
  assert.doesNotMatch(visible, /Revisión antigua repetida/);
  const aviso = nodos(tarjeta).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo).includes('IMPORTANTE'));
  assert.equal(aviso.props.numberOfLines, undefined);
  assert.match(tarjeta.props.accessibilityLabel, /Aviso bloqueante/);
});

test('un warning relevante no desaparece si no hay stop y tampoco se trunca', () => {
  const tarjeta = componentes().FichaOferta({ oferta: dato() });
  const aviso = nodos(tarjeta).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo).includes('La inversión puede perder valor'));
  assert.ok(aviso);
  assert.equal(aviso.props.numberOfLines, undefined);
  assert.match(tarjeta.props.accessibilityLabel, /Precaución/);
});

test('estado documental conserva incertidumbre y nunca hereda apertura del sello documental', () => {
  for (const [coleccion, esperado] of [['secundario', 'liquidez no confirmada'], ['en_camino', 'apertura no confirmada']]) {
    const tarjeta = componentes().FichaOferta({ oferta: dato({ coleccion }) });
    const estado = nodos(tarjeta).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo).includes(esperado));
    assert.ok(estado);
    assert.equal(estado.props.numberOfLines, undefined);
    assert.doesNotMatch(textoVisible(tarjeta), /Cifras vigentes/);
  }
});

test('detalle conserva documentación, importes históricos contextualizados, riesgos y destinos exactos', () => {
  const oferta = dato();
  const abiertos = [];
  const detalle = componentes().DetalleOferta({ oferta, onAbrirEnlace: url => abiertos.push(url) });
  const visible = textoVisible(detalle);
  for (const esperado of [oferta.documentacion.descripcion, 'Característica documental completa', '123 CHF históricos',
    'No son precios actuales', '28/09/2026', '30/09/2026', oferta.documentacion.referencias[0].alcance,
    'La inversión puede perder valor.', '999 EUR', oferta.rentabilidad.literal, 'no recibe ni custodia']) assert.ok(visible.includes(esperado), esperado);
  assert.ok(!visible.includes(FUENTE));
  assert.match(visible, /Ver fuente\s*·\s*example\.test/);
  assert.match(visible, /Ver fuente\s*1\s*·\s*example\.test/);
  const enlaces = nodos(detalle).filter(nodo => nodo.tipo === 'Pressable' && nodo.props.accessibilityLabel?.includes(FUENTE));
  assert.equal(enlaces.length, 2);
  for (const enlace of enlaces) {
    const etiquetaVisible = textoVisible(enlace).replace(/\s+/g, ' ').trim().replace(/ ↗$/, '');
    assert.ok(enlace.props.accessibilityLabel.startsWith(etiquetaVisible));
    enlace.props.onPress();
  }
  assert.deepEqual(abiertos, [FUENTE, FUENTE]);
});

test('compactación no reduce la legibilidad ni fija alturas sobre condiciones o riesgos', () => {
  const { estilos } = componentes();
  assert.equal(estilos.imagenFicha.aspectRatio, 2);
  assert.ok(estilos.titulo.fontSize >= 16);
  assert.ok(estilos.datoValor.fontSize >= 16);
  for (const nombre of ['plataforma', 'estadoFicha', 'fechaFicha', 'abrirFicha', 'avisoFichaTxt', 'referencia']) {
    assert.ok(estilos[nombre].fontSize >= 12, nombre);
    assert.equal(estilos[nombre].height, undefined);
    assert.equal(estilos[nombre].maxHeight, undefined);
  }
  assert.equal(estilos.ficha.height, undefined);
  assert.equal(estilos.filaMetrica.flexDirection, undefined);
  assert.ok(estilos.metricaValor.lineHeight >= 20);
});
