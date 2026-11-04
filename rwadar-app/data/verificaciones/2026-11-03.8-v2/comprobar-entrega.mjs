// Ensayo local de la entrega «2026-11-03.8» (textos de public.plataformas y public.fuentes de
// Reental, Toucan y RealT) en PGlite, sin red, sobre la misma cadena que producción
// (22/10 → 03/11.7, con la f2732257 publicada):
//   1. qué sentencias lleva el SQL y qué tablas toca;
//   2. con producción como se espera: cambian solo los cuatro textos y se añade la fuente de
//      Outlier; el catálogo (rwadar_catalogo), los estados, las fechas, las demás fuentes, los
//      cambios de estado y los avisos no se mueven; idempotente; lo que leen la web y la app;
//   3. con producción distinta en cualquier punto (también una fuente con otro título, o la de
//      Outlier ya presente con otro título u otras fechas, o a medias), falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-03.8-v2/comprobar-entrega.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const APP = path.join(ROOT, 'rwadar-app');
process.chdir(APP);
const require = createRequire(import.meta.url);
const { baseCompleta, filas, sesion } = await import('../../../pruebas-soporte.mjs');
const { validarLotePublicoV2, MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-03.8';
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const archivo = path.join(lote, 'aplicar-y-aprobar.sql');
const SQL = fs.readFileSync(archivo, 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const textos = leer(path.join(DIR, 'textos-plataformas.json'));
const PREVIA = textos.revisionPublicadaExigida;
assert.equal(revision.revisionPublicadaExigida, PREVIA);
assert.equal(revision.revisionNueva, false);
const pp = textos.plataformas, realt = pp.realt, toucan = pp['toucan-protocol'];
const OUTLIER = realt.fuentesNuevas[0];
const esperado = { reental: { nota: pp.reental.nota.despues },
  'toucan-protocol': { motivo_descarte: toucan.motivo_descarte.despues },
  realt: { etiqueta_descarte: realt.etiqueta_descarte.despues, motivo_descarte: realt.motivo_descarte.despues } };
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7'];
const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), etiqueta: ETIQUETA,
  revisionPublicadaExigida: PREVIA, sha256AplicarYAprobar: SHA, pruebas: [], casos: [] };
const ok = t => { informe.pruebas.push(t); console.log('  OK   ', t); };

// ---------------------------------------------------------------- 1 · inventario del SQL
// Los cuerpos de los bloques do $x$ … end $x$; solo leen y lanzan errores: se miran aparte.
const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'comprobar']);
for (const b of bloques) assert.doesNotMatch(b[2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|set\s+(?!role)\w+\s*=|execute\b|perform\s+(?!1 from public\.plataformas where slug in))/i,
  `el bloque ${b[1]} solo lee`);
const sinComentarios = SQL.replace(/^--.*$/gm, '').replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, 'do');
const sentencias = sinComentarios.match(/^(begin|do|update|insert|delete|commit|alter|create|drop|grant|revoke|truncate|select)\b[^\n]*/gim)
  .map(s => s.split(/\s+/).slice(0, 3).join(' ').replace(/\$\w+\$$/, '').trim());
assert.deepEqual(sentencias, ['begin isolation level', 'do', 'update public.plataformas set', 'update public.plataformas set',
  'update public.plataformas set', 'update public.plataformas set', 'insert into public.fuentes', 'do', 'commit;']);
assert.deepEqual(SQL.match(/^update public\.plataformas set (\w+) = /gm).map(s => s.split(' ')[3]),
  ['nota', 'motivo_descarte', 'etiqueta_descarte', 'motivo_descarte'], 'columnas que cambia');
assert.doesNotMatch(SQL, /\b(delete\s+from|truncate|alter\s+(?:table|role|type)|drop\s|create\s|grant\s|revoke\s)\b/i);
assert.doesNotMatch(SQL, /\b(?:update|insert\s+into|delete\s+from)\s+rwadar_catalogo\./i, 'no escribe en rwadar_catalogo');
assert.equal((SQL.match(/\bupdate\s+public\./gi) || []).length, 4);
assert.equal((SQL.match(/\binsert\s+into\s/gi) || []).length, 1);
assert.equal((SQL.match(/\bset\s+estado\b/gi) || []).length, 0, 'no cambia ningún estado');
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $comprobar$;\ncommit;\n'));
ok('inventario: una transacción serializable con guarda, 4 update de public.plataformas (nota, motivo_descarte y etiqueta_descarte), 1 insert en public.fuentes y comprobación final; nada en rwadar_catalogo, sin estados, sin esquema ni permisos');

// ---------------------------------------------------------------- base como producción
async function base() {
  const db = await baseCompleta();
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const a of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(fs.readFileSync(a, 'utf8'));
  for (const f of LOTES) await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8'));
  return db;
}
const api = x => JSON.parse(JSON.stringify(x), (k, v) =>
  ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
async function vistas(db) {
  await sesion(db, null, 'anon');
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2 order by slug'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2 order by slug'));
  // La misma lectura de descartes que rwadar-app/sincronizar.js (y la web en directo).
  const d = await filas(db, `select p.nombre, p.etiqueta_descarte, p.motivo_descarte,
    (select json_agg(json_build_object('url', f.url, 'titulo', f.titulo) order by f.url) from public.fuentes f where f.plataforma_id = p.id) as fuentes
    from public.plataformas p where p.estado = 'descartada' order by p.nombre`);
  await sesion(db);
  return { p, o, d };
}
// Foto de todo lo que la entrega podría tocar, y de lo que no debe tocar.
async function foto(db) {
  await sesion(db);
  const q = async s => JSON.stringify(await filas(db, s));
  return {
    publicacion: await q('select revision_id from rwadar_catalogo.publicacion_v2'),
    retirado: await q('select retirado from public.catalogo_publicacion'),
    revisiones: await q('select id, estado, contenido_sha256, aprobada_el from rwadar_catalogo.revisiones order by id'),
    catalogo: await q(`select (select count(*)::int from rwadar_catalogo.plataformas) p, (select count(*)::int from rwadar_catalogo.ofertas) o`),
    plataformas: await q('select * from public.plataformas order by slug'),
    fuentes: await q('select id, plataforma_id, url, titulo, publicada_el::text, consultada_el::text from public.fuentes order by plataforma_id, url'),
    cambios: await q('select count(*)::int c from cambios_estado'),
    avisos: await q('select count(*)::int c from avisos_pendientes'),
  };
}
const set = (slug, col, v) => `update public.plataformas set ${col} = '${v.replace(/'/g, "''")}' where slug = '${slug}';`;
const fuenteRealt = (url, titulo, extra = '') => `insert into public.fuentes (plataforma_id,url,titulo${extra ? ',publicada_el,consultada_el' : ''})
  select id,'${url}','${titulo.replace(/'/g, "''")}'${extra} from public.plataformas where slug='realt';`;
const ya = Object.entries(esperado).flatMap(([slug, cols]) => Object.entries(cols).map(([c, v]) => set(slug, c, v))).join('\n');
const outlierBien = fuenteRealt(OUTLIER.url, OUTLIER.titulo, `,'${OUTLIER.publicada_el}'::date,'${OUTLIER.consultada_el}'::date`);

async function caso(nombre, preparar, esperaFallo, extra) {
  const db = await base();
  try {
    if (preparar) { await sesion(db); await db.exec(preparar); }
    const antes = await foto(db);
    let error = null;
    try { await db.exec(SQL); } catch (e) { error = e.message; try { await db.exec('rollback'); } catch {} }
    const despues = await foto(db);
    if (esperaFallo) {
      assert.ok(error, `${nombre}: tenía que fallar`);
      if (esperaFallo instanceof RegExp) assert.match(error, esperaFallo, nombre);
      for (const k of Object.keys(antes)) assert.equal(despues[k], antes[k], `${nombre}: ${k} cambió pese al fallo`);
      informe.casos.push({ caso: nombre, falla: true, error: error.split('\n')[0], todoIgual: true });
      ok(`falla y no deja nada: ${nombre} → ${error.split('\n')[0]}`);
    } else {
      assert.equal(error, null, `${nombre}: no tenía que fallar (${error})`);
      const r = extra ? await extra(db, antes, despues) : {};
      informe.casos.push({ caso: nombre, falla: false, ...r });
    }
  } finally { await db.close(); }
}

// ---------------------------------------------------------------- 2 · producción como se espera
await caso('producción como la prevista', null, false, async (db, antes, despues) => {
  // El catálogo no se mueve: la misma revisión publicada, las mismas revisiones y filas.
  for (const k of ['publicacion', 'retirado', 'revisiones', 'catalogo', 'cambios', 'avisos']) assert.equal(despues[k], antes[k], k);
  assert.equal(JSON.parse(despues.publicacion)[0].revision_id, PREVIA);
  ok('la publicada sigue siendo la f2732257; rwadar_catalogo sin cambios; sin cambios de estado ni avisos');
  // public.plataformas: solo las columnas previstas (y actualizada_el en esas tres filas).
  const a = Object.fromEntries(JSON.parse(antes.plataformas).map(x => [x.slug, x]));
  const cambiadas = [];
  for (const x of JSON.parse(despues.plataformas)) for (const k of Object.keys(x))
    if (JSON.stringify(x[k]) !== JSON.stringify(a[x.slug][k])) cambiadas.push(`${x.slug}.${k}`);
  assert.deepEqual(cambiadas.sort(), ['realt.actualizada_el', 'realt.etiqueta_descarte', 'realt.motivo_descarte',
    'reental.actualizada_el', 'reental.nota', 'toucan-protocol.actualizada_el', 'toucan-protocol.motivo_descarte']);
  for (const [slug, cols] of Object.entries(esperado)) for (const [c, v] of Object.entries(cols))
    assert.equal(JSON.parse(despues.plataformas).find(x => x.slug === slug)[c], v, `${slug}.${c}`);
  ok('public.plataformas: cambian solo la nota de Reental, el motivo de Toucan y la etiqueta y el motivo de RealT; estados y fechas de verificación iguales');
  // public.fuentes: las de antes intactas y una más, la de Outlier, con su título y sus fechas.
  const fA = JSON.parse(antes.fuentes), fD = JSON.parse(despues.fuentes);
  assert.deepEqual(fD.filter(f => fA.some(x => x.id === f.id)), fA, 'las fuentes de antes, intactas');
  const nuevas = fD.filter(f => !fA.some(x => x.id === f.id));
  assert.equal(nuevas.length, 1);
  const { id, plataforma_id, ...nueva } = nuevas[0];
  assert.equal(plataforma_id, JSON.parse(despues.plataformas).find(x => x.slug === 'realt').id);
  assert.deepEqual(nueva, { url: OUTLIER.url, titulo: OUTLIER.titulo, publicada_el: OUTLIER.publicada_el, consultada_el: OUTLIER.consultada_el });
  ok(`public.fuentes: las ${fA.length} de antes intactas y solo una nueva, Outlier Media en RealT, con su título y sus fechas`);
  return { cambiadas, fuenteNueva: { url: nuevas[0].url, titulo: nuevas[0].titulo } };
});

// Idempotencia, vistas públicas y lo que generarían la web y las fichas.
{
  const db = await base();
  try {
    const v0 = await vistas(db);
    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo (ni siquiera cambia actualizada_el la segunda vez)');
    const sinNota = p => { const { nota, ...r } = p; return r; };
    assert.deepEqual(v1.o, v0.o, 'las 24 ofertas, idénticas');
    assert.equal(v1.p.length, 26);
    for (const p of v1.p) assert.deepEqual(sinNota(p), sinNota(v0.p.find(x => x.slug === p.slug)), `${p.slug}: igual salvo la nota`);
    assert.deepEqual(v1.p.filter(p => p.nota !== v0.p.find(x => x.slug === p.slug).nota).map(p => p.slug), ['reental']);
    assert.equal(v1.p.find(p => p.slug === 'reental').nota, esperado.reental.nota);
    const r = validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-04', permitirAmpliacion: true });
    assert.equal(r.fecha, '2026-11-03');
    ok('como visitante: 26 plataformas y 24 ofertas de la f2732257; solo cambia la nota de Reental; el lector de la web lo acepta');
    assert.equal(v1.d.length, 4);
    const porNombre = l => Object.fromEntries(l.map(x => [x.nombre, x]));
    const d0 = porNombre(v0.d), d1 = porNombre(v1.d);
    assert.deepEqual(d1.Domoblock, d0.Domoblock); assert.deepEqual(d1.Goldfinch, d0.Goldfinch);
    assert.deepEqual(d1['Toucan Protocol'].fuentes, d0['Toucan Protocol'].fuentes);
    assert.equal(d1['Toucan Protocol'].motivo_descarte, esperado['toucan-protocol'].motivo_descarte);
    assert.equal(d1.RealT.etiqueta_descarte, esperado.realt.etiqueta_descarte);
    assert.equal(d1.RealT.motivo_descarte, esperado.realt.motivo_descarte);
    assert.deepEqual(d1.RealT.fuentes, [...realt.fuentesQueSeConservan, ...realt.fuentesNuevas]
      .map(f => ({ url: f.url, titulo: f.titulo })).sort((x, y) => x.url < y.url ? -1 : 1));
    ok('descartes como los lee sincronizar.js: 4; RealT con su etiqueta, su motivo y 4 fuentes; Toucan con su motivo y sus 3 fuentes; Domoblock y Goldfinch iguales');
    // Lo que publicaría la web tras sincronizar: el snapshot de hoy con lo que devuelve la base.
    const snap = fichas.leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
    snap.plataformas = snap.plataformas.map(p => p.slug === 'reental' ? { ...p, nota: esperado.reental.nota } : p);
    snap.fuera = v1.d.map(f => ({ n: f.nombre, badge: f.etiqueta_descarte, why: f.motivo_descarte, fuentes: f.fuentes }));
    const salidas = fichas.construirSalidas({ catalogo: snap });
    const pagina = n => salidas.get(n);
    assert.ok(pagina('fuera-del-radar/realt.html').includes(fichas.esc(esperado.realt.motivo_descarte)));
    assert.ok(pagina('fuera-del-radar/realt.html').includes(OUTLIER.url));
    assert.ok(pagina('fuera-del-radar/toucan-protocol.html').includes(fichas.esc(esperado['toucan-protocol'].motivo_descarte)));
    assert.ok(!pagina('plataformas/reental.html').includes(fichas.esc(pp.reental.nota.antes)));
    for (const [n, html] of salidas) if (/\.html$/.test(n))
      assert.ok(html.match(/name="description" content="([^"]*)"/)[1].length <= 200, `${n}: descripción`);
    ok('las fichas fijas se generan con los textos nuevos (/fuera-del-radar/realt con Outlier, /fuera-del-radar/toucan-protocol, /plataformas/reental)');
    informe.descartes = v1.d;
  } finally { await db.close(); }
}

// Ya aplicada: no hace nada.
await caso('ya aplicada antes (todo como quedaría)', `${ya}\n${outlierBien}`, false, async (db, antes, despues) => {
  for (const k of Object.keys(antes)) assert.equal(despues[k], antes[k], `ya aplicada: ${k}`);
  ok('con todo ya como quedaría, pasa la guarda y no cambia nada');
  return { todoIgual: true };
});

// ---------------------------------------------------------------- 3 · producción distinta
const otra = '344a86aa-2c53-d2f0-fed4-5fdaadda33ad';
await caso('la publicada no es la f2732257', `update rwadar_catalogo.publicacion_v2 set revision_id = '${otra}';`, /Publicación distinta/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('nota de Reental distinta', set('reental', 'nota', 'Otra nota.'), /reental \(nota\)/);
await caso('Reental ya no está en el radar', `update public.plataformas set estado = 'descartada', etiqueta_descarte = 'Prueba', motivo_descarte = 'Motivo de prueba suficientemente largo para la fila.' where slug = 'reental';`, /reental \(nota\)/);
await caso('motivo de Toucan distinto', set('toucan-protocol', 'motivo_descarte', 'Otro motivo cualquiera para el descarte de Toucan, largo.'), /toucan-protocol \(motivo_descarte\)/);
await caso('etiqueta de RealT distinta', set('realt', 'etiqueta_descarte', 'Cerrada'), /realt \(etiqueta_descarte\)/);
await caso('motivo de RealT distinto', set('realt', 'motivo_descarte', 'Otro motivo cualquiera para el descarte de RealT, bastante largo.'), /realt \(motivo_descarte\)/);
// Si alguien hubiera aplicado el textos-plataformas.sql de la .7 (no aprobado), tampoco.
await caso('se aplicó antes el textos-plataformas.sql de la 2026-11-03.7',
  fs.readFileSync('data/importaciones/catalogo-2026-11-03.7-v2/textos-plataformas.sql', 'utf8'), /realt \(motivo_descarte\)/);
await caso('RealT con una fuente de más', fuenteRealt('https://example.org/otra', 'Otra'), /Fuentes de RealT/);
await caso('RealT sin una de sus 3 fuentes', `delete from public.fuentes where url = '${realt.fuentesQueSeConservan[2].url}';`, /Fuentes de RealT/);
await caso('una fuente de RealT con otro título (misma dirección)',
  `update public.fuentes set titulo = 'Otro título' where url = '${realt.fuentesQueSeConservan[1].url}';`, /Fuentes de RealT/);
await caso('una fuente de RealT sin título', `update public.fuentes set titulo = null where url = '${realt.fuentesQueSeConservan[0].url}';`, /Fuentes de RealT/);
await caso('Outlier ya presente con otro título', fuenteRealt(OUTLIER.url, 'Título distinto'), /Fuentes de RealT/);
await caso('Outlier ya presente con el título previsto pero otras fechas',
  fuenteRealt(OUTLIER.url, OUTLIER.titulo, `,'2026-07-15'::date,'${OUTLIER.consultada_el}'::date`), /Fuentes de RealT/);
await caso('una fuente de Toucan con otro título (misma dirección)',
  `update public.fuentes set titulo = 'Otro título' where url = '${toucan.fuentes[0].url}';`, /Fuentes de Toucan/);
await caso('una quinta descartada', `update public.plataformas set estado = 'descartada', etiqueta_descarte = 'Prueba', motivo_descarte = 'Motivo de prueba suficientemente largo para la fila.' where slug = 'addx';`, /exactamente 4 descartadas/);
await caso('a medias: solo Reental ya cambiado', set('reental', 'nota', esperado.reental.nota), /a medias/);
await caso('a medias: los textos ya nuevos pero sin Outlier', ya, /a medias/);
await caso('a medias: Outlier ya puesto y los textos como antes', outlierBien, /a medias/);
// La revisión publicada con otra identidad (no debería poder pasar; se fuerza sin disparadores).
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, sha256: SHA, pruebas: informe.pruebas.length }, null, 1));
