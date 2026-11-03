/* =====================================================================
   RWAdar · servidor local para mirar la web antes de publicarla
   ---------------------------------------------------------------------
   Sirve rwadar-site/ en http://localhost:4173 sin caché.

       node rwadar-servir.js

   Vive FUERA de rwadar-site a propósito: todo lo que hay en esa carpeta
   se sube al servidor público.

   Abrir index.html con doble clic también funciona, pero desde file:// no se
   reproducen rutas, CSP ni service worker. Este servidor activa la revisión
   aislada de loopback: usa el snapshot publicable y no permite conectar a Supabase.
   --lote=2026-10-22-v2 revisa un lote preparado sin aplicarlo al servidor.
   El fixture antiguo solo se activa con --fixture-historico.

   Con el flag explícito --capturas acepta POST /guardar?n=algo.png y
   escribe el cuerpo junto a
   este archivo. Suena raro y tiene un motivo: el lienzo 3D no se puede
   comprobar con una captura de pantalla —ni el modo sin ventana ni el
   panel de vista previa componen fotogramas—, así que la página dibuja
   un fotograma a mano, lo empaqueta en PNG y lo manda aquí. Es la única
   forma de VER lo que sale de la tarjeta gráfica.
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path');
const assert = require('node:assert/strict');
const { cargarActivosEditoriales } = require('./rwadar-ofertas-editoriales');
const { leerCatalogo, validarCatalogoSnapshot } = require('./rwadar-fichas');
const { cargarFuentesLocales, construirSqlImportacion, MAX_VIGENCIA_DIAS } = require('./rwadar-app/catalogo-publico');
const PAGINAS_FICHAS = require('./rwadar-fichas-manifiesto');

const DIR = path.join(__dirname, 'rwadar-site');
const DIR_REAL = fs.realpathSync(DIR);
const RAIZ = path.resolve(__dirname);
const RAIZ_REAL = fs.realpathSync(RAIZ);
const ESCAPARATE_LOCAL = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'escaparate-local.json');
const FIXTURE_HISTORICO = process.argv.includes('--fixture-historico');
const argumentoLote = process.argv.find(x => x.startsWith('--lote='));
const LOTE_LOCAL = argumentoLote ? argumentoLote.slice(7) : null;
if (LOTE_LOCAL && !/^\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?-v2$/.test(LOTE_LOCAL)) throw new Error('Lote local no válido');
if (LOTE_LOCAL && FIXTURE_HISTORICO) throw new Error('Elige un lote o el fixture histórico');

function snapshotLocal({raiz = RAIZ, lote = LOTE_LOCAL} = {}) {
  if (lote && !/^\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?-v2$/.test(lote)) throw new Error('Lote local no válido');
  let datos = leerCatalogo(raiz);
  if (lote) {
    // La etiqueta del lote es la entrega completa (AAAA-MM-DD o AAAA-MM-DD.N), no solo su fecha.
    const fuentes = cargarFuentesLocales(raiz,{revision:lote.slice(0,-3),versionEsquema:2});
    const importacion = construirSqlImportacion(fuentes);
    const {escaparate,manifiesto} = fuentes;
    const revision = JSON.parse(fs.readFileSync(path.join(raiz,'rwadar-app/data/importaciones',
      'catalogo-'+lote,'revision.json'),'utf8'));
    assert(revision.versionEsquema===2 && revision.revisionId===importacion.revisionId &&
      revision.hash===importacion.hash && revision.fechaRadar===fuentes.radar.verificadoEl &&
      revision.plataformas===manifiesto.plataformasEsperadas && revision.ofertas===manifiesto.ofertasEsperadas,
      'La identidad o los conteos del lote local no coinciden con su contenido');
    const verificaciones = new Map(escaparate.plataformas.map(p=>[p.slug,p.verificacionLocal]));
    assert.equal(datos.plataformas.length,manifiesto.plataformasEsperadas,
      'El snapshot canónico no contiene todas las plataformas del lote local');
    const metadatos = {version_esquema:2,plataformas_esperadas:manifiesto.plataformasEsperadas,
      ofertas_esperadas:manifiesto.ofertasEsperadas,colecciones_esperadas:{...manifiesto.coleccionesEsperadas},
      verificado_lote_el:revision.fechaRadar,vigencia_lote_dias:MAX_VIGENCIA_DIAS,revisionId:revision.revisionId};
    const minimo = datos.manifiesto;
    datos.plataformas = datos.plataformas.map(p=>{
      if (!verificaciones.has(p.slug)) throw new Error('Plataforma ausente en el lote');
      return {...p,...metadatos,verificacionLocal:verificaciones.get(p.slug)};
    });
    datos.ofertas = escaparate.ofertas.map(o=>({...o,...metadatos,catalogo:true}));
    datos = validarCatalogoSnapshot(datos,{manifiesto:minimo});
  }
  return {versionEsquema:2,lote:lote || 'snapshot-publicable',preparado:Boolean(lote),
    fuente:{url:'https://rwadar.pages.dev/',revision:datos.revision},manifiesto:datos.manifiesto,
    plataformas:datos.plataformas,descartes:datos.fuera,ofertas:datos.ofertas};
}
const DIR_OFERTAS_LOCAL = path.join(RAIZ, 'rwadar-movil', 'assets', 'ofertas');
const ACTIVOS_EDITORIALES = cargarActivosEditoriales(RAIZ);
const EDITORIALES_LOCALES = new Map(ACTIVOS_EDITORIALES.publicables.map((entrada) => [
  path.basename(entrada.salida), entrada.origen,
]));
const argumentoPuerto = process.argv.find(x => /^--puerto=\d+$/.test(x));
const PUERTO = argumentoPuerto ? Number(argumentoPuerto.split('=')[1]) : 4173;
if (!Number.isInteger(PUERTO) || PUERTO < 1024 || PUERTO > 65535) {
  console.error('Puerto no válido (usa --puerto=4173).');
  process.exit(2);
}
const ORIGENES_LOCALES = [`http://127.0.0.1:${PUERTO}`, `http://localhost:${PUERTO}`];
const HOSTS_LOCALES = new Set([`127.0.0.1:${PUERTO}`, `localhost:${PUERTO}`]);
const LIMITE_CAPTURA = 8 * 1024 * 1024;
const CAPTURAS = process.argv.includes('--capturas');
const TIPO = {
  '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/rss+xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};
const CSP = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; " +
  "frame-ancestors 'none'; worker-src 'self'; manifest-src 'self'; script-src 'self'; style-src 'self'; " +
  "font-src 'self' data:; img-src 'self' data:; media-src 'none'; " +
  "connect-src 'self'; form-action 'none'";

const cabecerasSeguras = tipo => ({
  'Content-Type': tipo,
  'Cache-Control': 'no-store',
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
});

function dentroDe(base, destino) {
  return destino === base || destino.startsWith(base + path.sep);
}

function servirLecturaLocal(req, res, archivo, tipo) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' });
    res.end('método no permitido');
    return;
  }
  let real;
  try {
    if (!fs.statSync(archivo).isFile()) throw new Error('no es archivo');
    real = fs.realpathSync(archivo);
  } catch {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    res.end('no existe');
    return;
  }
  if (!dentroDe(RAIZ_REAL, real)) {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    res.end('no existe');
    return;
  }
  res.writeHead(200, cabecerasSeguras(tipo));
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(real).pipe(res);
}

function sanearIndiceLocal(contenido) {
  const reemplazarPrerender = (html, id, interior) => {
    const patron = new RegExp(`(<[^>]+\\bid=["']${id}["'][^>]*>\\s*<!--pre:ini-->)[\\s\\S]*?(<!--pre:fin-->)`, 'i');
    if (!patron.test(html)) throw new Error(`no se encontró el bloque prerender ${id}`);
    return html.replace(patron, `$1${interior}$2`);
  };
  let html = contenido;
  html = reemplazarPrerender(html, 'grid',
    '<div class="emis-vacio" role="status"><h3>Cargando catálogo local verificado…</h3><p>La revisión aislada sustituirá este marcador cuando valide el fixture vigente.</p></div>');
  html = reemplazarPrerender(html, 'outlist',
    '<div class="emis-vacio" role="status"><h3>Cargando exclusiones verificadas…</h3><p>No se muestran descartes anteriores mientras se valida la capa local.</p></div>');
  html = html
    .replace(/<span class="n">[^<]*<\/span><span class="l">Analizadas<\/span>/,
      '<span class="n">—</span><span class="l">Analizadas</span>')
    .replace(/<span class="n oro" id="s1">[^<]*<\/span>/,
      '<span class="n oro" id="s1">—</span>')
    .replace(/<span class="n menta" id="s3">[^<]*<\/span>/,
      '<span class="n menta" id="s3">—</span>')
    .replace(/<span class="n coral" id="s4">[^<]*<\/span>/,
      '<span class="n coral" id="s4">—</span>');
  return html;
}

function servirIndiceLocal(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' });
    res.end('método no permitido');
    return;
  }
  let contenido;
  try { contenido = sanearIndiceLocal(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')); }
  catch (error) {
    res.writeHead(500, cabecerasSeguras('text/plain; charset=utf-8'));
    res.end('no se pudo preparar la revisión local');
    console.error('No se pudo sanear index.html local:', error.message);
    return;
  }
  res.writeHead(200, cabecerasSeguras('text/html; charset=utf-8'));
  if (req.method === 'HEAD') res.end();
  else res.end(contenido);
}

const servidor = http.createServer((req, res) => {
  /* Escuchar en loopback evita conexiones directas desde la LAN, pero no un
     Host arbitrario enviado a 127.0.0.1 (por ejemplo, mediante DNS rebinding).
     El origen de revisión es cerrado y siempre incluye el puerto no privilegiado. */
  const host = typeof req.headers.host === 'string' ? req.headers.host.toLowerCase() : '';
  if (!HOSTS_LOCALES.has(host)) {
    res.writeHead(421, {
      'Cache-Control': 'no-store',
      'Connection': 'close',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('host no permitido');
    req.resume();
    return;
  }
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

  /* Este escaparate solo existe en el servidor de revisión local. Queda
     fuera de rwadar-site para que el publicador no pueda incluir por error
     ni los datos ni las imágenes entregadas para esta revisión interna. */
  if (p === '/__rwadar_local/escaparate.json') {
    if (FIXTURE_HISTORICO) return servirLecturaLocal(req, res, ESCAPARATE_LOCAL, 'application/json; charset=utf-8');
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    try {
      const contenido = JSON.stringify(snapshotLocal());
      res.writeHead(200,cabecerasSeguras('application/json; charset=utf-8'));
      res.end(req.method==='HEAD' ? '' : contenido);
    } catch {
      res.writeHead(503,cabecerasSeguras('application/json; charset=utf-8'));
      res.end('{"error":"lote local no disponible o incompleto"}');
    }
    return;
  }
  if (p.startsWith('/ofertas-editoriales/')) {
    const nombre = p.slice('/ofertas-editoriales/'.length);
    const archivo = EDITORIALES_LOCALES.get(nombre);
    if (!archivo || nombre !== path.basename(nombre)) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    return servirLecturaLocal(
      req, res, archivo,
      nombre === 'manifest.json' ? 'application/json; charset=utf-8' : 'image/webp'
    );
  }
  if (p.startsWith('/__rwadar_local/ofertas/')) {
    const nombre = p.slice('/__rwadar_local/ofertas/'.length);
    if (!/^[a-z0-9-]+\.webp$/.test(nombre)) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    let baseReal, archivo;
    try {
      baseReal = fs.realpathSync(DIR_OFERTAS_LOCAL);
      archivo = path.resolve(DIR_OFERTAS_LOCAL, nombre);
    } catch {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    if (!dentroDe(RAIZ_REAL, baseReal) || !dentroDe(path.resolve(DIR_OFERTAS_LOCAL), archivo)) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    let archivoReal;
    try { archivoReal = fs.realpathSync(archivo); }
    catch {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    if (!dentroDe(baseReal, archivoReal)) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      return res.end('no existe');
    }
    return servirLecturaLocal(req, res, archivoReal, 'image/webp');
  }
  if (p.startsWith('/__rwadar_local/')) {
    res.writeHead(404, { 'Cache-Control': 'no-store' });
    return res.end('no existe');
  }

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

  /* Reproduce las URL limpias y canónicas del alojamiento público para que la prueba
     local no oculte enlaces rotos que solo aparecerían al publicar. */
  if (p === '/index.html') {
    res.writeHead(301, { Location: '/', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/privacidad.html') {
    res.writeHead(301, { Location: '/privacidad', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/transparencia-comercial.html') {
    res.writeHead(301, { Location: '/transparencia-comercial', 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/para-empresas.html') {
    res.writeHead(301, { Location: '/para-empresas', 'Cache-Control': 'no-store' });
    return res.end();
  }
  /* RWAdar Academy: /academy → /academy/ y /academy/<lección> → <lección>.html,
     igual que Cloudflare Pages. */
  if (p === '/academy') {
    res.writeHead(308, { Location: '/academy/', 'Cache-Control': 'no-store' });
    return res.end();
  }
  const leccionHtml = p.match(/^\/academy\/([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/);
  if (leccionHtml) {
    res.writeHead(308, { Location: `/academy/${leccionHtml[1] === 'index' ? '' : leccionHtml[1]}`, 'Cache-Control': 'no-store' });
    return res.end();
  }
  if (p === '/academy/') p = '/academy/index.html';
  else if (/^\/academy\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p)) p += '.html';
  if (p === '/') return servirIndiceLocal(req, res);
  if (p === '/privacidad') p = '/privacidad.html';
  if (p === '/transparencia-comercial') p = '/transparencia-comercial.html';
  if (p === '/para-empresas') p = '/para-empresas.html';
  const paginaFicha = PAGINAS_FICHAS.find(nombre => nombre.endsWith('.html') && p === '/' + nombre.slice(0,-5));
  if (paginaFicha) p = '/' + paginaFicha;
  const f = path.resolve(DIR, '.' + p);
  const dentro = f === path.resolve(DIR) || f.startsWith(path.resolve(DIR) + path.sep);
  if (!dentro || !fs.existsSync(f) || !fs.statSync(f).isFile()) {
    res.writeHead(404); return res.end('no existe');
  }
  const fReal = fs.realpathSync(f);
  if (fReal !== DIR_REAL && !fReal.startsWith(DIR_REAL + path.sep)) {
    res.writeHead(404); return res.end('no existe');
  }
  res.writeHead(200, cabecerasSeguras(TIPO[path.extname(f)] || 'application/octet-stream'));
  fs.createReadStream(f).pipe(res);
});
module.exports = {snapshotLocal,sanearIndiceLocal};
if (require.main===module) servidor.listen(PUERTO, '127.0.0.1', () => console.log('RWAdar en http://localhost:' + PUERTO));
