// Sesión que se mantiene (12/11/2026), en el navegador: la casilla «Mantener la
// sesión iniciada en este dispositivo» de /acceso y lo que guarda Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const FUENTES = path.join(RAIZ, 'rwadar-site');
const html = fs.readFileSync(path.join(FUENTES, 'acceso.html'), 'utf8');
const script = fs.readFileSync(path.join(FUENTES, 'assets', 'acceso.js'), 'utf8');
const UID = '00000000-0000-4000-8000-00000000c0de';

/* /acceso con un DOM mínimo sacado de su HTML (como cierre-pendiente). */
function formulario() {
  const elementos = new Map(), botones = [], peticiones = [], destinos = [];
  for (const [, tag, atributos] of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)) {
    const id = atributos.match(/\bid="([^"]+)"/)?.[1];
    const vista = atributos.match(/\bdata-vista="([^"]+)"/)?.[1];
    if (!id && !vista) continue;
    const elemento = { value: '', checked: /\bchecked\b/.test(atributos), disabled: false, textContent: '',
      hidden: /\bhidden\b/.test(atributos), dataset: { vista }, eventos: {},
      addEventListener(tipo, ejecutar) { this.eventos[tipo] = ejecutar; },
      reportValidity() { return true; }, focus() {}, closest: () => null };
    if (id) elementos.set(id, elemento);
    if (tag === 'button' && vista) botones.push(elemento);
  }
  const context = vm.createContext({
    document: { getElementById: id => elementos.get(id), querySelectorAll: () => botones, documentElement: { lang: 'es' } },
    sessionStorage: { getItem: () => null, removeItem() {} },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    location: { origin: 'https://rwadar.pages.dev', pathname: '/acceso', search: '', hash: '', replace: ruta => destinos.push(ruta) },
    history: { replaceState() {} }, URL, URLSearchParams, AbortController, setTimeout: () => 0, clearTimeout() {},
    fetch: async (ruta, opciones) => {
      peticiones.push({ ruta, cuerpo: opciones.body ? JSON.parse(opciones.body) : null });
      if (ruta.endsWith('/sesion')) return Response.json({ autenticada: true, usuario: { id: UID } });
      return Response.json(ruta.endsWith('/entrar') ? { autenticada: true, usuario: { id: UID } } : { mensaje: 'Revisa tu correo.' });
    },
  });
  vm.runInContext(script, context);
  const el = id => elementos.get(id);
  return { el, peticiones, destinos,
    vista: v => botones.find(b => b.dataset.vista === v).eventos.click(),
    enviar: () => { el('correo').value = 'cuenta@example.test'; el('clave').value = 'clave-de-prueba-larga'; el('condiciones').checked = true;
      return el('formulario').eventos.submit({ preventDefault() {} }); } };
}

test('/acceso: la casilla sale sin marcar en «Entrar» y manda mantener solo como booleano', async () => {
  for (const marcada of [false, true]) {
    const f = formulario();
    assert.equal(f.el('campo-mantener').hidden, false, 'se ve en «Entrar»');
    assert.equal(f.el('mantener').checked, false, 'sin marcar');
    f.el('mantener').checked = marcada;
    await f.enviar();
    assert.deepEqual(f.peticiones.map(p => p.ruta), ['/api/acceso/entrar', '/api/acceso/sesion']);
    assert.equal(f.peticiones[0].cuerpo.mantener, marcada);
    assert.deepEqual(f.destinos, ['/']);
  }
});

test('/acceso: al cambiar de vista la casilla se esconde, se desmarca y el alta no la manda', async () => {
  const f = formulario();
  f.el('mantener').checked = true;
  f.vista('registrar');
  assert.equal(f.el('campo-mantener').hidden, true); assert.equal(f.el('mantener').checked, false);
  await f.enviar();
  assert.equal(f.peticiones[0].ruta, '/api/acceso/registrar');
  assert.equal(Object.hasOwn(f.peticiones[0].cuerpo, 'mantener'), false);
  for (const otra of ['recuperar', 'reenviar']) { f.vista(otra); assert.equal(f.el('campo-mantener').hidden, true); }
  f.el('mantener').checked = true;
  f.vista('entrar');
  assert.equal(f.el('campo-mantener').hidden, false); assert.equal(f.el('mantener').checked, false, 'vuelve sin marcar');
});

/* ---- Chromium con el worker local compilado desde las fuentes ---- */
function cargarPlaywright() {
  for (const intento of [() => require('playwright'),
    () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  return null;
}
const playwright = cargarPlaywright();
const sinNavegador = playwright ? false : 'Playwright no está instalado (en CI no lo está): se omite la prueba en Chromium';

test('en Chromium: con la casilla, las cookies sobreviven a cerrar el navegador y el pase se renueva; sin ella, no', { skip: sinNavegador, timeout: 180000 }, async () => {
  const { arrancarWorkerLocal, CORREO_PRUEBA, CLAVE_PRUEBA, TOKEN_PRUEBA } = await import('./probar-worker-local.mjs');
  // Supabase simulado con refresh_token que rotan (el arnés base no los da).
  const vigentes = new Set(); let n = 0;
  const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
  const sesionNueva = () => { const r = 'local' + String(++n).padStart(7, '0'); vigentes.add(r); return { access_token: TOKEN_PRUEBA, token_type: 'bearer', expires_in: 3600, refresh_token: r }; };
  const responder = async (url, init) => {
    if (url.pathname !== '/auth/v1/token') return null;
    const cuerpo = JSON.parse(init.body);
    if (url.searchParams.get('grant_type') === 'password') return cuerpo.email === CORREO_PRUEBA && cuerpo.password === CLAVE_PRUEBA ? json(sesionNueva()) : json({ error_code: 'invalid_credentials' }, 400);
    if (!vigentes.delete(cuerpo.refresh_token)) return json({ error_code: 'refresh_token_not_found' }, 400);
    return json(sesionNueva());
  };
  const local = await arrancarWorkerLocal({ raiz: FUENTES, puerto: 0, responder });
  // localhost: Chromium solo guarda las cookies __Host- (Secure) en http si el origen es localhost.
  const base = local.url.replace('127.0.0.1', 'localhost');
  let browser;
  try {
    browser = await playwright.chromium.launch();
    const nuevo = async (cookies = []) => {
      const contexto = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: { cookies, origins: [] } });
      const page = await contexto.newPage();
      await page.route(u => !u.href.startsWith(base), r => r.abort());
      return { contexto, page };
    };
    const nuestras = async contexto => Object.fromEntries((await contexto.cookies(base)).filter(c => c.name.startsWith('__Host-rwadar-')).map(c => [c.name, c]));
    // «Cerrar el navegador»: solo quedan las cookies con caducidad.
    const reabrir = async contexto => { const guardadas = (await contexto.cookies()).filter(c => c.expires > 0); await contexto.close(); return nuevo(guardadas); };
    // Se pregunta desde /privacidad, una página pública que no salta a otra:
    // desde /acceso, con sesión, la página podía irse mientras se preguntaba
    // («Execution context was destroyed»).
    const sesion = async page => {
      await page.goto(base + '/privacidad');
      return page.evaluate(() => fetch('/api/acceso/sesion', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.status));
    };
    for (const marcada of [true, false]) {
      const { contexto, page } = await nuevo();
      await page.goto(base + '/acceso?volver=/privacidad');
      assert.equal(await page.locator('#mantener').isChecked(), false, 'sale sin marcar');
      assert.equal(await page.locator('#campo-mantener').isVisible(), true);
      if (marcada) await page.locator('#mantener').check();
      await page.fill('#correo', CORREO_PRUEBA); await page.fill('#clave', CLAVE_PRUEBA);
      const antes = Date.now() / 1000;
      await page.click('#enviar');
      // Por la ruta y no por la cadena: «/acceso?volver=/privacidad» también
      // acaba en «/privacidad» y no esperaba al login (fallaba a ratos).
      await page.waitForURL(u => u.pathname === '/privacidad', { timeout: 15000 });
      const c = await nuestras(contexto);
      assert.deepEqual(Object.keys(c).sort(), ['__Host-rwadar-acceso', '__Host-rwadar-renovar']);
      for (const cookie of Object.values(c)) {
        assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true); assert.equal(cookie.sameSite, 'Lax'); assert.equal(cookie.path, '/');
      }
      assert.equal(await page.evaluate(() => document.cookie.includes('rwadar')), false, 'el JavaScript de la página no las ve');
      if (marcada) {
        assert.ok(Math.abs(c['__Host-rwadar-acceso'].expires - (antes + 3600)) < 60, 'el pase, una hora');
        assert.ok(Math.abs(c['__Host-rwadar-renovar'].expires - (antes + 30 * 24 * 3600)) < 60, 'la de renovar, 30 días');
      } else {
        assert.equal(c['__Host-rwadar-acceso'].expires, -1); assert.equal(c['__Host-rwadar-renovar'].expires, -1);
      }
      const otra = await reabrir(contexto);
      assert.equal(await sesion(otra.page), marcada ? 200 : 401, marcada ? 'sigue dentro tras cerrar' : 'sin la casilla, fuera');
      if (marcada) {
        // Pase caducado (el navegador ya no lo manda): la siguiente petición lo renueva sola.
        const renovarAntes = (await nuestras(otra.contexto))['__Host-rwadar-renovar'].value;
        await otra.contexto.clearCookies({ name: '__Host-rwadar-acceso' });
        assert.equal(await sesion(otra.page), 200);
        const tras = await nuestras(otra.contexto);
        assert.ok(tras['__Host-rwadar-acceso'], 'pase nuevo');
        assert.notEqual(tras['__Host-rwadar-renovar'].value, renovarAntes, 'refresh_token nuevo');
        assert.match(tras['__Host-rwadar-renovar'].value, /^p\./);
        // Salir borra las dos.
        const salida = await otra.page.evaluate(() => fetch('/api/acceso/salir', { method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json()));
        assert.deepEqual(salida, { cerrado: true, cierreRemoto: true });
        assert.deepEqual(await nuestras(otra.contexto), {});
      }
      await otra.contexto.close();
    }
    assert.ok(local.peticionesSupabase.some(p => p.ruta === '/auth/v1/token?grant_type=refresh_token'));
    assert.ok(local.peticionesSupabase.some(p => p.ruta === '/auth/v1/logout?scope=local'));
  } finally {
    await browser?.close();
    await local.cerrar();
  }
});
