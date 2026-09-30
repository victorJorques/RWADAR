const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '..', '..');
const explicador = fs.readFileSync(path.join(raiz, 'rwadar-movil/componentes/Explicador.js'), 'utf8');
const pagina = explicador.match(/const PAGINA = ['"]([^'"]+)['"]/u)?.[1];
const portada = fs.readFileSync(path.join(raiz, 'rwadar-site/index.html'), 'utf8');
const rutaAnalitica = portada.match(/src=["'](\/assets\/analitica-[\w.-]+\.js)["']/u)?.[1];
assert.ok(rutaAnalitica, 'Localizar el cargador real de analítica antes de declarar privacidad');
const analitica = fs.readFileSync(path.join(raiz, 'rwadar-site', rutaAnalitica.slice(1)), 'utf8');

function scriptsSolicitados(href) {
  const scripts = [];
  const prohibido = () => { throw new Error('La prueba no permite red ni almacenamiento'); };
  vm.runInNewContext(analitica, {
    URL, location: { href }, navigator: { onLine: true }, fetch: prohibido,
    get localStorage() { return prohibido(); },
    get sessionStorage() { return prohibido(); },
    document: {
      referrer: '',
      get cookie() { return prohibido(); },
      querySelector: () => null,
      createElement: () => ({ setAttribute() {} }),
      head: { appendChild: script => scripts.push(script) },
    },
  }, { timeout: 1000 });
  return scripts;
}

test('el explicador nativo conserva el fragmento que excluye su carga inicial de analítica web', () => {
  assert.equal(pagina, 'https://rwadar.pages.dev/#explain',
    'Cambiar la URL requiere revisar la declaración de datos de la WebView');
  assert.match(explicador, /source=\{\{ uri: PAGINA \}\}/u);
  assert.equal(scriptsSolicitados(pagina).length, 0);
});

test('la comprobación del explicador no equivale a declarar toda la WebView sin analítica', () => {
  // Control positivo: una navegación a la portada sin fragmento sí carga el
  // beacon. No confundir este test del cargador con una captura de red del APK.
  const scripts = scriptsSolicitados(new URL('/', pagina).href);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
});
