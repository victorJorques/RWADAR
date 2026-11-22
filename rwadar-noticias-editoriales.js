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

   Fotos reales (22/11/2026, «cúrrate más las fotos, que sean reales»): la
   biblioteca (versionEsquema 2) admite, junto a las escenas de IA de antes
   (que no se tocan), fotos de Wikimedia Commons con licencia libre, con
   «origen»: "foto", su «descripcion» (lo que se ve: el texto alternativo),
   su «fuente» (archivo, página y original descargado con su sha256), su
   «licencia» (de la lista cerrada LICENCIAS_FOTO del modelo), su «autor» si
   la licencia obliga a nombrarlo y «sinPersonas». Las trae
   rwadar-editorial-source/noticias/importar-foto.py. Su crédito no va en las
   noticias (la app instalada rechazaría una clave nueva): va en
   rwadar-site/datos/fotos-noticias.json, que se genera de fotos.json con
   --creditos y que --comprobar y el publicador exigen al día.

     node rwadar-noticias-editoriales.js --comprobar
     node rwadar-noticias-editoriales.js --creditos   (escribe fotos-noticias.json)
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
const modeloNoticias = require('./rwadar-movil/lib/noticias-sector');
const CATEGORIAS = Object.keys(modeloNoticias.CATEGORIAS);
// La línea de debajo de las noticias cuando todas las fotos son de IA (la de
// cada edición la elige modeloNoticias.notaFotos según las fotos que se ven).
const PIE_OBLIGATORIO = modeloNoticias.NOTAS_FOTOS.ia.es;
const CREDITOS_RELATIVO = 'rwadar-site/datos/fotos-noticias.json';
const CAMPOS_IA = Object.freeze(['modelo', 'licencia', 'concepto', 'prompt', 'semilla', 'encuadre', 'retoque', 'bytes', 'sha256', 'temas', 'variantes']);
const CAMPOS_FOTO = Object.freeze(['origen', 'descripcion', 'fuente', 'licencia', 'autor', 'sinPersonas', 'encuadre', 'bytes', 'sha256', 'temas', 'variantes']);
const ENCUADRE = /^(?:100|[1-9]?\d)% (?:100|[1-9]?\d)%$/;
const textoLlano = (v, max) => typeof v === 'string' && v.trim() === v && v.length > 0 && [...v].length <= max && !/[<>\u0000-\u001f\u007f]/.test(v);

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

/* Una entrada de la biblioteca: una escena de IA (modelo, licencia, prompt y
   concepto, como siempre) o, con el esquema 2, una foto real de Wikimedia
   Commons con todo lo que pide su licencia. Nada de campos de la otra clase. */
function comprobarEntrada(clave, f, manifiesto) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) throw new Error(`fotos.json: «${clave}» no es un objeto`);
  if (f.origen === undefined) {
    if (!Object.hasOwn(manifiesto.modelos, f.modelo) || typeof f.licencia !== 'string' || !f.licencia.trim() ||
        typeof f.prompt !== 'string' || !f.prompt.trim() || typeof f.concepto !== 'string' || !f.concepto.trim()) {
      throw new Error(`fotos.json: «${clave}» sin modelo, licencia, prompt o concepto`);
    }
    const otras = Object.keys(f).filter(k => !CAMPOS_IA.includes(k));
    if (otras.length) throw new Error(`fotos.json: «${clave}» (IA) con campos que no son suyos: ${otras.join(', ')}`);
    return;
  }
  if (f.origen !== 'foto') throw new Error(`fotos.json: «${clave}» con un origen desconocido (solo "foto", o ninguno para las de IA)`);
  if (manifiesto.versionEsquema < 2) throw new Error(`fotos.json: «${clave}» es una foto real y el esquema 1 no las admite`);
  if (modeloNoticias.FOTOS_IA.includes(clave)) throw new Error(`fotos.json: «${clave}» se publicó como ilustración de IA: una foto real va con otra clave`);
  const sobran = Object.keys(f).filter(k => !CAMPOS_FOTO.includes(k));
  if (sobran.length) throw new Error(`fotos.json: la foto real «${clave}» no lleva ${sobran.join(', ')} (eso es de las de IA o no es de la biblioteca)`);
  const falta = CAMPOS_FOTO.filter(k => !Object.hasOwn(f, k));
  if (falta.length) throw new Error(`fotos.json: a la foto real «${clave}» le falta ${falta.join(', ')}`);
  comprobarFotoReal(clave, f);
}

/* Lo común a toda foto real de Wikimedia Commons, de las noticias y de las
   ofertas (rwadar-editorial-source/ofertas/generar.mjs la usa también):
   descripción llana, fuente de Commons, licencia de la lista cerrada, autor si
   la licencia lo pide, sin personas reconocibles y encuadre. Lanza si no. */
function comprobarFotoReal(clave, f, donde = 'fotos.json') {
  if (!textoLlano(f.descripcion, 200) || [...f.descripcion].length < 10) {
    throw new Error(`${donde}: «${clave}»: la «descripcion» dice lo que se ve, en llano (de 10 a 200 caracteres, sin < ni >)`);
  }
  const fu = f.fuente;
  if (!fu || typeof fu !== 'object' || Object.keys(fu).sort().join() !== 'archivo,original,pagina,sha256Original,sitio' ||
      fu.sitio !== modeloNoticias.SITIO_FOTOS || !textoLlano(fu.archivo, 240) || !/^File:./.test(fu.archivo) ||
      !modeloNoticias.PAGINA_COMMONS.test(fu.pagina || '') ||
      !/^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/[^\s"'<>\\]+$/.test(fu.original || '') || !/^[a-f0-9]{64}$/.test(fu.sha256Original || '')) {
    throw new Error(`${donde}: «${clave}»: la «fuente» es { sitio: "Wikimedia Commons", archivo: "File:…", pagina (https://commons.wikimedia.org/wiki/File:…), original (https://upload.wikimedia.org/… o https://thumb.wikimedia.org/…), sha256Original }`);
  }
  const lic = f.licencia, admitida = lic && typeof lic === 'object' && Object.hasOwn(modeloNoticias.LICENCIAS_FOTO, lic.nombre)
    ? modeloNoticias.LICENCIAS_FOTO[lic.nombre] : null;
  if (!admitida || Object.keys(lic).sort().join() !== 'atribucionObligatoria,nombre,url' || lic.url !== admitida.url ||
      lic.atribucionObligatoria !== admitida.atribucion) {
    throw new Error(`${donde}: «${clave}»: licencia no admitida o mal escrita (solo ${Object.keys(modeloNoticias.LICENCIAS_FOTO).join(', ')}, con su url y su atribucionObligatoria)`);
  }
  if (lic.atribucionObligatoria ? !textoLlano(f.autor, 200) : f.autor !== null) {
    throw new Error(`${donde}: «${clave}»: ${lic.atribucionObligatoria ? 'la licencia obliga a nombrar al autor («autor», sin HTML)' : '«autor» va en null (dominio público o CC0)'}`);
  }
  if (f.sinPersonas !== true) throw new Error(`${donde}: «${clave}»: sin personas reconocibles («sinPersonas»: true)`);
  if (typeof f.encuadre !== 'string' || !ENCUADRE.test(f.encuadre)) throw new Error(`${donde}: «${clave}»: «encuadre» es «x% y%»`);
}

/* El archivo de créditos (rwadar-site/datos/fotos-noticias.json): de cada
   clave, su origen y, si es una foto real, lo que se enseña (descripción,
   autor si la licencia lo pide, licencia y enlace a la página del archivo).
   Puro: la misma biblioteca da los mismos bytes. */
function creditosDesdeManifiesto(manifiesto) {
  const fotos = {};
  for (const [clave, f] of Object.entries(manifiesto.fotos)) {
    if (f.origen !== 'foto') { fotos[clave] = { origen: 'ia' }; continue; }
    fotos[clave] = { origen: 'foto', descripcion: f.descripcion, autor: f.licencia.atribucionObligatoria ? f.autor : null,
      licencia: f.licencia.nombre, licenciaUrl: f.licencia.url, sitio: f.fuente.sitio, pagina: f.fuente.pagina };
  }
  const datos = { version: 1,
    nota: 'Origen y crédito de cada foto de las noticias. Se genera de rwadar-editorial-source/noticias/fotos.json con node rwadar-noticias-editoriales.js --creditos: no se edita a mano.',
    fotos };
  modeloNoticias.validarCreditosFotos(datos);
  return JSON.stringify(datos, null, 1) + '\n';
}
function rutaCreditos(raiz = __dirname) { return path.join(path.resolve(raiz), ...CREDITOS_RELATIVO.split('/')); }
/* ¿Está fotos-noticias.json al día con fotos.json? Lanza si no. */
function comprobarCreditos(raiz = __dirname, manifiesto = cargarFotosNoticias(raiz, { claves: [] }).manifiesto) {
  const ruta = rutaCreditos(raiz);
  if (!fs.existsSync(ruta)) throw new Error(`falta ${CREDITOS_RELATIVO} (ejecuta node rwadar-noticias-editoriales.js --creditos)`);
  regular(ruta, CREDITOS_RELATIVO);
  if (fs.readFileSync(ruta, 'utf8') !== creditosDesdeManifiesto(manifiesto)) {
    throw new Error(`${CREDITOS_RELATIVO} no está al día con fotos.json (ejecuta node rwadar-noticias-editoriales.js --creditos)`);
  }
  return ruta;
}
function escribirCreditos(raiz = __dirname) {
  const { manifiesto } = cargarFotosNoticias(raiz, { claves: [] });
  fs.writeFileSync(rutaCreditos(raiz), creditosDesdeManifiesto(manifiesto), 'utf8');
  return rutaCreditos(raiz);
}

/* El título de Commons como lo guarda Commons: «_» es un espacio, sin
   espacios repetidos y la primera letra en mayúscula (como importar-foto.py). */
function tituloCommons(archivo) {
  const resto = String(archivo).replace(/^File:/, '').replace(/[\s_]+/g, ' ').trim();
  return `File:${resto.charAt(0).toUpperCase()}${resto.slice(1)}`;
}

/* El interruptor de las fotos reales (22/11/2026). La app instalada antes de
   la OTA con los créditos pone «Imágenes ilustrativas generadas con IA» y no
   enseña autor ni licencia: una foto real CC BY o CC BY-SA saldría como de IA
   y sin su crédito. Por eso ninguna noticia publicada usa una foto real
   mientras «fotos.realesEnApp» no sea true en
   .claude/skills/noticias-automaticas/config.json; se pone a true, en un PR
   aparte, después de enviar esa OTA. Lo exigen el publicador, --comprobar y
   la regla V-2 de las noticias automáticas. Lanza si alguna clave real se usa
   con el interruptor apagado. */
const CONFIG_NOTICIAS_RELATIVO = '.claude/skills/noticias-automaticas/config.json';
function fotosRealesEnApp(raiz = __dirname) {
  const ruta = path.join(path.resolve(raiz), ...CONFIG_NOTICIAS_RELATIVO.split('/'));
  if (!fs.existsSync(ruta)) return false;
  const v = JSON.parse(fs.readFileSync(ruta, 'utf8'))?.fotos?.realesEnApp;
  if (v !== undefined && typeof v !== 'boolean') throw new Error(`${CONFIG_NOTICIAS_RELATIVO}: «fotos.realesEnApp» es true o false`);
  return v === true;
}
function comprobarFotosRealesEnApp(manifiesto, claves, realesEnApp) {
  const reales = [...new Set(claves)].filter(c => manifiesto.fotos[c]?.origen === 'foto');
  if (reales.length && realesEnApp !== true) {
    throw new Error(`las noticias usan fotos reales (${reales.join(', ')}) y la app instalada aún no enseña su crédito: ` +
      `hasta enviar la OTA con los créditos y poner «fotos.realesEnApp»: true en ${CONFIG_NOTICIAS_RELATIVO}, solo fotos de IA`);
  }
  return reales;
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
  // Esquema 1: solo escenas de IA. Esquema 2 (22/11/2026): también fotos reales.
  if (!manifiesto || ![1, 2].includes(manifiesto.versionEsquema) || !manifiesto.fotos || typeof manifiesto.fotos !== 'object' ||
      !manifiesto.modelos || typeof manifiesto.modelos !== 'object') {
    throw new Error('fotos.json no cumple el esquema 1 ni el 2');
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
  // El mismo archivo de Commons no entra dos veces (ni escrito de otro modo, ni con los mismos bytes).
  const archivosVistos = new Map(), originalesVistos = new Map();
  for (const [clave, f] of Object.entries(manifiesto.fotos)) {
    if (!CLAVE.test(clave)) throw new Error(`clave de foto no válida: ${clave}`);
    comprobarEntrada(clave, f, manifiesto);
    if (f.origen === 'foto') {
      const archivo = tituloCommons(f.fuente.archivo);
      if (archivosVistos.has(archivo)) throw new Error(`fotos.json: «${clave}» y «${archivosVistos.get(archivo)}» son el mismo archivo de Commons (${archivo})`);
      if (originalesVistos.has(f.fuente.sha256Original)) throw new Error(`fotos.json: «${clave}» y «${originalesVistos.get(f.fuente.sha256Original)}» son la misma imagen (mismo sha256Original)`);
      archivosVistos.set(archivo, clave);
      originalesVistos.set(f.fuente.sha256Original, clave);
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

module.exports = { comprobarFotoReal, DIRECTORIO_RELATIVO, RUTA_PUBLICA_BASE, CREDITOS_RELATIVO, CONFIG_NOTICIAS_RELATIVO, ANCHO, ALTO, BYTES_MAX, VARIANTES, PIE_OBLIGATORIO, clavesUsadas,
  cargarFotosNoticias, creditosDesdeManifiesto, comprobarCreditos, escribirCreditos, tituloCommons, fotosRealesEnApp, comprobarFotosRealesEnApp };

if (require.main === module) {
  try {
    if (process.argv.includes('--creditos')) {
      const ruta = escribirCreditos(__dirname);
      console.log(`Créditos de las fotos escritos en ${path.relative(__dirname, ruta)}.`);
    } else {
      const r = cargarFotosNoticias(__dirname);
      comprobarCreditos(__dirname, r.manifiesto);
      comprobarFotosRealesEnApp(r.manifiesto, clavesUsadas(__dirname), fotosRealesEnApp(__dirname));
      const reales = Object.values(r.manifiesto.fotos).filter(f => f.origen === 'foto').length;
      console.log(`Fotos de las noticias: ${r.fotos.length} en la biblioteca (${reales} ${reales === 1 ? 'real' : 'reales'} de Wikimedia Commons y ${r.fotos.length - reales} generadas con IA; con ${r.variantes.length} variantes de 480 y 960) y ${Object.keys(r.manifiesto.temas).length} temas; las ${clavesUsadas(__dirname).length} que usan las noticias y ${CREDITOS_RELATIVO}, al día.`);
    }
  } catch (e) {
    console.error(`FOTOS DE LAS NOTICIAS: ${e.message}`);
    process.exitCode = 1;
  }
}
