// Entrega «2026-11-28» · lo que cambia (adaptado de la 2026-11-27.2) en el repositorio DESPUÉS de aplicar el SQL en Supabase
// y de sincronizar (`node rwadar-app/sincronizar.js`). Sin red: solo lee y escribe archivos del repositorio. Aquí se dan
// de alta 6 plataformas del radar y 4 ofertas; las ofertas de antes no cambian.
//
//   1. Comprueba que el catálogo sincronizado es la revisión nueva: 79 plataformas y 44 ofertas (28/13/3), con las
//      altas de altas.json. Si no, no toca nada.
//   2. Lista cerrada de fichas (rwadar-fichas-manifiesto.js): entran las páginas de las plataformas y ofertas nuevas.
//   3. rwadar-editorial-source/ofertas/transparencia.json: las 4 entradas nuevas, revisión y lote.
//   4. La portada de cada plataforma nueva (portadas.json): WebP 720×720, plataformas/fuentes.json, publicables y
//      distintivo de la web.
//
// Se puede repetir: si ya está hecho, no cambia nada.
//
//   node rwadar-app/data/verificaciones/2026-11-28-v2/despues-de-aplicar.mjs
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
const ETIQUETA = '2026-11-28', FECHA = '2026-11-28';
const A = leer(path.join(DIR, 'altas.json'));
const ALTAS = A.ofertas.map(x => x.oferta.slug), PALTAS = A.plataformas.map(p => p.slug);
assert.equal(ALTAS.length, 4, 'cuatro ofertas nuevas');
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
const BASE = leer(path.join(DIR, '../2026-11-27.3-v2/escaparate-publicacion.json'));
assert.ok(snap.ofertas.every(o => o.verificadaEl === (BASE.ofertas.find(b => b.slug === o.slug)?.verificadaEl ?? FECHA)), 'fechas de comprobación de las ofertas sincronizadas');

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
  cambios.push(`rwadar-fichas-manifiesto.js: ${nuevas.length - rutas.length} fichas de plataforma nuevas`);
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
  // Las de antes no cambian: conservan su entrada y su fecha.
  for (const o of snap.ofertas) assert.equal(t.ofertas[o.slug].verificadaEl, o.verificadaEl, `${o.slug}: fecha de transparencia`);
  t.lote = ETIQUETA; t.revisionCatalogo = revision.revisionId; t.revisadoEl = FECHA;
  assert.deepEqual(Object.keys(t.ofertas).sort(), snap.ofertas.map(o => o.slug).sort(), 'transparencia.json no casa con las ofertas');
  const valida = cargarTransparencia({ raiz: ROOT, datos: t });
  assert.deepEqual(valida.sinEntrada, []); assert.equal(valida.avisoRevision, '');
  for (const s of ALTAS) assert.ok(valida.ofertas[s], `${s}: la entrada no pasa transparencia.mjs`);
  const nuevo = JSON.stringify(t, null, 2) + '\n';
  if (nuevo !== texto) { fs.writeFileSync(TRANSPARENCIA, nuevo); cambios.push(`transparencia.json: ${ALTAS.length} entradas nuevas, revisión y lote`); }
}

// 4 · la portada de cada plataforma nueva (portadas.json; maestros en rwadar-editorial-source/, de portadas.py):
// WebP de 720×720 sin metadatos, su entrada en plataformas/fuentes.json, la lista de archivos publicables y el
// distintivo «imagen ilustrativa» de la web. Sin portada, rwadar-publicar.js no publica (ERROR PORTADAS).
{
  const { default: sharp } = await import(require.resolve('sharp', { paths: [ROOT] }));
  const crypto = await import('node:crypto');
  const P = leer(path.join(DIR, 'portadas.json')).portadas;
  assert.deepEqual(P.map(x => x.empresa).sort(), A.plataformas.map(p => p.nombre).sort(), 'una portada por plataforma nueva');
  const slugPortada = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const FUENTES = path.join(ROOT, 'rwadar-site/plataformas/fuentes.json');
  const texto = fs.readFileSync(FUENTES, 'utf8');
  const manifiesto = JSON.parse(texto);
  assert.equal(JSON.stringify(manifiesto, null, 2) + '\n', texto, 'formato de plataformas/fuentes.json inesperado');
  const PUBLICABLES = path.join(ROOT, 'rwadar-publicacion-segura.js');
  let publicables = fs.readFileSync(PUBLICABLES, 'utf8');
  const JS_WEB = path.join(ROOT, 'rwadar-site/assets/rwadar-20260820.js');
  let js = fs.readFileSync(JS_WEB, 'utf8');
  for (const x of P) {
    const plataforma = snap.plataformas.find(p => p.n === x.empresa);
    assert.ok(plataforma, `${x.empresa}: no está en el catálogo sincronizado con ese nombre`);
    const archivo = `plataformas/${slugPortada(x.empresa)}.webp`;
    const destino = path.join(ROOT, 'rwadar-site', archivo);
    const maestro = path.join(ROOT, 'rwadar-editorial-source', x.maestro);
    assert.ok(fs.existsSync(maestro), `${x.empresa}: falta el maestro ${x.maestro} (python portadas.py)`);
    const bytes = await sharp(fs.readFileSync(maestro)).resize(720, 720, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82, effort: 6 }).toBuffer();
    if (!fs.existsSync(destino) || !fs.readFileSync(destino).equals(bytes)) { fs.writeFileSync(destino, bytes); cambios.push(`portada ${archivo}`); }
    const entrada = { empresa: x.empresa, archivo, pagina: null, paginaReferencia: x.paginaReferencia, imagenOrigen: null,
      creador: 'RWAdar', herramienta: 'RealVisXL V5.0 Lightning, generada en local (como las fotos de las ofertas)',
      capturada: `${FECHA}T12:00:00.000Z`, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length,
      metodo: 'Representación editorial generada para RWAdar y optimizada localmente sin metadatos.',
      tipoVisual: 'Representación editorial generada', descripcionVisual: x.descripcionVisual, encuadre: 'cover', foco: '50% 50%',
      origenVisual: 'representacion-editorial-generada',
      uso: `Representación editorial creada por RWAdar para explicar ${plataforma.cat.toLowerCase()}. No muestra un activo concreto de ${x.empresa} ni implica afiliación, patrocinio o recomendación de inversión.`,
      revisionPortada: 6 };
    manifiesto.plataformas = manifiesto.plataformas.filter(e => e.empresa !== x.empresa).concat(entrada)
      .sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'));
    const linea = `  '${archivo}',\n`;
    if (!publicables.includes(linea)) {
      const ancla = "  'plataformas/fuentes.json',\n";
      assert.ok(publicables.includes(ancla), 'lista de publicables de rwadar-publicacion-segura.js');
      publicables = publicables.replace(ancla, ancla + linea);
    }
  }
  const nuevo = JSON.stringify(manifiesto, null, 2) + '\n';
  if (nuevo !== texto) { fs.writeFileSync(FUENTES, nuevo); cambios.push(`plataformas/fuentes.json: ${P.length} portadas nuevas`); }
  if (publicables !== fs.readFileSync(PUBLICABLES, 'utf8')) { fs.writeFileSync(PUBLICABLES, publicables); cambios.push('rwadar-publicacion-segura.js: portadas nuevas publicables'); }
  // El distintivo «imagen ilustrativa» de la web: el conjunto exacto de portadas generadas del manifiesto.
  const m = js.match(/const PORTADAS_GENERADAS_MOVIL=new Set\(\[\n([\s\S]*?)\n\]\);/);
  assert.ok(m, 'bloque PORTADAS_GENERADAS_MOVIL de la web');
  const nombres = manifiesto.plataformas.filter(e => e.origenVisual === 'representacion-editorial-generada').map(e => e.empresa);
  const lineas = []; let actual = ' ';
  for (const n of nombres.map(n => `'${n}'`)) { if ((actual + n).length > 100) { lineas.push(actual.replace(/,$/, ',')); actual = ' '; } actual += n + ','; }
  lineas.push(actual.replace(/,$/, ''));
  const bloque = `const PORTADAS_GENERADAS_MOVIL=new Set([\n${lineas.join('\n')}\n]);`;
  const js2 = js.replace(m[0], bloque);
  if (js2 !== js) { fs.writeFileSync(JS_WEB, js2); cambios.push('rwadar-20260820.js: distintivo de las portadas nuevas'); }
}

console.log(cambios.length ? cambios.map(c => '· ' + c).join('\n') : 'Nada que cambiar: ya estaba hecho.');
console.log('Siguiente: node rwadar-app/volcar-seed.js && node rwadar-editorial-source/ofertas/transparencia.mjs && node rwadar-fichas.js && npm test');
