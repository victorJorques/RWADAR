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
    assert.equal(texto(p.pintar()).includes(avisosCuenta.INFO_BASICA_ES), false, 'sin la información básica de los avisos');
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
  for (const [marcar, idiomaApp] of [[false, 'es'], [true, 'es'], [true, 'en']]) {
    await idioma.cambiarIdioma(idiomaApp);
    const p = alta(true);
    await p.pulsar('Crear una cuenta gratis');
    const casilla = boton(p.pintar(), avisosCuenta.TEXTO_AVISOS_ES);
    assert.ok(casilla, 'falta la casilla de avisos');
    assert.equal(casilla.props.accessibilityRole, 'checkbox');
    assert.equal(casilla.props.accessibilityState.checked, false, 'nace sin marcar');
    assert.ok(texto(casilla).includes(avisosCuenta.TEXTO_AVISOS_ES));
    // Información básica junto a la casilla (lo siguiente que se pinta), fuera
    // de su texto y de su etiqueta accesible.
    const arbol = p.pintar(), orden = nodos(arbol);
    const enArbol = boton(arbol, avisosCuenta.TEXTO_AVISOS_ES);
    const info = orden.find((n) => n.type === 'Text' && texto(n) === avisosCuenta.INFO_BASICA_ES);
    assert.ok(info, 'falta la información básica junto a la casilla');
    assert.equal(texto(casilla).includes('Responsable'), false);
    assert.equal(orden.indexOf(info), orden.indexOf(enArbol) + nodos(enArbol).length, 'justo después de la casilla');
    assert.match(texto(p.pintar()), /Los avisos de novedades solo llegan si marcas su casilla y confirmas el correo/);
    assert.doesNotMatch(texto(p.pintar()), /No te suscribes a publicidad ni a avisos/);
    p.escribir('Correo', 'ana@ejemplo.test'); p.escribir('Contraseña · mínimo 12 caracteres', 'clave de prueba local');
    if (marcar) await p.pulsar(avisosCuenta.TEXTO_AVISOS_ES);
    await p.pulsar('Crear cuenta');
    assert.equal(p.llamadas.length, 0, 'la casilla de avisos no sustituye a la de 18 años');
    await p.pulsar(EDAD);
    await p.pulsar('Crear cuenta');
    // El idioma en que se ve la casilla viaja con el alta (avisos_idioma).
    assert.deepEqual(p.llamadas, [{ correo: 'ana@ejemplo.test', clave: 'clave de prueba local', nombre: '',
      aceptaCondiciones: true, avisosNovedades: marcar, idioma: idiomaApp }]);
    assert.match(texto(p.autenticar()), /ni activan avisos sobre cada empresa/);
  }
  await idioma.cambiarIdioma('es');
});

/* ---------------------------------------------------------------------
   Perfil › Avisos: hook real + panel, con la 1.4.1 y con la 1.4.2
   --------------------------------------------------------------------- */
function estadoServidor(cambios = {}) {
  return { novedades: false, version: null, aceptado_el: null, version_vigente: avisosCuenta.VERSION_AVISOS,
    texto_es: avisosCuenta.TEXTO_AVISOS_ES, texto_en: avisosCuenta.TEXTO_AVISOS_EN, dispositivos: 0,
    correo_activo: false, push_activo: true, ...cambios };
}

function perfil({ capacidad, sistema = {}, servidor = estadoServidor(), recientes = [], token = null, registrado = null }) {
  const h = crearReact(), rpc = [], sdk = [], local = { leidos: [], token, renovado: null };
  let estado = servidor;
  const cliente = { rpc(nombre, args) {
    rpc.push([nombre, args]);
    let data = null;
    if (nombre === 'estado_mis_avisos') data = estado;
    if (nombre === 'configurar_avisos_novedades') { estado = { ...estado, novedades: args.p_activar }; data = estado; }
    if (nombre === 'registrar_aviso_push') data = true;
    if (nombre === 'quitar_aviso_push') data = true;
    if (nombre === 'mis_avisos_recientes') data = recientes;
    // Sin `registrado` (null), como una base sin mi_aviso_push_registrado: 404.
    if (nombre === 'mi_aviso_push_registrado') {
      return { abortSignal: async () => (registrado === null
        ? { data: null, error: { code: 'PGRST202', message: 'Could not find the function' }, status: 404 }
        : { data: args.p_token === local.token && registrado, error: null }) };
    }
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
      renovacionPushNovedades: async () => local.renovado,
      marcarRenovacionPushNovedades: async (_, dia) => { local.renovado = dia; },
    },
  });
  let ultimo;
  const enlaces = [];
  const pintar = () => {
    ultimo = h.pintar(() => modulo.useAvisosNovedades({ cuenta, usuarioId: UID }));
    return modulo.PanelAvisosNovedades({ estado: ultimo, onAlternarNovedades: ultimo.alternarNovedades,
      onAlternarMovil: ultimo.alternarMovil, onAjustes: () => sdk.push('ajustes'), onReintentar: ultimo.recargar,
      onPrivacidad: () => enlaces.push('privacidad') });
  };
  const esperar = async () => { for (let i = 0; i < 12; i++) { await new Promise((r) => setImmediate(r)); pintar(); } return pintar(); };
  return { modulo, rpc, sdk, local, pintar, esperar, estadoHook: () => ultimo, h, enlaces,
    cambiarRegistrado(valor) { registrado = valor; },
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
  // Información básica junto al interruptor, con su enlace a la privacidad.
  assert.ok(nodos(panel).some((n) => n.type === 'Text' && texto(n) === avisosCuenta.INFO_BASICA_ES), 'falta la información básica');
  boton(panel, 'Leer privacidad').props.onPress();
  assert.deepEqual(p.enlaces, ['privacidad']);
  const novedades = boton(panel, 'Avisos de novedades (correo y móvil)');
  assert.equal(novedades.props.accessibilityState.checked, false);
  const activado = await p.pulsar('Avisos de novedades (correo y móvil)');
  assert.equal(boton(activado, 'Avisos de novedades (correo y móvil)').props.accessibilityState.checked, true);
  assert.ok(texto(activado).includes('Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.'));
  assert.deepEqual(p.rpc.find(([n]) => n === 'configurar_avisos_novedades'),
    ['configurar_avisos_novedades', { p_activar: true, p_version: 'novedades-v2-2026-11-06', p_canal: 'app', p_idioma: 'es' }]);
  // Con la app en inglés, el permiso se guarda con p_idioma 'en' (también la baja).
  await idioma.cambiarIdioma('en');
  let desactivado;
  try { desactivado = await p.pulsar('Avisos de novedades (correo y móvil)'); } finally { await idioma.cambiarIdioma('es'); }
  assert.deepEqual(p.rpc.filter(([n]) => n === 'configurar_avisos_novedades')[1],
    ['configurar_avisos_novedades', { p_activar: false, p_version: 'novedades-v2-2026-11-06', p_canal: 'app', p_idioma: 'en' }]);
  assert.match(texto(desactivado), /Avisos de novedades desactivados/);
  assert.deepEqual(p.sdk, [], 'por debajo del código 24 no se llama al SDK');
  assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false);
  p.h.desmontar();
});

test('Perfil con la 1.4.2 (código 24): pide permiso solo al pulsar, registra el token y lo quita', async () => {
  const p = perfil({ capacidad: true });
  let panel = await p.esperar();
  assert.deepEqual(p.sdk, ['consultar'], 'al abrir solo se consulta, sin pedir permiso');
  assert.ok(texto(panel).includes('Al activarlas, el sistema te pedirá permiso. Guardamos en tu cuenta un identificador de este móvil para entregarte las notificaciones (lo reciben Expo y Google). Se borra al desactivarlas, al cerrar sesión con conexión, al borrar la cuenta o tras 180 días sin usar la app.'));
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

test('Perfil con la 1.4.2 y el móvil activo: al cargar renueva el registro una vez al día, sin pedir permiso', async () => {
  const p = perfil({ capacidad: true, token: TOKEN, sistema: { consulta: { ok: true, estado: 'permitido' } } });
  let panel = await p.esperar();
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.accessibilityState.checked, true);
  assert.deepEqual(p.rpc.filter(([n]) => n === 'registrar_aviso_push'), [['registrar_aviso_push', { p_token: TOKEN, p_plataforma: 'android' }]]);
  assert.deepEqual(p.sdk.filter((x) => Array.isArray(x)), [['token', { solicitarPermiso: false }]], 'el token actual, sin pedir permiso');
  assert.equal(p.local.renovado, new Date().toISOString().slice(0, 10));
  // Sin mi_aviso_push_registrado en la base (404) se confía en el token.
  assert.ok(p.rpc.some(([n]) => n === 'mi_aviso_push_registrado'));
  // Recargar el mismo día no vuelve a registrar.
  p.estadoHook().recargar();
  panel = await p.esperar();
  p.estadoHook().recargar();
  await p.esperar();
  assert.equal(p.rpc.filter(([n]) => n === 'registrar_aviso_push').length, 1);
  assert.equal(p.sdk.filter((x) => Array.isArray(x)).length, 1);
  p.h.desmontar();
});

test('Perfil: sin capacidad nativa, sin permiso o sin push en la base no se renueva nada', async () => {
  for (const [nombre, opciones] of [
    ['1.4.1 (código 23)', { capacidad: false }],
    ['permiso retirado en el sistema', { capacidad: true, sistema: { consulta: { ok: false, estado: 'denegado' } } }],
    ['push apagado en la base', { capacidad: true, servidor: estadoServidor({ push_activo: false }), sistema: { consulta: { ok: true, estado: 'permitido' } } }],
  ]) {
    const p = perfil({ ...opciones, token: TOKEN });
    await p.esperar();
    assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false, nombre);
    assert.equal(p.sdk.some((x) => Array.isArray(x)), false, `${nombre}: no se pide token`);
    assert.equal(p.local.renovado, null, nombre);
    if (!opciones.capacidad) assert.deepEqual(p.sdk, [], 'por debajo del código 24 no se llama al SDK');
    p.h.desmontar();
  }
});

test('Perfil: si la base dice que este móvil ya no está registrado, no sale como activo ni se renueva solo', async () => {
  const p = perfil({ capacidad: true, token: TOKEN, registrado: false, sistema: { consulta: { ok: true, estado: 'permitido' } } });
  let panel = await p.esperar();
  const movil = boton(panel, 'Notificaciones en este móvil');
  assert.equal(movil.props.accessibilityState.checked, false);
  assert.equal(movil.props.disabled, false, 'se puede volver a activar');
  assert.match(texto(panel), /Este móvil ha dejado de recibir las notificaciones de RWAdar/);
  assert.match(texto(panel), /lo reciben Expo y Google/, 'volver a activarlas se explica igual');
  assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false);
  assert.deepEqual(p.rpc.find(([n]) => n === 'mi_aviso_push_registrado'), ['mi_aviso_push_registrado', { p_token: TOKEN }]);
  // Volver a activarlas lo registra de nuevo; con la base diciendo que sí, activo.
  p.cambiarRegistrado(true);
  panel = await p.pulsar('Notificaciones en este móvil');
  assert.deepEqual(p.rpc.filter(([n]) => n === 'registrar_aviso_push'), [['registrar_aviso_push', { p_token: TOKEN, p_plataforma: 'android' }]]);
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.accessibilityState.checked, true);
  assert.match(texto(panel), /Notificaciones activadas en este móvil/);
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

/* La tarjeta guarda si está desplegada: se pinta en un React aislado propio,
   aparte del hook, para que ese estado se conserve entre pintadas. */
function tarjetaViva() {
  const h = crearReact();
  const modulo = cargarComponente('AvisosNovedades.js', h.react, { '../lib/avisos': {}, '../lib/datos': {} });
  return (props) => h.pintar(() => modulo.TarjetaAvisosInicio(props));
}
const verTodos = (arbol) => nodos(arbol).find((n) => n.type === 'Pressable' && /^Ver (todos \(\d+\)|menos)$/.test(n.props.accessibilityLabel));

test('Inicio: los últimos avisos válidos, con punto de no leído que se guarda al abrirlos', async () => {
  const p = perfil({ capacidad: false, recientes: RECIENTES });
  await p.esperar();
  const hook = p.estadoHook();
  assert.deepEqual(hook.avisos.map((x) => x.id), ['9', 'bienvenida'], 'el aviso con enlace ajeno no se enseña');
  assert.equal(hook.noLeidos, 2);
  assert.deepEqual(p.rpc.find(([n]) => n === 'mis_avisos_recientes'), ['mis_avisos_recientes', { p_limite: 10 }]);
  const abiertos = [], marcados = [], pintarTarjeta = tarjetaViva();
  const tarjeta = () => pintarTarjeta({ avisos: p.estadoHook().avisos, leidos: p.estadoHook().leidos,
    onAbrir: (aviso) => { abiertos.push(aviso.id); p.estadoHook().marcarLeidos([aviso.id]); },
    onMarcarLeidos: (ids) => { marcados.push(ids); p.estadoHook().marcarLeidos(ids); } });
  let t = tarjeta();
  assert.match(texto(t), /Avisos/);
  assert.match(texto(t), /2 fichas nuevas en el radar de RWAdar/);
  assert.equal(verTodos(t), undefined, 'con 3 o menos ya se ven todos: no hay «Ver todos»');
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
  const vacia = tarjetaViva()({ avisos: [], leidos: [] });
  assert.match(texto(vacia), /Aquí verás las ofertas nuevas del radar/);
  p.h.desmontar();
});

test('Inicio con 7 avisos: «Ver todos (7)» los enseña todos en la tarjeta y se marcan leídos después de verlos', async () => {
  const base = (id, dia) => ({ id: String(id), tipo: 'novedad', titulo: `Novedad ${id}`, texto: 'Hay cambios en RWAdar.',
    enlace: 'https://rwadar.pages.dev/cambios', creado_el: `2026-11-${String(dia).padStart(2, '0')}T10:00:00Z` });
  const recientes = [...[17, 16, 15, 14, 13, 12].map((id, i) => base(id, 5 - Math.floor(i / 2))), RECIENTES[2]];
  const TITULOS = [...['17', '16', '15', '14', '13', '12'].map((id) => `Novedad ${id}`), 'Te damos la bienvenida a RWAdar'];
  const p = perfil({ capacidad: false, recientes });
  await p.esperar();
  assert.equal(p.estadoHook().avisos.length, 7);
  assert.equal(p.estadoHook().noLeidos, 7, 'la insignia de Inicio cuenta los 7 cargados');
  // App conecta la tarjeta así (ver la prueba de conexiones de App).
  const abiertos = [], marcados = [], pintarTarjeta = tarjetaViva();
  const tarjeta = () => pintarTarjeta({ avisos: p.estadoHook().avisos, leidos: p.estadoHook().leidos,
    onAbrir: (aviso) => { abiertos.push(aviso.id); p.estadoHook().marcarLeidos([aviso.id]); },
    onMarcarLeidos: (ids) => { marcados.push(ids); return p.estadoHook().marcarTodosLeidos(); } });
  const avisosVistos = (arbol) => nodos(arbol).filter((n) => n.type === 'Pressable' && TITULOS.includes(n.props.accessibilityLabel))
    .map((n) => n.props.accessibilityLabel);
  // Plegada: los 3 primeros y «Ver todos (7)», que avisa de los 4 sin leer que no se ven.
  let t = tarjeta();
  assert.deepEqual(avisosVistos(t), TITULOS.slice(0, 3));
  let ver = verTodos(t);
  assert.equal(ver.props.accessibilityLabel, 'Ver todos (7)');
  assert.equal(ver.props.accessibilityState.expanded, false);
  assert.equal(ver.props.accessibilityHint, '4 sin leer');
  assert.match(texto(t), /Ver todos \(7\)/);
  // Desplegada: los 7, en la misma tarjeta y en orden, con su punto de no leído.
  ver.props.onPress();
  t = tarjeta();
  assert.deepEqual(avisosVistos(t), TITULOS, 'se ven los 7');
  for (const titulo of TITULOS) assert.equal(boton(t, titulo).props.accessibilityHint, 'Sin leer', titulo);
  const vistos = new Set(avisosVistos(t));
  assert.ok(p.estadoHook().idsNoLeidos.every((id) => vistos.has(p.estadoHook().avisos.find((x) => x.id === id).titulo)),
    'todo lo que cuenta la insignia se puede ver');
  ver = verTodos(t);
  assert.equal(ver.props.accessibilityLabel, 'Ver menos');
  assert.equal(ver.props.accessibilityState.expanded, true);
  assert.equal(ver.props.accessibilityHint, undefined);
  // Uno de los que antes no se veían se puede abrir; la tarjeta sigue desplegada.
  boton(t, 'Novedad 12').props.onPress();
  await p.esperar();
  assert.deepEqual(abiertos, ['12']);
  assert.equal(p.estadoHook().noLeidos, 6);
  t = tarjeta();
  assert.deepEqual(avisosVistos(t), TITULOS);
  assert.equal(boton(t, 'Novedad 12').props.accessibilityHint, undefined);
  // Vistos todos, «Marcar como leídos» deja la insignia a cero.
  const puntoCabecera = (arbol) => nodos(arbol).some((n) => n.type === 'View' && n.props.accessible === false && !Array.isArray(n.props.style));
  assert.ok(puntoCabecera(t));
  boton(t, 'Marcar como leídos').props.onPress();
  await p.esperar();
  assert.deepEqual(marcados, [['17', '16', '15', '14', '13', 'bienvenida']]);
  assert.equal(p.estadoHook().noLeidos, 0, 'la insignia queda a cero');
  assert.deepEqual([...p.local.leidos].sort(), ['12', '13', '14', '15', '16', '17', 'bienvenida'].sort(), 'guardado en el dispositivo');
  t = tarjeta();
  assert.equal(boton(t, 'Marcar como leídos'), undefined);
  assert.equal(puntoCabecera(t), false);
  // «Ver menos» la vuelve a plegar; sin nada por leer, sin pista.
  verTodos(t).props.onPress();
  t = tarjeta();
  assert.deepEqual(avisosVistos(t), TITULOS.slice(0, 3));
  assert.equal(verTodos(t).props.accessibilityLabel, 'Ver todos (7)');
  assert.equal(verTodos(t).props.accessibilityHint, undefined);
  // La insignia también se puede vaciar de golpe, como hasta ahora.
  const q = perfil({ capacidad: false, recientes });
  await q.esperar();
  assert.deepEqual([...q.estadoHook().idsNoLeidos], ['17', '16', '15', '14', '13', '12', 'bienvenida']);
  await q.estadoHook().marcarTodosLeidos();
  await q.esperar();
  assert.equal(q.estadoHook().noLeidos, 0);
  p.h.desmontar(); q.h.desmontar();
});

const DESACTIVAR = '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.';
test('Inicio: debajo de la lista, «¿No quieres estos avisos?» lleva a Perfil › Avisos', () => {
  const pulsados = [];
  for (const avisos of [avisosCuenta.validarAvisosRecientes(RECIENTES), []]) {
    const t = tarjetaViva()({ avisos, leidos: [], onDesactivar: () => pulsados.push('perfil') });
    const enlace = boton(t, DESACTIVAR);
    assert.ok(enlace, 'falta el enlace de baja');
    assert.equal(enlace.props.accessibilityRole, 'link');
    assert.equal(enlace.props.accessibilityHint, 'Abre Perfil › Avisos');
    assert.ok(texto(enlace).includes(DESACTIVAR));
    const estilos = enlace.props.style({ pressed: false }).flat().filter(Boolean);
    assert.ok(estilos.some((e) => e.minHeight >= 48), 'diana táctil de 48');
    // Es lo último de la tarjeta: debajo de la lista y de «Marcar como leídos».
    const pulsables = nodos(t).filter((n) => n.type === 'Pressable');
    assert.equal(pulsables.at(-1), enlace);
    enlace.props.onPress();
  }
  assert.deepEqual(pulsados, ['perfil', 'perfil']);
  assert.equal(boton(tarjetaViva()({ avisos: [], leidos: [] }), DESACTIVAR), undefined, 'sin destino no se pinta');
  assert.equal(idioma.ingles(DESACTIVAR), "Don't want these notices? Turn them off in Profile or in your phone settings.");
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

test('salir sin conexión con una cuenta y entrar con otra: la clave pendiente de la primera no se toca y se quita en su próxima salida', async () => {
  const OTRA = '22222222-2222-4222-8222-222222222222';
  const h = crearReact(), claves = new Map([[UID, TOKEN]]), rpc = [];
  const modulo = cargarComponente('AvisosNovedades.js', h.react, {
    '../lib/avisos': {},
    '../lib/datos': { tokenPushNovedades: async (uid) => claves.get(uid) ?? null,
      borrarTokenPushNovedades: async (uid) => { claves.delete(uid); } },
  });
  // Cada cliente lleva la sesión de su cuenta: quitar_aviso_push solo quita tokens propios.
  const cliente = (uid, conexion = true) => ({ async rpc(nombre, args) {
    if (!conexion) throw new Error('sin conexión');
    rpc.push([uid, nombre, args]); return { data: true, error: null };
  } });
  // La primera cuenta sale sin conexión: la clave se conserva.
  await assert.rejects(modulo.quitarPushAlSalir({ cliente: cliente(UID, false), usuarioId: UID }));
  assert.equal(claves.get(UID), TOKEN);
  // Entra y sale otra cuenta sin móvil activo: ni usa su sesión con el token ajeno ni borra la clave ajena.
  assert.equal(await modulo.quitarPushAlSalir({ cliente: cliente(OTRA), usuarioId: OTRA }), false);
  assert.deepEqual(rpc, []);
  assert.equal(claves.get(UID), TOKEN, 'la clave de la primera cuenta sigue pendiente');
  // Cuando la primera vuelve y sale con conexión, se quita con su propia sesión.
  assert.equal(await modulo.quitarPushAlSalir({ cliente: cliente(UID), usuarioId: UID }), true);
  assert.deepEqual(rpc, [[UID, 'quitar_aviso_push', { p_token: TOKEN }]]);
  assert.equal(claves.has(UID), false);
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
  const entorno = { useState: (i) => [typeof i === 'function' ? i() : i, () => {}], useEffect() {}, useRef: (i) => ({ current: i }), MODO_LOCAL: false,
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

function variableApp(nombre) {
  let valor;
  babel.traverse(AST, { VariableDeclarator(ruta) { if (ruta.node.id.name === nombre) valor = ruta.node.init; } });
  assert.ok(valor, nombre);
  return babel.transformFromAstSync(babel.types.file(babel.types.program([babel.types.expressionStatement(valor)])),
    null, { babelrc: false, configFile: false }).code.replace(/;\s*$/, '');
}

test('App: el enlace de baja de Inicio abre Perfil y Perfil baja hasta Avisos', () => {
  assert.match(APP, /<TarjetaAvisosInicio[^>]*onDesactivar=\{irAAvisosPerfil\}/);
  assert.match(APP, /enfocarAvisos=\{enfocarAvisosPerfil\}\s*onAvisosEnfocados=\{\(\) => setEnfocarAvisosPerfil\(false\)\}/);
  assert.match(APP, /<PanelAvisosNovedades[^>]*onPrivacidad=\{\(\) => abrirEnlace\(URL_PRIVACIDAD_AVISOS\)\}/);
  assert.match(APP, /const URL_PRIVACIDAD_AVISOS = `\$\{URL_PRIVACIDAD\}#avisos-novedades`;/);
  // irAAvisosPerfil: cierra lo abierto, va a Perfil y pide bajar hasta Avisos.
  const cambios = {};
  const setter = (nombre) => (valor) => { cambios[nombre] = valor; };
  new Function('tacto', 'setAbierta', 'setOfertaAbierta', 'setEnfocarAvisosPerfil', 'setPestana', `return (${variableApp('irAAvisosPerfil')});`)(
    { eleccion() {} }, setter('abierta'), setter('ofertaAbierta'), setter('enfocar'), setter('pestana'))();
  assert.deepEqual(cambios, { abierta: null, ofertaAbierta: null, enfocar: true, pestana: 'perfil' });
  // PantallaPerfil: con la petición, cada medida de Avisos baja hasta ella; deslizar la consume.
  const efectos = [];
  const entorno = { useState: (i) => [typeof i === 'function' ? i() : i, () => {}], useEffect: (fn) => efectos.push(fn),
    useRef: (i) => ({ current: i }), MODO_LOCAL: false, USUARIO_LOCAL: true, e: {}, C: {}, crearCarteraCuenta() {} };
  for (const n of ['View', 'Text', 'ScrollView', 'RefreshControl', 'Pressable', 'Marca', 'Icono', 'Cuenta', 'GrupoMenu', 'FilaMenu',
    'PanelAvisos', 'ActivityIndicator', 'MisInversiones']) entorno[n] = n;
  const PantallaPerfil = funcionApp('PantallaPerfil', entorno);
  const panel = { type: 'PanelNovedades', props: {}, children: [] };
  for (const enfocarAvisos of [true, false]) {
    const desplazados = [], consumidos = [];
    efectos.length = 0;
    const arbol = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [],
      avisosNovedades: true, panelNovedades: panel, enfocarAvisos, onAvisosEnfocados: () => consumidos.push(1) });
    const scroll = nodos(arbol).find((n) => n.type === 'ScrollView');
    scroll.props.ref.current = { scrollTo: (opciones) => desplazados.push(opciones) };
    const seccion = nodos(arbol).find((n) => n.type === 'View' && (n.children || []).flat(Infinity).includes(panel));
    assert.equal(typeof seccion.props.onLayout, 'function');
    seccion.props.onLayout({ nativeEvent: { layout: { y: 900 } } });
    seccion.props.onLayout({ nativeEvent: { layout: { y: 1300 } } });
    seccion.props.onLayout({ nativeEvent: {} });
    if (enfocarAvisos) {
      assert.deepEqual(desplazados, [{ y: 888, animated: false }, { y: 1288, animated: false }], 'cada vez que se mide');
      scroll.props.onScrollBeginDrag();
      assert.equal(consumidos.length, 1, 'deslizar la consume');
      assert.equal(efectos.length, 2, 'y un plazo corto, por si nadie desliza');
    } else {
      assert.deepEqual(desplazados, [], 'sin petición no se mueve');
      assert.equal(scroll.props.onScrollBeginDrag, undefined);
    }
  }
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
  assert.match(APP, /<TarjetaAvisosInicio[^>]*onMarcarLeidos=\{novedadesCuenta\.marcarTodosLeidos\}/);
  assert.match(APP, /await borrarDatosDispositivo\(\);[\s\S]{0,200}if \(AVISOS_NOVEDADES_ACTIVOS\) novedadesCuenta\.recargar\(\);/);
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
  // Nombres y descripciones de los dos canales de Android (lib/avisos.js).
  for (const es of ['Avisos de tu cuenta', 'Avisos de servicio de tu cuenta, como la bienvenida.', 'Novedades de RWAdar',
    'Fichas nuevas en el radar y novedades de la web y la app.', 'Abre Perfil › Avisos', avisosCuenta.INFO_BASICA_ES,
    'Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.']) {
    assert.notEqual(idioma.ingles(es), es, es);
  }
  assert.equal(idioma.ingles('Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.'),
    'News notices turned on. You can unsubscribe here or with the link in every email.');
  assert.equal(idioma.ingles('Ver todos (7)'), 'Show all (7)');
  assert.equal(idioma.ingles('Ver menos'), 'Show less');
  assert.equal(idioma.ingles('4 sin leer'), '4 unread');
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
    assert.match(html, /Información básica sobre tus datos\. Responsable: Víctor Manuel Jorques Granero \(RWAdar\)\./);
    assert.doesNotMatch(html, /undefined|ExponentPushToken/);
  }
  const avisos = avisosCuenta.validarAvisosRecientes(RECIENTES);
  const html = renderToStaticMarkup(React.createElement(modulo.TarjetaAvisosInicio, { avisos, leidos: ['9'], onDesactivar() {} }));
  assert.match(html, /Te damos la bienvenida a RWAdar/);
  assert.match(html, /¿No quieres estos avisos\? Desactívalos en Perfil o en los ajustes del móvil\./);
  assert.ok(html.lastIndexOf('¿No quieres estos avisos?') > html.lastIndexOf('Marcar como leídos'), 'debajo de la lista');
  assert.match(html, /01\/11\/2026/);
  assert.match(html, /Marcar como leídos/);
  assert.doesNotMatch(html, /Ver todos|Ver menos/, 'con 2 avisos no hace falta desplegar');
  const siete = avisosCuenta.validarAvisosRecientes([1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: String(n), tipo: 'novedad',
    titulo: `Novedad ${n}`, texto: 'Hay cambios en RWAdar.', enlace: null, creado_el: '2026-11-05T10:00:00Z' })));
  const plegada = renderToStaticMarkup(React.createElement(modulo.TarjetaAvisosInicio, { avisos: siete, leidos: [] }));
  assert.match(plegada, /Ver todos \(7\)/);
  assert.equal((plegada.match(/aria-label="Novedad \d"/g) || []).length, 3, 'plegada, 3 de 7');
  assert.match(plegada, /aria-label="Ver todos \(7\)"/);
});
