/* «Noticias del sector» (10/11/2026; rediseño de Inicio, el mismo día):
   /datos/noticias-v2.json como recurso estático, y /datos/noticias.json sin
   «imagen» para la app ya instalada (publicables, cabeceras y validación en
   el generador, con el motor congelado de esa app), la copia web del motor, el script sin
   innerHTML ni terceros, y en Chromium a 390 × 844 y 1366 × 900: en Inicio,
   dentro de «Mercado y noticias» (11/11/2026), 3 noticias compactas que
   llevan a su detalle; en /mercado/, debajo del gráfico, las 6 con su detalle
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
  await pagina.route('**/noticias-editoriales/*.webp', r => { pedidas.push(new URL(r.request().url()).pathname); return r.fulfill({ status: 200, contentType: 'image/webp', body: FOTO_PRUEBA }); });
}

test('en Chromium: Inicio con 3 noticias compactas en «Mercado y noticias»; /mercado/ con las 6, teclado, diálogo, #id, /noticias/#id, inglés y archivo caído', { skip: sinNavegador, timeout: 180000 }, async () => {
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
        const filas = [...l.querySelectorAll('.nt-c')];
        const tit = filas[1].querySelector('.nt-c-tit'), estilo = getComputedStyle(tit);
        const foto = filas[0].querySelector('.nt-foto').getBoundingClientRect();
        const fuera = [...s.querySelectorAll('*')].filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
        return {
          n: filas.length, tipos: filas.map(a => a.tagName), href: filas.map(a => a.getAttribute('href')),
          conEtiqueta: filas.filter(b => b.hasAttribute('aria-label')).length,
          hoy: filas.filter(b => b.querySelector('.nt-hoy')?.textContent === 'Hoy').map(b => b.dataset.ntId),
          ayer: filas.filter(b => b.querySelector('.nt-hoy--ayer')?.textContent === 'Ayer').map(b => b.dataset.ntId),
          meta: filas.map(a => a.querySelector('.nt-c-meta').textContent),
          fotos: filas.map(a => { const i = a.querySelector('img'); return i && i.getAttribute('src'); }),
          altVacio: filas.every(a => a.querySelector('img').getAttribute('alt') === '' && a.querySelector('.nt-foto').getAttribute('aria-hidden') === 'true'),
          fotoPeq: foto.width <= 96 && foto.height <= 72, svg: l.querySelectorAll('svg').length, anchoPagina: document.documentElement.scrollWidth, fuera: fuera.length,
          clamp: estilo.webkitLineClamp, lineas: Math.round(tit.getBoundingClientRect().height / parseFloat(estilo.lineHeight)), color: estilo.color,
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
      assert.ok(pedidas.length >= 1 && pedidas.every(r => /^\/noticias-editoriales\/[a-z0-9-]+\.webp$/.test(r)));
      assert.ok(m.altVacio, 'la foto es decorativa: el titular ya lo dice');
      assert.ok(m.fotoPeq, 'foto pequeña');
      assert.equal(m.svg, 0, 'sin ilustraciones SVG');
      assert.equal(m.anchoPagina, ancho, `${ancho}: sin desplazamiento horizontal de la página`);
      assert.equal(m.fuera, 0);
      assert.equal(m.clamp, '3');
      assert.ok(m.lineas <= 3, `como mucho 3 líneas (${m.lineas})`);
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
        const filas = [...document.querySelectorAll('#ntLista .nt-c')];
        return { hoy: filas.filter(b => b.querySelector('.nt-hoy')?.textContent === 'Hoy').map(b => b.dataset.ntId),
          ayer: filas.filter(b => b.querySelector('.nt-hoy--ayer')?.textContent === 'Ayer').map(b => b.dataset.ntId),
          meta: filas[0].querySelector('.nt-c-meta').textContent };
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
        const primera = document.querySelector('#ntLista .nt-fila:nth-child(2) .nt-art');
        const foto = primera.querySelector('.nt-art-foto').getBoundingClientRect(), texto = primera.querySelector('.nt-art-txt').getBoundingClientRect();
        return {
          n: document.querySelectorAll('#ntLista .nt-art').length, botones: [...document.querySelectorAll('#ntLista .nt-art-abrir')].map(b => b.tagName + ':' + b.type),
          titulos: [...document.querySelectorAll('#ntLista .nt-art-tit')].map(h => h.tagName),
          resumen: document.querySelector('#ntLista .nt-art-resumen').textContent, unaLinea: getComputedStyle(document.querySelectorAll('#ntLista .nt-art-resumen')[1]).webkitLineClamp,
          meta: document.querySelector('#ntLista .nt-art-meta').textContent, fotoDerecha: foto.left >= texto.right - 1,
          anchoPagina: document.documentElement.scrollWidth, h1: document.querySelector('h1').textContent, h2: document.getElementById('ntTit').textContent,
          traGrafico: document.getElementById('tokenizacion').compareDocumentPosition(document.getElementById('noticias')) & Node.DOCUMENT_POSITION_FOLLOWING,
        };
      });
      assert.deepEqual(erroresL, []);
      assert.equal(l.n, 6, 'las 6');
      assert.ok(l.botones.every(b => b === 'BUTTON:button'));
      assert.ok(l.titulos.every(t => t === 'H3'), 'bajo «Noticias relacionadas» (h2), los titulares son h3');
      assert.equal(l.resumen, `Por qué te importa: ${DATOS_EJ.noticias[0].porQueImporta}`, 'la primera dice ya por qué te importa');
      assert.equal(l.unaLinea, '2', 'las demás, dos líneas de resumen (con una, se cortaba a media palabra)');
      assert.equal(l.meta, `${corta(n0)} · ${ddmmaaaa(n0.fecha)} Hoy`);
      assert.ok(l.fotoDerecha, 'la foto a la derecha');
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
      await lista.click(`#ntLista #${DATOS_EJ.noticias[3].id} .nt-art`, { position: { x: 30, y: 30 } });
      await lista.waitForSelector('#ntDialogo[open]');
      await lista.click('#ntDialogo [data-nt-cerrar]');
      await lista.waitForFunction(() => !document.getElementById('ntDialogo').open && !document.documentElement.classList.contains('nt-dialogo-abierto'));
      // En inglés: los campos «en» de cada noticia y la interfaz del diccionario.
      await lista.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await lista.waitForFunction(() => document.getElementById('ntTit').textContent === 'Related news');
      const en = await lista.evaluate(() => ({ fecha: document.getElementById('ntFecha').textContent,
        primero: document.querySelector('#ntLista .nt-art-tit').textContent, hoy: document.querySelector('#ntLista .nt-hoy').textContent,
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
      assert.equal(await pagina.getAttribute('#ntLista .nt-c', 'data-nt-id'), DATOS_EJ.noticias[0].id);
      await pagina.close();
    }
    // Una foto que no carga: se quita y queda el fondo oscuro; el titular sigue.
    {
      const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 } });
      await pagina.route('**/noticias-editoriales/*.webp', r => r.fulfill({ status: 404, body: '' }));
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-noticias-estado="listo"]', { timeout: 20000 });
      await pagina.evaluate(() => document.getElementById('mercado').scrollIntoView());
      await pagina.waitForFunction(() => document.querySelectorAll('#ntLista .nt-foto--sin').length === 3);
      assert.equal(await pagina.locator('#ntLista img').count(), 0);
      assert.equal(await pagina.locator('#ntLista .nt-c-tit').count(), 3);
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
