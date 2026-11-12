// Sesión que se mantiene (12/11/2026): el pase de Supabase (access_token)
// caduca en una hora y la cookie __Host-rwadar-renovar guarda el refresh_token
// para renovarlo sin la contraseña. Con «Mantener la sesión iniciada en este
// dispositivo», las dos llevan Max-Age; sin ella, son cookies de sesión del
// navegador, pero el pase se renueva mientras duren.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { crearAccesoServidor } from './servidor.mjs';
const require = createRequire(import.meta.url);
const { construirWorker } = require('./compilar.cjs');

const ORIGIN = 'https://rwadar.pages.dev';
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const UID = '11111111-1111-4111-8111-111111111111';
const CORREO = 'cuenta@ejemplo.test', CLAVE = 'clave-solo-de-prueba';
const LECCION = 'que-significa-tokenizar-un-activo';
const ACADEMY = { acceso: 'cuenta', lecciones: [LECCION] };
const INICIO = Date.parse('2026-11-12T12:00:00Z');
const UN_DIA = 24 * 60 * 60, TREINTA_DIAS = 30 * UN_DIA;
const ATRIBUTOS = '; Path=/; HttpOnly; Secure; SameSite=Lax';
const BORRAR_PASE = '__Host-rwadar-acceso=' + ATRIBUTOS + '; Max-Age=0';
const BORRAR_RENOVAR = '__Host-rwadar-renovar=' + ATRIBUTOS + '; Max-Age=0';

const b64 = texto => Buffer.from(texto).toString('base64url');
// Pase con forma de JWT de Supabase; exp en segundos.
const pase = (exp, n = 0) => b64('{"alg":"HS256","typ":"JWT"}') + '.' + b64(JSON.stringify({ sub: UID, exp, n })) + '.firma' + n;

/* Supabase Auth simulado, con la rotación de refresh_token de GoTrue
   (internal/api/token_refresh.go): cada uso revoca el token y crea uno hijo;
   reusar un token revocado devuelve el vigente si es su padre; si no, se admite
   durante el intervalo de reutilización (10 s) y, pasado, se revoca toda la
   sesión («Already Used»). Cerrar sesión revoca la sesión entera. */
function crearSupabase(reloj) {
  const llamadas = [], pases = new Map(), refrescos = new Map(), sesiones = new Map();
  let n = 0, falloRenovar = null;
  const ahoraS = () => Math.floor(reloj.ahora / 1000);
  function emitir(sesion, refresh) {
    const access = pase(ahoraS() + 3600, ++n);
    pases.set(access, { sesion, exp: ahoraS() + 3600 });
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: ahoraS() + 3600, refresh_token: refresh, user: { id: UID } };
  }
  function nuevoRefresh(sesion, padre = null) {
    const token = 'r' + String(++n).padStart(11, '0');
    refrescos.set(token, { sesion, padre, revocado: false, usadoEn: 0 });
    sesiones.get(sesion).vigente = token;
    return token;
  }
  function entrar() {
    const sesion = 's' + (++n); sesiones.set(sesion, { activa: true, vigente: null });
    return emitir(sesion, nuevoRefresh(sesion));
  }
  const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
  async function fetchImpl(url, init) {
    const u = new URL(url), cuerpo = init.body ? JSON.parse(init.body) : null;
    const bearer = (init.headers.Authorization || '').replace(/^Bearer /, '');
    llamadas.push({ ruta: u.pathname + u.search, metodo: init.method || 'GET', bearer, cuerpo });
    const valido = () => { const p = pases.get(bearer); return p && p.exp > ahoraS() && sesiones.get(p.sesion)?.activa; };
    if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') {
      return cuerpo.email === CORREO && cuerpo.password === CLAVE ? json(entrar()) : json({ error_code: 'invalid_credentials' }, 400);
    }
    if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') {
      if (falloRenovar) return falloRenovar();
      const r = refrescos.get(cuerpo.refresh_token), s = r && sesiones.get(r.sesion);
      if (!r || !s.activa) return json({ error_code: 'refresh_token_not_found' }, 400);
      if (r.revocado) {
        if (refrescos.get(s.vigente)?.padre === cuerpo.refresh_token) return json(emitir(r.sesion, s.vigente));
        if (reloj.ahora - r.usadoEn > 10000) { s.activa = false; return json({ error_code: 'refresh_token_already_used' }, 400); }
      }
      r.revocado = true; r.usadoEn = reloj.ahora;
      return json(emitir(r.sesion, nuevoRefresh(r.sesion, cuerpo.refresh_token)));
    }
    if (u.pathname === '/auth/v1/logout') {
      if (!valido()) return json({ error_code: 'bad_jwt' }, 401);
      sesiones.get(pases.get(bearer).sesion).activa = false; return new Response(null, { status: 204 });
    }
    if (u.pathname === '/auth/v1/user') return valido() ? json({ id: UID, email: CORREO, email_confirmed_at: '2026-10-23T10:00:00Z', is_anonymous: false }) : json({ error_code: 'bad_jwt' }, 403);
    if (u.pathname === '/rest/v1/mi_perfil') return valido() ? json([{ id: UID }]) : json({ code: 'PGRST301' }, 401);
    if (u.pathname === '/rest/v1/vigilancia') return valido() ? json([{ usuario_id: UID, plataforma_id: 7 }]) : json({ code: 'PGRST301' }, 401);
    if (u.pathname === '/rest/v1/rpc/borrar_mi_cuenta') {
      if (!valido()) return json({ code: 'PGRST301' }, 401);
      for (const s of sesiones.values()) s.activa = false; return new Response(null, { status: 204 });
    }
    if (u.pathname === '/rest/v1/mi_cartera') return valido() ? json([]) : json({ code: 'PGRST301' }, 401);
    throw new Error('Ruta no simulada: ' + u.pathname);
  }
  return { fetchImpl, llamadas, entrar, sesiones, refrescos,
    renovaciones: () => llamadas.filter(l => l.ruta === '/auth/v1/token?grant_type=refresh_token'),
    fallarRenovar(respuesta) { falloRenovar = respuesta; } };
}

function entorno({ reloj = { ahora: INICIO }, supabase = crearSupabase(reloj), academy = ACADEMY } = {}) {
  const servidor = crearAccesoServidor({ fetchImpl: supabase.fetchImpl, ahora: () => reloj.ahora, academy });
  const servidas = [], respuestas = [];
  async function run(ruta, { method = 'GET', data, cookies = {}, accept = 'application/json', ip, headers = {} } = {}) {
    const h = { accept, ...headers };
    const tarro = Object.entries(cookies).filter(([, v]) => v !== undefined).map(([k, v]) => k + '=' + v).join('; ');
    if (tarro) h.cookie = tarro;
    if (ip) h['cf-connecting-ip'] = ip;
    if (method === 'POST') Object.assign(h, { origin: ORIGIN, 'content-type': 'application/json' });
    const r = await servidor.atender({ env: ENV, request: new Request(ORIGIN + ruta, { method, headers: h, ...(data ? { body: JSON.stringify(data) } : {}) }),
      next: async () => { servidas.push(ruta); return new Response('LECCION', { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0' } }); } });
    respuestas.push(r.clone());
    return r;
  }
  return { reloj, supabase, servidor, run, servidas, respuestas };
}
// Lo que pone cada Set-Cookie: { nombre: { valor, atributos } }.
function leerSetCookie(r) {
  const salida = {};
  for (const linea of r.headers.getSetCookie()) {
    const [par, ...atributos] = linea.split('; ');
    const i = par.indexOf('=');
    salida[par.slice(0, i)] = { valor: par.slice(i + 1), atributos, linea };
  }
  return salida;
}
// El tarro del navegador tras una respuesta (Max-Age=0 borra).
function aplicar(tarro, r) {
  for (const [nombre, c] of Object.entries(leerSetCookie(r))) {
    if (c.atributos.includes('Max-Age=0')) delete tarro[nombre]; else tarro[nombre] = c.valor;
  }
  return tarro;
}
async function entrar(e, mantener) {
  const r = await e.run('/api/acceso/entrar', { method: 'POST', data: { correo: CORREO, clave: CLAVE, ...(mantener === undefined ? {} : { mantener }) } });
  assert.equal(r.status, 200);
  return { r, tarro: aplicar({}, r) };
}
// Ninguna respuesta lleva un token fuera de sus Set-Cookie (HttpOnly).
async function sinTokens(e) {
  const tokens = [...e.supabase.refrescos.keys(), ...e.supabase.llamadas.map(l => l.bearer).filter(Boolean)];
  assert.ok(tokens.length > 0);
  for (const r of e.respuestas) {
    const texto = await r.text();
    const cabeceras = [...r.headers].filter(([k]) => k !== 'set-cookie').map(([k, v]) => k + ': ' + v).join('\n');
    for (const t of tokens) {
      assert.equal(texto.includes(t), false, 'el cuerpo no lleva tokens');
      assert.equal(cabeceras.includes(t), false, 'las cabeceras no llevan tokens');
    }
    assert.doesNotMatch(texto, /access_token|refresh_token/);
  }
}

test('entrar sin «mantener»: dos cookies de sesión del navegador, HttpOnly, Secure, SameSite=Lax, Path=/ y __Host-', async () => {
  for (const mantener of [undefined, false]) {
    const e = entorno(); const { r } = await entrar(e, mantener);
    const c = leerSetCookie(r);
    assert.deepEqual(Object.keys(c), ['__Host-rwadar-acceso', '__Host-rwadar-renovar']);
    const refresh = [...e.supabase.refrescos.keys()][0];
    assert.equal(c['__Host-rwadar-acceso'].linea, '__Host-rwadar-acceso=' + e.supabase.llamadas.at(-1).bearer + ATRIBUTOS);
    assert.equal(c['__Host-rwadar-renovar'].linea, '__Host-rwadar-renovar=s.' + refresh + ATRIBUTOS);
    for (const { atributos } of Object.values(c)) {
      assert.deepEqual(atributos, ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'], 'sin Max-Age ni Domain ni Expires');
    }
    assert.deepEqual(await r.json(), { autenticada: true, usuario: { id: UID, correo: CORREO, correoConfirmadoEl: '2026-10-23T10:00:00Z' } });
    await sinTokens(e);
  }
});

test('entrar con «mantener»: el pase dura lo que el pase (expires_in) y la de renovar, 30 días', async () => {
  const e = entorno(); const { r } = await entrar(e, true);
  const c = leerSetCookie(r);
  assert.deepEqual(c['__Host-rwadar-acceso'].atributos, ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=3600']);
  assert.match(c['__Host-rwadar-renovar'].valor, /^p\.r\d{11}$/);
  assert.deepEqual(c['__Host-rwadar-renovar'].atributos, ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=' + TREINTA_DIAS]);
  await sinTokens(e);
});

test('«mantener» solo admite un booleano y se valida antes de preguntar a Supabase', async () => {
  for (const mantener of ['si', 1, null, {}, 'true']) {
    const e = entorno();
    const r = await e.run('/api/acceso/entrar', { method: 'POST', data: { correo: CORREO, clave: CLAVE, mantener } });
    assert.equal(r.status, 400); assert.deepEqual(await r.json(), { error: 'solicitud_invalida' });
    assert.equal(r.headers.get('set-cookie'), null); assert.equal(e.supabase.llamadas.length, 0);
  }
});

test('con el pase vigente no se renueva ni se reescriben las cookies', async () => {
  const e = entorno(); const { tarro } = await entrar(e, true);
  e.reloj.ahora += 30 * 60 * 1000;
  const r = await e.run('/api/acceso/sesion', { cookies: tarro });
  assert.equal(r.status, 200); assert.deepEqual(r.headers.getSetCookie(), []);
  assert.equal(e.supabase.renovaciones().length, 0);
});

test('al caducar el pase (o faltar, o quedarle menos de un minuto) se renueva y se reescriben las dos cookies igual', async () => {
  for (const [mantener, tiempo, quitarPase] of [[true, 3600, true], [true, 3600 - 30, false], [false, 3601, false], [false, 3600 - 59, false]]) {
    const e = entorno(); const { tarro } = await entrar(e, mantener);
    const viejo = { ...tarro };
    e.reloj.ahora += tiempo * 1000;
    // Con «mantener», la cookie del pase caduca con él y el navegador deja de mandarla.
    if (quitarPase) delete tarro['__Host-rwadar-acceso'];
    const r = await e.run('/api/acceso/sesion', { cookies: tarro });
    assert.equal(r.status, 200, `mantener=${mantener}, +${tiempo}s`);
    assert.equal((await r.json()).usuario.id, UID);
    const [renovacion] = e.supabase.renovaciones();
    assert.equal(e.supabase.renovaciones().length, 1);
    assert.deepEqual(renovacion.cuerpo, { refresh_token: viejo['__Host-rwadar-renovar'].slice(2) });
    assert.equal(renovacion.bearer, '', 'la renovación no manda el pase viejo');
    const c = leerSetCookie(r);
    assert.notEqual(c['__Host-rwadar-acceso'].valor, viejo['__Host-rwadar-acceso']);
    assert.notEqual(c['__Host-rwadar-renovar'].valor, viejo['__Host-rwadar-renovar']);
    assert.equal(c['__Host-rwadar-renovar'].valor.slice(0, 2), mantener ? 'p.' : 's.');
    assert.equal(c['__Host-rwadar-acceso'].atributos.includes('Max-Age=3600'), mantener);
    assert.equal(c['__Host-rwadar-renovar'].atributos.includes('Max-Age=' + TREINTA_DIAS), mantener);
    // El pase nuevo es el que se usó para comprobar la cuenta.
    assert.equal(e.supabase.llamadas.at(-1).bearer, c['__Host-rwadar-acceso'].valor);
    // Y la sesión sigue: la siguiente petición ya no renueva.
    aplicar(tarro, r);
    assert.equal((await e.run('/api/acceso/sesion', { cookies: tarro })).status, 200);
    assert.equal(e.supabase.renovaciones().length, 1);
    await sinTokens(e);
  }
});

test('un pase que Auth rechaza (401/403) se renueva una vez aunque su caducidad no se pueda leer', async () => {
  const e = entorno(); const { tarro } = await entrar(e, false);
  tarro['__Host-rwadar-acceso'] = 'eyJhbGciOiJIUzI1NiJ9.e30.ilegible';
  const r = await e.run('/api/acceso/sesion', { cookies: tarro });
  assert.equal(r.status, 200); assert.equal(e.supabase.renovaciones().length, 1);
  assert.equal(r.headers.getSetCookie().length, 2);
});

test('peticiones en paralelo de la misma página comparten una renovación y ninguna cierra la sesión', async () => {
  const e = entorno(); const { tarro } = await entrar(e, true);
  e.reloj.ahora += 3600 * 1000;
  const viejo = { ...tarro };
  const rutas = [['/api/acceso/sesion'], ['/api/acceso/datos', { ruta: '/vigilancia?select=usuario_id' }], ['/api/acceso/datos', { ruta: '/mi_perfil?select=id' }],
    ['/api/acceso/sesion'], ['/api/acceso/datos', { ruta: '/vigilancia?select=plataforma_id' }]];
  const respuestas = await Promise.all(rutas.map(([ruta, data]) => e.run(ruta, data ? { method: 'POST', data, cookies: viejo } : { cookies: viejo })));
  assert.deepEqual(respuestas.map(r => r.status), [200, 200, 200, 200, 200]);
  assert.equal(e.supabase.renovaciones().length, 1, 'una sola renovación en este isolate');
  const renovar = new Set(respuestas.map(r => leerSetCookie(r)['__Host-rwadar-renovar'].valor));
  assert.equal(renovar.size, 1, 'todas dejan el mismo refresh_token');
  // Una rezagada con el refresh_token viejo, dentro de los 10 s, recibe la misma renovación.
  e.reloj.ahora += 5000;
  const rezagada = await e.run('/api/acceso/sesion', { cookies: viejo });
  assert.equal(rezagada.status, 200); assert.equal(e.supabase.renovaciones().length, 1);
  assert.equal(leerSetCookie(rezagada)['__Host-rwadar-renovar'].valor, [...renovar][0]);
  await sinTokens(e);
});

test('en paralelo desde dos isolates (o una rezagada pasados los 10 s), Supabase da el refresh_token vigente y la sesión sigue', async () => {
  const reloj = { ahora: INICIO }, supabase = crearSupabase(reloj);
  const a = entorno({ reloj, supabase }), b = entorno({ reloj, supabase });
  const { tarro } = await entrar(a, true);
  reloj.ahora += 3600 * 1000;
  const viejo = { ...tarro };
  const [ra, rb] = await Promise.all([a.run('/api/acceso/sesion', { cookies: viejo }), b.run('/api/acceso/sesion', { cookies: viejo })]);
  assert.deepEqual([ra.status, rb.status], [200, 200]);
  assert.equal(supabase.renovaciones().length, 2);
  assert.equal(leerSetCookie(ra)['__Host-rwadar-renovar'].valor, leerSetCookie(rb)['__Host-rwadar-renovar'].valor);
  // Una respuesta perdida: el navegador sigue con el refresh_token viejo un minuto después.
  reloj.ahora += 60 * 1000;
  const tarde = await b.run('/api/acceso/sesion', { cookies: viejo });
  assert.equal(tarde.status, 200, 'el padre del vigente se admite siempre');
  aplicar(tarro, tarde);
  assert.equal((await a.run('/api/acceso/sesion', { cookies: tarro })).status, 200);
  assert.ok([...supabase.sesiones.values()].every(s => s.activa));
});

test('renovación rechazada por Supabase (400/401/403): se borran las dos cookies y es «sin sesión»', async () => {
  for (const status of [400, 401, 403]) {
    const e = entorno(); const { tarro } = await entrar(e, true);
    e.reloj.ahora += 3600 * 1000;
    e.supabase.fallarRenovar(() => new Response(JSON.stringify({ error_code: 'refresh_token_not_found' }), { status }));
    const r = await e.run('/api/acceso/sesion', { cookies: tarro });
    assert.equal(r.status, 401); assert.deepEqual(await r.json(), { error: 'sesion_necesaria' });
    assert.deepEqual(r.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
    // En la pasarela de datos, igual y sin tocar el recurso.
    const antes = e.supabase.llamadas.length;
    const d = await e.run('/api/acceso/datos', { method: 'POST', data: { ruta: '/vigilancia' }, cookies: tarro });
    assert.equal(d.status, 401); assert.deepEqual(d.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
    assert.ok(e.supabase.llamadas.slice(antes).every(l => l.ruta.startsWith('/auth/v1/token?')));
    await sinTokens(e);
  }
});

test('un fallo pasajero al renovar (red, 5xx, 429) no borra nada y se puede reintentar', async () => {
  const casos = [[() => { throw new Error('red caída'); }, 503], [() => new Response('caído', { status: 502 }), 503],
    [() => new Response('{}', { status: 429, headers: { 'Retry-After': '7' } }), 429]];
  for (const [fallo, status] of casos) {
    const e = entorno(); const { tarro } = await entrar(e, false);
    e.reloj.ahora += 3600 * 1000;
    e.supabase.fallarRenovar(fallo);
    const r = await e.run('/api/acceso/sesion', { cookies: tarro });
    assert.equal(r.status, status); assert.deepEqual(r.headers.getSetCookie(), []);
    if (status === 429) assert.equal(r.headers.get('retry-after'), '7');
    // El fallo no queda guardado: al volver Supabase, la misma cookie renueva.
    e.supabase.fallarRenovar(null);
    const otra = await e.run('/api/acceso/sesion', { cookies: tarro });
    assert.equal(otra.status, 200); assert.equal(otra.headers.getSetCookie().length, 2);
  }
});

test('cada visitante tiene un cupo de renovaciones; pasado, 429 sin borrar la sesión', async () => {
  const e = entorno(); const tarros = [];
  for (let i = 0; i < 61; i++) tarros.push((await entrar(e, false)).tarro);
  e.reloj.ahora += 3600 * 1000;
  for (let i = 0; i < 60; i++) assert.equal((await e.run('/api/acceso/sesion', { cookies: tarros[i], ip: '203.0.113.7' })).status, 200);
  const r = await e.run('/api/acceso/sesion', { cookies: tarros[60], ip: '203.0.113.7' });
  assert.equal(r.status, 429); assert.deepEqual(r.headers.getSetCookie(), []);
  assert.equal(e.supabase.renovaciones().length, 60);
  // Otro visitante no lo nota.
  assert.equal((await e.run('/api/acceso/sesion', { cookies: tarros[60], ip: '203.0.113.8' })).status, 200);
});

test('una cookie de renovar con otra forma se ignora sin preguntar a Supabase', async () => {
  for (const valor of ['x.r00000000001', 'p.', 'p.corto', 's.con espacio', 'p.' + 'a'.repeat(1025), 'r00000000001']) {
    const e = entorno();
    const r = await e.run('/api/acceso/sesion', { cookies: { '__Host-rwadar-renovar': valor } });
    assert.equal(r.status, 401); assert.equal(e.supabase.llamadas.length, 0); assert.deepEqual(r.headers.getSetCookie(), []);
  }
});

test('salir revoca la sesión en Supabase (con el pase, renovado si hace falta) y borra las dos cookies', async () => {
  // Con el pase vigente.
  let e = entorno(); let { tarro } = await entrar(e, true);
  let r = await e.run('/api/acceso/salir', { method: 'POST', data: {}, cookies: tarro });
  assert.deepEqual(await r.json(), { cerrado: true, cierreRemoto: true });
  assert.deepEqual(r.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
  const logout = e.supabase.llamadas.at(-1);
  assert.equal(logout.ruta, '/auth/v1/logout?scope=local'); assert.equal(logout.bearer, tarro['__Host-rwadar-acceso']);
  assert.ok([...e.supabase.sesiones.values()].every(s => !s.activa), 'la sesión ya no existe en Supabase');
  // El refresh_token ya no abre nada.
  r = await e.run('/api/acceso/sesion', { cookies: { '__Host-rwadar-renovar': tarro['__Host-rwadar-renovar'] } });
  assert.equal(r.status, 401); assert.deepEqual(r.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);

  // Con el pase caducado: se renueva para poder revocar.
  e = entorno(); ({ tarro } = await entrar(e, false));
  e.reloj.ahora += 2 * 3600 * 1000;
  r = await e.run('/api/acceso/salir', { method: 'POST', data: {}, cookies: tarro });
  assert.deepEqual(await r.json(), { cerrado: true, cierreRemoto: true });
  assert.deepEqual(e.supabase.llamadas.slice(-2).map(l => l.ruta), ['/auth/v1/token?grant_type=refresh_token', '/auth/v1/logout?scope=local']);
  assert.ok([...e.supabase.sesiones.values()].every(s => !s.activa));

  // Si Supabase ya no la conoce, está cerrada; si no responde, se dice y las cookies se borran igual.
  e = entorno(); ({ tarro } = await entrar(e, false));
  e.reloj.ahora += 2 * 3600 * 1000;
  e.supabase.fallarRenovar(() => new Response('{}', { status: 400 }));
  r = await e.run('/api/acceso/salir', { method: 'POST', data: {}, cookies: tarro });
  assert.deepEqual(await r.json(), { cerrado: true, cierreRemoto: true });
  e.supabase.fallarRenovar(() => new Response('', { status: 503 }));
  r = await e.run('/api/acceso/salir', { method: 'POST', data: {}, cookies: tarro });
  assert.deepEqual(await r.json(), { cerrado: true, cierreRemoto: false });
  assert.deepEqual(r.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
  await sinTokens(e);
});

test('borrar la cuenta borra las dos cookies (la base quita sus sesiones con ella)', async () => {
  const e = entorno(); const { tarro } = await entrar(e, true);
  const r = await e.run('/api/acceso/datos', { method: 'POST', data: { ruta: '/rpc/borrar_mi_cuenta', metodo: 'POST', cuerpo: {} }, cookies: tarro });
  assert.equal(r.status, 200);
  assert.deepEqual(r.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
  assert.ok([...e.supabase.sesiones.values()].every(s => !s.activa));
  await sinTokens(e);
});

test('reautenticar conserva lo elegido al entrar y deja las dos cookies de la sesión nueva', async () => {
  for (const mantener of [true, false]) {
    const e = entorno(); const { tarro } = await entrar(e, mantener);
    const r = await e.run('/api/acceso/reautenticar', { method: 'POST', data: { clave: CLAVE }, cookies: tarro });
    assert.equal(r.status, 200);
    const c = leerSetCookie(r);
    assert.equal(c['__Host-rwadar-renovar'].valor.slice(0, 2), mantener ? 'p.' : 's.');
    assert.notEqual(c['__Host-rwadar-renovar'].valor, tarro['__Host-rwadar-renovar']);
    assert.equal(c['__Host-rwadar-acceso'].atributos.includes('Max-Age=3600'), mantener);
    await sinTokens(e);
  }
});

test('la Academy abre la lección con la sesión renovada y la manda a entrar si la renovación ya no vale', async () => {
  const HTML = 'text/html,application/xhtml+xml';
  const e = entorno(); const { tarro } = await entrar(e, true);
  e.reloj.ahora += 3600 * 1000;
  delete tarro['__Host-rwadar-acceso'];
  const r = await e.run('/academy/' + LECCION, { accept: HTML, cookies: tarro });
  assert.equal(r.status, 200); assert.equal(await r.clone().text(), 'LECCION');
  assert.deepEqual(e.servidas, ['/academy/' + LECCION]);
  assert.equal(r.headers.get('cache-control'), 'private, no-store'); assert.equal(r.headers.get('vary'), 'Cookie');
  const c = leerSetCookie(r);
  assert.deepEqual(Object.keys(c), ['__Host-rwadar-acceso', '__Host-rwadar-renovar']);
  assert.equal(c['__Host-rwadar-renovar'].valor.slice(0, 2), 'p.');
  // Con la sesión cerrada en Supabase, se borra y se manda a entrar.
  for (const s of e.supabase.sesiones.values()) s.activa = false;
  e.reloj.ahora += 3600 * 1000;
  const fuera = await e.run('/academy/' + LECCION, { accept: HTML, cookies: aplicar(tarro, r) });
  assert.equal(fuera.status, 303); assert.equal(fuera.headers.get('location'), '/acceso?volver=/academy/' + LECCION);
  assert.deepEqual(fuera.headers.getSetCookie(), [BORRAR_PASE, BORRAR_RENOVAR]);
  assert.deepEqual(e.servidas, ['/academy/' + LECCION]);
});

test('la cartera usa el pase renovado y devuelve sus cookies', async () => {
  const e = entorno(); const { tarro } = await entrar(e, false);
  e.reloj.ahora += 3600 * 1000;
  const r = await e.run('/api/acceso/cartera', { cookies: tarro, headers: { 'x-rwadar-usuario': UID } });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { posiciones: [], version: 0 });
  const c = leerSetCookie(r);
  assert.equal(e.supabase.llamadas.at(-1).bearer, c['__Host-rwadar-acceso'].valor);
  assert.equal(e.supabase.renovaciones().length, 1);
});

test('el enlace del correo y el tutorial de la app dejan solo el pase y borran la cookie de renovar', async () => {
  const e = entorno(); const { r: entrada } = await entrar(e, true);
  const access = leerSetCookie(entrada)['__Host-rwadar-acceso'].valor;
  const adoptar = await e.run('/api/acceso/adoptar', { method: 'POST', data: { access_token: access, confirmarIdentidad: true } });
  assert.equal(adoptar.status, 200);
  assert.deepEqual(adoptar.headers.getSetCookie(), ['__Host-rwadar-acceso=' + access + ATRIBUTOS, BORRAR_RENOVAR]);
  const tutorial = await e.run('/api/acceso/tutorial', { headers: { authorization: 'Bearer ' + access } });
  assert.equal(tutorial.status, 200);
  assert.deepEqual(tutorial.headers.getSetCookie(), ['__Host-rwadar-acceso=' + access + ATRIBUTOS, BORRAR_RENOVAR]);
});

test('el _worker.js compilado entrega las dos cookies, cada una en su cabecera', async () => {
  const reloj = { ahora: Date.now() }, supabase = crearSupabase(reloj), original = globalThis.fetch;
  let worker;
  try {
    globalThis.fetch = supabase.fetchImpl;
    worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker()).toString('base64') + '#sesion-mantenida')).default;
  } finally { globalThis.fetch = original; }
  const r = await worker.fetch(new Request(ORIGIN + '/api/acceso/entrar', { method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify({ correo: CORREO, clave: CLAVE, mantener: true }) }), {}, { waitUntil() {} });
  assert.equal(r.status, 200);
  const cookies = r.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /^__Host-rwadar-acceso=[^;,]+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600$/);
  assert.match(cookies[1], new RegExp('^__Host-rwadar-renovar=p\\.r\\d{11}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + TREINTA_DIAS + '$'));
  assert.equal(r.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.doesNotMatch(await r.text(), /access_token|refresh_token|r\d{11}/);
});
