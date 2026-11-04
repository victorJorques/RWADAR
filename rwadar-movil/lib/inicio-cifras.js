/* ---------------------------------------------------------------------
   Las cifras vivas del Inicio, sacadas del catálogo en cada carga
   ---------------------------------------------------------------------
   {ofertas}, {plataformas}, {descartadas}, {seleccion}, {minimos}, {usd},
   {revisado} y {hasta} (ESPEC-INICIO §2). FALLA CERRADO: sin catálogo
   vigente (caducado, retirado o sin fecha) no hay Selección, ni frase de
   mínimos, ni vigencia, y los botones quedan sin cifra (§2.10). La línea de
   riesgo y la nota legal no dependen de esto y no se ocultan nunca.
   --------------------------------------------------------------------- */
import { resumenOferta } from './ficha-editorial';
import { enSeleccionOferta, fechaES, fechaValida } from './transparencia';

function sumarDias(fecha, dias) {
  if (!fechaValida(fecha) || !Number.isInteger(dias) || dias < 1) return '';
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 86400000).toISOString().slice(0, 10);
}

/* Mínimo documentado de 1 € (o de 1 $), con fuente y fecha vigentes. */
function minimoDeUno(resumen) {
  const m = resumen?.minimo;
  if (!m) return null;
  if (m.euros === 1) return 'eur';
  const unidad = typeof m.unidadDocumentada === 'string' ? m.unidadDocumentada.trim() : '';
  return /^1\s*(?:USD|US\$|\$)$/i.test(unidad) || /^\$\s*1$/.test(unidad) ? 'usd' : null;
}

export function cifrasInicio({ ofertas = [], plataformas = [], descartadas = [], fechaCatalogo = null, ahora = new Date() } = {}) {
  const revisadoIso = fechaValida(fechaCatalogo?.fecha) ? fechaCatalogo.fecha : '';
  const vigente = Boolean(revisadoIso) && fechaCatalogo?.caducado !== true && ofertas.length > 0;
  const base = {
    vigente,
    ofertas: ofertas.length || 0,
    plataformas: plataformas.length || 0,
    descartadas: descartadas.length || 0,
    revisado: revisadoIso ? fechaES(revisadoIso) : '',
    hasta: '', seleccion: [], minimos: 0, usd: 0,
  };
  if (!vigente) return base;
  const resumenes = ofertas.map((o) => [o, resumenOferta(o, [], ahora)]);
  const seleccion = resumenes.filter(([o, r]) => enSeleccionOferta(o, r, { ahora })).map(([o]) => o);
  const unos = resumenes.map(([, r]) => minimoDeUno(r)).filter(Boolean);
  return {
    ...base,
    hasta: fechaES(sumarDias(revisadoIso, Number(fechaCatalogo.vigenciaDias))),
    seleccion,
    minimos: unos.length,
    usd: unos.filter((u) => u === 'usd').length,
  };
}
