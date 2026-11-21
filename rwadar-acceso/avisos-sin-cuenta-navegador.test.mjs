/* Notificaciones sin cuenta (14/11/2026), en Chromium sobre el worker local
   con las fuentes de rwadar-site. Encargo de la dirección: «que salga tanto
   en iPhone como en Android; muy importante que funcionen las notificaciones
   y los avisos aunque no tengan cuenta o no hayan iniciado sesión: que puedan
   activarlas». Contrato: docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md.

   La página se sirve con un origen https de prueba (en 127.0.0.1 la web
   apaga las cuentas y, con ellas, esto) y TODO pasa por el worker de verdad:
   /api/avisos/* con sus reglas, contra una base simulada (las RPC de la
   migración 36). Los service workers reales van bloqueados y PushManager y
   Notification se simulan para ver qué pide la página y en qué orden.
   - Perfil › Avisos sin sesión (Android, iPhone sin instalar, iPhone con la
     web en la pantalla de inicio): el texto versionado del servidor, quién
     interviene, la información básica y «Activar notificaciones en este
     móvil» en el mismo toque (permiso, suscripción, alta y la notificación de
     muestra); «Desactivar» (baja y fuera la suscripción).
   - Base apagada: «todavía no está disponible» y no se pide nada.
   - Renovación al abrir como mucho cada 12 horas.
   - ?avisos=1 sin sesión: los avisos publicados y la baja de este móvil.
   - Con sesión: cerrar sesión no quita la suscripción de sin cuenta.
   - La ventana de novedades: el recuadro «Activa los avisos» arriba, a la
     vista sin desplazar en un iPhone 13 (390 × 664) y en un Android pequeño
     (360 × 640), y su botón activa directamente; en iPhone sin instalar,
     lleva a los pasos de añadir a la pantalla de inicio.
   Con RWADAR_CAPTURAS=<carpeta> guarda las capturas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { arrancarWorkerLocal } from './probar-worker-local.mjs';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CAPTURAS = process.env.RWADAR_CAPTURAS || '';
const ORIGEN = 'https://rwadar.prueba.test';
const NOVEDADES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'rwadar-site', 'datos', 'novedades-producto.json'), 'utf8'));

function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

// El texto versionado de la migración 36, palabra por palabra.
const VERSION = 'sin-cuenta-v1-2026-11-14';
const TEXTO_ES = 'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It's optional and doesn't need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.";
// Una clave pública P-256 de usar y tirar (87 caracteres en base64url) y las claves de una suscripción con la forma de verdad.
const CLAVE = crypto.createECDH('prime256v1').generateKeys().toString('base64url');
const SUS = { endpoint: 'https://fcm.googleapis.com/fcm/send/sin-cuenta-123', p256dh: crypto.createECDH('prime256v1').generateKeys().toString('base64url'),
  auth: crypto.randomBytes(16).toString('base64url') };
const SUS2 = { endpoint: 'https://fcm.googleapis.com/fcm/send/sin-cuenta-456', p256dh: crypto.createECDH('prime256v1').generateKeys().toString('base64url'),
  auth: crypto.randomBytes(16).toString('base64url') };
const aviso = (i, extra = {}) => ({ id: String(100 - i), tipo: 'novedad', titulo: 'Aviso público ' + i, texto: 'Texto del aviso ' + i + '.',
  enlace: 'https://rwadar.pages.dev/novedades-rwadar/', creado_el: '2026-11-1' + i + 'T10:00:00Z', ...extra });

// Lo que contesta la base de prueba (migración 36); cada prueba lo cambia.
let escenario = {};
const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
async function responder(url) {
  const ruta = url.pathname;
  if (ruta === '/rest/v1/rpc/avisos_sin_cuenta_texto') return escenario.sin36 ? json({ code: 'PGRST202' }, 404)
    : json({ v: 1, activo: escenario.activo !== false, version: VERSION, texto_es: TEXTO_ES, texto_en: TEXTO_EN, clave_publica: CLAVE });
  if (ruta === '/rest/v1/rpc/alta_aviso_sin_cuenta_web') return json(escenario.alta || { ok: true, estado: 'activa', nueva: true });
  if (ruta === '/rest/v1/rpc/baja_aviso_sin_cuenta_web') return json({ ok: true, borrada: true });
  if (ruta === '/rest/v1/rpc/aviso_sin_cuenta_web_activo') return json(escenario.estadoSC || { ok: true, activa: true, vigente: true, servicio: true });
  if (ruta === '/rest/v1/rpc/avisos_publicos') return json(escenario.recientes || []);
  if (ruta === '/rest/v1/rpc/mis_avisos_recientes') return json([]);
  if (ruta === '/rest/v1/rpc/estado_mis_avisos') return json({ novedades: false, version: null, version_vigente: 'novedades-v2-2026-11-06', correo_activo: false, push_activo: true });
  if (ruta === '/rest/v1/rpc/clave_publica_webpush') return json(CLAVE);
  if (ruta === '/rest/v1/rpc/registrar_aviso_webpush' || ruta === '/rest/v1/rpc/quitar_aviso_webpush') return json(true);
  if (ruta === '/rest/v1/rpc/mi_aviso_webpush_registrado') return json(escenario.registradoCuenta === true);
  if (ruta === '/rest/v1/vigilancia') return json([]);
  return null;
}

/* Antes de cualquier script: Notification, PushManager y el registro del
   service worker simulados; todo deja rastro en window.__rastro. La
   suscripción lleva options.applicationServerKey, como la de verdad. */
function simular(cfg) {
  const rastro = window.__rastro = [];
  // También a la consola: lo que pasa justo antes de una recarga (cerrar sesión) no se pierde.
  const anota = (...a) => { rastro.push(a); try { console.debug('__rastro ' + JSON.stringify(a)); } catch { /* nada */ } };
  if (cfg.persona) Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
  if (cfg.standalone) Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true, configurable: true });
  if (cfg.marca) try { localStorage.setItem('rwadar.avisos.sin-cuenta.v1', JSON.stringify(cfg.marca)); } catch { /* nada */ }
  let permiso = cfg.permiso || 'default';
  Object.defineProperty(Notification, 'permission', { get: () => permiso, configurable: true });
  Notification.requestPermission = function () { anota('requestPermission'); permiso = cfg.respuesta || 'granted'; return Promise.resolve(permiso); };
  const claves = cfg.claves;
  let suscripcion = null, cuantas = 0;
  const b64 = s => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(t + '='.repeat((4 - t.length % 4) % 4)); return Uint8Array.from(bin, c => c.charCodeAt(0)); };
  const nueva = clave => { const k = claves[Math.min(cuantas++, claves.length - 1)]; return { endpoint: k.endpoint, options: { applicationServerKey: clave ? clave.buffer : null },
    toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: k.p256dh, auth: k.auth } }; },
    unsubscribe() { anota('unsubscribe', this.endpoint); suscripcion = null; return Promise.resolve(true); } }; };
  if (cfg.suscrito) suscripcion = nueva(b64(cfg.clave));
  const registro = { scope: location.origin + '/', active: { postMessage(m) { anota('sw', m.tipo, m.n); } },
    pushManager: { getSubscription: () => Promise.resolve(suscripcion),
      subscribe(o) { anota('subscribe', o.userVisibleOnly, o.applicationServerKey.length); suscripcion = nueva(o.applicationServerKey); return Promise.resolve(suscripcion); } },
    showNotification(t, o) { anota('showNotification', t, o.body, o.tag); return Promise.resolve(); },
    update: () => Promise.resolve() };
  const sw = navigator.serviceWorker;
  sw.getRegistration = () => Promise.resolve(registro);
  sw.register = () => Promise.resolve(registro);
  Object.defineProperty(sw, 'ready', { get: () => Promise.resolve(registro), configurable: true });
  Object.defineProperty(sw, 'controller', { get: () => registro.active, configurable: true });
}

async function abrir(navegador, local, { dispositivo = 'Pixel 7', viewport = null, cfg = {}, ruta = '/' } = {}) {
  const opciones = { ...playwright.devices[dispositivo], ...(viewport ? { viewport } : {}), serviceWorkers: 'block' };
  delete opciones.defaultBrowserType;
  const contexto = await navegador.newContext(opciones);
  await contexto.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.origin !== ORIGEN) return r.abort();
    const cabeceras = { ...r.request().headers() };
    if (cabeceras.origin) cabeceras.origin = local.url;
    try { await r.fulfill({ response: await r.fetch({ url: local.url + u.pathname + u.search, headers: cabeceras }) }); }
    catch { await r.abort().catch(() => {}); }
  });
  await contexto.addInitScript(simular, { claves: [SUS, SUS2], clave: CLAVE, ...cfg });
  const pagina = await contexto.newPage();
  const errores = [], todo = [];
  pagina.on('pageerror', e => errores.push(e.message));
  pagina.on('console', m => { if (m.type() === 'debug' && m.text().startsWith('__rastro ')) todo.push(JSON.parse(m.text().slice(9))); });
  await pagina.goto(ORIGEN + ruta, { waitUntil: 'load' });
  await pagina.waitForFunction(() => typeof Cuenta !== 'undefined' && typeof window.RWAdarAvisosSinCuenta === 'object', null, { timeout: 20000 });
  return { contexto, pagina, errores, todo, rastro: () => pagina.evaluate(() => window.__rastro) };
}
// La misma huella que la página (cyrb53 de la dirección de entrega), para preparar una marca.
function huellaDe(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}
const rpc = (local, nombre) => local.peticionesSupabase.filter(p => p.ruta === '/rest/v1/rpc/' + nombre);
const captura = async (pagina, nombre) => { if (CAPTURAS) await pagina.screenshot({ path: path.join(CAPTURAS, nombre) }); };
async function irAPerfil(pagina) {
  await pagina.click('#movilTabMas');
  await pagina.locator('#perfilAvisosSinCuenta').scrollIntoViewIfNeeded();
}
const leerBloque = pagina => pagina.evaluate(() => {
  const $ = id => document.getElementById(id), vis = id => !!$(id) && !$(id).hidden;
  return { visible: vis('perfilAvisosSinCuenta'), texto: vis('perfilScTexto') ? $('perfilScTexto').textContent : null,
    enlace: $('perfilScTexto').querySelector('a')?.getAttribute('href') || null, estado: $('perfilScEstado').textContent,
    activar: vis('perfilScActivar') ? ($('perfilScActivar').disabled ? 'bloqueado' : 'listo') : 'oculto',
    desactivar: vis('perfilScDesactivar'), pasos: vis('perfilScPasos'), instalar: vis('perfilScInstalar'), quien: vis('perfilScQuien'),
    datos: $('perfilScDatos').textContent, marca: (() => { try { return JSON.parse(localStorage.getItem('rwadar.avisos.sin-cuenta.v1')); } catch { return null; } })() };
});
const esperarEstado = (pagina, re) => pagina.waitForFunction(f => new RegExp(f).test(document.getElementById('perfilScEstado')?.textContent || ''), re.source, { timeout: 15000 });
const INFO_INICIO = 'Información básica sobre tus datos (sin cuenta). Responsable: el titular de RWAdar';
const DISPONIBLE = /^Al activarlas, el navegador te pedirá permiso\. No hace falta cuenta/;

test('en Chromium: Perfil › Avisos sin sesión en Android: texto versionado, activar en el mismo toque y desactivar', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
  const navegador = await playwright.chromium.launch();
  try {
    escenario = {};
    const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { viewport: { width: 360, height: 640 } });
    // Al abrir no se pide nada a nadie: el texto, cuando el bloque se ve.
    assert.equal(rpc(local, 'avisos_sin_cuenta_texto').length, 0, 'sin ver Perfil, ni el texto');
    await irAPerfil(pagina);
    await esperarEstado(pagina, DISPONIBLE);
    let b = await leerBloque(pagina);
    assert.equal(b.visible, true);
    assert.equal(b.texto, TEXTO_ES, 'el texto versionado del servidor, tal cual');
    assert.equal(b.enlace, '/privacidad#avisos-sin-cuenta');
    assert.equal(b.activar, 'listo');
    assert.ok(b.quien && b.datos.startsWith(INFO_INICIO), 'quién interviene y la información básica, junto al botón');
    assert.equal(b.desactivar, false);
    assert.equal(await pagina.evaluate(() => document.getElementById('perfilAvisosNovedades').hidden), false, 'la tarjeta de la cuenta sigue debajo');
    assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false, 'no se pide nada al abrir');
    await captura(pagina, 'perfil-sin-cuenta-android-360x640.png');

    // En inglés: el texto en inglés del servidor y la información básica, también.
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
    await pagina.waitForFunction(t => document.getElementById('perfilScTexto').textContent === t, TEXTO_EN, { timeout: 5000 });
    assert.match(await pagina.textContent('#perfilScDatos'), /^Basic information about your data \(no account\)\./);
    assert.equal((await pagina.textContent('#perfilScActivar')).trim(), 'Turn on notifications on this phone');
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
    await pagina.waitForFunction(t => document.getElementById('perfilScTexto').textContent === t, TEXTO_ES, { timeout: 5000 });

    // Activar: permiso en el mismo toque, suscripción, alta y la notificación de muestra.
    await pagina.click('#perfilScActivar');
    await esperarEstado(pagina, /^Notificaciones activadas en este móvil\.$/);
    const r = await rastro();
    assert.equal(r.findIndex(x => x[0] === 'requestPermission'), 0, 'lo primero, el permiso');
    assert.deepEqual(r.find(x => x[0] === 'subscribe'), ['subscribe', true, 65]);
    assert.deepEqual(r.find(x => x[0] === 'showNotification'), ['showNotification', 'Notificaciones activadas en este móvil', 'Así te llegarán los avisos de RWAdar.', 'rwadar-activadas']);
    assert.deepEqual(rpc(local, 'alta_aviso_sin_cuenta_web').map(p => p.cuerpo), [{ p_endpoint: SUS.endpoint, p_p256dh: SUS.p256dh, p_auth: SUS.auth,
      p_version: VERSION, p_idioma: 'es', p_origen: 'perfil' }], 'el alta con la versión y el idioma que se han visto');
    b = await leerBloque(pagina);
    assert.equal(b.activar, 'oculto'); assert.equal(b.desactivar, true);
    assert.equal(b.marca.v, 1); assert.match(b.marca.huella, /^[0-9a-f]{16}$/);
    assert.ok(!JSON.stringify(b.marca).includes('fcm.googleapis.com'), 'la marca no guarda la dirección de entrega');
    assert.deepEqual([b.marca.version, b.marca.idioma, b.marca.origen], [VERSION, 'es', 'perfil']);
    await captura(pagina, 'perfil-sin-cuenta-android-activadas-360x640.png');

    // Desactivar: baja con la clave auth de este navegador y fuera la suscripción.
    await pagina.click('#perfilScDesactivar');
    await esperarEstado(pagina, /^Notificaciones desactivadas en este móvil\.$/);
    assert.deepEqual(rpc(local, 'baja_aviso_sin_cuenta_web').map(p => p.cuerpo), [{ p_endpoint: SUS.endpoint, p_auth: SUS.auth }]);
    assert.ok((await rastro()).some(x => x[0] === 'unsubscribe' && x[1] === SUS.endpoint));
    b = await leerBloque(pagina);
    assert.equal(b.marca, null); assert.equal(b.activar, 'listo');
    assert.deepEqual(errores, []);
    await contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

test('en Chromium: base apagada, sin la migración 36, iPhone sin instalar e instalado, renovación cada 12 h y ?avisos=1 sin sesión', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
  const navegador = await playwright.chromium.launch();
  try {
    // Base apagada (y sin la 36): con calma, «todavía no», sin botón y sin pedir nada. El servidor
    // guarda el texto 60 s en memoria: cada estado de la base, con su propio worker.
    for (const caso of [{ activo: false }, { sin36: true }]) {
      escenario = caso;
      const otro = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
      const { contexto, pagina, errores, rastro } = await abrir(navegador, otro);
      await irAPerfil(pagina);
      await esperarEstado(pagina, /^Las notificaciones sin cuenta todavía no están disponibles\. Pronto podrás activarlas aquí\.$/);
      const b = await leerBloque(pagina);
      assert.equal(b.activar, 'oculto', JSON.stringify(caso));
      assert.equal(b.texto, caso.sin36 ? null : TEXTO_ES);
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false);
      if (caso.activo === false) await captura(pagina, 'perfil-sin-cuenta-base-apagada-390.png');
      assert.deepEqual(errores, []);
      await contexto.close();
      await otro.cerrar();
    }

    // iPhone 13 sin la web en la pantalla de inicio: los pasos (sin «entra en tu cuenta») y el diálogo de siempre.
    escenario = {};
    {
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'iPhone 13' });
      await irAPerfil(pagina);
      await esperarEstado(pagina, /^En iPhone y iPad las notificaciones solo funcionan con RWAdar en la pantalla de inicio/);
      const b = await leerBloque(pagina);
      assert.deepEqual([b.pasos, b.instalar, b.activar], [true, true, 'oculto']);
      assert.deepEqual(await pagina.evaluate(() => [...document.querySelectorAll('#perfilScPasos li')].map(li => li.textContent)),
        ['Pulsa el botón Compartir (un cuadrado con una flecha hacia arriba).', 'Elige «Añadir a pantalla de inicio» y pulsa Añadir.',
          'Abre RWAdar desde el icono nuevo y vuelve a Perfil › Avisos. No hace falta cuenta.']);
      await captura(pagina, 'perfil-sin-cuenta-iphone-sin-instalar-390x664.png');
      await pagina.click('#perfilScInstalar');
      await pagina.waitForSelector('#instalarIphone[open]', { timeout: 5000 });
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false);
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // El mismo iPhone con la web instalada (simulada): se activa igual.
    {
      const antes = rpc(local, 'alta_aviso_sin_cuenta_web').length;
      const { contexto, pagina, errores } = await abrir(navegador, local, { dispositivo: 'iPhone 13', cfg: { standalone: true } });
      await irAPerfil(pagina);
      await esperarEstado(pagina, DISPONIBLE);
      await captura(pagina, 'perfil-sin-cuenta-iphone-instalada-390x664.png');
      await pagina.click('#perfilScActivar');
      await esperarEstado(pagina, /^Notificaciones activadas en este móvil\.$/);
      assert.equal(rpc(local, 'alta_aviso_sin_cuenta_web').length, antes + 1);
      await captura(pagina, 'perfil-sin-cuenta-iphone-instalada-activadas-390x664.png');
      assert.deepEqual(errores, []);
      await contexto.close();
    }

    // Renovación al abrir: con la marca de hace 13 horas, estado y alta otra vez; con la de hace 1 hora, nada.
    const huella = huellaDe(SUS.endpoint);
    for (const [horas, renueva] of [[13, true], [1, false]]) {
      const marca = { v: 1, huella, version: VERSION, idioma: 'es', origen: 'novedades', renovado: Date.now() - horas * 3600e3 };
      const antes = { estado: rpc(local, 'aviso_sin_cuenta_web_activo').length, alta: rpc(local, 'alta_aviso_sin_cuenta_web').length };
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { cfg: { permiso: 'granted', suscrito: true, marca } });
      await pagina.waitForTimeout(1200);
      const estado = rpc(local, 'aviso_sin_cuenta_web_activo').slice(antes.estado), alta = rpc(local, 'alta_aviso_sin_cuenta_web').slice(antes.alta);
      assert.equal(estado.length, renueva ? 1 : 0, horas + ' h');
      assert.deepEqual(alta.map(p => [p.cuerpo.p_endpoint, p.cuerpo.p_origen]), renueva ? [[SUS.endpoint, 'novedades']] : [], horas + ' h: la misma suscripción');
      assert.equal((await rastro()).some(x => ['requestPermission', 'subscribe', 'unsubscribe'].includes(x[0])), false, 'sin pedir nada ni cambiar la suscripción');
      if (renueva) assert.ok((await leerBloque(pagina)).marca.renovado > Date.now() - 60000, 'apunta la renovación');
      assert.deepEqual(errores, []);
      await contexto.close();
    }

    // Desde una notificación sin sesión (?avisos=1): los avisos publicados, la baja a la vista y el número a 0.
    // Con su propio worker: desde el 21/11/2026 cada página sin sesión pide la lista para la campana, y el
    // servidor guarda 60 s la que vieron las de arriba (vacía).
    escenario = { recientes: [aviso(4), aviso(3, { tipo: 'ofertas' })] };
    const conAvisos = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
    try {
      const marca = { v: 1, huella, version: VERSION, idioma: 'es', origen: 'perfil', renovado: Date.now() };
      const { contexto, pagina, errores, rastro } = await abrir(navegador, conAvisos, { viewport: { width: 360, height: 640 }, ruta: '/?avisos=1',
        cfg: { permiso: 'granted', suscrito: true, marca } });
      await pagina.waitForSelector('#avisosScDialogo[open] #avisosScLista li', { timeout: 15000 });
      await pagina.waitForFunction(() => !document.getElementById('avisosScDesactivar').hidden, null, { timeout: 5000 });
      const d = await pagina.evaluate(() => {
        const dlg = document.getElementById('avisosScDialogo'), rd = dlg.getBoundingClientRect();
        const visible = n => { const r = n.getBoundingClientRect(); return r.height > 0 && r.top >= Math.max(0, rd.top) - 0.5 && r.bottom <= Math.min(innerHeight, rd.bottom) + 0.5; };
        return { direccion: location.pathname + location.search, titulo: document.getElementById('avisosScDialogoTit').textContent,
          avisos: [...dlg.querySelectorAll('#avisosScLista li b')].map(b => b.textContent), baja: document.getElementById('avisosScBaja').textContent,
          bajaVisible: visible(document.getElementById('avisosScBaja')), botonVisible: visible(document.getElementById('avisosScDesactivar')),
          boton: document.getElementById('avisosScDesactivar').textContent };
      });
      assert.deepEqual(d, { direccion: '/', titulo: 'Avisos de RWAdar', avisos: ['Aviso público 4', 'Aviso público 3'],
        baja: '¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.', bajaVisible: true, botonVisible: true,
        boton: 'Desactivar las notificaciones de este móvil' });
      assert.ok((await rastro()).some(x => x[0] === 'sw' && x[1] === 'avisos-vistos'), 'el número del service worker, a 0');
      await captura(pagina, 'avisos-1-sin-sesion-360x640.png');
      const bajas = rpc(conAvisos, 'baja_aviso_sin_cuenta_web').length;
      await pagina.click('#avisosScDesactivar');
      await pagina.waitForFunction(() => document.getElementById('avisosScResultado').textContent === 'Notificaciones desactivadas en este móvil.', null, { timeout: 10000 });
      assert.equal(rpc(conAvisos, 'baja_aviso_sin_cuenta_web').length, bajas + 1);
      assert.ok((await rastro()).some(x => x[0] === 'unsubscribe'));
      assert.equal(await pagina.evaluate(() => document.getElementById('avisosScDesactivar').hidden), true, 'ya no hay nada que desactivar');
      await captura(pagina, 'avisos-1-sin-sesion-desactivadas-360x640.png');
      assert.deepEqual(errores, []);
      await contexto.close();
    } finally {
      await conAvisos.cerrar();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

test('en Chromium: con sesión, cerrar sesión no quita la suscripción de sin cuenta y «Desactivar» de la cuenta quita las dos', { skip: sinNavegador, timeout: 240000 }, async () => {
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, conSesion: true, responder });
  const navegador = await playwright.chromium.launch();
  try {
    escenario = { registradoCuenta: true };
    const marca = { v: 1, huella: huellaDe(SUS.endpoint), version: VERSION, idioma: 'es', origen: 'perfil', renovado: Date.now() };
    // Con sesión y la marca: el bloque sin cuenta sale (para poder quitarlas) y cerrar sesión no quita la suscripción.
    const s = await abrir(navegador, local, { cfg: { permiso: 'granted', suscrito: true, marca } });
    await s.pagina.waitForFunction(() => typeof Cuenta !== 'undefined' && Cuenta.hay(), null, { timeout: 20000 });
    await irAPerfil(s.pagina);
    await s.pagina.waitForFunction(() => !document.getElementById('perfilAvisosSinCuenta').hidden, null, { timeout: 10000 });
    assert.match((await leerBloque(s.pagina)).estado, /^Este móvil también las tiene activadas sin cuenta: te llegan aunque cierres sesión\./);
    await s.pagina.click('#movilCuentaAccion');
    await s.pagina.waitForSelector('#pfSalir', { state: 'visible', timeout: 10000 });
    const quitadas = rpc(local, 'quitar_aviso_webpush').length;
    await Promise.all([s.pagina.waitForNavigation({ timeout: 15000 }).catch(() => {}), s.pagina.click('#pfSalir')]);
    await s.pagina.waitForTimeout(500);
    assert.equal(rpc(local, 'quitar_aviso_webpush').length, quitadas + 1, 'se quita de la cuenta');
    assert.equal(s.todo.some(x => x[0] === 'unsubscribe'), false, 'pero la suscripción de sin cuenta se queda');
    assert.equal(rpc(local, 'baja_aviso_sin_cuenta_web').length, 0, 'y sigue dada de alta sin cuenta');
    assert.deepEqual(s.errores, []);
    await s.contexto.close();

    // «Desactivar las notificaciones de este móvil» de la cuenta quita las dos: baja sin cuenta y fuera la suscripción.
    const c = await abrir(navegador, local, { cfg: { permiso: 'granted', suscrito: true, marca } });
    await c.pagina.waitForFunction(() => typeof Cuenta !== 'undefined' && Cuenta.hay(), null, { timeout: 20000 });
    await c.pagina.click('#movilTabMas');
    await c.pagina.waitForFunction(() => { const b = document.getElementById('perfilPushDesactivar'); return b && !b.hidden && !b.disabled; }, null, { timeout: 15000 });
    const bajas = rpc(local, 'baja_aviso_sin_cuenta_web').length;
    await c.pagina.click('#perfilPushDesactivar');
    await c.pagina.waitForFunction(() => document.getElementById('perfilPushEstado').textContent === 'Notificaciones desactivadas en este móvil.', null, { timeout: 15000 });
    assert.equal(rpc(local, 'baja_aviso_sin_cuenta_web').length, bajas + 1, 'baja también sin cuenta');
    assert.ok(c.todo.some(x => x[0] === 'unsubscribe'), 'y fuera la suscripción');
    assert.equal(await c.pagina.evaluate(() => localStorage.getItem('rwadar.avisos.sin-cuenta.v1')), null, 'sin marca');
    assert.deepEqual(c.errores, []);
    await c.contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

/* La ventana de novedades: el recuadro arriba, a la vista sin desplazar. */
const LEER_RECUADRO = () => {
  const d = document.getElementById('novedadesDialogo'), c = d && d.querySelector('[data-nov-recordatorio]');
  if (!c) return null;
  const cuerpo = d.querySelector('.nov-cuerpo'), rc = cuerpo.getBoundingClientRect(), b = c.querySelector('[data-nov-avisos]');
  const rb = b.getBoundingClientRect(), rr = c.getBoundingClientRect();
  return { modo: c.dataset.novModo, titulo: c.querySelector('.nov-rec-tit').textContent, texto: c.querySelector('.nov-rec-txt').textContent,
    boton: b.textContent.trim(), etiqueta: b.tagName, antesDePuntos: !!(c.compareDocumentPosition(d.querySelector('.nov-puntos')) & Node.DOCUMENT_POSITION_FOLLOWING),
    aLaVista: cuerpo.scrollTop === 0 && rr.top >= rc.top - 0.5 && rb.bottom <= rc.bottom + 0.5 && rb.bottom <= innerHeight, alto: rb.height,
    ventana: [innerWidth, innerHeight], fuera: [...d.querySelectorAll('*')].filter(n => { const r = n.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5); }).length,
    quien: (() => {
      const q = c.querySelector('p.nov-rec-quien'), det = c.querySelector('details.nov-rec-info');
      if (!q) return null;
      return { texto: q.textContent, enlace: q.querySelector('a')?.getAttribute('href') || null, visible: q.getBoundingClientRect().height > 0,
        trasBoton: !!(b.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING), antesDeInfo: !!det && !!(q.compareDocumentPosition(det) & Node.DOCUMENT_POSITION_FOLLOWING) };
    })() };
};

test('en Chromium: ventana de novedades sin sesión: el recuadro arriba y a la vista (390 × 664 y 360 × 640) y «Activar avisos» activa aquí mismo', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
  const navegador = await playwright.chromium.launch();
  try {
    escenario = {};
    for (const [dispositivo, ancho, alto] of [['iPhone 13', 390, 664], ['Pixel 7', 360, 640]]) {
      // En el iPhone, con la web instalada (simulada): si no, el recuadro lleva a los pasos.
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo, viewport: { width: ancho, height: alto },
        cfg: { persona: true, standalone: dispositivo === 'iPhone 13' } });
      await pagina.waitForSelector('#novedadesDialogo[open] [data-nov-recordatorio]', { timeout: 20000 });
      await pagina.waitForTimeout(200);
      const v = await pagina.evaluate(LEER_RECUADRO);
      assert.equal(v.modo, 'directo', `${ancho} × ${alto}: activa aquí mismo`);
      assert.equal(v.texto, TEXTO_ES, 'con el texto versionado a la vista');
      assert.deepEqual([v.titulo, v.boton, v.etiqueta], ['Activa los avisos', 'Activar avisos', 'BUTTON']);
      assert.ok(v.antesDePuntos, 'arriba, antes de los puntos');
      assert.ok(v.aLaVista, `${ancho} × ${alto}: el recuadro y su botón, a la vista sin desplazar: ${JSON.stringify(v)}`);
      assert.ok(v.alto >= 44 && v.fuera === 0);
      // Anexo legal, 7.3: quién interviene, junto al botón y a la vista (no plegado), con «Privacidad» a #garantias-push.
      assert.ok(v.quien && v.quien.visible && v.quien.trasBoton && v.quien.antesDeInfo, `quién interviene, junto al botón: ${JSON.stringify(v.quien)}`);
      assert.match(v.quien.texto, /^El servicio de tu navegador puede estar fuera de la UE: ve la hora de cada aviso, pero no puede leer su texto\. .* Más en Privacidad\.$/);
      assert.equal(v.quien.enlace, '/privacidad#garantias-push');
      await captura(pagina, `ventana-sin-cuenta-${dispositivo === 'iPhone 13' ? 'iphone13' : 'android'}-${ancho}x${alto}.png`);
      await pagina.click('#novedadesDialogo [data-nov-avisos]');
      await pagina.waitForFunction(() => /Notificaciones activadas en este móvil/.test(document.querySelector('#novedadesDialogo [data-nov-recordatorio]')?.textContent || ''), null, { timeout: 15000 });
      const r = await rastro();
      assert.equal(r.findIndex(x => x[0] === 'requestPermission'), 0, 'el permiso, en el mismo toque');
      assert.equal(rpc(local, 'alta_aviso_sin_cuenta_web').at(-1).cuerpo.p_origen, 'novedades');
      assert.equal(await pagina.evaluate(() => localStorage.getItem('rwadar.novedades.vista')), NOVEDADES.version, 'cuenta como vista');
      assert.equal(await pagina.evaluate(() => document.querySelector('#novedadesDialogo [data-nov-avisos]')?.hidden ?? true), true, 'activadas: sin botón');
      await captura(pagina, `ventana-sin-cuenta-activadas-${ancho}x${alto}.png`);
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // iPhone 13 sin instalar: el botón lleva a los pasos de añadirla a la pantalla de inicio.
    {
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: 'iPhone 13', cfg: { persona: true } });
      await pagina.waitForSelector('#novedadesDialogo[open] [data-nov-recordatorio]', { timeout: 20000 });
      const v = await pagina.evaluate(LEER_RECUADRO);
      assert.equal(v.modo, 'instalar');
      assert.ok(v.aLaVista && v.antesDePuntos, JSON.stringify(v));
      await captura(pagina, 'ventana-sin-cuenta-iphone13-sin-instalar-390x664.png');
      await pagina.click('#novedadesDialogo [data-nov-avisos]');
      await pagina.waitForSelector('#instalarIphone[open]', { timeout: 5000 });
      assert.equal(await pagina.locator('#novedadesDialogo').count(), 0, 'la ventana se cierra');
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false);
      await captura(pagina, 'ventana-sin-cuenta-iphone13-pasos-390x664.png');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // Base apagada (otro worker: el texto se guarda 60 s): el recuadro lleva a Perfil › Avisos, como antes, y no pide nada.
    escenario = { activo: false };
    {
      const otro = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
      const { contexto, pagina, errores, rastro } = await abrir(navegador, otro, { viewport: { width: 360, height: 640 }, cfg: { persona: true } });
      await pagina.waitForSelector('#novedadesDialogo[open] [data-nov-recordatorio]', { timeout: 20000 });
      const v = await pagina.evaluate(LEER_RECUADRO);
      assert.deepEqual([v.modo, v.etiqueta], ['perfil', 'A']);
      assert.ok(v.aLaVista, JSON.stringify(v));
      assert.equal((await rastro()).some(x => x[0] === 'requestPermission'), false);
      await captura(pagina, 'ventana-sin-cuenta-base-apagada-360x640.png');
      assert.deepEqual(errores, []);
      await contexto.close();
      await otro.cerrar();
    }
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});

// 21/11/2026, la dirección: «que en la pestaña de notificaciones, al leerlas, desaparezca como que está
// pendiente» y «me gustaría que los avisos salieran en Inicio arriba a la derecha, al lado del
// interrogante». Sin sesión, la campana sale justo a la izquierda del «?», igual de grande, redonda y
// oscura, con el número de avisos publicados que este navegador no ha visto. Abrirla es verlos (como un
// chat de WhatsApp): el número baja a 0 y se guarda en rwadar.avisos.leidos.publicos.v1, y los puntos
// de «Sin leer» se quedan mientras la lista siga abierta. «Borrar lo guardado aquí» lo olvida.
test('en Chromium: sin sesión, la campana junto al «?» cuenta los avisos publicados, abrirla es verlos y «Borrar lo guardado aquí» lo olvida', { skip: sinNavegador, timeout: 240000 }, async () => {
  if (CAPTURAS) fs.mkdirSync(CAPTURAS, { recursive: true });
  escenario = { recientes: [aviso(4), aviso(3, { tipo: 'ofertas' }), aviso(2)] };
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, responder });
  const navegador = await playwright.chromium.launch();
  const CLAVE = 'rwadar.avisos.leidos.publicos.v1';
  try {
    const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { viewport: { width: 390, height: 844 } });
    await pagina.waitForFunction(() => { const n = document.getElementById('movilAvisosN'); return !document.getElementById('movilAvisos').hidden && !n.hidden && n.textContent === '3'; }, null, { timeout: 15000 });
    const cabecera = await pagina.evaluate(() => {
      const b = document.getElementById('movilAvisos'), a = document.querySelector('[data-movil-action="ayuda"]');
      const rb = b.getBoundingClientRect(), ra = a.getBoundingClientRect(), eb = getComputedStyle(b), ea = getComputedStyle(a);
      return { aria: b.getAttribute('aria-label'), hueco: Math.round(ra.left - rb.right), mismaFila: Math.abs(ra.top - rb.top) < 1,
        tamano: [rb.width, rb.height], tamanoAyuda: [ra.width, ra.height], mismoRadio: eb.borderRadius === ea.borderRadius,
        mismoFondo: eb.backgroundColor === ea.backgroundColor, ayudaALaDerecha: ra.right <= innerWidth && innerWidth - ra.right <= 24,
        sinDesborde: document.documentElement.scrollWidth <= innerWidth, trazo: b.querySelector('svg').getAttribute('stroke') };
    });
    assert.deepEqual(cabecera, { aria: 'Avisos, 3 sin leer', hueco: 3, mismaFila: true, tamano: [44, 44], tamanoAyuda: [44, 44], mismoRadio: true,
      mismoFondo: true, ayudaALaDerecha: true, sinDesborde: true, trazo: 'currentColor' });
    assert.equal(rpc(local, 'avisos_publicos').length, 1, 'una sola lectura de los avisos publicados');
    assert.equal(rpc(local, 'mis_avisos_recientes').length, 0, 'nada de ninguna cuenta');
    assert.ok((await rastro()).some(x => x[0] === 'sw' && x[1] === 'avisos-pendientes' && x[2] === 3), 'el service worker sabe el número');
    await captura(pagina, 'campana-sin-cuenta-cabecera-390.png');

    // Al pulsarla, la lista con los no vistos marcados, su «Abrir» y la baja; abrirla ya es verlos.
    await pagina.click('#movilAvisos');
    await pagina.waitForSelector('#avisosScDialogo[open] #avisosScLista li', { timeout: 10000 });
    await pagina.waitForFunction(() => document.getElementById('movilAvisosN').hidden, null, { timeout: 5000 });
    const lista = await pagina.evaluate(clave => {
      const d = document.getElementById('avisosScDialogo');
      return { titulo: document.getElementById('avisosScDialogoTit').textContent, nuevos: d.querySelectorAll('li.nuevo').length,
        sinLeer: d.querySelectorAll('li.nuevo .solo-lector').length, abrir: [...d.querySelectorAll('#avisosScLista li a')].map(a => a.textContent),
        baja: document.getElementById('avisosScBaja').textContent, perfil: d.querySelector('[data-avisos-sc-perfil]').textContent,
        aria: document.getElementById('movilAvisos').getAttribute('aria-label'), guardado: JSON.parse(localStorage.getItem(clave) || '[]').sort(),
        cuentas: Object.keys(localStorage).filter(k => k.startsWith('rwadar.avisos.leidos.v1:')) };
    }, CLAVE);
    assert.deepEqual(lista, { titulo: 'Avisos de RWAdar', nuevos: 3, sinLeer: 3, abrir: ['Abrir', 'Abrir', 'Abrir'],
      baja: '¿No quieres estos avisos? Desactívalos aquí o en los ajustes del móvil.', perfil: 'Notificaciones y avisos en Perfil',
      aria: 'Avisos, ninguno sin leer', guardado: ['96', '97', '98'], cuentas: [] }, 'los puntos se quedan mientras sigue abierta');
    const r = await rastro();
    assert.ok(r.some(x => x[0] === 'sw' && x[1] === 'avisos-vistos'), 'el service worker y sus notificaciones, a 0');
    await captura(pagina, 'campana-sin-cuenta-lista-390.png');
    await pagina.keyboard.press('Escape');
    await pagina.click('#movilAvisos');
    await pagina.waitForSelector('#avisosScDialogo[open] #avisosScLista li', { timeout: 10000 });
    assert.equal(await pagina.evaluate(() => document.querySelectorAll('#avisosScDialogo li.nuevo').length), 0, 'al volver a abrirla ya están vistos');
    // «Notificaciones y avisos en Perfil» lleva a Perfil › Avisos.
    await pagina.click('#avisosScDialogo [data-avisos-sc-perfil]');
    await pagina.waitForFunction(() => !document.getElementById('avisosScDialogo').open, null, { timeout: 5000 });
    assert.equal(await pagina.evaluate(() => document.activeElement && document.activeElement.id), 'perfilAvisosTit');

    // Lo visto se recuerda al volver.
    const pedida = pagina.waitForResponse(res => res.url().endsWith('/api/avisos/recientes'), { timeout: 15000 });
    await pagina.reload({ waitUntil: 'load' });
    await pedida;
    await pagina.waitForTimeout(400);
    assert.deepEqual(await pagina.evaluate(() => [document.getElementById('movilAvisos').hidden, document.getElementById('movilAvisosN').hidden,
      document.getElementById('movilAvisos').getAttribute('aria-label')]), [false, true, 'Avisos, ninguno sin leer']);

    // «Borrar lo guardado aquí» (Perfil) lo olvida: vuelven a contar.
    await pagina.click('#movilTabMas');
    pagina.once('dialog', d => d.accept());
    await pagina.click('[data-movil-action="borrar-guardados"]');
    await pagina.waitForFunction(() => document.getElementById('movilAvisosN').textContent === '3' && !document.getElementById('movilAvisosN').hidden, null, { timeout: 5000 });
    assert.equal(await pagina.evaluate(clave => localStorage.getItem(clave), CLAVE), null);
    // En inglés, la etiqueta con número.
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
    await pagina.waitForFunction(() => document.getElementById('movilAvisos').getAttribute('aria-label') === 'Notices, 3 unread', null, { timeout: 5000 });
    await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('es'));
    assert.deepEqual(errores, []);
    await contexto.close();

    // Escritorio: la campana redonda y oscura en la cabecera, también sin sesión.
    const escritorio = await abrir(navegador, local, { dispositivo: 'Desktop Chrome', viewport: { width: 1366, height: 900 } });
    await escritorio.pagina.waitForFunction(() => document.getElementById('btnAvisosN').textContent === '3' && !document.getElementById('btnAvisosN').hidden, null, { timeout: 15000 });
    const hdr = await escritorio.pagina.evaluate(() => { const b = document.getElementById('btnAvisos'), r = b.getBoundingClientRect(), e = getComputedStyle(b);
      return { aria: b.getAttribute('aria-label'), tamano: [r.width, r.height], redonda: parseFloat(e.borderRadius) >= 22, derecha: r.left > innerWidth / 2,
        unaLinea: document.querySelector('.hdr-nav').getBoundingClientRect().height <= 48 }; });
    assert.deepEqual(hdr, { aria: 'Avisos, 3 sin leer', tamano: [44, 44], redonda: true, derecha: true, unaLinea: true });
    await captura(escritorio.pagina, 'campana-sin-cuenta-escritorio-1366.png');
    await escritorio.pagina.click('#btnAvisos');
    await escritorio.pagina.waitForSelector('#avisosScDialogo[open] #avisosScLista li.nuevo', { timeout: 10000 });
    await escritorio.pagina.waitForFunction(() => document.getElementById('btnAvisosN').hidden, null, { timeout: 5000 });
    await captura(escritorio.pagina, 'campana-sin-cuenta-escritorio-lista-1366.png');
    assert.deepEqual(escritorio.errores, []);
    await escritorio.contexto.close();
  } finally {
    await navegador.close();
    await local.cerrar();
  }
});
