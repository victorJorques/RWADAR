'use strict';
/* ---------------------------------------------------------------------
   Disponibilidad por país (27/11/2026, orden de Víctor: «que cualquier
   persona del mundo pueda entrar en RWAdar y conocer qué ofertas están a su
   alcance según su jurisdicción»).

   Un solo motor para la app y la web (assets/disponibilidad-pais-20261127.js,
   copia generada por rwadar-app/paises/generar.cjs). Sin Intl (Hermes): los
   nombres de los países y su orden vienen de paises-contenido.js.

   Cada oferta lleva en documentacion.disponibilidad sus reglas documentadas:
     { verificadaEl, admitidos[], excluidos[], conRequisitos[{paises[], requisito, requisitoEn}],
       fuentes[{url, titulo, literal, consultadaEl}], nota, notaEn }
   Los países son ISO 3166-1 alfa-2, o los grupos «UE» y «EEE», o «*»: en
   admitidos o con requisitos, todo el mundo (solo si la fuente lo dice); en
   excluidos, «todos los demás» (la fuente dice «solo en …»). Para un país:
   excluido por nombre > con requisitos > admitido > «*» en excluidos >
   sin confirmar. Nunca se da por disponible un país por no estar
   excluido: lo que no consta queda «sin confirmar».
   --------------------------------------------------------------------- */
const DATOS = require('./paises-contenido');

const ESTADOS = ['disponible', 'con_requisitos', 'no_disponible', 'sin_confirmar'];
const TEXTOS = {
  es: { disponible: 'Disponible', con_requisitos: 'Con requisitos', no_disponible: 'No disponible', sin_confirmar: 'Sin confirmar' },
  en: { disponible: 'Available', con_requisitos: 'With requirements', no_disponible: 'Not available', sin_confirmar: 'Unconfirmed' },
};
const PAIS_POR_DEFECTO = 'ES';
const dia = /^\d{4}-\d{2}-\d{2}$/;
const tiene = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

function idiomaDe(idioma) { return idioma === 'en' ? 'en' : 'es'; }
function codigoValido(codigo) { return typeof codigo === 'string' && tiene(DATOS.paises, codigo); }
function normalizarCodigo(codigo) {
  const c = typeof codigo === 'string' ? codigo.trim().toUpperCase() : '';
  return codigoValido(c) ? c : '';
}
function nombrePais(codigo, idioma) {
  return codigoValido(codigo) ? DATOS.paises[codigo][idiomaDe(idioma)] : '';
}
/* Para el selector: [{codigo, nombre}] ordenados por nombre en ese idioma. */
function listaPaises(idioma) {
  const i = idiomaDe(idioma);
  return (i === 'en' ? DATOS.ordenEn : DATOS.ordenEs).map(codigo => ({ codigo, nombre: DATOS.paises[codigo][i] }));
}
/* El país de conexión que da Cloudflare en /cdn-cgi/trace («loc=ES»). Orientativo: manda el que elija el usuario. */
function paisDesdeTrace(texto) {
  const m = /^loc=([A-Za-z]{2})\s*$/m.exec(typeof texto === 'string' ? texto : '');
  return m ? normalizarCodigo(m[1]) : '';
}

function entradaValida(x) { return x === '*' || tiene(DATOS.grupos, x) || codigoValido(x); }
function listaValida(l) { return Array.isArray(l) && l.every(entradaValida); }
/* Errores de una disponibilidad (para el montaje del catálogo y las pruebas). Vacío = válida. */
function erroresDisponibilidad(d) {
  const e = [];
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['no es un objeto'];
  const permitidas = ['verificadaEl', 'admitidos', 'excluidos', 'conRequisitos', 'fuentes', 'nota', 'notaEn'];
  for (const k of Object.keys(d)) if (!permitidas.includes(k)) e.push(`clave desconocida: ${k}`);
  if (!dia.test(String(d.verificadaEl || ''))) e.push('verificadaEl no es una fecha');
  if (!listaValida(d.admitidos)) e.push('admitidos: país o grupo no válido');
  if (!listaValida(d.excluidos)) e.push('excluidos: país o grupo no válido');
  if (!Array.isArray(d.conRequisitos) || d.conRequisitos.some(r => !r || !listaValida(r.paises) || !r.paises.length ||
    typeof r.requisito !== 'string' || !r.requisito.trim() || typeof r.requisitoEn !== 'string' || !r.requisitoEn.trim())) e.push('conRequisitos no válido');
  if (!Array.isArray(d.fuentes) || d.fuentes.some(f => !f || !/^https:\/\//.test(String(f.url || '')) ||
    typeof f.literal !== 'string' || !f.literal.trim() || !dia.test(String(f.consultadaEl || '')))) e.push('fuentes: cada una con url https, literal y fecha');
  for (const k of ['nota', 'notaEn']) if (typeof d[k] !== 'string' || !d[k].trim()) e.push(`falta ${k}`);
  const hayReglas = (d.admitidos || []).length + (d.excluidos || []).length + (d.conRequisitos || []).length;
  if (Array.isArray(d.admitidos) && Array.isArray(d.conRequisitos)) {
    for (const r of d.conRequisitos) for (const p of r.paises || []) if (p !== '*' && d.admitidos.includes(p)) e.push(`${p} está en admitidos y con requisitos`);
  }
  // Sin ninguna regla vale (todo «sin confirmar», con su nota); con reglas, al menos una fuente.
  if (hayReglas && Array.isArray(d.fuentes) && d.fuentes.length === 0) e.push('hay reglas sin fuente');
  return e;
}
function valida(d) { return erroresDisponibilidad(d).length === 0; }

function contiene(lista, codigo) {
  return (lista || []).some(x => x === '*' || x === codigo || (tiene(DATOS.grupos, x) && DATOS.grupos[x].paises.includes(codigo)));
}
/* Las reglas de una oferta: las suyas, o (lote anterior sin ellas) solo España desde disponibleEs. */
function disponibilidadDe(oferta) {
  const d = oferta && oferta.documentacion && oferta.documentacion.disponibilidad;
  return valida(d) ? d : null;
}
/* {estado, requisito, requisitoEn, deFuente}: el estado de la oferta para ese país. */
function estadoEnPais(oferta, codigo) {
  const pais = normalizarCodigo(codigo);
  const d = disponibilidadDe(oferta);
  if (!pais) return { estado: 'sin_confirmar', requisito: '', requisitoEn: '', deFuente: false };
  if (!d) {
    // Compatibilidad con lotes sin disponibilidad: lo de España, de disponibleEs; el resto, sin confirmar.
    const es = oferta && (oferta.disponibleEs !== undefined ? oferta.disponibleEs : oferta.disponible_es);
    if (pais === 'ES' && es === true) return { estado: 'disponible', requisito: '', requisitoEn: '', deFuente: true };
    if (pais === 'ES' && es === false) return { estado: 'no_disponible', requisito: '', requisitoEn: '', deFuente: true };
    return { estado: 'sin_confirmar', requisito: '', requisitoEn: '', deFuente: false };
  }
  if (contiene(d.excluidos.filter(x => x !== '*'), pais)) return { estado: 'no_disponible', requisito: '', requisitoEn: '', deFuente: true };
  const r = d.conRequisitos.find(x => contiene(x.paises, pais));
  if (r) return { estado: 'con_requisitos', requisito: r.requisito, requisitoEn: r.requisitoEn, deFuente: true };
  if (contiene(d.admitidos, pais)) return { estado: 'disponible', requisito: '', requisitoEn: '', deFuente: true };
  if (d.excluidos.includes('*')) return { estado: 'no_disponible', requisito: '', requisitoEn: '', deFuente: true };
  return { estado: 'sin_confirmar', requisito: '', requisitoEn: '', deFuente: false };
}
function etiquetaEstado(estado, idioma) { return TEXTOS[idiomaDe(idioma)][ESTADOS.includes(estado) ? estado : 'sin_confirmar']; }
/* Lo que va en la tarjeta: «Italia» y «Disponible». */
function datoCortoPais(oferta, codigo, idioma) {
  const pais = normalizarCodigo(codigo) || PAIS_POR_DEFECTO;
  const r = estadoEnPais(oferta, pais);
  return { pais, nombre: nombrePais(pais, idioma), estado: r.estado, texto: etiquetaEstado(r.estado, idioma) };
}
/* El filtro «Solo disponibles en mi país»: disponibles y con requisitos (se puede, cumpliéndolos). */
function accesibleEnPais(oferta, codigo) {
  const e = estadoEnPais(oferta, codigo).estado;
  return e === 'disponible' || e === 'con_requisitos';
}
/* Nombres legibles de una lista de reglas («Unión Europea», «Italia», «Todo el mundo»). */
function nombresLista(lista, idioma, excluidos = false) {
  const i = idiomaDe(idioma);
  return (lista || []).map(x => x === '*' ? (excluidos ? (i === 'en' ? 'All other countries' : 'Todos los demás países') : (i === 'en' ? 'Worldwide' : 'Todo el mundo'))
    : tiene(DATOS.grupos, x) ? DATOS.grupos[x][i] : nombrePais(x, i)).filter(Boolean);
}
/* Para la ficha ampliada: qué dicen las fuentes, en llano. */
function detalleDisponibilidad(oferta, codigo, idioma) {
  const d = disponibilidadDe(oferta), i = idiomaDe(idioma);
  const corto = datoCortoPais(oferta, codigo, i);
  const r = estadoEnPais(oferta, corto.pais);
  if (!d) return { ...corto, requisito: '', admitidos: [], excluidos: [], conRequisitos: [], fuentes: [], nota: '', verificadaEl: '' };
  return {
    ...corto,
    requisito: i === 'en' ? r.requisitoEn : r.requisito,
    admitidos: nombresLista(d.admitidos, i),
    excluidos: nombresLista(d.excluidos, i, true),
    conRequisitos: d.conRequisitos.map(x => ({ paises: nombresLista(x.paises, i), requisito: i === 'en' ? x.requisitoEn : x.requisito })),
    fuentes: d.fuentes.map(f => ({ url: f.url, titulo: f.titulo || f.url, literal: f.literal, consultadaEl: f.consultadaEl })),
    nota: i === 'en' ? d.notaEn : d.nota,
    verificadaEl: d.verificadaEl,
  };
}

module.exports = {
  ESTADOS, TEXTOS, PAIS_POR_DEFECTO,
  codigoValido, normalizarCodigo, nombrePais, listaPaises, paisDesdeTrace,
  erroresDisponibilidad, valida, disponibilidadDe, estadoEnPais, etiquetaEstado, datoCortoPais, accesibleEnPais,
  nombresLista, detalleDisponibilidad,
};
