import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { MODO_LOCAL, SERVICIOS_USUARIO_REMOTOS, AVISOS_NOVEDADES_REMOTOS } from './modo-local';
import { aperturaDesdeDatosAviso, capacidadPushNativa, tokenPushValido } from './avisos-cuenta';
import { traducir } from './idioma';

const SERVICIOS_ACTIVOS = !MODO_LOCAL && SERVICIOS_USUARIO_REMOTOS === true;
// Avisos de novedades de la cuenta (contrato del 05/11/2026). Independientes
// de las instalaciones antiguas, que siguen cerradas.
const NOVEDADES_ACTIVAS = !MODO_LOCAL && AVISOS_NOVEDADES_REMOTOS === true;
/* Dos canales de Android, con los mismos `channelId` con que envía la base:
   «cuenta» para los avisos de servicio (la bienvenida) y «novedades» para los
   anuncios. Así, quien desactiva las novedades en los ajustes del móvil o
   desde la propia notificación no deja de recibir los avisos de su cuenta, y
   al revés. Solo se crean en binarios con capacidad push (1.4.2 o posterior). */
export const CANALES_AVISOS = Object.freeze([
  Object.freeze({ id: 'cuenta', nombre: 'Avisos de tu cuenta',
    descripcion: 'Avisos de servicio de tu cuenta, como la bienvenida.' }),
  Object.freeze({ id: 'novedades', nombre: 'Novedades de RWAdar',
    descripcion: 'Fichas nuevas en el radar y novedades de la web y la app.' }),
]);
let moduloSupabase = SERVICIOS_ACTIVOS ? require('./supabase') : null;
function supabaseRemoto() {
  if (!SERVICIOS_ACTIVOS) throw new Error('Los servicios remotos de usuario están desactivados');
  if (!moduloSupabase) throw new Error('No se pudo cargar el cliente remoto');
  return moduloSupabase;
}

/* Este módulo prepara permiso, token y registro. El panel no declara entrega
   activa hasta que el proceso de envío exista y la bandera operativa esté
   activada de forma explícita. */
if (SERVICIOS_ACTIVOS) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

function proyectoEas() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

function envioPushOperativo() {
  return Constants?.expoConfig?.extra?.rwadar?.pushDeliveryEnabled === true;
}

function permisoConcedido(permiso) {
  return permiso.granted ||
    permiso.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/* El contenido de una notificacion es entrada remota. Aunque hoy lo genera
   nuestro backend, nunca se usa como URL ni como ruta libre: solo aceptamos el
   mismo formato acotado que tienen los slugs editoriales de RWAdar. */
export function slugDesdeRespuestaAviso(respuesta) {
  const slug = respuesta?.notification?.request?.content?.data?.slug;
  if (typeof slug !== 'string' || slug.length > 80) return null;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

/* Capacidad del binario instalado para las notificaciones de novedades: la
   1.4.1 (código 23) bloquea POST_NOTIFICATIONS y no lleva Firebase. Solo se
   lee runtimeVersion de expo-updates; por debajo del código 24 nunca se llama
   al SDK de notificaciones. */
export function capacidadPushNovedades() {
  if (!NOVEDADES_ACTIVAS || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return false;
  try {
    return capacidadPushNativa(require('expo-updates').runtimeVersion);
  } catch {
    return false;
  }
}

/* Con la app abierta, una notificación de novedades se enseña como banner.
   Solo con capacidad nativa y una sola vez. */
let manejadorNovedades = false;
function prepararNotificacionesNovedades() {
  if (manejadorNovedades || SERVICIOS_ACTIVOS) return;
  manejadorNovedades = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/* Observa exclusivamente interacciones del usuario. Consultar la ultima
   respuesta y registrar el listener no solicita permisos ni crea un token.
   Se cubren tanto el arranque en frio como un toque con la app abierta.
   `onAbrir` recibe el slug editorial antiguo; `onDestino`, las novedades
   ({tipo, destino}) del contrato del 05/11/2026. Lo demás se ignora. */
export function observarAperturasAvisos(onAbrir, { onDestino } = {}) {
  const conDestino = typeof onDestino === 'function' && capacidadPushNovedades();
  // El slug antiguo se sigue aceptando donde hay un observador activo.
  const conSlug = typeof onAbrir === 'function' && (SERVICIOS_ACTIVOS || conDestino);
  if (Platform.OS === 'web' || (!conSlug && !conDestino)) return () => {};

  let activo = true;
  const atendidas = new Set();
  const manejar = async (respuesta) => {
    if (!activo) return;
    const accion = respuesta?.actionIdentifier;
    if (accion && Notifications.DEFAULT_ACTION_IDENTIFIER &&
        accion !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const apertura = aperturaDesdeDatosAviso(respuesta?.notification?.request?.content?.data);
    if (!apertura || (apertura.slug ? !conSlug : !conDestino)) return;
    const identificador = respuesta?.notification?.request?.identifier;
    if (identificador && atendidas.has(identificador)) return;
    if (identificador) atendidas.add(identificador);

    try {
      const abierta = await (apertura.slug ? onAbrir(apertura.slug)
        : onDestino({ tipo: apertura.tipo, destino: apertura.destino }));
      if (abierta === false) {
        if (identificador) atendidas.delete(identificador);
        return;
      }
      await Notifications.clearLastNotificationResponseAsync();
    } catch {
      if (identificador) atendidas.delete(identificador);
    }
  };

  let suscripcion;
  try {
    if (conDestino) prepararNotificacionesNovedades();
    suscripcion = Notifications.addNotificationResponseReceivedListener(
      (respuesta) => { void manejar(respuesta); },
    );
    Notifications.getLastNotificationResponseAsync()
      .then((respuesta) => { if (respuesta) void manejar(respuesta); })
      .catch(() => {});
  } catch {
    return () => { activo = false; };
  }

  return () => {
    activo = false;
    suscripcion?.remove();
  };
}

/* Con la app abierta, al llegar un aviso de RWAdar se vuelve a cargar la
   bandeja para que el «1» de Inicio lo cuente al momento. No pide permisos ni
   crea tokens. Devuelve la función para dejar de escuchar. */
export function observarAvisosRecibidos(alRecibir) {
  if (Platform.OS === 'web' || typeof alRecibir !== 'function' || !capacidadPushNovedades()) return () => {};
  let suscripcion;
  try {
    suscripcion = Notifications.addNotificationReceivedListener((notificacion) => {
      if (aperturaDesdeDatosAviso(notificacion?.request?.content?.data)) alRecibir();
    });
  } catch {
    return () => {};
  }
  return () => { suscripcion?.remove(); };
}

/* Al marcar los avisos como leídos dentro de la app, se quitan también sus
   notificaciones de la bandeja del sistema, para que el punto o el número
   del icono cuadre con el «1» de Inicio. Solo las de RWAdar con datos de
   aviso válidos. Nunca setBadgeCountAsync en Android: con 0 borra todas las
   notificaciones (cancelAll) y con más de 0 depende de permisos de los
   lanzadores que esta app no declara (app.json). */
export async function retirarNotificacionesAvisos() {
  if (Platform.OS === 'web' || !capacidadPushNovedades()) return 0;
  try {
    const presentes = await Notifications.getPresentedNotificationsAsync();
    let quitadas = 0;
    for (const notificacion of Array.isArray(presentes) ? presentes : []) {
      const id = notificacion?.request?.identifier;
      if (!id || !aperturaDesdeDatosAviso(notificacion?.request?.content?.data)) continue;
      await Notifications.dismissNotificationAsync(id);
      quitadas += 1;
    }
    return quitadas;
  } catch {
    return 0;
  }
}

function resultadoPreparado() {
  const envioActivo = envioPushOperativo();
  return {
    ok: true,
    estado: envioActivo ? 'activo' : 'preparado',
    envioActivo,
  };
}

/* Consulta pasiva: nunca abre el diálogo del sistema ni crea una identidad. */
export async function consultarEstadoAvisos() {
  try {
    if (MODO_LOCAL) return { ok: false, estado: 'local', local: true };
    if (!SERVICIOS_ACTIVOS) return { ok: false, estado: 'desactivados' };
    if (Platform.OS === 'web') return { ok: false, estado: 'no-compatible' };
    if (!Device.isDevice) return { ok: false, estado: 'emulador' };
    if (Platform.OS === 'android' && isRunningInExpoGo()) {
      return { ok: false, estado: 'expo-go' };
    }

    const projectId = proyectoEas();
    if (!projectId) return { ok: false, estado: 'configuracion-pendiente' };

    const permiso = await Notifications.getPermissionsAsync();
    if (!permisoConcedido(permiso)) {
      return {
        ok: false,
        estado: permiso.canAskAgain ? 'disponible' : 'denegado',
      };
    }

    const { clienteDispositivo, idInstalacionExistente } = supabaseRemoto();
    const instalacion = await idInstalacionExistente();
    if (!instalacion) return { ok: false, estado: 'disponible' };
    const sb = await clienteDispositivo({ crear: false });
    const { data: dispositivo } = await sb
      .from('dispositivos')
      .select('token_push')
      .eq('instalacion', instalacion)
      .maybeSingle()
      .throwOnError();

    if (!dispositivo?.token_push) {
      return { ok: false, estado: 'registro-pendiente' };
    }
    return resultadoPreparado();
  } catch (error) {
    return {
      ok: false,
      estado: 'error',
      motivo: error?.message || 'no se pudo comprobar el estado',
    };
  }
}

/* Solo debe llamarse tras una pulsación explícita en el panel de avisos. */
export async function registrarParaAvisos({ solicitarPermiso = false } = {}) {
  try {
    if (MODO_LOCAL) return { ok: false, estado: 'local', local: true };
    if (!SERVICIOS_ACTIVOS) return { ok: false, estado: 'desactivados' };
    if (Platform.OS === 'web') return { ok: false, estado: 'no-compatible' };
    if (!Device.isDevice) return { ok: false, estado: 'emulador' };
    if (Platform.OS === 'android' && isRunningInExpoGo()) {
      return { ok: false, estado: 'expo-go' };
    }

    const projectId = proyectoEas();
    if (!projectId) return { ok: false, estado: 'configuracion-pendiente' };

    /* Android 13 no muestra el permiso ni entrega token hasta que existe al
       menos un canal, según la documentación versionada de SDK 57. */
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('cambios-estado', {
        name: 'Cambios de estado',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 120, 180],
        lightColor: '#25E39A',
      });
    }

    let permiso = await Notifications.getPermissionsAsync();
    if (!permisoConcedido(permiso)) {
      if (!solicitarPermiso) {
        return {
          ok: false,
          estado: permiso.canAskAgain ? 'disponible' : 'denegado',
        };
      }
      if (!permiso.canAskAgain) return { ok: false, estado: 'denegado' };
      permiso = await Notifications.requestPermissionsAsync();
    }
    if (!permisoConcedido(permiso)) return { ok: false, estado: 'denegado' };

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) throw new Error('Expo no devolvió un token push');

    const { clienteDispositivo, idInstalacion } = supabaseRemoto();
    const sb = await clienteDispositivo();
    const instalacion = await idInstalacion();
    await sb
      .from('dispositivos')
      .upsert({
        instalacion,
        token_push: token,
        sistema: ['ios', 'android', 'web'].includes(Platform.OS) ? Platform.OS : 'web',
        version_app: Constants?.expoConfig?.version || null,
        visto_el: new Date().toISOString(),
      }, { onConflict: 'instalacion' })
      .throwOnError();

    /* El token no sale de esta función: es un identificador de entrega y no
       debe acabar accidentalmente en logs, telemetría o mensajes. */
    return resultadoPreparado();
  } catch (error) {
    return {
      ok: false,
      estado: 'error',
      motivo: error?.message || 'no se pudo preparar el dispositivo',
    };
  }
}

/* ---------------------------------------------------------------------
   Notificaciones de novedades en este móvil (APK 1.4.2 o posterior)
   --------------------------------------------------------------------- */
function entornoPushNovedades() {
  if (!NOVEDADES_ACTIVAS) return { ok: false, estado: 'desactivados' };
  if (Platform.OS === 'web') return { ok: false, estado: 'no-compatible' };
  if (!capacidadPushNovedades()) return { ok: false, estado: 'requiere-version' };
  if (!Device.isDevice) return { ok: false, estado: 'emulador' };
  if (Platform.OS === 'android' && isRunningInExpoGo()) return { ok: false, estado: 'expo-go' };
  if (!proyectoEas()) return { ok: false, estado: 'configuracion-pendiente' };
  return null;
}

/* Consulta pasiva: nunca abre el diálogo del sistema ni pide un token. */
export async function consultarPushNovedades() {
  try {
    const previo = entornoPushNovedades();
    if (previo) return previo;
    const permiso = await Notifications.getPermissionsAsync();
    if (permisoConcedido(permiso)) return { ok: true, estado: 'permitido' };
    return { ok: false, estado: permiso.canAskAgain ? 'disponible' : 'denegado' };
  } catch {
    return { ok: false, estado: 'error' };
  }
}

/* Lo más que se espera a Expo por el token (12/11/2026). Sin red puede no
   contestar nunca, y el interruptor de Perfil se quedaba ocupado (y, con él,
   los demás). Pasado el plazo: «sin-red», y se puede volver a intentar. El
   diálogo del permiso no tiene plazo: la persona se toma su tiempo. */
export const PLAZO_TOKEN_NOVEDADES_MS = 20000;
function tokenExpoConPlazo(projectId, plazoMs) {
  let reloj;
  const corte = new Promise((_, rechazar) => {
    reloj = setTimeout(() => rechazar(Object.assign(new Error('plazo'), { code: 'plazo' })), plazoMs);
  });
  return Promise.race([Notifications.getExpoPushTokenAsync({ projectId }), corte]).finally(() => clearTimeout(reloj));
}

/* Solo tras pulsar «Notificaciones en este móvil». El token solo va a las
   funciones de avisos de la cuenta y al almacenamiento por cuenta de este
   móvil; nunca a registros ni mensajes. */
export async function obtenerTokenNovedades({ solicitarPermiso = false, plazoMs = PLAZO_TOKEN_NOVEDADES_MS } = {}) {
  try {
    const previo = entornoPushNovedades();
    if (previo) return previo;
    /* Android 13 no muestra el permiso ni entrega token hasta que existe al
       menos un canal, según la documentación versionada de SDK 57. Se crean
       (o se actualizan, con el idioma de la app) los dos antes de pedirlo, y
       también al renovar: así un móvil ya activo recibe el canal que le falte. */
    if (Platform.OS === 'android') {
      for (const canal of CANALES_AVISOS) {
        await Notifications.setNotificationChannelAsync(canal.id, {
          name: traducir(canal.nombre),
          description: traducir(canal.descripcion),
          /* HIGH: suena y aparece encima de lo que estés haciendo, como un
             WhatsApp (DEFAULT solo suena). La importancia de un canal ya
             creado solo la puede cambiar la persona, así que se fija bien
             desde la primera activación. */
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 150, 250],
          lightColor: '#25E39A',
        });
      }
    }
    let permiso = await Notifications.getPermissionsAsync();
    if (!permisoConcedido(permiso)) {
      if (!solicitarPermiso) return { ok: false, estado: permiso.canAskAgain ? 'disponible' : 'denegado' };
      if (!permiso.canAskAgain) return { ok: false, estado: 'denegado' };
      permiso = await Notifications.requestPermissionsAsync();
    }
    if (!permisoConcedido(permiso)) return { ok: false, estado: 'denegado' };
    let token;
    try {
      ({ data: token } = await tokenExpoConPlazo(proyectoEas(), plazoMs));
    } catch (error) {
      return { ok: false, estado: error?.code === 'plazo' ? 'sin-red' : 'error' };
    }
    if (!tokenPushValido(token)) return { ok: false, estado: 'error' };
    return { ok: true, estado: 'permitido', token, plataforma: Platform.OS };
  } catch {
    return { ok: false, estado: 'error' };
  }
}
