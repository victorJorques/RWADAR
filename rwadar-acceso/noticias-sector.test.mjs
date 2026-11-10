/* «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día):
   /datos/noticias.json como recurso estático (publicables, cabeceras y
   validación en el generador), la copia web del motor, el script sin
   innerHTML ni terceros, y en Chromium a 390 × 844 y 1366 × 900: en Inicio,
   3 tarjetas grandes con foto y solo el titular, que llevan a su detalle; en
   /noticias/, las 8 con su detalle en un diálogo accesible con su enlace que
   sale de RWAdar, teclado, /noticias/#id, inglés y archivo caído. Sin red. */
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
  // En el HTML no hay ninguna noticia: en Inicio, el bloque tras «El mercado hoy» y antes de «Aprende»; en /noticias/, la lista.
  const html = lee('rwadar-site/index.html');
  const inicio = html.indexOf('<section class="ini-bloque nt nt--portada" id="noticias"'), fin = html.indexOf('</section>', inicio);
  assert.ok(inicio > html.indexOf('data-tokenizacion="compacta"') && inicio < html.indexOf('id="iniAprendeTit"'));
  const seccion = html.slice(inicio, fin);
  for (const n of DATOS.noticias) assert.ok(!seccion.includes(n.titulo) && !seccion.includes(n.fuente.url));
  assert.ok(html.indexOf('/assets/noticias-sector-modelo-20261110.js') < html.indexOf('/assets/noticias-sector-20261110.js'));
  const pagina = lee('rwadar-site/noticias/index.html');
  for (const n of DATOS.noticias) assert.ok(!pagina.includes(n.titulo));
  assert.ok(pagina.indexOf('/assets/noticias-sector-modelo-20261110.js') < pagina.indexOf('/assets/noticias-sector-20261110.js'));
  // Las fotos: cada clave usada sale de la biblioteca y se publica en /noticias-editoriales/ (como /ofertas-editoriales/).
  assert.match(publicador, /cargarFotosNoticias\(__dirname\)/);
  assert.match(publicador, /\.\.\.fotosNoticias\.publicables\.map\(activo => activo\.salida\)/);
  assert.match(lee('rwadar-site/_headers'), /\n\/noticias-editoriales\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n/);
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-editorial-source/noticias') && RUTAS_CONTENIDO_APROBADO.includes('rwadar-noticias-editoriales.js'));
  const fotos = require('../rwadar-noticias-editoriales.js');
  assert.equal(fotos.RUTA_PUBLICA_BASE, 'noticias-editoriales');
  assert.deepEqual(fotos.clavesUsadas(RAIZ), modelo.clavesFotos(DATOS));
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

// La foto de prueba: una WebP propia del repositorio en lugar de cada foto de la biblioteca (el sitio fuente no las lleva).
const FOTO_PRUEBA = fs.readFileSync(path.join(RAIZ, 'rwadar-movil/assets/ofertas-editoriales/inmobiliario-rwadar.webp'));
async function conFotos(pagina, pedidas) {
  await pagina.route('**/noticias-editoriales/*.webp', r => { pedidas.push(new URL(r.request().url()).pathname); return r.fulfill({ status: 200, contentType: 'image/webp', body: FOTO_PRUEBA }); });
}

test('en Chromium: Inicio con 3 tarjetas de foto y solo el titular; /noticias/ con las 8, teclado, diálogo, #id, inglés y archivo caído', { skip: sinNavegador, timeout: 180000 }, async () => {
  // La tokenización no importa aquí: su API se corta y la sección muestra su estado vacío.
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0,
    responder: async url => (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
  const navegador = await playwright.chromium.launch();
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      // ---- Inicio ----
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      // Reloj fijo: el 10/11/2026 a mediodía, el día del ciclo («Hoy» y «Ayer» dependen de él).
      await pagina.clock.setFixedTime(new Date(2026, 10, 10, 12, 0));
      const errores = [], terceros = [], pedidas = [];
      pagina.on('pageerror', e => errores.push(e.message));
      pagina.on('request', r => { const u = new URL(r.url()); if (u.origin !== new URL(local.url).origin) terceros.push(u.href); });
      await conFotos(pagina, pedidas);
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('noticias').scrollIntoView());
      await pagina.waitForFunction(() => [...document.querySelectorAll('#ntLista img')].every(i => i.complete && i.naturalWidth > 0));
      const m = await pagina.evaluate(() => {
        const s = document.getElementById('noticias'), l = document.getElementById('ntLista');
        const tarjetas = [...l.querySelectorAll('.nt-tarjeta')];
        const tit = tarjetas[1].querySelector('.nt-titular-txt'), estilo = getComputedStyle(tit);
        const velo = getComputedStyle(tarjetas[0], '::after').backgroundImage;
        const fuera = [...s.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        return {
          n: tarjetas.length, tipos: tarjetas.map(a => a.tagName), href: tarjetas.map(a => a.getAttribute('href')),
          conEtiqueta: tarjetas.filter(b => b.hasAttribute('aria-label')).length,
          hoy: tarjetas.filter(b => b.querySelector('.nt-hoy')?.textContent === 'Hoy').length,
          ayer: tarjetas.filter(b => b.querySelector('.nt-hoy--ayer')?.textContent === 'Ayer').length,
          fotos: tarjetas.map(a => { const i = a.querySelector('img'); return i && i.getAttribute('src'); }),
          altVacio: tarjetas.every(a => a.querySelector('img').getAttribute('alt') === '' && a.querySelector('.nt-foto').getAttribute('aria-hidden') === 'true'),
          velo: /linear-gradient/.test(velo), svg: l.querySelectorAll('svg').length, anchoPagina: document.documentElement.scrollWidth, fuera: fuera.length,
          clamp: estilo.webkitLineClamp, lineas: Math.round(tit.getBoundingClientRect().height / parseFloat(estilo.lineHeight)),
          color: estilo.color, sombra: estilo.textShadow !== 'none', anchoTarjeta: tarjetas[0].getBoundingClientRect().width,
          fecha: document.getElementById('ntFecha').textContent, cabecera: document.getElementById('ntTit').textContent,
          todas: s.querySelector('a.ini-ver[href="/noticias/"]')?.textContent.trim(), nota: document.getElementById('ntNota').textContent,
          traMercado: document.getElementById('tokenizacion').compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING,
          dialogo: !!document.getElementById('ntDialogo'),
        };
      });
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      assert.deepEqual(terceros, [], `${ancho}: el navegador no pide nada a terceros`);
      assert.equal(m.n, 3, 'en Inicio, solo 3');
      assert.ok(m.tipos.every(t => t === 'A'));
      assert.deepEqual(m.href, DATOS.noticias.slice(0, 3).map(n => `/noticias/#${n.id}`));
      assert.equal(m.conEtiqueta, 0, 'el nombre sale del titular visible, no de un aria-label');
      assert.equal(m.hoy, 1, 'el 10/11, «Hoy» solo en la del 10/11');
      assert.equal(m.ayer, 2, 'y «Ayer» en las dos del 09/11');
      assert.deepEqual(m.fotos, DATOS.noticias.slice(0, 3).map(n => `/noticias-editoriales/${n.imagen}.webp`));
      assert.ok(pedidas.length >= 1 && pedidas.every(r => /^\/noticias-editoriales\/[a-z0-9-]+\.webp$/.test(r)));
      assert.ok(m.altVacio, 'la foto es decorativa: el titular ya lo dice');
      assert.ok(m.velo, 'un degradado oscuro abajo para leer el titular');
      assert.equal(m.svg, 0, 'sin ilustraciones SVG');
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal de la página`);
      assert.equal(m.fuera, 0);
      assert.equal(m.clamp, '3');
      assert.ok(m.lineas <= 3, `como mucho 3 líneas (${m.lineas})`);
      assert.equal(m.color, 'rgb(247, 245, 240)');
      assert.ok(m.sombra);
      assert.ok(m.anchoTarjeta >= 340, `tarjetas grandes (${m.anchoTarjeta} px)`);
      assert.equal(m.cabecera, 'Noticias');
      assert.equal(m.fecha, 'Actualizadas el 10/11');
      assert.equal(m.todas, 'Todas las noticias→');
      assert.equal(m.nota, 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.');
      assert.ok(m.traMercado, 'después de «El mercado hoy»');
      assert.equal(m.dialogo, false, 'en Inicio no hay detalle: está en /noticias/');
      for (const n of DATOS.noticias.slice(0, 3)) {
        const cual = modelo.etiquetaReciente(n, '2026-11-10');
        assert.equal(await pagina.getByRole('link', { name: cual ? `${n.titulo} ${cual}` : n.titulo, exact: true }).count(), 1, n.titulo);
      }
      // Tocar una tarjeta lleva a /noticias/ con su detalle abierto.
      await pagina.click(`#ntLista [data-nt-id="${DATOS.noticias[1].id}"]`);
      await pagina.waitForURL(/\/noticias\/#/);
      await pagina.waitForSelector('#ntDialogo[open]', { timeout: 20000 });
      assert.equal(await pagina.textContent('#ntDlgTit'), DATOS.noticias[1].titulo);
      await pagina.keyboard.press('Escape');
      await pagina.close();

      // ---- /noticias/ ----
      const lista = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      await lista.clock.setFixedTime(new Date(2026, 10, 10, 12, 0));
      const erroresL = [];
      lista.on('pageerror', e => erroresL.push(e.message));
      await conFotos(lista, []);
      await lista.goto(local.url + '/noticias/', { waitUntil: 'load' });
      await lista.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      const l = await lista.evaluate(() => ({
        n: document.querySelectorAll('#ntLista .nt-art').length, botones: [...document.querySelectorAll('#ntLista .nt-art-abrir')].map(b => b.tagName + ':' + b.type),
        resumen: document.querySelector('#ntLista .nt-art-resumen').textContent, anchoPagina: document.documentElement.scrollWidth,
        h1: document.querySelector('h1').textContent,
      }));
      assert.deepEqual(erroresL, []);
      assert.equal(l.n, 8, 'las 8');
      assert.ok(l.botones.every(b => b === 'BUTTON:button'));
      assert.equal(l.resumen, DATOS.noticias[0].resumen);
      assert.equal(l.anchoPagina, ancho);
      assert.equal(l.h1, 'Noticias');
      // Teclado: el botón del titular abre el diálogo con el foco en «Cerrar».
      await lista.focus(`#ntLista [data-nt-id="${DATOS.noticias[1].id}"]`);
      await lista.keyboard.press('Enter');
      await lista.waitForSelector('#ntDialogo[open]');
      const n = DATOS.noticias[1];
      const d = await lista.evaluate(() => {
        const dlg = document.getElementById('ntDialogo'), a = dlg.querySelector('.nt-dlg-ir'), b = dlg.getBoundingClientRect();
        return { modal: dlg.matches(':modal'), foco: document.activeElement.getAttribute('aria-label'), titulo: document.getElementById('ntDlgTit')?.textContent,
          etiquetado: dlg.getAttribute('aria-labelledby'), texto: dlg.textContent, href: a.href, target: a.target, rel: a.rel, enlace: a.textContent,
          dentro: b.left >= -0.5 && b.right <= innerWidth + 0.5, foto: dlg.querySelector('.nt-dlg-arte img')?.getAttribute('src'),
          flechaSola: a.querySelector('.nt-dlg-ir-flecha').parentElement === a };
      });
      assert.equal(d.modal, true);
      assert.equal(d.foco, 'Cerrar la noticia');
      assert.equal(d.etiquetado, 'ntDlgTit');
      assert.equal(d.titulo, n.titulo);
      assert.equal(d.foto, `/noticias-editoriales/${n.imagen}.webp`);
      assert.ok(!d.texto.includes('Hoy') && d.texto.includes('Ayer'), 'del 09/11: «Ayer», no «Hoy»');
      assert.ok(!d.texto.includes(n.tituloInformativo), 'sin repetir el titular con otras palabras');
      assert.equal(d.flechaSola, false, 'la flecha va dentro del texto del botón');
      for (const parte of ['09/11/2026', 'Producto', 'UE', 'Ayer', n.resumen, 'Por qué te importa', n.porQueImporta, 'Fuente', n.fuente.nombre,
        'Consultada el 10/11/2026', 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.']) assert.ok(d.texto.includes(parte), parte);
      assert.equal(d.href, n.fuente.url);
      assert.equal(d.target, '_blank');
      assert.equal(d.rel, 'noopener noreferrer');
      assert.equal(d.enlace.trim(), 'Leer en la fuente (sales de RWAdar) ↗');
      assert.ok(d.dentro);
      // Escape cierra y el foco vuelve al titular.
      await lista.keyboard.press('Escape');
      await lista.waitForSelector('#ntDialogo:not([open])', { state: 'attached' });
      assert.equal(await lista.evaluate(() => document.activeElement.dataset.ntId), n.id);
      assert.equal(await lista.evaluate(() => document.documentElement.classList.contains('nt-dialogo-abierto')), false);
      // Con el ratón: la tarjeta entera abre; «×» cierra.
      await lista.click(`#ntLista #${DATOS.noticias[3].id} .nt-art`, { position: { x: 30, y: 30 } });
      await lista.waitForSelector('#ntDialogo[open]');
      await lista.click('#ntDialogo [data-nt-cerrar]');
      await lista.waitForSelector('#ntDialogo:not([open])', { state: 'attached' });
      // En inglés: los campos «en» de cada noticia y la interfaz del diccionario.
      await lista.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await lista.waitForFunction(() => document.querySelector('h1').textContent === 'News');
      const en = await lista.evaluate(() => ({ fecha: document.getElementById('ntFecha').textContent,
        primero: document.querySelector('#ntLista .nt-art-tit').textContent, hoy: document.querySelector('#ntLista .nt-hoy').textContent,
        nota: document.getElementById('ntNota').textContent }));
      assert.deepEqual(en, { fecha: 'Updated on 10 Nov', primero: DATOS.noticias[0].en.titulo, hoy: 'Today',
        nota: 'Illustrative AI-generated images, not photos of the news.' });
      await lista.click(`#ntLista [data-nt-id="${DATOS.noticias[0].id}"]`);
      await lista.waitForSelector('#ntDialogo[open]');
      const dEn = await lista.evaluate(() => document.getElementById('ntDialogo').textContent);
      for (const parte of ['10 Nov 2026', 'Risk', 'Spain', DATOS.noticias[0].en.resumen, 'Why it matters to you', DATOS.noticias[0].en.porQueImporta,
        'Checked on', 'Read at the source (you leave RWAdar)', 'Original source text (Spanish)']) assert.ok(dEn.includes(parte), parte);
      await lista.keyboard.press('Escape');
      await lista.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
      await lista.close();
    }
    // El 13/11, sin ciclo nuevo: ni «Hoy» ni «Ayer», y las de hoy siguen primero.
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.clock.setFixedTime(new Date(2026, 10, 13, 12, 0));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      assert.equal(await pagina.locator('#ntLista .nt-hoy').count(), 0);
      assert.equal(await pagina.getAttribute('#ntLista .nt-tarjeta', 'data-nt-id'), DATOS.noticias[0].id);
      await pagina.close();
    }
    // Una foto que no carga: se quita y queda el fondo oscuro; el titular sigue.
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.route('**/noticias-editoriales/*.webp', r => r.fulfill({ status: 404, body: '' }));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('noticias').scrollIntoView());
      await pagina.waitForFunction(() => document.querySelectorAll('#ntLista .nt-foto--sin').length === 3);
      assert.equal(await pagina.locator('#ntLista img').count(), 0);
      assert.equal(await pagina.locator('#ntLista .nt-titular-txt').count(), 3);
      await pagina.close();
    }
    // Sin el archivo: lo dice, sin ninguna noticia, y el resto de Inicio sigue.
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
