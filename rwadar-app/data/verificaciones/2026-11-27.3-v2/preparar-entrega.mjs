// Entrega del catálogo «2026-11-27.3»: disponibilidad por país (orden de la dirección del 27/11/2026: «RWAdar,
// escaparate internacional»). Las 40 ofertas y las 73 plataformas de la 2026-11-27.2, iguales, y en la documentación de
// cada oferta, «disponibilidad»: países admitidos, excluidos y con requisitos, con la cita de su fuente oficial
// (disponibilidad.json; motor y validador en rwadar-movil/lib/disponibilidad-pais.js). Sin altas ni retiradas; en public.*
// no se toca nada. Preparación LOCAL: sin red ni servicios remotos. Reproducible.
//
//   node rwadar-app/data/verificaciones/2026-11-27.3-v2/preparar-entrega.mjs
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
const ETIQUETA = '2026-11-27.3', FECHA = '2026-11-27', DESDE = '2026-11-27.2', HOY = '2026-11-27', FES = '27/11/2026';
const ULTIMO = '2026-12-03';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const base = path.resolve(DIR, `../${DESDE}-v2`);
const plano = t => t.replace(/\s+/g, ' ');

// ---------------------------------------------------------------- partida: la 2026-11-27.2
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
const PREVIA = revisionDesde.revisionId, HASH_PREVIA = revisionDesde.hash;
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA], `la ${DESDE} local no es la de su revision.json`);
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));
assert.deepEqual([escaparateBase.plataformas.length, escaparateBase.ofertas.length], [73, 40]);

// Lo leído como visitante antes de preparar, con la 2026-11-27.2 publicada (precondición).
const lp = path.join(DIR, 'lectura-publica');
let lectura = null;
if (fs.existsSync(lp)) {
  const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
  assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), `la publicada leída es la ${PREVIA.slice(0, 8)}`);
  assert.equal(pubO.length, 40); assert.equal(pubP.length, 73);
  for (const o of pubO) assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  lectura = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8').split('\n')[0];
}

// ---------------------------------------------------------------- disponibilidad por país
const { erroresDisponibilidad } = require(path.join(ROOT, 'rwadar-movil/lib/disponibilidad-pais.js'));
const DISP = leer(path.join(DIR, 'disponibilidad.json'));
assert.equal(DISP.fecha, FECHA);
assert.deepEqual(Object.keys(DISP.ofertas).sort(), Object.keys(docBase).sort(), 'una disponibilidad por oferta publicada');
for (const [s, d] of Object.entries(DISP.ofertas)) {
  assert.deepEqual(erroresDisponibilidad(d), [], `${s}: disponibilidad no válida`);
  assert.ok(d.fuentes.every(f => f.consultadaEl <= FECHA), `${s}: fuente con fecha futura`);
}
const CSP = /<style\b|\sstyle\s*=|\son[a-z]+\s*=|<script/i;
assert.ok(!CSP.test(JSON.stringify(DISP)), 'texto que la compuerta CSP rechazaría');
const A = { fecha: FECHA, regiones: [], plataformas: [], ofertas: [] };
const slugsP = [], slugsO = [];
const radar = structuredClone(radarBase);
const escaparate = structuredClone(escaparateBase);
const documentos = structuredClone(docBase);
for (const [s, d] of Object.entries(DISP.ofertas)) documentos[s].disponibilidad = d;
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, { principales: 24, secundario: 13, en_camino: 3 });
escaparate.fuente.notaOrigen += ` Entrega ${ETIQUETA} (${FES}): disponibilidad por país de cada oferta, con la cita de su fuente oficial.`;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del ${FES} (entrega ${ETIQUETA}): las ${escaparate.ofertas.length} fichas de la ${DESDE} con su disponibilidad por país; ${radar.plataformas.length} plataformas.` };
const manifiesto = { version_esquema: 2, plataformas_esperadas: radar.plataformas.length, ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
{ // Nada más cambia: ofertas y plataformas iguales; en la documentación, solo la disponibilidad nueva.
  for (const s of Object.keys(docBase)) { const { disponibilidad, ...resto } = documentos[s]; assert.deepEqual(resto, docBase[s], `${s}: documentación igual salvo la disponibilidad`); }
  assert.deepEqual(escaparate.ofertas, escaparateBase.ofertas, 'ofertas iguales');
  assert.deepEqual(escaparate.plataformas, escaparateBase.plataformas, 'plataformas iguales');
}
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA);
assert.equal(nueva.fecha, FECHA);
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
escribir(path.join(destino, 'catalogo.sql'), nueva.sql);
const guarda = `do $guarda$
declare actual uuid; retirada boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is null or actual not in ('${PREVIA}'::uuid, '${nueva.revisionId}'::uuid) then
    raise exception 'Publicación distinta de la revisión anterior prevista: %. No aplicar este lote.', actual;
  end if;
  if actual = '${PREVIA}'::uuid and not exists (select 1 from rwadar_catalogo.revisiones where id = '${PREVIA}'::uuid
    and contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar este lote.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: este lote no autoriza reactivarlo.';
  end if;
  if current_date < date '${HOY}' then raise exception 'Revisión futura'; end if;
  if current_date > date '${ULTIMO}' then
    raise exception 'Lote caducado: sus fichas valían hasta el ${ULTIMO.split('-').reverse().join('/')}. No aplicar este lote.';
  end if;
  if exists (select 1 from rwadar_catalogo.revisiones where id = '${nueva.revisionId}'::uuid
    and (contenido_sha256 <> '${nueva.hash}' or estado = 'retirada')) then
    raise exception 'La revisión destino existe con otra identidad o está retirada';
  end if;
end $guarda$;
`;
// public.*: esta entrega no toca nada (sin altas). Solo comprueba que el radar es el de la 2026-11-27.2.
const RS = A.regiones;
const bloquePublico = `do $publico_guarda$
begin
  if (select count(*) from public.plataformas where estado = 'en_radar') <> 73
    or (select count(*) from public.plataformas where estado = 'descartada') <> 5 then
    raise exception 'El radar no tiene 73 plataformas y 5 descartadas: no aplicar.';
  end if;
end $publico_guarda$;
`;
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and documentacion ? 'disponibilidad') <> ${escaparate.ofertas.length} then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: las fichas de la ${DESDE} con su disponibilidad por país, comprobada en la fuente oficial de cada oferta el ${FES}.'
    where id = v and estado = 'borrador';
  if not exists (select 1 from rwadar_catalogo.revision_publicable_v2 where id = v) then
    raise exception 'Entrega no publicable: se deshace la transacción completa';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from v then
    raise exception 'La revisión nueva no quedó publicada: se deshace la transacción completa';
  end if;
end $aprobar$;
`;
const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
escribir(archivo,
  `-- Entrega ${ETIQUETA} (preparada el ${FES}) sobre la revisión ${DESDE} (${PREVIA}). Ciclo pedido y autorizado por el responsable del proyecto.\n` +
  `-- Disponibilidad por país de las ${escaparate.ofertas.length} ofertas; sin altas ni retiradas. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}).\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda + bloquePublico)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  const publicas = [...sql.matchAll(/^\s*(insert\s+into|update|delete\s+from)\s+public\.(\w+)/gim)].map(m => `${m[1].toLowerCase()} ${m[2]}`);
  assert.deepEqual(publicas, [], 'en public.* no se escribe nada');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
  assert.doesNotMatch(sql.split('\n').slice(0, 3).join('\n'), /V[ií]ctor/, 'cabecera sin nombres de personas');
}
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: 0, ofertasAltas: [], plataformasAltas: [], retiradas: 0,
  tablasPublicas: [], estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'disponibilidad', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: 'Orden de la dirección del 27/11/2026: disponibilidad de cada oferta según el país de residencia, con fuente oficial; lo que no consta, sin confirmar.',
  archivos: { 'disponibilidad.json': sha(path.join(DIR, 'disponibilidad.json')) }, colecciones, lecturaPublica: lectura,
  resumen: Object.fromEntries(Object.entries(DISP.ofertas).map(([s, d]) => [s, { admitidos: d.admitidos, excluidos: d.excluidos, conRequisitos: d.conRequisitos.map(r => r.paises), fuentes: d.fuentes.length }])) });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones, lecturaPublica: lectura ? 'comprobada' : 'pendiente' }));
