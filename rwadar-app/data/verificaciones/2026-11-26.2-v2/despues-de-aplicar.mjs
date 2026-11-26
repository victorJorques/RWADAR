// Entrega «2026-11-26.2» · lo que cambia en el repositorio DESPUÉS de aplicar el SQL en Supabase y de sincronizar
// (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio. Mismo modelo que la
// 2026-11-05.2 (retiradas), sin sus otros cambios.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 25 plataformas y 21 ofertas (8/13/0), sin
//      Hausera. Si no, no toca nada.
//   2. Lista cerrada de fichas (rwadar-fichas-manifiesto.js): fuera ofertas/hausera-proximas-ofertas.html. Con eso
//      el worker de acceso da su 404 (noindex, no-store) y no sirve la copia de conservación de Pages.
//   3. Borra rwadar-site/ofertas/hausera-proximas-ofertas.html.
//   4. rwadar-editorial-source/ofertas/transparencia.json: fuera Hausera; revisión y lote nuevos (validado con
//      transparencia.mjs).
//   5. Su ilustración: fuera de rwadar-movil/assets/ofertas-editoriales (webp y manifest.json), del bloque
//      EDITORIAL_OFERTA_POR_SLUG de la web y del fixture de la app. Su ficha editorial (fichas.json, fotos.json y
//      fotos/<slug>.webp) ya salió en el commit de la entrega.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-26.2-v2/despues-de-aplicar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const { cargarActivosEditoriales } = require(path.join(ROOT, 'rwadar-ofertas-editoriales.js'));
const { cargarTransparencia, FUENTE: TRANSPARENCIA } = await import(path.join(ROOT, 'rwadar-editorial-source/ofertas/transparencia.mjs'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-26.2', FECHA = '2026-11-26';
const RETIRADAS = ['hausera-proximas-ofertas'];
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
assert.ok(RETIRADAS.every(s => !snap.ofertas.some(o => o.slug === s)), 'Hausera sigue en el catálogo sincronizado');
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
const nuevas = rutas.filter(r => !RETIRADAS.some(s => r === `ofertas/${s}.html`));
assert.equal(nuevas.filter(r => r.startsWith('ofertas/')).length, revision.ofertas);
assert.equal(nuevas.filter(r => r.startsWith('plataformas/')).length, revision.plataformas);
assert.deepEqual(nuevas.filter(r => r.startsWith('ofertas/')).sort(), snap.ofertas.map(o => `ofertas/${o.slug}.html`).sort());
if (escribirLista(nuevas) !== antes) { fs.writeFileSync(MANIFIESTO, escribirLista(nuevas)); cambios.push('rwadar-fichas-manifiesto.js: fuera la ficha de Hausera'); }

// 3 · las páginas viejas
for (const s of RETIRADAS) {
  const vieja = path.join(ROOT, 'rwadar-site/ofertas', `${s}.html`);
  if (fs.existsSync(vieja)) { fs.rmSync(vieja); cambios.push(`borrada rwadar-site/ofertas/${s}.html`); }
}

// 4 · transparencia.json
{
  const texto = fs.readFileSync(TRANSPARENCIA, 'utf8');
  const t = JSON.parse(texto);
  assert.equal(JSON.stringify(t, null, 2) + '\n', texto, 'formato de transparencia.json inesperado');
  for (const s of RETIRADAS) delete t.ofertas[s];
  t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId;
  assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no casa con las 21 ofertas');
  const valida = cargarTransparencia({ raiz: ROOT, datos: t });
  assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
  const nuevo = JSON.stringify(t, null, 2) + '\n';
  if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push('transparencia.json: fuera Hausera; revisión y lote nuevos'); }
}

// 5 · la ilustración de cada una (y su ficha editorial, si quedara)
{
  const DIR_ACTIVOS = path.join(ROOT, 'rwadar-movil/assets/ofertas-editoriales');
  const MAN = path.join(DIR_ACTIVOS, 'manifest.json');
  const texto = fs.readFileSync(MAN, 'utf8');
  const m = JSON.parse(texto);
  assert.equal(JSON.stringify(m, null, 2) + '\n', texto, 'formato de manifest.json editorial inesperado');
  m.fichas = m.fichas.filter(f => !RETIRADAS.includes(f.slug));
  const nuevo = JSON.stringify(m, null, 2) + '\n';
  if (nuevo !== texto) { fs.writeFileSync(MAN, nuevo); cambios.push('rwadar-movil/assets/ofertas-editoriales/manifest.json: fuera su ilustración'); }
  for (const s of RETIRADAS) {
    const webp = path.join(DIR_ACTIVOS, `oferta-${s}.webp`);
    if (fs.existsSync(webp)) { fs.rmSync(webp); cambios.push(`borrada rwadar-movil/assets/ofertas-editoriales/oferta-${s}.webp`); }
  }
  // El bloque generado de la web (mismo formato que escribe generar.mjs).
  const JS_WEB = path.join(ROOT, 'rwadar-site/assets/rwadar-20260820.js');
  const js = fs.readFileSync(JS_WEB, 'utf8');
  const a = js.indexOf('/* fichas-editoriales:inicio'), b = js.indexOf('/* fichas-editoriales:fin */');
  assert.ok(a >= 0 && b > a && js.indexOf('/* fichas-editoriales:inicio', a + 1) < 0, 'bloque fichas-editoriales de la web');
  const desde = js.indexOf('\n', a) + 1, hasta = js.lastIndexOf('\n', b) + 1;
  const bloque = js.slice(desde, hasta);
  const mm = bloque.match(/^const EDITORIAL_OFERTA_POR_SLUG=Object\.freeze\((.*)\);\n$/s);
  assert.ok(mm, 'formato del bloque EDITORIAL_OFERTA_POR_SLUG');
  const web = JSON.parse(mm[1]);
  const escribirBloque = w => `const EDITORIAL_OFERTA_POR_SLUG=Object.freeze(${JSON.stringify(w).replace(/</g, '\\u003c')});\n`;
  assert.equal(escribirBloque(web), bloque, 'el bloque de la web no se puede reescribir sin cambiar su formato');
  for (const s of RETIRADAS) delete web[s];
  assert.deepEqual(Object.keys(web).sort(), m.fichas.map(f => f.slug).sort(), 'web y manifiesto editorial con las mismas ilustraciones');
  const js2 = js.slice(0, desde) + escribirBloque(web) + js.slice(hasta);
  if (js2 !== js) { fs.writeFileSync(JS_WEB, js2); cambios.push('rwadar-site/assets/rwadar-20260820.js: fuera su ilustración (EDITORIAL_OFERTA_POR_SLUG)'); }
  // El fixture de la app.
  const FIX = path.join(ROOT, 'rwadar-movil/fixtures/imagenes-editoriales.js');
  const app = fs.readFileSync(FIX, 'utf8');
  const lineas = app.split('\n');
  const app2 = lineas.filter(l => !RETIRADAS.some(s => l === `  'oferta-${s}.webp': require('../assets/ofertas-editoriales/oferta-${s}.webp'),`)).join('\n');
  assert.ok(!RETIRADAS.some(s => app2.includes(`oferta-${s}.webp`)), 'el fixture de la app aún las nombra');
  if (app2 !== app) { fs.writeFileSync(FIX, app2); cambios.push('rwadar-movil/fixtures/imagenes-editoriales.js: fuera su ilustración'); }
  // La ficha editorial (fuente de las ilustraciones), si quedara.
  const ED = path.join(ROOT, 'rwadar-editorial-source/ofertas');
  for (const [archivo, quitar] of [['fichas.json', j => { j.fichas = j.fichas.filter(f => !RETIRADAS.includes(f.slug)); }],
    ['fotos.json', j => { for (const s of RETIRADAS) delete j.fotos[s]; }]]) {
    const ruta = path.join(ED, archivo), t = fs.readFileSync(ruta, 'utf8'), j = JSON.parse(t);
    assert.equal(JSON.stringify(j, null, 1) + '\n', t, `formato de ${archivo} inesperado`);
    quitar(j);
    const t2 = JSON.stringify(j, null, 1) + '\n';
    if (t2 !== t) { fs.writeFileSync(ruta, t2); cambios.push(`rwadar-editorial-source/ofertas/${archivo}: fuera Hausera`); }
  }
  for (const s of RETIRADAS) {
    const foto = path.join(ED, 'fotos', `${s}.webp`);
    if (fs.existsSync(foto)) { fs.rmSync(foto); cambios.push(`borrada rwadar-editorial-source/ofertas/fotos/${s}.webp`); }
  }
  // La misma comprobación que harán el publicador y el servidor local.
  const activos = cargarActivosEditoriales(ROOT);
  assert.ok(!activos.fichas.some(f => RETIRADAS.includes(f.slug)));
  assert.deepEqual(activos.fichas.map(f => f.slug).sort(), snap.ofertas.map(o => o.slug).filter(s => activos.fichas.some(f => f.slug === s)).sort());
}

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
console.log('Siguiente: node rwadar-app/volcar-seed.js && node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');
