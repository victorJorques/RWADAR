'use strict';

/* Notificaciones sin cuenta en la app (14/11/2026): lib/avisos-sin-cuenta.js
   con el servidor y el SDK simulados, lo guardado en este móvil (lib/datos.js,
   también «Borrar datos del dispositivo»), el bloque de la pantalla de acceso
   (componentes/AvisosSinCuenta.js) con un React de juguete y con React y
   react-native-web reales, y dónde va en App.js. Sin red, Expo ni permisos.
   Contrato: docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const { soporteIdioma } = require('./soporte-idioma.cjs');
const sc = require('../lib/avisos-sin-cuenta');
const idioma = require('../lib/idioma');

const RAIZ = path.resolve(__dirname, '..');
const LIB = path.join(RAIZ, 'lib') + path.sep;
const TOKEN = 'ExponentPushToken[abcdefghijklmnop1234]';
const TOKEN2 = 'ExponentPushToken[zyxwvutsrqponmlk9876]';
const VERSION = 'sin-cuenta-v1-2026-11-14';
const TEXTO_ES = 'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It's optional and doesn't need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.";
const TEXTO = { v: 1, activo: true, version: VERSION, texto: { es: TEXTO_ES, en: TEXTO_EN }, clavePublica: null };
const HOY = '2026-11-14';

/* El servidor de la web simulado: anota cada llamada y contesta lo que diga `respuestas`. */
function servidor(respuestas = {}) {
  const llamadas = [];
  const fetchImpl = async (url, opciones) => {
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : null;
    llamadas.push({ url, metodo: opciones.method, credenciales: opciones.credentials, cuerpo });
    const clave = cuerpo ? cuerpo.accion : 'texto';
    const r = typeof respuestas[clave] === 'function' ? respuestas[clave](cuerpo) : respuestas[clave];
    if (r instanceof Error) throw r;
    const [status, j] = r || (clave === 'texto' ? [200, TEXTO] : clave === 'alta' ? [200, { ok: true, estado: 'activa', nueva: true }]
      : clave === 'baja' ? [200, { ok: true, borrada: true }] : [200, { ok: true, activa: true, vigente: true, servicio: true }]);
    return { status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(j) };
  };
  return { llamadas, fetchImpl };
}
function almacenFalso(inicial = null) {
  let valor = inicial;
  return { get valor() { return valor; }, async leer() { return valor; }, async guardar(d) { valor = { ...d }; }, async borrar() { valor = null; } };
}
function push({ capacidad = true, estado = 'disponible', token = TOKEN, tokenOk = true } = {}) {
  const llamadas = [];
  return { llamadas, capacidad,
    async consultar() { llamadas.push('consultar'); return { estado }; },
    async obtenerToken(o) { llamadas.push(['token', o.solicitarPermiso]); return tokenOk ? { ok: true, estado: 'permitido', token, plataforma: 'android' } : { ok: false, estado: 'denegado' }; } };
}
const guardado = (extra = {}) => ({ v: 1, token: TOKEN, version: VERSION, idioma: 'es', origen: 'perfil', renovado: '2026-11-10', ...extra });

test('sin cuenta · el texto del servidor se valida con tipos estrictos; sin la migración 36, apagado', () => {
  assert.deepEqual(sc.validarTexto(TEXTO), { activo: true, version: VERSION, texto: { es: TEXTO_ES, en: TEXTO_EN } });
  assert.deepEqual(sc.validarTexto({ v: 1, activo: false, version: null, texto: null, clavePublica: null }), { activo: false, version: null, texto: null });
  for (const malo of [null, [], { v: 2, activo: true }, { ...TEXTO, activo: 'si' }, { ...TEXTO, version: 'Mal Versión' },
    { ...TEXTO, texto: { es: 'corto', en: TEXTO_EN } }, { ...TEXTO, texto: { es: TEXTO_ES + '<b>', en: TEXTO_EN } }]) {
    assert.throws(() => sc.validarTexto(malo), /sin_cuenta_respuesta_invalida/);
  }
  assert.equal(sc.URL_AVISOS, 'https://rwadar.pages.dev/api/avisos');
  assert.deepEqual(sc.validarGuardado(guardado()), guardado());
  for (const malo of [null, guardado({ token: 'otro' }), guardado({ idioma: 'fr' }), guardado({ origen: 'web' }), guardado({ renovado: 'ayer' })]) {
    assert.equal(sc.validarGuardado(malo), null);
  }
});

test('sin cuenta · estados: 1.4.1, dispositivo sin push, base apagada, error, disponible, activas y sin permiso', async () => {
  const s = servidor();
  const g = (o = {}, almacen = almacenFalso()) => sc.crearAvisosSinCuenta({ push: push(o), almacen, fetchImpl: s.fetchImpl, ahora: () => new Date(HOY + 'T10:00:00Z') });
  const p141 = push({ capacidad: false });
  const v141 = sc.crearAvisosSinCuenta({ push: p141, almacen: almacenFalso(), fetchImpl: s.fetchImpl });
  assert.deepEqual(await v141.estado(sc.validarTexto(TEXTO)), { estado: 'requiere-version', activo: false });
  assert.deepEqual(p141.llamadas, [], 'con la 1.4.1 no se toca el SDK');
  assert.equal((await g({ estado: 'emulador' }).estado(sc.validarTexto(TEXTO))).estado, 'no-disponible');
  assert.equal((await sc.crearAvisosSinCuenta({ push: push(), almacen: almacenFalso(), fetchImpl: s.fetchImpl, plataforma: 'ios' }).estado(sc.validarTexto(TEXTO))).estado,
    'no-disponible', 'no hay app de iPhone: en iPhone, la web');
  assert.equal((await g().estado(undefined)).estado, 'comprobando');
  assert.equal((await g().estado(null)).estado, 'error');
  assert.equal((await g().estado({ activo: false, version: null, texto: null })).estado, 'apagado');
  assert.equal((await g({ estado: 'denegado' }).estado(sc.validarTexto(TEXTO))).estado, 'denegado');
  assert.deepEqual(await g().estado(sc.validarTexto(TEXTO)), { estado: 'disponible', activo: false });
  assert.deepEqual(await g({ estado: 'permitido' }, almacenFalso(guardado())).estado(sc.validarTexto(TEXTO)), { estado: 'activo', activo: true });
  assert.deepEqual(await g({ estado: 'denegado' }, almacenFalso(guardado())).estado(sc.validarTexto(TEXTO)), { estado: 'sin-permiso', activo: true });
  assert.deepEqual(s.llamadas, [], 'mirar el estado no llama a nadie');
});

test('sin cuenta · texto nuevo del permiso: «Activadas» deja paso a volver a aceptarlo, y activar con el mismo token lo renueva', async () => {
  const NUEVA = 'sin-cuenta-v2-2026-12-01';
  const nuevo = sc.validarTexto({ ...TEXTO, version: NUEVA, texto: { es: TEXTO_ES.replace('Es opcional', 'Es voluntario'), en: TEXTO_EN } });
  const s = servidor(), p = push({ estado: 'permitido' }), almacen = almacenFalso(guardado());
  const g = sc.crearAvisosSinCuenta({ push: p, almacen, fetchImpl: s.fetchImpl, ahora: () => new Date(HOY + 'T10:00:00Z') });
  assert.deepEqual(await g.estado(nuevo), { estado: 'texto-nuevo', activo: true }, 'la base ya no envía con el texto anterior');
  assert.deepEqual(await g.estado(sc.validarTexto(TEXTO)), { estado: 'activo', activo: true }, 'con el mismo texto, activas');
  assert.deepEqual(await g.estado({ ...nuevo, activo: false }), { estado: 'activo', activo: true }, 'con la base apagada no se pide nada');
  assert.deepEqual(await g.estado(undefined), { estado: 'activo', activo: true }, 'sin el texto todavía, lo guardado');
  assert.deepEqual(await g.activar(nuevo, { idioma: 'es', origen: 'perfil' }), { ok: true, estado: 'activo' });
  assert.deepEqual(s.llamadas.map((x) => x.cuerpo), [{ accion: 'alta', token: TOKEN, plataforma: 'android', version: NUEVA, idioma: 'es', origen: 'perfil' }],
    'una sola alta, con el mismo token y la versión nueva (sin baja)');
  assert.equal(almacen.valor.version, NUEVA);
  assert.deepEqual(await g.estado(nuevo), { estado: 'activo', activo: true });
});

test('sin cuenta · activar: permiso y token tras pulsar, alta con la versión, el idioma y el origen; sin cookies', async () => {
  const s = servidor(), p = push(), almacen = almacenFalso();
  const g = sc.crearAvisosSinCuenta({ push: p, almacen, fetchImpl: s.fetchImpl, ahora: () => new Date(HOY + 'T10:00:00Z') });
  const texto = await g.texto();
  assert.deepEqual(s.llamadas[0], { url: 'https://rwadar.pages.dev/api/avisos/texto', metodo: 'GET', credenciales: 'omit', cuerpo: null });
  assert.deepEqual(await g.activar(texto, { idioma: 'en', origen: 'perfil' }), { ok: true, estado: 'activo' });
  assert.deepEqual(p.llamadas, [['token', true]], 'el permiso, solo tras pulsar');
  assert.deepEqual(s.llamadas[1], { url: 'https://rwadar.pages.dev/api/avisos/movil', metodo: 'POST', credenciales: 'omit',
    cuerpo: { accion: 'alta', token: TOKEN, plataforma: 'android', version: VERSION, idioma: 'en', origen: 'perfil' } });
  assert.deepEqual(almacen.valor, { v: 1, token: TOKEN, version: VERSION, idioma: 'en', origen: 'perfil', renovado: HOY });
  // Lo que el servidor no deja hacer, en llano.
  for (const [respuesta, estado] of [[[409, { ok: false, error: 'apagado' }], 'apagado'], [[404, { ok: false, error: 'no_disponible' }], 'apagado'],
    [[409, { ok: false, error: 'version' }], 'version'], [[409, { ok: false, error: 'lleno' }], 'lleno'], [[429, { ok: false, error: 'cupo' }], 'cupo'],
    [[429, { ok: false, error: 'intentos_excedidos' }], 'cupo'], [[503, { ok: false, error: 'servicio_no_disponible' }], 'sin-red'],
    [new Error('sin red'), 'sin-red'], [[400, { ok: false, error: 'solicitud_invalida' }], 'error']]) {
    const otro = servidor({ alta: respuesta }), a = almacenFalso();
    const r = await sc.crearAvisosSinCuenta({ push: push(), almacen: a, fetchImpl: otro.fetchImpl }).activar(texto);
    assert.deepEqual(r, { ok: false, estado }, JSON.stringify(respuesta));
    assert.equal(a.valor, null, 'sin alta, no se guarda nada');
  }
  // Permiso denegado: ni alta.
  const d = servidor();
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ tokenOk: false }), almacen: almacenFalso(), fetchImpl: d.fetchImpl }).activar(texto),
    { ok: false, estado: 'denegado' });
  assert.deepEqual(d.llamadas, []);
  // Con la base apagada no se pide ni el permiso.
  const apagada = push();
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: apagada, almacen: almacenFalso(), fetchImpl: d.fetchImpl }).activar({ activo: false, version: null, texto: null }),
    { ok: false, estado: 'apagado' });
  assert.deepEqual(apagada.llamadas, []);
});

test('sin cuenta · desactivar: baja y fuera; sin conexión se conserva para reintentarlo', async () => {
  const s = servidor(), almacen = almacenFalso(guardado());
  const g = sc.crearAvisosSinCuenta({ push: push(), almacen, fetchImpl: s.fetchImpl });
  assert.deepEqual(await g.desactivar(), { ok: true, confirmada: true });
  assert.deepEqual(s.llamadas.map((l) => l.cuerpo), [{ accion: 'baja', token: TOKEN }]);
  assert.equal(almacen.valor, null);
  const sinRed = servidor({ baja: new Error('sin red') }), a2 = almacenFalso(guardado());
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push(), almacen: a2, fetchImpl: sinRed.fetchImpl }).desactivar(), { ok: false, confirmada: false });
  assert.deepEqual(a2.valor, guardado(), 'se conserva para reintentarlo');
  assert.equal(await sc.bajaSinCuenta(TOKEN, { fetchImpl: servidor().fetchImpl }), true);
  assert.equal(await sc.bajaSinCuenta(TOKEN, { fetchImpl: servidor({ baja: [503, {}] }).fetchImpl }), false);
  assert.equal(await sc.bajaSinCuenta('raro', { fetchImpl: () => { throw new Error('no debe llamar'); } }), true);
});

test('sin cuenta · renovar una vez al día: estado y alta; permiso quitado, baja; caducada, se olvida; token nuevo, cambia', async () => {
  const ahora = () => new Date(HOY + 'T10:00:00Z');
  // Hecho hoy: nada.
  let s = servidor(), a = almacenFalso(guardado({ renovado: HOY }));
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ estado: 'permitido' }), almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(),
    { renovado: false, motivo: 'hecho-hoy' });
  assert.deepEqual(s.llamadas, []);
  // Al día siguiente: estado y alta con lo que se aceptó (sin pedir permiso).
  s = servidor(); a = almacenFalso(guardado({ origen: 'novedades', idioma: 'en' }));
  const p = push({ estado: 'permitido' });
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: p, almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(), { renovado: true });
  assert.deepEqual(s.llamadas.map((l) => l.cuerpo), [{ accion: 'estado', token: TOKEN },
    { accion: 'alta', token: TOKEN, plataforma: 'android', version: VERSION, idioma: 'en', origen: 'novedades' }]);
  assert.deepEqual(p.llamadas, ['consultar', ['token', false]], 'nunca pide permiso');
  assert.equal(a.valor.renovado, HOY);
  // Permiso quitado en los ajustes del móvil: baja.
  s = servidor(); a = almacenFalso(guardado());
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ estado: 'denegado' }), almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(),
    { renovado: false, motivo: 'sin-permiso' });
  assert.deepEqual(s.llamadas.map((l) => l.cuerpo), [{ accion: 'baja', token: TOKEN }]);
  assert.equal(a.valor, null);
  // La base ya no la tiene: se olvida aquí.
  s = servidor({ estado: [200, { ok: true, activa: false, vigente: false, servicio: false }] }); a = almacenFalso(guardado());
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ estado: 'permitido' }), almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(),
    { renovado: false, motivo: 'caducada' });
  assert.equal(a.valor, null);
  // Texto nuevo: no se renueva con el viejo (hay que volver a aceptarlo).
  s = servidor({ estado: [200, { ok: true, activa: true, vigente: false, servicio: false }] }); a = almacenFalso(guardado());
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ estado: 'permitido' }), almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(),
    { renovado: false, motivo: 'texto-nuevo' });
  assert.equal(s.llamadas.filter((l) => l.cuerpo.accion === 'alta').length, 0);
  // El sistema cambió el token: alta del nuevo y baja del viejo.
  s = servidor(); a = almacenFalso(guardado());
  assert.deepEqual(await sc.crearAvisosSinCuenta({ push: push({ estado: 'permitido', token: TOKEN2 }), almacen: a, fetchImpl: s.fetchImpl, ahora }).renovar(),
    { renovado: true });
  assert.deepEqual(s.llamadas.map((l) => [l.cuerpo.accion, l.cuerpo.token]), [['estado', TOKEN], ['alta', TOKEN2], ['baja', TOKEN]]);
  assert.equal(a.valor.token, TOKEN2);
});

/* lib/datos.js con AsyncStorage en memoria (como tests/avisos-movil.test.cjs). */
function cargar(ruta, mocks) {
  const absoluto = path.join(RAIZ, ruta);
  const cargarOriginal = Module._load, jsOriginal = Module._extensions['.js'];
  Module._load = function (pedido, padre, esPrincipal) {
    const local = padre && padre.filename.startsWith(LIB) ? `${path.basename(padre.filename)}:${pedido}` : null;
    if (local && Object.hasOwn(mocks, local)) return mocks[local];
    if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return cargarOriginal.call(this, pedido, padre, esPrincipal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (!archivo.startsWith(LIB)) return jsOriginal(modulo, archivo);
    const { code } = babel.transformSync(fs.readFileSync(archivo, 'utf8'), { filename: archivo, babelrc: false, configFile: false, plugins: [commonjs] });
    modulo._compile(code, archivo);
  };
  for (const clave of Object.keys(require.cache)) if (clave.startsWith(LIB)) delete require.cache[clave];
  try { return require(absoluto); } finally { Module._load = cargarOriginal; Module._extensions['.js'] = jsOriginal; }
}
function datos(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  const storage = { async getItem(k) { return mapa.has(k) ? mapa.get(k) : null; }, async setItem(k, v) { mapa.set(k, v); },
    async removeItem(k) { mapa.delete(k); }, async getAllKeys() { return [...mapa.keys()]; }, async multiRemove(c) { c.forEach((k) => mapa.delete(k)); } };
  const modulo = cargar('lib/datos.js', { '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'react-native': { Platform: { OS: 'android' } }, 'datos.js:./modo-local': { SERVICIOS_USUARIO_REMOTOS: false },
    'datos.js:./supabase': {} });
  return { d: modulo, mapa };
}
const CLAVE = 'rwadar.editorial.avisos.sin-cuenta.v1';

test('sin cuenta · lo guardado en el móvil (sin UUID) y «Borrar datos del dispositivo»: primero la baja, después la clave', async () => {
  const { d, mapa } = datos({ 'otra.app': 'conservar' });
  assert.equal(d.CLAVE_AVISOS_SIN_CUENTA, CLAVE);
  assert.equal(await d.avisosSinCuenta(), null);
  await d.guardarAvisosSinCuenta(guardado());
  assert.deepEqual(await d.avisosSinCuenta(), guardado());
  await assert.rejects(d.guardarAvisosSinCuenta({ ...guardado(), token: 'raro' }));
  mapa.set(CLAVE, '{roto');
  assert.equal(await d.avisosSinCuenta(), null, 'un valor manipulado no se usa');
  // Con conexión: baja y fuera.
  mapa.set(CLAVE, JSON.stringify(guardado()));
  const s = servidor();
  assert.deepEqual(await d.borrarDatosDispositivo({ fetchSinCuenta: s.fetchImpl }), { ok: true, local: true });
  assert.deepEqual(s.llamadas.map((l) => [l.url, l.cuerpo]), [['https://rwadar.pages.dev/api/avisos/movil', { accion: 'baja', token: TOKEN }]]);
  assert.equal(mapa.has(CLAVE), false);
  assert.equal(mapa.get('otra.app'), 'conservar');
  // Sin conexión: la clave se queda para reintentarlo, y el borrado no falla.
  mapa.set(CLAVE, JSON.stringify(guardado()));
  assert.deepEqual(await d.borrarDatosDispositivo({ fetchSinCuenta: servidor({ baja: new Error('sin red') }).fetchImpl }), { ok: true, local: true });
  assert.equal(mapa.has(CLAVE), true);
  // No está entre lo que se borra sin más (lib/acceso-obligatorio.js).
  const { clavesPrivadasDispositivo } = require('../lib/acceso-obligatorio');
  assert.deepEqual(clavesPrivadasDispositivo([CLAVE]), []);
});

/* El bloque con un React de juguete (hooks aislados) y un gestor falso. */
const colores = new Proxy({}, { get: (_, clave) => `#${String(clave)}` });
const tema = { C: colores, F: { regular: 'r', negrita: 'n', semi: 's', media: 'm' },
  T: { cuerpo: {}, cuerpoFte: {}, menor: {}, ficha: {}, seccion: {}, etiqueta: {}, dato: {} }, R: { s: 8, m: 12, l: 16, p: 999 }, UI: { boton: 48, tactil: 48 } };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...(arbol.children || []).flatMap(nodos)];
}
const texto = (arbol) => nodos(arbol).filter((n) => typeof n === 'string').join(' ');
const boton = (arbol, etiqueta) => nodos(arbol).find((n) => n.type === 'Pressable' && n.props.accessibilityLabel === etiqueta);
function cargarComponente(archivo, react, nativo, mocks = {}) {
  const absoluto = path.join(RAIZ, 'componentes', archivo);
  const original = Module._load, extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/avisos' || pedido === '../lib/datos') return {};
      if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    modulo._compile(babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] }).code, ruta);
  };
  delete require.cache[absoluto];
  try { return require(absoluto); } finally { Module._load = original; Module._extensions['.js'] = extension; }
}
function crearReact() {
  const slots = [], efectos = [], pendientes = [];
  let indice = 0, cambiado = false;
  const react = {
    createElement(tipo, props, ...children) { if (typeof tipo === 'function') return tipo({ ...props, children }); return { type: tipo, props: props || {}, children }; },
    useState(inicial) { const i = indice++; if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (v) => { const nuevo = typeof v === 'function' ? v(slots[i]) : v; if (!Object.is(slots[i], nuevo)) { slots[i] = nuevo; cambiado = true; } }]; },
    useRef(inicial) { const i = indice++; if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial }; return slots[i]; },
    useEffect(fn, deps) { const i = indice++; if (!efectos[i] || !deps || deps.some((v, j) => !Object.is(v, efectos[i].deps[j]))) pendientes.push(() => { efectos[i]?.limpiar?.(); efectos[i] = { deps, limpiar: fn() }; }); },
  };
  return { react, pintar(render) {
    for (let v = 0; v < 20; v++) { indice = 0; cambiado = false; const salida = render(); while (pendientes.length) pendientes.shift()(); if (!cambiado) return salida; }
    throw new Error('el componente no se estabiliza');
  } };
}
const nativoFalso = (() => { const n = { StyleSheet: { create: (s) => s }, Platform: { OS: 'android' }, Linking: { openSettings: async () => {} } };
  for (const t of ['Text', 'View', 'Pressable', 'ActivityIndicator', 'ScrollView', 'TextInput']) n[t] = t; return n; })();
const espera = () => new Promise((r) => setImmediate(r));
function gestorFalso({ estado = 'disponible', textoServidor = sc.validarTexto(TEXTO), activar = { ok: true, estado: 'activo' } } = {}) {
  const llamadas = [];
  let actual = estado;
  return { llamadas, async texto() { llamadas.push('texto'); if (textoServidor instanceof Error) throw textoServidor; return textoServidor; },
    async estado(t) { return t === undefined ? { estado: 'comprobando', activo: actual === 'activo' } : { estado: actual, activo: ['activo', 'sin-permiso', 'texto-nuevo'].includes(actual) }; },
    async activar(t, o) { llamadas.push(['activar', t.version, o]); if (activar.ok) actual = 'activo'; return activar; },
    async desactivar() { llamadas.push('desactivar'); actual = 'disponible'; return { ok: true, confirmada: true }; } };
}
async function montar(props) {
  const h = crearReact();
  const { default: AvisosSinCuenta, TEXTOS_SIN_CUENTA } = cargarComponente('AvisosSinCuenta.js', h.react, nativoFalso,
    { '../lib/avisos-sin-cuenta': sc });
  const pintar = () => h.pintar(() => AvisosSinCuenta(props));
  pintar(); await espera(); await espera();
  return { pintar, TEXTOS_SIN_CUENTA };
}

test('sin cuenta · pantalla de acceso: el texto versionado, qué se guarda, Firebase, la información básica y «Activar…»', async () => {
  const g = gestorFalso();
  const { pintar, TEXTOS_SIN_CUENTA } = await montar({ gestor: g, onAbrirEnlace() {} });
  let arbol = pintar();
  const t = texto(arbol);
  assert.ok(t.includes(TEXTO_ES), 'el texto del permiso, tal cual');
  assert.ok(t.includes(TEXTOS_SIN_CUENTA.movil) && t.includes(TEXTOS_SIN_CUENTA.quien) && t.includes(TEXTOS_SIN_CUENTA.info));
  assert.match(TEXTOS_SIN_CUENTA.info, /^Información básica sobre tus datos \(sin cuenta\)\..*RGPD, art\. 11.*Más información en Privacidad\.$/);
  assert.ok(boton(arbol, 'Leer privacidad'), 'la segunda capa');
  const activar = boton(arbol, 'Activar notificaciones en este móvil');
  assert.ok(activar);
  activar.props.onPress();
  await espera(); await espera();
  arbol = pintar();
  assert.deepEqual(g.llamadas.filter((x) => Array.isArray(x)), [['activar', VERSION, { idioma: 'es', origen: 'perfil' }]]);
  assert.ok(texto(arbol).includes('Notificaciones activadas en este móvil.'));
  assert.ok(boton(arbol, 'Desactivar las notificaciones de este móvil'), 'y ahora se pueden desactivar');
  assert.equal(boton(arbol, 'Activar notificaciones en este móvil'), undefined);
});

test('sin cuenta · activadas con un texto anterior: el texto nuevo, «Activar…» otra vez y «Desactivar»', async () => {
  const g = gestorFalso({ estado: 'texto-nuevo' });
  const { pintar, TEXTOS_SIN_CUENTA } = await montar({ gestor: g });
  let arbol = pintar();
  assert.ok(texto(arbol).includes(TEXTO_ES) && texto(arbol).includes(TEXTOS_SIN_CUENTA.estados['texto-nuevo']));
  assert.ok(boton(arbol, 'Desactivar las notificaciones de este móvil'), 'siguen activas: se pueden quitar');
  boton(arbol, 'Activar notificaciones en este móvil').props.onPress();
  await espera(); await espera();
  arbol = pintar();
  assert.deepEqual(g.llamadas.filter((x) => Array.isArray(x)), [['activar', VERSION, { idioma: 'es', origen: 'perfil' }]]);
  assert.equal(boton(arbol, 'Activar notificaciones en este móvil'), undefined);
});

test('sin cuenta · base apagada, 1.4.1, error y desde una notificación (la baja arriba)', async () => {
  let arbol = (await montar({ gestor: gestorFalso({ estado: 'apagado', textoServidor: { activo: false, version: null, texto: null } }) })).pintar();
  assert.ok(texto(arbol).includes('Las notificaciones sin cuenta todavía no están disponibles. Pronto podrás activarlas aquí.'));
  assert.equal(boton(arbol, 'Activar notificaciones en este móvil'), undefined, 'con calma, sin botón');
  const m141 = await montar({ gestor: gestorFalso({ estado: 'requiere-version' }) });
  arbol = m141.pintar();
  assert.ok(texto(arbol).includes('Llegan con la versión 1.4.2 de la app.'));
  assert.ok(!texto(arbol).includes(m141.TEXTOS_SIN_CUENTA.quien), 'con la 1.4.1 no se habla del latido de Firebase: no se activan');
  arbol = (await montar({ gestor: gestorFalso({ estado: 'error', textoServidor: new Error('sin red') }) })).pintar();
  assert.ok(boton(arbol, 'Reintentar'));
  const g = gestorFalso({ estado: 'activo' });
  const m = await montar({ gestor: g, desdeNotificacion: true });
  arbol = m.pintar();
  const baja = nodos(arbol).find((n) => n?.props?.testID === 'avisosSinCuentaBaja');
  assert.ok(baja, 'abierta desde una notificación: la baja arriba');
  assert.ok(texto(baja).includes('¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.'));
  boton(arbol, 'Desactivar las notificaciones de este móvil').props.onPress();
  await espera(); await espera();
  assert.ok(g.llamadas.includes('desactivar'));
  assert.ok(texto(m.pintar()).includes('Notificaciones desactivadas en este móvil.'));
});

test('sin cuenta · todos los textos del bloque tienen su inglés en el diccionario compartido', () => {
  const archivo = fs.readFileSync(path.join(RAIZ, 'componentes', 'AvisosSinCuenta.js'), 'utf8');
  const ast = babel.parseSync(archivo, { babelrc: false, configFile: false, sourceType: 'module', parserOpts: { plugins: ['jsx'] } });
  const frases = new Set();
  babel.traverse(ast, { StringLiteral(r) { if (!r.parentPath.isImportDeclaration() && /^[A-ZÁÉÍÓÚ¿«]/.test(r.node.value) && / /.test(r.node.value)) frases.add(r.node.value); } });
  assert.ok(frases.size >= 15, `solo ${frases.size} frases`);
  for (const es of frases) assert.notEqual(idioma.ingles(es), es, `falta el inglés de: ${es}`);
  for (const es of ['Sin cuenta', 'Este móvil también tiene activadas las notificaciones sin cuenta: te llegan aunque cierres sesión.',
    'Desactivar las notificaciones sin cuenta']) assert.notEqual(idioma.ingles(es), es, es);
});

test('sin cuenta · se pinta también con React y react-native-web reales', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const rnw = require('react-native-web');
  const { default: AvisosSinCuenta } = cargarComponente('AvisosSinCuenta.js', React, rnw, { '../lib/avisos-sin-cuenta': sc });
  const html = renderToStaticMarkup(React.createElement(AvisosSinCuenta, { gestor: gestorFalso(), onAbrirEnlace() {} }));
  assert.match(html, /Notificaciones en este móvil/);
  assert.match(html, /Información básica sobre tus datos \(sin cuenta\)/);
  assert.doesNotMatch(html, /undefined|ExponentPushToken/);
});

test('sin cuenta · en la app: dentro de la pantalla de acceso, encima del formulario; renovación al abrir; convivencia con la cuenta', () => {
  const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
  const acceso = leer('componentes', 'AccesoObligatorio.js');
  assert.ok(acceso.indexOf('<AvisosSinCuenta') > 0 && acceso.indexOf('<AvisosSinCuenta') < acceso.indexOf('<Cuenta controlador'), 'encima del formulario');
  const app = leer('App.js');
  assert.match(app, /const AVISOS_SIN_CUENTA_ACTIVOS = AVISOS_SIN_CUENTA_REMOTOS === true;/);
  assert.match(app, /sinCuenta=\{AVISOS_SIN_CUENTA_ACTIVOS \? \{ desdeNotificacion: Boolean\(destinoAvisoPendiente\) \} : null\}/);
  assert.match(app, /g\.renovar\(\)\.catch\(\(\) => \{\}\)/, 'una vez al abrir (el gestor la limita a una al día)');
  assert.match(app, /sinCuenta: AVISOS_SIN_CUENTA_ACTIVOS \? gestorSinCuenta\(\) : null/, 'con sesión, «Desactivar» quita también las de sin cuenta');
  assert.match(app, /onDesactivarSinCuenta=\{novedadesCuenta\.desactivarSinCuenta\}/);
  assert.match(app, /estadoAvisosMovil\(novedadesCuenta, \{ sinCuenta: sinCuentaActiva \}\)/, 'activas sin cuenta: la ventana no las vuelve a pedir');
  const modo = leer('lib', 'modo-local.js');
  assert.match(modo, /export const AVISOS_SIN_CUENTA_REMOTOS = true;/, 'encendido en el código (la base nace apagada)');
  const avisos = leer('componentes', 'AvisosNovedades.js');
  assert.match(avisos, /if \(sinCuenta && vista\.sinCuenta\) \{ try \{ await sinCuenta\.desactivar\(\); \}/);
  // Cerrar sesión no las toca: quitarPushAlSalir solo quita el token de la cuenta.
  const inicioSalir = avisos.indexOf('export async function quitarPushAlSalir');
  const salir = avisos.slice(inicioSalir, avisos.indexOf('\n}\n', inicioSalir));
  assert.doesNotMatch(salir, /sinCuenta|sin-cuenta/);
  // Solo habla con el servidor de la web, nunca con Supabase.
  const lib = leer('lib', 'avisos-sin-cuenta.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(lib, /supabase|clienteCatalogo|\.rpc\(/i);
  assert.deepEqual([...lib.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1]), ['./avisos-cuenta'], 'sin React Native ni SDK');
  const { estadoAvisosMovil } = require('../lib/novedades-rwadar');
  assert.equal(estadoAvisosMovil({ activo: true, movil: { activo: false }, servidor: { novedades: true } }, { sinCuenta: true }), 'activos');
  assert.equal(estadoAvisosMovil({ activo: true, movil: { activo: false }, servidor: { novedades: true } }), 'inactivos');
});
