#!/usr/bin/env node
// La orden que usa Claude para «BTC en papel». Junta las piezas de lib/ en un
// flujo (escáner → noticias → entrada → salida → máquina del tiempo →
// presupuesto → riesgo → ticket) y lo cuenta en castellano llano, con cifras
// y hora. Todo es papel: no hay bróker, ni claves, ni dinero real. Abrir una
// posición en papel es otra orden aparte y exige un «sí» expreso.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVISO, INTERVALOS, cargarConfig, dirEstado, escribirEstado, fmtDinero, fmtHora, fmtPct, leerEstado } from './lib/comun.mjs';
import { PARES, preciosCruzados, velas as pedirVelas } from './lib/datos.mjs';
import { SETUPS, escanear, prepararContexto, precioTxt } from './lib/escaner.mjs';
import { altoImpacto, leerNoticias, miedoCodicia } from './lib/noticias.mjs';
import { vigilarEntrada } from './lib/entrada.mjs';
import { planSalida } from './lib/salida.mjs';
import { historico, opcionesMaquina, simular } from './lib/maquina.mjs';
import { dimensionar } from './lib/presupuesto.mjs';
import { comprobar } from './lib/riesgo.mjs';
import { abrir, cargarCartera, cerrar, guardarCartera, resumenCartera, revisar, textoCartera, ticket as textoOrden } from './lib/papel.mjs';
import { anadirAlerta, borrarAlerta, comprobarAlertas, listarAlertas } from './lib/alertas.mjs';
import { documentoInforme, paginaInforme } from './lib/informe.mjs';

const M5 = INTERVALOS['5m'];
const HORA = INTERVALOS['1h'];
const DIA = INTERVALOS['1d'];
// Velas por temporalidad para el escáner: dan para la EMA200 y para los pivotes.
const VELAS_ESCANER = { '1m': 400, '5m': 400, '15m': 400, '1h': 500, '4h': 400, '1d': 400 };
const DIAS_HISTORICO = 180;
const DIAS_CALENTAMIENTO = 10; // de más, para que la EMA200 de 1h ya valga al empezar el histórico
const VELAS_GRAFICO = 120; // 5 días de 1h
const NO_VALE = new Set(['invalidado', 'caducado', 'demasiado_lejos']);
const ORDEN_CLI = 'node .claude/skills/btc-trader/btc.mjs';
const NOMBRE_FUENTE = { coinbase: 'Coinbase', binance: 'Binance', kraken: 'Kraken', bitstamp: 'Bitstamp', sintetica: 'datos sintéticos' };
const PASOS = ['escanear', 'noticias', 'entrada', 'salida', 'maquina', 'presupuesto', 'riesgo', 'ticket'];

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const fuenteTxt = f => NOMBRE_FUENTE[f] ?? (f ? String(f) : '—');
const horaTxt = t => fmtHora(t, { utc: true });
const formatoN = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const fmtN = x => (esNum(x) ? formatoN.format(x) : '—');

/** Error de uso (orden mal escrita): se explica sin más. */
class ErrorUso extends Error {}

// ---------------------------------------------------------------- argumentos

const CON_VALOR = new Set(['setup', 'confirmar', 'salida', 'entrada', 'stop', 'objetivo', 'nota']);
const SIN_VALOR = new Set(['json', 'hipotetica', 'fragmento', 'todas', 'ayuda']);
const sinTildes = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function leerArgumentos(argv) {
  const pos = [];
  const op = {};
  const lista = Array.isArray(argv) ? argv.map(String) : [];
  for (let k = 0; k < lista.length; k++) {
    const a = lista[k];
    if (a === '-h' || a === '--help') { op.ayuda = true; continue; }
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const igual = a.indexOf('=');
    const nombre = sinTildes(igual > 0 ? a.slice(2, igual) : a.slice(2));
    let valor = igual > 0 ? a.slice(igual + 1) : undefined;
    if (CON_VALOR.has(nombre)) {
      if (valor === undefined) {
        const sig = lista[k + 1];
        if (sig !== undefined && !sig.startsWith('--')) { valor = sig; k++; } else valor = '';
      }
      op[nombre] = valor;
    } else if (SIN_VALOR.has(nombre)) {
      op[nombre] = true;
    } else {
      throw new ErrorUso(`No conozco la opción «${a}». Mira la ayuda: ${ORDEN_CLI} ayuda`);
    }
  }
  return { pos, op };
}

/** '62000', '62.000', '62.000,50' o '62000.5' → número. */
function leerNumero(texto, que) {
  if (typeof texto !== 'string' || !texto.trim()) throw new ErrorUso(`Falta ${que} (un número, por ejemplo 62000).`);
  let s = texto.trim().replace(/[€$\s ]/g, '').replace(/(eur|usd)$/i, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  if (!(esNum(n) && n > 0)) throw new ErrorUso(`${que} no es un número positivo (llegó «${texto}»).`);
  return n;
}

function aMs(x) {
  if (x instanceof Date) return Number.isFinite(x.getTime()) ? x.getTime() : null;
  if (esNum(x)) return x;
  if (typeof x === 'string' && x.trim()) {
    const t = Date.parse(x);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

// ---------------------------------------------------------------- red y contexto

function crearContexto({ fetch, ahora, cache, pausaMs, esperar } = {}) {
  const config = cargarConfig();
  const t = aMs(ahora) ?? Date.now();
  const par = typeof config.par === 'string' && PARES[config.par] ? config.par : 'BTC-EUR';
  const red = {};
  if (typeof fetch === 'function') red.fetch = fetch;
  if (esNum(pausaMs)) red.pausaMs = pausaMs;
  if (typeof esperar === 'function') red.esperar = esperar;
  return { config, ahora: t, par, moneda: PARES[par].moneda, red, cache: cache !== false, avisos: [] };
}

async function serie(ctx, intervalo, { limite, desde } = {}) {
  return pedirVelas({
    par: ctx.par, intervalo, fuente: ctx.config.fuente ?? 'auto', cache: ctx.cache, ahora: ctx.ahora,
    ...(esNum(desde) ? { desde } : { limite: limite ?? 300 }),
    ...ctx.red,
  });
}

async function cruzar(ctx) {
  try {
    return await preciosCruzados({ par: ctx.par, ahora: ctx.ahora, ...ctx.red });
  } catch (e) {
    return { par: ctx.par, precios: [], mediana: null, divergencia_pct: null, fallos: [{ fuente: 'todas', error: e.message }], hora: ctx.ahora };
  }
}

// El precio de referencia: el del exchange de las velas si respondió; si no, Coinbase o el primero.
function precioDeReferencia(cruzados, preferida) {
  const lista = Array.isArray(cruzados?.precios) ? cruzados.precios : [];
  const p = lista.find(x => x.fuente === preferida) ?? lista.find(x => x.fuente === 'coinbase') ?? lista[0];
  return p ? { precio: p.precio, fuente: p.fuente, hora: p.hora, compra: p.compra ?? null, venta: p.venta ?? null } : null;
}

// Con un solo exchange la divergencia saldría 0: eso no es «coinciden», es «no se sabe».
const divergenciaDe = cruzados => ((cruzados?.precios?.length ?? 0) >= 2 && esNum(cruzados.divergencia_pct) ? cruzados.divergencia_pct : null);

function resumenSetup(s) {
  if (!s) return null;
  return {
    id: s.id, nombre: s.nombre, intervalo: s.intervalo, direccion: s.direccion, estado: s.estado,
    nivel_entrada: s.nivel_entrada, nivel_invalidacion: s.nivel_invalidacion ?? null, fuerza: s.fuerza ?? null,
    motivo: s.motivo, vela_t: s.vela_t ?? null, hipotetica: s.hipotetica === true,
  };
}

const omitido = (ctx, motivo) => ({ omitido: true, motivo, hora: ctx.ahora });

// ---------------------------------------------------------------- 1. escáner

function datosGrafico(s) {
  if (!s || !Array.isArray(s.velas)) return null;
  const ult = Number.isInteger(s.ultimaCerrada) ? s.ultimaCerrada : s.velas.length - 1;
  const cerradas = s.velas.slice(0, ult + 1);
  if (!cerradas.length) return null;
  const c = prepararContexto(cerradas, '1h');
  const desde = Math.max(0, cerradas.length - VELAS_GRAFICO);
  const r2 = x => (esNum(x) ? Math.round(x * 100) / 100 : null);
  return {
    intervalo: '1h',
    fuente: s.fuente,
    velas: cerradas.slice(desde).map(v => [v.t, v.o, v.h, v.l, v.c]),
    ema20: c.ema20.slice(desde).map(r2),
    ema50: c.ema50.slice(desde).map(r2),
    vwap: c.vwap.slice(desde).map(r2),
  };
}

async function pasoEscanear(ctx) {
  const pedidos = Array.isArray(ctx.config.escaner?.intervalos) ? ctx.config.escaner.intervalos.filter(iv => INTERVALOS[iv]) : [];
  const ivs = pedidos.length ? [...new Set(pedidos)] : ['15m', '1h', '4h', '1d'];
  if (!ivs.includes('1h')) ivs.push('1h'); // el gráfico, la entrada hipotética y el histórico usan 1h
  const series = {};
  const fallos = [];
  for (const iv of ivs) {
    try {
      series[iv] = await serie(ctx, iv, { limite: VELAS_ESCANER[iv] ?? 400 });
    } catch (e) {
      fallos.push(`${iv}: ${e.message}`);
    }
  }
  if (!Object.keys(series).length) throw new Error(`No he podido leer velas de ningún exchange. ${fallos.join(' · ')}`);
  const cruzados = await cruzar(ctx);
  const ref = precioDeReferencia(cruzados, series['1h']?.fuente);
  const r = escanear({ series, ahora: ctx.ahora, config: ctx.config, precio: ref?.precio });
  const datos = {
    ...r,
    precio_actual: ref ?? (esNum(r.precio) ? { precio: r.precio, fuente: series['1h']?.fuente ?? null, hora: ctx.ahora, de_vela: true } : null),
    fuentes_velas: Object.fromEntries(Object.entries(series).map(([iv, s]) => [iv, {
      fuente: s.fuente, velas: s.velas.length,
      ultima_cerrada_t: s.ultimaCerrada >= 0 ? s.velas[s.ultimaCerrada].t : null,
      fallos: s.fallos ?? [],
    }])),
    precios_exchanges: cruzados,
    grafico: datosGrafico(series['1h']),
    avisos: [...r.avisos, ...fallos.map(f => `No se pudieron leer las velas de ${f}`)],
  };
  escribirEstado('escanear', datos);
  return datos;
}

function textoEscaner(d) {
  const p = x => precioTxt(x, d.moneda);
  const l = [];
  const fuentes = [...new Set(Object.values(d.fuentes_velas ?? {}).map(x => fuenteTxt(x.fuente)))].join(', ');
  l.push(`1. ESCÁNER DE GRÁFICOS (velas de ${fuentes || '—'})`);
  const tend = Object.entries(d.tendencias ?? {}).map(([iv, t]) => `${iv} ${t}`).join(' · ');
  l.push(`Tendencia: ${tend || 'sin datos'}.`);
  const c = d.contexto ?? {};
  const cambios = [];
  if (esNum(c.cambio_24h_pct)) cambios.push(`24 h ${fmtPct(c.cambio_24h_pct, 1, { signo: true })}`);
  if (esNum(c.cambio_72h_pct)) cambios.push(`72 h ${fmtPct(c.cambio_72h_pct, 1, { signo: true })}`);
  if (esNum(c.ema200_diaria)) cambios.push(`EMA200 diaria en ${p(c.ema200_diaria)} (el precio está a un ${fmtPct(c.distancia_ema200_diaria_pct, 1, { signo: true })})`);
  const rsi1h = c.intervalos?.['1h']?.rsi;
  if (esNum(rsi1h)) cambios.push(`RSI de 1h ${fmtN(rsi1h)}`);
  if (cambios.length) l.push(`Cambio: ${cambios.join(' · ')}.`);
  const setups = Array.isArray(d.setups) ? d.setups : [];
  if (!setups.length) {
    l.push('Setups: ninguno a la vista.');
  } else {
    l.push('Setups (primero los que se pueden operar, de más a menos fuerza):');
    for (const s of setups.slice(0, 5)) {
      const estado = s.estado === 'activo' ? 'activo' : 'formándose';
      const extra = s.operable ? '' : ' (solo informativo: los cortos están apagados)';
      const lado = s.direccion === 'corta' ? 'por debajo' : 'por encima';
      const inval = s.direccion === 'corta' ? 'por encima' : 'por debajo';
      l.push(`  · ${s.nombre} en ${s.intervalo}: ${estado}, fuerza ${s.fuerza}/100. Entrada ${lado} de ${p(s.nivel_entrada)}; deja de valer ${inval} de ${p(s.nivel_invalidacion)}${extra}.`);
    }
    if (setups.length > 5) l.push(`  · …y ${setups.length - 5} más (en estado/escanear.json).`);
  }
  // El «hay jugada» del escáner aún no sabe si la entrada vale: eso lo dicen la entrada y la conclusión.
  if (d.resumen && !/^Hay jugada/.test(d.resumen)) l.push(d.resumen);
  for (const a of (d.avisos ?? []).slice(0, 4)) l.push(`Aviso: ${a}`);
  return l.join('\n');
}

// ---------------------------------------------------------------- 2. noticias

async function pasoNoticias(ctx) {
  const horas = esNum(ctx.config.noticias?.horas) && ctx.config.noticias.horas > 0 ? ctx.config.noticias.horas : 24;
  const f = ctx.red.fetch ?? globalThis.fetch;
  const [n, mc] = await Promise.allSettled([
    leerNoticias({ horas, fetch: f, ahora: ctx.ahora }),
    miedoCodicia({ fetch: f }),
  ]);
  const noticias = n.status === 'fulfilled' ? n.value.noticias : [];
  const datos = {
    hora: ctx.ahora,
    horas,
    noticias,
    fuentes: n.status === 'fulfilled' ? n.value.fuentes : [],
    error: n.status === 'rejected' ? n.reason?.message ?? String(n.reason) : null,
    alto_impacto: altoImpacto(noticias),
    miedo_codicia: mc.status === 'fulfilled' ? mc.value : null,
    miedo_codicia_error: mc.status === 'rejected' ? mc.reason?.message ?? String(mc.reason) : null,
  };
  escribirEstado('noticias', datos);
  return datos;
}

const IMPACTO = { alto: 'alto', medio: 'medio', bajo: 'bajo' };
const SENTIDO = { positivo: 'a favor', negativo: 'en contra', neutro: 'neutro' };

function textoNoticias(d) {
  const l = [];
  const ok = (d.fuentes ?? []).filter(f => f.ok).length;
  l.push(`2. NOTICIAS (últimas ${fmtN(d.horas)} h; ${ok} de ${(d.fuentes ?? []).length} medios leídos)`);
  if (d.miedo_codicia) {
    const f = d.miedo_codicia.fecha ? `, ${fmtHora(Date.parse(d.miedo_codicia.fecha))}` : '';
    l.push(`Miedo y codicia: ${fmtN(d.miedo_codicia.valor)}/100, ${d.miedo_codicia.clase} (alternative.me${f}).`);
  } else {
    l.push(`Miedo y codicia: sin dato (${d.miedo_codicia_error ?? 'no respondió'}).`);
  }
  if (d.error) l.push(`No se pudieron leer las noticias: ${d.error}`);
  const lista = d.noticias ?? [];
  l.push(lista.length
    ? `${lista.length} ${lista.length === 1 ? 'noticia mueve' : 'noticias mueven'} BTC; ${d.alto_impacto.length} de alto impacto:`
    : 'Ninguna noticia que mueva BTC en ese tiempo.');
  const orden = [...lista].sort((a, b) => (a.impacto === 'alto' ? 0 : a.impacto === 'medio' ? 1 : 2) - (b.impacto === 'alto' ? 0 : b.impacto === 'medio' ? 1 : 2));
  for (const x of orden.slice(0, 6)) {
    l.push(`  · [${IMPACTO[x.impacto] ?? x.impacto}, ${SENTIDO[x.sentido] ?? x.sentido}] ${x.titulo} (${x.fuente}, ${fmtHora(Date.parse(x.fecha))})`);
  }
  const caidas = (d.fuentes ?? []).filter(f => !f.ok);
  if (caidas.length) l.push(`Sin respuesta: ${caidas.map(f => `${f.nombre} (${f.error})`).join('; ')}.`);
  if (lista.length) l.push('Los titulares vienen en inglés, tal cual los publica cada medio.');
  return l.join('\n');
}

// ---------------------------------------------------------------- 3. entrada

function elegirSetup(esc, pedido) {
  const setups = Array.isArray(esc.setups) ? esc.setups : [];
  if (pedido !== undefined) {
    const id = sinTildes(String(pedido).trim());
    if (!SETUPS.some(s => s.id === id)) {
      throw new ErrorUso(`No conozco el setup «${pedido}». Los que hay: ${SETUPS.map(s => s.id).join(', ')}.`);
    }
    const hallado = setups.find(s => s.id === id);
    return hallado ? { setup: hallado } : { setup: null, motivo: `El escáner no ve ahora el setup «${id}» en ninguna temporalidad.` };
  }
  const s = setups.find(x => x.operable && x.direccion === 'larga' && x.estado === 'activo');
  if (s) return { setup: s };
  const formandose = setups.find(x => x.operable && x.direccion === 'larga');
  return {
    setup: null,
    motivo: formandose
      ? `No hay ningún setup largo activo (${formandose.nombre.toLowerCase()} en ${formandose.intervalo} se está formando, pero aún no ha saltado).`
      : 'El escáner no ve ningún setup largo activo.',
  };
}

function setupHipotetico(esc) {
  const p = esc.precio_actual?.precio ?? esc.precio;
  const atr = esc.contexto?.intervalos?.['1h']?.atr;
  if (!(esNum(p) && p > 0)) throw new Error('No hay precio de ahora para montar la entrada hipotética.');
  if (!(esNum(atr) && atr > 0)) throw new Error('No hay ATR de 1h para poner el stop de la entrada hipotética.');
  return {
    id: 'hipotetica', nombre: 'Entrada HIPOTÉTICA (sin setup)', intervalo: '1h', direccion: 'larga', estado: 'hipotetica',
    nivel_entrada: p, nivel_invalidacion: null, fuerza: null, hipotetica: true, operable: true, vela_t: null,
    motivo: 'No sale de ningún setup: es una compra al precio de ahora con stop por ATR de 1h, solo para ver el flujo entero.',
    datos: { atr, intervalo: '1h' },
  };
}

async function pasoEntrada(ctx, esc, op) {
  const base = { hora: ctx.ahora, hipotetica: false };
  const { setup, motivo } = elegirSetup(esc, op.setup);
  let descartado = null;
  if (setup) {
    const iv = INTERVALOS[ctx.config.entrada?.intervalo] ? ctx.config.entrada.intervalo : '5m';
    const ms = INTERVALOS[iv];
    const desdeSenal = esNum(setup.vela_t) ? Math.ceil((ctx.ahora - setup.vela_t) / ms) : 0;
    const s = await serie(ctx, iv, { limite: Math.min(5000, Math.max(300, desdeSenal + 60)) });
    const v = vigilarEntrada({ setup, serie: s, ahora: ctx.ahora, config: ctx.config });
    const d = { ...base, setup: resumenSetup(setup), setup_completo: setup, ...v, fuente: s.fuente, sigue: !NO_VALE.has(v.estado) };
    if (d.sigue || !op.hipotetica) {
      escribirEstado('entrada', d);
      return d;
    }
    descartado = d;
  }
  if (!op.hipotetica) {
    const d = { ...base, setup: null, estado: 'sin_jugada', motivo, sigue: false };
    escribirEstado('entrada', d);
    return d;
  }
  const hip = setupHipotetico(esc);
  const porque = descartado
    ? `el setup ${descartado.setup.nombre.toLowerCase()} en ${descartado.setup.intervalo} ya no vale (${descartado.motivo})`
    : motivo.replace(/\.$/, '').replace(/^./, c => c.toLowerCase());
  const d = {
    ...base,
    hipotetica: true,
    setup: resumenSetup(hip),
    setup_completo: hip,
    estado: 'hipotetica',
    precio: hip.nivel_entrada,
    precio_actual: hip.nivel_entrada,
    nivel_entrada: hip.nivel_entrada,
    nivel_invalidacion: null,
    direccion: 'larga',
    intervalo: '1h',
    atr: hip.datos.atr,
    caduca_en: ctx.ahora + HORA,
    avisos: [],
    descartado: descartado ? { setup: descartado.setup, estado: descartado.estado, motivo: descartado.motivo } : null,
    motivo: `Entrada HIPOTÉTICA a ${precioTxt(hip.nivel_entrada, ctx.moneda)}, el precio de ahora: no es una señal; ${porque}. Sirve solo para ver el flujo entero.`,
    sigue: true,
  };
  escribirEstado('entrada', d);
  return d;
}

const ESTADO_ENTRADA = {
  esperar: 'ESPERAR', disparo: 'DISPARO', invalidado: 'INVALIDADA', caducado: 'CADUCADA',
  demasiado_lejos: 'DEMASIADO LEJOS', hipotetica: 'HIPOTÉTICA', sin_jugada: 'SIN JUGADA',
};

function textoEntrada(d) {
  const l = [];
  const quien = d.setup ? ` · ${d.setup.nombre} en ${d.setup.intervalo}` : '';
  l.push(d.hipotetica ? '3. ENTRADA · HIPOTÉTICA (sin setup)' : `3. ENTRADA (temporizador de ${d.intervalo ?? '5m'})${quien}`);
  l.push(`Estado: ${ESTADO_ENTRADA[d.estado] ?? d.estado}. ${d.motivo}`);
  if (d.setup && !d.hipotetica && d.setup.motivo) l.push(`Por qué salió el setup: ${d.setup.motivo}`);
  for (const a of d.avisos ?? []) l.push(`Aviso: ${a}`);
  return l.join('\n');
}

// ---------------------------------------------------------------- 4. salida

// salida.mjs avisa de que el gestor «puede pararla» por el R:R neto, pero riesgo.mjs mira el
// bruto: se dice tal cual para no prometer un freno que no existe.
const aclararAviso = a => a.replace(/: el gestor de riesgo puede pararla\.$/, '. Tu gestor de riesgo mira el R:R sin costes, así que no la para por esto: los costes se comen casi toda la ganancia.');

function pasoSalida(ctx, ent) {
  // Esperando, el plan se hace sobre el nivel de entrada del setup; con disparo, sobre el cierre que disparó.
  const entrada = ent.estado === 'esperar' ? undefined : ent.precio;
  const plan = planSalida({ setup: ent.setup_completo, entrada, atr: ent.setup_completo?.datos?.atr, ahora: ctx.ahora, config: ctx.config });
  const d = { hora: ctx.ahora, hipotetica: ent.hipotetica, setup: ent.setup, ...plan, avisos: plan.avisos.map(aclararAviso) };
  escribirEstado('salida', d);
  return d;
}

function textoSalida(d, moneda) {
  const p = x => precioTxt(x, moneda);
  const l = ['4. SALIDA (el plan, decidido antes de entrar)'];
  const pctStop = ((d.stop - d.entrada) / d.entrada) * 100;
  const pctObj = ((d.objetivo - d.entrada) / d.entrada) * 100;
  l.push(`Entrada ${p(d.entrada)} · stop ${p(d.stop)} (${fmtPct(pctStop, 2, { signo: true })}, ${d.stop_origen === 'estructura' ? 'donde la jugada deja de valer' : 'por ATR'}) · ` +
    `objetivo ${p(d.objetivo)} (${fmtPct(pctObj, 2, { signo: true })}).`);
  l.push(`Ganas ${fmtN(d.rr)} por cada 1 que arriesgas (${fmtN(d.rr_neto)} contando comisiones y deslizamiento). ` +
    `Si el ${horaTxt(d.salida_por_tiempo)} no ha tocado ninguno, se sale a mercado.`);
  if (d.valido === false) l.push('La jugada ya no vale: la entrada queda por debajo de la invalidación del setup.');
  for (const a of d.avisos ?? []) l.push(`Aviso: ${a}`);
  return l.join('\n');
}

// ---------------------------------------------------------------- 5. máquina del tiempo

function historicoDeSetup(regla, velas1h, config) {
  const ms = HORA;
  // La dirección va en la señal para que historico() simule también los cortos.
  const detectar = (c, i) => {
    const r = regla.detectar(c, i);
    return r ? { ...r, direccion: regla.direccion } : null;
  };
  const plan = (senal, c, i, pe) => {
    try {
      const p = planSalida({ setup: { ...senal, direccion: regla.direccion, intervalo: '1h' }, entrada: pe, atr: c.atr?.[i], ahora: c.velas[i].t + ms, config });
      return p.valido ? { stop: p.stop, objetivo: p.objetivo, horas: p.horas_max } : null;
    } catch {
      return null; // sin ATR ni invalidación en las primeras velas: esa señal no se opera
    }
  };
  return historico({
    velas: velas1h, intervalo: '1h', preparar: prepararContexto, detectar, plan,
    costes: config.costes, horas: config.salida?.horas_max ?? 24, semilla: config.maquina?.semilla ?? 19, dias: DIAS_HISTORICO,
  });
}

async function pasoMaquina(ctx, { setup, hipotetica, setupId }, plan) {
  const opc = opcionesMaquina(ctx.config);
  const horas = esNum(plan.horas_max) && plan.horas_max > 0 ? plan.horas_max : opc.horas;
  const d = {
    hora: ctx.ahora, hipotetica: hipotetica === true, setup: setup ? resumenSetup(setup) : null,
    plan: { entrada: plan.entrada, stop: plan.stop, objetivo: plan.objetivo, horas },
    simulacion: null, error_simulacion: null, fuente_5m: null,
    historico: null, error_historico: null, fuente_1h: null, sin_regla: null,
  };
  try {
    const s5 = await serie(ctx, '5m', { desde: ctx.ahora - opc.dias * DIA - HORA });
    d.fuente_5m = s5.fuente;
    d.simulacion = simular({ ...opc, velas: s5, inicio: ctx.ahora, entrada: plan.entrada, stop: plan.stop, objetivo: plan.objetivo, horas });
  } catch (e) {
    d.error_simulacion = e.message;
  }
  const id = setupId ?? (setup && !hipotetica ? setup.id : null);
  const regla = id ? SETUPS.find(s => s.id === id) : null;
  if (!regla) {
    d.sin_regla = hipotetica
      ? 'Es una entrada hipotética: no sale de ninguna regla, así que no hay nada que repetir en el pasado.'
      : 'Sin setup no hay regla que repetir en el pasado.';
  } else {
    try {
      const s1h = await serie(ctx, '1h', { desde: ctx.ahora - (DIAS_HISTORICO + DIAS_CALENTAMIENTO) * DIA });
      d.fuente_1h = s1h.fuente;
      d.historico = { setup: regla.id, nombre: regla.nombre, dias_pedidos: DIAS_HISTORICO, ...historicoDeSetup(regla, s1h, ctx.config) };
    } catch (e) {
      d.error_historico = e.message;
    }
  }
  escribirEstado('maquina', d);
  return d;
}

function lecturaSimulacion(s) {
  const e = s.esperanza_R;
  const cuantas = Math.round(s.stop_primero_pct / 10);
  const base = `Toca antes el stop que el objetivo en ${cuantas} de cada 10 futuros simulados.`;
  if (!esNum(e)) return base;
  if (e > 0.1) return `${base} De media gana (${fmtN(e)} R por operación): si el futuro se parece a esos días, la jugada tiene algo de ventaja, pero no es una garantía.`;
  if (e < -0.1) return `${base} De media pierde (${fmtN(e)} R por operación): en estas simulaciones la jugada no tiene ventaja.`;
  return `${base} De media sale más o menos a cero (${fmtN(e)} R): ni ventaja ni desventaja clara, y los costes se comen lo poco que haya.`;
}

function lecturaHistorico(h) {
  if (!h.senales) return 'En ese tiempo la regla no dio ninguna señal operable: no hay pasado con el que compararla.';
  const poco = h.senales < 20 ? ' Con tan pocas señales, el resultado dice poco.' : '';
  if (h.esperanza_R > 0.1) return `En el pasado real esta regla ganó de media ${fmtN(h.esperanza_R)} R por operación.${poco}`;
  if (h.esperanza_R < -0.1) return `En el pasado real esta regla perdió de media ${fmtN(Math.abs(h.esperanza_R))} R por operación: no ha tenido ventaja.${poco}`;
  return `En el pasado real esta regla salió más o menos a cero (${fmtN(h.esperanza_R)} R por operación).${poco}`;
}

function textoMaquina(d) {
  const l = ['5. MÁQUINA DEL TIEMPO'];
  const s = d.simulacion;
  if (s) {
    l.push(`Simulación: ${fmtN(s.simulaciones)} futuros de las próximas ${fmtN(s.horas)} h, con velas de 5 min de ${fmtN(s.dias_usados)} días a esta misma hora (${fuenteTxt(d.fuente_5m)}).`);
    l.push(`Objetivo primero ${fmtPct(s.objetivo_primero_pct, 1)} · stop primero ${fmtPct(s.stop_primero_pct, 1)} · sin tocar ninguno ${fmtPct(s.abierta_pct, 1)}.`);
    const r = s.resultado_pct;
    l.push(`Resultado neto: mediana ${fmtPct(r.mediana, 2, { signo: true })}; 9 de cada 10 entre ${fmtPct(r.p5, 2, { signo: true })} y ${fmtPct(r.p95, 2, { signo: true })}.`);
    if (s.k_volatilidad !== 1) l.push(`Las subidas y bajadas se han multiplicado por ${fmtN(s.k_volatilidad)} para que se muevan como en las últimas 24 h.`);
    l.push(`En llano: ${lecturaSimulacion(s)}`);
    for (const a of (s.avisos ?? []).slice(0, 3)) l.push(`Aviso: ${a}`);
  } else {
    l.push(`Simulación: no se ha podido hacer (${d.error_simulacion ?? 'sin datos'}).`);
  }
  const h = d.historico;
  if (h) {
    l.push(`Histórico de la regla «${h.nombre}» en 1h, ${fmtN(Math.round((h.hasta - (h.desde ?? h.hasta)) / DIA))} días (${fuenteTxt(d.fuente_1h)}): ` +
      `${h.senales} ${h.senales === 1 ? 'operación' : 'operaciones'}, ${h.objetivo} al objetivo, ${h.stop} al stop y ${h.abiertas} sin tocar ninguno` +
      (h.senales ? `; acierto ${fmtPct(h.acierto_pct, 1)}, esperanza ${fmtN(h.esperanza_R)} R, total ${fmtN(h.R_total)} R.` : '.'));
    l.push(`En llano: ${lecturaHistorico(h)}`);
  } else if (d.sin_regla) {
    l.push(`Histórico: ${d.sin_regla}`);
  } else if (d.error_historico) {
    l.push(`Histórico: no se ha podido hacer (${d.error_historico}).`);
  }
  l.push('La simulación dice qué pasaría si las próximas horas se movieran como los últimos días a esta hora; el histórico, cómo le fue a esta misma regla cuando salió de verdad. Ninguna de las dos predice.');
  return l.join('\n');
}

// ---------------------------------------------------------------- 6. presupuesto

function pasoPresupuesto(ctx, plan, ent, precio) {
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  const cuenta = resumenCartera(cartera, precio, ctx.ahora);
  const dim = dimensionar({ entrada: plan.entrada, stop: plan.stop, config: ctx.config, cuenta, lado: plan.direccion });
  const d = {
    hora: ctx.ahora, hipotetica: ent.hipotetica, ...dim,
    cuenta: { capital: cuenta.capital, efectivo: cuenta.efectivo, pnl_hoy: cuenta.pnl_hoy, operaciones_hoy: cuenta.operaciones_hoy, abiertas: cuenta.abiertas },
  };
  escribirEstado('presupuesto', d);
  return d;
}

function textoPresupuesto(d, moneda) {
  const m = x => fmtDinero(x, moneda);
  return [
    `6. PRESUPUESTO (cartera de papel: ${m(d.cuenta.capital)} de capital, ${m(d.cuenta.efectivo)} libres)`,
    d.motivo,
  ].join('\n');
}

// ---------------------------------------------------------------- 7. riesgo

async function pasoRiesgo(ctx, plan, pres, noticias, ent, preferida) {
  const cruzados = await cruzar(ctx);
  const ref = precioDeReferencia(cruzados, preferida);
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  const cuenta = resumenCartera(cartera, ref?.precio ?? null, ctx.ahora);
  const orden = { lado: plan.direccion, btc: pres.btc, entrada: plan.entrada, stop: plan.stop, objetivo: plan.objetivo };
  // Si no se pudo leer ningún medio, no se sabe si hay noticia: que el gestor lo diga.
  const leidas = noticias && !noticias.error && (noticias.fuentes ?? []).some(f => f.ok);
  const contexto = {
    ahora: ctx.ahora,
    precio_actual: ref?.precio ?? null,
    noticias_alto_impacto: leidas ? noticias.alto_impacto : undefined,
    divergencia_pct: divergenciaDe(cruzados),
  };
  const r = comprobar({ orden, cuenta, config: ctx.config, contexto });
  const avisos = [...r.avisos];
  if (cruzados.precios.length === 1) avisos.push(`Solo respondió ${fuenteTxt(cruzados.precios[0].fuente)}: no se ha podido comparar el precio entre exchanges.`);
  const d = { ...r, hipotetica: ent.hipotetica, avisos, precio_actual: ref, precios_exchanges: cruzados };
  escribirEstado('riesgo', d);
  return d;
}

function textoRiesgoCorto(d, { todas = false } = {}) {
  const fallan = d.comprobaciones.filter(c => !c.ok);
  const l = [`7. RIESGO: ${d.veredicto}${d.hipotetica ? ' (sobre la orden HIPOTÉTICA)' : ''} · ${d.comprobaciones.length - fallan.length} de ${d.comprobaciones.length} reglas pasan`];
  for (const c of todas ? d.comprobaciones : fallan) l.push(`${c.ok ? 'PASA' : 'BLOQUEA'} · ${c.nombre}: ${c.detalle}`);
  if (!todas && !fallan.length) l.push('Todas tus reglas dan el visto bueno.');
  for (const a of d.avisos ?? []) l.push(`Aviso: ${a}`);
  return l.join('\n');
}

// ---------------------------------------------------------------- 8. ticket

function pasoTicket(ctx, ent, plan, pres, riesgo) {
  const orden = {
    lado: plan.direccion, btc: pres.btc, entrada: plan.entrada, stop: plan.stop, objetivo: plan.objetivo,
    salida_por_tiempo: plan.salida_por_tiempo,
    setup: ent.hipotetica ? 'hipotetica' : ent.setup?.id ?? null,
    nota: ent.hipotetica ? 'HIPOTÉTICA: compra al precio de ese momento, sin setup' : ent.setup ? `${ent.setup.nombre} en ${ent.setup.intervalo}` : '',
  };
  let texto = null;
  let motivo = null;
  if (!(pres.btc > 0)) {
    motivo = `no hay orden. ${pres.motivo}`;
  } else {
    texto = textoOrden(orden, ctx.config);
    if (ent.hipotetica) texto = `HIPOTÉTICA (no sale de ningún setup) · ${texto}`;
    if (riesgo.veredicto !== 'PASA') motivo = `el gestor de riesgo la bloquea. ${riesgo.motivos.join(' ')}`;
    else if (ent.estado === 'esperar') motivo = `la entrada aún no ha disparado. ${ent.motivo}`;
  }
  const d = {
    hora: ctx.ahora, hipotetica: ent.hipotetica, setup: ent.setup, entrada_estado: ent.estado, orden, texto,
    veredicto: riesgo.veredicto, vigente: texto !== null && motivo === null, motivo_no_vigente: motivo,
    caduca_en: ent.caduca_en ?? null, usado: null,
  };
  escribirEstado('ticket', d);
  return d;
}

function textoTicket(d) {
  const l = ['8. TICKET (aquí se para: no se abre nada sin tu «sí»)'];
  if (d.texto) l.push(d.texto);
  if (d.vigente) {
    l.push(`Para abrirlo EN PAPEL: ${ORDEN_CLI} papel abrir --confirmar sí${d.hipotetica ? ' --hipotetica' : ''}`);
  } else {
    l.push(`No se puede abrir ahora: ${d.motivo_no_vigente}`);
  }
  return l.join('\n');
}

// ---------------------------------------------------------------- flujo

// El escáner junta en un nombre los niveles que caen casi en el mismo precio («a + b + c…»).
function nombreCorto(nombre) {
  const partes = String(nombre ?? '').split(' + ');
  return partes.length > 2 ? `${partes.slice(0, 2).join(' + ')} y ${partes.length - 2} más` : partes.join(' + ');
}

// Los niveles a vigilar, sin el «hay jugada» del escáner (que no sabe si la entrada aún vale).
function queVigilar(esc, moneda) {
  const nk = esc?.niveles_clave;
  if (!nk) return '';
  const p = x => precioTxt(x, moneda);
  const trozos = [];
  if (nk.resistencia) trozos.push(`por arriba ${p(nk.resistencia.precio)} (${nombreCorto(nk.resistencia.nombre)}, ${fmtPct(nk.resistencia.distancia_pct, 1, { signo: true })})`);
  if (nk.soporte) trozos.push(`por abajo ${p(nk.soporte.precio)} (${nombreCorto(nk.soporte.nombre)}, ${fmtPct(nk.soporte.distancia_pct, 1, { signo: true })})`);
  const formando = (esc.setups ?? []).find(x => x.estado === 'formandose' && x.operable);
  let texto = trozos.length ? `Qué vigilar: ${trozos.join('; ')}.` : '';
  if (formando) texto += `${texto ? ' ' : ''}Se está formando: ${formando.nombre.toLowerCase()} en ${formando.intervalo} (se activaría por encima de ${p(formando.nivel_entrada)}).`;
  return texto;
}

function concluir(r, ctx) {
  const { escanear: esc, entrada: ent, salida: plan, riesgo, ticket } = r.pasos;
  const vigilar = queVigilar(esc, ctx.moneda);
  if (!ent) return null;
  const sinJugada = detalle => ({ tipo: 'sin_jugada', frase: 'Hoy no hay jugada según tus reglas.', detalle, vigilar });
  if (ent.estado === 'sin_jugada') return sinJugada(ent.motivo);
  if (NO_VALE.has(ent.estado)) return sinJugada(`Había un setup (${ent.setup.nombre.toLowerCase()} en ${ent.setup.intervalo}), pero la entrada ya no vale: ${ent.motivo}`);
  if (plan && plan.valido === false) return sinJugada(`El setup ${ent.setup.nombre.toLowerCase()} ya no vale: la entrada queda por debajo de su invalidación.`);
  if (ent.hipotetica) {
    return {
      tipo: 'hipotetica',
      frase: 'Hoy no hay jugada según tus reglas. Lo demás es una entrada HIPOTÉTICA al precio de ahora, solo para ver el flujo entero.',
      detalle: riesgo ? `Sobre esa orden hipotética, el gestor de riesgo dice ${riesgo.veredicto}.` : '',
      vigilar,
    };
  }
  const quien = `${ent.setup.nombre} en ${ent.setup.intervalo}`;
  if (ent.estado === 'esperar') {
    return { tipo: 'pendiente', frase: `Hay un setup (${quien}), pero la entrada aún no ha disparado: no es momento de entrar.`, detalle: ent.motivo, vigilar };
  }
  if (riesgo && riesgo.veredicto !== 'PASA') {
    return { tipo: 'bloqueada', frase: `Hay un setup (${quien}), pero tus reglas lo bloquean.`, detalle: riesgo.motivos.join(' '), vigilar };
  }
  if (ticket?.vigente) {
    return { tipo: 'jugada', frase: `Hay jugada en papel: ${quien}. El ticket está listo y solo se abre con tu «sí».`, detalle: ent.motivo, vigilar };
  }
  return { tipo: 'jugada', frase: `Hay un setup (${quien}) con la entrada disparada.`, detalle: ent.motivo, vigilar };
}

/**
 * Corre los pasos en orden hasta `hasta`. Lo que se salta (porque no hay
 * jugada) se escribe como omitido, para que no quede un paso viejo en estado/.
 */
async function flujo(ctx, op, { hasta, noticias = true, maquina = true }) {
  const quiere = paso => PASOS.indexOf(paso) <= PASOS.indexOf(hasta);
  const pasos = {};
  const r = { pasos, hipotetica: false, pidioHipotetica: Boolean(op.hipotetica), conclusion: null };
  const omitirDesde = (paso, motivo) => {
    for (const p of PASOS.slice(PASOS.indexOf(paso))) {
      if (!quiere(p) || pasos[p]) continue;
      if (p === 'noticias' || (p === 'maquina' && !maquina)) continue;
      pasos[p] = omitido(ctx, motivo);
      escribirEstado(p, pasos[p]);
    }
  };
  pasos.escanear = await pasoEscanear(ctx);
  if (noticias && quiere('noticias')) pasos.noticias = await pasoNoticias(ctx);
  if (!quiere('entrada')) return r;
  const ent = await pasoEntrada(ctx, pasos.escanear, op);
  pasos.entrada = ent;
  r.hipotetica = ent.hipotetica === true;
  if (!ent.sigue) {
    omitirDesde('salida', 'No hay jugada: el flujo se para en la entrada.');
    r.conclusion = concluir(r, ctx);
    return r;
  }
  if (!quiere('salida')) return r;
  const plan = pasoSalida(ctx, ent);
  pasos.salida = plan;
  if (plan.valido === false) {
    omitirDesde('maquina', 'La jugada ya no vale: el flujo se para en la salida.');
    r.conclusion = concluir(r, ctx);
    return r;
  }
  if (maquina && quiere('maquina')) pasos.maquina = await pasoMaquina(ctx, ent, plan);
  if (!quiere('presupuesto')) { r.conclusion = concluir(r, ctx); return r; }
  const precio = pasos.escanear.precio_actual?.precio ?? null;
  pasos.presupuesto = pasoPresupuesto(ctx, plan, ent, precio);
  if (!quiere('riesgo')) { r.conclusion = concluir(r, ctx); return r; }
  pasos.riesgo = await pasoRiesgo(ctx, plan, pasos.presupuesto, pasos.noticias, ent, pasos.escanear.precio_actual?.fuente);
  if (!quiere('ticket')) { r.conclusion = concluir(r, ctx); return r; }
  pasos.ticket = pasoTicket(ctx, ent, plan, pasos.presupuesto, pasos.riesgo);
  r.conclusion = concluir(r, ctx);
  return r;
}

function encabezado(ctx, r) {
  const esc = r.pasos.escanear;
  const p = esc?.precio_actual;
  const l = [`BTC EN PAPEL · ${horaTxt(ctx.ahora)} · ${ctx.par} a ${p ? `${fmtDinero(p.precio, ctx.moneda)} (${fuenteTxt(p.fuente)})` : 'precio desconocido'}`];
  if (r.hipotetica) l.push('MODO HIPOTÉTICO: no hay setup; la entrada es inventada al precio de ahora para ver el flujo entero.');
  else if (r.pidioHipotetica && r.pasos.entrada?.setup) l.push(`No hace falta la entrada hipotética: hay un setup real (${r.pasos.entrada.setup.nombre.toLowerCase()} en ${r.pasos.entrada.setup.intervalo}) y se sigue con ese.`);
  return l.join('\n');
}

function textoConclusion(c) {
  if (!c) return '';
  const l = [`CONCLUSIÓN: ${c.frase}`];
  if (c.detalle) l.push(c.detalle);
  if ((c.tipo === 'sin_jugada' || c.tipo === 'pendiente') && c.vigilar) l.push(c.vigilar);
  if (c.tipo === 'sin_jugada') l.push(`Para ver el flujo entero con una entrada hipotética: ${ORDEN_CLI} todo --hipotetica`);
  return l.join('\n');
}

function textoFlujo(ctx, r, { solo = null } = {}) {
  const { pasos } = r;
  const bloques = [encabezado(ctx, r)];
  const poner = (paso, fn) => {
    if (solo && !solo.includes(paso)) return;
    const d = pasos[paso];
    if (!d || d.omitido) return;
    bloques.push(fn(d));
  };
  poner('escanear', textoEscaner);
  poner('noticias', textoNoticias);
  poner('entrada', textoEntrada);
  poner('salida', d => textoSalida(d, ctx.moneda));
  poner('maquina', textoMaquina);
  poner('presupuesto', d => textoPresupuesto(d, ctx.moneda));
  poner('riesgo', d => textoRiesgoCorto(d, { todas: Boolean(solo) }));
  poner('ticket', textoTicket);
  if (r.conclusion) bloques.push(textoConclusion(r.conclusion));
  return bloques.join('\n\n');
}

// ---------------------------------------------------------------- órdenes del flujo

async function ordenTodo(ctx, op) {
  const r = await flujo(ctx, op, { hasta: 'ticket' });
  const datos = {
    version: 1, hora: ctx.ahora, par: ctx.par, moneda: ctx.moneda, hipotetica: r.hipotetica,
    opciones: { hipotetica: Boolean(op.hipotetica), setup: op.setup ?? null },
    conclusion: r.conclusion, pasos: r.pasos,
  };
  escribirEstado('todo', datos);
  return { datos, texto: textoFlujo(ctx, r) };
}

async function ordenPaso(ctx, op, paso) {
  const cfg = {
    escanear: { hasta: 'escanear', noticias: false },
    entrada: { hasta: 'entrada', noticias: false },
    salida: { hasta: 'salida', noticias: false },
    maquina: { hasta: 'maquina', noticias: false },
    presupuesto: { hasta: 'presupuesto', noticias: false, maquina: false },
    riesgo: { hasta: 'riesgo', maquina: false },
    ticket: { hasta: 'ticket', maquina: false },
  }[paso];
  const r = await flujo(ctx, op, cfg);
  const datos = r.pasos[paso] ?? { omitido: true, motivo: r.conclusion?.detalle ?? 'No hay jugada.', hora: ctx.ahora };
  const solo = r.pasos[paso] && !r.pasos[paso].omitido ? [paso] : ['entrada', paso];
  return { datos: { ...datos, conclusion: r.conclusion }, texto: textoFlujo(ctx, r, { solo }) };
}

async function ordenNoticias(ctx) {
  const d = await pasoNoticias(ctx);
  return { datos: d, texto: `BTC EN PAPEL · ${horaTxt(ctx.ahora)}\n\n${textoNoticias(d)}` };
}

// maquina/presupuesto con cifras a mano: --entrada N --stop N [--objetivo N]
async function ordenMaquinaManual(ctx, op) {
  const entrada = leerNumero(op.entrada, 'la entrada (--entrada)');
  const stop = leerNumero(op.stop, 'el stop (--stop)');
  const rr = ctx.config.salida?.rr_objetivo ?? 2;
  const objetivo = op.objetivo !== undefined ? leerNumero(op.objetivo, 'el objetivo (--objetivo)') : Math.round((entrada + rr * (entrada - stop)) * 100) / 100;
  const id = op.setup !== undefined ? sinTildes(String(op.setup).trim()) : null;
  if (id && !SETUPS.some(s => s.id === id)) throw new ErrorUso(`No conozco el setup «${op.setup}». Los que hay: ${SETUPS.map(s => s.id).join(', ')}.`);
  const horas = opcionesMaquina(ctx.config).horas;
  const d = await pasoMaquina(ctx, { setup: null, hipotetica: false, setupId: id }, { entrada, stop, objetivo, horas_max: horas });
  return { datos: d, texto: `BTC EN PAPEL · ${horaTxt(ctx.ahora)} · plan a mano: entrada ${precioTxt(entrada, ctx.moneda)}, stop ${precioTxt(stop, ctx.moneda)}, objetivo ${precioTxt(objetivo, ctx.moneda)}\n\n${textoMaquina(d)}` };
}

function ordenPresupuestoManual(ctx, op) {
  const entrada = leerNumero(op.entrada, 'la entrada (--entrada)');
  const stop = leerNumero(op.stop, 'el stop (--stop)');
  const d = pasoPresupuesto(ctx, { entrada, stop, direccion: stop < entrada ? 'larga' : 'corta' }, { hipotetica: false }, entrada);
  return { datos: d, texto: `BTC EN PAPEL · ${horaTxt(ctx.ahora)}\n\n${textoPresupuesto(d, ctx.moneda)}` };
}

// ---------------------------------------------------------------- papel

function confirmado(texto) {
  const t = typeof texto === 'string' ? texto.normalize('NFC') : null;
  return t === 'sí' || t === 'si';
}

async function precioAhora(ctx) {
  const cruzados = await cruzar(ctx);
  return { cruzados, ref: precioDeReferencia(cruzados, ctx.config.fuente) };
}

async function papelEstado(ctx) {
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  const { ref } = cartera.posiciones.length ? await precioAhora(ctx) : { ref: null };
  const resumen = resumenCartera(cartera, ref?.precio ?? null, ctx.ahora);
  const ultimas = cartera.historial.slice(-5).reverse();
  const d = { hora: ctx.ahora, precio: ref, resumen, ultimas_cerradas: ultimas };
  escribirEstado('papel-estado', d);
  const m = x => fmtDinero(x, resumen.moneda);
  const l = [`BTC EN PAPEL · ${horaTxt(ctx.ahora)}${ref ? ` · ${ctx.par} a ${fmtDinero(ref.precio, ctx.moneda)} (${fuenteTxt(ref.fuente)})` : ''}`, '', textoCartera(resumen)];
  if (resumen.operaciones_cerradas) {
    l.push(`Cerradas en total: ${resumen.operaciones_cerradas} (${resumen.ganadas} con ganancia${esNum(resumen.acierto_pct) ? `, ${fmtPct(resumen.acierto_pct, 0)}` : ''}).`);
    for (const h of ultimas) {
      l.push(`  · ${h.id} (${h.motivo}): ${h.pnl >= 0 ? 'ganó' : 'perdió'} ${m(Math.abs(h.pnl))}, cerrada el ${fmtHora(h.cerrada)}.`);
    }
  }
  for (const a of resumen.avisos ?? []) l.push(`Aviso: ${a}`);
  return { datos: d, texto: l.join('\n') };
}

async function papelAbrir(ctx, op) {
  // Primero lo que no necesita red: sin «sí» no se mira nada más.
  if (!confirmado(op.confirmar)) {
    const vino = op.confirmar === undefined || op.confirmar === '' ? 'nada' : `«${op.confirmar}»`;
    throw new ErrorUso(`No se abre nada: para abrir EN PAPEL hay que escribir --confirmar sí (llegó ${vino}). La cartera no se ha tocado.`);
  }
  const t = leerEstado('ticket');
  if (!t || t.omitido || !t.orden || !(t.orden.btc > 0) || !t.texto) {
    throw new ErrorUso(`No hay ningún ticket con orden que abrir: corre primero ${ORDEN_CLI} todo. La cartera no se ha tocado.`);
  }
  if (t.usado) throw new ErrorUso(`Ese ticket ya se abrió como ${t.usado}. Para otra operación, corre otra vez ${ORDEN_CLI} todo. La cartera no se ha tocado.`);
  if (t.hipotetica && !op.hipotetica) {
    throw new ErrorUso('El último ticket es HIPOTÉTICO (no sale de ningún setup). Si de verdad quieres practicar con él en papel, ' +
      `repite la orden con --hipotetica: ${ORDEN_CLI} papel abrir --confirmar sí --hipotetica. La cartera no se ha tocado.`);
  }
  if (!t.hipotetica && t.entrada_estado !== 'disparo') {
    throw new ErrorUso(`La entrada de ese ticket no había disparado (estado: ${ESTADO_ENTRADA[t.entrada_estado] ?? t.entrada_estado}). ` +
      `Vuelve a correr ${ORDEN_CLI} todo cuando dispare. La cartera no se ha tocado.`);
  }
  if (esNum(t.caduca_en) && ctx.ahora > t.caduca_en) {
    throw new ErrorUso(`Ese ticket caducó el ${fmtHora(t.caduca_en)}. Corre otra vez ${ORDEN_CLI} todo. La cartera no se ha tocado.`);
  }

  // El riesgo se vuelve a pasar con el precio, la cartera y las noticias de ahora mismo.
  const { cruzados, ref } = await precioAhora(ctx);
  const bloqueoMin = esNum(ctx.config.riesgo?.bloqueo_noticias_min) ? ctx.config.riesgo.bloqueo_noticias_min : 30;
  const noticias = await (async () => {
    try {
      const n = await leerNoticias({ horas: Math.max(1, (bloqueoMin + 30) / 60), fetch: ctx.red.fetch ?? globalThis.fetch, ahora: ctx.ahora });
      return n.fuentes.some(f => f.ok) ? altoImpacto(n.noticias) : undefined;
    } catch {
      return undefined;
    }
  })();
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  const cuenta = resumenCartera(cartera, ref?.precio ?? null, ctx.ahora);
  const orden = { lado: t.orden.lado, btc: t.orden.btc, entrada: t.orden.entrada, stop: t.orden.stop, objetivo: t.orden.objetivo };
  const riesgo = comprobar({
    orden, cuenta, config: ctx.config,
    contexto: { ahora: ctx.ahora, precio_actual: ref?.precio ?? null, noticias_alto_impacto: noticias, divergencia_pct: divergenciaDe(cruzados) },
  });
  if (riesgo.veredicto !== 'PASA') {
    escribirEstado('papel-abrir', { hora: ctx.ahora, abierta: false, riesgo, precio: ref });
    throw new Error(`No se abre nada: ahora mismo el gestor de riesgo dice ${riesgo.veredicto}. ${riesgo.motivos.join(' ')} La cartera no se ha tocado.`);
  }
  const res = abrir({ cartera, orden: { ...t.orden }, riesgo, confirmacion: op.confirmar, precio: ref.precio, ahora: ctx.ahora, config: ctx.config });
  guardarCartera(res.cartera);
  escribirEstado('ticket', { ...t, usado: res.posicion.id, vigente: false, motivo_no_vigente: `ya se abrió como ${res.posicion.id}.` });
  const resumen = resumenCartera(res.cartera, ref.precio, ctx.ahora);
  const d = { hora: ctx.ahora, abierta: true, hipotetica: t.hipotetica, posicion: res.posicion, riesgo, precio: ref, avisos: res.avisos, resumen };
  escribirEstado('papel-abrir', d);
  const l = [`BTC EN PAPEL · ${horaTxt(ctx.ahora)} · ${ctx.par} a ${fmtDinero(ref.precio, ctx.moneda)} (${fuenteTxt(ref.fuente)})`, ''];
  l.push(`${t.hipotetica ? 'HIPOTÉTICA · ' : ''}${res.texto}`);
  for (const a of res.avisos) l.push(`Aviso: ${a}`);
  l.push(`Riesgo vuelto a pasar con el precio de ahora: ${riesgo.veredicto}.`);
  l.push(`Para que se cierre sola si toca stop, objetivo u hora: ${ORDEN_CLI} papel revisar (sirve con /loop).`);
  return { datos: d, texto: l.join('\n') };
}

async function papelRevisar(ctx) {
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  const avisos = [];
  let velasRev = [];
  let ref = null;
  if (cartera.posiciones.length) {
    const desde = Math.min(...cartera.posiciones.map(p => Math.max(p.abierta, p.revisada_hasta ?? p.abierta))) - M5;
    try {
      velasRev = await serie(ctx, '5m', { desde: Math.max(desde, ctx.ahora - 60 * DIA) });
    } catch (e) {
      avisos.push(`No se pudieron leer las velas de 5 min (${e.message}): solo se mira el precio de ahora.`);
    }
    ({ ref } = await precioAhora(ctx));
    if (!ref) avisos.push('No respondió ningún exchange con el precio de ahora.');
  }
  const res = revisar({ cartera, velas: velasRev, precio: ref?.precio ?? null, ahora: ctx.ahora, intervalo: '5m' });
  if (cartera.posiciones.length) guardarCartera(res.cartera);
  const resumen = resumenCartera(res.cartera, ref?.precio ?? null, ctx.ahora);
  const d = { hora: ctx.ahora, precio: ref, cerradas: res.cerradas, abiertas: res.abiertas, avisos: [...avisos, ...res.avisos], resumen };
  escribirEstado('papel-revisar', d);
  const l = [`BTC EN PAPEL · ${horaTxt(ctx.ahora)}${ref ? ` · ${ctx.par} a ${fmtDinero(ref.precio, ctx.moneda)} (${fuenteTxt(ref.fuente)})` : ''}`, '', res.texto, '', textoCartera(resumen)];
  for (const a of d.avisos) l.push(`Aviso: ${a}`);
  return { datos: d, texto: l.join('\n') };
}

async function papelCerrar(ctx, id) {
  if (!id) throw new ErrorUso(`Falta el id de la posición: ${ORDEN_CLI} papel cerrar <id> (los ids salen en «papel estado»).`);
  const cartera = cargarCartera(ctx.config, { ahora: ctx.ahora });
  if (!cartera.posiciones.some(p => p.id === id)) {
    const ids = cartera.posiciones.map(p => p.id).join(', ');
    throw new ErrorUso(`No hay ninguna posición abierta con id «${id}». ${ids ? `Abiertas: ${ids}.` : 'No hay posiciones abiertas.'}`);
  }
  const { ref } = await precioAhora(ctx);
  if (!ref) throw new Error('No respondió ningún exchange con el precio de ahora: no se puede cerrar a mercado. La cartera no se ha tocado.');
  const res = cerrar({ cartera, id, precio: ref.precio, ahora: ctx.ahora });
  guardarCartera(res.cartera);
  const resumen = resumenCartera(res.cartera, ref.precio, ctx.ahora);
  const d = { hora: ctx.ahora, precio: ref, cerrada: res.cerrada, resumen };
  escribirEstado('papel-cerrar', d);
  return { datos: d, texto: [`BTC EN PAPEL · ${horaTxt(ctx.ahora)} · ${ctx.par} a ${fmtDinero(ref.precio, ctx.moneda)}`, '', res.texto, '', textoCartera(resumen)].join('\n') };
}

// ---------------------------------------------------------------- alertas

function textoAlerta(a, moneda) {
  const nota = a.nota ? ` · ${a.nota}` : '';
  return `${a.id}: avisa si BTC ${a.tipo === 'sobre' ? 'sube a' : 'baja a'} ${fmtDinero(a.nivel, moneda)} (creada el ${fmtHora(a.creada)})${nota}`;
}

async function ordenAlertas(ctx, pos, op) {
  const sub = sinTildes(pos[1] ?? 'lista');
  const cab = `BTC EN PAPEL · ${horaTxt(ctx.ahora)}`;
  if (sub === 'lista') {
    const lista = listarAlertas({ todas: Boolean(op.todas) });
    const d = { hora: ctx.ahora, alertas: lista };
    escribirEstado('alertas-lista', d);
    return { datos: d, texto: `${cab}\n\n${lista.length ? lista.map(a => textoAlerta(a, ctx.moneda)).join('\n') : 'No hay alertas pendientes.'}` };
  }
  if (sub === 'sobre' || sub === 'bajo') {
    const nivel = leerNumero(pos[2], 'el nivel de la alerta');
    const nota = op.nota ?? pos.slice(3).join(' ');
    const { ref } = await precioAhora(ctx);
    const alerta = anadirAlerta({ tipo: sub, nivel, nota, precio: ref?.precio, ahora: ctx.ahora, moneda: ctx.moneda });
    const d = { hora: ctx.ahora, alerta, precio: ref };
    escribirEstado('alertas-nueva', d);
    const ahora = ref ? ` BTC está ahora en ${fmtDinero(ref.precio, ctx.moneda)} (${fuenteTxt(ref.fuente)}).` : ' (No se pudo leer el precio de ahora.)';
    return { datos: d, texto: `${cab}\n\nAlerta guardada. ${textoAlerta(alerta, ctx.moneda)}.${ahora}\nPara mirarlas: ${ORDEN_CLI} alertas comprobar (sirve con /loop).` };
  }
  if (sub === 'borrar') {
    const a = borrarAlerta(pos[2]);
    return { datos: { hora: ctx.ahora, borrada: a }, texto: `${cab}\n\nBorrada: ${textoAlerta(a, ctx.moneda)}.` };
  }
  if (sub === 'comprobar') {
    const pendientes = listarAlertas();
    let velasA = [];
    let ref = null;
    const avisos = [];
    if (pendientes.length) {
      const desde = Math.min(...pendientes.map(a => a.comprobada_hasta ?? a.creada)) - M5;
      try {
        velasA = await serie(ctx, '5m', { desde: Math.max(desde, ctx.ahora - 60 * DIA) });
      } catch (e) {
        avisos.push(`No se pudieron leer las velas de 5 min (${e.message}): solo se mira el precio de ahora.`);
      }
      ({ ref } = await precioAhora(ctx));
    }
    const res = comprobarAlertas({ velas: velasA, precio: ref?.precio ?? null, ahora: ctx.ahora, intervalo: '5m', moneda: ctx.moneda });
    const d = { hora: ctx.ahora, precio: ref, saltadas: res.saltadas, pendientes: res.pendientes, avisos };
    escribirEstado('alertas-comprobar', d);
    const l = [`${cab}${ref ? ` · ${ctx.par} a ${fmtDinero(ref.precio, ctx.moneda)}` : ''}`, '', res.texto];
    for (const a of avisos) l.push(`Aviso: ${a}`);
    return { datos: d, texto: l.join('\n') };
  }
  throw new ErrorUso(`No conozco «alertas ${pos[1]}». Vale: alertas lista | alertas sobre <nivel> [nota] | alertas bajo <nivel> [nota] | alertas borrar <id> | alertas comprobar.`);
}

// ---------------------------------------------------------------- informe

function sello(ms) {
  const p = {};
  for (const { type, value } of new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(ms)) p[type] = value;
  return `${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}`;
}

function datosInforme(ctx) {
  const todo = leerEstado('todo');
  if (!todo || !todo.pasos?.escanear) throw new ErrorUso(`Aún no hay nada que poner en el informe: corre primero ${ORDEN_CLI} todo.`);
  let cartera = null;
  let errorCartera = null;
  try {
    const c = cargarCartera(ctx.config, { ahora: ctx.ahora });
    const pr = todo.pasos.escanear.precio_actual ?? null;
    cartera = { resumen: resumenCartera(c, pr?.precio ?? null, ctx.ahora), historial: c.historial.slice(-8).reverse(), precio_de: pr };
  } catch (e) {
    errorCartera = e.message;
  }
  // Si el ticket de esta pasada se abrió después, que el informe lo diga.
  const pasos = { ...todo.pasos };
  const ticketAhora = leerEstado('ticket');
  if (ticketAhora && pasos.ticket && ticketAhora.hora === pasos.ticket.hora) pasos.ticket = ticketAhora;
  return { ...todo, pasos, cartera, error_cartera: errorCartera, generado: ctx.ahora };
}

function ordenInforme(ctx, op) {
  const datos = datosInforme(ctx);
  const html = op.fragmento ? paginaInforme(datos) : documentoInforme(datos);
  const ruta = op.salida
    ? path.resolve(op.salida)
    : path.join(dirEstado(), `informe-${sello(ctx.ahora)}${op.fragmento ? '-fragmento' : ''}.html`);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, html);
  const d = { hora: ctx.ahora, ruta, fragmento: Boolean(op.fragmento), bytes: Buffer.byteLength(html), datos_de: datos.hora };
  escribirEstado('informe', d);
  const que = op.fragmento ? 'Fragmento HTML (para publicarlo como artefacto) guardado' : 'Página HTML (para abrirla en el navegador) guardada';
  return {
    datos: d,
    texto: `BTC EN PAPEL · ${horaTxt(ctx.ahora)}\n\n${que} en ${ruta} (${fmtN(Math.round(d.bytes / 1024))} KB), con los datos de ${horaTxt(datos.hora)}.`,
  };
}

// ---------------------------------------------------------------- ayuda y ejecutar

const AYUDA = `BTC en papel: analiza bitcoin y opera SOLO EN PAPEL (sin dinero real, sin bróker, sin claves).

Uso: ${ORDEN_CLI} <orden> [opciones]

  todo [--hipotetica] [--setup <id>]   escáner → noticias → entrada → salida → máquina del tiempo
                                        → presupuesto → riesgo → ticket, y se para ahí
  escanear                              escáner de gráficos (15m, 1h, 4h, 1d)
  noticias                              noticias que mueven BTC y el índice de miedo y codicia
  entrada | salida                      temporizador de entrada y plan de salida del mejor setup
  maquina [--entrada N --stop N [--objetivo N] [--setup <id>]]
                                        máquina del tiempo (10.000 futuros) e histórico de la regla
  presupuesto [--entrada N --stop N]    cuánto BTC comprar sin pasar de tus límites
  riesgo | ticket                       repasa la orden contra tus reglas | prepara el ticket
  papel [estado]                        tu cartera de papel
  papel abrir --confirmar sí            abre EN PAPEL el último ticket (vuelve a pasar el riesgo)
  papel revisar                         cierra lo que haya tocado stop, objetivo u hora (para /loop)
  papel cerrar <id>                     cierra a mano al precio de ahora
  alertas [lista] | alertas sobre|bajo <nivel> [nota] | alertas borrar <id> | alertas comprobar
  informe [--fragmento] [--salida <ruta.html>]   página HTML con lo último de «todo»

Opciones: --json saca el JSON en vez del resumen. Setups: ${SETUPS.map(s => s.id).join(', ')}.
Tus reglas están en estado/config.json.`;

function escritor(salida) {
  if (typeof salida === 'function') return t => salida(t);
  if (salida && typeof salida.write === 'function') return t => salida.write(t);
  return t => process.stdout.write(t);
}

/**
 * ejecutar(argv, { fetch, ahora, salida, cache, pausaMs, esperar }) → { codigo, texto, datos }
 * argv sin «node» ni el nombre del script (p. ej. ['todo', '--hipotetica']).
 * Escribe el resumen (o el JSON con --json) en `salida` y acaba siempre con el AVISO.
 */
export async function ejecutar(argv = [], opciones = {}) {
  const escribir = escritor(opciones?.salida);
  let json = Array.isArray(argv) && argv.includes('--json');
  try {
    const { pos, op } = leerArgumentos(argv);
    json = Boolean(op.json);
    const orden = sinTildes(pos[0] ?? 'ayuda');
    if (op.ayuda || orden === 'ayuda') {
      const texto = `${AYUDA}\n\n${AVISO}\n`;
      escribir(texto);
      return { codigo: 0, texto, datos: null };
    }
    const ctx = crearContexto(opciones ?? {});
    let r;
    if (orden === 'todo') r = await ordenTodo(ctx, op);
    else if (orden === 'noticias') r = await ordenNoticias(ctx);
    else if (orden === 'maquina' && (op.entrada !== undefined || op.stop !== undefined)) r = await ordenMaquinaManual(ctx, op);
    else if (orden === 'presupuesto' && (op.entrada !== undefined || op.stop !== undefined)) r = ordenPresupuestoManual(ctx, op);
    else if (['escanear', 'entrada', 'salida', 'maquina', 'presupuesto', 'riesgo', 'ticket'].includes(orden)) r = await ordenPaso(ctx, op, orden);
    else if (orden === 'papel') {
      const sub = sinTildes(pos[1] ?? 'estado');
      if (sub === 'estado') r = await papelEstado(ctx);
      else if (sub === 'abrir') r = await papelAbrir(ctx, op);
      else if (sub === 'revisar') r = await papelRevisar(ctx);
      else if (sub === 'cerrar') r = await papelCerrar(ctx, pos[2]);
      else throw new ErrorUso(`No conozco «papel ${pos[1]}». Vale: papel estado | papel abrir --confirmar sí | papel revisar | papel cerrar <id>.`);
    } else if (orden === 'alertas') r = await ordenAlertas(ctx, pos, op);
    else if (orden === 'informe') r = ordenInforme(ctx, op);
    else throw new ErrorUso(`No conozco la orden «${pos[0]}».\n\n${AYUDA}`);
    const texto = json ? `${JSON.stringify({ ...r.datos, aviso: AVISO }, null, 2)}\n` : `${r.texto}\n\n${AVISO}\n`;
    escribir(texto);
    return { codigo: 0, texto, datos: r.datos };
  } catch (e) {
    const mensaje = e?.message ?? String(e);
    const texto = json
      ? `${JSON.stringify({ error: mensaje, aviso: AVISO }, null, 2)}\n`
      : `${e instanceof ErrorUso ? '' : 'No se ha podido completar la orden: '}${mensaje}\n\n${AVISO}\n`;
    escribir(texto);
    return { codigo: 1, texto, datos: null, error: mensaje };
  }
}

// Solo se lee process.argv cuando se ejecuta directamente (no al importarlo en las pruebas).
const directo = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (directo) {
  const r = await ejecutar(process.argv.slice(2));
  process.exitCode = r.codigo;
}
