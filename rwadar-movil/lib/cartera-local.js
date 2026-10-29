import AsyncStorage from '@react-native-async-storage/async-storage';
import { deserializarCartera, serializarCartera } from './cartera';

export function claveCartera(usuarioId) {
  if (typeof usuarioId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(usuarioId)) {
    throw new Error('Inicia sesión para consultar tus inversiones.');
  }
  return `rwadar:cartera:v1:${usuarioId.toLowerCase()}`;
}
export async function cargarCartera(usuarioId) {
  const raw = await AsyncStorage.getItem(claveCartera(usuarioId));
  return raw === null ? [] : deserializarCartera(raw);
}
export async function guardarCartera(usuarioId, posiciones) {
  const key = claveCartera(usuarioId);
  const raw = serializarCartera(posiciones);
  await AsyncStorage.setItem(key, raw);
}
export async function borrarCartera(usuarioId) { await AsyncStorage.removeItem(claveCartera(usuarioId)); }
