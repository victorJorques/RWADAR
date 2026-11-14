// Escáner de gráficos de «BTC en papel»: busca seis jugadas clásicas en velas
// CERRADAS (sin mirar al futuro), dice la tendencia de cada temporalidad y,
// si no hay jugada, qué niveles vigilar. No opera: solo describe.
import { INTERVALOS, msIntervalo, fmtDinero, fmtPct, fmtHora, mediana } from './comun.mjs';
import { PARES } from './datos.mjs';
import {
  ema, rsi as rsiDe, atr as atrDe, bollinger, donchian, vwapDiario, volumenRel,
  pivotes as pivotesDe, pivotesHasta, rangoApertura,
} from './indicadores.mjs';

const HORA_MS = 3_600_000;
// Volumen relativo mínimo para dar por buena una ruptura (las tres de rango).
const VOL_RUPTURA = 1.2;

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const velaOk = v => v != null && esNum(v.t) && Math.abs(v.t) < 8.64e15 && esNum(v.h) && esNum(v.l) && esNum(v.c);
const num = (arr, i) => (Array.isArray(arr) && Number.isInteger(i) && i >= 0 && esNum(arr[i]) ? arr[i] : null);
const r2 = x => (esNum(x) ? Math.round(x * 100) / 100 : null);
const r1 = x => (esNum(x) ? Math.round(x * 10) / 10 : null);
const limitar = x => (esNum(x) ? Math.max(0, Math.min(100, Math.round(x))) : 0);
const diaUtc = t => new Date(t).toISOString().slice(0, 10);

const formatoN = new Map();
/** 1.83 → '1,8' (sin miles: solo para cifras pequeñas). */
function fmtN(x, dec = 1) {
  if (!esNum(x)) return '—';
  if (!formatoN.has(dec)) formatoN.set(dec, new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec, minimumFractionDigits: 0 }));
  return formatoN.get(dec).format(x);
}

/** Precio en llano para los motivos: '61.400 €', '40 €', '42,50 €' (en BTC los céntimos no dicen nada). */
export function precioTxt(n, moneda = 'EUR') {
  if (!esNum(n)) return '—';
  // Por encima de 100, sin céntimos; por debajo, con ellos salvo que sean ,00.
  const texto = fmtDinero(Math.abs(n) >= 100 ? Math.round(n) : n, moneda);
  return texto.replace(/,00(?=\s)/, '');
}

function fraseVolumen(vr) {
  if (!esNum(vr)) return 'sin dato de volumen';
  if (vr >= 1.85 && vr < 2.25) return 'con el doble de volumen de lo normal';
  if (vr >= 2.75 && vr < 3.25) return 'con el triple de volumen de lo normal';
  if (vr >= 1.1) return `con ${fmtN(vr, 1)} veces el volumen normal`;
  if (vr >= 0.9) return 'con un volumen normal';
  return `con poco volumen (${fmtN(vr, 1)} veces lo normal)`;
}

// Cómo decir «las 24 velas anteriores» en cada temporalidad.
const VEINTICUATRO = {
  '1m': 'las últimas 24 velas de 1 minuto',
  '5m': 'las últimas 2 horas (24 velas de 5 min)',
  '15m': 'las últimas 6 horas (24 velas de 15 min)',
  '1h': 'las últimas 24 horas',
  '4h': 'los últimos 4 días (24 velas de 4 h)',
  '1d': 'los últimos 24 días',
};

// ---------------------------------------------------------------- contexto

/**
 * Todo lo que necesitan los setups, calculado una vez y de forma causal
 * (el valor en i usa solo velas 0..i). Si llega una Serie en vez de un array,
 * se usan solo sus velas cerradas. `opciones.moneda` es para los textos.
 */
export function prepararContexto(velas, intervalo, { moneda = 'EUR' } = {}) {
  let lista = velas;
  let iv = intervalo;
  if (!Array.isArray(lista) && lista && Array.isArray(lista.velas)) {
    const ult = Number.isInteger(lista.ultimaCerrada) ? lista.ultimaCerrada : lista.velas.length - 1;
    iv ??= lista.intervalo;
    lista = lista.velas.slice(0, ult + 1);
  }
  if (!Array.isArray(lista)) lista = [];
  const ms = msIntervalo(iv);
  const cierres = lista.map(v => (v != null && esNum(v.c) ? v.c : null));
  const rangos = rangoApertura(lista, 60, ms);
  return {
    velas: lista,
    intervalo: iv,
    ms,
    moneda,
    cierres,
    ema20: ema(cierres, 20),
    ema50: ema(cierres, 50),
    ema200: ema(cierres, 200),
    rsi: rsiDe(cierres, 14),
    atr: atrDe(lista, 14),
    vwap: vwapDiario(lista),
    bb: bollinger(cierres, 20, 2),
    volRel: volumenRel(lista, 20),
    donchian24: donchian(lista, 24),
    pivotes: pivotesDe(lista, 3, 3),
    rangos,
    rangoPorDia: new Map(rangos.map(r => [r.dia, r])),
  };
}

// ---------------------------------------------------------------- tendencia

/**
 * Tendencia en la vela i: { tendencia: 'alcista'|'bajista'|'lateral', motivo, datos }.
 * Alcista: precio y EMA50 por encima de la EMA200. Bajista: las dos por debajo.
 * Con menos de 200 velas se mira la EMA50 frente a la EMA20.
 */
export function tendencia(ctx, i) {
  const idx = Number.isInteger(i) ? i : (Array.isArray(ctx?.velas) ? ctx.velas.length - 1 : -1);
  const moneda = ctx?.moneda ?? 'EUR';
  const c = num(ctx?.cierres, idx) ?? (velaOk(ctx?.velas?.[idx]) ? ctx.velas[idx].c : null);
  const e20 = num(ctx?.ema20, idx);
  const e50 = num(ctx?.ema50, idx);
  const e200 = num(ctx?.ema200, idx);
  const datos = { cierre: c, ema20: r2(e20), ema50: r2(e50), ema200: r2(e200) };
  const p = x => precioTxt(x, moneda);
  if (c === null) return { tendencia: 'lateral', motivo: 'No hay velas suficientes para saber la tendencia.', datos };
  if (e50 !== null && e200 !== null) {
    // Medias pegadas (a menos de medio ATR) = mercado de lado, aunque una vaya por encima.
    const a = num(ctx?.atr, idx);
    if (a !== null && Math.abs(e50 - e200) < 0.5 * a) {
      return { tendencia: 'lateral', motivo: `La EMA50 y la EMA200 van casi juntas (${p(e50)} y ${p(e200)}): no hay tendencia clara.`, datos };
    }
    if (c > e200 && e50 > e200) {
      return { tendencia: 'alcista', motivo: `El precio (${p(c)}) está por encima de la EMA200 (${p(e200)}) y la EMA50 va por encima de la EMA200.`, datos };
    }
    if (c < e200 && e50 < e200) {
      return { tendencia: 'bajista', motivo: `El precio (${p(c)}) está por debajo de la EMA200 (${p(e200)}) y la EMA50 va por debajo de la EMA200.`, datos };
    }
    return {
      tendencia: 'lateral',
      motivo: `Señales mezcladas: el precio está ${c > e200 ? 'por encima' : 'por debajo'} de la EMA200 (${p(e200)}), pero la EMA50 va ${e50 > e200 ? 'por encima' : 'por debajo'}.`,
      datos,
    };
  }
  if (e20 !== null && e50 !== null) {
    const nota = ' (no hay 200 velas para la EMA200; se mira la EMA50)';
    if (c > e50 && e20 > e50) return { tendencia: 'alcista', motivo: `El precio y la EMA20 van por encima de la EMA50 (${p(e50)})${nota}.`, datos };
    if (c < e50 && e20 < e50) return { tendencia: 'bajista', motivo: `El precio y la EMA20 van por debajo de la EMA50 (${p(e50)})${nota}.`, datos };
    return { tendencia: 'lateral', motivo: `Señales mezcladas alrededor de la EMA50 (${p(e50)})${nota}.`, datos };
  }
  return { tendencia: 'lateral', motivo: 'No hay velas suficientes para las medias (hacen falta al menos 50).', datos };
}

// ---------------------------------------------------------------- piezas comunes de los setups

// Lo mínimo para valorar la vela i: que sea válida y que haya ATR.
function comun(ctx, i) {
  if (!ctx || !Array.isArray(ctx.velas) || !Number.isInteger(i) || i < 0 || i >= ctx.velas.length) return null;
  const v = ctx.velas[i];
  if (!velaOk(v)) return null;
  const a = num(ctx.atr, i);
  if (!(a > 0)) return null;
  return { v, atr: a, rsi: num(ctx.rsi, i), volRel: num(ctx.volRel, i), moneda: ctx.moneda ?? 'EUR', p: x => precioTxt(x, ctx.moneda ?? 'EUR') };
}

function datosBase(ctx, i, b, extra = {}) {
  return {
    intervalo: ctx.intervalo,
    atr: r2(b.atr),
    rsi: r1(b.rsi),
    volRel: r2(b.volRel),
    cierre: b.v.c,
    ema20: r2(num(ctx.ema20, i)),
    ema50: r2(num(ctx.ema50, i)),
    ema200: r2(num(ctx.ema200, i)),
    tendencia: tendencia(ctx, i).tendencia,
    ...extra,
  };
}

function puntosVolumen(vr) {
  if (!esNum(vr)) return 0;
  if (vr >= 2.5) return 16;
  if (vr >= 2) return 12;
  if (vr >= 1.5) return 8;
  if (vr >= 1.2) return 4;
  if (vr < 0.7) return -8;
  return 0;
}

// A favor de la tendencia de su temporalidad suma; en contra resta algo más.
function puntosTendencia(t, direccion) {
  if (t !== 'alcista' && t !== 'bajista') return 0;
  return (t === 'alcista') === (direccion === 'larga') ? 8 : -10;
}

function anchoEn(ctx, k) {
  const max = num(ctx.donchian24?.max, k);
  const min = num(ctx.donchian24?.min, k);
  return max !== null && min !== null ? max - min : null;
}

/**
 * ¿Está el rango de 24 velas comprimido? Sí si mide ≤ 3 ATR o ≤ 0,75 veces
 * su anchura mediana de las 100 velas anteriores (solo pasado).
 */
function compresion(ctx, i, a) {
  const ancho = anchoEn(ctx, i);
  if (ancho === null) return { comprimido: false, enAtr: null, ratio: null };
  const previos = [];
  for (let k = Math.max(0, i - 100); k < i; k++) {
    const x = anchoEn(ctx, k);
    if (x !== null) previos.push(x);
  }
  const med = previos.length >= 20 ? mediana(previos) : null;
  const ratio = med ? ancho / med : null;
  return { comprimido: ancho <= 3 * a || (ratio !== null && ratio <= 0.75), enAtr: ancho / a, ratio };
}

const opcionesDe = o => (o && typeof o === 'object' ? o : {});

// ---------------------------------------------------------------- 1. ruptura del rango de apertura

function detectarRangoApertura(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b) return null;
  const dia = diaUtc(b.v.t);
  const r = ctx.rangoPorDia instanceof Map ? ctx.rangoPorDia.get(dia)
    : Array.isArray(ctx.rangos) ? ctx.rangos.find(x => x.dia === dia) : null;
  // Solo si el rango del día ya está completo y lo conoce quien está en i.
  if (!r || !r.completo || !Number.isInteger(r.confirmadoEn) || r.confirmadoEn > i || !esNum(r.max) || !esNum(r.min)) return null;
  const { max, min } = r;
  const ancho = max - min;
  const invalidacion = ancho > 2 * b.atr ? (max + min) / 2 : min;
  const horas = (b.v.t + ctx.ms - r.cierraEn) / HORA_MS;
  const datos = datosBase(ctx, i, b, {
    rango_dia: r.dia, rango_max: max, rango_min: min, rango_atr: r2(ancho / b.atr), horas_desde_rango: r1(horas),
  });
  // Solo la PRIMERA vez del día que cierra por encima: en un mercado de lado
  // el precio cruza el rango de una hora una y otra vez.
  let primera = true;
  for (let k = r.confirmadoEn + 1; k < i; k++) {
    const v = ctx.velas[k];
    if (velaOk(v) && v.c > max) { primera = false; break; }
  }
  const conVolumen = esNum(b.volRel) && b.volRel >= VOL_RUPTURA;
  if (i > r.confirmadoEn && b.v.c > max && primera && conVolumen) {
    let f = 50 + puntosVolumen(b.volRel) + puntosTendencia(datos.tendencia, 'larga');
    if (horas > 8) f -= 8; // ya lejos de la apertura UTC: menos fiable
    if (ancho < 0.5 * b.atr) f -= 4;
    return {
      estado: 'activo', nivel_entrada: max, nivel_invalidacion: r2(invalidacion), fuerza: limitar(f),
      motivo: `El precio ha cerrado por encima del máximo de la primera hora del día (00:00–01:00 UTC, ${b.p(max)}) ${fraseVolumen(b.volRel)}.`,
      datos,
    };
  }
  if (formandose && primera && b.v.c <= max && b.v.c >= min && max - b.v.c <= 0.3 * b.atr) {
    const f = 30 + puntosTendencia(datos.tendencia, 'larga');
    return {
      estado: 'formandose', nivel_entrada: max, nivel_invalidacion: r2(invalidacion), fuerza: limitar(f),
      motivo: `El precio está a ${b.p(max - b.v.c)} del máximo de la primera hora del día (00:00–01:00 UTC, ${b.p(max)}): si cierra por encima, sería una ruptura.`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- 2. ruptura de rango (Donchian 24)

function detectarRupturaRango(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b) return null;
  const dmax = num(ctx.donchian24?.max, i);
  const dmin = num(ctx.donchian24?.min, i);
  if (dmax === null || dmin === null) return null;
  const comp = compresion(ctx, i, b.atr);
  // Si vuelve a media altura del rango (o 1,5 ATR por debajo), la ruptura ha fallado.
  const invalidacion = Math.max((dmax + dmin) / 2, dmax - 1.5 * b.atr);
  const periodo = VEINTICUATRO[ctx.intervalo] ?? 'las últimas 24 velas';
  const datos = datosBase(ctx, i, b, {
    donchian_max: dmax, donchian_min: dmin, ancho_atr: r2(comp.enAtr), comprimido: comp.comprimido,
  });
  if (b.v.c > dmax && esNum(b.volRel) && b.volRel >= VOL_RUPTURA) {
    const f = 52 + puntosVolumen(b.volRel) + puntosTendencia(datos.tendencia, 'larga') + (comp.comprimido ? 6 : 0);
    return {
      estado: 'activo', nivel_entrada: dmax, nivel_invalidacion: r2(invalidacion), fuerza: limitar(f),
      motivo: `El precio ha roto el máximo de ${periodo} (${b.p(dmax)}) ${fraseVolumen(b.volRel)}.`,
      datos,
    };
  }
  if (formandose && b.v.c <= dmax && dmax - b.v.c <= 0.25 * b.atr && comp.comprimido) {
    const f = 34 + puntosTendencia(datos.tendencia, 'larga');
    return {
      estado: 'formandose', nivel_entrada: dmax, nivel_invalidacion: r2(invalidacion), fuerza: limitar(f),
      motivo: `El precio está a ${b.p(dmax - b.v.c)} del máximo de ${periodo} (${b.p(dmax)}) con el rango estrecho: si lo rompe con volumen, sería una ruptura.`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- 3. bandera alcista

/**
 * Busca asta + bandera. La bandera son las velas [ini, fin] (3 a 12) y el asta
 * acaba justo antes: sube ≥ 3 ATR en ≤ 8 velas con la cima al final. La
 * bandera no pasa de la cima (salvo 0,3 ATR de mecha), no devuelve más de la
 * mitad de la subida y lleva menos volumen medio que el asta.
 */
function buscarBandera(ctx, fin, atrAhora) {
  const v = ctx.velas;
  // De la bandera más larga a la más corta: la primera que vale empieza justo
  // tras la cima (con más velas, la «bandera» se comería parte del asta).
  for (let L = 12; L >= 3; L--) {
    const ini = fin - L + 1;
    const e = ini - 1; // última vela del asta
    const s0 = e - 7;
    if (s0 < 0) continue;
    let valida = true;
    for (let k = s0; k <= fin; k++) if (!velaOk(v[k])) { valida = false; break; }
    if (!valida) continue;
    let cima = -Infinity;
    let iCima = -1;
    for (let k = s0; k <= e; k++) if (v[k].h > cima) { cima = v[k].h; iCima = k; }
    if (iCima < e - 2) continue; // la cima tiene que estar al final del asta
    let pie = Infinity;
    let iPie = -1;
    for (let k = s0; k <= iCima; k++) if (v[k].l <= pie) { pie = v[k].l; iPie = k; } // el último mínimo: el pie real del asta
    if (iPie >= iCima) continue;
    const atrAsta = num(ctx.atr, iPie) ?? num(ctx.atr, e);
    if (!(atrAsta > 0)) continue;
    const asta = cima - pie;
    if (asta < 3 * atrAsta) continue;
    let techo = -Infinity;
    let suelo = Infinity;
    let volB = 0;
    for (let k = ini; k <= fin; k++) {
      techo = Math.max(techo, v[k].h);
      suelo = Math.min(suelo, v[k].l);
      volB += esNum(v[k].v) ? v[k].v : NaN;
    }
    let volA = 0;
    for (let k = iPie; k <= e; k++) volA += esNum(v[k].v) ? v[k].v : NaN;
    const mediaB = volB / L;
    const mediaA = volA / (e - iPie + 1);
    if (!(esNum(mediaB) && esNum(mediaA) && mediaB < mediaA)) continue;
    if (techo > cima + 0.3 * atrAhora) continue;
    const retroceso = (cima - suelo) / asta;
    if (retroceso > 0.5) continue;
    return { ini, fin, L, velasAsta: iCima - iPie + 1, cima, pie, asta, techo, suelo, retroceso, volBandera: mediaB / mediaA };
  }
  return null;
}

function detectarBandera(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b) return null;
  const datosDe = f => datosBase(ctx, i, b, {
    asta: r2(f.asta), velas_asta: f.velasAsta, velas_bandera: f.L, bandera_max: f.techo, bandera_min: f.suelo,
    retroceso_pct: r1(f.retroceso * 100), volumen_bandera_rel: r2(f.volBandera),
  });
  // Activo: la bandera acaba en i−1 y la vela i cierra por encima de su techo.
  const f = buscarBandera(ctx, i - 1, b.atr);
  if (f && b.v.c > f.techo) {
    const datos = datosDe(f);
    const fz = 58 + puntosVolumen(b.volRel) + puntosTendencia(datos.tendencia, 'larga') + (f.retroceso < 0.3 ? 6 : 0);
    return {
      estado: 'activo', nivel_entrada: f.techo, nivel_invalidacion: f.suelo, fuerza: limitar(fz),
      motivo: `Tras subir ${b.p(f.asta)} en ${f.velasAsta} velas, el precio ha descansado ${f.L} velas sin devolver la mitad de la subida y ahora rompe el techo de esa pausa (${b.p(f.techo)}) ${fraseVolumen(b.volRel)}.`,
      datos,
    };
  }
  if (!formandose) return null;
  // Formándose: la bandera incluye la vela i y el precio está cerca de su techo.
  const g = buscarBandera(ctx, i, b.atr);
  if (g && b.v.c <= g.techo && g.techo - b.v.c <= 0.5 * b.atr) {
    const datos = datosDe(g);
    const fz = 34 + puntosTendencia(datos.tendencia, 'larga');
    return {
      estado: 'formandose', nivel_entrada: g.techo, nivel_invalidacion: g.suelo, fuerza: limitar(fz),
      motivo: `Bandera en marcha: tras subir ${b.p(g.asta)} en ${g.velasAsta} velas, el precio lleva ${g.L} velas de pausa con menos volumen; la rotura sería por encima de ${b.p(g.techo)}.`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- 4. rebote desde sobreventa

function detectarRebote(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b || b.rsi === null || i < 1) return null;
  let rsiMin = Infinity;
  let minimo = Infinity;
  for (let k = Math.max(0, i - 4); k <= i; k++) {
    const r = num(ctx.rsi, k);
    if (r !== null && r < rsiMin) rsiMin = r;
    if (velaOk(ctx.velas[k])) minimo = Math.min(minimo, ctx.velas[k].l);
  }
  if (!(rsiMin < 30) || !esNum(minimo)) return null;
  const prev = ctx.velas[i - 1];
  if (!velaOk(prev)) return null;
  const supera = b.v.c > prev.h;
  const rsiPrev = num(ctx.rsi, i - 1);
  const cruza = rsiPrev !== null && rsiPrev < 30 && b.rsi >= 30;
  const datos = datosBase(ctx, i, b, { rsi_min: r1(rsiMin), maximo_anterior: prev.h, minimo_5: minimo });
  // Va contra la tendencia por naturaleza: se dice y resta (la diaria la añade escanear).
  const contra = datos.tendencia === 'bajista' ? ` Va contra la tendencia de ${ctx.intervalo}, que es bajista.` : '';
  if (supera || cruza) {
    const fz = 44 + puntosVolumen(b.volRel) + puntosTendencia(datos.tendencia, 'larga') + (rsiMin < 20 ? 6 : 0) + (supera && cruza ? 4 : 0);
    const como = supera
      ? `la vela ha cerrado por encima del máximo de la anterior (${b.p(prev.h)})`
      : `el RSI vuelve a pasar de 30 (${fmtN(b.rsi, 1)})`;
    return {
      estado: 'activo', nivel_entrada: b.v.h, nivel_invalidacion: minimo, fuerza: limitar(fz),
      motivo: `El RSI bajó a ${fmtN(rsiMin, 1)} (sobreventa) y ahora ${como}: posible rebote.${contra}`,
      datos,
    };
  }
  if (formandose && b.rsi < 30) {
    const fz = 26 + puntosTendencia(datos.tendencia, 'larga');
    return {
      estado: 'formandose', nivel_entrada: b.v.h, nivel_invalidacion: minimo, fuerza: limitar(fz),
      motivo: `El RSI está en ${fmtN(b.rsi, 1)} (sobreventa): si una vela cierra por encima de ${b.p(b.v.h)}, sería un posible rebote.${contra}`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- 5. retroceso en tendencia

function detectarRetroceso(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b || i < 2) return null;
  const e20 = num(ctx.ema20, i);
  const e50 = num(ctx.ema50, i);
  const e200 = num(ctx.ema200, i);
  if (e20 === null || e50 === null || e200 === null) return null;
  // Solo en tendencia alcista de verdad: EMA50 sobre la EMA200 con margen
  // (medio ATR) y la EMA200 subiendo; en un mercado de lado van pegadas.
  const e200antes = num(ctx.ema200, i - 10);
  if (!(e50 > e200 && b.v.c > e200)) return null;
  if (e50 - e200 < 0.5 * b.atr || e200antes === null || !(e200 > e200antes)) return null;
  const zonaAlta = Math.max(e20, e50);
  const zonaBaja = Math.min(e20, e50);
  let min3 = Infinity;
  for (let k = i - 2; k <= i; k++) if (velaOk(ctx.velas[k])) min3 = Math.min(min3, ctx.velas[k].l);
  // Lo que quede más abajo: un pinchazo normal bajo la EMA50 no invalida el retroceso.
  const invalidacion = Math.min(min3, e50 - 0.5 * b.atr);
  const datos = datosBase(ctx, i, b, { zona_alta: r2(zonaAlta), zona_baja: r2(zonaBaja), minimo_3: min3 });
  const zona = `${b.p(zonaBaja)}–${b.p(zonaAlta)}`;
  const toca = b.v.l <= zonaAlta + 0.1 * b.atr && b.v.l >= zonaBaja - 0.5 * b.atr;
  if (toca && b.v.c > e20) {
    const fz = 56 + Math.max(0, puntosVolumen(b.volRel)) + (e20 > e50 ? 5 : 0) + (esNum(b.rsi) && b.rsi >= 40 && b.rsi <= 65 ? 4 : 0);
    return {
      estado: 'activo', nivel_entrada: b.v.h, nivel_invalidacion: r2(invalidacion), fuerza: limitar(fz),
      motivo: `En tendencia alcista, el precio ha bajado hasta la zona de la EMA20/EMA50 (${zona}) y ha cerrado por encima de la EMA20: retroceso para entrar si supera ${b.p(b.v.h)}.`,
      datos,
    };
  }
  const prev = ctx.velas[i - 1];
  if (formandose && b.v.c > e20 && b.v.l > zonaAlta && b.v.l - zonaAlta <= 0.3 * b.atr && velaOk(prev) && b.v.c < prev.c) {
    const fz = 30 + (e20 > e50 ? 4 : 0);
    return {
      estado: 'formandose', nivel_entrada: b.v.h, nivel_invalidacion: r2(invalidacion), fuerza: limitar(fz),
      motivo: `En tendencia alcista, el precio está bajando hacia la zona de la EMA20/EMA50 (${zona}): si la toca y rebota, sería un retroceso para entrar.`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- 6. ruptura bajista (corta)

function detectarRupturaBajista(ctx, i, opciones) {
  const { formandose = false } = opcionesDe(opciones);
  const b = comun(ctx, i);
  if (!b) return null;
  const dmax = num(ctx.donchian24?.max, i);
  const dmin = num(ctx.donchian24?.min, i);
  if (dmax === null || dmin === null) return null;
  const comp = compresion(ctx, i, b.atr);
  const invalidacion = Math.min((dmax + dmin) / 2, dmin + 1.5 * b.atr);
  const periodo = VEINTICUATRO[ctx.intervalo] ?? 'las últimas 24 velas';
  const datos = datosBase(ctx, i, b, {
    donchian_max: dmax, donchian_min: dmin, ancho_atr: r2(comp.enAtr), comprimido: comp.comprimido,
  });
  if (b.v.c < dmin && esNum(b.volRel) && b.volRel >= VOL_RUPTURA) {
    const fz = 50 + puntosVolumen(b.volRel) + puntosTendencia(datos.tendencia, 'corta') + (comp.comprimido ? 6 : 0);
    return {
      estado: 'activo', nivel_entrada: dmin, nivel_invalidacion: r2(invalidacion), fuerza: limitar(fz),
      motivo: `El precio ha roto el mínimo de ${periodo} (${b.p(dmin)}) ${fraseVolumen(b.volRel)}: señal de venta en corto.`,
      datos,
    };
  }
  if (formandose && b.v.c >= dmin && b.v.c - dmin <= 0.25 * b.atr && comp.comprimido) {
    const fz = 32 + puntosTendencia(datos.tendencia, 'corta');
    return {
      estado: 'formandose', nivel_entrada: dmin, nivel_invalidacion: r2(invalidacion), fuerza: limitar(fz),
      motivo: `El precio está a ${b.p(b.v.c - dmin)} del mínimo de ${periodo} (${b.p(dmin)}) con el rango estrecho: si lo pierde con volumen, sería una ruptura bajista.`,
      datos,
    };
  }
  return null;
}

// ---------------------------------------------------------------- catálogo

const congelar = s => Object.freeze({ ...s, intervalos: Object.freeze([...s.intervalos]) });

/**
 * Los seis setups. detectar(ctx, i, { formandose = false } = {}) devuelve null o
 * { estado, nivel_entrada, nivel_invalidacion, fuerza, motivo, datos } usando
 * solo las velas 0..i. Sin opciones solo devuelve jugadas 'activo' (lo que
 * necesita una prueba histórica); con { formandose: true } también avisa de
 * las que están a punto.
 */
export const SETUPS = Object.freeze([
  congelar({
    id: 'ruptura-rango-apertura', nombre: 'Ruptura del rango de apertura', intervalos: ['15m', '1h'], direccion: 'larga',
    descripcion: 'Cierre por encima del máximo de la primera hora del día UTC (00:00–01:00).',
    detectar: detectarRangoApertura,
  }),
  congelar({
    id: 'ruptura-rango', nombre: 'Ruptura de rango', intervalos: ['1h', '4h'], direccion: 'larga',
    descripcion: 'Cierre por encima del máximo de las 24 velas anteriores con volumen (≥ 1,2 veces lo normal).',
    detectar: detectarRupturaRango,
  }),
  congelar({
    id: 'bandera-alcista', nombre: 'Bandera alcista', intervalos: ['15m', '1h'], direccion: 'larga',
    descripcion: 'Subida rápida (≥ 3 ATR en ≤ 8 velas), pausa de 3 a 12 velas con menos volumen y rotura del techo de la pausa.',
    detectar: detectarBandera,
  }),
  congelar({
    id: 'rebote-sobreventa', nombre: 'Rebote desde sobreventa', intervalos: ['1h', '4h'], direccion: 'larga',
    descripcion: 'RSI por debajo de 30 hace poco y la vela supera el máximo de la anterior (o el RSI vuelve a pasar de 30). Va contra la tendencia.',
    detectar: detectarRebote,
  }),
  congelar({
    id: 'retroceso-tendencia', nombre: 'Retroceso en tendencia', intervalos: ['1h', '4h'], direccion: 'larga',
    descripcion: 'En tendencia alcista, el precio baja a la zona EMA20/EMA50 y cierra por encima de la EMA20.',
    detectar: detectarRetroceso,
  }),
  congelar({
    id: 'ruptura-bajista', nombre: 'Ruptura bajista (corto)', intervalos: ['1h', '4h'], direccion: 'corta',
    descripcion: 'Cierre por debajo del mínimo de las 24 velas anteriores con volumen. Solo informativa mientras los cortos estén apagados.',
    detectar: detectarRupturaBajista,
  }),
]);

// ---------------------------------------------------------------- escanear

function aMs(x) {
  const t = x instanceof Date ? x.getTime() : x;
  return esNum(t) && Math.abs(t) < 8.64e15 ? t : null; // fuera de ese margen no es una fecha
}

// Índice de la última vela cerrada: lo que diga la serie y, además, que haya cerrado antes de `ahora`.
function ultimaCerradaDe(serie, ms, ahora) {
  const velas = serie.velas;
  let ult = Number.isInteger(serie.ultimaCerrada) ? Math.min(serie.ultimaCerrada, velas.length - 1) : velas.length - 1;
  while (ult >= 0 && !(esNum(velas[ult]?.t) && velas[ult].t + ms <= ahora)) ult--;
  return ult;
}

function normalizarSeries(series, avisos) {
  let pares = [];
  if (Array.isArray(series)) pares = series.map(s => [s?.intervalo, s]);
  else if (series && typeof series === 'object') pares = Object.entries(series);
  else if (series !== undefined && series !== null) avisos.push('«series» debe ser un objeto { "1h": Serie, … }: no se ha escaneado nada.');
  const salida = [];
  for (const [clave, serie] of pares) {
    if (serie == null) continue;
    let iv = clave;
    if (!INTERVALOS[iv] && INTERVALOS[serie.intervalo]) iv = serie.intervalo;
    if (!INTERVALOS[iv]) { avisos.push(`Serie con intervalo desconocido «${String(clave)}»: se ignora.`); continue; }
    if (serie.intervalo && serie.intervalo !== iv && INTERVALOS[serie.intervalo]) {
      avisos.push(`La serie puesta como «${clave}» dice ser de ${serie.intervalo}: se usa ${serie.intervalo}.`);
      iv = serie.intervalo;
    }
    if (!Array.isArray(serie.velas)) { avisos.push(`La serie de ${iv} no trae velas: se ignora.`); continue; }
    if (salida.some(s => s.intervalo === iv)) { avisos.push(`Hay dos series de ${iv}: se usa la primera.`); continue; }
    salida.push({ intervalo: iv, serie });
  }
  return salida.sort((a, b) => INTERVALOS[a.intervalo] - INTERVALOS[b.intervalo]);
}

// Una detección en j sigue viva si ninguna vela cerrada posterior ha tocado la invalidación.
function invalidadaDespues(ctx, j, i, nivel, direccion) {
  if (!esNum(nivel)) return false;
  for (let k = j + 1; k <= i; k++) {
    const v = ctx.velas[k];
    if (!velaOk(v)) continue;
    if (direccion === 'corta' ? v.h >= nivel : v.l <= nivel) return true;
  }
  return false;
}

/** Activo si salió en la última vela cerrada o en las 3 anteriores sin invalidarse; formándose, solo en la última. */
function buscarReciente(setup, ctx, i) {
  for (let j = i; j >= Math.max(0, i - 3); j--) {
    const r = setup.detectar(ctx, j);
    if (!r || r.estado !== 'activo') continue;
    if (invalidadaDespues(ctx, j, i, r.nivel_invalidacion, setup.direccion)) continue;
    return { ...r, j };
  }
  const f = setup.detectar(ctx, i, { formandose: true });
  return f && f.estado === 'formandose' ? { ...f, j: i } : null;
}

function nombreNivel(tipo, iv, t) {
  const que = tipo === 'pivote-alto' ? 'máximo' : 'mínimo';
  if (!esNum(t)) return `${que} de ${iv}`;
  // Las velas diarias abren a las 00:00 UTC: se nombran por su día UTC, sin hora.
  if (iv === '1d') return `${que} diario (${diaUtc(t).split('-').reverse().join('/')})`;
  return `${que} de ${iv} (${fmtHora(t)})`;
}

function nivelesClave({ tfs, precio, ahora, moneda }) {
  const vacio = { precio, arriba: [], abajo: [], resistencia: null, soporte: null };
  if (!esNum(precio)) return vacio;
  const candidatos = [];
  const poner = (nivel, tipo, nombre, intervalo) => {
    if (esNum(nivel) && nivel > 0) candidatos.push({ precio: r2(nivel), tipo, nombre, intervalo });
  };
  // Pivotes de 1h de la última semana y de 4h y 1d de toda la serie (tras una
  // caída fuerte, los soportes por debajo son de hace semanas o meses). Solo
  // los ya confirmados.
  for (const [iv, alcance] of [['1h', 168], ['4h', Infinity], ['1d', Infinity]]) {
    const tf = tfs[iv];
    if (!tf || tf.i < 0) continue;
    const piv = pivotesHasta(tf.ctx.pivotes, tf.i);
    for (const p of piv.altos) if (p.i >= tf.i - alcance) poner(p.precio, 'pivote-alto', nombreNivel('pivote-alto', iv, p.t), iv);
    for (const p of piv.bajos) if (p.i >= tf.i - alcance) poner(p.precio, 'pivote-bajo', nombreNivel('pivote-bajo', iv, p.t), iv);
  }
  const h1 = tfs['1h'];
  if (h1 && h1.i >= 0) {
    let max = -Infinity;
    let min = Infinity;
    for (let k = Math.max(0, h1.i - 23); k <= h1.i; k++) {
      const v = h1.ctx.velas[k];
      if (velaOk(v)) { max = Math.max(max, v.h); min = Math.min(min, v.l); }
    }
    poner(max, 'max-24h', 'máximo de las últimas 24 horas', '1h');
    poner(min, 'min-24h', 'mínimo de las últimas 24 horas', '1h');
  }
  const hoy = esNum(ahora) ? diaUtc(ahora) : null;
  for (const iv of ['15m', '1h']) {
    const tf = tfs[iv];
    const r = tf && hoy ? tf.ctx.rangoPorDia.get(hoy) : null;
    if (r && r.completo && r.confirmadoEn <= tf.i) {
      poner(r.max, 'rango-apertura-max', 'máximo de la primera hora de hoy (UTC)', iv);
      poner(r.min, 'rango-apertura-min', 'mínimo de la primera hora de hoy (UTC)', iv);
      break;
    }
  }
  for (const iv of ['15m', '1h']) {
    const tf = tfs[iv];
    if (!tf || tf.i < 0 || !hoy || diaUtc(tf.ctx.velas[tf.i].t) !== hoy) continue;
    const w = num(tf.ctx.vwap, tf.i);
    if (w !== null) { poner(w, 'vwap', 'VWAP de hoy', iv); break; }
  }
  const d1 = tfs['1d'];
  if (d1 && d1.i >= 0) poner(num(d1.ctx.ema200, d1.i), 'ema200-diaria', 'EMA200 diaria', '1d');

  // Se juntan los niveles que caen a menos de un 0,1 % entre sí.
  const lado = lista => {
    const orden = lista.sort((a, b) => Math.abs(a.precio - precio) - Math.abs(b.precio - precio));
    const juntos = [];
    for (const n of orden) {
      const igual = juntos.find(x => Math.abs(x.precio - n.precio) <= 0.001 * precio);
      if (igual) {
        if (!igual.nombre.includes(n.nombre)) igual.nombre += ` + ${n.nombre}`;
        continue;
      }
      juntos.push({ ...n, distancia_pct: r2(((n.precio - precio) / precio) * 100) });
    }
    return juntos.slice(0, 5);
  };
  const arriba = lado(candidatos.filter(c => c.precio > precio));
  const abajo = lado(candidatos.filter(c => c.precio < precio));
  return { precio, arriba, abajo, resistencia: arriba[0] ?? null, soporte: abajo[0] ?? null, moneda };
}

function textoVigilar({ setups, niveles, moneda }) {
  const p = x => precioTxt(x, moneda);
  const activos = setups.filter(s => s.estado === 'activo' && s.operable);
  if (activos.length) {
    const s = activos[0];
    const otros = activos.length > 1 ? ` (y ${activos.length - 1} más)` : '';
    return `Hay jugada: ${s.nombre.toLowerCase()} en ${s.intervalo}${otros}. Entrada por encima de ${p(s.nivel_entrada)}; deja de valer por debajo de ${p(s.nivel_invalidacion)}.`;
  }
  const partes = ['No hay jugada clara ahora mismo.'];
  const { resistencia: r, soporte: s } = niveles;
  if (r || s) {
    const trozos = [];
    if (r) trozos.push(`por arriba ${p(r.precio)} (${r.nombre}, ${fmtPct(r.distancia_pct, 1, { signo: true })})`);
    if (s) trozos.push(`por abajo ${p(s.precio)} (${s.nombre}, ${fmtPct(s.distancia_pct, 1, { signo: true })})`);
    partes.push(`Qué vigilar: ${trozos.join('; ')}.`);
  }
  const formando = setups.find(x => x.estado === 'formandose' && x.operable);
  if (formando) partes.push(`Se está formando: ${formando.nombre.toLowerCase()} en ${formando.intervalo} (se activaría por encima de ${p(formando.nivel_entrada)}).`);
  return partes.join(' ');
}

/**
 * Escanea varias temporalidades a la vez.
 * escanear({ series: { '15m': Serie, '1h': Serie, '4h': Serie, '1d': Serie }, ahora, config, precio? })
 * → { hora, par, moneda, precio, tendencias, tendencias_motivo, setups, mejor,
 *     niveles_clave, contexto, resumen, avisos }.
 * Solo usa velas cerradas (hasta serie.ultimaCerrada y antes de `ahora`).
 * `precio` es el último conocido (la vela más reciente del intervalo más corto,
 * aunque esté abierta) salvo que se pase uno.
 */
export function escanear({ series, ahora, config, precio } = {}) {
  const avisos = [];
  let momento = aMs(ahora);
  if (momento === null) {
    if (ahora !== undefined && ahora !== null) avisos.push(`«ahora» no es una hora válida (${String(ahora)}): se usa la hora actual.`);
    momento = Date.now();
  }
  const cfg = config && typeof config === 'object' ? config : {};
  const cortos = cfg.riesgo?.cortos === true;
  const lista = normalizarSeries(series, avisos);
  const pedidos = Array.isArray(cfg.escaner?.intervalos) ? cfg.escaner.intervalos.filter(x => INTERVALOS[x]) : null;
  if (pedidos && pedidos.length) {
    for (const iv of pedidos) if (!lista.some(s => s.intervalo === iv)) avisos.push(`Falta la serie de ${iv}: esa temporalidad no se ha escaneado.`);
  }
  const par = lista.find(s => s.serie.par)?.serie.par ?? cfg.par ?? 'BTC-EUR';
  const moneda = PARES[par]?.moneda ?? 'EUR';
  if (!lista.length && !avisos.length) avisos.push('No se ha pasado ninguna serie de velas: no hay nada que escanear.');

  const tfs = {};
  for (const { intervalo: iv, serie } of lista) {
    const ms = INTERVALOS[iv];
    const ult = ultimaCerradaDe(serie, ms, momento);
    const cerradas = serie.velas.slice(0, ult + 1);
    const ctx = prepararContexto(cerradas, iv, { moneda });
    const i = cerradas.length - 1;
    tfs[iv] = { ctx, i, serie };
    for (const a of Array.isArray(serie.avisos) ? serie.avisos : []) avisos.push(`${iv}: ${a}`);
    if (i < 0) { avisos.push(`No hay velas cerradas de ${iv}: no se ha podido escanear.`); continue; }
    if (num(ctx.ema200, i) === null) avisos.push(`Con ${cerradas.length} velas de ${iv} no da para la EMA200 (hacen falta 200).`);
    const ultimaT = cerradas[i].t;
    if (esNum(ultimaT) && ultimaT + ms < momento - 2 * ms) {
      avisos.push(`Los datos de ${iv} van con retraso: la última vela cerrada es de ${fmtHora(ultimaT, { utc: true })}.`);
    }
  }

  const tendencias = {};
  const tendencias_motivo = {};
  for (const [iv, tf] of Object.entries(tfs)) {
    const t = tendencia(tf.ctx, tf.i);
    tendencias[iv] = t.tendencia;
    tendencias_motivo[iv] = t.motivo;
  }

  const setups = [];
  for (const [iv, tf] of Object.entries(tfs)) {
    if (tf.i < 0) continue;
    const mayores = Object.keys(tfs).filter(k => INTERVALOS[k] > INTERVALOS[iv] && tfs[k].i >= 0);
    for (const setup of SETUPS) {
      if (!setup.intervalos.includes(iv)) continue;
      const hallado = buscarReciente(setup, tf.ctx, tf.i);
      if (!hallado) continue;
      const { j, ...r } = hallado;
      // Que las temporalidades mayores acompañen suma; ir a contracorriente resta.
      let ajuste = 0;
      for (const k of mayores) {
        const t = tendencias[k];
        if (t === 'lateral') continue;
        ajuste += (t === 'alcista') === (setup.direccion === 'larga') ? 5 : -7;
      }
      ajuste = Math.max(-21, Math.min(10, ajuste));
      let motivo = r.motivo;
      if (setup.id === 'rebote-sobreventa' && tendencias['1d'] === 'bajista' && iv !== '1d') {
        ajuste -= 8;
        motivo += r.datos?.tendencia === 'bajista'
          ? ' Y la tendencia diaria también es bajista: por eso tiene menos fuerza.'
          : ' Ojo: va contra la tendencia diaria, que es bajista; por eso tiene menos fuerza.';
      }
      const operable = setup.direccion === 'larga' || cortos;
      if (!operable) motivo += ' Solo informativa: los cortos están apagados (cortos = false), así que no se opera.';
      setups.push({
        id: setup.id,
        nombre: setup.nombre,
        intervalo: iv,
        direccion: setup.direccion,
        estado: r.estado,
        nivel_entrada: r.nivel_entrada,
        nivel_invalidacion: r.nivel_invalidacion,
        fuerza: limitar(r.fuerza + ajuste),
        motivo,
        datos: {
          ...r.datos,
          fuerza_base: r.fuerza,
          ajuste_mayores: ajuste,
          mayores: Object.fromEntries(mayores.map(k => [k, tendencias[k]])),
        },
        vela_t: tf.ctx.velas[j].t,
        velas_desde: tf.i - j,
        operable,
      });
    }
  }
  // Por fuerza; los que no se pueden operar (cortos apagados) al final, para
  // que quien coja el primero no coja uno que el gestor de riesgo bloqueará.
  setups.sort((a, b) => (b.operable - a.operable) || (b.fuerza - a.fuerza)
    || ((a.estado === 'activo' ? 0 : 1) - (b.estado === 'activo' ? 0 : 1))
    || (INTERVALOS[b.intervalo] - INTERVALOS[a.intervalo]));

  // Precio de referencia: el que se pase o el último del intervalo más corto (aunque la vela esté abierta).
  let ref = esNum(precio) && precio > 0 ? precio : null;
  if (ref === null) {
    for (const { serie } of lista) {
      const ultima = [...serie.velas].reverse().find(v => velaOk(v) && v.t <= momento);
      if (ultima) { ref = ultima.c; break; }
    }
  }

  const niveles = nivelesClave({ tfs, precio: ref, ahora: momento, moneda });
  const resumen = textoVigilar({ setups, niveles, moneda });
  niveles.que_vigilar = resumen;

  const intervalos = {};
  for (const [iv, tf] of Object.entries(tfs)) {
    const { ctx, i } = tf;
    if (i < 0) { intervalos[iv] = { velas: 0 }; continue; }
    const v = ctx.velas[i];
    const a = num(ctx.atr, i);
    intervalos[iv] = {
      velas: i + 1,
      ultima_cerrada_t: v.t,
      cierre: esNum(v.c) ? v.c : null,
      rsi: r1(num(ctx.rsi, i)),
      atr: r2(a),
      atr_pct: a !== null && esNum(v.c) ? r2((a / v.c) * 100) : null,
      ema20: r2(num(ctx.ema20, i)),
      ema50: r2(num(ctx.ema50, i)),
      ema200: r2(num(ctx.ema200, i)),
      vol_rel: r2(num(ctx.volRel, i)),
      tendencia: tendencias[iv],
      tendencia_motivo: tendencias_motivo[iv],
    };
  }
  const contexto = { precio: ref, intervalos, ema200_diaria: null, distancia_ema200_diaria_pct: null, cambio_24h_pct: null, cambio_72h_pct: null };
  const d1 = tfs['1d'];
  const e200d = d1 && d1.i >= 0 ? num(d1.ctx.ema200, d1.i) : null;
  if (e200d !== null) {
    contexto.ema200_diaria = r2(e200d);
    if (ref !== null) contexto.distancia_ema200_diaria_pct = r2(((ref - e200d) / e200d) * 100);
  }
  const h1 = tfs['1h'];
  if (h1 && h1.i >= 0 && ref !== null) {
    for (const [horas, clave] of [[24, 'cambio_24h_pct'], [72, 'cambio_72h_pct']]) {
      const antes = h1.ctx.velas[h1.i - horas + 1];
      if (velaOk(antes) && antes.o > 0) contexto[clave] = r2(((ref - antes.o) / antes.o) * 100);
    }
  }

  const mejor = setups.find(s => s.operable && s.estado === 'activo') ?? setups.find(s => s.operable) ?? null;
  return { hora: momento, par, moneda, precio: ref, tendencias, tendencias_motivo, setups, mejor, niveles_clave: niveles, contexto, resumen, avisos };
}
