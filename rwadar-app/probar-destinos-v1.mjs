import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { baseCompleta, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('./catalogo-publico.js');
const carpeta = 'data/importaciones/catalogo-2026-09-30-v1-destinos';
const condiciones = JSON.parse(fs.readFileSync(`${carpeta}/condiciones-anteriores.json`, 'utf8'));
const manifiesto = JSON.parse(fs.readFileSync(`${carpeta}/revision.json`, 'utf8'));
const fuentes = cargarFuentesLocales('..', { revision: '2026-09-30' });
const importacion = construirSqlImportacion(fuentes);
assert.equal(importacion.revisionId, manifiesto.revisionId);
assert.equal(importacion.hash, manifiesto.hash);
assert.equal(importacion.sql, fs.readFileSync(`${carpeta}/catalogo.sql`, 'utf8'));
assert.equal(fuentes.radar.verificadoEl, '2026-09-28');
assert.equal(fuentes.escaparate.ofertas.length, 28);
assert.equal(fuentes.escaparate.ofertas.find(o => o.slug === 'casa-de-outeiro').plataformaNombre,
  'Alius Capital', 'la ficha no atribuye una supervisión sin fuente primaria confirmada');
for (const o of fuentes.escaparate.ofertas) {
  const anterior = condiciones.find(c => c.slug === o.slug);
  assert(anterior, `falta condición anterior de ${o.slug}`);
  for (const clave of ['verificadaEl', 'vigenciaDias', 'permanente', 'precio', 'rentabilidad',
    'disponibleEs', 'puntuacion', 'estadoRevision']) {
    assert.deepEqual(o[clave], anterior[clave], `${o.slug}: no renovar ${clave} al reparar un enlace`);
  }
  assert.deepEqual(o.documentacion.referencias.filter(r => r.etiqueta !== 'Destino de consulta'),
    anterior.referencias, `${o.slug}: referencias financieras y fechas históricas preservadas`);
}
for (const cambio of manifiesto.cambios) {
  const o = fuentes.escaparate.ofertas.find(x => x.slug === cambio.slug);
  assert.equal(o.url, cambio.url);
  assert.deepEqual(o.fuentesActuales, [cambio.fuente]);
  assert.equal(o.documentacion.revisadaEl, cambio.consultadaEl);
  const acceso = o.documentacion.referencias.find(r => r.etiqueta === 'Destino de consulta');
  assert.equal(acceso.fechaConsulta, '2026-09-30');
  assert.equal(acceso.fechaDato, null);
  assert.equal(acceso.fuente, cambio.fuente);
  assert(/No revalida las cifras financieras/.test(acceso.alcance));
}

const db = await baseCompleta();
try {
  for (const archivo of ['db/24_catalogo_publico_verificado.sql', 'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql']) {
    await db.exec(fs.readFileSync(archivo, 'utf8'));
  }
  const anterior = construirSqlImportacion(cargarFuentesLocales('..', { revision: '2026-09-28' }));
  await db.exec(anterior.sql);
  await db.query(`update rwadar_catalogo.revisiones set verificado_el=current_date,estado='aprobada',
    aprobada_el=now(),aprobada_referencia='Aprobación sintética local de revisión anterior' where id=$1`, [anterior.revisionId]);
  await db.query('update rwadar_catalogo.fuentes set consultada_el=current_date where revision_id=$1', [anterior.revisionId]);
  await db.query('update rwadar_catalogo.ofertas set verificada_el=current_date where revision_id=$1', [anterior.revisionId]);
  await sesion(db, null, 'anon');
  const publicacionAnterior = await filas(db, 'select * from public.catalogo_ofertas_publicas order by slug');
  assert.equal(publicacionAnterior.length, 28);
  await sesion(db);
  await db.exec(importacion.sql);
  assert.equal((await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1', [importacion.revisionId]))[0].estado,
    'borrador');
  const originales = await filas(db, `select slug,verificada_el,vigencia_dias,permanente,precio,rentabilidad,
    disponible_es,puntuacion,estado_revision,url,fuentes_actuales,documentacion from rwadar_catalogo.ofertas
    where revision_id=$1 order by slug`, [importacion.revisionId]);
  assert.equal(originales.length, 28);
  for (const fila of originales) {
    const o = fuentes.escaparate.ofertas.find(x => x.slug === fila.slug);
    assert.equal(fila.verificada_el.toISOString().slice(0, 10), '2026-09-27');
    assert.deepEqual(fila.precio, o.precio);
    assert.deepEqual(fila.rentabilidad, o.rentabilidad);
    assert.equal(fila.url, o.url);
    assert.deepEqual(fila.fuentes_actuales, o.fuentesActuales);
    assert.deepEqual(fila.documentacion, o.documentacion);
  }
  for (const rol of ['anon', 'authenticated']) {
    await sesion(db, null, rol);
    assert.deepEqual(await filas(db, 'select * from public.catalogo_ofertas_publicas order by slug'), publicacionAnterior,
      `${rol}: importar la reparación no aprueba el lote ni cambia el catálogo público`);
    assert.equal((await filas(db, 'select * from rwadar_catalogo.ofertas where revision_id=$1', [importacion.revisionId])).length, 0);
    await sesion(db);
  }
  console.log('DESTINOS V1: 14 accesos corregidos; 28 filas, cifras y fechas históricas intactas; borrador invisible en PGlite.');
}
finally { await db.close(); }
