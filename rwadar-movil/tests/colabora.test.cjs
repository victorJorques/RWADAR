'use strict';

/* «¿Quieres colaborar con nosotros?» (12/11/2026): el bloque Colabora con
   React aislado (como calculadora-inicio.test.cjs), su sitio al final de
   Inicio y de Perfil, el mailto, el fallo al abrir el correo, el inglés y que
   el texto del bloque es el mismo que el de la web. */
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
const en = require('../lib/idioma-en');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...r) => fs.readFileSync(path.join(RAIZ, ...r), 'utf8');
const CORREO = 'rwadares@gmail.com';

const tema = { C: new Proxy({}, { get: (_, c) => `#${String(c)}` }), F: new Proxy({}, { get: (_, c) => String(c) }),
  T: { menor: {} }, R: { s: 8, m: 12, l: 16, p: 999 }, UI: { margen: 16, tactil: 48, boton: 48 }, pulsado: () => ({}) };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (typeof arbol !== 'object') return [arbol];
  return [arbol, ...nodos(arbol.children), ...nodos(arbol.props?.children)];
}
const textos = (arbol) => nodos(arbol).filter((n) => typeof n === 'string');
const porId = (arbol, id) => nodos(arbol).find((n) => n?.props?.testID === id);
function crearReact() {
  const slots = []; let indice = 0;
  const react = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function') return tipo({ ...props, children: children.length > 1 ? children : children[0] });
      return { type: tipo, props: props || {}, children };
    },
    Fragment: 'Fragment',
    forwardRef: (fn) => (props) => fn(props, null),
    useSyncExternalStore: (_s, leerEstado) => leerEstado(),
    useState(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = inicial;
      return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
  };
  return { react, pintar(componente, props) { indice = 0; return componente(props); } };
}
function cargar(react) {
  const absoluto = path.join(RAIZ, 'componentes', 'Colabora.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Linking: { openURL: async () => {} } };
  for (const tipo of ['Text', 'View', 'Pressable']) nativo[tipo] = tipo;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === './Navegacion') return { Icono: () => null };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { abrir() {} } };
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
function montar(props = {}) {
  const { react, pintar } = crearReact();
  const modulo = cargar(react);
  return { modulo, pintar: () => pintar(modulo.default, props) };
}

test('app · Colabora: encabezado real, las dos frases, la de independencia y un enlace que dice el correo', () => {
  const { modulo, pintar } = montar();
  const arbol = pintar();
  const t = modulo.TEXTOS_COLABORA;
  assert.equal(modulo.MAILTO_COLABORA, `mailto:${CORREO}`);
  const titulo = nodos(arbol).find((n) => n?.props?.accessibilityRole === 'header');
  assert.deepEqual(textos(titulo), ['¿Quieres colaborar con nosotros?']);
  assert.ok(leer('../rwadar-site/index.html').includes(t.texto) && leer('../rwadar-site/index.html').includes(t.nota));
  assert.ok(textos(arbol).includes(t.texto) && /plataforma o un emisor/.test(t.texto) && /sector/.test(t.texto) && /mejora/.test(t.texto));
  assert.ok(textos(arbol).includes('Colaborar no compra un puesto en el catálogo: las ofertas se eligen con criterios editoriales y RWAdar no recibe dinero de las inversiones.'));
  const boton = porId(arbol, 'colaboraCorreo');
  assert.equal(boton.props.accessibilityRole, 'link');
  assert.equal(boton.props.accessibilityLabel, `Escríbenos: ${CORREO}`);
  assert.ok(textos(boton).includes(`Escríbenos: ${CORREO}`));
  assert.equal(porId(arbol, 'colaboraFallo'), undefined);
});

test('app · Colabora: pulsar abre mailto:rwadares@gmail.com; si no se puede, lo dice y deja el correo seleccionable', async () => {
  const pedidas = [];
  const bien = montar({ abrirCorreo: async (url) => { pedidas.push(url); } });
  await porId(bien.pintar(), 'colaboraCorreo').props.onPress();
  assert.deepEqual(pedidas, [`mailto:${CORREO}`]);
  assert.equal(porId(bien.pintar(), 'colaboraFallo'), undefined);

  const mal = montar({ abrirCorreo: async () => { throw new Error('No hay aplicación de correo'); } });
  await porId(mal.pintar(), 'colaboraCorreo').props.onPress();
  const fallo = porId(mal.pintar(), 'colaboraFallo');
  assert.ok(fallo, 'se ve el aviso del fallo');
  assert.ok(nodos(fallo).some((n) => n?.props?.accessibilityRole === 'alert'));
  const correo = nodos(fallo).find((n) => n?.props?.selectable);
  assert.deepEqual(textos(correo), [CORREO]);
});

test('app · Colabora en inglés: título, frases, botón y su nombre accesible, con el correo intacto', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { pintar } = montar();
    const arbol = pintar();
    const todo = textos(arbol);
    for (const t of ['Would you like to work with us?', 'Write to us: rwadares@gmail.com',
      'Working with us does not buy a place in the catalogue: offers are chosen on editorial criteria and RWAdar receives no money from investments.'])
      assert.ok(todo.includes(t), t);
    assert.ok(!todo.some((t) => /[¿á]|Escríbenos|Colaborar/.test(t)), 'no queda castellano');
    const boton = porId(arbol, 'colaboraCorreo');
    assert.equal(boton.props.accessibilityLabel, 'Write to us: rwadares@gmail.com');
    assert.equal(boton.props.accessibilityHint, 'Opens your email app');
  } finally { await idioma.cambiarIdioma('es'); }
  // Todas sus cadenas tienen traducción en el diccionario común (el mismo que la web).
  const { TEXTOS_COLABORA } = montar().modulo;
  for (const t of Object.values(TEXTOS_COLABORA)) assert.ok(Object.hasOwn(en, t), `sin traducción: ${t}`);
  assert.equal(leer('lib', 'idioma-en.js'), fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/idioma-en-20261022.js'), 'utf8'));
});

test('app · Colabora va al final de Inicio (tras Aprende, antes del pie legal) y al final de Perfil (antes de la nota final)', () => {
  const inicio = leer('componentes', 'Inicio.js');
  const cuerpo = inicio.slice(inicio.indexOf('export default function Inicio'), inicio.indexOf('<ResultadoFlotante'));
  const [aprende, colabora, pie] = ['b.aprende.titulo', '<Colabora />', 'style={e.pie}'].map((x) => cuerpo.indexOf(x));
  assert.ok(aprende > 0 && colabora > aprende && pie > colabora, 'Inicio: Aprende → Colabora → Pie');
  assert.equal((cuerpo.match(/<Colabora\b/g) || []).length, 1);
  assert.equal(cuerpo.slice(colabora).indexOf('accessibilityRole="header"'), -1, 'después de Colabora no hay más bloques con título');

  const app = leer('App.js');
  const perfil = app.slice(app.indexOf('function PantallaPerfil('), app.indexOf('function GrupoMenu('));
  const [ultimoGrupo, enPerfil, nota, fin] = [perfil.lastIndexOf('</GrupoMenu>'), perfil.indexOf('<Colabora enPerfil />'), perfil.indexOf('style={e.notaMas}'), perfil.lastIndexOf('</ScrollView>')];
  assert.ok(ultimoGrupo > 0 && enPerfil > ultimoGrupo && nota > enPerfil && fin > nota, 'Perfil: último grupo → Colabora → nota final');
  assert.match(app, /import Colabora from '\.\/componentes\/Colabora';/);
});
