/* «El gráfico, cuanto más detalle en el tiempo tenga, mejor» (13/11/2026):
   /mercado/ e Inicio con las series finas (un punto cada 5 minutos de las
   últimas 24 horas y uno cada hora de los últimos 30 días). Con los
   archivos reales del 13/11/2026 (rwadar-app/tokenizacion/prueba-serie-*,
   la diaria y la fina de la misma lectura de CoinGecko, servidas en lugar
   de las semillas), en Chromium a 390 × 844 (dedo) y 1366 × 900 (ratón):
   cuántos puntos tiene y cuántos pinta cada pestaña (sin perder el máximo
   ni el mínimo), las marcas del tiempo, la lectura de la cruz con el dedo,
   el ratón y el teclado, la cabecera y los datos clave, el inglés, Inicio,
   que volver a una pestaña no recalcula nada, la CSP y que sin la serie
   fina (falta, rota, de otra lectura, demasiado grande o la semilla de
   main) todo sigue con la diaria. Sin red. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const leer = r => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const COINGECKO = leer('rwadar-app/tokenizacion/prueba-coingecko-20261110.json');
const DIARIA = leer('rwadar-app/tokenizacion/prueba-serie-20261113.json');
const FINA = leer('rwadar-app/tokenizacion/prueba-serie-fina-20261113.json');
const UNIDA = modelo.unirSerieFina(JSON.parse(DIARIA), JSON.parse(FINA));
const SOLA = modelo.validarSerie(JSON.parse(DIARIA));
const AHORA = Date.parse('2026-11-10T15:31:37Z');
const plano = t => String(t).replace(/\s+/g, ' ').trim();
const MES = 'ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic';
// Qué serie y cuántos puntos tiene cada pestaña con la lectura del 13/11/2026 (24 h: de 15:05 a 15:05 UTC, cada 5 minutos).
const ESPERADO = { '1d': ['5m', 289], '1s': ['1h', 169], '1m': ['1h', 721], '3m': ['1d', 92], '6m': ['1d', 182], ytd: ['1d', 316], '1a': ['1d', 364] };
// Lo que dice la cruz en cada pestaña: la hora; el día y la hora; o la fecha.
const FORMATO = { '5m': /^\d\d:\d\d$/, '1h': new RegExp(`^\\d{1,2} (${MES}), \\d\\d:\\d\\d$`), '1d': /^\d\d\/\d\d\/\d{4}$/ };
// Las marcas de abajo: horas en 24 h; días en 1 S, 1 M y 3 M; meses («jun 2026», «ago») en 6 M, el año y 1 A.
const MARCAS = { '1d': /^\d\d:\d\d$/, '1s': new RegExp(`^\\d{1,2} (${MES})$`), '1m': new RegExp(`^\\d{1,2} (${MES})$`), '3m': new RegExp(`^\\d{1,2} (${MES})$`),
  '6m': new RegExp(`^(${MES})( \\d{4})?$`), ytd: new RegExp(`^(${MES})( \\d{4})?$`), '1a': new RegExp(`^(${MES})( \\d{4})?$`) };

/* Una fina con un token fuera: el más pequeño de la lista (150 M$ en todos sus puntos, un 0,36 %),
   como la deja serie-diaria.mjs cuando a ese token le faltan más de 24 horas de datos. */
function finaConUnoFuera() {
  const f = JSON.parse(FINA), fuera = f.tokens.at(-1), VALOR = 150e6;
  for (const x of Object.values(f.series)) {
    assert.ok(!x.largos.includes(fuera));
    x.fuera = [fuera]; x.valorFuera = VALOR;
    x.puntos = x.puntos.map(([t, v, n]) => [t, v - VALOR, n - 1]);
  }
  assert.equal(Object.keys(modelo.seriesEnlazadas(JSON.parse(DIARIA), f)).length, 2, 'la fina con un token fuera casa con la diaria');
  return f;
}

test('los archivos reales del 13/11/2026 casan y cada pestaña usa la serie más fina que la cubre; /mercado/ lee la fina', () => {
  assert.ok(UNIDA.fina, 'la fina real se une a su diaria');
  assert.deepEqual(Object.keys(UNIDA.fina.series), ['5m', '1h']);
  for (const [clave, [resolucion, puntos]] of Object.entries(ESPERADO)) {
    const g = modelo.graficoPestana(UNIDA, clave);
    assert.deepEqual([g.resolucion, g.puntos.length], [resolucion, puntos], clave);
    // El último punto de cada pestaña es la cifra grande: no se contradicen.
    assert.equal(g.puntos.at(-1).valor, modelo.cifraGrande(UNIDA, null).valor, clave);
  }
  assert.equal(modelo.pestanaDisponible(SOLA, '1d'), false, 'con la diaria sola, 24 h no existe');
  // El tamaño que lee el navegador: unos 39 kB, muy lejos del tope de 256 kB del script (y de la app).
  assert.ok(Buffer.byteLength(FINA) < 64 * 1024, `${Buffer.byteLength(FINA)} bytes`);
  const js = leer('rwadar-site/assets/mercado-20261111.js');
  assert.match(js, /const RUTA_SERIE_FINA = '\/datos\/tokenizacion-serie-fina\.json', MAX_FINA = 256 \* 1024;/);
  assert.match(js, /modelo\.unirSerieFina\(diaria, fina\)/);
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
const relojServidor = () => { const inicio = performance.now(); return () => AHORA + Math.floor(performance.now() - inicio); };

/* Una página con la diaria real y, como fina, «fina» (texto; null: un 404; SEMILLA: la de rwadar-site, la de main). */
const SEMILLA = Symbol('semilla de main');
async function abrir(navegador, url, { ancho, alto, tactil = false, fina = FINA, diaria = DIARIA }) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, hasTouch: tactil, isMobile: tactil });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  // Cualquier cosa que la CSP bloquee (un estilo en línea, otra conexión) queda apuntada.
  await pagina.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  await pagina.route('**/datos/tokenizacion-serie.json', r => r.fulfill({ contentType: 'application/json', body: diaria }));
  if (fina !== SEMILLA) await pagina.route('**/datos/tokenizacion-serie-fina.json', r => (fina === null ? r.fulfill({ status: 404, body: 'No' }) : r.fulfill({ contentType: 'application/json', body: fina })));
  await pagina.goto(url, { waitUntil: 'load' });
  return { contexto, pagina, errores };
}

/* Lo que se ve del gráfico de la pestaña elegida. */
const leerGrafico = pagina => pagina.evaluate(() => {
  const s = document.querySelector('#tokenizacion'), svg = s.querySelector('.mk-svg'), graf = s.querySelector('.mk-graf');
  const d = svg.querySelector('.mk-linea').getAttribute('d');
  const ys = [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(m => Number(m[2]));
  const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
    .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
  return { resolucion: graf.dataset.resolucion, puntos: Number(graf.dataset.puntos), max: Number(graf.getAttribute('aria-valuemax')),
    pintados: (d.match(/[ML]/g) || []).length, yArriba: Math.min(...ys), yAbajo: Math.max(...ys), anchoSvg: Number(svg.getAttribute('width')),
    fechas: [...svg.querySelectorAll('.mk-eje text')].filter(t => !t.classList.contains('mk-eje-unidad') && Number(t.getAttribute('y')) > Number(svg.getAttribute('height')) - 20).map(t => t.textContent),
    filas: s.querySelectorAll('.solo-lector table tr').length, caption: s.querySelector('.solo-lector caption').textContent,
    cabTabla: s.querySelector('.solo-lector table th').textContent, primeraFila: s.querySelector('.solo-lector table tr:nth-child(3) th')?.textContent,
    etiqueta: graf.getAttribute('aria-label'), cambio: s.querySelector('.mk-linea-cambio').textContent, cifra: s.querySelector('.mk-cifra-num').textContent,
    aviso: s.querySelector('.mk-aviso-fuera')?.textContent ?? null, fuera: fuera.length, anchoPagina: document.documentElement.scrollWidth };
});
const datoClave = (pagina, rotulo) => pagina.evaluate(r => {
  const d = [...document.querySelectorAll('.mk-clave-item')].find(x => x.querySelector('dt').textContent === r)?.querySelector('dd');
  return d ? { valor: d.firstChild.textContent, extra: d.querySelector('small')?.textContent ?? null } : null;
}, rotulo);
/* Las coordenadas que pinta dibujarGrafico (las mismas medidas): para saber dónde caen el máximo y el mínimo. */
function geometria(g, anchoSvg, escritorio) {
  const EJE = escritorio ? 64 : 54, ALTO = escritorio ? 330 : 270, ARRIBA = 40, PH = ALTO - ARRIBA - 28;
  const coords = modelo.coordenadas(g, anchoSvg - EJE - 8, PH).map(c => ({ x: c.x, y: c.y + ARRIBA }));
  const pintados = modelo.tramosSeguidos(g).reduce((n, [a, b]) => n + modelo.indicesPintar(coords, a, b).length, 0);
  return { pintados, yMax: Math.min(...coords.map(c => c.y)), yMin: Math.max(...coords.map(c => c.y)), PW: anchoSvg - EJE };
}
async function elegir(pagina, clave) {
  await pagina.click(`[data-pestana="${clave}"]`);
  await pagina.waitForFunction(c => document.querySelector(`[data-pestana="${c}"]`)?.getAttribute('aria-pressed') === 'true' &&
    document.querySelector('.mk-graf')?.dataset.puntos && document.querySelector('.mk-svg'), clave);
}
/* La cruz a un «f» del ancho, con el dedo o con el ratón: { indice, fecha, valor }. */
async function cruzEn(pagina, f, tactil) {
  const caja = await pagina.locator('.mk-graf').boundingBox();
  const x = caja.x + caja.width * f, y = caja.y + caja.height / 2;
  if (tactil) await pagina.touchscreen.tap(x, y); else await pagina.mouse.move(x, y);
  await pagina.waitForSelector('.mk-burbuja:not([hidden])');
  return pagina.evaluate(() => ({ indice: Number(document.querySelector('.mk-graf').getAttribute('aria-valuenow')),
    fecha: document.querySelector('.mk-burbuja-fecha').textContent, valor: document.querySelector('.mk-burbuja-valor').textContent,
    texto: document.querySelector('.mk-graf').getAttribute('aria-valuetext') }));
}

test('en Chromium: /mercado/ con las series finas reales: puntos por pestaña, trazo, marcas del tiempo, cruz, teclado, cabecera, datos clave, inglés e Inicio',
  { skip: sinNavegador, timeout: 240000 }, async () => {
    const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, ahora: relojServidor(),
      responder: async url => (url.hostname === 'api.coingecko.com' ? new Response(COINGECKO) : null) });
    const navegador = await playwright.chromium.launch();
    try {
      for (const [ancho, alto] of [[390, 844], [1366, 900]]) {
        const tactil = ancho < 768, escritorio = !tactil;
        const { contexto, pagina, errores } = await abrir(navegador, local.url + '/mercado/', { ancho, alto, tactil });
        await pagina.waitForSelector('#tokenizacion[data-mercado-series="5m,1h"] .mk-svg', { timeout: 20000 });
        // La cabecera: la cifra grande es el último punto (41.816 M$) y dice la hora de España de la lectura.
        assert.equal(plano(await pagina.textContent('.mk-cifra-num')), plano(modelo.millones(41815579529)));
        assert.equal(await pagina.textContent('.mk-sub'), 'Suma de los 30 mayores tokens con historia completa\u00a0· 13/11/2026, 16:05');
        assert.match(plano(await pagina.textContent('#tokenizacion .mk-fuente')), /^En millones de dólares \(M\$\)\. Datos: CoinGecko · serie hasta el 13\/11\/2026, 16:05 \(hora de España\) · total de la categoría:/);
        // Las siete pestañas tienen datos (24 h, por la fina) y 1 M sigue siendo la de partida.
        assert.deepEqual(await pagina.$$eval('.mk-pestana', bs => bs.map(b => [b.textContent, b.disabled, b.getAttribute('aria-pressed')])),
          [['24 h', false, 'false'], ['1 S', false, 'false'], ['1 M', false, 'true'], ['3 M', false, 'false'], ['6 M', false, 'false'], ['2026', false, 'false'], ['1 A', false, 'false']]);
        for (const clave of Object.keys(ESPERADO)) {
          await elegir(pagina, clave);
          const g = modelo.graficoPestana(UNIDA, clave), m = await leerGrafico(pagina), [resolucion, n] = ESPERADO[clave];
          const geo = geometria(g, m.anchoSvg, escritorio);
          // Cuántos puntos tiene (la cruz y la tabla los recorren todos) y cuántos pinta.
          assert.deepEqual([m.resolucion, m.puntos, m.max + 1, m.filas - 1], [resolucion, n, n, n], `${ancho} ${clave}: puntos`);
          assert.equal(m.pintados, geo.pintados, `${ancho} ${clave}: el trazo simplificado del modelo`);
          assert.ok(m.pintados <= Math.min(n, 2 * geo.PW + 2), `${ancho} ${clave}: pinta ${m.pintados} de ${n} en ${geo.PW} px`);
          if (clave === '1m' && tactil) assert.ok(m.pintados < n, `390 1 M: con 721 puntos en ${geo.PW} px se simplifica (${m.pintados})`);
          // Sin falsear el máximo ni el mínimo: lo más alto y lo más bajo del trazo son los del periodo.
          assert.ok(Math.abs(m.yArriba - geo.yMax) < 0.06 && Math.abs(m.yAbajo - geo.yMin) < 0.06, `${ancho} ${clave}: máximo y mínimo en el trazo`);
          // Las marcas de abajo: horas, días o meses (las del modelo, en hora de España).
          assert.deepEqual(m.fechas, g.marcasFechas.map(x => x.texto), `${ancho} ${clave}: marcas`);
          assert.ok(m.fechas.length >= 3 && m.fechas.every(t => MARCAS[clave].test(t)), `${ancho} ${clave}: ${m.fechas.join(' | ')}`);
          // La cabecera: el cambio de ESTA pestaña, de su serie más fina; la cifra grande no cambia.
          assert.equal(plano(m.cambio), plano({ sube: '▲', baja: '▼', igual: '=' }[g.direccion] + g.cambioTexto + ' ' + g.cambioFrase), `${ancho} ${clave}: cambio`);
          assert.equal(plano(m.cifra), plano(modelo.millones(41815579529)), `${ancho} ${clave}: cifra grande`);
          assert.equal(m.aviso, null, `${ancho} ${clave}: ningún token fuera`);
          // La tabla para el lector de pantalla y la ayuda del teclado, según la serie.
          assert.equal(m.caption, { '5m': 'Valor cada 5 minutos, ', '1h': 'Valor cada hora, ', '1d': 'Valor diario, ' }[resolucion] + g.periodoTexto + ' (suma de los 30 mayores tokens)');
          assert.equal(m.cabTabla, resolucion === '1d' ? 'Fecha' : 'Fecha y hora de España');
          if (resolucion !== '1d') assert.match(m.primeraFila, /^\d\d\/\d\d\/2026, \d\d:\d\d$/);
          assert.ok(m.etiqueta.endsWith({ '5m': 'Usa las flechas para ir de 5 en 5 minutos y Re Pág y Av Pág para saltar una hora.',
            '1h': 'Usa las flechas para recorrer las horas y Re Pág y Av Pág para saltar un día.', '1d': 'Usa las flechas para recorrer los días.' }[resolucion]), m.etiqueta);
          // La lectura al tocar o pasar el ratón: el instante y el valor del punto más cercano.
          const c = await cruzEn(pagina, 0.62, tactil);
          const p = g.puntos[c.indice];
          assert.ok(c.indice > 0 && c.indice < n - 1, `${ancho} ${clave}: la cruz en medio (${c.indice})`);
          assert.equal(c.fecha, modelo.textoInstante(p, 'es', resolucion), `${ancho} ${clave}: instante`);
          assert.match(c.fecha, FORMATO[resolucion], `${ancho} ${clave}: ${c.fecha}`);
          assert.equal(plano(c.valor), plano(modelo.millones(p.valor)));
          assert.equal(c.texto, `${modelo.textoInstante(p, 'es', resolucion, { largo: true })}: ${modelo.millonesHablados(p.valor)}`);
          if (resolucion !== '1d') assert.match(c.texto, /\(hora de España\): /);
          if (!tactil) await pagina.mouse.move(0, 0);
          // Con el teclado: Fin (el último punto: la cifra grande) y Av Pág, que salta una hora, un día o una semana.
          await pagina.focus('.mk-graf');
          await pagina.keyboard.press('End');
          assert.equal(plano(await pagina.textContent('.mk-burbuja-valor')), plano(await pagina.textContent('.mk-cifra-num')), `${ancho} ${clave}: el último punto es la cifra grande`);
          await pagina.keyboard.press('PageDown');
          assert.equal(await pagina.getAttribute('.mk-graf', 'aria-valuenow'), String(n - 1 - { '5m': 12, '1h': 24, '1d': 7 }[resolucion]), `${ancho} ${clave}: Av Pág`);
          await pagina.keyboard.press('Escape');
          assert.deepEqual([m.fuera, m.anchoPagina], [0, ancho], `${ancho} ${clave}: nada se sale por los lados`);
        }
        // Datos clave con 24 h: el valor con su hora; el cambio en 24 h, el de la pestaña; el máximo y el mínimo, con día y hora.
        await elegir(pagina, '1d');
        const g24 = modelo.graficoPestana(UNIDA, '1d');
        assert.deepEqual(await datoClave(pagina, 'Valor hoy (30 mayores)'), { valor: modelo.millones(41815579529), extra: '13/11/2026, 16:05' });
        const c24 = await datoClave(pagina, 'Cambio en 24 h');
        assert.deepEqual([plano(c24.valor), c24.extra], [plano('▼' + g24.cambioTexto), '30 mayores']);
        assert.deepEqual(await datoClave(pagina, 'Máximo del periodo'), { valor: modelo.millones(g24.estadisticas.max.valor), extra: modelo.textoInstante(g24.estadisticas.max, 'es', '1h') });
        assert.match((await datoClave(pagina, 'Mínimo del periodo')).extra, new RegExp(`^\\d{1,2} (${MES}), \\d\\d:\\d\\d$`));
        // Volver a una pestaña ya vista no recalcula nada en el modelo (antes, cada cambio volvía a validar la serie una docena de veces).
        await pagina.evaluate(() => {
          const m = globalThis.RWAdarTokenizacionModelo; window.__llamadas = 0;
          for (const f of ['graficoPestana', 'notaSerie', 'pestanaDisponible', 'seriePestana', 'cambio24h']) { const o = m[f]; m[f] = (...a) => { window.__llamadas++; return o(...a); }; }
        });
        await elegir(pagina, '1m'); await elegir(pagina, '1a'); await elegir(pagina, '1d');
        assert.equal(await pagina.evaluate(() => window.__llamadas), 0, `${ancho}: volver a una pestaña no recalcula`);
        // En inglés: las mismas horas; «13 Nov, 18:00» en las de cada hora; la fuente, con «Spain time».
        await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
        await pagina.waitForFunction(() => document.querySelector('h1').textContent === 'Tokenised asset market');
        for (const clave of ['1d', '1s']) {
          await elegir(pagina, clave);
          const g = modelo.graficoPestana(UNIDA, clave, 'en'), m = await leerGrafico(pagina);
          assert.deepEqual(m.fechas, g.marcasFechas.map(x => x.texto), `en ${clave}`);
          const c = await cruzEn(pagina, 0.4, tactil);
          assert.equal(c.fecha, modelo.textoInstante(g.puntos[c.indice], 'en', g.resolucion));
          assert.match(c.fecha, clave === '1d' ? /^\d\d:\d\d$/ : /^\d{1,2} [A-Z][a-z]{2}, \d\d:\d\d$/);
          assert.match(c.texto, /\(Spain time\): /);
          if (!tactil) await pagina.mouse.move(0, 0);
        }
        assert.deepEqual(await pagina.$$eval('.mk-pestana', bs => bs.map(b => b.textContent)), ['24H', '1W', '1M', '3M', '6M', 'YTD', '1Y']);
        assert.match(plano(await pagina.textContent('#tokenizacion .mk-fuente')), /Data: CoinGecko · series to 13 Nov 2026, 16:05 \(Spain time\)/);
        assert.equal((await datoClave(pagina, 'Period high')).extra, modelo.textoInstante(modelo.graficoPestana(UNIDA, '1s', 'en').estadisticas.max, 'en', '1h'));
        await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
        await pagina.waitForFunction(() => document.querySelector('h1').textContent === 'Mercado de activos tokenizados');

        // Inicio: el minigráfico del mes, cada hora (721 puntos), con línea fina y dibujado al ancho de su columna.
        await pagina.goto(local.url + '/', { waitUntil: 'load' });
        await pagina.waitForSelector('#mercado .mk-ct .mk-mini-svg', { timeout: 20000 });
        const g1m = modelo.graficoPestana(UNIDA, '1m');
        const ini = await pagina.evaluate(() => {
          const s = document.querySelector('#mercado'), mini = s.querySelector('.mk-mini-svg');
          return { res: mini.dataset.resolucion, puntos: Number(mini.dataset.puntos), caja: mini.getAttribute('viewBox'), grosor: getComputedStyle(mini.querySelector('.mk-linea')).strokeWidth,
            cifra: s.querySelector('.mk-ct-cifra').textContent, cambio: s.querySelector('.mk-ct .mk-cambio').textContent, fuente: s.querySelector('.mk-fuente').textContent,
            aviso: s.querySelector('.mk-aviso-fuera')?.textContent ?? null, anchoPagina: document.documentElement.scrollWidth };
        });
        assert.deepEqual([ini.res, ini.puntos, ini.caja, ini.grosor], ['1h', 721, `0 0 ${tactil ? 112 : 600} 44`, '1.25px'], `${ancho}: Inicio`);
        assert.equal(plano(ini.cifra), plano(modelo.millones(41815579529)));
        assert.equal(plano(ini.cambio), plano({ sube: '▲', baja: '▼', igual: '=' }[g1m.direccion] + g1m.cambioTexto));
        assert.equal(plano(ini.fuente), 'Datos: CoinGecko · serie hasta el 13/11/2026, 16:05 (hora de España)');
        assert.deepEqual([ini.aviso, ini.anchoPagina], [null, ancho]);
        assert.deepEqual(await pagina.evaluate(() => window.__csp), [], `${ancho}: nada bloqueado por la CSP`);
        assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
        await contexto.close();
      }

      // Un móvil lento (CPU 4 veces más lenta): con 721 puntos, cada movimiento del dedo cabe holgado en un fotograma.
      {
        const { contexto, pagina } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true });
        await pagina.waitForSelector('#tokenizacion[data-mercado-series="5m,1h"] .mk-svg', { timeout: 20000 });
        const cdp = await contexto.newCDPSession(pagina);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        const t = await pagina.evaluate(() => {
          const g = document.querySelector('.mk-graf'), r = g.getBoundingClientRect(), tiempos = [];
          g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 2, clientY: r.top + 100, pointerType: 'touch' }));
          for (let i = 0; i < 300; i++) {
            const t0 = performance.now();
            g.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + (i / 299) * r.width, clientY: r.top + 100, pointerType: 'touch' }));
            void document.querySelector('.mk-burbuja').offsetWidth;
            tiempos.push(performance.now() - t0);
          }
          return { media: tiempos.reduce((a, b) => a + b, 0) / tiempos.length, puntos: Number(g.dataset.puntos) };
        });
        assert.equal(t.puntos, 721);
        assert.ok(t.media < 8, `cada movimiento, ${t.media.toFixed(2)} ms de media (un fotograma son 16)`);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        await contexto.close();
      }

      // Sin la serie fina, o con una que no vale, todo sigue con la diaria: 24 h desactivada y 1 M con sus 31 días.
      const grande = JSON.stringify(JSON.parse(FINA)) + ' '.repeat(260 * 1024);
      assert.equal(modelo.serieFinaValida(JSON.parse(grande)), true, 'la de 260 kB es válida: solo sobra tamaño');
      const otra = JSON.parse(FINA); otra.generado = '2026-11-13T15:40:06Z';
      assert.equal(modelo.serieFinaValida(otra), true, 'la de otra lectura es válida, pero no casa con la diaria');
      const g1mSola = modelo.graficoPestana(SOLA, '1m');
      for (const [caso, fina] of [['falta (404)', null], ['rota', '{"version":1,'], ['de otra lectura', JSON.stringify(otra)], ['de más de 256 kB', grande], ['la semilla de main', SEMILLA]]) {
        const { contexto, pagina, errores } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, fina });
        await pagina.waitForSelector('#tokenizacion[data-mercado-series="diaria"] .mk-svg', { timeout: 20000 });
        const m = await leerGrafico(pagina);
        assert.deepEqual([m.resolucion, m.puntos], ['1d', g1mSola.puntos.length], caso);
        assert.deepEqual(await pagina.$$eval('.mk-pestana:disabled', bs => bs.map(b => b.textContent)), ['24 h'], `${caso}: solo 24 h, desactivada`);
        assert.equal(await pagina.textContent('.mk-sub'), 'Suma de los 30 mayores tokens con historia completa\u00a0· 13/11/2026', caso);
        assert.match(plano(await pagina.textContent('#tokenizacion .mk-fuente')), /Datos: CoinGecko · serie diaria hasta el 13\/11\/2026 ·/, caso);
        const c = await cruzEn(pagina, 0.5, true);
        assert.match(c.fecha, FORMATO['1d'], caso);
        assert.equal(c.texto, `${modelo.fechaCorta(g1mSola.puntos[c.indice].fecha)}: ${modelo.millonesHablados(g1mSola.puntos[c.indice].valor)}`, caso);
        assert.deepEqual(errores, [], `${caso}: sin errores`);
        await contexto.close();
      }

      // Un token fuera de las finas (le faltan más de 24 horas): la línea acaba 150 M$ por debajo de la cifra grande y se dice.
      {
        const f = finaConUnoFuera(), unida = modelo.unirSerieFina(JSON.parse(DIARIA), f);
        const { contexto, pagina, errores } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, fina: JSON.stringify(f) });
        await pagina.waitForSelector('#tokenizacion[data-mercado-series="5m,1h"] .mk-svg', { timeout: 20000 });
        await elegir(pagina, '1d');
        const g = modelo.graficoPestana(unida, '1d'), m = await leerGrafico(pagina);
        assert.ok(g.avisoFuera, 'el modelo da el aviso');
        assert.equal(m.aviso, g.avisoFuera[0].toUpperCase() + g.avisoFuera.slice(1) + '.');
        assert.match(m.aviso, /^La línea suma 29 de los 30: queda fuera 1 token sin datos de CoinGecko en este periodo \(150\sM\$\), así que acaba 150\sM\$ por debajo de la cifra grande\.$/);
        assert.equal(m.caption, 'Valor cada 5 minutos, últimas 24 horas (suma de 29 de los 30 mayores tokens)');
        assert.equal((await datoClave(pagina, 'Cambio en 24 h')).extra, '29 de los 30 mayores');
        await pagina.focus('.mk-graf');
        await pagina.keyboard.press('End');
        assert.equal(plano(await pagina.textContent('.mk-burbuja-valor')), plano(modelo.millones(41815579529 - 150e6)), 'el final de la línea, sin el token de fuera');
        assert.equal(plano(await pagina.textContent('.mk-cifra-num')), plano(modelo.millones(41815579529)), 'la cifra grande, con todos');
        // En 3 M (la diaria) no hay nadie fuera: sin aviso.
        await elegir(pagina, '3m');
        assert.equal((await leerGrafico(pagina)).aviso, null);
        await pagina.goto(local.url + '/', { waitUntil: 'load' });
        await pagina.waitForSelector('#mercado .mk-ct .mk-mini-svg', { timeout: 20000 });
        const a1m = modelo.graficoPestana(unida, '1m').avisoFuera;
        assert.equal(await pagina.textContent('#mercado .mk-aviso-fuera'), a1m[0].toUpperCase() + a1m.slice(1) + '.', 'Inicio también lo dice');
        assert.ok((await pagina.getAttribute('#mercado a.mk-ct', 'aria-label')).includes('; ' + a1m));
        assert.deepEqual(errores, []);
        await contexto.close();
      }
    } finally { await navegador.close(); await local.cerrar(); }
  });
