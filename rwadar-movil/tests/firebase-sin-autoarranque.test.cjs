/* Firebase no arranca solo en la 1.4.2 (APK-1.4.2-NOTIFICACIONES.md, punto 2 bis).
   FCM no genera el registro al abrir la app ni Analytics recoge nada: el
   token solo se pide al pulsar «Notificaciones en este móvil». Se comprueba
   con el config plugin aplicado por @expo/config-plugins en modo
   introspección: sin compilar ni escribir android/. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const PLUGIN = './plugins/firebase-sin-autoarranque';
const CLAVES = ['firebase_messaging_auto_init_enabled', 'firebase_analytics_collection_enabled'];

// La configuración local, como en `expo start` o `eas update`: sin el archivo
// de Firebase (solo existe en la máquina de EAS) y fuera de EAS Build.
async function conEntornoLocal(fn) {
  const guardado = { GOOGLE_SERVICES_JSON: process.env.GOOGLE_SERVICES_JSON, EAS_BUILD: process.env.EAS_BUILD };
  delete process.env.GOOGLE_SERVICES_JSON;
  delete process.env.EAS_BUILD;
  try { return await fn(); } finally {
    for (const [clave, valor] of Object.entries(guardado)) {
      if (valor === undefined) delete process.env[clave]; else process.env[clave] = valor;
    }
  }
}

async function manifiestoIntrospectado(transformar = (config) => config) {
  const { getPrebuildConfigAsync } = require('@expo/prebuild-config');
  const { compileModsAsync } = require('@expo/config-plugins');
  return conEntornoLocal(async () => {
    const { exp } = await getPrebuildConfigAsync(RAIZ, { platforms: ['android'] });
    const config = await compileModsAsync(transformar(exp), { projectRoot: RAIZ, platforms: ['android'], introspect: true });
    return config._internal.modResults.android.manifest;
  });
}

function metaFirebase(manifiesto) {
  const aplicacion = manifiesto.manifest.application[0];
  return (aplicacion['meta-data'] || [])
    .map((m) => m.$)
    .filter((m) => CLAVES.includes(m['android:name']));
}

test('app.json carga el plugin local, hecho con expo/config-plugins', () => {
  const { expo } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'app.json'), 'utf8'));
  assert.ok(expo.plugins.includes(PLUGIN), 'el plugin va en la lista de plugins');
  assert.equal(expo.plugins.at(-1), PLUGIN, 'entra al final, después de expo-notifications');
  assert.ok(fs.existsSync(path.join(RAIZ, `${PLUGIN}.js`)));
  const codigo = fs.readFileSync(path.join(RAIZ, `${PLUGIN}.js`), 'utf8');
  assert.match(codigo, /require\('expo\/config-plugins'\)/, 'usa expo/config-plugins, sin dependencias nuevas');
  assert.match(codigo, /addMetaDataItemToMainApplication/);
});

test('introspección: <application> lleva las dos claves de Firebase en false', async () => {
  const manifiesto = await manifiestoIntrospectado();
  assert.deepEqual(metaFirebase(manifiesto), [
    { 'android:name': 'firebase_messaging_auto_init_enabled', 'android:value': 'false' },
    { 'android:name': 'firebase_analytics_collection_enabled', 'android:value': 'false' },
  ]);
  // Los cuatro permisos de la entrega ya no se retiran del manifiesto.
  const retirados = (manifiesto.manifest['uses-permission'] || [])
    .filter((p) => p.$['tools:node'] === 'remove').map((p) => p.$['android:name']);
  for (const permiso of ['android.permission.POST_NOTIFICATIONS', 'com.google.android.c2dm.permission.RECEIVE',
    'android.permission.WAKE_LOCK', 'android.permission.RECEIVE_BOOT_COMPLETED']) {
    assert.ok(!retirados.includes(permiso), `${permiso} ya no se bloquea`);
  }
  assert.ok(retirados.includes('android.permission.SYSTEM_ALERT_WINDOW'), 'el resto sigue bloqueado');
  assert.equal(fs.existsSync(path.join(RAIZ, 'android')), false, 'la introspección no escribe android/');
});

test('las claves salen del plugin: sin él no hay ninguna, y aplicarlo dos veces no las duplica', async () => {
  const { compileModsAsync } = require('@expo/config-plugins');
  const withFirebaseSinAutoarranque = require(path.join(RAIZ, PLUGIN));
  // Configuración mínima: solo el plugin local sobre la plantilla del manifiesto
  // de Expo (introspección, sin android/).
  const minima = () => ({ name: 'prueba', slug: 'prueba', android: { package: 'com.rwadar.app' } });
  async function compilar(config) {
    const final = await compileModsAsync(config, { projectRoot: RAIZ, platforms: ['android'], introspect: true });
    return final._internal.modResults.android.manifest;
  }
  assert.deepEqual(metaFirebase(await compilar(minima())), [], 'la plantilla no las trae');
  const unaVez = metaFirebase(await compilar(withFirebaseSinAutoarranque(minima())));
  const dosVeces = metaFirebase(await compilar(withFirebaseSinAutoarranque(withFirebaseSinAutoarranque(minima()))));
  const esperado = CLAVES.map((nombre) => ({ 'android:name': nombre, 'android:value': 'false' }));
  assert.deepEqual(unaVez, esperado);
  assert.deepEqual(dosVeces, esperado, 'cada clave aparece una sola vez');
});

test('si el manifiesto ya trae las claves en true cuando corre, las deja en false sin duplicarlas', async () => {
  const { withAndroidManifest, compileModsAsync } = require('@expo/config-plugins');
  const withFirebaseSinAutoarranque = require(path.join(RAIZ, PLUGIN));
  // Expo ejecuta los mods en orden inverso: el que se compone después corre
  // antes. Aquí `encender` corre primero y deja las dos claves en true.
  const encender = (config) => withAndroidManifest(config, (c) => {
    const aplicacion = c.modResults.manifest.application[0];
    aplicacion['meta-data'] = [...(aplicacion['meta-data'] || []),
      ...CLAVES.map((nombre) => ({ $: { 'android:name': nombre, 'android:value': 'true' } }))];
    return c;
  });
  const config = encender(withFirebaseSinAutoarranque({ name: 'prueba', slug: 'prueba', android: { package: 'com.rwadar.app' } }));
  const final = await compileModsAsync(config, { projectRoot: RAIZ, platforms: ['android'], introspect: true });
  assert.deepEqual(metaFirebase(final._internal.modResults.android.manifest),
    CLAVES.map((nombre) => ({ 'android:name': nombre, 'android:value': 'false' })));
});
