// Ensayo local de la entrega «2026-11-04» en PGlite, sin red, sobre la misma cadena que
// producción (22/10 → 03/11.7 publicada; los textos de la .8 ya vienen en 02_seed.sql):
//   1. qué sentencias lleva el SQL y qué tablas toca;
//   2. con producción como se espera: la revisión nueva queda publicada; las 24 ofertas solo
//      cambian en rótulos, fuentes de API y fecha de revisión de la documentación; las 26
//      plataformas, en las dos direcciones del REGAFI de Spiko y el campo «Blockchains» de ARTEX;
//      Toucan, en su motivo y una fuente nueva; idempotente; lo que leen la web y la app;
//   3. con producción distinta en cualquier punto, o a medias, falla y no deja nada.
//
//   node rwadar-app/data/verificaciones/2026-11-04-v2/comprobar-entrega.mjs
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
const { etiquetaCruda } = require('../../../rotulos-referencias.js');
const { resumenOferta } = require(path.join(ROOT, 'rwadar-site/assets/ficha-editorial-20261022.js'));
const fichas = require(path.join(ROOT, 'rwadar-fichas.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-04';
const lote = path.join(APP, `data/importaciones/catalogo-${ETIQUETA}-v2`);
const SQL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
const SHA = crypto.createHash('sha256').update(SQL).digest('hex');
const revision = leer(path.join(lote, 'revision.json'));
const plat = leer(path.join(DIR, 'cambios-plataformas.json'));
const contraste = leer(path.join(DIR, `contraste-${ETIQUETA}.json`));
const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId;
const nueva = construirSqlImportacion(cargarFuentesLocales(ROOT, { revision: ETIQUETA, versionEsquema: 2 }));
assert.equal(nueva.revisionId, NUEVA);
assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql);
const artex = plat.plataformas['artex-global-markets'], toucan = plat.plataformas['toucan-protocol'];
const ACR = toucan.fuentesNuevas[0];
const LOTES = ['2026-10-22', '2026-10-23', '2026-11-02', '2026-11-03', '2026-11-03.2', '2026-11-03.3', '2026-11-03.4',
  '2026-11-03.5', '2026-11-03.6', '2026-11-03.7'];
// La .8 (textos de public.plataformas, sin revisión nueva) ya está en 02_seed.sql, que carga
// baseCompleta(): no se vuelve a aplicar (comprobar-revision.mjs hace lo mismo).
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
assert.equal(cuenta['update public.plataformas'], 2); assert.equal(cuenta['insert into public.fuentes'], 1);
assert.equal(cuenta['insert into rwadar_catalogo.ofertas'], 24); assert.equal(cuenta['insert into rwadar_catalogo.plataformas'], 26);
assert.deepEqual(SQL.match(/^update public\.plataformas set (\w+) = /gm).map(s => s.split(' ')[3]), ['cadenas', 'motivo_descarte']);
assert.equal((SQL.match(/\bupdate\s+public\.plataformas\s+set\s+estado\b/gi) || []).length, 0, 'no cambia ningún estado de plataforma');
assert.match(SQL, /^begin isolation level serializable;$/m);
assert.ok(SQL.endsWith('end $aprobar$;\ncommit;\n'));
ok('inventario: una transacción serializable; guarda; el lote nuevo en rwadar_catalogo (1 revisión, 26 plataformas, 24 ofertas y sus fuentes); 2 update de public.plataformas (cadenas de ARTEX y motivo de Toucan) y 1 insert en public.fuentes con su guarda y su comprobación; aprobación al final; sin estados, esquema ni permisos');

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
const api = x => JSON.parse(JSON.stringify(x), (k, v) =>
  ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
async function vistas(db) {
  await sesion(db, null, 'anon');
  const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2 order by slug'));
  const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2 order by slug'));
  const d = await filas(db, `select p.nombre, p.etiqueta_descarte, p.motivo_descarte,
    (select json_agg(json_build_object('url', f.url, 'titulo', f.titulo) order by f.url) from public.fuentes f where f.plataforma_id = p.id) as fuentes
    from public.plataformas p where p.estado = 'descartada' order by p.nombre`);
  await sesion(db);
  return { p, o, d };
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
    cambios: await q('select count(*)::int c from cambios_estado'),
    avisos: await q('select count(*)::int c from avisos_pendientes'),
  };
}
const set = (slug, col, v) => `update public.plataformas set ${col} = '${v.replace(/'/g, "''")}' where slug = '${slug}';`;
const fuente = (slug, url, titulo, fechas = '') => `insert into public.fuentes (plataforma_id,url,titulo${fechas ? ',publicada_el,consultada_el' : ''})
  select id,'${url}','${titulo.replace(/'/g, "''")}'${fechas} from public.plataformas where slug='${slug}';`;
const acrBien = fuente('toucan-protocol', ACR.url, ACR.titulo, `,'${ACR.publicada_el}'::date,'${ACR.consultada_el}'::date`);

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

// ---------------------------------------------------------------- 2 · producción como se espera
{
  const db = await base();
  try {
    const f0 = await foto(db), v0 = await vistas(db);
    assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
    assert.equal(v0.d.find(x => x.nombre === 'Toucan Protocol').motivo_descarte, toucan.motivo_descarte.antes, 'la .8 ya aplicada');
    ok('cadena de producción 22/10 → 03/11.7 con los textos de la .8: la publicada es la f2732257');
    await db.exec(SQL);
    const f1 = await foto(db), v1 = await vistas(db);
    await db.exec(SQL);
    assert.deepEqual(await foto(db), f1, 'idempotencia');
    ok('idempotente: aplicarla dos veces da lo mismo');
    assert.equal(JSON.parse(f1.publicacion)[0].revision_id, NUEVA);
    assert.deepEqual([f1.cambios, f1.avisos, f1.retirado], [f0.cambios, f0.avisos, f0.retirado]);
    assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === 26 && v1.o.length === 24);
    assert.ok(v1.o.every(o => o.verificada_el === '2026-11-03' && o.vigencia_dias === 7) && v1.p.every(p => p.verificado_lote_el === '2026-11-03'));
    ok('publicada la revisión nueva: 26 plataformas y 24 ofertas, fechadas el 03/11 y con 7 días; sin cambios de estado ni avisos');

    // Ofertas: igual salvo documentación (rótulos, fuentes, fecha de revisión) y fuentes actuales.
    const sinDoc = o => { const { revision_id, documentacion, fuentes_actuales, ...r } = o; return r; };
    let rotulos = 0, refFuente = 0;
    for (const a of v0.o) {
      const d = v1.o.find(o => o.slug === a.slug);
      assert.deepEqual(sinDoc(d), sinDoc(a), `${a.slug}: cifras, avisos y textos iguales`);
      d.documentacion.referencias.forEach((r, i) => {
        const b = a.documentacion.referencias[i];
        assert.deepEqual([r.valor, r.fechaDato, r.fechaConsulta], [b.valor, b.fechaDato, b.fechaConsulta], `${a.slug}: valor y fechas`);
        assert.ok(!etiquetaCruda(r.etiqueta), `${a.slug}: ${r.etiqueta}`);
        if (r.etiqueta !== b.etiqueta) { rotulos++; assert.equal(r.etiqueta.split(' · ').slice(1).join(' · '), b.etiqueta.split(' · ').slice(1).join(' · ')); }
        if (r.fuente !== b.fuente) refFuente++;
      });
      assert.ok(!JSON.stringify([d.documentacion.fuentes, d.fuentes_actuales]).match(/\/api\/|public-api\.|wt=json/) ||
        d.documentacion.fuentes.every(u => !/\/api\/|public-api\.|wt=json/.test(u) || contraste.seQuedan.some(s => s.url === u)), `${a.slug}: fuentes de API`);
    }
    assert.equal(rotulos, contraste.cuentas.rotulos); assert.equal(refFuente, contraste.cuentas.referenciasConFuenteNueva);
    ok(`24 ofertas: cifras, avisos y textos iguales; ${rotulos} rótulos legibles con la misma fecha; ${refFuente} referencias con la página para personas; valores y fechas iguales`);

    // Plataformas: igual salvo las dos direcciones del REGAFI (Spiko) y «Blockchains» de ARTEX.
    const cambiosP = [];
    for (const a of v0.p) {
      const d = v1.p.find(p => p.slug === a.slug);
      for (const k of Object.keys(a)) if (k !== 'revision_id' && JSON.stringify(d[k]) !== JSON.stringify(a[k])) cambiosP.push(`${a.slug}.${k}`);
    }
    assert.deepEqual(cambiosP.sort(), ['artex-global-markets.cadenas', 'spiko.verificacion_local']);
    assert.equal(v1.p.find(p => p.slug === 'artex-global-markets').cadenas, artex.cadenas.despues);
    const urls = p => JSON.stringify(p.verificacion_local).match(/https:[^"]+/g);
    assert.deepEqual(urls(v1.p.find(p => p.slug === 'spiko')).filter(u => /regafi/.test(u)).every(u => u === 'https://www.regafi.fr/pages/fiche-banque/?refine.id_referentiel=751211'), true);
    ok('26 plataformas iguales salvo «Blockchains» de ARTEX («No usa blockchain») y las fuentes del REGAFI de Spiko (la ficha para personas)');

    // public.plataformas y public.fuentes
    const a0 = Object.fromEntries(JSON.parse(f0.plataformas).map(x => [x.slug, x]));
    const cambiadas = [];
    for (const x of JSON.parse(f1.plataformas)) for (const k of Object.keys(x)) if (JSON.stringify(x[k]) !== JSON.stringify(a0[x.slug][k])) cambiadas.push(`${x.slug}.${k}`);
    assert.deepEqual(cambiadas.sort(), ['artex-global-markets.actualizada_el', 'artex-global-markets.cadenas',
      'toucan-protocol.actualizada_el', 'toucan-protocol.motivo_descarte']);
    const fA = JSON.parse(f0.fuentes), fD = JSON.parse(f1.fuentes);
    assert.deepEqual(fD.filter(f => fA.some(x => x.id === f.id)), fA, 'las fuentes de antes, intactas');
    const nuevas = fD.filter(f => !fA.some(x => x.id === f.id)).map(({ id, plataforma_id, ...r }) => r);
    assert.deepEqual(nuevas, [{ url: ACR.url, titulo: ACR.titulo, publicada_el: ACR.publicada_el, consultada_el: ACR.consultada_el }]);
    const t1 = v1.d.find(x => x.nombre === 'Toucan Protocol');
    assert.equal(t1.motivo_descarte, toucan.motivo_descarte.despues); assert.equal(t1.fuentes.length, 4);
    assert.deepEqual(v1.d.filter(x => x.nombre !== 'Toucan Protocol'), v0.d.filter(x => x.nombre !== 'Toucan Protocol'));
    ok('public.plataformas: solo cambian «cadenas» de ARTEX y el motivo de Toucan; public.fuentes: una nueva, la del ACR en Toucan; RealT, Domoblock y Goldfinch iguales');

    // Lo que leen la web y la app.
    const r = validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-04', permitirAmpliacion: true });
    assert.equal(r.fecha, '2026-11-03');
    assert.throws(() => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2026-11-11', permitirAmpliacion: true }), /caducada/);
    ok('el lector de la web y la app lo acepta; vence el 11/11, como la .7 (no se alarga)');
    const pinta = x => { const s = resumenOferta({ ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias,
      estadoRevision: x.estado_revision, disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug }, [], new Date('2026-11-04T12:00:00Z'));
      return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto }; };
    for (const o of v1.o) assert.deepEqual(pinta(o), pinta(v0.o.find(x => x.slug === o.slug)), `${o.slug}: la tarjeta no cambia`);
    ok('las 24 tarjetas se ven igual (mínimo, acceso desde España y salida)');
    const snap = fichas.leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
    snap.fuera = v1.d.map(f => ({ n: f.nombre, badge: f.etiqueta_descarte, why: f.motivo_descarte, fuentes: f.fuentes }));
    const salidas = fichas.construirSalidas({ catalogo: snap });
    assert.ok(salidas.get('fuera-del-radar/toucan-protocol.html').includes(ACR.url));
    assert.ok(salidas.get('fuera-del-radar/toucan-protocol.html').includes(fichas.esc(toucan.motivo_descarte.despues)));
    ok('la ficha fija de Toucan sale con el motivo y la fuente del ACR (las fichas fijas de plataforma no enseñan «Blockchains»; la web y la app lo leen de la vista, comprobado arriba)');
    informe.descartes = v1.d.filter(x => x.nombre === 'Toucan Protocol');
  } finally { await db.close(); }
}

// ---------------------------------------------------------------- 3 · producción distinta
const ya = `${set('artex-global-markets', 'cadenas', artex.cadenas.despues)}\n${set('toucan-protocol', 'motivo_descarte', toucan.motivo_descarte.despues)}\n${acrBien}`;
await caso('public.plataformas ya como quedaría (y el lote sin aplicar)', ya, false, async (db, antes, despues) => {
  assert.equal(JSON.parse(despues.publicacion)[0].revision_id, NUEVA);
  assert.equal(despues.plataformas, antes.plataformas); assert.equal(despues.fuentes, antes.fuentes);
  ok('con ARTEX, Toucan y el ACR ya como quedarían, pasa la guarda, publica el lote y no toca public.plataformas ni public.fuentes');
  return { todoIgual: true };
});
const otra = '344a86aa-2c53-d2f0-fed4-5fdaadda33ad';
await caso('la publicada no es la f2732257', `update rwadar_catalogo.publicacion_v2 set revision_id = '${otra}';`, /Publicación distinta/);
await caso('la revisión publicada con otra huella',
  `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
  /identidad prevista/);
await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
await caso('«Blockchains» de ARTEX distinto', set('artex-global-markets', 'cadenas', 'Ethereum'), /artex-global-markets \(cadenas\)/);
await caso('ARTEX descartada', `update public.plataformas set estado = 'descartada', etiqueta_descarte = 'Prueba', motivo_descarte = 'Motivo de prueba suficientemente largo para la fila.' where slug = 'artex-global-markets';`,
  /artex-global-markets \(cadenas\)|catálogo|Catálogo|publicable|incompleto|descartadas/);
await caso('motivo de Toucan distinto (el de antes de la .8)', set('toucan-protocol', 'motivo_descarte',
  leer(path.join(DIR, '../2026-11-03.8-v2/textos-plataformas.json')).plataformas['toucan-protocol'].motivo_descarte.antes), /toucan-protocol \(motivo_descarte\)/);
await caso('Toucan con una fuente de más', fuente('toucan-protocol', 'https://example.org/otra', 'Otra'), /Fuentes de Toucan/);
await caso('Toucan sin una de sus 3 fuentes', `delete from public.fuentes where url = '${toucan.fuentesQueSeConservan[2].url}';`, /Fuentes de Toucan/);
await caso('una fuente de Toucan con otro título', `update public.fuentes set titulo = 'Otro título' where url = '${toucan.fuentesQueSeConservan[0].url}';`, /Fuentes de Toucan/);
await caso('el ACR ya presente con otro título', fuente('toucan-protocol', ACR.url, 'Título distinto'), /Fuentes de Toucan/);
await caso('el ACR ya presente con otras fechas', fuente('toucan-protocol', ACR.url, ACR.titulo, `,'2022-05-31'::date,'${ACR.consultada_el}'::date`), /Fuentes de Toucan/);
await caso('el ACR ya colgado de otra plataforma (Goldfinch)', fuente('goldfinch', ACR.url, ACR.titulo, `,'${ACR.publicada_el}'::date,'${ACR.consultada_el}'::date`), /otra plataforma/);
await caso('una quinta descartada', `update public.plataformas set estado = 'descartada', etiqueta_descarte = 'Prueba', motivo_descarte = 'Motivo de prueba suficientemente largo para la fila.' where slug = 'addx';`,
  /exactamente 4 descartadas|incompleto|publicable/);
await caso('a medias: solo ARTEX ya cambiado', set('artex-global-markets', 'cadenas', artex.cadenas.despues), /a medias/);
await caso('a medias: motivo de Toucan nuevo sin el ACR', set('toucan-protocol', 'motivo_descarte', toucan.motivo_descarte.despues), /a medias/);
await caso('a medias: el ACR puesto y los textos como antes', acrBien, /a medias/);

informe.resultado = 'correcto';
fs.writeFileSync(path.join(DIR, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
console.log(JSON.stringify({ resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
  casosDeFallo: informe.casos.filter(c => c.falla).length }, null, 1));
