/* GET /api/tokenizacion («La tokenización en el mundo», 10/11/2026): la ruta
   del servidor web (servidor.mjs y el _worker.js compilado), su caché de 30
   minutos, la foto guardada cuando CoinGecko falla o da 429, la historia
   estática, las cabeceras, la copia web del motor y, en Chromium (390 × 844 y
   1366 × 900, con la red de CoinGecko simulada), «Mercado y noticias» al
   estilo de una app de bolsa (11/11/2026): la cotización de Inicio y el
   gráfico de /mercado/ con la serie de un año. Sin red. */
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

test('la web lleva una copia exacta del motor, la semilla del histórico y de la serie, y su regla de caché', () => {
  assert.equal(copiaWeb.alDia(), true, 'ejecuta node rwadar-app/tokenizacion/copiar-modelo-web.cjs');
  const semilla = modelo.validarHistorico(JSON.parse(SEMILLA));
  assert.equal(semilla.fotos[0].fecha, '2026-11-10');
  assert.equal(modelo.serializarHistorico(semilla), SEMILLA, 'la semilla está escrita con serializarHistorico');
  const textoSerie = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/tokenizacion-serie.json'), 'utf8');
  assert.equal(modelo.serializarSerie(modelo.validarSerie(JSON.parse(textoSerie))), textoSerie, 'la serie está escrita con serializarSerie');
  assert.match(fs.readFileSync(path.join(RAIZ, 'rwadar-site/_headers'), 'utf8'), /\n\/datos\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n/);
  const { ARCHIVOS_PUBLICABLES, RUTAS_CONTENIDO_APROBADO } = require('../rwadar-publicacion-segura.js');
  for (const archivo of ['datos/tokenizacion-historico.json', 'datos/tokenizacion-serie.json', 'assets/tokenizacion-modelo-20261110.js',
    'assets/mercado-20261111.js', 'assets/mercado-20261111.css', 'assets/noticias-a-mercado-20261111.js']) {
    assert.ok(ARCHIVOS_PUBLICABLES.includes(archivo), archivo);
  }
  assert.ok(!ARCHIVOS_PUBLICABLES.some(a => /tokenizacion-20261110\.(js|css)$/.test(a)), 'la sección de antes ya no se publica');
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-movil/lib/tokenizacion.js'));
  // El script no usa innerHTML ni habla con nadie más que con su propio sitio.
  const js = fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/mercado-20261111.js'), 'utf8');
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|coingecko\.com\/api|api\.coingecko/);
  assert.deepEqual([...js.matchAll(/'(\/(?:api|datos)\/[^']+)'/g)].map(m => m[1]), ['/api/tokenizacion', '/datos/tokenizacion-historico.json', '/datos/tokenizacion-serie.json']);
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

const SERIE = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/tokenizacion-serie.json'), 'utf8')));
test('en Chromium: «Mercado y noticias» al estilo de una app de bolsa: Inicio con la cotización; /mercado/ con pestañas, gráfico, cruz con ratón y teclado, tabla, datos clave, inglés y CoinGecko caído', { skip: sinNavegador, timeout: 180000 }, async () => {
  // Las fuentes, sin huellas: el worker se compila desde rwadar-acceso/.
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder: async (url) => {
    if (url.hostname !== 'api.coingecko.com') return null;
    return new Response(COINGECKO);
  } });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      // Inicio: la tarjeta tipo cotización (nombre, cifra, cambio del mes y minigráfico), que lleva a /mercado/.
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-mercado-estado="coingecko+serie"]', { timeout: 20000 });
      const g1m = modelo.graficoPestana(SERIE, '1m');
      const c = await pagina.evaluate(() => {
        const s = document.querySelector('#mercado');
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        const a = s.querySelector('a.mk-ct');
        return { href: a.getAttribute('href'), nombre: a.querySelector('.mk-ct-nom').textContent, cifra: a.querySelector('.mk-ct-cifra').textContent,
          cambio: a.querySelector('.mk-cambio').textContent, periodo: a.querySelector('.mk-ct-periodo').textContent, mini: !!a.querySelector('svg.mk-mini-svg .mk-linea'),
          etiqueta: a.getAttribute('aria-label'), ver: s.querySelector('a.ini-ver[href="/mercado/"]')?.textContent.trim(), fuente: s.querySelector('.mk-fuente').textContent,
          fuera: fuera.length, anchoPagina: document.documentElement.scrollWidth,
          trasOfertas: document.getElementById('relNuevas').compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING };
      });
      assert.equal(c.href, '/mercado/');
      assert.equal(c.nombre, 'Activos tokenizados');
      assert.equal(c.cifra, '49.684 M$', 'la cifra de hoy, en vivo');
      assert.equal(c.cambio, { sube: '▲', baja: '▼', igual: '=' }[g1m.direccion] + g1m.cambioTexto, 'el cambio del mes, con flecha y signo');
      assert.equal(c.periodo, 'último mes');
      assert.ok(c.mini, 'el minigráfico del mes');
      assert.match(c.etiqueta, /^Mercado de activos tokenizados: 49\.684 millones de dólares, (sube|baja|sin cambios) /);
      assert.equal(c.ver, 'Ver mercado y noticias→');
      assert.match(c.fuente, /^Datos: CoinGecko · dato de hoy del 10\/11\/2026, 15:25 UTC$/);
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

      // /mercado/: cifra grande, cambio del periodo, pestañas, gráfico y datos clave.
      await pagina.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion .mk-svg', { timeout: 20000 });
      const leer = () => pagina.evaluate(() => {
        const s = document.querySelector('#tokenizacion'), svg = s.querySelector('.mk-svg'), graf = s.querySelector('.mk-graf');
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        const eje = [...svg.querySelectorAll('.mk-eje text')];
        const anchoSvg = svg.getBoundingClientRect().width;
        return { h1: document.querySelector('h1').textContent, cifra: s.querySelector('.mk-cifra-num').textContent, hablado: s.querySelector('.mk-cifra .solo-lector').textContent,
          cambio: s.querySelector('.mk-linea-cambio .mk-cambio').textContent, periodo: s.querySelector('.mk-periodo').textContent,
          pestanas: [...s.querySelectorAll('.mk-pestana')].map(b => [b.textContent, b.getAttribute('aria-pressed'), b.tagName, b.getAttribute('aria-label')]),
          grupo: s.querySelector('.mk-pestanas').getAttribute('role'),
          trazo: getComputedStyle(svg.querySelector('.mk-linea')).stroke, grosor: getComputedStyle(svg.querySelector('.mk-linea')).strokeWidth,
          area: svg.querySelector('.mk-area').getAttribute('fill'), base: getComputedStyle(svg.querySelector('.mk-base')).strokeDasharray,
          valoresDerecha: eje.filter(t => !t.classList.contains('mk-eje-unidad') && Number(t.getAttribute('x')) > anchoSvg - 70 && !/[a-z]/i.test(t.textContent)).map(t => t.textContent),
          fechas: eje.filter(t => !t.classList.contains('mk-eje-unidad') && /[a-z]/i.test(t.textContent)).map(t => t.textContent), altoSvg: svg.getBoundingClientRect().height, anchoSvg,
          anchoCaja: s.getBoundingClientRect().width,
          rol: graf.getAttribute('role'), tabla: s.querySelectorAll('.solo-lector table tr').length, caption: s.querySelector('.solo-lector caption').textContent,
          nota: s.querySelector('.mk-nota').textContent, clave: [...s.querySelectorAll('.mk-clave dt')].map(d => d.textContent),
          tipos: s.querySelectorAll('.mk-tipo').length, fuente: s.querySelector('.mk-fuente a')?.href,
          fuera: fuera.length, anchoPagina: document.documentElement.scrollWidth };
      });
      let m = await leer();
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      assert.equal(m.h1, 'Mercado de activos tokenizados');
      assert.equal(m.cifra, '49.684 M$');
      assert.equal(m.hablado, '49.684 millones de dólares');
      assert.equal(m.cambio, { sube: '▲', baja: '▼', igual: '=' }[g1m.direccion] + g1m.cambioTexto);
      assert.equal(m.periodo, 'último mes');
      assert.equal(m.grupo, 'group');
      assert.deepEqual(m.pestanas.map(p => p[0]), ['1 S', '1 M', '3 M', '6 M', 'YTD', '1 A']);
      assert.deepEqual(m.pestanas.map(p => p[1]), ['false', 'true', 'false', 'false', 'false', 'false'], '1 M por defecto');
      assert.ok(m.pestanas.every(p => p[2] === 'BUTTON'));
      assert.deepEqual(m.pestanas.map(p => p[3]), ['1 semana', '1 mes', '3 meses', '6 meses', 'Este año', '1 año']);
      assert.equal(m.trazo, g1m.direccion === 'baja' ? 'rgb(255, 107, 94)' : g1m.direccion === 'sube' ? 'rgb(37, 227, 154)' : 'rgb(187, 181, 171)', 'verde si sube, rojo si baja');
      assert.equal(m.grosor, '2px');
      assert.match(m.area, /^url\(#mkDeg/);
      assert.notEqual(m.base, 'none', 'la línea de puntos del valor de partida');
      assert.deepEqual(m.valoresDerecha, g1m.marcasValores.map(x => x.texto), 'el eje de valores, a la derecha');
      assert.ok(m.valoresDerecha.length >= 4 && m.valoresDerecha.length <= 5);
      assert.deepEqual(m.fechas, g1m.marcasFechas.map(x => x.texto));
      assert.equal(m.altoSvg, ancho < 768 ? 240 : 300);
      assert.ok(Math.abs(m.anchoSvg - m.anchoCaja) < 2, 'a todo el ancho');
      assert.equal(m.rol, 'slider');
      assert.equal(m.tabla, g1m.puntos.length + 1, 'la tabla equivalente, con todos los días');
      assert.equal(m.caption, 'Valor diario, último mes (suma de los mayores tokens)');
      assert.equal(m.nota, modelo.notaSerie(SERIE));
      assert.deepEqual(m.clave, ['Valor total hoy', 'Cambio en 24 h', 'Máximo del periodo', 'Mínimo del periodo', 'Tokens en el gráfico', 'Tipo mayor']);
      assert.equal(m.tipos, 8);
      assert.equal(m.fuente, 'https://www.coingecko.com/');
      assert.equal(m.fuera, 0, `${ancho}: nada se sale por los lados`);
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal`);
      // Cada pestaña: su tramo y su texto; el seleccionado, marcado.
      for (const p of modelo.PESTANAS) {
        await pagina.click(`[data-pestana="${p.clave}"]`);
        const g = modelo.graficoPestana(SERIE, p.clave);
        await pagina.waitForFunction(t => document.querySelector('.mk-periodo').textContent === t, g.periodoTexto);
        await pagina.waitForSelector('#tokenizacion .mk-svg');
        m = await leer();
        assert.equal(m.pestanas.find(x => x[0] === p.corto)[1], 'true', p.clave);
        assert.equal(m.tabla, g.puntos.length + 1, p.clave);
        assert.deepEqual(m.fechas, g.marcasFechas.map(x => x.texto), p.clave);
        assert.equal(m.fuera, 0, p.clave);
      }
      await pagina.click('[data-pestana="1m"]');
      await pagina.waitForFunction(() => document.querySelector('.mk-periodo').textContent === 'último mes');
      await pagina.waitForSelector('#tokenizacion .mk-svg');
      // La cruz con el ratón: fecha y valor del día más cercano.
      const caja = await pagina.locator('.mk-graf').boundingBox();
      await pagina.mouse.move(caja.x + 2, caja.y + caja.height / 2);
      await pagina.waitForSelector('.mk-burbuja:not([hidden])');
      const cruz = await pagina.evaluate(() => ({ fecha: document.querySelector('.mk-burbuja-fecha').textContent, valor: document.querySelector('.mk-burbuja-valor').textContent,
        visible: document.querySelector('.mk-cruz').getAttribute('visibility') }));
      assert.deepEqual(cruz, { fecha: modelo.fechaCorta(g1m.puntos[0].fecha), valor: modelo.millones(g1m.puntos[0].valor), visible: 'visible' });
      await pagina.mouse.move(0, 0);
      await pagina.waitForSelector('.mk-burbuja[hidden]', { state: 'attached' });
      // Con el teclado: Tab hasta el gráfico (con foco visible) y las flechas recorren los días.
      await pagina.focus('[data-pestana="1a"]');
      await pagina.keyboard.press('Tab');
      const foco = await pagina.evaluate(() => ({ rol: document.activeElement.getAttribute('role'), contorno: getComputedStyle(document.activeElement).outlineStyle }));
      assert.deepEqual(foco, { rol: 'slider', contorno: 'solid' });
      await pagina.keyboard.press('ArrowLeft');
      await pagina.keyboard.press('ArrowLeft');
      const n = g1m.puntos.length;
      assert.equal(await pagina.getAttribute('.mk-graf', 'aria-valuenow'), String(n - 3));
      assert.equal(await pagina.getAttribute('.mk-graf', 'aria-valuetext'), `${modelo.fechaCorta(g1m.puntos[n - 3].fecha)}: ${modelo.millonesHablados(g1m.puntos[n - 3].valor)}`);
      await pagina.keyboard.press('Home');
      assert.equal(await pagina.getAttribute('.mk-graf', 'aria-valuenow'), '0');
      // En inglés: textos y cifras en su formato.
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await pagina.waitForFunction(() => document.querySelector('h1').textContent === 'Tokenised asset market');
      const en = await pagina.evaluate(() => ({ cifra: document.querySelector('.mk-cifra-num').textContent, periodo: document.querySelector('.mk-periodo').textContent,
        pestanas: [...document.querySelectorAll('.mk-pestana')].map(b => b.textContent), clave: document.querySelector('.mk-clave dt').textContent }));
      assert.deepEqual(en, { cifra: '$49,684M', periodo: 'past month', pestanas: ['1W', '1M', '3M', '6M', 'YTD', '1Y'], clave: 'Total value today' });
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
      await pagina.close();
    }
    // CoinGecko da 429: la última foto guardada, con su aviso y su fecha; el gráfico sigue con la serie.
    const local2 = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder: async (url) =>
      (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
    try {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.goto(local2.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-mercado-estado="foto-guardada+serie"]', { timeout: 20000 });
      assert.match(await pagina.textContent('#tokenizacion .mk-aviso'), /Cifra de la última foto diaria de RWAdar, del 10\/11\/2026, 15:25 UTC/);
      assert.equal(await pagina.locator('#tokenizacion .mk-svg').count(), 1);
      // Sin la serie: la cifra de hoy sigue y el gráfico lo dice.
      await pagina.route('**/datos/tokenizacion-serie.json', r => r.abort());
      await pagina.reload({ waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-mercado-estado="foto-guardada"]', { timeout: 20000 });
      assert.match(await pagina.textContent('#mkCuerpo'), /El gráfico no está disponible ahora\. La cifra de hoy sí\./);
      assert.equal(await pagina.textContent('.mk-cifra-num'), '49.684 M$');
      // Sin servidor, sin histórico y sin serie: estado vacío honesto, sin una sola cifra.
      await pagina.route('**/api/tokenizacion', r => r.abort());
      await pagina.route('**/datos/tokenizacion-historico.json', r => r.abort());
      await pagina.reload({ waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-mercado-estado="sin-datos"]', { timeout: 20000 });
      const vacio = await pagina.textContent('#mkCuerpo');
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
