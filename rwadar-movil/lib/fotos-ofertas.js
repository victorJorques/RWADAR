'use strict';
/* ---------------------------------------------------------------------
   Fotos reales de las ofertas (22/11/2026)
   ---------------------------------------------------------------------
   Orden de Víctor del 22/11/2026: «La de las ofertas también las cambiaría,
   las siento muy igual». Cada oferta puede llevar, en vez de su ilustración
   generada con IA, una foto real con licencia libre de Wikimedia Commons
   (las mismas licencias que las noticias: LICENCIAS_FOTO de
   lib/noticias-sector.js). La trae
   rwadar-editorial-source/noticias/importar-foto.py --biblioteca ofertas.

   Una foto real dice con honradez qué se ve («queMuestra»):
     - "activo": el edificio o la instalación exacta de la oferta (comprobado
       por una persona antes de importarla);
     - "lugar": la calle, el barrio o la ciudad donde está el activo, no el
       activo;
     - "tema": algo real relacionado (el Tesoro, una bolsa, lingotes…).
   «lugarOTema» es lo que va en el pie («Graz (Austria)», «la Bolsa de Nueva
   York»), y «lugarOTemaEn», si lo hay, lo mismo en inglés.

   El crédito NO viaja con el catálogo (la app instalada valida las ofertas
   con claves cerradas): va con la imagen, en el manifiesto de
   rwadar-movil/assets/ofertas-editoriales/manifest.json, que la app empaqueta
   (la OTA lleva a la vez la foto, su crédito y este código) y la web publica
   en /ofertas-editoriales/manifest.json y en su bloque generado
   EDITORIAL_OFERTA_POR_SLUG. La foto real se publica como foto-<slug>.webp y
   nunca como oferta-<slug>.webp: la app ya instalada pide ese nombre a la web
   para las ofertas que no lleva dentro y lo presenta como ilustración de IA.

   Pie (web y app, en castellano e inglés):
     «Foto real de <lugarOTema>, no del activo · <autor> · <licencia> ·
      Wikimedia Commons» (lugar o tema), o «Foto real del activo · …»
     (activo), con la licencia enlazada a su texto y «Wikimedia Commons» a la
     página del archivo; sin autor en dominio público o CC0. Si el crédito
     falta o no vale, un pie genérico y verdadero («Foto real del lugar o del
     tema, no del activo»): una foto real nunca pasa por foto del activo sin
     un crédito válido que lo diga. Las ilustraciones de IA, como siempre:
     sin pie propio y la línea general «Imágenes ilustrativas, no fotos del
     activo».
   Sin dependencias, sin red y sin Intl (Hermes).
   --------------------------------------------------------------------- */
const { LICENCIAS_FOTO, SITIO_FOTOS, PAGINA_COMMONS } = require('./noticias-sector');

const QUE_MUESTRA = Object.freeze(['activo', 'lugar', 'tema']);
const PREFIJO_ARCHIVO_FOTO = 'foto-';
const MAX = Object.freeze({ descripcion: 200, lugarOTema: 80, autor: 200, pagina: 400 });
/* En lo que escribe RWAdar (no en la autoría, que es la del autor): ni cifras
   de dinero ni promesas. Una foto real puede llevar el número de una calle. */
const PROHIBIDO = /[%€$£]|rentab|garantiz|benefici|gananci|retorno|asegurad|sin riesgo|oportunidad/i;
const textoLlano = (v, max) => typeof v === 'string' && v.trim() === v && v.length > 0 && [...v].length <= max &&
  !/[<>\u0000-\u001f\u007f​-‏⁠﻿]/.test(v);

const TEXTOS = Object.freeze({
  activo: Object.freeze({ es: 'Foto real del activo', en: 'Real photo of the asset' }),
  generico: Object.freeze({ es: 'Foto real del lugar o del tema, no del activo', en: 'Real photo of the place or the topic, not of the asset' }),
  recorte: Object.freeze({ es: 'recortada', en: 'cropped' }),
});
const lugarOTemaPie = (lugar, idioma) => (idioma === 'en'
  ? `Real photo of ${lugar}, not of the asset` : `Foto real de ${lugar}, no del activo`);

/* La línea general, según las imágenes que se ven. */
const NOTAS_IMAGENES = Object.freeze({
  ia: Object.freeze({ es: 'Imágenes ilustrativas, no fotos del activo', en: 'Illustrative images, not photos of the asset' }),
  foto: Object.freeze({ es: 'Fotos reales del lugar o del tema, no del activo',
    en: 'Real photos of the place or the topic, not of the asset' }),
  mixta: Object.freeze({ es: 'Fotos reales del lugar o del tema e imágenes ilustrativas: ninguna es foto del activo',
    en: 'Real photos of the place or the topic and illustrative images: none is a photo of the asset' }),
  activo: Object.freeze({ es: 'Fotos reales del activo, de Wikimedia Commons', en: 'Real photos of the asset, from Wikimedia Commons' }),
  cadaUna: Object.freeze({ es: 'Cada foto real dice si muestra el activo, su lugar o su tema; las demás imágenes son ilustrativas',
    en: 'Each real photo says whether it shows the asset, its place or its topic; the other images are illustrative' }),
});

/* El crédito de una foto real, limpio, o null si algo no cuadra (nunca lanza).
   «x» es la entrada del manifiesto (o del bloque de la web): { origen: "foto",
   queMuestra, lugarOTema, lugarOTemaEn?, credito: { autor, licencia,
   licenciaUrl, sitio, pagina } }. */
function creditoFotoOferta(x) {
  if (!x || typeof x !== 'object' || x.origen !== 'foto') return null;
  const c = x.credito;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  if (Object.keys(c).sort().join() !== 'autor,licencia,licenciaUrl,pagina,sitio') return null;
  if (!QUE_MUESTRA.includes(x.queMuestra)) return null;
  const lic = typeof c.licencia === 'string' && Object.hasOwn(LICENCIAS_FOTO, c.licencia) ? LICENCIAS_FOTO[c.licencia] : null;
  if (!lic || c.licenciaUrl !== lic.url || c.sitio !== SITIO_FOTOS) return null;
  if (!textoLlano(c.pagina, MAX.pagina) || !PAGINA_COMMONS.test(c.pagina)) return null;
  if (lic.atribucion ? !textoLlano(c.autor, MAX.autor) : c.autor !== null) return null;
  const lugar = x.queMuestra === 'activo' ? null : x.lugarOTema;
  if (lugar !== null && (!textoLlano(lugar, MAX.lugarOTema) || PROHIBIDO.test(lugar))) return null;
  const lugarEn = x.queMuestra === 'activo' || x.lugarOTemaEn === undefined ? null : x.lugarOTemaEn;
  if (lugarEn !== null && (!textoLlano(lugarEn, MAX.lugarOTema) || PROHIBIDO.test(lugarEn))) return null;
  return Object.freeze({ queMuestra: x.queMuestra, lugarOTema: lugar, lugarOTemaEn: lugarEn, autor: lic.atribucion ? c.autor : null,
    licencia: c.licencia, licenciaUrl: c.licenciaUrl, sitio: c.sitio, pagina: c.pagina });
}

/* El pie de la imagen de una oferta: null si no es una foto real (una
   ilustración de IA no lleva pie propio); si lo es, { generico, queMuestra,
   texto, partes, recorte }. «partes» son los trozos del texto, para pintarlo
   igual en la web y en la app (los que tienen «enlace» son enlaces). */
function pieFotoOferta(x, idioma = 'es') {
  if (!x || typeof x !== 'object' || x.origen !== 'foto') return null;
  const en = idioma === 'en';
  const lengua = en ? 'en' : 'es';
  const c = creditoFotoOferta(x);
  if (!c) {
    const texto = TEXTOS.generico[lengua];
    return Object.freeze({ generico: true, queMuestra: null, texto, partes: Object.freeze([Object.freeze({ texto, enlace: null })]),
      recorte: TEXTOS.recorte[lengua] });
  }
  const cabeza = c.queMuestra === 'activo' ? TEXTOS.activo[lengua] : lugarOTemaPie(en && c.lugarOTemaEn ? c.lugarOTemaEn : c.lugarOTema, lengua);
  const lic = LICENCIAS_FOTO[c.licencia];
  const partes = [{ texto: cabeza, enlace: null }, { texto: ' · ', enlace: null }];
  if (c.autor) partes.push({ texto: c.autor, enlace: null }, { texto: ' · ', enlace: null });
  partes.push({ texto: en ? lic.en : c.licencia, enlace: c.licenciaUrl }, { texto: ' · ', enlace: null }, { texto: c.sitio, enlace: c.pagina });
  return Object.freeze({ generico: false, queMuestra: c.queMuestra, texto: partes.map(p => p.texto).join(''),
    partes: Object.freeze(partes.map(p => Object.freeze(p))), recorte: TEXTOS.recorte[lengua] });
}

/* Qué es cada imagen: 'ia', 'activo' (foto real del activo con crédito
   válido) o 'lugar' (foto real del lugar o del tema, o sin crédito válido:
   nunca se da por foto del activo). */
function claseImagenOferta(x) {
  if (!x || typeof x !== 'object' || x.origen !== 'foto') return 'ia';
  return creditoFotoOferta(x)?.queMuestra === 'activo' ? 'activo' : 'lugar';
}

/* La línea general de debajo de una lista o un carrusel, según lo que se ve. */
function notaImagenesOfertas(imagenes, idioma = 'es') {
  const clases = new Set((Array.isArray(imagenes) ? imagenes : []).filter(Boolean).map(claseImagenOferta));
  const cual = clases.has('activo') ? (clases.size === 1 ? 'activo' : 'cadaUna')
    : clases.has('lugar') ? (clases.has('ia') ? 'mixta' : 'foto') : 'ia';
  return NOTAS_IMAGENES[cual][idioma === 'en' ? 'en' : 'es'];
}

/* Comprueba una entrada del manifiesto que sea una foto real (la usan
   rwadar-ofertas-editoriales.js y las pruebas). Lanza con el motivo. */
function validarFichaFoto(entrada) {
  const donde = `foto real de ${entrada?.slug || 'sin slug'}`;
  if (!entrada || entrada.origen !== 'foto') throw new Error(`${donde}: no es una foto real`);
  if (entrada.archivo !== `${PREFIJO_ARCHIVO_FOTO}${entrada.slug}.webp`) throw new Error(`${donde}: el archivo es ${PREFIJO_ARCHIVO_FOTO}<slug>.webp`);
  if (!textoLlano(entrada.alt, MAX.descripcion) || [...entrada.alt].length < 10 || PROHIBIDO.test(entrada.alt)) {
    throw new Error(`${donde}: el texto alternativo es la descripción de lo que se ve (de 10 a ${MAX.descripcion} caracteres, sin cifras de dinero ni promesas)`);
  }
  if (!QUE_MUESTRA.includes(entrada.queMuestra)) throw new Error(`${donde}: «queMuestra» es ${QUE_MUESTRA.join(', ')}`);
  if (entrada.queMuestra === 'activo' ? entrada.lugarOTema !== undefined || entrada.lugarOTemaEn !== undefined : !entrada.lugarOTema) {
    throw new Error(`${donde}: ${entrada.queMuestra === 'activo' ? 'la foto del activo no lleva «lugarOTema»' : 'falta «lugarOTema» (lo que dice el pie)'}`);
  }
  if (entrada.sinPersonas !== true) throw new Error(`${donde}: sin personas reconocibles («sinPersonas»: true)`);
  if (!creditoFotoOferta(entrada)) throw new Error(`${donde}: crédito no válido (licencia de la lista con su url, autor si la licencia lo pide, página de Wikimedia Commons; «lugarOTema» llano)`);
  return entrada;
}

module.exports = { QUE_MUESTRA, PREFIJO_ARCHIVO_FOTO, PROHIBIDO, MAX, TEXTOS, NOTAS_IMAGENES, creditoFotoOferta, pieFotoOferta,
  claseImagenOferta, notaImagenesOfertas, validarFichaFoto };
