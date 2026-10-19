// Para preparar una revisión: abre en Chromium, sin iniciar sesión ni aceptar
// nada, cada fuente del radar y cada destino de las fichas de la revisión
// indicada, y guarda estado HTTP, URL final, título y texto visible (los PDF,
// con pdftotext). Solo lee: no escribe en el repositorio.
// Uso: node rwadar-app/capturar-fuentes.mjs AAAA-MM-DD [salida.json] [--solo=dominio,…]
// La salida por omisión va a la carpeta temporal del sistema; si ya existe,
// se conserva lo capturado y se repiten solo las URL pedidas.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const APP = path.dirname(fileURLToPath(import.meta.url));
const [fecha, salidaArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) throw new Error('Uso: node rwadar-app/capturar-fuentes.mjs AAAA-MM-DD [salida.json]');
const salida = path.resolve(salidaArg || path.join(os.tmpdir(), `rwadar-capturas-${fecha}.json`));
const solo = (process.argv.find(a => a.startsWith('--solo=')) || '').slice(7).split(',').filter(Boolean);

const carpeta = path.join(APP, 'data', 'verificaciones', `${fecha}-v2`);
const leer = archivo => JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
const radar = leer('radar-canonico-26.json');
const escaparate = leer('escaparate-publicacion.json');
const documentacion = leer('documentacion-ofertas.json');
const esPublica = u => !/^https:\/\/claude\.ai\//.test(u);
let urls = [...new Set([
  ...radar.fuentes.map(f => f.url),
  ...escaparate.ofertas.flatMap(o => [o.url, ...o.fuentesActuales, ...documentacion[o.slug].fuentes]),
].filter(esPublica))];
if (solo.length) urls = urls.filter(u => solo.some(s => u.includes(s)));

function cargarPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  const global = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return createRequire(path.join(global, 'noop.js'))('playwright');
}
const { chromium } = cargarPlaywright();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

function leerPdf(url) {
  const tmp = path.join(os.tmpdir(), `rwadar-fuente-${process.pid}-${Date.now()}.pdf`);
  try {
    execFileSync('curl', ['-sSL', '--max-time', '60', '-A', UA, '-o', tmp, url]);
    return execFileSync('pdftotext', ['-layout', tmp, '-'], { maxBuffer: 64 << 20 }).toString();
  } finally { fs.rmSync(tmp, { force: true }); }
}

const resultado = fs.existsSync(salida) ? JSON.parse(fs.readFileSync(salida, 'utf8')) : {};
const navegador = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});
const contexto = await navegador.newContext({ userAgent: UA, locale: 'es-ES', viewport: { width: 1366, height: 900 } });
const cola = [...urls];
async function trabajador() {
  for (let url; (url = cola.shift());) {
    const r = { url, consultada: new Date().toISOString() };
    const pagina = await contexto.newPage();
    try {
      const respuesta = await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      r.estado = respuesta ? respuesta.status() : null;
      r.tipo = respuesta ? (respuesta.headers()['content-type'] || '') : '';
      await pagina.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await pagina.waitForTimeout(1500);
      r.final = pagina.url();
      r.titulo = await pagina.title().catch(() => '');
      r.texto = /pdf/i.test(r.tipo) ? leerPdf(url)
        : await pagina.evaluate(() => document.body ? document.body.innerText : '');
    } catch (e) {
      r.error = String(e.message || e).split('\n')[0];
      // Chromium sin ventana descarga los PDF en lugar de mostrarlos.
      if (/\.pdf($|\?)/i.test(url) || /download/i.test(r.error)) {
        try { r.texto = leerPdf(url); r.estado ??= 'pdf'; } catch (e2) { r.errorPdf = String(e2.message).split('\n')[0]; }
      }
    } finally { await pagina.close().catch(() => {}); }
    r.texto = (r.texto || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, 300000);
    resultado[url] = r;
    console.log(`${String(r.estado ?? r.error).slice(0, 40).padEnd(10)} ${String(r.texto.length).padStart(7)}  ${url}`);
    fs.writeFileSync(salida, JSON.stringify(resultado, null, 1));
  }
}
await Promise.all(Array.from({ length: 4 }, trabajador));
await navegador.close();
console.log(`${urls.length} URL; capturas en ${salida}`);
