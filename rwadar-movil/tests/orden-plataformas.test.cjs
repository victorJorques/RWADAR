'use strict';

/* Plataformas «Más nuevas primero» (27/11/2026, orden de Víctor: «las más
   nuevas van primero… en plataformas»). La app ordena la lista de plataformas
   como la web: por fecha de alta (altas.json), de la más nueva a la más
   antigua; a igual fecha, por nombre; sin fecha, al final y por nombre. */
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

const contenido = cargar('lib/altas-plataformas-contenido.js');
const o = cargar('lib/orden-plataformas.js', { './altas-plataformas-contenido': contenido });
const fuente = JSON.parse(fs.readFileSync(path.join(RAIZ, '..', 'rwadar-editorial-source', 'plataformas', 'altas.json'), 'utf8'));

test('de la más nueva a la más antigua; a igual fecha por nombre; sin fecha o con fecha mala, al final por nombre', () => {
  const tabla = { a: '2026-09-21', b: '2026-11-27', c: '2026-11-26', d: '2026-11-27', e: 'mal' };
  const lista = [
    { slug: 'sin', nombre: 'Zeta' }, { slug: 'a', nombre: 'Alfa' }, { slug: 'e', nombre: 'Beta' },
    { slug: 'd', nombre: 'Delta' }, { slug: 'c', nombre: 'Ce' }, { slug: 'b', nombre: 'Omega' }, {},
  ];
  const ordenada = o.ordenarPlataformasMasNuevas(lista, tabla);
  assert.deepEqual(ordenada.map((p) => p.slug), ['d', 'b', 'c', 'a', undefined, 'e', 'sin']);
  assert.equal(lista[0].slug, 'sin', 'no cambia la lista original');
  assert.deepEqual(o.ordenarPlataformasMasNuevas(null, tabla), []);
  assert.equal(o.altaPlataforma({ slug: 'toString' }, tabla), '', 'solo claves propias');
});

test('la tabla de la app es la de altas.json y pone primero las altas del 27/11', () => {
  const esperada = Object.fromEntries(Object.entries(fuente.plataformas).map(([s, e]) => [s, e.anadidaEl]));
  assert.deepEqual(contenido.ALTA_PLATAFORMA_POR_SLUG, esperada);
  for (const s of ['1exchange', 'conda', 'daiwa-securities', 'ex-io', 'hsbc', 'hwk-1365', 'osl', 'pruv', 'libeara', 'onre'])
    assert.equal(o.altaPlataforma({ slug: s }), '2026-11-27', s);
  assert.equal(o.altaPlataforma({ slug: 'addx' }), '2026-09-21');
  const radar = [{ slug: 'addx', nombre: 'ADDX' }, { slug: 'nueva-sin-fecha', nombre: 'AAA' },
    { slug: 'assetera', nombre: 'Assetera' }, { slug: 'hsbc', nombre: 'HSBC' }, { slug: 'libeara', nombre: 'Libeara' }];
  assert.deepEqual(o.ordenarPlataformasMasNuevas(radar).map((p) => p.slug),
    ['hsbc', 'libeara', 'assetera', 'addx', 'nueva-sin-fecha']);
});

test('la lista de plataformas de la app usa ese orden', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  assert.match(app, /import \{ ordenarPlataformasMasNuevas \} from '\.\/lib\/orden-plataformas';/);
  assert.match(app, /const visibles = useMemo\(\(\) => \{[\s\S]{0,200}return ordenarPlataformasMasNuevas\(radar\.filter\(/);
});
