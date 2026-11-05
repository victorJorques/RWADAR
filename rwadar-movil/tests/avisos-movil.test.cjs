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

function sdk({ permiso = { granted: false, canAskAgain: true }, solicitado = { granted: true }, token = TOKEN } = {}) {
  const llamadas = [];
  let escuchar;
  return {
    llamadas,
    tocar: (respuesta) => escuchar(respuesta),
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
    // El canal es el mismo que usa la base al enviar.
    const canal = e.sistema.llamadas.find(([n]) => n === 'canal');
    assert.equal(canal[1], 'novedades');
    assert.deepEqual(e.sistema.llamadas.find(([n]) => n === 'token'), ['token', { projectId: 'proyecto-prueba' }]);
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

test('avisos leídos y token del móvil se guardan por cuenta y «Borrar datos del dispositivo» los quita', async () => {
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
  await d.borrarDatosDispositivo();
  assert.deepEqual([...mapa.keys()].sort(), ['otra.app', 'rwadar.editorial.avisos.leidos.v1'].sort());
  await d.guardarTokenPushNovedades(UID, TOKEN);
  await d.borrarTokenPushNovedades(UID);
  assert.equal(await d.tokenPushNovedades(UID), null);
});

test('las claves nuevas cuentan como datos privados del dispositivo', () => {
  const { clavesPrivadasDispositivo } = require('../lib/acceso-obligatorio');
  const propias = [`rwadar.editorial.avisos.leidos.v1:${UID}`, `rwadar.editorial.avisos.push.v1:${UID}`];
  assert.deepEqual(clavesPrivadasDispositivo([...propias, 'rwadar.editorial.avisos.push.v1', `rwadar.editorial.avisos.otro.v1:${UID}`]), propias);
});
