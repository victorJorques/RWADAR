/* =====================================================================
   RWAdar · ensayo de cuentas en la web, de extremo a extremo (sin red)
   ---------------------------------------------------------------------
   Abre la web REAL (rwadar-site) en Chromium con las cuentas encendidas
   (solo en memoria: el archivo del repositorio no se toca) y la hace hablar
   con un Supabase de mentira montado sobre un Postgres embebido que lleva
   la misma cadena que producción más la migración 26.

   Recorre lo que hará una persona: crear cuenta, intentar entrar sin
   confirmar, abrir el enlace del correo, vigilar una plataforma, ponerse
   nombre, salir, volver a entrar y encontrar su lista, recuperar la
   contraseña, entrar desde el móvil y borrar la cuenta. Comprueba además
   que opiniones, moderación y avisos por correo siguen ocultos y que la
   CSP de producción no bloquea nada. Al final, con la comprobación
   anti-robots (Turnstile) encendida contra un Supabase que la exige.

   No es la prueba real del correo: el «buzón» es una lista en memoria.
   Esa prueba solo puede hacerse en Supabase con el SMTP configurado
   (docs/tareas/REABRIR-CUENTAS.md, paso 5).

       node ensayo-cuentas-web.mjs [carpeta-de-capturas]

   Necesita Playwright con Chromium (no forma parte de npm test).
   ===================================================================== */
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseCompleta, filas, sesion } from './pruebas-soporte.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const SITIO = path.join(RAIZ, 'rwadar-site');
const WEB = 'https://rwadar.pages.dev';
const SUPA = 'https://exgpmjpaaebyoolpwced.supabase.co';
const RUTA_MANUAL = '/descargas/como-usar-rwadar.pdf';
const PDF_MANUAL = path.join(RAIZ, 'docs', 'manual', 'RWAdar_Como_Usar_RWAdar_2026_corregido.pdf');
const TURNSTILE = 'https://challenges.cloudflare.com';
const SITEKEY_PRUEBA = '1x00000000000000000000AA'; // clave de prueba pública de Cloudflare
const CAPTURAS = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'rwadar-ensayo-cuentas'));
fs.mkdirSync(CAPTURAS, { recursive: true });

function cargarPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  const global = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return createRequire(path.join(global, 'noop.js'))('playwright');
}
const { chromium } = cargarPlaywright();

const ok = [], fail = [];
const paso = (texto, condicion) => {
  (condicion ? ok : fail).push(texto);
  console.log(`  ${condicion ? 'OK   ' : 'FALLO'} ${texto}`);
};

/* --- la base: misma cadena que producción + 26 ---------------------- */
process.chdir(AQUI);
const db = await baseCompleta();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql',
  'db/26_reabrir_cuentas.sql', 'db/27_comunidad.sql']) {
  await db.exec(fs.readFileSync(archivo, 'utf8'));
}

/* PGlite es una sola conexión: las peticiones se atienden de una en una. */
let cola = Promise.resolve();
const enCola = (fn) => { const r = cola.then(fn, fn); cola = r.catch(() => {}); return r; };
const comoUsuario = (uid, fn) => enCola(async () => {
  await sesion(db, uid, 'authenticated');
  try { return await fn(); } finally { await sesion(db); }
});

/* --- Auth de mentira (mismo contrato que GoTrue para lo que usa la web) */
const claves = new Map();     // email -> contraseña
const testigos = new Map();   // access_token -> uid
const renovaciones = new Map();
const enlaces = new Map();    // token de correo -> {uid, tipo}
const buzon = [];             // correos «enviados»

const usuarioPorCorreo = async (email) =>
  (await enCola(() => filas(db, 'select id, email, email_confirmed_at from auth.users where email=$1', [email])))[0];
const nuevaSesion = (usuario) => {
  const access = 'at_' + crypto.randomBytes(18).toString('hex');
  const refresh = 'rt_' + crypto.randomBytes(18).toString('hex');
  testigos.set(access, usuario.id); renovaciones.set(refresh, usuario.id);
  return { access_token: access, token_type: 'bearer', expires_in: 3600, refresh_token: refresh,
    user: { id: usuario.id, email: usuario.email } };
};
const enviarCorreo = (usuario, tipo, vuelta) => {
  const token = crypto.randomBytes(16).toString('hex');
  enlaces.set(token, { uid: usuario.id, tipo });
  buzon.push({ para: usuario.email, tipo,
    enlace: `${SUPA}/auth/v1/verify?token=${token}&type=${tipo}&redirect_to=${encodeURIComponent(vuelta || WEB + '/')}` });
};

const CORS = {
  'access-control-allow-origin': WEB,
  'access-control-allow-headers': 'apikey, authorization, content-type, prefer, x-client-info',
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-expose-headers': 'content-range',
};
const json = (status, cuerpo) => ({ status, headers: { ...CORS, 'content-type': 'application/json' },
  body: cuerpo === undefined ? '' : JSON.stringify(cuerpo) });
const uidDe = (peticion) => testigos.get(String(peticion.headers().authorization || '').replace(/^Bearer /, ''));
const errorPg = (e) => {
  const codigo = e?.code || '';
  const estado = codigo === '42501' ? 403 : ['42703', '22P02', 'P0001', '23514'].includes(codigo) ? 400 : 500;
  return json(estado, { code: codigo, message: e?.message || 'error' });
};

/* Anti-robots: con captchaExigido, Auth se comporta como Supabase con
   Attack Protection encendido: alta, entrada con contraseña, recuperación y
   reenvío exigen gotrue_meta_security.captcha_token, y cada testigo vale una
   sola vez. */
let captchaExigido = false;
const testigosRobot = [];
const RUTAS_CON_ROBOT = new Set(['/signup', '/recover', '/resend']);
async function atenderAuth(peticion, url) {
  const ruta = url.pathname.replace('/auth/v1', '');
  const cuerpo = peticion.postDataJSON?.() || {};
  const vuelta = url.searchParams.get('redirect_to');
  if (captchaExigido && (RUTAS_CON_ROBOT.has(ruta) ||
      (ruta === '/token' && url.searchParams.get('grant_type') === 'password'))) {
    const t = cuerpo.gotrue_meta_security?.captcha_token;
    if (!/^tt_[0-9a-f]{16}$/.test(t || '') || testigosRobot.some((x) => x.t === t))
      return json(400, { code: 400, error_code: 'captcha_failed',
        msg: t ? 'captcha protection: request disallowed (invalid-input-response)' : 'captcha protection: request disallowed (no captcha response)' });
    testigosRobot.push({ ruta, t });
  }
  if (ruta === '/signup') {
    if (await usuarioPorCorreo(cuerpo.email)) return json(422, { msg: 'User already registered' });
    if (String(cuerpo.password || '').length < 12) return json(422, { msg: 'Password should be at least 12 characters' });
    const [usuario] = await enCola(() => filas(db,
      `insert into auth.users(email, email_confirmed_at, raw_user_meta_data) values ($1, null, $2) returning id, email`,
      [cuerpo.email, JSON.stringify(cuerpo.data || {})]));
    claves.set(cuerpo.email, cuerpo.password);
    enviarCorreo(usuario, 'signup', vuelta);
    return json(200, { id: usuario.id, email: usuario.email, confirmation_sent_at: new Date().toISOString() });
  }
  if (ruta === '/verify') {
    const enlace = enlaces.get(url.searchParams.get('token'));
    const destino = new URL(url.searchParams.get('redirect_to') || WEB + '/');
    if (!enlace) { destino.hash = 'error=access_denied&error_description=Email+link+is+invalid+or+has+expired'; }
    else {
      enlaces.delete(url.searchParams.get('token'));
      if (enlace.tipo === 'signup') await enCola(() => db.query('update auth.users set email_confirmed_at=now() where id=$1', [enlace.uid]));
      const [usuario] = await enCola(() => filas(db, 'select id, email from auth.users where id=$1', [enlace.uid]));
      const s = nuevaSesion(usuario);
      destino.hash = new URLSearchParams({ access_token: s.access_token, expires_in: '3600',
        refresh_token: s.refresh_token, token_type: 'bearer', type: enlace.tipo }).toString();
    }
    return { status: 303, headers: { location: destino.toString() }, body: '' };
  }
  if (ruta === '/token') {
    if (url.searchParams.get('grant_type') === 'refresh_token') {
      const uid = renovaciones.get(cuerpo.refresh_token);
      if (!uid) return json(400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token' });
      const [usuario] = await enCola(() => filas(db, 'select id, email from auth.users where id=$1', [uid]));
      return usuario ? json(200, nuevaSesion(usuario)) : json(400, { error_description: 'Invalid Refresh Token' });
    }
    const usuario = await usuarioPorCorreo(cuerpo.email);
    if (!usuario || claves.get(cuerpo.email) !== cuerpo.password)
      return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
    if (!usuario.email_confirmed_at) return json(400, { error: 'invalid_grant', error_description: 'Email not confirmed' });
    return json(200, nuevaSesion(usuario));
  }
  if (ruta === '/user') {
    const uid = uidDe(peticion);
    const [usuario] = uid ? await enCola(() => filas(db, 'select id, email, email_confirmed_at from auth.users where id=$1', [uid])) : [];
    if (!usuario) return json(401, { msg: 'invalid JWT' });
    if (peticion.method() === 'PUT') {
      if (String(cuerpo.password || '').length < 12) return json(422, { msg: 'Password should be at least 12 characters' });
      claves.set(usuario.email, cuerpo.password);
    }
    return json(200, { id: usuario.id, email: usuario.email, email_confirmed_at: usuario.email_confirmed_at, is_anonymous: false });
  }
  if (ruta === '/recover') {
    const usuario = await usuarioPorCorreo(cuerpo.email);
    if (usuario) enviarCorreo(usuario, 'recovery', vuelta);
    return json(200, {});
  }
  if (ruta === '/resend') return json(200, {});
  if (ruta === '/logout') {
    testigos.delete(String(peticion.headers().authorization || '').replace(/^Bearer /, ''));
    return json(204);
  }
  return json(404, { msg: 'no existe ' + ruta });
}

/* --- PostgREST de mentira: solo las rutas que usa el módulo Cuenta ----- */
async function atenderRest(peticion, url) {
  const uid = uidDe(peticion);
  /* La comunidad se lee sin sesión, con el rol anon y sus permisos reales. */
  if (peticion.method() === 'GET' && url.pathname === '/rest/v1/publicaciones') {
    try {
      return json(200, await enCola(async () => {
        await sesion(db, null, 'anon');
        try { return await filas(db, 'select id, autor, texto, creada_el from publicaciones order by creada_el desc limit 30'); }
        finally { await sesion(db); }
      }));
    } catch (e) { return errorPg(e); }
  }
  /* Sin sesión (lecturas del catálogo): 503 y la web usa su copia embebida. */
  if (!uid) return json(503, { message: 'catálogo no simulado en este ensayo' });
  const ruta = url.pathname.replace('/rest/v1', '');
  const q = url.searchParams;
  const metodo = peticion.method();
  const cuerpo = metodo === 'GET' || metodo === 'DELETE' ? null : peticion.postDataJSON?.();
  const eq = (campo) => (q.get(campo) || '').replace(/^eq\./, '');
  try {
    const r = await comoUsuario(uid, async () => {
      if (metodo === 'GET' && ruta === '/mi_perfil') return filas(db, 'select * from mi_perfil');
      if (metodo === 'GET' && ruta === '/perfiles') {
        const columnas = (q.get('select') || 'id').split(',').map((c) => c.trim()).filter((c) => /^[a-z_]+$/.test(c));
        return filas(db, `select ${columnas.join(',')} from perfiles where id=$1`, [eq('id')]);
      }
      if (metodo === 'PATCH' && ruta === '/perfiles') {
        const cambios = Object.entries(cuerpo || {}).filter(([k]) => ['nombre', 'avisos_correo'].includes(k));
        if (!cambios.length) return [];
        return filas(db, `update perfiles set ${cambios.map(([k], i) => `${k}=$${i + 2}`).join(',')} where id=$1 returning id, nombre`,
          [eq('id'), ...cambios.map(([, v]) => v)]);
      }
      if (metodo === 'GET' && ruta === '/plataformas') return filas(db, 'select id from plataformas where nombre=$1', [eq('nombre')]);
      if (metodo === 'GET' && ruta === '/vigilancia') {
        return filas(db, `select v.plataforma_id, json_build_object('nombre', p.nombre) as plataformas
          from vigilancia v join plataformas p on p.id = v.plataforma_id`);
      }
      if (metodo === 'POST' && ruta === '/vigilancia') {
        return filas(db, 'insert into vigilancia(usuario_id, plataforma_id) values ($1,$2) returning plataforma_id',
          [cuerpo.usuario_id, cuerpo.plataforma_id]);
      }
      if (metodo === 'DELETE' && ruta === '/vigilancia') {
        return filas(db, 'delete from vigilancia where plataforma_id=$1 returning plataforma_id', [eq('plataforma_id')]);
      }
      if (metodo === 'POST' && ruta === '/rpc/publicar') {
        return filas(db, 'select * from publicar($1, $2)', [cuerpo.p_texto, !!cuerpo.p_mostrar_nombre]);
      }
      if (metodo === 'POST' && ruta === '/rpc/mis_publicaciones') return filas(db, 'select * from mis_publicaciones()');
      if (metodo === 'POST' && ruta === '/rpc/borrar_mi_publicacion') {
        return (await filas(db, 'select borrar_mi_publicacion($1) r', [cuerpo.p_id]))[0].r;
      }
      if (metodo === 'POST' && ruta === '/rpc/denunciar_publicacion') {
        return (await filas(db, 'select denunciar_publicacion($1, $2) r', [cuerpo.p_id, cuerpo.p_motivo]))[0].r;
      }
      if (metodo === 'POST' && ruta === '/rpc/marcar_manual_descargado') {
        await db.query('select marcar_manual_descargado()');
        return null;
      }
      if (metodo === 'POST' && ruta === '/rpc/borrar_mi_cuenta') {
        await db.query('select borrar_mi_cuenta()');
        return null;
      }
      throw Object.assign(new Error('ruta no simulada: ' + metodo + ' ' + ruta), { code: 'PGRST404' });
    });
    if (ruta === '/rpc/borrar_mi_cuenta') testigos.delete(String(peticion.headers().authorization || '').replace(/^Bearer /, ''));
    return json(200, r ?? null);
  } catch (e) {
    if (e.code === 'PGRST404') return json(404, { code: e.code, message: e.message });
    return errorPg(e);
  }
}

/* --- la web, servida como si fuera producción ------------------------ */
const CSP = fs.readFileSync(path.join(SITIO, '_headers'), 'utf8').match(/Content-Security-Policy: (.+)/)[1];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const jsCuentas = (() => {
  let js = fs.readFileSync(path.join(SITIO, 'assets', 'rwadar-20260820.js'), 'utf8');
  for (const [de, a] of [['const SERVICIOS_USUARIO_REMOTOS=false;', 'const SERVICIOS_USUARIO_REMOTOS=true;'],
    ['const CORREO_AUTH_E2E=false;', 'const CORREO_AUTH_E2E=true;'],
    ["const MANUAL_BIENVENIDA='';", `const MANUAL_BIENVENIDA='${RUTA_MANUAL}';`],
    ['const PUBLICACIONES_REMOTAS=false;', 'const PUBLICACIONES_REMOTAS=true;']]) {
    if (js.includes(a)) continue; // ya encendido en lo publicado (cuentas, fase 1)
    if (!js.includes(de)) throw new Error('no encuentro el interruptor ' + de);
    js = js.replace(de, a);
  }
  return js;
})();
/* Variante con el anti-robots encendido: la clave de prueba y la CSP abierta
   a Turnstile exactamente como indica docs/tareas/REABRIR-CUENTAS.md. */
const jsTurnstile = (() => {
  const de = "const TURNSTILE_SITEKEY='';";
  if (!jsCuentas.includes(de)) throw new Error('no encuentro el interruptor ' + de);
  return jsCuentas.replace(de, `const TURNSTILE_SITEKEY='${SITEKEY_PRUEBA}';`);
})();
const CSP_TURNSTILE = CSP
  .replace("frame-src 'none'", `frame-src ${TURNSTILE}`)
  .replace("script-src 'self' https://static.cloudflareinsights.com", `script-src 'self' https://static.cloudflareinsights.com ${TURNSTILE}`);
if (CSP_TURNSTILE === CSP || !CSP_TURNSTILE.includes(`frame-src ${TURNSTILE}`)) throw new Error('no he podido preparar la CSP con Turnstile');
let jsServido = jsCuentas, cspServida = CSP;
/* Turnstile de mentira: mismo contrato (render con callbacks, remove) y un
   testigo nuevo en cada render. */
let retrasoTurnstile = 40, retrasoScript = 0;
const turnstileFalso = () => `(() => {
  const RETRASO = ${retrasoTurnstile};
  let n = 0; const vivos = new Map();
  window.turnstile = {
    render(caja, o) {
      if (!caja || o.sitekey !== '${SITEKEY_PRUEBA}' || o.appearance !== 'interaction-only' ||
          typeof o.callback !== 'function' || typeof o['error-callback'] !== 'function') throw new Error('render mal configurado');
      const id = 'w' + (++n);
      const t = 'tt_' + Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
      vivos.set(id, setTimeout(() => { vivos.delete(id); o.callback(t); }, RETRASO));
      return id;
    },
    remove(id) { clearTimeout(vivos.get(id)); vivos.delete(id); },
    reset() {}, getResponse() {}, execute() {},
  };
})();`;
let turnstileCaido = false, cargasTurnstile = 0;
const servidas = new Set();
function servirWeb(url) {
  let ruta = decodeURIComponent(url.pathname);
  servidas.add(ruta);
  if (ruta === '/assets/rwadar-20260820.js') return { status: 200, contentType: TIPOS['.js'], body: jsServido };
  if (ruta === RUTA_MANUAL) return { status: 200, contentType: 'application/pdf', body: fs.readFileSync(PDF_MANUAL) };
  if (ruta.endsWith('/')) ruta += 'index.html';
  let archivo = path.join(SITIO, ruta);
  if (!archivo.startsWith(SITIO)) return { status: 404, body: '' };
  if (!fs.existsSync(archivo) && fs.existsSync(archivo + '.html')) archivo += '.html';
  if (!fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) return { status: 404, body: 'no existe' };
  const tipo = TIPOS[path.extname(archivo)] || 'application/octet-stream';
  return { status: 200, contentType: tipo, headers: tipo.startsWith('text/html') ? { 'content-security-policy': cspServida } : {},
    body: fs.readFileSync(archivo) };
}

const navegador = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});
const problemas = [];
async function contexto(opciones) {
  const ctx = await navegador.newContext({ serviceWorkers: 'block', locale: 'es-ES', ...opciones });
  await ctx.route('**/*', async (route) => {
    const peticion = route.request();
    const url = new URL(peticion.url());
    try {
      if (url.origin === WEB) return await route.fulfill(servirWeb(url));
      if (url.origin === TURNSTILE && url.pathname === '/turnstile/v0/api.js') {
        if (turnstileCaido) return await route.abort('blockedbyclient');
        if (retrasoScript) await new Promise((r) => setTimeout(r, retrasoScript));
        cargasTurnstile++;
        return await route.fulfill({ status: 200, contentType: 'text/javascript', body: turnstileFalso() });
      }
      if (url.origin === SUPA) {
        if (peticion.method() === 'OPTIONS') return await route.fulfill({ status: 204, headers: CORS, body: '' });
        const r = url.pathname.startsWith('/auth/v1') ? await atenderAuth(peticion, url) : await atenderRest(peticion, url);
        return await route.fulfill(r);
      }
      return await route.abort();
    } catch (e) {
      problemas.push('servidor de ensayo: ' + e.message);
      return route.abort();
    }
  });
  const pagina = await ctx.newPage();
  vigilar(pagina);
  return { ctx, pagina };
}
function vigilar(pagina) {
  pagina.on('pageerror', (e) => problemas.push('error de página: ' + e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) problemas.push('CSP: ' + m.text());
  });
  pagina.on('dialog', (d) => d.accept());
}
const captura = (pagina, nombre) => pagina.screenshot({ path: path.join(CAPTURAS, nombre + '.png') });
const texto = (pagina, sel) => pagina.locator(sel).innerText().catch(() => '');
const aviso = async (pagina, patron) => {
  try { await pagina.waitForFunction((p) => new RegExp(p).test(document.body.innerText), patron.source, { timeout: 8000 }); return true; }
  catch { return false; }
};
const correoDe = (para, tipo) => [...buzon].reverse().find((c) => c.para === para && c.tipo === tipo);
/* «Pulsar» el enlace del correo: Auth lo verifica y redirige a la web con
   los testigos en el fragmento. Chromium no sigue redirecciones servidas
   desde page.route en una navegación, así que la redirección se resuelve
   aquí con el mismo código que la atendería y se navega al destino. */
const abrirEnlace = async (ctx, enlace) => {
  const url = new URL(enlace);
  const r = await atenderAuth({ method: () => 'GET', headers: () => ({}), postDataJSON: () => null }, url);
  /* Desde el correo el enlace abre una pestaña nueva: carga completa. */
  const pestaña = await ctx.newPage();
  vigilar(pestaña);
  await pestaña.goto(r.headers.location, { waitUntil: 'networkidle' });
  return pestaña;
};

const CORREO = 'ana@ejemplo.test';
const CLAVE = 'una clave larga de prueba';
const CLAVE_NUEVA = 'otra clave larga distinta';

console.log('=== RWAdar · ensayo de cuentas en la web (fase 1) ===');
const { ctx: escritorio, pagina } = await contexto({ viewport: { width: 1366, height: 900 } });
await pagina.goto(WEB + '/', { waitUntil: 'networkidle' });

/* 1 · alta */
paso('con las cuentas encendidas, el botón de la cabecera dice «Entrar»',
  (await texto(pagina, '#btnCuenta')).trim() === 'Entrar' && await pagina.locator('#btnCuenta').isEnabled());
await pagina.click('#btnCuenta');
await pagina.click('#irCambiar');
paso('«Crear una cuenta» abre el formulario de alta', (await texto(pagina, '#cuentaTit')) === 'Crear cuenta');
await pagina.fill('#cNombre', 'Ana');
await pagina.fill('#cCorreo', CORREO);
await pagina.fill('#cClave', CLAVE);
await captura(pagina, '01-alta');
await pagina.click('#cuentaEnviar');
await pagina.waitForSelector('#cuentaEstado:not([hidden])');
paso('tras el alta pide confirmar el correo', (await texto(pagina, '#cuentaTit')) === 'Confirma tu correo para entrar');
paso('el «correo» de confirmación sale hacia la persona', !!correoDe(CORREO, 'signup'));
paso('la pantalla de confirmación ofrece el manual de uso (PDF)',
  await pagina.locator('#cuentaManual').isVisible() &&
  (await pagina.locator('#cuentaManual').getAttribute('href')) === RUTA_MANUAL);
await captura(pagina, '02-confirma-correo');

/* 2 · sin confirmar no entra */
await pagina.click('#cuentaEstadoEntrar');
paso('«Ya lo he hecho · Entrar» rellena el correo', (await pagina.inputValue('#cCorreo')) === CORREO);
await pagina.fill('#cClave', CLAVE);
await pagina.click('#cuentaEnviar');
paso('sin confirmar, explica que falta confirmar el correo', await aviso(pagina, /Falta confirmar el correo/));
await captura(pagina, '03-sin-confirmar');

/* 3 · el enlace del correo */
const confirmada = await abrirEnlace(escritorio, correoDe(CORREO, 'signup').enlace);
paso('el enlace del correo vuelve a RWAdar y confirma', await aviso(confirmada, /Correo confirmado/));
paso('el fragmento con los testigos desaparece de la barra de direcciones', !new URL(confirmada.url()).hash.includes('access_token'));
await confirmada.waitForSelector('#perfilPanel.show');
paso('tras confirmar se abre «Tu cuenta» con el manual a la vista', await confirmada.locator('#pfManual').isVisible());
await captura(confirmada, '04-correo-confirmado');
const [pdf] = await Promise.all([escritorio.waitForEvent('page'), confirmada.click('#pfManual')]);
await pdf.waitForLoadState().catch(() => {});
for (let i = 0; i < 20 && !servidas.has(RUTA_MANUAL); i++) await new Promise((r) => setTimeout(r, 100));
await pdf.close();
/* Chromium sin pantalla descarga el PDF en vez de mostrarlo: basta con
   comprobar que se pidió a su dirección estable y que existe. */
paso('el manual (corregido) se abre en su dirección estable', servidas.has(RUTA_MANUAL) && fs.statSync(PDF_MANUAL).size > 100000);
let anotada = null;
for (let i = 0; i < 20 && !anotada; i++) {
  [{ manual_descargado_el: anotada }] = await enCola(() => filas(db,
    `select p.manual_descargado_el from perfiles p join auth.users u on u.id=p.id where u.email=$1`, [CORREO]));
  if (!anotada) await new Promise((r) => setTimeout(r, 100));
}
paso('y la base anota la fecha de la primera descarga (sin pedir otra vez la contraseña)', anotada instanceof Date);
await confirmada.close();

/* 4 · entrar y vigilar */
await pagina.goto(WEB + '/', { waitUntil: 'networkidle' });
await pagina.click('#btnCuenta');
await pagina.fill('#cCorreo', CORREO);
await pagina.fill('#cClave', CLAVE);
await pagina.click('#cuentaEnviar');
paso('entra y saluda por su nombre', await aviso(pagina, /Hola Ana\. Sesión iniciada/));
paso('la cabecera muestra su nombre', /Ana/.test(await texto(pagina, '#btnCuenta')));

const nombresBase = new Set((await enCola(() => filas(db, `select nombre from plataformas where estado <> 'descartada'`))).map((f) => f.nombre));
const botones = pagina.locator('button.abrir[data-abrir]');
let elegida = null;
for (let i = 0; i < await botones.count(); i++) {
  const nombre = (await botones.nth(i).innerText()).trim();
  if (nombresBase.has(nombre)) { elegida = nombre; await botones.nth(i).click(); break; }
}
paso(`abre la ficha de una plataforma del radar (${elegida})`, !!elegida && await pagina.locator('#btnVig').isVisible());
paso('la ficha no muestra opiniones (siguen cerradas)', await pagina.locator('#dwOpiniones').count() === 0 ||
  (await pagina.locator('#dwOpiniones').innerHTML()).trim() === '');
await pagina.click('#btnVig');
paso('«Vigilar esta plataforma» la guarda', await aviso(pagina, /La estás vigilando/));
const [fila] = await enCola(() => filas(db, `select count(*)::int n from vigilancia v join auth.users u on u.id=v.usuario_id where u.email=$1`, [CORREO]));
paso('y queda guardada en la base de datos, a su nombre', fila.n === 1);
await captura(pagina, '05-vigilando');

/* 5 · su área */
await pagina.keyboard.press('Escape');
await pagina.click('#btnCuenta');
await pagina.waitForSelector('#perfilPanel.show');
const perfil = await texto(pagina, '#perfilCuerpo');
paso('su área muestra la plataforma que vigila', perfil.includes(elegida));
paso('los avisos por correo aparecen como «Próximamente»', /Próximamente: avisos por correo/.test(perfil));
paso('no aparece la casilla de consentimiento de correo', await pagina.locator('#optAvisos').count() === 0);
paso('no aparece el panel de moderación', await pagina.locator('#modZona').count() === 0);
await pagina.fill('#pfNombre', 'Ana R.');
await pagina.click('#pfGuardarNombre');
paso('cambia su nombre (sin llamarlo «público»: las opiniones siguen cerradas)', await aviso(pagina, /Nombre guardado\./));
const [nombre] = await enCola(() => filas(db, `select p.nombre from perfiles p join auth.users u on u.id=p.id where u.email=$1`, [CORREO]));
paso('y el cambio llega a la base de datos', nombre.nombre === 'Ana R.');
await captura(pagina, '06-su-area');

/* 6 · salir, volver y encontrar su lista */
await pagina.click('#pfSalir');
paso('cerrar sesión la deja fuera', await aviso(pagina, /Sesión cerrada/) && (await texto(pagina, '#btnCuenta')).trim() === 'Entrar');
await pagina.reload({ waitUntil: 'networkidle' });
await pagina.click('#btnCuenta');
await pagina.fill('#cCorreo', CORREO);
await pagina.fill('#cClave', CLAVE);
await pagina.click('#cuentaEnviar');
/* Si esto falla, el texto de la ventana dice por qué (antes el fallo solo se
   veía después, como un clic tapado por el velo). */
const reentra = await aviso(pagina, /Sesión iniciada/) &&
  await pagina.waitForSelector('#cuentaCaja:not(.on)', { state: 'attached', timeout: 8000 }).then(() => true, () => false);
paso('vuelve a entrar' + (reentra ? '' : ` (la ventana dice: «${(await texto(pagina, '#cuentaMsj')).trim()}»)`), reentra);
await pagina.click('#btnCuenta');
await pagina.waitForSelector('#perfilPanel.show');
paso('al volver a entrar, su lista sigue ahí', (await texto(pagina, '#perfilCuerpo')).includes(elegida));
await pagina.click('#pfSalir');

/* 7 · recuperar la contraseña */
await pagina.click('#btnCuenta');
await pagina.click('#irRecuperar');
await pagina.fill('#cCorreo', CORREO);
await pagina.click('#cuentaEnviar');
await pagina.waitForSelector('#cuentaEstado:not([hidden])');
paso('pedir recuperación avisa de que revise el correo',
  (await texto(pagina, '#cuentaTit')) === 'Revisa tu correo para recuperar el acceso' && !!correoDe(CORREO, 'recovery'));
const recuperacion = await abrirEnlace(escritorio, correoDe(CORREO, 'recovery').enlace);
await recuperacion.waitForSelector('#cuentaCaja.on');
paso('el enlace de recuperación pide la contraseña nueva', (await texto(recuperacion, '#cuentaTit')) === 'Elige una contraseña nueva');
await recuperacion.fill('#cClave', CLAVE_NUEVA);
await recuperacion.fill('#cClave2', CLAVE_NUEVA);
await captura(recuperacion, '07-clave-nueva');
await recuperacion.click('#cuentaEnviar');
paso('guarda la contraseña nueva', await aviso(recuperacion, /Contraseña cambiada/));
await recuperacion.close();
await pagina.reload({ waitUntil: 'networkidle' });
await pagina.click('#btnCuenta');
await pagina.fill('#cCorreo', CORREO);
await pagina.fill('#cClave', CLAVE);
await pagina.click('#cuentaEnviar');
paso('la contraseña antigua ya no sirve', await aviso(pagina, /El correo o la contraseña no son correctos/));
await pagina.fill('#cClave', CLAVE_NUEVA);
await pagina.click('#cuentaEnviar');
paso('la nueva sí', await aviso(pagina, /Sesión iniciada/));

/* 8 · móvil */
const movil = await contexto({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await movil.pagina.goto(WEB + '/', { waitUntil: 'networkidle' });
paso('en el móvil, el botón de cuenta está activo (antes se quedaba bloqueado)',
  await movil.pagina.locator('#movilCuentaAccion').evaluate((b) => !b.disabled));
await movil.pagina.locator('#movilCuentaAccion').evaluate((b) => b.click());
await movil.pagina.waitForSelector('#cuentaCaja.on');
paso('y abre «Entrar» en el móvil', (await texto(movil.pagina, '#cuentaTit')) === 'Entrar');
const desborde = await movil.pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
paso(`sin desbordar la pantalla del móvil (${desborde}px)`, desborde <= 0);
await captura(movil.pagina, '08-movil-entrar');
await movil.ctx.close();

/* 9 · borrar la cuenta */
await pagina.click('#btnCuenta');
await pagina.waitForSelector('#perfilPanel.show');
await pagina.click('#pfBorrar');
await pagina.waitForSelector('#cuentaCaja.on');
await pagina.fill('#cClave', CLAVE_NUEVA);
await pagina.fill('#cClave2', 'BORRAR');
await pagina.click('#cuentaEnviar');
paso('«Borrar mi cuenta» confirma el borrado', await aviso(pagina, /Cuenta y datos asociados borrados/));
const resto = await enCola(() => filas(db, `select
  (select count(*)::int from auth.users where email=$1) usuarios,
  (select count(*)::int from vigilancia) vigilancias,
  (select count(*)::int from perfiles) perfiles`, [CORREO]));
paso('no queda rastro en la base de datos (cuenta, perfil y vigilancia)',
  resto[0].usuarios === 0 && resto[0].vigilancias === 0 && resto[0].perfiles === 0);
await captura(pagina, '09-cuenta-borrada');

/* 10 · comunidad: una publicación al día, sin enlaces, denuncias */
const crearConfirmada = async (email) => {
  await enCola(() => db.query('insert into auth.users(email) values ($1)', [email]));
  claves.set(email, CLAVE);
};
await crearConfirmada('eva@ejemplo.test');
await crearConfirmada('leo@ejemplo.test');
const comunidad = await contexto({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const pc = comunidad.pagina;
const entrarComo = async (correo) => {
  await pc.click('#comunidadEntrar');
  await pc.waitForSelector('#cuentaCaja.on');
  await pc.fill('#cCorreo', correo);
  await pc.fill('#cClave', CLAVE);
  await pc.click('#cuentaEnviar');
  return aviso(pc, /Sesión iniciada/);
};
await pc.goto(WEB + '/', { waitUntil: 'networkidle' });
paso('Inicio enseña la comunidad con sus normas, todavía vacía',
  await pc.locator('#comunidad').isVisible() && /Normas:/.test(await texto(pc, '#comunidad')) &&
  /Todavía no hay publicaciones/.test(await texto(pc, '#comunidadLista')) &&
  !(await pc.locator('#comunidadProximamente').isVisible()));
paso('sin cuenta invita a entrar y no enseña el formulario',
  await pc.locator('#comunidadEntrar').isVisible() && !(await pc.locator('#comunidadForm').isVisible()));
paso('se entra desde la propia comunidad', await entrarComo('eva@ejemplo.test'));
paso('con cuenta aparece el formulario', await pc.locator('#comunidadForm').isVisible());
await pc.fill('#comunidadTexto', 'Os recomiendo www.ganafacil.com para invertir');
await pc.click('#comunidadPublicar');
paso('un enlace se rechaza antes de enviarlo', /no pueden llevar enlaces/.test(await texto(pc, '#comunidadEstado')));
await pc.fill('#comunidadTexto', 'Hoy he terminado la lección 7 y por fin entiendo cómo leer el radar.');
await pc.click('#comunidadPublicar');
await pc.waitForFunction(() => /Publicado/.test(document.getElementById('comunidadEstado').textContent));
/* La lista se vuelve a pedir después de publicar: se espera a que llegue. */
await pc.waitForFunction(() => /lección 7/.test(document.getElementById('comunidadLista').innerText) &&
  /Borrar/.test(document.getElementById('comunidadLista').innerText), null, { timeout: 8000 }).catch(() => {});
const lista = await texto(pc, '#comunidadLista');
const publicada = /lección 7/.test(lista) && /Miembro de RWAdar/.test(lista) && /Borrar/.test(lista) && !/Denunciar/.test(lista);
paso('se publica y aparece como «Miembro de RWAdar», con «Borrar» para quien la escribió' +
  (publicada ? '' : ` (la lista dice: «${lista.replace(/\s+/g, ' ').slice(0, 160)}»)`), publicada);
await pc.fill('#comunidadTexto', 'Una segunda publicación el mismo día no debería entrar.');
await pc.click('#comunidadPublicar');
await pc.waitForFunction(() => /Ya has publicado hoy/.test(document.getElementById('comunidadEstado').textContent))
  .then(() => paso('la segunda del mismo día la rechaza la base de datos', true))
  .catch(() => paso('la segunda del mismo día la rechaza la base de datos', false));
await pc.locator('#comunidad').scrollIntoViewIfNeeded();
await captura(pc, '10-comunidad');
const [pub] = await enCola(() => filas(db, 'select id, usuario_id from publicaciones'));
paso('en la base de datos queda una sola, a nombre de quien la escribió', !!pub);

await comunidad.ctx.close();
const otra = await contexto({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const po = otra.pagina;
await po.goto(WEB + '/', { waitUntil: 'networkidle' });
paso('sin cuenta se lee la publicación, sin botones', /lección 7/.test(await texto(po, '#comunidadLista')) &&
  await po.locator('#comunidadLista button').count() === 0);
await po.click('#comunidadEntrar');
await po.waitForSelector('#cuentaCaja.on');
await po.fill('#cCorreo', 'leo@ejemplo.test');
await po.fill('#cClave', CLAVE);
await po.click('#cuentaEnviar');
await aviso(po, /Sesión iniciada/);
await po.waitForSelector('[data-comunidad-denunciar]');
await po.click('[data-comunidad-denunciar]');
paso('otra cuenta puede denunciarla', await aviso(po, /Denuncia enviada/));
const [den] = await enCola(() => filas(db, 'select denuncias from publicaciones where id=$1', [pub.id]));
paso('y la denuncia queda contada en la base de datos', den.denuncias === 1);
await otra.ctx.close();

/* 11 · anti-robots (Turnstile) encendido, contra un Supabase que lo exige */
paso('con el anti-robots apagado no se ha cargado nada de Cloudflare en todo el ensayo', cargasTurnstile === 0);
jsServido = jsTurnstile; cspServida = CSP_TURNSTILE; captchaExigido = true;
const robot = await contexto({ viewport: { width: 1366, height: 900 } });
const pr = robot.pagina;
await pr.goto(WEB + '/', { waitUntil: 'networkidle' });
paso('encendido, abrir la web tampoco carga Turnstile (solo al pedir algo a la cuenta)', cargasTurnstile === 0);
const RITA = 'rita@ejemplo.test';
await pr.click('#btnCuenta');
await pr.click('#irCambiar');
await pr.fill('#cCorreo', RITA);
await pr.fill('#cClave', CLAVE);
await pr.click('#cuentaEnviar');
await pr.waitForSelector('#cuentaEstado:not([hidden])');
paso('el alta pasa la comprobación y Supabase recibe el testigo',
  !!correoDe(RITA, 'signup') && testigosRobot.some((x) => x.ruta === '/signup'));
await pr.click('#cuentaReenviar');
paso('«Reintentar» el correo pide otro testigo', await aviso(pr, /La solicitud de reenvío fue aceptada/) &&
  testigosRobot.some((x) => x.ruta === '/resend'));
await enCola(() => db.query('update auth.users set email_confirmed_at=now() where email=$1', [RITA]));
await pr.click('#cuentaEstadoEntrar');
await pr.fill('#cClave', CLAVE);
await pr.click('#cuentaEnviar');
paso('entrar con contraseña también pasa la comprobación', await aviso(pr, /Sesión iniciada/) &&
  testigosRobot.some((x) => x.ruta === '/token'));
paso('cada petición llevó un testigo distinto y Turnstile se cargó una sola vez',
  testigosRobot.length === 3 && new Set(testigosRobot.map((x) => x.t)).size === 3 && cargasTurnstile === 1);
paso('la caja de la comprobación se recoge al terminar', await pr.locator('#cuentaRobot').isHidden());
await robot.ctx.close();

/* Cerrar la ventana a mitad de la comprobación la cancela sin enviar nada:
   (a) mientras se carga el script de Turnstile y (b) mientras la comprobación
   espera. Al volver, se entra con normalidad y sale una sola petición. */
retrasoTurnstile = 1500; retrasoScript = 800;
const lento = await contexto({ viewport: { width: 1366, height: 900 } });
const pl = lento.pagina;
await pl.goto(WEB + '/', { waitUntil: 'networkidle' });
const entradas = () => testigosRobot.filter((x) => x.ruta === '/token').length;
const entradasAntes = entradas();
const intentaEntrar = async () => {
  await pl.click('#btnCuenta');
  await pl.fill('#cCorreo', RITA);
  await pl.fill('#cClave', CLAVE);
  await pl.click('#cuentaEnviar');
};
await intentaEntrar();
await pl.waitForTimeout(200);
const aMedioCargar = cargasTurnstile;
await pl.keyboard.press('Escape');
await pl.waitForTimeout(2600);
paso('cerrar la ventana mientras carga Turnstile no envía nada', entradas() === entradasAntes &&
  cargasTurnstile === aMedioCargar + 1 && await pl.locator('#cuentaRobot').isHidden());
await intentaEntrar();
await pl.waitForSelector('#cuentaRobot:not([hidden])', { state: 'attached' });
await pl.keyboard.press('Escape');
await pl.waitForTimeout(2000);
paso('cerrar la ventana mientras la comprobación espera tampoco envía nada',
  entradas() === entradasAntes && await pl.locator('#cuentaRobot').isHidden());
await intentaEntrar();
const entraTrasCancelar = await aviso(pl, /Sesión iniciada/);
paso('al volver se entra con normalidad, con una sola petición en total',
  entraTrasCancelar && entradas() === entradasAntes + 1);
await lento.ctx.close();
retrasoTurnstile = 40; retrasoScript = 0;

turnstileCaido = true;
const bloqueado = await contexto({ viewport: { width: 1366, height: 900 } });
const pb = bloqueado.pagina;
await pb.goto(WEB + '/', { waitUntil: 'networkidle' });
await pb.click('#btnCuenta');
await pb.click('#irRecuperar');
await pb.fill('#cCorreo', RITA);
const antes = buzon.length;
await pb.click('#cuentaEnviar');
paso('si un bloqueador impide cargar Turnstile, lo explica y no envía nada',
  await aviso(pb, /No se ha podido cargar la comprobación anti-robots/) && buzon.length === antes &&
  await pb.locator('#cuentaEnviar').isEnabled());
await captura(pb, '11-anti-robots-bloqueado');
await bloqueado.ctx.close();

turnstileCaido = false; jsServido = jsCuentas; cspServida = CSP;
const sinClave = await contexto({ viewport: { width: 1366, height: 900 } });
const ps = sinClave.pagina;
await ps.goto(WEB + '/', { waitUntil: 'networkidle' });
await ps.click('#btnCuenta');
await ps.fill('#cCorreo', RITA);
await ps.fill('#cClave', CLAVE);
await ps.click('#cuentaEnviar');
paso('si Supabase lo exige y la web aún no lo tiene encendido, el mensaje se entiende',
  await aviso(ps, /No hemos podido comprobar que no eres un robot/));
await sinClave.ctx.close();
captchaExigido = false;

paso('ningún error de página ni bloqueo de la CSP de producción', problemas.length === 0);
problemas.forEach((p) => console.log('     · ' + p));
await navegador.close();

console.log(`\nCapturas en ${CAPTURAS}`);
console.log(`${ok.length} correctas, ${fail.length} fallidas`);
if (fail.length) process.exitCode = 1;
