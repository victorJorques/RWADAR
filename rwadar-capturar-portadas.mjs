import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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

/* Catálogo de páginas e imágenes oficiales comprobado el 23-08-2026. La
   selección activa se compone más abajo: conservamos una fotografía oficial
   cuando explica por sí sola el activo y usamos una representación editorial
   propia cuando la web solo ofrece pantallas, precios o diagramas. Nunca se
   mezclan ambas procedencias en el manifiesto. */
const PORTADAS_EDITORIALES = Object.freeze({
  ADDX: {
    pagina: 'https://addx.co/en/how-to-start/',
    imagen: 'https://addx.co/images/large/Group_1599_e5991e0662.webp',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Confirmación de una inversión tokenizada en la aplicación de ADDX.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  Archax: {
    pagina: 'https://uk.archax.com/businesses/tokenisation',
    imagen: 'https://uk.archax.com/images/diagrams/token-diagram-2.png',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'Ecosistema de emisión, negociación, custodia y distribución de activos digitales.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  'ARTEX Global Markets': {
    pagina: 'https://artexgm.com/artex-mtf',
    imagen: 'https://artex-prod-www-artex-io-uploads.s3.eu-central-1.amazonaws.com/Water_Lilies_claude_monet_min_b55ee89acd.jpg',
    tipoVisual: 'Activo real',
    descripcionVisual: 'Detalle de Water Lilies de Claude Monet, obra presentada por ARTEX.',
    encuadre: 'cover', focoX: .5, focoY: .48,
  },
  'Backed Finance': {
    pagina: 'https://backed.fi/',
    imagen: 'https://cdn.prod.website-files.com/603de78742be86399f94ec70/67cdd2e5d31d5e7183a76a72_1650ad91cf8e237b31ca798e4911c945_hero-defi.svg',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Panel de xStocks con activos tokenizados y gráficos de mercado.',
    encuadre: 'cover', focoX: .72, focoY: .5,
  },
  Blocksquare: {
    pagina: 'https://blocksquare.io/products/white-label-platform',
    imagen: 'https://blocksquare.io/assets/products/stage2/delta-property_card-01.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Ficha de un inmueble de Londres con tokens, valoración y rentabilidad.',
    encuadre: 'contain', focoX: .5, focoY: .3,
  },
  Centrifuge: {
    pagina: 'https://centrifuge.io/blog/app-update-pool-creation',
    imagen: 'https://cdn.prod.website-files.com/670e54977f3ebadc23387103/684ff5d6774fca94d685d190_egXunDrSEeIkwmN4DVUj5.avif',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Creación de un pool de activos con su estructura y tramos.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  Courtyard: {
    pagina: 'https://courtyard.io/blog/post/trading-is-live-on-courtyard',
    imagen: 'https://cdn.prod.website-files.com/683e3328c9effc3c92ec43e6/6a19caa9ca24e8ec3a411f58_trade_center.jpg',
    tipoVisual: 'Producto real',
    descripcionVisual: 'Trade Center móvil rodeado de coleccionables físicos certificados.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Figure: {
    pagina: 'https://www.figure.com/partner/figure-connect/',
    imagen: 'https://www.datocms-assets.com/33246/1786059711-stage2.png?auto=compress%2Cformat&fit=clamp&q=50',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'Ciclo de Figure Connect: activos, mercado, liquidez y retornos.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  Fireblocks: {
    pagina: 'https://www.fireblocks.com/products/tokenization',
    imagen: 'https://fireblocks.com/wp-content/uploads/2025/10/product-tokenization-hero.svg',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Operaciones de un token con emisión, quema, pausa y capitalización.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  'Franklin Templeton': {
    pagina: 'https://digitalassets.franklintempleton.com/benji/',
    imagen: 'https://digitalassets.franklintempleton.com/static/2ff71538364b97c29aa1f9ef40af0b67/5814f/app-screenshot-home.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Aplicación Benji con cartera, rendimiento, saldo y wallet blockchain.',
    encuadre: 'contain', focoX: .5, focoY: .48,
  },
  INX: {
    pagina: 'https://crypto-support.inx.co/hc/en-gb/articles/8531480153489-What-is-the-Order-Book',
    imagen: 'https://crypto-support.inx.co/hc/article_attachments/4406217258385/mceclip0__3_.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Libro de órdenes de INX.One con precios, volumen, compras y ventas.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Lofty: {
    pagina: 'https://www.lofty.ai/property_deal/6601-E-Hearn-Rd_Scottsdale-AZ-85254',
    imagen: 'https://images.lofty.ai/images/01J1ZRN9EZVYA08NMNVHT2BPC1/01JK78G5F00ZVVBANM5ZTM3Q6M.webp',
    tipoVisual: 'Activo real',
    descripcionVisual: 'Propiedad de Scottsdale con vivienda, piscina, jardín y pista deportiva.',
    encuadre: 'cover', focoX: .55, focoY: .5,
  },
  'Maple Finance': {
    pagina: 'https://maple.finance/borrower-hub',
    imagen: 'https://maple.finance/images/action-pay-interest.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Gestión de un préstamo institucional y pago de intereses en USDC.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Midas: {
    pagina: 'https://midas.app/',
    imagen: 'https://midas.app/assets/liquidity-CB0UVDY5.svg',
    tipoVisual: 'Ilustración 3D oficial',
    descripcionVisual: 'Visual 3D del producto de liquidez tokenizada de Midas.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  'Ondo Finance': {
    pagina: 'https://ondo.finance/blog/real-24-7-trading-for-tokenized-stocks',
    imagen: 'https://cdn.sanity.io/images/8k2tqa6n/production/f1426f6b7c1670099734fa87d07e55d57bee898b-1600x960.png',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'Mercado continuo con fichas de acciones y ETF tokenizados.',
    encuadre: 'cover', focoX: .72, focoY: .5,
  },
  OpenEden: {
    pagina: 'https://openeden.com/news/moodys-awards-investment-grade-a-rating-to-openeden-tokenized-t-bill/',
    imagen: 'https://openeden.com/news/wp-content/uploads/2025/05/Moodys-Rating.png',
    tipoVisual: 'Hito oficial',
    descripcionVisual: 'Composición del fondo TBILL y su calificación institucional de Moody’s.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  'Pax Gold': {
    pagina: 'https://www.paxos.com/pax-gold',
    imagen: 'https://framerusercontent.com/images/AKNChrA8m1C4T5yd7uNjiHigdN4.webp?height=4133&width=4467',
    tipoVisual: 'Render oficial del activo',
    descripcionVisual: 'Pieza PAXG vinculada a una onza de oro London Good Delivery.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Reental: {
    pagina: 'https://www.reental.co/',
    imagen: 'https://cdn.prod.website-files.com/64883b1804f368bf8575ed2e/67cee7ae5df884022e17931d_ui%20snippet.webp',
    tipoVisual: 'Proyecto e interfaz real',
    descripcionVisual: 'Proyecto inmobiliario acompañado de su ficha de resultado en Reental.',
    encuadre: 'cover', focoX: .72, focoY: .5,
  },
  Republic: {
    pagina: 'https://republic.com/app',
    imagen: 'https://uploads.republic.com/p/images/attachments/default/000/004/0000/AppHero%402x.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Aplicación de Republic con una cuadrícula de oportunidades privadas.',
    encuadre: 'contain', focoX: .5, focoY: .5,
  },
  Securitize: {
    pagina: 'https://securitize.io/',
    imagen: 'https://cdn.builder.io/api/v1/image/assets%2Fd39b51a544e84e2fbb2445f58c6c6f2c%2Ff1ddda5116b346269debabe4bb0b472f',
    tipoVisual: 'Imagen corporativa oficial',
    descripcionVisual: 'Distrito financiero de Nueva York en la presentación oficial de Securitize.',
    encuadre: 'cover', focoX: .55, focoY: .45,
  },
  Spiko: {
    pagina: 'https://www.spiko.io/es',
    imagen: 'https://cdn.prod.website-files.com/670cbf7bea9b168605318b30/6a72137204b2cc4646d4fc24_HOME_ES.jpg',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'Presentación visual de los fondos monetarios y la aplicación de Spiko.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Superstate: {
    pagina: 'https://superstate.com/',
    imagen: 'https://assets.superstate.com/images/2026/03/26/fundos-stack-hp.jpg',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'FundOS, la infraestructura de Superstate para mover fondos y acciones on-chain.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Swarm: {
    pagina: 'https://swarm.com/platform/',
    imagen: 'https://swarm.com/wp-content/uploads/2023/02/swarm-invest-platform-screenshot-1-1024x561.jpg',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Panel de inversión de Swarm con activos tokenizados y mercado.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Taurus: {
    pagina: 'https://www.taurushq.com/capital/',
    imagen: 'https://www.taurushq.com/img/hero-capital.webp',
    tipoVisual: 'Producto oficial',
    descripcionVisual: 'Plataforma Taurus-CAPITAL para emitir y gestionar activos digitales.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  Tokeny: {
    pagina: 'https://tokeny.com/',
    imagen: 'https://tokeny.com/wp-content/uploads/2024/05/Token-issuance-1024x1024.png',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Flujo de emisión de tokens con controles de cumplimiento.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
  tZERO: {
    pagina: 'https://www.tzero.com/',
    imagen: 'https://www.tzero.com/api/sanity-assets/images/jpd7ydtd/pre-prod/49263c36cf31a77a4a019e61d8689ab335036b4c-2532x1771.png?fit=max&auto=format',
    tipoVisual: 'Interfaz real',
    descripcionVisual: 'Portal de tokenización con ofertas reales mostradas en la plataforma de tZERO.',
    encuadre: 'cover', focoX: .5, focoY: .5,
  },
});

/* Una escena distinta por empresa. Son explicaciones visuales del tipo de
   activo, no fotografías de un proyecto concreto ni material promocional de
   la plataforma. Los maestros viven fuera del árbol publicable; únicamente
   sale el WebP 720×720 sin metadatos. */
const PORTADAS_GENERADAS = Object.freeze({
  ADDX: { archivoFuente: 'addx.webp', descripcionVisual: 'Cartera de empresas privadas convertida en participaciones digitales.' },
  Archax: { archivoFuente: 'archax.webp', descripcionVisual: 'Valores privados y bonos dentro de una infraestructura de mercado institucional.' },
  'Backed Finance': { archivoFuente: 'backed-finance.webp', descripcionVisual: 'Cesta de sectores empresariales convertida en unidades digitales respaldadas.' },
  Blocksquare: { archivoFuente: 'blocksquare.webp', descripcionVisual: 'Edificio residencial y comercial completo representado mediante participaciones digitales.' },
  Centrifuge: { archivoFuente: 'centrifuge.webp', descripcionVisual: 'Inventario productivo financiado mediante un préstamo respaldado por activos.' },
  Courtyard: { archivoFuente: 'courtyard.webp', descripcionVisual: 'Coleccionables físicos protegidos en una cámara y representados digitalmente.' },
  Figure: { archivoFuente: 'figure.webp', descripcionVisual: 'Vivienda completa vinculada a un crédito hipotecario digital.' },
  Fireblocks: { archivoFuente: 'fireblocks.webp', descripcionVisual: 'Bóveda institucional que custodia y protege distintos activos digitales.' },
  'Franklin Templeton': { archivoFuente: 'franklin-templeton.webp', descripcionVisual: 'Fondo monetario respaldado por deuda pública de corto plazo en custodia.' },
  INX: { archivoFuente: 'inx.webp', descripcionVisual: 'Participación empresarial transferida dentro de un mercado digital regulado.' },
  'Maple Finance': { archivoFuente: 'maple-finance.webp', descripcionVisual: 'Préstamo institucional respaldado por activos digitales hacia una empresa real.' },
  Midas: { archivoFuente: 'midas.webp', descripcionVisual: 'Cesta diversificada de bonos soberanos y corporativos convertida en fondo.' },
  'Ondo Finance': { archivoFuente: 'ondo-finance.webp', descripcionVisual: 'Deuda pública y fondos cotizados disponibles mediante unidades digitales.' },
  OpenEden: { archivoFuente: 'openeden.webp', descripcionVisual: 'Letras del Tesoro protegidas en custodia y representadas en cadena.' },
  Reental: { archivoFuente: 'reental.webp', descripcionVisual: 'Promoción residencial mediterránea completa dividida en participaciones digitales.' },
  Republic: { archivoFuente: 'republic.webp', descripcionVisual: 'Empresa privada de tecnología limpia financiada mediante participaciones digitales.' },
  Securitize: { archivoFuente: 'securitize.webp', descripcionVisual: 'Participaciones de un fondo institucional registradas en una infraestructura digital.' },
  Spiko: { archivoFuente: 'spiko.webp', descripcionVisual: 'Tesorería empresarial y deuda pública de corto plazo dentro de un fondo monetario.' },
  Superstate: { archivoFuente: 'superstate.webp', descripcionVisual: 'Participaciones de deuda pública anotadas directamente en un libro mayor digital.' },
  Swarm: { archivoFuente: 'swarm.webp', descripcionVisual: 'Acción y bono representados como activos digitales dentro de un mercado seguro.' },
  Taurus: { archivoFuente: 'taurus.webp', descripcionVisual: 'Bóveda bancaria conectada con la emisión y custodia de activos digitales.' },
  Tokeny: { archivoFuente: 'tokeny.webp', descripcionVisual: 'Puerta de identidad y cumplimiento que admite únicamente unidades verificadas.' },
  tZERO: { archivoFuente: 'tzero.webp', descripcionVisual: 'Participaciones de una empresa privada dentro de un mercado secundario digital.' },
});

const PORTADAS_ACTIVAS = Object.freeze(Object.fromEntries(
  Object.entries(PORTADAS_EDITORIALES).map(([empresa, portada]) => {
    const generada = PORTADAS_GENERADAS[empresa];
    return [empresa, generada ? {
      ...portada,
      ...generada,
      imagen: null,
      tipoVisual: 'Representación editorial generada',
      origenVisual: 'representacion-editorial-generada',
      encuadre: 'cover',
      focoX: .5,
      focoY: .5,
    } : { ...portada, origenVisual: 'fuente-oficial' }];
  }),
));
const PORTADAS_OFICIALES = Object.freeze(Object.fromEntries(
  Object.entries(PORTADAS_ACTIVAS)
    .filter(([, portada]) => portada.origenVisual === 'fuente-oficial')
    .map(([empresa, portada]) => [empresa, portada.imagen]),
));
const PAGINAS_PORTADA = Object.freeze(Object.fromEntries(
  Object.entries(PORTADAS_ACTIVAS).map(([empresa, portada]) => [empresa, portada.pagina]),
));
const REVISIONES_MANUALES = Object.freeze(Object.fromEntries(
  Object.keys(PORTADAS_ACTIVAS).map(empresa => [empresa, 6]),
));

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

async function descargar(url, paginaReferencia = '') {
  const cabeceras = {
    'user-agent': AGENTE,
    accept: 'image/avif,image/webp,image/*,*/*;q=0.7',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.6',
  };
  if (paginaReferencia) cabeceras.referer = paginaReferencia;
  const res = await fetchSeguro(url, {
    signal: timeout(),
    headers: cabeceras,
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

function svgSeguro(bytes) {
  const texto = bytes.toString('utf8');
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(texto)) return false;
  if (/<(?:script|foreignObject)\b|<!DOCTYPE|<!ENTITY|\bon\w+\s*=/i.test(texto)) {
    throw new Error('SVG activo o con entidades no permitido');
  }
  const referencias = /(?:href|src)\s*=\s*["']\s*(?!#|data:image\/(?:png|jpeg|webp);base64,)/i;
  const cssExterno = /url\(\s*["']?\s*(?!#|data:image\/(?:png|jpeg|webp);base64,)/i;
  if (referencias.test(texto) || cssExterno.test(texto)) {
    throw new Error('SVG con recursos externos no permitido');
  }
  return true;
}

async function convertirWebp(bytes, destino, carpetaTemporal, empresa) {
  const temporal = path.join(carpetaTemporal, `${crypto.randomUUID()}.imagen`);
  const temporalSalida = path.join(SALIDA, `.${path.basename(destino)}.${crypto.randomUUID()}.tmp.webp`);
  const esSvg = svgSeguro(bytes);
  const entrada = esSvg ? await sharp(bytes, { density: 144, limitInputPixels: MAX_PIXELES })
    .flatten({ background: '#07090d' })
    .resize({ width: 1_440, height: 1_440, fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toBuffer() : bytes;
  await fs.writeFile(temporal, entrada);
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
    const portada = PORTADAS_ACTIVAS[empresa] || {};
    const focoX = Math.min(1, Math.max(0, Number(portada.focoX ?? .5)));
    const focoY = Math.min(1, Math.max(0, Number(portada.focoY ?? .5)));
    const filtroContain = [
      '[0:v]format=rgba,split=2[bg][fg]',
      '[bg]scale=720:720:force_original_aspect_ratio=increase,crop=720:720,gblur=sigma=28,eq=brightness=-0.2:saturation=0.88[back]',
      '[fg]scale=720:720:force_original_aspect_ratio=decrease,eq=saturation=1.04:contrast=1.015[front]',
      '[back][front]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[out]',
    ].join(';');
    const filtroCover = [
      `[0:v]format=rgba,scale=720:720:force_original_aspect_ratio=increase,crop=720:720:'(iw-ow)*${focoX}':'(ih-oh)*${focoY}'`,
      'eq=saturation=1.07:contrast=1.025:brightness=0.01,format=yuv420p[out]',
    ].join(',');
    const filtro = portada.encuadre === 'cover' ? filtroCover : filtroContain;
    await ejecutar('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', temporal,
      '-filter_complex', filtro, '-map', '[out]', '-frames:v', '1',
      '-an', '-map_metadata', '-1', '-c:v', 'libwebp', '-quality', '84', '-compression_level', '6',
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
  const portada = PORTADAS_ACTIVAS[p.n] || {};
  const generada = PORTADAS_GENERADAS[p.n] || null;
  const esGenerada = portada.origenVisual === 'representacion-editorial-generada';
  const metadatosEditoriales = {
    tipoVisual: portada.tipoVisual || 'Imagen oficial',
    descripcionVisual: portada.descripcionVisual || 'Imagen publicada por la página oficial de la empresa.',
    encuadre: portada.encuadre || 'contain',
    foco: `${Math.round(Number(portada.focoX ?? .5) * 100)}% ${Math.round(Number(portada.focoY ?? .5) * 100)}%`,
    origenVisual: portada.origenVisual || 'fuente-oficial',
    uso: esGenerada
      ? `Representación editorial creada por RWAdar para explicar ${p.cat.toLowerCase()}. No muestra un activo concreto de ${p.n} ni implica afiliación, patrocinio o recomendación de inversión.`
      : 'Miniatura editorial informativa procedente de una fuente oficial; no implica afiliación, patrocinio ni recomendación de inversión.',
  };
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
    const procedencia = esGenerada ? {
      pagina: null,
      paginaReferencia: PAGINAS_PORTADA[p.n] || p.web,
      imagenOrigen: null,
      creador: 'RWAdar',
      herramienta: 'ImageGen integrado de Codex',
    } : {
      pagina: PAGINAS_PORTADA[p.n] || anterior.pagina || p.web,
      imagenOrigen: PORTADAS_OFICIALES[p.n] || anterior.imagenOrigen || p.web,
    };
    return {
      empresa: p.n,
      archivo: `plataformas/${nombreArchivo}`,
      ...procedencia,
      capturada: anterior.sha256 === sha256 && anterior.capturada ? anterior.capturada : estado.mtime.toISOString(),
      sha256,
      bytes: bytesFinales.length,
      metodo: esGenerada
        ? 'Representación editorial generada para RWAdar y optimizada localmente sin metadatos.'
        : 'Recurso observado en la página oficial y optimizado localmente.',
      ...metadatosEditoriales,
      ...(revisionDeseada ? { revisionPortada: revisionDeseada } : {}),
      conservada: true,
      ...(observacion ? { observacion } : {}),
    };
  };
  const anterior = anteriores.get(p.n) || {};
  if (!FORZAR && (!esGenerada || Number(anterior.revisionPortada || 0) >= Number(REVISIONES_MANUALES[p.n] || 0))) {
    try { return await conservar(); } catch {}
  }

  if (esGenerada) {
    const fuente = path.join(RAIZ, 'rwadar-editorial-source', generada.archivoFuente);
    const bytes = await fs.readFile(fuente);
    if (bytes.length < 1_024 || bytes.length > MAX_BYTES) {
      throw new Error(`maestro editorial con tamaño no permitido: ${bytes.length}`);
    }
    await convertirWebp(bytes, destino, carpetaTemporal, p.n);
    const bytesFinales = await fs.readFile(destino);
    return {
      empresa: p.n,
      archivo: `plataformas/${nombreArchivo}`,
      pagina: null,
      paginaReferencia: PAGINAS_PORTADA[p.n] || p.web,
      imagenOrigen: null,
      creador: 'RWAdar',
      herramienta: 'ImageGen integrado de Codex',
      capturada: new Date().toISOString(),
      sha256: crypto.createHash('sha256').update(bytesFinales).digest('hex'),
      bytes: bytesFinales.length,
      metodo: 'Representación editorial generada para RWAdar y optimizada localmente sin metadatos.',
      ...metadatosEditoriales,
      revisionPortada: REVISIONES_MANUALES[p.n],
    };
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
      ...metadatosEditoriales,
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
      const imagen = await descargar(candidato, paginaFinal);
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
        ...metadatosEditoriales,
        ...(REVISIONES_MANUALES[p.n] ? { revisionPortada: REVISIONES_MANUALES[p.n] } : {}),
      };
    } catch (e) { errores.push(`${candidato}: ${e.message}`); }
  }
  if (PORTADAS_ACTIVAS[p.n]) {
    throw new Error(errores.length ? errores.join(' | ') : 'la portada editorial oficial no se pudo recapturar');
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
  const criterio = 'Una portada completa por empresa: fotografía oficial cuando explica el activo o representación editorial propia cuando la web solo ofrece pantallas, precios o diagramas; procedencia discriminada y copia WebP local sin metadatos ni rastreo externo.';
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
