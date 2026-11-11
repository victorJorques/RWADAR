'use strict';

/* «Calcula tus números» en la app (11/11/2026): CalculadoraInicio con React
   aislado (como las pruebas de «Mercado y noticias»), su sitio en Inicio y el
   enlace desde el explicador. Las cuentas se prueban en calculadora.test.cjs. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const { soporteIdioma } = require('./soporte-idioma.cjs');
const idioma = require('../lib/idioma');
const M = require('../lib/calculadora');
const en = require('../lib/idioma-en');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...r) => fs.readFileSync(path.join(RAIZ, ...r), 'utf8');
const nb = (s) => s.replace(/(\d) (€|%)/g, '$1 $2');

const colores = new Proxy({}, { get: (_, clave) => `#${String(clave)}` });
const tema = { C: colores, F: new Proxy({}, { get: (_, c) => String(c) }), T: { seccion: {}, menor: {}, etiqueta: {}, instrumento: {}, cuerpo: {}, dato: {} },
  R: { s: 8, m: 12, l: 16, p: 999 }, UI: { margen: 16, tactil: 48 }, pulsado: () => ({}) };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (typeof arbol !== 'object') return [arbol];
  return [arbol, ...nodos(arbol.children), ...nodos(arbol.props?.children)];
}
const textoDe = (arbol) => nodos(arbol).filter((n) => typeof n === 'string' || typeof n === 'number').join(' ');
const porId = (arbol, id) => nodos(arbol).find((n) => n?.props?.testID === id);
function crearReact() {
  const slots = []; const efectos = []; let indice = 0;
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
      if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
    },
    useRef(inicial) { const i = indice++; if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial }; return slots[i]; },
    useCallback(fn) { indice++; return fn; },
    useMemo(fn) { indice++; return fn(); },
    useEffect(fn) { const i = indice++; if (!Object.hasOwn(slots, i)) { slots[i] = true; efectos.push(fn); } },
  };
  return { react, pintar(componente, props) { indice = 0; const arbol = componente(props); for (const fn of efectos.splice(0)) fn(); return arbol; } };
}
function cargarCalculadora(react, plataforma = 'android') {
  const absoluto = path.join(RAIZ, 'componentes', 'CalculadoraInicio.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Platform: { OS: plataforma, select: (o) => o[plataforma] ?? o.default },
    AccessibilityInfo: { announceForAccessibility() {} } };
  for (const tipo of ['Text', 'View', 'Pressable', 'TextInput', 'ScrollView', 'Image']) nativo[tipo] = tipo;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === 'react-native-svg') return { __esModule: true, default: 'Svg', Line: 'Line', Rect: 'Rect', Text: 'SvgText' };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { eleccion() {}, abrir() {} } };
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
const entradas = (arbol) => nodos(arbol).filter((n) => n?.type === 'TextInput');
const entrada = (arbol, campo) => porId(arbol, `calc-${campo}`);

/* Las ofertas del catálogo publicado (las mismas que ya tiene la app). */
const EMI = (() => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8') + ';globalThis.__EMI=EMI;', ctx);
  return JSON.parse(JSON.stringify(ctx.__EMI));
})();
const VERIFICADA = EMI.find((o) => o.coleccion === 'principales' && o.estadoRevision === 'actual').verificadaEl;
const AHORA = () => new Date(VERIFICADA + 'T12:00:00Z');

function montar(props = {}, plataforma) {
  const { react, pintar } = crearReact();
  const Calc = cargarCalculadora(react, plataforma).default;
  const llamadas = { desplazar: [], flotante: [], abrir: [] };
  // onFlotante es el setState de Inicio: acepta un valor o una función.
  let flotante = null;
  const base = { ofertas: EMI, catalogoVigente: true, ahora: AHORA,
    onDesplazar: (y) => llamadas.desplazar.push(y), onAbrirOferta: (o) => llamadas.abrir.push(o),
    onFlotante: (x) => { flotante = typeof x === 'function' ? x(flotante) : x; llamadas.flotante.push(flotante); }, ...props };
  return { llamadas, pintar: () => pintar(Calc, base) };
}

test('app · por defecto: el ejemplo editable (1.000 €, 4 %, 5 años) y el resultado arriba, grande y anunciado', () => {
  const { pintar } = montar();
  pintar();
  const arbol = pintar();
  const texto = textoDe(arbol);
  const resultado = porId(arbol, 'calc-resultado');
  assert.ok(resultado, 'el resultado');
  assert.equal(resultado.props.accessibilityLiveRegion, 'polite');
  assert.equal(textoDe(resultado), nb('Cobrarías unos 32,40 € al año (2,70 € al mes) Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya con impuestos.'));
  assert.equal(resultado.props.accessibilityLabel, nb('Cobrarías unos 32,40 € al año (2,70 € al mes). Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya con impuestos.'));
  assert.match(texto, /Calcula tus números/);
  assert.match(texto, /Ejemplo: cámbialo/);
  assert.match(texto, /Simulación con tus números: no es una previsión ni una oferta\. La rentabilidad pasada no garantiza la futura y puedes perder dinero\./);
  // El resultado va antes que los campos.
  const orden = nodos(arbol).filter((n) => n?.props?.testID);
  assert.ok(orden.findIndex((n) => n.props.testID === 'calc-resultado') < orden.findIndex((n) => n.props.testID === 'calc-inversion'));
  // Tres campos de escritura libre, con su teclado; «Afinar» empieza plegado.
  const campos = entradas(arbol);
  assert.deepEqual(campos.map((n) => n.props.testID), ['calc-inversion', 'calc-rentabilidad', 'calc-anios']);
  assert.deepEqual(campos.map((n) => n.props.value), ['1.000', '4', '5']);
  assert.deepEqual(campos.map((n) => n.props.keyboardType), ['decimal-pad', 'numeric', 'number-pad']);
  assert.deepEqual(campos.map((n) => n.props.accessibilityLabel), ['Lo que inviertes, en euros', 'Rentabilidad al año, en porcentaje', 'Años']);
  assert.ok(campos.every((n) => n.props.selectTextOnFocus && n.props.autoCorrect === false));
  assert.equal(porId(arbol, 'calc-afinar').props.accessibilityState.expanded, false);
  assert.match(porId(arbol, 'calc-afinar').props.accessibilityLabel, /Afinar: comisiones e impuestos\. sin comisiones · impuestos 19\s%/);
  // El modo: un grupo de dos opciones, «Lo cobro» marcado (con ✓, no solo color).
  const radios = nodos(arbol).filter((n) => n?.props?.accessibilityRole === 'radio');
  assert.deepEqual(radios.map((n) => [n.props.accessibilityLabel, n.props.accessibilityState.checked]), [['Lo cobro', true], ['Lo reinvierto', false]]);
  assert.match(textoDe(radios[0]), /✓\s+Lo cobro/);
  // Importes rápidos de 500 a 10.000 €.
  assert.deepEqual(nodos(arbol).filter((n) => /^calc-rapido-/.test(n?.props?.testID || '')).map((n) => n.props.accessibilityLabel),
    ['Poner 500 €', 'Poner 1.000 €', 'Poner 5.000 €', 'Poner 10.000 €'].map(nb));
});

test('app · con tus números: 25.000 € al 6,5 % durante 10 años, reinvirtiendo; sin «Ejemplo» y con la cuenta paso a paso', () => {
  const { pintar } = montar();
  let arbol = pintar();
  entrada(arbol, 'inversion').props.onChangeText('25.000');
  entrada(arbol, 'rentabilidad').props.onChangeText('6,5');
  entrada(arbol, 'anios').props.onChangeText('10');
  arbol = pintar();
  porId(arbol, 'calc-modo-reinvertir').props.onPress();
  arbol = pintar();
  const resultado = porId(arbol, 'calc-resultado');
  assert.equal(textoDe(resultado), nb('Al cabo de 10 años tendrías unos 42.762 € Ganancia neta: 17.762,03 €, como un 5,5 % al año, ya con impuestos.'));
  assert.doesNotMatch(textoDe(arbol), /Ejemplo: cámbialo/);
  assert.equal(porId(arbol, 'calc-modo-reinvertir').props.accessibilityState.checked, true);
  // La cuenta: plegada; al abrirla, los pasos del motor y la nota de los impuestos.
  assert.doesNotMatch(textoDe(arbol), /No hay nada escondido/);
  porId(arbol, 'calc-cuenta').props.onPress();
  arbol = pintar();
  const texto = textoDe(arbol);
  assert.equal(porId(arbol, 'calc-cuenta').props.accessibilityState.expanded, true);
  assert.match(texto, /No hay nada escondido: es la misma cuenta que harías con un papel\./);
  const r = M.calcular(M.validarEntradas({ inversion: '25.000', rentabilidad: '6,5', anios: '10', modo: 'reinvertir', impuestos: '19', comisionAnual: '0', comisionEntrada: '0' }));
  for (const p of M.pasos(r)) { assert.ok(texto.includes(p.op), p.op); assert.ok(texto.includes(p.res), p.res); }
  assert.ok(texto.includes(M.notaImpuestos('reinvertir')));
  // Al salir del campo, la cifra con su formato y sin cambiar su valor.
  entrada(arbol, 'inversion').props.onChangeText('30000');
  arbol = pintar();
  entrada(arbol, 'inversion').props.onBlur();
  arbol = pintar();
  assert.equal(entrada(arbol, 'inversion').props.value, '30.000');
});

test('app · un dato fuera de los límites: el mensaje junto al campo y ninguna cifra (ni NaN), ni gráfico ni cuenta', () => {
  const { pintar } = montar();
  let arbol = pintar();
  entrada(arbol, 'inversion').props.onChangeText('0');
  entrada(arbol, 'anios').props.onChangeText('2,5');
  arbol = pintar();
  const texto = textoDe(arbol);
  assert.equal(textoDe(porId(arbol, 'calc-resultado')), 'Revisa los datos marcados para ver el resultado.');
  assert.ok(texto.includes(nb('Pon entre 1 € y 10.000.000 €.')));
  assert.ok(texto.includes('Pon un número entero de años, de 1 a 40.'));
  assert.equal(entrada(arbol, 'inversion').props.accessibilityHint, nb('Pon entre 1 € y 10.000.000 €.'));
  assert.doesNotMatch(texto, /NaN|Infinity|undefined/);
  assert.ok(!nodos(arbol).some((n) => n?.type === 'Svg'));
  assert.equal(porId(arbol, 'calc-cuenta'), undefined);
  // Un error dentro de «Afinar» lo deja abierto.
  entrada(arbol, 'inversion').props.onChangeText('1.000');
  entrada(arbol, 'anios').props.onChangeText('5');
  arbol = pintar();
  assert.equal(porId(arbol, 'calc-afinar').props.accessibilityState.expanded, false);
  porId(arbol, 'calc-afinar').props.onPress();
  arbol = pintar();
  entrada(arbol, 'impuestos').props.onChangeText('80');
  porId(arbol, 'calc-afinar').props.onPress();
  arbol = pintar();
  assert.equal(porId(arbol, 'calc-afinar').props.accessibilityState.expanded, true);
  assert.ok(textoDe(arbol).includes(nb('Pon entre 0 % y 50 %.')));
});

test('app · importes rápidos y «Afinar»: rellenan el campo; comisiones, impuestos, activo y precio dan su parte y sus participaciones', () => {
  const { pintar } = montar();
  let arbol = pintar();
  porId(arbol, 'calc-rapido-5000').props.onPress();
  arbol = pintar();
  assert.equal(entrada(arbol, 'inversion').props.value, '5.000');
  porId(arbol, 'calc-afinar').props.onPress();
  arbol = pintar();
  assert.deepEqual(entradas(arbol).map((n) => n.props.testID), ['calc-inversion', 'calc-rentabilidad', 'calc-anios', 'calc-comisionAnual',
    'calc-comisionEntrada', 'calc-impuestos', 'calc-valorActivo', 'calc-precioParticipacion']);
  assert.equal(entrada(arbol, 'impuestos').props.value, '19');
  assert.equal(entrada(arbol, 'valorActivo').props.placeholder, '300.000');
  assert.ok(textoDe(arbol).includes('En España, la ganancia del ahorro tributa del 19 % al 30 % según cuánto ganes.'));
  entrada(arbol, 'valorActivo').props.onChangeText('300.000');
  entrada(arbol, 'precioParticipacion').props.onChangeText('100');
  arbol = pintar();
  porId(arbol, 'calc-cuenta').props.onPress();
  arbol = pintar();
  const texto = textoDe(arbol);
  assert.ok(texto.includes(nb('Participaciones de 100 € que compras')) && texto.includes(nb('50 (5.000 €)')));
  assert.ok(texto.includes(nb('Parte del activo de 300.000 € que es tuya (50 de 3.000)')) && texto.includes(nb('1,67 %')));
  assert.match(porId(arbol, 'calc-afinar').props.accessibilityLabel, /activo 300\.000\s€ · participación 100\s€/);
});

test('app · «Usa la rentabilidad de una oferta»: las del catálogo, con su %, su fecha, «en dólares» y su ficha; el chip rellena la rentabilidad', () => {
  const { pintar, llamadas } = montar();
  let arbol = pintar();
  const lista = M.ofertasConRentabilidad(EMI, { ahora: AHORA() });
  assert.ok(lista.length > 0);
  const chips = nodos(arbol).filter((n) => /^calc-oferta-/.test(n?.props?.testID || ''));
  assert.deepEqual(chips.map((n) => n.props.testID.slice(12)), lista.map((o) => o.slug));
  assert.deepEqual(chips.map((n) => n.props.accessibilityLabel), lista.map((o) => M.etiquetaOferta(o)));
  for (const o of lista) {
    const chip = porId(arbol, `calc-oferta-${o.slug}`);
    assert.ok(textoDe(chip).includes(M.porcentaje(o.rentabilidad, 'es', 2)) && textoDe(chip).includes(M.fechaCorta(o.fecha)));
    assert.equal(/en dólares/.test(textoDe(chip)), o.enDolares, o.slug);
  }
  const of = lista[0];
  porId(arbol, `calc-oferta-${of.slug}`).props.onPress();
  arbol = pintar();
  assert.equal(entrada(arbol, 'rentabilidad').props.value, M.valorCampo(of.rentabilidad, 'es', 'rentabilidad'));
  assert.equal(porId(arbol, `calc-oferta-${of.slug}`).props.accessibilityState.selected, true);
  assert.ok(textoDe(arbol).includes(M.notaOferta(of)));
  // Si se cambia la cifra a mano, el chip deja de estar marcado.
  entrada(arbol, 'rentabilidad').props.onChangeText('5');
  arbol = pintar();
  assert.equal(porId(arbol, `calc-oferta-${of.slug}`).props.accessibilityState.selected, false);
  // «Ficha →» abre la ficha de esa oferta (el objeto del catálogo de la app).
  porId(arbol, `calc-ficha-${of.slug}`).props.onPress();
  assert.equal(llamadas.abrir[0].slug, of.slug);
  assert.equal(porId(arbol, `calc-ficha-${of.slug}`).props.accessibilityRole, 'link');
  // Sin catálogo vigente (o sin ofertas con cifra), el bloque no sale y nada se rompe.
  for (const props of [{ catalogoVigente: false }, { ofertas: [] }, { ofertas: null }]) {
    const otro = montar(props);
    const a = otro.pintar();
    assert.equal(porId(a, 'calc-ofertas'), undefined);
    assert.match(textoDe(porId(a, 'calc-resultado')), /Cobrarías unos 32,40/);
  }
});

test('app · el minigráfico: una barra por año (lo que pones y lo ganado), la cifra final y una frase para el lector de pantalla', () => {
  const { pintar } = montar();
  let arbol = pintar();
  for (const n of nodos(arbol)) if (n?.props?.onLayout && n.type === 'View' && !n.props.testID) n.props.onLayout({ nativeEvent: { layout: { width: 326, height: 150, y: 0 } } });
  arbol = pintar();
  const svg = nodos(arbol).find((n) => n?.type === 'Svg');
  assert.ok(svg, 'el gráfico');
  assert.equal(svg.props.width, 326);
  const rects = nodos(svg).filter((n) => n?.type === 'Rect');
  assert.equal(rects.length, 10, '5 años × (lo que pones + lo ganado)');
  assert.equal(rects.filter((n) => n.props.fill === '#senal').length, 5);
  assert.ok(nodos(svg).some((n) => n?.type === 'Line' && n.props.strokeDasharray === '3 4'), 'la línea de puntos de lo que pones');
  const rotulos = nodos(svg).filter((n) => n?.type === 'SvgText').map((n) => textoDe(n.children));
  assert.deepEqual(rotulos, [nb('1.162 €'), 'Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5']);
  const figura = nodos(arbol).find((n) => n?.props?.accessibilityRole === 'image');
  const r = M.calcular(M.validarEntradas({ inversion: '1000', rentabilidad: '4', anios: '5', impuestos: '19' }));
  assert.equal(figura.props.accessibilityLabel, M.descripcionBarras(r));
  assert.match(textoDe(arbol), /Lo que pones .*Lo ganado, neto/);
});

test('app · el teclado no tapa el resultado: arriba, Inicio sube hasta él; en «Afinar», va arriba en pequeño', () => {
  const { pintar, llamadas } = montar();
  let arbol = pintar();
  porId(arbol, 'calc-resultado').props.onLayout({ nativeEvent: { layout: { y: 60, width: 358, height: 120 } } });
  entrada(arbol, 'rentabilidad').props.onFocus();
  assert.deepEqual(llamadas.desplazar, [52]);
  assert.equal(llamadas.flotante.at(-1), null);
  porId(arbol, 'calc-afinar').props.onPress();
  arbol = pintar();
  entrada(arbol, 'impuestos').props.onFocus();
  assert.deepEqual(llamadas.flotante.at(-1), { campo: 'impuestos', signo: 'gana', titular: nb('Cobrarías unos 32,40 € al año (2,70 € al mes)'),
    detalle: nb('Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya con impuestos.') });
  assert.equal(llamadas.desplazar.length, 1, 'en «Afinar» no se sube: el campo se queda junto al teclado');
  entrada(arbol, 'impuestos').props.onBlur();
  assert.equal(llamadas.flotante.at(-1), null);
  // El resultado en pequeño: lo que dice el resultado, oculto al lector (que ya oye el de arriba).
  const { react, pintar: p2 } = crearReact();
  const { ResultadoFlotante } = cargarCalculadora(react);
  assert.equal(p2(ResultadoFlotante, { estado: null }), null);
  const flot = p2(ResultadoFlotante, { estado: { titular: 'Cobrarías unos 30 € al año', detalle: 'Ganancia', signo: 'gana' } });
  assert.equal(flot.props.testID, 'calc-flotante');
  assert.equal(flot.props.style.pointerEvents, 'none', 'no estorba: los toques pasan a Inicio');
  assert.equal(flot.props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(flot.props.style.position, 'absolute');
  assert.match(textoDe(flot), /Cobrarías unos 30 € al año/);
});

test('app · en inglés: los campos con su formato («1,000») y el resultado en su idioma', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const { pintar } = montar();
    pintar();
    const arbol = pintar();
    assert.deepEqual(entradas(arbol).map((n) => n.props.value), ['1,000', '4', '5']);
    assert.equal(textoDe(porId(arbol, 'calc-resultado')), 'You would receive about €32.40 a year (€2.70 a month) Net gain over 5 years: €162, 3.24% a year, after tax.');
    const texto = textoDe(arbol);
    for (const es of ['Calcula tus números', 'Tus números', 'Lo que inviertes', 'Lo cobro', 'Usa la rentabilidad de una oferta', 'Afinar: comisiones e impuestos', 'Ver la cuenta paso a paso']) {
      assert.ok(texto.includes(en[es]), `${es} → ${en[es]}`);
      assert.ok(!texto.includes(es) || en[es].includes(es), `sin traducir: ${es}`);
    }
    assert.equal(entrada(arbol, 'inversion').props.accessibilityLabel, 'What you invest, in euros');
  } finally { await idioma.cambiarIdioma('es'); }
});

test('app · cada texto fijo de la calculadora y del enlace del explicador tiene su inglés', () => {
  const fuente = leer('componentes', 'CalculadoraInicio.js');
  const literales = new Set();
  // Hijos de <Text> y etiquetas accesibles literales en español.
  for (const m of fuente.matchAll(/<Text\b[^>]*>([^<{}]+)<\/Text>/g)) literales.add(m[1].trim());
  for (const m of fuente.matchAll(/(?:accessibilityLabel|a11y|etiqueta|ayuda)(?:=|: )['"]([^'"]+)['"]/g)) literales.add(m[1].trim());
  for (const m of fuente.matchAll(/\[\s*'(?:cobrar|reinvertir)',\s*'([^']+)'\]/g)) literales.add(m[1]);
  literales.add('(opcional)'); literales.add('Calcula con tus números');
  const sinIngles = [...literales].filter((x) => x && /[a-záéíóúñ]/i.test(x) && !Object.hasOwn(en, x));
  assert.deepEqual(sinIngles, []);
  assert.ok(literales.size >= 25, `textos comprobados: ${literales.size}`);
});

test('app · Inicio: «Calcula tus números» va entre «Mercado y noticias» y Aprende, con el resultado flotante y sin campos propios', () => {
  const inicio = leer('componentes', 'Inicio.js');
  assert.match(inicio, /import CalculadoraInicio, \{ ResultadoFlotante \} from '\.\/CalculadoraInicio';/);
  const mercado = inicio.indexOf('<MercadoCotizacion'), calc = inicio.indexOf('<CalculadoraInicio'), aprende = inicio.indexOf("abrir('aprende')");
  assert.ok(mercado > 0 && calc > mercado && aprende > calc);
  assert.match(inicio, /<CalculadoraInicio ofertas=\{ofertas\} catalogoVigente=\{cifras\.vigente\} onAbrirOferta=\{onAbrirOferta\}/);
  assert.match(inicio, /ref=\{lista\} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets/);
  assert.ok(inicio.indexOf('<ResultadoFlotante estado={calculoFlotante} />') > inicio.indexOf('</ScrollView>'));
  assert.doesNotMatch(inicio, /TextInput/, 'los campos van en CalculadoraInicio');
  // El explicador (web dentro de la app o el nativo) lleva hasta la calculadora.
  const app = leer('App.js');
  assert.match(app, /onCalculadora=\{\(\) => \{ cerrarTutorial\(\); setPestana\('inicio'\); setIrCalculadora\(\(n\) => n \+ 1\); \}\}/);
  assert.match(app, /irCalculadora=\{irCalculadora\} onCalculadoraVista=\{\(\) => setIrCalculadora\(0\)\}/);
  const explicador = leer('componentes', 'Explicador.js');
  assert.match(explicador, /if \(evento\?\.nativeEvent\?\.data === 'rwadar:tutorial-calculadora'\) onCalculadora\?\.\(\);/);
  assert.match(explicador, /injectedJavaScriptBeforeContentLoaded=\{onCalculadora \? CON_CALCULADORA : undefined\}/);
  assert.match(explicador, /injectedJavaScript=\{onCalculadora \? CON_CALCULADORA \+ SOLO_EL_EXPLICADOR : SOLO_EL_EXPLICADOR\}/);
  assert.match(explicador, /<ExplicadorNativo onCerrar=\{onCerrar\} onCalculadora=\{onCalculadora\} \/>/);
  const marca = /export const CON_CALCULADORA = `([\s\S]*?)`;/.exec(explicador)[1];
  const atributos = new Map(), enlace = { hidden: true }, ventana = {};
  ventana.window = ventana;
  vm.runInNewContext(marca, Object.assign(ventana, { document: { documentElement: { setAttribute: (k, v) => atributos.set(k, v) },
    getElementById: (id) => (id === 'calcIrInicio' ? enlace : null) } }));
  assert.deepEqual([...atributos], [['data-rwadar-calculadora-app', '']]);
  assert.equal(ventana.RWAdarCalculadoraApp, true);
  assert.equal(enlace.hidden, false);
  // Antes de que haya <html> (al empezar la carga), la marca va en window y no falla.
  const temprano = {}; temprano.window = temprano;
  vm.runInNewContext(marca, Object.assign(temprano, { document: { documentElement: null, getElementById: () => null } }));
  assert.equal(temprano.RWAdarCalculadoraApp, true);
  const nativo = leer('componentes', 'ExplicadorNativo.js');
  assert.match(nativo, /\{onCalculadora \? \(\s*<Pressable onPress=\{\(\) => \{ tacto\.abrir\(\); onCalculadora\(\); \}\} accessibilityRole="link"/);
  // Y la web: el enlace solo sale en la app si esta pone la marca.
  const web = fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/rwadar-20260820.js'), 'utf8');
  assert.match(web, /const appSabe=\(\)=>window\.RWAdarCalculadoraApp===true\|\|document\.documentElement\.hasAttribute\('data-rwadar-calculadora-app'\);/);
  assert.match(web, /if\(window\.ReactNativeWebView&&!appSabe\(\)\)\{ir\.hidden=true;/);
  assert.match(web, /window\.ReactNativeWebView\.postMessage\('rwadar:tutorial-calculadora'\)/);
});
