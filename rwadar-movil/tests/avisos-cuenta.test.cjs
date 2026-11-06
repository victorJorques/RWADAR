'use strict';

/* Avisos de novedades (contrato del 05/11/2026): llamadas RPC con la sesión
   de la cuenta, validación estricta de lo que devuelve el servidor, enrutado
   de una notificación tocada y los dos interruptores de Perfil sin React ni
   SDK reales. Nada de red: el cliente y el SDK son dobles locales. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const a = require('../lib/avisos-cuenta');
const idioma = require('../lib/idioma');

const UID = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const TOKEN = 'ExponentPushToken[abcdefghijklmnop1234]';
const TOKEN_NUEVO = 'ExpoPushToken[zyxwvutsrqponmlk9876]';

function estadoServidor(cambios = {}) {
  return { novedades: false, version: null, aceptado_el: null, version_vigente: a.VERSION_AVISOS,
    texto_es: a.TEXTO_AVISOS_ES, texto_en: a.TEXTO_AVISOS_EN, dispositivos: 0,
    correo_activo: false, push_activo: false, ...cambios };
}

function cuentaFalsa({ respuestas = {}, usuarioId = UID } = {}) {
  const llamadas = [];
  let usuario = usuarioId;
  const oyentes = new Set();
  const cliente = {
    rpc(nombre, argumentos) {
      llamadas.push([nombre, argumentos]);
      const respuesta = respuestas[nombre];
      const resultado = typeof respuesta === 'function' ? respuesta(argumentos) : respuesta ?? { data: null, error: null };
      return { abortSignal: () => Promise.resolve(resultado) };
    },
  };
  return {
    llamadas,
    cuenta: {
      estado: () => ({ usuario: usuario ? { id: usuario } : null }),
      clienteCatalogo: async () => { llamadas.push(['clienteCatalogo']); return cliente; },
      suscribir(fn) { oyentes.add(fn); fn({ usuario: usuario ? { id: usuario } : null }); return () => oyentes.delete(fn); },
    },
    cambiarUsuario(id) { usuario = id; for (const fn of oyentes) fn({ usuario: id ? { id } : null }); },
  };
}

test('versión y textos de la casilla: los de la revisión legal, en la app y en el diccionario compartido', () => {
  assert.equal(a.VERSION_AVISOS, 'novedades-v2-2026-11-06');
  assert.equal(a.TEXTO_AVISOS_ES, 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.');
  assert.equal(a.TEXTO_AVISOS_EN, "I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: new listings on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your phone settings. More information in Privacy.");
  // La app enseña el texto en inglés a través del diccionario compartido con la web.
  assert.equal(idioma.ingles(a.TEXTO_AVISOS_ES), a.TEXTO_AVISOS_EN);
  assert.equal(a.CODIGO_PUSH_MINIMO, 24);
});

test('información básica: fuera del texto versionado, en español e inglés, y la web la traduce igual', () => {
  assert.equal(a.INFO_BASICA_ES, 'Información básica sobre tus datos. Responsable: Víctor Manuel Jorques Granero (RWAdar). Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en RWAdar@protonmail.com; también puedes reclamar ante la AEPD. Más información en Privacidad.');
  assert.equal(a.INFO_BASICA_EN, 'Basic information about your data. Controller: Víctor Manuel Jorques Granero (RWAdar). Data: your email, your password and, if you give it, your name; with notices, also your consent and, if you turn on notifications, a delivery identifier for your phone. Purpose: your account, which also opens the Academy, and, only if you tick the notices box, sending you those notices. Legal basis: the service you request (account) and your consent (notices), which you can withdraw at any time without affecting what came before. Providers: Supabase, Cloudflare and Google; for notices, Lettermint and Expo. Some process data outside the EU with safeguards. Rights: access, rectification, erasure, objection, restriction and portability, in Profile or at RWAdar@protonmail.com; you can also complain to the AEPD (Spanish Data Protection Agency). More information in Privacy.');
  assert.equal(idioma.ingles(a.INFO_BASICA_ES), a.INFO_BASICA_EN);
  assert.equal(a.TEXTO_AVISOS_ES.includes('Responsable'), false, 'no forma parte del texto del permiso');
  // La copia de la web es idéntica (copiar-idiomas-web.cjs): ahí se traduce igual.
  const web = path.resolve(__dirname, '../../rwadar-site/assets/idioma-en-20261022.js');
  if (fs.existsSync(web)) {
    const diccionarioWeb = fs.readFileSync(web, 'utf8');
    for (const [es, en] of [[a.TEXTO_AVISOS_ES, a.TEXTO_AVISOS_EN], [a.INFO_BASICA_ES, a.INFO_BASICA_EN]]) {
      assert.ok(diccionarioWeb.includes(`${JSON.stringify(es)}: ${JSON.stringify(en)}`), es.slice(0, 40));
    }
  }
});

test('el idioma del permiso solo puede ser es o en; sin decirlo, el de la app', async () => {
  assert.equal(a.idiomaAvisos('es'), 'es');
  assert.equal(a.idiomaAvisos('en'), 'en');
  for (const raro of [undefined, null, 'EN', 'fr', 'en-GB', 1, {}]) assert.equal(a.idiomaAvisos(raro), 'es', String(raro));
  await idioma.cambiarIdioma('en');
  try {
    assert.equal(a.idiomaAvisos(undefined), 'en');
    assert.equal(a.idiomaAvisos('fr'), 'en');
    assert.equal(a.idiomaAvisos('es'), 'es', 'lo que dice quien llama manda');
  } finally { await idioma.cambiarIdioma('es'); }
});

const CONTRATO = path.resolve(__dirname, '../../docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md');
test('los textos coinciden palabra por palabra con el contrato', { skip: !fs.existsSync(CONTRATO) && 'el contrato no está en esta copia' }, (t) => {
  /* El contrato se actualiza aparte (no es de la app). Mientras describa otra
     versión, no se compara; en cuanto nombre la vigente, sus citas tienen que
     coincidir palabra por palabra. */
  if (!fs.readFileSync(CONTRATO, 'utf8').includes(a.VERSION_AVISOS)) {
    t.skip(`el contrato aún no describe ${a.VERSION_AVISOS}`);
    return;
  }
  const lineas = fs.readFileSync(CONTRATO, 'utf8').split(/\r?\n/);
  const cita = (rotulo) => {
    const inicio = lineas.findIndex((linea) => linea.trim() === rotulo);
    assert.ok(inicio >= 0, rotulo);
    const partes = [];
    for (const linea of lineas.slice(inicio + 1)) {
      const m = /^\s*>\s?(.*)$/.exec(linea);
      if (!m) { if (partes.length) break; continue; }
      partes.push(m[1].trim());
    }
    return partes.join(' ');
  };
  assert.equal(cita('- Texto en español:'), a.TEXTO_AVISOS_ES);
  assert.equal(cita('- Texto en inglés:'), a.TEXTO_AVISOS_EN);
  assert.match(fs.readFileSync(CONTRATO, 'utf8'), new RegExp(a.VERSION_AVISOS));
});

test('la capacidad push sale de runtimeVersion: la 1.4.1 (23) no, la 1.4.2 (24) sí', () => {
  assert.equal(a.capacidadPushNativa('1.4.1(23)'), false);
  assert.equal(a.capacidadPushNativa('1.4.2(24)'), true);
  assert.equal(a.capacidadPushNativa('1.5.0(31)'), true);
  for (const raro of [null, undefined, '', '1.4.2', '24', 'exposdk:57.0.0', '1.4.2(24) ', '1.4.2(24a)']) {
    assert.equal(a.capacidadPushNativa(raro), false, String(raro));
  }
  const fuente = fs.readFileSync(path.join(__dirname, '../lib/avisos-cuenta.js'), 'utf8')
    + fs.readFileSync(path.join(__dirname, '../lib/avisos.js'), 'utf8');
  assert.doesNotMatch(fuente, /(?:require\(|from )['"]expo-application/, 'la capacidad nunca se deduce de expo-application');
});

test('el estado del servidor se valida con tipos estrictos y detecta un texto distinto', () => {
  const bueno = a.validarEstadoAvisos(estadoServidor({ novedades: true, version: a.VERSION_AVISOS,
    aceptado_el: '2026-11-05T20:00:00.123456+00:00', dispositivos: 2, correo_activo: true }));
  assert.deepEqual(bueno, { novedades: true, version: a.VERSION_AVISOS, aceptadoEl: '2026-11-05T20:00:00.123Z',
    versionVigente: a.VERSION_AVISOS, dispositivos: 2, correoActivo: true, pushActivo: false, textoVigente: true });
  for (const cambio of [{ novedades: 'true' }, { novedades: 1 }, { correo_activo: null }, { push_activo: 'false' },
    { version: 7 }, { version: 'v<script>' }, { aceptado_el: 'ayer' }, { version_vigente: null },
    { texto_es: '' }, { texto_en: 'a\u0000b' }, { dispositivos: -1 }, { dispositivos: 1.5 }, { dispositivos: '2' }]) {
    assert.throws(() => a.validarEstadoAvisos(estadoServidor(cambio)), /avisos_respuesta_invalida/, JSON.stringify(cambio));
  }
  const sinClave = estadoServidor(); delete sinClave.version;
  assert.throws(() => a.validarEstadoAvisos(sinClave), /avisos_respuesta_invalida/);
  for (const raro of [null, [], 'estado', 3, [estadoServidor()]]) assert.throws(() => a.validarEstadoAvisos(raro));
  assert.equal(a.validarEstadoAvisos(estadoServidor({ version_vigente: 'novedades-v2-2026-12-01' })).textoVigente, false);
  assert.equal(a.validarEstadoAvisos(estadoServidor({ texto_es: a.TEXTO_AVISOS_ES + ' ' })).textoVigente, false);
});

test('los avisos recientes solo enlazan a https://rwadar.pages.dev y descartan filas raras', () => {
  const base = { id: '7', tipo: 'novedad', titulo: 'Nueva lección', texto: 'Ya está la lección 7.',
    enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-05T10:00:00+00:00' };
  const lista = a.validarAvisosRecientes([
    base,
    { ...base, id: '7' },
    { id: 'bienvenida', tipo: 'bienvenida', titulo: 'Te damos la bienvenida a RWAdar', texto: 'Hola.',
      enlace: 'https://rwadar.pages.dev/academy/', creado_el: null },
    { ...base, id: '8', tipo: 'ofertas', enlace: 'https://rwadar.pages.dev/#emisiones' },
    { ...base, id: '9', enlace: null },
    ...['http://rwadar.pages.dev/', 'https://rwadar.pages.dev.evil.test/', 'https://evil.test/https://rwadar.pages.dev/',
      'https://user:pw@rwadar.pages.dev/', 'https://rwadar.pages.dev:8443/', 'javascript:alert(1)',
      'https://rwadar.pages.dev/<script>', 'https://rwadar.pages.dev/' + 'a'.repeat(200)]
      .map((enlace, i) => ({ ...base, id: String(20 + i), enlace })),
    { ...base, id: '30', tipo: 'publicidad' },
    { ...base, id: 'bienvenida' },
    { ...base, id: '31', tipo: 'bienvenida' },
    { ...base, id: '0' },
    { ...base, id: 32 },
    { ...base, id: '33', titulo: 'Dos\nlíneas' },
    { ...base, id: '34', texto: '' },
    { ...base, id: '35', creado_el: null },
    { ...base, id: '36', creado_el: 'mañana' },
    'texto suelto', null,
  ]);
  assert.deepEqual(lista.map((x) => x.id), ['7', 'bienvenida', '8', '9']);
  assert.equal(lista[0].creadoEl, '2026-11-05T10:00:00.000Z');
  assert.deepEqual(Object.keys(lista[0]).sort(), ['creadoEl', 'enlace', 'id', 'texto', 'tipo', 'titulo']);
  assert.throws(() => a.validarAvisosRecientes({ 0: base }), /avisos_respuesta_invalida/);
  assert.throws(() => a.validarAvisosRecientes(Array.from({ length: 51 }, (_, i) => ({ ...base, id: String(i + 1) }))));
  assert.equal(a.validarAvisosRecientes([base, { ...base, id: '8' }], 1).length, 1);
});

test('una notificación tocada solo lleva a inicio, buscar o academy; el slug antiguo sigue valiendo', () => {
  for (const tipo of a.TIPOS_AVISO) for (const destino of a.DESTINOS_AVISO) {
    assert.deepEqual(a.aperturaDesdeDatosAviso({ tipo, destino }), { tipo, destino });
  }
  assert.deepEqual(a.aperturaDesdeDatosAviso({ slug: 'alpha-rwa' }), { slug: 'alpha-rwa' });
  for (const raro of [null, 'buscar', [], { tipo: 'ofertas' }, { destino: 'buscar' },
    { tipo: 'ofertas', destino: 'perfil' }, { tipo: 'publi', destino: 'inicio' },
    { tipo: 'ofertas', destino: 'https://rwadar.pages.dev/' }, { tipo: 'OFERTAS', destino: 'buscar' },
    { tipo: 'ofertas', destino: 'buscar ' }, { tipo: ['ofertas'], destino: 'buscar' },
    // Si trae tipo o destino, no se cae al slug: o es una novedad válida o nada.
    { tipo: 'raro', destino: 'inicio', slug: 'alpha' },
    { slug: '../radar' }, { slug: 'https://mal.example' }, { slug: 'a'.repeat(81) }]) {
    assert.equal(a.aperturaDesdeDatosAviso(raro), null, JSON.stringify(raro));
  }
});

test('un aviso de Inicio lleva a ofertas nuevas, a la Academy o a su enlace verificado', () => {
  assert.deepEqual(a.destinoAviso({ tipo: 'ofertas', enlace: 'https://rwadar.pages.dev/#emisiones' }), { destino: 'ofertas-nuevas' });
  assert.deepEqual(a.destinoAviso({ tipo: 'bienvenida', enlace: null }), { destino: 'academy' });
  assert.deepEqual(a.destinoAviso({ tipo: 'novedad', enlace: 'https://rwadar.pages.dev/academy/liquidez' }), { destino: 'academy' });
  assert.deepEqual(a.destinoAviso({ tipo: 'actualizacion', enlace: 'https://rwadar.pages.dev/cambios' }),
    { destino: 'web', url: 'https://rwadar.pages.dev/cambios' });
  assert.equal(a.destinoAviso({ tipo: 'novedad', enlace: 'https://evil.test/' }), null);
  assert.equal(a.destinoAviso({ tipo: 'novedad', enlace: 'https://rwadar.pages.dev/academyfalsa' }).destino, 'web');
  assert.equal(a.destinoAviso({ tipo: 'novedad', enlace: null }), null);
});

test('las cinco funciones RPC del contrato, con sus argumentos exactos y la sesión de la cuenta', async () => {
  const f = cuentaFalsa({ respuestas: {
    estado_mis_avisos: { data: estadoServidor(), error: null },
    configurar_avisos_novedades: (args) => ({ data: estadoServidor({ novedades: args.p_activar,
      version: args.p_activar ? args.p_version : null }), error: null }),
    registrar_aviso_push: { data: true, error: null },
    quitar_aviso_push: { data: false, error: null },
    mis_avisos_recientes: { data: [{ id: 'bienvenida', tipo: 'bienvenida', titulo: 'Hola', texto: 'Bienvenida.',
      enlace: 'https://rwadar.pages.dev/academy/', creado_el: '2026-11-05T10:00:00Z' }], error: null },
  } });
  const avisos = a.crearAvisosCuenta({ cuenta: f.cuenta, usuarioId: UID });
  assert.equal((await avisos.estado()).novedades, false);
  assert.equal((await avisos.configurar(true)).novedades, true);
  assert.equal((await avisos.configurar(false)).novedades, false);
  assert.equal((await avisos.configurar(true, 'en')).novedades, true);
  assert.equal(await avisos.registrarPush(TOKEN, 'android'), true);
  assert.equal(await avisos.quitarPush(TOKEN), false);
  assert.equal((await avisos.recientes(5))[0].id, 'bienvenida');
  assert.deepEqual(f.llamadas.filter(([n]) => n !== 'clienteCatalogo'), [
    ['estado_mis_avisos', {}],
    ['configurar_avisos_novedades', { p_activar: true, p_version: 'novedades-v2-2026-11-06', p_canal: 'app', p_idioma: 'es' }],
    ['configurar_avisos_novedades', { p_activar: false, p_version: 'novedades-v2-2026-11-06', p_canal: 'app', p_idioma: 'es' }],
    ['configurar_avisos_novedades', { p_activar: true, p_version: 'novedades-v2-2026-11-06', p_canal: 'app', p_idioma: 'en' }],
    ['registrar_aviso_push', { p_token: TOKEN, p_plataforma: 'android' }],
    ['quitar_aviso_push', { p_token: TOKEN }],
    ['mis_avisos_recientes', { p_limite: 5 }],
  ]);
  assert.equal(f.llamadas.filter(([n]) => n === 'clienteCatalogo').length, 7, 'cada llamada revalida la cuenta');
  const antes = f.llamadas.length;
  for (const intento of [() => avisos.configurar('true'), () => avisos.configurar(1), () => avisos.registrarPush('token', 'android'),
    () => avisos.registrarPush(TOKEN, 'web'), () => avisos.quitarPush('ExponentPushToken[corto]'), () => avisos.recientes(0),
    () => avisos.recientes(51), () => avisos.recientes('5')]) {
    await assert.rejects(intento, /avisos_parametro_invalido/);
  }
  assert.equal(f.llamadas.length, antes, 'un parámetro inválido no llega al servidor');
  avisos.destruir();
});

test('respuestas del servidor fuera de contrato, sin sesión o de otra cuenta no se aceptan', async () => {
  const f = cuentaFalsa({ respuestas: {
    estado_mis_avisos: { data: null, error: { code: '42501', message: 'privado' } },
    configurar_avisos_novedades: { data: estadoServidor({ novedades: false }), error: null },
    registrar_aviso_push: { data: 'true', error: null },
    quitar_aviso_push: { data: null, error: null },
    mis_avisos_recientes: { data: null, error: { code: '22023', status: 400 } },
  } });
  const avisos = a.crearAvisosCuenta({ cuenta: f.cuenta, usuarioId: UID });
  await assert.rejects(avisos.estado(), (e) => e.code === 'sin_sesion' && !/privado/.test(e.message));
  await assert.rejects(avisos.configurar(true), /avisos_respuesta_invalida/, 'si dice que no se activó, no se da por activado');
  await assert.rejects(avisos.registrarPush(TOKEN, 'ios'), /avisos_respuesta_invalida/);
  await assert.rejects(avisos.quitarPush(TOKEN), /avisos_respuesta_invalida/);
  await assert.rejects(avisos.recientes(), /avisos_no_disponibles/);
  f.cambiarUsuario(OTRO);
  await assert.rejects(avisos.estado(), /cancelada/);
  assert.throws(() => a.crearAvisosCuenta({ cuenta: f.cuenta, usuarioId: 'no-uuid' }), /sin_sesion/);
  assert.throws(() => a.crearAvisosCuenta({ cuenta: {}, usuarioId: UID }), /sin_sesion/);
});

test('al cerrar sesión se quita el token con el cliente que se cierra y se validan token y respuesta', async () => {
  const llamadas = [];
  const cliente = { async rpc(nombre, args) { llamadas.push([nombre, args]); return { data: true, error: null }; } };
  assert.equal(await a.quitarPushConCliente(cliente, TOKEN), true);
  assert.deepEqual(llamadas, [['quitar_aviso_push', { p_token: TOKEN }]]);
  await assert.rejects(a.quitarPushConCliente(cliente, 'otro'), /avisos_parametro_invalido/);
  await assert.rejects(a.quitarPushConCliente({ rpc: async () => ({ data: null, error: { code: '42501' } }) }, TOKEN), /sin_sesion/);
  await assert.rejects(a.quitarPushConCliente({ rpc: async () => ({ data: 'sí', error: null }) }, TOKEN), /avisos_respuesta_invalida/);
  assert.equal(llamadas.length, 1);
});

function almacenFalso(token = null, renovado = null) {
  const datos = { leidos: [], token, renovado };
  const llamadas = [];
  return { datos, llamadas, almacen: {
    async leidos(uid) { llamadas.push(['leidos', uid]); return datos.leidos; },
    async marcarLeidos(uid, ids) { llamadas.push(['marcar', uid, ids]); datos.leidos = [...new Set([...ids, ...datos.leidos])]; return datos.leidos; },
    async token(uid) { llamadas.push(['token', uid]); return datos.token; },
    async guardarToken(uid, t) { llamadas.push(['guardarToken', uid]); datos.token = t; },
    async borrarToken(uid) { llamadas.push(['borrarToken', uid]); datos.token = null; },
    async renovadoEl(uid) { llamadas.push(['renovadoEl', uid]); return datos.renovado; },
    async marcarRenovado(uid, dia) { llamadas.push(['marcarRenovado', uid, dia]); datos.renovado = dia; },
  } };
}
function avisosFalsos(servidor = a.validarEstadoAvisos(estadoServidor()), { registrado } = {}) {
  const llamadas = [];
  const avisos = {
    async estado() { llamadas.push(['estado']); return servidor; },
    async configurar(activar, idioma) {
      llamadas.push(idioma === undefined ? ['configurar', activar] : ['configurar', activar, idioma]);
      return { ...servidor, novedades: activar };
    },
    async registrarPush(token, plataforma) { llamadas.push(['registrar', token, plataforma]); return true; },
    async quitarPush(token) { llamadas.push(['quitar', token]); return true; },
    async recientes(limite) { llamadas.push(['recientes', limite]); return []; },
  };
  // Sin `registrado`, como hoy: la base todavía no tiene mi_aviso_push_registrado.
  if (registrado !== undefined) {
    avisos.pushRegistrado = async (token) => {
      llamadas.push(['registrado', token]);
      if (registrado instanceof Error) throw registrado;
      return registrado;
    };
  }
  return { llamadas, avisos };
}
function sdkProhibido() {
  return { capacidad: false,
    consultar: () => assert.fail('por debajo del código 24 no se consulta el SDK'),
    obtenerToken: () => assert.fail('por debajo del código 24 no se pide token') };
}

test('Perfil con la 1.4.1 (código 23): el interruptor del móvil anuncia la 1.4.2 y no toca el SDK ni el almacén', async () => {
  const { almacen, llamadas: enAlmacen } = almacenFalso();
  const servidor = a.validarEstadoAvisos(estadoServidor({ push_activo: true }));
  const f = avisosFalsos(servidor);
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, push: sdkProhibido(), almacen });
  const perfil = await g.cargarPerfil();
  assert.deepEqual(perfil.movil, { estado: 'requiere-version', activo: false, puedeActivar: false, puedeDesactivar: false });
  assert.deepEqual(await g.activarMovil(servidor), { ok: false, estado: 'requiere-version' });
  assert.equal(enAlmacen.some(([n]) => n === 'token' || n === 'guardarToken'), false);
  assert.equal(f.llamadas.some(([n]) => n === 'registrar'), false);
});

test('Perfil con el código 24: el móvil se registra solo tras pulsar, con permiso y token válidos', async () => {
  const { almacen, datos } = almacenFalso();
  const pendiente = a.validarEstadoAvisos(estadoServidor());
  const activo = a.validarEstadoAvisos(estadoServidor({ push_activo: true }));
  const sdk = [];
  const push = { capacidad: true,
    async consultar() { sdk.push('consultar'); return { ok: false, estado: datos.token ? 'permitido' : 'disponible' }; },
    async obtenerToken(opciones) { sdk.push(['token', opciones]); return { ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' }; } };
  const f = avisosFalsos(activo);
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, push, almacen });
  // Sin push encendido en la base, ni se consulta el sistema ni se ofrece.
  assert.deepEqual(await g.estadoMovil(pendiente), { estado: 'servicio-pendiente', activo: false, puedeActivar: false, puedeDesactivar: false });
  assert.deepEqual(await g.activarMovil(pendiente), { ok: false, estado: 'servicio-pendiente' });
  assert.deepEqual(sdk, []);
  // Con push encendido: consulta pasiva, después registro explícito.
  assert.equal((await g.cargarPerfil()).movil.estado, 'disponible');
  assert.deepEqual(sdk, ['consultar']);
  assert.deepEqual(await g.activarMovil(activo), { ok: true, estado: 'activo' });
  assert.deepEqual(sdk.at(-1), ['token', { solicitarPermiso: true }]);
  assert.deepEqual(f.llamadas.filter(([n]) => n === 'registrar'), [['registrar', TOKEN, 'android']]);
  assert.equal(datos.token, TOKEN);
  assert.equal((await g.estadoMovil(activo)).estado, 'activo');
  // Si el sistema rota el token, el anterior se quita.
  push.obtenerToken = async () => ({ ok: true, estado: 'permitido', token: TOKEN_NUEVO, plataforma: 'android' });
  await g.activarMovil(activo);
  assert.deepEqual(f.llamadas.filter(([n]) => n === 'quitar'), [['quitar', TOKEN]]);
  assert.equal(datos.token, TOKEN_NUEVO);
  // Desactivar quita el token de la cuenta y del dispositivo.
  assert.deepEqual(await g.desactivarMovil(), { ok: true });
  assert.deepEqual(f.llamadas.at(-1), ['quitar', TOKEN_NUEVO]);
  assert.equal(datos.token, null);
});

test('Perfil con el código 24: permiso denegado, token raro o un fallo no registran nada', async () => {
  const activo = a.validarEstadoAvisos(estadoServidor({ push_activo: true }));
  for (const [respuesta, esperado] of [[{ ok: false, estado: 'denegado' }, 'denegado'],
    [{ ok: true, estado: 'permitido', token: 'token-raro', plataforma: 'android' }, 'permitido'],
    [{ ok: false, estado: 'error' }, 'error'], [null, 'error']]) {
    const { almacen, datos } = almacenFalso();
    const f = avisosFalsos(activo);
    const g = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, almacen,
      push: { capacidad: true, consultar: async () => ({ estado: 'denegado' }), obtenerToken: async () => respuesta } });
    assert.deepEqual(await g.activarMovil(activo), { ok: false, estado: esperado });
    assert.equal(f.llamadas.some(([n]) => n === 'registrar'), false);
    assert.equal(datos.token, null);
    assert.equal((await g.estadoMovil(activo)).estado, 'denegado');
  }
  // Un token guardado sin permiso del sistema se puede desactivar.
  const { almacen } = almacenFalso(TOKEN);
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: avisosFalsos(activo).avisos, usuarioId: UID, almacen,
    push: { capacidad: true, consultar: async () => ({ estado: 'denegado' }), obtenerToken: async () => null } });
  assert.deepEqual(await g.estadoMovil(activo), { estado: 'sin-permiso', activo: true, puedeActivar: false, puedeDesactivar: true });
});

test('el permiso de novedades solo se activa con el texto vigente; la baja siempre se puede', async () => {
  const desfasado = a.validarEstadoAvisos(estadoServidor({ version_vigente: 'novedades-v2-2026-12-01' }));
  const f = avisosFalsos(desfasado);
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, push: sdkProhibido(), almacen: almacenFalso().almacen });
  await assert.rejects(g.alternarNovedades(true, desfasado), /avisos_texto_desfasado/);
  assert.equal(f.llamadas.some(([n]) => n === 'configurar'), false);
  assert.equal((await g.alternarNovedades(false, desfasado)).novedades, false);
  const vigente = a.validarEstadoAvisos(estadoServidor());
  assert.equal((await g.alternarNovedades(true, vigente)).novedades, true);
  // El idioma en que se vio el texto pasa tal cual hasta configurar (p_idioma).
  assert.equal((await g.alternarNovedades(true, vigente, 'en')).novedades, true);
  assert.deepEqual(f.llamadas.filter(([n]) => n === 'configurar'),
    [['configurar', false], ['configurar', true], ['configurar', true, 'en']]);
});

/* ---------------------------------------------------------------------
   ¿Sigue este móvil registrado? public.mi_aviso_push_registrado (opcional)
   --------------------------------------------------------------------- */
test('mi_aviso_push_registrado: con el cliente de la cuenta; sin la función, un error o algo raro es «desconocido»', async () => {
  const casos = [
    [{ data: true, error: null }, true],
    [{ data: false, error: null }, false],
    // Antes de que la base la tenga: PostgREST responde 404 (PGRST202).
    [{ data: null, error: { code: 'PGRST202', message: 'Could not find the function' }, status: 404 }, null],
    [{ data: null, error: { code: '42501' }, status: 401 }, null],
    [{ data: null, error: { code: '500' }, status: 500 }, null],
    [{ data: 'false', error: null }, null],
    [{ data: null, error: null }, null],
    [{ data: [true], error: null }, null],
  ];
  for (const [respuesta, esperado] of casos) {
    const f = cuentaFalsa({ respuestas: { mi_aviso_push_registrado: respuesta } });
    const avisos = a.crearAvisosCuenta({ cuenta: f.cuenta, usuarioId: UID });
    assert.equal(await avisos.pushRegistrado(TOKEN), esperado, JSON.stringify(respuesta));
    assert.deepEqual(f.llamadas, [['clienteCatalogo'], ['mi_aviso_push_registrado', { p_token: TOKEN }]]);
    avisos.destruir();
  }
  const f = cuentaFalsa({ respuestas: { mi_aviso_push_registrado: { data: true, error: null } } });
  const avisos = a.crearAvisosCuenta({ cuenta: f.cuenta, usuarioId: UID });
  await assert.rejects(avisos.pushRegistrado('token-raro'), /avisos_parametro_invalido/);
  assert.equal(f.llamadas.length, 0, 'un token inválido no llega al servidor');
  f.cambiarUsuario(OTRO);
  await assert.rejects(avisos.pushRegistrado(TOKEN), /cancelada/, 'con otra cuenta no se responde por la anterior');
});

test('Perfil con el código 24: si la base dice que el móvil ya no está, no se enseña como activo', async () => {
  const activo = a.validarEstadoAvisos(estadoServidor({ push_activo: true }));
  const permitido = { capacidad: true, consultar: async () => ({ ok: true, estado: 'permitido' }),
    obtenerToken: async () => ({ ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' }) };
  // La base dice false: se puede volver a activar, y se vuelve a registrar.
  const { almacen, datos } = almacenFalso(TOKEN);
  const perdido = avisosFalsos(activo, { registrado: false });
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: perdido.avisos, usuarioId: UID, almacen, push: permitido });
  assert.deepEqual(await g.estadoMovil(activo), { estado: 'no-registrado', activo: false, puedeActivar: true, puedeDesactivar: false });
  assert.deepEqual(perdido.llamadas, [['registrado', TOKEN]]);
  assert.deepEqual(await g.renovarMovil(activo), { renovado: false, motivo: 'no-registrado' },
    'la renovación no vuelve a apuntar un móvil que la base ya no tiene');
  assert.equal(perdido.llamadas.some(([n]) => n === 'registrar'), false);
  assert.deepEqual(await g.activarMovil(activo), { ok: true, estado: 'activo' });
  assert.deepEqual(perdido.llamadas.filter(([n]) => n === 'registrar'), [['registrar', TOKEN, 'android']]);
  assert.equal(datos.token, TOKEN);
  // La base dice true o no lo sabe (sin la función, error): activo, como hasta ahora.
  for (const registrado of [true, null, undefined, new Error('avisos_no_disponibles')]) {
    const f = avisosFalsos(activo, { registrado });
    const g2 = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, almacen: almacenFalso(TOKEN).almacen, push: permitido });
    assert.deepEqual(await g2.estadoMovil(activo), { estado: 'activo', activo: true, puedeActivar: false, puedeDesactivar: true }, String(registrado));
  }
  // Sin token, sin permiso o con la base en pausa no se pregunta.
  for (const [token, consultar, servidor] of [[null, permitido.consultar, activo],
    [TOKEN, async () => ({ ok: false, estado: 'denegado' }), activo],
    [TOKEN, permitido.consultar, a.validarEstadoAvisos(estadoServidor())]]) {
    const f = avisosFalsos(activo, { registrado: false });
    const g3 = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, almacen: almacenFalso(token).almacen,
      push: { ...permitido, consultar } });
    assert.notEqual((await g3.estadoMovil(servidor)).estado, 'no-registrado');
    assert.equal(f.llamadas.some(([n]) => n === 'registrado'), false);
  }
  // Con la 1.4.1, nada.
  const f141 = avisosFalsos(activo, { registrado: false });
  const g141 = a.crearGestorAvisosNovedades({ avisosCuenta: f141.avisos, usuarioId: UID, almacen: almacenFalso(TOKEN).almacen, push: sdkProhibido() });
  assert.equal((await g141.estadoMovil(activo)).estado, 'requiere-version');
  assert.deepEqual(f141.llamadas, []);
});

/* ---------------------------------------------------------------------
   Renovación: la base borra los móviles que no se renuevan en 180 días
   --------------------------------------------------------------------- */
function renovacion({ capacidad = true, consulta = { ok: true, estado: 'permitido' }, token = TOKEN, renovado = null,
  servidor = estadoServidor({ push_activo: true }), registrado, tokenSistema = TOKEN, plazoRenovacion } = {}) {
  const reloj = { ahora: new Date('2026-11-05T09:00:00Z') };
  const almacen = almacenFalso(token, renovado);
  const f = avisosFalsos(a.validarEstadoAvisos(servidor), { registrado });
  const sdk = [];
  const push = capacidad ? { capacidad: true,
    async consultar() { sdk.push('consultar'); return consulta; },
    async obtenerToken(opciones) { sdk.push(['token', opciones]); return { ok: true, estado: 'permitido', token: tokenSistema, plataforma: 'android' }; },
  } : sdkProhibido();
  const g = a.crearGestorAvisosNovedades({ avisosCuenta: f.avisos, usuarioId: UID, almacen: almacen.almacen, push,
    ahora: () => reloj.ahora, ...(plazoRenovacion ? { plazoRenovacion } : {}) });
  return { g, f, sdk, push, reloj, almacen, servidor: a.validarEstadoAvisos(servidor) };
}

test('renovación: con todo en regla vuelve a registrar el token actual una vez al día y sin pedir permiso', async () => {
  const r = renovacion();
  assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: true });
  assert.deepEqual(r.f.llamadas.filter(([n]) => n === 'registrar'), [['registrar', TOKEN, 'android']]);
  assert.deepEqual(r.sdk, ['consultar', ['token', { solicitarPermiso: false }]], 'nunca pide permiso al sistema');
  assert.equal(r.almacen.datos.renovado, '2026-11-05', 'marca de fecha por cuenta');
  assert.ok(r.almacen.llamadas.some(([n, uid]) => n === 'marcarRenovado' && uid === UID));
  // El mismo día, ni SDK ni base, aunque se recargue muchas veces.
  r.reloj.ahora = new Date('2026-11-05T23:59:00Z');
  for (let i = 0; i < 3; i++) assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: false, motivo: 'hecho-hoy' });
  assert.equal(r.f.llamadas.filter(([n]) => n === 'registrar').length, 1);
  assert.equal(r.sdk.length, 2);
  // Al día siguiente, otra vez.
  r.reloj.ahora = new Date('2026-11-06T00:01:00Z');
  assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: true });
  assert.equal(r.f.llamadas.filter(([n]) => n === 'registrar').length, 2);
  assert.equal(r.almacen.datos.renovado, '2026-11-06');
  // Dos cargas a la vez no registran dos veces.
  r.reloj.ahora = new Date('2026-11-07T08:00:00Z');
  const dobles = await Promise.all([r.g.renovarMovil(r.servidor), r.g.renovarMovil(r.servidor)]);
  assert.deepEqual(dobles, [{ renovado: true }, { renovado: false, motivo: 'hecho-hoy' }]);
  assert.equal(r.f.llamadas.filter(([n]) => n === 'registrar').length, 3);
});

test('renovación: sin capacidad nativa, sin push en la base, sin permiso, sin token o con la base diciendo que no, no llama', async () => {
  const casos = [
    ['1.4.1 (código 23)', { capacidad: false }, 'requiere-version'],
    ['push apagado en la base', { servidor: estadoServidor({ push_activo: false }) }, 'servicio-pendiente'],
    ['permiso por pedir', { consulta: { ok: false, estado: 'disponible' } }, 'sin-permiso'],
    ['permiso denegado con token guardado', { consulta: { ok: false, estado: 'denegado' } }, 'sin-permiso'],
    ['sin token guardado', { token: null }, 'disponible'],
    ['emulador', { consulta: { ok: false, estado: 'emulador' } }, 'no-disponible'],
    ['la base dice que ya no está', { registrado: false }, 'no-registrado'],
    ['ya renovado hoy', { renovado: '2026-11-05' }, 'hecho-hoy'],
  ];
  for (const [nombre, opciones, motivo] of casos) {
    const r = renovacion(opciones);
    assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: false, motivo }, nombre);
    assert.equal(r.f.llamadas.some(([n]) => n === 'registrar'), false, nombre);
    assert.equal(r.sdk.some((x) => Array.isArray(x) && x[0] === 'token'), false, `${nombre}: no se pide token`);
    assert.equal(r.almacen.datos.renovado, opciones.renovado ?? null, `${nombre}: sin marca nueva`);
  }
  // Con la 1.4.1 ni siquiera se lee el almacén.
  const v141 = renovacion({ capacidad: false });
  await v141.g.renovarMovil(v141.servidor);
  assert.deepEqual(v141.almacen.llamadas, []);
});

test('renovación: si el sistema cambió el token, se guarda el nuevo y se quita el anterior', async () => {
  const r = renovacion({ tokenSistema: TOKEN_NUEVO });
  assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: true });
  assert.deepEqual(r.f.llamadas.filter(([n]) => n === 'registrar' || n === 'quitar'),
    [['registrar', TOKEN_NUEVO, 'android'], ['quitar', TOKEN]]);
  assert.equal(r.almacen.datos.token, TOKEN_NUEVO);
});

test('renovación: un fallo no la repite el mismo día y no se cruza con «desactivar»', async () => {
  const r = renovacion();
  r.f.avisos.registrarPush = async () => { r.f.llamadas.push(['registrar-fallo']); throw new Error('avisos_no_disponibles'); };
  await assert.rejects(r.g.renovarMovil(r.servidor), /avisos_no_disponibles/);
  assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: false, motivo: 'hecho-hoy' }, 'como mucho un intento al día');
  assert.equal(r.f.llamadas.filter(([n]) => n === 'registrar-fallo').length, 1);
  // Desactivar mientras se renueva: va después, y el móvil queda fuera.
  const d = renovacion();
  let soltar;
  d.f.avisos.registrarPush = (token) => new Promise((resolver) => { soltar = () => { d.f.llamadas.push(['registrar', token]); resolver(true); }; });
  const renovando = d.g.renovarMovil(d.servidor);
  const desactivando = d.g.desactivarMovil();
  for (let i = 0; i < 5; i++) await new Promise((resolver) => setImmediate(resolver));
  assert.equal(typeof soltar, 'function', 'la renovación ha llegado a registrar');
  assert.equal(d.f.llamadas.some(([n]) => n === 'quitar'), false, 'desactivar espera a la renovación en curso');
  soltar();
  assert.deepEqual(await renovando, { renovado: true });
  assert.deepEqual(await desactivando, { ok: true });
  assert.deepEqual(d.f.llamadas.filter(([n]) => n === 'registrar' || n === 'quitar'), [['registrar', TOKEN], ['quitar', TOKEN]]);
  assert.equal(d.almacen.datos.token, null);
  d.reloj.ahora = new Date('2026-11-09T08:00:00Z');
  assert.deepEqual(await d.g.renovarMovil(d.servidor), { renovado: false, motivo: 'disponible' }, 'desactivado, ya no se renueva');
});

test('renovación: si el sistema no contesta, suelta a los interruptores y no registra tarde', async () => {
  const r = renovacion({ plazoRenovacion: 30 });
  let entregar;
  r.push.obtenerToken = () => new Promise((resolver) => { entregar = resolver; });
  await assert.rejects(r.g.renovarMovil(r.servidor), /plazo/);
  assert.deepEqual(await r.g.desactivarMovil(), { ok: true }, 'desactivar no se queda esperando');
  assert.deepEqual(r.f.llamadas.filter(([n]) => n === 'quitar'), [['quitar', TOKEN]]);
  entregar({ ok: true, estado: 'permitido', token: TOKEN, plataforma: 'android' });
  for (let i = 0; i < 5; i++) await new Promise((resolver) => setImmediate(resolver));
  assert.equal(r.f.llamadas.some(([n]) => n === 'registrar'), false, 'el token que llega tarde no vuelve a apuntar el móvil');
  assert.equal(r.almacen.datos.token, null);
});

test('renovación: si se pasa de plazo ya registrando y se desactiva entretanto, deshace su registro', async () => {
  const r = renovacion({ plazoRenovacion: 30 });
  let soltar;
  r.f.avisos.registrarPush = (token, plataforma) => new Promise((resolver) => {
    soltar = () => { r.f.llamadas.push(['registrar', token, plataforma]); resolver(true); };
  });
  await assert.rejects(r.g.renovarMovil(r.servidor), /plazo/);
  assert.equal(typeof soltar, 'function', 'el plazo vence con la llamada a la base en curso');
  assert.deepEqual(await r.g.desactivarMovil(), { ok: true }, 'desactivar no espera');
  assert.equal(r.almacen.datos.token, null);
  soltar();
  for (let i = 0; i < 5; i++) await new Promise((resolver) => setImmediate(resolver));
  assert.deepEqual(r.f.llamadas.filter(([n]) => n === 'registrar' || n === 'quitar'),
    [['quitar', TOKEN], ['registrar', TOKEN, 'android'], ['quitar', TOKEN]], 'el registro tardío se deshace');
  assert.equal(r.almacen.datos.token, null, 'y no vuelve a guardar el token');
});

test('renovación: si otra activación cambió la clave mientras tanto, no la pisa y solo deshace un token distinto', async () => {
  for (const [tokenSistema, quitados] of [[TOKEN, [['quitar', TOKEN]]], [TOKEN_NUEVO, []]]) {
    const r = renovacion({ tokenSistema });
    let entregar;
    r.push.obtenerToken = () => new Promise((resolver) => { entregar = resolver; });
    const renovando = r.g.renovarMovil(r.servidor);
    for (let i = 0; i < 10 && !entregar; i++) await new Promise((resolver) => setImmediate(resolver));
    r.almacen.datos.token = TOKEN_NUEVO;
    entregar({ ok: true, estado: 'permitido', token: tokenSistema, plataforma: 'android' });
    assert.deepEqual(await renovando, { renovado: false, motivo: 'cambiado' }, tokenSistema);
    assert.deepEqual(r.f.llamadas.filter(([n]) => n === 'quitar'), quitados, tokenSistema);
    assert.equal(r.almacen.datos.token, TOKEN_NUEVO, 'la clave que manda es la que hay');
    assert.equal(r.almacen.llamadas.some(([n]) => n === 'guardarToken'), false);
  }
});

test('al activar el móvil queda apuntado como renovado ese día', async () => {
  const r = renovacion({ token: null });
  assert.deepEqual(await r.g.activarMovil(r.servidor), { ok: true, estado: 'activo' });
  assert.equal(r.almacen.datos.renovado, '2026-11-05');
  assert.deepEqual(await r.g.renovarMovil(r.servidor), { renovado: false, motivo: 'hecho-hoy' });
  assert.equal(r.f.llamadas.filter(([n]) => n === 'registrar').length, 1);
});
