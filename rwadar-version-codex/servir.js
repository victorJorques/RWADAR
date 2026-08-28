/* =====================================================================
   RWAdar · versión de Codex, solo en local
   ---------------------------------------------------------------------
       node servir.js            solo este ordenador (localhost)
       node servir.js --movil    además, tu red local, protegido con clave

   Esta carpeta es lo que Codex publicó en Cloudflare Pages entre el 20 y
   el 23 de agosto de 2026. Se rescató descargándola el 25 de agosto,
   justo antes de apagar el hosting, porque no existía en ningún otro
   sitio: ni en el disco ni en Git. No la borres.

   Por qué hay dos modos: sin el segundo argumento, Node escucha en
   0.0.0.0 y cualquiera de la misma WiFi entra sin pedir permiso. Eso es
   justo lo que no queremos, así que abrirse a la red tiene que costar
   escribir una bandera. Y aun así pide clave.
   ===================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = __dirname;
const PUERTO = 4174;
const A_LA_RED = process.argv.includes('--movil');
const FICHERO_CLAVE = path.join(RAIZ, '.clave-local');

/* La clave se guarda en disco para que el QR impreso o guardado siga
   valiendo mañana. Si quieres invalidarlo todo, borra `.clave-local`. */
function claveDeAcceso() {
  if (fs.existsSync(FICHERO_CLAVE)) return fs.readFileSync(FICHERO_CLAVE, 'utf8').trim();
  const nueva = crypto.randomBytes(9).toString('base64url');
  fs.writeFileSync(FICHERO_CLAVE, nueva + '\n', 'utf8');
  return nueva;
}

const CLAVE = claveDeAcceso();
const GALLETA = 'rwadar_local';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.csv': 'text/csv; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/* Comparación en tiempo constante: comparar claves con === filtra
   información por lo que tarda en fallar. Aquí da igual el ataque real,
   pero no cuesta nada hacerlo bien. */
function claveValida(recibida) {
  if (typeof recibida !== 'string') return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(CLAVE);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function claveDeLaGalleta(cabecera) {
  if (!cabecera) return null;
  for (const trozo of cabecera.split(';')) {
    const [nombre, ...resto] = trozo.trim().split('=');
    if (nombre === GALLETA) return resto.join('=');
  }
  return null;
}

http.createServer((peticion, respuesta) => {
  const url = new URL(peticion.url, 'http://localhost');
  let ruta = decodeURIComponent(url.pathname);

  /* En localhost no se pide nada: es tu propio ordenador. La clave solo
     defiende la puerta que abre `--movil`. */
  const esLocal = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peticion.socket.remoteAddress);

  if (!esLocal) {
    if (claveValida(url.searchParams.get('clave'))) {
      // Primera visita desde el móvil: guarda la galleta y quita la clave
      // de la barra, para que no quede a la vista ni en el historial.
      respuesta.writeHead(302, {
        'Set-Cookie': `${GALLETA}=${CLAVE}; Path=/; Max-Age=86400; SameSite=Lax`,
        'Location': ruta === '/' ? '/' : ruta,
      });
      respuesta.end();
      return;
    }
    if (!claveValida(claveDeLaGalleta(peticion.headers.cookie))) {
      respuesta.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      respuesta.end('<meta name="viewport" content="width=device-width">'
        + '<body style="font:16px system-ui;background:#0B0A0A;color:#F7F5F0;padding:2rem">'
        + '<p>Esta copia de RWAdar es privada. Entra escaneando el código QR.</p>');
      return;
    }
  }

  if (ruta === '/') ruta = '/index.html';
  if (ruta === '/privacidad') ruta = '/privacidad.html';

  const destino = path.join(RAIZ, path.normalize(ruta));
  if (!destino.startsWith(RAIZ)) {
    respuesta.writeHead(403).end('Fuera de la carpeta');
    return;
  }

  fs.readFile(destino, (error, contenido) => {
    if (error) {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end('No encontrado: ' + ruta);
      return;
    }
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
      'X-Robots-Tag': 'noindex, nofollow',
    });
    respuesta.end(contenido);
  });
}).listen(PUERTO, A_LA_RED ? '0.0.0.0' : '127.0.0.1', () => {
  console.log('Version de Codex: http://localhost:' + PUERTO);
  if (!A_LA_RED) {
    console.log('Solo este ordenador. Para verlo en el movil: node servir.js --movil');
    return;
  }
  const nombres = require('os').networkInterfaces();
  for (const lista of Object.values(nombres)) {
    for (const i of lista || []) {
      if (i.family === 'IPv4' && !i.internal) {
        console.log('Desde el movil:  http://' + i.address + ':' + PUERTO + '/?clave=' + CLAVE);
      }
    }
  }
});
