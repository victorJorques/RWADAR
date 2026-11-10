/* «Noticias del sector» de Inicio (10/11/2026): /datos/noticias.json como
   recurso estático (publicables, cabeceras y validación en el generador), la
   copia web del motor, el script sin innerHTML ni terceros y la portada en
   Chromium a 390 × 844 y 1366 × 900: carrusel con ajuste, tarjetas que son
   botones con el titular entero, teclado, diálogo accesible con su enlace
   que sale de RWAdar, inglés y archivo caído. Sin red. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/noticias-sector.js');
const copiaWeb = require('../rwadar-app/noticias/copiar-modelo-web.cjs');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const TEXTO = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias.json'), 'utf8');
const DATOS = modelo.validarNoticias(JSON.parse(TEXTO));
const lee = r => fs.readFileSync(path.join(RAIZ, r), 'utf8');

test('/datos/noticias.json se publica como recurso estático, validado, con su caché y la copia exacta del motor', () => {
  assert.equal(copiaWeb.alDia(), true, 'ejecuta node rwadar-app/noticias/copiar-modelo-web.cjs');
  const { ARCHIVOS_PUBLICABLES, RUTAS_CONTENIDO_APROBADO } = require('../rwadar-publicacion-segura.js');
  for (const archivo of ['datos/noticias.json', 'assets/noticias-sector-modelo-20261110.js', 'assets/noticias-sector-20261110.js', 'assets/noticias-sector-20261110.css']) {
    assert.ok(ARCHIVOS_PUBLICABLES.includes(archivo), archivo);
  }
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-movil/lib/noticias-sector.js'));
  assert.match(lee('rwadar-site/_headers'), /\n\/datos\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n {2}X-Robots-Tag: noindex\n/);
  // El generador valida la forma antes de publicar y se para si no vale.
  const publicador = lee('rwadar-publicar.js');
  assert.match(publicador, /noticiasModelo\.validarNoticias\(JSON\.parse\(textoNoticias\)\)/);
  assert.match(publicador, /throw new Error\(`rwadar-site\/datos\/noticias\.json no vale: /);
  // El script de la sección no usa innerHTML ni habla con nadie más que con su propio sitio.
  const js = lee('rwadar-site/assets/noticias-sector-20261110.js');
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|outerHTML|document\.write|https?:\/\/(?!www\.w3\.org\/2000\/svg')/);
  assert.deepEqual([...js.matchAll(/'(\/(?:api|datos)\/[^']+)'/g)].map(m => m[1]), ['/datos/noticias.json']);
  assert.match(js, /rel = 'noopener noreferrer'/);
  // En el HTML no hay ninguna noticia: solo el armazón, tras la tokenización y antes del capítulo 01.
  const html = lee('rwadar-site/index.html');
  const inicio = html.indexOf('<section class="nt" id="noticias"'), fin = html.indexOf('</section>', inicio);
  assert.ok(inicio > html.indexOf('<section class="tk" id="tokenizacion"') && inicio < html.indexOf('id="relCap1"'));
  assert.equal(html.slice(html.indexOf('</section>', html.indexOf('id="tokenizacion"')) + 10, inicio).replace(/<!--[\s\S]*?-->/g, '').trim(), '',
    'justo después de «La tokenización en el mundo»');
  const seccion = html.slice(inicio, fin);
  for (const n of DATOS.noticias) assert.ok(!seccion.includes(n.titulo) && !seccion.includes(n.fuente.url));
  assert.ok(html.indexOf('/assets/noticias-sector-modelo-20261110.js') < html.indexOf('/assets/noticias-sector-20261110.js'));
});

/* ---- Chromium ---- */
function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

test('en Chromium: carrusel de tarjetas-botón, teclado, diálogo con su fuente, inglés y archivo caído, a 390 y 1366 px', { skip: sinNavegador, timeout: 180000 }, async () => {
  // La tokenización no importa aquí: su API se corta y la sección muestra su estado vacío.
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0,
    responder: async url => (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      const errores = [], terceros = [];
      pagina.on('pageerror', e => errores.push(e.message));
      pagina.on('request', r => { const u = new URL(r.url()); if (u.origin !== new URL(local.url).origin) terceros.push(u.href); });
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('noticias').scrollIntoView());
      const m = await pagina.evaluate(() => {
        const s = document.getElementById('noticias'), l = document.getElementById('ntLista');
        const botones = [...l.querySelectorAll('.nt-tarjeta')];
        const tit = botones[0].querySelector('.nt-titular-txt'), estilo = getComputedStyle(tit);
        const b0 = botones[0].getBoundingClientRect();
        const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('#ntLista') && !n.closest('dialog') && !n.closest('.solo-lector'))
          .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        return {
          n: botones.length, tipos: botones.map(b => b.tagName + ':' + b.type), conEtiqueta: botones.filter(b => b.hasAttribute('aria-label')).length,
          hoy: botones.filter(b => b.querySelector('.nt-hoy')).length, svgOcultos: botones.every(b => b.querySelector('svg').getAttribute('aria-hidden') === 'true'),
          textoSvg: l.querySelectorAll('svg text, svg image, svg foreignObject, img').length,
          snap: getComputedStyle(l).scrollSnapType, desborda: l.scrollWidth > l.clientWidth, anchoPagina: document.documentElement.scrollWidth,
          clamp: estilo.webkitLineClamp, lineas: Math.round(tit.getBoundingClientRect().height / parseFloat(estilo.lineHeight)),
          proporcion: b0.height / b0.width, fuera: fuera.length,
          fecha: document.getElementById('ntFecha').textContent, cabecera: document.getElementById('ntTit').textContent,
          traTk: document.getElementById('tokenizacion').compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING,
          // El titular se lee sobre el velo oscuro del dibujo: texto claro y sombra.
          color: estilo.color, sombra: estilo.textShadow !== 'none',
        };
      });
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      assert.deepEqual(terceros, [], `${ancho}: el navegador no pide nada a terceros`);
      assert.equal(m.n, 8);
      assert.ok(m.tipos.every(t => t === 'BUTTON:button'));
      assert.equal(m.conEtiqueta, 0, 'el nombre sale del titular visible, no de un aria-label');
      assert.equal(m.hoy, 3);
      assert.ok(m.svgOcultos && m.textoSvg === 0, 'ilustraciones decorativas, sin texto ni imágenes');
      assert.equal(m.snap, 'x mandatory');
      assert.ok(m.desborda, 'es un carrusel');
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal de la página`);
      assert.equal(m.fuera, 0);
      assert.equal(m.clamp, '3');
      assert.ok(m.lineas <= 3, `como mucho 3 líneas (${m.lineas})`);
      assert.ok(Math.abs(m.proporcion - 1.25) < 0.02, 'portada grande 4:5');
      assert.equal(m.cabecera, 'Noticias del sector');
      assert.equal(m.fecha, 'Actualizadas el 10/11');
      assert.ok(m.traTk, 'después de «La tokenización en el mundo»');
      assert.equal(m.color, 'rgb(247, 245, 240)');
      assert.ok(m.sombra);
      // Nombre accesible: el titular entero (aunque se recorte a la vista) y «Hoy».
      for (const n of DATOS.noticias) {
        const nombre = n.seccion === 'hoy' ? `${n.titulo} Hoy` : n.titulo;
        assert.equal(await pagina.getByRole('button', { name: nombre, exact: true }).count(), 1, nombre);
      }
      // Teclado: Tab llega a la primera tarjeta con el foco visible; las flechas recorren el carrusel.
      await pagina.focus('#ntLista .nt-tarjeta');
      assert.notEqual(await pagina.evaluate(() => getComputedStyle(document.activeElement).boxShadow), 'none');
      await pagina.keyboard.press('ArrowRight');
      await pagina.keyboard.press('ArrowRight');
      assert.equal(await pagina.evaluate(() => document.activeElement.dataset.ntId), DATOS.noticias[2].id);
      await pagina.keyboard.press('End');
      assert.equal(await pagina.evaluate(() => document.activeElement.dataset.ntId), DATOS.noticias[7].id);
      await pagina.waitForFunction(() => { const l = document.getElementById('ntLista'), b = document.activeElement.getBoundingClientRect();
        return b.right <= l.getBoundingClientRect().right + 1 && b.left >= l.getBoundingClientRect().left - 1; });
      await pagina.keyboard.press('Home');
      await pagina.keyboard.press('ArrowRight');
      // Intro abre el diálogo de la noticia con el foco en «Cerrar».
      await pagina.keyboard.press('Enter');
      await pagina.waitForSelector('#ntDialogo[open]');
      const n = DATOS.noticias[1];
      const d = await pagina.evaluate(() => {
        const dlg = document.getElementById('ntDialogo'), a = dlg.querySelector('.nt-dlg-ir'), b = dlg.getBoundingClientRect();
        return { modal: dlg.matches(':modal'), foco: document.activeElement.getAttribute('aria-label'), titulo: document.getElementById('ntDlgTit')?.textContent,
          etiquetado: dlg.getAttribute('aria-labelledby'), texto: dlg.textContent, href: a.href, target: a.target, rel: a.rel, enlace: a.textContent,
          dentro: b.left >= -0.5 && b.right <= innerWidth + 0.5, arte: dlg.querySelectorAll('.nt-dlg-arte svg [fill]').length > 10 };
      });
      assert.equal(d.modal, true);
      assert.equal(d.foco, 'Cerrar la noticia');
      assert.equal(d.etiquetado, 'ntDlgTit');
      assert.equal(d.titulo, n.titulo);
      for (const parte of ['09/11/2026', 'Producto', 'UE', 'Hoy', n.tituloInformativo, n.resumen, 'Por qué te importa', n.porQueImporta, 'Fuente', n.fuente.nombre,
        'Consultada el 10/11/2026', 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.']) assert.ok(d.texto.includes(parte), parte);
      assert.equal(d.href, n.fuente.url);
      assert.equal(d.target, '_blank');
      assert.equal(d.rel, 'noopener noreferrer');
      assert.equal(d.enlace.trim(), 'Leer en la fuente (sales de RWAdar) ↗');
      assert.ok(d.dentro && d.arte);
      // Escape cierra y el foco vuelve a la tarjeta.
      await pagina.keyboard.press('Escape');
      await pagina.waitForSelector('#ntDialogo:not([open])', { state: 'attached' });
      assert.equal(await pagina.evaluate(() => document.activeElement.dataset.ntId), n.id);
      assert.equal(await pagina.evaluate(() => document.documentElement.classList.contains('nt-dialogo-abierto')), false);
      // Con el ratón: abrir y cerrar con «×».
      await pagina.click(`#ntLista [data-nt-id="${DATOS.noticias[3].id}"]`);
      await pagina.waitForSelector('#ntDialogo[open]');
      await pagina.click('#ntDialogo [data-nt-cerrar]');
      await pagina.waitForSelector('#ntDialogo:not([open])', { state: 'attached' });
      // En inglés: los campos «en» de cada noticia y la interfaz del diccionario.
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await pagina.waitForFunction(() => document.getElementById('ntTit').textContent === 'Industry news');
      const en = await pagina.evaluate(() => ({ fecha: document.getElementById('ntFecha').textContent,
        primero: document.querySelector('#ntLista .nt-titular-txt').textContent, hoy: document.querySelector('#ntLista .nt-hoy').textContent }));
      assert.deepEqual(en, { fecha: 'Updated on 10 Nov', primero: DATOS.noticias[0].en.titulo, hoy: 'Today' });
      await pagina.click(`#ntLista [data-nt-id="${DATOS.noticias[0].id}"]`);
      await pagina.waitForSelector('#ntDialogo[open]');
      const dEn = await pagina.evaluate(() => document.getElementById('ntDialogo').textContent);
      for (const parte of ['10 Nov 2026', 'Risk', 'Spain', DATOS.noticias[0].en.resumen, 'Why it matters to you', DATOS.noticias[0].en.porQueImporta,
        'Checked on', 'Read at the source (you leave RWAdar)']) assert.ok(dEn.includes(parte), parte);
      await pagina.keyboard.press('Escape');
      await pagina.close();
    }
    // Sin el archivo: lo dice, sin ninguna noticia ni cifra, y el resto de Inicio sigue.
    const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
    await pagina.route('**/datos/noticias.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"version":1,"noticias":[]}' }));
    await pagina.goto(local.url + '/', { waitUntil: 'load' });
    await pagina.waitForSelector('#noticias[data-noticias-estado="sin-datos"]', { timeout: 20000 });
    assert.equal(await pagina.textContent('#ntEstado'), 'Ahora no podemos mostrar las noticias. Vuelve a intentarlo más tarde.');
    assert.equal(await pagina.isVisible('#ntLista'), false);
    assert.ok(await pagina.isVisible('#relPortada'));
    await pagina.close();
  } finally { await navegador.close(); await local.cerrar(); }
});
