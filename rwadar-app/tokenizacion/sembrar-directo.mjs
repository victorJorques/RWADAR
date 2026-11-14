#!/usr/bin/env node
/* =====================================================================
   RWAdar · siembra del gráfico en directo (migración 35, 14/11/2026)
   ---------------------------------------------------------------------
   Escribe en la salida estándar el SQL que siembra la historia del directo
   con datos reales de CoinGecko (gratis, sin clave), para que al encender
   «24 h», «1 S» y «1 M» salgan enteras desde el primer minuto:

     node rwadar-app/tokenizacion/sembrar-directo.mjs > siembra.sql
     psql -v ON_ERROR_STOP=1 -X -1 -f siembra.sql    (una transacción)

   1. La diaria publicada (rwadar.pages.dev/datos/tokenizacion-serie.json):
      su lista de tokens, en su orden, y su «generado».
   2. /coins/markets de la categoría (la misma dirección que el flujo
      diario y que la base): los 40 mayores de hoy.
   3. De cada token de la diaria y de los 40 mayores (unos 40),
      market_chart con days=31 (cada hora) y days=1 (cada 5 minutos), con
      13 s entre llamadas y los reintentos de serie-diaria.mjs (pedirJSON):
      unas 81 llamadas y unos 18 minutos, UNA vez (y tras un corte del
      directo de más de una hora).
   4. Por token, lo mismo que el flujo diario pasa a construirSerieFina:
      la horaria (days=31) y la de 5 minutos (days=1) con, delante, los
      puntos horarios anteriores a su primer dato (para arrastrar al
      principio de la ventana). «primera»: el día de su primer dato, solo
      si CoinGecko lo sigue desde hace menos de 30 días.
   5. Un token que no se puede leer se avisa y se siembra con su valor de
      /coins/markets (quedará fuera de la serie con su valor, y la regla
      del 1 % decide si la serie sale).
   6. Al final, cerrar_siembra(lista, generado de la diaria, hora del
      último dato): guarda la lista, apunta hasta dónde llega la historia
      completa y hace el documento.
   El JSON de cada token solo lleva ids comprobados y números, entre
   $siembra$…$siembra$. No usa claves ni la base: el flujo «Mercado en
   directo (base)» (acciones sembrar y encender) pasa el SQL a psql. Si no
   puede leer la diaria o la lista, no escribe nada y sale con código 3.
   ===================================================================== */
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { pedirJSON } from './serie-diaria.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../../rwadar-movil/lib/tokenizacion.js');
export const URL_DIARIA = 'https://rwadar.pages.dev/datos/tokenizacion-serie.json';
const PAUSA_MS = 13000;
const PLAZO_MS = 25 * 60000;
const MAYORES = 40;
const dormir = ms => new Promise(r => setTimeout(r, ms));

/* Lo que el flujo diario pasaría a construirSerieFina para un token. */
export function observacionesSiembra(caps31, caps1) {
  const h = caps31 ? modelo.observacionesToken(caps31) : [];
  const c = caps1 ? modelo.observacionesToken(caps1) : [];
  const obs1h = [...h];
  if (c.length && (!obs1h.length || c[c.length - 1][0] > obs1h[obs1h.length - 1][0])) obs1h.push(c[c.length - 1]);
  const obs5 = c.length ? [...h.filter(([ms]) => ms < c[0][0]), ...c] : [];
  if (obs5.length && h.length && h[h.length - 1][0] > obs5[obs5.length - 1][0]) obs5.push(h[h.length - 1]);
  return { obs5, obs1h };
}

export async function sembrar({ fetchImpl = fetch, esperar = dormir, ahora = Date.now, avisar = () => {}, pausaMs = PAUSA_MS } = {}) {
  const inicio = ahora();
  const pedir = url => pedirJSON(url, { fetchImpl, esperar, avisar });
  const diaria = modelo.validarSerie(await pedir(URL_DIARIA));
  await esperar(pausaMs);
  const lista = await pedir(modelo.SERIE.apiMercados);
  const { mayores } = modelo.elegirMayores(lista, MAYORES);
  const valorHoy = new Map((Array.isArray(lista) ? lista : []).filter(t => t && typeof t.id === 'string').map(t => [t.id, t.market_cap]));
  const ids = [...new Set([...diaria.tokens, ...mayores.map(t => t.id)])];
  const lineas = [], fallos = [];
  let hasta = 0;
  for (const id of ids) {
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(id)) throw new Error('id no válido: ' + id);
    const caps = {};
    for (const clave of ['1h', '5m']) {
      if (ahora() - inicio > PLAZO_MS) throw new Error('se acabó el tiempo de la siembra');
      await esperar(pausaMs);
      try {
        const d = await pedir(modelo.urlHistoriaFina(id, clave));
        caps[clave] = d && typeof d === 'object' ? d.market_caps : null;
        if (!caps[clave] || !modelo.observacionesToken(caps[clave]).length) throw new Error('sin datos de valor de mercado');
      } catch (e) {
        caps[clave] = null;
        avisar(`· ${id} (${clave}): no se pudo leer (${e.message})`);
      }
    }
    let { obs5, obs1h } = observacionesSiembra(caps['1h'], caps['5m']);
    if (!obs5.length && !obs1h.length) {
      const v = valorHoy.get(id);
      if (!(typeof v === 'number' && v > 0 && v < 1e14)) { fallos.push(id); avisar(`· ${id}: sin ningún dato; no se siembra`); continue; }
      obs5 = [[ahora(), v]]; obs1h = [[ahora(), v]];
      fallos.push(id);
    }
    const primerDato = (obs1h[0] || obs5[0])[0];
    const primera = primerDato > ahora() - 30 * 86400000 ? new Date(primerDato).toISOString().slice(0, 10) : null;
    for (const o of [obs5, obs1h]) if (o.length) hasta = Math.max(hasta, o[o.length - 1][0]);
    const json = JSON.stringify({ id, primera, obs5, obs1h });
    if (json.includes('$')) throw new Error('el JSON de la siembra no puede llevar $');
    lineas.push(`select rwadar_mercado.sembrar($siembra$${json}$siembra$::jsonb);`);
  }
  if (!hasta) throw new Error('ningún token con datos');
  const iso = ms => new Date(ms).toISOString();
  lineas.push(`select rwadar_mercado.cerrar_siembra($siembra$${JSON.stringify(diaria.tokens)}$siembra$::jsonb, '${diaria.generado}'::timestamptz, '${iso(Math.min(hasta, ahora()))}'::timestamptz);`);
  return { sql: lineas.join('\n') + '\n', tokens: ids.length, fallos, hasta: iso(hasta), diaria: diaria.generado };
}

export async function principal({ fetchImpl, esperar, ahora, pausaMs, salida = t => process.stdout.write(t), error = m => process.stderr.write(m + '\n'), entorno = process.env } = {}) {
  if (entorno.NODE_TLS_REJECT_UNAUTHORIZED === '0') { error('NODE_TLS_REJECT_UNAUTHORIZED=0 desactiva TLS: no se lee CoinGecko así.'); return 1; }
  try {
    const r = await sembrar({ fetchImpl, esperar, ahora, pausaMs, avisar: error });
    salida(r.sql);
    error(`Siembra: ${r.tokens} tokens (${r.fallos.length} sin historia${r.fallos.length ? ': ' + r.fallos.join(', ') : ''}); historia hasta ${r.hasta}; diaria de ${r.diaria}.`);
    return 0;
  } catch (e) {
    error(`No se pudo sembrar: ${e.message}. No se escribe nada.`);
    return 3;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await principal();
}
