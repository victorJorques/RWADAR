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

// La OCC solo entrega el PDF a curl; otras webs, solo a un navegador. Se prueban
// las dos identidades y solo vale lo que de verdad es un PDF.
function leerPdf(url) {
  const tmp = path.join(os.tmpdir(), `rwadar-fuente-${process.pid}-${Date.now()}.pdf`);
  try {
    for (const agente of [UA, 'curl/8.5.0']) {
      try { execFileSync('curl', ['-sSL', '--max-time', '60', '-A', agente, '-o', tmp, url]); } catch { continue; }
      if (fs.existsSync(tmp) && fs.readFileSync(tmp).subarray(0, 4).toString() === '%PDF')
        return execFileSync('pdftotext', ['-layout', tmp, '-'], { maxBuffer: 64 << 20 }).toString();
    }
    throw new Error('la respuesta no es un PDF');
  } finally { fs.rmSync(tmp, { force: true }); }
}

// Segundo intento sin navegador: algunas webs (Cloudflare, NYDFS, FINMA) bloquean
// o fallan con Chromium automatizado y responden bien a una petición directa.
const BLOQUEO = /^(Un momento|Just a moment|Attention Required|Access denied)/i;
function leerHtml(url, agente) {
  const salidaCurl = execFileSync('curl', ['-sSL', '--max-time', '40', '-A', agente,
    '-w', '\n%{http_code} %{url_effective}', url], { maxBuffer: 64 << 20 }).toString();
  const corte = salidaCurl.lastIndexOf('\n');
  const [estado, final] = salidaCurl.slice(corte + 1).split(' ');
  const html = salidaCurl.slice(0, corte);
  const texto = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n');
  const titulo = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  return { estado: Number(estado), final, titulo: titulo.trim(), texto };
}
const necesitaOtroIntento = r => !/pdf/i.test(r.tipo || '') && r.estado !== 'pdf' &&
  (r.error || r.estado >= 400 || BLOQUEO.test(r.titulo || '') || (r.texto || '').length < 200);

// El mercado P2P de Reental pagina su listado: se leen todas las páginas.
async function leerPaginado(pagina) {
  // Espera a sus textos traducidos: antes enseña claves como «order_list.offers».
  const traducido = () => pagina.waitForFunction(() => /\d+ Ofertas?\n/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => {});
  await traducido();
  const textos = [await pagina.evaluate(() => document.body.innerText)];
  for (let n = 2; n <= 20; n++) {
    const boton = pagina.getByText(String(n), { exact: true }).last();
    if (!(await boton.count())) break;
    await boton.click().catch(() => {});
    await pagina.waitForFunction(previo => document.body.innerText !== previo, textos.at(-1), { timeout: 15000 }).catch(() => {});
    await pagina.waitForTimeout(1500);
    await traducido();
    const texto = await pagina.evaluate(() => document.body.innerText);
    if (texto === textos.at(-1)) break;
    textos.push(texto);
  }
  return textos.join('\n\n--- página siguiente ---\n\n');
}

const resultado = fs.existsSync(salida) ? JSON.parse(fs.readFileSync(salida, 'utf8')) : {};
const navegador = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});
// Hora de España: Brickwise y Aktionariat pintan fechas y horas según la zona del navegador.
const contexto = await navegador.newContext({ userAgent: UA, locale: 'es-ES', timezoneId: 'Europe/Madrid',
  viewport: { width: 1366, height: 900 } });
const cola = [...urls];
async function trabajador() {
  for (let url; (url = cola.shift());) {
    const r = { url, consultada: new Date().toISOString() };
    // Los PDF se descargan y se leen con pdftotext: el navegador a veces los
    // descarga, a veces redirige a la portada (OCC) o recibe un 502 (FINMA).
    if (/\.pdf($|\?)/i.test(url)) {
      try { r.texto = leerPdf(url); r.estado = 'pdf'; r.metodo = 'http'; } catch (e) { r.error = String(e.message).split('\n')[0]; }
      guardar(r);
      continue;
    }
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
        : /^https:\/\/p2p\.rnt\.finance\//.test(url) ? await leerPaginado(pagina)
          : await pagina.evaluate(() => document.body ? document.body.innerText : '');
    } catch (e) {
      r.error = String(e.message || e).split('\n')[0];
      // Chromium sin ventana descarga los PDF en lugar de mostrarlos.
      if (/\.pdf($|\?)/i.test(url) || /download/i.test(r.error)) {
        try { r.texto = leerPdf(url); r.estado ??= 'pdf'; } catch (e2) { r.errorPdf = String(e2.message).split('\n')[0]; }
      }
    } finally { await pagina.close().catch(() => {}); }
    if (necesitaOtroIntento(r)) {
      try {
        // Unas webs solo responden a un navegador (Midas) y otras solo a curl (NYDFS).
        const intentos = [UA, 'curl/8.5.0'].map(agente => { try { return leerHtml(url, agente); } catch { return null; } });
        const directa = intentos.find(d => d && d.estado === 200 && !BLOQUEO.test(d.titulo)) || intentos.find(Boolean);
        if (!directa) throw new Error('sin respuesta');
        if (directa.texto.startsWith('%PDF')) Object.assign(directa, { texto: leerPdf(url), titulo: '' });
        if (directa.estado === 200 && !BLOQUEO.test(directa.titulo) && directa.texto.length > (r.texto || '').length) {
          Object.assign(r, { navegador: { estado: r.estado ?? null, error: r.error ?? null, titulo: r.titulo ?? '' },
            estado: 200, final: directa.final, titulo: directa.titulo, texto: directa.texto, metodo: 'http' });
          delete r.error;
        }
      } catch {}
    }
    guardar(r);
  }
}
function guardar(r) {
  r.texto = (r.texto || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, 300000);
  resultado[r.url] = r;
  console.log(`${String(r.estado ?? r.error).slice(0, 40).padEnd(10)} ${String(r.texto.length).padStart(7)}  ${r.url}`);
  fs.writeFileSync(salida, JSON.stringify(resultado, null, 1));
}
await Promise.all(Array.from({ length: 4 }, trabajador));
await navegador.close();
console.log(`${urls.length} URL; capturas en ${salida}`);
