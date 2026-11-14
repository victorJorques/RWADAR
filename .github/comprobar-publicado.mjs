/* =====================================================================
   RWAdar · comprueba la web YA publicada, página a página
   ---------------------------------------------------------------------
   Uso:  node .github/comprobar-publicado.mjs https://rwadar.pages.dev

   Lo lanza el flujo «Publicar web» después de subir. Compara lo que sirve
   Cloudflare con lo que hay en el repositorio: portada, privacidad, mapa
   del sitio, índice de la Academy, cada lección publicada (con su fecha de
   revisión legal), sus assets con huella, la CSP y que las lecciones no
   publicadas y las fichas retiradas den 404 (o 301 si la plataforma solo
   cambió de carpeta). Sale con código 1 si algo no cuadra.

   Academy con cuenta ("acceso": "cuenta" en rwadar-academy/academy.json,
   05/11/2026): sin sesión, cada lección da 303 a /acceso?volver=/academy/<slug>
   con no-store, así que su contenido no se compara con lo publicado: se
   comprueba en rwadar-publicado/ (lo que el flujo acaba de subir), y se exige
   que su índice coincida byte a byte con el publicado. Nunca entra con una
   cuenta ni envía nada que cambie datos.

   Vista previa (revision.rwadar.pages.dev o <hash>.rwadar.pages.dev): Cloudflare
   Pages añade «x-robots-tag: noindex» a todo archivo que sirve allí
   (docs/VERIFICACION-ACCESO-PUBLICO-2026-10-26.md, «Preview observada»). Por eso
   solo con https://rwadar.pages.dev se exige que el índice de la Academy no
   lleve noindex en la cabecera; en una vista previa basta la etiqueta robots
   «index,follow» de su HTML. Las demás valen igual en las dos: o no miran esa
   cabecera, o piden que lleve noindex (/baja), o miran la marca «noindex,
   nofollow» que pone el propio worker en su 404 y que Pages no toca (pasó en la
   vista previa del 03/11/2026, 219/219; ver docs/tareas/PARA-CODEX.md).

   Prueba local, sin red: RWADAR_COMPROBAR_LOCAL=1 y un http://127.0.0.1:<puerto>
   servido por rwadar-acceso/probar-worker-local.mjs (lo hace
   rwadar-acceso/comprobar-publicado.test.mjs). En local se comprueba como en
   producción, salvo con RWADAR_COMPROBAR_VISTA_PREVIA=1 (junto con
   probar-worker-local.mjs --vista-previa), que lo hace como en una vista previa.
   ===================================================================== */
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';

const require = createRequire(import.meta.url);
const academyMod = require('../rwadar-academy.js');
const paginasFichas = require('../rwadar-fichas-manifiesto.js');
const {ARCHIVOS_PUBLICABLES, PAGINAS_SECCIONES} = require('../rwadar-publicacion-segura.js');
const tokenizacionModelo = require('../rwadar-movil/lib/tokenizacion.js');
const { juzgarDirecto } = await import('./juzgar-directo.mjs');

const base = String(process.argv[2] || '').replace(/\/$/, '');
const prueba = process.env.RWADAR_COMPROBAR_LOCAL === '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test(base);
if (!prueba && !/^https:\/\/[a-z0-9.-]+\.pages\.dev$/.test(base)) {
  console.error('Uso: node .github/comprobar-publicado.mjs https://rwadar.pages.dev');
  process.exit(2);
}

// Producción: la única base que se indexa. Cualquier otra *.pages.dev es una vista previa.
const produccion = prueba ? process.env.RWADAR_COMPROBAR_VISTA_PREVIA !== '1' : base === 'https://rwadar.pages.dev';

const academy = academyMod.cargarAcademy();
const publicadas = academy.lecciones.filter(l => l.estado === 'publicado');
const pendientes = academy.lecciones.filter(l => l.estado !== 'publicado');
const conCuenta = academy.acceso === 'cuenta';
const publicado = fileURLToPath(new URL('../rwadar-publicado/', import.meta.url));
const leerPublicado = relativa => {
  try { return fs.readFileSync(path.join(publicado, ...relativa.split('/')), 'utf8'); } catch { return null; }
};
const fallos = [];
let correctas = 0;
const ok = (nombre, condicion) => {
  if (condicion) { correctas++; console.log(`  OK    ${nombre}`); }
  else { fallos.push(nombre); console.log(`  FALLA ${nombre}`); }
};
const pedir = async (ruta, opciones = {}) => {
  const respuesta = await fetch(base + ruta, { redirect: 'manual', cache: 'no-store', ...opciones });
  const texto = opciones.method === 'HEAD' ? '' : await respuesta.text();
  return { estado: respuesta.status, cabeceras: respuesta.headers, texto };
};
/* Como `curl --path-as-is`: manda la ruta tal cual, sin resolver «..» ni
   «%2e%2e» (fetch y new URL los resuelven antes de enviar). Sirve para ver qué
   hace Cloudflare con ellas antes de decidir si pasan por el worker. */
const pedirCruda = (ruta, cabeceras = {}) => new Promise((resolver, rechazar) => {
  const destino = new URL(base);
  const peticion = (destino.protocol === 'https:' ? https : http).request({ host: destino.hostname, port: destino.port || undefined,
    method: 'GET', path: ruta, headers: { Host: destino.host, ...cabeceras } }, respuesta => {
    const trozos = [];
    respuesta.on('data', trozo => trozos.push(trozo));
    respuesta.on('end', () => resolver({ estado: respuesta.statusCode, texto: Buffer.concat(trozos).toString('utf8') }));
  });
  peticion.setTimeout(30000, () => peticion.destroy(new Error('sin respuesta en 30 s')));
  peticion.on('error', rechazar);
  peticion.end();
});
/* La marca «noindex, nofollow» + no-store solo la pone el 404 del worker (el
   404 propio de Pages no lleva x-robots-tag): así la comprobación demuestra que
   la lista cerrada está activa, y no depende de si el centro de datos que
   responde guarda o no una copia. */
const noEncontradaDelWorker = p => p.estado === 404 && p.cabeceras.get('x-robots-tag') === 'noindex, nofollow' &&
  p.cabeceras.get('cache-control') === 'no-store';
// Lección con cuenta pedida sin sesión: a /acceso con su vuelta, sin guardarse ni tocar cookies.
const mandaAEntrar = (p, slug) => p.estado === 303 && p.cabeceras.get('location') === `/acceso?volver=/academy/${slug}` &&
  /(?:^|,)\s*no-store\s*(?:,|$)/.test(p.cabeceras.get('cache-control') || '') && !p.cabeceras.has('set-cookie');
const fechaLarga = iso => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${meses[m - 1]} de ${a}`;
};

console.log(`Comprobando ${base} (${produccion ? 'producción' : 'vista previa: Pages añade noindex en la cabecera'}) …`);

const portada = await pedir('/');
ok('portada responde 200', portada.estado === 200);
ok('portada enlaza la Academy y sus lecciones publicadas',
  portada.texto.includes('href="/academy/"') &&
  publicadas.every(l => portada.texto.includes(`href="/academy/${l.slug}"`)));
ok('portada aplica la CSP estricta', /script-src 'self'/.test(portada.cabeceras.get('content-security-policy') || ''));
const hojaPortada = portada.texto.match(/href="(\/assets\/rwadar-20260820\.[0-9a-f]{12}\.css)"/)?.[1];
if (hojaPortada) {
  const hoja = await pedir(hojaPortada);
  ok('la hoja de estilos de la portada lleva la Geist completa (no el recorte sin a-z)',
    hoja.estado === 200 && !hoja.texto.includes('d09GMgABAAAAAECAABQAAAAAjngAAEALAAEAA') &&
    (hoja.texto.match(/@font-face/g) || []).length === 2);
} else ok('la portada referencia su hoja de estilos con huella', false);

const privacidad = await pedir('/privacidad');
ok('privacidad explica dónde se guarda el progreso de la Academy',
  privacidad.estado === 200 && privacidad.texto.includes('progreso de RWAdar Academy'));

const sitemap = await pedir('/sitemap.xml');
ok(conCuenta ? 'el mapa del sitio lista el índice de la Academy y ninguna lección (van con cuenta)'
  : 'el mapa del sitio lista la Academy publicada y nada más',
  sitemap.estado === 200 && sitemap.texto.includes(`<loc>https://rwadar.pages.dev/academy/</loc>`) &&
  publicadas.every(l => conCuenta ? !sitemap.texto.includes(`/academy/${l.slug}`) : sitemap.texto.includes(`/academy/${l.slug}</loc>`)) &&
  pendientes.every(l => !sitemap.texto.includes(l.slug)));

const indice = await pedir('/academy/');
const indiceIndexable = indice.estado === 200 && indice.texto.includes('data-academy-indice-pagina') &&
  indice.texto.includes('<meta name="robots" content="index,follow');
if (produccion) ok('el índice de la Academy responde 200 y se puede indexar',
  indiceIndexable && !/noindex/i.test(indice.cabeceras.get('x-robots-tag') || ''));
else ok('el índice de la Academy responde 200 y su HTML se puede indexar (en la vista previa, la cabecera noindex es de Pages)',
  indiceIndexable);
if (conCuenta) ok('el índice dice que es gratis con cuenta y enlaza el alta con vuelta a la Academy',
  indice.texto.includes('Gratis con tu cuenta') && indice.texto.includes(`href="${academyMod.ALTA_ACADEMY}"`));
/* Candado del 08/11/2026: sin sesión, el índice llega BLOQUEADO (tarjetas
   difuminadas, inert y aria-hidden) y su hoja y su script responden. */
if (conCuenta) {
  const candado = [...indice.texto.matchAll(/(?:href|src)="(\/assets\/academy-candado-20261108\.[0-9a-f]{12}\.(?:css|js))"/g)].map(m => m[1]);
  ok('el índice llega bloqueado sin sesión: candado, tarjetas inertes y fuera del lector',
    indice.texto.includes('<div class="candado" data-academy-candado data-estado="bloqueado">') &&
    indice.texto.includes('<div class="candado-contenido" data-academy-candado-contenido inert aria-hidden="true">'));
  ok(`la hoja y el script del candado van con huella: ${candado.length}`, candado.length === 2);
  for (const ruta of candado) {
    const asset = await pedir(ruta);
    ok(`${ruta} responde 200`, asset.estado === 200 && asset.texto.length > 500);
  }
}
ok(`el índice muestra ${publicadas.length} lecciones disponibles y ${pendientes.length} «Próximamente»`,
  indice.texto.includes(`<progress max="${publicadas.length}"`) &&
  (indice.texto.match(/ac-tarjeta ac-tarjeta-pronto/g) || []).length === pendientes.length);
const sinBarra = await pedir('/academy');
ok('/academy redirige a /academy/', [301, 308].includes(sinBarra.estado) &&
  /\/academy\/$/.test(sinBarra.cabeceras.get('location') || ''));

const assets = new Set();
for (const nombre of paginasFichas) {
  const ruta = '/' + (nombre.endsWith('.html') ? nombre.slice(0, -5) : nombre);
  const pagina = await pedir(ruta);
  const esHtml = nombre.endsWith('.html');
  ok(`ficha o novedades ${ruta} publicada`, pagina.estado === 200 && (esHtml
    ? pagina.texto.includes(`<link rel="canonical" href="https://rwadar.pages.dev${ruta}">`) &&
      (pagina.texto.match(/<h1\b[^>]*>/g) || []).length === 1 && /script-src 'self'/.test(pagina.cabeceras.get('content-security-policy') || '')
    : pagina.texto.includes('<rss version="2.0"') && pagina.texto.includes('https://rwadar.pages.dev/')));
  /* El diccionario inglés va en data-idioma-en de idioma-previo (se carga solo
     en inglés; limpieza de la web, 13/11/2026): cuenta como uno de los cuatro. */
  if(esHtml){for(const m of pagina.texto.matchAll(/(?:href|src|data-idioma-en)="(\/assets\/(?:ficha-editorial|ficha-pagina|fichas|idioma(?:-en|-web)?)-20261022\.[0-9a-f]{12}\.(?:css|js))"/g)) assets.add(m[1]);
    ok(`interfaz de idiomas completa en ${ruta}`,(pagina.texto.match(/(?:href|src|data-idioma-en)="\/assets\/idioma(?:-en|-web)?-20261022\.[0-9a-f]{12}\.(?:css|js)"/g)||[]).length===4);}
}
for (const nombre of ARCHIVOS_PUBLICABLES.filter(n => n.endsWith('.woff2'))) {
  const respuesta = await fetch(base + '/' + nombre, {cache:'no-store'});
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  const huella = nombre.match(/-([0-9a-f]{12})\.woff2$/)?.[1];
  ok(`tipografía íntegra ${nombre}`, respuesta.status === 200 && bytes.subarray(0,4).toString() === 'wOF2' &&
    crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12) === huella);
}
const assetsLeccion = /(?:href|src|data-idioma-en)="(\/assets\/(?:academy-20261002|idioma(?:-en|-web)?-20261022)\.[0-9a-f]{12}\.(?:css|js))"/g;
if (conCuenta) {
  /* El contenido se comprueba en rwadar-publicado/: el índice publicado debe
     ser byte a byte el de esa carpeta, o lo comprobado no es lo que se sirve. */
  ok('rwadar-publicado/ es lo que está publicado (el índice de la Academy coincide byte a byte)',
    leerPublicado('academy/index.html') === indice.texto);
  const fallosLecciones = academyMod.comprobarLeccionesPublicadas(publicado, academy);
  ok(`las ${publicadas.length} lecciones de rwadar-publicado/ llevan su contenido, su revisión legal y noindex` +
    (fallosLecciones.length ? `: ${fallosLecciones.join('; ')}` : ''), fallosLecciones.length === 0);
  for (const l of publicadas) {
    for (const m of (leerPublicado(`academy/${l.slug}.html`) || '').matchAll(assetsLeccion)) assets.add(m[1]);
    const pagina = await pedir(`/academy/${l.slug}`, { headers: { Accept: 'text/html' } });
    ok(`lección ${l.modulo} sin sesión: 303 a /acceso?volver=/academy/${l.slug}, sin guardarse: ${pagina.estado}`, mandaAEntrar(pagina, l.slug));
  }
  const primera = publicadas[0].slug;
  for (const ruta of [`/academy/${primera}.html`, `/academy/${primera}/`, `//academy/${primera}`, `/ACADEMY/${primera}`]) {
    const variante = await pedir(ruta, { headers: { Accept: 'text/html' } });
    ok(`${ruta} sin sesión también manda a entrar: ${variante.estado}`, mandaAEntrar(variante, primera));
  }
  const cabeza = await pedir(`/academy/${primera}`, { method: 'HEAD', headers: { Accept: 'text/html' } });
  ok(`HEAD de una lección sin sesión: 303: ${cabeza.estado}`, mandaAEntrar(cabeza, primera));
  const noHtml = await pedir(`/academy/${primera}`, { headers: { Accept: 'application/json' } });
  ok(`una lección pedida sin sesión fuera de una página da 401 sin guardarse: ${noHtml.estado}`, noHtml.estado === 401 &&
    /no-store/.test(noHtml.cabeceras.get('cache-control') || '') && !noHtml.cabeceras.has('set-cookie'));
  // Un token con forma de JWT pero falso: Auth lo rechaza y la lección sigue cerrada.
  const inventada = await pedir(`/academy/${primera}`, { headers: { Accept: 'text/html',
    // Se arma por partes para que el detector de secretos no lo tome por un token real.
    Cookie: '__Host-rwadar-acceso=' + ['eyJhbGciOiJub25lIn0', 'eyJzdWIiOiJjb21wcm9iYWNpb24ifQ', 'comprobacion'].join('.') } });
  ok(`una cookie inventada no abre la lección ni se borra: ${inventada.estado}`, mandaAEntrar(inventada, primera));
  const barra = await pedir('/academy/a%2Fb', { headers: { Accept: 'text/html' } });
  ok(`una ruta de la Academy con %2F da 400: ${barra.estado}`, barra.estado === 400);
  /* /assets/* no pasa por el worker (_routes.json, 07/11/2026). Una lección
     pedida «a través» de /assets/ con «..» no puede saltarse la puerta: tiene
     que redirigir, dar 400 o 404, nunca 200 ni el contenido de la lección. */
  for (const ruta of [`/assets/../academy/${primera}`, `/assets/%2e%2e/academy/${primera}`, `/assets/.%2e/academy/${primera}`,
    `/assets/%2E%2E/academy/${primera}.html`, `/assets/..%2facademy/${primera}`]) {
    let cruda;
    try { cruda = await pedirCruda(ruta, { Accept: 'text/html' }); } catch (error) { cruda = { estado: 'error: ' + error.message, texto: '' }; }
    ok(`${ruta} (ruta tal cual) no abre la lección: ${cruda.estado}`, [301, 302, 303, 307, 308, 400, 404].includes(cruda.estado) &&
      !cruda.texto.includes(`data-academy-leccion="${primera}"`));
  }
  const falsa = await pedir('/academy/rwadar-comprobacion-leccion-inexistente', { headers: { Accept: 'text/html' } });
  ok(`una lección que no existe da el 404 del worker sin mirar la sesión: ${falsa.estado}`, noEncontradaDelWorker(falsa));
} else {
  for (const l of publicadas) {
    const pagina = await pedir(`/academy/${l.slug}`);
    ok(`lección ${l.modulo} responde 200 con su contenido`,
      pagina.estado === 200 && pagina.texto.includes(`data-academy-leccion="${l.slug}"`) &&
      pagina.texto.includes(l.titulo.replace(/&/g, '&amp;')));
    ok(`lección ${l.modulo} muestra la revisión legal del ${fechaLarga(l.revisionLegal)}`,
      pagina.texto.includes(`Contenido revisado el <time datetime="${l.revisionLegal}">${fechaLarga(l.revisionLegal)}</time>`));
    ok(`lección ${l.modulo} aplica la CSP estricta`,
      /script-src 'self'/.test(pagina.cabeceras.get('content-security-policy') || ''));
    for (const m of pagina.texto.matchAll(assetsLeccion)) assets.add(m[1]);
  }
}
ok('las lecciones y fichas usan sus hojas, scripts y cuatro recursos de idioma con huella', assets.size === 9);
for (const ruta of assets) {
  const asset = await pedir(ruta);
  ok(`${ruta} responde 200`, asset.estado === 200 && asset.texto.length > 1000);
}
for (const l of pendientes) {
  const pagina = await pedir(`/academy/${l.slug}`, { headers: { Accept: 'text/html' } });
  ok(`lección ${l.modulo} (Próximamente) no tiene página: ${pagina.estado}`, conCuenta ? noEncontradaDelWorker(pagina) : pagina.estado === 404);
}

/* Baja de los avisos sin cuenta (05/11/2026): la página no se indexa ni se
   guarda, y el endpoint existe y rechaza un enlace sin forma de UUID antes de
   llamar a la base. Nunca se envía un token de verdad. */
const baja = await pedir('/baja');
ok(`la página de baja de avisos responde 200, sin indexar ni guardarse: ${baja.estado}`, baja.estado === 200 &&
  /noindex/.test(baja.cabeceras.get('x-robots-tag') || '') && /no-store/.test(baja.cabeceras.get('cache-control') || ''));
const bajaMala = await pedir('/api/acceso/baja', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'no-es-un-enlace' }) });
ok(`la baja rechaza un enlace sin forma de UUID: ${bajaMala.estado}`, bajaMala.estado === 400 &&
  /no-store/.test(bajaMala.cabeceras.get('cache-control') || ''));

/* Fichas retiradas: Cloudflare Pages conserva una semana, en cada centro de
   datos, copias de lo que sirvió y las devuelve si el archivo desaparece. El
   worker debe dar 404 a toda ficha borrada del repositorio que no haya vuelto
   al manifiesto. La lista sale del historial de Git (el flujo usa fetch-depth 0). */
let retiradas = [];
try {
  retiradas = [...new Set(execFileSync('git', ['log', '--diff-filter=D', '--name-only', '--format=', '--',
    'rwadar-site/ofertas/*.html', 'rwadar-site/plataformas/*.html', 'rwadar-site/fuera-del-radar/*.html'],
  { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' })
    .split('\n').map(linea => linea.trim().replace(/^rwadar-site\//, '')).filter(Boolean))]
    .filter(ficha => !paginasFichas.includes(ficha)).sort();
} catch (e) { console.log(`  (no se pudo leer el historial de Git: ${e.message})`); }
ok(`el historial de Git da las fichas retiradas que hay que comprobar (${retiradas.length})`, retiradas.length > 0);
const inexistente = await pedir('/ofertas/rwadar-comprobacion-ficha-inexistente');
ok('una ficha que nunca existió da el 404 del worker', noEncontradaDelWorker(inexistente));
/* Una plataforma que cambió de carpeta (de plataformas/ a fuera-del-radar/, o al
   revés) no da 404: el worker redirige con 301 a la ficha publicada. */
const trasladada = ficha => {
  const [carpeta, archivo] = ficha.split('/');
  const otra = { plataformas: 'fuera-del-radar', 'fuera-del-radar': 'plataformas' }[carpeta];
  return otra && paginasFichas.includes(`${otra}/${archivo}`) ? `/${otra}/${archivo.replace(/\.html$/, '')}` : null;
};
for (const ficha of retiradas) {
  const ruta = '/' + ficha.replace(/\.html$/, '');
  const pagina = await pedir(ruta);
  const destino = trasladada(ficha);
  if (destino) ok(`ficha trasladada ${ruta} redirige (301) a ${destino}: ${pagina.estado}`, pagina.estado === 301 &&
    pagina.cabeceras.get('location') === destino && pagina.cabeceras.get('cache-control') === 'no-store');
  else ok(`ficha retirada ${ruta} da el 404 del worker: ${pagina.estado}`, noEncontradaDelWorker(pagina));
}
/* Lo mismo con las ilustraciones de las ofertas retiradas: las borradas de
   Git que no sigan en la carpeta editorial ni en las precargas. Aquí el 404
   puede ser el de Pages (sin copia en ese centro de datos) o el del worker
   (con copia), así que solo se exige el 404, también al revalidar. */
const imagenesVivas = new Set();
for (const dir of ['rwadar-movil/assets/ofertas-editoriales', 'rwadar-editorial-source/ofertas/precargas']) {
  const raizDir = fileURLToPath(new URL('../' + dir + '/', import.meta.url));
  if (fs.existsSync(raizDir)) for (const e of fs.readdirSync(raizDir, { recursive: true })) imagenesVivas.add(path.basename(String(e)));
}
let imagenesRetiradas = [];
try {
  imagenesRetiradas = [...new Set(execFileSync('git', ['log', '--diff-filter=D', '--name-only', '--format=', '--',
    'rwadar-movil/assets/ofertas-editoriales/oferta-*.webp'],
  { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' })
    .split('\n').map(linea => path.basename(linea.trim())).filter(Boolean))]
    .filter(nombre => !imagenesVivas.has(nombre)).sort();
} catch (e) { console.log(`  (no se pudo leer el historial de Git: ${e.message})`); }
ok(`el historial de Git da las ilustraciones retiradas que hay que comprobar (${imagenesRetiradas.length})`, imagenesRetiradas.length > 0);
for (const nombre of imagenesRetiradas) {
  const imagen = await pedir('/ofertas-editoriales/' + nombre, { method: 'HEAD' });
  const revalidada = await pedir('/ofertas-editoriales/' + nombre, { method: 'HEAD', headers: { 'If-None-Match': '"rwadar-comprobacion"' } });
  ok(`ilustración retirada /ofertas-editoriales/${nombre} da 404: ${imagen.estado} / ${revalidada.estado}`, imagen.estado === 404 && revalidada.estado === 404);
}

/* Rediseño de Inicio (10/11/2026): las secciones /mercado/, /noticias/ (que
   desde el 11/11/2026 lleva a /mercado/) y
   /aprende/; las noticias en sus dos formas (v2 con foto para la web y la app
   nuevas, v1 sin «imagen» para la app ya instalada) y cada foto que usan, con
   los bytes de fotos.json. */
for (const nombre of PAGINAS_SECCIONES) {
  const ruta = '/' + nombre.replace(/index\.html$/, '');
  const pagina = await pedir(ruta);
  // Desde el 11/11/2026, /noticias/ lleva a /mercado/ (las noticias van debajo del gráfico).
  const canonica = ruta === '/noticias/' ? '/mercado/' : ruta;
  ok(`sección ${ruta} publicada con su canonical`, pagina.estado === 200 &&
    pagina.texto.includes(`<link rel="canonical" href="https://rwadar.pages.dev${canonica}">`) &&
    (pagina.texto.match(/<h1\b[^>]*>/g) || []).length === 1 && /script-src 'self'/.test(pagina.cabeceras.get('content-security-policy') || ''));
}
// «Mercado y noticias» (11/11/2026): la serie de un año del gráfico es la del build.
const serieMercado = await pedir('/datos/tokenizacion-serie.json');
ok('/datos/tokenizacion-serie.json es el del build', serieMercado.estado === 200 && serieMercado.texto === leerPublicado('datos/tokenizacion-serie.json'));
// Las series finas (13/11/2026): las del build, y de la misma ejecución que la diaria publicada.
const serieFina = await pedir('/datos/tokenizacion-serie-fina.json');
let generadoFina = null, generadoDiaria = null;
try { generadoFina = JSON.parse(serieFina.texto).generado; generadoDiaria = JSON.parse(serieMercado.texto).generado; } catch {}
ok('/datos/tokenizacion-serie-fina.json es el del build y casa con la diaria', serieFina.estado === 200 &&
  serieFina.texto === leerPublicado('datos/tokenizacion-serie-fina.json') && typeof generadoFina === 'string' && generadoFina === generadoDiaria);
// El gráfico en directo (14/11/2026, migración 35): 200 válido, 404 directo_apagado o 503 con un
// código conocido (este, con un aviso y sin fallar: .github/juzgar-directo.mjs).
{
  const directo = await pedir('/api/tokenizacion/directo');
  const juicio = juzgarDirecto(directo.estado, directo.texto, tokenizacionModelo);
  if (juicio.aviso && juicio.bien) console.log(`  AVISO ${juicio.aviso}`);
  ok(`/api/tokenizacion/directo responde lo esperado (${directo.estado}${juicio.bien ? '' : ': ' + juicio.aviso})`, juicio.bien);
}
// «Novedades de RWAdar» (12/11/2026): lo que leen la ventana de Inicio, /novedades-rwadar/ y la app.
const novedadesProducto = await pedir('/datos/novedades-producto.json');
ok('/datos/novedades-producto.json es el del build', novedadesProducto.estado === 200 &&
  novedadesProducto.texto === leerPublicado('datos/novedades-producto.json'));
const noticiasV2 = await pedir('/datos/noticias-v2.json');
const noticiasV1 = await pedir('/datos/noticias.json');
let datosV2 = null;
try { datosV2 = JSON.parse(noticiasV2.texto); } catch {}
ok('/datos/noticias-v2.json es el del build', noticiasV2.estado === 200 && noticiasV2.texto === leerPublicado('datos/noticias-v2.json'));
ok('/datos/noticias.json (app instalada) es el del build y no lleva «imagen»', noticiasV1.estado === 200 &&
  noticiasV1.texto === leerPublicado('datos/noticias.json') && !/"imagen"\s*:/.test(noticiasV1.texto));
const bibliotecaFotos = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../rwadar-editorial-source/noticias/fotos.json', import.meta.url)), 'utf8')).fotos;
const clavesUsadas = [...new Set((datosV2?.noticias || []).map(n => n && n.imagen).filter(c => typeof c === 'string'))];
ok('las noticias publicadas usan alguna foto', clavesUsadas.length > 0);
for (const clave of clavesUsadas) {
  const respuesta = await fetch(`${base}/noticias-editoriales/${clave}.webp`, { cache: 'no-store' });
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  const foto = bibliotecaFotos[clave];
  ok(`foto /noticias-editoriales/${clave}.webp publicada, WebP y con el sha256 de fotos.json`, respuesta.status === 200 &&
    /^image\/webp\b/.test(respuesta.headers.get('content-type') || '') && Boolean(foto) && bytes.length === foto.bytes &&
    crypto.createHash('sha256').update(bytes).digest('hex') === foto.sha256);
  // Y sus variantes (14/11/2026): las que eligen el srcset de la web y la app según la pantalla.
  for (const ancho of ['480', '960']) {
    const r = await fetch(`${base}/noticias-editoriales/${ancho}/${clave}.webp`, { cache: 'no-store' });
    const b = Buffer.from(await r.arrayBuffer());
    const v = foto?.variantes?.[ancho];
    ok(`foto /noticias-editoriales/${ancho}/${clave}.webp publicada, WebP y con el sha256 de fotos.json`, r.status === 200 &&
      /^image\/webp\b/.test(r.headers.get('content-type') || '') && Boolean(v) && b.length === v.bytes &&
      crypto.createHash('sha256').update(b).digest('hex') === v.sha256);
  }
}

console.log(`\n${correctas} correctas, ${fallos.length} fallidas`);
process.exit(fallos.length ? 1 : 0);
