// Entrega del catálogo «2026-11-04.2»: ARTEX Global Markets pasa a Descartadas.
// Decisión de Víctor (04/11/2026): «Si las demás usan blockchain, ARTEX fuera». Las otras 25
// plataformas del radar tienen blockchain en «cadenas»; ARTEX dice «No usa blockchain» (lo
// corrigió la entrega 2026-11-04 con su página de preguntas frecuentes) y no tiene ofertas.
//
// Parte exactamente de la revisión publicada cf79e4a4 (entrega 2026-11-04), leída hoy como
// visitante (lectura-publica/). Preparación LOCAL: sin red ni servicios remotos.
//
// 1. rwadar_catalogo: revisión nueva con 25 plataformas (sin ARTEX ni sus dos fuentes del
//    radar) y las mismas 24 ofertas. Radar, cifras y vigencia siguen siendo del 03/11.
// 2. public.plataformas: ARTEX pasa a «descartada», con etiqueta y motivo; sus columnas de
//    ficha del radar quedan vacías, como en las otras cuatro descartadas.
// 3. public.fuentes: la página de preguntas frecuentes de ARTEX, fechada, como fuente del descarte.
//
//   node rwadar-app/data/verificaciones/2026-11-04.2-v2/preparar-entrega.mjs
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
const ETIQUETA = '2026-11-04.2', FECHA_RADAR = '2026-11-03', DESDE = '2026-11-04', HOY = '2026-11-04';
const FES = '04/11/2026', SLUG = 'artex-global-markets';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;

const plat = leer(path.join(DIR, 'cambios-plataformas.json'));
assert.equal(plat.etiqueta, ETIQUETA);
const PREVIA = plat.revisionPublicadaExigida, HASH_PREVIA = plat.hashRevisionPublicadaExigida;
const artex = plat.plataformas[SLUG];
const FAQ = artex.fuenteNueva;

// ---------------------------------------------------------------- partida: la publicada
const base = path.resolve(DIR, `../${DESDE}-v2`);
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.equal(previa.revisionId, PREVIA, `la ${DESDE} local no es la revisión publicada`);
assert.equal(previa.hash, HASH_PREVIA, `identidad de la ${DESDE}`);
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA), 'snapshot de la última sincronización');
// Lo leído hoy como visitante (lectura-publica/) es exactamente la base local.
const lp = path.join(DIR, 'lectura-publica');
const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
const pubD = leer(path.join(lp, 'descartadas.json')), [pubA] = leer(path.join(lp, 'artex-plataforma.json'));
assert.ok([...pubO, ...pubP].every(x => x.revision_id === PREVIA), 'la publicada leída hoy es la cf79e4a4');
const escaparateBase = leer(path.join(base, 'escaparate-publicacion.json'));
const docBase = leer(path.join(base, 'documentacion-ofertas.json'));
assert.equal(pubO.length, escaparateBase.ofertas.length); assert.equal(pubP.length, escaparateBase.plataformas.length);
assert.equal(pubP.length, plat.radar.antes); assert.equal(pubD.length, plat.descartadas.antes);
for (const o of pubO) {
  assert.deepEqual(o.documentacion, docBase[o.slug], `${o.slug}: documentación publicada = base local`);
  assert.deepEqual(o.fuentes_actuales, escaparateBase.ofertas.find(x => x.slug === o.slug).fuentesActuales, `${o.slug}: fuentes`);
}
// La vista devuelve las fuentes de cada campo en su propio orden y sin «publicadaEl», que la base
// no guarda: se comparan ordenadas y sin esa fecha. La dirección y el título de cada fuente salen
// del radar (es lo que importa el SQL; la entrega 2026-11-04 cambió ahí las dos del REGAFI).
const radarBase = leer(path.join(base, 'radar-canonico-26.json'));
const fuenteRadar = new Map(radarBase.fuentes.map(f => [f.id, { id: f.id, tipo: f.tipo, titulo: f.titulo, url: f.url,
  primaria: true, consultadaEl: f.consultadaEl }]));
const ordenar = v => JSON.parse(JSON.stringify(v), (k, x) => k === 'publicadaEl' ? undefined
  : k === 'fuentes' && Array.isArray(x) ? [...x].map(f => fuenteRadar.get(f.id) || f).sort((a, b) => (a.id < b.id ? -1 : 1)) : x);
for (const p of pubP) assert.deepEqual(ordenar(p.verificacion_local),
  ordenar(escaparateBase.plataformas.find(x => x.slug === p.slug).verificacionLocal), `${p.slug}: verificación publicada = base local`);

// ---------------------------------------------------------------- la premisa de la decisión
// ARTEX, tal como se leyó (sin fuentes propias, sin ofertas) y las otras 25 con blockchain.
for (const [col, valor] of Object.entries(artex.antes)) assert.deepEqual(pubA[col], valor, `ARTEX.${col} publicada`);
assert.equal(pubA.id, artex.id); assert.deepEqual(pubA.fuentes, [], 'ARTEX no tiene fuentes propias en public.fuentes');
assert.equal(pubA.cadenas, 'No usa blockchain');
const otras = pubP.filter(p => p.slug !== SLUG);
assert.equal(otras.length, plat.radar.despues);
assert.deepEqual(Object.fromEntries(otras.map(p => [p.slug, p.cadenas]).sort()), plat.premisa.otras);
assert.ok(otras.every(p => p.cadenas && !/no usa|ninguna|sin blockchain|mercado regulado/i.test(p.cadenas)), 'las otras 25 usan blockchain');
assert.equal(pubO.filter(o => o.plataforma_slug === SLUG).length, 0, 'ARTEX no tiene ofertas publicadas');
assert.ok(escaparateBase.ofertas.every(o => o.plataformaSlug !== SLUG), 'ARTEX no tiene ofertas en la base local');
assert.ok(!pubD.some(d => d.slug === SLUG) && !pubD.some(d => d.fuentes.some(f => f.url === FAQ.url)), 'ARTEX no está ya descartada');
// Lo que quedará: como las otras descartadas (solo etiqueta, motivo y fecha; nada del radar).
const RADAR = ['categoria_slug', 'region_slug', 'actor', 'acceso', 'ticket', 'cadenas', 'web', 'aval', 'nota'];
assert.deepEqual(Object.keys(artex.despues).sort(), Object.keys(artex.antes).sort());
assert.equal(artex.despues.estado, 'descartada');
assert.ok(RADAR.every(c => artex.despues[c] === null));
const { etiqueta_descarte: ETQ, motivo_descarte: MOTIVO } = artex.despues;
assert.ok(ETQ.length <= 40 && ETQ === ETQ.trim() && MOTIVO.trim().length >= 40 && MOTIVO.length <= 3000);
assert.equal(MOTIVO, MOTIVO.trim().replace(/\s+/g, ' '));
assert.match(FAQ.url, /^https:\/\//); assert.equal(FAQ.consultada_el, HOY);
assert.ok(FAQ.literales.some(l => /nor does it rely on blockchain technology in any way for the time being/.test(l)));

// ---------------------------------------------------------------- 1 · rwadar_catalogo: 25 plataformas
const radar = structuredClone(radarBase);
const escaparate = structuredClone(escaparateBase);
const documentacion = structuredClone(docBase);
const pA = radar.plataformas.find(p => p.slug === SLUG);
const usadas = p => [...['estadoOperativo', 'licenciaRegistro', 'acceso'].flatMap(k => p[k].fuentes), ...p.alertasCriticas.flatMap(a => a.fuentes)];
const deArtex = [...new Set(usadas(pA))];
const deOtras = new Set(radar.plataformas.filter(p => p.slug !== SLUG).flatMap(usadas));
assert.deepEqual(deArtex.sort(), ['artex-lb', 'artex-web']);
assert.ok(deArtex.every(id => !deOtras.has(id)), 'las dos fuentes de ARTEX solo las usa ARTEX');
radar.plataformas = radar.plataformas.filter(p => p.slug !== SLUG);
radar.fuentes = radar.fuentes.filter(f => !deArtex.includes(f.id));
radar.alcance += ` Entrega ${ETIQUETA} (${FES}): ARTEX Global Markets pasa a Descartadas; el radar queda en ${radar.plataformas.length} plataformas y ${radar.fuentes.length} fuentes.`;
escaparate.plataformas = escaparate.plataformas.filter(p => p.slug !== SLUG);
assert.equal(radar.plataformas.length, plat.radar.despues); assert.equal(escaparate.plataformas.length, plat.radar.despues);
escaparate.fuente.notaOrigen += ` Salida de ARTEX Global Markets del radar (${FES}, entrega ${ETIQUETA}): pasa a Descartadas porque no usa blockchain, según su propia web; el radar queda en ${radar.plataformas.length} plataformas. Ofertas, cifras y fechas, iguales.`;
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of escaparate.ofertas) colecciones[o.coleccion]++;
escaparate.fuente.actualizacionLocal = { ...escaparate.fuente.actualizacionLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/contraste-${ETIQUETA}.json`,
  nota: `Lote del 03/11/2026 (entrega ${ETIQUETA}, ${FES}: ARTEX Global Markets pasa a Descartadas): ${escaparate.ofertas.length} fichas (${colecciones.principales} principales, ${colecciones.secundario} de reventa y ${colecciones.en_camino} en camino) y ${radar.plataformas.length} plataformas.` };
escaparate.fuente.actualizacionRadarLocal = { ...escaparate.fuente.actualizacionRadarLocal,
  archivo: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/radar-canonico-26.json`,
  plataformas: radar.plataformas.length, fuentesPrimarias: radar.fuentes.length };
const manifiesto = { ...leer(path.join(base, 'manifiesto-catalogo.json')), plataformas_esperadas: radar.plataformas.length };
assert.equal(radar.verificadoEl, FECHA_RADAR, 'el radar sigue siendo del 03/11');

// Nada más cambia: devolviendo ARTEX y sus fuentes, todo es la base exacta.
{
  const r = structuredClone(radar), e = structuredClone(escaparate);
  r.alcance = radarBase.alcance; r.plataformas = radarBase.plataformas; r.fuentes = radarBase.fuentes;
  e.plataformas = escaparateBase.plataformas; e.fuente = escaparateBase.fuente;
  assert.deepEqual(r, radarBase, 'radar: solo sale ARTEX con sus dos fuentes');
  assert.deepEqual(e, escaparateBase, 'escaparate: solo sale ARTEX');
  assert.deepEqual(documentacion, docBase, 'documentación de las 24 ofertas, idéntica');
  assert.deepEqual(radar.plataformas, radarBase.plataformas.filter(p => p.slug !== SLUG));
  assert.deepEqual(escaparate.plataformas, escaparateBase.plataformas.filter(p => p.slug !== SLUG));
}
// El radar se sigue llamando radar-canonico-26.json: es el nombre fijo que leen el cargador
// (catalogo-publico.js) y npm run catalogo; dentro van las plataformas que diga el manifiesto.
escribir(path.join(DIR, 'radar-canonico-26.json'), radar);
escribir(path.join(DIR, 'escaparate-publicacion.json'), escaparate);
escribir(path.join(DIR, 'documentacion-ofertas.json'), documentacion);
escribir(path.join(DIR, 'manifiesto-catalogo.json'), manifiesto);

// ---------------------------------------------------------------- 2 y 3 · public.plataformas y public.fuentes
const COLS = Object.keys(artex.antes);
const fila = (estado) => COLS.map(c => c === 'estado' ? `p.estado = ${q(estado[c])}`
  : estado[c] === null ? `p.${c} is null` : c === 'verificada_el' ? `p.${c} = ${q(estado[c])}::date`
  : `p.${c}::text = ${q(estado[c])}`).join('\n        and ');
const faqCon = `select 1 from public.fuentes f where f.plataforma_id = p.id and f.url = ${q(FAQ.url)}`;
const faqExacta = `exists (${faqCon} and f.titulo = ${q(FAQ.titulo)}
          and f.publicada_el is ${FAQ.publicada_el === null ? 'null' : `not distinct from ${q(FAQ.publicada_el)}::date`}
          and f.consultada_el = ${q(FAQ.consultada_el)}::date)`;
const nFuentes = 'select count(*) from public.fuentes f where f.plataforma_id = p.id';
const ARTEX_ANTES = `exists (select 1 from public.plataformas p where p.slug = ${q(SLUG)}
        and ${fila(artex.antes)}
        and (${nFuentes}) = 0)`;
const ARTEX_DESPUES = `exists (select 1 from public.plataformas p where p.slug = ${q(SLUG)}
        and ${fila(artex.despues)}
        and (${nFuentes}) = 1 and ${faqExacta})`;
const cuenta = (estado, n) => `(select count(*) from public.plataformas where estado = ${q(estado)}) = ${n}`;
const ANTES = `${ARTEX_ANTES}\n      and ${cuenta('en_radar', plat.radar.antes)} and ${cuenta('descartada', plat.descartadas.antes)}`;
const DESPUES = `${ARTEX_DESPUES}\n      and ${cuenta('en_radar', plat.radar.despues)} and ${cuenta('descartada', plat.descartadas.despues)}`;
const set = COLS.filter(c => c !== 'estado').map(c => `${c} = ${artex.despues[c] === null ? 'null'
  : c === 'verificada_el' ? `${q(artex.despues[c])}::date` : q(artex.despues[c])}`).join(',\n    ');
const bloquePlataformas = `-- public.plataformas y public.fuentes: ARTEX Global Markets pasa a Descartadas (decisión de
-- Víctor del ${FES}: «${plat.decision.literal}»), con su etiqueta, su motivo y su fuente fechada.
-- Efectos de los disparadores de siempre, al cambiar el estado: actualizada_el = now(); una fila en
-- public.cambios_estado («ARTEX Global Markets sale del radar», con el motivo); avisos en cola para
-- quien vigile ARTEX con los avisos activados (avisos_correo; avisos_push solo si push está habilitado);
-- y sus emisiones abiertas se cerrarían (la guarda exige que no tenga ninguna).
do $plataformas_guarda$
declare antes boolean; despues boolean; publicada uuid;
begin
  perform 1 from public.plataformas where slug = ${q(SLUG)} for update;
  select revision_id into publicada from rwadar_catalogo.publicacion_v2 where unica;
  -- La premisa de la decisión: las demás plataformas del radar usan blockchain.
  if exists (select 1 from public.plataformas where estado = 'en_radar' and slug <> ${q(SLUG)}
      and (cadenas is null or cadenas ~* '(no usa|sin blockchain|ninguna)')) then
    raise exception 'Hay otra plataforma del radar sin blockchain en «cadenas»: no aplicar.';
  end if;
  if exists (select 1 from rwadar_catalogo.ofertas where plataforma_slug = ${q(SLUG)}
      and revision_id in ('${PREVIA}'::uuid, '${'NUEVA'}'::uuid)) then
    raise exception 'ARTEX tiene ofertas en el catálogo: no aplicar.';
  end if;
  if to_regclass('public.emisiones') is not null then
    if exists (select 1 from public.emisiones e join public.plataformas p on p.id = e.plataforma_id
        where p.slug = ${q(SLUG)}) then
      raise exception 'ARTEX tiene emisiones: no aplicar.';
    end if;
  end if;
  if exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
      where p.slug <> ${q(SLUG)} and f.url = ${q(FAQ.url)}) then
    raise exception 'La fuente nueva ya está en otra plataforma: no aplicar.';
  end if;
  -- Todo como lo publicado (cf79e4a4, 26 en el radar y 4 descartadas) o todo ya como quedaría
  -- (la revisión nueva, 25 y 5); nada a medias.
  antes := publicada = '${PREVIA}'::uuid and ${ANTES};
  despues := publicada = '${'NUEVA'}'::uuid and ${DESPUES};
  if not (coalesce(antes, false) or coalesce(despues, false)) then
    raise exception 'ARTEX, sus fuentes, las cuentas del radar o la revisión publicada no son las previstas (ni antes ni después): no aplicar.';
  end if;
end $plataformas_guarda$;
update public.plataformas set estado = 'descartada',
    ${set}
  where slug = ${q(SLUG)} and estado = 'en_radar';
insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,${q(FAQ.url)},${q(FAQ.titulo)},${FAQ.publicada_el === null ? 'null' : `${q(FAQ.publicada_el)}::date`},${q(FAQ.consultada_el)}::date from public.plataformas where slug = ${q(SLUG)} on conflict (plataforma_id,url) do nothing;
do $plataformas_comprobar$
begin
  if not (${DESPUES}) then
    raise exception 'ARTEX no quedó como estaba previsto (descartada, con su motivo y su fuente; ${plat.radar.despues} en el radar y ${plat.descartadas.despues} descartadas).';
  end if;
  if exists (select 1 from public.descartadas_sin_fuente) then
    raise exception 'Hay una descartada sin fuente.';
  end if;
end $plataformas_comprobar$;
`;

// ---------------------------------------------------------------- SQL
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.notEqual(nueva.revisionId, PREVIA, 'la revisión nueva tiene otra identidad');
assert.equal(nueva.fecha, FECHA_RADAR, 'la revisión sigue fechada el 03/11');
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
    or exists (select 1 from rwadar_catalogo.plataformas c join public.plataformas p on p.id = c.plataforma_id
      where c.revision_id = v and p.slug = ${q(SLUG)}) then
    raise exception 'Catálogo incompleto: se conserva el lote anterior';
  end if;
  update rwadar_catalogo.revisiones set estado = 'aprobada', aprobada_el = now(),
    aprobada_referencia = 'Entrega ${ETIQUETA}: ARTEX Global Markets pasa a Descartadas (no usa blockchain; decisión de Víctor del ${FES}); radar de ${escaparate.plataformas.length} plataformas; ofertas, cifras y fechas iguales a la ${DESDE}.'
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
  `-- Entrega ${ETIQUETA} (preparada el ${FES}): ARTEX Global Markets pasa a Descartadas, sobre la revisión publicada ${DESDE} (${PREVIA}).\n` +
  `-- Revisión nueva de ${escaparate.plataformas.length} plataformas y ${escaparate.ofertas.length} ofertas; ARTEX descartada con su motivo y su fuente.\n` +
  `-- Generado por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.\n` +
  nueva.sql.replace('-- El lote entra como BORRADOR. Este fichero nunca lo aprueba ni lo publica.',
    '-- Este aplicador importa y aprueba al final, únicamente si pasan todas las guardas.')
    .replace('begin;', () => 'begin isolation level serializable;\n' + guarda)
    .replace(/commit;\n$/, () => bloquePlataformas.replaceAll("'NUEVA'", `'${nueva.revisionId}'`) + aprobar + 'commit;\n'));
assert.ok(!fs.readFileSync(archivo, 'utf8').includes('NUEVA'));
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, revisionId: nueva.revisionId, hash: nueva.hash,
  revisionAnterior: PREVIA, hashRevisionAnterior: HASH_PREVIA, revisionAnteriorComprobadaEnRemoto: true,
  lecturaPublica: `rwadar-app/data/verificaciones/${ETIQUETA}-v2/lectura-publica/`, etiqueta: ETIQUETA, fechaRadar: FECHA_RADAR,
  revisionDocumental: HOY, plataformas: escaparate.plataformas.length, ofertas: escaparate.ofertas.length, colecciones,
  vigenciaDias: 7, nuevasAltas: 0, retiradas: 0, plataformasDescartadas: [SLUG],
  descartadas: plat.descartadas.despues, tablasPublicas: ['public.plataformas', 'public.fuentes'],
  efectosDeDisparadores: ['public.plataformas.actualizada_el', 'public.cambios_estado: una fila («ARTEX Global Markets sale del radar»)',
    'public.avisos_correo / public.avisos_push: un aviso por quien vigile ARTEX con los avisos activados (si hay alguien)'],
  estado: 'borrador', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'descarte_plataforma', fecha: FECHA_RADAR, preparadaEl: HOY,
  etiqueta: ETIQUETA, revisionAnterior: PREVIA, revisionNueva: nueva.revisionId,
  archivos: { 'cambios-plataformas.json': sha(path.join(DIR, 'cambios-plataformas.json')) },
  cuentas: { plataformasAntes: radarBase.plataformas.length, plataformasDespues: radar.plataformas.length,
    fuentesRadarAntes: radarBase.fuentes.length, fuentesRadarDespues: radar.fuentes.length,
    descartadasAntes: plat.descartadas.antes, descartadasDespues: plat.descartadas.despues, ofertas: escaparate.ofertas.length },
  sale: { plataforma: SLUG, fuentesRadar: deArtex },
  sinCambios: ['las 24 ofertas: documentación, cifras, avisos, colecciones 8/13/3 y vigencia (7 días desde el 03/11)',
    'las otras 25 plataformas: verificación, estados, detalles, avisos y fuentes', 'las otras 4 descartadas'],
  plataformas: COLS.filter(c => JSON.stringify(artex.antes[c]) !== JSON.stringify(artex.despues[c]))
    .map(c => ({ slug: SLUG, columna: c, antes: artex.antes[c], despues: artex.despues[c] })),
  fuentesNuevasPublicas: [{ plataforma: SLUG, url: FAQ.url, titulo: FAQ.titulo, consultada_el: FAQ.consultada_el }],
  colecciones });
console.log(JSON.stringify({ etiqueta: ETIQUETA, revisionId: nueva.revisionId, previa: PREVIA, sha256: sha(archivo),
  plataformas: escaparate.plataformas.length, fuentesRadar: radar.fuentes.length, ofertas: escaparate.ofertas.length, colecciones,
  descartadas: plat.descartadas.despues }));
