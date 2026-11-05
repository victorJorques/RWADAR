'use strict';

/* Avisos de novedades de la cuenta (contrato del 05/11/2026:
   docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).

   Todo pasa por el cliente autenticado de la cuenta (`clienteCatalogo`), que
   revalida la identidad y el perfil antes de cada llamada, y por las cinco
   funciones RPC del contrato. Lo que devuelve el servidor se valida aquí con
   tipos estrictos: un enlace solo vale si es https://rwadar.pages.dev/…, y un
   aviso con un campo raro no se enseña. Este archivo no importa React Native,
   el SDK de notificaciones ni el almacenamiento: se los pasa quien lo usa. */
const { codigoNativoInstalado } = require('./actualizaciones-app');

// Cambiar una sola palabra del texto obliga a una versión nueva, en la base,
// la web y la app a la vez.
const VERSION_AVISOS = 'novedades-v1-2026-11-05';
const TEXTO_AVISOS_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.';
const TEXTO_AVISOS_EN = "I want to receive RWAdar notices by email and, if I turn them on in my phone, as notifications: new offers on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in every notice or in Profile. More information in Privacy.";
// La 1.4.1 (código 23) bloquea POST_NOTIFICATIONS y no lleva Firebase: las
// notificaciones del sistema llegan con el APK 1.4.2 (código 24).
const CODIGO_PUSH_MINIMO = 24;
const TIPOS_AVISO = Object.freeze(['bienvenida', 'ofertas', 'actualizacion', 'novedad']);
const DESTINOS_AVISO = Object.freeze(['inicio', 'buscar', 'academy']);
const PLATAFORMAS_PUSH = Object.freeze(['android', 'ios']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PUSH = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$/;
// La misma forma que exige la tabla `anuncios` de la base.
const ENLACE_AVISO = /^https:\/\/rwadar\.pages\.dev(\/[A-Za-z0-9._~%-]+)*\/?([?#][A-Za-z0-9._~%=&-]*)?$/;
const ENLACE_ACADEMY = /^https:\/\/rwadar\.pages\.dev\/academy(?:[/?#]|$)/;
const ID_AVISO = /^(?:bienvenida|[1-9]\d{0,18})$/;
const VERSION_TEXTO = /^[a-z0-9]+(?:-[a-z0-9]+){0,12}$/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const MAX_AVISOS = 50;

function fallo(code, status) {
  const error = new Error(code);
  error.code = code;
  if (status) error.status = status;
  return error;
}

function esObjeto(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const prototipo = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}

function textoValido(valor, max) {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.length <= max && !CONTROL.test(valor);
}

function fechaValida(valor) {
  return typeof valor === 'string' && valor.length <= 40 && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(valor)
    && Number.isFinite(Date.parse(valor));
}

function versionValida(valor) {
  return typeof valor === 'string' && valor.length <= 80 && VERSION_TEXTO.test(valor);
}

function enlaceAvisoValido(valor) {
  if (typeof valor !== 'string' || valor.length > 200 || !ENLACE_AVISO.test(valor)) return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && url.hostname === 'rwadar.pages.dev' && !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

function tokenPushValido(valor) {
  return typeof valor === 'string' && TOKEN_PUSH.test(valor);
}

// Capacidad del binario instalado, con la política nativeVersion «1.4.1(23)».
// Nunca se deduce de expo-application.
function capacidadPushNativa(runtimeVersion) {
  const codigo = codigoNativoInstalado(runtimeVersion);
  return Number.isInteger(codigo) && codigo >= CODIGO_PUSH_MINIMO;
}

function validarEstadoAvisos(datos) {
  if (!esObjeto(datos)) throw fallo('avisos_respuesta_invalida');
  const { novedades, version, aceptado_el: aceptadoEl, version_vigente: versionVigente,
    texto_es: textoEs, texto_en: textoEn, dispositivos, correo_activo: correoActivo, push_activo: pushActivo } = datos;
  if (typeof novedades !== 'boolean' || typeof correoActivo !== 'boolean' || typeof pushActivo !== 'boolean'
    || !(version === null || versionValida(version)) || !(aceptadoEl === null || fechaValida(aceptadoEl))
    || !versionValida(versionVigente) || !textoValido(textoEs, 1000) || !textoValido(textoEn, 1000)
    || !Number.isSafeInteger(dispositivos) || dispositivos < 0 || dispositivos > 50) {
    throw fallo('avisos_respuesta_invalida');
  }
  return {
    novedades, version, aceptadoEl: aceptadoEl === null ? null : new Date(aceptadoEl).toISOString(),
    versionVigente, dispositivos, correoActivo, pushActivo,
    // La app solo pide el permiso con el texto que lleva dentro. Si la base
    // tiene otro, desde esta versión se puede dar de baja, pero no activar.
    textoVigente: versionVigente === VERSION_AVISOS && textoEs === TEXTO_AVISOS_ES && textoEn === TEXTO_AVISOS_EN,
  };
}

function validarAviso(fila) {
  if (!esObjeto(fila)) return null;
  const { id, tipo, titulo, texto, enlace, creado_el: creadoEl } = fila;
  if (!TIPOS_AVISO.includes(tipo)) return null;
  const bienvenida = tipo === 'bienvenida';
  if (typeof id !== 'string' || !ID_AVISO.test(id) || (id === 'bienvenida') !== bienvenida) return null;
  if (!textoValido(titulo, 120) || !textoValido(texto, 600)) return null;
  if (!(enlace === null || enlaceAvisoValido(enlace))) return null;
  if (!(fechaValida(creadoEl) || (bienvenida && creadoEl === null))) return null;
  return { id, tipo, titulo: titulo.trim(), texto: texto.trim(), enlace,
    creadoEl: creadoEl === null ? null : new Date(creadoEl).toISOString() };
}

// Un aviso con un campo que no cumple el contrato se descarta; una respuesta
// que no es una lista, entera.
function validarAvisosRecientes(datos, limite = MAX_AVISOS) {
  if (!Array.isArray(datos) || datos.length > MAX_AVISOS) throw fallo('avisos_respuesta_invalida');
  const vistos = new Set(), lista = [];
  for (const fila of datos) {
    const aviso = validarAviso(fila);
    if (!aviso || vistos.has(aviso.id)) continue;
    vistos.add(aviso.id);
    lista.push(aviso);
  }
  return lista.slice(0, limite);
}

/* Datos de una notificación tocada. Solo dos formas: la de las novedades
   ({tipo, destino}) y el slug editorial antiguo. Todo lo demás se ignora: el
   contenido nunca se usa como URL ni como ruta libre. */
function aperturaDesdeDatosAviso(datos) {
  if (!esObjeto(datos)) return null;
  if (Object.hasOwn(datos, 'tipo') || Object.hasOwn(datos, 'destino')) {
    return TIPOS_AVISO.includes(datos.tipo) && DESTINOS_AVISO.includes(datos.destino)
      ? { tipo: datos.tipo, destino: datos.destino } : null;
  }
  const slug = datos.slug;
  if (typeof slug !== 'string' || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return { slug };
}

// Adónde lleva un aviso de la tarjeta de Inicio, dentro de la app si se puede.
function destinoAviso(aviso) {
  if (!aviso) return null;
  if (aviso.tipo === 'ofertas') return { destino: 'ofertas-nuevas' };
  if (aviso.tipo === 'bienvenida' || (aviso.enlace && ENLACE_ACADEMY.test(aviso.enlace))) return { destino: 'academy' };
  if (aviso.enlace && enlaceAvisoValido(aviso.enlace)) return { destino: 'web', url: aviso.enlace };
  return null;
}

function errorServidor(error, status) {
  if (error?.code === '42501' || error?.status === 401 || status === 401) return fallo('sin_sesion', 401);
  return fallo('avisos_no_disponibles', error?.status || status);
}

/* Llamadas RPC con la sesión de la cuenta. Igual que la cartera: se cancelan
   si la cuenta cambia o se cierra mientras esperan. */
function crearAvisosCuenta({ cuenta, usuarioId, vigente = () => true } = {}) {
  if (!UUID.test(usuarioId || '') || typeof cuenta?.clienteCatalogo !== 'function' || typeof cuenta?.estado !== 'function') {
    throw fallo('sin_sesion', 401);
  }
  let activa = true;
  const abortos = new Set();
  function cerrar() { activa = false; for (const abort of abortos) abort.abort(); }
  function actual(signal) {
    if (!activa || !vigente() || signal?.aborted || cuenta.estado().usuario?.id !== usuarioId) throw fallo('cancelada');
  }
  const desuscribir = typeof cuenta.suscribir === 'function'
    ? cuenta.suscribir(estado => { if (estado?.usuario?.id !== usuarioId) cerrar(); }) : null;
  async function rpc(nombre, argumentos) {
    actual();
    const abort = new AbortController();
    abortos.add(abort);
    try {
      const cliente = await cuenta.clienteCatalogo(); actual(abort.signal);
      let consulta = cliente.rpc(nombre, argumentos);
      if (typeof consulta?.abortSignal === 'function') consulta = consulta.abortSignal(abort.signal);
      const resultado = await consulta; actual(abort.signal);
      if (resultado?.error) throw errorServidor(resultado.error, resultado.status);
      return resultado?.data;
    } finally {
      abortos.delete(abort);
    }
  }
  return {
    async estado() {
      return validarEstadoAvisos(await rpc('estado_mis_avisos', {}));
    },
    async configurar(activar) {
      if (typeof activar !== 'boolean') throw fallo('avisos_parametro_invalido');
      const estado = validarEstadoAvisos(await rpc('configurar_avisos_novedades',
        { p_activar: activar, p_version: VERSION_AVISOS, p_canal: 'app' }));
      if (estado.novedades !== activar) throw fallo('avisos_respuesta_invalida');
      return estado;
    },
    async registrarPush(token, plataforma) {
      if (!tokenPushValido(token) || !PLATAFORMAS_PUSH.includes(plataforma)) throw fallo('avisos_parametro_invalido');
      if (await rpc('registrar_aviso_push', { p_token: token, p_plataforma: plataforma }) !== true) {
        throw fallo('avisos_respuesta_invalida');
      }
      return true;
    },
    async quitarPush(token) {
      if (!tokenPushValido(token)) throw fallo('avisos_parametro_invalido');
      const quitado = await rpc('quitar_aviso_push', { p_token: token });
      if (typeof quitado !== 'boolean') throw fallo('avisos_respuesta_invalida');
      return quitado;
    },
    async recientes(limite = 10) {
      if (!Number.isInteger(limite) || limite < 1 || limite > MAX_AVISOS) throw fallo('avisos_parametro_invalido');
      return validarAvisosRecientes(await rpc('mis_avisos_recientes', { p_limite: limite }), limite);
    },
    destruir() { cerrar(); desuscribir?.(); },
  };
}

/* Al cerrar sesión: quita el móvil de los avisos con la sesión que se cierra,
   antes de revocarla. Quien la llama decide el plazo y no espera al fallo. */
async function quitarPushConCliente(cliente, token) {
  if (!tokenPushValido(token) || typeof cliente?.rpc !== 'function') throw fallo('avisos_parametro_invalido');
  const resultado = await cliente.rpc('quitar_aviso_push', { p_token: token });
  if (resultado?.error) throw errorServidor(resultado.error, resultado.status);
  if (typeof resultado?.data !== 'boolean') throw fallo('avisos_respuesta_invalida');
  return resultado.data;
}

/* Lo que hacen los dos interruptores de Perfil › Avisos y la tarjeta de
   Inicio. Sin React ni SDK: `push` y `almacen` llegan inyectados.
   - push.capacidad: binario con código >= 24 (sin eso no se llama al SDK);
   - push.consultar(): permiso del sistema, sin pedirlo;
   - push.obtenerToken({ solicitarPermiso }): permiso y token, tras una
     pulsación explícita;
   - almacen: avisos leídos y token de este móvil, por cuenta. */
function crearGestorAvisosNovedades({ avisosCuenta, usuarioId, push, almacen } = {}) {
  if (!avisosCuenta || !UUID.test(usuarioId || '') || !push || !almacen) throw fallo('sin_sesion', 401);
  const capacidad = push.capacidad === true;

  async function estadoMovil(servidor) {
    // Por debajo del código 24 no se toca el SDK de notificaciones.
    if (!capacidad) return { estado: 'requiere-version', activo: false, puedeActivar: false, puedeDesactivar: false };
    const token = await almacen.token(usuarioId);
    const activo = tokenPushValido(token);
    if (!servidor?.pushActivo) {
      return { estado: 'servicio-pendiente', activo, puedeActivar: false, puedeDesactivar: activo };
    }
    const sistema = await push.consultar();
    const estadoSistema = sistema?.estado;
    if (['no-compatible', 'emulador', 'expo-go', 'configuracion-pendiente', 'desactivados', 'requiere-version'].includes(estadoSistema)) {
      return { estado: 'no-disponible', motivo: estadoSistema, activo, puedeActivar: false, puedeDesactivar: activo };
    }
    if (activo) {
      return { estado: estadoSistema === 'permitido' ? 'activo' : 'sin-permiso', activo: true,
        puedeActivar: false, puedeDesactivar: true };
    }
    if (estadoSistema === 'denegado') return { estado: 'denegado', activo: false, puedeActivar: false, puedeDesactivar: false };
    return { estado: 'disponible', activo: false, puedeActivar: true, puedeDesactivar: false };
  }

  return {
    capacidad,
    async cargarPerfil() {
      const servidor = await avisosCuenta.estado();
      return { servidor, movil: await estadoMovil(servidor) };
    },
    estadoMovil,
    async alternarNovedades(activar, servidor) {
      if (activar === true && servidor?.textoVigente !== true) throw fallo('avisos_texto_desfasado');
      return avisosCuenta.configurar(activar === true);
    },
    async activarMovil(servidor) {
      if (!capacidad) return { ok: false, estado: 'requiere-version' };
      if (!servidor?.pushActivo) return { ok: false, estado: 'servicio-pendiente' };
      const resultado = await push.obtenerToken({ solicitarPermiso: true });
      if (!resultado?.ok || !tokenPushValido(resultado.token)) {
        return { ok: false, estado: resultado?.estado || 'error' };
      }
      const anterior = await almacen.token(usuarioId);
      await avisosCuenta.registrarPush(resultado.token, resultado.plataforma);
      await almacen.guardarToken(usuarioId, resultado.token);
      // Si el sistema cambió el token, el anterior deja de servir.
      if (tokenPushValido(anterior) && anterior !== resultado.token) {
        try { await avisosCuenta.quitarPush(anterior); } catch { /* Lo limpia la base a los 180 días. */ }
      }
      return { ok: true, estado: 'activo' };
    },
    async desactivarMovil() {
      const token = await almacen.token(usuarioId);
      if (tokenPushValido(token)) await avisosCuenta.quitarPush(token);
      await almacen.borrarToken(usuarioId);
      return { ok: true };
    },
    async cargarRecientes(limite = 10) {
      const [avisos, leidos] = await Promise.all([avisosCuenta.recientes(limite), almacen.leidos(usuarioId)]);
      return { avisos, leidos };
    },
    marcarLeidos(ids) {
      return almacen.marcarLeidos(usuarioId, ids);
    },
  };
}

module.exports = {
  VERSION_AVISOS, TEXTO_AVISOS_ES, TEXTO_AVISOS_EN, CODIGO_PUSH_MINIMO, TIPOS_AVISO, DESTINOS_AVISO,
  capacidadPushNativa, tokenPushValido, enlaceAvisoValido, validarEstadoAvisos, validarAvisosRecientes,
  aperturaDesdeDatosAviso, destinoAviso, crearAvisosCuenta, quitarPushConCliente, crearGestorAvisosNovedades,
};
