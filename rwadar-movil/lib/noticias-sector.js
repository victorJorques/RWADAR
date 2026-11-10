'use strict';
/* ---------------------------------------------------------------------
   «Noticias del sector» en Inicio (10/11/2026)
   ---------------------------------------------------------------------
   Un solo motor para la web (assets/noticias-sector-modelo-20261110.js, copia
   exacta hecha por rwadar-app/noticias/copiar-modelo-web.cjs), la app y el
   generador de la web (rwadar-publicar.js valida con él /datos/noticias.json
   antes de publicar). Sin dependencias, sin red y sin Intl (Hermes).

   Datos: rwadar-site/datos/noticias.json, la selección verificada de cada
   ciclo de investigación. La web lo sirve en /datos/noticias.json y la app
   lo lee de https://rwadar.pages.dev/datos/noticias.json. Aquí no se escribe
   ninguna noticia: solo se comprueba la forma, se ordena (las de hoy
   primero) y se eligen los textos del idioma.

   Fotos (rediseño de Inicio, 10/11/2026): cada noticia lleva en «imagen» la
   clave de una foto editorial propia (WebP generado con IA, sin texto,
   logotipos ni personas), servida desde rwadar.pages.dev: nunca de terceros,
   que verían la IP de quien mira. Sustituyen a las ilustraciones SVG.
   --------------------------------------------------------------------- */
const RUTA = '/datos/noticias.json';
const URL_DATOS = 'https://rwadar.pages.dev/datos/noticias.json';
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
    'tituloInformativo', 'imagen'], ['id', 'fecha', 'seccion', 'categoria', 'ambito', 'titulo', 'resumen', 'porQueImporta', 'en', 'fuente', 'consultadaEl',
    'imagen'], donde);
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
  salida.imagen = claveFoto(n.imagen, `${donde}, imagen`);
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
   rwadar.pages.dev, como las imágenes de las ofertas. Son ilustrativas,
   generadas con IA, sin texto, logotipos ni personas: no son fotos de la
   noticia, y así se dice debajo de la sección. */
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
/* La ruta (web) o la dirección completa (app) de la foto de una noticia. */
function rutaFoto(n, { base = RUTA_FOTOS } = {}) {
  if (!n || typeof n.imagen !== 'string' || !CLAVE_FOTO.test(n.imagen)) return null;
  return `${base}${n.imagen}.webp`;
}
/* Las claves distintas que usan las noticias (para el generador). */
function clavesFotos(datos) {
  const lista = Array.isArray(datos?.noticias) ? datos.noticias : [];
  return [...new Set(lista.map(n => n && n.imagen).filter(v => typeof v === 'string'))];
}

module.exports = { RUTA, URL_DATOS, MAX_NOTICIAS, SECCIONES, CATEGORIAS, AMBITOS, TIPOS_FUENTE, MAX, validarNoticias, noticiasValidas,
  textos, etiquetaCategoria, etiquetaAmbito, fechaCorta, fechaBreve, fechaLocal, etiquetaReciente,
  RUTA_FOTOS, URL_FOTOS, CLAVE_FOTO, NOTA_FOTOS, rutaFoto, clavesFotos };
