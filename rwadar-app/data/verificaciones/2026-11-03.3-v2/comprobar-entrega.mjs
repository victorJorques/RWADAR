// Ensayo local de la entrega «2026-11-03.3» en PGlite (sin red): cadena de
// producción, guarda de la revisión anterior, idempotencia y lo que verá el
// inversor en cada tarjeta con el mismo lector de la web y la app.
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
const ETIQUETA = '2026-11-03.3';
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const revision = leer(path.join(lote, 'revision.json'));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const aplicar = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
assert.doesNotMatch(aplicar, /\b(delete\s+from|truncate|alter\s+(?:table|role)|drop\s|create\s+(?:table|function|policy)|grant\s|revoke\s)\b/i);
const LITERAL = /Mindest|Kündigung|Laufzeit|Bid\/Ask|You can|sellingEnabled|bankTransfer|stage"|Jede Person/;
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
  for (const f of ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2']) {
    await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8'));
  }
  const antes = await vistas();
  assert.ok(antes.o.length === 23 && antes.o.every(o => o.revision_id === revision.revisionAnterior), 'la publicada es la anterior');
  await assert.rejects(db.exec(aplicar.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000')), /Publicación distinta/);
  await db.exec('rollback');
  await db.exec(aplicar);
  const despues = await vistas();
  await db.exec(aplicar);
  assert.deepEqual(await vistas(), despues, 'idempotencia');
  assert.equal(despues.p.length, 26);
  assert.equal(despues.o.length, 23);
  assert.ok([...despues.p, ...despues.o].every(x => x.revision_id === revision.revisionId), 'todo sale del lote nuevo');
  assert.ok(despues.o.every(o => o.verificada_el === '2026-11-03' && o.vigencia_dias === 7), 'fichas comprobadas hoy, 7 días');
  assert.deepEqual(despues.o.map(o => o.slug), antes.o.map(o => o.slug), 'mismas 23 fichas');
  const r = validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-03', permitirAmpliacion: true });
  assert.equal(r.fecha, '2026-11-03');
  validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-10', permitirAmpliacion: true });
  assert.throws(() => validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-11',
    permitirAmpliacion: true }), /caducada/);
  const spiko = Object.fromEntries(despues.o.filter(o => o.slug.startsWith('spiko')).map(o => [o.slug, o.rentabilidad?.mostrada]));
  assert.deepEqual(spiko, { 'spiko-letras-del-tesoro-dolar': '3,95 %', 'spiko-letras-del-tesoro-euro': '2,34 %' });
  // Qué verá el inversor en cada tarjeta.
  const tarjetas = {};
  for (const o of despues.o) {
    const oferta = { ...o, verificadaEl: o.verificada_el, vigenciaDias: o.vigencia_dias, estadoRevision: o.estado_revision,
      disponibleEs: o.disponible_es, plataformaSlug: o.plataforma_slug };
    const s = resumenOferta(oferta, [], new Date('2026-11-03T12:00:00Z'));
    const fila = { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto };
    tarjetas[o.slug] = fila;
    assert.ok(!LITERAL.test(JSON.stringify(fila)), `${o.slug}: la tarjeta no enseña citas literales`);
    if (o.coleccion === 'principales' && o.estado_revision === 'actual') assert.equal(s.accesoEspana.estado, 'si', `${o.slug}: acceso`);
    if (o.plataforma_slug === 'brickwise') {
      assert.equal(s.accesoEspana.estado, 'sin_comprobar', `${o.slug}: Brickwise no confirma la distribución en España`);
      assert.match(fila.minimo, /^(1 participación desde \d|1\.000 €)/, `${o.slug}: mínimo`);
    }
    if (o.coleccion !== 'principales') assert.equal(s.cifrasVigentes, false, `${o.slug}: sin cifras comerciales`);
    const s11 = resumenOferta(oferta, [], new Date('2026-11-11T12:00:00Z'));
    assert.equal(s11.vencida, true, `${o.slug}: vence el 11/11`);
    assert.ok(!s11.minimo.unidadDocumentada && s11.minimo.euros === undefined, `${o.slug}: el 11/11 oculta el mínimo`);
  }
  const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
    revisionAnterior: revision.revisionAnterior, resultado: 'correcto', sha256AplicarYAprobar: sha(path.join(lote, 'aplicar-y-aprobar.sql')),
    tarjetas, pruebas: ['identidad SQL/fuentes', 'sin DDL ni borrados', 'cadena de producción 22/10 → 03/11.2',
      'rechazo de revisión anterior incorrecta con rollback', 'idempotencia', '26 plataformas y 23 fichas comprobadas el 03/11, vigentes hasta el 10/11',
      'Spiko 2,34 % y 3,95 %', 'tarjetas sin citas literales; Brickwise sin confirmar la distribución en España', 'el 11/11 se ocultan los datos'] };
  fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
  console.log(JSON.stringify({ resultado: 'correcto', revisionId: revision.revisionId, sha256: informe.sha256AplicarYAprobar }, null, 1));
  for (const [slug, f] of Object.entries(tarjetas)) console.log(slug.slice(0, 30).padEnd(30), '|', f.minimo.slice(0, 34).padEnd(34), '|', f.espana.slice(0, 24).padEnd(24), '|', f.salida.slice(0, 60));
} finally { await db.close(); }
