// Entrega «2026-11-04.2» · lo que cambia en la web DESPUÉS de aplicar el SQL en Supabase y de
// sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 25 plataformas sin ARTEX,
//      24 ofertas y 5 descartadas, ARTEX entre ellas con su motivo y su fuente. Si no, no toca nada.
//   2. Lista cerrada de fichas (rwadar-fichas-manifiesto.js): la de ARTEX pasa de plataformas/ a
//      fuera-del-radar/. Con eso el worker de acceso redirige /plataformas/artex-global-markets
//      (301, no-store) a /fuera-del-radar/artex-global-markets y no sirve la copia de conservación.
//   3. Borra rwadar-site/plataformas/artex-global-markets.html (la página nueva la genera
//      `node rwadar-fichas.js`).
//   4. transparencia.json: anota la revisión y el lote nuevos (las ofertas no cambian).
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-04.2-v2/despues-de-aplicar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../../../..');
const require = createRequire(import.meta.url);
const { leerBloquesCatalogo } = require(path.join(ROOT, 'rwadar-fichas.js'));
const leer = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const ETIQUETA = '2026-11-04.2', SLUG = 'artex-global-markets';
const revision = leer(path.join(ROOT, `rwadar-app/data/importaciones/catalogo-${ETIQUETA}-v2/revision.json`));
const artex = leer(path.join(DIR, 'cambios-plataformas.json')).plataformas[SLUG];

// 1 · el catálogo sincronizado es el de la entrega
const snap = leerBloquesCatalogo(fs.readFileSync(path.join(ROOT, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8'));
const revisiones = new Set([...snap.plataformas, ...snap.ofertas].map(x => x.revisionId));
assert.deepEqual([...revisiones], [revision.revisionId],
  `el catálogo sincronizado no es la revisión ${revision.revisionId}: aplica antes el SQL y ejecuta node rwadar-app/sincronizar.js`);
assert.equal(snap.plataformas.length, revision.plataformas);
assert.equal(snap.ofertas.length, revision.ofertas);
assert.ok(!snap.plataformas.some(p => p.slug === SLUG), 'ARTEX sigue en el radar sincronizado');
assert.equal(snap.fuera.length, revision.descartadas);
const fuera = snap.fuera.find(f => f.n === artex.nombre);
assert.ok(fuera && fuera.badge === artex.despues.etiqueta_descarte && fuera.why === artex.despues.motivo_descarte &&
  fuera.fuentes.some(f => f.url === artex.fuenteNueva.url), 'ARTEX no está en Descartadas con su motivo y su fuente');

// 2 · lista cerrada de fichas
const MANIFIESTO = path.join(ROOT, 'rwadar-fichas-manifiesto.js');
const antes = fs.readFileSync(MANIFIESTO, 'utf8');
const inicio = 'module.exports = Object.freeze([\n', fin = ']);\n';
assert.ok(antes.includes(inicio) && antes.endsWith(fin), 'formato de rwadar-fichas-manifiesto.js inesperado');
const cabecera = antes.slice(0, antes.indexOf(inicio));
const rutas = JSON.parse('[' + antes.slice(antes.indexOf(inicio) + inicio.length, -fin.length).trim().replace(/,$/, '') + ']');
const escribirLista = l => cabecera + inicio + l.map(r => `  ${JSON.stringify(r)},`).join('\n') + '\n' + fin;
assert.equal(escribirLista(rutas), antes, 'rwadar-fichas-manifiesto.js no se puede reescribir sin cambiar su formato');
const nuevas = [...new Set([...rutas.filter(r => r !== `plataformas/${SLUG}.html`), `fuera-del-radar/${SLUG}.html`])].sort();
assert.equal(nuevas.filter(r => r.startsWith('plataformas/')).length, revision.plataformas);
assert.equal(nuevas.filter(r => r.startsWith('fuera-del-radar/')).length, revision.descartadas);
const cambios = [];
if (escribirLista(nuevas) !== antes) { fs.writeFileSync(MANIFIESTO, escribirLista(nuevas)); cambios.push('rwadar-fichas-manifiesto.js: la ficha de ARTEX pasa a fuera-del-radar/'); }

// 3 · la página vieja
const vieja = path.join(ROOT, 'rwadar-site/plataformas', `${SLUG}.html`);
if (fs.existsSync(vieja)) { fs.rmSync(vieja); cambios.push(`borrada rwadar-site/plataformas/${SLUG}.html`); }

// 4 · transparencia.json
const TRANSPARENCIA = path.join(ROOT, 'rwadar-editorial-source/ofertas/transparencia.json');
const t = fs.readFileSync(TRANSPARENCIA, 'utf8');
const t2 = t.replace(/("lote": )"[^"]*"/, `$1"${ETIQUETA}"`).replace(/("revisionCatalogo": )"[^"]*"/, `$1"${revision.revisionId}"`);
assert.equal(JSON.stringify({ ...JSON.parse(t), lote: ETIQUETA, revisionCatalogo: revision.revisionId }), JSON.stringify(JSON.parse(t2)));
if (t2 !== t) { fs.writeFileSync(TRANSPARENCIA, t2); cambios.push('transparencia.json: revisión y lote nuevos'); }

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
console.log('Siguiente: node rwadar-app/volcar-seed.js && node rwadar-fichas.js && node rwadar-editorial-source/ofertas/transparencia.mjs && npm test');
