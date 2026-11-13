#!/usr/bin/env node
/* =====================================================================
   RWAdar · series del mercado de la tokenización (11/11/2026; finas, 13/11/2026)
   ---------------------------------------------------------------------
   Reconstruye, con datos reales de CoinGecko (gratis, sin clave), la serie
   diaria del gráfico «estilo bolsa» de /mercado/ y de la app y, con --fina,
   las dos series de más detalle (un punto cada 5 minutos de las últimas 24
   horas y uno cada hora de los últimos 30 días):

     node rwadar-app/tokenizacion/serie-diaria.mjs RUTA/tokenizacion-serie.json \
       [--fina RUTA/tokenizacion-serie-fina.json]

   1. /coins/categories: el total de la categoría «tokenized-products», el
      mismo que enseñan la cabecera y los tipos. Es el denominador de las
      cuotas (si no responde, la suma de la lista, y lo dice el registro).
   2. /coins/markets de la categoría: los 40 mayores de hoy.
   3. /coins/{id}/market_chart de cada uno (365 días, diario: sin clave,
      CoinGecko responde 401 a days=366), con 13 s
      entre llamadas (unos 9 minutos en total) para no pasar del límite
      gratuito: con 3 s CoinGecko daba 429 una vez sí y otra no. Si CoinGecko responde
      429, se espera (Retry-After, como mucho 2 minutos) y se reintenta.
   4. La suma diaria (rwadar-movil/lib/tokenizacion.js, construirSerie) de
      los mayores con historia completa (el 11/11/2026, 29 de los 40).
      Se escribe ya: si lo que sigue falla o se corta, la diaria está a salvo.
   5. Con --fina, de los que entran en la diaria (unos 30), la historia de
      cada hora (days=31) y después, seguidas, la de cada 5 minutos (days=1),
      con la misma pausa (unas 60 llamadas más, unos 13 minutos; el
      13/11/2026, 103 llamadas en total y 23 minutos). Con ellas, las dos
      series finas (construirSerieFina) de los mismos tokens; y la diaria se
      rehace con el último dato de cada token, así las tres acaban en el
      mismo punto y la cifra grande no contradice a ninguna pestaña. Un
      token al que en la ventana le faltan más de 24 horas de datos (72 en la
      horaria), o cuya lectura fina falla, queda fuera de ESA serie (la serie lo dice y cuánto
      suma); si los de fuera pesan más del 1 %, esa serie no sale. Se
      escriben la fina y la diaria nueva, las dos con el mismo «generado».
      Si falla una serie fina, se guarda la otra; si fallan las dos o se
      acaba el tiempo, no se escribe nada más: queda la diaria del paso 4 y
      la fina anterior (que ya no casa con ella y el gráfico no usa).

   Si un token no se puede leer, queda fuera de toda la serie y se dice
   cuántos entran. Si faltan tantos que pesan más del 1 % del total (QA del
   11/11/2026: con un 5 %, si fallaba Ondo, del 4,8 %, salía una serie nueva
   con un −5,6 % de golpe que el mercado no había tenido), o falla la lista,
   NO se escribe nada (se conserva la serie anterior) y termina con el
   código 3. Si a un token le faltan en CoinGecko más de 3 días de su
   historia (huecos de más de 3 días o una historia que acaba antes de hoy),
   también queda fuera («discontinuos») y la nota del gráfico lo dice; si
   así la serie no llega al 75 % del total, tampoco se escribe.
   Plazos propios, menores que el del paso del flujo: la diaria no empieza
   una llamada pasados 20 minutos (si no, código 3 y nada escrito); las
   finas, pasados 34 (si no, se quedan como estaban). Exige TLS. No publica,
   no usa claves y solo escribe los archivos que se le indican, siempre
   enteros (nombre temporal y cambio de nombre). Lo usa
   .github/workflows/tokenizacion-diaria.yml.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const modelo = require('../../rwadar-movil/lib/tokenizacion.js');
const PAUSA_MS = 13000;
const PLAZO_MS = 20000;
const INTENTOS = 3;
const ESPERA_429_MS = 60000;
const ESPERA_MAX_MS = 120000;
const MAX_BYTES = 4 * 1024 * 1024;
const PERDIDA_MAX_PCT = 1;
const COBERTURA_MIN_PCT = 75;
// Desde el arranque: la diaria no empieza una llamada pasados 20 minutos y
// las finas, pasados 34. Una llamada con sus reintentos dura como mucho 5
// minutos (3 de 20 s y dos esperas de 2 minutos): el paso del flujo, de 40.
const PLAZO_DIARIA_MS = 20 * 60000;
const PLAZO_FINA_MS = 34 * 60000;

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function pedirJSON(url, { fetchImpl, esperar, avisar }) {
  let ultimo;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    let espera = intento === 1 ? 10000 : 30000;
    const abort = new AbortController(); const reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetchImpl(url, { headers: { Accept: 'application/json' }, redirect: 'error', signal: abort.signal });
      if (!r.ok) {
        const retry = r.headers.get('retry-after') || '';
        if (r.status === 429) espera = ESPERA_429_MS;
        if (/^[0-9]{1,6}$/.test(retry)) espera = Math.min(ESPERA_MAX_MS, Number(retry) * 1000);
        throw new Error(`CoinGecko respondió ${r.status}`);
      }
      const texto = await r.text();
      if (Buffer.byteLength(texto) > MAX_BYTES) throw new Error('la respuesta de CoinGecko es demasiado grande');
      try { return JSON.parse(texto); } catch { throw new Error('CoinGecko no devolvió JSON'); }
    } catch (error) {
      ultimo = error.name === 'AbortError' ? new Error(`CoinGecko no respondió en ${PLAZO_MS / 1000} s`) : error;
      avisar(`  intento ${intento} de ${INTENTOS}: ${ultimo.message}`);
      if (intento < INTENTOS) await esperar(espera);
    } finally { clearTimeout(reloj); }
  }
  throw ultimo;
}

/* Antes de cada llamada: si ya pasó el plazo, se para. */
function comprobarPlazo(ahora, limite, que) {
  if (ahora() > limite) throw new Error(`se acabó el tiempo para ${que}`);
}

/* El total de la categoría (/coins/categories) o null si no se puede leer. */
async function totalCategoria({ fetchImpl, esperar, avisar }) {
  try {
    const lista = await pedirJSON(modelo.FUENTE.api, { fetchImpl, esperar, avisar });
    const c = Array.isArray(lista) ? lista.find(x => x && x.id === modelo.SERIE.categoria) : null;
    const v = c?.market_cap;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
    throw new Error('sin el valor de la categoría');
  } catch (e) {
    avisar(`Total de la categoría: no se pudo leer (${e.message}); las cuotas usan la suma de la lista.`);
    return null;
  }
}

const isoAhora = ahora => new Date(ahora()).toISOString().replace(/\.\d{3}Z$/, 'Z');

/* La diaria a partir de las historias de los que entran, con sus comprobaciones. */
function armarSerie({ mayores, incluidos, discontinuos, historias, coberturaIncluidos, generado }) {
  const puntos = modelo.construirSerie(historias, generado.slice(0, 10)).slice(-modelo.SERIE.maxPuntos);
  if (puntos.length < 300) throw new Error(`la serie solo tiene ${puntos.length} días`);
  return modelo.validarSerie({ version: 1, fuente: modelo.FUENTE.nombre, categoria: modelo.SERIE.categoria, generado,
    pedidos: mayores.length, incluidos: incluidos.length, discontinuos: discontinuos.length, cobertura: coberturaIncluidos,
    tokens: incluidos.map(t => t.id), puntos });
}

/* La serie diaria, o lanza si no se puede construir con garantías. «base»
   guarda lo que necesitan las finas: los que entran, sus datos diarios y
   sus historias. */
export async function reconstruir({ fetchImpl = fetch, esperar = dormir, ahora = Date.now, avisar = () => {}, pausaMs = PAUSA_MS, limite = Infinity } = {}) {
  const categoria = await totalCategoria({ fetchImpl, esperar, avisar });
  await esperar(pausaMs);
  const lista = await pedirJSON(modelo.SERIE.apiMercados, { fetchImpl, esperar, avisar });
  const { mayores, total, cobertura } = modelo.elegirMayores(lista, modelo.SERIE.mayores, categoria);
  avisar(`Lista de CoinGecko: ${mayores.length} mayores, ${cobertura} % del total${categoria ? ' de la categoría' : ' de la lista'}.`);
  const historias = [], incluidos = [], fallidos = [], discontinuos = [], diarios = [];
  const hoy = new Date(ahora()).toISOString().slice(0, 10);
  for (const t of mayores) {
    await esperar(pausaMs);
    comprobarPlazo(ahora, limite, 'la serie diaria');
    try {
      const d = await pedirJSON(modelo.urlHistoria(t.id), { fetchImpl, esperar, avisar });
      if (!d || typeof d !== 'object') throw new Error('respuesta sin forma');
      const h = modelo.historiaToken(d.market_caps);
      if (!h.primera) throw new Error('sin ningún dato de valor de mercado');
      const sinDato = modelo.diasSinDato(h, hoy);
      if (sinDato > modelo.SERIE.maxDiasSinDato) {
        discontinuos.push(t);
        avisar(`· ${t.id}: fuera, le faltan ${sinDato} días en CoinGecko`);
        continue;
      }
      historias.push(h); incluidos.push(t); diarios.push(modelo.observacionesToken(d.market_caps));
      avisar(`· ${t.id}: ${h.dias.size} días desde el ${h.primera}${sinDato ? ` (${sinDato} sin dato)` : ''}`);
    } catch (e) {
      fallidos.push(t);
      avisar(`· ${t.id}: NO entra (${e.message})`);
    }
  }
  const perdida = fallidos.reduce((s, t) => s + t.valor, 0) / total * 100;
  if (perdida > PERDIDA_MAX_PCT) throw new Error(`faltan ${fallidos.length} tokens que pesan el ${perdida.toFixed(1)} % del total`);
  if (incluidos.length < modelo.SERIE.minIncluidos) throw new Error(`solo entran ${incluidos.length} tokens`);
  const coberturaIncluidos = Math.round(incluidos.reduce((s, t) => s + t.valor, 0) / total * 1000) / 10;
  if (coberturaIncluidos < COBERTURA_MIN_PCT) throw new Error(`los que entran solo son el ${coberturaIncluidos} % del total`);
  const base = { mayores, incluidos, discontinuos, historias, diarios, coberturaIncluidos };
  return { serie: armarSerie({ ...base, generado: isoAhora(ahora) }), fallidos, discontinuos, base };
}

/* Las series finas de los mismos tokens que la diaria, y la diaria rehecha
   con el último dato de cada token. Lanza si no sale ninguna fina o se
   acaba el tiempo (entonces no se escribe nada). Las horarias primero y las
   de 5 minutos al final y seguidas: su último dato es el «ahora» de cada
   token, todos dentro de unos minutos. */
const fechaHora = iso => iso.slice(0, 10) + ' ' + iso.slice(11, 16) + ' UTC';
export async function reconstruirFina(base, { fetchImpl = fetch, esperar = dormir, ahora = Date.now, avisar = () => {}, pausaMs = PAUSA_MS, limite = Infinity } = {}) {
  const { incluidos } = base;
  const obs = { '1h': [], '5m': [] };
  for (const res of ['1h', '5m']) {
    let fallos = 0;
    for (const t of incluidos) {
      await esperar(pausaMs);
      comprobarPlazo(ahora, limite, 'las series finas');
      try {
        const d = await pedirJSON(modelo.urlHistoriaFina(t.id, res), { fetchImpl, esperar, avisar });
        if (!d || typeof d !== 'object') throw new Error('respuesta sin forma');
        const o = modelo.observacionesToken(d.market_caps);
        if (!o.length) throw new Error('sin ningún dato de valor de mercado');
        obs[res].push(o);
      } catch (e) {
        obs[res].push(null); fallos++;
        avisar(`· ${t.id} (${res}): no se pudo leer (${e.message}); queda fuera de esa serie`);
      }
    }
    avisar(`Historias de ${res === '1h' ? 'cada hora' : 'cada 5 minutos'}: ${incluidos.length - fallos} de ${incluidos.length}.`);
  }
  // El «ahora» de cada token: su dato más reciente de las tres lecturas.
  const ultimos = incluidos.map((_, i) => [base.diarios[i], obs['1h'][i], obs['5m'][i]]
    .filter(o => o && o.length).map(o => o[o.length - 1]).reduce((a, b) => (b[0] > a[0] ? b : a)));
  // Lo que entra en cada serie fina de un token: los datos de sus otras
  // lecturas anteriores al primero de la fina (para arrastrar al principio
  // de la ventana: con days=1 CoinGecko empieza justo 24 horas antes), los
  // de la fina y, si es más reciente, su último dato.
  const entrada = (res, i) => {
    const t = incluidos[i], propia = obs[res][i];
    if (!propia) return { id: t.id, obs: null, valor: ultimos[i][1] };
    const otras = (res === '5m' ? [base.diarios[i], obs['1h'][i]] : [base.diarios[i]]).filter(Boolean).flat()
      .filter(([ms]) => ms < propia[0][0]).sort((a, b) => a[0] - b[0]);
    const todas = [...otras, ...propia];
    if (todas[todas.length - 1][0] < ultimos[i][0]) todas.push(ultimos[i]);
    return { id: t.id, obs: todas, primera: base.historias[i].primera };
  };
  const series = { '5m': null, '1h': null };
  for (const res of ['5m', '1h']) {
    const r = modelo.RESOLUCIONES[res];
    try {
      const { puntos, fuera, valorFuera, largos, arrastre } = modelo.construirSerieFina(incluidos.map((_, i) => entrada(res, i)), res);
      series[res] = { paso: r.pasoMs / 1000, arrastre, fuera, valorFuera, largos, puntos };
      avisar(`Serie de ${res}: ${puntos.length} puntos, del ${fechaHora(puntos[0][0])} al ${fechaHora(puntos.at(-1)[0])}; ` +
        `fuera: ${fuera.length ? `${fuera.join(', ')} (${modelo.millones(valorFuera)})` : 'ninguno'}; ` +
        `más de una hora sin dato: ${largos.length ? largos.join(', ') : 'ninguno'}.`);
    } catch (e) { avisar(`Serie de ${res}: no se guarda (${e.message}).`); }
  }
  if (!series['5m'] && !series['1h']) throw new Error('no sale ninguna serie fina');
  // La diaria, con el último dato de cada token (el de la lectura más reciente).
  const historias = base.diarios.map((o, i) => modelo.historiaToken(o[o.length - 1][0] < ultimos[i][0] ? [...o, ultimos[i]] : o));
  const generado = isoAhora(ahora);
  const serie = armarSerie({ ...base, historias, generado });
  const fina = modelo.validarSerieFina({ version: 1, fuente: modelo.FUENTE.nombre, categoria: modelo.SERIE.categoria, generado, tokens: serie.tokens, series });
  const enlazadas = modelo.seriesEnlazadas(serie, fina);
  for (const res of ['5m', '1h']) if (fina.series[res] && !enlazadas[res]) throw new Error(`la serie de ${res} no acaba en el último punto de la diaria`);
  return { serie, fina };
}

function escribir(destino, texto) {
  const temporal = destino + '.tmp-' + process.pid;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(temporal, texto);
  fs.renameSync(temporal, destino);
}

export async function principal(argv = process.argv.slice(2), { entorno = process.env, fetchImpl, esperar, ahora = Date.now, pausaMs, log = console.log, error = console.error } = {}) {
  if (entorno.NODE_TLS_REJECT_UNAUTHORIZED === '0') { error('NODE_TLS_REJECT_UNAUTHORIZED=0 desactiva TLS: no se lee CoinGecko así.'); return 1; }
  const iFina = argv.indexOf('--fina');
  const rutaFina = iFina >= 0 ? argv[iFina + 1] : null;
  const rutas = argv.filter((a, i) => a !== '--fina' && (iFina < 0 || i !== iFina + 1));
  if (rutas.length !== 1 || !rutas[0].endsWith('.json') || (iFina >= 0 && !(rutaFina && rutaFina.endsWith('.json'))) ||
    (rutaFina && path.resolve(rutaFina) === path.resolve(rutas[0]))) {
    error('Uso: node rwadar-app/tokenizacion/serie-diaria.mjs RUTA/tokenizacion-serie.json [--fina RUTA/tokenizacion-serie-fina.json]');
    return 2;
  }
  const destino = path.resolve(rutas[0]);
  const salida = entorno.GITHUB_OUTPUT, resumen = entorno.GITHUB_STEP_SUMMARY;
  const inicio = ahora();
  let r;
  try { r = await reconstruir({ fetchImpl, esperar, ahora, pausaMs, avisar: m => log(m), limite: inicio + PLAZO_DIARIA_MS }); }
  catch (e) {
    error(`No se pudo reconstruir la serie: ${e.message}. Se conserva la anterior.`);
    if (salida) fs.appendFileSync(salida, 'serie=false\n');
    return 3;
  }
  escribir(destino, modelo.serializarSerie(r.serie));
  const lineaDiaria = s => `Serie del mercado: ${s.puntos.length} días, del ${modelo.fechaCorta(s.puntos[0].fecha)} al ${modelo.fechaCorta(s.puntos.at(-1).fecha)}; ` +
    `${s.incluidos} de ${s.pedidos} tokens (${s.cobertura} % del total; ${s.discontinuos} fuera por huecos); hoy ${modelo.millones(s.puntos.at(-1).valor)}.`;
  log(lineaDiaria(r.serie));
  if (salida) fs.appendFileSync(salida, 'serie=true\n');
  if (resumen) fs.appendFileSync(resumen, `- ${lineaDiaria(r.serie)}\n`);
  if (!rutaFina) return 0;

  let f;
  try { f = await reconstruirFina(r.base, { fetchImpl, esperar, ahora, pausaMs, avisar: m => log(m), limite: inicio + PLAZO_FINA_MS }); }
  catch (e) {
    error(`Series finas: no se pudieron rehacer (${e.message}). Queda la anterior; la diaria ya está guardada.`);
    if (salida) fs.appendFileSync(salida, 'fina=false\n');
    if (resumen) fs.appendFileSync(resumen, `- Series finas: no se pudieron rehacer (${e.message}).\n`);
    return 0;
  }
  // Primero la fina y después la diaria: si algo se corta entre las dos, la
  // fina nueva no casa con la diaria anterior («generado») y no se usa.
  const textoFina = modelo.serializarSerieFina(f.fina);
  escribir(path.resolve(rutaFina), textoFina);
  escribir(destino, modelo.serializarSerie(f.serie));
  const cuenta = res => (f.fina.series[res] ? `${f.fina.series[res].puntos.length} puntos` : 'no');
  const lineaFina = `Series finas: cada 5 minutos, ${cuenta('5m')}; cada hora, ${cuenta('1h')}; ${f.fina.tokens.length} tokens, los de la diaria; ` +
    `${(Buffer.byteLength(textoFina) / 1024).toFixed(1)} kB. Las tres acaban en ${modelo.millones(f.serie.puntos.at(-1).valor)}.`;
  log(lineaFina);
  if (salida) fs.appendFileSync(salida, 'fina=true\n');
  if (resumen) fs.appendFileSync(resumen, `- ${lineaFina}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await principal();
}
