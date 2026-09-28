const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');

function cargarVerificacionLocal() {
  const archivo = path.join(RAIZ, 'lib', 'verificacion-local.js');
  const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
    filename: archivo,
    babelrc: false,
    configFile: false,
    plugins: [commonjs],
  }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', codigo)(modulo, modulo.exports);
  return modulo.exports;
}

const api = cargarVerificacionLocal();
const fixture = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'fixtures', 'escaparate-local.json'), 'utf8'));

test('el móvil exige el overlay del 21/09/2026 para las 26 plataformas', () => {
  assert.equal(api.FECHA_VERIFICACION_LOCAL, '2026-09-21');
  assert.equal(api.validarRadarLocal(fixture.plataformas), fixture.plataformas);
  assert.equal(fixture.plataformas.length, 26);
  assert.ok(fixture.plataformas.every((plataforma) =>
    plataforma.verificacionLocal.verificadoEl === '2026-09-21'
    && plataforma.verificacionLocal.alertasCriticas.length > 0));
});

test('el contrato móvil falla cerrado si falta o envejece la verificación', () => {
  const sinOverlay = structuredClone(fixture.plataformas);
  delete sinOverlay[0].verificacionLocal;
  assert.throws(() => api.validarRadarLocal(sinOverlay), /objeto ausente/);

  const fechaVieja = structuredClone(fixture.plataformas);
  fechaVieja[0].verificacionLocal.verificadoEl = '2026-09-20';
  assert.throws(() => api.validarRadarLocal(fechaVieja), /fecha distinta de 2026-09-21/);

  assert.throws(() => api.validarRadarLocal(fixture.plataformas.slice(0, 25)),
    /exactamente 26 plataformas/);
});

test('el overlay conserva las cuatro correcciones críticas que debe mostrar la app', () => {
  const porSlug = new Map(fixture.plataformas.map((plataforma) => [plataforma.slug, plataforma]));
  assert.equal(porSlug.get('inx').verificacionLocal.alertasCriticas[0].codigo, 'no_nasdaq');
  assert.equal(porSlug.get('artex-global-markets').verificacionLocal.estadoOperativo.estado,
    'no_verificable');
  assert.equal(porSlug.get('lofty').verificacionLocal.licenciaRegistro.estado,
    'sin_registro_declarado');
  assert.equal(porSlug.get('swarm').verificacionLocal.acceso.estado, 'no_verificable');
  assert.match(porSlug.get('swarm').verificacionLocal.licenciaRegistro.detalle,
    /no se reutiliza la etiqueta genérica 'regulada por BaFin'/i);
});

test('las fichas móviles priorizan la verificación local sobre claims canónicos', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const ficha = app.slice(app.indexOf('function Ficha('), app.indexOf('function Aviso('));
  const detalle = app.slice(app.indexOf('function Detalle('), app.indexOf('const e = StyleSheet.create'));

  assert.match(ficha, /const verificacion = p\.verificacionLocal/);
  assert.doesNotMatch(app, /MODO_LOCAL (?:\?|&&) p\.verificacionLocal/);
  assert.match(ficha, /<PanelVerificacionLocal verificacion=\{verificacion\} compacta \/>/);
  assert.match(ficha, /verificacion \? verificacion\.estadoOperativo\.detalle : p\.nota/);
  assert.match(detalle, /<PanelVerificacionLocal verificacion=\{verificacion\} \/>/);
  assert.match(detalle, /\['Quién puede entrar', p\.acceso\]/);
  assert.match(detalle, /const filasFicha = verificacion[\s\S]*?\? \[\['Tipo de actor',[\s\S]*?: \[\['Tipo de actor'/);
  assert.match(app, /REVISIÓN DE FUENTES · \{verificacion\.verificadoEl\}/);
  assert.match(app, /ALERTA CRÍTICA/);
  assert.match(app, /fuentes\.map\(fuente =>/);
  assert.match(app, /abrirEnlace\(fuente\.url\)/);
});
