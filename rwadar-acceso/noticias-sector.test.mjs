/* «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día):
   /datos/noticias-v2.json como recurso estático, y /datos/noticias.json sin
   «imagen» para la app ya instalada (publicables, cabeceras y validación en
   el generador, con el motor congelado de esa app), la copia web del motor, el script sin
   innerHTML ni terceros, y en Chromium a 390 × 844 y 1366 × 900: en Inicio,
   dentro de «Mercado y noticias» (11/11/2026), la portada con foto grande y
   dos tarjetas (14/11/2026) que llevan a su detalle; en /mercado/, debajo del
   gráfico, la portada y las demás en tarjetas, con su detalle
   en un diálogo accesible con su enlace que sale de RWAdar, teclado,
   /mercado/#id, /noticias/#id (lleva a /mercado/#id), inglés y archivo caído. Sin red. */
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
const TEXTO = fs.readFileSync(path.join(RAIZ, 'rwadar-site/datos/noticias-v2.json'), 'utf8');
const DATOS = modelo.validarNoticias(JSON.parse(TEXTO));
const lee = r => fs.readFileSync(path.join(RAIZ, r), 'utf8');

/* Lo que depende de la edición (fechas, fuentes y relojes de «Hoy» y «Ayer») sale
   del archivo publicado, sin pasar por el motor: así una edición nueva no rompe la prueba. */
// n días después de una fecha AAAA-MM-DD (o antes, si n < 0).
const masDias = (iso, n) => { const f = new Date(`${iso}T12:00:00Z`); f.setUTCDate(f.getUTCDate() + n); return f.toISOString().slice(0, 10); };
const ddmmaaaa = iso => iso.split('-').reverse().join('/');
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const enCorta = iso => { const [a, mes, dia] = iso.split('-').map(Number); return `${dia} ${MESES_EN[mes - 1]} ${a}`; };
const enBreve = iso => enCorta(iso).replace(/ \d{4}$/, '');
// La fuente corta, como la escribe RWAdar: lo que va antes de la primera coma.
const corta = n => n.fuente.nombre.split(',')[0].trim();
const CATEGORIA_ES = { regulacion: 'Regulación', mercado: 'Mercado', producto: 'Producto', riesgo: 'Riesgo' };
const CATEGORIA_EN = { regulacion: 'Regulation', mercado: 'Market', producto: 'Product', riesgo: 'Risk' };
const AMBITO_EN = { 'España': 'Spain', UE: 'EU', Mundo: 'World' };
// La noticia de «hoy» va primero; su fecha marca los relojes (en la edición del 12/11, el 11/11):
// su día («Hoy»), el siguiente (el del ciclo: «Ayer») y dos después (sin ciclo nuevo: ni «Hoy» ni «Ayer»).
/* La prueba en Chromium usa una edición fija con una de «hoy» (la del 12/11/2026,
   rwadar-movil/fixtures/noticias-ejemplo.json): el servidor local la sirve en lugar
   de la publicada, así una edición sin «hoy» o con menos noticias no la rompe. */
const TEXTO_EJ = fs.readFileSync(path.join(RAIZ, 'rwadar-movil/fixtures/noticias-ejemplo.json'), 'utf8');
const DATOS_EJ = modelo.validarNoticias(JSON.parse(TEXTO_EJ));
const HOY = DATOS_EJ.noticias[0].fecha;
const aMediodia = iso => { const [a, mes, dia] = iso.split('-').map(Number); return new Date(a, mes - 1, dia, 12, 0); };

test('/datos/noticias-v2.json (y el v1 de la app instalada) se publican como recurso estático, validados, con su caché y la copia exacta del motor', () => {
  assert.equal(copiaWeb.alDia(), true, 'ejecuta node rwadar-app/noticias/copiar-modelo-web.cjs');
  const { ARCHIVOS_PUBLICABLES, RUTAS_CONTENIDO_APROBADO } = require('../rwadar-publicacion-segura.js');
  for (const archivo of ['datos/noticias.json', 'datos/noticias-v2.json', 'assets/noticias-sector-modelo-20261110.js', 'assets/noticias-sector-20261110.js', 'assets/noticias-sector-20261110.css']) {
    assert.ok(ARCHIVOS_PUBLICABLES.includes(archivo), archivo);
  }
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-movil/lib/noticias-sector.js'));
  assert.match(lee('rwadar-site/_headers'), /\n\/datos\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n {2}X-Robots-Tag: noindex\n/);
  // El generador valida la forma antes de publicar y se para si no vale.
  const publicador = lee('rwadar-publicar.js');
  assert.match(publicador, /noticiasModelo\.validarNoticias\(JSON\.parse\(textoNoticias\)\)/);
  assert.match(publicador, /throw new Error\(`rwadar-site\/datos\/noticias-v2\.json no vale: /);
  // Al publicar, cada noticia lleva su foto; al leer, «imagen» es opcional (fondo oscuro).
  assert.match(publicador, /noticiasModelo\.noticiasSinFoto\(/);
  const { imagen, ...sinFoto } = JSON.parse(TEXTO).noticias[0];
  assert.ok(imagen);
  const leida = modelo.validarNoticias({ ...JSON.parse(TEXTO), noticias: [sinFoto] });
  assert.equal(modelo.rutaFoto(leida.noticias[0]), null);
  assert.deepEqual(modelo.noticiasSinFoto({ noticias: [sinFoto] }), [sinFoto.id]);
  // El v1 (/datos/noticias.json) es el v2 sin «imagen» y lo acepta el motor congelado de la app instalada (26664c9).
  const v1 = require('../rwadar-app/noticias/noticias-v1.cjs');
  assert.deepEqual(v1.comprobar(), []);
  const textoV1 = lee('rwadar-site/datos/noticias.json');
  assert.equal(textoV1, v1.derivarV1(TEXTO));
  assert.equal(v1.validarComoAppInstalada(textoV1).noticias.length, DATOS.noticias.length);
  assert.throws(() => v1.validarComoAppInstalada(TEXTO), /forma inesperada \(«imagen»\)/, 'la app instalada rechaza el v2: por eso hay dos archivos');
  assert.match(publicador, /noticiasV1\.validarComoAppInstalada\(textoNoticiasV1\)/);
  // Con la historia de Git a mano, la copia congelada es la de 26664c9 byte a byte (su sha256 ya va fijado en noticias-v1.cjs).
  let original = null;
  try { original = execSync('git show 26664c9:rwadar-movil/lib/noticias-sector.js', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* sin historia */ }
  if (original !== null) assert.equal(original, lee('rwadar-app/noticias/motor-app-26664c9.cjs'));
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-app/noticias/noticias-v1.cjs') && RUTAS_CONTENIDO_APROBADO.includes('rwadar-app/noticias/motor-app-26664c9.cjs'));
  // El script de la sección no usa innerHTML ni habla con nadie más que con su propio sitio.
  const js = lee('rwadar-site/assets/noticias-sector-20261110.js');
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|outerHTML|document\.write|https?:\/\/(?!www\.w3\.org\/2000\/svg')/);
  assert.deepEqual([...js.matchAll(/'(\/(?:api|datos)\/[^']+)'/g)].map(m => m[1]), ['/datos/noticias-v2.json']);
  assert.match(js, /rel = 'noopener noreferrer'/);
  // En el HTML no hay ninguna noticia: en Inicio, dentro de «Mercado y noticias» (11/11/2026), tras la cotización y antes de «Aprende»; en /mercado/, la lista.
  const html = lee('rwadar-site/index.html');
  const inicio = html.indexOf('<section class="ini-bloque mk mk--inicio nt nt--portada" id="mercado"'), fin = html.indexOf('</section>', inicio);
  assert.ok(inicio > html.indexOf('id="relNuevas"') && inicio < html.indexOf('id="iniAprendeTit"'));
  const seccion = html.slice(inicio, fin);
  assert.ok(seccion.indexOf('id="mkCuerpo"') < seccion.indexOf('id="ntLista"'));
  for (const n of DATOS.noticias) assert.ok(!seccion.includes(n.titulo) && !seccion.includes(n.fuente.url));
  assert.ok(html.indexOf('/assets/noticias-sector-modelo-20261110.js') < html.indexOf('/assets/noticias-sector-20261110.js'));
  const pagina = lee('rwadar-site/mercado/index.html');
  for (const n of DATOS.noticias) assert.ok(!pagina.includes(n.titulo));
  assert.ok(pagina.indexOf('/assets/noticias-sector-modelo-20261110.js') < pagina.indexOf('/assets/noticias-sector-20261110.js'));
  // Las fotos: cada clave usada sale de la biblioteca y se publica en /noticias-editoriales/ (como /ofertas-editoriales/).
  assert.match(publicador, /cargarFotosNoticias\(__dirname\)/);
  assert.match(publicador, /\.\.\.fotosNoticias\.publicables\.map\(activo => activo\.salida\)/);
  assert.match(lee('rwadar-site/_headers'), /\n\/noticias-editoriales\/\*\n {2}Cache-Control: public, max-age=0, must-revalidate\n/);
  // Se aprueba lo que se publica (manifiesto y WebP), no el script que genera las fotos.
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-editorial-source/noticias/fotos.json') &&
    RUTAS_CONTENIDO_APROBADO.includes('rwadar-editorial-source/noticias/fotos') && RUTAS_CONTENIDO_APROBADO.includes('rwadar-noticias-editoriales.js'));
  assert.ok(!RUTAS_CONTENIDO_APROBADO.includes('rwadar-editorial-source/noticias'));
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
  await pagina.route('**/noticias-editoriales/**', r => { pedidas.push(new URL(r.request().url()).pathname); return r.fulfill({ status: 200, contentType: 'image/webp', body: FOTO_PRUEBA }); });
}

test('en Chromium: Inicio con la portada y dos tarjetas en «Mercado y noticias»; /mercado/ con las 6, teclado, diálogo, #id, /noticias/#id, inglés y archivo caído', { skip: sinNavegador, timeout: 180000 }, async () => {
  // El dato de hoy no importa aquí: su API se corta y la cotización usa la copia estática.
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0,
    responder: async url => (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
  const navegador = await playwright.chromium.launch();
  // Cada página recibe la edición de ejemplo en lugar de la publicada (una ruta añadida después, como la del archivo caído, manda sobre esta).
  const abrirPagina = navegador.newPage.bind(navegador);
  navegador.newPage = async (...a) => {
    const p = await abrirPagina(...a);
    await p.route('**/datos/noticias-v2.json', r => r.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: TEXTO_EJ }));
    return p;
  };
  const n0 = DATOS_EJ.noticias[0];
  try {
    for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
      // ---- Inicio ----
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      // Reloj fijo: a mediodía del día de la noticia de «hoy» («Hoy» y «Ayer» dependen de él).
      await pagina.clock.setFixedTime(aMediodia(HOY));
      const errores = [], terceros = [], pedidas = [];
      pagina.on('pageerror', e => errores.push(e.message));
      pagina.on('request', r => { const u = new URL(r.url()); if (u.origin !== new URL(local.url).origin) terceros.push(u.href); });
      await conFotos(pagina, pedidas);
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('mercado').scrollIntoView());
      await pagina.waitForFunction(() => [...document.querySelectorAll('#ntLista img')].every(i => i.complete && i.naturalWidth > 0));
      const m = await pagina.evaluate(() => {
        const s = document.getElementById('mercado'), l = document.getElementById('ntLista');
        const filas = [...l.querySelectorAll('a[data-nt-id]')];
        const tit = filas[1].querySelector('.nt-t-tit'), estilo = getComputedStyle(tit);
        const foto = filas[0].querySelector('.nt-p-foto').getBoundingClientRect();
        const fuera = [...s.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        return {
          n: filas.length, tipos: filas.map(a => a.tagName), href: filas.map(a => a.getAttribute('href')),
          conEtiqueta: filas.filter(b => b.hasAttribute('aria-label')).length,
          hoy: filas.filter(b => b.querySelector('.nt-hoy')?.textContent === 'Hoy').map(b => b.dataset.ntId),
          ayer: filas.filter(b => b.querySelector('.nt-hoy--ayer')?.textContent === 'Ayer').map(b => b.dataset.ntId),
          meta: filas.map(a => a.querySelector('.nt-meta').textContent),
          fotos: filas.map(a => { const i = a.querySelector('img'); return i && i.getAttribute('src'); }),
          altVacio: filas.every(a => a.querySelector('img').getAttribute('alt') === '' && a.querySelector('[class$="-foto"]').getAttribute('aria-hidden') === 'true'),
          portadaGrande: foto.width >= 300 && foto.height >= 200, primera: filas[0].className, svg: l.querySelectorAll('svg').length,
          anchoPagina: document.documentElement.scrollWidth, fuera: fuera.length,
          clamp: estilo.webkitLineClamp, entero: [...l.querySelectorAll('.nt-p-tit,.nt-t-tit')].every(t => getComputedStyle(t).overflow === 'visible' && t.getBoundingClientRect().bottom <= t.closest('a,article').getBoundingClientRect().bottom + 1), color: estilo.color,
          fecha: document.getElementById('ntFecha').textContent, cabecera: document.getElementById('ntTit').textContent,
          bloque: document.getElementById('mkTit').textContent,
          ver: s.querySelector('a.ini-ver[href="/mercado/"]')?.textContent.trim(), nota: document.getElementById('ntNota').textContent,
          traCotizacion: document.getElementById('mkCuerpo').compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING,
          dialogo: !!document.getElementById('ntDialogo'),
        };
      });
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      assert.deepEqual(terceros, [], `${ancho}: el navegador no pide nada a terceros`);
      assert.equal(m.n, 3, 'en Inicio, solo 3');
      assert.ok(m.tipos.every(t => t === 'A'));
      assert.deepEqual(m.href, DATOS_EJ.noticias.slice(0, 3).map(n => `/mercado/#${n.id}`));
      assert.equal(m.conEtiqueta, 0, 'el nombre sale del texto visible, no de un aria-label');
      assert.deepEqual(m.hoy, [n0.id], 'el día de la de hoy, «Hoy» solo en ella');
      assert.deepEqual(m.ayer, DATOS_EJ.noticias.slice(0, 3).filter(n => n.fecha === masDias(HOY, -1)).map(n => n.id),
        'y «Ayer» en las del día anterior (en la edición del 12/11, ninguna de las 3; al día siguiente, más abajo)');
      assert.equal(m.meta[0], `${corta(n0)} · ${ddmmaaaa(n0.fecha)} Hoy`, 'la fuente y la fecha, en pequeño');
      assert.deepEqual(m.fotos, DATOS_EJ.noticias.slice(0, 3).map(n => `/noticias-editoriales/${n.imagen}.webp`));
      assert.ok(pedidas.length >= 1 && pedidas.every(r => /^\/noticias-editoriales\/(?:(?:480|960)\/)?[a-z0-9-]+\.webp$/.test(r)));
      assert.ok(m.altVacio, 'la foto es decorativa: el titular ya lo dice');
      assert.ok(m.portadaGrande, 'la primera, de portada con la foto grande');
      assert.equal(m.primera, 'nt-p');
      assert.equal(m.svg, 0, 'sin ilustraciones SVG');
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal de la página`);
      assert.equal(m.fuera, 0);
      assert.equal(m.clamp, 'none', 'los titulares no se cortan');
      assert.ok(m.entero, 'ningún titular recortado');
      assert.equal(m.color, 'rgb(247, 245, 240)');
      assert.equal(m.bloque, 'Mercado y noticias');
      assert.equal(m.cabecera, 'Noticias');
      assert.equal(m.fecha, `Actualizadas el ${ddmmaaaa(DATOS_EJ.actualizadoEl).slice(0, 5)}`);
      assert.equal(m.ver, 'Ver mercado y noticias→');
      assert.equal(m.nota, 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.');
      assert.ok(m.traCotizacion, 'debajo de la cotización');
      assert.equal(m.dialogo, false, 'en Inicio no hay detalle: está en /mercado/');
      for (const n of DATOS_EJ.noticias.slice(0, 3)) {
        const cual = modelo.etiquetaReciente(n, HOY);
        const meta = `${n.fuente.nombre.split(',')[0].trim()} · ${modelo.fechaCorta(n.fecha)}`;
        assert.equal(await pagina.getByRole('link', { name: `${n.titulo} ${meta}${cual ? ' ' + cual : ''}`, exact: true }).count(), 1, n.titulo);
      }
      // Tocar una lleva a /mercado/ con su detalle abierto.
      await pagina.click(`#ntLista [data-nt-id="${DATOS_EJ.noticias[1].id}"]`);
      await pagina.waitForURL(/\/mercado\/#/);
      await pagina.waitForSelector('#ntDialogo[open]', { timeout: 20000 });
      assert.equal(await pagina.textContent('#ntDlgTit'), DATOS_EJ.noticias[1].titulo);
      await pagina.keyboard.press('Escape');
      await pagina.close();

      // ---- Inicio, al día siguiente (el del ciclo): la de hoy ya dice «Ayer», en su fila y en su detalle ----
      const ayer = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      await ayer.clock.setFixedTime(aMediodia(masDias(HOY, 1)));
      await conFotos(ayer, []);
      await ayer.goto(local.url + '/', { waitUntil: 'load' });
      await ayer.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      const a = await ayer.evaluate(() => {
        const filas = [...document.querySelectorAll('#ntLista a[data-nt-id]')];
        return { hoy: filas.filter(b => b.querySelector('.nt-hoy')?.textContent === 'Hoy').map(b => b.dataset.ntId),
          ayer: filas.filter(b => b.querySelector('.nt-hoy--ayer')?.textContent === 'Ayer').map(b => b.dataset.ntId),
          meta: filas[0].querySelector('.nt-meta').textContent };
      });
      assert.deepEqual(a.hoy, [], `${ancho}: al día siguiente, ninguna dice «Hoy»`);
      assert.deepEqual(a.ayer, DATOS_EJ.noticias.slice(0, 3).filter(n => n.fecha === HOY).map(n => n.id), 'y la de hoy dice «Ayer»');
      assert.equal(a.meta, `${corta(n0)} · ${ddmmaaaa(n0.fecha)} Ayer`);
      assert.equal(await ayer.getByRole('link', { name: `${n0.titulo} ${corta(n0)} · ${ddmmaaaa(n0.fecha)} Ayer`, exact: true }).count(), 1);
      await ayer.click(`#ntLista [data-nt-id="${n0.id}"]`);
      await ayer.waitForURL(/\/mercado\/#/);
      await ayer.waitForSelector('#ntDialogo[open]', { timeout: 20000 });
      const textoAyer = await ayer.textContent('#ntDialogo');
      assert.ok(!textoAyer.includes('Hoy') && textoAyer.includes('Ayer'), `del ${ddmmaaaa(n0.fecha)}, al día siguiente: «Ayer», no «Hoy»`);
      await ayer.close();

      // ---- /mercado/, debajo del gráfico ----
      const lista = await navegador.newPage({ viewport: { width: ancho, height: alto } });
      await lista.clock.setFixedTime(aMediodia(HOY));
      const erroresL = [];
      lista.on('pageerror', e => erroresL.push(e.message));
      await conFotos(lista, []);
      await lista.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await lista.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      const l = await lista.evaluate(() => {
        const portada = document.querySelector('#ntLista .nt-v-portada article.nt-p');
        const foto = portada.querySelector('.nt-p-foto').getBoundingClientRect();
        return {
          n: document.querySelectorAll('#ntLista article').length, botones: [...document.querySelectorAll('#ntLista .nt-abrir')].map(b => b.tagName + ':' + b.type),
          titulos: [...document.querySelectorAll('#ntLista .nt-titular')].map(h => h.tagName),
          resumen: document.querySelector('#ntLista .nt-v-importa').textContent, sinResumen: document.querySelectorAll('#ntLista article p').length,
          meta: document.querySelector('#ntLista .nt-meta').textContent, portadaGrande: foto.width >= 300,
          anchoPagina: document.documentElement.scrollWidth, h1: document.querySelector('h1').textContent, h2: document.getElementById('ntTit').textContent,
          traGrafico: document.getElementById('tokenizacion').compareDocumentPosition(document.getElementById('noticias')) & Node.DOCUMENT_POSITION_FOLLOWING,
        };
      });
      assert.deepEqual(erroresL, []);
      assert.equal(l.n, 6, 'las 6');
      assert.ok(l.botones.every(b => b === 'BUTTON:button'));
      assert.ok(l.titulos.every(t => t === 'H3'), 'bajo «Noticias relacionadas» (h2), los titulares son h3');
      assert.equal(l.resumen, `Por qué te importa: ${DATOS_EJ.noticias[0].porQueImporta}`, 'debajo de la portada, por qué te importa');
      assert.equal(l.sinResumen, 0, 'las tarjetas, solo titular, fuente y fecha (el resumen, en el detalle)');
      assert.equal(l.meta, `${corta(n0)} · ${ddmmaaaa(n0.fecha)} Hoy`);
      assert.ok(l.portadaGrande, 'la portada, con la foto grande');
      assert.equal(l.anchoPagina, ancho);
      assert.equal(l.h1, 'Mercado de activos tokenizados');
      assert.equal(l.h2, 'Noticias relacionadas');
      assert.ok(l.traGrafico, 'debajo del gráfico');
      // Teclado: el botón del titular abre el diálogo con el foco en «Cerrar».
      await lista.focus(`#ntLista [data-nt-id="${DATOS_EJ.noticias[1].id}"]`);
      await lista.keyboard.press('Enter');
      await lista.waitForSelector('#ntDialogo[open]');
      const n = DATOS_EJ.noticias[1];
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
      // La segunda es de «importante»: nunca «Hoy»; «Ayer» solo si es del día anterior (en la edición del 12/11, no: es del 09/11).
      const cual = n.fecha === masDias(HOY, -1) ? 'Ayer' : null;
      for (const e of ['Hoy', 'Ayer']) assert.equal(d.texto.includes(e), e === cual, `del ${ddmmaaaa(n.fecha)}: ${cual ? `«${cual}»` : 'ni «Hoy» ni «Ayer»'} (${e})`);
      assert.ok(!d.texto.includes(n.tituloInformativo), 'sin repetir el titular con otras palabras');
      assert.equal(d.flechaSola, false, 'la flecha va dentro del texto del botón');
      for (const parte of [ddmmaaaa(n.fecha), CATEGORIA_ES[n.categoria], n.ambito, ...(cual ? [cual] : []), n.resumen, 'Por qué te importa', n.porQueImporta, 'Fuente', n.fuente.nombre,
        `Consultada el ${ddmmaaaa(n.consultadaEl)}`, 'Selección editorial de RWAdar con enlace a la fuente. No es una recomendación.']) assert.ok(d.texto.includes(parte), parte);
      assert.equal(d.href, n.fuente.url);
      assert.equal(d.target, '_blank');
      assert.equal(d.rel, 'noopener noreferrer');
      assert.equal(d.enlace.trim(), 'Leer en la fuente (sales de RWAdar)\u00a0↗');
      assert.ok(d.dentro);
      // Escape cierra y el foco vuelve al titular.
      await lista.keyboard.press('Escape');
      // La clase se quita en «close», que llega después de quitar [open]: se esperan las dos.
      await lista.waitForFunction(() => !document.getElementById('ntDialogo').open && !document.documentElement.classList.contains('nt-dialogo-abierto'));
      assert.equal(await lista.evaluate(() => document.activeElement.dataset.ntId), n.id);
      // Con el ratón: la fila entera abre; «×» cierra.
      await lista.click(`#ntLista #${DATOS_EJ.noticias[3].id} article`, { position: { x: 30, y: 30 } });
      await lista.waitForSelector('#ntDialogo[open]');
      await lista.click('#ntDialogo [data-nt-cerrar]');
      await lista.waitForFunction(() => !document.getElementById('ntDialogo').open && !document.documentElement.classList.contains('nt-dialogo-abierto'));
      // En inglés: los campos «en» de cada noticia y la interfaz del diccionario.
      await lista.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await lista.waitForFunction(() => document.getElementById('ntTit').textContent === 'Related news');
      const en = await lista.evaluate(() => ({ fecha: document.getElementById('ntFecha').textContent,
        primero: document.querySelector('#ntLista .nt-titular').textContent, hoy: document.querySelector('#ntLista .nt-hoy').textContent,
        nota: document.getElementById('ntNota').textContent, h1: document.querySelector('h1').textContent }));
      assert.deepEqual(en, { fecha: `Updated on ${enBreve(DATOS_EJ.actualizadoEl)}`, primero: DATOS_EJ.noticias[0].en.titulo, hoy: 'Today',
        nota: 'Illustrative AI-generated images, not photos of the news.', h1: 'Tokenised asset market' });
      await lista.click(`#ntLista [data-nt-id="${DATOS_EJ.noticias[0].id}"]`);
      await lista.waitForSelector('#ntDialogo[open]');
      const dEn = await lista.evaluate(() => document.getElementById('ntDialogo').textContent);
      for (const parte of [enCorta(n0.fecha), CATEGORIA_EN[n0.categoria], AMBITO_EN[n0.ambito], DATOS_EJ.noticias[0].en.resumen, 'Why it matters to you', DATOS_EJ.noticias[0].en.porQueImporta,
        'Checked on', 'Read at the source (you leave RWAdar)', 'Original source text (Spanish)']) assert.ok(dEn.includes(parte), parte);
      await lista.keyboard.press('Escape');
      await lista.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
      await lista.close();
    }
    // /noticias/ y /noticias/#<id> siguen funcionando: llevan a /mercado/ (#noticias o el detalle de esa noticia).
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await conFotos(pagina, []);
      await pagina.goto(local.url + '/noticias/#' + DATOS_EJ.noticias[2].id, { waitUntil: 'load' });
      await pagina.waitForSelector('#ntDialogo[open]', { timeout: 20000 });
      assert.equal(new URL(pagina.url()).pathname, '/mercado/');
      assert.equal(await pagina.textContent('#ntDlgTit'), DATOS_EJ.noticias[2].titulo);
      await pagina.goto(local.url + '/noticias/', { waitUntil: 'load' });
      await pagina.waitForURL(/\/mercado\/#noticias$/);
      await pagina.close();
    }
    // Dos días después de la de hoy (en la edición del 12/11, el 13/11), sin ciclo nuevo: ni «Hoy» ni «Ayer», y las de hoy siguen primero.
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.clock.setFixedTime(aMediodia(masDias(HOY, 2)));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      assert.equal(await pagina.locator('#ntLista .nt-hoy').count(), 0);
      assert.equal(await pagina.getAttribute('#ntLista a[data-nt-id]', 'data-nt-id'), DATOS_EJ.noticias[0].id);
      await pagina.close();
    }
    // Una foto que no carga: se quita y queda el fondo oscuro; el titular sigue.
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.route('**/noticias-editoriales/**', r => r.fulfill({ status: 404, body: '' }));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('mercado').scrollIntoView());
      await pagina.waitForFunction(() => document.querySelectorAll('#ntLista .nt-foto--sin').length === 3);
      assert.equal(await pagina.locator('#ntLista img').count(), 0);
      assert.equal(await pagina.locator('#ntLista .nt-p-tit, #ntLista .nt-t-tit').count(), 3);
      await pagina.close();
    }
    // Sin el archivo: lo dice, sin ninguna noticia, y el resto de Inicio sigue.
    const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
    await pagina.route('**/datos/noticias-v2.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"version":1,"noticias":[]}' }));
    await pagina.goto(local.url + '/', { waitUntil: 'load' });
    await pagina.waitForSelector('#mercado[data-noticias-estado="sin-datos"]', { timeout: 20000 });
    assert.equal(await pagina.textContent('#ntEstado'), 'Ahora no podemos mostrar las noticias. Vuelve a intentarlo más tarde.');
    assert.equal(await pagina.isVisible('#ntLista'), false);
    assert.ok(await pagina.isVisible('#relPortada'));
    await pagina.close();
  } finally { await navegador.close(); await local.cerrar(); }
});

/* ---- Noticias que entran por los ojos (14/11/2026): las noticias de Inicio escritas en el HTML publicado ---- */
const portadaNt = require('../rwadar-noticias-portada.js');
// Una edición fija (no la viva): un PR de las noticias de la mañana no depende de estas pruebas.
const TEXTO_VIS = lee('rwadar-acceso/fixtures/noticias-visual.json');
const VIS = JSON.parse(TEXTO_VIS);

test('el HTML de las noticias de Inicio: portada y dos tarjetas con los atributos del modelo, escapado y sin estilos en línea', () => {
  const datos = modelo.validarNoticias(VIS);
  const h = portadaNt.htmlNoticiasInicio(VIS);
  assert.deepEqual([...h.matchAll(/<li\b[^>]*>/g)].map(m => m[0]), ['<li class="nt-v-portada">', '<li>', '<li>']);
  const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  assert.equal(imgs.length, 3);
  imgs.forEach((img, i) => {
    const a = modelo.atributosFoto(datos.noticias[i], i === 0 ? 'portada' : 'tarjeta');
    assert.ok(img.includes(` src="${a.src}"`) && img.includes(` srcset="${a.srcset}"`) && img.includes(` sizes="${a.sizes}"`), img);
    assert.ok(img.includes(' alt=""') && img.includes(' decoding="async"') && img.includes(' width="1200" height="800"'));
    assert.equal(/\sloading=/.test(img), i > 0, i === 0 ? 'la portada, sin loading' : 'las tarjetas, perezosas');
  });
  assert.doesNotMatch(h, /\sstyle\s*=|\son[a-z]+\s*=/, 'la CSP no admite estilos en línea');
  // Los textos, escapados: & " ' y = (los que deja pasar el validador).
  assert.ok(h.includes('>Bonos &quot;verdes&quot; &amp; pagarés: 11 firmas sin registro<'));
  assert.ok(h.includes('>L&#39;Europe: los 27 piden un tope 50 veces mayor<'));
  assert.ok(h.includes('>Deuda onchain&#61;menos costes, según el emisor de Robinhood<'));
  assert.equal(portadaNt.esc('<b>x</b> & "y" \'z\' a=b'), '&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot; &#39;z&#39; a&#61;b');
  // Un titular con marcado ni siquiera se escribe: la función valida la edición antes.
  const conB = structuredClone(VIS); conB.noticias[0].titulo = '<b>x</b>';
  assert.throws(() => portadaNt.htmlNoticiasInicio(conB), /caracteres no permitidos/);
  // Ni «Hoy» ni «Ayer» (dependen del día de quien mira: los pone el JS).
  assert.doesNotMatch(h, /nt-hoy|>Hoy<|>Ayer</);
  // Enlaces a su detalle, el titular primero en el DOM y la píldora oculta al lector.
  for (const n of datos.noticias.slice(0, 3)) assert.ok(h.includes(`href="/mercado/#${n.id}" data-nt-id="${n.id}"`));
  assert.match(h, /<span class="nt-p-cat nt-cat--riesgo" aria-hidden="true">Riesgo<\/span><span class="nt-p-tit"/);
  // Con 1 noticia, la portada sola; con 2, la portada y una tarjeta ancha (sin hueco al lado).
  const una = portadaNt.htmlNoticiasInicio({ ...VIS, noticias: VIS.noticias.slice(0, 1) });
  assert.deepEqual([...una.matchAll(/<li\b[^>]*>/g)].map(m => m[0]), ['<li class="nt-v-portada">']);
  const dos = portadaNt.htmlNoticiasInicio({ ...VIS, noticias: VIS.noticias.slice(0, 2) });
  assert.deepEqual([...dos.matchAll(/<li\b[^>]*>/g)].map(m => m[0]), ['<li class="nt-v-portada">', '<li class="nt-v-ancha">']);
  assert.ok(dos.includes(` sizes="${modelo.SIZES.anchaDos}"`));
});

test('el HTML de Inicio no depende del reloj ni del huso: misma edición, mismos bytes', () => {
  const ruta = path.join(RAIZ, 'rwadar-noticias-portada.js'), fixture = path.join(RAIZ, 'rwadar-acceso/fixtures/noticias-visual.json');
  const correr = (tz, ms) => execSync(`${JSON.stringify(process.execPath)} -e ${JSON.stringify(
    `const R=Date;globalThis.Date=class extends R{constructor(...a){super(...(a.length?a:[${ms}]))}static now(){return ${ms}}};` +
    `const p=require(${JSON.stringify(ruta)});process.stdout.write(p.htmlNoticiasInicio(JSON.parse(require('fs').readFileSync(${JSON.stringify(fixture)},'utf8'))))`)}`,
  { encoding: 'utf8', env: { ...process.env, TZ: tz } });
  const a = correr('Pacific/Kiritimati', Date.UTC(2026, 10, 13, 23, 30)), b = correr('America/Adak', Date.UTC(2027, 0, 2, 3, 0));
  assert.ok(a.length > 1000);
  assert.equal(a, b);
  assert.equal(a, portadaNt.htmlNoticiasInicio(VIS));
});

test('el index.html publicado: las noticias dentro de #ntLista, con su firma, «Cargando…» oculto y la nota visible; si algo no cuadra, se para', () => {
  const fuente = lee('rwadar-site/index.html');
  const salida = portadaNt.prepararInicioPublicado(fuente, VIS);
  const ul = salida.match(/<ul class="nt-v" id="ntLista"([^>]*)>([\s\S]*?)<\/ul>/);
  assert.ok(ul);
  assert.equal(ul[1], ` aria-labelledby="ntTit" data-nt-prepintado="${modelo.firmaPrepintado(modelo.validarNoticias(VIS))}"`, 'sin hidden y con la firma');
  assert.equal(ul[2], portadaNt.htmlNoticiasInicio(VIS));
  assert.ok(salida.includes('<p class="nt-estado" id="ntEstado" role="status" hidden>Cargando las noticias…</p>'));
  assert.ok(salida.includes('<p class="nt-nota" id="ntNota">Imágenes ilustrativas generadas con IA, no fotos de la noticia.</p>'));
  // Fuera de la lista, el resto de la página no cambia.
  assert.equal(portadaNt.sinNoticiasInicio(salida), fuente);
  // Sin la lista vacía (o ya escrita), se para.
  assert.throws(() => portadaNt.inyectarNoticiasInicio(salida, VIS), /lista de noticias/);
  assert.throws(() => portadaNt.inyectarNoticiasInicio(fuente.replace('id="ntLista"', 'id="otraLista"'), VIS), /lista de noticias/);
  assert.throws(() => portadaNt.inyectarNoticiasInicio(fuente.replace(' role="status">Cargando las noticias…', ' role="status">Cargando…'), VIS), /Cargando/);
  // La regla de la CSP mira todo el HTML: un titular con « onchain=» la dispararía sin el escape.
  assert.throws(() => portadaNt.validaMarcadoEstricto('x', '<p> onchain=menos</p>'), /CSP/);
  portadaNt.validaMarcadoEstricto('x', salida);
  // Dos ediciones distintas: el HTML publicado cambia, pero sin las noticias es el mismo
  // (lo que compara la mañana automática entre `main` y producción).
  const otra = portadaNt.prepararInicioPublicado(fuente, JSON.parse(TEXTO));
  assert.notEqual(otra, salida);
  assert.equal(portadaNt.sinNoticiasInicio(otra), portadaNt.sinNoticiasInicio(salida));
  // El publicador lo aplica al index.html de la carpeta temporal, tras validar y revisar la guía; nunca a rwadar-site/index.html.
  const publicador = lee('rwadar-publicar.js');
  assert.match(publicador, /const inicioTemporal = path\.join\(temporal, 'index\.html'\);\n\s*fs\.writeFileSync\(inicioTemporal, prepararInicioPublicado\(fs\.readFileSync\(inicioTemporal, 'utf8'\), noticias\), 'utf8'\);/);
  assert.ok(publicador.indexOf('noticiasModelo.revisarEdicion(') < publicador.indexOf('prepararInicioPublicado(fs.readFileSync'));
  assert.doesNotMatch(publicador, /writeFileSync\(FILE[^\n]*(?:prepararInicio|inyectarNoticias)/);
  assert.doesNotMatch(publicador, /function validaMarcadoEstricto/, 'una sola regla de la CSP, la del módulo');
  // Y el módulo entra en la compuerta del sello.
  const { RUTAS_CONTENIDO_APROBADO } = require('../rwadar-publicacion-segura.js');
  assert.ok(RUTAS_CONTENIDO_APROBADO.includes('rwadar-noticias-portada.js'));
  // La edición viva también pasa el camino entero del publicador (la mañana lo hace antes de su PR).
  portadaNt.prepararInicioPublicado(fuente, JSON.parse(TEXTO));
  assert.deepEqual(modelo.revisarEdicion(JSON.parse(TEXTO)).errores, []);
});

test('la biblioteca de fotos: el comprobador para con una variante cambiada, que falta o que sobra, de otro tamaño, o con temas y genéricas mal', async () => {
  const fotosMod = require('../rwadar-noticias-editoriales.js');
  // sharp solo está en las dependencias de la raíz: la CI de la batería no la instala.
  // Sin ella se salta solo el caso que fabrica una variante de otro tamaño.
  let sharp = null;
  try { sharp = require('sharp'); } catch { /* sin sharp: se omite ese caso */ }
  const os = require('node:os');
  const real = fotosMod.cargarFotosNoticias(RAIZ, { claves: [] });
  assert.ok(real.variantes.length === real.fotos.length * 2);
  assert.ok(real.publicables.some(f => f.salida === `noticias-editoriales/480/${real.fotos[0].clave}.webp`));
  const caso = async (nombre, romper, error) => {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fotos-'));
    try {
      fs.cpSync(path.join(RAIZ, 'rwadar-editorial-source/noticias'), path.join(raiz, 'rwadar-editorial-source/noticias'), { recursive: true });
      const dir = path.join(raiz, 'rwadar-editorial-source/noticias');
      const spec = JSON.parse(fs.readFileSync(path.join(dir, 'fotos.json'), 'utf8'));
      await romper(dir, spec);
      fs.writeFileSync(path.join(dir, 'fotos.json'), JSON.stringify(spec));
      assert.throws(() => fotosMod.cargarFotosNoticias(raiz, { claves: [] }), error, nombre);
    } finally { fs.rmSync(raiz, { recursive: true, force: true }); }
  };
  const clave = real.fotos[0].clave;
  await caso('un byte cambiado en 480', dir => { const p = path.join(dir, 'fotos/480', clave + '.webp'); const b = fs.readFileSync(p); b[b.length - 1] ^= 1; fs.writeFileSync(p, b); }, /480\/.*no coinciden/);
  await caso('falta la de 960', dir => fs.rmSync(path.join(dir, 'fotos/960', clave + '.webp')), /falta la foto .*960/);
  await caso('sobra un archivo en 480', dir => fs.writeFileSync(path.join(dir, 'fotos/480/sobra.webp'), 'x'), /no permitido.*480\/sobra\.webp/);
  await caso('sobra una carpeta', dir => fs.mkdirSync(path.join(dir, 'fotos/720')), /no permitido.*720/);
  if (sharp) await caso('variante de 480 × 300 (con sus bytes y su sha256 al día)', async (dir, spec) => {
    // La propia foto, reducida a 480 × 300: pesa como una variante de verdad.
    const b = await sharp(path.join(dir, 'fotos', clave + '.webp')).resize(480, 300, { fit: 'fill' }).webp({ quality: 80 }).toBuffer();
    assert.ok(b.length > 1024 && b.length <= 60000);
    fs.writeFileSync(path.join(dir, 'fotos/480', clave + '.webp'), b);
    spec.fotos[clave].variantes['480'] = { bytes: b.length, sha256: require('node:crypto').createHash('sha256').update(b).digest('hex') };
  }, /tamaño de 480\//);
  await caso('un tema que no está en la lista', (dir, spec) => { spec.fotos[clave].temas = ['inventado']; }, /temas/);
  await caso('un tema sin ninguna foto', (dir, spec) => { spec.temas.sin_foto_prueba = 'Sin foto'; spec.temas['sin-foto-prueba'] = 'Sin foto'; delete spec.temas.sin_foto_prueba; }, /temas sin ninguna foto: sin-foto-prueba/);
  await caso('una genérica que no existe', (dir, spec) => { spec.genericas.riesgo = 'no-existe'; }, /genericas/);
  await caso('falta una categoría en las genéricas', (dir, spec) => { delete spec.genericas.mercado; }, /genericas/);
  await caso('sin variantes declaradas', (dir, spec) => { delete spec.fotos[clave].variantes; }, /variantes/);
});

test('en Chromium, sobre la web construida: Inicio llega con las noticias escritas, el JS no las rehace, el velo se lee con una foto blanca, la letra grande y el movimiento reducido', { skip: sinNavegador || (!fs.existsSync(path.join(RAIZ, 'rwadar-publicado/index.html')) && 'falta rwadar-publicado (npm run test:web)'), timeout: 240000 }, async () => {
  // La edición fija, la misma que escribe en el HTML este arnés (no la viva).
  const raizPub = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'rwadar-pub-'));
  fs.cpSync(path.join(RAIZ, 'rwadar-publicado'), raizPub, { recursive: true });
  const indice = path.join(raizPub, 'index.html');
  fs.writeFileSync(indice, portadaNt.prepararInicioPublicado(portadaNt.sinNoticiasInicio(fs.readFileSync(indice, 'utf8')), VIS));
  fs.writeFileSync(path.join(raizPub, 'datos/noticias-v2.json'), TEXTO_VIS);
  const local = await arrancarWorkerLocal({ raiz: raizPub, puerto: 0,
    responder: async url => (url.hostname === 'api.coingecko.com' ? new Response('{}', { status: 429 }) : null) });
  const navegador = await playwright.chromium.launch();
  const BLANCA = await require('sharp')({ create: { width: 1200, height: 800, channels: 3, background: '#ffffff' } }).webp().toBuffer();
  const datos = modelo.validarNoticias(VIS);
  try {
    // 1 · Sin JS: se ven las tres, con su foto y la nota.
    {
      const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      await p.goto(local.url + '/', { waitUntil: 'load' });
      const r = await p.evaluate(() => ({ n: document.querySelectorAll('#ntLista > li').length, visible: !document.getElementById('ntLista').hidden,
        nota: !document.getElementById('ntNota').hidden, cargando: !document.getElementById('ntEstado').hidden }));
      assert.deepEqual(r, { n: 3, visible: true, nota: true, cargando: false });
      await ctx.close();
    }
    // 2 · Con JS, en castellano: los mismos nodos (no se rehacen), «Hoy» si toca, y lo pintado por el JS es igual que lo escrito.
    for (const [ancho, alto, escala] of [[390, 844, 2], [1366, 900, 1]]) {
      const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: escala, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      const errores = [];
      p.on('pageerror', e => errores.push(e.message));
      await p.clock.setFixedTime(aMediodia(datos.noticias[0].fecha));
      await p.route('**/datos/noticias-v2.json', async r => { await new Promise(f => setTimeout(f, 300)); return r.fulfill({ status: 200, contentType: 'application/json', body: TEXTO_VIS }); });
      await p.goto(local.url + '/', { waitUntil: 'domcontentloaded' });
      await p.evaluate(() => { window.__marca = document.querySelector('#ntLista > li'); window.__html = document.getElementById('ntLista').innerHTML; });
      await p.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      const r = await p.evaluate(() => ({ mismo: window.__marca === document.querySelector('#ntLista > li'), n: document.querySelectorAll('#ntLista > li').length,
        sinHoy: document.getElementById('ntLista').innerHTML.replace(/ <span class="nt-hoy[^"]*">(?:Hoy|Ayer)<\/span>/g, '') === window.__html,
        firma: document.getElementById('ntLista').dataset.ntPrepintado, desborde: document.documentElement.scrollWidth - innerWidth }));
      assert.deepEqual(errores, []);
      assert.equal(r.mismo, true, `${ancho}: el JS no rehace la lista escrita`);
      assert.equal(r.sinHoy, true, `${ancho}: solo añade «Hoy» o «Ayer»`);
      assert.equal(r.n, 3);
      assert.equal(r.desborde, 0);
      // Las fotos: la portada sin lazy, las tarjetas con lazy, y del tamaño justo.
      await p.evaluate(() => document.getElementById('mercado').scrollIntoView());
      await p.waitForFunction(() => [...document.querySelectorAll('#ntLista img')].every(i => i.complete), null, { timeout: 20000 });
      const fotos = await p.evaluate(() => [...document.querySelectorAll('#ntLista img')].map(i => ({ lazy: i.loading, src: i.currentSrc, w: i.getBoundingClientRect().width })));
      assert.equal(fotos[0].lazy, 'auto');
      assert.ok(fotos.slice(1).every(f => f.lazy === 'lazy'));
      for (const f of fotos) {
        const real = Number((f.src.match(/noticias-editoriales\/(480|960)\//) || [0, 1200])[1]);
        assert.ok(real <= Math.max(480, 1.5 * f.w * escala) + 1, `${ancho}: ${f.src} para ${Math.round(f.w)} px`);
      }
      await ctx.close();
    }
    // 2b · Lo que pinta el JS (con otra firma, la rehace) es exactamente lo que escribió el publicador.
    for (const ancho of [390, 1366]) {
      const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      await p.route(local.url + '/', async r => {
        const resp = await r.fetch();
        return r.fulfill({ response: resp, body: (await resp.text()).replace(/data-nt-prepintado="[0-9a-f]{8}"/, 'data-nt-prepintado="00000000"') });
      });
      await p.goto(local.url + '/', { waitUntil: 'load' });
      await p.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      // El HTML del publicador, leído por el propio navegador (así los dos se serializan igual).
      const r = await p.evaluate(esperado => { const t = document.createElement('template'); t.innerHTML = esperado;
        return { html: document.getElementById('ntLista').innerHTML.replace(/ <span class="nt-hoy[^"]*">(?:Hoy|Ayer)<\/span>/g, ''), esperado: t.innerHTML,
          firma: document.getElementById('ntLista').dataset.ntPrepintado }; }, portadaNt.htmlNoticiasInicio(VIS));
      assert.equal(r.firma, undefined, 'con otra firma, la rehace');
      assert.equal(r.html, r.esperado, `${ancho}: el JS pinta lo mismo que el publicador`);
      await ctx.close();
    }
    // 3 · En inglés, se rehacen con los textos «en»; con el archivo caído, se queda la escrita.
    {
      const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      await ctx.addInitScript(() => { try { localStorage.setItem('rwadar.idioma', 'en'); } catch { /* sin almacenamiento */ } });
      const p = await ctx.newPage();
      await p.goto(local.url + '/', { waitUntil: 'load' });
      const enIngles = await p.evaluate(() => document.documentElement.lang);
      if (enIngles === 'en') {
        await p.waitForFunction(t => document.querySelector('#ntLista .nt-p-tit')?.textContent === t, VIS.noticias[0].en.titulo, { timeout: 20000 });
        assert.equal(await p.evaluate(() => document.getElementById('ntLista').dataset.ntPrepintado), undefined);
      }
      await ctx.close();
      const ctx2 = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const p2 = await ctx2.newPage();
      await p2.route('**/datos/noticias-v2.json', r => r.fulfill({ status: 503, body: '' }));
      await p2.goto(local.url + '/', { waitUntil: 'load' });
      await p2.waitForSelector('#mercado[data-noticias-estado="prepintado"]', { timeout: 20000 });
      assert.equal(await p2.locator('#ntLista > li').count(), 3);
      assert.equal(await p2.isVisible('#ntEstado'), false, 'sin el aviso de error: es la misma edición publicada');
      await ctx2.close();
    }
    // 4 · Contraste con una foto blanca entera (el peor caso): el píxel más claro bajo el texto, con el texto transparente.
    for (const [ancho, alto] of [[320, 700], [390, 844], [1366, 900]]) {
      const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.route('**/noticias-editoriales/**', r => r.fulfill({ status: 200, contentType: 'image/webp', body: BLANCA }));
      await p.goto(local.url + '/', { waitUntil: 'load' });
      await p.evaluate(() => { document.getElementById('mercado').scrollIntoView(); for (const i of document.querySelectorAll('#ntLista img')) i.loading = 'eager'; });
      await p.waitForFunction(() => [...document.querySelectorAll('#ntLista img')].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 20000 });
      await p.waitForSelector('#mercado[data-noticias-estado]', { timeout: 20000 });
      await p.evaluate(() => {
        // El texto, transparente (por el CSSOM: la CSP no deja meter un <style>), conservando su caja.
        for (const e of document.querySelectorAll('#ntLista .nt-p-txt *, #ntLista .nt-t-txt *')) e.style.setProperty('color', 'transparent', 'important');
        document.querySelector('#ntLista .nt-p').scrollIntoView({ block: 'center' });
      });
      await p.waitForTimeout(300);
      // Las cajas del texto, medidas justo antes de la captura (la página ya no se mueve).
      const cajas = await p.evaluate(ancho => {
        const sel = ancho >= 1024 ? '#ntLista .nt-p-tit, #ntLista .nt-p .nt-meta, #ntLista .nt-t-tit, #ntLista .nt-t .nt-meta' : '#ntLista .nt-p-tit, #ntLista .nt-p .nt-meta';
        return [...document.querySelectorAll(sel)].map(e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
      }, ancho);
      const png = await p.screenshot();
      if (process.env.RWADAR_CAPTURAS) fs.writeFileSync(path.join(process.env.RWADAR_CAPTURAS, `blanca-${ancho}.png`), png);
      const minimo = await p.evaluate(async ({ datos, cajas }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + datos; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const lum = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const texto = 0.2126 * lum(247) + 0.7152 * lum(245) + 0.0722 * lum(240);
        let peor = Infinity;
        for (const b of cajas) {
          if (b.w < 1 || b.y < 0 || b.y + b.h > img.height) continue;
          const d = g.getImageData(Math.round(b.x), Math.round(b.y), Math.max(1, Math.round(b.w)), Math.max(1, Math.round(b.h))).data;
          for (let i = 0; i < d.length; i += 4) {
            const L = 0.2126 * lum(d[i]) + 0.7152 * lum(d[i + 1]) + 0.0722 * lum(d[i + 2]);
            peor = Math.min(peor, (texto + 0.05) / (L + 0.05));
          }
        }
        return peor;
      }, { datos: png.toString('base64'), cajas });
      console.log(`contraste con foto blanca a ${ancho}: ${minimo.toFixed(2)}:1`);
      assert.ok(minimo >= 4.5, `${ancho}: contraste ${minimo.toFixed(2)}:1 con una foto blanca (AA pide 4,5:1)`);
      assert.ok(minimo >= 7, `${ancho}: meta de diseño 7:1 (${minimo.toFixed(2)})`);
      // Movimiento reducido: al pasar el ratón, la foto no cambia.
      if (ancho >= 1024) {
        await p.hover('#ntLista .nt-p');
        assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#ntLista .nt-p img')).transform), 'none');
      }
      await ctx.close();
    }
    // 5 · Letra grande (32 px en el navegador, a 390): una columna, la portada crece y ningún titular sale de su tarjeta.
    {
      const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      const cdp = await ctx.newCDPSession(p);
      await p.goto(local.url + '/', { waitUntil: 'load' });
      await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
      await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const l = document.getElementById('ntLista');
        const columnas = getComputedStyle(l).gridTemplateColumns.split(' ').length;
        const portada = l.querySelector('.nt-p').getBoundingClientRect().height;
        const fuera = [...l.querySelectorAll('.nt-p-tit,.nt-t-tit')].filter(t => t.getBoundingClientRect().bottom > t.closest('a').getBoundingClientRect().bottom + 1).length;
        // Lo que salga de la pantalla en la sección (el resto de Inicio no es de esta prueba).
        const desborde = [...l.querySelectorAll('*')].filter(n => n.getBoundingClientRect().right > innerWidth + 0.5).length;
        return { columnas, portada, fuera, desborde };
      });
      assert.equal(r.columnas, 1, 'con la letra grande, una columna');
      assert.ok(r.portada > 269, `la portada crece (${r.portada})`);
      assert.equal(r.fuera, 0);
      assert.equal(r.desborde, 0);
      await ctx.close();
    }
    // 5b · /mercado/ con 5 noticias: sin huecos al final de la rejilla (la última se estira) ni en 3 columnas ni en 2.
    for (const [ancho, columnas] of [[1366, 3], [768, 2]]) {
      const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 }, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      await p.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await p.waitForSelector('#noticias[data-noticias-estado="listo"]', { timeout: 20000 });
      const r = await p.evaluate(() => {
        const l = document.getElementById('ntLista'), b = l.getBoundingClientRect(), ultimo = l.lastElementChild.getBoundingClientRect();
        return { columnas: getComputedStyle(l).gridTemplateColumns.split(' ').length, derecha: Math.round(b.right - ultimo.right),
          ancha: l.lastElementChild.classList.contains('nt-v-ancha') };
      });
      assert.equal(r.columnas, columnas);
      assert.equal(r.derecha, 0, `${ancho}: la última llega al borde derecho (sin hueco)`);
      assert.equal(r.ancha, true, 'y pide la foto de tarjeta ancha');
      await ctx.close();
    }
    // 6 · Tableta (1024 × 1366): la foto de portada se pide antes de acabar de leer el HTML del todo (antes del DOMContentLoaded).
    {
      const ctx = await navegador.newContext({ viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
      const p = await ctx.newPage();
      const pedidas = [];
      p.on('request', q => { if (/noticias-editoriales\//.test(q.url())) pedidas.push({ url: q.url(), t: Date.now() }); });
      let dcl = 0;
      p.on('domcontentloaded', () => { dcl = Date.now(); });
      await p.goto(local.url + '/', { waitUntil: 'load' });
      const primera = pedidas.find(x => x.url.includes(datos.noticias[0].imagen));
      assert.ok(primera, 'la foto de portada se pide al cargar');
      assert.ok(primera.t <= dcl, 'antes de que acabe el JavaScript');
      await ctx.close();
    }
  } finally { await navegador.close(); await local.cerrar(); fs.rmSync(raizPub, { recursive: true, force: true }); }
});

test('la guía de titulares (GUIA-TITULARES.md): sus apartados fijos, las fotos que nombra existen y cubre todos los temas', () => {
  const ruta = path.join(RAIZ, 'rwadar-editorial-source/noticias/GUIA-TITULARES.md');
  assert.ok(fs.existsSync(ruta), 'la guía de titulares tiene que existir: la leen las noticias automáticas de cada mañana');
  const guia = fs.readFileSync(ruta, 'utf8');
  for (const apartado of ['## 1 · Las reglas del titular', '## 2 · Ejemplos de las ediciones reales', '## 3 · Cómo se escribe uno', '## 4 · La foto']) {
    assert.ok(guia.includes(apartado), apartado);
  }
  const spec = JSON.parse(lee('rwadar-editorial-source/noticias/fotos.json'));
  const tabla = guia.slice(guia.indexOf('## 4 · La foto'));
  const nombradas = [...new Set([...tabla.matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1]))].filter(k => !/^(?:fotos|genericas|temas|faltaria)$/.test(k));
  for (const k of nombradas) assert.ok(Object.hasOwn(spec.fotos, k), `la guía nombra «${k}», que no está en fotos.json`);
  for (const k of Object.keys(spec.fotos)) assert.ok(nombradas.includes(k), `la foto «${k}» no sale en la tabla de la guía`);
  for (const [tema, nombre] of Object.entries(spec.temas)) {
    const fila = tabla.split('\n').find(l => l.startsWith(`| ${nombre} |`));
    assert.ok(fila, `falta el tema «${nombre}» en la tabla`);
    const deTabla = [...fila.matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1]).sort();
    const deFotos = Object.entries(spec.fotos).filter(([, f]) => f.temas.includes(tema)).map(([k]) => k).sort();
    assert.deepEqual(deTabla, deFotos, `las fotos del tema «${nombre}» en la guía y en fotos.json`);
  }
  for (const [cat, clave] of Object.entries(spec.genericas)) assert.ok(guia.includes(`${modelo.CATEGORIAS[cat].es.toLowerCase()} → \`${clave}\``), `genérica de ${cat}`);
  // El largo de la guía es el del programa.
  assert.ok(guia.includes(`${modelo.REGLAS_TITULAR.max} caracteres como mucho`));
});
