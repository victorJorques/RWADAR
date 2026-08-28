import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

/* La clave publicable va dentro de la app a propósito: es pública por diseño
   y no concede escritura sobre el catálogo. Comprobado contra el servidor: un
   INSERT con esta clave devuelve 401. */
const URL = 'https://exgpmjpaaebyoolpwced.supabase.co';
const CLAVE = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';

const CLAVE_INSTALACION = 'rwadar.instalacion';
const ID_VALIDO = /^inst_[a-zA-Z0-9_-]{8,80}$/;
const OPCIONES_SEGURAS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/* El identificador solo se crea cuando la persona usa seguimiento o avisos.
   En iOS/Android se guarda en Keychain/Keystore; AsyncStorage queda para web
   y para migrar instalaciones de versiones anteriores sin perder sus datos. */
async function leerIdInstalacion() {
  if (Platform.OS === 'web') {
    const previo = await AsyncStorage.getItem(CLAVE_INSTALACION);
    return previo && ID_VALIDO.test(previo) ? previo : null;
  }

  const seguro = await SecureStore.getItemAsync(CLAVE_INSTALACION, OPCIONES_SEGURAS);
  if (seguro && ID_VALIDO.test(seguro)) return seguro;

  const anterior = await AsyncStorage.getItem(CLAVE_INSTALACION);
  if (!anterior || !ID_VALIDO.test(anterior)) return null;

  await SecureStore.setItemAsync(CLAVE_INSTALACION, anterior, OPCIONES_SEGURAS);
  await AsyncStorage.removeItem(CLAVE_INSTALACION);
  return anterior;
}

async function crearIdInstalacion() {
  const nuevo = `inst_${Crypto.randomUUID()}`;
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(CLAVE_INSTALACION, nuevo);
  } else {
    await SecureStore.setItemAsync(CLAVE_INSTALACION, nuevo, OPCIONES_SEGURAS);
    await AsyncStorage.removeItem(CLAVE_INSTALACION);
  }
  return nuevo;
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
  const abortar = () => corte.abort();
  if (suya) {
    if (suya.aborted) corte.abort();
    else suya.addEventListener('abort', abortar);
  }
  return fetch(url, { ...opciones, signal: corte.signal })
    .finally(() => {
      clearTimeout(reloj);
      suya?.removeEventListener?.('abort', abortar);
    });
}

let promesaInstalacion = null;
let cacheClienteDispositivo = null;
let idClienteDispositivo = null;

const clienteCatalogo = createClient(URL, CLAVE, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: conPlazo },
});

export function clientePublico() {
  return clienteCatalogo;
}

/* Consultar el catálogo o abrir la app no crea un identificador. */
export async function idInstalacionExistente() {
  if (promesaInstalacion) return promesaInstalacion;
  const existente = await leerIdInstalacion();
  if (existente) promesaInstalacion = Promise.resolve(existente);
  return existente;
}

export function idInstalacion() {
  if (!promesaInstalacion) {
    promesaInstalacion = (async () => (await leerIdInstalacion()) || crearIdInstalacion())()
      .catch((error) => {
        promesaInstalacion = null;
        throw error;
      });
  }
  return promesaInstalacion;
}

/* El cliente privado lleva la cabecera que leen las políticas RLS. Con
   crear=false devuelve null si la instalación no existe, sin generar una. */
export async function clienteDispositivo({ crear = true } = {}) {
  const id = crear ? await idInstalacion() : await idInstalacionExistente();
  if (!id) return null;

  if (!cacheClienteDispositivo || idClienteDispositivo !== id) {
    idClienteDispositivo = id;
    cacheClienteDispositivo = createClient(URL, CLAVE, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-instalacion': id }, fetch: conPlazo },
    });
  }
  return cacheClienteDispositivo;
}

/* Solo se llama después de que Supabase confirme el DELETE remoto. */
export async function borrarIdInstalacionLocal() {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(CLAVE_INSTALACION, OPCIONES_SEGURAS);
  }
  await AsyncStorage.removeItem(CLAVE_INSTALACION);
  promesaInstalacion = null;
  cacheClienteDispositivo = null;
  idClienteDispositivo = null;
}
