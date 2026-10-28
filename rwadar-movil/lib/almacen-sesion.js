'use strict';

// Solo un refresh token y su UUID. SecureStore cifra el valor; nunca guardamos
// contraseña, JWT de acceso, perfil ni vigilancia. Una única escritura evita
// sesiones parcialmente guardadas y queda por debajo de 2 KiB.
const CLAVE_SESION = 'rwadar.cuenta.refresh.v1';
const MAX_REGISTRO_BYTES = 1800;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CERRADA = '{"version":1,"cerrada":true}';
const colas = new WeakMap();
function errorAlmacen() { const e = new Error('almacen_sesion'); e.code = 'almacen_sesion'; return e; }
function validar(registro) {
  if (!registro || registro.version !== 1 || !UUID.test(registro.usuarioId || '') ||
      typeof registro.refreshToken !== 'string' || !registro.refreshToken ||
      /[^\x21-\x7e]/.test(registro.refreshToken)) throw errorAlmacen();
  const limpio = { version: 1, usuarioId: registro.usuarioId, refreshToken: registro.refreshToken };
  if (JSON.stringify(limpio).length > MAX_REGISTRO_BYTES) throw errorAlmacen();
  return limpio;
}
function crearAlmacenSesion({ secureStore } = {}) {
  let plataforma = secureStore;
  function backend() { return plataforma || (plataforma = require('expo-secure-store')); }
  function opciones() {
    const seguro = backend();
    return seguro.WHEN_UNLOCKED_THIS_DEVICE_ONLY === undefined ? {} :
      { keychainAccessible: seguro.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  }
  function serial(tarea) {
    const seguro = backend();
    const anterior = colas.get(seguro) || Promise.resolve();
    const siguiente = anterior.catch(() => {}).then(tarea).catch(() => { throw errorAlmacen(); });
    colas.set(seguro, siguiente.catch(() => {}));
    return siguiente;
  }
  async function leerDirecto() {
    const valor = await backend().getItemAsync(CLAVE_SESION, opciones());
    if (valor === null || valor === undefined || valor === CERRADA) return null;
    if (typeof valor !== 'string' || valor.length > MAX_REGISTRO_BYTES || /[^\x00-\x7f]/.test(valor)) throw errorAlmacen();
    return validar(JSON.parse(valor));
  }
  return Object.freeze({
    leer: () => serial(leerDirecto),
    guardar: (registro, vigente = () => true) => serial(async () => {
      const limpio = validar({ version: 1, ...registro });
      if (!vigente()) return false;
      await backend().setItemAsync(CLAVE_SESION, JSON.stringify(limpio), opciones());
      return true;
    }),
    // Una renovación tardía no puede reabrir una sesión cerrada o de otra cuenta.
    reemplazar: (anterior, registro) => serial(async () => {
      const actual = await leerDirecto();
      if (!actual || actual.usuarioId !== anterior.usuarioId || actual.refreshToken !== anterior.refreshToken) return false;
      await backend().setItemAsync(CLAVE_SESION, JSON.stringify(validar({ version: 1, ...registro })), opciones());
      return true;
    }),
    borrar: () => serial(async () => {
      // Si delete falla, la marca atómica ya ha sustituido el token y no se restaura.
      try { await backend().setItemAsync(CLAVE_SESION, CERRADA, opciones()); } catch (_) { /* intentar borrado */ }
      try { await backend().deleteItemAsync(CLAVE_SESION, opciones()); } catch (_) { /* verificar marca */ }
      const resto = await backend().getItemAsync(CLAVE_SESION, opciones());
      if (resto !== null && resto !== undefined && resto !== CERRADA) throw errorAlmacen();
    }),
  });
}
module.exports = { crearAlmacenSesion, CLAVE_SESION, MAX_REGISTRO_BYTES };
