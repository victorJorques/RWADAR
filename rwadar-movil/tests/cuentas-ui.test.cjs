const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const {soporteIdioma}=require('./soporte-idioma.cjs');

const RAIZ = path.resolve(__dirname, '..');
const ARCHIVO = path.join(RAIZ, 'componentes', 'Cuenta.js');
const colores = { tx: '#fff', tx2: '#bbb', tx3: '#888', noche: '#000', noche2: '#111', sup: '#222', sup2: '#333',
  senal: '#25e39a', senalCl: '#6bf0c0', coral: '#ff3b30', linea: '#26241f', linea2: '#3a3833' };
const tema = { C: colores, F: { regular: 'system', negrita: 'system' }, T: { cuerpo: {}, cuerpoFte: {}, menor: {},
  ficha: {}, seccion: {}, etiqueta: {} }, R: { ficha: 18, s: 12 }, UI: { boton: 52, tactil: 48 } };

function cargar(react, nativo) {
  const original = Module._load;
  const extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (pedido === './Idioma' && padre.filename === ARCHIVO) return soporteIdioma(react,nativo);
    if (pedido === 'react') return react;
    if (pedido === 'react-native') return nativo;
    if (pedido === '../lib/tema' && padre.filename === ARCHIVO) return tema;
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, archivo) {
    if (archivo !== ARCHIVO) return extension(modulo, archivo);
    const { code } = babel.transformSync(fs.readFileSync(archivo, 'utf8'), {
      filename: archivo, babelrc: false, configFile: false, plugins: [jsx, commonjs],
    });
    modulo._compile(code, archivo);
  };
  delete require.cache[ARCHIVO];
  try { return require(ARCHIVO); } finally {
    Module._load = original; Module._extensions['.js'] = extension;
  }
}

function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  return [arbol, ...(arbol.children || []).flatMap(nodos)];
}
function texto(arbol) { return nodos(arbol).filter((n) => typeof n === 'string').join(' '); }

/* Ejecuta los handlers de la pantalla real con hooks aislados. No arranca
   Expo, el SDK de Supabase, almacenamiento, permisos ni ninguna conexión. */
function pantalla(inicial = {}, acciones = {}) {
  const slots = []; const efectos = []; const pendientes = [];
  let indice = 0; let cambiado = false; let arbol;
  const llamadas = [];
  let snapshot = { disponible: true, estado: 'sin-sesion', usuario: null, perfil: null,
    vigiladas: [], procesando: false, accion: '', error: '', mensaje: '', ...inicial };
  const react = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function') return tipo({ ...props, children });
      return { type: tipo, props: props || {}, children };
    },
    useState(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [slots[i], (valor) => {
        const nuevo = typeof valor === 'function' ? valor(slots[i]) : valor;
        if (!Object.is(slots[i], nuevo)) { slots[i] = nuevo; cambiado = true; }
      }];
    },
    useRef(inicial) {
      const i = indice++;
      if (!Object.hasOwn(slots, i)) slots[i] = { current: inicial };
      return slots[i];
    },
    useEffect(fn, deps) {
      const i = indice++;
      if (!efectos[i] || deps.some((v, j) => !Object.is(v, efectos[i].deps[j]))) {
        pendientes.push(() => {
          efectos[i]?.limpiar?.();
          efectos[i] = { deps, limpiar: fn() };
        });
      }
    },
  };
  const nativo = { Keyboard: { dismiss() {} }, Platform: { OS: 'android' }, StyleSheet: { create: (s) => s } };
  for (const tipo of ['Text', 'TextInput', 'View', 'Pressable', 'ActivityIndicator', 'KeyboardAvoidingView']) nativo[tipo] = tipo;
  const cuenta = cargar(react, nativo);
  const controlador = { cancelar() { llamadas.push(['cancelar']); } };
  for (const accion of ['registrar', 'entrar', 'reenviar', 'recuperar', 'guardarPerfil', 'alternarVigilancia',
    'refrescar', 'salir', 'borrarCuenta']) {
    controlador[accion] = async (datos) => {
      llamadas.push([accion, datos]);
      if (acciones[accion]) return acciones[accion](datos);
      if (accion === 'registrar') snapshot = { ...snapshot, estado: 'confirmacion', mensaje: 'Comprueba tu correo.' };
      if (accion === 'salir' || accion === 'borrarCuenta') snapshot = { ...snapshot, estado: 'sin-sesion', usuario: null, perfil: null, vigiladas: [] };
      return { ok: true };
    };
  }
  const plataformas = [{ slug: 'uno', nombre: 'Empresa Uno' }, { slug: 'dos', nombre: 'Empresa Dos' }];
  function pintar() {
    for (let vueltas = 0; vueltas < 6; vueltas++) {
      indice = 0; cambiado = false;
      arbol = cuenta.default({ controlador, estado: snapshot, plataformas,
        onAbrirEmpresa: (p) => llamadas.push(['abrir', p.slug]), onAbrirEnlace: (url) => llamadas.push(['enlace', url]) });
      while (pendientes.length) pendientes.shift()();
      if (!cambiado) return arbol;
    }
    throw new Error('El componente no estabiliza sus efectos');
  }
  function buscar(tipo, etiqueta) {
    return nodos(pintar()).find((n) => n.type === tipo && n.props.accessibilityLabel === etiqueta);
  }
  pintar();
  return {
    cuenta, llamadas, pintar,
    cambiar(estado) { snapshot = { ...snapshot, ...estado }; return pintar(); },
    texto: () => texto(pintar()),
    campo(etiqueta, valor) {
      const entrada = buscar('TextInput', etiqueta); assert.ok(entrada, `Falta el campo ${etiqueta}`);
      entrada.props.onChangeText(valor); pintar();
    },
    boton: (etiqueta) => buscar('Pressable', etiqueta),
    async pulsar(etiqueta) {
      const boton = buscar('Pressable', etiqueta); assert.ok(boton, `Falta el botón ${etiqueta}`);
      assert.ok(!boton.props.disabled, `${etiqueta} está deshabilitado`);
      boton.props.onPress();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      pintar();
    },
    limpiar() { for (const e of efectos) e?.limpiar?.(); },
  };
}

const autenticada = { estado: 'autenticada', usuario: { id: 'usuaria-local', correo: 'ana@ejemplo.test' },
  perfil: { id: 'usuaria-local', nombre: 'Ana' }, vigiladas: [{ id: 'v1', nombre: 'Empresa Uno' }] };

test('la compuerta de cuentas cerrada no pinta campos ni acciones de Auth', () => {
  const p = pantalla({ disponible: false, ...autenticada });
  assert.match(p.texto(), /Cuentas en preparación/);
  assert.equal(nodos(p.pintar()).filter((n) => ['TextInput', 'Pressable'].includes(n.type)).length, 0);
  assert.deepEqual(p.llamadas, []);
  p.limpiar();
});

test('el acceso valida correo y contraseña antes de pedir nada al controlador', async () => {
  const p = pantalla();
  await p.pulsar('Entrar'); assert.match(p.texto(), /correo válido/);
  p.campo('Correo', 'ana@ejemplo.test');
  await p.pulsar('Entrar'); assert.match(p.texto(), /Escribe tu contraseña/);
  assert.equal(p.llamadas.filter(([n]) => n === 'entrar').length, 0);
});

test('alta con aceptación explícita, contraseña oculta y confirmación antes del acceso', async () => {
  const p = pantalla(); await p.pulsar('Crear una cuenta gratis');
  p.campo('Correo', 'ana@ejemplo.test'); p.campo('Contraseña · mínimo 12 caracteres', 'clave de prueba local');
  await p.pulsar('Crear cuenta'); assert.match(p.texto(), /Acepta las condiciones/);
  await p.pulsar('Acepto las condiciones y he leído la privacidad');
  await p.pulsar('Crear cuenta');
  assert.deepEqual(p.llamadas.find(([n]) => n === 'registrar')[1], {
    correo: 'ana@ejemplo.test', clave: 'clave de prueba local', nombre: '', aceptaCondiciones: true,
  });
  assert.match(p.texto(), /Confirma tu correo/);
  assert.match(p.texto(), /Después vuelve a la app/);
  assert.equal(p.llamadas.some(([n]) => n === 'entrar'), false);
  await p.pulsar('Ya confirmé: entrar');
  assert.ok(p.boton('Entrar'), 'debe volver a mostrar el acceso, aunque el último estado fuera confirmación');
  const clave = nodos(p.pintar()).find((n) => n.type === 'TextInput' && n.props.accessibilityLabel === 'Contraseña');
  assert.equal(clave.props.value, ''); assert.equal(clave.props.secureTextEntry, true);
});

test('la confirmación fallida se puede reenviar sin contraseña ni acceso automático', async () => {
  const p = pantalla({ estado: 'confirmacion' });
  p.campo('Correo para reenviar la confirmación', 'ana@ejemplo.test');
  await p.pulsar('Reenviar confirmación');
  assert.deepEqual(p.llamadas.find(([n]) => n === 'reenviar')[1], { correo: 'ana@ejemplo.test' });
  assert.equal(nodos(p.pintar()).filter((n) => n.type === 'TextInput' && n.props.secureTextEntry).length, 0);
  assert.equal(p.llamadas.some(([n]) => n === 'entrar'), false);
});

test('recuperación por correo lleva a la web y deja el acceso manual en la app', async () => {
  const p = pantalla(); await p.pulsar('He olvidado la contraseña');
  assert.match(p.texto(), /contraseña nueva en la web/);
  p.campo('Correo', 'ana@ejemplo.test'); await p.pulsar('Enviar enlace de recuperación');
  assert.deepEqual(p.llamadas.find(([n]) => n === 'recuperar')[1], { correo: 'ana@ejemplo.test' });
  await p.pulsar('Volver a entrar'); assert.ok(p.boton('Entrar'));
});

test('entrar no conserva la contraseña escrita mientras se procesa ni al cambiar de vista', async () => {
  const p = pantalla(); p.campo('Correo', 'ana@ejemplo.test'); p.campo('Contraseña', 'clave de prueba local');
  await p.pulsar('Entrar');
  const campo = nodos(p.pintar()).find((n) => n.type === 'TextInput' && n.props.secureTextEntry);
  assert.equal(campo.props.value, '');
  await p.pulsar('Crear una cuenta gratis');
  assert.equal(nodos(p.pintar()).find((n) => n.type === 'TextInput' && n.props.secureTextEntry).props.value, '');
});

test('lista remota, abrir ficha, selector y quitar no confunden los favoritos locales', async () => {
  const p = pantalla(autenticada);
  assert.match(p.texto(), /TU CUENTA · WEB Y APP/);
  assert.match(p.texto(), /Estas empresas se sincronizan con tu cuenta/);
  assert.doesNotMatch(p.texto(), /token|monedero/);
  await p.pulsar('Ver Empresa Uno'); assert.ok(p.llamadas.some(([n, dato]) => n === 'abrir' && dato === 'uno'));
  await p.pulsar('Añadir una empresa');
  assert.ok(p.boton('Vigilar Empresa Dos')); assert.equal(p.boton('Vigilar Empresa Uno'), undefined);
  await p.pulsar('Vigilar Empresa Dos');
  await p.pulsar('Quitar Empresa Uno');
  assert.deepEqual(p.llamadas.filter(([n]) => n === 'alternarVigilancia').map(([, datos]) => datos), ['Empresa Dos', 'Empresa Uno']);
  assert.equal(p.llamadas.some(([n]) => ['alternarSeguimiento', 'borrarDatosDispositivo', 'registrarParaAvisos'].includes(n)), false);
});

test('editar nombre y actualizar la lista tienen acciones reales y explícitas', async () => {
  const p = pantalla(autenticada); await p.pulsar('Editar nombre');
  p.campo('Nombre (opcional)', 'Ana Local'); await p.pulsar('Guardar nombre');
  assert.deepEqual(p.llamadas.find(([n]) => n === 'guardarPerfil')[1], { nombre: 'Ana Local' });
  await p.pulsar('Actualizar mi lista'); assert.ok(p.llamadas.some(([n]) => n === 'refrescar'));
});

test('un nombre de usuario que coincide con un rótulo y su correo conservan contenido original',()=>{
  const p=pantalla({...autenticada,perfil:{...autenticada.perfil,nombre:'Inicio'},usuario:{...autenticada.usuario,correo:'Inicio@ejemplo.test'}});
  for(const literal of ['Inicio','Inicio@ejemplo.test']) {
    const node=nodos(p.pintar()).find(n=>n.type==='Text'&&texto(n)===literal);
    assert.equal(node?.props.noTraducir,true,literal);
  }
});

test('borrar cuenta exige contraseña nueva en pantalla y BORRAR; cancelar no da la baja', async () => {
  const p = pantalla(autenticada); await p.pulsar('Borrar mi cuenta');
  assert.match(p.texto(), /No se puede deshacer/);
  await p.pulsar('Confirmar borrado de cuenta'); assert.match(p.texto(), /Escribe tu contraseña/);
  p.campo('Contraseña actual', 'clave de prueba local');
  p.campo('Escribe BORRAR', 'borrar'); await p.pulsar('Confirmar borrado de cuenta');
  assert.match(p.texto(), /Escribe BORRAR/); assert.equal(p.llamadas.some(([n]) => n === 'borrarCuenta'), false);
  await p.pulsar('Cancelar borrado'); assert.ok(p.boton('Cerrar sesión'));
  await p.pulsar('Borrar mi cuenta'); p.campo('Contraseña actual', 'clave de prueba local'); p.campo('Escribe BORRAR', 'BORRAR');
  await p.pulsar('Confirmar borrado de cuenta');
  assert.deepEqual(p.llamadas.find(([n]) => n === 'borrarCuenta')[1], { clave: 'clave de prueba local', confirmacion: 'BORRAR' });
  assert.ok(p.boton('Entrar'));
});

test('salir borra el perfil remoto de la pantalla sin pedir borrado de datos locales', async () => {
  const p = pantalla(autenticada); await p.pulsar('Cerrar sesión');
  assert.ok(p.boton('Entrar')); assert.doesNotMatch(p.texto(), /Ana/);
  assert.equal(p.llamadas.filter(([n]) => n === 'salir').length, 1);
  assert.equal(p.llamadas.some(([n]) => n === 'borrarCuenta'), false);
});

test('petición rechazada inesperada no se escapa ni muestra el error privado', async () => {
  const p = pantalla({}, { entrar: async () => { throw new Error('una respuesta privada del SDK'); } });
  p.campo('Correo', 'ana@ejemplo.test'); p.campo('Contraseña', 'clave de prueba local');
  await p.pulsar('Entrar'); assert.match(p.texto(), /No se pudo completar/);
  assert.doesNotMatch(p.texto(), /respuesta privada/);
});

test('estado ocupado deshabilita envíos, conserva una salida y anuncia el error', async () => {
  const p = pantalla({ procesando: true, accion: 'entrar', error: 'Comprueba tu conexión.' });
  assert.equal(p.boton('Entrar').props.disabled, true);
  assert.deepEqual(p.boton('Entrar').props.accessibilityState, { disabled: true, busy: true });
  assert.match(p.texto(), /Comprueba tu conexión/);
  await p.pulsar('Cancelar operación'); assert.ok(p.llamadas.some(([n]) => n === 'cancelar'));
  p.limpiar(); assert.ok(p.llamadas.filter(([n]) => n === 'cancelar').length >= 2);
});

test('los enlaces legales no llevan contraseñas, tokens ni parámetros de sesión', async () => {
  const p = pantalla(); await p.pulsar('Crear una cuenta gratis');
  await p.pulsar('Leer condiciones'); await p.pulsar('Leer privacidad');
  assert.deepEqual(p.llamadas.filter(([n]) => n === 'enlace').map(([, url]) => url), [
    'https://rwadar.pages.dev/condiciones', 'https://rwadar.pages.dev/privacidad',
  ]);
});

test('todos los botones reales tienen diana mínima de 48 y etiquetas accesibles', () => {
  for (const estado of [{}, autenticada]) {
    const p = pantalla(estado);
    for (const n of nodos(p.pintar()).filter((n) => n.type === 'Pressable')) {
      assert.ok(n.props.accessibilityLabel);
      const estilos = typeof n.props.style === 'function' ? n.props.style({ pressed: false }) : [n.props.style];
      assert.ok(estilos.flat().some((s) => s?.minHeight >= 48), n.props.accessibilityLabel);
    }
  }
});

test('el componente nativo se renderiza también con react-native-web, sin Auth ni red', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Cuenta = cargar(React, require('react-native-web')).default;
  const controlador = { cancelar() {} };
  for (const estado of [{ disponible: false }, { disponible: true, estado: 'sin-sesion' }, { disponible: true, ...autenticada }]) {
    const html = renderToStaticMarkup(React.createElement(Cuenta, { controlador, estado, plataformas: [],
      onAbrirEmpresa() {}, onAbrirEnlace() {} }));
    assert.match(html, /Cuentas en preparación|Entra en tu cuenta|Tu perfil/);
    assert.doesNotMatch(html, /undefined|access_token|refresh_token/);
    if (estado.estado === 'sin-sesion') assert.match(html, /type="password"/);
    if (estado.estado === 'autenticada') assert.match(html, /Lista de vigilancia/);
  }
});

test('App integra cuentas aparte de instalaciones, conserva favoritos y no activa otros servicios', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  assert.match(app, /crearControladorCuentas\(\{ modoLocal: MODO_LOCAL/);
  assert.match(app, /cuentasRemotas: CUENTAS_REMOTAS, correoVerificado: CORREO_AUTH_E2E/);
  assert.match(app, /controlador\.suscribir\(setEstadoCuenta\)/);
  assert.match(app, /cancelarSuscripcion\(\); controlador\.destruir\(\)/);
  assert.match(app, /CUENTAS_REMOTAS/);
  assert.match(app, /ofertasGuardadas\(\)/);
  assert.match(app, /Los siguientes favoritos se guardan solo en este dispositivo/);
  assert.match(app, /keyboardShouldPersistTaps="handled"/);
  assert.doesNotMatch(app, /cuenta\.registrar\(/, 'registrarse no ocurre al arrancar la app');
});

/* Renderiza las secciones y sus estilos reales sin arrancar App/Expo ni el
   controlador. Detecta regresiones de separación que un SSR sin layout no ve. */
function seccionesPerfil() {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const ast = babel.parseSync(app, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
  const funciones = ast.program.body.filter((n) => n.type === 'FunctionDeclaration'
    && ['PantallaPerfil', 'Cabecera'].includes(n.id.name));
  const estilos = ast.program.body.flatMap((n) => n.type === 'VariableDeclaration' ? n.declarations : [])
    .find((n) => n.id.type === 'Identifier' && n.id.name === 'e');
  assert.ok(estilos?.init?.arguments?.[0], 'falta StyleSheet.create de App');
  const seleccion = babel.types.cloneNode(estilos, true);
  seleccion.init.arguments[0].properties = seleccion.init.arguments[0].properties.filter((p) =>
    ['notaFavoritosLocales', 'notaGuardadas', 'grupoSeccion'].includes(p.key?.name));
  ast.program.body = [...funciones, babel.types.variableDeclaration('const', [seleccion])];
  const js = babel.transformFromAstSync(ast, app, { babelrc: false, configFile: false, plugins: [jsx] }).code;
  const entorno = {
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    StyleSheet: { create: (s) => s }, T: tema.T, C: colores, MODO_LOCAL: false, USUARIO_LOCAL: true,
  };
  for (const nombre of ['View', 'Text', 'ScrollView', 'RefreshControl', 'Pressable', 'Marca', 'Icono',
    'Cuenta', 'GrupoMenu', 'FilaMenu', 'PanelAvisos']) entorno[nombre] = nombre;
  return new Function(...Object.keys(entorno), `${js}; return { PantallaPerfil, Cabecera, e };`)(...Object.values(entorno));
}

test('la nota después de Cuenta queda separada y no hereda el margen negativo de ofertas retiradas', () => {
  const ui = seccionesPerfil();
  const perfil = ui.PantallaPerfil({ cuenta: {}, estadoCuenta: { disponible: true },
    seguidas: [], ofertasGuardadas: [], guardadasRetiradas: 1 });
  const hijos = perfil.children.flat(Infinity).filter((n) => n && typeof n === 'object');
  const posicionCuenta = hijos.findIndex((n) => n.type === 'Cuenta');
  assert.ok(posicionCuenta >= 0);
  const nota = hijos[posicionCuenta + 1];
  assert.equal(nota.type, 'Text');
  assert.match(texto(nota), /Los siguientes favoritos se guardan solo en este dispositivo/);
  assert.equal(nota.props.style, ui.e.notaFavoritosLocales);
  assert.equal(nota.props.style.marginTop, 16, 'la nota debe empezar debajo del borde de la tarjeta');
  assert.equal(nota.props.style.marginBottom, 22);
  assert.notEqual(nota.props.style, ui.e.notaGuardadas);
  const historica = hijos.find((n) => n.type === 'Text' && texto(n).includes('Una oferta guardada'));
  assert.equal(historica.props.style, ui.e.notaGuardadas);
  assert.equal(historica.props.style.marginTop, -14);
  assert.equal(ui.e.grupoSeccion.marginBottom, 25, 'el margen histórico compensa el negativo de la nota de retiradas');
});

test('la cabecera de Perfil distingue cero, un guardado y varios guardados', () => {
  const ui = seccionesPerfil();
  for (const [guardados, esperado] of [[0, 'Lo que guardas, avisos y privacidad'],
    [1, '1 guardado en este dispositivo'], [2, '2 guardados en este dispositivo']]) {
    const cabecera = ui.Cabecera({ pestana: 'perfil', guardados });
    assert.ok(nodos(cabecera).some((n) => n.type === 'Text' && texto(n) === esperado), esperado);
    assert.doesNotMatch(texto(cabecera), /1 guardados/);
  }
});

test('el efecto de App libera el controlador y vuelve a crear uno sano al repetirse en StrictMode', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const ast = babel.parseSync(app, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
  let efecto;
  babel.traverse(ast, { CallExpression(ruta) {
    if (ruta.node.callee.type === 'Identifier' && ruta.node.callee.name === 'useEffect'
      && app.slice(ruta.node.start, ruta.node.end).includes('const controlador = crearControladorCuentas')) {
      efecto = ruta.node.arguments[0];
    }
  } });
  assert.ok(efecto, 'App debe poseer creación y liberación en el mismo efecto');
  const js = babel.transformFromAstSync(babel.types.file(babel.types.program([
    babel.types.expressionStatement(efecto),
  ])), null, { babelrc: false, configFile: false }).code;
  const controladores = [], visibles = [];
  const crear = new Function('crearControladorCuentas', 'setCuenta', 'setEstadoCuenta', 'MODO_LOCAL',
    'CUENTAS_REMOTAS', 'CORREO_AUTH_E2E', `return (${js.replace(/;\s*$/, '')});`);
  const setup = crear((flags) => {
    const c = { flags, destruido: false, desuscrito: false,
      suscribir(fn) { fn({ disponible: true }); return () => { c.desuscrito = true; }; },
      destruir() { c.destruido = true; },
    };
    controladores.push(c); return c;
  }, (c) => visibles.push(c), () => {}, false, true, true);
  const limpiarPrimero = setup(); limpiarPrimero();
  const limpiarSegundo = setup();
  assert.equal(controladores.length, 2);
  assert.equal(controladores[0].desuscrito, true); assert.equal(controladores[0].destruido, true);
  assert.equal(controladores[1].destruido, false); assert.equal(visibles[1], controladores[1]);
  assert.deepEqual(controladores[1].flags, { modoLocal: false, cuentasRemotas: true, correoVerificado: true });
  limpiarSegundo(); assert.equal(controladores[1].destruido, true);
});

test('privacidad con cuentas abiertas describe memoria, baja y favoritos sin decir que Auth está cerrado', () => {
  const app = fs.readFileSync(path.join(RAIZ, 'App.js'), 'utf8');
  const ast = babel.parseSync(app, { babelrc: false, configFile: false, parserOpts: { plugins: ['jsx'] } });
  ast.program.body = ast.program.body.filter((n) => n.type === 'FunctionDeclaration' && n.id.name === 'Privacidad');
  const js = babel.transformFromAstSync(ast, app, { babelrc: false, configFile: false, plugins: [jsx] }).code;
  const entorno = { React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    MODO_LOCAL: false, USUARIO_LOCAL: true, e: {}, C: {}, URL_PRIVACIDAD: 'https://rwadar.pages.dev/privacidad', abrirEnlace() {} };
  for (const nombre of ['Modal', 'SafeAreaProvider', 'SafeAreaView', 'View', 'Text', 'ScrollView', 'Pressable', 'ActivityIndicator']) entorno[nombre] = nombre;
  const Privacidad = new Function(...Object.keys(entorno), `${js};return Privacidad;`)(...Object.values(entorno));
  const copia = texto(Privacidad({ estadoCuenta: { disponible: true } }));
  assert.match(copia, /Cuenta confirmada para entrar en web y app/);
  assert.match(copia, /sesión vive solo en memoria/);
  assert.match(copia, /contraseña y escribiendo BORRAR/);
  assert.match(copia, /No se envían los favoritos locales ni el progreso/);
  assert.match(copia, /Instalaciones y avisos desactivados/);
  assert.doesNotMatch(copia, /Catálogo conectado, sin cuenta|Servicios de usuario desactivados|La app solo genera un UUID/);
});
