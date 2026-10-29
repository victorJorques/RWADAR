import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCarteraServidor } from './cartera-servidor.mjs';
const uid = '11111111-1111-4111-8111-111111111111';
const respuesta = (body, status = 200, headers = {}) => Response.json(body, { status, headers });
const request = () => new Request('https://rwadar.pages.dev/api/acceso/cartera', { headers: { 'X-RWAdar-Usuario': uid } });

test('un fallo temporal del BFF se mantiene 503 al leer la cartera', async () => {
  const atender = crearCarteraServidor({ respuesta, leerCookie: () => 'token', verificar: async () => ({ id: uid }),
    api: async () => { throw new Error('servicio_no_disponible'); } });
  const r = await atender({ request: request(), env: {} });
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: 'cartera_no_disponible' });
});
test('un fallo temporal al verificar también se mantiene 503 sin consultar documentos', async () => {
  let llamadas = 0;
  const atender = crearCarteraServidor({ respuesta, leerCookie: () => 'token',
    verificar: async () => { throw new Error('servicio_no_disponible'); }, api: async () => { llamadas++; } });
  assert.equal((await atender({ request: request(), env: {} })).status, 503);
  assert.equal(llamadas, 0);
});
test('un 429 conserva el tiempo de espera ya validado por el BFF', async () => {
  const atender = crearCarteraServidor({ respuesta, leerCookie: () => 'token', verificar: async () => ({ id: uid }),
    api: async () => { const e = new Error('auth_rechazado'); e.status = 429; e.reintentarTras = '17'; throw e; } });
  const r = await atender({ request: request(), env: {} });
  assert.equal(r.status, 429); assert.equal(r.headers.get('retry-after'), '17');
  assert.deepEqual(await r.json(), { error: 'cartera_limite' });
});
test('la sesión rechazada sigue impidiendo leer la cartera con 401', async () => {
  let llamadas = 0;
  const atender = crearCarteraServidor({ respuesta, leerCookie: () => 'token',
    verificar: async () => { throw new Error('sin_sesion'); }, api: async () => { llamadas++; } });
  assert.equal((await atender({ request: request(), env: {} })).status, 401);
  assert.equal(llamadas, 0);
});
