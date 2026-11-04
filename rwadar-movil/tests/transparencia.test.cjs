'use strict';

/* La app aplica la misma transparencia que la web (lib/transparencia.js es
   la copia de comprobacionesOferta, enSeleccionOferta y puntosFuertesOferta
   de rwadar-site/assets/rwadar-20260820.js) y falla cerrado igual. */
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
const t = cargar('lib/transparencia.js', { './transparencia-contenido': contenido });
const { resumenOferta } = require('../lib/ficha-editorial');
const fuente = 'https://www.example.test/kid.pdf';

function oferta(cambios = {}) {
  const slug = 'spiko-letras-del-tesoro-euro';
  return {
    slug, coleccion: 'principales', titulo: 'Spiko Letras del Tesoro Euro', plataformaNombre: 'Spiko',
    verificadaEl: contenido.TRANSPARENCIA_POR_SLUG[slug].verificadaEl, vigenciaDias: 7, estadoRevision: 'actual',
    disponibleEs: true, avisos: [{ tono: 'warn', texto: 'Puedes perder parte de lo que inviertas.' }],
    documentacion: { revisadaEl: contenido.TRANSPARENCIA_POR_SLUG[slug].verificadaEl, fuentes: [fuente], referencias: [
      { etiqueta: 'Mínimo de inversión', valor: '1 €', fuente, fechaConsulta: contenido.TRANSPARENCIA_POR_SLUG[slug].verificadaEl },
      { etiqueta: 'Acceso desde España', valor: 'Disponible para residentes en España', fuente,
        fechaConsulta: contenido.TRANSPARENCIA_POR_SLUG[slug].verificadaEl },
      { etiqueta: 'Reembolso', valor: 'Diario', fuente, fechaConsulta: contenido.TRANSPARENCIA_POR_SLUG[slug].verificadaEl },
    ] },
    ...cambios,
  };
}
const hoy = new Date(`${contenido.TRANSPARENCIA_REVISADA_EL}T12:00:00Z`);
const r = (o, ahora = hoy) => resumenOferta(o, [], ahora);

test('una oferta documentada pasa las cinco comprobaciones y enseña sus puntos fuertes', () => {
  const o = oferta();
  const lista = t.comprobacionesOferta(o, r(o), { ahora: hoy });
  assert.deepEqual(lista.map((c) => c.id), ['contratable', 'supervisada', 'documentoEspana', 'minimoSalida', 'vigente']);
  assert.ok(lista.every((c) => c.cumple), JSON.stringify(lista.filter((c) => !c.cumple)));
  assert.ok(t.enSeleccionOferta(o, r(o), { ahora: hoy }));
  // Los puntos fuertes salen tal cual de transparencia.json (la cápsula de la
  // comprobación 2 cambió el 04/11/2026); la prueba no fija su redacción.
  const puntos = contenido.TRANSPARENCIA_POR_SLUG[o.slug].puntos.map((p) => p.texto);
  assert.ok(puntos.length >= 1);
  assert.deepEqual(t.puntosFuertesOferta(o).map((p) => p.texto), puntos);
  assert.deepEqual(t.datosCortosOferta(o, r(o)), [['Mínimo', '1 €'], ['España', 'Sí, según la fuente'], ['Salida', 'Reembolso diario']]);
  const supervisada = lista.find((c) => c.id === 'supervisada');
  assert.equal(supervisada.deFuente, true);
  assert.match(supervisada.fuente.url, /^https:\/\/www\.cnmv\.es\//);
  assert.equal(supervisada.fuente.fecha, contenido.TRANSPARENCIA_REVISADA_EL);
});

test('falla cerrado: sin entrada o con otra revisión no hay puntos fuertes ni Selección', () => {
  for (const o of [oferta({ slug: 'no-existe' }), oferta({ verificadaEl: '2026-10-01' })]) {
    assert.equal(t.transparenciaOferta(o), null);
    assert.deepEqual(t.puntosFuertesOferta(o), []);
    assert.equal(t.enSeleccionOferta(o, r(o), { ahora: hoy }), false);
    const lista = t.comprobacionesOferta(o, r(o), { ahora: hoy });
    assert.equal(lista.find((c) => c.id === 'supervisada').cumple, false);
    assert.equal(lista.find((c) => c.id === 'supervisada').motivo, 'Sin comprobación editorial para esta revisión de la oferta.');
  }
});

test('un aviso crítico, el catálogo caducado o la revisión vencida la sacan de la Selección', () => {
  const stop = oferta({ avisos: [{ tono: 'stop', texto: 'La apertura no está confirmada.' }] });
  assert.equal(t.enSeleccionOferta(stop, r(stop), { ahora: hoy }), false);

  const o = oferta();
  const caducado = t.comprobacionesOferta(o, r(o), { ahora: hoy, catalogoCaducado: true });
  assert.equal(caducado.find((c) => c.id === 'contratable').cumple, false);
  assert.equal(caducado.find((c) => c.id === 'contratable').motivo, 'Pendiente de revalidar: la revisión semanal ha vencido.');
  assert.match(caducado.find((c) => c.id === 'minimoSalida').motivo, /pendiente de revalidar/);
  assert.equal(t.enSeleccionOferta(o, r(o), { ahora: hoy, catalogoCaducado: true }), false);
  assert.equal(t.datosCortosOferta(o, r(o), { catalogoCaducado: true })[2][1], 'Pendiente de revalidar');

  const tarde = new Date(hoy.getTime() + 30 * 86400000);
  assert.equal(t.enSeleccionOferta(o, r(o, tarde), { ahora: tarde }), false);
  assert.equal(t.comprobacionesOferta(o, r(o, tarde), { ahora: tarde }).find((c) => c.id === 'vigente').cumple, false);
});

test('reventa y anuncios nunca se contratan hoy ni entran en la Selección', () => {
  for (const coleccion of ['secundario', 'en_camino']) {
    const o = oferta({ coleccion });
    assert.equal(t.enSeleccionOferta(o, r(o), { ahora: hoy }), false);
    assert.equal(t.comprobacionesOferta(o, r(o), { ahora: hoy })[0].cumple, false);
  }
});

test('el catálogo publicado de la web da en la app la misma Selección que la web', () => {
  const src = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8');
  const { EMI } = new Function(`${src};return {EMI};`)();
  const ahora = new Date(`${EMI[0].verificado_lote_el}T12:00:00Z`);
  const elegidas = EMI.filter((o) => t.enSeleccionOferta(o, resumenOferta(o, [], ahora), { ahora }));
  // La lista exacta cambia con cada ciclo; lo que no cambia es que cada una
  // tiene entrada de la misma revisión y cumple las cinco.
  for (const o of elegidas) {
    assert.ok(t.transparenciaOferta(o), o.slug);
    assert.equal(o.coleccion, 'principales', o.slug);
  }
  assert.ok(EMI.filter((o) => o.coleccion !== 'principales').every((o) => !elegidas.includes(o)));
});
