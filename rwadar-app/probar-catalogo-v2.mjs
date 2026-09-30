import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { baseCompleta, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublico, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2, normalizarManifiestoLocal } = require('./catalogo-publico.js');
const { sincronizar } = require('./sincronizar.js');
const legado = cargarFuentesLocales('..', { revision: '2026-09-30' });
const v2 = structuredClone(legado);
v2.manifiesto = structuredClone(MANIFIESTO_CATALOGO_V2);
v2.escaparate.versionEsquema = 2;
v2.escaparate.ofertas = legado.escaparate.ofertas.slice(0, 24)
  .map(o => ({ ...structuredClone(o), coleccion: 'principales' }));
for (const [coleccion, cantidad] of [['secundario', 21], ['en_camino', 4]]) {
  for (let i = 0; i < cantidad; i++) {
    const o = structuredClone(legado.escaparate.ofertas[i % legado.escaparate.ofertas.length]);
    v2.escaparate.ofertas.push({ ...o, slug: `prueba-${coleccion.replace('_', '-')}-${i + 1}`,
      titulo: `Referencia documental de prueba ${coleccion} ${i + 1}`, coleccion,
      estadoRevision: 'no_verificable', precio: null, rentabilidad: null, puntuacion: null, disponibleEs: null });
  }
}
const importacionV1 = construirSqlImportacion(legado);
const importacionV2 = construirSqlImportacion(v2);
assert.deepEqual(normalizarManifiestoLocal({ version_esquema: 2, plataformas_esperadas: 26,
  ofertas_esperadas: 49, colecciones_esperadas: { principales: 24, secundario: 21, en_camino: 4 } }),
MANIFIESTO_CATALOGO_V2);
assert.throws(() => construirSqlImportacion({ radar: v2.radar, escaparate: v2.escaparate }), /manifiesto/);
for (const alterar of [
  fuente => { fuente.manifiesto.coleccionesEsperadas.secundario--; },
  fuente => { fuente.escaparate.ofertas.pop(); },
  fuente => { fuente.escaparate.ofertas[0].coleccion = 'principal'; },
  fuente => { fuente.escaparate.ofertas[24].precio = { mostrado: '999 EUR', unidad: 'Precio de prueba' }; },
  fuente => { fuente.escaparate.ofertas[24].estadoRevision = 'actual'; },
]) {
  const invalida = structuredClone(v2); alterar(invalida);
  assert.throws(() => construirSqlImportacion(invalida));
}

const db = await baseCompleta();
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-v2-'));
try {
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql']) {
    await db.exec(fs.readFileSync(archivo, 'utf8'));
  }
  const politicas = () => filas(db, `select * from pg_policies where schemaname='rwadar_catalogo'
    and tablename <> 'publicacion_v2' order by tablename,policyname`);
  const seguridad = () => filas(db, `select c.relname,c.relowner::regrole::text propietario,
    c.relacl::text acl,c.relrowsecurity rls,c.relforcerowsecurity forzar_rls,c.reloptions
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname='rwadar_catalogo' and c.relname in ('revisiones','ofertas'))
       or (n.nspname='public' and c.relname in ('catalogo_plataformas_publicas','catalogo_ofertas_publicas'))
    order by n.nspname,c.relname`);
  const politicasAntes = await politicas();
  const seguridadAntes = await seguridad();
  await db.exec(fs.readFileSync('supabase/migrations/20260930090621_catalogo_v2_colecciones.sql', 'utf8'));
  assert.deepEqual(await politicas(), politicasAntes);
  assert.deepEqual(await seguridad(), seguridadAntes);
  const vistas = await filas(db, `select relname,reloptions from pg_class where oid in
    ('rwadar_catalogo.revision_publicable_v2'::regclass,'public.catalogo_plataformas_publicas_v2'::regclass,
     'public.catalogo_ofertas_publicas_v2'::regclass)`);
  assert(vistas.every(v => v.reloptions.includes('security_invoker=true')));
  for (const invalida of [
    "version_esquema=1,plataformas_esperadas=25", "version_esquema=1,ofertas_esperadas=49",
    "version_esquema=3", "version_esquema=2,colecciones_esperadas=null",
    `version_esquema=2,ofertas_esperadas=49,colecciones_esperadas='{"principales":24,"secundario":21,"en_camino":3}'`,
    `version_esquema=2,ofertas_esperadas=49,colecciones_esperadas='{"principales":"24","secundario":21,"en_camino":4}'`,
  ]) {
    await db.exec(importacionV1.sql);
    await assert.rejects(db.exec(`update rwadar_catalogo.revisiones set ${invalida} where id='${importacionV1.revisionId}'`));
  }
  await db.exec(importacionV2.sql);
  // Fechas sintéticas se alinean solo en esta base efímera; no cambian las fuentes del repositorio.
  await db.exec(`update rwadar_catalogo.revisiones set verificado_el=current_date;
    update rwadar_catalogo.fuentes set consultada_el=current_date;
    update rwadar_catalogo.ofertas set verificada_el=current_date;`);
  const aprobar = async (id, segundos = 0) => db.query(`update rwadar_catalogo.revisiones
    set estado='aprobada',aprobada_el=now()+($2::integer * interval '1 second'),
    aprobada_referencia='Aprobación sintética exclusivamente local para ensayo V2' where id=$1`, [id, segundos]);
  await aprobar(importacionV1.revisionId, -60);
  await sesion(db, null, 'anon');
  assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas')).length, 28);
  assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas_v2')).length, 0);
  await sesion(db);
  await aprobar(importacionV2.revisionId);

  let plataformas, ofertas;
  const api = objeto => JSON.parse(JSON.stringify(objeto), (clave, valor) =>
    ['verificado_lote_el', 'verificada_el'].includes(clave) && typeof valor === 'string' ? valor.slice(0, 10) : valor);
  for (const rol of ['anon', 'authenticated']) {
    await sesion(db, null, rol);
    plataformas = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'));
    ofertas = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
    assert.equal(plataformas.length, 26); assert.equal(ofertas.length, 49);
    assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas')).length, 28);
    validarLotePublico(api(await filas(db, 'select * from public.catalogo_plataformas_publicas')),
      api(await filas(db, 'select * from public.catalogo_ofertas_publicas')));
    const resultado = validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2 });
    assert.equal(resultado.vigenciaDias, 7);
    assert(ofertas.filter(o => o.coleccion !== 'principales').every(o => o.precio === null &&
      o.rentabilidad === null && o.puntuacion === null && o.disponible_es === null && o.estado_revision === 'no_verificable'));
    await assert.rejects(db.exec('delete from rwadar_catalogo.publicacion_v2'));
    await assert.rejects(db.exec('update rwadar_catalogo.ofertas set coleccion=\'principales\''));
    await sesion(db);
    assert.equal((await filas(db, `select has_function_privilege($1,
      'rwadar_catalogo.fijar_publicacion_v2()','EXECUTE') ejecutar`, [rol]))[0].ejecutar, false);
    assert.equal((await filas(db, `select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='rwadar_catalogo' and c.relkind in ('r','v')
      and (has_table_privilege($1,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege($1,c.oid,'INSERT,UPDATE,REFERENCES'))`, [rol])).length, 0);
  }
  for (const alterar of [
    lote => { lote.ofertas.pop(); },
    lote => { lote.ofertas[0].revision_id = '00000000-0000-0000-0000-000000000000'; },
    lote => { lote.ofertas[0].colecciones_esperadas.secundario = 20; },
    lote => { lote.ofertas[0].version_esquema = 1; },
    lote => { lote.ofertas[24].coleccion = 'principales'; },
    lote => { lote.ofertas.find(o => o.coleccion === 'secundario').precio = { mostrado: '9 EUR', unidad: 'prueba' }; },
    lote => { lote.plataformas[0].verificado_lote_el = '2099-01-01'; },
    lote => { lote.ofertas[0].vigencia_lote_dias = 6; },
  ]) {
    const lote = structuredClone({ plataformas, ofertas }); alterar(lote);
    assert.throws(() => validarLotePublicoV2(lote.plataformas, lote.ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2 }));
  }
  assert.throws(() => validarLotePublicoV2(plataformas, ofertas), /manifiesto/);
  assert.throws(() => validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: '2099-01-01' }), /caducada/);

  const jsPath = path.join(temporal, 'sitio.js');
  fs.writeFileSync(jsPath, 'const P=[\n\n];\nconst FUERA=[\n\n];\nconst EMI=[\n\n];\n');
  const descartes = Array.from({ length: 4 }, (_, i) => ({ nombre: `Descarte ${i}`,
    etiqueta_descarte: 'Sin evidencia', motivo_descarte: 'Descarte documentado en ensayo sintético.',
    fuentes: [{ url: `https://example.test/${i}`, titulo: `Fuente ${i}` }] }));
  const fetchFn = async url => ({ ok: true, json: async () => url.includes('catalogo_plataformas_publicas_v2')
    ? plataformas : url.includes('catalogo_ofertas_publicas_v2') ? ofertas : descartes });
  await sincronizar({ jsPath, csvPath: path.join(temporal, 'sitio.csv'), fetchFn,
    versionEsquema: 2, manifiesto: MANIFIESTO_CATALOGO_V2 });
  const transporte = JSON.parse(JSON.stringify(vm.runInNewContext(fs.readFileSync(jsPath, 'utf8') + '\n({P,EMI});')));
  assert.equal(transporte.P.length, 26); assert.equal(transporte.EMI.length, 49);
  assert(transporte.P.concat(transporte.EMI).every(f => f.version_esquema === 2 && f.ofertas_esperadas === 49 &&
    f.colecciones_esperadas.secundario === 21 && f.vigencia_lote_dias === 7));
  const antes = fs.readFileSync(jsPath, 'utf8');
  await assert.rejects(sincronizar({ jsPath, csvPath: path.join(temporal, 'sitio.csv'), versionEsquema: 2,
    manifiesto: MANIFIESTO_CATALOGO_V2, fetchFn: async url => ({ ok: true, json: async () =>
      url.includes('catalogo_ofertas_publicas_v2') ? ofertas.slice(1) : url.includes('catalogo_plataformas_publicas_v2')
        ? plataformas : descartes }) }));
  assert.equal(fs.readFileSync(jsPath, 'utf8'), antes, 'la sincronización rechazada conserva el archivo anterior');

  const vacio = async () => {
    for (const rol of ['anon', 'authenticated']) {
      await sesion(db, null, rol);
      assert.equal((await filas(db, 'select * from public.catalogo_plataformas_publicas_v2')).length, 0);
      assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas_v2')).length, 0);
      assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas')).length, 28,
        'el cierre V2 no altera V1');
      await sesion(db);
    }
  };
  const segunda = structuredClone(v2);
  segunda.escaparate.ofertas[0].documentacion.descripcion += ' Segunda revisión sintética.';
  const importacionSegunda = construirSqlImportacion(segunda);
  await db.exec(importacionSegunda.sql);
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1', [importacionSegunda.revisionId]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1', [importacionSegunda.revisionId]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date where revision_id=$1', [importacionSegunda.revisionId]);
  await db.query('delete from rwadar_catalogo.ofertas where revision_id=$1 and slug=$2', [importacionSegunda.revisionId, segunda.escaparate.ofertas[0].slug]);
  await aprobar(importacionSegunda.revisionId, 1);
  await vacio();
  // Reparar el elemento ausente demuestra que el siguiente cierre se debe
  // exclusivamente a la caducidad de la última aprobación, no al hueco anterior.
  await db.exec(importacionSegunda.sql);
  await sesion(db, null, 'anon');
  assert.equal((await filas(db, 'select * from public.catalogo_ofertas_publicas_v2')).length, 49);
  await sesion(db);
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date-8 where id=$1', [importacionSegunda.revisionId]);
  await vacio();
  await sesion(db, null, 'anon');
  assert.equal((await filas(db, 'select revision_id from rwadar_catalogo.publicacion_v2'))[0].revision_id, importacionSegunda.revisionId);
  assert.equal((await filas(db, 'select id from rwadar_catalogo.revisiones where id=$1', [importacionSegunda.revisionId])).length, 0,
    'la política original oculta metadatos caducados, el marcador sigue visible');
  await sesion(db);
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1', [importacionSegunda.revisionId]);
  await db.query("update rwadar_catalogo.revisiones set estado='retirada',aprobada_el=null,aprobada_referencia=null where id=$1", [importacionSegunda.revisionId]);
  await vacio();
  const durables = cargarFuentesLocales('..', { revision: '2026-09-30', versionEsquema: 2 });
  assert.deepEqual(durables.manifiesto, MANIFIESTO_CATALOGO_V2);
  const importacionDurable = construirSqlImportacion(durables);
  await db.exec(importacionDurable.sql);
  const coleccionesDurables = await filas(db, `select coleccion,count(*)::integer cantidad
    from rwadar_catalogo.ofertas where revision_id=$1 group by coleccion order by coleccion`, [importacionDurable.revisionId]);
  assert.deepEqual(coleccionesDurables, [{ coleccion: 'en_camino', cantidad: 4 },
    { coleccion: 'principales', cantidad: 24 }, { coleccion: 'secundario', cantidad: 21 }]);
  assert.equal((await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1', [importacionDurable.revisionId]))[0].estado,
    'borrador', 'la entrega durable se importa sin aprobar');
  await vacio();
  console.log('Catálogo V2: manifiesto, 49 colecciones, RLS/invoker, V1, transporte y cierre sin fallback verificados.');
}
finally {
  await db.close();
  assert(path.resolve(temporal).startsWith(path.resolve(os.tmpdir()) + path.sep) &&
    path.basename(temporal).startsWith('rwadar-v2-'), 'la limpieza debe quedar dentro del temporal de la prueba');
  fs.rmSync(temporal, { recursive: true, force: true });
}
