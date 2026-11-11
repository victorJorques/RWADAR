// Ensayo local de la entrega «2026-11-11» en PGlite, sin red, sobre la misma cadena que producción:
// la instalación con el 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql, la copia fija de
// 02_seed.sql de entonces) y los lotes del 22/10 al 2026-11-10, que deja publicada la dfdc4c85.
//   1. qué sentencias lleva el SQL y qué tablas toca (solo rwadar_catalogo y la aprobación);
//   2. antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante (lectura-publica/);
//   3. con producción como se espera: la revisión nueva queda publicada con las mismas 25 plataformas
//      y 22 ofertas (8/13/1), fechadas el 11/11 y con 7 días (vale el 18/11, caduca el 19/11);
//      idempotente; public.plataformas, public.fuentes y el historial, intactos; cada cifra y texto
//      cambiado (contraste-2026-11-11.json), uno a uno; lo que no se aplicó sigue como estaba; qué verá
//      el inversor en cada tarjeta (mínimo, España y salida, con resumenOferta); lo que leen la web
//      (sincronizador y fichas) y la app;
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra
//      identidad o una plataforma que falta) o aplicado después del 18/11 (lote caducado), falla y no
//      deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-11-v2/comprobar-entrega.mjs [--exportar=DIR]
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
const { resumenOferta, idiomaCita } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const manifiestoFichas = require(path.join(ROOT, 'rwadar-fichas-manifiesto.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-11', FECHA = '2026-11-11', DESDE = '2026-11-10', ULTIMO = '2026-11-18', CADUCA = '2026-11-19';
const COLECCIONES = { principales: 8, secundario: 13, en_camino: 1 };
const exportar = (process.argv.find(a => a.startsWith('--exportar=')) || '').slice('--exportar='.length);
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
// La huella de la publicada sale de construir la 2026-11-10 local, como pide la guarda.
const previa = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: DESDE, versionEsquema: 2 }));
assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA]);
assert.deepEqual([PREVIA, HASH_PREVIA], ['dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656', 'dfdc4c857f2ffc4ade27a9f4a63f7656ab4be9edc43d0037d0ad42fb94ac015f']);
assert.equal(revision.venceTrasEl, ULTIMO);
const contraste = leer(path.join(DIR, `contraste-${ETIQUETA}.json`));
assert.deepEqual([contraste.revisionAnterior, contraste.revisionNueva], [PREVIA, NUEVA]);
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7', '2026-11-04', '2026-11-04.2', '2026-11-05', '2026-11-05.2', '2026-11-10'];
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
const cuenta = Object.fromEntries([...new Set(escrituras)].sort().map(e => [e, escrituras.filter(x => x === e).length]));
assert.deepEqual(Object.keys(cuenta), ['rwadar_catalogo.alerta_fuentes', 'rwadar_catalogo.alertas', 'rwadar_catalogo.fuentes',
  'rwadar_catalogo.ofertas', 'rwadar_catalogo.plataforma_fuentes', 'rwadar_catalogo.plataformas', 'rwadar_catalogo.revisiones']);
assert.equal(cuenta['rwadar_catalogo.revisiones'], 1); assert.equal(cuenta['rwadar_catalogo.plataformas'], 25);
assert.equal(cuenta['rwadar_catalogo.ofertas'], 22); assert.equal(cuenta['rwadar_catalogo.fuentes'], 69);
// Mismas filas por tabla que la entrega publicada (hoy no cambia ninguna dirección ni ningún texto del radar).
{
  const sqlPrevia = fs.readFileSync(path.join(APP, `data/importaciones/catalogo-${DESDE}-v2/aplicar-y-aprobar.sql`), 'utf8');
  const sp = sqlPrevia.replace(/^do \$(\w+)\$\n[\s\S]*?^end \$\1\$;$/gm, '').split('\n').map(l => l.match(/^insert into ([\w.]+)/)?.[1]).filter(Boolean);
  const cp = Object.fromEntries([...new Set(sp)].sort().map(e => [e, sp.filter(x => x === e).length]));
  assert.deepEqual(cuenta, cp, 'mismas filas por tabla que la 2026-11-10');
}
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.endsWith(' on conflict (id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,id) do nothing;') || l.endsWith(' on conflict (revision_id,plataforma_id) do nothing;') ||
  l.endsWith(' on conflict (revision_id,slug) do nothing;') || l.endsWith(' on conflict do nothing;')), 'todos los inserts son idempotentes');
assert.ok(sentencias.filter(l => l.startsWith('insert')).every(l => l.includes(`'${NUEVA}'::uuid`)), 'todos los inserts son de la revisión nueva');
assert.doesNotMatch(SQL, /^\s*(?:insert\s+into|update|delete\s+from)\s+public\./im, 'nada escribe en public.*');
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.equal(SQL.match(/^begin(?: isolation level serializable)?;$/gm).length, 1); assert.equal(SQL.match(/^commit;$/gm).length, 1);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
assert.ok(SQL.includes(`contenido_sha256 = '${HASH_PREVIA}' and estado = 'aprobada'`), 'la guarda exige la huella de la publicada');
assert.ok(bloques[0][2].includes(`actual not in ('${PREVIA}'::uuid, '${NUEVA}'::uuid)`), 'la guarda exige la publicada exacta');
assert.ok(bloques[0][2].includes('select retirado into retirada from public.catalogo_publicacion where unica for update'), 'la guarda mira si el catálogo está retirado');
assert.ok(bloques[0][2].includes(`if current_date < date '${FECHA}' then raise exception 'Revisión futura'`));
const TOPE = `  if current_date > date '${ULTIMO}' then\n    raise exception 'Lote caducado`;
assert.equal(bloques[0][2].split(TOPE).length, 2, 'la guarda tiene la fecha tope del 18/11');
for (const c of ['principales', 'secundario', 'en_camino'])
  assert.ok(bloques[1][2].includes(`coleccion = '${c}') <> ${COLECCIONES[c]}`), `la aprobación exige ${COLECCIONES[c]} en ${c}`);
assert.ok(SQL.split('\n')[0].endsWith('Ciclo pedido y autorizado por el responsable del proyecto.') && SQL.includes('Puesta al día pedida por el responsable del proyecto el 11/11/2026'), 'cabecera y referencia de aprobación sin nombres de personas');
informe.inventario = cuenta;
informe.sentencias = { total: sentencias.length + bloques.length, inserts: escrituras.length, bloquesDo: bloques.map(b => b[1]), otras: ['begin isolation level serializable;', 'commit;'] };
ok(`inventario: ${informe.sentencias.total} sentencias en una transacción serializable (begin, guarda, ${escrituras.length} inserts, aprobación, commit); guarda (publicada dfdc4c85 con su huella ${HASH_PREVIA.slice(0, 12)}…, catálogo no retirado, fecha del 11/11 al 18/11, destino sin otra identidad); solo inserts en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}; las mismas filas por tabla que la 2026-11-10), todos idempotentes y de la revisión nueva; la aprobación solo cambia rwadar_catalogo.revisiones; sin DDL, borrados, permisos, Auth ni funciones; nada en public.*`);

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
// Quita lo que cambia en todas las fichas por la fecha (para comparar el resto tal cual).
const CANONICA = /^(?:M[ií]nimo de inversi[oó]n|Acceso desde Espa[ñn]a|Salida|Reembolso)(?: \([^)]{1,60}\))?$/;
const sinFechas = o => {
  const { revision_id, verificada_el, verificado_lote_el, ...r } = structuredClone(o);
  r.avisos = r.avisos.map(({ verificadaEl, ...a }) => a);
  if (r.documentacion) {
    delete r.documentacion.revisadaEl;
    r.documentacion.referencias = r.documentacion.referencias.map(x => CANONICA.test(x.etiqueta) ? { ...x, fechaConsulta: '', alcance: '' } : x);
  }
  return r;
};

// ---------------------------------------------------------------- 2 y 3 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    ok(`cadena de producción (seed del 04/11 antes de ARTEX + ${LOTES.length} lotes, del 22/10 a la 2026-11-10): la publicada es la dfdc4c85`);

    // Lo que enseña PGlite antes de aplicar es lo que se leyó hoy como visitante (09:01:21–09:01:25 UTC).
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
    assert.equal(v0.d.length, 5);
    ok('antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante: 25 plataformas, 22 ofertas (8/13/1) y las 30 filas de public.plataformas (25 en el radar y 5 descartadas); tolerancias de siempre: el uuid de cada plataforma (se genera al instalar), «publicadaEl» de las fuentes del radar (la base no la guarda) y el orden de las fuentes de cada campo');

    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    assert.deepEqual(await vistas(db), v1, 'idempotencia (vistas)');
    ok('idempotente: aplicarla dos veces da lo mismo (tablas y vistas)');

    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.equal(f1.retirado, f0.retirado);
    for (const k of ['plataformas', 'fuentes', 'cambios', 'avisosCorreo', 'avisosPush', 'emisiones']) assert.equal(f1[k], f0[k], `public: ${k} intacto`);
    const revs0 = JSON.parse(f0.revisiones), revs1 = JSON.parse(f1.revisiones);
    assert.deepEqual(revs1.filter(r => r.id !== NUEVA), revs0, 'las revisiones anteriores, intactas (historial)');
    assert.equal(revs1.find(r => r.id === NUEVA).estado, 'aprobada');
    assert.equal(revs1.find(r => r.id === NUEVA).contenido_sha256, revision.hash);
    assert.equal(revs0.find(r => r.id === PREVIA).estado, 'aprobada');
    const c0 = JSON.parse(f0.catalogo)[0], c1 = JSON.parse(f1.catalogo)[0];
    assert.deepEqual({ p: c1.p - c0.p, o: c1.o - c0.o, f: c1.f - c0.f }, { p: 25, o: 22, f: 69 }, 'solo se añaden las filas de la revisión nueva');
    ok(`public.plataformas, public.fuentes, cambios de estado, avisos y emisiones, intactos; las ${revs0.length} revisiones anteriores se conservan tal cual (historial, con la dfdc4c85 aprobada) y la nueva queda aprobada con su huella; rwadar_catalogo gana justo 25 plataformas, 22 ofertas y 69 fuentes`);

    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 25 && v1.o.length === 22);
    assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === 25 && x.ofertas_esperadas === 22 &&
      isDeepStrictEqual(x.colecciones_esperadas, COLECCIONES)));
    assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === FECHA));
    assert.deepEqual(v1.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]), v0.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]),
      'mismas 22 fichas, en el mismo orden, colecciones, plataformas y estados');
    assert.deepEqual(v1.p.map(p => p.slug), v0.p.map(p => p.slug), 'mismas 25 plataformas');
    const col = Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length]));
    assert.deepEqual(col, COLECCIONES);
    assert.deepEqual(v1.d, v0.d, 'las 5 descartadas, iguales');
    ok('publicada la revisión nueva: las mismas 25 plataformas y 22 fichas (8 principales, 13 de reventa y 1 en camino; mismos estados de revisión), fechadas el 11/11 con 7 días; las 5 descartadas, iguales');

    // Plataformas: solo cambian la revisión, la fecha del lote y las fechas de la verificación.
    const fechasFuera = x => JSON.parse(JSON.stringify(x), (k, v) => ['verificadoEl', 'consultadaEl'].includes(k) ? 'F' : v);
    for (const p of v1.p) {
      const a = v0.p.find(x => x.slug === p.slug);
      const resto = x => { const { revision_id, verificado_lote_el, verificacion_local, ...r } = x; return r; };
      assert.deepEqual(resto(p), resto(a), `${p.slug}: columnas iguales`);
      assert.deepEqual(fechasFuera(p.verificacion_local), fechasFuera(a.verificacion_local), `${p.slug}: verificación igual salvo fechas`);
      assert.equal(p.verificacion_local.verificadoEl, FECHA);
      assert.ok(JSON.stringify(p.verificacion_local).match(/"consultadaEl":"[^"]+"/g).every(m => m.includes(FECHA)), `${p.slug}: fuentes consultadas el 11/11`);
    }
    ok('plataformas: iguales salvo la revisión, la fecha del lote (11/11) y las fechas de su verificación (cada fuente del radar, consultada el 11/11); ningún texto del radar cambia');

    // Cada cifra y texto cambiado (contraste-2026-11-11.json), uno a uno, en lo que lee un visitante.
    const porSlug = l => new Map(l.map(o => [o.slug, o]));
    const o0 = porSlug(v0.o), o1 = porSlug(v1.o);
    // La vista enmascara el resumen y las métricas de las fichas que no están «actual» (mTBILL, en conflicto; las
    // 13 de reventa y Hausera, «no_verificable», como exige la base de datos para las documentales): el visitante
    // ve «Condiciones/Cifras pendientes de nueva revisión», igual que hoy. Sus textos se leen en rwadar_catalogo.ofertas.
    const tabla = new Map((await filas(db, `select slug, metricas, avisos, resumen, rentabilidad, documentacion, fuentes_actuales from rwadar_catalogo.ofertas where revision_id = '${NUEVA}'`)).map(x => [x.slug, x]));
    const enmascaradas = v1.o.filter(o => o.estado_revision !== 'actual').map(o => o.slug);
    assert.equal(enmascaradas.length, 15);
    assert.deepEqual(v1.o.filter(o => o.estado_revision === 'actual').map(o => o.coleccion), Array(7).fill('principales'));
    for (const s of enmascaradas) {
      assert.deepEqual([o1.get(s).resumen, o1.get(s).metricas], [o0.get(s).resumen, o0.get(s).metricas], `${s}: la vista la sigue enmascarando igual que hoy`);
      assert.match(o1.get(s).resumen, /^Condiciones pendientes de nueva revisión/);
    }
    const ver = slug => enmascaradas.includes(slug) ? { ...o1.get(slug), ...tabla.get(slug) } : o1.get(slug);
    const comprobados = [];
    for (const c of contraste.cambios) {
      const o = ver(c.slug), d = o.documentacion;
      const textos = { aviso: o.avisos.map(a => a.texto), 'métrica': o.metricas.map(m => `${m.etiqueta}: ${m.valor}`),
        'referencia de la ficha': d.referencias.map(r => `${r.etiqueta}: ${r.valor}`), tarjeta: d.referencias.map(r => `${r.etiqueta}: ${r.valor}`),
        'fuente de la ficha': d.fuentes, 'característica': d.caracteristicas.map(x => `${x.etiqueta}: ${x.valor}`) };
      if (c.campo === 'rentabilidad') { assert.equal(`${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}`, c.despues, `${c.slug}: rentabilidad`); }
      else {
        const l = textos[c.campo]; assert.ok(l, `campo desconocido ${c.campo}`);
        if (c.despues) assert.ok(l.includes(c.despues), `${c.slug}: falta «${c.despues}»`);
      }
      comprobados.push(c.slug);
    }
    // Cada cambio, también al revés: nada de lo de antes sigue (salvo que el «antes» y el «ahora» coincidan).
    for (const c of contraste.cambios.filter(x => x.antes && ['aviso', 'métrica', 'referencia de la ficha', 'tarjeta', 'característica'].includes(x.campo))) {
      const o = ver(c.slug), d = o.documentacion;
      const l = c.campo === 'aviso' ? o.avisos.map(a => a.texto) : c.campo === 'métrica' ? o.metricas.map(m => `${m.etiqueta}: ${m.valor}`)
        : c.campo === 'característica' ? d.caracteristicas.map(x => `${x.etiqueta}: ${x.valor}`) : d.referencias.map(r => `${r.etiqueta}: ${r.valor}`);
      if (c.antes !== c.despues) assert.ok(!l.includes(c.antes), `${c.slug}: sigue publicado «${c.antes}»`);
    }
    // Las cuatro sin cambios (DECISIONES §2): iguales a la dfdc4c85 salvo las fechas.
    // También en rwadar_catalogo.ofertas (lo que la vista enmascara, como el resumen y las métricas de Hausera).
    const tabla0 = new Map((await filas(db, `select slug, metricas, avisos, resumen, rentabilidad, documentacion, fuentes_actuales from rwadar_catalogo.ofertas where revision_id = '${PREVIA}'`)).map(x => [x.slug, x]));
    for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'hausera-proximas-ofertas']) {
      assert.deepEqual(sinFechas(o1.get(slug)), sinFechas(o0.get(slug)), `${slug}: solo cambian las fechas`);
      assert.deepEqual(sinFechas({ ...tabla.get(slug), revision_id: 0 }), sinFechas({ ...tabla0.get(slug), revision_id: 0 }), `${slug}: en rwadar_catalogo, solo cambian las fechas`);
    }
    // Y en las demás, todo lo que no está en el contraste sigue igual.
    for (const o of v1.o) {
      const a = sinFechas(o0.get(o.slug)), b = sinFechas(o);
      for (const k of Object.keys(a)) if (!['avisos', 'metricas', 'rentabilidad', 'documentacion'].includes(k))
        assert.deepEqual(b[k], a[k], `${o.slug}.${k}`);
      assert.ok(o.avisos.every(x => x.verificadaEl === FECHA), `${o.slug}: avisos comprobados el 11/11`);
    }
    informe.cambiosComprobados = { total: contraste.cambios.length, fichas: [...new Set(comprobados)].length };
    // Las cifras, una a una.
    const cifra = (slug, etiqueta) => ver(slug).metricas.find(m => m.etiqueta === etiqueta)?.valor;
    assert.equal(o1.get('spiko-letras-del-tesoro-euro').rentabilidad.mostrada, '2,41 %'); assert.equal(o0.get('spiko-letras-del-tesoro-euro').rentabilidad.mostrada, '2,44 %');
    assert.equal(o1.get('spiko-letras-del-tesoro-dolar').rentabilidad.mostrada, '4,02 %'); assert.equal(o0.get('spiko-letras-del-tesoro-dolar').rentabilidad.mostrada, '4,09 %');
    assert.equal(o1.get('spiko-smart-cash-euro').rentabilidad.mostrada, '2,84 %');
    assert.equal(cifra('spiko-letras-del-tesoro-euro', 'Rentabilidad publicada · 31 días · 11/11/2026'), '2,41 %');
    assert.equal(cifra('spiko-letras-del-tesoro-dolar', 'Rentabilidad publicada · 31 días · 10/11/2026 · en USD'), '4,02 %');
    assert.equal(cifra('spiko-smart-cash-euro', 'Rentabilidad publicada · neta y variable · 10/11/2026'), '2,84 %');
    assert.match(o1.get('spiko-letras-del-tesoro-euro').rentabilidad.literal, /VL fechada el 11\/11\/2026\); consultado el 11\/11\/2026/);
    assert.match(o1.get('spiko-letras-del-tesoro-dolar').rentabilidad.literal, /\(VL del 10\/11\/2026\); consultado el 11\/11\/2026/);
    assert.match(o1.get('spiko-smart-cash-euro').rentabilidad.literal, /valor liquidativo del 10\/11\/2026; consultado el 11\/11\/2026/);
    for (const s of ['spiko-letras-del-tesoro-euro', 'spiko-letras-del-tesoro-dolar', 'spiko-smart-cash-euro']) {
      assert.ok(!o1.get(s).metricas.some(m => /09\/11\/2026/.test(m.etiqueta)), `${s}: sin la métrica vieja`);
      assert.ok(!JSON.stringify(o1.get(s).rentabilidad).includes('09/11/2026'), `${s}: sin la VL vieja en el literal`);
      assert.deepEqual(o1.get(s).fuentes_actuales, o0.get(s).fuentes_actuales, `${s}: fuentes de la oferta sin cambios`);
    }
    assert.equal(o1.get('spiko-smart-cash-euro').avisos.length, o0.get('spiko-smart-cash-euro').avisos.length);
    assert.equal(cifra('mtbill', 'Valor por token · 10/11/2026'), '1,0777 USD (oráculo del emisor)');
    assert.equal(o1.get('mtbill').estado_revision, 'fuentes_en_conflicto'); assert.equal(ver('mtbill').rentabilidad, null);
    assert.doesNotMatch(JSON.stringify(ver('mtbill')), /lista blanca|greenlist|whitelist/i);
    assert.deepEqual(ver('mtbill').documentacion.referencias.filter(r => CANONICA.test(r.etiqueta)), [], 'mTBILL: sin datos de tarjeta propios');
    assert.equal(cifra('aktionariat', 'Precio del emisor · 11/11/2026'), '7,25 CHF por acción (fijo)');
    assert.ok(['aktionariat', 'boss-info'].every(s => /FINMA \(11\/11\/2026\)$/.test(cifra(s, 'Supervisor'))) && /FINMA \(11\/11\/2026\); afiliada/.test(cifra('switzerlend', 'Supervisor')));
    // Lo que DECISIONES no recoge sigue como estaba (noAplicadoTalCual del contraste).
    const ref = (slug, etiqueta) => ver(slug).documentacion.referencias.filter(r => r.etiqueta === etiqueta).map(r => r.valor);
    assert.deepEqual(ref('vivienda-schwarzer-weg-18-graz', 'Participaciones en venta · 10/11/2026'), ['300']);
    assert.deepEqual(ref('vivienda-schwarzer-weg-18-graz', 'Participaciones en venta · 11/11/2026'), []);
    assert.deepEqual(ref('boss-info', 'Última operación · 10/11/2026'), ['8,40 ZCHF (1 acción, 05/11/2026)']);
    assert.deepEqual(contraste.noAplicadoTalCual.map(x => x.slug), ['mtbill', 'boss-info', 'vivienda-schwarzer-weg-18-graz']);
    assert.deepEqual(ref('vivienda-schwarzer-weg-18-graz', 'Mejor oferta de compra · 11/11/2026'), ['60,00 € (1 participación, orden del 10/11/2026)']);
    assert.deepEqual(ref('randhartingergasse-9-viena', 'Mejor oferta de compra · 11/11/2026'), ['56,00 € (1 participación, orden del 10/11/2026)']);
    informe.cifras = { 'spiko-letras-del-tesoro-euro': '2,44 % → 2,41 % (VL fechada el 11/11)', 'spiko-letras-del-tesoro-dolar': '4,09 % → 4,02 % (USD, VL del 10/11)',
      'spiko-smart-cash-euro': '2,84 % (VL 09/11 → 10/11)', mtbill: '1,0776 → 1,0777 USD (oráculo, 09/11 → 10/11)', aktionariat: '7,25 CHF (10/11 → 11/11)' };
    ok(`cada cambio de contraste-2026-11-11.json está en lo que lee un visitante (${contraste.cambios.length} cambios en ${informe.cambiosComprobados.fichas} fichas) y lo de antes ya no; Spiko Euro (Letras) 2,44 % → 2,41 %, Dólar 4,09 % → 4,02 % (USD), Spiko Euro 2,84 % con la VL del 10/11; mTBILL 1,0777 USD (en rwadar_catalogo), sigue en conflicto, sin APY y sin datos de tarjeta propios; Aktionariat, Boss Info y Switzerlend con fechas del 11/11; Brickwise con la mejor compra nueva (Schwarzer Weg 60 €, Randhartingergasse 56 €); lo no aplicado sigue como estaba («Participaciones en venta · 10/11/2026: 300» de Schwarzer Weg y «Última operación · 10/11/2026» de Boss Info); Robinhood, Kraken, Prosegur y Hausera, iguales salvo las fechas; todos los avisos con fecha del 11/11; la vista sigue enmascarando el resumen y las métricas de las ${enmascaradas.length} fichas que no están «actual», igual que hoy`);

    // Vigencia: siete días desde el 11/11.
    const lector = hoy => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy, permitirAmpliacion: true });
    const r = lector(FECHA);
    assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.plataformasEsperadas, 25); assert.equal(r.manifiesto.ofertasEsperadas, 22);
    assert.deepEqual(r.manifiesto.coleccionesEsperadas, COLECCIONES);
    lector(ULTIMO);
    assert.throws(() => lector(CADUCA), /caducad/);
    assert.ok(v1.o.every(o => !pinta(o, ULTIMO).vencida && pinta(o, CADUCA).vencida), 'las 22 tarjetas valen hasta el 18/11');
    const { adaptarCatalogoV2 } = require(path.join(ROOT, 'rwadar-movil/lib/catalogo-remoto.js'));
    assert.equal(typeof adaptarCatalogoV2, 'function');
    const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date(`${FECHA}T12:00:00Z`));
    assert.equal(movil.plataformas.length, 25); assert.equal(movil.ofertas.length, 22);
    assert.equal(movil.ofertas.filter(o => o.coleccion === 'en_camino').length, 1);
    ok('vigencia: el lector de la web (validarLotePublicoV2) lo acepta el 11/11 y el 18/11 y lo da por caducado el 19/11; las 22 tarjetas ocultan cifras desde el 19/11; el lector de la app (adaptarCatalogoV2) lo acepta (25/22, 1 en camino)');

    // Qué verá el inversor en cada tarjeta: mínimo, acceso desde España y salida.
    informe.tarjetas = {};
    for (const o of v1.o) {
      const ahora = pinta(o, FECHA), antes = pinta(o0.get(o.slug), FECHA);
      for (const k of ['minimo', 'espana', 'salida']) {
        assert.ok(['', 'es'].includes(idiomaCita(ahora[k])), `${o.slug}.${k}: «${ahora[k]}» parece una cita en otro idioma`);
        assert.ok(ahora[k].length <= 175, `${o.slug}.${k}: demasiado largo`);
      }
      assert.doesNotMatch(ahora.minimo.normalize('NFD').replace(/[̀-ͯ]/g, ''), /por (?:token|participacion|accion)/i);
      assert.ok(!ahora.vencida, o.slug);
      assert.equal(ahora.espana, antes.espana, `${o.slug}: el acceso desde España de la tarjeta no cambia`);
      assert.equal(ahora.salida, antes.salida, `${o.slug}: la salida de la tarjeta no cambia`);
      assert.equal(ahora.estado, antes.estado, `${o.slug}: el estado de la tarjeta no cambia`);
      informe.tarjetas[o.slug] = { coleccion: o.coleccion, estado: ahora.estado, minimo: ahora.minimo, espana: ahora.espana, salida: ahora.salida,
        ...(JSON.stringify([antes.minimo, antes.espana, antes.salida, antes.estado]) !== JSON.stringify([ahora.minimo, ahora.espana, ahora.salida, ahora.estado])
          ? { antes: { minimo: antes.minimo, espana: antes.espana, salida: antes.salida, estado: antes.estado } } : {}) };
    }
    const t = informe.tarjetas;
    const BW = { 'vivienda-pluddemanngasse-101-graz': '75', 'vivienda-sonnleithnergasse-2-viena': '75', 'local-de-estanco-klagenfurt': '95',
      'vivienda-stallhofstra-e-28-gratwein': '68,80', 'vivienda-schwarzer-weg-18-graz': '69,90', 'drautalresidenz-paternion': '70',
      'randhartingergasse-9-viena': '78', 'apartamento-vacacional-hinterstoder-50': '75', 'vivienda-pottendorfer-stra-e-62-wr-neustadt': '73',
      'fotovoltaica-greenpoint': '100', 'fotovoltaica-cohotel': '110' };
    for (const [slug, precio] of Object.entries(BW)) assert.equal(t[slug].minimo, `Desde ${precio} € la participación en reventa (11/11)`, slug);
    assert.equal(t['vivienda-schwarzer-weg-18-graz'].antes.minimo, 'Desde 65 € la participación en reventa (10/11)');
    assert.equal(t['vivienda-pottendorfer-stra-e-62-wr-neustadt'].antes.minimo, 'Desde 74 € la participación en reventa (10/11)');
    assert.equal(t['boss-info'].minimo, '100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 11/11)');
    assert.equal(t.switzerlend.minimo, '1 acción (68,01 CHF el 11/11)');
    // Suizas (opción (a)): acceso y salida, los publicados.
    assert.equal(t['boss-info'].salida, 'Salida: El emisor no recompra ahora; vendes a otros accionistas en ZCHF si hay comprador');
    assert.equal(t.switzerlend.salida, 'Salida: El emisor no recompra hoy (su web dice lo contrario); vendes a otros accionistas en ZCHF si hay comprador');
    assert.equal(t.aktionariat.minimo, '500 CHF por transferencia bancaria'); assert.equal(t.aktionariat.salida, 'Salida: Venta solo a otros accionistas; el emisor no recompra');
    assert.equal(t['hausera-proximas-ofertas'].minimo, 'Desde 100 € en Alicante 3, según su documento de emisión (10/11); la preventa abre el 18/11.');
    assert.deepEqual([t.mtbill.minimo, t.mtbill.espana, t.mtbill.salida, t.mtbill.estado],
      ['Sin mínimo vigente en euros', 'Sin comprobar si se puede contratar desde España', 'Salida no documentada', 'Las fuentes no coinciden']);
    for (const slug of ['robinhood-classic-stock-tokens', 'kraken-xstocks', 'prosegur-digital-gold', 'spiko-letras-del-tesoro-euro',
      'spiko-letras-del-tesoro-dolar', 'spiko-smart-cash-euro', 'mtbill', 'aktionariat', 'hausera-proximas-ofertas']) assert.ok(!t[slug].antes, `${slug}: la tarjeta no cambia`);
    const cambiadas = Object.entries(t).filter(([, x]) => x.antes).map(([s]) => s);
    assert.equal(cambiadas.length, 13);
    ok(`tarjetas (resumenOferta, 11/11): las 22 en castellano, sin citas en otro idioma y sin «por participación» en el mínimo; el acceso desde España, la salida y el estado no cambian en ninguna; cambia solo el mínimo en ${cambiadas.length}: ${cambiadas.join(', ')}; Brickwise «Desde X € la participación en reventa (11/11)» (Schwarzer Weg 65 → 69,90, Pottendorfer 74 → 73; las otras 9, solo la fecha); Boss Info y Switzerlend con fecha del 11/11; Aktionariat, Hausera y las 8 principales, igual; mTBILL «${t.mtbill.minimo}» · «${t.mtbill.espana}» · «${t.mtbill.salida}» (fuentes en conflicto)`);

    // El sincronizador real, contra estas vistas, en una copia temporal del catálogo de la web.
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-1111-'));
    try {
      const jsPath = path.join(temporal, 'catalogo.js');
      fs.copyFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
      const leidas = [];
      const fetchFn = async url => { leidas.push(url); return { ok: true, json: async () => structuredClone(
        url.includes('catalogo_plataformas_publicas_v2') ? v1.p : url.includes('catalogo_ofertas_publicas_v2') ? v1.o : v1.d) }; };
      const log = console.log; console.log = () => {};
      try { await sincronizar({ fetchFn, jsPath, csvPath: path.join(temporal, 'rwadar.csv'), hoy: new Date(`${FECHA}T12:00:00Z`),
        versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); } finally { console.log = log; }
      const snap = fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8'));
      assert.equal(snap.plataformas.length, 25); assert.equal(snap.ofertas.length, 22); assert.equal(snap.fuera.length, 5);
      assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
      assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA));
      const csv = fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8').trim().split('\n');
      assert.equal(csv.length, 1 + 25 + 5);
      // Las 25 del radar salen igual que en el rwadar.csv de la web (las descartadas se comparan en el ensayo con el
      // REST simulado: aquí sus fuentes van ordenadas por dirección y por REST, en el orden de la base).
      { const radarCsv = t => t.split('\n').filter(l => l.startsWith('"En el radar"'));
        assert.deepEqual(radarCsv(fs.readFileSync(path.join(temporal, 'rwadar.csv'), 'utf8')), radarCsv(fs.readFileSync(path.join(ROOT, 'rwadar-site/rwadar.csv'), 'utf8')), 'rwadar.csv: las 25 del radar sin diferencias'); }
      const salidas = fichas.construirSalidas({ catalogo: snap });
      const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
      assert.deepEqual(paginas.sort(), manifiestoFichas.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort(), 'mismas fichas que la lista cerrada');
      const actual = n => fs.existsSync(path.join(ROOT, 'rwadar-site', n)) ? fs.readFileSync(path.join(ROOT, 'rwadar-site', n), 'utf8') : null;
      const distintas = paginas.filter(n => actual(n) !== salidas.get(n));
      const spiko = salidas.get('ofertas/spiko-letras-del-tesoro-euro.html'), schwarzer = salidas.get('ofertas/vivienda-schwarzer-weg-18-graz.html');
      assert.ok(spiko.includes('2,41 %') && !spiko.includes('2,44 %'), 'la ficha web de Spiko Euro dice 2,41 %');
      assert.ok(schwarzer.includes('Desde 69,90 € la participación en reventa (11/11)') && !schwarzer.includes('Desde 65 € la participación'), 'la ficha web de Schwarzer Weg dice 69,90 €');
      informe.fichasQueCambian = distintas.length;
      ok(`sincronizador real con estas vistas: 25 plataformas, 22 ofertas y 5 descartadas (CSV de ${csv.length - 1} filas; las 25 del radar, iguales que en el de la web), todas de la revisión nueva y verificadas el 11/11; las fichas salen con la lista cerrada de siempre (${paginas.length} páginas, ninguna nueva ni retirada) y cambian ${distintas.length} por la revisión, las fechas y los textos; la ficha web de Spiko Euro dice 2,41 % y la de Schwarzer Weg «Desde 69,90 € la participación en reventa (11/11)»`);
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
const ANTERIOR = '88d5a757-3481-f70e-dc7c-6272704a00b3'; // la 2026-11-05.2, que está en la cadena
await caso('la publicada no es la dfdc4c85 (es la anterior, 88d5a757)', `update rwadar_catalogo.publicacion_v2 set revision_id = '${ANTERIOR}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('la revisión destino ya existe con otra huella',
  `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', 25, 22, '{"principales":8,"secundario":13,"en_camino":1}'); set session_replication_role = origin;`,
  /otra identidad/);
// Aplicado después del 18/11. PGlite usa la fecha del sistema (hoy): se ensaya la misma guarda con el
// último día vigente cambiado al día anterior, que para esta guarda es lo mismo que aplicarla el 19/11.
{
  const hoy = new Date().toISOString().slice(0, 10), ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  assert.ok(hoy >= FECHA && hoy <= ULTIMO, `este ensayo hay que hacerlo entre el 11/11 y el 18/11 (hoy es ${hoy})`);
  const caducado = SQL.replace(TOPE, TOPE.replace(`'${ULTIMO}'`, `'${ayer}'`));
  assert.notEqual(caducado, SQL);
  await caso(`aplicada después del último día vigente (lote caducado; tope movido al ${ayer})`, null, /Lote caducado/, null, caducado);
}
await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
  `set session_replication_role = replica; update public.plataformas set slug = 'addx-prueba' where slug = 'addx'; set session_replication_role = origin;`,
  /incompleto/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length }, null, 1));
