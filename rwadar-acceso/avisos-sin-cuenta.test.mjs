// /api/avisos/* · notificaciones sin cuenta (14/11/2026). Contrato:
// docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md. Sin red: Supabase es un doble.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearAccesoServidor } from './servidor.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://rwadar.pages.dev';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const VERSION = 'sin-cuenta-v1-2026-11-14';
const TEXTO_ES = 'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.';
const TEXTO_EN = "I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It's optional and doesn't need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.";
const CLAVE = 'B' + 'A'.repeat(85) + 'Q';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc:APA91bH-prueba_sin_cuenta';
const P256DH = 'B' + 'x'.repeat(85) + 'A';
const AUTH = 'a'.repeat(21) + 'Q';
const TOKEN = 'ExponentPushToken[sinCuentaPrueba123456]';
const ALTA_WEB = { accion: 'alta', endpoint: ENDPOINT, p256dh: P256DH, auth: AUTH, version: VERSION, idioma: 'es', origen: 'perfil' };
const ALTA_MOVIL = { accion: 'alta', token: TOKEN, plataforma: 'android', version: VERSION, idioma: 'en', origen: 'novedades' };
const TEXTO_BASE = { v: 1, activo: true, version: VERSION, texto_es: TEXTO_ES, texto_en: TEXTO_EN, clave_publica: CLAVE };
const AVISO = { id: '7', tipo: 'novedad', titulo: 'Avisos sin cuenta', texto: 'Ya puedes activarlos sin cuenta.', enlace: 'https://rwadar.pages.dev/novedades-rwadar/', creado_el: '2026-11-14T12:00:00+00:00' };

function entorno({ rpc = {}, activo, reloj } = {}) {
  const llamadas = [];
  let t = reloj ?? 1_800_000_000_000;
  const respuestas = {
    avisos_sin_cuenta_texto: () => Response.json(TEXTO_BASE),
    avisos_publicos: () => Response.json([AVISO]),
    alta_aviso_sin_cuenta_web: () => Response.json({ ok: true, estado: 'activa', nueva: true }),
    baja_aviso_sin_cuenta_web: () => Response.json({ ok: true, borrada: true }),
    aviso_sin_cuenta_web_activo: () => Response.json({ ok: true, activa: true, vigente: true, servicio: true }),
    alta_aviso_sin_cuenta_movil: () => Response.json({ ok: true, estado: 'activa', nueva: false }),
    baja_aviso_sin_cuenta_movil: () => Response.json({ ok: true, borrada: false }),
    aviso_sin_cuenta_movil_activo: () => Response.json({ ok: true, activa: false, vigente: false, servicio: true }),
    ...rpc,
  };
  const servidor = crearAccesoServidor({ ahora: () => t, ...(activo === undefined ? {} : { avisosSinCuenta: activo }),
    fetchImpl: async (url, init) => {
      llamadas.push({ url, init, cuerpo: init.body ? JSON.parse(init.body) : null });
      const nombre = /\/rest\/v1\/rpc\/([a-z_]+)$/.exec(url)?.[1];
      if (!nombre || !respuestas[nombre]) throw new Error('ruta inesperada ' + url);
      return respuestas[nombre](init);
    } });
  async function pedir(ruta, { method = 'GET', datos, cuerpo, origin, cabeceras = {}, ip = '203.0.113.7', env = ENV } = {}) {
    const headers = { accept: 'application/json', 'cf-connecting-ip': ip, ...cabeceras };
    if (origin !== undefined) headers.origin = origin;
    if (datos !== undefined || cuerpo !== undefined) headers['content-type'] ??= 'application/json';
    return servidor.atender({ env, request: new Request(ORIGIN + ruta, { method, headers,
      ...(datos !== undefined ? { body: JSON.stringify(datos) } : cuerpo !== undefined ? { body: cuerpo } : {}) }),
      next: async () => { throw new Error('no debe servir archivos'); } });
  }
  return { pedir, llamadas, servidor, avanzar: (ms) => { t += ms; } };
}
const json = async (r) => ({ estado: r.status, cuerpo: await r.json() });

test('el interruptor del servidor está encendido en el código y no se exporta', async () => {
  const fuente = fs.readFileSync(path.join(AQUI, 'servidor.mjs'), 'utf8');
  assert.match(fuente, /^const AVISOS_SIN_CUENTA = true;$/m);
  assert.doesNotMatch(fuente, /export\s+(const|let|var)\s+AVISOS_SIN_CUENTA/);
  assert.deepEqual(crearAccesoServidor().avisosSinCuenta, { activos: true, limites: { alta: 20, baja: 60, estado: 120 } });
  assert.equal(crearAccesoServidor({ avisosSinCuenta: false }).avisosSinCuenta.activos, false);
  assert.throws(() => crearAccesoServidor({ avisosSinCuenta: 'si' }), /avisos_sin_cuenta_invalidos/);
});

test('texto: con la clave publicable, sin sesión ni cookies, guardado 60 s en memoria', async () => {
  const e = entorno();
  const r = await e.pedir('/api/avisos/texto', { cabeceras: { cookie: '__Host-rwadar-acceso=eyJ.a.b; __Host-rwadar-renovar=p.x' } });
  assert.deepEqual(await json(r), { estado: 200, cuerpo: { v: 1, activo: true, version: VERSION, texto: { es: TEXTO_ES, en: TEXTO_EN }, clavePublica: CLAVE } });
  assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(e.llamadas.length, 1);
  const { url, init } = e.llamadas[0];
  assert.equal(url, ENV.SUPABASE_URL + '/rest/v1/rpc/avisos_sin_cuenta_texto');
  assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'manual');
  assert.equal(init.headers.apikey, ENV.SUPABASE_PUBLISHABLE_KEY);
  assert.equal(init.headers.Authorization, undefined); assert.equal(init.headers.cookie, undefined);
  for (let i = 0; i < 3; i++) assert.equal((await e.pedir('/api/avisos/texto')).status, 200);
  assert.equal(e.llamadas.length, 1, 'dentro del minuto, de la memoria');
  e.avanzar(61_000);
  await e.pedir('/api/avisos/texto');
  assert.equal(e.llamadas.length, 2, 'pasado el minuto, se vuelve a preguntar');
});

test('texto: apagado en la base, sin la 36, con el interruptor apagado o sin la clave VAPID dice activo = false', async () => {
  const apagada = entorno({ rpc: { avisos_sin_cuenta_texto: () => Response.json({ ...TEXTO_BASE, activo: false }) } });
  assert.equal((await json(await apagada.pedir('/api/avisos/texto'))).cuerpo.activo, false);
  const sin36 = entorno({ rpc: { avisos_sin_cuenta_texto: () => Response.json({ code: 'PGRST202' }, { status: 404 }) } });
  assert.deepEqual(await json(await sin36.pedir('/api/avisos/texto')), { estado: 200, cuerpo: { v: 1, activo: false, version: null, texto: null, clavePublica: null } });
  const cerrada = entorno({ rpc: { avisos_sin_cuenta_texto: () => Response.json({ code: '42501' }, { status: 401 }) } });
  assert.equal((await json(await cerrada.pedir('/api/avisos/texto'))).cuerpo.activo, false);
  const interruptor = entorno({ activo: false });
  const r = await json(await interruptor.pedir('/api/avisos/texto'));
  assert.equal(r.cuerpo.activo, false); assert.equal(r.cuerpo.version, VERSION);
  const sinClave = entorno({ rpc: { avisos_sin_cuenta_texto: () => Response.json({ ...TEXTO_BASE, clave_publica: null }) } });
  assert.equal((await json(await sinClave.pedir('/api/avisos/texto'))).cuerpo.activo, false);
});

test('texto: Supabase caído o una respuesta rara dan 503 con Retry-After, y el fallo se guarda 15 s', async () => {
  for (const respuesta of [() => new Response('caído', { status: 500 }), () => Response.json({ v: 2 }), () => Response.json([TEXTO_BASE]),
    () => { throw new Error('red'); }]) {
    const e = entorno({ rpc: { avisos_sin_cuenta_texto: respuesta } });
    const r = await e.pedir('/api/avisos/texto');
    assert.equal(r.status, 503); assert.equal(r.headers.get('retry-after'), '30');
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
    await e.pedir('/api/avisos/texto');
    assert.equal(e.llamadas.length, 1);
    e.avanzar(16_000);
    await e.pedir('/api/avisos/texto');
    assert.equal(e.llamadas.length, 2);
  }
  const sinConfig = entorno();
  assert.deepEqual(await json(await sinConfig.pedir('/api/avisos/texto', { env: {} })), { estado: 503, cuerpo: { error: 'configuracion_pendiente' } });
});

test('recientes: los avisos publicados (20), sin los que no tienen forma; sin la 36, lista vacía', async () => {
  const raros = [AVISO, { ...AVISO, id: '8', enlace: 'https://otra.web/' }, { ...AVISO, id: 'x' }, { ...AVISO, id: '9', tipo: 'bienvenida' },
    { ...AVISO, id: '10', titulo: 'T'.repeat(91) }, { ...AVISO, id: '11', creado_el: 'ayer' }, { ...AVISO, id: '12', extra: 1 }];
  const e = entorno({ rpc: { avisos_publicos: () => Response.json(raros) } });
  const r = await e.pedir('/api/avisos/recientes');
  assert.deepEqual(await json(r), { estado: 200, cuerpo: { v: 1, avisos: [AVISO, { ...AVISO, id: '12' }] } });
  assert.deepEqual(e.llamadas[0].cuerpo, { p_limite: 20 });
  assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
  const sin36 = entorno({ rpc: { avisos_publicos: () => Response.json({}, { status: 404 }) } });
  assert.deepEqual(await json(await sin36.pedir('/api/avisos/recientes')), { estado: 200, cuerpo: { v: 1, avisos: [] } });
});

test('rutas y métodos: solo las cuatro, GET las de leer y POST las de cambiar, sin parámetros', async () => {
  const e = entorno();
  assert.deepEqual(await json(await e.pedir('/api/avisos/otra')), { estado: 404, cuerpo: { ok: false, error: 'ruta_no_permitida' } });
  const post = await e.pedir('/api/avisos/texto', { method: 'POST', datos: {} });
  assert.equal(post.status, 405); assert.equal(post.headers.get('allow'), 'GET');
  const get = await e.pedir('/api/avisos/web');
  assert.equal(get.status, 405); assert.equal(get.headers.get('allow'), 'POST');
  assert.equal((await e.pedir('/api/avisos/movil', { method: 'PUT', datos: ALTA_MOVIL })).status, 405);
  assert.equal((await e.pedir('/api/avisos/texto?v=2')).status, 400);
  assert.equal((await e.pedir('/api/avisos/web?x=1', { method: 'POST', datos: ALTA_WEB })).status, 400);
  assert.equal((await e.pedir('/api/avisos/recientes/')).status, 200, 'la barra final se ignora, como en el resto');
  assert.equal(e.llamadas.length, 1);
});

test('Origin: el mismo o ninguno (la app nativa no lo manda); otro, null o sec-fetch-site cross-site dan 403 sin llamar a nadie', async () => {
  const e = entorno();
  assert.equal((await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB, origin: ORIGIN })).status, 200);
  assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: ALTA_MOVIL })).status, 200);
  const antes = e.llamadas.length;
  for (const pedido of [{ origin: 'https://atacante.test' }, { origin: 'null' }, { origin: 'https://revision.rwadar.pages.dev' },
    { cabeceras: { 'sec-fetch-site': 'cross-site' } }]) {
    const r = await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB, ...pedido });
    assert.deepEqual(await json(r), { estado: 403, cuerpo: { ok: false, error: 'origen_no_permitido' } });
  }
  assert.equal((await e.pedir('/api/avisos/texto', { cabeceras: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB, cabeceras: { 'sec-fetch-site': 'same-origin' } })).status, 200);
  assert.equal(e.llamadas.length, antes + 1);
});

test('cuerpo: solo JSON, como mucho 4 kB y exactamente las claves de cada acción, con la forma de la base', async () => {
  const e = entorno();
  const malos = [
    { cuerpo: 'accion=alta', cabeceras: { 'content-type': 'application/x-www-form-urlencoded' } },
    { cuerpo: '{"accion":', cabeceras: {} },
    { cuerpo: '[1]', cabeceras: {} },
    { datos: { ...ALTA_WEB, extra: 1 } },
    { datos: { ...ALTA_WEB, origen: undefined } },
    { datos: { accion: 'borrar', endpoint: ENDPOINT, auth: AUTH } },
    { datos: { ...ALTA_WEB, endpoint: ENDPOINT.replace('https:', 'http:') } },
    { datos: { ...ALTA_WEB, endpoint: 'https://push.ejemplo.test/x' } },
    { datos: { ...ALTA_WEB, endpoint: ENDPOINT + 'x'.repeat(2048) } },
    { datos: { ...ALTA_WEB, p256dh: 'BAAA' } },
    { datos: { ...ALTA_WEB, auth: 'corta' } },
    { datos: { ...ALTA_WEB, version: 'Versión rara' } },
    { datos: { ...ALTA_WEB, idioma: 'EN' } },
    { datos: { ...ALTA_WEB, origen: 'correo' } },
    { datos: { accion: 'baja', endpoint: ENDPOINT, auth: AUTH, p256dh: P256DH } },
  ];
  for (const m of malos) {
    const r = await e.pedir('/api/avisos/web', { method: 'POST', ...m });
    assert.equal(r.status, 400, JSON.stringify(m).slice(0, 80));
    assert.deepEqual(await r.json(), { ok: false, error: 'solicitud_invalida' });
  }
  for (const datos of [{ ...ALTA_MOVIL, plataforma: 'ios' }, { ...ALTA_MOVIL, token: 'ExponentPushToken[corto]' }, { accion: 'baja', token: TOKEN, extra: 1 },
    { accion: 'estado' }, { ...ALTA_MOVIL, idioma: 'fr' }]) {
    assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos })).status, 400, JSON.stringify(datos));
  }
  const grande = await e.pedir('/api/avisos/web', { method: 'POST', cuerpo: JSON.stringify({ ...ALTA_WEB, relleno: 'x'.repeat(5000) }) });
  assert.deepEqual(await json(grande), { estado: 413, cuerpo: { ok: false, error: 'solicitud_excesiva' } });
  const declarado = await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB, cabeceras: { 'content-length': '5000' } }).catch(() => null);
  if (declarado) assert.equal(declarado.status, 413);
  assert.equal(e.llamadas.length, 0, 'nada llega a Supabase');
});

test('alta, baja y estado de la web: los parámetros exactos de la RPC (claves en base64url) y la respuesta de la base', async () => {
  const e = entorno();
  const auth64 = Buffer.from(AUTH, 'base64url').toString('base64');
  const r = await e.pedir('/api/avisos/web', { method: 'POST', datos: { ...ALTA_WEB, auth: auth64 }, origin: ORIGIN });
  assert.deepEqual(await json(r), { estado: 200, cuerpo: { ok: true, estado: 'activa', nueva: true } });
  assert.equal(r.headers.get('cache-control'), 'private, no-store'); assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(e.llamadas[0].url, ENV.SUPABASE_URL + '/rest/v1/rpc/alta_aviso_sin_cuenta_web');
  assert.deepEqual(e.llamadas[0].cuerpo, { p_endpoint: ENDPOINT, p_p256dh: P256DH, p_auth: AUTH, p_version: VERSION, p_idioma: 'es', p_origen: 'perfil' });
  assert.equal(e.llamadas[0].init.headers.Authorization, undefined);
  assert.deepEqual(await json(await e.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'baja', endpoint: ENDPOINT, auth: AUTH } })),
    { estado: 200, cuerpo: { ok: true, borrada: true } });
  assert.deepEqual(e.llamadas[1].cuerpo, { p_endpoint: ENDPOINT, p_auth: AUTH });
  assert.equal(e.llamadas[1].url, ENV.SUPABASE_URL + '/rest/v1/rpc/baja_aviso_sin_cuenta_web');
  assert.deepEqual(await json(await e.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'estado', endpoint: ENDPOINT, auth: AUTH } })),
    { estado: 200, cuerpo: { ok: true, activa: true, vigente: true, servicio: true } });
  assert.equal(e.llamadas[2].url, ENV.SUPABASE_URL + '/rest/v1/rpc/aviso_sin_cuenta_web_activo');
});

test('alta, baja y estado del móvil', async () => {
  const e = entorno();
  assert.deepEqual(await json(await e.pedir('/api/avisos/movil', { method: 'POST', datos: ALTA_MOVIL })), { estado: 200, cuerpo: { ok: true, estado: 'activa', nueva: false } });
  assert.deepEqual(e.llamadas[0].cuerpo, { p_token: TOKEN, p_plataforma: 'android', p_version: VERSION, p_idioma: 'en', p_origen: 'novedades' });
  assert.deepEqual(await json(await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'baja', token: TOKEN } })), { estado: 200, cuerpo: { ok: true, borrada: false } });
  assert.deepEqual(e.llamadas[1].cuerpo, { p_token: TOKEN });
  assert.deepEqual(await json(await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'estado', token: TOKEN } })),
    { estado: 200, cuerpo: { ok: true, activa: false, vigente: false, servicio: true } });
  assert.deepEqual(e.llamadas.map((l) => l.url.split('/').at(-1)), ['alta_aviso_sin_cuenta_movil', 'baja_aviso_sin_cuenta_movil', 'aviso_sin_cuenta_movil_activo']);
});

test('lo que la base no hace: apagado, versión, en_uso y lleno (409), cupo (429), sin la 36 (calma) y respuestas raras (503)', async () => {
  for (const [error, estado] of [['apagado', 409], ['version', 409], ['en_uso', 409], ['lleno', 409], ['cupo', 429]]) {
    const e = entorno({ rpc: { alta_aviso_sin_cuenta_web: () => Response.json({ ok: false, error }) } });
    const r = await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB });
    assert.deepEqual(await json(r), { estado, cuerpo: { ok: false, error } });
    assert.equal(r.headers.get('retry-after'), error === 'cupo' ? '900' : null);
  }
  const sin36 = entorno({ rpc: Object.fromEntries(['alta_aviso_sin_cuenta_web', 'baja_aviso_sin_cuenta_web', 'aviso_sin_cuenta_web_activo']
    .map((n) => [n, () => Response.json({ code: 'PGRST202' }, { status: 404 })])) });
  assert.deepEqual(await json(await sin36.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB })), { estado: 409, cuerpo: { ok: false, error: 'apagado' } });
  assert.deepEqual(await json(await sin36.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'baja', endpoint: ENDPOINT, auth: AUTH } })), { estado: 200, cuerpo: { ok: true, borrada: false } });
  assert.deepEqual(await json(await sin36.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'estado', endpoint: ENDPOINT, auth: AUTH } })),
    { estado: 200, cuerpo: { ok: true, activa: false, vigente: false, servicio: false } });
  const forma = entorno({ rpc: { alta_aviso_sin_cuenta_web: () => Response.json({ code: '22023' }, { status: 400 }) } });
  assert.equal((await forma.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB })).status, 400);
  for (const rara of [() => Response.json({ ok: false, error: 'otro' }), () => Response.json({ ok: true }), () => Response.json([]),
    () => new Response('caído', { status: 502 }), () => Response.json({}, { status: 429 })]) {
    const e = entorno({ rpc: { alta_aviso_sin_cuenta_web: rara } });
    const r = await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB });
    assert.ok([503, 429].includes(r.status), String(r.status));
    assert.ok(r.headers.get('retry-after'));
  }
});

test('interruptor apagado: el alta da 404 sin llamar a la base; la baja y el estado siguen (servicio = false)', async () => {
  const e = entorno({ activo: false });
  assert.deepEqual(await json(await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB })), { estado: 404, cuerpo: { ok: false, error: 'no_disponible' } });
  assert.deepEqual(await json(await e.pedir('/api/avisos/movil', { method: 'POST', datos: ALTA_MOVIL })), { estado: 404, cuerpo: { ok: false, error: 'no_disponible' } });
  assert.equal(e.llamadas.length, 0);
  assert.deepEqual(await json(await e.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'baja', endpoint: ENDPOINT, auth: AUTH } })), { estado: 200, cuerpo: { ok: true, borrada: true } });
  assert.equal((await json(await e.pedir('/api/avisos/web', { method: 'POST', datos: { accion: 'estado', endpoint: ENDPOINT, auth: AUTH } }))).cuerpo.servicio, false);
});

test('límites por visitante: 20 altas, 60 bajas y 120 estados cada 10 minutos, cada grupo con su cupo (429 con Retry-After)', async () => {
  const e = entorno();
  for (let i = 0; i < 20; i++) assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: ALTA_MOVIL })).status, 200);
  const r = await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB });
  assert.deepEqual(await json(r), { estado: 429, cuerpo: { ok: false, error: 'intentos_excedidos' } });
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal((await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB, ip: '198.51.100.9' })).status, 200, 'otro visitante');
  for (let i = 0; i < 60; i++) assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'baja', token: TOKEN } })).status, 200);
  assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'baja', token: TOKEN } })).status, 429);
  for (let i = 0; i < 120; i++) assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'estado', token: TOKEN } })).status, 200);
  assert.equal((await e.pedir('/api/avisos/movil', { method: 'POST', datos: { accion: 'estado', token: TOKEN } })).status, 429);
  assert.equal(e.llamadas.length, 20 + 1 + 60 + 120, 'lo que pasa del cupo no llega a Supabase');
  e.avanzar(601_000);
  assert.equal((await e.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB })).status, 200, 'pasada la ventana');
  // Una petición mal formada no gasta cupo.
  const f = entorno();
  for (let i = 0; i < 30; i++) await f.pedir('/api/avisos/web', { method: 'POST', datos: { ...ALTA_WEB, idioma: 'fr' } });
  assert.equal((await f.pedir('/api/avisos/web', { method: 'POST', datos: ALTA_WEB })).status, 200);
});

test('el resto del servidor no cambia: /api/acceso sigue con su regla de Origin y otra /api/ da 404', async () => {
  const e = entorno();
  assert.equal((await e.pedir('/api/ajena')).status, 404);
  const r = await e.servidor.atender({ env: ENV, request: new Request(ORIGIN + '/api/acceso/baja', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: '{}' }), next: async () => new Response('') });
  assert.equal(r.status, 403, 'sin Origin, /api/acceso sigue rechazando');
  assert.equal(e.llamadas.length, 0);
});

test('el worker compilado lleva las rutas sin cuenta (sin red: rutas, Origin y método)', async () => {
  const { construirWorker } = await import('./compilar.cjs');
  const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64') + '#sin-cuenta')).default;
  const env = { ASSETS: { fetch: async () => new Response('archivo') } };
  const ctx = { waitUntil() {} };
  const otra = await worker.fetch(new Request(ORIGIN + '/api/avisos/otra'), env, ctx);
  assert.equal(otra.status, 404); assert.deepEqual(await otra.json(), { ok: false, error: 'ruta_no_permitida' });
  const cruzada = await worker.fetch(new Request(ORIGIN + '/api/avisos/web', { method: 'POST', headers: { origin: 'https://atacante.test', 'content-type': 'application/json' },
    body: JSON.stringify(ALTA_WEB) }), env, ctx);
  assert.equal(cruzada.status, 403);
  const metodo = await worker.fetch(new Request(ORIGIN + '/api/avisos/texto', { method: 'DELETE' }), env, ctx);
  assert.equal(metodo.status, 405);
  assert.equal(metodo.headers.get('set-cookie'), null);
});
