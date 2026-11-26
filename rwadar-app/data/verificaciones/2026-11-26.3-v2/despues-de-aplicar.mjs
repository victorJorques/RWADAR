// Entrega «2026-11-26.3» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de sincronizar
// (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio. Es el contrario de la
// 2026-11-26.2 (retirada): aquí se dan de alta 11 ofertas y 7 plataformas.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 32 plataformas y 32 ofertas (17/13/2), con las 11
//      ofertas y las 7 plataformas de altas.json. Si no, no toca nada.
//   2. Lista cerrada de fichas (rwadar-fichas-manifiesto.js): entran ofertas/<slug>.html (11) y plataformas/<slug>.html
//      (7), en su orden alfabético. Sin eso, rwadar-fichas.js no las genera y el worker no las sirve.
//   3. rwadar-editorial-source/ofertas/transparencia.json: la entrada de cada oferta nueva (de altas.json, con su fecha
//      de alta del 26/11, que la pone la primera en Inicio y en Ofertas); revisión y lote nuevos (validado con
//      transparencia.mjs).
//   Las ilustraciones (fichas.json, fotos.json y fotos/<slug>.webp) entran en el commit de la entrega; las dibuja
//   después `node rwadar-editorial-source/ofertas/generar.mjs`.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-26.3-v2/despues-de-aplicar.mjs
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
const ETIQUETA = '2026-11-26.3', FECHA = '2026-11-26';
const A = leer(path.join(DIR, 'altas.json'));
const ALTAS = A.ofertas.map(x => x.oferta.slug), PALTAS = A.plataformas.map(p => p.slug);
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));
const cambios = [];

// 1 · el catálogo sincronizado es el de la entrega
const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
assert.deepEqual([...new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId))], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
const colecciones = { principales: 0, secundario: 0, en_camino: 0 };
for (const o of snap.ofertas) colecciones[o.coleccion]++;
assert.deepEqual(colecciones, revision.colecciones);
assert.ok(ALTAS.every(s => snap.ofertas.some(o => o.slug === s)), 'falta una oferta nueva en el catálogo sincronizado');
assert.ok(PALTAS.every(s => snap.plataformas.some(p => p.slug === s)), 'falta una plataforma nueva en el catálogo sincronizado');
assert.ok(snap.ofertas.every(o => o.verificadaEl === FECHA), 'las ofertas sincronizadas no están verificadas el 26/11');

// 2 · lista cerrada de fichas
const MANIFIESTO = path.join(ROOT, 'rwadar-fichas-manifiesto.js');
const antes = fs.readFileSync(MANIFIESTO, 'utf8');
const inicio = 'module.exports = Object.freeze([\n', fin = ']);\n';
assert.ok(antes.includes(inicio) && antes.endsWith(fin), 'formato de rwadar-fichas-manifiesto.js inesperado');
const cabecera = antes.slice(0, antes.indexOf(inicio));
const rutas = JSON.parse('[' + antes.slice(antes.indexOf(inicio) + inicio.length, -fin.length).trim().replace(/,$/, '') + ']');
const escribirLista = l => cabecera + inicio + l.map(r => `  ${JSON.stringify(r)},`).join('\n') + '\n' + fin;
assert.equal(escribirLista(rutas), antes, 'rwadar-fichas-manifiesto.js no se puede reescribir sin cambiar su formato');
assert.deepEqual([...rutas].sort(), rutas, 'la lista cerrada estaba en orden alfabético');
const nuevas = [...new Set([...rutas, ...ALTAS.map(s => `ofertas/${s}.html`), ...PALTAS.map(s => `plataformas/${s}.html`)])].sort();
assert.equal(nuevas.filter(r => r.startsWith('ofertas/')).length, revision.ofertas);
assert.equal(nuevas.filter(r => r.startsWith('plataformas/')).length, revision.plataformas);
assert.deepEqual(nuevas.filter(r => r.startsWith('ofertas/')), snap.ofertas.map(o => `ofertas/${o.slug}.html`).sort());
assert.deepEqual(nuevas.filter(r => r.startsWith('plataformas/')), snap.plataformas.map(p => `plataformas/${p.slug}.html`).sort());
if (escribirLista(nuevas) !== antes) {
  fs.writeFileSync(MANIFIESTO, escribirLista(nuevas));
  cambios.push(`rwadar-fichas-manifiesto.js: ${nuevas.length - rutas.length} fichas nuevas (${ALTAS.length} de oferta y ${PALTAS.length} de plataforma)`);
}

// 3 · transparencia.json
{
  const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
  const t = JSON.parse(texto);
  assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
  for (const { oferta: o, transparencia: e } of A.ofertas) {
    if (t.ofertas[o.slug]) assert.deepEqual(t.ofertas[o.slug], e, `${o.slug}: ya tenía otra entrada`);
    t.ofertas[o.slug] = e;
  }
  // mTBILL: la búsqueda de BaFin se volvió a leer hoy (fuentes/bafin-midas.txt) y sigue sin Midas Software GmbH;
  // su documentación legal responde 403 a la lectura automática, así que esa comprobación conserva su fecha (21/11).
  {
    const L = leer(path.join(DIR, 'fuentes/lecturas-2026-11-26.json'))['bafin-midas'];
    const copia = fs.readFileSync(path.join(DIR, L.archivo), 'utf8');
    assert.match(copia, /Midas Fondsmaeglerselskab A\/S/); assert.doesNotMatch(copia, /Midas Software/);
    const s = t.ofertas.mtbill.supervisada;
    assert.equal(s.fuente.url, L.url, 'mTBILL: la fuente de «supervisada» es la búsqueda de BaFin');
    s.consultadaEl = FECHA;
  }
  t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;
  assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no casa con las 32 ofertas');
  const valida = cargarTransparencia({ raiz: ROOT, datos: t });
  assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
  for (const s of ALTAS) assert.ok(valida.ofertas[s], `${s}: la entrada no pasa transparencia.mjs`);
  const nuevo = JSON.stringify(t, null, 2) + '\n';
  if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push(`transparencia.json: ${ALTAS.length} entradas nuevas (alta del 26/11); revisión y lote nuevos`); }
}

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
console.log('Siguiente: node rwadar-editorial-source/ofertas/generar.mjs && node rwadar-app/volcar-seed.js && node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');
