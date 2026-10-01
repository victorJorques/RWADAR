'use strict';

// Contrato puro compartido por el importador, el sincronizador y la app móvil.
// Sin Node, red, almacenamiento ni lectura del fixture; apto para Metro.
const CUENTA_PLATAFORMAS = 26;
const CUENTA_OFERTAS = 28;
const COLECCIONES_OFERTA = Object.freeze(['principales', 'secundario', 'en_camino']);
const MANIFIESTO_CATALOGO_V2 = Object.freeze({ versionEsquema: 2,
  plataformasEsperadas: 26, ofertasEsperadas: 49,
  coleccionesEsperadas: Object.freeze({ principales: 24, secundario: 21, en_camino: 4 }) });
const MAX_VIGENCIA_DIAS = 7;
const ESTADOS_OPERATIVOS = new Set(['observada', 'no_verificable']);
const ESTADOS_LICENCIA = new Set([
  'confirmada_regulador', 'confirmada_documento_producto',
  'no_aplica_plataforma', 'no_verificable', 'sin_registro_declarado',
]);
const ESTADOS_ACCESO = new Set([
  'confirmado_condicionado', 'no_aplica_plataforma', 'no_verificable',
]);
const ESTADOS_OFERTA = new Set(['actual', 'no_verificable', 'fuentes_en_conflicto']);
const TIPOS_OFERTA = new Set(['rendimiento', 'valor']);
const CATEGORIAS = new Map([
  ['Inmobiliario', 'inmobiliario'],
  ['Crédito privado', 'credito-privado'],
  ['Tesoro y fondos', 'tesoro-y-fondos'],
  ['Acciones y capital privado', 'acciones-y-capital-privado'],
  ['Materias primas', 'materias-primas'],
  ['Infraestructura', 'infraestructura'],
]);

const esTexto = (valor, minimo = 1, maximo = Infinity) =>
  typeof valor === 'string' && valor.trim().length >= minimo && valor.trim().length <= maximo;
const esFecha = valor => {
  const texto = String(valor || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const instante = Date.parse(`${texto}T00:00:00Z`);
  return Number.isFinite(instante) && new Date(instante).toISOString().slice(0, 10) === texto;
};
const esHttps = valor => {
  try {
    const url = new URL(String(valor));
    return url.protocol === 'https:' && !url.username && !url.password;
  }
  catch { return false; }
};
const asegurar = (condicion, mensaje) => {
  if (!condicion) throw new Error(mensaje);
};
const fechaIso = valor => valor instanceof Date
  ? valor.toISOString().slice(0, 10) : String(valor || '');
const diasEntre = (inicio, fin) => Math.floor(
  (Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86400000,
);

function validarFuente(fuente, fecha, contexto) {
  asegurar(fuente && typeof fuente === 'object', `${contexto}: fuente ausente`);
  asegurar(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fuente.id || ''), `${contexto}: id de fuente inválido`);
  asegurar(esTexto(fuente.tipo, 3, 60), `${contexto}: tipo de fuente inválido`);
  asegurar(esTexto(fuente.titulo, 3, 300), `${contexto}: título de fuente inválido`);
  asegurar(esHttps(fuente.url), `${contexto}: la fuente no usa HTTPS`);
  asegurar(fuente.primaria === true, `${contexto}: la fuente no es primaria`);
  asegurar(fuente.consultadaEl === fecha, `${contexto}: fuente de otra fecha`);
  return fuente;
}

function validarCampo(campo, estados, fecha, contexto) {
  asegurar(campo && estados.has(campo.estado), `${contexto}: estado inválido`);
  asegurar(esTexto(campo.detalle, 24, 3000), `${contexto}: detalle incompleto`);
  asegurar(Array.isArray(campo.fuentes) && campo.fuentes.length > 0,
    `${contexto}: faltan fuentes`);
  campo.fuentes.forEach((fuente, indice) => validarFuente(fuente, fecha, `${contexto}/${indice}`));
}

function validarVerificacionPlataforma(verificacion, fecha, contexto) {
  asegurar(verificacion && verificacion.verificadoEl === fecha,
    `${contexto}: verificación ausente o de otra fecha`);
  asegurar(verificacion.conservaFechaCanonica === true,
    `${contexto}: no conserva la fecha canónica`);
  validarCampo(verificacion.estadoOperativo, ESTADOS_OPERATIVOS, fecha,
    `${contexto}/estadoOperativo`);
  validarCampo(verificacion.licenciaRegistro, ESTADOS_LICENCIA, fecha,
    `${contexto}/licenciaRegistro`);
  validarCampo(verificacion.acceso, ESTADOS_ACCESO, fecha, `${contexto}/acceso`);
  asegurar(Array.isArray(verificacion.alertasCriticas) && verificacion.alertasCriticas.length > 0,
    `${contexto}: faltan alertas críticas`);
  const codigos = new Set();
  for (const [indice, alerta] of verificacion.alertasCriticas.entries()) {
    asegurar(alerta && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(alerta.codigo || ''),
      `${contexto}/alerta/${indice}: código inválido`);
    asegurar(!codigos.has(alerta.codigo), `${contexto}: alerta duplicada ${alerta.codigo}`);
    codigos.add(alerta.codigo);
    asegurar(esTexto(alerta.detalle, 24, 3000), `${contexto}/${alerta.codigo}: detalle incompleto`);
    asegurar(Array.isArray(alerta.fuentes) && alerta.fuentes.length > 0,
      `${contexto}/${alerta.codigo}: faltan fuentes`);
    alerta.fuentes.forEach((fuente, j) => validarFuente(
      fuente, fecha, `${contexto}/${alerta.codigo}/${j}`));
  }
}

function validarDocumentacionOferta(documentacion, contexto, { hoy = new Date() } = {}) {
  // Ausente en APK8 y en los lotes anteriores. Una sección presente se valida
  // por separado de las cifras comerciales y nunca amplía su vigencia.
  if (documentacion == null) return null;
  const hoyIso = fechaIso(hoy);
  asegurar(esFecha(hoyIso), `${contexto}: fecha de ejecución inválida`);
  asegurar(typeof documentacion === 'object' && !Array.isArray(documentacion),
    `${contexto}: documentación inválida`);
  asegurar(esFecha(documentacion.revisadaEl) && documentacion.revisadaEl <= hoyIso,
    `${contexto}: fecha documental inválida o futura`);
  asegurar(esTexto(documentacion.descripcion, 20, 6000),
    `${contexto}: descripción documental incompleta`);
  asegurar(Array.isArray(documentacion.fuentes) && documentacion.fuentes.length > 0 &&
    documentacion.fuentes.every(esHttps) &&
    new Set(documentacion.fuentes).size === documentacion.fuentes.length,
    `${contexto}: fuentes documentales inválidas`);
  asegurar(Array.isArray(documentacion.caracteristicas) && documentacion.caracteristicas.length > 0 &&
    documentacion.caracteristicas.every(c => esTexto(c?.etiqueta, 1, 180) && esTexto(c?.valor, 1, 3000)),
    `${contexto}: características documentales inválidas`);
  asegurar(Array.isArray(documentacion.referencias), `${contexto}: referencias documentales inválidas`);
  documentacion.referencias.forEach((referencia, indice) => {
    const lugar = `${contexto}/referencia/${indice}`;
    asegurar(esTexto(referencia?.etiqueta, 1, 180) && esTexto(referencia?.valor, 1, 3000) &&
      esTexto(referencia?.alcance, 12, 3000), `${lugar}: referencia incompleta`);
    asegurar(esFecha(referencia.fechaConsulta) && referencia.fechaConsulta <= documentacion.revisadaEl,
      `${lugar}: fecha de consulta inválida o posterior a la revisión`);
    asegurar(referencia.fechaDato === null ||
      (esFecha(referencia.fechaDato) && referencia.fechaDato <= referencia.fechaConsulta),
      `${lugar}: fecha del dato inválida o posterior a la consulta`);
    asegurar(esHttps(referencia.fuente) && documentacion.fuentes.includes(referencia.fuente),
      `${lugar}: fuente no incluida en la documentación`);
  });
  return documentacion;
}

function validarOferta(oferta, fecha, contexto, opciones = {}) {
  asegurar(oferta && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(oferta.slug || ''),
    `${contexto}: slug inválido`);
  asegurar(TIPOS_OFERTA.has(oferta.tipo), `${contexto}: tipo inválido`);
  asegurar(esTexto(oferta.titulo, 3, 180), `${contexto}: título inválido`);
  asegurar(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(oferta.plataformaSlug || ''),
    `${contexto}: slug de plataforma inválido`);
  asegurar(esTexto(oferta.plataformaNombre, 2, 120), `${contexto}: plataforma inválida`);
  asegurar(CATEGORIAS.has(oferta.categoria), `${contexto}: categoría desconocida`);
  asegurar(esTexto(oferta.resumen, 20, 3000), `${contexto}: resumen incompleto`);
  asegurar(esHttps(oferta.url), `${contexto}: URL no HTTPS`);
  asegurar(esFecha(oferta.verificadaEl) && diasEntre(fecha, oferta.verificadaEl) <= MAX_VIGENCIA_DIAS,
    `${contexto}: fecha individual inválida o posterior a la vigencia del radar`);
  asegurar(Number.isInteger(oferta.vigenciaDias) && oferta.vigenciaDias >= 1 &&
    oferta.vigenciaDias <= MAX_VIGENCIA_DIAS, `${contexto}: vigencia inválida`);
  asegurar(ESTADOS_OFERTA.has(oferta.estadoRevision), `${contexto}: estado de revisión inválido`);
  asegurar(Array.isArray(oferta.metricas) && oferta.metricas.length > 0,
    `${contexto}: faltan métricas`);
  asegurar(oferta.metricas.every(m => esTexto(m?.etiqueta, 1, 180) && esTexto(m?.valor, 1, 3000)),
    `${contexto}: métricas fuera de contrato`);
  asegurar(Array.isArray(oferta.avisos) && oferta.avisos.length > 0,
    `${contexto}: faltan avisos`);
  asegurar(oferta.avisos.every(a => esTexto(a?.texto, 1, 3000) &&
    ['ok', 'warn', 'stop', 'neutro'].includes(a?.tono)), `${contexto}: avisos fuera de contrato`);
  asegurar(oferta.precio == null || (esTexto(oferta.precio?.mostrado, 1, 180) &&
    esTexto(oferta.precio?.unidad, 1, 2000)), `${contexto}: precio fuera de contrato`);
  asegurar(oferta.rentabilidad == null || (esTexto(oferta.rentabilidad?.mostrada, 1, 180) &&
    esTexto(oferta.rentabilidad?.literal, 1, 2000)), `${contexto}: rentabilidad fuera de contrato`);
  asegurar(Array.isArray(oferta.fuentesActuales) && oferta.fuentesActuales.length > 0 &&
    oferta.fuentesActuales.every(esHttps), `${contexto}: fuentes actuales inválidas`);
  validarDocumentacionOferta(oferta.documentacion, `${contexto}/documentacion`, opciones);
  if (oferta.estadoRevision !== 'actual') {
    asegurar(oferta.rentabilidad == null && oferta.precio == null,
      `${contexto}: una oferta bloqueada conserva cifras comerciales`);
  }
}

function validarLotePublico(plataformas, ofertas, { hoy = new Date() } = {}) {
  asegurar(Array.isArray(plataformas) && plataformas.length === CUENTA_PLATAFORMAS,
    `el lote público debe contener ${CUENTA_PLATAFORMAS} plataformas`);
  asegurar(Array.isArray(ofertas) && ofertas.length === CUENTA_OFERTAS,
    `el lote público debe contener ${CUENTA_OFERTAS} ofertas`);
  asegurar(new Set(plataformas.map(p => p.slug)).size === CUENTA_PLATAFORMAS,
    'hay slugs de plataforma duplicados');
  asegurar(new Set(ofertas.map(o => o.slug)).size === CUENTA_OFERTAS,
    'hay slugs de oferta duplicados');
  const revisiones = new Set([...plataformas, ...ofertas].map(x => x.revision_id));
  asegurar(revisiones.size === 1 && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test([...revisiones][0] || ''),
    'el lote mezcla revisiones o carece de revision_id');
  const fechas = new Set(plataformas.map(p => fechaIso(p.verificacion_local?.verificadoEl)));
  asegurar(fechas.size === 1, 'el radar mezcla fechas de revisión');
  const [fecha] = fechas;
  asegurar(esFecha(fecha), 'la fecha del lote no es válida');
  const hoyIso = fechaIso(hoy);
  asegurar(esFecha(hoyIso), 'la fecha de ejecución no es válida');
  const edad = diasEntre(fecha, hoyIso);
  asegurar(edad >= 0, 'la revisión está fechada en el futuro');
  asegurar(edad <= MAX_VIGENCIA_DIAS, `la revisión tiene ${edad} días y está caducada`);

  plataformas.forEach((plataforma, indice) => {
    asegurar(plataforma && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plataforma.slug || ''),
      `plataforma/${indice}: slug inválido`);
    asegurar(esTexto(plataforma.nombre, 2, 120), `plataforma/${indice}: nombre inválido`);
    validarVerificacionPlataforma(plataforma.verificacion_local, fecha,
      `plataforma/${plataforma.slug}`);
  });
  ofertas.forEach((oferta, indice) => {
    asegurar(oferta?.patrocinada === false,
      `oferta/${indice}: patrocinio no habilitado en el catálogo editorial gratuito`);
    const normalizada = {
      ...oferta,
      plataformaSlug: oferta.plataforma_slug,
      plataformaNombre: oferta.plataforma_nombre,
      verificadaEl: fechaIso(oferta.verificada_el),
      vigenciaDias: oferta.vigencia_dias,
      disponibleEs: oferta.disponible_es,
      fueraLadrillo: oferta.fuera_ladrillo,
      estadoRevision: oferta.estado_revision,
      fuentesActuales: oferta.fuentes_actuales,
    };
    validarOferta(normalizada, fecha, `oferta/${oferta.slug || indice}`, { hoy: hoyIso });
    asegurar(normalizada.verificadaEl <= hoyIso, `oferta/${oferta.slug || indice}: fecha futura`);
  });
  return { fecha, edadDias: edad, revisionId: [...revisiones][0] };
}

function validarManifiestoV2(manifiesto) {
  asegurar(manifiesto && manifiesto.versionEsquema === 2,
    'V2: falta un manifiesto explícito de esquema 2');
  for (const campo of ['plataformasEsperadas', 'ofertasEsperadas']) {
    asegurar(Number.isInteger(manifiesto[campo]) && manifiesto[campo] > 0 &&
      manifiesto[campo] <= 32767, `V2: ${campo} inválido`);
  }
  const colecciones = manifiesto.coleccionesEsperadas;
  asegurar(colecciones && typeof colecciones === 'object' && !Array.isArray(colecciones) &&
    Object.keys(colecciones).length === COLECCIONES_OFERTA.length &&
    COLECCIONES_OFERTA.every(c => Number.isInteger(colecciones[c]) && colecciones[c] >= 0),
    'V2: manifiesto de colecciones inválido');
  asegurar(colecciones.principales > 0 &&
    COLECCIONES_OFERTA.reduce((total, c) => total + colecciones[c], 0) === manifiesto.ofertasEsperadas,
    'V2: el total de colecciones no coincide con el manifiesto');
  return manifiesto;
}

// permitirCaducado: el catálogo se publica siempre salvo orden expresa de
// retirada (decisión del 1/10/2026). Un lote completo y vencido se acepta
// marcado con `caducado`; uno futuro, incompleto o mezclado sigue fallando.
function validarLotePublicoV2(plataformas, ofertas, { manifiesto, hoy = new Date(), permitirCaducado = false } = {}) {
  validarManifiestoV2(manifiesto);
  asegurar(Array.isArray(plataformas) && plataformas.length === manifiesto.plataformasEsperadas,
    'V2: plataformas incompletas respecto al manifiesto');
  asegurar(Array.isArray(ofertas) && ofertas.length === manifiesto.ofertasEsperadas,
    'V2: ofertas incompletas respecto al manifiesto');
  asegurar(new Set(plataformas.map(p => p?.slug)).size === plataformas.length,
    'V2: slugs de plataforma duplicados');
  asegurar(new Set(ofertas.map(o => o?.slug)).size === ofertas.length,
    'V2: slugs de oferta duplicados');
  const filas = [...plataformas, ...ofertas];
  const revisiones = new Set(filas.map(x => x?.revision_id));
  asegurar(revisiones.size === 1 && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test([...revisiones][0] || ''),
    'V2: el lote mezcla revisiones o carece de revision_id');
  const fecha = fechaIso(filas[0]?.verificado_lote_el);
  const vigencia = filas[0]?.vigencia_lote_dias;
  asegurar(esFecha(fecha) && Number.isInteger(vigencia) && vigencia >= 1 && vigencia <= MAX_VIGENCIA_DIAS,
    'V2: fecha o vigencia del lote inválida');
  for (const fila of filas) {
    asegurar(fila.version_esquema === 2 &&
      fila.plataformas_esperadas === manifiesto.plataformasEsperadas &&
      fila.ofertas_esperadas === manifiesto.ofertasEsperadas &&
      fechaIso(fila.verificado_lote_el) === fecha && fila.vigencia_lote_dias === vigencia &&
      fila.colecciones_esperadas &&
      Object.keys(fila.colecciones_esperadas).length === COLECCIONES_OFERTA.length &&
      COLECCIONES_OFERTA.every(c => fila.colecciones_esperadas[c] === manifiesto.coleccionesEsperadas[c]),
      'V2: metadatos de revisión ausentes, distintos o ajenos al manifiesto');
  }
  const hoyIso = fechaIso(hoy);
  asegurar(esFecha(hoyIso), 'V2: fecha de ejecución inválida');
  const edad = diasEntre(fecha, hoyIso);
  const caducado = edad > vigencia;
  asegurar(edad >= 0 && (permitirCaducado || !caducado), 'V2: revisión futura o caducada');
  plataformas.forEach((p, i) => {
    asegurar(p && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug || '') && esTexto(p.nombre, 2, 120),
      `V2/plataforma/${i}: identidad inválida`);
    validarVerificacionPlataforma(p.verificacion_local, fecha, `V2/plataforma/${p.slug}`);
  });
  for (const coleccion of COLECCIONES_OFERTA) {
    asegurar(ofertas.filter(o => o.coleccion === coleccion).length === manifiesto.coleccionesEsperadas[coleccion],
      `V2: colección ${coleccion} incompleta respecto al manifiesto`);
  }
  ofertas.forEach((o, i) => {
    asegurar(COLECCIONES_OFERTA.includes(o.coleccion), `V2/oferta/${i}: colección inválida`);
    asegurar(o.patrocinada === false, `V2/oferta/${i}: patrocinio no habilitado`);
    const normalizada = { ...o, plataformaSlug: o.plataforma_slug,
      plataformaNombre: o.plataforma_nombre, verificadaEl: fechaIso(o.verificada_el),
      vigenciaDias: o.vigencia_dias, estadoRevision: o.estado_revision, fuentesActuales: o.fuentes_actuales };
    validarOferta(normalizada, fecha, `V2/oferta/${o.slug || i}`, { hoy: hoyIso });
    asegurar(normalizada.verificadaEl <= hoyIso, `V2/oferta/${o.slug}: fecha futura`);
    asegurar(o.documentacion != null, `V2/oferta/${o.slug}: falta documentación`);
    if (o.coleccion !== 'principales') {
      asegurar(o.estado_revision === 'no_verificable' && o.precio == null &&
        o.rentabilidad == null && o.puntuacion == null && o.disponible_es == null,
        `V2/oferta/${o.slug}: una colección documental conserva cifras comerciales`);
    }
  });
  return { fecha, edadDias: edad, vigenciaDias: vigencia, caducado, revisionId: [...revisiones][0], versionEsquema: 2,
    coleccionesEsperadas: { ...manifiesto.coleccionesEsperadas } };
}

module.exports = {
  CUENTA_PLATAFORMAS,
  CUENTA_OFERTAS,
  COLECCIONES_OFERTA,
  MANIFIESTO_CATALOGO_V2,
  MAX_VIGENCIA_DIAS,
  CATEGORIAS,
  esFecha,
  asegurar,
  validarFuente,
  validarVerificacionPlataforma,
  validarDocumentacionOferta,
  validarOferta,
  validarLotePublico,
  validarManifiestoV2,
  validarLotePublicoV2,
};
