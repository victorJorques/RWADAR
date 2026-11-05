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

test('versión y textos de la casilla: los del contrato, en la app y en el diccionario compartido', () => {
  assert.equal(a.VERSION_AVISOS, 'novedades-v1-2026-11-05');
  assert.equal(a.TEXTO_AVISOS_ES, 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.');
  assert.equal(a.TEXTO_AVISOS_EN, "I want to receive RWAdar notices by email and, if I turn them on in my phone, as notifications: new offers on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in every notice or in Profile. More information in Privacy.");
  // La app enseña el texto en inglés a través del diccionario compartido con la web.
  assert.equal(idioma.ingles(a.TEXTO_AVISOS_ES), a.TEXTO_AVISOS_EN);
  assert.equal(a.CODIGO_PUSH_MINIMO, 24);
});

const CONTRATO = path.resolve(__dirname, '../../docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md');
test('los textos coinciden palabra por palabra con el contrato', { skip: !fs.existsSync(CONTRATO) && 'el contrato no está en esta copia' }, () => {
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
  assert.equal(await avisos.registrarPush(TOKEN, 'android'), true);
  assert.equal(await avisos.quitarPush(TOKEN), false);
  assert.equal((await avisos.recientes(5))[0].id, 'bienvenida');
  assert.deepEqual(f.llamadas.filter(([n]) => n !== 'clienteCatalogo'), [
    ['estado_mis_avisos', {}],
    ['configurar_avisos_novedades', { p_activar: true, p_version: 'novedades-v1-2026-11-05', p_canal: 'app' }],
    ['configurar_avisos_novedades', { p_activar: false, p_version: 'novedades-v1-2026-11-05', p_canal: 'app' }],
    ['registrar_aviso_push', { p_token: TOKEN, p_plataforma: 'android' }],
    ['quitar_aviso_push', { p_token: TOKEN }],
    ['mis_avisos_recientes', { p_limite: 5 }],
  ]);
  assert.equal(f.llamadas.filter(([n]) => n === 'clienteCatalogo').length, 6, 'cada llamada revalida la cuenta');
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

function almacenFalso(token = null) {
  const datos = { leidos: [], token };
  const llamadas = [];
  return { datos, llamadas, almacen: {
    async leidos(uid) { llamadas.push(['leidos', uid]); return datos.leidos; },
    async marcarLeidos(uid, ids) { llamadas.push(['marcar', uid, ids]); datos.leidos = [...new Set([...ids, ...datos.leidos])]; return datos.leidos; },
    async token(uid) { llamadas.push(['token', uid]); return datos.token; },
    async guardarToken(uid, t) { llamadas.push(['guardarToken', uid]); datos.token = t; },
    async borrarToken(uid) { llamadas.push(['borrarToken', uid]); datos.token = null; },
  } };
}
function avisosFalsos(servidor = a.validarEstadoAvisos(estadoServidor())) {
  const llamadas = [];
  return { llamadas, avisos: {
    async estado() { llamadas.push(['estado']); return servidor; },
    async configurar(activar) { llamadas.push(['configurar', activar]); return { ...servidor, novedades: activar }; },
    async registrarPush(token, plataforma) { llamadas.push(['registrar', token, plataforma]); return true; },
    async quitarPush(token) { llamadas.push(['quitar', token]); return true; },
    async recientes(limite) { llamadas.push(['recientes', limite]); return []; },
  } };
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
  assert.deepEqual(f.llamadas.filter(([n]) => n === 'configurar'), [['configurar', false], ['configurar', true]]);
});
