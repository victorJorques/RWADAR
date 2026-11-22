// Lo común de las noticias automáticas: rutas, fechas de España, huellas,
// lectura de JSON, códigos de salida y git. Sin dependencias.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const DIR_SKILL = fileURLToPath(new URL('..', import.meta.url));
// La skill vive en <repo>/.claude/skills/noticias-automaticas/.
export const RAIZ_REPO = path.resolve(DIR_SKILL, '..', '..', '..');

// Códigos de salida de noticias-auto.mjs (SKILL.md, «Códigos»).
export const SALIDA = Object.freeze({ SIGUE: 0, NADA: 3, FRENO: 4, USO: 2 });

export const RUTAS = Object.freeze({
  v2: 'rwadar-site/datos/noticias-v2.json',
  v1: 'rwadar-site/datos/noticias.json',
  diarias: 'rwadar-app/data/noticias-diarias',
  sello: 'rwadar-app/data/relanzamiento/estado.json',
  guia: 'rwadar-editorial-source/noticias/GUIA-TITULARES.md',
  fotos: 'rwadar-editorial-source/noticias/fotos.json',
  catalogo: 'rwadar-site/assets/catalogo-publico-20261022.js',
  config: '.claude/skills/noticias-automaticas/config.json',
  fuentes: '.claude/skills/noticias-automaticas/fuentes-barrido.json',
});

// Lo que puede cambiar el PR de una mañana (V-16), además de su carpeta del día.
export const ARCHIVOS_NOTICIAS = Object.freeze([RUTAS.v2, RUTAS.v1]);

/* Un freno con su paso y su motivo en llano. El programa lo convierte en la
   salida 4 y en el resultado que lee «resumen». */
export class Freno extends Error {
  constructor(paso, motivo, detalle = []) {
    super(motivo);
    this.paso = paso;
    this.motivo = motivo;
    this.detalle = detalle;
  }
}
/* «No hago nada»: cerrojo o pausa (salida 3). */
export class Nada extends Error {
  constructor(motivo, detalle = []) {
    super(motivo);
    this.motivo = motivo;
    this.detalle = detalle;
  }
}

export const sha256 = datos => crypto.createHash('sha256').update(datos).digest('hex');
export const sha256Archivo = ruta => sha256(fs.readFileSync(ruta));

export function leerJSON(ruta) {
  let texto;
  try { texto = fs.readFileSync(ruta, 'utf8'); }
  catch (e) { throw new Error(`no se puede leer ${ruta}: ${e.code || e.message}`); }
  try { return JSON.parse(texto); }
  catch (e) { throw new Error(`${ruta} no es JSON válido: ${e.message}`); }
}
export function leerJSONSiHay(ruta, porDefecto = null) {
  return fs.existsSync(ruta) ? leerJSON(ruta) : porDefecto;
}
export function escribirJSON(ruta, datos) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n');
}

/* ---- Fechas: siempre las de España (Europe/Madrid) ---- */
const FORMATO_FECHA = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
const FORMATO_HORA = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const fechaEspana = (instante = new Date()) => FORMATO_FECHA.format(instante);
export const horaEspana = (instante = new Date()) => FORMATO_HORA.format(instante);
export const esFecha = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
export function sumarDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const diasEntre = (desde, hasta) => Math.round((Date.parse(hasta + 'T12:00:00Z') - Date.parse(desde + 'T12:00:00Z')) / 86400000);
export const ddmm = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const ddmmaaaa = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/* La carpeta de trabajo del día, fuera del repositorio (copias en bruto,
   notas, entradas del cerrojo). Nada de aquí va a Git salvo lo que copia
   «preparar». */
export function carpetaTrabajo(fecha, dada) {
  return path.resolve(dada || path.join(os.tmpdir(), `rwadar-noticias-${fecha}`));
}

/* ---- git ---- */
export function git(argumentos, { cwd = RAIZ_REPO, permitir = [0] } = {}) {
  const r = spawnSync('git', argumentos, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
  if (r.error) throw new Error(`git ${argumentos[0]}: ${r.error.message}`);
  if (!permitir.includes(r.status)) throw new Error(`git ${argumentos.join(' ')} (código ${r.status}): ${String(r.stderr).trim()}`);
  return { codigo: r.status, salida: String(r.stdout), error: String(r.stderr) };
}
/* Las dependencias de una copia aparte (git worktree), enlazadas desde la raíz.
   node_modules/ es una carpeta de verdad con un enlace por paquete: un enlace
   llamado node_modules no lo ignora Git («node_modules/» solo casa con
   carpetas) y la compuerta vería el árbol sucio. */
export function enlazarDependencias(raiz, destino) {
  for (const sub of ['', 'rwadar-app', 'rwadar-movil']) {
    const origen = path.join(raiz, sub, 'node_modules');
    if (!fs.existsSync(origen)) continue;
    const dentro = path.join(destino, sub, 'node_modules');
    fs.mkdirSync(dentro, { recursive: true });
    for (const e of fs.readdirSync(origen)) if (!fs.existsSync(path.join(dentro, e))) fs.symlinkSync(path.join(origen, e), path.join(dentro, e));
  }
}
export const gitTexto = (argumentos, opciones) => git(argumentos, opciones).salida.trim();
export function arbolLimpio(cwd = RAIZ_REPO) {
  return gitTexto(['status', '--porcelain=v1', '--untracked-files=all'], { cwd }) === '';
}

/* ---- config.json ---- */
export function cargarConfig(ruta = path.join(RAIZ_REPO, RUTAS.config)) {
  const c = leerJSON(ruta);
  const fallos = [];
  const entero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  if (c.version !== 1) fallos.push('version debe ser 1');
  if (typeof c.activo !== 'boolean') fallos.push('activo debe ser true o false');
  if (typeof c.publicarSiSoloCambianFechas !== 'boolean') fallos.push('publicarSiSoloCambianFechas debe ser true o false');
  if (!/^\d{2}:\d{2}$/.test(String(c.horaLimiteUnion || ''))) fallos.push('horaLimiteUnion debe ser HH:MM');
  if (!entero(c.titulares?.maxCaracteres, 30, 80)) fallos.push('titulares.maxCaracteres entre 30 y 80');
  if (!entero(c.titulares?.propuestasMin, 2, 10)) fallos.push('titulares.propuestasMin entre 2 y 10');
  const e = c.edicion || {};
  if (!entero(e.hoyMax, 0, 5) || !entero(e.importanteMax, 1, 10) || !entero(e.totalMin, 1, 8) || !entero(e.totalMax, e.totalMin || 1, 24) ||
    !entero(e.diasImportante, 1, 60)) fallos.push('edicion: hoyMax, importanteMax, totalMin, totalMax y diasImportante');
  if (c.fotos?.distintasEn !== 'edicion') fallos.push('fotos.distintasEn debe ser «edicion»');
  // Fotos reales en las noticias solo tras la OTA con sus créditos (22/11/2026).
  if (typeof c.fotos?.realesEnApp !== 'boolean') fallos.push('fotos.realesEnApp debe ser true o false');
  const genericas = c.fotos?.genericas;
  if (!genericas || typeof genericas !== 'object' || ['regulacion', 'mercado', 'producto', 'riesgo'].some(k => typeof genericas[k] !== 'string')) {
    fallos.push('fotos.genericas debe tener regulacion, mercado, producto y riesgo');
  }
  if (!entero(c.carpeta?.maxBytes, 10000, 1000000)) fallos.push('carpeta.maxBytes');
  if (!Array.isArray(c.carpeta?.extensiones) || !c.carpeta.extensiones.every(x => ['.json', '.md', '.txt'].includes(x))) {
    fallos.push('carpeta.extensiones solo .json, .md y .txt');
  }
  if (!Array.isArray(c.clavesNuevasPermitidas)) fallos.push('clavesNuevasPermitidas debe ser una lista');
  if (!entero(c.selloHumanoMaxDias, 1, 7)) fallos.push('selloHumanoMaxDias entre 1 y 7 (la compuerta caduca a los 7)');
  if (!/^https:\/\/[a-z0-9.-]+$/.test(String(c.produccion || '')) || !/^https:\/\/[a-z0-9.-]+$/.test(String(c.revision || ''))) {
    fallos.push('produccion y revision deben ser https://<servidor>');
  }
  if (fallos.length) throw new Error(`config.json no vale: ${fallos.join('; ')}`);
  return c;
}

/* ---- Argumentos «--clave valor» y «--bandera» ---- */
export function leerArgumentos(lista) {
  const args = { _: [] };
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const igual = a.indexOf('=');
    if (igual > 0) { args[a.slice(2, igual)] = a.slice(igual + 1); continue; }
    const siguiente = lista[i + 1];
    if (siguiente !== undefined && !siguiente.startsWith('--')) { args[a.slice(2)] = siguiente; i++; }
    else args[a.slice(2)] = true;
  }
  return args;
}

/* Lista de archivos de una carpeta (rutas relativas con /), recursiva. */
export function listarArchivos(dir) {
  const salida = [];
  const visitar = (actual, rel) => {
    for (const e of fs.readdirSync(actual, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) visitar(path.join(actual, e.name), r);
      else salida.push({ rel: r, ruta: path.join(actual, e.name), enlace: e.isSymbolicLink() });
    }
  };
  if (fs.existsSync(dir)) visitar(dir, '');
  return salida.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}
