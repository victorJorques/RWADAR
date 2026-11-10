#!/usr/bin/env node
/* =====================================================================
   RWAdar · foto diaria de la tokenización en el mundo (10/11/2026)
   ---------------------------------------------------------------------
   Lee la lista de categorías de CoinGecko (gratis, sin clave), saca la foto
   del día (total «tokenized-products» y los tipos de
   rwadar-movil/lib/tokenizacion.js) y la añade al histórico.

     node rwadar-app/tokenizacion/foto-diaria.mjs RUTA/tokenizacion-historico.json \
       [--semilla rwadar-site/datos/tokenizacion-historico.json]

   - Si el histórico no existe, empieza por la semilla de main (la foto real
     del 10/11/2026); si tampoco hay semilla, vacío.
   - Una foto por día UTC (la fecha de «updated_at» del total). Si ya hay foto
     de ese día, no toca el archivo: es idempotente.
   - Hasta 3 intentos, con espera entre ellos (o la que pida Retry-After, como
     mucho 2 minutos) y 20 s como mucho por intento. Si la respuesta no tiene
     la forma esperada, no escribe nada y termina con error.
   - Exige TLS: con NODE_TLS_REJECT_UNAUTHORIZED=0 no arranca.
   No publica nada, no usa claves y solo escribe el archivo que se le indica.
   Lo usa el flujo .github/workflows/tokenizacion-diaria.yml.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const modelo = require('../../rwadar-movil/lib/tokenizacion.js');
const INTENTOS = 3;
const PLAZO_MS = 20000;
const ESPERAS_MS = [15000, 45000];
const ESPERA_MAX_MS = 120000;
const MAX_BYTES = 4 * 1024 * 1024;

async function leerLimitado(respuesta) {
  const declarado = Number(respuesta.headers.get('content-length'));
  if (declarado > MAX_BYTES) throw new Error('la respuesta de CoinGecko es demasiado grande');
  const texto = await respuesta.text();
  if (Buffer.byteLength(texto) > MAX_BYTES) throw new Error('la respuesta de CoinGecko es demasiado grande');
  return texto;
}

/* La foto de ahora, con reintentos. Lanza con el último error si no lo consigue. */
export async function pedirFoto({ fetchImpl = fetch, esperar = ms => new Promise(r => setTimeout(r, ms)), ahora = Date.now, avisar = () => {} } = {}) {
  let ultimo;
  for (let intento = 1; intento <= INTENTOS; intento++) {
    let espera = ESPERAS_MS[intento - 1] ?? ESPERAS_MS.at(-1);
    const abort = new AbortController(); const reloj = setTimeout(() => abort.abort(), PLAZO_MS);
    try {
      const r = await fetchImpl(modelo.FUENTE.api, { headers: { Accept: 'application/json' }, redirect: 'error', signal: abort.signal });
      if (!r.ok) {
        const retry = r.headers.get('retry-after') || '';
        if (/^[0-9]{1,6}$/.test(retry)) espera = Math.min(ESPERA_MAX_MS, Number(retry) * 1000);
        throw new Error(`CoinGecko respondió ${r.status}`);
      }
      let lista;
      try { lista = JSON.parse(await leerLimitado(r)); } catch (e) { throw new Error(/grande/.test(e.message) ? e.message : 'CoinGecko no devolvió JSON'); }
      return modelo.extraerFoto(lista, { ahora: ahora(), maxAntiguedadHoras: 36 });
    } catch (error) {
      ultimo = error.name === 'AbortError' ? new Error(`CoinGecko no respondió en ${PLAZO_MS / 1000} s`) : error;
      avisar(`Intento ${intento} de ${INTENTOS}: ${ultimo.message}`);
      if (intento < INTENTOS) await esperar(espera);
    } finally { clearTimeout(reloj); }
  }
  throw ultimo;
}

function leerJSON(ruta) { return JSON.parse(fs.readFileSync(ruta, 'utf8')); }

export async function principal(argv = process.argv.slice(2), { entorno = process.env, fetchImpl, esperar, ahora, log = console.log, error = console.error } = {}) {
  if (entorno.NODE_TLS_REJECT_UNAUTHORIZED === '0') { error('NODE_TLS_REJECT_UNAUTHORIZED=0 desactiva TLS: no se lee CoinGecko así.'); return 1; }
  const iSemilla = argv.indexOf('--semilla');
  const semilla = iSemilla >= 0 ? argv[iSemilla + 1] : null;
  const rutas = argv.filter((a, i) => a !== '--semilla' && (iSemilla < 0 || i !== iSemilla + 1));
  if (rutas.length !== 1 || !rutas[0].endsWith('.json') || (iSemilla >= 0 && !semilla)) {
    error('Uso: node rwadar-app/tokenizacion/foto-diaria.mjs RUTA/tokenizacion-historico.json [--semilla RUTA]');
    return 2;
  }
  const destino = path.resolve(rutas[0]);
  let historico;
  const existia = fs.existsSync(destino);
  try {
    if (existia) historico = modelo.validarHistorico(leerJSON(destino));
    else if (semilla && fs.existsSync(semilla)) { historico = modelo.validarHistorico(leerJSON(semilla)); log(`Sin histórico: se empieza por la semilla (${historico.fotos.length} foto/s).`); }
    else { historico = modelo.historicoVacio(); log('Sin histórico ni semilla: se empieza vacío.'); }
  } catch (e) { error(`El histórico no es válido y no se toca: ${e.message}`); return 1; }

  let foto;
  try { foto = await pedirFoto({ fetchImpl, esperar, ahora, avisar: m => log(m) }); }
  catch (e) { error(`No se pudo leer CoinGecko: ${e.message}. No se escribe nada.`); return 1; }

  const { historico: nuevo, anadida } = modelo.anadirFoto(historico, foto);
  const salida = entorno.GITHUB_OUTPUT;
  const resumen = [`Foto de CoinGecko del ${modelo.horaDato(foto.actualizado)}: ${modelo.millones(foto.total.valor)} en activos tokenizados ` +
    `(${modelo.porcentaje(foto.total.cambio24h)} en 24 h).`];
  // Sin archivo (primera vez), se escribe aunque la foto ya estuviera en la semilla.
  const cambiado = anadida || !existia;
  if (!cambiado) resumen.push(`Ya había foto del ${modelo.fechaCorta(foto.fecha)}: el histórico no cambia.`);
  else {
    const temporal = destino + '.tmp-' + process.pid;
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(temporal, modelo.serializarHistorico(nuevo));
    fs.renameSync(temporal, destino);
    resumen.push((anadida ? `Añadida la foto del ${modelo.fechaCorta(foto.fecha)}` : `Ya había foto del ${modelo.fechaCorta(foto.fecha)} en la semilla; se crea el histórico`) +
      `: tiene ${nuevo.fotos.length} foto/s desde el ${modelo.fechaCorta(nuevo.fotos[0].fecha)}.`);
  }
  for (const linea of resumen) log(linea);
  if (salida) fs.appendFileSync(salida, `cambiado=${cambiado}\nfecha=${foto.fecha}\n`);
  if (entorno.GITHUB_STEP_SUMMARY) fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, resumen.map(l => `- ${l}`).join('\n') + '\n');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await principal();
}
