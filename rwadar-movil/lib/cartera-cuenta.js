'use strict';
// El registro se valida con el mismo motor que la UI. No migra ni borra copias locales.
const modelo = require('./cartera');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function fallo(code, status) { const e = new Error(code); e.code = code; e.status = status; return e; }
function versionValida(v) { return Number.isSafeInteger(v) && v >= 0 && v <= 2147483647; }
function normalizar(value) {
  if (!value || !versionValida(value.version)) throw fallo('cartera_respuesta_invalida');
  return { version: value.version, posiciones: modelo.deserializarCartera(modelo.serializarCartera(value.posiciones)) };
}
function crearCarteraCuenta({ cuenta, usuarioId, vigente = () => true } = {}) {
  if (!UUID.test(usuarioId || '') || !cuenta?.clienteCatalogo || !cuenta?.estado || !cuenta?.suscribir) throw fallo('sin_sesion', 401);
  let activa = true, pendiente = false;
  const abortos = new Set();
  function actual(signal) {
    if (!activa || !vigente() || signal?.aborted || cuenta.estado().usuario?.id !== usuarioId) throw fallo('cancelada');
  }
  const desuscribir = cuenta.suscribir(estado => {
    if (estado.usuario?.id !== usuarioId) { activa = false; for (const abort of abortos) abort.abort(); }
  });
  async function ejecutar(tarea, opciones = {}) {
    actual(opciones.signal);
    if (pendiente) throw fallo('cartera_ocupada');
    pendiente = true;
    const abort = new AbortController(), cancelar = () => abort.abort(); abortos.add(abort);
    opciones.signal?.addEventListener?.('abort', cancelar, { once: true });
    try {
      const cliente = await cuenta.clienteCatalogo(); actual(abort.signal);
      const resultado = await tarea(cliente, abort.signal); actual(abort.signal);
      if (resultado?.error) {
        const e = resultado.error;
        if (e.code === 'PT409' || e.status === 409 || resultado.status === 409) throw fallo('cartera_conflicto', 409);
        throw fallo(e.code === '42501' ? 'sin_sesion' : 'cartera_no_disponible', e.status || resultado.status);
      }
      return resultado?.data;
    } finally {
      pendiente = false; abortos.delete(abort); opciones.signal?.removeEventListener?.('abort', cancelar);
    }
  }
  return {
    modelo,
    async cargar(opciones = {}) {
      const data = await ejecutar((cliente, signal) => cliente.from('mi_cartera').select('version,documento').limit(1).abortSignal(signal), opciones);
      if (!Array.isArray(data) || data.length > 1) throw fallo('cartera_respuesta_invalida');
      if (!data.length) return { posiciones: [], version: 0 };
      const fila = data[0];
      if (fila.documento?.version !== 1 || !fila.version) throw fallo('cartera_respuesta_invalida');
      return normalizar({ posiciones: fila.documento.posiciones, version: fila.version });
    },
    async guardar(posiciones, version, opciones = {}) {
      actual(opciones.signal);
      if (!versionValida(version) || version === 2147483647) throw fallo('cartera_version_invalida');
      const documento = JSON.parse(modelo.serializarCartera(posiciones));
      const raw = JSON.stringify({ p_documento: documento, p_version: version });
      if ((typeof TextEncoder === 'function' ? new TextEncoder().encode(raw).length : raw.length * 3) > 2 * 1024 * 1024) throw fallo('cartera_tamano');
      const data = await ejecutar((cliente, signal) => cliente.rpc('guardar_mi_cartera', { p_documento: documento, p_version: version }).abortSignal(signal), opciones);
      const result = normalizar(data);
      if (result.version !== version + 1) throw fallo('cartera_respuesta_invalida');
      return result;
    },
    destruir() { activa = false; for (const abort of abortos) abort.abort(); desuscribir?.(); },
  };
}
module.exports = { crearCarteraCuenta };
