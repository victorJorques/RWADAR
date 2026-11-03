// Ensayo local de la segunda entrega del 03/11 («2026-11-03.2») en PGlite (sin red).
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
const { resumenOferta } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const lote = path.join(APP, 'data/importaciones/catalogo-2026-11-03.2-v2');
const revision = leer(path.join(lote, 'revision.json'));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: '2026-11-03.2', versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
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
  for (const f of ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03']) {
    await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8'));
  }
  const tabla = async id => (await filas(db, 'select to_jsonb(o) as f from rwadar_catalogo.ofertas o where revision_id=$1 order by slug', [id]))
    .map(r => { const { revision_id, documentacion, vigencia_dias, ...resto } = r.f; return resto; });
  const antes = await vistas();
  const crudasAntes = await tabla(revision.revisionAnterior);
  assert.ok(antes.o.length === 23 && antes.o.every(o => o.revision_id === revision.revisionAnterior));
  await assert.rejects(db.exec(aplicar.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000')), /Publicación distinta/);
  await db.exec('rollback');
  await db.exec(aplicar);
  const despues = await vistas();
  await db.exec(aplicar);
  assert.deepEqual(await vistas(), despues, 'idempotencia');
  assert.deepEqual(await tabla(revision.revisionId), crudasAntes, 'ofertas, cifras, fechas y avisos idénticos salvo vigencia y documentación');
  assert.deepEqual(despues.p.map(({ revision_id, ...r }) => r), antes.p.map(({ revision_id, ...r }) => r), 'plataformas idénticas');
  assert.ok(despues.o.every(o => o.vigencia_dias === 7), 'vigencia de 7 días');
  const tocadas = ['spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar', 'robinhood-classic-stock-tokens', 'prosegur-digital-gold', 'aktionariat'];
  for (const o of despues.o) {
    const a = antes.o.find(x => x.slug === o.slug);
    if (!tocadas.includes(o.slug)) assert.deepEqual(o.documentacion, a.documentacion, o.slug);
  }
  const r = validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-03', permitirAmpliacion: true });
  assert.equal(r.fecha, '2026-11-02');
  // Qué verá el cliente en la tarjeta, con el mismo lector de la web.
  const tarjetas = {};
  for (const slug of tocadas) {
    const o = despues.o.find(x => x.slug === slug);
    const oferta = { ...o, verificadaEl: o.verificada_el, vigenciaDias: o.vigencia_dias, estadoRevision: o.estado_revision,
      disponibleEs: o.disponible_es, plataformaSlug: o.plataforma_slug };
    for (const dia of ['2026-11-03', '2026-11-09']) {
      const s = resumenOferta(oferta, [], new Date(`${dia}T12:00:00Z`));
      tarjetas[`${slug} ${dia}`] = { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto };
      assert.equal(s.accesoEspana.estado, 'si', `${slug} ${dia}: acceso desde España visible`);
      assert.ok(!/You can|Bid\/Ask|sellingEnabled/.test(s.salida.texto), `${slug}: salida en castellano`);
    }
    const s10 = resumenOferta(oferta, [], new Date('2026-11-10T12:00:00Z'));
    assert.equal(s10.cifrasVigentes, false, `${slug}: el 10/11 ya no muestra cifras`);
  }
  const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
    revisionAnterior: revision.revisionAnterior, resultado: 'correcto', sha256AplicarYAprobar: sha(path.join(lote, 'aplicar-y-aprobar.sql')),
    tarjetas, pruebas: ['identidad SQL/fuentes', 'sin DDL ni borrados', 'rechazo de revisión anterior incorrecta con rollback',
      'idempotencia', 'solo cambian vigencia (1 → 7) y la documentación de cinco ofertas', 'tarjetas con acceso desde España y salida en castellano hasta el 09/11',
      'el 10/11 las cifras ya no se muestran'] };
  fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
  console.log(JSON.stringify({ resultado: 'correcto', revisionId: revision.revisionId, sha256: informe.sha256AplicarYAprobar, tarjetas }, null, 1));
} finally { await db.close(); }
