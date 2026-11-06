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
const { obtenerIdioma } = require('./idioma');

// Cambiar una sola palabra del texto obliga a una versión nueva, en la base,
// la web y la app a la vez. La v2 sale de la revisión legal del 06/11/2026
// (con la v1 nunca se recogió ningún permiso: la casilla nunca se mostró).
const VERSION_AVISOS = 'novedades-v2-2026-11-06';
const TEXTO_AVISOS_ES = 'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.';
const TEXTO_AVISOS_EN = "I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: new listings on the radar and news about the website and the app. It's optional: the Academy unlocks anyway. You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your phone settings. More information in Privacy.";
// Información básica (primera capa). Va fuera del texto versionado, junto a
// la casilla del alta y junto al interruptor de Perfil. El inglés sale del
// diccionario compartido con la web.
const INFO_BASICA_ES = 'Información básica sobre tus datos. Responsable: Víctor Manuel Jorques Granero (RWAdar). Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en RWAdar@protonmail.com; también puedes reclamar ante la AEPD. Más información en Privacidad.';
const INFO_BASICA_EN = 'Basic information about your data. Controller: Víctor Manuel Jorques Granero (RWAdar). Data: your email, your password and, if you give it, your name; with notices, also your consent and, if you turn on notifications, a delivery identifier for your phone. Purpose: your account, which also opens the Academy, and, only if you tick the notices box, sending you those notices. Legal basis: the service you request (account) and your consent (notices), which you can withdraw at any time without affecting what came before. Providers: Supabase, Cloudflare and Google; for notices, Lettermint and Expo. Some process data outside the EU with safeguards. Rights: access, rectification, erasure, objection, restriction and portability, in Profile or at RWAdar@protonmail.com; you can also complain to the AEPD (Spanish Data Protection Agency). More information in Privacy.';
const IDIOMAS_AVISOS = Object.freeze(['es', 'en']);
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
// Lo más que una renovación en segundo plano retiene a los interruptores.
const PLAZO_RENOVACION_MS = 20000;

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

/* Idioma en que se ha visto el texto del permiso: se guarda con él. Solo
   'es' o 'en'; si quien llama no lo dice, el de la app en ese momento. */
function idiomaAvisos(valor) {
  if (IDIOMAS_AVISOS.includes(valor)) return valor;
  return obtenerIdioma() === 'en' ? 'en' : 'es';
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
    async configurar(activar, idioma) {
      if (typeof activar !== 'boolean') throw fallo('avisos_parametro_invalido');
      const estado = validarEstadoAvisos(await rpc('configurar_avisos_novedades',
        { p_activar: activar, p_version: VERSION_AVISOS, p_canal: 'app', p_idioma: idiomaAvisos(idioma) }));
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
    /* ¿Sigue este token en la cuenta? Lo dice public.mi_aviso_push_registrado
       cuando la base la tenga. Sin ella (404), con un error o con una
       respuesta que no es booleana, «desconocido» (null): no se deduce nada. */
    async pushRegistrado(token) {
      if (!tokenPushValido(token)) throw fallo('avisos_parametro_invalido');
      try {
        const registrado = await rpc('mi_aviso_push_registrado', { p_token: token });
        return typeof registrado === 'boolean' ? registrado : null;
      } catch (error) {
        if (error?.code === 'cancelada') throw error;
        return null;
      }
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
   - push.obtenerToken({ solicitarPermiso }): permiso y token; solo pide el
     permiso tras una pulsación explícita;
   - almacen: avisos leídos, token de este móvil y día de la última
     renovación, por cuenta;
   - ahora(): reloj, inyectable en las pruebas. */
function crearGestorAvisosNovedades({ avisosCuenta, usuarioId, push, almacen, ahora = () => new Date(),
  plazoRenovacion = PLAZO_RENOVACION_MS } = {}) {
  if (!avisosCuenta || !UUID.test(usuarioId || '') || !push || !almacen) throw fallo('sin_sesion', 401);
  const capacidad = push.capacidad === true;
  // Activar, desactivar y renovar van de una en una: una renovación en curso
  // no puede volver a apuntar un móvil que se acaba de desactivar. La
  // renovación tiene plazo para no dejar esperando a los interruptores.
  let cola = Promise.resolve();
  function enCola(tarea) {
    const resultado = cola.then(tarea, tarea);
    cola = resultado.catch(() => {});
    return resultado;
  }
  const hoy = () => ahora().toISOString().slice(0, 10);

  async function registradoEnServidor(token) {
    if (typeof avisosCuenta.pushRegistrado !== 'function') return null;
    try {
      return await avisosCuenta.pushRegistrado(token);
    } catch (error) {
      if (error?.code === 'cancelada') throw error;
      return null;
    }
  }

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
    if (activo && estadoSistema !== 'permitido') {
      return { estado: 'sin-permiso', activo: true, puedeActivar: false, puedeDesactivar: true };
    }
    if (activo) {
      // La base borra los móviles que no se renuevan en 180 días y los que
      // Expo da por perdidos. Si dice que este ya no está, no se enseña como
      // activo y se puede volver a activar. Si no lo sabe, se confía en el token.
      if (await registradoEnServidor(token) === false) {
        return { estado: 'no-registrado', activo: false, puedeActivar: true, puedeDesactivar: false };
      }
      return { estado: 'activo', activo: true, puedeActivar: false, puedeDesactivar: true };
    }
    if (estadoSistema === 'denegado') return { estado: 'denegado', activo: false, puedeActivar: false, puedeDesactivar: false };
    return { estado: 'disponible', activo: false, puedeActivar: true, puedeDesactivar: false };
  }

  /* La base borra los móviles cuyo registro no se renueva en 180 días. Con
     la cuenta abierta, el binario 1.4.2, el push encendido en la base, el
     permiso del sistema ya concedido y el móvil activo, se vuelve a registrar
     el token actual como mucho una vez al día. Nunca pide permiso. Tras
     registrar vuelve a leer la clave del token: si se borró entretanto, deshace
     el registro. */
  async function renovar(servidor, movil, intento) {
    // Por debajo del código 24 no se toca el SDK ni el almacén.
    if (!capacidad) return { renovado: false, motivo: 'requiere-version' };
    if (!servidor?.pushActivo) return { renovado: false, motivo: 'servicio-pendiente' };
    const dia = hoy();
    if (await almacen.renovadoEl(usuarioId) === dia) return { renovado: false, motivo: 'hecho-hoy' };
    const estado = movil || await estadoMovil(servidor);
    if (estado?.estado !== 'activo') return { renovado: false, motivo: estado?.estado || 'error' };
    const anterior = await almacen.token(usuarioId);
    if (!tokenPushValido(anterior)) return { renovado: false, motivo: 'sin-token' };
    // Se apunta antes de llamar: un intento al día como mucho, salga como salga.
    await almacen.marcarRenovado(usuarioId, dia);
    const resultado = await push.obtenerToken({ solicitarPermiso: false });
    if (!resultado?.ok || !tokenPushValido(resultado.token)) {
      return { renovado: false, motivo: resultado?.estado || 'error' };
    }
    // Si se pasó del plazo, los interruptores ya siguieron: no se registra tarde.
    if (!intento.vigente) return { renovado: false, motivo: 'plazo' };
    await avisosCuenta.registrarPush(resultado.token, resultado.plataforma);
    /* La clave del token manda. «Borrar datos del dispositivo» la quita fuera
       de esta cola, y «desactivar» puede entrar si la renovación se pasó de
       plazo. Si mientras se esperaba al sistema o a la base la clave ya no
       está (o la cambió otra activación), lo recién registrado no puede
       quedarse en la base sin dueño en este móvil: se quita y no se guarda
       nada. */
    const actual = await almacen.token(usuarioId);
    if (actual !== anterior) {
      if (resultado.token !== actual) {
        try { await avisosCuenta.quitarPush(resultado.token); } catch { /* Lo limpia la base a los 180 días. */ }
      }
      return { renovado: false, motivo: tokenPushValido(actual) ? 'cambiado' : 'borrado' };
    }
    // Si el sistema cambió el token, el anterior deja de servir.
    if (resultado.token !== anterior) {
      await almacen.guardarToken(usuarioId, resultado.token);
      try { await avisosCuenta.quitarPush(anterior); } catch { /* Lo limpia la base a los 180 días. */ }
    }
    return { renovado: true };
  }

  return {
    capacidad,
    async cargarPerfil() {
      const servidor = await avisosCuenta.estado();
      return { servidor, movil: await estadoMovil(servidor) };
    },
    estadoMovil,
    async alternarNovedades(activar, servidor, idioma) {
      if (activar === true && servidor?.textoVigente !== true) throw fallo('avisos_texto_desfasado');
      return avisosCuenta.configurar(activar === true, idioma);
    },
    activarMovil(servidor) {
      return enCola(async () => {
        if (!capacidad) return { ok: false, estado: 'requiere-version' };
        if (!servidor?.pushActivo) return { ok: false, estado: 'servicio-pendiente' };
        const resultado = await push.obtenerToken({ solicitarPermiso: true });
        if (!resultado?.ok || !tokenPushValido(resultado.token)) {
          return { ok: false, estado: resultado?.estado || 'error' };
        }
        const anterior = await almacen.token(usuarioId);
        await avisosCuenta.registrarPush(resultado.token, resultado.plataforma);
        await almacen.guardarToken(usuarioId, resultado.token);
        // Recién registrado: hoy no hace falta renovarlo.
        try { await almacen.marcarRenovado?.(usuarioId, hoy()); } catch { /* Se renovará otro día. */ }
        // Si el sistema cambió el token, el anterior deja de servir.
        if (tokenPushValido(anterior) && anterior !== resultado.token) {
          try { await avisosCuenta.quitarPush(anterior); } catch { /* Lo limpia la base a los 180 días. */ }
        }
        return { ok: true, estado: 'activo' };
      });
    },
    desactivarMovil() {
      return enCola(async () => {
        const token = await almacen.token(usuarioId);
        if (tokenPushValido(token)) await avisosCuenta.quitarPush(token);
        await almacen.borrarToken(usuarioId);
        return { ok: true };
      });
    },
    renovarMovil(servidor, movil = null) {
      return enCola(() => new Promise((resolver, rechazar) => {
        const intento = { vigente: true };
        const reloj = setTimeout(() => { intento.vigente = false; rechazar(fallo('plazo')); }, plazoRenovacion);
        renovar(servidor, movil, intento).then(resolver, rechazar).finally(() => clearTimeout(reloj));
      }));
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
  VERSION_AVISOS, TEXTO_AVISOS_ES, TEXTO_AVISOS_EN, INFO_BASICA_ES, INFO_BASICA_EN, CODIGO_PUSH_MINIMO, TIPOS_AVISO,
  DESTINOS_AVISO, idiomaAvisos, capacidadPushNativa, tokenPushValido, enlaceAvisoValido, validarEstadoAvisos, validarAvisosRecientes,
  aperturaDesdeDatosAviso, destinoAviso, crearAvisosCuenta, quitarPushConCliente, crearGestorAvisosNovedades,
};
