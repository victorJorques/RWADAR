const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fuente = fs.readFileSync(path.join(__dirname, '../componentes/Explicador.js'), 'utf8');
const script = fuente.match(/const SOLO_EL_EXPLICADOR = `([\s\S]*?)`;/)[1];

test('el HTML de intercambio de cookie no dispara el fallback antes de abrir el tutorial', () => {
  const mensajes = [];
  vm.runInNewContext(script, { location: { pathname: '/api/acceso/tutorial' },
    document: { documentElement: { hasAttribute() { throw new Error('No debe tocar DOM del bootstrap'); } } },
    window: { ReactNativeWebView: { postMessage: msg => mensajes.push(msg) } } });
  assert.deepEqual(mensajes, []);
});

test('una página final sin explicador activa la alternativa nativa legible', () => {
  const mensajes = [];
  vm.runInNewContext(script, { location: { pathname: '/' },
    document: { documentElement: { hasAttribute: () => false }, getElementById: () => null },
    window: { ReactNativeWebView: { postMessage: msg => mensajes.push(msg) } } });
  assert.deepEqual(mensajes, ['rwadar:explicador-no-disponible']);
});
