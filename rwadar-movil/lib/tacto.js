import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/* ---------------------------------------------------------------------
   Tacto
   ---------------------------------------------------------------------
   El equivalente móvil de los sonidos de la web, y bastante mejor: en un
   teléfono la respuesta física convence más que cualquier audio, y no
   molesta a quien tiene el móvil en una reunión.

   Mismas tres reglas que en la web:
     · solo en gestos deliberados, nunca al desplazarse ni al cargar;
     · intensidad proporcional a lo que ocurre, no siempre la misma;
     · si el dispositivo no puede, no pasa nada.

   En iOS el motor táptico falla en silencio con el ahorro de energía
   activado o la cámara en uso, así que todo va envuelto: un fallo aquí
   jamás debe romper una interacción.
   --------------------------------------------------------------------- */

const puede = Platform.OS === 'ios' || Platform.OS === 'android';

const seguro = (fn) => { if (puede) { try { fn(); } catch {} } };

export const tacto = {
  /* Cambiar de filtro o de pestaña: el gesto más leve que existe. */
  eleccion : () => seguro(() => Haptics.selectionAsync()),

  /* Abrir una ficha: un golpe corto, como abrir una tapa. */
  abrir    : () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /* Empezar a seguir: seco y definido, como un pestillo que entra. */
  seguir   : () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),

  /* Dejar de seguir: el mismo gesto pero blando, para que no se
     confunda con el de marcar. La diferencia se nota en el dedo. */
  soltar   : () => seguro(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),

  /* Datos nuevos tras refrescar. Es el único que se permite avisar de
     algo que no ha pedido el dedo directamente. */
  novedad  : () => seguro(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
