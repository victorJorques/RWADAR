const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');
const LIB = path.join(RAIZ, 'lib') + path.sep;
const MODO_INTERNO = {
  MODO_LOCAL: true,
  SERVICIOS_USUARIO_REMOTOS: false,
  exigirModoLocal() {},
};
const MODO_REMOTO = {
  MODO_LOCAL: false,
  SERVICIOS_USUARIO_REMOTOS: true,
  exigirModoLocal() { throw new Error('no se usa en estas pruebas remotas'); },
};

function cargar(ruta, mocks = {}) {
  const absoluto = path.join(RAIZ, ruta);
  const cargarOriginal = Module._load;
  const jsOriginal = Module._extensions['.js'];

  Module._load = function (pedido, padre, esPrincipal) {
    const claveLocal = padre && padre.filename.startsWith(LIB)
      ? `${path.basename(padre.filename)}:${pedido}`
      : null;
    if (claveLocal && Object.hasOwn(mocks, claveLocal)) {
      const mock = mocks[claveLocal];
      mock?.__alCargar?.();
      return mock;
    }
    if (Object.hasOwn(mocks, pedido)) {
      const mock = mocks[pedido];
      mock?.__alCargar?.();
      return mock;
    }
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
    async getItem(clave) { llamadas.push(['getItem', clave]); return datos.has(clave) ? datos.get(clave) : null; },
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
    'datos.js:./modo-local': MODO_REMOTO,
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
    'datos.js:./modo-local': MODO_REMOTO,
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
    'datos.js:./modo-local': MODO_REMOTO,
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
  const opcionesClientes = [];
  let uuids = 0;
  const supabase = cargar('lib/supabase.js', {
    'supabase.js:./modo-local': MODO_REMOTO,
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
    '@supabase/supabase-js': { createClient(_url, _clave, opciones) {
      opcionesClientes.push(opciones); return { tipo: 'cliente' };
    } },
  });

  supabase.clientePublico();
  assert.equal(await supabase.idInstalacionExistente(), null);
  assert.equal(uuids, 0);
  assert.match(await supabase.idInstalacion(), /^inst_[0-9a-f-]{36}$/);
  assert.equal(uuids, 1);
  assert.equal(almacenamiento.datos.has('rwadar.instalacion'), false);
  await supabase.clienteDispositivo();
  assert.equal(opcionesClientes.length, 2);
  assert.ok(opcionesClientes.every(({ auth }) => auth.detectSessionInUrl === false &&
    auth.persistSession === false && auth.autoRefreshToken === false));
  await supabase.borrarIdInstalacionLocal();
  assert.equal(await supabase.idInstalacionExistente(), null);
  assert.equal(uuids, 1);
});

test('comprobar avisos nunca solicita permiso automáticamente', async () => {
  let solicitudes = 0;
  const avisos = cargar('lib/avisos.js', {
    'react-native': { Platform: { OS: 'ios' } },
    'avisos.js:./modo-local': MODO_REMOTO,
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
    'avisos.js:./modo-local': MODO_REMOTO,
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

test('un toque push abre solo un slug editorial valido sin pedir permisos', async () => {
  let escuchar;
  let retirado = false;
  let solicitudes = 0;
  let limpiezas = 0;
  const abiertos = [];
  const respuesta = (slug, identificador = 'aviso-1') => ({
    actionIdentifier: 'default',
    notification: {
      request: { identifier: identificador, content: { data: { slug } } },
    },
  });
  const avisos = cargar('lib/avisos.js', {
    'react-native': { Platform: { OS: 'android' } },
    'avisos.js:./modo-local': MODO_REMOTO,
    expo: { isRunningInExpoGo() { return false; } },
    'expo-constants': { __esModule: true, default: {} },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      DEFAULT_ACTION_IDENTIFIER: 'default',
      IosAuthorizationStatus: { PROVISIONAL: 'provisional' },
      AndroidImportance: { HIGH: 4 },
      setNotificationHandler() {},
      addNotificationResponseReceivedListener(fn) {
        escuchar = fn;
        return { remove() { retirado = true; } };
      },
      async getLastNotificationResponseAsync() { return respuesta('reental'); },
      async clearLastNotificationResponseAsync() { limpiezas += 1; },
      async requestPermissionsAsync() { solicitudes += 1; },
    },
    'avisos.js:./supabase': {},
  });

  assert.equal(avisos.slugDesdeRespuestaAviso(respuesta('alpha-rwa')), 'alpha-rwa');
  assert.equal(avisos.slugDesdeRespuestaAviso(respuesta('https://mal.example')), null);
  assert.equal(avisos.slugDesdeRespuestaAviso(respuesta('../radar')), null);

  const detener = avisos.observarAperturasAvisos(async (slug) => {
    abiertos.push(slug);
    return true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  escuchar(respuesta('ondo', 'aviso-2'));
  escuchar(respuesta('ondo', 'aviso-2'));
  escuchar(respuesta('https://mal.example', 'aviso-3'));
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(abiertos, ['reental', 'ondo']);
  assert.equal(limpiezas, 2);
  assert.equal(solicitudes, 0);
  detener();
  assert.equal(retirado, true);
});

test('el modo local carga todo el escaparate sin importar ni consultar Supabase', async () => {
  const almacenamiento = almacenamientoInicial({
    'rwadar.siguiendo': JSON.stringify(['produccion-intocable']),
    'rwadar.seguimiento.pendiente': JSON.stringify([{ slug: 'produccion-intocable' }]),
  });
  let accesoSupabase = 0;
  const prohibido = {
    __alCargar() { accesoSupabase += 1; throw new Error('Supabase no debe importarse en modo local'); },
  };
  const datos = cargar('lib/datos.js', {
    'datos.js:./modo-local': MODO_INTERNO,
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'datos.js:./supabase': prohibido,
    'react-native': { Platform: { OS: 'android' } },
  });

  const [radar, fuera, ofertas, secundario, exclusiones] = await Promise.all([
    datos.cargarRadar(), datos.cargarFuera(), datos.cargarOfertas(),
    datos.cargarSecundario(), datos.cargarExclusiones(),
  ]);
  assert.equal(radar.datos.length, 26);
  assert.equal(fuera.datos.length, 4);
  assert.equal(ofertas.datos.length, 28);
  assert.equal(secundario.datos.length, 24);
  assert.equal(exclusiones.datos.length, 15);
  const proveedores = datos.proveedoresDeOfertas([...ofertas.datos, ...secundario.datos]);
  assert.equal(proveedores.length, 7);
  assert.deepEqual(proveedores.find((p) => p.slug === 'aktionariat'), {
    slug: 'aktionariat', nombre: 'Aktionariat',
  });
  assert.equal(accesoSupabase, 0);

  const seguimiento = await datos.alternarSeguimiento('reental', 'plataforma-local-reental');
  assert.equal(seguimiento.local, true);
  assert.equal(seguimiento.sincronizado, true);
  assert.deepEqual(await datos.sincronizarSeguimientoPendiente(), {
    sincronizados: 0, pendientes: 0, errores: [], local: true,
  });
  assert.equal(accesoSupabase, 0);

  const clavesTocadas = almacenamiento.llamadas.flatMap(([metodo, valor]) => {
    if (metodo === 'multiRemove' || metodo === 'multiSet') {
      return Array.isArray(valor) ? valor.flatMap((v) => Array.isArray(v) ? v[0] : v) : [];
    }
    return typeof valor === 'string' ? [valor] : [];
  });
  assert.ok(clavesTocadas.length > 0);
  assert.ok(clavesTocadas.every((clave) => clave.startsWith('rwadar.local.')),
    `se tocó una clave no local: ${clavesTocadas.find((clave) => !clave.startsWith('rwadar.local.'))}`);
  assert.deepEqual(JSON.parse(almacenamiento.datos.get('rwadar.siguiendo')), ['produccion-intocable']);
  assert.equal(almacenamiento.datos.has('rwadar.seguimiento.pendiente'), true);

  assert.deepEqual(await datos.borrarDatosDispositivo(), { ok: true, local: true });
  assert.deepEqual(JSON.parse(almacenamiento.datos.get('rwadar.siguiendo')), ['produccion-intocable']);
  assert.equal(almacenamiento.datos.has('rwadar.seguimiento.pendiente'), true);
  assert.equal(accesoSupabase, 0);
});

test('una caché local antigua no puede sustituir el catálogo incluido, ni siquiera con soloCache', async () => {
  const almacenamiento = almacenamientoInicial({
    'rwadar.local.cache.radar': '[{"slug":"plataforma-obsoleta"}]',
    'rwadar.local.cache.ofertas': '[{"slug":"oferta-obsoleta"}]',
  });
  const datos = cargar('lib/datos.js', {
    'datos.js:./modo-local': MODO_INTERNO,
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'react-native': { Platform: { OS: 'android' } },
    'datos.js:./supabase': { __alCargar() { throw new Error('No importar producción'); } },
  });
  const catalogo = await datos.cargarCatalogo({ soloCache: true });
  assert.equal(catalogo.local, true);
  assert.equal(catalogo.plataformas.length, 26);
  assert.equal(catalogo.ofertas.length, 28);
  assert.ok(catalogo.ofertas.every(o => o.verificadaEl === '2026-09-27'));
  assert.ok(!JSON.stringify(catalogo).includes('obsoleta'));
});

test('el adaptador remoto de datos no puede usar el fixture como sustituto de un lote retirado', async () => {
  const almacenamiento = almacenamientoInicial();
  const tablas = [];
  const datos = cargar('lib/datos.js', {
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'react-native': { Platform: { OS: 'android' } },
    'datos.js:./modo-local': MODO_REMOTO,
    'datos.js:./supabase': { clientePublico: () => ({ from(tabla) {
      tablas.push(tabla);
      return { select: () => ({ limit: async () => ({ data: [], error: null, status: 200 }) }) };
    } }) },
  });
  const resultado = await datos.cargarCatalogo();
  assert.deepEqual(resultado.plataformas, []);
  assert.deepEqual(resultado.ofertas, []);
  assert.ok(resultado.error);
  assert.deepEqual(tablas, ['catalogo_plataformas_publicas_v2', 'catalogo_ofertas_publicas_v2']);
  assert.equal((await datos.cargarRadar({ soloCache: true })).datos.length, 0);
  assert.equal((await datos.cargarOfertas({ soloCache: true })).datos.length, 0);
});

test('las ofertas se normalizan sin perder métricas y calculan su TTL', () => {
  const almacenamiento = almacenamientoInicial();
  const datos = cargar('lib/datos.js', {
    'datos.js:./modo-local': MODO_INTERNO,
    '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
    'react-native': { Platform: { OS: 'web' } },
  });
  const oferta = datos.normalizarOferta({
    slug: ' ejemplo ', titulo: ' Oferta ', plataformaSlug: 'proveedor',
    verificadaEl: '2026-08-18', vigenciaDias: 14,
    metricas: [{ etiqueta: null, valor: '30 meses' }, { etiqueta: 'Ticket', valor: '100 €' }],
    rentabilidad: { mostrada: '10,00 %', literal: '10 % anual estimado' },
    precio: { mostrado: '97,50–101,00 $', unidad: 'token' },
    avisos: [{ texto: ' España ✓ ', tono: 'ok' }, { texto: ' Ventana vencida ', tono: 'stop' }, { texto: '' }],
  });
  assert.equal(oferta.slug, 'ejemplo');
  assert.equal(oferta.disponibleEs, null);
  assert.equal(oferta.patrocinada, false);
  assert.deepEqual(oferta.metricas, [
    { etiqueta: 'Dato 1', valor: '30 meses' },
    { etiqueta: 'Ticket', valor: '100 €' },
  ]);
  assert.deepEqual(oferta.avisos, [
    { texto: 'España ✓', tono: 'ok' },
    { texto: 'Ventana vencida', tono: 'stop' },
  ]);
  assert.deepEqual(datos.vigenciaOferta(oferta, new Date('2026-08-30T12:00:00Z')), {
    estado: 'proxima', etiqueta: 'Cifras vigentes 2 d',
    venceEl: '2026-09-01T00:00:00.000Z', dias: 2,
  });
  assert.deepEqual(datos.vigenciaOferta(oferta, new Date('2026-09-01T18:00:00Z')), {
    estado: 'proxima', etiqueta: 'Cifras vigentes hasta hoy',
    venceEl: '2026-09-01T00:00:00.000Z', dias: 0,
  });
  const comercial = datos.normalizarOferta({
    slug: 'patrocinada', disponibleEs: false, patrocinada: true,
  });
  assert.equal(comercial.disponibleEs, false);
  assert.equal(comercial.patrocinada, true);
  const buscable = datos.textoBusquedaOferta({
    ...oferta, verificadaEl: '2000-01-01', vigenciaDias: 1,
  });
  for (const fragmento of ['ventana vencida', 'stop', 'cifras por actualizar']) {
    assert.ok(buscable.includes(fragmento), `la búsqueda no indexó ${fragmento}`);
  }
  for (const fragmento of ['10,00 %', '97,50–101,00 $', '100 €']) {
    assert.ok(!buscable.includes(fragmento), `la búsqueda mantuvo una cifra caducada: ${fragmento}`);
  }

  const permanente = datos.normalizarOferta({
    slug: 'producto-continuo', permanente: true,
    verificadaEl: '2026-08-27', vigenciaDias: 1,
  });
  assert.deepEqual(datos.vigenciaOferta(permanente, new Date('2026-08-30T12:00:00Z')), {
    estado: 'permanente-vencida', etiqueta: 'Cifras por actualizar',
    venceEl: '2026-08-28T00:00:00.000Z', dias: -2,
  });

  const noVerificable = datos.normalizarOferta({
    slug: 'apertura-dudosa', estadoRevision: 'no_verificable',
    verificadaEl: '2026-09-21', vigenciaDias: 1,
  });
  assert.deepEqual(datos.vigenciaOferta(noVerificable, new Date('2026-09-21T12:00:00Z')), {
    estado: 'bloqueada', etiqueta: 'Apertura no confirmada', venceEl: null, dias: null,
  });

  const fuentesEnConflicto = datos.normalizarOferta({
    slug: 'fuentes-dudosas', estadoRevision: 'fuentes_en_conflicto',
    verificadaEl: '2026-09-21', vigenciaDias: 1,
  });
  assert.deepEqual(datos.vigenciaOferta(fuentesEnConflicto, new Date('2026-09-21T12:00:00Z')), {
    estado: 'conflicto', etiqueta: 'Fuentes oficiales en conflicto', venceEl: null, dias: null,
  });
});

test('los avisos locales no registran handler, permiso, token, listener ni Supabase', async () => {
  const llamadas = [];
  let accesoSupabase = 0;
  const avisos = cargar('lib/avisos.js', {
    'avisos.js:./modo-local': MODO_INTERNO,
    'react-native': { Platform: { OS: 'android' } },
    expo: { isRunningInExpoGo() { llamadas.push('expo-go'); return false; } },
    'expo-constants': { __esModule: true, default: {} },
    'expo-device': { isDevice: true },
    'expo-notifications': {
      setNotificationHandler() { llamadas.push('handler'); },
      getPermissionsAsync() { llamadas.push('permisos'); },
      requestPermissionsAsync() { llamadas.push('solicitar'); },
      getExpoPushTokenAsync() { llamadas.push('token'); },
      addNotificationResponseReceivedListener() { llamadas.push('listener'); },
    },
    'avisos.js:./supabase': {
      __alCargar() { accesoSupabase += 1; throw new Error('Supabase no debe cargarse'); },
    },
  });

  const detener = avisos.observarAperturasAvisos(() => true);
  detener();
  assert.deepEqual(await avisos.consultarEstadoAvisos(), { ok: false, estado: 'local', local: true });
  assert.deepEqual(await avisos.registrarParaAvisos({ solicitarPermiso: true }), {
    ok: false, estado: 'local', local: true,
  });
  assert.deepEqual(llamadas, []);
  assert.equal(accesoSupabase, 0);
});

test('el fixture mantiene separados los proveedores que no pertenecen al radar', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(RAIZ, 'fixtures', 'escaparate-local.json'), 'utf8'));
  const canonicos = new Set(fixture.plataformas.map((p) => p.slug));
  assert.deepEqual(fixture.proveedoresSoloEscaparate.map((p) => p.slug).sort(), [
    'aktionariat', 'alius-capital', 'brickwise', 'prosegur-crypto',
  ]);
  assert.ok(fixture.proveedoresSoloEscaparate.every((p) => p.soloEscaparate === true));
  assert.ok(fixture.proveedoresSoloEscaparate.every((p) => !canonicos.has(p.slug)));
});

test('la configuración conserva el producto nuevo y falla cerrado', () => {
  const app = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8')).expo;
  const eas = JSON.parse(fs.readFileSync(path.join(RAIZ, 'eas.json'), 'utf8'));
  const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  const codigo = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const modoLocal = fs.readFileSync(path.join(RAIZ, 'lib', 'modo-local.js'), 'utf8');

  assert.equal(app.extra.rwadar.pushDeliveryEnabled, false);
  assert.equal(app.runtimeVersion.policy, 'appVersion');
  assert.equal(app.version, '1.1.2');
  assert.ok(app.updates.url.startsWith('https://u.expo.dev/'));
  assert.equal(app.updates.enabled, false, 'la build no descarga código de canales anteriores');
  assert.equal(app.android.allowBackup, false);
  for (const permiso of [
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.USE_BIOMETRIC',
    'android.permission.USE_FINGERPRINT',
    'android.permission.WAKE_LOCK',
    'com.google.android.c2dm.permission.RECEIVE',
    'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE',
    'com.sec.android.provider.badge.permission.READ',
    'com.sec.android.provider.badge.permission.WRITE',
    'com.htc.launcher.permission.READ_SETTINGS',
    'com.htc.launcher.permission.UPDATE_SHORTCUT',
    'com.sonyericsson.home.permission.BROADCAST_BADGE',
    'com.sonymobile.home.permission.PROVIDER_INSERT_BADGE',
    'com.anddoes.launcher.permission.UPDATE_COUNT',
    'com.majeur.launcher.permission.UPDATE_BADGE',
    'com.huawei.android.launcher.permission.CHANGE_BADGE',
    'com.huawei.android.launcher.permission.READ_SETTINGS',
    'com.huawei.android.launcher.permission.WRITE_SETTINGS',
    'android.permission.READ_APP_BADGE',
    'com.oppo.launcher.permission.READ_SETTINGS',
    'com.oppo.launcher.permission.WRITE_SETTINGS',
    'me.everything.badger.permission.BADGE_COUNT_READ',
    'me.everything.badger.permission.BADGE_COUNT_WRITE',
  ]) {
    assert.ok(app.android.blockedPermissions.includes(permiso),
      `El manifiesto editorial debe retirar el permiso heredado ${permiso}`);
  }
  for (const permiso of ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.VIBRATE', 'com.rwadar.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION']) {
    assert.ok(!app.android.blockedPermissions.includes(permiso),
      `Se conserva la capacidad necesaria o protección interna ${permiso}`);
  }
  assert.equal(eas.build.editorial.android.buildType, 'apk');
  assert.equal(eas.build.editorial.channel, 'editorial');
  assert.equal(eas.build.editorial.distribution, 'internal');
  assert.doesNotMatch(app.description, /26 verificadas/);
  assert.ok(app.plugins.some((p) => Array.isArray(p) && p[0] === 'expo-secure-store'));
  assert.match(eas.cli.version, /^>=21\.0\.0 <22\.0\.0$/);
  assert.equal(paquete.dependencies['expo-crypto'], '~57.0.3');
  assert.equal(paquete.dependencies['expo-secure-store'], '~57.0.4');
  assert.match(codigo, /import Radar from '.\/componentes\/Radar'/);
  assert.match(codigo, /import Marca from '.\/componentes\/Marca'/);
  assert.match(codigo, /observarAperturasAvisos/);
  assert.match(codigo, /p\.slug === slugAvisoPendiente/);
  assert.doesNotMatch(codigo, /useEffect\(\(\) => \{\s*registrarParaAvisos\(/);
  assert.match(codigo, /Seguir esta plataforma/);
  assert.doesNotMatch(codigo, /Seguir y recibir avisos/);
  assert.match(codigo, /destino\.protocol === 'https:'/);
  assert.match(codigo, /!destino\.username && !destino\.password/);
  assert.match(codigo, /setEstadoAvisos\(MODO_LOCAL[\s\S]*estado: 'local'/);
  assert.match(modoLocal, /MODO_DATOS = 'catalogo-editorial'/);
  assert.match(modoLocal, /MODO_LOCAL = MODO_DATOS !== 'catalogo-editorial'/);
  assert.equal(cargar('lib/modo-local.js').MODO_LOCAL, false);
  assert.equal(cargar('lib/modo-local.js').SERVICIOS_USUARIO_REMOTOS, false);
});

test('el catálogo conectado no habilita seguimiento remoto ni consume datos históricos', async () => {
  for (const capacidad of [false, undefined, 'true', 1]) {
    const anteriores = {
      'rwadar.instalacion': 'inst_anterior_conservar',
      'rwadar.siguiendo': '["historica"]',
      'rwadar.seguimiento.pendiente': '[{"slug":"historica","plataformaId":"id","seguir":true}]',
      'rwadar.local.siguiendo': '["interna"]',
      'otro.proyecto': 'no-tocar',
    };
    const almacenamiento = almacenamientoInicial(anteriores);
    const tablas = [];
    const prohibido = () => assert.fail('No se permite identidad, escritura ni lectura de usuario');
    const datos = cargar('lib/datos.js', {
      '@react-native-async-storage/async-storage': { __esModule: true, default: almacenamiento },
      'react-native': { Platform: { OS: 'android' } },
      'datos.js:./modo-local': { ...MODO_REMOTO, SERVICIOS_USUARIO_REMOTOS: capacidad },
      'datos.js:./supabase': {
        clientePublico: () => ({ from(tabla) {
          tablas.push(tabla);
          return { select: () => ({ limit: async () => ({ data: [], error: null }) }) };
        } }),
        clienteDispositivo: prohibido, idInstalacion: prohibido,
        idInstalacionExistente: prohibido, borrarIdInstalacionLocal: prohibido,
      },
    });
    const catalogo = await datos.cargarCatalogo();
    assert.deepEqual(tablas.sort(), ['catalogo_ofertas_publicas_v2', 'catalogo_plataformas_publicas_v2']);
    assert.deepEqual(catalogo.plataformas, []);
    assert.deepEqual(await datos.siguiendo(), []);
    assert.deepEqual(await datos.alternarSeguimiento('nueva', 'id-nueva'), {
      lista: ['nueva'], sincronizado: true, local: true, error: null,
    });
    assert.equal(almacenamiento.datos.get('rwadar.editorial.siguiendo'), '["nueva"]');
    assert.equal(almacenamiento.datos.has('rwadar.editorial.seguimiento.pendiente'), false);
    assert.deepEqual(await datos.novedades(['nueva']), { datos: [], local: true, error: null });
    assert.deepEqual(await datos.sincronizarSeguimientoPendiente(), {
      sincronizados: 0, pendientes: 0, errores: [], local: true,
    });
    await datos.alternarSeguimiento('nueva', 'id-nueva');
    assert.deepEqual(await datos.siguiendo(), []);
    almacenamiento.datos.set('rwadar.cache.catalogo.v2', 'copia-borrable');
    almacenamiento.datos.set('rwadar.cache.catalogo.v1', 'copia-de-version-anterior');
    assert.deepEqual(await datos.borrarDatosDispositivo(), { ok: true, local: true });
    assert.deepEqual(Object.fromEntries(almacenamiento.datos), anteriores);
    const clavesTocadas = almacenamiento.llamadas.flatMap(([, claves]) => Array.isArray(claves) ? claves : [claves]);
    assert.ok(clavesTocadas.every((clave) => clave.startsWith('rwadar.editorial.') ||
      ['rwadar.cache.catalogo.v1', 'rwadar.cache.catalogo.v2'].includes(clave)));
  }
});

test('los avisos editoriales ignoran incluso permisos o tokens anteriores sin invocar SDK ni Supabase', async () => {
  for (const capacidad of [false, undefined, 'true', 1]) {
    const prohibido = () => assert.fail('SDK de avisos/identidad desactivado');
    const avisos = cargar('lib/avisos.js', {
      'avisos.js:./modo-local': { ...MODO_REMOTO, SERVICIOS_USUARIO_REMOTOS: capacidad },
      'avisos.js:./supabase': { __alCargar: prohibido },
      'react-native': { Platform: { OS: 'android' } },
      expo: { isRunningInExpoGo: prohibido },
      'expo-constants': { __esModule: true, default: { expoConfig: {
        extra: { eas: { projectId: 'prueba' }, rwadar: { pushDeliveryEnabled: true } },
      } } },
      'expo-device': { isDevice: true },
      'expo-notifications': {
        setNotificationHandler: prohibido, getPermissionsAsync: prohibido,
        requestPermissionsAsync: prohibido, getExpoPushTokenAsync: prohibido,
        setNotificationChannelAsync: prohibido, addNotificationResponseReceivedListener: prohibido,
        getLastNotificationResponseAsync: prohibido, clearLastNotificationResponseAsync: prohibido,
      },
    });
    avisos.observarAperturasAvisos(prohibido)();
    assert.deepEqual(await avisos.consultarEstadoAvisos(), { ok: false, estado: 'desactivados' });
    assert.deepEqual(await avisos.registrarParaAvisos({ solicitarPermiso: true }), {
      ok: false, estado: 'desactivados',
    });
  }
});

test('la guarda de identidad bloquea llamadas directas antes de leer, crear, migrar o borrar un UUID', async () => {
  for (const modo of [
    { MODO_LOCAL: false, SERVICIOS_USUARIO_REMOTOS: false },
    { MODO_LOCAL: false },
    { MODO_LOCAL: false, SERVICIOS_USUARIO_REMOTOS: 'true' },
    { MODO_LOCAL: true, SERVICIOS_USUARIO_REMOTOS: true },
  ]) {
    const prohibido = () => assert.fail('No debe tocar almacenamiento o identidad');
    const clientes = [];
    const supabase = cargar('lib/supabase.js', {
      'supabase.js:./modo-local': modo,
      'react-native-url-polyfill/auto': {},
      'react-native': { Platform: { OS: 'ios' } },
      '@react-native-async-storage/async-storage': { __esModule: true, default: new Proxy({}, { get: () => prohibido }) },
      'expo-crypto': { randomUUID: prohibido },
      'expo-secure-store': { getItemAsync: prohibido, setItemAsync: prohibido, deleteItemAsync: prohibido },
      '@supabase/supabase-js': { createClient(_url, _clave, opciones) {
        clientes.push(opciones); return { publico: true };
      } },
    });
    assert.deepEqual(supabase.clientePublico(), { publico: true });
    await assert.rejects(supabase.idInstalacionExistente(), /desactivados/);
    assert.throws(() => supabase.idInstalacion(), /desactivados/);
    await assert.rejects(supabase.clienteDispositivo(), /desactivados/);
    await assert.rejects(supabase.clienteDispositivo({ crear: false }), /desactivados/);
    await assert.rejects(supabase.borrarIdInstalacionLocal(), /desactivados/);
    assert.equal(clientes.length, 1);
    assert.equal(clientes[0].global.headers, undefined);
    assert.equal(clientes[0].auth.persistSession, false);
    assert.equal(clientes[0].auth.autoRefreshToken, false);
    assert.equal(clientes[0].auth.detectSessionInUrl, false);
  }
});
