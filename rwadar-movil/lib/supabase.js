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

/* TODA PETICIÓN LLEVA PLAZO.
   Sin esto, una petición que no falla pero tampoco vuelve —cobertura de
   metro, wifi de hotel que acepta la conexión y no deja salir, portal
   cautivo— deja la app clavada en "Sintonizando el radar…" para siempre.
   No es una hipótesis: ni PostgREST ni fetch imponen ningún límite, y el
   respaldo desde la copia local solo entra si la promesa RECHAZA. Con el
   plazo, rechaza, y entonces sí: se lee lo guardado, que es justo lo que
   la app promete para el metro.

   Ocho segundos es largo para una red lenta y corto para una persona de
   pie en un andén. */
const PLAZO = 8000;

function conPlazo(url, opciones = {}) {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), PLAZO);
  /* Si quien llama traía su propia señal, se respeta: que aborte
     cualquiera de las dos aborte la petición. */
  const suya = opciones.signal;
  if (suya) {
    if (suya.aborted) corte.abort();
    else suya.addEventListener('abort', () => corte.abort());
  }
  return fetch(url, { ...opciones, signal: corte.signal })
    .finally(() => clearTimeout(reloj));
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
        global: { headers: { 'x-instalacion': id }, fetch: conPlazo },
      })
    );
  }
  return cachePromesa;
}

export { idInstalacion };
