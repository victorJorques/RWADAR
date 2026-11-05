/* =====================================================================
   RWAdar · el catálogo siempre disponible salvo orden expresa
   ---------------------------------------------------------------------
   Prueba supabase/migrations/20261001150000_catalogo_siempre_disponible.sql
   encima de toda la cadena (01-22, 24, 25 y las dos migraciones del 30/09).

       node probar-catalogo-siempre-disponible.mjs

   probar-catalogo-v2.mjs sigue comprobando el comportamiento anterior a
   esta migración (lote caducado = vistas vacías). Aquí se comprueba el
   nuevo: caducado se publica, con las cifras vencidas ocultas; incompleto,
   futuro o retirado, no; y nunca se vuelve a una revisión anterior.
   ===================================================================== */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { baseCatalogoHistorico, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, MANIFIESTO_CATALOGO_V2,
  validarLotePublicoV2 } = require('./catalogo-publico.js');

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);

// Lote V2 sintético de 49 referencias, igual que probar-catalogo-v2.mjs.
const legado = cargarFuentesLocales('..', { revision: '2026-09-30' });
const lote = (sufijo = '') => {
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
  if (sufijo) v2.escaparate.ofertas[0].documentacion.descripcion += ` ${sufijo}`;
  return construirSqlImportacion(v2);
};

// Importa lotes del catálogo de antes del 04/11/2026 (ARTEX en el radar): base con la copia fija del seed.
const db = await baseCatalogoHistorico();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql']) {
  await db.exec(fs.readFileSync(archivo, 'utf8'));
}
const migracion = fs.readFileSync('supabase/migrations/20261001150000_catalogo_siempre_disponible.sql', 'utf8');
await db.exec(migracion);
await db.exec(migracion);
paso('la migración se puede aplicar dos veces', true);

const fechar = async (revisionId, dias) => {
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date+$2::integer where id=$1', [revisionId, dias]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date+$2::integer where revision_id=$1', [revisionId, dias]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date+$2::integer where revision_id=$1', [revisionId, dias]);
};
let segundos = 0;
const aprobar = async id => db.query(`update rwadar_catalogo.revisiones
  set estado='aprobada',aprobada_el=now()+($2::integer * interval '1 second'),
  aprobada_referencia='Aprobación sintética exclusivamente local para ensayo' where id=$1`, [id, ++segundos]);
const leer = async (rol = 'anon') => {
  await sesion(db, null, rol);
  const plataformas = await filas(db, 'select * from public.catalogo_plataformas_publicas_v2');
  const ofertas = await filas(db, 'select * from public.catalogo_ofertas_publicas_v2');
  const [orden] = await filas(db, 'select retirado, motivo from public.catalogo_publicacion');
  await sesion(db);
  return { plataformas, ofertas, orden };
};

// 1 · Revisión vigente
const primera = lote();
await db.exec(primera.sql);
await fechar(primera.revisionId, 0);
await aprobar(primera.revisionId);
let r = await leer();
paso('vigente: 26 plataformas y 49 referencias para anon',
  r.plataformas.length === 26 && r.ofertas.length === 49);
paso('vigente: la orden de retirada está desactivada', r.orden.retirado === false);
paso('vigente: hay cifras comerciales visibles',
  r.ofertas.some(o => o.rentabilidad !== null || o.precio !== null));

// 2 · La misma revisión, caducada (8 días)
await fechar(primera.revisionId, -8);
for (const rol of ['anon', 'authenticated']) {
  r = await leer(rol);
  paso(`caducada (${rol}): sigue publicada entera`,
    r.plataformas.length === 26 && r.ofertas.length === 49);
}
const fechaLote = r.plataformas[0].verificado_lote_el.toISOString().slice(0, 10);
const [hoy] = await filas(db, "select to_char(current_date - 8, 'YYYY-MM-DD') f");
paso('caducada: la fecha del lote es la real, no se rejuvenece', fechaLote === hoy.f);
paso('caducada: ninguna cifra comercial vencida es visible',
  r.ofertas.every(o => o.rentabilidad === null && o.precio === null && o.puntuacion === null && o.disponible_es === null));
paso('caducada: las referencias explican que las cifras están pendientes',
  r.ofertas.every(o => /pendiente/i.test(o.resumen)));
paso('caducada: las tablas editoriales de la revisión publicada son legibles por anon',
  await (async () => { await sesion(db, null, 'anon');
    const n = (await filas(db, 'select count(*)::int n from rwadar_catalogo.ofertas where revision_id=$1', [primera.revisionId]))[0].n;
    await sesion(db); return n === 49; })());
const api = objeto => JSON.parse(JSON.stringify(objeto), (clave, valor) =>
  ['verificado_lote_el', 'verificada_el'].includes(clave) && typeof valor === 'string' ? valor.slice(0, 10) : valor);
const plataformasApi = api(r.plataformas), ofertasApi = api(r.ofertas);
assert.throws(() => validarLotePublicoV2(plataformasApi, ofertasApi, { manifiesto: MANIFIESTO_CATALOGO_V2 }), /caducada/);
paso('caducada: un cliente antiguo la sigue rechazando igual que antes', true);
const aceptado = validarLotePublicoV2(plataformasApi, ofertasApi,
  { manifiesto: MANIFIESTO_CATALOGO_V2, permitirCaducado: true });
paso('caducada: un cliente nuevo la acepta marcada como caducada',
  aceptado.caducado === true && aceptado.edadDias === 8);

// 3 · Una revisión nueva sustituye a la caducada; la vieja no se puede leer
const segunda = lote('Segunda revisión.');
await db.exec(segunda.sql);
await fechar(segunda.revisionId, 0);
await aprobar(segunda.revisionId);
r = await leer();
paso('nueva revisión: se publica la nueva, no la anterior',
  r.plataformas.length === 26 && r.plataformas.every(p => p.revision_id === segunda.revisionId));
paso('nueva revisión: la anterior caducada deja de ser legible',
  await (async () => { await sesion(db, null, 'anon');
    const n = (await filas(db, 'select count(*)::int n from rwadar_catalogo.ofertas where revision_id=$1', [primera.revisionId]))[0].n;
    await sesion(db); return n === 0; })());

// 4 · Incompleta: no se publica y no se vuelve a la anterior
const slug = (await filas(db, 'select slug from rwadar_catalogo.ofertas where revision_id=$1 limit 1', [segunda.revisionId]))[0].slug;
const copia = (await filas(db, 'select * from rwadar_catalogo.ofertas where revision_id=$1 and slug=$2', [segunda.revisionId, slug]))[0];
await db.query('delete from rwadar_catalogo.ofertas where revision_id=$1 and slug=$2', [segunda.revisionId, slug]);
r = await leer();
paso('incompleta: las vistas quedan vacías sin volver a la revisión anterior',
  r.plataformas.length === 0 && r.ofertas.length === 0);
paso('incompleta: no es una orden de retirada (la web conserva su copia)', r.orden.retirado === false);
await db.exec(segunda.sql);
r = await leer();
paso('reparada: vuelve a publicarse', r.plataformas.length === 26 && r.ofertas.length === 49);
assert.ok(copia);

// 5 · Fechada en el futuro: no se publica
await fechar(segunda.revisionId, 1);
r = await leer();
paso('futura: no se publica', r.plataformas.length === 0 && r.ofertas.length === 0);
await fechar(segunda.revisionId, 0);

// 6 · Retirada: es una orden expresa
await db.query("update rwadar_catalogo.revisiones set estado='retirada',aprobada_el=null,aprobada_referencia=null where id=$1",
  [segunda.revisionId]);
r = await leer();
paso('retirada: las vistas quedan vacías', r.plataformas.length === 0 && r.ofertas.length === 0);
paso('retirada: activa la orden de retirada con su motivo',
  r.orden.retirado === true && /retirado/.test(r.orden.motivo));
paso('retirada: la primera revisión no vuelve',
  await (async () => { await sesion(db, null, 'anon');
    const n = (await filas(db, 'select count(*)::int n from rwadar_catalogo.ofertas where revision_id=$1', [primera.revisionId]))[0].n;
    await sesion(db); return n === 0; })());

// 7 · Aprobar otra revisión es la orden de volver a publicar
const tercera = lote('Tercera revisión.');
await db.exec(tercera.sql);
await fechar(tercera.revisionId, 0);
await aprobar(tercera.revisionId);
r = await leer();
paso('nueva aprobación: vuelve a publicarse y desactiva la retirada',
  r.plataformas.length === 26 && r.orden.retirado === false && r.orden.motivo === null);

// 8 · La orden manual de Víctor y los permisos
await db.exec("update public.catalogo_publicacion set retirado=true, motivo='Orden manual de prueba'");
r = await leer();
paso('orden manual: se lee como retirada', r.orden.retirado === true);
for (const rol of ['anon', 'authenticated']) {
  await sesion(db, null, rol);
  let rechazado = false;
  try { await db.query('update public.catalogo_publicacion set retirado=false'); } catch { rechazado = true; }
  await sesion(db);
  paso(`${rol} no puede cambiar la orden de retirada`, rechazado);
}
const [permisos] = await filas(db, `select
  has_function_privilege('anon','rwadar_catalogo.sincronizar_publicacion_catalogo()','EXECUTE') anon,
  has_function_privilege('authenticated','rwadar_catalogo.sincronizar_publicacion_catalogo()','EXECUTE') authn,
  has_table_privilege('anon','public.catalogo_publicacion','INSERT') ins,
  has_table_privilege('anon','public.catalogo_publicacion','DELETE') del`);
paso('la función del disparador no es una RPC pública', !permisos.anon && !permisos.authn);
paso('nadie puede insertar ni borrar la orden desde la API', !permisos.ins && !permisos.del);
const [rls] = await filas(db, "select relrowsecurity from pg_class where oid='public.catalogo_publicacion'::regclass");
paso('la orden tiene RLS activado', rls.relrowsecurity === true);
const vistas = await filas(db, `select relname, reloptions from pg_class where oid in
  ('rwadar_catalogo.revision_publicable_v2'::regclass,'public.catalogo_plataformas_publicas_v2'::regclass,
   'public.catalogo_ofertas_publicas_v2'::regclass)`);
paso('las vistas siguen siendo security_invoker', vistas.every(v => v.reloptions.includes('security_invoker=true')));

console.log('=== CATÁLOGO SIEMPRE DISPONIBLE ===');
ok.forEach(t => console.log('  OK   ', t));
fail.forEach(t => console.log('  FALLO', t));
console.log(`\n${ok.length} correctas, ${fail.length} fallidas`);
await db.close();
if (fail.length) process.exit(1);
