'use strict';

// Operación local: cambia solamente localizadores de consulta y su alcance.
// Las fuentes de aprobación y las cifras conservan sus fechas originales.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { cargarFuentesLocales, construirSqlImportacion } = require('./catalogo-publico');
const raiz = path.join(__dirname, '..');
const delta = JSON.parse(fs.readFileSync(path.join(__dirname,
  'data/verificaciones/2026-09-30-v2/delta-enlaces.json'), 'utf8'));
const esRoto = url => typeof url === 'string' && (
  /^https:\/\/app\.brickwise\.at\/(mobileWeb|desktopWeb)\/asset\//.test(url) ||
  /^https:\/\/app\.reental\.co\//.test(url) ||
  /^https:\/\/(www\.)?hausera\.com\//.test(url));
const historial = (url, fecha) => `Localizador histórico ${url} (consulta original ${fecha}); ` +
  'destino de consulta actualizado 30/09/2026, no revalida cifra, disponibilidad ni apertura.';
const json = (ruta, valor) => fs.writeFileSync(ruta, JSON.stringify(valor, null, 2) + '\n');

for (const versionEsquema of [1, 2]) {
  const carpeta = path.join(__dirname, 'data/verificaciones',
    '2026-09-30' + (versionEsquema === 2 ? '-v2' : ''));
  const entrega = path.join(__dirname, 'data/importaciones', versionEsquema === 2
    ? 'catalogo-2026-09-30-v2' : 'catalogo-2026-09-30-v1-destinos');
  const documentacion = JSON.parse(fs.readFileSync(path.join(carpeta, 'documentacion-ofertas.json'), 'utf8'));
  const antes = cargarFuentesLocales(raiz, { revision: '2026-09-30', versionEsquema });
  const rutaAntes = path.join(entrega, 'fuentes-antes-reparacion.json');
  // La evidencia es inmutable frente a una repetición del preparador.
  if (!fs.existsSync(rutaAntes)) json(rutaAntes, antes);
  const corregidas = [];
  for (const cambio of delta.cambios.filter(c => c.versiones.includes(versionEsquema))) {
    const doc = documentacion[cambio.slug];
    if (!doc) continue;
    const retiradas = doc.fuentes.filter(esRoto);
    doc.fuentes = [...new Set(doc.fuentes.map(u => esRoto(u) ? cambio.fuenteExacta : u))];
    for (const referencia of doc.referencias) {
      const esAcceso = /Destino de consulta/.test(referencia.etiqueta);
      const esDocumentoProveedor = cambio.evidencia === 'brickwise' &&
        referencia.fuente.startsWith('https://app.brickwise.at/');
      if (esRoto(referencia.fuente)) {
        const original = referencia.fuente;
        referencia.fuente = cambio.fuenteExacta;
        if (!referencia.alcance.includes(`Localizador histórico ${original}`)) {
          referencia.alcance += ' ' + historial(original, referencia.fechaConsulta);
        }
      }
      if (esAcceso || esDocumentoProveedor) {
        if (!referencia.alcance.includes(`Localizador histórico ${cambio.urlAnterior}`)) {
          referencia.alcance += ' ' + historial(cambio.urlAnterior,
            esAcceso ? antes.escaparate.ofertas.find(o => o.slug === cambio.slug).verificadaEl
              : referencia.fechaConsulta);
        }
      }
      if (esAcceso) for (const retirada of retiradas) {
        if (!referencia.alcance.includes(`Localizador histórico ${retirada}`)) {
          referencia.alcance += ' ' + historial(retirada,
            antes.escaparate.ofertas.find(o => o.slug === cambio.slug).verificadaEl);
        }
      }
    }
    corregidas.push({ slug: cambio.slug, destino: cambio.fuenteExacta,
      localizadorHistorico: cambio.urlAnterior, retiradas });
  }
  json(path.join(carpeta, 'documentacion-ofertas.json'), documentacion);
  const despues = cargarFuentesLocales(raiz, { revision: '2026-09-30', versionEsquema });
  // La operación no toca escaparate/radar ni valores o fechas documentales.
  assert.deepEqual(despues.radar, antes.radar);
  for (let i = 0; i < despues.escaparate.ofertas.length; i++) {
    const { documentacion: docAntes, ...ofertaAntes } = antes.escaparate.ofertas[i];
    const { documentacion: docDespues, ...ofertaDespues } = despues.escaparate.ofertas[i];
    assert.deepEqual(ofertaDespues, ofertaAntes);
    assert.deepEqual(docDespues.referencias.map(({ fuente, alcance, ...r }) => r),
      docAntes.referencias.map(({ fuente, alcance, ...r }) => r));
    assert.deepEqual({ ...docDespues, fuentes: null, referencias: null },
      { ...docAntes, fuentes: null, referencias: null });
  }
  const importacion = construirSqlImportacion(despues);
  fs.writeFileSync(path.join(entrega, 'catalogo.sql'), importacion.sql);
  const rutaRevision = path.join(entrega, 'revision.json');
  const revisionAntes = fs.existsSync(rutaRevision)
    ? JSON.parse(fs.readFileSync(rutaRevision, 'utf8')) : {};
  json(rutaRevision, { ...revisionAntes, versionEsquema,
    revisionId: importacion.revisionId, hash: importacion.hash,
    revisionFuentesAnterior: construirSqlImportacion(antes).revisionId,
    fechaRadar: despues.radar.verificadoEl, plataformas: despues.radar.plataformas.length,
    ofertas: despues.escaparate.ofertas.length, estado: 'borrador',
    reparacionFuentes: corregidas,
    sqlBytes: Buffer.byteLength(importacion.sql), sqlCaracteres: importacion.sql.length,
    sqlSha256: crypto.createHash('sha256').update(importacion.sql).digest('hex') });
  console.log(JSON.stringify({ versionEsquema, revisionId: importacion.revisionId,
    hash: importacion.hash, bytes: Buffer.byteLength(importacion.sql),
    caracteres: importacion.sql.length,
    sqlSha256: crypto.createHash('sha256').update(importacion.sql).digest('hex') }));
}
