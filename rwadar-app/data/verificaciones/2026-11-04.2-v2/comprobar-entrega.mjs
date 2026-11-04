// Ensayo local de la entrega «2026-11-04.2» (ARTEX Global Markets pasa a Descartadas) en PGlite,
// sin red, sobre la misma cadena que producción (22/10 → 2026-11-04 publicada; los cambios de
// public.plataformas de la .8 y de la 2026-11-04 ya vienen en 02_seed.sql):
//   1. qué sentencias lleva el SQL y qué tablas toca;
//   2. antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante (lectura-publica/);
//   3. con producción como se espera: la revisión nueva queda publicada con 25 plataformas y las
//      mismas 24 ofertas; ARTEX queda descartada con su motivo y su fuente; 5 descartadas;
//      idempotente; lo que leen la web (sincronizador y fichas), la app y el worker;
//   4. con producción distinta en cualquier punto, o a medias, falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-04.2-v2/comprobar-entrega.mjs [--exportar=DIR]
//
// Con --exportar guarda en DIR lo que leería un visitante por REST después de aplicar (para
// ensayar sincronizar.js, volcar-seed.js y npm test en una copia aparte). No toca el repositorio.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
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
const { sincronizar } = require('../../../sincronizar.js');
const { resumenOferta } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const manifiestoFichas = require(path.join(ROOT, 'rwadar-fichas-manifiesto.js'));
const { construirWorker } = require(path.join(ROOT, 'rwadar-acceso/compilar.cjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-04.2', SLUG = 'artex-global-markets';
const exportar = (process.argv.find(a => a.startsWith('--exportar=')) || '').slice('--exportar='.length);
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const plat = leer(path.join(DIR, 'cambios-plataformas.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const artex = plat.plataformas[SLUG], FAQ = artex.fuenteNueva;
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7', '2026-11-04'];
const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: NUEVA, sha256AplicarYAprobar: SHA, pruebas: [], casos: [] };
const ok = t => { informe.pruebas.push(t); console.log('  OK   ', t); };

// ---------------------------------------------------------------- 1 · inventario del SQL
const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type)|drop\s|create\s+(?:table|function|policy|type|view|trigger)|grant\s|revoke\s)\b/i;
assert.doesNotMatch(SQL, PROHIBIDO);
const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'plataformas_guarda', 'plataformas_comprobar', 'aprobar']);
for (const b of bloques.slice(0, 3)) assert.doesNotMatch(b[2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|execute\b)/i, `${b[1]} solo lee`);
const escrituras = [...SQL.matchAll(/^(insert into|update) ([\w.]+)/gm)].map(m => `${m[1]} ${m[2]}`);
const cuenta = Object.fromEntries([...new Set(escrituras)].map(e => [e, escrituras.filter(x => x === e).length]));
assert.deepEqual(Object.keys(cuenta).sort(), ['insert into public.fuentes', 'insert into rwadar_catalogo.alerta_fuentes', 'insert into rwadar_catalogo.alertas',
  'insert into rwadar_catalogo.fuentes', 'insert into rwadar_catalogo.ofertas', 'insert into rwadar_catalogo.plataforma_fuentes',
  'insert into rwadar_catalogo.plataformas', 'insert into rwadar_catalogo.revisiones', 'update public.plataformas']);
assert.equal(cuenta['update public.plataformas'], 1); assert.equal(cuenta['insert into public.fuentes'], 1);
assert.equal(cuenta['insert into rwadar_catalogo.ofertas'], 24); assert.equal(cuenta['insert into rwadar_catalogo.plataformas'], 25);
assert.equal(cuenta['insert into rwadar_catalogo.revisiones'], 1);
assert.match(SQL, /^update public\.plataformas set estado = 'descartada',$/m);
assert.match(SQL, /^  where slug = 'artex-global-markets' and estado = 'en_radar';$/m);
assert.ok(!SQL.includes(`'${SLUG}','ARTEX`) && !/rwadar_catalogo\.plataformas[^\n]*artex-global-markets/.test(SQL.split('do $plataformas_guarda$')[0]),
  'el lote nuevo no lleva a ARTEX');
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
ok('inventario: una transacción serializable; guarda; el lote nuevo en rwadar_catalogo (1 revisión, 25 plataformas sin ARTEX, 24 ofertas y sus fuentes); 1 update de public.plataformas (ARTEX a «descartada», solo si sigue en el radar) y 1 insert en public.fuentes (su página de preguntas frecuentes), con su guarda y su comprobación; aprobación al final; sin borrados, esquema ni permisos');

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
// Como lo devuelve PostgREST: fechas en texto y numeric como número.
const api = x => JSON.parse(JSON.stringify(x, (k, v) => v instanceof Date ? v.toISOString() : v), (k, v) =>
  ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
const DESCARTADAS = `select p.nombre, p.etiqueta_descarte, p.motivo_descarte,
    coalesce((select json_agg(json_build_object('url', f.url, 'titulo', f.titulo) order by f.url) from public.fuentes f where f.plataforma_id = p.id), '[]') as fuentes
    from public.plataformas p where p.estado = 'descartada' order by p.nombre`;
async function vistas(db) {
  await sesion(db, null, 'anon');
  // Sin «order by», como las pide sincronizar.js por REST: en el orden de la vista. La de
  // plataformas ordena por nombre; Supabase compara sin distinguir mayúsculas (en_US.UTF-8) y
  // PGlite en «C» (ARTEX antes que Archax): se reordena como en producción.
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'en'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
  const d = await filas(db, DESCARTADAS);
  const v1 = { p: (await filas(db, 'select count(*)::int c from public.catalogo_plataformas_publicas'))[0].c,
    o: (await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c };
  await sesion(db);
  return { p, o, d, v1 };
}
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
    cambios: await q('select plataforma_id, estado_anterior, estado_nuevo, titular, detalle from cambios_estado order by id'),
    avisosCorreo: await q('select usuario_id, cambio_id, enviado_el from avisos_correo order by id'),
    avisosPush: await q('select count(*)::int c from avisos_push'),
    emisiones: await q('select slug, estado from public.emisiones order by slug'),
  };
}
const sinComillas = v => v.replace(/'/g, "''");
const set = (slug, col, v) => `update public.plataformas set ${col} = '${sinComillas(v)}' where slug = '${slug}';`;
const fuente = (slug, url, titulo, fechas = '') => `insert into public.fuentes (plataforma_id,url,titulo${fechas ? ',publicada_el,consultada_el' : ''})
  select id,'${url}','${sinComillas(titulo)}'${fechas} from public.plataformas where slug='${slug}';`;
const descartar = (slug, etiqueta = 'Prueba', motivo = 'Motivo de prueba suficientemente largo para la fila.') =>
  `update public.plataformas set estado = 'descartada', categoria_slug = null, region_slug = null, actor = null, acceso = null,
     ticket = null, cadenas = null, web = null, aval = null, nota = null, etiqueta_descarte = '${sinComillas(etiqueta)}',
     motivo_descarte = '${sinComillas(motivo)}' where slug = '${slug}';`;

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
      informe.casos.push({ caso: nombre, falla: false, ...(extra ? await extra(db, antes, despues) : {}) });
    }
  } finally { await db.close(); }
}

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok('cadena de producción 22/10 → 2026-11-04 (con los cambios de public.plataformas de la .8 y de la 2026-11-04 en 02_seed.sql): la publicada es la cf79e4a4');

    // Lo que enseña PGlite antes de aplicar es lo que se leyó hoy como visitante.
    const lp = path.join(DIR, 'lectura-publica');
    const orden = l => [...l].sort((a, b) => (a.slug < b.slug ? -1 : 1));
    const sinPublicadaEl = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'publicadaEl' ? undefined : v));
    const fuentesOrdenadas = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'fuentes' && Array.isArray(v)
      ? [...v].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1) : v));
    const comparable = l => fuentesOrdenadas(sinPublicadaEl(orden(l)));
    assert.deepEqual(comparable(v0.o), comparable(leer(path.join(lp, 'ofertas-v2.json'))), 'ofertas: PGlite = producción');
    const pubP = leer(path.join(lp, 'plataformas-v2.json'));
    assert.deepEqual(v0.p.map(p => p.slug), pubP.map(p => p.slug), 'mismo orden que producción');
    assert.deepEqual(v0.o.map(o => o.slug), leer(path.join(lp, 'ofertas-v2.json')).map(o => o.slug), 'mismo orden que producción');
    for (const p of v0.p) {
      const r = pubP.find(x => x.slug === p.slug);
      // plataforma_id es el uuid de public.plataformas: 02_seed.sql no lo conserva (se genera al instalar).
      const { verificacion_local: a, plataforma_id: ia, ...restoA } = p, { verificacion_local: b, plataforma_id: ib, ...restoB } = r;
      assert.deepEqual(restoA, restoB, `${p.slug}: PGlite = producción`);
      assert.deepEqual(fuentesOrdenadas(sinPublicadaEl(a)), fuentesOrdenadas(sinPublicadaEl(b)), `${p.slug}: verificación`);
    }
    const pubD = leer(path.join(lp, 'descartadas.json'));
    assert.deepEqual(v0.d, pubD.map(d => ({ nombre: d.nombre, etiqueta_descarte: d.etiqueta_descarte, motivo_descarte: d.motivo_descarte,
      fuentes: d.fuentes.map(f => ({ url: f.url, titulo: f.titulo })).sort((a, b) => (a.url < b.url ? -1 : 1)) }))
      .sort((a, b) => (a.nombre < b.nombre ? -1 : 1)));
    const [pubA] = leer(path.join(lp, 'artex-plataforma.json'));
    const a0 = JSON.parse(f0.plataformas).find(x => x.slug === SLUG);
    for (const col of Object.keys(artex.antes)) assert.deepEqual(col === 'verificada_el' ? a0[col].slice(0, 10) : a0[col], pubA[col], `ARTEX.${col}`);
    ok('antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante: 26 plataformas, 24 ofertas, 4 descartadas y ARTEX tal cual (salvo el uuid de cada plataforma, que se genera al instalar, y «publicadaEl» de las fuentes del radar, que la base no guarda)');

    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo (un solo cambio de estado registrado)');

    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.equal(f1.retirado, f0.retirado);
    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 25 && v1.o.length === 24);
    assert.ok(!v1.p.some(p => p.slug === SLUG), 'ARTEX ya no está en el radar');
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === 25 && x.ofertas_esperadas === 24));
    assert.ok(v1.o.every(o => o.verificada_el === '2026-11-03' && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === '2026-11-03'));
    ok('publicada la revisión nueva: 25 plataformas (sin ARTEX) y 24 ofertas, fechadas el 03/11 y con 7 días');

    // Las otras 25 plataformas y las 24 ofertas, iguales salvo la revisión y la cuenta de plataformas.
    const sinRevision = x => { const { revision_id, plataformas_esperadas, ...r } = x; return r; };
    for (const p of v1.p) assert.deepEqual(sinRevision(p), sinRevision(v0.p.find(x => x.slug === p.slug)), `${p.slug}: igual`);
    for (const o of v1.o) assert.deepEqual(sinRevision(o), sinRevision(v0.o.find(x => x.slug === o.slug)), `${o.slug}: igual`);
    ok('las otras 25 plataformas y las 24 ofertas, idénticas salvo la revisión y «plataformas_esperadas» (26 → 25)');

    // public.plataformas, public.fuentes y el historial de cambios de estado.
    const antes0 = Object.fromEntries(JSON.parse(f0.plataformas).map(x => [x.slug, x]));
    const cambiadas = [];
    for (const x of JSON.parse(f1.plataformas)) for (const k of Object.keys(x)) if (JSON.stringify(x[k]) !== JSON.stringify(antes0[x.slug][k])) cambiadas.push(`${x.slug}.${k}`);
    const esperadas = Object.keys(artex.antes).filter(c => JSON.stringify(artex.antes[c]) !== JSON.stringify(artex.despues[c]));
    assert.deepEqual(cambiadas.sort(), [...esperadas, 'actualizada_el'].map(c => `${SLUG}.${c}`).sort());
    const a1 = JSON.parse(f1.plataformas).find(x => x.slug === SLUG);
    for (const [col, valor] of Object.entries(artex.despues)) assert.deepEqual(col === 'verificada_el' ? a1[col].slice(0, 10) : a1[col], valor, `ARTEX.${col}`);
    const fA = JSON.parse(f0.fuentes), fD = JSON.parse(f1.fuentes);
    assert.deepEqual(fD.filter(f => fA.some(x => x.id === f.id)), fA, 'las fuentes de antes, intactas');
    const nuevas = fD.filter(f => !fA.some(x => x.id === f.id));
    assert.deepEqual(nuevas.map(({ id, plataforma_id, ...r }) => r), [{ url: FAQ.url, titulo: FAQ.titulo, publicada_el: FAQ.publicada_el, consultada_el: FAQ.consultada_el }]);
    assert.equal(nuevas[0].plataforma_id, a1.id);
    const c0 = JSON.parse(f0.cambios), c1 = JSON.parse(f1.cambios);
    assert.deepEqual(c1.slice(0, c0.length), c0);
    assert.deepEqual(c1.slice(c0.length), [{ plataforma_id: a1.id, estado_anterior: 'en_radar', estado_nuevo: 'descartada',
      titular: 'ARTEX Global Markets sale del radar', detalle: artex.despues.motivo_descarte }]);
    assert.deepEqual([f1.avisosCorreo, f1.avisosPush], [f0.avisosCorreo, f0.avisosPush], 'nadie vigila ARTEX en el ensayo: ningún aviso');
    ok(`public.plataformas: solo cambia ARTEX (${esperadas.join(', ')}; y actualizada_el); public.fuentes: una nueva, su página de preguntas frecuentes; cambios_estado: una fila «ARTEX Global Markets sale del radar» con el motivo`);
    assert.equal(v1.d.length, 5);
    assert.deepEqual(v1.d.filter(x => x.nombre !== artex.nombre), v0.d, 'las otras 4 descartadas, iguales');
    assert.deepEqual(v1.d.find(x => x.nombre === artex.nombre), { nombre: artex.nombre, etiqueta_descarte: artex.despues.etiqueta_descarte,
      motivo_descarte: artex.despues.motivo_descarte, fuentes: [{ url: FAQ.url, titulo: FAQ.titulo }] });
    assert.equal((await filas(db, 'select count(*)::int c from public.descartadas_sin_fuente'))[0].c, 0);
    ok('5 descartadas: Domoblock, Goldfinch, RealT y Toucan iguales; ARTEX con su etiqueta, su motivo y su fuente; ninguna sin fuente');
    informe.vistasV1 = { antes: v0.v1, despues: v1.v1 };
    ok(`vistas V1 (Android 1.3.2 y anteriores): ${v0.v1.p}/${v0.v1.o} filas antes y ${v1.v1.p}/${v1.v1.o} después; el lote V1 ya estaba caducado y vacío`);

    // Lo que leen la web y la app.
    const r = validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-04', permitirAmpliacion: true });
    assert.equal(r.fecha, '2026-11-03'); assert.equal(r.manifiesto.plataformasEsperadas, 25);
    assert.throws(() => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-11', permitirAmpliacion: true }), /caducada/);
    const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
    if (typeof adaptarCatalogoV2 === 'function') {
      const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date('2026-11-04T12:00:00Z'));
      assert.equal(movil.plataformas.length, 25); assert.equal(movil.ofertas.length, 24);
    }
    ok('el lector de la web y el de la app lo aceptan con su propio manifiesto (25/24); vence el 11/11, como la 2026-11-04 (no se alarga)');
    const pinta = x => { const s = resumenOferta({ ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias,
      estadoRevision: x.estado_revision, disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug }, [], new Date('2026-11-04T12:00:00Z'));
      return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto }; };
    for (const o of v1.o) assert.deepEqual(pinta(o), pinta(v0.o.find(x => x.slug === o.slug)), `${o.slug}: la tarjeta no cambia`);
    ok('las 24 tarjetas se ven igual (mínimo, acceso desde España y salida)');

    // El sincronizador real, contra estas vistas, en una copia temporal del catálogo de la web.
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-artex-'));
    try {
      const jsPath = path.join(temporal, 'catalogo.js');
      fs.copyFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
      const leidas = [];
      const fetchFn = async url => { leidas.push(url); return { ok: true, json: async () => structuredClone(
        url.includes('catalogo_plataformas_publicas_v2') ? v1.p : url.includes('catalogo_ofertas_publicas_v2') ? v1.o : v1.d) }; };
      const log = console.log; console.log = () => {};
      try { await sincronizar({ fetchFn, jsPath, csvPath: path.join(temporal, 'rwadar.csv'), hoy: new Date('2026-11-04T12:00:00Z'),
        versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); } finally { console.log = log; }
      const snap = fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8'));
      assert.equal(snap.plataformas.length, 25); assert.equal(snap.ofertas.length, 24); assert.equal(snap.fuera.length, 5);
      assert.ok(!snap.plataformas.some(p => p.slug === SLUG));
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + 25 + 5);
      // La lista cerrada, como quedará tras aplicar (la ficha cambia de carpeta).
      const despues = [...manifiestoFichas.filter(r => r !== `plataformas/${SLUG}.html`), `fuera-del-radar/${SLUG}.html`].sort();
      assert.throws(() => fichas.construirSalidas({ catalogo: snap }), /manifiesto|Descartes|descartes/, 'sin tocar la lista cerrada no se publica');
      const salidas = fichas.construirSalidas({ catalogo: snap, paginasPermitidas: despues });
      assert.ok(!salidas.has(`plataformas/${SLUG}.html`));
      const pagina = salidas.get(`fuera-del-radar/${SLUG}.html`);
      assert.ok(pagina.includes(fichas.esc(artex.despues.motivo_descarte)) && pagina.includes(fichas.esc(artex.despues.etiqueta_descarte)) &&
        pagina.includes(`href="${FAQ.url}"`) && pagina.includes(`<link rel="canonical" href="https://rwadar.pages.dev/fuera-del-radar/${SLUG}">`));
      assert.ok(salidas.get('sitemap.xml').includes(`/fuera-del-radar/${SLUG}</loc>`) && !salidas.get('sitemap.xml').includes(`/plataformas/${SLUG}</loc>`));
      const fichasNuevas = [...salidas.keys()].filter(n => /^(ofertas|plataformas)\//.test(n));
      assert.equal(fichasNuevas.length, 24 + 25);
      // Cada ficha de oferta lleva su fila del catálogo (data-oferta), con su revisión y con
      // «plataformas_esperadas»: cambian la revisión y ese número (26 → 25), nada más.
      const cuenta25 = '&quot;plataformas_esperadas&quot;:25,', cuenta26 = '&quot;plataformas_esperadas&quot;:26,';
      const actual = n => fs.existsSync(path.join(ROOT, 'rwadar-site', n)) ? fs.readFileSync(path.join(ROOT, 'rwadar-site', n), 'utf8') : null;
      const comoAntes = t => t.replaceAll(cuenta25, cuenta26).replaceAll(NUEVA, PREVIA);
      const distintas = fichasNuevas.filter(n => actual(n) !== comoAntes(salidas.get(n)));
      assert.deepEqual(distintas, [], 'las fichas de las 24 ofertas y de las otras 25 plataformas no cambian');
      assert.ok(fichasNuevas.filter(n => n.startsWith('ofertas/')).every(n => salidas.get(n).split(cuenta25).length === 2 && !salidas.get(n).includes(cuenta26)));
      assert.ok(fichasNuevas.filter(n => n.startsWith('plataformas/')).every(n => actual(n) === salidas.get(n)));
      ok(`sincronizador real con estas vistas: 25 plataformas, 24 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas); con la lista cerrada actualizada sale /fuera-del-radar/${SLUG} con el motivo y la fuente, sin /plataformas/${SLUG}; las fichas de las otras 25 plataformas, byte a byte iguales, y las de las 24 ofertas solo cambian la revisión y «plataformas_esperadas» (26 → 25) en sus datos`);
      informe.lecturasDelSincronizador = leidas.map(u => u.replace(/^https:\/\/[^/]+/, ''));

      // El worker con esa lista: la dirección vieja lleva a la nueva, sin pasar por ASSETS.
      const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(path.join(ROOT, 'rwadar-acceso'), { fichas: despues })).toString('base64'))).default;
      let pedidas = 0;
      const env = { ASSETS: { fetch: async () => { pedidas++; return new Response('contenido'); } } };
      for (const ruta of [`/plataformas/${SLUG}`, `/plataformas/${SLUG}.html`, `/plataformas/${SLUG}/`]) {
        const res = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), env, { waitUntil() {} });
        assert.equal(res.status, 301, ruta); assert.equal(res.headers.get('location'), `/fuera-del-radar/${SLUG}`, ruta);
        assert.equal(res.headers.get('cache-control'), 'no-store', ruta);
      }
      assert.equal(pedidas, 0);
      assert.equal((await worker.fetch(new Request(`https://rwadar.pages.dev/fuera-del-radar/${SLUG}`), env, { waitUntil() {} })).status, 200);
      ok(`worker con la lista nueva: /plataformas/${SLUG} (con .html o barra final) → 301 a /fuera-del-radar/${SLUG}, no-store, sin servir la copia de conservación`);
    } finally { fs.rmSync(temporal, { recursive: true, force: true }); }

    if (exportar) {
      // Lo que leería un visitante por REST después de aplicar, con las rutas que piden
      // sincronizar.js y volcar-seed.js (para ensayarlos en una copia aparte).
      fs.mkdirSync(exportar, { recursive: true });
      await sesion(db, null, 'anon');
      const escribe = (nombre, datos) => fs.writeFileSync(path.join(exportar, nombre), JSON.stringify(datos));
      escribe('catalogo_plataformas_publicas_v2.json', v1.p);
      escribe('catalogo_ofertas_publicas_v2.json', v1.o);
      escribe('descartadas-sincronizar.json', v1.d);
      escribe('categorias.json', await filas(db, 'select * from public.categorias order by orden'));
      escribe('regiones.json', await filas(db, 'select * from public.regiones order by slug'));
      escribe('radar_publico.json', api(await filas(db, 'select * from public.radar_publico')).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en')));
      escribe('descartadas-volcar.json', api(await filas(db, `select p.slug, p.nombre, p.etiqueta_descarte, p.motivo_descarte, p.verificada_el,
        coalesce((select json_agg(json_build_object('url', f.url, 'titulo', f.titulo, 'publicada_el', f.publicada_el, 'consultada_el', f.consultada_el) order by f.url)
          from public.fuentes f where f.plataforma_id = p.id), '[]') as fuentes
        from public.plataformas p where p.estado = 'descartada' order by p.slug`)));
      escribe('catalogo_publicacion.json', await filas(db, 'select retirado, motivo from public.catalogo_publicacion'));
      await sesion(db);
      ok(`exportado a ${exportar} lo que leería un visitante después de aplicar`);
    }
  } finally { await db.close(); }
}

// Quien vigila ARTEX con los avisos activados recibe un aviso en cola (no se envía nada: el
// correo y el push están en pausa y PGlite no tiene red).
await caso('alguien vigila ARTEX', `
  insert into auth.users (id, email) values ('11111111-1111-4111-8111-111111111111', 'vigila@example.test');
  insert into perfiles (id) values ('11111111-1111-4111-8111-111111111111') on conflict do nothing;
  insert into vigilancia (usuario_id, plataforma_id) select '11111111-1111-4111-8111-111111111111', id from plataformas where slug = '${SLUG}';`,
false, async (db, antes, despues) => {
  const a0 = JSON.parse(antes.avisosCorreo), a1 = JSON.parse(despues.avisosCorreo);
  assert.equal(a1.length, a0.length + 1); assert.equal(a1.at(-1).enviado_el, null);
  ok('si alguien vigila ARTEX con los avisos por correo activados, queda un aviso en cola, sin enviar');
  return { avisosEnCola: a1.length - a0.length };
});

// ---------------------------------------------------------------- 4 · producción distinta
const otra = '344a86aa-2c53-d2f0-fed4-5fdaadda33ad';
await caso('la publicada no es la cf79e4a4', `update rwadar_catalogo.publicacion_v2 set revision_id = '${otra}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('otra plataforma del radar sin blockchain', set('addx', 'cadenas', 'No usa blockchain'), /otra plataforma del radar sin blockchain/);
await caso('ARTEX con otros datos («Blockchains» distinto)', set(SLUG, 'cadenas', 'Ethereum'), /ni antes ni después/);
await caso('ARTEX con otro texto («Qué hace» distinto)', set(SLUG, 'nota', 'Otro texto de prueba para la ficha de ARTEX.'), /ni antes ni después/);
await caso('ARTEX con una fuente propia', fuente(SLUG, 'https://example.org/artex', 'Otra fuente'), /ni antes ni después/);
await caso('la página de ARTEX ya colgada de otra plataforma (Goldfinch)', fuente('goldfinch', FAQ.url, FAQ.titulo), /otra plataforma/);
await caso('ARTEX con una emisión', `insert into public.emisiones (plataforma_id, slug, titulo, categoria_slug, ticket_minimo, url, estado, cierra_el)
  select id, 'artex-prueba', 'Emisión de prueba de ARTEX', 'materias-primas', 100, 'https://example.org/emision', 'abierta', current_date + 30
  from public.plataformas where slug = '${SLUG}';`, /tiene emisiones/);
await caso('una quinta descartada que no es ARTEX', descartar('tzero'), /ni antes ni después|publicable|incompleto/);
await caso('a medias: ARTEX ya descartada y el lote sin aplicar',
  `${descartar(SLUG, artex.despues.etiqueta_descarte, artex.despues.motivo_descarte)}\n${fuente(SLUG, FAQ.url, FAQ.titulo, `,null,'${FAQ.consultada_el}'::date`)}`,
  /ni antes ni después/);
await caso('a medias: la página de ARTEX puesta y ARTEX aún en el radar', fuente(SLUG, FAQ.url, FAQ.titulo, `,null,'${FAQ.consultada_el}'::date`), /ni antes ni después/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length }, null, 1));
