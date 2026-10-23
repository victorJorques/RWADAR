const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
function entorno(inicial = {}) {
  const mapa = new Map(Object.entries(inicial));
  const storage = { async getItem(k) { return mapa.get(k) || null; }, async setItem(k,v) { mapa.set(k,v); },
    async getAllKeys() { return [...mapa.keys()]; }, async multiRemove(keys) { keys.forEach(k => mapa.delete(k)); },
    async removeItem(k) { mapa.delete(k); } };
  const lib = path.resolve(__dirname, '../lib') + path.sep;
  const load = Module._load, extension = Module._extensions['.js'];
  Module._load = function(name, parent, main) {
    if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (parent?.filename === path.join(lib, 'datos.js') && name === './modo-local') return { MODO_LOCAL: false, SERVICIOS_USUARIO_REMOTOS: false };
    if (parent?.filename === path.join(lib, 'datos.js') && name === './supabase') return {};
    return load.call(this, name, parent, main);
  };
  Module._extensions['.js'] = function(mod, file) {
    if (!file.startsWith(lib)) return extension(mod, file);
    mod._compile(babel.transformSync(fs.readFileSync(file, 'utf8'), { filename:file, babelrc:false, configFile:false, plugins:[commonjs] }).code, file);
  };
  const file = path.join(lib, 'datos.js'); delete require.cache[file]; let datos;
  try { datos = require(file); } finally { Module._load=load; Module._extensions['.js']=extension; }
  return { datos, mapa, storage, entrar(id) { datos.configurarAccesoCatalogo(id, async () => ({})); } };
}
test('sin cuenta no se leen favoritos globales anteriores ni se escriben datos personales', async () => {
  const e = entorno({ 'rwadar.editorial.ofertas.guardadas.v1': '["antigua"]' });
  assert.deepEqual(await e.datos.ofertasGuardadas(), []);
  await assert.rejects(e.datos.alternarOfertaGuardada('oferta'));
  await assert.rejects(e.datos.guardarProgresoAcademy({}));
});
test('favoritos, seguimiento y progreso quedan separados por UUID y no se migran los anónimos', async () => {
  const e = entorno({ 'rwadar.editorial.ofertas.guardadas.v1': '["antigua"]' }); e.entrar(A);
  assert.deepEqual(await e.datos.ofertasGuardadas(), []);
  await e.datos.alternarOfertaGuardada('solo-a');
  await e.datos.alternarSeguimiento('plataforma-a', 'plataforma-1');
  await e.datos.guardarProgresoAcademy({});
  e.datos.configurarAccesoCatalogo(null); e.entrar(B);
  assert.deepEqual(await e.datos.ofertasGuardadas(), []); assert.deepEqual(await e.datos.siguiendo(), []);
  await e.datos.alternarOfertaGuardada('solo-b');
  e.entrar(A);
  assert.deepEqual(await e.datos.ofertasGuardadas(), ['solo-a']); assert.deepEqual(await e.datos.siguiendo(), ['plataforma-a']);
  assert.ok(e.mapa.has('rwadar.editorial.academy.progreso.v1:' + A));
});
test('borrar dispositivo elimina carteras y cachés de todas las cuentas sin afectar otras apps', async () => {
  const own = 'rwadar:cartera:v1:' + A, other = 'rwadar:cartera:v1:' + B;
  const cache = 'rwadar.cache.catalogo.v2:' + A, fav = 'rwadar.editorial.ofertas.guardadas.v1:' + B;
  const e = entorno({ [own]:'A', [other]:'B', [cache]:'cache', [fav]:'[]', 'otra.app':'conservar', [own+':extra']:'ajena' });
  await e.datos.borrarDatosDispositivo();
  for (const key of [own,other,cache,fav]) assert.equal(e.mapa.has(key), false);
  assert.equal(e.mapa.get('otra.app'), 'conservar'); assert.equal(e.mapa.get(own+':extra'), 'ajena');
});
