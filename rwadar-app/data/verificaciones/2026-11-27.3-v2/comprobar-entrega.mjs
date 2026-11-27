// Ensayo local de la entrega «2026-11-27.3» (disponibilidad por país en la documentación de las 40 ofertas) en PGlite,
// sin red, sobre la misma cadena que producción (el seed de antes de ARTEX y los lotes del 22/10 a la 2026-11-27.2, con
// la migración 38 tras el 2026-11-20). Comprueba el inventario del SQL (sin nada en public.*), que antes de aplicar PGlite
// enseña lo leído como visitante, que después queda publicada la revisión nueva con todo igual salvo
// documentacion.disponibilidad (la de disponibilidad.json), que el lector de la web y el de la app la aceptan, que es
// idempotente y que con producción distinta falla sin dejar nada.
//
//   node rwadar-app/data/verificaciones/2026-11-27.3-v2/comprobar-entrega.mjs
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
const { baseCatalogoHistorico, filas, sesion } = await import('../../../pruebas-soporte.mjs');
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2, MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
const D = require(path.join(ROOT, 'rwadar-movil/lib/disponibilidad-pais.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-27.3', FECHA = '2026-11-27', DESDE = '2026-11-27.2', ULTIMO = '2026-12-03';
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const revision = leer(path.join(lote, 'revision.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA]);
const D26 = leer(path.join(APP, 'data/verificaciones/2026-11-26-v2/decisiones.json'));
const LOTES = [...D26.cadena, '2026-11-26', '2026-11-26.2', '2026-11-26.3', '2026-11-26.4', '2026-11-27', DESDE];
const MIGRACIONES_TRAS_LOTE = { '2026-11-20': ['db/38_textos_radar.sql'] };
const DISP = leer(path.join(DIR, 'disponibilidad.json')).ofertas;
const pruebas = [];
const ok = t => { pruebas.push(t); console.log('  OK   ', t); };

// 1 · inventario: guardas, nada en public.*, solo inserts idempotentes de la revisión nueva.
const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type|policy|function|default)|drop\s|create\s|grant\s|revoke\s)/i;
assert.doesNotMatch(SQL, PROHIBIDO);
const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'publico_guarda', 'aprobar']);
const sentencias = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '').split('\n').filter(l => l.trim() && !l.startsWith('--'));
assert.deepEqual(sentencias.filter(l => !/^insert into rwadar_catalogo\.\w+ \(/.test(l)), ['begin isolation level serializable;', 'commit;']);
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts son de la revisión nueva');
assert.ok(bloques[0][2].includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`) && bloques[0][2].includes(`date '${ULTIMO}'`));
ok(`inventario: una transacción serializable; guarda (publicada ${PREVIA.slice(0, 8)} con su huella, fecha hasta el 03/12); nada en public.*`);

async function base() {
  const db = await baseCatalogoHistorico();
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const a of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(fs.readFileSync(a, 'utf8'));
  for (const f of LOTES) {
    const sql = fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8');
    await db.exec(sql.replace(/current_date > date '(\d{4}-\d{2}-\d{2})'/g, `date '${f.slice(0, 10)}' > date '$1'`));
    for (const m of MIGRACIONES_TRAS_LOTE[f] || []) await db.exec(fs.readFileSync(m, 'utf8'));
  }
  return db;
}
const api = x => JSON.parse(JSON.stringify(x, (k, v) => v instanceof Date ? v.toISOString() : v), (k, v) =>
  ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
async function vistas(db) {
  await sesion(db, null, 'anon');
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
  await sesion(db);
  return { p, o };
}
const foto = async db => { await sesion(db); return JSON.stringify(await filas(db,
  `select (select revision_id from rwadar_catalogo.publicacion_v2) pub, (select count(*)::int from rwadar_catalogo.revisiones) r,
    (select json_agg(p order by slug) from public.plataformas p) pl`)); };

// 2 y 3 · producción como se espera.
{
  const db = await base();
  const v0 = await vistas(db);
  assert.ok(v0.o.every(o => o.revision_id === PREVIA) && v0.o.length === 40 && v0.p.length === 73);
  const lp = path.join(DIR, 'lectura-publica');
  const pubO = leer(path.join(lp, 'ofertas-v2.json'));
  for (const o of pubO) assert.deepEqual(v0.o.find(x => x.slug === o.slug).documentacion, o.documentacion, `${o.slug}: PGlite = lo leído como visitante`);
  ok(`antes de aplicar, PGlite enseña la ${DESDE} (73 plataformas, 40 ofertas) y lo leído como visitante`);
  const t0 = await foto(db);
  await db.exec(SQL);
  const v1 = await vistas(db);
  assert.ok(v1.o.every(o => o.revision_id === NUEVA) && v1.o.length === 40 && v1.p.length === 73);
  for (const o of v1.o) {
    const antes = v0.o.find(x => x.slug === o.slug);
    const { disponibilidad, ...resto } = o.documentacion;
    assert.deepEqual(disponibilidad, DISP[o.slug], `${o.slug}: disponibilidad publicada = disponibilidad.json`);
    assert.deepEqual(resto, antes.documentacion, `${o.slug}: el resto de la documentación, igual`);
    const sin = x => { const { revision_id, documentacion, verificado_lote_el, ...r } = x; return r; };
    assert.deepEqual(sin(o), sin(antes), `${o.slug}: la oferta, igual`);
  }
  ok('publicada la revisión nueva: las 40 ofertas iguales salvo documentacion.disponibilidad, que es la de disponibilidad.json');
  const t1 = JSON.parse(await foto(db)), t0j = JSON.parse(t0);
  assert.deepEqual(t1[0].pl, t0j[0].pl, 'public.plataformas intacta');
  await db.exec(SQL);
  assert.equal(await foto(db), JSON.stringify(t1), 'idempotente');
  ok('public.plataformas intacta e idempotente: aplicarla dos veces da lo mismo');
  // Lectores: la web (validarLotePublicoV2) y la app (adaptarCatalogoV2) aceptan el lote y conservan la disponibilidad.
  const ahora = new Date(`${FECHA}T12:00:00Z`);
  validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: ahora, permitirAmpliacion: true });
  const app = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, ahora);
  assert.equal(app.ofertas.length, 40);
  for (const o of app.ofertas) assert.deepEqual(D.disponibilidadDe(o), DISP[o.slug], `${o.slug}: la app la lee`);
  const es = app.ofertas.map(o => D.estadoEnPais(o, 'ES').estado), hk = app.ofertas.map(o => D.estadoEnPais(o, 'HK').estado);
  ok(`lector de la web y de la app: aceptan el lote y leen la disponibilidad (España: ${es.filter(e => e === 'disponible').length} disponibles; Hong Kong: ${hk.filter(e => e !== 'sin_confirmar' && e !== 'no_disponible').length} accesibles)`);
  await db.close();
}

// 4 · producción distinta: falla y no deja nada.
async function caso(nombre, preparar, patron) {
  const db = await base();
  try {
    if (preparar) { await sesion(db); await db.exec(preparar); }
    const antes = await foto(db);
    let error = null;
    try { await db.exec(SQL); } catch (e) { error = e.message; try { await db.exec('rollback'); } catch {} }
    assert.ok(error && patron.test(error), `${nombre}: ${error}`);
    assert.equal(await foto(db), antes, `${nombre}: cambió algo pese al fallo`);
    ok(`falla y no deja nada: ${nombre} → ${error.split('\n')[0]}`);
  } finally { await db.close(); }
}
await caso('otra revisión publicada', `update rwadar_catalogo.publicacion_v2 set revision_id = (select id from rwadar_catalogo.revisiones where id <> '${PREVIA}'::uuid and estado = 'aprobada' limit 1)`, /Publicación distinta/);
await caso('catálogo retirado', 'update public.catalogo_publicacion set retirado = true', /Catálogo retirado/);
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify({ tipo: 'ensayo_local_pglite', etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: NUEVA, sha256AplicarYAprobar: crypto.createHash('sha256').update(SQL).digest('hex'), pruebas }, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, pruebas: pruebas.length }, null, 1));
