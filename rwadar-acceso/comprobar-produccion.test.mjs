import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { exigirCatalogoPublico } = createRequire(import.meta.url)('./comprobar-produccion.cjs');

test('preview y producción exigen lectura anónima comprobable de los cuatro recursos', async () => {
  const solicitudes = [];
  await exigirCatalogoPublico({ fetchImpl: async (url, opciones) => {
    solicitudes.push(url); assert.equal(opciones.headers.Authorization, undefined);
    assert.equal(opciones.credentials, 'omit'); assert.equal(opciones.method, 'GET');
    assert.equal(opciones.redirect, 'error');
    return Response.json(url.includes('/catalogo_publicacion?') ? [{retirado:false}] : [{slug:'ejemplo'}]);
  } });
  assert.equal(solicitudes.length, 4);
});
test('la compuerta pública rechaza denegación, vacío ambiguo, retirada, JSON inválido y fallo de red', async () => {
  for (const status of [204, 401, 403, 404, 500]) {
    await assert.rejects(exigirCatalogoPublico({ fetchImpl: async () => new Response(null, { status }) }), /lectura anónima/);
  }
  for (const valor of [[], {}, [null], [{slug:''}], [{slug:4}]]) {
    await assert.rejects(exigirCatalogoPublico({ fetchImpl: async () => Response.json(valor) }), /lectura anónima/);
  }
  await assert.rejects(exigirCatalogoPublico({ fetchImpl: async url => Response.json(url.includes('/catalogo_publicacion?')
    ? [{retirado:true}] : [{slug:'ejemplo'}]) }), /lectura anónima/);
  await assert.rejects(exigirCatalogoPublico({ fetchImpl: async () => new Response('no JSON', {status:200}) }));
  await assert.rejects(exigirCatalogoPublico({ fetchImpl: async () => { throw new Error('sin conexión'); } }), /sin conexión/);
});
