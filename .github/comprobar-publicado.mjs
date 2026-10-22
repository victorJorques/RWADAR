/* =====================================================================
   RWAdar · comprueba la web YA publicada, página a página
   ---------------------------------------------------------------------
   Uso:  node .github/comprobar-publicado.mjs https://rwadar.pages.dev

   Lo lanza el flujo «Publicar web» después de subir. Compara lo que sirve
   Cloudflare con lo que hay en el repositorio: portada, privacidad, mapa
   del sitio, índice de la Academy, cada lección publicada (con su fecha de
   revisión legal), sus assets con huella, la CSP y que las lecciones no
   publicadas den 404. Sale con código 1 si algo no cuadra.
   ===================================================================== */
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const academyMod = require('../rwadar-academy.js');
const paginasFichas = require('../rwadar-fichas-manifiesto.js');
const {ARCHIVOS_PUBLICABLES} = require('../rwadar-publicacion-segura.js');

const base = String(process.argv[2] || '').replace(/\/$/, '');
const prueba = process.env.RWADAR_COMPROBAR_LOCAL === '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test(base);
if (!prueba && !/^https:\/\/[a-z0-9.-]+\.pages\.dev$/.test(base)) {
  console.error('Uso: node .github/comprobar-publicado.mjs https://rwadar.pages.dev');
  process.exit(2);
}

const academy = academyMod.cargarAcademy();
const publicadas = academy.lecciones.filter(l => l.estado === 'publicado');
const pendientes = academy.lecciones.filter(l => l.estado !== 'publicado');
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
const fechaLarga = iso => {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${meses[m - 1]} de ${a}`;
};

console.log(`Comprobando ${base} …`);

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
ok('el mapa del sitio lista la Academy publicada y nada más',
  sitemap.estado === 200 && sitemap.texto.includes(`<loc>https://rwadar.pages.dev/academy/</loc>`) &&
  publicadas.every(l => sitemap.texto.includes(`/academy/${l.slug}</loc>`)) &&
  pendientes.every(l => !sitemap.texto.includes(l.slug)));

const indice = await pedir('/academy/');
ok('el índice de la Academy responde 200', indice.estado === 200 && indice.texto.includes('data-academy-indice-pagina'));
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
  if(esHtml){for(const m of pagina.texto.matchAll(/(?:href|src)="(\/assets\/(?:ficha-editorial|ficha-pagina|fichas|idioma(?:-en|-web)?)-20261022\.[0-9a-f]{12}\.(?:css|js))"/g)) assets.add(m[1]);
    ok(`interfaz de idiomas completa en ${ruta}`,(pagina.texto.match(/(?:href|src)="\/assets\/idioma(?:-en|-web)?-20261022\.[0-9a-f]{12}\.(?:css|js)"/g)||[]).length===4);}
}
for (const nombre of ARCHIVOS_PUBLICABLES.filter(n => n.endsWith('.woff2'))) {
  const respuesta = await fetch(base + '/' + nombre, {cache:'no-store'});
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  const huella = nombre.match(/-([0-9a-f]{12})\.woff2$/)?.[1];
  ok(`tipografía íntegra ${nombre}`, respuesta.status === 200 && bytes.subarray(0,4).toString() === 'wOF2' &&
    crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12) === huella);
}
for (const l of publicadas) {
  const pagina = await pedir(`/academy/${l.slug}`);
  ok(`lección ${l.modulo} responde 200 con su contenido`,
    pagina.estado === 200 && pagina.texto.includes(`data-academy-leccion="${l.slug}"`) &&
    pagina.texto.includes(l.titulo.replace(/&/g, '&amp;')));
  ok(`lección ${l.modulo} muestra la revisión legal del ${fechaLarga(l.revisionLegal)}`,
    pagina.texto.includes(`Contenido revisado el <time datetime="${l.revisionLegal}">${fechaLarga(l.revisionLegal)}</time>`));
  ok(`lección ${l.modulo} aplica la CSP estricta`,
    /script-src 'self'/.test(pagina.cabeceras.get('content-security-policy') || ''));
  for (const m of pagina.texto.matchAll(/(?:href|src)="(\/assets\/(?:academy-20261002|idioma(?:-en|-web)?-20261022)\.[0-9a-f]{12}\.(?:css|js))"/g)) assets.add(m[1]);
}
ok('las lecciones y fichas usan sus hojas, scripts y cuatro recursos de idioma con huella', assets.size === 9);
for (const ruta of assets) {
  const asset = await pedir(ruta);
  ok(`${ruta} responde 200`, asset.estado === 200 && asset.texto.length > 1000);
}
for (const l of pendientes) {
  const pagina = await pedir(`/academy/${l.slug}`);
  ok(`lección ${l.modulo} (Próximamente) no tiene página: ${pagina.estado}`, pagina.estado === 404);
}

console.log(`\n${correctas} correctas, ${fallos.length} fallidas`);
process.exit(fallos.length ? 1 : 0);
