// Rótulos en frase normal, sin mayúsculas (GUIA-ACABADOS §5, aplicada a la web el 04/11/2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const ignore = require('ignore');

const RAIZ = path.resolve(__dirname, '..');
const RAIZ_REPO = path.resolve(RAIZ, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

/* Carga un módulo ESM/JSX de la app con babel, sustituyendo dependencias
   nativas por dobles de prueba. Los módulos propios no simulados se cargan
   también transformados. */
function cargar(ruta, mocks = {}) {
  const propio = (archivo) => archivo.startsWith(RAIZ + path.sep) && !archivo.includes(`${path.sep}node_modules${path.sep}`);
  const cargarOriginal = Module._load;
  const jsOriginal = Module._extensions['.js'];
  Module._load = function (pedido, padre, esPrincipal) {
    if (Object.hasOwn(mocks, pedido)) return mocks[pedido];
    return cargarOriginal.call(this, pedido, padre, esPrincipal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (!propio(archivo)) return jsOriginal(modulo, archivo);
    const { code } = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
      filename: archivo, babelrc: false, configFile: false, plugins: [jsx, commonjs],
    });
    modulo._compile(code, archivo);
  };
  for (const clave of Object.keys(require.cache)) if (propio(clave)) delete require.cache[clave];
  try {
    return require(path.join(RAIZ, ruta));
  } finally {
    Module._load = cargarOriginal;
    Module._extensions['.js'] = jsOriginal;
  }
}

const contenido = cargar('lib/academy-contenido.js');
const progreso = cargar('lib/academy-progreso.js');
const publicadas = contenido.LECCIONES.filter((l) => l.publicado);

test('el contenido de la app sale del mismo generador que la web y está al día', () => {
  const academy = require(path.join(RAIZ_REPO, 'rwadar-academy.js'));
  const pendientes = academy.comprobar();
  assert.deepEqual(pendientes.filter((p) => p.includes('rwadar-movil')), []);
  assert.match(leer('lib', 'academy-contenido.js'), /^\/\* GENERADO por rwadar-academy\.js/);
});

test('la app trae las nueve lecciones y solo el texto completo de las publicadas', () => {
  assert.equal(contenido.LECCIONES.length, 9);
  assert.equal(publicadas.length, 7);
  for (const l of contenido.LECCIONES) {
    assert.match(l.url, /^https:\/\/rwadar\.pages\.dev\/academy\/[a-z0-9-]+$/);
    if (l.publicado) {
      assert.equal(l.tldr.length, 3, l.slug);
      assert.ok(l.cuerpo.length > 10, l.slug);
      assert.ok(l.quiz.length >= 1, l.slug);
      for (const p of l.quiz) {
        assert.ok(p.correcta >= 0 && p.correcta < p.opciones.length, l.slug);
        assert.ok(p.explicacion.length > 0, `${l.slug}: la explicación es obligatoria`);
      }
    } else {
      for (const campo of ['tldr', 'cuerpo', 'quiz', 'glosario', 'siguientePaso', 'notaLegal']) {
        assert.equal(l[campo], undefined, `${l.slug} no debe incluir ${campo}`);
      }
    }
  }
  assert.equal(contenido.NIVELES.length, 3);
  assert.equal(contenido.AVISO_COMUN.length, 3);
});

test('cada botón de una lección lleva al radar, a la web o a «Próximamente»', () => {
  const claves = new Set();
  const recorrer = (valor) => {
    if (Array.isArray(valor)) valor.forEach(recorrer);
    else if (valor && typeof valor === 'object') {
      if (typeof valor.a === 'string') claves.add(valor.a);
      Object.values(valor).forEach(recorrer);
    }
  };
  publicadas.forEach(recorrer);
  assert.ok(claves.size >= 4);
  for (const clave of claves) {
    const leccion = clave.match(/^leccion:(.+)$/);
    if (leccion) {
      assert.ok(contenido.LECCIONES.some((l) => l.slug === leccion[1]), clave);
      continue;
    }
    const destino = contenido.DESTINOS[clave];
    assert.ok(destino, `destino desconocido: ${clave}`);
    if (destino.estado === 'proximamente') assert.equal(destino.app, undefined, clave);
    else if (destino.app === 'web') assert.match(destino.url, /^https:\/\/rwadar\.pages\.dev\/#[a-z]+$/, clave);
    else assert.equal(destino.app, 'radar', clave);
  }
  assert.equal(contenido.DESTINOS['evaluador-viabilidad'].estado, 'proximamente');
});

test('el progreso se valida al leerlo y no admite valores manipulados', () => {
  const { normalizarProgreso, alternarLeida, registrarTest, progresoVacio } = progreso;
  assert.deepEqual(normalizarProgreso(null), progresoVacio());
  assert.deepEqual(normalizarProgreso('texto'), progresoVacio());
  assert.deepEqual(normalizarProgreso({
    leidas: ['buena', 'buena', '../mala', 7, 'Mayus'],
    tests: { buena: { aciertos: 2, total: 3 }, otra: { aciertos: 5, total: 3 }, '__proto__': { aciertos: 1, total: 1 } },
  }), { leidas: ['buena'], tests: { buena: { aciertos: 2, total: 3 } } });
  assert.deepEqual(normalizarProgreso({ leidas: ['a', 'b'] }, ['a']).leidas, ['a']);
  const marcado = alternarLeida(progresoVacio(), 'leccion-uno');
  assert.deepEqual(marcado.leidas, ['leccion-uno']);
  assert.deepEqual(alternarLeida(marcado, 'leccion-uno').leidas, []);
  assert.deepEqual(registrarTest(progresoVacio(), 'leccion-uno', 3, 3).tests, { 'leccion-uno': { aciertos: 3, total: 3 } });
  assert.deepEqual(registrarTest(progresoVacio(), 'leccion-uno', 4, 3).tests, {});
});

test('el progreso vive en el dispositivo y se borra con «Borrar datos del dispositivo»', () => {
  const datos = leer('lib', 'datos.js');
  assert.match(datos, /const PROGRESO_ACADEMY = `\$\{PREFIJO\}academy\.progreso\.v1`;/);
  assert.match(datos, /CACHE_EXCLUSIONES, CACHE_FECHA, CACHE_SIGO, CACHE_PENDIENTES, PROGRESO_ACADEMY,/);
  assert.match(datos, /export async function leerProgresoAcademy/);
  const app = leer('App.js');
  assert.match(app, /las inversiones registradas de todas las cuentas en este dispositivo, el progreso de la Academy y las cachés del catálogo/);
  assert.match(app, /progreso de RWAdar Academy \(lecciones leídas y aciertos del test\)/);
  const componente = leer('componentes', 'Academy.js');
  assert.doesNotMatch(componente, /supabase|fetch\(|Linking/);
  assert.match(componente, /guardarProgresoAcademy/);
});

test('la Academy es una pestaña y sus botones solo llevan a Buscar o a la web', () => {
  const app = leer('App.js');
  assert.match(app, /<Academy\b/);
  assert.match(app, /const \[leccion, setLeccion\] = useState\(''\)/);
  assert.match(app, /\{pestana === 'academy' \? \(\s*<Academy\s+slug=\{leccion \|\| null\}/);
  assert.match(app, /const abrirAcademy = \(\) => \{ tacto\.abrir\(\); setLeccion\(''\); setPestana\('academy'\); \};/);
  assert.match(app, /if \(destino\.app === 'radar'\) \{\s*setPestana\('buscar'\);\s*setVistaBuscar\('empresas'\);/);
  assert.match(app, /else if \(destino\.app === 'web' && destino\.url\) \{\s*abrirEnlace\(destino\.url\);/);
  assert.doesNotMatch(app, /Modal visible=\{academy/);
  assert.match(leer('componentes', 'Academy.js'), /\{onCerrar \? \(/);
  assert.match(leer('componentes', 'Navegacion.js'), /nombre === 'academy'/);
});

test('EAS empaqueta la Academy de la app', () => {
  const filtro = ignore().add(fs.readFileSync(path.join(RAIZ_REPO, '.easignore'), 'utf8'));
  for (const ruta of ['rwadar-movil/componentes/Academy.js', 'rwadar-movil/lib/academy-contenido.js',
    'rwadar-movil/lib/academy-progreso.js']) {
    assert.equal(filtro.ignores(ruta), false, ruta);
    assert.ok(fs.existsSync(path.join(RAIZ_REPO, ruta)), ruta);
  }
});

/* Pinta la pantalla de verdad con react-native-web: si un bloque de una
   lección no se pudiera dibujar, esta prueba lo detecta. */
test('la Academy se pinta: índice y todas las lecciones publicadas', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const rnw = require('react-native-web');
  const academy = cargar('componentes/Academy.js', {
    'react-native': rnw,
    '../lib/tacto': { tacto: new Proxy({}, { get: () => () => Promise.resolve() }) },
    './Navegacion': { Icono: () => null },
    '../lib/datos': {
      leerProgresoAcademy: async () => ({ leidas: [], tests: {} }),
      guardarProgresoAcademy: async (p) => p,
    },
  });
  const Academy = academy.default;
  const props = { onAbrirLeccion() {}, onVolver() {}, onCerrar() {}, onAccion() {}, onExplicar() {} };

  const indice = renderToStaticMarkup(React.createElement(Academy, { ...props, slug: null }));
  for (const l of contenido.LECCIONES) assert.ok(indice.includes(l.titulo.replace(/«/g, '«')), l.slug);
  assert.equal((indice.match(/>Próximamente</g) || []).length, 2);
  assert.match(indice, /0<\/span>|>0</);

  for (const l of publicadas) {
    const html = renderToStaticMarkup(React.createElement(Academy, { ...props, slug: l.slug }));
    assert.ok(html.includes('En 30 segundos'), l.slug);
    assert.ok(html.includes('Comprueba lo que has aprendido'), l.slug);
    assert.ok(html.includes('Da el siguiente paso'), l.slug);
    assert.ok(html.includes(`Contenido revisado el ${l.revisionLegalTexto}`), l.slug);
    assert.equal(html.includes('Aviso reforzado para esta lección'), l.avisoReforzado, l.slug);
    assert.ok(!html.includes('undefined'), `${l.slug} pinta «undefined»`);
  }
  assert.equal(academy.resolverDestino('evaluador-viabilidad').estado, 'proximamente');
  assert.equal(academy.resolverDestino('leccion:marco-legal-cuando-tu-token-es-un-valor').app, 'leccion');
  assert.equal(academy.resolverDestino('leccion:como-leer-el-radar').app, 'leccion');
  assert.equal(academy.resolverDestino('leccion:expediente-de-tokenizacion').estado, 'proximamente');
});
