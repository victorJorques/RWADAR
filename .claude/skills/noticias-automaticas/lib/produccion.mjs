// ¿Es `main` lo que ya sirve producción? (cerrojo 6, tras la revisión del diseño)
//
// Dos comprobaciones que se completan:
//  a) Archivo a archivo: la construcción local de `main` (con el reloj de la
//     última publicación en producción) frente a lo que sirve producción,
//     con su SHA-256. Todo lo servible cuenta, salvo:
//       - datos/noticias*.json: las juzga aparte «noticiasEnMain» (abajo);
//       - datos/tokenizacion-*.json: vienen de la rama datos-tokenizacion,
//         fuera del sello, y cambian cada día;
//       - la clave de caché de sw.js (const VERSION): depende de todo lo
//         anterior; el resto de sw.js sí se compara;
//       - las lecciones de la Academy con cuenta (303 o 401 sin sesión);
//       - _worker.js, _routes.json, _headers y _redirects: Cloudflare no los
//         sirve como archivo. Esos y las lecciones los cubre b).
//  b) Con git: lo sellado que cambió entre el commit de la última
//     publicación en producción («Publicar web» con destino produccion y en
//     verde) y `main`. Solo pueden ser las noticias.
// Cualquier otra diferencia: la mañana no hace nada y avisa.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { listarArchivos, sha256, git } from './comun.mjs';

const require = createRequire(import.meta.url);

export const NO_SERVIDOS = Object.freeze(['_worker.js', '_routes.json', '_headers', '_redirects']);
export const es = Object.freeze({
  noticias: rel => /^datos\/noticias(?:-v2)?\.json$/.test(rel),
  tokenizacion: rel => /^datos\/tokenizacion-[a-z-]+\.json$/.test(rel),
  leccion: rel => /^academy\/(?!index\.html$)[^/]+\.html$/.test(rel),
});
const VERSION_SW = /const VERSION = 'rwadar-v[^']+';/;
export const sinVersion = texto => texto.replace(VERSION_SW, "const VERSION = '__VERSION__';");

/* La ruta pública de cada archivo de rwadar-publicado/ (Cloudflare Pages
   sirve las páginas sin «.html» y las carpetas con su index.html). */
export function rutaPublica(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  if (rel.endsWith('.html')) return '/' + rel.slice(0, -5);
  return '/' + rel;
}

/* Las redirecciones de _redirects («/origen /destino código»): una página
   redirigida no se sirve; se comprueba que producción redirige igual. */
export function leerRedirecciones(publicado) {
  const ruta = path.join(publicado, '_redirects');
  const mapa = new Map();
  if (!fs.existsSync(ruta)) return mapa;
  for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
    const partes = linea.trim().split(/\s+/);
    if (partes.length === 3 && partes[0].startsWith('/') && /^30[1278]$/.test(partes[2])) {
      mapa.set(partes[0], { destino: partes[1], codigo: Number(partes[2]) });
    }
  }
  return mapa;
}

async function enParalelo(lista, cuantos, trabajo) {
  const salida = new Array(lista.length);
  let siguiente = 0;
  const hilos = Array.from({ length: Math.min(cuantos, lista.length) }, async () => {
    while (siguiente < lista.length) {
      const i = siguiente++;
      salida[i] = await trabajo(lista[i], i);
    }
  });
  await Promise.all(hilos);
  return salida;
}

async function pedirBytes(url, { pedir = fetch, intentos = 3 } = {}) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await pedir(url, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(30000),
        headers: { accept: '*/*', 'accept-language': 'es' } });
      const bytes = Buffer.from(await r.arrayBuffer());
      if (r.status >= 500 && i < intentos - 1) { ultimo = `HTTP ${r.status}`; await new Promise(f => setTimeout(f, 1000 * (i + 1))); continue; }
      return { estado: r.status, tipo: r.headers.get('content-type') || '', ubicacion: r.headers.get('location') || '', bytes };
    } catch (e) {
      ultimo = e.cause?.code || e.name || e.message;
      if (i < intentos - 1) await new Promise(f => setTimeout(f, 1000 * (i + 1)));
    }
  }
  return { estado: 0, error: String(ultimo), tipo: '', ubicacion: '', bytes: Buffer.alloc(0) };
}

/* a) Archivo a archivo. Devuelve {iguales, distintas, excluidas, noticias}. */
export async function compararArchivos({ publicado, base, pedir = fetch, concurrencia = 6 }) {
  const archivos = listarArchivos(publicado).filter(a => !a.enlace);
  if (!archivos.length) throw new Error(`no hay nada construido en ${publicado}`);
  const excluidas = [], aComparar = [];
  for (const a of archivos) {
    if (NO_SERVIDOS.includes(a.rel)) excluidas.push({ archivo: a.rel, motivo: 'Cloudflare no lo sirve como archivo (lo cubre la comparación con git)' });
    else if (es.tokenizacion(a.rel)) excluidas.push({ archivo: a.rel, motivo: 'datos de la tokenización (rama datos-tokenizacion, fuera del sello)' });
    else aComparar.push(a);
  }
  const iguales = [], distintas = [], noticias = {};
  const base0 = base.replace(/\/$/, '');
  const redirecciones = leerRedirecciones(publicado);
  await enParalelo(aComparar, concurrencia, async a => {
    const ruta = rutaPublica(a.rel);
    const url = base0 + ruta;
    const r = await pedirBytes(url, { pedir });
    const local = fs.readFileSync(a.ruta);
    const redireccion = redirecciones.get(ruta);
    if (redireccion) {
      const destino = r.ubicacion.startsWith(base0) ? r.ubicacion.slice(base0.length) || '/' : r.ubicacion;
      if (r.estado === redireccion.codigo && destino === redireccion.destino) iguales.push(a.rel);
      else distintas.push({ archivo: a.rel, url, motivo: `_redirects pide ${redireccion.codigo} a ${redireccion.destino} y responde ${r.estado} ${r.ubicacion}` });
      return;
    }
    if (es.leccion(a.rel) && (r.estado === 303 || r.estado === 401)) {
      excluidas.push({ archivo: a.rel, motivo: `lección con cuenta (${r.estado} sin sesión; la cubre la comparación con git)` });
      return;
    }
    if (es.noticias(a.rel)) {
      noticias[a.rel] = { estado: r.estado, local: sha256(local), produccion: r.estado === 200 ? sha256(r.bytes) : null };
      return;
    }
    if (r.estado !== 200) { distintas.push({ archivo: a.rel, url, motivo: r.error ? `sin respuesta (${r.error})` : `HTTP ${r.estado}` }); return; }
    const igual = a.rel === 'sw.js'
      ? sinVersion(local.toString('utf8')) === sinVersion(r.bytes.toString('utf8'))
      : sha256(local) === sha256(r.bytes);
    if (igual) iguales.push(a.rel);
    else distintas.push({ archivo: a.rel, url, motivo: `bytes distintos (local ${sha256(local).slice(0, 12)}, producción ${sha256(r.bytes).slice(0, 12)})` });
  });
  const orden = (x, y) => (x.archivo < y.archivo ? -1 : 1);
  return { iguales: iguales.sort(), distintas: distintas.sort(orden), excluidas: excluidas.sort(orden), noticias };
}

/* b) Con git: rutas selladas que cambiaron entre el commit publicado (P) y
   `main` (M). Si P no es antepasado de M, todo cuenta como cambiado. */
export function cambiosSelladosDesde({ publicado, main, cwd }) {
  const { RUTAS_CONTENIDO_APROBADO } = require(path.join(cwd, 'rwadar-publicacion-segura.js'));
  const ancestro = git(['merge-base', '--is-ancestor', publicado, main], { cwd, permitir: [0, 1, 128] });
  if (ancestro.codigo !== 0) return { ancestro: false, cambios: null };
  const salida = git(['-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', publicado, main, '--', ...RUTAS_CONTENIDO_APROBADO], { cwd }).salida;
  return { ancestro: true, cambios: salida.split('\n').map(l => l.trim()).filter(Boolean) };
}
