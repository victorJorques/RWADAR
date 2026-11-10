/* GET /api/tokenizacion («La tokenización en el mundo», 10/11/2026): la ruta
   del servidor web (servidor.mjs y el _worker.js compilado), su caché de 30
   minutos, la foto guardada cuando CoinGecko falla o da 429, la historia
   estática, las cabeceras, la copia web del motor y la portada en Chromium
   (390 × 844 y 1366 × 900, con la red de CoinGecko simulada). Sin red. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { crearAccesoServidor } from './servidor.mjs';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const { construirWorker } = require('./compilar.cjs');
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const copiaWeb = require('../rwadar-app/tokenizacion/copiar-modelo-web.cjs');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const COINGECKO = fs.readFileSync(path.join(RAIZ, 'rwadar-app/tokenizacion/prueba-coingecko-20261110.json'), 'utf8');
const SEMILLA = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/tokenizacion-historico.json'), 'utf8');
const AHORA = Date.parse('2026-11-10T15:31:37Z');
const ORIGEN = 'https://rwadar.pages.dev';

function cacheFalsa() {
  const guardado = new Map();
  return { guardado,
    async match(peticion) { const t = guardado.get(peticion.url); return t === undefined ? undefined : new Response(t); },
    async put(peticion, respuesta) { guardado.set(peticion.url, await respuesta.text()); } };
}
function montar({ coingecko = () => new Response(COINGECKO, { status: 200 }), historico = SEMILLA, cache = null, reloj } = {}) {
  const llamadas = [];
  let t = AHORA;
  const servidor = crearAccesoServidor({ cacheTokenizacion: cache, ahora: reloj || (() => t), fetchImpl: async (url, init) => {
    llamadas.push({ url: String(url), init });
    if (String(url) !== modelo.FUENTE.api) throw new Error('petición inesperada: ' + url);
    return coingecko();
  } });
  const activos = [];
  const pedir = (ruta = '/api/tokenizacion', init = {}) => servidor.atender({ request: new Request(ORIGEN + ruta, init), env: {},
    activo: async (url) => { activos.push(url); return historico === null ? new Response('No', { status: 404 }) : new Response(historico); },
    waitUntil: () => {}, next: () => new Response('archivo') });
  return { pedir, llamadas, activos, avanzar: ms => { t += ms; } };
}

test('GET /api/tokenizacion: total, tipos y periodos de CoinGecko fusionados con la historia, sin sesión y sin guardar', async () => {
  const m = montar();
  const r = await m.pedir('/api/tokenizacion', { headers: { cookie: '__Host-rwadar-acceso=a.b.c' } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(r.headers.get('cache-control'), 'private, no-store');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(r.headers.get('set-cookie'), null);
  const d = await r.json();
  assert.equal(modelo.resumenValido(d), true);
  assert.equal(d.fuente, 'coingecko');
  assert.equal(d.total.valor, 49683537033);
  assert.equal(d.tipos.length, 8);
  assert.deepEqual(d.atribucion, { nombre: 'CoinGecko', url: 'https://www.coingecko.com/' });
  assert.equal(d.guardadoDesde, '2026-11-10');
  assert.deepEqual(d.periodos.map(p => p.estado), ['ok', 'sin-datos', 'sin-datos', 'sin-datos', 'sin-datos']);
  // A CoinGecko no llega nada del visitante: ni su cookie ni ninguna credencial.
  assert.equal(m.llamadas.length, 1);
  assert.deepEqual(m.llamadas[0].init.headers, { Accept: 'application/json', 'User-Agent': 'RWAdar/1.0 (+https://rwadar.pages.dev)' });
  assert.equal(m.llamadas[0].init.redirect, 'manual');
  assert.deepEqual(m.activos, [ORIGEN + '/datos/tokenizacion-historico.json']);
  // La ruta con barra final es la misma.
  assert.equal((await m.pedir('/api/tokenizacion/')).status, 200);
});

test('solo GET y sin parámetros; cualquier otra ruta /api/ sigue cerrada', async () => {
  const m = montar();
  const head = await m.pedir('/api/tokenizacion', { method: 'HEAD' });
  assert.equal(head.status, 405);
  assert.equal(head.headers.get('allow'), 'GET');
  for (const metodo of ['POST', 'PUT', 'DELETE']) {
    assert.equal((await m.pedir('/api/tokenizacion', { method: metodo, headers: { origin: ORIGEN, 'content-type': 'application/json' }, body: '{}' })).status, 405, metodo);
  }
  assert.equal((await m.pedir('/api/tokenizacion?pais=es')).status, 400);
  assert.equal((await m.pedir('/api/tokenizaciones')).status, 404);
  assert.equal(m.llamadas.length, 0, 'ninguna de esas peticiones llega a CoinGecko');
});

test('caché de 30 minutos (memoria del worker y Cache API); después se vuelve a preguntar', async () => {
  const cache = cacheFalsa();
  const m = montar({ cache });
  await m.pedir(); await m.pedir();
  assert.equal(m.llamadas.length, 1);
  assert.equal(cache.guardado.size, 1);
  assert.match([...cache.guardado.keys()][0], /^https:\/\/rwadar\.pages\.dev\/__rwadar-cache\/tokenizacion-coingecko-v1$/);
  m.avanzar(29 * 60000); await m.pedir();
  assert.equal(m.llamadas.length, 1);
  m.avanzar(2 * 60000); await m.pedir();
  assert.equal(m.llamadas.length, 2);
  // Otro isolate (memoria vacía) lee la Cache API y no pregunta (en Cloudflare,
  // waitUntil deja terminar la escritura; aquí se espera un momento).
  await new Promise(r => setTimeout(r, 20));
  const otro = montar({ cache, reloj: () => AHORA + 32 * 60000 });
  assert.equal((await (await otro.pedir()).json()).fuente, 'coingecko');
  assert.equal(otro.llamadas.length, 0);
});

test('las peticiones simultáneas con la caché fría hacen una sola llamada a CoinGecko', async () => {
  let soltar;
  const espera = new Promise(r => { soltar = r; });
  const m = montar({ coingecko: async () => { await espera; return new Response(COINGECKO, { status: 200 }); } });
  const pendientes = Array.from({ length: 20 }, () => m.pedir());
  await new Promise(r => setTimeout(r, 10));
  soltar();
  const respuestas = await Promise.all(pendientes);
  assert.equal(m.llamadas.length, 1);
  for (const r of respuestas) assert.equal((await r.json()).fuente, 'coingecko');
  // Y si esa única llamada falla, todas reciben la foto guardada y no se insiste.
  let soltarMal;
  const esperaMal = new Promise(r => { soltarMal = r; });
  const caido = montar({ coingecko: async () => { await esperaMal; return new Response('{}', { status: 503 }); } });
  const malas = Array.from({ length: 10 }, () => caido.pedir());
  await new Promise(r => setTimeout(r, 10));
  soltarMal();
  for (const r of await Promise.all(malas)) assert.equal((await r.json()).fuente, 'foto-guardada');
  assert.equal(caido.llamadas.length, 1);
  await caido.pedir();
  assert.equal(caido.llamadas.length, 1, 'tras el fallo espera 5 minutos');
});

test('si CoinGecko falla o da 429: la última foto con su fecha y «foto-guardada», y no se le insiste', async () => {
  // Sin nada en caché: la última foto del histórico.
  const caido = montar({ coingecko: () => new Response('{"status":{"error_code":429}}', { status: 429, headers: { 'Retry-After': '600' } }) });
  let d = await (await caido.pedir()).json();
  assert.equal(d.fuente, 'foto-guardada');
  assert.equal(d.actualizado, '2026-11-10T15:25:40.000Z');
  assert.equal(d.total.valor, 49683537033);
  await caido.pedir();
  caido.avanzar(9 * 60000); await caido.pedir();
  assert.equal(caido.llamadas.length, 1, 'con Retry-After de 600 s no vuelve a preguntar en 10 minutos');
  caido.avanzar(2 * 60000); await caido.pedir();
  assert.equal(caido.llamadas.length, 2);
  // Con una lectura buena de hace más de 30 min, esa lectura, marcada como guardada.
  let fallar = false;
  const m = montar({ coingecko: () => (fallar ? new Response('error', { status: 502 }) : new Response(COINGECKO)) });
  await m.pedir(); fallar = true; m.avanzar(45 * 60000);
  d = await (await m.pedir()).json();
  assert.equal(d.fuente, 'foto-guardada');
  assert.equal(d.actualizado, '2026-11-10T15:25:40.000Z');
  // Respuestas raras, cortes y redirecciones: igual, nunca un 500 ni cifras inventadas.
  for (const coingecko of [() => new Response('<html>'), () => new Response('[]'), () => new Response(null, { status: 302, headers: { Location: 'https://otra.test/' } }),
    () => { throw new TypeError('red caída'); }, () => new Response(JSON.stringify([{ id: 'tokenized-products', market_cap: 'x' }]))]) {
    const r = await montar({ coingecko }).pedir();
    assert.equal(r.status, 200);
    assert.equal((await r.json()).fuente, 'foto-guardada');
  }
  // Sin CoinGecko y sin histórico (o con uno roto): estado vacío honesto, sin cifras.
  for (const historico of [null, '{"version":1,"fuente":"CoinGecko","fotos":"x"}', 'no es json']) {
    d = await (await montar({ coingecko: () => new Response('x', { status: 500 }), historico }).pedir()).json();
    assert.equal(d.fuente, 'sin-datos');
    assert.equal(d.total, null);
    assert.ok(d.periodos.every(p => p.cambio === null));
  }
});

test('un plazo corta a CoinGecko colgado (6 s en el servidor)', async () => {
  const servidor = crearAccesoServidor({ cacheTokenizacion: null, ahora: () => AHORA,
    fetchImpl: (url, init) => new Promise((_, rechazar) => init.signal.addEventListener('abort', () => rechazar(new Error('abortada')))) });
  const reloj = setTimeout; let plazo = 0;
  globalThis.setTimeout = (fn, ms) => { if (ms === 6000) { plazo = ms; return reloj(fn, 5); } return reloj(fn, ms); };
  try {
    const r = await servidor.atender({ request: new Request(ORIGEN + '/api/tokenizacion'), env: {}, activo: async () => new Response(SEMILLA) });
    assert.equal(plazo, 6000);
    assert.equal((await r.json()).fuente, 'foto-guardada');
  } finally { globalThis.setTimeout = reloj; }
});

test('el _worker.js compilado sirve la ruta: historia desde ASSETS y CoinGecko con el fetch del worker', async () => {
  const original = globalThis.fetch, originalCaches = globalThis.caches;
  const pedidas = [];
  globalThis.fetch = async (url) => { pedidas.push(String(url)); return new Response(COINGECKO); };
  globalThis.caches = undefined;
  let worker;
  try { worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64') + '#tokenizacion')).default; }
  finally { globalThis.fetch = original; }
  try {
    const servidos = [];
    const env = { ASSETS: { fetch: async (peticion) => { servidos.push(new URL(peticion.url).pathname); return new Response(SEMILLA); } } };
    const r = await worker.fetch(new Request(ORIGEN + '/api/tokenizacion'), env, { waitUntil() {} });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.match(r.headers.get('content-security-policy'), /connect-src 'self' https:\/\/exgpmjpaaebyoolpwced\.supabase\.co https:\/\/cloudflareinsights\.com;/,
      'la CSP del navegador no cambia: CoinGecko no está en connect-src');
    const d = await r.json();
    assert.equal(d.guardadoDesde, '2026-11-10');
    assert.ok(['coingecko', 'foto-guardada'].includes(d.fuente));
    assert.deepEqual(servidos, ['/datos/tokenizacion-historico.json']);
    assert.ok(pedidas.every(u => u === modelo.FUENTE.api));
  } finally { globalThis.caches = originalCaches; }
});

test('la web lleva una copia exacta del motor, la semilla del histórico y su regla de caché', () => {
  assert.equal(copiaWeb.alDia(), true, 'ejecuta node rwadar-app/tokenizacion/copiar-modelo-web.cjs');
  const semilla = modelo.validarHistorico(JSON.parse(SEMILLA));
  assert.equal(semilla.fotos[0].fecha, '2026-11-10');
  assert.equal(modelo.serializarHistorico(semilla), SEMILLA, 'la semilla está escrita con serializarHistorico');
  assert.match(fs.readFileSync(path.join(RAIZ, 'rwadar-site/_headers'), 'utf8'), /\n\/datos\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n/);
  const { ARCHIVOS_PUBLICABLES, RUTAS_CONTENIDO_APROBADO } = require('../rwadar-publicacion-segura.js');
  for (const archivo of ['datos/tokenizacion-historico.json', 'assets/tokenizacion-modelo-20261110.js', 'assets/tokenizacion-20261110.js', 'assets/tokenizacion-20261110.css']) {
    assert.ok(ARCHIVOS_PUBLICABLES.includes(archivo), archivo);
  }
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-movil/lib/tokenizacion.js'));
  // El script de la sección no usa innerHTML ni habla con nadie más que con su servidor.
  const js = fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/tokenizacion-20261110.js'), 'utf8');
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|coingecko\.com\/api|api\.coingecko/);
  assert.deepEqual([...js.matchAll(/'(\/(?:api|datos)\/[^']+)'/g)].map(m => m[1]), ['/api/tokenizacion', '/datos/tokenizacion-historico.json']);
});

/* ---- Chromium: la portada con la sección, en móvil y en escritorio ---- */
function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

test('en Chromium: /mercado/ pinta la sección entera sin desbordes a 390 y 1366 px, con tablas accesibles, en inglés y con CoinGecko caído; Inicio, la tarjeta compacta', { skip: sinNavegador, timeout: 180000 }, async () => {
  let estado = 'vivo';
  // Las fuentes, sin huellas: el worker se compila desde rwadar-acceso/.
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder: async (url) => {
    if (url.hostname !== 'api.coingecko.com') return null;
    return estado === 'vivo' ? new Response(COINGECKO) : new Response('{}', { status: 429 });
  } });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      // Inicio (rediseño del 10/11/2026): la tarjeta compacta, con el total, 24 h, una barra apilada y «Ver el mercado →».
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-tokenizacion-estado="coingecko"]', { timeout: 20000 });
      const c = await pagina.evaluate(() => {
        const s = document.querySelector('#tokenizacion');
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        const tramos = [...s.querySelectorAll('.tk-tramo')].map(t => t.getBoundingClientRect().width);
        return { compacta: s.dataset.tokenizacion, total: s.querySelector('.tk-total-cifra').textContent, capsula: s.querySelector('.tk-capsula')?.textContent,
          tramos, ancho: s.querySelector('.tk-apilada').getBoundingClientRect().width, leyenda: [...s.querySelectorAll('.tk-leyenda-item')].map(l => l.textContent),
          periodos: s.querySelectorAll('.tk-periodo,.tk-tipo,.tk-linea').length, ver: s.querySelector('a.ini-ver[href="/mercado/"]')?.textContent.trim(),
          hora: document.getElementById('tkHora').textContent, fuera: fuera.length, anchoPagina: document.documentElement.scrollWidth,
          trasOfertas: document.getElementById('relNuevas').compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING };
      });
      assert.equal(c.compacta, 'compacta');
      assert.equal(c.total, '49.684\u00a0M$');
      assert.match(c.capsula, /^▼ −0,9\s%\sen 24 h$/);
      assert.equal(c.tramos.length, 4, 'los 3 tipos mayores y «Otros»');
      assert.ok(c.tramos.every(w => w >= 3) && c.tramos[0] > c.tramos[1], `cada tramo, su cuota (${c.tramos})`);
      assert.ok(Math.abs(c.tramos.reduce((a, b) => a + b, 0) + 6 - c.ancho) < 3, 'la barra suma el 100 %');
      assert.deepEqual(c.leyenda.map(t => t.replace(/[\s\u00a0\u202f]+/g, ' ')), ['Crédito privado 55,6 %', 'Letras del Tesoro 16,2 %', 'Materias primas 11,9 %', 'Otros 16,4 %']);
      assert.equal(c.periodos, 0, 'ni periodos, ni tipos, ni línea: están en /mercado/');
      assert.equal(c.ver, 'Ver el mercado→');
      assert.match(c.hora, /Dato del 10\/11\/2026, 15:25 UTC/);
      assert.equal(c.fuera, 0);
      assert.equal(c.anchoPagina, ancho);
      assert.ok(c.trasOfertas, 'después de «Ofertas»');
      // El pie de Inicio: en el móvil se ve y el teclado llega de la tarjeta de Aprende a «Nota legal completa»;
      // en escritorio no sale (el pie del sitio ya lleva la nota legal).
      const pie = await pagina.evaluate(() => {
        const p = document.querySelector('.ini-pie');
        return { alto: p.offsetHeight, display: getComputedStyle(p).display, rol: p.getAttribute('role'), etiqueta: p.tagName };
      });
      assert.equal(pie.rol, 'note');
      assert.equal(pie.etiqueta, 'DIV');
      if (ancho < 768) {
        assert.ok(pie.alto > 0, `390: el pie se ve (alto ${pie.alto}, display ${pie.display})`);
        await pagina.focus('.ini-aprende-tarjeta');
        await pagina.keyboard.press('Tab');
        const foco = await pagina.evaluate(() => ({ texto: document.activeElement.textContent.trim(), href: document.activeElement.getAttribute('href') }));
        assert.deepEqual(foco, { texto: 'Nota legal completa→', href: '/aprende/#nota-legal' }, 'Tab llega a «Nota legal completa»');
      } else assert.equal(pie.display, 'none', '1366: el pie de Inicio no repite la nota legal del sitio');
      // /mercado/: la sección entera, como estaba en Inicio.
      await pagina.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-tokenizacion-estado="coingecko"]', { timeout: 20000 });
      const m = await pagina.evaluate(() => {
        const s = document.querySelector('#tokenizacion');
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        const enlace = s.querySelector('.tk-fuente a');
        const portada = document.querySelector('h1').getBoundingClientRect();
        return { fuera: fuera.length, anchoPagina: document.documentElement.scrollWidth, total: s.querySelector('.tk-total-cifra').textContent,
          capsulas: [...s.querySelectorAll('.tk-periodo')].map(p => p.className.split(' ').pop()),
          barras: s.querySelectorAll('.tk-tipo').length, tablas: [...s.querySelectorAll('.solo-lector table caption')].map(c => c.textContent),
          filas: s.querySelectorAll('.solo-lector table tr').length, visualOculto: [...s.querySelectorAll('.tk-periodos,.tk-tipos')].every(n => n.getAttribute('aria-hidden') === 'true'),
          enlace: enlace && enlace.href, hora: document.getElementById('tkHora').textContent,
          seccionDespuesDePortada: s.getBoundingClientRect().top + scrollY >= portada.bottom + scrollY - 1,
          ancho1: getComputedStyle(s.querySelector('.tk-barra-relleno')).width,
          // Cada tabla, justo detrás de su gráfico (orden de lectura).
          tablaTrasPeriodos: s.querySelector('.tk-periodos').nextElementSibling?.querySelector('caption')?.textContent || null,
          tablaEnSuBloque: [...s.querySelectorAll('.tk-bloque')].find(b => b.querySelector('h3')?.textContent === 'Por tipo de activo')
            ?.querySelector('.tk-tipos + .solo-lector caption')?.textContent || null,
          hablado: s.querySelector('.tk-total .solo-lector')?.textContent, cifraOculta: s.querySelector('.tk-total-cifra').getAttribute('aria-hidden'),
          etiquetaTotal: s.querySelector('.tk-total-etq').textContent,
          notasPeriodos: [...s.querySelectorAll('.tk-periodo')].map(p => p.querySelector('.tk-periodo-nota').textContent),
          unaColumna: s.querySelector('.tk-graficos').classList.contains('tk-graficos--una'),
          // El título de la sección, alineado con el de la página.
          izquierdaTitulo: document.getElementById('tkTit').getBoundingClientRect().left,
          izquierdaCapitulo: document.querySelector('h1').getBoundingClientRect().left };
      });
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      assert.equal(m.fuera, 0, `${ancho}: nada se sale por los lados`);
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal`);
      assert.equal(m.total, '49.684\u00a0M$');
      assert.deepEqual(m.capsulas, ['tk-baja', 'tk-sin-datos', 'tk-sin-datos', 'tk-sin-datos', 'tk-sin-datos']);
      assert.equal(m.barras, 8);
      assert.deepEqual(m.tablas, ['Cambio del valor total por periodo', 'Valor por tipo de activo (millones de dólares)']);
      assert.equal(m.tablaTrasPeriodos, 'Cambio del valor total por periodo');
      assert.equal(m.tablaEnSuBloque, 'Valor por tipo de activo (millones de dólares)');
      assert.equal(m.hablado, '49.684 millones de dólares');
      assert.equal(m.cifraOculta, 'true');
      assert.equal(m.etiquetaTotal, 'Valor total de los activos tokenizados, en millones de dólares (M$)');
      // Sin fotos todavía: cuándo llegará cada periodo (la semilla es del 10/11/2026).
      assert.deepEqual(m.notasPeriodos.slice(1), ['disponible el 15/11', 'disponible el 08/12', 'disponible el 08/11/2027', 'disponible el 11/11']);
      assert.equal(m.unaColumna, true, 'con una foto, una columna');
      assert.ok(Math.abs(m.izquierdaTitulo - m.izquierdaCapitulo) < 1, `título alineado con el de la página (${m.izquierdaTitulo} y ${m.izquierdaCapitulo})`);
      assert.equal(m.filas, 6 + 9);
      assert.equal(m.visualOculto, true);
      assert.equal(m.enlace, 'https://www.coingecko.com/');
      assert.match(m.hora, /Dato del 10\/11\/2026, 15:25 UTC/);
      assert.ok(m.seccionDespuesDePortada, 'va tras el título de la página');
      assert.notEqual(m.ancho1, '0px', 'las barras tienen su ancho (CSSOM, sin style en línea)');
      // El enlace a CoinGecko se alcanza con el teclado y se ve el foco.
      await pagina.focus('#tokenizacion .tk-fuente a');
      assert.notEqual(await pagina.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
      // En inglés: textos del diccionario y cifras en su formato.
      // El selector de idioma está en Perfil en el móvil: se pulsa por código.
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await pagina.waitForFunction(() => document.querySelector('#tkTit').textContent === 'Tokenisation worldwide');
      const en = await pagina.evaluate(() => ({ total: document.querySelector('.tk-total-cifra').textContent,
        nota: document.querySelector('.tk-periodo-nota').textContent, caption: document.querySelector('#tokenizacion caption').textContent }));
      assert.deepEqual(en, { total: '$49,684M', nota: '▼ down', caption: 'Change in total value by period' });
      await pagina.close();
    }
    // Con varias fotos guardadas (las dos últimas casi iguales): la línea sin
    // relleno y con su escala escrita, «desde» en las cápsulas y, en
    // escritorio, barras y línea lado a lado más anchas que la columna.
    const f = modelo.extraerFoto(JSON.parse(COINGECKO), { ahora: AHORA });
    const dia = (fecha, factor) => ({ ...f, fecha, actualizado: fecha + 'T06:20:00.000Z', total: { ...f.total, valor: Math.round(f.total.valor * factor) } });
    let h = modelo.historicoVacio();
    for (const foto of [dia('2026-11-07', 0.998), dia('2026-11-08', 0.999), dia('2026-11-09', 0.997)]) h = modelo.anadirFoto(h, foto).historico;
    const conFotos = JSON.stringify(modelo.resumir({ historico: h, actual: f }));
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      await pagina.route('**/api/tokenizacion', r => r.fulfill({ status: 200, contentType: 'application/json', body: conFotos }));
      await pagina.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion .tk-linea-svg', { timeout: 20000 });
      const l = await pagina.evaluate(() => {
        const s = document.querySelector('#tokenizacion'), col = 720;
        const ys = s.querySelector('.tk-linea-trazo').getAttribute('points').split(' ').map(p => Number(p.split(',')[1]));
        return { area: s.querySelectorAll('.tk-linea-area, .tk-linea-svg path').length, ys, nota: s.querySelector('.tk-linea-nota').textContent,
          desde: [...s.querySelectorAll('.tk-periodo-desde')].map(n => n.textContent), anchoGraficos: s.querySelector('.tk-graficos').getBoundingClientRect().width, col,
          anchoPagina: document.documentElement.scrollWidth, una: s.querySelector('.tk-graficos').classList.contains('tk-graficos--una') };
      });
      assert.equal(l.area, 0, 'sin área rellena hasta el suelo');
      assert.ok(Math.max(...l.ys) - Math.min(...l.ys) < 112 / 2, `un 0,3 % no ocupa toda la altura (${l.ys})`);
      assert.equal(l.nota, 'De 49.584 M$ (07/11/2026) a 49.684 M$ (10/11/2026) · +0,2 %');
      assert.deepEqual(l.desde, ['desde 07/11']);
      assert.equal(l.una, false);
      assert.equal(l.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal con la línea`);
      if (ancho >= 900) assert.ok(l.anchoGraficos > l.col + 100, `en escritorio, los gráficos a lo ancho de la página (${l.anchoGraficos})`);
      await pagina.close();
    }
    // CoinGecko da 429: la última foto guardada, con su aviso y su fecha.
    estado = 'caido';
    const local2 = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder: async (url) =>
      (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
    try {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.goto(local2.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-tokenizacion-estado="foto-guardada"]', { timeout: 20000 });
      assert.match(await pagina.textContent('#tokenizacion .tk-aviso'), /Cifras de la última foto diaria de RWAdar, del 10\/11\/2026, 15:25 UTC/);
      // Sin servidor y sin histórico: estado vacío honesto, sin una sola cifra.
      await pagina.route('**/api/tokenizacion', r => r.abort());
      await pagina.route('**/datos/tokenizacion-historico.json', r => r.abort());
      await pagina.reload({ waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-tokenizacion-estado="sin-datos"]', { timeout: 20000 });
      const vacio = await pagina.textContent('#tkCuerpo');
      assert.match(vacio, /Ahora no podemos mostrar los datos de CoinGecko/);
      assert.doesNotMatch(vacio, /\d/);
      assert.ok(await pagina.isVisible('h1'), 'el resto de la página sigue');
      await pagina.close();
      // /aprende/: las frases con cifras del catálogo (04: mínimos de 1 € y su aviso; 06: vigencia). Las cifras
      // las escribe rwadar-publicar.js en <main>; aquí se simulan, vigentes y caducadas, sobre la fuente.
      const raizAprende = '<main id="contenido" class="sec-aprende inicio-cuerpo rel">';
      const conCifras = hasta => async r => {
        const resp = await r.fetch(); const html = await resp.text();
        assert.ok(html.includes(raizAprende), '/aprende/ tiene su <main> para las cifras');
        await r.fulfill({ response: resp, body: html.replace(raizAprende, raizAprende.replace('>',
          ` data-catalogo-ofertas="22" data-catalogo-minimos="5" data-catalogo-usd="1" data-catalogo-revisado="2026-11-10" data-catalogo-hasta="${hasta}">`)) });
      };
      const leerCifras = p => p.evaluate(() => ['relMinimos', 'relMinimosAviso', 'relVigencia'].map(id => {
        const n = document.getElementById(id); return { visible: !n.hidden && n.offsetHeight > 0, texto: n.textContent };
      }));
      const aprende = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      const erroresAprende = []; aprende.on('pageerror', e => erroresAprende.push(e.message));
      await aprende.route(u => u.pathname === '/aprende/', conCifras('2999-12-31'));
      await aprende.goto(local2.url + '/aprende/', { waitUntil: 'load' });
      const vigentes = await leerCifras(aprende);
      assert.deepEqual(vigentes, [
        { visible: true, texto: 'En el radar, 5 de las 22 ofertas tienen un mínimo documentado de 1 € o de 1 $.' },
        { visible: true, texto: 'Sin contar comisiones ni el cambio de divisa. Y un mínimo bajo no significa un riesgo bajo.' },
        { visible: true, texto: 'Catálogo revisado el 10/11/2026. Próxima revisión: 31/12/2999.' }]);
      await aprende.unrouteAll(); await aprende.route(u => u.pathname === '/aprende/', conCifras('2000-01-01'));
      await aprende.reload({ waitUntil: 'load' });
      assert.ok((await leerCifras(aprende)).every(c => !c.visible), 'con la revisión caducada, ninguna cifra del catálogo');
      await aprende.unrouteAll();
      await aprende.reload({ waitUntil: 'load' });
      assert.ok((await leerCifras(aprende)).every(c => !c.visible && !c.texto.includes('22')), 'sin cifras (la fuente sin publicar), nada');
      assert.deepEqual(erroresAprende, []);
      await aprende.close();
    } finally { await local2.cerrar(); }
  } finally { await navegador.close(); await local.cerrar(); }
});
