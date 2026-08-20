import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const sitio = path.join(raiz, 'rwadar-site');
const publicado = path.join(raiz, 'rwadar-publicado');
const lee = nombre => fs.readFileSync(path.join(sitio, nombre), 'utf8');
const require = createRequire(import.meta.url);
const { adelgazarJS, sinComentariosJS } = require('./rwadar-adelgazar.js');
const {
  comprobarConfiguracionAuth,
  huellaContenido,
  listarArchivosRegulares,
  nombreAssetVersionado,
  versionCacheDesdeEntradas,
} = require('./rwadar-publicacion-segura.js');
const { celdaCSV } = require('./rwadar-app/sincronizar.js');
const html = lee('index.html');
const privacidad = lee('privacidad.html');
const error404 = lee('404.html');
const headers = lee('_headers');
const redirecciones = lee('_redirects');
const sw = lee('sw.js');
const publicador = fs.readFileSync(path.join(raiz, 'rwadar-publicar.js'), 'utf8');
const sincronizador = fs.readFileSync(path.join(raiz, 'rwadar-app', 'sincronizar.js'), 'utf8');
const servidor = fs.readFileSync(path.join(raiz, 'rwadar-servir.js'), 'utf8');
const arrancador = fs.readFileSync(path.join(raiz, 'rwadar-arrancar.js'), 'utf8');
const documentos = ['CLAUDE.md','RWADAR-MAPA.md','RWADAR-TRASPASO.md','RWADAR-ESTADO.md','RWADAR-MANANA.md']
  .map(n=>fs.readFileSync(path.join(raiz,n),'utf8')).join('\n');
let correctas = 0;

function prueba(nombre, condicion) {
  if (!condicion) throw new Error(`FALLA: ${nombre}`);
  console.log(`  OK    ${nombre}`);
  correctas++;
}

async function capturaError(promesa) {
  try { await promesa; return null; }
  catch (e) { return e; }
}

function pruebaInstalacionAtomica(codigo) {
  const escuchas = {};
  let saltos = 0;
  const contexto = {
    self: {
      location: { origin:'https://rwadar.example' },
      clients: { claim:async()=>{} },
      addEventListener(tipo, fn){ escuchas[tipo] = fn; },
      async skipWaiting(){ saltos++; },
    },
    caches: {
      async open(){ return { async addAll(){ throw new Error('recurso ausente'); } }; },
      async keys(){ return []; }, async delete(){ return true; },
    },
    URL, Response, fetch,
  };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  let instalacion;
  escuchas.install({ waitUntil(promesa){ instalacion = promesa; } });
  return capturaError(instalacion).then(error => Boolean(error) && saltos === 0);
}

function marcadoEstricto(nombre, contenido) {
  prueba(`${nombre} no contiene bloques style`, !/<style\b/i.test(contenido));
  prueba(`${nombre} no contiene atributos style`, !/\sstyle\s*=/i.test(contenido));
  prueba(`${nombre} no contiene manejadores on*`, !/\son[a-z]+\s*=/i.test(contenido));
  const inline = [...contenido.matchAll(/<script\b([^>]*)>/gi)].filter(m =>
    !/\bsrc\s*=/i.test(m[1]) &&
    !/\btype\s*=\s*["']application\/ld\+json["']/i.test(m[1]));
  prueba(`${nombre} no contiene JavaScript ejecutable inline`, inline.length === 0);
}

function arrayDe(codigo, nombre) {
  const marca = `const ${nombre}=`;
  const inicio = codigo.indexOf(marca);
  const fin = codigo.indexOf('\n];', inicio);
  if (inicio < 0 || fin < 0) throw new Error(`no se encuentra ${nombre}`);
  return new Function(`return ${codigo.slice(inicio + marca.length, fin + 2)}`)();
}

function renderEmisionHostil(codigo) {
  const dato = [{
    s:'prueba', t:'<img src=x onerror=alert(1)>', res:'</script><script>alert(2)</script>',
    pl:'Midas', cat:'Tesoro y fondos', mon:'EUR', min:100, obj:1000, cap:500,
    pct:50, rent:3.2, plazo:12, tipo:'estimada', est:'abierta', cont:false,
    url:'https://example.com/emision', ver:'2026-08-20', pat:false,
  }];
  const preparado = codigo.replace(/const EMI=\[\s*\];/, `const EMI=${JSON.stringify(dato)};`);
  const capturado = {};
  const lista = [];
  lista.forEach = Array.prototype.forEach.bind(lista);
  const nodos = new Map();
  const nodo = id => {
    if (nodos.has(id)) return nodos.get(id);
    const n = { id, textContent:'', value:'', hidden:false, style:{},
      set innerHTML(v){ capturado[id]=v; }, get innerHTML(){ return capturado[id]||''; },
      classList:{add(){},remove(){},toggle(){},contains(){return false}},
      add(){},focus(){},setAttribute(){},removeAttribute(){},hasAttribute(){return false},
      querySelector(){return null},querySelectorAll(){return lista},addEventListener(){},
      getBoundingClientRect(){return {left:0,top:0,width:0,height:0}},getContext(){return null},
    };
    nodos.set(id,n); return n;
  };
  const document = {
    getElementById(id){ return id==='gl'?null:nodo(id); },
    querySelector(){return null},querySelectorAll(){return lista},addEventListener(){},
    createElement(){return nodo('tmp')},body:nodo('body'),contains(){return false},activeElement:null,
  };
  const contexto = {
    document, console, Option:function(){},
    window:{matchMedia:()=>({matches:true}),addEventListener(){},document},
    matchMedia:()=>({matches:true}),requestAnimationFrame(){},setInterval(){},clearInterval(){},
    setTimeout(){},clearTimeout(){},addEventListener(){},removeEventListener(){},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},performance:{now:()=>0},
    IntersectionObserver:function(){this.observe=()=>{};this.unobserve=()=>{};this.disconnect=()=>{}},
    URL, Blob, Math, JSON, Date, Set, Array, Object, String, Number, Float32Array, Uint16Array,
  };
  contexto.globalThis = contexto;
  vm.createContext(contexto);
  vm.runInContext(preparado, contexto, { timeout:15000 });
  return capturado.emiLista || '';
}

console.log('=== PRUEBAS ESTÁTICAS DE LA WEB ===');
marcadoEstricto('index.html', html);
marcadoEstricto('privacidad.html', privacidad);
marcadoEstricto('404.html', error404);

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(m => m[1]);
const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
prueba('index.html no tiene ID duplicados', repetidos.length === 0);

const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const estilos = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)];
prueba('la aplicación carga un único JavaScript propio versionado',
  scripts.length === 1 && scripts[0][1] === '/assets/rwadar-20260820.js');
prueba('la aplicación carga una hoja propia versionada',
  estilos.length === 1 && estilos[0][1] === '/assets/rwadar-20260820.css');
for (const recurso of [scripts[0][1], estilos[0][1], '/assets/privacidad-20260820.css', '/assets/error-20260820.css'])
  prueba(`existe ${recurso}`, fs.existsSync(path.join(sitio, '.' + recurso)));

const js = lee('.' + scripts[0][1]);
new Function(js);
prueba('el JavaScript externo compila', true);
prueba('el pre-render contiene las 26 fichas', (html.match(/class="abrir"/g) || []).length === 26);
prueba('el pre-render contiene los 4 descartes', (html.match(/class="fila"/g) || []).length === 4);
prueba('todos los formularios fallan cerrados bajo form-action none',
  [...html.matchAll(/<form\b([^>]*)>/gi)].every(m => !/\baction\s*=/i.test(m[1])));

const jsonLd = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
prueba('hay exactamente un JSON-LD', jsonLd.length === 1);
const datosLd = JSON.parse(jsonLd[0][1]);
prueba('el JSON-LD es JSON válido', true);
prueba('la página y el conjunto de datos comparten la revisión actual',
  datosLd['@graph'].filter(x=>x.dateModified).every(x=>x.dateModified==='2026-08-20'));
const descripcion = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || '';
prueba('la meta description es precisa y tiene longitud útil para buscadores',
  descripcion.length >= 150 && descripcion.length <= 160 && /26 plataformas/.test(descripcion) && /4 descartes/.test(descripcion));
const ultimaVerificacion = arrayDe(lee('.' + scripts[0][1]), 'P').map(p=>p.ver).filter(Boolean).sort().at(-1);
const fechaPie = ultimaVerificacion.split('-').reverse().join('.');
prueba('el HTML sin JavaScript contiene la revisión real derivada de los datos',
  html.includes(`<p id="pieRevision">Última revisión del registro: ${fechaPie}</p>`) && !html.includes('26.07.2026'));

console.log('\n=== CSP, SESIÓN Y CONTRATOS ===');
prueba('la CSP no permite unsafe-inline ni eval', !/unsafe-inline|unsafe-eval/i.test(headers));
prueba('la CSP limita script, estilo, worker y manifest a recursos propios',
  /script-src\s+'self'/i.test(headers) && /style-src\s+'self'/i.test(headers) &&
  /worker-src\s+'self'/i.test(headers) && /manifest-src\s+'self'/i.test(headers));
prueba('la CSP impide formularios, marcos y objetos',
  /form-action\s+'none'/i.test(headers) && /frame-ancestors\s+'none'/i.test(headers) && /object-src\s+'none'/i.test(headers));
prueba('los assets versionados tienen caché immutable', /\/assets\/\*[\s\S]*max-age=31536000, immutable/i.test(headers));
prueba('el service worker se entrega siempre revalidado', /\/sw\.js[\s\S]*no-cache, no-store/i.test(headers));

prueba('la contraseña mínima es de 12 caracteres en HTML y JS',
  (html.match(/minlength="12"/g) || []).length === 2 && /clave\.length<12/.test(js));
prueba('los testigos de sesión solo se guardan en memoria',
  /const guarda=s=>\{ses=normalizaSesion\(s\)/.test(js) &&
  !/localStorage\.(?:setItem|getItem)\([^)]*(?:access_token|refresh_token)/.test(js));
prueba('la identidad se revalida contra Auth antes de usar la sesión', /auth\('\/user',null,\{metodo:'GET',token:tk\}\)/.test(js));
prueba('la recuperación limpia el fragmento y abre cambio de contraseña',
  /history\.replaceState\(null,'',location\.pathname\+location\.search\)/.test(js) &&
  /tipo==='recovery'\)abrir\('nueva_clave'\)/.test(js));
prueba('la recuperación cambia la contraseña autenticada con PUT /user',
  /auth\('\/user',\{password:clave\},\{metodo:'PUT',token:tk\}\)/.test(js));

for (const firma of ['/rpc/guardar_opinion','/rpc/borrar_mi_opinion','/rpc/denunciar_opinion',
  'p_opinion_id','/mis_opiniones?select=opinion_id'])
  prueba(`el frontend incluye el contrato ${firma}`, js.includes(firma));
prueba('las opiniones públicas no solicitan usuario_id', !/opiniones_publicas\?select=[^'\n]*usuario_id/.test(js));
prueba('no hay escrituras directas a opiniones o denuncias',
  !/pide\('\/(?:opiniones|denuncias)'\s*,\s*\{\s*method\s*:/.test(js));

console.log('\n=== EMISIONES, PWA Y ADELGAZADO ===');
for (const id of ['emisiones','emiFiltros','emiLista','emiOrden']) prueba(`existe el control ${id}`, ids.includes(id));
prueba('las emisiones viven en el JavaScript externo, no en un script inline', /const EMI=\[/.test(js));
prueba('el estado de emisiones también queda pre-renderizado para buscadores',
  /id="emiLista"><!--pre:ini-->[\s\S]+<!--pre:fin-->/.test(html));
prueba('las tarjetas usan progress y clases, no estilos inline',
  /<progress class="emi-barra"/.test(js) && !/<(?:article|span|i)[^>]*style=/.test(js));
prueba('el estado vacío no promete una alerta de emisiones inexistente',
  !/Crea una cuenta y te avisamos en cuanto se abra la primera/.test(js));
const hostil = renderEmisionHostil(js);
prueba('texto hostil de una emisión se escapa como texto', hostil.includes('&lt;img src=x onerror=alert(1)&gt;') && !hostil.includes('<img'));
prueba('un cierre script hostil no crea otro script', hostil.includes('&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;'));
prueba('la emisión renderizada no genera style ni manejadores inline',
  !/<[^>]*\s(?:style|on[a-z]+)\s*=/i.test(hostil));

const manifest = JSON.parse(lee('manifest.webmanifest'));
prueba('la portada declara el manifest y el icono Apple',
  /rel="manifest" href="\/manifest\.webmanifest"/.test(html) && /rel="apple-touch-icon"/.test(html));
prueba('el manifest es instalable y tiene iconos 192, 512 y maskable',
  manifest.start_url==='/' && manifest.display==='standalone' &&
  manifest.icons.some(i=>i.sizes==='192x192') && manifest.icons.some(i=>i.sizes==='512x512') &&
  manifest.icons.some(i=>i.purpose==='maskable'));
prueba('el service worker se registra solo bajo HTTP(S)',
  /navigator\.serviceWorker\.register\('\/sw\.js'\)/.test(js) && /\^https\?:\$/.test(js));
prueba('el service worker usa una versión de esta entrega', /rwadar-v20260820/.test(sw));
prueba('el precache crítico se instala de forma atómica',
  /await c\.addAll\(ARMAZON\)/.test(sw) && !/\.add\(u\)\.catch/.test(sw) && await pruebaInstalacionAtomica(sw));
prueba('cada navegación se guarda bajo su propia ruta',
  /const clave = url\.pathname/.test(sw) && /cache\.put\(clave, res\.clone\(\)\)/.test(sw) &&
  !/cache\.put\('\/', res\.clone\(\)\)/.test(sw));
prueba('solo se cachean recursos estáticos públicos del mismo origen',
  /url\.origin !== self\.location\.origin/.test(sw) && /esEstaticoPublico/.test(sw));
prueba('las emisiones se revalidan desde Supabase sin vaciar la copia ante un fallo',
  /emisiones_publicas\?select=\*&estado=in\.\(abierta,programada,en_estudio\)/.test(js) &&
  /const nE=e\.map\(emisionRemota\)/.test(js) && /EMI\.length=0;\s+EMI\.push/.test(js) &&
  /try\{ if\(await alDia\(\)\)/.test(js));

const casoRegex = 'function f(c){return /[/*]/.test(c)}';
const casoReducido = sinComentariosJS(casoRegex);
new Function(casoReducido);
prueba('el adelgazador conserva regex con marcas de comentario', casoReducido === casoRegex);
const jsReducido = adelgazarJS(js);
new Function(jsReducido);
prueba('el JavaScript adelgazado compila y pesa menos', jsReducido.length < js.length);
for (const nombre of ['P','FUERA','EMI'])
  prueba(`el adelgazado conserva exactamente ${nombre}`, JSON.stringify(arrayDe(js,nombre)) === JSON.stringify(arrayDe(jsReducido,nombre)));
const htmlPublicado = fs.readFileSync(path.join(publicado, 'index.html'), 'utf8');
const swPublicado = fs.readFileSync(path.join(publicado, 'sw.js'), 'utf8');
const scriptsPublicados = [...htmlPublicado.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)];
const recursoJSPublicado = scriptsPublicados.at(-1)?.[1] || '';
const rutaJSPublicado = path.join(publicado, '.' + recursoJSPublicado);
const jsPublicado = fs.readFileSync(rutaJSPublicado, 'utf8');
const huellaJSIndependiente = crypto.createHash('sha256').update(jsPublicado).digest('hex').slice(0, 12);
prueba('el árbol generado existe y usa el JavaScript adelgazado con huella real',
  fs.existsSync(path.join(publicado,'.well-known','security.txt')) &&
  fs.readFileSync(path.join(publicado,'.well-known','security.txt'),'utf8') === lee('.well-known/security.txt') &&
  jsPublicado === jsReducido &&
  new RegExp(`/assets/rwadar-20260820\\.${huellaJSIndependiente}\\.js$`).test(recursoJSPublicado));
const archivosPublicados = listarArchivosRegulares(publicado);
const assetsPublicados = archivosPublicados.filter(x=>x.startsWith('assets/'));
prueba('todo asset desplegable lleva su huella de contenido y no queda el nombre estable',
  assetsPublicados.length === 4 && assetsPublicados.every(x=>/\.[a-f0-9]{12}\.(?:css|js)$/.test(x)) &&
  !archivosPublicados.some(x=>/^assets\/(?:error|privacidad|rwadar)-20260820\.(?:css|js)$/.test(x)));
prueba('HTML y service worker apuntan al mismo JavaScript versionado',
  htmlPublicado.includes(recursoJSPublicado) && swPublicado.includes(recursoJSPublicado));

const artefactosVersion = [...archivosPublicados].sort();
const hashVersionIndependiente = crypto.createHash('sha256');
const entradasVersion = {};
for (const nombre of artefactosVersion) {
  const originales = fs.readFileSync(path.join(publicado, ...nombre.split('/')));
  const bytes = nombre === 'sw.js'
    ? Buffer.from(originales.toString('utf8').replace(
      /const VERSION = 'rwadar-v[^']+';/, "const VERSION = '__RWADAR_VERSION__';"), 'utf8')
    : originales;
  entradasVersion[nombre] = bytes;
  hashVersionIndependiente.update(nombre).update('\0').update(bytes).update('\0');
}
const versionEsperada = `rwadar-v-${hashVersionIndependiente.digest('hex').slice(0,16)}`;
prueba('VERSION se deriva de todo el artefacto desplegable',
  swPublicado.includes(`const VERSION = '${versionEsperada}';`) &&
  versionCacheDesdeEntradas(entradasVersion) === versionEsperada);
prueba('un cambio de código o datos invalida nombre de asset y VERSION',
  nombreAssetVersionado('assets/prueba.js', 'const dato=1') !== nombreAssetVersionado('assets/prueba.js', 'const dato=2') &&
  versionCacheDesdeEntradas({a:'uno'}) !== versionCacheDesdeEntradas({a:'dos'}) &&
  huellaContenido('const dato=1') !== huellaContenido('const dato=2'));

console.log('\n=== PUBLICADOR, SINCRONIZADOR Y SERVIDOR ===');
prueba('el publicador exige exactamente un modo explícito',
  /modos\.length !== 1/.test(publicador) && /--local \| --preview \| --produccion/.test(publicador));
prueba('Netlify CLI está fijado a una versión', /NETLIFY_VERSION = '\d+\.\d+\.\d+'/.test(publicador));
prueba('solo se despliega rwadar-publicado', /'--dir', SALIDA/.test(publicador));
prueba('la salida se construye desde lista cerrada y nunca por copia recursiva',
  /ARCHIVOS_PUBLICABLES/.test(publicador) && /fs\.copyFileSync/.test(publicador) && !/fs\.cpSync/.test(publicador));
prueba('el publicador genera y valida JS/CSS adelgazados',
  /adelgazarJS/.test(publicador) && /adelgazarCSS/.test(publicador) && /new Function\(reducido\)/.test(publicador));
prueba('no existe promoción ni despliegue alternativo tras un fallo',
  !/restoreSiteDeploy|api\/v1\/deploys|deployId|--prod-if-unlocked/.test(publicador));
prueba('el bloqueo de datos cubre preview y producción antes de sincronizar',
  /const remoto = preview \|\| produccion/.test(publicador) &&
  publicador.includes("if (remoto && /\\bdata-deploy-blocker\\b/i.test(privacidad))") &&
  publicador.indexOf('data-deploy-blocker') < publicador.indexOf("execFileSync('node'"));
prueba('todo remoto hace preflight Auth de solo lectura y falla cerrado',
  /if \(remoto\)[\s\S]*await comprobarConfiguracionAuth\(\)/.test(publicador) &&
  /mailer_autoconfirm !== false/.test(fs.readFileSync(path.join(raiz,'rwadar-publicacion-segura.js'),'utf8')));

prueba('el sincronizador escribe los datos en el JS externo',
  /const JS = path\.join\(SITIO, 'assets', 'rwadar-20260820\.js'\)/.test(sincronizador));
prueba('radar, descartes y emisiones se consultan juntos y fallan cerrados',
  /Promise\.all\(\[/.test(sincronizador) && !/let emisiones\s*=\s*\[\]/.test(sincronizador));
prueba('el sincronizador neutraliza <, > y separadores Unicode',
  /replace\(\/<\/g, '\\\\u003c'\)/.test(sincronizador) &&
  /replace\(\/>\/g, '\\\\u003e'\)/.test(sincronizador) && /\\u2028/.test(sincronizador));
prueba('las emisiones exigen URL HTTPS y fecha verificable', /esHttps\(e\.url\)/.test(sincronizador) && /verificada_el/.test(sincronizador));
prueba('el sincronizador valida que el JS generado compile', /new Function\(script\)/.test(sincronizador));
prueba('el CSV estable neutraliza fórmulas incluso tras espacios o tabuladores',
  celdaCSV('=HYPERLINK("https://evil.example")') === '"\'=HYPERLINK(""https://evil.example"")"' &&
  celdaCSV(' \t@SUM(1,1)').startsWith('"\' \t@') && celdaCSV('texto "normal"') === '"texto ""normal"""');
prueba('el publicador pre-renderiza también el escaparate de emisiones',
  /inyectar\(html, 'emiLista', capturado\.emiLista\)/.test(publicador));
prueba('el publicador captura y escribe la revisión derivada en el HTML',
  /capturadoTexto\.pieRevision/.test(publicador) && /marcaPie/.test(publicador));

prueba('el servidor escucha solo en loopback', /\.listen\(PUERTO, '127\.0\.0\.1'/.test(servidor));
prueba('guardar capturas requiere flag, origen local, PNG y límite',
  /const CAPTURAS = process\.argv\.includes\('--capturas'\)/.test(servidor) &&
  /ORIGENES_LOCALES\.includes\(origen\)/.test(servidor) && /firmaPng/.test(servidor) && /LIMITE_CAPTURA/.test(servidor));
prueba('el servidor local replica la CSP de worker/manifest',
  /worker-src 'self'/.test(servidor) && /manifest-src 'self'/.test(servidor));

console.log('\n=== PRIVACIDAD, ÍNDICE Y BLOQUEOS ===');
prueba('la privacidad mantiene el bloqueo jurídico de todo destino remoto', /data-deploy-blocker=["']legal["']/.test(privacidad));
const privacidadLineal = privacidad.replace(/\s+/g, ' ');
for (const texto of ['Eric Almiñana','Samuel Rodriguez','Victor Jorques','RWAdar@protonmail.com'])
  prueba(`la privacidad identifica ${texto}`, privacidadLineal.includes(texto));
prueba('el bloqueo pendiente es por acuerdo y plazos, no por los nombres ya facilitados',
  /documentar el acuerdo interno/.test(privacidadLineal) && /aprobar y automatizar los plazos/.test(privacidadLineal) &&
  !/grafía[\s\S]{0,100}pendiente de confirmación/.test(privacidad));
prueba('la privacidad declara RUM desactivado', /Real User Monitoring \(RUM\) está desactivado/.test(privacidad));
prueba('la privacidad explica memoria de sesión y caché PWA sin tokens',
  /Memoria de la pestaña/.test(privacidad) && /No se guardan respuestas de Supabase,[\s\S]*tokens de sesión/.test(privacidad));
prueba('la privacidad distingue dispositivo preparado de entrega push no operativa',
  /permiso y token[\s\S]*no significa que vayas a recibir[\s\S]*avisos/.test(privacidadLineal) &&
  /entrega automática está desactivada/.test(privacidadLineal) &&
  /no se ha verificado de extremo a extremo/.test(privacidadLineal) &&
  /Tampoco están conectados los avisos de nuevas emisiones/.test(privacidadLineal));
prueba('la privacidad tampoco promete correos de cambio del radar',
  /entrega de correos por cambios del radar[\s\S]*todavía no está activa/.test(privacidadLineal));
prueba('privacidad y UI declaran el autoconfirmado real sin prometer correos',
  /mailer_autoconfirm=true/.test(privacidadLineal) && /no se exige ni se ha verificado/.test(privacidadLineal) &&
  /mailer_autoconfirm=false/.test(privacidadLineal) && /no promete[\s\S]*entrega de esos correos/.test(privacidadLineal) &&
  !/La confirmación del correo está activada/.test(privacidad) &&
  /entrega del correo todavía no está verificada/.test(js) &&
  /entrega del correo de confirmación todavía no está verificada/.test(js) &&
  !/Te hemos enviado un correo|ya va en camino un enlace/.test(js));
prueba('la privacidad conserva pendientes los plazos de 12 meses y 3 años',
  /máximo de 12 meses[\s\S]*PENDIENTE/.test(privacidad) && /durante 3 años[\s\S]*PENDIENTE/.test(privacidad));

prueba('/index.html redirige permanentemente a /', /^\/index\.html\s+\/\s+301!/m.test(redirecciones));
prueba('security.txt tiene contacto, canonical, política de reporte y caducidad futura',
  /Contact: mailto:RWAdar@protonmail\.com/.test(lee('.well-known/security.txt')) &&
  /Canonical: https:\/\/rwadar\.netlify\.app\/\.well-known\/security\.txt/.test(lee('.well-known/security.txt')) &&
  /Policy: https:\/\/github\.com\/victorJorques\/RWADAR\/security\/policy/.test(lee('.well-known/security.txt')) &&
  !/Policy: https:\/\/rwadar\.netlify\.app\/privacidad/.test(lee('.well-known/security.txt')) &&
  /Expires: 2027-08-20T00:00:00\.000Z/.test(lee('.well-known/security.txt')));
prueba('sitemap y metadatos usan la revisión 2026-08-20',
  (lee('sitemap.xml').match(/<lastmod>2026-08-20<\/lastmod>/g)||[]).length===2 &&
  /"dateModified":"2026-08-20"/.test(html));
prueba('el auditor compara lo publicado con el árbol adelgazado y rechaza RUM',
  /path\.join\(PUBLICADO, 'index\.html'\)/.test(arrancador) && /netlify-rum-container/.test(arrancador));
prueba('el auditor extrae el asset con huella desde el index generado',
  /scriptsPublicados = \[\.\.\.htmlPublicable\.matchAll/.test(arrancador) &&
  /recursoJSPublicado/.test(arrancador) && /\{12\}\\\.js/.test(arrancador));
prueba('la documentación exige modo explícito y no recomienda promoción automática',
  /--local[\s\S]*--preview[\s\S]*--produccion/.test(documentos) &&
  !/sube como borrador y lo promueve|Promovido a produccion|Forbidden[^\n]*es normal/.test(documentos));

const sinModo = spawnSync(process.execPath, ['rwadar-publicar.js'], { cwd:raiz, encoding:'utf8' });
prueba('invocar el publicador sin modo falla sin desplegar', sinModo.status===2 && /modo es obligatorio/.test(sinModo.stderr));
for (const modo of ['--preview','--produccion']) {
  const bloqueado = spawnSync(process.execPath, ['rwadar-publicar.js',modo,'--sin-sincronizar'], { cwd:raiz, encoding:'utf8' });
  prueba(`${modo} permanece bloqueado antes de Auth, sincronización o Netlify`,
    bloqueado.status===2 && /PUBLICACION REMOTA BLOQUEADA/.test(bloqueado.stderr) && !/Publicando en/.test(bloqueado.stdout));
}

let llamadaAuth;
const authSeguro = await comprobarConfiguracionAuth({ fetchFn:async (url, opciones) => {
  llamadaAuth = { url, opciones };
  return { ok:true, status:200, async json(){ return { mailer_autoconfirm:false }; } };
} });
prueba('el preflight acepta únicamente autoconfirmación desactivada y petición sin caché',
  authSeguro.mailer_autoconfirm === false && /\/auth\/v1\/settings$/.test(llamadaAuth.url) &&
  llamadaAuth.opciones.method === 'GET' && llamadaAuth.opciones.cache === 'no-store' &&
  llamadaAuth.opciones.credentials === 'omit' && /^sb_publishable_/.test(llamadaAuth.opciones.headers.apikey));
const authActivo = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:true, status:200, async json(){ return { mailer_autoconfirm:true }; },
}) }));
const authAusente = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:true, status:200, async json(){ return {}; },
}) }));
const authHttp = await capturaError(comprobarConfiguracionAuth({ fetchFn:async()=>({
  ok:false, status:503, async json(){ return {}; },
}) }));
prueba('el preflight Auth falla cerrado ante true, campo ausente o error HTTP',
  /exactamente false/.test(authActivo?.message || '') && /exactamente false/.test(authAusente?.message || '') &&
  /HTTP 503/.test(authHttp?.message || ''));

const intruso = path.join(sitio, `.env.auditoria-${process.pid}`);
try {
  fs.writeFileSync(intruso, 'SECRETO_SIMULADO=no-publicar\n', 'utf8');
  const rechazado = spawnSync(process.execPath, ['rwadar-publicar.js','--local','--sin-sincronizar'], { cwd:raiz, encoding:'utf8' });
  prueba('un archivo accidental hace fallar cerrado el paquete antes de copiarse',
    rechazado.status===2 && /archivo no permitido/.test(rechazado.stderr) &&
    !fs.existsSync(path.join(publicado, path.basename(intruso))));
} finally {
  fs.rmSync(intruso, { force:true });
}

console.log('\n=== PRUEBA HTTP LOCAL ===');
const puerto = 43173;
const proceso = spawn(process.execPath, ['rwadar-servir.js',`--puerto=${puerto}`], { cwd:raiz, stdio:['ignore','pipe','pipe'] });
try {
  const limite = Date.now()+5000;
  let inicio;
  while (Date.now()<limite) {
    try { inicio = await fetch(`http://127.0.0.1:${puerto}/`); break; }
    catch { await new Promise(r=>setTimeout(r,50)); }
  }
  prueba('el servidor local responde por loopback', inicio && inicio.status===200);
  const cspLocal = inicio.headers.get('content-security-policy') || '';
  prueba('la respuesta local aplica CSP estricta y permite el worker propio',
    !/unsafe-inline|unsafe-eval/.test(cspLocal) && /worker-src 'self'/.test(cspLocal));
  const politica = await fetch(`http://127.0.0.1:${puerto}/privacidad`);
  prueba('la URL limpia de privacidad funciona localmente', politica.status===200);
  const post = await fetch(`http://127.0.0.1:${puerto}/guardar?n=prueba.png`, {
    method:'POST',headers:{Origin:`http://127.0.0.1:${puerto}`,'Content-Type':'image/png'},body:new Uint8Array([1,2,3]),
  });
  prueba('POST /guardar está desactivado por defecto', post.status===403);
} finally {
  proceso.kill();
}

console.log(`\n${correctas} correctas, 0 fallidas`);
