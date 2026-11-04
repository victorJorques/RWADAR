// Transparencia por oferta: de transparencia.json a la web y a la app.
//
// La fuente es rwadar-editorial-source/ofertas/transparencia.json: dos de las
// cinco comprobaciones (supervisión y documento oficial para España), los
// puntos fuertes con su fuente, el mínimo y la salida en forma corta y la
// fecha de alta en el registro. Las otras tres comprobaciones las calcula la
// web con el catálogo. No es una recomendación de inversión.
//
// Este script valida el archivo contra el catálogo publicado y escribe:
//   1. el bloque «transparencia» de rwadar-site/assets/rwadar-20260820.js
//   2. rwadar-movil/lib/transparencia-contenido.js (para la app, más adelante)
//
//   node rwadar-editorial-source/ofertas/transparencia.mjs             genera
//   node rwadar-editorial-source/ofertas/transparencia.mjs --comprobar solo comprueba
//
// No toca la red. Un dato mal formado para el script: la web falla cerrado
// (una oferta sin entrada, o con otra fecha de revisión, no enseña nada).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const require = createRequire(import.meta.url);
const { leerCatalogo } = require('../../rwadar-fichas.js');

export const FUENTE = path.join(AQUI, 'transparencia.json');
export const JS_WEB = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
export const DATOS_APP = path.join(RAIZ, 'rwadar-movil', 'lib', 'transparencia-contenido.js');
export const CRITERIOS = Object.freeze(['contratable', 'supervisada', 'documentoEspana', 'minimoSalida', 'vigente']);
/* Lo que nunca puede decir un texto de transparencia (decisión del 03/11/2026). */
export const PROHIBIDO = /%|rentab|garantiz|benefici|gananci|recomend|mejor/i;
export const MAX_CORTO = 40;
const INICIO = '/* transparencia:inicio */';
const FIN = '/* transparencia:fin */';
const CLAVES_OFERTA = ['verificadaEl', 'anadidaEl', 'supervisada', 'documentoEspana', 'minimoCorto', 'salidaCorta', 'puntos'];
const CLAVES_COMPROBACION = ['cumple', 'motivo', 'fuente', 'consultadaEl'];

class ErrorTransparencia extends Error {}
const falla = (donde, mensaje) => { throw new ErrorTransparencia(`${donde}: ${mensaje}`); };

function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
function texto(valor, donde, max = Infinity) {
  if (typeof valor !== 'string' || !valor.trim()) falla(donde, 'falta el texto');
  if (valor !== valor.trim()) falla(donde, 'sobran espacios al principio o al final');
  if (valor.length > max) falla(donde, `«${valor}» tiene ${valor.length} caracteres (máximo ${max})`);
  if (/[<>\u0000-\u001f\u007f]/.test(valor)) falla(donde, 'no puede llevar < ni > ni caracteres de control');
  if (PROHIBIDO.test(valor)) falla(donde, `«${valor}» usa una palabra o un signo prohibido (${PROHIBIDO.source})`);
  return valor;
}
function fuenteHttps(fuente, donde) {
  if (!fuente || typeof fuente !== 'object' || Array.isArray(fuente)) falla(donde, 'falta la fuente');
  const sobra = Object.keys(fuente).filter(k => !['titulo', 'url'].includes(k));
  if (sobra.length) falla(donde, `claves desconocidas en la fuente: ${sobra.join(', ')}`);
  texto(fuente.titulo, `${donde}.titulo`, 240);
  let url;
  try { url = new URL(fuente.url); } catch { falla(donde, `URL no válida: ${fuente.url}`); }
  if (!/^https:\/\//.test(fuente.url) || url.protocol !== 'https:' || url.username || url.password || /\s/.test(fuente.url))
    falla(donde, `la fuente debe ser https: ${fuente.url}`);
  return { titulo: fuente.titulo, url: fuente.url };
}
function comprobacion(valor, donde, revisadoEl) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) falla(donde, 'falta la comprobación');
  const sobra = Object.keys(valor).filter(k => !CLAVES_COMPROBACION.includes(k));
  if (sobra.length) falla(donde, `claves desconocidas: ${sobra.join(', ')}`);
  if (typeof valor.cumple !== 'boolean') falla(donde, '«cumple» debe ser true o false');
  if (!fechaValida(valor.consultadaEl) || valor.consultadaEl > revisadoEl) falla(donde, 'consultadaEl no válida o posterior a la revisión');
  return { cumple: valor.cumple, motivo: texto(valor.motivo, `${donde}.motivo`, 300),
    fuente: fuenteHttps(valor.fuente, `${donde}.fuente`), consultadaEl: valor.consultadaEl };
}

/* Valida el archivo y devuelve lo que se publica. */
export function cargarTransparencia({ raiz = RAIZ, datos } = {}) {
  const fuente = datos || JSON.parse(fs.readFileSync(FUENTE, 'utf8'));
  if (fuente.versionEsquema !== 1) falla('transparencia.json', 'versionEsquema debe ser 1');
  if (!fechaValida(fuente.revisadoEl)) falla('transparencia.json', 'revisadoEl no válida');
  if (!Array.isArray(fuente.criterios) || fuente.criterios.map(c => c && c.id).join() !== CRITERIOS.join())
    falla('transparencia.json', `los criterios deben ser exactamente ${CRITERIOS.join(', ')}, en ese orden`);
  const criterios = fuente.criterios.map((c, i) => ({ id: c.id, texto: texto(c.texto, `criterios[${i}].texto`, 90) }));
  const catalogo = leerCatalogo(raiz);
  const porSlug = new Map(catalogo.ofertas.map(o => [o.slug, o]));
  if (!fuente.ofertas || typeof fuente.ofertas !== 'object' || Array.isArray(fuente.ofertas)) falla('transparencia.json', 'faltan las ofertas');
  const ofertas = {};
  for (const slug of Object.keys(fuente.ofertas).sort()) {
    const o = fuente.ofertas[slug], donde = `ofertas.${slug}`;
    const publicada = porSlug.get(slug);
    if (!publicada) falla(donde, 'no está en el catálogo publicado');
    if (!o || typeof o !== 'object' || Array.isArray(o)) falla(donde, 'entrada no válida');
    const sobra = Object.keys(o).filter(k => !CLAVES_OFERTA.includes(k));
    if (sobra.length) falla(donde, `claves desconocidas: ${sobra.join(', ')}`);
    if (o.verificadaEl !== publicada.verificadaEl)
      falla(donde, `verificadaEl ${o.verificadaEl} no coincide con la del catálogo (${publicada.verificadaEl})`);
    if (!fechaValida(o.anadidaEl) || o.anadidaEl > fuente.revisadoEl) falla(donde, 'anadidaEl no válida o futura');
    const corto = (v, campo) => v === null ? null : texto(v, `${donde}.${campo}`, MAX_CORTO);
    if (!Array.isArray(o.puntos) || o.puntos.length > 4) falla(donde, 'puntos debe ser una lista de 0 a 4');
    ofertas[slug] = {
      verificadaEl: o.verificadaEl, anadidaEl: o.anadidaEl,
      supervisada: comprobacion(o.supervisada, `${donde}.supervisada`, fuente.revisadoEl),
      documentoEspana: comprobacion(o.documentoEspana, `${donde}.documentoEspana`, fuente.revisadoEl),
      minimoCorto: corto(o.minimoCorto, 'minimoCorto'), salidaCorta: corto(o.salidaCorta, 'salidaCorta'),
      puntos: o.puntos.map((p, i) => {
        if (!p || typeof p !== 'object' || Object.keys(p).some(k => !['texto', 'fuente'].includes(k))) falla(`${donde}.puntos[${i}]`, 'punto no válido');
        return { texto: texto(p.texto, `${donde}.puntos[${i}].texto`, MAX_CORTO), fuente: fuenteHttps(p.fuente, `${donde}.puntos[${i}].fuente`) };
      }),
    };
  }
  const sinEntrada = catalogo.ofertas.filter(o => !ofertas[o.slug]).map(o => o.slug);
  return { revisadoEl: fuente.revisadoEl, criterios, ofertas, sinEntrada,
    avisoRevision: fuente.revisionCatalogo && catalogo.plataformas[0] &&
      catalogo.plataformas[0].revisionId !== fuente.revisionCatalogo
      ? `revisionCatalogo ${fuente.revisionCatalogo} no es la del catálogo (${catalogo.plataformas[0].revisionId})` : '' };
}

const json = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));

export function bloqueWeb({ criterios, ofertas }) {
  return `${INICIO}\n` +
    '/* GENERADO por rwadar-editorial-source/ofertas/transparencia.mjs desde transparencia.json: no se edita a mano.\n' +
    '   Dos de las cinco comprobaciones, los puntos fuertes y los textos cortos de cada oferta. No es una recomendación. */\n' +
    `const TRANSPARENCIA_CRITERIOS=Object.freeze(${json(criterios)});\n` +
    `const TRANSPARENCIA_POR_SLUG=Object.freeze(${json(ofertas)});\n` +
    `${FIN}`;
}
export function contenidoApp({ revisadoEl, criterios, ofertas }) {
  return '/* GENERADO por rwadar-editorial-source/ofertas/transparencia.mjs a partir de\n' +
    '   rwadar-editorial-source/ofertas/transparencia.json. No se edita a mano: cambia el\n' +
    '   JSON y ejecuta node rwadar-editorial-source/ofertas/transparencia.mjs.\n' +
    '   Es una comprobación de la documentación, no una recomendación de inversión.\n' +
    '   Una oferta sin entrada, o cuya verificadaEl no coincida con la del catálogo, no\n' +
    '   enseña puntos fuertes ni entra en la Selección. */\n' +
    `export const TRANSPARENCIA_REVISADA_EL = ${json(revisadoEl)};\n\n` +
    `export const CRITERIOS_TRANSPARENCIA = ${JSON.stringify(criterios, null, 2)};\n\n` +
    `export const TRANSPARENCIA_POR_SLUG = ${JSON.stringify(ofertas, null, 2)};\n`;
}
export function aplicarBloque(js, bloque) {
  const a = js.indexOf(INICIO), b = js.indexOf(FIN);
  if (a < 0 || b < a || js.indexOf(INICIO, a + 1) >= 0) falla('rwadar-20260820.js', 'no encuentro un único bloque «transparencia»');
  return js.slice(0, a) + bloque + js.slice(b + FIN.length);
}

export function construirSalidas(datos = cargarTransparencia()) {
  return { web: aplicarBloque(fs.readFileSync(JS_WEB, 'utf8'), bloqueWeb(datos)), app: contenidoApp(datos) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const datos = cargarTransparencia();
    const salidas = construirSalidas(datos);
    const resumen = `${Object.keys(datos.ofertas).length} ofertas con transparencia` +
      (datos.sinEntrada.length ? `; sin entrada (no enseñan nada): ${datos.sinEntrada.join(', ')}` : '');
    if (datos.avisoRevision) console.warn(`Aviso: ${datos.avisoRevision}`);
    if (process.argv.includes('--comprobar')) {
      const distintos = [[JS_WEB, salidas.web], [DATOS_APP, salidas.app]]
        .filter(([ruta, esperado]) => !fs.existsSync(ruta) || fs.readFileSync(ruta, 'utf8') !== esperado)
        .map(([ruta]) => path.relative(RAIZ, ruta));
      if (distintos.length) {
        console.error(`Transparencia desactualizada en: ${distintos.join(', ')}. Ejecuta node rwadar-editorial-source/ofertas/transparencia.mjs`);
        process.exit(1);
      }
      console.log(`Transparencia al día: ${resumen}`);
    } else {
      fs.writeFileSync(JS_WEB, salidas.web);
      fs.writeFileSync(DATOS_APP, salidas.app);
      console.log(`Transparencia escrita: ${resumen}`);
    }
  } catch (e) {
    if (e instanceof ErrorTransparencia) { console.error(`Transparencia no válida · ${e.message}`); process.exit(1); }
    throw e;
  }
}
