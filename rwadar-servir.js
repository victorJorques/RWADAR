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

   Además acepta POST /guardar?n=algo.png y escribe el cuerpo junto a
   este archivo. Suena raro y tiene un motivo: el lienzo 3D no se puede
   comprobar con una captura de pantalla —ni el modo sin ventana ni el
   panel de vista previa componen fotogramas—, así que la página dibuja
   un fotograma a mano, lo empaqueta en PNG y lo manda aquí. Es la única
   forma de VER lo que sale de la tarjeta gráfica.
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path');

const DIR = path.join(__dirname, 'rwadar-site');
const PUERTO = 4173;
const TIPO = {
  '.html': 'text/html; charset=utf-8', '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  /* Sin estos dos, lo desconocido sale como application/octet-stream y el
     navegador se niega a registrar el trabajador de segundo plano y a leer
     el manifiesto. En Netlify funcionaría y aquí no: el peor de los fallos,
     el que solo aparece en producción. */
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/guardar')) {
    const n = (new URL(req.url, 'http://x').searchParams.get('n') || 'captura.png')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const trozos = [];
    req.on('data', c => trozos.push(c));
    req.on('end', () => {
      fs.writeFileSync(path.join(__dirname, n), Buffer.concat(trozos));
      console.log('guardado ' + n);
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);

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

  if (p === '/') p = '/index.html';
  const f = path.join(DIR, p);
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); return res.end('no existe'); }
  res.writeHead(200, {
    'Content-Type': TIPO[path.extname(f)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(f).pipe(res);
}).listen(PUERTO, () => console.log('RWAdar en http://localhost:' + PUERTO));
