// Ensayo local de la entrega «2026-11-05.2» en PGlite, sin red, sobre la misma cadena que producción:
// la instalación con el 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql, la copia fija de
// 02_seed.sql de entonces) y los lotes del 22/10 al 2026-11-05, que deja publicada la cede1f27.
//   1. qué sentencias lleva el SQL y qué tablas toca (rwadar_catalogo y la web de Pax Gold);
//   2. antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante (lectura-publica/);
//   3. con producción como se espera: la revisión nueva queda publicada con 25 plataformas y 22 ofertas
//      (8/13/1); las 22 que se quedan, idénticas a la cede1f27; BILLA y Casa de Outeiro, fuera; el texto
//      nuevo de acceso de Spiko con sus dos fuentes de la CNMV; la web de Pax Gold en paxg.com; idempotente;
//      el lector de la web y el de la app aceptan 1 en camino; lo que leen la web (sincronizador y
//      fichas, con la lista cerrada sin las dos) y el worker (404 para las dos fichas retiradas);
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra
//      identidad, Pax Gold con otra web u otros datos, plataformas que faltan) o aplicado después del
//      12/11, falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-05.2-v2/comprobar-entrega.mjs [--exportar=DIR]
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
import { isDeepStrictEqual } from 'node:util';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const APP = path.join(ROOT, 'rwadar-app');
process.chdir(APP);
const require = createRequire(import.meta.url);
const { baseCatalogoHistorico, filas, sesion } = await import('../../../pruebas-soporte.mjs');
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2 } = require('../../../catalogo-publico.js');
const { sincronizar } = require('../../../sincronizar.js');
const { resumenOferta } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const manifiestoFichas = require(path.join(ROOT, 'rwadar-fichas-manifiesto.js'));
const { construirWorker } = require(path.join(ROOT, 'rwadar-acceso/compilar.cjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-05.2', FECHA = '2026-11-05';
const RETIRADAS = ['terreno-con-arrendamiento-billa', 'casa-de-outeiro'];
const PAX = 'pax-gold', WEB_VIEJA = 'https://paxos.com/paxgold', WEB_NUEVA = 'https://www.paxg.com/';
const exportar = (process.argv.find(a => a.startsWith('--exportar=')) || '').slice('--exportar='.length);
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
// La huella de la publicada sale de construir la 2026-11-05 local, como pide la guarda.
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: '2026-11-05', versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA]);
const cr = leer(path.join(DIR, 'cambios-radar.json'));
const TEXTO_SPIKO = cr.plataformas.spiko.acceso.detalle;
const FUENTES_NUEVAS = Object.keys(cr.fuentesNuevas);
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7', '2026-11-04', '2026-11-04.2', '2026-11-05'];
const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), etiqueta: ETIQUETA,
  revisionAnterior: PREVIA, revisionNueva: NUEVA, sha256AplicarYAprobar: SHA, pruebas: [], casos: [] };
const ok = t => { informe.pruebas.push(t); console.log('  OK   ', t); };

// ---------------------------------------------------------------- 1 · inventario del SQL
const PROHIBIDO = /\b(delete\s+from|truncate|alter\s+(?:table|role|type|policy|function|default)|drop\s|create\s+(?:or\s+replace\s+)?(?:table|function|policy|type|view|trigger|role|schema|extension|index)|grant\s|revoke\s|security\s+definer|set\s+role|auth\.)\b/i;
assert.doesNotMatch(SQL, PROHIBIDO);
const bloques = [...SQL.matchAll(/^do \$(\w+)\$\n([\s\S]*?)^end \$\1\$;$/gm)];
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'plataformas_guarda', 'plataformas_comprobar', 'aprobar']);
for (const b of bloques.slice(0, 3)) assert.doesNotMatch(b[2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|execute\b)/i, `${b[1]} solo lee`);
assert.equal([...bloques[3][2].matchAll(/\bupdate\s+([\w.]+)/gi)].map(m => m[1]).join(), 'rwadar_catalogo.revisiones', 'la aprobación solo cambia el estado de la revisión');
assert.doesNotMatch(bloques[3][2], /\b(?:insert\s+into|delete\s+from|execute\b)/i);
const sinBloques = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '');
const sentencias = sinBloques.split('\n').filter(l => l.trim() && !l.startsWith('--'));
const UPDATE_PAX = `update public.plataformas set web = '${WEB_NUEVA}' where slug = '${PAX}' and web = '${WEB_VIEJA}';`;
assert.deepEqual(sentencias.filter(l => !/^insert into rwadar_catalogo\.\w+ \(/.test(l)), ['begin isolation level serializable;', UPDATE_PAX, 'commit;'],
  'fuera de las guardas y la aprobación solo hay inserts en rwadar_catalogo y el update de la web de Pax Gold');
const escrituras = sentencias.map(l => l.match(/^insert into ([\w.]+)/)?.[1]).filter(Boolean);
const cuenta = Object.fromEntries([...new Set(escrituras)].map(e => [e, escrituras.filter(x => x === e).length]));
assert.deepEqual(Object.keys(cuenta).sort(), ['rwadar_catalogo.alerta_fuentes', 'rwadar_catalogo.alertas', 'rwadar_catalogo.fuentes',
  'rwadar_catalogo.ofertas', 'rwadar_catalogo.plataforma_fuentes', 'rwadar_catalogo.plataformas', 'rwadar_catalogo.revisiones']);
assert.equal(cuenta['rwadar_catalogo.revisiones'], 1); assert.equal(cuenta['rwadar_catalogo.plataformas'], 25);
assert.equal(cuenta['rwadar_catalogo.ofertas'], 22); assert.equal(cuenta['rwadar_catalogo.fuentes'], 69);
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.endsWith(' on conflict (id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,id) do nothing;') || l.endsWith(' on conflict (revision_id,plataforma_id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,slug) do nothing;') || l.endsWith(' on conflict do nothing;')), 'todos los inserts son idempotentes');
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts son de la revisión nueva');
for (const s of RETIRADAS) assert.ok(!sentencias.some(l => l.startsWith('insert into rwadar_catalogo.ofertas') && l.includes(`'${s}'`)), `${s}: no entra en el lote`);
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
assert.ok(bloques[0][2].includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
const TOPE = `  if current_date > date '${revision.venceTrasEl}' then\n    raise exception 'Lote caducado`;
assert.equal(revision.venceTrasEl, '2026-11-12');
assert.equal(bloques[0][2].split(TOPE).length, 2, 'la guarda tiene la fecha tope del 12/11');
informe.inventario = { ...cuenta, 'public.plataformas (update)': 1 };
ok(`inventario: una transacción serializable; guarda (publicada cede1f27 con su huella ${HASH_PREVIA.slice(0, 12)}…, catálogo no retirado, fecha del 05/11 al 12/11, destino sin otra identidad); inserts idempotentes en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}), sin BILLA ni Casa de Outeiro; en public.* solo «update public.plataformas set web» de Pax Gold, con su guarda y su comprobación; aprobación al final; sin DDL, borrados, permisos, Auth ni funciones`);

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
const sinComillas = v => v.replace(/'/g, "''");
const set = (slug, col, v) => `update public.plataformas set ${col} = '${sinComillas(v)}' where slug = '${slug}';`;

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
// La lista cerrada de fichas como quedará después de aplicar (despues-de-aplicar.mjs).
const listaDespues = manifiestoFichas.filter(r => !RETIRADAS.some(s => r === `ofertas/${s}.html`));
assert.equal(listaDespues.length, manifiestoFichas.length - 2, 'las dos fichas están hoy en la lista cerrada');

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok(`cadena de producción (seed del 04/11 antes de ARTEX + ${LOTES.length} lotes, del 22/10 a la 2026-11-05): la publicada es la cede1f27`);

    // Lo que enseña PGlite antes de aplicar es lo que se leyó hoy como visitante (17:06:58–17:07:19 UTC).
    const lp = path.join(DIR, 'lectura-publica');
    const pubO = leer(path.join(lp, 'ofertas-v2.json')), pubP = leer(path.join(lp, 'plataformas-v2.json'));
    const pubT = leer(path.join(lp, 'plataformas-todas.json')), pubD = leer(path.join(lp, 'descartadas.json'));
    const [pubPax] = leer(path.join(lp, 'pax-gold-plataforma.json'));
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
    assert.deepEqual(v0.d, pubD.map(d => ({ nombre: d.nombre, etiqueta_descarte: d.etiqueta_descarte, motivo_descarte: d.motivo_descarte,
      fuentes: d.fuentes.map(f => ({ url: f.url, titulo: f.titulo })).sort((a, b) => (a.url < b.url ? -1 : 1)) }))
      .sort((a, b) => (a.nombre < b.nombre ? -1 : 1)), 'descartadas = producción');
    const pax0 = JSON.parse(f0.plataformas).find(x => x.slug === PAX);
    for (const col of Object.keys(leer(path.join(DIR, 'cambios-plataformas.json')).plataformas[PAX].antes))
      assert.deepEqual(col === 'verificada_el' ? pax0[col].slice(0, 10) : pax0[col], pubPax[col], `Pax Gold.${col}`);
    assert.equal(JSON.parse(f0.fuentes).filter(f => f.plataforma_id === pax0.id).length, 0);
    ok('antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante: 25 plataformas, 24 ofertas (8/13/3), las 30 filas de public.plataformas, las 5 descartadas con sus fuentes y la fila de Pax Gold (web https://paxos.com/paxgold, sin fuentes propias); tolerancias de siempre: el uuid de cada plataforma, «publicadaEl» de las fuentes del radar y el orden de las fuentes de cada campo');

    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo (la segunda vez no cambia ni actualizada_el de Pax Gold)');

    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.equal(f1.retirado, f0.retirado);
    const revs0 = JSON.parse(f0.revisiones), revs1 = JSON.parse(f1.revisiones);
    assert.deepEqual(revs1.filter(r => r.id !== NUEVA), revs0, 'las revisiones anteriores, intactas (historial)');
    assert.equal(revs1.find(r => r.id === NUEVA).estado, 'aprobada');
    for (const k of ['fuentes', 'cambios', 'avisosCorreo', 'avisosPush', 'emisiones']) assert.equal(f1[k], f0[k], `public: ${k} intacto`);
    // public.plataformas: solo cambian la web y actualizada_el de Pax Gold.
    const antes0 = Object.fromEntries(JSON.parse(f0.plataformas).map(x => [x.slug, x]));
    const cambiadas = [];
    for (const x of JSON.parse(f1.plataformas)) for (const k of Object.keys(x)) if (JSON.stringify(x[k]) !== JSON.stringify(antes0[x.slug][k])) cambiadas.push(`${x.slug}.${k}`);
    assert.deepEqual(cambiadas.sort(), [`${PAX}.actualizada_el`, `${PAX}.web`]);
    assert.equal(JSON.parse(f1.plataformas).find(x => x.slug === PAX).web, WEB_NUEVA);
    ok('public.plataformas: solo cambia Pax Gold (web https://paxos.com/paxgold → https://www.paxg.com/, y actualizada_el); public.fuentes, cambios de estado, avisos y emisiones, intactos; las revisiones anteriores se conservan y la nueva queda aprobada');

    // Lo publicado: 25 plataformas y 22 ofertas (8/13/1).
    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 25 && v1.o.length === 22);
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === 25 && x.ofertas_esperadas === 22 &&
      isDeepStrictEqual(x.colecciones_esperadas, { principales: 8, secundario: 13, en_camino: 1 })));
    const col = Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length]));
    assert.deepEqual(col, { principales: 8, secundario: 13, en_camino: 1 });
    assert.deepEqual(v1.o.filter(o => o.coleccion === 'en_camino').map(o => o.slug), ['hausera-proximas-ofertas']);
    assert.ok(RETIRADAS.every(s => !v1.o.some(o => o.slug === s)), 'BILLA y Casa de Outeiro, fuera');
    assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === FECHA));
    assert.deepEqual(v1.o.map(o => o.slug), v0.o.map(o => o.slug).filter(s => !RETIRADAS.includes(s)), 'las 22, en el mismo orden');
    // Las 22 que se quedan, idénticas a la cede1f27 salvo la revisión y el manifiesto del lote.
    const sinLote = x => { const { revision_id, ofertas_esperadas, colecciones_esperadas, ...r } = x; return r; };
    for (const o of v1.o) assert.deepEqual(sinLote(o), sinLote(v0.o.find(x => x.slug === o.slug)), `${o.slug}: igual que en la cede1f27`);
    assert.deepEqual(v1.d, v0.d, 'las 5 descartadas, iguales');
    ok('publicada la revisión nueva: 25 plataformas y 22 ofertas (8 principales, 13 de reventa y 1 en camino, Hausera); BILLA y Casa de Outeiro, fuera; las 22 que se quedan, idénticas a la cede1f27 (mismo orden, cifras, avisos, documentación, verificadas el 05/11 con 7 días) salvo la revisión y el manifiesto del lote (24 → 22, en camino 3 → 1); las 5 descartadas, iguales');

    // Plataformas: iguales salvo la revisión, el manifiesto, la web de Pax Gold y el acceso de Spiko.
    for (const p of v1.p) {
      const a = v0.p.find(x => x.slug === p.slug);
      const sinTodo = x => { const { revision_id, ofertas_esperadas, colecciones_esperadas, web, verificacion_local, ...r } = x; return r; };
      assert.deepEqual(sinTodo(p), sinTodo(a), `${p.slug}: columnas iguales`);
      assert.equal(p.web, p.slug === PAX ? WEB_NUEVA : a.web, `${p.slug}: web`);
      if (p.slug !== 'spiko') { assert.deepEqual(p.verificacion_local, a.verificacion_local, `${p.slug}: verificación igual`); continue; }
      const { acceso: acc1, ...resto1 } = p.verificacion_local, { acceso: acc0, ...resto0 } = a.verificacion_local;
      assert.deepEqual(resto1, resto0, 'Spiko: todo igual menos el acceso');
      assert.equal(acc1.estado, acc0.estado);
      assert.equal(acc0.detalle, cr.plataformas.spiko.acceso.antes);
      assert.equal(acc1.detalle, TEXTO_SPIKO);
      assert.doesNotMatch(acc1.detalle, /comercializa(?:n)? en España|se comercializa/i);
      const ids = acc1.fuentes.map(f => f.id).sort();
      assert.deepEqual(ids, [...acc0.fuentes.map(f => f.id), ...FUENTES_NUEVAS].sort());
      for (const id of FUENTES_NUEVAS) {
        const f = acc1.fuentes.find(x => x.id === id), c = cr.fuentesNuevas[id];
        assert.deepEqual({ url: f.url, titulo: f.titulo, tipo: f.tipo, primaria: f.primaria, consultadaEl: f.consultadaEl },
          { url: c.url, titulo: c.titulo, tipo: 'regulador', primaria: true, consultadaEl: FECHA }, id);
      }
      for (const f of acc0.fuentes) assert.deepEqual(acc1.fuentes.find(x => x.id === f.id), f, `${f.id}: igual`);
    }
    informe.spiko = { antes: cr.plataformas.spiko.acceso.antes, despues: TEXTO_SPIKO, fuentesNuevas: FUENTES_NUEVAS.map(id => cr.fuentesNuevas[id].url) };
    ok(`plataformas: iguales salvo la revisión y el manifiesto; Pax Gold con web ${WEB_NUEVA} en la vista; Spiko con el texto de acceso nuevo («…La CNMV tiene inscritas a SPIKO SICAV… (n.º 2380, con Aldana Capital como comercializadora) y a Spiko Finance… (n.º 5325), pero no muestra qué compartimentos…»), sin decir que el fondo se comercializa en España, y sus fuentes de antes más las dos de la CNMV (consultadas el 05/11)`);

    // Lectores: el de la web y el de la app aceptan 1 en camino; vigencia hasta el 12/11.
    const lector = hoy => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy, permitirAmpliacion: true });
    const r = lector('2026-11-05');
    assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.plataformasEsperadas, 25); assert.equal(r.manifiesto.ofertasEsperadas, 22);
    assert.deepEqual(r.manifiesto.coleccionesEsperadas, { principales: 8, secundario: 13, en_camino: 1 });
    lector('2026-11-12');
    assert.throws(() => lector('2026-11-13'), /caducad/);
    assert.ok(v1.o.every(o => !pinta(o, '2026-11-12').vencida && pinta(o, '2026-11-13').vencida), 'las 22 tarjetas valen hasta el 12/11');
    const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
    assert.equal(typeof adaptarCatalogoV2, 'function');
    const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date('2026-11-05T12:00:00Z'));
    assert.equal(movil.plataformas.length, 25); assert.equal(movil.ofertas.length, 22);
    assert.equal(movil.ofertas.filter(o => o.coleccion === 'en_camino').length, 1);
    for (const o of v1.o) assert.deepEqual(pinta(o, FECHA), pinta(v0.o.find(x => x.slug === o.slug), FECHA), `${o.slug}: la tarjeta no cambia`);
    ok('lector de la web (validarLotePublicoV2) y de la app (adaptarCatalogoV2): aceptan 25/22 con 1 en camino; vale el 05/11 y el 12/11 y caduca el 13/11; las 22 tarjetas se ven igual que hoy (mínimo, España, salida y estado)');

    // El sincronizador real, contra estas vistas, en una copia temporal del catálogo de la web.
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-1105-2-'));
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
      assert.equal(snap.plataformas.length, 25); assert.equal(snap.ofertas.length, 22); assert.equal(snap.fuera.length, 5);
      assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
      assert.ok(RETIRADAS.every(s => !snap.ofertas.some(o => o.slug === s)));
      assert.equal(snap.plataformas.find(p => p.slug === PAX).web, WEB_NUEVA);
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + 25 + 5);
      const filaPax = csv.find(l => l.includes('"Pax Gold"'));
      assert.ok(filaPax.includes(`"${WEB_NUEVA}"`) && !filaPax.includes(WEB_VIEJA), 'rwadar.csv: web nueva de Pax Gold');
      // Sin tocar la lista cerrada no se publica (las dos fichas siguen en ella); con la lista nueva, sí.
      assert.throws(() => fichas.construirSalidas({ catalogo: snap }), /manifiesto cerrado/i, 'sin quitar las dos de la lista cerrada no se publica');
      const salidas = fichas.construirSalidas({ catalogo: snap, paginasPermitidas: listaDespues });
      const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
      assert.deepEqual(paginas.sort(), listaDespues.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort());
      for (const s of RETIRADAS) {
        assert.ok(!salidas.has(`ofertas/${s}.html`), `${s}: sin página`);
        assert.ok(![...salidas.values()].some(t => t.includes(`/ofertas/${s}"`) || t.includes(`/ofertas/${s}<`)), `${s}: nadie la enlaza`);
      }
      assert.ok(!RETIRADAS.some(s => salidas.get('sitemap.xml').includes(`/ofertas/${s}<`)), 'sitemap sin las dos');
      const paxHtml = salidas.get(`plataformas/${PAX}.html`);
      assert.ok(paxHtml.includes(`href="${WEB_NUEVA}"`) && !paxHtml.includes(WEB_VIEJA), 'ficha de Pax Gold: botón y JSON-LD con paxg.com');
      assert.match(paxHtml, new RegExp(`"url":"${WEB_NUEVA.replace(/[./]/g, '\\$&')}"`), 'JSON-LD de Pax Gold con paxg.com');
      assert.match(paxHtml, /Ir a la web de Pax Gold/);
      const spikoHtml = salidas.get('plataformas/spiko.html');
      assert.ok(spikoHtml.includes(fichas.esc(TEXTO_SPIKO)), 'ficha de Spiko con el texto nuevo');
      for (const id of FUENTES_NUEVAS) assert.ok(spikoHtml.includes(`href="${fichas.esc(cr.fuentesNuevas[id].url)}"`), `ficha de Spiko enlaza ${id}`);
      const actual = n => fs.existsSync(path.join(ROOT, 'rwadar-site', n)) ? fs.readFileSync(path.join(ROOT, 'rwadar-site', n), 'utf8') : null;
      informe.fichasQueCambian = paginas.filter(n => actual(n) !== salidas.get(n)).length;
      ok(`sincronizador real con estas vistas: 25 plataformas, 22 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas, Pax Gold con ${WEB_NUEVA}); sin quitar las dos de la lista cerrada las fichas no se generan; con la lista nueva salen ${paginas.length} páginas, ninguna de BILLA ni de Casa de Outeiro (ni en el sitemap ni enlazadas), /plataformas/pax-gold con el botón «Ir a la web de Pax Gold» y el JSON-LD en paxg.com, y /plataformas/spiko con el texto nuevo y los dos enlaces a la CNMV`);
      informe.lecturasDelSincronizador = leidas.map(u => u.replace(/^https:\/\/[^/]+/, ''));

      // El worker con la lista nueva: las dos fichas retiradas dan su 404 (noindex, nofollow y no-store), sin
      // pedir a ASSETS la copia de conservación; las ilustraciones conservadas, también 404.
      const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(path.join(ROOT, 'rwadar-acceso'), { fichas: listaDespues })).toString('base64'))).default;
      for (const s of RETIRADAS) for (const ruta of [`/ofertas/${s}`, `/ofertas/${s}.html`, `/ofertas/${s}/`]) {
        const pedidas = [];
        const env = { ASSETS: { fetch: async req => { pedidas.push(new URL(req.url ?? req).pathname); return new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200 }); } } };
        const res = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), env, { waitUntil() {} });
        assert.equal(res.status, 404, ruta); assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow', ruta);
        assert.equal(res.headers.get('cache-control'), 'no-store', ruta); assert.deepEqual(pedidas, ['/404'], ruta);
      }
      for (const s of RETIRADAS) {
        const conservada = { 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, s-maxage=604800' };
        const env = { ASSETS: { fetch: async req => new URL(req.url ?? req).pathname === '/404'
          ? new Response('<title>Fuera de cobertura · RWAdar</title>', { status: 200 }) : new Response('copia', { status: 200, headers: conservada }) } };
        const res = await worker.fetch(new Request(`https://rwadar.pages.dev/ofertas-editoriales/oferta-${s}.webp`), env, { waitUntil() {} });
        assert.equal(res.status, 404, `ilustración de ${s}`);
      }
      const viva = await worker.fetch(new Request('https://rwadar.pages.dev/ofertas/hausera-proximas-ofertas'),
        { ASSETS: { fetch: async () => new Response('contenido') } }, { waitUntil() {} });
      assert.equal(viva.status, 200);
      ok('worker con la lista nueva: /ofertas/terreno-con-arrendamiento-billa y /ofertas/casa-de-outeiro (también con .html o barra final) dan el 404 del worker (noindex, nofollow; no-store) sin pedir su copia de conservación; sus ilustraciones conservadas, 404; Hausera sigue sirviéndose');
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
// Pax Gold ya con la web nueva (por ejemplo, cambiada a mano): el resto se aplica y la web no se toca.
await caso('Pax Gold ya tenía la web nueva', set(PAX, 'web', WEB_NUEVA), false, async (db, antes, despues) => {
  assert.equal(JSON.parse(despues.publicacion)[0].revision_id, NUEVA);
  assert.equal(despues.plataformas, antes.plataformas, 'public.plataformas no cambia (ni actualizada_el)');
  ok('si Pax Gold ya tenía la web nueva, la entrega se aplica igual y no vuelve a tocar su fila');
  return { publicada: NUEVA, plataformasSinCambios: true };
});

// ---------------------------------------------------------------- 4 · producción distinta
const ANTERIOR = '723968ce-00f7-7f42-b3e3-6c7f401b8f89'; // la 2026-11-04.2, que está en la cadena
await caso('la publicada no es la cede1f27 (es la anterior, 723968ce)', `update rwadar_catalogo.publicacion_v2 set revision_id = '${ANTERIOR}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('la revisión destino ya existe con otra huella',
  `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', 25, 22, '{"principales":8,"secundario":13,"en_camino":1}'); set session_replication_role = origin;`,
  /otra identidad/);
{
  // Aplicado después del 12/11. PGlite usa la fecha del sistema (05/11): se ensaya la misma guarda con el
  // último día vigente cambiado al 04/11, que para esta guarda es lo mismo que aplicarla el 13/11.
  const caducado = SQL.replace(TOPE, TOPE.replace(`'${revision.venceTrasEl}'`, "'2026-11-04'"));
  assert.notEqual(caducado, SQL);
  await caso('aplicada después del último día vigente (lote caducado)', null, /Lote caducado/, null, caducado);
}
await caso('Pax Gold con otra web', set(PAX, 'web', 'https://www.paxos.com/assets/paxg'), /Pax Gold no está como se leyó hoy/);
await caso('Pax Gold con otro dato («Por qué es fiable» distinto)', set(PAX, 'aval', 'Otro texto de prueba para el aval de Pax Gold.'), /Pax Gold no está como se leyó hoy/);
await caso('Pax Gold con una fuente propia', `insert into public.fuentes (plataforma_id,url,titulo) select id,'https://example.org/paxg','Fuente de prueba' from public.plataformas where slug='${PAX}';`,
  /Pax Gold no está como se leyó hoy/);
await caso('Pax Gold descartada', `update public.plataformas set estado = 'descartada', categoria_slug = null, region_slug = null, actor = null, acceso = null,
     ticket = null, cadenas = null, web = null, aval = null, nota = null, etiqueta_descarte = 'Prueba',
     motivo_descarte = 'Motivo de prueba suficientemente largo para la fila.' where slug = '${PAX}';`, /no está como se leyó hoy|incompleto|publicable/);
await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
  `set session_replication_role = replica; update public.plataformas set slug = 'addx-prueba' where slug = 'addx'; set session_replication_role = origin;`,
  /incompleto/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length }, null, 1));
