'use strict';
/* El modelo de los pies de las fotos reales de las ofertas (22/11/2026) y el
   manifiesto empaquetado: lo que la OTA lleva a la app. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const f = require('../lib/fotos-ofertas');
const { LICENCIAS_FOTO } = require('../lib/noticias-sector');

const credito = (cambios = {}) => ({ autor: 'Ana Ejemplo', licencia: 'CC BY 4.0', licenciaUrl: 'https://creativecommons.org/licenses/by/4.0/',
  sitio: 'Wikimedia Commons', pagina: 'https://commons.wikimedia.org/wiki/File:Wall_Street.jpg', ...cambios });
const foto = (cambios = {}) => ({ slug: 'mtbill', archivo: 'foto-mtbill.webp', alt: 'La fachada de la Bolsa de Nueva York con sus columnas',
  origen: 'foto', queMuestra: 'tema', lugarOTema: 'la Bolsa de Nueva York', lugarOTemaEn: 'the New York Stock Exchange', sinPersonas: true,
  credito: credito(), ...cambios });

test('pie de una foto del tema, en castellano y en inglés, con la licencia y Commons enlazados', () => {
  const es = f.pieFotoOferta(foto(), 'es'), en = f.pieFotoOferta(foto(), 'en');
  assert.equal(es.texto, 'Foto real de la Bolsa de Nueva York, no del activo · Ana Ejemplo · CC BY 4.0 · Wikimedia Commons');
  assert.equal(en.texto, 'Real photo of the New York Stock Exchange, not of the asset · Ana Ejemplo · CC BY 4.0 · Wikimedia Commons');
  assert.deepEqual(es.partes.filter(p => p.enlace).map(p => [p.texto, p.enlace]),
    [['CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'], ['Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Wall_Street.jpg']]);
  assert.equal(es.generico, false);
  // Sin «lugarOTemaEn», el inglés usa el nombre tal cual.
  assert.match(f.pieFotoOferta(foto({ lugarOTemaEn: undefined }), 'en').texto, /^Real photo of la Bolsa de Nueva York, not of the asset · /);
});

test('foto del activo y dominio público o CC0: sin autor', () => {
  for (const [licencia, licenciaUrl, en] of [['Dominio público', null, 'Public domain'], ['CC0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'CC0']]) {
    const x = foto({ queMuestra: 'activo', lugarOTema: undefined, lugarOTemaEn: undefined, credito: credito({ autor: null, licencia, licenciaUrl }) });
    assert.equal(f.pieFotoOferta(x).texto, `Foto real del activo · ${licencia} · Wikimedia Commons`);
    assert.equal(f.pieFotoOferta(x, 'en').texto, `Real photo of the asset · ${en} · Wikimedia Commons`);
    assert.doesNotThrow(() => f.validarFichaFoto(x));
  }
});

test('un crédito que no vale da el pie genérico verdadero (nunca «del activo»)', () => {
  const rotos = [foto({ credito: undefined }), foto({ credito: credito({ licencia: 'CC BY-NC 4.0' }) }), foto({ credito: credito({ autor: null }) }),
    foto({ credito: credito({ licenciaUrl: 'https://example.test/' }) }), foto({ credito: credito({ pagina: 'https://example.test/File:x.jpg' }) }),
    foto({ credito: { ...credito(), extra: 1 } }), foto({ queMuestra: 'activo', credito: credito({ autor: '<b>x</b>' }) }),
    foto({ lugarOTema: 'rentabilidad asegurada' }), foto({ lugarOTema: '' }), foto({ queMuestra: 'fachada' }), foto({ lugarOTema: 'Graz​' })];
  for (const x of rotos) {
    const pie = f.pieFotoOferta(x);
    assert.equal(pie.texto, 'Foto real del lugar o del tema, no del activo', JSON.stringify(x));
    assert.equal(pie.generico, true);
    assert.equal(f.claseImagenOferta(x), 'lugar');
    assert.throws(() => f.validarFichaFoto(x));
  }
  assert.equal(f.pieFotoOferta({ origen: 'ia' }), null);
  assert.equal(f.pieFotoOferta(null), null);
  assert.equal(f.pieFotoOferta({ origen: 'foto-generada' }), null, 'las ilustraciones generadas no llevan pie propio');
});

test('la línea general dice la verdad de lo que se ve', () => {
  const activo = foto({ queMuestra: 'activo', lugarOTema: undefined, lugarOTemaEn: undefined });
  const casos = [[[], 'Imágenes ilustrativas, no fotos del activo'], [[{ origen: 'ia' }], 'Imágenes ilustrativas, no fotos del activo'],
    [[foto()], 'Fotos reales del lugar o del tema, no del activo'],
    [[foto(), { origen: 'ia' }], 'Fotos reales del lugar o del tema e imágenes ilustrativas: ninguna es foto del activo'],
    [[activo], 'Fotos reales del activo, de Wikimedia Commons'],
    [[activo, foto()], 'Cada foto real dice si muestra el activo, su lugar o su tema; las demás imágenes son ilustrativas'],
    // Un «activo» con el crédito roto no cuenta como foto del activo.
    [[foto({ queMuestra: 'activo', credito: undefined })], 'Fotos reales del lugar o del tema, no del activo']];
  for (const [lista, texto] of casos) assert.equal(f.notaImagenesOfertas(lista), texto);
  // Las cinco, en el diccionario de la app y de la web (la web las traduce así).
  const dic = require('../lib/idioma-en.js');
  for (const nota of Object.values(f.NOTAS_IMAGENES)) assert.equal(dic[nota.es], nota.en, nota.es);
});

test('las licencias son las de las noticias y lo prohibido no deja pasar promesas', () => {
  for (const nombre of Object.keys(LICENCIAS_FOTO)) {
    const lic = LICENCIAS_FOTO[nombre];
    const x = foto({ credito: credito({ licencia: nombre, licenciaUrl: lic.url, autor: lic.atribucion ? 'Ana' : null }) });
    assert.equal(f.pieFotoOferta(x).generico, false, nombre);
  }
  for (const t of ['desde 100 €', '5 %', 'rentabilidad', 'garantizado', 'gran oportunidad']) assert.match(t, f.PROHIBIDO);
  assert.doesNotMatch('Randhartingergasse 9, Viena', f.PROHIBIDO, 'el número de una calle sí');
});

test('el manifiesto empaquetado: cada foto real se llama foto-<slug>.webp, con crédito válido y su require', () => {
  const manifiesto = require('../assets/ofertas-editoriales/manifest.json');
  const fixture = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imagenes-editoriales.js'), 'utf8');
  for (const e of manifiesto.fichas) {
    assert.ok(fixture.includes(`require('../assets/ofertas-editoriales/${e.archivo}')`), e.archivo);
    if (e.origen !== 'foto') { assert.equal(e.archivo, `oferta-${e.slug}.webp`); continue; }
    assert.doesNotThrow(() => f.validarFichaFoto(e), e.slug);
    assert.equal(f.pieFotoOferta(e).generico, false, e.slug);
  }
});

test('la app acepta una foto real empaquetada (foto-<slug>.webp) con su crédito y no una con el nombre de las ilustraciones', () => {
  const babel = require('@babel/core');
  const commonjs = require('@babel/plugin-transform-modules-commonjs');
  const archivo = path.join(__dirname, '..', 'fixtures', 'imagenes-editoriales.js');
  const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), { filename: archivo, babelrc: false, configFile: false, plugins: [commonjs] }).code;
  const base = require('../assets/ofertas-editoriales/manifest.json');
  const cargar = (manifiesto) => {
    const m = { exports: {} };
    new Function('module', 'exports', 'require', codigo)(m, m.exports, nombre => {
      if (nombre === '../assets/ofertas-editoriales/manifest.json') return manifiesto;
      if (nombre.startsWith('../assets/ofertas-editoriales/')) return nombre.slice('../assets/ofertas-editoriales/'.length);
      throw new Error(`dependencia inesperada ${nombre}`);
    });
    return m.exports;
  };
  // El bloque de require es el de verdad: se cambia una ficha por su foto real en el manifiesto y en el require.
  const ficha = base.fichas[0];
  const real = { ...ficha, archivo: `foto-${ficha.slug}.webp`, alt: 'La plaza mayor de la ciudad con el ayuntamiento al fondo',
    origen: 'foto', queMuestra: 'lugar', lugarOTema: 'Graz (Austria)', sinPersonas: true, credito: credito() };
  const conCodigo = codigo.replace(`'oferta-${ficha.slug}.webp': require('../assets/ofertas-editoriales/oferta-${ficha.slug}.webp')`,
    `'foto-${ficha.slug}.webp': require('../assets/ofertas-editoriales/foto-${ficha.slug}.webp')`);
  assert.notEqual(conCodigo, codigo);
  const cargarCon = (manifiesto) => {
    const m = { exports: {} };
    new Function('module', 'exports', 'require', conCodigo)(m, m.exports, nombre => nombre === '../assets/ofertas-editoriales/manifest.json'
      ? manifiesto : nombre.slice('../assets/ofertas-editoriales/'.length));
    return m.exports;
  };
  const app = cargarCon({ ...base, fichas: [real, ...base.fichas.slice(1)] });
  const imagen = app.imagenEditorialOferta({ slug: ficha.slug, categoria: ficha.categoria });
  assert.equal(imagen.archivo, `foto-${ficha.slug}.webp`);
  assert.equal(imagen.alt, real.alt);
  assert.equal(f.pieFotoOferta(imagen).texto, 'Foto real de Graz (Austria), no del activo · Ana Ejemplo · CC BY 4.0 · Wikimedia Commons');
  assert.equal(f.pieFotoOferta(app.imagenEditorialOferta({ slug: base.fichas[1].slug, categoria: base.fichas[1].categoria })), null);
  // Una foto real con el nombre de las ilustraciones no entra: la app no arranca con ese manifiesto (lo para la prueba, antes de la OTA).
  assert.throws(() => cargarCon({ ...base, fichas: [{ ...real, archivo: `oferta-${ficha.slug}.webp` }, ...base.fichas.slice(1)] }));
  assert.ok(cargar(base).imagenEditorialOferta({ slug: ficha.slug, categoria: ficha.categoria }));
});
