const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');

const RAIZ = path.resolve(__dirname, '..');

function cargar(ruta, mocks = {}, { jsx: transformaJsx = false } = {}) {
  const absoluto = path.join(RAIZ, ruta);
  const cargarOriginal = Module._load;
  const jsOriginal = Module._extensions['.js'];

  Module._load = function (pedido, padre, esPrincipal) {
    if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return cargarOriginal.call(this, pedido, padre, esPrincipal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (archivo !== absoluto) return jsOriginal(modulo, archivo);
    const codigo = fs.readFileSync(archivo, 'utf8');
    const plugins = transformaJsx ? [jsx, commonjs] : [commonjs];
    const transformado = babel.transformSync(codigo, {
      filename: archivo,
      babelrc: false,
      configFile: false,
      plugins,
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

test('las dianas del radar miden al menos 44 y la leyenda expone el filtro', () => {
  const codigo = fs.readFileSync(path.join(RAIZ, 'componentes', 'Radar.js'), 'utf8');
  const tamano = Number(codigo.match(/const TAMANO_DIANA = (\d+)/)?.[1]);

  assert.ok(tamano >= 44, `la diana mide ${tamano || 0}, se esperaban al menos 44`);
  assert.match(codigo, /left: x \* k - TAMANO_DIANA \/ 2/);
  assert.match(codigo, /top: y \* k - TAMANO_DIANA \/ 2/);
  assert.match(codigo, /width: TAMANO_DIANA, height: TAMANO_DIANA/);
  assert.match(codigo, /accessibilityState=\{\{ selected: categoriaActiva === c \}\}/);
  assert.match(codigo, /Filtro activo\. Quitar filtro\./);
});

test('el explicador solo permite el origen HTTPS exacto de RWAdar', () => {
  const { esOrigenRWAdar } = cargar('componentes/Explicador.js', {
    'react-native': {
      ActivityIndicator() {}, Pressable() {}, Text() {}, View() {},
      StyleSheet: { create: (valor) => valor, absoluteFillObject: {} },
    },
    'react-native-webview': { WebView() {} },
    './ExplicadorNativo': function ExplicadorNativo() {},
    '../lib/tema': {
      C: { noche: '#000', senal: '#0f0', tx: '#fff', tx2: '#aaa', sup2: '#222' },
      T: { etiqueta: {}, titular: {}, cuerpo: {} },
      F: { media: 'system' },
      R: {},
    },
  }, { jsx: true });

  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev/'), true);
  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev/#explain'), true);
  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev/otra?x=1'), true);
  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev.ejemplo.test/#explain'), false);
  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev@ejemplo.test/'), false);
  assert.equal(esOrigenRWAdar('https://usuario:clave@rwadar.pages.dev/'), false);
  assert.equal(esOrigenRWAdar('http://rwadar.pages.dev/'), false);
  assert.equal(esOrigenRWAdar('https://rwadar.pages.dev:444/'), false);
  assert.equal(esOrigenRWAdar('no-es-una-url'), false);
});

test('el tacto absorbe rechazos asíncronos y excepciones síncronas', async () => {
  let selecciones = 0;
  const { tacto } = cargar('lib/tacto.js', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-haptics': {
      ImpactFeedbackStyle: { Light: 'light', Rigid: 'rigid', Soft: 'soft' },
      NotificationFeedbackType: { Success: 'success' },
      selectionAsync() {
        selecciones += 1;
        return Promise.reject(new Error('motor no disponible'));
      },
      impactAsync() { throw new Error('fallo síncrono'); },
      notificationAsync() { return Promise.resolve(); },
    },
  });

  await assert.doesNotReject(() => tacto.eleccion());
  await assert.doesNotReject(() => tacto.abrir());
  await assert.doesNotReject(() => tacto.novedad());
  assert.equal(selecciones, 1);
});
