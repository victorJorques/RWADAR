'use strict';
// Rótulos en frase normal, sin mayúsculas (GUIA-ACABADOS §5, aplicada a la web el 04/11/2026).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const {soporteIdioma}=require('./soporte-idioma.cjs');
const idioma = require('../lib/idioma');

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
    if (dependencia === './Idioma') return soporteIdioma(mocks.react,mocks['react-native']);
    if (dependencia === '../lib/idioma') return require('../lib/idioma');
    if (dependencia === './acceso-obligatorio') return require('../lib/acceso-obligatorio');
    if (dependencia === './avisos-cuenta') return require('../lib/avisos-cuenta');
    if (dependencia === './avisos-sin-cuenta') return require('../lib/avisos-sin-cuenta');
    if (dependencia === './novedades-rwadar') return require('../lib/novedades-rwadar');
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
  './modo-local': { SERVICIOS_USUARIO_REMOTOS: false },
  './supabase': {},
  './verificacion-local': verificacion,
  './catalogo-remoto': {},
  './academy-progreso': modulo('lib/academy-progreso.js'),
});

const transparencia = modulo('lib/transparencia.js', {
  './transparencia-contenido': modulo('lib/transparencia-contenido.js', {}),
});

function componentes(ahora = AHORA, opciones = {}) {
  const estilos = {};
  const crear = (tipo, props, ...children) => typeof tipo === 'function' && tipo.name === 'FilaMetrica'
    ? tipo(props) : { tipo: typeof tipo === 'function' ? tipo.name : tipo, props, children,
      ...(typeof tipo === 'function' ? { componente: tipo } : {}) };
  class Reloj extends Date { constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); } }
  const render = modulo('componentes/Ofertas.js', {
    react: { createElement: crear, useState: opciones.useState || (valor => [typeof valor === 'function' ? valor() : valor, () => {}]),
      useEffect: opciones.useEffect || (() => {}) },
    'react-native': { ...Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map(nombre => [nombre, nombre])),
      Animated: { View: 'AnimatedView' },
      AppState: {}, StyleSheet: { hairlineWidth: 1, create(valor) { Object.assign(estilos, valor); return valor; } } },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../fixtures/imagenes-editoriales': opciones.imagenes || { ETIQUETA_EDITORIAL: 'Ilustración editorial', PIE_EDITORIAL: 'Imágenes ilustrativas, no fotos del activo', imagenEditorial: () => null,
      imagenEditorialOferta: () => null },
    '../lib/datos': datos,
    '../lib/verificacion-local': verificacion,
    '../lib/ficha-editorial': require('../lib/ficha-editorial'),
    // La transparencia de la web (03/11/2026): puntos fuertes y forma corta.
    '../lib/transparencia': opciones.transparencia || transparencia,
    '../lib/tema': { C: {}, COLOR_CATEGORIA: {}, F: { media: 'Media', semi: 'Semi' }, R: {}, T: {}, UI: { tactil: 44, boton: 48 }, iniciales: () => 'PR' },
    './Navegacion': { Icono: 'Icono' },
    './useTransicionFicha': { default: (_visible, cerrar) => ({ cerrar, estilo: {} }), __esModule: true },
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

const FECHA = /\b\d{2}\/\d{2}\/\d{4}\b/;
// La lectura en línea del catálogo que lleva la web (su snapshot sincronizado): así la prueba
// sigue al catálogo de cada ciclo y casa con la transparencia del mismo día.
const VERIF = path.join(RAIZ, '..', 'rwadar-app', 'data', 'verificaciones');
const REVISION_WEB = (fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8')
  .match(/"revisionId":"([0-9a-f-]{36})"/) || [])[1];
const DOC_ACTUAL = fs.readdirSync(VERIF).sort().reverse()
  .flatMap(d => ['lectura-despues-de-aplicar', 'lectura-publica'].map(s => path.join(VERIF, d, s)))
  .find(c => { try { return JSON.parse(fs.readFileSync(path.join(c, 'ofertas-v2.json'), 'utf8'))[0].revision_id === REVISION_WEB; } catch { return false; } });

// Lo que dice una fila de «Lo esencial» de la ficha (Mínimo, España, Salida…).
function esencial(detalle, etiqueta) {
  const fila = nodos(detalle).find(n => n.tipo === 'View' && Array.isArray(n.children) &&
    n.children[0]?.tipo === 'Text' && textoVisible(n.children[0]) === etiqueta);
  return fila ? textoVisible(fila.children[1]).replace(/\s+/g, ' ').trim() : null;
}

// Los datos de la línea Mínimo · España de la tarjeta, como pares [rótulo, valor].
function datosTarjeta(ui, tarjeta) {
  return nodos(tarjeta).filter(n => n.tipo === 'View' && n.props?.style === ui.estilos.datoTarjeta)
    .map(n => n.children.filter(h => h?.tipo === 'Text' && h.props.style !== ui.estilos.datoPunto).map(textoVisible));
}

// Tarjeta de la lista sencilla (decisión de Víctor del 05/11/2026, igual que la
// web): título, proveedor · lugar y una línea Mínimo · España. La salida, los
// avisos ordinarios, la vigencia y las fechas se quedan en la ficha.
test('la tarjeta de la lista enseña título, proveedor y Mínimo · España; lo demás sigue en la ficha', () => {
  const ui = componentes();
  const oferta = dato();
  let abiertas = 0;
  const tarjeta = ui.FichaOferta({ oferta, onAbrir: () => abiertas++ });
  const visible = textoVisible(tarjeta);
  const etiqueta = tarjeta.props.accessibilityLabel;
  const textos = nodos(tarjeta).filter(nodo => nodo.tipo === 'Text').map(textoVisible);
  assert.ok(textos.indexOf(oferta.titulo) < textos.indexOf(oferta.plataformaNombre));
  assert.deepEqual(datosTarjeta(ui, tarjeta), [['Mínimo', 'No verificado'], ['España', 'Sin confirmar']]);
  for (const fuera of ['Salida', 'Sin documentar', 'Ver ficha →', 'válidas', 'Revisa', 'avisos en la ficha',
    oferta.avisos[0].texto, '7,50 %', oferta.rentabilidad.literal, oferta.documentacion.descripcion, '999 EUR', '123 CHF',
    oferta.resumen]) {
    assert.ok(!visible.includes(fuera), `la tarjeta enseña ${fuera}`);
    assert.ok(!etiqueta.includes(fuera), `el lector de pantalla oye ${fuera}`);
  }
  assert.doesNotMatch(visible, FECHA);
  assert.doesNotMatch(etiqueta, FECHA);
  // Un solo control: toda la tarjeta, con nombre propio; el «›» no se lee.
  assert.equal(nodos(tarjeta).filter(nodo => nodo.tipo === 'Pressable').length, 1);
  assert.equal(tarjeta.props.accessibilityRole, 'button');
  assert.ok(etiqueta.startsWith(`Ver ficha de ${oferta.titulo} en ${oferta.plataformaNombre}. `));
  assert.match(etiqueta, /Mínimo: No verificado\. España: Sin confirmar/);
  const flecha = nodos(tarjeta).find(n => n.tipo === 'Text' && textoVisible(n) === '›');
  assert.equal(flecha.props.accessible, false);
  tarjeta.props.onPress();
  assert.equal(abiertas, 1);
  // La ficha conserva los tres datos, la vigencia, la fecha y el aviso.
  const detalle = ui.DetalleOferta({ oferta });
  assert.equal(esencial(detalle, 'Mínimo'), 'No verificado');
  assert.equal(esencial(detalle, 'España'), 'Sin confirmar');
  assert.equal(esencial(detalle, 'Salida'), 'Sin documentar');
  assert.match(esencial(detalle, 'Cifras'), /Revisadas el 30\/09\/2026 · válidas 1 día más/);
  assert.ok(textoVisible(detalle).includes(oferta.avisos[0].texto));
});

// Las ofertas del catálogo publicado (la lectura en línea de la revisión que lleva la web), todas,
// por el mismo camino que la app (adaptarCatalogoV2), dos días después de su revisión. Cuántas son lo
// dice el propio lote (24 hasta la entrega 2026-11-05; 22 desde la 2026-11-05.2, sin BILLA ni Casa de Outeiro).
test('las ofertas reales publicadas: la tarjeta lleva solo Mínimo y España, de la misma función que la ficha, que lo conserva todo', async () => {
  assert.ok(DOC_ACTUAL, `sin lectura en línea de la revisión ${REVISION_WEB}`);
  const revisadas = JSON.parse(fs.readFileSync(path.join(DOC_ACTUAL, 'ofertas-v2.json'), 'utf8'))[0].verificada_el.slice(0, 10);
  const dia = n => new Date(Date.parse(revisadas + 'T12:00:00Z') + n * 86400000);
  const ahora = dia(2);
  const revisadasES = revisadas.split('-').reverse().join('/');
  const ui = componentes(ahora);
  const lote = { version: 2, plataformas: JSON.parse(fs.readFileSync(path.join(DOC_ACTUAL, 'plataformas-v2.json'), 'utf8')),
    ofertas: JSON.parse(fs.readFileSync(path.join(DOC_ACTUAL, 'ofertas-v2.json'), 'utf8')) };
  const { ofertas } = require('../lib/catalogo-remoto').adaptarCatalogoV2(lote, ahora);
  assert.equal(ofertas.length, lote.ofertas.length, 'el lector de la app no deja ninguna fuera');
  assert.equal(ofertas.length, lote.plataformas[0].ofertas_esperadas, 'todas las que declara el lote');
  const corta = { 'Sí, según la fuente': 'Sí', 'No, según la fuente': 'No', 'Sin confirmar': 'Sin confirmar' };
  let conPuntos = 0;
  for (const o of ofertas) {
    const tarjeta = ui.FichaOferta({ oferta: o });
    const visible = textoVisible(tarjeta), etiqueta = tarjeta.props.accessibilityLabel;
    const detalle = ui.DetalleOferta({ oferta: o });
    const textoDetalle = textoVisible(detalle);
    assert.equal(nodos(tarjeta).filter(n => n.tipo === 'Pressable').length, 1, o.slug);
    assert.ok(etiqueta.startsWith(`Ver ficha de ${o.titulo} en ${o.plataformaNombre}. `), o.slug);
    assert.ok(visible.includes(o.titulo) && visible.includes(o.plataformaNombre), o.slug);
    // Los dos datos de la tarjeta son los de «Lo esencial» de la ficha, España en corto.
    const [[rMinimo, minimo], [rEspana, espana], ...mas] = datosTarjeta(ui, tarjeta);
    assert.deepEqual([rMinimo, rEspana, mas.length], ['Mínimo', 'España', 0], o.slug);
    assert.equal(minimo, esencial(detalle, 'Mínimo'), o.slug);
    assert.equal(espana, corta[esencial(detalle, 'España')], o.slug);
    assert.ok(etiqueta.includes(`Mínimo: ${minimo}. España: ${espana}`), o.slug);
    // Fuera de la tarjeta (y de lo que oye el lector), dentro de la ficha.
    const salida = esencial(detalle, 'Salida');
    assert.ok(salida, o.slug);
    for (const texto of [visible, etiqueta]) {
      assert.doesNotMatch(texto, /Salida|Ver ficha →|válidas|Liquidez no confirmada|Apertura no confirmada|avisos? en la ficha|más en la ficha/, o.slug);
      assert.doesNotMatch(texto, FECHA, o.slug);
    }
    const puntos = transparencia.puntosFuertesOferta(o);
    if (puntos.length) conPuntos++;
    const nodoTransparencia = nodos(detalle).find(n => n.tipo === 'Transparencia');
    const textoTransparencia = textoVisible(nodoTransparencia.componente(nodoTransparencia.props));
    for (const punto of puntos) {
      assert.ok(!visible.includes(punto.texto) && !etiqueta.includes(punto.texto), `${o.slug}: ${punto.texto}`);
      assert.ok(textoTransparencia.includes(punto.texto), `${o.slug}: ${punto.texto}`);
    }
    for (const aviso of (o.avisos || []).filter(a => a && a.texto && a.tono !== 'ok' && !a.esAntiguedad)) {
      if (/^Referencia editorial gratuita\b/.test(aviso.texto)) continue;
      assert.equal(visible.includes(aviso.texto), aviso.tono === 'stop', `${o.slug}: ${aviso.texto}`);
      assert.ok(textoDetalle.includes(aviso.texto), `${o.slug}: ${aviso.texto}`);
    }
    assert.match(textoDetalle, /Lo esencial/);
    // Cada oferta con su propia fecha de comprobación (27/11/2026: las que no se pudieron releer conservan
    // la anterior y caducan antes): válidas 7 días desde esa fecha.
    const suya = String(o.verificadaEl || revisadas).slice(0, 10);
    const restan = 5 - Math.round((Date.parse(revisadas + 'T00:00:00Z') - Date.parse(suya + 'T00:00:00Z')) / 86400000);
    assert.match(esencial(detalle, 'Cifras'), o.coleccion === 'principales' && o.estadoRevision === 'actual'
      ? new RegExp(`^Revisadas el ${suya.split('-').reverse().join('\\/')} · válidas ${restan} días? más$`) : /sin confirmar|conflicto/, o.slug);
    assert.match(textoDetalle, /Revisión del catálogo:\s*\d{2}\/\d{2}\/2026/, o.slug);
  }
  assert.ok(conPuntos >= 8, `solo ${conPuntos} ofertas con puntos fuertes`);
  // Con el catálogo caducado (8 días después de la revisión) manda resumenOferta: ninguna cifra
  // vencida, «Mínimo No verificado · España Sin confirmar», el problema de la revisión y sin «Nueva».
  // El catálogo caduca por la fecha del lote (la última revisión del catálogo), que puede ser posterior a la de las
  // ofertas si ese día solo se comprobó el radar (27/11/2026): se cuentan los 8 días desde la más reciente.
  const fechaLote = lote.plataformas[0].verificado_lote_el.slice(0, 10);
  const tarde = new Date(Date.parse((fechaLote > revisadas ? fechaLote : revisadas) + 'T12:00:00Z') + 8 * 86400000), uiTarde = componentes(tarde);
  const caducado = require('../lib/catalogo-remoto').adaptarCatalogoV2(lote, tarde);
  assert.equal(caducado.caducado, true);
  for (const o of caducado.ofertas) {
    const tarjeta = uiTarde.FichaOferta({ oferta: o, catalogoCaducado: true, nueva: true });
    assert.deepEqual(datosTarjeta(uiTarde, tarjeta), [['Mínimo', 'No verificado'], ['España', 'Sin confirmar']], o.slug);
    assert.match(textoVisible(tarjeta), /Cifras por actualizar|Fuentes en conflicto/, o.slug);
    assert.doesNotMatch(textoVisible(tarjeta), /Nueva/, o.slug);
  }
  // En inglés, el mismo control con su nombre traducido, también con «en» en el título.
  await idioma.cambiarIdioma('en');
  try {
    for (const [slug, nombre] of [['spiko-smart-cash-euro', 'View details for Spiko Euro (Smart Cash): fondo en euros ligado al €STR from Spiko. '],
      ['robinhood-classic-stock-tokens', 'View details for Classic Stock Tokens: derivados sobre acciones de EE. UU. from Robinhood Europe. ']]) {
      const etiqueta = ui.FichaOferta({ oferta: ofertas.find(o => o.slug === slug) }).props.accessibilityLabel;
      assert.ok(etiqueta.startsWith(nombre), etiqueta);
      assert.match(etiqueta, /Minimum: .+\. Spain: (Yes|No|Unconfirmed)/);
    }
  } finally { await idioma.cambiarIdioma('es'); }
});

function imagenesReales() {
  const manifiesto = JSON.parse(fs.readFileSync(path.join(RAIZ,'assets','ofertas-editoriales','manifest.json'),'utf8'));
  const mocks = {'../assets/ofertas-editoriales/manifest.json':manifiesto};
  for(const entrada of [...manifiesto.archivos,...manifiesto.fichas]) {
    mocks[`../assets/ofertas-editoriales/${entrada.archivo}`] = `bundle:${entrada.archivo}`;
  }
  return modulo('fixtures/imagenes-editoriales.js',mocks);
}

test('las 49 imágenes empaquetadas siguen usándose y una oferta nueva solo usa URI canónica cerrada', () => {
  const imagenes = imagenesReales();
  const ui = componentes(AHORA,{imagenes});
  const catalogo = JSON.parse(fs.readFileSync(path.join(RAIZ,'..','rwadar-app','data','verificaciones','2026-10-21-v2','escaparate-publicacion.json'),'utf8')).ofertas;
  for(const oferta of catalogo) {
    const op = ui.imagenesParaOferta(oferta);
    assert.equal(op.principal.fuente,imagenes.imagenEditorialOferta(oferta).fuente,oferta.slug);
    assert.equal(op.principal.remota,undefined,oferta.slug);
  }
  const nueva = dato({slug:'nueva-referencia-diaria',catalogo:true,imagen:'https://arbitraria.example/foto.png',imagenUrl:'https://otra.example/foto.png'});
  nueva.documentacion.imagenEditorialAlt = 'Escena ilustrada del activo descrito en la referencia.';
  const op = ui.imagenesParaOferta(nueva);
  assert.equal(op.principal.fuente.uri,'https://rwadar.pages.dev/ofertas-editoriales/oferta-nueva-referencia-diaria.webp');
  assert.match(op.principal.alt,/generada con IA; no es fotografía del activo/);
  assert.match(op.principal.alt,/Escena ilustrada del activo/);
  assert.equal(op.principal.etiqueta,'Ilustración editorial · IA');
  assert.equal(ui.imagenesParaOferta({...nueva,catalogo:false}).principal.remota,undefined,
    'el fixture local no solicita imágenes nuevas a producción');
  for(const slug of ['../otra','a/b','a?url=otra','a%2fb','https://evil.example','CON MAYUSCULAS','x'.repeat(161),'']) {
    const rechazada = ui.imagenesParaOferta({...nueva,slug});
    assert.equal(rechazada.principal.remota,undefined,slug);
    assert.equal(rechazada.principal.fuente.uri,undefined,slug);
  }
});

test('una imagen nueva que falla pasa a ilustración local y después a iniciales sin bucle de red', () => {
  const imagenes = imagenesReales();
  let fase = 0;
  const ui = componentes(AHORA,{imagenes,useState:()=>[fase,valor=>{fase=valor;}]});
  const oferta = dato({slug:'nueva-referencia-diaria',catalogo:true});
  let arbol = ui.ImagenOferta({oferta,grande:true});
  let imagen = nodos(arbol).find(n=>n.tipo==='Image');
  assert.match(imagen.props.source.uri,/^https:\/\/rwadar\.pages\.dev\/ofertas-editoriales\/oferta-[a-z0-9-]+\.webp$/);
  imagen.props.onError(); assert.equal(fase,1);
  arbol = ui.ImagenOferta({oferta,grande:true});
  imagen = nodos(arbol).find(n=>n.tipo==='Image');
  assert.equal(imagen.props.source,imagenes.imagenEditorial(oferta.categoria).fuente);
  assert.equal(imagen.props.source.uri,undefined);
  imagen.props.onError(); assert.equal(fase,2);
  arbol = ui.ImagenOferta({oferta,grande:true});
  assert.equal(nodos(arbol).some(n=>n.tipo==='Image'),false);
  assert.match(arbol.props.accessibilityLabel,/Sin ilustración editorial disponible/);
});

test('una revisión diaria nueva reintenta la imagen y no mantiene para siempre el fallo de la revisión anterior', () => {
  let fase = 0, dependencias, pendiente;
  const ui = componentes(AHORA,{imagenes:imagenesReales(),useState:()=>[fase,v=>{fase=v;}],
    useEffect(efecto,deps) {if(JSON.stringify(deps)!==JSON.stringify(dependencias)) {dependencias=deps;pendiente=efecto;}}});
  let oferta = dato({catalogo:true,slug:'nueva-referencia-diaria',revisionId:'revision-anterior'});
  let arbol = ui.ImagenOferta({oferta}); pendiente(); pendiente=null;
  nodos(arbol).find(n=>n.tipo==='Image').props.onError(); assert.equal(fase,1);
  arbol = ui.ImagenOferta({oferta}); assert.equal(pendiente,null);
  assert.equal(nodos(arbol).find(n=>n.tipo==='Image').props.source.uri,undefined);
  oferta = {...oferta,revisionId:'revision-nueva'};
  ui.ImagenOferta({oferta}); pendiente(); assert.equal(fase,0);
  arbol = ui.ImagenOferta({oferta});
  assert.match(nodos(arbol).find(n=>n.tipo==='Image').props.source.uri,/oferta-nueva-referencia-diaria\.webp$/);
});

test('ventana/unidad vigente queda íntegra en la ficha junto a su cifra, sin recargar la tarjeta', () => {
  const ui = componentes();
  for (const oferta of [dato(), dato({ tipo: 'valor', rentabilidad: null,
    precio: { mostrado: '5 CHF', unidad: 'Última operación 30-09-2026; no es un precio ejecutable.' } })]) {
    const tarjeta = ui.FichaOferta({ oferta });
    const referencia = oferta.tipo === 'valor' ? oferta.precio.unidad : oferta.rentabilidad.literal;
    assert.ok(!textoVisible(tarjeta).includes(referencia));
    assert.ok(!tarjeta.props.accessibilityLabel.includes(referencia));
    const detalle = ui.DetalleOferta({ oferta });
    const nodo = nodos(detalle).find(elemento => elemento.tipo === 'Text' && textoVisible(elemento) === referencia);
    assert.ok(nodo);
    assert.equal(nodo.props.numberOfLines, undefined);
    assert.ok(textoVisible(detalle).includes(referencia));
    assert.ok(textoVisible(detalle).includes(oferta.tipo === 'valor' ? oferta.precio.mostrado : oferta.rentabilidad.mostrada));
  }
});

test('la tarjeta muestra un mínimo en euros solo desde una referencia fechada, sin inferir acceso España', () => {
  const oferta = dato({pais:'España',disponibleEs:true});
  oferta.documentacion.referencias.push({etiqueta:'Entrada mínima',valor:'1.000 EUR',fechaDato:'2026-09-28',
    fechaConsulta:'2026-09-29',fuente:FUENTE,alcance:'Mínimo publicado por el proveedor en esa consulta.'});
  const ui = componentes();
  const tarjeta = ui.FichaOferta({oferta});
  // Forma corta de la web: «Mínimo», sin «(EUR)», porque el dato ya lleva el €.
  assert.deepEqual(datosTarjeta(ui, tarjeta), [['Mínimo', '1000 €'], ['España', 'Sin confirmar']]);
  assert.match(tarjeta.props.accessibilityLabel,/Mínimo: 1000 €/);
  assert.doesNotMatch(textoVisible(tarjeta),/999 EUR|Disponible desde España|Sin documentar/);
  // Las fechas de la fuente y la salida, solo en la ficha (05/11/2026).
  assert.doesNotMatch(textoVisible(tarjeta) + tarjeta.props.accessibilityLabel, FECHA);
  const detalle = componentes().DetalleOferta({oferta});
  assert.match(textoVisible(detalle),/Fuente consultada el\s+29\/09\/2026/);
  assert.match(textoVisible(detalle),/Fecha del dato:\s+28\/09\/2026/);
  assert.equal(esencial(detalle, 'Mínimo'), '1000 €');
  assert.equal(esencial(detalle, 'Salida'), 'Sin documentar');
});

test('un mínimo en otra moneda se rotula «Mínimo» y la salida, en la ficha, no repite «Salida:»', () => {
  const oferta = dato();
  oferta.documentacion.referencias.push(
    {etiqueta:'Mínimo de inversión',valor:'500 CHF por transferencia bancaria',fechaDato:'2026-09-28',
      fechaConsulta:'2026-09-29',fuente:FUENTE,alcance:'Mínimo publicado por el emisor.'},
    {etiqueta:'Salida',valor:'Venta solo a otros accionistas',fechaDato:'2026-09-28',
      fechaConsulta:'2026-09-29',fuente:FUENTE,alcance:'Condición de salida publicada.'});
  const ui = componentes();
  const tarjeta = ui.FichaOferta({oferta});
  const texto = textoVisible(tarjeta);
  assert.deepEqual(datosTarjeta(ui, tarjeta)[0], ['Mínimo', '500 CHF por transferencia bancaria']);
  assert.doesNotMatch(texto,/Mínimo \(EUR\)/);
  assert.match(tarjeta.props.accessibilityLabel,/Mínimo: 500 CHF/);
  assert.doesNotMatch(texto + tarjeta.props.accessibilityLabel,/Venta solo a otros accionistas|Salida/);
  const detalle = ui.DetalleOferta({oferta});
  assert.equal(esencial(detalle, 'Salida'), 'Venta solo a otros accionistas');
});

test('registro del proveedor conserva fuente y fecha sin acreditar la oferta ni acceso desde España', () => {
  const plataforma = {verificacionLocal:{verificadoEl:'2026-09-21',licenciaRegistro:{estado:'confirmada_regulador',
    detalle:'Registro documental del proveedor en su autoridad competente.',
    fuentes:[{url:'https://regulador.example/registro',consultadaEl:'2026-09-21',primaria:true}]}}};
  const ui = componentes();
  const tarjeta = textoVisible(ui.FichaOferta({oferta:dato(),plataforma}));
  assert.doesNotMatch(tarjeta,/Registro confirmado/);
  assert.match(tarjeta,/España Sin confirmar/);
  const abiertos = [];
  const detalle = ui.DetalleOferta({oferta:dato(),plataforma,onAbrirEnlace:url=>abiertos.push(url)});
  assert.match(textoVisible(detalle),/Registro del proveedor ·\s+Registro confirmado\s+· revisión\s+21\/09\/2026/);
  assert.match(textoVisible(detalle),/Este registro no acredita la supervisión ni la apertura de esta oferta/);
  assert.match(textoVisible(detalle),/Sin comprobar si se puede contratar desde España/);
  nodos(detalle).find(n=>n.props?.accessibilityLabel?.includes('https://regulador.example/registro')).props.onPress();
  assert.deepEqual(abiertos,['https://regulador.example/registro']);
  plataforma.verificacionLocal.licenciaRegistro.fuentes[0].url = 'https://secreto@regulador.example/registro';
  assert.doesNotMatch(textoVisible(ui.DetalleOferta({oferta:dato(),plataforma})),/Registro confirmado/);
});

// Ficha de la web final (04/11/2026): «Lo esencial» y los avisos arriba, luego
// los riesgos y el botón; las cuatro condiciones con su fuente y el registro van
// después, plegados (el árbol de prueba incluye lo plegado).
test('el detalle muestra las cuatro condiciones antes de la explicación larga y conserva riesgos y fuentes', () => {
  const ui = componentes();
  const oferta = dato();
  const registro = 'Detalle extenso del registro del proveedor, conservado íntegramente.';
  const plataforma = { verificacionLocal: { verificadoEl: '2026-09-21', licenciaRegistro: {
    estado: 'confirmada_regulador', detalle: registro,
    fuentes: [{ url: 'https://regulador.example/registro', consultadaEl: '2026-09-21', primaria: true }],
  } } };
  const detalle = ui.DetalleOferta({ oferta, plataforma });
  const texto = textoVisible(detalle);
  const esencial = texto.indexOf('Mínimo'), riesgo = texto.indexOf('Puedes perder parte o todo');
  // disponibleEs null: no consta que se contrate desde España (revisión legal 5.3).
  const enlace = texto.indexOf('Ir a la web del proveedor (sales de RWAdar)');
  assert.ok(esencial >= 0 && esencial < riesgo && riesgo < enlace);
  for (const condicion of ['Mínimo en euros', 'Desde España', 'Costes']) {
    assert.ok(texto.indexOf(condicion) > enlace && texto.indexOf(condicion) < texto.indexOf(oferta.documentacion.descripcion), condicion);
  }
  assert.ok(texto.includes(registro));
  assert.ok(texto.indexOf(registro) > enlace);
  assert.ok(nodos(detalle).some(n => n.props?.accessibilityLabel?.includes('https://regulador.example/registro')));
});

test('registrar inversión es una acción manual secundaria y mantiene una sola salida principal a la fuente', () => {
  const ui = componentes(); let registros = 0;
  const detalle = ui.DetalleOferta({ oferta: dato(), onRegistrarInversion: () => registros++ });
  const registrar = nodos(detalle).find(n => n.props?.accessibilityLabel?.startsWith('Registrar inversión en '));
  assert.ok(registrar); assert.equal(registrar.props.accessibilityRole, 'button');
  assert.equal(registros, 0, 'abrir la ficha no registra una inversión');
  registrar.props.onPress(); assert.equal(registros, 1);
  const principales = nodos(detalle).filter(n => n.props?.accessibilityRole === 'link'
    && n.props.accessibilityLabel?.startsWith('Ir a la web del proveedor (sales de RWAdar): '));
  assert.equal(principales.length, 1);
});

// Revisión legal 06/11/2026, punto 5.3: «Ver oferta en X» solo con «Se contrata hoy
// desde España» y «supervisada» en «Sí»; si no, el botón dice que sales de RWAdar.
// Y «Datos comprobados a favor».
test('revisión legal 5.3: el botón al proveedor depende de si se contrata hoy desde España y de si la entidad está supervisada', () => {
  // La comprobación «supervisada» sale de transparencia.json; aquí, una tabla de prueba para el slug de dato().
  const supervision = (cumple) => ({ verificadaEl: '2026-09-30', anadidaEl: '2026-09-30', puntos: [],
    supervisada: { cumple, motivo: cumple ? 'Inscrita en la CNMV (prueba).' : 'No figura en ningún registro (prueba).',
      fuente: { titulo: 'Registro de prueba', url: FUENTE }, consultadaEl: '2026-09-30' },
    documentoEspana: { cumple: false, motivo: 'Sin KID (prueba).', fuente: { titulo: 'Prueba', url: FUENTE }, consultadaEl: '2026-09-30' } });
  const conTabla = (tabla) => componentes(AHORA, { transparencia: { ...transparencia,
    comprobacionesOferta: (o, r, op = {}) => transparencia.comprobacionesOferta(o, r, { ...op, tabla }) } });
  const ui = conTabla({ 'fondo-presentacion': supervision(true) });
  const uiNoSupervisada = conTabla({ 'fondo-presentacion': supervision(false) });
  const acceso = { etiqueta: 'Acceso desde España', valor: 'Disponible para residentes en España',
    fechaDato: '2026-09-30', fechaConsulta: '2026-09-30', fuente: FUENTE, alcance: 'Acceso documentado para residentes en España.' };
  const base = dato();
  const contratable = dato({ disponibleEs: true,
    documentacion: { ...base.documentacion, referencias: [...base.documentacion.referencias, acceso] } });
  const enlaces = (oferta, conUi = ui) => nodos(conUi.DetalleOferta({ oferta })).filter((n) => n.tipo === 'Pressable'
    && n.props?.accessibilityRole === 'link' && /^(?:Ver oferta en |Ir a la web del proveedor|Abrir mercado)/.test(n.props.accessibilityLabel || ''));
  const si = enlaces(contratable), no = enlaces(dato()), fuera = enlaces(dato({ disponibleEs: false }));
  // Se contrata desde España, pero la entidad no consta supervisada (como Aktionariat o Prosegur Digital Gold).
  const sinSupervision = enlaces(contratable, uiNoSupervisada);
  // Sin entrada en transparencia.json para esa revisión: no consta supervisada (falla cerrado).
  const sinComprobar = enlaces(contratable, componentes());
  assert.equal(si.length, 1); assert.equal(no.length, 1); assert.equal(fuera.length, 1);
  assert.equal(sinSupervision.length, 1); assert.equal(sinComprobar.length, 1);
  assert.match(si[0].props.accessibilityLabel, /^Ver oferta en Proveedor: /);
  assert.match(textoVisible(si[0]), /Ver oferta en\s*Proveedor\s*↗/);
  for (const enlace of [no[0], fuera[0], sinSupervision[0], sinComprobar[0]]) {
    assert.match(enlace.props.accessibilityLabel, /^Ir a la web del proveedor \(sales de RWAdar\): /);
    assert.equal(textoVisible(enlace).replace(/\s+/g, ' ').trim(), 'Ir a la web del proveedor (sales de RWAdar) ↗');
  }
  // Con la revisión caducada tampoco se afirma que se contrate hoy.
  const caducada = enlaces(dato({ ...contratable, verificadaEl: '2026-09-01' }));
  assert.match(caducada[0].props.accessibilityLabel, /^Ir a la web del proveedor \(sales de RWAdar\): /);
  const componente = fs.readFileSync(path.join(RAIZ, 'componentes', 'Ofertas.js'), 'utf8');
  assert.doesNotMatch(componente, /Puntos fuertes, con su fuente/);
  assert.match(componente, />Datos comprobados a favor, con su fuente</);
});

test('agrupar repetidas mantiene todas las referencias y la búsqueda permite abrir una coincidencia exacta', () => {
  const ui = componentes();
  const raiz = path.join(RAIZ,'..','rwadar-app','data','verificaciones','2026-10-21-v2');
  const catalogo = JSON.parse(fs.readFileSync(path.join(raiz,'escaparate-publicacion.json'),'utf8')).ofertas;
  assert.equal(catalogo.length,49);
  const originales = structuredClone(catalogo);
  const recuperadas = [];
  for (const coleccion of ['principales','secundario','en_camino']) {
    const ofertas = catalogo.filter(o=>o.coleccion===coleccion);
    const filas = ui.agruparOfertasLectura(ofertas);
    for (const fila of filas) recuperadas.push(...(fila.tipo === 'grupo' ? fila.ofertas : [fila.oferta]));
    for (const fila of filas.filter(f=>f.tipo === 'grupo')) {
      assert.ok(fila.ofertas.length>=2);
      assert.ok(fila.ofertas.every(o=>o.plataformaSlug===fila.proveedorSlug && o.coleccion===coleccion));
      let abierto = false;
      const tarjeta = ui.FichaGrupoOfertas({grupo:fila,onAbrir:()=>{abierto=true;}});
      assert.match(textoVisible(tarjeta),new RegExp(`Ver sus\\s*${fila.ofertas.length}\\s*ofertas`));
      tarjeta.props.onPress(); assert.equal(abierto,true);
      const dentro = ui.agruparOfertasLectura(fila.ofertas,false);
      assert.equal(dentro.length,fila.ofertas.length);
      assert.ok(dentro.every(f=>f.tipo==='oferta'));
    }
  }
  assert.equal(recuperadas.length,49);
  assert.deepEqual(new Set(recuperadas.map(o=>o.slug)),new Set(catalogo.map(o=>o.slug)));
  assert.deepEqual(catalogo,originales);
  const accionariat = ui.agruparOfertasLectura(catalogo.filter(o=>o.coleccion==='principales'))
    .find(f=>f.proveedorSlug==='aktionariat');
  assert.equal(accionariat.proveedorNombre,'Aktionariat', 'el nombre del grupo no representa solo un ticker de sus cinco fichas');
  const buscada = catalogo.find(o=>o.slug==='reental-secundario-houston-3');
  const resultado = ui.agruparOfertasLectura(catalogo.filter(o=>o.slug===buscada.slug),false);
  assert.equal(resultado.length,1); assert.equal(resultado[0].oferta,buscada);
});

test('orden de lectura prioriza datos comprobables y conserva empates sin usar rentabilidad o patrocinio', () => {
  const ui = componentes();
  const ofertas = [dato({slug:'conflicto',estadoRevision:'fuentes_en_conflicto',patrocinada:true}),
    dato({slug:'pendiente',estadoRevision:'no_verificable'}),dato({slug:'actual-a',rentabilidad:null}),
    dato({slug:'actual-b',rentabilidad:{mostrada:'999 %'}})];
  const originales = structuredClone(ofertas);
  assert.deepEqual(ui.ordenarOfertasLectura(ofertas,AHORA).map(o=>o.slug),['actual-a','actual-b','pendiente','conflicto']);
  assert.deepEqual(ofertas,originales);
});

test('sin revisión vigente la tarjeta dice el problema sin cifras; reventa y próximas no repiten su estado en cada fila', () => {
  const ui = componentes();
  const vencida = dato({ verificadaEl: '2026-09-27' });
  const original = structuredClone(vencida);
  const tarjeta = ui.FichaOferta({ oferta: vencida });
  for (const texto of [textoVisible(tarjeta), tarjeta.props.accessibilityLabel]) {
    assert.doesNotMatch(texto, /7,50|999 EUR|123 CHF|APY ilustrativo/);
    assert.match(texto, /Cifras por actualizar/);
    assert.doesNotMatch(texto, FECHA);
  }
  assert.deepEqual(vencida, original);
  // Con el catálogo caducado, lo mismo aunque la oferta esté en plazo; sin «Nueva» ni «No disponible».
  const caducado = ui.FichaOferta({ oferta: dato({ disponibleEs: false }), catalogoCaducado: true, nueva: true });
  assert.match(textoVisible(caducado), /Cifras por actualizar/);
  assert.doesNotMatch(textoVisible(caducado), /Nueva|No disponible en España/);
  assert.deepEqual(datosTarjeta(ui, caducado)[1], ['España', 'Sin confirmar']);
  // En plazo y fuera de España, sí lo dice, y el dato de España dice «No»:
  // nunca «Sin confirmar» al lado de «No disponible en España» (igual que la web).
  const fueraDeEspana = ui.FichaOferta({ oferta: dato({ disponibleEs: false }) });
  assert.match(textoVisible(fueraDeEspana), /No disponible en España/);
  assert.deepEqual(datosTarjeta(ui, fueraDeEspana)[1], ['España', 'No']);
  assert.doesNotMatch(textoVisible(fueraDeEspana), /Sin confirmar/);
  for (const [coleccion, supra, estado] of [['secundario', 'Reventa entre inversores', /sin confirmar que se pueda operar/],
    ['en_camino', 'Próxima', /sin confirmar que abra/]]) {
    const oferta = dato({ coleccion, tipo: coleccion === 'secundario' ? 'secundario' : 'rendimiento' });
    const fila = ui.FichaOferta({ oferta });
    for (const texto of [textoVisible(fila), fila.props.accessibilityLabel]) {
      assert.doesNotMatch(texto, /7,50|999 EUR|123 CHF|APY ilustrativo/);
      // El encabezado de la sección y la ficha ya lo explican (como la web).
      assert.doesNotMatch(texto, /Liquidez no confirmada|Apertura no confirmada|Cifras válidas|Cifras por actualizar/);
    }
    const detalle = ui.DetalleOferta({ oferta });
    assert.match(textoVisible(detalle), new RegExp(supra));
    assert.match(esencial(detalle, 'Cifras'), estado);
  }
});

test('patrocinio y aviso bloqueante principal permanecen visibles y sin elipsis; los demás avisos, en la ficha', () => {
  const oferta = dato({ patrocinada: true, avisos: [
    { tono: 'warn', esAntiguedad: true, texto: 'Revisión antigua repetida' },
    { tono: 'warn', texto: 'Aviso adicional de riesgo' },
    { tono: 'stop', texto: 'La apertura de nuevas inversiones no está confirmada.' },
  ] });
  const ui = componentes();
  const tarjeta = ui.FichaOferta({ oferta });
  const visible = textoVisible(tarjeta);
  // Rótulos en frase normal (GUIA-ACABADOS §5, aplicada a la web el 04/11).
  assert.match(visible, /Patrocinada/);
  assert.match(visible, /Importante\s+·\s+La apertura de nuevas inversiones no está confirmada\./);
  assert.doesNotMatch(visible, /más en la ficha|Aviso adicional de riesgo|Revisión antigua repetida/);
  const aviso = nodos(tarjeta).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo).includes('Importante'));
  assert.equal(aviso.props.numberOfLines, undefined);
  assert.match(tarjeta.props.accessibilityLabel, /Contenido patrocinado; no cambia el orden editorial/);
  assert.match(tarjeta.props.accessibilityLabel, /Aviso bloqueante: La apertura de nuevas inversiones no está confirmada\./);
  assert.doesNotMatch(tarjeta.props.accessibilityLabel, /Aviso adicional de riesgo/);
  const detalle = textoVisible(ui.DetalleOferta({ oferta }));
  for (const texto of ['Aviso adicional de riesgo', 'La apertura de nuevas inversiones no está confirmada.']) assert.ok(detalle.includes(texto), texto);
});

test('un aviso ordinario sale de la tarjeta y se lee entero, sin cortar, en la ficha', () => {
  const warning = 'La inversión puede perder valor. La salida depende de que haya compradores y no tiene liquidez garantizada.';
  const oferta = dato({ avisos: [
    { tono: 'warn', texto: warning }, { tono: 'warn', texto: 'Las comisiones reducen el resultado.' },
  ] });
  const ui = componentes();
  const tarjeta = ui.FichaOferta({ oferta });
  // Tarjeta sencilla (05/11/2026): ni el aviso ni su recuento («Revisa · N avisos en la ficha»).
  for (const texto of [textoVisible(tarjeta), tarjeta.props.accessibilityLabel]) {
    assert.doesNotMatch(texto, /Revisa|avisos? en la ficha|Precaución|perder valor|comisiones reducen/);
  }
  const detalle = ui.DetalleOferta({ oferta });
  for (const texto of [warning, 'Las comisiones reducen el resultado.']) {
    const nodo = nodos(detalle).find(n => n.tipo === 'FuenteOriginal' && textoVisible(n) === texto);
    assert.ok(nodo, texto);
    assert.equal(nodo.props.numberOfLines, undefined);
  }
});

test('estado documental conserva incertidumbre en la ficha y nunca hereda apertura del sello documental', () => {
  for (const [coleccion, esperado] of [['secundario', 'Reventa · sin confirmar que se pueda operar'], ['en_camino', 'Anunciada · sin confirmar que abra']]) {
    const ui = componentes();
    const detalle = ui.DetalleOferta({ oferta: dato({ coleccion }) });
    const estado = nodos(detalle).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo) === esperado);
    assert.ok(estado, esperado);
    assert.equal(estado.props.numberOfLines, undefined);
    assert.doesNotMatch(textoVisible(detalle), /Cifras válidas|Cifras vigentes|Revisadas el/);
    assert.doesNotMatch(textoVisible(ui.FichaOferta({ oferta: dato({ coleccion }) })), /Cifras válidas|Cifras vigentes/);
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
  assert.match(visible, /Ir a la web del proveedor \(sales de RWAdar\)\s*↗/);
  assert.doesNotMatch(visible, /Ver oferta en/);
  assert.doesNotMatch(visible, /Ver fuente 1 ·/);
  const enlaces = nodos(detalle).filter(nodo => nodo.tipo === 'Pressable' && nodo.props.accessibilityLabel?.includes(FUENTE));
  assert.equal(enlaces.length, 1, 'cada destino tiene una sola acción, sin repetir el CTA principal en las referencias');
  for (const enlace of enlaces) {
    const etiquetaVisible = textoVisible(enlace).replace(/\s+/g, ' ').trim().replace(/ ↗$/, '');
    assert.ok(enlace.props.accessibilityLabel.startsWith(etiquetaVisible));
    enlace.props.onPress();
  }
  assert.deepEqual(abiertos, [FUENTE]);
});

test('el detalle muestra éxito y gestión separados con fechas y enlaces propios de cada coste',()=>{
  const oferta=dato();
  const gestion='https://gestion.example/comisiones',exito='https://exito.example/comisiones';
  oferta.documentacion.fuentes.push(gestion,exito);
  oferta.documentacion.referencias.push(
    {etiqueta:'Comisión de gestión',valor:'0,6 % anual',fuente:gestion,fechaConsulta:'2026-09-29',fechaDato:null,alcance:'Gestión publicada en la fuente.'},
    {etiqueta:'Comisión de éxito',valor:'0 %',fuente:exito,fechaConsulta:'2026-09-30',fechaDato:null,alcance:'Éxito publicado en la fuente.'});
  const abiertos=[];
  const detalle=componentes().DetalleOferta({oferta,onAbrirEnlace:url=>abiertos.push(url)});
  const visible=textoVisible(detalle);
  assert.match(visible,/Comisión de gestión\s*:\s*0,6 % anual/);
  assert.match(visible,/Comisión de éxito\s*:\s*0 %/);
  assert.match(visible,/Comisión de gestión\s*: fuente consultada el\s*29\/09\/2026\s*·\s*gestion\.example/);
  assert.match(visible,/Comisión de éxito\s*: fuente consultada el\s*30\/09\/2026\s*·\s*exito\.example/);
  for(const url of [gestion,exito]) {
    const enlaces=nodos(detalle).filter(n=>n.tipo==='Pressable' && n.props.accessibilityLabel?.includes(url));
    assert.equal(enlaces.length,1);enlaces[0].props.onPress();
  }
  assert.deepEqual(abiertos,[gestion,exito]);
});

test('compactación no reduce la legibilidad ni fija alturas sobre condiciones o riesgos', () => {
  const { estilos } = componentes();
  // La miniatura de la fila de la web (80 px, cuadrada; 05/11/2026).
  assert.equal(estilos.imagenFicha.aspectRatio, 1);
  assert.ok(estilos.titulo.fontSize >= 16);
  assert.ok(estilos.datoValor.fontSize >= 16);
  for (const nombre of ['plataforma', 'datoTarjetaEtiqueta', 'datoTarjetaValor', 'alertaRevision', 'noDisponible', 'avisoFichaTxt', 'referencia']) {
    assert.ok(estilos[nombre].fontSize >= 12, nombre);
    assert.equal(estilos[nombre].height, undefined);
    assert.equal(estilos[nombre].maxHeight, undefined);
  }
  assert.equal(estilos.ficha.height, undefined);
  assert.equal(estilos.filaMetrica.flexDirection, undefined);
  assert.ok(estilos.metricaValor.lineHeight >= 20);
});

test('detalle largo mantiene el título completo dentro del scroll y los controles fuera', () => {
  const ui = componentes();
  const titulo = 'Edificio residencial con arrendamiento comercial y participación documentada '.repeat(5);
  let cierres = 0; let guardados = 0;
  const detalle = ui.DetalleOferta({ oferta: dato({ titulo }), onCerrar: () => cierres++, onGuardar: () => guardados++ });
  const scroll = nodos(detalle).find(n => n.tipo === 'ScrollView');
  const cabecera = nodos(detalle).find(n => n.tipo === 'View' && n.props.style === ui.estilos.cabeceraModal);
  const tituloVisible = nodos(scroll).find(n => n.tipo === 'Text' && textoVisible(n) === titulo);
  assert.ok(tituloVisible, 'el título largo debe permanecer íntegro y desplazable');
  assert.equal(tituloVisible.props.numberOfLines, undefined);
  assert.equal(tituloVisible.props.accessibilityRole, 'header');
  assert.ok(!textoVisible(cabecera).includes(titulo));
  assert.equal(ui.estilos.modalDesplazamiento.flex, 1);
  assert.equal(ui.estilos.modalDesplazamiento.minHeight, 0);
  assert.equal(ui.estilos.cabeceraModal.flexShrink, 0);
  const acciones = nodos(cabecera).filter(n => n.tipo === 'Pressable');
  assert.equal(acciones.length, 2);
  acciones.forEach(n => n.props.onPress());
  assert.equal(cierres, 1);
  assert.equal(guardados, 1);
  detalle.props.onRequestClose();
  assert.equal(cierres, 2, 'atrás de Android cierra el mismo detalle');
  assert.ok(ui.estilos.cerrar.width >= 44 && ui.estilos.cerrar.height >= 44);
  assert.equal(ui.estilos.cerrar.flexShrink, 0);
});

test('cada oferta abre su propio scroll, respeta los cuatro insets y conserva la foto completa', () => {
  const ui = componentes();
  for (const slug of ['primera-ficha', 'segunda-ficha']) {
    const detalle = ui.DetalleOferta({ oferta: dato({ slug }) });
    const scroll = nodos(detalle).find(n => n.tipo === 'ScrollView');
    assert.equal(scroll.props.key, slug, 'cambiar de ficha no conserva el desplazamiento anterior');
    assert.equal(scroll.props.contentInsetAdjustmentBehavior, 'never', 'SafeArea aplica los insets una sola vez');
    const safe = nodos(detalle).find(n => n.tipo === 'SafeAreaView');
    assert.deepEqual(safe.props.edges, ['top', 'right', 'bottom', 'left']);
    assert.equal(safe.props.accessibilityViewIsModal, true);
    assert.equal(detalle.props.statusBarTranslucent, false);
    assert.equal(detalle.props.navigationBarTranslucent, false);
  }
  assert.equal(ui.estilos.imagenGrande.height, undefined);
  assert.equal(ui.estilos.imagenGrande.aspectRatio, 960 / 660);
});

test('la ficha de plataforma también deja el nombre completo en un scroll acotado', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const fuente = app.slice(app.indexOf('function Detalle({'), app.indexOf('const e = StyleSheet.create'));
  const { code } = babel.transformSync(fuente, {babelrc:false,configFile:false,plugins:[jsx]});
  const crear = (tipo, props, ...children) => ({tipo, props, children});
  const e = {};
  const nombres = ['Modal','SafeAreaProvider','SafeAreaView','View','Text','Pressable','ScrollView','FuenteOriginal'];
  const fn = new Function('React',...nombres,'e','C','COLOR_CATEGORIA','iniciales','Animated','useTransicionFicha', code + '; return Detalle;');
  const Detalle = fn({createElement:crear},...nombres,e,{},{},()=> 'PR', {View:'AnimatedView'},(_visible,cerrar)=>({cerrar,estilo:{}}));
  const p = {slug:'plataforma-larga',nombre:'Nombre completo de plataforma '.repeat(9),categoria:'Inmobiliario'};
  let cerrado = false;
  const arbol = Detalle({p,onCerrar:()=>{cerrado=true;}});
  const scroll = nodos(arbol).find(n => n.tipo === 'ScrollView');
  assert.equal(scroll.props.key, p.slug);
  assert.ok(textoVisible(scroll).includes(p.nombre));
  const titulo = nodos(scroll).find(n => n.tipo === 'Text' && textoVisible(n) === p.nombre);
  assert.equal(titulo.props.numberOfLines, undefined);
  assert.equal(titulo.props.accessibilityRole, 'header');
  arbol.props.onRequestClose();
  assert.equal(cerrado,true);
  assert.match(app, /detDesplazamiento: \{ flex: 1, minHeight: 0 \}/);
});

test('ES/EN marca títulos, valores y citas originales sin cambiar datos y muestra un solo aviso por detalle',()=>{
  const ui=componentes();
  const oferta=dato({titulo:'Crédito privado',plataformaNombre:'Inmobiliario'});
  const original=JSON.stringify(oferta);
  const tarjeta=ui.FichaOferta({oferta});
  for(const literal of [oferta.titulo,oferta.plataformaNombre]) {
    const node=nodos(tarjeta).find(n=>n.tipo==='Text'&&textoVisible(n)===literal);
    assert.equal(node?.props.noTraducir,true,literal);
    assert.equal(node.props.idiomaOriginal,'es-ES');
  }
  const detalle=ui.DetalleOferta({oferta,onCerrar(){},onAbrirEnlace(){}});
  const sources=nodos(detalle).filter(n=>n.tipo==='FuenteOriginal');
  assert.equal(sources.filter(n=>n.props.aviso!==false).length,1,'un único aviso, sin repetirlo por dato');
  assert.ok(sources.some(n=>textoVisible(n)===oferta.documentacion.descripcion&&n.props.aviso===false));
  for(const literal of ['7,50 %',oferta.rentabilidad.literal,'123 CHF históricos','Característica documental completa']) {
    const node=nodos(detalle).find(n=>n.tipo==='Text'&&textoVisible(n)===literal);
    assert.equal(node?.props.noTraducir,true,literal);
  }
  assert.equal(JSON.stringify(oferta),original);
});
