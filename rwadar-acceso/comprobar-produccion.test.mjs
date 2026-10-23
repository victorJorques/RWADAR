import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { exigirCatalogoPrivado } = createRequire(import.meta.url)('./comprobar-produccion.cjs');

test('producción exige denegación real del acceso anónimo en ambas vistas', async () => {
  const solicitudes = [];
  await exigirCatalogoPrivado({ fetchImpl: async (url, opciones) => {
    solicitudes.push(url); assert.equal(opciones.headers.Authorization, undefined);
    assert.equal(opciones.redirect, 'error'); return new Response(null, { status: 403 });
  } });
  assert.equal(solicitudes.length, 2);
});
test('producción rechaza datos públicos, vacío ambiguo, ruta ausente y fallo de red', async () => {
  for (const status of [200, 204, 404, 500]) {
    await assert.rejects(exigirCatalogoPrivado({ fetchImpl: async () => new Response(null, { status }) }), /lectura anónima/);
  }
  await assert.rejects(exigirCatalogoPrivado({ fetchImpl: async () => { throw new Error('sin conexión'); } }), /sin conexión/);
});
