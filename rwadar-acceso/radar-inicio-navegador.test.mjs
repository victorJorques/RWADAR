/* El radar de Inicio (13/11/2026), en Chromium sobre el worker local con las
   fuentes de rwadar-site. Encargo: «arregla el radar de inicio que se ve mal».
   Antes, en el móvil, los rótulos iban dentro del SVG, crecían al escalarlo y
   se montaban sobre el aro y los puntos; en pantallas bajas se escondían.
   - Móvil (320 × 568 a 430 × 932): el radar redondo sin texto y, a su lado,
     la leyenda en texto real (6 filas en el orden del radar, punto de color,
     nombre corto y cifra). Ninguna caja de la leyenda toca el círculo, nada
     se sale a lo ancho, el bloque no pasa de la altura de antes (176 px; 120
     en pantallas bajas) y «Ver las ofertas» y el aviso de riesgo siguen en la
     primera pantalla, por encima de la barra de abajo. Contraste AA.
   - Tableta y escritorio (768 × 1024 a 1920 × 1080, y 1000 × 650): el radar grande con los
     rótulos alrededor; ninguno pisa el aro, las marcas ni un punto, ni se sale.
   - En inglés, los nombres traducidos con el diccionario de siempre.
   - Sin cifras (revisión vencida o sin comprobar), solo los nombres; una
     categoría sin plataformas se queda con su «0» atenuado.
   - Al cambiar de tamaño cambia de modo, y tocar el radar o la leyenda lleva
     a Plataformas.
   En local (127.0.0.1, modo local seguro) la web no consulta Supabase y el
   catálogo sale «sin comprobar», sin cifras. Como en la web publicada, donde
   se comprueba, la prueba lo marca comprobado (CATALOGO_SIN_COMPROBAR = false)
   y vuelve a pintar Inicio, con el reloj en el día de la revisión. Sin red.
   Con RWADAR_CAPTURAS=<carpeta> guarda además las capturas (a 2×). */
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
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CAPTURAS = process.env.RWADAR_CAPTURAS || '';
const INGLES = require(path.join(RAIZ, 'rwadar-site', 'assets', 'idioma-en-20261022.js'));

/* El catálogo que publica la web: cuántas plataformas hay de cada tipo y el día de la revisión. */
const P = (() => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8') + ';globalThis.__P=P;', ctx);
  return JSON.parse(JSON.stringify(ctx.__P));
})();
const CATEGORIAS = ['Inmobiliario', 'Crédito privado', 'Tesoro y fondos', 'Acciones y capital privado', 'Materias primas', 'Infraestructura'];
const CORTOS = ['Inmobiliario', 'Crédito', 'Tesoro', 'Acciones', 'Materias primas', 'Infraestructura'];
const CUENTAS = CATEGORIAS.map(c => P.filter(p => p.cat === c).length);
const RELOJ = new Date(P[0].verificado_lote_el + 'T12:00:00Z');
const MOVIL = [[320, 568], [360, 640], [375, 667], [390, 664], [390, 844], [412, 915], [430, 932]];
// Y una tableta apaisada baja (1000 × 650): antes una regla escondía ahí los rótulos.
const ESCRITORIO = [[768, 1024], [820, 1180], [1024, 768], [1366, 900], [1920, 1080], [1000, 650]];

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
const CONTRASTE = `(n) => {
  const rgb = (c) => (c.match(/[\\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const color = rgb(getComputedStyle(n).color);
  let fondo = null;
  for (let x = n; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) { fondo = c; break; } }
  fondo = fondo || rgb(getComputedStyle(document.body).backgroundColor);
  const [a, b] = [lum(color), lum(fondo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}`;

/* El aro del radar en pantalla: centro, radio del aro y radio con las marcas (136 y 144 unidades). */
const ARO = `() => {
  const b = document.querySelector('#inicioRadar circle.radar-borde'); if (!b) return null;
  const r = b.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, r: r.width / 2, rMarcas: r.width / 2 * 144 / 136 };
}`;
/* Distancia del centro del aro a la caja más cercana de un rectángulo (0 si lo contiene). */
const DISTANCIA = `(a, q) => Math.hypot(Math.max(q.left - a.cx, 0, a.cx - q.right), Math.max(q.top - a.cy, 0, a.cy - q.bottom))`;

/* Lo que se mide en el móvil. */
const LEER_MOVIL = `() => {
  const aro = (${ARO})(), distancia = ${DISTANCIA}, contraste = ${CONTRASTE};
  const caja = document.querySelector('[data-inicio-radar]'), svg = document.getElementById('inicioRadar'), ley = document.getElementById('inicioRadarLista');
  const rc = caja.getBoundingClientRect(), rs = svg.getBoundingClientRect(), rl = ley.getBoundingClientRect();
  const filas = [...ley.querySelectorAll('li')];
  const cajas = filas.flatMap(li => [li, ...li.querySelectorAll('.ir-ley-punto,.ir-ley-nombre,.ir-ley-n')]).map(n => n.getBoundingClientRect());
  const nav = document.getElementById('movilNav'), limite = nav && nav.getClientRects().length ? nav.getBoundingClientRect().top : innerHeight;
  const cta = document.querySelector('#relPortada .rel-cta').getBoundingClientRect(), aviso = document.querySelector('#relPortada .rel-aviso').getBoundingClientRect();
  const portada = document.getElementById('relPortada');
  const fuera = [...portada.querySelectorAll('*')].filter(n => !n.closest('.solo-lector')).filter(n => { const b = n.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); }).length;
  return {
    aro, caja: { left: rc.left, right: rc.right, top: rc.top, bottom: rc.bottom, alto: rc.height },
    svg: { left: rs.left, right: rs.right, top: rs.top, bottom: rs.bottom }, ley: { left: rl.left, right: rl.right, top: rl.top, bottom: rl.bottom, ancho: rl.width, clip: getComputedStyle(ley).clipPath },
    textos: svg.querySelectorAll('text').length, vista: svg.getAttribute('viewBox'),
    filas: filas.map(li => ({ nombre: li.querySelector('.ir-ley-nombre')?.textContent, n: li.querySelector('.ir-ley-n')?.textContent ?? null,
      lector: li.querySelector('.solo-lector')?.textContent ?? null, oculto: li.querySelector('.ir-ley-n')?.getAttribute('aria-hidden') ?? null,
      color: li.querySelector('.ir-ley-punto circle')?.getAttribute('fill'), punto: li.querySelector('.ir-ley-punto').getBoundingClientRect().width,
      cero: li.classList.contains('ir-ley-cero'), visible: li.getClientRects().length > 0 && li.getBoundingClientRect().width > 40,
      letra: parseFloat(getComputedStyle(li.querySelector('.ir-ley-nombre')).fontSize),
      cNombre: contraste(li.querySelector('.ir-ley-nombre')), cN: li.querySelector('.ir-ley-n') ? contraste(li.querySelector('.ir-ley-n')) : null })),
    tocaAro: aro ? cajas.filter(q => distancia(aro, q) < aro.rMarcas).length : -1,
    sobreSvg: cajas.filter(q => q.left < rs.right && q.right > rs.left && q.top < rs.bottom && q.bottom > rs.top).length,
    cta: { top: cta.top, bottom: cta.bottom }, aviso: { top: aviso.top, bottom: aviso.bottom }, limite,
    fecha: parseFloat(getComputedStyle(document.querySelector('#inicioCifras .ini-cifra-fecha b')).fontSize),
    fuera, anchoDoc: document.documentElement.scrollWidth, anchoVentana: innerWidth, lang: document.documentElement.lang,
  };
}`;

/* Lo que se mide en tableta y escritorio. */
const LEER_ESCRITORIO = `() => {
  const aro = (${ARO})(), distancia = ${DISTANCIA};
  const svg = document.getElementById('inicioRadar'), ley = document.getElementById('inicioRadarLista');
  const puntos = [...svg.querySelectorAll('circle[r="5.6"]')].map(c => c.getBoundingClientRect());
  const rotulos = [...svg.querySelectorAll('text.ir-et')].map(t => ({ texto: t.textContent, q: t.getBoundingClientRect() }));
  const cruza = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  return {
    vista: svg.getAttribute('viewBox'), puntos: puntos.length,
    rotulos: rotulos.map(({ texto, q }) => ({ texto, holgura: +(distancia(aro, q) - aro.rMarcas).toFixed(1),
      sobrePunto: puntos.some(p => cruza(p, q)), dentro: q.left >= 0 && q.right <= innerWidth && q.top >= 0, visible: q.width > 0 && q.height > 0 })),
    entreSi: rotulos.filter((a, i) => rotulos.some((b, j) => j > i && cruza(a.q, b.q))).length,
    ley: { filas: ley.querySelectorAll('li').length, ancho: ley.getBoundingClientRect().width, clip: getComputedStyle(ley).clipPath,
      lector: [...ley.querySelectorAll('li')].map(li => li.textContent) },
    anchoDoc: document.documentElement.scrollWidth, anchoVentana: innerWidth,
  };
}`;

async function abrir(navegador, ancho, alto, idioma) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: CAPTURAS ? 2 : 1 });
  // Sin la ventana de novedades encima (ya vista) y en el idioma pedido.
  await contexto.addInitScript(i => { try { localStorage.setItem('rwadar.novedades.vista', '2026-11-12'); localStorage.setItem('rwadar.idioma', i); } catch {} }, idioma);
  const pagina = await contexto.newPage();
  await pagina.clock.setFixedTime(RELOJ);
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  // En local no hay fotos de las noticias (404) ni sesión (401): solo cuentan los errores de la página.
  pagina.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  return { contexto, pagina, errores };
}
/* Con o sin cifras, como cuando Supabase confirma el catálogo o no. */
async function conCifras(pagina, si = true) {
  await pagina.evaluate(s => { CATALOGO_SIN_COMPROBAR = !s; huellaInicio = ''; pintarInicio(); }, si);
  await pagina.waitForTimeout(150);
}
/* Carga Inicio y espera a que acabe la carga del catálogo local (en
   127.0.0.1 la web va en modo local seguro: sin escaparate local marca
   body.modo-local-seguro): así no vuelve a pintar encima de lo que fija la prueba. */
async function cargar(pagina, url) {
  await pagina.goto(url, { waitUntil: 'load' });
  await pagina.waitForFunction(() => document.body.classList.contains('modo-local-seguro'), null, { timeout: 15000 });
  await pagina.waitForSelector('#inicioRadarLista li', { state: 'attached', timeout: 20000 });
  await pagina.waitForTimeout(200);
  await conCifras(pagina, true);
}
function comprobarMovil(m, { ancho, alto, idioma, cifras = true }) {
  const donde = `${idioma} ${ancho}×${alto}`, baja = alto <= 700;
  const nombres = idioma === 'en' ? CORTOS.map(n => INGLES[n]) : CORTOS;
  assert.equal(m.textos, 0, `${donde}: el radar no lleva texto dentro`);
  assert.equal(m.vista, '55 55 290 290', `${donde}: el radar va recortado al aro`);
  assert.equal(m.lang, idioma);
  assert.ok(m.ley.ancho > 60 && m.ley.clip === 'none', `${donde}: la leyenda se ve (${m.ley.ancho} px, clip ${m.ley.clip})`);
  assert.equal(m.filas.length, 6, `${donde}: 6 filas`);
  assert.deepEqual(m.filas.map(f => f.nombre), nombres, `${donde}: nombres en el orden del radar`);
  assert.ok(m.filas.every(f => f.visible), `${donde}: las 6 filas se ven`);
  assert.ok(m.filas.every(f => f.punto >= 8 && f.punto <= 10), `${donde}: puntos de 8 a 10 px`);
  assert.ok(m.filas.every(f => f.letra >= 12 && (baja || f.letra >= 13)), `${donde}: letra de ${m.filas.map(f => f.letra).join('/')} px`);
  assert.ok(m.filas.every(f => f.cNombre >= 4.5 && (f.cN === null || f.cN >= 4.5)), `${donde}: contraste ${m.filas.map(f => f.cNombre.toFixed(1) + '/' + f.cN?.toFixed(1)).join(' ')}`);
  if (cifras) {
    assert.deepEqual(m.filas.map(f => f.n), CUENTAS.map(String), `${donde}: cifras de plataformas`);
    assert.ok(m.filas.every(f => f.oculto === 'true'), `${donde}: la cifra a la vista va oculta al lector`);
    assert.deepEqual(m.filas.map(f => f.lector), CUENTAS.map(n => idioma === 'en' ? `${n} platform${n === 1 ? '' : 's'}` : `${n} plataforma${n === 1 ? '' : 's'}`), `${donde}: el lector oye la cifra con su unidad`);
  } else {
    assert.ok(m.filas.every(f => f.n === null && f.lector === null), `${donde}: sin cifras, solo los nombres`);
  }
  assert.equal(m.tocaAro, 0, `${donde}: ninguna caja de la leyenda toca el círculo del radar`);
  assert.equal(m.sobreSvg, 0, `${donde}: la leyenda va al lado del radar, no encima`);
  const diametro = m.aro.r * 2;
  if (baja) assert.ok(diametro >= 112 && diametro <= 120, `${donde}: aro de ${diametro.toFixed(1)} px (pantalla baja: 112–120)`);
  else assert.ok(diametro >= 148 && diametro <= 160, `${donde}: aro de ${diametro.toFixed(1)} px (148–160)`);
  assert.ok(m.caja.alto <= (baja ? 128 : 184), `${donde}: el bloque mide ${m.caja.alto} px`);
  assert.ok(m.ley.top >= m.caja.top - 0.5 && m.ley.bottom <= m.caja.bottom + 0.5, `${donde}: la leyenda cabe en el bloque`);
  const izq = m.svg.left - m.caja.left, der = m.caja.right - m.ley.right;
  assert.ok(Math.abs(izq - der) <= 2, `${donde}: radar y leyenda centrados como un bloque (${izq.toFixed(1)} y ${der.toFixed(1)})`);
  assert.equal(m.fuera, 0, `${donde}: nada se sale a lo ancho`);
  assert.ok(m.anchoDoc <= m.anchoVentana, `${donde}: sin desplazamiento horizontal (${m.anchoDoc} > ${m.anchoVentana})`);
  assert.ok(m.cta.top >= 0 && m.cta.bottom <= m.limite, `${donde}: «Ver las ofertas» en la primera pantalla (${m.cta.bottom.toFixed(0)} ≤ ${m.limite.toFixed(0)})`);
  assert.ok(m.aviso.bottom <= m.limite, `${donde}: el aviso de riesgo en la primera pantalla (${m.aviso.bottom.toFixed(0)} ≤ ${m.limite.toFixed(0)})`);
  // La fecha de revisión no crece en las pantallas más estrechas (a 320 px llegaba a 22 px y empujaba el botón).
  assert.ok(m.fecha <= 17, `${donde}: la fecha de revisión a ${m.fecha} px`);
}
function comprobarEscritorio(e, { ancho, alto, idioma }) {
  const donde = `${idioma} ${ancho}×${alto}`;
  const nombres = idioma === 'en' ? CORTOS.map(n => INGLES[n]) : CORTOS;
  assert.equal(e.vista, '-14 6 416 388', `${donde}: el radar grande con sitio para los rótulos`);
  assert.equal(e.puntos, P.length, `${donde}: un punto por plataforma`);
  assert.equal(e.rotulos.length, 6, `${donde}: 6 rótulos`);
  assert.deepEqual(e.rotulos.map(r => r.texto.replace(/\s*\d+$/, '')), nombres, `${donde}: rótulos traducidos y en su orden`);
  assert.deepEqual(e.rotulos.map(r => r.texto.match(/(\d+)$/)?.[1]), CUENTAS.map(String), `${donde}: la cifra de cada rótulo`);
  for (const r of e.rotulos) {
    assert.ok(r.visible, `${donde}: «${r.texto}» no se ve`);
    assert.ok(r.holgura >= 2, `${donde}: «${r.texto}» pisa el aro o las marcas (holgura ${r.holgura} px)`);
    assert.ok(!r.sobrePunto, `${donde}: «${r.texto}» pisa un punto`);
    assert.ok(r.dentro, `${donde}: «${r.texto}» se sale de la pantalla`);
  }
  assert.equal(e.entreSi, 0, `${donde}: los rótulos no se montan entre sí`);
  assert.ok(e.ley.filas === 6 && e.ley.ancho <= 1 && e.ley.clip !== 'none', `${donde}: la leyenda queda solo para el lector`);
  assert.ok(e.anchoDoc <= e.anchoVentana, `${donde}: sin desplazamiento horizontal`);
}

test('en Chromium: radar de Inicio con su leyenda al lado en el móvil y rótulos sin pisar el aro en escritorio, en castellano y en inglés', { skip: sinNavegador, timeout: 900000 }, async () => {
  assert.equal(CUENTAS.reduce((a, b) => a + b, 0), P.length, 'cada plataforma tiene una de las seis categorías');
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0 });
  const navegador = await playwright.chromium.launch();
  try {
    for (const idioma of ['es', 'en']) {
      for (const [ancho, alto] of MOVIL) {
        const { contexto, pagina, errores } = await abrir(navegador, ancho, alto, idioma);
        await cargar(pagina, local.url + '/');
        comprobarMovil(await pagina.evaluate(`(${LEER_MOVIL})()`), { ancho, alto, idioma });
        if (CAPTURAS && (idioma === 'es' || (ancho === 390 && alto === 844))) {
          await pagina.screenshot({ path: path.join(CAPTURAS, `movil-${idioma}-${ancho}x${alto}.png`) });
          await pagina.locator('#relPortada').screenshot({ path: path.join(CAPTURAS, `movil-${idioma}-${ancho}x${alto}-cabecera.png`) });
        }
        assert.deepEqual(errores, [], `${idioma} ${ancho}×${alto}: sin errores de página`);
        await contexto.close();
      }
      for (const [ancho, alto] of ESCRITORIO) {
        const { contexto, pagina, errores } = await abrir(navegador, ancho, alto, idioma);
        await cargar(pagina, local.url + '/');
        comprobarEscritorio(await pagina.evaluate(`(${LEER_ESCRITORIO})()`), { ancho, alto, idioma });
        if (CAPTURAS && (idioma === 'es' || (ancho === 1366 && alto === 900))) {
          await pagina.screenshot({ path: path.join(CAPTURAS, `escritorio-${idioma}-${ancho}x${alto}.png`) });
          await pagina.locator('[data-inicio-radar]').screenshot({ path: path.join(CAPTURAS, `escritorio-${idioma}-${ancho}x${alto}-radar.png`) });
        }
        assert.deepEqual(errores, [], `${idioma} ${ancho}×${alto}: sin errores de página`);
        await contexto.close();
      }
    }

    // Sin cifras, una categoría a cero, cambio de tamaño y toque, a 390 × 844 (y 390 × 664 sin cifras).
    for (const [ancho, alto] of [[390, 664], [390, 844]]) {
      const { contexto, pagina, errores } = await abrir(navegador, ancho, alto, 'es');
      await cargar(pagina, local.url + '/');
      await conCifras(pagina, false);
      comprobarMovil(await pagina.evaluate(`(${LEER_MOVIL})()`), { ancho, alto, idioma: 'es', cifras: false });
      if (CAPTURAS) await pagina.locator('#relPortada').screenshot({ path: path.join(CAPTURAS, `movil-es-${ancho}x${alto}-sin-cifras.png`) });
      assert.deepEqual(errores, [], 'sin errores de página');
      await contexto.close();
    }
    const { contexto, pagina, errores } = await abrir(navegador, 390, 844, 'es');
    await cargar(pagina, local.url + '/');
    // Una categoría sin plataformas: su fila se queda, con «0» atenuado y legible.
    await pagina.evaluate(() => { globalThis.__P = [...P]; P.splice(0, P.length, ...__P.filter(p => p.cat !== 'Materias primas')); huellaInicio = ''; pintarInicio(); });
    const cero = await pagina.evaluate(`(() => { const li = [...document.querySelectorAll('#inicioRadarLista li')]; const c = li[4];
      const contraste = ${CONTRASTE}, n = c.querySelector('.ir-ley-n');
      return { filas: li.length, cero: c.classList.contains('ir-ley-cero'), nombre: c.querySelector('.ir-ley-nombre').textContent, n: n.textContent,
        color: getComputedStyle(n).color, otro: getComputedStyle(li[0].querySelector('.ir-ley-n')).color, contraste: contraste(n),
        ceros: li.filter(x => x.classList.contains('ir-ley-cero')).length }; })()`);
    assert.deepEqual([cero.filas, cero.cero, cero.nombre, cero.n, cero.ceros], [6, true, 'Materias primas', '0', 1], 'la fila sin plataformas se queda con su 0');
    assert.notEqual(cero.color, cero.otro, 'el 0 va atenuado');
    assert.ok(cero.contraste >= 4.5, `el 0 se lee (contraste ${cero.contraste.toFixed(2)})`);
    if (CAPTURAS) await pagina.locator('#relPortada').screenshot({ path: path.join(CAPTURAS, 'movil-es-390x844-categoria-a-cero.png') });
    await pagina.evaluate(() => { P.splice(0, P.length, ...__P); huellaInicio = ''; pintarInicio(); });

    // Al pasar a escritorio salen los rótulos alrededor; al volver, el radar sin texto y la leyenda.
    await pagina.setViewportSize({ width: 1366, height: 900 });
    await pagina.waitForFunction(() => document.querySelectorAll('#inicioRadar text.ir-et').length === 6, null, { timeout: 5000 });
    comprobarEscritorio(await pagina.evaluate(`(${LEER_ESCRITORIO})()`), { ancho: 1366, alto: 900, idioma: 'es' });
    await pagina.setViewportSize({ width: 390, height: 844 });
    await pagina.waitForFunction(() => document.querySelectorAll('#inicioRadar text').length === 0, null, { timeout: 5000 });
    await pagina.waitForTimeout(200);
    comprobarMovil(await pagina.evaluate(`(${LEER_MOVIL})()`), { ancho: 390, alto: 844, idioma: 'es' });

    // Tocar el radar, o su leyenda, lleva al radar de Plataformas.
    for (const sel of ['#inicioRadar', '#inicioRadarLista li:nth-child(3)']) {
      await pagina.click(sel);
      await pagina.waitForFunction(() => document.body.dataset.movilPestana === 'buscar', null, { timeout: 5000 });
      const destino = await pagina.evaluate(() => ({ vista: document.body.dataset.movilBuscar,
        abierto: document.getElementById('movilPanelRadar').classList.contains('movil-radar-abierto') }));
      assert.deepEqual(destino, { vista: 'plataformas', abierto: true }, `tocar ${sel} lleva a Plataformas`);
      await pagina.click('#movilTabInicio');
      await pagina.waitForFunction(() => document.body.dataset.movilPestana === 'inicio', null, { timeout: 5000 });
      await pagina.waitForTimeout(200);
    }
    assert.deepEqual(errores, [], 'sin errores de página');
    await contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
