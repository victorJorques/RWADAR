const test = require('node:test');
const assert = require('node:assert/strict');
const { cuentaAdmitida, clavesPrivadasDispositivo } = require('../lib/acceso-obligatorio');
const UID = '11111111-1111-4111-8111-111111111111';
const correcta = { disponible: true, estado: 'autenticada', usuario: { id: UID, correo: 'a@b.test' }, perfil: { id: UID } };
test('la puerta no acepta anonimato, confirmación pendiente ni identidad mezclada', () => {
  assert.equal(cuentaAdmitida(correcta), true);
  for (const state of [null, {}, { ...correcta, estado: 'confirmacion' }, { ...correcta, disponible: false },
    { ...correcta, usuario: null }, { ...correcta, perfil: { id: 'otra' } }, { ...correcta, usuario: { id: 'no-uuid', correo: 'a@b.test' } }]) assert.equal(cuentaAdmitida(state), false);
});
test('borrado incluye todas las carteras por UUID y solo sus claves exactas', () => {
  const own = 'rwadar:cartera:v1:' + UID, cache = 'rwadar.cache.catalogo.v2:' + UID;
  const other = ['otra-app:cartera:' + UID, own + ':extra', 'rwadar:cartera:v1:no-uuid', 'sesion', 'correo'];
  assert.deepEqual(clavesPrivadasDispositivo([own, cache, ...other]), [own, cache]);
});
