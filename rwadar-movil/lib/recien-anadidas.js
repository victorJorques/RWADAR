/* ---------------------------------------------------------------------
   Recién añadidas (04/11/2026): las mismas reglas que la web
   ---------------------------------------------------------------------
   Copia de altaOferta, ofertaNueva, masNuevasPrimero y
   ofertasRecienAnadidas de `rwadar-site/assets/rwadar-20260820.js`.

   La fecha de alta en el radar es un HECHO (`anadidaEl` de
   transparencia.json), no una nota ni una recomendación:
   - Inicio, «Recién añadidas»: las altas de Principales (la lista que abre
     «Ver todas las ofertas nuevas») de los últimos 30 días, de la más
     nueva a la más antigua y 6 como mucho; sin ninguna, no sale.
   - Ofertas: «Nueva» durante 14 días y el orden «Más nuevas primero».
   Con el catálogo caducado no se enseña nada de esto.
   --------------------------------------------------------------------- */
import { TRANSPARENCIA_POR_SLUG } from './transparencia-contenido';

export const DIAS_RECIEN = 30;
export const DIAS_NUEVA = 14;
export const MAX_RECIEN = 6;

const dia = /^\d{4}-\d{2}-\d{2}$/;
const fechaValida = (v) => typeof v === 'string' && dia.test(v) &&
  Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

/* La fecha de alta de la oferta, o '' si no consta. */
export function fechaAlta(oferta, tabla = TRANSPARENCIA_POR_SLUG) {
  const slug = oferta && typeof oferta.slug === 'string' ? oferta.slug : '';
  const e = tabla && slug && Object.prototype.hasOwnProperty.call(tabla, slug) ? tabla[slug] : null;
  return e && fechaValida(e.anadidaEl) ? e.anadidaEl : '';
}

/* La fecha de cada tarjeta de Inicio (21/11/2026, orden de Víctor: «lo que más
   actualizado esté»), como fechaTarjetaInicio de la web: la más reciente
   entre la de alta y la de verificación del catálogo. { tipo: 'anadida' } si
   se añadió ese día o después de verificarse; si no, { tipo: 'verificada' }.
   Con el catálogo caducado, o sin ninguna fecha válida, null. */
export function fechaTarjeta(oferta, { ahora = new Date(), catalogoCaducado = false, tabla = TRANSPARENCIA_POR_SLUG } = {}) {
  const h = new Date(ahora);
  if (catalogoCaducado || !Number.isFinite(h.getTime())) return null;
  const alta = fechaAlta(oferta, tabla), hoy = h.toISOString().slice(0, 10);
  const verif = oferta && fechaValida(oferta.verificadaEl) && oferta.verificadaEl <= hoy ? oferta.verificadaEl : '';
  if (alta && alta >= verif) return { tipo: 'anadida', fecha: alta };
  return verif ? { tipo: 'verificada', fecha: verif } : null;
}

/* Añadida hace menos de `dias` días, contados en el día del teléfono. */
export function esNueva(oferta, { ahora = new Date(), catalogoCaducado = false, dias = DIAS_NUEVA, tabla = TRANSPARENCIA_POR_SLUG } = {}) {
  const f = fechaAlta(oferta, tabla), h = new Date(ahora);
  if (!f || catalogoCaducado || !Number.isFinite(h.getTime())) return false;
  const d = Math.round((Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) - Date.parse(`${f}T00:00:00Z`)) / 86400000);
  return d >= 0 && d < dias;
}

/* De la más nueva a la más antigua; a igual fecha, por proveedor y título. */
export function compararMasNuevas(tabla = TRANSPARENCIA_POR_SLUG) {
  return (a, b) => fechaAlta(b, tabla).localeCompare(fechaAlta(a, tabla))
    || String(a.plataformaNombre || '').localeCompare(String(b.plataformaNombre || ''), 'es')
    || String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
}

export function ordenarMasNuevas(ofertas, tabla = TRANSPARENCIA_POR_SLUG) {
  return (Array.isArray(ofertas) ? ofertas : []).slice().sort(compararMasNuevas(tabla));
}

export function recienAnadidas(ofertas, { ahora = new Date(), catalogoCaducado = false, dias = DIAS_RECIEN, max = MAX_RECIEN,
  tabla = TRANSPARENCIA_POR_SLUG } = {}) {
  if (catalogoCaducado) return [];
  // Sin colección (copia local de pruebas), cuenta como Principales.
  return ordenarMasNuevas((Array.isArray(ofertas) ? ofertas : [])
    .filter((o) => (o?.coleccion ?? 'principales') === 'principales' && esNueva(o, { ahora, dias, tabla })), tabla).slice(0, max);
}

/* Ofertas de Inicio (21/11/2026, como ofertasInicio de la web): las de
   Principales por su fecha de alta, de la más nueva a la más antigua, 6 como
   mucho y sin huecos guardados para las antiguas. A igual fecha, primero las
   de la Selección (las que pasan las 5 comprobaciones) y después por
   proveedor y título. Con el catálogo caducado no sale ninguna. */
export function ofertasDestacadas(ofertas = [], seleccion = [], { catalogoCaducado = false, max = MAX_RECIEN,
  tabla = TRANSPARENCIA_POR_SLUG } = {}) {
  if (catalogoCaducado) return [];
  const enSeleccion = new Set((Array.isArray(seleccion) ? seleccion : []).filter((o) => o && typeof o.slug === 'string').map((o) => o.slug));
  const vistas = new Set();
  const porFecha = compararMasNuevas(tabla);
  return (Array.isArray(ofertas) ? ofertas : [])
    .filter((o) => o && typeof o.slug === 'string' && (o.coleccion ?? 'principales') === 'principales'
      && !vistas.has(o.slug) && vistas.add(o.slug))
    .sort((a, b) => fechaAlta(b, tabla).localeCompare(fechaAlta(a, tabla))
      || (enSeleccion.has(b.slug) ? 1 : 0) - (enSeleccion.has(a.slug) ? 1 : 0) || porFecha(a, b))
    .slice(0, max);
}
