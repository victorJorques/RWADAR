// Entrega del catálogo «2026-11-26.2»: sale la tarjeta «Hausera · próximas ofertas» (colección «en camino»).
// Preparación LOCAL: sin red ni servicios remotos. Reproducible byte a byte.
//
//   node rwadar-app/data/verificaciones/2026-11-26.2-v2/preparar-entrega.mjs
//
// Parte exactamente de la entrega 2026-11-26 (las 22 fichas verificadas hoy) y cambia una sola cosa: sale
// hausera-proximas-ofertas, porque Alicante 3 ya figura como financiada y Hausera no anuncia ninguna otra
// operación (comprobacion-retiradas.json). Quedan 21 ofertas: 8 principales, 13 de reventa y 0 en camino. Todo lo
// demás (las otras 21 fichas, cifras, vigencia hasta el 03/12, radar y plataformas) es igual que en la 2026-11-26.
// Es el modelo de retiradas de la 2026-11-05.2 sin sus otros cambios (Pax Gold y Spiko).
//
// Si existe lectura-publica/ (lo que se lee como visitante después de aplicar la 2026-11-26), exige que sea la
// 2026-11-26 local, y que el catálogo sincronizado de la web sea esa revisión. Sin ella, avisa: se prepara antes de
// aplicar la 2026-11-26 y se vuelve a ejecutar (mismos SHA-256) con la lectura antes de aplicar esta.
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
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const ETIQUETA = '2026-11-26.2', FECHA = '2026-11-26', DESDE = '2026-11-26', HOY = '2026-11-26';
const FES = '26/11/2026';
const ULTIMO = '2026-12-03'; // las fichas siguen verificadas el 26/11, con 7 días
const RETIRADAS = ['hausera-proximas-ofertas'];
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const base = path.resolve(DIR, `../${DESDE}-v2`);

// ---------------------------------------------------------------- partida: la 2026-11-26
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
const PREVIA = revisionDesde.revisionId, HASH_PREVIA = revisionDesde.hash;
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA], `la ${DESDE} local no es la de su revision.json`);
assert.equal(revisionDesde.venceTrasEl, ULTIMO);
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
const manifiestoBase = leer(path.join(base, 'manifiesto-catalogo.json'));
assert.ok(escaparateBase.ofertas.every(o => o.verificadaEl === FECHA && o.vigenciaDias === 7), `la ${DESDE} está verificada el ${FES}`);

const lp = path.join(DIR, 'lectura-publica');
let lectura = null;
if (fs.existsSync(lp)) {
  // Lo leído como visitante después de aplicar la 2026-11-26 es exactamente la base local.
  const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
  const pubT = leer(path.join(lp, 'plataformas-todas.json'));
  const hora = fs.readFileSync(path.join(lp, 'hora-lectura.txt'), 'utf8');
  assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), `la publicada leída es la ${PREVIA.slice(0, 8)}`);
  assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
  for (const o of pubO) {
    const b = escaparateBase.ofertas.find(x => x.slug === o.slug);
    assert.ok(b, `${o.slug}: no está en la base local`);
    assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
    assert.deepEqual(o.fuentes_actuales, b.fuentesActuales, `${o.slug}: fuentes`);
    assert.deepEqual([o.coleccion, o.verificada_el, o.vigencia_dias], [b.coleccion, b.verificadaEl, b.vigenciaDias], `${o.slug}: colección y fecha`);
  }
  assert.deepEqual(pubT.filter(p => p.estado === 'en_radar').map(p => p.slug).sort(), escaparateBase.plataformas.map(p => p.slug).sort());
  assert.equal(pubT.filter(p => p.estado === 'descartada').length, 5);
  const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
  assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'el catálogo sincronizado de la web es la 2026-11-26');
  lectura = hora.split('\n')[0];
} else {
  console.warn(`AVISO: sin lectura-publica/: preparado antes de aplicar la ${DESDE}. Vuelve a ejecutarlo con la lectura antes de aplicar la ${ETIQUETA}.`);
}

// ---------------------------------------------------------------- retirada
const ret = leer(path.join(DIR, 'comprobacion-retiradas.json'));
assert.equal(ret.etiqueta, ETIQUETA);
assert.deepEqual(ret.retirar.map(r => r.slug), RETIRADAS);
for (const r of ret.retirar) {
  const o = escaparateBase.ofertas.find(x => x.slug === r.slug);
  assert.ok(o, `${r.slug}: no está publicada`);
  assert.equal(o.coleccion, 'en_camino'); assert.equal(r.coleccion, 'en_camino'); assert.equal(o.titulo, r.titulo);
  assert.ok(r.motivo.length > 80 && r.textoRetirada.startsWith(`Retirada el ${FES}:`));
  assert.ok(r.fuentes.length >= 2 && r.fuentes.every(f => /^https:\/\//.test(f.url) && f.literal && f.horaUtc.startsWith(FECHA)), `${r.slug}: fuentes de hoy`);
  // Las fuentes salen del expediente de hoy de la 2026-11-26 y de su lista de fuentes releídas.
  const exp = JSON.stringify(leer(path.join(base, 'expedientes', `${r.slug}.json`)));
  const releidas = fs.readFileSync(path.join(base, 'fuentes/releidas-2026-11-26.txt'), 'utf8');
  for (const f of r.fuentes) {
    assert.ok(exp.includes(f.url), `${r.slug}: ${f.url} no está en el expediente de hoy`);
    assert.ok(releidas.split('\n').some(l => l.startsWith(f.horaUtc + ' HTTP 200 ') && l.endsWith(' ' + f.url)), `${r.slug}: ${f.url} no se releyó a las ${f.horaUtc}`);
  }
  // Lo que la 2026-11-26 ya publica de ella dice lo mismo (Alicante 3 financiada).
  assert.match(o.resumen, /Alicante 3, la última, ya figura como financiada/);
}
assert.deepEqual(ret.seQuedan, escaparateBase.ofertas.map(o => o.slug).filter(s => !RETIRADAS.includes(s)));
const escaparate = structuredClone(escaparateBase);
const documentos = structuredClone(docBase);
escaparate.ofertas = escaparate.ofertas.filter(o => !RETIRADAS.includes(o.slug));
for (const slug of RETIRADAS) delete documentos[slug];
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, { principales: 8, secundario: 13, en_camino: 0 });
assert.deepEqual(colecciones, ret.coleccionesDespues);

// ---------------------------------------------------------------- escaparate y manifiesto
escaparate.fuente.notaOrigen += ` Entrega ${ETIQUETA} (${FES}): sale «Hausera · próximas ofertas»: Alicante 3 ya figura como financiada ` +
  'y Hausera no anuncia ninguna otra operación; las otras 21 fichas, iguales.';
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del ${FES} (entrega ${ETIQUETA}: sale Hausera · próximas ofertas): ${escaparate.ofertas.length} fichas (${colecciones.principales} principales, ` +
    `${colecciones.secundario} de reventa y ${colecciones.en_camino} en camino) y ${radarBase.plataformas.length} plataformas.` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json` };
const manifiesto = { ...manifiestoBase, ofertas_esperadas: escaparate.ofertas.length, colecciones_esperadas: colecciones };
assert.deepEqual(manifiesto, { version_esquema: 2, plataformas_esperadas: 25, ofertas_esperadas: 21,
  colecciones_esperadas: { principales: 8, secundario: 13, en_camino: 0 } });
{ // Nada más cambia: las 21 ofertas y su documentación, idénticas; el radar y las plataformas, idénticos.
  assert.deepEqual(escaparate.ofertas, escaparateBase.ofertas.filter(o => !RETIRADAS.includes(o.slug)));
  assert.deepEqual(Object.keys(documentos), Object.keys(docBase).filter(s => !RETIRADAS.includes(s)));
  for (const s of Object.keys(documentos)) assert.deepEqual(documentos[s], docBase[s], `${s}: documentación`);
  const e = structuredClone(escaparate);
  e.fuente = escaparateBase.fuente; e.ofertas = escaparateBase.ofertas;
  assert.deepEqual(e, escaparateBase, 'escaparate: solo la retirada y las notas');
}
escribir(path.join(DIR, 'radar-canonico-26.json'), radarBase);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentos);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
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
const aprobar = `do $aprobar$
declare v uuid := '${nueva.revisionId}';
begin
  if (select count(*) from rwadar_catalogo.plataformas where revision_id = v) <> ${escaparate.plataformas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v) <> ${escaparate.ofertas.length}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'principales') <> ${colecciones.principales}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'secundario') <> ${colecciones.secundario}
    or (select count(*) from rwadar_catalogo.ofertas where revision_id = v and coleccion = 'en_camino') <> ${colecciones.en_camino}
    or exists (select 1 from rwadar_catalogo.ofertas where revision_id = v and slug in (${RETIRADAS.map(q).join(', ')})) then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: sale Hausera · próximas ofertas (Alicante 3 ya figura como financiada y Hausera no anuncia otra operación). ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}); el resto, igual a la ${DESDE}. Puesta al día pedida por el responsable del proyecto el ${FES}.'
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
  `-- Sale Hausera · próximas ofertas. ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas (${colecciones.principales}/${colecciones.secundario}/${colecciones.en_camino}). Solo escribe en rwadar_catalogo.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => aprobar + 'commit;\n'));
{
  const sql = fs.readFileSync(archivo, 'utf8');
  const publicas = [...sql.matchAll(/^\s*(insert\s+into|update|delete\s+from)\s+public\.(\w+)/gim)];
  assert.deepEqual(publicas, [], 'no escribe en public.*');
  assert.doesNotMatch(sql, /^\s*(?:truncate|alter|drop|grant|revoke|create)\b/im, 'sin DDL ni permisos');
  assert.doesNotMatch(sql.split('\n').slice(0, 3).join('\n'), /V[ií]ctor/, 'cabecera sin nombres de personas');
}
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, venceTrasEl: ULTIMO, nuevasAltas: 0, retiradas: RETIRADAS.length, ofertasRetiradas: RETIRADAS,
  tablasPublicas: [], estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });

// ---------------------------------------------------------------- contraste (lo que cambia)
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'retiradas_y_correcciones', fecha: FECHA, etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  decision: ret.decision.texto,
  archivos: { 'comprobacion-retiradas.json': sha(path.join(DIR, 'comprobacion-retiradas.json')) },
  cuentas: { plataformas: radarBase.plataformas.length, fuentesRadar: radarBase.fuentes.length,
    ofertasAntes: escaparateBase.ofertas.length, ofertasDespues: escaparate.ofertas.length, descartadas: 5 },
  cambios: ret.retirar.map(r => ({ donde: 'catálogo', retirada: r.slug, titulo: r.titulo, coleccion: r.coleccion, texto: r.textoRetirada })),
  sinCambios: ['las otras 21 ofertas: documentación, cifras, avisos, colecciones y vigencia (verificadas el 26/11, 7 días: hasta el 03/12)',
    'las 25 plataformas del radar y sus 69 fuentes', 'las 5 descartadas', 'public.plataformas y public.fuentes'],
  altas: [], retiradas: RETIRADAS, colecciones, lecturaPublica: lectura });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, hash: nueva.hash, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radarBase.fuentes.length, ofertas: escaparate.ofertas.length, colecciones,
  lecturaPublica: lectura ? 'comprobada' : 'pendiente' }));
