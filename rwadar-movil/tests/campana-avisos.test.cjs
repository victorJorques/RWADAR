'use strict';

/* Campana de avisos de la cabecera (21/11/2026): el globo y su etiqueta,
   los avisos públicos, las claves nuevas del dispositivo, «visto al estar en
   pantalla» y los textos en inglés. Sin Expo, red ni permisos. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const campana = require('../lib/campana-avisos');
const idioma = require('../lib/idioma');
const { clavesPrivadasDispositivo } = require('../lib/acceso-obligatorio');

const RAIZ = path.resolve(__dirname, '..');
const LIB = path.join(RAIZ, 'lib') + path.sep;
const UID = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';

test('globo: nada con 0, de 1 a 9 tal cual y «9+» desde 10; etiqueta con el número exacto en los dos idiomas', () => {
  assert.equal(campana.textoGlobo(0), '');
  assert.equal(campana.textoGlobo(-3), '');
  assert.equal(campana.textoGlobo('x'), '');
  assert.equal(campana.textoGlobo(1), '1');
  assert.equal(campana.textoGlobo(9), '9');
  assert.equal(campana.textoGlobo(10), '9+');
  assert.equal(campana.textoGlobo(57), '9+');
  assert.equal(campana.etiquetaCampana(0), 'Avisos, ninguno sin leer');
  assert.equal(campana.etiquetaCampana(3), 'Avisos, 3 sin leer');
  assert.equal(campana.etiquetaCampana(12), 'Avisos, 12 sin leer');
  assert.equal(campana.etiquetaCampana(0, 'en'), 'Notices, none unread');
  assert.equal(campana.etiquetaCampana(3, 'en'), 'Notices, 3 unread');
  assert.equal(idioma.ingles('Avisos, ninguno sin leer'), 'Notices, none unread');
});

const PUBLICOS = [
  { id: '9', tipo: 'ofertas', titulo: '2 fichas nuevas en el radar de RWAdar', texto: 'Consulta en el radar qué ha entrado.',
    enlace: 'https://rwadar.pages.dev/#emisiones', creado_el: '2026-11-05T10:00:00Z' },
  { id: '8', tipo: 'novedad', titulo: 'Ajeno', texto: 'Enlace de fuera.', enlace: 'https://evil.test/', creado_el: '2026-11-04T10:00:00Z' },
  { id: 'bienvenida', tipo: 'bienvenida', titulo: 'Te damos la bienvenida a RWAdar', texto: 'De cada cuenta.',
    enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-01T10:00:00Z' },
];
const respuesta = (status, cuerpo) => async () => ({ status, json: async () => cuerpo });

test('avisos públicos: la lista de la web sin sesión, sin cookies, sin la bienvenida y con la misma validación', async () => {
  const pedidos = [];
  const lista = await campana.cargarAvisosPublicos({ fetchImpl: async (url, opciones) => {
    pedidos.push([url, opciones.method, opciones.credentials]);
    return { status: 200, json: async () => ({ v: 1, avisos: PUBLICOS }) };
  } });
  assert.deepEqual(pedidos, [['https://rwadar.pages.dev/api/avisos/recientes', 'GET', 'omit']]);
  assert.deepEqual(lista.map((a) => a.id), ['9'], 'ni la bienvenida ni el enlace ajeno');
  assert.equal(lista[0].creadoEl, '2026-11-05T10:00:00.000Z');
  await assert.rejects(campana.cargarAvisosPublicos({ fetchImpl: respuesta(503, null) }));
  await assert.rejects(campana.cargarAvisosPublicos({ fetchImpl: respuesta(200, { v: 2, avisos: [] }) }));
  await assert.rejects(campana.cargarAvisosPublicos({ fetchImpl: respuesta(200, { v: 1, avisos: new Array(51).fill(PUBLICOS[0]) }) }));
  await assert.rejects(campana.cargarAvisosPublicos({ fetchImpl: () => new Promise(() => {}), plazoMs: 20 }), /plazo/);
});

test('cambios de lo que sigues: la insignia solo cuenta los posteriores a «vistos hasta»', () => {
  const cambios = [{ id: 1, ocurrido_el: '2026-11-20T10:00:00Z' }, { id: 2, ocurrido_el: '2026-11-18T10:00:00Z' },
    { id: 3, ocurrido_el: 'roto' }];
  assert.equal(campana.cambiosNoVistos(cambios, null), 3, 'sin fecha guardada, todos');
  assert.equal(campana.cambiosNoVistos(cambios, '2026-11-19T00:00:00.000Z'), 2, 'el nuevo y el que no tiene fecha');
  assert.equal(campana.cambiosNoVistos(cambios.slice(0, 2), '2026-11-20T10:00:00.000Z'), 0);
  assert.equal(campana.cambiosNoVistos(null, null), 0);
  assert.equal(campana.ultimoCambio(cambios), '2026-11-20T10:00:00.000Z');
  assert.equal(campana.ultimoCambio([]), null);
});

/* lib/datos.js con AsyncStorage en memoria (como avisos-movil.test.cjs). */
function datos(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  const storage = { async getItem(k) { return mapa.has(k) ? mapa.get(k) : null; }, async setItem(k, v) { mapa.set(k, v); },
    async removeItem(k) { mapa.delete(k); }, async getAllKeys() { return [...mapa.keys()]; },
    async multiRemove(claves) { claves.forEach((k) => mapa.delete(k)); } };
  const mocks = {
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'react-native': { Platform: { OS: 'android' } },
    'datos.js:./modo-local': { SERVICIOS_USUARIO_REMOTOS: false },
    'datos.js:./supabase': {},
  };
  const absoluto = path.join(RAIZ, 'lib', 'datos.js');
  const cargarOriginal = Module._load, jsOriginal = Module._extensions['.js'];
  Module._load = function (pedido, padre, esPrincipal) {
    const local = padre && padre.filename.startsWith(LIB) ? `${path.basename(padre.filename)}:${pedido}` : null;
    if (local && Object.hasOwn(mocks, local)) return mocks[local];
    if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return cargarOriginal.call(this, pedido, padre, esPrincipal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (!archivo.startsWith(LIB)) return jsOriginal(modulo, archivo);
    modulo._compile(babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
      filename: archivo, babelrc: false, configFile: false, plugins: [commonjs] }).code, archivo);
  };
  for (const clave of Object.keys(require.cache)) if (clave.startsWith(LIB)) delete require.cache[clave];
  try { return { d: require(absoluto), mapa }; } finally { Module._load = cargarOriginal; Module._extensions['.js'] = jsOriginal; }
}

test('claves nuevas: leídos públicos y «cambios vistos hasta», por cuenta, sin bajar nunca y fuera con «Borrar datos»', async () => {
  const { d, mapa } = datos({ ['rwadar.editorial.avisos.leidos.v1:' + UID]: '["9"]', 'otra.app': 'conservar' });
  assert.deepEqual(await d.avisosPublicosLeidos(UID), [], 'no se mezclan con los leídos de la cuenta');
  assert.deepEqual(await d.marcarAvisosPublicosLeidos(UID, ['9', '9', '<x>', 'bienvenida']), ['9', 'bienvenida']);
  assert.deepEqual(await d.avisosPublicosLeidos(OTRO), [], 'ni entre cuentas');
  assert.equal(mapa.get('rwadar.editorial.avisos.publicos.leidos.v1:' + UID), '["9","bienvenida"]');
  await assert.rejects(d.marcarAvisosPublicosLeidos('no-uuid', ['9']));
  assert.equal(await d.leerCambiosVistos(UID), null);
  assert.equal(await d.marcarCambiosVistos(UID, '2026-11-20T10:00:00.000Z'), true);
  assert.equal(await d.marcarCambiosVistos(UID, '2026-11-01T10:00:00.000Z'), true);
  assert.equal(await d.leerCambiosVistos(UID), '2026-11-20T10:00:00.000Z', 'nunca baja');
  assert.equal(await d.leerCambiosVistos(OTRO), null);
  assert.equal(await d.marcarCambiosVistos(UID, 'ayer'), false);
  mapa.set('rwadar.editorial.cambios.vistos.v1:' + OTRO, 'manipulado');
  assert.equal(await d.leerCambiosVistos(OTRO), null, 'un valor manipulado no se usa');
  await d.borrarDatosDispositivo();
  assert.deepEqual([...mapa.keys()], ['otra.app'], '«Borrar datos del dispositivo» las quita');
  const claves = ['rwadar.editorial.avisos.publicos.leidos.v1:' + UID, 'rwadar.editorial.cambios.vistos.v1:' + OTRO,
    'rwadar.editorial.cambios.vistos.v1:no-uuid', 'otra.app'];
  assert.deepEqual(clavesPrivadasDispositivo(claves), claves.slice(0, 2));
  // Documentadas en lib/datos.js.
  const fuente = fs.readFileSync(path.join(RAIZ, 'lib', 'datos.js'), 'utf8');
  assert.match(fuente, /rwadar\.editorial\.avisos\.publicos\.leidos\.v1:<UUID>/);
  assert.match(fuente, /rwadar\.editorial\.cambios\.vistos\.v1:<UUID>/);
});

/* Hooks aislados: useState, useRef y useEffect con dependencias. */
function crearReact() {
  const slots = [], efectos = [], pendientes = [];
  let indice = 0, cambiado = false;
  const react = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function') return tipo({ ...props, children });
      return { type: tipo, props: props || {}, children };
    },
    useState(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (valor) => {
        const nuevo = typeof valor === 'function' ? valor(slots[i]) : valor;
        if (!Object.is(slots[i], nuevo)) { slots[i] = nuevo; cambiado = true; }
      }];
    },
    useRef(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial };
      return slots[i];
    },
    useEffect(fn, deps) {
      const i = indice++;
      if (!efectos[i] || !deps || deps.some((v, j) => !Object.is(v, efectos[i].deps[j]))) {
        pendientes.push(() => { efectos[i]?.limpiar?.(); efectos[i] = { deps, limpiar: fn() }; });
      }
    },
  };
  return {
    react,
    pintar(render) {
      for (let vueltas = 0; vueltas < 20; vueltas++) {
        indice = 0; cambiado = false;
        const salida = render();
        while (pendientes.length) pendientes.shift()();
        if (!cambiado) return salida;
      }
      throw new Error('el componente no se estabiliza');
    },
    desmontar() { for (const e of efectos) e?.limpiar?.(); },
  };
}

function cargarCampana(react, datosMock = {}) {
  const absoluto = path.join(RAIZ, 'componentes', 'CampanaAvisos.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Dimensions: { get: () => ({ height: 800 }) }, Modal: 'Modal' };
  for (const tipo of ['Text', 'View', 'Pressable', 'ScrollView', 'ActivityIndicator']) nativo[tipo] = tipo;
  const mocks = {
    './Idioma': { ...nativo, useIdioma: () => 'es' }, react, 'react-native': nativo,
    './Navegacion': { Icono: 'Icono' }, '../lib/avisos': { retirarNotificacionesAvisos: async () => 0 },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../lib/datos': datosMock,
    '../lib/tema': { C: new Proxy({}, { get: (_, k) => `#${String(k)}` }), F: {}, R: { p: 999, m: 12, l: 16 },
      T: { seccion: {}, menor: {}, etiqueta: {}, cuerpoFte: {}, dato: {} }, UI: { tactil: 48, margen: 16 } },
  };
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto && Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    modulo._compile(babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false,
      plugins: [jsx, commonjs] }).code, ruta);
  };
  delete require.cache[absoluto];
  try { return require(absoluto); } finally { Module._load = original; Module._extensions['.js'] = extension; }
}

test('avisos públicos en la campana: se cargan, el leído va al dispositivo y, sin cuenta (interruptor apagado), no se llama a nada', async () => {
  const h = crearReact(), local = { leidos: [] }, pedidos = [];
  const modulo = cargarCampana(h.react, {
    avisosPublicosLeidos: async () => local.leidos,
    marcarAvisosPublicosLeidos: async (_, ids) => { local.leidos = [...new Set([...ids, ...local.leidos])]; return local.leidos; },
  });
  const cargar = async () => { pedidos.push(1); return campana.cargarAvisosPublicos({ fetchImpl: respuesta(200, { v: 1, avisos: PUBLICOS }) }); };
  const pintar = (usuarioId = UID) => h.pintar(() => modulo.useAvisosPublicos({ usuarioId, cargar }));
  const esperar = async (u) => { let e; for (let i = 0; i < 8; i++) { await new Promise((r) => setImmediate(r)); e = pintar(u); } return e; };
  let estado = await esperar();
  assert.deepEqual(estado.avisos.map((a) => a.id), ['9']);
  assert.equal(estado.noLeidos, 1);
  await estado.marcarLeidos(['9']);
  estado = await esperar();
  assert.equal(estado.noLeidos, 0);
  assert.deepEqual(local.leidos, ['9']);
  estado.recargar();
  await esperar();
  assert.equal(pedidos.length, 2);
  h.desmontar();
  // Sin usuario (interruptor apagado) no pide nada ni guarda nada.
  const h2 = crearReact(), prohibido = () => assert.fail('no debe llamarse');
  const apagado = cargarCampana(h2.react, { avisosPublicosLeidos: prohibido, marcarAvisosPublicosLeidos: prohibido });
  const sin = h2.pintar(() => apagado.useAvisosPublicos({ usuarioId: null, cargar: prohibido }));
  assert.equal(sin.activo, false);
  await sin.marcarLeidos(['9']); sin.recargar();
  // Si la web falla, lo dice.
  const h3 = crearReact();
  const caida = cargarCampana(h3.react, { avisosPublicosLeidos: async () => [] });
  const pintarCaida = () => h3.pintar(() => caida.useAvisosPublicos({ usuarioId: UID, cargar: async () => { throw new Error('503'); } }));
  pintarCaida(); for (let i = 0; i < 6; i++) { await new Promise((r) => setImmediate(r)); }
  assert.equal(pintarCaida().errorCarga, 'No se han podido cargar los avisos. Vuelve a intentarlo más tarde.');
});

test('visto al estar en pantalla: 1,5 s seguidos dentro de la ventana; si sale antes, vuelve a empezar', (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const h = crearReact(), vistos = [];
  const modulo = cargarCampana(h.react);
  let y = 1200; // fuera (la ventana mide 800)
  const pintar = (activo = true, clave = 'a') => h.pintar(() => modulo.useVistoEnPantalla({ activo, clave, onVisto: () => vistos.push(clave) }));
  const ref = pintar();
  ref.current = { measureInWindow: (fn) => fn(0, y, 390, 200) };
  t.mock.timers.tick(3000);
  assert.deepEqual(vistos, [], 'fuera de la pantalla no cuenta');
  y = 300;
  t.mock.timers.tick(1000);
  y = 1200; // sale antes de 1,5 s
  t.mock.timers.tick(500);
  y = 300;
  t.mock.timers.tick(1250);
  assert.deepEqual(vistos, [], 'aún no lleva 1,5 s seguidos');
  t.mock.timers.tick(500);
  assert.deepEqual(vistos, ['a']);
  t.mock.timers.tick(5000);
  assert.deepEqual(vistos, ['a'], 'una vez');
  // Con otra lista, se vuelve a armar; apagado, no mide.
  pintar(true, 'b');
  ref.current = { measureInWindow: (fn) => fn(0, 300, 390, 200) };
  t.mock.timers.tick(1500);
  assert.deepEqual(vistos, ['a', 'b']);
  pintar(false, 'c');
  t.mock.timers.tick(5000);
  assert.deepEqual(vistos, ['a', 'b']);
  h.desmontar();
});

test('la campana: textos en inglés, el dibujo de la web, la insignia de Inicio ya no cuenta avisos', () => {
  const archivo = fs.readFileSync(path.join(RAIZ, 'componentes', 'CampanaAvisos.js'), 'utf8');
  const ast = babel.parseSync(archivo, { babelrc: false, configFile: false, sourceType: 'module', parserOpts: { plugins: ['jsx'] } });
  const visibles = new Set();
  babel.traverse(ast, {
    StringLiteral(ruta) { if (!ruta.parentPath.isImportDeclaration()) visibles.add(ruta.node.value); },
    JSXText(ruta) { if (ruta.node.value.trim()) visibles.add(ruta.node.value.trim()); },
  });
  const frases = [...visibles].filter((s) => /^[A-ZÁÉÍÓÚ¿«]/.test(s) && s.length > 2 && !/^[A-Z][a-zA-Z]+$/.test(s) || ['Abrir', 'Avisos', 'Cerrar', 'Reintentar'].includes(s));
  assert.ok(frases.length >= 8, `solo ${frases.length} frases`);
  for (const es of frases) assert.notEqual(idioma.ingles(es), es, `falta el inglés de: ${es}`);
  // Sin palabras prohibidas en los textos nuevos.
  for (const es of frases) assert.doesNotMatch(es, /oportunidad|rentabilidad|garantiz|%/i, es);
  // El mismo dibujo que la campana de la web.
  const nav = fs.readFileSync(path.join(RAIZ, 'componentes', 'Navegacion.js'), 'utf8');
  const web = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'index.html'), 'utf8');
  const trazo = 'M6.7 9.8a5.3 5.3 0 0 1 10.6 0c0 6 2.2 6.2 2.2 7.2h-15c0-1 2.2-1.2 2.2-7.2z';
  assert.ok(web.includes(trazo), 'el trazo de la web');
  assert.match(nav, /nombre === 'campana' \? \([\s\S]{0,200}M6\.7 9\.8a5\.3 5\.3 0 0 1 10\.6 0c0 6 2\.2 6\.2 2\.2 7\.2h-15c0-1 2\.2-1\.2 2\.2-7\.2z/);
  // La insignia de la pestaña Inicio solo cuenta lo que le llega en `novedades` (los cambios sin ver).
  assert.match(nav, /const insignia = id === 'perfil' \? guardados : id === 'inicio' \? novedades : 0;/);
  // El botón: mismo círculo y tamaño que el «?» (accionCabecera de App.js).
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  assert.match(app, /accionCabecera: \{\s*width: 44, height: 44, borderRadius: R\.p, alignItems: 'center', justifyContent: 'center',\s*backgroundColor: C\.ton,/);
  assert.match(archivo, /boton: \{ width: 44, height: 44, borderRadius: R\.p, alignItems: 'center', justifyContent: 'center', backgroundColor: C\.ton \}/);
  assert.match(archivo, /botonPulsado: \{ backgroundColor: C\.ton2 \}/);
  assert.match(app, /accionCabeceraPulsada: \{ backgroundColor: C\.ton2 \}/);
});
