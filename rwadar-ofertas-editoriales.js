'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DIRECTORIO_RELATIVO = 'rwadar-movil/assets/ofertas-editoriales';
const RUTA_PUBLICA_BASE = 'ofertas-editoriales';
/* Obligatoria al principio del texto alternativo. Ni la web (03/11/2026) ni la
   app (04/11/2026) la pintan encima de la imagen: la honestidad va en el alt y
   en el pie visible bajo la lista, el carrusel y el detalle, que también exige
   el manifiesto («pieVisibleObligatorio»). */
const ETIQUETA_OBLIGATORIA = 'Ilustración editorial';
const PIE_OBLIGATORIO = 'Imágenes ilustrativas, no fotos del activo';
const CATEGORIAS_OBLIGATORIAS = Object.freeze([
  'Inmobiliario',
  'Tesoro y fondos',
  'Materias primas',
  'Acciones y capital privado',
]);
/* Contrato v2 (19/10/2026): además de las cuatro ilustraciones por categoría,
   que siguen siendo la caída, cada ficha puede tener la suya
   («oferta-<slug>.webp»), generada con rwadar-editorial-source/ofertas. */
const CATEGORIAS_FICHA = Object.freeze([
  ...CATEGORIAS_OBLIGATORIAS,
  'Crédito privado',
  'Infraestructura',
]);
const FICHA_ANCHO = 960;
const FICHA_ALTO = 660;
const FICHA_BYTES_MAX = 200 * 1024;
/* Ni cifras ni promesas en lo que la imagen dice o en su texto alternativo. */
const TEXTO_PROHIBIDO = /[0-9%€$£]|rentab|garantiz|benefici|gananci|retorno|asegurad|sin riesgo/i;

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function dentroDe(base, destino) {
  const raiz = path.resolve(base);
  const archivo = path.resolve(destino);
  return archivo === raiz || archivo.startsWith(raiz + path.sep);
}

function dimensionesWebp(bytes) {
  if (bytes.length < 30 || bytes.toString('ascii', 0, 4) !== 'RIFF' ||
      bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('el archivo no es un WebP RIFF válido');
  }
  const tipo = bytes.toString('ascii', 12, 16);
  const inicio = 20;
  if (tipo === 'VP8X') {
    return {
      ancho: 1 + bytes.readUIntLE(inicio + 4, 3),
      alto: 1 + bytes.readUIntLE(inicio + 7, 3),
    };
  }
  if (tipo === 'VP8 ') {
    if (bytes.toString('hex', inicio + 3, inicio + 6) !== '9d012a') {
      throw new Error('cabecera VP8 no válida');
    }
    return {
      ancho: bytes.readUInt16LE(inicio + 6) & 0x3fff,
      alto: bytes.readUInt16LE(inicio + 8) & 0x3fff,
    };
  }
  if (tipo === 'VP8L') {
    if (bytes[inicio] !== 0x2f) throw new Error('cabecera VP8L no válida');
    const bits = bytes.readUInt32LE(inicio + 1);
    return { ancho: (bits & 0x3fff) + 1, alto: ((bits >>> 14) & 0x3fff) + 1 };
  }
  throw new Error(`tipo WebP no reconocido: ${tipo}`);
}

function archivoRegularSinEnlace(ruta, descripcion) {
  const estado = fs.lstatSync(ruta);
  if (estado.isSymbolicLink() || !estado.isFile()) {
    throw new Error(`${descripcion} debe ser un archivo regular`);
  }
  return estado;
}

function cargarActivosEditoriales(raiz = __dirname) {
  const baseProyecto = path.resolve(raiz);
  const directorio = path.resolve(baseProyecto, ...DIRECTORIO_RELATIVO.split('/'));
  if (!dentroDe(baseProyecto, directorio)) throw new Error('directorio editorial fuera del proyecto');
  const manifiestoRuta = path.join(directorio, 'manifest.json');
  archivoRegularSinEnlace(manifiestoRuta, 'manifest.json editorial');

  let manifiesto;
  try { manifiesto = JSON.parse(fs.readFileSync(manifiestoRuta, 'utf8')); }
  catch (error) { throw new Error(`manifest.json editorial no es JSON válido: ${error.message}`); }

  if (!manifiesto || manifiesto.versionEsquema !== 2 ||
      manifiesto.etiquetaVisibleObligatoria !== ETIQUETA_OBLIGATORIA ||
      manifiesto.pieVisibleObligatorio !== PIE_OBLIGATORIO ||
      !Array.isArray(manifiesto.archivos) || manifiesto.archivos.length !== 4 ||
      !Array.isArray(manifiesto.fichas)) {
    throw new Error('manifest.json editorial no cumple el contrato v2');
  }

  const categorias = new Set();
  const nombres = new Set();
  const archivos = [];
  for (const entrada of manifiesto.archivos) {
    if (!entrada || !CATEGORIAS_OBLIGATORIAS.includes(entrada.categoria) ||
        categorias.has(entrada.categoria)) {
      throw new Error(`categoría editorial no permitida o duplicada: ${entrada?.categoria || ''}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(entrada.archivo || '') ||
        nombres.has(entrada.archivo)) {
      throw new Error(`nombre editorial no permitido o duplicado: ${entrada.archivo || ''}`);
    }
    if (entrada.ancho !== 640 || entrada.alto !== 440 ||
        !Number.isInteger(entrada.bytes) || entrada.bytes <= 1024 ||
        !/^[a-f0-9]{64}$/.test(entrada.hashSha256 || '') ||
        typeof entrada.alt !== 'string' || !entrada.alt.startsWith(`${ETIQUETA_OBLIGATORIA} `)) {
      throw new Error(`metadatos editoriales no válidos: ${entrada.archivo}`);
    }

    const origen = path.resolve(directorio, entrada.archivo);
    if (!dentroDe(directorio, origen)) throw new Error(`ruta editorial fuera del directorio: ${entrada.archivo}`);
    const estado = archivoRegularSinEnlace(origen, entrada.archivo);
    const bytes = fs.readFileSync(origen);
    const dimensiones = dimensionesWebp(bytes);
    if (estado.size !== entrada.bytes || bytes.length !== entrada.bytes ||
        sha256(bytes) !== entrada.hashSha256 ||
        dimensiones.ancho !== entrada.ancho || dimensiones.alto !== entrada.alto) {
      throw new Error(`bytes, hash o dimensiones no coinciden para ${entrada.archivo}`);
    }

    categorias.add(entrada.categoria);
    nombres.add(entrada.archivo);
    archivos.push(Object.freeze({
      categoria: entrada.categoria,
      archivo: entrada.archivo,
      alt: entrada.alt,
      hashSha256: entrada.hashSha256,
      bytes: entrada.bytes,
      origen,
      salida: `${RUTA_PUBLICA_BASE}/${entrada.archivo}`,
    }));
  }

  if (CATEGORIAS_OBLIGATORIAS.some(categoria => !categorias.has(categoria))) {
    throw new Error('el manifiesto editorial no cubre las cuatro categorías esperadas');
  }

  const slugs = new Set();
  const fichas = [];
  for (const entrada of manifiesto.fichas) {
    const slug = entrada && entrada.slug;
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug) ||
        !CATEGORIAS_FICHA.includes(entrada.categoria) || entrada.archivo !== `oferta-${slug}.webp` ||
        nombres.has(entrada.archivo)) {
      throw new Error(`ficha editorial no permitida o duplicada: ${slug || ''}`);
    }
    const pasos = entrada.pasos;
    if (entrada.ancho !== FICHA_ANCHO || entrada.alto !== FICHA_ALTO ||
        !Number.isInteger(entrada.bytes) || entrada.bytes <= 1024 || entrada.bytes > FICHA_BYTES_MAX ||
        !/^[a-f0-9]{64}$/.test(entrada.hashSha256 || '') ||
        typeof entrada.alt !== 'string' || !entrada.alt.startsWith(`${ETIQUETA_OBLIGATORIA} `) ||
        TEXTO_PROHIBIDO.test(entrada.alt) ||
        !Array.isArray(pasos) || pasos.length !== 3 ||
        pasos.some(paso => typeof paso !== 'string' || !paso.trim() || paso.length > 32 || TEXTO_PROHIBIDO.test(paso)) ||
        (entrada.lugar !== undefined && (typeof entrada.lugar !== 'string' || TEXTO_PROHIBIDO.test(entrada.lugar))) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entrada.revisadoEl || '')) {
      throw new Error(`metadatos editoriales no válidos: ${entrada.archivo}`);
    }
    const origen = path.resolve(directorio, entrada.archivo);
    if (!dentroDe(directorio, origen)) throw new Error(`ruta editorial fuera del directorio: ${entrada.archivo}`);
    const estado = archivoRegularSinEnlace(origen, entrada.archivo);
    const bytes = fs.readFileSync(origen);
    const dimensiones = dimensionesWebp(bytes);
    if (estado.size !== entrada.bytes || bytes.length !== entrada.bytes ||
        sha256(bytes) !== entrada.hashSha256 ||
        dimensiones.ancho !== entrada.ancho || dimensiones.alto !== entrada.alto) {
      throw new Error(`bytes, hash o dimensiones no coinciden para ${entrada.archivo}`);
    }
    slugs.add(slug);
    nombres.add(entrada.archivo);
    fichas.push(Object.freeze({
      slug,
      categoria: entrada.categoria,
      archivo: entrada.archivo,
      alt: entrada.alt,
      hashSha256: entrada.hashSha256,
      bytes: entrada.bytes,
      origen,
      salida: `${RUTA_PUBLICA_BASE}/${entrada.archivo}`,
    }));
  }
  const permitidos = new Set(['manifest.json', ...nombres]);
  const encontrados = fs.readdirSync(directorio, { withFileTypes: true });
  const desconocidos = encontrados.filter(entrada =>
    !entrada.isFile() || entrada.isSymbolicLink() || !permitidos.has(entrada.name));
  if (desconocidos.length || encontrados.length !== permitidos.size) {
    throw new Error(`archivo no permitido en ofertas-editoriales: ${desconocidos.map(x => x.name).join(', ')}`);
  }

  const manifiestoBytes = fs.readFileSync(manifiestoRuta);
  return Object.freeze({
    manifiesto: Object.freeze(manifiesto),
    manifiestoRuta,
    manifiestoSha256: sha256(manifiestoBytes),
    etiqueta: ETIQUETA_OBLIGATORIA,
    archivos: Object.freeze(archivos),
    fichas: Object.freeze(fichas),
    publicables: Object.freeze([
      Object.freeze({
        origen: manifiestoRuta,
        salida: `${RUTA_PUBLICA_BASE}/manifest.json`,
        bytes: manifiestoBytes.length,
        hashSha256: sha256(manifiestoBytes),
      }),
      ...archivos,
      ...fichas,
    ]),
  });
}

module.exports = {
  CATEGORIAS_FICHA,
  CATEGORIAS_OBLIGATORIAS,
  FICHA_ALTO,
  FICHA_ANCHO,
  FICHA_BYTES_MAX,
  TEXTO_PROHIBIDO,
  DIRECTORIO_RELATIVO,
  ETIQUETA_OBLIGATORIA,
  RUTA_PUBLICA_BASE,
  cargarActivosEditoriales,
  dimensionesWebp,
};
