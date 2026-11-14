// El barrido de la mañana y la comprobación de fuentes: un programa, no un
// agente, abre la lista cerrada de fuentes (fuentes-barrido.json) y la fuente
// de cada noticia, guarda las copias en bruto FUERA del repositorio y escribe
// lo que vio con su hora, su HTTP y su SHA-256.
//
// Reglas (las de acceso/ACCESO-FUENTES.md y el vigía): petición normal, con el
// agente de Node, sin cookies ni sesión; TLS verificado; se siguen las
// redirecciones; un mismo servidor, de una en una y con 2 s entre peticiones;
// 3 intentos con espera creciente solo ante un 5xx o un corte (un 403 o un 429
// no se reintentan: se anotan); 40 s de plazo por petición.
//
// Lo que va a Git (barrido.json) lleva solo los elementos del sector (filtro de
// palabras) y sin nada que parezca un nombre de persona; del resto, solo el
// recuento. El BOE trae a diario nombramientos y ceses con nombres.
import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './comun.mjs';
import { buscarPersonas } from './personas.mjs';

export const SECTOR = /tokeni[sz]|token|cripto|crypto|\bmica\b|\bdlt\b|blockchain|cadena de bloques|registros? distribuidos?|distributed ledger|stablecoin|activos? digital|digital asset|valores|securities|\bcnmv\b|\besma\b|folleto|prospectus|financiaci[oó]n participativa|crowdfunding|advertencia|warning|unregistered|no registrad|inversor|investor|mercados? de capitales|capital markets|money market|fondos? monetari|letras del tesoro|treasury bills|bonos? digital|digital bonds?/iu;

// Discursos, entrevistas y comparecencias: casi siempre llevan el nombre de
// quien habla. No van a barrido.json (el editor los ve en las copias en bruto).
export const PERSONALES = /\b(?:speech|keynote|interview|remarks|blog post|podcast|hearing|testimony|discurso|entrevista|intervenci[oó]n|comparecencia|declaraciones de)\b/iu;

const pausa = ms => new Promise(f => setTimeout(f, ms));
const servidor = url => { try { return new URL(url).host; } catch { return '?'; } };

/* Una petición con las reglas de arriba. Devuelve {http, tipo, bytes, sha256,
   horaUtc, urlFinal, error, cuerpo}. «pedir» se puede cambiar en las pruebas. */
export async function pedirFuente(url, { pedir = fetch, intentos = 3, plazoMs = 40000, esperaBaseMs = 2000, ahora = () => new Date(), accept = '*/*' } = {}) {
  let ultimo = null;
  for (let i = 0; i < intentos; i++) {
    const horaUtc = ahora().toISOString();
    try {
      const r = await pedir(url, { redirect: 'follow', signal: AbortSignal.timeout(plazoMs),
        headers: { accept, 'accept-language': 'es-ES,es;q=0.9,en;q=0.8' } });
      const cuerpo = Buffer.from(await r.arrayBuffer());
      const resultado = { http: r.status, tipo: r.headers.get('content-type') || '', bytes: cuerpo.length, sha256: sha256(cuerpo),
        horaUtc, urlFinal: r.url || url, error: null, cuerpo };
      if (r.status >= 500 && i < intentos - 1) { ultimo = resultado; await pausa(esperaBaseMs * (i + 1)); continue; }
      return resultado;
    } catch (e) {
      ultimo = { http: 0, tipo: '', bytes: 0, sha256: null, horaUtc, urlFinal: url, error: String(e.cause?.code || e.name || e.message), cuerpo: Buffer.alloc(0) };
      if (i < intentos - 1) await pausa(esperaBaseMs * (i + 1));
    }
  }
  return ultimo;
}

/* Pide una lista de URL: servidores distintos a la vez, el mismo de una en una
   y con «separacionMs» entre peticiones. */
export async function pedirVarias(urls, { separacionMs = 2000, acceptPorUrl = new Map(), ...opciones } = {}) {
  const porServidor = new Map();
  for (const url of urls) {
    const s = servidor(url);
    if (!porServidor.has(s)) porServidor.set(s, []);
    porServidor.get(s).push(url);
  }
  const salida = new Map();
  await Promise.all([...porServidor.values()].map(async lista => {
    for (let i = 0; i < lista.length; i++) {
      if (i) await pausa(separacionMs);
      salida.set(lista[i], await pedirFuente(lista[i], { ...opciones, ...(acceptPorUrl.has(lista[i]) ? { accept: acceptPorUrl.get(lista[i]) } : {}) }));
    }
  }));
  return salida;
}

/* ---- Lectores: de cada respuesta, sus últimos elementos {fecha, hora, titulo, enlace} ---- */
const entidades = t => String(t).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&nbsp;/g, ' ');
const limpio = t => entidades(String(t || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const etiqueta = (bloque, nombre) => { const m = new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'i').exec(bloque); return m ? m[1] : ''; };
const MESES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function fechaDe(texto) {
  const t = String(texto || '');
  let m = /(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(t);
  if (m) return { fecha: `${m[1]}-${m[2]}-${m[3]}`, hora: m[4] ? `${m[4]}:${m[5]}` : null };
  m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(t);
  if (m && MESES[m[2].toLowerCase()]) return { fecha: `${m[3]}-${String(MESES[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`, hora: m[4] ? `${m[4]}:${m[5]}` : null };
  m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(t);
  if (m) return { fecha: `${m[3]}-${m[2]}-${m[1]}`, hora: null };
  return { fecha: null, hora: null };
}

export const LECTORES = Object.freeze({
  // Lista de notas de prensa de la CNMV (HTML).
  'cnmv-lista'(texto) {
    return String(texto).split(/class="blocks-single"/).slice(1).map(b => {
      const f = /class="fecha-con-hora">\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(b);
      const h = /class="time">\s*(\d{2}:\d{2})/.exec(b);
      const a = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(b);
      return f && a ? { fecha: `${f[3]}-${f[2]}-${f[1]}`, hora: h ? h[1] : null, titulo: limpio(a[2]), enlace: entidades(a[1]) } : null;
    }).filter(Boolean);
  },
  // RSS 2.0 (ESMA, Consejo, BCE, EBA): fecha de pubDate, a10:updated, dc:date o la primera datetime de la descripción.
  rss(texto) {
    return [...String(texto).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(([, b]) => {
      const f = fechaDe(etiqueta(b, 'pubDate') || etiqueta(b, 'a10:updated') || etiqueta(b, 'dc:date') || (/datetime=(?:"|&quot;)([^"&]+)/.exec(b) || [])[1]);
      return { fecha: f.fecha, hora: f.hora, titulo: limpio(etiqueta(b, 'title')), enlace: limpio(etiqueta(b, 'link')) };
    }).filter(x => x.titulo);
  },
  // Sumario del BOE (API de datos abiertos, XML).
  boe(texto) {
    const fecha = (/<fecha_publicacion>(\d{4})(\d{2})(\d{2})<\/fecha_publicacion>/.exec(String(texto)) || []).slice(1);
    return [...String(texto).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(([, b]) => ({
      fecha: fecha.length ? `${fecha[0]}-${fecha[1]}-${fecha[2]}` : null, hora: null,
      titulo: limpio(etiqueta(b, 'titulo')), enlace: limpio(etiqueta(b, 'url_html')),
    })).filter(x => x.titulo);
  },
  // Registro de folletos de ESMA (Solr, JSON).
  'esma-folletos'(texto) {
    let datos;
    try { datos = JSON.parse(String(texto)); } catch { return []; }
    return (datos?.response?.docs || []).map(d => {
      const f = fechaDe(d.approval_filing_date);
      return { fecha: f.fecha, hora: null, titulo: limpio([d.issuer_name || d.entity_name, d.document_type].filter(Boolean).join(' · ')), enlace: '' };
    }).filter(x => x.titulo);
  },
  // Solo la huella (cambia o no cambia).
  huella() { return []; },
});

const descodificar = t => { try { return decodeURIComponent(t); } catch { return t; } };

/* Lo que de un elemento puede ir a Git: del sector y sin nada que parezca un nombre. */
export function filtrarElementos(elementos, { todoDelSector = false } = {}) {
  const guardados = [];
  let fueraDelSector = 0, conNombre = 0;
  for (const e of elementos) {
    if (!todoDelSector && !SECTOR.test(e.titulo)) { fueraDelSector++; continue; }
    if (PERSONALES.test(e.titulo) || buscarPersonas(e.titulo, { titular: true }) || buscarPersonas(descodificar(e.enlace || '').replace(/[-_/]/g, ' '))) { conNombre++; continue; }
    guardados.push({ fecha: e.fecha, hora: e.hora, titulo: e.titulo.slice(0, 240), enlace: e.enlace.slice(0, 400) });
  }
  return { guardados, fueraDelSector, conNombre };
}

/* Sustituye {AAAAMMDD} y {AAAAMMDD_AYER} en la dirección de una fuente. */
export function direccion(plantilla, fecha, ayer) {
  return plantilla.replaceAll('{AAAAMMDD}', fecha.replaceAll('-', '')).replaceAll('{AAAAMMDD_AYER}', ayer.replaceAll('-', ''))
    .replaceAll('{AYER}', ayer);
}

const extension = tipo => (/json/.test(tipo) ? '.json' : /xml|rss/.test(tipo) ? '.xml' : /pdf/.test(tipo) ? '.pdf' : /html/.test(tipo) ? '.html' : '.bin');

/* El barrido entero. Devuelve el objeto de barrido.json. */
export async function barrer({ fecha, ayer, fuentes, referencia, huellasAnteriores = new Map(), crudo, opciones = {} }) {
  const inicioUtc = new Date().toISOString();
  const lista = fuentes.map(f => ({ ...f, urlReal: direccion(f.url, fecha, ayer) }));
  const deNoticias = [...new Set((referencia?.noticias || []).map(n => n.fuente?.url).filter(Boolean))];
  const acceptPorUrl = new Map(lista.filter(f => f.accept).map(f => [f.urlReal, f.accept]));
  const respuestas = await pedirVarias([...new Set([...lista.map(f => f.urlReal), ...deNoticias])], { ...opciones, acceptPorUrl });
  const desde = referencia?.actualizadoEl || ayer;
  fs.mkdirSync(crudo, { recursive: true });
  const guardar = (nombre, r) => { if (r.cuerpo?.length) fs.writeFileSync(path.join(crudo, nombre + extension(r.tipo)), r.cuerpo); };
  const salida = { version: 1, fecha, inicioUtc, finUtc: null, desde, fuentes: [], deNoticias: [], caidas: [], criticasCaidas: [] };
  for (const f of lista) {
    const r = respuestas.get(f.urlReal);
    guardar(f.id, r);
    const sinEdicion = f.sinEdicionEsNormal && r.http === 404;
    const caida = r.http !== 200 && !sinEdicion;
    let elementos = [];
    if (!caida && !sinEdicion) {
      try { elementos = (LECTORES[f.lector] || LECTORES.huella)(r.cuerpo.toString('utf8')); } catch { elementos = []; }
    }
    if (!caida && f.lector !== 'huella' && !sinEdicion && !f.vacioEsNormal && elementos.length === 0) {
      // Respondió, pero no se entiende: como caída (la página cambió de forma).
      salida.caidas.push({ id: f.id, motivo: 'respondió sin elementos legibles' });
      if (f.critica) salida.criticasCaidas.push(f.id);
    }
    const { guardados, fueraDelSector, conNombre } = filtrarElementos(elementos, { todoDelSector: f.todoDelSector === true });
    const nuevos = guardados.filter(e => e.fecha && e.fecha >= desde);
    salida.fuentes.push({ id: f.id, nombre: f.nombre, url: f.urlReal, critica: f.critica === true, http: r.http, tipo: r.tipo, bytes: r.bytes,
      sha256: r.sha256, horaUtc: r.horaUtc, error: r.error, sinEdicion,
      cambia: huellasAnteriores.has(f.id) ? huellasAnteriores.get(f.id) !== r.sha256 : null,
      leidos: elementos.length, fueraDelSector, omitidosPorNombre: conNombre, elementos: guardados.slice(0, 30), nuevos });
    if (caida) {
      salida.caidas.push({ id: f.id, motivo: r.error || `HTTP ${r.http}` });
      if (f.critica) salida.criticasCaidas.push(f.id);
    }
  }
  const publicadas = new Map((referencia?.noticias || []).map(n => [n.fuente?.url, n.id]));
  for (const url of deNoticias) {
    const r = respuestas.get(url);
    guardar(`noticia-${publicadas.get(url)}`, r);
    const anterior = huellasAnteriores.get(url);
    salida.deNoticias.push({ id: publicadas.get(url), url, http: r.http, tipo: r.tipo, bytes: r.bytes, sha256: r.sha256, horaUtc: r.horaUtc,
      error: r.error, igualQuePublicada: anterior ? anterior === r.sha256 : null });
  }
  salida.finUtc = new Date().toISOString();
  return salida;
}

/* comprobar-fuentes: abre cada fuente.url de una edición y escribe el
   inventario del programa (V-12 se juzga contra este, no contra el del editor). */
export async function comprobarFuentes({ fecha, edicion, crudo, opciones = {} }) {
  const urls = [...new Set((edicion?.noticias || []).map(n => n?.fuente?.url).filter(u => typeof u === 'string' && /^https?:\/\//.test(u)))];
  const respuestas = await pedirVarias(urls, opciones);
  if (crudo) fs.mkdirSync(crudo, { recursive: true });
  const fuentes = urls.map(url => {
    const r = respuestas.get(url);
    if (crudo && r.cuerpo?.length) fs.writeFileSync(path.join(crudo, sha256(url).slice(0, 16) + extension(r.tipo)), r.cuerpo);
    return { url, http: r.http, tipo: r.tipo, bytes: r.bytes, sha256: r.sha256, horaUtc: r.horaUtc, error: r.error };
  });
  return { version: 1, fecha, generado: new Date().toISOString(), fuentes };
}
