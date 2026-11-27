'use strict';

/* «Novedades de RWAdar» al abrir la app (12/11/2026). Encargo: «que salga al
   abrir la app y como las novedades, tipo un texto informativo muy fácil de
   leer con las novedades y si clickan que salga en detalle».
   Sin red, Expo ni almacenamiento real: el módulo con un fetch simulado, lo
   visto en lib/datos.js con un AsyncStorage en memoria, el hook y las dos
   pantallas con un React aislado (como avisos-ui.test.cjs), y los textos en
   inglés del diccionario común. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('@babel/core');
const commonjs = require('@babel/plugin-transform-modules-commonjs');
const jsx = require('@babel/plugin-transform-react-jsx');
const { soporteIdioma } = require('./soporte-idioma.cjs');
const idioma = require('../lib/idioma');
const en = require('../lib/idioma-en');
const n = require('../lib/novedades-rwadar');
const { NOVEDADES_PRODUCTO } = require('../lib/novedades-producto');

const RAIZ = path.resolve(__dirname, '..');
const leer = (...r) => fs.readFileSync(path.join(RAIZ, ...r), 'utf8');
const JSON_WEB = path.join(RAIZ, '..', 'rwadar-site', 'datos', 'novedades-producto.json');
const copia = (o) => JSON.parse(JSON.stringify(o));
const esperar = (ms = 2) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------------
   La copia incluida, el ejemplo y el JSON de la web
   --------------------------------------------------------------------- */
test('novedades · la copia incluida es válida, igual al archivo de ejemplo y con 4-5 puntos de una línea en los dos idiomas', () => {
  const ejemplo = JSON.parse(leer('fixtures', 'novedades-producto.ejemplo.json'));
  assert.deepEqual(NOVEDADES_PRODUCTO, ejemplo, 'lib/novedades-producto.js y fixtures/novedades-producto.ejemplo.json no coinciden');
  const datos = n.validarNovedadesProducto(NOVEDADES_PRODUCTO);
  assert.deepEqual(n.RESPALDO, datos);
  assert.equal(datos.version, '2026-11-14.4');
  assert.equal(datos.titulo, 'Novedades de RWAdar');
  assert.ok(datos.resumen.length >= 4 && datos.resumen.length <= 5, 'entre 4 y 5 puntos');
  for (const p of datos.resumen) {
    for (const t of [p.titulo, p.texto, p.en.titulo, p.en.texto]) assert.ok(!/[.!?].+[.!?].+[.!?]/.test(t), `más de una línea: ${t}`);
  }
  // Lo nuevo del 14/11, dicho en el resumen: el mercado en directo y las noticias con foto; y siguen los avisos y la calculadora.
  const todo = JSON.stringify(datos.resumen);
  for (const x of ['cada 5 minutos', 'con su foto', 'sin cuenta', 'Perfil › Avisos', 'Calcula tus números', 'Mercado y noticias']) {
    assert.ok(todo.includes(x), `falta en el resumen: ${x}`);
  }
  // Sin promesas de rentabilidad.
  assert.doesNotMatch(JSON.stringify(datos), /garantiz|asegurad|sin riesgo|guaranteed|risk-free/i);
});

test('novedades · el JSON de la web lo acepta la app y la copia incluida dice lo mismo (obligatorio)', () => {
  assert.ok(fs.existsSync(JSON_WEB), 'falta rwadar-site/datos/novedades-producto.json: la app y la web leen el mismo archivo');
  const texto = fs.readFileSync(JSON_WEB, 'utf8');
  const web = JSON.parse(texto);
  assert.doesNotThrow(() => n.validarNovedadesProducto(web), 'la app rechazaría el JSON que publica la web');
  assert.ok(texto.length <= n.MAX_CARACTERES);
  const aviso = 'La copia de la app no es la de la web: ejecuta node rwadar-novedades-producto.js en la raíz';
  assert.deepEqual(NOVEDADES_PRODUCTO, web, aviso);
  assert.equal(leer('fixtures', 'novedades-producto.ejemplo.json'), texto, aviso);
  const sincronizar = require(path.join(RAIZ, '..', 'rwadar-novedades-producto.js'));
  assert.deepEqual(sincronizar.diferencias(), [], aviso);
});

/* Lo que dice la ventana tiene que ser cierto también en la app: la campana
   y la casilla «Mantener la sesión iniciada» solo existen en la web, y cada
   etiqueta entre «» del resumen que no diga «en la web» tiene que existir en
   la app (revisión del 12/11/2026). */
test('novedades · el texto común es cierto en la app: lo que solo está en la web lo dice, y las etiquetas «» existen en la app', () => {
  const fuentes = [leer('App.js'), ...fs.readdirSync(path.join(RAIZ, 'componentes'))
    .filter((f) => f.endsWith('.js') && f !== 'NovedadesRwadar.js').map((f) => leer('componentes', f))].join('\n');
  const soloWeb = /campana|Mantener la sesión|\bbell\b|Keep me signed in/i;
  const enLaWeb = /en la web|on the website/i;
  const revisar = (contexto, textos) => {
    for (const t of textos) {
      if (soloWeb.test(t)) assert.match(`${contexto} ${t}`, enLaWeb, `solo vale en la web y no lo dice: ${t}`);
    }
  };
  for (const p of NOVEDADES_PRODUCTO.resumen) {
    revisar(p.titulo, [p.texto]);
    revisar(p.en.titulo, [p.en.texto]);
    if (enLaWeb.test(`${p.titulo} ${p.texto}`)) continue;
    for (const [, etiqueta] of `${p.titulo} ${p.texto}`.matchAll(/«([^»]+)»/g)) {
      if (/^\d+$/.test(etiqueta)) continue; // «1»: el número, no una etiqueta.
      assert.ok(fuentes.includes(etiqueta), `la app no tiene «${etiqueta}» (resumen ${p.id})`);
    }
  }
  for (const s of NOVEDADES_PRODUCTO.detalle) {
    revisar(s.titulo, [...s.parrafos, ...s.pasos]);
    revisar(s.en.titulo, [...s.en.parrafos, ...s.en.pasos]);
  }
  // Lo que la revisión vio mal: el botón de la web en el paso de la app y Android solo en la app.
  const avisos = NOVEDADES_PRODUCTO.detalle.find((s) => s.id === 'avisos-movil');
  assert.ok(avisos.pasos.some((p) => p.includes('«Notificaciones en este móvil»')) && fuentes.includes('Notificaciones en este móvil'));
  // Desde la 2026-11-14.3 (sin cuenta), «Activar notificaciones en este móvil» es también el botón de la app (pantalla de acceso).
  assert.ok(avisos.pasos.some((p) => /«Activar notificaciones en este móvil»/.test(p)) && fuentes.includes('Activar notificaciones en este móvil'));
  assert.ok(!avisos.pasos.some((p) => /Entra en tu cuenta/.test(p)), 'no hace falta cuenta');
  assert.ok(avisos.pasos.some((p) => /No hace falta cuenta/.test(p)));
  assert.match(avisos.parrafos.join(' '), /En Android, puedes hacerlo en la app de RWAdar o en la web/);
});

/* ---------------------------------------------------------------------
   Forma estricta: lo que no cuadra se ignora
   --------------------------------------------------------------------- */
test('novedades · un JSON malo se rechaza: claves de más o de menos, HTML, textos largos, versión, ids, iconos e inglés incompleto', () => {
  const malos = {
    'clave de más': (d) => { d.extra = 1; },
    'sin inglés del título': (d) => { delete d.en; },
    'punto sin inglés': (d) => { delete d.resumen[0].en; },
    'punto con clave de más': (d) => { d.resumen[0].enlace = 'https://ejemplo.test'; },
    'HTML en un texto': (d) => { d.resumen[0].texto = '<b>hola</b>'; },
    'salto de línea': (d) => { d.detalle[0].parrafos[0] = 'una\nlínea'; },
    'texto vacío': (d) => { d.titulo = ' '; },
    'espacios sobrantes': (d) => { d.resumen[1].titulo += ' '; },
    'punto demasiado largo': (d) => { d.resumen[0].texto = 'a'.repeat(121); },
    'párrafo demasiado largo': (d) => { d.detalle[0].parrafos[0] = 'a'.repeat(421); },
    'sin puntos': (d) => { d.resumen = []; },
    'siete puntos': (d) => { d.resumen = Array.from({ length: 7 }, (_, i) => ({ ...d.resumen[0], id: `p${i}` })); },
    'id repetido': (d) => { d.resumen[1].id = d.resumen[0].id; },
    'id con mayúsculas': (d) => { d.detalle[0].id = 'Avisos'; },
    'icono raro': (d) => { d.resumen[0].icono = '<svg>'; },
    'versión sin fecha': (d) => { d.version = 'hoy'; },
    'fecha imposible': (d) => { d.version = '2026-02-30'; },
    'inglés con un párrafo menos': (d) => { d.detalle[0].en.parrafos.pop(); },
    'inglés con un paso de más': (d) => { d.detalle[0].en.pasos.push('Extra step.'); },
    'pasos que no son lista': (d) => { d.detalle[0].pasos = 'Entra'; },
    'número en vez de texto': (d) => { d.resumen[0].titulo = 5; },
  };
  for (const [caso, romper] of Object.entries(malos)) {
    const d = copia(NOVEDADES_PRODUCTO);
    romper(d);
    assert.throws(() => n.validarNovedadesProducto(d), Error, caso);
    assert.equal(n.novedadesValidas(d), null, caso);
  }
  for (const raro of [null, [], 'texto', 42]) assert.throws(() => n.validarNovedadesProducto(raro));
  // Lo que sí vale: otra del mismo día y un icono que la app no dibuja (sale el genérico).
  const bien = copia(NOVEDADES_PRODUCTO);
  bien.version = '2026-11-12.2'; bien.resumen[0].icono = 'cohete';
  assert.equal(n.validarNovedadesProducto(bien).resumen[0].icono, 'cohete');
});

test('novedades · versiones: por fecha y, el mismo día, por el número de después del punto', () => {
  assert.ok(n.compararVersiones('2026-11-12', '2026-11-13') < 0);
  assert.ok(n.compararVersiones('2026-11-12.2', '2026-11-12') > 0);
  assert.ok(n.compararVersiones('2026-12-01', '2026-11-30.9') > 0);
  assert.equal(n.compararVersiones('2026-11-12', '2026-11-12'), 0);
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, null), true, 'sin ninguna vista, sale');
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, 'basura'), true);
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, '2026-11-14.4'), false, 'ya vista, no sale');
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, '2026-11-14.2'), true, 'quien vio la 14.2 la vuelve a ver: el recuadro arriba y los avisos sin cuenta');
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, '2026-11-14'), true, 'quien vio la del 14/11 la vuelve a ver, con el recuadro de los avisos');
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, '2026-11-20'), false, 'sin red, una copia más vieja que la vista no vuelve a salir');
  assert.equal(n.hayNovedadesSinVer(n.RESPALDO, '2026-11-11'), true);
  for (const v of ['2025-12-31', '2026-13-01', '2026-11-12.', '2026-11-12.123', ' 2026-11-12']) assert.equal(n.versionValida(v), false, v);
});

/* ---------------------------------------------------------------------
   Descarga: con plazo, solo JSON, sin cookies; si falla, la copia incluida
   --------------------------------------------------------------------- */
function respuesta(cuerpo, { status = 200, tipo = 'application/json; charset=utf-8', largo } = {}) {
  const cabeceras = { 'content-type': tipo, ...(largo != null ? { 'content-length': String(largo) } : {}) };
  let leida = false;
  return { ok: status >= 200 && status < 300, status, headers: { get: (k) => cabeceras[k.toLowerCase()] ?? null },
    async text() { leida = true; return cuerpo; }, get leida() { return leida; } };
}
const nueva = () => { const d = copia(NOVEDADES_PRODUCTO); d.version = '2026-11-20'; d.titulo = 'Más novedades de RWAdar'; return d; };

test('novedades · descarga: pide el JSON de la web sin cookies ni sesión y se queda con la versión más nueva', async () => {
  const pedidas = [];
  const r = await n.cargarNovedadesProducto({ fetchImpl: async (url, opciones) => { pedidas.push([url, opciones]); return respuesta(JSON.stringify(nueva())); } });
  assert.equal(r.origen, 'web');
  assert.equal(r.datos.version, '2026-11-20');
  assert.equal(r.datos.titulo, 'Más novedades de RWAdar');
  assert.equal(pedidas.length, 1);
  const [url, opciones] = pedidas[0];
  assert.equal(url, 'https://rwadar.pages.dev/datos/novedades-producto.json');
  assert.equal(opciones.method, 'GET');
  assert.equal(opciones.credentials, 'omit');
  assert.deepEqual(opciones.headers, { Accept: 'application/json' });
  assert.ok(opciones.signal, 'con señal para cortar a tiempo');

  // La misma versión que la copia: vale la de la web; una más vieja, no.
  assert.equal((await n.cargarNovedadesProducto({ fetchImpl: async () => respuesta(JSON.stringify(NOVEDADES_PRODUCTO)) })).origen, 'web');
  const vieja = copia(NOVEDADES_PRODUCTO); vieja.version = '2026-11-01';
  const r2 = await n.cargarNovedadesProducto({ fetchImpl: async () => respuesta(JSON.stringify(vieja)) });
  assert.equal(r2.origen, 'respaldo');
  assert.equal(r2.datos.version, '2026-11-14.4');
});

test('novedades · sin red, con HTML, demasiado grande, error del servidor, plazo vencido o JSON malo: la copia incluida', async () => {
  const casos = {
    'sin red': async () => { throw new TypeError('Network request failed'); },
    'HTML de la web': async () => respuesta('<!doctype html><title>RWAdar</title>', { tipo: 'text/html; charset=utf-8' }),
    'HTML sin tipo': async () => respuesta('<!doctype html><title>RWAdar</title>', { tipo: '' }),
    'no es JSON': async () => respuesta('{"version": ', {}),
    'JSON con forma rara': async () => respuesta(JSON.stringify({ ...NOVEDADES_PRODUCTO, version: '2026-11-30', extra: true })),
    'servidor con error': async () => respuesta('', { status: 404 }),
    'demasiado grande': async () => respuesta(`{"x":"${'a'.repeat(n.MAX_CARACTERES)}"}`),
  };
  for (const [caso, fetchImpl] of Object.entries(casos)) {
    const r = await n.cargarNovedadesProducto({ fetchImpl });
    assert.equal(r.origen, 'respaldo', caso);
    assert.deepEqual(r.datos, n.RESPALDO, caso);
    assert.ok(r.error, caso);
  }
  // Si anuncia un tamaño imposible, ni se lee.
  const grande = respuesta('{}', { largo: n.MAX_CARACTERES * 3 + 1 });
  assert.equal((await n.cargarNovedadesProducto({ fetchImpl: async () => grande })).origen, 'respaldo');
  assert.equal(grande.leida, false);
  // Un servidor que no contesta: a los plazoMs se deja de esperar, aunque el fetch ignore la señal.
  const antes = Date.now();
  const lenta = await n.cargarNovedadesProducto({ plazoMs: 40, fetchImpl: () => new Promise(() => {}) });
  assert.equal(lenta.origen, 'respaldo');
  assert.match(lenta.error, /plazo/);
  assert.ok(Date.now() - antes < 1000);
  // Y uno que manda las cabeceras pero no termina el cuerpo, igual.
  const cuerpoLento = await n.cargarNovedadesProducto({ plazoMs: 40, fetchImpl: async () => ({ ...respuesta(''), text: () => new Promise(() => {}) }) });
  assert.equal(cuerpoLento.origen, 'respaldo');
});

/* ---------------------------------------------------------------------
   Lo ya visto, en el móvil (lib/datos.js)
   --------------------------------------------------------------------- */
function datosConAlmacen(inicial = {}, fallos = {}) {
  const mapa = new Map(Object.entries(inicial));
  const storage = {
    async getItem(k) { if (fallos.leer) throw new Error('almacenamiento bloqueado'); return mapa.has(k) ? mapa.get(k) : null; },
    async setItem(k, v) { if (fallos.escribir) throw new Error('almacenamiento lleno'); mapa.set(k, v); },
    async getAllKeys() { return [...mapa.keys()]; },
    async multiRemove(keys) { keys.forEach((k) => mapa.delete(k)); },
    async removeItem(k) { mapa.delete(k); },
  };
  const lib = path.join(RAIZ, 'lib') + path.sep;
  const archivo = path.join(lib, 'datos.js');
  const original = Module._load, extension = Module._extensions['.js'];
  Module._load = function (pedido, padre, principal) {
    if (pedido === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
    if (pedido === 'react-native') return { Platform: { OS: 'android' } };
    if (padre?.filename === archivo && pedido === './modo-local') return { SERVICIOS_USUARIO_REMOTOS: false };
    if (padre?.filename === archivo && pedido === './supabase') return {};
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (!ruta.startsWith(lib)) return extension(modulo, ruta);
    modulo._compile(babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [commonjs] }).code, ruta);
  };
  for (const clave of Object.keys(require.cache)) if (clave.startsWith(lib)) delete require.cache[clave];
  try { return { datos: require(archivo), mapa }; } finally {
    Module._load = original; Module._extensions['.js'] = extension;
    for (const clave of Object.keys(require.cache)) if (clave.startsWith(lib)) delete require.cache[clave];
  }
}
const CLAVE_VISTA = 'rwadar.editorial.novedades.vista.v2';
const CLAVE_VISTA_V1 = 'rwadar.editorial.novedades.vista.v1';

test('novedades · lo visto se guarda en el móvil por versión, nunca baja a una anterior y se borra con los datos del dispositivo', async () => {
  const { datos, mapa } = datosConAlmacen({ 'otra.app': 'conservar' });
  assert.deepEqual(await datos.leerNovedadesVistas(), { ok: true, version: null });
  assert.equal(await datos.marcarNovedadesVistas('2026-11-12'), true);
  assert.equal(mapa.get(CLAVE_VISTA), '2026-11-12');
  assert.deepEqual(await datos.leerNovedadesVistas(), { ok: true, version: '2026-11-12' });
  // Una copia más vieja (sin red) no rebaja lo visto; una nueva sí lo sube.
  assert.equal(await datos.marcarNovedadesVistas('2026-11-01'), true);
  assert.equal(mapa.get(CLAVE_VISTA), '2026-11-12');
  assert.equal(await datos.marcarNovedadesVistas('2026-11-12.2'), true);
  assert.equal(mapa.get(CLAVE_VISTA), '2026-11-12.2');
  // También en la clave antigua, por si se vuelve a una versión anterior de la app.
  assert.equal(mapa.get(CLAVE_VISTA_V1), '2026-11-12.2');
  // Solo una versión, nada más: ni datos de la persona ni basura.
  assert.equal(await datos.marcarNovedadesVistas('<script>'), false);
  assert.equal(await datos.marcarNovedadesVistas({ correo: 'ana@ejemplo.test' }), false);
  assert.equal(mapa.get(CLAVE_VISTA), '2026-11-12.2');
  mapa.set(CLAVE_VISTA, 'basura');
  mapa.set(CLAVE_VISTA_V1, 'basura');
  assert.deepEqual(await datos.leerNovedadesVistas(), { ok: true, version: null });
  await datos.borrarDatosDispositivo();
  assert.equal(mapa.has(CLAVE_VISTA), false);
  assert.equal(mapa.has(CLAVE_VISTA_V1), false);
  assert.equal(mapa.get('otra.app'), 'conservar');
});

/* La OTA se aplica en el arranque siguiente: el primero aún corre la versión
   vieja (sin el recuadro), que pudo enseñar la 2026-11-14.2 y darla por vista
   en la v1. Esa marca no cuenta: la ventana sale una vez más, con el recuadro. */
test('novedades · lo que una versión vieja de la app dio por visto desde la 2026-11-14.2 no cuenta: sale una vez más, con el recuadro', async () => {
  // Sin la v2, la v1 se respeta hasta antes del recuadro.
  for (const [v1, leida] of [['2026-11-12', '2026-11-12'], ['2026-11-14', '2026-11-14'], ['2026-11-14.2', '2026-11-14'], ['2026-11-20', '2026-11-14']]) {
    const { datos } = datosConAlmacen({ [CLAVE_VISTA_V1]: v1 });
    assert.deepEqual(await datos.leerNovedadesVistas(), { ok: true, version: leida }, v1);
  }
  // Con la v2, manda la v2.
  const conV2 = datosConAlmacen({ [CLAVE_VISTA_V1]: '2026-11-14.2', [CLAVE_VISTA]: '2026-11-14.2' });
  assert.deepEqual(await conV2.datos.leerNovedadesVistas(), { ok: true, version: '2026-11-14.2' });

  // De punta a punta, con el hook: la versión vieja la marcó vista en la v1.
  const { datos, mapa } = datosConAlmacen({ [CLAVE_VISTA_V1]: '2026-11-14.2' });
  const app = arrancar({ avisos: 'inactivos', vista: datos.leerNovedadesVistas, marcar: datos.marcarNovedadesVistas });
  let s = await app.asentar();
  assert.equal(s.ventana, true, 'sale una vez más');
  assert.equal(s.datos.version, '2026-11-14.4');
  assert.equal(s.recordarAvisos, true, 'ahora con el recuadro');
  s.entendido();
  s = await app.asentar();
  assert.equal(s.ventana, false);
  assert.equal(mapa.get(CLAVE_VISTA), '2026-11-14.4');
  assert.equal(mapa.get(CLAVE_VISTA_V1), '2026-11-14.4');
  app.desmontar();
  // En el arranque siguiente ya no sale.
  const otra = arrancar({ avisos: 'inactivos', vista: datos.leerNovedadesVistas, marcar: datos.marcarNovedadesVistas });
  assert.equal((await otra.asentar()).ventana, false);
  otra.desmontar();
});

test('novedades · si el móvil no deja leer o escribir, no se rompe nada (y sin leer, la ventana no sale sola)', async () => {
  const sinLeer = datosConAlmacen({}, { leer: true });
  assert.deepEqual(await sinLeer.datos.leerNovedadesVistas(), { ok: false, version: null });
  assert.equal(await sinLeer.datos.marcarNovedadesVistas('2026-11-12'), false);
  const sinEscribir = datosConAlmacen({}, { escribir: true });
  assert.equal(await sinEscribir.datos.marcarNovedadesVistas('2026-11-12'), false);
  assert.deepEqual(await sinEscribir.datos.leerNovedadesVistas(), { ok: true, version: null });
});

/* ---------------------------------------------------------------------
   El hook y las pantallas, con React aislado
   --------------------------------------------------------------------- */
const tema = { C: new Proxy({}, { get: (_, c) => `#${String(c)}` }), F: new Proxy({}, { get: (_, c) => String(c) }),
  T: new Proxy({}, { get: () => ({}) }), E: { e2: {} }, R: { s: 8, m: 12, l: 16, xl: 24, p: 999 },
  UI: { margen: 16, tactil: 48, boton: 48 }, pulsado: () => ({}) };
function nodos(arbol) {
  if (arbol == null || typeof arbol === 'boolean') return [];
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (typeof arbol !== 'object') return [arbol];
  return [arbol, ...nodos(arbol.children), ...nodos(arbol.props?.children)];
}
const textos = (arbol) => nodos(arbol).filter((x) => typeof x === 'string' || typeof x === 'number').map(String);
const porId = (arbol, id) => nodos(arbol).find((x) => x?.props?.testID === id);
const deTipo = (arbol, tipo) => nodos(arbol).filter((x) => x?.type === tipo);

function crearReact() {
  const slots = [], efectos = [], pendientes = [];
  let indice = 0, cambiado = false;
  const react = {
    createElement(tipo, props, ...children) {
      if (typeof tipo === 'function') return tipo({ ...props, children: children.length > 1 ? children : children[0] });
      return { type: tipo, props: props || {}, children };
    },
    Fragment: 'Fragment',
    forwardRef: (fn) => (props) => fn(props, null),
    useSyncExternalStore: (_s, leerEstado) => leerEstado(),
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
      if (!efectos[i] || !deps || deps.some((v, j) => !Object.is(v, efectos[i].deps[j]))) {
        pendientes.push(() => { efectos[i]?.limpiar?.(); efectos[i] = { deps, limpiar: fn() }; });
      }
    },
  };
  return {
    react,
    pintar(render) {
      for (let vueltas = 0; vueltas < 20; vueltas++) {
        indice = 0; cambiado = false;
        const salida = render();
        while (pendientes.length) pendientes.shift()();
        if (!cambiado) return salida;
      }
      throw new Error('el componente no se estabiliza');
    },
    desmontar() { for (const e of efectos) e?.limpiar?.(); },
  };
}
function cargarComponente(react) {
  const absoluto = path.join(RAIZ, 'componentes', 'NovedadesRwadar.js');
  const original = Module._load, extension = Module._extensions['.js'];
  const nativo = { StyleSheet: { create: (s) => s }, Modal: 'Modal' };
  for (const tipo of ['Text', 'View', 'Pressable', 'ScrollView']) nativo[tipo] = tipo;
  const tactos = [];
  Module._load = function (pedido, padre, principal) {
    if (padre?.filename === absoluto) {
      if (pedido === './Idioma') return soporteIdioma(react, nativo);
      if (pedido === 'react') return react;
      if (pedido === 'react-native') return nativo;
      // Barra de estado de 24 y barra de 3 botones de 48 (Android).
      if (pedido === 'react-native-safe-area-context') return { SafeAreaProvider: 'SafeAreaProvider', SafeAreaView: 'SafeAreaView',
        useSafeAreaInsets: () => ({ top: 24, bottom: 48, left: 0, right: 0 }) };
      if (pedido === 'react-native-svg') return { __esModule: true, default: 'Svg', Path: 'Path' };
      if (pedido === './Navegacion') return { Icono: () => null };
      if (pedido === '../lib/tema') return tema;
      if (pedido === '../lib/tacto') return { tacto: { abrir() { tactos.push('abrir'); }, eleccion() { tactos.push('eleccion'); } } };
      if (pedido === '../lib/novedades-rwadar') return n;
    }
    return original.call(this, pedido, padre, principal);
  };
  Module._extensions['.js'] = function (modulo, ruta) {
    if (ruta !== absoluto) return extension(modulo, ruta);
    const { code } = babel.transformSync(fs.readFileSync(ruta, 'utf8'), { filename: ruta, babelrc: false, configFile: false, plugins: [jsx, commonjs] });
    modulo._compile(code, ruta);
  };
  delete require.cache[absoluto];
  try { return { modulo: require(absoluto), tactos }; } finally { Module._load = original; Module._extensions['.js'] = extension; }
}

/* El hook, como lo usa App: cada «arranque» es un hook nuevo con su almacén. */
function arrancar({ vista = { ok: true, version: null }, cargar = async () => ({ datos: n.RESPALDO, origen: 'respaldo' }), listo = true,
  avisos = 'inactivos', esperaAvisosMs = 10000, marcar = null } = {}) {
  const h = crearReact();
  const { modulo } = cargarComponente(h.react);
  const marcadas = [];
  const estado = { listo, avisos };
  const pintar = () => h.pintar(() => modulo.useNovedadesRwadar({ listo: estado.listo, esperaMs: 0, cargar, avisos: estado.avisos, esperaAvisosMs,
    leerVista: typeof vista === 'function' ? vista : async () => vista, marcarVista: async (v) => { marcadas.push(v); return marcar ? marcar(v) : true; } }));
  return {
    marcadas, estado, pintar, desmontar: h.desmontar,
    async asentar() { let s; for (let i = 0; i < 6; i++) { s = pintar(); await esperar(); } return pintar(); },
  };
}

test('novedades · la ventana sale una vez por versión al abrir la app, cuando ya se ve Inicio', async () => {
  const app = arrancar();
  let s = await app.asentar();
  assert.equal(s.ventana, true, 'sale');
  assert.equal(s.detalle, false);
  assert.equal(s.datos.version, '2026-11-14.4');
  // «Entendido» la cierra y guarda la versión vista.
  s.entendido();
  s = await app.asentar();
  assert.equal(s.ventana, false);
  assert.deepEqual(app.marcadas, ['2026-11-14.4']);
  // En la misma sesión no vuelve a salir.
  s = await app.asentar();
  assert.equal(s.ventana, false);
  app.desmontar();
  // Al volver a abrir la app con esa versión vista, tampoco.
  const otra = arrancar({ vista: { ok: true, version: '2026-11-14.4' } });
  assert.equal((await otra.asentar()).ventana, false);
  assert.deepEqual(otra.marcadas, []);
  otra.desmontar();
  // Con una versión nueva en la web, sí.
  const mas = arrancar({ vista: { ok: true, version: '2026-11-14.4' }, cargar: async () => ({ datos: n.validarNovedadesProducto(nueva()), origen: 'web' }) });
  s = await mas.asentar();
  assert.equal(s.ventana, true);
  assert.equal(s.datos.version, '2026-11-20');
  mas.desmontar();
});

test('novedades · no sale encima de otra cosa: espera a que se vea Inicio (acceso, bloqueo, carga, fichas o explicador)', async () => {
  const app = arrancar({ listo: false });
  let s = await app.asentar();
  assert.equal(s.ventana, false, 'con otra pantalla o diálogo delante, espera');
  app.estado.listo = true;
  s = await app.asentar();
  assert.equal(s.ventana, true, 'en cuanto Inicio queda libre, sale');
  app.desmontar();
  // Con «Mercado y noticias» abierta desde Inicio (App pone listo=false), espera; al cerrarla, sale.
  const conPantalla = arrancar({ listo: false });
  assert.equal((await conPantalla.asentar()).ventana, false, 'con una pantalla de Inicio encima, espera');
  await esperar(20);
  assert.equal((await conPantalla.asentar()).ventana, false, 'sigue esperando mientras la pantalla esté abierta');
  conPantalla.estado.listo = true;
  assert.equal((await conPantalla.asentar()).ventana, true, 'al cerrar la pantalla, sale');
  conPantalla.desmontar();
  // Mientras se lee lo visto o se descarga, tampoco sale.
  let soltar;
  const lenta = arrancar({ vista: () => new Promise((r) => { soltar = r; }) });
  assert.equal((await lenta.asentar()).ventana, false);
  soltar({ ok: true, version: null });
  assert.equal((await lenta.asentar()).ventana, true);
  lenta.desmontar();
});

test('novedades · «Ver en detalle» abre el detalle y cuenta como vista; desde Perfil se abre igual', async () => {
  const app = arrancar();
  let s = await app.asentar();
  assert.equal(s.ventana, true);
  s.verDetalle();
  s = await app.asentar();
  assert.equal(s.ventana, false);
  assert.equal(s.detalle, true);
  assert.deepEqual(app.marcadas, ['2026-11-14.4']);
  s.cerrarDetalle();
  s = await app.asentar();
  assert.equal(s.detalle, false);
  assert.equal(s.ventana, false, 'cerrar el detalle no vuelve a abrir la ventana');
  app.desmontar();
  // Desde Perfil, aunque ya se hayan visto, y antes de que salga sola.
  const perfil = arrancar({ vista: { ok: true, version: '2026-11-14.4' } });
  s = await perfil.asentar();
  s.verDetalle();
  s = await perfil.asentar();
  assert.equal(s.detalle, true);
  assert.equal(s.ventana, false);
  perfil.desmontar();
});

/* ---------------------------------------------------------------------
   El recuadro «Activa los avisos» (14/11/2026). Encargo: «que para activar
   las notificaciones salga el aviso al salir la notificación de novedades al
   entrar a la app, para recordar e incitar a la gente a que las activen».
   --------------------------------------------------------------------- */
test('novedades · avisos del móvil: lo que enseña Perfil › Avisos decide el recuadro; si no se sabe, sale', () => {
  const e = n.estadoAvisosMovil;
  const servidor = { novedades: true };
  assert.equal(e({ activo: true, servidor, movil: { estado: 'activo', activo: true } }), 'activos');
  // Activadas pero con el envío en pausa: no se insiste.
  assert.equal(e({ activo: true, servidor, movil: { estado: 'servicio-pendiente', activo: true } }), 'activos');
  // Con el permiso quitado en los ajustes no llegan: se recuerda.
  assert.equal(e({ activo: true, servidor, movil: { estado: 'sin-permiso', activo: true } }), 'inactivos');
  // Con «Avisos de novedades» apagado, el móvil solo recibe avisos de servicio: se recuerda.
  assert.equal(e({ activo: true, servidor: { novedades: false }, movil: { estado: 'activo', activo: true } }), 'inactivos');
  assert.equal(e({ activo: true, servidor: null, movil: { estado: 'activo', activo: true } }), 'inactivos');
  for (const estado of ['disponible', 'no-registrado', 'denegado', 'requiere-version', 'no-disponible', 'servicio-pendiente']) {
    assert.equal(e({ activo: true, servidor, movil: { estado, activo: false } }), 'inactivos', estado);
  }
  // Aún sin respuesta: se comprueba (la ventana espera un poco). Con un error o sin cuenta: no se sabe.
  assert.equal(e({ activo: true, movil: null, cargando: true }), 'comprobando');
  assert.equal(e({ activo: true, movil: null, cargando: false, errorCarga: '' }), 'comprobando');
  assert.equal(e({ activo: true, movil: null, errorCarga: 'No se pudo cargar.' }), 'desconocido');
  for (const raro of [undefined, null, {}, { activo: false, movil: { estado: 'activo', activo: true } }]) assert.equal(e(raro), 'desconocido');
  assert.equal(n.conRecordatorioAvisos('activos'), false);
  assert.equal(n.conRecordatorioAvisos('apagados'), false, 'sin los avisos en la app no hay Perfil › Avisos al que llevar');
  for (const estado of ['inactivos', 'desconocido', 'comprobando', undefined, 'basura']) assert.equal(n.conRecordatorioAvisos(estado), true, String(estado));
});

test('novedades · el recuadro sale sin avisos activos y no sale con ellos; «Activar avisos» la cierra y cuenta como vista', async () => {
  const app = arrancar({ avisos: 'inactivos' });
  let s = await app.asentar();
  assert.equal(s.ventana, true);
  assert.equal(s.recordarAvisos, true, 'sin notificaciones en este móvil, sale el recuadro');
  s.activarAvisos();
  s = await app.asentar();
  assert.equal(s.ventana, false, '«Activar avisos» la cierra');
  assert.equal(s.detalle, false);
  assert.deepEqual(app.marcadas, [n.RESPALDO.version], 'y cuenta como vista, como «Entendido»');
  s = await app.asentar();
  assert.equal(s.ventana, false, 'no vuelve a salir');
  app.desmontar();

  const activos = arrancar({ avisos: 'activos' });
  s = await activos.asentar();
  assert.equal(s.ventana, true, 'la ventana sale igual');
  assert.equal(s.recordarAvisos, false, 'con las notificaciones activas, sin recuadro');
  activos.desmontar();
  for (const [avisos, sale] of [['desconocido', true], ['apagados', false]]) {
    const otra = arrancar({ avisos });
    assert.equal((await otra.asentar()).recordarAvisos, sale, avisos);
    otra.desmontar();
  }
});

test('novedades · mientras se comprueban los avisos del móvil, la ventana espera (con un tope) para no recordárselo a quien ya los tiene', async () => {
  const app = arrancar({ avisos: 'comprobando' });
  let s = await app.asentar();
  assert.equal(s.ventana, false, 'espera a saberlo');
  app.estado.avisos = 'activos';
  s = await app.asentar();
  assert.equal(s.ventana, true, 'en cuanto se sabe, sale');
  assert.equal(s.recordarAvisos, false);
  app.desmontar();
  // Si la comprobación no termina, sale al cumplirse el tope, con el recuadro (no se sabe: mejor recordar).
  const lenta = arrancar({ avisos: 'comprobando', esperaAvisosMs: 5 });
  await esperar(20);
  s = await lenta.asentar();
  assert.equal(s.ventana, true);
  assert.equal(s.recordarAvisos, true);
  lenta.desmontar();
});

test('novedades · sin red sale la copia incluida; un JSON malo de la web se ignora; sin poder leer lo visto, no sale sola', async () => {
  const sinRed = arrancar({ cargar: () => n.cargarNovedadesProducto({ fetchImpl: async () => { throw new TypeError('Network request failed'); } }) });
  let s = await sinRed.asentar();
  assert.equal(s.ventana, true);
  assert.deepEqual(s.datos, n.RESPALDO);
  sinRed.desmontar();

  const malo = copia(NOVEDADES_PRODUCTO); malo.version = '2026-12-01'; malo.resumen[0].texto = '<img src=x onerror=alert(1)>';
  const conMalo = arrancar({ cargar: () => n.cargarNovedadesProducto({ fetchImpl: async () => respuesta(JSON.stringify(malo)) }) });
  s = await conMalo.asentar();
  assert.equal(s.datos.version, '2026-11-14.4', 'se queda con la copia incluida');
  assert.ok(!JSON.stringify(s.datos).includes('onerror'));
  conMalo.desmontar();

  // Una carga que falla del todo tampoco rompe: queda la copia incluida.
  const rota = arrancar({ cargar: async () => { throw new Error('inesperado'); } });
  s = await rota.asentar();
  assert.equal(s.ventana, true);
  assert.deepEqual(s.datos, n.RESPALDO);
  rota.desmontar();

  const sinAlmacen = arrancar({ vista: { ok: false, version: null } });
  s = await sinAlmacen.asentar();
  assert.equal(s.ventana, false, 'no se puede prometer «una vez»: no sale sola');
  s.verDetalle();
  assert.equal((await sinAlmacen.asentar()).detalle, true, 'sigue en Perfil');
  sinAlmacen.desmontar();
  const lecturaRota = arrancar({ vista: async () => { throw new Error('bloqueado'); } });
  assert.equal((await lecturaRota.asentar()).ventana, false);
  lecturaRota.desmontar();
});

function pantalla(componente, props) {
  const h = crearReact();
  const { modulo, tactos } = cargarComponente(h.react);
  return { modulo, tactos, arbol: h.pintar(() => modulo[componente](props)) };
}

test('novedades · la ventana: diálogo accesible con el título, los puntos (icono y una línea) y «Ver en detalle» y «Entendido»', () => {
  const llamadas = [];
  const { arbol, tactos } = pantalla('VentanaNovedades', { visible: true, datos: n.RESPALDO,
    onDetalle: () => llamadas.push('detalle'), onEntendido: () => llamadas.push('entendido') });
  const [modal] = deTipo(arbol, 'Modal');
  assert.equal(modal.props.visible, true);
  assert.equal(modal.props.transparent, true);
  const dialogo = porId(arbol, 'novedadesVentana');
  assert.equal(dialogo.props.role, 'dialog');
  assert.equal(dialogo.props['aria-modal'], true);
  assert.equal(dialogo.props.accessibilityViewIsModal, true);
  assert.equal(dialogo.props.accessibilityLabel, 'Novedades de RWAdar');
  // El Modal dibuja bajo las barras del móvil: el fondo deja 16 más que cada una.
  assert.equal(deTipo(arbol, 'SafeAreaProvider').length, 1);
  const fondo = porId(arbol, 'novedadesFondo');
  const estilo = Object.assign({}, ...[].concat(fondo.props.style));
  assert.equal(estilo.paddingTop, 24 + 16);
  assert.equal(estilo.paddingBottom, 48 + 16, '«Entendido» no queda pegado a la barra de 3 botones');
  assert.ok(estilo.paddingLeft >= 16 && estilo.paddingRight >= 16);
  assert.equal(modal.props.statusBarTranslucent, true);
  const cabecera = nodos(arbol).find((x) => x?.props?.accessibilityRole === 'header');
  assert.deepEqual(textos(cabecera), ['Novedades de RWAdar']);
  assert.ok(textos(arbol).includes('14 de noviembre de 2026'));
  for (const p of n.RESPALDO.resumen) {
    const punto = porId(arbol, `novedadPunto-${p.id}`);
    assert.ok(punto, `falta el punto ${p.id}`);
    assert.equal(punto.props.accessible, true);
    assert.equal(punto.props.accessibilityLabel, `${p.titulo}. ${p.texto}`, 'el lector de pantalla lo lee de una vez');
    assert.deepEqual(textos(punto), [p.titulo, p.texto]);
    assert.equal(deTipo(punto, 'Svg').length, 1, 'con su icono');
    assert.equal(deTipo(punto, 'Svg')[0].props.accessibilityElementsHidden, true, 'el icono no se lee');
  }
  const detalle = porId(arbol, 'novedadesVerDetalle'), entendido = porId(arbol, 'novedadesEntendido');
  assert.equal(detalle.props.accessibilityRole, 'button');
  assert.equal(detalle.props.accessibilityLabel, 'Ver en detalle');
  assert.deepEqual(textos(detalle), ['Ver en detalle']);
  assert.equal(entendido.props.accessibilityLabel, 'Entendido');
  assert.deepEqual(textos(entendido), ['Entendido']);
  detalle.props.onPress(); entendido.props.onPress();
  // Atrás en Android y Escape en la web cierran como «Entendido».
  modal.props.onRequestClose();
  assert.deepEqual(llamadas, ['detalle', 'entendido', 'entendido']);
  assert.deepEqual(tactos, ['abrir', 'eleccion']);
  // Sin recordarAvisos, no hay recuadro.
  assert.equal(porId(arbol, 'novedadesRecordatorio'), undefined);
  // Oculta, no pinta nada dentro.
  const oculta = pantalla('VentanaNovedades', { visible: false, datos: n.RESPALDO }).arbol;
  assert.equal(deTipo(oculta, 'Modal')[0].props.visible, false);
  assert.equal(porId(oculta, 'novedadesVentana'), undefined);
});

test('novedades · el recuadro «Activa los avisos»: arriba, antes de los puntos (2026-11-14.3), y su botón lleva a Perfil › Avisos', () => {
  const llamadas = [];
  const { arbol, tactos } = pantalla('VentanaNovedades', { visible: true, datos: n.RESPALDO, recordarAvisos: true,
    onDetalle: () => llamadas.push('detalle'), onEntendido: () => llamadas.push('entendido'), onActivarAvisos: () => llamadas.push('avisos') });
  const rec = porId(arbol, 'novedadesRecordatorio');
  assert.ok(rec, 'sale el recuadro');
  const [tit] = nodos(rec).filter((x) => x?.props?.accessibilityRole === 'header');
  assert.deepEqual(textos(tit), ['Activa los avisos']);
  assert.ok(textos(rec).includes('Recibe cada novedad en el móvil. Es gratis y puedes quitar los avisos cuando quieras.'));
  assert.equal(deTipo(rec, 'Svg').length, 1, 'con el icono de los avisos');
  const boton = porId(rec, 'novedadesActivarAvisos');
  assert.equal(boton.props.accessibilityRole, 'button');
  assert.equal(boton.props.accessibilityLabel, 'Activar avisos');
  assert.equal(boton.props.accessibilityHint, 'Cierra esta ventana y te lleva a Perfil › Avisos');
  assert.deepEqual(textos(boton), ['Activar avisos']);
  // Dentro de lo que se desplaza, ARRIBA (antes del primer punto: a la vista sin desplazar en 360 × 640);
  // los botones de abajo, fuera (siempre a la vista).
  const [desplazable] = deTipo(arbol, 'ScrollView');
  const dentro = nodos(desplazable);
  assert.ok(dentro.includes(rec), 'el recuadro se desplaza con los puntos');
  const primerPunto = porId(arbol, `novedadPunto-${n.RESPALDO.resumen[0].id}`);
  assert.ok(dentro.indexOf(rec) < dentro.indexOf(primerPunto), 'antes de los puntos');
  assert.ok(!dentro.includes(porId(arbol, 'novedadesEntendido')) && !dentro.includes(porId(arbol, 'novedadesVerDetalle')), 'los botones, fuera del desplazamiento');
  // Orden de lectura y de foco: «Activar avisos», «Ver en detalle», «Entendido».
  const orden = nodos(arbol).map((x) => x?.props?.testID).filter((id) => ['novedadesActivarAvisos', 'novedadesVerDetalle', 'novedadesEntendido'].includes(id));
  assert.deepEqual(orden, ['novedadesActivarAvisos', 'novedadesVerDetalle', 'novedadesEntendido']);
  // Botón de 48 de alto, a lo ancho.
  const estilo = Object.assign({}, ...boton.props.style({ pressed: false, focused: false }).filter(Boolean));
  assert.ok(estilo.minHeight >= 48 && estilo.alignSelf === 'stretch');
  boton.props.onPress();
  assert.deepEqual(llamadas, ['avisos']);
  assert.deepEqual(tactos, [], 'vibra en irAAvisosPerfil (App), no dos veces');
});

test('novedades · el detalle: cada sección con sus pasos numerados, el botón a Perfil › Avisos y las anteriores en la web', () => {
  const llamadas = [];
  const { arbol } = pantalla('PantallaNovedades', { visible: true, datos: n.RESPALDO,
    onCerrar: () => llamadas.push('cerrar'), onIrAvisos: () => llamadas.push('avisos'), onHistorial: () => llamadas.push('web') });
  const [modal] = deTipo(arbol, 'Modal');
  assert.equal(modal.props.presentationStyle, 'fullScreen');
  const todo = textos(arbol);
  for (const s of n.RESPALDO.detalle) {
    const seccion = porId(arbol, `novedadSeccion-${s.id}`);
    assert.ok(seccion, s.id);
    const [tit] = nodos(seccion).filter((x) => x?.props?.accessibilityRole === 'header');
    assert.deepEqual(textos(tit), [s.titulo]);
    for (const p of s.parrafos) assert.ok(todo.includes(p), p);
    s.pasos.forEach((p, i) => {
      assert.ok(nodos(seccion).some((x) => x?.props?.accessibilityLabel === `Paso ${i + 1}: ${p}`), `paso ${i + 1} de ${s.id}`);
    });
  }
  // El botón a Perfil › Avisos va en la sección de los avisos, una sola vez.
  const avisos = porId(arbol, `novedadSeccion-${'avisos-movil'}`);
  assert.ok(porId(avisos, 'novedadesBotonAvisos'));
  assert.equal(nodos(arbol).filter((x) => x?.props?.testID === 'novedadesBotonAvisos').length, 1);
  assert.ok(todo.includes('Para recibir los avisos en el móvil, actívalos en Perfil › Avisos.'));
  porId(arbol, 'novedadesBotonAvisos').props.onPress();
  const historial = porId(arbol, 'novedadesHistorial');
  assert.equal(historial.props.accessibilityRole, 'link');
  assert.deepEqual(textos(historial), ['Todas las novedades anteriores, en la web']);
  historial.props.onPress();
  assert.equal(porId(arbol, 'novedadesVolver').props.accessibilityLabel, 'Volver');
  porId(arbol, 'novedadesVolver').props.onPress();
  porId(arbol, 'novedadesCerrar').props.onPress();
  modal.props.onRequestClose();
  assert.deepEqual(llamadas, ['avisos', 'web', 'cerrar', 'cerrar', 'cerrar']);

  // Si la sección de los avisos cambia de id, el botón sigue estando, al final.
  const otra = copia(NOVEDADES_PRODUCTO);
  otra.detalle[0].id = 'notificaciones';
  const sinSeccion = pantalla('PantallaNovedades', { visible: true, datos: n.validarNovedadesProducto(otra) }).arbol;
  assert.equal(nodos(sinSeccion).filter((x) => x?.props?.testID === 'novedadesBotonAvisos').length, 1);
  assert.equal(porId(porId(sinSeccion, 'novedadSeccion-notificaciones'), 'novedadesBotonAvisos'), undefined);
});

test('novedades · en inglés: el contenido sale de su «en» y los botones del diccionario común (el mismo que la web)', async () => {
  await idioma.cambiarIdioma('en');
  try {
    const ventana = pantalla('VentanaNovedades', { visible: true, datos: n.RESPALDO }).arbol;
    const v = textos(ventana);
    assert.ok(v.includes(n.RESPALDO.en.titulo));
    assert.ok(v.includes('14 November 2026'));
    for (const p of n.RESPALDO.resumen) { assert.ok(v.includes(p.en.titulo), p.en.titulo); assert.ok(v.includes(p.en.texto), p.en.texto); }
    assert.ok(v.includes('See details') && v.includes('Got it'));
    assert.equal(porId(ventana, 'novedadesVerDetalle').props.accessibilityLabel, 'See details');
    assert.equal(porId(ventana, 'novedadesVerDetalle').props.accessibilityHint, 'Opens the news explained step by step');
    assert.equal(porId(ventana, 'novedadesEntendido').props.accessibilityHint, 'Closes this window. You can see it again in Profile.');
    assert.equal(porId(ventana, 'novedadesVentana').props.accessibilityLanguage, 'en');
    assert.ok(!v.some((t) => /[ñáéíóú¿]|Novedades|Entendido|detalle/.test(t)), `queda castellano: ${v.filter((t) => /[ñáéíóú¿]|Novedades|Entendido|detalle/.test(t))}`);
    const conRec = pantalla('VentanaNovedades', { visible: true, datos: n.RESPALDO, recordarAvisos: true }).arbol;
    const r = textos(porId(conRec, 'novedadesRecordatorio'));
    assert.deepEqual(r, ['Turn on alerts', 'Get RWAdar news on your phone. It is free and you can turn alerts off whenever you like.', 'Turn on alerts']);
    assert.equal(porId(conRec, 'novedadesActivarAvisos').props.accessibilityLabel, 'Turn on alerts');
    assert.equal(porId(conRec, 'novedadesActivarAvisos').props.accessibilityHint, 'Closes this window and takes you to Profile › Alerts');

    const detalle = pantalla('PantallaNovedades', { visible: true, datos: n.RESPALDO }).arbol;
    const d = textos(detalle);
    for (const s of n.RESPALDO.detalle) {
      assert.ok(d.includes(s.en.titulo), s.en.titulo);
      for (const p of s.en.parrafos) assert.ok(d.includes(p), p);
      s.en.pasos.forEach((p, i) => assert.ok(nodos(detalle).some((x) => x?.props?.accessibilityLabel === `Step ${i + 1}: ${p}`)));
    }
    for (const t of ['To get alerts on your phone, turn them on in Profile › Alerts.', 'Go to Profile › Alerts', 'All earlier news, on the website', 'Got it'])
      assert.ok(d.includes(t), t);
    assert.equal(porId(detalle, 'novedadesVolver').props.accessibilityLabel, 'Back');
  } finally { await idioma.cambiarIdioma('es'); }
  // Todas las frases fijas de la interfaz tienen su inglés, y la web lleva el mismo diccionario.
  const fuente = leer('componentes', 'NovedadesRwadar.js');
  const fijas = ['Ver en detalle', 'Entendido', 'Abre las novedades explicadas paso a paso', 'Cierra esta ventana. Puedes volver a verla en Perfil.',
    'Para recibir los avisos en el móvil, actívalos en Perfil › Avisos.', 'Ir a Perfil › Avisos', 'Todas las novedades anteriores, en la web', 'Volver',
    'Activa los avisos', 'Recibe cada novedad en el móvil. Es gratis y puedes quitar los avisos cuando quieras.', 'Activar avisos',
    'Cierra esta ventana y te lleva a Perfil › Avisos'];
  for (const t of fijas) { assert.ok(fuente.includes(t), `ya no está: ${t}`); assert.ok(Object.hasOwn(en, t), `sin traducción: ${t}`); }
  assert.equal(leer('lib', 'idioma-en.js'), fs.readFileSync(path.join(RAIZ, '../rwadar-site/assets/idioma-en-20261022.js'), 'utf8'));
});

/* ---------------------------------------------------------------------
   Dónde va en la app (App.js) y en la privacidad
   --------------------------------------------------------------------- */
test('novedades · App: la ventana espera a Inicio sin nada encima, el detalle lleva a Perfil › Avisos y Perfil las abre', () => {
  const app = leer('App.js');
  const llamada = app.slice(app.indexOf('const novedadesRwadar = useNovedadesRwadar('), app.indexOf('const refrescar = async'));
  for (const x of ["pestana === 'inicio'", '!explicando', '!privacidad', '!abierta', '!ofertaAbierta', '!pantallaInicio', '!slugAvisoPendiente', '!destinoAvisoPendiente',
    'pantallaPrincipal', 'leerVista: leerNovedadesVistas', 'marcarVista: marcarNovedadesVistas']) assert.ok(llamada.includes(x), x);
  const principal = app.slice(app.indexOf('const pantallaPrincipal ='), app.indexOf('const novedadesRwadar ='));
  for (const x of ['fuentesListas', '!cargando', 'usuarioAdmitido', 'restaurandoAcceso', "estadoCuenta?.estado === 'restaurando'", 'errorRestauracion',
    'seguridad.preparando', 'seguridad.bloqueado']) assert.ok(principal.includes(x), x);
  // «Mercado y noticias», «Aprende» o una noticia abiertas desde Inicio son Modal a pantalla
  // completa: Inicio avisa a App de cuál hay encima (y de que ya no hay ninguna al salir).
  assert.match(app, /<Inicio\s+refrescando=\{refrescando\}\s+onActualizar=\{refrescar\}\s+onDestino=\{irA\}\s+onPantalla=\{setPantallaInicio\}/);
  assert.ok(app.indexOf('const [pantallaInicio, setPantallaInicio] = useState(null);') < app.indexOf('useNovedadesRwadar('));
  const inicio = leer('componentes', 'Inicio.js');
  assert.match(inicio, /irCalculadora = 0, onCalculadoraVista, onPantalla, cubierta = false,\n\}\) \{/);
  assert.match(inicio, /useEffect\(\(\) => \{ avisarPantalla\.current\?\.\(seccion\); \}, \[seccion\]\);/);
  assert.match(inicio, /useEffect\(\(\) => \(\) => \{ avisarPantalla\.current\?\.\(null\); \}, \[\]\);/);
  // El hook va antes de cualquier return (reglas de los hooks).
  assert.ok(app.indexOf('useNovedadesRwadar(') < app.indexOf('if (CUENTA_REMOTA_ACTIVA && (restaurandoAcceso'));
  assert.match(app, /<VentanaNovedades visible=\{novedadesRwadar\.ventana\} datos=\{novedadesRwadar\.datos\}\s*onDetalle=\{novedadesRwadar\.verDetalle\} onEntendido=\{novedadesRwadar\.entendido\}\s*recordarAvisos=\{novedadesRwadar\.recordarAvisos\}\s*onActivarAvisos=\{\(\) => \{ novedadesRwadar\.activarAvisos\(\); irAAvisosPerfil\(\); \}\} \/>/);
  // El recuadro «Activa los avisos»: con lo que enseña Perfil › Avisos (useAvisosNovedades); sin los avisos en la app, no sale.
  // Con las notificaciones sin cuenta activas en este móvil, también cuentan como activas (14/11/2026).
  assert.ok(llamada.includes("avisos: AVISOS_NOVEDADES_ACTIVOS ? estadoAvisosMovil(novedadesCuenta, { sinCuenta: sinCuentaActiva }) : 'apagados',"));
  assert.ok(app.indexOf('const novedadesCuenta = useAvisosNovedades(') < app.indexOf('useNovedadesRwadar('));
  assert.match(app, /<PantallaNovedades visible=\{novedadesRwadar\.detalle\}/);
  assert.match(app, /onIrAvisos=\{\(\) => \{ novedadesRwadar\.cerrarDetalle\(\); irAAvisosPerfil\(\); \}\}/);
  assert.match(app, /onHistorial=\{\(\) => abrirEnlace\(URL_NOVEDADES\)\}/);
  // Perfil: «Novedades de RWAdar» abre el detalle en la app, con lo primero de la lista debajo.
  assert.match(app, /titulo="Novedades de RWAdar"\s*subtitulo=\{ultimaNovedad \|\| 'Lo último de la web y la app'\}\s*onPress=\{onNovedades\}/);
  assert.match(app, /onNovedades=\{\(\) => \{ tacto\.abrir\(\); novedadesRwadar\.verDetalle\(\); \}\}/);
  assert.match(app, /ultimaNovedad=\{textosNovedades\(novedadesRwadar\.datos, idioma\)\.resumen\[0\]\?\.titulo \|\| ''\}/);
  // irAAvisosPerfil baja hasta Avisos en Perfil.
  assert.match(app, /const irAAvisosPerfil = \(\) => \{[\s\S]{0,200}setEnfocarAvisosPerfil\(true\);\s*setPestana\('perfil'\);/);
});

test('novedades · privacidad de la app: la marca de «ya visto» se explica, sin datos personales, y se borra con los datos del dispositivo', () => {
  const app = leer('App.js');
  const frase = 'Novedades de RWAdar: para no enseñarte dos veces la misma ventana de novedades, este dispositivo guarda qué versión has visto (por ejemplo, 2026-11-12). No es un dato personal, no se envía a ningún sitio y se borra con «Borrar datos del dispositivo». Las novedades se descargan de la web de RWAdar sin datos de tu cuenta.';
  assert.ok(app.includes(frase));
  assert.ok(Object.hasOwn(en, frase));
  const datos = leer('lib', 'datos.js');
  assert.match(datos, /const NOVEDADES_VISTAS = `\$\{PREFIJO\}novedades\.vista\.v2`;\s*CLAVES_LOCALES\.push\(NOVEDADES_VISTAS\);/);
  assert.match(datos, /const NOVEDADES_VISTAS_V1 = `\$\{PREFIJO\}novedades\.vista\.v1`;[\s\S]{0,200}CLAVES_LOCALES\.push\(NOVEDADES_VISTAS_V1\);/);
  // El módulo no lee nada de la cuenta ni manda cookies.
  const modulo = leer('lib', 'novedades-rwadar.js');
  const codigo = modulo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, /supabase|AsyncStorage|Authorization|cookie|require\('\.\/(?:datos|cuentas)/i);
  assert.match(modulo, /credentials: 'omit'/);
});
