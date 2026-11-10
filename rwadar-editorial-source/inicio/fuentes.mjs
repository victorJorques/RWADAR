// Fuentes del Inicio: de fuentes.json a la lista plegada del final de Inicio.
//
// Por decisión de Víctor (04/11/2026) el texto de Inicio va sin llamadas [n]:
// cada apartado acaba en «Fuentes de este apartado ›», que abre esta lista en
// su grupo. Cada fuente lleva su nombre, su fecha y su enlace, con su
// descripción en castellano («texto») y en inglés («texto_en»).
//
// Escribe la lista de la web (aprende/index.html, entre las marcas) y la misma lista
// para la app (rwadar-movil/lib/inicio-fuentes.js).
//
//   node rwadar-editorial-source/inicio/fuentes.mjs             escribe
//   node rwadar-editorial-source/inicio/fuentes.mjs --comprobar solo comprueba
//
// No toca la red. Una fuente mal formada para el script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
export const FUENTE = path.join(AQUI, 'fuentes.json');
// Desde el rediseño de Inicio (10/11/2026), los seis capítulos y sus fuentes van en /aprende/.
export const INDEX = path.join(RAIZ, 'rwadar-site', 'aprende', 'index.html');
export const APP = path.join(RAIZ, 'rwadar-movil', 'lib', 'inicio-fuentes.js');
const INI = '<!--fuentes:ini-->', FIN = '<!--fuentes:fin-->';
const TIPOS = new Set(['catalogo', 'mercado', 'fechado']);

class ErrorFuentes extends Error {}
const falla = m => { throw new ErrorFuentes(m); };
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fecha = iso => iso.split('-').reverse().join('/');

/* «dominio/…/final», sin «www.» ni «https://». */
export function corto(url) {
  const u = new URL(url), host = u.hostname.replace(/^www\./, '');
  const trozos = u.pathname.split('/').filter(Boolean).map(t => { try { return decodeURIComponent(t); } catch { return t; } });
  if (!trozos.length) return host;
  let ultimo = trozos.at(-1) + (u.search && trozos.length === 1 ? u.search : '');
  if (ultimo.length > 32) ultimo = ultimo.slice(0, 26).replace(/[-_.~]+$/, '') + '…';
  return host + (trozos.length === 1 ? '/' : '/…/') + ultimo;
}

export function cargarFuentes() {
  const d = JSON.parse(fs.readFileSync(FUENTE, 'utf8'));
  if (d.version !== 1 || !Array.isArray(d.fuentes) || !Array.isArray(d.grupos)) falla('fuentes.json: formato desconocido');
  const porN = new Map();
  d.fuentes.forEach((f, i) => {
    const donde = `fuente ${i + 1}`;
    if (f.n !== i + 1) falla(`${donde}: «n» debe ser ${i + 1}`);
    for (const campo of ['texto', 'texto_en']) {
      if (typeof f[campo] !== 'string' || !f[campo].trim() || /[<>]/.test(f[campo])) falla(`${donde}: «${campo}» no válido`);
      if (/\[\d+\]/.test(f[campo])) falla(`${donde}: sin llamadas [n]`);
    }
    if (!TIPOS.has(f.tipo)) falla(`${donde}: tipo desconocido`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.consultadaEl || '')) falla(`${donde}: falta consultadaEl`);
    if (!Array.isArray(f.urls) || !f.urls.length || f.urls.some(u => !/^https:\/\//.test(u))) falla(`${donde}: hace falta al menos un enlace https`);
    f.urls.forEach(u => new URL(u));
    porN.set(f.n, f);
  });
  const usadas = new Set(), ids = new Set();
  for (const g of d.grupos) {
    if (!/^[a-z0-9]+$/.test(g.id || '') || ids.has(g.id)) falla(`grupo «${g.id}»: id no válido o repetido`);
    ids.add(g.id);
    if (!g.titulo || /[<>]/.test(g.titulo) || !g.titulo_en || /[<>]/.test(g.titulo_en) ||
      !Array.isArray(g.fuentes) || !g.fuentes.length) falla(`grupo ${g.id}: incompleto`);
    for (const n of g.fuentes) { if (!porN.has(n)) falla(`grupo ${g.id}: no existe la fuente ${n}`); usadas.add(n); }
  }
  const sueltas = [...porN.keys()].filter(n => !usadas.has(n));
  if (sueltas.length) falla(`fuentes sin grupo: ${sueltas.join(', ')}`);
  return d;
}

const fechaConsulta = d => d.fuentes.filter(f => f.tipo === 'mercado').map(f => f.consultadaEl).sort()[0] || d.fuentes[0].consultadaEl;

/* La misma lista para la app, con sus dos idiomas. */
export function moduloApp(d = cargarFuentes()) {
  const json = v => JSON.stringify(v, null, 1);
  const grupos = d.grupos.map(g => ({ id: g.id, es: g.titulo, en: g.titulo_en, fuentes: g.fuentes }));
  const fuentes = d.fuentes.map(f => ({ n: f.n, texto: f.texto, texto_en: f.texto_en, urls: f.urls, consultadaEl: f.consultadaEl }));
  return `/* GENERADO por rwadar-editorial-source/inicio/fuentes.mjs a partir de
   fuentes.json, la misma lista que enseña la web. No se edita a mano.
   DECISIÓN DE VÍCTOR (04/11/2026): el texto va sin llamadas [n]; cada
   apartado acaba con «Fuentes de este apartado», que lleva a su grupo de esta
   lista. Las de tipo «mercado» se vuelven a consultar y a fechar en cada
   ciclo del catálogo. */
export const FUENTES_INICIO_CONSULTADAS_EL = ${JSON.stringify(fechaConsulta(d))};

export const GRUPOS_FUENTES_INICIO = ${json(grupos)};

export const FUENTES_INICIO = ${json(fuentes)};
`;
}

export function bloque(d = cargarFuentes()) {
  const consulta = fechaConsulta(d);
  const porN = new Map(d.fuentes.map(f => [f.n, f]));
  const grupos = d.grupos.map(g => {
    const items = g.fuentes.map(n => {
      const f = porN.get(n);
      const enlaces = f.urls.map(u => `<a class="rel-refs-url" href="${esc(u)}" target="_blank" rel="noopener nofollow" translate="no">${esc(corto(u))}</a>`).join('');
      // Las dos descripciones; la hoja de estilos enseña la del idioma elegido (html[lang]).
      return `            <li data-fuente="${n}"><p lang="es" translate="no" data-fuente-es>${esc(f.texto)}.</p><p lang="en" translate="no" data-fuente-en>${esc(f.texto_en)}.</p>${enlaces}</li>`;
    }).join('\n');
    return `        <section class="rel-refs-grupo" id="fuentes-${g.id}" tabindex="-1" aria-labelledby="fuentes-${g.id}-tit">
          <h3 id="fuentes-${g.id}-tit">${esc(g.titulo)}</h3>
          <ul>
${items}
          </ul>
          <button class="b3 rel-refs-volver" type="button" hidden>Volver al texto</button>
        </section>`;
  }).join('\n');
  return `        ${INI}
        <p class="rel-refs-nota"><span>Agrupadas por apartado.</span> <span>Consultadas el</span> <time datetime="${consulta}">${fecha(consulta)}</time> <span>salvo que se diga otra cosa.</span></p>
${grupos}
        ${FIN}`;
}

export function aplicar(html, nuevo) {
  const a = html.indexOf(INI), b = html.indexOf(FIN);
  if (a < 0 || b < a || html.indexOf(INI, a + 1) >= 0) falla('aprende/index.html: faltan las marcas de fuentes (o están repetidas)');
  return html.slice(0, html.lastIndexOf('\n', a) + 1) + nuevo + html.slice(b + FIN.length);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const d = cargarFuentes(), html = fs.readFileSync(INDEX, 'utf8'), salida = aplicar(html, bloque(d));
    const app = fs.existsSync(APP) ? fs.readFileSync(APP, 'utf8') : '', salidaApp = moduloApp(d);
    if (process.argv.includes('--comprobar')) {
      if (salida !== html || salidaApp !== app) { console.error('Fuentes de Inicio desactualizadas: ejecuta node rwadar-editorial-source/inicio/fuentes.mjs'); process.exit(1); }
      console.log(`Fuentes de Inicio al día: ${d.fuentes.length} fuentes en ${d.grupos.length} grupos.`);
    } else {
      fs.writeFileSync(INDEX, salida);
      fs.writeFileSync(APP, salidaApp);
      console.log(`Fuentes de Inicio escritas: ${d.fuentes.length} fuentes en ${d.grupos.length} grupos (web y app).`);
    }
  } catch (e) {
    if (e instanceof ErrorFuentes) { console.error(`Fuentes no válidas · ${e.message}`); process.exit(1); }
    throw e;
  }
}
