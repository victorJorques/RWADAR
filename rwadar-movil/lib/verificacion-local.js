import { validarDocumentacionOferta } from './contrato-catalogo';

export const FECHA_VERIFICACION_LOCAL = '2026-09-21';

const ESTADOS_OPERATIVOS = new Set(['observada', 'no_verificable']);
const ESTADOS_LICENCIA = new Set([
  'confirmada_regulador',
  'confirmada_documento_producto',
  'no_aplica_plataforma',
  'no_verificable',
  'sin_registro_declarado',
]);
const ESTADOS_ACCESO = new Set([
  'confirmado_condicionado',
  'no_aplica_plataforma',
  'no_verificable',
]);

const ETIQUETAS = Object.freeze({
  observada: 'Activa al revisarla',
  no_verificable: 'No verificable',
  confirmada_regulador: 'Registro confirmado',
  confirmada_documento_producto: 'Consta en el documento del producto',
  no_aplica_plataforma: 'No aplica a la plataforma',
  sin_registro_declarado: 'Sin registro declarado',
  confirmado_condicionado: 'Con requisitos',
});

function asegurar(condicion, mensaje) {
  if (!condicion) throw new Error(`Verificación local inválida: ${mensaje}`);
}

function texto(valor, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

function fechaValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor || '')
    && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`));
}

function fuenteValida(fuente, fecha) {
  if (!fuente || !texto(fuente.id) || !texto(fuente.titulo) || fuente.primaria !== true ||
      fuente.consultadaEl !== fecha) return false;
  try {
    return new URL(fuente.url).protocol === 'https:';
  } catch {
    return false;
  }
}

function validarCampo(campo, estados, nombre, fecha) {
  asegurar(campo && estados.has(campo.estado), `${nombre}.estado no permitido`);
  asegurar(texto(campo.detalle, 24), `${nombre}.detalle ausente`);
  asegurar(Array.isArray(campo.fuentes) && campo.fuentes.length > 0,
    `${nombre}.fuentes ausentes`);
  asegurar(campo.fuentes.every((fuente) => fuenteValida(fuente, fecha)),
    `${nombre}.fuentes fuera de contrato`);
}

export function validarVerificacionLocal(verificacion) {
  asegurar(verificacion && typeof verificacion === 'object', 'objeto ausente');
  asegurar(fechaValida(verificacion.verificadoEl), 'fecha ausente');
  asegurar(verificacion.verificadoEl === FECHA_VERIFICACION_LOCAL,
    `fecha distinta de ${FECHA_VERIFICACION_LOCAL}`);
  asegurar(verificacion.conservaFechaCanonica === true,
    'debe conservar la fecha canónica sin rejuvenecerla');

  validarCampo(verificacion.estadoOperativo, ESTADOS_OPERATIVOS,
    'estadoOperativo', verificacion.verificadoEl);
  validarCampo(verificacion.licenciaRegistro, ESTADOS_LICENCIA,
    'licenciaRegistro', verificacion.verificadoEl);
  validarCampo(verificacion.acceso, ESTADOS_ACCESO,
    'acceso', verificacion.verificadoEl);

  asegurar(Array.isArray(verificacion.alertasCriticas) &&
    verificacion.alertasCriticas.length > 0, 'alertasCriticas ausentes');
  for (const alerta of verificacion.alertasCriticas) {
    asegurar(alerta && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(alerta.codigo || ''),
      'código de alerta no permitido');
    asegurar(texto(alerta.detalle, 24), 'detalle de alerta ausente');
    asegurar(Array.isArray(alerta.fuentes) && alerta.fuentes.length > 0 &&
      alerta.fuentes.every((fuente) => fuenteValida(fuente, verificacion.verificadoEl)),
    'fuentes de alerta fuera de contrato');
  }
  return verificacion;
}

export function validarRadarLocal(plataformas) {
  asegurar(Array.isArray(plataformas) && plataformas.length === 26,
    'el radar debe contener exactamente 26 plataformas');
  const slugs = new Set();
  for (const plataforma of plataformas) {
    asegurar(plataforma && texto(plataforma.slug), 'plataforma sin slug');
    asegurar(!slugs.has(plataforma.slug), `slug duplicado: ${plataforma.slug}`);
    slugs.add(plataforma.slug);
    validarVerificacionLocal(plataforma.verificacionLocal);
  }
  return plataformas;
}

export function etiquetaEstadoVerificacionLocal(estado) {
  return ETIQUETAS[estado] || 'No verificado';
}

export function fechaVerificacionLocalVisible(fecha) {
  if (!fechaValida(fecha)) return 'fecha no verificable';
  const [ano, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Documentar una referencia no confirma que siga abierta ni que sus importes
// estén vigentes. Esta procedencia se conserva al vencer el TTL de las cifras.
export function documentacionOferta(oferta, ahora = new Date()) {
  const fechaDocumental = (fecha) => {
    const base = Date.parse(`${fecha}T00:00:00Z`);
    return fechaValida(fecha) && Number.isFinite(base) &&
      new Date(base).toISOString().slice(0, 10) === fecha &&
      Number.isFinite(ahora.getTime()) && base <= ahora.getTime();
  };
  const esFuente = (valor) => {
    if (typeof valor !== 'string') return false;
    try {
      const url = new URL(valor);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch { return false; }
  };
  const documento = oferta?.documentacion;
  if (documento != null) {
    try { validarDocumentacionOferta(documento, 'oferta/documentacion', { hoy: ahora }); }
    catch { return null; }
  }
  const fecha = documento == null ? oferta?.verificadaEl : documento.revisadaEl;
  if (!fechaDocumental(fecha)) return null;
  const fuentes = documento == null ? oferta?.fuentesActuales : documento.fuentes;
  if (!Array.isArray(fuentes) || !fuentes.length || !fuentes.every(esFuente)) return null;
  return { fecha, fuentes: [...new Set(fuentes)],
    descripcion: documento?.descripcion || '',
    caracteristicas: (documento?.caracteristicas || []).map(c => ({ ...c })),
    referencias: (documento?.referencias || []).map(r => ({ ...r })),
    etiqueta: `Fuente revisada el ${fechaVerificacionLocalVisible(fecha)}` };
}

/* El TTL pertenece a la oferta, no al lote del catálogo. Se evalúa al pintar,
   incluso si la oferta procede de una caché cargada cuando aún era vigente. */
export function revisionTemporalOferta(oferta, ahora = new Date()) {
  if (oferta?.coleccion != null && oferta.coleccion !== 'principales') return null;
  if (!oferta || (oferta.estadoRevision != null && oferta.estadoRevision !== 'actual')) return null;
  const fecha = oferta.verificadaEl;
  const base = Date.parse(`${fecha}T00:00:00Z`);
  const ttl = Number(oferta.vigenciaDias);
  if (!fechaValida(fecha) || !Number.isFinite(base) ||
      new Date(base).toISOString().slice(0, 10) !== fecha ||
      !Number.isInteger(ttl) || ttl < 1 || !Number.isFinite(ahora.getTime())) return null;
  const hoy = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());
  const vence = new Date(base + ttl * 86400000);
  if (base > hoy || !Number.isFinite(vence.getTime())) return null;
  return { venceEl: vence.toISOString(), dias: Math.floor((vence.getTime() - hoy) / 86400000) };
}

export function cifrasOfertaVigentes(oferta, ahora = new Date()) {
  const revision = revisionTemporalOferta(oferta, ahora);
  return revision !== null && revision.dias >= 0;
}

export function ofertaConCifrasVigentes(oferta, ahora = new Date()) {
  if (cifrasOfertaVigentes(oferta, ahora)) return { ...oferta, cifrasPendientes: false };
  // El resumen y las métricas libres también pueden repetir precio o yield.
  // El original se conserva intacto para trazabilidad, pero no se presenta.
  return { ...oferta, cifrasPendientes: true, rentabilidad: null, precio: null,
    metricas: [], resumen: '', disponibleEs: null, puntuacion: null };
}
