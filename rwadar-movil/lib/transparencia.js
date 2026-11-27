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
import { detalleDisponibilidad, disponibilidadDe, estadoEnPais, nombrePais } from './disponibilidad-pais';
import { obtenerPais } from './pais-usuario';

/* País de residencia (27/11/2026), como la web: lo que decía «España» lo dice el país
   elegido. Sin reglas por país y con España: la referencia «Acceso desde España». */
const ETIQUETAS_PAIS = { disponible: 'Disponible', con_requisitos: 'Con requisitos', no_disponible: 'No disponible', sin_confirmar: 'Sin confirmar' };
export function estadoTextoPais(oferta, resumen, pais = obtenerPais()) {
  if (disponibilidadDe(oferta)) return estadoEnPais(oferta, pais).estado;
  if (pais !== 'ES') return 'sin_confirmar';
  const a = resumen && resumen.accesoEspana && resumen.accesoEspana.estado;
  return a === 'si' ? 'disponible' : a === 'no' ? 'no_disponible' : 'sin_confirmar';
}
export function textoPaisOferta(oferta, resumen, corto = false, pais = obtenerPais()) {
  const e = estadoTextoPais(oferta, resumen, pais), t = ETIQUETAS_PAIS[e] || 'Sin confirmar';
  return corto || e === 'sin_confirmar' ? t : `${t}, según la fuente`;
}
export const nombrePaisUsuario = (pais = obtenerPais()) => nombrePais(pais, 'es') || 'España';
/* La sección «Disponibilidad por país» de la ficha: los nombres y estados en castellano (los traduce el
   diccionario); nota y requisito en el idioma de la app (son datos con su versión inglesa). */
export function detallePaisOferta(oferta, idioma = 'es', pais = obtenerPais()) {
  const es = detalleDisponibilidad(oferta, pais, 'es'), en = detalleDisponibilidad(oferta, pais, 'en');
  const de = idioma === 'en' ? en : es;
  return { ...es, texto: ETIQUETAS_PAIS[es.estado] || 'Sin confirmar', conReglas: !!disponibilidadDe(oferta),
    requisito: de.requisito, nota: de.nota, conRequisitos: es.conRequisitos.map((r, i) => ({ paises: r.paises, requisito: de.conRequisitos[i].requisito })) };
}

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
  ['contratable', 'Se contrata hoy desde tu país de residencia'],
  ['supervisada', 'Referencia España: autorizada por un supervisor de la UE e inscrita en la CNMV'],
  ['documentoEspana', 'Referencia España: hay folleto o KID oficial para su venta en España'],
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
  tabla = TRANSPARENCIA_POR_SLUG, criterios = CRITERIOS_TRANSPARENCIA, pais = obtenerPais() } = {}) {
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
  /* Se contrata desde el país elegido: con reglas por país, su estado y su primera fuente;
     sin ellas y con España, lo de siempre (disponibleEs y «Acceso desde España»). */
  const dispo = disponibilidadDe(o), ep = estadoTextoPais(o, r, pais);
  const f0 = dispo && dispo.fuentes[0];
  const citaPais = f0 && urlHttps(f0.url) ? { url: urlHttps(f0.url), titulo: texto(f0.titulo) || nombreFuente(f0.url), fecha: fechaValida(f0.consultadaEl) ? f0.consultadaEl : '' } : null;
  const contratable = o.coleccion === 'principales' && !caducado && (dispo ? ep === 'disponible' && !!citaPais
    : pais === 'ES' && o.disponibleEs === true && !!(acceso && acceso.estado === 'si' && cita(acceso)));
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
    contratable: { cumple: contratable, fuente: dispo ? citaPais : cita(acceso), motivo: contratable
      ? 'Es una oferta principal y la fuente dice que se contrata desde tu país de residencia.'
      : o.coleccion === 'secundario' ? 'Está en Reventa: RWAdar no confirma que se pueda contratar hoy; compruébalo en la fuente.'
        : o.coleccion === 'en_camino' ? 'Es un anuncio: todavía no se puede contratar.'
          : caducado ? vencida
            : ep === 'no_disponible' ? 'La fuente dice que no se ofrece en tu país de residencia.'
              : ep === 'con_requisitos' ? 'Desde tu país, solo si cumples sus requisitos (los tienes en «Disponibilidad por país»).'
                : 'No consta en la fuente que se contrate desde tu país de residencia.' },
    supervisada: editorial('supervisada'),
    documentoEspana: editorial('documentoEspana'),
    minimoSalida: { cumple: minimo && salida, fuente: minimo ? cita(r.minimo) : cita(r.salida), partes,
      motivo: partes.map((x) => (x.length > 1 ? `${x[0]} ${x[1]}.` : x[0])).join(' ') },
    vigente: { cumple: vigente, fuente: null, motivo: vigente ? `Revisada el ${fechaES(o.verificadaEl)}; ${estado.texto}.`
      : o.estadoRevision === 'fuentes_en_conflicto' ? 'Las fuentes no coinciden.'
        : o.estadoRevision === 'no_verificable' ? 'No se pudo confirmar en la revisión.' : 'La revisión semanal ha caducado.' },
  };
  return textos.map((c) => ({ ...c, ...lista[c.id] }));
}

export function avisoBloqueo(oferta) {
  return (oferta && Array.isArray(oferta.avisos) ? oferta.avisos : [])
    .find((x) => x && x.tono === 'stop' && texto(x.texto)) || null;
}

/* Una oferta con aviso crítico nunca entra en la Selección (falla cerrado). */
/* Fuera de España, los dos criterios de referencia española (CNMV y folleto o KID para España)
   se enseñan, pero no deciden la Selección ni se trasladan a la regulación de otro país. */
export function enSeleccionOferta(oferta, resumen, opciones = {}) {
  const pais = opciones.pais || obtenerPais();
  return !!transparenciaOferta(oferta, opciones.tabla) && !avisoBloqueo(oferta) &&
    comprobacionesOferta(oferta, resumen, { ...opciones, pais })
      .every((c) => c.cumple || (pais !== 'ES' && (c.id === 'supervisada' || c.id === 'documentoEspana')));
}

export function puntosFuertesOferta(oferta, tabla = TRANSPARENCIA_POR_SLUG) {
  const e = transparenciaOferta(oferta, tabla);
  return e && Array.isArray(e.puntos) ? e.puntos.filter((x) => x && texto(x.texto)) : [];
}

/* Mínimo · España · Salida en forma corta (decisión de Víctor del 03/11).
   Sin revisión vigente no hay cifras: manda lo que calcula resumenOferta. */
export function datosCortosOferta(oferta, resumen, { catalogoCaducado = false, tabla = TRANSPARENCIA_POR_SLUG, pais = obtenerPais() } = {}) {
  const r = resumen || {};
  const e = transparenciaOferta(oferta, tabla), acceso = r.accesoEspana && r.accesoEspana.estado;
  const minimo = minimoDocumentado(r) && !catalogoCaducado
    ? (e && texto(e.minimoCorto)) || textoCorto(datoBreve(r.minimo)) : datoBreve(r.minimo);
  const salida = salidaDocumentada(r) && !catalogoCaducado
    ? (e && texto(e.salidaCorta)) || textoCorto(datoBreve(r.salida).replace(/^Salida:\s*/, ''))
    : pendienteRevalidar(r, catalogoCaducado) ? 'Pendiente de volver a comprobar' : 'Sin documentar';
  return [['Mínimo', minimo], [nombrePaisUsuario(pais), textoPaisOferta(oferta, r, false, pais)], ['Salida', salida]];
}

/* España con UNA función para la tarjeta y la ficha, como la web
   (textoEspanaOferta). La lista dice solo «Sí» o «No» (decisión de Víctor del
   05/11/2026); la ficha, «Sí, según la fuente», con la fuente al lado. */
export function textoEspanaOferta(resumen, corto = false) {
  const acceso = resumen && resumen.accesoEspana && resumen.accesoEspana.estado;
  return acceso === 'si' ? (corto ? 'Sí' : 'Sí, según la fuente')
    : acceso === 'no' ? (corto ? 'No' : 'No, según la fuente') : 'Sin confirmar';
}

/* La tarjeta de la lista (05/11/2026): solo dos datos, el mínimo de
   datosCortosOferta y España en corto. Sin cifras nuevas: con la revisión o
   el catálogo caducados manda lo mismo que en la ficha. Si la oferta no se
   contrata desde España (noEspana), el dato dice «No»: nunca «Sin confirmar»
   al lado de «No disponible en España». Igual que la web. */
export function datosTarjetaOferta(oferta, resumen, { noEspana = false, pais = obtenerPais(), ...opciones } = {}) {
  const [minimo] = datosCortosOferta(oferta, resumen, { ...opciones, pais });
  return [minimo, [nombrePaisUsuario(pais), noEspana ? 'No disponible' : textoPaisOferta(oferta, resumen, true, pais)]];
}
/* Si la oferta no se ofrece en el país elegido (la tarjeta lo dice en su fila). */
export function noDisponiblePais(oferta, resumen, pais = obtenerPais()) {
  if (!disponibilidadDe(oferta) && pais === 'ES') return !!oferta && oferta.disponibleEs === false;
  return estadoTextoPais(oferta, resumen, pais) === 'no_disponible';
}
