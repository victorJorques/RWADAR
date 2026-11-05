import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { baseCatalogoHistorico, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion, validarDocumentacionOferta,
  validarLotePublico } = require('./catalogo-publico.js');
const { sincronizar } = require('./sincronizar.js');
const { adaptarCatalogo } = require('../rwadar-movil/lib/catalogo-remoto');
const documentacion = JSON.parse(fs.readFileSync(
  'data/verificaciones/2026-09-30/documentacion-ofertas.json', 'utf8'));
const fuenteAnterior = cargarFuentesLocales('..', { revision: '2026-09-28' });
const anterior = construirSqlImportacion(fuenteAnterior);
const fuenteDocumentada = structuredClone(fuenteAnterior);
fuenteDocumentada.escaparate.ofertas.forEach(o => { o.documentacion = documentacion[o.slug]; });
const nuevo = construirSqlImportacion(fuenteDocumentada);
const corteDocumental = cargarFuentesLocales('..', { revision: '2026-09-30' });
assert.equal(corteDocumental.radar.verificadoEl, fuenteAnterior.radar.verificadoEl,
  'la entrega documental no renueva la revisión del radar');
assert.deepEqual(corteDocumental.escaparate.ofertas.map(o => o.verificadaEl),
  fuenteAnterior.escaparate.ofertas.map(o => o.verificadaEl));
assert(corteDocumental.escaparate.ofertas.every(o => o.documentacion === undefined ? false :
  JSON.stringify(o.documentacion) === JSON.stringify(documentacion[o.slug])));
assert.equal(Object.keys(documentacion).length, 28);
assert.notEqual(nuevo.revisionId, anterior.revisionId);
assert.deepEqual(fuenteDocumentada.escaparate.ofertas.map(o => o.verificadaEl),
  fuenteAnterior.escaparate.ofertas.map(o => o.verificadaEl));
assert(!/patrocinada,documentacion/.test(anterior.sql), 'el importador antiguo conserva compatibilidad');
assert(/patrocinada,documentacion/.test(nuevo.sql), 'el importador transporta la sección nueva');

const documento = Object.values(documentacion).find(d => d.referencias.length);
for (const alterar of [
  d => { d.revisadaEl = '2099-01-01'; },
  d => { d.revisadaEl = '2026-02-30'; },
  d => { d.fuentes[0] = 'http://example.test/'; },
  d => { d.caracteristicas[0].valor = ''; },
  d => { d.referencias[0].fechaDato = '2026-02-30'; },
  d => { d.referencias[0].fechaDato = '2099-01-01'; },
  d => { d.referencias[0].fechaConsulta = '2099-01-01'; },
  d => { d.referencias[0].fuente = 'https://example.test/fuera-del-manifiesto'; },
  d => { d.referencias[0].alcance = ''; },
]) {
  const invalido = structuredClone(documento);
  alterar(invalido);
  assert.throws(() => validarDocumentacionOferta(invalido, 'prueba', { hoy: '2026-09-30' }));
}
assert.equal(validarDocumentacionOferta(null, 'anterior'), null);
assert.equal(validarDocumentacionOferta(undefined, 'anterior'), null);

// Importa lotes del catálogo de antes del 04/11/2026 (ARTEX en el radar): base con la copia fija del seed.
const db = await baseCatalogoHistorico();
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-documentacion-'));
try {
  await db.exec('alter default privileges grant all on tables to anon, authenticated');
  await db.exec(fs.readFileSync('db/24_catalogo_publico_verificado.sql', 'utf8'));
  await db.exec(fs.readFileSync('db/25_servicios_editoriales_solo_lectura.sql', 'utf8'));
  await db.exec(anterior.sql);
  const estadoSeguridad = () => filas(db, `select c.relname,c.relowner::regrole::text propietario,
    c.relacl::text acl,c.relrowsecurity rls,c.relforcerowsecurity forzar_rls,c.reloptions
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname='public' and c.relname='catalogo_ofertas_publicas')
       or (n.nspname='rwadar_catalogo' and c.relname='ofertas') order by n.nspname,c.relname`);
  const estadoPoliticas = () => filas(db, `select * from pg_policies
    where schemaname='rwadar_catalogo' order by tablename,policyname`);
  const columnasVista = () => filas(db, `select attname,format_type(atttypid,atttypmod) tipo
    from pg_attribute where attrelid='public.catalogo_ofertas_publicas'::regclass
      and attnum>0 and not attisdropped order by attnum`);
  const seguridadAntes = await estadoSeguridad();
  const politicasAntes = await estadoPoliticas();
  const columnasAntes = await columnasVista();
  const consultaAntes = (await filas(db,
    "select pg_get_viewdef('public.catalogo_ofertas_publicas'::regclass,true) consulta"))[0].consulta;
  await db.exec(fs.readFileSync(
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql', 'utf8'));
  assert.deepEqual(await estadoSeguridad(), seguridadAntes, 'propietario, ACL, RLS e invoker sin cambios');
  assert.deepEqual(await estadoPoliticas(), politicasAntes, 'políticas sin cambios');
  assert.deepEqual(await columnasVista(), [...columnasAntes, { attname: 'documentacion', tipo: 'jsonb' }]);
  const consultaDespues = (await filas(db,
    "select pg_get_viewdef('public.catalogo_ofertas_publicas'::regclass,true) consulta"))[0].consulta;
  // Al expandir o.*, PostgreSQL incorpora la columna en el CTE y en la salida.
  assert.equal(consultaDespues.replace(/,\s*o(?:_1)?\.documentacion/g, ''), consultaAntes,
    'la consulta anterior, incluidos CASE y ORDER BY, se conserva literalmente');
  assert.equal((await filas(db, 'select count(*)::int c from rwadar_catalogo.ofertas where documentacion is null'))[0].c, 28);
  await assert.rejects(db.exec("update rwadar_catalogo.ofertas set documentacion='[]'::jsonb"));

  await db.exec(nuevo.sql);
  assert.equal((await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1', [nuevo.revisionId]))[0].estado, 'borrador');
  await sesion(db, null, 'anon');
  assert.equal((await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c, 0,
    'documentar no convierte un borrador en público');
  await sesion(db);
  // Mover solo fechas de la base efímera para que la prueba no caduque.
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date where id=$1', [nuevo.revisionId]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1', [nuevo.revisionId]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date where revision_id=$1', [nuevo.revisionId]);
  await db.query(`update rwadar_catalogo.revisiones set estado='aprobada',aprobada_el=now(),
    aprobada_referencia='Aprobación exclusivamente local para prueba documental' where id=$1`, [nuevo.revisionId]);
  const objetivo = (await filas(db, "select slug from public.catalogo_ofertas_publicas where estado_revision='actual' limit 1"))[0].slug;
  await db.query(`update rwadar_catalogo.ofertas set vigencia_dias=1,verificada_el=current_date-1,
    resumen='MARCADOR-COMERCIAL: condiciones sintéticas que deben desaparecer al vencer.',
    metricas='[{"etiqueta":"Precio","valor":"MARCADOR-COMERCIAL: 999 EUR"}]',
    precio='{"mostrado":"MARCADOR-COMERCIAL: 999 EUR","unidad":"importe sintético"}',
    rentabilidad='{"mostrada":"MARCADOR-COMERCIAL: 99%","literal":"rendimiento sintético"}',
    disponible_es=true,puntuacion=25 where revision_id=$1 and slug=$2`, [nuevo.revisionId, objetivo]);
  const ultimoDia = (await filas(db, 'select * from public.catalogo_ofertas_publicas where slug=$1', [objetivo]))[0];
  assert(JSON.stringify(ultimoDia).includes('MARCADOR-COMERCIAL'), 'la frontera inclusiva del TTL no cambia');
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date-2 where revision_id=$1 and slug=$2', [nuevo.revisionId, objetivo]);

  let plataformasPublicas, ofertasPublicas;
  for (const rol of ['anon', 'authenticated']) {
    await sesion(db, null, rol);
    plataformasPublicas = await filas(db, 'select * from public.catalogo_plataformas_publicas');
    ofertasPublicas = await filas(db, 'select * from public.catalogo_ofertas_publicas');
    assert.equal(plataformasPublicas.length, 26);
    assert.equal(ofertasPublicas.length, 28);
    assert(ofertasPublicas.every(o => o.documentacion && o.documentacion.descripcion));
    const vencida = ofertasPublicas.find(o => o.slug === objetivo);
    assert.deepEqual(vencida.documentacion, documentacion[objetivo]);
    assert.equal(vencida.precio, null);
    assert.equal(vencida.rentabilidad, null);
    assert.equal(vencida.disponible_es, null);
    assert.equal(vencida.puntuacion, null);
    assert(!JSON.stringify(vencida).includes('MARCADOR-COMERCIAL'));
    validarLotePublico(plataformasPublicas, ofertasPublicas);
    await assert.rejects(db.exec("update rwadar_catalogo.ofertas set documentacion=null"));
    await assert.rejects(db.exec('delete from public.catalogo_ofertas_publicas'));
    await sesion(db);
    const mutaciones = await filas(db, `select c.relname from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname in ('public','rwadar_catalogo') and c.relkind in ('r','v')
      and (has_table_privilege($1,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_any_column_privilege($1,c.oid,'INSERT,UPDATE,REFERENCES'))`, [rol]);
    assert.equal(mutaciones.length, 0, `${rol}: ninguna mutación de tabla o columna`);
  }
  const filaApi = fila => {
    const copia = JSON.parse(JSON.stringify(fila));
    copia.verificada_el = copia.verificada_el.slice(0, 10);
    return copia;
  };
  const apiPlataformas = plataformasPublicas.map(filaApi);
  const apiOfertas = ofertasPublicas.map(filaApi);
  const movil = adaptarCatalogo({ version: 1, plataformas: apiPlataformas, ofertas: apiOfertas }, new Date());
  assert.deepEqual(movil.ofertas.find(o => o.slug === objetivo).documentacion, documentacion[objetivo]);
  assert(!JSON.stringify(movil.ofertas.find(o => o.slug === objetivo)).includes('MARCADOR-COMERCIAL'));
  const jsPath = path.join(temporal, 'sitio.js');
  fs.writeFileSync(jsPath, 'const P=[\n\n];\nconst FUERA=[\n\n];\nconst EMI=[\n\n];\n');
  const descartes = Array.from({ length: 4 }, (_, i) => ({ nombre: `Descarte ${i + 1}`,
    etiqueta_descarte: 'Sin evidencia', motivo_descarte: 'Descarte documentado en esta prueba local.',
    fuentes: [{ url: `https://example.test/${i}`, titulo: `Fuente ${i + 1}` }] }));
  await sincronizar({ jsPath, csvPath: path.join(temporal, 'sitio.csv'),
    fetchFn: async url => ({ ok: true, json: async () => url.includes('catalogo_plataformas_publicas')
      ? apiPlataformas : url.includes('catalogo_ofertas_publicas') ? apiOfertas : descartes }) });
  const transportadas = vm.runInNewContext(fs.readFileSync(jsPath, 'utf8') + '\nEMI;');
  assert.deepEqual(JSON.parse(JSON.stringify(transportadas.find(o => o.slug === objetivo).documentacion)), documentacion[objetivo]);
  assert(!JSON.stringify(transportadas).includes('MARCADOR-COMERCIAL'));
  const raw = (await filas(db, 'select * from rwadar_catalogo.ofertas where revision_id=$1 and slug=$2', [nuevo.revisionId, objetivo]))[0];
  assert(JSON.stringify(raw).includes('MARCADOR-COMERCIAL'), 'la evidencia original no se borra');
  assert.deepEqual(raw.documentacion, documentacion[objetivo]);
  await db.query('update rwadar_catalogo.revisiones set verificado_el=current_date-8 where id=$1', [nuevo.revisionId]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date-8 where revision_id=$1', [nuevo.revisionId]);
  await sesion(db, null, 'anon');
  assert.equal((await filas(db, 'select count(*)::int c from public.catalogo_ofertas_publicas'))[0].c, 0,
    'la documentación no extiende la vigencia del lote completo');
  console.log('DOCUMENTACIÓN OFERTAS: contrato, importación, SQL real, TTL, ACL/RLS, móvil y sincronizador aprobados.');
} finally {
  await db.close();
  const destino = path.resolve(temporal);
  assert(destino.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(destino).startsWith('rwadar-documentacion-'));
  fs.rmSync(destino, { recursive: true, force: true });
}
