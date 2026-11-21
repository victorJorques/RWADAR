'use strict';

/* ---------------------------------------------------------------------
   Campana de avisos de la cabecera (21/11/2026)
   ---------------------------------------------------------------------
   Petición de la dirección: «que los avisos salgan en Inicio arriba a la
   derecha, al lado del interrogante» y «al leerlas, que desaparezca como que
   está pendiente». La campana va junto al «?» de la cabecera, con un globo
   con los avisos sin leer (1-9, «9+»), y al pulsarla se abre la lista: abrirla
   es verlos, como un chat de WhatsApp (componentes/CampanaAvisos.js).
   Aquí, lo que no necesita React: el número del globo, la etiqueta accesible,
   los avisos públicos (la lista de la web, GET /api/avisos/recientes) y los
   «cambios de lo que sigues» que todavía no se han visto en Inicio.
   --------------------------------------------------------------------- */

const { validarAvisosRecientes } = require('./avisos-cuenta');

const URL_AVISOS_RECIENTES = 'https://rwadar.pages.dev/api/avisos/recientes';
const PLAZO_MS = 15000;
const MAX_RESPUESTA = 50;
const MAX_PUBLICOS = 20;

function cuantos(n) {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v > 0 ? v : 0;
}

// Lo que pone el globo: nada con 0, de 1 a 9 tal cual y «9+» desde 10.
function textoGlobo(n) {
  const v = cuantos(n);
  if (!v) return '';
  return v > 9 ? '9+' : String(v);
}

// La etiqueta para el lector de pantalla, con el número exacto, en el idioma
// de la app (como la web, que la escribe en el idioma de la página).
function etiquetaCampana(n, idioma = 'es') {
  const v = cuantos(n);
  if (idioma === 'en') return v ? `Notices, ${v} unread` : 'Notices, none unread';
  return v ? `Avisos, ${v} sin leer` : 'Avisos, ninguno sin leer';
}

function conPlazo(promesa, ms) {
  let reloj;
  return Promise.race([promesa, new Promise((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error('plazo')), ms);
  })]).finally(() => clearTimeout(reloj));
}

/* Los avisos publicados para todos (los mismos que la web enseña sin sesión
   en ?avisos=1): sin cuenta, sin cookies y sin la bienvenida, que es de cada
   cuenta. Cada aviso pasa por la misma validación que los de la cuenta (solo
   enlaces de RWAdar, textos limpios). Lanza si la respuesta no es la
   esperada: quien la llama enseña «no se han podido cargar». */
async function cargarAvisosPublicos({ fetchImpl = (...a) => fetch(...a), plazoMs = PLAZO_MS, limite = MAX_PUBLICOS } = {}) {
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => control?.abort(), plazoMs);
  try {
    const r = await conPlazo(fetchImpl(URL_AVISOS_RECIENTES, { method: 'GET', credentials: 'omit',
      headers: { accept: 'application/json' }, ...(control ? { signal: control.signal } : {}) }), plazoMs);
    if (!r || r.status !== 200) throw new Error('avisos_no_disponibles');
    const j = await conPlazo(r.json(), plazoMs);
    if (!j || j.v !== 1 || !Array.isArray(j.avisos) || j.avisos.length > MAX_RESPUESTA) throw new Error('avisos_respuesta_invalida');
    return validarAvisosRecientes(j.avisos.filter((a) => a && a.tipo !== 'bienvenida'), limite);
  } finally {
    clearTimeout(reloj);
  }
}

/* «Cambios en lo que sigues» de Inicio (lib/datos.js, novedades()). La
   insignia de la pestaña Inicio cuenta solo los que ocurrieron después de
   «vistos hasta» (la fecha del último que se vio en pantalla, guardada en
   el dispositivo); sin fecha guardada, todos. */
function fechaCambio(c) {
  const t = Date.parse(c?.ocurrido_el);
  return Number.isFinite(t) ? t : null;
}

function cambiosNoVistos(cambios, vistosHasta) {
  if (!Array.isArray(cambios)) return 0;
  const hasta = Date.parse(vistosHasta);
  if (!Number.isFinite(hasta)) return cambios.length;
  return cambios.filter((c) => { const t = fechaCambio(c); return t === null || t > hasta; }).length;
}

// La fecha del más reciente (ISO), para guardarla como «vistos hasta».
function ultimoCambio(cambios) {
  let maximo = null;
  for (const c of Array.isArray(cambios) ? cambios : []) {
    const t = fechaCambio(c);
    if (t !== null && (maximo === null || t > maximo)) maximo = t;
  }
  return maximo === null ? null : new Date(maximo).toISOString();
}

module.exports = {
  URL_AVISOS_RECIENTES, textoGlobo, etiquetaCampana, cargarAvisosPublicos, cambiosNoVistos, ultimoCambio,
};
