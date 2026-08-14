/* =====================================================================
   RWAdar · pre-renderiza y publica
   ---------------------------------------------------------------------
   Ejecuta el propio JavaScript de la página en un entorno simulado y
   vuelca el resultado dentro del HTML. Así el robot de Google encuentra
   las fichas del radar y las descartadas ya escritas, sin tener que
   ejecutar nada. El contenido inyectado es exactamente el que genera el
   navegador, así que no hay discrepancia entre lo que ve el buscador y el
   visitante.

   Uso:  node rwadar-publicar.js                    sincroniza, pre-renderiza y publica
         node rwadar-publicar.js --local            solo pre-renderiza, no sube nada
         node rwadar-publicar.js --sin-sincronizar  no consulta Supabase
   ===================================================================== */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, 'rwadar-site');
const FILE = path.join(DIR, 'index.html');
const SITE = '0211fd28-d371-43cd-9d93-3944fea57680';

/* ---- 0 · traer el contenido desde la base de datos ---- */
if (!process.argv.includes('--sin-sincronizar')) {
  try {
    execFileSync('node', [path.join(__dirname, 'rwadar-app', 'sincronizar.js')],
      { stdio: 'inherit' });
  } catch (e) {
    console.error('No se pudo sincronizar con Supabase. Se publica lo que haya en local.');
    console.error('(usa --sin-sincronizar para saltarte este paso a proposito)');
    process.exit(1);
  }
}

let html = fs.readFileSync(FILE, 'utf8');

/* ---- 1 · extraer el script de la página ---- */
const script = html.slice(
  html.lastIndexOf('<script>') + '<script>'.length,
  html.lastIndexOf('</script>')
);

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
const lista = [];
lista.forEach = Array.prototype.forEach.bind(lista);

function nodo(id) {
  return {
    id,
    set innerHTML(v) { capturado[id] = v; },
    get innerHTML() { return capturado[id] || ''; },
    textContent: '', value: '',
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
fs.writeFileSync(FILE, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
const nFichas = (capturado.grid.match(/class="abrir"/g) || []).length;
const nFuera  = (capturado.outlist.match(/class="fila"/g) || []).length;
console.log(`Pre-renderizado: ${nFichas} fichas y ${nFuera} descartadas escritas en el HTML (${kb} kB).`);

/* ---- 5 · publicar ---- */
if (process.argv.includes('--local')) {
  console.log('Modo local: no se publica.');
  process.exit(0);
}
console.log('Publicando…');

/* Netlify rechaza a veces la publicación directa a producción con un
   "Forbidden" mientras sigue aceptando borradores. En ese caso se sube
   como borrador y se promueve después, que da exactamente el mismo
   resultado. Así una limitación temporal de la plataforma no deja el
   sitio sin actualizar. */
try {
  execFileSync('netlify', ['deploy', '--prod', '--dir', DIR, '--site', SITE,
    '--message', 'Actualizacion con pre-renderizado'],
    { stdio: 'inherit', shell: true });
} catch (e) {
  console.log('\nLa publicacion directa fue rechazada. Voy por borrador y lo promuevo…\n');
  const salida = execFileSync('netlify',
    ['deploy', '--dir', DIR, '--site', SITE, '--message', 'Actualizacion', '--json'],
    { shell: true, encoding: 'utf8', maxBuffer: 1 << 24 });
  const id = JSON.parse(salida).deploy_id;
  if (!id) throw new Error('no se pudo obtener el identificador del borrador');
  /* La consola de Windows se come las comillas interiores del JSON, así que
     hay que escaparlas a mano o la llamada llega vacía. */
  const datos = JSON.stringify({ site_id: SITE, deploy_id: id }).replace(/"/g, '\\"');
  require('child_process').execSync(
    `netlify api restoreSiteDeploy --data "${datos}"`, { stdio: 'ignore' });
  console.log('Promovido a produccion: ' + id);
} finally {
  /* El CLI deja aquí un .netlify con `publish = C:\Users\vcicr\Downloads`,
     es decir, apuntando a la carpeta padre entera. Si alguien ejecutara
     luego `netlify deploy` a secas desde aquí, subiría a internet todo lo
     que haya en Downloads. Nada nuestro lo necesita —siempre pasamos --dir
     y --site explícitos— así que se borra en cuanto termina el despliegue
     y la trampa no llega a existir. */
  fs.rmSync(path.join(__dirname, '.netlify'), { recursive: true, force: true });
}
