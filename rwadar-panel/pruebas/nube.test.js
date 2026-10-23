/* RWAdar · panel en la nube · pruebas del Worker sin subir nada.
   Se ejecuta el mismo código que correrá en Cloudflare (nube/manejador.mjs)
   con un ASSETS y un KV de mentira, el simulador de servicios y pases de
   Cloudflare Access firmados aquí con una clave propia. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const { crearSimulador, entornoPanel } = require('../demo/simulador');
const { leerPublicos } = require('../lib/config');

const { subtle } = webcrypto;
const AUD = 'aud-de-pruebas';
const DIR_PUBLICO = path.join(__dirname, '..', 'publico');
const b64url = datos => Buffer.from(datos).toString('base64url');

async function claveRsa(kid) {
  const par = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  return { privada: par.privateKey, jwk: { ...(await subtle.exportKey('jwk', par.publicKey)), kid, alg: 'RS256', use: 'sig' } };
}

async function pase(clave, kid, datos) {
  const cabeza = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify(datos));
  const firma = await subtle.sign('RSASSA-PKCS1-v1_5', clave.privada, Buffer.from(`${cabeza}.${cuerpo}`));
  return `${cabeza}.${cuerpo}.${b64url(new Uint8Array(firma))}`;
}

function kvFalso() {
  const datos = new Map();
  return {
    datos,
    async get(k, tipo) { const v = datos.get(k)?.valor; return v == null ? null : tipo === 'json' ? JSON.parse(v) : v; },
    async put(k, valor, opciones = {}) { datos.set(k, { valor, metadata: opciones.metadata }); },
    async delete(k) { datos.delete(k); },
    async list({ prefix = '', limit = 1000 }) {
      const keys = [...datos.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit).map(name => ({ name, metadata: datos.get(name).metadata }));
      return { keys, list_complete: true };
    },
  };
}

const ASSETS = {
  async fetch(peticion) {
    const ruta = new URL(peticion.url).pathname;
    /* Como Cloudflare: «/entrar» sirve entrar.html. */
    const archivo = path.join(DIR_PUBLICO, ruta === '/' ? 'index.html' : path.extname(ruta) ? ruta.slice(1) : `${ruta.slice(1)}.html`);
    if (!archivo.startsWith(DIR_PUBLICO) || !fs.existsSync(archivo)) return new Response('no', { status: 404 });
    return new Response(fs.readFileSync(archivo), { headers: { 'Content-Type': archivo.endsWith('.css') ? 'text/css' : 'text/html' } });
  },
};

async function montar({ sinAud = false } = {}) {
  const buena = await claveRsa('k1');
  const ajena = await claveRsa('k2');
  const { servidor, estado } = crearSimulador({ jwks: [buena.jwk] });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const emisor = `${base}/access`;
  const kv = kvFalso();
  const env = {
    ...entornoPanel(base),
    TEAM_DOMAIN: emisor, POLICY_AUD: sinAud ? '' : AUD, PANEL_PRUEBAS: '1',
    PANEL_SOCIOS: 'victor@example.com, ERIC@example.com', PANEL_SECRETO: 'secreto-de-pruebas-'.repeat(4),
    ASSETS, ALMACEN: kv,
  };
  const { crearManejador } = await import('../nube/manejador.mjs');
  const worker = crearManejador(leerPublicos());
  const ahora = Math.floor(Date.now() / 1000);
  const firmar = (datos, clave = buena, kid = 'k1') => pase(clave, kid, { iss: emisor, aud: [AUD], iat: ahora, exp: ahora + 3600, ...datos });
  const ORIGEN = 'https://rwadar-panel.ejemplo.workers.dev';
  const pedir = async (ruta, { jwt, metodo = 'GET', cuerpo, sesion, origen } = {}) => {
    const cabeceras = {};
    if (jwt) cabeceras['Cf-Access-Jwt-Assertion'] = jwt;
    if (sesion) cabeceras['X-Panel-Token'] = sesion;
    if (cuerpo) cabeceras['Content-Type'] = 'application/json';
    if (origen) cabeceras.Origin = origen;
    return worker.fetch(new Request(ORIGEN + ruta, { method: metodo, headers: cabeceras, body: cuerpo ? JSON.stringify(cuerpo) : undefined }), env);
  };
  const entrar = async email => {
    const jwt = await firmar({ email });
    const html = await (await pedir('/', { jwt })).text();
    const sesion = html.match(/name="panel-token" content="([0-9a-f]{64})"/)?.[1];
    const api = async (ruta, opciones = {}) => {
      const r = await pedir(ruta, { jwt, sesion, ...opciones });
      return { estado: r.status, ...(await r.json()) };
    };
    return { jwt, sesion, api };
  };
  return { estado, kv, env, pedir, firmar, ajena, entrar, ORIGEN, cerrar: () => new Promise(r => servidor.close(r)) };
}

test('sin pase de Access no se ve nada, ni la página ni la API', async () => {
  const n = await montar();
  try {
    const pagina = await n.pedir('/');
    assert.equal(pagina.status, 401);
    assert.match(await pagina.text(), /Cloudflare te pedirá tu correo/);
    assert.equal((await n.pedir('/api/cuentas')).status, 401);
    assert.equal((await n.pedir('/vistas.js')).status, 401);
    assert.equal((await n.pedir('/panel.css')).status, 200, 'el aspecto de la puerta sí es público');
  } finally { await n.cerrar(); }
});

test('si falta configurar Access el panel sube cerrado', async () => {
  const n = await montar({ sinAud: true });
  try {
    const r = await n.pedir('/', { jwt: await n.firmar({ email: 'victor@example.com' }) });
    assert.equal(r.status, 503);
    assert.match(await r.text(), /todavía no está configurado/);
  } finally { await n.cerrar(); }
});

test('pases falsos, caducados, de otro panel o de alguien fuera de la lista no entran', async () => {
  const n = await montar();
  try {
    const casos = {
      'otra clave': await n.firmar({ email: 'victor@example.com' }, n.ajena, 'k2'),
      'otra clave con kid bueno': await n.firmar({ email: 'victor@example.com' }, n.ajena, 'k1'),
      caducado: await n.firmar({ email: 'victor@example.com', exp: Math.floor(Date.now() / 1000) - 10 }),
      'otro panel': await n.firmar({ email: 'victor@example.com', aud: ['otra-aplicacion'] }),
      'otro emisor': await n.firmar({ email: 'victor@example.com', iss: 'https://malo.cloudflareaccess.com' }),
      basura: 'a.b.c',
    };
    for (const [nombre, jwt] of Object.entries(casos)) assert.equal((await n.pedir('/api/ajustes', { jwt })).status, 403, nombre);
    const intruso = await n.pedir('/', { jwt: await n.firmar({ email: 'intruso@example.com' }) });
    assert.equal(intruso.status, 403);
    assert.match(await intruso.text(), /no está en la lista de socios/);
  } finally { await n.cerrar(); }
});

test('un socio entra, ve quién es y la dirección para compartir', async () => {
  const n = await montar();
  try {
    const eric = await n.entrar('eric@example.com');
    assert.match(eric.sesion, /^[0-9a-f]{64}$/);
    const pagina = await n.pedir('/', { jwt: eric.jwt });
    assert.match(pagina.headers.get('content-security-policy'), /script-src 'self';/);
    assert.equal(pagina.headers.get('x-robots-tag'), 'noindex, nofollow');
    const css = await n.pedir('/panel.css', { jwt: eric.jwt });
    assert.equal(css.status, 200);
    assert.equal(css.headers.get('x-frame-options'), 'DENY');
    const { datos } = await eric.api('/api/ajustes');
    assert.equal(datos.modo, 'nube');
    assert.equal(datos.quien, 'eric@example.com');
    assert.equal(datos.urlNube, n.ORIGEN);
    assert.equal(datos.puedeAFondo, false);
    assert.equal(datos.archivoEnv, null);
    assert.equal((await n.pedir('/api/ajustes', { jwt: eric.jwt })).status, 403, 'sin la contraseña de la página no');
    const victor = await n.entrar('victor@example.com');
    assert.notEqual(victor.sesion, eric.sesion, 'cada socio tiene su propia sesión');
    assert.equal((await n.pedir('/api/ajustes', { jwt: victor.jwt, sesion: eric.sesion })).status, 403);
  } finally { await n.cerrar(); }
});

test('lo que hace un socio queda en el registro con su correo', async () => {
  const n = await montar();
  try {
    const eric = await n.entrar('eric@example.com');
    const cuenta = n.estado.cuentas[5];
    const ajena = await eric.api(`/api/cuentas/${cuenta.id}/borrar`, { metodo: 'POST', cuerpo: { confirmacion: cuenta.email }, origen: 'https://atacante.example' });
    assert.equal(ajena.estado, 400);
    const r = await eric.api(`/api/cuentas/${cuenta.id}/borrar`, { metodo: 'POST', cuerpo: { confirmacion: cuenta.email }, origen: n.ORIGEN });
    assert.equal(r.estado, 200, r.error);
    assert.ok(!n.estado.cuentas.some(c => c.id === cuenta.id));
    const victor = await n.entrar('victor@example.com');
    const { datos: registro } = await victor.api('/api/registro');
    assert.equal(registro[0].quien, 'eric@example.com');
    assert.equal(registro[0].objetivo, cuenta.email);
    assert.equal(registro[0].accion, 'Borrar cuenta');
  } finally { await n.cerrar(); }
});

/* ---------- Enlaces personales (sin cuentas ni códigos) ---------- */

async function montarEnlaces() {
  const { prepararEnlaces, huella } = await import('../nube/publicar.mjs');
  const enlaces = prepararEnlaces(['Víctor', 'Eric']);
  const { servidor, estado } = crearSimulador();
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const kv = kvFalso();
  const env = {
    ...entornoPanel(base),
    PANEL_ENLACES: JSON.stringify(Object.fromEntries(Object.entries(enlaces).map(([n, llave]) => [n, huella(llave)]))),
    PANEL_SECRETO: 'secreto-de-pruebas-enlaces',
    ASSETS, ALMACEN: kv,
  };
  const { crearManejador } = await import('../nube/manejador.mjs');
  const worker = crearManejador(leerPublicos());
  const ORIGEN = 'https://rwadar-panel.ejemplo.workers.dev';
  const pedir = (ruta, { metodo = 'GET', cuerpo, cookie, sesion, origen } = {}) => {
    const cabeceras = {};
    if (cookie) cabeceras.Cookie = cookie;
    if (sesion) cabeceras['X-Panel-Token'] = sesion;
    if (cuerpo) cabeceras['Content-Type'] = 'application/json';
    if (origen) cabeceras.Origin = origen;
    return worker.fetch(new Request(ORIGEN + ruta, { method: metodo, headers: cabeceras, body: cuerpo ? JSON.stringify(cuerpo) : undefined }), env);
  };
  const abrirEnlace = async llave => {
    const r = await pedir('/api/entrar', { metodo: 'POST', cuerpo: { llave }, origen: ORIGEN });
    const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
    return { r, cookie, setCookie: r.headers.get('set-cookie') || '' };
  };
  return { enlaces, estado, env, kv, worker, pedir, abrirEnlace, ORIGEN, cerrar: () => new Promise(r => servidor.close(r)) };
}

test('con su enlace un socio entra sin cuenta y queda dentro con una cookie segura', async () => {
  const n = await montarEnlaces();
  try {
    const sinNada = await n.pedir('/');
    assert.equal(sinNada.status, 401);
    assert.match(await sinNada.text(), /enlace personal/);
    const puerta = await n.pedir('/entrar');
    assert.equal(puerta.status, 200, 'la puerta se ve sin haber entrado');
    assert.match(await puerta.text(), /entrar\.js/);
    assert.equal((await n.pedir('/vistas.js')).status, 401, 'el resto no');
    const { r, cookie, setCookie } = await n.abrirEnlace(n.enlaces.Eric);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).datos.quien, 'Eric');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /Secure/);
    assert.match(setCookie, /SameSite=Strict/);
    assert.ok(!setCookie.includes(n.enlaces.Eric), 'la llave no va en la cookie');
    const html = await (await n.pedir('/', { cookie })).text();
    const sesion = html.match(/name="panel-token" content="([0-9a-f]{64})"/)?.[1];
    assert.ok(sesion);
    const ajustes = await (await n.pedir('/api/ajustes', { cookie, sesion })).json();
    assert.equal(ajustes.datos.quien, 'Eric');
    assert.deepEqual(ajustes.datos.enlaces, [], 'en la nube nadie ve los enlaces de los demás');
    const registro = await (await n.pedir('/api/registro', { cookie, sesion })).json();
    assert.equal(registro.datos[0].accion, 'Entrar al panel con su enlace');
    assert.equal(registro.datos[0].quien, 'Eric');
  } finally { await n.cerrar(); }
});

test('un enlace falso, una cookie retocada o de otra web no entran', async () => {
  const n = await montarEnlaces();
  try {
    assert.equal((await n.abrirEnlace('x'.repeat(43))).r.status, 403);
    assert.equal((await n.abrirEnlace('corta')).r.status, 403);
    const ajena = await n.pedir('/api/entrar', { metodo: 'POST', cuerpo: { llave: n.enlaces.Eric }, origen: 'https://atacante.example' });
    assert.equal(ajena.status, 400);
    const { cookie } = await n.abrirEnlace(n.enlaces.Eric);
    const [nombre, expira, huellaCorta, firma] = cookie.split('=')[1].split('.');
    const comoVictor = `rwadar_panel=${Buffer.from('Víctor').toString('base64url')}.${expira}.${huellaCorta}.${firma}`;
    assert.equal((await n.pedir('/', { cookie: comoVictor })).status, 403, 'cambiar el nombre rompe la firma');
    const alargada = `rwadar_panel=${nombre}.${Number(expira) + 999999}.${huellaCorta}.${firma}`;
    assert.equal((await n.pedir('/', { cookie: alargada })).status, 403, 'alargar la caducidad también');
  } finally { await n.cerrar(); }
});

test('anular el enlace de alguien le saca aunque ya hubiera entrado', async () => {
  const n = await montarEnlaces();
  try {
    const { cookie } = await n.abrirEnlace(n.enlaces.Eric);
    assert.equal((await n.pedir('/', { cookie })).status, 200);
    const { huella } = await import('../nube/publicar.mjs');
    n.env.PANEL_ENLACES = JSON.stringify({ 'Víctor': huella(n.enlaces['Víctor']), Eric: huella('llave-nueva-de-eric-'.repeat(3)) });
    const fuera = await n.pedir('/', { cookie });
    assert.equal(fuera.status, 403);
    assert.match(await fuera.text(), /ya no funciona/);
    assert.equal((await n.abrirEnlace(n.enlaces.Eric)).r.status, 403, 'el enlace viejo tampoco');
    const victor = await n.abrirEnlace(n.enlaces['Víctor']);
    assert.equal((await n.pedir('/', { cookie: victor.cookie })).status, 200, 'a los demás no les afecta');
  } finally { await n.cerrar(); }
});

test('la sesión se renueva sola al abrir el panel: el mismo enlace vale para siempre', async () => {
  const n2 = await montarEnlaces();
  try {
    const { cookie } = await n2.abrirEnlace(n2.enlaces.Eric);
    const r = await n2.pedir('/', { cookie });
    assert.equal(r.status, 200);
    const renovada = r.headers.get('set-cookie') || '';
    assert.match(renovada, /^rwadar_panel=/);
    assert.match(renovada, /Max-Age=7776000/);
    assert.match(renovada, /HttpOnly/);
    assert.equal((await n2.pedir('/', { cookie: renovada.split(';')[0] })).status, 200, 'la renovada vale');
    assert.equal((await n2.abrirEnlace(n2.enlaces.Eric)).r.status, 200, 'y el enlace de siempre sigue valiendo');
  } finally { await n2.cerrar(); }
});

test('el cron de cada hora apunta el uso de la app y las descargas en KV', async () => {
  const n = await montarEnlaces();
  try {
    const promesas = [];
    await n.worker.scheduled({}, n.env, { waitUntil: p => promesas.push(p) });
    const resultado = await Promise.all(promesas);
    assert.deepEqual(resultado[0], { descargas: 'fulfilled', uso: 'fulfilled', visitas: 'fulfilled' });
    const claves = [...n.kv.datos.keys()];
    assert.ok(claves.some(k => k.startsWith('estado:uso-app-')));
    assert.ok(claves.some(k => k.startsWith('estado:descargas-')));
    assert.ok(claves.some(k => k.startsWith('estado:visitas-')), 'también las visitas exactas del día');
  } finally { await n.cerrar(); }
});
