import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const FUENTE = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.js');
const SALIDA = path.join(RAIZ, 'rwadar-site', 'plataformas');
const MANIFIESTO = path.join(SALIDA, 'fuentes.json');
const FORZAR = process.argv.includes('--force');
const RECURSOS_LOCALES = new Map(process.argv.filter(x => x.startsWith('--recurso-local='))
  .map(x => x.slice('--recurso-local='.length)).map(x => {
    const separador = x.indexOf('=');
    if (separador < 1) throw new Error('usa --recurso-local=Empresa=ruta');
    return [x.slice(0, separador), x.slice(separador + 1)];
  }));
const AGENTE = 'RWAdar/1.0 (+https://rwadar.pages.dev; capturas editoriales de fuentes oficiales)';
const MAX_BYTES = 18 * 1024 * 1024;
const MAX_HTML_BYTES = 4 * 1024 * 1024;
const MAX_PIXELES = 48_000_000;
const MAX_LADO = 10_000;
const MAX_REDIRECCIONES = 5;

/* Algunas portadas oficiales bloquean las peticiones automatizadas aunque
   sus imágenes públicas sí son descargables. Estas rutas se localizaron en
   el propio marcado o kit de prensa oficial y se guardan también en
   fuentes.json para poder revisarlas más adelante. */
const PORTADAS_OFICIALES = Object.freeze({
  Archax: 'https://uk.archax.com/images/diagrams/tokenisation-diagram.png',
  Centrifuge: 'https://cdn.prod.website-files.com/6706324b4c48131ee537ff96/687e239782203000d816ce87_Centrifuge%20OpenGraph%20-%20Home.png',
  'Franklin Templeton': 'https://franklintempletonprod.widen.net/content/9flm2dfcxt/webp/FTDA_Tech_TransferAgent.jpg',
  INX: 'https://uploads.republic.com/p/images/attachments/original/000/206/906/206906-1771981450-cc8ab10bb1e0f9371bd8eb8b8dc46ebfad65f9ea.png',
  Midas: 'https://midas.app/graph.png',
  OpenEden: 'https://openeden.com/media-kit/logotype-dark.png',
  Republic: 'https://republic.com/_next/static/media/pic-logos.16b4e92d.png',
  Swarm: 'https://443125518-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FH47eAliP3CFktA0GA1zW%2Fuploads%2FZA3wd9fZk2riAHUmIdBv%2FSwarm-Circle.png?alt=media&token=09a1a52e-627c-4f47-b42b-274a491dff7a',
});

const PAGINAS_PORTADA = Object.freeze({
  Archax: 'https://uk.archax.com/businesses/tokenisation',
  'Franklin Templeton': 'https://www.franklintempleton.com/about-us/our-teams/specialist-investment-managers/digital-assets/digital-assets-technology',
  OpenEden: 'https://openeden.com/media-kit',
});

const REVISIONES_MANUALES = Object.freeze({ Republic: 4 });

let anteriores = new Map();
let manifiestoAnterior = null;

const slug = valor => String(valor)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const timeout = (ms = 20_000) => AbortSignal.timeout(ms);

function atributos(etiqueta) {
  const salida = {};
  const re = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m;
  while ((m = re.exec(etiqueta))) salida[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return salida;
}

function candidatosImagen(html, pagina) {
  const candidatos = [];
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  for (const meta of metas) {
    const a = atributos(meta);
    const clave = String(a.property || a.name || '').toLowerCase();
    if (['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src'].includes(clave) && a.content) {
      candidatos.push(a.content);
    }
  }
  const enlaces = html.match(/<link\b[^>]*>/gi) || [];
  const iconos = [];
  for (const enlace of enlaces) {
    const a = atributos(enlace);
    const rel = String(a.rel || '').toLowerCase();
    if (!a.href) continue;
    if (rel.includes('image_src')) candidatos.push(a.href);
    if (rel.includes('apple-touch-icon')) iconos.unshift(a.href);
    else if (rel.split(/\s+/).includes('icon')) iconos.push(a.href);
  }
  candidatos.push(...iconos, '/favicon.ico');
  return [...new Set(candidatos.map(valor => {
    try { return new URL(valor, pagina).href; } catch { return ''; }
  }).filter(Boolean))];
}

function ipNoPublica(valor) {
  let ip = String(valor || '').toLowerCase().split('%')[0];
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  const familia = net.isIP(ip);
  if (familia === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19));
  }
  if (familia === 6) {
    return ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') ||
      /^fe[89ab]/.test(ip);
  }
  return true;
}

async function urlPublicaHttps(valor) {
  const url = new URL(valor);
  if (url.protocol !== 'https:') throw new Error('solo se permiten recursos HTTPS');
  if (url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('URL remota no permitida');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('host local no permitido');
  }
  const direcciones = net.isIP(host)
    ? [{ address: host }]
    : await dns.lookup(host, { all: true, verbatim: true });
  if (!direcciones.length || direcciones.some(x => ipNoPublica(x.address))) {
    throw new Error('red privada o reservada no permitida');
  }
  return url;
}

async function fetchSeguro(valor, opciones = {}) {
  let actual = String(valor);
  for (let i = 0; i <= MAX_REDIRECCIONES; i += 1) {
    const url = await urlPublicaHttps(actual);
    const res = await fetch(url, { ...opciones, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(res.status)) return res;
    const ubicacion = res.headers.get('location');
    await res.body?.cancel().catch(() => {});
    if (!ubicacion) throw new Error('redirección sin destino');
    actual = new URL(ubicacion, url).href;
  }
  throw new Error('demasiadas redirecciones');
}

async function leerLimitado(res, maximo) {
  const declarados = Number(res.headers.get('content-length') || 0);
  if (declarados > maximo) throw new Error('respuesta demasiado grande');
  if (!res.body) return Buffer.alloc(0);
  const lector = res.body.getReader();
  const trozos = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximo) throw new Error('respuesta demasiado grande');
      trozos.push(Buffer.from(value));
    }
  } catch (e) {
    await lector.cancel().catch(() => {});
    throw e;
  }
  return Buffer.concat(trozos, total);
}

async function descargar(url) {
  const res = await fetchSeguro(url, {
    signal: timeout(),
    headers: { 'user-agent': AGENTE, accept: 'image/avif,image/webp,image/*,*/*;q=0.7' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const tipo = String(res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!tipo.startsWith('image/')) throw new Error(`tipo ${tipo || 'desconocido'}`);
  const bytes = await leerLimitado(res, MAX_BYTES);
  if (bytes.length < 512 || bytes.length > MAX_BYTES) throw new Error(`tamaño ${bytes.length}`);
  return { bytes, tipo, urlFinal: res.url };
}

async function ejecutar(programa, argumentos) {
  await new Promise((resolver, rechazar) => {
    const hijo = spawn(programa, argumentos, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let error = '';
    hijo.stderr.on('data', trozo => { error += trozo; });
    hijo.on('error', rechazar);
    hijo.on('close', codigo => codigo === 0 ? resolver() : rechazar(new Error(error.trim() || `${programa} terminó con ${codigo}`)));
  });
}

async function ejecutarConSalida(programa, argumentos) {
  return new Promise((resolver, rechazar) => {
    const hijo = spawn(programa, argumentos, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let salida = '';
    let error = '';
    hijo.stdout.on('data', trozo => { salida += trozo; });
    hijo.stderr.on('data', trozo => { error += trozo; });
    hijo.on('error', rechazar);
    hijo.on('close', codigo => codigo === 0 ? resolver(salida) : rechazar(new Error(error.trim() || `${programa} terminó con ${codigo}`)));
  });
}

async function convertirWebp(bytes, destino, carpetaTemporal, empresa) {
  const temporal = path.join(carpetaTemporal, `${crypto.randomUUID()}.imagen`);
  const temporalSalida = path.join(SALIDA, `.${path.basename(destino)}.${crypto.randomUUID()}.tmp.webp`);
  await fs.writeFile(temporal, bytes);
  try {
    const datos = JSON.parse(await ejecutarConSalida('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
      '-of', 'json', temporal,
    ]));
    const ancho = Number(datos.streams?.[0]?.width || 0);
    const alto = Number(datos.streams?.[0]?.height || 0);
    if (!ancho || !alto || ancho > MAX_LADO || alto > MAX_LADO || ancho * alto > MAX_PIXELES) {
      throw new Error(`dimensiones no permitidas: ${ancho}×${alto}`);
    }
    const filtroRepublic = "crop='min(iw*0.51,ih)':'min(iw*0.51,ih)':0:0,scale=720:720";
    const filtroGeneral = [
      '[0:v]format=rgba,split=2[bg][fg]',
      '[bg]scale=720:720:force_original_aspect_ratio=increase,crop=720:720,gblur=sigma=24,eq=brightness=-0.16:saturation=0.82[back]',
      '[fg]scale=720:720:force_original_aspect_ratio=decrease[front]',
      '[back][front]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[out]',
    ].join(';');
    const argumentosFiltro = empresa === 'Republic'
      ? ['-vf', filtroRepublic]
      : ['-filter_complex', filtroGeneral, '-map', '[out]'];
    await ejecutar('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', temporal,
      ...argumentosFiltro, '-frames:v', '1',
      '-an', '-c:v', 'libwebp', '-quality', '78', '-compression_level', '6',
      temporalSalida,
    ]);
    const finales = await fs.readFile(temporalSalida);
    if (finales.length <= 1_024 || finales.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      finales.subarray(8, 12).toString('ascii') !== 'WEBP') {
      throw new Error('WebP convertido no válido');
    }
    await fs.rename(temporalSalida, destino);
  } finally {
    await fs.unlink(temporal).catch(() => {});
    await fs.unlink(temporalSalida).catch(() => {});
  }
}

async function plataformas() {
  const codigo = await fs.readFile(FUENTE, 'utf8');
  const inicio = codigo.indexOf('const P=[');
  const fin = codigo.indexOf('\n];', inicio);
  if (inicio < 0 || fin < 0) throw new Error('no se pudo leer el registro P');
  const expresion = codigo.slice(inicio + 'const P='.length, fin + 2);
  const lista = vm.runInNewContext(expresion, Object.create(null), { timeout: 1_000 });
  if (!Array.isArray(lista) || lista.length !== 26) throw new Error(`registro inesperado: ${lista?.length}`);
  return lista;
}

async function una(p, carpetaTemporal) {
  const nombreArchivo = `${slug(p.n)}.webp`;
  const destino = path.join(SALIDA, nombreArchivo);
  const conservar = async observacion => {
    const anterior = anteriores.get(p.n) || {};
    const revisionDeseada = Number(REVISIONES_MANUALES[p.n] || 0);
    let estado = await fs.stat(destino);
    if (!estado.isFile() || estado.size <= 1_024) throw new Error('portada local ausente o vacía');
    let bytesFinales = await fs.readFile(destino);
    const datos = JSON.parse(await ejecutarConSalida('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
      '-of', 'json', destino,
    ]));
    if (Number(datos.streams?.[0]?.width) !== 720 || Number(datos.streams?.[0]?.height) !== 720 ||
      Number(anterior.revisionPortada || 0) < revisionDeseada) {
      await convertirWebp(bytesFinales, destino, carpetaTemporal, p.n);
      estado = await fs.stat(destino);
      bytesFinales = await fs.readFile(destino);
    }
    const sha256 = crypto.createHash('sha256').update(bytesFinales).digest('hex');
    return {
      empresa: p.n,
      archivo: `plataformas/${nombreArchivo}`,
      pagina: PAGINAS_PORTADA[p.n] || anterior.pagina || p.web,
      imagenOrigen: PORTADAS_OFICIALES[p.n] || anterior.imagenOrigen || p.web,
      capturada: anterior.sha256 === sha256 && anterior.capturada ? anterior.capturada : estado.mtime.toISOString(),
      sha256,
      bytes: bytesFinales.length,
      metodo: anterior.metodo || 'Recurso observado en la página oficial y optimizado localmente.',
      ...(revisionDeseada ? { revisionPortada: revisionDeseada } : {}),
      conservada: true,
      ...(observacion ? { observacion } : {}),
    };
  };
  if (!FORZAR) {
    try { return await conservar(); } catch {}
  }

  const recursoLocal = RECURSOS_LOCALES.get(p.n);
  if (recursoLocal) {
    const bytes = await fs.readFile(path.resolve(recursoLocal));
    if (bytes.length < 512 || bytes.length > MAX_BYTES) throw new Error(`recurso local con tamaño ${bytes.length}`);
    await convertirWebp(bytes, destino, carpetaTemporal, p.n);
    const bytesFinales = await fs.readFile(destino);
    return {
      empresa: p.n,
      archivo: `plataformas/${nombreArchivo}`,
      pagina: PAGINAS_PORTADA[p.n] || p.web,
      imagenOrigen: PORTADAS_OFICIALES[p.n] || p.web,
      capturada: new Date().toISOString(),
      sha256: crypto.createHash('sha256').update(bytesFinales).digest('hex'),
      bytes: bytesFinales.length,
      metodo: 'Recurso descargado con el navegador desde la página oficial y optimizado localmente.',
      ...(REVISIONES_MANUALES[p.n] ? { revisionPortada: REVISIONES_MANUALES[p.n] } : {}),
    };
  }

  let paginaFinal = PAGINAS_PORTADA[p.n] || p.web;
  let candidatos;
  if (PORTADAS_OFICIALES[p.n]) candidatos = [PORTADAS_OFICIALES[p.n]];
  else {
    const pagina = await fetchSeguro(p.web, {
      signal: timeout(),
      headers: { 'user-agent': AGENTE, accept: 'text/html,application/xhtml+xml' },
    });
    if (!pagina.ok) throw new Error(`página HTTP ${pagina.status}`);
    const tipoPagina = String(pagina.headers.get('content-type') || '').toLowerCase();
    if (!tipoPagina.includes('text/html')) throw new Error(`página con tipo ${tipoPagina || 'desconocido'}`);
    const html = (await leerLimitado(pagina, MAX_HTML_BYTES)).toString('utf8');
    paginaFinal = pagina.url;
    candidatos = candidatosImagen(html, pagina.url);
  }
  const errores = [];
  for (const candidato of candidatos.slice(0, 12)) {
    try {
      const imagen = await descargar(candidato);
      await convertirWebp(imagen.bytes, destino, carpetaTemporal, p.n);
      const bytesFinales = await fs.readFile(destino);
      return {
        empresa: p.n,
        archivo: `plataformas/${nombreArchivo}`,
        pagina: paginaFinal,
        imagenOrigen: imagen.urlFinal,
        capturada: new Date().toISOString(),
        sha256: crypto.createHash('sha256').update(bytesFinales).digest('hex'),
        bytes: bytesFinales.length,
        metodo: 'Recurso declarado o mostrado por la página oficial y optimizado localmente.',
        ...(REVISIONES_MANUALES[p.n] ? { revisionPortada: REVISIONES_MANUALES[p.n] } : {}),
      };
    } catch (e) { errores.push(`${candidato}: ${e.message}`); }
  }
  try {
    return await conservar('La fuente oficial rechazó la recaptura automatizada; se conservó la copia oficial verificada anteriormente.');
  } catch {}
  throw new Error(errores.length ? errores.join(' | ') : 'la página no declara ninguna imagen utilizable');
}

const lista = await plataformas();
await fs.mkdir(SALIDA, { recursive: true });
try {
  manifiestoAnterior = JSON.parse(await fs.readFile(MANIFIESTO, 'utf8'));
  anteriores = new Map((manifiestoAnterior.plataformas || []).filter(x => x && x.empresa).map(x => [x.empresa, x]));
} catch {}
const carpetaTemporal = await fs.mkdtemp(path.join(os.tmpdir(), 'rwadar-portadas-'));
const resultados = [];
const pendientes = [...lista];

async function obrero() {
  while (pendientes.length) {
    const p = pendientes.shift();
    try {
      const resultado = await una(p, carpetaTemporal);
      resultados.push(resultado);
      console.log(`✓ ${p.n} · ${resultado.archivo}${resultado.conservada ? ' (existente)' : ''}`);
    } catch (e) {
      resultados.push({ empresa: p.n, error: e.message });
      console.error(`✗ ${p.n} · ${e.message}`);
    }
  }
}

try {
  await Promise.all(Array.from({ length: 3 }, obrero));
  resultados.sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'));
  const criterio = 'Imagen declarada o mostrada por la web oficial de cada empresa; copia local cuadrada optimizada sin rastreo externo.';
  const limpiarEstado = lista => lista.map(({ conservada: _conservada, ...entrada }) => entrada);
  const resultadosPublicos = limpiarEstado(resultados);
  const anterioresPublicos = limpiarEstado(manifiestoAnterior?.plataformas || []);
  const mismoContenido = manifiestoAnterior && manifiestoAnterior.criterio === criterio &&
    JSON.stringify(anterioresPublicos) === JSON.stringify(resultadosPublicos);
  const manifiesto = {
    generado: mismoContenido ? manifiestoAnterior.generado : new Date().toISOString(),
    criterio,
    plataformas: resultadosPublicos,
  };
  const nuevo = `${JSON.stringify(manifiesto, null, 2)}\n`;
  let actual = '';
  try { actual = await fs.readFile(MANIFIESTO, 'utf8'); } catch {}
  if (actual !== nuevo) {
    const temporalManifiesto = path.join(SALIDA, `.fuentes.${crypto.randomUUID()}.tmp.json`);
    await fs.writeFile(temporalManifiesto, nuevo, 'utf8');
    await fs.rename(temporalManifiesto, MANIFIESTO);
  }
} finally {
  await fs.rm(carpetaTemporal, { recursive: true, force: true });
}

const fallos = resultados.filter(x => x.error);
console.log(`\n${resultados.length - fallos.length}/${resultados.length} portadas listas.`);
if (fallos.length) process.exitCode = 1;
