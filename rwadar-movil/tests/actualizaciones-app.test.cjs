const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { crearControladorActualizaciones, INTERVALO_REVISION_MS } = require('../lib/actualizaciones-app');

function entorno(opciones = {}) {
  let tiempo = 0;
  const llamadas = [];
  const updates = { isEnabled: true,
    async checkForUpdateAsync() { llamadas.push('comprobar'); return { isAvailable: true }; },
    async fetchUpdateAsync() { llamadas.push('descargar'); return { isNew: true }; },
    reloadAsync() { throw new Error('No se permite interrumpir la pantalla abierta'); },
    ...opciones.updates };
  const controlador = crearControladorActualizaciones({ updates, ahora: () => tiempo, ...opciones, updates });
  return { llamadas, updates, controlador,
    avanzar(ms = INTERVALO_REVISION_MS) { tiempo += ms; },
    async volver() { await controlador.cambiarEstadoApp('background'); return controlador.cambiarEstadoApp('active'); } };
}

test('descarga en una sesión larga sin reiniciar ni cambiar canal/runtime', async () => {
  const e = entorno();
  await e.volver();
  assert.deepEqual(e.llamadas, []);
  e.avanzar();
  assert.deepEqual(await e.volver(), { estado: 'proximo-arranque' });
  assert.deepEqual(e.llamadas, ['comprobar', 'descargar']);
  e.avanzar(); await e.volver();
  assert.equal(e.llamadas.length, 2, 'la copia pendiente ya espera al arranque en frío');
});

test('no hay consulta en desarrollo, web ni cuando updates está desactivado', async () => {
  for (const opciones of [{ desarrollo: true }, { plataforma: 'web' }, { updates: { isEnabled: false } }]) {
    const e = entorno(opciones); e.avanzar(); await e.volver();
    assert.deepEqual(e.llamadas, []);
  }
});

test('red caída y fallo de descarga conservan la copia y no propagan errores', async () => {
  for (const metodo of ['checkForUpdateAsync', 'fetchUpdateAsync']) {
    let fallar = true;
    const e = entorno({ updates: {
      async [metodo]() { if (fallar) throw new Error('sin red'); return { isAvailable: true, isNew: true }; },
    } });
    e.avanzar();
    assert.deepEqual(await e.volver(), { estado: 'aplazada' });
    assert.deepEqual(await e.volver(), { estado: 'sin-cambios' }, 'no entra en un bucle de reintentos');
    fallar = false; e.avanzar();
    assert.deepEqual(await e.volver(), { estado: 'proximo-arranque' });
  }
});

test('sin actualización no descarga; rollback a la copia embebida espera al arranque', async () => {
  const vacio = entorno({ updates: { async checkForUpdateAsync() { return { isAvailable: false }; } } });
  vacio.avanzar(); assert.deepEqual(await vacio.volver(), { estado: 'sin-cambios' });
  assert.deepEqual(vacio.llamadas, []);
  const rollback = entorno({ updates: {
    async checkForUpdateAsync() { return { isAvailable: false, isRollBackToEmbedded: true }; },
    async fetchUpdateAsync() { return { isNew: false, isRollBackToEmbedded: true }; },
  } });
  rollback.avanzar(); assert.deepEqual(await rollback.volver(), { estado: 'proximo-arranque' });
});

test('no duplica una consulta en curso y desmontar impide iniciar la descarga tardía', async () => {
  let resolver;
  const e = entorno({ updates: { checkForUpdateAsync() { return new Promise(resolve => { resolver = resolve; }); } } });
  e.avanzar(); const pendiente = e.volver();
  await Promise.resolve();
  assert.deepEqual(await e.volver(), { estado: 'sin-cambios' });
  e.controlador.detener();
  resolver({ isAvailable: true });
  assert.deepEqual(await pendiente, { estado: 'sin-cambios' });
  assert.deepEqual(e.llamadas, []);
});

test('configuración: runtime nativo aislado, arranque offline y canal público de APK', async () => {
  const raiz = path.resolve(__dirname, '..');
  const { expo } = JSON.parse(fs.readFileSync(path.join(raiz, 'app.json'), 'utf8'));
  const eas = JSON.parse(fs.readFileSync(path.join(raiz, 'eas.json'), 'utf8'));
  assert.deepEqual(expo.runtimeVersion, { policy: 'nativeVersion' });
  assert.equal(expo.android.versionCode, 24);
  assert.equal(eas.cli.appVersionSource, 'local', 'nativeVersion necesita la misma versión local al compilar y publicar');
  const { getRuntimeVersionAsync } = require('@expo/config-plugins/build/utils/Updates');
  assert.equal(await getRuntimeVersionAsync(raiz, expo, 'android'), '1.4.2(24)', 'resuelto por el SDK57 instalado');
  assert.equal(expo.updates.enabled, true);
  assert.equal(expo.updates.url, `https://u.expo.dev/${expo.extra.eas.projectId}`);
  assert.equal(expo.updates.checkAutomatically, 'ON_LOAD');
  assert.equal(expo.updates.fallbackToCacheTimeout, 0);
  assert.equal(expo.updates.useEmbeddedUpdate, true);
  assert.equal(expo.updates.disableAntiBrickingMeasures, false);
  assert.equal(expo.updates.requestHeaders, undefined);
  for (const perfil of ['editorial', 'production']) {
    assert.equal(eas.build[perfil].channel, 'production');
    assert.equal(eas.build[perfil].environment, 'production');
    assert.equal(eas.build[perfil].autoIncrement, false, 'otra build exige elegir un código nativo nuevo explícitamente');
  }
  assert.equal(eas.build.preview.channel, 'preview');
  assert.equal(eas.build.editorial.android.buildType, 'apk');
  assert.equal(expo.updates.codeSigningCertificate, undefined, 'no se activa un servicio de pago');
  assert.ok(!(expo.android.permissions || []).includes('android.permission.REQUEST_INSTALL_PACKAGES'));
});
