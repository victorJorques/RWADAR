const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const {
  URL_VERSION_PUBLICADA, codigoNativoInstalado, validarVersionPublicada, consultarVersionPublicada,
  resumirActualizacion, textosActualizacion, crearComprobadorActualizaciones,
} = require('../lib/actualizaciones-app');

const APK = v => `https://github.com/victorJorques/RWAdar-downloads/releases/download/v${v}/RWAdar.apk`;
const PUBLICADA = { plataforma: 'android', version: '1.4.2', versionCode: 24, apk: APK('1.4.2') };

function respuesta(cuerpo, { ok = true, longitud } = {}) {
  return { ok, headers: { get: nombre => (nombre === 'content-length' && longitud != null ? String(longitud) : null) },
    async text() { return typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo); } };
}

test('el código nativo instalado sale del runtime nativeVersion y nada más', () => {
  assert.equal(codigoNativoInstalado('1.4.1(23)'), 23);
  for (const malo of [null, '', '1.4.1', '1.4.1(23) ', 'x1.4.1(23)', '1.4(23)', 'abc(23)']) {
    assert.equal(codigoNativoInstalado(malo), null, String(malo));
  }
});

test('solo se acepta un APK de la página de descargas de RWAdar con la misma versión', () => {
  assert.deepEqual(validarVersionPublicada({ ...PUBLICADA, extra: 'ignorado' }),
    { version: '1.4.2', versionCode: 24, apk: APK('1.4.2') });
  for (const malo of [
    null, [], 'texto', { ...PUBLICADA, plataforma: 'ios' }, { ...PUBLICADA, version: '1.4' },
    { ...PUBLICADA, versionCode: '24' }, { ...PUBLICADA, versionCode: 24.5 }, { ...PUBLICADA, versionCode: 0 },
    { ...PUBLICADA, apk: APK('1.4.3') }, { ...PUBLICADA, apk: APK('1.4.2').replace('https:', 'http:') },
    { ...PUBLICADA, apk: 'https://github.com/otro/RWAdar-downloads/releases/download/v1.4.2/RWAdar.apk' },
    { ...PUBLICADA, apk: `${APK('1.4.2')}?x=1` }, { ...PUBLICADA, apk: 'https://evil.example/RWAdar.apk' },
  ]) assert.equal(validarVersionPublicada(malo), null, JSON.stringify(malo));
});

test('la consulta pide la última versión sin credenciales y descarta respuestas dudosas', async () => {
  const pedidas = [];
  const fetchImpl = async (url, opciones) => { pedidas.push({ url, opciones }); return respuesta(PUBLICADA); };
  assert.deepEqual(await consultarVersionPublicada({ fetchImpl }), validarVersionPublicada(PUBLICADA));
  assert.equal(pedidas[0].url, URL_VERSION_PUBLICADA);
  assert.equal(pedidas[0].opciones.credentials, 'omit');
  assert.equal(pedidas[0].opciones.cache, 'no-store');
  for (const fetchMalo of [
    async () => respuesta(PUBLICADA, { ok: false }),
    async () => respuesta(PUBLICADA, { longitud: 5000 }),
    async () => respuesta('x'.repeat(5000)),
    async () => respuesta('{no es json'),
    async () => respuesta({ ...PUBLICADA, apk: 'https://evil.example/RWAdar.apk' }),
    async () => { throw new Error('sin red'); },
  ]) assert.equal(await consultarVersionPublicada({ fetchImpl: fetchMalo }), null);
});

test('una consulta colgada se corta por plazo y no deja la app esperando', async () => {
  const fetchImpl = (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('abortada')));
  });
  assert.equal(await consultarVersionPublicada({ fetchImpl, plazoMs: 20 }), null);
});

test('el aviso prioriza la mejora descargada y solo ofrece APK si su código es mayor', () => {
  const version = validarVersionPublicada(PUBLICADA);
  assert.equal(resumirActualizacion({ mejoraLista: true, versionPublicada: version, codigoInstalado: 23 }).tipo, 'mejora');
  assert.deepEqual(resumirActualizacion({ versionPublicada: version, codigoInstalado: 23 }), { tipo: 'version', ...version });
  for (const codigoInstalado of [24, 25, null]) {
    assert.equal(resumirActualizacion({ versionPublicada: version, codigoInstalado }).tipo, 'reposo');
  }
  assert.equal(resumirActualizacion({ comprobando: true }).tipo, 'comprobando');
  assert.equal(resumirActualizacion({ resultado: 'al-dia' }).tipo, 'al-dia');
  assert.equal(resumirActualizacion({ resultado: 'error' }).tipo, 'error');
  assert.equal(resumirActualizacion({ resultado: 'otro' }).tipo, 'reposo');
});

test('cada estado tiene textos completos en español e inglés y nunca pide desinstalar', () => {
  const version = { tipo: 'version', version: '1.4.2', versionCode: 24, apk: APK('1.4.2') };
  for (const idioma of ['es', 'en']) {
    for (const resumen of [{ tipo: 'mejora' }, version, { tipo: 'comprobando' }, { tipo: 'al-dia' }, { tipo: 'error' }, { tipo: 'reposo' }]) {
      const t = textosActualizacion(resumen, { idioma, versionInstalada: '1.4.1' });
      assert.ok(t.titulo && t.detalle, `${idioma} ${resumen.tipo}`);
      if (resumen.tipo === 'mejora') assert.ok(t.aviso && t.boton && t.falloTitulo && t.fallo);
      if (resumen.tipo === 'version') {
        assert.ok(t.aviso.includes('1.4.2') && t.boton && t.confirmar && t.aceptar && t.cancelar);
        assert.match(t.confirmar, idioma === 'en' ? /Do not uninstall/ : /No desinstales/);
      }
    }
  }
  assert.match(textosActualizacion({ tipo: 'al-dia' }, { versionInstalada: '1.4.1' }).detalle, /^Versión 1\.4\.1\. /);
});

function updatesFalso(opciones = {}) {
  const llamadas = [];
  return { llamadas, updates: {
    async checkForUpdateAsync() { llamadas.push('comprobar'); if (opciones.falloComprobar) throw Error('red'); return { isAvailable: opciones.disponible !== false }; },
    async fetchUpdateAsync() { llamadas.push('descargar'); return { isNew: true }; },
    async reloadAsync() { llamadas.push('reiniciar'); if (opciones.falloReinicio) throw Error('no'); },
  } };
}

test('comprobar descarga la mejora y consulta la versión a la vez, sin reiniciar nunca', async () => {
  const { updates, llamadas } = updatesFalso();
  let consultas = 0;
  const c = crearComprobadorActualizaciones({ updates, consultarVersion: async () => { consultas++; return validarVersionPublicada(PUBLICADA); } });
  const [a, b] = await Promise.all([c.comprobar(), c.comprobar()]);
  assert.equal(a, b, 'dos pulsaciones seguidas comparten la misma comprobación');
  assert.deepEqual(a, { versionPublicada: validarVersionPublicada(PUBLICADA), resultado: 'al-dia' });
  assert.deepEqual(llamadas, ['comprobar', 'descargar']);
  assert.equal(consultas, 1);
  await c.comprobar();
  assert.equal(consultas, 2, 'terminada la anterior, se puede volver a comprobar');
});

test('«al día» solo si se pudieron consultar Expo y la página de descargas', async () => {
  const version = async () => validarVersionPublicada(PUBLICADA);
  const sinMejora = updatesFalso({ disponible: false });
  assert.equal((await crearComprobadorActualizaciones({ updates: sinMejora.updates, consultarVersion: version })
    .comprobar()).resultado, 'al-dia');
  assert.deepEqual(sinMejora.llamadas, ['comprobar'], 'sin mejora no descarga nada');
  assert.equal((await crearComprobadorActualizaciones({ updates: updatesFalso().updates,
    consultarVersion: async () => null }).comprobar()).resultado, 'error', 'GitHub caído o sin version-android.json');
  const sinRed = updatesFalso({ falloComprobar: true });
  assert.equal((await crearComprobadorActualizaciones({ updates: sinRed.updates, consultarVersion: version })
    .comprobar()).resultado, 'error', 'Expo caído');
});

test('fuera de Android no consulta ni ofrece APK; solo cuenta la mejora compatible', async () => {
  let consultas = 0;
  const consultarVersion = async () => { consultas++; return validarVersionPublicada(PUBLICADA); };
  const ok = await crearComprobadorActualizaciones({ updates: updatesFalso().updates, consultarVersion,
    conVersionAndroid: false }).comprobar();
  assert.deepEqual(ok, { versionPublicada: null, resultado: 'al-dia' });
  const mal = await crearComprobadorActualizaciones({ updates: updatesFalso({ falloComprobar: true }).updates,
    consultarVersion, conVersionAndroid: false }).comprobar();
  assert.equal(mal.resultado, 'error');
  assert.equal(consultas, 0);
});

test('aplicar la mejora reinicia una sola vez aunque se pulse dos veces; un fallo deja reintentar', async () => {
  const bien = updatesFalso();
  const c = crearComprobadorActualizaciones({ updates: bien.updates });
  assert.deepEqual(await Promise.all([c.aplicarMejora(), c.aplicarMejora()]), [true, true]);
  await c.aplicarMejora();
  assert.deepEqual(bien.llamadas, ['reiniciar']);
  const mal = updatesFalso({ falloReinicio: true });
  const c2 = crearComprobadorActualizaciones({ updates: mal.updates });
  assert.equal(await c2.aplicarMejora(), false);
  assert.equal(await c2.aplicarMejora(), false);
  assert.deepEqual(mal.llamadas, ['reiniciar', 'reiniciar']);
});

function cargarAviso(idioma = 'es') {
  const React = { createElement(tipo, props, ...children) {
    return { tipo: typeof tipo === 'function' ? tipo.name : tipo, props: props || {}, children };
  } };
  const mocks = {
    react: React,
    'react-native': { StyleSheet: { create: valor => valor, hairlineWidth: 1 } },
    './Idioma': { Pressable: 'Pressable', Text: 'Text', View: 'View', useIdioma: () => idioma },
    '../lib/actualizaciones-app': { textosActualizacion },
    '../lib/tema': { C: {}, F: {}, R: {}, T: {} },
  };
  const ruta = path.join(__dirname, '../componentes/AvisoActualizacion.js');
  const codigo = babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false,
    plugins: [require('@babel/plugin-transform-modules-commonjs'), require('@babel/plugin-transform-react-jsx')] }).code;
  const modulo = { exports: {} };
  new Function('module', 'exports', 'require', codigo)(modulo, modulo.exports, nombre => {
    assert.ok(Object.hasOwn(mocks, nombre), nombre); return mocks[nombre];
  });
  return modulo.exports.default;
}
const nodos = a => (a == null || typeof a !== 'object' ? [] : Array.isArray(a) ? a.flatMap(nodos) : [a, ...nodos(a.children)]);
const texto = a => (a == null || typeof a === 'boolean' ? '' : Array.isArray(a) ? a.map(texto).join(' ')
  : typeof a === 'object' ? texto(a.children) : String(a));

test('el aviso solo aparece con algo que aplicar y sus dos botones llaman a lo suyo', () => {
  const Aviso = cargarAviso();
  for (const tipo of ['reposo', 'comprobando', 'al-dia', 'error']) assert.equal(Aviso({ resumen: { tipo } }), null);
  const pulsado = [];
  const arbol = Aviso({ resumen: { tipo: 'version', version: '1.4.2', versionCode: 24, apk: APK('1.4.2') },
    onActualizar: () => pulsado.push('actualizar'), onOcultar: () => pulsado.push('ocultar') });
  assert.match(texto(arbol), /Nueva versión 1\.4\.2/);
  assert.match(texto(arbol), /Actualizar/);
  const botones = nodos(arbol).filter(n => n.tipo === 'Pressable');
  assert.deepEqual(botones.map(b => b.props.accessibilityLabel), ['Actualizar a la versión 1.4.2', 'Ocultar aviso']);
  botones.forEach(b => b.props.onPress());
  assert.deepEqual(pulsado, ['actualizar', 'ocultar']);
  assert.match(texto(cargarAviso('en')({ resumen: { tipo: 'mejora' } })), /An improvement is ready.*Apply/s);
});

test('la app conecta aviso, Perfil y descarga sin permisos nativos nuevos', () => {
  const app = fs.readFileSync(path.join(__dirname, '../App.js'), 'utf8');
  assert.match(app, /const actualizacion = useEstadoActualizaciones\(\);/);
  assert.match(app, /<AvisoActualizacion resumen=\{actualizacion\.resumen\} onActualizar=\{actualizarApp\}/);
  assert.match(app, /<AccesoObligatorio [^>]*aviso=\{avisoActualizacion\}/, 'también sin sesión: la versión nueva puede arreglar el acceso');
  assert.match(app, /\{MODO_LOCAL \? <BannerModoLocal \/> : null\}\s+\{avisoActualizacion\}/);
  assert.match(app, /onActualizarApp=\{actualizarApp\}/);
  assert.match(app, /<PreparandoAcceso [^/]*?aviso=\{avisoActualizacion\} \/>/);
  assert.match(app, /<BloqueoApp [^/]*?aviso=\{avisoActualizacion\} \/>/);
  assert.match(app, /function PreparandoAcceso\([^)]*aviso = null[^)]*\) \{\s+return <SafeAreaView[^>]*>\s+\{aviso\}/);
  for (const archivo of ['AccesoObligatorio.js', 'BloqueoApp.js']) {
    const fuente = fs.readFileSync(path.join(__dirname, '../componentes', archivo), 'utf8');
    assert.match(fuente, /aviso = null/, archivo);
    assert.match(fuente, /edges=\{\['top', 'right', 'bottom', 'left'\]\}>\s+\{aviso\}/, archivo);
  }
  assert.match(app, /onPress: \(\) => abrirEnlace\(resumen\.apk\)/, 'el APK se abre solo tras confirmar y por la vía HTTPS validada');
  assert.doesNotMatch(app, /reloadAsync/, 'reiniciar pasa siempre por aplicarMejora');
  assert.match(app, /Actualizaciones de la app/);
  const { expo } = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  assert.ok(!(expo.android.permissions || []).includes('android.permission.REQUEST_INSTALL_PACKAGES'));
});
