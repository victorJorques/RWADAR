'use strict';
/* =====================================================================
   RWAdar · fotos editoriales de las noticias (rediseño de Inicio, 10/11/2026)
   ---------------------------------------------------------------------
   La biblioteca está en rwadar-editorial-source/noticias/: fotos.json (por
   clave: modelo, licencia, prompt, semilla, encuadre, concepto, bytes y
   sha256) y fotos/<clave>.webp (1200 × 800, WebP, como mucho 160 kB). Cada
   noticia de rwadar-site/datos/noticias-v2.json elige una en su campo «imagen».

   rwadar-publicar.js las copia una a una a /noticias-editoriales/<clave>.webp,
   como /ofertas-editoriales/; la app las carga de
   https://rwadar.pages.dev/noticias-editoriales/<clave>.webp. Aquí se
   comprueba todo antes: que cada clave usada exista, que el archivo sea un
   WebP regular (sin enlaces) del tamaño declarado y que sus bytes y su
   sha256 coincidan con fotos.json. Una foto que no cuadra para la
   publicación: mejor eso que una tarjeta sin foto o una foto cambiada sin
   revisar.

   Variantes (noticias que entran por los ojos, 14/11/2026): de cada foto,
   fotos/480/<clave>.webp (480 × 320) y fotos/960/<clave>.webp (960 × 640),
   del mismo recorte, publicadas en /noticias-editoriales/480/ y /960/ para
   que cada pantalla baje la que necesita (srcset en la web; la app elige en
   JS). Mismas reglas: archivo regular, WebP del tamaño exacto, bytes y
   sha256 de fotos.json, y nada en esas carpetas que no sea de la biblioteca.
   Cada foto dice qué temas cubre («temas», de la lista cerrada de fotos.json)
   y cada tema tiene al menos una; «genericas» da una foto publicada para cada
   categoría de noticia, por si ningún tema encaja.

     node rwadar-noticias-editoriales.js --comprobar
   ===================================================================== */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { dimensionesWebp } = require('./rwadar-ofertas-editoriales');

const DIRECTORIO_RELATIVO = 'rwadar-editorial-source/noticias';
const RUTA_PUBLICA_BASE = 'noticias-editoriales';
const CLAVE = /^[a-z0-9-]+$/;
const ANCHO = 1200, ALTO = 800, BYTES_MAX = 160000;
// Las variantes y lo que puede pesar cada una (la de 1200 sigue donde estaba).
const VARIANTES = Object.freeze({ 480: Object.freeze({ alto: 320, maxBytes: 60000 }), 960: Object.freeze({ alto: 640, maxBytes: 120000 }) });
const CATEGORIAS = Object.keys(require('./rwadar-movil/lib/noticias-sector').CATEGORIAS);
const PIE_OBLIGATORIO = 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.';

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function dentroDe(base, destino) {
  const raiz = path.resolve(base), archivo = path.resolve(destino);
  return archivo === raiz || archivo.startsWith(raiz + path.sep);
}
function regular(ruta, descripcion) {
  const estado = fs.lstatSync(ruta);
  if (estado.isSymbolicLink() || !estado.isFile()) throw new Error(`${descripcion} debe ser un archivo regular`);
  return estado;
}

/* Las claves que usan las noticias publicadas (sin validar el resto: eso lo
   hace rwadar-movil/lib/noticias-sector.js). */
function clavesUsadas(raiz) {
  const datos = JSON.parse(fs.readFileSync(path.join(raiz, 'rwadar-site', 'datos', 'noticias-v2.json'), 'utf8'));
  const lista = Array.isArray(datos.noticias) ? datos.noticias : [];
  return [...new Set(lista.map(n => n && n.imagen).filter(v => typeof v === 'string'))];
}

function cargarFotosNoticias(raiz = __dirname, { claves = clavesUsadas(raiz) } = {}) {
  const base = path.resolve(raiz);
  const directorio = path.resolve(base, ...DIRECTORIO_RELATIVO.split('/'));
  if (!dentroDe(base, directorio)) throw new Error('directorio de fotos fuera del proyecto');
  const manifiestoRuta = path.join(directorio, 'fotos.json');
  regular(manifiestoRuta, 'fotos.json');
  let manifiesto;
  try { manifiesto = JSON.parse(fs.readFileSync(manifiestoRuta, 'utf8')); }
  catch (e) { throw new Error(`fotos.json no es JSON válido: ${e.message}`); }
  if (!manifiesto || manifiesto.versionEsquema !== 1 || !manifiesto.fotos || typeof manifiesto.fotos !== 'object' ||
      !manifiesto.modelos || typeof manifiesto.modelos !== 'object') {
    throw new Error('fotos.json no cumple el esquema 1');
  }
  const salida = manifiesto.salida || {};
  if (salida.ancho !== ANCHO || salida.alto !== ALTO || salida.maxBytes !== BYTES_MAX) {
    throw new Error(`fotos.json: la salida debe ser ${ANCHO}×${ALTO} y ${BYTES_MAX} bytes como mucho`);
  }
  for (const clave of claves) {
    if (!CLAVE.test(clave) || !Object.hasOwn(manifiesto.fotos, clave)) throw new Error(`la noticia usa la foto «${clave}», que no está en fotos.json`);
  }
  const variantes = salida.variantes;
  if (!variantes || typeof variantes !== 'object' || Object.keys(variantes).sort().join() !== Object.keys(VARIANTES).sort().join() ||
      Object.entries(VARIANTES).some(([w, v]) => variantes[w]?.alto !== v.alto || variantes[w]?.maxBytes !== v.maxBytes)) {
    throw new Error('fotos.json: «salida.variantes» debe ser 480 × 320 (60 kB como mucho) y 960 × 640 (120 kB como mucho)');
  }
  const temas = manifiesto.temas;
  if (!temas || typeof temas !== 'object' || Array.isArray(temas) || !Object.keys(temas).length ||
      Object.entries(temas).some(([k, v]) => !CLAVE.test(k) || typeof v !== 'string' || !v.trim())) {
    throw new Error('fotos.json: falta la lista de «temas»');
  }
  const genericas = manifiesto.genericas;
  if (!genericas || typeof genericas !== 'object' || Object.keys(genericas).sort().join() !== [...CATEGORIAS].sort().join() ||
      Object.values(genericas).some(c => typeof c !== 'string' || !Object.hasOwn(manifiesto.fotos, c))) {
    throw new Error(`fotos.json: «genericas» debe dar una foto de la biblioteca para cada categoría (${CATEGORIAS.join(', ')})`);
  }
  const conFoto = new Set();
  const fotos = [], variantesPublicables = [];
  for (const [clave, f] of Object.entries(manifiesto.fotos)) {
    if (!CLAVE.test(clave)) throw new Error(`clave de foto no válida: ${clave}`);
    if (!f || !Object.hasOwn(manifiesto.modelos, f.modelo) || typeof f.licencia !== 'string' || !f.licencia.trim() ||
        typeof f.prompt !== 'string' || !f.prompt.trim() || typeof f.concepto !== 'string' || !f.concepto.trim()) {
      throw new Error(`fotos.json: «${clave}» sin modelo, licencia, prompt o concepto`);
    }
    if (!Number.isInteger(f.bytes) || f.bytes <= 1024 || f.bytes > BYTES_MAX || !/^[a-f0-9]{64}$/.test(f.sha256 || '')) {
      throw new Error(`fotos.json: «${clave}» sin bytes o sha256 (¿falta exportarla?)`);
    }
    const origen = path.resolve(directorio, 'fotos', `${clave}.webp`);
    if (!dentroDe(directorio, origen)) throw new Error(`ruta de foto fuera del directorio: ${clave}`);
    if (!fs.existsSync(origen)) throw new Error(`falta la foto ${DIRECTORIO_RELATIVO}/fotos/${clave}.webp`);
    const estado = regular(origen, `${clave}.webp`);
    const bytes = fs.readFileSync(origen);
    const { ancho, alto } = dimensionesWebp(bytes);
    if (estado.size !== f.bytes || bytes.length !== f.bytes || sha256(bytes) !== f.sha256 || ancho !== ANCHO || alto !== ALTO) {
      throw new Error(`bytes, sha256 o tamaño de ${clave}.webp no coinciden con fotos.json`);
    }
    if (!Array.isArray(f.temas) || !f.temas.length || f.temas.length > 3 || new Set(f.temas).size !== f.temas.length ||
        f.temas.some(t => !Object.hasOwn(temas, t))) {
      throw new Error(`fotos.json: «${clave}» debe cubrir de 1 a 3 temas de la lista`);
    }
    f.temas.forEach(t => conFoto.add(t));
    fotos.push(Object.freeze({ clave, origen, salida: `${RUTA_PUBLICA_BASE}/${clave}.webp`, bytes: f.bytes, hashSha256: f.sha256 }));
    if (!f.variantes || typeof f.variantes !== 'object' || Object.keys(f.variantes).sort().join() !== Object.keys(VARIANTES).sort().join()) {
      throw new Error(`fotos.json: «${clave}» sin sus variantes 480 y 960 (¿falta exportarla?)`);
    }
    for (const [w, v] of Object.entries(VARIANTES)) {
      const dato = f.variantes[w];
      if (!Number.isInteger(dato.bytes) || dato.bytes <= 1024 || dato.bytes > v.maxBytes || !/^[a-f0-9]{64}$/.test(dato.sha256 || '')) {
        throw new Error(`fotos.json: la variante ${w} de «${clave}» sin bytes o sha256, o pasa de ${v.maxBytes} bytes`);
      }
      const ruta = path.resolve(directorio, 'fotos', w, `${clave}.webp`);
      if (!dentroDe(directorio, ruta)) throw new Error(`ruta de foto fuera del directorio: ${w}/${clave}`);
      if (!fs.existsSync(ruta)) throw new Error(`falta la foto ${DIRECTORIO_RELATIVO}/fotos/${w}/${clave}.webp`);
      const est = regular(ruta, `${w}/${clave}.webp`);
      const b = fs.readFileSync(ruta);
      const dim = dimensionesWebp(b);
      if (est.size !== dato.bytes || b.length !== dato.bytes || sha256(b) !== dato.sha256 || dim.ancho !== Number(w) || dim.alto !== v.alto) {
        throw new Error(`bytes, sha256 o tamaño de ${w}/${clave}.webp no coinciden con fotos.json`);
      }
      variantesPublicables.push(Object.freeze({ clave, ancho: Number(w), origen: ruta, salida: `${RUTA_PUBLICA_BASE}/${w}/${clave}.webp`,
        bytes: dato.bytes, hashSha256: dato.sha256 }));
    }
  }
  const sinFoto = Object.keys(temas).filter(t => !conFoto.has(t));
  if (sinFoto.length) throw new Error(`fotos.json: temas sin ninguna foto: ${sinFoto.join(', ')}`);
  // En fotos/ solo las de la biblioteca y las carpetas de las variantes; en
  // cada carpeta, solo las de la biblioteca: nada que se publique sin estar en fotos.json.
  const dirFotos = path.join(directorio, 'fotos');
  const permitidas = new Set(fotos.map(f => `${f.clave}.webp`));
  const carpetas = new Set(Object.keys(VARIANTES));
  const sobran = fs.readdirSync(dirFotos, { withFileTypes: true }).filter(e => e.isSymbolicLink() ||
    (e.isDirectory() ? !carpetas.has(e.name) : !e.isFile() || !permitidas.has(e.name)));
  for (const w of carpetas) {
    const dir = path.join(dirFotos, w);
    if (fs.lstatSync(dir).isSymbolicLink()) continue;
    sobran.push(...fs.readdirSync(dir, { withFileTypes: true }).filter(e => !e.isFile() || e.isSymbolicLink() || !permitidas.has(e.name))
      .map(e => ({ name: `${w}/${e.name}` })));
  }
  if (sobran.length) throw new Error(`archivo no permitido en ${DIRECTORIO_RELATIVO}/fotos: ${sobran.map(e => e.name).join(', ')}`);
  return Object.freeze({ manifiesto: Object.freeze(manifiesto), fotos: Object.freeze(fotos), variantes: Object.freeze(variantesPublicables),
    publicables: Object.freeze([...fotos, ...variantesPublicables]) });
}

module.exports = { DIRECTORIO_RELATIVO, RUTA_PUBLICA_BASE, ANCHO, ALTO, BYTES_MAX, VARIANTES, PIE_OBLIGATORIO, clavesUsadas, cargarFotosNoticias };

if (require.main === module) {
  try {
    const r = cargarFotosNoticias(__dirname);
    console.log(`Fotos de las noticias: ${r.fotos.length} en la biblioteca (con ${r.variantes.length} variantes de 480 y 960) y ${Object.keys(r.manifiesto.temas).length} temas; las ${clavesUsadas(__dirname).length} que usan las noticias, al día.`);
  } catch (e) {
    console.error(`FOTOS DE LAS NOTICIAS: ${e.message}`);
    process.exitCode = 1;
  }
}
