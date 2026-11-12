/* «Notificaciones en este móvil» cuando la base falla (12/11/2026). Víctor, en
   su iPhone con la web en la pantalla de inicio: «No funciona lo de activar
   notificaciones». Si estado_mis_avisos, clave_publica_webpush o
   mi_aviso_webpush_registrado no contestaban, el bloque se quedaba en
   «Comprobando las notificaciones de este móvil…» con el botón apagado.
   Aquí, en Chromium sobre el worker local (como campana-avisos-navegador),
   cada llamada falla a propósito: 401, 500, sin red y sin respuesta. Lo que
   se mira es lo que ve la persona: nunca «Comprobando…» para siempre; sin
   sesión, «Tu sesión ha caducado: vuelve a entrar» con su botón; con otro
   fallo, «No hemos podido comprobar…» con «Reintentar»; y al activar, el
   motivo en llano con «Activar» para volver a intentarlo.
   Los fallos se ponen sobre /api/acceso/datos (lo que la página pide al
   servidor de la web); el «sin sesión» que no salta solo a /acceso se simula
   envolviendo el puente (assets/acceso-privado.js), que hoy sí salta. */
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

const CLAVE = crypto.createECDH('prime256v1').generateKeys().toString('base64url');
const ESTADO = { novedades: true, version: VERSION, version_vigente: VERSION, correo_activo: false, push_activo: true };
const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
async function responder(url) {
  const ruta = url.pathname;
  if (ruta === '/rest/v1/rpc/mis_avisos_recientes') return json([]);
  if (ruta === '/rest/v1/rpc/estado_mis_avisos') return json(ESTADO);
  if (ruta === '/rest/v1/rpc/clave_publica_webpush') return json(CLAVE);
  if (ruta === '/rest/v1/rpc/registrar_aviso_webpush') return json(true);
  if (ruta === '/rest/v1/rpc/quitar_aviso_webpush') return json(true);
  if (ruta === '/rest/v1/rpc/mi_aviso_webpush_registrado') return json(true);
  if (ruta === '/rest/v1/vigilancia') return json([]);
  return null;
}

const TEXTO = {
  comprobando: 'Comprobando las notificaciones de este móvil…',
  error: 'No hemos podido comprobar las notificaciones de este móvil. Revisa la conexión y pulsa Reintentar.',
  sesion: 'Tu sesión ha caducado: vuelve a entrar.',
  disponible: /^Al activarlas, el navegador te pedirá permiso\./,
  activadas: 'Notificaciones activadas en este móvil.',
  activas: 'Activadas: este móvil recibe las notificaciones de RWAdar.',
  red: 'No hemos podido conectar para activarlas. Revisa la conexión y vuelve a intentarlo.',
  navegador: 'El navegador no ha dejado activarlas. Comprueba que las notificaciones de RWAdar están permitidas en los ajustes del móvil y vuelve a intentarlo.',
  ios: 'En iPhone y iPad solo se pueden activar con RWAdar en la pantalla de inicio: añádela y ábrela desde su icono.',
  sesionActivar: 'Tu sesión ha caducado: vuelve a entrar para activarlas.',
  sinPermiso: 'No has dado permiso. Puedes volver a intentarlo cuando quieras.',
  denegado: /^Has bloqueado las notificaciones de RWAdar en este navegador\./,
};

/* En la página, antes de cualquier script: Notification, PushManager y el
   registro del service worker simulados (como en campana-avisos-navegador),
   con fallos que la prueba enciende y apaga en window.__fallo. Y el puente
   envuelto: window.__sinSesion[ruta] hace que esa llamada falle «sin sesión»
   sin saltar a /acceso (lo que hace hoy el puente al ver un 401). */
function simular(cfg) {
  const rastro = window.__rastro = [];
  const anota = (...a) => rastro.push(a);
  window.__fallo = { suscribir: cfg.suscribir || '' };
  window.__sinSesion = { ...(cfg.sinSesion || {}) };
  window.__standalone = cfg.standalone === true;
  Navigator.prototype.setAppBadge = () => Promise.resolve();
  Navigator.prototype.clearAppBadge = () => Promise.resolve();
  Object.defineProperty(Navigator.prototype, 'standalone', { get: () => window.__standalone, configurable: true });
  let permiso = cfg.permiso || 'default';
  Object.defineProperty(Notification, 'permission', { get: () => permiso, configurable: true });
  Notification.requestPermission = function () { anota('requestPermission'); permiso = cfg.respuesta || 'granted'; return Promise.resolve(permiso); };
  let suscripcion = null;
  const nueva = () => ({ endpoint: 'https://fcm.googleapis.com/fcm/send/prueba-123',
    toJSON() { return { endpoint: this.endpoint, expirationTime: null, keys: { p256dh: 'BPrueba_p256dh-clave', auth: 'auth-prueba' } }; },
    unsubscribe() { anota('unsubscribe'); suscripcion = null; return Promise.resolve(true); } });
  if (cfg.suscrito) suscripcion = nueva();
  const registro = { scope: location.origin + '/', active: { postMessage() {} },
    pushManager: { getSubscription: () => Promise.resolve(suscripcion),
      subscribe() {
        anota('subscribe');
        const fallo = window.__fallo.suscribir;
        // iOS: al suscribirse dice que la web ya no está en la pantalla de inicio.
        if (fallo === 'ios') { window.__standalone = false; return Promise.reject(new DOMException('Not in standalone mode', 'NotAllowedError')); }
        if (fallo) return Promise.reject(new DOMException('Fallo de prueba', fallo));
        suscripcion = nueva(); return Promise.resolve(suscripcion);
      } },
    showNotification() { anota('showNotification'); return Promise.resolve(); },
    update: () => Promise.resolve() };
  const sw = navigator.serviceWorker;
  sw.getRegistration = () => Promise.resolve(registro);
  sw.register = () => Promise.resolve(registro);
  Object.defineProperty(sw, 'ready', { get: () => Promise.resolve(registro), configurable: true });
  Object.defineProperty(sw, 'controller', { get: () => registro.active, configurable: true });
  let puente;
  Object.defineProperty(window, 'RWADAR_ACCESO', { configurable: true, get: () => puente, set(real) {
    puente = Object.freeze({ ...real, datos(ruta, opciones) {
      const como = window.__sinSesion[ruta];
      if (como === 'sin-estado') return Promise.reject(new Error('Entra para gestionar tu cuenta.'));
      if (como === '401') return Promise.reject(Object.assign(new Error('Entra para gestionar tu cuenta.'), { status: 401 }));
      return real.datos(ruta, opciones);
    } });
  } });
}

/* Fallos sobre /api/acceso/datos, por llamada: '500', '401', 'red' (sin
   conexión), 'colgada' (no contesta nunca) o 'una-401' (una sola vez). */
let fallos = {};
const colgadas = [];
async function abrir(navegador, local, { dispositivo = 'Pixel 7', cfg = {}, idioma = 'es', soloCargar = false } = {}) {
  const opciones = { ...playwright.devices[dispositivo], viewport: { width: 390, height: 844 }, serviceWorkers: 'block' };
  delete opciones.defaultBrowserType;
  const contexto = await navegador.newContext(opciones);
  await contexto.route('**/*', async ruta => {
    const u = new URL(ruta.request().url());
    if (u.origin !== ORIGEN) return ruta.abort();
    const cabeceras = { ...ruta.request().headers() };
    if (cabeceras.origin) cabeceras.origin = local.url;
    try { await ruta.fulfill({ response: await ruta.fetch({ url: local.url + u.pathname + u.search, headers: cabeceras }) }); }
    catch { await ruta.abort().catch(() => {}); }
  });
  // Registrada después: Playwright la mira antes que la general.
  await contexto.route(ORIGEN + '/api/acceso/datos', async ruta => {
    let pedida = '';
    try { pedida = JSON.parse(ruta.request().postData() || '{}').ruta || ''; } catch { /* sin cuerpo */ }
    const fallo = fallos[pedida];
    if (!fallo) return ruta.fallback();
    if (fallo === 'una-401') delete fallos[pedida];
    if (fallo === '500') return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"servicio_no_disponible"}' });
    if (fallo === '401' || fallo === 'una-401') return ruta.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"sesion_necesaria"}' });
    if (fallo === 'red') return ruta.abort('internetdisconnected');
    if (fallo === 'colgada') { await new Promise(soltar => colgadas.push(soltar)); return ruta.abort().catch(() => {}); }
    return ruta.fallback();
  });
  await contexto.addInitScript(simular, cfg);
  const pagina = await contexto.newPage();
  const errores = [], visitas = [];
  pagina.on('pageerror', e => errores.push(e.message));
  pagina.on('framenavigated', marco => { if (marco === pagina.mainFrame()) visitas.push(marco.url()); });
  await pagina.goto(ORIGEN + '/', { waitUntil: 'load' });
  if (soloCargar) return { contexto, pagina, errores, visitas };
  await pagina.waitForFunction(() => typeof Cuenta !== 'undefined' && Cuenta.hay(), null, { timeout: 20000 });
  if (idioma === 'en') await pagina.evaluate(() => RWAdarIdioma.cambiarIdioma('en'));
  await pagina.click('#movilTabMas');
  await pagina.waitForSelector('#perfilPush', { state: 'attached', timeout: 10000 });
  return { contexto, pagina, errores, visitas, rastro: () => pagina.evaluate(() => window.__rastro) };
}
const verPush = pagina => pagina.evaluate(() => {
  const $ = id => document.getElementById(id);
  const boton = id => $(id).hidden ? 'oculto' : $(id).disabled ? 'apagado' : 'listo';
  return { texto: $('perfilPushEstado').textContent, rol: $('perfilPushEstado').getAttribute('role'),
    activar: boton('perfilPushActivar'), reintentar: boton('perfilPushReintentar'), entrar: boton('perfilPushEntrar'),
    novedades: $('perfilNovedadesEstado').textContent };
});
const esperarTexto = (pagina, esperado, timeout = 15000) => pagina.waitForFunction(([fuente, exacto]) => {
  const t = document.getElementById('perfilPushEstado')?.textContent || '';
  return exacto ? t === fuente : new RegExp(fuente).test(t);
}, typeof esperado === 'string' ? [esperado, true] : [esperado.source, false], { timeout });
const captura = async (pagina, nombre) => { if (CAPTURAS) { fs.mkdirSync(CAPTURAS, { recursive: true });
  await pagina.locator('#perfilPush').scrollIntoViewIfNeeded(); await pagina.screenshot({ path: path.join(CAPTURAS, nombre) }); } };

async function conNavegador(fn) {
  const local = await arrancarWorkerLocal({ raiz: path.join(RAIZ, 'rwadar-site'), puerto: 0, conSesion: true, responder });
  const navegador = await playwright.chromium.launch();
  try { await fn(local, navegador); }
  finally {
    fallos = {};
    for (const soltar of colgadas.splice(0)) soltar();
    await navegador.close();
    await local.cerrar();
  }
}

test('en Chromium: si la base falla al comprobar (500, sin red, sin respuesta), se dice y «Reintentar» lo arregla; nunca «Comprobando…» para siempre', { skip: sinNavegador, timeout: 240000 }, async () => {
  await conNavegador(async (local, navegador) => {
    // 1. «Avisos de novedades» da 500: antes, el bloque se quedaba en «Comprobando…».
    fallos = { '/rpc/estado_mis_avisos': '500' };
    {
      const { contexto, pagina, errores } = await abrir(navegador, local);
      await esperarTexto(pagina, TEXTO.error);
      const e = await verPush(pagina);
      assert.deepEqual({ ...e, novedades: undefined }, { texto: TEXTO.error, rol: 'alert', activar: 'oculto', reintentar: 'listo', entrar: 'oculto', novedades: undefined });
      assert.equal(e.novedades, 'No se ha podido comprobar tu preferencia. Recarga la página para reintentarlo.');
      await captura(pagina, 'notificaciones-error-390.png');
      // La base vuelve: «Reintentar» pregunta otra vez y deja activarlas.
      fallos = {};
      await pagina.click('#perfilPushReintentar');
      await esperarTexto(pagina, TEXTO.disponible);
      assert.deepEqual(await verPush(pagina).then(x => [x.activar, x.reintentar, x.rol]), ['listo', 'oculto', 'status']);
      assert.equal((await verPush(pagina)).novedades, 'Activados. Puedes desactivarlos cuando quieras.');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // 2. Sin red al preguntar si este móvil ya está dado de alta (permiso dado y suscrito).
    fallos = { '/rpc/mi_aviso_webpush_registrado': 'red' };
    {
      const { contexto, pagina, errores } = await abrir(navegador, local, { cfg: { permiso: 'granted', suscrito: true } });
      await esperarTexto(pagina, TEXTO.error);
      assert.equal((await verPush(pagina)).reintentar, 'listo');
      fallos = {};
      await pagina.click('#perfilPushReintentar');
      await esperarTexto(pagina, TEXTO.activas);
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // 3. La base no contesta nunca: en el plazo (15 s) deja de decir «Comprobando…».
    fallos = { '/rpc/estado_mis_avisos': 'colgada' };
    {
      const inicio = Date.now();
      const { contexto, pagina, errores } = await abrir(navegador, local);
      await esperarTexto(pagina, TEXTO.comprobando, 10000);
      await esperarTexto(pagina, TEXTO.error, 30000);
      const tardo = Date.now() - inicio;
      assert.ok(tardo > 12000 && tardo < 30000, 'el plazo es de unos 15 s: ' + tardo + ' ms');
      assert.equal((await verPush(pagina)).reintentar, 'listo');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // 4. Sin la clave al entrar (500) se deja intentar; al activar, si sigue fallando, se dice por qué.
    fallos = { '/rpc/clave_publica_webpush': '500' };
    {
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local);
      await esperarTexto(pagina, TEXTO.disponible);
      await pagina.click('#perfilPushActivar');
      await esperarTexto(pagina, TEXTO.red);
      const e = await verPush(pagina);
      assert.deepEqual([e.activar, e.rol], ['listo', 'alert'], 'se puede volver a intentar');
      assert.equal((await rastro()).some(x => x[0] === 'subscribe'), false, 'sin clave no se suscribe');
      fallos = {};
      await pagina.click('#perfilPushActivar');
      await esperarTexto(pagina, TEXTO.activadas);
      assert.deepEqual(errores, []);
      await contexto.close();
    }
  });
});

test('en Chromium: sin sesión, «Tu sesión ha caducado: vuelve a entrar» con su botón; con el 401 de hoy, la web lleva a entrar', { skip: sinNavegador, timeout: 240000 }, async () => {
  await conNavegador(async (local, navegador) => {
    // El puente no salta solo a /acceso: se ve el aviso y el botón, que sí lleva.
    for (const como of ['sin-estado', '401']) {
      const { contexto, pagina, errores, visitas } = await abrir(navegador, local, { cfg: { sinSesion: { '/rpc/estado_mis_avisos': como } } });
      await esperarTexto(pagina, TEXTO.sesion);
      const e = await verPush(pagina);
      assert.deepEqual([e.activar, e.reintentar, e.entrar, e.rol], ['oculto', 'oculto', 'listo', 'alert'], como);
      assert.equal(e.novedades, TEXTO.sesion, como + ': también junto a «Avisos de novedades»');
      if (como === 'sin-estado') await captura(pagina, 'notificaciones-sesion-caducada-390.png');
      await Promise.all([pagina.waitForURL(/\/acceso\?volver=%2F$/, { timeout: 15000 }), pagina.click('#perfilPushEntrar')]);
      assert.ok(visitas.includes(ORIGEN + '/acceso?volver=%2F'), como + ': «Entrar de nuevo» lleva a entrar y vuelve aquí');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // Al activar: la clave dice «sin sesión».
    {
      const { contexto, pagina, errores } = await abrir(navegador, local);
      await esperarTexto(pagina, TEXTO.disponible);
      await pagina.evaluate(() => { window.__sinSesion['/rpc/clave_publica_webpush'] = '401'; });
      await pagina.click('#perfilPushActivar');
      await esperarTexto(pagina, TEXTO.sesionActivar);
      assert.deepEqual(await verPush(pagina).then(x => [x.activar, x.entrar]), ['oculto', 'listo']);
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // Con el puente de hoy, un 401 de la base no deja la página esperando: lleva a /acceso (y de ahí, de vuelta).
    // Si el puente dejara de saltar solo (la sesión la lleva otro cambio), vale el aviso con su botón.
    fallos = { '/rpc/estado_mis_avisos': 'una-401' };
    {
      const { contexto, pagina, visitas } = await abrir(navegador, local, { soloCargar: true });
      const fin = Date.now() + 15000;
      let aviso = '';
      while (!visitas.some(u => u.startsWith(ORIGEN + '/acceso?volver=')) && aviso !== TEXTO.sesion && Date.now() < fin) {
        await pagina.waitForTimeout(200);
        aviso = await pagina.evaluate(() => document.getElementById('perfilPushEstado')?.textContent || '').catch(() => '');
      }
      assert.ok(visitas.includes(ORIGEN + '/acceso?volver=%2F') || aviso === TEXTO.sesion, 'va a entrar: ' + visitas.join(' → '));
      await contexto.close();
    }
  });
});

test('en Chromium: al activar, el motivo en llano (permiso, navegador, iPhone fuera de la pantalla de inicio, red) y se puede reintentar; también en inglés', { skip: sinNavegador, timeout: 240000 }, async () => {
  await conNavegador(async (local, navegador) => {
    const casos = [
      { nombre: 'permiso cerrado sin contestar', cfg: { respuesta: 'default' }, espera: TEXTO.sinPermiso, activar: 'listo' },
      { nombre: 'permiso denegado', cfg: { respuesta: 'denied' }, espera: TEXTO.denegado, activar: 'oculto' },
      { nombre: 'el navegador no deja suscribirse', cfg: { suscribir: 'NotAllowedError' }, espera: TEXTO.navegador, activar: 'listo' },
      { nombre: 'el servicio de push falla', cfg: { suscribir: 'AbortError' }, espera: TEXTO.red, activar: 'listo' },
      { nombre: 'iPhone fuera de la pantalla de inicio', dispositivo: 'iPhone 13', cfg: { standalone: true, suscribir: 'ios' }, espera: TEXTO.ios, activar: 'oculto' },
      { nombre: 'sin red al registrar', cfg: {}, falla: { '/rpc/registrar_aviso_webpush': 'red' }, espera: TEXTO.red, activar: 'listo' },
      { nombre: 'la base falla al registrar', cfg: {}, falla: { '/rpc/registrar_aviso_webpush': '500' }, espera: TEXTO.red, activar: 'listo' },
    ];
    for (const caso of casos) {
      fallos = {};
      const { contexto, pagina, errores, rastro } = await abrir(navegador, local, { dispositivo: caso.dispositivo, cfg: caso.cfg });
      await esperarTexto(pagina, TEXTO.disponible);
      fallos = { ...(caso.falla || {}) };
      await pagina.click('#perfilPushActivar');
      await esperarTexto(pagina, caso.espera);
      const e = await verPush(pagina);
      assert.equal(e.activar, caso.activar, caso.nombre);
      assert.equal(e.entrar, 'oculto', caso.nombre);
      if (caso.falla) {
        // Lo que no quedó registrado en la base no se queda suscrito en el navegador.
        assert.ok((await rastro()).some(x => x[0] === 'unsubscribe'), caso.nombre + ': se deshace la suscripción');
        fallos = {};
        await pagina.click('#perfilPushActivar');
        await esperarTexto(pagina, TEXTO.activadas);
      }
      if (caso.nombre === 'el navegador no deja suscribirse') await captura(pagina, 'notificaciones-activar-navegador-390.png');
      assert.deepEqual(errores, [], caso.nombre);
      await contexto.close();
    }
    // En inglés: el aviso del fallo y el botón.
    fallos = { '/rpc/estado_mis_avisos': '500' };
    {
      const { contexto, pagina, errores } = await abrir(navegador, local, { idioma: 'en' });
      await esperarTexto(pagina, 'We could not check notifications on this phone. Check your connection and tap Try again.');
      assert.equal(await pagina.textContent('#perfilPushReintentar'), 'Try again');
      await captura(pagina, 'notificaciones-error-en-390.png');
      assert.deepEqual(errores, []);
      await contexto.close();
    }
    // En inglés también la información básica, sin el nombre y con sus dos enlaces.
    fallos = {};
    {
      const { contexto, pagina } = await abrir(navegador, local, { idioma: 'en' });
      await pagina.waitForFunction(() => /^Basic information about your data\. Controller: the owner of RWAdar, identified in the legal notice\. Data:/
        .test(document.getElementById('perfilNovedadesDatos').textContent), null, { timeout: 10000 });
      const info = await pagina.evaluate(() => { const p = document.getElementById('perfilNovedadesDatos');
        return { texto: p.textContent, enlaces: [...p.querySelectorAll('a')].map(a => [a.textContent, a.getAttribute('href')]) }; });
      const { INFO_BASICA_EN } = require('../rwadar-movil/lib/avisos-cuenta.js');
      assert.equal(info.texto, INFO_BASICA_EN);
      assert.deepEqual(info.enlaces, [['legal notice', '/privacidad#aviso-legal'], ['Privacy', '/privacidad']]);
      await contexto.close();
    }
  });
});
