// Noticias que mueven el precio de BTC y el índice de miedo y codicia.
//
// Solo lee: RSS públicos y la API pública de alternative.me. Sin claves ni
// dependencias (fetch nativo de Node 22). El lector RSS es propio y tolerante:
// los feeds reales traen CDATA, entidades dobles, HTML dentro del resumen y,
// a veces, items sin cerrar.
//
// Cómo se decide qué entra y cuánto pesa (titulares en inglés):
//
// 1. RELEVANCIA (solo con el titular). Entra si nombra bitcoin (bitcoin, BTC,
//    sats, satoshi, IBIT/FBTC/GBTC) o si toca un tema que mueve todo el
//    mercado cripto: Fed y tipos, datos macro (IPC, IPP, empleo, dólar,
//    rentabilidad de los bonos, aranceles), ETF, SEC/CFTC y regulación cripto,
//    hackeos, exchanges que congelan retiradas o quiebran, ballenas,
//    liquidaciones, Strategy/MicroStrategy, gobiernos y reservas, Mt. Gox,
//    mineros o un movimiento brusco de «crypto» en general. Si el titular
//    nombra una altcoin (ether, solana, XRP…) y no nombra bitcoin, fuera,
//    salvo que el tema arrastre a todo: la Fed, la macro o un hackeo o una
//    quiebra en un exchange grande.
// 2. IMPACTO: cada tema da un nivel y se queda el más alto.
//    - alto: decisiones de tipos o FOMC, IPC y empleo de EE. UU., aranceles
//      nuevos; ETF aprobados o rechazados o flujos ≥ 1.000 M$; regulación que
//      se decide (aprueba, prohíbe, firma, ley); hackeo de un exchange grande
//      o ≥ 100 M$ (si no es una secuela: incautación, detenciones, juicio);
//      quiebra de exchange o retiradas congeladas en uno grande; ballenas
//      ≥ 10.000 BTC o ≥ 1.000 M$; liquidaciones ≥ 1.000 M$; Strategy vende, o
//      una empresa compra o vende ≥ 10.000 BTC o ≥ 1.000 M$; un gobierno
//      aprueba una reserva o vende; Mt. Gox mueve o reparte; el precio se
//      desploma («crash») o marca máximos históricos.
//    - medio: el resto de Fed, macro, ETF, regulación, hackeos, exchanges,
//      ballenas y liquidaciones; compras o ventas de empresas; sacar a
//      Strategy de un índice; caídas o subidas fuertes («plunge», «surge»,
//      mínimo de N semanas); capitulación de mineros; fallos graves del
//      software de bitcoin.
//    - bajo: lo demás que nombra bitcoin (análisis, empresas sin compras,
//      minería, tecnología, sentimiento). En los titulares de precio que
//      solo especulan («could», «may», «analyst», «?») se baja un nivel.
// 3. SENTIDO: se suman frases y palabras del titular (+1 positivas, −1
//    negativas). Primero las frases que cambian el sentido de una palabra
//    suelta («dollar rallies» es malo para BTC, «rate cut» es bueno) y se
//    tachan para no contarlas dos veces. Suma > 0 positivo, < 0 negativo,
//    0 neutro. Si el titular no tiene ninguna palabra con sentido, decide el
//    resumen, pero solo si su suma es de al menos ±2 (el resumen hace ruido).
// 4. DUPLICADOS entre fuentes: mismo enlace, mismo titular, o titulares casi
//    iguales (coeficiente de Dice ≥ 0,6 entre sus palabras sin las vacías ni
//    «bitcoin», «crypto», «price»), publicados con menos de 12 h de
//    diferencia, sin cifras que se contradigan y sin sentidos opuestos. Se
//    queda la primera en publicarse y las otras fuentes van a `otras_fuentes`.

export const FUENTES = Object.freeze([
  Object.freeze({ nombre: 'Cointelegraph', url: 'https://cointelegraph.com/rss' }),
  Object.freeze({ nombre: 'Decrypt', url: 'https://decrypt.co/feed' }),
  Object.freeze({ nombre: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/feed' }),
  // CoinDesk redirige /arc/outboundfeeds/rss/ a la ruta sin barra final; fetch sigue la redirección.
  Object.freeze({ nombre: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' }),
]);

export const URL_MIEDO_CODICIA = 'https://api.alternative.me/fng/?limit=1';
export const TIEMPO_MAX_MS = 15_000;
export const MAX_RESUMEN = 280;

const HORA = 3_600_000;
// Un reloj de servidor algo adelantado no debe tirar una noticia, pero más de
// 5 min «en el futuro» sería mirar adelante (y rompería las pruebas con fecha fija).
const TOLERANCIA_FUTURO_MS = 5 * 60_000;
const VENTANA_DUPLICADOS_MS = 12 * HORA;
const UMBRAL_DICE = 0.6;
// Antes del bloque génesis no hay noticias de bitcoin: una fecha así es basura del feed.
const GENESIS_MS = Date.UTC(2009, 0, 3);
const CABECERAS = {
  accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5',
  // Algunos feeds rechazan clientes sin User-Agent de navegador; nombre genérico, sin datos de nadie.
  'user-agent': 'Mozilla/5.0 (compatible; btc-en-papel/1.0; lector RSS)',
};

// ───────────────────────── texto: entidades y HTML ─────────────────────────

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', minus: '−', lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“',
  rdquo: '”', bdquo: '„', laquo: '«', raquo: '»', lsaquo: '‹', rsaquo: '›', prime: '′', Prime: '″',
  bull: '•', middot: '·', euro: '€', pound: '£', yen: '¥', cent: '¢', dollar: '$', percnt: '%',
  copy: '©', reg: '®', trade: '™', deg: '°', plusmn: '±', times: '×', divide: '÷', frac12: '½',
  frac14: '¼', frac34: '¾', sup2: '²', sup3: '³', micro: 'µ', para: '¶', sect: '§', num: '#',
  excl: '!', quest: '?', colon: ':', comma: ',', period: '.', lpar: '(', rpar: ')', sol: '/',
  ast: '*', commat: '@', lsqb: '[', rsqb: ']', lcub: '{', rcub: '}', vert: '|', larr: '←',
  rarr: '→', uarr: '↑', darr: '↓', iexcl: '¡', iquest: '¿', shy: '', zwj: '', zwnj: '', lrm: '',
  rlm: '', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü',
  Uuml: 'Ü', auml: 'ä', ouml: 'ö', Auml: 'Ä', Ouml: 'Ö', szlig: 'ß', ccedil: 'ç', Ccedil: 'Ç',
  agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù', acirc: 'â', ecirc: 'ê',
  icirc: 'î', ocirc: 'ô', ucirc: 'û', atilde: 'ã', otilde: 'õ', oslash: 'ø', aring: 'å',
  aelig: 'æ', oelig: 'œ', ordf: 'ª', ordm: 'º',
};
// Los navegadores leen &#128;…&#159; como Windows-1252; algunos CMS los escriben así.
const WINDOWS_1252 = {
  128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…', 134: '†', 135: '‡', 136: 'ˆ', 137: '‰',
  138: 'Š', 139: '‹', 140: 'Œ', 142: 'Ž', 145: '‘', 146: '’', 147: '“', 148: '”', 149: '•',
  150: '–', 151: '—', 152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ', 158: 'ž', 159: 'Ÿ',
};

/** Cambia &amp; &#8217; &#x2019; &quot;… por su carácter. Lo que no conoce lo deja tal cual. */
export function decodificarEntidades(texto) {
  return String(texto ?? '').replace(/&(#\d{1,8}|#x[0-9a-f]{1,7}|[a-z][a-z0-9]{1,31});/gi, (todo, cuerpo) => {
    if (cuerpo[0] === '#') {
      const codigo = cuerpo[1] === 'x' || cuerpo[1] === 'X' ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
      if (WINDOWS_1252[codigo]) return WINDOWS_1252[codigo];
      // Códigos imposibles (0, sustitutos, > U+10FFFF) se tiran en vez de romper.
      if (!Number.isFinite(codigo) || codigo <= 0 || codigo > 0x10ffff || (codigo >= 0xd800 && codigo <= 0xdfff)) return '';
      return String.fromCodePoint(codigo);
    }
    if (Object.hasOwn(ENTIDADES, cuerpo)) return ENTIDADES[cuerpo];
    const minus = cuerpo.toLowerCase();
    if (['amp', 'lt', 'gt', 'quot', 'apos', 'nbsp'].includes(minus)) return ENTIDADES[minus];
    return todo;
  });
}

function normalizarEspacios(texto) {
  return String(texto ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F­​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Texto plano por líneas: los bloques (<p>, <br>, <div>…) cortan línea para
// poder tirar después las líneas de relleno del CMS.
function lineasDeHtml(html) {
  let s = String(html ?? '');
  s = s.replace(/<(script|style|noscript|iframe|svg|figcaption|template)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ');
  s = s.replace(/<!--[\s\S]*?(?:-->|$)/g, ' ');
  s = s.replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote|figure|tr|table|section|article|header|footer|hr|pre)\b[^>]*>/gi, '\n');
  s = s.replace(/<\/?[a-z][\w:-]*(?:\s[^>]*)?\/?>/gi, '');
  s = s.replace(/<[!?][^>]*>/g, '');
  s = decodificarEntidades(s);
  return s.split(/\r?\n|\r/).map(normalizarEspacios).filter(Boolean);
}

/** Quita etiquetas HTML y entidades y deja una sola línea de texto. */
export function limpiarHtml(html) {
  return lineasDeHtml(html).join(' ');
}

function recortar(texto, max = MAX_RESUMEN) {
  const limpio = normalizarEspacios(texto);
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max - 1);
  const espacio = corte.lastIndexOf(' ');
  // Cortar en un espacio si no se pierde demasiado; si no, a lo bruto.
  const base = espacio > max * 0.6 ? corte.slice(0, espacio) : corte;
  return base.replace(/[\s,;:.\-–—(]+$/, '') + '…';
}

const comparable = s => normalizarEspacios(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');

// ───────────────────────────── lector RSS/Atom ─────────────────────────────

// Busca el primer elemento con alguno de esos nombres; devuelve sus atributos y su contenido crudo.
function elemento(bloque, nombres) {
  for (const nombre of nombres) {
    const apertura = new RegExp(`<${nombre}(\\s[^>]*?)?(/?)>`, 'i').exec(bloque);
    if (!apertura) continue;
    const atributos = apertura[1] || '';
    if (apertura[2] === '/') return { atributos, contenido: '' };
    const desde = apertura.index + apertura[0].length;
    const cierre = new RegExp(`</${nombre}\\s*>`, 'i').exec(bloque.slice(desde));
    // Sin cierre: hasta la siguiente etiqueta, para no tragarse el resto del item.
    const hasta = cierre ? desde + cierre.index : (() => { const i = bloque.indexOf('<', desde); return i === -1 ? bloque.length : i; })();
    return { atributos, contenido: bloque.slice(desde, hasta) };
  }
  return null;
}

function todos(bloque, nombre) {
  const salida = [];
  const re = new RegExp(`<${nombre}(\\s[^>]*?)?(/?)>`, 'gi');
  let m;
  while ((m = re.exec(bloque))) {
    if (m[2] === '/') { salida.push({ atributos: m[1] || '', contenido: '' }); continue; }
    const desde = m.index + m[0].length;
    const cierre = new RegExp(`</${nombre}\\s*>`, 'i').exec(bloque.slice(desde));
    salida.push({ atributos: m[1] || '', contenido: cierre ? bloque.slice(desde, desde + cierre.index) : '' });
    if (cierre) re.lastIndex = desde + cierre.index;
  }
  return salida;
}

function atributo(atributos, nombre) {
  const m = new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(atributos || '');
  return m ? decodificarEntidades(m[1] ?? m[2] ?? m[3] ?? '') : '';
}

/** Deja solo enlaces http(s) y les quita los utm_* del seguimiento. */
function limpiarEnlace(crudo) {
  const texto = normalizarEspacios(decodificarEntidades(crudo));
  if (!texto) return null;
  try {
    const url = new URL(texto);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    for (const clave of [...url.searchParams.keys()]) if (/^utm_/i.test(clave)) url.searchParams.delete(clave);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Convierte una fecha de RSS (RFC 822) o Atom (ISO 8601) a ISO UTC. Devuelve
 * null si no se entiende. Sin zona horaria se toma UTC (y no la del equipo),
 * para que el resultado no dependa de dónde corre.
 */
export function aFechaIso(texto) {
  let s = normalizarEspacios(decodificarEntidades(texto));
  if (!s) return null;
  const tieneZona = /(?:Z|[+-]\d{2}:?\d{2}|\b(?:GMT|UTC|UT|[ECMP][SD]T))$/i.test(s);
  if (!tieneZona) {
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) s = s.replace(' ', 'T') + 'Z';
    else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s += 'T00:00:00Z';
    else if (/\d{1,2}:\d{2}(:\d{2})?$/.test(s)) s += ' +0000';
  }
  const ms = Date.parse(s);
  if (!Number.isFinite(ms) || ms < GENESIS_MS) return null;
  return new Date(ms).toISOString();
}

/**
 * Lee un RSS 2.0 (o Atom) y devuelve sus items sin filtrar:
 * [{ titulo, enlace, fecha (ISO o null), resumen, categorias }].
 * Nunca lanza: con basura devuelve [].
 */
export function leerRss(xml, { fuente = '' } = {}) {
  let doc;
  if (typeof xml === 'string') doc = xml;
  else if (xml instanceof Uint8Array) doc = new TextDecoder().decode(xml);
  else return [];
  // Los CDATA se apartan antes de buscar etiquetas: su contenido es texto
  // literal y a menudo trae HTML (incluso «</item>») que confundiría al lector.
  const cdatas = [];
  doc = doc
    .replace(/\u0000/g, '')
    .replace(/<!\[CDATA\[([\s\S]*?)(?:\]\]>|$)/g, (_, c) => `\u0000${cdatas.push(c) - 1}\u0000`)
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  // Fuera de un CDATA el texto va escapado como XML; dentro, va tal cual.
  const restaurar = crudo => String(crudo ?? '')
    .split(/\u0000(\d+)\u0000/)
    .map((trozo, i) => (i % 2 ? cdatas[Number(trozo)] ?? '' : decodificarEntidades(trozo)))
    .join('');

  const aperturas = [...doc.matchAll(/<(?:[\w.-]+:)?(item|entry)(?=[\s>/])[^>]*>/gi)];
  const items = [];
  for (let k = 0; k < aperturas.length; k++) {
    const m = aperturas[k];
    if (m[0].endsWith('/>')) continue;
    const desde = m.index + m[0].length;
    const siguiente = k + 1 < aperturas.length ? aperturas[k + 1].index : doc.length;
    const cierre = new RegExp(`</(?:[\\w.-]+:)?${m[1]}\\s*>`, 'gi');
    cierre.lastIndex = desde;
    const c = cierre.exec(doc);
    // Un item sin cerrar termina donde empieza el siguiente.
    const bloque = doc.slice(desde, c && c.index < siguiente ? c.index : siguiente);
    try {
      const item = leerItem(bloque, restaurar, fuente);
      if (item) items.push(item);
    } catch {
      // Un item roto no tumba el feed entero.
    }
  }
  return items;
}

function leerItem(bloque, restaurar, fuente) {
  const titulo = recortar(lineasDeHtml(restaurar(elemento(bloque, ['title'])?.contenido)).join(' '), 300);
  if (!titulo) return null;

  let enlace = null;
  const link = elemento(bloque, ['link']);
  if (link?.contenido) enlace = limpiarEnlace(restaurar(link.contenido));
  if (!enlace) {
    // Atom: <link rel="alternate" href="…"/> (o sin rel).
    for (const l of todos(bloque, 'link')) {
      const rel = atributo(l.atributos, 'rel').toLowerCase();
      if (rel && rel !== 'alternate') continue;
      enlace = limpiarEnlace(atributo(l.atributos, 'href'));
      if (enlace) break;
    }
  }
  if (!enlace) {
    const guid = elemento(bloque, ['guid', 'id']);
    if (guid && atributo(guid.atributos, 'isPermaLink').toLowerCase() !== 'false') enlace = limpiarEnlace(restaurar(guid.contenido));
  }

  const fechaCruda = elemento(bloque, ['pubDate', 'published', 'dc:date', 'updated', 'a10:updated', 'dc:created']);
  const fecha = fechaCruda ? aFechaIso(restaurar(fechaCruda.contenido)) : null;

  let resumen = '';
  for (const nombre of ['description', 'summary', 'content:encoded', 'content']) {
    const e = elemento(bloque, [nombre]);
    if (!e) continue;
    resumen = resumenDe(restaurar(e.contenido), titulo, fuente);
    if (resumen) break;
  }

  const categorias = [];
  for (const cat of todos(bloque, 'category')) {
    const texto = normalizarEspacios(limpiarHtml(restaurar(cat.contenido)) || atributo(cat.atributos, 'term'));
    if (texto && !categorias.includes(texto)) categorias.push(texto);
  }
  return { titulo, enlace, fecha, resumen, categorias };
}

// Quita el relleno típico de WordPress y compañía: el nombre del medio, el
// titular repetido, «This post … first appeared on …», «Read more».
function resumenDe(html, titulo, fuente) {
  const tituloC = comparable(titulo);
  const fuenteC = comparable(fuente);
  const lineas = lineasDeHtml(html).filter(linea => {
    if (!/[\p{L}\p{N}]/u.test(linea)) return false;
    const c = comparable(linea);
    if (c === tituloC || (fuenteC && c === fuenteC)) return false;
    if (/^(this|the) post\b[\s\S]*\b(first appeared|appeared first)\b/i.test(linea)) return false;
    if (/^(read more|continue reading|leer más|seguir leyendo)\b/i.test(linea)) return false;
    return true;
  });
  return recortar(lineas.join(' '));
}

// ──────────────────────────── clasificación ────────────────────────────

const RE = {
  bitcoin: /\b(bitcoin(s|ers?)?|btc|xbt|satoshis?|sats|ibit|fbtc|gbtc)\b/i,
  cripto: /\b(crypto(currenc(y|ies))?|cryptos|digital assets?|stablecoins?|defi|web3|blockchain|tokens?)\b/i,
  // Altcoins sin ambigüedad en inglés (no se incluyen «dot», «link», «near»…, que son palabras comunes).
  alt: /\b(ether|ethereum|eth|solana|xrp|ripple|cardano|dogecoin|doge|shiba|memecoins?|meme ?coins?|bnb|tron|avalanche|avax|polkadot|polygon|matic|chainlink|litecoin|toncoin|sui|aptos|arbitrum|hyperliquid|pepe|bonk|megaeth|monad|kaspa|aave|uniswap|stellar|hedera|altcoins?)\b/i,
  exchangeGrande: /\b(binance|coinbase|kraken|okx|bybit|bitfinex|bitstamp|gemini|upbit|kucoin|htx|huobi|crypto\.com|bitget|deribit|ftx)\b/i,
  emisoresEtf: /\b(blackrock|fidelity|grayscale|bitwise|vaneck|21shares|invesco|franklin|ark invest|ark 21shares)\b/i,
  especulativo: /\b(could|may|might|eyes|eyeing|predicts?|forecasts?|analysts?|says|warns?|why|what|how|whether|if)\b|\?/i,
  compra: /\b(buys?|bought|buying|acquires?|acquired|adds?|added|purchases?|purchased|accumulat\w*)\b/i,
  // «sell-off» es una caída del mercado, no alguien que vende: se excluye.
  venta: /\b(?:sells?|sold|selling|sale|dumps?|dumped|offloads?|unloads?)\b(?![- ]?off)/i,
};

// Cantidades del titular: importes ($ € £, con B/M/K o palabra) y BTC.
const MULTIPLICADOR = { trillion: 1e12, tn: 1e12, t: 1e12, billion: 1e9, bn: 1e9, b: 1e9, million: 1e6, mn: 1e6, mln: 1e6, m: 1e6, thousand: 1e3, k: 1e3 };
const numeroIngles = s => Number(String(s).replace(/,/g, ''));

function importeMaximo(texto) {
  let max = 0;
  for (const m of texto.matchAll(/[$€£]\s?(\d+(?:[.,]\d+)*)\s*(trillion|billion|million|thousand|bn|tn|mn|mln|[tbmk])?(?![a-z0-9])/gi)) {
    const v = numeroIngles(m[1]) * (m[2] ? MULTIPLICADOR[m[2].toLowerCase()] : 1);
    if (Number.isFinite(v) && v > max) max = v;
  }
  return max;
}

function btcMaximo(texto) {
  let max = 0;
  for (const m of texto.matchAll(/(?<![$€£\d.,])(\d+(?:[.,]\d+)*)\s?(k|thousand)?\s?(?:btc|bitcoins?)\b/gi)) {
    const v = numeroIngles(m[1]) * (m[2] ? 1e3 : 1);
    if (Number.isFinite(v) && v > max) max = v;
  }
  return max;
}

const fmtMillones = usd => {
  const millones = usd / 1e6;
  return millones >= 1000
    ? `${(millones / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 })} mil millones de $`
    : `${millones.toLocaleString('es-ES', { maximumFractionDigits: 1 })} millones de $`;
};

const ALTO = 2, MEDIO = 1, BAJO = 0;
const NIVELES = ['bajo', 'medio', 'alto'];

// Cada tema: etiqueta en castellano, si aparece en el titular (`detecta`, ya con
// su contexto), si basta por sí solo aunque se nombre una altcoin (`general`) y
// cuánto pesa (`impacto` → [nivel, porqué]).
const TEMAS = [
  {
    etiqueta: 'fed', general: true,
    detecta: (t) => /\b(fed|federal reserve|fomc|powell|warsh|interest[- ]rates?|rate (hikes?|cuts?|decision|fears|outlook|path)|(hikes?|cuts?|raises?|lowers?|holds?|keeps?) (interest )?rates)\b/i.test(t),
    impacto: (t) => {
      const decision = /\b(fomc|rate (decision|hikes?|cuts?)|(hikes?|cuts?|raises?|lowers?|holds?|keeps?) (interest )?rates|rates? (unchanged|on hold)|emergency)\b/i.test(t);
      const expectativa = /\b(odds|bets?|expect\w*|could|may|might|likely|fears?|outlook|ahead of|eyes|signals?|minutes|path)\b/i.test(t);
      return decision && !expectativa ? [ALTO, 'decisión de tipos de la Fed'] : [MEDIO, 'Fed y tipos de interés'];
    },
  },
  {
    etiqueta: 'macro', general: true,
    detecta: (t) => /\b(cpi|ppi|inflation|consumer prices?|producer prices?|jobs report|nonfarm|payrolls|unemployment|jobless claims|gdp|recession|treasury yields?|bond yields?|10-year yield|dollar index|dxy|tariffs?|trade war|(us |u\.s\. )?dollar (rall\w*|strength\w*|surg\w*|hits|holds|climbs?|jumps?|slides?|falls?|weaken\w*)|strong(er)? dollar|weak(er)? dollar|stocks? (slip|slips|fall|falls|tumble|tumbles|sink|sinks|sell-?off|rally|rallies|crash\w*)|stock market (crash\w*|sell-?off|rout))\b/i.test(t),
    impacto: (t) => {
      if (/\b(cpi|consumer prices?|jobs report|nonfarm|payrolls)\b/i.test(t)) return [ALTO, 'dato de IPC o de empleo de EE. UU.'];
      if (/\b(new|announces?|imposes?|slaps?|hikes?|raises?) (\w+ )?tariffs?\b|\btrade war\b/i.test(t)) return [ALTO, 'aranceles nuevos'];
      return [MEDIO, 'dato macro (inflación, dólar, bonos o bolsa)'];
    },
  },
  {
    etiqueta: 'etf',
    detecta: (t, d) => /\b(etfs?|etps?|exchange-traded funds?|ibit|fbtc|gbtc)\b/i.test(t) && (d.bitcoin || d.cripto || RE.emisoresEtf.test(t)),
    impacto: (t, d) => {
      if (/\b(approv\w*|reject\w*|den(y|ies|ied|ial)|green-?light\w*)\b/i.test(t)) return [ALTO, 'decisión sobre un ETF'];
      // Un resumen de varias semanas («$2.35B in 2 weeks») no es un golpe de un día.
      const acumulado = /\b(\d+|two|three|four|five|six|seven|eight|nine|ten|several|past|last) (days|weeks?|months?|sessions)\b|\b(weeks?|months?) of\b|\b(for|this|the) year\b|\b(ytd|year-to-date|so far|streak)\b/i.test(t);
      if (/\brecord (in|out)flows?\b/i.test(t)) return [ALTO, 'flujos récord de los ETF'];
      if (d.usd >= 1e9 && !acumulado) return [ALTO, `flujos de ETF de ${fmtMillones(d.usd)} (≥ 1.000 millones)`];
      return [MEDIO, acumulado ? 'flujos de ETF acumulados de varios días' : 'flujos o noticias de ETF'];
    },
  },
  {
    etiqueta: 'regulacion',
    detecta: (t, d) => /\b(sec|cftc)\b/i.test(t)
      || ((d.bitcoin || d.cripto) && /\b(regulat\w*|lawmakers?|congress|senate|house (committee|oversight|passes)|legislation|(crypto|stablecoin|market[- ]structure|reserve|digital[- ]assets?|bitcoin) bills?|bills? (pass\w*|sign\w*|clears?|advanc\w*|vote)|law|laws|bans?|banned|crackdown|executive order|mica|esma|fca|fatf|tax(es)?|clarity act|genius act|market structure|charters?|treasury department)\b/i.test(t)),
    impacto: (t) => (/\b(approv\w*|reject\w*|den(y|ies|ied|ial)|bans?|banned|outlaws?|passes|passed|signs?|signed|executive order|legaliz\w*|green-?light\w*|enacts?|enacted)\b/i.test(t)
      ? [ALTO, 'decisión regulatoria'] : [MEDIO, 'regulación o reguladores']),
  },
  {
    etiqueta: 'hackeo',
    detecta: (t, d) => (d.bitcoin || d.cripto || d.grande) && /\b(hack(s|ed|er|ers)?|exploit(s|ed)?|stolen|steals?|stole|drain(s|ed)?|breach(es|ed)?|heist|attackers?|compromised|lazarus|north korea\w*)\b/i.test(t),
    impacto: (t, d) => {
      const secuela = /\b(seiz\w*|recover\w*|returns?|returned|charged|charges|sentenc\w*|arrest\w*|extradit\w*|indict\w*|convict\w*|freez\w*|frozen|doj|fbi|police|court|crackdown|targets)\b/i.test(t);
      if (!secuela && (d.grande || d.usd >= 1e8)) return [ALTO, d.grande ? 'hackeo de un exchange grande' : `hackeo de ${fmtMillones(d.usd)}`];
      return [MEDIO, secuela ? 'secuela de un hackeo (incautación, juicio…)' : 'hackeo'];
    },
  },
  {
    etiqueta: 'exchanges',
    detecta: (t, d) => /\b((halts?|halted|suspends?|suspended|pauses?|paused|freezes?|froze|frozen) (\w+ ){0,2}withdrawals|withdrawals? (are |remain |stay )?(halted|paused|suspended|frozen)|bank run|de-?peg(s|ged)?)\b/i.test(t)
      || ((d.bitcoin || d.cripto || d.grande) && /\b(bankrupt\w*|insolven\w*|chapter 11|collaps\w*|proof of reserves)\b/i.test(t)),
    impacto: (t, d) => {
      if (/\b(bankrupt\w*|insolven\w*|chapter 11|collaps\w*)\b/i.test(t)) return [ALTO, 'quiebra o hundimiento'];
      if (/\bde-?peg/i.test(t) && /\b(usdt|tether|usdc|circle)\b/i.test(t)) return [ALTO, 'una gran stablecoin pierde la paridad'];
      if (d.grande) return [ALTO, 'problemas en un exchange grande'];
      return [MEDIO, 'un exchange congela retiradas'];
    },
  },
  {
    etiqueta: 'ballenas',
    detecta: (t, d) => (d.btc >= 1000 && /\b(moves?|moved|moving|transfers?|transferred|sends?|sent|shifts?|shifted)\b/i.test(t))
      || /\b(whales?|dormant (bitcoin )?(wallets?|addresses?|coins?)|satoshi-era|ancient (wallets?|coins?)|long-dormant|wakes? up|awakens?|short-term holders?|long-term holders?)\b/i.test(t)
      || /\b(moves?|moved|moving|transfers?|transferred|sends?|sent|deposits?|deposited)\b.{0,40}\b(btc|bitcoins?)\b.{0,20}\b(to|into) (exchanges?|binance|coinbase|kraken)\b/i.test(t),
    impacto: (t, d) => {
      if (d.btc >= 10_000) return [ALTO, `${d.btc.toLocaleString('es-ES')} BTC (≥ 10.000)`];
      if (!d.btc && d.usd >= 1e9) return [ALTO, `movimiento de ${fmtMillones(d.usd)}`];
      return [MEDIO, 'ballenas o monedas dormidas que se mueven'];
    },
  },
  {
    etiqueta: 'liquidaciones',
    detecta: (t, d) => (d.bitcoin || d.cripto) && /\b(liquidat(ion|ions|ed|es)|long squeeze|short squeeze|open interest|funding rates?|leverage(d)? (flush|wipe\w*)|deleverag\w*)\b/i.test(t),
    impacto: (t, d) => (d.usd >= 1e9 ? [ALTO, `liquidaciones de ${fmtMillones(d.usd)} (≥ 1.000 millones)`] : [MEDIO, 'liquidaciones o apalancamiento']),
  },
  {
    etiqueta: 'empresas',
    detecta: (t, d) => d.strategy || (d.bitcoin && /\b(metaplanet|treasury (firms?|compan(y|ies))|corporate treasur\w*|tesla|spacex|jpmorgan|goldman|morgan stanley|nakamoto|semler|gamestop|jane street|blockstream|coinbase|robinhood|block inc|firms?|compan(y|ies))\b/i.test(t)),
    impacto: (t, d) => {
      const vende = RE.venta.test(t), compra = RE.compra.test(t);
      const grande = d.btc >= 10_000 || d.usd >= 1e9;
      if (d.strategy && vende) return [ALTO, 'Strategy vende bitcoin'];
      if ((vende || compra) && grande) return [ALTO, `una empresa ${vende ? 'vende' : 'compra'} ${d.btc >= 10_000 ? `${d.btc.toLocaleString('es-ES')} BTC` : fmtMillones(d.usd)}`];
      if (vende || compra) return [MEDIO, `una empresa ${vende ? 'vende' : 'compra'} bitcoin`];
      if (/\b(msci|index (removal|exclusion|inclusion|deletion)|s&p 500 inclusion)\b/i.test(t)) return [MEDIO, 'entrada o salida de un índice bursátil'];
      return [BAJO, 'noticia de empresa'];
    },
  },
  {
    etiqueta: 'gobiernos',
    detecta: (t, d) => /\b(strategic bitcoin reserve|bitcoin reserve)\b/i.test(t)
      || ((d.bitcoin || d.cripto || d.grande) && /\b(strategic reserve|national reserve|governments?|govt|central banks?|el salvador|bhutan|treasury department|u\.?s\.? treasury|doj|justice department|marshals|seiz\w*|state (reserve|pension))\b/i.test(t)),
    impacto: (t, d) => {
      if (/\breserve\b/i.test(t) && /\b(signs?|signed|executive order|approv\w*|pass(es|ed)|law|buys?|bought|purchas\w*|adds?|creates?|establish\w*)\b/i.test(t)) return [ALTO, 'un gobierno aprueba o compra para su reserva'];
      if (d.bitcoin && (RE.venta.test(t) || /\b(auction\w*|liquidat\w*)\b/i.test(t))) return [ALTO, 'un gobierno vende bitcoin'];
      return [MEDIO, 'gobiernos y bitcoin'];
    },
  },
  {
    etiqueta: 'mtgox',
    detecta: (t) => /\bmt\.? ?gox\b/i.test(t),
    impacto: (t) => (/\b(repay\w*|distribut\w*|moves?|moved|transfers?|transferred|sends?|sent|creditors|wallets?)\b/i.test(t)
      ? [ALTO, 'Mt. Gox mueve o reparte bitcoin'] : [MEDIO, 'Mt. Gox']),
  },
  {
    etiqueta: 'mineria',
    detecta: (t, d) => /\b(hash ?rate|hashprice|halving)\b/i.test(t) || ((d.bitcoin || d.cripto) && /\b(miners?|mining|difficulty|asics?)\b/i.test(t)),
    impacto: (t) => (/\b(capitulat\w*|miners? (sell|sells|sold|dump\w*)|shut\w*|unplug\w*|halving|difficulty|hash ?rate (drop\w*|plung\w*|fall\w*|record)|hashprice)\b/i.test(t)
      ? [MEDIO, 'presión de los mineros (ventas, dificultad, halving)'] : [BAJO, 'minería']),
  },
  {
    etiqueta: 'tecnologia',
    detecta: (t, d) => d.bitcoin && /\b(taproot|segwit|lightning|bip-?\d+|soft ?fork|hard ?fork|bitcoin core|op_return|ordinals|runes|quantum|layer[- ]?2|sidechains?|upgrade|custody (system|solution|platform)s?|self-custody|hardware wallets?|wallet makers?|bug|vulnerab\w*)\b/i.test(t),
    impacto: (t) => (/\b(bug|vulnerab\w*|critical|chain split|soft ?fork activat\w*|hard ?fork)\b/i.test(t)
      ? [MEDIO, 'fallo o cambio grave en el software'] : [BAJO, 'tecnología']),
  },
  {
    etiqueta: 'precio',
    detecta: (t, d) => d.bitcoin && /(\b(price|prices|rall(y|ies|ied)|surg\w*|soar\w*|jump\w*|climb\w*|rises?|rising|gains?|rebound\w*|recover\w*|plung\w*|plummet\w*|crash\w*|tumbl\w*|slid(e|es|ing)?|slump\w*|drops?|dropp\w*|dips?|dipp\w*|falls?|fell|sinks?|sank|sell-?off|lows?|lowest|highs?|highest|all-time high|ath|bear market|bull market|correction|support|resistance|breakout|weekly loss|monthly loss|trend ?line|moving average)\b|[$€£]\s?(\d{2,3},\d{3}|\d{2,3}(\.\d+)?k)\b)/i.test(t),
    impacto: (t, d) => {
      let nivel = BAJO, porque = 'movimiento de precio';
      if (/\b(crash\w*|all-time highs?|record highs?|new highs?|ath)\b/i.test(t)) [nivel, porque] = [ALTO, 'desplome o máximo histórico'];
      else if (/\b(plung\w*|plummet\w*|tumbl\w*|surg\w*|soar\w*|skyrocket\w*|sell-?off|capitulat\w*|\d+-(week|month|year) (lows?|highs?)|lowest (level )?since|highest (level )?since|bear market lows?)\b/i.test(t)) [nivel, porque] = [MEDIO, 'caída o subida fuerte'];
      if (d.especulativo && nivel > BAJO) return [nivel - 1, `${porque} (titular especulativo)`];
      return [nivel, porque];
    },
  },
  {
    etiqueta: 'mercado',
    detecta: (t, d) => !d.bitcoin && d.cripto && /\b(plung\w*|plummet\w*|crash\w*|tumbl\w*|sell-?off|rout|bloodbath|rall(y|ies|ied)|surg\w*|soar\w*|market caps?|wiped|erased)\b/i.test(t),
    impacto: (t) => (/\bcrash\w*|bloodbath\b/i.test(t) ? [ALTO, 'desplome de todo el mercado cripto'] : [MEDIO, 'movimiento de todo el mercado cripto']),
  },
  {
    etiqueta: 'sentimiento',
    detecta: (t, d) => (d.bitcoin || d.cripto) && /\b(fear|greed|sentiment|euphori\w*|panic\w*|capitulation)\b/i.test(t),
    impacto: () => [BAJO, 'sentimiento del mercado'],
  },
];

// Frases que cambian el sentido de una palabra suelta (van primero y se tachan).
const FRASES_SENTIDO = [
  [/\b(rate cuts?|cuts? (interest )?rates|dovish)\b/gi, +1],
  [/\b(rate hikes?|hikes? (interest )?rates|raises? (interest )?rates|hawkish)\b/gi, -1],
  [/\b(cool(er|ing|s)?|soft(er)?|lower)[- ](than[- ]expected )?(us |u\.s\. )?(inflation|cpi|ppi)\b/gi, +1],
  [/\b(hot(ter)?|high(er)?)[- ](than[- ]expected )?(us |u\.s\. )?(inflation|cpi|ppi)\b/gi, -1],
  [/\b(inflation|cpi|ppi) (cools?|eases?|slows?|falls?|drops?)\b/gi, +1],
  [/\b(inflation|cpi|ppi) (rises?|jumps?|accelerates?|heats? up|surges?)\b/gi, -1],
  [/\b(inflation|cpi|ppi)( print| data| report| reading)? (comes? in |came in |runs? |prints? )?(hot(ter)?|above (forecasts?|expectations?|estimates?))\b/gi, -1],
  [/\b(inflation|cpi|ppi)( print| data| report| reading)? (comes? in |came in |runs? |prints? )?(cool(er)?|soft(er)?|below (forecasts?|expectations?|estimates?))\b/gi, +1],
  // Dólar fuerte y bonos al alza son malos para BTC aunque digan «rally» o «high».
  [/\bdollar( index)? (rall\w*|surg\w*|jump\w*|climb\w*|strength\w*|hits|holds|rises?|gains?|soars?)( (\S+ ){0,3}(highs?|peak))?\b/gi, -1],
  [/\bstrong(er)? dollar\b/gi, -1],
  [/\bdollar( index)? (falls?|slides?|weaken\w*|drops?|slumps?|tumbles?|sinks?)\b/gi, +1],
  [/\bweak(er)? dollar\b/gi, +1],
  [/\byields? (rise|rises|jump\w*|climb\w*|surg\w*|hits?|spike\w*)\b/gi, -1],
  [/\byields? (fall|falls|drop\w*|ease\w*|slide\w*)\b/gi, +1],
  [/\b(rebound\w*|bounc\w*|recover\w*) from (\S+ ){0,3}lows?\b/gi, +1],
  [/\b(all-time highs?|record highs?|new highs?|ath)\b/gi, +1],
  [/\binflows?\b/gi, +1],
  [/\bshort squeeze\b/gi, +1],
  [/\b(strategic (bitcoin )?reserve|bitcoin reserve)\b/gi, +1],
  [/\b(outflows?|losing streak|bear market|long squeeze|sell-?offs?)\b/gi, -1],
  [/\b(remov\w*|exclu\w*|delist\w*|drop\w*) (it |them )?(from )?(the )?(\w+ )?(stock )?ind(ex|exes|ices)\b|\bindex (removal|exclusion|deletion)\b/gi, -1],
  [/\b(halts?|halted|suspends?|suspended|pauses?|paused|freezes?|froze|frozen) (\w+ ){0,2}withdrawals\b|\bwithdrawals? (are |remain |stay )?(halted|paused|suspended|frozen)\b/gi, -1],
  [/\b(below|under) [$€£]/gi, -1],
  [/\babove [$€£]/gi, +1],
];
const PALABRAS_POSITIVAS = /\b(surg(e|es|ed|ing)|soar(s|ed|ing)?|rall(y|ies|ied|ying)|jump(s|ed|ing)?|climb(s|ed|ing)?|rise[sn]?|rising|rose|gain(s|ed|ing)?|rebound(s|ed|ing)?|recover(s|ed|ing|y)?|bull(s|ish)?|boost(s|ed|ing)?|buys?|bought|buyers?|buying|accumulat\w*|adopt\w*|approv\w*|breakout|optimism|optimistic|upbeat|wins?|won|greed|profits?|higher)\b/gi;
const PALABRAS_NEGATIVAS = /\b(plung\w*|plummet\w*|crash\w*|tumbl\w*|slid(e|es|ing)?|slump\w*|drops?|dropp(ed|ing)|dips?|dipp(ed|ing)|fall(s|ing|en)?|fell|sinks?|sank|sinking|shed(s|ding)?|bleed(s|ing)?|bled|loss(es)?|los(e|es|ing)|lows?|lowest|weak\w*|fears?|fearful|panic\w*|jitter(s|y)?|hack\w*|exploit\w*|stolen|stole|steal(s|ing)?|drain\w*|bankrupt\w*|insolven\w*|collaps\w*|bans?|banned|crackdown|lawsuits?|sues?|sued|charged|fraud\w*|reject\w*|den(y|ies|ied|ial)|delay\w*|liquidat\w*|capitulat\w*|sell(s|ing|ers)?|sold|dump\w*|warn\w*|risks?|pressure\w*|bearish|bears|slip(s|ped|ping)?|retreat\w*|eras(e|es|ed|ing)|wip(e|es|ed|ing)|worst|declin\w*|trim(s|med)?|outage|scam\w*)\b/gi;

function puntuarSentido(texto) {
  let resto = ` ${String(texto ?? '').toLowerCase().replace(/[’‘]/g, "'")} `;
  let suma = 0;
  const pistas = [];
  const contar = (re, signo) => {
    resto = resto.replace(re, (m) => {
      suma += signo;
      pistas.push(m.trim());
      return ' '.repeat(m.length);
    });
  };
  for (const [re, signo] of FRASES_SENTIDO) contar(re, signo);
  contar(PALABRAS_POSITIVAS, +1);
  contar(PALABRAS_NEGATIVAS, -1);
  return { suma, pistas };
}

const signoASentido = s => (s > 0 ? 'positivo' : s < 0 ? 'negativo' : 'neutro');

/**
 * Decide si una noticia importa para BTC y cuánto.
 * Entrada: { titulo, resumen }. Salida: { relevante, etiquetas, impacto, sentido, motivo }.
 */
export function clasificar({ titulo, resumen } = {}) {
  const t = normalizarEspacios(titulo).replace(/[’‘]/g, "'");
  if (!t) return { relevante: false, etiquetas: [], impacto: 'bajo', sentido: 'neutro', motivo: 'sin titular' };
  const strategy = /\b(microstrategy|mstr|saylor)\b/i.test(t)
    || (/\bStrategy\b/.test(t) && (RE.bitcoin.test(t) || /\b(msci|stock|shares|buys|sells|acquires|purchases?|preferred|strk|strf|strc|strd)\b/i.test(t)));
  const d = {
    bitcoin: RE.bitcoin.test(t) || strategy,
    cripto: RE.cripto.test(t),
    alt: RE.alt.test(t),
    grande: RE.exchangeGrande.test(t),
    usd: importeMaximo(t),
    btc: btcMaximo(t),
    especulativo: RE.especulativo.test(t),
    strategy,
  };
  const temas = [];
  for (const tema of TEMAS) {
    if (!tema.detecta(t, d)) continue;
    const [nivel, porque] = tema.impacto(t, d);
    temas.push({ etiqueta: tema.etiqueta, general: Boolean(tema.general), nivel, porque });
  }
  const nombraBitcoin = RE.bitcoin.test(t) || strategy;
  // Una altcoin sin bitcoin solo entra si el tema arrastra a todo: Fed, macro,
  // o un hackeo o una quiebra en un exchange grande (lo de Bybit en 2025 tumbó a BTC).
  const arrastra = temas.some(x => x.general || (d.grande && (x.etiqueta === 'hackeo' || x.etiqueta === 'exchanges')));
  const relevante = nombraBitcoin || (temas.length > 0 && (!d.alt || arrastra));

  const etiquetas = temas.map(x => x.etiqueta);
  // El tema que más pesa (a igualdad, el primero de la tabla) explica el impacto.
  const principal = temas.length
    ? temas.reduce((a, b) => (b.nivel > a.nivel ? b : a))
    : { nivel: BAJO, porque: 'nombra bitcoin sin un tema de peso' };
  const impacto = NIVELES[principal.nivel];

  const deTitulo = puntuarSentido(t);
  let sentido = signoASentido(deTitulo.suma);
  let pistas = deTitulo.pistas;
  let deDonde = '';
  if (!deTitulo.pistas.length && resumen) {
    const deResumen = puntuarSentido(resumen);
    if (Math.abs(deResumen.suma) >= 2) {
      sentido = signoASentido(deResumen.suma);
      pistas = deResumen.pistas;
      deDonde = ' en el resumen';
    }
  }
  const motivoSentido = pistas.length
    ? `${sentido} por ${pistas.slice(0, 4).map(p => `«${p}»`).join(', ')}${deDonde}`
    : `${sentido}: sin palabras de subida ni de bajada`;
  const motivo = relevante
    ? `impacto ${impacto}: ${principal.porque}; sentido ${motivoSentido}`
    : `fuera: ${d.alt && !nombraBitcoin && temas.length ? 'trata de una altcoin' : 'no va de bitcoin ni mueve todo el mercado'}`;
  return { relevante, etiquetas, impacto, sentido, motivo };
}

// ───────────────────────────── duplicados ─────────────────────────────

const VACIAS = new Set(('a an the of to in on for and or as at by with from is are was were be been its it this that these those '
  + 'after amid over into than has have had will would new says say said report reports via vs per about up out off '
  + 'bitcoin bitcoins btc crypto cryptocurrency price prices market markets us u.s here how why what').split(/\s+/));

function raiz(palabra) {
  let p = palabra.replace(/'s$/, '');
  if (p.length > 4 && p.endsWith('ies')) p = p.slice(0, -3) + 'y';
  else if (p.length > 4 && /(ss|x|ch|sh)es$/.test(p)) p = p.slice(0, -2);
  else if (p.length > 3 && p.endsWith('s') && !p.endsWith('ss')) p = p.slice(0, -1);
  return p;
}

function firmaTitulo(titulo) {
  const numeros = new Set();
  const texto = normalizarEspacios(titulo).toLowerCase().replace(/[’‘`´]/g, "'")
    .replace(/(?<![a-z0-9])[$€£]?\s?(\d+(?:[.,]\d+)*)\s*(trillion|billion|million|thousand|bn|tn|mn|mln|[tbmk])?(?![a-z0-9])/g, (_, n, suf) => {
      const v = numeroIngles(n) * (suf ? MULTIPLICADOR[suf] : 1);
      if (Number.isFinite(v)) numeros.add(String(Number(v.toPrecision(4))));
      return ' ';
    });
  const palabras = new Set(texto.split(/[^a-z0-9']+/).map(w => w.replace(/^'+|'+$/g, '')).filter(w => w.length > 1 && !VACIAS.has(w)).map(raiz).filter(w => !VACIAS.has(w)));
  return { palabras, numeros };
}

/** Coeficiente de Dice (0–1) entre las palabras con peso de dos titulares. */
export function similitud(tituloA, tituloB) {
  const a = firmaTitulo(tituloA).palabras, b = firmaTitulo(tituloB).palabras;
  if (!a.size || !b.size) return 0;
  let comunes = 0;
  for (const p of a) if (b.has(p)) comunes++;
  return (2 * comunes) / (a.size + b.size);
}

function sonDuplicadas(a, b) {
  if (a.enlace && a.enlace === b.enlace) return true;
  if (comparable(a.titulo) === comparable(b.titulo)) return true;
  if (Math.abs(Date.parse(a.fecha) - Date.parse(b.fecha)) > VENTANA_DUPLICADOS_MS) return false;
  if ((a.sentido === 'positivo' && b.sentido === 'negativo') || (a.sentido === 'negativo' && b.sentido === 'positivo')) return false;
  const fa = firmaTitulo(a.titulo), fb = firmaTitulo(b.titulo);
  if (Math.min(fa.palabras.size, fb.palabras.size) < 3) return false;
  // «Salen 300 M$ de los ETF» y «salen 250 M$» son dos días distintos, no la misma noticia.
  if (fa.numeros.size && fb.numeros.size && ![...fa.numeros].some(n => fb.numeros.has(n))) return false;
  return similitud(a.titulo, b.titulo) >= UMBRAL_DICE;
}

/**
 * Junta las noticias repetidas. Se queda la primera en publicarse (a igual hora,
 * la que llegó antes en la lista) y anota las demás fuentes en `otras_fuentes`.
 * Devuelve la lista de la más nueva a la más vieja.
 */
export function quitarDuplicados(noticias) {
  const lista = (Array.isArray(noticias) ? noticias : [])
    .filter(n => n && typeof n.titulo === 'string' && Number.isFinite(Date.parse(n.fecha)))
    .map((n, i) => ({ n, i }))
    .sort((x, y) => Date.parse(x.n.fecha) - Date.parse(y.n.fecha) || x.i - y.i);
  const guardadas = [];
  for (const { n, i } of lista) {
    const original = guardadas.find(g => sonDuplicadas(g.n, n));
    if (original) {
      const otras = original.n.otras_fuentes;
      if (n.fuente && n.fuente !== original.n.fuente && !otras.includes(n.fuente)) otras.push(n.fuente);
      for (const f of n.otras_fuentes || []) if (f !== original.n.fuente && !otras.includes(f)) otras.push(f);
      continue;
    }
    guardadas.push({ n: { ...n, otras_fuentes: [...(n.otras_fuentes || [])] }, i });
  }
  return guardadas
    .sort((x, y) => Date.parse(y.n.fecha) - Date.parse(x.n.fecha) || x.i - y.i)
    .map(g => g.n);
}

// ───────────────────────────── red ─────────────────────────────

function describirError(e) {
  const causa = e?.cause;
  const codigo = causa?.code || e?.code;
  const texto = causa?.message || e?.message || String(e);
  if (codigo === 'ENOTFOUND' || codigo === 'EAI_AGAIN') return `no se encontró el servidor (${codigo})`;
  if (codigo === 'ECONNREFUSED') return 'el servidor rechazó la conexión (ECONNREFUSED)';
  if (codigo === 'ECONNRESET') return 'se cortó la conexión (ECONNRESET)';
  if (codigo && /CERT|SSL|TLS/i.test(codigo)) return `fallo del certificado TLS (${codigo})`;
  if (codigo) return `fallo de red (${codigo}): ${texto}`;
  return texto === 'fetch failed' ? 'fallo de red' : texto;
}

async function leerTexto(respuesta) {
  if (typeof respuesta.arrayBuffer === 'function') {
    const bytes = new Uint8Array(await respuesta.arrayBuffer());
    // Respeta el charset (cabecera o declaración XML): hay feeds en ISO-8859-1.
    let charset = /charset\s*=\s*["']?([\w.:-]+)/i.exec(respuesta.headers?.get?.('content-type') || '')?.[1];
    if (!charset) charset = /<\?xml[^>]*encoding\s*=\s*["']([\w.:-]+)["']/i.exec(new TextDecoder('latin1').decode(bytes.subarray(0, 300)))?.[1];
    try {
      return new TextDecoder(charset || 'utf-8').decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  }
  if (typeof respuesta.text === 'function') return String(await respuesta.text());
  throw new Error('la respuesta no trae cuerpo');
}

// Pide una URL con tiempo máximo. La carrera con el reloj corta aunque un fetch
// ignore la señal de cancelar; la señal libera la conexión si la respeta.
async function pedir(url, { fetch, tiempoMaxMs }) {
  const control = new AbortController();
  let reloj;
  const segundos = (tiempoMaxMs / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 });
  const plazo = new Promise((_, rechazar) => {
    reloj = setTimeout(() => {
      control.abort();
      rechazar(new Error(`no respondió en ${segundos} s`));
    }, tiempoMaxMs);
  });
  const trabajo = (async () => {
    const respuesta = await fetch(url, { signal: control.signal, headers: CABECERAS, redirect: 'follow' });
    if (!respuesta || typeof respuesta !== 'object') throw new Error('respuesta vacía');
    const ok = typeof respuesta.ok === 'boolean' ? respuesta.ok : respuesta.status >= 200 && respuesta.status < 300;
    if (!ok) throw new Error(`respondió HTTP ${respuesta.status ?? '¿?'}${respuesta.statusText ? ` ${respuesta.statusText}` : ''}`);
    return { texto: await leerTexto(respuesta), tipo: respuesta.headers?.get?.('content-type') || '' };
  })();
  trabajo.catch(() => {}); // si gana el reloj, que el rechazo tardío no quede suelto
  try {
    return await Promise.race([trabajo, plazo]);
  } catch (e) {
    throw new Error(control.signal.aborted ? `no respondió en ${segundos} s` : describirError(e));
  } finally {
    clearTimeout(reloj);
  }
}

function comprobarFetch(fetch) {
  if (typeof fetch !== 'function') throw new TypeError('No hay fetch: pasa una función fetch (Node 22 ya trae una global).');
}

function comprobarTiempo(tiempoMaxMs) {
  const ms = tiempoMaxMs == null ? TIEMPO_MAX_MS : Number(tiempoMaxMs);
  if (!Number.isFinite(ms) || ms <= 0) throw new RangeError(`tiempoMaxMs debe ser un número de milisegundos mayor que 0 (llegó ${String(tiempoMaxMs)}).`);
  return ms;
}

// ───────────────────────────── API pública ─────────────────────────────

/**
 * Lee los RSS y devuelve las noticias que mueven BTC de las últimas `horas`.
 *
 * Devuelve { noticias, fuentes, desde, hasta }:
 *  - noticias: [{ titulo, enlace, fuente, fecha (ISO UTC), resumen, etiquetas,
 *    impacto, sentido, motivo, otras_fuentes }], de la más nueva a la más vieja.
 *  - fuentes: [{ nombre, url, ok, n, leidas, error }], donde `n` son las
 *    noticias de esa fuente que quedan en la lista, `leidas` los items que
 *    traía su RSS y `error` el porqué en castellano (null si fue bien).
 * Si una fuente falla, sigue con las demás.
 */
export async function leerNoticias({ horas = 24, fetch = globalThis.fetch, ahora = Date.now(), fuentes = FUENTES, tiempoMaxMs = TIEMPO_MAX_MS } = {}) {
  comprobarFetch(fetch);
  const h = horas == null ? 24 : Number(horas);
  if (!Number.isFinite(h) || h <= 0) throw new RangeError(`horas debe ser un número mayor que 0 (llegó ${String(horas)}).`);
  const ahoraMs = ahora == null ? Date.now() : Number(ahora instanceof Date ? ahora.getTime() : ahora);
  if (!Number.isFinite(ahoraMs)) throw new RangeError(`ahora debe ser una fecha en milisegundos (llegó ${String(ahora)}).`);
  const plazo = comprobarTiempo(tiempoMaxMs);
  const lista = fuentes == null ? FUENTES : fuentes;
  if (!Array.isArray(lista)) throw new TypeError('fuentes debe ser una lista de { nombre, url }.');

  const desde = ahoraMs - h * HORA;
  const hasta = ahoraMs + TOLERANCIA_FUTURO_MS;

  const resultados = await Promise.all(lista.map(async (f, indice) => {
    const nombre = normalizarEspacios(f?.nombre) || `fuente ${indice + 1}`;
    const url = typeof f?.url === 'string' ? f.url.trim() : '';
    const estado = { nombre, url, ok: false, n: 0, leidas: 0, error: null };
    if (!url) {
      estado.error = 'la fuente no tiene url';
      return { estado, noticias: [] };
    }
    let texto;
    try {
      ({ texto } = await pedir(url, { fetch, tiempoMaxMs: plazo }));
    } catch (e) {
      estado.error = e.message;
      return { estado, noticias: [] };
    }
    const items = leerRss(texto, { fuente: nombre });
    if (!items.length && !/<(rss|feed|rdf:rdf|channel)\b/i.test(texto)) {
      estado.error = 'la respuesta no es un RSS (¿una página de bloqueo o de error?)';
      return { estado, noticias: [] };
    }
    estado.ok = true;
    estado.leidas = items.length;
    const noticias = [];
    items.forEach((item, orden) => {
      const ms = item.fecha ? Date.parse(item.fecha) : NaN;
      if (!Number.isFinite(ms) || ms < desde || ms > hasta) return;
      const c = clasificar(item);
      if (!c.relevante) return;
      noticias.push({
        titulo: item.titulo, enlace: item.enlace, fuente: nombre, fecha: item.fecha, resumen: item.resumen,
        etiquetas: c.etiquetas, impacto: c.impacto, sentido: c.sentido, motivo: c.motivo, otras_fuentes: [],
        _orden: indice * 10_000 + orden,
      });
    });
    return { estado, noticias };
  }));

  // El orden de llegada (fuente, posición) decide los empates de hora.
  const todas = resultados.flatMap(r => r.noticias).sort((a, b) => a._orden - b._orden);
  const noticias = quitarDuplicados(todas).map(({ _orden, ...n }) => n);
  const estados = resultados.map(r => r.estado);
  for (const n of noticias) {
    const e = estados.find(x => x.nombre === n.fuente);
    if (e) e.n++;
  }
  return { noticias, fuentes: estados, desde: new Date(desde).toISOString(), hasta: new Date(ahoraMs).toISOString() };
}

/** Las de impacto alto, en la forma que pide el gestor de riesgo: [{ titulo, fecha, fuente }]. */
export function altoImpacto(noticias) {
  return (Array.isArray(noticias) ? noticias : [])
    .filter(n => n && n.impacto === 'alto' && n.fecha)
    .map(n => ({ titulo: n.titulo, fecha: n.fecha, fuente: n.fuente }));
}

const CLASES = { 'extreme fear': 'miedo extremo', fear: 'miedo', neutral: 'neutral', greed: 'codicia', 'extreme greed': 'codicia extrema' };

// Tramos de alternative.me, por si la API manda una clase que no conocemos.
function claseDeValor(valor) {
  if (valor <= 24) return 'miedo extremo';
  if (valor <= 46) return 'miedo';
  if (valor <= 54) return 'neutral';
  if (valor <= 75) return 'codicia';
  return 'codicia extrema';
}

/**
 * Índice de miedo y codicia de alternative.me (0 = miedo extremo, 100 = codicia extrema).
 * Devuelve { valor, clase, clase_original, fecha }. Lanza un error en castellano si falla.
 */
export async function miedoCodicia({ fetch = globalThis.fetch, tiempoMaxMs = TIEMPO_MAX_MS } = {}) {
  comprobarFetch(fetch);
  const plazo = comprobarTiempo(tiempoMaxMs);
  let texto;
  try {
    ({ texto } = await pedir(URL_MIEDO_CODICIA, { fetch, tiempoMaxMs: plazo }));
  } catch (e) {
    throw new Error(`No pude leer el índice de miedo y codicia (alternative.me): ${e.message}.`);
  }
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El índice de miedo y codicia no llegó en JSON (alternative.me respondió otra cosa).');
  }
  if (datos?.metadata?.error) throw new Error(`alternative.me devolvió un error: ${datos.metadata.error}.`);
  const dato = Array.isArray(datos?.data) ? datos.data[0] : null;
  const valor = Number(dato?.value);
  if (!dato || dato.value == null || dato.value === '' || !Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new Error('El índice de miedo y codicia llegó sin un valor entre 0 y 100.');
  }
  const original = normalizarEspacios(dato.value_classification);
  const segundos = Number(dato.timestamp);
  return {
    valor,
    clase: CLASES[original.toLowerCase()] || claseDeValor(valor),
    clase_original: original || null,
    fecha: Number.isFinite(segundos) && segundos > 0 ? new Date(segundos * 1000).toISOString() : null,
  };
}
