// Genera la ilustración propia de cada ficha a partir de fichas.json (texto)
// y fotos.json (la foto generada que la ilustra; si no hay, la escena en SVG)
// y deja coherentes las cuatro cosas que dependen de ella:
//   1. rwadar-movil/assets/ofertas-editoriales/oferta-<slug>.webp (960×660)
//   2. las entradas «fichas» de manifest.json (bytes, SHA-256, alt, pasos)
//   3. el bloque EDITORIAL_OFERTA_POR_SLUG de rwadar-site/assets/rwadar-20260820.js
//   4. el bloque FUENTES_POR_FICHA de rwadar-movil/fixtures/imagenes-editoriales.js
//
//   node rwadar-editorial-source/ofertas/generar.mjs            todas
//   node rwadar-editorial-source/ofertas/generar.mjs --comprobar  solo valida fichas.json
//   node rwadar-editorial-source/ofertas/generar.mjs --hoja=ruta.png   y hoja de contactos
//   node rwadar-editorial-source/ofertas/generar.mjs --indices   solo reescribe 2, 3 y 4 con
//        los archivos que ya hay (sin dibujar nada): lo usa importar-foto.py --biblioteca ofertas
//
// Fotos reales (22/11/2026): si fotos.json trae en «reales» una foto de
// Wikimedia Commons para una ficha, se publica esa (foto-<slug>.webp, ya
// recortada a 960×660 por importar-foto.py) con su crédito en el manifiesto,
// y no se dibuja su ilustración de IA (oferta-<slug>.webp se borra).
//
// Necesita Playwright con Chromium (el mismo que usa capturar-fuentes.mjs);
// RWADAR_CHROMIUM permite indicar el ejecutable. Con --indices, no.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as ESCENAS from './escenas.mjs';
import { pagina, W, H } from './plantilla.mjs';
import { paginaFoto } from './plantilla-foto.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_CODIGO = path.resolve(AQUI, '..', '..');
// --raiz=<copia del repositorio>: los datos (fichas, fotos, manifiesto, web y app) de esa copia
// (la usa la prueba sin red del importador); el código y el catálogo, de aquí.
const RAIZ = path.resolve((process.argv.find(a => a.startsWith('--raiz=')) || '').slice('--raiz='.length) || RAIZ_CODIGO);
const require = createRequire(import.meta.url);
const {
  CATEGORIAS_FICHA, FICHA_ANCHO, FICHA_ALTO, FICHA_BYTES_MAX, TEXTO_PROHIBIDO,
  DIRECTORIO_RELATIVO, ETIQUETA_OBLIGATORIA, cargarActivosEditoriales, archivoFicha, dimensionesWebp,
} = require('../../rwadar-ofertas-editoriales.js');
// Lo común de las fotos reales (fuente, licencia, autor, sin personas): lo mismo que las noticias.
const { comprobarFotoReal, tituloCommons } = require('../../rwadar-noticias-editoriales.js');
const fotosOfertas = require('../../rwadar-movil/lib/fotos-ofertas.js');
const CAMPOS_REAL = Object.freeze(['origen', 'descripcion', 'queMuestra', 'lugarOTema', 'lugarOTemaEn', 'fuente', 'licencia', 'autor',
  'sinPersonas', 'encuadre', 'bytes', 'sha256']);
const OPCIONALES_REAL = Object.freeze(['lugarOTema', 'lugarOTemaEn']);
const MODELO_FOTOS = path.join(RAIZ_CODIGO, 'rwadar-movil', 'lib', 'fotos-ofertas.js');
/* El modelo de los pies (lib/fotos-ofertas.js) va tal cual en el bloque
   generado de la web, con lo que necesita de lib/noticias-sector.js (las
   licencias): la web y la app dicen exactamente lo mismo. */
function modeloFotosWeb() {
  const { LICENCIAS_FOTO, SITIO_FOTOS, PAGINA_COMMONS } = require('../../rwadar-movil/lib/noticias-sector.js');
  const fuente = fs.readFileSync(MODELO_FOTOS, 'utf8').replace(/^'use strict';\n/, '');
  return `const FOTOS_OFERTAS_MODELO=(()=>{const module={exports:{}};const require=()=>Object.freeze({LICENCIAS_FOTO:${JSON.stringify(LICENCIAS_FOTO)},` +
    `SITIO_FOTOS:${JSON.stringify(SITIO_FOTOS)},PAGINA_COMMONS:${PAGINA_COMMONS.toString()}});\n${fuente}return module.exports;})();\n`;
}

const DIR_ACTIVOS = path.join(RAIZ, ...DIRECTORIO_RELATIVO.split('/'));
const MANIFIESTO = path.join(DIR_ACTIVOS, 'manifest.json');
const JS_WEB = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
const FIXTURE_APP = path.join(RAIZ, 'rwadar-movil', 'fixtures', 'imagenes-editoriales.js');
const FUENTE = path.join(RAIZ, 'rwadar-editorial-source', 'ofertas');
const FICHAS = path.join(FUENTE, 'fichas.json');
const FOTOS = path.join(FUENTE, 'fotos.json');
const DIR_FOTOS = path.join(FUENTE, 'fotos');
export const COLOR = Object.freeze({
  'Inmobiliario': '#F2B23C', 'Crédito privado': '#5B8CFF', 'Tesoro y fondos': '#32C9F5',
  'Acciones y capital privado': '#B583FF', 'Materias primas': '#FF8A5B', 'Infraestructura': '#9AA6BF',
});

const args = process.argv.slice(2);
const SOLO_COMPROBAR = args.includes('--comprobar');
const INDICES = args.includes('--indices');
const HOJA = (args.find(a => a.startsWith('--hoja=')) || '').slice('--hoja='.length);

// El catálogo de referencia es la última revisión V2 del repositorio.
function catalogoVigente() {
  const base = path.join(fs.existsSync(path.join(RAIZ, 'rwadar-app')) ? RAIZ : RAIZ_CODIGO, 'rwadar-app', 'data', 'verificaciones');
  const clave = n => n.slice(0, 10) + String(Number(n.slice(11, -3) || 1)).padStart(3, '0');
  const carpetas = fs.readdirSync(base).filter(n => /^\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?-v2$/.test(n))
    .sort((a, b) => clave(a).localeCompare(clave(b)));
  for (const carpeta of carpetas.reverse()) {
    const ruta = path.join(base, carpeta, 'escaparate-publicacion.json');
    if (fs.existsSync(ruta)) return { carpeta, ofertas: JSON.parse(fs.readFileSync(ruta, 'utf8')).ofertas };
  }
  throw new Error('no hay ninguna revisión V2 con escaparate-publicacion.json');
}

function validar(spec, catalogo) {
  const errores = [];
  const porSlug = new Map(catalogo.ofertas.map(o => [o.slug, o]));
  const vistos = new Set();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spec.revisadoEl || '')) errores.push('fichas.json: falta revisadoEl (AAAA-MM-DD)');
  for (const f of spec.fichas) {
    const o = porSlug.get(f.slug);
    if (vistos.has(f.slug)) errores.push(`${f.slug}: repetida`);
    vistos.add(f.slug);
    if (!o) { errores.push(`${f.slug}: no está en el catálogo de ${catalogo.carpeta}`); continue; }
    if (!CATEGORIAS_FICHA.includes(o.categoria) || !COLOR[o.categoria]) errores.push(`${f.slug}: categoría sin color (${o.categoria})`);
    if (typeof ESCENAS[f.escena] !== 'function') errores.push(`${f.slug}: escena desconocida (${f.escena})`);
    if (!Array.isArray(f.pasos) || f.pasos.length !== 3) errores.push(`${f.slug}: hacen falta tres pasos`);
    for (const t of [...(f.pasos || []), f.lugar || '', f.concepto || '']) {
      if (TEXTO_PROHIBIDO.test(t)) errores.push(`${f.slug}: cifra o promesa en «${t}»`);
    }
    if (!f.concepto) errores.push(`${f.slug}: falta el concepto (lo que explica la imagen)`);
  }
  for (const [slug, foto] of Object.entries(fotos.fotos)) {
    if (!vistos.has(slug)) errores.push(`fotos.json: ${slug} no está en fichas.json`);
    if (!fotos.modelos[foto.modelo]) errores.push(`fotos.json: ${slug} usa un modelo sin describir (${foto.modelo})`);
    if (!/^\d{1,3}% \d{1,3}%$/.test(foto.encuadre || '')) errores.push(`fotos.json: ${slug} necesita un encuadre «x% y%»`);
    if (!foto.concepto || TEXTO_PROHIBIDO.test(foto.concepto)) errores.push(`fotos.json: ${slug} sin concepto o con cifra o promesa`);
    if (!fs.existsSync(path.join(DIR_FOTOS, `${slug}.webp`))) errores.push(`fotos.json: falta la foto maestra fotos/${slug}.webp`);
  }
  for (const n of fs.existsSync(DIR_FOTOS) ? fs.readdirSync(DIR_FOTOS) : []) {
    if (!fotos.fotos[n.replace(/\.webp$/, '')]) errores.push(`fotos/${n} no está en fotos.json`);
  }
  if (![2, 3].includes(fotos.versionEsquema)) errores.push('fotos.json: versionEsquema 2 o 3');
  const reales = fotos.reales === undefined ? {} : fotos.reales;
  if (!reales || typeof reales !== 'object' || Array.isArray(reales) || (Object.keys(reales).length && fotos.versionEsquema !== 3)) {
    errores.push('fotos.json: «reales» es un objeto por slug y necesita el esquema 3');
  } else {
    const archivos = new Map(), originales = new Map();
    for (const [slug, r] of Object.entries(reales)) errores.push(...validarReal(slug, r, vistos, archivos, originales));
  }
  const sinImagen = catalogo.ofertas.filter(o => !vistos.has(o.slug)).map(o => o.slug);
  return { errores, sinImagen, porSlug };
}

/* Una foto real de «reales»: la biblioteca, lo que dice el pie y el archivo
   ya exportado (foto-<slug>.webp) con sus bytes y su sha256. */
function validarReal(slug, r, vistos, archivos, originales) {
  const errores = [];
  const donde = `fotos.json, reales: ${slug}`;
  if (!vistos.has(slug)) errores.push(`${donde} no está en fichas.json`);
  if (!r || typeof r !== 'object' || r.origen !== 'foto') return [...errores, `${donde}: «origen» es "foto"`];
  const sobran = Object.keys(r).filter(k => !CAMPOS_REAL.includes(k));
  const faltan = CAMPOS_REAL.filter(k => !OPCIONALES_REAL.includes(k) && !Object.hasOwn(r, k));
  if (sobran.length) errores.push(`${donde}: no lleva ${sobran.join(', ')} (eso es de las de IA o no es de la biblioteca)`);
  if (faltan.length) errores.push(`${donde}: le falta ${faltan.join(', ')}`);
  try { comprobarFotoReal(slug, r, 'fotos.json (reales)'); } catch (e) { errores.push(e.message); }
  if (!fotosOfertas.QUE_MUESTRA.includes(r.queMuestra)) errores.push(`${donde}: «queMuestra» es ${fotosOfertas.QUE_MUESTRA.join(', ')}`);
  else if (r.queMuestra === 'activo' ? r.lugarOTema !== undefined || r.lugarOTemaEn !== undefined : !r.lugarOTema) {
    errores.push(`${donde}: ${r.queMuestra === 'activo' ? 'la foto del activo no lleva «lugarOTema»' : 'falta «lugarOTema» (lo que dice el pie)'}`);
  }
  for (const t of [r.descripcion, r.lugarOTema, r.lugarOTemaEn]) {
    if (typeof t === 'string' && fotosOfertas.PROHIBIDO.test(t)) errores.push(`${donde}: cifra de dinero o promesa en «${t}»`);
  }
  if (r.fuente && typeof r.fuente.archivo === 'string') {
    const titulo = tituloCommons(r.fuente.archivo);
    if (archivos.has(titulo)) errores.push(`${donde}: es el mismo archivo de Commons que ${archivos.get(titulo)}`);
    if (originales.has(r.fuente.sha256Original)) errores.push(`${donde}: es la misma imagen que ${originales.get(r.fuente.sha256Original)}`);
    archivos.set(titulo, slug); originales.set(r.fuente.sha256Original, slug);
  }
  const ruta = path.join(DIR_ACTIVOS, archivoFicha(slug, true));
  if (!fs.existsSync(ruta)) return [...errores, `${donde}: falta ${DIRECTORIO_RELATIVO}/${archivoFicha(slug, true)}`];
  const bytes = fs.readFileSync(ruta);
  let dim = {};
  try { dim = dimensionesWebp(bytes); } catch (e) { errores.push(`${donde}: ${e.message}`); }
  if (bytes.length !== r.bytes || crypto.createHash('sha256').update(bytes).digest('hex') !== r.sha256 ||
      dim.ancho !== FICHA_ANCHO || dim.alto !== FICHA_ALTO || r.bytes > FICHA_BYTES_MAX) {
    errores.push(`${donde}: ${archivoFicha(slug, true)} no tiene los bytes, el sha256 o el tamaño (${FICHA_ANCHO}×${FICHA_ALTO}, ${FICHA_BYTES_MAX} bytes como mucho) de fotos.json`);
  }
  return errores;
}

/* La entrada del manifiesto de una foto real: el texto alternativo es su
   descripción y el crédito, lo que piden su licencia y el pie (lib/fotos-ofertas.js). */
function entradaReal(f, r, categoria) {
  const lic = r.licencia;
  return {
    slug: f.slug, categoria, archivo: archivoFicha(f.slug, true), ancho: FICHA_ANCHO, alto: FICHA_ALTO, bytes: r.bytes, hashSha256: r.sha256,
    alt: r.descripcion, pasos: f.pasos, ...(f.lugar ? { lugar: f.lugar } : {}),
    origen: 'foto', queMuestra: r.queMuestra,
    ...(r.queMuestra === 'activo' ? {} : { lugarOTema: r.lugarOTema, ...(r.lugarOTemaEn ? { lugarOTemaEn: r.lugarOTemaEn } : {}) }),
    sinPersonas: true,
    credito: { autor: lic.atribucionObligatoria ? r.autor : null, licencia: lic.nombre, licenciaUrl: lic.url, sitio: r.fuente.sitio, pagina: r.fuente.pagina },
    revisadoEl: spec.revisadoEl,
  };
}

const altDe = (f, foto) => `${ETIQUETA_OBLIGATORIA} de ${foto ? foto.concepto : f.concepto}` +
  `${foto ? ', imagen generada con IA' : ''}. Pasos: ` +
  `${f.pasos.map(p => p.charAt(0).toLowerCase() + p.slice(1)).join('; ')}. No es una foto del activo real.`;

// Retoque de la foto maestra antes de ponerle el texto: recorte exacto a
// 1280×880 en el encuadre pedido, un punto menos de saturación (los modelos
// la exageran), tono algo más cálido y nitidez fina. La viñeta, el velo de
// lectura y el grano los pone plantilla-foto.mjs.
async function retocar(sharp, ruta, encuadre) {
  const { width, height } = await sharp(ruta).metadata();
  const [px, py] = encuadre.split(' ').map(v => Math.min(100, parseFloat(v)) / 100);
  const k = Math.max(W / width, H / height);
  const rw = Math.ceil(width * k), rh = Math.ceil(height * k);
  const buf = await sharp(ruta).removeAlpha().resize(rw, rh, { kernel: 'lanczos3' })
    .extract({ left: Math.round((rw - W) * px), top: Math.round((rh - H) * py), width: W, height: H })
    .modulate({ saturation: 0.93 })
    .recomb([[1.03, 0.01, 0], [0, 1, 0], [0, 0.01, 0.96]])
    .linear(1.04, -4)
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 2 })
    .jpeg({ quality: 95 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function reemplazarBloque(texto, inicio, fin, cuerpo, archivo) {
  const a = texto.indexOf(inicio), b = texto.indexOf(fin);
  if (a < 0 || b < a) throw new Error(`no encuentro el bloque generado en ${archivo}`);
  const desde = texto.indexOf('\n', a) + 1;
  return texto.slice(0, desde) + cuerpo + texto.slice(texto.lastIndexOf('\n', b) + 1);
}

function cargarPlaywright() {
  for (const intento of [() => require('playwright'), () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  throw new Error('hace falta Playwright (npm i -g playwright) para dibujar las ilustraciones');
}

const spec = JSON.parse(fs.readFileSync(FICHAS, 'utf8'));
const fotos = JSON.parse(fs.readFileSync(FOTOS, 'utf8'));
const catalogo = catalogoVigente();
const { errores, sinImagen, porSlug } = validar(spec, catalogo);
if (errores.length) { console.error(errores.map(e => `ERROR ${e}`).join('\n')); process.exit(1); }
if (sinImagen.length) console.warn(`AVISO: ${sinImagen.length} fichas sin ilustración propia (usan la de su categoría): ${sinImagen.join(', ')}`);
const REALES = fotos.reales || {};
console.log(`fichas.json: ${spec.fichas.length} fichas (${Object.keys(fotos.fotos).length} con foto generada y ${Object.keys(REALES).length} con foto real), catálogo ${catalogo.carpeta}`);
if (SOLO_COMPROBAR) {
  // El resto del contenido editorial se comprueba aquí y no con entradas nuevas
  // en el package.json raíz: ese archivo lo vigila el guardián de la OTA
  // (rwadar-movil/scripts/comprobar-ota-compatible.cjs) y cambiarlo exigiría
  // otro APK aunque solo se toquen los scripts de pruebas.
  // El modelo de los pies que lleva la web tiene que ser el de la app.
  if (!fs.readFileSync(JS_WEB, 'utf8').includes(modeloFotosWeb())) {
    console.error('ERROR la copia de lib/fotos-ofertas.js en el JS de la web no está al día (ejecuta generar.mjs --indices)');
    process.exit(1);
  }
  for (const extra of ['ofertas/transparencia.mjs', 'inicio/fuentes.mjs']) {
    execFileSync(process.execPath, [path.join(RAIZ_CODIGO, 'rwadar-editorial-source', extra), '--comprobar'], { stdio: 'inherit' });
  }
  process.exit(0);
}

const entradas = [];
const miniaturas = [];
const noCaben = [];
const manifiestoPrevio = JSON.parse(fs.readFileSync(MANIFIESTO, 'utf8'));
// Las fotos reales no se dibujan: se usa el archivo que dejó importar-foto.py.
for (const f of spec.fichas) {
  if (Object.hasOwn(REALES, f.slug)) entradas.push(entradaReal(f, REALES[f.slug], porSlug.get(f.slug).categoria));
}
if (INDICES) {
  // Sin dibujar: cada ilustración de IA sigue con su entrada y su archivo de ahora.
  const faltan = [];
  for (const f of spec.fichas) {
    if (Object.hasOwn(REALES, f.slug)) continue;
    const previa = (manifiestoPrevio.fichas || []).find(e => e.slug === f.slug && e.archivo === archivoFicha(f.slug));
    if (!previa || !fs.existsSync(path.join(DIR_ACTIVOS, previa.archivo)) || previa.categoria !== porSlug.get(f.slug).categoria) faltan.push(f.slug);
    else entradas.push(previa);
  }
  if (faltan.length) {
    console.error(`ERROR estas fichas no tienen ilustración dibujada al día (ejecuta generar.mjs sin --indices): ${faltan.join(', ')}`);
    process.exit(1);
  }
} else {
const sharp = require('sharp');
const { chromium } = cargarPlaywright();
const nav = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});
const pag = await nav.newPage({ viewport: { width: W, height: H } });
try {
  for (const f of spec.fichas) {
    if (Object.hasOwn(REALES, f.slug)) continue;
    const categoria = porSlug.get(f.slug).categoria;
    const color = COLOR[categoria];
    const foto = fotos.fotos[f.slug];
    const html = foto
      ? paginaFoto({ color, foto: await retocar(sharp, path.join(DIR_FOTOS, `${f.slug}.webp`), foto.encuadre), pasos: f.pasos, lugar: f.lugar, rotulo: false })
      : pagina({ color, escena: c => ESCENAS[f.escena](c, f.op || {}), pasos: f.pasos, lugar: f.lugar });
    await pag.setContent(html, { waitUntil: 'load' });
    await pag.evaluate(() => document.fonts.ready);
    // Cada paso en una sola línea: si se parte, se sale de la franja visible.
    const altos = await pag.evaluate(() => [...document.querySelectorAll('.pasos li')].map(li => li.getBoundingClientRect().height));
    const largos = altos.length ? f.pasos.filter((_, i) => altos[i] > 64) : [];
    if (largos.length) { noCaben.push(`${f.slug}: ${largos.join(' | ')}`); continue; }
    const png = await pag.screenshot({ type: 'png' });
    const webp = await sharp(png).resize(FICHA_ANCHO, FICHA_ALTO, { kernel: 'lanczos3' }).webp({ quality: foto ? 80 : 82, effort: 6 }).toBuffer();
    if (webp.length > FICHA_BYTES_MAX) throw new Error(`${f.slug}: ${webp.length} bytes, más del tope`);
    const archivo = `oferta-${f.slug}.webp`;
    fs.writeFileSync(path.join(DIR_ACTIVOS, archivo), webp);
    entradas.push({
      slug: f.slug, categoria, archivo, ancho: FICHA_ANCHO, alto: FICHA_ALTO, bytes: webp.length,
      hashSha256: crypto.createHash('sha256').update(webp).digest('hex'),
      alt: altDe(f, foto), concepto: foto ? foto.concepto : f.concepto, pasos: f.pasos, ...(f.lugar ? { lugar: f.lugar } : {}),
      ...(foto ? { origen: 'foto-generada', modelo: fotos.modelos[foto.modelo].nombre } : { origen: 'dibujo-propio', escena: f.escena }),
      revisadoEl: spec.revisadoEl,
    });
    if (HOJA) miniaturas.push(await sharp(png).resize(640, 440).png().toBuffer());
  }
} finally { await nav.close(); }
}
if (noCaben.length) {
  console.error(`ERROR estos pasos no caben en una línea (acórtalos):\n  ${noCaben.join('\n  ')}`);
  process.exit(1);
}
entradas.sort((a, b) => a.slug.localeCompare(b.slug));

// Fuera las ilustraciones de fichas que ya no están en fichas.json.
const validos = new Set(entradas.map(e => e.archivo));
for (const n of fs.readdirSync(DIR_ACTIVOS)) {
  if (/^(?:oferta|foto)-[a-z0-9-]+\.webp$/.test(n) && !validos.has(n)) fs.rmSync(path.join(DIR_ACTIVOS, n));
}

const manifiesto = manifiestoPrevio;
manifiesto.versionEsquema = 2;
manifiesto.fichasOrigen = {
  herramienta: `Fotografias generadas con IA (${Object.values(fotos.modelos).map(m => m.nombre).join('; ')}), retocadas por RWAdar y sin rotulos; si una ficha no tiene foto, dibujo vectorial propio`,
  fotosReales: 'Desde el 22/11/2026, una ficha puede llevar en su lugar una foto real con licencia libre de Wikimedia Commons (origen "foto", foto-<slug>.webp): su texto alternativo es lo que se ve, queMuestra dice si es el activo, su lugar o su tema y credito lleva autor, licencia y pagina del archivo, que la web y la app enseñan en el pie',
  modo: entradas.some(e => e.origen === 'foto') ? 'generacion-propia-y-fotos-con-licencia-libre-de-wikimedia-commons' : 'generacion-sin-imagenes-de-terceros',
  usoPrevisto: 'Una ilustracion por ficha que explica la inversion de un vistazo; si falta, se usa la de su categoria',
  direccionVisual: 'Foto generica del activo, parecida al real segun su fuente oficial, sin marcas, rotulos ni personas, y limpia: el lugar y los tres pasos van como texto en la ficha',
  encargos: 'rwadar-editorial-source/ofertas/fotos.json (modelo, descripcion, semilla y encuadre de cada foto)',
  comoSeRegenera: 'python rwadar-editorial-source/ofertas/fotografiar.py (fotos) y node rwadar-editorial-source/ofertas/generar.mjs (retoque)',
};
manifiesto.fichas = entradas;
fs.writeFileSync(MANIFIESTO, JSON.stringify(manifiesto, null, 2) + '\n');

const web = Object.fromEntries(entradas.map(e => [e.slug, { src: `/ofertas-editoriales/${e.archivo}`, alt: e.alt, categoria: e.categoria, ...(e.lugar ? { lugar: e.lugar } : {}),
  // De una foto real, lo que necesita el pie (lib/fotos-ofertas.js): la web no inventa nada.
  ...(e.origen === 'foto' ? { origen: 'foto', queMuestra: e.queMuestra, ...(e.lugarOTema ? { lugarOTema: e.lugarOTema } : {}),
    ...(e.lugarOTemaEn ? { lugarOTemaEn: e.lugarOTemaEn } : {}), credito: e.credito } : {}) }]));
let js = fs.readFileSync(JS_WEB, 'utf8');
js = reemplazarBloque(js, '/* fichas-editoriales:inicio', '/* fichas-editoriales:fin */',
  `const EDITORIAL_OFERTA_POR_SLUG=Object.freeze(${JSON.stringify(web).replace(/</g, '\\u003c')});\n${modeloFotosWeb()}`, 'el JS de la web');
fs.writeFileSync(JS_WEB, js);

let app = fs.readFileSync(FIXTURE_APP, 'utf8');
app = reemplazarBloque(app, '// fichas-editoriales:inicio', '// fichas-editoriales:fin',
  `const FUENTES_POR_FICHA = Object.freeze({\n${entradas.map(e => `  '${e.archivo}': require('../assets/ofertas-editoriales/${e.archivo}'),`).join('\n')}\n});\n`, 'el fixture de la app');
fs.writeFileSync(FIXTURE_APP, app);

// La misma comprobación que harán el publicador y el servidor local.
const activos = cargarActivosEditoriales(RAIZ);
console.log(`${activos.fichas.length} ilustraciones por ficha; ${entradas.reduce((a, e) => a + e.bytes, 0)} bytes en total`);

if (HOJA) {
  const cols = 4, filas = Math.ceil(miniaturas.length / cols);
  await sharp({ create: { width: cols * 650 - 10, height: filas * 450 - 10, channels: 3, background: '#444' } })
    .composite(miniaturas.map((m, i) => ({ input: m, left: (i % cols) * 650, top: Math.floor(i / cols) * 450 })))
    .png().toFile(HOJA);
  console.log(`hoja de contactos: ${HOJA}`);
}
