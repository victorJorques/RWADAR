/* «Novedades de RWAdar» (12/11/2026), en Chromium a 390 × 844 y 1366 × 900,
   sobre el worker local con las fuentes de rwadar-site. Encargo:
   «que salga al abrir … un texto informativo muy fácil de leer con las
   novedades y si clickan que salga en detalle».
   - La ventana sale una vez, tras cargar: título, fecha, los puntos del
     resumen (icono y una línea) y «Ver en detalle» / «Entendido»; es un
     diálogo modal con nombre, el foco dentro (título, ×, Ver en detalle,
     Entendido) y Escape la cierra. Cerrada, no vuelve a salir.
   - «Ver en detalle» abre /novedades-rwadar/ con cada sección del archivo y
     el camino a Perfil › Avisos (/#perfil-avisos), también en inglés.
   - Espera si hay otro diálogo abierto; no sale con ?avisos=1, sin
     almacenamiento local, si deja leer pero no guardar, ni en navegadores
     automatizados (las demás pruebas de Chromium no la ven); aquí se simula
     un navegador normal. La decisión es del modelo (motivoSinVentana y
     estadoVentana) y probar-web la prueba también sin navegador, para CI.
   - Perfil (móvil) lleva el enlace «Novedades de RWAdar».
   Sin errores, sin desbordes y con contraste AA. Sin red. Con
   RWADAR_CAPTURAS=<carpeta> guarda además las capturas. */
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
const CAPTURAS = process.env.RWADAR_CAPTURAS || '';
const NOVEDADES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'rwadar-site', 'datos', 'novedades-producto.json'), 'utf8'));
const CLAVE = 'rwadar.novedades.vista';

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

/* Un navegador «normal»: Playwright marca navigator.webdriver y la ventana no sale con él. */
const COMO_PERSONA = () => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });

/* Contraste WCAG entre el color del texto y el primer fondo opaco de debajo. */
const CONTRASTE = `(sel) => {
  const n = document.querySelector(sel); if (!n) return null;
  const rgb = (c) => (c.match(/[\\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const color = rgb(getComputedStyle(n).color);
  let fondo = null;
  for (let x = n; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) { fondo = c; break; } }
  fondo = fondo || rgb(getComputedStyle(document.body).backgroundColor);
  const [a, b] = [lum(color), lum(fondo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}`;

/* Lo que se comprueba de la ventana abierta. */
const LEER_VENTANA = `() => {
  const d = document.getElementById('novedadesDialogo');
  if (!d) return null;
  const r = d.getBoundingClientRect(), tit = document.getElementById(d.getAttribute('aria-labelledby'));
  const fuera = [...d.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); }).length;
  const botones = [...d.querySelectorAll('.nov-acciones > *')].map(b => ({ texto: b.textContent.trim(), etiqueta: b.tagName, href: b.getAttribute('href'), alto: b.getBoundingClientRect().height }));
  return { abierta: d.open, modal: d.matches(':modal'), cuantas: document.querySelectorAll('#novedadesDialogo').length,
    titulo: tit && tit.textContent.trim(), fecha: d.querySelector('.nov-fecha')?.textContent.trim(), descrita: !!document.getElementById(d.getAttribute('aria-describedby')),
    puntos: [...d.querySelectorAll('.nov-punto')].map(p => ({ titulo: p.querySelector('.nov-punto-tit').textContent, texto: p.querySelector('.nov-punto-txt').textContent,
      icono: p.querySelectorAll('.nov-icono svg path').length, oculto: p.querySelector('.nov-icono').getAttribute('aria-hidden') })),
    botones, cerrar: d.querySelector('[data-nov-cerrar]')?.getAttribute('aria-label'), foco: d.contains(document.activeElement) ? (document.activeElement.dataset.novFoco || document.activeElement.id) : null,
    lang: d.lang, traducir: d.getAttribute('translate'), langTitulo: tit && tit.closest('[lang]').lang, deLaFuente: d.querySelectorAll('[data-idioma-fuente],[data-idioma-fuente-etiqueta]').length, dentro: r.left >= 0 && r.right <= innerWidth + 0.5 && r.top >= 0 && r.bottom <= innerHeight + 0.5,
    fuera, anchoDoc: document.documentElement.scrollWidth, anchoVentana: innerWidth, visto: localStorage.getItem('${CLAVE}') };
}`;

async function abrirInicio(pagina, url, { limpiar = true } = {}) {
  if (limpiar) await pagina.evaluate(c => { try { localStorage.removeItem(c); } catch {} }, CLAVE).catch(() => {});
  await pagina.goto(url, { waitUntil: 'load' });
}
async function esperarVentana(pagina) {
  await pagina.waitForSelector('#novedadesDialogo[open]', { timeout: 20000 });
  await pagina.waitForTimeout(150);
  return pagina.evaluate(`(${LEER_VENTANA})()`);
}
/* Que NO salga: la ventana espera ~0,9 s tras cargar y lee el archivo; 3,5 s bastan. */
async function noSale(pagina, motivo) {
  await pagina.waitForTimeout(3500);
  assert.equal(await pagina.locator('#novedadesDialogo').count(), 0, `no sale ${motivo}`);
}

test('en Chromium: la ventana de novedades sale una vez, «Entendido» y Escape la cierran, «Ver en detalle» abre /novedades-rwadar/ (390 y 1366)', { skip: sinNavegador, timeout: 300000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const movil = ancho < 768;
      const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto } });
      await contexto.addInitScript(COMO_PERSONA);
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      // En local no hay fotos de las noticias (404) ni sesión (401): solo cuentan los errores de la página.
      pagina.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });

      // 1 · Sale sola al abrir, una vez, con lo del archivo.
      await abrirInicio(pagina, local.url + '/', { limpiar: false });
      const v = await esperarVentana(pagina);
      assert.ok(v.abierta && v.modal, 'es un diálogo modal');
      assert.equal(v.cuantas, 1);
      assert.equal(v.titulo, NOVEDADES.titulo);
      assert.equal(v.fecha, '12 de noviembre de 2026');
      assert.ok(v.descrita, 'aria-describedby apunta a la lista de puntos');
      assert.deepEqual(v.puntos.map(p => [p.titulo, p.texto]), NOVEDADES.resumen.map(p => [p.titulo, p.texto]));
      assert.ok(v.puntos.length >= 4 && v.puntos.length <= 5, `${v.puntos.length} puntos`);
      assert.ok(v.puntos.every(p => p.icono > 0 && p.oculto === 'true'), 'cada punto lleva su icono, oculto al lector');
      assert.deepEqual(v.botones.map(b => [b.texto, b.etiqueta, b.href]), [['Ver en detalle', 'A', '/novedades-rwadar/'], ['Entendido', 'BUTTON', null]]);
      assert.ok(v.botones.every(b => b.alto >= 44), `botones de ${v.botones.map(b => b.alto).join(' y ')} px`);
      assert.equal(v.cerrar, 'Cerrar las novedades');
      assert.equal(v.foco, 'titulo', 'el foco empieza en el título');
      assert.equal(v.lang, 'es'); assert.equal(v.traducir, 'no'); assert.equal(v.langTitulo, 'es'); assert.equal(v.deLaFuente, 0);
      assert.ok(v.dentro, 'la ventana cabe en la pantalla');
      assert.equal(v.fuera, 0, 'nada se sale de la pantalla');
      assert.ok(v.anchoDoc <= v.anchoVentana, `sin desplazamiento horizontal (${v.anchoDoc} > ${v.anchoVentana})`);
      assert.equal(v.visto, null, 'abierta todavía no cuenta como vista');
      for (const sel of ['.nov-tit', '.nov-fecha', '.nov-punto-tit', '.nov-punto-txt', '.nov-ver', '.nov-entendido']) {
        const c = await pagina.evaluate(`(${CONTRASTE})(${JSON.stringify('#novedadesDialogo ' + sel)})`);
        assert.ok(c !== null && c >= 4.5, `${sel}: contraste ${c?.toFixed(2)} (AA pide 4,5)`);
      }
      if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, `ventana-${ancho}x${alto}.png`) });

      // Teclado: Tab recorre ×, Ver en detalle y Entendido, con foco visible, sin salir de la ventana.
      const recorrido = [];
      for (let i = 0; i < 3; i++) {
        await pagina.keyboard.press('Tab');
        recorrido.push(await pagina.evaluate(() => { const a = document.activeElement, s = getComputedStyle(a);
          return { foco: a.dataset.novFoco || a.id || a.tagName, dentro: !!a.closest('#novedadesDialogo'), visible: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }; }));
      }
      assert.deepEqual(recorrido.map(r => r.foco), ['cerrar', 'ver', 'entendido']);
      assert.ok(recorrido.every(r => r.dentro && r.visible), `foco visible y dentro: ${JSON.stringify(recorrido)}`);
      if (CAPTURAS && movil) await pagina.screenshot({ path: path.join(CAPTURAS, `ventana-foco-entendido-${ancho}x${alto}.png`) });

      // 2 · Escape la cierra y cuenta como vista: al recargar no vuelve.
      await pagina.keyboard.press('Escape');
      await pagina.waitForSelector('#novedadesDialogo', { state: 'detached', timeout: 5000 });
      assert.equal(await pagina.evaluate(c => localStorage.getItem(c), CLAVE), NOVEDADES.version);
      assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('nov-abierta')), false, 'la página vuelve a desplazarse');
      await abrirInicio(pagina, local.url + '/', { limpiar: false });
      await noSale(pagina, 'tras cerrarla con Escape');

      // 3 · «Entendido» la cierra y no vuelve a salir; una versión ya vista anterior no la tapa.
      await pagina.evaluate(c => localStorage.setItem(c, '2026-11-11'), CLAVE);
      await abrirInicio(pagina, local.url + '/', { limpiar: false });
      await esperarVentana(pagina);
      await pagina.click('#novedadesDialogo [data-nov-entendido]');
      await pagina.waitForSelector('#novedadesDialogo', { state: 'detached', timeout: 5000 });
      assert.equal(await pagina.evaluate(c => localStorage.getItem(c), CLAVE), NOVEDADES.version);
      // Se puede seguir usando Inicio (nada queda delante).
      if (movil) { await pagina.click('#movilTabMas'); await pagina.waitForTimeout(250); await pagina.click('#movilTabInicio'); }
      await abrirInicio(pagina, local.url + '/', { limpiar: false });
      await noSale(pagina, 'tras «Entendido»');
      if (CAPTURAS && movil) await pagina.screenshot({ path: path.join(CAPTURAS, `inicio-sin-ventana-${ancho}x${alto}.png`) });

      // 4 · Si hay otro diálogo abierto, espera a que se cierre.
      await pagina.evaluate(c => localStorage.removeItem(c), CLAVE);
      await pagina.goto(local.url + '/', { waitUntil: 'domcontentloaded' });
      await pagina.evaluate(() => { const d = document.createElement('dialog'); d.id = 'otroDialogo'; d.textContent = 'Otro diálogo'; document.body.append(d); d.showModal(); });
      await noSale(pagina, 'con otro diálogo abierto');
      await pagina.evaluate(() => document.getElementById('otroDialogo').close());
      await esperarVentana(pagina);
      await pagina.click('#novedadesDialogo [data-nov-cerrar]');
      await pagina.waitForSelector('#novedadesDialogo', { state: 'detached', timeout: 5000 });

      // 5 · «Ver en detalle»: la página con todo el detalle y el camino a Perfil › Avisos.
      await abrirInicio(pagina, local.url + '/');
      await esperarVentana(pagina);
      await Promise.all([pagina.waitForURL(u => new URL(u).pathname === '/novedades-rwadar/'), pagina.click('#novedadesDialogo [data-nov-ver]')]);
      await pagina.waitForSelector('[data-novedades-estado="listo"]', { timeout: 15000 });
      const d = await pagina.evaluate(() => {
        const main = document.querySelector('main[data-novedades-producto="detalle"]');
        const fuera = [...main.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); }).length;
        return { h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()), titulo: document.title, fecha: document.getElementById('novFecha').textContent.trim(),
          ocupada: main.getAttribute('aria-busy'), estado: document.getElementById('novEstado').hidden,
          resumen: [...document.querySelectorAll('#novResumen .nov-punto')].map(p => ({ texto: p.querySelector('.nov-punto-tit').textContent, href: p.querySelector('a')?.getAttribute('href') })),
          secciones: [...document.querySelectorAll('#novDetalle section.nov-sec')].map(s => ({ id: s.id, h2: s.querySelector('h2').textContent, etiquetada: s.getAttribute('aria-labelledby') === s.querySelector('h2').id,
            parrafos: [...s.querySelectorAll('.nov-sec-p')].map(p => p.textContent), pasos: [...s.querySelectorAll('.nov-pasos li')].map(p => p.textContent) })),
          avisos: [...document.querySelectorAll('a[href="/#perfil-avisos"]')].map(a => a.textContent.replace(/\s+/g, ' ').trim()),
          fuera, anchoDoc: document.documentElement.scrollWidth, anchoVentana: innerWidth, visto: localStorage.getItem('rwadar.novedades.vista') };
      });
      assert.deepEqual(d.h1, [NOVEDADES.titulo], 'un solo h1, el del archivo');
      assert.equal(d.titulo, 'Novedades de RWAdar · RWAdar');
      assert.equal(d.fecha, 'Novedades del 12 de noviembre de 2026');
      assert.equal(d.ocupada, 'false'); assert.ok(d.estado, 'sin «Cargando…»');
      assert.deepEqual(d.resumen.map(p => p.texto), NOVEDADES.resumen.map(p => p.titulo));
      assert.ok(d.resumen.every(p => p.href && p.href.startsWith('#')), 'cada punto lleva a su sección');
      assert.deepEqual(d.secciones.map(s => [s.id, s.h2, s.parrafos, s.pasos]), NOVEDADES.detalle.map(s => [s.id, s.titulo, s.parrafos, s.pasos]));
      assert.ok(d.secciones.every(s => s.etiquetada), 'cada sección se nombra con su h2');
      assert.deepEqual(d.avisos, ['Ir a Perfil › Avisos para activarlos →', 'Ir a Perfil › Avisos →']);
      assert.equal(d.fuera, 0, 'nada se sale de la pantalla');
      assert.ok(d.anchoDoc <= d.anchoVentana, `sin desplazamiento horizontal (${d.anchoDoc} > ${d.anchoVentana})`);
      assert.equal(d.visto, NOVEDADES.version, 'ver el detalle cuenta como visto');
      for (const sel of ['#novTit', '#novFecha', '.nov-punto-txt', '.nov-sec-tit', '.nov-sec-p', '.nov-pasos li', '.nov-ir-avisos', '.nov-cta-txt', '.nov-cta-boton']) {
        const c = await pagina.evaluate(`(${CONTRASTE})(${JSON.stringify(sel)})`);
        assert.ok(c !== null && c >= 4.5, `${sel}: contraste ${c?.toFixed(2)} (AA pide 4,5)`);
      }
      if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, `detalle-${ancho}x${alto}.png`), fullPage: true });

      // Un punto del resumen lleva a su sección; /novedades-rwadar/#<id> también al cargar.
      // (La web desplaza con suavidad: se espera a que la sección llegue arriba.)
      await pagina.click('#novResumen a[href="#sesion-30-dias"]');
      await pagina.waitForFunction(() => { const r = document.getElementById('sesion-30-dias').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight / 2; }, null, { timeout: 5000 });
      await pagina.goto('about:blank');  // si no, cambiar solo el ancla no vuelve a cargar la página
      await pagina.goto(local.url + '/novedades-rwadar/#contacto', { waitUntil: 'load' });
      await pagina.waitForSelector('[data-novedades-estado="listo"]');
      await pagina.waitForFunction(() => { const r = document.getElementById('contacto').getBoundingClientRect(); return document.activeElement.id === 'contacto' && r.top >= 0 && r.top < innerHeight / 2; }, null, { timeout: 5000 });

      // En inglés: el archivo en inglés, la interfaz de la página también.
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
      await pagina.waitForTimeout(400);
      const en = await pagina.evaluate(() => ({ h1: document.getElementById('novTit').textContent, lang: document.getElementById('novTit').lang, titulo: document.title,
        fecha: document.getElementById('novFecha').textContent.trim(), primera: document.querySelector('#novDetalle h2').textContent,
        pasos: document.querySelector('.nov-pasos-tit').textContent, cta: document.querySelector('.nov-cta-boton').textContent.replace(/\s+/g, ' ').trim() }));
      assert.deepEqual(en, { h1: NOVEDADES.en.titulo, lang: 'en', titulo: NOVEDADES.en.titulo + ' · RWAdar', fecha: 'News from 12 November 2026',
        primera: NOVEDADES.detalle[0].en.titulo, pasos: 'How to do it', cta: 'Go to Profile › Alerts →' });
      if (CAPTURAS && movil) await pagina.screenshot({ path: path.join(CAPTURAS, `detalle-en-${ancho}x${alto}.png`) });
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
      await pagina.waitForTimeout(300);

      // 6 · El camino a Perfil › Avisos: /#perfil-avisos se quita de la dirección y, en el móvil, abre Perfil en Avisos.
      await Promise.all([pagina.waitForURL(u => new URL(u).pathname === '/'), pagina.click('.nov-cta-boton')]);
      await pagina.waitForTimeout(600);
      const perfil = await pagina.evaluate(() => ({ hash: location.hash, pestana: document.getElementById('movilTabMas').getAttribute('aria-selected'),
        foco: document.activeElement && document.activeElement.id, panel: !document.getElementById('movilPanelMas').hidden }));
      assert.equal(perfil.hash, '', 'el ancla se quita de la dirección');
      if (movil) {
        assert.equal(perfil.pestana, 'true', 'abre la pestaña Perfil');
        assert.ok(perfil.panel, 'con el panel de Perfil a la vista');
        assert.equal(perfil.foco, 'perfilAvisosTit', 'y el foco en «Avisos»');
        if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, `perfil-avisos-${ancho}x${alto}.png`) });
        // Perfil lleva siempre el enlace «Novedades de RWAdar», para volver a verlas.
        const enlace = pagina.locator('#movilPanelMas a[data-novedades-producto-enlace="perfil"]');
        await enlace.scrollIntoViewIfNeeded();
        const e = await enlace.evaluate(a => ({ href: a.getAttribute('href'), texto: a.querySelector('b').textContent, sub: a.querySelector('small').textContent,
          alto: a.getBoundingClientRect().height, grupo: a.closest('section').querySelector('h3').textContent }));
        assert.deepEqual([e.href, e.texto, e.sub, e.grupo], ['/novedades-rwadar/', 'Novedades de RWAdar', 'Lo nuevo de la web y la app, explicado fácil', 'Novedades']);
        assert.ok(e.alto >= 44, `fila de ${e.alto} px`);
        if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, `perfil-enlace-${ancho}x${alto}.png`) });
        await Promise.all([pagina.waitForURL(u => new URL(u).pathname === '/novedades-rwadar/'), enlace.click()]);
        await pagina.waitForSelector('[data-novedades-estado="listo"]');
      } else {
        // En escritorio, Perfil es la cuenta: se pinta como abrirPerfil() y lleva el mismo enlace.
        const js = fs.readFileSync(path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js'), 'utf8');
        assert.match(js, /'<a class="perfil-manual perfil-novedades" href="\/novedades-rwadar\/" data-novedades-producto-enlace="cuenta">Novedades de RWAdar<\/a>'\+/);
        // Y el pie de la web, para quien no tiene cuenta.
        assert.equal(await pagina.locator('footer a[href="/novedades-rwadar/"]').textContent(), 'Novedades de RWAdar');
      }
      assert.deepEqual(errores, []);
      await contexto.close();
    }

    // En inglés (idioma guardado): la ventana sale con el inglés del archivo y su interfaz en inglés.
    {
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
      await contexto.addInitScript(COMO_PERSONA);
      await contexto.addInitScript(() => { try { if (!localStorage.getItem('rwadar.idioma')) localStorage.setItem('rwadar.idioma', 'en'); } catch {} });
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      const v = await esperarVentana(pagina);
      assert.equal(v.titulo, NOVEDADES.en.titulo);
      assert.equal(v.fecha, '12 November 2026');
      assert.equal(v.lang, 'en');
      assert.equal(v.langTitulo, 'en', 'el título va en inglés, no marcado como texto de una fuente');
      assert.equal(v.deLaFuente, 0, 'sin «Original source text»: es texto de RWAdar');
      assert.deepEqual(v.puntos.map(p => [p.titulo, p.texto]), NOVEDADES.resumen.map(p => [p.en.titulo, p.en.texto]));
      assert.deepEqual(v.botones.map(b => b.texto), ['See details', 'Got it']);
      assert.equal(v.cerrar, 'Close the news');
      assert.equal(v.fuera, 0, 'nada se sale de la pantalla en inglés');
      if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, 'ventana-en-390x844.png') });
      // Cambiar de idioma con la ventana abierta la repinta en castellano.
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
      await pagina.waitForTimeout(300);
      assert.equal(await pagina.textContent('#novedadesTit'), NOVEDADES.titulo);
      assert.deepEqual(errores, []);
      await contexto.close();
    }

    // 7 · No sale: con ?avisos=1 (abre la campana), sin almacenamiento local ni en un navegador automatizado.
    {
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
      await contexto.addInitScript(COMO_PERSONA);
      const pagina = await contexto.newPage();
      await pagina.goto(local.url + '/?avisos=1', { waitUntil: 'load' });
      await noSale(pagina, 'con ?avisos=1');
      await contexto.close();
    }
    {
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
      await contexto.addInitScript(COMO_PERSONA);
      await contexto.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('bloqueado'); }; });
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await noSale(pagina, 'si el navegador no deja leer lo visto');
      await contexto.close();
    }
    {
      // Deja leer pero no guardar (almacenamiento lleno, Safari privado antiguo): antes salía en cada carga.
      // Ahora se prueba a guardar antes de enseñarla, y no sale ni en la primera carga ni en la segunda.
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
      await contexto.addInitScript(COMO_PERSONA);
      await contexto.addInitScript(() => {
        const original = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
          if (String(k).startsWith('rwadar.novedades')) throw new DOMException('lleno', 'QuotaExceededError');
          return original.call(this, k, v);
        };
      });
      const pagina = await contexto.newPage();
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      for (const vez of [1, 2]) {
        await pagina.goto(local.url + '/', { waitUntil: 'load' });
        await noSale(pagina, `si el navegador no deja guardar lo visto (carga ${vez})`);
      }
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    {
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
      const pagina = await contexto.newPage();
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      assert.equal(await pagina.evaluate(() => navigator.webdriver), true);
      await noSale(pagina, 'en un navegador automatizado (las demás pruebas de Chromium)');
      await contexto.close();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
