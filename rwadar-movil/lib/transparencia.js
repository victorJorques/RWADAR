/* ---------------------------------------------------------------------
   Transparencia de cada oferta: la misma lógica que la web
   ---------------------------------------------------------------------
   Copiada de `rwadar-site/assets/rwadar-20260820.js` (transparenciaOferta,
   comprobacionesOferta, enSeleccionOferta, puntosFuertesOferta y
   datosTarjetaOfertaHtml) para que la app y la web digan lo mismo.

   Cinco comprobaciones de la documentación, no una recomendación ni una
   nota: dos salen de transparencia.json (con su motivo y su fuente) y tres
   del catálogo. FALLA CERRADO: sin entrada, o con otra `verificadaEl`, la
   oferta no enseña puntos fuertes ni entra en la Selección; con el
   catálogo caducado no se afirma nada sobre «hoy»; una oferta con un aviso
   crítico (tono stop) nunca entra en la Selección.
   --------------------------------------------------------------------- */
import { CRITERIOS_TRANSPARENCIA, TRANSPARENCIA_POR_SLUG } from './transparencia-contenido';

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const dia = /^\d{4}-\d{2}-\d{2}$/;

export function fechaValida(v) {
  if (typeof v !== 'string' || !dia.test(v)) return false;
  const n = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === v;
}

export function fechaES(v) {
  if (!fechaValida(v)) return '';
  const [a, m, d] = v.split('-');
  return `${d}/${m}/${a}`;
}

export function urlHttps(v) {
  try {
    const url = new URL(texto(v));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function nombreFuente(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Fuente documental'; }
}

const TEXTOS = [
  ['contratable', 'Se contrata hoy desde España'],
  ['supervisada', 'La entidad que la ofrece está autorizada por un supervisor de la UE e inscrita en la CNMV'],
  ['documentoEspana', 'Hay un documento oficial (KID o folleto) que cubre su venta en España'],
  ['minimoSalida', 'El mínimo y la forma de salir están documentados'],
  ['vigente', 'Revisada esta semana y sin fuentes en conflicto'],
];

export function criteriosTransparencia(criterios = CRITERIOS_TRANSPARENCIA) {
  const lista = Array.isArray(criterios) ? criterios : [];
  return TEXTOS.map(([id, porDefecto]) => {
    const c = lista.find((x) => x && x.id === id);
    return { id, texto: (c && texto(c.texto)) || porDefecto };
  });
}

/* La entrada editorial solo vale para la misma revisión de la oferta. */
export function transparenciaOferta(oferta, tabla = TRANSPARENCIA_POR_SLUG) {
  const t = tabla && typeof tabla === 'object' ? tabla : null;
  const slug = oferta && typeof oferta.slug === 'string' ? oferta.slug : '';
  const e = t && slug && Object.prototype.hasOwnProperty.call(t, slug) ? t[slug] : null;
  return e && fechaValida(oferta.verificadaEl) && e.verificadaEl === oferta.verificadaEl ? e : null;
}

/* Igual que `estadoVigenciaLocal` de la web: lo que no es una principal
   vigente cuenta como «caducado» a efectos de afirmar algo sobre hoy. */
export function estadoVigencia(oferta, ahora = new Date()) {
  const o = oferta || {};
  if (o.coleccion != null && o.coleccion !== 'principales') {
    return { caducado: true, texto: o.coleccion === 'en_camino'
      ? 'anunciada · sin confirmar que abra' : 'reventa · sin confirmar que se pueda operar' };
  }
  if (o.estadoRevision === 'no_verificable') return { caducado: true, texto: 'apertura no confirmada' };
  if (o.estadoRevision === 'fuentes_en_conflicto') return { caducado: true, texto: 'fuentes en conflicto' };
  const base = Date.parse(`${o.verificadaEl}T00:00:00Z`), ttl = Number(o.vigenciaDias);
  const reloj = new Date(ahora);
  if (!fechaValida(o.verificadaEl) || !Number.isInteger(ttl) || ttl < 1 || !Number.isFinite(reloj.getTime()) ||
      (o.estadoRevision != null && o.estadoRevision !== 'actual')) return { caducado: true, texto: 'sin fecha de validez' };
  const hoy = Date.UTC(reloj.getUTCFullYear(), reloj.getUTCMonth(), reloj.getUTCDate());
  if (base > hoy) return { caducado: true, texto: 'fecha de revisión errónea' };
  const resta = Math.floor((base + ttl * 86400000 - hoy) / 86400000);
  if (resta < 0) return { caducado: true, texto: 'cifras por actualizar' };
  /* Dicen hasta cuándo valen las cifras, en días enteros (LISTA-FINAL fila 14). */
  return { caducado: false, texto: resta === 0 ? 'cifras válidas hasta hoy' : `cifras válidas ${resta} ${resta === 1 ? 'día' : 'días'} más` };
}

export function minimoDocumentado(r) {
  return !!(r && r.minimo && (Number.isFinite(r.minimo.euros) || texto(r.minimo.unidadDocumentada)));
}
export function salidaDocumentada(r) {
  return !!(r && r.salida && texto(r.salida.texto) &&
    !['Salida no documentada', 'Salida por volver a comprobar'].includes(r.salida.texto));
}
/* Con la revisión vencida el dato existe pero falta revalidarlo: no es «sin documentar». */
export function pendienteRevalidar(r, catalogoCaducado = false) {
  return !!(r && (r.vencida === true || catalogoCaducado || (r.salida && r.salida.texto === 'Salida por volver a comprobar')));
}

/* Forma corta de un dato de la tarjeta (como textoBreveDatoTarjetaLocal). */
export function datoBreve(campo) {
  if (campo && campo.texto === 'No documentado en euros' && texto(campo.unidadDocumentada)) return texto(campo.unidadDocumentada);
  return ({
    'No documentado en euros': 'No verificado', 'Sin mínimo vigente en euros': 'No verificado',
    'Sin comprobar si se puede contratar desde España': 'Sin confirmar', 'Salida no documentada': 'Sin documentar',
    'Disponible desde España según la fuente': 'Disponible',
    'No disponible desde España según la fuente': 'No disponible',
  })[campo && campo.texto] || (campo && campo.texto) || '';
}

/* Corta en una palabra, nunca a media palabra. */
export function textoCorto(v, max = 40) {
  const t = texto(v);
  if (t.length <= max) return t;
  const c = t.slice(0, max + 1), i = c.lastIndexOf(' ');
  return (i > 12 ? c.slice(0, i) : t.slice(0, max)).replace(/[\s,;:·.(-]+$/, '') + '…';
}

export function comprobacionesOferta(oferta, resumen, { ahora = new Date(), catalogoCaducado = false,
  tabla = TRANSPARENCIA_POR_SLUG, criterios = CRITERIOS_TRANSPARENCIA } = {}) {
  const o = oferta || {};
  const r = resumen || {};
  const e = transparenciaOferta(o, tabla), estado = estadoVigencia(o, ahora), textos = criteriosTransparencia(criterios);
  const cita = (c) => (c && urlHttps(c.fuente)
    ? { url: urlHttps(c.fuente), titulo: nombreFuente(c.fuente), fecha: fechaValida(c.consultadaEl) ? c.consultadaEl : '' } : null);
  /* Los motivos de supervisada y documentoEspana son texto editorial de
     transparencia.json (deFuente); los demás los escribe la interfaz. */
  const editorial = (campo) => (e && e[campo] ? {
    cumple: e[campo].cumple === true, motivo: texto(e[campo].motivo), deFuente: true,
    fuente: urlHttps(e[campo].fuente && e[campo].fuente.url)
      ? { url: urlHttps(e[campo].fuente.url), titulo: texto(e[campo].fuente.titulo), fecha: e[campo].consultadaEl } : null,
  } : { cumple: false, motivo: 'Todavía no hemos comprobado este punto en la revisión actual.', fuente: null });
  const caducado = catalogoCaducado || estado.caducado;
  const acceso = r.accesoEspana;
  const contratable = o.coleccion === 'principales' && o.disponibleEs === true && !caducado &&
    !!(acceso && acceso.estado === 'si' && cita(acceso));
  const pendiente = caducado || pendienteRevalidar(r, catalogoCaducado);
  const minimo = !pendiente && minimoDocumentado(r), salida = !pendiente && salidaDocumentada(r);
  const vigente = o.estadoRevision === 'actual' && !caducado;
  const vencida = 'Pendiente de volver a comprobar: la revisión semanal ha caducado.';
  /* Mínimo y salida: la etiqueta es de la interfaz y el dato, de la fuente. */
  const partes = [
    minimo ? ['Mínimo:', datoBreve(r.minimo).replace(/\.$/, '')] : [pendiente ? 'Mínimo por volver a comprobar.' : 'Mínimo sin documentar.'],
    salida ? ['Salida:', texto(r.salida.texto).replace(/^Salida:\s*/, '').replace(/\.$/, '')]
      : [pendiente ? 'Salida por volver a comprobar.' : 'Salida sin documentar.'],
  ];
  const lista = {
    contratable: { cumple: contratable, fuente: cita(acceso), motivo: contratable
      ? 'Es una oferta principal y la fuente dice que se contrata desde España.'
      : o.coleccion === 'secundario' ? 'Es una referencia de reventa entre inversores, no una oferta abierta.'
        : o.coleccion === 'en_camino' ? 'Es un anuncio: todavía no se puede contratar.'
          : o.disponibleEs === false ? 'La fuente dice que no se contrata desde España.'
            : caducado ? vencida : 'No consta en la fuente que se contrate desde España.' },
    supervisada: editorial('supervisada'),
    documentoEspana: editorial('documentoEspana'),
    minimoSalida: { cumple: minimo && salida, fuente: minimo ? cita(r.minimo) : cita(r.salida), partes,
      motivo: partes.map((x) => (x.length > 1 ? `${x[0]} ${x[1]}.` : x[0])).join(' ') },
    vigente: { cumple: vigente, fuente: null, motivo: vigente ? `Revisada el ${fechaES(o.verificadaEl)}; ${estado.texto}.`
      : o.estadoRevision === 'fuentes_en_conflicto' ? 'Las fuentes no coinciden.'
        : o.estadoRevision === 'no_verificable' ? 'No se pudo confirmar en la revisión.' : 'La revisión semanal ha vencido.' },
  };
  return textos.map((c) => ({ ...c, ...lista[c.id] }));
}

export function avisoBloqueo(oferta) {
  return (oferta && Array.isArray(oferta.avisos) ? oferta.avisos : [])
    .find((x) => x && x.tono === 'stop' && texto(x.texto)) || null;
}

/* Una oferta con aviso crítico nunca entra en la Selección (falla cerrado). */
export function enSeleccionOferta(oferta, resumen, opciones = {}) {
  return !!transparenciaOferta(oferta, opciones.tabla) && !avisoBloqueo(oferta) &&
    comprobacionesOferta(oferta, resumen, opciones).every((c) => c.cumple);
}

export function puntosFuertesOferta(oferta, tabla = TRANSPARENCIA_POR_SLUG) {
  const e = transparenciaOferta(oferta, tabla);
  return e && Array.isArray(e.puntos) ? e.puntos.filter((x) => x && texto(x.texto)) : [];
}

/* Mínimo · España · Salida en forma corta (decisión de Víctor del 03/11).
   Sin revisión vigente no hay cifras: manda lo que calcula resumenOferta. */
export function datosCortosOferta(oferta, resumen, { catalogoCaducado = false, tabla = TRANSPARENCIA_POR_SLUG } = {}) {
  const r = resumen || {};
  const e = transparenciaOferta(oferta, tabla), acceso = r.accesoEspana && r.accesoEspana.estado;
  const minimo = minimoDocumentado(r) && !catalogoCaducado
    ? (e && texto(e.minimoCorto)) || textoCorto(datoBreve(r.minimo)) : datoBreve(r.minimo);
  const salida = salidaDocumentada(r) && !catalogoCaducado
    ? (e && texto(e.salidaCorta)) || textoCorto(datoBreve(r.salida).replace(/^Salida:\s*/, ''))
    : pendienteRevalidar(r, catalogoCaducado) ? 'Pendiente de volver a comprobar' : 'Sin documentar';
  const espana = acceso === 'si' ? 'Sí, según la fuente' : acceso === 'no' ? 'No, según la fuente' : 'Sin confirmar';
  return [['Mínimo', minimo], ['España', espana], ['Salida', salida]];
}
