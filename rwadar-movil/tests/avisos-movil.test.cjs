'use strict';

/* Notificaciones de novedades en el móvil (lib/avisos.js) con el SDK de Expo
   simulado, y el almacén local por cuenta (lib/datos.js). Por debajo del
   código 24 (la 1.4.1) no se llama al SDK; con la 1.4.2, solo tras pulsar. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');
const LIB = path.join(RAIZ, 'lib') + path.sep;
const UID = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'ExponentPushToken[abcdefghijklmnop1234]';
const MODO = { MODO_LOCAL: false, SERVICIOS_USUARIO_REMOTOS: false, AVISOS_NOVEDADES_REMOTOS: true };

/* Como el cargador de flujo.test.cjs, pero los dobles siguen activos hasta
   restaurar: avisos.js lee expo-updates al llamar, no al cargarse. */
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
    const { code } = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
      filename: archivo, babelrc: false, configFile: false, plugins: [commonjs] });
    modulo._compile(code, archivo);
  };
  for (const clave of Object.keys(require.cache)) if (clave.startsWith(LIB)) delete require.cache[clave];
  const modulo = require(absoluto);
  return { modulo, restaurar() { Module._load = cargarOriginal; Module._extensions['.js'] = jsOriginal; } };
}

function sdk({ permiso = { granted: false, canAskAgain: true }, solicitado = { granted: true }, token = TOKEN, presentes = [] } = {}) {
  const llamadas = [];
  let escuchar, recibir;
  return {
    llamadas,
    tocar: (respuesta) => escuchar(respuesta),
    llegar: (notificacion) => recibir(notificacion),
    Notifications: {
      DEFAULT_ACTION_IDENTIFIER: 'default',
      IosAuthorizationStatus: { PROVISIONAL: 'provisional' },
      AndroidImportance: { HIGH: 4, DEFAULT: 3 },
      setNotificationHandler(manejador) { llamadas.push(['handler', manejador]); },
      async setNotificationChannelAsync(id, canal) { llamadas.push(['canal', id, canal]); },
      async getPermissionsAsync() { llamadas.push(['permisos']); return permiso; },
      async requestPermissionsAsync() { llamadas.push(['solicitar']); return solicitado; },
      async getExpoPushTokenAsync(opciones) { llamadas.push(['token', opciones]); return { data: token }; },
      addNotificationResponseReceivedListener(fn) { llamadas.push(['listener']); escuchar = fn; return { remove() { llamadas.push(['retirar']); } }; },
      async getLastNotificationResponseAsync() { llamadas.push(['ultima']); return null; },
      async clearLastNotificationResponseAsync() { llamadas.push(['limpiar']); },
      addNotificationReceivedListener(fn) { llamadas.push(['recibidas']); recibir = fn; return { remove() { llamadas.push(['retirar-recibidas']); } }; },
      async getPresentedNotificationsAsync() { llamadas.push(['presentes']); return presentes; },
      async dismissNotificationAsync(id) { llamadas.push(['quitar', id]); },
      async setBadgeCountAsync() { assert.fail('setBadgeCountAsync no se usa: en Android con 0 borra todas las notificaciones'); },
      async dismissAllNotificationsAsync() { assert.fail('no se quitan notificaciones ajenas a los avisos'); },
    },
  };
}

function avisos({ runtime, modo = MODO, sistema = sdk(), os = 'android', projectId = 'proyecto-prueba' }) {
  const prohibido = () => assert.fail('No se toca Supabase ni la identidad de instalación');
  return { sistema, ...cargar('lib/avisos.js', {
    'avisos.js:./modo-local': modo,
    'avisos.js:./supabase': { clienteDispositivo: prohibido, idInstalacion: prohibido, idInstalacionExistente: prohibido },
    'react-native': { Platform: { OS: os } },
    expo: { isRunningInExpoGo: () => false },
    'expo-constants': { __esModule: true, default: { expoConfig: { extra: { eas: { projectId }, rwadar: { pushDeliveryEnabled: false } } } } },
    'expo-device': { isDevice: true },
    'expo-notifications': sistema.Notifications,
    'expo-updates': { runtimeVersion: runtime },
  }) };
}

test('con la 1.4.1 (código 23) no se llama al SDK de notificaciones aunque el interruptor esté encendido', async () => {
  const prohibido = new Proxy({}, { get: (_, clave) => (clave === '__esModule' ? false : () => assert.fail(`SDK llamado: ${String(clave)}`)) });
  const e = avisos({ runtime: '1.4.1(23)', sistema: { Notifications: prohibido } });
  try {
    assert.equal(e.modulo.capacidadPushNovedades(), false);
    assert.deepEqual(await e.modulo.consultarPushNovedades(), { ok: false, estado: 'requiere-version' });
    assert.deepEqual(await e.modulo.obtenerTokenNovedades({ solicitarPermiso: true }), { ok: false, estado: 'requiere-version' });
    e.modulo.observarAperturasAvisos(() => assert.fail('no hay observador'), { onDestino: () => assert.fail('no hay observador') })();
  } finally { e.restaurar(); }
});

test('con el interruptor apagado ni siquiera se lee la versión nativa', async () => {
  const e = avisos({ runtime: '1.4.2(24)', modo: { ...MODO, AVISOS_NOVEDADES_REMOTOS: false },
    sistema: { Notifications: new Proxy({}, { get: (_, c) => (c === '__esModule' ? false : () => assert.fail('SDK')) }) } });
  try {
    assert.equal(e.modulo.capacidadPushNovedades(), false);
    assert.deepEqual(await e.modulo.consultarPushNovedades(), { ok: false, estado: 'desactivados' });
    assert.deepEqual(await e.modulo.obtenerTokenNovedades({ solicitarPermiso: true }), { ok: false, estado: 'desactivados' });
    e.modulo.observarAperturasAvisos(() => {}, { onDestino: () => {} })();
  } finally { e.restaurar(); }
});

test('con la 1.4.2 (código 24) la consulta es pasiva y el permiso solo se pide tras pulsar', async () => {
  const e = avisos({ runtime: '1.4.2(24)' });
  try {
    assert.equal(e.modulo.capacidadPushNovedades(), true);
    assert.deepEqual(await e.modulo.consultarPushNovedades(), { ok: false, estado: 'disponible' });
    assert.deepEqual(await e.modulo.obtenerTokenNovedades(), { ok: false, estado: 'disponible' });
    assert.equal(e.sistema.llamadas.some(([n]) => n === 'solicitar' || n === 'token'), false);
    const resultado = await e.modulo.obtenerTokenNovedades({ solicitarPermiso: true });
    assert.deepEqual(resultado, { ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' });
    /* Dos canales, los mismos con que envía la base: «cuenta» (la bienvenida)
       y «novedades» (los anuncios). Se crean antes de pedir el permiso. */
    // Una vez por cada llamada (aquí dos: la consulta sin pedir y la de pedir).
    const canales = e.sistema.llamadas.filter(([n]) => n === 'canal');
    assert.deepEqual(canales.map(([, id]) => id), ['cuenta', 'novedades', 'cuenta', 'novedades']);
    assert.deepEqual(canales.slice(2).map(([, , canal]) => canal), [
      // HIGH (4): suena y aparece en pantalla, como un WhatsApp.
      { name: 'Avisos de tu cuenta', description: 'Avisos de servicio de tu cuenta, como la bienvenida.', importance: 4,
        vibrationPattern: [0, 250, 150, 250], lightColor: '#25E39A' },
      { name: 'Novedades de RWAdar', description: 'Fichas nuevas en el radar y novedades de la web y la app.', importance: 4,
        vibrationPattern: [0, 250, 150, 250], lightColor: '#25E39A' },
    ]);
    const orden = e.sistema.llamadas.map(([n]) => n);
    assert.ok(orden.lastIndexOf('canal') < orden.indexOf('solicitar'), 'los canales existen antes de pedir el permiso');
    assert.deepEqual(e.modulo.CANALES_AVISOS.map((canal) => canal.id), ['cuenta', 'novedades']);
    assert.deepEqual(e.sistema.llamadas.find(([n]) => n === 'token'), ['token', { projectId: 'proyecto-prueba' }]);
  } finally { e.restaurar(); }
});

test('con la 1.4.2 los dos canales llevan el nombre en el idioma de la app; en iOS no se crean', async () => {
  const e = avisos({ runtime: '1.4.2(24)', sistema: sdk({ permiso: { granted: true } }) });
  // El mismo módulo de idioma que acaba de cargar avisos.js.
  const idioma = require('../lib/idioma');
  await idioma.cambiarIdioma('en');
  try {
    await e.modulo.obtenerTokenNovedades({ solicitarPermiso: false });
    assert.deepEqual(e.sistema.llamadas.filter(([n]) => n === 'canal').map(([, id, canal]) => [id, canal.name, canal.description]), [
      ['cuenta', 'Account notices', 'Service notices about your account, such as the welcome.'],
      ['novedades', 'RWAdar news', 'New listings on the radar and news about the website and the app.'],
    ]);
  } finally { e.restaurar(); await idioma.cambiarIdioma('es'); }
  const ios = avisos({ runtime: '1.4.2(24)', os: 'ios', sistema: sdk({ permiso: { granted: true } }) });
  try {
    assert.equal((await ios.modulo.obtenerTokenNovedades({ solicitarPermiso: false })).ok, true);
    assert.equal(ios.sistema.llamadas.some(([n]) => n === 'canal'), false);
  } finally { ios.restaurar(); }
});

test('con la 1.4.2 y el permiso ya concedido, la renovación obtiene el token actual sin abrir el diálogo', async () => {
  const e = avisos({ runtime: '1.4.2(24)', sistema: sdk({ permiso: { granted: true } }) });
  try {
    assert.deepEqual(await e.modulo.obtenerTokenNovedades({ solicitarPermiso: false }),
      { ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' });
    assert.equal(e.sistema.llamadas.some(([n]) => n === 'solicitar'), false, 'no se pide permiso');
    assert.equal(e.sistema.llamadas.filter(([n]) => n === 'token').length, 1);
  } finally { e.restaurar(); }
});

test('con la 1.4.2 un permiso denegado, un token raro o un fallo del SDK no dan token', async () => {
  for (const [opciones, estado] of [
    [{ permiso: { granted: false, canAskAgain: false } }, 'denegado'],
    [{ solicitado: { granted: false, canAskAgain: false } }, 'denegado'],
    [{ permiso: { granted: true }, token: 'otro-token' }, 'error'],
    [{ permiso: { granted: true }, token: null }, 'error'],
  ]) {
    const e = avisos({ runtime: '1.4.2(24)', sistema: sdk(opciones) });
    try {
      const resultado = await e.modulo.obtenerTokenNovedades({ solicitarPermiso: true });
      assert.deepEqual(resultado, { ok: false, estado }, JSON.stringify(opciones));
    } finally { e.restaurar(); }
  }
  const sinProyecto = avisos({ runtime: '1.4.2(24)', projectId: null });
  try { assert.deepEqual(await sinProyecto.modulo.consultarPushNovedades(), { ok: false, estado: 'configuracion-pendiente' }); }
  finally { sinProyecto.restaurar(); }
  const web = avisos({ runtime: '1.4.2(24)', os: 'web' });
  try { assert.deepEqual(await web.modulo.obtenerTokenNovedades({ solicitarPermiso: true }), { ok: false, estado: 'no-compatible' }); }
  finally { web.restaurar(); }
});

// 12/11/2026: sin red, Expo puede no dar nunca el token y el interruptor de
// Perfil se quedaba ocupado. Con plazo: «sin-red» (y un fallo del SDK, «error»).
test('con la 1.4.2, si Expo no da el token en el plazo, «sin-red»; si falla, «error»', async () => {
  const colgado = sdk({ permiso: { granted: true } });
  colgado.Notifications.getExpoPushTokenAsync = () => new Promise(() => {});
  const e = avisos({ runtime: '1.4.2(24)', sistema: colgado });
  try {
    const inicio = Date.now();
    assert.deepEqual(await e.modulo.obtenerTokenNovedades({ solicitarPermiso: true, plazoMs: 50 }), { ok: false, estado: 'sin-red' });
    assert.ok(Date.now() - inicio < 2000);
    assert.equal(e.modulo.PLAZO_TOKEN_NOVEDADES_MS, 20000);
  } finally { e.restaurar(); }
  const roto = sdk({ permiso: { granted: true } });
  roto.Notifications.getExpoPushTokenAsync = async () => { throw new Error('SERVICE_NOT_AVAILABLE'); };
  const f = avisos({ runtime: '1.4.2(24)', sistema: roto });
  try { assert.deepEqual(await f.modulo.obtenerTokenNovedades({ solicitarPermiso: false }), { ok: false, estado: 'error' }); }
  finally { f.restaurar(); }
});

test('al tocar una notificación: novedades a su pestaña, slug antiguo a su ficha, lo demás se ignora', async () => {
  const e = avisos({ runtime: '1.4.2(24)' });
  try {
    const destinos = [], slugs = [];
    const detener = e.modulo.observarAperturasAvisos((slug) => { slugs.push(slug); return true; },
      { onDestino: (aviso) => { destinos.push(aviso); return true; } });
    const respuesta = (data, id) => ({ actionIdentifier: 'default', notification: { request: { identifier: id, content: { data } } } });
    e.sistema.tocar(respuesta({ tipo: 'ofertas', destino: 'buscar' }, 'n1'));
    e.sistema.tocar(respuesta({ tipo: 'ofertas', destino: 'buscar' }, 'n1'));
    e.sistema.tocar(respuesta({ tipo: 'bienvenida', destino: 'academy' }, 'n2'));
    e.sistema.tocar(respuesta({ slug: 'ondo-finance' }, 'n3'));
    for (const [i, data] of [{ tipo: 'ofertas', destino: 'https://evil.test' }, { tipo: 'publi', destino: 'inicio' },
      { url: 'https://evil.test' }, { slug: '../radar' }, 'inicio', null].entries()) e.sistema.tocar(respuesta(data, `x${i}`));
    e.sistema.tocar({ actionIdentifier: 'otra-accion', notification: { request: { identifier: 'n4', content: { data: { tipo: 'novedad', destino: 'inicio' } } } } });
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(destinos, [{ tipo: 'ofertas', destino: 'buscar' }, { tipo: 'bienvenida', destino: 'academy' }]);
    assert.deepEqual(slugs, ['ondo-finance']);
    // Se muestra con la app abierta: un único manejador, puesto al observar.
    assert.equal(e.sistema.llamadas.filter(([n]) => n === 'handler').length, 1);
    const comportamiento = await e.sistema.llamadas.find(([n]) => n === 'handler')[1].handleNotification();
    assert.equal(comportamiento.shouldShowBanner, true);
    assert.equal(e.sistema.llamadas.some(([n]) => n === 'solicitar' || n === 'token' || n === 'permisos'), false);
    detener();
    assert.ok(e.sistema.llamadas.some(([n]) => n === 'retirar'));
  } finally { e.restaurar(); }
});

function datos(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  const storage = { async getItem(k) { return mapa.has(k) ? mapa.get(k) : null; }, async setItem(k, v) { mapa.set(k, v); },
    async removeItem(k) { mapa.delete(k); }, async getAllKeys() { return [...mapa.keys()]; },
    async multiRemove(claves) { claves.forEach((k) => mapa.delete(k)); } };
  const e = cargar('lib/datos.js', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    'react-native': { Platform: { OS: 'android' } },
    'datos.js:./modo-local': { MODO_LOCAL: false, SERVICIOS_USUARIO_REMOTOS: false },
    'datos.js:./supabase': {},
  });
  e.restaurar();
  return { datos: e.modulo, mapa };
}

test('avisos leídos, token y renovación del móvil se guardan por cuenta; sin cuenta abierta el token no se borra a ciegas', async () => {
  const { datos: d, mapa } = datos({ 'rwadar.editorial.avisos.leidos.v1': '["bienvenida"]', 'otra.app': 'conservar' });
  assert.deepEqual(await d.avisosLeidos(UID), [], 'no se heredan lecturas sin cuenta');
  assert.deepEqual(await d.marcarAvisosLeidos(UID, ['bienvenida', '7', '7', '<script>', 7, '0']), ['bienvenida', '7']);
  assert.deepEqual(await d.marcarAvisosLeidos(UID, ['8']), ['8', 'bienvenida', '7']);
  assert.deepEqual(await d.avisosLeidos(OTRO), []);
  assert.equal(mapa.get('rwadar.editorial.avisos.leidos.v1:' + UID), '["8","bienvenida","7"]');
  await assert.rejects(d.marcarAvisosLeidos('no-uuid', ['7']));
  assert.equal(await d.tokenPushNovedades(UID), null);
  await d.guardarTokenPushNovedades(UID, TOKEN);
  assert.equal(await d.tokenPushNovedades(UID), TOKEN);
  assert.equal(await d.tokenPushNovedades(OTRO), null);
  await assert.rejects(d.guardarTokenPushNovedades(UID, 'token-raro'));
  mapa.set('rwadar.editorial.avisos.push.v1:' + OTRO, 'manipulado');
  assert.equal(await d.tokenPushNovedades(OTRO), null, 'un valor manipulado no se usa como token');
  mapa.set('rwadar.editorial.avisos.leidos.v1:' + OTRO, '{roto');
  assert.deepEqual(await d.avisosLeidos(OTRO), []);
  // Día de la última renovación del registro, por cuenta y con formato fijo.
  assert.equal(await d.renovacionPushNovedades(UID), null);
  await d.marcarRenovacionPushNovedades(UID, '2026-11-05');
  assert.equal(await d.renovacionPushNovedades(UID), '2026-11-05');
  assert.equal(await d.renovacionPushNovedades(OTRO), null);
  for (const raro of ['05/11/2026', '2026-11-05T10:00', '', null]) await assert.rejects(d.marcarRenovacionPushNovedades(UID, raro));
  await assert.rejects(d.marcarRenovacionPushNovedades('no-uuid', '2026-11-05'));
  mapa.set('rwadar.editorial.avisos.renovado.v1:' + OTRO, 'ayer');
  assert.equal(await d.renovacionPushNovedades(OTRO), null);
  // Sin cuenta abierta no se puede quitar el token de la base: su clave se
  // conserva para quitarlo al entrar y desactivarlas o al cerrar sesión. Una
  // clave que no guarda un token válido no tiene nada que quitar y se borra.
  assert.deepEqual(await d.borrarDatosDispositivo(), { ok: true, local: true });
  assert.deepEqual([...mapa.keys()].sort(),
    ['otra.app', 'rwadar.editorial.avisos.leidos.v1', 'rwadar.editorial.avisos.push.v1:' + UID].sort());
  await d.borrarTokenPushNovedades(UID);
  assert.equal(await d.tokenPushNovedades(UID), null);
});

const TOKEN_OTRO = 'ExpoPushToken[zyxwvutsrqponmlk9876]';
function clienteAvisos(respuesta) {
  const llamadas = [];
  return { llamadas, cliente: { async rpc(nombre, args) { llamadas.push([nombre, args]); return respuesta(nombre, args); } } };
}
function conDatosDeAvisos(extra = {}) {
  return datos({
    ['rwadar.editorial.avisos.push.v1:' + UID]: TOKEN,
    ['rwadar.editorial.avisos.push.v1:' + OTRO]: TOKEN_OTRO,
    ['rwadar.editorial.avisos.leidos.v1:' + UID]: '["9"]',
    ['rwadar.editorial.avisos.renovado.v1:' + UID]: '2026-11-05',
    ['rwadar.editorial.ofertas.guardadas.v1:' + UID]: '[]',
    'otra.app': 'conservar',
    ...extra,
  });
}

test('con la cuenta abierta, «Borrar datos del dispositivo» quita el token de la base antes de borrar su clave', async () => {
  const { datos: d, mapa } = conDatosDeAvisos();
  const { cliente, llamadas } = clienteAvisos(() => ({ data: true, error: null }));
  d.configurarAccesoCatalogo(UID, async () => cliente);
  assert.deepEqual(await d.borrarDatosDispositivo(), { ok: true, local: true });
  // Dos pasadas: antes de borrar la clave y otra después (cubre una renovación en medio).
  assert.deepEqual(llamadas, [['quitar_aviso_push', { p_token: TOKEN }], ['quitar_aviso_push', { p_token: TOKEN }]],
    'solo el token de la cuenta abierta');
  assert.deepEqual([...mapa.keys()].sort(), ['otra.app', 'rwadar.editorial.avisos.push.v1:' + OTRO].sort(),
    'el token de otra cuenta del dispositivo se conserva: solo su sesión puede quitarlo');
  // Si la base ya no lo tenía (false), tampoco queda nada que reintentar.
  const segundo = conDatosDeAvisos();
  segundo.datos.configurarAccesoCatalogo(UID, async () => clienteAvisos(() => ({ data: false, error: null })).cliente);
  await segundo.datos.borrarDatosDispositivo();
  assert.equal(segundo.mapa.has('rwadar.editorial.avisos.push.v1:' + UID), false);
});

test('si no se puede quitar el token de la base, el borrado sigue y la clave se conserva para reintentarlo', async () => {
  const fallos = [
    ['error del servidor', async () => clienteAvisos(() => ({ data: null, error: { code: 'PGRST202', status: 404 } })).cliente],
    ['respuesta rara', async () => clienteAvisos(() => ({ data: 'sí', error: null })).cliente],
    ['sesión caducada', async () => { throw new Error('sin_sesion'); }],
    ['sin conexión', async () => clienteAvisos(() => { throw new Error('red'); }).cliente],
  ];
  for (const [motivo, obtenerCliente] of fallos) {
    const { datos: d, mapa } = conDatosDeAvisos();
    d.configurarAccesoCatalogo(UID, obtenerCliente);
    assert.deepEqual(await d.borrarDatosDispositivo(), { ok: true, local: true }, motivo);
    assert.deepEqual([...mapa.keys()].sort(), ['otra.app', 'rwadar.editorial.avisos.push.v1:' + OTRO,
      'rwadar.editorial.avisos.push.v1:' + UID].sort(), motivo);
    assert.equal(await d.tokenPushNovedades(UID), TOKEN, motivo);
  }
  // Un servidor que no contesta no bloquea el borrado: plazo corto.
  const { datos: d, mapa } = conDatosDeAvisos();
  const colgado = { rpc: () => new Promise(() => {}) };
  d.configurarAccesoCatalogo(UID, async () => colgado);
  const inicio = Date.now();
  assert.deepEqual(await d.borrarDatosDispositivo({ plazoQuitarPush: 30 }), { ok: true, local: true });
  assert.ok(Date.now() - inicio < 2000, 'no espera al servidor');
  assert.equal(mapa.get('rwadar.editorial.avisos.push.v1:' + UID), TOKEN);
  assert.equal(mapa.has('rwadar.editorial.avisos.leidos.v1:' + UID), false);
  // Al reintentarlo con conexión, se quita de la base y ya se borra.
  const { cliente, llamadas } = clienteAvisos(() => ({ data: true, error: null }));
  d.configurarAccesoCatalogo(UID, async () => cliente);
  await d.borrarDatosDispositivo();
  assert.deepEqual(llamadas, [['quitar_aviso_push', { p_token: TOKEN }], ['quitar_aviso_push', { p_token: TOKEN }]]);
  assert.equal(mapa.has('rwadar.editorial.avisos.push.v1:' + UID), false);
  // Sin avisos guardados no se llama a nada.
  const vacio = datos({ 'otra.app': 'conservar' });
  vacio.datos.configurarAccesoCatalogo(UID, async () => assert.fail('sin token no se abre el cliente'));
  assert.deepEqual(await vacio.datos.borrarDatosDispositivo(), { ok: true, local: true });
});

/* La renovación diaria lee el token, espera al sistema (getExpoPushTokenAsync)
   y luego lo registra. «Borrar datos del dispositivo» no pasa por la cola del
   gestor: si llega en medio, quita el token de la base y borra su clave antes
   de que la renovación lo vuelva a registrar. Con el almacén real. */
test('renovación con «Borrar datos del dispositivo» en medio: el móvil no queda apuntado en la base sin su clave', async () => {
  const a = require('../lib/avisos-cuenta');
  const CLAVE = 'rwadar.editorial.avisos.push.v1:' + UID;
  const servidor = a.validarEstadoAvisos({ novedades: true, version: a.VERSION_AVISOS, aceptado_el: '2026-11-05T09:00:00Z',
    version_vigente: a.VERSION_AVISOS, texto_es: a.TEXTO_AVISOS_ES, texto_en: a.TEXTO_AVISOS_EN, dispositivos: 1,
    correo_activo: true, push_activo: true });
  for (const tokenSistema of [TOKEN, TOKEN_OTRO]) {
    const { datos: d, mapa } = datos({ [CLAVE]: TOKEN, 'otra.app': 'conservar' });
    // La base: los tokens apuntados a la cuenta, por cualquiera de los dos caminos.
    const base = new Set([TOKEN]), orden = [];
    const avisosCuenta = {
      async registrarPush(token) { orden.push(['registrar', token]); base.add(token); return true; },
      async quitarPush(token) { orden.push(['quitar', token]); return base.delete(token); },
    };
    d.configurarAccesoCatalogo(UID, async () => ({ async rpc(nombre, args) {
      orden.push(['borrar-datos', nombre, args.p_token]); return { data: base.delete(args.p_token), error: null };
    } }));
    let entregar;
    const push = { capacidad: true, consultar: async () => ({ ok: true, estado: 'permitido' }),
      obtenerToken: (opciones) => { assert.deepEqual(opciones, { solicitarPermiso: false }); return new Promise((r) => { entregar = r; }); } };
    // Las mismas funciones de lib/datos.js que usa componentes/AvisosNovedades.js.
    const almacen = { leidos: d.avisosLeidos, marcarLeidos: d.marcarAvisosLeidos, token: d.tokenPushNovedades,
      guardarToken: d.guardarTokenPushNovedades, borrarToken: d.borrarTokenPushNovedades,
      renovadoEl: d.renovacionPushNovedades, marcarRenovado: d.marcarRenovacionPushNovedades };
    const g = a.crearGestorAvisosNovedades({ avisosCuenta, usuarioId: UID, push, almacen });
    const renovando = g.renovarMovil(servidor);
    for (let i = 0; i < 20 && !entregar; i++) await new Promise((r) => setImmediate(r));
    assert.equal(typeof entregar, 'function', 'la renovación está esperando al sistema');
    assert.deepEqual(await d.borrarDatosDispositivo(), { ok: true, local: true });
    assert.equal(mapa.has(CLAVE), false, '«Borrar datos» quitó el token de la base y borró su clave');
    assert.equal(base.size, 0);
    entregar({ ok: true, estado: 'permitido', token: tokenSistema, plataforma: 'android' });
    assert.deepEqual(await renovando, { renovado: false, motivo: 'borrado' }, tokenSistema);
    assert.deepEqual(orden, [['borrar-datos', 'quitar_aviso_push', TOKEN], ['borrar-datos', 'quitar_aviso_push', TOKEN],
      ['registrar', tokenSistema], ['quitar', tokenSistema]], 'lo que la renovación registró tarde se quita');
    assert.equal(base.size, 0, 'ningún token queda en la base sin dueño en este móvil');
    assert.equal(mapa.has(CLAVE), false, 'y no se vuelve a guardar');
  }
});

/* El hueco que queda entre las dos mitades de «Borrar datos»: la renovación
   vuelve a registrar el token después de la primera retirada pero antes de que
   se borre la clave (así la renovación ve la clave y no deshace nada). La
   segunda pasada de «Borrar datos», ya sin clave, lo quita. */
test('«Borrar datos» quita también un token que la renovación registró entre la retirada y el borrado de la clave', async () => {
  const CLAVE = 'rwadar.editorial.avisos.push.v1:' + UID;
  const { datos: d, mapa } = datos({ [CLAVE]: TOKEN, 'otra.app': 'conservar' });
  const base = new Set([TOKEN]); let llamadas = 0;
  d.configurarAccesoCatalogo(UID, async () => ({ async rpc(nombre, args) {
    assert.equal(nombre, 'quitar_aviso_push');
    llamadas++;
    const habia = base.delete(args.p_token);
    // Primera retirada: justo después, una renovación en curso lo vuelve a apuntar.
    if (llamadas === 1) base.add(args.p_token);
    return { data: habia, error: null };
  } }));
  assert.deepEqual(await d.borrarDatosDispositivo(), { ok: true, local: true });
  assert.equal(llamadas, 2);
  assert.equal(base.size, 0, 'el token registrado en medio también se quita de la base');
  assert.equal(mapa.has(CLAVE), false);
});

test('las claves nuevas cuentan como datos privados del dispositivo; la del token, aparte', () => {
  const { clavesPrivadasDispositivo } = require('../lib/acceso-obligatorio');
  const propias = [`rwadar.editorial.avisos.leidos.v1:${UID}`, `rwadar.editorial.avisos.renovado.v1:${UID}`];
  assert.deepEqual(clavesPrivadasDispositivo([...propias, `rwadar.editorial.avisos.push.v1:${UID}`,
    'rwadar.editorial.avisos.push.v1', 'rwadar.editorial.avisos.renovado.v1', `rwadar.editorial.avisos.otro.v1:${UID}`]), propias,
  'el token de este móvil solo se borra después de quitarlo de la base (lib/datos.js)');
});

test('al llegar un aviso con la app abierta se recarga el «1»; lo ajeno no cuenta', async () => {
  const e = avisos({ runtime: '1.4.2(24)' });
  try {
    let recargas = 0;
    const dejar = e.modulo.observarAvisosRecibidos(() => { recargas += 1; });
    e.sistema.llegar({ request: { content: { data: { tipo: 'novedad', destino: 'inicio' } } } });
    e.sistema.llegar({ request: { content: { data: { otra: 'cosa' } } } });
    e.sistema.llegar({ request: { content: { data: { tipo: 'novedad', destino: 'https://malo.example' } } } });
    assert.equal(recargas, 1);
    dejar();
    assert.ok(e.sistema.llamadas.some(([n]) => n === 'retirar-recibidas'));
    // No pide permisos ni token.
    assert.equal(e.sistema.llamadas.some(([n]) => ['permisos', 'solicitar', 'token'].includes(n)), false);
  } finally { e.restaurar(); }
});

test('sin capacidad (1.4.1) o con el interruptor apagado no se escucha nada', async () => {
  for (const opciones of [{ runtime: '1.4.1(23)' }, { runtime: '1.4.2(24)', modo: { ...MODO, AVISOS_NOVEDADES_REMOTOS: false } }]) {
    const prohibido = new Proxy({}, { get: (_, clave) => (clave === '__esModule' ? false : () => assert.fail(`SDK llamado: ${String(clave)}`)) });
    const e = avisos({ ...opciones, sistema: { Notifications: prohibido } });
    try {
      e.modulo.observarAvisosRecibidos(() => assert.fail('no hay observador'))();
      assert.equal(await e.modulo.retirarNotificacionesAvisos(), 0);
    } finally { e.restaurar(); }
  }
});

test('al leerlo todo se quitan del sistema solo las notificaciones de avisos de RWAdar', async () => {
  const presentes = [
    { request: { identifier: 'a1', content: { data: { tipo: 'novedad', destino: 'inicio' } } } },
    { request: { identifier: 'b1', content: { data: { tipo: 'bienvenida', destino: 'academy' } } } },
    { request: { identifier: 'x1', content: { data: { de: 'otra-cosa' } } } },
    { request: { content: { data: { tipo: 'novedad', destino: 'inicio' } } } },
  ];
  const e = avisos({ runtime: '1.4.2(24)', sistema: sdk({ presentes }) });
  try {
    const quitadas = await e.modulo.retirarNotificacionesAvisos();
    const ids = e.sistema.llamadas.filter(([n]) => n === 'quitar').map(([, id]) => id);
    // Las dos de RWAdar con identificador; ni la ajena ni la que no tiene identificador.
    assert.deepEqual(ids, ['a1', 'b1']);
    assert.equal(quitadas, 2);
  } finally { e.restaurar(); }
});
