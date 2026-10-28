const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.RWADAR_SESION_BASE || path.resolve(__dirname, '..');
const raiz = process.env.RWADAR_SESION_FUENTE || base;
const sdk = require(path.join(base, 'node_modules/@supabase/supabase-js'));
const { crearControladorCuentas, crearClienteCuentas } = require(path.join(raiz, 'lib/cuentas.js'));
const { crearAlmacenSesion } = require(path.join(raiz, 'lib/almacen-sesion.js'));
const UID = '11111111-1111-4111-8111-111111111111';
const user = { id: UID, email: 'prueba@ejemplo.test', email_confirmed_at: '2026-10-28T08:00:00Z',
  aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, identities: [] };
const tick = () => new Promise(resolve => setImmediate(resolve));
function diferida() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function entorno() {
  const valores = new Map(), clientes = [];
  const seguro = { getItemAsync: async k => valores.get(k) ?? null,
    setItemAsync: async (k, v) => { valores.set(k, v); }, deleteItemAsync: async k => { valores.delete(k); } };
  const almacen = crearAlmacenSesion({ secureStore: seguro });
  const control = { pendiente: null, red: false, revocada: false, usuarios: 0, denegada: false };
  let n = 0;
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status,
    headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' } });
  const jwt = numero => {
    const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: UID, role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600, n: numero }) + '.firma_sintetica';
  };
  const fetchImpl = async (direccion, opciones = {}) => {
    const url = new URL(direccion);
    if (control.red) throw new TypeError('red de prueba');
    if (url.pathname === '/auth/v1/token') {
      if (control.revocada) return json({ code: 'refresh_token_not_found', message: 'revocada' }, 400);
      n++;
      return json({ access_token: jwt(n), refresh_token: 'refresh-sintetico-' + n,
        token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
    }
    if (url.pathname === '/auth/v1/user') {
      control.usuarios++;
      const espera = control.pendiente; control.pendiente = null;
      if (espera) { espera.iniciada.resolve(); await espera.terminar.promise;
        return json({ code: 'bad_jwt', message: 'JWT expired' }, 401); }
      if (control.revocada) return json({ code: 'session_not_found', message: 'revocada' }, 401);
      if (control.denegada) return json({ code: 'bad_jwt', message: 'JWT rechazado' }, 401);
      return json(user);
    }
    if (url.pathname === '/rest/v1/mi_perfil') return json([{ id: UID, nombre: 'Prueba' }]);
    if (url.pathname === '/rest/v1/vigilancia') return json([]);
    if (url.pathname === '/auth/v1/logout') return json({});
    throw new Error('Ruta local no prevista: ' + url.pathname);
  };
  const a = crearControladorCuentas({ modoLocal: false, cuentasRemotas: true, correoVerificado: true,
    plazoMs: 800, almacenSesion: almacen,
    crearCliente(opciones) { const cliente = crearClienteCuentas({ ...opciones, fetchImpl, createClient: sdk.createClient }); clientes.push(cliente); return cliente; } });
  async function entrar() { assert.equal((await a.entrar({ correo: user.email, clave: 'prueba-ficticia-larga' })).ok, true); a.suspender(); }
  async function limpiar() { a.destruir(); for (const c of clientes) await c.auth.dispose(); }
  return { a, almacen, control, clientes, entrar, limpiar };
}

test('una respuesta 401 del JWT anterior no expulsa una sesion ya renovada y validada', async () => {
  const e = entorno();
  try {
    await e.entrar();
    const espera = { iniciada: diferida(), terminar: diferida() }; e.control.pendiente = espera;
    const consulta = e.a.clienteCatalogo();
    await espera.iniciada.promise;
    assert.equal((await e.clientes[0].auth.refreshSession()).error, null);
    await tick();
    const rotada = await e.almacen.leer();
    espera.terminar.resolve();
    await consulta.catch(() => null);
    assert.equal(e.a.estado().usuario?.id, UID);
    assert.deepEqual(await e.almacen.leer(), rotada);
  } finally { await e.limpiar(); }
});

test('la revocacion real sigue retirando identidad y almacenamiento', async () => {
  const e = entorno();
  try {
    await e.entrar(); e.control.revocada = true;
    await assert.rejects(e.a.clienteCatalogo()); await tick();
    assert.equal(e.a.estado().usuario, null); assert.equal(await e.almacen.leer(), null);
  } finally { await e.limpiar(); }
});

test('el refresco de primer plano conserva la rotacion mientras llega un 401 anterior', async () => {
  const e = entorno();
  try {
    await e.entrar();
    const espera = { iniciada: diferida(), terminar: diferida() }; e.control.pendiente = espera;
    const consulta = e.a.refrescar(); await espera.iniciada.promise;
    assert.equal((await e.clientes[0].auth.refreshSession()).error, null); await tick();
    espera.terminar.resolve();
    assert.equal((await consulta).ok, true); assert.equal(e.a.estado().usuario?.id, UID);
    assert.equal((await e.almacen.leer())?.usuarioId, UID);
  } finally { await e.limpiar(); }
});

test('el JWT renovado tambien rechazado no se reintenta sin limite ni conserva acceso', async () => {
  const e = entorno();
  try {
    await e.entrar();
    const antes = e.control.usuarios;
    const espera = { iniciada: diferida(), terminar: diferida() }; e.control.pendiente = espera;
    const consulta = e.a.clienteCatalogo(); await espera.iniciada.promise;
    assert.equal((await e.clientes[0].auth.refreshSession()).error, null); await tick();
    e.control.denegada = true; espera.terminar.resolve();
    await assert.rejects(consulta); await tick();
    assert.equal(e.control.usuarios - antes, 2);
    assert.equal(e.a.estado().usuario, null); assert.equal(await e.almacen.leer(), null);
  } finally { await e.limpiar(); }
});

test('sin renovacion concurrente se rechaza 401 y se borra la sesion una vez', async () => {
  const e = entorno();
  try {
    await e.entrar(); const antes = e.control.usuarios; e.control.denegada = true;
    await assert.rejects(e.a.clienteCatalogo());
    assert.equal(e.control.usuarios - antes, 1);
    assert.equal(e.a.estado().usuario, null); assert.equal(await e.almacen.leer(), null);
  } finally { await e.limpiar(); }
});
