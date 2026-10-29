// Ensayo local específico del lote parcial: una ejecución, ninguna conexión remota.
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
const base = path.resolve(DIR, '../2026-10-22-v2');
const lote = path.join(APP, 'data/importaciones/catalogo-2026-10-23-v2');
const revision = leer(path.join(lote, 'revision.json'));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: '2026-10-23', versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
for (const n of ['radar-canonico-26.json', 'escaparate-publicacion.json', 'manifiesto-catalogo.json']) {
  assert.equal(sha(path.join(DIR, n)), sha(path.join(base, n)), `${n}: copia literal sin rejuvenecer`);
}
const docsAntes = leer(path.join(base, 'documentacion-ofertas.json'));
const docsAhora = leer(path.join(DIR, 'documentacion-ofertas.json'));
const nuevas = leer(path.join(DIR, 'contraste-2026-10-23.json')).referenciasNuevas;
let refs = 0;
for (const [slug, doc] of Object.entries(docsAntes)) {
  const additions = nuevas.filter(r => r.slug === slug).map(r => r.referencia);
  const esperado = structuredClone(doc);
  if (additions.length) {
    esperado.revisadaEl = '2026-10-23';
    esperado.referencias.push(...additions);
    for (const r of additions) if (!esperado.fuentes.includes(r.fuente)) esperado.fuentes.push(r.fuente);
  }
  assert.deepEqual(docsAhora[slug], esperado, `${slug}: solo referencias/documentación autorizadas`);
  refs += additions.length;
}
assert.equal(refs, 4);
assert.equal(Object.keys(docsAhora).length, 49);
// Las ilustraciones existentes se inventarían por SHA real; este lote no las genera.
const imagenDir = path.join(ROOT, 'rwadar-movil/assets/ofertas-editoriales');
const imagenManifiesto = leer(path.join(imagenDir, 'manifest.json'));
const imagenes = imagenManifiesto.fichas;
assert.equal(imagenes.length, 49);
const slugs = new Set(Object.keys(docsAhora));
for (const e of imagenes) {
  assert.ok(slugs.has(e.slug), `imagen de slug fuera del catálogo: ${e.slug}`);
  assert.equal(sha(path.join(imagenDir, e.archivo)), e.hashSha256, `${e.slug}: imagen íntegra`);
  assert.equal(fs.statSync(path.join(imagenDir, e.archivo)).size, e.bytes);
}

const aplicar = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
assert.match(aplicar, /begin isolation level serializable;/);
assert.doesNotMatch(aplicar, /\b(delete\s+from|truncate|alter\s+(?:table|role)|drop\s|create\s+(?:table|function|policy)|grant\s|revoke\s)\b/i);
const tablas = [...new Set([...aplicar.matchAll(/(?:insert into|update)\s+([a-z_]+\.[a-z_]+)/gi)].map(x => x[1]))].sort();
const esperadas = ['alerta_fuentes', 'alertas', 'fuentes', 'ofertas', 'plataforma_fuentes', 'plataformas', 'revisiones'];
assert.deepEqual(tablas, esperadas.map(n => `rwadar_catalogo.${n}`).sort());
const db = await baseCompleta();
try {
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) {
    await db.exec(fs.readFileSync(archivo, 'utf8'));
  }
  const vistas = async () => {
    await sesion(db, null, 'anon');
    const api = x => JSON.parse(JSON.stringify(x), (k, v) =>
      ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
    const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2 order by slug'));
    const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2 order by slug'));
    await sesion(db);
    return { p, o };
  };
  const snapshot = async id => Object.fromEntries(await Promise.all(esperadas.map(async t => [t,
    (await filas(db, `select to_jsonb(t)::text as fila from rwadar_catalogo.${t} t where ${t === 'revisiones' ? 'id' : 'revision_id'}=$1 order by to_jsonb(t)::text`, [id])).map(r => r.fila)])));
  await db.exec(fs.readFileSync('data/importaciones/catalogo-2026-10-22-v2/aplicar-y-aprobar.sql', 'utf8'));
  const anterior = await snapshot(revision.revisionAnterior);
  const publicoAntes = await vistas();
  assert.equal(publicoAntes.o.length, 49);
  assert.equal(publicoAntes.o[0].revision_id, revision.revisionAnterior);
  // Precondición desfasada e incompletitud se prueban ANTES de aprobar el lote nuevo.
  const negativos = [
    ['revision_anterior_incorrecta', aplicar.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000'), /Publicación distinta/],
    ['oferta_ausente', aplicar.replace(/^insert into rwadar_catalogo\.ofertas[^\n]*\n/m, ''), /Catálogo incompleto/],
  ];
  for (const [nombre, sql, error] of negativos) {
    await assert.rejects(db.exec(sql), error, nombre);
    await db.exec('rollback');
    assert.equal((await vistas()).o[0].revision_id, revision.revisionAnterior);
    assert.equal((await filas(db, 'select count(*)::integer as n from rwadar_catalogo.revisiones where id=$1', [revision.revisionId]))[0].n, 0,
      `${nombre}: ni siquiera queda la revisión nueva`);
  }
  await db.exec(nueva.sql);
  assert.deepEqual(await vistas(), publicoAntes, 'borrador completamente invisible');
  await db.exec(aplicar);
  const una = await snapshot(revision.revisionId);
  const publico = await vistas();
  await db.exec(aplicar);
  assert.deepEqual(await snapshot(revision.revisionId), una, 'idempotencia completa de las siete tablas');
  assert.deepEqual(await snapshot(revision.revisionAnterior), anterior, 'las siete tablas del lote anterior se conservan');
  const quitarRevision = fila => { const { revision_id, documentacion, ...r } = fila; return r; };
  assert.deepEqual(publico.o.map(quitarRevision), publicoAntes.o.map(quitarRevision), 'fechas, cifras, avisos y guardas públicas intactos');
  assert.deepEqual(publico.p.map(quitarRevision), publicoAntes.p.map(quitarRevision), '26 plataformas preservadas');
  for (const oferta of publico.o) assert.deepEqual(oferta.documentacion, docsAhora[oferta.slug]);
  const resultado = validarLotePublicoV2(publico.p, publico.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-10-23' });
  assert.equal(resultado.fecha, '2026-10-22');
  assert.equal(resultado.vigenciaDias, 7);
  validarLotePublicoV2(publico.p, publico.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-10-29' });
  assert.throws(() => validarLotePublicoV2(publico.p, publico.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-10-30' }), /caducada/);
  assert.equal(validarLotePublicoV2(publico.p, publico.o, { manifiesto: MANIFIESTO_CATALOGO_V2,
    hoy: '2026-10-30', permitirCaducado: true }).caducado, true, 'copia completa admisible con aviso de caducidad');
  const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
    hash: revision.hash, revisionAnterior: revision.revisionAnterior, resultado: 'correcto',
    contratosCompartidosWebApp: true, plataformas: publico.p.length, ofertas: publico.o.length,
    colecciones: revision.colecciones, referenciasNuevas: refs, nuevasAltas: 0, fechaRadar: resultado.fecha,
    caducaSinRenovacionEl: '2026-10-30', pruebas: ['identidad SQL/fuentes', 'copia literal radar/ofertas/manifiesto',
      'solo cuatro referencias y fechas documentales de tres fichas', '49 imágenes sin modificación verificadas SHA/bytes',
      'solo siete tablas editoriales en SQL', 'borrador invisible', 'aplicar dos veces sin cambios',
      'conservación completa siete tablas anteriores', 'salida pública financiera/fechas idéntica',
      '26/49 y 24/21/4 contratos compartidos', 'caducidad original 29/10 inclusive; copia completa con aviso después',
      'rechazo revisión anterior incorrecta con rollback', 'rechazo lote incompleto con rollback'],
    inventarioImagenes: { manifiesto: path.relative(ROOT, path.join(imagenDir, 'manifest.json')).replaceAll('\\', '/'),
      sha256Manifiesto: sha(path.join(imagenDir, 'manifest.json')), archivos: imagenes.map(e => ({ slug: e.slug, archivo: e.archivo,
        bytes: e.bytes, sha256: e.hashSha256 })) },
    aplicadoRemoto: false, publicadoWeb: false, revisionIndependienteSQL: false };
  fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
  console.log(JSON.stringify({ resultado: informe.resultado, revisionId: revision.revisionId, plataformas: 26,
    ofertas: 49, nuevasReferencias: 4, imagenesIntactas: imagenes.length, idempotencia: true, conservaAnterior: true,
    fechaRadar: resultado.fecha, caducidadNoExtendida: true, negativosRollback: negativos.map(n => n[0]) }));
} finally { await db.close(); }
