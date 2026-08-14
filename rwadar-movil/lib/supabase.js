import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/* La clave publicable va dentro de la app a propósito: es pública por diseño
   y no concede escritura sobre el catálogo. Comprobado contra el servidor: un
   INSERT con esta clave devuelve 401. */
const URL = 'https://exgpmjpaaebyoolpwced.supabase.co';
const CLAVE = 'sb_publishable_LIyeUqwsQGCqSwH6dtsaqQ_HUQ-RX8F';

const CLAVE_INSTALACION = 'rwadar.instalacion';

/* Identificador anónimo del dispositivo. No es una cuenta ni identifica a una
   persona: solo separa el seguimiento de un móvil del de otro, para poder
   seguir plataformas sin obligar a registrarse. */
async function idInstalacion() {
  let id = await AsyncStorage.getItem(CLAVE_INSTALACION);
  if (!id) {
    id = 'inst_' + Date.now().toString(36) + '_' +
         Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(CLAVE_INSTALACION, id);
  }
  return id;
}

let cachePromesa = null;

/* El cliente se crea una sola vez, ya con la cabecera de instalación puesta:
   es lo que leen las políticas de seguridad para devolver a cada dispositivo
   únicamente sus propios datos. */
export function cliente() {
  if (!cachePromesa) {
    cachePromesa = idInstalacion().then((id) =>
      createClient(URL, CLAVE, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { 'x-instalacion': id } },
      })
    );
  }
  return cachePromesa;
}

export { idInstalacion };
