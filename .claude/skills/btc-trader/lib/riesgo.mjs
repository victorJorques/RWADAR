// Gestor de riesgo de «BTC en papel»: repasa una orden contra tus reglas y
// dice PASA o BLOQUEADA, cada regla con su porqué en llano y con cifras. No
// opera; el bróker en papel no abre nada sin un PASA de aquí.
import { diaMadrid, fmtBtc, fmtDinero, fmtHora, fmtPct } from './comun.mjs';
import { costeConCostes, fmtFrente, gananciaPorBtc, leerReglas, r2, riesgoPorBtc } from './presupuesto.mjs';
import { resumenCartera } from './papel.mjs';

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const MIN_MS = 60_000;
// Las reglas de dinero comparan importes en céntimos (los que se enseñan); la
// holgura evita que el binario (150,00000000001) bloquee lo que está justo en el límite.
const HOLGURA = 1e-9;
const formatosN = new Map();
function fmtN(x, dec = 2) {
  if (!esNum(x)) return '—';
  if (!formatosN.has(dec)) formatosN.set(dec, new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec }));
  return formatosN.get(dec).format(x);
}

/** Las reglas en el orden en que se comprueban, con su nombre en llano. */
export const REGLAS = Object.freeze([
  Object.freeze({ regla: 'solo_papel', nombre: 'Solo papel' }),
  Object.freeze({ regla: 'solo_largos', nombre: 'Solo compras (salvo cortos activados)' }),
  Object.freeze({ regla: 'sin_apalancamiento', nombre: 'Sin apalancamiento' }),
  Object.freeze({ regla: 'perdida_max_operacion', nombre: 'Pérdida máxima por operación' }),
  Object.freeze({ regla: 'perdida_max_dia', nombre: 'Pérdida máxima del día' }),
  Object.freeze({ regla: 'operaciones_dia', nombre: 'Operaciones por día' }),
  Object.freeze({ regla: 'rr_minimo', nombre: 'R:R mínimo' }),
  Object.freeze({ regla: 'posicion_max', nombre: 'Tamaño máximo de la posición' }),
  Object.freeze({ regla: 'efectivo', nombre: 'Efectivo disponible' }),
  Object.freeze({ regla: 'ventana_entrada', nombre: 'Ventana de entrada (UTC)' }),
  Object.freeze({ regla: 'noticias', nombre: 'Noticias de alto impacto' }),
  Object.freeze({ regla: 'divergencia', nombre: 'Mismo precio en los exchanges' }),
  Object.freeze({ regla: 'coherencia', nombre: 'Stop, entrada y objetivo en orden' }),
  Object.freeze({ regla: 'precio_cerca', nombre: 'Precio actual cerca de la entrada' }),
]);

function aMs(x) {
  if (x instanceof Date) return Number.isFinite(x.getTime()) ? x.getTime() : null;
  if (esNum(x)) return x;
  if (typeof x === 'string' && x.trim()) {
    const t = Date.parse(x);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const hhmm = horas => {
  const total = Math.round(horas * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** '8', 8.5 o '08:30' → horas (8, 8.5, 8.5); null si no vale. */
function horaDe(x) {
  if (esNum(x)) return x >= 0 && x <= 24 ? x : null;
  if (typeof x === 'string') {
    const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*$/.exec(x);
    if (!m) return null;
    const h = Number(m[1]) + Number(m[2] ?? 0) / 60;
    return Number(m[2] ?? 0) < 60 && h <= 24 ? h : null;
  }
  return null;
}

function reglaVentana(ventana, ahora) {
  if (ventana === null || ventana === undefined) {
    return { ok: true, detalle: 'Sin ventana horaria: BTC cotiza a todas horas.' };
  }
  const d = new Date(ahora);
  const ahoraH = d.getUTCHours() + d.getUTCMinutes() / 60;
  const ahoraTxt = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  const desde = Array.isArray(ventana) && ventana.length === 2 ? horaDe(ventana[0]) : null;
  const hasta = Array.isArray(ventana) && ventana.length === 2 ? horaDe(ventana[1]) : null;
  if (desde === null || hasta === null || desde === hasta) {
    return {
      ok: false,
      detalle: `config.riesgo.ventana_entrada_utc no se entiende (${JSON.stringify(ventana)}): debe ser null o [desde, hasta] en horas UTC, por ejemplo [8, 20].`,
    };
  }
  // Si «desde» es mayor que «hasta», la ventana cruza la medianoche (p. ej. [22, 6]).
  const dentro = desde < hasta ? ahoraH >= desde && ahoraH < hasta : ahoraH >= desde || ahoraH < hasta;
  const texto = `Son las ${ahoraTxt} UTC (${fmtHora(ahora)} en Madrid) y tu ventana de entrada es de ${hhmm(desde)} a ${hhmm(hasta)} UTC`;
  return { ok: dentro, detalle: dentro ? `${texto}.` : `${texto}: fuera de ella no se entra.` };
}

function reglaNoticias(lista, bloqueoMin, ahora, avisos) {
  if (!Array.isArray(lista)) {
    avisos.push('No llegaron las noticias de alto impacto: no se ha podido comprobar si acaba de salir alguna.');
    return { ok: true, detalle: 'Sin datos de noticias: no se ha podido comprobar (mira las noticias antes de entrar).' };
  }
  const ventanaMs = bloqueoMin * MIN_MS;
  const recientes = lista
    .map(n => ({ titulo: typeof n?.titulo === 'string' && n.titulo.trim() ? n.titulo.trim() : 'sin título', t: aMs(n?.fecha) }))
    .filter(n => n.t !== null && Math.abs(ahora - n.t) < ventanaMs) // también las de dentro de un rato (eventos con hora)
    .sort((a, b) => b.t - a.t);
  if (!recientes.length) {
    return { ok: true, detalle: `Ninguna noticia de alto impacto en los últimos ${fmtN(bloqueoMin)} minutos.` };
  }
  const n = recientes[0];
  const min = Math.floor((ahora - n.t) / MIN_MS);
  const cuando = n.t > ahora ? `Dentro de ${plural(Math.ceil((n.t - ahora) / MIN_MS), 'minuto', 'minutos')} sale`
    : min < 1 ? 'Hace menos de 1 min salió' : `Hace ${min} min salió`;
  const mas = recientes.length > 1 ? ` (y ${plural(recientes.length - 1, 'otra', 'otras')})` : '';
  return {
    ok: false,
    detalle: `${cuando} «${n.titulo}»${mas}, de alto impacto: espera a que pasen ${fmtN(bloqueoMin)} min, hasta las ${fmtHora(n.t + ventanaMs)}.`,
  };
}

/** Lo que perdería una posición abierta si salta su stop (lo trae el resumen; si no, la fórmula). */
function perdidaPosicion(p, reglas) {
  if (esNum(p?.perdida_si_stop)) return Math.max(0, p.perdida_si_stop);
  const entrada = p?.precio_entrada ?? p?.entrada;
  if (!esNum(p?.btc) || !esNum(entrada) || !esNum(p?.stop)) return 0;
  const enContra = (p.lado === 'corta' ? p.stop > entrada : p.stop < entrada);
  return enContra ? p.btc * riesgoPorBtc(entrada, p.stop, reglas) : 0;
}

/**
 * comprobar({ orden, cuenta, config, contexto }) →
 * { veredicto: 'PASA'|'BLOQUEADA', comprobaciones: [{ regla, nombre, ok, detalle }],
 *   motivos: [], avisos: [], cifras: {…}, orden, dia, hora }
 *
 * - orden = { lado, btc, entrada, stop, objetivo }
 * - cuenta = resumenCartera(…) (efectivo, capital, pnl_hoy, operaciones_hoy,
 *   posiciones). También vale la cartera entera: se resume aquí.
 * - contexto = { ahora, precio_actual, noticias_alto_impacto: [{ titulo, fecha }], divergencia_pct }
 * PASA solo si todas las reglas dan ok. Sin noticias o sin divergencia
 * (no llegaron los datos) la regla pasa con un aviso; sin precio actual, bloquea.
 */
export function comprobar({ orden, cuenta, config, contexto } = {}) {
  if (!esObjeto(orden)) throw new Error('comprobar: falta la orden ({ lado, btc, entrada, stop, objetivo }).');
  if (!esObjeto(cuenta)) {
    throw new Error('comprobar: falta la cuenta (el resumen de la cartera de papel: efectivo, capital, pnl_hoy, operaciones_hoy, posiciones).');
  }
  const reglas = leerReglas(config);
  const ctx = esObjeto(contexto) ? contexto : {};
  const ahora = aMs(ctx.ahora) ?? Date.now();
  const dia = diaMadrid(ahora);
  const precioActual = esNum(ctx.precio_actual) && ctx.precio_actual > 0 ? ctx.precio_actual : null;
  const m = x => fmtDinero(x, reglas.moneda);
  const avisos = [];

  // Si llega la cartera entera (con historial y sin operaciones_hoy), se resume aquí.
  const resumen = Array.isArray(cuenta.historial) && cuenta.operaciones_hoy === undefined
    ? resumenCartera(cuenta, precioActual, ahora)
    : cuenta;

  const lado = orden.lado ?? orden.direccion ?? 'larga';
  const { btc, entrada, stop, objetivo } = orden;
  const larga = lado === 'larga';
  const numerosOk = [btc, entrada, stop, objetivo].every(x => esNum(x) && x > 0);
  const ladoOk = lado === 'larga' || lado === 'corta';
  const enOrden = numerosOk && ladoOk && (larga ? stop < entrada && entrada < objetivo : objetivo < entrada && entrada < stop);
  const tamanoOk = esNum(btc) && btc > 0 && esNum(entrada) && entrada > 0;
  const sinComprobar = 'Sin comprobar: la orden no trae BTC, entrada, stop y objetivo válidos y en orden.';

  const efectivo = esNum(resumen.efectivo) ? resumen.efectivo : null;
  const capital = esNum(resumen.capital) ? resumen.capital : efectivo;
  const nominal = tamanoOk ? btc * entrada : null;
  const coste = tamanoOk ? costeConCostes(btc, entrada, reglas) : null;
  const rpb = enOrden ? riesgoPorBtc(entrada, stop, reglas) : null;
  const perdida = enOrden ? btc * rpb : null;
  const resultado = {};
  let huecoDia = null; // lo máximo que esta orden puede perder hoy sin pasar del límite diario

  // 1. Solo papel.
  resultado.solo_papel = reglas.papel
    ? { ok: true, detalle: 'Modo papel: no se mueve dinero real.' }
    : { ok: false, detalle: `config.papel no está en true (está en ${JSON.stringify(config?.papel ?? null)}): este paquete solo opera en papel.` };

  // 2. Solo largos (salvo cortos activados).
  if (!ladoOk) resultado.solo_largos = { ok: false, detalle: `El lado de la orden debe ser 'larga' o 'corta' (llegó ${JSON.stringify(lado)}).` };
  else if (larga) resultado.solo_largos = { ok: true, detalle: 'Es una compra (larga).' };
  else if (reglas.cortos) resultado.solo_largos = { ok: true, detalle: 'Es un corto y tienes los cortos activados (riesgo.cortos = true).' };
  else resultado.solo_largos = { ok: false, detalle: 'Es una venta en corto y tienes los cortos desactivados (riesgo.cortos = false).' };

  // 3. Sin apalancamiento: lo que mueve la orden cabe en el efectivo.
  if (reglas.apalancamiento) {
    resultado.sin_apalancamiento = { ok: false, detalle: 'riesgo.apalancamiento está en true, pero este paquete no simula apalancamiento: ponlo en false.' };
  } else if (!tamanoOk) {
    resultado.sin_apalancamiento = { ok: false, detalle: sinComprobar };
  } else if (efectivo === null) {
    resultado.sin_apalancamiento = { ok: false, detalle: 'La cuenta no trae el efectivo: no se puede comprobar.' };
  } else {
    const ok = r2(nominal) <= efectivo + HOLGURA;
    resultado.sin_apalancamiento = {
      ok,
      detalle: ok
        ? `La orden mueve ${m(r2(nominal))} y tienes ${m(efectivo)} en efectivo: no hace falta dinero prestado.`
        : `La orden mueve ${m(r2(nominal))} y solo tienes ${m(efectivo)} en efectivo: haría falta apalancamiento y aquí no se usa.`,
    };
  }

  // 4. Pérdida máxima por operación.
  if (!enOrden) {
    resultado.perdida_max_operacion = { ok: false, detalle: sinComprobar };
  } else {
    // Se compara en céntimos, lo mismo que se enseña en el detalle.
    const ok = r2(perdida) <= reglas.perdida_max_operacion + HOLGURA;
    resultado.perdida_max_operacion = {
      ok,
      detalle: `Si salta el stop pierdes ${m(r2(perdida))}; tu límite por operación es ${m(reglas.perdida_max_operacion)}.` +
        (ok ? '' : ' Reduce el tamaño (presupuesto) o acerca el stop.'),
    };
  }

  // 5. Pérdida máxima del día (de Madrid), contando esta orden en el peor caso.
  const diaResumen = typeof resumen.dia === 'string' ? resumen.dia : null;
  const resumenViejo = diaResumen !== null && diaResumen !== dia;
  if (resumenViejo) {
    const detalle = `El resumen de la cartera es del ${diaResumen} y hoy es ${dia} (día de Madrid): vuelve a calcularlo.`;
    resultado.perdida_max_dia = { ok: false, detalle };
    resultado.operaciones_dia = { ok: false, detalle };
  } else {
    if (!enOrden) {
      resultado.perdida_max_dia = { ok: false, detalle: sinComprobar };
    } else {
      if (!esNum(resumen.pnl_hoy)) avisos.push('La cuenta no trae pnl_hoy: se cuenta como 0.');
      const perdidoHoy = Math.max(0, -(esNum(resumen.pnl_hoy) ? resumen.pnl_hoy : 0));
      const abiertas = (Array.isArray(resumen.posiciones) ? resumen.posiciones : []).reduce((s, p) => s + perdidaPosicion(p, reglas), 0);
      const total = perdidoHoy + abiertas + perdida;
      huecoDia = Math.max(0, r2(reglas.perdida_max_dia - perdidoHoy - abiertas));
      const ok = r2(total) <= reglas.perdida_max_dia + HOLGURA;
      resultado.perdida_max_dia = {
        ok,
        detalle: `Hoy llevas ${m(r2(perdidoHoy))} perdidos, las posiciones abiertas pueden perder ${m(r2(abiertas))} más y esta orden ${m(r2(perdida))}: ` +
          `en el peor caso ${m(r2(total))} de un límite diario de ${m(reglas.perdida_max_dia)}.`,
      };
    }
    // 6. Operaciones por día.
    if (!(Number.isInteger(resumen.operaciones_hoy) && resumen.operaciones_hoy >= 0)) {
      resultado.operaciones_dia = { ok: false, detalle: `La cuenta no trae operaciones_hoy (llegó ${JSON.stringify(resumen.operaciones_hoy ?? null)}): no se puede comprobar.` };
    } else {
      const n = resumen.operaciones_hoy;
      const ok = n + 1 <= reglas.operaciones_max_dia;
      resultado.operaciones_dia = {
        ok,
        detalle: `Hoy (${dia}, Madrid) llevas ${plural(n, 'operación', 'operaciones')}; con esta serían ${n + 1} y el máximo es ${reglas.operaciones_max_dia}.`,
      };
    }
  }

  // 7. R:R mínimo (bruto: el neto de costes se da como información).
  let rr = null;
  let rrNeto = null;
  if (!enOrden) {
    resultado.rr_minimo = { ok: false, detalle: sinComprobar };
  } else {
    rr = Math.abs(objetivo - entrada) / Math.abs(entrada - stop);
    rrNeto = gananciaPorBtc(entrada, objetivo, reglas) / rpb;
    const ok = rr >= reglas.rr_minimo - HOLGURA;
    resultado.rr_minimo = {
      ok,
      detalle: `Ganas ${ok ? fmtN(rr) : fmtFrente(rr, reglas.rr_minimo, fmtN)} por cada 1 que arriesgas (${fmtN(rrNeto)} contando comisiones y deslizamiento); ` +
        `el mínimo es ${fmtN(reglas.rr_minimo)}.`,
    };
  }

  // 8. Tamaño máximo de la posición (con costes, igual que en el presupuesto).
  if (!tamanoOk) {
    resultado.posicion_max = { ok: false, detalle: sinComprobar };
  } else if (!(esNum(capital) && capital > 0)) {
    resultado.posicion_max = { ok: false, detalle: `Tu capital es ${m(capital ?? 0)}: no hay con qué abrir una posición.` };
  } else {
    const limite = (reglas.posicion_max_pct / 100) * capital;
    const ok = r2(coste) <= r2(limite) + HOLGURA;
    resultado.posicion_max = {
      ok,
      detalle: `La posición cuesta ${m(r2(coste))} con costes, el ${fmtPct((coste / capital) * 100, 1)} de tu capital (${m(capital)}); ` +
        `el máximo es el ${fmtPct(reglas.posicion_max_pct, 0)} (${m(r2(limite))}).`,
    };
  }

  // 9. Efectivo disponible (nominal + comisión + deslizamiento).
  if (!tamanoOk) {
    resultado.efectivo = { ok: false, detalle: sinComprobar };
  } else if (efectivo === null) {
    resultado.efectivo = { ok: false, detalle: 'La cuenta no trae el efectivo: no se puede comprobar.' };
  } else {
    const ok = r2(coste) <= efectivo + HOLGURA;
    resultado.efectivo = {
      ok,
      detalle: ok
        ? `Con comisión y deslizamiento la compra cuesta ${m(r2(coste))} y tienes ${m(efectivo)} libres.`
        : `Con comisión y deslizamiento la compra cuesta ${m(r2(coste))} y solo tienes ${m(efectivo)} libres (faltan ${m(r2(coste - efectivo))}).`,
    };
  }

  // 10. Ventana de entrada (UTC).
  resultado.ventana_entrada = reglaVentana(reglas.ventana_entrada_utc, ahora);

  // 11. Noticia de alto impacto reciente.
  resultado.noticias = reglaNoticias(ctx.noticias_alto_impacto, reglas.bloqueo_noticias_min, ahora, avisos);

  // 12. Divergencia entre exchanges.
  if (!esNum(ctx.divergencia_pct)) {
    avisos.push('No llegó la comparación de precios entre exchanges: no se ha podido comprobar que coincidan.');
    resultado.divergencia = { ok: true, detalle: 'Sin datos de los exchanges: no se ha podido comprobar que coincidan.' };
  } else {
    const ok = ctx.divergencia_pct <= reglas.divergencia_max_pct + HOLGURA;
    resultado.divergencia = {
      ok,
      detalle: `Los exchanges se separan un ${ok ? fmtPct(ctx.divergencia_pct) : fmtFrente(ctx.divergencia_pct, reglas.divergencia_max_pct, fmtPct)} entre sí; ` +
        `el máximo es ${fmtPct(reglas.divergencia_max_pct)}.` +
        (ok ? '' : ' Algún dato está mal o el mercado está muy nervioso: espera a que se igualen.'),
    };
  }

  // 13. Coherencia de la orden.
  if (!ladoOk || !numerosOk) {
    const faltan = ['btc', 'entrada', 'stop', 'objetivo'].filter(k => !(esNum(orden[k]) && orden[k] > 0));
    resultado.coherencia = {
      ok: false,
      detalle: faltan.length
        ? `La orden no trae ${faltan.join(', ')} como números positivos.`
        : `El lado de la orden no vale (${JSON.stringify(lado)}).`,
    };
  } else if (!enOrden) {
    resultado.coherencia = {
      ok: false,
      detalle: larga
        ? `En una compra tiene que ser stop < entrada < objetivo, y llegó stop ${m(stop)}, entrada ${m(entrada)}, objetivo ${m(objetivo)}.`
        : `En un corto tiene que ser objetivo < entrada < stop, y llegó objetivo ${m(objetivo)}, entrada ${m(entrada)}, stop ${m(stop)}.`,
    };
  } else if (btc < reglas.minimo_orden_btc) {
    resultado.coherencia = { ok: false, detalle: `${fmtBtc(btc)} no llega al mínimo de orden (${fmtBtc(reglas.minimo_orden_btc)}).` };
  } else {
    resultado.coherencia = {
      ok: true,
      detalle: larga
        ? `Stop ${m(stop)} < entrada ${m(entrada)} < objetivo ${m(objetivo)}, y ${fmtBtc(btc)} pasa del mínimo de orden.`
        : `Objetivo ${m(objetivo)} < entrada ${m(entrada)} < stop ${m(stop)}, y ${fmtBtc(btc)} pasa del mínimo de orden.`,
    };
  }

  // 14. El precio de ahora sigue cerca de la entrada.
  let distancia = null;
  if (precioActual === null) {
    resultado.precio_cerca = { ok: false, detalle: 'No llegó el precio actual: no se puede comprobar que la entrada siga cerca.' };
  } else if (!(esNum(entrada) && entrada > 0)) {
    resultado.precio_cerca = { ok: false, detalle: sinComprobar };
  } else {
    distancia = (Math.abs(precioActual - entrada) / entrada) * 100;
    const ok = distancia <= reglas.distancia_max_entrada_pct + HOLGURA;
    resultado.precio_cerca = {
      ok,
      detalle: `El precio ahora (${m(precioActual)}) está a un ${ok ? fmtPct(distancia) : fmtFrente(distancia, reglas.distancia_max_entrada_pct, fmtPct)} ` +
        `de tu entrada (${m(entrada)}); el máximo es ${fmtPct(reglas.distancia_max_entrada_pct)}` +
        (ok ? '.' : ': la entrada ya no vale, recalcula el plan.'),
    };
  }

  const comprobaciones = REGLAS.map(({ regla, nombre }) => ({ regla, nombre, ok: resultado[regla].ok === true, detalle: resultado[regla].detalle }));
  const motivos = [...new Set(comprobaciones.filter(x => !x.ok).map(x => x.detalle))];
  return {
    veredicto: motivos.length ? 'BLOQUEADA' : 'PASA',
    comprobaciones,
    motivos,
    avisos,
    cifras: {
      nominal: nominal === null ? null : r2(nominal),
      coste: coste === null ? null : r2(coste),
      perdida_si_stop: perdida === null ? null : r2(perdida),
      ganancia_si_objetivo: enOrden ? r2(btc * gananciaPorBtc(entrada, objetivo, reglas)) : null,
      rr: rr === null ? null : Math.round(rr * 100) / 100,
      rr_neto: rrNeto === null ? null : Math.round(rrNeto * 100) / 100,
      distancia_entrada_pct: distancia === null ? null : Math.round(distancia * 1000) / 1000,
      // Para que el bróker en papel no se pase al llenar a un precio peor que la entrada.
      perdida_max_operacion: reglas.perdida_max_operacion,
      hueco_dia: huecoDia,
      efectivo,
      capital,
    },
    orden: { lado, btc, entrada, stop, objetivo },
    dia,
    hora: ahora,
  };
}

/** El veredicto en unas líneas de texto llano. */
export function textoRiesgo(resultado) {
  if (!esObjeto(resultado) || !Array.isArray(resultado.comprobaciones)) throw new Error('textoRiesgo: falta el resultado de comprobar().');
  const lineas = [`Gestor de riesgo: ${resultado.veredicto}.`];
  for (const c of resultado.comprobaciones) lineas.push(`${c.ok ? '✔' : '✘'} ${c.nombre ?? c.regla}: ${c.detalle}`);
  for (const a of resultado.avisos ?? []) lineas.push(`Aviso: ${a}`);
  return lineas.join('\n');
}
