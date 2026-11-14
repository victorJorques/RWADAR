// Alertas de precio de «BTC en papel» (estado/alertas.json): «avísame si BTC
// sube a X o baja a Y». Cada alerta salta una sola vez, mirando los máximos
// y mínimos de las velas desde la última comprobación y el precio de ahora.
import fs from 'node:fs';
import path from 'node:path';
import { diaMadrid, dirEstado, escribirEstado, fmtDinero, fmtHora, leerEstado } from './comun.mjs';
import { leerVelas } from './papel.mjs';

const ARCHIVO = 'alertas';
const TIPOS = Object.freeze(['sobre', 'bajo']);
const MAX_NOTA = 200;

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const esObjeto = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const llegó = x => (x === undefined ? 'nada' : typeof x === 'string' ? `«${x}»` : String(x));

function aMs(x) {
  if (x instanceof Date) return Number.isFinite(x.getTime()) ? x.getTime() : null;
  if (esNum(x)) return x;
  if (typeof x === 'string' && x.trim()) {
    const t = Date.parse(x);
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function validarAlerta(a, k) {
  const nombre = esObjeto(a) && typeof a.id === 'string' ? `la alerta «${a.id}»` : `la alerta ${k + 1}`;
  if (!esObjeto(a) || typeof a.id !== 'string' || !a.id) throw new Error(`Alertas: ${nombre} no trae id.`);
  if (!TIPOS.includes(a.tipo)) throw new Error(`Alertas: ${nombre} tiene un tipo raro (${llegó(a.tipo)}); vale 'sobre' o 'bajo'.`);
  if (!(esNum(a.nivel) && a.nivel > 0)) throw new Error(`Alertas: ${nombre} no trae un nivel válido (llegó ${llegó(a.nivel)}).`);
  if (!esNum(a.creada)) throw new Error(`Alertas: ${nombre} no trae la hora de creación.`);
  return {
    ...a,
    nota: typeof a.nota === 'string' ? a.nota : '',
    comprobada_hasta: esNum(a.comprobada_hasta) ? a.comprobada_hasta : a.creada,
    saltada: esNum(a.saltada) ? a.saltada : null,
  };
}

function validarLista(alertas) {
  const lista = Array.isArray(alertas) ? alertas : esObjeto(alertas) && Array.isArray(alertas.alertas) ? alertas.alertas : null;
  if (lista === null) throw new Error(`Las alertas deben ser una lista (o { alertas: [...] }); llegó ${llegó(alertas)}.`);
  return lista.map((a, k) => validarAlerta(structuredClone(a), k));
}

/** Lee estado/alertas.json (lista vacía si no existe). Si está roto, lanza en vez de perderlas. */
export function cargarAlertas() {
  const ruta = path.join(dirEstado(), `${ARCHIVO}.json`);
  const existe = fs.existsSync(ruta);
  const datos = leerEstado(ARCHIVO, null);
  if (datos === null) {
    if (existe) throw new Error(`Las alertas (${ruta}) están rotas y no se pueden leer; hay una copia en ${ARCHIVO}.roto.json. Arréglalas o borra el archivo.`);
    return [];
  }
  return validarLista(datos);
}

/** Guarda las alertas de forma atómica. Devuelve la ruta. */
export function guardarAlertas(alertas) {
  return escribirEstado(ARCHIVO, { alertas: validarLista(alertas) });
}

function idNuevo(lista, ahora) {
  const prefijo = `A-${diaMadrid(ahora).replaceAll('-', '')}-`;
  let n = 0;
  for (const a of lista) {
    if (a.id.startsWith(prefijo)) {
      const k = Number(a.id.slice(prefijo.length));
      if (Number.isInteger(k) && k > n) n = k;
    }
  }
  return `${prefijo}${n + 1}`;
}

/**
 * anadirAlerta({ tipo: 'sobre'|'bajo', nivel, nota, precio, ahora, moneda }) → la alerta guardada.
 * Si llega `precio` y la alerta ya se cumple (p. ej. «sobre 60.000» con BTC
 * en 61.000), no la crea: saltaría enseguida y casi seguro es un despiste.
 */
export function anadirAlerta({ tipo, nivel, nota = '', precio, ahora, moneda = 'EUR' } = {}) {
  if (!TIPOS.includes(tipo)) throw new Error(`anadirAlerta: el tipo debe ser 'sobre' (avisa si sube a ese nivel) o 'bajo' (si baja); llegó ${llegó(tipo)}.`);
  if (!(esNum(nivel) && nivel > 0)) throw new Error(`anadirAlerta: el nivel debe ser un precio positivo (llegó ${llegó(nivel)}).`);
  const t = aMs(ahora) ?? Date.now();
  const p = esObjeto(precio) ? precio.precio : precio;
  if (esNum(p) && p > 0 && (tipo === 'sobre' ? p >= nivel : p <= nivel)) {
    const m = x => fmtDinero(x, moneda);
    throw new Error(`anadirAlerta: BTC ya está en ${m(p)}, ${tipo === 'sobre' ? 'por encima' : 'por debajo'} de ${m(nivel)}: ` +
      `una alerta «${tipo}» saltaría enseguida. ¿Querías «${tipo === 'sobre' ? 'bajo' : 'sobre'}»?`);
  }
  const lista = cargarAlertas();
  const alerta = {
    id: idNuevo(lista, t),
    tipo,
    nivel,
    nota: typeof nota === 'string' ? nota.trim().slice(0, MAX_NOTA) : '',
    creada: t,
    comprobada_hasta: t,
    saltada: null,
  };
  guardarAlertas([...lista, alerta]);
  return alerta;
}

/** Las alertas pendientes (o todas, con { todas: true }), de las más antiguas a las más nuevas. */
export function listarAlertas({ todas = false } = {}) {
  const lista = cargarAlertas();
  return (todas ? lista : lista.filter(a => a.saltada === null)).sort((a, b) => a.creada - b.creada);
}

/** Borra una alerta por id. Devuelve la borrada; lanza si no existe. */
export function borrarAlerta(id) {
  const lista = cargarAlertas();
  const alerta = lista.find(a => a.id === id);
  if (!alerta) {
    const ids = lista.map(a => a.id).join(', ');
    throw new Error(`borrarAlerta: no hay ninguna alerta con id ${llegó(id)}. ${ids ? `Hay: ${ids}.` : 'No hay alertas.'}`);
  }
  guardarAlertas(lista.filter(a => a.id !== id));
  return alerta;
}

function mensaje(a, m) {
  const nota = a.nota ? ` Nota: ${a.nota}` : '';
  return `Alerta ${a.id}: BTC ha ${a.tipo === 'sobre' ? 'subido' : 'bajado'} a ${m(a.nivel)}. ${a.detalle}${nota}`;
}

/**
 * comprobarAlertas({ alertas, velas, precio, ahora, intervalo, moneda }) →
 * { saltadas, pendientes, alertas, texto }
 *
 * Mira, para cada alerta pendiente, las velas que empiezan en o después de
 * su creación y de la última comprobación (máximo para 'sobre', mínimo para
 * 'bajo') y luego el precio de ahora. Una alerta salta una sola vez.
 * Sin `alertas` lee y guarda estado/alertas.json; con `alertas` no toca el
 * disco y devuelve la lista actualizada para que la guardes tú.
 */
export function comprobarAlertas({ alertas, velas, precio, ahora, intervalo, moneda = 'EUR' } = {}) {
  const enDisco = alertas === undefined;
  const lista = enDisco ? cargarAlertas() : validarLista(alertas);
  const t = aMs(ahora) ?? Date.now();
  const m = x => fmtDinero(x, moneda);
  const { velas: limpias } = leerVelas(velas, { intervalo, ahora: t });
  const p0 = esObjeto(precio) ? precio.precio : precio;
  const p = esNum(p0) && p0 > 0 ? p0 : null;
  const saltadas = [];
  const nuevas = lista.map(a => {
    if (a.saltada !== null) return a;
    const sobre = a.tipo === 'sobre';
    let hasta = Math.max(a.creada, a.comprobada_hasta);
    for (const v of limpias) {
      if (v.t > t) break;
      // La vela en la que se creó mezcla precios de antes: no cuenta.
      if (v.t < hasta) continue;
      const extremo = sobre ? v.h : v.l;
      if (sobre ? extremo >= a.nivel : extremo <= a.nivel) {
        const s = {
          ...a, saltada: v.t, comprobada_hasta: v.fin, extremo,
          detalle: `En la vela de las ${fmtHora(v.t)} el ${sobre ? 'máximo' : 'mínimo'} llegó a ${m(extremo)}.`,
        };
        s.mensaje = mensaje(s, m);
        saltadas.push(s);
        return s;
      }
      if (v.cerrada) hasta = v.fin; // una vela a medias se vuelve a mirar entera
    }
    if (p !== null && t >= a.creada && (sobre ? p >= a.nivel : p <= a.nivel)) {
      const s = { ...a, saltada: t, comprobada_hasta: hasta, extremo: p, detalle: `El precio de ahora es ${m(p)} (${fmtHora(t)}).` };
      s.mensaje = mensaje(s, m);
      saltadas.push(s);
      return s;
    }
    return { ...a, comprobada_hasta: hasta };
  });
  if (enDisco) guardarAlertas(nuevas);
  const pendientes = nuevas.filter(a => a.saltada === null);
  const texto = saltadas.length
    ? saltadas.map(s => s.mensaje).join('\n')
    : pendientes.length
      ? `Ninguna alerta ha saltado (${pendientes.length} ${pendientes.length === 1 ? 'pendiente' : 'pendientes'}).`
      : 'No hay alertas pendientes.';
  return { saltadas, pendientes, alertas: nuevas, texto };
}
