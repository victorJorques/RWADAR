/* =====================================================================
   RWAdar · el worker de la web en local, con Auth simulado
   ---------------------------------------------------------------------
   Arranca en 127.0.0.1 el _worker.js de la web (el mismo que se publica)
   sobre una carpeta ya construida, sin red ni Supabase. Los archivos se
   sirven como en Cloudflare Pages (URL limpias, _headers, _redirects y la
   página 404) y Auth se simula con una cuenta de prueba fija. Sirve para ver
   la Academy con cuenta funcionando y hacer capturas, y para probar
   .github/comprobar-publicado.mjs sin red.

   Uso (desde la carpeta raíz del proyecto):

     node rwadar-acceso/probar-worker-local.mjs [--raiz=rwadar-publicado] [--puerto=8788] [--con-sesion]

     --raiz        carpeta que se sirve: rwadar-publicado (por defecto; antes,
                   npm run test:web o node rwadar-publicar.js --local
                   --sin-sincronizar) o rwadar-site (las fuentes, sin huellas).
     --puerto      puerto local (8788 por defecto; 0 elige uno libre).
     --con-sesion  cada petición que llega sin cookie de sesión lleva la de la
                   cuenta de prueba: así se capturan las lecciones «con sesión»
                   sin pasar por /acceso.

   Ejemplos para capturas:
     sin sesión   node rwadar-acceso/probar-worker-local.mjs --puerto=8788
                  http://127.0.0.1:8788/academy/que-significa-tokenizar-un-activo
                  → 303 a /acceso?volver=/academy/que-significa-tokenizar-un-activo
     con sesión   node rwadar-acceso/probar-worker-local.mjs --puerto=8789 --con-sesion
                  http://127.0.0.1:8789/academy/que-significa-tokenizar-un-activo
                  → la lección, con Cache-Control: private, no-store

   La cuenta de prueba: la cookie __Host-rwadar-acceso=TOKEN_PRUEBA es una
   sesión válida y confirmada. También se puede entrar por /acceso con
   CORREO_PRUEBA y CLAVE_PRUEBA, pero el navegador solo guarda una cookie
   __Host- (Secure) en http si trata ese origen como seguro (Chrome lo hace con
   localhost): por eso existe --con-sesion.

   Cualquier otra llamada a Supabase responde 503 (la web se queda con la copia
   publicada del catálogo). El worker no sale de la máquina: una petición suya a
   otro origen falla. Lo único que cambia frente a producción es que, en la
   respuesta HTTP local, la CSP pierde upgrade-insecure-requests (en http
   rompería los estilos). Desde código: import { arrancarWorkerLocal } from este
   archivo (lo usa rwadar-acceso/comprobar-publicado.test.mjs).
   ===================================================================== */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { construirWorker, CONFIGURACION_PUBLICA } = require('./compilar.cjs');
const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url));
const ORIGEN_SUPABASE = CONFIGURACION_PUBLICA.SUPABASE_URL;

// Cuenta de prueba fija. Solo existe en este arnés: no es una credencial real.
export const TOKEN_PRUEBA = 'prueba-local.rwadar.sesion-valida';
export const CORREO_PRUEBA = 'prueba@rwadar.invalid';
export const CLAVE_PRUEBA = 'clave-de-prueba-local';
export const USUARIO_PRUEBA = Object.freeze({ id: '00000000-0000-4000-8000-00000000c0de', email: CORREO_PRUEBA,
  email_confirmed_at: '2026-11-05T09:00:00Z', is_anonymous: false });

/* Supabase simulado. registro recibe cada llamada ({ ruta, metodo, cuerpo });
   responder(url, init) puede devolver una Response para cambiar una respuesta. */
export function crearAuthSimulado({ registro = [], responder = null } = {}) {
  return async function fetchSupabase(entrada, init = {}) {
    const url = new URL(String(entrada));
    if (url.origin !== ORIGEN_SUPABASE) throw new Error('El arnés local no sale a la red: ' + url.origin);
    const metodo = init.method || 'GET';
    let cuerpo = null;
    try { cuerpo = init.body ? JSON.parse(init.body) : null; } catch { cuerpo = null; }
    registro.push({ ruta: url.pathname + url.search, metodo, cuerpo });
    const propia = responder && await responder(url, init);
    if (propia) return propia;
    const conSesion = init.headers?.Authorization === 'Bearer ' + TOKEN_PRUEBA;
    const json = (dato, status = 200) => new Response(JSON.stringify(dato), { status, headers: { 'Content-Type': 'application/json' } });
    const ruta = url.pathname;
    if (ruta === '/auth/v1/user' && metodo === 'GET') return conSesion ? json(USUARIO_PRUEBA) : json({ error_code: 'bad_jwt' }, 403);
    if (ruta === '/rest/v1/mi_perfil') return conSesion ? json([{ id: USUARIO_PRUEBA.id, nombre: 'Cuenta de prueba' }]) : json({ code: 'PGRST301' }, 401);
    if (ruta === '/auth/v1/token') return cuerpo?.email === CORREO_PRUEBA && cuerpo?.password === CLAVE_PRUEBA
      ? json({ access_token: TOKEN_PRUEBA, token_type: 'bearer' }) : json({ error_code: 'invalid_credentials' }, 400);
    if (ruta === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (['/auth/v1/signup', '/auth/v1/recover', '/auth/v1/resend'].includes(ruta) && metodo === 'POST') return json({});
    if (ruta === '/rest/v1/rpc/baja_avisos' && metodo === 'POST') return json(true);
    if (ruta === '/rest/v1/rpc/mis_avisos_recientes' && conSesion) return json([]);
    return json({ message: 'no simulado en el arnés local' }, 503);
  };
}

/* ASSETS como Cloudflare Pages, sobre una carpeta: URL limpias (x.html → /x,
   carpeta/index.html → /carpeta/), redirecciones 308 de las otras formas,
   _redirects, _headers (comodín *; una cabecera repetida se une con comas) y
   404.html con estado 404. No sirve los archivos de configuración de Pages. */
const TIPOS = Object.freeze({ html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'application/javascript',
  mjs: 'application/javascript', json: 'application/json', xml: 'application/xml', txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
  woff2: 'font/woff2', webmanifest: 'application/manifest+json' });
const CONFIGURACION_PAGES = new Set(['_worker.js', '_routes.json', '_headers', '_redirects']);
function leerReglasCabeceras(texto) {
  const reglas = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    if (!/^\s/.test(linea)) {
      const patron = new RegExp('^' + linea.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        .replace(/:[A-Za-z]\w*/g, '[^/]+') + '$');
      reglas.push({ patron, cabeceras: [] });
    } else if (reglas.length) {
      const dos = linea.indexOf(':');
      if (dos > 0) reglas.at(-1).cabeceras.push([linea.slice(0, dos).trim(), linea.slice(dos + 1).trim()]);
    }
  }
  return reglas;
}
function leerRedirecciones(texto) {
  return texto.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => l.split(/\s+/)).map(([desde, hasta, estado = '302']) => ({ desde, hasta, estado: Number(estado) }));
}
export function crearAssetsLocales(raiz) {
  const base = path.resolve(raiz);
  const leer = nombre => { try { return fs.readFileSync(path.join(base, nombre), 'utf8'); } catch { return ''; } };
  const reglas = leerReglasCabeceras(leer('_headers'));
  const redirecciones = leerRedirecciones(leer('_redirects'));
  const archivo = relativa => {
    const partes = relativa.split('/').filter(Boolean);
    if (!partes.length || partes.some(p => p === '.' || p === '..') || CONFIGURACION_PAGES.has(partes[0])) return null;
    const absoluta = path.join(base, ...partes);
    if (!absoluta.startsWith(base + path.sep)) return null;
    try { return fs.lstatSync(absoluta).isFile() ? absoluta : null; } catch { return null; }
  };
  const cabecerasDe = (ruta, propias = {}) => {
    const headers = new Headers(propias);
    const vistas = new Map();
    for (const regla of reglas) if (regla.patron.test(ruta)) for (const [nombre, valor] of regla.cabeceras) {
      const clave = nombre.toLowerCase();
      vistas.set(clave, vistas.has(clave) ? vistas.get(clave) + ', ' + valor : valor);
    }
    for (const [nombre, valor] of vistas) headers.set(nombre, valor);
    return headers;
  };
  const redirigir = (ruta, destino, estado = 308) => new Response(null, { status: estado, headers: cabecerasDe(ruta, { Location: destino }) });
  const servir = (request, ruta, absoluta, estado = 200) => {
    const extension = absoluta.split('.').pop().toLowerCase();
    const headers = cabecerasDe(ruta, { 'Content-Type': TIPOS[extension] || 'application/octet-stream' });
    return new Response(request.method === 'HEAD' ? null : fs.readFileSync(absoluta), { status: estado, headers });
  };
  const noEncontrada = (request, ruta) => {
    const pagina = archivo('404.html');
    if (pagina) return servir(request, ruta, pagina, 404);
    return new Response(request.method === 'HEAD' ? null : 'No encontrado', { status: 404, headers: cabecerasDe(ruta) });
  };
  return { async fetch(entrada, init) {
    const request = entrada instanceof Request ? entrada : new Request(entrada, init);
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405 });
    let ruta;
    try { ruta = decodeURIComponent(url.pathname); } catch { return noEncontrada(request, url.pathname); }
    const redireccion = redirecciones.find(r => r.desde === url.pathname || r.desde === ruta);
    if (redireccion) return redirigir(url.pathname, redireccion.hasta, redireccion.estado);
    if (ruta.endsWith('/')) {
      const indice = archivo(ruta + 'index.html');
      if (indice) return servir(request, url.pathname, indice);
      if (ruta !== '/' && archivo(ruta.slice(0, -1) + '.html')) return redirigir(url.pathname, ruta.slice(0, -1));
      return noEncontrada(request, url.pathname);
    }
    if (ruta.endsWith('.html')) {
      if (!archivo(ruta)) return noEncontrada(request, url.pathname);
      return redirigir(url.pathname, /(?:^|\/)index\.html$/.test(ruta) ? ruta.replace(/index\.html$/, '') : ruta.slice(0, -5));
    }
    const exacto = archivo(ruta);
    if (exacto) return servir(request, url.pathname, exacto);
    const limpio = archivo(ruta + '.html');
    if (limpio) return servir(request, url.pathname, limpio);
    if (archivo(ruta + '/index.html')) return redirigir(url.pathname, ruta + '/');
    return noEncontrada(request, url.pathname);
  } };
}

/* Carga el worker: el _worker.js de la carpeta si lo tiene (el artefacto que
   se publica) o el que compila construirWorker desde las fuentes. Mientras se
   importa, fetch es el Supabase simulado: el worker lo captura al crearse. */
let cargas = 0;
export async function cargarWorker({ raiz, fetchSupabase }) {
  const propio = path.join(raiz, '_worker.js');
  const codigo = fs.existsSync(propio) ? fs.readFileSync(propio, 'utf8') : construirWorker();
  const original = globalThis.fetch;
  globalThis.fetch = fetchSupabase;
  try {
    return (await import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64') + '#arnes-' + (++cargas))).default;
  } finally { globalThis.fetch = original; }
}

const HOST_LOCAL = /^(?:127\.0\.0\.1|localhost):\d{1,5}$/;
const COOKIE_SESION = '__Host-rwadar-acceso';
export async function arrancarWorkerLocal({ raiz = path.join(RAIZ_REPO, 'rwadar-publicado'), puerto = 8788, conSesion = false,
  responder = null } = {}) {
  raiz = path.resolve(raiz);
  if (!fs.existsSync(path.join(raiz, 'index.html'))) {
    throw new Error(`No hay web construida en ${raiz}: ejecuta antes npm run test:web (o node rwadar-publicar.js --local --sin-sincronizar).`);
  }
  const peticionesSupabase = [];
  const worker = await cargarWorker({ raiz, fetchSupabase: crearAuthSimulado({ registro: peticionesSupabase, responder }) });
  const env = { ASSETS: crearAssetsLocales(raiz) };
  const servidor = http.createServer(async (req, res) => {
    try {
      // Como rwadar-servir.js: solo Host de loopback con su puerto.
      if (!HOST_LOCAL.test(req.headers.host || '')) { res.writeHead(421, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('host no permitido'); return; }
      const headers = new Headers();
      for (const [nombre, valor] of Object.entries(req.headers)) {
        if (valor === undefined || ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive'].includes(nombre)) continue;
        headers.set(nombre, Array.isArray(valor) ? valor.join(', ') : valor);
      }
      const cookie = headers.get('cookie') || '';
      if (conSesion && !cookie.split(';').some(c => c.trim().startsWith(COOKIE_SESION + '='))) {
        headers.set('cookie', (cookie ? cookie + '; ' : '') + COOKIE_SESION + '=' + TOKEN_PRUEBA);
      }
      const trozos = [];
      for await (const trozo of req) trozos.push(trozo);
      const sinCuerpo = req.method === 'GET' || req.method === 'HEAD';
      const request = new Request('http://' + req.headers.host + req.url, { method: req.method, headers,
        ...(sinCuerpo ? {} : { body: Buffer.concat(trozos) }) });
      const respuesta = await worker.fetch(request, env, { waitUntil() {} });
      const salida = {};
      respuesta.headers.forEach((valor, nombre) => { if (nombre !== 'set-cookie') salida[nombre] = valor; });
      // Solo en local: en http://127.0.0.1, upgrade-insecure-requests pediría las
      // hojas y scripts por https y la página saldría sin estilos en una captura.
      if (salida['content-security-policy']) {
        salida['content-security-policy'] = salida['content-security-policy'].replace(/;\s*upgrade-insecure-requests\s*(?=;|$)/, '');
      }
      const cookies = respuesta.headers.getSetCookie();
      if (cookies.length) salida['set-cookie'] = cookies;
      res.writeHead(respuesta.status, salida);
      res.end(req.method === 'HEAD' || !respuesta.body ? undefined : Buffer.from(await respuesta.arrayBuffer()));
    } catch (error) {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error del arnés local: ' + error.message);
    }
  });
  await new Promise((resolver, rechazar) => { servidor.once('error', rechazar); servidor.listen(puerto, '127.0.0.1', resolver); });
  const real = servidor.address().port;
  return { url: 'http://127.0.0.1:' + real, puerto: real, raiz, peticionesSupabase,
    cerrar: () => new Promise(resolver => { servidor.closeAllConnections?.(); servidor.close(() => resolver()); }) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const opcion = nombre => process.argv.find(a => a.startsWith(`--${nombre}=`))?.slice(nombre.length + 3);
  const raiz = path.resolve(RAIZ_REPO, opcion('raiz') || 'rwadar-publicado');
  const puerto = Number(opcion('puerto') ?? 8788);
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535) { console.error('--puerto no válido'); process.exit(2); }
  try {
    const local = await arrancarWorkerLocal({ raiz, puerto, conSesion: process.argv.includes('--con-sesion') });
    console.log(`Worker local de RWAdar sobre ${path.relative(RAIZ_REPO, raiz) || raiz}: ${local.url}/`);
    console.log(process.argv.includes('--con-sesion')
      ? 'Con sesión: cada petición lleva la cookie de la cuenta de prueba.'
      : `Sin sesión. Cookie de la cuenta de prueba: ${COOKIE_SESION}=${TOKEN_PRUEBA}`);
    console.log('Supabase simulado: nada sale de la máquina. Ctrl+C para parar.');
  } catch (error) {
    console.error('No se pudo arrancar:', error.message);
    process.exit(1);
  }
}
