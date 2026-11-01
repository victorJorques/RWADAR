import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAccesoServidor } from './servidor.mjs';

const ORIGIN = 'https://rwadar.pages.dev';
const UID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.prueba';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const CAPTCHA = 'XXXX.DUMMY.TOKEN.XXXX';

// Auth answers with `respuestaToken` to password logins; everything else succeeds.
function entorno({ respuestaToken = () => Response.json({ access_token: TOKEN }) } = {}) {
  let reloj = Date.parse('2026-11-01T10:00:00Z');
  const calls = [];
  const server = crearAccesoServidor({ ahora: () => reloj, fetchImpl: async (url, init) => {
    calls.push({ url, body: init.body ? JSON.parse(init.body) : null });
    if (url.includes('/token?')) return respuestaToken(JSON.parse(init.body));
    if (url.includes('/auth/v1/user')) return Response.json({ id: UID, email: 'cuenta@ejemplo.test', email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false });
    if (url.includes('/mi_perfil?')) return Response.json([{ id: UID }]);
    return Response.json({});
  } });
  async function run(accion, data, { ip = '203.0.113.7', cookie } = {}) {
    const headers = { origin: ORIGIN, 'content-type': 'application/json', accept: 'application/json' };
    if (ip) headers['cf-connecting-ip'] = ip;
    if (cookie) headers.cookie = '__Host-rwadar-acceso=' + cookie;
    return server.atender({ env: ENV, request: new Request(ORIGIN + '/api/acceso/' + accion,
      { method: 'POST', headers, body: JSON.stringify(data) }), next: async () => new Response('') });
  }
  const aAuth = patron => calls.filter(c => patron.test(c.url)).length;
  return { run, calls, aAuth, avanzar: segundos => { reloj += segundos * 1000; } };
}
const claveIncorrecta = () => Response.json({ code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, { status: 400 });
const entrarMal = (e, n, ip) => e.run('entrar', { correo: `persona${n}@ejemplo.test`, clave: 'mala' }, { ip });

test('sin testigo anti-robots, Auth recibe exactamente lo mismo que antes', async () => {
  const e = entorno();
  assert.equal((await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave' })).status, 200);
  assert.equal((await e.run('registrar', { correo: 'nueva@ejemplo.test', clave: 'clave-de-doce!', aceptaCondiciones: true, nombre: 'Ana' })).status, 200);
  assert.equal((await e.run('recuperar', { correo: 'cuenta@ejemplo.test' })).status, 200);
  assert.equal((await e.run('reenviar', { correo: 'nueva@ejemplo.test' })).status, 200);
  assert.equal((await e.run('reautenticar', { clave: 'una-clave' }, { cookie: TOKEN })).status, 200);
  assert.deepEqual(e.calls.filter(c => c.body).map(c => c.body), [
    { email: 'cuenta@ejemplo.test', password: 'una-clave' },
    { email: 'nueva@ejemplo.test', password: 'clave-de-doce!', data: { nombre: 'Ana' } },
    { email: 'cuenta@ejemplo.test' },
    { email: 'nueva@ejemplo.test', type: 'signup' },
    { email: 'cuenta@ejemplo.test', password: 'una-clave' },
  ]);
});

test('el testigo anti-robots llega a Auth en entrar, alta, correos y reautenticación', async () => {
  const e = entorno();
  await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave', captcha: CAPTCHA });
  await e.run('registrar', { correo: 'nueva@ejemplo.test', clave: 'clave-de-doce!', aceptaCondiciones: true, captcha: CAPTCHA });
  await e.run('recuperar', { correo: 'cuenta@ejemplo.test', captcha: CAPTCHA });
  await e.run('reenviar', { correo: 'nueva@ejemplo.test', captcha: CAPTCHA });
  assert.equal((await e.run('reautenticar', { clave: 'una-clave', captcha: CAPTCHA }, { cookie: TOKEN })).status, 200);
  const conTestigo = e.calls.filter(c => c.body?.gotrue_meta_security);
  assert.equal(conTestigo.length, 5);
  assert.ok(conTestigo.every(c => c.body.gotrue_meta_security.captcha_token === CAPTCHA &&
    Object.keys(c.body.gotrue_meta_security).length === 1));
});

test('un testigo malformado se rechaza sin consultar Auth ni gastar cupo', async () => {
  const e = entorno();
  for (const captcha of ['', 'con espacio', 'x'.repeat(2049), 'salto\nde-linea', 42, null, {}, ['a']]) {
    const response = await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave', captcha });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'solicitud_invalida');
  }
  assert.equal(e.calls.length, 0);
});

test('si Auth rechaza el anti-robots se dice claramente', async () => {
  const e = entorno({ respuestaToken: () =>
    Response.json({ code: 400, error_code: 'captcha_failed', msg: 'captcha protection: request disallowed' }, { status: 400 }) });
  const response = await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave', captcha: CAPTCHA });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'captcha_fallido' });
});

test('una clave mal escrita sigue respondiendo como siempre, sin pistas de Auth', async () => {
  const e = entorno({ respuestaToken: claveIncorrecta });
  const response = await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'mala' });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'sesion_necesaria' });
});

test('un mismo visitante no puede agotar el cupo compartido de Auth', async () => {
  const e = entorno({ respuestaToken: claveIncorrecta });
  for (let i = 0; i < 30; i++) assert.equal((await entrarMal(e, i)).status, 401);
  const frenada = await entrarMal(e, 99);
  assert.equal(frenada.status, 429);
  assert.deepEqual(await frenada.json(), { error: 'intentos_excedidos' });
  assert.equal(frenada.headers.get('retry-after'), '600');
  assert.equal(e.aAuth(/\/token\?/), 30, 'la petición frenada no llega a Auth');
  assert.equal((await entrarMal(e, 99, '203.0.113.8')).status, 401, 'otro visitante entra con normalidad');
  e.avanzar(601);
  assert.equal((await entrarMal(e, 99)).status, 401);
});

test('cambiar de dirección dentro del mismo bloque IPv6 /64 no reinicia el cupo', async () => {
  const e = entorno({ respuestaToken: claveIncorrecta });
  for (let i = 0; i < 30; i++) {
    assert.equal((await entrarMal(e, i, `2001:db8:abcd:12:${i.toString(16)}:0:0:1`)).status, 401);
  }
  assert.equal((await entrarMal(e, 99, '2001:DB8:ABCD:0012::ffff')).status, 429);
  assert.equal((await entrarMal(e, 99, '2001:db8:abcd:13::1')).status, 401, 'otro /64 es otro visitante');
});

test('una IPv4 escrita como IPv6 cuenta como la misma IPv4', async () => {
  const e = entorno({ respuestaToken: claveIncorrecta });
  for (let i = 0; i < 30; i++) await entrarMal(e, i, i % 2 ? '198.51.100.4' : '::ffff:198.51.100.4');
  assert.equal((await entrarMal(e, 99, '198.51.100.4')).status, 429);
});

test('nadie puede bloquear la entrada de otra persona probando claves de su correo', async () => {
  const e = entorno({ respuestaToken: body => body.password === 'la-buena' ? Response.json({ access_token: TOKEN }) : claveIncorrecta() });
  for (let i = 0; i < 60; i++) {
    await e.run('entrar', { correo: 'victima@ejemplo.test', clave: 'mala' }, { ip: '192.0.2.' + i });
  }
  for (let i = 0; i < 12; i++) {
    await e.run('entrar', { correo: 'victima@ejemplo.test', clave: 'mala' }, { ip: '2001:db8:1:' + i + '::1' });
  }
  const victima = await e.run('entrar', { correo: 'victima@ejemplo.test', clave: 'la-buena' }, { ip: '203.0.113.50' });
  assert.equal(victima.status, 200);
  // Tampoco se le bloquea la recuperación desde la web.
  assert.equal((await e.run('recuperar', { correo: 'victima@ejemplo.test' }, { ip: '203.0.113.50' })).status, 200);
});

test('los correos de alta, recuperación y reenvío tienen su propio cupo por visitante', async () => {
  const e = entorno();
  const acciones = ['registrar', 'recuperar', 'reenviar', 'recuperar', 'registrar'];
  for (const [i, accion] of acciones.entries()) {
    const data = { correo: `envio${i}@ejemplo.test`, clave: 'clave-de-doce!', aceptaCondiciones: true };
    assert.equal((await e.run(accion, data, { ip: '203.0.113.20' })).status, 200);
  }
  const frenada = await e.run('reenviar', { correo: 'otra@ejemplo.test' }, { ip: '203.0.113.20' });
  assert.equal(frenada.status, 429);
  assert.equal(frenada.headers.get('retry-after'), '3600');
  assert.equal(e.aAuth(/\/(signup|recover|resend)\?/), 5, 'solo los permitidos piden un correo a Auth');
  // El cupo de correos no gasta el de entrar.
  assert.equal((await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave' }, { ip: '203.0.113.20' })).status, 200);
});

test('los datos mal escritos no llegan a Auth ni gastan cupo', async () => {
  const e = entorno();
  for (let i = 0; i < 40; i++) {
    const response = await e.run('entrar', { correo: 'no-es-un-correo', clave: 'una-clave' });
    assert.equal((await response.json()).error, 'correo_invalido');
  }
  assert.equal((await e.run('entrar', { correo: 'cuenta@ejemplo.test', clave: 'una-clave' })).status, 200);
  assert.equal(e.aAuth(/\/token\?/), 1);
});

test('muchos intentos simultáneos de un visitante no se cuelan a la vez', async () => {
  const pendientes = [];
  const e = entorno({ respuestaToken: () => new Promise(fin => pendientes.push(fin)) });
  let frenadas = 0;
  const intentos = Array.from({ length: 45 }, (_, i) => entrarMal(e, i).then(r => { if (r.status === 429) frenadas++; return r; }));
  // Each request is either waiting on Auth or already answered with 429.
  for (let vuelta = 0; pendientes.length + frenadas < 45 && vuelta < 10000; vuelta++) await new Promise(fin => setImmediate(fin));
  assert.equal(pendientes.length, 30, 'solo treinta llegan a Auth');
  for (const fin of pendientes) fin(claveIncorrecta());
  const estados = (await Promise.all(intentos)).map(r => r.status);
  assert.equal(estados.filter(s => s === 401).length, 30);
  assert.equal(estados.filter(s => s === 429).length, 15);
});

test('sin IP del visitante (ensayo local) o con una IP inventada no se crea un cupo común', async () => {
  const e = entorno({ respuestaToken: claveIncorrecta });
  for (const ip of ['', 'no-es-una-ip <script>', '1:2:3:4:5:6:7:8:9', '999']) {
    for (let i = 0; i < 35; i++) assert.equal((await entrarMal(e, i, ip)).status, 401);
  }
});
