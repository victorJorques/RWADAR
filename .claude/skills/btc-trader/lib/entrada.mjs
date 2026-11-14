// Temporizador de entrada de «BTC en papel»: con un setup del escáner, mira
// las velas CERRADAS de la temporalidad corta (5 min por defecto) y dice si
// toca entrar ya, esperar, o si la jugada se ha estropeado. No opera.
import { INTERVALOS, fmtHora, fmtPct } from './comun.mjs';
import { PARES } from './datos.mjs';
import { atr as atrDe, volumenRel } from './indicadores.mjs';
import { precioTxt } from './escaner.mjs';

const HORA_MS = 3_600_000;
const esNum = x => typeof x === 'number' && Number.isFinite(x);
const velaOk = v => v != null && esNum(v.t) && esNum(v.h) && esNum(v.l) && esNum(v.c);
const r2 = x => (esNum(x) ? Math.round(x * 100) / 100 : null);

// Valores de partida (los de config.ejemplo.json) por si la config no los trae.
const DEFECTO = Object.freeze({ intervalo: '5m', volumen_minimo_rel: 1, persecucion_max_atr: 0.5, caduca_horas: 12 });

function leerConfig(config) {
  const propia = config && typeof config === 'object' && config.entrada && typeof config.entrada === 'object' ? config.entrada : {};
  const c = { ...DEFECTO };
  for (const clave of Object.keys(DEFECTO)) if (propia[clave] !== undefined && propia[clave] !== null) c[clave] = propia[clave];
  if (!INTERVALOS[c.intervalo]) {
    throw new Error(`config.entrada.intervalo no es un intervalo válido («${String(c.intervalo)}»). Los que hay: ${Object.keys(INTERVALOS).join(', ')}.`);
  }
  if (!(esNum(c.volumen_minimo_rel) && c.volumen_minimo_rel >= 0)) {
    throw new Error(`config.entrada.volumen_minimo_rel debe ser un número ≥ 0 (llegó ${String(c.volumen_minimo_rel)}).`);
  }
  if (!(esNum(c.persecucion_max_atr) && c.persecucion_max_atr > 0)) {
    throw new Error(`config.entrada.persecucion_max_atr debe ser un número mayor que 0 (llegó ${String(c.persecucion_max_atr)}).`);
  }
  if (!(esNum(c.caduca_horas) && c.caduca_horas > 0)) {
    throw new Error(`config.entrada.caduca_horas debe ser un número de horas mayor que 0 (llegó ${String(c.caduca_horas)}).`);
  }
  return c;
}

/**
 * vigilarEntrada({ setup, serie, ahora, config }) →
 * { estado: 'esperar'|'disparo'|'invalidado'|'caducado'|'demasiado_lejos', precio, motivo, vela_t, … }
 *
 * - Dispara cuando una vela CERRADA de la serie (config.entrada.intervalo)
 *   cierra por encima de nivel_entrada (por debajo en cortos) con volumen
 *   relativo ≥ volumen_minimo_rel y sin pasarse más de persecucion_max_atr
 *   ATR del nivel. El ATR es el del setup (su temporalidad); si no lo trae,
 *   el de la serie.
 * - Solo cuentan las velas que abren después de cerrar la vela del setup.
 * - Si una vela toca la invalidación antes (o a la vez que cierra arriba): invalidado.
 * - Sin disparo en caduca_horas desde la señal: caducado.
 * - Si disparó pero el precio ya se ha ido más allá del límite: demasiado_lejos.
 * `precio` es el cierre de la vela que decide (la del disparo, la de la
 * invalidación o la última cerrada); `precio_actual`, el de la última cerrada.
 */
export function vigilarEntrada({ setup, serie, ahora, config } = {}) {
  if (!setup || typeof setup !== 'object') {
    throw new Error('vigilarEntrada: falta el setup (uno de los que devuelve escanear).');
  }
  const nivel = setup.nivel_entrada;
  if (!(esNum(nivel) && nivel > 0)) {
    throw new Error(`vigilarEntrada: el setup no trae un nivel de entrada válido (llegó ${String(nivel)}).`);
  }
  const cfg = leerConfig(config);
  const larga = setup.direccion !== 'corta';
  const avisos = [];
  let momento = ahora instanceof Date ? ahora.getTime() : ahora;
  if (!esNum(momento)) momento = Date.now();
  const moneda = PARES[serie?.par]?.moneda ?? PARES[config?.par]?.moneda ?? 'EUR';
  const p = x => precioTxt(x, moneda);

  let inval = esNum(setup.nivel_invalidacion) ? setup.nivel_invalidacion : null;
  if (inval !== null && (larga ? inval >= nivel : inval <= nivel)) {
    avisos.push(`La invalidación del setup (${p(inval)}) no está ${larga ? 'por debajo' : 'por encima'} de la entrada (${p(nivel)}): no se tiene en cuenta.`);
    inval = null;
  }

  let intervalo = cfg.intervalo;
  if (serie && INTERVALOS[serie.intervalo]) {
    if (serie.intervalo !== cfg.intervalo) avisos.push(`La serie es de ${serie.intervalo} y la config pide ${cfg.intervalo}: se vigila con ${serie.intervalo}.`);
    intervalo = serie.intervalo;
  }
  const ms = INTERVALOS[intervalo];
  const todas = Array.isArray(serie?.velas) ? serie.velas : [];
  let ult = Number.isInteger(serie?.ultimaCerrada) ? Math.min(serie.ultimaCerrada, todas.length - 1) : todas.length - 1;
  while (ult >= 0 && !(esNum(todas[ult]?.t) && todas[ult].t + ms <= momento)) ult--;
  const cerradas = todas.slice(0, ult + 1);

  // Desde cuándo se vigila y hasta cuándo vale la señal.
  const msSetup = INTERVALOS[setup.intervalo] ?? 0;
  const inicio = esNum(setup.vela_t) ? setup.vela_t + msSetup : null;
  const caduca = inicio !== null ? inicio + cfg.caduca_horas * HORA_MS : null;
  if (inicio === null) avisos.push('El setup no dice de qué vela salió (vela_t): solo se mira la última vela cerrada y no puede caducar.');

  const atrSerie = atrDe(cerradas, 14);
  const atrSetup = esNum(setup.datos?.atr) && setup.datos.atr > 0 ? setup.datos.atr : null;
  const atrRef = atrSetup ?? [...atrSerie].reverse().find(esNum) ?? null;
  if (atrSetup === null) {
    avisos.push(atrRef === null
      ? 'No hay ATR (ni del setup ni de la serie): no se puede comprobar si el precio se ha ido demasiado lejos.'
      : `El setup no trae ATR: se usa el de las velas de ${intervalo}, que es más pequeño.`);
  }
  const limite = atrRef !== null ? cfg.persecucion_max_atr * atrRef : null;
  const vols = volumenRel(cerradas, 20);
  const exceso = c => (larga ? c - nivel : nivel - c);
  const lado = larga ? 'por encima' : 'por debajo';

  const base = {
    nivel_entrada: nivel,
    nivel_invalidacion: inval,
    direccion: larga ? 'larga' : 'corta',
    intervalo,
    atr: r2(atrRef),
    limite_persecucion: r2(limite),
    caduca_en: caduca,
    precio_actual: cerradas.length ? cerradas.at(-1).c : null,
    avisos,
  };

  if (!cerradas.length) {
    return { ...base, estado: 'esperar', precio: null, vela_t: null, vol_rel: null, hace_velas: null,
      motivo: `No hay velas cerradas de ${intervalo} para vigilar la entrada todavía.` };
  }

  let k0 = cerradas.length - 1;
  if (inicio !== null) {
    k0 = cerradas.findIndex(v => esNum(v?.t) && v.t >= inicio);
    if (k0 < 0) k0 = cerradas.length; // aún no ha cerrado ninguna vela desde la señal
  }

  let disparo = null;
  let intento = null; // el último cierre al otro lado que no valió (poco volumen o demasiado lejos)
  for (let k = k0; k < cerradas.length; k++) {
    const v = cerradas[k];
    if (!velaOk(v)) continue;
    if (!disparo && caduca !== null && v.t + ms > caduca) break;
    // Prudente: si en la misma vela toca la invalidación, cuenta como invalidada.
    if (inval !== null && (larga ? v.l <= inval : v.h >= inval)) {
      const motivo = disparo
        ? `Disparó a las ${fmtHora(disparo.v.t + ms)} (${p(disparo.v.c)}), pero después el precio llegó a ${p(larga ? v.l : v.h)} y tocó la invalidación (${p(inval)}): la jugada ya no vale.`
        : `Antes de entrar, el precio llegó a ${p(larga ? v.l : v.h)} y tocó la invalidación (${p(inval)}): la jugada ya no vale.`;
      return { ...base, estado: 'invalidado', precio: v.c, vela_t: v.t, vol_rel: r2(vols[k]), hace_velas: cerradas.length - 1 - k, motivo };
    }
    if (disparo) continue;
    if (exceso(v.c) > 0) {
      const vr = vols[k];
      const volOk = esNum(vr) && vr >= cfg.volumen_minimo_rel;
      const cerca = limite === null || exceso(v.c) <= limite;
      if (volOk && cerca) disparo = { k, v, vr };
      else intento = { k, v, vr, volOk, cerca };
    }
  }

  const ultima = cerradas.at(-1);
  if (disparo) {
    const { k, v, vr } = disparo;
    const hace = cerradas.length - 1 - k;
    const excesoAhora = exceso(ultima.c);
    if (limite !== null && excesoAhora > limite) {
      return { ...base, estado: 'demasiado_lejos', precio: ultima.c, vela_t: ultima.t, vol_rel: r2(vols.at(-1)), hace_velas: 0,
        motivo: `Disparó a las ${fmtHora(v.t + ms)} (${p(v.c)}), pero ahora el precio (${p(ultima.c)}) ya está a ${p(excesoAhora)} del nivel, más de ${fmtN(cfg.persecucion_max_atr)} ATR: no lo persigas; espera a que vuelva cerca de ${p(nivel)}.` };
    }
    const cuando = hace === 0 ? 'en la última vela cerrada' : `hace ${hace} ${hace === 1 ? 'vela' : 'velas'} de ${intervalo}`;
    return { ...base, estado: 'disparo', precio: v.c, vela_t: v.t, vol_rel: r2(vr), hace_velas: hace,
      motivo: `Una vela de ${intervalo} ha cerrado ${lado} de ${p(nivel)} (en ${p(v.c)}, ${cuando}) con ${fmtNVeces(vr)} el volumen normal y sin alejarse más de ${fmtN(cfg.persecucion_max_atr)} ATR: es el momento de entrar (en papel).` };
  }

  const comun = { precio: ultima.c, vela_t: ultima.t, vol_rel: r2(vols.at(-1)), hace_velas: 0 };
  if (caduca !== null && momento >= caduca) {
    return { ...base, ...comun, estado: 'caducado',
      motivo: `Han pasado ${fmtN(cfg.caduca_horas)} horas desde la señal (caducó el ${fmtHora(caduca)}) sin una vela que cierre ${lado} de ${p(nivel)} con volumen: la jugada ya no vale.` };
  }
  if (limite !== null && exceso(ultima.c) > limite) {
    return { ...base, ...comun, estado: 'demasiado_lejos',
      motivo: `El precio (${p(ultima.c)}) ya está a ${p(exceso(ultima.c))} ${lado} de la entrada (${p(nivel)}), más de ${fmtN(cfg.persecucion_max_atr)} ATR (${p(limite)}): no lo persigas; espera a que vuelva cerca.` };
  }
  let motivo;
  if (k0 >= cerradas.length) {
    motivo = `Todavía no ha cerrado ninguna vela de ${intervalo} desde la señal (${fmtHora(inicio)}). Esperando a que una cierre ${lado} de ${p(nivel)}.`;
  } else if (intento && intento.k === cerradas.length - 1 && !intento.volOk) {
    motivo = esNum(intento.vr)
      ? `La última vela de ${intervalo} cerró ${lado} de ${p(nivel)}, pero con poco volumen (${fmtNVeces(intento.vr)} lo normal; hace falta ${fmtN(cfg.volumen_minimo_rel)}): todavía no.`
      : `La última vela de ${intervalo} cerró ${lado} de ${p(nivel)}, pero no hay velas suficientes para medir el volumen (hacen falta 21): todavía no.`;
  } else {
    const falta = -exceso(ultima.c);
    motivo = falta >= 0
      ? `Esperando a que una vela de ${intervalo} cierre ${lado} de ${p(nivel)}: ahora está en ${p(ultima.c)}, a ${p(falta)} (${fmtPct((falta / nivel) * 100, 2)}).`
      : `El precio (${p(ultima.c)}) está ${lado} de ${p(nivel)}, pero aún no ha cerrado ninguna vela con volumen suficiente: esperando.`;
  }
  if (caduca !== null) motivo += ` La señal caduca el ${fmtHora(caduca)}.`;
  return { ...base, ...comun, estado: 'esperar', motivo };
}

const formatoN = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const fmtN = x => (esNum(x) ? formatoN.format(x) : '—');
const fmtNVeces = x => (esNum(x) ? `${formatoN.format(Math.round(x * 10) / 10)} veces` : '—');
