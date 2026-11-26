// Ensayo local de la entrega «2026-11-26.4» (25 plataformas del radar del informe global del 26/11) en PGlite, sin red,
// sobre la misma cadena que producción: la instalación con el 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql)
// y los lotes del 22/10 a la 2026-11-26.3 (cada uno con su tope evaluado en su día y la migración 38 tras el 2026-11-20).
//   1. qué sentencias lleva el SQL y qué tablas toca (rwadar_catalogo, la aprobación y, en public.*, solo las regiones
//      «África» y «Oriente Medio» y las 25 plataformas nuevas);
//   2. antes de aplicar, PGlite enseña la 2026-11-26.3 local (y, si existe lectura-publica/, lo leído como visitante);
//   3. con producción como se espera: la revisión nueva queda publicada con 57 plataformas y 32 ofertas (17/13/2);
//      las 32 ofertas y las 32 plataformas de antes, idénticas; las 25 nuevas en public.plataformas sin cambios de
//      estado ni avisos; idempotente; el lector de la web y el de la app; lo que leen la web (sincronizador y fichas, con
//      la lista cerrada ampliada) y el worker (las fichas nuevas se sirven);
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra identidad, una
//      plataforma que falta, una plataforma nueva o una región con otros datos, otro radar) o aplicado después del 03/12,
//      falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-26.4-v2/comprobar-entrega.mjs [--exportar=DIR]
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
const ETIQUETA = '2026-11-26.4', FECHA = '2026-11-26', DESDE = '2026-11-26.3', ULTIMO = '2026-12-03';
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
const D26 = leer(path.join(APP, 'data/verificaciones/2026-11-26-v2/decisiones.json'));
const LOTES = [...D26.cadena, '2026-11-26', '2026-11-26.2', DESDE];
const REV_262 = leer(path.join(APP, 'data/importaciones/catalogo-2026-11-26.2-v2/revision.json')).revisionId;
const A = leer(path.join(DIR, 'altas.json'));
const ALTAS = A.ofertas.map(x => x.oferta.slug), PALTAS = A.plataformas.map(p => p.slug), RS = A.regiones;
assert.deepEqual(ALTAS, []);
const NP = 32 + PALTAS.length;
const COL = { principales: 17, secundario: 13, en_camino: 2 };
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
assert.deepEqual(bloques.map(b => b[1]), ['guarda', 'publico_guarda', 'publico_comprobar', 'aprobar']);
for (const b of bloques.slice(0, 3)) assert.doesNotMatch(b[2], /\b(?:update\s+(?!.*\bfor\s+update)|insert\s+into|delete\s+from|execute\b)/i, `${b[1]}: solo lee`);
assert.equal([...bloques[3][2].matchAll(/\bupdate\s+([\w.]+)/gi)].map(m => m[1]).join(), 'rwadar_catalogo.revisiones', 'la aprobación solo cambia el estado de la revisión');
assert.doesNotMatch(bloques[3][2], /\b(?:insert\s+into|delete\s+from|execute\b)/i);
const sinBloques = SQL.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '');
const sentencias = sinBloques.split('\n').filter(l => l.trim() && !l.startsWith('--'));
const publicas = sentencias.filter(l => /^insert into public\./.test(l));
assert.deepEqual(sentencias.filter(l => !/^insert into (?:rwadar_catalogo|public)\.\w+ \(/.test(l)), ['begin isolation level serializable;', 'commit;'],
  'fuera de los bloques solo hay inserts');
assert.equal(publicas.length, RS.length + PALTAS.length);
for (const [i, R] of RS.entries()) assert.equal(publicas[i], `insert into public.regiones (slug,nombre) values ('${R.slug}','${R.nombre}') on conflict (slug) do nothing;`);
for (const [i, s] of PALTAS.entries()) assert.ok(publicas[i + RS.length].startsWith(`insert into public.plataformas (slug,nombre,estado,`) &&
  publicas[i + RS.length].includes(`values ('${s}',`) && publicas[i + RS.length].endsWith(` on conflict (slug) do nothing;`), `${s}: alta idempotente en public.plataformas`);
assert.ok(SQL.indexOf(publicas.at(-1)) < SQL.indexOf('insert into rwadar_catalogo.'), 'las filas de public.* van antes que el catálogo');
const catalogo = sentencias.filter(l => /^insert into rwadar_catalogo\./.test(l));
const escrituras = catalogo.map(l => l.match(/^insert into ([\w.]+)/)?.[1]);
const cuenta = Object.fromEntries([...new Set(escrituras)].map(e => [e, escrituras.filter(x => x === e).length]));
assert.deepEqual(Object.keys(cuenta).sort(), ['rwadar_catalogo.alerta_fuentes', 'rwadar_catalogo.alertas', 'rwadar_catalogo.fuentes',
  'rwadar_catalogo.ofertas', 'rwadar_catalogo.plataforma_fuentes', 'rwadar_catalogo.plataformas', 'rwadar_catalogo.revisiones']);
assert.equal(cuenta['rwadar_catalogo.revisiones'], 1); assert.equal(cuenta['rwadar_catalogo.plataformas'], NP);
assert.equal(cuenta['rwadar_catalogo.ofertas'], 32); assert.equal(cuenta['rwadar_catalogo.fuentes'], 109);
assert.ok(catalogo.every(l => / on conflict \((?:id|revision_id,id|revision_id,plataforma_id|revision_id,slug)\) do nothing;$| on conflict do nothing;$/.test(l)), 'todos los inserts son idempotentes');
assert.ok(catalogo.every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts del catálogo son de la revisión nueva');
for (const s of ALTAS) assert.equal(catalogo.filter(l => l.startsWith('insert into rwadar_catalogo.ofertas') && l.includes(`'${s}'`)).length, 1, `${s}: entra en el lote`);
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
assert.ok(bloques[0][2].includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
const TOPE = `  if current_date > date '${revision.venceTrasEl}' then\n    raise exception 'Lote caducado`;
assert.equal(revision.venceTrasEl, ULTIMO);
assert.equal(bloques[0][2].split(TOPE).length, 2, 'la guarda tiene la fecha tope del 03/12');
informe.inventario = { ...cuenta, 'public.regiones': RS.length, 'public.plataformas': PALTAS.length };
ok(`inventario: una transacción serializable; guarda (publicada ${PREVIA.slice(0, 8)} con su huella ${HASH_PREVIA.slice(0, 12)}…, catálogo no retirado, fecha del 26/11 al 03/12, destino sin otra identidad); en public.* solo inserts idempotentes de filas nuevas (las regiones ${RS.map(x => `«${x.nombre}»`).join(' y ')} y las ${PALTAS.length} plataformas, con guarda y comprobación de que quedan exactas); inserts idempotentes en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}); aprobación al final; sin DDL, borrados, updates en public, permisos, Auth ni funciones`);

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
const COLS = 'slug, nombre, estado, categoria_slug, region_slug, actor, acceso, ticket, cadenas, web, aval, nota, etiqueta_descarte, motivo_descarte';
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
    regiones: await q('select * from public.regiones order by slug'),
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
const NUEVAS_PAGINAS = [...ALTAS.map(s => `ofertas/${s}.html`), ...PALTAS.map(s => `plataformas/${s}.html`)];
const listaDespues = [...new Set([...manifiestoFichas, ...NUEVAS_PAGINAS])];

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok(`cadena de producción (seed antes de ARTEX + ${LOTES.length} lotes, del ${LOTES[0]} a la ${DESDE}): la publicada es la ${PREVIA.slice(0, 8)}`);
    assert.equal(v0.o.length, 32); assert.equal(v0.p.length, 32);
    for (const o of v0.o) {
      assert.deepEqual(o.documentacion, doc26[o.slug], `${o.slug}: documentación = ${DESDE} local`);
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
    ok(`antes de aplicar, PGlite enseña la ${DESDE} local (32 plataformas, 32 ofertas 17/13/2, documentación idéntica)` +
      (conLectura ? ' y lo leído como visitante en lectura-publica/' : ' (lectura-publica/ pendiente)'));
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
    for (const k of ['fuentes', 'cambios', 'avisosCorreo', 'avisosPush', 'emisiones']) assert.equal(f1[k], f0[k], `public: ${k} intacto`);
    // public.plataformas: las de antes, idénticas; las 25 nuevas, exactamente como las define altas.json.
    const pl0 = JSON.parse(f0.plataformas), pl1 = JSON.parse(f1.plataformas);
    assert.deepEqual(pl1.filter(p => !PALTAS.includes(p.slug)), pl0, 'public.plataformas de antes, idénticas');
    for (const p of A.plataformas) {
      const r = pl1.find(x => x.slug === p.slug);
      assert.ok(r, `${p.slug}: en public.plataformas`);
      assert.deepEqual(Object.fromEntries(COLS.split(', ').map(c => [c, r[c]])),
        { slug: p.slug, nombre: p.nombre, estado: 'en_radar', ...p.publica, etiqueta_descarte: null, motivo_descarte: null }, `${p.slug}: fila`);
    }
    assert.equal(pl1.filter(p => p.estado === 'en_radar').length, NP); assert.equal(pl1.filter(p => p.estado === 'descartada').length, 5);
    assert.deepEqual(JSON.parse(f1.regiones).filter(r => !RS.some(x => x.slug === r.slug)), JSON.parse(f0.regiones));
    for (const R of RS) assert.ok(JSON.parse(f1.regiones).some(r => r.slug === R.slug && r.nombre === R.nombre), R.slug);
    ok(`public.plataformas: las ${pl0.length} de antes, idénticas, y las ${PALTAS.length} nuevas exactas (${NP} en el radar y 5 descartadas); regiones ${RS.map(x => `«${x.nombre}»`).join(' y ')} añadidas; public.fuentes, cambios de estado, avisos y emisiones, intactos (dar de alta no avisa a nadie); las revisiones anteriores se conservan y la nueva queda aprobada`);

    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === NP && v1.o.length === 32);
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === NP && x.ofertas_esperadas === 32 &&
      isDeepStrictEqual(x.colecciones_esperadas, COL)));
    const col = Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length]));
    assert.deepEqual(col, COL);
    assert.deepEqual(v1.o.map(o => o.slug).sort(), v0.o.map(o => o.slug).sort(), 'las mismas 32 ofertas');
    assert.ok(PALTAS.every(s => v1.p.some(p => p.slug === s)), 'las 25 plataformas, dentro');
    assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === FECHA));
    const sinLote = x => { const { revision_id, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas, ...r } = x; return r; };
    for (const o of v0.o) assert.deepEqual(sinLote(v1.o.find(x => x.slug === o.slug)), sinLote(o), `${o.slug}: igual que en la ${DESDE}`);
    for (const p of v0.p) assert.deepEqual(sinLote(v1.p.find(x => x.slug === p.slug)), sinLote(p), `${p.slug}: igual que en la ${DESDE}`);
    for (const { oferta: x } of A.ofertas) {
      const o = v1.o.find(y => y.slug === x.slug);
      assert.deepEqual([o.titulo, o.plataforma_slug, o.coleccion, o.rentabilidad?.mostrada ?? null, o.disponible_es, o.url],
        [x.titulo, x.plataformaSlug, x.coleccion, x.rentabilidad?.mostrada ?? null, x.disponibleEs, x.url], `${x.slug}: como en altas.json`);
    }
    assert.deepEqual(v1.d, v0.d, 'las 5 descartadas, iguales');
    ok(`publicada la revisión nueva: ${NP} plataformas y 32 ofertas (17 principales, 13 de reventa y 2 en camino); las ${PALTAS.length} plataformas nuevas, con sus datos de altas.json; las 32 ofertas y las 32 plataformas de antes, idénticas a la ${DESDE} salvo la revisión y el manifiesto del lote (32 → ${NP} plataformas); las 5 descartadas, iguales`);

    const lector = hoy => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy, permitirAmpliacion: true });
    const r = lector(FECHA);
    assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.ofertasEsperadas, 32);
    assert.deepEqual(r.manifiesto.coleccionesEsperadas, COL);
    lector(ULTIMO);
    assert.throws(() => lector('2026-12-04'), /caducad/);
    assert.ok(v1.o.every(o => !pinta(o, ULTIMO).vencida && pinta(o, '2026-12-04').vencida), 'las 32 tarjetas valen hasta el 03/12');
    const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date(`${FECHA}T12:00:00Z`));
    assert.equal(movil.plataformas.length, NP); assert.equal(movil.ofertas.length, 32);
    assert.equal(movil.ofertas.filter(o => o.coleccion === 'en_camino').length, 2);
    for (const o of v0.o) assert.deepEqual(pinta(v1.o.find(x => x.slug === o.slug), FECHA), pinta(o, FECHA), `${o.slug}: la tarjeta no cambia`);
    const tarjetas = Object.fromEntries(ALTAS.map(s => [s, pinta(v1.o.find(o => o.slug === s), FECHA)]));
    informe.tarjetasNuevas = tarjetas;
    for (const [s, t] of Object.entries(tarjetas)) assert.ok(t.minimo && t.espana && t.salida, `${s}: tarjeta completa`);
    ok(`lector de la web (validarLotePublicoV2) y de la app (adaptarCatalogoV2): aceptan ${NP} plataformas y 32 ofertas con 2 en camino; vale el 26/11 y el 03/12 y caduca el 04/12; las 32 tarjetas se ven igual que antes`);

    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-1126-4-'));
    try {
      const jsPath = path.join(temporal, 'catalogo.js');
      fs.copyFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
      const fetchFn = async url => ({ ok: true, json: async () => structuredClone(
        url.includes('catalogo_plataformas_publicas_v2') ? v1.p : url.includes('catalogo_ofertas_publicas_v2') ? v1.o : v1.d) });
      const log = console.log; console.log = () => {};
      try { await sincronizar({ fetchFn, jsPath, csvPath: path.join(temporal, 'rwadar.csv'), hoy: new Date(`${FECHA}T12:00:00Z`),
        versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); } finally { console.log = log; }
      const snap = fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8'));
      assert.equal(snap.plataformas.length, NP); assert.equal(snap.ofertas.length, 32); assert.equal(snap.fuera.length, 5);
      assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + NP + 5);
      const faltan = NUEVAS_PAGINAS.filter(r => !manifiestoFichas.includes(r));
      if (faltan.length) assert.throws(() => fichas.construirSalidas({ catalogo: snap }), /manifiesto cerrado/i, 'sin ampliar la lista cerrada no se publica');
      const salidas = fichas.construirSalidas({ catalogo: snap, paginasPermitidas: listaDespues });
      const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
      assert.deepEqual(paginas.sort(), listaDespues.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort());
      for (const r of NUEVAS_PAGINAS) {
        assert.ok(salidas.has(r), `${r}: página`);
        assert.ok(salidas.get('sitemap.xml').includes(`/${r.replace(/\.html$/, '')}<`), `${r}: en el sitemap`);
      }
      ok(`sincronizador real con estas vistas: ${NP} plataformas, 32 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas); ${faltan.length ? `sin añadir las ${faltan.length} páginas nuevas a la lista cerrada las fichas no se generan; ` : ''}con la lista nueva salen ${paginas.length} páginas, las ${NUEVAS_PAGINAS.length} nuevas incluidas y en el sitemap`);

      const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(path.join(ROOT, 'rwadar-acceso'), { fichas: listaDespues })).toString('base64'))).default;
      for (const r of NUEVAS_PAGINAS) {
        const ruta = '/' + r.replace(/\.html$/, '');
        const res = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), { ASSETS: { fetch: async () => new Response('contenido') } }, { waitUntil() {} });
        assert.equal(res.status, 200, ruta);
      }
      ok(`worker con la lista nueva: las ${NUEVAS_PAGINAS.length} fichas de plataforma nuevas se sirven`);
    } finally { fs.rmSync(temporal, { recursive: true, force: true }); }

    if (exportar) {
      fs.mkdirSync(exportar, { recursive: true });
      await sesion(db, null, 'anon');
      const escribe = (nombre, datos) => fs.writeFileSync(path.join(exportar, nombre), JSON.stringify(datos));
      escribe('catalogo_plataformas_publicas_v2.json', v1.p);
      escribe('catalogo_ofertas_publicas_v2.json', v1.o);
      escribe('descartadas-sincronizar.json', await filas(db, DESCARTADAS.replace(' order by f.url', '')));
      escribe('catalogo_publicacion.json', await filas(db, 'select retirado, motivo from public.catalogo_publicacion'));
      // Lo que lee volcar-seed.js (con las plataformas y la región nuevas).
      escribe('categorias.json', await filas(db, 'select * from public.categorias order by orden'));
      escribe('regiones.json', await filas(db, 'select * from public.regiones order by slug'));
      escribe('radar_publico.json', api(await filas(db, 'select * from public.radar_publico')));
      escribe('descartadas-volcar.json', api(await filas(db, `select p.slug, p.nombre, p.etiqueta_descarte, p.motivo_descarte, p.verificada_el,
        coalesce((select json_agg(json_build_object('url', f.url, 'titulo', f.titulo, 'publicada_el', f.publicada_el, 'consultada_el', f.consultada_el))
          from public.fuentes f where f.plataforma_id = p.id), '[]') as fuentes
        from public.plataformas p where p.estado = 'descartada' order by p.slug`)));
      await sesion(db);
      ok(`exportado a ${exportar} lo que leería un visitante después de aplicar`);
    }
  } finally { await db.close(); }
}

await caso('la revisión nueva ya estaba importada como borrador (con sus plataformas)',
  `${bloquePublicoDe(SQL)}\n${fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8')}`, false,
  async (db, antes, despues) => {
    assert.equal(JSON.parse(antes.publicacion)[0].revision_id, PREVIA);
    assert.equal(JSON.parse(despues.publicacion)[0].revision_id, NUEVA);
    assert.equal(despues.catalogo, antes.catalogo, 'no duplica filas');
    assert.equal(despues.plataformas, antes.plataformas, 'no duplica ni cambia plataformas');
    ok('si la revisión nueva y sus plataformas ya estaban dentro, el aplicador la aprueba y la publica sin duplicar ni cambiar filas');
    return { publicada: NUEVA };
  });
function bloquePublicoDe(sql) {
  const i = sql.indexOf('do $publico_guarda$'), j = sql.indexOf('end $publico_comprobar$;') + 'end $publico_comprobar$;'.length;
  assert.ok(i > 0 && j > i); return sql.slice(i, j);
}

// ---------------------------------------------------------------- 4 · producción distinta
await caso(`la publicada no es la 2026-11-26.3 (es la 2026-11-26.2, ${REV_262.slice(0, 8)})`, `update rwadar_catalogo.publicacion_v2 set revision_id = '${REV_262}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('la revisión destino ya existe con otra huella',
  `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', 32, 32, '{"principales":17,"secundario":13,"en_camino":2}'); set session_replication_role = origin;`,
  /otra identidad/);
{
  const caducado = SQL.replace(TOPE, TOPE.replace(`'${revision.venceTrasEl}'`, "'2026-11-25'"));
  assert.notEqual(caducado, SQL);
  await caso('aplicada después del último día vigente (lote caducado)', null, /Lote caducado/, null, caducado);
}
await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
  `set session_replication_role = replica; update public.plataformas set slug = 'addx-prueba' where slug = 'addx'; set session_replication_role = origin;`,
  /incompleto|null value|no tiene 32/);
await caso('una plataforma nueva ya existe con otros datos',
  `${bloquePublicoDe(SQL)}\nupdate public.plataformas set nota = 'Otra nota de prueba.' where slug = 'mesh';`,
  /mesh ya existe con otros datos/);
await caso('una región ya existe con otro nombre', `insert into public.regiones (slug,nombre) values ('africa','Africa');`, /otro nombre/);
await caso('el radar no tiene las 32 plataformas previstas (hay una más)',
  `insert into public.plataformas (slug,nombre,estado,categoria_slug,region_slug,actor,acceso,ticket,cadenas,web,aval,nota)
   select 'prueba-extra',nombre,estado,categoria_slug,region_slug,actor,acceso,ticket,cadenas,web,aval,nota from public.plataformas where slug = 'addx';`,
  /no tiene 32/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length, lecturaPublica: informe.lecturaPublica }, null, 1));
