#!/usr/bin/env node
/* =====================================================================
   RWAdar · serie de un año del mercado de la tokenización (11/11/2026)
   ---------------------------------------------------------------------
   Reconstruye, con datos reales de CoinGecko (gratis, sin clave), la serie
   diaria del gráfico «estilo bolsa» de /mercado/ y de la app:

     node rwadar-app/tokenizacion/serie-diaria.mjs RUTA/tokenizacion-serie.json

   1. /coins/markets de la categoría «tokenized-products»: los 40 mayores de
      hoy y su cuota del total (unos 93 %).
   2. /coins/{id}/market_chart de cada uno (365 días, diario), con unos 3 s
      entre llamadas para no pasar del límite gratuito. Si CoinGecko responde
      429, se espera (Retry-After, como mucho 2 minutos) y se reintenta.
   3. La suma diaria (rwadar-movil/lib/tokenizacion.js, construirSerie).

   Si un token no se puede leer, queda fuera de toda la serie y se dice
   cuántos entran. Si faltan tantos que pesan más del 5 % del total, o falla
   la lista, NO se escribe nada (se conserva la serie anterior) y termina con
   el código 3. Si a un token le faltan en CoinGecko más de 3 días de su
   historia (huecos de más de 3 días o una historia que acaba antes de hoy),
   también queda fuera («discontinuos») y la nota del gráfico lo dice; si
   así la serie no llega al 75 % del total, tampoco se escribe. Exige TLS. No publica, no usa claves y solo escribe el
   archivo que se le indica. Lo usa .github/workflows/tokenizacion-diaria.yml.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const modelo = require('../../rwadar-movil/lib/tokenizacion.js');
const PAUSA_MS = 3000;
const PLAZO_MS = 20000;
const INTENTOS = 3;
const ESPERA_429_MS = 60000;
const ESPERA_MAX_MS = 120000;
const MAX_BYTES = 4 * 1024 * 1024;
const PERDIDA_MAX_PCT = 5;
const COBERTURA_MIN_PCT = 75;

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

/* La serie nueva, o lanza si no se puede construir con garantías. */
export async function reconstruir({ fetchImpl = fetch, esperar = dormir, ahora = Date.now, avisar = () => {}, pausaMs = PAUSA_MS } = {}) {
  const lista = await pedirJSON(modelo.SERIE.apiMercados, { fetchImpl, esperar, avisar });
  const { mayores, total, cobertura } = modelo.elegirMayores(lista);
  avisar(`Lista de CoinGecko: ${mayores.length} mayores, ${cobertura} % del total.`);
  const historias = [], incluidos = [], fallidos = [], discontinuos = [];
  const hoy = new Date(ahora()).toISOString().slice(0, 10);
  for (const t of mayores) {
    await esperar(pausaMs);
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
      historias.push(h); incluidos.push(t);
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
  const generado = new Date(ahora()).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const puntos = modelo.construirSerie(historias, generado.slice(0, 10)).slice(-modelo.SERIE.maxPuntos);
  if (puntos.length < 300) throw new Error(`la serie solo tiene ${puntos.length} días`);
  return { serie: modelo.validarSerie({ version: 1, fuente: modelo.FUENTE.nombre, categoria: modelo.SERIE.categoria, generado,
    pedidos: mayores.length, incluidos: incluidos.length, discontinuos: discontinuos.length, cobertura: coberturaIncluidos,
    tokens: incluidos.map(t => t.id), puntos }), fallidos, discontinuos };
}

export async function principal(argv = process.argv.slice(2), { entorno = process.env, fetchImpl, esperar, ahora, pausaMs, log = console.log, error = console.error } = {}) {
  if (entorno.NODE_TLS_REJECT_UNAUTHORIZED === '0') { error('NODE_TLS_REJECT_UNAUTHORIZED=0 desactiva TLS: no se lee CoinGecko así.'); return 1; }
  if (argv.length !== 1 || !argv[0].endsWith('.json')) { error('Uso: node rwadar-app/tokenizacion/serie-diaria.mjs RUTA/tokenizacion-serie.json'); return 2; }
  const destino = path.resolve(argv[0]);
  const salida = entorno.GITHUB_OUTPUT;
  let r;
  try { r = await reconstruir({ fetchImpl, esperar, ahora, pausaMs, avisar: m => log(m) }); }
  catch (e) {
    error(`No se pudo reconstruir la serie: ${e.message}. Se conserva la anterior.`);
    if (salida) fs.appendFileSync(salida, 'serie=false\n');
    return 3;
  }
  const temporal = destino + '.tmp-' + process.pid;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(temporal, modelo.serializarSerie(r.serie));
  fs.renameSync(temporal, destino);
  const p = r.serie.puntos, linea = `Serie del mercado: ${p.length} días, del ${modelo.fechaCorta(p[0].fecha)} al ${modelo.fechaCorta(p.at(-1).fecha)}; ` +
    `${r.serie.incluidos} de ${r.serie.pedidos} tokens (${r.serie.cobertura} % del total; ${r.serie.discontinuos} fuera por huecos); hoy ${modelo.millones(p.at(-1).valor)}.`;
  log(linea);
  if (salida) fs.appendFileSync(salida, 'serie=true\n');
  if (entorno.GITHUB_STEP_SUMMARY) fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, `- ${linea}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await principal();
}
