// Pruebas de las noticias: sin red, con RSS reales recortados y un fetch falso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  FUENTES, URL_MIEDO_CODICIA, MAX_RESUMEN, leerNoticias, miedoCodicia, leerRss, clasificar,
  quitarDuplicados, similitud, decodificarEntidades, limpiarHtml, aFechaIso, altoImpacto,
} from '../lib/noticias.mjs';

const fixture = nombre => readFileSync(fileURLToPath(new URL(`./fixtures/${nombre}`, import.meta.url)), 'utf8');
const RSS = {
  Cointelegraph: fixture('rss-cointelegraph.xml'),
  Decrypt: fixture('rss-decrypt.xml'),
  'Bitcoin Magazine': fixture('rss-bitcoinmagazine.xml'),
  CoinDesk: fixture('rss-coindesk.xml'),
};
// Hora en que se descargaron los feeds de las fixtures.
const AHORA = Date.parse('2026-11-14T10:20:00Z');
const HORA = 3_600_000;

// fetch falso: cada URL responde lo que diga `respuestas` (texto, función o
// { status }); lo que no esté, 404. Guarda las llamadas para mirarlas después.
function crearFetch(respuestas) {
  const llamadas = [];
  const fetch = async (url, opciones = {}) => {
    llamadas.push({ url, opciones });
    const r = respuestas[url];
    if (typeof r === 'function') return r(url, opciones);
    if (typeof r === 'string') return new Response(r, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8' } });
    if (r && typeof r === 'object') return new Response(r.cuerpo ?? '', { status: r.status ?? 200, headers: r.cabeceras ?? {} });
    return new Response('no está', { status: 404, statusText: 'Not Found' });
  };
  return { fetch, llamadas };
}
const respuestasReales = () => Object.fromEntries(FUENTES.map(f => [f.url, RSS[f.nombre]]));

// ───────────────────────────── lector RSS ─────────────────────────────

test('lee los cuatro RSS reales recortados con todos sus campos', () => {
  const esperados = { Cointelegraph: 8, Decrypt: 8, 'Bitcoin Magazine': 7, CoinDesk: 8 };
  for (const [fuente, xml] of Object.entries(RSS)) {
    const items = leerRss(xml, { fuente });
    assert.equal(items.length, esperados[fuente], fuente);
    for (const it of items) {
      assert.ok(it.titulo.length > 5, `${fuente}: titular vacío`);
      assert.match(it.enlace, /^https:\/\//, `${fuente}: ${it.titulo}`);
      assert.doesNotMatch(it.enlace, /utm_/, 'los utm_* se quitan');
      assert.match(it.fecha, /^2026-11-1[1-4]T\d{2}:\d{2}:\d{2}\.000Z$/);
      assert.ok(it.resumen.length > 0 && it.resumen.length <= MAX_RESUMEN, `${fuente}: resumen de ${it.resumen.length}`);
      assert.doesNotMatch(it.resumen, /<[a-z/]|&#?\w+;|first appeared|appeared first/i, `${fuente}: resumen sucio: ${it.resumen}`);
      assert.doesNotMatch(it.titulo, /<!\[CDATA\[|&#?\w+;/, `${fuente}: titular sucio: ${it.titulo}`);
    }
  }
});

test('decodifica entidades de los titulares reales (&#8217; y &#39;) y quita el relleno de Bitcoin Magazine', () => {
  const bm = leerRss(RSS['Bitcoin Magazine'], { fuente: 'Bitcoin Magazine' });
  const miller = bm.find(i => i.titulo.startsWith('Bill Miller'));
  assert.equal(miller.titulo, 'Bill Miller IV: “They’re Not Printing More Bitcoin”');
  assert.match(miller.resumen, /^Bill Miller IV, Chairman and CIO/);
  assert.ok(miller.categorias.includes('MSTR'));
  // El vídeo empieza con un ▶ y el nombre del medio: ninguno debe quedar en el resumen.
  assert.match(bm[0].resumen, /^Bitcoin went from 57,000 to 82,000/);

  const decrypt = leerRss(RSS.Decrypt, { fuente: 'Decrypt' });
  assert.ok(decrypt.some(i => i.titulo === "Bitcoin Drops to $69K On 'Concentrated Liquidation' and 'Weakening' Demand"));
  assert.ok(decrypt.some(i => i.titulo === "‘Roadmap is Complete,' Cardano Founder Charles Hoskinson Says"));

  const ct = leerRss(RSS.Cointelegraph, { fuente: 'Cointelegraph' });
  assert.equal(ct[1].enlace, 'https://cointelegraph.com/markets/bitcoin-etf-outflows-2-35-billion-blackrock-11-session-streak');
  assert.match(ct[1].resumen, /^US spot Bitcoin ETFs recorded \$185\.4 million/);
});

test('aguanta XML raro: CDATA con </item>, entidades dobles, items sin cerrar, Atom, fechas rotas', () => {
  const items = leerRss(fixture('rss-raro.xml'), { fuente: 'Feed raro' });
  assert.deepEqual(items.map(i => i.titulo), [
    'Bitcoin & ether: whales move 12,000 BTC to Binance',
    "Bitcoin miners & the halving: what's next",
    'Sin fecha: bitcoin sube',
    'Fecha rota: bitcoin baja',
    'Bitcoin item sin cerrar &foo; raro',
    'BTC tras el item sin cerrar',
    'Bitcoin en Atom',
    'Bitcoin con resumen muy largo',
  ]);
  const [a, b, sinFecha, rota, sinCerrar, tras, atom, largo] = items;
  assert.equal(a.enlace, 'https://ejemplo.test/a?id=7');
  assert.equal(a.resumen, 'Primera línea con ’comillas’ y "dobles" y espacios.');
  assert.equal(b.fecha, '2026-11-14T08:00:00.000Z', 'sin zona horaria se toma UTC');
  assert.equal(b.resumen, 'Texto con enlace escapado.');
  assert.equal(sinFecha.fecha, null);
  assert.equal(rota.fecha, null);
  assert.equal(sinCerrar.enlace, 'https://ejemplo.test/d', 'usa el guid si no hay <link>');
  assert.equal(sinCerrar.fecha, '2026-11-14T05:00:00.000Z');
  assert.equal(tras.enlace, null, 'un enlace javascript: no vale');
  assert.equal(tras.fecha, '2026-11-14T10:00:00.000Z', 'EST es UTC−5');
  assert.equal(tras.resumen, 'Resumen desde content:encoded');
  assert.equal(atom.enlace, 'https://ejemplo.test/atom');
  assert.deepEqual(atom.categorias, ['mercados']);
  assert.ok(largo.resumen.length <= MAX_RESUMEN);
  assert.ok(largo.resumen.endsWith('…'));
});

test('con basura no rompe: devuelve una lista vacía', () => {
  for (const basura of ['', null, undefined, 42, {}, [], '<html><body>hola</body></html>', '<rss><channel><item>', '<item><title></title></item>', '<![CDATA[<item>']) {
    assert.deepEqual(leerRss(basura), [], `con ${JSON.stringify(basura)}`);
  }
  assert.equal(leerRss(new TextEncoder().encode('<item><title>Bitcoin</title></item>'))[0].titulo, 'Bitcoin');
});

test('entidades, HTML y fechas', () => {
  assert.equal(decodificarEntidades('a &amp; b &#8217; &#x2019; &quot;c&quot; &hellip; &AMP; &desconocida; &#146;'), 'a & b ’ ’ "c" … & &desconocida; ’');
  assert.equal(decodificarEntidades('&#x110000;&#0;&#xD800;ok'), 'ok', 'códigos imposibles se tiran sin romper');
  assert.equal(decodificarEntidades(null), '');
  assert.equal(limpiarHtml('<p>Hola <b>mundo</b></p><style>p{}</style><p>adiós&nbsp;&amp; ya</p>'), 'Hola mundo adiós & ya');
  assert.equal(limpiarHtml(undefined), '');
  assert.equal(aFechaIso('Sat, 14 Nov 2026 04:30:00 +0000'), '2026-11-14T04:30:00.000Z');
  assert.equal(aFechaIso('2026-11-14T06:30:00+02:00'), '2026-11-14T04:30:00.000Z');
  assert.equal(aFechaIso('2026-11-14'), '2026-11-14T00:00:00.000Z');
  assert.equal(aFechaIso('Thu, 01 Jan 1970 00:00:00 GMT'), null, 'antes de bitcoin es basura');
  for (const malo of ['', null, 'mañana', 'NaN']) assert.equal(aFechaIso(malo), null);
});

// ───────────────────────────── clasificación ─────────────────────────────

test('relevancia: bitcoin y lo que mueve todo el mercado entra; altcoins sueltas y ruido, fuera', () => {
  const dentro = [
    'Bitcoin plunges to $68,000 as Anthropic IPO frenzy adds to market jitters',
    'Morning Minute: Crypto Plummets as Jensen Huang Exits Nvidia',
    'U.S. Senate Banking Committee races toward hearing on new SEC nominations',
    'Strategy Made $19.5 Billion in Profit. So Why Is MSCI Removing It From Stock Indexes?',
    'Ether and XRP slide as Fed hikes rates by 50 basis points',
    'Bybit hacked for $1.5 billion in ether',
    'Unocoin keeps deposits and withdrawals halted over suspect transfers',
    'US CPI comes in hotter than expected',
  ];
  const fuera = [
    'MegaETH parent cuts 20% of staff amid restructuring, AI push',
    'DTCC adds Solana to Wall Street tokenization plans, targeting 2027 rollout',
    'Ethereum treasury firm BTCS sold ether at a loss to keep $64 million Aave loan healthy',
    "‘Roadmap is Complete,' Cardano Founder Charles Hoskinson Says",
    'Solana ETF approved by SEC',
    'Maple Finance’s strategy rift sends co-founder, COO to the exits',
    'Microsoft 365 outage hits Outlook email and Teams calendars worldwide',
    'Here’s what happened in crypto today',
    'Should Government Officials Be Banned From Prediction Markets? House Oversight Says Maybe',
    '',
  ];
  for (const titulo of dentro) assert.equal(clasificar({ titulo }).relevante, true, titulo);
  for (const titulo of fuera) assert.equal(clasificar({ titulo }).relevante, false, titulo);
  assert.equal(clasificar().relevante, false);
});

test('impacto, sentido y etiquetas siguen las reglas escritas', () => {
  const casos = [
    // [titular, impacto, sentido, etiquetas que deben estar]
    ['Bitcoin hits 12-week low as dollar rallies on interest-rate outlook, liquidations top $1.6 billion', 'alto', 'negativo', ['liquidaciones', 'macro', 'fed', 'precio']],
    ['Bitcoin Price Briefly Crashes to $67,500, Lowest Since August, as Dollar Holds 19-Month High', 'alto', 'negativo', ['precio', 'macro']],
    ['Fed cuts rates by 50 basis points in surprise move', 'alto', 'positivo', ['fed']],
    ['US CPI comes in hotter than expected', 'alto', 'negativo', ['macro']],
    ['SEC approves options on spot bitcoin ETFs', 'alto', 'positivo', ['etf', 'regulacion']],
    ['Bitcoin ETFs see record outflows as investors flee', 'alto', 'negativo', ['etf']],
    ['Bitcoin ETFs shed $2.35B in 2 weeks, BlackRock’s losing streak hits 11', 'medio', 'negativo', ['etf']],
    ['Binance halts withdrawals after security incident', 'alto', 'negativo', ['exchanges']],
    ['Unocoin keeps deposits and withdrawals halted over suspect transfers', 'medio', 'negativo', ['exchanges']],
    ['DOJ moves to seize $1.2B from Binance hack, disrupts FaceStealer scam', 'medio', 'negativo', ['hackeo', 'gobiernos']],
    ['Mt. Gox moves 10,000 BTC to a new wallet', 'alto', 'neutro', ['mtgox', 'ballenas']],
    ['Satoshi-era wallet served in a $260 billion lawsuit moves 75 BTC it held since 2011', 'medio', 'negativo', ['ballenas']],
    ['Strategy buys 5,000 BTC for $500 million', 'medio', 'positivo', ['empresas']],
    ['Strategy sells bitcoin for the first time', 'alto', 'negativo', ['empresas']],
    ['Strategy stock sheds 5% amid MSCI index removal, Bitcoin sell-off', 'medio', 'negativo', ['empresas']],
    ['Texas governor signs strategic bitcoin reserve bill into law', 'alto', 'positivo', ['gobiernos', 'regulacion']],
    ['Bitcoin hits all-time high above $130,000', 'alto', 'positivo', ['precio']],
    ['Bitcoin could crash to $50K, analyst warns', 'medio', 'negativo', ['precio']],
    ['Bitcoin rebounds from 3-month low', 'medio', 'positivo', ['precio']],
    ['Bitcoin edges up as traders wait for the Fed', 'medio', 'neutro', ['fed']],
    ['Bitcoin\'s momentum gauge is turning red, could send prices back below $60,000', 'bajo', 'negativo', ['precio']],
    ['Bitcoin miners pay Paraguay $350 million a year, but AI is pushing them out', 'bajo', 'neutro', ['mineria']],
    ['Bill Miller IV: “They’re Not Printing More Bitcoin”', 'bajo', 'neutro', []],
    ['Morning Minute: Crypto Plummets as Jensen Huang Exits Nvidia', 'medio', 'negativo', ['mercado']],
  ];
  for (const [titulo, impacto, sentido, etiquetas] of casos) {
    const c = clasificar({ titulo });
    assert.equal(c.relevante, true, titulo);
    assert.equal(c.impacto, impacto, `${titulo} → ${c.motivo}`);
    assert.equal(c.sentido, sentido, `${titulo} → ${c.motivo}`);
    for (const e of etiquetas) assert.ok(c.etiquetas.includes(e), `${titulo}: falta «${e}» en ${c.etiquetas}`);
    if (!etiquetas.length) assert.deepEqual(c.etiquetas, [], titulo);
    assert.match(c.motivo, new RegExp(`^impacto ${impacto}: .+; sentido ${sentido}`));
  }
  // El dólar fuerte y la palabra «rally» del dólar no suman a favor de BTC.
  assert.equal(clasificar({ titulo: 'Dollar index rallies to 19-month high as bitcoin holds' }).sentido, 'negativo');
});

test('si el titular no tiene sentido decide el resumen, pero solo con una suma clara', () => {
  const titulo = 'Bitcoin Hoy: lo que hay que saber';
  assert.equal(clasificar({ titulo, resumen: 'Prices plunged and liquidations spread as fear grew.' }).sentido, 'negativo');
  assert.equal(clasificar({ titulo, resumen: 'Prices plunged, then rebounded.' }).sentido, 'neutro');
  assert.match(clasificar({ titulo, resumen: 'Prices plunged and liquidations spread as fear grew.' }).motivo, /en el resumen/);
});

// ───────────────────────────── duplicados ─────────────────────────────

const noticia = (titulo, fuente, fecha, extra = {}) => ({
  titulo, fuente, fecha, enlace: `https://ejemplo.test/${encodeURIComponent(fuente)}/${encodeURIComponent(titulo)}`,
  sentido: clasificar({ titulo }).sentido, ...extra,
});

test('junta titulares casi iguales de varias fuentes, se queda la primera publicada y anota las otras', () => {
  const lista = [
    noticia('Bitcoin ETFs shed $2.35 billion in two weeks as BlackRock losing streak hits 11', 'Espejo', '2026-11-14T07:10:00Z'),
    noticia('Bitcoin ETFs shed $2.35B in 2 weeks, BlackRock’s losing streak hits 11', 'Cointelegraph', '2026-11-14T06:33:13Z'),
    noticia('Bitcoin ETFs shed $2.35B in two weeks; BlackRock’s losing streak hits 11', 'Copia', '2026-11-14T08:00:00Z'),
    noticia('Bitcoin plunges to $68,000 as Anthropic IPO frenzy adds to market jitters', 'CoinDesk', '2026-11-13T18:39:58Z'),
  ];
  assert.ok(similitud(lista[0].titulo, lista[1].titulo) >= 0.6);
  const salida = quitarDuplicados(lista);
  assert.equal(salida.length, 2);
  assert.equal(salida[0].fuente, 'Cointelegraph');
  assert.deepEqual(salida[0].otras_fuentes, ['Espejo', 'Copia']);
  assert.deepEqual(salida[1].otras_fuentes, []);
  assert.ok(Date.parse(salida[0].fecha) > Date.parse(salida[1].fecha), 'de la más nueva a la más vieja');
  assert.equal(lista[1].otras_fuentes, undefined, 'no toca la lista de entrada');
});

test('no junta noticias que solo se parecen', () => {
  const pares = [
    // cifras distintas: dos días distintos
    ['Bitcoin ETFs see $300 million in outflows', 'Bitcoin ETFs see $250 million in outflows', 2],
    // sentidos opuestos
    ['Bitcoin price drops below $70K', 'Bitcoin price rises above $70K', 2],
    // mismo tema, otro ángulo
    ['Bitcoin Hits 12-Week Low as Fed Rate Fears Undo Most of Summer Rally', 'Bitcoin hits 12-week low as dollar rallies on interest-rate outlook, liquidations top $1.6 billion', 2],
  ];
  for (const [a, b, n] of pares) {
    assert.equal(quitarDuplicados([noticia(a, 'A', '2026-11-14T06:00:00Z'), noticia(b, 'B', '2026-11-14T07:00:00Z')]).length, n, `${a} / ${b}`);
  }
  // Casi iguales pero con más de 12 h entre una y otra: son dos días.
  const t = 'Bitcoin miners sell 5,000 BTC as hashprice hits record low';
  assert.equal(quitarDuplicados([noticia(t, 'A', '2026-11-12T06:00:00Z'), noticia(`${t} again`, 'B', '2026-11-13T07:00:00Z')]).length, 2);
  // El mismo enlace es la misma noticia aunque el titular cambie.
  const mismo = { enlace: 'https://ejemplo.test/x' };
  const r = quitarDuplicados([noticia('Primer titular de bitcoin', 'A', '2026-11-14T06:00:00Z', mismo), noticia('Titular corregido', 'A', '2026-11-14T06:30:00Z', mismo)]);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].otras_fuentes, [], 'la misma fuente no se anota como otra');
  for (const basura of [null, undefined, 'x', [null, { titulo: 'sin fecha' }, { fecha: '2026-11-14T06:00:00Z' }]]) {
    assert.deepEqual(quitarDuplicados(basura), []);
  }
  assert.equal(similitud('', 'Bitcoin'), 0);
});

// ───────────────────────────── leerNoticias ─────────────────────────────

test('leerNoticias con los cuatro feeds: solo lo relevante de las últimas 24 h, de la más nueva a la más vieja', async () => {
  const { fetch, llamadas } = crearFetch(respuestasReales());
  const r = await leerNoticias({ fetch, ahora: AHORA, horas: 24 });

  assert.equal(llamadas.length, 4);
  for (const { opciones } of llamadas) {
    assert.ok(opciones.signal instanceof AbortSignal, 'cada petición lleva su señal para cortar a los 15 s');
    assert.match(opciones.headers['user-agent'], /Mozilla/);
  }
  assert.deepEqual(r.fuentes.map(f => [f.nombre, f.ok, f.n, f.leidas, f.error]), [
    ['Cointelegraph', true, 3, 8, null],
    ['Decrypt', true, 6, 8, null],
    ['Bitcoin Magazine', true, 5, 7, null],
    ['CoinDesk', true, 6, 8, null],
  ]);
  assert.equal(r.noticias.length, 20);
  assert.equal(r.hasta, '2026-11-14T10:20:00.000Z');
  assert.equal(r.desde, '2026-11-13T10:20:00.000Z');

  let anterior = Infinity;
  for (const n of r.noticias) {
    assert.deepEqual(Object.keys(n).sort(), ['enlace', 'etiquetas', 'fecha', 'fuente', 'impacto', 'motivo', 'otras_fuentes', 'resumen', 'sentido', 'titulo']);
    const ms = Date.parse(n.fecha);
    assert.ok(ms <= anterior, 'ordenadas de nueva a vieja');
    assert.ok(ms >= AHORA - 24 * HORA && ms <= AHORA, `${n.titulo} fuera de la ventana`);
    assert.ok(['alto', 'medio', 'bajo'].includes(n.impacto));
    assert.ok(['positivo', 'negativo', 'neutro'].includes(n.sentido));
    assert.ok(Array.isArray(n.etiquetas));
    anterior = ms;
  }
  const titulos = r.noticias.map(n => n.titulo);
  for (const fuera of ['MegaETH', 'Cardano', 'Nvidia Executive', 'Private AI', 'what happened in crypto', 'BTCS', 'Unocoin']) {
    assert.ok(!titulos.some(t => t.includes(fuera)), `no debería salir «${fuera}»`);
  }
  assert.equal(r.noticias[0].titulo, 'Bitcoin ETFs shed $2.35B in 2 weeks, BlackRock’s losing streak hits 11');
  assert.deepEqual(altoImpacto(r.noticias), [
    { titulo: 'Bitcoin Price Briefly Crashes to $67,500, Lowest Since August, as Dollar Holds 19-Month High', fecha: '2026-11-13T14:11:44.000Z', fuente: 'Bitcoin Magazine' },
    { titulo: 'Bitcoin hits 12-week low as dollar rallies on interest-rate outlook, liquidations top $1.6 billion', fecha: '2026-11-13T11:52:25.000Z', fuente: 'CoinDesk' },
  ]);
});

test('con 48 h entran las de ayer, y las altcoins siguen fuera', async () => {
  const { fetch } = crearFetch(respuestasReales());
  const r = await leerNoticias({ fetch, ahora: AHORA, horas: 48 });
  assert.equal(r.noticias.length, 25);
  const unocoin = r.noticias.find(n => n.titulo.startsWith('Unocoin'));
  assert.equal(unocoin.impacto, 'medio');
  assert.deepEqual(unocoin.etiquetas, ['exchanges']);
  assert.ok(!r.noticias.some(n => n.titulo.includes('BTCS')));
});

test('no mira al futuro: con un «ahora» pasado no salen las noticias posteriores', async () => {
  const { fetch } = crearFetch(respuestasReales());
  const ahora = Date.parse('2026-11-13T15:00:00Z');
  const r = await leerNoticias({ fetch, ahora, horas: 6 });
  assert.ok(r.noticias.length > 0);
  for (const n of r.noticias) assert.ok(Date.parse(n.fecha) <= ahora, n.titulo);
  assert.equal(r.noticias[0].titulo, 'President Trump Taps Two Democrats in Bipartisan Slate of SEC and CFTC Nominees as Both Agencies Run Short-Handed');
  assert.equal(r.noticias.at(-1).titulo, 'DOJ moves to seize $1.2B from Binance hack, disrupts FaceStealer scam');
});

test('si una fuente falla sigue con las demás y dice por qué en castellano', async () => {
  const [ct, de, bm, cd] = FUENTES.map(f => f.url);
  const { fetch } = crearFetch({
    [ct]: { status: 503, cuerpo: 'caído' },
    [de]: () => { throw new TypeError('fetch failed', { cause: Object.assign(new Error('getaddrinfo ENOTFOUND decrypt.co'), { code: 'ENOTFOUND' }) }); },
    [bm]: () => new Promise(() => {}), // nunca responde y además ignora la señal
    [cd]: RSS.CoinDesk,
  });
  const inicio = Date.now();
  const r = await leerNoticias({ fetch, ahora: AHORA, tiempoMaxMs: 80 });
  assert.ok(Date.now() - inicio < 2000, 'el reloj corta la fuente colgada');
  const porNombre = Object.fromEntries(r.fuentes.map(f => [f.nombre, f]));
  assert.equal(porNombre.Cointelegraph.ok, false);
  assert.match(porNombre.Cointelegraph.error, /HTTP 503/);
  assert.match(porNombre.Decrypt.error, /no se encontró el servidor \(ENOTFOUND\)/);
  assert.match(porNombre['Bitcoin Magazine'].error, /no respondió en 0,08 s/);
  assert.deepEqual([porNombre.CoinDesk.ok, porNombre.CoinDesk.n, porNombre.CoinDesk.error], [true, 6, null]);
  assert.equal(r.noticias.length, 6);
  assert.ok(r.noticias.every(n => n.fuente === 'CoinDesk'));
});

test('una fuente con fetch que respeta la señal también se corta a tiempo', async () => {
  const fetch = (url, { signal }) => new Promise((_, rechazar) => signal.addEventListener('abort', () => rechazar(new DOMException('cancelado', 'AbortError'))));
  const r = await leerNoticias({ fetch, ahora: AHORA, tiempoMaxMs: 30, fuentes: [{ nombre: 'Lenta', url: 'https://lenta.test/rss' }] });
  assert.deepEqual(r.fuentes, [{ nombre: 'Lenta', url: 'https://lenta.test/rss', ok: false, n: 0, leidas: 0, error: 'no respondió en 0,03 s' }]);
  assert.deepEqual(r.noticias, []);
});

test('una página HTML (bloqueo) en vez de RSS se marca como error', async () => {
  const { fetch } = crearFetch({ 'https://bloqueo.test/rss': '<!doctype html><html><body>Just a moment...</body></html>' });
  const r = await leerNoticias({ fetch, ahora: AHORA, fuentes: [{ nombre: 'Bloqueo', url: 'https://bloqueo.test/rss' }] });
  assert.equal(r.fuentes[0].ok, false);
  assert.match(r.fuentes[0].error, /no es un RSS/);
});

test('sin duplicados entre fuentes: la copia de otra fuente se anota en otras_fuentes', async () => {
  const espejo = `<rss><channel><item>
    <title>Bitcoin ETFs shed $2.35 billion in two weeks as BlackRock losing streak hits 11</title>
    <link>https://espejo.test/etf</link><pubDate>Sat, 14 Nov 2026 07:10:00 +0000</pubDate>
  </item></channel></rss>`;
  const { fetch } = crearFetch({ ...respuestasReales(), 'https://espejo.test/rss': espejo });
  const r = await leerNoticias({ fetch, ahora: AHORA, fuentes: [...FUENTES, { nombre: 'Espejo', url: 'https://espejo.test/rss' }] });
  assert.equal(r.noticias.length, 20);
  assert.equal(r.noticias[0].fuente, 'Cointelegraph');
  assert.deepEqual(r.noticias[0].otras_fuentes, ['Espejo']);
  assert.deepEqual(r.fuentes.at(-1), { nombre: 'Espejo', url: 'https://espejo.test/rss', ok: true, n: 0, leidas: 1, error: null });
});

test('respeta el charset del feed (ISO-8859-1)', async () => {
  const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel><item><title>Bitcoin cae según el mercado</title><link>https://latin.test/1</link><pubDate>Sat, 14 Nov 2026 09:00:00 +0000</pubDate><description>Caída del 9 % en dos días</description></item></channel></rss>';
  const bytes = Uint8Array.from(xml, c => c.charCodeAt(0)); // latin1: un byte por letra
  for (const cabeceras of [{ 'content-type': 'application/rss+xml; charset=ISO-8859-1' }, {}]) {
    const { fetch } = crearFetch({ 'https://latin.test/rss': () => new Response(bytes, { headers: cabeceras }) });
    const r = await leerNoticias({ fetch, ahora: AHORA, fuentes: [{ nombre: 'Latin', url: 'https://latin.test/rss' }] });
    assert.equal(r.noticias[0].titulo, 'Bitcoin cae según el mercado');
    assert.equal(r.noticias[0].resumen, 'Caída del 9 % en dos días');
  }
});

test('entradas raras de leerNoticias: errores claros en castellano o lista vacía', async () => {
  const { fetch } = crearFetch(respuestasReales());
  for (const horas of [-1, 0, Number.NaN, 'abc', Infinity]) {
    await assert.rejects(leerNoticias({ fetch, horas, ahora: AHORA }), /horas debe ser un número mayor que 0/, String(horas));
  }
  await assert.rejects(leerNoticias({ fetch: null, ahora: AHORA }), /No hay fetch/);
  await assert.rejects(leerNoticias({ fetch: 'no', ahora: AHORA }), /No hay fetch/);
  await assert.rejects(leerNoticias({ fetch, ahora: 'mañana' }), /ahora debe ser una fecha/);
  await assert.rejects(leerNoticias({ fetch, ahora: AHORA, fuentes: 'Cointelegraph' }), /fuentes debe ser una lista/);
  await assert.rejects(leerNoticias({ fetch, ahora: AHORA, tiempoMaxMs: -5 }), /tiempoMaxMs/);

  assert.deepEqual(await leerNoticias({ fetch, ahora: AHORA, fuentes: [] }), { noticias: [], fuentes: [], desde: '2026-11-13T10:20:00.000Z', hasta: '2026-11-14T10:20:00.000Z' });
  const r = await leerNoticias({ fetch, ahora: new Date(AHORA), horas: null, fuentes: [null, { nombre: 'Sin url' }] });
  assert.deepEqual(r.fuentes.map(f => [f.nombre, f.ok, f.error]), [['fuente 1', false, 'la fuente no tiene url'], ['Sin url', false, 'la fuente no tiene url']]);
  // Un feed vacío pero válido no es un error.
  const vacio = crearFetch({ 'https://vacio.test/rss': '<rss><channel><title>nada</title></channel></rss>' });
  const rv = await leerNoticias({ fetch: vacio.fetch, ahora: AHORA, fuentes: [{ nombre: 'Vacío', url: 'https://vacio.test/rss' }] });
  assert.deepEqual(rv.fuentes[0], { nombre: 'Vacío', url: 'https://vacio.test/rss', ok: true, n: 0, leidas: 0, error: null });
});

test('altoImpacto deja la forma que pide el gestor de riesgo y no rompe con basura', () => {
  assert.deepEqual(altoImpacto([{ titulo: 'x', fecha: '2026-11-14T06:00:00Z', fuente: 'A', impacto: 'alto' }, { titulo: 'y', fecha: '2026-11-14T06:00:00Z', impacto: 'medio' }, null]),
    [{ titulo: 'x', fecha: '2026-11-14T06:00:00Z', fuente: 'A' }]);
  assert.deepEqual(altoImpacto(undefined), []);
});

// ───────────────────────────── miedo y codicia ─────────────────────────────

test('miedoCodicia lee la respuesta real guardada de alternative.me', async () => {
  const { fetch, llamadas } = crearFetch({ [URL_MIEDO_CODICIA]: { cuerpo: fixture('miedo-codicia.json'), cabeceras: { 'content-type': 'application/json' } } });
  assert.deepEqual(await miedoCodicia({ fetch }), { valor: 13, clase: 'miedo extremo', clase_original: 'Extreme Fear', fecha: '2026-11-14T00:00:00.000Z' });
  assert.equal(llamadas[0].url, 'https://api.alternative.me/fng/?limit=1');
});

test('miedoCodicia: clase desconocida se deduce del valor; los fallos dicen qué pasó', async () => {
  const con = cuerpo => crearFetch({ [URL_MIEDO_CODICIA]: { cuerpo: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo) } }).fetch;
  const r = await miedoCodicia({ fetch: con({ data: [{ value: '60', value_classification: 'Algo nuevo', timestamp: 'x' }] }) });
  assert.deepEqual(r, { valor: 60, clase: 'codicia', clase_original: 'Algo nuevo', fecha: null });
  assert.equal((await miedoCodicia({ fetch: con({ data: [{ value: 50 }] }) })).clase, 'neutral');

  await assert.rejects(miedoCodicia({ fetch: crearFetch({ [URL_MIEDO_CODICIA]: { status: 500 } }).fetch }), /No pude leer el índice de miedo y codicia.*HTTP 500/);
  await assert.rejects(miedoCodicia({ fetch: con('<html>no</html>') }), /no llegó en JSON/);
  await assert.rejects(miedoCodicia({ fetch: con({ data: [], metadata: { error: 'límite superado' } }) }), /alternative\.me devolvió un error: límite superado/);
  for (const malo of [{ data: [] }, { data: [{ value: 'abc' }] }, { data: [{ value: 150 }] }, { data: [{}] }, {}, null, []]) {
    await assert.rejects(miedoCodicia({ fetch: con(malo) }), /sin un valor entre 0 y 100/, JSON.stringify(malo));
  }
  await assert.rejects(miedoCodicia({ fetch: null }), /No hay fetch/);
  await assert.rejects(miedoCodicia({ fetch: () => new Promise(() => {}), tiempoMaxMs: 20 }), /no respondió en 0,02 s/);
});
