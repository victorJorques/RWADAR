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
  validarOferta,
  validarLotePublico,
} = require('../rwadar-movil/lib/contrato-catalogo');

function cargarFuentesLocales(raiz = path.join(__dirname, '..'), { revision } = {}) {
  if (revision !== undefined) {
    asegurar(esFecha(revision), 'fecha de revisión local inválida');
    const carpeta = path.join(raiz, 'rwadar-app', 'data', 'verificaciones', revision);
    const radar = JSON.parse(fs.readFileSync(path.join(carpeta, 'radar-canonico-26.json'), 'utf8'));
    const escaparate = JSON.parse(fs.readFileSync(path.join(carpeta, 'escaparate-publicacion.json'), 'utf8'));
    asegurar(radar.verificadoEl === revision, 'la revisión no coincide con su carpeta');
    return { radar, escaparate };
  }
  const radar = JSON.parse(fs.readFileSync(path.join(
    raiz, 'rwadar-app', 'data', 'verificaciones', '2026-09-21', 'radar-canonico-26.json'), 'utf8'));
  const escaparate = JSON.parse(fs.readFileSync(path.join(
    raiz, 'rwadar-movil', 'fixtures', 'escaparate-local.json'), 'utf8'));
  return { radar, escaparate };
}

function validarFuentesLocales({ radar, escaparate }) {
  asegurar(radar && radar.version === 1 && esFecha(radar.verificadoEl),
    'radar local: cabecera inválida');
  asegurar(Array.isArray(radar.fuentes) && radar.fuentes.length > 0,
    'radar local: faltan fuentes');
  asegurar(Array.isArray(radar.plataformas) && radar.plataformas.length === CUENTA_PLATAFORMAS,
    `radar local: se esperaban ${CUENTA_PLATAFORMAS} plataformas`);
  asegurar(escaparate && escaparate.versionEsquema === 1 &&
    esFecha(escaparate.fuente?.actualizacionLocal?.verificadoEl) &&
    escaparate.fuente?.actualizacionRadarLocal?.verificadoEl === radar.verificadoEl,
    'escaparate local: fecha o esquema incoherente');
  asegurar(Array.isArray(escaparate.plataformas) && escaparate.plataformas.length === CUENTA_PLATAFORMAS,
    'escaparate local: plataformas incompletas');
  asegurar(Array.isArray(escaparate.ofertas) && escaparate.ofertas.length === CUENTA_OFERTAS,
    'escaparate local: ofertas incompletas');
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
  });
  return { fecha: radar.verificadoEl, fechaOfertas: escaparate.fuente.actualizacionLocal.verificadoEl };
}

const sqlTexto = valor => valor == null ? 'null' : `'${String(valor).replace(/'/g, "''")}'`;
const sqlFecha = valor => `${sqlTexto(valor)}::date`;
const sqlJson = valor => `${sqlTexto(JSON.stringify(valor))}::jsonb`;
const sqlBooleano = valor => valor == null ? 'null' : valor ? 'true' : 'false';
const sqlNumero = valor => valor == null ? 'null' : String(Number(valor));
const uuidDesdeHash = hash => `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;

function construirSqlImportacion(fuentes) {
  const { radar, escaparate } = fuentes;
  validarFuentesLocales(fuentes);
  const contenido = JSON.stringify({ radar, ofertas: escaparate.ofertas });
  const hash = crypto.createHash('sha256').update(contenido).digest('hex');
  const revisionId = uuidDesdeHash(hash);
  const lineas = [
    '-- Generado localmente; revisar antes de cualquier aplicación remota.',
    '-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    'begin;',
    `insert into rwadar_catalogo.revisiones (id, verificado_el, contenido_sha256, origen) values (${sqlTexto(revisionId)}::uuid, ${sqlFecha(radar.verificadoEl)}, ${sqlTexto(hash)}, ${sqlTexto(radar.alcance)}) on conflict (id) do nothing;`,
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
    lineas.push(`insert into rwadar_catalogo.ofertas (revision_id,slug,tipo,titulo,plataforma_slug,plataforma_nombre,categoria_slug,pais,resumen,url,verificada_el,vigencia_dias,permanente,disponible_es,eu,fuera_ladrillo,puntuacion,rentabilidad,precio,metricas,avisos,estado_revision,fuentes_actuales,patrocinada) values (${sqlTexto(revisionId)}::uuid,${sqlTexto(o.slug)},${sqlTexto(o.tipo)},${sqlTexto(o.titulo)},${sqlTexto(o.plataformaSlug)},${sqlTexto(o.plataformaNombre)},${sqlTexto(categoriaSlug)},${sqlTexto(o.pais)},${sqlTexto(o.resumen)},${sqlTexto(o.url)},${sqlFecha(o.verificadaEl)},${o.vigenciaDias},${sqlBooleano(o.permanente)},${sqlBooleano(o.disponibleEs)},${sqlBooleano(o.eu)},${sqlBooleano(o.fueraLadrillo)},${sqlNumero(o.puntuacion)},${o.rentabilidad == null ? 'null' : sqlJson(o.rentabilidad)},${o.precio == null ? 'null' : sqlJson(o.precio)},${sqlJson(o.metricas)},${sqlJson(o.avisos)},${sqlTexto(o.estadoRevision)}::rwadar_catalogo.estado_oferta,${sqlJson(o.fuentesActuales)},false) on conflict (revision_id,slug) do nothing;`);
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
  validarLotePublico,
};
