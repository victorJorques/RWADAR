// Ensayo local de la entrega «2026-11-26.2» en PGlite, sin red, sobre la misma cadena que producción: la
// instalación con el 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql) y los lotes del 22/10 a la
// 2026-11-26 (cada uno con su tope evaluado en su día y la migración 38 tras el 2026-11-20), que deja publicada la
// 2026-11-26.
//   1. qué sentencias lleva el SQL y qué tablas toca (solo rwadar_catalogo y la aprobación);
//   2. antes de aplicar, PGlite enseña la 2026-11-26 local (y, si existe lectura-publica/, lo leído como visitante);
//   3. con producción como se espera: la revisión nueva queda publicada con 25 plataformas y 21 ofertas (8/13/0);
//      las 21 que se quedan, idénticas a la 2026-11-26; Hausera, fuera; idempotente; el lector de la web y el de la
//      app aceptan 0 en camino; lo que leen la web (sincronizador y fichas, con la lista cerrada sin Hausera) y el
//      worker (404 para la ficha retirada);
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra identidad, una
//      plataforma que falta) o aplicado después del 03/12, falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-26.2-v2/comprobar-entrega.mjs [--exportar=DIR]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const APP = path.join(ROOT, 'rwadar-app');
process.chdir(APP);
const require = createRequire(import.meta.url);
const { baseCatalogoHistorico, filas, sesion } = await import('../../../pruebas-soporte.mjs');
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2, MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const { sincronizar } = require('../../../sincronizar.js');
const { resumenOferta } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const manifiestoFichas = require(path.join(ROOT, 'rwadar-fichas-manifiesto.js'));
const { construirWorker } = require(path.join(ROOT, 'rwadar-acceso/compilar.cjs'));
const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-26.2', FECHA = '2026-11-26', DESDE = '2026-11-26', ULTIMO = '2026-12-03';
const RETIRADAS = ['hausera-proximas-ofertas'];
const exportar = (process.argv.find(a => a.startsWith('--exportar=')) || '').slice('--exportar='.length);
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA]);
const D26 = leer(path.join(APP, `data/verificaciones/${DESDE}-v2/decisiones.json`));
const LOTES = [...D26.cadena, DESDE];
const MIGRACIONES_TRAS_LOTE = { '2026-11-20': ['db/38_textos_radar.sql'] };
const base26 = path.join(APP, `data/verificaciones/${DESDE}-v2`);
const esc26 = leer(path.join(base26, 'escaparate-publicacion.json')), doc26 = leer(path.join(base26, 'documentacion-ofertas.json'));
const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: NUEVA, sha256AplicarYAprobar: SHA, pruebas: [], casos: [] };
const ok = t => { informe.pruebas.push(t); console.log('  OK   ', t); };

// ---------------------------------------------------------------- 1 · inventario del SQL
const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type|policy|function|default)|drop\s|create\s+(?:or\s+replace\s+)?(?:table|function|policy|type|view|trigger|role|schema|extension|index)|grant\s|revoke\s|security\s+definer|set\s+role|auth\.)\b/i;
assert.doesNotMatch(SQL, PROHIBIDO);
const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'aprobar']);
assert.doesNotMatch(bloques[0][2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|execute\b)/i, 'la guarda solo lee');
assert.equal([...bloques[1][2].matchAll(/\bupdate\s+([\w.]+)/gi)].map(m => m[1]).join(), 'rwadar_catalogo.revisiones', 'la aprobación solo cambia el estado de la revisión');
assert.doesNotMatch(bloques[1][2], /\b(?:insert\s+into|delete\s+from|execute\b)/i);
const sinBloques = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '');
const sentencias = sinBloques.split('\n').filter(l => l.trim() && !l.startsWith('--'));
assert.deepEqual(sentencias.filter(l => !/^insert into rwadar_catalogo\.\w+ \(/.test(l)), ['begin isolation level serializable;', 'commit;'],
  'fuera de la guarda y la aprobación solo hay inserts en rwadar_catalogo');
const escrituras = sentencias.map(l => l.match(/^insert into ([\w.]+)/)?.[1]).filter(Boolean);
const cuenta = Object.fromEntries([...new Set(escrituras)].map(e => [e, escrituras.filter(x => x === e).length]));
assert.deepEqual(Object.keys(cuenta).sort(), ['rwadar_catalogo.alerta_fuentes', 'rwadar_catalogo.alertas', 'rwadar_catalogo.fuentes',
  'rwadar_catalogo.ofertas', 'rwadar_catalogo.plataforma_fuentes', 'rwadar_catalogo.plataformas', 'rwadar_catalogo.revisiones']);
assert.equal(cuenta['rwadar_catalogo.revisiones'], 1); assert.equal(cuenta['rwadar_catalogo.plataformas'], 25);
assert.equal(cuenta['rwadar_catalogo.ofertas'], 21); assert.equal(cuenta['rwadar_catalogo.fuentes'], 69);
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => / on conflict \((?:id|revision_id,id|revision_id,plataforma_id|revision_id,slug)\) do nothing;$| on conflict do nothing;$/.test(l)), 'todos los inserts son idempotentes');
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts son de la revisión nueva');
for (const s of RETIRADAS) assert.ok(!sentencias.some(l => l.startsWith('insert into rwadar_catalogo.ofertas') && l.includes(`'${s}'`)), `${s}: no entra en el lote`);
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
assert.ok(bloques[0][2].includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
const TOPE = `  if current_date > date '${revision.venceTrasEl}' then\n    raise exception 'Lote caducado`;
assert.equal(revision.venceTrasEl, ULTIMO);
assert.equal(bloques[0][2].split(TOPE).length, 2, 'la guarda tiene la fecha tope del 03/12');
informe.inventario = cuenta;
ok(`inventario: una transacción serializable; guarda (publicada ${PREVIA.slice(0, 8)} con su huella ${HASH_PREVIA.slice(0, 12)}…, catálogo no retirado, fecha del 26/11 al 03/12, destino sin otra identidad); inserts idempotentes en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}), sin Hausera; nada en public.*; aprobación al final; sin DDL, borrados, permisos, Auth ni funciones`);

// ---------------------------------------------------------------- base como producción
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
const DESCARTADAS = `select p.nombre, p.etiqueta_descarte, p.motivo_descarte,
    coalesce((select json_agg(json_build_object('url', f.url, 'titulo', f.titulo) order by f.url) from public.fuentes f where f.plataforma_id = p.id), '[]') as fuentes
    from public.plataformas p where p.estado = 'descartada' order by p.nombre`;
async function vistas(db) {
  await sesion(db, null, 'anon');
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2')).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
  const d = await filas(db, DESCARTADAS);
  const t = await filas(db, 'select slug, nombre, estado, cadenas from public.plataformas order by slug');
  await sesion(db);
  return { p, o, d, t };
}
async function foto(db) {
  await sesion(db);
  const q = async s => JSON.stringify(await filas(db, s));
  return {
    publicacion: await q('select revision_id from rwadar_catalogo.publicacion_v2'),
    retirado: await q('select retirado from public.catalogo_publicacion'),
    revisiones: await q('select id, estado, contenido_sha256, aprobada_el from rwadar_catalogo.revisiones order by id'),
    catalogo: await q(`select (select count(*)::int from rwadar_catalogo.plataformas) p, (select count(*)::int from rwadar_catalogo.ofertas) o,
      (select count(*)::int from rwadar_catalogo.fuentes) f, (select count(*)::int from rwadar_catalogo.alertas) a`),
    plataformas: await q('select * from public.plataformas order by slug'),
    fuentes: await q('select id, plataforma_id, url, titulo, publicada_el::text, consultada_el::text from public.fuentes order by plataforma_id, url'),
    cambios: await q('select plataforma_id, estado_anterior, estado_nuevo, titular, detalle from cambios_estado order by id'),
    avisosCorreo: await q('select usuario_id, cambio_id, enviado_el from avisos_correo order by id'),
    avisosPush: await q('select count(*)::int c from avisos_push'),
    emisiones: await q('select slug, estado from public.emisiones order by slug'),
  };
}
async function caso(nombre, preparar, esperaFallo, extra, sql = SQL) {
  const db = await base();
  try {
    if (preparar) { await sesion(db); await db.exec(preparar); }
    const antes = await foto(db);
    let error = null;
    try { await db.exec(sql); } catch (e) { error = e.message; try { await db.exec('rollback'); } catch {} }
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
const pinta = (x, hoy) => {
  const s = resumenOferta({ ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias, estadoRevision: x.estado_revision,
    disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug }, [], new Date(`${hoy}T12:00:00Z`));
  return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto,
    estado: s.estado.texto, vencida: s.vencida };
};
const listaDespues = manifiestoFichas.filter(r => !RETIRADAS.some(s => r === `ofertas/${s}.html`));

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok(`cadena de producción (seed antes de ARTEX + ${LOTES.length} lotes, del ${LOTES[0]} a la ${DESDE}): la publicada es la ${PREVIA.slice(0, 8)}`);
    // Antes de aplicar: la 2026-11-26 local (y lo leído como visitante, si ya se leyó).
    assert.equal(v0.o.length, 22); assert.equal(v0.p.length, 25);
    for (const o of v0.o) {
      assert.deepEqual(o.documentacion, doc26[o.slug], `${o.slug}: documentación = 2026-11-26 local`);
      const b = esc26.ofertas.find(x => x.slug === o.slug);
      assert.deepEqual([o.coleccion, o.verificada_el, o.vigencia_dias, o.estado_revision], [b.coleccion, b.verificadaEl, b.vigenciaDias, b.estadoRevision], o.slug);
    }
    const lp = path.join(DIR, 'lectura-publica');
    let conLectura = false;
    if (fs.existsSync(lp)) {
      const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json')), pubT = leer(path.join(lp, 'plataformas-todas.json'));
      const orden = l => [...l].sort((a, b) => (a.slug < b.slug ? -1 : 1));
      const sinPublicadaEl = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'publicadaEl' ? undefined : v));
      const fuentesOrdenadas = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'fuentes' && Array.isArray(v)
        ? [...v].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1) : v));
      const comparable = l => fuentesOrdenadas(sinPublicadaEl(orden(l)));
      assert.deepEqual(comparable(v0.o), comparable(pubO), 'ofertas: PGlite = producción');
      for (const p of v0.p) {
        const r = pubP.find(x => x.slug === p.slug);
        const { verificacion_local: a, plataforma_id: ia, ...restoA } = p, { verificacion_local: b, plataforma_id: ib, ...restoB } = r;
        assert.deepEqual(restoA, restoB, `${p.slug}: PGlite = producción`);
        assert.deepEqual(fuentesOrdenadas(sinPublicadaEl(a)), fuentesOrdenadas(sinPublicadaEl(b)), `${p.slug}: verificación`);
      }
      assert.deepEqual(v0.t, [...pubT].sort((a, b) => (a.slug < b.slug ? -1 : 1)), 'public.plataformas = producción');
      conLectura = true;
    }
    ok(`antes de aplicar, PGlite enseña la ${DESDE} local (25 plataformas, 22 ofertas 8/13/1, documentación idéntica)` +
      (conLectura ? ' y lo leído como visitante en lectura-publica/' : ' (lectura-publica/ pendiente: se lee tras aplicar la 2026-11-26)'));
    informe.lecturaPublica = conLectura;

    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo');

    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.equal(f1.retirado, f0.retirado);
    const revs0 = JSON.parse(f0.revisiones), revs1 = JSON.parse(f1.revisiones);
    assert.deepEqual(revs1.filter(r => r.id !== NUEVA), revs0, 'las revisiones anteriores, intactas (historial)');
    assert.equal(revs1.find(r => r.id === NUEVA).estado, 'aprobada');
    for (const k of ['plataformas', 'fuentes', 'cambios', 'avisosCorreo', 'avisosPush', 'emisiones']) assert.equal(f1[k], f0[k], `public: ${k} intacto`);
    ok('public.plataformas, public.fuentes, cambios de estado, avisos y emisiones, intactos; las revisiones anteriores se conservan y la nueva queda aprobada');

    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 25 && v1.o.length === 21);
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === 25 && x.ofertas_esperadas === 21 &&
      isDeepStrictEqual(x.colecciones_esperadas, { principales: 8, secundario: 13, en_camino: 0 })));
    const col = Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length]));
    assert.deepEqual(col, { principales: 8, secundario: 13, en_camino: 0 });
    assert.ok(RETIRADAS.every(s => !v1.o.some(o => o.slug === s)), 'Hausera, fuera');
    assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === FECHA));
    assert.deepEqual(v1.o.map(o => o.slug), v0.o.map(o => o.slug).filter(s => !RETIRADAS.includes(s)), 'las 21, en el mismo orden');
    const sinLote = x => { const { revision_id, ofertas_esperadas, colecciones_esperadas, ...r } = x; return r; };
    for (const o of v1.o) assert.deepEqual(sinLote(o), sinLote(v0.o.find(x => x.slug === o.slug)), `${o.slug}: igual que en la ${DESDE}`);
    for (const p of v1.p) assert.deepEqual(sinLote(p), sinLote(v0.p.find(x => x.slug === p.slug)), `${p.slug}: igual que en la ${DESDE}`);
    assert.deepEqual(v1.d, v0.d, 'las 5 descartadas, iguales');
    ok(`publicada la revisión nueva: 25 plataformas y 21 ofertas (8 principales, 13 de reventa y 0 en camino); Hausera, fuera; las 21 que se quedan y las 25 plataformas, idénticas a la ${DESDE} (mismo orden, cifras, avisos, documentación, verificadas el 26/11 con 7 días) salvo la revisión y el manifiesto del lote (22 → 21, en camino 1 → 0); las 5 descartadas, iguales`);

    const lector = hoy => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy, permitirAmpliacion: true });
    const r = lector(FECHA);
    assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.ofertasEsperadas, 21);
    assert.deepEqual(r.manifiesto.coleccionesEsperadas, { principales: 8, secundario: 13, en_camino: 0 });
    lector(ULTIMO);
    assert.throws(() => lector('2026-12-04'), /caducad/);
    assert.ok(v1.o.every(o => !pinta(o, ULTIMO).vencida && pinta(o, '2026-12-04').vencida), 'las 21 tarjetas valen hasta el 03/12');
    const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date(`${FECHA}T12:00:00Z`));
    assert.equal(movil.plataformas.length, 25); assert.equal(movil.ofertas.length, 21);
    assert.equal(movil.ofertas.filter(o => o.coleccion === 'en_camino').length, 0);
    for (const o of v1.o) assert.deepEqual(pinta(o, FECHA), pinta(v0.o.find(x => x.slug === o.slug), FECHA), `${o.slug}: la tarjeta no cambia`);
    ok('lector de la web (validarLotePublicoV2) y de la app (adaptarCatalogoV2): aceptan 25/21 con 0 en camino; vale el 26/11 y el 03/12 y caduca el 04/12; las 21 tarjetas se ven igual que con la 2026-11-26');

    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-1126-2-'));
    try {
      const jsPath = path.join(temporal, 'catalogo.js');
      fs.copyFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
      const fetchFn = async url => ({ ok: true, json: async () => structuredClone(
        url.includes('catalogo_plataformas_publicas_v2') ? v1.p : url.includes('catalogo_ofertas_publicas_v2') ? v1.o : v1.d) });
      const log = console.log; console.log = () => {};
      try { await sincronizar({ fetchFn, jsPath, csvPath: path.join(temporal, 'rwadar.csv'), hoy: new Date(`${FECHA}T12:00:00Z`),
        versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); } finally { console.log = log; }
      const snap = fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8'));
      assert.equal(snap.plataformas.length, 25); assert.equal(snap.ofertas.length, 21); assert.equal(snap.fuera.length, 5);
      assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
      assert.ok(RETIRADAS.every(s => !snap.ofertas.some(o => o.slug === s)));
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + 25 + 5);
      const enLista = manifiestoFichas.some(r => r === `ofertas/${RETIRADAS[0]}.html`);
      if (enLista) assert.throws(() => fichas.construirSalidas({ catalogo: snap }), /manifiesto cerrado/i, 'sin quitar Hausera de la lista cerrada no se publica');
      const salidas = fichas.construirSalidas({ catalogo: snap, paginasPermitidas: listaDespues });
      const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
      assert.deepEqual(paginas.sort(), listaDespues.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort());
      for (const s of RETIRADAS) {
        assert.ok(!salidas.has(`ofertas/${s}.html`), `${s}: sin página`);
        assert.ok(![...salidas.values()].some(t => t.includes(`/ofertas/${s}"`) || t.includes(`/ofertas/${s}<`)), `${s}: nadie la enlaza`);
        assert.ok(!salidas.get('sitemap.xml').includes(`/ofertas/${s}<`), 'sitemap sin Hausera');
      }
      ok(`sincronizador real con estas vistas: 25 plataformas, 21 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas); ${enLista ? 'sin quitar Hausera de la lista cerrada las fichas no se generan; ' : ''}con la lista nueva salen ${paginas.length} páginas, ninguna de Hausera (ni en el sitemap ni enlazada)`);

      const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(path.join(ROOT, 'rwadar-acceso'), { fichas: listaDespues })).toString('base64'))).default;
      for (const s of RETIRADAS) for (const ruta of [`/ofertas/${s}`, `/ofertas/${s}.html`, `/ofertas/${s}/`]) {
        const pedidas = [];
        const env = { ASSETS: { fetch: async req => { pedidas.push(new URL(req.url ?? req).pathname); return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200 }); } } };
        const res = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), env, { waitUntil() {} });
        assert.equal(res.status, 404, ruta); assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', ruta);
        assert.equal(res.headers.get('cache-control'), 'no-store', ruta); assert.deepEqual(pedidas, ['/404'], ruta);
      }
      const viva = await worker.fetch(new Request('https://rwadar.pages.dev/ofertas/spiko-letras-del-tesoro-euro'),
        { ASSETS: { fetch: async () => new Response('contenido') } }, { waitUntil() {} });
      assert.equal(viva.status, 200);
      ok('worker con la lista nueva: /ofertas/hausera-proximas-ofertas (también con .html o barra final) da el 404 del worker (noindex, nofollow; no-store) sin pedir su copia de conservación; las demás fichas se sirven');
    } finally { fs.rmSync(temporal, { recursive: true, force: true }); }

    if (exportar) {
      fs.mkdirSync(exportar, { recursive: true });
      await sesion(db, null, 'anon');
      const escribe = (nombre, datos) => fs.writeFileSync(path.join(exportar, nombre), JSON.stringify(datos));
      escribe('catalogo_plataformas_publicas_v2.json', v1.p);
      escribe('catalogo_ofertas_publicas_v2.json', v1.o);
      escribe('descartadas-sincronizar.json', await filas(db, DESCARTADAS.replace(' order by f.url', '')));
      escribe('catalogo_publicacion.json', await filas(db, 'select retirado, motivo from public.catalogo_publicacion'));
      await sesion(db);
      ok(`exportado a ${exportar} lo que leería un visitante después de aplicar`);
    }
  } finally { await db.close(); }
}

await caso('la revisión nueva ya estaba importada como borrador', fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), false,
  async (db, antes, despues) => {
    assert.equal(JSON.parse(antes.publicacion)[0].revision_id, PREVIA);
    assert.equal(JSON.parse(despues.publicacion)[0].revision_id, NUEVA);
    assert.equal(despues.catalogo, antes.catalogo, 'no duplica filas');
    ok('si la revisión nueva ya estaba importada como borrador, el aplicador la aprueba y la publica sin duplicar filas');
    return { publicada: NUEVA };
  });

// ---------------------------------------------------------------- 4 · producción distinta
await caso('la publicada no es la 2026-11-26 (es la 2026-11-21, fe0cfaa8)', `update rwadar_catalogo.publicacion_v2 set revision_id = 'fe0cfaa8-9682-b729-69e2-9bb4f8587ce9';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('la revisión destino ya existe con otra huella',
  `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', 25, 21, '{"principales":8,"secundario":13,"en_camino":0}'); set session_replication_role = origin;`,
  /otra identidad/);
{
  const caducado = SQL.replace(TOPE, TOPE.replace(`'${revision.venceTrasEl}'`, "'2026-11-25'"));
  assert.notEqual(caducado, SQL);
  await caso('aplicada después del último día vigente (lote caducado)', null, /Lote caducado/, null, caducado);
}
await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
  `set session_replication_role = replica; update public.plataformas set slug = 'addx-prueba' where slug = 'addx'; set session_replication_role = origin;`,
  /incompleto/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length, lecturaPublica: informe.lecturaPublica }, null, 1));
