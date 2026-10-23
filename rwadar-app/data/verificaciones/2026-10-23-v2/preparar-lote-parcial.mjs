// Preparación LOCAL y reproducible. No consulta ni escribe servicios remotos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('../../../catalogo-publico.js');
const FECHA = '2026-10-23', DESDE = '2026-10-22';
const PREVIA = '349df4ef-97a2-db57-841f-a2f5114a6837';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);
const propuestaRuta = path.join(ROOT, 'docs/investigacion/2026-10-23/primaria/propuestas-para-revision.json');
const propuesta = leer(propuestaRuta);
assert.equal(propuesta.ciclo, FECHA);
assert.equal(propuesta.cambios.length, 4);
assert.deepEqual([...new Set(propuesta.cambios.map(c => c.slug))].sort(),
  ['casa-de-outeiro', 'iod-occasio', 'prosegur-digital-gold']);
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión prevista');

// Copias literales: ni radar, ni oferta, ni aviso, ni cifra, ni manifiesto se refechan.
for (const nombre of ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json']) {
  fs.copyFileSync(path.join(base, nombre), path.join(DIR, nombre));
}
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
const referencias = propuesta.cambios.map(({ slug, campo, localizador, ...r }) => ({ slug,
  referencia: { ...r, alcance: `${r.alcance} Localizador: ${localizador}.` } }));
// Correcciones tipográficas exclusivamente; cifras y límites proceden de las propuestas.
for (const { referencia: r } of referencias) {
  r.valor = r.valor.replace('de1a7días', 'de 1 a 7 días').replace('Cerrada;120.000EUR recaudados de120.000EUR',
    'Cerrada; 120.000 EUR recaudados de 120.000 EUR');
  r.alcance = r.alcance.replace('hasta31/10', 'hasta el 31/10').replace('de24h', 'de 24 h')
    .replace('FDF28/09', 'La FDF del 28/09').replace('límite23/10', 'límite del 23/10');
}
for (const { slug, referencia } of referencias) {
  assert.equal(referencia.fechaConsulta, FECHA);
  documentos[slug].revisadaEl = FECHA; // entrega documental; no verificación comercial de la oferta
  documentos[slug].referencias.push(referencia);
  if (!documentos[slug].fuentes.includes(referencia.fuente)) documentos[slug].fuentes.push(referencia.fuente);
}
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, `cambios-${FECHA}.json`), { desde: DESDE, tipo: 'entrega_documental_parcial',
  alcance: 'Cuatro referencias documentales nuevas del 23/10 en tres ofertas. Radar del 22/10, fechas individuales, cifras, avisos y vigencias anteriores conservados.',
  referenciaAprobacion: 'Lote local pendiente de revisión independiente del SQL y autorización de aplicación. No acredita revisión integral de las 49 ofertas.',
  propuestasFuente: path.relative(ROOT, propuestaRuta).replaceAll('\\', '/'),
  propuestasSha256: sha(propuestaRuta), nuevasAltas: 0,
  ofertas: Object.fromEntries(Object.keys(documentos).map(slug => [slug, { noRevisada: true,
    ...(referencias.some(r => r.slug === slug) ? { referencias: referencias.filter(r => r.slug === slug).map(r => r.referencia),
      entregaDocumentalEl: FECHA } : {}) }])) });

const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: FECHA, versionEsquema: 2 }));
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${FECHA}-v2`);
// El borrador usa literalmente el generador existente. Solo el aplicador añade la guarda transaccional.
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
const guarda = `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${nueva.revisionId}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${FECHA}' then raise exception 'Entrega documental futura'; end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> 26
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> 49
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> 24
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> 21
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> 4 then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega documental parcial 23/10: cuatro referencias; radar y vigencias anteriores conservados. Aplicación sujeta a autorización y revisión independiente externa.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  '-- LOCAL: pendiente de revisión independiente y autorización. No ejecutar por horario.\n' +
  '-- Únicamente entrega documental parcial; NO renueva el radar ni condiciones comerciales.\n' +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace('commit;\n', aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: false, fechaEntregaDocumental: FECHA,
  fechaRadar: DESDE, plataformas: 26, ofertas: 49, colecciones: { principales: 24, secundario: 21, en_camino: 4 },
  referenciasNuevas: 4, ofertasConDocumentacionNueva: 3, nuevasAltas: 0, estado: 'borrador',
  revisionIndependienteSQL: false, aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, 'contraste-2026-10-23.json'), { tipo: 'documental_parcial', fechaConsulta: FECHA,
  radarConservadoDel: DESDE, referenciasNuevas: referencias,
  exclusiones: propuesta.exclusiones, aprobacionIntegral49: false,
  archivosCopiadosLiterales: ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json'] });
console.log(JSON.stringify({ revisionId: nueva.revisionId, hash: nueva.hash, fechaRadar: DESDE,
  entregaDocumental: FECHA, plataformas: 26, ofertas: 49, referenciasNuevas: 4, nuevasAltas: 0 }));
