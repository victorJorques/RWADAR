// Motor de la entrega · COMPROBAR. Ensayo local en PGlite, sin red, sobre la misma cadena que producción: la
// instalación con la copia fija del 02_seed.sql de antes de ARTEX (db/pruebas/02_seed_radar_26.sql) y los lotes de
// decisiones.json («cadena»), que dejan publicada la entrega «desde». Comprueba:
//   1. qué sentencias lleva el SQL y qué tablas toca (solo rwadar_catalogo y la aprobación), con las mismas filas por
//      tabla que la entrega anterior;
//   2. antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante (lectura-publica/);
//   3. con producción como se espera: la revisión nueva queda publicada con las cantidades de decisiones.json, fechada
//      hoy y con su vigencia; idempotente; public.plataformas, public.fuentes y el historial, intactos; cada cambio del
//      contraste en lo que lee un visitante (y lo de antes ya no); lo no aplicado sigue como estaba («sigue»); las
//      fichas «sin cambios», iguales salvo las fechas; qué verá el inversor en cada tarjeta (resumenOferta); lo que
//      leen la web (sincronizador real y fichas) y la app;
//   4. con producción distinta (otra publicada, otra huella, catálogo retirado, destino con otra identidad, una
//      plataforma que falta) o aplicada después del último día vigente, falla y no deja nada.
// Es la generalización de rwadar-app/data/verificaciones/2026-11-12-v2/comprobar-entrega.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { RAIZ_REPO, require, CANONICA, leer, cargarDecisiones, contexto, fechaLarga } from './comun.mjs';
import { inventario, cuentaPorTabla } from './sql.mjs';

const hoyReal = () => new Date().toISOString().slice(0, 10);

export async function comprobar(opciones = {}) {
  const raiz = path.resolve(opciones.raiz || RAIZ_REPO);
  const D = cargarDecisiones(opciones.decisiones || path.join(opciones.ciclo, 'decisiones.json'));
  const C = contexto(D, { raiz, ciclo: opciones.ciclo });
  const { DIR, ETIQUETA, FECHA, DESDE, FES, CORTA, ULTIMO, CADUCA, COLECCIONES } = C;
  const salida = path.resolve(opciones.salida || raiz);
  const DIR_SALIDA = path.join(salida, path.relative(raiz, DIR));
  const APP = path.join(raiz, 'rwadar-app');
  const dondeEstaba = process.cwd();
  process.chdir(APP); // pruebas-soporte.mjs lee db/… con rutas relativas
  const log = opciones.silencio ? () => {} : console.log;
  try {
    const { baseCatalogoHistorico, filas, sesion } = await import(pathToFileURL(path.join(APP, 'pruebas-soporte.mjs')).href);
    const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2, MANIFIESTO_CATALOGO_V2 } = require(path.join(APP, 'catalogo-publico.js'));
    const { sincronizar } = require(path.join(APP, 'sincronizar.js'));
    const { resumenOferta, idiomaCita } = require(path.join(raiz, 'rwadar-site/assets/ficha-editorial-20261022.js'));
    const fichas = require(path.join(raiz, 'rwadar-fichas.js'));
    const manifiestoFichas = require(path.join(raiz, 'rwadar-fichas-manifiesto.js'));
    const { adaptarCatalogoV2 } = require(path.join(raiz, 'rwadar-movil/lib/catalogo-remoto.js'));

    // El día del ensayo. Por omisión, hoy; con --hoy se ensaya otro día (para repetir una entrega pasada) y el SQL de
    // la entrega se aplica con su guarda evaluada en ese día, como los lotes de la cadena.
    const HOY = opciones.hoy || hoyReal();
    assert.match(HOY, /^\d{4}-\d{2}-\d{2}$/, '--hoy: AAAA-MM-DD');
    assert.ok(HOY >= FECHA && HOY <= ULTIMO, `este ensayo vale del ${fechaLarga(FECHA)} al ${fechaLarga(ULTIMO)} (hoy es ${HOY}); para repetir una entrega pasada, --hoy=<un día de ese plazo>`);
    const relojSimulado = HOY !== hoyReal();
    const AYER = new Date(Date.parse(`${HOY}T00:00:00Z`) - 864e5).toISOString().slice(0, 10);

    const lote = path.join(salida, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2`);
    const SQL_REAL = fs.readFileSync(path.join(lote, 'aplicar-y-aprobar.sql'), 'utf8');
    const SHA = crypto.createHash('sha256').update(SQL_REAL).digest('hex');
    const enElDia = sql => { if (!relojSimulado) return sql;
      const n = sql.split('current_date').length - 1; assert.equal(n, 2, 'la guarda usa current_date dos veces');
      return sql.split('current_date').join(`date '${HOY}'`); };
    const SQL = enElDia(SQL_REAL);
    const revision = leer(path.join(lote, 'revision.json'));
    const PREVIA = revision.revisionAnterior, NUEVA = revision.revisionId, HASH_PREVIA = revision.hashRevisionAnterior;
    assert.deepEqual([PREVIA, HASH_PREVIA], [C.PREVIA, C.HASH_PREVIA], 'revision.json: la publicada de decisiones.json');
    const nueva = construirSqlImportacion(cargarFuentesLocales(salida, { revision: ETIQUETA, versionEsquema: 2 }));
    assert.equal(nueva.revisionId, NUEVA); assert.equal(nueva.hash, revision.hash);
    assert.equal(fs.readFileSync(path.join(lote, 'catalogo.sql'), 'utf8'), nueva.sql, 'catalogo.sql es el de los datos de la carpeta');
    // La huella de la publicada sale de construir la «desde» local, como pide la guarda.
    const previa = construirSqlImportacion(cargarFuentesLocales(raiz, { revision: DESDE, versionEsquema: 2 }));
    assert.deepEqual([previa.revisionId, previa.hash], [PREVIA, HASH_PREVIA]);
    assert.equal(revision.venceTrasEl, ULTIMO);
    const contraste = leer(path.join(DIR_SALIDA, `contraste-${ETIQUETA}.json`));
    assert.deepEqual([contraste.revisionAnterior, contraste.revisionNueva], [PREVIA, NUEVA]);
    const LOTES = D.cadena;
    for (const f of LOTES) assert.ok(fs.existsSync(path.join(APP, `data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`)), `cadena: falta el lote ${f}`);
    const ANTERIOR = leer(path.join(APP, `data/importaciones/catalogo-${LOTES.at(-2)}-v2/revision.json`)).revisionId;
    const NP = D.plataformas, NO = C.OFERTAS;
    const informe = { tipo: 'ensayo_local_pglite', ejecutadoEl: new Date().toISOString(), etiqueta: ETIQUETA,
      revisionAnterior: PREVIA, revisionNueva: NUEVA, sha256AplicarYAprobar: SHA, ...(relojSimulado ? { relojSimulado: HOY } : {}), pruebas: [], casos: [] };
    const ok = t => { informe.pruebas.push(t); log('  OK   ', t); };

    // ------------------------------------------------------------ 1 · inventario del SQL
    const inv = inventario(SQL_REAL, { nueva: NUEVA, previa: PREVIA, hashPrevia: HASH_PREVIA, fecha: FECHA, ultimo: ULTIMO, colecciones: COLECCIONES });
    const { cuenta, bloques, sentencias } = inv;
    assert.equal(cuenta['rwadar_catalogo.revisiones'], 1); assert.equal(cuenta['rwadar_catalogo.plataformas'], NP);
    assert.equal(cuenta['rwadar_catalogo.ofertas'], NO); assert.equal(cuenta['rwadar_catalogo.fuentes'], D.radar.fuentes);
    // Mismas filas por tabla que la entrega publicada.
    const sqlPrevia = fs.readFileSync(path.join(APP, `data/importaciones/catalogo-${DESDE}-v2/aplicar-y-aprobar.sql`), 'utf8');
    assert.deepEqual(cuenta, cuentaPorTabla(sqlPrevia), `mismas filas por tabla que la ${DESDE}`);
    assert.ok(SQL_REAL.split('\n')[0].endsWith('Ciclo pedido y autorizado por el responsable del proyecto.') &&
      SQL_REAL.includes(`${D.pedido.charAt(0).toUpperCase()}${D.pedido.slice(1)} el ${FES}`), 'cabecera y referencia de aprobación sin nombres de personas');
    informe.inventario = cuenta;
    informe.sentencias = { total: sentencias.length + bloques.length, inserts: inv.inserts, bloquesDo: bloques.map(b => b[1]), otras: ['begin isolation level serializable;', 'commit;'] };
    ok(`inventario: ${informe.sentencias.total} sentencias en una transacción serializable (begin, guarda, ${inv.inserts} inserts, aprobación, commit); guarda (publicada ${PREVIA.slice(0, 8)} con su huella ${HASH_PREVIA.slice(0, 12)}…, catálogo no retirado, fecha del ${CORTA} al ${fechaLarga(ULTIMO).slice(0, 5)}, destino sin otra identidad); solo inserts en rwadar_catalogo (${Object.entries(cuenta).map(([k, v]) => `${v} en ${k.split('.')[1]}`).join(', ')}; las mismas filas por tabla que la ${DESDE}), todos idempotentes y de la revisión nueva; la aprobación solo cambia rwadar_catalogo.revisiones; sin DDL, borrados, permisos, Auth ni funciones; nada en public.*`);
    if (relojSimulado) ok(`reloj simulado: la guarda del SQL se evalúa el ${fechaLarga(HOY)} (current_date → date '${HOY}'), como los lotes de la cadena; el SQL de la entrega no se toca`);

    // ------------------------------------------------------------ base como producción
    async function base() {
      const db = await baseCatalogoHistorico();
      await db.exec('alter default privileges grant all on tables to anon, authenticated');
      for (const a of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
        'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
        'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
        'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) await db.exec(fs.readFileSync(a, 'utf8'));
      // Cada lote de la cadena se aplica con su tope de vigencia evaluado en su propio día.
      for (const f of LOTES) {
        const sql = fs.readFileSync(`data/importaciones/catalogo-${f}-v2/aplicar-y-aprobar.sql`, 'utf8');
        await db.exec(sql.replace(/current_date > date '(\d{4}-\d{2}-\d{2})'/g, `date '${f.slice(0, 10)}' > date '$1'`));
      }
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
      const p = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2')).sort((a, b) => a.nombre.localeCompare(b.nombre, 'en'));
      const o = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
      const d = await filas(db, DESCARTADAS);
      const dr = await filas(db, DESCARTADAS.replace(' order by f.url', ''));
      const t = await filas(db, 'select slug, nombre, estado, cadenas from public.plataformas order by slug');
      await sesion(db);
      return { p, o, d, dr, t };
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
    const pinta = (x, dia) => {
      const s = resumenOferta({ ...x, verificadaEl: x.verificada_el, vigenciaDias: x.vigencia_dias, estadoRevision: x.estado_revision,
        disponibleEs: x.disponible_es, plataformaSlug: x.plataforma_slug }, [], new Date(`${dia}T12:00:00Z`));
      return { minimo: s.minimo.unidadDocumentada || s.minimo.texto, espana: s.accesoEspana.texto, salida: s.salida.texto, estado: s.estado.texto, vencida: s.vencida };
    };
    const sinFechas = o => {
      const { revision_id, verificada_el, verificado_lote_el, ...r } = structuredClone(o);
      r.avisos = r.avisos.map(({ verificadaEl, ...a }) => a);
      if (r.documentacion) {
        delete r.documentacion.revisadaEl;
        r.documentacion.referencias = r.documentacion.referencias.map(x => CANONICA.test(x.etiqueta) ? { ...x, fechaConsulta: '', alcance: '' } : x);
      }
      return r;
    };
    const radarCambia = Object.keys(contraste.radar?.cambios?.fuentes || {}).length + Object.keys(contraste.radar?.cambios?.plataformas || {}).length > 0;

    // ------------------------------------------------------------ 2 y 3 · producción como se espera
    {
      const db = await base();
      try {
        const f0 = await foto(db), v0 = await vistas(db);
        assert.equal(JSON.parse(f0.publicacion)[0].revision_id, PREVIA);
        ok(`cadena de producción (seed antes de ARTEX + ${LOTES.length} lotes, del ${LOTES[0]} a la ${DESDE}): la publicada es la ${PREVIA.slice(0, 8)}`);

        // Lo que enseña PGlite antes de aplicar es lo que se leyó hoy como visitante.
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
          const { verificacion_local: a, plataforma_id: ia, ...restoA } = p, { verificacion_local: b, plataforma_id: ib, ...restoB } = r;
          assert.deepEqual(restoA, restoB, `${p.slug}: PGlite = producción`);
          assert.deepEqual(fuentesOrdenadas(sinPublicadaEl(a)), fuentesOrdenadas(sinPublicadaEl(b)), `${p.slug}: verificación`);
        }
        assert.deepEqual(v0.t, [...pubT].sort((a, b) => (a.slug < b.slug ? -1 : 1)), 'public.plataformas (slug, nombre, estado, blockchains) = producción');
        assert.equal(v0.d.length, D.lecturaPublica.descartadas);
        ok(`antes de aplicar, PGlite enseña lo mismo que se leyó hoy como visitante: ${NP} plataformas, ${NO} ofertas (${Object.values(COLECCIONES).join('/')}) y las ${v0.t.length} filas de public.plataformas (${NP} en el radar y ${v0.d.length} descartadas); tolerancias de siempre: el uuid de cada plataforma (se genera al instalar), «publicadaEl» de las fuentes del radar (la base no la guarda) y el orden de las fuentes de cada campo`);

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
        assert.deepEqual({ p: c1.p - c0.p, o: c1.o - c0.o, f: c1.f - c0.f }, { p: NP, o: NO, f: D.radar.fuentes }, 'solo se añaden las filas de la revisión nueva');
        ok(`public.plataformas, public.fuentes, cambios de estado, avisos y emisiones, intactos; las ${revs0.length} revisiones anteriores se conservan tal cual (historial, con la ${PREVIA.slice(0, 8)} aprobada) y la nueva queda aprobada con su huella; rwadar_catalogo gana justo ${NP} plataformas, ${NO} ofertas y ${D.radar.fuentes} fuentes`);

        assert.ok([...v1.p, ...v1.o].every(x => x.revision_id === NUEVA) && v1.p.length === NP && v1.o.length === NO);
        assert.ok([...v1.p, ...v1.o].every(x => x.plataformas_esperadas === NP && x.ofertas_esperadas === NO && isDeepStrictEqual(x.colecciones_esperadas, COLECCIONES)));
        assert.ok(v1.o.every(o => o.verificada_el === FECHA && o.vigencia_dias === D.vigenciaDias) && v1.p.every(p => p.verificado_lote_el === FECHA));
        assert.deepEqual(v1.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]), v0.o.map(o => [o.slug, o.coleccion, o.plataforma_slug, o.estado_revision]),
          `mismas ${NO} fichas, en el mismo orden, colecciones, plataformas y estados`);
        assert.deepEqual(v1.p.map(p => p.slug), v0.p.map(p => p.slug), `mismas ${NP} plataformas`);
        assert.deepEqual(Object.fromEntries(['principales', 'secundario', 'en_camino'].map(c => [c, v1.o.filter(o => o.coleccion === c).length])), COLECCIONES);
        assert.deepEqual(v1.d, v0.d, 'las descartadas, iguales');
        ok(`publicada la revisión nueva: las mismas ${NP} plataformas y ${NO} fichas (${COLECCIONES.principales} principales, ${COLECCIONES.secundario} de reventa y ${COLECCIONES.en_camino} en camino; mismos estados de revisión), fechadas el ${CORTA} con ${D.vigenciaDias} días; las ${v0.d.length} descartadas, iguales`);

        // Plataformas: solo cambian la revisión, la fecha del lote y las fechas de la verificación (y lo declarado en
        // cambios-radar.json, si lo hay).
        const fechasFuera = x => JSON.parse(JSON.stringify(x), (k, v) => ['verificadoEl', 'consultadaEl'].includes(k) ? 'F' : v);
        const plataformasCambiadas = new Set(Object.keys(contraste.radar?.cambios?.plataformas || {}));
        for (const p of v1.p) {
          const a = v0.p.find(x => x.slug === p.slug);
          const resto = x => { const { revision_id, verificado_lote_el, verificacion_local, ...r } = x; return r; };
          assert.deepEqual(resto(p), resto(a), `${p.slug}: columnas iguales`);
          if (!radarCambia) assert.deepEqual(fechasFuera(p.verificacion_local), fechasFuera(a.verificacion_local), `${p.slug}: verificación igual salvo fechas`);
          else if (!plataformasCambiadas.has(p.slug)) assert.deepEqual(Object.keys(p.verificacion_local), Object.keys(a.verificacion_local), `${p.slug}: misma forma`);
          assert.equal(p.verificacion_local.verificadoEl, FECHA);
          assert.ok(JSON.stringify(p.verificacion_local).match(/"consultadaEl":"[^"]+"/g).every(m => m.includes(FECHA)), `${p.slug}: fuentes consultadas el ${CORTA}`);
        }
        ok(`plataformas: iguales salvo la revisión, la fecha del lote (${CORTA}) y las fechas de su verificación (cada fuente del radar, consultada el ${CORTA})${radarCambia ? `; y los cambios del radar de cambios-radar.json (${[...plataformasCambiadas].join(', ') || 'direcciones de fuentes'})` : '; ningún texto del radar cambia'}`);

        // Cada cambio del contraste, uno a uno, en lo que lee un visitante.
        const porSlug = l => new Map(l.map(o => [o.slug, o]));
        const o0 = porSlug(v0.o), o1 = porSlug(v1.o);
        // La vista enmascara el resumen y las métricas de las fichas que no están «actual»: sus textos se leen en
        // rwadar_catalogo.ofertas (lo que la vista tapa sigue tapado igual que antes).
        const leeTabla = async rev => new Map((await filas(db, `select slug, metricas, avisos, resumen, rentabilidad, documentacion, fuentes_actuales from rwadar_catalogo.ofertas where revision_id = '${rev}'`)).map(x => [x.slug, x]));
        const tabla = await leeTabla(NUEVA), tabla0 = await leeTabla(PREVIA);
        const enmascaradas = v1.o.filter(o => o.estado_revision !== 'actual').map(o => o.slug);
        for (const s of enmascaradas) {
          assert.deepEqual([o1.get(s).resumen, o1.get(s).metricas], [o0.get(s).resumen, o0.get(s).metricas], `${s}: la vista la sigue enmascarando igual que antes`);
          assert.match(o1.get(s).resumen, /^Condiciones pendientes de nueva revisión/);
        }
        const ver = slug => enmascaradas.includes(slug) ? { ...o1.get(slug), ...tabla.get(slug) } : o1.get(slug);
        const textosDe = o => { const d = o.documentacion; return { aviso: o.avisos.map(a => a.texto), 'métrica': o.metricas.map(m => `${m.etiqueta}: ${m.valor}`),
          'referencia de la ficha': d.referencias.map(r => `${r.etiqueta}: ${r.valor}`), tarjeta: d.referencias.map(r => `${r.etiqueta}: ${r.valor}`),
          'tarjeta (fecha del dato)': d.referencias.map(r => `${r.etiqueta}: ${r.valor} · dato del ${r.fechaDato ?? 'sin fecha'}`),
          'fuente de la ficha': d.fuentes, 'característica': (d.caracteristicas || []).map(x => `${x.etiqueta}: ${x.valor}`) }; };
        const comprobados = [];
        for (const c of contraste.cambios) {
          const o = ver(c.slug);
          if (c.campo === 'rentabilidad') assert.equal(o.rentabilidad ? `${o.rentabilidad.mostrada} · ${o.rentabilidad.literal}` : null, c.despues, `${c.slug}: rentabilidad`);
          else if (c.campo === 'resumen') { assert.equal(o.resumen, c.despues, `${c.slug}: resumen`); }
          else if (c.campo === 'descripción') assert.ok(o.documentacion.descripcion.includes(c.despues) && !o.documentacion.descripcion.includes(c.antes), `${c.slug}: descripción`);
          else if (c.campo === 'fuentes de la oferta') assert.equal(o.fuentes_actuales.join(' · '), c.despues, `${c.slug}: fuentes de la oferta`);
          else {
            const l = textosDe(o)[c.campo]; assert.ok(l, `campo desconocido ${c.campo}`);
            if (c.despues) assert.ok(l.includes(c.despues), `${c.slug}: falta «${c.despues}»`);
            else assert.ok(!l.includes(c.antes), `${c.slug}: sigue publicado «${c.antes}» (se quita)`);
          }
          comprobados.push(c.slug);
        }
        for (const c of contraste.cambios.filter(x => x.antes && ['aviso', 'métrica', 'referencia de la ficha', 'tarjeta', 'tarjeta (fecha del dato)', 'característica', 'fuente de la ficha'].includes(x.campo))) {
          const l = textosDe(ver(c.slug))[c.campo];
          if (c.antes !== c.despues) assert.ok(!l.includes(c.antes), `${c.slug}: sigue publicado «${c.antes}»`);
        }
        // Las fichas «sin cambios»: iguales a la publicada salvo las fechas (también en rwadar_catalogo).
        for (const slug of D.sinCambios || []) {
          assert.deepEqual(sinFechas(o1.get(slug)), sinFechas(o0.get(slug)), `${slug}: solo cambian las fechas`);
          assert.deepEqual(sinFechas({ ...tabla.get(slug), revision_id: 0 }), sinFechas({ ...tabla0.get(slug), revision_id: 0 }), `${slug}: en rwadar_catalogo, solo cambian las fechas`);
        }
        // Y en todas, lo que no está en el contraste sigue igual.
        for (const o of v1.o) {
          const a = sinFechas(o0.get(o.slug)), b = sinFechas(o);
          const cambiaResumen = contraste.cambios.some(c => c.slug === o.slug && c.campo === 'resumen');
          const cambiaFuentes = contraste.cambios.some(c => c.slug === o.slug && c.campo === 'fuentes de la oferta');
          for (const k of Object.keys(a)) if (!['avisos', 'metricas', 'rentabilidad', 'documentacion', ...(cambiaResumen ? ['resumen'] : []), ...(cambiaFuentes ? ['fuentes_actuales'] : [])].includes(k))
            assert.deepEqual(b[k], a[k], `${o.slug}.${k}`);
          assert.ok(o.avisos.every(x => x.verificadaEl === FECHA), `${o.slug}: avisos comprobados el ${CORTA}`);
        }
        informe.cambiosComprobados = { total: contraste.cambios.length, fichas: [...new Set(comprobados)].length };
        // Lo que no se aplicó tal cual sigue como estaba.
        const ref = (slug, etiqueta) => ver(slug).documentacion.referencias.filter(r => r.etiqueta === etiqueta);
        let siguen = 0;
        for (const n of D.noAplicado) for (const x of n.sigue || []) {
          const slug = x.slug || n.slug, o = ver(slug);
          if (x.referencia) assert.deepEqual(ref(slug, x.referencia).map(r => r.valor), x.valores, `${slug}: «${x.referencia}» (no aplicado: ${n.que})`);
          else {
            const v = x.campo.split('.').reduce((y, k) => (y == null ? y : y[k]), o);
            if ('es' in x) assert.deepEqual(v, x.es, `${slug}.${x.campo} (no aplicado)`);
            else assert.ok(String(v).includes(x.contiene), `${slug}.${x.campo}: no dice «${x.contiene}» (no aplicado)`);
          }
          siguen++;
        }
        assert.deepEqual(contraste.noAplicadoTalCual.map(x => x.slug), D.noAplicado.map(x => x.slug), 'el contraste recoge lo no aplicado de decisiones.json');
        for (const t of D.comprobar?.ausentes || []) assert.ok(!JSON.stringify([...v1.o, ...tabla.values()]).includes(t), `sigue apareciendo «${t}»`);
        ok(`cada cambio de contraste-${ETIQUETA}.json está en lo que lee un visitante (${contraste.cambios.length} cambios en ${informe.cambiosComprobados.fichas} fichas; en las ${enmascaradas.length} que la vista enmascara, en rwadar_catalogo) y lo de antes ya no; lo no aplicado sigue como estaba (${siguen} comprobaciones de ${D.noAplicado.length} puntos)${(D.comprobar?.ausentes || []).length ? `; no aparece ${D.comprobar.ausentes.map(t => `«${t}»`).join(', ')}` : ''}; ${(D.sinCambios || []).length} fichas sin cambios, iguales salvo las fechas; todos los avisos con fecha del ${CORTA}; la vista sigue enmascarando el resumen y las métricas de las ${enmascaradas.length} fichas que no están «actual», igual que antes`);

        // Vigencia.
        const lector = dia => validarLotePublicoV2(v1.p, v1.o, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: dia, permitirAmpliacion: true });
        const r = lector(FECHA);
        assert.equal(r.fecha, FECHA); assert.equal(r.manifiesto.plataformasEsperadas, NP); assert.equal(r.manifiesto.ofertasEsperadas, NO);
        assert.deepEqual(r.manifiesto.coleccionesEsperadas, COLECCIONES);
        lector(ULTIMO);
        assert.throws(() => lector(CADUCA), /caducad/);
        assert.ok(v1.o.every(o => !pinta(o, ULTIMO).vencida && pinta(o, CADUCA).vencida), `las ${NO} tarjetas valen hasta el ${fechaLarga(ULTIMO).slice(0, 5)}`);
        const movil = adaptarCatalogoV2({ version: 2, plataformas: v1.p, ofertas: v1.o }, new Date(`${FECHA}T12:00:00Z`));
        assert.equal(movil.plataformas.length, NP); assert.equal(movil.ofertas.length, NO);
        assert.equal(movil.ofertas.filter(o => o.coleccion === 'en_camino').length, COLECCIONES.en_camino);
        ok(`vigencia: el lector de la web (validarLotePublicoV2) lo acepta el ${CORTA} y el ${fechaLarga(ULTIMO).slice(0, 5)} y lo da por caducado el ${fechaLarga(CADUCA).slice(0, 5)}; las ${NO} tarjetas ocultan cifras desde el ${fechaLarga(CADUCA).slice(0, 5)}; el lector de la app (adaptarCatalogoV2) lo acepta (${NP}/${NO}, ${COLECCIONES.en_camino} en camino)`);

        // Qué verá el inversor en cada tarjeta: mínimo, acceso desde España y salida.
        const ETIQ = { minimo: /^M[ií]nimo/, espana: /^Acceso desde Espa/, salida: /^(?:Salida|Reembolso)/ };
        const tarjetaCambia = (slug, k) => contraste.cambios.find(c => c.slug === slug && c.campo === 'tarjeta' && ETIQ[k].test(c.despues || c.antes || ''));
        informe.tarjetas = {};
        for (const o of v1.o) {
          const ahora = pinta(o, FECHA), antes = pinta(o0.get(o.slug), FECHA);
          for (const k of ['minimo', 'espana', 'salida']) {
            assert.ok(['', 'es'].includes(idiomaCita(ahora[k])), `${o.slug}.${k}: «${ahora[k]}» parece una cita en otro idioma`);
            assert.ok(ahora[k].length <= 175, `${o.slug}.${k}: demasiado largo`);
            const c = tarjetaCambia(o.slug, k);
            if (!c) assert.equal(ahora[k], antes[k], `${o.slug}: el dato «${k}» de la tarjeta no cambia`);
            else if (o.estado_revision !== 'fuentes_en_conflicto') {
              const valor = c.despues.slice(c.despues.indexOf(': ') + 2);
              assert.ok(ahora[k].includes(valor) || (k === 'minimo' && ahora[k] === valor), `${o.slug}: la tarjeta enseña «${ahora[k]}» y no «${valor}»`);
            }
          }
          assert.doesNotMatch(ahora.minimo.normalize('NFD').replace(/[̀-ͯ]/g, ''), /por (?:token|participacion|accion)/i);
          assert.ok(!ahora.vencida, o.slug);
          assert.equal(ahora.estado, antes.estado, `${o.slug}: el estado de la tarjeta no cambia`);
          informe.tarjetas[o.slug] = { coleccion: o.coleccion, estado: ahora.estado, minimo: ahora.minimo, espana: ahora.espana, salida: ahora.salida,
            ...(JSON.stringify([antes.minimo, antes.espana, antes.salida, antes.estado]) !== JSON.stringify([ahora.minimo, ahora.espana, ahora.salida, ahora.estado])
              ? { antes: { minimo: antes.minimo, espana: antes.espana, salida: antes.salida, estado: antes.estado } } : {}) };
        }
        const cambiadas = Object.entries(informe.tarjetas).filter(([, x]) => x.antes).map(([s]) => s);
        const conTarjeta = [...new Set(contraste.cambios.filter(c => c.campo === 'tarjeta').map(c => c.slug))];
        assert.deepEqual([...cambiadas].sort(), conTarjeta.filter(s => o1.get(s).estado_revision !== 'fuentes_en_conflicto').sort(),
          'cambian justo las tarjetas con un dato de tarjeta cambiado');
        ok(`tarjetas (resumenOferta, ${CORTA}): las ${NO} en castellano, sin citas en otro idioma y sin «por participación» en el mínimo; el estado no cambia en ninguna; cambian ${cambiadas.length} (las que tienen un dato de tarjeta cambiado, y en cada una enseña el texto nuevo): ${cambiadas.join(', ') || 'ninguna'}`);

        // El sincronizador real, contra las vistas de antes y de después, en copias temporales del catálogo de la web.
        const temporal = fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-motor-${ETIQUETA}-`));
        try {
          const sincronizaCon = async (v, sub) => {
            const dir = path.join(temporal, sub); fs.mkdirSync(dir);
            const jsPath = path.join(dir, 'catalogo.js'), csvPath = path.join(dir, 'rwadar.csv');
            // El catálogo de la web de antes de aplicar: el de la carpeta, salvo que se dé otro (opciones.webAntes), como
            // al repetir un día pasado cuando la web ya lleva el catálogo de otro día (pglite.test.mjs).
            fs.copyFileSync(opciones.webAntes ? path.resolve(opciones.webAntes) : path.join(raiz, 'rwadar-site/assets/catalogo-publico-20261022.js'), jsPath);
            const leidas = [];
            const fetchFn = async url => { leidas.push(url); return { ok: true, json: async () => structuredClone(
              url.includes('catalogo_plataformas_publicas_v2') ? v.p : url.includes('catalogo_ofertas_publicas_v2') ? v.o : v.dr) }; };
            const consola = console.log; console.log = () => {};
            try { await sincronizar({ fetchFn, jsPath, csvPath, hoy: new Date(`${FECHA}T12:00:00Z`), versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true }); }
            finally { console.log = consola; }
            return { snap: fichas.leerBloquesCatalogo(fs.readFileSync(jsPath, 'utf8')), csv: fs.readFileSync(csvPath, 'utf8'), leidas };
          };
          const antes = await sincronizaCon(v0, 'antes'), despues = await sincronizaCon(v1, 'despues');
          const snap = despues.snap;
          assert.equal(snap.plataformas.length, NP); assert.equal(snap.ofertas.length, NO); assert.equal(snap.fuera.length, D.lecturaPublica.descartadas);
          assert.ok([...snap.plataformas, ...snap.ofertas].every(x => x.revisionId === NUEVA));
          assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA));
          const csv = despues.csv.trim().split('\n');
          assert.equal(csv.length, 1 + NP + D.lecturaPublica.descartadas);
          if (!radarCambia) assert.equal(despues.csv, antes.csv, 'rwadar.csv sin diferencias (el radar no cambia)');
          const salidas = fichas.construirSalidas({ catalogo: snap });
          const paginas = [...salidas.keys()].filter(n => /^(ofertas|plataformas|fuera-del-radar)\//.test(n));
          assert.deepEqual(paginas.sort(), manifiestoFichas.filter(r => /^(ofertas|plataformas|fuera-del-radar)\//.test(r)).sort(), 'mismas fichas que la lista cerrada');
          const salidas0 = fichas.construirSalidas({ catalogo: antes.snap });
          const distintas = paginas.filter(n => salidas0.get(n) !== salidas.get(n));
          for (const f of D.comprobar?.fichasWeb || []) {
            const html = salidas.get(f.pagina); assert.ok(html, `ficha web ${f.pagina}: no existe`);
            for (const t of f.contiene || []) assert.ok(html.includes(t), `ficha web ${f.pagina}: falta «${t}»`);
            for (const t of f.noContiene || []) assert.ok(!html.includes(t), `ficha web ${f.pagina}: sigue «${t}»`);
          }
          informe.fichasQueCambian = distintas.length;
          ok(`sincronizador real con estas vistas: ${NP} plataformas, ${NO} ofertas y ${D.lecturaPublica.descartadas} descartadas (CSV de ${csv.length - 1} filas${radarCambia ? '' : ', idéntico al de antes de aplicar'}), todas de la revisión nueva y verificadas el ${CORTA}; las fichas salen con la lista cerrada de siempre (${paginas.length} páginas, ninguna nueva ni retirada) y, frente a las de antes de aplicar, cambian ${distintas.length} (${distintas.filter(n => n.startsWith('ofertas/')).length} de oferta, ${distintas.filter(n => n.startsWith('plataformas/')).length} de plataforma y ${distintas.filter(n => n.startsWith('fuera-del-radar/')).length} de descartadas) por la revisión, las fechas y los textos${(D.comprobar?.fichasWeb || []).length ? `; en las fichas web, lo esperado de ${D.comprobar.fichasWeb.map(f => f.pagina.replace(/^ofertas\/|\.html$/g, '')).join(', ')}` : ''}`);
          informe.lecturasDelSincronizador = despues.leidas.map(u => u.replace(/^https:\/\/[^/]+/, ''));
        } finally { fs.rmSync(temporal, { recursive: true, force: true }); }

        if (opciones.exportar) {
          const exportar = opciones.exportar;
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

    // ------------------------------------------------------------ 4 · producción distinta
    await caso(`la publicada no es la ${PREVIA.slice(0, 8)} (es la anterior, ${ANTERIOR.slice(0, 8)})`, `update rwadar_catalogo.publicacion_v2 set revision_id = '${ANTERIOR}';`, /Publicación distinta/);
    await caso('la revisión publicada con otra huella',
      `set session_replication_role = replica; update rwadar_catalogo.revisiones set contenido_sha256 = repeat('0', 64) where id = '${PREVIA}'; set session_replication_role = origin;`,
      /identidad prevista/);
    await caso('el catálogo está retirado', 'update public.catalogo_publicacion set retirado = true;', /Catálogo retirado/);
    await caso('la revisión destino ya existe con otra huella',
      `set session_replication_role = replica; insert into rwadar_catalogo.revisiones (id, version_esquema, verificado_el, contenido_sha256, origen, plataformas_esperadas, ofertas_esperadas, colecciones_esperadas)
   values ('${NUEVA}', 2, '${FECHA}', repeat('1', 64), 'Revisión de prueba con otra identidad', ${NP}, ${NO}, '${JSON.stringify(COLECCIONES)}'); set session_replication_role = origin;`,
      /otra identidad/);
    // Aplicada después del último día vigente: la misma guarda con el último día movido al día anterior al del ensayo.
    {
      const TOPE = `  if ${relojSimulado ? `date '${HOY}'` : 'current_date'} > date '${ULTIMO}' then\n    raise exception 'Lote caducado`;
      assert.equal(SQL.split(TOPE).length, 2, `la guarda tiene la fecha tope del ${fechaLarga(ULTIMO)}`);
      const caducado = SQL.replace(TOPE, TOPE.replace(`'${ULTIMO}'`, `'${AYER}'`));
      assert.notEqual(caducado, SQL);
      await caso(`aplicada después del último día vigente (lote caducado; tope movido al ${AYER})`, null, /Lote caducado/, null, caducado);
    }
    const unaPlataforma = [...v0Slugs(D, raiz)].sort()[0];
    await caso('una plataforma del radar no está en public.plataformas (catálogo incompleto)',
      `set session_replication_role = replica; update public.plataformas set slug = '${unaPlataforma}-prueba' where slug = '${unaPlataforma}'; set session_replication_role = origin;`,
      /incompleto/);

    informe.resultado = 'correcto';
    if (opciones.escribirInforme !== false) {
      fs.mkdirSync(DIR_SALIDA, { recursive: true });
      fs.writeFileSync(path.join(DIR_SALIDA, 'pruebas-locales.json'), JSON.stringify(informe, null, 2) + '\n');
    }
    const resumen = { resultado: 'correcto', etiqueta: ETIQUETA, revisionId: NUEVA, sha256: SHA, pruebas: informe.pruebas.length,
      casosDeFallo: informe.casos.filter(c => c.falla).length, ...(relojSimulado ? { relojSimulado: HOY } : {}) };
    log(JSON.stringify(resumen, null, 1));
    return { ...resumen, informe };
  } finally { process.chdir(dondeEstaba); }
}

// Los slugs de las plataformas del radar de la entrega (para el caso de «una plataforma que falta»).
function v0Slugs(D, raiz) {
  return leer(path.join(raiz, 'rwadar-app/data/verificaciones', `${D.desde}-v2`, 'radar-canonico-26.json')).plataformas.map(p => p.slug);
}
