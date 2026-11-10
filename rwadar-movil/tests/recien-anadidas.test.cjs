'use strict';

/* «Recién añadidas» (04/11/2026): el carrusel de Inicio sale con las altas de
   los últimos 30 días, de la más nueva a la más antigua y 6 como mucho, y no
   sale si no hay ninguna o el catálogo ha caducado. Funcional: no fija textos
   (decisión de Víctor, 04/11/2026). La web usa las mismas reglas. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');
function cargar(ruta, mocks = {}) {
  const nombre = path.join(RAIZ, ruta);
  const codigo = babel.transformSync(fs.readFileSync(nombre, 'utf8'), {
    filename: nombre, babelrc: false, configFile: false, plugins: [commonjs],
  }).code;
  const salida = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(salida, salida.exports, (d) => {
    if (Object.hasOwn(mocks, d)) return mocks[d];
    throw new Error(`Dependencia inesperada: ${d}`);
  });
  return salida.exports;
}

const contenido = cargar('lib/transparencia-contenido.js');
const r = cargar('lib/recien-anadidas.js', { './transparencia-contenido': contenido });
const dia = (iso) => new Date(`${iso}T12:00:00`);
const oferta = (slug, plataformaNombre = 'P', titulo = slug) => ({ slug, plataformaNombre, titulo });

test('salen las altas de los últimos 30 días, de la más nueva a la más antigua y 6 como mucho', () => {
  const tabla = {
    a: { anadidaEl: '2026-11-03' }, b: { anadidaEl: '2026-11-03' }, c: { anadidaEl: '2026-11-02' },
    d: { anadidaEl: '2026-10-10' }, e: { anadidaEl: '2026-10-06' }, f: { anadidaEl: '2026-10-05' },
    g: { anadidaEl: '2026-10-20' }, h: { anadidaEl: '2026-10-21' }, i: { anadidaEl: '2026-11-05' }, j: { anadidaEl: 'mal' },
  };
  const ofertas = ['f', 'e', 'd', 'c', 'b', 'a', 'g', 'h', 'i', 'j', 'k'].map((s) => oferta(s, s === 'a' ? 'Zeta' : 'Alfa'));
  const ahora = dia('2026-11-04');
  const lista = r.recienAnadidas(ofertas, { ahora, tabla });
  // a y b el mismo día: por proveedor. La de hace 30 días (f), la futura (i) y las sin fecha, fuera;
  // la de hace 29 (e) entra, pero es la séptima.
  assert.deepEqual(lista.map((o) => o.slug), ['b', 'a', 'c', 'h', 'g', 'd']);
  assert.ok(lista.length <= r.MAX_RECIEN);
  assert.deepEqual(r.recienAnadidas(ofertas.filter((o) => o.slug !== 'h'), { ahora, tabla, max: 99 }).map((o) => o.slug),
    ['b', 'a', 'c', 'g', 'd', 'e']);
  // «Nueva» en Ofertas: 14 días.
  assert.equal(r.esNueva(oferta('a'), { ahora, tabla }), true);
  assert.equal(r.esNueva(oferta('h'), { ahora: dia('2026-11-03'), tabla }), true);
  assert.equal(r.esNueva(oferta('h'), { ahora: dia('2026-11-04'), tabla }), false);
  // «Más nuevas primero» deja al final las que no tienen fecha de alta.
  assert.deepEqual(r.ordenarMasNuevas(ofertas, tabla).slice(0, 3).map((o) => o.slug), ['i', 'b', 'a']);
  assert.deepEqual(r.ordenarMasNuevas(ofertas, tabla).slice(-2).map((o) => o.slug).sort(), ['j', 'k']);
});

test('sin altas recientes o con el catálogo caducado, el carrusel no sale', () => {
  const tabla = { a: { anadidaEl: '2026-09-30' } };
  assert.deepEqual(r.recienAnadidas([oferta('a')], { ahora: dia('2026-11-04'), tabla }), []);
  assert.deepEqual(r.recienAnadidas([], { ahora: dia('2026-11-04') }), []);
  const hoy = { a: { anadidaEl: '2026-11-04' } };
  assert.equal(r.recienAnadidas([oferta('a')], { ahora: dia('2026-11-04'), tabla: hoy }).length, 1);
  assert.deepEqual(r.recienAnadidas([oferta('a')], { ahora: dia('2026-11-04'), tabla: hoy, catalogoCaducado: true }), []);
  assert.equal(r.esNueva(oferta('a'), { ahora: dia('2026-11-04'), tabla: hoy, catalogoCaducado: true }), false);
  // Solo Principales: es la lista que abre «Ver todas las ofertas nuevas».
  const reventa = { ...oferta('a'), coleccion: 'secundario' }, proxima = { ...oferta('a'), coleccion: 'en_camino' };
  assert.deepEqual(r.recienAnadidas([reventa, proxima], { ahora: dia('2026-11-04'), tabla: hoy }), []);
  assert.equal(r.recienAnadidas([{ ...oferta('a'), coleccion: 'principales' }], { ahora: dia('2026-11-04'), tabla: hoy }).length, 1);
});

test('con el catálogo publicado, las altas recientes son las de transparencia.json', () => {
  const src = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8');
  const { EMI } = new Function(`${src};return {EMI};`)();
  const ahora = dia(EMI[0].verificado_lote_el);
  const tabla = contenido.TRANSPARENCIA_POR_SLUG;
  const esperadas = EMI.filter((o) => o.coleccion === 'principales').filter((o) => {
    const f = tabla[o.slug]?.anadidaEl;
    const d = f ? Math.round((Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()) - Date.parse(`${f}T00:00:00Z`)) / 86400000) : -1;
    return d >= 0 && d < 30;
  }).map((o) => [tabla[o.slug].anadidaEl, o.plataformaNombre, o.titulo, o.slug])
    .sort((a, b) => b[0].localeCompare(a[0]) || a[1].localeCompare(b[1], 'es') || a[2].localeCompare(b[2], 'es'))
    .slice(0, 6).map((x) => x[3]);
  const lista = r.recienAnadidas(EMI, { ahora });
  assert.deepEqual(lista.map((o) => o.slug), esperadas);
});

test('Ofertas de Inicio (rediseño del 10/11/2026): nuevas y Selección en un solo carrusel, sin duplicados y 6 como mucho', () => {
  const o = (slug) => ({ slug });
  const { ofertasDestacadas } = r;
  assert.deepEqual(ofertasDestacadas([o('a'), o('b')], [o('b'), o('c')]).map((x) => x.slug), ['a', 'b', 'c'], 'primero las nuevas; la repetida, una vez');
  // Con muchas nuevas, la Selección conserva sus huecos (3 como mucho).
  assert.deepEqual(ofertasDestacadas([o('1'), o('2'), o('3'), o('4'), o('5')], [o('6'), o('7')]).map((x) => x.slug), ['1', '2', '3', '4', '6', '7']);
  assert.deepEqual(ofertasDestacadas([o('1'), o('2'), o('3'), o('4'), o('5'), o('6'), o('7')], [o('a'), o('b'), o('c'), o('d')]).map((x) => x.slug),
    ['1', '2', '3', 'a', 'b', 'c']);
  assert.deepEqual(ofertasDestacadas([o('1'), o('2')], [o('1')]).map((x) => x.slug), ['1', '2'], 'una nueva de la Selección cuenta una vez');
  assert.deepEqual(ofertasDestacadas([], []), []);
  assert.deepEqual(ofertasDestacadas(null, [o('x'), null, { slug: 7 }]).map((x) => x.slug), ['x'], 'lo que no tiene slug no entra');
  // La web hace lo mismo (ofertasInicio de rwadar-20260820.js).
  const web = fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/rwadar-20260820.js'), 'utf8');
  assert.match(web, /function ofertasInicio\(c,nuevas\)\{[\s\S]*?\.slice\(0,3\)[\s\S]*?\[\.\.\.nuevas\.slice\(0,6-resto\.length\),\.\.\.resto\][\s\S]*?lista\.length===6/);
});
