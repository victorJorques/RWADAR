'use strict';

/* Inicio como historia (ESPEC-INICIO.md y HISTORIA-v2.md, 04/11/2026): los
   mismos textos que la web, sin llamadas [n] (decisión de Víctor), con las
   cifras sacadas del catálogo y fallando cerrado sin catálogo vigente. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
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

const contenido = cargar('lib/inicio-contenido.js');
const fuentes = cargar('lib/inicio-fuentes.js');
const transparencia = cargar('lib/transparencia.js', { './transparencia-contenido': cargar('lib/transparencia-contenido.js') });
const cifras = cargar('lib/inicio-cifras.js', { './ficha-editorial': require('../lib/ficha-editorial'), './transparencia': transparencia });

/* Todas las cadenas de un objeto de textos, llamando a las plantillas con cifras de prueba. */
function cadenas(valor) {
  if (typeof valor === 'string') return [valor];
  if (typeof valor === 'function') return [String(valor(24, 26, 1)), String(valor(0))];
  if (Array.isArray(valor)) return valor.flatMap(cadenas);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(cadenas);
  return [];
}

test('el titular n.º 1 y la misma historia en castellano y en inglés', () => {
  const { es, en } = contenido.INICIO;
  assert.equal(es.portada.titular, 'La blockchain nació para pagar sin bancos. Hoy la usan los propios bancos.');
  assert.equal(en.portada.titular, 'Blockchain was born to pay without banks. Now the banks themselves use it.');
  const forma = (o) => JSON.stringify(o, (k, v) => (typeof v === 'string' ? 's' : typeof v === 'function' ? 'f' : v));
  assert.equal(forma(es), forma(en), 'las dos versiones tienen los mismos apartados');
  assert.deepEqual([...contenido.CAPITULOS_INICIO], ['cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6']);
  // Versión final de la web (04/11/2026): el carrusel del 03 lleva 5 hechos con
  // su cifra («1 de 5»); las opiniones y la previsión pasan a su «Saber más».
  assert.equal(es.capitulos.cap3.tarjetas.length, 5);
  assert.equal(es.capitulos.cap3.tarjetas[0].nombre, 'Banca europea', 'empieza por lo cercano');
  for (const t of es.capitulos.cap3.tarjetas) assert.ok(t.cifra && t.fecha, t.nombre);
});

test('sin llamadas [n] en el texto, sin frases vetadas y con «Descartadas»', () => {
  const textos = cadenas(contenido.INICIO.es).join('\n');
  const ingles = cadenas(contenido.INICIO.en).join('\n');
  assert.doesNotMatch(textos, /\[\d+\]/, 'DECISIÓN DE VÍCTOR: nada de [n] en el texto');
  assert.doesNotMatch(ingles, /\[\d+\]/);
  for (const vetada of ['vías', 'estaciones', 'ya está en marcha', 'a lo grande', '×125', '24/7', 'M$', 'Empieza aquí',
    'Las mejor documentadas', 'Menos no es ninguno', 'oportunidad de inversión', 'manos poderosas', 'subirse al tren',
    'sin intermediarios', 'Fuera del radar']) assert.ok(!textos.includes(vetada), `frase vetada en Inicio: ${vetada}`);
  assert.match(textos, /«Descartadas»/);
  // ESPEC-INICIO §2.11 (vinculante): en inglés es «Excluded», no «Discarded».
  assert.match(ingles, /"Excluded"/);
  assert.doesNotMatch(ingles, /Discard/i);
  const inicio = leer('componentes', 'Inicio.js');
  assert.doesNotMatch(inicio, /Fuera del radar|TextInput/, 'el radar vivo va sin caja de búsqueda');
  assert.match(inicio, /<Radar datos=\{plataformas\} portada/);
});

test('las cifras del catálogo no se escriben a mano y faltan si no hay catálogo vigente', () => {
  const { es, en } = contenido.INICIO;
  assert.equal(es.portada.boton(24), 'Ver las 24 ofertas');
  assert.equal(es.portada.boton(0), 'Ver las ofertas');
  assert.equal(en.portada.boton(0), 'See the offers');
  assert.match(es.portada.subtitulo(0), /Aquí ves las ofertas del radar/);
  // El 04 de Aprende (web y app) conserva la frase de los mínimos del catálogo y su aviso, solo con catálogo vigente.
  assert.equal(es.capitulos.cap4.minimos(5, 22, 1), 'En el radar, 5 de las 22 ofertas tienen un mínimo documentado de 1 € o de 1 $.');
  assert.equal(en.capitulos.cap4.minimos(5, 22, 0), 'On the radar, 5 of the 22 offers have a documented minimum of €1.');
  assert.match(fs.readFileSync(path.join(RAIZ, 'componentes', 'AprendeInicio.js'), 'utf8'),
    /cifras\.vigente && cifras\.minimos \? <>[\s\S]*cap4\.minimos\(cifras\.minimos, cifras\.ofertas, cifras\.usd\)[\s\S]*cap4\.aviso/);
  for (const t of cadenas({ a: es.portada.antetitulo, b: es.portada.titular, c: es.capitulos.cap6, d: es.seleccion.criterios })) {
    assert.doesNotMatch(t, /\b(?:24|26) (?:ofertas|plataformas)\b/, t);
  }
  const src = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8');
  const { P, FUERA, EMI } = new Function(`${src};return {P,FUERA,EMI};`)();
  const lote = EMI[0].verificado_lote_el;
  const ahora = new Date(`${lote}T12:00:00Z`);
  const vivo = cifras.cifrasInicio({ ofertas: EMI, plataformas: P, descartadas: FUERA,
    fechaCatalogo: { fecha: lote, vigenciaDias: EMI[0].vigencia_lote_dias, caducado: false }, ahora });
  assert.equal(vivo.vigente, true);
  assert.equal(vivo.ofertas, EMI.length);
  assert.equal(vivo.plataformas, P.length);
  assert.equal(vivo.descartadas, FUERA.length);
  assert.ok(vivo.seleccion.length >= 1 && vivo.seleccion.every((o) => o.coleccion === 'principales'));
  assert.ok(vivo.minimos >= vivo.usd);
  assert.match(vivo.hasta, /^\d{2}\/\d{2}\/\d{4}$/);
  const caducado = cifras.cifrasInicio({ ofertas: EMI, plataformas: P, descartadas: FUERA,
    fechaCatalogo: { fecha: lote, vigenciaDias: 7, caducado: true }, ahora });
  assert.equal(caducado.vigente, false);
  assert.deepEqual(caducado.seleccion, []);
  assert.equal(caducado.minimos, 0);
  assert.equal(caducado.hasta, '');
  assert.equal(cifras.cifrasInicio({ ofertas: EMI, plataformas: P, descartadas: FUERA, fechaCatalogo: null }).vigente, false);
});

test('cada capítulo acaba en «Fuentes de este apartado» y las 38 fuentes van agrupadas con enlace', () => {
  // Rediseño del 10/11/2026: los seis capítulos y sus fuentes van en la
  // pantalla «Aprende» (AprendeInicio.js), como /aprende/ en la web.
  const aprende = leer('componentes', 'AprendeInicio.js');
  for (const cap of contenido.CAPITULOS_INICIO) assert.match(aprende, new RegExp(`irAFuentes\\('${cap}'\\)`), cap);
  assert.match(aprende, /irAFuentes\('portada'\)/);
  assert.match(aprende, /irAFuentes\('legal'\)/);
  // Inicio ya no lleva capítulos ni fuentes: solo los bloques cortos.
  assert.doesNotMatch(leer('componentes', 'Inicio.js'), /irAFuentes|<Bloque n=\{/);
  const numeros = new Set(fuentes.FUENTES_INICIO.map((f) => f.n));
  assert.equal(numeros.size, 38);
  const usados = new Set(fuentes.GRUPOS_FUENTES_INICIO.flatMap((g) => g.fuentes));
  for (const n of numeros) assert.ok(usados.has(n), `la fuente ${n} no está en ningún apartado`);
  for (const n of usados) assert.ok(numeros.has(n), `el apartado cita una fuente que no existe: ${n}`);
  for (const f of fuentes.FUENTES_INICIO) {
    assert.ok(f.urls.length >= 1);
    for (const u of f.urls) assert.equal(new URL(u).protocol, 'https:', u);
  }
  assert.deepEqual(fuentes.GRUPOS_FUENTES_INICIO.map((g) => g.id),
    ['portada', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'seleccion', 'legal']);
});

test('el aviso de riesgo va pegado al botón de la portada y, en pantallas bajas, antes', () => {
  const inicio = leer('componentes', 'Inicio.js');
  const portada = inicio.slice(inicio.indexOf('<View style={[e.accionPortada'), inicio.indexOf('{/* Avisos de la cuenta'));
  assert.ok(portada.length > 100, 'el bloque del botón está en la cabecera');
  assert.match(portada, /avisoPrimero \? <Text noTraducir style=\{e\.avisoPortada\}>\{t\.portada\.aviso\}<\/Text> : null/);
  assert.match(portada, /onDestino\('ofertas'\)/);
  // Revisión del 04/11 (ESPEC-INICIO §3, «si se ve el botón, se ve el aviso»):
  // ya no basta el alto de la pantalla. A 360 × 780, con «Revisión pendiente»
  // o con letra grande el aviso quedaba bajo la barra; ahora se mide.
  assert.match(inicio, /const compacta = altoPantalla < 700;/);
  assert.match(inicio, /const avisoPrimero = compacta \|\| \(altoVisible > 0 && finAccion > altoVisible\);/);
  assert.match(portada, /onLayout=\{medirAccion\}/);
  assert.match(inicio, /onLayout=\{\(ev\) => setAltoVisible\(/);
  assert.equal(contenido.INICIO.es.portada.aviso,
    'Invertir tiene riesgos: puedes perder parte o todo lo que inviertas. RWAdar informa, no asesora ni vende.');
});

test('la Selección sale en el orden de la web y va en el carrusel «Ofertas» con sus 5 comprobaciones', () => {
  const { es, en } = contenido.INICIO;
  const src = fs.readFileSync(path.join(RAIZ, '..', 'rwadar-site', 'assets', 'catalogo-publico-20261022.js'), 'utf8');
  const { P, FUERA, EMI } = new Function(`${src};return {P,FUERA,EMI};`)();
  const lote = EMI[0].verificado_lote_el;
  const vivo = cifras.cifrasInicio({ ofertas: EMI, plataformas: P, descartadas: FUERA, ahora: new Date(`${lote}T12:00:00Z`),
    fechaCatalogo: { fecha: lote, vigenciaDias: EMI[0].vigencia_lote_dias, caducado: false }, orden: Object.keys(es.seleccion.letraPequena) });
  const orden = Object.keys(es.seleccion.letraPequena);
  const puestos = vivo.seleccion.map((o) => (orden.indexOf(o.slug) + 1) || 99);
  assert.deepEqual(puestos, [...puestos].sort((a, b) => a - b), 'Robinhood, Euro y Dólar, como la web (ESPEC §2.8)');
  assert.equal(es.seleccion.letraRespaldo, 'Puedes perder parte o todo lo que inviertas.');
  assert.equal(en.seleccion.letraRespaldo, 'You can lose some or all of what you invest.');
  // Rediseño del 10/11/2026: la Selección va en el carrusel «Ofertas» de
  // Inicio, junto a las recién añadidas y sin duplicados; cada tarjeta lleva
  // su nota propia si la tiene, «Pasa las 5 comprobaciones» y, plegadas
  // debajo, las 5 comprobaciones con su aviso.
  const inicio = leer('componentes', 'Inicio.js');
  assert.match(inicio, /ofertasDestacadas\(ofertas, cifras\.seleccion\)/);
  const carrusel = leer('componentes', 'RecienAnadidas.js');
  assert.match(carrusel, /t\.seleccion\.letraPequena\[o\.slug\] \|\| ''/);
  assert.match(carrusel, /t\.seleccion\.criterios\.map/);
  assert.match(carrusel, /b\.cincoNota/);
  assert.equal(es.bloques.ofertas.cincoNota, 'Pasarlas no hace a una oferta más segura ni más rentable. No es una recomendación de inversión.');
});

test('el 03 ya no lleva cifras de mercado: un enlace abre «Mercado y noticias» (rediseño del 10/11/2026; nombre del 11/11)', () => {
  const { es, en } = contenido.INICIO;
  // Una cifra, en un solo sitio: las del mercado están al día en su pantalla.
  assert.equal(contenido.CIFRAS_MERCADO_EL, undefined);
  for (const t of [es, en]) {
    assert.equal(t.capitulos.cap3.mercado, undefined);
    assert.equal(t.capitulos.cap3.sinCifra, undefined);
    assert.equal(t.capitulos.cap3.saberMas.filter((p) => p === null).length, 1, 'el hueco de la cifra sigue, para el enlace');
    assert.doesNotMatch(t.capitulos.cap3.saberMas.filter(Boolean).join(' '), /14\.230|125 veces|125 times|3,9 %|3\.9%/);
    assert.match(t.bloques.enlaceMercado, /Mercado y noticias|Market and news/);
  }
  const aprende = leer('componentes', 'AprendeInicio.js');
  assert.match(aprende, /onMercado\?\.\(\)/);
  assert.match(aprende, /b\.enlaceMercado/);
  assert.doesNotMatch(aprende, /mercadoAlDia|CIFRAS_MERCADO_EL/);
  // La función sigue en lib por si vuelve una cifra con caducidad.
  const dia = (iso) => new Date(`${iso}T12:00:00`);
  assert.equal(cifras.mercadoAlDia('2026-11-03', dia('2026-11-10')), true);
  assert.equal(cifras.mercadoAlDia('2026-11-03', dia('2026-11-11')), false);
});
