/* Campana con número y «Notificaciones en este móvil» (Web Push), 12/11/2026,
   en Chromium sobre el worker local con las fuentes de rwadar-site y una
   cuenta de prueba. La página se sirve con un origen https de prueba
   (rwadar.prueba.test) para que las cuentas funcionen: en 127.0.0.1 la web
   las apaga a propósito (MODO_LOCAL_SEGURO). Todo se atiende en la máquina:
   lo que no es de ese origen se corta. Los service workers reales van
   bloqueados (su lógica se prueba en service-worker-activacion.test.mjs) y
   PushManager, Notification y la Badging API se simulan para ver qué pide la
   página y en qué orden. Con RWADAR_CAPTURAS=<carpeta> guarda las capturas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal, USUARIO_PRUEBA } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CAPTURAS = process.env.RWADAR_CAPTURAS || '';
const ORIGEN = 'https://rwadar.prueba.test';
const VERSION = 'novedades-v2-2026-11-06';

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

// Una clave pública P-256 de usar y tirar, sin comprimir y en base64url (87 caracteres), como la del contrato.
const CLAVE = crypto.createECDH('prime256v1').generateKeys().toString('base64url');
const aviso = (i, extra = {}) => ({ id: String(100 - i), tipo: 'novedad', titulo: 'Aviso de prueba ' + i,
  texto: 'Texto del aviso ' + i + '.', enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-' + String(1 + (i % 12)).padStart(2, '0') + 'T10:00:00Z', ...extra });
const ESTADO = { novedades: true, version: VERSION, version_vigente: VERSION, correo_activo: false, push_activo: true };

// Lo que contesta la base de prueba; cada prueba lo cambia.
let escenario = {};
const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
async function responder(url) {
  const ruta = url.pathname;
  if (ruta === '/rest/v1/rpc/mis_avisos_recientes') return json(escenario.avisos ?? []);
  if (ruta === '/rest/v1/rpc/estado_mis_avisos') return json(escenario.estado ?? ESTADO);
  if (ruta === '/rest/v1/rpc/clave_publica_webpush') return json(escenario.clave === undefined ? CLAVE : escenario.clave);
  if (ruta === '/rest/v1/rpc/registrar_aviso_webpush') return json(true);
  if (ruta === '/rest/v1/rpc/quitar_aviso_webpush') return json(true);
  if (ruta === '/rest/v1/rpc/mi_aviso_webpush_registrado') return json(escenario.registrado === true);
  if (ruta === '/rest/v1/vigilancia') return json([]);
  return null;
}

/* Simulaciones en la página, antes de cualquier script: Badging API, Notification,
   PushManager y el registro del service worker. Todo deja rastro en window.__rastro. */
function simular(cfg) {
  const rastro = window.__rastro = [];
  const anota = (...a) => rastro.push(a);
  Navigator.prototype.setAppBadge = function (n) { anota('setAppBadge', n); return Promise.resolve(); };
  Navigator.prototype.clearAppBadge = function () { anota('clearAppBadge'); return Promise.resolve(); };
  if (cfg.standalone) Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true, configurable: true });
  let permiso = cfg.permiso || 'default';
  Object.defineProperty(Notification, 'permission', { get: () => permiso, configurable: true });
  Notification.requestPermission = function () { anota('requestPermission'); permiso = cfg.respuesta || 'granted'; return Promise.resolve(permiso); };
  let suscripcion = null;
  const nueva = () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-123',
    toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'BPrueba_p256dh-clave', auth: 'auth-prueba' } }; },
    unsubscribe() { anota('unsubscribe'); suscripcion = null; return Promise.resolve(true); } });
  if (cfg.suscrito) suscripcion = nueva();
  const registro = { scope: location.origin + '/', active: { postMessage(m) { anota('sw', m.tipo, m.n); } },
    pushManager: { getSubscription: () => Promise.resolve(suscripcion),
      subscribe(o) { anota('subscribe', o.userVisibleOnly, o.applicationServerKey.length, o.applicationServerKey[0]); suscripcion = nueva(); return Promise.resolve(suscripcion); } },
    showNotification(t, o) { anota('showNotification', t, o.body, o.tag, o.icon); return Promise.resolve(); },
    update: () => Promise.resolve() };
  const sw = navigator.serviceWorker;
  sw.getRegistration = () => Promise.resolve(registro);
  sw.register = () => Promise.resolve(registro);
  Object.defineProperty(sw, 'ready', { get: () => Promise.resolve(registro), configurable: true });
  Object.defineProperty(sw, 'controller', { get: () => registro.active, configurable: true });
  const original = window.fetch;
  window.fetch = function (url, opciones) {
    try { if (String(url).endsWith('/api/acceso/datos') && opciones && opciones.body) anota('datos', JSON.parse(opciones.body).ruta); } catch { /* nada */ }
    return original.apply(this, arguments);
  };
}

async function abrir(navegador, local, { dispositivo = null, viewport = null, cfg = {}, ruta = '/' } = {}) {
  const opciones = { ...(dispositivo ? playwright.devices[dispositivo] : {}), ...(viewport ? { viewport } : {}), serviceWorkers: 'block' };
  delete opciones.defaultBrowserType;
  const contexto = await navegador.newContext(opciones);
  await contexto.route('**/*', async ruta => {
    const u = new URL(ruta.request().url());
    if (u.origin !== ORIGEN) return ruta.abort();
    const cabeceras = { ...ruta.request().headers() };
    if (cabeceras.origin) cabeceras.origin = local.url;
    // Al cerrar sesión la página se recarga con peticiones en vuelo: esas se descartan.
    try { await ruta.fulfill({ response: await ruta.fetch({ url: local.url + u.pathname + u.search, headers: cabeceras }) }); }
    catch { await ruta.abort().catch(() => {}); }
  });
  await contexto.addInitScript(simular, cfg);
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  await pagina.goto(ORIGEN + ruta, { waitUntil: 'load' });
  await pagina.waitForFunction(() => typeof Cuenta !== 'undefined' && Cuenta.hay(), null, { timeout: 20000 });
  return { contexto, pagina, errores, rastro: () => pagina.evaluate(() => window.__rastro) };
}
const rpc = (local, nombre) => local.peticionesSupabase.filter(p => p.ruta === '/rest/v1/rpc/' + nombre);
const captura = async (pagina, nombre) => { if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, nombre) }); };
const BAJA = '¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.';
const QUIEN_WEB = 'Al activarlas, tu navegador usa el servicio de notificaciones de su fabricante (Apple, Google, Mozilla o Microsoft); el texto va cifrado. Más en Privacidad.';
// Contraste WCAG entre el texto y el fondo de un elemento (colores rgb/rgba opacos).
function contraste(id) {
  const lum = c => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const e = getComputedStyle(document.getElementById(id)), a = lum(e.color), b = lum(e.backgroundColor);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('en Chromium: campana con número (1…9 y 9+), globo de Perfil, diálogo que los da por vistos con la baja a la vista, Badging API y aviso al service worker', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, conSesion: true, responder });
  const navegador = await playwright.chromium.launch();
  try {
    escenario = { avisos: Array.from({ length: 12 }, (_, i) => aviso(i + 1)) };
    const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 } });
    await pagina.waitForFunction(() => !document.getElementById('movilAvisos').hidden && document.getElementById('movilAvisosN').textContent === '9+', null, { timeout: 15000 });
    const cabecera = await pagina.evaluate(() => {
      const b = document.getElementById('movilAvisos'), n = document.getElementById('movilAvisosN'), r = b.getBoundingClientRect();
      const g = document.getElementById('movilGuardadosBadge');
      return { aria: b.getAttribute('aria-label'), numero: n.textContent, numeroVisible: !n.hidden, ancho: r.width, alto: r.height,
        dentro: r.right <= innerWidth && r.left >= 0, anchoDoc: document.documentElement.scrollWidth, ventana: innerWidth,
        globo: g.textContent, globoAvisos: g.classList.contains('movil-nav-insignia-avisos'), tab: document.getElementById('movilTabMas').getAttribute('aria-label'),
        vivo: document.getElementById('avisosAnuncio').getAttribute('aria-live') };
    });
    // La base da como mucho 10 avisos (p_limite 10): 10 sin leer → «9+».
    assert.deepEqual(rpc(local, 'mis_avisos_recientes').map(p => p.cuerpo), [{ p_limite: 10 }], 'una sola consulta al entrar');
    assert.equal(cabecera.aria, 'Avisos, 9+ sin leer');
    assert.equal(cabecera.numero, '9+'); assert.ok(cabecera.numeroVisible);
    assert.ok(cabecera.ancho >= 44 && cabecera.alto >= 44, 'botón de 44 px');
    assert.ok(cabecera.dentro && cabecera.anchoDoc <= cabecera.ventana, 'sin desbordes a 390 px');
    assert.equal(cabecera.globo, '9+'); assert.ok(cabecera.globoAvisos); assert.equal(cabecera.tab, 'Perfil, 9+ avisos sin leer');
    assert.equal(cabecera.vivo, 'polite');
    // Blanco sobre el rojo de los globos: WCAG AA (4,5:1) para 11 px en negrita.
    const contrastes = await pagina.evaluate(f => { const c = new Function('return ' + f)(); return [c('movilAvisosN'), c('movilGuardadosBadge')]; }, contraste.toString());
    assert.ok(contrastes.every(c => c >= 4.5), 'contraste de los globos: ' + contrastes.map(c => c.toFixed(2)).join(' y '));
    let r = await rastro();
    assert.deepEqual(r.filter(x => x[0] === 'setAppBadge'), [['setAppBadge', 10]], 'el número del icono va con la campana');
    assert.ok(r.some(x => x[0] === 'sw' && x[1] === 'avisos-pendientes' && x[2] === 10), 'y el service worker lo sabe');
    await captura(pagina, 'campana-9mas-390.png');
    // En teléfonos de 320 y 360 px la barra cabe: la campana no saca nada de la pantalla ni corta del todo el título.
    for (const ancho of [320, 360]) {
      await pagina.setViewportSize({ width: ancho, height: 740 });
      await pagina.waitForTimeout(200);
      const barra = await pagina.evaluate(() => {
        const dentro = sel => { const n = document.querySelector(sel); if (!n || getComputedStyle(n).display === 'none') return null; const r = n.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5; };
        const t = document.getElementById('movilCabeceraTitulo').getBoundingClientRect();
        return { campana: dentro('#movilAvisos'), marca: dentro('.movil-marca'), ayuda: dentro('[data-movil-action="ayuda"]'), titulo: t.width, anchoDoc: document.documentElement.scrollWidth, ventana: innerWidth };
      });
      assert.ok(barra.campana && barra.marca && barra.ayuda, ancho + ' px: ' + JSON.stringify(barra));
      // A 320 px el título ya cedía con «…» antes de la campana (la campana ocupa el sitio de la descarga).
      assert.ok(barra.titulo >= 30 && barra.anchoDoc <= barra.ventana, ancho + ' px: ' + JSON.stringify(barra));
    }
    await pagina.setViewportSize({ width: 390, height: 844 });

    // Al tocarla se abre la bandeja con los nuevos marcados y la baja a la vista.
    // Abrirla ya es verlos (como un chat de WhatsApp): el número baja a 0.
    await pagina.click('#movilAvisos');
    await pagina.waitForSelector('#avisosDialogo[open] #avisosDialogoLista li', { timeout: 10000 });
    const dialogo = await pagina.evaluate(() => {
      const d = document.getElementById('avisosDialogo');
      return { titulo: d.querySelector('h2').textContent, nuevos: d.querySelectorAll('li.nuevo').length, sinLeer: d.querySelectorAll('li.nuevo .solo-lector').length,
        foco: document.activeElement && document.activeElement.getAttribute('aria-label'), marcar: !!d.querySelector('[data-avisos-marcar]'),
        baja: document.getElementById('avisosDialogoBaja').textContent, gestionar: d.querySelector('[data-avisos-gestionar]').textContent };
    });
    assert.deepEqual(dialogo, { titulo: 'Tus avisos', nuevos: 10, sinLeer: 10, foco: 'Cerrar', marcar: false, baja: BAJA, gestionar: 'Notificaciones y avisos en Perfil' });
    // Con 10 avisos a 390 × 844, la baja (LSSI, art. 21.2) y su botón se ven al abrir, sin desplazar nada:
    // van en un pie fijo y solo se desplaza la lista. Siguen a la vista con la lista al final.
    const aLaVista = () => pagina.evaluate(() => {
      const d = document.getElementById('avisosDialogo'), lista = d.querySelector('.avisos-dialogo-cuerpo'), rd = d.getBoundingClientRect();
      const visible = n => { const r = n.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y);
        return r.height > 0 && r.top >= Math.max(0, rd.top) - 0.5 && r.bottom <= Math.min(innerHeight, rd.bottom) + 0.5 && !!e && n.contains(e); };
      return { avisos: d.querySelectorAll('#avisosDialogoLista li').length, ventana: [innerWidth, innerHeight],
        baja: visible(document.getElementById('avisosDialogoBaja')), gestionar: visible(d.querySelector('[data-avisos-gestionar]')),
        fueraDeLaLista: !lista.contains(document.getElementById('avisosDialogoBaja')), seDesplaza: lista.scrollHeight > lista.clientHeight + 1,
        lista: lista.scrollTop, dentro: rd.top >= 0 && rd.bottom <= innerHeight + 0.5 };
    });
    const alAbrir = await aLaVista();
    assert.deepEqual(alAbrir, { avisos: 10, ventana: [390, 844], baja: true, gestionar: true, fueraDeLaLista: true, seDesplaza: true,
      lista: 0, dentro: true }, 'la baja a la vista al abrir, sin desplazar');
    await captura(pagina, 'campana-dialogo-390.png');
    await pagina.evaluate(() => { const l = document.querySelector('#avisosDialogo .avisos-dialogo-cuerpo'); l.scrollTop = l.scrollHeight; });
    const alFinal = await aLaVista();
    assert.ok(alFinal.lista > 0 && alFinal.baja && alFinal.gestionar, 'con la lista al final, la baja sigue a la vista: ' + JSON.stringify(alFinal));
    await pagina.evaluate(() => { document.querySelector('#avisosDialogo .avisos-dialogo-cuerpo').scrollTop = 0; });
    await pagina.waitForFunction(() => document.getElementById('movilAvisosN').hidden, null, { timeout: 5000 });
    const tras = await pagina.evaluate(uid => ({ aria: document.getElementById('movilAvisos').getAttribute('aria-label'),
      nuevos: document.querySelectorAll('#avisosDialogo li.nuevo').length,
      guardado: JSON.parse(localStorage.getItem('rwadar.avisos.leidos.v1:' + uid) || '[]').length,
      globo: document.getElementById('movilGuardadosBadge').hidden }), USUARIO_PRUEBA.id);
    assert.deepEqual(tras, { aria: 'Avisos, ninguno sin leer', nuevos: 10, guardado: 10, globo: true }, 'los puntos se quedan mientras sigue abierto');
    r = await rastro();
    assert.ok(r.some(x => x[0] === 'clearAppBadge'), 'clearAppBadge');
    assert.ok(r.some(x => x[0] === 'sw' && x[1] === 'avisos-vistos'), 'el service worker pone su contador a 0');
    await captura(pagina, 'campana-leidos-390.png');
    await pagina.keyboard.press('Escape');
    await pagina.click('#movilAvisos');
    await pagina.waitForSelector('#avisosDialogo[open] #avisosDialogoLista li', { timeout: 10000 });
    assert.equal(await pagina.evaluate(() => document.querySelectorAll('#avisosDialogo li.nuevo').length), 0, 'al volver a abrirla ya están leídos');
    // «Notificaciones y avisos en Perfil» lleva a la baja.
    await pagina.click('#avisosDialogo [data-avisos-gestionar]');
    await pagina.waitForFunction(() => !document.getElementById('avisosDialogo').open, null, { timeout: 5000 });
    assert.equal(await pagina.evaluate(() => document.activeElement && document.activeElement.id), 'perfilAvisosTit');

    // Lo leído se recuerda en este navegador; un aviso nuevo enseña «1».
    escenario.avisos = [aviso(0), ...escenario.avisos];
    await pagina.reload({ waitUntil: 'load' });
    await pagina.waitForFunction(() => !document.getElementById('movilAvisosN').hidden, null, { timeout: 15000 });
    assert.equal(await pagina.textContent('#movilAvisosN'), '1');
    assert.equal(await pagina.getAttribute('#movilAvisos', 'aria-label'), 'Avisos, 1 sin leer');
    assert.equal(await pagina.getAttribute('#movilTabMas', 'aria-label'), 'Perfil, 1 aviso sin leer', 'en singular');
    assert.deepEqual((await rastro()).filter(x => x[0] === 'setAppBadge'), [['setAppBadge', 1]]);
    await captura(pagina, 'campana-1-390.png');

    // En inglés: la etiqueta con número y el diálogo, traducidos.
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
    await pagina.waitForFunction(() => document.getElementById('movilAvisos').getAttribute('aria-label') === 'Notices, 1 unread', null, { timeout: 5000 });
    assert.equal(await pagina.getAttribute('#movilTabMas', 'aria-label'), 'Profile, 1 unread notice');
    await pagina.click('#movilAvisos');
    await pagina.waitForSelector('#avisosDialogo[open]');
    await pagina.waitForTimeout(300);
    assert.equal(await pagina.textContent('#avisosDialogoTit'), 'Your notices');
    assert.equal(await pagina.textContent('#avisosDialogoBaja'), "Don't want these notices? Turn them off in Profile or in your phone settings.");
    assert.equal((await pagina.textContent('#avisosDialogo [data-avisos-gestionar]')).trim(), 'Notifications and notices in Profile');
    await pagina.keyboard.press('Escape');
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
    assert.deepEqual(errores, []);
    await contexto.close();

    // Desde una notificación (db/32: ?avisos=1): la lista se abre sola, con la
    // baja, la dirección queda limpia y el número baja a 0. Con la web ya
    // abierta, el service worker se lo pide con «abrir-avisos».
    escenario.avisos = [aviso(4), aviso(5)];
    const notificacion = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 }, ruta: '/?avisos=1#emisiones' });
    await notificacion.pagina.waitForSelector('#avisosDialogo[open] #avisosDialogoLista li', { timeout: 15000 });
    await notificacion.pagina.waitForFunction(() => document.getElementById('movilAvisosN').hidden, null, { timeout: 5000 });
    const desdeAviso = await notificacion.pagina.evaluate(() => ({ direccion: location.pathname + location.search + location.hash,
      baja: document.getElementById('avisosDialogoBaja').textContent, nuevos: document.querySelectorAll('#avisosDialogo li.nuevo').length }));
    assert.deepEqual(desdeAviso, { direccion: '/#emisiones', baja: BAJA, nuevos: 2 });
    await captura(notificacion.pagina, 'campana-desde-notificacion-390.png');
    await notificacion.pagina.keyboard.press('Escape');
    await notificacion.pagina.evaluate(() => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { tipo: 'abrir-avisos' } })));
    await notificacion.pagina.waitForSelector('#avisosDialogo[open]', { timeout: 5000 });
    assert.deepEqual(notificacion.errores, []);
    await notificacion.contexto.close();

    // Escritorio: la campana va en la cabecera, junto a «Mis inversiones».
    escenario.avisos = [aviso(1), aviso(2), aviso(3)];
    const escritorio = await abrir(navegador, local, { viewport: { width: 1366, height: 900 } });
    await escritorio.pagina.waitForFunction(() => document.getElementById('btnAvisosN').textContent === '3', null, { timeout: 15000 });
    const hdr = await escritorio.pagina.evaluate(() => { const b = document.getElementById('btnAvisos'), r = b.getBoundingClientRect();
      return { visible: r.width > 0 && getComputedStyle(b).display !== 'none', aria: b.getAttribute('aria-label'), alto: r.height,
        unaLinea: document.querySelector('.hdr-nav').getBoundingClientRect().height <= 48 }; });
    assert.deepEqual(hdr, { visible: true, aria: 'Avisos, 3 sin leer', alto: 44, unaLinea: true });
    // En el panel de la cuenta, «Avisos recibidos» es la lista; la cifra antigua (0) ya no sale.
    await escritorio.pagina.click('#btnCuenta');
    await escritorio.pagina.waitForSelector('#pfBandeja li', { timeout: 10000 });
    const panel = await escritorio.pagina.evaluate(() => ({ cifras: [...document.querySelectorAll('#perfilCuerpo .perfil-cifras .l')].map(n => n.textContent),
      marcar: !!document.querySelector('#pfBandeja [data-avisos-marcar]') }));
    assert.deepEqual(panel, { cifras: ['Díasde miembro', 'Plataformasque sigues'], marcar: true });
    await captura(escritorio.pagina, 'campana-escritorio-1366.png');
    assert.deepEqual(escritorio.errores, []);
    await escritorio.contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

test('en Chromium: «Notificaciones en este móvil» en Android, en el mismo toque, con el texto versionado antes y con desactivar y cerrar sesión', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, conSesion: true, responder });
  const navegador = await playwright.chromium.launch();
  try {
    escenario = { avisos: [aviso(1)], estado: ESTADO };
    const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 } });
    await pagina.click('#movilTabMas');
    await pagina.waitForFunction(() => { const b = document.getElementById('perfilPushActivar'); return b && !b.hidden && !b.disabled; }, null, { timeout: 15000 });
    await pagina.locator('#perfilPush').scrollIntoViewIfNeeded();
    const antes = await pagina.evaluate(() => ({ tit: document.getElementById('perfilPushTit').textContent, estado: document.getElementById('perfilPushEstado').textContent,
      boton: document.getElementById('perfilPushActivar').textContent, correo: document.getElementById('perfilNovedadesCorreo').textContent,
      interruptor: document.getElementById('perfilNovedadesOpcion').checked }));
    assert.equal(antes.tit, 'Notificaciones en este móvil');
    assert.match(antes.estado, /^Al activarlas, el navegador te pedirá permiso\. Guardamos en tu cuenta la dirección de entrega/);
    assert.equal(antes.boton, 'Activar notificaciones en este móvil');
    assert.equal(antes.correo, 'El envío por correo todavía no está activo.', 'con la casilla y el correo apagados se dice');
    assert.equal(antes.interruptor, true, 'el texto versionado ya está aceptado');
    // Primera capa junto al botón: quién interviene en la entrega, con su enlace a la privacidad.
    const quien = () => pagina.evaluate(() => {
      const q = document.getElementById('perfilPushQuien'), b = document.getElementById('perfilPushActivar');
      const r = q.getBoundingClientRect(), rb = b.hidden ? document.getElementById('perfilPushDesactivar').getBoundingClientRect() : b.getBoundingClientRect();
      return { visible: !q.hidden && r.height > 0, texto: q.textContent, enlace: q.querySelector('a')?.getAttribute('href'),
        junto: r.top >= rb.bottom - 0.5 && r.top - rb.bottom < 24 };
    });
    assert.deepEqual(await quien(), { visible: true, texto: QUIEN_WEB, enlace: '/privacidad#avisos-novedades', junto: true });
    await captura(pagina, 'perfil-avisos-android-390.png');
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
    await pagina.waitForFunction(() => /^When you turn them on/.test(document.getElementById('perfilPushQuien').textContent), null, { timeout: 5000 });
    assert.equal((await quien()).texto, "When you turn them on, your browser uses its maker's notification service (Apple, Google, Mozilla or Microsoft); the text is encrypted. More in Privacy.");
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
    await pagina.waitForFunction(t => document.getElementById('perfilPushQuien').textContent === t, QUIEN_WEB, { timeout: 5000 });
    await pagina.click('#perfilPushActivar');
    await pagina.waitForFunction(() => document.getElementById('perfilPushEstado').textContent === 'Notificaciones activadas en este móvil.', null, { timeout: 15000 });
    let r = await rastro();
    // La clave ya se preguntó al entrar (sin ella no se ofrece «Activar»); en el toque se vuelve a pedir, después del permiso.
    const iPermiso = r.findIndex(x => x[0] === 'requestPermission'), iClave = r.findIndex((x, i) => i > iPermiso && x[0] === 'datos' && x[1] === '/rpc/clave_publica_webpush');
    assert.ok(iPermiso >= 0 && iClave > iPermiso, 'el permiso se pide en el mismo toque, antes de cualquier espera');
    assert.deepEqual(r.find(x => x[0] === 'subscribe'), ['subscribe', true, 65, 4], 'userVisibleOnly y la clave P-256 sin comprimir (65 bytes, empieza por 4)');
    assert.deepEqual(r.find(x => x[0] === 'showNotification'), ['showNotification', 'Notificaciones activadas en este móvil', 'Así te llegarán los avisos de RWAdar.', 'rwadar-activadas', '/icono-192.png']);
    assert.deepEqual(rpc(local, 'registrar_aviso_webpush').map(p => p.cuerpo),
      [{ p_endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-123', p_p256dh: 'BPrueba_p256dh-clave', p_auth: 'auth-prueba' }]);
    const activas = await pagina.evaluate(() => ({ activar: document.getElementById('perfilPushActivar').hidden, desactivar: document.getElementById('perfilPushDesactivar').hidden }));
    assert.deepEqual(activas, { activar: true, desactivar: false });
    assert.deepEqual(await quien(), { visible: true, texto: QUIEN_WEB, enlace: '/privacidad#avisos-novedades', junto: true }, 'también junto a «Desactivar»');
    await captura(pagina, 'perfil-avisos-activadas-390.png');

    // Desactivar: la base y el navegador.
    await pagina.click('#perfilPushDesactivar');
    await pagina.waitForFunction(() => document.getElementById('perfilPushEstado').textContent === 'Notificaciones desactivadas en este móvil.', null, { timeout: 15000 });
    assert.deepEqual(rpc(local, 'quitar_aviso_webpush').map(p => p.cuerpo), [{ p_endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-123' }]);
    assert.ok((await rastro()).some(x => x[0] === 'unsubscribe'));

    // Activar otra vez y cerrar sesión: se quita antes de cerrar.
    await pagina.click('#perfilPushActivar');
    await pagina.waitForFunction(() => document.getElementById('perfilPushEstado').textContent === 'Notificaciones activadas en este móvil.', null, { timeout: 15000 });
    await pagina.click('#movilCuentaAccion');
    await pagina.waitForSelector('#pfSalir', { state: 'visible', timeout: 10000 });
    const quitadasAntes = rpc(local, 'quitar_aviso_webpush').length, orden = [];
    pagina.on('request', peticion => {
      if (peticion.url().endsWith('/api/acceso/salir')) orden.push('salir');
      else if (peticion.url().endsWith('/api/acceso/datos') && (peticion.postData() || '').includes('quitar_aviso_webpush')) orden.push('quitar');
    });
    await Promise.all([pagina.waitForNavigation({ timeout: 15000 }).catch(() => {}), pagina.click('#pfSalir')]);
    await pagina.waitForTimeout(500);
    assert.equal(rpc(local, 'quitar_aviso_webpush').length, quitadasAntes + 1, 'al cerrar sesión se quita');
    assert.deepEqual(orden, ['quitar', 'salir'], 'antes del cierre de la sesión');
    assert.deepEqual(errores, []);
    await contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

test('en Chromium: estados claros (denegadas, todavía no disponibles, falta el permiso de avisos) y el iPhone sin la web en la pantalla de inicio', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, conSesion: true, responder });
  const navegador = await playwright.chromium.launch();
  const estadoPush = pagina => pagina.evaluate(() => ({ texto: document.getElementById('perfilPushEstado').textContent,
    activar: document.getElementById('perfilPushActivar').hidden ? 'oculto' : document.getElementById('perfilPushActivar').disabled ? 'bloqueado' : 'listo',
    pasos: !document.getElementById('perfilPushPasos').hidden }));
  const esperarTexto = (pagina, re) => pagina.waitForFunction(fuente => new RegExp(fuente).test(document.getElementById('perfilPushEstado')?.textContent || ''), re.source, { timeout: 15000 });
  try {
    const casos = [
      // En Android sin instalar no hay icono de RWAdar: los permisos, desde la barra de la dirección.
      { nombre: 'denegadas en Chrome', cfg: { permiso: 'denied' }, estado: ESTADO, espera: /^Has bloqueado las notificaciones de RWAdar en este navegador\. Para permitirlas, toca el icono que hay a la izquierda de la dirección › Permisos › Notificaciones/, activar: 'oculto' },
      { nombre: 'denegadas con la web instalada', cfg: { permiso: 'denied', standalone: true }, estado: ESTADO, espera: /^Has bloqueado las notificaciones de RWAdar en este navegador\. Para permitirlas: en iPhone, Ajustes › Notificaciones › RWAdar; en Android, mantén pulsado el icono de RWAdar/, activar: 'oculto' },
      // Con el envío apagado se pueden activar (registrarse no envía nada): así se prueban antes de encenderlo para todos.
      { nombre: 'envío apagado', cfg: {}, estado: { ...ESTADO, push_activo: false }, espera: /^Todavía no hemos empezado a enviarlas: puedes activarlas ya y te llegarán cuando empecemos\. Al activarlas, el navegador te pedirá permiso\./, activar: 'listo' },
      { nombre: 'sin «Avisos de novedades»', cfg: {}, estado: { ...ESTADO, novedades: false, version: null }, espera: /^Para recibirlas, activa antes «Avisos de novedades»\.$/, activar: 'bloqueado' },
    ];
    for (const caso of casos) {
      escenario = { avisos: [], estado: caso.estado };
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 }, cfg: caso.cfg });
      await pagina.click('#movilTabMas');
      await esperarTexto(pagina, caso.espera);
      const e = await estadoPush(pagina);
      assert.equal(e.activar, caso.activar, caso.nombre);
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false, caso.nombre + ': no se pide nada');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // Con el envío apagado, Víctor activa las de su móvil y la acción «prueba» ya tiene a quién ir.
    escenario = { avisos: [], estado: { ...ESTADO, push_activo: false } };
    {
      const antes = rpc(local, 'registrar_aviso_webpush').length;
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'iPhone 13', viewport: { width: 390, height: 844 }, cfg: { standalone: true } });
      await pagina.click('#movilTabMas');
      await pagina.waitForFunction(() => { const b = document.getElementById('perfilPushActivar'); return b && !b.hidden && !b.disabled; }, null, { timeout: 15000 });
      await pagina.locator('#perfilPush').scrollIntoViewIfNeeded();
      await captura(pagina, 'perfil-avisos-iphone-envio-apagado-390.png');
      await pagina.click('#perfilPushActivar');
      await esperarTexto(pagina, /^Notificaciones activadas en este móvil\. Te llegarán cuando empecemos a enviarlas\.$/);
      const r = await rastro();
      assert.ok(r.some(x => x[0] === 'requestPermission') && r.some(x => x[0] === 'subscribe'), 'pide permiso y se suscribe');
      assert.equal(rpc(local, 'registrar_aviso_webpush').length, antes + 1, 'queda registrado (sin enviar nada)');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // La clave todavía no existe (null): no se ofrece «Activar» y no se pide nada.
    escenario = { avisos: [], estado: ESTADO, clave: null };
    {
      const registradas = rpc(local, 'registrar_aviso_webpush').length;
      const { contexto, pagina, rastro } = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 } });
      await pagina.click('#movilTabMas');
      await esperarTexto(pagina, /^Las notificaciones en este móvil todavía no están disponibles; te lo diremos aquí cuando empecemos a enviarlas\./);
      assert.equal((await estadoPush(pagina)).activar, 'bloqueado');
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission' || x[0] === 'subscribe'), false);
      assert.equal(rpc(local, 'registrar_aviso_webpush').length, registradas);
      await contexto.close();
    }

    // Ya activadas en este móvil: al entrar se comprueba y se renueva una sola vez
    // (db/32 borra las suscripciones que llevan 180 días sin renovarse). Sin
    // «Avisos de novedades», la web no promete avisos de servicio: no los hay.
    for (const caso of [
      { nombre: 'activadas', estado: ESTADO, espera: /^Activadas: este móvil recibe las notificaciones de RWAdar\.$/ },
      { nombre: 'activadas con el envío apagado', estado: { ...ESTADO, push_activo: false },
        espera: /^Activadas en este móvil\. Ahora mismo no estamos enviando notificaciones: te llegarán en cuanto empecemos\. Puedes desactivarlas aquí\.$/ },
      { nombre: 'activadas sin «Avisos de novedades»', estado: { ...ESTADO, novedades: false, version: null },
        espera: /^Con «Avisos de novedades» desactivado, este móvil no recibe notificaciones de RWAdar\. Actívalo para volver a recibirlas, o desactívalas aquí\.$/ },
    ]) {
      escenario = { avisos: [], estado: caso.estado, registrado: true };
      const antes = { mi: rpc(local, 'mi_aviso_webpush_registrado').length, registrar: rpc(local, 'registrar_aviso_webpush').length };
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'Pixel 7', viewport: { width: 390, height: 844 }, cfg: { permiso: 'granted', suscrito: true } });
      await pagina.click('#movilTabMas');
      await esperarTexto(pagina, caso.espera);
      await pagina.waitForTimeout(300);
      const e = await estadoPush(pagina);
      assert.equal(e.activar, 'oculto', caso.nombre);
      assert.equal(await pagina.evaluate(() => document.getElementById('perfilPushDesactivar').hidden), false, caso.nombre + ': se puede desactivar');
      const mi = rpc(local, 'mi_aviso_webpush_registrado').slice(antes.mi), renovar = rpc(local, 'registrar_aviso_webpush').slice(antes.registrar);
      assert.ok(mi.length >= 1 && mi.every(p => p.cuerpo.p_endpoint === 'https://fcm.googleapis.com/fcm/send/prueba-123'), caso.nombre + ': pregunta por su propio endpoint');
      assert.deepEqual(renovar.map(p => p.cuerpo), [{ p_endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-123', p_p256dh: 'BPrueba_p256dh-clave', p_auth: 'auth-prueba' }],
        caso.nombre + ': la renueva una sola vez con la misma suscripción');
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission' || x[0] === 'subscribe' || x[0] === 'unsubscribe'), false, caso.nombre + ': no pide nada ni la cambia');
      assert.deepEqual(errores, []);
      await contexto.close();
    }

    // iPhone sin la web en la pantalla de inicio: tres pasos y el diálogo de siempre; no se pide nada.
    escenario = { avisos: [aviso(1)], estado: ESTADO };
    const iphone = await abrir(navegador, local, { dispositivo: 'iPhone 13', viewport: { width: 390, height: 844 } });
    await iphone.pagina.click('#movilTabMas');
    await esperarTexto(iphone.pagina, /^En iPhone y iPad las notificaciones solo funcionan con RWAdar en la pantalla de inicio/);
    await iphone.pagina.locator('#perfilPush').scrollIntoViewIfNeeded();
    const ios = await iphone.pagina.evaluate(() => ({ pasos: [...document.querySelectorAll('#perfilPushPasos li')].map(li => li.textContent),
      verPasos: !document.getElementById('perfilPushPasos').hidden, activar: document.getElementById('perfilPushActivar').hidden,
      instalar: !document.getElementById('perfilPushInstalar').hidden, quien: !document.getElementById('perfilPushQuien').hidden }));
    assert.deepEqual(ios, { pasos: ['Pulsa el botón Compartir (un cuadrado con una flecha hacia arriba).', 'Elige «Añadir a pantalla de inicio» y pulsa Añadir.',
      'Abre RWAdar desde el icono nuevo, entra en tu cuenta y vuelve a Perfil › Avisos.'], verPasos: true, activar: true, instalar: true, quien: false },
      'sin botón para activarlas, tampoco la frase de quién interviene');
    await captura(iphone.pagina, 'perfil-avisos-iphone-390.png');
    await iphone.pagina.click('#perfilPushInstalar');
    await iphone.pagina.waitForSelector('#instalarIphone[open]', { timeout: 5000 });
    assert.match(await iphone.pagina.textContent('#instalarIphoneTitulo'), /Tenla como una app/);
    assert.equal((await iphone.rastro()).some(x => x[0] === 'requestPermission' || x[0] === 'subscribe'), false);
    assert.deepEqual(iphone.errores, []);
    await iphone.contexto.close();

    // El mismo iPhone con RWAdar en la pantalla de inicio: ya se puede activar.
    const instalada = await abrir(navegador, local, { dispositivo: 'iPhone 13', viewport: { width: 390, height: 844 }, cfg: { standalone: true } });
    await instalada.pagina.click('#movilTabMas');
    await instalada.pagina.waitForFunction(() => { const b = document.getElementById('perfilPushActivar'); return b && !b.hidden && !b.disabled; }, null, { timeout: 15000 });
    assert.equal(await instalada.pagina.evaluate(() => document.getElementById('perfilPushPasos').hidden), true);
    await instalada.contexto.close();

    // En un ordenador no se ofrece: se explica que va en el móvil.
    const pc = await abrir(navegador, local, { viewport: { width: 1366, height: 900 } });
    await pc.pagina.click('#btnCuenta');
    await pc.pagina.waitForSelector('#pfPushEstado', { state: 'attached', timeout: 10000 });
    await pc.pagina.waitForFunction(() => /^Las notificaciones se activan desde el móvil o la tableta/.test(document.getElementById('pfPushEstado').textContent), null, { timeout: 10000 });
    assert.deepEqual(await pc.pagina.evaluate(() => [document.getElementById('pfPushActivar').hidden, document.getElementById('pfPushQuien').hidden]), [true, true]);
    assert.deepEqual(pc.errores, []);
    await pc.contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
