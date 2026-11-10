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

/* Ofertas de Inicio (rediseño del 10/11/2026, como ofertasInicio de la
   web): un solo carrusel con las recién añadidas y las de la Selección (las
   que pasan las 5 comprobaciones), sin duplicados y 6 como mucho. Primero
   las nuevas, en su orden; después, las de la Selección que no estén ya,
   con 3 huecos guardados para ellas aunque haya muchas nuevas. */
export function ofertasDestacadas(nuevas = [], seleccion = [], max = MAX_RECIEN) {
  const n = (Array.isArray(nuevas) ? nuevas : []).filter((o) => o && typeof o.slug === 'string');
  const enNuevas = new Set(n.map((o) => o.slug));
  const resto = (Array.isArray(seleccion) ? seleccion : []).filter((o) => o && typeof o.slug === 'string' && !enNuevas.has(o.slug)).slice(0, 3);
  const vistas = new Set();
  const lista = [];
  for (const o of [...n.slice(0, max - resto.length), ...resto]) {
    if (vistas.has(o.slug)) continue;
    vistas.add(o.slug);
    lista.push(o);
    if (lista.length === max) break;
  }
  return lista;
}
