(function () { 'use strict'; const module={exports:{}};
'use strict';
/* ---------------------------------------------------------------------
   «Noticias del sector» en Inicio (10/11/2026)
   ---------------------------------------------------------------------
   Un solo motor para la web (assets/noticias-sector-modelo-20261110.js, copia
   exacta hecha por rwadar-app/noticias/copiar-modelo-web.cjs), la app y el
   generador de la web (rwadar-publicar.js valida con él /datos/noticias.json
   antes de publicar). Sin dependencias, sin red y sin Intl (Hermes).

   Datos: rwadar-site/datos/noticias-v2.json, la selección verificada de
   cada ciclo de investigación. La web lo sirve en /datos/noticias-v2.json y
   la app lo lee de https://rwadar.pages.dev/datos/noticias-v2.json. Aquí no
   se escribe ninguna noticia: solo se comprueba la forma, se ordena (las de
   hoy primero) y se eligen los textos del idioma.

   Fotos (rediseño de Inicio, 10/11/2026): cada noticia lleva en «imagen» la
   clave de una foto editorial de la biblioteca (WebP: una escena generada
   con IA o, desde el 22/11/2026, una foto real con licencia libre de
   Wikimedia Commons), servida desde rwadar.pages.dev: nunca de terceros,
   que verían la IP de quien mira. Sustituyen a las ilustraciones SVG. Al
   leer, «imagen» es opcional (sin ella, la tarjeta queda con su fondo
   oscuro, como cuando la foto no carga); al publicar, rwadar-publicar.js la
   exige en todas. /datos/noticias.json sigue publicándose sin «imagen» para
   la app ya instalada (rwadar-app/noticias/noticias-v1.cjs).
   --------------------------------------------------------------------- */
const RUTA = '/datos/noticias-v2.json';
const URL_DATOS = 'https://rwadar.pages.dev/datos/noticias-v2.json';
const MAX_NOTICIAS = 24;
const SECCIONES = Object.freeze(['hoy', 'importante']);
const CATEGORIAS = Object.freeze({
  regulacion: Object.freeze({ es: 'Regulación', en: 'Regulation', color: '#9B8CFF' }),
  mercado: Object.freeze({ es: 'Mercado', en: 'Market', color: '#32C9F5' }),
  producto: Object.freeze({ es: 'Producto', en: 'Product', color: '#4FE0B0' }),
  riesgo: Object.freeze({ es: 'Riesgo', en: 'Risk', color: '#FF8A80' }),
});
const AMBITOS = Object.freeze({
  'España': Object.freeze({ es: 'España', en: 'Spain', color: '#F2B23C' }),
  'UE': Object.freeze({ es: 'UE', en: 'EU', color: '#5B8CFF' }),
  'Mundo': Object.freeze({ es: 'Mundo', en: 'World', color: '#8FD8FF' }),
});
const TIPOS_FUENTE = Object.freeze(['regulador', 'empresa', 'organismo', 'medio']);
const MAX = Object.freeze({ titulo: 80, resumen: 320, porQueImporta: 240, tituloInformativo: 140, nombre: 220, url: 400, nota: 400 });
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ---- Forma ---- */
const esObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function claves(obj, permitidas, obligatorias, donde) {
  if (!esObjeto(obj)) throw new Error(`${donde}: no es un objeto`);
  for (const k of Object.keys(obj)) if (!permitidas.includes(k)) throw new Error(`${donde}: forma inesperada («${k}»)`);
  for (const k of obligatorias) if (!Object.hasOwn(obj, k)) throw new Error(`${donde}: falta «${k}»`);
}
function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(valor + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
function fecha(valor, donde) {
  if (!fechaValida(valor)) throw new Error(`${donde}: fecha no válida`);
  return valor;
}
function texto(valor, donde, max) {
  if (typeof valor !== 'string' || !valor.trim()) throw new Error(`${donde}: falta el texto`);
  if (valor !== valor.trim()) throw new Error(`${donde}: espacios sobrantes`);
  if ([...valor].length > max) throw new Error(`${donde}: más de ${max} caracteres`);
  // Se pinta siempre como texto, pero un < o un > en una noticia es un error.
  if (/[<>\u0000-\u001f\u007f\u2028\u2029]/.test(valor)) throw new Error(`${donde}: caracteres no permitidos`);
  return valor;
}
function urlFuente(valor, donde) {
  texto(valor, donde, MAX.url);
  // Solo https, con servidor y sin usuario ni contraseña: el enlace sale de RWAdar.
  if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d{2,5})?(?:[/?#][^\s"'\\]*)?$/i.test(valor)) {
    throw new Error(`${donde}: el enlace no es https`);
  }
  return valor;
}
function validarNoticia(n, i, actualizadoEl) {
  const donde = `noticia ${i + 1}`;
  claves(n, ['id', 'fecha', 'seccion', 'categoria', 'ambito', 'titulo', 'resumen', 'porQueImporta', 'en', 'fuente', 'consultadaEl',
    'tituloInformativo', 'imagen'], ['id', 'fecha', 'seccion', 'categoria', 'ambito', 'titulo', 'resumen', 'porQueImporta', 'en', 'fuente', 'consultadaEl'],
    donde);
  if (typeof n.id !== 'string' || n.id.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.id)) throw new Error(`${donde}: id no válido`);
  const salida = { id: n.id };
  salida.fecha = fecha(n.fecha, `${donde}, fecha`);
  salida.consultadaEl = fecha(n.consultadaEl, `${donde}, consultadaEl`);
  if (salida.fecha > actualizadoEl || salida.consultadaEl > actualizadoEl) throw new Error(`${donde}: fecha posterior a la actualización`);
  if (salida.consultadaEl < salida.fecha) throw new Error(`${donde}: consultada antes de su fecha`);
  if (!SECCIONES.includes(n.seccion)) throw new Error(`${donde}: sección desconocida`);
  if (!Object.hasOwn(CATEGORIAS, n.categoria)) throw new Error(`${donde}: categoría desconocida`);
  if (!Object.hasOwn(AMBITOS, n.ambito)) throw new Error(`${donde}: ámbito desconocido`);
  salida.seccion = n.seccion; salida.categoria = n.categoria; salida.ambito = n.ambito;
  salida.titulo = texto(n.titulo, `${donde}, titulo`, MAX.titulo);
  salida.resumen = texto(n.resumen, `${donde}, resumen`, MAX.resumen);
  salida.porQueImporta = texto(n.porQueImporta, `${donde}, porQueImporta`, MAX.porQueImporta);
  if (n.tituloInformativo !== undefined) salida.tituloInformativo = texto(n.tituloInformativo, `${donde}, tituloInformativo`, MAX.tituloInformativo);
  claves(n.en, ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo'], ['titulo', 'resumen', 'porQueImporta'], `${donde}, en`);
  salida.en = {
    titulo: texto(n.en.titulo, `${donde}, en.titulo`, MAX.titulo),
    resumen: texto(n.en.resumen, `${donde}, en.resumen`, MAX.resumen),
    porQueImporta: texto(n.en.porQueImporta, `${donde}, en.porQueImporta`, MAX.porQueImporta),
  };
  if (n.en.tituloInformativo !== undefined) salida.en.tituloInformativo = texto(n.en.tituloInformativo, `${donde}, en.tituloInformativo`, MAX.tituloInformativo);
  claves(n.fuente, ['nombre', 'url', 'tipo'], ['nombre', 'url', 'tipo'], `${donde}, fuente`);
  if (!TIPOS_FUENTE.includes(n.fuente.tipo)) throw new Error(`${donde}: tipo de fuente desconocido`);
  salida.fuente = { nombre: texto(n.fuente.nombre, `${donde}, fuente.nombre`, MAX.nombre), url: urlFuente(n.fuente.url, `${donde}, fuente.url`), tipo: n.fuente.tipo };
  if (n.imagen !== undefined) salida.imagen = claveFoto(n.imagen, `${donde}, imagen`);
  return salida;
}

/* Comprueba el archivo entero y devuelve una copia limpia: las de hoy
   primero y, dentro de cada sección, de la más nueva a la más antigua (a
   igual fecha, en el orden del archivo). Lanza un error si algo no cuadra. */
function validarNoticias(datos) {
  claves(datos, ['version', 'actualizadoEl', 'nota', 'noticias'], ['version', 'actualizadoEl', 'noticias'], 'noticias.json');
  if (datos.version !== 1) throw new Error('noticias.json: versión desconocida');
  const actualizadoEl = fecha(datos.actualizadoEl, 'noticias.json, actualizadoEl');
  if (datos.nota !== undefined) texto(datos.nota, 'noticias.json, nota', MAX.nota);
  if (!Array.isArray(datos.noticias) || !datos.noticias.length || datos.noticias.length > MAX_NOTICIAS) {
    throw new Error(`noticias.json: entre 1 y ${MAX_NOTICIAS} noticias`);
  }
  const vistas = new Set();
  const noticias = datos.noticias.map((n, i) => {
    const limpia = validarNoticia(n, i, actualizadoEl);
    if (vistas.has(limpia.id)) throw new Error(`noticia ${i + 1}: id repetido`);
    vistas.add(limpia.id);
    return { limpia, i };
  }).sort((a, b) => (SECCIONES.indexOf(a.limpia.seccion) - SECCIONES.indexOf(b.limpia.seccion)) ||
    (a.limpia.fecha < b.limpia.fecha ? 1 : a.limpia.fecha > b.limpia.fecha ? -1 : 0) || a.i - b.i).map(x => x.limpia);
  return { version: 1, actualizadoEl, ...(datos.nota !== undefined ? { nota: datos.nota } : {}), noticias };
}
function noticiasValidas(datos) {
  try { validarNoticias(datos); return true; } catch { return false; }
}

/* ---- Textos del idioma elegido ---- */
function textos(n, idioma = 'es') {
  const en = idioma === 'en' && n.en ? n.en : null;
  return {
    titulo: en ? en.titulo : n.titulo,
    resumen: en ? en.resumen : n.resumen,
    porQueImporta: en ? en.porQueImporta : n.porQueImporta,
    tituloInformativo: (en ? en.tituloInformativo : n.tituloInformativo) || null,
  };
}
const etiquetaCategoria = (c, idioma = 'es') => CATEGORIAS[c]?.[idioma === 'en' ? 'en' : 'es'] || '';
const etiquetaAmbito = (a, idioma = 'es') => AMBITOS[a]?.[idioma === 'en' ? 'en' : 'es'] || '';
// «10/11/2026» o «10 Nov 2026».
function fechaCorta(iso, idioma = 'es') {
  if (!fechaValida(iso)) return '';
  const [a, m, d] = iso.split('-');
  return idioma === 'en' ? `${Number(d)} ${MESES_EN[Number(m) - 1]} ${a}` : `${d}/${m}/${a}`;
}
// «10/11» o «10 Nov».
function fechaBreve(iso, idioma = 'es') {
  if (!fechaValida(iso)) return '';
  const [, m, d] = iso.split('-');
  return idioma === 'en' ? `${Number(d)} ${MESES_EN[Number(m) - 1]}` : `${d}/${m}`;
}

/* ---- «Hoy» y «Ayer» ---- */
/* La fecha local del dispositivo en AAAA-MM-DD (sin Intl, por Hermes). */
function fechaLocal(d = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const dos = v => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
function diaAnterior(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
/* La etiqueta de la tarjeta según el día de quien mira, no el del archivo:
   «Hoy» solo si la noticia es de la sección de hoy y de esa misma fecha;
   «Ayer» si es del día anterior; nada en los demás casos. Así no se queda
   vieja si pasan días sin ciclo nuevo. */
function etiquetaReciente(n, hoyISO) {
  if (!n || !fechaValida(n.fecha) || !fechaValida(hoyISO)) return null;
  if (n.seccion === 'hoy' && n.fecha === hoyISO) return 'Hoy';
  if (n.fecha === diaAnterior(hoyISO)) return 'Ayer';
  return null;
}

/* ---- Fotos ---- */
/* Cada noticia trae en «imagen» la clave de una foto editorial de la
   biblioteca por tema (rwadar-editorial-source/noticias/fotos.json). La web la
   sirve en /noticias-editoriales/<clave>.webp y la app la carga de
   rwadar.pages.dev, como las imágenes de las ofertas. Son ilustrativas: no
   son fotos de la noticia, y así se dice debajo de la sección. Unas son
   escenas generadas con IA, sin texto, logotipos ni personas; desde el
   22/11/2026, otras son fotos reales con licencia libre de Wikimedia Commons
   (su origen y su crédito: «De dónde sale cada foto», más abajo). */
const RUTA_FOTOS = '/noticias-editoriales/';
const URL_FOTOS = 'https://rwadar.pages.dev/noticias-editoriales/';
const CLAVE_FOTO = /^[a-z0-9-]+$/;
const NOTA_FOTOS = Object.freeze({
  es: 'Imágenes ilustrativas generadas con IA, no fotos de la noticia.',
  en: 'Illustrative AI-generated images, not photos of the news.',
});
function claveFoto(valor, donde) {
  if (typeof valor !== 'string' || valor.length > 60 || !CLAVE_FOTO.test(valor)) {
    throw new Error(`${donde}: clave de foto no válida`);
  }
  return valor;
}
/* Tres tamaños de cada foto (noticias que entran por los ojos, 14/11/2026):
   480 × 320 y 960 × 640 en las carpetas «480/» y «960/», y la de 1200 × 800
   donde estuvo siempre (la app ya instalada sigue cargando esa). Cada pantalla
   baja la que necesita: una foto de 72 px ya no baja 1200. */
const ANCHOS_FOTO = Object.freeze([480, 960, 1200]);
/* El menor ancho que llega a «px» píxeles reales; con un valor raro, la de 1200. */
function anchoFoto(px) {
  if (typeof px !== 'number' || !Number.isFinite(px) || px <= 0) return 1200;
  return ANCHOS_FOTO.find(a => a >= px) || 1200;
}
/* La ruta (web) o la dirección completa (app) de la foto de una noticia.
   Sin «ancho» (o con uno que no existe), la de 1200, como siempre. */
function rutaFoto(n, { base = RUTA_FOTOS, ancho } = {}) {
  if (!n || typeof n.imagen !== 'string' || !CLAVE_FOTO.test(n.imagen)) return null;
  const carpeta = ancho === 480 || ancho === 960 ? `${ancho}/` : '';
  return `${base}${carpeta}${n.imagen}.webp`;
}
/* «srcset» de la web: los tres tamaños. */
function srcsetFoto(n, { base = RUTA_FOTOS } = {}) {
  if (!rutaFoto(n, { base })) return null;
  return ANCHOS_FOTO.map(a => `${rutaFoto(n, { base, ancho: a })} ${a}w`).join(', ');
}
/* Lo que ocupa cada foto en la pantalla («sizes»), según su papel. Los cortes
   son los de la rejilla de noticias-sector-20261110.css (en em: con la letra
   grande la rejilla cambia sola). La última tarjeta, cuando queda sola en su
   fila, se estira (papelTarjeta): en dos columnas, a todo el ancho
   («anchaDos»); en tres, a dos o tres columnas («anchaTres»); o en las dos
   rejillas («ancha»). */
const SIZES = Object.freeze({
  portada: '(min-width:64em) min(66vw, 860px), calc(100vw - 32px)',
  tarjeta: '(min-width:64em) min(33vw, 420px), (min-width:22em) calc(50vw - 22px), 112px',
  ancha: '(min-width:64em) min(66vw, 860px), (min-width:22em) calc(100vw - 32px), 112px',
  anchaDos: '(min-width:64em) min(33vw, 420px), (min-width:22em) calc(100vw - 32px), 112px',
  anchaTres: '(min-width:64em) min(66vw, 860px), (min-width:22em) calc(50vw - 22px), 112px',
  detalle: '(min-width:601px) 600px, 100vw',
});
/* Los atributos de la <img> de una foto, la única fuente para el pintor de la
   web y para el prepintado de Inicio (rwadar-noticias-portada.js): ninguno
   escribe srcset, sizes ni loading a mano. La portada nunca es perezosa: en
   una tableta o una pantalla grande es lo más grande de la primera pantalla
   (LCP), y si esperara a la maqueta tardaría el triple (medido el 13/11). */
function atributosFoto(n, papel, { base = RUTA_FOTOS } = {}) {
  if (!Object.hasOwn(SIZES, papel)) throw new Error(`papel de foto desconocido: ${papel}`);
  const src = rutaFoto(n, { base });
  if (!src) return null;
  const a = { src, srcset: srcsetFoto(n, { base }), sizes: SIZES[papel], width: 1200, height: 800, decoding: 'async' };
  if (papel !== 'portada') a.loading = 'lazy';
  return a;
}

/* ---- De dónde sale cada foto y su crédito (22/11/2026) ----
   Desde el 22/11/2026 la biblioteca admite, además de las escenas generadas
   con IA, fotos reales con licencia libre de Wikimedia Commons. Su origen y
   su crédito NO van en noticias-v2.json (la app ya instalada valida las
   claves de cada noticia con una lista cerrada y rechazaría una nueva): van
   en un archivo aparte, /datos/fotos-noticias.json, que genera
   rwadar-noticias-editoriales.js --creditos a partir de fotos.json.
   Reglas: una foto real lleva su crédito corto («Foto: autor · licencia ·
   Wikimedia Commons», con enlace a la página del archivo) y su descripción
   como texto alternativo; una de IA dice «Ilustración generada con IA». Si
   el archivo no está o no vale, la foto se ve sin crédito, nunca con uno
   falso; y las de IA siguen diciendo que son de IA porque sus claves van
   aquí (FOTOS_IA: una clave publicada no cambia nunca; una prueba la compara
   con fotos.json). */
const RUTA_CREDITOS = '/datos/fotos-noticias.json';
const URL_CREDITOS = 'https://rwadar.pages.dev/datos/fotos-noticias.json';
const FOTOS_IA = Object.freeze(['alerta-fraude', 'acciones-eeuu', 'red-europea', 'pagares-deuda', 'instituciones-ue', 'bolsa-madrid', 'pago-online',
  'regulador-espana', 'alerta-fraude-2', 'alerta-fraude-3', 'regulador-espana-2', 'documentos-consulta', 'instituciones-ue-2', 'bonos-emision',
  'inmuebles-ciudad', 'inmuebles-costa', 'oro-pepitas', 'moneda-digital', 'fondos-liquidez', 'acciones-movil', 'banco-sala', 'servidores-seguridad',
  'planeta-noche']);
/* Las licencias que se aceptan (la misma lista que importar-foto.py: una
   prueba las compara). «atribucion»: si la licencia obliga a nombrar al autor. */
const LICENCIAS_FOTO = Object.freeze({
  'Dominio público': Object.freeze({ url: null, atribucion: false, en: 'Public domain' }),
  'CC0': Object.freeze({ url: 'https://creativecommons.org/publicdomain/zero/1.0/', atribucion: false, en: 'CC0' }),
  ...Object.fromEntries(['by', 'by-sa'].flatMap(t => ['2.0', '2.5', '3.0', '4.0'].map(v => [`CC ${t.toUpperCase()} ${v}`,
    Object.freeze({ url: `https://creativecommons.org/licenses/${t}/${v}/`, atribucion: true, en: `CC ${t.toUpperCase()} ${v}` })]))),
});
const SITIO_FOTOS = 'Wikimedia Commons';
const PAGINA_COMMONS = /^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^\s"'<>\\]+$/;
const MAX_CREDITO = Object.freeze({ descripcion: 200, autor: 200, pagina: 400 });
const NOTAS_FOTOS = Object.freeze({
  foto: Object.freeze({ es: 'Fotos de archivo con licencia libre: ilustran el tema, no son de la noticia.',
    en: 'Stock photos under free licences: they illustrate the topic, not the news itself.' }),
  ia: NOTA_FOTOS,
  mixta: Object.freeze({ es: 'Fotos de archivo con licencia libre e ilustraciones generadas con IA: ilustran el tema, no son de la noticia.',
    en: 'Stock photos under free licences and AI-generated illustrations: they illustrate the topic, not the news itself.' }),
  algunaIa: Object.freeze({ es: 'Imágenes ilustrativas, algunas generadas con IA: no son fotos de la noticia.',
    en: 'Illustrative images, some AI-generated: not photos of the news.' }),
  ilustrativas: Object.freeze({ es: 'Imágenes ilustrativas, no fotos de la noticia.', en: 'Illustrative images, not photos of the news.' }),
});
const TEXTO_IA = Object.freeze({ es: 'Ilustración generada con IA', en: 'AI-generated illustration' });
/* La foto real se publica recortada a 3:2 y reducida: el detalle lo dice
   (CC BY 4.0 y CC BY-SA 4.0 piden indicar si la obra se ha modificado). */
const TEXTO_RECORTE = Object.freeze({ es: 'recortada', en: 'cropped' });
/* Comprueba /datos/fotos-noticias.json entero y devuelve una copia limpia;
   lanza si algo no cuadra (entonces no se usa ningún crédito). */
function validarCreditosFotos(datos) {
  claves(datos, ['version', 'nota', 'fotos'], ['version', 'fotos'], 'fotos-noticias.json');
  if (datos.version !== 1) throw new Error('fotos-noticias.json: versión desconocida');
  if (datos.nota !== undefined) texto(datos.nota, 'fotos-noticias.json, nota', MAX.nota);
  if (!esObjeto(datos.fotos) || Object.keys(datos.fotos).length > 500) throw new Error('fotos-noticias.json: «fotos» no vale');
  const fotos = {};
  for (const [clave, f] of Object.entries(datos.fotos)) {
    const donde = `fotos-noticias.json, ${clave}`;
    claveFoto(clave, donde);
    if (!esObjeto(f) || !['ia', 'foto'].includes(f.origen)) throw new Error(`${donde}: origen desconocido`);
    if (f.origen === 'ia') { claves(f, ['origen'], ['origen'], donde); fotos[clave] = { origen: 'ia' }; continue; }
    // Una clave de IA nunca pasa por foto real: el archivo entero no vale.
    if (FOTOS_IA.includes(clave)) throw new Error(`${donde}: es una ilustración generada con IA`);
    claves(f, ['origen', 'descripcion', 'autor', 'licencia', 'licenciaUrl', 'sitio', 'pagina'],
      ['origen', 'descripcion', 'autor', 'licencia', 'licenciaUrl', 'sitio', 'pagina'], donde);
    const lic = Object.hasOwn(LICENCIAS_FOTO, f.licencia) ? LICENCIAS_FOTO[f.licencia] : null;
    if (!lic) throw new Error(`${donde}: licencia no admitida`);
    if (f.licenciaUrl !== lic.url) throw new Error(`${donde}: el enlace de la licencia no es el suyo`);
    if (f.sitio !== SITIO_FOTOS) throw new Error(`${donde}: sitio desconocido`);
    texto(f.pagina, `${donde}, pagina`, MAX_CREDITO.pagina);
    if (!PAGINA_COMMONS.test(f.pagina)) throw new Error(`${donde}: la página no es la del archivo en Wikimedia Commons`);
    const descripcion = texto(f.descripcion, `${donde}, descripcion`, MAX_CREDITO.descripcion);
    if (lic.atribucion) texto(f.autor, `${donde}, autor`, MAX_CREDITO.autor);
    else if (f.autor !== null) throw new Error(`${donde}: sin autor en ${f.licencia}`);
    fotos[clave] = { origen: 'foto', descripcion, autor: f.autor, licencia: f.licencia, licenciaUrl: f.licenciaUrl, sitio: f.sitio, pagina: f.pagina };
  }
  for (const clave of FOTOS_IA) if (Object.hasOwn(fotos, clave) && fotos[clave].origen !== 'ia') throw new Error(`fotos-noticias.json: ${clave} es de IA`);
  return { version: 1, fotos };
}
function creditosValidos(datos) {
  try { return validarCreditosFotos(datos); } catch { return null; }
}
/* El crédito de la foto de una noticia: { origen: 'ia', texto } (siempre que
   su clave sea de IA, haya archivo o no), { origen: 'foto', texto, enlace,
   licenciaUrl, alt, partes, recorte } (solo con un archivo de créditos
   válido) o null (sin crédito). «partes» es el mismo texto en trozos, para
   pintarlo igual en la web y en la app: el nombre de la licencia enlaza a la
   licencia (si tiene dirección: el dominio público no) y «Wikimedia
   Commons», a la página del archivo (las licencias CC piden las dos cosas).
   «recorte» se añade en el detalle: «recortada». */
function creditoFoto(n, creditos, idioma = 'es') {
  const clave = n && typeof n.imagen === 'string' ? n.imagen : null;
  if (!clave || !CLAVE_FOTO.test(clave)) return null;
  const en = idioma === 'en';
  if (FOTOS_IA.includes(clave) || creditos?.fotos?.[clave]?.origen === 'ia') return { origen: 'ia', texto: TEXTO_IA[en ? 'en' : 'es'] };
  const c = creditos?.fotos?.[clave];
  if (!c || c.origen !== 'foto') return null;
  const lic = LICENCIAS_FOTO[c.licencia];
  if (!lic) return null;
  const nombre = en ? lic.en : c.licencia;
  const cabeza = `${en ? 'Photo' : 'Foto'}: ${lic.atribucion && c.autor ? `${c.autor} · ` : ''}`;
  const partes = [{ texto: cabeza, enlace: null }, { texto: nombre, enlace: c.licenciaUrl }, { texto: ' · ', enlace: null },
    { texto: c.sitio, enlace: c.pagina }];
  return { origen: 'foto', texto: partes.map(x => x.texto).join(''), enlace: c.pagina, licenciaUrl: c.licenciaUrl, alt: c.descripcion,
    partes, recorte: TEXTO_RECORTE[en ? 'en' : 'es'] };
}
/* La línea de debajo de la sección, según las fotos que se ven: todas reales,
   todas de IA, de las dos o, si alguna no tiene crédito, sin decir que es real. */
function notaFotos(noticias, creditos, idioma = 'es') {
  const lista = Array.isArray(noticias) ? noticias.filter(n => n && typeof n.imagen === 'string') : [];
  const origenes = lista.map(n => creditoFoto(n, creditos, idioma)?.origen || null);
  const hay = o => origenes.includes(o);
  const cual = !lista.length ? 'ilustrativas' : hay(null) ? (hay('ia') ? 'algunaIa' : 'ilustrativas')
    : hay('ia') && hay('foto') ? 'mixta' : hay('foto') ? 'foto' : 'ia';
  return NOTAS_FOTOS[cual][idioma === 'en' ? 'en' : 'es'];
}

/* ¿Es la tarjeta i (la portada es la 0) de una rejilla de «total» la última
   y queda sola en su fila? En dos columnas, si el total es par; en tres
   (desde 64em, con la portada ocupando dos columnas y dos filas), si el total
   pasa de 3 y no es múltiplo de 3. Entonces la rejilla la estira (sin hueco al
   lado) y su foto se pide más grande (SIZES.ancha). */
function esAncha(i, total) {
  return papelTarjeta(i, total) !== 'tarjeta';
}
/* El papel de la foto de la tarjeta i (para «sizes»): «tarjeta», o la
   ancha de la rejilla en que se estira. */
function papelTarjeta(i, total) {
  if (!Number.isInteger(i) || !Number.isInteger(total) || i < 1 || i !== total - 1) return 'tarjeta';
  const enDos = total % 2 === 0, enTres = total >= 4 && total % 3 !== 0;
  return enDos && enTres ? 'ancha' : enDos ? 'anchaDos' : enTres ? 'anchaTres' : 'tarjeta';
}

/* ---- Inicio: la portada y dos tarjetas ---- */
const EN_INICIO = 3;
/* La firma de lo que pinta Inicio (FNV-1a de 32 bits): lo que se ve de las
   tres primeras en castellano. El publicador la escribe en
   data-nt-prepintado y el JS la compara para no rehacer la lista: con dos
   ediciones el mismo día, la fecha no bastaría. Pura: sin reloj ni Intl. */
function firmaPrepintado(datos) {
  const lista = Array.isArray(datos?.noticias) ? datos.noticias.slice(0, EN_INICIO) : [];
  const texto = 'nt-v1|' + JSON.stringify(lista.map(n => [n.id, n.titulo, n.imagen || '', n.categoria, n.fecha, fuenteCorta(n, 'es')]));
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
/* ¿Hay que rehacer la lista que trae Inicio ya pintada? Solo se deja si es la
   misma edición (misma firma) y la página está en castellano. */
function debeRepintar({ prepintado, datos, idioma } = {}) {
  if (typeof prepintado !== 'string' || !prepintado || idioma !== 'es' || !datos) return true;
  return prepintado !== firmaPrepintado(datos);
}

/* ---- Titulares (guía: rwadar-editorial-source/noticias/GUIA-TITULARES.md) ----
   Lo que se puede medir de la guía. Los errores paran la publicación
   (rwadar-publicar.js) y las noticias automáticas antes de abrir su PR; los
   avisos los lee el verificador. Solo con expresiones que entiende cualquier
   motor de JS (también Hermes, que carga este archivo): sin escapes de propiedades Unicode ni
   lookbehind. */
const LETRA = 'A-Za-z0-9\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u024f';
const frase = lista => new RegExp(`(?:^|[^${LETRA}])(${lista.join('|')})(?![${LETRA}])`, 'i');
const REGLAS_TITULAR = Object.freeze({
  max: 60,
  // Promesas y gancho barato: error.
  prohibidas: frase(['rentabilidad(?:es)? garantizadas?', 'garantizamos', 'sin riesgos?', 'oportunidad (?:única|unica|de oro)', 'hazte rico',
    'chollos?', 'pelotazo', 'imperdibles?', 'no te lo pierdas', 'dinero fácil', 'dinero facil', 'risk[- ]free', 'guaranteed returns?', 'get rich',
    'once[- ]in[- ]a[- ]lifetime', "don'?t miss"]),
  // Signos de exclamación: error.
  exclamacion: /[¡!]/,
  // Raíces que suelen acompañar a una promesa, pero también a un titular
  // legítimo («bonos garantizados por el Estado», «una aseguradora»,
  // «la falsa oportunidad»): aviso para el verificador.
  raices: /garantiz|asegur|oportunidad|guarantee|opportunit/i,
  // Exageraciones: aviso.
  dudosas: /dispar[ao]|desplom|se hunde|hundimiento|hist[oó]ric|revoluci|incre[ií]ble|brutal|bomba|skyrocket|soar|plunge|crash|historic|revolution|incredible/i,
  // Emoji y pictogramas (por rangos, sin escapes de propiedades Unicode): error.
  emoji: /[\u2190-\u21ff\u2300-\u23ff\u2460-\u27bf\u2900-\u297f\u2b00-\u2bff\ufe0f]|[\ud83c-\ud83e][\udc00-\udfff]/,
  // Un titular no acaba en punto, salvo una abreviatura («EE. UU.»).
  abreviatura: /(?:EE\. ?UU\.|S\. ?A\.|S\. ?L\.|etc\.|Inc\.|Ltd\.|Corp\.|Co\.|U\. ?S\.|U\. ?K\.|N\. ?V\.|Jr\.)$/,
});
const cifras = t => (String(t).match(/\d+(?:[.,]\d+)*/g) || []);
/* Revisa una edición contra la guía medible. No lanza: devuelve
   { errores: [{ id, campo, codigo, texto }], avisos: [...] }. «fotos», si se
   pasa, son las claves de la biblioteca (fotos.json). */
function revisarEdicion(datos, { fotos = null } = {}) {
  const errores = [], avisos = [];
  let limpios;
  try { limpios = validarNoticias(datos); }
  catch (e) { errores.push({ id: '', campo: '', codigo: 'forma', texto: e.message }); return { errores, avisos }; }
  const biblioteca = fotos ? new Set(fotos) : null;
  const usadas = new Map();
  for (const n of limpios.noticias) {
    const campos = [['titulo', n.titulo, [n.resumen, n.porQueImporta, n.tituloInformativo || '']],
      ['en.titulo', n.en.titulo, [n.en.resumen, n.en.porQueImporta, n.en.tituloInformativo || '']]];
    for (const [campo, t, contexto] of campos) {
      const largo = [...t].length;
      if (largo > REGLAS_TITULAR.max) errores.push({ id: n.id, campo, codigo: 'largo', texto: `${largo} caracteres (máximo ${REGLAS_TITULAR.max})` });
      const promesa = REGLAS_TITULAR.prohibidas.exec(t);
      if (promesa) errores.push({ id: n.id, campo, codigo: 'prohibida', texto: `«${promesa[1]}»` });
      if (REGLAS_TITULAR.exclamacion.test(t)) errores.push({ id: n.id, campo, codigo: 'exclamacion', texto: 'lleva «¡» o «!»' });
      if (REGLAS_TITULAR.emoji.test(t)) errores.push({ id: n.id, campo, codigo: 'emoji', texto: 'lleva un emoji o un símbolo' });
      if (/\.$/.test(t) && !REGLAS_TITULAR.abreviatura.test(t)) errores.push({ id: n.id, campo, codigo: 'punto-final', texto: 'acaba en punto' });
      const raiz = REGLAS_TITULAR.raices.exec(t);
      if (raiz && !promesa) avisos.push({ id: n.id, campo, codigo: 'raiz-promesa', texto: `«${raiz[0]}»: comprueba que no promete nada` });
      const duda = REGLAS_TITULAR.dudosas.exec(t);
      if (duda) avisos.push({ id: n.id, campo, codigo: 'dudosa', texto: `«${duda[0]}»: comprueba que no exagera` });
      const fuera = cifras(t).filter(c => !contexto.some(x => x.includes(c)));
      if (fuera.length) avisos.push({ id: n.id, campo, codigo: 'cifra', texto: `${fuera.join(', ')} no está tal cual en el resumen: compruébalo` });
    }
    if (!n.imagen) errores.push({ id: n.id, campo: 'imagen', codigo: 'sin-foto', texto: 'sin foto' });
    else {
      if (usadas.has(n.imagen)) errores.push({ id: n.id, campo: 'imagen', codigo: 'foto-repetida', texto: `«${n.imagen}» ya la usa ${usadas.get(n.imagen)}` });
      else usadas.set(n.imagen, n.id);
      if (biblioteca && !biblioteca.has(n.imagen)) errores.push({ id: n.id, campo: 'imagen', codigo: 'foto-desconocida', texto: `«${n.imagen}» no está en fotos.json` });
    }
  }
  return { errores, avisos };
}
/* Las noticias sin foto (para el generador, que las exige al publicar). */
function noticiasSinFoto(datos) {
  const lista = Array.isArray(datos?.noticias) ? datos.noticias : [];
  return lista.filter(n => !n || typeof n.imagen !== 'string').map(n => (n && n.id) || '?');
}
/* Las claves distintas que usan las noticias (para el generador). */
function clavesFotos(datos) {
  const lista = Array.isArray(datos?.noticias) ? datos.noticias : [];
  return [...new Set(lista.map(n => n && n.imagen).filter(v => typeof v === 'string'))];
}

/* La fuente, como en una app de bolsa: lo que va antes de la primera coma de
   su nombre, tal como lo escribe RWAdar («CNMV», «ESMA»…). En inglés, los
   organismos con nombre propio en ese idioma se traducen («Consejo de la UE»
   salía sin traducir: revisión del 11/11/2026); las siglas y las empresas
   quedan como están. */
const FUENTES_EN = Object.freeze({
  'Consejo de la UE': 'Council of the EU', 'Comisión Europea': 'European Commission', 'Parlamento Europeo': 'European Parliament',
  'Banco Central Europeo': 'European Central Bank', 'Banco de España': 'Bank of Spain', 'Tesoro Público': 'Spanish Treasury',
  'Ministerio de Economía': 'Spanish Ministry of Economy', 'Bolsa de Madrid': 'Madrid Stock Exchange',
});
function fuenteCorta(noticia, idioma = 'es') {
  const corta = String(noticia?.fuente?.nombre || '').split(',')[0].trim();
  return idioma === 'en' && FUENTES_EN[corta] ? FUENTES_EN[corta] : corta;
}
/* ¿Está «fuenteCorta» en inglés? (para el atributo lang de la web). */
const fuenteTraducida = (noticia, idioma = 'es') => fuenteCorta(noticia, idioma) !== fuenteCorta(noticia, 'es');

module.exports = { RUTA, URL_DATOS, MAX_NOTICIAS, SECCIONES, CATEGORIAS, AMBITOS, TIPOS_FUENTE, MAX, validarNoticias, noticiasValidas,
  textos, etiquetaCategoria, etiquetaAmbito, fechaCorta, fechaBreve, fechaLocal, etiquetaReciente,
  RUTA_FOTOS, URL_FOTOS, CLAVE_FOTO, NOTA_FOTOS, rutaFoto, clavesFotos, noticiasSinFoto, FUENTES_EN, fuenteCorta, fuenteTraducida,
  ANCHOS_FOTO, anchoFoto, srcsetFoto, SIZES, atributosFoto,
  RUTA_CREDITOS, URL_CREDITOS, FOTOS_IA, LICENCIAS_FOTO, SITIO_FOTOS, PAGINA_COMMONS, NOTAS_FOTOS, TEXTO_IA, TEXTO_RECORTE, validarCreditosFotos, creditosValidos,
  creditoFoto, notaFotos, esAncha, papelTarjeta, EN_INICIO, firmaPrepintado, debeRepintar, REGLAS_TITULAR, revisarEdicion };

window.RWAdarNoticiasModelo=module.exports; })();
