const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const jsx = require('@babel/plugin-transform-react-jsx');

// Ejecuta las funciones JSX reales sin arrancar Expo, red, fuentes o permisos.
const codigo = fs.readFileSync(path.join(__dirname, '..', 'App.js'), 'utf8');
const funciones = ['PanelAvisos', 'Privacidad', 'ResumenSeguimiento', 'EstadoVacioSeguimiento', 'EstadoVacioAvisos', 'etiquetaEstadoAvisos'];
const ast = babel.parseSync(codigo, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
ast.program.body = ast.program.body.filter((nodo) => nodo.type === 'FunctionDeclaration' && funciones.includes(nodo.id.name));
const js = babel.transformFromAstSync(ast, codigo, { babelrc: false, configFile: false, plugins: [jsx] }).code;

function componentes(local, capacidad) {
  const entorno = {
    MODO_LOCAL: local, USUARIO_LOCAL: local || capacidad !== true,
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    e: {}, C: {}, URL_PRIVACIDAD: 'https://example.test/privacidad', abrirEnlace() {},
  };
  for (const nombre of ['View', 'Text', 'Pressable', 'Icono', 'Marca', 'ActivityIndicator', 'Modal', 'SafeAreaProvider', 'SafeAreaView', 'ScrollView']) entorno[nombre] = nombre;
  return new Function(...Object.keys(entorno), `${js}; return { ${funciones.join(', ')} };`)(...Object.values(entorno));
}
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...(arbol.children || []).flatMap(nodos)];
}
function texto(arbol) { return nodos(arbol).filter((n) => typeof n === 'string').join(' '); }

test('el panel editorial no ofrece activación aunque reciba un estado push antiguo', () => {
  const ui = componentes(false, false);
  for (const estado of ['disponible', 'activo', 'denegado', 'comprobando', 'error']) {
    const arbol = ui.PanelAvisos({ estado: { estado }, tieneSeguimientos: true, procesando: true });
    assert.match(texto(arbol), /Avisos no activados/);
    assert.doesNotMatch(texto(arbol), /Avisos push activos|pedir permiso|Abrir ajustes|Reintentar/);
    assert.ok(nodos(arbol).every((n) => !['Pressable', 'ActivityIndicator'].includes(n.type)));
  }
  assert.equal(ui.etiquetaEstadoAvisos({ estado: 'desactivados' }), 'No activados en esta versión');
});

test('privacidad editorial describe conexión y borrado limitado, sin prometer borrado histórico', () => {
  const ui = componentes(false, false);
  const visible = texto(ui.Privacidad({ visible: true }));
  assert.match(visible, /Catálogo conectado, sin cuenta/);
  assert.match(visible, /dirección IP/);
  assert.match(visible, /rwadar\.editorial\.\*/);
  assert.match(visible, /no elimina datos del servidor/);
  assert.match(visible, /datos históricos/);
  assert.doesNotMatch(visible, /La app solo genera un UUID|Primero se exige confirmación remota/);
  assert.match(texto(ui.ResumenSeguimiento({ cantidad: 1 })), /No se envían a RWAdar/);
  assert.match(texto(ui.EstadoVacioSeguimiento({})), /no están activados/);
  assert.match(texto(ui.EstadoVacioAvisos({})), /no consulta ni envía novedades remotas/);
  assert.doesNotMatch(texto(ui.EstadoVacioAvisos({})), /Aquí aparecerán los cambios publicados/);
});

test('las explicaciones local y remota siguen separadas por capacidad explícita', () => {
  const local = componentes(true, true);
  assert.match(texto(local.Privacidad({})), /Copia interna aislada/);
  assert.doesNotMatch(texto(local.Privacidad({})), /Catálogo conectado, sin cuenta/);
  const remoto = componentes(false, true);
  assert.match(texto(remoto.Privacidad({})), /Identificador y seguimiento/);
  const arbol = remoto.PanelAvisos({ estado: { estado: 'disponible' }, tieneSeguimientos: true });
  assert.match(texto(arbol), /Continuar y pedir permiso/);
});
