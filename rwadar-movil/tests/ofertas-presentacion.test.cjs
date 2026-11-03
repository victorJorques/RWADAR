'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const {soporteIdioma}=require('./soporte-idioma.cjs');

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
  './academy-progreso': modulo('lib/academy-progreso.js'),
});

function componentes(ahora = AHORA, opciones = {}) {
  const estilos = {};
  const crear = (tipo, props, ...children) => typeof tipo === 'function' && tipo.name === 'FilaMetrica'
    ? tipo(props) : { tipo: typeof tipo === 'function' ? tipo.name : tipo, props, children };
  class Reloj extends Date { constructor(...args) { super(...(args.length ? args : [ahora.getTime()])); } }
  const render = modulo('componentes/Ofertas.js', {
    react: { createElement: crear, useState: opciones.useState || (valor => [typeof valor === 'function' ? valor() : valor, () => {}]),
      useEffect: opciones.useEffect || (() => {}) },
    'react-native': { ...Object.fromEntries(['Image', 'Modal', 'Pressable', 'ScrollView', 'Text', 'View'].map(nombre => [nombre, nombre])),
      Animated: { View: 'AnimatedView' },
      AppState: {}, StyleSheet: { hairlineWidth: 1, create(valor) { Object.assign(estilos, valor); return valor; } } },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../fixtures/imagenes-editoriales': opciones.imagenes || { ETIQUETA_EDITORIAL: 'Ilustración editorial', imagenEditorial: () => null,
      imagenEditorialOferta: () => null },
    '../lib/datos': datos,
    '../lib/verificacion-local': verificacion,
    '../lib/ficha-editorial': require('../lib/ficha-editorial'),
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

test('tarjeta móvil prioriza nombre/proveedor, tres datos y la consulta de fuente sin repetir el documento', () => {
  const ui = componentes();
  const oferta = dato();
  const tarjeta = ui.FichaOferta({ oferta });
  const visible = textoVisible(tarjeta);
  const textos = nodos(tarjeta).filter(nodo => nodo.tipo === 'Text').map(textoVisible);
  assert.ok(textos.indexOf(oferta.titulo) < textos.indexOf(oferta.plataformaNombre));
  for (const esperado of [oferta.titulo, oferta.plataformaNombre, 'Fuente consultada 30/09/2026',
    'Mínimo (EUR)', 'España', 'Salida', 'Ver ficha →']) assert.ok(visible.includes(esperado), esperado);
  for (const fuera of ['7,50 %', oferta.rentabilidad.literal, oferta.documentacion.descripcion, 'Referencia documentada', '999 EUR', '123 CHF', oferta.resumen, 'RENT. AJUSTADA']) {
    assert.ok(!visible.includes(fuera), `bloque largo reapareció en la tarjeta: ${fuera}`);
  }
  assert.ok(tarjeta.props.accessibilityLabel.includes('Fuente consultada 30/09/2026'));
  assert.ok(tarjeta.props.accessibilityLabel.startsWith(`Ver ficha de ${oferta.titulo}`));
  assert.equal(nodos(tarjeta).filter(nodo => nodo.tipo === 'Pressable').length, 1);
  assert.equal(tarjeta.props.accessibilityRole, 'button');
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
  const tarjeta = componentes().FichaOferta({oferta});
  const texto = textoVisible(tarjeta);
  assert.match(texto,/1000 €/);
  assert.match(texto,/Fuente consultada 30\/09\/2026/);
  const detalle = textoVisible(componentes().DetalleOferta({oferta}));
  assert.match(detalle,/Fuente consultada el\s+29\/09\/2026/);
  assert.match(detalle,/Fecha del dato:\s+28\/09\/2026/);
  assert.match(texto,/Sin confirmar/);
  assert.match(texto,/Sin documentar/);
  assert.doesNotMatch(texto,/999 EUR|Disponible desde España/);
  assert.match(tarjeta.props.accessibilityLabel,/Mínimo \(EUR\): 1000 €/);
});

test('un mínimo en otra moneda se rotula «Mínimo» y la salida no repite «Salida:»', () => {
  const oferta = dato();
  oferta.documentacion.referencias.push(
    {etiqueta:'Mínimo de inversión',valor:'500 CHF por transferencia bancaria',fechaDato:'2026-09-28',
      fechaConsulta:'2026-09-29',fuente:FUENTE,alcance:'Mínimo publicado por el emisor.'},
    {etiqueta:'Salida',valor:'Venta solo a otros accionistas',fechaDato:'2026-09-28',
      fechaConsulta:'2026-09-29',fuente:FUENTE,alcance:'Condición de salida publicada.'});
  const tarjeta = componentes().FichaOferta({oferta});
  const texto = textoVisible(tarjeta);
  assert.match(texto,/500 CHF por transferencia bancaria/);
  assert.doesNotMatch(texto,/Mínimo \(EUR\)/);
  assert.match(tarjeta.props.accessibilityLabel,/Mínimo: 500 CHF/);
  assert.match(texto,/Venta solo a otros accionistas/);
  assert.doesNotMatch(texto,/Salida:\s*Venta/);
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
  assert.match(textoVisible(detalle),/Sin comprobar desde España/);
  nodos(detalle).find(n=>n.props?.accessibilityLabel?.includes('https://regulador.example/registro')).props.onPress();
  assert.deepEqual(abiertos,['https://regulador.example/registro']);
  plataforma.verificacionLocal.licenciaRegistro.fuentes[0].url = 'https://secreto@regulador.example/registro';
  assert.doesNotMatch(textoVisible(ui.DetalleOferta({oferta:dato(),plataforma})),/Registro confirmado/);
});

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
  for (const condicion of ['Mínimo publicado en euros', 'Acceso desde España', 'Cómo recuperar el dinero', 'Costes publicados']) {
    assert.ok(texto.indexOf(condicion) >= 0 && texto.indexOf(condicion) < texto.indexOf(registro), condicion);
    assert.ok(texto.indexOf(condicion) < texto.indexOf('EN TRES FRASES'), condicion);
  }
  assert.ok(texto.includes(registro));
  assert.ok(texto.indexOf('Puedes perder dinero') < texto.indexOf('Mínimo publicado en euros'));
  assert.ok(texto.includes('No consta en esta ficha. Un registro de la plataforma no acredita cada oferta.'));
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
    && n.props.accessibilityLabel?.startsWith('Ver en la fuente ·'));
  assert.equal(principales.length, 1);
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
      assert.match(textoVisible(tarjeta),new RegExp(`Ver\\s*${fila.ofertas.length}\\s*referencias`));
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

test('datos vencidos y colecciones documentales no regresan al simplificar la tarjeta', () => {
  const ofertas = [dato({ verificadaEl: '2026-09-27' }),
    dato({ coleccion: 'secundario', tipo: 'secundario' }), dato({ coleccion: 'en_camino' })];
  for (const oferta of ofertas) {
    const original = structuredClone(oferta);
    const tarjeta = componentes().FichaOferta({ oferta });
    for (const texto of [textoVisible(tarjeta), tarjeta.props.accessibilityLabel]) {
      assert.doesNotMatch(texto, /7,50|999 EUR|123 CHF|APY ilustrativo/);
    }
    assert.ok(textoVisible(tarjeta).includes('Fuente consultada 30/09/2026'));
    assert.match(textoVisible(tarjeta), /cifras ocultas|disponibilidad sin confirmar|apertura sin confirmar/);
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
  const warning = 'La inversión puede perder valor. La salida depende de que haya compradores y no tiene liquidez garantizada.';
  const tarjeta = componentes().FichaOferta({ oferta: dato({ avisos: [
    { tono: 'warn', texto: warning }, { tono: 'warn', texto: 'Las comisiones reducen el resultado.' },
  ] }) });
  const aviso = nodos(tarjeta).find(nodo => nodo.tipo === 'Text' && textoVisible(nodo).includes(warning));
  assert.ok(aviso);
  assert.equal(aviso.props.numberOfLines, undefined);
  assert.match(textoVisible(tarjeta), /1 más en la ficha/);
  assert.doesNotMatch(textoVisible(tarjeta), /Avisos y condiciones en la ficha completa/);
  assert.ok(tarjeta.props.accessibilityLabel.includes(warning));
  assert.match(tarjeta.props.accessibilityLabel, /Precaución/);
});

test('estado documental conserva incertidumbre y nunca hereda apertura del sello documental', () => {
  for (const [coleccion, esperado] of [['secundario', 'disponibilidad sin confirmar'], ['en_camino', 'apertura sin confirmar']]) {
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
  assert.match(visible, /Ver en la fuente\s*·\s*Proveedor/);
  assert.doesNotMatch(visible, /OTRAS FUENTES CONSULTADAS/);
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
  assert.match(visible,/Comisión de gestión: 0,6 % anual/);
  assert.match(visible,/Comisión de éxito: 0 %/);
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
