// Fecha de alta de cada plataforma en el radar: de altas.json a la web y a la app.
//
// Para el orden «Más nuevas primero» de la lista de plataformas (27/11/2026,
// orden de Víctor: «las más nuevas van primero… en plataformas»), como
// anadidaEl de transparencia.json para Ofertas. La fecha es un HECHO del
// repositorio, no una estimación: el primer lote del catálogo
// (rwadar-app/data/verificaciones/<lote>/radar-canonico-26.json) en que aparece
// la plataforma. Las del catálogo inicial llevan la del primer lote guardado
// (2026-09-21). Una entrada con «lote»: null es una alta anotada a mano (una
// entrega que aún no está en main) y dice su «origen».
//
// Este script valida el archivo y escribe:
//   1. el bloque «altas-plataformas» de rwadar-site/assets/rwadar-20260820.js
//   2. rwadar-movil/lib/altas-plataformas-contenido.js
//
//   node rwadar-editorial-source/plataformas/altas.mjs              añade las que falten (desde los lotes) y genera
//   node rwadar-editorial-source/plataformas/altas.mjs --comprobar  solo comprueba (npm test)
//
// No toca la red. Una plataforma sin fecha no rompe nada: va al final, por nombre.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
const require = createRequire(import.meta.url);
const { leerCatalogo } = require('../../rwadar-fichas.js');

export const FUENTE = path.join(AQUI, 'altas.json');
export const JS_WEB = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
export const DATOS_APP = path.join(RAIZ, 'rwadar-movil', 'lib', 'altas-plataformas-contenido.js');
const LOTES = ['rwadar-app', 'data', 'verificaciones'];
const RADAR = 'radar-canonico-26.json';
const INICIO = '/* altas-plataformas:inicio */';
const FIN = '/* altas-plataformas:fin */';
const CLAVES = ['anadidaEl', 'lote', 'origen'];

class ErrorAltas extends Error {}
const falla = (donde, mensaje) => { throw new ErrorAltas(`${donde}: ${mensaje}`); };

function fechaValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

/* Primer lote del repositorio en que aparece cada plataforma: slug → { anadidaEl, lote }.
   Los lotes se ordenan por nombre («2026-11-26-v2» < «2026-11-26.2-v2»). */
export function derivarDeLotes(raiz = RAIZ) {
  const dir = path.join(raiz, ...LOTES);
  const primero = new Map();
  for (const lote of fs.readdirSync(dir).sort()) {
    const archivo = path.join(dir, lote, RADAR);
    if (!fs.existsSync(archivo)) continue;
    const fecha = lote.slice(0, 10);
    if (!fechaValida(fecha)) falla(`${lote}/${RADAR}`, 'el nombre del lote no empieza por una fecha');
    const radar = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    if (!Array.isArray(radar.plataformas)) falla(`${lote}/${RADAR}`, 'faltan las plataformas');
    for (const p of radar.plataformas) {
      if (!p || typeof p.slug !== 'string' || !p.slug) falla(`${lote}/${RADAR}`, 'plataforma sin slug');
      if (!primero.has(p.slug)) primero.set(p.slug, { anadidaEl: fecha, lote });
    }
  }
  return primero;
}

/* Valida el archivo y devuelve lo que se publica. */
export function cargarAltas({ raiz = RAIZ, datos, catalogo: catalogoDado, lotes: lotesDados, hoy } = {}) {
  const fuente = datos || JSON.parse(fs.readFileSync(FUENTE, 'utf8'));
  if (fuente.versionEsquema !== 1) falla('altas.json', 'versionEsquema debe ser 1');
  const sobra = Object.keys(fuente).filter(k => !['versionEsquema', 'nota', 'plataformas'].includes(k));
  if (sobra.length) falla('altas.json', `claves desconocidas: ${sobra.join(', ')}`);
  if (!fuente.plataformas || typeof fuente.plataformas !== 'object' || Array.isArray(fuente.plataformas))
    falla('altas.json', 'faltan las plataformas');
  const lotes = lotesDados || derivarDeLotes(raiz);
  const limite = hoy || new Date().toISOString().slice(0, 10);
  const altas = {};
  for (const slug of Object.keys(fuente.plataformas).sort()) {
    const e = fuente.plataformas[slug], donde = `plataformas.${slug}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) falla(donde, 'slug no válido');
    if (!e || typeof e !== 'object' || Array.isArray(e)) falla(donde, 'entrada no válida');
    const ajenas = Object.keys(e).filter(k => !CLAVES.includes(k));
    if (ajenas.length) falla(donde, `claves desconocidas: ${ajenas.join(', ')}`);
    if (!fechaValida(e.anadidaEl) || e.anadidaEl > limite) falla(donde, `anadidaEl no válida o futura: ${e.anadidaEl}`);
    if (e.lote === null) {
      // Alta anotada a mano: tiene que decir de dónde sale.
      if (typeof e.origen !== 'string' || e.origen.trim().length < 12 || /[<>\u0000-\u001f]/.test(e.origen))
        falla(donde, 'una alta sin lote necesita su «origen»');
    } else {
      if (typeof e.lote !== 'string') falla(donde, '«lote» debe ser el nombre de un lote o null');
      if (e.origen !== undefined) falla(donde, '«origen» solo va en las altas sin lote');
      const derivada = lotes.get(slug);
      if (!derivada) falla(donde, `no aparece en ningún lote de ${LOTES.join('/')}`);
      if (derivada.lote !== e.lote || derivada.anadidaEl !== e.anadidaEl)
        falla(donde, `el primer lote en que aparece es ${derivada.lote} (${derivada.anadidaEl}), no ${e.lote} (${e.anadidaEl})`);
    }
    altas[slug] = e.anadidaEl;
  }
  const catalogo = catalogoDado || leerCatalogo(raiz);
  const enCatalogo = new Set(catalogo.plataformas.map(p => p.slug));
  return {
    altas,
    sinFecha: catalogo.plataformas.map(p => p.slug).filter(s => !Object.hasOwn(altas, s)).sort(),
    fueraDelCatalogo: Object.keys(altas).filter(s => !enCatalogo.has(s)),
  };
}

/* Añade, desde los lotes, las plataformas del catálogo que aún no tienen fecha. */
export function completarDesdeLotes(fuente, { raiz = RAIZ, catalogo = leerCatalogo(raiz), lotes = derivarDeLotes(raiz) } = {}) {
  const plataformas = { ...fuente.plataformas };
  const nuevas = [], sinLote = [];
  for (const { slug } of catalogo.plataformas) {
    if (Object.hasOwn(plataformas, slug)) continue;
    const d = lotes.get(slug);
    if (!d) { sinLote.push(slug); continue; }
    plataformas[slug] = { anadidaEl: d.anadidaEl, lote: d.lote };
    nuevas.push(slug);
  }
  const ordenadas = Object.fromEntries(Object.keys(plataformas).sort().map(s => [s, plataformas[s]]));
  return { fuente: { ...fuente, plataformas: ordenadas }, nuevas, sinLote };
}

const json = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));

export function bloqueWeb({ altas }) {
  return `${INICIO}\n` +
    '/* GENERADO por rwadar-editorial-source/plataformas/altas.mjs desde altas.json: no se edita a mano.\n' +
    '   Fecha de alta de cada plataforma en el radar (primer lote del repositorio en que aparece). */\n' +
    `const ALTA_PLATAFORMA_POR_SLUG=Object.freeze(${json(altas)});\n` +
    `${FIN}`;
}
export function contenidoApp({ altas }) {
  return '/* GENERADO por rwadar-editorial-source/plataformas/altas.mjs a partir de\n' +
    '   rwadar-editorial-source/plataformas/altas.json. No se edita a mano: cambia el\n' +
    '   JSON y ejecuta node rwadar-editorial-source/plataformas/altas.mjs.\n' +
    '   Fecha de alta de cada plataforma en el radar (primer lote del repositorio en\n' +
    '   que aparece), para el orden «Más nuevas primero». Una plataforma sin fecha va\n' +
    '   al final, por nombre. */\n' +
    `export const ALTA_PLATAFORMA_POR_SLUG = ${JSON.stringify(altas, null, 2)};\n`;
}
export function aplicarBloque(js, bloque) {
  const a = js.indexOf(INICIO), b = js.indexOf(FIN);
  if (a < 0 || b < a || js.indexOf(INICIO, a + 1) >= 0) falla('rwadar-20260820.js', 'no encuentro un único bloque «altas-plataformas»');
  return js.slice(0, a) + bloque + js.slice(b + FIN.length);
}
export function construirSalidas(datos = cargarAltas()) {
  return { web: aplicarBloque(fs.readFileSync(JS_WEB, 'utf8'), bloqueWeb(datos)), app: contenidoApp(datos) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const comprobar = process.argv.includes('--comprobar');
    let fuente = JSON.parse(fs.readFileSync(FUENTE, 'utf8'));
    if (!comprobar) {
      const r = completarDesdeLotes(fuente);
      if (r.sinLote.length) falla('altas.json', `sin fecha y sin lote que la dé: ${r.sinLote.join(', ')} (añádelas a mano con «lote»: null y su «origen»)`);
      if (r.nuevas.length) {
        fuente = r.fuente;
        fs.writeFileSync(FUENTE, JSON.stringify(fuente, null, 2) + '\n');
        console.log(`Altas añadidas desde los lotes: ${r.nuevas.join(', ')}`);
      }
    }
    const datos = cargarAltas({ datos: fuente });
    const salidas = construirSalidas(datos);
    const resumen = `${Object.keys(datos.altas).length} plataformas con fecha de alta` +
      (datos.fueraDelCatalogo.length ? `; aún no en el catálogo publicado: ${datos.fueraDelCatalogo.join(', ')}` : '');
    if (comprobar) {
      if (datos.sinFecha.length) {
        console.error(`Plataformas del catálogo sin fecha de alta: ${datos.sinFecha.join(', ')}. Ejecuta node rwadar-editorial-source/plataformas/altas.mjs`);
        process.exit(1);
      }
      const distintos = [[JS_WEB, salidas.web], [DATOS_APP, salidas.app]]
        .filter(([ruta, esperado]) => !fs.existsSync(ruta) || fs.readFileSync(ruta, 'utf8') !== esperado)
        .map(([ruta]) => path.relative(RAIZ, ruta));
      if (distintos.length) {
        console.error(`Altas de plataformas desactualizadas en: ${distintos.join(', ')}. Ejecuta node rwadar-editorial-source/plataformas/altas.mjs`);
        process.exit(1);
      }
      console.log(`Altas de plataformas al día: ${resumen}`);
    } else {
      fs.writeFileSync(JS_WEB, salidas.web);
      fs.writeFileSync(DATOS_APP, salidas.app);
      console.log(`Altas de plataformas escritas: ${resumen}`);
    }
  } catch (e) {
    if (e instanceof ErrorAltas) { console.error(`Altas de plataformas no válidas · ${e.message}`); process.exit(1); }
    throw e;
  }
}
