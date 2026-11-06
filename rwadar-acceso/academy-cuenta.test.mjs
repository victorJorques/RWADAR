// Academy con cuenta (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md, punto 1):
// la puerta de las lecciones en el servidor y en el worker compilado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { crearAccesoServidor } from './servidor.mjs';
const require = createRequire(import.meta.url);
const { construirWorker, academyPublicada } = require('./compilar.cjs');
const { PAGINAS_ACADEMY } = require('../rwadar-publicacion-segura.js');

const ORIGIN = 'https://rwadar.pages.dev';
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.prueba';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const LECCION = 'que-significa-tokenizar-un-activo';
const ACADEMY = { acceso: 'cuenta', lecciones: [LECCION, 'como-leer-el-radar'] };
const HTML = 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8';

// auth(url, init) decide lo que responde Supabase; por defecto, sesión válida.
function entorno({ academy = ACADEMY, auth, plazoMs } = {}) {
  const calls = []; const servidas = [];
  const server = crearAccesoServidor({ academy, ...(plazoMs ? { plazoMs } : {}), fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (auth) return auth(url, init);
    if (init.headers.Authorization !== 'Bearer ' + TOKEN) return Response.json({ error_code: 'bad_jwt' }, { status: 403 });
    if (url.includes('/auth/v1/user')) return Response.json({ id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false });
    if (url.includes('/mi_perfil?')) return Response.json([{ id: UID }]);
    return Response.json({});
  } });
  async function run(ruta, { method = 'GET', accept = HTML, token, headers = {}, env = ENV } = {}) {
    const h = { ...(accept ? { accept } : {}), ...(token ? { cookie: '__Host-rwadar-acceso=' + token } : {}), ...headers };
    return server.atender({ env, request: new Request(ORIGIN + ruta, { method, headers: h }),
      next: async () => { servidas.push(ruta); return new Response(method === 'HEAD' ? null : 'LECCION ' + ruta, { headers: {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', Vary: 'Accept-Encoding' } }); } });
  }
  return { run, calls, servidas };
}
const noStore = r => /(?:^|,)\s*no-store\s*(?:,|$)/.test(r.headers.get('cache-control') || '');
function mandaAEntrar(r, slug = LECCION) {
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('location'), '/acceso?volver=/academy/' + slug);
  assert.ok(noStore(r));
  assert.equal(r.headers.get('vary'), 'Cookie');
  assert.equal(r.headers.get('set-cookie'), null);
}

test('sin sesión, una lección en HTML manda a /acceso con su vuelta, sin preguntar a Supabase', async () => {
  const e = entorno();
  for (const ruta of [`/academy/${LECCION}`, `/academy/${LECCION}/`, `/academy/${LECCION}.html`, `//academy/${LECCION}`,
    `/ACADEMY/${LECCION}`, `/Academy//${LECCION}.html`, `/%61cademy/${LECCION}`, `/academy/que-significa-tokenizar-un-%61ctivo`,
    `/academy/${LECCION}?utm=x`]) {
    for (const method of ['GET', 'HEAD']) mandaAEntrar(await e.run(ruta, { method }));
  }
  // Una navegación sin Accept también es una página.
  mandaAEntrar(await e.run(`/academy/${LECCION}`, { accept: null, headers: { 'sec-fetch-mode': 'navigate' } }));
  mandaAEntrar(await e.run('/academy/como-leer-el-radar'), 'como-leer-el-radar');
  assert.equal(e.calls.length, 0, 'sin cookie no se consulta Auth');
  assert.deepEqual(e.servidas, []);
});

test('sin sesión, lo que no es una página recibe 401 sin guardarse', async () => {
  const e = entorno();
  for (const accept of [null, 'application/json', '*/*']) {
    const r = await e.run(`/academy/${LECCION}`, { accept });
    assert.equal(r.status, 401, String(accept));
    assert.deepEqual(await r.json(), { error: 'sesion_necesaria' });
    assert.ok(noStore(r)); assert.equal(r.headers.get('location'), null); assert.equal(r.headers.get('set-cookie'), null);
  }
  assert.deepEqual(e.servidas, []);
});

test('una lección que no está en la lista da 404 sin mirar la cookie', async () => {
  const e = entorno();
  for (const ruta of ['/academy/expediente-de-tokenizacion', '/academy/inventada', `/academy/${LECCION.toUpperCase()}`,
    `/academy/${LECCION}/otra`, `/academy/${LECCION}.css`, '/academy/.html', '/academy/index/x']) {
    for (const token of [undefined, TOKEN]) {
      const r = await e.run(ruta, { token });
      assert.equal(r.status, 404, ruta);
      assert.ok(noStore(r)); assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
      assert.equal(r.headers.get('set-cookie'), null);
    }
  }
  assert.equal((await e.run('/academy/inventada', { method: 'HEAD' })).status, 404);
  assert.equal(e.calls.length, 0); assert.deepEqual(e.servidas, []);
});

test('una ruta de la Academy con %2F, %5C o mal codificada da 400', async () => {
  const e = entorno();
  for (const ruta of [`/academy/a%2F${LECCION}`, `/academy%2F${LECCION}`, `/academy/a%5Cb`, `/academy%5c${LECCION}`,
    '/academy/%E0%A4%A', `/academy/${LECCION}%ZZ`, '/%61cademy/a%2fb']) {
    const r = await e.run(ruta, { token: TOKEN });
    assert.equal(r.status, 400, ruta);
    assert.equal(r.headers.get('set-cookie'), null);
  }
  assert.equal(e.calls.length, 0); assert.deepEqual(e.servidas, []);
});

test('el índice y lo que no es la Academy siguen públicos y sin consultar Auth', async () => {
  const e = entorno();
  const rutas = ['/academy/', '/academy', '/academy/index.html', '/academy/index', '/ACADEMY/', '//academy/', '/academyx',
    `/academia/${LECCION}`, '/ofertas/x', '/', '/acceso'];
  for (const ruta of rutas) {
    const r = await e.run(ruta);
    assert.equal(r.status, 200, ruta);
    assert.equal(r.headers.get('cache-control'), 'public, max-age=0, must-revalidate', ruta);
    assert.equal(r.headers.get('x-robots-tag'), null, ruta);
  }
  assert.equal(e.calls.length, 0); assert.deepEqual(e.servidas, rutas);
});

test('con sesión, la lección sale por el camino normal, privada, sin guardar y sin indexar', async () => {
  const e = entorno();
  for (const [ruta, method] of [[`/academy/${LECCION}`, 'GET'], [`/academy/${LECCION}.html`, 'GET'], [`/academy/${LECCION}`, 'HEAD']]) {
    const r = await e.run(ruta, { token: TOKEN, method });
    assert.equal(r.status, 200, ruta);
    if (method === 'GET') assert.equal(await r.text(), 'LECCION ' + ruta);
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
    assert.equal(r.headers.get('x-robots-tag'), 'noindex');
    assert.equal(r.headers.get('vary'), 'Accept-Encoding, Cookie');
    assert.equal(r.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(r.headers.get('set-cookie'), null);
  }
  // Para la lección también vale una petición que no es HTML.
  assert.equal((await e.run(`/academy/${LECCION}`, { token: TOKEN, accept: 'application/json' })).status, 200);
  assert.equal(e.calls.length, 8, 'Auth y el perfil, una vez por petición');
  assert.ok(e.calls.every(c => c.init.headers.Authorization === 'Bearer ' + TOKEN));
});

test('sesión revocada, caducada, sin confirmar o de otra persona: a entrar, sin borrar la cookie', async () => {
  const usuario = extra => Response.json({ id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z', ...extra });
  for (const auth of [
    async url => url.includes('/auth/v1/user') ? Response.json({ error_code: 'bad_jwt' }, { status: 403 }) : Response.json([]),
    async url => url.includes('/auth/v1/user') ? Response.json({ msg: 'no' }, { status: 401 }) : Response.json([]),
    async url => url.includes('/auth/v1/user') ? usuario() : Response.json([]),
    async url => url.includes('/auth/v1/user') ? usuario() : Response.json({ code: 'PGRST301' }, { status: 401 }),
    async url => url.includes('/auth/v1/user') ? usuario({ email_confirmed_at: null }) : Response.json([{ id: UID }]),
    async url => url.includes('/auth/v1/user') ? usuario({ is_anonymous: true }) : Response.json([{ id: UID }]),
    async url => url.includes('/auth/v1/user') ? usuario() : Response.json([{ id: '22222222-2222-4222-8222-222222222222' }]),
  ]) {
    const e = entorno({ auth });
    mandaAEntrar(await e.run(`/academy/${LECCION}`, { token: TOKEN }));
    const api = await e.run(`/academy/${LECCION}`, { token: TOKEN, accept: 'application/json' });
    assert.equal(api.status, 401); assert.equal(api.headers.get('set-cookie'), null);
    assert.deepEqual(e.servidas, []);
  }
  // Una cookie sin forma de token no llega a Auth.
  const e = entorno();
  mandaAEntrar(await e.run(`/academy/${LECCION}`, { token: 'no-es-un-token' }));
  assert.equal(e.calls.length, 0);
});

test('Supabase lento o caído: 503 con Retry-After, sin mandar a entrar ni tocar la cookie', async () => {
  const casos = [
    [async () => new Response('caído', { status: 503 }), '30'],
    [async () => new Response('error', { status: 500 }), '30'],
    [async () => new Response('', { status: 502 }), '30'],
    [async () => new Response('', { status: 429, headers: { 'Retry-After': '120' } }), '120'],
    [async () => { throw new TypeError('fetch failed'); }, '30'],
    [async () => new Response('<html>no JSON</html>', { status: 200 }), '30'],
    [async () => new Response(null, { status: 302, headers: { Location: 'https://ajeno.example.invalid' } }), '30'],
    // Un 400 o un 404 de Auth no son «sin sesión»: tampoco se manda a entrar.
    [async () => Response.json({ error_code: 'validation_failed' }, { status: 400 }), '30'],
  ];
  for (const [auth, espera] of casos) {
    const e = entorno({ auth });
    const pagina = await e.run(`/academy/${LECCION}`, { token: TOKEN });
    assert.equal(pagina.status, 503);
    assert.equal(pagina.headers.get('retry-after'), espera);
    assert.ok(noStore(pagina)); assert.equal(pagina.headers.get('location'), null); assert.equal(pagina.headers.get('set-cookie'), null);
    assert.match(pagina.headers.get('content-type'), /^text\/html/);
    const html = await pagina.text();
    assert.match(html, /No podemos comprobar tu sesión ahora/); assert.doesNotMatch(html, /<script|<style|\sstyle=|\son[a-z]+=/i);
    const api = await e.run(`/academy/${LECCION}`, { token: TOKEN, accept: 'application/json' });
    assert.equal(api.status, 503); assert.deepEqual(await api.json(), { error: 'servicio_no_disponible' });
    assert.equal(api.headers.get('retry-after'), espera); assert.equal(api.headers.get('set-cookie'), null);
    assert.equal((await e.run(`/academy/${LECCION}`, { token: TOKEN, method: 'HEAD' })).status, 503);
    assert.deepEqual(e.servidas, []);
  }
  // Un Auth que no contesta a tiempo también es un fallo pasajero.
  const lento = entorno({ plazoMs: 20, auth: (url, init) => new Promise((_, rechazar) =>
    init.signal.addEventListener('abort', () => rechazar(new DOMException('abortado', 'AbortError')))) });
  const r = await lento.run(`/academy/${LECCION}`, { token: TOKEN });
  assert.equal(r.status, 503); assert.equal(r.headers.get('retry-after'), '30');
  // Sin configuración pública del proyecto, tampoco se manda a entrar.
  const sinConfig = entorno();
  assert.equal((await sinConfig.run(`/academy/${LECCION}`, { token: TOKEN, env: {} })).status, 503);
  assert.equal(sinConfig.calls.length, 0);
});

test('con "publico" o sin configuración, las lecciones van como antes', async () => {
  for (const academy of [{ acceso: 'publico', lecciones: ACADEMY.lecciones }, null]) {
    const e = entorno({ academy });
    for (const ruta of [`/academy/${LECCION}`, '/academy/expediente-de-tokenizacion', '/academy/a%2Fb', '/academy/inventada']) {
      const r = await e.run(ruta);
      assert.equal(r.status, 200, ruta);
      assert.equal(r.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
      assert.equal(r.headers.get('x-robots-tag'), null);
    }
    assert.equal(e.calls.length, 0);
  }
});

test('una configuración de la Academy rara hace fallar el arranque', () => {
  for (const academy of [{}, { acceso: 'abierto', lecciones: [] }, { acceso: 'cuenta' }, { acceso: 'cuenta', lecciones: ['../x'] },
    { acceso: 'cuenta', lecciones: ['Mayus'] }, { acceso: 'cuenta', lecciones: [7] }, 'cuenta']) {
    assert.throws(() => crearAccesoServidor({ academy }), /academy_invalida/, JSON.stringify(academy));
  }
});

// ---- El worker compilado con rwadar-academy/academy.json ----
const BASE = 'https://rwadar.pages.dev';
const CTX = { waitUntil() {} };
let compilaciones = 0;
async function compilar(opciones) {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (init.headers.Authorization !== 'Bearer ' + TOKEN) return Response.json({ error_code: 'bad_jwt' }, { status: 403 });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z' });
    return Response.json([{ id: UID }]);
  };
  try {
    return (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(undefined, opciones)).toString('base64') + '#academy-' + (++compilaciones))).default;
  } finally { globalThis.fetch = original; }
}
function assets() {
  const pedidas = [];
  return { pedidas, env: { ASSETS: { fetch: async req => {
    const url = new URL(req.url); pedidas.push(url.pathname);
    if (url.pathname === '/404') return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    return new Response('LECCION', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  } } } };
}

test('el worker lleva el modo y la lista cerrada de lecciones de academy.json', async () => {
  const academy = academyPublicada();
  assert.equal(academy.acceso, 'cuenta');
  assert.deepEqual([...academy.lecciones], PAGINAS_ACADEMY.filter(p => p !== 'academy/index.html').map(p => p.slice(8, -5)).sort());
  // Las nueve publicadas desde el 06/11/2026 (orden de Víctor): ya no queda ninguna «Próximamente».
  assert.equal(academy.lecciones.length, 9);
  assert.ok(['expediente-de-tokenizacion', 'despues-de-emitir-ciclo-de-vida'].every(slug => academy.lecciones.includes(slug)));
  assert.deepEqual([...academy.pendientes], []);
  assert.ok(construirWorker().includes('const academyRWAdar = Object.freeze(' + JSON.stringify({ acceso: 'cuenta', lecciones: academy.lecciones }) + ');'));
  // Una «Próximamente» no viaja en el worker (con una configuración simulada).
  const conPendiente = construirWorker(undefined, { academy: { acceso: 'cuenta', lecciones: [{ slug: LECCION, estado: 'publicado' },
    { slug: 'leccion-en-revision', estado: 'en_revision' }] } });
  assert.ok(conPendiente.includes('const academyRWAdar = Object.freeze(' + JSON.stringify({ acceso: 'cuenta', lecciones: [LECCION] }) + ');'));
  assert.ok(!conPendiente.includes('leccion-en-revision'), 'las «Próximamente» no viajan en el worker');
  const publico = construirWorker(undefined, { academy: { acceso: 'publico', lecciones: [{ slug: LECCION, estado: 'publicado' }] } });
  assert.ok(publico.includes('"acceso":"publico"'));
  for (const academy of [{ lecciones: [{ slug: LECCION, estado: 'publicado' }] }, { acceso: 'abierto', lecciones: [{ slug: LECCION, estado: 'publicado' }] },
    { acceso: 'cuenta', lecciones: [] }, { acceso: 'cuenta', lecciones: [{ slug: '../x', estado: 'publicado' }] },
    { acceso: 'cuenta', lecciones: [{ slug: LECCION, estado: 'publicado' }, { slug: LECCION, estado: 'en_revision' }] },
    { acceso: 'cuenta', lecciones: [{ slug: LECCION, estado: 'en_revision' }] }]) {
    assert.throws(() => construirWorker(undefined, { academy }), /academy\.json/, JSON.stringify(academy));
  }
});

test('el worker compilado aplica la puerta con sus cabeceras de seguridad y su página 404', async () => {
  const worker = await compilar();
  const sinSesion = assets();
  const r = await worker.fetch(new Request(BASE + '/academy/' + LECCION, { headers: { accept: HTML } }), sinSesion.env, CTX);
  mandaAEntrar(r);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.deepEqual(sinSesion.pedidas, []);
  // Las lecciones 8 y 9 (publicadas el 06/11/2026) siguen la misma puerta que las demás.
  for (const slug of ['expediente-de-tokenizacion', 'despues-de-emitir-ciclo-de-vida']) {
    const sin = assets();
    mandaAEntrar(await worker.fetch(new Request(BASE + '/academy/' + slug, { headers: { accept: HTML } }), sin.env, CTX), slug);
    assert.deepEqual(sin.pedidas, [], slug);
    const con = assets();
    const abierta = await worker.fetch(new Request(BASE + '/academy/' + slug, { headers: { accept: HTML, cookie: '__Host-rwadar-acceso=' + TOKEN } }), con.env, CTX);
    assert.equal(abierta.status, 200, slug); assert.equal(abierta.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(con.pedidas, ['/academy/' + slug], slug);
  }
  // Una lección inventada da el 404 del worker aunque haya sesión.
  const fuera = async (w, ruta) => {
    const { pedidas, env } = assets();
    const r = await w.fetch(new Request(BASE + ruta, { headers: { accept: HTML, cookie: '__Host-rwadar-acceso=' + TOKEN } }), env, CTX);
    assert.equal(r.status, 404, ruta);
    assert.equal(await r.text(), '<title>Fuera de cobertura · RWAdar</title>');
    assert.equal(r.headers.get('cache-control'), 'no-store'); assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.deepEqual(pedidas, ['/404'], ruta);
  };
  for (const ruta of ['/academy/inventada', '/academy/rwadar-comprobacion-leccion-inexistente', '/academy/leccion-10']) await fuera(worker, ruta);
  // Y una «Próximamente» también (con una configuración simulada: hoy no queda ninguna).
  const conPendiente = await compilar({ academy: { acceso: 'cuenta', lecciones: [{ slug: LECCION, estado: 'publicado' },
    { slug: 'despues-de-emitir-ciclo-de-vida', estado: 'en_revision' }] } });
  await fuera(conPendiente, '/academy/despues-de-emitir-ciclo-de-vida');
  const conSesion = assets();
  const leccion = await worker.fetch(new Request(BASE + '/academy/' + LECCION, { headers: { accept: HTML, cookie: '__Host-rwadar-acceso=' + TOKEN } }), conSesion.env, CTX);
  assert.equal(leccion.status, 200); assert.equal(await leccion.text(), 'LECCION');
  assert.equal(leccion.headers.get('cache-control'), 'private, no-store');
  assert.equal(leccion.headers.get('x-robots-tag'), 'noindex'); assert.equal(leccion.headers.get('vary'), 'Cookie');
  assert.equal(leccion.headers.get('x-frame-options'), 'DENY');
  assert.deepEqual(conSesion.pedidas, ['/academy/' + LECCION]);
  const indice = assets();
  const portada = await worker.fetch(new Request(BASE + '/academy/'), indice.env, CTX);
  assert.equal(portada.status, 200); assert.equal(portada.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  assert.deepEqual(indice.pedidas, ['/academy/']);
  // Con "publico", el mismo worker sirve las lecciones a cualquiera, como antes.
  const abierto = await compilar({ academy: { acceso: 'publico', lecciones: [{ slug: LECCION, estado: 'publicado' }] } });
  const publico = assets();
  const libre = await abierto.fetch(new Request(BASE + '/academy/' + LECCION, { headers: { accept: HTML } }), publico.env, CTX);
  assert.equal(libre.status, 200); assert.equal(libre.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  assert.deepEqual(publico.pedidas, ['/academy/' + LECCION]);
});
