// Gestor de presupuesto de «BTC en papel»: cuánto BTC comprar para que, si
// salta el stop, lo que pierdes (con comisiones y deslizamiento) no pase de
// tu límite. Solo calcula; no opera. Aquí viven también las cuentas de costes
// y la lectura de los límites de la config, que usan riesgo.mjs y papel.mjs,
// para que las tres piezas den siempre las mismas cifras.
import { fmtBtc, fmtDinero, fmtPct, redondearAbajo } from './comun.mjs';
import { PARES } from './datos.mjs';

/** Un satoshi: el paso mínimo de BTC. */
export const SATOSHI = 1e-8;

// Valores de partida (los de config.ejemplo.json) por si la config no los trae.
const DEFECTO = Object.freeze({
  saldo_inicial: 5000,
  perdida_max_operacion: 50,
  perdida_max_dia: 150,
  operaciones_max_dia: 3,
  rr_minimo: 1.5,
  posicion_max_pct: 50,
  apalancamiento: false,
  cortos: false,
  ventana_entrada_utc: null,
  bloqueo_noticias_min: 30,
  divergencia_max_pct: 0.5,
  distancia_max_entrada_pct: 0.6,
  comision_pct: 0.25,
  deslizamiento_pct: 0.05,
  minimo_orden_btc: 0.00001,
  horas_max: 24,
});

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const dado = (obj, clave, defecto) => (obj?.[clave] === undefined || obj?.[clave] === null ? defecto : obj[clave]);
const fmtNum = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 });
const llegó = x => (typeof x === 'string' ? `«${x}»` : String(x));

/**
 * Redondeo a céntimos, mitades hacia fuera. El empujoncito corrige que
 * 1,005 € se guarde en binario como 1,00499999… y acabe en 1,00.
 */
export function r2(x) {
  if (!esNum(x)) return NaN;
  const v = (x < 0 ? -1 : 1) * Math.round(Math.abs(x) * 100 + 1e-7) / 100;
  return Object.is(v, -0) ? 0 : v;
}

function numero(valor, nombre, { min = -Infinity, max = Infinity, minAbierto = false, entero = false } = {}) {
  const ok = esNum(valor) && (minAbierto ? valor > min : valor >= min) && valor <= max && (!entero || Number.isInteger(valor));
  if (!ok) {
    const rango = [
      min > -Infinity ? `${minAbierto ? 'mayor que' : '≥'} ${fmtNum.format(min)}` : null,
      max < Infinity ? `≤ ${fmtNum.format(max)}` : null,
    ].filter(Boolean).join(' y ');
    throw new Error(`${nombre} debe ser un número${entero ? ' entero' : ''}${rango ? ` ${rango}` : ''} (llegó ${llegó(valor)}).`);
  }
  return valor;
}

/**
 * Los límites y costes de la config, validados y con los valores de partida
 * donde falten. Lanza un error en castellano si alguno no tiene sentido.
 * `c` y `d` son comisión y deslizamiento en tanto por uno.
 */
export function leerReglas(config) {
  const cfg = esObjeto(config) ? config : {};
  const r = esObjeto(cfg.riesgo) ? cfg.riesgo : {};
  const costes = esObjeto(cfg.costes) ? cfg.costes : {};
  const par = typeof cfg.par === 'string' ? cfg.par : 'BTC-EUR';
  const reglas = {
    // Solo `true` de verdad vale: un "true" en texto o un 1 no activan el modo papel.
    papel: cfg.papel === true,
    par,
    moneda: PARES[par]?.moneda ?? 'EUR',
    saldo_inicial: numero(dado(cfg.cuenta, 'saldo_inicial', DEFECTO.saldo_inicial), 'config.cuenta.saldo_inicial', { min: 0, minAbierto: true }),
    perdida_max_operacion: numero(dado(r, 'perdida_max_operacion', DEFECTO.perdida_max_operacion), 'config.riesgo.perdida_max_operacion', { min: 0, minAbierto: true }),
    perdida_max_dia: numero(dado(r, 'perdida_max_dia', DEFECTO.perdida_max_dia), 'config.riesgo.perdida_max_dia', { min: 0, minAbierto: true }),
    operaciones_max_dia: numero(dado(r, 'operaciones_max_dia', DEFECTO.operaciones_max_dia), 'config.riesgo.operaciones_max_dia', { min: 0, entero: true }),
    rr_minimo: numero(dado(r, 'rr_minimo', DEFECTO.rr_minimo), 'config.riesgo.rr_minimo', { min: 0 }),
    // Sin apalancamiento no se puede meter más del 100 % del capital.
    posicion_max_pct: numero(dado(r, 'posicion_max_pct', DEFECTO.posicion_max_pct), 'config.riesgo.posicion_max_pct', { min: 0, minAbierto: true, max: 100 }),
    apalancamiento: dado(r, 'apalancamiento', DEFECTO.apalancamiento) === true,
    cortos: dado(r, 'cortos', DEFECTO.cortos) === true,
    // La ventana se valida en riesgo.mjs: si no se entiende, bloquea con su porqué.
    ventana_entrada_utc: dado(r, 'ventana_entrada_utc', DEFECTO.ventana_entrada_utc),
    bloqueo_noticias_min: numero(dado(r, 'bloqueo_noticias_min', DEFECTO.bloqueo_noticias_min), 'config.riesgo.bloqueo_noticias_min', { min: 0 }),
    divergencia_max_pct: numero(dado(r, 'divergencia_max_pct', DEFECTO.divergencia_max_pct), 'config.riesgo.divergencia_max_pct', { min: 0 }),
    distancia_max_entrada_pct: numero(dado(r, 'distancia_max_entrada_pct', DEFECTO.distancia_max_entrada_pct), 'config.riesgo.distancia_max_entrada_pct', { min: 0, minAbierto: true }),
    comision_pct: numero(dado(costes, 'comision_pct', DEFECTO.comision_pct), 'config.costes.comision_pct', { min: 0, max: 50 }),
    deslizamiento_pct: numero(dado(costes, 'deslizamiento_pct', DEFECTO.deslizamiento_pct), 'config.costes.deslizamiento_pct', { min: 0, max: 50 }),
    minimo_orden_btc: numero(dado(cfg, 'minimo_orden_btc', DEFECTO.minimo_orden_btc), 'config.minimo_orden_btc', { min: 0 }),
    horas_max: numero(dado(cfg.salida, 'horas_max', DEFECTO.horas_max), 'config.salida.horas_max', { min: 0, minAbierto: true }),
  };
  reglas.c = reglas.comision_pct / 100;
  reglas.d = reglas.deslizamiento_pct / 100;
  return reglas;
}

/**
 * Lo que se pierde por cada BTC si salta el stop, contando comisión y
 * deslizamiento de entrada y de salida:
 * (entrada − stop) + entrada·(c+d) + stop·(c+d). Vale para cortos (|entrada − stop|).
 */
export function riesgoPorBtc(entrada, stop, { c, d }) {
  return Math.abs(entrada - stop) + entrada * (c + d) + stop * (c + d);
}

/**
 * Lo que se gana por cada BTC si llega al objetivo, ya descontados los costes:
 * la entrada paga comisión y deslizamiento; la salida en el objetivo es una
 * orden limitada (sin deslizamiento) y solo paga comisión.
 */
export function gananciaPorBtc(entrada, objetivo, { c, d }) {
  return Math.abs(objetivo - entrada) - entrada * (c + d) - objetivo * c;
}

/**
 * Un número junto a su límite con los decimales justos para que se vean
 * distintos: 0,6047 frente a 0,6 no se enseña «0,60 % … el máximo es 0,60 %»
 * sino «0,605 %». `fmt(x, dec)` es el formateador (fmtPct, por ejemplo).
 */
export function fmtFrente(valor, limite, fmt, dec = 2) {
  let d = dec;
  while (d < 6 && valor !== limite && fmt(valor, d) === fmt(limite, d)) d++;
  return fmt(valor, d);
}

/** Lo que sale del efectivo al comprar `btc` a `entrada`, con comisión y deslizamiento. */
export function costeConCostes(btc, entrada, { c, d }) {
  return btc * entrada * (1 + c + d);
}

/** Efectivo y capital de la cuenta (o los de una cuenta recién abierta si no llega). */
function leerCuenta(cuenta, reglas) {
  if (cuenta === undefined || cuenta === null) {
    return { efectivo: reglas.saldo_inicial, capital: reglas.saldo_inicial, supuesta: true };
  }
  if (!esObjeto(cuenta)) throw new Error(`dimensionar: la cuenta debe ser el resumen de la cartera ({ efectivo, capital, … }); llegó ${llegó(cuenta)}.`);
  if (!esNum(cuenta.efectivo)) throw new Error(`dimensionar: la cuenta no trae un efectivo válido (llegó ${llegó(cuenta.efectivo)}).`);
  let capital = cuenta.capital;
  if (!esNum(capital)) {
    // Sin capital calculado: efectivo + lo que valgan las posiciones que traigan su valor.
    const valores = (Array.isArray(cuenta.posiciones) ? cuenta.posiciones : []).map(p => p?.valor).filter(esNum);
    capital = cuenta.efectivo + valores.reduce((s, x) => s + x, 0);
  }
  return { efectivo: cuenta.efectivo, capital, supuesta: false };
}

const ORDEN_LIMITES = ['perdida_max', 'posicion_max', 'efectivo'];

/**
 * dimensionar({ entrada, stop, config, cuenta, lado }) →
 * { btc, nominal, coste, riesgo, comisiones, deslizamiento, perdida_si_stop,
 *   riesgo_por_btc, pct_capital, limitado_por, motivo, lado, candidatos, limites }
 *
 * - btc: el mínimo de lo que permiten la pérdida máxima por operación, el
 *   tamaño máximo de la posición (% del capital) y el efectivo, redondeado
 *   hacia abajo a satoshis. Si queda por debajo de minimo_orden_btc → 0 y
 *   limitado_por 'minimo'.
 * - perdida_si_stop = btc · riesgo_por_btc: nunca pasa de perdida_max_operacion.
 * - riesgo (lo que se mueve el precio) + comisiones + deslizamiento = perdida_si_stop
 *   (salvo un céntimo de redondeo).
 * - Importes en céntimos; `cuenta` es el resumen de la cartera (efectivo y
 *   capital = efectivo + posiciones a precio actual). Sin cuenta, se supone
 *   una recién abierta con config.cuenta.saldo_inicial.
 */
export function dimensionar({ entrada, stop, config, cuenta, lado } = {}) {
  const reglas = leerReglas(config);
  if (!(esNum(entrada) && entrada > 0)) throw new Error(`dimensionar: la entrada debe ser un precio positivo (llegó ${llegó(entrada)}).`);
  if (!(esNum(stop) && stop > 0)) throw new Error(`dimensionar: el stop debe ser un precio positivo (llegó ${llegó(stop)}).`);
  if (stop === entrada) throw new Error(`dimensionar: el stop no puede estar en el mismo precio que la entrada (${fmtDinero(entrada, reglas.moneda)}).`);
  const ladoReal = stop < entrada ? 'larga' : 'corta';
  if (lado !== undefined && lado !== null && lado !== ladoReal) {
    if (lado !== 'larga' && lado !== 'corta') throw new Error(`dimensionar: el lado debe ser 'larga' o 'corta' (llegó ${llegó(lado)}).`);
    throw new Error(lado === 'larga'
      ? `dimensionar: en una compra el stop (${fmtDinero(stop, reglas.moneda)}) debe quedar por debajo de la entrada (${fmtDinero(entrada, reglas.moneda)}).`
      : `dimensionar: en un corto el stop (${fmtDinero(stop, reglas.moneda)}) debe quedar por encima de la entrada (${fmtDinero(entrada, reglas.moneda)}).`);
  }
  const { efectivo, capital, supuesta } = leerCuenta(cuenta, reglas);
  const m = x => fmtDinero(x, reglas.moneda);

  const rpb = riesgoPorBtc(entrada, stop, reglas);
  const precioConCostes = entrada * (1 + reglas.c + reglas.d);
  // El límite se cuenta en céntimos (hacia abajo): así la pérdida, ya
  // redondeada a céntimos, tampoco puede pasarse ni en lo que se enseña.
  const perdidaMax = Math.floor(reglas.perdida_max_operacion * 100 + 1e-7) / 100;
  const crudos = {
    perdida_max: perdidaMax / rpb,
    posicion_max: (reglas.posicion_max_pct / 100) * Math.max(0, capital) / precioConCostes,
    efectivo: Math.max(0, efectivo) / precioConCostes,
  };
  // En empate manda el primero de la lista (la pérdida es lo que más importa).
  let manda = ORDEN_LIMITES[0];
  for (const k of ORDEN_LIMITES) if (crudos[k] < crudos[manda]) manda = k;
  let btc = redondearAbajo(crudos[manda], SATOSHI);
  // redondearAbajo tolera 1e-9 satoshis de error binario; aquí no se tolera
  // pasarse del límite de pérdida ni un pelo más allá de eso.
  for (let k = 0; k < 5 && btc > 0 && btc * rpb > perdidaMax + 1e-9; k++) {
    btc = redondearAbajo(btc - SATOSHI, SATOSHI);
  }
  const btcPrevio = btc;
  let limitado = manda;
  if (btc < reglas.minimo_orden_btc || btc <= 0) {
    btc = 0;
    limitado = 'minimo';
  }

  const salida = {
    lado: ladoReal,
    btc,
    nominal: r2(btc * entrada),
    coste: r2(costeConCostes(btc, entrada, reglas)),
    riesgo: r2(btc * Math.abs(entrada - stop)),
    comisiones: r2(btc * (entrada + stop) * reglas.c),
    deslizamiento: r2(btc * (entrada + stop) * reglas.d),
    perdida_si_stop: r2(btc * rpb),
    riesgo_por_btc: r2(rpb),
    pct_capital: capital > 0 ? Math.round((costeConCostes(btc, entrada, reglas) / capital) * 10000) / 100 : null,
    limitado_por: limitado,
    motivo: '',
    candidatos: Object.fromEntries(ORDEN_LIMITES.map(k => [k, redondearAbajo(Math.max(0, crudos[k]), SATOSHI)])),
    limites: {
      perdida_max_operacion: reglas.perdida_max_operacion,
      posicion_max_pct: reglas.posicion_max_pct,
      posicion_max: r2((reglas.posicion_max_pct / 100) * capital),
      efectivo: r2(efectivo),
      capital: r2(capital),
      minimo_orden_btc: reglas.minimo_orden_btc,
    },
    cuenta_supuesta: supuesta,
  };

  const verbo = ladoReal === 'larga' ? 'Compra' : 'Vende en corto';
  const porque = {
    perdida_max: `tu pérdida máxima por operación (${m(reglas.perdida_max_operacion)})`,
    posicion_max: `el tamaño máximo de la posición (${fmtPct(reglas.posicion_max_pct, 0)} de tu capital de ${m(capital)}, es decir ${m(salida.limites.posicion_max)})`,
    efectivo: `el efectivo que tienes libre (${m(efectivo)}; sin apalancamiento no se compra más)`,
  };
  if (limitado === 'minimo') {
    salida.motivo = `No hay orden: ${porque[manda]} solo da para ${fmtBtc(btcPrevio)}, por debajo del mínimo de ${fmtBtc(reglas.minimo_orden_btc)}. ` +
      'Busca un stop más cercano o espera a tener más margen.';
  } else {
    salida.motivo = `${verbo} ${fmtBtc(btc)} a ${m(entrada)}: ${m(salida.nominal)} más ${m(r2(salida.coste - salida.nominal))} de comisión y deslizamiento. ` +
      `Manda ${porque[manda]}. Si salta el stop pierdes ${m(salida.perdida_si_stop)} con comisiones y deslizamiento ` +
      `(${m(salida.riesgo)} por el precio y ${m(r2(salida.comisiones + salida.deslizamiento))} de costes)` +
      (manda === 'perdida_max' ? '.' : `; tu límite por operación es ${m(reglas.perdida_max_operacion)}.`);
  }
  if (supuesta) salida.motivo += ` (Sin cuenta: se supone una recién abierta con ${m(reglas.saldo_inicial)}.)`;
  return salida;
}
