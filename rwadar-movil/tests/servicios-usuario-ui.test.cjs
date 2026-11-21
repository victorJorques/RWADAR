const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const jsx = require('@babel/plugin-transform-react-jsx');

// Ejecuta las funciones JSX reales sin arrancar Expo, red, fuentes o permisos.
const codigo = fs.readFileSync(path.join(__dirname, '..', 'App.js'), 'utf8');
const funciones = ['PanelAvisos', 'Privacidad', 'PantallaPerfil', 'etiquetaEstadoAvisos'];
const ast = babel.parseSync(codigo, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
ast.program.body = ast.program.body.filter((nodo) => nodo.type === 'FunctionDeclaration' && funciones.includes(nodo.id.name));
const js = babel.transformFromAstSync(ast, codigo, { babelrc: false, configFile: false, plugins: [jsx] }).code;

function componentes(capacidad) {
  const entorno = {
    USUARIO_LOCAL: capacidad !== true,
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    useState: inicial => [typeof inicial === 'function' ? inicial() : inicial, () => {}],
    useEffect() {}, useRef: inicial => ({ current: inicial }),
    e: {}, C: {}, URL_PRIVACIDAD: 'https://example.test/privacidad', abrirEnlace() {},
  };
  for (const nombre of ['View', 'Text', 'Pressable', 'Icono', 'Marca', 'ActivityIndicator', 'Modal', 'SafeAreaProvider', 'SafeAreaView', 'ScrollView',
    'RefreshControl', 'GrupoMenu', 'FilaMenu', 'Colabora']) entorno[nombre] = nombre;
  return new Function(...Object.keys(entorno), `${js}; return { ${funciones.join(', ')} };`)(...Object.values(entorno));
}
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...(arbol.children || []).flatMap(nodos)];
}
function texto(arbol) { return nodos(arbol).filter((n) => typeof n === 'string').join(' '); }

test('el panel editorial no ofrece activación aunque reciba un estado push antiguo', () => {
  const ui = componentes(false);
  for (const estado of ['disponible', 'activo', 'denegado', 'comprobando', 'error']) {
    const arbol = ui.PanelAvisos({ estado: { estado }, tieneSeguimientos: true, procesando: true });
    assert.match(texto(arbol), /Avisos no activados/);
    assert.doesNotMatch(texto(arbol), /Avisos push activos|pedir permiso|Abrir ajustes|Reintentar/);
    assert.ok(nodos(arbol).every((n) => !['Pressable', 'ActivityIndicator'].includes(n.type)));
  }
  assert.equal(ui.etiquetaEstadoAvisos({ estado: 'desactivados' }), 'No activados en esta versión');
});

test('privacidad editorial describe conexión y borrado limitado, sin prometer borrado histórico', () => {
  const ui = componentes(false);
  const visible = texto(ui.Privacidad({ visible: true }));
  assert.match(visible, /Catálogo con cuenta confirmada/);
  assert.match(visible, /dirección IP/);
  assert.match(visible, /rwadar\.editorial\.\*/);
  assert.match(visible, /(?:no|ni) elimina datos del servidor/);
  assert.match(visible, /datos históricos/);
  assert.doesNotMatch(visible, /La app solo genera un UUID|Primero se exige confirmación remota/);
});

test('Perfil editorial anuncia avisos y cuentas como próximamente, sin ofrecer activarlos', () => {
  const ui = componentes(false);
  const perfil = ui.PantallaPerfil({ seguidas: [], ofertasGuardadas: [] });
  assert.match(texto(perfil), /Los avisos llegarán a la app en una próxima actualización/);
  assert.match(texto(perfil), /Las cuentas llegarán a la app en una próxima actualización/);
  assert.match(texto(perfil), /Lo que guardas se queda en este dispositivo/);
  assert.ok(nodos(perfil).every((n) => n.type !== 'PanelAvisos'), 'no debe pintar el panel de activación');
  assert.doesNotMatch(texto(perfil), /pedir permiso|Avisos push activos/);
});

test('las explicaciones con y sin servicios remotos siguen separadas por capacidad explícita', () => {
  assert.doesNotMatch(texto(componentes(false).Privacidad({})), /Identificador y seguimiento/);
  const remoto = componentes(true);
  assert.match(texto(remoto.Privacidad({})), /Identificador y seguimiento/);
  const arbol = remoto.PanelAvisos({ estado: { estado: 'disponible' }, tieneSeguimientos: true });
  assert.match(texto(arbol), /Continuar y pedir permiso/);
  // Solo con la capacidad remota encendida, Perfil vuelve a usar el panel real.
  const perfilRemoto = remoto.PantallaPerfil({ seguidas: [], ofertasGuardadas: [] });
  assert.ok(nodos(perfilRemoto).some((n) => n.type === remoto.PanelAvisos));
});
