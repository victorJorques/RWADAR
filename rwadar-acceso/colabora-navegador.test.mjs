/* «¿Quieres colaborar con nosotros?» (12/11/2026), en Chromium a 390 × 844
   y 1366 × 900, sobre el worker local con las fuentes de rwadar-site: el
   bloque es el último de Inicio (antes del pie legal) y de Perfil (antes de
   la nota final), con su h2, el enlace mailto:rwadares@gmail.com que dice el
   correo, foco visible, contraste AA, sin desbordes y en inglés. Sin red.
   Con RWADAR_CAPTURAS=<carpeta> guarda además las capturas. */
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

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

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

/* Lo que se comprueba de un bloque: dónde está, qué dice y cómo se ve. */
const LEER = `(donde) => {
  const s = document.querySelector('section.colabora[data-colabora="' + donde + '"]');
  if (!s) return null;
  const h = s.querySelector('h2'), a = s.querySelector('a.colabora-boton');
  const caja = s.getBoundingClientRect(), boton = a.getBoundingClientRect();
  const fuera = [...s.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); }).length;
  let siguiente = s.nextElementSibling; while (siguiente && siguiente.nodeName === 'TEMPLATE') siguiente = siguiente.nextElementSibling;
  const hermanos = [...s.parentElement.children].filter(n => n.matches('section,.ini-bloque,.movil-menu-grupo'));
  return { visible: caja.height > 0 && getComputedStyle(s).display !== 'none', titulo: h && h.textContent.trim(), etiquetadoPor: s.getAttribute('aria-labelledby') === h.id && !!h.id,
    texto: s.textContent.replace(/\\s+/g, ' ').trim(), href: a.getAttribute('href'), nombre: a.textContent.replace(/\\s+/g, ' ').trim(),
    alto: boton.height, fuera, ultimoBloque: hermanos[hermanos.length - 1] === s, siguiente: siguiente ? (siguiente.className || siguiente.nodeName) : null,
    anchoDoc: document.documentElement.scrollWidth, anchoVentana: innerWidth };
}`;

async function verBloque(pagina, donde, captura) {
  await pagina.locator(`section.colabora[data-colabora="${donde}"]`).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(250);
  const v = await pagina.evaluate(`(${LEER})(${JSON.stringify(donde)})`);
  assert.ok(v, `está el bloque de ${donde}`);
  assert.ok(v.visible, `${donde}: se ve`);
  assert.equal(v.titulo, '¿Quieres colaborar con nosotros?');
  assert.ok(v.etiquetadoPor, `${donde}: la sección se nombra con su h2`);
  assert.match(v.texto, /plataforma o un emisor, trabajas en el sector o quieres proponer una mejora/);
  assert.match(v.texto, /Colaborar no compra un puesto en el catálogo: las ofertas se eligen con criterios editoriales y RWAdar no recibe dinero de las inversiones\./);
  assert.equal(v.href, 'mailto:rwadares@gmail.com');
  assert.equal(v.nombre, 'Escríbenos: rwadares@gmail.com');
  assert.ok(v.alto >= 44, `${donde}: botón de ${v.alto} px`);
  assert.equal(v.fuera, 0, `${donde}: nada se sale de la pantalla`);
  assert.ok(v.anchoDoc <= v.anchoVentana, `${donde}: sin desplazamiento horizontal (${v.anchoDoc} > ${v.anchoVentana})`);
  assert.ok(v.ultimoBloque, `${donde}: es el último bloque`);
  for (const sel of [' h2', ' .ini-bloque-sub', ' .colabora-nota', ' .colabora-boton span']) {
    const c = await pagina.evaluate(`(${CONTRASTE})(${JSON.stringify(`section.colabora[data-colabora="${donde}"]${sel}`)})`);
    assert.ok(c !== null && c >= 4.5, `${donde}${sel}: contraste ${c?.toFixed(2)} (AA pide 4,5)`);
  }
  // Foco con el teclado: visible, de 2 px, en el enlace.
  await pagina.focus(`section.colabora[data-colabora="${donde}"] a.colabora-boton`);
  await pagina.keyboard.press('Shift+Tab'); await pagina.keyboard.press('Tab');
  const foco = await pagina.evaluate(() => { const a = document.activeElement, s = getComputedStyle(a); return { clase: a.className, outline: s.outlineStyle, ancho: parseFloat(s.outlineWidth) }; });
  assert.match(foco.clase, /colabora-boton/);
  assert.ok(foco.outline !== 'none' && foco.ancho >= 2, `${donde}: foco visible ${JSON.stringify(foco)}`);
  if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, captura) });
  await pagina.evaluate(() => document.activeElement.blur());
  return v;
}

test('en Chromium: «¿Quieres colaborar con nosotros?» al final de Inicio (390 y 1366) y de Perfil (390), con mailto, foco, contraste e inglés', { skip: sinNavegador, timeout: 180000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('section.colabora[data-colabora="inicio"]', { state: 'attached', timeout: 20000 });
      // Un solo bloque de cada, sin huecos sin rellenar.
      assert.equal(await pagina.locator('[data-colabora]:not(.colabora)').count(), 0);
      assert.equal(await pagina.locator('section.colabora').count(), 2);
      const movil = ancho < 768;
      if (movil) { await pagina.click('#movilTabInicio'); await pagina.waitForTimeout(300); }

      // Inicio: después de Aprende y justo antes del pie legal (en escritorio el pie no sale).
      const inicio = await verBloque(pagina, 'inicio', `inicio-final-${ancho}x${alto}.png`);
      assert.equal(inicio.siguiente, 'ini-pie');
      assert.equal(await pagina.evaluate(() => {
        const s = document.querySelector('section.colabora[data-colabora="inicio"]');
        return s.previousElementSibling && s.previousElementSibling.classList.contains('ini-aprende');
      }), true);

      if (movil) {
        // Perfil: el mismo bloque, antes de la nota final.
        await pagina.click('#movilTabMas'); await pagina.waitForTimeout(300);
        const perfil = await verBloque(pagina, 'perfil', `perfil-final-${ancho}x${alto}.png`);
        assert.equal(perfil.siguiente, 'movil-nota-final');
        await pagina.click('#movilTabInicio'); await pagina.waitForTimeout(300);
      }

      if (!movil) {
        // La cuenta de escritorio (#perfilPanel) solo se abre con sesión, y en local las cuentas
        // están apagadas: se pinta como abrirPerfil(), con su hueco al final, y se comprueba.
        await pagina.evaluate(() => {
          const c = document.getElementById('perfilCuerpo');
          c.innerHTML = '<div class="perfil-pie"><button id="pfSalir">Cerrar sesión</button></div><div data-colabora="cuenta" hidden></div>';
          ponerColabora(c); openPanel('perfilPanel');
        });
        await pagina.waitForTimeout(400);
        const cuenta = await verBloque(pagina, 'cuenta', `perfil-escritorio-final-${ancho}x${alto}.png`);
        assert.equal(cuenta.siguiente, null);
        await pagina.evaluate(() => { document.getElementById('perfilCuerpo').innerHTML = ''; document.getElementById('perfilPanel').classList.remove('show'); document.getElementById('ovl').classList.remove('show'); });
      }

      // En inglés: el mismo bloque traducido por el diccionario común, con el correo intacto.
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
      await pagina.waitForTimeout(400);
      const enIngles = await pagina.evaluate(() => [...document.querySelectorAll('section.colabora')].map(s => ({
        titulo: s.querySelector('h2').textContent.trim(), nombre: s.querySelector('a').textContent.replace(/\s+/g, ' ').trim(),
        href: s.querySelector('a').getAttribute('href'), nota: s.querySelector('.colabora-nota').textContent.trim(), texto: s.querySelector('.ini-bloque-sub').textContent.trim() })));
      assert.equal(enIngles.length, 2);
      for (const b of enIngles) {
        assert.equal(b.titulo, 'Would you like to work with us?');
        assert.equal(b.nombre, 'Write to us: rwadares@gmail.com');
        assert.equal(b.href, 'mailto:rwadares@gmail.com');
        assert.equal(b.texto, 'If you are a platform or an issuer, work in the sector or want to suggest an improvement, write to us.');
        assert.equal(b.nota, 'Working with us does not buy a place in the catalogue: offers are chosen on editorial criteria and RWAdar receives no money from investments.');
      }
      if (CAPTURAS) {
        await pagina.locator('section.colabora[data-colabora="inicio"]').scrollIntoViewIfNeeded();
        await pagina.waitForTimeout(200);
        await pagina.screenshot({ path: path.join(CAPTURAS, `inicio-final-en-${ancho}x${alto}.png`) });
      }
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
      await pagina.waitForTimeout(300);
      assert.equal(await pagina.textContent('section.colabora[data-colabora="inicio"] h2'), '¿Quieres colaborar con nosotros?');
      assert.deepEqual(errores, []);
      await pagina.close();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
