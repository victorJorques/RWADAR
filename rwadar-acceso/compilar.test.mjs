import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { construirWorker, RUTAS } = require('./compilar.cjs');

test('el artefacto sirve lectura pública de exportaciones y páginas generadas', async () => {
  const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64'))).default;
  let servidos = 0;
  const assets = { ASSETS: { fetch: async () => { servidos++; return new Response('contenido'); } } };
  const ctx = { waitUntil() {} };
  for (const ruta of ['/', '/ofertas/casa-de-outeiro/', '/rwadar.csv', '/assets/catalogo-publico-20261022.js']) {
    const response = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), assets, ctx);
    assert.equal(response.status, 200, ruta);
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-robots-tag'), null, ruta);
  }
  const publico = await worker.fetch(new Request('https://rwadar.pages.dev/acceso'), assets, ctx);
  assert.equal(publico.status, 200);
  assert.match(publico.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(servidos, 5);
  assert.deepEqual(RUTAS, { version: 1, include: ['/*'], exclude: [] });
});

test('la compilación es determinista y no acepta un servidor con dependencias nuevas', () => {
  assert.equal(construirWorker(), construirWorker());
  assert.throws(() => construirWorker('no-existe'), /ENOENT/);
});

test('la salida compilada permite recursos legales y lectura del catálogo', async () => {
  const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64'))).default;
  let llamadas = 0;
  const env = { ASSETS: { fetch: async () => { llamadas++; return new Response('legal'); } } };
  for (const ruta of ['/assets/analitica-20260927.123456789abc.js', '/assets/idioma-web-20261022.123456789abc.js',
    '/assets/privacidad-20260820.123456789abc.css', '/assets/fuentes/geist-normal-6ab67a4f11f1.woff2', '/sw.js']) {
    assert.equal((await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), env, { waitUntil() {} })).status, 200);
  }
  assert.equal(llamadas, 5);
  assert.equal((await worker.fetch(new Request('https://rwadar.pages.dev/assets/catalogo-publico-20261022.123456789abc.js'), env, { waitUntil() {} })).status, 200);
  assert.equal(llamadas, 6);
});

test('la salida compilada conserva la CSP estricta del intercambio nativo y no refleja su token', async () => {
  const original = globalThis.fetch;
  const uid = '11111111-1111-4111-8111-111111111111';
  let worker;
  try {
    globalThis.fetch = async url => new Response(JSON.stringify(url.endsWith('/auth/v1/user')
      ? { id: uid, email: 'control@example.test', email_confirmed_at: '2026-10-23T00:00:00Z' } : [{ id: uid }]), { status: 200 });
    worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64') + '#intercambio')).default;
  } finally { globalThis.fetch = original; }
  const token = 'eyJ0ZXN0.e30.ZmlybWE';
  const response = await worker.fetch(new Request('https://rwadar.pages.dev/api/acceso/tutorial',
    { headers: { Authorization: 'Bearer ' + token } }), {}, { waitUntil() {} });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await response.text()).includes(token), false);
});
