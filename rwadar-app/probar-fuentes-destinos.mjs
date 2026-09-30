import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { baseCompleta, filas, sesion } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const { cargarFuentesLocales, construirSqlImportacion } = require('./catalogo-publico.js');
const esRoto = valor => typeof valor === 'string' && (
  /^https:\/\/app\.brickwise\.at\/(mobileWeb|desktopWeb)\/asset\//.test(valor) ||
  /^https:\/\/app\.reental\.co\//.test(valor) ||
  /^https:\/\/(www\.)?hausera\.com\//.test(valor));

const db = await baseCompleta();
try {
  for (const archivo of ['db/24_catalogo_publico_verificado.sql',
    'db/25_servicios_editoriales_solo_lectura.sql',
    'supabase/migrations/20260930084133_ofertas_documentacion_publica.sql',
    'supabase/migrations/20260930090621_catalogo_v2_colecciones.sql']) {
    await db.exec(fs.readFileSync(archivo, 'utf8'));
  }
  for (const versionEsquema of [1, 2]) {
    const carpeta = 'data/importaciones/' + (versionEsquema === 2
      ? 'catalogo-2026-09-30-v2' : 'catalogo-2026-09-30-v1-destinos');
    const antes = JSON.parse(fs.readFileSync(`${carpeta}/fuentes-antes-reparacion.json`, 'utf8'));
    const despues = cargarFuentesLocales('..', { revision: '2026-09-30', versionEsquema });
    const revision = JSON.parse(fs.readFileSync(`${carpeta}/revision.json`, 'utf8'));
    assert.deepEqual(despues.radar, antes.radar, 'radar y sus fechas intactos');
    assert.deepEqual(despues.escaparate.plataformas, antes.escaparate.plataformas);
    assert.deepEqual(despues.escaparate.fuente, antes.escaparate.fuente);
    assert.equal(despues.escaparate.ofertas.length, versionEsquema === 1 ? 28 : 49);
    const slugsReparados = new Set(revision.reparacionFuentes.map(c => c.slug));
    for (let i = 0; i < despues.escaparate.ofertas.length; i++) {
      const { documentacion: docAntes, ...ofertaAntes } = antes.escaparate.ofertas[i];
      const { documentacion: docDespues, ...ofertaDespues } = despues.escaparate.ofertas[i];
      assert.deepEqual(ofertaDespues, ofertaAntes,
        `${ofertaAntes.slug}: cifras, fechas, identificadores y proveedor intactos`);
      assert.deepEqual({ ...docDespues, fuentes: null, referencias: null },
        { ...docAntes, fuentes: null, referencias: null });
      assert.equal(docDespues.referencias.length, docAntes.referencias.length);
      for (let j = 0; j < docDespues.referencias.length; j++) {
        const { fuente: fuenteAntes, alcance: alcanceAntes, ...rAntes } = docAntes.referencias[j];
        const { fuente: fuenteDespues, alcance: alcanceDespues, ...rDespues } = docDespues.referencias[j];
        assert.deepEqual(rDespues, rAntes, 'valor y fechas de cada referencia permanecen iguales');
        if (alcanceDespues !== alcanceAntes || fuenteDespues !== fuenteAntes) {
          assert(slugsReparados.has(ofertaAntes.slug), 'solo el delta autoriza cambios de localizador');
          assert(alcanceDespues.startsWith(alcanceAntes), 'se conserva el alcance original');
          assert(alcanceDespues.includes('Localizador histórico '));
          assert(alcanceDespues.includes('destino de consulta actualizado 30/09/2026, no revalida cifra'));
        }
      }
      assert(!docDespues.fuentes.some(esRoto), 'fuentes activas libres de destinos rotos');
      assert(!docDespues.referencias.some(r => esRoto(r.fuente)), 'referencias activas libres de destinos rotos');
      assert(!esRoto(ofertaDespues.url) && !ofertaDespues.fuentesActuales.some(esRoto));
    }
    const importacion = construirSqlImportacion(despues);
    assert.equal(importacion.revisionId, revision.revisionId);
    assert.equal(importacion.hash, revision.hash);
    assert.equal(importacion.sql, fs.readFileSync(`${carpeta}/catalogo.sql`, 'utf8'));
    await db.exec(importacion.sql);
    assert.equal((await filas(db, 'select estado from rwadar_catalogo.revisiones where id=$1',
      [importacion.revisionId]))[0].estado, 'borrador');
    const ofertas = await filas(db, 'select slug,precio,rentabilidad,documentacion from rwadar_catalogo.ofertas where revision_id=$1 order by slug',
      [importacion.revisionId]);
    assert.equal(ofertas.length, versionEsquema === 1 ? 28 : 49);
    for (const fila of ofertas) {
      const o = despues.escaparate.ofertas.find(x => x.slug === fila.slug);
      assert.deepEqual(fila.precio, o.precio);
      assert.deepEqual(fila.rentabilidad, o.rentabilidad);
      assert.deepEqual(fila.documentacion, o.documentacion);
    }
    for (const rol of ['anon', 'authenticated']) {
      await sesion(db, null, rol);
      assert.equal((await filas(db, 'select * from rwadar_catalogo.ofertas where revision_id=$1',
        [importacion.revisionId])).length, 0, 'los SQL no publican el borrador');
      await sesion(db);
    }
    console.log(`FUENTES V${versionEsquema}: ${ofertas.length} filas; acceso oficial, trazabilidad histórica y datos financieros preservados; SQL BORRADOR invisible en PGlite.`);
  }
}
finally { await db.close(); }
