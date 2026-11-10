import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { construirWorker, RUTAS } = require('./compilar.cjs');
const AQUI = path.dirname(fileURLToPath(import.meta.url));

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
  assert.deepEqual(RUTAS, { version: 1, include: ['/*'], exclude: ['/assets/*'] });
});

test('la compilación es determinista y no acepta un servidor con dependencias nuevas', () => {
  assert.equal(construirWorker(), construirWorker());
  assert.throws(() => construirWorker('no-existe'), /ENOENT/);
});

/* Cloudflare (workerd) toma cada exportación con nombre de _worker.js como un
   punto de entrada: una exportación que no es una función (p. ej. un texto)
   hace que la web no se pueda desplegar. Ocurrió con VERSION_AVISOS_NOVEDADES. */
test('el worker compilado solo exporta funciones con nombre, además de default', async () => {
  for (const [marca, opciones] of [['exportaciones', {}],
    ['exportaciones-publica', { fichas: ['ofertas/viva.html'], academy: { acceso: 'publico', lecciones: [{ slug: 'viva', estado: 'publicado' }] } }]]) {
    const modulo = await import('data:text/javascript;base64,' + Buffer.from(construirWorker(undefined, opciones)).toString('base64') + '#' + marca);
    const conNombre = Object.keys(modulo).filter(nombre => nombre !== 'default');
    assert.deepEqual(conNombre.filter(nombre => typeof modulo[nombre] !== 'function'), [], marca + ': exportaciones que no son funciones');
    assert.deepEqual(conNombre.sort(), ['crearAccesoServidor', 'crearCarteraServidor', 'crearTokenizacionServidor', 'retornoSeguro'], marca);
    assert.equal(typeof modulo.default?.fetch, 'function', marca);
  }
});

test('la compilación rechaza un servidor que exporta algo que no es una función', () => {
  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-compilar-'));
  try {
    const raiz = path.join(temporal, 'rwadar-acceso');
    fs.mkdirSync(raiz); fs.mkdirSync(path.join(temporal, 'rwadar-movil', 'lib'), { recursive: true });
    fs.copyFileSync(path.join(AQUI, '..', 'rwadar-movil', 'lib', 'cartera.js'), path.join(temporal, 'rwadar-movil', 'lib', 'cartera.js'));
    fs.copyFileSync(path.join(AQUI, '..', 'rwadar-movil', 'lib', 'tokenizacion.js'), path.join(temporal, 'rwadar-movil', 'lib', 'tokenizacion.js'));
    const servidor = fs.readFileSync(path.join(AQUI, 'servidor.mjs'), 'utf8');
    const cartera = fs.readFileSync(path.join(AQUI, 'cartera-servidor.mjs'), 'utf8');
    const tokenizacion = fs.readFileSync(path.join(AQUI, 'tokenizacion-servidor.mjs'), 'utf8');
    const escribir = (s, c = cartera, k = tokenizacion) => { fs.writeFileSync(path.join(raiz, 'servidor.mjs'), s);
      fs.writeFileSync(path.join(raiz, 'cartera-servidor.mjs'), c); fs.writeFileSync(path.join(raiz, 'tokenizacion-servidor.mjs'), k); };
    escribir(servidor);
    assert.equal(construirWorker(raiz), construirWorker(), 'la copia sin cambios compila igual');
    for (const extra of ["export const VERSION_PRUEBA = 'x';", 'export let marca = 1;', 'export var activo = false;',
      'export class Prueba {}', 'const a = 1;\nexport { a };']) {
      escribir(servidor + '\n' + extra + '\n');
      assert.throws(() => construirWorker(raiz), /servidor\.mjs solo puede exportar funciones/, extra);
      escribir(servidor, cartera + '\n' + extra + '\n');
      assert.throws(() => construirWorker(raiz), /cartera-servidor\.mjs solo puede exportar funciones/, extra);
      escribir(servidor, cartera, tokenizacion + '\n' + extra + '\n');
      assert.throws(() => construirWorker(raiz), /tokenizacion-servidor\.mjs solo puede exportar funciones/, extra);
    }
    escribir(servidor + '\nexport async function otraPrueba() {}\n');
    assert.doesNotThrow(() => construirWorker(raiz));
    // El motor de la tokenización tiene que seguir siendo autónomo.
    escribir(servidor);
    const motor = path.join(temporal, 'rwadar-movil', 'lib', 'tokenizacion.js');
    fs.appendFileSync(motor, "\nconst fs = require('node:fs');\n");
    assert.throws(() => construirWorker(raiz), /El motor de la tokenización debe ser autónomo/);
  } finally { fs.rmSync(temporal, { recursive: true, force: true }); }
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
  // (Una lección inexistente ya no: con la Academy con cuenta da 404 en la
  // puerta de la Academy; ver academy-cuenta.test.mjs.)
  for (const ruta of ['/ofertas/viva', '/ofertas/viva.html', '/ofertas/viva/', '//ofertas/viva', '/ofertas/viva?x=1', '/plataformas/plataforma-viva',
    '/fuera-del-radar/descarte-vivo', '/plataformas/addx.webp', '/ofertas/', '/ofertas', '/ofertas-editoriales/oferta-viva.webp', '/academy/', '/']) {
    const { pedidas, env } = assetsDePrueba();
    const r = await worker.fetch(new Request(BASE_WEB + ruta), env, CTX);
    assert.equal(r.status, 200, ruta);
    assert.equal(await r.text(), 'contenido', ruta);
    assert.deepEqual(pedidas, [new URL(BASE_WEB + ruta).pathname], ruta);
  }
  {
    const { pedidas, env } = assetsDePrueba();
    await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + '/academy/no-existe'), env, CTX), '/academy/no-existe');
    assert.deepEqual(pedidas, ['/404'], 'una lección inexistente no se pide a ASSETS');
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
  // Con la Academy en "publico" (como antes), una lección borrada llega a ASSETS
  // y su copia de conservación se reconoce igual que la de cualquier archivo.
  const publica = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(undefined,
    { fichas: ['ofertas/viva.html'], academy: { acceso: 'publico', lecciones: [{ slug: 'viva', estado: 'publicado' }] } })).toString('base64') + '#conservada-publica')).default;
  const conservada = { 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, s-maxage=604800' };
  for (const [ruta, cabeceras, servidor = worker] of [
    ['/ofertas-editoriales/oferta-retirada.webp', conservada],
    ['/ofertas-editoriales/oferta-retirada.webp', { 'CF-Cache-Status': 'hit', 'X-Robots-Tag': 'noindex, nofollow' }],
    ['/academy/leccion-borrada', conservada, publica],
    ['/plataformas/retirada.webp', conservada],
    ['//ofertas-editoriales/oferta-retirada.webp', conservada],
  ]) {
    const { pedidas, env } = assetsDePrueba(cabeceras);
    await esNoEncontrada(await servidor.fetch(new Request(BASE_WEB + ruta), env, CTX), ruta);
    assert.deepEqual(pedidas, [new URL(BASE_WEB + ruta).pathname, '/404'], ruta);
  }
  // Con la Academy con cuenta, la lección borrada ni siquiera se pide a ASSETS.
  {
    const { pedidas, env } = assetsDePrueba(conservada);
    await esNoEncontrada(await worker.fetch(new Request(BASE_WEB + '/academy/leccion-borrada'), env, CTX), '/academy/leccion-borrada');
    assert.deepEqual(pedidas, ['/404']);
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

test('la revalidación de una copia de conservación (304) también da 404, y la de un archivo vivo sigue en 304', async () => {
  const worker = await compilar(['ofertas/viva.html'], 'revalidar');
  const conservada = { 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex' };
  const assets = (cabecerasSinCondicion) => {
    const pedidas = [];
    return { pedidas, env: { ASSETS: { fetch: async req => {
      const url = new URL(req.url);
      const condicional = req.headers.has('If-None-Match') || req.headers.has('If-Modified-Since');
      pedidas.push(req.method + ' ' + url.pathname + (condicional ? ' condicional' : ''));
      if (url.pathname === '/404') return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      if (condicional) return new Response(null, { status: 304 });
      return new Response(req.method === 'HEAD' ? null : 'contenido', { status: 200, headers: cabecerasSinCondicion });
    } } } };
  };
  for (const cabecera of [{ 'If-None-Match': '"vieja"' }, { 'If-Modified-Since': 'Tue, 03 Nov 2026 10:00:00 GMT' }]) {
    const { pedidas, env } = assets(conservada);
    const r = await worker.fetch(new Request(BASE_WEB + '/ofertas-editoriales/oferta-retirada.webp', { headers: cabecera }), env, CTX);
    assert.equal(r.status, 404, JSON.stringify(cabecera));
    assert.deepEqual(pedidas, ['GET /ofertas-editoriales/oferta-retirada.webp condicional', 'HEAD /ofertas-editoriales/oferta-retirada.webp', 'GET /404']);
  }
  const vivo = assets({ 'Cache-Control': 'public, max-age=0, must-revalidate' });
  const r = await worker.fetch(new Request(BASE_WEB + '/ofertas-editoriales/oferta-viva.webp', { headers: { 'If-None-Match': '"x"' } }), vivo.env, CTX);
  assert.equal(r.status, 304);
  assert.deepEqual(vivo.pedidas, ['GET /ofertas-editoriales/oferta-viva.webp condicional', 'HEAD /ofertas-editoriales/oferta-viva.webp']);
  // En /assets/ y sin cabeceras condicionales no hay segunda consulta.
  for (const [ruta, cabeceras] of [['/assets/x.0123456789ab.js', { 'If-None-Match': '"x"' }], ['/ofertas-editoriales/oferta-viva.webp', {}]]) {
    const { pedidas, env } = assets(conservada);
    const sinCondicion = { ASSETS: { fetch: async req => { pedidas.push(new URL(req.url).pathname); return new Response(null, { status: 304 }); } } };
    assert.equal((await worker.fetch(new Request(BASE_WEB + ruta, { headers: cabeceras }), sinCondicion, CTX)).status, 304, ruta);
    assert.deepEqual(pedidas, [ruta], ruta);
  }
});

test('una plataforma que cambia de carpeta redirige con 301 a la ficha que sí está en la lista', async () => {
  // Como tras descartar ARTEX (04/11/2026): su ficha pasa de plataformas/ a fuera-del-radar/.
  const worker = await compilar(['ofertas/viva.html', 'plataformas/sigue.html', 'fuera-del-radar/movida.html',
    'plataformas/vuelve.html'], 'traslado');
  for (const [ruta, destino] of [
    ['/plataformas/movida', '/fuera-del-radar/movida'], ['/plataformas/movida.html', '/fuera-del-radar/movida'],
    ['/plataformas/movida/', '/fuera-del-radar/movida'], ['//plataformas/movida', '/fuera-del-radar/movida'],
    ['/plataformas/mov%69da', '/fuera-del-radar/movida'], ['/plataformas/movida?x=1', '/fuera-del-radar/movida?x=1'],
    ['/fuera-del-radar/vuelve', '/plataformas/vuelve'], ['/fuera-del-radar/vuelve.html', '/plataformas/vuelve'],
  ]) {
    for (const method of ['GET', 'HEAD']) {
      const { pedidas, env } = assetsDePrueba();
      const r = await worker.fetch(new Request(BASE_WEB + ruta, { method }), env, CTX);
      assert.equal(r.status, 301, `${method} ${ruta}`);
      assert.equal(r.headers.get('location'), destino, `${method} ${ruta}`);
      assert.equal(r.headers.get('cache-control'), 'no-store', ruta);
      assert.equal(r.headers.get('x-robots-tag'), null, ruta);
      assert.equal(r.headers.get('x-frame-options'), 'DENY', ruta);
      assert.deepEqual(pedidas, [], `${ruta}: no pide nada a ASSETS (ni su copia de conservación)`);
    }
  }
  // Sin ficha en la otra carpeta, o con la ficha aún en su sitio, nada cambia.
  for (const ruta of ['/plataformas/no-esta', '/fuera-del-radar/no-esta', '/ofertas/movida', '/plataformas/MOVIDA',
    '/plataformas/movida.webp']) {
    const { pedidas, env } = assetsDePrueba();
    const r = await worker.fetch(new Request(BASE_WEB + ruta), env, CTX);
    assert.notEqual(r.status, 301, ruta);
    assert.ok(!pedidas.includes('/fuera-del-radar/movida'), ruta);
  }
  for (const ruta of ['/plataformas/sigue', '/fuera-del-radar/movida', '/plataformas/vuelve']) {
    const { pedidas, env } = assetsDePrueba();
    const r = await worker.fetch(new Request(BASE_WEB + ruta), env, CTX);
    assert.equal(r.status, 200, ruta);
    assert.deepEqual(pedidas, [ruta], ruta);
  }
  const { env } = assetsDePrueba();
  const post = await worker.fetch(new Request(BASE_WEB + '/plataformas/movida', { method: 'POST' }), env, CTX);
  assert.notEqual(post.status, 301, 'solo GET y HEAD');
});

/* _routes.json (07/11/2026): /assets/ sale del worker para no gastar el cupo
   gratis de Pages Functions en hojas, scripts, fuentes e imágenes del mapa.
   Cloudflare compara cada regla con la ruta; «*» vale cualquier cosa, también
   barras. Se comprueba con dos lecturas del comodín: la de wrangler en local
   («/x/*» también vale «/x») y la literal («*» → «.*»). Con las dos, lo que el
   worker controla tiene que seguir dentro. */
const SITIO = path.join(AQUI, '..', 'rwadar-site');
function reglaWrangler(regla) {
  let r;
  if (regla === '/' || regla === '/*') r = regla;
  else if (regla.endsWith('/*')) r = regla.slice(0, -2) + '(/*)?';
  else if (regla.endsWith('/')) r = regla.slice(0, -1) + '(/)?';
  else if (regla.endsWith('*')) r = regla;
  else r = regla + '(/)?';
  return new RegExp('^' + r.replaceAll('.', '\\.').replaceAll('*', '.*') + '$');
}
const reglaLiteral = regla => new RegExp('^' + regla.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*') + '$');
function pasaPorWorker(ruta, rutas = RUTAS, regla = reglaWrangler) {
  return rutas.include.some(r => regla(r).test(ruta)) && !rutas.exclude.some(r => regla(r).test(ruta));
}
function archivosDe(carpeta, base = carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? archivosDe(path.join(carpeta, e.name), base) : [path.relative(base, path.join(carpeta, e.name)).split(path.sep).join('/')]);
}

test('_routes.json generado es válido y respeta los límites de Cloudflare', () => {
  const { comprobarRutas, LIMITES_RUTAS } = require('./compilar.cjs');
  const generado = JSON.parse(JSON.stringify(RUTAS) + '\n');
  assert.deepEqual(generado, { version: 1, include: ['/*'], exclude: ['/assets/*'] });
  assert.deepEqual(LIMITES_RUTAS, { reglas: 100, caracteres: 100 });
  const reglas = [...generado.include, ...generado.exclude];
  assert.ok(generado.include.length >= 1 && reglas.length <= 100 && reglas.every(r => r.startsWith('/') && r.length <= 100));
  assert.doesNotThrow(() => comprobarRutas(generado));
  assert.ok(Object.isFrozen(RUTAS) && Object.isFrozen(RUTAS.exclude), 'nadie puede cambiar RUTAS después de comprobarla');
  const malas = [
    { version: 2, include: ['/*'], exclude: [] },
    { version: 1, include: [], exclude: [] },
    { version: 1, include: ['/*'] },
    { version: 1, include: ['/*'], exclude: [], extra: true },
    { version: 1, include: ['/*', '/*'], exclude: [] },
    { version: 1, include: ['/academy/*'], exclude: [] },
    { version: 1, include: ['/*'], exclude: ['/' + 'a'.repeat(100)] },
    { version: 1, include: ['/*'], exclude: Array.from({ length: 100 }, (_, i) => '/assets/' + i + '.js') },
    { version: 1, include: ['/*'], exclude: ['assets/*'] },
  ];
  for (const exclusion of ['/academy/*', '/academy*', '/api/*', '/api/acceso/*', '/*', '/*.html', '/', '/ofertas/*',
    '/plataformas/*', '/ofertas-editoriales/*', '/sw.js', '/assets', '/assets/x.js', '/assets*', '/assets/*.html', '/assets/ *'
  ]) malas.push({ version: 1, include: ['/*'], exclude: [exclusion] });
  for (const rutas of malas) assert.throws(() => comprobarRutas(rutas), /_routes\.json/, JSON.stringify(rutas));
});

test('/academy/*, /api/*, el HTML y lo que el worker controla siguen pasando por el worker; /assets/ queda fuera', () => {
  const { fichasPublicadas, academyPublicada } = require('./compilar.cjs');
  const { lecciones, pendientes } = academyPublicada();
  const dentro = ['/', '/index.html', '/acceso', '/acceso.html', '/baja', '/cambios', '/metodologia', '/privacidad',
    '/transparencia-comercial', '/para-empresas', '/404', '/404.html', '/sw.js', '/manifest.webmanifest', '/icono-192.png',
    '/og.png', '/robots.txt', '/sitemap.xml', '/novedades.xml', '/rwadar.csv', '/.well-known/security.txt', '/android',
    '/academy', '/academy/', '/academy/x', '/academy/index', '/academy/assets/x.js', '/academy/x/assets/y.css',
    '/api', '/api/', '/api/x', '/api/assets/x.js', '/api/acceso/sesion', '/api/acceso/entrar', '/api/acceso/datos',
    '/api/acceso/cartera', '/api/acceso/baja', '/api/acceso/tutorial', '/api/acceso/tutorial-continuar.js',
    '/api/acceso/catalogo/plataformas', '/ofertas/', '/plataformas/', '/fuera-del-radar/', '/ofertas/retirada',
    '/plataformas/retirada.webp', '/ofertas-editoriales/oferta-retirada.webp', '/assetsx/a.js', '/ASSETS/a.js',
    '/Assets/a.js', '//assets/a.js', '/x/assets/a.js',
    ...[...lecciones, ...pendientes].flatMap(slug => ['/academy/' + slug, '/academy/' + slug + '.html', '/academy/' + slug + '/']),
    ...fichasPublicadas().flatMap(ruta => ['/' + ruta, '/' + ruta.replace(/\.html$/, ''), '/' + ruta.replace(/\.html$/, '.webp')]),
  ];
  const fuera = ['/assets/', '/assets/x.js', '/assets/rwadar-20260820.0123456789ab.js', '/assets/rwadar-20260820.0123456789ab.css',
    '/assets/fuentes/geist-normal-6ab67a4f11f1.woff2', '/assets/images/layers.png', '/assets/mapa-ubicaciones-20261027.json',
    '/assets/vendor/leaflet-1.9.4/license.txt'];
  for (const regla of [reglaWrangler, reglaLiteral]) {
    for (const ruta of dentro) assert.equal(pasaPorWorker(ruta, RUTAS, regla), true, `${ruta} tiene que pasar por el worker`);
    for (const ruta of fuera) assert.equal(pasaPorWorker(ruta, RUTAS, regla), false, `${ruta} tiene que quedar fuera`);
  }
  // Con el sitio real: todo lo que queda fuera está en assets/ y no es HTML;
  // todo lo de la raíz y de las demás carpetas (HTML, fichas, imágenes de las
  // fichas, Academy, sw.js, iconos) sigue dentro.
  const archivos = archivosDe(SITIO).filter(n => !['_headers', '_redirects'].includes(n));
  const excluidos = archivos.filter(n => !pasaPorWorker('/' + n));
  assert.ok(excluidos.length >= 30, `assets fuera del worker: ${excluidos.length}`);
  assert.deepEqual(excluidos.filter(n => !n.startsWith('assets/') || /\.html?$/i.test(n)), []);
  assert.deepEqual(archivos.filter(n => n.startsWith('assets/') && pasaPorWorker('/' + n)), []);
  for (const n of archivos.filter(n => n.endsWith('.html'))) {
    assert.ok(pasaPorWorker('/' + n) && pasaPorWorker('/' + n.replace(/(?:index)?\.html$/, '')), n);
  }
});

test('en /assets/ el worker solo añade las cabeceras de seguridad, y _headers ya las pone', async () => {
  const { CABECERAS_SEGURIDAD } = require('./compilar.cjs');
  const worker = await compilar(['ofertas/viva.html'], 'assets-fuera');
  const muestras = [];
  for (const extension of ['css', 'js', 'woff2', 'png', 'json', 'txt']) {
    const n = archivosDe(path.join(SITIO, 'assets')).find(a => a.endsWith('.' + extension));
    assert.ok(n, 'falta un .' + extension + ' en assets/');
    muestras.push('/assets/' + n);
  }
  // 1. Con el worker delante: misma respuesta de ASSETS, cabeceras de seguridad encima.
  const propias = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': '"x"', 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'" };
  for (const ruta of muestras) {
    for (const method of ['GET', 'HEAD']) {
      const pedidas = [];
      const env = { ASSETS: { fetch: async req => { pedidas.push(req.method + ' ' + new URL(req.url).pathname);
        return new Response(req.method === 'HEAD' ? null : 'contenido', { status: 200, headers: propias }); } } };
      const r = await worker.fetch(new Request(BASE_WEB + ruta, { method }), env, CTX);
      assert.equal(r.status, 200, ruta);
      assert.equal(await r.text(), method === 'HEAD' ? '' : 'contenido', ruta);
      assert.deepEqual(pedidas, [method + ' ' + ruta], ruta);
      const esperadas = new Headers(propias);
      for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) {
        if (nombre !== 'Content-Security-Policy' || !esperadas.has(nombre)) esperadas.set(nombre, valor);
      }
      assert.deepEqual(Object.fromEntries(r.headers), Object.fromEntries(esperadas), `${method} ${ruta}: el worker no añade nada más`);
    }
  }
  // 2. Sin el worker (como en Pages tras el cambio): lo que pone _headers.
  const { crearAssetsLocales } = await import('./probar-worker-local.mjs');
  const assets = crearAssetsLocales(SITIO);
  /* Sin diferencias admitidas: si el worker cambia o endurece una cabecera,
     /assets/ (que ya no pasa por él) no puede quedarse atrás sin que esto falle. */
  for (const ruta of muestras) {
    const r = await assets.fetch(new Request(BASE_WEB + ruta));
    assert.equal(r.status, 200, ruta);
    assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable', ruta);
    for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) {
      assert.equal(r.headers.get(nombre), valor, `${ruta}: ${nombre} de _headers no es la que pone el worker`);
    }
  }
});
