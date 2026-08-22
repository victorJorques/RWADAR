import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { clienteDispositivo, idInstalacion, idInstalacionExistente } from './supabase';

/* Este módulo prepara permiso, token y registro. El panel no declara entrega
   activa hasta que el proceso de envío exista y la bandera operativa esté
   activada de forma explícita. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

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

/* Observa exclusivamente interacciones del usuario. Consultar la ultima
   respuesta y registrar el listener no solicita permisos ni crea un token.
   Se cubren tanto el arranque en frio como un toque con la app abierta. */
export function observarAperturasAvisos(onAbrir) {
  if (Platform.OS === 'web' || typeof onAbrir !== 'function') return () => {};

  let activo = true;
  const atendidas = new Set();
  const manejar = async (respuesta) => {
    if (!activo) return;
    const accion = respuesta?.actionIdentifier;
    if (accion && Notifications.DEFAULT_ACTION_IDENTIFIER &&
        accion !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const slug = slugDesdeRespuestaAviso(respuesta);
    if (!slug) return;
    const identificador = respuesta?.notification?.request?.identifier;
    if (identificador && atendidas.has(identificador)) return;
    if (identificador) atendidas.add(identificador);

    try {
      const abierta = await onAbrir(slug);
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
