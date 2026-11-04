// Comprueba el lote de una fecha sobre la misma cadena que producción
// (PGlite): con la revisión anterior aprobada, el borrador nuevo no se ve; tras
// el aplicar-y-aprobar.sql que se pega en Supabase, las vistas públicas
// entregan el lote completo de su manifiesto, que la app y la web aceptan, y
// caduca a los 7 días. Uso: node rwadar-app/comprobar-revision.mjs AAAA-MM-DD[.N]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const { baseCompleta, filas, sesion } = await import('./pruebas-soporte.mjs');
const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, validarLotePublicoV2,
  MANIFIESTO_CATALOGO_V2, esRevisionLocal, ordenRevisionLocal } = require('./catalogo-publico.js');

const ETIQUETA = process.argv[2];
assert.ok(esRevisionLocal(ETIQUETA), 'Uso: node rwadar-app/comprobar-revision.mjs AAAA-MM-DD[.N]');
const FECHA = ETIQUETA.slice(0, 10);
const carpeta = `data/importaciones/catalogo-${ETIQUETA}-v2/`;
const { revisionAnterior } = JSON.parse(fs.readFileSync(carpeta + 'revision.json', 'utf8'));
const { desde } = JSON.parse(fs.readFileSync(`data/verificaciones/${ETIQUETA}-v2/cambios-${ETIQUETA}.json`, 'utf8'));
const nueva = construirSqlImportacion(cargarFuentesLocales('..', { revision: ETIQUETA, versionEsquema: 2 }));
const manifiesto = JSON.parse(fs.readFileSync(`data/verificaciones/${ETIQUETA}-v2/manifiesto-catalogo.json`, 'utf8'));
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

// La revisión que hay hoy en producción, aplicada con su propio archivo. Desde el
// 23/10 cada aplicador exige que la anterior esté publicada: se reproduce la
// cadena desde el lote integral del 22/10 hasta la revisión de partida. Una entrega
// que no crea revisión (revisionNueva: false, como la 2026-11-03.8, que solo cambia
// textos de public.plataformas con guardas sobre su contenido) no mueve la publicada
// y no entra en la cadena: su guarda depende de lo que haya en 02_seed.sql.
const sinRevisionNueva = r => {
  try { return JSON.parse(fs.readFileSync(`data/importaciones/catalogo-${r}-v2/revision.json`, 'utf8')).revisionNueva === false; }
  catch { return false; }
};
const cadena = fs.readdirSync('data/importaciones').map(d => d.match(/^catalogo-(\d{4}-\d{2}-\d{2}(?:\.\d{1,2})?)-v2$/)?.[1])
  .filter(r => r && esRevisionLocal(r) && ordenRevisionLocal(r, '2026-10-22') >= 0 && ordenRevisionLocal(r, desde) <= 0 &&
    fs.existsSync(`data/importaciones/catalogo-${r}-v2/aplicar-y-aprobar.sql`) && !sinRevisionNueva(r)).sort(ordenRevisionLocal);
assert.equal(cadena.at(-1), desde, 'la cadena termina en la revisión de partida');
for (const r of cadena) await db.exec(fs.readFileSync(`data/importaciones/catalogo-${r}-v2/aplicar-y-aprobar.sql`, 'utf8'));
const antes = await leerVistas();
assert.ok(antes.ofertas.length > 0, `el lote del ${desde} se ve antes de importar el nuevo`);
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
assert.equal(plataformas.length, manifiesto.plataformas_esperadas, 'plataformas visibles');
assert.equal(ofertas.length, manifiesto.ofertas_esperadas, 'ofertas visibles');
assert.ok([...plataformas, ...ofertas].every(x => x.revision_id === nueva.revisionId), 'todo sale del lote nuevo');
const v2 = { manifiesto: MANIFIESTO_CATALOGO_V2, permitirAmpliacion: true };
const resultado = validarLotePublicoV2(plataformas, ofertas, { ...v2, hoy: FECHA });
assert.equal(resultado.vigenciaDias, 7);
const dia = n => new Date(Date.parse(`${FECHA}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
validarLotePublicoV2(plataformas, ofertas, { ...v2, hoy: dia(7) });
assert.throws(() => validarLotePublicoV2(plataformas, ofertas, { ...v2, hoy: dia(8) }), /caducada/);
const conCifras = ofertas.filter(o => o.metricas?.[0]?.valor !== 'Cifras pendientes de nueva revisión').length;
console.log(`OK lote ${nueva.revisionId}: ${plataformas.length} plataformas, ${ofertas.length} ofertas, vigente hasta el ${dia(7)} inclusive; ` +
  `${conCifras} fichas con cifras vigentes el ${FECHA}. Aplicado dos veces sin error.`);
