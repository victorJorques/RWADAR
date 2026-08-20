/* =====================================================================
   RWAdar · servidor local para mirar la web antes de publicarla
   ---------------------------------------------------------------------
   Sirve rwadar-site/ en http://localhost:4173 sin caché.

       node rwadar-servir.js

   Vive FUERA de rwadar-site a propósito: todo lo que hay en esa carpeta
   se sube al servidor público.

   Abrir index.html con doble clic también funciona, pero desde file://
   el navegador bloquea la consulta a Supabase, así que la actualización
   automática del registro no se puede probar. Desde aquí sí.

   Con el flag explícito --capturas acepta POST /guardar?n=algo.png y
   escribe el cuerpo junto a
   este archivo. Suena raro y tiene un motivo: el lienzo 3D no se puede
   comprobar con una captura de pantalla —ni el modo sin ventana ni el
   panel de vista previa componen fotogramas—, así que la página dibuja
   un fotograma a mano, lo empaqueta en PNG y lo manda aquí. Es la única
   forma de VER lo que sale de la tarjeta gráfica.
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path');

const DIR = path.join(__dirname, 'rwadar-site');
const DIR_REAL = fs.realpathSync(DIR);
const RAIZ = path.resolve(__dirname);
const argumentoPuerto = process.argv.find(x => /^--puerto=\d+$/.test(x));
const PUERTO = argumentoPuerto ? Number(argumentoPuerto.split('=')[1]) : 4173;
if (!Number.isInteger(PUERTO) || PUERTO < 1024 || PUERTO > 65535) {
  console.error('Puerto no válido (usa --puerto=4173).');
  process.exit(2);
}
const ORIGENES_LOCALES = [`http://127.0.0.1:${PUERTO}`, `http://localhost:${PUERTO}`];
const LIMITE_CAPTURA = 8 * 1024 * 1024;
const CAPTURAS = process.argv.includes('--capturas');
const TIPO = {
  '.html': 'text/html; charset=utf-8', '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};
const CSP = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; " +
  "frame-ancestors 'none'; worker-src 'self'; manifest-src 'self'; script-src 'self'; style-src 'self'; " +
  "font-src 'self' data:; img-src 'self' data:; media-src 'none'; " +
  "connect-src 'self' https://exgpmjpaaebyoolpwced.supabase.co; form-action 'none'";

http.createServer((req, res) => {
  let pedido;
  try { pedido = new URL(req.url, 'http://127.0.0.1'); }
  catch { res.writeHead(400); res.end('petición no válida'); return; }

  if (req.method === 'POST' && pedido.pathname === '/guardar') {
    const origen = req.headers.origin || '';
    if (!CAPTURAS || !ORIGENES_LOCALES.includes(origen)) {
      res.writeHead(403); res.end('capturas desactivadas'); req.resume(); return;
    }
    if (req.headers['content-type'] !== 'image/png') {
      res.writeHead(415); res.end('se esperaba image/png'); req.resume(); return;
    }
    const original = pedido.searchParams.get('n') || 'captura.png';
    const n = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, '');
    const destino = path.resolve(RAIZ, n);
    if (original !== path.basename(original) || n !== original || !n ||
        path.extname(n).toLowerCase() !== '.png' || path.dirname(destino) !== RAIZ) {
      res.writeHead(400); res.end('nombre no válido'); return;
    }
    const declarado = Number(req.headers['content-length'] || 0);
    if (declarado > LIMITE_CAPTURA) {
      res.writeHead(413); res.end('captura demasiado grande'); req.resume(); return;
    }
    const trozos = [];
    let total = 0;
    let rechazado = false;
    req.on('data', c => {
      total += c.length;
      if (total > LIMITE_CAPTURA) {
        rechazado = true;
        res.writeHead(413); res.end('captura demasiado grande');
        req.destroy();
        return;
      }
      trozos.push(c);
    });
    req.on('end', () => {
      if (rechazado) return;
      try {
        const contenido = Buffer.concat(trozos);
        const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        if (contenido.length < firmaPng.length || !contenido.subarray(0, 8).equals(firmaPng)) {
          res.writeHead(415); res.end('PNG no válido'); return;
        }
        if (fs.existsSync(destino) && fs.lstatSync(destino).isSymbolicLink()) {
          res.writeHead(409); res.end('destino no válido'); return;
        }
        fs.writeFileSync(destino, contenido);
        console.log('guardado ' + n);
        res.writeHead(200); res.end('ok');
      } catch {
        res.writeHead(500); res.end('no se pudo guardar');
      }
    });
    return;
  }
  let p;
  try { p = decodeURIComponent(pedido.pathname); }
  catch { res.writeHead(400); return res.end('ruta no válida'); }

  /* El banco de sonidos, en /banco. Vive junto a este archivo y NO dentro
     de rwadar-site, para que no se suba nunca al sitio público. Sirve
     para elegir con el oído entre varias familias de sonido: yo puedo
     medirlas, pero no oírlas. */
  if (p === '/banco' || p === '/banco.html') {
    const b = path.join(__dirname, 'rwadar-banco-de-sonidos.html');
    if (fs.existsSync(b)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(b));
    }
  }

  /* Reproduce las URL limpias y canónicas de Netlify para que la prueba
     local no oculte enlaces rotos que solo aparecerían al publicar. */
  if (p === '/index.html') {
    res.writeHead(301, { Location: '/', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/privacidad.html') {
    res.writeHead(301, { Location: '/privacidad', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/') p = '/index.html';
  if (p === '/privacidad') p = '/privacidad.html';
  const f = path.resolve(DIR, '.' + p);
  const dentro = f === path.resolve(DIR) || f.startsWith(path.resolve(DIR) + path.sep);
  if (!dentro || !fs.existsSync(f) || !fs.statSync(f).isFile()) {
    res.writeHead(404); return res.end('no existe');
  }
  const fReal = fs.realpathSync(f);
  if (fReal !== DIR_REAL && !fReal.startsWith(DIR_REAL + path.sep)) {
    res.writeHead(404); return res.end('no existe');
  }
  res.writeHead(200, {
    'Content-Type': TIPO[path.extname(f)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  fs.createReadStream(f).pipe(res);
}).listen(PUERTO, '127.0.0.1', () => console.log('RWAdar en http://localhost:' + PUERTO));
