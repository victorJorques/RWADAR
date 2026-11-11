/* «Calcula tus números» en Inicio (11/11/2026), en Chromium a 390 × 844 y
   1366 × 900, sobre el worker local con las fuentes de rwadar-site: el
   ejemplo editable, los números escritos (con coma, punto y miles), los
   importes rápidos, «Lo reinvierto», los errores, «Afinar», la cuenta paso a
   paso, el gráfico y su tabla, los chips de las ofertas (del catálogo que ya
   carga la web), el inglés, el foco y el contraste; y el explicador, que ya no
   está atado a 300.000 € y lleva hasta aquí. Sin red. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const M = require('../rwadar-movil/lib/calculadora.js');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const nb = (s) => s.replace(/(\d) (€|%)/g, '$1 $2');

/* El catálogo que publica la web y el día en que se comprobó: con ese reloj,
   sus ofertas con rentabilidad están vigentes. */
const EMI = (() => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8') + ';globalThis.__EMI=EMI;', ctx);
  return JSON.parse(JSON.stringify(ctx.__EMI));
})();
const VERIFICADA = EMI.find(o => o.coleccion === 'principales' && o.estadoRevision === 'actual').verificadaEl;
const RELOJ = new Date(VERIFICADA + 'T12:00:00Z');
const OFERTAS = M.ofertasConRentabilidad(EMI, { ahora: RELOJ });

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

test('en Chromium: «Calcula tus números» en Inicio (390 y 1366): ejemplo, tus números, errores, «Afinar», cuenta, gráfico, ofertas, inglés, foco y contraste', { skip: sinNavegador, timeout: 240000 }, async () => {
  assert.ok(OFERTAS.length > 0, 'el catálogo publicado tiene ofertas con rentabilidad');
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      await pagina.clock.setFixedTime(RELOJ);
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#calculadora[data-calculadora-estado="ok"]', { timeout: 20000 });
      const leer = () => pagina.evaluate(() => {
        const s = document.querySelector('#calculadora');
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        const visible = (id) => { const n = document.getElementById(id); return !!n && !n.hidden && n.getClientRects().length > 0; };
        return { titular: document.getElementById('ciTitular').textContent, detalle: document.getElementById('ciDetalle').textContent,
          estado: s.querySelector('#ciEstado').className, ejemplo: visible('ciEjemplo'), grafico: visible('ciGraf'), ofertas: visible('ciOfertas'),
          barras: s.querySelectorAll('#ciGrafLienzo svg .ci-barra').length, filas: s.querySelectorAll('#ciTabla tbody tr').length,
          chips: [...s.querySelectorAll('.ci-chip')].map(c => ({ slug: c.dataset.ofertaRentabilidad, texto: c.textContent, pulsado: c.getAttribute('aria-pressed'), etiqueta: c.getAttribute('aria-label') })),
          fichas: [...s.querySelectorAll('a.ci-ficha')].map(a => a.getAttribute('href')),
          valores: Object.fromEntries([...s.querySelectorAll('.ci-input')].map(i => [i.name, i.value])),
          errores: [...s.querySelectorAll('.ci-error:not([hidden])')].map(p => p.textContent), invalidos: [...s.querySelectorAll('[aria-invalid="true"]')].map(i => i.name),
          pasos: [...s.querySelectorAll('#ciPasos li')].map(l => l.textContent), afinar: document.getElementById('ciAfinar').open,
          fuera: fuera.map(n => n.className).slice(0, 4), anchoPagina: document.documentElement.scrollWidth };
      });
      const esperar = () => pagina.waitForTimeout(350);

      // 1 · El sitio y la piel: entre «Mercado y noticias» y Aprende; el resultado arriba, en role="status".
      const sitio = await pagina.evaluate((ancho) => {
        const s = document.getElementById('calculadora'), mercado = document.getElementById('mercado'), aprende = document.getElementById('iniAprendeTit');
        const est = document.getElementById('ciEstado'), anuncio = document.getElementById('ciAnuncio'), caja = s.querySelector('.ci-resultado'), datos = s.querySelector('.ci-datos');
        return { tras: !!(mercado.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING), antes: !!(s.compareDocumentPosition(aprende) & Node.DOCUMENT_POSITION_FOLLOWING),
          bloque: s.classList.contains('ini-bloque') && s.classList.contains('calc-ini'),
          // Lo que se anuncia es #ciAnuncio (una vez, al dejar de escribir); #ciEstado se repinta a cada tecla y no es una región viva.
          rol: anuncio.getAttribute('role'), vivo: anuncio.getAttribute('aria-live'), dentro: caja.contains(anuncio), estadoSinRol: !est.hasAttribute('role') && !est.hasAttribute('aria-live'),
          // En el móvil, encima de los campos; en escritorio, arriba a la derecha, a la altura de los campos.
          resultadoArriba: ancho < 768 ? caja.getBoundingClientRect().bottom <= datos.getBoundingClientRect().top
            : Math.abs(caja.getBoundingClientRect().top - datos.getBoundingClientRect().top) < 1 && caja.getBoundingClientRect().left > datos.getBoundingClientRect().right,
          etiquetas: [...s.querySelectorAll('.ci-input')].every(i => !!s.querySelector(`label[for="${i.id}"]`) && i.getAttribute('inputmode')),
          legal: s.querySelector('.ci-legal').textContent };
      }, ancho);
      assert.ok(sitio.tras && sitio.antes, 'entre «Mercado y noticias» y Aprende');
      assert.ok(sitio.bloque && sitio.etiquetas);
      assert.equal(sitio.rol, 'status'); assert.equal(sitio.vivo, 'polite'); assert.ok(sitio.dentro && sitio.estadoSinRol);
      assert.ok(sitio.resultadoArriba, 'el resultado, arriba');
      assert.equal(sitio.legal, 'Simulación con tus números: no es una previsión ni una oferta. La rentabilidad pasada no garantiza la futura y puedes perder dinero.');

      // 2 · El ejemplo de partida (editable y marcado).
      let v = await leer();
      assert.equal(v.titular, nb('Cobrarías unos 32,40 € al año (2,70 € al mes)'));
      assert.equal(v.detalle, nb('Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya descontados 38 € de impuestos.'));
      await pagina.waitForFunction(() => document.getElementById('ciAnuncio').textContent !== '', null, { timeout: 3000 });
      assert.equal(await pagina.textContent('#ciAnuncio'), nb('Cobrarías unos 32,40 € al año (2,70 € al mes). Ganancia neta en 5 años: 162 €, un 3,24 % al año, ya descontados 38 € de impuestos.'));
      // «Afinar» y «Ver la cuenta»: «+» cerrado y «−» abierto (sin la flecha del explicador).
      const signos = () => pagina.evaluate(() => ['#ciAfinar > summary', '#ciCuenta > summary'].map(q => { const a = getComputedStyle(document.querySelector(q), '::after'); return [a.content, a.transform, a.borderTopWidth]; }));
      for (const [contenido, giro, borde] of await signos()) { assert.match(contenido, /^"\+"/); assert.equal(giro, 'none'); assert.equal(borde, '0px'); }
      await pagina.evaluate(() => { document.getElementById('ciAfinar').open = true; document.getElementById('ciCuenta').open = true; });
      for (const [contenido, giro] of await signos()) { assert.match(contenido, /^"−"/); assert.equal(giro, 'none'); }
      await pagina.evaluate(() => { document.getElementById('ciAfinar').open = false; document.getElementById('ciCuenta').open = false; });
      // Los ejemplos vacíos no parecen cifras escritas: «Ej.: 300.000», en cursiva y con contraste AA (--tx-3 sobre --s0).
      const ejemplo = await pagina.evaluate(() => { const i = document.getElementById('ciValorActivo'), p = getComputedStyle(i, '::placeholder');
        return { texto: i.placeholder, cursiva: p.fontStyle, precio: document.getElementById('ciPrecioParticipacion').placeholder, borde: getComputedStyle(i).borderTopColor }; });
      assert.deepEqual([ejemplo.texto, ejemplo.precio, ejemplo.cursiva], ['Ej.: 300.000', 'Ej.: 100', 'italic']);
      assert.equal(ejemplo.borde, 'rgba(255, 255, 255, 0.36)', 'el borde de los campos, 3,3:1 (WCAG 1.4.11)');
      // Al entrar y salir de un campo, nada de debajo salta (el resultado no cambia de tamaño).
      const medir = () => pagina.evaluate(() => [document.getElementById('ciResultado').offsetHeight, document.querySelector('.ci-datos').getBoundingClientRect().top + scrollY]);
      const antesFoco = await medir();
      await pagina.focus('#ciAnios'); await pagina.waitForTimeout(100);
      const conFoco = await medir();
      await pagina.locator('#ciAnios').blur(); await pagina.waitForTimeout(100);
      assert.deepEqual(conFoco, antesFoco, 'el resultado y los campos no se mueven al entrar en un campo');
      assert.deepEqual(await medir(), antesFoco, 'ni al salir');
      assert.equal(v.estado, 'ci-estado ci-estado--gana');
      assert.ok(v.ejemplo && v.grafico);
      assert.deepEqual([v.valores.inversion, v.valores.rentabilidad, v.valores.anios, v.valores.impuestos], ['1.000', '4', '5', '19']);
      assert.equal(v.barras, 5); assert.equal(v.filas, 5);
      assert.deepEqual(v.fuera, []); assert.equal(v.anchoPagina, ancho, 'sin desbordes');
      // En local la web no puede comprobar el catálogo con producción: sin cifras vigentes, el bloque de ofertas no sale y nada se rompe.
      assert.equal(v.ofertas, false);

      // 3 · Tus números: «25.000», «6,5», 10 años y «Lo reinvierto».
      await pagina.fill('#ciInversion', '25.000');
      await pagina.fill('#ciRentabilidad', '6,5');
      await pagina.fill('#ciAnios', '10');
      await pagina.locator('#ciAnios').blur(); await esperar();
      await pagina.check('#ciModoReinvertir');
      await esperar();
      v = await leer();
      assert.equal(v.titular, nb('Al cabo de 10 años tendrías unos 42.762 €'));
      assert.equal(v.detalle, nb('Ganancia neta: 17.762,03 €, como un 5,51 % al año, ya descontados 4.166,40 € de impuestos.'));
      // El lector de pantalla oye el resultado una sola vez al teclear «20000», no una por tecla.
      await pagina.waitForTimeout(800);
      const cambios = await pagina.evaluate(() => { window.__anuncios = []; new MutationObserver(() => window.__anuncios.push(document.getElementById('ciAnuncio').textContent))
        .observe(document.getElementById('ciAnuncio'), { childList: true, characterData: true, subtree: true }); return true; });
      assert.ok(cambios);
      await pagina.fill('#ciInversion', '');
      await pagina.locator('#ciInversion').pressSequentially('20000', { delay: 120 });
      await pagina.waitForTimeout(1000);
      const anuncios = await pagina.evaluate(() => window.__anuncios);
      assert.equal(anuncios.length, 1, `un solo anuncio: ${JSON.stringify(anuncios)}`);
      assert.match(anuncios[0], /^Al cabo de 10 años tendrías unos 34\.210/);
      assert.equal(v.ejemplo, false, '«Ejemplo: cámbialo» se va al escribir');
      assert.equal(v.barras, 10); assert.equal(v.filas, 10);
      // Al salir del campo, con su formato: «30000» → «30.000».
      await pagina.fill('#ciInversion', '30000');
      await pagina.locator('#ciInversion').blur();
      await esperar();
      assert.equal((await leer()).valores.inversion, '30.000');
      // Un importe rápido solo rellena el campo.
      await pagina.click('.ci-rapido[data-importe="5000"]');
      await esperar();
      assert.equal((await leer()).valores.inversion, '5.000');

      // 4 · Fuera de los límites: el mensaje junto al campo, aria-invalid y ninguna cifra.
      await pagina.fill('#ciInversion', '0');
      await pagina.fill('#ciRentabilidad', '45');
      await esperar();
      v = await leer();
      assert.equal(v.titular, 'Revisa los datos marcados para ver el resultado.');
      assert.deepEqual(v.errores, [nb('Pon entre 1 € y 10.000.000 €.'), nb('Pon entre −20 % y 30 %.')]);
      assert.deepEqual(v.invalidos, ['inversion', 'rentabilidad']);
      assert.equal(v.grafico, false);
      assert.doesNotMatch(JSON.stringify(v), /NaN|Infinity|undefined/);
      await pagina.fill('#ciInversion', '1.000');
      await pagina.fill('#ciRentabilidad', '4');
      await pagina.fill('#ciAnios', '5');
      // Tras el último campo válido el resultado se repinta (pasa del error a la cifra) y lo de debajo se mueve:
      // se espera al repintado antes de pulsar, como haría una persona (fallo intermitente con la máquina cargada).
      await esperar();
      await pagina.check('#ciModoCobrar');

      // 5 · «Afinar»: comisiones, impuestos, el activo entero y el precio de cada participación.
      await pagina.click('#ciAfinar > summary');
      await pagina.fill('#ciComisionAnual', '0,5');
      await pagina.fill('#ciValorActivo', '300.000');
      await pagina.fill('#ciPrecioParticipacion', '100');
      await pagina.click('#ciCuenta > summary');
      await esperar();
      v = await leer();
      assert.equal(v.afinar, true);
      assert.equal(await pagina.textContent('#ciAfinarAhora'), nb('comisión anual 0,50 % · impuestos 19 % · activo 300.000 € · trozo 100 €'));
      const r = M.calcular(M.validarEntradas({ inversion: '1.000', rentabilidad: '4', anios: '5', modo: 'cobrar', comisionAnual: '0,5', comisionEntrada: '0', impuestos: '19', valorActivo: '300.000', precioParticipacion: '100' }));
      assert.deepEqual(v.pasos, M.pasos(r).map(p => p.op + p.res));
      assert.ok(v.pasos.includes(nb('Parte del activo de 300.000 € que es tuya (10 de 3.000)0,33 %')));
      assert.equal(v.titular, M.resumen(r).titular);
      assert.match(await pagina.textContent('#ciNotaImpuestos'), /^Si cobras, pagas impuestos cada año sobre lo que cobras\. Es una aproximación con un solo tipo/);
      // Un error dentro de «Afinar» se ve aunque se pliegue.
      await pagina.click('#ciAfinar > summary');
      assert.equal(await pagina.evaluate(() => document.getElementById('ciAfinar').open), false);
      await pagina.evaluate(() => { const i = document.getElementById('ciImpuestos'); i.value = '60'; i.dispatchEvent(new Event('input', { bubbles: true })); });
      await esperar();
      v = await leer();
      assert.equal(v.afinar, true, 'el error abre «Afinar»');
      assert.ok(v.errores.includes(nb('Pon entre 0 % y 50 %.')));
      await pagina.fill('#ciImpuestos', '19');
      await pagina.fill('#ciComisionAnual', '0');
      await pagina.fill('#ciValorActivo', '');
      await pagina.fill('#ciPrecioParticipacion', '');
      await esperar();

      // 6 · Las ofertas, con el catálogo comprobado (como en producción): nombre corto, %, fecha, dólares y ficha.
      await pagina.evaluate(() => { CATALOGO_SIN_COMPROBAR = false; RWAdarCalculadoraInicio.ofertas(EMI, catalogoSinCifrasLocal()); });
      v = await leer();
      assert.equal(v.ofertas, true);
      assert.deepEqual(v.chips.map(c => c.slug), OFERTAS.map(o => o.slug));
      assert.deepEqual(v.chips.map(c => c.etiqueta), OFERTAS.map(o => M.etiquetaOferta(o)));
      assert.deepEqual(v.fichas, OFERTAS.map(o => '/ofertas/' + o.slug));
      for (const [i, o] of OFERTAS.entries()) {
        assert.ok(v.chips[i].texto.includes(o.nombre) && v.chips[i].texto.includes(M.porcentaje(o.rentabilidad, 'es', 2)) && v.chips[i].texto.includes(M.fechaCorta(o.fecha)));
        assert.equal(v.chips[i].texto.includes('en dólares'), o.enDolares, o.slug);
      }
      const dolar = OFERTAS.find(o => o.enDolares) || OFERTAS[0];
      await pagina.click(`.ci-chip[data-oferta-rentabilidad="${dolar.slug}"]`);
      await esperar();
      v = await leer();
      assert.equal(v.valores.rentabilidad, M.valorCampo(dolar.rentabilidad, 'es', 'rentabilidad'));
      assert.equal(v.chips.find(c => c.slug === dolar.slug).pulsado, 'true');
      // En el móvil, el resultado queda por encima de los chips: al pulsar uno, se sube hasta él.
      if (ancho < 768) {
        await pagina.waitForTimeout(700);
        const caja = await pagina.evaluate(() => { const b = document.getElementById('ciResultado').getBoundingClientRect(); return { arriba: b.top, abajo: b.bottom, alto: innerHeight }; });
        assert.ok(caja.arriba >= 0 && caja.abajo <= caja.alto, `el resultado, a la vista tras pulsar el chip: ${JSON.stringify(caja)}`);
      }
      assert.equal(await pagina.textContent('#ciOfertaNota'), M.notaOferta(dolar));
      assert.equal(v.titular, M.resumen(M.calcular(M.validarEntradas({ inversion: '1000', rentabilidad: String(dolar.rentabilidad), anios: '5', impuestos: '19' }))).titular);
      // Con la cifra cambiada a mano, el chip deja de estar pulsado.
      await pagina.fill('#ciRentabilidad', '3');
      await esperar();
      assert.ok((await leer()).chips.every(c => c.pulsado === 'false'));
      v = await leer();
      assert.deepEqual(v.fuera, []); assert.equal(v.anchoPagina, ancho, 'sin desbordes con las ofertas');

      // 7 · Foco visible (teclado) y contraste AA de los textos pequeños.
      await pagina.focus('#ciRentabilidad');
      await pagina.keyboard.press('Shift+Tab');
      await pagina.keyboard.press('Tab');
      const foco = await pagina.evaluate(() => { const a = document.activeElement, s = getComputedStyle(a); return { id: a.id, outline: s.outlineStyle, ancho: parseFloat(s.outlineWidth) }; });
      assert.equal(foco.id, 'ciRentabilidad');
      assert.ok(foco.outline !== 'none' && foco.ancho >= 2, `foco visible: ${JSON.stringify(foco)}`);
      for (const sel of ['#ciTitular', '#ciDetalle', '.ci-etq', '.ci-ayuda', '.ci-legal', '.ci-chip-fecha', '.ci-ofertas-nota', '.ci-afinar-ahora', '.ci-chip-pct', '.ci-rapido']) {
        const c = await pagina.evaluate(`(${CONTRASTE})(${JSON.stringify(sel)})`);
        assert.ok(c === null || c >= 4.5, `${sel}: contraste ${c?.toFixed(2)} (AA pide 4,5)`);
      }

      // 8 · En inglés: el formato de los campos y el resultado en su idioma.
      await pagina.fill('#ciRentabilidad', '4');
      await pagina.locator('#ciRentabilidad').blur();
      await esperar();
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
      await pagina.waitForTimeout(500);
      v = await leer();
      assert.equal(v.valores.inversion, '1,000');
      assert.equal(v.titular, 'You would receive about €32.40 a year (€2.70 a month)');
      assert.equal(await pagina.textContent('#ciTit'), 'Work out your numbers');
      assert.equal(await pagina.textContent('label[for="ciInversion"]'), 'What you invest (in euros)');
      // WCAG 2.5.3: el enlace se ve «Details →» y se llama «Details for …».
      const fichas = await pagina.evaluate(() => [...document.querySelectorAll('a.ci-ficha')].map(a => [a.textContent, a.getAttribute('aria-label')]));
      assert.ok(fichas.length && fichas.every(([texto, nombre]) => /^Details/.test(texto) && nombre.startsWith('Details for ')), JSON.stringify(fichas));
      assert.equal(await pagina.getAttribute('#ciValorActivo', 'placeholder'), 'e.g. 300,000');
      // En inglés, el punto es decimal: «1.5» son 1,5 €.
      await pagina.fill('#ciInversion', '1.500');
      await esperar();
      assert.match((await leer()).titular, /^You would receive about €0\.05 a year/);
      await pagina.fill('#ciInversion', '1,000');
      await pagina.locator('#ciInversion').blur();
      await esperar();
      await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
      await pagina.waitForTimeout(300);
      assert.equal((await leer()).valores.inversion, '1.000');
      assert.deepEqual(errores, []);
      await pagina.close();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

test('en Chromium: el explicador ya no está atado a 300.000 €: valor del activo y precio de cada trozo editables, y «Calcula con tus números →» lleva a Inicio', { skip: sinNavegador, timeout: 120000 }, async () => {
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      const errores = [];
      pagina.on('pageerror', e => errores.push(e.message));
      await pagina.goto(local.url + '/#explain', { waitUntil: 'load' });
      await pagina.waitForSelector('#calcValor', { state: 'attached' });
      // En el móvil, el explicador va dentro de Academy: se abre como desde su pestaña.
      if (ancho < 768) await pagina.evaluate(() => { if (!document.getElementById('calcValor').getClientRects().length) Movil.ir('explain'); });
      await pagina.waitForSelector('#calcValor', { state: 'visible' });
      await pagina.waitForTimeout(600);
      const leer = () => pagina.evaluate(() => ({ titulo: document.getElementById('calcTitulo').textContent,
        cuenta: [...document.querySelectorAll('#calcCuenta li')].map(l => l.textContent), anual: document.getElementById('tAnual').textContent,
        error: [...document.querySelectorAll('.calc-error:not([hidden])')].map(p => p.textContent), ir: document.getElementById('calcIrInicio').hidden,
        totales: [...document.querySelectorAll('.calc-total .cv')].map(n => n.textContent), res: [...document.querySelectorAll('#calcCuenta .res')].map(n => n.textContent) }));
      let v = await leer();
      assert.equal(v.titulo, nb('Un local de 300.000 €, partido en 3.000 trozos de 100 €'));
      assert.deepEqual(v.cuenta, [nb('Pones 2.500 € y cada trozo cuesta 100 €25 trozos'), nb('Tienes 25 de los 3.000 trozos del local0,83 % es tuyo'),
        nb('El local renta un 6,0 % sobre 300.000 €18.000 € al año'), nb('Tu 0,83 % de esos 18.000 €150 € al año')]);
      assert.equal(v.ir, false, 'en la web, el enlace a la calculadora de Inicio se ve');
      // Otro activo: 250.000 € en trozos de 250 €.
      await pagina.fill('#calcValor', '250.000');
      await pagina.fill('#calcPrecio', '250');
      await pagina.waitForTimeout(200);
      v = await leer();
      assert.equal(v.titulo, nb('Un local de 250.000 €, partido en 1.000 trozos de 250 €'));
      assert.deepEqual(v.cuenta, [nb('Pones 2.500 € y cada trozo cuesta 250 €10 trozos'), nb('Tienes 10 de los 1.000 trozos del local1,00 % es tuyo'),
        nb('El local renta un 6,0 % sobre 250.000 €15.000 € al año'), nb('Tu 1,00 % de esos 15.000 €150 € al año')]);
      // Un precio mayor que lo que pones, o de 0 €: el mensaje junto al campo y ninguna cifra del cálculo anterior a la vista.
      const sinCifras = (x) => {
        assert.equal(x.titulo, 'Revisa el valor del activo o el precio de cada trozo');
        assert.deepEqual(x.totales, ['—', '—', '—']);
        assert.deepEqual(x.res, ['—', '—', '—', '—']);
        assert.doesNotMatch(x.cuenta.join('|'), /250\.000|1\.000|15\.000|150/);
      };
      await pagina.fill('#calcPrecio', '5.000');
      await pagina.waitForTimeout(200);
      v = await leer();
      assert.deepEqual(v.error, [nb('Con 2.500 € no llegas a un trozo de 5.000 €: sube lo que inviertes o baja el precio.')]);
      assert.equal(await pagina.getAttribute('#calcPrecio', 'aria-invalid'), 'true');
      sinCifras(v);
      await pagina.fill('#calcPrecio', '0');
      await pagina.waitForTimeout(200);
      v = await leer();
      assert.deepEqual(v.error, [nb('Pon entre 0,01 € y 10.000.000 €.')]);
      sinCifras(v);
      // Al corregirlo, vuelve la cuenta.
      await pagina.fill('#calcPrecio', '250');
      await pagina.waitForTimeout(200);
      v = await leer();
      assert.equal(v.titulo, nb('Un local de 250.000 €, partido en 1.000 trozos de 250 €'));
      assert.deepEqual(v.error, []);
      await pagina.fill('#calcPrecio', '100');
      await pagina.fill('#calcValor', '300.000');
      // «Calcula con tus números →»: a Inicio, al bloque, con el foco en el primer campo.
      await pagina.click('#calcIrInicio');
      // El desplazamiento es suave: se espera a que el bloque llegue arriba, bajo la cabecera.
      await pagina.waitForFunction(() => { const t = document.getElementById('calculadora').getBoundingClientRect().top; return t > 40 && t < 120; }, null, { timeout: 8000 }).catch(() => {});
      await pagina.waitForTimeout(300);
      const destino = await pagina.evaluate(() => {
        const s = document.getElementById('calculadora'), t = s.getBoundingClientRect().top;
        const cab = [...document.querySelectorAll('body *')].filter(n => getComputedStyle(n).position === 'fixed' && n.getBoundingClientRect().top <= 0 && n.getBoundingClientRect().bottom > 0 && n.getBoundingClientRect().bottom < 200 && n.getBoundingClientRect().width > innerWidth / 2)
          .reduce((m, n) => Math.max(m, n.getBoundingClientRect().bottom), 0);
        return { foco: document.activeElement.id, arriba: Math.round(t), cabecera: Math.round(cab), titulo: document.getElementById('ciTit').getBoundingClientRect().top };
      });
      assert.equal(destino.foco, 'ciInversion');
      // Lleva sus números: 2.500 € al 6 %, el local de 300.000 € y trozos de 100 €.
      const llevados = await pagina.evaluate(() => ['ciInversion', 'ciRentabilidad', 'ciValorActivo', 'ciPrecioParticipacion'].map(id => document.getElementById(id).value));
      assert.deepEqual(llevados, ['2.500', '6', '300.000', '100']);
      assert.equal(await pagina.textContent('#ciTitular'), nb('Cobrarías unos 122 € al año (10,13 € al mes)'));
      assert.ok(destino.arriba >= destino.cabecera - 1 && destino.arriba < 140, `el bloque, arriba y bajo la cabecera: ${JSON.stringify(destino)}`);
      assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth), ancho);
      assert.deepEqual(errores, []);
      await pagina.close();
    }
    // Dentro de la app (WebView): sin la marca de la app nueva, el enlace no sale; con ella, avisa a la app.
    // La marca es la misma que inyecta la app antes de cargar la página (Explicador.js, CON_CALCULADORA).
    const app = fs.readFileSync(path.join(RAIZ, 'rwadar-movil/componentes/Explicador.js'), 'utf8');
    const CON_CALCULADORA = /export const CON_CALCULADORA = `([\s\S]*?)`;/.exec(app)[1];
    for (const [marca, oculto] of [[false, true], [true, false]]) {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.addInitScript(() => {
        window.__mensajes = [];
        window.ReactNativeWebView = { postMessage: (x) => window.__mensajes.push(x) };
      });
      if (marca) await pagina.addInitScript(CON_CALCULADORA);
      await pagina.goto(local.url + '/#explain', { waitUntil: 'load' });
      await pagina.waitForTimeout(500);
      assert.equal(await pagina.evaluate(() => document.getElementById('calcIrInicio').hidden), oculto);
      if (marca) {
        await pagina.evaluate(() => document.getElementById('calcIrInicio').click());
        assert.deepEqual(await pagina.evaluate(() => window.__mensajes.filter(m => /calculadora/.test(m))), ['rwadar:tutorial-calculadora']);
      }
      await pagina.close();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
