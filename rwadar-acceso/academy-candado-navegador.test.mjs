// Candado de las lecciones en la web (petición de Víctor del 08/11/2026): «que
// esté bloqueado Academy, que solo se desbloquee al crearse la cuenta, que salga
// difuminada la página con un candado y que al registrarse y entrar se
// desbloquee». El índice /academy/ y el bloque de lecciones de la portada nacen
// BLOQUEADOS en el HTML; solo una sesión confirmada por /api/acceso/sesion los
// abre (assets/academy-candado-20261108.js, con la pasarela acceso-privado.js).
// La puerta de las lecciones sigue en el servidor (academy-cuenta.test.mjs).
//
// Tres partes: el HTML generado, el script en una VM con la pasarela de verdad
// (siempre) y Chromium con el worker local (solo si Playwright está instalado;
// en CI no lo está y esa parte se omite).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SITIO = path.join(RAIZ, 'rwadar-site');
const PUBLICADO = path.join(RAIZ, 'rwadar-publicado');
const academyMod = require('../rwadar-academy.js');
const { ingles } = require('../rwadar-movil/lib/idioma.js');
const { ARCHIVOS_PUBLICABLES } = require('../rwadar-publicacion-segura.js');
const lee = relativa => fs.readFileSync(path.join(SITIO, ...relativa.split('/')), 'utf8');
const bridge = lee('assets/acceso-privado.js');
const candadoJS = lee('assets/academy-candado-20261108.js');
const candadoCSS = lee('assets/academy-candado-20261108.css');
const indice = lee('academy/index.html');
const portada = lee('index.html');
const bloquePortada = portada.slice(portada.indexOf('<!--academy:ini-->'), portada.indexOf('<!--academy:fin-->'));
const FALLO = 'No hemos podido comprobar tu sesión. Recarga la página.';
const TEXTOS = {
  'Las lecciones se abren con tu cuenta gratuita': 'Lessons open with your free account',
  'Es gratis: solo necesitas un correo y una contraseña.': "It's free: all you need is an email address and a password.",
  'Crear cuenta gratis': 'Create a free account',
  'Ya tengo cuenta: entrar': 'I already have an account: sign in',
  [FALLO]: "We couldn't check your session. Reload the page.",
};

// El candado de una página: el recuadro (fuera) y el contenido difuminado (dentro).
function partesCandado(html) {
  const ini = html.indexOf('<div class="candado" data-academy-candado data-estado="bloqueado">');
  assert.ok(ini > 0, 'el candado nace bloqueado en el HTML');
  const marcaContenido = '<div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">';
  const iniContenido = html.indexOf(marcaContenido, ini);
  assert.ok(iniContenido > ini, 'el contenido nace con inert y aria-hidden');
  return { caja: html.slice(ini, iniContenido), resto: html.slice(iniContenido), ini };
}

test('el índice y la portada nacen bloqueados: tarjetas difuminadas e inertes, y un recuadro con candado', () => {
  for (const [nombre, html, nivelTitulo] of [['academy/index.html', indice, 'h2'], ['index.html (bloque de lecciones)', bloquePortada, 'h4']]) {
    const { caja, resto, ini } = partesCandado(html);
    // Todas las lecciones van dentro del contenido bloqueado, ninguna en el recuadro ni antes.
    const lecciones = [...html.matchAll(/href="\/academy\/([a-z0-9-]+)"/g)].map(m => m[1]);
    assert.equal(lecciones.length, 9, nombre);
    assert.ok([...html.matchAll(/href="\/academy\/[a-z0-9-]+"/g)].every(m => m.index > ini + caja.length), nombre + ': ninguna lección fuera del bloqueo');
    assert.ok(lecciones.every(slug => resto.includes(`href="/academy/${slug}"`)), nombre);
    // El recuadro: candado SVG sin emoji, título, «es gratis», dos botones y la línea del fallo de red.
    assert.match(caja, /<svg class="candado-icono"[^>]*aria-hidden="true" focusable="false">/);
    assert.match(caja, new RegExp(`<${nivelTitulo} class="candado-tit" id="candado(?:Academy|Portada)Tit">Las lecciones se abren con tu cuenta gratuita</${nivelTitulo}>`));
    assert.match(caja, /<section class="candado-caja" aria-labelledby="candado(?:Academy|Portada)Tit">/);
    assert.ok(caja.includes('<p class="candado-txt">Es gratis: solo necesitas un correo y una contraseña.</p>'));
    assert.ok(caja.includes('<a class="candado-boton candado-boton-p" href="/acceso?volver=/academy/">Crear cuenta gratis</a>'));
    assert.ok(caja.includes('<a class="candado-boton candado-boton-s" href="/acceso?volver=/academy/&amp;vista=entrar">Ya tengo cuenta: entrar</a>'));
    assert.ok(caja.includes('<p class="candado-error" data-academy-candado-error role="status"></p>'), 'la línea del fallo nace vacía');
    // El recuadro no es inerte ni se oculta al lector: es lo único que oye del bloque.
    assert.ok(!/\sinert[\s>]/.test(caja) && !/<(?:div|section|p|h\d)[^>]*aria-hidden/.test(caja));
    assert.doesNotMatch(caja, /[\u{1F300}-\u{1FAFF}]/u, 'sin emojis');
    // Y el contenido bloqueado se cierra antes de que acabe el bloque.
    assert.equal((resto.match(/data-academy-candado-contenido/g) || []).length, 1);
  }
  assert.equal(academyMod.ALTA_ACADEMY, '/acceso?volver=/academy/');
  assert.equal(academyMod.ENTRAR_ACADEMY, '/acceso?volver=/academy/&vista=entrar');
  // El tutorial 3D sigue nítido y público: fuera del candado en las dos páginas.
  assert.ok(indice.indexOf('Empezar tutorial 3D') < partesCandado(indice).ini);
  assert.ok(portada.indexOf('Empezar tutorial 3D') < portada.indexOf('data-academy-candado'));
  assert.equal((portada.match(/data-academy-candado /g) || []).length, 1, 'un solo candado en la portada: el de las lecciones');
});

test('las dos páginas cargan la misma hoja y el mismo script del candado, publicables y con huella', () => {
  for (const html of [indice, portada]) {
    assert.equal((html.match(/<link rel="stylesheet" href="\/assets\/academy-candado-20261108\.css">/g) || []).length, 1);
    assert.equal((html.match(/<script src="\/assets\/academy-candado-20261108\.js" defer><\/script>/g) || []).length, 1);
  }
  // En la portada, después de la pasarela de sesión y antes del snapshot del catálogo.
  assert.ok(portada.indexOf('/assets/acceso-privado.js') < portada.indexOf('/assets/academy-candado-20261108.js'));
  assert.ok(portada.indexOf('/assets/academy-candado-20261108.js') < portada.indexOf('/assets/catalogo-publico-20261022.js'));
  assert.ok(ARCHIVOS_PUBLICABLES.includes('assets/academy-candado-20261108.css'));
  assert.ok(ARCHIVOS_PUBLICABLES.includes('assets/academy-candado-20261108.js'));
  // Las lecciones no lo cargan: allí la puerta es del servidor.
  const leccion = lee('academy/que-significa-tokenizar-un-activo.html');
  assert.ok(!leccion.includes('academy-candado') && !leccion.includes('data-academy-candado'));
  assert.equal(academyMod.CANDADO_CSS, '/assets/academy-candado-20261108.css');
  assert.equal(academyMod.CANDADO_JS, '/assets/academy-candado-20261108.js');
});

test('con "acceso": "publico" no hay candado en ninguna de las dos páginas', () => {
  const academy = academyMod.cargarAcademy();
  const salidas = academyMod.construirSalidas({ ...academy, acceso: 'publico' });
  for (const nombre of ['academy/index.html', 'index.html']) {
    const html = salidas.get(path.join(SITIO, ...nombre.split('/')));
    assert.ok(!html.includes('data-academy-candado') && !html.includes('candado-contenido'), nombre);
  }
  assert.ok(!salidas.get(path.join(SITIO, 'academy', 'index.html')).includes('academy-candado-20261108'));
});

test('el difuminado solo se aplica bloqueado, respeta el movimiento reducido y no usa estilos en línea', () => {
  assert.match(candadoCSS, /\.candado\[data-estado="bloqueado"\] \.candado-contenido\{filter:blur\(7px\);opacity:\.5;pointer-events:none;\s*user-select:none/);
  assert.match(candadoCSS, /\.candado\[data-estado="abierto"\] \.candado-contenido\{filter:none;opacity:1\}/);
  assert.match(candadoCSS, /@media \(prefers-reduced-motion:reduce\)\{\s*\.candado-contenido,\.candado \.candado-boton\{transition:none\}/);
  assert.match(candadoCSS, /\.candado-capa\[hidden\]\{display:none!important\}/);
  assert.match(candadoCSS, /--candado-verde:#25E39A/);
  for (const html of [indice, bloquePortada]) assert.doesNotMatch(partesCandado(html).caja, /\sstyle=|\son[a-z]+=|<style/i);
  // El script no lee cookies, no pinta HTML y no llama a la red por su cuenta: usa la pasarela.
  assert.doesNotMatch(candadoJS, /innerHTML|fetch\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage/);
  assert.match(candadoJS, /acceso\.verificar\(\)/);
});

test('los textos del candado tienen su inglés en el diccionario de la web y la app', () => {
  for (const [es, en] of Object.entries(TEXTOS)) assert.equal(ingles(es), en, es);
  assert.ok(candadoJS.includes(`const FALLO = '${FALLO}';`));
  const web = lee('assets/idioma-en-20261022.js');
  assert.equal(web, fs.readFileSync(path.join(RAIZ, 'rwadar-movil', 'lib', 'idioma-en.js'), 'utf8'), 'copia de la web al día');
});

/* ---- El script con la pasarela de verdad, en una VM ---- */
const tick = async (veces = 8) => { for (let i = 0; i < veces; i++) await new Promise(resolver => setImmediate(resolver)); };
function elemento(atributos = {}) {
  const attrs = new Map(Object.entries(atributos));
  return { hidden: false, textContent: '', attrs,
    getAttribute: n => attrs.has(n) ? attrs.get(n) : null, hasAttribute: n => attrs.has(n),
    setAttribute(n, v) { attrs.set(n, String(v)); }, removeAttribute(n) { attrs.delete(n); } };
}
function candadoFalso() {
  const raiz = elemento({ 'data-academy-candado': '', 'data-estado': 'bloqueado' });
  const contenido = elemento({ 'data-academy-candado-contenido': '', inert: '', 'aria-hidden': 'true' });
  const capa = elemento({ 'data-academy-candado-capa': '' });
  const linea = elemento({ 'data-academy-candado-error': '', role: 'status' });
  raiz.querySelector = sel => ({ '[data-academy-candado-contenido]': contenido, '[data-academy-candado-capa]': capa,
    '[data-academy-candado-error]': linea })[sel] || null;
  const estado = () => ({ estado: raiz.getAttribute('data-estado'), inert: contenido.hasAttribute('inert'),
    ariaHidden: contenido.getAttribute('aria-hidden'), capaOculta: capa.hidden, linea: linea.textContent });
  return { raiz, estado };
}
const BLOQUEADO = { estado: 'bloqueado', inert: true, ariaHidden: 'true', capaOculta: false, linea: '' };
const ABIERTO = { estado: 'abierto', inert: false, ariaHidden: null, capaOculta: true, linea: '' };
const SESION = { autenticada: true, usuario: { id: '11111111-1111-4111-8111-111111111111', correo: 'qa@ejemplo.test' } };

// respuestas: una función por llamada a /api/acceso/sesion (la última se repite).
function pagina({ respuestas = [() => Response.json(SESION)], conPasarela = true, webView = false, pathname = '/academy/', hash = '' } = {}) {
  const llamadas = [], eventos = new Map();
  const candados = [candadoFalso(), candadoFalso()];
  const window = { addEventListener: (tipo, fn) => eventos.set(tipo, [...(eventos.get(tipo) || []), fn]) };
  if (webView) window.ReactNativeWebView = { postMessage() {} };
  const context = vm.createContext({ window, URLSearchParams,
    document: { querySelectorAll: sel => sel === '[data-academy-candado]' ? candados.map(c => c.raiz) : [],
      addEventListener() {}, visibilityState: 'visible', documentElement: { replaceChildren() {} } },
    location: { pathname, hash, search: '', replace() {}, assign() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setInterval() {},
    fetch: async (ruta, opciones) => {
      llamadas.push({ ruta, opciones });
      assert.equal(ruta, '/api/acceso/sesion');
      const respuesta = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
      return respuesta();
    } });
  if (conPasarela) vm.runInContext(bridge, context);
  vm.runInContext(candadoJS, context);
  return { llamadas, estados: () => candados.map(c => c.estado()),
    pageshow: persisted => (eventos.get('pageshow') || []).forEach(fn => fn({ persisted })) };
}

test('con una sesión válida se abre: sin inert, sin aria-hidden, sin capa y nítido', async () => {
  const p = pagina();
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO], 'antes de la respuesta, bloqueado');
  await tick();
  assert.deepEqual(p.estados(), [ABIERTO, ABIERTO]);
  // La pasarela y el candado comparten una sola pregunta al servidor.
  assert.equal(p.llamadas.length, 1);
  assert.equal(p.llamadas[0].opciones.credentials, 'same-origin');
  assert.equal(p.llamadas[0].opciones.cache, 'no-store');
});

test('sin sesión (401/403) o con una respuesta que no es una sesión válida, sigue bloqueado y sin aviso', async () => {
  for (const respuesta of [
    () => Response.json({ error: 'sesion_necesaria' }, { status: 401 }),
    () => Response.json({ error: 'origen_no_permitido' }, { status: 403 }),
    () => Response.json({ autenticada: false }),
    () => Response.json({ autenticada: true, usuario: { id: '' } }),
    () => Response.json({ autenticada: 'true', usuario: { id: 'x' } }),
    () => new Response('<html>no es JSON</html>', { status: 200 }),
  ]) {
    const p = pagina({ respuestas: [respuesta] });
    await tick();
    assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO], String(respuesta));
  }
});

test('si la red o el servicio fallan, sigue bloqueado y lo dice en una línea', async () => {
  for (const respuesta of [
    () => { throw new TypeError('Failed to fetch'); },
    () => Response.json({ error: 'servicio_no_disponible' }, { status: 503 }),
    () => Response.json({ error: 'intentos_excedidos' }, { status: 429 }),
    () => new Response('', { status: 500 }),
  ]) {
    const p = pagina({ respuestas: [respuesta] });
    await tick();
    assert.deepEqual(p.estados(), [{ ...BLOQUEADO, linea: FALLO }, { ...BLOQUEADO, linea: FALLO }], String(respuesta));
  }
});

test('sin la pasarela de sesión no pregunta a nadie y sigue bloqueado', async () => {
  const p = pagina({ conPasarela: false });
  await tick();
  assert.equal(p.llamadas.length, 0);
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
});

test('dentro del tutorial 3D de la app (WebView en /#explain) no se pregunta por la sesión', async () => {
  const p = pagina({ webView: true, pathname: '/', hash: '#explain' });
  await tick();
  p.pageshow(true);
  await tick();
  assert.equal(p.llamadas.length, 0);
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
});

test('al volver con «Atrás» desde /acceso ya con sesión, vuelve a preguntar y se abre', async () => {
  const p = pagina({ respuestas: [() => Response.json({ error: 'sesion_necesaria' }, { status: 401 }), () => Response.json(SESION)] });
  await tick();
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
  p.pageshow(false);
  await tick();
  assert.equal(p.llamadas.length, 1, 'una carga normal no repite la pregunta');
  p.pageshow(true);
  await tick();
  assert.deepEqual(p.estados(), [ABIERTO, ABIERTO]);
  // Un fallo de red anterior se borra al abrirse.
  const q = pagina({ respuestas: [() => { throw new TypeError('offline'); }, () => Response.json(SESION)] });
  await tick();
  assert.equal(q.estados()[0].linea, FALLO);
  q.pageshow(true);
  await tick();
  assert.deepEqual(q.estados(), [ABIERTO, ABIERTO]);
});

/* ---- Chromium con el worker local (rwadar-publicado/, Auth simulado) ---- */
function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

test('en Chromium: bloqueado sin sesión, sin JS y con la red caída; abierto con sesión; y entrar desde el candado lo abre', { skip: sinNavegador, timeout: 180000 }, async () => {
  assert.ok(fs.existsSync(path.join(PUBLICADO, '_worker.js')) && fs.existsSync(path.join(PUBLICADO, 'academy', 'index.html')),
    'Falta rwadar-publicado/: ejecuta antes npm run test:web (o node rwadar-publicar.js --local --sin-sincronizar).');
  const { arrancarWorkerLocal, CORREO_PRUEBA, CLAVE_PRUEBA } = await import('./probar-worker-local.mjs');
  const sin = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const con = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0, conSesion: true });
  let browser;
  try {
    browser = await playwright.chromium.launch();
    async function abrir(base, ruta, { javaScriptEnabled = true, red = null, ancho = 390, local = false } = {}) {
      const contexto = await browser.newContext({ javaScriptEnabled, viewport: { width: ancho, height: 844 } });
      const page = await contexto.newPage();
      const violaciones = [];
      page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) violaciones.push(m.text()); });
      // Nada sale de la máquina (la analítica de Cloudflare, por ejemplo).
      await page.route(u => !/^http:\/\/(?:127\.0\.0\.1|localhost):/.test(u.href), r => r.abort());
      if (red === 'caida') await page.route('**/api/acceso/sesion', r => r.abort('internetdisconnected'));
      // La respuesta del servidor a la pregunta por la sesión (la de la pasarela y el candado).
      const sesion = javaScriptEnabled && red !== 'caida'
        ? page.waitForResponse(r => r.url().endsWith('/api/acceso/sesion'), { timeout: 15000 }).catch(() => null) : Promise.resolve(null);
      const url = (local ? base.url.replace('127.0.0.1', 'localhost') : base.url) + ruta;
      await page.goto(url, { waitUntil: 'load' });
      return { page, contexto, violaciones, sesion };
    }
    const estado = page => page.evaluate(() => [...document.querySelectorAll('[data-academy-candado]')].map(c => {
      const contenido = c.querySelector('[data-academy-candado-contenido]');
      const capa = c.querySelector('[data-academy-candado-capa]');
      const enlace = contenido.querySelector('a[href^="/academy/"]');
      enlace.focus();
      return { estado: c.dataset.estado, inert: contenido.inert, ariaHidden: contenido.getAttribute('aria-hidden'),
        difuminado: getComputedStyle(contenido).filter.includes('blur'), capaVisible: getComputedStyle(capa).display !== 'none',
        enfocable: document.activeElement === enlace, linea: c.querySelector('[data-academy-candado-error]').textContent };
    }));
    const esperarEstado = (page, valor) => page.waitForFunction(v => [...document.querySelectorAll('[data-academy-candado]')]
      .every(c => c.dataset.estado === v), valor, { timeout: 15000 });

    // Sin sesión: bloqueado tras la respuesta 401, con el lector oyendo solo el recuadro.
    {
      const { page, contexto, violaciones, sesion } = await abrir(sin, '/academy/');
      assert.equal((await sesion)?.status(), 401, 'el servidor dice «sin sesión»');
      await page.waitForTimeout(300);
      const [indiceEstado] = await estado(page);
      assert.deepEqual(indiceEstado, { estado: 'bloqueado', inert: true, ariaHidden: 'true', difuminado: true, capaVisible: true, enfocable: false, linea: '' });
      // Con el teclado no se llega a ninguna lección: el Tab recorre otros enlaces y ninguno de /academy/<lección>.
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      const enfocados = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        enfocados.push(await page.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.tagName));
      }
      assert.ok(enfocados.includes('/acceso?volver=/academy/') && enfocados.includes('/acceso?volver=/academy/&vista=entrar'), enfocados.join(' '));
      assert.ok(!enfocados.some(h => /^\/academy\/[a-z0-9-]+$/.test(h || '')), enfocados.join(' '));
      // Pulsar donde se ve una tarjeta (abajo de la pantalla, lejos del recuadro) no abre la lección.
      await page.evaluate(() => [...document.querySelectorAll('[data-academy-candado-contenido] a[href^="/academy/"]')].at(-1)
        .scrollIntoView({ block: 'end' }));
      await page.waitForTimeout(200);
      const caja = await page.locator('[data-academy-candado-contenido] a[href^="/academy/"]').last().boundingBox();
      await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height - 12);
      await page.waitForTimeout(400);
      assert.match(page.url(), /\/academy\/$/);
      const arbol = await page.locator('main').ariaSnapshot();
      assert.match(arbol, /Las lecciones se abren con tu cuenta gratuita/);
      assert.match(arbol, /link "Crear cuenta gratis"/);
      assert.doesNotMatch(arbol, /Quién es quién en una tokenización/, 'el lector no oye las tarjetas');
      assert.deepEqual(violaciones, []);
      await contexto.close();
    }
    // Sin JavaScript: igual de bloqueado (el HTML nace así).
    {
      const { page, contexto } = await abrir(sin, '/academy/', { javaScriptEnabled: false });
      const datos = await page.evaluate(() => {
        const c = document.querySelector('[data-academy-candado]'), contenido = c.querySelector('[data-academy-candado-contenido]');
        return { estado: c.dataset.estado, inert: contenido.inert, difuminado: getComputedStyle(contenido).filter.includes('blur'),
          capaVisible: getComputedStyle(c.querySelector('[data-academy-candado-capa]')).display !== 'none' };
      });
      // Playwright evalúa aunque la página tenga el JavaScript apagado: lo que se mide es el HTML y la hoja.
      assert.deepEqual(datos, { estado: 'bloqueado', inert: true, difuminado: true, capaVisible: true });
      const arbol = await page.locator('main').ariaSnapshot();
      assert.match(arbol, /Las lecciones se abren con tu cuenta gratuita/);
      assert.doesNotMatch(arbol, /Quién es quién en una tokenización/);
      await contexto.close();
    }
    // Red caída: bloqueado y la línea discreta.
    {
      const { page, contexto } = await abrir(sin, '/academy/', { red: 'caida' });
      await page.waitForFunction(() => document.querySelector('[data-academy-candado-error]').textContent !== '', null, { timeout: 15000 });
      const [indiceEstado] = await estado(page);
      assert.deepEqual(indiceEstado, { estado: 'bloqueado', inert: true, ariaHidden: 'true', difuminado: true, capaVisible: true, enfocable: false,
        linea: 'No hemos podido comprobar tu sesión. Recarga la página.' });
      await contexto.close();
    }
    // Con sesión: abierto, nítido y con las lecciones enfocables, en el índice y en la portada.
    for (const [ruta, ancho] of [['/academy/', 390], ['/academy/', 1280], ['/', 1280]]) {
      const { page, contexto, violaciones } = await abrir(con, ruta, { ancho });
      await esperarEstado(page, 'abierto');
      await page.waitForTimeout(450); // fin de la transición del difuminado
      for (const e of await estado(page)) {
        assert.deepEqual(e, { estado: 'abierto', inert: false, ariaHidden: null, difuminado: false, capaVisible: false, enfocable: true, linea: '' }, ruta);
      }
      assert.deepEqual(violaciones, [], ruta);
      // Sin desbordar a lo ancho en el móvil.
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), ruta + ' sin scroll horizontal');
      await contexto.close();
    }
    // En la portada sin sesión, el bloque de lecciones también sale bloqueado y el tutorial 3D, nítido.
    {
      const { page, contexto, sesion } = await abrir(sin, '/', { ancho: 1280 });
      assert.equal((await sesion)?.status(), 401);
      await page.waitForTimeout(300);
      const [bloque] = await estado(page);
      assert.equal(bloque.estado, 'bloqueado'); assert.equal(bloque.inert, true); assert.equal(bloque.difuminado, true);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.academia-destacada')).filter), 'none');
      await contexto.close();
    }
    // De principio a fin: «Ya tengo cuenta: entrar» → /acceso abierto en «Entrar» → vuelve a /academy/ abierto.
    // (localhost: Chromium solo guarda la cookie __Host- de la sesión en http si el origen es localhost.)
    {
      const { page, contexto, sesion } = await abrir(sin, '/academy/', { local: true, ancho: 1280 });
      assert.equal((await sesion)?.status(), 401);
      assert.equal((await estado(page))[0].estado, 'bloqueado');
      await page.getByRole('link', { name: 'Ya tengo cuenta: entrar' }).first().click();
      await page.waitForURL(/\/acceso\?volver=\/academy\/&vista=entrar$/);
      assert.equal(await page.locator('#enviar').textContent(), 'Entrar');
      assert.equal(await page.locator('#introduccion').textContent(), 'Las lecciones son gratis con cuenta. Si ya la tienes, entra.');
      assert.equal(await page.locator('#acciones [data-vista="registrar"]').isVisible(), true, '«Crear cuenta gratis» sigue a mano');
      assert.equal(await page.locator('#acciones [data-vista="entrar"]').isVisible(), false, 'no repite «Ya tengo cuenta»');
      await page.fill('#correo', CORREO_PRUEBA);
      await page.fill('#clave', CLAVE_PRUEBA);
      await page.click('#enviar');
      await page.waitForURL(/\/academy\/$/, { timeout: 15000 });
      await esperarEstado(page, 'abierto');
      const [tras] = await estado(page);
      assert.equal(tras.inert, false); assert.equal(tras.enfocable, true);
      // «Crear cuenta gratis» abre el alta con la misma vuelta.
      await contexto.close();
      const otra = await abrir(sin, '/academy/', { local: true, ancho: 390 });
      await otra.page.getByRole('link', { name: 'Crear cuenta gratis' }).first().click();
      await otra.page.waitForURL(/\/acceso\?volver=\/academy\/$/);
      assert.equal(await otra.page.locator('#enviar').textContent(), 'Crear cuenta gratis');
      await otra.contexto.close();
    }
  } finally {
    await browser?.close();
    await sin.cerrar();
    await con.cerrar();
  }
});
