/* app.config.js (APK-1.4.2-NOTIFICACIONES.md, punto 2): lo único que añade a
   app.json es android.googleServicesFile, desde la variable de EAS de tipo
   archivo GOOGLE_SERVICES_JSON. google-services.json nunca va en Git. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const appConfig = require(path.join(RAIZ, 'app.config.js'));
const { expo } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8'));

function conEntorno(variables, fn) {
  const claves = ['GOOGLE_SERVICES_JSON', 'EAS_BUILD'];
  const guardado = Object.fromEntries(claves.map((c) => [c, process.env[c]]));
  for (const clave of claves) {
    if (variables[clave] === undefined) delete process.env[clave]; else process.env[clave] = variables[clave];
  }
  try { return fn(); } finally {
    for (const [clave, valor] of Object.entries(guardado)) {
      if (valor === undefined) delete process.env[clave]; else process.env[clave] = valor;
    }
  }
}

const copia = () => JSON.parse(JSON.stringify(expo));

test('sin la variable devuelve app.json tal cual (expo start y eas update en local)', () => {
  const entrada = copia();
  const salida = conEntorno({}, () => appConfig({ config: entrada }));
  assert.equal(salida, entrada, 'el mismo objeto, sin copiar ni tocar');
  assert.deepEqual(salida, expo);
  assert.equal(salida.android.googleServicesFile, undefined);
});

test('con GOOGLE_SERVICES_JSON solo añade android.googleServicesFile', () => {
  const entrada = copia();
  const salida = conEntorno({ GOOGLE_SERVICES_JSON: '/tmp/x.json' }, () => appConfig({ config: entrada }));
  assert.equal(salida.android.googleServicesFile, '/tmp/x.json');
  const { googleServicesFile, ...restoAndroid } = salida.android;
  assert.deepEqual({ ...salida, android: restoAndroid }, expo, 'nada más cambia');
  assert.deepEqual(entrada, expo, 'no modifica la configuración recibida');
  // Con la variable, también en la máquina de EAS.
  const enEas = conEntorno({ GOOGLE_SERVICES_JSON: '/tmp/x.json', EAS_BUILD: 'true' }, () => appConfig({ config: copia() }));
  assert.equal(enEas.android.googleServicesFile, '/tmp/x.json');
});

test('en EAS Build sin la variable falla: un APK sin FCM no entregaría notificaciones', () => {
  assert.throws(() => conEntorno({ EAS_BUILD: 'true' }, () => appConfig({ config: copia() })),
    /Falta GOOGLE_SERVICES_JSON \(variable de EAS de tipo archivo, entorno production\)\./);
  // Fuera de EAS Build (EAS_BUILD distinto de 'true'), no falla.
  assert.doesNotThrow(() => conEntorno({ EAS_BUILD: 'false' }, () => appConfig({ config: copia() })));
});

test('google-services.json no está en el repositorio ni se le puede referenciar desde app.json', () => {
  assert.equal(fs.existsSync(path.join(RAIZ, 'google-services.json')), false);
  assert.equal(expo.android.googleServicesFile, undefined, 'solo llega por la variable de EAS');
  assert.match(fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8'), /^google-services\.json$/m);
  assert.match(fs.readFileSync(path.join(RAIZ, '..', '.easignore'), 'utf8'), /^google-services\.json$/m);
});

test('el runtime resuelto con app.config.js es 1.4.2(24), con y sin la variable', async () => {
  const { getConfig } = require('@expo/config');
  const { getRuntimeVersionAsync } = require('@expo/config-plugins/build/utils/Updates');
  for (const variables of [{}, { GOOGLE_SERVICES_JSON: '/tmp/x.json' }]) {
    const { exp, dynamicConfigPath } = conEntorno(variables, () => getConfig(RAIZ, { skipSDKVersionRequirement: true }));
    assert.equal(dynamicConfigPath, path.join(RAIZ, 'app.config.js'));
    assert.equal(exp.android.googleServicesFile, variables.GOOGLE_SERVICES_JSON);
    assert.equal(await getRuntimeVersionAsync(RAIZ, exp, 'android'), '1.4.2(24)');
    assert.ok(!exp.android.blockedPermissions.includes('android.permission.POST_NOTIFICATIONS'));
  }
});

test('la notificación lleva su propio icono: blanco sobre transparente, 96×96', () => {
  const plugin = expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-notifications');
  assert.ok(plugin, 'expo-notifications está en plugins');
  assert.equal(plugin[1].icon, './assets/notification-icon.png');
  const png = fs.readFileSync(path.join(RAIZ, 'assets', 'notification-icon.png'));
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
  // Cabecera IHDR: ancho y alto en los bytes 16-23; tipo de color 6 = RGBA.
  assert.equal(png.readUInt32BE(16), 96);
  assert.equal(png.readUInt32BE(20), 96);
  assert.equal(png[25], 6, 'RGBA, con canal alfa');
});
