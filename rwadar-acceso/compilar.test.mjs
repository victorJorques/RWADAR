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
  assert.equal(response.headers.get('content-security-policy'), "default-src 'none'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await response.text()).includes(token), false);
});

test('las fichas retiradas dan 404 sin pedir a ASSETS su copia de conservación', async () => {
  const { fichasPublicadas, CARPETAS_FICHAS } = require('./compilar.cjs');
  const manifiesto = require('../rwadar-fichas-manifiesto.js');
  const publicadas = fichasPublicadas();
  // La lista del worker es exactamente la del manifiesto en esas carpetas.
  assert.deepEqual(publicadas, manifiesto.filter(r => /^(ofertas|plataformas|fuera-del-radar)\/[^/]+\.html$/.test(r)).sort());
  assert.deepEqual(CARPETAS_FICHAS, ['ofertas', 'plataformas', 'fuera-del-radar']);
  assert.equal(publicadas.includes('ofertas/mf-one.html'), false);
  assert.ok(publicadas.includes('ofertas/mtbill.html'));

  const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64') + '#retiradas')).default;
  const pedidas = [];
  const env = { ASSETS: { fetch: async req => {
    const url = new URL(req.url);
    pedidas.push(url.pathname);
    if (url.pathname === '/404') return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'ETag': '"x"', 'Content-Security-Policy': "default-src 'self'", 'Cache-Control': 'public, max-age=0, must-revalidate' } });
    return new Response('copia conservada', { status: 200, headers: { 'Cache-Control': 'public, s-maxage=604800', 'CF-Cache-Status': 'HIT' } });
  } } };
  const ctx = { waitUntil() {} };
  const base = 'https://rwadar.pages.dev';

  for (const ruta of ['/ofertas/mf-one', '/ofertas/mf-one.html', '/ofertas/mf-one/', '/ofertas/mf%2Done', '/ofertas/mglo?x=1',
    '/plataformas/no-existe', '/fuera-del-radar/no-existe.html', '/ofertas/MTBILL']) {
    pedidas.length = 0;
    const r = await worker.fetch(new Request(base + ruta), env, ctx);
    assert.equal(r.status, 404, ruta);
    assert.equal(await r.text(), '<title>Fuera de cobertura · RWAdar</title>', ruta);
    assert.deepEqual(pedidas, ['/404'], ruta);
    assert.equal(r.headers.get('cache-control'), 'no-store', ruta);
    assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow', ruta);
    assert.equal(r.headers.get('etag'), null, ruta);
    assert.equal(r.headers.get('x-frame-options'), 'DENY', ruta);
    assert.equal(r.headers.get('content-security-policy'), "default-src 'self'", ruta);
  }

  pedidas.length = 0;
  const cabeza = await worker.fetch(new Request(base + '/ofertas/mf-one', { method: 'HEAD' }), env, ctx);
  assert.equal(cabeza.status, 404);
  assert.equal(await cabeza.text(), '');
  assert.deepEqual(pedidas, ['/404']);

  // Las publicadas, las imágenes y lo que no es una ficha siguen yendo a ASSETS tal cual.
  for (const ruta of [...publicadas.map(r => '/' + r.replace(/\.html$/, '')), '/ofertas/mtbill.html', '/ofertas/mtbill/',
    '/plataformas/addx.webp', '/ofertas/', '/ofertas', '/ofertas-editoriales/oferta-mtbill.webp', '/academy/no-existe', '/']) {
    pedidas.length = 0;
    const r = await worker.fetch(new Request(base + ruta), env, ctx);
    assert.equal(r.status, 200, ruta);
    assert.equal(await r.text(), 'copia conservada', ruta);
    assert.deepEqual(pedidas, [new URL(base + ruta).pathname], ruta);
  }

  // Si /404 no está disponible, responde igualmente 404 en texto.
  const sinPagina = { ASSETS: { fetch: async () => new Response('x', { status: 500 }) } };
  const r = await worker.fetch(new Request(base + '/ofertas/mf-one'), sinPagina, ctx);
  assert.equal(r.status, 404);
  assert.equal(await r.text(), 'No encontrado');
  const caida = { ASSETS: { fetch: async () => { throw new Error('caída'); } } };
  assert.equal((await worker.fetch(new Request(base + '/ofertas/mf-one'), caida, ctx)).status, 404);
});
