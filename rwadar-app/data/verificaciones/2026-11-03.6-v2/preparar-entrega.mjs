// Sexta entrega del 03/11/2026 (revisión «2026-11-03.6»): retirada de mF-ONE. Víctor
// pidió el 03/11 «retira las ofertas que ya no valgan o ya no estén». Se comprobaron de
// nuevo las 25 ofertas con fuentes de esta tarde y cada retirada propuesta la intentaron
// rebatir dos revisores escépticos (comprobacion-retiradas.json). Solo resiste mF-ONE:
// Midas la reserva a inversores cualificados o desde 150.000 USD, con alta manual y lista
// blanca. BILLA y Casa de Outeiro se mantienen: siguen vendiéndose y su documento permite
// o publica prórroga. Preparación LOCAL: sin red ni servicios remotos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.6-v2/preparar-entrega.mjs
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('../../../catalogo-publico.js');
const FECHA = '2026-11-03', REVISION = '2026-11-03.6', DESDE = '2026-11-03.5';
const FES = '03/11/2026';
const PREVIA = 'd75a22fb-929d-5b5c-6110-13d1ce3731fd'; // publicada; leída como visitante el 03/11
const RETIRADAS = ['mf-one'];
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = path.resolve(DIR, `../${DESDE}-v2`);

const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, 'la base local no es la revisión publicada');
const comprobacion = leer(path.join(DIR, 'comprobacion-retiradas.json'));
assert.deepEqual(comprobacion.retirar.map(r => r.slug).sort(), [...RETIRADAS].sort(), 'solo se retira lo que resistió a los escépticos');
assert.equal(comprobacion.revisadas.length, 25, 'se comprobaron las 25 ofertas');
fs.copyFileSync(path.join(base, 'radar-canonico-26.json'), path.join(DIR, 'radar-canonico-26.json'));
const escaparate = leer(path.join(base, 'escaparate-publicacion.json'));
const documentos = leer(path.join(base, 'documentacion-ofertas.json'));
for (const slug of RETIRADAS) {
  assert.ok(escaparate.ofertas.some(o => o.slug === slug), `${slug} no está publicada`);
  delete documentos[slug];
}
escaparate.ofertas = escaparate.ofertas.filter(o => !RETIRADAS.includes(o.slug));
escaparate.fuente.notaOrigen += ` Retirada de mF-ONE (${FES}): solo para inversores cualificados o desde 150.000 USD, con lista blanca.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/contraste-${REVISION}.json`,
  nota: `Lote del ${FES} (entrega ${REVISION}): 24 fichas (8 principales, 13 de reventa y 3 en camino).` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${REVISION}-v2/radar-canonico-26.json` };
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
const manifiesto = { version_esquema: 2, plataformas_esperadas: escaparate.plataformas.length,
  ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);
escribir(path.join(DIR, `contraste-${REVISION}.json`), { tipo: 'retirada', fecha: FECHA, etiqueta: REVISION, revisionAnterior: PREVIA,
  decision: `Víctor, ${FES}: «Retira las ofertas que ya no valgan o ya no estén».`,
  comprobacion: { archivo: 'comprobacion-retiradas.json', sha256: sha(path.join(DIR, 'comprobacion-retiradas.json')),
    revisadas: comprobacion.revisadas.length, propuestas: comprobacion.retirar.length + comprobacion.noConfirmadas.length },
  retiradas: comprobacion.retirar.map(r => ({ slug: r.slug, criterio: r.criterio, texto: r.textoRetirada, fuentes: r.fuentes })),
  mantenidasTrasRebatir: comprobacion.noConfirmadas.map(r => r.slug), copiasLiterales: ['radar-canonico-26.json'], colecciones });

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: REVISION, versionEsquema: 2 }));
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${REVISION}-v2`);
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
  if current_date < date '${FECHA}' then raise exception 'Revisión futura'; end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${REVISION}: retirada de mF-ONE (solo para inversores cualificados o desde 150.000 USD, con lista blanca), pedida por Víctor el ${FES} y comprobada por dos revisores escépticos; resto igual a la entrega ${DESDE}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
escribir(path.join(destino, 'aplicar-y-aprobar.sql'),
  `-- Entrega ${REVISION} del ${FES}: retirada de mF-ONE sobre la revisión publicada del mismo día. Pedida por Víctor.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, aprobar + 'commit;\n'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, revisionAnteriorComprobadaEnRemoto: true, etiqueta: REVISION, fechaRadar: FECHA,
  plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones, vigenciaDias: 7,
  nuevasAltas: 0, retiradas: 1, estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
console.log(JSON.stringify({ revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(path.join(destino, 'aplicar-y-aprobar.sql')),
  ofertas: escaparate.ofertas.length, colecciones }));
