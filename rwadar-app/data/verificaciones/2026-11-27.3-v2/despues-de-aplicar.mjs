// Entrega «2026-11-27.3» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de sincronizar
// (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio. Sin altas ni retiradas:
//   1. comprueba que el catálogo sincronizado es la revisión nueva (73 plataformas, 40 ofertas 24/13/3) y que cada
//      oferta lleva su disponibilidad por país, la de disponibilidad.json;
//   2. transparencia.json: el lote y la revisión nuevos (validado con transparencia.mjs).
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-27.3-v2/despues-de-aplicar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const { cargarTransparencia, FUENTE: TRANSPARENCIA } = await import(path.join(ROOT, 'rwadar-editorial-source/ofertas/transparencia.mjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-27.3';
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));
const DISP = leer(path.join(DIR, 'disponibilidad.json')).ofertas;

const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
for (const o of snap.ofertas) assert.deepEqual(o.documentacion && o.documentacion.disponibilidad, DISP[o.slug], `${o.slug}: disponibilidad sincronizada`);

const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
const t = JSON.parse(texto);
t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId;
const valida = cargarTransparencia({ raiz: ROOT, datos: t });
assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
const nuevo = JSON.stringify(t, null, 2) + '\n';
if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); console.log('· transparencia.json: lote y revisión de la entrega'); }
console.log(`Catálogo ${ETIQUETA} (${revision.revisionId.slice(0, 8)}): 40 ofertas con su disponibilidad por país.`);
console.log('Siguiente: node rwadar-app/volcar-seed.js && node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');
