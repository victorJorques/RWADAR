// Comprueba el lote de una fecha sobre la misma cadena que producción
// (PGlite): con la revisión anterior aprobada, el borrador nuevo no se ve; tras
// el aplicar-y-aprobar.sql que se pega en Supabase, las vistas públicas
// entregan 26/49 que la app y la web aceptan, y caduca a los 7 días.
// Uso: node rwadar-app/comprobar-revision.mjs AAAA-MM-DD
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const { baseCompleta, filas, sesion } = await import('./pruebas-soporte.mjs');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2 } = require('./catalogo-publico.js');

const FECHA = process.argv[2];
assert.match(FECHA || '', /^\d{4}-\d{2}-\d{2}$/, 'Uso: node rwadar-app/comprobar-revision.mjs AAAA-MM-DD');
const carpeta = `data/importaciones/catalogo-${FECHA}-v2/`;
const { revisionAnterior } = JSON.parse(fs.readFileSync(carpeta + 'revision.json', 'utf8'));
const { desde } = JSON.parse(fs.readFileSync(`data/verificaciones/${FECHA}-v2/cambios-${FECHA}.json`, 'utf8'));
const nueva = construirSqlImportacion(cargarFuentesLocales('..', { revision: FECHA, versionEsquema: 2 }));
assert.equal(fs.readFileSync(carpeta + 'catalogo.sql', 'utf8'), nueva.sql, 'catalogo.sql coincide con las fuentes');

const db = await baseCompleta();
await db.exec('alter default privileges grant all on tables to anon, authenticated');
for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
  'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
  'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql',
  'supabase/migrations/20261001150000_catalogo_siempre_disponible.sql']) {
  await db.exec(fs.readFileSync(archivo, 'utf8'));
}
const leerVistas = async () => {
  await sesion(db, null, 'anon');
  const api = o => JSON.parse(JSON.stringify(o), (k, v) =>
    ['verificado_lote_el', 'verificada_el'].includes(k) && typeof v === 'string' ? v.slice(0, 10) : v);
  const plataformas = api(await filas(db, 'select * from public.catalogo_plataformas_publicas_v2'));
  const ofertas = api(await filas(db, 'select * from public.catalogo_ofertas_publicas_v2'));
  await sesion(db);
  return { plataformas, ofertas };
};

// La revisión que hay hoy en producción, aplicada con su propio archivo.
await db.exec(fs.readFileSync(`data/importaciones/catalogo-${desde}-v2/aplicar-y-aprobar.sql`, 'utf8'));
const antes = await leerVistas();
assert.equal(antes.ofertas.length, 49, `el lote del ${desde} se ve antes de importar el nuevo`);
assert.ok(antes.ofertas.every(o => o.revision_id === revisionAnterior), 'la revisión anterior es la publicada');

await db.exec(nueva.sql);
assert.equal((await leerVistas()).ofertas[0].revision_id, revisionAnterior, 'el borrador no desplaza lo publicado');

// El mismo archivo que se pega en Supabase: importa (idempotente) y aprueba.
const aplicar = fs.readFileSync(carpeta + 'aplicar-y-aprobar.sql', 'utf8');
await db.exec(aplicar);
await db.exec(aplicar);
const [rev] = await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1', [nueva.revisionId]);
assert.equal(rev.estado, 'aprobada');
const { plataformas, ofertas } = await leerVistas();
assert.equal(plataformas.length, 26, 'plataformas visibles');
assert.equal(ofertas.length, 49, 'ofertas visibles');
assert.ok([...plataformas, ...ofertas].every(x => x.revision_id === nueva.revisionId), 'todo sale del lote nuevo');
const resultado = validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: FECHA });
assert.equal(resultado.vigenciaDias, 7);
const dia = n => new Date(Date.parse(`${FECHA}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2, hoy: dia(7) });
assert.throws(() => validarLotePublicoV2(plataformas, ofertas, { manifiesto: MANIFIESTO_CATALOGO_V2,
  hoy: dia(8) }), /caducada/);
const conCifras = ofertas.filter(o => o.metricas?.[0]?.valor !== 'Cifras pendientes de nueva revisión').length;
console.log(`OK lote ${nueva.revisionId}: 26 plataformas, 49 ofertas, vigente hasta el ${dia(7)} inclusive; ` +
  `${conCifras} fichas con cifras vigentes el ${FECHA}. Aplicado dos veces sin error.`);
