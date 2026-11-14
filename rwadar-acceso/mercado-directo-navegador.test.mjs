/* El gráfico en directo en la web (14/11/2026, migración 35): /mercado/ e
   Inicio con /api/tokenizacion/directo. Con los datos reales del 13/11
   (la diaria y la fina de la misma lectura, servidas como las serviría el
   directo), en Chromium a 390 × 844 y 1366 × 900, en castellano e inglés:
   de dónde sale la serie (data-mercado-origen), la cifra grande y su hora,
   que el final de 24 h, 1 S, 1 M, 3 M y 1 A es la cifra, que la fina
   publicada no se pide si el directo vale, el respaldo (503 → archivo con
   aviso; 404, también el de una web sin la ruta → archivo sin aviso; sin
   fina → diaria, 24 h desactivada y «día a día»; en 24 h, si el directo
   cae y no hay fina, la primera pestaña con datos), la hora del móvil mal
   puesta, el refresco con un reloj simulado sin cambiar de pestaña, nada
   fuera de la pantalla, ni errores ni bloqueos de la CSP. Sin red. Con RWADAR_CAPTURAS=carpeta, guarda las
   capturas a escala 2. */
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
const FINA_TEXTO = leer('rwadar-app/tokenizacion/prueba-serie-fina-20261113.json');
const FINA = JSON.parse(FINA_TEXTO);
// El directo de las 15:10:06 UTC (16:10 en España), servido 3 minutos después.
const SERVIDO = JSON.stringify({ version: 1, fina: FINA, sinLectura: { '5m': [], '1h': [] } });
const AHORA = Date.parse(FINA.generado) + 3 * 60000;
const UNIDA = modelo.unirDirecto(JSON.parse(DIARIA), JSON.parse(SERVIDO), { edadMs: 3 * 60000 }).serie;
const plano = t => String(t).replace(/\s+/g, ' ').trim();
const CAPTURAS = process.env.RWADAR_CAPTURAS || '';

test('el directo real se une a la diaria real y cada pestaña acaba en la cifra grande', () => {
  assert.ok(UNIDA && modelo.esDirecto(UNIDA));
  const cifra = modelo.cifraGrande(UNIDA, null).valor;
  for (const p of modelo.PESTANAS) {
    const g = modelo.graficoPestana(UNIDA, p.clave);
    assert.equal(g.puntos.at(-1).valor, cifra, p.clave);
  }
  const js = leer('rwadar-site/assets/mercado-20261111.js');
  assert.match(js, /const RUTA_DIRECTO = '\/api\/tokenizacion\/directo'/);
  assert.match(js, /modelo\.unirDirecto\(diaria, directo\.cuerpo, \{ edadMs: directo\.edadMs \}\)/);
});

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

/* Una página: la diaria real, el directo como diga «directo» ({ estado, cuerpo }) con la cabecera Date
   del servidor, y la fina publicada (o un 404). Cuenta lo que pide. El reloj del navegador, en
   «relojMovil» (simulado: page.clock). */
async function abrir(navegador, url, { ancho, alto, tactil, directo, fina = FINA_TEXTO, relojMovil = AHORA, idioma = null }) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: 2 });
  const pagina = await contexto.newPage();
  const errores = [], pedidas = { directo: 0, fina: 0 };
  let servidor = AHORA;
  pagina.on('pageerror', e => errores.push(e.message));
  await pagina.clock.install({ time: relojMovil });
  await pagina.addInitScript(l => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    if (l) try { localStorage.setItem('rwadar-idioma', l); } catch { /* sin almacenamiento */ } }, idioma);
  await pagina.route('**/datos/tokenizacion-serie.json', r => r.fulfill({ contentType: 'application/json', body: DIARIA }));
  await pagina.route('**/datos/tokenizacion-serie-fina.json', r => { pedidas.fina++; return fina === null ? r.fulfill({ status: 404, body: 'No' }) : r.fulfill({ contentType: 'application/json', body: fina }); });
  await pagina.route('**/api/tokenizacion/directo', r => {
    pedidas.directo++;
    const d = typeof directo === 'function' ? directo(pedidas.directo) : directo;
    return r.fulfill({ status: d.estado, contentType: 'application/json', body: d.cuerpo, headers: { date: new Date(servidor).toUTCString() } });
  });
  await pagina.goto(url, { waitUntil: 'load' });
  return { contexto, pagina, errores, pedidas, servidorEn: ms => { servidor = ms; } };
}
const BIEN = { estado: 200, cuerpo: SERVIDO };
const leerCabecera = pagina => pagina.evaluate(() => {
  const s = document.querySelector('#tokenizacion');
  const fuera = [...s.querySelectorAll('*')].filter(n => !n.closest('.solo-lector'))
    .filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); });
  return { origen: s.dataset.mercadoOrigen, series: s.dataset.mercadoSeries, cifra: s.querySelector('.mk-cifra-num')?.textContent, sub: s.querySelector('.mk-sub')?.textContent,
    aviso: s.querySelector('.mk-aviso-directo')?.textContent ?? null, cambio: s.querySelector('.mk-linea-cambio')?.textContent,
    max: Number(s.querySelector('.mk-graf')?.getAttribute('aria-valuemax')), pestana: s.querySelector('.mk-pestana[aria-pressed="true"]')?.dataset.pestana,
    dia: s.querySelector('[data-pestana="1d"]')?.disabled, nota: s.querySelector('.mk-nota-larga')?.textContent, fuera: fuera.length, ancho: document.documentElement.scrollWidth };
});
async function elegir(pagina, clave) {
  await pagina.click(`[data-pestana="${clave}"]`);
  await pagina.waitForFunction(c => document.querySelector(`[data-pestana="${c}"]`)?.getAttribute('aria-pressed') === 'true' && document.querySelector('.mk-graf'), clave);
}
/* El valor del último punto de la pestaña, con la cruz en el último punto (teclado: Fin). */
async function ultimoValor(pagina) {
  await pagina.focus('.mk-graf');
  await pagina.keyboard.press('End');
  await pagina.waitForSelector('.mk-burbuja:not([hidden])');
  const v = await pagina.textContent('.mk-burbuja');
  await pagina.keyboard.press('Escape');
  return v;
}
async function capturar(pagina, nombre) {
  if (!CAPTURAS) return;
  fs.mkdirSync(CAPTURAS, { recursive: true });
  await pagina.screenshot({ path: path.join(CAPTURAS, nombre + '.png'), fullPage: false });
}

test('en Chromium: /mercado/ e Inicio con el directo, sus respaldos y el refresco', { skip: sinNavegador, timeout: 240000 }, async () => {
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, ahora: () => AHORA,
    responder: async url => (url.hostname === 'api.coingecko.com' ? new Response(COINGECKO) : null) });
  const navegador = await playwright.chromium.launch();
  const cifraTexto = plano(modelo.millones(41815579529));
  try {
    for (const [ancho, alto, tactil] of [[390, 844, true], [1366, 900, false]]) {
      // 1 · El directo bien: la serie es la del directo, la cifra grande la suya y la fina publicada ni se pide.
      const { contexto, pagina, errores, pedidas } = await abrir(navegador, local.url + '/mercado/', { ancho, alto, tactil, directo: BIEN });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="directo"] .mk-svg', { timeout: 20000 });
      let c = await leerCabecera(pagina);
      assert.deepEqual([c.origen, c.series, plano(c.cifra), c.aviso, pedidas.fina], ['directo', '5m,1h', cifraTexto, null, 0], `${ancho}: directo`);
      assert.match(plano(c.sub), /13\/11\/2026, 16:05 \(hora de España\)$/);
      for (const clave of ['1d', '1s', '1m', '3m', '1a']) {
        await elegir(pagina, clave);
        assert.equal(plano(await ultimoValor(pagina)).includes(plano(modelo.millones(41815579529))), true, `${ancho} ${clave}: el último punto es la cifra grande`);
      }
      await elegir(pagina, '1d');
      c = await leerCabecera(pagina);
      const g24 = modelo.graficoPestana(UNIDA, '1d');
      assert.ok(plano(c.cambio).includes(plano(g24.cambioTexto)), `${ancho}: el cambio de 24 h, de la de 5 minutos`);
      await pagina.click('.mk-como summary');
      assert.match(plano((await leerCabecera(pagina)).nota), /Se pide a CoinGecko cada 5 minutos\./);
      assert.deepEqual([c.fuera, c.ancho], [0, ancho], `${ancho}: nada fuera de la pantalla`);
      await capturar(pagina, `web-${ancho}-mercado-directo-24h`);
      // En inglés.
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="en"]').click());
      await pagina.waitForFunction(() => document.querySelector('.mk-pestana[data-pestana="1d"]')?.textContent === '24H');
      c = await leerCabecera(pagina);
      assert.match(plano(c.sub), /13 Nov 2026, 16:05 \(Spain time\)$/);
      if (ancho === 390) await capturar(pagina, `web-${ancho}-mercado-directo-24h-en`);
      await pagina.evaluate(() => document.querySelector('[data-elegir-idioma="es"]').click());
      await pagina.waitForFunction(() => document.querySelector('.mk-pestana[data-pestana="1d"]')?.textContent === '24 h');
      assert.deepEqual(await pagina.evaluate(() => window.__csp), [], `${ancho}: nada bloqueado por la CSP`);
      assert.deepEqual(errores, [], `${ancho}: sin errores de JavaScript`);
      // Inicio: la misma cifra, del directo.
      await pagina.goto(local.url + '/', { waitUntil: 'load' });
      await pagina.waitForSelector('#mercado[data-mercado-origen="directo"] .mk-mini-svg', { timeout: 20000 });
      assert.equal(plano(await pagina.textContent('#mercado .mk-ct-cifra')), plano(modelo.millones(41815579529)));
      assert.equal(await pagina.$('#mercado .mk-ct-copia'), null);
      await pagina.locator('#mercado').scrollIntoViewIfNeeded();
      await capturar(pagina, `web-${ancho}-inicio-directo`);
      await contexto.close();
    }

    // 2 · El directo encendido y fallando (503): la copia publicada y el aviso; apagado (404): sin aviso.
    for (const [caso, directo, aviso] of [['atrasado', { estado: 503, cuerpo: '{"error":"directo_atrasado"}' }, true], ['no responde', { estado: 503, cuerpo: '{"error":"directo_no_responde"}' }, true],
      ['roto', { estado: 200, cuerpo: '{"version":1}' }, true], ['sin red', { estado: 500, cuerpo: '<html>' }, true],
      ['apagado', { estado: 404, cuerpo: '{"error":"directo_apagado"}' }, false], ['no casa', { estado: 503, cuerpo: '{"error":"directo_no_casa"}' }, false],
      // Una web sin la ruta (la OTA antes que la web, o una web anterior publicada): 404 ruta_no_permitida es «apagado», sin aviso falso.
      ['web sin la ruta', { estado: 404, cuerpo: '{"error":"ruta_no_permitida"}' }, false]]) {
      const { contexto, pagina, errores, pedidas } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, directo });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="archivo"] .mk-svg', { timeout: 20000 });
      const c = await leerCabecera(pagina);
      assert.equal(pedidas.fina, 1, caso);
      assert.equal(c.aviso, aviso ? 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, con datos hasta el 13/11/2026, 16:05 (hora de España).' : null, caso);
      assert.deepEqual([c.fuera, c.ancho, errores], [0, 390, []], caso);
      if (caso === 'atrasado') {
        await capturar(pagina, 'web-390-mercado-copia-con-aviso');
        await pagina.goto(local.url + '/', { waitUntil: 'load' });
        await pagina.waitForSelector('#mercado[data-mercado-origen="archivo"] .mk-ct-copia', { timeout: 20000 });
        assert.equal(plano(await pagina.textContent('#mercado .mk-ct-copia')), 'copia de las 16:05');
      }
      await contexto.close();
    }
    // Sin fina publicada (y el directo fallando): la diaria sola, 24 h desactivada y «día a día».
    {
      const { contexto, pagina } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, directo: { estado: 503, cuerpo: '{"error":"directo_sin_datos"}' }, fina: null });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="diaria"] .mk-svg', { timeout: 20000 });
      const c = await leerCabecera(pagina);
      assert.deepEqual([c.dia, c.aviso], [true, 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, día a día.']);
      await contexto.close();
    }

    // 3 · El móvil con la hora 2 horas adelantada o atrasada: sigue el directo (la edad va con la hora del servidor).
    for (const desfase of [2, -2]) {
      const { contexto, pagina } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, directo: BIEN, relojMovil: AHORA + desfase * 3600000 });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="directo"] .mk-svg', { timeout: 20000 });
      await contexto.close();
    }
    // Y si el servidor dice que el dato tiene 21 minutos, no se usa.
    {
      const { contexto, pagina, servidorEn } = await abrir(navegador, 'about:blank', { ancho: 390, alto: 844, tactil: true, directo: BIEN });
      servidorEn(Date.parse(FINA.generado) + 21 * 60000);
      await pagina.goto(local.url + '/mercado/', { waitUntil: 'load' });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="archivo"] .mk-aviso-directo', { timeout: 20000 });
      await contexto.close();
    }

    // 4 · El refresco: con la página a la vista vuelve a pedir el directo con el dato siguiente, sin cambiar de pestaña.
    {
      const { contexto, pagina, pedidas, servidorEn } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, directo: BIEN });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="directo"] .mk-svg', { timeout: 20000 });
      await elegir(pagina, '1s');
      await pagina.click('.mk-como summary');
      assert.equal(pedidas.directo, 1);
      servidorEn(AHORA + 4 * 60000);
      await pagina.clock.runFor(3 * 60000 + 31000);
      await pagina.waitForFunction(() => document.querySelector('.mk-graf'));
      assert.equal(pedidas.directo, 2, 'a los 6,5 minutos del dato, otra vez');
      const c = await leerCabecera(pagina);
      assert.deepEqual([c.origen, c.pestana], ['directo', '1s'], 'sigue en 1 S');
      assert.equal(await pagina.evaluate(() => document.querySelector('.mk-como').open), true, '«Cómo se calcula» sigue abierto');
      // Si ahora el directo falla, pasa a la copia publicada con su aviso, sin cambiar de pestaña.
      await pagina.unroute('**/api/tokenizacion/directo');
      await pagina.route('**/api/tokenizacion/directo', r => { pedidas.directo++; return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"directo_no_responde"}' }); });
      // El dato tenía ya 7 minutos: el siguiente intento, a los 15 s.
      await pagina.clock.fastForward(20000);
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="archivo"] .mk-aviso-directo', { timeout: 20000 });
      assert.equal((await leerCabecera(pagina)).pestana, '1s');
      // Oculta, no pide.
      const antes = pedidas.directo;
      await pagina.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      await pagina.clock.runFor(20 * 60000);
      assert.equal(pedidas.directo, antes, 'oculta, no pide');
      await contexto.close();
    }
    // 5 · En «24 h» con el directo, el directo falla y la copia publicada no trae la de 5 minutos (la fase 2, sin --fina):
    //     no se queda en «no disponible» con «24 h» marcada y desactivada; pasa a la primera pestaña con datos (revisión del 14/11).
    {
      const primera = modelo.PESTANAS.find(p => modelo.pestanaDisponible(modelo.validarSerie(JSON.parse(DIARIA)), p.clave)).clave;
      const { contexto, pagina, pedidas, errores } = await abrir(navegador, local.url + '/mercado/', { ancho: 390, alto: 844, tactil: true, directo: BIEN, fina: null });
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="directo"] .mk-svg', { timeout: 20000 });
      await elegir(pagina, '1d');
      await pagina.unroute('**/api/tokenizacion/directo');
      await pagina.route('**/api/tokenizacion/directo', r => { pedidas.directo++; return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"directo_no_responde"}' }); });
      await pagina.clock.runFor(3 * 60000 + 31000);
      await pagina.waitForSelector('#tokenizacion[data-mercado-origen="diaria"] .mk-svg', { timeout: 20000 });
      const c = await leerCabecera(pagina);
      assert.deepEqual([c.pestana, c.dia, c.aviso], [primera, true, 'Ahora no se puede usar el dato en directo: el gráfico usa la última copia publicada, día a día.']);
      assert.equal(await pagina.$('#tokenizacion .mk-estado'), null, 'sin «El gráfico no está disponible ahora»');
      assert.ok(await pagina.$('#tokenizacion .mk-graf'), 'con su gráfico');
      assert.deepEqual([c.fuera, c.ancho, errores], [0, 390, []]);
      await capturar(pagina, 'web-390-mercado-directo-cae-sin-fina');
      await contexto.close();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
