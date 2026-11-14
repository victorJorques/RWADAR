// Reglas deterministas de una edición automática (V-1 … V-16 del diseño).
// Se juzga cada edición contra su propio «actualizadoEl», nunca contra el
// reloj: así la CI puede volver a validar cualquier carpeta cualquier día.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { RUTAS, ARCHIVOS_NOTICIAS, sha256, leerJSON, sumarDias, fechaEspana, listarArchivos, git, esFecha } from './comun.mjs';
import { buscarPersonas, buscarPersonasEn } from './personas.mjs';

const require = createRequire(import.meta.url);
const modulos = raiz => ({
  modelo: require(path.join(raiz, 'rwadar-movil/lib/noticias-sector.js')),
  fotos: require(path.join(raiz, 'rwadar-noticias-editoriales.js')),
  v1: require(path.join(raiz, 'rwadar-app/noticias/noticias-v1.cjs')),
});

// Los archivos que puede llevar la carpeta del día (V-15). Los de «obligatorios» siempre.
export const ARCHIVOS_CARPETA = Object.freeze({
  obligatorios: ['titulares.json', 'barrido.json', 'inventario-fuentes.json', 'verificacion.json', 'VERIFICACION.md', 'EDICION.md'],
  opcionales: ['verificacion-2.json', 'VERIFICACION-2.md', 'correcciones.json', 'inventario-consultas.txt', 'validacion.json', 'resultado.json'],
});
export const nombreEdicion = fecha => `noticias-${fecha}.json`;
export const carpetaDelDia = fecha => `${RUTAS.diarias}/${fecha}`;

// Campos de texto que se publican (castellano e inglés).
const CAMPOS_TEXTO = ['titulo', 'resumen', 'porQueImporta', 'tituloInformativo'];
// V-10: promesas, consejos y llamadas a comprar.
export const PROMESAS = Object.freeze([
  /garantiz/i, /\bsin riesgos?\b/i, /\basegurad[oa]s?\b/i, /rentabilidad asegurada/i, /oportunidad [úu]nica/i,
  /(?:^|[.!¡?¿:]\s*)(?:compra|vende|invierte|aprovecha)\b/iu, /\b(?:c[óo]mpral[oa]s?|v[ée]ndel[oa]s?|invierte ya|compra ya|compra ahora|no te lo pierdas)\b/iu,
  /\bguarantee/i, /\brisk[- ]free\b/i, /\b(?:buy|sell|invest) now\b/i, /(?:^|[.!?:]\s*)(?:buy|sell)\b/i, /\bdon'?t miss\b/i, /\bonce[- ]in[- ]a[- ]lifetime\b/i,
]);

function textosDe(n) {
  const salida = [];
  for (const c of CAMPOS_TEXTO) if (typeof n[c] === 'string') salida.push([c, n[c]]);
  for (const c of CAMPOS_TEXTO) if (typeof n.en?.[c] === 'string') salida.push([`en.${c}`, n.en[c]]);
  return salida;
}
const largo = t => [...String(t)].length;
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Orden de la edición tal como lo deja el motor (las de hoy primero y de la
   más nueva a la más antigua; a igual fecha, el orden del archivo). */
export function ordenar(noticias, modelo) {
  const limpias = modelo.validarNoticias({ version: 1, actualizadoEl: '9999-12-31', noticias }).noticias.map(n => n.id);
  return limpias.map(id => noticias.find(n => n.id === id));
}

/* Las claves que conoce la edición publicada (V-13). */
export function clavesDe(edicion) {
  const raiz = new Set(Object.keys(edicion || {})), noticia = new Set(), en = new Set(), fuente = new Set();
  for (const n of edicion?.noticias || []) {
    Object.keys(n || {}).forEach(k => noticia.add(k));
    Object.keys(n?.en || {}).forEach(k => en.add(k));
    Object.keys(n?.fuente || {}).forEach(k => fuente.add(k));
  }
  return { raiz, noticia, en, fuente };
}

/* ¿Solo cambian las fechas frente a la publicada? */
export function soloCambianFechas(edicion, referencia) {
  if (!referencia) return false;
  const quitar = e => ({ ...e, actualizadoEl: null, noticias: (e.noticias || []).map(n => ({ ...n, consultadaEl: null })) });
  return igual(quitar(edicion), quitar(referencia));
}

/* El sello automático solo puede cambiar el commit, la huella y la nota
   (nunca «actualizadoEl»: la caducidad de 7 días es de la revisión humana). */
export function cambiosDelSello(antes, despues) {
  const cambios = [];
  const visitar = (a, b, ruta) => {
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) visitar(a[k], b[k], ruta ? `${ruta}.${k}` : k);
    } else if (!igual(a, b)) cambios.push(ruta);
  };
  visitar(antes, despues, '');
  return cambios;
}
export const CAMBIOS_SELLO_PERMITIDOS = Object.freeze(['nota', 'revisionAprobada.commit', 'revisionAprobada.contenidoSha256']);

/* Los archivos que cambian en el árbol frente a «base» (incluidos los nuevos sin añadir). */
export function archivosCambiados(raiz, base) {
  const dif = git(['-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', base], { cwd: raiz }).salida;
  const nuevos = git(['-c', 'core.quotePath=false', 'ls-files', '--others', '--exclude-standard'], { cwd: raiz }).salida;
  return [...new Set([...dif.split('\n'), ...nuevos.split('\n')].map(l => l.trim()).filter(Boolean))].sort();
}
export function archivoPermitido(rel, fecha, { conSello = false } = {}) {
  if (ARCHIVOS_NOTICIAS.includes(rel)) return true;
  if (conSello && rel === RUTAS.sello) return true;
  const prefijo = carpetaDelDia(fecha) + '/';
  if (!rel.startsWith(prefijo)) return false;
  const nombre = rel.slice(prefijo.length);
  return nombre === nombreEdicion(fecha) || ARCHIVOS_CARPETA.obligatorios.includes(nombre) || ARCHIVOS_CARPETA.opcionales.includes(nombre);
}

/* Cuál es la verificación que cuenta: la del segundo pase si hubo correcciones. */
export function verificacionFinal(carpeta) {
  const dos = path.join(carpeta, 'verificacion-2.json');
  return fs.existsSync(dos) ? { ruta: dos, pase: 2 } : { ruta: path.join(carpeta, 'verificacion.json'), pase: 1 };
}

/* Comprueba un veredicto «conforme» atado a los bytes (V-14). */
export function comprobarConforme(ver, { bytes, ids, pase, fecha }) {
  const fallos = [];
  if (!ver || typeof ver !== 'object') return ['la verificación no es un objeto'];
  if (ver.version !== 1) fallos.push('verificación: version debe ser 1');
  if (ver.pase !== pase) fallos.push(`verificación: se esperaba el pase ${pase} y dice ${ver.pase}`);
  if (fecha && ver.fecha !== fecha) fallos.push(`verificación: fecha ${ver.fecha}, se esperaba ${fecha}`);
  if (ver.edicionSha256 !== sha256(bytes)) fallos.push('verificación: edicionSha256 no es el SHA-256 de los bytes que se publican');
  if (ver.veredicto !== 'conforme') fallos.push(`verificación: veredicto «${ver.veredicto}», no «conforme»`);
  if (Array.isArray(ver.correcciones) ? ver.correcciones.length : true) fallos.push('verificación: un veredicto conforme no lleva correcciones');
  if (ver.hoyCorrecto !== true) fallos.push('verificación: «Hoy» no está confirmado (hoyCorrecto)');
  const lista = Array.isArray(ver.noticias) ? ver.noticias : [];
  const vistos = lista.map(n => n?.id);
  if (!igual([...vistos].sort(), [...ids].sort())) fallos.push(`verificación: debe haber una entrada por noticia (${ids.join(', ')}) y hay ${vistos.join(', ') || 'ninguna'}`);
  for (const n of lista) {
    const d = `verificación de ${n?.id}`;
    if (n?.veredicto !== 'confirmada') fallos.push(`${d}: «${n?.veredicto}», no «confirmada»`);
    if (n?.titularRespaldado !== true) fallos.push(`${d}: la fuente no respalda el titular`);
    if (n?.fotoAdecuada !== true) fallos.push(`${d}: la foto no es adecuada`);
    if (n?.personas !== false) fallos.push(`${d}: hay nombres de personas o no se comprobó`);
    if (n?.fechaCorrecta !== true) fallos.push(`${d}: la fecha no está confirmada`);
    if (typeof n?.literal !== 'string' || !n.literal.trim() || largo(n.literal) > 400) fallos.push(`${d}: falta la cita literal de la fuente (1-400 caracteres)`);
    const f = n?.fuente || {};
    if (f.caida === true) { if (f.http === 200) fallos.push(`${d}: fuente marcada como caída con HTTP 200`); }
    else if (f.http !== 200 || !/^[0-9a-f]{64}$/.test(String(f.sha256 || ''))) fallos.push(`${d}: la fuente debe constar abierta (HTTP 200 y su SHA-256)`);
  }
  return fallos;
}

/* ---- La validación ----
   fase «editor»: lo que entrega el editor (o el corregido), antes de la carpeta.
   fase «final»: la carpeta del día ya en el repositorio, con su verificación.
   fase «publicada»: una carpeta guardada (para npm test y la CI): V-1…V-12, V-14 y V-15. */
export function validarEdicion({ fase, fecha, raiz, config, edicionRuta, titularesRuta, inventario, referencia, carpeta, base, conSello = false }) {
  const { modelo, fotos: modFotos, v1 } = modulos(raiz);
  const reglas = [];
  const regla = (id, fallos, nombre) => { reglas.push({ id, nombre, ok: fallos.length === 0, detalle: fallos }); return fallos.length === 0; };
  const bytes = fs.readFileSync(edicionRuta);
  let edicion;
  try { edicion = JSON.parse(bytes.toString('utf8')); } catch (e) { edicion = null; }
  const noticias = Array.isArray(edicion?.noticias) ? edicion.noticias : [];
  const ids = noticias.map(n => n?.id);
  const refPorId = new Map((referencia?.noticias || []).map(n => [n.id, n]));
  const inventarioPorUrl = new Map((inventario?.fuentes || []).map(f => [f.url, f]));
  const fotosJSON = leerJSON(path.join(raiz, RUTAS.fotos)).fotos || {};
  const max = config.titulares.maxCaracteres;

  // V-1 Forma (el motor de la web y la app) y fecha de la carpeta.
  {
    const f = [];
    if (!edicion) f.push('no es JSON válido');
    else {
      try {
        modelo.validarNoticias(edicion);
        const orden = ordenar(noticias, modelo).map(n => n.id);
        if (!igual(orden, ids)) f.push(`el archivo no va en el orden del motor (${orden.join(', ')})`);
      } catch (e) { f.push(e.message); }
      if (edicion.actualizadoEl !== fecha) f.push(`actualizadoEl es ${edicion.actualizadoEl} y la carpeta es del ${fecha}`);
    }
    regla('V-1', f, 'forma del motor y fecha de la edición');
  }
  // V-2 Foto en todas, de la biblioteca y comprobada.
  {
    const f = [];
    for (const n of noticias) if (typeof n?.imagen !== 'string') f.push(`${n?.id}: sin «imagen»`);
    else if (!Object.hasOwn(fotosJSON, n.imagen)) f.push(`${n.id}: la foto «${n.imagen}» no está en fotos.json`);
    if (!f.length && noticias.length) {
      try { modFotos.cargarFotosNoticias(raiz, { claves: [...new Set(noticias.map(n => n.imagen))] }); }
      catch (e) { f.push(e.message); }
    }
    regla('V-2', f, 'foto de la biblioteca en todas');
  }
  // V-3 Fotos distintas en toda la edición (Inicio enseña 3 y /mercado/ todas a la vez).
  {
    const vistas = new Map(), f = [];
    for (const n of noticias) {
      if (typeof n?.imagen !== 'string') continue;
      if (vistas.has(n.imagen)) f.push(`«${n.imagen}» se repite en ${vistas.get(n.imagen)} y ${n.id}`);
      else vistas.set(n.imagen, n.id);
    }
    regla('V-3', f, 'fotos distintas');
  }
  // V-4 Secciones, ventanas de fechas y total.
  {
    const e = config.edicion, f = [];
    const hoy = noticias.filter(n => n?.seccion === 'hoy'), imp = noticias.filter(n => n?.seccion === 'importante');
    if (hoy.length > e.hoyMax) f.push(`${hoy.length} de «Hoy» (máximo ${e.hoyMax})`);
    if (imp.length > e.importanteMax) f.push(`${imp.length} de «Lo más importante» (máximo ${e.importanteMax})`);
    if (noticias.length < e.totalMin || noticias.length > e.totalMax) f.push(`${noticias.length} noticias (entre ${e.totalMin} y ${e.totalMax})`);
    for (const n of hoy) if (![fecha, sumarDias(fecha, -1)].includes(n.fecha)) f.push(`${n.id}: «Hoy» con fecha ${n.fecha} (solo ${fecha} o ${sumarDias(fecha, -1)})`);
    const desde = sumarDias(fecha, -e.diasImportante);
    for (const n of imp) if (!(n.fecha >= desde)) f.push(`${n.id}: «importante» del ${n.fecha}, fuera de los ${e.diasImportante} días (desde ${desde})`);
    regla('V-4', f, '«Hoy», «Lo más importante» y total');
  }
  // V-5 consultadaEl de hoy, salvo fuente caída (entonces, idéntica a la publicada).
  {
    const f = [];
    for (const n of noticias) {
      const inv = inventarioPorUrl.get(n?.fuente?.url);
      const caida = inv && inv.http !== 200;
      if (n?.consultadaEl === fecha) {
        if (caida && fase !== 'publicada') f.push(`${n.id}: dice consultada hoy y su fuente no responde (HTTP ${inv.http})`);
        continue;
      }
      if (!caida) { f.push(`${n?.id}: consultadaEl ${n?.consultadaEl} y su fuente responde: debe ser ${fecha}`); continue; }
      const ref = refPorId.get(n.id);
      if (!ref) f.push(`${n.id}: fuente caída y no estaba publicada`);
      else if (!igual(ref, n)) f.push(`${n.id}: fuente caída: debe quedar letra a letra como la publicada (también consultadaEl)`);
    }
    regla('V-5', f, 'consultada hoy, o intacta si su fuente cayó');
  }
  // V-6 Una noticia que ya estaba conserva su fecha y su fuente.
  {
    const f = [];
    for (const n of noticias) {
      const ref = refPorId.get(n?.id);
      if (ref && (ref.fecha !== n.fecha || ref.fuente?.url !== n.fuente?.url)) f.push(`${n.id}: cambia su fecha o su fuente (${ref.fecha} → ${n.fecha})`);
    }
    regla('V-6', f, 'las que ya estaban conservan fecha y fuente');
  }
  // V-7 Titulares cortos en los dos idiomas.
  {
    const f = [];
    for (const n of noticias) {
      if (largo(n?.titulo) > max) f.push(`${n.id}: titular de ${largo(n.titulo)} caracteres (máximo ${max})`);
      if (largo(n?.en?.titulo) > max) f.push(`${n.id}: titular inglés de ${largo(n.en.titulo)} caracteres (máximo ${max})`);
    }
    regla('V-7', f, `titulares de ${max} caracteres como mucho`);
  }
  // V-8 titulares.json: varias propuestas, elegido entre ellas y guía actual.
  let titulares = null;
  {
    const f = [];
    try { titulares = leerJSON(titularesRuta); } catch (e) { f.push(e.message); }
    const guia = path.join(raiz, RUTAS.guia);
    if (titulares) {
      if (titulares.version !== 1) f.push('titulares.json: version debe ser 1');
      if (titulares.fecha !== fecha) f.push(`titulares.json: fecha ${titulares.fecha}, se esperaba ${fecha}`);
      if (!fs.existsSync(guia)) f.push(`falta la guía de titulares (${RUTAS.guia})`);
      else if (titulares.guia?.ruta !== RUTAS.guia || titulares.guia?.sha256 !== sha256(fs.readFileSync(guia))) {
        f.push('titulares.json: la guía no es la actual (ruta y SHA-256 de GUIA-TITULARES.md)');
      }
      const lista = Array.isArray(titulares.noticias) ? titulares.noticias : [];
      const deIds = lista.map(t => t?.id);
      if (!igual([...deIds].sort(), [...ids].sort())) f.push(`titulares.json: una entrada por noticia (${ids.join(', ')}); tiene ${deIds.join(', ') || 'ninguna'}`);
      for (const t of lista) {
        const n = noticias.find(x => x?.id === t?.id);
        if (!n) continue;
        const d = `titulares de ${t.id}`;
        if (t.elegido?.es !== n.titulo || t.elegido?.en !== n.en?.titulo) f.push(`${d}: el elegido no es el titular de la noticia`);
        if (typeof t.motivo !== 'string' || !t.motivo.trim() || largo(t.motivo) > 300) f.push(`${d}: falta el motivo (una frase)`);
        if (t.heredado != null) {
          const ref = refPorId.get(t.id);
          const previa = esFecha(t.heredado) ? path.join(raiz, RUTAS.diarias, t.heredado, 'titulares.json') : null;
          let otro = null;
          try { otro = previa && fs.existsSync(previa) ? leerJSON(previa).noticias?.find(x => x?.id === t.id) : null; } catch { otro = null; }
          if (!ref || ref.titulo !== n.titulo || ref.en?.titulo !== n.en?.titulo) f.push(`${d}: «heredado» solo si el titular es el publicado`);
          else if (!otro || otro.elegido?.es !== n.titulo || otro.elegido?.en !== n.en?.titulo) f.push(`${d}: «heredado» del ${t.heredado} no tiene ese mismo elegido en su titulares.json`);
          continue;
        }
        for (const idioma of ['es', 'en']) {
          const p = t.propuestas?.[idioma];
          if (!Array.isArray(p) || new Set(p).size !== p.length || p.length < config.titulares.propuestasMin) {
            f.push(`${d}: al menos ${config.titulares.propuestasMin} propuestas distintas en «${idioma}»`);
            continue;
          }
          if (!p.includes(t.elegido?.[idioma])) f.push(`${d}: el elegido en «${idioma}» no está entre las propuestas`);
          for (const x of p) if (typeof x !== 'string' || !x.trim() || largo(x) > max) f.push(`${d}: propuesta «${String(x).slice(0, 30)}…» vacía o de más de ${max}`);
        }
      }
    }
    regla('V-8', f, 'titulares: propuestas, elegido y guía');
  }
  // V-9 La foto elegida, y la genérica solo con lo que faltaría anotado.
  {
    const f = [], usadas = noticias.map(n => n?.imagen);
    for (const t of titulares?.noticias || []) {
      const n = noticias.find(x => x?.id === t?.id);
      if (!n) continue;
      const foto = t.foto || {};
      const d = `foto de ${t.id}`;
      if (foto.clave !== n.imagen) f.push(`${d}: «foto.clave» no es la «imagen» de la noticia`);
      if (!Array.isArray(foto.alternativas) || foto.alternativas.some(a => !Object.hasOwn(fotosJSON, a))) f.push(`${d}: «alternativas» debe ser una lista de fotos de la biblioteca`);
      if (foto.encaje === 'propia') {
        if (foto.faltaria != null) f.push(`${d}: con una foto propia, «faltaria» va en null`);
      } else if (foto.encaje === 'generica') {
        const generica = config.fotos.genericas[n.categoria];
        const otraUsada = usadas.filter(c => c === generica).length > 0 && n.imagen !== generica;
        if (n.imagen !== generica && !otraUsada) f.push(`${d}: genérica de «${n.categoria}» es «${generica}» (solo otra si esa ya está usada)`);
        if (typeof foto.faltaria !== 'string' || !foto.faltaria.trim() || largo(foto.faltaria) > 200) f.push(`${d}: con una genérica, «faltaria» dice qué foto haría falta`);
      } else f.push(`${d}: «encaje» debe ser «propia» o «generica»`);
    }
    regla('V-9', f, 'foto elegida y genéricas anotadas');
  }
  // V-10 Sin promesas ni consejos.
  {
    const f = [];
    const textos = noticias.flatMap(n => textosDe(n || {}).map(([c, t]) => [`${n?.id}.${c}`, t]));
    for (const t of titulares?.noticias || []) for (const idioma of ['es', 'en']) for (const p of t.propuestas?.[idioma] || []) textos.push([`propuesta de ${t.id}`, p]);
    for (const [donde, t] of textos) for (const re of PROMESAS) if (re.test(t)) { f.push(`${donde}: «${String(t).slice(0, 50)}» (${re})`); break; }
    regla('V-10', f, 'sin promesas ni consejos');
  }
  // V-11 Sin datos personales (en la carpeta del día, en todos sus archivos).
  {
    const f = buscarPersonasEn(edicion).map(h => `${h.donde}: ${h.regla} («${h.trozo}»)`);
    if (titulares) for (const h of buscarPersonasEn(titulares)) f.push(`titulares.json ${h.donde}: ${h.regla} («${h.trozo}»)`);
    if (carpeta && fs.existsSync(carpeta)) {
      for (const a of listarArchivos(carpeta)) {
        if (a.rel === nombreEdicion(fecha) || a.rel === 'titulares.json' || a.enlace) continue;
        const texto = fs.readFileSync(a.ruta, 'utf8');
        texto.split('\n').forEach((linea, i) => { const h = buscarPersonas(linea); if (h) f.push(`${a.rel}:${i + 1}: ${h.regla} («${h.trozo}»)`); });
      }
    }
    regla('V-11', f, 'sin nombres con tratamiento, nombramientos, correos ni teléfonos');
  }
  // V-12 Fuentes https y abiertas hoy por el programa (no por el editor).
  {
    const f = [];
    if (!inventario) f.push('falta el inventario de fuentes del programa (comprobar-fuentes)');
    else if (inventario.fecha !== fecha) f.push(`el inventario de fuentes es del ${inventario.fecha}`);
    for (const n of noticias) {
      const url = n?.fuente?.url;
      if (!/^https:\/\//.test(String(url))) { f.push(`${n?.id}: la fuente no es https`); continue; }
      if (!inventario) continue;
      const inv = inventarioPorUrl.get(url);
      if (!inv) { f.push(`${n.id}: el programa no abrió su fuente`); continue; }
      if (n.consultadaEl !== fecha) continue; // fuente caída: lo juzga V-5
      if (inv.http !== 200 || !/^[0-9a-f]{64}$/.test(String(inv.sha256 || ''))) f.push(`${n.id}: su fuente dio HTTP ${inv.http} al programa`);
      else if (fechaEspana(new Date(inv.horaUtc)) !== fecha) f.push(`${n.id}: su fuente se abrió el ${fechaEspana(new Date(inv.horaUtc))}, no hoy`);
    }
    regla('V-12', f, 'fuentes https abiertas hoy por el programa');
  }
  // V-13 Ninguna clave que la edición publicada no tenga (la app instalada rechaza las desconocidas).
  if (fase !== 'publicada') {
    const f = [];
    if (!referencia) f.push('falta la edición publicada para comparar las claves');
    else {
      const ref = clavesDe(referencia), mia = clavesDe(edicion), extra = new Set(config.clavesNuevasPermitidas);
      for (const [grupo, nombre] of [['raiz', 'del archivo'], ['noticia', 'de noticia'], ['en', 'de «en»'], ['fuente', 'de «fuente»']]) {
        for (const k of mia[grupo]) if (!ref[grupo].has(k) && !extra.has(k)) f.push(`clave ${nombre} nueva: «${k}»`);
      }
    }
    regla('V-13', f, 'ninguna clave nueva frente a la publicada');
  }
  // V-14 a V-16, con la carpeta del día ya hecha.
  if (fase === 'final' || fase === 'publicada') {
    {
      const f = [];
      const { ruta, pase } = verificacionFinal(carpeta);
      try {
        f.push(...comprobarConforme(leerJSON(ruta), { bytes, ids, pase, fecha }));
        if (pase === 2) {
          const uno = leerJSON(path.join(carpeta, 'verificacion.json'));
          if (uno.veredicto !== 'con_cambios') f.push('hay segundo pase sin que el primero pidiera cambios');
          const corr = path.join(carpeta, 'correcciones.json');
          if (!fs.existsSync(corr)) f.push('falta correcciones.json (lo que el programa aplicó)');
          else if (leerJSON(corr).verificacionSha256 !== sha256(fs.readFileSync(path.join(carpeta, 'verificacion.json')))) f.push('correcciones.json no es de esta verificación');
        } else if (fs.existsSync(path.join(carpeta, 'correcciones.json'))) f.push('hay correcciones sin segundo pase del verificador');
      } catch (e) { f.push(e.message); }
      regla('V-14', f, 'verificación «conforme» atada a los bytes');
    }
    {
      const f = [];
      let total = 0;
      const permitidos = new Set([nombreEdicion(fecha), ...ARCHIVOS_CARPETA.obligatorios, ...ARCHIVOS_CARPETA.opcionales]);
      for (const a of listarArchivos(carpeta)) {
        if (a.enlace) f.push(`${a.rel}: enlace no permitido`);
        if (!permitidos.has(a.rel)) f.push(`${a.rel}: archivo no permitido en la carpeta del día`);
        if (!config.carpeta.extensiones.includes(path.extname(a.rel))) f.push(`${a.rel}: extensión no permitida`);
        total += fs.statSync(a.ruta).size;
      }
      for (const o of [nombreEdicion(fecha), ...ARCHIVOS_CARPETA.obligatorios]) if (!fs.existsSync(path.join(carpeta, o))) f.push(`falta ${o}`);
      if (total > config.carpeta.maxBytes) f.push(`la carpeta ocupa ${total} B (máximo ${config.carpeta.maxBytes})`);
      if (fase === 'final') {
        const v2 = path.join(raiz, RUTAS.v2), v1r = path.join(raiz, RUTAS.v1);
        if (!fs.existsSync(v2) || !fs.readFileSync(v2).equals(bytes)) f.push(`${RUTAS.v2} no es byte a byte la edición de la carpeta`);
        else if (!fs.existsSync(v1r) || fs.readFileSync(v1r, 'utf8') !== v1.derivarV1(bytes.toString('utf8'))) f.push(`${RUTAS.v1} no es la v2 sin «imagen»`);
        else { try { v1.validarComoAppInstalada(fs.readFileSync(v1r, 'utf8')); } catch (e) { f.push(`la app instalada no aceptaría ${RUTAS.v1}: ${e.message}`); } }
      }
      regla('V-15', f, 'carpeta: archivos, tamaño y copias publicadas');
    }
    if (fase === 'final') {
      const f = [];
      try {
        for (const rel of archivosCambiados(raiz, base)) {
          if (!archivoPermitido(rel, fecha, { conSello })) f.push(`cambia ${rel}, fuera de lo que puede tocar la mañana`);
        }
        if (conSello) {
          const antes = JSON.parse(git(['show', `${base}:${RUTAS.sello}`], { cwd: raiz }).salida);
          const despues = leerJSON(path.join(raiz, RUTAS.sello));
          for (const c of cambiosDelSello(antes, despues)) if (!CAMBIOS_SELLO_PERMITIDOS.includes(c)) f.push(`el sello cambia «${c}» (solo puede cambiar ${CAMBIOS_SELLO_PERMITIDOS.join(', ')})`);
        }
      } catch (e) { f.push(e.message); }
      regla('V-16', f, 'la rama solo cambia las noticias, su carpeta y el sello');
    }
  }
  const errores = reglas.filter(r => !r.ok).flatMap(r => r.detalle.map(d => `${r.id} ${d}`));
  return { version: 1, fase, fecha, edicionSha256: sha256(bytes), reglas, errores, soloCambianFechas: edicion ? soloCambianFechas(edicion, referencia) : false };
}
