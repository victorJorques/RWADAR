// Ensayo local de la entrega «2026-11-03.7» (textos para el lector) en PGlite, sin red:
// cadena de producción, guarda de la revisión anterior, idempotencia, que solo cambian los
// textos previstos y que las 24 ofertas siguen idénticas. Prueba también los textos de
// public.plataformas (textos-plataformas.sql) aparte y dentro del aplicador, como quedaría
// con --con-textos-plataformas, y que no generan cambios de estado ni avisos.
//
//   node rwadar-app/data/verificaciones/2026-11-03.7-v2/comprobar-entrega.mjs
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
const ETIQUETA = '2026-11-03.7';
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const revision = leer(path.join(lote, 'revision.json'));
const textos = leer(path.join(DIR, 'textos-lector.json'));
const contraste = leer(path.join(DIR, `contraste-${ETIQUETA}.json`));
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(revision.revisionId, nueva.revisionId);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const aplicar = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const textosSql = fs.readFileSync(path.join(lote, 'textos-plataformas.sql'), 'utf8');
const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type)|drop\s|create\s+(?:table|function|policy|type|view|trigger)|grant\s|revoke\s)\b/i;
assert.doesNotMatch(aplicar, PROHIBIDO);
assert.doesNotMatch(textosSql, PROHIBIDO);
assert.equal(/public\.plataformas set/.test(aplicar), revision.textosPlataformasEnAplicador === true,
  'el aplicador lleva los textos de public.plataformas solo si se pidió');
// El bloque de textos, tal como lo mete --con-textos-plataformas antes de aprobar.
const bloque = textosSql.slice(textosSql.indexOf('begin isolation level serializable;\n') + 36, textosSql.lastIndexOf('commit;\n'));
// El lote solo (sección 1) y el lote con los textos (sección 3), venga como venga el aplicador.
const aplicarSin = revision.textosPlataformasEnAplicador ? aplicar.replace(bloque, () => '') : aplicar;
const aplicarCon = revision.textosPlataformasEnAplicador ? aplicar
  : aplicar.replace('do $aprobar$', () => bloque + 'do $aprobar$');
assert.ok(!aplicarSin.includes('public.plataformas set'), 'el lote solo no escribe en public.plataformas');
assert.ok(aplicarCon.indexOf('$textos_guarda$') > 0 && aplicarCon.indexOf('$textos_comprobar$') < aplicarCon.indexOf('do $aprobar$'),
  'variante con textos montada antes de aprobar');
const LITERAL = /Mindest|Kündigung|Laufzeit|Bid\/Ask|You can|sellingEnabled|bankTransfer|stage"|Jede Person/;
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6'];
const pp = textos.plataformasPublicas;
const esperadoPublico = { reental: { nota: pp.reental.nota.despues },
  'toucan-protocol': { motivo_descarte: pp['toucan-protocol'].motivo_descarte.despues },
  realt: { etiqueta_descarte: pp.realt.etiqueta_descarte.despues, motivo_descarte: pp.realt.motivo_descarte.despues } };

async function base() {
  const db = await baseCompleta();
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
    'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(fs.readFileSync(archivo, 'utf8'));
  for (const f of LOTES) await db.exec(fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8'));
  return db;
}
const api = x => JSON.parse(JSON.stringify(x), (k, v) =>
  ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
async function vistas(db) {
  await sesion(db, null, 'anon');
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2 order by slug'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2 order by slug'));
  await sesion(db);
  return { p, o };
}
// La misma lectura de descartes que rwadar-app/sincronizar.js.
const descartes = async db => {
  await sesion(db, null, 'anon');
  const d = await filas(db, `select p.nombre, p.etiqueta_descarte, p.motivo_descarte,
    (select json_agg(json_build_object('url', f.url, 'titulo', f.titulo) order by f.url) from public.fuentes f where f.plataforma_id = p.id) as fuentes
    from public.plataformas p where p.estado = 'descartada' order by p.nombre`);
  await sesion(db);
  return d;
};
const publicas = async db => Object.fromEntries((await filas(db,
  `select slug, nota, etiqueta_descarte, motivo_descarte, estado, verificada_el::text from public.plataformas order by slug`)).map(r => [r.slug, r]));
const rastro = async db => ({
  cambios: (await filas(db, 'select count(*)::int c from cambios_estado'))[0].c,
  avisos: (await filas(db, 'select count(*)::int c from avisos_pendientes'))[0].c,
});
const sinRevision = o => { const { revision_id, ofertas_esperadas, colecciones_esperadas, ...r } = o; return r; };
const sinVerificacion = p => { const { revision_id, verificacion_local, ...r } = p; return r; };

const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), revisionId: revision.revisionId,
  revisionAnterior: revision.revisionAnterior, sha256AplicarYAprobar: sha(path.join(lote, 'aplicar-y-aprobar.sql')),
  sha256TextosPlataformas: sha(path.join(lote, 'textos-plataformas.sql')), textosPlataformasEnAplicador: revision.textosPlataformasEnAplicador,
  pruebas: [] };
const ok = t => { informe.pruebas.push(t); console.log('  OK   ', t); };

// ---------------------------------------------------------------- 1 · el lote, como se aplicará
let db = await base();
try {
  const antes = await vistas(db);
  const publicasAntes = await publicas(db);
  const rastroAntes = await rastro(db);
  assert.ok(antes.o.length === 24 && antes.o.every(o => o.revision_id === revision.revisionAnterior), 'la publicada es la anterior');
  ok('cadena de producción 22/10 → 03/11.6: la publicada es la 344a86aa');
  await assert.rejects(db.exec(aplicarSin.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000')), /Publicación distinta/);
  await db.exec('rollback');
  ok('rechaza una revisión anterior distinta y lo deshace todo');
  await db.exec(aplicarSin);
  const despues = await vistas(db);
  await db.exec(aplicarSin);
  assert.deepEqual(await vistas(db), despues, 'idempotencia');
  ok('idempotente: aplicarlo dos veces da lo mismo');
  assert.equal(despues.p.length, 26);
  assert.equal(despues.o.length, 24);
  assert.ok([...despues.p, ...despues.o].every(x => x.revision_id === revision.revisionId), 'todo sale del lote nuevo');
  assert.ok(despues.o.every(o => o.verificada_el === '2026-11-03' && o.vigencia_dias === 7), 'fechas y vigencia intactas');
  assert.ok(despues.p.every(p => p.verificado_lote_el === '2026-11-03'), 'fecha del lote intacta');
  for (const a of antes.o) assert.deepEqual(sinRevision(despues.o.find(o => o.slug === a.slug)), sinRevision(a), `${a.slug} sin cambios`);
  ok('26 plataformas y 24 ofertas; las 24 ofertas, idénticas; fechas del 03/11 y 7 días');
  // Plataformas: igual salvo los textos previstos.
  let vistos = 0;
  for (const a of antes.p) {
    const d = despues.p.find(p => p.slug === a.slug);
    assert.deepEqual(sinVerificacion(d), sinVerificacion(a), `${a.slug}: nombre, nota, tipo y datos de public.plataformas sin cambios`);
    const va = structuredClone(a.verificacion_local), vd = structuredClone(d.verificacion_local);
    const c = textos.revision[a.slug] || {};
    for (const campo of ['estadoOperativo', 'licenciaRegistro', 'acceso']) {
      if (c[campo]) {
        assert.equal(va[campo].detalle, c[campo].antes, `${a.slug}/${campo}: antes`);
        assert.equal(vd[campo].detalle, c[campo].despues, `${a.slug}/${campo}: después`);
        vd[campo].detalle = va[campo].detalle; vistos++;
      }
    }
    for (const alerta of vd.alertasCriticas) {
      const t = c.alertas?.[alerta.codigo];
      assert.ok(t, `${a.slug}/${alerta.codigo}: todos los avisos cambian`);
      assert.equal(va.alertasCriticas.find(x => x.codigo === alerta.codigo).detalle, t.antes);
      assert.equal(alerta.detalle, t.despues);
      alerta.detalle = t.antes; vistos++;
    }
    assert.deepEqual(vd, va, `${a.slug}: estados, fuentes y fechas sin cambios`);
  }
  assert.equal(vistos, 58);
  ok('las 26 plataformas: solo cambian los 58 textos previstos (26 avisos, 22 notas de estado, 10 detalles de acceso o licencia); estados, fuentes y fechas iguales');
  const r = validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-04', permitirAmpliacion: true });
  assert.equal(r.fecha, '2026-11-03');
  validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-10', permitirAmpliacion: true });
  assert.throws(() => validarLotePublicoV2(despues.p, despues.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-11',
    permitirAmpliacion: true }), /caducada/);
  ok('el lector de la web lo acepta; vence el 11/11, como la 03/11.6');
  const tarjetas = {};
  for (const o of despues.o) {
    const pinta = x => { const oferta = { ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias, estadoRevision: x.estado_revision,
      disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug };
      const s = resumenOferta(oferta, [], new Date('2026-11-04T12:00:00Z'));
      return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto }; };
    tarjetas[o.slug] = pinta(o);
    assert.deepEqual(tarjetas[o.slug], pinta(antes.o.find(x => x.slug === o.slug)), `${o.slug}: la tarjeta no cambia`);
    assert.ok(!LITERAL.test(JSON.stringify(tarjetas[o.slug])), `${o.slug}: sin citas literales`);
  }
  ok('las 24 tarjetas se ven igual que antes');
  assert.deepEqual(await publicas(db), publicasAntes, 'el lote no toca public.plataformas');
  assert.deepEqual(await rastro(db), rastroAntes);
  ok('el lote solo lee public.plataformas: notas, descartes, cambios de estado y avisos, igual');
  informe.tarjetas = tarjetas;

  // -------------------------------------------------------------- 2 · textos-plataformas.sql, aparte
  const descartesAntes = await descartes(db);
  assert.equal(descartesAntes.length, 4);
  await assert.rejects(db.exec(textosSql.replace(`'Proyectos inmobiliarios en España y Latinoamérica desde 100 €. La opción más accesible para un inversor español.'`,
    `'texto que no está en la base'`)), /Texto de reental/);
  await db.exec('rollback');
  assert.deepEqual(await publicas(db), publicasAntes);
  ok('textos-plataformas.sql se niega si un texto anterior no es el previsto, y no deja nada a medias');
  await db.exec(textosSql);
  const tras = await publicas(db);
  await db.exec(textosSql);
  assert.deepEqual(await publicas(db), tras, 'idempotencia de los textos');
  ok('textos-plataformas.sql: idempotente');
  for (const [slug, cols] of Object.entries(esperadoPublico)) for (const [col, v] of Object.entries(cols)) assert.equal(tras[slug][col], v, `${slug}.${col}`);
  for (const slug of Object.keys(tras)) {
    const { nota, etiqueta_descarte, motivo_descarte, ...resto } = tras[slug];
    const { nota: n0, etiqueta_descarte: e0, motivo_descarte: m0, ...resto0 } = publicasAntes[slug];
    assert.deepEqual(resto, resto0, `${slug}: estado y fecha de verificación sin cambios`);
    if (!esperadoPublico[slug]) assert.deepEqual([nota, etiqueta_descarte, motivo_descarte], [n0, e0, m0], `${slug}: sin cambios`);
  }
  assert.deepEqual(await rastro(db), rastroAntes, 'sin cambios de estado ni avisos');
  ok('cambian solo la nota de Reental, el motivo de Toucan y la etiqueta y el motivo de RealT; estados y fechas iguales; sin cambios de estado ni avisos');
  const d = await descartes(db);
  assert.equal(d.length, 4);
  const realt = d.find(x => x.nombre === 'RealT');
  assert.equal(realt.etiqueta_descarte, 'Liquidación anunciada');
  assert.equal(realt.fuentes.length, 4);
  assert.ok(realt.fuentes.some(f => f.url === 'https://outliermedia.org/realt-crypto-real-estate-detroit-properties/'));
  assert.doesNotMatch(realt.motivo_descarte, /la mayor/);
  assert.match(realt.motivo_descarte, /unos 700/);
  assert.deepEqual(d.filter(x => x.nombre !== 'RealT' && x.nombre !== 'Toucan Protocol'),
    descartesAntes.filter(x => x.nombre !== 'RealT' && x.nombre !== 'Toucan Protocol'));
  assert.deepEqual(d.find(x => x.nombre === 'Toucan Protocol').fuentes, descartesAntes.find(x => x.nombre === 'Toucan Protocol').fuentes);
  ok('como visitante: 4 descartadas; RealT con «Liquidación anunciada», sin «la mayor», con «unos 700» y 4 fuentes; Domoblock y Goldfinch iguales');
  const vistasTextos = await vistas(db);
  assert.equal(vistasTextos.p.find(p => p.slug === 'reental').nota, esperadoPublico.reental.nota);
  ok('la nota nueva de Reental sale en la vista pública del catálogo');
  informe.descartes = d;
} finally { await db.close(); }

// ---------------------------------------------------------------- 3 · con --con-textos-plataformas
db = await base();
try {
  const rastroAntes = await rastro(db);
  await assert.rejects(db.exec(aplicarCon.replaceAll(revision.revisionAnterior, '00000000-0000-0000-0000-000000000000')), /Publicación distinta/);
  await db.exec('rollback');
  await db.exec(aplicarCon);
  const tras = await publicas(db);
  const v = await vistas(db);
  await db.exec(aplicarCon);
  assert.deepEqual(await publicas(db), tras);
  assert.deepEqual(await vistas(db), v);
  for (const [slug, cols] of Object.entries(esperadoPublico)) for (const [col, x] of Object.entries(cols)) assert.equal(tras[slug][col], x);
  assert.ok(v.o.length === 24 && v.p.every(p => p.revision_id === revision.revisionId));
  assert.deepEqual(await rastro(db), rastroAntes);
  ok('variante --con-textos-plataformas: una sola transacción, guarda, idempotente y el mismo resultado');
} finally { await db.close(); }

assert.equal(contraste.revisionNueva, revision.revisionId);
informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', revisionId: revision.revisionId, sha256: informe.sha256AplicarYAprobar,
  sha256Textos: informe.sha256TextosPlataformas }, null, 1));
