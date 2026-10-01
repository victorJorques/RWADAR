const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ignore = require('ignore');

const raiz = path.resolve(__dirname, '../..');
const filtro = ignore().add(fs.readFileSync(path.join(raiz, '.easignore'), 'utf8'));

test('EAS incluye el proyecto móvil sin depender de separadores de directorio de Windows', () => {
  for (const ruta of ['rwadar-movil', 'rwadar-movil/App.js', 'rwadar-movil/app.json',
    'rwadar-movil/package.json', 'rwadar-movil/package-lock.json', 'rwadar-movil/eas.json',
    'rwadar-movil/index.js', 'rwadar-movil/lib', 'rwadar-movil/lib/modo-local.js',
    'rwadar-movil/scripts/parchear-expo-uuidv5.cjs',
    'rwadar-movil/componentes', 'rwadar-movil/componentes/Ofertas.js',
    'rwadar-movil/assets', 'rwadar-movil/assets/icon.png',
    'rwadar-movil/assets/ofertas-editoriales/inmobiliario-rwadar.webp',
    'rwadar-movil/fixtures', 'rwadar-movil/fixtures/imagenes-editoriales.js',
    'rwadar-movil/fixtures/escaparate-local.json']) {
    assert.equal(filtro.ignores(ruta), false, ruta);
    assert.ok(fs.existsSync(path.join(raiz, ruta)), `archivo necesario: ${ruta}`);
  }
});

test('EAS excluye otros proyectos, históricos, fotos sin licencia y credenciales', () => {
  for (const ruta of ['extracto-personal.pdf', 'CALIX/app.js', 'docs/INTERNO.md',
    'rwadar-site/index.html', 'rwadar-version-codex/index.html',
    'rwadar-app/db/24_catalogo_publico_verificado.sql', '.git/config',
    'rwadar-movil/fixtures/ofertas-originales/01-caribe-1.jpg',
    'rwadar-movil/fixtures/ofertas-originales/artifact.json',
    'rwadar-movil/fixtures/fuentes-imagenes.json',
    'rwadar-movil/fixtures/imagenes-ofertas.js',
    'rwadar-movil/assets/ofertas/caribe-1.webp', 'rwadar-movil/LEEME.md',
    'rwadar-movil/tests/flujo.test.cjs', 'rwadar-movil/node_modules/expo/package.json',
    'rwadar-movil/lib/.env', 'rwadar-movil/assets/firma.keystore',
    'rwadar-movil/lib/credentials.json', 'rwadar-movil/lib/service-role-test.json']) {
    assert.equal(filtro.ignores(ruta), true, ruta);
  }
});
