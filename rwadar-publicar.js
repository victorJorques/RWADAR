/* =====================================================================
   RWAdar · pre-renderiza y publica
   ---------------------------------------------------------------------
   Ejecuta el propio JavaScript de la página en un entorno simulado y
   vuelca el resultado dentro del HTML. Así el robot de Google encuentra
   las fichas del radar y las descartadas ya escritas, sin tener que
   ejecutar nada. El contenido inyectado es exactamente el que genera el
   navegador, así que no hay discrepancia entre lo que ve el buscador y el
   visitante.

   Uso:  node rwadar-publicar.js --produccion [--sin-sincronizar]
         node rwadar-publicar.js --local [--sin-sincronizar]
         node rwadar-publicar.js --preview [--sin-sincronizar]

   Exactamente uno de los tres modos es obligatorio. --sin-sincronizar es
   solo un modificador: nunca selecciona ni presupone producción.
   ===================================================================== */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');
const { adelgazarJS, adelgazarCSS } = require('./rwadar-adelgazar');
const {
  ARCHIVOS_PUBLICABLES,
  PROYECTO_CLOUDFLARE,
  comprobarConfiguracionAuth,
  comprobarEstadoLegalPublicacion,
  nombreAssetVersionado,
  validarArbolPublicable,
  validarOrigenPublicable,
  versionCacheDesdeEntradas,
} = require('./rwadar-publicacion-segura');

const DIR = path.join(__dirname, 'rwadar-site');
const FILE = path.join(DIR, 'index.html');
const SALIDA = path.join(__dirname, 'rwadar-publicado');
const WRANGLER_VERSION = '4.125.0';
const modos = ['--local', '--preview', '--produccion'].filter(x => process.argv.includes(x));
if (modos.length !== 1) {
  console.error('USO: node rwadar-publicar.js (--local | --preview | --produccion) [--sin-sincronizar]');
  console.error('El modo es obligatorio y solo puede indicarse uno. Sin modo nunca se publica.');
  process.exit(2);
}
const preview = modos[0] === '--preview';
const produccion = modos[0] === '--produccion';
const remoto = preview || produccion;

/* Comprobar el estado declarado antes de consultar la base o generar
   artefactos. La política puede transparentar que el acuerdo interno sigue
   pendiente, pero un blocker, un estado ausente o uno desconocido fallan
   cerrados. */
const privacidad = fs.readFileSync(path.join(DIR, 'privacidad.html'), 'utf8');
if (remoto) {
  try { comprobarEstadoLegalPublicacion(privacidad); }
  catch (e) {
    console.error('PUBLICACION REMOTA BLOQUEADA: estado legal ausente, desconocido o bloqueado.');
    console.error(e.message);
    process.exit(2);
  }
}

/* El control se hace sobre archivos reales, no sobre Git. Debe ocurrir antes
   de sincronizar o de modificar el pre-render: un .env accidental convierte
   toda la ejecución en un no-op. */
try { validarArbolPublicable(DIR); }
catch (e) { console.error('ARBOL PUBLICABLE BLOQUEADO:', e.message); process.exit(2); }
try { validarOrigenPublicable(DIR); }
catch (e) { console.error('ORIGEN PUBLICO BLOQUEADO:', e.message); process.exit(2); }

async function main() {
/* Un preview también carga la aplicación real y puede hablar con Auth. Tras
   retirar el bloqueo documental, todo destino remoto verifica en vivo y en
   solo lectura que las altas NO se autoconfirman. Una respuesta dudosa
   bloquea; el modo local no pasa por aquí. */
if (remoto) {
  try { await comprobarConfiguracionAuth(); }
  catch (e) {
    console.error('PUBLICACION REMOTA BLOQUEADA: configuración de Auth insegura o no verificable.');
    console.error(e.message);
    process.exit(2);
  }
}

/* ---- 0 · traer el contenido desde la base de datos ---- */
if (!process.argv.includes('--sin-sincronizar')) {
  try {
    execFileSync('node', [path.join(__dirname, 'rwadar-app', 'sincronizar.js')],
      { stdio: 'inherit' });
  } catch (e) {
    console.error('No se pudo sincronizar con Supabase. No se publica nada.');
    console.error('(usa --sin-sincronizar para saltarte este paso a proposito)');
    process.exit(1);
  }
}

let html = fs.readFileSync(FILE, 'utf8');
const htmlOriginal = html;

/* ---- 0b · la CSP estricta también es un invariante de publicación ----
   Un atributo style/on* o un bloque ejecutable inline haría que la página
   fallara bajo nuestras propias cabeceras (o tentaría a reabrir
   unsafe-inline). Se valida la portada y las páginas auxiliares. */
function validaMarcadoEstricto(nombre, contenido) {
  if (/<style\b/i.test(contenido) || /\sstyle\s*=/i.test(contenido) ||
      /\son[a-z]+\s*=/i.test(contenido)) {
    throw new Error(`${nombre} contiene CSS o manejadores inline incompatibles con la CSP`);
  }
  for (const m of contenido.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    throw new Error(`${nombre} contiene un script ejecutable inline`);
  }
}

try {
  for (const nombre of ['index.html', 'privacidad.html', '404.html']) {
    const archivo = path.join(DIR, nombre);
    validaMarcadoEstricto(nombre, fs.readFileSync(archivo, 'utf8'));
  }
  const cabeceras = fs.readFileSync(path.join(DIR, '_headers'), 'utf8');
  if (/unsafe-inline/i.test(cabeceras) || !/script-src\s+'self'/i.test(cabeceras) ||
      !/style-src\s+'self'/i.test(cabeceras)) {
    throw new Error('_headers no aplica script-src/style-src propios sin unsafe-inline');
  }
} catch (e) {
  console.error('ERROR CSP:', e.message);
  process.exit(1);
}

/* ---- 1 · cargar el script propio versionado de la página ---- */
const scriptsPropios = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
if (!scriptsPropios.length) {
  console.error('ERROR: index.html no declara su script propio externo.');
  process.exit(1);
}
const src = scriptsPropios.at(-1)[1];
if (!src.startsWith('/assets/') || !src.endsWith('.js')) {
  console.error('ERROR: la aplicación debe usar un script versionado dentro de /assets/.');
  process.exit(1);
}
const scriptFile = path.resolve(DIR, '.' + src);
if (!scriptFile.startsWith(path.resolve(DIR) + path.sep) || !fs.existsSync(scriptFile)) {
  console.error('ERROR: no se encuentra el script propio ' + src);
  process.exit(1);
}
const script = fs.readFileSync(scriptFile, 'utf8');

/* ---- 1b · ¿compila? -------------------------------------------------
   Un error de sintaxis no rompe el pre-renderizado: el simulador ejecuta
   el script en su propio contexto y, si revienta, aquí lo veríamos. Pero
   un choque de nombres —dos `const n` en el mismo bloque— tumba el script
   ENTERO en el navegador y deja la página muerta con las fichas ya
   escritas en el HTML, así que el pre-renderizado parece correcto. Pasó.
   Comprobarlo aquí cuesta un milisegundo. */
try {
  new Function(script);
} catch (e) {
  console.error('ERROR DE SINTAXIS en el script de index.html: ' + e.message);
  console.error('No se toca el archivo ni se publica.');
  process.exit(1);
}

/* ---- 2 · DOM mínimo que solo recuerda lo que se le escribe ---- */
const capturado = {};
const capturadoTexto = {};
const lista = [];
lista.forEach = Array.prototype.forEach.bind(lista);

function nodo(id) {
  return {
    id,
    set innerHTML(v) { capturado[id] = v; },
    get innerHTML() { return capturado[id] || ''; },
    set textContent(v) { capturadoTexto[id] = String(v == null ? '' : v); },
    get textContent() { return capturadoTexto[id] || ''; },
    value: '',
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    add(){}, focus(){}, setAttribute(){}, removeAttribute(){},
    hasAttribute(){ return false; },
    querySelector(){ return null; },
    querySelectorAll(){ return lista; },
    addEventListener(){}, getBoundingClientRect(){ return {left:0,top:0,width:0,height:0}; },
    getContext(){ return null; },
    style: {},
  };
}

const document = {
  getElementById(id) { return id === 'gl' ? null : nodo(id); },
  querySelector(){ return null; },
  querySelectorAll(){ return lista; },
  addEventListener(){},
  createElement(){ return nodo('tmp'); },
  body: nodo('body'),
};

const contexto = {
  document,
  console,
  Option: function(){},
  /* reduce = true evita que arranque el temporizador del explicador */
  window: { matchMedia: () => ({ matches: true }), addEventListener(){} },
  matchMedia: () => ({ matches: true }),
  requestAnimationFrame(){}, setInterval(){}, clearInterval(){},
  setTimeout(){}, clearTimeout(){},
  addEventListener(){}, removeEventListener(){},
  /* El navegador real puede negar el almacenamiento (modo privado); aquí
     simplemente no existe. La página lo tolera en ambos casos. */
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
  performance: { now: () => 0 },
  IntersectionObserver: function(){ this.observe = () => {}; this.unobserve = () => {}; this.disconnect = () => {}; },
  URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function(){},
  Math, JSON, Date, Set, Array, Object, String, Number, Float32Array, Uint16Array,
};
contexto.globalThis = contexto;
contexto.window.document = document;

vm.createContext(contexto);
vm.runInContext(script, contexto, { timeout: 15000 });

/* ---- 3 · comprobar que hay algo que inyectar ---- */
for (const id of ['grid', 'outlist']) {
  if (!capturado[id] || capturado[id].length < 500) {
    console.error(`ERROR: no se pudo generar "${id}". No se toca el archivo.`);
    process.exit(1);
  }
}
if (!capturado.emiLista || capturado.emiLista.length < 100) {
  console.error('ERROR: no se pudo generar "emiLista". No se toca el archivo.');
  process.exit(1);
}

/* Cada elemento de P genera exactamente una ficha tradicional y una portada
   móvil. La portada es ahora el acceso principal en la PWA: una sincronización
   que renombre o añada una plataforma no puede publicar una ruta rota. */
const nombresPlataformas = Array.from(
  vm.runInContext('P.map(plataforma => plataforma.n)', contexto, { timeout: 1000 }),
  nombre => String(nombre)
);
const slugPortada = nombre => nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function validarPortadasPlataformas(contenido, nombres) {
  const fichas = (contenido.match(/class="abrir"/g) || []).length;
  const rutas = [...contenido.matchAll(/\bsrc="(\/plataformas\/[a-z0-9-]+\.webp)"/g)]
    .map(coincidencia => coincidencia[1]);
  const esperadas = nombres.map(nombre => `/plataformas/${slugPortada(nombre)}.webp`);
  if (!fichas || nombres.length !== fichas || rutas.length !== fichas ||
      new Set(rutas).size !== fichas) {
    throw new Error(`se esperaban ${fichas} portadas locales únicas y se encontraron ${rutas.length}`);
  }
  for (let i = 0; i < esperadas.length; i++) {
    const ruta = rutas[i];
    if (ruta !== esperadas[i]) {
      throw new Error(`la portada de ${nombres[i]} debe ser ${esperadas[i]} y se encontró ${ruta}`);
    }
    const relativa = ruta.slice(1);
    if (!ARCHIVOS_PUBLICABLES.includes(relativa)) {
      throw new Error(`la portada no está incluida en el manifiesto publicable: ${ruta}`);
    }
    const archivo = path.join(DIR, ...relativa.split('/'));
    if (!fs.existsSync(archivo) || !fs.statSync(archivo).isFile()) {
      throw new Error(`falta la portada local: ${ruta}`);
    }
    const bytes = fs.readFileSync(archivo);
    if (bytes.length <= 1024 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
      throw new Error(`la portada no es un WebP válido: ${ruta}`);
    }
  }
  return rutas;
}

try { validarPortadasPlataformas(capturado.grid, nombresPlataformas); }
catch (e) { console.error('ERROR PORTADAS:', e.message); process.exit(1); }

/* ---- 4 · inyectar entre marcas, de forma repetible ---- */
function inyectar(html, id, contenido) {
  const marca = new RegExp(
    `(<div class="[^"]*" id="${id}">)(<!--pre:ini-->[\\s\\S]*?<!--pre:fin-->)?`,
    ''
  );
  if (!marca.test(html)) throw new Error(`contenedor "${id}" no encontrado`);
  return html.replace(marca, `$1<!--pre:ini-->${contenido}<!--pre:fin-->`);
}

html = inyectar(html, 'grid', capturado.grid);
html = inyectar(html, 'outlist', capturado.outlist);
html = inyectar(html, 'emiLista', capturado.emiLista);
/* La misma fecha derivada de P que ve un navegador debe quedar escrita para
   crawlers y lectores sin JavaScript. No se acepta conservar una fecha fija. */
const pieRevision = capturadoTexto.pieRevision;
if (!/^Última revisión del registro: \d{2}\.\d{2}\.\d{4}$/.test(pieRevision)) {
  console.error('ERROR: no se pudo derivar la fecha de revisión del registro.');
  process.exit(1);
}
const escapaTexto = texto => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const marcaPie = /(<p id="pieRevision">)[\s\S]*?(<\/p>)/;
if (!marcaPie.test(html)) {
  console.error('ERROR: no se encuentra pieRevision en index.html.');
  process.exit(1);
}
html = html.replace(marcaPie, `$1${escapaTexto(pieRevision)}$2`);
try { validaMarcadoEstricto('index.html pre-renderizado', html); }
catch (e) { console.error('ERROR CSP:', e.message); process.exit(1); }
if (html !== htmlOriginal) fs.writeFileSync(FILE, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
const nFichas = (capturado.grid.match(/class="abrir"/g) || []).length;
const nFuera  = (capturado.outlist.match(/class="fila"/g) || []).length;
const nEmisiones = (capturado.emiLista.match(/<article class="emi/g) || []).length;
console.log(`Pre-renderizado: ${nFichas} fichas, ${nFuera} descartadas y ${nEmisiones} emisiones escritas en el HTML (${kb} kB).`);

/* ---- 5 · construir el árbol desechable que sí se puede subir ---- */
function construirSalida() {
  if (path.dirname(SALIDA) !== path.resolve(__dirname) || path.basename(SALIDA) !== 'rwadar-publicado') {
    throw new Error('ruta de salida no válida');
  }
  const temporal = path.join(__dirname, `.rwadar-publicado-${process.pid}.tmp`);
  if (path.dirname(temporal) !== path.resolve(__dirname)) throw new Error('ruta temporal no válida');
  fs.rmSync(temporal, { recursive: true, force: true });
  try {
    /* Se construye desde el manifiesto validado. No existe ninguna copia
       recursiva capaz de arrastrar un secreto o captura accidental. */
    for (const nombre of ARCHIVOS_PUBLICABLES) {
      const origen = path.join(DIR, ...nombre.split('/'));
      const destino = path.join(temporal, ...nombre.split('/'));
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(origen, destino);
    }

    /* Minificar primero y poner después una huella del contenido que sí se
       servirá. De este modo immutable nunca congela bytes bajo un nombre
       antiguo y un cambio de datos también cambia el JS. */
    const referencias = new Map();
    for (const nombre of ARCHIVOS_PUBLICABLES.filter(x => x.startsWith('assets/'))) {
      const archivo = path.join(temporal, ...nombre.split('/'));
      const fuente = fs.readFileSync(archivo, 'utf8');
      let reducido;
      if (nombre.endsWith('.js')) {
        reducido = adelgazarJS(fuente);
        new Function(reducido);
      } else reducido = adelgazarCSS(fuente);
      const versionado = nombreAssetVersionado(nombre, reducido);
      const archivoVersionado = path.join(temporal, ...versionado.split('/'));
      fs.writeFileSync(archivoVersionado, reducido, 'utf8');
      fs.rmSync(archivo);
      referencias.set('/' + nombre, '/' + versionado);
    }

    const reescribirReferencias = contenido => {
      let salida = contenido;
      for (const [antes, despues] of referencias) salida = salida.split(antes).join(despues);
      return salida;
    };
    for (const nombre of ['index.html', 'privacidad.html', '404.html', 'sw.js']) {
      const archivo = path.join(temporal, nombre);
      fs.writeFileSync(archivo, reescribirReferencias(fs.readFileSync(archivo, 'utf8')), 'utf8');
    }

    const salidaEsperada = ARCHIVOS_PUBLICABLES.map(nombre =>
      referencias.get('/' + nombre)?.slice(1) || nombre).sort();

    /* VERSION representa todo el artefacto, no una fecha escrita a mano. El
       worker entra normalizado con un marcador para romper únicamente la
       dependencia circular: cambiar su lógica también cambia VERSION. */
    const workerFile = path.join(temporal, 'sw.js');
    const workerAnterior = fs.readFileSync(workerFile, 'utf8');
    if (!/const VERSION = 'rwadar-v[^']+';/.test(workerAnterior)) {
      throw new Error('sw.js no declara una VERSION sustituible');
    }
    const entradasVersion = {};
    for (const nombre of salidaEsperada) {
      const contenido = fs.readFileSync(path.join(temporal, ...nombre.split('/')));
      entradasVersion[nombre] = nombre === 'sw.js'
        ? Buffer.from(contenido.toString('utf8').replace(
          /const VERSION = 'rwadar-v[^']+';/, "const VERSION = '__RWADAR_VERSION__';"), 'utf8')
        : contenido;
    }
    const versionCache = versionCacheDesdeEntradas(entradasVersion);
    fs.writeFileSync(workerFile,
      workerAnterior.replace(/const VERSION = 'rwadar-v[^']+';/, `const VERSION = '${versionCache}';`),
      'utf8');

    for (const nombre of ['index.html','privacidad.html','404.html']) {
      validaMarcadoEstricto(`salida/${nombre}`, fs.readFileSync(path.join(temporal, nombre), 'utf8'));
    }
    validarArbolPublicable(temporal, salidaEsperada);
    fs.rmSync(SALIDA, { recursive: true, force: true });
    fs.renameSync(temporal, SALIDA);
    return { srcPublicado: referencias.get(src), versionCache };
  } finally {
    fs.rmSync(temporal, { recursive: true, force: true });
  }
}

let resultadoSalida;
try { resultadoSalida = construirSalida(); }
catch (e) { console.error('ERROR AL CONSTRUIR:', e.message); process.exit(1); }
if (!resultadoSalida.srcPublicado) {
  console.error('ERROR AL CONSTRUIR: el JavaScript principal no quedó versionado.');
  process.exit(1);
}
const fuenteKb=(Buffer.byteLength(script,'utf8')/1024).toFixed(0);
const publicadoKb=(fs.statSync(path.join(SALIDA,'.'+resultadoSalida.srcPublicado)).size/1024).toFixed(0);
console.log(`Salida preparada en rwadar-publicado (JS ${fuenteKb} → ${publicadoKb} kB; caché ${resultadoSalida.versionCache}).`);

/* ---- 6 · publicar ---- */
if (process.argv.includes('--local')) {
  console.log('Modo local: salida verificada; no se publica.');
  process.exit(0);
}

/* Node 24 ya no ejecuta archivos .cmd con execFileSync en Windows (EINVAL).
   ComSpec lanza el mismo npx.cmd sin activar shell para el resto de sistemas;
   todos los argumentos posteriores son constantes cerradas del publicador. */
const wrangler = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
const prefijoWrangler = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx.cmd'] : [];
const rama = preview ? 'revision' : 'main';
const destino = preview ? 'preview de Cloudflare Pages' : 'producción de Cloudflare Pages';
console.log(`Publicando en ${destino}…`);

/* La producción y los previews son operaciones deliberadamente distintas.
   Si Cloudflare rechaza producción (credenciales, permisos, etc.), no se
   intenta sortear el bloqueo subiendo a otro proveedor ni promoviendo una
   rama de revisión. */
try {
  const args = [
    ...prefijoWrangler,
    '--yes', `wrangler@${WRANGLER_VERSION}`, 'pages', 'deploy', SALIDA,
    '--project-name', PROYECTO_CLOUDFLARE,
    '--branch', rama,
  ];
  execFileSync(wrangler, args, { stdio: 'inherit', shell: false });
} catch (e) {
  console.error(`\nCloudflare rechazo la publicacion en ${destino}.`);
  console.error(`Detalle: ${e && (e.code || e.message) || 'error desconocido'}.`);
  console.error('No se ha creado ningun despliegue alternativo ni se ha usado Netlify.');
  process.exitCode = 1;
}
}

main().catch(e => {
  console.error('ERROR INESPERADO DEL PUBLICADOR:', e && e.message || e);
  process.exitCode = 1;
});
