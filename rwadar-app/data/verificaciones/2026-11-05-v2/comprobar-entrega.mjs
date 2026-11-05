// Ensayo local de la entrega «2026-11-05» en PGlite, sin red, sobre la misma cadena que producción:
// la instalación con el 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql) y los lotes
// del 22/10 al 2026-11-04.2, que deja publicada la 723968ce y a ARTEX en Descartadas.
//   1. qué sentencias lleva el SQL y qué tablas toca (solo rwadar_catalogo);
//   2. antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante (lectura-publica/);
//   3. con producción como se espera: la revisión nueva queda publicada con las mismas 25 plataformas
//      y 24 ofertas (8/13/3), fechadas el 05/11 y con 7 días (vale el 12/11, caduca el 13/11);
//      idempotente; public.plataformas, public.fuentes y el historial, intactos; las cifras de Spiko;
//      qué verá el inversor en cada tarjeta (mínimo, España y salida, con resumenOferta); lo que leen
//      la web (sincronizador y fichas) y la app;
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra
//      identidad o una plataforma que falta) o aplicado después del 12/11 (lote caducado), falla y no
//      deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-05-v2/comprobar-entrega.mjs [--exportar=DIR]
//
// Con --exportar guarda en DIR lo que leería un visitante por REST después de aplicar (para ensayar
// sincronizar.js, volcar-seed.js y npm test en una copia aparte). No toca el repositorio salvo
// pruebas-locales.json.
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
const { baseCatalogoHistorico, filas, sesion } = await import('../../../pruebas-soporte.mjs');
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const { sincronizar } = require('../../../sincronizar.js');
const { resumenOferta, idiomaCita } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const manifiestoFichas = require(path.join(ROOT, 'rwadar-fichas-manifiesto.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-05', FECHA = '2026-11-05';
const exportar = (process.argv.find(a => a.startsWith('--exportar=')) || '').slice('--exportar='.length);
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const escaparate = leer(path.join(DIR, 'escaparate-publicacion.json'));
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7', '2026-11-04', '2026-11-04.2'];
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
assert.equal(cuenta['rwadar_catalogo.ofertas'], 24); assert.equal(cuenta['rwadar_catalogo.fuentes'], 67);
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.endsWith(' on conflict (id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,id) do nothing;') || l.endsWith(' on conflict (revision_id,plataforma_id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,slug) do nothing;') || l.endsWith(' on conflict do nothing;')), 'todos los inserts son idempotentes');
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts son de la revisión nueva');
assert.doesNotMatch(SQL, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'nada escribe en public.*');
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
assert.ok(SQL.includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
// Fecha tope (revisión independiente de la entrega, R7): aplicado después del último día vigente, falla.
const TOPE = `  if current_date > date '${revision.venceTrasEl}' then\n    raise exception 'Lote caducado`;
assert.equal(revision.venceTrasEl, '2026-11-12');
assert.equal(bloques[0][2].split(TOPE).length, 2, 'la guarda tiene la fecha tope del 12/11');
informe.inventario = cuenta;
ok(`inventario: una transacción serializable; guarda (publicada 723968ce con su huella, catálogo no retirado, fecha no anterior al 05/11 ni posterior al 12/11, destino sin otra identidad); solo inserts en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}), todos idempotentes; aprobación al final; sin DDL, borrados, permisos, Auth ni funciones; nada en public.*`);

// ---------------------------------------------------------------- base como producción
async function base() {
  const db = await baseCatalogoHistorico();
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
  // Sin «order by», como las pide sincronizar.js por REST. Supabase ordena los nombres sin distinguir
  // mayúsculas (en_US.UTF-8) y PGlite en «C»: se reordena como en producción.
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'en'));
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

// Lo que enseña la tarjeta (la misma función que la web y la app).
const pinta = (x, hoy) => {
  const s = resumenOferta({ ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias, estadoRevision: x.estado_revision,
    disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug }, [], new Date(`${hoy}T12:00:00Z`));
  return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto,
    estado: s.estado.texto, vencida: s.vencida };
};

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok(`cadena de producción (seed del 04/11 antes de ARTEX + ${LOTES.length} lotes, del 22/10 a la 2026-11-04.2): la publicada es la 723968ce y ARTEX está en Descartadas`);

    // Lo que enseña PGlite antes de aplicar es lo que se leyó hoy como visitante (07:55:58–07:56:01 UTC).
    const lp = path.join(DIR, 'lectura-publica');
    const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json')), pubT = leer(path.join(lp, 'plataformas-todas.json'));
    const orden = l => [...l].sort((a, b) => (a.slug < b.slug ? -1 : 1));
    const sinPublicadaEl = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'publicadaEl' ? undefined : v));
    const fuentesOrdenadas = x => JSON.parse(JSON.stringify(x), (k, v) => (k === 'fuentes' && Array.isArray(v)
      ? [...v].sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1) : v));
    const comparable = l => fuentesOrdenadas(sinPublicadaEl(orden(l)));
    assert.deepEqual(comparable(v0.o), comparable(pubO), 'ofertas: PGlite = producción');
    assert.deepEqual(v0.p.map(p => p.slug), pubP.map(p => p.slug), 'mismo orden que producción');
    assert.deepEqual(v0.o.map(o => o.slug), pubO.map(o => o.slug), 'mismo orden que producción');
    for (const p of v0.p) {
      const r = pubP.find(x => x.slug === p.slug);
      // plataforma_id es el uuid de public.plataformas: el seed no lo conserva (se genera al instalar).
      const { verificacion_local: a, plataforma_id: ia, ...restoA } = p, { verificacion_local: b, plataforma_id: ib, ...restoB } = r;
      assert.deepEqual(restoA, restoB, `${p.slug}: PGlite = producción`);
      assert.deepEqual(fuentesOrdenadas(sinPublicadaEl(a)), fuentesOrdenadas(sinPublicadaEl(b)), `${p.slug}: verificación`);
    }
    assert.deepEqual(v0.t, [...pubT].sort((a, b) => (a.slug < b.slug ? -1 : 1)), 'public.plataformas (slug, nombre, estado, blockchains) = producción');
    ok('antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante: 25 plataformas, 24 ofertas y las 30 filas de public.plataformas (25 en el radar y 5 descartadas); tolerancias del 04/11: el uuid de cada plataforma (se genera al instalar), «publicadaEl» de las fuentes del radar (la base no la guarda) y el orden de las fuentes de cada campo');

    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo');

    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.equal(f1.retirado, f0.retirado);
    for (const k of ['plataformas', 'fuentes', 'cambios', 'avisosCorreo', 'avisosPush', 'emisiones']) assert.equal(f1[k], f0[k], `public: ${k} intacto`);
    const revs0 = JSON.parse(f0.revisiones), revs1 = JSON.parse(f1.revisiones);
    assert.deepEqual(revs1.filter(r => r.id !== NUEVA), revs0, 'las revisiones anteriores, intactas (historial)');
    assert.equal(revs1.find(r => r.id === NUEVA).estado, 'aprobada');
    ok('public.plataformas, public.fuentes, cambios de estado, avisos y emisiones, intactos; las revisiones anteriores se conservan y la nueva queda aprobada');

    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 25 && v1.o.length === 24);
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === 25 && x.ofertas_esperadas === 24));
    assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === FECHA));
    assert.deepEqual(v1.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]), v0.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]),
      'mismas 24 fichas, en el mismo orden, colecciones, plataformas y estados');
    assert.deepEqual(v1.p.map(p => p.slug), v0.p.map(p => p.slug), 'mismas 25 plataformas');
    const col = Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length]));
    assert.deepEqual(col, { principales: 8, secundario: 13, en_camino: 3 });
    assert.deepEqual(v1.d, v0.d, 'las 5 descartadas, iguales');
    ok('publicada la revisión nueva: las mismas 25 plataformas y 24 fichas (8/13/3, mismos estados de revisión), fechadas el 05/11 con 7 días; las 5 descartadas, iguales');

    // Plataformas: solo cambian la revisión, la fecha del lote y la verificación (fechas de consulta y Pax Gold).
    for (const p of v1.p) {
      const a = v0.p.find(x => x.slug === p.slug);
      const sinFechas = x => { const { revision_id, verificado_lote_el, verificacion_local, ...r } = x; return r; };
      assert.deepEqual(sinFechas(p), sinFechas(a), `${p.slug}: columnas de public.plataformas iguales`);
      const vl = JSON.stringify(p.verificacion_local);
      if (p.slug === 'pax-gold') { assert.ok(vl.includes('https://www.paxg.com/') && !vl.includes('paxos.com/paxgold')); assert.equal(p.web, 'https://paxos.com/paxgold'); }
    }
    ok('plataformas: iguales salvo la revisión, la fecha (05/11) y la verificación; Pax Gold cita https://www.paxg.com/ en su verificación, y su columna «web» de public.plataformas sigue en paxos.com/paxgold (hoy no se toca)');

    // Cifras de Spiko (rentabilidad con su fecha y métrica).
    const spiko = { 'spiko-letras-del-tesoro-euro': ['2,39 %', 'Rentabilidad publicada · 31 días · 04/11/2026'],
      'spiko-letras-del-tesoro-dolar': ['3,99 %', 'Rentabilidad publicada · 31 días · 04/11/2026 · en USD'],
      'spiko-smart-cash-euro': ['2,84 %', 'Rentabilidad publicada · neta y variable · 04/11/2026'] };
    informe.cifrasSpiko = {};
    for (const [slug, [pct, etiqueta]] of Object.entries(spiko)) {
      const o = v1.o.find(x => x.slug === slug);
      assert.equal(o.rentabilidad.mostrada, pct, slug);
      assert.ok(o.rentabilidad.literal.includes('04/11/2026') && o.rentabilidad.literal.includes('05/11/2026'), slug);
      assert.deepEqual(o.metricas.find(m => m.etiqueta === etiqueta), { etiqueta, valor: pct });
      assert.ok(!o.metricas.some(m => /02\/11\/2026/.test(m.etiqueta)), `${slug}: sin la métrica vieja`);
      informe.cifrasSpiko[slug] = { antes: v0.o.find(x => x.slug === slug).rentabilidad.mostrada, despues: pct };
    }
    ok('Spiko, en las vistas públicas: Letras del Tesoro Euro 2,34 % → 2,39 %, Dólar 3,95 % → 3,99 % (en USD) y Spiko Euro 2,84 % con fecha nueva; las tres con el valor liquidativo del 04/11 y la consulta del 05/11');

    // Vigencia: siete días desde el 05/11.
    const lector = hoy => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy, permitirAmpliacion: true });
    const r = lector('2026-11-05');
    assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.plataformasEsperadas, 25); assert.equal(r.manifiesto.ofertasEsperadas, 24);
    lector('2026-11-12');
    assert.throws(() => lector('2026-11-13'), /caducad/);
    assert.ok(v1.o.every(o => !pinta(o, '2026-11-12').vencida && pinta(o, '2026-11-13').vencida), 'las 24 tarjetas valen hasta el 12/11');
    const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
    if (typeof adaptarCatalogoV2 === 'function') {
      const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date('2026-11-05T12:00:00Z'));
      assert.equal(movil.plataformas.length, 25); assert.equal(movil.ofertas.length, 24);
    }
    ok('vigencia: el lector de la web (validarLotePublicoV2) lo acepta el 05/11 y el 12/11 y lo da por caducado el 13/11; las 24 tarjetas ocultan cifras desde el 13/11; el lector de la app lo acepta (25/24)');

    // Qué verá el inversor en cada tarjeta: mínimo, acceso desde España y salida.
    informe.tarjetas = {};
    const BW = { 'vivienda-pluddemanngasse-101-graz': '75', 'vivienda-sonnleithnergasse-2-viena': '75', 'local-de-estanco-klagenfurt': '95',
      'vivienda-stallhofstra-e-28-gratwein': '69,90', 'vivienda-schwarzer-weg-18-graz': '66,67', 'drautalresidenz-paternion': '70',
      'randhartingergasse-9-viena': '78', 'apartamento-vacacional-hinterstoder-50': '77', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '74',
      'fotovoltaica-greenpoint': '100', 'fotovoltaica-cohotel': '110' };
    for (const o of v1.o) {
      const ahora = pinta(o, FECHA), antes = pinta(v0.o.find(x => x.slug === o.slug), FECHA);
      for (const k of ['minimo', 'espana', 'salida']) {
        assert.ok(['', 'es'].includes(idiomaCita(ahora[k])), `${o.slug}.${k}: «${ahora[k]}» parece una cita en otro idioma`);
        assert.ok(ahora[k].length <= 175, `${o.slug}.${k}: demasiado largo`);
      }
      assert.doesNotMatch(ahora.minimo.normalize('NFD').replace(/[̀-ͯ]/g, ''), /por (?:token|participacion|accion)/i);
      assert.ok(!ahora.vencida, o.slug);
      informe.tarjetas[o.slug] = { coleccion: o.coleccion, estado: ahora.estado, minimo: ahora.minimo, espana: ahora.espana, salida: ahora.salida,
        ...(JSON.stringify([antes.minimo, antes.espana, antes.salida]) !== JSON.stringify([ahora.minimo, ahora.espana, ahora.salida])
          ? { antes: { minimo: antes.minimo, espana: antes.espana, salida: antes.salida } } : {}) };
    }
    const t = informe.tarjetas;
    for (const [slug, precio] of Object.entries(BW)) {
      assert.equal(t[slug].minimo, `Desde ${precio} € la participación en reventa (05/11)`, slug);
      assert.equal(t[slug].espana, 'Sin comprobar si se puede contratar desde España', slug);
    }
    assert.equal(t['vivienda-pottendorfer-stra-e-62-wr-neustadt'].salida, 'Salida: Primera cancelación a los 15 años de la emisión; antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)');
    for (const slug of ['boss-info', 'switzerlend', 'aktionariat']) assert.equal(t[slug].espana, 'Disponible desde España según la fuente', slug);
    assert.equal(t['boss-info'].minimo, '100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 05/11)');
    assert.equal(t.switzerlend.minimo, '1 acción (68,01 CHF el 05/11)');
    assert.equal(t['hausera-proximas-ofertas'].minimo, '100 € según la FAQ de Hausera (05/11); las condiciones de Alicante 2 están en su documento de emisión, aún no público.');
    assert.equal(t['spiko-smart-cash-euro'].salida, 'Reembolso: Diario, con orden antes de las 15:00 (París) y abono al día hábil siguiente; puede limitarse (25 % del fondo)');
    // Datos de tarjeta acortados (R5): el mismo dato y la misma lectura de España en la tarjeta.
    for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks']) assert.equal(t[slug].espana, 'Disponible desde España según la fuente', slug);
    assert.equal(t['robinhood-classic-stock-tokens'].salida, 'Salida: Cierras con Robinhood Europe (24/5 según su web; horario ampliado no siempre disponible); el cierre puede suspenderse');
    assert.equal(t['casa-de-outeiro'].salida, 'Salida: Si no llega a 2 M€, te devuelven el dinero; si sale, solo podrás vender un 2,5 % de tus acciones al año de 2027 a 2030');
    const cambiadas = Object.entries(t).filter(([, x]) => x.antes).map(([s]) => s);
    ok(`tarjetas (resumenOferta, 05/11): las 24 en castellano, sin citas en otro idioma y sin «por participación» en el mínimo; cambian ${cambiadas.length}: ${cambiadas.join(', ')}; Brickwise «Desde X € la participación en reventa (05/11)»; Boss Info y Switzerlend, «Disponible desde España según la fuente»`);

    // El sincronizador real, contra estas vistas, en una copia temporal del catálogo de la web.
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-1105-'));
    try {
      const jsPath = path.join(temporal, 'catalogo.js');
      fs.copyFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
      const leidas = [];
      const fetchFn = async url => { leidas.push(url); return { ok: true, json: async () => structuredClone(
        url.includes('catalogo_plataformas_publicas_v2') ? v1.p : url.includes('catalogo_ofertas_publicas_v2') ? v1.o : v1.d) }; };
      const log = console.log; console.log = () => {};
      try { await sincronizar({ fetchFn, jsPath, csvPath: path.join(temporal, 'rwadar.csv'), hoy: new Date('2026-11-05T12:00:00Z'),
        versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); } finally { console.log = log; }
      const snap = fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8'));
      assert.equal(snap.plataformas.length, 25); assert.equal(snap.ofertas.length, 24); assert.equal(snap.fuera.length, 5);
      assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + 25 + 5);
      const salidas = fichas.construirSalidas({ catalogo: snap });
      const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
      assert.deepEqual(paginas.sort(), manifiestoFichas.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort(), 'mismas fichas que la lista cerrada');
      const actual = n => fs.existsSync(path.join(ROOT, 'rwadar-site', n)) ? fs.readFileSync(path.join(ROOT, 'rwadar-site', n), 'utf8') : null;
      const distintas = paginas.filter(n => actual(n) !== salidas.get(n));
      informe.fichasQueCambian = distintas.length;
      ok(`sincronizador real con estas vistas: 25 plataformas, 24 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas); las fichas salen con la lista cerrada de siempre (${paginas.length} páginas, ninguna nueva ni retirada) y cambian ${distintas.length} por la revisión y las fechas`);
      informe.lecturasDelSincronizador = leidas.map(u => u.replace(/^https:\/\/[^/]+/, ''));
    } finally { fs.rmSync(temporal, { recursive: true, force: true }); }

    if (exportar) {
      // Lo que leería un visitante por REST después de aplicar, con las rutas que piden
      // sincronizar.js y volcar-seed.js (para ensayarlos en una copia aparte).
      fs.mkdirSync(exportar, { recursive: true });
      await sesion(db, null, 'anon');
      const escribe = (nombre, datos) => fs.writeFileSync(path.join(exportar, nombre), JSON.stringify(datos));
      escribe('catalogo_plataformas_publicas_v2.json', v1.p);
      escribe('catalogo_ofertas_publicas_v2.json', v1.o);
      escribe('descartadas-sincronizar.json', await filas(db, DESCARTADAS.replace(' order by f.url', '')));
      escribe('categorias.json', await filas(db, 'select * from public.categorias order by orden'));
      escribe('regiones.json', await filas(db, 'select * from public.regiones order by slug'));
      escribe('radar_publico.json', api(await filas(db, 'select * from public.radar_publico')).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en')));
      escribe('descartadas-volcar.json', api(await filas(db, `select p.slug, p.nombre, p.etiqueta_descarte, p.motivo_descarte, p.verificada_el,
        coalesce((select json_agg(json_build_object('url', f.url, 'titulo', f.titulo, 'publicada_el', f.publicada_el, 'consultada_el', f.consultada_el))
          from public.fuentes f where f.plataforma_id = p.id), '[]') as fuentes
        from public.plataformas p where p.estado = 'descartada' order by p.slug`)));
      escribe('catalogo_publicacion.json', await filas(db, 'select retirado, motivo from public.catalogo_publicacion'));
      await sesion(db);
      ok(`exportado a ${exportar} lo que leería un visitante después de aplicar`);
    }
  } finally { await db.close(); }
}

// Ya importada como borrador (catalogo.sql solo, sin aprobar): el aplicador la aprueba sin duplicar nada.
await caso('la revisión nueva ya estaba importada como borrador', fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), false,
  async (db, antes, despues) => {
    assert.equal(JSON.parse(antes.publicacion)[0].revision_id, PREVIA);
    assert.equal(JSON.parse(despues.publicacion)[0].revision_id, NUEVA);
    assert.equal(despues.catalogo, antes.catalogo, 'no duplica filas');
    ok('si la revisión nueva ya estaba importada como borrador, el aplicador la aprueba y la publica sin duplicar filas');
    return { publicada: NUEVA };
  });

// ---------------------------------------------------------------- 4 · producción distinta
const ANTERIOR = 'cf79e4a4-f828-96ce-681b-ae69c3d1b81b'; // la 2026-11-04, que está en la cadena
await caso('la publicada no es la 723968ce (es la anterior, cf79e4a4)', `update rwadar_catalogo.publicacion_v2 set revision_id = '${ANTERIOR}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('la revisión destino ya existe con otra huella',
  `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', 25, 24, '{"principales":8,"secundario":13,"en_camino":3}'); set session_replication_role = origin;`,
  /otra identidad/);
// Aplicado después del 12/11 (R7). PGlite usa la fecha del sistema (05/11): se ensaya la misma guarda con el
// último día vigente cambiado al 04/11, que para esta guarda es lo mismo que aplicarla el 13/11.
{
  const caducado = SQL.replace(TOPE, TOPE.replace(`'${revision.venceTrasEl}'`, "'2026-11-04'"));
  assert.notEqual(caducado, SQL);
  await caso('aplicada después del último día vigente (lote caducado)', null, /Lote caducado/, null, caducado);
}
await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
  `set session_replication_role = replica; update public.plataformas set slug = 'addx-prueba' where slug = 'addx'; set session_replication_role = origin;`,
  /incompleto/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length }, null, 1));
