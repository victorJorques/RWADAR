import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAccesoServidor } from './servidor.mjs';

const ORIGIN = 'https://rwadar.pages.dev';
const TOKEN = 'eyJ0ZXN0.e30.ZmlybWE';
const UID = '11111111-1111-4111-8111-111111111111';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const LOGIN = { correo: 'cuenta@example.test', clave: 'solo-prueba-local' };

function entorno(fetchImpl, plazoMs) {
  let calls = 0;
  const server = crearAccesoServidor({ fetchImpl: async (...args) => { calls++; return fetchImpl(...args); }, plazoMs });
  const run = ({ path = '/api/acceso/entrar', type = 'application/json', body = JSON.stringify(LOGIN), origin = ORIGIN } = {}) =>
    server.atender({ env: ENV, request: new Request(ORIGIN + path, { method: 'POST',
      headers: { origin, 'content-type': type, cookie: '__Host-rwadar-acceso=' + TOKEN }, body }),
      next() { throw new Error('No debe servir ASSETS'); } });
  return { run, calls: () => calls };
}

async function errorPublico(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('set-cookie'), null, 'Un fallo no borra una cookie más reciente');
  assert.equal(response.headers.get('location'), null);
  assert.deepEqual(await response.json(), { error: code });
}

test('JSON mal formado devuelve 400 antes de consultar al proveedor', async () => {
  for (const body of ['{', 'undefined', 'null', '[]']) {
    const e = entorno(() => { throw new Error('No debe consultar al proveedor'); });
    await errorPublico(await e.run({ body }), 400, 'solicitud_invalida');
    assert.equal(e.calls(), 0);
  }
});

test('el prefijo application/json no admite JSONP ni otros tipos ambiguos', async () => {
  for (const type of ['application/jsonp', 'application/json-otra', 'text/plain', 'application/json, text/plain']) {
    const e = entorno(() => { throw new Error('No debe consultar al proveedor'); });
    await errorPublico(await e.run({ type }), 400, 'solicitud_invalida');
    assert.equal(e.calls(), 0);
  }
});

test('JSON con parámetros y mayúsculas conserva el contrato de acceso', async () => {
  for (const type of ['application/json; charset=utf-8', 'Application/JSON; charset=UTF-8']) {
    const e = entorno(async url => Response.json(url.includes('/token?') ? { access_token: TOKEN }
      : url.includes('/auth/v1/user') ? { id: UID, email: LOGIN.correo, email_confirmed_at: '2026-10-28T00:00:00Z' }
      : [{ id: UID }]));
    const response = await e.run({ type });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /^__Host-rwadar-acceso=.*; Path=\/; HttpOnly; Secure; SameSite=Lax$/);
    assert.equal((await response.json()).usuario.id, UID);
    assert.equal(e.calls(), 3);
  }
});

test('429 del proveedor conserva la espera incluso con cuerpo HTML y no revela su mensaje', async () => {
  const e = entorno(async () => new Response('<html>dato-privado@example.test</html>',
    { status: 429, headers: { 'Retry-After': '17', 'X-Detalle-Privado': TOKEN } }));
  const response = await e.run();
  assert.equal(response.headers.get('retry-after'), '17');
  assert.equal(response.headers.get('x-detalle-privado'), null);
  await errorPublico(response, 429, 'intentos_excedidos');
  assert.equal(e.calls(), 1);
});

test('Retry-After no numérico o fuera de rango usa una espera segura de 60 segundos', async () => {
  for (const retry of ['', '-1', '0', '86401', '9999999', 'Wed, 28 Oct 2026 11:00:00 GMT', TOKEN]) {
    const e = entorno(async () => new Response('', { status: 429, headers: { 'Retry-After': retry } }));
    const response = await e.run();
    assert.equal(response.headers.get('retry-after'), '60');
    await errorPublico(response, 429, 'intentos_excedidos');
  }
});

test('red, aborto, respuesta inválida y 5xx son temporales sin conceder ni borrar la sesión', async () => {
  const cases = [
    async () => { throw new TypeError('fallo de red con dato-privado'); },
    async () => { throw new DOMException('aborto con dato-privado', 'AbortError'); },
    async () => new Response('dato-privado', { status: 500 }),
    async () => new Response('{"dato":"privado"}', { status: 503 }),
    async () => new Response('no es JSON: dato-privado', { status: 200 }),
    async () => new Response('x'.repeat(128 * 1024 + 1)),
  ];
  for (const fetchImpl of cases) {
    const e = entorno(fetchImpl);
    const response = await e.run();
    assert.equal(response.headers.get('retry-after'), '30');
    await errorPublico(response, 503, 'servicio_no_disponible');
    assert.equal(e.calls(), 1);
  }
});

test('el plazo real de la llamada aborta y devuelve 503', async () => {
  const e = entorno(async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }), 5);
  await errorPublico(await e.run(), 503, 'servicio_no_disponible');
  assert.equal(e.calls(), 1);
});

test('una credencial rechazada sigue devolviendo 401 aunque el proveedor no envíe JSON', async () => {
  const e = entorno(async () => new Response('detalle del proveedor', { status: 401 }));
  const response = await e.run();
  assert.equal(response.headers.get('retry-after'), null);
  await errorPublico(response, 401, 'sesion_necesaria');
  assert.equal(e.calls(), 1);
});

test('la protección de origen se aplica antes de leer JSON o consultar al proveedor', async () => {
  const e = entorno(() => { throw new Error('No debe consultar al proveedor'); });
  await errorPublico(await e.run({ origin: 'https://otro.example.test', body: '{' }), 403, 'origen_no_permitido');
  assert.equal(e.calls(), 0);
});
