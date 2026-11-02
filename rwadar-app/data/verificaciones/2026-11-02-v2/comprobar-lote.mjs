// Ensayo local del lote del 02/11/2026 en PGlite: ninguna conexión remota.
//   node rwadar-app/data/verificaciones/2026-11-02-v2/comprobar-lote.mjs
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
const FECHA = '2026-11-02';
const lote = path.join(APP, `data/importaciones/catalogo-${FECHA}-v2`);
const revision = leer(path.join(lote, 'revision.json'));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: FECHA, versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const manifiestoNuevo = { versionEsquema: 2, plataformasEsperadas: 26, ofertasEsperadas: 23,
  coleccionesEsperadas: { principales: 6, secundario: 14, en_camino: 3 } };
const docs = leer(path.join(DIR, 'documentacion-ofertas.json'));
const escaparate = leer(path.join(DIR, 'escaparate-publicacion.json'));
const contraste = leer(path.join(DIR, `contraste-${FECHA}.json`));
assert.equal(Object.keys(docs).length, 23);
assert.equal(contraste.retiradas.length, 28);
assert.deepEqual(contraste.altas.sort(), ['robinhood-classic-stock-tokens', 'spiko-letras-del-tesoro-dolar']);

const aplicar = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
assert.match(aplicar, /begin isolation level serializable;/);
assert.doesNotMatch(aplicar, /\b(delete\s+from|truncate|alter\s+(?:table|role)|drop\s|create\s+(?:table|function|policy)|grant\s|revoke\s)\b/i);
const tablas = [...new Set([...aplicar.matchAll(/(?:insert into|update)\s+([a-z_]+\.[a-z_]+)/gi)].map(x => x[1]))].sort();
const esperadas = ['alerta_fuentes', 'alertas', 'fuentes', 'ofertas', 'plataforma_fuentes', 'plataformas', 'revisiones'];
assert.deepEqual(tablas, esperadas.map(n => `rwadar_catalogo.${n}`).sort(), 'solo siete tablas editoriales');

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
  // Reproduce el estado público actual: 22/10 y después la entrega del 23/10 (c406fa37…).
  await db.exec(fs.readFileSync('data/importaciones/catalogo-2026-10-22-v2/aplicar-y-aprobar.sql', 'utf8'));
  await db.exec(fs.readFileSync('data/importaciones/catalogo-2026-10-23-v2/aplicar-y-aprobar.sql', 'utf8'));
  const anterior = await snapshot(revision.revisionAnterior);
  const publicoAntes = await vistas();
  assert.equal(publicoAntes.o.length, 49);
  assert.ok(publicoAntes.o.every(o => o.revision_id === revision.revisionAnterior), 'partida = revisión pública');
  const negativos = [
    ['revision_anterior_incorrecta', aplicar.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000'), /Publicación distinta/],
    ['oferta_ausente', aplicar.replace(/^insert into rwadar_catalogo\.ofertas[^\n]*\n/m, ''), /Catálogo incompleto/],
  ];
  for (const [nombre, sql, error] of negativos) {
    await assert.rejects(db.exec(sql), error, nombre);
    await db.exec('rollback');
    assert.ok((await vistas()).o.every(o => o.revision_id === revision.revisionAnterior));
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
  assert.deepEqual(await snapshot(revision.revisionAnterior), anterior, 'el lote anterior se conserva íntegro');
  assert.equal(publico.p.length, 26);
  assert.equal(publico.o.length, 23);
  assert.ok([...publico.p, ...publico.o].every(f => f.revision_id === revision.revisionId));
  const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
  for (const o of publico.o) colecciones[o.coleccion]++;
  assert.deepEqual(colecciones, manifiestoNuevo.coleccionesEsperadas);
  for (const oferta of publico.o) assert.deepEqual(oferta.documentacion, docs[oferta.slug], `${oferta.slug}: documentación`);
  const porSlug = Object.fromEntries(publico.o.map(o => [o.slug, o]));
  assert.ok(contraste.retiradas.every(s => !porSlug[s]), 'ninguna retirada sigue publicada');
  assert.equal(porSlug['spiko-letras-del-tesoro-euro'].rentabilidad.mostrada, '2,35 %');
  assert.equal(porSlug['spiko-letras-del-tesoro-dolar'].rentabilidad.mostrada, '4,13 %');
  assert.equal(porSlug['spiko-letras-del-tesoro-euro'].disponible_es, true);
  assert.ok(publico.o.filter(o => o.coleccion !== 'principales').every(o => o.rentabilidad == null && o.precio == null &&
    o.disponible_es == null), 'colecciones documentales sin cifras comerciales');
  // Contrato compartido por web y app, con el límite de 49 ya retirado.
  const conAnterior = validarLotePublicoV2(publico.p, publico.o, { manifiesto: MANIFIESTO_CATALOGO_V2,
    hoy: FECHA, permitirAmpliacion: true });
  assert.equal(conAnterior.ofertasEsperadas, 23, 'lector actual: acepta la reducción deliberada');
  assert.throws(() => validarLotePublicoV2(publico.p, publico.o.slice(1), { manifiesto: MANIFIESTO_CATALOGO_V2,
    hoy: FECHA, permitirAmpliacion: true }), /incompleta|incompletas/, 'un lote cortado se rechaza');
  const resultado = validarLotePublicoV2(publico.p, publico.o, { manifiesto: manifiestoNuevo, hoy: FECHA });
  assert.equal(resultado.fecha, FECHA);
  validarLotePublicoV2(publico.p, publico.o, { manifiesto: manifiestoNuevo, hoy: '2026-11-09' });
  assert.throws(() => validarLotePublicoV2(publico.p, publico.o, { manifiesto: manifiestoNuevo, hoy: '2026-11-10' }), /caducada/);
  const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
    hash: revision.hash, revisionAnterior: revision.revisionAnterior, resultado: 'correcto',
    plataformas: publico.p.length, ofertas: publico.o.length, colecciones, altas: contraste.altas,
    retiradas: contraste.retiradas.length, fechaRadar: resultado.fecha, vigenteHasta: '2026-11-09',
    sha256AplicarYAprobar: sha(path.join(lote, 'aplicar-y-aprobar.sql')),
    pruebas: ['identidad SQL/fuentes', 'solo siete tablas editoriales, sin DDL ni borrados',
      'partida = revisión pública c406fa37', 'rechazo revisión anterior incorrecta con rollback',
      'rechazo lote incompleto con rollback', 'borrador invisible', 'aplicar dos veces sin cambios',
      'lote anterior conservado', '26 plataformas y 23 ofertas 6/14/3', '28 retiradas ausentes',
      'cifras de Spiko y acceso desde España', 'colecciones documentales sin cifras comerciales',
      'lector web/app acepta la reducción y rechaza un lote cortado', 'vigente hasta el 09/11 inclusive'],
    aplicadoRemoto: false, publicadoWeb: false };
  fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
  console.log(JSON.stringify({ resultado: informe.resultado, revisionId: revision.revisionId, ofertas: 23,
    colecciones, idempotencia: true, conservaAnterior: true, negativos: negativos.map(n => n[0]),
    sha256: informe.sha256AplicarYAprobar }));
} finally { await db.close(); }
