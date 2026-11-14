// Ayudas de las pruebas de noticias-automaticas: un «día» completo en una
// carpeta de trabajo de usar y tirar, a partir de la edición fija del 13/11.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../lib/comun.mjs';

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const SKILL = path.resolve(AQUI, '..');
export const RAIZ = path.resolve(SKILL, '..', '..', '..');
export const FIJOS = path.join(AQUI, 'fijos');
export const GUIA = path.join(FIJOS, 'GUIA-TITULARES.md');
export const PROGRAMA = path.join(SKILL, 'noticias-auto.mjs');
export const BASE = JSON.parse(fs.readFileSync(path.join(FIJOS, 'edicion-2026-11-13.json'), 'utf8'));
export const FECHA = '2026-11-14';
export const CONFIG = JSON.parse(fs.readFileSync(path.join(SKILL, 'config.json'), 'utf8'));

export const copia = v => structuredClone(v);
export const tmp = prefijo => fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-noticias-prueba-${prefijo}-`));
export const escribir = (ruta, datos) => { fs.mkdirSync(path.dirname(ruta), { recursive: true }); fs.writeFileSync(ruta, typeof datos === 'string' || Buffer.isBuffer(datos) ? datos : JSON.stringify(datos, null, 2) + '\n'); };

/* La edición buena del 14/11: la del 13/11 consultada otra vez hoy. */
export function edicionBuena(fecha = FECHA) {
  const e = copia(BASE);
  e.actualizadoEl = fecha;
  for (const n of e.noticias) n.consultadaEl = fecha;
  return e;
}
/* Una noticia nueva de «Hoy» con foto propia que nadie usa. */
export function noticiaDeHoy(fecha = FECHA, extra = {}) {
  return {
    id: 'esma-ejemplo-tokenizacion-hoy', fecha, seccion: 'hoy', categoria: 'mercado', ambito: 'UE',
    titulo: 'ESMA abre consulta sobre fondos tokenizados', resumen: 'La autoridad europea de valores abre una consulta sobre fondos tokenizados.',
    porQueImporta: 'Puede cambiar cómo se venden los fondos tokenizados en la UE.',
    en: { titulo: 'ESMA consults on tokenised funds', resumen: 'The EU securities authority opens a consultation on tokenised funds.', porQueImporta: 'It may change how tokenised funds are sold in the EU.' },
    fuente: { nombre: 'ESMA, consulta de ejemplo', url: 'https://www.esma.europa.eu/ejemplo-consulta', tipo: 'regulador' },
    consultadaEl: fecha, imagen: 'red-europea', ...extra,
  };
}
export function titularesDe(edicion, fecha = FECHA, guia = GUIA) {
  return {
    version: 1, fecha, guia: { ruta: 'rwadar-editorial-source/noticias/GUIA-TITULARES.md', sha256: sha256(fs.readFileSync(guia)) },
    noticias: edicion.noticias.map(n => ({
      id: n.id,
      propuestas: { es: [n.titulo, 'Otra forma de decirlo, más corta', 'Una tercera propuesta distinta'], en: [n.en.titulo, 'Another shorter way to say it', 'A third different proposal'] },
      elegido: { es: n.titulo, en: n.en.titulo }, motivo: 'Dice primero lo que cambia para el lector.', heredado: null,
      foto: { clave: n.imagen, encaje: 'propia', alternativas: [], faltaria: null },
    })),
  };
}
export function inventarioDe(edicion, fecha = FECHA, http200 = () => true) {
  return { version: 1, fecha, generado: `${fecha}T07:40:00.000Z`,
    fuentes: [...new Set(edicion.noticias.map(n => n.fuente.url))].map(url => (http200(url)
      ? { url, http: 200, tipo: 'application/pdf', bytes: 1000, sha256: sha256(url), horaUtc: `${fecha}T07:40:00.000Z`, error: null }
      : { url, http: 503, tipo: '', bytes: 0, sha256: null, horaUtc: `${fecha}T07:40:00.000Z`, error: 'HTTP 503' })) };
}
export function verificacionDe(bytes, edicion, fecha = FECHA, pase = 1, cambios = {}) {
  return {
    version: 1, pase, fecha, edicionSha256: sha256(bytes), veredicto: 'conforme',
    noticias: edicion.noticias.map(n => ({ id: n.id, veredicto: 'confirmada',
      fuente: { url: n.fuente.url, http: 200, horaUtc: `${fecha}T08:00:00Z`, sha256: sha256(n.fuente.url), caida: false },
      literal: 'Cita corta de la fuente que respalda el titular.', titularRespaldado: true, fotoAdecuada: true, personas: false, fechaCorrecta: true })),
    hoyCorrecto: true, faltaAlgo: [], correcciones: [], ...cambios,
  };
}

/* Un día de trabajo completo en <trabajo>: lo que dejaría la mañana hasta el verificador. */
export function montarDia({ trabajo = tmp('dia'), fecha = FECHA, edicion = edicionBuena(fecha), referencia = BASE, verificacion = null, notas = null, inventario = null } = {}) {
  const bytes = Buffer.from(JSON.stringify(edicion, null, 2) + '\n');
  escribir(path.join(trabajo, 'editor', `noticias-${fecha}.json`), bytes);
  escribir(path.join(trabajo, 'editor', 'titulares.json'), titularesDe(edicion, fecha));
  escribir(path.join(trabajo, 'fuentes', 'inventario-fuentes.json'), inventario || inventarioDe(edicion, fecha));
  escribir(path.join(trabajo, 'cerrojo', 'produccion-noticias-v2.json'), referencia);
  escribir(path.join(trabajo, 'barrido', 'barrido.json'), { version: 1, fecha, fuentes: [], deNoticias: [], caidas: [], criticasCaidas: [] });
  escribir(path.join(trabajo, 'verificador', 'verificacion.json'), verificacion || verificacionDe(bytes, edicion, fecha));
  escribir(path.join(trabajo, 'verificador', 'VERIFICACION.md'), '# Verificación de prueba\n\nTodo conforme, sin personas.\n');
  const dirNotas = notas || tmp('notas');
  escribir(path.join(dirNotas, 'EDICION.md'), '# Edición de prueba\n\nLo que entra y por qué, sin personas.\n');
  return { trabajo, notas: dirNotas, bytes, edicion };
}

/* El programa entero, como lo lanza la sesión. */
export function programa(args, { cwd = RAIZ, env = {} } = {}) {
  try {
    const salida = execFileSync(process.execPath, [PROGRAMA, ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, salida };
  } catch (e) { return { codigo: e.status, salida: String(e.stdout || '') + String(e.stderr || '') }; }
}

/* Un servidor HTTP local con respuestas fijas: {ruta: {estado, tipo, cuerpo} | (peticion, n) => {...}}. */
export async function servidor(rutas) {
  const cuentas = new Map();
  const s = http.createServer((req, res) => {
    const ruta = req.url.split('?')[0];
    const n = (cuentas.get(ruta) || 0) + 1; cuentas.set(ruta, n);
    let r = rutas[ruta];
    if (typeof r === 'function') r = r(req, n);
    if (!r) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('no'); return; }
    if (r.redirigir) { res.writeHead(301, { location: r.redirigir }); res.end(); return; }
    res.writeHead(r.estado || 200, { 'content-type': r.tipo || 'text/plain' });
    res.end(r.cuerpo || '');
  });
  await new Promise(f => s.listen(0, '127.0.0.1', f));
  const url = `http://127.0.0.1:${s.address().port}`;
  return { url, cuentas, cerrar: () => new Promise(f => s.close(f)) };
}

/* git de usar y tirar sobre una copia aparte del repositorio (git worktree, sin ramas nuevas). */
export function gitEn(cwd) {
  return (...a) => execFileSync('git', ['-c', 'user.name=Prueba', '-c', 'user.email=prueba@ejemplo.test', '-c', 'commit.gpgsign=false', ...a], { cwd, encoding: 'utf8' }).trim();
}
