const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const fuente = fs.readFileSync(path.join(__dirname, '../componentes/Explicador.js'), 'utf8');
const ast = babel.parseSync(fuente, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
const inyeccion = ast.program.body.flatMap(n => n.declarations || [])
  .find(n => n.id.name === 'SOLO_EL_EXPLICADOR')?.init;
assert.equal(inyeccion?.type, 'TemplateLiteral');
assert.equal(inyeccion.expressions.length, 0, 'El ensayo debe ejecutar la inyección exacta');
const script = inyeccion.quasis.map(q => q.value.cooked).join('');
const atributo = 'data-rwadar-explicador-ruta';

function entorno({ movil = false, sinLeccion = false } = {}) {
  const todos = [], eventos = new Map(), mensajes = [], pasos = [], desplazamientos = [];
  function nodo(id, padre = null) {
    const atributos = new Map(), estilos = new Map();
    const elemento = {
      id, parentElement: padre, children: [], atributos,
      hasAttribute: k => atributos.has(k),
      setAttribute: (k, v) => atributos.set(k, v),
      removeAttribute: k => atributos.delete(k),
      style: {
        setProperty: (k, v, p = '') => estilos.set(k, [v, p]),
        getPropertyValue: k => estilos.get(k)?.[0] || '',
        getPropertyPriority: k => estilos.get(k)?.[1] || '',
        removeProperty: k => estilos.delete(k),
      },
      appendChild(hijo) { hijo.parentElement = elemento; elemento.children.push(hijo); },
      contains(hijo) {
        for (let n = hijo; n; n = n.parentElement) if (n === elemento) return true;
        return false;
      },
    };
    if (padre) padre.children.push(elemento);
    todos.push(elemento);
    return elemento;
  }
  const html = nodo('html'), head = nodo('head', html), body = nodo('body', html);
  const cabecera = nodo('movilCabecera', body), main = nodo('top', body);
  const panel = nodo('movilPanelRadar', main), emisiones = nodo('emisiones', panel);
  const academy = nodo('academy', panel), contenidoAcademy = nodo('otras-lecciones', academy);
  const contenedor = nodo('academyLeccion', academy), nav = nodo('movilNav', body);
  const leccion = sinLeccion ? null : nodo('explain', movil ? contenedor : panel);
  const escena = leccion && nodo('scene', leccion);
  const canvas = escena && nodo('canvas-original', escena);
  if (movil) {
    academy.setAttribute('hidden', '');
    academy.setAttribute('inert', '');
    academy.setAttribute('aria-hidden', 'true');
  }
  academy.style.setProperty('display', 'flex');
  const document = {
    documentElement: html, body, head,
    getElementById: id => todos.find(n => n.id === id) || null,
    createElement: tipo => nodo(tipo),
  };
  const window = {
    ReactNativeWebView: { postMessage: mensaje => mensajes.push(mensaje) },
    irPaso: (...args) => pasos.push(args), scrollTo: (...args) => desplazamientos.push(args),
    addEventListener(tipo, fn) { eventos.set(tipo, [...(eventos.get(tipo) || []), fn]); },
    dispatchEvent(evento) { for (const fn of eventos.get(evento.type) || []) fn(); },
    requestAnimationFrame: fn => fn(),
  };
  const contexto = vm.createContext({ document, window, Event: class { constructor(type) { this.type = type; } } });
  return { todos, document, window, eventos, mensajes, pasos, desplazamientos,
    body, panel, academy, contenedor, leccion, escena, canvas, emisiones, cabecera, nav, contenidoAcademy,
    ejecutar: () => vm.runInContext(script, contexto, { timeout: 1000 }),
  };
}

test('la inyección conserva solo la cadena de contenedores de la lección sin clonar el canvas', () => {
  for (const movil of [false, true]) {
    const e = entorno({ movil });
    const padreOriginal = e.leccion.parentElement;
    assert.equal(e.ejecutar(), true, 'WebView exige un resultado JS válido');
    for (let n = e.leccion; n !== e.document.documentElement; n = n.parentElement) {
      assert.equal(n.atributos.has(atributo), true);
      assert.equal(n.atributos.has('hidden'), false);
      assert.equal(n.atributos.has('aria-hidden'), false);
      assert.equal(n.atributos.has('inert'), false);
      assert.equal(n.style.getPropertyValue('display'), 'block');
    }
    for (const n of [e.emisiones, e.cabecera, e.nav, e.contenidoAcademy, e.canvas]) {
      assert.equal(n.atributos.has(atributo), false, n.id);
    }
    assert.equal(e.leccion.parentElement, padreOriginal);
    assert.equal(e.leccion.children[0], e.escena);
    assert.equal(e.escena.children[0], e.canvas);
    assert.equal(e.leccion.style.getPropertyValue('padding-inline'), '16px');
    for (const n of [e.emisiones, e.cabecera, e.nav]) {
      assert.equal(n.style.getPropertyValue('display'), 'none');
      assert.equal(n.style.getPropertyPriority('display'), 'important');
    }
    assert.equal(e.document.head.children.length, 0, 'Sin estilos de texto bloqueables por CSP');
    assert.deepEqual(e.pasos, [[0, true]]);
    assert.deepEqual(e.desplazamientos, [[0, 0]]);
    assert.deepEqual(e.mensajes, []);
  }
});

test('al recolocar la lección se retiran los marcadores y estilos del contenedor anterior', () => {
  const e = entorno({ movil: true });
  e.ejecutar();
  e.contenedor.children = [];
  e.leccion.parentElement = e.panel;
  e.panel.children.push(e.leccion);
  e.window.dispatchEvent({ type: 'resize' });
  assert.equal(e.academy.atributos.has(atributo), false);
  assert.equal(e.contenedor.atributos.has(atributo), false);
  assert.equal(e.academy.style.getPropertyValue('display'), 'none');
  assert.equal(e.contenedor.style.getPropertyValue('display'), '');
  assert.equal(e.panel.atributos.has(atributo), true);
});

test('reinyectar no duplica estilos, listeners ni arranque de la escena', () => {
  const e = entorno({ movil: true });
  e.ejecutar();
  assert.equal(e.ejecutar(), true);
  assert.equal(e.document.head.children.length, 0);
  assert.equal(e.document.documentElement.hasAttribute('data-rwadar-explicador-activo'), true);
  assert.equal(e.eventos.get('resize').length, 1);
  assert.equal(e.pasos.length, 1);
});

test('una página sin la lección pide el fallback nativo y no deja contenido ajeno como explicador', () => {
  const e = entorno({ sinLeccion: true });
  assert.equal(e.ejecutar(), true);
  assert.deepEqual(e.mensajes, ['rwadar:explicador-no-disponible']);
  assert.equal(e.document.head.children.length, 0);
  assert.equal(e.eventos.size, 0);
});

test('el puente a React solo activa el fallback ante el mensaje exacto esperado', () => {
  let callback;
  babel.traverse(ast, { JSXAttribute(ruta) {
    if (ruta.node.name.name === 'onMessage') callback = ruta.node.value.expression;
  } });
  assert.ok(callback);
  const js = babel.transformFromAstSync(babel.types.file(babel.types.program([
    babel.types.expressionStatement(callback),
  ])), null, { babelrc: false, configFile: false }).code;
  const valores = [];
  const manejar = vm.runInNewContext(js, { setFallo: valor => valores.push(valor) });
  for (const evento of [null, {}, { nativeEvent: { data: 'https://otra-web.test/' } },
    { nativeEvent: { data: '{"accion":"activar"}' } }]) manejar(evento);
  assert.deepEqual(valores, []);
  manejar({ nativeEvent: { data: 'rwadar:explicador-no-disponible' } });
  assert.deepEqual(valores, [true]);
});
