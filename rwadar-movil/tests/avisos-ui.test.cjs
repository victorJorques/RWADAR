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

function cargarComponente(archivo, react, mocks, plataforma = 'android', extraNativo = {}) {
  const absoluto = path.join(RAIZ, 'componentes', archivo);
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Keyboard: { dismiss() {} }, Platform: { OS: plataforma },
    ScrollView: 'ScrollView', ...extraNativo };
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
// Primera capa junto al interruptor: el latido de Firebase, texto exacto del anexo legal (2.4, condición C5).
const QUIEN_MOVIL = 'Con ellas activadas, el componente de notificaciones de Google (Firebase) envía también a Google las fechas en que abres la app (hasta 30) y datos técnicos del móvil, que usa para sus estadísticas. Si no las activas, no le llega nada y seguirás viendo los avisos en Inicio.';
function estadoServidor(cambios = {}) {
  return { novedades: false, version: null, aceptado_el: null, version_vigente: avisosCuenta.VERSION_AVISOS,
    texto_es: avisosCuenta.TEXTO_AVISOS_ES, texto_en: avisosCuenta.TEXTO_AVISOS_EN, dispositivos: 0,
    correo_activo: false, push_activo: true, ...cambios };
}

function perfil({ capacidad, sistema = {}, servidor = estadoServidor(), recientes = [], token = null, registrado = null, plataforma = 'android', falla = {} }) {
  const h = crearReact(), rpc = [], sdk = [], local = { leidos: [], token, renovado: null };
  let estado = servidor;
  const cliente = { rpc(nombre, args) {
    rpc.push([nombre, args]);
    // falla: { rpc: estado HTTP } hace que esa llamada falle como lo haría la base.
    if (falla[nombre]) return { abortSignal: async () => ({ data: null, error: { code: 'PGRST301', message: 'fallo de prueba' }, status: falla[nombre] }) };
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
      // Al leerlo todo se quitan sus notificaciones del sistema (sin capacidad, no hace nada).
      retirarNotificacionesAvisos: async () => { sdk.push('retirar'); return 0; },
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
  }, plataforma);
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
  // Con el correo apagado no hay «enlace de cada correo»: no se promete (como la web).
  assert.ok(texto(activado).includes('Avisos de novedades activados. Puedes darte de baja aquí cuando quieras.'));
  assert.doesNotMatch(texto(activado), /enlace de cada correo\./);
  // En la 1.4.1 el móvil no se activa: sin la frase de quién interviene en la entrega.
  assert.doesNotMatch(texto(activado), /componente de notificaciones de Google/);
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
  // Primera capa junto al interruptor, antes de pulsarlo: tras el identificador («envía también») y antes de
  // cualquier otro botón o mensaje.
  {
    const orden = nodos(panel), interruptor = boton(panel, 'Notificaciones en este móvil');
    const quien = orden.find((n) => n.type === 'Text' && texto(n) === QUIEN_MOVIL);
    const identificador = orden.find((n) => n.type === 'Text' && /^Al activarlas, el sistema te pedirá permiso/.test(texto(n)));
    assert.ok(quien, 'falta la frase del latido de Firebase');
    assert.ok(orden.indexOf(interruptor) < orden.indexOf(identificador) && orden.indexOf(identificador) < orden.indexOf(quien),
      'después del interruptor y del identificador');
    assert.equal(orden.slice(orden.indexOf(interruptor) + 1, orden.indexOf(quien)).filter((n) => n?.type === 'Pressable').length, 0,
      'sin otro botón entre el interruptor y la frase');
  }
  panel = await p.pulsar('Notificaciones en este móvil');
  assert.ok(texto(panel).includes(QUIEN_MOVIL), 'sigue a la vista con las notificaciones activadas');
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

// 12/11/2026: nada se queda atascado. Sin red al pedir el token (lib/avisos.js
// lo corta a los 20 s) se dice y se puede volver a intentar; sin sesión, se dice.
test('Perfil con la 1.4.2: sin red al pedir el token lo dice y el interruptor sigue a mano', async () => {
  const p = perfil({ capacidad: true, sistema: { token: { ok: false, estado: 'sin-red' } } });
  await p.esperar();
  const panel = await p.pulsar('Notificaciones en este móvil');
  assert.ok(texto(panel).includes('No hemos podido conectar para activarlas. Revisa la conexión y vuelve a intentarlo.'));
  const movil = boton(panel, 'Notificaciones en este móvil');
  assert.equal(movil.props.disabled, false, 'se puede volver a intentar');
  assert.equal(movil.props.accessibilityState.busy, false);
  assert.equal(p.rpc.some(([n]) => n === 'registrar_aviso_push'), false);
  p.h.desmontar();
});

test('Perfil: si la base dice «sin sesión» al cargar o al activar, «Tu sesión ha caducado: vuelve a entrar»', async () => {
  const p = perfil({ capacidad: true, falla: { estado_mis_avisos: 401 } });
  let panel = await p.esperar();
  assert.ok(texto(panel).includes('Tu sesión ha caducado: vuelve a entrar.'));
  assert.ok(boton(panel, 'Reintentar'), 'con «Reintentar» para después de entrar');
  const q = perfil({ capacidad: true, falla: { registrar_aviso_push: 401 } });
  await q.esperar();
  panel = await q.pulsar('Notificaciones en este móvil');
  assert.ok(texto(panel).includes('Tu sesión ha caducado: vuelve a entrar.'));
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.disabled, false);
  // Con otro fallo de la base, el mensaje de siempre.
  const r = perfil({ capacidad: true, falla: { estado_mis_avisos: 503 } });
  panel = await r.esperar();
  assert.ok(texto(panel).includes('No se pudieron cargar tus avisos. Desliza hacia abajo para reintentar.'));
  p.h.desmontar(); q.h.desmontar(); r.h.desmontar();
});

test('Perfil con la 1.4.2 y el push de la base apagado: no se ofrece ni se consulta el sistema', async () => {
  const p = perfil({ capacidad: true, servidor: estadoServidor({ push_activo: false }) });
  const panel = await p.esperar();
  assert.equal(boton(panel, 'Notificaciones en este móvil').props.disabled, true);
  assert.match(texto(panel), /todavía no están activas/);
  assert.match(texto(panel), /El envío por correo y al móvil todavía no está activo/);
  // Con el envío apagado tampoco se activa, pero ya se dice quién intervendrá.
  assert.ok(texto(panel).includes(QUIEN_MOVIL));
  assert.deepEqual(p.sdk, []);
  p.h.desmontar();
});

test('Perfil en un iPhone: sin la frase de Firebase (allí la entrega sería de Apple)', async () => {
  const p = perfil({ capacidad: true, plataforma: 'ios' });
  const panel = await p.esperar();
  assert.ok(boton(panel, 'Notificaciones en este móvil'), 'el interruptor sigue');
  assert.doesNotMatch(texto(panel), /componente de notificaciones de Google/);
  p.h.desmontar();
});

test('Perfil con el correo encendido: al activar los avisos, la baja también con el enlace de cada correo', async () => {
  const p = perfil({ capacidad: true, servidor: estadoServidor({ correo_activo: true }) });
  await p.esperar();
  const activado = await p.pulsar('Avisos de novedades (correo y móvil)');
  assert.ok(texto(activado).includes('Avisos de novedades activados. Puedes darte de baja aquí o con el enlace de cada correo.'));
  assert.doesNotMatch(texto(activado), /Puedes darte de baja aquí cuando quieras/);
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
   Campana de la cabecera (21/11/2026): la lista que sustituye a la tarjeta
   «Avisos» de Inicio. Abrirla es verlos.
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

const DESACTIVAR = '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.';

/* La campana (su hook y su lista) en un React aislado propio, aparte del
   hook de avisos que le da la fuente. */
function campanaViva() {
  const h = crearReact(), retiradas = [];
  const nativo = { Modal: 'Modal', Dimensions: { get: () => ({ height: 800 }) } };
  const modulo = cargarComponente('CampanaAvisos.js', h.react, {
    './Navegacion': { Icono: 'Icono' },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView' },
    '../lib/avisos': { retirarNotificacionesAvisos: async () => { retiradas.push(1); return 0; } },
    '../lib/datos': {},
  }, 'android', nativo);
  let campana;
  return {
    modulo, retiradas, h,
    hook(fuente) { campana = h.pintar(() => modulo.useCampanaAvisos(fuente)); return campana; },
    lista(fuente, extra = {}) {
      return crearReact().pintar(() => modulo.ListaAvisos({ avisos: fuente.avisos, sinLeer: campana?.sinLeer || [],
        cargando: fuente.cargando, error: fuente.errorCarga, ...extra }));
    },
  };
}

test('campana: abrirla es verlos, el globo baja a 0 y los puntos «Sin leer» se quedan mientras sigue abierta', async () => {
  const p = perfil({ capacidad: false, recientes: RECIENTES });
  await p.esperar();
  const hook = p.estadoHook();
  assert.deepEqual(hook.avisos.map((x) => x.id), ['9', 'bienvenida'], 'el aviso con enlace ajeno no se enseña');
  assert.equal(hook.noLeidos, 2);
  assert.deepEqual(p.rpc.find(([n]) => n === 'mis_avisos_recientes'), ['mis_avisos_recientes', { p_limite: 10 }]);
  const c = campanaViva();
  let campana = c.hook(p.estadoHook());
  assert.equal(campana.activa, true);
  assert.equal(campana.abierta, false);
  assert.equal(campana.noLeidos, 2, 'el globo cuenta los 2 sin leer');
  campana.abrir();
  campana = c.hook(p.estadoHook());
  assert.equal(campana.abierta, true);
  await p.esperar();
  campana = c.hook(p.estadoHook());
  assert.deepEqual([...p.local.leidos].sort(), ['9', 'bienvenida'], 'abrirla los guarda como leídos en el dispositivo');
  assert.equal(p.estadoHook().noLeidos, 0);
  assert.equal(campana.noLeidos, 0, 'el globo baja a 0');
  assert.ok(c.retiradas.length >= 1, 'y se quitan las notificaciones del sistema (y su número en el icono)');
  // Mientras sigue abierta, los dos conservan su punto y su «Sin leer».
  let lista = c.lista(p.estadoHook());
  for (const id of ['9', 'bienvenida']) {
    const aviso = nodos(lista).find((n) => n.props?.testID === `campanaAviso-${id}`);
    assert.ok(aviso, id);
    assert.match(texto(aviso), /Sin leer/, id);
  }
  assert.match(texto(lista), /2 fichas nuevas en el radar de RWAdar/);
  assert.match(texto(lista), /05\/11\/2026/);
  assert.equal(boton(lista, 'Marcar como leídos'), undefined, 'ya no hace falta «Marcar como leídos»');
  // Sin escribir dos veces lo mismo al volver a pintarse.
  const escrituras = p.local.leidos.length;
  c.hook(p.estadoHook()); await p.esperar(); c.hook(p.estadoHook());
  assert.equal(p.local.leidos.length, escrituras);
  // Al cerrarla, la próxima vez ya salen leídos.
  campana = c.hook(p.estadoHook());
  campana.cerrar();
  campana = c.hook(p.estadoHook());
  assert.equal(campana.abierta, false);
  lista = c.lista(p.estadoHook());
  assert.doesNotMatch(texto(lista), /Sin leer/);
  // Vacía, lo dice.
  assert.match(texto(c.lista({ avisos: [] })), /Aquí verás las fichas nuevas del radar/);
  p.h.desmontar(); c.h.desmontar();
});

test('campana: lo que llega con la lista abierta también se da por visto; sin fuente no hace nada', async () => {
  const leidos = [];
  let fuente = { avisos: [], leidos: [], idsNoLeidos: [], noLeidos: 0, recargas: 0,
    marcarLeidos(ids) { leidos.push(ids); }, recargar() { fuente.recargas += 1; } };
  const c = campanaViva();
  let campana = c.hook(fuente);
  campana.abrir();
  campana = c.hook(fuente);
  assert.deepEqual(leidos, [], 'nada sin leer: nada que guardar');
  assert.deepEqual(c.retiradas, [1], 'al abrirla se quitan las notificaciones del sistema');
  fuente = { ...fuente, avisos: [{ id: '12' }], idsNoLeidos: ['12'], noLeidos: 1 };
  campana = c.hook(fuente);
  assert.deepEqual(leidos, [['12']]);
  assert.deepEqual(campana.sinLeer, ['12'], 'con su punto mientras siga abierta');
  // Si una recarga se cruza con el guardado y lo vuelve a dar por pendiente, se vuelve a guardar.
  fuente = { ...fuente, idsNoLeidos: [], noLeidos: 0 };
  c.hook(fuente);
  fuente = { ...fuente, idsNoLeidos: ['12'], noLeidos: 1 };
  campana = c.hook(fuente);
  assert.deepEqual(leidos, [['12'], ['12']]);
  assert.deepEqual(campana.sinLeer, ['12']);
  const nula = campanaViva();
  const sin = nula.hook(null);
  assert.equal(sin.activa, false);
  assert.equal(sin.noLeidos, 0);
  sin.abrir();
  assert.equal(nula.hook(null).abierta, false);
  assert.deepEqual(nula.retiradas, []);
});

test('campana: cada aviso conserva su «Abrir» y, debajo de la lista, «¿No quieres estos avisos?» lleva a Perfil › Avisos', () => {
  const pulsados = [], abiertos = [];
  const c = campanaViva();
  const avisos = avisosCuenta.validarAvisosRecientes([...RECIENTES,
    { id: '7', tipo: 'novedad', titulo: 'Sin enlace', texto: 'Nada que abrir.', enlace: null, creado_el: '2026-11-03T10:00:00Z' }]);
  for (const lista of [avisos, []]) {
    const t = c.lista({ avisos: lista }, { onAbrir: (a) => abiertos.push(a.id), onDesactivar: () => pulsados.push('perfil') });
    const enlace = boton(t, DESACTIVAR);
    assert.ok(enlace, 'falta el enlace de baja');
    assert.equal(enlace.props.accessibilityRole, 'link');
    assert.equal(enlace.props.accessibilityHint, 'Abre Perfil › Avisos');
    assert.ok(texto(enlace).includes(DESACTIVAR));
    assert.ok(enlace.props.style({ pressed: false }).flat().filter(Boolean).some((e) => e.minHeight >= 48), 'diana táctil de 48');
    const pulsables = nodos(t).filter((n) => n.type === 'Pressable');
    assert.equal(pulsables.at(-1), enlace, 'es lo último de la lista');
    enlace.props.onPress();
    if (lista.length) {
      const abrir = pulsables.filter((n) => n.props.accessibilityLabel === 'Abrir');
      assert.deepEqual(abrir.map((n) => n.props.accessibilityHint), ['2 fichas nuevas en el radar de RWAdar', 'Te damos la bienvenida a RWAdar'],
        'solo los que tienen a dónde llevar');
      assert.ok(abrir.every((n) => n.props.style({ pressed: false }).flat().filter(Boolean).some((e) => e.minHeight >= 48)));
      abrir.forEach((n) => n.props.onPress());
    }
  }
  assert.deepEqual(pulsados, ['perfil', 'perfil']);
  assert.deepEqual(abiertos, ['9', 'bienvenida']);
  assert.equal(boton(c.lista({ avisos: [] }), DESACTIVAR), undefined, 'sin destino no se pinta');
  // Si falla, lo dice y deja reintentar.
  const reintentos = [];
  const caida = c.lista({ avisos: [], errorCarga: 'No se pudieron cargar tus avisos. Desliza hacia abajo para reintentar.' },
    { onReintentar: () => reintentos.push(1) });
  assert.match(texto(caida), /No se pudieron cargar tus avisos/);
  boton(caida, 'Reintentar').props.onPress();
  assert.deepEqual(reintentos, [1]);
  assert.equal(idioma.ingles(DESACTIVAR), "Don't want these notices? Turn them off in Profile or in your phone settings.");
});

test('campana: la lista se abre en su propia pantalla, con título y «Cerrar»', () => {
  const c = campanaViva(), cerrados = [];
  const avisos = avisosCuenta.validarAvisosRecientes(RECIENTES);
  const pantalla = crearReact().pintar(() => c.modulo.PantallaAvisos({ visible: true, avisos, sinLeer: ['9'],
    onCerrar: () => cerrados.push(1), onDesactivar() {} }));
  const modal = nodos(pantalla).find((n) => n.type === 'Modal');
  assert.equal(modal.props.visible, true);
  assert.equal(modal.props.presentationStyle, 'fullScreen');
  modal.props.onRequestClose();
  assert.match(texto(pantalla), /Avisos/);
  assert.match(texto(pantalla), /Fichas nuevas del radar y novedades de RWAdar\./);
  assert.match(texto(pantalla), /2 fichas nuevas en el radar de RWAdar/);
  const cerrar = boton(pantalla, 'Cerrar');
  assert.ok(cerrar.props.style({ pressed: false }).flat().filter(Boolean).some((e) => e.width >= 44 && e.height >= 44));
  cerrar.props.onPress();
  assert.deepEqual(cerrados, [1, 1], 'el botón y el «atrás» de Android la cierran');
  const oculta = crearReact().pintar(() => c.modulo.PantallaAvisos({ visible: false, avisos, sinLeer: [] }));
  assert.equal(boton(oculta, 'Cerrar'), undefined);
});

test('Notificación que lleva a Buscar o a la Academy: la baja arriba, con su enlace a Perfil › Avisos y para ocultarla', () => {
  const h = crearReact(), pulsados = [];
  const modulo = cargarComponente('AvisosNovedades.js', h.react, { '../lib/avisos': {}, '../lib/datos': {} });
  const aviso = h.pintar(() => modulo.AvisoBajaNotificacion({ onDesactivar: () => pulsados.push('perfil'), onOcultar: () => pulsados.push('ocultar') }));
  assert.equal(aviso.props.accessibilityRole, 'alert');
  const enlace = boton(aviso, DESACTIVAR);
  assert.ok(enlace, 'falta el enlace de baja');
  assert.equal(enlace.props.accessibilityRole, 'link');
  assert.equal(enlace.props.accessibilityHint, 'Abre Perfil › Avisos');
  assert.ok(texto(enlace).includes(DESACTIVAR));
  assert.ok(enlace.props.style({ pressed: false }).flat().filter(Boolean).some((e) => e.minHeight >= 48), 'diana táctil de 48');
  const ocultar = boton(aviso, 'Ocultar aviso');
  assert.ok(ocultar.props.style({ pressed: false }).flat().filter(Boolean).some((e) => e.minHeight >= 48), 'diana táctil de 48');
  enlace.props.onPress(); ocultar.props.onPress();
  assert.deepEqual(pulsados, ['perfil', 'ocultar']);
  assert.equal(idioma.ingles('Ocultar aviso'), 'Hide notice');
  // En App.js: arriba (menos en Perfil), el enlace la quita y abre Perfil › Avisos, y cambiar de pestaña también la quita.
  assert.match(APP, /\{bajaNotificacion && pestana !== 'perfil' \? \(\s*<AvisoBajaNotificacion onOcultar=\{\(\) => setBajaNotificacion\(false\)\}\s*onDesactivar=\{\(\) => \{ setBajaNotificacion\(false\); irAAvisosPerfil\(\); \}\} \/>/);
  assert.match(APP, /tacto\.eleccion\(\);\n    setBajaNotificacion\(false\);\n    setVistaBuscar\(vista\);/);
  assert.ok(APP.indexOf('{avisoActualizacion}\n\n        {bajaNotificacion') > 0, 'arriba, con el aviso de actualización');
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
  const entorno = { USUARIO_LOCAL: true, AVISOS_SIN_CUENTA_ACTIVOS: false, e: {}, C: {}, URL_PRIVACIDAD: 'https://rwadar.pages.dev/privacidad', abrirEnlace() {} };
  for (const n of ['Modal', 'SafeAreaProvider', 'SafeAreaView', 'View', 'Text', 'ScrollView', 'Pressable', 'ActivityIndicator']) entorno[n] = n;
  const Privacidad = funcionApp('Privacidad', entorno);
  // Notificaciones sin cuenta (14/11/2026): con su interruptor, la privacidad de la app lo cuenta, con su inglés.
  const conSinCuenta = texto(funcionApp('Privacidad', { ...entorno, AVISOS_SIN_CUENTA_ACTIVOS: true })({ estadoCuenta: { disponible: true }, avisosNovedades: true, pushNovedades: true }));
  const parrafoSinCuenta = conSinCuenta.match(/También puedes activar las notificaciones sin cuenta[^]*?apartado 6\./)[0];
  assert.match(parrafoSinCuenta, /sin nombre ni correo/);
  assert.notEqual(idioma.ingles(parrafoSinCuenta), parrafoSinCuenta, 'falta el inglés del párrafo sin cuenta');
  const hoy = texto(Privacidad({ estadoCuenta: { disponible: true } }));
  assert.match(hoy, /No se activan opiniones, publicidad, avisos por correo ni push al registrarte/);
  assert.match(hoy, /Instalaciones y avisos desactivados/);
  assert.match(hoy, /No se solicitan permisos push, obtienen tokens ni registran instalaciones/);
  assert.doesNotMatch(hoy, /Avisos de novedades|Brevo|Lettermint/);
  const v141 = texto(Privacidad({ estadoCuenta: { disponible: true }, avisosNovedades: true, pushNovedades: false }));
  assert.doesNotMatch(v141, /No se activan opiniones, publicidad, avisos por correo ni push|Instalaciones y avisos desactivados/);
  // Sin la casilla del alta (12/11/2026), el permiso solo se da en Perfil › Avisos.
  assert.match(v141, /Los avisos de novedades solo se activan si los activas en Perfil › Avisos\./);
  assert.match(v141, /solo se activan con tu permiso: en Perfil › Avisos\./);
  assert.doesNotMatch(v141, /marcas su casilla|con su casilla al crear la cuenta/);
  const conCasilla = texto(Privacidad({ estadoCuenta: { disponible: true }, avisosNovedades: true, casillaAlta: true, pushNovedades: false }));
  assert.match(conCasilla, /Los avisos de novedades solo se activan si marcas su casilla al crear la cuenta o los activas en Perfil › Avisos\./);
  assert.match(conCasilla, /solo se activan con tu permiso: con su casilla al crear la cuenta o en Perfil › Avisos\./);
  for (const t of [v141, conCasilla]) {
    for (const parrafo of [t.match(/La sesión se guarda[^]*?Perfil › Avisos\./)[0], t.match(/Los avisos de novedades \(fichas[^]*?solo en este dispositivo\./)[0]]) {
      assert.notEqual(idioma.ingles(parrafo), parrafo, 'falta el inglés: ' + parrafo.slice(0, 60));
    }
  }
  assert.match(v141, /las notificaciones en el móvil llegan con la versión 1\.4\.2/);
  assert.doesNotMatch(v141, /Brevo|Lettermint/, 'el correo no se describe hasta que la base lo encienda');
  const v142 = texto(Privacidad({ estadoCuenta: { disponible: true }, avisosNovedades: true, pushNovedades: true,
    estadoNovedades: { correoActivo: true } }));
  assert.match(v142, /Si activas «Notificaciones en este móvil», el sistema te pedirá permiso/);
  assert.match(v142, /Expo y Firebase Cloud Messaging/);
  assert.match(v142, /a través de Lettermint, sin píxel ni seguimiento de clics/);
  assert.doesNotMatch(v142, /Brevo/, 'Brevo se descartó: mete píxel en el correo transaccional');
  // El «latido» de Firebase de la 1.4.2 (APK-1.4.2-NOTIFICACIONES.md, punto 3): se dice siempre,
  // y mientras el botón esté oculto no se promete que exista.
  for (const t of [hoy, v141, v142]) {
    assert.match(t, /Componente de notificaciones de Google \(Firebase\)/);
    assert.match(t, /Desde la versión 1\.4\.2, la app de Android lleva el componente de notificaciones de Google \(Firebase\)\./);
    assert.match(t, /no envía nada a Google/);
    assert.match(t, /las fechas recientes en que se abrió la app \(hasta 30\)/);
    // Qué manda Firebase y para qué, según Google (firebase.google.com/docs/android/play-data-disclosure).
    assert.match(t, /junto con qué componentes de Firebase lleva la app y sus versiones, y datos técnicos del móvil \(versión de Android, marca, modelo, tipo de dispositivo y tienda desde la que se instaló la app\)\./);
    assert.match(t, /Según Google, los usa para sus estadísticas internas de uso de esos componentes, sin unirlos a un identificador de la persona ni del móvil\./);
    assert.doesNotMatch(t, /para poder entregarlas|solo para ese componente/);
    // El botón «Borrar datos de este dispositivo» de la misma pantalla no las borra.
    assert.match(t, /Esas fechas se borran del móvil al desinstalar la app o al borrar sus datos desde los ajustes de Android\. El botón «Borrar datos del dispositivo» de RWAdar no las borra\./);
  }
  for (const t of [hoy, v141]) assert.match(t, /hoy ese botón no aparece en la app/);
  assert.doesNotMatch(v142, /hoy ese botón no aparece en la app/);
  assert.match(v142, /Mientras no actives «Notificaciones en este móvil», no envía nada a Google\./);
  for (const t of [hoy, v142]) {
    const parrafo = t.match(/Desde la versión 1\.4\.2[^]*?de RWAdar no las borra\./)[0];
    assert.notEqual(idioma.ingles(parrafo), parrafo, 'falta el inglés del párrafo de Firebase');
  }
  assert.equal(idioma.ingles('Componente de notificaciones de Google (Firebase)'), 'Google notifications component (Firebase)');
});

test('Perfil: con el interruptor, el panel de la cuenta sustituye a «Próximamente»', () => {
  const entorno = { useState: (i) => [typeof i === 'function' ? i() : i, () => {}], useEffect() {}, useRef: (i) => ({ current: i }),
    USUARIO_LOCAL: true, e: {}, C: {}, crearCarteraCuenta() {} };
  for (const n of ['View', 'Text', 'ScrollView', 'RefreshControl', 'Pressable', 'Marca', 'Icono', 'Cuenta', 'GrupoMenu', 'FilaMenu',
    'PanelAvisos', 'ActivityIndicator', 'MisInversiones', 'Colabora']) entorno[n] = n;
  const PantallaPerfil = funcionApp('PantallaPerfil', entorno);
  const hoy = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [] });
  assert.match(texto(hoy), /Los avisos llegarán a la app en una próxima actualización/);
  assert.equal(nodos(hoy).find((n) => n.type === 'Cuenta').props.avisosNovedades, false);
  const conAvisos = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [],
    avisosNovedades: true, panelNovedades: { type: 'PanelNovedades', props: {}, children: [] } });
  assert.doesNotMatch(texto(conAvisos), /Próximamente|Los avisos llegarán a la app/);
  assert.ok(nodos(conAvisos).some((n) => n.type === 'PanelNovedades'));
  // Sin la casilla del alta, el formulario de la cuenta no la enseña aunque Perfil › Avisos esté encendido.
  assert.equal(nodos(conAvisos).find((n) => n.type === 'Cuenta').props.avisosNovedades, false);
  const conCasilla = PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true }, seguidas: [], ofertasGuardadas: [],
    avisosNovedades: true, casillaAlta: true, panelNovedades: { type: 'PanelNovedades', props: {}, children: [] } });
  assert.equal(nodos(conCasilla).find((n) => n.type === 'Cuenta').props.avisosNovedades, true);
});

function variableApp(nombre) {
  let valor;
  babel.traverse(AST, { VariableDeclarator(ruta) { if (ruta.node.id.name === nombre) valor = ruta.node.init; } });
  assert.ok(valor, nombre);
  return babel.transformFromAstSync(babel.types.file(babel.types.program([babel.types.expressionStatement(valor)])),
    null, { babelrc: false, configFile: false }).code.replace(/;\s*$/, '');
}

test('App: el enlace de baja de la campana abre Perfil y Perfil baja hasta Avisos', () => {
  // Con la bandeja sola (AVISOS_BANDEJA_REMOTA) o los públicos no hay Perfil › Avisos: sin enlace de baja.
  assert.match(APP, /<PantallaAvisos [\s\S]{0,600}?onDesactivar=\{AVISOS_NOVEDADES_ACTIVOS \? irAAvisosPerfil : undefined\} \/>/);
  assert.match(APP, /enfocarAvisos=\{enfocarAvisosPerfil\}\s*onAvisosEnfocados=\{\(\) => setEnfocarAvisosPerfil\(false\)\}/);
  assert.match(APP, /<PanelAvisosNovedades[^>]*onPrivacidad=\{\(\) => abrirEnlace\(URL_PRIVACIDAD_AVISOS\)\}/);
  assert.match(APP, /const URL_PRIVACIDAD_AVISOS = `\$\{URL_PRIVACIDAD\}#avisos-novedades`;/);
  // irAAvisosPerfil: cierra lo abierto (también la campana), va a Perfil y pide bajar hasta Avisos.
  const cambios = {};
  const setter = (nombre) => (valor) => { cambios[nombre] = valor; };
  new Function('tacto', 'campana', 'setAbierta', 'setOfertaAbierta', 'setEnfocarAvisosPerfil', 'setPestana', `return (${variableApp('irAAvisosPerfil')});`)(
    { eleccion() {} }, { cerrar: () => { cambios.campana = 'cerrada'; } }, setter('abierta'), setter('ofertaAbierta'), setter('enfocar'), setter('pestana'))();
  assert.deepEqual(cambios, { campana: 'cerrada', abierta: null, ofertaAbierta: null, enfocar: true, pestana: 'perfil' });
  // «Abrir» de un aviso: cierra la campana, lo marca leído y lleva a su sitio.
  const pasos = [];
  new Function('avisosCampana', 'campana', 'destinoAviso', 'irA', `return (${variableApp('abrirAvisoCampana')});`)(
    { marcarLeidos: (ids) => pasos.push(['leido', ids]) }, { cerrar: () => pasos.push(['cerrar']) },
    avisosCuenta.destinoAviso, (destino) => pasos.push(['ir', destino]))({ id: '9', tipo: 'ofertas' });
  assert.deepEqual(pasos, [['leido', ['9']], ['cerrar'], ['ir', 'ofertas-nuevas']]);
  // PantallaPerfil: con la petición, cada medida de Avisos baja hasta ella; deslizar la consume.
  const efectos = [];
  const entorno = { useState: (i) => [typeof i === 'function' ? i() : i, () => {}], useEffect: (fn) => efectos.push(fn),
    useRef: (i) => ({ current: i }), USUARIO_LOCAL: true, e: {}, C: {}, crearCarteraCuenta() {} };
  for (const n of ['View', 'Text', 'ScrollView', 'RefreshControl', 'Pressable', 'Marca', 'Icono', 'Cuenta', 'GrupoMenu', 'FilaMenu',
    'PanelAvisos', 'ActivityIndicator', 'MisInversiones', 'Colabora']) entorno[n] = n;
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

test('App: solo con el interruptor se observan las novedades y se pinta la campana, el panel y la casilla', () => {
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
  assert.match(APP, /useAvisosNovedades\(\{ cuenta, usuarioId: AVISOS_NOVEDADES_ACTIVOS \? usuarioAdmitido : null,[\s\S]{0,140}sinCuenta: AVISOS_SIN_CUENTA_ACTIVOS \? gestorSinCuenta\(\) : null \}\)/);
  assert.match(APP, /const avisosCampana = AVISOS_NOVEDADES_ACTIVOS \? novedadesCuenta : BANDEJA_AVISOS_ACTIVA \? bandejaAvisos\s*: AVISOS_PUBLICOS_ACTIVOS \? avisosPublicos : null;/);
  // La campana sale en la cabecera, al lado del «?», y abre la lista; la tarjeta de Inicio y «Marcar como leídos» ya no están.
  assert.match(APP, /const campana = useCampanaAvisos\(avisosCampana\);/);
  assert.match(APP, /campana=\{campana\.activa \? \{ noLeidos: campana\.noLeidos, onPress: abrirCampana \} : null\}/);
  assert.match(APP, /\{campana \? <BotonCampana noLeidos=\{campana\.noLeidos\} onPress=\{campana\.onPress\} \/> : null\}\s*<Pressable\s*onPress=\{onAyuda\}/);
  assert.match(APP, /<PantallaAvisos visible=\{campana\.abierta && Boolean\(avisosCampana\)\}/);
  assert.doesNotMatch(APP, /TarjetaAvisosInicio|tarjetaAvisos=|marcarTodosLeidos/);
  assert.match(APP, /panelNovedades=\{AVISOS_NOVEDADES_ACTIVOS \? \(/);
  assert.match(APP, /await borrarDatosDispositivo\(\);[\s\S]{0,200}avisosCampana\?\.recargar\(\);/);
  // La casilla del alta va con su propio interruptor (12/11/2026), apagado hasta que salga el correo.
  assert.match(APP, /const CASILLA_ALTA_ACTIVA = AVISOS_NOVEDADES_ACTIVOS && AVISOS_CASILLA_ALTA_REMOTA === true;/);
  assert.match(APP, /<AccesoObligatorio[^>]*avisosNovedades=\{CASILLA_ALTA_ACTIVA\}/);
  assert.match(APP, /avisosNovedades: CASILLA_ALTA_ACTIVA,/);
  assert.match(APP, /onAbrirEnlace=\{onAbrirEnlace\} avisosNovedades=\{casillaAlta === true\} \/>/);
  assert.match(APP, /antesDeSalir: AVISOS_NOVEDADES_REMOTOS === true \? quitarPushAlSalir : null/);
  // El «1» se recalcula al volver a la app y al llegar un aviso con la app abierta.
  assert.match(APP, /AppState\.addEventListener\('change', \(estado\) => \{ if \(estado === 'active'\) recargarAvisos\(\); \}\)/);
  assert.match(APP, /observarAvisosRecibidos\(\(\) => recargarAvisos\(true\)\)/);
  assert.match(fs.readFileSync(path.join(RAIZ, 'componentes', 'AccesoObligatorio.js'), 'utf8'), /avisosNovedades=\{avisosNovedades === true\}/);
  // Inicio ya no pinta avisos: solo los cambios de lo que sigues, que se dan por vistos en pantalla.
  const inicio = fs.readFileSync(path.join(RAIZ, 'componentes', 'Inicio.js'), 'utf8');
  assert.doesNotMatch(inicio, /tarjetaAvisos/);
  assert.match(inicio, /useVistoEnPantalla\(\{ activo: cambios\.length > 0 && !seccion,[\s\S]{0,120}onVisto: onCambiosVistos \}\)/);
  assert.match(inicio, /<View style=\{e\.seccion\} ref=\{refCambios\} collapsable=\{false\}>/);
  const modo = fs.readFileSync(path.join(RAIZ, 'lib', 'modo-local.js'), 'utf8');
  // Encendido el 12/11/2026 por orden de Víctor; la casilla del alta sigue apagada.
  assert.match(modo, /export const AVISOS_NOVEDADES_REMOTOS = true;/);
  assert.match(modo, /export const AVISOS_CASILLA_ALTA_REMOTA = false;/, 'la casilla del alta sigue apagada');
  assert.match(modo, /export const SERVICIOS_USUARIO_REMOTOS = false;/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8')).expo.extra.rwadar.pushDeliveryEnabled, true, 'la 1.4.2 puede entregar push');
});

test('App: tocar una notificación lleva a inicio, a ofertas nuevas o a la Academy, y espera a la cuenta', () => {
  const crear = new Function('destinoAvisoPendiente', 'cargando', 'usuarioAdmitido', 'setters', 'avisosCampana', 'campana',
    `const { setAbierta, setOfertaAbierta, setExplicando, setPrivacidad, setLeccion, setPestana, setOrdenOfertas,
      setGrupoOfertas, setTipoOferta, setProveedorOferta, setGrupoProveedorAbierto, setBusquedaOfertas, setVistaBuscar,
      setDestinoAvisoPendiente, setBajaNotificacion } = setters; return (${efectoApp('destinoAvisoPendiente || cargando')});`);
  function ejecutar(destino, { cargando = false, usuario = UID } = {}) {
    const cambios = {}, recargas = [], aperturas = [];
    const setters = new Proxy({}, { get: (_, nombre) => (valor) => { cambios[nombre] = valor; } });
    crear(destino, cargando, usuario, setters, { recargar: () => recargas.push(1) }, { abrir: () => aperturas.push(1) })();
    return { cambios, recargas, aperturas };
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
  // A Inicio, con la lista de la campana abierta (con su «¿No quieres estos avisos?»); a otro sitio, no.
  assert.equal(ejecutar({ tipo: 'novedad', destino: 'inicio' }).aperturas.length, 1);
  assert.equal(ofertas.aperturas.length, 0);
  // Fuera de Inicio (sin la lista de la campana), la baja arriba; la bienvenida es un aviso de servicio.
  assert.equal(ofertas.cambios.setBajaNotificacion, true);
  assert.equal(novedad.cambios.setBajaNotificacion, true);
  assert.equal(ejecutar({ tipo: 'novedad', destino: 'academy' }).cambios.setBajaNotificacion, true);
  assert.equal(ejecutar({ tipo: 'actualizacion', destino: 'inicio' }).cambios.setBajaNotificacion, false);
  assert.equal(ejecutar({ tipo: 'bienvenida', destino: 'academy' }).cambios.setBajaNotificacion, false);
  assert.deepEqual(ejecutar({ tipo: 'ofertas', destino: 'buscar' }, { cargando: true }).cambios, {});
  assert.deepEqual(ejecutar({ tipo: 'ofertas', destino: 'buscar' }, { usuario: null }).cambios, {});
  assert.deepEqual(ejecutar(null).cambios, {});
});

/* ---------------------------------------------------------------------
   Bandeja de avisos sin correo ni push (AVISOS_BANDEJA_REMOTA, 07/11/2026)
   --------------------------------------------------------------------- */
function bandeja({ recientes = RECIENTES, fallo = false } = {}) {
  const h = crearReact(), rpc = [], local = { leidos: [] };
  const prohibido = (nombre) => () => assert.fail(`la bandeja no debe llamar a ${nombre}`);
  const cliente = { rpc(nombre, args) {
    rpc.push([nombre, args]);
    if (nombre !== 'mis_avisos_recientes') assert.fail(`la bandeja no debe llamar a ${nombre}`);
    return { abortSignal: async () => (fallo ? { data: null, error: { message: 'caída' }, status: 503 } : { data: recientes, error: null }) };
  } };
  const cuenta = { estado: () => ({ usuario: { id: UID } }), clienteCatalogo: async () => cliente,
    suscribir(fn) { fn({ usuario: { id: UID } }); return () => {}; } };
  const modulo = cargarComponente('AvisosNovedades.js', h.react, {
    // Ni el SDK de notificaciones ni el token del móvil: solo los leídos.
    '../lib/avisos': { capacidadPushNovedades: prohibido('capacidadPushNovedades'),
      consultarPushNovedades: prohibido('consultarPushNovedades'), obtenerTokenNovedades: prohibido('obtenerTokenNovedades') },
    '../lib/datos': {
      avisosLeidos: async () => local.leidos,
      marcarAvisosLeidos: async (_, ids) => { local.leidos = [...new Set([...ids, ...local.leidos])]; return local.leidos; },
      tokenPushNovedades: prohibido('tokenPushNovedades'), guardarTokenPushNovedades: prohibido('guardarTokenPushNovedades'),
      borrarTokenPushNovedades: prohibido('borrarTokenPushNovedades'), renovacionPushNovedades: prohibido('renovacionPushNovedades'),
      marcarRenovacionPushNovedades: prohibido('marcarRenovacionPushNovedades'),
    },
  });
  let ultimo;
  const pintar = (usuarioId = UID) => { ultimo = h.pintar(() => modulo.useBandejaAvisos({ cuenta, usuarioId })); return ultimo; };
  const esperar = async (usuarioId) => { for (let i = 0; i < 12; i++) { await new Promise((r) => setImmediate(r)); pintar(usuarioId); } return ultimo; };
  return { modulo, rpc, local, pintar, esperar, h };
}

test('bandeja encendida: solo pide mis_avisos_recientes, enseña lo recibido y guarda los leídos en el móvil', async () => {
  const b = bandeja();
  const estado = await b.esperar();
  assert.deepEqual(b.rpc, [['mis_avisos_recientes', { p_limite: 10 }]], 'ni estado_mis_avisos, ni permiso, ni push');
  assert.equal(estado.activo, true);
  assert.deepEqual(estado.avisos.map((x) => x.id), ['9', 'bienvenida'], 'el aviso con enlace ajeno no se enseña');
  assert.equal(estado.noLeidos, 2);
  assert.equal(estado.errorCarga, '');
  // Sin interruptores de permiso ni de móvil.
  for (const clave of ['servidor', 'movil', 'alternarNovedades', 'alternarMovil']) assert.equal(Object.hasOwn(estado, clave), false, clave);
  await estado.marcarLeidos(['9']);
  assert.deepEqual(b.local.leidos, ['9']);
  assert.equal((await b.esperar()).noLeidos, 1);
  await b.pintar().marcarTodosLeidos();
  assert.equal((await b.esperar()).noLeidos, 0);
  assert.deepEqual(b.local.leidos.sort(), ['9', 'bienvenida']);
  // La lista de la campana, sin «¿No quieres estos avisos?»: no hay Perfil › Avisos que abrir.
  const lista = campanaViva().lista(b.pintar());
  assert.match(texto(lista), /Te damos la bienvenida a RWAdar/);
  assert.equal(boton(lista, DESACTIVAR), undefined);
  // Y la campana con la bandeja: abrirla la deja a cero.
  const otra = bandeja();
  await otra.esperar();
  const c = campanaViva();
  assert.equal(c.hook(otra.pintar()).noLeidos, 2);
  c.hook(otra.pintar()).abrir();
  c.hook(otra.pintar());
  await otra.esperar();
  assert.equal(c.hook(otra.pintar()).noLeidos, 0);
  assert.deepEqual(otra.local.leidos.sort(), ['9', 'bienvenida']);
  otra.h.desmontar();
  b.pintar().recargar();
  await b.esperar();
  assert.equal(b.rpc.length, 2, 'deslizar para actualizar vuelve a pedirlos');
  b.h.desmontar();
});

test('bandeja: si la base falla se dice en la tarjeta, y sin cuenta (interruptor apagado) no se llama a nada', async () => {
  const caida = bandeja({ fallo: true });
  const estado = await caida.esperar();
  assert.equal(estado.errorCarga, 'No se pudieron cargar tus avisos. Desliza hacia abajo para reintentar.');
  assert.deepEqual(estado.avisos, []);
  caida.h.desmontar();
  const apagada = bandeja();
  const sin = await apagada.esperar(null);
  assert.equal(sin.activo, false);
  assert.deepEqual(apagada.rpc, []);
  await sin.marcarLeidos(['9']); sin.recargar(); await sin.marcarTodosLeidos();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(apagada.rpc, []);
  assert.deepEqual(apagada.local.leidos, []);
  apagada.h.desmontar();
  // La pieza sin React: sin cuenta válida no arranca, y no ofrece nada del permiso ni del móvil.
  assert.throws(() => avisosCuenta.crearBandejaAvisos({ avisosCuenta: { recientes() {} }, usuarioId: 'x', almacen: {} }));
  const pieza = avisosCuenta.crearBandejaAvisos({ avisosCuenta: { recientes: async (n) => [n] }, usuarioId: UID,
    almacen: { leidos: async () => ['bienvenida'], marcarLeidos: async (_, ids) => ids } });
  assert.deepEqual(Object.keys(pieza).sort(), ['cargarRecientes', 'marcarLeidos']);
  assert.deepEqual(await pieza.cargarRecientes(10), { avisos: [10], leidos: ['bienvenida'] });
});

test('App: la bandeja tiene su interruptor aparte; encendida sola, la campana enseña sus avisos', () => {
  const modo = fs.readFileSync(path.join(RAIZ, 'lib', 'modo-local.js'), 'utf8');
  // 12/11/2026: los dos encendidos; con los avisos completos la bandeja no hace nada aparte.
  assert.match(modo, /export const AVISOS_BANDEJA_REMOTA = true;/);
  assert.match(modo, /export const AVISOS_NOVEDADES_REMOTOS = true;/);
  const activa = new Function('CUENTA_REMOTA_ACTIVA', 'AVISOS_BANDEJA_REMOTA', 'AVISOS_NOVEDADES_ACTIVOS',
    `return (${variableApp('BANDEJA_AVISOS_ACTIVA')});`);
  assert.equal(activa(true, false, false), false, 'apagada no hace nada');
  assert.equal(activa(true, true, false), true, 'encendida, con cuenta');
  assert.equal(activa(false, true, false), false, 'sin cuentas remotas, nada');
  assert.equal(activa(true, true, true), false, 'con los avisos completos, ya la traen ellos');
  const inicio = new Function('AVISOS_NOVEDADES_ACTIVOS', 'BANDEJA_AVISOS_ACTIVA', 'AVISOS_PUBLICOS_ACTIVOS', 'novedadesCuenta',
    'bandejaAvisos', 'avisosPublicos', `return (${variableApp('avisosCampana')});`);
  const completa = { tipo: 'completa' }, sola = { tipo: 'bandeja' }, publicos = { tipo: 'publicos' };
  assert.equal(inicio(false, false, false, completa, sola, publicos), null, 'apagado todo: ni campana ni globo');
  assert.equal(inicio(false, false, true, completa, sola, publicos), publicos, 'sin avisos de la cuenta, los públicos');
  assert.equal(inicio(false, true, true, completa, sola, publicos), sola);
  assert.equal(inicio(true, false, true, completa, sola, publicos), completa);
  const publicosActivos = new Function('CUENTA_REMOTA_ACTIVA', 'AVISOS_NOVEDADES_ACTIVOS', 'BANDEJA_AVISOS_ACTIVA',
    'AVISOS_SIN_CUENTA_ACTIVOS', `return (${variableApp('AVISOS_PUBLICOS_ACTIVOS')});`);
  assert.equal(publicosActivos(true, true, false, true), false, 'con los avisos de la cuenta, no');
  assert.equal(publicosActivos(true, false, true, true), false, 'con la bandeja, no');
  assert.equal(publicosActivos(true, false, false, true), true);
  assert.equal(publicosActivos(true, false, false, false), false, 'sin el interruptor de sin cuenta, no');
  assert.match(APP, /useBandejaAvisos\(\{ cuenta, usuarioId: BANDEJA_AVISOS_ACTIVA \? usuarioAdmitido : null \}\)/);
  // La insignia de la pestaña Inicio ya no cuenta avisos: solo los cambios de lo que sigues sin ver.
  assert.match(APP, /novedades=\{cambiosNoVistos\(avisos, cambiosVistos\)\}/);
  // Perfil › Avisos, el push y la salida dependen solo de los avisos completos; la casilla, además, de su interruptor.
  assert.match(APP, /<AccesoObligatorio[^>]*avisosNovedades=\{CASILLA_ALTA_ACTIVA\}/);
  assert.match(APP, /panelNovedades=\{AVISOS_NOVEDADES_ACTIVOS \? \(/);
  assert.match(APP, /avisosNovedades: CASILLA_ALTA_ACTIVA,/);
  assert.match(APP, /pushNovedades=\{AVISOS_NOVEDADES_ACTIVOS && capacidadPushNovedades\(\)\}/);
  assert.match(APP, /\}, AVISOS_NOVEDADES_ACTIVOS \? \{\s*\/\/ Notificación de novedades/);
  assert.doesNotMatch(APP, /AVISOS_BANDEJA_REMOTA[^\n]*(?:quitarPushAlSalir|capacidadPushNovedades|observarAperturasAvisos)/);
  // El texto versionado del permiso no cambia.
  assert.equal(avisosCuenta.VERSION_AVISOS, 'novedades-v2-2026-11-06');
  // Privacidad: con la bandeja, una frase de lo que se ve y se guarda; sin ella, nada nuevo.
  const entorno = { USUARIO_LOCAL: true, AVISOS_SIN_CUENTA_ACTIVOS: false, e: {}, C: {}, URL_PRIVACIDAD: 'https://rwadar.pages.dev/privacidad', abrirEnlace() {} };
  for (const n of ['Modal', 'SafeAreaProvider', 'SafeAreaView', 'View', 'Text', 'ScrollView', 'Pressable', 'ActivityIndicator']) entorno[n] = n;
  const Privacidad = funcionApp('Privacidad', entorno);
  const FRASE = /En Inicio ves los avisos de tu cuenta: la bienvenida y los anuncios de RWAdar\. La app los lee de Supabase con tu sesión y qué avisos has leído se guarda solo en este dispositivo\. No se envían por correo ni como notificaciones\./;
  const con = texto(Privacidad({ estadoCuenta: { disponible: true }, bandejaAvisos: true }));
  const sin = texto(Privacidad({ estadoCuenta: { disponible: true } }));
  assert.match(con, FRASE);
  assert.doesNotMatch(sin, FRASE);
  for (const t of [con, sin]) {
    assert.match(t, /No se activan opiniones, publicidad, avisos por correo ni push al registrarte/);
    assert.doesNotMatch(t, /Avisos de novedades|marcas su casilla/);
  }
  const frase = con.match(FRASE)[0];
  assert.notEqual(idioma.ingles(frase), frase, 'falta el inglés de la frase de la bandeja');
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
  assert.equal(idioma.ingles('Avisos de novedades activados. Puedes darte de baja aquí cuando quieras.'),
    'News notices turned on. You can unsubscribe here whenever you like.');
  assert.equal(idioma.ingles(QUIEN_MOVIL),
    "With them turned on, Google's notification component (Firebase) also sends Google the dates you open the app (up to 30) and technical details about your phone, which Google uses for its statistics. If you don't turn them on, nothing reaches Google and you will still see your notices on Home.");
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
    assert.match(html, /Información básica sobre tus datos\. Responsable: el titular de RWAdar \(persona física\), identificado con nombre, NIF y domicilio en el aviso legal\./);
    // 12/11/2026: el nombre del titular solo sale en el aviso legal y la privacidad.
    assert.doesNotMatch(html, /Jorques/);
    assert.doesNotMatch(html, /undefined|ExponentPushToken/);
  }
  const baja = renderToStaticMarkup(React.createElement(modulo.AvisoBajaNotificacion, { onDesactivar() {}, onOcultar() {} }));
  assert.match(baja, /¿No quieres estos avisos\? Desactívalos en Perfil o en los ajustes del móvil\./);
  assert.match(baja, /aria-label="Ocultar aviso"/);
});

test('la campana y su lista se renderizan también con React y react-native-web reales', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const absoluto = path.join(RAIZ, 'componentes', 'CampanaAvisos.js');
  const original = Module._load, extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(React, require('react-native-web'));
      if (pedido === 'react-native') return require('react-native-web');
      if (pedido === '../lib/tema') return tema;
      if (pedido === './Navegacion') return { Icono: ({ nombre }) => React.createElement('svg', { 'data-icono': nombre }) };
      if (pedido === 'react-native-safe-area-context') return { SafeAreaProvider: ({ children }) => children, SafeAreaView: ({ children }) => children };
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
  // El botón: el dibujo de la campana y su globo, solo con algo sin leer.
  const con = renderToStaticMarkup(React.createElement(modulo.BotonCampana, { noLeidos: 12, onPress() {} }));
  assert.match(con, /aria-label="Avisos, 12 sin leer"/);
  assert.match(con, /data-icono="campana"/);
  assert.match(con, />9\+</);
  const sin = renderToStaticMarkup(React.createElement(modulo.BotonCampana, { noLeidos: 0, onPress() {} }));
  assert.match(sin, /aria-label="Avisos, ninguno sin leer"/);
  assert.doesNotMatch(sin, /campanaGlobo/);
  const avisos = avisosCuenta.validarAvisosRecientes(RECIENTES);
  const html = renderToStaticMarkup(React.createElement(modulo.ListaAvisos, { avisos, sinLeer: ['bienvenida'], onAbrir() {}, onDesactivar() {} }));
  assert.match(html, /Te damos la bienvenida a RWAdar/);
  assert.match(html, /¿No quieres estos avisos\? Desactívalos en Perfil o en los ajustes del móvil\./);
  assert.ok(html.lastIndexOf('¿No quieres estos avisos?') > html.lastIndexOf('Te damos la bienvenida'), 'debajo de la lista');
  assert.match(html, /01\/11\/2026/);
  assert.equal((html.match(/Sin leer/g) || []).length, 1, 'solo el que estaba sin leer al abrir');
  assert.equal((html.match(/>Abrir</g) || []).length, 2);
  assert.doesNotMatch(html, /Marcar como leídos|undefined/);
});
