// Avisos de novedades en el servidor (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md):
// la casilla del alta, las tres RPC de la pasarela y la baja sin cuenta.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { crearAccesoServidor } from './servidor.mjs';

const ORIGIN = 'https://rwadar.pages.dev';
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.prueba';
const BAJA = '5f1d3c2b-9a8e-4f7d-8c6b-5a4e3d2c1b0a';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const MENSAJE = 'Si el enlace era válido, ya no recibirás avisos de novedades.';

// avisosNovedades: el interruptor AVISOS_CASILLA_ALTA del servidor. Sin
// pasarlo, el de servidor.mjs (hoy apagado); true lo enciende solo en la prueba.
function entorno({ rpcBaja = () => Response.json(true), avisosNovedades } = {}) {
  let reloj = Date.parse('2026-11-05T10:00:00Z');
  const calls = [];
  const server = crearAccesoServidor({ ahora: () => reloj, ...(avisosNovedades === undefined ? {} : { avisosNovedades }), fetchImpl: async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });
    if (url.includes('/rpc/baja_avisos')) return rpcBaja();
    if (url.includes('/auth/v1/user')) return Response.json({ id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false });
    if (url.includes('/mi_perfil?')) return Response.json([{ id: UID }]);
    return Response.json({ ok: 'rpc' });
  } });
  async function run(accion, data, { ip = '203.0.113.9', cookie, origin = ORIGIN, tipo = 'application/json', method = 'POST', crudo } = {}) {
    const headers = { origin, 'content-type': tipo, accept: 'application/json' };
    if (ip) headers['cf-connecting-ip'] = ip;
    if (cookie) headers.cookie = '__Host-rwadar-acceso=' + cookie;
    return server.atender({ env: ENV, request: new Request(ORIGIN + '/api/acceso/' + accion,
      { method, headers, ...(method === 'POST' ? { body: crudo ?? JSON.stringify(data) } : {}) }), next: async () => new Response('ASSETS') });
  }
  return { run, calls, avanzar: segundos => { reloj += segundos * 1000; } };
}
const alta = extra => ({ correo: 'nueva@ejemplo.test', clave: 'clave-de-doce!', aceptaCondiciones: true, nombre: 'Ana', ...extra });

const SIGNUP_SIN_AVISOS = { email: 'nueva@ejemplo.test', password: 'clave-de-doce!', data: { nombre: 'Ana' } };
const signup = e => e.calls.find(c => c.url.includes('/auth/v1/signup')).body;
const ENCENDIDO_Y_APAGADO = [['apagado', false], ['encendido', true]];

// Versión v2 de la casilla (revisión legal del 06/11/2026).
const VERSION = 'novedades-v2-2026-11-06';

test('la versión de la casilla es la de la revisión legal y su interruptor propio nace apagado, como en /acceso', () => {
  assert.deepEqual(crearAccesoServidor().avisosNovedades, { activos: false, version: VERSION });
  assert.deepEqual(crearAccesoServidor({ avisosNovedades: true }).avisosNovedades, { activos: true, version: VERSION });
  for (const valor of ['true', 1, null]) assert.throws(() => crearAccesoServidor({ avisosNovedades: valor }), /avisos_invalidos/);
  // La casilla del alta: mismo nombre y valor que en /acceso (se encienden juntos). Perfil › Avisos
  // (AVISOS_NOVEDADES_REMOTOS de la web) ya está encendido desde el 12/11/2026 y no la enciende.
  const leer = ruta => fs.readFileSync(new URL(ruta, import.meta.url), 'utf8');
  const servidor = leer('./servidor.mjs');
  assert.match(servidor, /^const AVISOS_CASILLA_ALTA = false;$/m);
  assert.doesNotMatch(servidor, /AVISOS_NOVEDADES_REMOTOS =/);
  assert.doesNotMatch(servidor, /\bexport\s+(?:const|let|var)\b/, 'el servidor no exporta constantes (rompen el worker)');
  assert.match(leer('../rwadar-site/assets/acceso.js'), /const AVISOS_CASILLA_ALTA = false;/);
  assert.doesNotMatch(leer('../rwadar-site/assets/acceso.js'), /const AVISOS_NOVEDADES_REMOTOS/);
  assert.match(leer('../rwadar-site/assets/rwadar-20260820.js'), / const AVISOS_NOVEDADES_REMOTOS=true;/);
  assert.ok(leer('../rwadar-site/assets/rwadar-20260820.js').includes(" const VERSION_AVISOS_NOVEDADES='" + VERSION + "';"));
  assert.ok(servidor.includes("const VERSION_AVISOS_NOVEDADES = '" + VERSION + "';"));
  for (const html of ['../rwadar-site/acceso.html', '../rwadar-site/index.html']) {
    assert.ok(leer(html).includes(VERSION), html + ' cita la versión vigente');
    assert.doesNotMatch(leer(html), /novedades-v1-2026-11-05/, html + ' ya no cita la v1');
  }
});

test('con el interruptor apagado, una casilla marcada no llega a los metadatos del alta', async () => {
  for (const extra of [{ avisosNovedades: true }, { avisosNovedades: false }, {}]) {
    const e = entorno();
    const r = await e.run('registrar', alta(extra));
    assert.equal(r.status, 200, JSON.stringify(extra)); assert.equal((await r.json()).confirmarCorreo, true);
    assert.deepEqual(signup(e), SIGNUP_SIN_AVISOS, JSON.stringify(extra));
    assert.equal(JSON.stringify(e.calls).includes('avisos_'), false, 'ni versión ni canal');
    assert.equal(r.headers.get('set-cookie'), null);
  }
});

test('con el interruptor encendido y la casilla marcada, el alta lleva el permiso, su versión, el canal web y el idioma', async () => {
  // Sin idioma, el texto que se vio es el castellano.
  for (const [extra, idioma] of [[{}, 'es'], [{ idioma: 'es' }, 'es'], [{ idioma: 'en' }, 'en']]) {
    const e = entorno({ avisosNovedades: true });
    const r = await e.run('registrar', alta({ avisosNovedades: true, ...extra }));
    assert.equal(r.status, 200, JSON.stringify(extra)); assert.equal((await r.json()).confirmarCorreo, true);
    assert.deepEqual(signup(e), { email: 'nueva@ejemplo.test', password: 'clave-de-doce!',
      data: { nombre: 'Ana', avisos_novedades: true, avisos_version: VERSION, avisos_canal: 'web', avisos_idioma: idioma } },
    JSON.stringify(extra));
    assert.equal(r.headers.get('set-cookie'), null);
  }
});

test('el idioma solo viaja con la casilla marcada y el interruptor encendido', async () => {
  for (const [estado, avisosNovedades] of ENCENDIDO_Y_APAGADO) {
    for (const extra of [{ idioma: 'en' }, { idioma: 'es', avisosNovedades: false }, { idioma: 'en', avisosNovedades: false }]) {
      const e = entorno({ avisosNovedades });
      assert.equal((await e.run('registrar', alta(extra))).status, 200, estado + ' ' + JSON.stringify(extra));
      assert.deepEqual(signup(e), SIGNUP_SIN_AVISOS, estado + ' ' + JSON.stringify(extra));
    }
  }
  // Apagado, ni con la casilla marcada.
  const e = entorno();
  assert.equal((await e.run('registrar', alta({ avisosNovedades: true, idioma: 'en' }))).status, 200);
  assert.deepEqual(signup(e), SIGNUP_SIN_AVISOS);
});

test('el idioma solo admite «es» o «en» tal cual, con el interruptor apagado o encendido', async () => {
  for (const [estado, avisosNovedades] of ENCENDIDO_Y_APAGADO) {
    const e = entorno({ avisosNovedades });
    for (const valor of ['EN', 'Es', 'en-US', 'es-ES', 'fr', '', ' es', null, 1, true, {}, ['es']]) {
      for (const marcada of [true, false]) {
        const r = await e.run('registrar', alta({ avisosNovedades: marcada, idioma: valor }));
        assert.equal(r.status, 400, estado + ' ' + JSON.stringify(valor));
        assert.deepEqual(await r.json(), { error: 'solicitud_invalida' });
      }
    }
    assert.equal(e.calls.length, 0, estado + ': nada llega a Auth');
    // Estos rechazos tampoco gastan el límite de envíos de la IP.
    for (let i = 0; i < 10; i++) assert.equal((await e.run('registrar', alta({ correo: `i${i}@ejemplo.test` }))).status, 200, estado);
    assert.equal((await e.run('registrar', alta())).status, 429, estado);
  }
});

test('sin marcar la casilla, el alta es exactamente la de antes, con el interruptor apagado o encendido', async () => {
  for (const [estado, avisosNovedades] of ENCENDIDO_Y_APAGADO) {
    for (const extra of [{}, { avisosNovedades: false }]) {
      const e = entorno({ avisosNovedades });
      assert.equal((await e.run('registrar', alta(extra))).status, 200, estado);
      assert.deepEqual(signup(e), SIGNUP_SIN_AVISOS, estado + ' ' + JSON.stringify(extra));
    }
  }
});

test('la casilla solo admite un booleano y no sustituye a las condiciones, con el interruptor apagado o encendido', async () => {
  for (const [estado, avisosNovedades] of ENCENDIDO_Y_APAGADO) {
    const e = entorno({ avisosNovedades });
    for (const valor of ['true', 1, 0, null, {}, [], 'si']) {
      const r = await e.run('registrar', alta({ avisosNovedades: valor }));
      assert.equal(r.status, 400, estado + ' ' + JSON.stringify(valor));
      assert.deepEqual(await r.json(), { error: 'solicitud_invalida' });
    }
    const sinCondiciones = await e.run('registrar', { ...alta({ avisosNovedades: true }), aceptaCondiciones: undefined });
    assert.equal(sinCondiciones.status, 400); assert.deepEqual(await sinCondiciones.json(), { error: 'condiciones' });
    assert.equal(e.calls.length, 0, estado + ': nada llega a Auth');
    // Los rechazos de forma no gastan el límite de envíos de la IP.
    for (let i = 0; i < 10; i++) assert.equal((await e.run('registrar', alta({ correo: `n${i}@ejemplo.test` }))).status, 200, estado);
    assert.equal((await e.run('registrar', alta())).status, 429, estado);
  }
});

test('la pasarela admite las tres RPC de avisos, solo por POST y con la sesión de la cuenta', async () => {
  const e = entorno();
  for (const [ruta, cuerpo] of [['/rpc/estado_mis_avisos', {}], ['/rpc/configurar_avisos_novedades',
    { p_activar: true, p_version: VERSION, p_canal: 'web', p_idioma: 'es' }], ['/rpc/mis_avisos_recientes', { p_limite: 20 }]]) {
    const r = await e.run('datos', { ruta, metodo: 'POST', cuerpo }, { cookie: TOKEN });
    assert.equal(r.status, 200, ruta);
    const llamada = e.calls.at(-1);
    assert.equal(llamada.url, ENV.SUPABASE_URL + '/rest/v1' + ruta);
    assert.equal(llamada.init.method, 'POST'); assert.equal(llamada.init.headers.Authorization, 'Bearer ' + TOKEN);
    assert.deepEqual(llamada.body, cuerpo);
    assert.equal((await e.run('datos', { ruta, metodo: 'GET' }, { cookie: TOKEN })).status, 400, ruta + ' por GET');
  }
  // La baja no va por la pasarela, ni las RPC internas del esquema privado.
  for (const ruta of ['/rpc/baja_avisos', '/rpc/registrar_aviso_push', '/rpc/anunciar', '/rpc/publicar_anuncio']) {
    assert.equal((await e.run('datos', { ruta, metodo: 'POST', cuerpo: {} }, { cookie: TOKEN })).status, 400, ruta);
  }
  // Sin sesión, nada.
  assert.equal((await e.run('datos', { ruta: '/rpc/estado_mis_avisos', metodo: 'POST' })).status, 401);
});

test('la pasarela admite las cuatro RPC de las notificaciones en la web (contrato del 12/11/2026), solo por POST y con sesión', async () => {
  const e = entorno();
  const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/prueba-123';
  for (const [ruta, cuerpo] of [['/rpc/clave_publica_webpush', {}],
    ['/rpc/registrar_aviso_webpush', { p_endpoint: ENDPOINT, p_p256dh: 'BPrueba_p256dh-clave', p_auth: 'auth-prueba' }],
    ['/rpc/quitar_aviso_webpush', { p_endpoint: ENDPOINT }], ['/rpc/mi_aviso_webpush_registrado', { p_endpoint: ENDPOINT }]]) {
    const r = await e.run('datos', { ruta, metodo: 'POST', cuerpo }, { cookie: TOKEN });
    assert.equal(r.status, 200, ruta);
    const llamada = e.calls.at(-1);
    assert.equal(llamada.url, ENV.SUPABASE_URL + '/rest/v1' + ruta);
    assert.equal(llamada.init.method, 'POST'); assert.equal(llamada.init.headers.Authorization, 'Bearer ' + TOKEN);
    assert.deepEqual(llamada.body, cuerpo);
    assert.equal((await e.run('datos', { ruta, metodo: 'GET' }, { cookie: TOKEN })).status, 400, ruta + ' por GET');
    assert.equal((await e.run('datos', { ruta, metodo: 'POST', cuerpo })).status, 401, ruta + ' sin sesión');
  }
  // Ni parecidas ni las del envío, que solo usa el flujo con la clave privada.
  for (const ruta of ['/rpc/registrar_aviso_webpushx', '/rpc/clave_privada_webpush', '/rpc/enviar_webpush', '/rpc/webpush_pendientes']) {
    assert.equal((await e.run('datos', { ruta, metodo: 'POST', cuerpo: {} }, { cookie: TOKEN })).status, 400, ruta);
  }
});

test('la baja llama a baja_avisos con la clave publicable, sin la cookie de nadie, y responde siempre lo mismo', async () => {
  const cuerpos = [];
  for (const rpcBaja of [() => Response.json(true), () => Response.json(false), () => new Response(null, { status: 204 })]) {
    const e = entorno({ rpcBaja });
    const r = await e.run('baja', { token: BAJA }, { cookie: TOKEN });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
    assert.equal(r.headers.get('set-cookie'), null);
    cuerpos.push(await r.text());
    assert.equal(e.calls.length, 1);
    const [llamada] = e.calls;
    assert.equal(llamada.url, ENV.SUPABASE_URL + '/rest/v1/rpc/baja_avisos');
    assert.equal(llamada.init.method, 'POST');
    assert.equal(llamada.init.headers.apikey, ENV.SUPABASE_PUBLISHABLE_KEY);
    assert.equal(llamada.init.headers.Authorization, undefined, 'nunca con la sesión de quien abre el enlace');
    assert.deepEqual(llamada.body, { p_token: BAJA });
  }
  assert.deepEqual(new Set(cuerpos).size, 1, 'el mismo cuerpo exista o no el enlace');
  assert.deepEqual(JSON.parse(cuerpos[0]), { ok: true, mensaje: MENSAJE });
  // Un UUID en mayúsculas también es un UUID.
  assert.equal((await entorno().run('baja', { token: BAJA.toUpperCase() })).status, 200);
});

test('la baja rechaza formas, orígenes y métodos raros sin llamar a la base', async () => {
  const e = entorno();
  for (const data of [{}, { token: 'no-es-un-uuid' }, { token: 123 }, { token: null }, { token: BAJA + 'x' },
    { token: BAJA, otro: 1 }, { t: BAJA }, { token: [BAJA] }]) {
    const r = await e.run('baja', data);
    assert.equal(r.status, 400, JSON.stringify(data)); assert.deepEqual(await r.json(), { error: 'solicitud_invalida' });
  }
  assert.equal((await e.run('baja', null, { crudo: '[]' })).status, 400);
  assert.equal((await e.run('baja', { token: BAJA }, { tipo: 'text/plain' })).status, 400);
  assert.equal((await e.run('baja', { token: BAJA }, { origin: 'https://atacante.test' })).status, 403);
  assert.equal((await e.run('baja', null, { method: 'GET' })).status, 405);
  assert.equal(e.calls.length, 0);
});

test('la baja tiene su propio límite por IP, aparte del de los envíos', async () => {
  const e = entorno();
  for (let i = 0; i < 20; i++) assert.equal((await e.run('baja', { token: BAJA })).status, 200, 'baja ' + i);
  const tope = await e.run('baja', { token: BAJA });
  assert.equal(tope.status, 429); assert.ok(Number(tope.headers.get('retry-after')) > 0);
  assert.deepEqual(await tope.json(), { error: 'intentos_excedidos' });
  assert.equal(e.calls.length, 20, 'la petición sobre el límite no llega a la base');
  // Otra IP sigue pudiendo, y el alta de la misma IP no se ha gastado.
  assert.equal((await e.run('baja', { token: BAJA }, { ip: '198.51.100.4' })).status, 200);
  assert.equal((await e.run('registrar', alta())).status, 200);
  e.avanzar(600);
  assert.equal((await e.run('baja', { token: BAJA })).status, 200, 'al pasar la ventana se reabre');
});

test('si la base falla, la baja no se da por hecha ni se habla de sesión', async () => {
  for (const [rpcBaja, estado] of [
    [() => new Response('', { status: 503 }), 503], [() => new Response('', { status: 500 }), 503],
    [() => Response.json({ code: 'PGRST202' }, { status: 404 }), 503], [() => Response.json({}, { status: 401 }), 503],
    [() => Response.json({}, { status: 400 }), 503], [() => { throw new TypeError('fetch failed'); }, 503],
    [() => new Response(null, { status: 302, headers: { Location: 'https://ajeno.example.invalid' } }), 503],
    [() => new Response('', { status: 429, headers: { 'Retry-After': '30' } }), 429],
  ]) {
    const e = entorno({ rpcBaja });
    const r = await e.run('baja', { token: BAJA });
    assert.equal(r.status, estado);
    const cuerpo = await r.json();
    assert.notEqual(cuerpo.ok, true); assert.notEqual(cuerpo.error, 'sesion_necesaria');
    assert.ok(r.headers.get('retry-after'));
  }
});
