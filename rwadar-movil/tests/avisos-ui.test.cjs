'use strict';

/* Avisos de novedades en la interfaz (contrato del 05/11/2026): casillas del
   alta, Perfil › Avisos con la 1.4.1 y con la 1.4.2 (SDK simulado), tarjeta
   de Inicio, enrutado de una notificación tocada, cierre de sesión y textos.
   Sin Expo, red ni permisos: hooks aislados y dobles locales. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const { soporteIdioma } = require('./soporte-idioma.cjs');
const avisosCuenta = require('../lib/avisos-cuenta');
const idioma = require('../lib/idioma');

const RAIZ = path.resolve(__dirname, '..');
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'ExponentPushToken[abcdefghijklmnop1234]';
const colores = new Proxy({}, { get: (_, clave) => `#${String(clave)}` });
const tema = { C: colores, F: { regular: 'r', negrita: 'n', semi: 's', media: 'm' },
  T: { cuerpo: {}, cuerpoFte: {}, menor: {}, ficha: {}, seccion: {}, etiqueta: {}, dato: {} },
  R: { s: 8, m: 12, l: 16, p: 999 }, UI: { boton: 48, tactil: 48 } };

function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...(arbol.children || []).flatMap(nodos)];
}
function texto(arbol) { return nodos(arbol).filter((n) => typeof n === 'string').join(' '); }
function boton(arbol, etiqueta) { return nodos(arbol).find((n) => n.type === 'Pressable' && n.props.accessibilityLabel === etiqueta); }

function cargarComponente(archivo, react, mocks) {
  const absoluto = path.join(RAIZ, 'componentes', archivo);
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Keyboard: { dismiss() {} }, Platform: { OS: 'android' } };
  for (const tipo of ['Text', 'TextInput', 'View', 'Pressable', 'ActivityIndicator', 'KeyboardAvoidingView']) nativo[tipo] = tipo;
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      if (pedido === '../lib/tema') return tema;
      if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    const { code } = babel.transformSync(fs.readFileSync(ruta, 'utf8'), {
      filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] });
    modulo._compile(code, ruta);
  };
  delete require.cache[absoluto];
  try { return require(absoluto); } finally { Module._load = original; Module._extensions['.js'] = extension; }
}

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

/* ---------------------------------------------------------------------
   Alta: casilla de 18 años siempre; casilla de avisos solo con el interruptor
   --------------------------------------------------------------------- */
function alta(avisosNovedades) {
  const h = crearReact(), llamadas = [];
  const Cuenta = cargarComponente('Cuenta.js', h.react, {});
  const controlador = { cancelar() {}, async registrar(datos) { llamadas.push(datos); return { ok: true }; } };
  let estado = { disponible: true, estado: 'sin-sesion', usuario: null, perfil: null, vigiladas: [], procesando: false };
  const props = avisosNovedades === undefined ? {} : { avisosNovedades };
  const pintar = () => h.pintar(() => Cuenta.default({ controlador, estado, plataformas: [], onAbrirEnlace() {}, ...props }));
  return {
    llamadas, pintar,
    autenticar() { estado = { ...estado, estado: 'autenticada', usuario: { id: UID, correo: 'ana@ejemplo.test' },
      perfil: { id: UID, nombre: 'Ana' } }; return pintar(); },
    async pulsar(etiqueta) {
      const b = boton(pintar(), etiqueta); assert.ok(b, `Falta ${etiqueta}`);
      b.props.onPress(); await Promise.resolve(); await Promise.resolve(); return pintar();
    },
    escribir(etiqueta, valor) {
      const campo = nodos(pintar()).find((n) => n.type === 'TextInput' && n.props.accessibilityLabel === etiqueta);
      campo.props.onChangeText(valor); return pintar();
    },
  };
}
const EDAD = 'Tengo 18 años o más, acepto las condiciones y he leído la privacidad';

test('alta con el interruptor apagado: casilla de 18 años, sin casilla de avisos ni datos nuevos', async () => {
  for (const flag of [undefined, false]) {
    const p = alta(flag);
    await p.pulsar('Crear una cuenta gratis');
    assert.equal(boton(p.pintar(), avisosCuenta.TEXTO_AVISOS_ES), undefined);
    assert.match(texto(p.pintar()), /No te suscribes a publicidad ni a avisos/);
    assert.match(texto(p.pintar()), /Tengo 18 años o más, acepto las condiciones y he leído la privacidad\./);
    p.escribir('Correo', 'ana@ejemplo.test'); p.escribir('Contraseña · mínimo 12 caracteres', 'clave de prueba local');
    await p.pulsar('Crear cuenta');
    assert.match(texto(p.pintar()), /Confirma que tienes 18 años o más/);
    assert.equal(p.llamadas.length, 0);
    await p.pulsar(EDAD);
    await p.pulsar('Crear cuenta');
    assert.deepEqual(p.llamadas, [{ correo: 'ana@ejemplo.test', clave: 'clave de prueba local', nombre: '', aceptaCondiciones: true }]);
    assert.match(texto(p.autenticar()), /ni activan avisos por correo/);
  }
});

test('alta con el interruptor encendido: casilla opcional, sin marcar, con el texto exacto del contrato', async () => {
  for (const marcar of [false, true]) {
    const p = alta(true);
    await p.pulsar('Crear una cuenta gratis');
    const casilla = boton(p.pintar(), avisosCuenta.TEXTO_AVISOS_ES);
    assert.ok(casilla, 'falta la casilla de avisos');
    assert.equal(casilla.props.accessibilityRole, 'checkbox');
    assert.equal(casilla.props.accessibilityState.checked, false, 'nace sin marcar');
    assert.ok(texto(casilla).includes(avisosCuenta.TEXTO_AVISOS_ES));
    assert.match(texto(p.pintar()), /Los avisos de novedades solo llegan si marcas su casilla y confirmas el correo/);
    assert.doesNotMatch(texto(p.pintar()), /No te suscribes a publicidad ni a avisos/);
    p.escribir('Correo', 'ana@ejemplo.test'); p.escribir('Contraseña · mínimo 12 caracteres', 'clave de prueba local');
    if (marcar) await p.pulsar(avisosCuenta.TEXTO_AVISOS_ES);
    await p.pulsar('Crear cuenta');
    assert.equal(p.llamadas.length, 0, 'la casilla de avisos no sustituye a la de 18 años');
    await p.pulsar(EDAD);
    await p.pulsar('Crear cuenta');
    assert.deepEqual(p.llamadas, [{ correo: 'ana@ejemplo.test', clave: 'clave de prueba local', nombre: '',
      aceptaCondiciones: true, avisosNovedades: marcar }]);
    assert.match(texto(p.autenticar()), /ni activan avisos sobre cada empresa/);
  }
});

/* ---------------------------------------------------------------------
   Perfil › Avisos: hook real + panel, con la 1.4.1 y con la 1.4.2
   --------------------------------------------------------------------- */
function estadoServidor(cambios = {}) {
  return { novedades: false, version: null, aceptado_el: null, version_vigente: avisosCuenta.VERSION_AVISOS,
    texto_es: avisosCuenta.TEXTO_AVISOS_ES, texto_en: avisosCuenta.TEXTO_AVISOS_EN, dispositivos: 0,
    correo_activo: false, push_activo: true, ...cambios };
}

function perfil({ capacidad, sistema = {}, servidor = estadoServidor(), recientes = [] }) {
  const h = crearReact(), rpc = [], sdk = [], local = { leidos: [], token: null };
  let estado = servidor;
  const cliente = { rpc(nombre, args) {
    rpc.push([nombre, args]);
    let data = null;
    if (nombre === 'estado_mis_avisos') data = estado;
    if (nombre === 'configurar_avisos_novedades') { estado = { ...estado, novedades: args.p_activar }; data = estado; }
    if (nombre === 'registrar_aviso_push') data = true;
    if (nombre === 'quitar_aviso_push') data = true;
    if (nombre === 'mis_avisos_recientes') data = recientes;
    return { abortSignal: async () => ({ data, error: null }) };
  } };
  const cuenta = { estado: () => ({ usuario: { id: UID } }), clienteCatalogo: async () => cliente,
    suscribir(fn) { fn({ usuario: { id: UID } }); return () => {}; } };
  const prohibido = (nombre) => () => { sdk.push(nombre); throw new Error(`SDK llamado por debajo del código 24: ${nombre}`); };
  const modulo = cargarComponente('AvisosNovedades.js', h.react, {
    '../lib/avisos': {
      capacidadPushNovedades: () => capacidad,
      consultarPushNovedades: capacidad ? async () => { sdk.push('consultar'); // Tras conceder el permiso, el sistema lo da por permitido.
        return sistema.consulta || (local.token ? { ok: true, estado: 'permitido' } : { ok: false, estado: 'disponible' }); } : prohibido('consultar'),
      obtenerTokenNovedades: capacidad ? async (opciones) => { sdk.push(['token', opciones]); return sistema.token || { ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' }; } : prohibido('token'),
    },
    '../lib/datos': {
      avisosLeidos: async () => local.leidos,
      marcarAvisosLeidos: async (_, ids) => { local.leidos = [...new Set([...ids, ...local.leidos])]; return local.leidos; },
      tokenPushNovedades: async () => local.token,
      guardarTokenPushNovedades: async (_, t) => { local.token = t; },
      borrarTokenPushNovedades: async () => { local.token = null; },
    },
  });
  let ultimo;
  const pintar = () => {
    ultimo = h.pintar(() => modulo.useAvisosNovedades({ cuenta, usuarioId: UID }));
    return modulo.PanelAvisosNovedades({ estado: ultimo, onAlternarNovedades: ultimo.alternarNovedades,
      onAlternarMovil: ultimo.alternarMovil, onAjustes: () => sdk.push('ajustes'), onReintentar: ultimo.recargar });
  };
  const esperar = async () => { for (let i = 0; i < 12; i++) { await new Promise((r) => setImmediate(r)); pintar(); } return pintar(); };
  return { modulo, rpc, sdk, local, pintar, esperar, estadoHook: () => ultimo, h,
    async pulsar(etiqueta) { const b = boton(pintar(), etiqueta); assert.ok(b, `Falta ${etiqueta}`);
      assert.ok(!b.props.disabled, `${etiqueta} está deshabilitado`); b.props.onPress(); return esperar(); } };
}

test('Perfil con la 1.4.1 (código 23): el móvil anuncia la 1.4.2, no toca el SDK y el permiso funciona', async () => {
  const p = perfil({ capacidad: false });
  const panel = await p.esperar();
  const movil = boton(panel, 'Notificaciones en este móvil');
  assert.equal(movil.props.accessibilityRole, 'switch');
  assert.equal(movil.props.disabled, true);
  assert.equal(movil.props.accessibilityState.checked, false);
  assert.match(texto(panel), /Llegan con la versión 1\.4\.2 de la app/);
  assert.ok(texto(panel).includes(avisosCuenta.TEXTO_AVISOS_ES), 'enseña el texto del permiso');
  const novedades = boton(panel, 'Avisos de novedades (correo y móvil)');
  assert.equal(novedades.props.accessibilityState.checked, false);
  const activado = await p.pulsar('Avisos de novedades (correo y móvil)');
  assert.equal(boton(activado, 'Avisos de novedades (correo y móvil)').props.accessibilityState.checked, true);
  assert.match(texto(activado), /Avisos de novedades activados/);
  assert.deepEqual(p.rpc.find(([n]) => n === 'configurar_avisos_novedades'),
    ['configurar_avisos_novedades', { p_activar: true, p_version: 'novedades-v1-2026-11-05', p_canal: 'app' }]);
  const desactivado = await p.pulsar('Avisos de novedades (correo y móvil)');
  assert.match(texto(desactivado), /Avisos de novedades desactivados/);
  assert.deepEqual(p.sdk, [], 'por debajo del código 24 no se llama al SDK');
  assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false);
  p.h.desmontar();
});

test('Perfil con la 1.4.2 (código 24): pide permiso solo al pulsar, registra el token y lo quita', async () => {
  const p = perfil({ capacidad: true });
  let panel = await p.esperar();
  assert.deepEqual(p.sdk, ['consultar'], 'al abrir solo se consulta, sin pedir permiso');
  assert.match(texto(panel), /el sistema te pedirá permiso/);
  panel = await p.pulsar('Notificaciones en este móvil');
  assert.deepEqual(p.sdk[1], ['token', { solicitarPermiso: true }]);
  assert.deepEqual(p.rpc.find(([n]) => n === 'registrar_aviso_push'), ['registrar_aviso_push', { p_token: TOKEN, p_plataforma: 'android' }]);
  assert.equal(p.local.token, TOKEN);
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.accessibilityState.checked, true);
  assert.match(texto(panel), /Notificaciones activadas en este móvil/);
  assert.match(texto(panel), /solo recibe avisos de servicio/, 'sin el permiso de novedades solo hay avisos de servicio');
  panel = await p.pulsar('Notificaciones en este móvil');
  assert.deepEqual(p.rpc.filter(([n]) => n === 'quitar_aviso_push'), [['quitar_aviso_push', { p_token: TOKEN }]]);
  assert.equal(p.local.token, null);
  assert.match(texto(panel), /Notificaciones desactivadas en este móvil/);
  p.h.desmontar();
});

test('Perfil con la 1.4.2: permiso denegado ofrece los ajustes y no registra nada', async () => {
  const p = perfil({ capacidad: true, sistema: { token: { ok: false, estado: 'denegado' } } });
  await p.esperar();
  const panel = await p.pulsar('Notificaciones en este móvil');
  assert.match(texto(panel), /El sistema no permite notificaciones de RWAdar/);
  assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false);
  assert.equal(p.local.token, null);
  const q = perfil({ capacidad: true, sistema: { consulta: { ok: false, estado: 'denegado' } } });
  const denegado = await q.esperar();
  assert.equal(boton(denegado, 'Notificaciones en este móvil').props.disabled, true);
  boton(denegado, 'Abrir ajustes').props.onPress();
  assert.ok(q.sdk.includes('ajustes'));
  p.h.desmontar(); q.h.desmontar();
});

test('Perfil con la 1.4.2 y el push de la base apagado: no se ofrece ni se consulta el sistema', async () => {
  const p = perfil({ capacidad: true, servidor: estadoServidor({ push_activo: false }) });
  const panel = await p.esperar();
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.disabled, true);
  assert.match(texto(panel), /todavía no están activas/);
  assert.match(texto(panel), /El envío por correo y al móvil todavía no está activo/);
  assert.deepEqual(p.sdk, []);
  p.h.desmontar();
});

test('Perfil con otro texto vigente en la base: no se puede activar desde esta versión', async () => {
  const p = perfil({ capacidad: false, servidor: estadoServidor({ version_vigente: 'novedades-v2-2026-12-01' }) });
  const panel = await p.esperar();
  assert.equal(boton(panel, 'Avisos de novedades (correo y móvil)').props.disabled, true);
  assert.match(texto(panel), /actualiza la app: el texto del permiso ha cambiado/);
  assert.equal(p.rpc.some(([n]) => n === 'configurar_avisos_novedades'), false);
  p.h.desmontar();
});

/* ---------------------------------------------------------------------
   Inicio: tarjeta «Avisos» con punto de no leído
   --------------------------------------------------------------------- */
const RECIENTES = [
  { id: '9', tipo: 'ofertas', titulo: '2 fichas nuevas en el radar de RWAdar', texto: 'Consulta en el radar qué ha entrado.',
    enlace: 'https://rwadar.pages.dev/#emisiones', creado_el: '2026-11-05T10:00:00Z' },
  { id: '8', tipo: 'novedad', titulo: 'Lección nueva', texto: 'Ya está la lección 7.', enlace: 'https://evil.test/',
    creado_el: '2026-11-04T10:00:00Z' },
  { id: 'bienvenida', tipo: 'bienvenida', titulo: 'Te damos la bienvenida a RWAdar',
    texto: 'Tu cuenta está confirmada y la Academy ya está desbloqueada: es gratis con tu cuenta.',
    enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-01T10:00:00Z' },
];

test('Inicio: los últimos avisos válidos, con punto de no leído que se guarda al abrirlos', async () => {
  const p = perfil({ capacidad: false, recientes: RECIENTES });
  await p.esperar();
  const hook = p.estadoHook();
  assert.deepEqual(hook.avisos.map((x) => x.id), ['9', 'bienvenida'], 'el aviso con enlace ajeno no se enseña');
  assert.equal(hook.noLeidos, 2);
  assert.deepEqual(p.rpc.find(([n]) => n === 'mis_avisos_recientes'), ['mis_avisos_recientes', { p_limite: 10 }]);
  const abiertos = [], marcados = [];
  const tarjeta = () => p.modulo.TarjetaAvisosInicio({ avisos: p.estadoHook().avisos, leidos: p.estadoHook().leidos,
    onAbrir: (aviso) => { abiertos.push(aviso.id); p.estadoHook().marcarLeidos([aviso.id]); },
    onMarcarLeidos: (ids) => { marcados.push(ids); p.estadoHook().marcarLeidos(ids); } });
  let t = tarjeta();
  assert.match(texto(t), /Avisos/);
  assert.match(texto(t), /2 fichas nuevas en el radar de RWAdar/);
  const aviso = boton(t, '2 fichas nuevas en el radar de RWAdar');
  assert.equal(aviso.props.accessibilityHint, 'Sin leer');
  aviso.props.onPress();
  await p.esperar();
  assert.deepEqual(abiertos, ['9']);
  assert.deepEqual(p.local.leidos, ['9'], 'leído se guarda en el dispositivo');
  t = tarjeta();
  assert.equal(boton(t, '2 fichas nuevas en el radar de RWAdar').props.accessibilityHint, undefined);
  assert.equal(p.estadoHook().noLeidos, 1);
  boton(t, 'Marcar como leídos').props.onPress();
  await p.esperar();
  assert.deepEqual(marcados, [['bienvenida']]);
  assert.equal(p.estadoHook().noLeidos, 0);
  assert.equal(boton(tarjeta(), 'Marcar como leídos'), undefined);
  const vacia = p.modulo.TarjetaAvisosInicio({ avisos: [], leidos: [] });
  assert.match(texto(vacia), /Aquí verás las ofertas nuevas del radar/);
  p.h.desmontar();
});

test('sin cuenta (interruptor apagado) el hook no llama a nada', async () => {
  const h = crearReact();
  const prohibido = () => assert.fail('no debe llamarse');
  const modulo = cargarComponente('AvisosNovedades.js', h.react, {
    '../lib/avisos': { capacidadPushNovedades: prohibido, consultarPushNovedades: prohibido, obtenerTokenNovedades: prohibido },
    '../lib/datos': new Proxy({}, { get: () => prohibido }),
  });
  const cuenta = { estado: prohibido, clienteCatalogo: prohibido, suscribir: prohibido };
  const estado = h.pintar(() => modulo.useAvisosNovedades({ cuenta, usuarioId: null }));
  assert.equal(estado.activo, false);
  assert.equal(estado.noLeidos, 0);
  await estado.alternarNovedades(); await estado.alternarMovil(); await estado.marcarLeidos(['9']); estado.recargar();
  await new Promise((r) => setImmediate(r));
  h.desmontar();
});

test('al cerrar sesión se quita el token de este móvil con el cliente que se cierra', async () => {
  const h = crearReact(), local = { token: TOKEN }, rpc = [];
  const modulo = cargarComponente('AvisosNovedades.js', h.react, {
    '../lib/avisos': {},
    '../lib/datos': { tokenPushNovedades: async (uid) => (uid === UID ? local.token : null),
      borrarTokenPushNovedades: async () => { local.token = null; } },
  });
  const cliente = { async rpc(nombre, args) { rpc.push([nombre, args]); return { data: true, error: null }; } };
  assert.equal(await modulo.quitarPushAlSalir({ cliente, usuarioId: UID }), true);
  assert.deepEqual(rpc, [['quitar_aviso_push', { p_token: TOKEN }]]);
  assert.equal(local.token, null);
  assert.equal(await modulo.quitarPushAlSalir({ cliente, usuarioId: UID }), false, 'sin token no se llama');
  assert.equal(rpc.length, 1);
  local.token = TOKEN;
  const fallo = { async rpc() { return { data: null, error: { code: '500' } }; } };
  await assert.rejects(modulo.quitarPushAlSalir({ cliente: fallo, usuarioId: UID }));
  assert.equal(local.token, TOKEN, 'si falla, se conserva para quitarlo la próxima vez');
});

/* ---------------------------------------------------------------------
   App: conexiones y textos que dependen del interruptor
   --------------------------------------------------------------------- */
const APP = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
const AST = babel.parseSync(APP, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
function funcionApp(nombre, entorno) {
  const ast = babel.types.cloneNode(AST, true);
  ast.program.body = ast.program.body.filter((n) => n.type === 'FunctionDeclaration' && n.id.name === nombre);
  const js = babel.transformFromAstSync(ast, APP, { babelrc: false, configFile: false, plugins: [jsx] }).code;
  const base = { React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) }, ...entorno };
  return new Function(...Object.keys(base), `${js}; return ${nombre};`)(...Object.values(base));
}
function efectoApp(fragmento) {
  let efecto;
  babel.traverse(AST, { CallExpression(ruta) {
    if (ruta.node.callee.name === 'useEffect' && APP.slice(ruta.node.start, ruta.node.end).includes(fragmento)) efecto = ruta.node.arguments[0];
  } });
  assert.ok(efecto, fragmento);
  return babel.transformFromAstSync(babel.types.file(babel.types.program([babel.types.expressionStatement(efecto)])),
    null, { babelrc: false, configFile: false }).code.replace(/;\s*$/, '');
}

test('Privacidad: con el interruptor apagado, las frases de hoy; encendido, las nuevas', () => {
  const entorno = { MODO_LOCAL: false, USUARIO_LOCAL: true, e: {}, C: {}, URL_PRIVACIDAD: 'https://rwadar.pages.dev/privacidad', abrirEnlace() {} };
  for (const n of ['Modal', 'SafeAreaProvider', 'SafeAreaView', 'View', 'Text', 'ScrollView', 'Pressable', 'ActivityIndicator']) entorno[n] = n;
  const Privacidad = funcionApp('Privacidad', entorno);
  const hoy = texto(Privacidad({ estadoCuenta: { disponible: true } }));
  assert.match(hoy, /No se activan opiniones, publicidad, avisos por correo ni push al registrarte/);
  assert.match(hoy, /Instalaciones y avisos desactivados/);
  assert.match(hoy, /No se solicitan permisos push, obtienen tokens ni registran instalaciones/);
  assert.doesNotMatch(hoy, /Avisos de novedades|Brevo/);
  const v141 = texto(Privacidad({ estadoCuenta: { disponible: true }, avisosNovedades: true, pushNovedades: false }));
  assert.doesNotMatch(v141, /No se activan opiniones, publicidad, avisos por correo ni push|Instalaciones y avisos desactivados/);
  assert.match(v141, /Los avisos de novedades solo se activan si marcas su casilla/);
  assert.match(v141, /solo se activan con tu permiso/);
  assert.match(v141, /las notificaciones en el móvil llegan con la versión 1\.4\.2/);
  assert.doesNotMatch(v141, /Brevo/, 'el correo no se describe hasta que la base lo encienda');
  const v142 = texto(Privacidad({ estadoCuenta: { disponible: true }, avisosNovedades: true, pushNovedades: true,
    estadoNovedades: { correoActivo: true } }));
  assert.match(v142, /Si activas «Notificaciones en este móvil», el sistema te pedirá permiso/);
  assert.match(v142, /Expo y Firebase Cloud Messaging/);
  assert.match(v142, /a través de Brevo, sin píxel ni seguimiento de clics/);
});

test('Perfil: con el interruptor, el panel de la cuenta sustituye a «Próximamente»', () => {
  const entorno = { useState: (i) => [typeof i === 'function' ? i() : i, () => {}], useEffect() {}, MODO_LOCAL: false,
    USUARIO_LOCAL: true, e: {}, C: {}, crearCarteraCuenta() {} };
  for (const n of ['View', 'Text', 'ScrollView', 'RefreshControl', 'Pressable', 'Marca', 'Icono', 'Cuenta', 'GrupoMenu', 'FilaMenu',
    'PanelAvisos', 'ActivityIndicator', 'MisInversiones']) entorno[n] = n;
  const PantallaPerfil = funcionApp('PantallaPerfil', entorno);
  const hoy = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [] });
  assert.match(texto(hoy), /Los avisos llegarán a la app en una próxima actualización/);
  assert.equal(nodos(hoy).find((n) => n.type === 'Cuenta').props.avisosNovedades, false);
  const conAvisos = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [],
    avisosNovedades: true, panelNovedades: { type: 'PanelNovedades', props: {}, children: [] } });
  assert.doesNotMatch(texto(conAvisos), /Próximamente|Los avisos llegarán a la app/);
  assert.ok(nodos(conAvisos).some((n) => n.type === 'PanelNovedades'));
  assert.equal(nodos(conAvisos).find((n) => n.type === 'Cuenta').props.avisosNovedades, true);
});

test('App: solo con el interruptor se observan las novedades y se pinta la tarjeta, el panel y la casilla', () => {
  const crear = new Function('observarAperturasAvisos', 'setSlugAvisoPendiente', 'setDestinoAvisoPendiente',
    'AVISOS_NOVEDADES_ACTIVOS', `return (${efectoApp('observarAperturasAvisos((slug)')});`);
  for (const activo of [false, true]) {
    const vistos = [], destinos = [];
    crear((onAbrir, opciones) => { vistos.push([onAbrir, opciones]); return () => {}; }, () => {}, (d) => destinos.push(d), activo)();
    assert.equal(typeof vistos[0][0], 'function');
    assert.equal(typeof vistos[0][1].onDestino, activo ? 'function' : 'undefined');
    if (activo) {
      assert.equal(vistos[0][1].onDestino({ tipo: 'ofertas', destino: 'buscar' }), true);
      assert.deepEqual(destinos, [{ tipo: 'ofertas', destino: 'buscar' }]);
    }
  }
  assert.match(APP, /const AVISOS_NOVEDADES_ACTIVOS = CUENTA_REMOTA_ACTIVA && AVISOS_NOVEDADES_REMOTOS === true;/);
  assert.match(APP, /useAvisosNovedades\(\{ cuenta, usuarioId: AVISOS_NOVEDADES_ACTIVOS \? usuarioAdmitido : null \}\)/);
  assert.match(APP, /tarjetaAvisos=\{AVISOS_NOVEDADES_ACTIVOS \? \(/);
  assert.match(APP, /panelNovedades=\{AVISOS_NOVEDADES_ACTIVOS \? \(/);
  assert.match(APP, /<AccesoObligatorio[^>]*avisosNovedades=\{AVISOS_NOVEDADES_ACTIVOS\}/);
  assert.match(APP, /antesDeSalir: AVISOS_NOVEDADES_REMOTOS === true \? quitarPushAlSalir : null/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'componentes', 'AccesoObligatorio.js'), 'utf8'), /avisosNovedades=\{avisosNovedades === true\}/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'componentes', 'Inicio.js'), 'utf8'), /tarjetaAvisos = null,[\s\S]*\{tarjetaAvisos\}/);
  const modo = fs.readFileSync(path.join(RAIZ, 'lib', 'modo-local.js'), 'utf8');
  assert.match(modo, /export const AVISOS_NOVEDADES_REMOTOS = false;/, 'el interruptor nace apagado');
  assert.match(modo, /export const SERVICIOS_USUARIO_REMOTOS = false;/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8')).expo.extra.rwadar.pushDeliveryEnabled, false);
});

test('App: tocar una notificación lleva a inicio, a ofertas nuevas o a la Academy, y espera a la cuenta', () => {
  const crear = new Function('destinoAvisoPendiente', 'cargando', 'usuarioAdmitido', 'setters', 'novedadesCuenta',
    `const { setAbierta, setOfertaAbierta, setExplicando, setPrivacidad, setLeccion, setPestana, setOrdenOfertas,
      setGrupoOfertas, setTipoOferta, setProveedorOferta, setGrupoProveedorAbierto, setBusquedaOfertas, setVistaBuscar,
      setDestinoAvisoPendiente } = setters; return (${efectoApp('destinoAvisoPendiente || cargando')});`);
  function ejecutar(destino, { cargando = false, usuario = UID } = {}) {
    const cambios = {}, recargas = [];
    const setters = new Proxy({}, { get: (_, nombre) => (valor) => { cambios[nombre] = valor; } });
    crear(destino, cargando, usuario, setters, { recargar: () => recargas.push(1) })();
    return { cambios, recargas };
  }
  const ofertas = ejecutar({ tipo: 'ofertas', destino: 'buscar' });
  assert.equal(ofertas.cambios.setPestana, 'buscar');
  assert.equal(ofertas.cambios.setVistaBuscar, 'ofertas');
  assert.equal(ofertas.cambios.setOrdenOfertas, 'nuevas');
  assert.equal(ofertas.cambios.setOfertaAbierta, null);
  assert.equal(ofertas.cambios.setDestinoAvisoPendiente, null);
  assert.equal(ofertas.recargas.length, 1);
  const novedad = ejecutar({ tipo: 'novedad', destino: 'buscar' });
  assert.equal(novedad.cambios.setPestana, 'buscar');
  assert.equal(Object.hasOwn(novedad.cambios, 'setOrdenOfertas'), false);
  assert.equal(ejecutar({ tipo: 'bienvenida', destino: 'academy' }).cambios.setPestana, 'academy');
  assert.equal(ejecutar({ tipo: 'actualizacion', destino: 'inicio' }).cambios.setPestana, 'inicio');
  assert.deepEqual(ejecutar({ tipo: 'ofertas', destino: 'buscar' }, { cargando: true }).cambios, {});
  assert.deepEqual(ejecutar({ tipo: 'ofertas', destino: 'buscar' }, { usuario: null }).cambios, {});
  assert.deepEqual(ejecutar(null).cambios, {});
});

test('todos los textos nuevos de la interfaz tienen su inglés en el diccionario compartido', () => {
  const fuentes = ['componentes/AvisosNovedades.js', 'componentes/Cuenta.js'].map((r) => fs.readFileSync(path.join(RAIZ, r), 'utf8')).join('\n')
    + APP.slice(APP.indexOf('function Privacidad'));
  const candidatos = [...fuentes.matchAll(/'([^'\n]*(?:avisos|Avisos|notificaciones|Notificaciones|18 años|móvil|leídos|Sin leer)[^'\n]*)'/g)]
    .map((m) => m[1]).filter((s) => /^[A-ZÁÉÍÓÚ¿«]/.test(s) && s.length > 6 && !s.includes('${'));
  assert.ok(candidatos.length >= 25, `solo se encontraron ${candidatos.length}`);
  for (const es of candidatos) assert.notEqual(idioma.ingles(es), es, `falta el inglés de: ${es}`);
  for (const es of ['Avisos de novedades (correo y móvil)', 'Notificaciones en este móvil', 'Marcar como leídos', 'Sin leer',
    'Te damos la bienvenida a RWAdar', 'Tu cuenta está confirmada y la Academy ya está desbloqueada: es gratis con tu cuenta.',
    'Para crear la cuenta, confirma que tienes 18 años o más, que aceptas las condiciones y que has leído la privacidad.']) {
    assert.notEqual(idioma.ingles(es), es, es);
  }
  assert.equal(idioma.ingles('2 fichas nuevas en el radar de RWAdar'), '2 new entries on the RWAdar radar');
  assert.equal(idioma.ingles('1 ficha nueva en el radar de RWAdar'), '1 new entry on the RWAdar radar');
  // Todo el texto visible del panel y la tarjeta (literales y texto JSX).
  const archivo = fs.readFileSync(path.join(RAIZ, 'componentes', 'AvisosNovedades.js'), 'utf8');
  const ast = babel.parseSync(archivo, { babelrc: false, configFile: false, sourceType: 'module', parserOpts: { plugins: ['jsx'] } });
  const visibles = new Set();
  babel.traverse(ast, {
    StringLiteral(ruta) { if (!ruta.parentPath.isImportDeclaration()) visibles.add(ruta.node.value); },
    JSXText(ruta) { if (ruta.node.value.trim()) visibles.add(ruta.node.value.trim()); },
  });
  const frases = [...visibles].filter((s) => /^[A-ZÁÉÍÓÚ¿«]/.test(s) && / /.test(s));
  assert.ok(frases.length >= 20, `solo ${frases.length} frases`);
  for (const es of frases) assert.notEqual(idioma.ingles(es), es, `falta el inglés de: ${es}`);
});

test('el panel y la tarjeta se renderizan también con React y react-native-web reales', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const absoluto = path.join(RAIZ, 'componentes', 'AvisosNovedades.js');
  const original = Module._load, extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(React, require('react-native-web'));
      if (pedido === 'react-native') return require('react-native-web');
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/avisos' || pedido === '../lib/datos') return {};
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    modulo._compile(babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false,
      plugins: [jsx, commonjs] }).code, ruta);
  };
  delete require.cache[absoluto];
  let modulo;
  try { modulo = require(absoluto); } finally { Module._load = original; Module._extensions['.js'] = extension; }
  const servidor = avisosCuenta.validarEstadoAvisos(estadoServidor());
  for (const movil of [{ estado: 'requiere-version', activo: false }, { estado: 'activo', activo: true, puedeDesactivar: true }]) {
    const html = renderToStaticMarkup(React.createElement(modulo.PanelAvisosNovedades, {
      estado: { servidor, movil, procesando: '', mensaje: '', error: '' }, onAlternarNovedades() {}, onAlternarMovil() {} }));
    assert.match(html, /role="switch"/);
    assert.match(html, /Avisos de novedades \(correo y móvil\)/);
    assert.doesNotMatch(html, /undefined|ExponentPushToken/);
  }
  const avisos = avisosCuenta.validarAvisosRecientes(RECIENTES);
  const html = renderToStaticMarkup(React.createElement(modulo.TarjetaAvisosInicio, { avisos, leidos: ['9'] }));
  assert.match(html, /Te damos la bienvenida a RWAdar/);
  assert.match(html, /01\/11\/2026/);
  assert.match(html, /Marcar como leídos/);
});
