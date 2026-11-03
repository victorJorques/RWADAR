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
  const { fichasPublicadas } = require('./compilar.cjs');
  const unaOferta = '/' + fichasPublicadas().find(r => r.startsWith('ofertas/')).replace(/\.html$/, '/');
  for (const ruta of ['/', unaOferta, '/rwadar.csv', '/assets/catalogo-publico-20261022.js']) {
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

test('el worker lleva exactamente las fichas del manifiesto o las que se le pasen', () => {
  const { fichasPublicadas, CARPETAS_FICHAS } = require('./compilar.cjs');
  const manifiesto = require('../rwadar-fichas-manifiesto.js');
  assert.deepEqual(CARPETAS_FICHAS, ['ofertas', 'plataformas', 'fuera-del-radar']);
  assert.deepEqual(fichasPublicadas(), manifiesto.filter(r => /^(ofertas|plataformas|fuera-del-radar)\/[^/.]+\.html$/.test(r)).sort());
  assert.ok(construirWorker().includes('const fichasRWAdar = new Set(' + JSON.stringify(fichasPublicadas()) + ');'));
  const propias = ['ofertas/a.html', 'plataformas/b.html', 'fuera-del-radar/c.html'];
  assert.ok(construirWorker(undefined, { fichas: propias }).includes('const fichasRWAdar = new Set(' + JSON.stringify([...propias].sort()) + ');'));
  assert.notEqual(construirWorker(undefined, { fichas: propias }), construirWorker());
  assert.throws(() => construirWorker(undefined, { fichas: ['plataformas/b.html'] }), /ninguna oferta/);
});

// ASSETS de prueba: /404 es la página de error; lo demás, una respuesta configurable.
function assetsDePrueba(cabeceras = {}) {
  const pedidas = [];
  return { pedidas, env: { ASSETS: { fetch: async req => {
    const url = new URL(req.url);
    pedidas.push(url.pathname);
    if (url.pathname === '/404') return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'ETag': '"x"', 'Content-Security-Policy': "default-src 'self'", 'Cache-Control': 'public, max-age=0, must-revalidate' } });
    return new Response('contenido', { status: 200, headers: cabeceras });
  } } } };
}
const BASE_WEB = 'https://rwadar.pages.dev';
const CTX = { waitUntil() {} };
async function compilar(fichas, marca) {
  return (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(undefined, { fichas })).toString('base64') + '#' + marca)).default;
}
async function esNoEncontrada(r, ruta, metodo = 'GET') {
  assert.equal(r.status, 404, ruta);
  assert.equal(await r.text(), metodo === 'HEAD' ? '' : '<title>Fuera de cobertura · RWAdar</title>', ruta);
  assert.equal(r.headers.get('cache-control'), 'no-store', ruta);
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow', ruta);
  assert.equal(r.headers.get('etag'), null, ruta);
  assert.equal(r.headers.get('cf-cache-status'), null, ruta);
  assert.equal(r.headers.get('x-frame-options'), 'DENY', ruta);
  assert.equal(r.headers.get('content-security-policy'), "default-src 'self'", ruta);
}

test('una ficha que no está en la lista da 404 sin pedir a ASSETS su copia de conservación', async () => {
  const worker = await compilar(['ofertas/viva.html', 'plataformas/plataforma-viva.html', 'fuera-del-radar/descarte-vivo.html'], 'lista');
  for (const ruta of ['/ofertas/retirada', '/ofertas/retirada.html', '/ofertas/retirada/', '/ofertas/retir%61da', '/ofertas/retirada?x=1',
    '//ofertas/retirada', '/ofertas//retirada', '///ofertas///retirada', '//ofertas%2Fretirada', '/plataformas/retirada', '/fuera-del-radar/retirada.html',
    '/ofertas/VIVA', '/ofertas/viva-no']) {
    const { pedidas, env } = assetsDePrueba();
    await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + ruta), env, CTX), ruta);
    assert.deepEqual(pedidas, ['/404'], ruta);
  }
  const { pedidas, env } = assetsDePrueba();
  await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + '/ofertas/retirada', { method: 'HEAD' }), env, CTX), 'HEAD', 'HEAD');
  assert.deepEqual(pedidas, ['/404']);

  // Las vivas, las imágenes y lo que no es una ficha van a ASSETS tal cual.
  for (const ruta of ['/ofertas/viva', '/ofertas/viva.html', '/ofertas/viva/', '//ofertas/viva', '/ofertas/viva?x=1', '/plataformas/plataforma-viva',
    '/fuera-del-radar/descarte-vivo', '/plataformas/addx.webp', '/ofertas/', '/ofertas', '/ofertas-editoriales/oferta-viva.webp', '/academy/no-existe', '/']) {
    const { pedidas, env } = assetsDePrueba();
    const r = await worker.fetch(new Request(BASE_WEB + ruta), env, CTX);
    assert.equal(r.status, 200, ruta);
    assert.equal(await r.text(), 'contenido', ruta);
    assert.deepEqual(pedidas, [new URL(BASE_WEB + ruta).pathname], ruta);
  }

  // Si /404 no está disponible, responde igualmente 404 en texto.
  const sinPagina = { ASSETS: { fetch: async () => new Response('x', { status: 500 }) } };
  const r = await worker.fetch(new Request(BASE_WEB + '/ofertas/retirada'), sinPagina, CTX);
  assert.equal(r.status, 404);
  assert.equal(await r.text(), 'No encontrado');
  const caida = { ASSETS: { fetch: async () => { throw new Error('caída'); } } };
  assert.equal((await worker.fetch(new Request(BASE_WEB + '/ofertas/retirada'), caida, CTX)).status, 404);
});

test('la copia de conservación de cualquier otro archivo retirado da 404, salvo en /assets/', async () => {
  const worker = await compilar(['ofertas/viva.html'], 'conservada');
  const conservada = { 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, s-maxage=604800' };
  for (const [ruta, cabeceras] of [
    ['/ofertas-editoriales/oferta-retirada.webp', conservada],
    ['/ofertas-editoriales/oferta-retirada.webp', { 'CF-Cache-Status': 'hit', 'X-Robots-Tag': 'noindex, nofollow' }],
    ['/academy/leccion-borrada', conservada],
    ['/plataformas/retirada.webp', conservada],
    ['//ofertas-editoriales/oferta-retirada.webp', conservada],
  ]) {
    const { pedidas, env } = assetsDePrueba(cabeceras);
    await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + ruta), env, CTX), ruta);
    assert.deepEqual(pedidas, [new URL(BASE_WEB + ruta).pathname, '/404'], ruta);
  }
  const { env } = assetsDePrueba(conservada);
  await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + '/ofertas-editoriales/oferta-retirada.webp', { method: 'HEAD' }), env, CTX), 'HEAD', 'HEAD');

  for (const [ruta, cabeceras] of [
    ['/assets/rwadar-20260820.0123456789ab.js', conservada],
    ['/ofertas-editoriales/oferta-viva.webp', {}],
    ['/ofertas-editoriales/oferta-viva.webp', { 'X-Robots-Tag': 'noindex' }],
    ['/ofertas-editoriales/oferta-viva.webp', { 'CF-Cache-Status': 'HIT' }],
    ['/ofertas-editoriales/oferta-viva.webp', { 'CF-Cache-Status': 'MISS', 'X-Robots-Tag': 'noindex' }],
    ['/ofertas-editoriales/oferta-viva.webp', { 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindexado' }],
  ]) {
    const { pedidas, env } = assetsDePrueba(cabeceras);
    const r = await worker.fetch(new Request(BASE_WEB + ruta), env, CTX);
    assert.equal(r.status, 200, ruta + ' ' + JSON.stringify(cabeceras));
    assert.equal(await r.text(), 'contenido', ruta);
    assert.deepEqual(pedidas, [new URL(BASE_WEB + ruta).pathname], ruta);
  }
});
