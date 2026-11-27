/* ---------------------------------------------------------------------
   Plataformas: «Más nuevas primero» (27/11/2026, orden de Víctor: «las más
   nuevas van primero… en plataformas»). Copia de altaPlataforma y
   plataformasMasNuevasPrimero de `rwadar-site/assets/rwadar-20260820.js`.

   La fecha de alta es un HECHO (`altas-plataformas-contenido.js`, generado
   desde rwadar-editorial-source/plataformas/altas.json: el primer lote del
   repositorio en que aparece la plataforma), no una nota ni una
   recomendación. A igual fecha, por nombre; una plataforma sin fecha va al
   final, por nombre.
   --------------------------------------------------------------------- */
import { ALTA_PLATAFORMA_POR_SLUG } from './altas-plataformas-contenido';

const dia = /^\d{4}-\d{2}-\d{2}$/;

/* La fecha de alta de la plataforma, o '' si no consta. */
export function altaPlataforma(plataforma, tabla = ALTA_PLATAFORMA_POR_SLUG) {
  const slug = plataforma && typeof plataforma.slug === 'string' ? plataforma.slug : '';
  const f = tabla && slug && Object.prototype.hasOwnProperty.call(tabla, slug) ? tabla[slug] : '';
  return typeof f === 'string' && dia.test(f) ? f : '';
}

export function compararPlataformasMasNuevas(tabla = ALTA_PLATAFORMA_POR_SLUG) {
  return (a, b) => altaPlataforma(b, tabla).localeCompare(altaPlataforma(a, tabla))
    || String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es');
}

export function ordenarPlataformasMasNuevas(plataformas, tabla = ALTA_PLATAFORMA_POR_SLUG) {
  return (Array.isArray(plataformas) ? plataformas : []).slice().sort(compararPlataformasMasNuevas(tabla));
}
