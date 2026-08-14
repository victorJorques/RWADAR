import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { cliente, idInstalacion } from './supabase';

/* ---------------------------------------------------------------------
   Avisos push
   ---------------------------------------------------------------------
   Es la función que justifica que exista la app y no solo la web: cuando
   una plataforma que sigues cae del radar, te enteras el mismo día.

   Dos límites de la SDK 57 que condicionan cómo está escrito:
     · getExpoPushTokenAsync() exige un projectId de EAS. Mientras no
       exista la cuenta de Expo, no hay token: el módulo lo detecta y se
       calla en lugar de reventar.
     · En Android los push remotos no funcionan en Expo Go desde la SDK 53.
       Hace falta una compilación de desarrollo para probarlos.
   --------------------------------------------------------------------- */

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

export async function registrarParaAvisos() {
  try {
    if (!Device.isDevice) return { ok: false, motivo: 'emulador' };

    const previo = await Notifications.getPermissionsAsync();
    let concedido = previo.granted ||
      previo.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!concedido) {
      const pedido = await Notifications.requestPermissionsAsync();
      concedido = pedido.granted ||
        pedido.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!concedido) return { ok: false, motivo: 'permiso denegado' };

    const projectId = proyectoEas();
    if (!projectId) {
      /* Sin cuenta de EAS todavía. El resto de la app funciona igual. */
      return { ok: false, motivo: 'falta projectId de EAS' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    const sb = await cliente();
    const instalacion = await idInstalacion();
    await sb.from('dispositivos').upsert(
      {
        instalacion,
        token_push: token,
        sistema: ['ios', 'android', 'web'].includes(Platform.OS) ? Platform.OS : 'web',
        version_app: Constants?.expoConfig?.version || null,
      },
      { onConflict: 'instalacion' }
    );

    return { ok: true, token };
  } catch (err) {
    return { ok: false, motivo: err?.message || 'error desconocido' };
  }
}
