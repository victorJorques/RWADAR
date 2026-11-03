// Ensayo local de la corrección documental del 03/11 en PGlite (sin red).
//   node rwadar-app/data/verificaciones/2026-11-03-v2/comprobar-correccion.mjs
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
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const lote = path.join(APP, 'data/importaciones/catalogo-2026-11-03-v2');
const revision = leer(path.join(lote, 'revision.json'));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: '2026-11-03', versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
for (const n of ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json']) {
  assert.equal(sha(path.join(DIR, n)), sha(path.join(DIR, '../2026-11-02-v2', n)), `${n}: copia literal`);
}
const docsAntes = leer(path.join(DIR, '../2026-11-02-v2/documentacion-ofertas.json'));
const docs = leer(path.join(DIR, 'documentacion-ofertas.json'));
for (const slug of Object.keys(docsAntes)) if (slug !== 'aktionariat') assert.deepEqual(docs[slug], docsAntes[slug], slug);
const aplicar = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
assert.doesNotMatch(aplicar, /\b(delete\s+from|truncate|alter\s+(?:table|role)|drop\s|create\s+(?:table|function|policy)|grant\s|revoke\s)\b/i);
const db = await baseCompleta();
try {
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(fs.readFileSync(archivo, 'utf8'));
  const vistas = async () => {
    await sesion(db, null, 'anon');
    const api = x => JSON.parse(JSON.stringify(x), (k, v) =>
      ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
    const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2 order by slug'));
    const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2 order by slug'));
    await sesion(db);
    return { p, o };
  };
  for (const f of ['2026-10-22', '2026-10-23', '2026-11-02']) {
    await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8'));
  }
  const antes = await vistas();
  assert.ok(antes.o.length === 23 && antes.o.every(o => o.revision_id === revision.revisionAnterior));
  await assert.rejects(db.exec(aplicar.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000')), /Publicación distinta/);
  await db.exec('rollback');
  await db.exec(aplicar);
  const despues = await vistas();
  await db.exec(aplicar);
  assert.deepEqual(await vistas(), despues, 'idempotencia');
  const sinRev = ({ revision_id, documentacion, ...r }) => r;
  assert.deepEqual(despues.o.map(sinRev), antes.o.map(sinRev), 'ofertas, cifras, fechas y avisos idénticos');
  assert.deepEqual(despues.p.map(sinRev), antes.p.map(sinRev), 'plataformas idénticas');
  for (const o of despues.o) assert.deepEqual(o.documentacion, docs[o.slug], o.slug);
  const r = validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-03', permitirAmpliacion: true });
  assert.equal(r.fecha, '2026-11-02', 'la vigencia sigue contando desde el radar del 02/11');
  assert.equal(r.ofertasEsperadas, 23);
  const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
    revisionAnterior: revision.revisionAnterior, resultado: 'correcto', sha256AplicarYAprobar: sha(path.join(lote, 'aplicar-y-aprobar.sql')),
    pruebas: ['identidad SQL/fuentes', 'copias literales de radar, ofertas y manifiesto', 'solo cambia la documentación de aktionariat',
      'sin DDL ni borrados', 'rechazo de revisión anterior incorrecta con rollback', 'idempotencia',
      'vistas públicas idénticas salvo revisión y documentación', 'vigencia desde el 02/11 sin extender'] };
  fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
  console.log(JSON.stringify({ resultado: 'correcto', revisionId: revision.revisionId, sha256: informe.sha256AplicarYAprobar }));
} finally { await db.close(); }
