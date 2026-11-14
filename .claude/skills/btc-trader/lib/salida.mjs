// Plan de salida de «BTC en papel»: dónde poner el stop, el objetivo y la
// hora límite antes de entrar. Así la salida se decide en frío, no con la
// operación abierta. No opera.
import { fmtHora, fmtPct } from './comun.mjs';
import { PARES } from './datos.mjs';
import { precioTxt } from './escaner.mjs';

const HORA_MS = 3_600_000;
const esNum = x => typeof x === 'number' && Number.isFinite(x);
const r2 = x => (esNum(x) ? Math.round(x * 100) / 100 : null);
const formatoN = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const fmtN = x => (esNum(x) ? formatoN.format(x) : '—');

// Valores de partida (los de config.ejemplo.json) por si la config no los trae.
const DEFECTO = Object.freeze({ rr_objetivo: 2, stop_atr: 1.5, stop_max_atr: 3, horas_max: 24, stop_min_atr: 0.5 });
const COSTES = Object.freeze({ comision_pct: 0.25, deslizamiento_pct: 0.05 });

function leerConfig(config) {
  const cfg = config && typeof config === 'object' ? config : {};
  const propia = cfg.salida && typeof cfg.salida === 'object' ? cfg.salida : {};
  const c = { ...DEFECTO };
  for (const clave of Object.keys(DEFECTO)) if (propia[clave] !== undefined && propia[clave] !== null) c[clave] = propia[clave];
  for (const clave of ['rr_objetivo', 'stop_atr', 'stop_max_atr', 'horas_max']) {
    if (!(esNum(c[clave]) && c[clave] > 0)) {
      throw new Error(`config.salida.${clave} debe ser un número mayor que 0 (llegó ${String(c[clave])}).`);
    }
  }
  if (!(esNum(c.stop_min_atr) && c.stop_min_atr >= 0)) {
    throw new Error(`config.salida.stop_min_atr debe ser un número ≥ 0 (llegó ${String(c.stop_min_atr)}).`);
  }
  const costes = { ...COSTES };
  for (const clave of Object.keys(COSTES)) {
    const x = cfg.costes?.[clave];
    if (x === undefined || x === null) continue;
    if (!(esNum(x) && x >= 0)) throw new Error(`config.costes.${clave} debe ser un número ≥ 0 (llegó ${String(x)}).`);
    costes[clave] = x;
  }
  const rrMinimo = esNum(cfg.riesgo?.rr_minimo) ? cfg.riesgo.rr_minimo : null;
  return { ...c, costes, rrMinimo };
}

/**
 * planSalida({ setup, entrada, atr, ahora, config }) →
 * { entrada, stop, objetivo, rr, riesgo_por_btc, salida_por_tiempo, motivo, avisos, … }
 *
 * - `entrada`: el precio de entrada (número, o lo que devuelve vigilarEntrada
 *   con su `precio`); si falta, el nivel_entrada del setup.
 * - `atr`: el de la temporalidad del setup; si falta, setup.datos.atr.
 * - Stop: el de la estructura (nivel_invalidacion) o entrada − stop_atr·ATR,
 *   el más cercano a la entrada que no quede por encima de la estructura
 *   (en la práctica, la estructura). Dos excepciones: si la estructura está
 *   pegada a la entrada (< stop_min_atr ATR, 0,5 por defecto) se usa el de ATR,
 *   que queda por debajo de ella, para que el ruido no lo salte; y si no hay
 *   estructura válida, el de ATR. Si la estructura queda a más de
 *   stop_max_atr ATR, se avisa.
 * - Objetivo: entrada + rr_objetivo·(entrada − stop). En cortos, simétrico.
 * - salida_por_tiempo: hora (ms) a la que se sale si no ha tocado ninguno
 *   (ahora + horas_max).
 * - rr_neto: el R:R contando comisión y deslizamiento de entrada y salida.
 */
export function planSalida({ setup, entrada, atr, ahora, config } = {}) {
  const s = setup && typeof setup === 'object' ? setup : {};
  const cfg = leerConfig(config);
  const larga = s.direccion !== 'corta';
  const moneda = PARES[config?.par]?.moneda ?? 'EUR';
  const p = x => precioTxt(x, moneda);

  const precio = esNum(entrada) ? entrada
    : esNum(entrada?.precio) ? entrada.precio
      : esNum(s.nivel_entrada) ? s.nivel_entrada : null;
  if (!(esNum(precio) && precio > 0)) {
    throw new Error(`planSalida: falta el precio de entrada (un número positivo) y el setup no trae nivel_entrada (llegó ${String(entrada?.precio ?? entrada)}).`);
  }
  let momento = ahora instanceof Date ? ahora.getTime() : ahora;
  if (!esNum(momento)) momento = Date.now();

  const a = esNum(atr) && atr > 0 ? atr : esNum(s.datos?.atr) && s.datos.atr > 0 ? s.datos.atr : null;
  const estructura = esNum(s.nivel_invalidacion) ? s.nivel_invalidacion : null;
  const avisos = [];
  const distancia = x => (larga ? precio - x : x - precio); // > 0 si queda del lado bueno
  const stopAtr = a !== null ? (larga ? precio - cfg.stop_atr * a : precio + cfg.stop_atr * a) : null;
  const abajo = larga ? 'por debajo' : 'por encima';
  const arriba = larga ? 'por encima' : 'por debajo';

  let stop;
  let origen;
  let valido = true;
  if (estructura !== null && distancia(estructura) > 0) {
    if (a !== null && distancia(estructura) < cfg.stop_min_atr * a) {
      // El más lejano de los dos: así nunca queda por encima de la estructura.
      stop = larga ? Math.min(stopAtr, estructura) : Math.max(stopAtr, estructura);
      origen = stop === estructura ? 'estructura' : 'atr';
      avisos.push(`La invalidación del setup (${p(estructura)}) está pegada a la entrada (${fmtN(distancia(estructura) / a)} ATR): el stop se pone a ${fmtN(distancia(stop) / a)} ATR (${p(stop)}), ${abajo} de esa estructura, para que el ruido normal no lo salte.`);
    } else {
      stop = estructura;
      origen = 'estructura';
      if (a !== null && distancia(estructura) > cfg.stop_max_atr * a) {
        avisos.push(`El stop de la estructura queda a ${fmtN(distancia(estructura) / a)} ATR de la entrada, más de ${fmtN(cfg.stop_max_atr)}: el riesgo por BTC es grande y la posición tendrá que ser pequeña.`);
      }
    }
  } else if (stopAtr !== null) {
    stop = stopAtr;
    origen = 'atr';
    if (estructura !== null) {
      valido = false;
      avisos.push(`La entrada (${p(precio)}) ya está ${abajo} de la invalidación del setup (${p(estructura)}): la jugada no vale. El stop de ${fmtN(cfg.stop_atr)} ATR es solo de referencia.`);
    } else {
      avisos.push(`El setup no trae nivel de invalidación: el stop se pone a ${fmtN(cfg.stop_atr)} ATR de la entrada.`);
    }
  } else {
    throw new Error('planSalida: no se puede poner el stop: falta el ATR y el setup no trae una invalidación válida.');
  }
  if (a === null) avisos.push('Sin ATR no se ha podido comprobar si el stop está demasiado lejos o demasiado pegado.');

  stop = r2(stop);
  const riesgo = distancia(stop);
  if (!(riesgo > 0)) {
    throw new Error(`planSalida: el stop (${p(stop)}) no queda ${abajo} de la entrada (${p(precio)}).`);
  }
  const objetivo = r2(larga ? precio + cfg.rr_objetivo * riesgo : precio - cfg.rr_objetivo * riesgo);
  if (!(objetivo > 0)) {
    throw new Error(`planSalida: el objetivo sale negativo (${String(objetivo)}): el stop está demasiado lejos para un corto.`);
  }
  const recompensa = Math.abs(objetivo - precio);
  const rr = Math.round((recompensa / riesgo) * 100) / 100;

  // Costes de ida y vuelta (comisión + deslizamiento en cada lado).
  const tasa = (cfg.costes.comision_pct + cfg.costes.deslizamiento_pct) / 100;
  const costeStop = (precio + stop) * tasa;
  const costeObjetivo = (precio + objetivo) * tasa;
  const rrNeto = Math.round(((recompensa - costeObjetivo) / (riesgo + costeStop)) * 100) / 100;
  if (cfg.rrMinimo !== null && rrNeto < cfg.rrMinimo) {
    avisos.push(`Con comisión y deslizamiento (${fmtPct(tasa * 100, 2)} por lado), el R:R real baja a ${fmtN(rrNeto)}, por debajo del mínimo (${fmtN(cfg.rrMinimo)}): el gestor de riesgo puede pararla.`);
  }

  const salidaPorTiempo = momento + cfg.horas_max * HORA_MS;
  const deDonde = origen === 'estructura'
    ? 'donde la jugada deja de valer'
    : `a ${fmtN(cfg.stop_atr)} ATR de la entrada`;
  const enAtr = a !== null ? `, ${fmtN(riesgo / a)} ATR` : '';
  const motivo = `Entrada en ${p(precio)}. Stop en ${p(stop)} (${deDonde}${enAtr}): si llega ahí, se sale perdiendo ${p(riesgo)} por BTC. ` +
    `Objetivo en ${p(objetivo)} (${fmtN(cfg.rr_objetivo)} veces lo que se arriesga), ${fmtPct((recompensa / precio) * 100, 2)} ${arriba}. ` +
    `Si a las ${fmtHora(salidaPorTiempo)} no ha tocado ninguno, se sale a mercado.`;

  return {
    entrada: precio,
    stop,
    objetivo,
    rr,
    rr_neto: rrNeto,
    riesgo_por_btc: r2(riesgo),
    recompensa_por_btc: r2(recompensa),
    costes_por_btc: { si_stop: r2(costeStop), si_objetivo: r2(costeObjetivo) },
    stop_origen: origen,
    stop_en_atr: a !== null ? r2(riesgo / a) : null,
    atr: r2(a),
    direccion: larga ? 'larga' : 'corta',
    valido,
    salida_por_tiempo: salidaPorTiempo,
    horas_max: cfg.horas_max,
    motivo,
    avisos,
  };
}
