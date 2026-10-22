'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  CUENTA_PLATAFORMAS,
  CUENTA_OFERTAS,
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
  COLECCIONES_OFERTA,
  MANIFIESTO_CATALOGO_V2,
  LIMITES_CATALOGO_V2,
} = require('../rwadar-movil/lib/contrato-catalogo');

function cargarFuentesLocales(raiz = path.join(__dirname, '..'), { revision, versionEsquema = 1 } = {}) {
  if (revision !== undefined) {
    asegurar(esFecha(revision), 'fecha de revisión local inválida');
    asegurar([1, 2].includes(versionEsquema), 'versión de revisión local inválida');
    const carpeta = path.join(raiz, 'rwadar-app', 'data', 'verificaciones',
      `${revision}${versionEsquema === 2 ? '-v2' : ''}`);
    const radar = JSON.parse(fs.readFileSync(path.join(carpeta, 'radar-canonico-26.json'), 'utf8'));
    const escaparate = JSON.parse(fs.readFileSync(path.join(carpeta, 'escaparate-publicacion.json'), 'utf8'));
    asegurar(escaparate.versionEsquema === versionEsquema, 'el esquema local no coincide con la carpeta solicitada');
    const manifiesto = escaparate.versionEsquema === 2
      ? normalizarManifiestoLocal(JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto-catalogo.json'), 'utf8')))
      : undefined;
    if (manifiesto) validarManifiestoV2(manifiesto);
    const rutaDocumentacion = path.join(carpeta, 'documentacion-ofertas.json');
    let fechaDocumentacion = null;
    if (fs.existsSync(rutaDocumentacion)) {
      const documentacion = JSON.parse(fs.readFileSync(rutaDocumentacion, 'utf8'));
      asegurar(documentacion && typeof documentacion === 'object' && !Array.isArray(documentacion),
        'documentación local: se esperaba un mapa por slug');
      const slugs = escaparate.ofertas.map(o => o.slug);
      asegurar(Object.keys(documentacion).length === (manifiesto?.ofertasEsperadas ?? CUENTA_OFERTAS) &&
        slugs.every(slug => Object.hasOwn(documentacion, slug) && documentacion[slug] != null),
        'documentación local: el mapa debe corresponder al manifiesto de ofertas');
      for (const slug of slugs) validarDocumentacionOferta(documentacion[slug], `documentación/${slug}`);
      fechaDocumentacion = Object.values(documentacion).map(d => d.revisadaEl).sort().at(-1);
      escaparate.ofertas = escaparate.ofertas.map(o => ({ ...o, documentacion: documentacion[o.slug] }));
    }
    // Una entrega documental puede ser posterior al radar sin revalidarlo.
    // La carpeta debe corresponder al radar o al último documento real del mapa.
    asegurar(radar.verificadoEl === revision ||
      (esFecha(radar.verificadoEl) && radar.verificadoEl < revision && fechaDocumentacion === revision),
      'la revisión no coincide con su carpeta ni con el corte documental');
    return { radar, escaparate, ...(manifiesto ? { manifiesto } : {}) };
  }
  const radar = JSON.parse(fs.readFileSync(path.join(
    raiz, 'rwadar-app', 'data', 'verificaciones', '2026-09-21', 'radar-canonico-26.json'), 'utf8'));
  const escaparate = JSON.parse(fs.readFileSync(path.join(
    raiz, 'rwadar-movil', 'fixtures', 'escaparate-local.json'), 'utf8'));
  return { radar, escaparate };
}

function normalizarManifiestoLocal(valor) {
  asegurar(valor && typeof valor === 'object' && !Array.isArray(valor), 'manifiesto local ausente');
  return validarManifiestoV2({ versionEsquema: valor.version_esquema,
    plataformasEsperadas: valor.plataformas_esperadas, ofertasEsperadas: valor.ofertas_esperadas,
    coleccionesEsperadas: valor.colecciones_esperadas });
}

function validarFuentesLocales({ radar, escaparate, manifiesto }) {
  const v2 = escaparate?.versionEsquema === 2;
  if (v2) validarManifiestoV2(manifiesto);
  const plataformasEsperadas = v2 ? manifiesto.plataformasEsperadas : CUENTA_PLATAFORMAS;
  const ofertasEsperadas = v2 ? manifiesto.ofertasEsperadas : CUENTA_OFERTAS;
  asegurar(radar && radar.version === 1 && esFecha(radar.verificadoEl),
    'radar local: cabecera inválida');
  asegurar(Array.isArray(radar.fuentes) && radar.fuentes.length > 0,
    'radar local: faltan fuentes');
  asegurar(Array.isArray(radar.plataformas) && radar.plataformas.length === plataformasEsperadas,
    `radar local: se esperaban ${plataformasEsperadas} plataformas`);
  asegurar(escaparate && [1, 2].includes(escaparate.versionEsquema) &&
    esFecha(escaparate.fuente?.actualizacionLocal?.verificadoEl) &&
    escaparate.fuente?.actualizacionRadarLocal?.verificadoEl === radar.verificadoEl,
    'escaparate local: fecha o esquema incoherente');
  asegurar(Array.isArray(escaparate.plataformas) && escaparate.plataformas.length === plataformasEsperadas,
    'escaparate local: plataformas incompletas');
  asegurar(Array.isArray(escaparate.ofertas) && escaparate.ofertas.length === ofertasEsperadas,
    'escaparate local: ofertas incompletas');
  if (v2) {
    asegurar(new Set(escaparate.ofertas.map(o => o.slug)).size === ofertasEsperadas,
      'escaparate local: slugs de oferta duplicados');
    asegurar(new Set(escaparate.plataformas.map(p => p.slug)).size === plataformasEsperadas,
      'escaparate local: slugs de plataforma duplicados');
  }
  const porSlug = new Map(radar.plataformas.map(p => [p.slug, p]));
  const idsFuente = new Set(radar.fuentes.map(f => f.id));
  radar.fuentes.forEach((f, i) => validarFuente(f, radar.verificadoEl, `fuente/${i}`));
  escaparate.plataformas.forEach((p, i) => {
    asegurar(porSlug.has(p.slug), `plataforma local desconocida: ${p.slug}`);
    validarVerificacionPlataforma(p.verificacionLocal, radar.verificadoEl,
      `plataforma/${p.slug || i}`);
    const fuenteIds = [
      ...p.verificacionLocal.estadoOperativo.fuentes,
      ...p.verificacionLocal.licenciaRegistro.fuentes,
      ...p.verificacionLocal.acceso.fuentes,
      ...p.verificacionLocal.alertasCriticas.flatMap(a => a.fuentes),
    ].map(f => f.id);
    asegurar(fuenteIds.every(id => idsFuente.has(id)),
      `plataforma/${p.slug}: usa una fuente fuera del manifiesto`);
  });
  escaparate.ofertas.forEach((o, i) => {
    validarOferta(o, radar.verificadoEl, `oferta/${o.slug || i}`);
    asegurar(o.verificadaEl <= escaparate.fuente.actualizacionLocal.verificadoEl,
      `oferta/${o.slug || i}: fecha posterior al corte documental`);
    if (v2) {
      asegurar(COLECCIONES_OFERTA.includes(o.coleccion), `oferta/${o.slug}: colección inválida`);
      asegurar(o.documentacion != null, `oferta/${o.slug}: falta documentación V2`);
      if (o.coleccion !== 'principales') asegurar(o.estadoRevision === 'no_verificable' &&
        o.precio == null && o.rentabilidad == null &&
        o.puntuacion == null && o.disponibleEs == null,
        `oferta/${o.slug}: colección documental con cifras comerciales`);
    }
  });
  if (v2) for (const coleccion of COLECCIONES_OFERTA) {
    asegurar(escaparate.ofertas.filter(o => o.coleccion === coleccion).length ===
      manifiesto.coleccionesEsperadas[coleccion], `escaparate local: colección ${coleccion} incompleta`);
  }
  return { fecha: radar.verificadoEl, fechaOfertas: escaparate.fuente.actualizacionLocal.verificadoEl };
}

const sqlTexto = valor => valor == null ? 'null' : `'${String(valor).replace(/'/g, "''")}'`;
const sqlFecha = valor => `${sqlTexto(valor)}::date`;
const sqlJson = valor => `${sqlTexto(JSON.stringify(valor))}::jsonb`;
const sqlBooleano = valor => valor == null ? 'null' : valor ? 'true' : 'false';
const sqlNumero = valor => valor == null ? 'null' : String(Number(valor));
const uuidDesdeHash = hash => `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;

function construirSqlImportacion(fuentes) {
  const { radar, escaparate, manifiesto } = fuentes;
  validarFuentesLocales(fuentes);
  const v2 = escaparate.versionEsquema === 2;
  const contenido = JSON.stringify({ radar, ofertas: escaparate.ofertas, ...(v2 ? { manifiesto } : {}) });
  const hash = crypto.createHash('sha256').update(contenido).digest('hex');
  const revisionId = uuidDesdeHash(hash);
  const lineas = [
    '-- Generado localmente; revisar antes de cualquier aplicación remota.',
    '-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    'begin;',
    `insert into rwadar_catalogo.revisiones (id, verificado_el, contenido_sha256, origen${v2 ? ',version_esquema,plataformas_esperadas,ofertas_esperadas,colecciones_esperadas' : ''}) values (${sqlTexto(revisionId)}::uuid, ${sqlFecha(radar.verificadoEl)}, ${sqlTexto(hash)}, ${sqlTexto(radar.alcance)}${v2 ? `,2,${manifiesto.plataformasEsperadas},${manifiesto.ofertasEsperadas},${sqlJson(manifiesto.coleccionesEsperadas)}` : ''}) on conflict (id) do nothing;`,
  ];

  for (const f of radar.fuentes) {
    lineas.push(`insert into rwadar_catalogo.fuentes (revision_id,id,tipo,titulo,url,primaria,consultada_el) values (${sqlTexto(revisionId)}::uuid,${sqlTexto(f.id)},${sqlTexto(f.tipo)},${sqlTexto(f.titulo)},${sqlTexto(f.url)},true,${sqlFecha(f.consultadaEl)}) on conflict (revision_id,id) do nothing;`);
  }
  const radarPorSlug = new Map(radar.plataformas.map(p => [p.slug, p]));
  for (const p of escaparate.plataformas) {
    const original = radarPorSlug.get(p.slug);
    const v = p.verificacionLocal;
    lineas.push(`insert into rwadar_catalogo.plataformas (revision_id,plataforma_id,fecha_canonica_conservada,estado_operativo,estado_operativo_detalle,licencia_registro,licencia_registro_detalle,acceso,acceso_detalle) select ${sqlTexto(revisionId)}::uuid,id,${sqlFecha(original.fechaCanonicaConservada)},${sqlTexto(v.estadoOperativo.estado)}::rwadar_catalogo.estado_operativo,${sqlTexto(v.estadoOperativo.detalle)},${sqlTexto(v.licenciaRegistro.estado)}::rwadar_catalogo.estado_licencia,${sqlTexto(v.licenciaRegistro.detalle)},${sqlTexto(v.acceso.estado)}::rwadar_catalogo.estado_acceso,${sqlTexto(v.acceso.detalle)} from public.plataformas where slug=${sqlTexto(p.slug)} on conflict (revision_id,plataforma_id) do nothing;`);
    const campos = [
      ['estado_operativo', v.estadoOperativo],
      ['licencia_registro', v.licenciaRegistro],
      ['acceso', v.acceso],
    ];
    for (const [campo, dato] of campos) for (const f of dato.fuentes) {
      lineas.push(`insert into rwadar_catalogo.plataforma_fuentes (revision_id,plataforma_id,campo,fuente_id) select ${sqlTexto(revisionId)}::uuid,id,${sqlTexto(campo)}::rwadar_catalogo.campo_plataforma,${sqlTexto(f.id)} from public.plataformas where slug=${sqlTexto(p.slug)} on conflict do nothing;`);
    }
    for (const alerta of v.alertasCriticas) {
      lineas.push(`insert into rwadar_catalogo.alertas (revision_id,plataforma_id,codigo,detalle) select ${sqlTexto(revisionId)}::uuid,id,${sqlTexto(alerta.codigo)},${sqlTexto(alerta.detalle)} from public.plataformas where slug=${sqlTexto(p.slug)} on conflict do nothing;`);
      for (const f of alerta.fuentes) {
        lineas.push(`insert into rwadar_catalogo.alerta_fuentes (revision_id,plataforma_id,alerta_codigo,fuente_id) select ${sqlTexto(revisionId)}::uuid,id,${sqlTexto(alerta.codigo)},${sqlTexto(f.id)} from public.plataformas where slug=${sqlTexto(p.slug)} on conflict do nothing;`);
      }
    }
  }
  for (const o of escaparate.ofertas) {
    const categoriaSlug = CATEGORIAS.get(o.categoria);
    const columnaDocumentacion = (o.documentacion == null ? '' : ',documentacion') + (v2 ? ',coleccion' : '');
    const valorDocumentacion = (o.documentacion == null ? '' : `,${sqlJson(o.documentacion)}`) +
      (v2 ? `,${sqlTexto(o.coleccion)}` : '');
    lineas.push(`insert into rwadar_catalogo.ofertas (revision_id,slug,tipo,titulo,plataforma_slug,plataforma_nombre,categoria_slug,pais,resumen,url,verificada_el,vigencia_dias,permanente,disponible_es,eu,fuera_ladrillo,puntuacion,rentabilidad,precio,metricas,avisos,estado_revision,fuentes_actuales,patrocinada${columnaDocumentacion}) values (${sqlTexto(revisionId)}::uuid,${sqlTexto(o.slug)},${sqlTexto(o.tipo)},${sqlTexto(o.titulo)},${sqlTexto(o.plataformaSlug)},${sqlTexto(o.plataformaNombre)},${sqlTexto(categoriaSlug)},${sqlTexto(o.pais)},${sqlTexto(o.resumen)},${sqlTexto(o.url)},${sqlFecha(o.verificadaEl)},${o.vigenciaDias},${sqlBooleano(o.permanente)},${sqlBooleano(o.disponibleEs)},${sqlBooleano(o.eu)},${sqlBooleano(o.fueraLadrillo)},${sqlNumero(o.puntuacion)},${o.rentabilidad == null ? 'null' : sqlJson(o.rentabilidad)},${o.precio == null ? 'null' : sqlJson(o.precio)},${sqlJson(o.metricas)},${sqlJson(o.avisos)},${sqlTexto(o.estadoRevision)}::rwadar_catalogo.estado_oferta,${sqlJson(o.fuentesActuales)},false${valorDocumentacion}) on conflict (revision_id,slug) do nothing;`);
  }
  lineas.push('commit;', '');
  return { sql: lineas.join('\n'), revisionId, hash, fecha: radar.verificadoEl };
}

module.exports = {
  CUENTA_PLATAFORMAS,
  CUENTA_OFERTAS,
  MAX_VIGENCIA_DIAS,
  cargarFuentesLocales,
  construirSqlImportacion,
  validarFuentesLocales,
  validarDocumentacionOferta,
  validarLotePublico,
  validarLotePublicoV2,
  validarManifiestoV2,
  MANIFIESTO_CATALOGO_V2,
  LIMITES_CATALOGO_V2,
  normalizarManifiestoLocal,
};
