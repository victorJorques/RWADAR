// Fuentes del Inicio: de fuentes.json a la lista plegada del final de Inicio.
//
// Por decisión de Víctor (04/11/2026) el texto de Inicio va sin llamadas [n]:
// cada apartado acaba en «Fuentes de este apartado ›», que abre esta lista en
// su grupo. Cada fuente lleva su nombre, su fecha y su enlace.
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
export const INDEX = path.join(RAIZ, 'rwadar-site', 'index.html');
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
    if (typeof f.texto !== 'string' || !f.texto.trim() || /[<>]/.test(f.texto)) falla(`${donde}: texto no válido`);
    if (/\[\d+\]/.test(f.texto)) falla(`${donde}: sin llamadas [n]`);
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
    if (!g.titulo || /[<>]/.test(g.titulo) || !Array.isArray(g.fuentes) || !g.fuentes.length) falla(`grupo ${g.id}: incompleto`);
    for (const n of g.fuentes) { if (!porN.has(n)) falla(`grupo ${g.id}: no existe la fuente ${n}`); usadas.add(n); }
  }
  const sueltas = [...porN.keys()].filter(n => !usadas.has(n));
  if (sueltas.length) falla(`fuentes sin grupo: ${sueltas.join(', ')}`);
  return d;
}

export function bloque(d = cargarFuentes()) {
  const consulta = d.fuentes.filter(f => f.tipo === 'mercado').map(f => f.consultadaEl).sort()[0] || d.fuentes[0].consultadaEl;
  const porN = new Map(d.fuentes.map(f => [f.n, f]));
  const grupos = d.grupos.map(g => {
    const items = g.fuentes.map(n => {
      const f = porN.get(n);
      const enlaces = f.urls.map(u => `<a class="rel-refs-url" href="${esc(u)}" target="_blank" rel="noopener nofollow">${esc(corto(u))}</a>`).join('');
      return `            <li data-fuente="${n}"><p lang="es" translate="no">${esc(f.texto)}.</p>${enlaces}</li>`;
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
        <p class="rel-refs-nota">${d.fuentes.length} fuentes, agrupadas por apartado. Consultadas el ${fecha(consulta)} salvo que se diga otra cosa.</p>
${grupos}
        ${FIN}`;
}

export function aplicar(html, nuevo) {
  const a = html.indexOf(INI), b = html.indexOf(FIN);
  if (a < 0 || b < a || html.indexOf(INI, a + 1) >= 0) falla('index.html: faltan las marcas de fuentes (o están repetidas)');
  return html.slice(0, html.lastIndexOf('\n', a) + 1) + nuevo + html.slice(b + FIN.length);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const d = cargarFuentes(), html = fs.readFileSync(INDEX, 'utf8'), salida = aplicar(html, bloque(d));
    if (process.argv.includes('--comprobar')) {
      if (salida !== html) { console.error('Fuentes de Inicio desactualizadas: ejecuta node rwadar-editorial-source/inicio/fuentes.mjs'); process.exit(1); }
      console.log(`Fuentes de Inicio al día: ${d.fuentes.length} fuentes en ${d.grupos.length} grupos.`);
    } else {
      fs.writeFileSync(INDEX, salida);
      console.log(`Fuentes de Inicio escritas: ${d.fuentes.length} fuentes en ${d.grupos.length} grupos.`);
    }
  } catch (e) {
    if (e instanceof ErrorFuentes) { console.error(`Fuentes no válidas · ${e.message}`); process.exit(1); }
    throw e;
  }
}
