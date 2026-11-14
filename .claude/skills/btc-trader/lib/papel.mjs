// Bróker en papel de «BTC en papel»: una cartera de mentira en
// estado/papel.json para practicar sin dinero real. No habla con ningún
// exchange ni guarda claves. abrir/revisar/cerrar no tocan la cartera que
// reciben: devuelven una nueva, y solo guardarCartera escribe en disco.
import fs from 'node:fs';
import path from 'node:path';
import { diaMadrid, dirEstado, escribirEstado, fmtBtc, fmtDinero, fmtHora, fmtPct, leerEstado, msIntervalo, redondearAbajo } from './comun.mjs';
import { SATOSHI, fmtFrente, gananciaPorBtc, leerReglas, r2, riesgoPorBtc } from './presupuesto.mjs';

const ARCHIVO = 'papel';
const VERSION = 1;
const HORA_MS = 3_600_000;
// Por debajo de esto un número no es una hora en ms (sería antes de 1973).
const HORA_MINIMA_MS = 1e11;

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const llegó = x => (x === undefined ? 'nada' : typeof x === 'string' ? `«${x}»` : String(x));
const COSTES_DEFECTO = (() => {
  const r = leerReglas({});
  return { comision_pct: r.comision_pct, deslizamiento_pct: r.deslizamiento_pct };
})();

/** ms de una hora que llega como número, Date o texto ISO; null si no vale. */
function aMs(x) {
  if (x instanceof Date) return Number.isFinite(x.getTime()) ? x.getTime() : null;
  if (esNum(x)) return x;
  if (typeof x === 'string' && x.trim()) {
    const t = Date.parse(x);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

/** El precio llega como número o como lo que devuelve precio() de datos.mjs ({ precio, … }). */
function precioDe(precio) {
  const p = esObjeto(precio) ? precio.precio : precio;
  return esNum(p) && p > 0 ? p : null;
}

// ---------------------------------------------------------------- cartera

function carteraNueva(reglas, ahora) {
  return {
    version: VERSION,
    moneda: reglas.moneda,
    saldo_inicial: reglas.saldo_inicial,
    efectivo: reglas.saldo_inicial,
    posiciones: [],
    historial: [],
    creada: ahora,
    actualizada: ahora,
  };
}

function validarPosicion(p, k, que) {
  const nombre = esObjeto(p) && typeof p.id === 'string' && p.id ? `la posición «${p.id}»` : `la posición ${k + 1}`;
  if (!esObjeto(p)) throw new Error(`${que}: ${nombre} no es un objeto.`);
  if (typeof p.id !== 'string' || !p.id) throw new Error(`${que}: ${nombre} no trae id.`);
  const lado = p.lado ?? 'larga';
  if (lado !== 'larga' && lado !== 'corta') throw new Error(`${que}: ${nombre} tiene un lado raro (${llegó(p.lado)}); vale 'larga' o 'corta'.`);
  for (const campo of ['btc', 'precio_entrada', 'stop', 'objetivo']) {
    if (!(esNum(p[campo]) && p[campo] > 0)) throw new Error(`${que}: ${nombre} no trae ${campo} (un número positivo; llegó ${llegó(p[campo])}).`);
  }
  if (!esNum(p.abierta)) throw new Error(`${que}: ${nombre} no trae la hora de apertura (abierta, en ms).`);
  const costes = {
    comision_pct: esNum(p.costes?.comision_pct) && p.costes.comision_pct >= 0 ? p.costes.comision_pct : COSTES_DEFECTO.comision_pct,
    deslizamiento_pct: esNum(p.costes?.deslizamiento_pct) && p.costes.deslizamiento_pct >= 0 ? p.costes.deslizamiento_pct : COSTES_DEFECTO.deslizamiento_pct,
  };
  const nominal = esNum(p.nominal_entrada) ? p.nominal_entrada : r2(p.btc * p.precio_entrada);
  const comision = esNum(p.comision_entrada) ? p.comision_entrada : r2((costes.comision_pct / 100) * nominal);
  const pos = {
    ...p,
    lado,
    costes,
    nominal_entrada: nominal,
    comision_entrada: comision,
    coste: esNum(p.coste) ? p.coste : r2(nominal + comision),
    salida_por_tiempo: esNum(p.salida_por_tiempo) ? p.salida_por_tiempo : p.abierta + 24 * HORA_MS,
    revisada_hasta: esNum(p.revisada_hasta) ? p.revisada_hasta : p.abierta,
  };
  if (!esNum(pos.riesgo_inicial)) pos.riesgo_inicial = perdidaSiStop(pos);
  return pos;
}

/** Copia validada de la cartera (con los campos que falten rellenos). Lanza si no vale. */
function validarCartera(cartera, que = 'La cartera de papel') {
  if (!esObjeto(cartera)) throw new Error(`${que}: falta la cartera de papel (llegó ${llegó(cartera)}). Cárgala con cargarCartera(config).`);
  let c;
  try {
    c = structuredClone(cartera);
  } catch {
    throw new Error(`${que}: la cartera no es un objeto de datos (¿lleva funciones dentro?).`);
  }
  if (!esNum(c.efectivo)) throw new Error(`${que}: la cartera no trae un efectivo válido (llegó ${llegó(c.efectivo)}).`);
  if (!(esNum(c.saldo_inicial) && c.saldo_inicial > 0)) throw new Error(`${que}: la cartera no trae un saldo inicial válido (llegó ${llegó(c.saldo_inicial)}).`);
  c.moneda = typeof c.moneda === 'string' && c.moneda ? c.moneda : 'EUR';
  c.posiciones ??= [];
  c.historial ??= [];
  if (!Array.isArray(c.posiciones)) throw new Error(`${que}: «posiciones» debe ser una lista.`);
  if (!Array.isArray(c.historial)) throw new Error(`${que}: «historial» debe ser una lista.`);
  c.posiciones = c.posiciones.map((p, k) => validarPosicion(p, k, que));
  c.historial.forEach((h, k) => {
    if (!esObjeto(h) || !esNum(h.abierta) || !esNum(h.cerrada) || !esNum(h.pnl)) {
      throw new Error(`${que}: la operación ${k + 1} del historial no trae abierta, cerrada y pnl.`);
    }
  });
  return c;
}

/**
 * Lee estado/papel.json. Si no existe, devuelve una cartera nueva con
 * config.cuenta.saldo_inicial (sin escribirla: eso lo hace guardarCartera).
 * Si existe pero está rota, lanza un error (el dinero no se reinicia en silencio).
 */
export function cargarCartera(config, { ahora } = {}) {
  const reglas = leerReglas(config);
  const t = aMs(ahora) ?? Date.now();
  const ruta = path.join(dirEstado(), `${ARCHIVO}.json`);
  const existe = fs.existsSync(ruta);
  const leida = leerEstado(ARCHIVO, null);
  if (leida === null) {
    if (existe) {
      throw new Error(`La cartera de papel (${ruta}) está rota o vacía y no se puede leer; hay una copia en ${ARCHIVO}.roto.json. ` +
        `Arréglala, o bórrala para empezar de cero con ${fmtDinero(reglas.saldo_inicial, reglas.moneda)}.`);
    }
    return carteraNueva(reglas, t);
  }
  return validarCartera(leida, `La cartera de papel (${ruta})`);
}

/** Guarda la cartera en estado/papel.json de forma atómica (temporal + renombrar). Devuelve la ruta. */
export function guardarCartera(cartera) {
  const c = validarCartera(cartera, 'guardarCartera');
  return escribirEstado(ARCHIVO, c);
}

// ---------------------------------------------------------------- cuentas

const signo = pos => (pos.lado === 'corta' ? -1 : 1);

/** Precio de salida a mercado: el deslizamiento siempre va en contra. */
function salidaAMercado(pos, precio) {
  return r2(precio * (1 - signo(pos) * (pos.costes.deslizamiento_pct / 100)));
}

/**
 * Lo que vuelve al efectivo al cerrar a `precioSalida` (ya con deslizamiento)
 * y el pnl neto. En una larga se vende y se cobra; en un corto (sin
 * apalancamiento) se recupera la garantía ± lo que se haya movido el precio.
 */
function liquidar(pos, precioSalida) {
  const nominal = r2(pos.btc * precioSalida);
  const comision = r2((pos.costes.comision_pct / 100) * nominal);
  const bruto = signo(pos) === 1 ? nominal : r2(2 * pos.nominal_entrada - nominal);
  const ingreso = r2(bruto - comision);
  return { nominal, comision, ingreso, pnl: r2(ingreso - pos.coste) };
}

/** Lo que se perdería si salta el stop ahora mismo (0 si el stop ya asegura ganancia). */
function perdidaSiStop(pos) {
  return Math.max(0, r2(-liquidar(pos, salidaAMercado(pos, pos.stop)).pnl));
}

function cerrarCon(pos, { base, motivo, hora, detalle, limitada = false }) {
  // El objetivo es una orden limitada: sin deslizamiento. El resto, a mercado.
  const precioSalida = limitada ? r2(base) : salidaAMercado(pos, base);
  const l = liquidar(pos, precioSalida);
  const { revisada_hasta: _r, ultima_revision: _u, ...resto } = pos;
  return {
    ...resto,
    cerrada: hora,
    motivo,
    detalle,
    precio_salida: precioSalida,
    nominal_salida: l.nominal,
    comision_salida: l.comision,
    ingreso: l.ingreso,
    pnl: l.pnl,
    pnl_pct: pos.coste > 0 ? r2((l.pnl / pos.coste) * 100) : null,
    R: pos.riesgo_inicial > 0 ? r2(l.pnl / pos.riesgo_inicial) : null,
  };
}

// ---------------------------------------------------------------- órdenes

/** Orden validada { lado, btc, entrada, stop, objetivo, salida_por_tiempo? }. Lanza si no vale. */
function normalizarOrden(orden, que) {
  if (!esObjeto(orden)) throw new Error(`${que}: falta la orden ({ lado, btc, entrada, stop, objetivo }).`);
  const lado = orden.lado ?? orden.direccion ?? 'larga';
  if (lado !== 'larga' && lado !== 'corta') throw new Error(`${que}: el lado de la orden debe ser 'larga' o 'corta' (llegó ${llegó(lado)}).`);
  for (const campo of ['btc', 'entrada', 'stop', 'objetivo']) {
    if (!(esNum(orden[campo]) && orden[campo] > 0)) {
      throw new Error(`${que}: la orden no trae ${campo} (un número positivo; llegó ${llegó(orden[campo])}).`);
    }
  }
  const { btc, entrada, stop, objetivo } = orden;
  const enOrden = lado === 'larga' ? stop < entrada && entrada < objetivo : objetivo < entrada && entrada < stop;
  if (!enOrden) {
    throw new Error(lado === 'larga'
      ? `${que}: en una compra tiene que ser stop < entrada < objetivo (llegó stop ${stop}, entrada ${entrada}, objetivo ${objetivo}).`
      : `${que}: en un corto tiene que ser objetivo < entrada < stop (llegó objetivo ${objetivo}, entrada ${entrada}, stop ${stop}).`);
  }
  return { lado, btc, entrada, stop, objetivo, salida_por_tiempo: orden.salida_por_tiempo };
}

const casi = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

function mismaOrden(a, b) {
  if (!esObjeto(a) || !esObjeto(b)) return false;
  const lado = x => x.lado ?? x.direccion ?? 'larga';
  return lado(a) === lado(b) && ['btc', 'entrada', 'stop', 'objetivo'].every(k => esNum(a[k]) && esNum(b[k]) && casi(a[k], b[k]));
}

/**
 * Texto llano de la orden (4 líneas) con «EN PAPEL» bien visible: cuánto BTC,
 * cuánto dinero, stop, objetivo, lo que pierdes si salta el stop (con
 * comisiones y deslizamiento), lo que ganas si llega al objetivo y cuándo se
 * cierra sola. Las cifras son las mismas que dan dimensionar y comprobar.
 */
export function ticket(orden, config) {
  const reglas = leerReglas(config);
  const o = normalizarOrden(orden, 'ticket');
  const m = x => fmtDinero(x, reglas.moneda);
  const larga = o.lado === 'larga';
  const nominal = r2(o.btc * o.entrada);
  const costesEntrada = r2(o.btc * o.entrada * (reglas.c + reglas.d));
  const perdida = r2(o.btc * riesgoPorBtc(o.entrada, o.stop, reglas));
  const ganancia = r2(o.btc * gananciaPorBtc(o.entrada, o.objetivo, reglas));
  const hora = aMs(o.salida_por_tiempo);
  const lineas = [
    `EN PAPEL (sin dinero real) · ${larga ? 'COMPRA' : 'VENTA EN CORTO de'} ${fmtBtc(o.btc)} a ${m(o.entrada)}: ` +
      `${m(nominal)} más ${m(costesEntrada)} de comisión y deslizamiento.`,
    `Stop en ${m(o.stop)}: si salta, pierdes ${m(perdida)} con comisiones y deslizamiento.`,
    ganancia >= 0
      ? `Objetivo en ${m(o.objetivo)}: si llega, ganas ${m(ganancia)} ya descontados los costes.`
      : `Objetivo en ${m(o.objetivo)}: aun llegando, los costes se comen la ganancia y pierdes ${m(-ganancia)}.`,
    hora !== null && hora > HORA_MINIMA_MS
      ? `Si no toca ninguno, se cierra sola el ${fmtHora(hora, { utc: true })}.`
      : `Si no toca ninguno, se cierra sola ${new Intl.NumberFormat('es-ES').format(reglas.horas_max)} h después de abrirla.`,
  ];
  return lineas.join('\n');
}

function comprobarConfirmacion(confirmacion) {
  // NFC: «sí» escrito con la tilde aparte (i + ´) es la misma palabra.
  const texto = typeof confirmacion === 'string' ? confirmacion.normalize('NFC') : null;
  if (texto === 'sí' || texto === 'si') return;
  const vino = confirmacion === undefined || confirmacion === null || confirmacion === '' ? 'nada' : `«${String(confirmacion)}»`;
  throw new Error(`No se abre nada: para abrir en papel hay que confirmar escribiendo «sí» (en minúsculas y sin espacios), y llegó ${vino}. La cartera no se ha tocado.`);
}

function comprobarVeredicto(riesgo, orden) {
  if (!esObjeto(riesgo)) {
    throw new Error('No se abre nada: falta el resultado del gestor de riesgo (comprobar). La cartera no se ha tocado.');
  }
  if (riesgo.veredicto !== 'PASA') {
    const motivos = Array.isArray(riesgo.motivos) && riesgo.motivos.length ? `: ${riesgo.motivos.join(' ')}` : '.';
    throw new Error(`No se abre nada: el gestor de riesgo dice ${riesgo.veredicto ?? 'nada'}${motivos} La cartera no se ha tocado.`);
  }
  if (Array.isArray(riesgo.comprobaciones) && riesgo.comprobaciones.some(x => !esObjeto(x) || x.ok !== true)) {
    throw new Error('No se abre nada: el gestor de riesgo dice PASA pero alguna de sus comprobaciones falla. Vuelve a comprobar el riesgo. La cartera no se ha tocado.');
  }
  if (!esObjeto(orden)) throw new Error('No se abre nada: falta la orden ({ lado, btc, entrada, stop, objetivo }). La cartera no se ha tocado.');
  if (riesgo.orden !== undefined && !mismaOrden(riesgo.orden, orden)) {
    throw new Error('No se abre nada: el PASA del gestor de riesgo es de otra orden (cambió el lado, el BTC, la entrada, el stop o el objetivo). ' +
      'Vuelve a comprobar el riesgo con esta orden. La cartera no se ha tocado.');
  }
}

/** Siguiente id del día de Madrid: P-AAAAMMDD-n. */
function idNuevo(cartera, ahora) {
  const prefijo = `P-${diaMadrid(ahora).replaceAll('-', '')}-`;
  let n = 0;
  for (const x of [...cartera.posiciones, ...cartera.historial]) {
    if (typeof x?.id === 'string' && x.id.startsWith(prefijo)) {
      const k = Number(x.id.slice(prefijo.length));
      if (Number.isInteger(k) && k > n) n = k;
    }
  }
  return `${prefijo}${n + 1}`;
}

/**
 * abrir({ cartera, orden, riesgo, confirmacion, precio, ahora, config }) →
 * { cartera, posicion, ticket, texto, avisos }
 *
 * Exige confirmacion = 'sí' o 'si' (exactamente) y riesgo.veredicto = 'PASA'
 * para ESTA orden; si no, lanza un error y no toca nada. Llena a
 * precio·(1+d) (precio·(1−d) en cortos) y cobra la comisión sobre el
 * nominal. Si al precio de ahora el stop costaría más que el límite por
 * operación (o que lo que queda del día, riesgo.cifras.hueco_dia), o el
 * efectivo no llega, compra menos (en satoshis) y lo avisa: lo que pierdes de
 * verdad si salta el stop nunca pasa del límite. salida_por_tiempo: la de la orden (hora
 * en ms, como la da planSalida) o ahora + config.salida.horas_max.
 */
export function abrir({ cartera, orden, riesgo, confirmacion, precio, ahora, config } = {}) {
  // Confirmación y riesgo primero: sin ellos no se mira ni se toca nada más.
  comprobarConfirmacion(confirmacion);
  comprobarVeredicto(riesgo, orden);
  const reglas = leerReglas(config);
  if (!reglas.papel) throw new Error('No se abre nada: config.papel no está en true y este paquete solo opera en papel.');
  const base = validarCartera(cartera, 'abrir');
  const o = normalizarOrden(orden, 'abrir');
  const m = x => fmtDinero(x, base.moneda);
  if (o.lado === 'corta' && !reglas.cortos) throw new Error('No se abre nada: es un corto y los cortos están desactivados (riesgo.cortos = false).');
  const t = aMs(ahora) ?? Date.now();
  const p = precioDe(precio);
  if (p === null) throw new Error(`abrir: falta el precio de ahora (un número positivo; llegó ${llegó(esObjeto(precio) ? precio.precio : precio)}).`);

  const distancia = (Math.abs(p - o.entrada) / o.entrada) * 100;
  if (distancia > reglas.distancia_max_entrada_pct + 1e-9) {
    throw new Error(`No se abre nada: el precio de ahora (${m(p)}) está a un ${fmtFrente(distancia, reglas.distancia_max_entrada_pct, fmtPct)} de la entrada (${m(o.entrada)}), ` +
      `más del ${fmtPct(reglas.distancia_max_entrada_pct)} permitido. Recalcula el plan y vuelve a comprobar el riesgo.`);
  }
  const larga = o.lado === 'larga';
  if (larga ? p <= o.stop : p >= o.stop) throw new Error(`No se abre nada: el precio de ahora (${m(p)}) ya está en el stop (${m(o.stop)}) o más allá.`);
  if (larga ? p >= o.objetivo : p <= o.objetivo) throw new Error(`No se abre nada: el precio de ahora (${m(p)}) ya está en el objetivo (${m(o.objetivo)}) o más allá.`);

  let salidaPorTiempo = t + reglas.horas_max * HORA_MS;
  if (o.salida_por_tiempo !== undefined && o.salida_por_tiempo !== null) {
    const h = aMs(o.salida_por_tiempo);
    if (h === null || h < HORA_MINIMA_MS) throw new Error(`abrir: salida_por_tiempo debe ser una hora en ms (llegó ${llegó(o.salida_por_tiempo)}).`);
    if (h <= t) throw new Error(`No se abre nada: la hora de salida del plan (${fmtHora(h)}) ya ha pasado. Recalcula el plan.`);
    salidaPorTiempo = h;
  }

  const relleno = r2(larga ? p * (1 + reglas.d) : p * (1 - reglas.d));
  const costes = { comision_pct: reglas.comision_pct, deslizamiento_pct: reglas.deslizamiento_pct };
  // Lo que costaría comprar `btc` ahora y lo que se perdería de verdad si salta el stop.
  const tantear = btc => {
    const n = r2(btc * relleno);
    const pos = { lado: o.lado, btc, precio_entrada: relleno, stop: o.stop, nominal_entrada: n, coste: r2(n + r2(reglas.c * n)), costes };
    return { coste: pos.coste, perdida: perdidaSiStop(pos) };
  };
  // Lo más que se puede comprar, de `estimado` hacia abajo, sin que `pasa` deje de cumplirse
  // (los céntimos redondeados pueden pasarse por poco: se quita algún satoshi más).
  const reducir = (estimado, pasa) => {
    let b = redondearAbajo(Math.max(0, Math.min(estimado, btc)), SATOSHI);
    for (let k = 0; k < 20_000 && b > 0 && !pasa(b); k++) b = redondearAbajo(b - SATOSHI, SATOSHI);
    return b > 0 && b >= reglas.minimo_orden_btc ? b : 0;
  };
  const avisos = [];
  let btc = o.btc;

  // 1. Si el precio de ahora es peor que la entrada del plan, el stop cuesta más:
  //    se compra menos para no pasar del límite por operación ni de lo que queda del día.
  const hueco = esNum(riesgo.cifras?.hueco_dia) ? riesgo.cifras.hueco_dia : Infinity;
  const tope = Math.min(reglas.perdida_max_operacion, hueco);
  const perdidaPlan = tantear(btc).perdida;
  if (perdidaPlan > tope + 1e-9) {
    const pxStop = salidaAMercado({ lado: o.lado, costes: { deslizamiento_pct: reglas.deslizamiento_pct } }, o.stop);
    const porBtc = Math.abs(relleno - pxStop) + reglas.c * (relleno + pxStop);
    const cabe = reducir(tope / porBtc, b => tantear(b).perdida <= tope + 1e-9);
    const deQue = hueco < reglas.perdida_max_operacion ? `lo que te queda hoy (${m(tope)})` : `tu límite por operación (${m(tope)})`;
    if (!cabe) throw new Error(`No se abre nada: al precio de ahora (${m(p)}) el stop costaría ${m(perdidaPlan)}, más de ${deQue}, y no queda tamaño mínimo.`);
    avisos.push(`Al precio de ahora (${m(p)}) ${fmtBtc(btc)} perderían ${m(perdidaPlan)} si salta el stop, más de ${deQue}: se compran ${fmtBtc(cabe)}.`);
    btc = cabe;
  }
  // 2. Si al precio de ahora el efectivo no llega, se compra lo que cabe.
  const costePlan = tantear(btc).coste;
  if (costePlan > base.efectivo) {
    const cabe = reducir(base.efectivo / (relleno * (1 + reglas.c)), b => tantear(b).coste <= base.efectivo);
    if (!cabe) throw new Error(`No se abre nada: al precio de ahora la orden cuesta ${m(costePlan)} y solo tienes ${m(base.efectivo)} en efectivo.`);
    avisos.push(`Al precio de ahora ${fmtBtc(btc)} costaban ${m(costePlan)} y tienes ${m(base.efectivo)}: se compran ${fmtBtc(cabe)}.`);
    btc = cabe;
  }

  const nominal = r2(btc * relleno);
  const comision = r2(reglas.c * nominal);
  const posicion = {
    id: idNuevo(base, t),
    lado: o.lado,
    btc,
    entrada_plan: o.entrada,
    precio_mercado: p,
    precio_entrada: relleno,
    stop: o.stop,
    objetivo: o.objetivo,
    abierta: t,
    salida_por_tiempo: salidaPorTiempo,
    nominal_entrada: nominal,
    comision_entrada: comision,
    coste: r2(nominal + comision),
    costes: { comision_pct: reglas.comision_pct, deslizamiento_pct: reglas.deslizamiento_pct },
    revisada_hasta: t,
  };
  if (typeof orden.setup === 'string' && orden.setup) posicion.setup = orden.setup;
  if (typeof orden.nota === 'string' && orden.nota) posicion.nota = orden.nota;
  posicion.riesgo_inicial = perdidaSiStop(posicion);
  posicion.ganancia_si_objetivo = liquidar(posicion, posicion.objetivo).pnl;

  const nueva = {
    ...base,
    efectivo: r2(base.efectivo - posicion.coste),
    posiciones: [...base.posiciones, posicion],
    actualizada: t,
  };
  const texto = `${posicion.id} abierta EN PAPEL: ${larga ? 'compra' : 'venta en corto'} de ${fmtBtc(btc)} a ${m(relleno)} ` +
    `(con deslizamiento), ${m(posicion.coste)} con comisión. Stop ${m(posicion.stop)} (pierdes ${m(posicion.riesgo_inicial)}), ` +
    `objetivo ${m(posicion.objetivo)} (ganas ${m(posicion.ganancia_si_objetivo)}), se cierra sola el ${fmtHora(salidaPorTiempo, { utc: true })}. ` +
    `Te quedan ${m(nueva.efectivo)} en efectivo.`;
  return { cartera: nueva, posicion, ticket: ticket({ ...o, btc, salida_por_tiempo: salidaPorTiempo }, config), texto, avisos };
}

// ---------------------------------------------------------------- velas

/**
 * Velas limpias para revisar posiciones y alertas: acepta una lista o una
 * Serie, salta las que no son números, ordena, quita duplicados y marca cada
 * una con `fin` (hora en que cierra) y `cerrada`. El intervalo sale de
 * `intervalo`, de la serie o de la separación entre velas.
 * → { velas: [{ t, o, h, l, c, fin, cerrada }], ms, avisos }
 */
export function leerVelas(velas, { intervalo, ahora } = {}) {
  const t = aMs(ahora) ?? Date.now();
  const avisos = [];
  let lista = velas;
  let iv = intervalo;
  let tCerrada; // undefined: no se sabe; null: ninguna cerrada
  if (esObjeto(velas)) {
    lista = velas.velas;
    iv ??= velas.intervalo;
    if (Number.isInteger(velas.ultimaCerrada) && Array.isArray(lista)) {
      tCerrada = velas.ultimaCerrada >= 0 && esNum(lista[velas.ultimaCerrada]?.t) ? lista[velas.ultimaCerrada].t : null;
    }
  }
  lista ??= [];
  if (!Array.isArray(lista)) throw new Error(`Las velas deben ser una lista o una serie ({ velas: [...] }); llegó ${llegó(lista)}.`);
  const ms = iv ? msIntervalo(iv) : null;
  const porHora = new Map();
  let raras = 0;
  for (const v of lista) {
    if (!v || ![v.t, v.o, v.h, v.l, v.c].every(esNum) || v.h < v.l) {
      raras++;
      continue;
    }
    porHora.set(v.t, { t: v.t, o: v.o, h: v.h, l: v.l, c: v.c });
  }
  if (raras) avisos.push(`Se han saltado ${raras} ${raras === 1 ? 'vela' : 'velas'} con datos que no son números o con el máximo por debajo del mínimo.`);
  const ordenadas = [...porHora.values()].sort((a, b) => a.t - b.t);
  let paso = ms;
  if (!paso && ordenadas.length >= 2) {
    for (let k = 1; k < ordenadas.length; k++) {
      const dif = ordenadas[k].t - ordenadas[k - 1].t;
      if (dif > 0 && (!paso || dif < paso)) paso = dif;
    }
  }
  const salida = ordenadas.map((v, k) => {
    let cerrada;
    if (paso) cerrada = v.t + paso <= t;
    else if (tCerrada !== undefined) cerrada = tCerrada !== null && v.t <= tCerrada;
    else cerrada = k < ordenadas.length - 1; // la última puede seguir abierta
    // Sin intervalo, «fin» solo sirve para no volver a mirar esta vela.
    return { ...v, fin: paso ? v.t + paso : v.t + 1, cerrada };
  });
  return { velas: salida, ms: paso ?? null, avisos };
}

// ---------------------------------------------------------------- revisar

const COMO = { stop: 'cerrada por stop', objetivo: 'cerrada en el objetivo', tiempo: 'cerrada por la hora de salida', manual: 'cerrada a mano' };

/** ¿Toca la vela el stop o el objetivo? Stop primero: en la misma vela, cuenta el stop. */
function tocar(pos, v, m) {
  const hora = fmtHora(v.t);
  if (pos.lado !== 'corta') {
    if (v.o < pos.stop) return { motivo: 'stop', base: v.o, detalle: `La vela de las ${hora} abrió ya por debajo del stop (${m(v.o)} < ${m(pos.stop)}): se sale a esa apertura.` };
    if (v.l <= pos.stop) {
      const ambos = v.h >= pos.objetivo ? '; también tocó el objetivo, pero en la misma vela cuenta el stop (prudente)' : '';
      return { motivo: 'stop', base: pos.stop, detalle: `La vela de las ${hora} bajó hasta ${m(v.l)} y tocó el stop (${m(pos.stop)})${ambos}.` };
    }
    if (v.h >= pos.objetivo) {
      const arriba = v.o > pos.objetivo;
      return {
        motivo: 'objetivo', base: arriba ? v.o : pos.objetivo, limitada: true,
        detalle: arriba
          ? `La vela de las ${hora} abrió ya por encima del objetivo (${m(v.o)}): se vende a esa apertura.`
          : `La vela de las ${hora} subió hasta ${m(v.h)} y tocó el objetivo (${m(pos.objetivo)}).`,
      };
    }
    return null;
  }
  if (v.o > pos.stop) return { motivo: 'stop', base: v.o, detalle: `La vela de las ${hora} abrió ya por encima del stop (${m(v.o)} > ${m(pos.stop)}): se sale a esa apertura.` };
  if (v.h >= pos.stop) {
    const ambos = v.l <= pos.objetivo ? '; también tocó el objetivo, pero en la misma vela cuenta el stop (prudente)' : '';
    return { motivo: 'stop', base: pos.stop, detalle: `La vela de las ${hora} subió hasta ${m(v.h)} y tocó el stop (${m(pos.stop)})${ambos}.` };
  }
  if (v.l <= pos.objetivo) {
    const abajo = v.o < pos.objetivo;
    return {
      motivo: 'objetivo', base: abajo ? v.o : pos.objetivo, limitada: true,
      detalle: abajo
        ? `La vela de las ${hora} abrió ya por debajo del objetivo (${m(v.o)}): se recompra a esa apertura.`
        : `La vela de las ${hora} bajó hasta ${m(v.l)} y tocó el objetivo (${m(pos.objetivo)}).`,
    };
  }
  return null;
}

function revisarPosicion(pos, velas, precio, ahora, m, avisos) {
  const larga = pos.lado !== 'corta';
  let hasta = Math.max(pos.abierta, pos.revisada_hasta);
  let ultimaConocida = null;
  for (const v of velas) {
    if (v.t > ahora) break; // velas posteriores a «ahora»: no existen todavía
    ultimaConocida = v;
    // Solo velas que empiezan en o después de la apertura (la de la apertura
    // mezcla precios de antes) y después de lo ya revisado.
    if (v.t < hasta) continue;
    if (v.t >= pos.salida_por_tiempo) {
      return cerrarCon(pos, {
        base: v.o, motivo: 'tiempo', hora: v.t,
        detalle: `Pasó la hora de salida (${fmtHora(pos.salida_por_tiempo)}) sin tocar stop ni objetivo: se sale a la apertura de la vela de las ${fmtHora(v.t)} (${m(v.o)}).`,
      });
    }
    const toque = tocar(pos, v, m);
    if (toque) return cerrarCon(pos, { ...toque, hora: v.t });
    // Una vela a medias no cuenta como revisada: se volverá a mirar entera.
    if (v.cerrada) hasta = v.fin;
  }
  const sigue = { ...pos, revisada_hasta: hasta, ultima_revision: ahora };
  if (precio !== null && ahora >= pos.abierta) {
    // El precio de ahora es la última observación. Si ya está más allá del
    // stop no sabemos cuándo cruzó: se sale a este precio (prudente).
    if (larga ? precio <= pos.stop : precio >= pos.stop) {
      return cerrarCon(sigue, {
        base: precio, motivo: 'stop', hora: ahora,
        detalle: `El precio de ahora (${m(precio)}) ya está ${larga ? 'por debajo del' : 'por encima del'} stop (${m(pos.stop)}): se sale a este precio.`,
      });
    }
    if (larga ? precio >= pos.objetivo : precio <= pos.objetivo) {
      return cerrarCon(sigue, {
        base: pos.objetivo, motivo: 'objetivo', hora: ahora, limitada: true,
        detalle: `El precio de ahora (${m(precio)}) ya ha llegado al objetivo (${m(pos.objetivo)}).`,
      });
    }
  }
  if (ahora >= pos.salida_por_tiempo) {
    const base = precio ?? ultimaConocida?.c ?? null;
    if (base === null) {
      avisos.push(`${pos.id}: ya pasó su hora de salida (${fmtHora(pos.salida_por_tiempo)}) pero no hay precio para cerrarla; se cerrará en la próxima revisión.`);
    } else {
      return cerrarCon(sigue, {
        base, motivo: 'tiempo', hora: ahora,
        detalle: `Pasó la hora de salida (${fmtHora(pos.salida_por_tiempo)}) sin tocar stop ni objetivo: se sale al precio de ahora (${m(base)}).`,
      });
    }
  }
  return sigue;
}

function frasePnl(h, m) {
  const r = h.R === null ? '' : `, ${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(h.R)} R`;
  return `${h.id} ${COMO[h.motivo] ?? `cerrada (${h.motivo})`} a ${m(h.precio_salida)}: ${h.pnl >= 0 ? 'ganas' : 'pierdes'} ${m(Math.abs(h.pnl))} ` +
    `(${fmtPct(h.pnl_pct, 2, { signo: true })}${r}). ${h.detalle}`;
}

/**
 * revisar({ cartera, velas, precio, ahora, intervalo }) →
 * { cartera, cerradas, abiertas, avisos, texto }
 *
 * Para cada posición abierta mira, en orden, las velas que empiezan en o
 * después de la apertura y de la última revisión: si la vela abre ya más allá
 * del stop, sale a esa apertura (con deslizamiento); si el mínimo toca el
 * stop, al stop (con deslizamiento); si no, si el máximo toca el objetivo, al
 * objetivo (o a la apertura si abrió más allá). Stop y objetivo en la misma
 * vela = stop. Pasada salida_por_tiempo, sale al precio de ese momento.
 * Después mira el precio de ahora. Comisión a la salida. `velas` es una lista
 * o una Serie de datos.mjs; `precio`, un número o { precio }.
 */
export function revisar({ cartera, velas, precio, ahora, intervalo } = {}) {
  const base = validarCartera(cartera, 'revisar');
  const t = aMs(ahora) ?? Date.now();
  const m = x => fmtDinero(x, base.moneda);
  const { velas: lista, avisos } = leerVelas(velas, { intervalo, ahora: t });
  const p = precioDe(precio);
  const abiertas = [];
  const cerradas = [];
  let efectivo = base.efectivo;
  for (const pos of base.posiciones) {
    const r = revisarPosicion(pos, lista, p, t, m, avisos);
    if (esNum(r.cerrada)) {
      cerradas.push(r);
      efectivo = r2(efectivo + r.ingreso);
    } else {
      abiertas.push(r);
    }
  }
  const nueva = { ...base, efectivo, posiciones: abiertas, historial: [...base.historial, ...cerradas], actualizada: t };
  const texto = cerradas.length
    ? cerradas.map(h => frasePnl(h, m)).join('\n')
    : base.posiciones.length === 1
      ? 'La posición abierta no ha tocado stop, objetivo ni su hora de salida.'
      : base.posiciones.length
        ? `Ninguna de las ${base.posiciones.length} posiciones abiertas ha tocado stop, objetivo ni su hora de salida.`
        : 'No hay posiciones abiertas.';
  return { cartera: nueva, cerradas, abiertas: abiertas.map(x => x.id), avisos, texto };
}

/**
 * cerrar({ cartera, id, precio, motivo = 'manual', ahora }) → { cartera, cerrada, texto }
 * Cierra a mercado: precio con deslizamiento en contra y comisión.
 * (Los costes son los guardados en la posición al abrirla.)
 */
export function cerrar({ cartera, id, precio, motivo = 'manual', ahora } = {}) {
  const base = validarCartera(cartera, 'cerrar');
  const pos = base.posiciones.find(x => x.id === id);
  if (!pos) {
    const ids = base.posiciones.map(x => x.id).join(', ');
    throw new Error(`cerrar: no hay ninguna posición abierta con id ${llegó(id)}. ${ids ? `Abiertas: ${ids}.` : 'No hay posiciones abiertas.'}`);
  }
  const p = precioDe(precio);
  if (p === null) throw new Error(`cerrar: falta el precio de ahora (un número positivo; llegó ${llegó(esObjeto(precio) ? precio.precio : precio)}).`);
  const t = aMs(ahora) ?? Date.now();
  const m = x => fmtDinero(x, base.moneda);
  const razon = typeof motivo === 'string' && motivo.trim() ? motivo.trim() : 'manual';
  const cerrada = cerrarCon(pos, { base: p, motivo: razon, hora: t, detalle: `Cerrada ${razon === 'manual' ? 'a mano' : `(${razon})`} al precio de ahora (${m(p)}).` });
  const nueva = {
    ...base,
    efectivo: r2(base.efectivo + cerrada.ingreso),
    posiciones: base.posiciones.filter(x => x.id !== id),
    historial: [...base.historial, cerrada],
    actualizada: t,
  };
  return { cartera: nueva, cerrada, texto: frasePnl(cerrada, m) };
}

// ---------------------------------------------------------------- resumen

/**
 * resumenCartera(cartera, precio, ahora) → lo que pide el gestor de riesgo:
 * { efectivo, capital, pnl_hoy, operaciones_hoy, posiciones, dia, … }
 * - capital = efectivo + posiciones a `precio` (si no hay precio, al de entrada).
 * - pnl_hoy: pnl realizado de lo cerrado hoy; operaciones_hoy: posiciones
 *   abiertas hoy, sigan abiertas o no. «Hoy» es el día de Madrid de `ahora`.
 * - posiciones[].perdida_si_stop: lo que se perdería (neto) si salta su stop.
 */
export function resumenCartera(cartera, precio, ahora) {
  const c = validarCartera(cartera, 'resumenCartera');
  const t = aMs(ahora) ?? Date.now();
  const dia = diaMadrid(t);
  const p = precioDe(precio);
  const avisos = [];
  if (p === null && c.posiciones.length) avisos.push('Sin precio de ahora: las posiciones se valoran a su precio de entrada.');
  const posiciones = c.posiciones.map(pos => {
    const marca = p ?? pos.precio_entrada;
    const valor = r2(pos.nominal_entrada + signo(pos) * pos.btc * (marca - pos.precio_entrada));
    return {
      id: pos.id,
      lado: pos.lado,
      btc: pos.btc,
      precio_entrada: pos.precio_entrada,
      stop: pos.stop,
      objetivo: pos.objetivo,
      abierta: pos.abierta,
      salida_por_tiempo: pos.salida_por_tiempo,
      coste: pos.coste,
      valor,
      pnl_latente: r2(valor - pos.coste),
      perdida_si_stop: perdidaSiStop(pos),
      ganancia_si_objetivo: liquidar(pos, pos.objetivo).pnl,
    };
  });
  const valorPosiciones = r2(posiciones.reduce((s, x) => s + x.valor, 0));
  const capital = r2(c.efectivo + valorPosiciones);
  const cerradasHoy = c.historial.filter(h => diaMadrid(h.cerrada) === dia);
  const ganadas = c.historial.filter(h => h.pnl > 0).length;
  return {
    moneda: c.moneda,
    dia,
    hora: t,
    precio: p,
    saldo_inicial: c.saldo_inicial,
    efectivo: c.efectivo,
    valor_posiciones: valorPosiciones,
    capital,
    pnl_total: r2(capital - c.saldo_inicial),
    pnl_total_pct: r2(((capital - c.saldo_inicial) / c.saldo_inicial) * 100),
    pnl_hoy: r2(cerradasHoy.reduce((s, h) => s + h.pnl, 0)),
    cerradas_hoy: cerradasHoy.length,
    operaciones_hoy: [...c.posiciones, ...c.historial].filter(x => diaMadrid(x.abierta) === dia).length,
    perdida_abierta_si_stop: r2(posiciones.reduce((s, x) => s + x.perdida_si_stop, 0)),
    abiertas: posiciones.length,
    posiciones,
    operaciones_cerradas: c.historial.length,
    ganadas,
    acierto_pct: c.historial.length ? r2((ganadas / c.historial.length) * 100) : null,
    avisos,
  };
}

/** El resumen en unas líneas de texto llano. */
export function textoCartera(resumen) {
  if (!esObjeto(resumen) || !esNum(resumen.capital)) throw new Error('textoCartera: falta el resumen de la cartera (resumenCartera).');
  const m = x => fmtDinero(x, resumen.moneda ?? 'EUR');
  const lineas = [
    `Cartera EN PAPEL: ${m(resumen.capital)} (${m(resumen.efectivo)} en efectivo y ${m(resumen.valor_posiciones)} en BTC), ` +
      `${resumen.pnl_total >= 0 ? 'ganas' : 'pierdes'} ${m(Math.abs(resumen.pnl_total))} desde el inicio (${fmtPct(resumen.pnl_total_pct, 2, { signo: true })}).`,
    `Hoy (${resumen.dia}, Madrid): ${resumen.operaciones_hoy} ${resumen.operaciones_hoy === 1 ? 'operación abierta' : 'operaciones abiertas'}, ` +
      `resultado cerrado ${m(resumen.pnl_hoy)}.`,
  ];
  for (const x of resumen.posiciones ?? []) {
    lineas.push(`${x.id}: ${fmtBtc(x.btc)} desde ${m(x.precio_entrada)}, vale ${m(x.valor)} (${x.pnl_latente >= 0 ? '+' : '−'}${m(Math.abs(x.pnl_latente))}). ` +
      `Stop ${m(x.stop)} (pierdes ${m(x.perdida_si_stop)}), objetivo ${m(x.objetivo)}, se cierra sola el ${fmtHora(x.salida_por_tiempo)}.`);
  }
  if (!(resumen.posiciones ?? []).length) lineas.push('Sin posiciones abiertas.');
  return lineas.join('\n');
}
