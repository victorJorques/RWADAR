const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');
const LIB = path.join(RAIZ, 'lib') + path.sep;

function cargar(ruta, mocks = {}) {
  const absoluto = path.join(RAIZ, ruta);
  const cargarOriginal = Module._load;
  const jsOriginal = Module._extensions['.js'];

  Module._load = function (pedido, padre, esPrincipal) {
    const claveLocal = padre && padre.filename.startsWith(LIB)
      ? `${path.basename(padre.filename)}:${pedido}`
      : null;
    if (claveLocal && Object.hasOwn(mocks, claveLocal)) return mocks[claveLocal];
    if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return cargarOriginal.call(this, pedido, padre, esPrincipal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (!archivo.startsWith(LIB)) return jsOriginal(modulo, archivo);
    const codigo = fs.readFileSync(archivo, 'utf8');
    const transformado = babel.transformSync(codigo, {
      filename: archivo,
      babelrc: false,
      configFile: false,
      plugins: [commonjs],
    });
    modulo._compile(transformado.code, archivo);
  };

  delete require.cache[absoluto];
  try {
    return require(absoluto);
  } finally {
    Module._load = cargarOriginal;
    Module._extensions['.js'] = jsOriginal;
  }
}

function almacenamientoInicial(valores = {}) {
  const datos = new Map(Object.entries(valores));
  const llamadas = [];
  return {
    datos,
    llamadas,
    async getItem(clave) { return datos.has(clave) ? datos.get(clave) : null; },
    async setItem(clave, valor) { llamadas.push(['setItem', clave]); datos.set(clave, valor); },
    async removeItem(clave) { llamadas.push(['removeItem', clave]); datos.delete(clave); },
    async multiSet(pares) {
      llamadas.push(['multiSet', pares.map(([clave]) => clave)]);
      for (const [clave, valor] of pares) datos.set(clave, valor);
    },
    async multiRemove(claves) {
      llamadas.push(['multiRemove', claves]);
      for (const clave of claves) datos.delete(clave);
    },
  };
}

function clienteFluido({ error = null, eventos = [], data = null } = {}) {
  const consulta = {};
  for (const metodo of ['upsert', 'select', 'eq', 'maybeSingle', 'insert', 'delete', 'order', 'limit']) {
    consulta[metodo] = (...args) => {
      eventos.push([metodo, ...args]);
      return consulta;
    };
  }
  consulta.throwOnError = async () => {
    eventos.push(['throwOnError']);
    if (error) throw error;
    return { data };
  };
  return {
    from(tabla) { eventos.push(['from', tabla]); return consulta; },
  };
}

test('un error de Supabase deja el seguimiento local marcado como pendiente', async () => {
  const almacenamiento = almacenamientoInicial({ 'rwadar.siguiendo': JSON.stringify([]) });
  const eventos = [];
  const datos = cargar('lib/datos.js', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'datos.js:./supabase': {
      clientePublico() { throw new Error('no se usa'); },
      async clienteDispositivo() { return clienteFluido({ error: new Error('RLS'), eventos }); },
      async idInstalacion() { return 'inst_prueba_segura'; },
      async idInstalacionExistente() { return 'inst_prueba_segura'; },
      async borrarIdInstalacionLocal() {},
    },
    'react-native': { Platform: { OS: 'android' } },
  });

  const resultado = await datos.alternarSeguimiento('alpha', 'plataforma-1');
  assert.equal(resultado.sincronizado, false);
  assert.deepEqual(resultado.lista, ['alpha']);
  assert.deepEqual(JSON.parse(almacenamiento.datos.get('rwadar.seguimiento.pendiente')), [
    { slug: 'alpha', plataformaId: 'plataforma-1', seguir: true },
  ]);
  assert.ok(eventos.some(([metodo]) => metodo === 'throwOnError'));
});

test('un borrado remoto fallido conserva ID y cachés', async () => {
  const almacenamiento = almacenamientoInicial({ 'rwadar.siguiendo': JSON.stringify(['alpha']) });
  let borroId = false;
  const datos = cargar('lib/datos.js', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'datos.js:./supabase': {
      clientePublico() {},
      async clienteDispositivo() { return clienteFluido({ error: new Error('red') }); },
      async idInstalacion() { throw new Error('no se debe crear'); },
      async idInstalacionExistente() { return 'inst_prueba_segura'; },
      async borrarIdInstalacionLocal() { borroId = true; },
    },
    'react-native': { Platform: { OS: 'android' } },
  });

  await assert.rejects(datos.borrarDatosDispositivo(), /red/);
  assert.equal(borroId, false);
  assert.equal(almacenamiento.datos.has('rwadar.siguiendo'), true);
  assert.equal(almacenamiento.llamadas.some(([metodo]) => metodo === 'multiRemove'), false);
});

test('el borrado confirmado ocurre en orden remoto, ID y cachés', async () => {
  const almacenamiento = almacenamientoInicial({ 'rwadar.siguiendo': JSON.stringify(['alpha']) });
  const orden = [];
  const cliente = clienteFluido();
  const fromOriginal = cliente.from;
  cliente.from = (tabla) => {
    const consulta = fromOriginal.call(cliente, tabla);
    const throwOriginal = consulta.throwOnError;
    consulta.throwOnError = async () => {
      const resultado = await throwOriginal();
      orden.push('remoto');
      return resultado;
    };
    return consulta;
  };
  const multiRemoveOriginal = almacenamiento.multiRemove.bind(almacenamiento);
  almacenamiento.multiRemove = async (claves) => {
    orden.push('caches');
    return multiRemoveOriginal(claves);
  };
  const datos = cargar('lib/datos.js', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'datos.js:./supabase': {
      clientePublico() {},
      async clienteDispositivo() { return cliente; },
      async idInstalacion() { throw new Error('no se debe crear'); },
      async idInstalacionExistente() { return 'inst_prueba_segura'; },
      async borrarIdInstalacionLocal() { orden.push('id-local'); },
    },
    'react-native': { Platform: { OS: 'android' } },
  });

  assert.deepEqual(await datos.borrarDatosDispositivo(), { ok: true });
  assert.deepEqual(orden, ['remoto', 'id-local', 'caches']);
});

test('consultar catálogo no crea ID; seguimiento usa UUID y SecureStore', async () => {
  const almacenamiento = almacenamientoInicial();
  const seguro = new Map();
  let uuids = 0;
  const supabase = cargar('lib/supabase.js', {
    'react-native-url-polyfill/auto': {},
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'react-native': { Platform: { OS: 'ios' } },
    'expo-crypto': { randomUUID() { uuids += 1; return `00000000-0000-4000-8000-00000000000${uuids}`; } },
    'expo-secure-store': {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
      async getItemAsync(clave) { return seguro.get(clave) || null; },
      async setItemAsync(clave, valor) { seguro.set(clave, valor); },
      async deleteItemAsync(clave) { seguro.delete(clave); },
    },
    '@supabase/supabase-js': { createClient() { return { tipo: 'cliente' }; } },
  });

  supabase.clientePublico();
  assert.equal(await supabase.idInstalacionExistente(), null);
  assert.equal(uuids, 0);
  assert.match(await supabase.idInstalacion(), /^inst_[0-9a-f-]{36}$/);
  assert.equal(uuids, 1);
  assert.equal(almacenamiento.datos.has('rwadar.instalacion'), false);
  await supabase.borrarIdInstalacionLocal();
  assert.equal(await supabase.idInstalacionExistente(), null);
  assert.equal(uuids, 1);
});

test('comprobar avisos nunca solicita permiso automáticamente', async () => {
  let solicitudes = 0;
  const avisos = cargar('lib/avisos.js', {
    'react-native': { Platform: { OS: 'ios' } },
    expo: { isRunningInExpoGo() { return false; } },
    'expo-constants': {
      __esModule: true,
      default: { expoConfig: { extra: { eas: { projectId: 'proyecto-prueba' } } } },
    },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      IosAuthorizationStatus: { PROVISIONAL: 'provisional' },
      AndroidImportance: { HIGH: 4 },
      setNotificationHandler() {},
      async getPermissionsAsync() { return { granted: false, canAskAgain: true, ios: {} }; },
      async requestPermissionsAsync() { solicitudes += 1; return { granted: true }; },
    },
    'avisos.js:./supabase': {
      async clienteDispositivo() { throw new Error('no debe consultar Supabase'); },
      async idInstalacion() { throw new Error('no debe crear ID'); },
      async idInstalacionExistente() { throw new Error('no debe consultar ID'); },
    },
  });

  assert.deepEqual(await avisos.consultarEstadoAvisos(), { ok: false, estado: 'disponible' });
  assert.deepEqual(await avisos.registrarParaAvisos(), { ok: false, estado: 'disponible' });
  assert.equal(solicitudes, 0);
});

test('un upsert push rechazado nunca devuelve éxito ni expone el token', async () => {
  const eventos = [];
  const avisos = cargar('lib/avisos.js', {
    'react-native': { Platform: { OS: 'ios' } },
    expo: { isRunningInExpoGo() { return false; } },
    'expo-constants': {
      __esModule: true,
      default: {
        expoConfig: {
          version: '1.0.0',
          extra: { eas: { projectId: 'proyecto-prueba' }, rwadar: { pushDeliveryEnabled: true } },
        },
      },
    },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      IosAuthorizationStatus: { PROVISIONAL: 'provisional' },
      AndroidImportance: { HIGH: 4 },
      setNotificationHandler() {},
      async getPermissionsAsync() { return { granted: true, canAskAgain: true, ios: {} }; },
      async getExpoPushTokenAsync() { return { data: 'token-de-prueba' }; },
    },
    'avisos.js:./supabase': {
      async clienteDispositivo() { return clienteFluido({ error: new Error('RLS'), eventos }); },
      async idInstalacion() { return 'inst_prueba_segura'; },
      async idInstalacionExistente() { return 'inst_prueba_segura'; },
    },
  });

  const resultado = await avisos.registrarParaAvisos({ solicitarPermiso: true });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.estado, 'error');
  assert.equal(Object.hasOwn(resultado, 'token'), false);
  assert.ok(eventos.some(([metodo]) => metodo === 'throwOnError'));
});

test('la configuración conserva el producto nuevo y falla cerrado', () => {
  const app = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8')).expo;
  const eas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'eas.json'), 'utf8'));
  const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  const codigo = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');

  assert.equal(app.extra.rwadar.pushDeliveryEnabled, false);
  assert.equal(app.runtimeVersion.policy, 'fingerprint');
  assert.ok(app.updates.url.startsWith('https://u.expo.dev/'));
  assert.ok(app.plugins.some((p) => Array.isArray(p) && p[0] === 'expo-secure-store'));
  assert.match(eas.cli.version, /^>=21\.0\.0 <22\.0\.0$/);
  assert.equal(paquete.dependencies['expo-crypto'], '~57.0.1');
  assert.equal(paquete.dependencies['expo-secure-store'], '~57.0.1');
  assert.match(codigo, /import Radar from '.\/componentes\/Radar'/);
  assert.match(codigo, /import Marca from '.\/componentes\/Marca'/);
  assert.doesNotMatch(codigo, /useEffect\(\(\) => \{\s*registrarParaAvisos\(/);
  assert.match(codigo, /Seguir esta plataforma/);
  assert.doesNotMatch(codigo, /Seguir y recibir avisos/);
  assert.match(codigo, /destino\.protocol === 'https:'/);
  assert.match(codigo, /!destino\.username && !destino\.password/);
});
