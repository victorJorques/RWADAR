'use strict';

const { traducir } = require('./idioma');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREFIJO = 'rwadar.desbloqueo.v1.';
const SERVICIO = 'rwadar-desbloqueo-v1';

// La preferencia no contiene credenciales y no genera un segundo prompt.
function almacenPredeterminado() {
  const seguro = require('expo-secure-store');
  const opciones = { keychainService: SERVICIO, requireAuthentication: false,
    keychainAccessible: seguro.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  return {
    getItemAsync: clave => seguro.getItemAsync(clave, opciones),
    setItemAsync: (clave, valor) => seguro.setItemAsync(clave, valor, opciones),
  };
}

function crearControladorBloqueoApp({ almacenamiento, cargarAutenticacion,
  estadoAppInicial = 'active', plataforma, plazoMs = 90000, ahora = Date.now } = {}) {
  const cargar = cargarAutenticacion || (() => Promise.resolve(require('expo-local-authentication')));
  let almacen = almacenamiento, revision = 0, conocida = false, moduloActual = null;
  let estadoApp = estadoAppInicial || 'active';
  let foto = { usuarioId: null, activado: false, bloqueado: false,
    preparando: false, ocupado: false, mensaje: '' };
  const oyentes = new Set(), avisos = new Set();
  const esAndroid = () => (plataforma || require('react-native').Platform.OS) === 'android';
  const notificar = () => { for (const aviso of [...avisos]) aviso(); };
  const solicitudVigente = solicitud => solicitud.abierta && vigente(solicitud.turno) && ahora() < solicitud.limite;
  const estado = () => Object.freeze({ ...foto });
  function publicar(cambio) {
    foto = { ...foto, ...cambio };
    for (const oyente of oyentes) oyente(estado());
  }
  function storage() { if (!almacen) almacen = almacenPredeterminado(); return almacen; }
  const vigente = turno => turno === revision && !!foto.usuarioId;
  function cancelarPromptAnterior() {
    if (foto.ocupado && moduloActual?.cancelAuthenticate) {
      const anterior = moduloActual;
      Promise.resolve().then(() => anterior.cancelAuthenticate()).catch(() => {});
    }
  }
  async function cambiarUsuario(usuarioId) {
    cancelarPromptAnterior();
    const turno = ++revision;
    notificar();
    const id = usuarioId == null ? null : String(usuarioId).toLowerCase();
    conocida = false;
    publicar({ usuarioId: id, activado: false, bloqueado: !!id, preparando: !!id,
      ocupado: false, mensaje: '' });
    if (!id) return { ok: true };
    try {
      if (!UUID.test(id)) throw new Error('Cuenta no válida');
      const valor = await storage().getItemAsync(PREFIJO + id);
      if (!vigente(turno)) return { ok: false, cancelada: true };
      if (valor !== null && valor !== '1' && valor !== '0') throw new Error('Preferencia no válida');
      conocida = true;
      const activado = valor === '1';
      publicar({ activado, bloqueado: activado, preparando: false });
      return { ok: true };
    } catch {
      if (vigente(turno)) publicar({ preparando: false, bloqueado: true,
        mensaje: 'No se pudo comprobar el bloqueo. Reintenta o cierra la sesión.' });
      return { ok: false };
    }
  }
  function esperarPrimerPlano(solicitud) {
    return new Promise(resolve => {
      function revisar() {
        if (!solicitudVigente(solicitud)) { avisos.delete(revisar); resolve(false); }
        else if (estadoApp === 'active') { avisos.delete(revisar); resolve(true); }
      }
      avisos.add(revisar); revisar();
    });
  }
  async function autenticar(solicitud) {
    const local = await cargar();
    if (!solicitudVigente(solicitud)) return { success: false, error: 'app_cancel' };
    moduloActual = local;
    const nivel = await local.getEnrolledLevelAsync();
    if (!solicitudVigente(solicitud)) return { success: false, error: 'app_cancel' };
    if (!Number.isInteger(nivel) || nivel <= 0) return { success: false, error: 'not_enrolled' };
    // Android puede abrir una Activity para el PIN. Solo el sistema acredita el exito.
    const resultado = await local.authenticateAsync({ promptMessage: traducir('Desbloquear RWAdar'),
      promptDescription: traducir('Confirma tu identidad con la seguridad de este móvil.'),
      cancelLabel: traducir('Cancelar'), disableDeviceFallback: false, requireConfirmation: true,
      fallbackLabel: traducir('Usar código del dispositivo') });
    if (resultado?.success !== true) return resultado;
    if (!await esperarPrimerPlano(solicitud)) return { success: false, error: 'app_cancel' };
    return resultado;
  }
  function mensajeFallo(resultado) {
    if (resultado?.error === 'not_enrolled' || resultado?.error === 'passcode_not_set') {
      return 'Configura un PIN, patrón, huella o cara en los ajustes del móvil y vuelve a intentarlo.';
    }
    return 'No se ha desbloqueado RWAdar. Puedes volver a intentarlo o cerrar la sesión.';
  }
  async function ejecutar(activar) {
    if (!foto.usuarioId || foto.preparando || foto.ocupado || !conocida) return { ok: false };
    const turno = ++revision, id = foto.usuarioId;
    notificar();
    const solicitud = { turno, limite: ahora() + plazoMs, abierta: true };
    let reloj, revisarCancelacion;
    const cancelacion = new Promise(resolve => {
      revisarCancelacion = () => {
        if (!solicitudVigente(solicitud)) resolve({ success: false, error: 'app_cancel' });
      };
      avisos.add(revisarCancelacion);
    });
    publicar({ ocupado: true, mensaje: '' });
    try {
      const resultado = await Promise.race([autenticar(solicitud), cancelacion,
        new Promise(resolve => { reloj = setTimeout(() => {
          if (vigente(turno)) cancelarPromptAnterior();
          solicitud.abierta = false; notificar();
          resolve({ success: false, error: 'timeout' });
        }, plazoMs); })]);
      if (!vigente(turno)) return { ok: false, cancelada: true };
      if (resultado?.success !== true || !solicitudVigente(solicitud) || estadoApp !== 'active') {
        if (!solicitudVigente(solicitud)) cancelarPromptAnterior();
        publicar({ mensaje: mensajeFallo(resultado) });
        return { ok: false };
      }
      if (typeof activar === 'boolean') {
        await storage().setItemAsync(PREFIJO + id, activar ? '1' : '0');
        if (!vigente(turno)) return { ok: false, cancelada: true };
        publicar({ activado: activar, bloqueado: activar && estadoApp !== 'active' });
      } else {
        publicar({ bloqueado: estadoApp !== 'active' });
      }
      return { ok: true };
    } catch {
      if (vigente(turno)) publicar({ mensaje: typeof activar === 'boolean'
        ? 'No se pudo completar esta opción. El bloqueo conserva su estado anterior.'
        : 'No se pudo comprobar tu identidad. Reintenta o cierra la sesión.' });
      return { ok: false };
    } finally {
      clearTimeout(reloj);
      solicitud.abierta = false;
      avisos.delete(revisarCancelacion); notificar();
      if (vigente(turno)) publicar({ ocupado: false,
        ...(foto.activado && estadoApp !== 'active' ? { bloqueado: true } : {}) });
    }
  }
  async function activar(valor = true) {
    if (typeof valor !== 'boolean') return { ok: false };
    return ejecutar(valor);
  }
  async function desbloquear() {
    if (!foto.usuarioId || foto.ocupado || foto.preparando) return { ok: false };
    if (!conocida) {
      const lectura = await cambiarUsuario(foto.usuarioId);
      if (!lectura.ok) return lectura;
    }
    if (!foto.activado) return { ok: true };
    return ejecutar();
  }
  function cambiarEstadoApp(siguiente) {
    estadoApp = siguiente;
    if (siguiente === 'background' && foto.ocupado) {
      if (esAndroid()) {
        // RN no distingue Home de la Activity del PIN: mantener cerrado hasta
        // exito nativo reciente, mismo intento/UUID y vuelta a active.
        if (foto.activado) publicar({ bloqueado: true });
      } else {
        cancelarPromptAnterior();
        ++revision;
        publicar({ ocupado: false, bloqueado: foto.activado,
          mensaje: 'No se ha desbloqueado RWAdar. Puedes volver a intentarlo o cerrar la sesión.' });
      }
      notificar(); return;
    }
    notificar();
    if (foto.ocupado || !foto.usuarioId || !foto.activado) return;
    if (siguiente !== 'active') publicar({ bloqueado: true });
  }
  return { estado, cambiarUsuario, cambiarEstadoApp, activar, desbloquear,
    suscribir(oyente) { oyentes.add(oyente); oyente(estado()); return () => oyentes.delete(oyente); } };
}

function useBloqueoApp({ usuarioId } = {}) {
  const { useEffect, useState } = require('react');
  const { AppState } = require('react-native');
  const [controlador] = useState(() => crearControladorBloqueoApp({ estadoAppInicial: AppState.currentState }));
  const [vista, setVista] = useState(() => controlador.estado());
  useEffect(() => {
    const quitar = controlador.suscribir(setVista);
    const escucha = AppState.addEventListener('change', controlador.cambiarEstadoApp);
    return () => { quitar(); escucha.remove(); controlador.cambiarUsuario(null); };
  }, [controlador]);
  useEffect(() => { controlador.cambiarUsuario(usuarioId); }, [controlador, usuarioId]);
  const id = usuarioId == null ? null : String(usuarioId).toLowerCase();
  // Cierra el paso en el mismo render del cambio de UUID, antes del efecto/lectura.
  const actual = vista.usuarioId === id ? vista : { activado: false, bloqueado: !!id,
    preparando: !!id, ocupado: false, mensaje: '' };
  return { activado: actual.activado, bloqueado: actual.bloqueado,
    preparando: actual.preparando, ocupado: actual.ocupado, mensaje: actual.mensaje,
    activar: controlador.activar, desbloquear: controlador.desbloquear };
}

module.exports = { crearControladorBloqueoApp, useBloqueoApp };
