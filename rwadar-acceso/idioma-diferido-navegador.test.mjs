/* El diccionario inglés solo para quien lo usa (limpieza de la web, 13/11/2026).
   En Chromium, sobre la web construida (rwadar-publicado/, con huellas) y el
   worker local, en el móvil (390 × 844) y en escritorio (1366 × 900):
   - En castellano no se pide ningún diccionario inglés (antes, 226 kB en cada
     página) y el motor y el selector «Español / English» siguen ahí.
   - Con «en» guardado, la página entra en inglés como antes: los diccionarios
     (en Inicio, el común y el de la campana) se ejecutan antes que el motor y,
     al llegar DOMContentLoaded, ya está traducida (lang="en"); sin parpadeo
     en castellano que no hubiera antes. También /#explain dentro de la app.
   - En castellano, al pulsar «English» se pide el diccionario una sola vez, la
     página se traduce en el sitio (sin recargar) y la preferencia se guarda;
     al volver a castellano y otra vez a inglés no se vuelve a pedir.
   - Sin red para el diccionario, el cambio no rompe nada y lo reintenta.
   Sin red exterior: todo lo que no es de 127.0.0.1 se corta. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUBLICADO = path.join(RAIZ, 'rwadar-publicado');
const INGLES = { ...require(path.join(RAIZ, 'rwadar-site', 'assets', 'idioma-en-20261022.js')),
  ...require(path.join(RAIZ, 'rwadar-site', 'assets', 'idioma-en-avisos-20261112.js')) };

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';
const construida = fs.existsSync(path.join(PUBLICADO, 'index.html'));

const VISTAS = [
  ['móvil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['escritorio', { viewport: { width: 1366, height: 900 } }],
];
const RUTAS = ['/', '/mercado/', '/plataformas/archax', '/academy/'];
const esDiccionario = ruta => /^\/assets\/idioma-en-/.test(ruta);
const esMotor = ruta => /^\/assets\/idioma-20261022\.[0-9a-f]{12}\.js$/.test(ruta);

/* Antes de cualquier script de la página: apunta en qué orden se ejecutan los
   diccionarios y el motor, y cómo está la página al llegar DOMContentLoaded. */
const ESPIA = () => {
  const orden = [];
  globalThis.__ordenIdioma = orden;
  new MutationObserver(cambios => {
    for (const c of cambios) for (const n of c.addedNodes) {
      if (n.tagName === 'SCRIPT' && /\/assets\/idioma(?:-en)?-/.test(n.src || '')) {
        n.addEventListener('load', () => orden.push(new URL(n.src).pathname), { once: true });
      }
    }
  }).observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => {
    const textos = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.trim(); if (t) textos.push(t); }
    globalThis.__alCargar = { lang: document.documentElement.lang, texto: textos.join('\n') };
  }, { once: true });
};

async function abrir(navegador, base, opciones, ruta, { ingles = false, app = false, bloquearDiccionario = false } = {}) {
  const contexto = await navegador.newContext({ ...opciones, reducedMotion: 'reduce', locale: 'es-ES', serviceWorkers: 'block' });
  await contexto.addInitScript(({ ingles, app }) => {
    try {
      localStorage.setItem('rwadar.novedades.vista', '9999-12-31');
      if (ingles) localStorage.setItem('rwadar.idioma', 'en');
    } catch { /* sin almacenamiento */ }
    if (app) window.ReactNativeWebView = { postMessage() {} };
  }, { ingles, app });
  await contexto.addInitScript(ESPIA);
  const pagina = await contexto.newPage();
  const pedidas = [], errores = [];
  const control = { bloquearDiccionario };
  pagina.on('pageerror', e => errores.push(String(e && e.message || e)));
  await pagina.route('**/*', ruta => {
    const url = new URL(ruta.request().url());
    if (url.origin !== base) return ruta.abort();
    if (control.bloquearDiccionario && esDiccionario(url.pathname)) return ruta.abort();
    return ruta.continue();
  });
  pagina.on('request', r => { const url = new URL(r.url()); if (url.origin === base) pedidas.push(url.pathname); });
  await pagina.goto(base + ruta, { waitUntil: 'load' });
  return { contexto, pagina, pedidas, errores, control };
}

/* Los textos de la página (cada nodo de texto, como los traduce idioma-web). */
const TEXTOS = selector => {
  const raiz = document.querySelector(selector), textos = [];
  if (!raiz) return '';
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  // Lo que idioma-web no traduce a propósito: el selector, los datos de la fuente y el código.
  const fuera = 'script,style,code,pre,textarea,[contenteditable],[translate="no"],[data-idioma-control],[data-idioma-fuente]';
  for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.trim(); if (t && !n.parentElement.closest(fuera)) textos.push(t); }
  return textos.join('\n');
};
/* Líneas de la página en castellano que el diccionario traduce (para saber qué buscar en inglés). */
const lineasTraducibles = texto => [...new Set(texto.split('\n').map(l => l.trim()).filter(l => typeof INGLES[l] === 'string' && INGLES[l] !== l))];

test('en castellano no se descarga el diccionario inglés; con «en» guardado se carga antes del motor y la página entra ya en inglés', { skip: sinNavegador || (!construida && 'falta rwadar-publicado/: npm run test:web') }, async () => {
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [vista, opciones] of VISTAS) {
      for (const ruta of RUTAS) {
        const es = await abrir(navegador, local.url, opciones, ruta);
        await es.pagina.waitForFunction(() => document.querySelector('[data-elegir-idioma="en"]'));
        const enCastellano = await es.pagina.evaluate(() => ({
          lang: document.documentElement.lang, idioma: globalThis.RWAdarIdioma && RWAdarIdioma.obtenerIdioma(),
        }));
        const textoEs = await es.pagina.evaluate(TEXTOS, 'body');
        const lineas = lineasTraducibles(textoEs).slice(0, 6);
        assert.deepEqual(es.pedidas.filter(esDiccionario), [], `${vista} ${ruta}: en castellano no se pide ningún diccionario inglés`);
        assert.equal(es.pedidas.filter(esMotor).length, 1, `${vista} ${ruta}: el motor se carga una vez`);
        assert.equal(enCastellano.lang, 'es'); assert.equal(enCastellano.idioma, 'es');
        assert.ok(lineas.length >= 2, `${vista} ${ruta}: hay textos que traducir (${lineas.length})`);
        assert.deepEqual(es.errores, [], `${vista} ${ruta}: sin errores en castellano`);
        await es.contexto.close();

        const en = await abrir(navegador, local.url, opciones, ruta, { ingles: true });
        await en.pagina.waitForFunction(() => document.documentElement.lang === 'en' && !document.documentElement.classList.contains('idioma-previo'));
        const enIngles = await en.pagina.evaluate(() => ({ orden: globalThis.__ordenIdioma, alCargar: globalThis.__alCargar }));
        const diccionarios = en.pedidas.filter(esDiccionario);
        assert.equal(diccionarios.length, ruta === '/' ? 2 : 1, `${vista} ${ruta}: se piden los diccionarios que lleva la página (${diccionarios.join(', ')})`);
        if (ruta === '/') assert.ok(/idioma-en-20261022/.test(diccionarios[0]) && /idioma-en-avisos-20261112/.test(diccionarios[1]), 'Inicio: el común y después el de la campana');
        const iMotor = enIngles.orden.findIndex(esMotor);
        assert.ok(iMotor > 0 && enIngles.orden.slice(0, iMotor).filter(esDiccionario).length === diccionarios.length,
          `${vista} ${ruta}: los diccionarios se ejecutan antes que el motor (${enIngles.orden.join(' → ')})`);
        assert.equal(en.pedidas.filter(esMotor).length, 1, `${vista} ${ruta}: con «en» guardado el motor no se repite`);
        assert.equal(enIngles.alCargar.lang, 'en', `${vista} ${ruta}: al llegar DOMContentLoaded ya está en inglés`);
        for (const linea of lineas) {
          assert.ok(enIngles.alCargar.texto.includes(INGLES[linea]), `${vista} ${ruta}: «${linea}» ya sale como «${INGLES[linea]}» al cargar`);
        }
        assert.deepEqual(en.errores, [], `${vista} ${ruta}: sin errores en inglés`);
        await en.contexto.close();
      }
    }
  } finally { await navegador.close(); await local.cerrar(); }
});

test('en castellano, «English» carga el diccionario una vez y traduce en el sitio; la preferencia vale para la siguiente visita', { skip: sinNavegador || (!construida && 'falta rwadar-publicado/: npm run test:web') }, async () => {
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [vista, opciones] of VISTAS) {
      for (const ruta of ['/', '/plataformas/archax']) {
        const s = await abrir(navegador, local.url, opciones, ruta);
        await s.pagina.waitForFunction(() => document.querySelector('[data-elegir-idioma="en"]'));
        const lineas = lineasTraducibles(await s.pagina.evaluate(TEXTOS, 'body')).slice(0, 6);
        await s.pagina.evaluate(() => { globalThis.__marcaSinRecargar = 1; window.scrollTo(0, 300); });
        const y = await s.pagina.evaluate(() => window.scrollY);
        await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
        await s.pagina.waitForFunction(() => document.documentElement.lang === 'en');
        const tras = await s.pagina.evaluate(() => ({ marca: globalThis.__marcaSinRecargar, y: window.scrollY,
          guardado: localStorage.getItem('rwadar.idioma'), pulsado: document.querySelector('[data-elegir-idioma="en"]').getAttribute('aria-pressed') }));
        assert.equal(tras.marca, 1, `${vista} ${ruta}: traduce sin recargar la página`);
        assert.equal(tras.guardado, 'en'); assert.equal(tras.pulsado, 'true');
        assert.equal(tras.y, y, `${vista} ${ruta}: conserva la posición`);
        tras.texto = await s.pagina.evaluate(TEXTOS, 'body');
        for (const linea of lineas) assert.ok(tras.texto.includes(INGLES[linea]), `${vista} ${ruta}: «${linea}» pasa a «${INGLES[linea]}»`);
        const pedidosTrasIngles = s.pedidas.filter(esDiccionario).length;
        assert.equal(pedidosTrasIngles, ruta === '/' ? 2 : 1, `${vista} ${ruta}: se pide el diccionario al elegir inglés`);
        // Y vuelta: castellano y otra vez inglés, sin volver a pedirlo.
        await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
        await s.pagina.waitForFunction(() => document.documentElement.lang === 'es');
        const vuelta = await s.pagina.evaluate(TEXTOS, 'body');
        for (const linea of lineas.slice(0, 2)) assert.ok(vuelta.includes(linea), `${vista} ${ruta}: vuelve «${linea}»`);
        await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
        await s.pagina.waitForFunction(() => document.documentElement.lang === 'en');
        assert.equal(s.pedidas.filter(esDiccionario).length, pedidosTrasIngles, `${vista} ${ruta}: no se vuelve a pedir`);
        // La siguiente visita entra ya en inglés.
        await s.pagina.reload({ waitUntil: 'load' });
        await s.pagina.waitForFunction(() => document.documentElement.lang === 'en' && !document.documentElement.classList.contains('idioma-previo'));
        assert.equal((await s.pagina.evaluate(() => globalThis.__alCargar)).lang, 'en', `${vista} ${ruta}: al recargar, en inglés desde DOMContentLoaded`);
        assert.deepEqual(s.errores, [], `${vista} ${ruta}: sin errores`);
        await s.contexto.close();
      }
    }
  } finally { await navegador.close(); await local.cerrar(); }
});

test('sin red para el diccionario, «English» no rompe la página y lo vuelve a intentar', { skip: sinNavegador || (!construida && 'falta rwadar-publicado/: npm run test:web') }, async () => {
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    const s = await abrir(navegador, local.url, VISTAS[0][1], '/plataformas/archax', { bloquearDiccionario: true });
    await s.pagina.waitForFunction(() => document.querySelector('[data-elegir-idioma="en"]'));
    await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
    await s.pagina.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await s.pagina.evaluate(() => RWAdarIdioma.traducir('Inicio')), 'Inicio', 'sin diccionario, los textos se quedan en castellano');
    assert.deepEqual(s.errores, [], 'sin errores');
    s.control.bloquearDiccionario = false;
    await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
    await s.pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
    await s.pagina.waitForFunction(() => RWAdarIdioma.traducir('Inicio') !== 'Inicio');
    assert.equal(await s.pagina.evaluate(() => RWAdarIdioma.traducir('Inicio')), INGLES.Inicio, 'con red, lo carga al volver a elegir inglés');
    await s.contexto.close();
  } finally { await navegador.close(); await local.cerrar(); }
});

test('/#explain dentro de la app entra en inglés si esa es la preferencia', { skip: sinNavegador || (!construida && 'falta rwadar-publicado/: npm run test:web') }, async () => {
  const local = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    const es = await abrir(navegador, local.url, VISTAS[0][1], '/#explain', { app: true });
    const lineas = lineasTraducibles(await es.pagina.evaluate(TEXTOS, '#explain')).slice(0, 4);
    assert.ok(lineas.length >= 2, `el tutorial tiene textos que traducir (${lineas.length})`);
    await es.contexto.close();
    const en = await abrir(navegador, local.url, VISTAS[0][1], '/#explain', { app: true, ingles: true });
    await en.pagina.waitForFunction(() => document.documentElement.lang === 'en');
    const texto = await en.pagina.evaluate(TEXTOS, '#explain');
    for (const linea of lineas) assert.ok(texto.includes(INGLES[linea]), `«${linea}» sale como «${INGLES[linea]}»`);
    assert.deepEqual(en.errores, []);
    await en.contexto.close();
  } finally { await navegador.close(); await local.cerrar(); }
});
