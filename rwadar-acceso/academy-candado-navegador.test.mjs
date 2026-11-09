// Candado de las lecciones en la web (petición de Víctor del 08/11/2026): «que
// esté bloqueado Academy, que solo se desbloquee al crearse la cuenta, que salga
// difuminada la página con un candado y que al registrarse y entrar se
// desbloquee». El índice /academy/ y el bloque de lecciones de la portada nacen
// BLOQUEADOS en el HTML; solo una sesión confirmada por /api/acceso/sesion los
// abre (assets/academy-candado-20261108.js, con la pasarela acceso-privado.js).
// La puerta de las lecciones sigue en el servidor (academy-cuenta.test.mjs).
//
// Tres partes: el HTML generado, el script en una VM con la pasarela de verdad
// (siempre) y Chromium con el worker local (solo si Playwright está instalado;
// en CI no lo está y esa parte se omite).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const SITIO = path.join(RAIZ, 'rwadar-site');
const PUBLICADO = path.join(RAIZ, 'rwadar-publicado');
const academyMod = require('../rwadar-academy.js');
const { ingles } = require('../rwadar-movil/lib/idioma.js');
const { ARCHIVOS_PUBLICABLES } = require('../rwadar-publicacion-segura.js');
const lee = relativa => fs.readFileSync(path.join(SITIO, ...relativa.split('/')), 'utf8');
const bridge = lee('assets/acceso-privado.js');
const candadoJS = lee('assets/academy-candado-20261108.js');
const candadoCSS = lee('assets/academy-candado-20261108.css');
const indice = lee('academy/index.html');
const portada = lee('index.html');
const bloquePortada = portada.slice(portada.indexOf('<!--academy:ini-->'), portada.indexOf('<!--academy:fin-->'));
const FALLO = 'No hemos podido comprobar tu sesión. Recarga la página.';
const TEXTOS = {
  'Las lecciones se abren con tu cuenta gratuita': 'Lessons open with your free account',
  'Es gratis: solo necesitas un correo y una contraseña.': "It's free: all you need is an email address and a password.",
  'Crear cuenta gratis': 'Create a free account',
  'Ya tengo cuenta: entrar': 'I already have an account: sign in',
  [FALLO]: "We couldn't check your session. Reload the page.",
  // Revisión del 08/11/2026: «comprobando» y textos con cuenta del índice y de la portada.
  'Comprobando tu sesión…': 'Checking your session…',
  'Gratis con tu cuenta': 'Free with your account',
  'Lecciones desbloqueadas': 'Lessons unlocked',
  'Cada nivel responde a una pregunta. Ya puedes abrir todas las lecciones: un resumen de 30 segundos, un test corto y la fecha de la última revisión legal.':
    'Each level answers a question. You can now open every lesson: a 30-second summary, a short quiz and the latest legal review date.',
};

// El candado de una página: el recuadro (fuera) y el contenido difuminado (dentro).
function partesCandado(html) {
  const ini = html.indexOf('<div class="candado" data-academy-candado data-estado="bloqueado">');
  assert.ok(ini > 0, 'el candado nace bloqueado en el HTML');
  const marcaContenido = '<div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">';
  const iniContenido = html.indexOf(marcaContenido, ini);
  assert.ok(iniContenido > ini, 'el contenido nace con inert y aria-hidden');
  return { caja: html.slice(ini, iniContenido), resto: html.slice(iniContenido), ini };
}

test('el índice y la portada nacen bloqueados: tarjetas difuminadas e inertes, y un recuadro con candado', () => {
  for (const [nombre, html, nivelTitulo] of [['academy/index.html', indice, 'h2'], ['index.html (bloque de lecciones)', bloquePortada, 'h4']]) {
    const { caja, resto, ini } = partesCandado(html);
    // Todas las lecciones van dentro del contenido bloqueado, ninguna en el recuadro ni antes.
    const lecciones = [...html.matchAll(/href="\/academy\/([a-z0-9-]+)"/g)].map(m => m[1]);
    assert.equal(lecciones.length, 9, nombre);
    assert.ok([...html.matchAll(/href="\/academy\/[a-z0-9-]+"/g)].every(m => m.index > ini + caja.length), nombre + ': ninguna lección fuera del bloqueo');
    assert.ok(lecciones.every(slug => resto.includes(`href="/academy/${slug}"`)), nombre);
    // El recuadro: candado SVG sin emoji, título, «es gratis», dos botones y la línea del fallo de red.
    assert.match(caja, /<svg class="candado-icono"[^>]*aria-hidden="true" focusable="false">/);
    assert.match(caja, new RegExp(`<${nivelTitulo} class="candado-tit" id="candado(?:Academy|Portada)Tit">Las lecciones se abren con tu cuenta gratuita</${nivelTitulo}>`));
    assert.match(caja, /<section class="candado-caja" aria-labelledby="candado(?:Academy|Portada)Tit">/);
    assert.ok(caja.includes('<p class="candado-espera">Comprobando tu sesión…</p>\n          <p class="candado-txt">Es gratis: solo necesitas un correo y una contraseña.</p>'),
      nombre + ': «Comprobando tu sesión…» va antes del texto y los botones');
    assert.ok(caja.includes('<a class="candado-boton candado-boton-p" href="/acceso?volver=/academy/">Crear cuenta gratis</a>'));
    assert.ok(caja.includes('<a class="candado-boton candado-boton-s" href="/acceso?volver=/academy/&amp;vista=entrar">Ya tengo cuenta: entrar</a>'));
    assert.ok(caja.includes('<p class="candado-error" data-academy-candado-error role="status"></p>'), 'la línea del fallo nace vacía');
    // El recuadro no es inerte ni se oculta al lector: es lo único que oye del bloque.
    assert.ok(!/\sinert[\s>]/.test(caja) && !/<(?:div|section|p|h\d)[^>]*aria-hidden/.test(caja));
    assert.doesNotMatch(caja, /[\u{1F300}-\u{1FAFF}]/u, 'sin emojis');
    // Y el contenido bloqueado se cierra antes de que acabe el bloque.
    assert.equal((resto.match(/data-academy-candado-contenido/g) || []).length, 1);
  }
  assert.equal(academyMod.ALTA_ACADEMY, '/acceso?volver=/academy/');
  assert.equal(academyMod.ENTRAR_ACADEMY, '/acceso?volver=/academy/&vista=entrar');
  // El tutorial 3D sigue nítido y público: fuera del candado en las dos páginas. En el
  // índice va detrás del bloque (revisión del 08/11/2026: el candado, en la primera pantalla).
  assert.equal((indice.match(/Empezar tutorial 3D/g) || []).length, 1);
  assert.ok(indice.indexOf('Empezar tutorial 3D') > partesCandado(indice).ini && indice.indexOf('Empezar tutorial 3D') < indice.indexOf('<p class="ac-nota">'));
  assert.ok(portada.indexOf('Empezar tutorial 3D') < portada.indexOf('data-academy-candado'));
  assert.equal((portada.match(/data-academy-candado /g) || []).length, 1, 'un solo candado en la portada: el de las lecciones');
});

// Revisión del 08/11/2026 (hallazgos 4, 5 y 6).
test('el índice pone el candado justo bajo la entradilla, con los saltos de nivel dentro y el tutorial 3D detrás', () => {
  const { resto, ini } = partesCandado(indice);
  const iniCab = indice.indexOf('<header class="ac-portada-cab">'), finCab = indice.indexOf('</header>', iniCab);
  const cabecera = indice.slice(iniCab, finCab);
  // Entre la cabecera y el candado no hay nada más: el candado es lo primero tras la entradilla.
  assert.equal(indice.slice(finCab + '</header>'.length, ini).trim(), '');
  // En la cabecera, solo la sobrelínea «Gratis con tu cuenta» (sin repetir el botón del recuadro)
  // y su versión con cuenta, oculta; ni el tutorial 3D ni los saltos.
  assert.ok(cabecera.includes('<p class="ac-sobrelinea" data-academy-sin-cuenta>Gratis con tu cuenta</p>\n    <p class="ac-sobrelinea" data-academy-con-cuenta hidden>Lecciones desbloqueadas</p>'));
  assert.ok(!cabecera.includes('/acceso') && !cabecera.includes('ac-acciones') && !cabecera.includes('ac-tutorial'));
  // Saltos «Nivel 1/2/3»: dentro del contenido inerte, ninguno en la cabecera.
  assert.ok(!cabecera.includes('ac-saltos') && !/href="#(?:principiante|intermedio|avanzado)"/.test(cabecera));
  assert.ok(resto.indexOf('<ol class="ac-saltos" aria-label="Niveles">') >= 0 &&
    resto.indexOf('<ol class="ac-saltos"') < resto.indexOf('<section class="ac-nivel" id="principiante"'));
  // El tutorial 3D, detrás del bloque y fuera de él (el contenido bloqueado se cierra antes).
  const tutorial = indice.indexOf('<section class="ac-extra ac-tutorial"');
  const cierreContenido = indice.lastIndexOf('</div>\n    </div>', tutorial);
  assert.ok(tutorial > ini && cierreContenido > indice.indexOf('id="avanzado"') && cierreContenido < tutorial);
  // La portada marca lo que solo vale sin cuenta y trae su versión con cuenta, oculta.
  for (const marca of ['<p class="etiq" data-academy-sin-cuenta>Gratis con tu cuenta</p>', '<p class="etiq" data-academy-con-cuenta hidden>Lecciones desbloqueadas</p>',
    '<p data-academy-sin-cuenta>Cada nivel responde a una pregunta. Crea tu cuenta gratis para abrir las lecciones:',
    '<p data-academy-con-cuenta hidden>Cada nivel responde a una pregunta. Ya puedes abrir todas las lecciones:']) assert.ok(bloquePortada.includes(marca), marca);
  // Con "publico", todo como antes: tutorial y saltos en la cabecera, sin marcas.
  const academy = academyMod.cargarAcademy();
  const publico = academyMod.construirSalidas({ ...academy, acceso: 'publico' }).get(path.join(SITIO, 'academy', 'index.html'));
  const cabPublico = publico.slice(publico.indexOf('<header class="ac-portada-cab">'), publico.indexOf('</header>', publico.indexOf('<header class="ac-portada-cab">')));
  assert.ok(cabPublico.includes('<ol class="ac-saltos" aria-label="Niveles">') && cabPublico.includes('<section class="ac-extra ac-tutorial"') &&
    cabPublico.indexOf('ac-tutorial') < cabPublico.indexOf('ac-saltos') && !publico.includes('data-academy-sin-cuenta'));
});

test('las dos páginas cargan la misma hoja y el mismo script del candado, publicables y con huella', () => {
  for (const html of [indice, portada]) {
    assert.equal((html.match(/<link rel="stylesheet" href="\/assets\/academy-candado-20261108\.css">/g) || []).length, 1);
    // En <head> y sin defer, justo detrás de idioma-previo: marca html.candado-comprobando
    // antes de pintar (revisión del 08/11/2026). Pregunta por la sesión en DOMContentLoaded,
    // con la pasarela (diferida) ya cargada.
    assert.equal((html.match(/<script src="\/assets\/academy-candado-20261108\.js"><\/script>/g) || []).length, 1);
    assert.equal((html.match(/academy-candado-20261108\.js/g) || []).length, 1);
    assert.ok(html.includes('<script src="/assets/idioma-previo-20261104.js"></script>\n<script src="/assets/academy-candado-20261108.js"></script>'));
    assert.ok(html.indexOf('/assets/academy-candado-20261108.js') < html.indexOf('</head>'));
  }
  assert.match(candadoJS, /if \(document\.readyState === 'loading'\) document\.addEventListener\('DOMContentLoaded', iniciar, \{ once: true \}\);/);
  assert.ok(ARCHIVOS_PUBLICABLES.includes('assets/academy-candado-20261108.css'));
  assert.ok(ARCHIVOS_PUBLICABLES.includes('assets/academy-candado-20261108.js'));
  // Las lecciones no lo cargan: allí la puerta es del servidor.
  const leccion = lee('academy/que-significa-tokenizar-un-activo.html');
  assert.ok(!leccion.includes('academy-candado') && !leccion.includes('data-academy-candado'));
  assert.equal(academyMod.CANDADO_CSS, '/assets/academy-candado-20261108.css');
  assert.equal(academyMod.CANDADO_JS, '/assets/academy-candado-20261108.js');
});

test('con "acceso": "publico" no hay candado en ninguna de las dos páginas', () => {
  const academy = academyMod.cargarAcademy();
  const salidas = academyMod.construirSalidas({ ...academy, acceso: 'publico' });
  for (const nombre of ['academy/index.html', 'index.html']) {
    const html = salidas.get(path.join(SITIO, ...nombre.split('/')));
    assert.ok(!html.includes('data-academy-candado') && !html.includes('candado-contenido'), nombre);
  }
  assert.ok(!salidas.get(path.join(SITIO, 'academy', 'index.html')).includes('academy-candado-20261108'));
});

test('el difuminado solo se aplica bloqueado, respeta el movimiento reducido y no usa estilos en línea', () => {
  assert.match(candadoCSS, /\.candado\[data-estado="bloqueado"\] \.candado-contenido\{filter:blur\(7px\);opacity:\.5;pointer-events:none;\s*user-select:none/);
  assert.match(candadoCSS, /\.candado\[data-estado="abierto"\] \.candado-contenido\{filter:none;opacity:1\}/);
  assert.match(candadoCSS, /@media \(prefers-reduced-motion:reduce\)\{\s*\.candado-contenido,\.candado \.candado-boton\{transition:none\}/);
  assert.match(candadoCSS, /\.candado-capa\[hidden\]\{display:none!important\}/);
  assert.match(candadoCSS, /--candado-verde:#25E39A/);
  // Fijo (sticky) solo si cabe; con poca altura queda arriba del bloque (revisión del 08/11/2026).
  assert.match(candadoCSS, /\.candado-caja\{position:relative;/);
  assert.match(candadoCSS, /@media \(min-height:600px\)\{\.candado-caja\{position:sticky;top:var\(--candado-arriba\)\}\}/);
  assert.equal((candadoCSS.match(/position:sticky/g) || []).length, 1);
  // Comprobando: sin invitaciones, con «Comprobando tu sesión…».
  assert.match(candadoCSS, /html\.candado-comprobando \.candado \.candado-espera\{display:block\}/);
  assert.match(candadoCSS, /html\.candado-comprobando \.candado \.candado-txt,html\.candado-comprobando \.candado \.candado-acciones\{display:none\}/);
  // En el índice, cerrado y ya decidido, lo difuminado se corta y se desvanece (el tutorial 3D, justo debajo).
  assert.match(candadoCSS, /html:not\(\.candado-comprobando\) \.ac-portada \.candado\[data-estado="bloqueado"\] \.candado-contenido\{max-height:640px;overflow:clip;/);
  assert.match(candadoCSS, /\[data-academy-sin-cuenta\]\[hidden\],\[data-academy-con-cuenta\]\[hidden\]\{display:none!important\}/);
  for (const html of [indice, bloquePortada]) assert.doesNotMatch(partesCandado(html).caja, /\sstyle=|\son[a-z]+=|<style/i);
  // El script no lee cookies, no pinta HTML y no llama a la red por su cuenta: usa la pasarela.
  assert.doesNotMatch(candadoJS, /innerHTML|fetch\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage/);
  assert.match(candadoJS, /acceso\.verificar\(\)/);
});

test('los textos del candado tienen su inglés en el diccionario de la web y la app', () => {
  for (const [es, en] of Object.entries(TEXTOS)) assert.equal(ingles(es), en, es);
  assert.ok(candadoJS.includes(`const FALLO = '${FALLO}';`));
  const web = lee('assets/idioma-en-20261022.js');
  assert.equal(web, fs.readFileSync(path.join(RAIZ, 'rwadar-movil', 'lib', 'idioma-en.js'), 'utf8'), 'copia de la web al día');
});

/* ---- El script con la pasarela de verdad, en una VM ---- */
const tick = async (veces = 8) => { for (let i = 0; i < veces; i++) await new Promise(resolver => setImmediate(resolver)); };
function elemento(documento, atributos = {}) {
  const attrs = new Map(Object.entries(atributos));
  return { hidden: false, textContent: '', attrs,
    getAttribute: n => attrs.has(n) ? attrs.get(n) : null, hasAttribute: n => attrs.has(n),
    setAttribute(n, v) { attrs.set(n, String(v)); }, removeAttribute(n) { attrs.delete(n); },
    focus() { documento.activeElement = this; } };
}
// Un candado: la raíz, la capa con el recuadro (título y botón) y el contenido
// (el primer enlace y el destino de un ancla, #intermedio).
function candadoFalso(documento) {
  const e = atributos => elemento(documento, atributos);
  const raiz = e({ 'data-academy-candado': '', 'data-estado': 'bloqueado' });
  const contenido = e({ 'data-academy-candado-contenido': '', inert: '', 'aria-hidden': 'true' });
  const capa = e({ 'data-academy-candado-capa': '' });
  const linea = e({ 'data-academy-candado-error': '', role: 'status' });
  const titulo = e({ class: 'candado-tit' }), boton = e({ href: '/acceso?volver=/academy/' });
  const primerEnlace = e({ href: '/academy/que-significa-tokenizar-un-activo' }), destino = e({ id: 'intermedio' });
  capa.contains = x => [capa, titulo, boton].includes(x);
  contenido.contains = x => [contenido, primerEnlace, destino].includes(x);
  contenido.querySelector = sel => sel === 'a[href]' ? primerEnlace : null;
  raiz.querySelector = sel => ({ '[data-academy-candado-contenido]': contenido, '[data-academy-candado-capa]': capa,
    '[data-academy-candado-error]': linea, '.candado-tit': titulo })[sel] || null;
  const estado = () => ({ estado: raiz.getAttribute('data-estado'), inert: contenido.hasAttribute('inert'),
    ariaHidden: contenido.getAttribute('aria-hidden'), capaOculta: capa.hidden, linea: linea.textContent });
  return { raiz, estado, titulo, boton, primerEnlace, destino };
}
const BLOQUEADO = { estado: 'bloqueado', inert: true, ariaHidden: 'true', capaOculta: false, linea: '' };
const ABIERTO = { estado: 'abierto', inert: false, ariaHidden: null, capaOculta: true, linea: '' };
const SESION = { autenticada: true, usuario: { id: '11111111-1111-4111-8111-111111111111', correo: 'qa@ejemplo.test' } };
const SIN_SESION = () => Response.json({ error: 'sesion_necesaria' }, { status: 401 });

// respuestas: una función por llamada a /api/acceso/sesion (la última se repite).
function pagina({ respuestas = [() => Response.json(SESION)], conPasarela = true, webView = false, pathname = '/academy/', hash = '',
  foco = null } = {}) {
  const llamadas = [], eventos = new Map(), temporizadores = [], clases = new Set();
  const body = { tag: 'body' };
  const documento = { activeElement: body, body, addEventListener() {}, visibilityState: 'visible', readyState: 'complete',
    documentElement: { replaceChildren() {}, classList: { add: c => clases.add(c), remove: c => clases.delete(c), contains: c => clases.has(c) } } };
  const candados = [candadoFalso(documento), candadoFalso(documento)];
  // Lo marcado para quien no tiene cuenta (invitaciones) y para quien sí (oculto).
  const sinCuenta = [elemento(documento), elemento(documento)], conCuenta = [elemento(documento), elemento(documento)];
  for (const el of conCuenta) el.hidden = true;
  documento.querySelectorAll = sel => ({ '[data-academy-candado]': candados.map(c => c.raiz),
    '[data-academy-sin-cuenta]': sinCuenta, '[data-academy-con-cuenta]': conCuenta })[sel] || [];
  documento.getElementById = id => id === 'intermedio' ? candados[0].destino : null;
  if (foco) documento.activeElement = foco(candados[0]);
  const window = { addEventListener: (tipo, fn) => eventos.set(tipo, [...(eventos.get(tipo) || []), fn]) };
  if (webView) window.ReactNativeWebView = { postMessage() {} };
  const context = vm.createContext({ window, URLSearchParams, document: documento,
    location: { pathname, hash, search: '', replace() {}, assign() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setInterval() {},
    setTimeout: (fn, ms) => { temporizadores.push({ fn, ms }); return temporizadores.length; }, requestAnimationFrame: fn => fn(),
    fetch: async (ruta, opciones) => {
      llamadas.push({ ruta, opciones });
      assert.equal(ruta, '/api/acceso/sesion');
      const respuesta = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
      return respuesta();
    } });
  if (conPasarela) vm.runInContext(bridge, context);
  vm.runInContext(candadoJS, context);
  return { llamadas, documento, candados, sinCuenta, conCuenta, temporizadores,
    comprobando: () => clases.has('candado-comprobando'),
    estados: () => candados.map(c => c.estado()),
    pageshow: persisted => (eventos.get('pageshow') || []).forEach(fn => fn({ persisted })) };
}

test('con una sesión válida se abre: sin inert, sin aria-hidden, sin capa y nítido', async () => {
  const p = pagina();
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO], 'antes de la respuesta, bloqueado');
  assert.equal(p.comprobando(), true, 'antes de la respuesta, «Comprobando tu sesión…»');
  await tick();
  assert.deepEqual(p.estados(), [ABIERTO, ABIERTO]);
  assert.equal(p.comprobando(), false);
  // La pasarela y el candado comparten una sola pregunta al servidor.
  assert.equal(p.llamadas.length, 1);
  assert.equal(p.llamadas[0].opciones.credentials, 'same-origin');
  assert.equal(p.llamadas[0].opciones.cache, 'no-store');
  // Fuera la invitación a crear cuenta; dentro «Lecciones desbloqueadas» (portada y cabecera del índice).
  assert.deepEqual(p.sinCuenta.map(e => e.hidden), [true, true]);
  assert.deepEqual(p.conCuenta.map(e => e.hidden), [false, false]);
  assert.equal(p.documento.activeElement, p.documento.body, 'el foco no se mueve si no estaba en el recuadro');
});

test('sin sesión (401/403) o con una respuesta que no es una sesión válida, sigue bloqueado y sin aviso', async () => {
  for (const respuesta of [
    SIN_SESION,
    () => Response.json({ error: 'origen_no_permitido' }, { status: 403 }),
    () => Response.json({ autenticada: false }),
    () => Response.json({ autenticada: true, usuario: { id: '' } }),
    () => Response.json({ autenticada: 'true', usuario: { id: 'x' } }),
    () => new Response('<html>no es JSON</html>', { status: 200 }),
  ]) {
    const p = pagina({ respuestas: [respuesta] });
    await tick();
    assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO], String(respuesta));
    // Ya se sabe: se ven los botones; la invitación sigue y lo «desbloqueado», oculto.
    assert.equal(p.comprobando(), false, String(respuesta));
    assert.deepEqual(p.sinCuenta.map(e => e.hidden), [false, false]);
    assert.deepEqual(p.conCuenta.map(e => e.hidden), [true, true]);
  }
});

test('si la red o el servicio fallan, sigue bloqueado y lo dice en una línea', async () => {
  for (const respuesta of [
    () => { throw new TypeError('Failed to fetch'); },
    () => Response.json({ error: 'servicio_no_disponible' }, { status: 503 }),
    () => Response.json({ error: 'intentos_excedidos' }, { status: 429 }),
    () => new Response('', { status: 500 }),
  ]) {
    const p = pagina({ respuestas: [respuesta] });
    await tick();
    assert.deepEqual(p.estados(), [{ ...BLOQUEADO, linea: FALLO }, { ...BLOQUEADO, linea: FALLO }], String(respuesta));
    assert.equal(p.comprobando(), false, 'con el fallo se ven los botones');
  }
});

test('si la respuesta no llega, a los 8 s se ven igual los botones (no se queda en «Comprobando»)', async () => {
  const p = pagina({ respuestas: [() => new Promise(() => {})] });
  await tick();
  assert.equal(p.comprobando(), true);
  const tope = p.temporizadores.find(t => t.ms === 8000);
  assert.ok(tope, 'hay un tope de 8 s');
  tope.fn();
  assert.equal(p.comprobando(), false);
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
});

test('sin la pasarela de sesión no pregunta a nadie y sigue bloqueado', async () => {
  const p = pagina({ conPasarela: false });
  await tick();
  assert.equal(p.llamadas.length, 0);
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
  assert.equal(p.comprobando(), false, 'sin pasarela, los botones se ven');
});

test('dentro del tutorial 3D de la app (WebView en /#explain) no se pregunta por la sesión', async () => {
  const p = pagina({ webView: true, pathname: '/', hash: '#explain' });
  await tick();
  p.pageshow(true);
  await tick();
  assert.equal(p.llamadas.length, 0);
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
  assert.equal(p.comprobando(), false);
});

test('al volver con «Atrás» desde /acceso ya con sesión, vuelve a preguntar y se abre', async () => {
  const p = pagina({ respuestas: [SIN_SESION, () => Response.json(SESION)] });
  await tick();
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
  p.pageshow(false);
  await tick();
  assert.equal(p.llamadas.length, 1, 'una carga normal no repite la pregunta');
  p.pageshow(true);
  await tick();
  assert.deepEqual(p.estados(), [ABIERTO, ABIERTO]);
  // Un fallo de red anterior se borra al abrirse.
  const q = pagina({ respuestas: [() => { throw new TypeError('offline'); }, () => Response.json(SESION)] });
  await tick();
  assert.equal(q.estados()[0].linea, FALLO);
  q.pageshow(true);
  await tick();
  assert.deepEqual(q.estados(), [ABIERTO, ABIERTO]);
});

// Revisión del 08/11/2026 (hallazgos 2 y 4): el foco.
test('si el foco estaba en el recuadro al abrirse, pasa al primer enlace de lo que se abre', async () => {
  const p = pagina({ foco: c => c.boton });
  await tick();
  assert.deepEqual(p.estados(), [ABIERTO, ABIERTO]);
  assert.equal(p.documento.activeElement, p.candados[0].primerEnlace);
});

test('con un ancla a un nivel (#intermedio) y sin sesión, el foco va al título del recuadro', async () => {
  const p = pagina({ hash: '#intermedio', respuestas: [SIN_SESION] });
  await tick();
  assert.deepEqual(p.estados(), [BLOQUEADO, BLOQUEADO]);
  assert.equal(p.documento.activeElement, p.candados[0].titulo, 'el Tab sigue desde el recuadro, no desde lo bloqueado');
  assert.equal(p.candados[0].titulo.getAttribute('tabindex'), '-1');
  // Con sesión no se toca el foco: el ancla funciona como siempre.
  const q = pagina({ hash: '#intermedio' });
  await tick();
  assert.deepEqual(q.estados(), [ABIERTO, ABIERTO]);
  assert.equal(q.documento.activeElement, q.documento.body);
  // Si el usuario ya había movido el foco, tampoco; ni con un ancla que no es de lo bloqueado.
  const r = pagina({ hash: '#intermedio', respuestas: [SIN_SESION], foco: c => c.boton });
  await tick();
  assert.equal(r.documento.activeElement, r.candados[0].boton);
  const s = pagina({ hash: '#contenido', respuestas: [SIN_SESION] });
  await tick();
  assert.equal(s.documento.activeElement, s.documento.body);
});

/* ---- Chromium con el worker local (rwadar-publicado/, Auth simulado) ---- */
function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';
const SIN_PUBLICADO = 'ejecuta antes npm run test:web (o node rwadar-publicar.js --local --sin-sincronizar).';

/* Revisión del 08/11/2026 (hallazgo 9): lanzada sola, esta prueba usaba
   rwadar-publicado/ tal como estuviera. Ahora exige que esté construido con el
   código de hoy: la hoja y el script del candado con la huella que les daría la
   publicación, las dos páginas apuntando a ellos y el HTML del candado igual
   que el de rwadar-site/. */
function publicadoDesfasado(raiz = PUBLICADO) {
  const { adelgazarJS, adelgazarCSS } = require('../rwadar-adelgazar.js');
  const { nombreAssetVersionado } = require('../rwadar-publicacion-segura.js');
  const fallos = [];
  const esperados = [['assets/academy-candado-20261108.js', adelgazarJS(candadoJS)], ['assets/academy-candado-20261108.css', adelgazarCSS(candadoCSS)]]
    .map(([nombre, reducido]) => ({ versionado: nombreAssetVersionado(nombre, reducido), reducido }));
  for (const { versionado, reducido } of esperados) {
    const ruta = path.join(raiz, ...versionado.split('/'));
    if (!fs.existsSync(ruta) || fs.readFileSync(ruta, 'utf8') !== reducido) fallos.push(`falta ${versionado}`);
  }
  const trozo = (html, ini, fin) => { const a = html.indexOf(ini); return a < 0 ? null : html.slice(a, html.indexOf(fin, a)); };
  for (const [nombre, ini, fin] of [['academy/index.html', '<main', '</main>'], ['index.html', '<!--academy:ini-->', '<!--academy:fin-->']]) {
    const ruta = path.join(raiz, ...nombre.split('/'));
    if (!fs.existsSync(ruta)) { fallos.push(`falta ${nombre}`); continue; }
    const html = fs.readFileSync(ruta, 'utf8');
    for (const { versionado } of esperados) if (!html.includes(`"/${versionado}"`)) fallos.push(`${nombre} no carga /${versionado}`);
    const fuente = trozo(lee(nombre), ini, fin);
    if (!fuente || fuente !== trozo(html, ini, fin)) fallos.push(`${nombre}: el HTML del candado no es el de rwadar-site/`);
  }
  return fallos;
}

test('la comprobación de que rwadar-publicado/ está al día detecta un script, una hoja o un HTML viejos', { skip: fs.existsSync(path.join(PUBLICADO, 'academy', 'index.html')) ? false : 'sin rwadar-publicado/' }, () => {
  // Sobre una copia de lo que mira: las dos páginas y la hoja y el script con huella.
  const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-candado-al-dia-'));
  try {
    const archivos = ['academy/index.html', 'index.html', ...fs.readdirSync(path.join(PUBLICADO, 'assets'))
      .filter(n => n.startsWith('academy-candado-20261108.')).map(n => 'assets/' + n)];
    for (const nombre of archivos) {
      fs.mkdirSync(path.dirname(path.join(copia, nombre)), { recursive: true });
      fs.copyFileSync(path.join(PUBLICADO, ...nombre.split('/')), path.join(copia, ...nombre.split('/')));
    }
    assert.deepEqual(publicadoDesfasado(copia), [], 'recién construido, al día');
    const cambiar = (nombre, cambio) => { const ruta = path.join(copia, ...nombre.split('/')); const antes = fs.readFileSync(ruta, 'utf8');
      fs.writeFileSync(ruta, cambio(antes)); return () => fs.writeFileSync(ruta, antes); };
    const script = archivos.find(n => n.endsWith('.js')), hoja = archivos.find(n => n.endsWith('.css'));
    for (const [que, mutar, esperado] of [
      ['el script con huella de otra construcción', () => cambiar(script, t => t.replace("removeAttribute('inert')", "removeAttribute('x')")), /falta assets\/academy-candado-20261108\.[0-9a-f]{12}\.js/],
      ['la hoja con huella de otra construcción', () => cambiar(hoja, t => t + ' '), /falta assets\/academy-candado-20261108\.[0-9a-f]{12}\.css/],
      ['el índice sin la línea «Comprobando»', () => cambiar('academy/index.html', t => t.replace('<p class="candado-espera">Comprobando tu sesión…</p>', '')), /academy\/index\.html: el HTML del candado no es el de rwadar-site/],
      ['la portada sin los textos con cuenta', () => cambiar('index.html', t => t.replace(' data-academy-con-cuenta hidden', '')), /index\.html: el HTML del candado no es el de rwadar-site/],
      ['la portada con el script viejo', () => cambiar('index.html', t => t.replace(/academy-candado-20261108\.[0-9a-f]{12}\.js/, 'academy-candado-20261108.000000000000.js')), /index\.html no carga/],
    ]) {
      const deshacer = mutar();
      const fallos = publicadoDesfasado(copia);
      deshacer();
      assert.ok(fallos.some(f => esperado.test(f)), que + ': ' + JSON.stringify(fallos));
    }
    assert.deepEqual(publicadoDesfasado(copia), []);
  } finally { fs.rmSync(copia, { recursive: true, force: true }); }
});

test('en Chromium: bloqueado sin sesión, sin JS y con la red caída; abierto con sesión; y entrar desde el candado lo abre', { skip: sinNavegador, timeout: 240000 }, async () => {
  assert.ok(fs.existsSync(path.join(PUBLICADO, '_worker.js')) && fs.existsSync(path.join(PUBLICADO, 'academy', 'index.html')),
    'Falta rwadar-publicado/: ' + SIN_PUBLICADO);
  const desfasado = publicadoDesfasado();
  assert.deepEqual(desfasado, [], 'rwadar-publicado/ no está construido con el código actual: ' + SIN_PUBLICADO);
  const { arrancarWorkerLocal, CORREO_PRUEBA, CLAVE_PRUEBA } = await import('./probar-worker-local.mjs');
  const sin = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0 });
  const con = await arrancarWorkerLocal({ raiz: PUBLICADO, puerto: 0, conSesion: true });
  let browser;
  try {
    browser = await playwright.chromium.launch();
    async function abrir(base, ruta, { javaScriptEnabled = true, red = null, ancho = 390, alto = 844, local = false, retraso = 0 } = {}) {
      const contexto = await browser.newContext({ javaScriptEnabled, viewport: { width: ancho, height: alto } });
      const page = await contexto.newPage();
      const violaciones = [];
      page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) violaciones.push(m.text()); });
      // Nada sale de la máquina (la analítica de Cloudflare, por ejemplo).
      await page.route(u => !/^http:\/\/(?:127\.0\.0\.1|localhost):/.test(u.href), r => r.abort());
      if (red === 'caida') await page.route('**/api/acceso/sesion', r => r.abort('internetdisconnected'));
      // Una ida y vuelta lenta al servidor (la del usuario con cuenta que recarga).
      let soltar = () => {};
      if (retraso) {
        const espera = new Promise(r => { soltar = r; setTimeout(r, retraso); });
        await page.route('**/api/acceso/sesion', async r => { await espera; await r.continue(); });
      }
      // La respuesta del servidor a la pregunta por la sesión (la de la pasarela y el candado).
      const sesion = javaScriptEnabled && red !== 'caida'
        ? page.waitForResponse(r => r.url().endsWith('/api/acceso/sesion'), { timeout: 15000 }).catch(() => null) : Promise.resolve(null);
      const url = (local ? base.url.replace('127.0.0.1', 'localhost') : base.url) + ruta;
      await page.goto(url, { waitUntil: retraso ? 'domcontentloaded' : 'load' });
      return { page, contexto, violaciones, sesion, soltar };
    }
    const estado = page => page.evaluate(() => [...document.querySelectorAll('[data-academy-candado]')].map(c => {
      const contenido = c.querySelector('[data-academy-candado-contenido]');
      const capa = c.querySelector('[data-academy-candado-capa]');
      const enlace = contenido.querySelector('a[href^="/academy/"]');
      enlace.focus();
      return { estado: c.dataset.estado, inert: contenido.inert, ariaHidden: contenido.getAttribute('aria-hidden'),
        difuminado: getComputedStyle(contenido).filter.includes('blur'), capaVisible: getComputedStyle(capa).display !== 'none',
        enfocable: document.activeElement === enlace, linea: c.querySelector('[data-academy-candado-error]').textContent };
    }));
    // Qué enseña el recuadro: «Comprobando tu sesión…» o el texto y los botones.
    const recuadro = page => page.evaluate(() => {
      const caja = document.querySelector('.candado-caja'), ver = s => getComputedStyle(caja.querySelector(s)).display !== 'none';
      return { comprobando: document.documentElement.classList.contains('candado-comprobando'), espera: ver('.candado-espera'),
        texto: ver('.candado-txt'), botones: ver('.candado-acciones') };
    });
    const ESPERANDO = { comprobando: true, espera: true, texto: false, botones: false };
    const CON_BOTONES = { comprobando: false, espera: false, texto: true, botones: true };
    const decidido = page => page.waitForFunction(() => !document.documentElement.classList.contains('candado-comprobando'), null, { timeout: 15000 });
    const esperarEstado = (page, valor) => page.waitForFunction(v => [...document.querySelectorAll('[data-academy-candado]')]
      .every(c => c.dataset.estado === v), valor, { timeout: 15000 });
    // Lo marcado para quien no tiene cuenta y para quien sí: ¿se ve?
    const marcas = page => page.evaluate(() => ({
      sinCuenta: [...document.querySelectorAll('[data-academy-sin-cuenta]')].map(e => getComputedStyle(e).display !== 'none'),
      conCuenta: [...document.querySelectorAll('[data-academy-con-cuenta]')].map(e => getComputedStyle(e).display !== 'none') }));
    const activo = page => page.evaluate(() => document.activeElement?.textContent.trim() || document.activeElement?.tagName);

    // Sin sesión: bloqueado tras la respuesta 401, con el lector oyendo solo el recuadro.
    {
      const { page, contexto, violaciones, sesion } = await abrir(sin, '/academy/');
      assert.equal((await sesion)?.status(), 401, 'el servidor dice «sin sesión»');
      await decidido(page);
      await page.waitForTimeout(300);
      const [indiceEstado] = await estado(page);
      assert.deepEqual(indiceEstado, { estado: 'bloqueado', inert: true, ariaHidden: 'true', difuminado: true, capaVisible: true, enfocable: false, linea: '' });
      assert.deepEqual(await recuadro(page), CON_BOTONES, 'tras el 401 se ven los botones');
      assert.deepEqual(await marcas(page), { sinCuenta: [true], conCuenta: [false] });
      // Con el teclado no se llega a ninguna lección: el Tab recorre otros enlaces y ninguno de /academy/<lección>.
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      const enfocados = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        enfocados.push(await page.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.tagName));
      }
      assert.ok(enfocados.includes('/acceso?volver=/academy/') && enfocados.includes('/acceso?volver=/academy/&vista=entrar'), enfocados.join(' '));
      assert.ok(!enfocados.some(h => /^\/academy\/[a-z0-9-]+$/.test(h || '')), enfocados.join(' '));
      // Ni a los saltos «Nivel 1/2/3» (hallazgo 4): van dentro de lo bloqueado.
      assert.ok(!enfocados.some(h => /^#(?:principiante|intermedio|avanzado)$/.test(h || '')), enfocados.join(' '));
      // Cerrado, lo difuminado se corta (640 px) y el tutorial 3D, nítido, va justo debajo.
      const corte = await page.evaluate(() => {
        const contenido = document.querySelector('[data-academy-candado-contenido]').getBoundingClientRect();
        const tutorial = document.querySelector('.ac-tutorial').getBoundingClientRect();
        return { alto: Math.round(contenido.height), hueco: Math.round(tutorial.top - contenido.bottom) };
      });
      assert.ok(corte.alto <= 640 && corte.hueco >= 0 && corte.hueco < 80, JSON.stringify(corte));
      // Pulsar donde se ve una tarjeta (lejos del recuadro) no abre la lección.
      await page.evaluate(() => { const c = document.querySelector('[data-academy-candado]').getBoundingClientRect(); window.scrollTo(0, c.bottom + scrollY - innerHeight); });
      await page.waitForTimeout(200);
      const punto = await page.evaluate(() => {
        const caja = document.querySelector('.candado-caja').getBoundingClientRect();
        const fondo = Math.min(innerHeight, document.querySelector('[data-academy-candado-contenido]').getBoundingClientRect().bottom);
        const a = [...document.querySelectorAll('[data-academy-candado-contenido] a[href^="/academy/"]')].map(e => e.getBoundingClientRect())
          .find(r => r.top > caja.bottom + 4 && r.top + 24 < fondo);
        return a ? { x: a.left + a.width / 2, y: a.top + 12 } : null;
      });
      assert.ok(punto, 'hay una tarjeta a la vista fuera del recuadro');
      await page.mouse.click(punto.x, punto.y);
      await page.waitForTimeout(400);
      assert.match(page.url(), /\/academy\/$/);
      const arbol = await page.locator('main').ariaSnapshot();
      assert.match(arbol, /Las lecciones se abren con tu cuenta gratuita/);
      assert.match(arbol, /link "Crear cuenta gratis"/);
      assert.doesNotMatch(arbol, /Quién es quién en una tokenización/, 'el lector no oye las tarjetas');
      assert.doesNotMatch(arbol, /Comprobando tu sesión/, 'ya no dice «Comprobando»');
      assert.deepEqual(violaciones, []);
      await contexto.close();
    }
    // Sin JavaScript: igual de bloqueado (el HTML nace así) y con los botones desde el principio.
    {
      const { page, contexto } = await abrir(sin, '/academy/', { javaScriptEnabled: false });
      const datos = await page.evaluate(() => {
        const c = document.querySelector('[data-academy-candado]'), contenido = c.querySelector('[data-academy-candado-contenido]');
        return { estado: c.dataset.estado, inert: contenido.inert, difuminado: getComputedStyle(contenido).filter.includes('blur'),
          capaVisible: getComputedStyle(c.querySelector('[data-academy-candado-capa]')).display !== 'none' };
      });
      // Playwright evalúa aunque la página tenga el JavaScript apagado: lo que se mide es el HTML y la hoja.
      assert.deepEqual(datos, { estado: 'bloqueado', inert: true, difuminado: true, capaVisible: true });
      assert.deepEqual(await recuadro(page), CON_BOTONES, 'sin JavaScript no hay «Comprobando»: los botones se ven');
      const arbol = await page.locator('main').ariaSnapshot();
      assert.match(arbol, /Las lecciones se abren con tu cuenta gratuita/);
      assert.doesNotMatch(arbol, /Quién es quién en una tokenización/);
      await contexto.close();
    }
    // Red caída: bloqueado, con los botones y la línea discreta.
    {
      const { page, contexto } = await abrir(sin, '/academy/', { red: 'caida' });
      await page.waitForFunction(() => document.querySelector('[data-academy-candado-error]').textContent !== '', null, { timeout: 15000 });
      const [indiceEstado] = await estado(page);
      assert.deepEqual(indiceEstado, { estado: 'bloqueado', inert: true, ariaHidden: 'true', difuminado: true, capaVisible: true, enfocable: false,
        linea: 'No hemos podido comprobar tu sesión. Recarga la página.' });
      assert.deepEqual(await recuadro(page), CON_BOTONES);
      await contexto.close();
    }
    // Con sesión: abierto, nítido y con las lecciones enfocables, en el índice y en la portada.
    for (const [ruta, ancho] of [['/academy/', 390], ['/academy/', 1280], ['/', 1280], ['/', 390]]) {
      const { page, contexto, violaciones } = await abrir(con, ruta, { ancho });
      await esperarEstado(page, 'abierto');
      // En el móvil, las lecciones de la portada están en la pestaña Academy.
      if (ruta === '/' && ancho < 768) await page.locator('[data-movil-tab="academy"]').click();
      await page.waitForTimeout(450); // fin de la transición del difuminado
      for (const e of await estado(page)) {
        assert.deepEqual(e, { estado: 'abierto', inert: false, ariaHidden: null, difuminado: false, capaVisible: false, enfocable: true, linea: '' }, ruta);
      }
      // Fuera la invitación a crear cuenta; dentro «Lecciones desbloqueadas» (hallazgos 5 y 6).
      const m = await marcas(page);
      assert.ok(m.sinCuenta.length >= 1 && m.sinCuenta.every(v => !v), ruta + ' ' + JSON.stringify(m));
      assert.ok(m.conCuenta.length >= 1 && m.conCuenta.every(Boolean), ruta + ' ' + JSON.stringify(m));
      if (ruta === '/academy/') {
        // Abierto, sin corte: todas las lecciones a la vista y el tutorial 3D detrás.
        const r = await page.evaluate(() => ({ alto: document.querySelector('[data-academy-candado-contenido]').getBoundingClientRect().height,
          etiqueta: [...document.querySelectorAll('.ac-portada-cab .ac-sobrelinea')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent) }));
        assert.ok(r.alto > 1200, JSON.stringify(r));
        assert.deepEqual(r.etiqueta, ['RWAdar Academy', 'Lecciones desbloqueadas']);
      }
      if (ruta === '/') {
        const textos = await page.evaluate(() => [...document.querySelectorAll('.academia-lecciones-cab > *')]
          .filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent.trim()));
        assert.ok(!textos.some(t => /Crea tu cuenta gratis/.test(t)), textos.join(' | '));
        assert.ok(textos.includes('Lecciones desbloqueadas'), textos.join(' | '));
      }
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('candado-comprobando')), false);
      assert.deepEqual(violaciones, [], ruta);
      // Sin desbordar a lo ancho en el móvil.
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), ruta + ' sin scroll horizontal');
      await contexto.close();
    }
    // Hallazgo 2: con sesión y una ida y vuelta lenta, mientras tanto no se invita a crear cuenta.
    {
      const { page, contexto, soltar } = await abrir(con, '/academy/', { retraso: 5000 });
      await page.waitForTimeout(150);
      assert.deepEqual(await recuadro(page), ESPERANDO, 'antes de la respuesta: «Comprobando tu sesión…», sin botones');
      assert.equal((await estado(page))[0].estado, 'bloqueado');
      const arbol = await page.locator('main').ariaSnapshot();
      assert.match(arbol, /Comprobando tu sesión…/);
      assert.doesNotMatch(arbol, /link "Crear cuenta gratis"|link "Ya tengo cuenta: entrar"/);
      // Mientras se comprueba, lo difuminado no se corta (lo de abajo no salta al abrirse).
      assert.ok(await page.evaluate(() => document.querySelector('[data-academy-candado-contenido]').getBoundingClientRect().height > 1200));
      soltar();
      await esperarEstado(page, 'abierto');
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains('candado-comprobando')), false);
      await contexto.close();
    }
    // Con sesión, recargar a mitad de la lista con la respuesta lenta vuelve al mismo sitio.
    {
      const { page, contexto } = await abrir(con, '/academy/', { ancho: 390, alto: 844 });
      await esperarEstado(page, 'abierto');
      // Primero, con la respuesta rápida: dónde deja Chromium la página al recargar. Puede quedar
      // unos 90 px arriba de 2000: la barra de progreso se pinta encima al confirmar la cuenta.
      const recargar = async () => {
        await page.evaluate(() => window.scrollTo(0, 2000));
        await page.waitForTimeout(200);
        await page.reload({ waitUntil: 'load' });
        await esperarEstado(page, 'abierto');
        await page.waitForTimeout(450);
        return page.evaluate(() => scrollY);
      };
      const rapida = await recargar();
      assert.ok(Math.abs(rapida - 2000) < 150, 'con respuesta rápida vuelve a ' + rapida);
      // Con 600 ms de espera, igual: mientras se comprueba, lo difuminado no se corta. (Si se
      // cortara, la página mediría ~2400 px al cargar y acabaría en ~1500 o ~3800.)
      await page.route('**/api/acceso/sesion', async r => { await new Promise(res => setTimeout(res, 600)); await r.continue(); });
      const lenta = await recargar();
      assert.ok(Math.abs(lenta - 2000) < 150, `con respuesta lenta vuelve a ${lenta} (rápida: ${rapida})`);
      await contexto.close();
    }
    // Hallazgo 5 (lo que pidió Víctor): la primera pantalla, sin desplazar, enseña ya el candado
    // (icono, título y los dos botones) sobre las lecciones difuminadas; el tutorial 3D, nítido y fuera.
    for (const [ancho, alto] of [[390, 844], [1280, 800], [1920, 1080]]) {
      const { page, contexto } = await abrir(sin, '/academy/', { ancho, alto });
      await decidido(page);
      const r = await page.evaluate(() => {
        const rect = e => e.getBoundingClientRect(), dentro = c => c.top >= 0 && c.bottom <= innerHeight && c.height > 0;
        const area = c => Math.max(0, Math.min(c.right, innerWidth) - Math.max(c.left, 0)) * Math.max(0, Math.min(c.bottom, innerHeight) - Math.max(c.top, 0));
        const contenido = document.querySelector('[data-academy-candado-contenido]'), caja = rect(document.querySelector('.candado-caja'));
        return { scrollY, icono: dentro(rect(document.querySelector('.candado-icono'))), titulo: dentro(rect(document.querySelector('.candado-tit'))),
          botones: [...document.querySelectorAll('.candado-boton')].map(b => dentro(rect(b))),
          difuminado: getComputedStyle(contenido).filter.includes('blur'),
          // Lo difuminado que se ve alrededor del recuadro, en px²: al menos una franja de 40 px de alto.
          difuminadoVisible: area(rect(contenido)) - area(caja) >= 40 * Math.min(innerWidth, rect(contenido).width),
          tutorialNitido: getComputedStyle(document.querySelector('.ac-tutorial')).filter === 'none',
          tutorialFuera: !document.querySelector('.ac-tutorial').closest('[data-academy-candado]') };
      });
      assert.deepEqual(r, { scrollY: 0, icono: true, titulo: true, botones: [true, true], difuminado: true, difuminadoVisible: true,
        tutorialNitido: true, tutorialFuera: true }, `${ancho}×${alto}`);
      await contexto.close();
    }
    // Hallazgo 3: con poca altura (zoom al 200 % y al 400 %), el recuadro no es fijo y, al llegar al
    // bloque, se ven enteros los dos botones. Con altura de sobra sigue fijo.
    for (const [ancho, alto, posicion] of [[683, 319, 'relative'], [640, 290, 'relative'], [320, 256, 'relative'], [1280, 800, 'sticky'], [390, 844, 'sticky']]) {
      const { page, contexto } = await abrir(sin, '/academy/', { ancho, alto });
      await decidido(page);
      await page.evaluate(() => window.scrollTo(0, document.querySelector('[data-academy-candado]').getBoundingClientRect().top + scrollY));
      await page.waitForTimeout(100);
      const r = await page.evaluate(() => ({ posicion: getComputedStyle(document.querySelector('.candado-caja')).position,
        botones: [...document.querySelectorAll('.candado-boton')].map(b => { const c = b.getBoundingClientRect(); return c.top >= 0 && c.bottom <= innerHeight && c.height >= 40; }) }));
      assert.deepEqual(r, { posicion, botones: [true, true] }, `${ancho}×${alto}`);
      await contexto.close();
    }
    // Hallazgo 4: sin sesión, desde la entradilla el Tab va a «Crear cuenta gratis», «Ya tengo cuenta:
    // entrar» y el tutorial 3D (los saltos y las lecciones no se enfocan); con un ancla a un nivel
    // (#intermedio), el Tab también sigue en «Crear cuenta gratis».
    {
      const { page, contexto } = await abrir(sin, '/academy/', { ancho: 1280, alto: 800 });
      await decidido(page);
      await page.click('.ac-entradilla');
      const orden = [];
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); orden.push(await activo(page)); }
      assert.deepEqual(orden, ['Crear cuenta gratis', 'Ya tengo cuenta: entrar', 'Empezar tutorial 3D →']);
      assert.equal(await page.evaluate(() => { const a = document.querySelector('.ac-saltos a'); a.focus(); return document.activeElement === a; }), false);
      await contexto.close();
      for (const ancla of ['#principiante', '#intermedio', '#avanzado']) {
        const otra = await abrir(sin, '/academy/' + ancla, { ancho: 1280, alto: 800 });
        await decidido(otra.page);
        // Ya cargada la página (Chromium aplica el ancla al terminar), el foco pasa al título del recuadro.
        await otra.page.waitForFunction(() => document.activeElement?.id === 'candadoAcademyTit', null, { timeout: 15000 });
        await otra.page.keyboard.press('Tab');
        assert.equal(await activo(otra.page), 'Crear cuenta gratis', ancla);
        await otra.contexto.close();
      }
      // Con sesión, el ancla sigue funcionando: el Tab entra en ese nivel.
      const abierta = await abrir(con, '/academy/#intermedio', { ancho: 1280, alto: 800 });
      await esperarEstado(abierta.page, 'abierto');
      await abierta.page.keyboard.press('Tab');
      assert.equal(await abierta.page.evaluate(() => !!document.activeElement.closest('#intermedio')), true);
      await abierta.contexto.close();
    }
    // Hallazgo 7: «Cuenta confirmada: Academy desbloqueada» solo con la sesión confirmada; el fragmento se quita siempre.
    for (const [base, opciones, aviso, valor] of [[sin, {}, false, 'bloqueado'], [sin, { red: 'caida' }, false, 'bloqueado'], [con, {}, true, 'abierto']]) {
      const { page, contexto } = await abrir(base, '/academy/#cuenta-confirmada', opciones);
      await page.waitForFunction(() => location.hash === '', null, { timeout: 15000 });
      await esperarEstado(page, valor);
      const r = await page.evaluate(() => [...document.querySelectorAll('.ac-confirmada')].map(e => e.textContent));
      assert.deepEqual(r, aviso ? ['Cuenta confirmada: Academy desbloqueada'] : [], JSON.stringify(opciones) + ' ' + valor);
      await contexto.close();
    }
    // En la portada sin sesión, el bloque de lecciones también sale bloqueado y el tutorial 3D, nítido.
    {
      const { page, contexto, sesion } = await abrir(sin, '/', { ancho: 1280 });
      assert.equal((await sesion)?.status(), 401);
      await decidido(page);
      await page.waitForTimeout(300);
      const [bloque] = await estado(page);
      assert.equal(bloque.estado, 'bloqueado'); assert.equal(bloque.inert, true); assert.equal(bloque.difuminado, true);
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.academia-destacada')).filter), 'none');
      assert.deepEqual(await marcas(page), { sinCuenta: [true, true], conCuenta: [false, false] });
      await contexto.close();
    }
    // De principio a fin: «Ya tengo cuenta: entrar» → /acceso abierto en «Entrar» → vuelve a /academy/ abierto.
    // (localhost: Chromium solo guarda la cookie __Host- de la sesión en http si el origen es localhost.)
    {
      const { page, contexto, sesion } = await abrir(sin, '/academy/', { local: true, ancho: 1280 });
      assert.equal((await sesion)?.status(), 401);
      await decidido(page);
      assert.equal((await estado(page))[0].estado, 'bloqueado');
      await page.getByRole('link', { name: 'Ya tengo cuenta: entrar' }).first().click();
      await page.waitForURL(/\/acceso\?volver=\/academy\/&vista=entrar$/);
      assert.equal(await page.locator('#enviar').textContent(), 'Entrar');
      assert.equal(await page.locator('#introduccion').textContent(), 'Las lecciones son gratis con cuenta. Si ya la tienes, entra.');
      assert.equal(await page.locator('#acciones [data-vista="registrar"]').isVisible(), true, '«Crear cuenta gratis» sigue a mano');
      assert.equal(await page.locator('#acciones [data-vista="entrar"]').isVisible(), false, 'no repite «Ya tengo cuenta»');
      await page.fill('#correo', CORREO_PRUEBA);
      await page.fill('#clave', CLAVE_PRUEBA);
      await page.click('#enviar');
      await page.waitForURL(/\/academy\/$/, { timeout: 15000 });
      await esperarEstado(page, 'abierto');
      await page.waitForTimeout(450); // fin de la transición del difuminado
      // Arriba del todo, sin bajar, se ve que se ha abierto (hallazgo 5): «Lecciones desbloqueadas» y los niveles nítidos.
      assert.deepEqual(await page.evaluate(() => {
        const salto = document.querySelector('.ac-saltos a'), c = salto.getBoundingClientRect();
        const etiqueta = document.querySelector('.ac-portada-cab [data-academy-con-cuenta]');
        return { scrollY, etiqueta: getComputedStyle(etiqueta).display !== 'none' && etiqueta.textContent, salto: c.bottom <= innerHeight,
          nitido: getComputedStyle(document.querySelector('[data-academy-candado-contenido]')).filter };
      }), { scrollY: 0, etiqueta: 'Lecciones desbloqueadas', salto: true, nitido: 'none' });
      const [tras] = await estado(page);
      assert.equal(tras.inert, false); assert.equal(tras.enfocable, true);
      // «Crear cuenta gratis» abre el alta con la misma vuelta.
      await contexto.close();
      const otra = await abrir(sin, '/academy/', { local: true, ancho: 390 });
      await decidido(otra.page);
      await otra.page.getByRole('link', { name: 'Crear cuenta gratis' }).first().click();
      await otra.page.waitForURL(/\/acceso\?volver=\/academy\/$/);
      assert.equal(await otra.page.locator('#enviar').textContent(), 'Crear cuenta gratis');
      await otra.contexto.close();
    }
    // Hallazgo 1, en el navegador: tras entrar con volver=/.//<otra web>, se queda en este origen.
    {
      const { page, contexto } = await abrir(sin, '/acceso?volver=/.//atacante.test/&vista=entrar', { local: true, ancho: 1280 });
      await page.locator('[data-vista="entrar"]').first().click().catch(() => {});
      await page.fill('#correo', CORREO_PRUEBA);
      await page.fill('#clave', CLAVE_PRUEBA);
      await page.click('#enviar');
      await page.waitForURL(u => !u.pathname.startsWith('/acceso'), { timeout: 15000 });
      const destino = new URL(page.url());
      assert.equal(destino.hostname, 'localhost');
      assert.equal(destino.pathname, '/');
      await contexto.close();
    }
  } finally {
    await browser?.close();
    await sin.cerrar();
    await con.cerrar();
  }
});
