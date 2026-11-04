// Octava entrega del 03/11/2026 (etiqueta «2026-11-03.8»), preparada el 04/11: los textos de
// public.plataformas y public.fuentes que quedaron fuera de la 2026-11-03.7 (Reental, Toucan y
// RealT). Víctor, 04/11: «hasta que no esté todo no has acabado». Preparación LOCAL: sin red ni
// servicios remotos.
//
// No es un lote del catálogo: no crea ninguna revisión en rwadar_catalogo. Exige que la
// publicada sea exactamente la f2732257 (entrega 2026-11-03.7) y, en una sola transacción
// serializable, cambia solo cuatro textos, corrige el título de una fuente de RealT («un juez» →
// «una jueza») y le añade una fuente nueva. Las guardas comprueban
// antes que producción está exactamente como se espera (los textos, los estados, las fuentes
// con su dirección Y su título, la revisión publicada y su identidad) o ya como quedaría
// (idempotente); cualquier otra cosa lo deshace todo. Después comprueba el resultado.
//
// La etiqueta es 2026-11-03.8 porque sigue a la .7 publicada. Esta carpeta no lleva
// escaparate-publicacion.json a propósito: así `npm run catalogo` y las herramientas que
// buscan la última revisión siguen partiendo de la .7, que es la publicada.
//
//   node rwadar-app/data/verificaciones/2026-11-03.8-v2/preparar-entrega.mjs
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const ETIQUETA = '2026-11-03.8', DESDE = '2026-11-03.7';
const FES = '04/11/2026';
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const escribir = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); };
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const q = v => `'${String(v).replace(/'/g, "''")}'`;

const textos = leer(path.join(DIR, 'textos-plataformas.json'));
assert.equal(textos.etiqueta, ETIQUETA);
const PREVIA = textos.revisionPublicadaExigida, HASH_PREVIA = textos.hashRevisionPublicadaExigida;

// ---------------------------------------------------------------- la previa es la .7 publicada
const revisionDesde = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${DESDE}-v2/revision.json`));
assert.equal(revisionDesde.revisionId, PREVIA, `la ${DESDE} no es la revisión ${PREVIA}`);
assert.equal(revisionDesde.hash, HASH_PREVIA, `identidad de la ${DESDE}`);
assert.equal(revisionDesde.textosPlataformasEnAplicador, false, `la ${DESDE} se aplicó sin los textos de public.plataformas`);
// Lo último leído de producción: el snapshot de la sincronización posterior a aplicar la .7.
const snapshot = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.ok([...snapshot.plataformas, ...snapshot.ofertas].every(x => x.revisionId === PREVIA),
  'el snapshot de la última sincronización no es la revisión publicada exigida');
assert.equal(snapshot.fuera.length, textos.descartadas, 'descartadas en el snapshot');

// ---------------------------------------------------------------- los textos y sus fuentes
const pp = textos.plataformas;
const realt = pp.realt, toucan = pp['toucan-protocol'], reental = pp.reental;
const filas = [
  ['reental', reental.estado, 'nota', reental.nota],
  ['toucan-protocol', toucan.estado, 'motivo_descarte', toucan.motivo_descarte],
  ['realt', realt.estado, 'etiqueta_descarte', realt.etiqueta_descarte],
  ['realt', realt.estado, 'motivo_descarte', realt.motivo_descarte],
];
assert.deepEqual([reental.estado, toucan.estado, realt.estado], ['en_radar', 'descartada', 'descartada']);
for (const [slug, , columna, c] of filas) {
  assert.equal(typeof c.antes, 'string'); assert.equal(typeof c.despues, 'string');
  assert.notEqual(c.antes, c.despues, `${slug}/${columna}: sin cambio`);
  assert.equal(c.despues, c.despues.trim().replace(/\s+/g, ' '), `${slug}/${columna}: espacios sobrantes`);
  if (columna === 'motivo_descarte') assert.ok(c.despues.length >= 40, `${slug}: motivo demasiado breve`);
}
// El motivo de RealT es exactamente sus frases, y cada frase tiene su fuente entre las de RealT.
// RealT conserva sus fuentes (misma dirección); a las que llevan «tituloAntes» se les corrige el
// título. fuentesRealtAntes es lo que hay hoy; fuentesRealt, lo que queda.
const fuentesRealt = [...realt.fuentesQueSeConservan, ...realt.fuentesNuevas];
const fuentesRealtAntes = realt.fuentesQueSeConservan.map(f => ({ url: f.url, titulo: f.tituloAntes ?? f.titulo }));
const titulosCorregidos = realt.fuentesQueSeConservan.filter(f => f.tituloAntes !== undefined);
for (const f of titulosCorregidos) {
  assert.ok(typeof f.tituloAntes === 'string' && f.tituloAntes.trim() && f.tituloAntes !== f.titulo, `${f.url}: título sin cambio`);
  assert.equal(f.titulo, f.titulo.trim().replace(/\s+/g, ' '), `${f.url}: espacios sobrantes en el título`);
}
assert.equal(realt.motivo_descarte.frases.map(f => f.texto).join(' '), realt.motivo_descarte.despues, 'el motivo de RealT son sus frases');
for (const f of realt.motivo_descarte.frases) {
  assert.ok(fuentesRealt.some(x => x.url === f.fuente), `RealT: «${f.texto.slice(0, 40)}…» sin fuente de la ficha`);
  assert.ok(f.literal?.length > 40, 'cada frase lleva su literal');
}
assert.doesNotMatch(realt.motivo_descarte.despues, /la mayor|insalubridad|más de 700/);
for (const f of fuentesRealt) assert.ok(typeof f.url === 'string' && /^https:\/\//.test(f.url) && typeof f.titulo === 'string' && f.titulo.trim(), f.url);
assert.equal(new Set(fuentesRealt.map(f => f.url)).size, fuentesRealt.length, 'RealT: direcciones repetidas');
for (const f of realt.fuentesNuevas) {
  assert.match(f.publicada_el, /^\d{4}-\d{2}-\d{2}$/); assert.match(f.consultada_el, /^\d{4}-\d{2}-\d{2}$/);
}

// Lo «antes» es lo que había en producción en la última sincronización, campo a campo.
const fueraPor = Object.fromEntries(snapshot.fuera.map(f => [f.n, f]));
const sReental = snapshot.plataformas.find(p => p.slug === 'reental');
assert.equal(sReental?.nota, reental.nota.antes, 'Reental: la nota publicada no es la prevista');
assert.equal(fueraPor['Toucan Protocol']?.why, toucan.motivo_descarte.antes, 'Toucan: motivo publicado');
assert.equal(fueraPor.RealT?.badge, realt.etiqueta_descarte.antes, 'RealT: etiqueta publicada');
assert.equal(fueraPor.RealT?.why, realt.motivo_descarte.antes, 'RealT: motivo publicado');
const parUrlTitulo = l => l.map(f => `${f.url}\n${f.titulo}`).sort();
assert.deepEqual(parUrlTitulo(fueraPor.RealT.fuentes), parUrlTitulo(fuentesRealtAntes), 'RealT: fuentes publicadas (dirección y título)');
assert.deepEqual(parUrlTitulo(fueraPor['Toucan Protocol'].fuentes), parUrlTitulo(toucan.fuentes), 'Toucan: fuentes publicadas (dirección y título)');
assert.ok(!fueraPor.RealT.fuentes.some(f => realt.fuentesNuevas.some(n => n.url === f.url)), 'RealT: la fuente nueva no está publicada todavía');

// ---------------------------------------------------------------- SQL
// Fuentes de una plataforma, comparadas como conjunto exacto de (dirección, título). Para la
// fuente nueva también sus fechas: si ya está con otro título u otras fechas, no es lo previsto.
const valoresFuentes = l => l.map(f => `(${q(f.url)}, ${q(f.titulo)})`).join(', ');
const fuentesIguales = (slug, lista) => `(select count(*) from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = ${q(slug)}) = ${lista.length}
      and not exists (select f.url, f.titulo from public.fuentes f join public.plataformas p on p.id = f.plataforma_id where p.slug = ${q(slug)}
        except select * from (values ${valoresFuentes(lista)}) as v(url, titulo))`;
const nuevasConFechas = realt.fuentesNuevas.map(f => `exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug = 'realt' and f.url = ${q(f.url)} and f.titulo = ${q(f.titulo)}
          and f.publicada_el = ${q(f.publicada_el)}::date and f.consultada_el = ${q(f.consultada_el)}::date)`).join('\n      and ');
const realtAntes = fuentesIguales('realt', fuentesRealtAntes);
// La fuente nueva no puede estar ya colgada de otra plataforma.
const nuevasSoloEnRealt = `not exists (select 1 from public.fuentes f join public.plataformas p on p.id = f.plataforma_id
        where p.slug <> 'realt' and f.url in (${realt.fuentesNuevas.map(f => q(f.url)).join(', ')}))`;
const realtDespues = `${fuentesIguales('realt', fuentesRealt)}
      and ${nuevasConFechas}`;
const texto = (slug, columna, v) => `(select ${columna} from public.plataformas where slug = ${q(slug)}) = ${q(v)}`;
const todos = (clave, extra) => [...filas.map(([slug, , columna, c]) => texto(slug, columna, c[clave])), extra].join('\n      and ');

const sql = `-- Entrega ${ETIQUETA} (preparada el ${FES}): solo los textos de public.plataformas y public.fuentes
-- de Reental, Toucan y RealT que quedaron fuera de la ${DESDE}. Pedida por Víctor.
-- No es un lote del catálogo: no crea ni aprueba ninguna revisión; la publicada sigue siendo la
-- ${PREVIA} (${DESDE}), y se exige que lo sea.
-- Generado localmente por rwadar-app/data/verificaciones/${ETIQUETA}-v2/preparar-entrega.mjs; revisar antes de aplicar.
-- Una sola transacción: si producción no está exactamente como se espera (o ya como quedaría),
-- no cambia nada. No toca el estado de ninguna plataforma, así que no registra cambios de estado
-- ni avisos; el disparador de siempre pone actualizada_el = now() en las filas que cambian.
begin isolation level serializable;
do $guarda$
declare actual uuid; retirada boolean; antes boolean; despues boolean;
begin
  select revision_id into actual from rwadar_catalogo.publicacion_v2 where unica for update;
  if actual is distinct from '${PREVIA}'::uuid then
    raise exception 'Publicación distinta de la revisión prevista (${DESDE}): %. No aplicar esta entrega.', actual;
  end if;
  if not exists (select 1 from rwadar_catalogo.revisiones where id = '${PREVIA}'::uuid
    and contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada') then
    raise exception 'La revisión publicada no tiene la identidad prevista o no está aprobada. No aplicar esta entrega.';
  end if;
  select retirado into retirada from public.catalogo_publicacion where unica for update;
  if retirada is distinct from false then
    raise exception 'Catálogo retirado o control ausente: esta entrega no autoriza reactivarlo.';
  end if;
  perform 1 from public.plataformas where slug in ('reental', 'toucan-protocol', 'realt') for update;
${filas.map(([slug, estado, columna, c]) => `  if (select count(*) from public.plataformas where slug = ${q(slug)} and estado = ${q(estado)}
      and ${columna} in (${q(c.antes)}, ${q(c.despues)})) <> 1 then
    raise exception 'Texto de % (%) distinto del previsto: no aplicar.', ${q(slug)}, ${q(columna)};
  end if;`).join('\n')}
  if not (${fuentesIguales('toucan-protocol', toucan.fuentes)}) then
    raise exception 'Fuentes de Toucan (dirección o título) distintas de las previstas: no aplicar.';
  end if;
  if not ((${realtAntes})
      or (${realtDespues})) then
    raise exception 'Fuentes de RealT (dirección, título o fechas de la nueva) distintas de las previstas: no aplicar.';
  end if;
  if not (${nuevasSoloEnRealt}) then
    raise exception 'La fuente nueva ya está en otra plataforma: no aplicar.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> ${textos.descartadas} then
    raise exception 'Tiene que haber exactamente ${textos.descartadas} descartadas: no aplicar.';
  end if;
  -- Todo como antes o todo ya como quedaría; nada a medias.
  antes := ${todos('antes', `(${realtAntes})`)};
  despues := ${todos('despues', `(${realtDespues})`)};
  if not (coalesce(antes, false) or coalesce(despues, false)) then
    raise exception 'Textos y fuentes a medias entre lo anterior y lo nuevo: no aplicar.';
  end if;
end $guarda$;
${filas.map(([slug, , columna, c]) => `update public.plataformas set ${columna} = ${q(c.despues)} where slug = ${q(slug)} and ${columna} = ${q(c.antes)};`).join('\n')}
${titulosCorregidos.map(f => `update public.fuentes set titulo = ${q(f.titulo)} where url = ${q(f.url)} and titulo = ${q(f.tituloAntes)} and plataforma_id = (select id from public.plataformas where slug = 'realt');`).join('\n')}
${realt.fuentesNuevas.map(f => `insert into public.fuentes (plataforma_id,url,titulo,publicada_el,consultada_el) select id,${q(f.url)},${q(f.titulo)},${q(f.publicada_el)}::date,${q(f.consultada_el)}::date from public.plataformas where slug = 'realt' on conflict (plataforma_id,url) do nothing;`).join('\n')}
do $comprobar$
begin
${filas.map(([slug, , columna, c]) => `  if (select ${columna} from public.plataformas where slug = ${q(slug)}) is distinct from ${q(c.despues)} then
    raise exception 'No quedó el texto nuevo de % (%).', ${q(slug)}, ${q(columna)};
  end if;`).join('\n')}
  if not (${realtDespues}) then
    raise exception 'RealT no quedó con sus ${fuentesRealt.length} fuentes previstas.';
  end if;
  if not (${nuevasSoloEnRealt}) then
    raise exception 'La fuente nueva quedó en otra plataforma.';
  end if;
  if not (${fuentesIguales('toucan-protocol', toucan.fuentes)}) then
    raise exception 'Las fuentes de Toucan cambiaron.';
  end if;
  if (select count(*) from public.plataformas where estado = 'descartada') <> ${textos.descartadas} then
    raise exception 'Tiene que haber exactamente ${textos.descartadas} descartadas.';
  end if;
  if (select revision_id from rwadar_catalogo.publicacion_v2 where unica) is distinct from '${PREVIA}'::uuid then
    raise exception 'La revisión publicada cambió.';
  end if;
end $comprobar$;
commit;
`;
const destino = path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
const archivo = path.join(destino, 'aplicar-y-aprobar.sql');
escribir(archivo, sql);
escribir(path.join(destino, 'revision.json'), { versionEsquema: 2, tipo: 'textos_plataformas', etiqueta: ETIQUETA,
  revisionId: null, revisionNueva: false, revisionPublicadaExigida: PREVIA, hashRevisionPublicadaExigida: HASH_PREVIA,
  revisionPublicadaComprobadaEnRemoto: false, desde: DESDE,
  tablas: ['public.plataformas', 'public.fuentes'],
  cambios: filas.map(([slug, , columna]) => `${slug}.${columna}`),
  titulosFuentes: titulosCorregidos.map(f => ({ url: f.url, antes: f.tituloAntes, despues: f.titulo })),
  fuentesNuevas: realt.fuentesNuevas.map(f => f.url),
  estado: 'preparada', aplicadoEnRemoto: false, publicacionWeb: false });
escribir(path.join(DIR, `contraste-${ETIQUETA}.json`), { tipo: 'textos_plataformas', preparadaEl: '2026-11-04', etiqueta: ETIQUETA,
  revisionPublicadaExigida: PREVIA, decision: textos.decision, alcance: textos.alcance,
  textos: { archivo: 'textos-plataformas.json', sha256: sha(path.join(DIR, 'textos-plataformas.json')) },
  cambios: filas.map(([slug, , columna, c]) => ({ slug, columna, antes: c.antes, despues: c.despues,
    fuentes: slug === 'realt' ? fuentesRealt.map(f => ({ url: f.url, titulo: f.titulo }))
      : slug === 'toucan-protocol' ? toucan.fuentes : [] })),
  titulosFuentes: titulosCorregidos.map(f => ({ url: f.url, antes: f.tituloAntes, despues: f.titulo })),
  fuentesNuevas: realt.fuentesNuevas, sinCambios: ['rwadar_catalogo (ninguna revisión nueva; la publicada sigue siendo la .7)',
    'estados y fechas de verificación de las plataformas',
    'las direcciones y fechas de las 3 fuentes que RealT ya tenía (de una solo cambia el título) y las 3 de Toucan',
    'Domoblock, Goldfinch y las otras 25 plataformas del radar', '24 ofertas'] });
console.log(JSON.stringify({ etiqueta: ETIQUETA, previa: PREVIA, sha256: sha(archivo), cambios: filas.length,
  titulosFuentes: titulosCorregidos.length, fuentesNuevas: realt.fuentesNuevas.length }));
