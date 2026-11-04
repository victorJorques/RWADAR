/* Web real en Chrome, Auth/REST ficticios y TODA la red interceptada.
   No abre sesiones ni envía correos en Supabase. No prueba producción.
   NODE_PATH=<dependencias con playwright> RWADAR_CHROMIUM=<Chrome> node este-archivo */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sitio = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../rwadar-site');
const WEB = 'https://rwadar.example.test';
const SUPA = 'https://supabase.example.test';
const codigoWeb = fs.readFileSync(path.join(sitio, 'assets/rwadar-20260820.js'), 'utf8');
const origenDatos = new URL(codigoWeb.match(/const API='([^']+)'/)[1]).origin;
const codigoBaseSimulado = codigoWeb.replaceAll(origenDatos, SUPA);
const codigoSimulado = codigoBaseSimulado
  .replace(/const CORREO_AUTH_E2E=(?:true|false);/, 'const CORREO_AUTH_E2E=true;');
const codigoCorreoCerrado = codigoBaseSimulado
  .replace(/const CORREO_AUTH_E2E=(?:true|false);/, 'const CORREO_AUTH_E2E=false;');
const usuarios = {
  A: { id: '10000000-0000-4000-8000-000000000001', email: 'ana@ejemplo.test', nombre: 'Ana' },
  B: { id: '10000000-0000-4000-8000-000000000002', email: 'bea@ejemplo.test', nombre: 'Bea' },
};
const CLAVE = 'una clave larga de prueba';
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const CORS = { 'access-control-allow-origin': WEB, 'access-control-allow-headers': 'apikey,authorization,content-type,prefer',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,PUT,OPTIONS' };
const json = (body, status = 200) => ({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
const aplaza = () => { let resolver; const promesa = new Promise(r => { resolver = r; }); return { promesa, resolver }; };
let correctas = 0;
const ok = (titulo, condicion) => { assert.ok(condicion, titulo); correctas++; console.log('  OK    ' + titulo); };
const navegador = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});

async function abrir(fragmento = '', opciones = {}, correoDisponible = true) {
  const ctx = await navegador.newContext({ serviceWorkers: 'block', viewport: { width: 1200, height: 800 }, ...opciones });
  const peticiones = [], errores = [], estado = { interceptar: null, confirmado: true, anonimo: false, numero: 0 };
  const sesion = nombre => ({ access_token: nombre + '.' + (++estado.numero) + '.ficticio',
    refresh_token: 'renovacion-ficticia', expires_in: 3600, user: usuarios[nombre] });
  await ctx.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === WEB) {
      const ruta = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const archivo = path.resolve(sitio, '.' + ruta);
      if (!archivo.startsWith(sitio + path.sep) || !fs.existsSync(archivo) || !fs.statSync(archivo).isFile())
        return route.fulfill({ status: 404, body: '' });
      if (ruta === '/assets/rwadar-20260820.js')
        return route.fulfill({ status: 200, contentType: 'text/javascript',
          body: correoDisponible ? codigoSimulado : codigoCorreoCerrado });
      return route.fulfill({ status: 200, contentType: tipos[path.extname(archivo)] || 'application/octet-stream', body: fs.readFileSync(archivo) });
    }
    if (url.origin !== SUPA) return route.abort(); // ni analítica ni red ajena al ensayo
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
    const token = String(req.headers().authorization || '').replace(/^Bearer /, '');
    const nombre = token.split('.')[0], usuario = usuarios[nombre];
    const cuerpo = req.postDataJSON?.() || {};
    const p = { url, metodo: req.method(), nombre, cuerpo };
    peticiones.push(p);
    if (estado.interceptar) {
      const respuesta = await estado.interceptar(p);
      if (respuesta) return route.fulfill(respuesta);
    }
    if (url.pathname === '/auth/v1/token') {
      const nombreEntrada = Object.keys(usuarios).find(n => usuarios[n].email === cuerpo.email);
      return route.fulfill(nombreEntrada && cuerpo.password === CLAVE
        ? json(sesion(nombreEntrada)) : json({ error_description: 'Invalid login credentials' }, 400));
    }
    if (url.pathname === '/auth/v1/user') return route.fulfill(usuario
      ? json({ ...usuario, email_confirmed_at: estado.confirmado ? '2026-10-01T10:00:00Z' : null, is_anonymous: estado.anonimo })
      : json({ msg: 'Invalid token' }, 401));
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS, body: '' });
    if (!usuario) return route.fulfill(json({ message: 'catálogo fuera de este ensayo' }, 503));
    if (url.pathname === '/rest/v1/mi_perfil') return route.fulfill(json([{ ...usuario, dias_de_miembro: 1, avisos_recibidos: 0 }]));
    if (url.pathname === '/rest/v1/perfiles') return route.fulfill(json([{ id: usuario.id, avisos_correo: false }]));
    if (url.pathname === '/rest/v1/vigilancia') return route.fulfill(json([]));
    if (url.pathname === '/rest/v1/rpc/borrar_mi_cuenta') return route.fulfill(json(null));
    return route.fulfill(json([], 200));
  });
  const pagina = await ctx.newPage();
  pagina.on('pageerror', e => errores.push(e.message));
  await pagina.goto(WEB + '/' + fragmento, { waitUntil: 'load' });
  return { ctx, pagina, estado, peticiones, errores, sesion };
}
async function entrar(prueba, nombre) {
  const p = prueba.pagina;
  await p.evaluate(() => Cuenta.abrir('entrar'));
  await p.fill('#cCorreo', usuarios[nombre].email);
  await p.fill('#cClave', CLAVE);
  await p.click('#cuentaEnviar');
  await p.waitForFunction(u => Cuenta.uid() === u.id && document.getElementById('btnCuenta').textContent.includes(u.nombre), usuarios[nombre],
    { timeout: 5000 });
}
async function conservaBea(prueba) {
  assert.equal(await prueba.pagina.evaluate(() => Cuenta.uid()), usuarios.B.id);
  assert.match(await prueba.pagina.locator('#btnCuenta').innerText(), /Bea/);
  assert.ok(!prueba.errores.length, prueba.errores.join('; '));
}
async function retiene(prueba, coincide, respuesta) {
  const recibida = aplaza(), termina = aplaza(); let cogida = false;
  prueba.estado.interceptar = async p => {
    if (!cogida && coincide(p)) { cogida = true; recibida.resolver(); await termina.promesa; return respuesta; }
  };
  return { recibida: recibida.promesa, soltar: () => termina.resolver() };
}
async function drenar(p) { await p.waitForFunction(() => !document.getElementById('cuentaForm').hasAttribute('aria-busy')); }

try {
  console.log('=== WEB · cuentas, carreras y baja (Chrome sin red real) ===');
  {
    const t = await abrir('', {}, false);
    await t.pagina.evaluate(() => Cuenta.abrir('registro'));
    ok('sin correo comprobado, alta pausada oculta el formulario y no pide signup',
      /Alta temporalmente en pausa/.test(await t.pagina.locator('#cuentaTit').innerText()) &&
      await t.pagina.locator('#cuentaForm').isHidden() && !t.peticiones.some(p => p.url.pathname === '/auth/v1/signup'));
    await t.pagina.evaluate(() => Cuenta.abrir('recuperar'));
    ok('sin correo comprobado, recuperación pausada no solicita envíos',
      /Recuperación temporalmente en pausa/.test(await t.pagina.locator('#cuentaTit').innerText()) &&
      await t.pagina.locator('#cuentaForm').isHidden() && !t.peticiones.some(p => p.url.pathname === '/auth/v1/recover'));
    await entrar(t, 'A');
    ok('la pausa de correos permite entrar a una cuenta ya confirmada', await t.pagina.evaluate(() => Cuenta.hay()));
    await t.ctx.close();
  }
  for (const campo of ['confirmado', 'anonimo']) {
    const t = await abrir(); t.estado[campo] = campo === 'anonimo';
    await t.pagina.evaluate(() => Cuenta.abrir('entrar'));
    await t.pagina.fill('#cCorreo', usuarios.A.email); await t.pagina.fill('#cClave', CLAVE);
    await t.pagina.click('#cuentaEnviar'); await drenar(t.pagina);
    ok(campo === 'confirmado' ? 'rechaza correo no confirmado aunque /user dé id' : 'rechaza cuenta anónima aunque tenga correo confirmado',
      !await t.pagina.evaluate(() => Cuenta.hay()));
    ok('no consulta perfil ni vigilancia de una identidad rechazada', !t.peticiones.some(p => p.url.pathname.startsWith('/rest/') && p.nombre));
    await t.ctx.close();
  }
  {
    const t = await abrir('#access_token=A.0.ficticio&refresh_token=secreto-ficticio&type=oauth');
    ok('tipo de enlace no admitido limpia el fragmento sin pedir /user', !new URL(t.pagina.url()).hash && !t.peticiones.some(p => p.url.pathname === '/auth/v1/user'));
    await t.ctx.close();
  }
  /* /user de un callback antiguo falla después de entrar Bea. */
  {
    const t = await abrir();
    const retenida = await retiene(t, p => p.url.pathname === '/auth/v1/user' && p.nombre === 'A', json({ msg: 'Invalid token' }, 401));
    await t.pagina.goto(WEB + '/?ensayo=callback#access_token=A.0.ficticio&type=signup&expires_in=3600', { waitUntil: 'load' });
    await retenida.recibida;
    ok('limpia el fragmento antes de esperar a /user', !new URL(t.pagina.url()).hash);
    await entrar(t, 'B'); retenida.soltar(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('un /user antiguo fallido no cierra la sesión nueva', true);
    await t.ctx.close();
  }
  /* El perfil de recuperación de Ana llega después del login de Bea. */
  {
    const t = await abrir();
    const retenida = await retiene(t, p => p.url.pathname === '/rest/v1/mi_perfil' && p.nombre === 'A', json([{ ...usuarios.A }]));
    await t.pagina.goto(WEB + '/?ensayo=callback#access_token=A.0.ficticio&type=recovery&expires_in=3600', { waitUntil: 'load' });
    await retenida.recibida; await entrar(t, 'B'); retenida.soltar(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('perfil antiguo no se mezcla con Bea ni abre su cambio de contraseña', !await t.pagina.locator('#cuentaCaja').evaluate(n => n.classList.contains('on')));
    await t.ctx.close();
  }
  {
    const t = await abrir();
    const retenida = await retiene(t, p => p.url.pathname === '/rest/v1/mi_perfil' && p.nombre === 'A', json([{ ...usuarios.A }]));
    await t.pagina.goto(WEB + '/?ensayo=callback#access_token=A.0.ficticio&type=recovery&expires_in=3600', { waitUntil: 'load' });
    await retenida.recibida; await t.pagina.evaluate(() => Cuenta.abrir('entrar')); await t.pagina.fill('#cClave', CLAVE);
    retenida.soltar(); await t.pagina.waitForTimeout(60);
    ok('recuperación cancelada no sustituye el formulario nuevo ni borra su contraseña',
      await t.pagina.inputValue('#cClave') === CLAVE && await t.pagina.locator('#cuentaTit').innerText() === 'Entrar' && !await t.pagina.evaluate(() => Cuenta.hay()));
    await t.ctx.close();
  }
  {
    const t = await abrir(); await entrar(t, 'A'); await t.pagina.click('#btnCuenta');
    const retenida = await retiene(t, p => p.url.pathname === '/auth/v1/logout', { status: 204, headers: CORS, body: '' });
    await t.pagina.click('#pfSalir'); await retenida.recibida;
    ok('salir limpia inmediatamente la sesión sin esperar a Supabase', !await t.pagina.evaluate(() => Cuenta.hay()));
    await entrar(t, 'B'); retenida.soltar(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('logout retrasado no cierra una nueva entrada', true);
    await t.ctx.close();
  }
  {
    const t = await abrir(); await entrar(t, 'A'); await t.pagina.click('#btnCuenta');
    t.estado.interceptar = async p => p.url.pathname === '/auth/v1/logout' ? json({ msg: 'error de servidor ficticio' }, 500) : null;
    await t.pagina.click('#pfSalir');
    await t.pagina.waitForFunction(() => document.getElementById('avisoGlobal')?.textContent.includes('no hemos podido confirmar el cierre en el servidor'));
    ok('logout 500 limpia la memoria pero avisa que la sesión remota podría seguir activa',
      !await t.pagina.evaluate(() => Cuenta.hay()) && await t.pagina.evaluate(() => Cuenta.token()) === null &&
      /Puede que la sesión siga abierta en otros dispositivos/.test(await t.pagina.locator('#avisoGlobal').innerText()));
    await t.ctx.close();
  }
  {
    const t = await abrir(); await entrar(t, 'A'); await t.pagina.click('#btnCuenta');
    const retenida = await retiene(t, p => p.url.pathname === '/auth/v1/logout', json({ msg: 'error de servidor ficticio' }, 500));
    await t.pagina.click('#pfSalir'); await retenida.recibida; await entrar(t, 'B');
    const avisoNuevo = await t.pagina.locator('#avisoGlobal').innerText();
    retenida.soltar(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('fallo de logout antiguo no sobreescribe el aviso ni la identidad de una entrada nueva',
      await t.pagina.locator('#avisoGlobal').innerText() === avisoNuevo && /Sesión iniciada/.test(avisoNuevo));
    await t.ctx.close();
  }
  {
    const t = await abrir(), recibida = aplaza(), termina = aplaza();
    t.estado.interceptar = async p => {
      if (p.url.pathname !== '/auth/v1/token') return null;
      if (p.url.searchParams.get('grant_type') === 'password' && p.cuerpo.email === usuarios.A.email)
        return json({ ...t.sesion('A'), expires_in: 1 });
      if (p.url.searchParams.get('grant_type') === 'refresh_token') {
        recibida.resolver(); await termina.promesa; return json(t.sesion('A'));
      }
    };
    await t.pagina.evaluate(() => Cuenta.abrir('entrar')); await t.pagina.fill('#cCorreo', usuarios.A.email);
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.click('#cuentaEnviar'); await recibida.promesa;
    ok('mientras la identidad no está verificada, no entrega el token a otros módulos', await t.pagina.evaluate(() => Cuenta.token()) === null);
    await entrar(t, 'B'); termina.resolver(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('una renovación de la sesión anterior no sustituye la entrada nueva', true);
    await t.ctx.close();
  }
  /* Se cancela un alta pendiente y se escribe otra contraseña. */
  {
    const t = await abrir(); const retenida = await retiene(t, p => p.url.pathname === '/auth/v1/signup', json({ id: usuarios.A.id, email: usuarios.A.email }));
    await t.pagina.evaluate(() => Cuenta.abrir('registro')); await t.pagina.fill('#cCorreo', usuarios.A.email);
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.click('#cuentaEnviar'); await retenida.recibida;
    await t.pagina.evaluate(() => Cuenta.abrir('entrar')); await t.pagina.fill('#cClave', 'clave nueva todavía sin enviar');
    retenida.soltar(); await t.pagina.waitForTimeout(60);
    ok('respuesta de alta cancelada no borra la contraseña del formulario nuevo', await t.pagina.inputValue('#cClave') === 'clave nueva todavía sin enviar');
    await t.ctx.close();
  }
  {
    const t = await abrir(); await entrar(t, 'A'); await t.pagina.click('#btnCuenta'); await t.pagina.click('#pfBorrar');
    await t.pagina.waitForSelector('#cuentaCaja.on');
    ok('desde Perfil, el diálogo de baja permanece abierto y la contraseña está enmascarada',
      await t.pagina.locator('#cClave').getAttribute('type') === 'password' && /Borrar mi cuenta/.test(await t.pagina.locator('#cuentaTit').innerText()));
    await t.pagina.fill('#cClave', 'contraseña incorrecta'); await t.pagina.fill('#cClave2', 'BORRAR'); await t.pagina.click('#cuentaEnviar'); await drenar(t.pagina);
    ok('contraseña incorrecta nunca llama a borrar_mi_cuenta', !t.peticiones.some(p => p.url.pathname.endsWith('/borrar_mi_cuenta')));
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.fill('#cClave2', 'BORRAS'); await t.pagina.click('#cuentaEnviar'); await drenar(t.pagina);
    ok('confirmación distinta de BORRAR nunca llama a la baja', !t.peticiones.some(p => p.url.pathname.endsWith('/borrar_mi_cuenta')));
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.fill('#cClave2', 'BORRAR');
    t.estado.interceptar = async p => p.url.pathname === '/auth/v1/user' ? json({ ...usuarios.B, email_confirmed_at: '2026-10-01T10:00:00Z' }) : null;
    await t.pagina.click('#cuentaEnviar'); await drenar(t.pagina);
    ok('reautenticación de otra identidad nunca llama a la baja', !t.peticiones.some(p => p.url.pathname.endsWith('/borrar_mi_cuenta')));
    t.estado.interceptar = null;
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.fill('#cClave2', 'BORRAR');
    const retenida = await retiene(t, p => p.url.pathname.endsWith('/borrar_mi_cuenta'), json(null));
    await t.pagina.click('#cuentaEnviar'); await retenida.recibida;
    const baja = t.peticiones.find(p => p.url.pathname.endsWith('/borrar_mi_cuenta'));
    ok('baja válida envía la RPC sin argumentos tras verificar la misma identidad', baja.nombre === 'A' && Object.keys(baja.cuerpo).length === 0);
    await entrar(t, 'B'); retenida.soltar(); await t.pagina.waitForTimeout(60); await conservaBea(t);
    ok('respuesta de baja anterior no borra ni cierra la sesión nueva', true);
    await t.ctx.close();
  }
  {
    const t = await abrir(); t.estado.interceptar = async p => p.url.pathname === '/auth/v1/token' ? json('x'.repeat(140000)) : null;
    await t.pagina.evaluate(() => Cuenta.abrir('entrar')); await t.pagina.fill('#cCorreo', usuarios.A.email); await t.pagina.fill('#cClave', CLAVE);
    await t.pagina.click('#cuentaEnviar'); await drenar(t.pagina);
    ok('respuesta mayor de 128 KiB no crea sesión y libera el formulario', !await t.pagina.evaluate(() => Cuenta.hay()) && !await t.pagina.locator('#cuentaEnviar').isDisabled());
    await t.ctx.close();
  }
  {
    const t = await abrir(); await entrar(t, 'A'); await t.pagina.click('#btnCuenta');
    t.estado.interceptar = async p => p.url.pathname === '/rest/v1/perfiles' && p.metodo === 'PATCH' ? json([]) : null;
    await t.pagina.fill('#pfNombre', 'Cambio no confirmado'); await t.pagina.click('#pfGuardarNombre');
    await t.pagina.waitForFunction(() => document.body.innerText.includes('No se ha podido guardar el nombre.'));
    ok('un UPDATE sin filas (RLS) no se anuncia como nombre guardado', /Ana/.test(await t.pagina.locator('#btnCuenta').innerText()));
    await t.ctx.close();
  }
  {
    const t = await abrir('', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await entrar(t, 'A'); await t.pagina.evaluate(() => Cuenta.abrirGestion()); await t.pagina.click('#pfBorrar');
    await t.pagina.waitForSelector('#cuentaCaja.on'); await t.pagina.fill('#cClave', CLAVE); await t.pagina.fill('#cClave2', 'BORRAR');
    await t.pagina.goBack(); await t.pagina.waitForFunction(() => !document.getElementById('cuentaCaja').classList.contains('on'));
    ok('atrás en móvil cancela la baja y borra la contraseña sin enviar nada',
      await t.pagina.inputValue('#cClave') === '' && !t.peticiones.some(p => p.url.pathname.endsWith('/borrar_mi_cuenta')) && await t.pagina.evaluate(() => Cuenta.hay()));
    await t.pagina.evaluate(() => Cuenta.abrirGestion()); await t.pagina.click('#pfBorrar'); await t.pagina.waitForSelector('#cuentaCaja.on');
    await t.pagina.fill('#cClave', CLAVE); await t.pagina.fill('#cClave2', 'BORRAR'); await t.pagina.click('#cuentaEnviar');
    await t.pagina.waitForFunction(() => !Cuenta.hay());
    ok('la baja válida funciona también en el viewport móvil y limpia los secretos', await t.pagina.inputValue('#cClave') === '' &&
      !await t.pagina.locator('#cuentaCaja').evaluate(n => n.classList.contains('on')));
    await t.ctx.close();
  }
  /* La misma función de transporte, sin red: el timeout incluye el cuerpo.
     Solo aceleramos el reloj del arnés, nunca el código de la aplicación. */
  {
    const codigo = fs.readFileSync(path.join(sitio, 'assets/rwadar-20260820.js'), 'utf8');
    const fuente = codigo.slice(codigo.indexOf('async function peticionCuenta('), codigo.indexOf('/* --- la API de autenticación'));
    let abortada = false;
    const peticion = new Function('fetch', 'setTimeout', `${fuente};return peticionCuenta;`)(
      async (_url, opciones) => {
        opciones.signal.addEventListener('abort', () => { abortada = true; });
        return { headers: new Headers(), text: () => new Promise(() => {}) };
      }, (f, plazo) => setTimeout(f, plazo === 8000 ? 25 : plazo));
    await assert.rejects(peticion('https://ensayo.invalid', {}), /tardado demasiado/);
    ok('el plazo limita también un cuerpo congelado y aborta la petición', abortada);
  }
  console.log(`\n${correctas} comprobaciones correctas. Chrome, URL virtual y Supabase simulado; no prueba correo ni producción.`);
} finally { await navegador.close(); }
