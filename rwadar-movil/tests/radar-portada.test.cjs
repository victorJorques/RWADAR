'use strict';

/* El radar de Inicio con su leyenda al lado (13/11/2026). Antes los nombres
   iban dentro del dibujo y, al encogerlo a 176 px, se montaban sobre el aro y
   los puntos; con pantalla baja (120 px) se quitaban y quedaba una bolita de
   puntos sin sentido. Ahora el dibujo va sin texto y la leyenda es texto real
   al lado: seis filas en el orden del radar, con el punto de color, el nombre
   y cuántas plataformas hay. El radar de Plataformas no cambia. */
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

const RAIZ = path.join(__dirname, '..');
function cargar(archivo, mocks) {
  const nombre = path.join(RAIZ, archivo);
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), { filename: nombre, babelrc: false, configFile: false, plugins: [commonjs, jsx] }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', 'console', codigo)(modulo, modulo.exports, (n) => {
    if (n === './Idioma') return soporteIdioma(mocks.react, mocks['react-native']);
    if (n === '../lib/idioma') return idioma;
    assert.ok(Object.hasOwn(mocks, n), 'Dependencia inesperada: ' + n); return mocks[n];
  }, { info() {} });
  return modulo.exports;
}
const tema = cargar('lib/tema.js', { 'react-native': { Platform: { select: (v) => v.android } } });

/* El radar con React de mentira: el árbol queda a la vista para recorrerlo.
   `efectos`: ejecuta los useEffect (para ver si el barrido gira o no).
   `react` y `accesibilidad`: otro React (con estado) y otro AccessibilityInfo.
   `giro.registro` apunta en orden lo que se hace con el valor del barrido;
   al arrancar el bucle, con el valor que tenía en ese momento. */
const createElement = (type, props, ...children) => ({ type, props: props || {}, children });
function radar({ ancho = 390, alto = 844, fontScale = 1, efectos = false, react = null, accesibilidad = null } = {}) {
  const giro = { valores: [], arranques: 0, registro: [] };
  const estilos = {};
  const nativo = {
    Animated: {
      Value: class {
        constructor(v) { this.valor = v; giro.valores.push(['inicial', v]); }
        interpolate(c) { return { interpolacion: c }; }
        setValue(v) { this.valor = v; giro.valores.push(['fijo', v]); giro.registro.push(['fijo', v]); }
      },
      View: 'AnimatedView', timing: (v) => ({ v }),
      loop: (a) => ({ start() { giro.arranques++; giro.registro.push(['arranque', a.v.valor]); }, stop() { giro.registro.push(['parada']); } }),
    },
    AccessibilityInfo: accesibilidad || { isReduceMotionEnabled: () => new Promise(() => {}), addEventListener: () => ({ remove() {} }) },
    Easing: { linear: 'linear' }, Pressable: 'Pressable', Text: 'Text', View: 'View',
    useWindowDimensions: () => ({ width: ancho, height: alto, fontScale }),
    StyleSheet: { absoluteFill: {}, hairlineWidth: 1, create: (v) => { Object.assign(estilos, v); return v; } },
  };
  const r = cargar('componentes/Radar.js', {
    react: react || { createElement, useRef: (v) => ({ current: v }), useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
      useEffect: efectos ? (fn) => { fn(); } : () => {}, useMemo: (fn) => fn() },
    'react-native': nativo,
    'react-native-svg': { __esModule: true, ...Object.fromEntries(['default', 'Circle', 'Defs', 'G', 'Line', 'Path', 'RadialGradient', 'Stop', 'Text'].map((x) => [x, 'Svg' + x])) },
    '../lib/tema': tema, '../lib/verificacion-local': { etiquetaEstadoVerificacionLocal: () => 'Sin comprobar' },
  });
  return { ...r, estilos, giro };
}
function nodos(n) { return !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(nodos) : [n, ...nodos(n.children)]; }
const textoDe = (n) => nodos(n.children).concat(n.children).filter((x) => typeof x === 'string').join('');
const plano = (estilo) => (Array.isArray(estilo) ? Object.assign({}, ...estilo.flat(Infinity).filter(Boolean).map(plano)) : estilo || {});

// El catálogo publicado (25 plataformas), con la forma de la app.
const fuente = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8');
const { P } = new Function(`${fuente};return {P};`)();
const DATOS = P.map((p) => ({ slug: p.slug, nombre: p.n, categoria: p.cat, acceso: p.acceso, verificacionLocal: p.verificacionLocal }));
const ORDEN = ['Inmobiliario', 'Crédito', 'Tesoro', 'Acciones', 'Materias primas', 'Infraestructura'];
const CATEGORIAS = Object.keys(tema.COLOR_CATEGORIA);
/* Lo esperado sale de los datos: el catálogo cambia en cada ciclo y la prueba
   no puede llevar las cifras de hoy escritas a mano. */
const cuenta = (c) => DATOS.filter((p) => p.categoria === c).length;
const etiqueta = (pre, nombres) => `${pre}: ${nombres.map((n, i) => `${n}, ${cuenta(CATEGORIAS[i])}`).join('; ')}`;

function portada(opciones = {}, props = {}) {
  const ui = radar(opciones);
  const arbol = ui.default({ datos: DATOS, onAbrir() {}, onFiltrar() {}, portada: true, ...props });
  const todos = nodos(arbol);
  const leyenda = todos.find((n) => n.type === 'View' && n.props.accessible && /^(Plataformas por tipo de activo|Platforms by asset type):/.test(n.props.accessibilityLabel || ''));
  const filas = leyenda ? leyenda.children.flat(Infinity).filter((n) => n && n.type === 'View') : [];
  const lectura = filas.map((f) => {
    const [punto, ...textos] = f.children.flat(Infinity).filter(Boolean);
    return { punto: plano(punto.props.style), nombre: textoDe(textos[0]), estiloNombre: plano(textos[0].props.style),
      cifra: textos[1] ? textoDe(textos[1]) : null, estiloCifra: textos[1] ? plano(textos[1].props.style) : null, noTraducirCifra: textos[1]?.props.noTraducir };
  });
  return { ui, arbol, todos, leyenda, filas: lectura };
}

/* Contraste WCAG entre dos colores #RRGGBB. */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('el dibujo de la portada no lleva ningún texto y se recorta al aro; el de Plataformas sigue igual', () => {
  // Con alto normal y con pantalla baja: la «bolita» de antes era justo la pantalla baja.
  for (const [opciones, props] of [[{}, {}], [{ alto: 664 }, { compacta: true }]]) {
    const { todos } = portada(opciones, props);
    const lienzos = todos.filter((n) => n.type === 'Svgdefault');
    assert.equal(lienzos.length, 2, 'el dibujo y la capa del barrido');
    for (const svg of lienzos) {
      assert.equal(nodos(svg).filter((n) => n.type === 'SvgText').length, 0, 'ni un rótulo dentro del radar');
      assert.equal(svg.props.viewBox, '43 43 254 254', 'el lienzo es el aro con sus marcas, sin márgenes para rótulos');
    }
    // El hexágono de la marca en el centro, como en la web.
    assert.ok(nodos(lienzos[0]).some((n) => n.type === 'SvgPath' && n.props.fill === tema.C.senal));
  }
  // Plataformas (no portada): los seis rótulos cortos y el viewBox de siempre.
  const ui = radar();
  const grande = nodos(ui.default({ datos: DATOS, onAbrir() {}, onFiltrar() {} }));
  assert.equal(grande.find((n) => n.type === 'Svgdefault').props.viewBox, '0 0 340 340');
  assert.equal(grande.filter((n) => n.type === 'SvgText').length, 6);
  assert.ok(!grande.some((n) => n.props?.accessibilityLabel?.startsWith?.('Plataformas por tipo de activo')), 'sin leyenda nueva en Plataformas');
});

test('la leyenda: seis filas en el orden del radar, con el color de cada tipo y cuántas plataformas hay', () => {
  const { leyenda, filas, ui } = portada();
  assert.ok(leyenda, 'hay leyenda al lado del radar');
  assert.deepEqual(filas.map((f) => f.nombre), ORDEN);
  assert.deepEqual(filas.map((f) => f.punto.backgroundColor), CATEGORIAS.map((c) => tema.COLOR_CATEGORIA[c]));
  assert.deepEqual(filas.map((f) => f.cifra), CATEGORIAS.map((c) => String(DATOS.filter((p) => p.categoria === c).length)));
  for (const f of filas) {
    assert.ok(f.punto.width >= 8 && f.punto.width <= 10 && f.punto.height === f.punto.width, 'punto de 8 a 10 px');
    assert.equal(f.estiloNombre.fontSize, 13, 'nombre a 13 px con alto normal');
    assert.equal(f.estiloCifra.fontFamily, tema.F.mono, 'la cifra en monoespaciada');
    assert.equal(f.estiloCifra.textAlign, 'right');
    assert.equal(f.noTraducirCifra, true);
  }
  // El orden es el del dibujo: desde arriba y en el sentido de las agujas.
  const puntos = ui.puntosRadar(DATOS);
  CATEGORIAS.forEach((c, i) => {
    for (const { x, y } of puntos.filter((p) => p.p.categoria === c)) {
      const ang = (Math.atan2(y - 170, x - 170) * 180) / Math.PI;
      const centro = -90 + i * 60;
      const d = ((ang - centro + 540) % 360) - 180;
      assert.ok(Math.abs(d) <= 30, `${c} está en el sector ${i + 1}`);
    }
  });
  // Pantalla baja: la leyenda sigue entera, a 12 px.
  const baja = portada({ alto: 664 }, { compacta: true });
  assert.deepEqual(baja.filas.map((f) => f.nombre), ORDEN);
  for (const f of baja.filas) assert.ok(f.estiloNombre.fontSize >= 12 && f.punto.width >= 8);
});

test('sin cifras (revisión vencida o sin comprobar) la leyenda va solo con los nombres', () => {
  for (const [opciones, datos] of [[{ sinCifras: true }, DATOS], [{}, []]]) {
    const ui = radar();
    const todos = nodos(ui.default({ datos, onAbrir() {}, onFiltrar() {}, portada: true, ...opciones }));
    const leyenda = todos.find((n) => n.type === 'View' && n.props.accessible && /^Plataformas por tipo de activo:/.test(n.props.accessibilityLabel || ''));
    assert.ok(leyenda);
    const textos = nodos(leyenda).filter((n) => n.type === 'Text').map(textoDe);
    assert.deepEqual(textos, ORDEN, 'seis nombres y ningún número');
    assert.doesNotMatch(leyenda.props.accessibilityLabel, /\d/);
  }
});

test('un tipo sin plataformas se queda con su «0» atenuado: siempre seis filas', () => {
  const sinMaterias = DATOS.filter((p) => p.categoria !== 'Materias primas');
  const ui = radar();
  const todos = nodos(ui.default({ datos: sinMaterias, onAbrir() {}, onFiltrar() {}, portada: true }));
  const leyenda = todos.find((n) => n.type === 'View' && n.props.accessible && /^Plataformas por tipo de activo:/.test(n.props.accessibilityLabel || ''));
  const filas = leyenda.children.flat(Infinity).filter((n) => n && n.type === 'View');
  assert.equal(filas.length, 6);
  const cifras = filas.map((f) => f.children.flat(Infinity).filter((n) => n && n.type === 'Text')[1]);
  const materias = cifras[ORDEN.indexOf('Materias primas')];
  assert.equal(textoDe(materias), '0');
  assert.equal(plano(materias.props.style).color, tema.C.tx3, 'el 0, atenuado');
  for (const c of cifras.filter((x) => x !== materias)) assert.equal(plano(c.props.style).color, tema.C.tx);
  assert.match(leyenda.props.accessibilityLabel, /Materias primas, 0/);
});

test('contraste AA del texto de la leyenda sobre el fondo de Inicio (medido)', () => {
  const { filas } = portada();
  const sinMaterias = DATOS.filter((p) => p.categoria !== 'Materias primas');
  const ui = radar();
  const cero = nodos(ui.default({ datos: sinMaterias, onAbrir() {}, onFiltrar() {}, portada: true }))
    .filter((n) => n.type === 'Text' && textoDe(n) === '0').map((n) => plano(n.props.style).color);
  assert.equal(cero.length, 1);
  const colores = new Set([...filas.flatMap((f) => [f.estiloNombre.color, f.estiloCifra.color]), ...cero]);
  for (const fondo of [tema.C.s0, tema.C.noche]) {
    for (const color of colores) {
      assert.match(color, /^#[0-9A-F]{6}$/i, 'el texto va en un color opaco');
      assert.ok(contraste(color, fondo) >= 4.5, `${color} sobre ${fondo}: ${contraste(color, fondo).toFixed(2)}:1`);
    }
  }
  // El color de cada tipo va en el punto, no en el texto.
  for (const f of filas) assert.notEqual(f.estiloNombre.color, f.punto.backgroundColor);
});

test('el lector de pantalla lee la leyenda una sola vez, entera y en el idioma elegido', () => {
  const { leyenda, filas } = portada();
  assert.equal(leyenda.props.accessible, true, 'un solo elemento: no lee fila a fila ni dos veces');
  assert.equal(leyenda.props.accessibilityLabel, etiqueta('Plataformas por tipo de activo', ORDEN));
  assert.equal(leyenda.props.idiomaOriginal, 'es-ES');
  // Los nombres ya están en el diccionario común (no hace falta añadir claves).
  for (const f of filas) assert.notEqual(idioma.ingles(f.nombre), f.nombre, `falta el inglés de ${f.nombre}`);
  assert.notEqual(idioma.ingles('Plataformas por tipo de activo'), 'Plataformas por tipo de activo');
  idioma.cambiarIdioma('en');
  try {
    const en = portada();
    assert.equal(en.leyenda.props.accessibilityLabel, etiqueta('Platforms by asset type', ORDEN.map((n) => idioma.ingles(n))));
    assert.match(en.leyenda.props.accessibilityLabel, /^Platforms by asset type: Property, \d+; Credit, \d+; Treasury, \d+; Equities, \d+; Commodities, \d+; Infrastructure, \d+$/);
    assert.equal(en.leyenda.props.idiomaOriginal, 'en-US');
  } finally { idioma.cambiarIdioma('es'); }
});

test('con React y react-native-web reales: la leyenda es texto de verdad, traducido, y el SVG sigue sin texto', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const RNW = require('react-native-web');
  const absoluto = path.join(RAIZ, 'componentes', 'Radar.js');
  const svg = { __esModule: true };
  for (const [n, tag] of Object.entries({ default: 'svg', Circle: 'circle', Defs: 'defs', G: 'g', Line: 'line', Path: 'path', RadialGradient: 'radialGradient', Stop: 'stop', Text: 'text' })) {
    svg[n] = ({ children, ...p }) => React.createElement(tag, tag === 'svg' ? { ...p, 'aria-hidden': true } : p, children);
  }
  const nativo = { ...RNW, useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }) };
  const original = Module._load, extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(React, nativo);
      if (pedido === 'react-native') return nativo;
      if (pedido === 'react-native-svg') return svg;
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/verificacion-local') return { etiquetaEstadoVerificacionLocal: () => 'Sin comprobar' };
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    modulo._compile(babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] }).code, ruta);
  };
  delete require.cache[absoluto];
  let Radar;
  try { Radar = require(absoluto).default; } finally { Module._load = original; Module._extensions['.js'] = extension; }
  const pintar = () => renderToStaticMarkup(React.createElement(Radar, { datos: DATOS, portada: true, onAbrir() {}, onFiltrar() {} }));
  const es = pintar();
  assert.doesNotMatch(es.slice(es.indexOf('<svg'), es.lastIndexOf('</svg>')), /<text/);
  const visibles = (html) => [...html.matchAll(/<div[^>]*dir="auto"[^>]*>([^<]+)<\/div>/g)].map((m) => m[1]);
  assert.deepEqual(visibles(es), ORDEN.flatMap((n, i) => [n, String(cuenta(CATEGORIAS[i]))]));
  idioma.cambiarIdioma('en');
  try {
    const en = pintar();
    assert.deepEqual(visibles(en), ORDEN.flatMap((n, i) => [idioma.ingles(n), String(cuenta(CATEGORIAS[i]))]));
    assert.deepEqual(visibles(en).filter((_, i) => i % 2 === 0), ['Property', 'Credit', 'Treasury', 'Equities', 'Commodities', 'Infrastructure']);
    assert.match(en, /aria-label="Platforms by asset type: Property, \d+;/);
  } finally { idioma.cambiarIdioma('es'); }
});

test('de 320 a 767 px de ancho nada se sale ni se monta, y el bloque no pasa de la altura de antes', () => {
  const ui = radar();
  const nombres = { es: ORDEN, en: ORDEN.map((n) => idioma.ingles(n)) };
  for (let ancho = 320; ancho <= 767; ancho++) {
    for (const compacta of [false, true]) {
      for (const fontScale of [1, 1.3]) {
        for (const [lengua, lista] of Object.entries(nombres)) {
          for (const digitos of [0, 1, 2]) {
            const m = ui.medidasPortada({ ancho, fontScale, compacta, nombres: lista, digitos });
            const caso = `${ancho} px, ${compacta ? 'baja' : 'normal'}, letra ${fontScale}, ${lengua}, ${digitos} cifras`;
            assert.ok(m.ancho <= ancho - 32, `${caso}: mide ${m.ancho} y caben ${ancho - 32}`);
            assert.equal(m.apilada, false, `${caso}: radar y leyenda lado a lado`);
            // Con el relleno de Inicio (4 + 4 en alto normal): 176 y 124 como antes, ±8.
            assert.ok(m.alto + (compacta ? 0 : 8) <= (compacta ? 128 : 184), `${caso}: el bloque mide ${m.alto}`);
            assert.ok(m.altoLeyenda <= m.alto + 1e-9);
            if (fontScale === 1) {
              if (compacta) assert.ok(m.diametro >= 112 && m.diametro <= 120, `${caso}: aro de ${m.diametro.toFixed(1)} px`);
              else if (ancho >= 360) assert.ok(m.diametro >= 148 && m.diametro <= 160, `${caso}: aro de ${m.diametro.toFixed(1)} px`);
            }
          }
        }
      }
    }
  }
  // Con letra enorme en un móvil estrecho, la leyenda pasa debajo: tampoco se sale, y el
  // radar se queda pequeño (112) para no gastar alto antes del titular (antes, 168: 404 px de bloque).
  const enorme = ui.medidasPortada({ ancho: 320, fontScale: 2, nombres: ORDEN, digitos: 1 });
  assert.equal(enorme.apilada, true);
  assert.ok(enorme.ancho <= 288 && enorme.lado <= 112, `lado ${enorme.lado}`);
  assert.ok(ui.medidasPortada({ ancho: 360, fontScale: 2, compacta: true, nombres: ORDEN, digitos: 1 }).lado <= 112);
  // El punto de color crece con la letra del sistema (hasta 1,5 veces), no se queda en 9 junto a un texto de 26.
  assert.equal(ui.medidasPortada({ ancho: 390, nombres: ORDEN, digitos: 1 }).punto, 9);
  assert.equal(ui.medidasPortada({ ancho: 390, compacta: true, nombres: ORDEN, digitos: 1 }).punto, 8);
  assert.equal(ui.medidasPortada({ ancho: 412, fontScale: 1.3, nombres: ORDEN, digitos: 1 }).punto, 12);
  assert.equal(enorme.punto, 14);
  // Y el componente usa esas medidas, con la letra del sistema: el lienzo mide `lado`,
  // el punto, `punto`, y la leyenda va al lado (o debajo, con letra enorme).
  for (const [ancho, compacta, fontScale] of [[320, false, 1], [390, false, 1], [360, true, 1], [320, false, 1.3], [360, true, 1.3], [320, false, 2]]) {
    const { todos, filas, ui: u } = portada({ ancho, fontScale }, { compacta });
    const m = u.medidasPortada({ ancho, compacta, fontScale, nombres: ORDEN, digitos: 1 });
    const lienzo = todos.find((n) => n.type === 'Svgdefault');
    assert.equal(lienzo.props.width, m.lado, `${ancho}, letra ${fontScale}: lienzo de ${m.lado}`);
    assert.ok(filas.every((f) => f.punto.width === m.punto), `${ancho}, letra ${fontScale}: punto de ${m.punto}`);
    assert.equal(plano(todos[0].props.style).flexDirection, m.apilada ? 'column' : 'row');
    assert.equal(plano(todos[0].props.style).gap, m.hueco);
  }
  // A 320 px la letra al 130 % encoge el radar para que quepa la leyenda entera (sin partir «Materias primas»).
  assert.ok(ui.medidasPortada({ ancho: 320, fontScale: 1.3, nombres: ORDEN, digitos: 1 }).lado
    < ui.medidasPortada({ ancho: 320, fontScale: 1, nombres: ORDEN, digitos: 1 }).lado);
});

test('las dianas de la portada caen sobre su punto y cada toque abre su plataforma', () => {
  for (const ancho of [320, 360, 390, 412]) {
    for (const compacta of [false, true]) {
      const { todos, ui } = portada({ ancho }, { compacta });
      let abierta;
      const arbol = ui.default({ datos: DATOS, portada: true, compacta, onAbrir: (p) => { abierta = p; }, onFiltrar() {} });
      const dianas = nodos(arbol).filter((n) => n.type === 'Pressable' && n.props.style?.[0] === ui.estilos.diana);
      assert.equal(dianas.length, DATOS.length);
      const lado = todos.find((n) => n.type === 'Svgdefault').props.width;
      const k = lado / 254;
      const puntos = ui.puntosRadar(DATOS);
      dianas.forEach((d, i) => {
        const { left, top } = d.props.style[1];
        const cx = left + 22, cy = top + 22;
        // El centro de la diana es el punto pintado (el lienzo empieza en 43, 43 del viewBox).
        assert.ok(Math.abs(cx - (puntos[i].x - 43) * k) < 1e-9 && Math.abs(cy - (puntos[i].y - 43) * k) < 1e-9, `${ancho}: ${DATOS[i].slug}`);
        assert.ok(cx > 0 && cx < lado && cy > 0 && cy < lado, 'el punto está dentro del lienzo');
        const nativeEvent = { locationX: 22, locationY: 22, changedTouches: [{ identifier: 1 }], touches: [] };
        d.props.onPress({ type: 'responderRelease', nativeEvent });
        assert.equal(abierta.slug, DATOS[i].slug);
      });
    }
  }
});

test('con «reducir movimiento» el barrido de la portada se queda quieto; si no, gira', () => {
  const antes = tema.MOV.reducir;
  try {
    tema.MOV.reducir = true;
    let ui = radar({ efectos: true });
    ui.default({ datos: DATOS, portada: true, onAbrir() {}, onFiltrar() {} });
    assert.equal(ui.giro.arranques, 0, 'no arranca el giro');
    assert.deepEqual(ui.giro.valores, [['inicial', 1 - 38 / 360], ['fijo', 1 - 38 / 360]], 'quieto desde el primer fotograma, como la web');
    tema.MOV.reducir = false;
    ui = radar({ efectos: true });
    ui.default({ datos: DATOS, portada: true, onAbrir() {}, onFiltrar() {} });
    assert.equal(ui.giro.arranques, 1);
  } finally { tema.MOV.reducir = antes; }
});

/* Un React mínimo con estado y efectos de verdad (con sus dependencias y su
   limpieza): basta para montar el radar y volver a pintarlo cuando cambia. */
function reactConEstado() {
  const ranuras = [], efectos = [];
  let i = 0, pendientes = [], sucio = false;
  const react = {
    createElement,
    useRef: (v) => { const k = i++; if (!(k in ranuras)) ranuras[k] = { current: v }; return ranuras[k]; },
    useState: (v) => {
      const k = i++; if (!(k in ranuras)) ranuras[k] = typeof v === 'function' ? v() : v;
      return [ranuras[k], (n) => { const nuevo = typeof n === 'function' ? n(ranuras[k]) : n; if (!Object.is(nuevo, ranuras[k])) { ranuras[k] = nuevo; sucio = true; } }];
    },
    useMemo: (fn, deps) => {
      const k = i++; const antes = ranuras[k];
      if (antes && deps && deps.every((d, x) => Object.is(d, antes.deps[x]))) return antes.valor;
      ranuras[k] = { deps, valor: fn() }; return ranuras[k].valor;
    },
    useEffect: (fn, deps) => {
      const k = i++; const antes = efectos[k];
      if (antes && deps && deps.every((d, x) => Object.is(d, antes.deps[x]))) return;
      pendientes.push(() => { antes?.limpiar?.(); efectos[k] = { deps, limpiar: fn() }; });
    },
  };
  let arbol = null;
  const pintar = (Componente, props) => {
    do { sucio = false; i = 0; pendientes = []; arbol = Componente(props); for (const fn of pendientes) fn(); } while (sucio);
    return arbol;
  };
  return { react, pintar, sucio: () => sucio };
}

test('al quitar «reducir movimiento» con la app abierta el barrido vuelve a dar la vuelta entera, con sus ecos', async () => {
  const antes = tema.MOV.reducir;
  tema.MOV.reducir = false;
  let oyente = null;
  const accesibilidad = {
    isReduceMotionEnabled: () => Promise.resolve(true),
    addEventListener: (nombre, fn) => { assert.equal(nombre, 'reduceMotionChanged'); oyente = fn; return { remove() { oyente = null; } }; },
  };
  try {
    const r = reactConEstado();
    const ui = radar({ react: r.react, accesibilidad });
    const props = { datos: DATOS, portada: true, onAbrir() {}, onFiltrar() {} };
    const ecos = (arbol) => nodos(arbol).filter((n) => n.type === 'AnimatedView' && n.props.pointerEvents === 'none' && plano(n.props.style).position === 'absolute');
    let arbol = r.pintar(ui.default, props);
    assert.deepEqual(ui.giro.registro, [['fijo', 0], ['arranque', 0]], 'sin reducir movimiento, gira desde 0');
    assert.equal(ecos(arbol).length, DATOS.length, 'un eco por punto');
    // El sistema contesta que sí: se para y se queda quieto a -38°, sin ecos.
    await new Promise((listo) => setImmediate(listo));
    arbol = r.pintar(ui.default, props);
    assert.deepEqual(ui.giro.registro.slice(2), [['parada'], ['fijo', 1 - 38 / 360]]);
    assert.equal(ecos(arbol).length, 0, 'con reducir movimiento, sin ecos');
    assert.equal(typeof oyente, 'function', 'escucha los cambios del ajuste');
    // Y al quitarlo con la app abierta, vuelve a girar desde 0, no desde el valor quieto
    // (el bucle nativo repetiría cada vuelta desde 322°: solo 38° de recorrido).
    oyente(false);
    arbol = r.pintar(ui.default, props);
    assert.deepEqual(ui.giro.registro.slice(4), [['fijo', 0], ['arranque', 0]]);
    assert.equal(ecos(arbol).length, DATOS.length);
    // Y si lo vuelve a poner, se para otra vez.
    oyente(true);
    r.pintar(ui.default, props);
    assert.deepEqual(ui.giro.registro.slice(6), [['parada'], ['fijo', 1 - 38 / 360]]);
  } finally { tema.MOV.reducir = antes; }
});

test('los ecos: uno por punto, en su sitio, sin toques, y se encienden cuando pasa el barrido (como en la web)', () => {
  const { todos, ui } = portada();
  const lado = todos.find((n) => n.type === 'Svgdefault').props.width, k = lado / 254;
  const puntos = ui.puntosRadar(DATOS);
  const ecos = todos.filter((n) => n.type === 'AnimatedView' && plano(n.props.style).position === 'absolute' && n.props.pointerEvents === 'none');
  assert.equal(ecos.length, DATOS.length);
  // Van antes del dibujo (debajo): el punto queda encima de su eco.
  const lienzo = todos.find((n) => n.type === 'View' && n.children.flat(Infinity).some((x) => x && x.type === 'Svgdefault'));
  const hijos = lienzo.children.flat(Infinity).filter(Boolean);
  assert.ok(hijos.indexOf(ecos[0]) < hijos.findIndex((x) => x.type === 'Svgdefault'), 'los ecos, debajo del dibujo');
  ecos.forEach((eco, i) => {
    const st = plano(eco.props.style);
    assert.ok(Math.abs(st.left + st.width / 2 - (puntos[i].x - 43) * k) < 1e-9 && Math.abs(st.top + st.height / 2 - (puntos[i].y - 43) * k) < 1e-9, 'centrado en su punto');
    assert.equal(st.backgroundColor, puntos[i].color);
    assert.ok(Math.abs(st.width - 2 * 13.1 * k) < 1e-9 && st.borderRadius === st.width / 2);
    // La opacidad y la escala salen del giro del barrido (un solo bucle), con su tramo.
    assert.equal(st.opacity.interpolacion.extrapolate, 'clamp');
    assert.deepEqual(st.opacity.interpolacion.inputRange, ui.rangosEco(ui.faseEco(puntos[i].x, puntos[i].y)).inputRange);
  });
  // El tramo: apagado hasta que pasa el barrido; entonces 0,8 y 4,4/13,1 de escala; a 0 tras el 20 % de la vuelta.
  const valor = (r, salida, g) => { const x = r.inputRange; for (let j = 1; j < x.length; j++) if (g <= x[j]) return salida[j - 1] + ((g - x[j - 1]) / (x[j] - x[j - 1])) * (salida[j] - salida[j - 1]); return salida.at(-1); };
  for (const f of [0, 0.25, 0.5, 0.79, 0.8, 0.9, 0.999]) {
    const r = ui.rangosEco(f);
    for (let j = 1; j < r.inputRange.length; j++) assert.ok(r.inputRange[j] > r.inputRange[j - 1], `${f}: entradas crecientes, sin repetir`);
    assert.deepEqual([r.inputRange[0], r.inputRange.at(-1)], [0, 1]);
    for (let g = 0; g <= 1; g += 0.001) {
      const edad = (((g - f) % 1) + 1) % 1;
      if (Math.min(Math.abs(g - f), 1 - Math.abs(g - f)) < 0.001) continue; // el salto de 4 ms
      const esperada = edad < 0.2 ? 0.8 * (1 - edad / 0.2) : 0;
      assert.ok(Math.abs(valor(r, r.opacidad, g) - esperada) < 1e-6, `${f} a ${g.toFixed(3)}: opacidad ${valor(r, r.opacidad, g)} y no ${esperada}`);
      if (edad < 0.2) assert.ok(Math.abs(valor(r, r.escala, g) - (4.4 + 8.7 * edad / 0.2) / 13.1) < 1e-6, `${f} a ${g.toFixed(3)}: escala`);
    }
  }
  // La fase es el ángulo del punto en la pantalla: el barrido empieza a la derecha y gira como las agujas.
  assert.equal(ui.faseEco(170 + 10, 170), 0);
  assert.equal(ui.faseEco(170, 170 + 10), 0.25);
  assert.equal(ui.faseEco(170, 170 - 10), 0.75);
  // En el radar de Plataformas, sin ecos.
  const grande = nodos(radar().default({ datos: DATOS, onAbrir() {}, onFiltrar() {} }));
  assert.equal(grande.filter((n) => n.type === 'AnimatedView' && n.props.pointerEvents === 'none' && plano(n.props.style).position === 'absolute').length, 0);
});

test('Inicio pinta el radar con su leyenda: sin rótulos dentro ni tamaños 120/176 a mano', () => {
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes', 'Inicio.js'), 'utf8');
  assert.match(inicio, /<Radar datos=\{plataformas\} portada compacta=\{compacta\} sinCifras=\{!cifras\.vigente\}/);
  assert.match(inicio, /onAbrir=\{\(p\) => onAbrirPlataforma\?\.\(p\)\}/, 'tocar un punto sigue abriendo su plataforma');
  assert.doesNotMatch(inicio, /sinRotulos|tamano=\{compacta/);
  assert.match(inicio, /const compacta = altoPantalla < 700;/, 'la misma condición de pantalla baja');
  const fuenteRadar = fs.readFileSync(path.join(RAIZ, 'componentes', 'Radar.js'), 'utf8');
  assert.doesNotMatch(fuenteRadar, /MARGEN_PORTADA|sinRotulos|CORTO_PORTADA\[c\]/);
  // La altura del bloque ya no se fija a mano: la da el radar (168 + 4 + 4 = 176; en pantalla baja, 124).
  assert.doesNotMatch(inicio, /radarCaja: \{[^}]*minHeight/);
  assert.match(inicio, /radarCaja: \{ position: 'relative', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 \}/);
  assert.match(inicio, /radarCajaBaja: \{ paddingVertical: 0 \}/);
});
