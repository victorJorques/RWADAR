// Máquina del tiempo de «BTC en papel». Antes de arriesgar (aunque sea en
// papel) responde a «¿qué suele pasar con esta operación?» de dos maneras:
// - simular(): rehace las próximas horas miles de veces con velas reales de
//   5 minutos del pasado, tomadas de la misma franja horaria UTC.
// - historico(): repite una regla en el pasado real, vela a vela, sin dejarla
//   mirar al futuro.
// Todo es papel: aquí no se opera ni se pide nada a ningún exchange.
import { INTERVALOS, msIntervalo, prng, fmtHora, fmtPct } from './comun.mjs';
import { agregar, ordenarUnicas } from './datos.mjs';

const M5 = INTERVALOS['5m'];
const HORA = INTERVALOS['1h'];
const DIA = INTERVALOS['1d'];
const FRANJAS = DIA / M5; // 288 franjas de 5 minutos en un día UTC

/** Costes si no se pasan (los mismos que config.ejemplo.json): mejor neto que bruto. */
export const COSTES_POR_DEFECTO = Object.freeze({ comision_pct: 0.25, deslizamiento_pct: 0.05 });

/** Valores por defecto de la simulación (los mismos que config.maquina). */
export const MAQUINA_POR_DEFECTO = Object.freeze({
  simulaciones: 10_000, semilla: 19, dias: 60, horas: 24, franjas_vecinas: 1, ajuste_volatilidad: true,
});

const K_MIN = 0.5;
const K_MAX = 2.5;
const TRAMOS = 20;
const MAX_HORAS = 24 * 30;
const MAX_SIMULACIONES = 1_000_000;
const MIN_VELAS_24H = 72; // 6 h de velas: con menos, la volatilidad «reciente» es ruido
const COMPROBACIONES_CAUSALIDAD = 5;

// ---------------------------------------------------------------- utilidades

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const red = (x, d = 4) => {
  if (!esNum(x)) return null;
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return Object.is(r, -0) ? 0 : r;
};
const formateadores = new Map();
/** 10000 → '10.000'; 1.3245 → '1,32' (punto de miles siempre, como en comun.mjs). */
function fmtNum(x, dec = 0) {
  if (!esNum(x)) return '—';
  const clave = String(dec);
  if (!formateadores.has(clave)) {
    formateadores.set(clave, new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: 'always',
    }));
  }
  return formateadores.get(clave).format(x);
}
const precioTxt = x => fmtNum(x, 2);
/** '16/09/2026 05:00 en Madrid, 03:00 UTC' (sin paréntesis dentro de paréntesis en los mensajes). */
const fechaTxt = t => fmtHora(t, { utc: true }).replace(/ \((\d\d:\d\d) UTC\)$/, ' en Madrid, $1 UTC');
const texto = x => (x === undefined ? 'nada' : typeof x === 'number' && !Number.isFinite(x) ? String(x) : JSON.stringify(x) ?? String(x));

/** Vela utilizable: números finitos, precios > 0 y l ≤ o,c ≤ h. */
function velaValida(v) {
  return v != null && typeof v === 'object'
    && esNum(v.t) && esNum(v.o) && esNum(v.h) && esNum(v.l) && esNum(v.c)
    && v.o > 0 && v.l > 0 && v.l <= Math.min(v.o, v.c) && v.h >= Math.max(v.o, v.c);
}

/** Acepta una lista de velas o una Serie de lib/datos.mjs (de la Serie, solo las cerradas). */
function extraer(entrada, que) {
  if (Array.isArray(entrada)) return { lista: entrada, intervalo: null };
  if (entrada && typeof entrada === 'object' && Array.isArray(entrada.velas)) {
    const fin = Number.isInteger(entrada.ultimaCerrada) ? entrada.ultimaCerrada + 1 : entrada.velas.length;
    return { lista: entrada.velas.slice(0, Math.max(0, fin)), intervalo: typeof entrada.intervalo === 'string' ? entrada.intervalo : null };
  }
  if (entrada == null) throw new Error(`${que}: faltan las velas (una lista de { t, o, h, l, c, v } o una serie de lib/datos.mjs).`);
  throw new Error(`${que}: las velas deben ser una lista de { t, o, h, l, c, v } o una serie de lib/datos.mjs (llegó ${typeof entrada}).`);
}

/** Quita velas rotas y las ordena sin duplicados. */
function limpiar(lista) {
  const validas = lista.filter(velaValida);
  return { velas: ordenarUnicas(validas), descartadas: lista.length - validas.length };
}

/** Intervalo de unas velas: la menor distancia entre dos seguidas (null si hay menos de dos). */
function deducirMs(velas) {
  let minimo = Infinity;
  for (let i = 1; i < velas.length; i++) {
    const d = velas[i].t - velas[i - 1].t;
    if (d > 0 && d < minimo) minimo = d;
  }
  return Number.isFinite(minimo) ? minimo : null;
}

const nombreIntervalo = ms => Object.keys(INTERVALOS).find(k => INTERVALOS[k] === ms) ?? `${fmtNum(ms / 60_000, 1)} min`;

function aMs(x, que) {
  const ms = x instanceof Date ? x.getTime() : typeof x === 'string' ? Date.parse(x) : x;
  if (!esNum(ms)) throw new Error(`${que} no es una fecha válida (llegó ${String(x)}).`);
  return ms;
}

function entero(x, que, minimo, maximo) {
  if (!Number.isInteger(x) || x < minimo || x > maximo) {
    throw new Error(`${que} debe ser un número entero entre ${fmtNum(minimo)} y ${fmtNum(maximo)} (llegó ${String(x)}).`);
  }
  return x;
}

function leerCostes(costes, que) {
  const c = costes ?? COSTES_POR_DEFECTO;
  if (typeof c !== 'object') throw new Error(`${que}: «costes» debe ser { comision_pct, deslizamiento_pct } (llegó ${String(costes)}).`);
  const comision = c.comision_pct ?? COSTES_POR_DEFECTO.comision_pct;
  const deslizamiento = c.deslizamiento_pct ?? COSTES_POR_DEFECTO.deslizamiento_pct;
  for (const [nombre, valor] of [['comision_pct', comision], ['deslizamiento_pct', deslizamiento]]) {
    if (!esNum(valor) || valor < 0 || valor >= 50) {
      throw new Error(`${que}: costes.${nombre} debe ser un porcentaje entre 0 y 50 (llegó ${String(valor)}).`);
    }
  }
  return { comision_pct: comision, deslizamiento_pct: deslizamiento, c: comision / 100, d: deslizamiento / 100 };
}

/** larga si stop < entrada < objetivo; corta si objetivo < entrada < stop; si no, null. */
function direccionDe(entrada, stop, objetivo) {
  if (stop < entrada && entrada < objetivo) return 'larga';
  if (objetivo < entrada && entrada < stop) return 'corta';
  return null;
}

/**
 * Beneficio neto por BTC: comisión en la entrada y en la salida.
 * `pe` y `px` ya llevan el deslizamiento (entrada siempre en contra; salida
 * en contra salvo en el objetivo, que es una orden limitada).
 */
function beneficio(direccion, pe, px, c) {
  const bruto = direccion === 'larga' ? px - pe : pe - px;
  return bruto - c * (pe + px);
}

const entradaConDeslizamiento = (direccion, precio, d) => (direccion === 'larga' ? precio * (1 + d) : precio * (1 - d));

function percentil(ordenados, q) {
  const n = ordenados.length;
  if (!n) return null;
  const pos = (n - 1) * q;
  const a = Math.floor(pos);
  const b = Math.min(n - 1, a + 1);
  return ordenados[a] + (ordenados[b] - ordenados[a]) * (pos - a);
}

/** Porcentajes con 2 decimales que suman 100 (reparto por mayores restos). */
function repartirPct(conteos) {
  const total = conteos.reduce((s, x) => s + x, 0);
  if (!total) return conteos.map(() => null);
  const base = 10_000; // centésimas de punto
  const exactos = conteos.map(x => (x * base) / total);
  const enteros = exactos.map(Math.floor);
  let falta = base - enteros.reduce((s, x) => s + x, 0);
  const orden = exactos.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; falta > 0; k++, falta--) enteros[orden[k % orden.length][1]]++;
  return enteros.map(x => x / 100);
}

function histograma(ordenados) {
  const n = ordenados.length;
  if (!n) return [];
  let desde = ordenados[0];
  let hasta = ordenados[n - 1];
  // Si todos los resultados son iguales, se abre un poco el rango para que haya tramos.
  if (hasta - desde < 1e-9) { desde -= 0.5; hasta += 0.5; }
  const ancho = (hasta - desde) / TRAMOS;
  const cuenta = new Array(TRAMOS).fill(0);
  for (let i = 0; i < n; i++) cuenta[Math.min(TRAMOS - 1, Math.max(0, Math.floor((ordenados[i] - desde) / ancho)))]++;
  return cuenta.map((x, k) => ({
    desde: red(desde + k * ancho),
    hasta: red(k === TRAMOS - 1 ? hasta : desde + (k + 1) * ancho),
    n: x,
  }));
}

/** Raíz de la media de log(c/o)²: lo que se mueve una vela de 5 minutos (en tanto por uno). */
function volatilidadDe(logC, desde, hasta) {
  let suma = 0;
  let n = 0;
  for (let i = desde; i < hasta; i++) { suma += logC[i] * logC[i]; n++; }
  return n ? Math.sqrt(suma / n) : null;
}

const franjaDe = t => Math.floor((((t % DIA) + DIA) % DIA) / M5);

/** Lo que pide config.json traducido a opciones de simular(). */
export function opcionesMaquina(config = {}) {
  const m = config?.maquina ?? {};
  return {
    simulaciones: m.simulaciones ?? MAQUINA_POR_DEFECTO.simulaciones,
    semilla: m.semilla ?? MAQUINA_POR_DEFECTO.semilla,
    dias: m.dias ?? MAQUINA_POR_DEFECTO.dias,
    horas: m.horas ?? MAQUINA_POR_DEFECTO.horas,
    franjas_vecinas: m.franjas_vecinas ?? MAQUINA_POR_DEFECTO.franjas_vecinas,
    ajuste_volatilidad: m.ajuste_volatilidad ?? MAQUINA_POR_DEFECTO.ajuste_volatilidad,
    costes: config?.costes ?? COSTES_POR_DEFECTO,
  };
}

// ---------------------------------------------------------------- simular

/**
 * Rehace las próximas `horas` muchas veces (10.000 por defecto). Cada vela
 * futura de 5 minutos se copia, en proporción (apertura→máximo, mínimo y
 * cierre), de una vela real de un día al azar de los últimos `dias`, de la
 * misma franja horaria UTC (± `franjas_vecinas` franjas de 5 minutos), y se
 * encadena al cierre anterior. Con `ajuste_volatilidad` (por defecto) esas
 * proporciones se multiplican por k = volatilidad de las últimas 24 h /
 * volatilidad de los `dias` (entre 0,5 y 2,5).
 *
 * Opciones: velas (5m, lista o Serie; 1m se agrega a 5m), inicio (ms; por
 * defecto el cierre de la última vela), entrada, stop, objetivo, horas (24),
 * simulaciones (10000), semilla (19), dias (60), franjas_vecinas (1),
 * ajuste_volatilidad (true), costes ({ comision_pct, deslizamiento_pct }).
 *
 * Entra a `entrada` con deslizamiento en contra. Si una vela toca stop y
 * objetivo, cuenta como stop. Sin tocar ninguno, se cierra al último cierre
 * (con deslizamiento) y cuenta como «abierta». Resultados en % neto de costes.
 */
export function simular(opciones = {}) {
  const o = opciones ?? {};
  const que = 'simular';
  const { lista, intervalo } = extraer(o.velas, que);
  const avisos = [];
  let { velas, descartadas } = limpiar(lista);
  if (descartadas) avisos.push(`Se han descartado ${fmtNum(descartadas)} velas rotas (números que faltan o que no cuadran).`);
  if (!velas.length) throw new Error(`${que}: no hay ninguna vela válida de 5 minutos con la que simular.`);

  const msLlegada = intervalo ? msIntervalo(intervalo) : (deducirMs(velas) ?? M5);
  if (msLlegada < M5 && M5 % msLlegada === 0) {
    velas = agregar(velas, M5);
    avisos.push(`Las velas llegaron de ${nombreIntervalo(msLlegada)} y se han juntado en velas de 5 minutos.`);
  } else if (msLlegada !== M5) {
    throw new Error(`${que}: la máquina del tiempo necesita velas de 5 minutos y llegaron de ${nombreIntervalo(msLlegada)}.`);
  }

  // Parámetros.
  const entrada = o.entrada;
  const stop = o.stop;
  const objetivo = o.objetivo;
  for (const [nombre, valor] of [['entrada', entrada], ['stop', stop], ['objetivo', objetivo]]) {
    if (!esNum(valor) || valor <= 0) throw new Error(`${que}: «${nombre}» debe ser un precio positivo (llegó ${String(valor)}).`);
  }
  const direccion = direccionDe(entrada, stop, objetivo);
  if (!direccion) {
    throw new Error(`${que}: el stop y el objetivo no cuadran con la entrada. Para comprar hace falta stop < entrada < objetivo ` +
      `(y al revés para vender en corto); llegó stop ${precioTxt(stop)}, entrada ${precioTxt(entrada)} y objetivo ${precioTxt(objetivo)}.`);
  }
  const horas = o.horas ?? MAQUINA_POR_DEFECTO.horas;
  if (!esNum(horas) || horas <= 0 || horas > MAX_HORAS) {
    throw new Error(`${que}: «horas» debe ser un número mayor que 0 y como mucho ${MAX_HORAS} (llegó ${String(horas)}).`);
  }
  const pasos = Math.max(1, Math.round((horas * HORA) / M5));
  const simulaciones = entero(o.simulaciones ?? MAQUINA_POR_DEFECTO.simulaciones, `${que}: «simulaciones»`, 1, MAX_SIMULACIONES);
  const semilla = o.semilla ?? MAQUINA_POR_DEFECTO.semilla;
  if (!esNum(semilla)) throw new Error(`${que}: la semilla debe ser un número (llegó ${String(semilla)}).`);
  const dias = entero(o.dias ?? MAQUINA_POR_DEFECTO.dias, `${que}: «dias»`, 1, 3650);
  const vecinas = entero(o.franjas_vecinas ?? MAQUINA_POR_DEFECTO.franjas_vecinas, `${que}: «franjas_vecinas»`, 0, FRANJAS / 2 - 1);
  const ajustar = o.ajuste_volatilidad ?? MAQUINA_POR_DEFECTO.ajuste_volatilidad;
  const costes = leerCostes(o.costes, que);
  const inicio = o.inicio == null ? velas.at(-1).t + M5 : aMs(o.inicio, `${que}: «inicio»`);

  // Solo velas cerradas antes del inicio y de los últimos `dias` días: nada del futuro.
  const desdeVentana = inicio - dias * DIA;
  const posteriores = velas.filter(v => v.t + M5 > inicio).length;
  if (posteriores) avisos.push(`Se han ignorado ${fmtNum(posteriores)} velas que cierran después del inicio (no se mira al futuro).`);
  const ventana = velas.filter(v => v.t >= desdeVentana && v.t + M5 <= inicio);
  if (ventana.length < FRANJAS) {
    throw new Error(`${que}: hacen falta al menos ${FRANJAS} velas de 5 minutos cerradas (un día entero) en los ${fmtNum(dias)} días ` +
      `anteriores al inicio (${fechaTxt(inicio)}); hay ${fmtNum(ventana.length)}.`);
  }
  const retraso = inicio - (ventana.at(-1).t + M5);
  if (retraso > HORA) avisos.push(`Las velas acaban ${fmtNum(retraso / HORA, 1)} h antes del inicio: la simulación no ve lo último que ha pasado.`);

  // Proporciones de cada vela (en logaritmos) y su franja.
  const n = ventana.length;
  const logH = new Float64Array(n);
  const logL = new Float64Array(n);
  const logC = new Float64Array(n);
  const diasVistos = new Set();
  const porFranja = Array.from({ length: FRANJAS }, () => []);
  let desde24 = n;
  for (let i = 0; i < n; i++) {
    const v = ventana[i];
    logH[i] = Math.log(v.h / v.o);
    logL[i] = Math.log(v.l / v.o);
    logC[i] = Math.log(v.c / v.o);
    // Días contados en bloques de 24 h hacia atrás desde el inicio: cada franja sale una vez por bloque.
    diasVistos.add(Math.floor((v.t - desdeVentana) / DIA));
    porFranja[franjaDe(v.t)].push(i);
    if (desde24 === n && v.t >= inicio - DIA) desde24 = i;
  }
  const dias_usados = diasVistos.size;
  if (dias_usados < 7) avisos.push(`Solo hay velas de ${fmtNum(dias_usados)} días: con tan pocos días la simulación dice poco.`);

  // Ajuste de volatilidad: que el futuro se mueva como las últimas 24 h, no como la media.
  const volVentana = volatilidadDe(logC, 0, n);
  const vol24 = volatilidadDe(logC, desde24, n);
  let k = 1;
  let kSinLimitar = null;
  if (ajustar) {
    if (n - desde24 < MIN_VELAS_24H) {
      avisos.push(`No hay velas suficientes de las últimas 24 h (${fmtNum(n - desde24)}) para ajustar la volatilidad: se usa la de los ${fmtNum(dias)} días tal cual.`);
    } else if (!(volVentana > 0)) {
      avisos.push('Las velas no se mueven nada (volatilidad cero): no se puede ajustar la volatilidad.');
    } else {
      kSinLimitar = vol24 / volVentana;
      k = red(Math.min(K_MAX, Math.max(K_MIN, kSinLimitar)), 4);
      if (kSinLimitar > K_MAX || kSinLimitar < K_MIN) {
        avisos.push(`La volatilidad de las últimas 24 h es ${fmtNum(kSinLimitar, 2)} veces la de los ${fmtNum(dias)} días; el ajuste se ha limitado a ${fmtNum(k, 2)}.`);
      }
    }
  }
  const eH = new Float64Array(n);
  const eL = new Float64Array(n);
  const eC = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    eH[i] = Math.exp(k * logH[i]);
    eL[i] = Math.exp(k * logL[i]);
    eC[i] = Math.exp(k * logC[i]);
  }

  // Bolsa de velas de cada franja (± vecinas, dando la vuelta a medianoche).
  // Si una franja se queda sin velas (huecos), se abre más hasta encontrar alguna.
  const bolsas = new Array(FRANJAS);
  let ensanchadas = 0;
  for (let f = 0; f < FRANJAS; f++) {
    let ancho = vecinas;
    let bolsa = [];
    for (; ancho < FRANJAS / 2; ancho++) {
      bolsa = [];
      for (let dx = -ancho; dx <= ancho; dx++) bolsa.push(...porFranja[(f + dx + FRANJAS) % FRANJAS]);
      if (bolsa.length) break;
    }
    if (ancho > vecinas) ensanchadas++;
    bolsas[f] = Int32Array.from(bolsa);
  }
  const bolsaPaso = Array.from({ length: pasos }, (_, p) => bolsas[franjaDe(inicio + p * M5)]);
  if (ensanchadas) avisos.push(`En ${fmtNum(ensanchadas)} franjas de 5 minutos no había velas y se tomaron de franjas más alejadas.`);

  // Simulación.
  const { c, d } = costes;
  const pe = entradaConDeslizamiento(direccion, entrada, d);
  const larga = direccion === 'larga';
  const resultados = new Float64Array(simulaciones);
  const pasosObjetivo = [];
  const pasosStop = [];
  let nObjetivo = 0;
  let nStop = 0;
  let sumaPnl = 0;
  const azar = prng(semilla);
  for (let s = 0; s < simulaciones; s++) {
    let p = entrada;
    let estado = 2; // 0 objetivo, 1 stop, 2 abierta
    let px = 0;
    let paso = 0;
    for (; paso < pasos; paso++) {
      const bolsa = bolsaPaso[paso];
      const j = bolsa[(azar() * bolsa.length) | 0];
      const alto = p * eH[j];
      const bajo = p * eL[j];
      // Primero el stop: si la misma vela toca los dos, cuenta como stop.
      if (larga) {
        if (bajo <= stop) { estado = 1; px = (p < stop ? p : stop) * (1 - d); break; }
        if (alto >= objetivo) { estado = 0; px = p > objetivo ? p : objetivo; break; }
      } else {
        if (alto >= stop) { estado = 1; px = (p > stop ? p : stop) * (1 + d); break; }
        if (bajo <= objetivo) { estado = 0; px = p < objetivo ? p : objetivo; break; }
      }
      p *= eC[j];
    }
    if (estado === 2) px = larga ? p * (1 - d) : p * (1 + d);
    else if (estado === 0) { nObjetivo++; pasosObjetivo.push(paso + 1); } else { nStop++; pasosStop.push(paso + 1); }
    const pnl = beneficio(direccion, pe, px, c);
    sumaPnl += pnl;
    resultados[s] = (pnl / pe) * 100;
  }

  const ordenados = Float64Array.from(resultados).sort();
  let suma = 0;
  for (let i = 0; i < simulaciones; i++) suma += resultados[i];
  const nAbierta = simulaciones - nObjetivo - nStop;
  const [objetivo_primero_pct, stop_primero_pct, abierta_pct] = repartirPct([nObjetivo, nStop, nAbierta]);
  const horasMedianas = lista => {
    if (!lista.length) return null;
    lista.sort((a, b) => a - b);
    return red((percentil(lista, 0.5) * M5) / HORA, 2);
  };
  const riesgo = Math.abs(pe - stop);
  const textoVecinas = vecinas ? ` (± ${fmtNum(vecinas * 5)} min)` : '';
  const textoAjuste = k !== 1
    ? `; las subidas y bajadas se han multiplicado por ${fmtNum(k, 2)} para que se muevan como en las últimas 24 h`
    : '';

  return {
    simulaciones,
    objetivo_primero_pct,
    stop_primero_pct,
    abierta_pct,
    conteo: { objetivo: nObjetivo, stop: nStop, abierta: nAbierta },
    resultado_pct: {
      mediana: red(percentil(ordenados, 0.5)),
      p5: red(percentil(ordenados, 0.05)),
      p25: red(percentil(ordenados, 0.25)),
      p75: red(percentil(ordenados, 0.75)),
      p95: red(percentil(ordenados, 0.95)),
      media: red(suma / simulaciones),
    },
    esperanza_R: red(sumaPnl / simulaciones / riesgo),
    histograma: histograma(ordenados),
    dias_usados,
    k_volatilidad: k,
    volatilidad: {
      ajuste: k !== 1,
      ultimas_24h_pct: red(vol24 === null ? null : vol24 * 100, 4),
      dias_pct: red(volVentana * 100, 4),
      k_sin_limitar: red(kSinLimitar, 4),
    },
    horas_medianas: { objetivo: horasMedianas(pasosObjetivo), stop: horasMedianas(pasosStop) },
    metodo: `Se han rehecho ${fmtNum(simulaciones)} veces las próximas ${fmtNum(horas, Number.isInteger(horas) ? 0 : 1)} h, vela a vela de 5 minutos, ` +
      `copiando en proporción velas reales de ${fmtNum(dias_usados)} días tomados al azar, siempre de la misma franja horaria UTC${textoVecinas}, ` +
      `y encadenando cada una al cierre de la anterior${textoAjuste}. Los resultados son netos de comisión (${fmtPct(costes.comision_pct)} por lado) ` +
      `y deslizamiento (${fmtPct(costes.deslizamiento_pct)}), y si una vela toca el stop y el objetivo cuenta como stop.`,
    direccion,
    inicio,
    horas,
    pasos,
    entrada,
    entrada_con_costes: red(pe, 2),
    stop,
    objetivo,
    semilla,
    dias,
    franjas_vecinas: vecinas,
    costes: { comision_pct: costes.comision_pct, deslizamiento_pct: costes.deslizamiento_pct },
    velas_usadas: n,
    avisos,
  };
}

// ---------------------------------------------------------------- histórico

const haySenal = s => s !== null && s !== undefined && s !== false;

/** Igualdad en profundidad con tolerancia mínima en los números (mismo cálculo, mismo resultado). */
function igual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const claves = x => Object.keys(x).filter(k => x[k] !== undefined && typeof x[k] !== 'function');
    const ka = claves(a);
    const kb = claves(b);
    return ka.length === kb.length && ka.every(k => Object.hasOwn(b, k) && igual(a[k], b[k]));
  }
  return false;
}

function describirSenal(s) {
  if (!haySenal(s)) return '«sin señal»';
  const t = texto(s);
  return `«${t.length > 100 ? `${t.slice(0, 100)}…` : t}»`;
}

/** Índice de la primera vela con t ≥ `t` (velas ordenadas). */
function primeraDesde(velas, t) {
  let a = 0;
  let b = velas.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if (velas[m].t < t) a = m + 1; else b = m;
  }
  return a;
}

/** Elige hasta `cuantos` elementos distintos al azar (Fisher-Yates parcial). */
function elegir(lista, cuantos, azar) {
  const copia = [...lista];
  const n = Math.min(cuantos, copia.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(azar() * (copia.length - i));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n).sort((x, y) => x - y);
}

/**
 * Plan por defecto: stop en `nivel_invalidacion` de la señal, objetivo a 2 R
 * y 24 h como mucho. Sin nivel de invalidación, no se opera.
 */
export function planPorDefecto(senal, _ctx, _i, precioEntrada, { rr = 2, horas = 24 } = {}) {
  const stop = senal?.nivel_invalidacion;
  if (!esNum(stop) || !esNum(precioEntrada)) return null;
  const riesgo = precioEntrada - stop;
  return { stop, objetivo: precioEntrada + rr * riesgo, horas };
}

/**
 * Sigue una operación vela a vela desde la vela j de `rv` hasta que toca
 * stop u objetivo o se acaban las `horas` (o los datos).
 */
function seguir({ rv, msR, j, direccion, pe, stop, objetivo, horas, d }) {
  const fin = rv[j].t + horas * HORA;
  const larga = direccion === 'larga';
  let ultima = j;
  for (let k = j; k < rv.length && rv[k].t < fin; k++) {
    const v = rv[k];
    ultima = k;
    // Primero el stop (misma vela = stop). Si la vela abre ya más allá, se sale a la apertura.
    if (larga) {
      if (v.l <= stop) return { resultado: 'stop', px: Math.min(stop, v.o) * (1 - d), k };
      if (v.h >= objetivo) return { resultado: 'objetivo', px: Math.max(objetivo, v.o), k };
    } else {
      if (v.h >= stop) return { resultado: 'stop', px: Math.max(stop, v.o) * (1 + d), k };
      if (v.l <= objetivo) return { resultado: 'objetivo', px: Math.min(objetivo, v.o), k };
    }
  }
  const v = rv[ultima];
  return {
    resultado: 'abierta',
    px: larga ? v.c * (1 - d) : v.c * (1 + d),
    k: ultima,
    sin_datos: v.t + msR < fin,
  };
}

/**
 * Repite una regla en el pasado real.
 *
 * - velas: las de la señal (lista o Serie; de la Serie, solo las cerradas).
 * - intervalo: el de esas velas (si no, se deduce).
 * - preparar(velas, intervalo) → ctx: se llama UNA vez con todas las velas
 *   (los indicadores son causales). Por defecto, { velas, intervalo }.
 * - detectar(ctx, i) → señal o null, usando solo las velas 0..i.
 * - plan(senal, ctx, i, precioEntrada) → { stop, objetivo, horas } o null
 *   para saltarla. Por defecto planPorDefecto (stop en nivel_invalidacion, 2 R, 24 h).
 * - resolver: velas con las que se sigue la operación (por defecto las mismas;
 *   p. ej. 5m para saber qué se tocó antes dentro de una vela de 1h).
 * - costes, dias (solo señales de los últimos `dias` días), horas (24, si el
 *   plan no las da), semilla (19) y verificarCausalidad (true).
 *
 * Cada señal entra a la apertura de la vela siguiente con deslizamiento y se
 * sigue hasta el stop, el objetivo o las `horas` (entonces se cierra al
 * último cierre y cuenta como «abierta»). Stop y objetivo en la misma vela =
 * stop. Una operación a la vez. Con verificarCausalidad, para hasta 5
 * señales (y 5 velas sin señal) al azar se vuelve a preparar con las velas
 * hasta esa vela y, si detectar no da lo mismo, se lanza un error.
 */
export function historico(opciones = {}) {
  const o = opciones ?? {};
  const que = 'historico';
  if (typeof o.detectar !== 'function') {
    throw new Error(`${que}: falta detectar(ctx, i), la regla que dice si hay señal en la vela i.`);
  }
  for (const nombre of ['preparar', 'plan']) {
    if (o[nombre] != null && typeof o[nombre] !== 'function') throw new Error(`${que}: «${nombre}» debe ser una función.`);
  }
  const { lista, intervalo: intervaloSerie } = extraer(o.velas, que);
  const avisos = [];
  const { velas, descartadas } = limpiar(lista);
  if (descartadas) avisos.push(`Se han descartado ${fmtNum(descartadas)} velas rotas (números que faltan o que no cuadran).`);
  const intervaloPedido = o.intervalo ?? intervaloSerie;
  const ms = intervaloPedido ? msIntervalo(intervaloPedido) : (deducirMs(velas) ?? HORA);
  const intervalo = intervaloPedido ?? nombreIntervalo(ms);
  const preparar = o.preparar ?? ((v, int) => ({ velas: v, intervalo: int }));
  const plan = o.plan ?? planPorDefecto;
  const costes = leerCostes(o.costes, que);
  const semilla = o.semilla ?? MAQUINA_POR_DEFECTO.semilla;
  if (!esNum(semilla)) throw new Error(`${que}: la semilla debe ser un número (llegó ${String(semilla)}).`);
  const horasDefecto = o.horas ?? 24;
  if (!esNum(horasDefecto) || horasDefecto <= 0) throw new Error(`${que}: «horas» debe ser un número mayor que 0 (llegó ${String(horasDefecto)}).`);
  const dias = o.dias ?? null;
  if (dias !== null && (!esNum(dias) || dias <= 0)) throw new Error(`${que}: «dias» debe ser un número de días mayor que 0 (llegó ${String(dias)}).`);
  const verificar = o.verificarCausalidad ?? true;

  let rv = velas;
  let msR = ms;
  if (o.resolver != null) {
    const r = extraer(o.resolver, `${que} (resolver)`);
    const limpias = limpiar(r.lista);
    rv = limpias.velas;
    if (limpias.descartadas) avisos.push(`Se han descartado ${fmtNum(limpias.descartadas)} velas rotas de las que resuelven las operaciones.`);
    msR = r.intervalo ? msIntervalo(r.intervalo) : (deducirMs(rv) ?? ms);
  }

  const descartes = { con_operacion_abierta: 0, sin_entrada: 0, plan_nulo: 0, plan_invalido: 0 };
  const operaciones = [];
  const vacio = mensaje => resumirHistorico({
    operaciones, descartes, detectadas: 0, intervalo, velas, costes, avisos: [...avisos, mensaje],
    verificacion: { hecha: false, comprobadas: [] }, desde: null,
  });
  if (!velas.length) return vacio('No hay velas con las que repetir la regla.');

  let ctx;
  try {
    ctx = preparar(velas, intervalo);
  } catch (e) {
    throw new Error(`${que}: preparar() falló con las ${fmtNum(velas.length)} velas: ${e?.message ?? e}`, { cause: e });
  }

  const tUltima = velas.at(-1).t;
  const iIni = dias === null ? 0 : primeraDesde(velas, tUltima + ms - dias * DIA);
  const conSenal = [];
  const sinSenal = [];
  const senales = new Map();
  let libreDesde = -Infinity; // hora a la que acaba la operación abierta
  const fecha = i => fechaTxt(velas[i].t);

  for (let i = iIni; i < velas.length; i++) {
    let s;
    try {
      s = o.detectar(ctx, i);
    } catch (e) {
      throw new Error(`${que}: detectar() falló en la vela ${i} (${fecha(i)}): ${e?.message ?? e}`, { cause: e });
    }
    if (!haySenal(s)) { sinSenal.push(i); continue; }
    conSenal.push(i);
    senales.set(i, s);
    const cierre = velas[i].t + ms;
    if (cierre < libreDesde) { descartes.con_operacion_abierta++; continue; }

    // Entrada a la apertura de la vela siguiente (sin huecos por medio).
    const j = primeraDesde(rv, cierre);
    if (j >= rv.length || rv[j].t >= cierre + ms) { descartes.sin_entrada++; continue; }
    const direccion = s?.direccion === 'corta' ? 'corta' : 'larga';
    const pe = entradaConDeslizamiento(direccion, rv[j].o, costes.d);
    let p;
    try {
      p = plan(s, ctx, i, pe);
    } catch (e) {
      throw new Error(`${que}: plan() falló en la vela ${i} (${fecha(i)}): ${e?.message ?? e}`, { cause: e });
    }
    if (p == null) { descartes.plan_nulo++; continue; }
    const horas = p.horas ?? horasDefecto;
    if (!esNum(p.stop) || !esNum(p.objetivo) || p.stop <= 0 || p.objetivo <= 0 || !esNum(horas) || horas <= 0
      || direccionDe(pe, p.stop, p.objetivo) !== direccion) {
      descartes.plan_invalido++;
      if (descartes.plan_invalido <= 3) {
        avisos.push(`Plan sin sentido en la vela ${i} (${fecha(i)}): entrada ${precioTxt(pe)}, stop ${precioTxt(p.stop)}, ` +
          `objetivo ${precioTxt(p.objetivo)}, ${texto(horas)} h; no se opera.`);
      }
      continue;
    }

    const r = seguir({ rv, msR, j, direccion, pe, stop: p.stop, objetivo: p.objetivo, horas, d: costes.d });
    const pnl = beneficio(direccion, pe, r.px, costes.c);
    const t_salida = rv[r.k].t + msR; // a más tardar, al cierre de la vela en la que sale
    operaciones.push({
      i_senal: i,
      t_senal: velas[i].t,
      t_entrada: rv[j].t,
      direccion,
      entrada: red(pe, 2),
      stop: p.stop,
      objetivo: p.objetivo,
      horas,
      salida: red(r.px, 2),
      t_salida,
      resultado: r.resultado,
      R: pnl / Math.abs(pe - p.stop),
      pct: (pnl / pe) * 100,
      ...(r.sin_datos ? { sin_datos: true } : {}),
    });
    libreDesde = t_salida;
  }

  // ¿La regla mira al futuro? Se repite con las velas cortadas en la vela de la señal.
  const verificacion = { hecha: false, comprobadas: [] };
  if (verificar) {
    const azar = prng(semilla);
    const muestra = [...elegir(conSenal, COMPROBACIONES_CAUSALIDAD, azar), ...elegir(sinSenal, COMPROBACIONES_CAUSALIDAD, azar)];
    for (const i of muestra) {
      const completa = senales.has(i) ? senales.get(i) : null;
      let ctxCorto;
      try {
        ctxCorto = preparar(velas.slice(0, i + 1), intervalo);
      } catch (e) {
        throw new Error(`${que}: preparar() falló con las velas hasta la vela ${i} (${fecha(i)}): ${e?.message ?? e}. ` +
          'Tiene que aguantar series cortas para poder comprobar que la regla no mira al futuro.', { cause: e });
      }
      let cortada;
      try {
        cortada = o.detectar(ctxCorto, i);
      } catch (e) {
        throw new Error(`${que}: la regla mira al futuro en la vela ${i} (${fecha(i)}): con toda la serie da ${describirSenal(completa)}, ` +
          `pero con las velas solo hasta esa vela falla (${e?.message ?? e}). Una señal en la vela i solo puede usar las velas 0..i.`, { cause: e });
      }
      const mismaSenal = haySenal(cortada) === haySenal(completa) && (!haySenal(completa) || igual(cortada, completa));
      if (!mismaSenal) {
        throw new Error(`${que}: la regla mira al futuro en la vela ${i} (${fecha(i)}): con las velas hasta esa vela da ${describirSenal(cortada)} ` +
          `y con toda la serie da ${describirSenal(completa)}. Una señal en la vela i solo puede usar las velas 0..i.`);
      }
      verificacion.comprobadas.push(i);
    }
    verificacion.hecha = true;
  }

  return resumirHistorico({
    operaciones, descartes, detectadas: conSenal.length, intervalo, velas, costes, avisos, verificacion,
    desde: iIni < velas.length ? velas[iIni].t : null,
  });
}

function resumirHistorico({ operaciones, descartes, detectadas, intervalo, velas, costes, avisos, verificacion, desde }) {
  const n = operaciones.length;
  const cuenta = tipo => operaciones.filter(x => x.resultado === tipo).length;
  const media = f => (n ? operaciones.reduce((s, x) => s + f(x), 0) / n : null);
  const objetivo = cuenta('objetivo');
  const stop = cuenta('stop');
  const abiertas = cuenta('abierta');
  const hasta = velas.length ? velas.at(-1).t : null;
  return {
    senales: n,
    objetivo,
    stop,
    abiertas,
    acierto_pct: n ? red((objetivo / n) * 100, 2) : null,
    ganadoras_pct: n ? red((operaciones.filter(x => x.pct > 0).length / n) * 100, 2) : null,
    esperanza_R: red(media(x => x.R)),
    resultado_medio_pct: red(media(x => x.pct)),
    R_total: n ? red(operaciones.reduce((s, x) => s + x.R, 0)) : null,
    detectadas,
    descartadas: descartes,
    metodo: `Se ha repetido la regla en ${fmtNum(velas.length)} velas de ${intervalo}` +
      (desde !== null ? ` (señales desde ${fmtHora(desde)} hasta ${fmtHora(hasta)})` : '') +
      ': cada señal entra a la apertura de la vela siguiente con deslizamiento y se sigue vela a vela hasta el stop, el objetivo o el límite de horas, ' +
      `una operación a la vez. Resultados netos de comisión (${fmtPct(costes.comision_pct)} por lado) y deslizamiento (${fmtPct(costes.deslizamiento_pct)}); ` +
      'si una vela toca el stop y el objetivo cuenta como stop.',
    intervalo,
    desde,
    hasta,
    costes: { comision_pct: costes.comision_pct, deslizamiento_pct: costes.deslizamiento_pct },
    verificacion,
    avisos,
    lista: operaciones.map(x => ({ ...x, R: red(x.R), pct: red(x.pct) })),
  };
}
