// Comprueba el lote del 06/10/2026 sobre la misma cadena que producción
// (PGlite): se importa como borrador, no se ve; se aprueba y las vistas
// públicas entregan 26/49 que la app y la web aceptan.
// Uso: node rwadar-app/comprobar-revision-2026-10-06.mjs [--fechas-sinteticas]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { baseCompleta, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2 } = require('./catalogo-publico.js');

const FECHA = '2026-10-06';
// Antes de las 00:00 UTC del 06/10 la base aún vive el 05/10: con esta opción
// se retrasan las fechas un día solo en la base efímera, para ensayar antes.
const sinteticas = process.argv.includes('--fechas-sinteticas');

const anterior = construirSqlImportacion(cargarFuentesLocales('..', { revision: '2026-09-30', versionEsquema: 2 }));
const nueva = construirSqlImportacion(cargarFuentesLocales('..', { revision: FECHA, versionEsquema: 2 }));
assert.equal(nueva.fecha, FECHA);

const db = await baseCompleta();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) {
  await db.exec(fs.readFileSync(archivo, 'utf8'));
}
const aprobar = id => db.query(`update rwadar_catalogo.revisiones set estado='aprobada',aprobada_el=clock_timestamp(),
  aprobada_referencia='Ensayo local del lote del 06/10/2026' where id=$1`, [id]);
const leerVistas = async () => {
  await sesion(db, null, 'anon');
  const api = o => JSON.parse(JSON.stringify(o), (k, v) =>
    ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
  const plataformas = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'));
  const ofertas = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
  await sesion(db);
  return { plataformas, ofertas };
};

await db.exec(anterior.sql);
await aprobar(anterior.revisionId);
const hoyAnterior = (await leerVistas());
assert.equal(hoyAnterior.ofertas.length, 49, 'el lote del 30/09 se ve antes de importar el nuevo');

await db.exec(nueva.sql);
assert.equal((await leerVistas()).ofertas[0].revision_id, anterior.revisionId, 'el borrador no desplaza lo publicado');
const carpeta = `data/importaciones/catalogo-${FECHA}-v2/`;
assert.equal(fs.readFileSync(carpeta + 'catalogo.sql', 'utf8'), nueva.sql, 'catalogo.sql coincide con las fuentes');
if (sinteticas) {
  await db.query(`update rwadar_catalogo.revisiones set verificado_el=verificado_el-1 where id=$1`, [nueva.revisionId]);
  await db.query(`update rwadar_catalogo.fuentes set consultada_el=consultada_el-1 where revision_id=$1`, [nueva.revisionId]);
  await db.query(`update rwadar_catalogo.ofertas set verificada_el=verificada_el-1 where revision_id=$1`, [nueva.revisionId]);
  await aprobar(nueva.revisionId);
} else {
  // El mismo archivo que se pega en Supabase: importa (idempotente) y aprueba.
  await db.exec(fs.readFileSync(carpeta + 'aplicar-y-aprobar.sql', 'utf8'));
  const [rev] = await filas(db, 'select estado, aprobada_referencia from rwadar_catalogo.revisiones where id=$1', [nueva.revisionId]);
  assert.equal(rev.estado, 'aprobada');
}
const { plataformas, ofertas } = await leerVistas();
assert.equal(plataformas.length, 26, 'plataformas visibles');
assert.equal(ofertas.length, 49, 'ofertas visibles');
assert(ofertas.every(o => o.revision_id === nueva.revisionId), 'todo sale del lote nuevo');
const hoy = sinteticas ? '2026-10-05' : FECHA;
const resultado = validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy });
assert.equal(resultado.vigenciaDias, 7);
const vence = new Date(Date.parse(`${FECHA}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10);
assert.throws(() => validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2,
  hoy: sinteticas ? '2026-10-13' : '2026-10-14' }), /caducada/);
const conCifras = ofertas.filter(o => o.metricas?.[0]?.valor !== 'Cifras pendientes de nueva revisión').length;
console.log(`OK lote ${nueva.revisionId}: 26 plataformas, 49 ofertas, vigente hasta el ${vence} inclusive; ` +
  `${conCifras} fichas con cifras vigentes el ${hoy}${sinteticas ? ' (fechas sintéticas)' : ''}.`);
