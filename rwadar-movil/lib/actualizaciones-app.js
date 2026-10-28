'use strict';

const INTERVALO_REVISION_MS = 6 * 60 * 60 * 1000;

// El arranque nativo comprueba ON_LOAD sin esperar a la red. Esta vigilancia
// cubre sesiones largas; solo descarga y deja aplicar al siguiente arranque
// en frío, sin reiniciar formularios, cartera ni la sesión abierta.
function crearControladorActualizaciones({ updates, desarrollo = false, plataforma = 'android',
  estadoAppInicial = 'active', ahora = Date.now } = {}) {
  let estadoApp = estadoAppInicial;
  let ultimaRevision = ahora();
  let enCurso = false;
  let preparada = false;
  let detenido = false;

  async function cambiarEstadoApp(siguiente) {
    const anterior = estadoApp;
    estadoApp = siguiente;
    if (detenido || desarrollo || plataforma === 'web' || !updates?.isEnabled || preparada || enCurso ||
      anterior === 'active' || siguiente !== 'active' || ahora() - ultimaRevision < INTERVALO_REVISION_MS) {
      return { estado: 'sin-cambios' };
    }
    enCurso = true;
    ultimaRevision = ahora();
    try {
      const revision = await updates.checkForUpdateAsync();
      if (detenido || (!revision?.isAvailable && !revision?.isRollBackToEmbedded)) {
        return { estado: 'sin-cambios' };
      }
      const descarga = await updates.fetchUpdateAsync();
      preparada = descarga?.isNew === true || descarga?.isRollBackToEmbedded === true;
      return { estado: preparada ? 'proximo-arranque' : 'sin-cambios' };
    } catch {
      // Sin red o con un fallo de servicio sigue funcionando la copia ya
      // instalada. No se toca almacenamiento de usuario ni se fuerza recarga.
      return { estado: 'aplazada' };
    } finally {
      enCurso = false;
    }
  }

  return { cambiarEstadoApp, detener() { detenido = true; } };
}

function useActualizacionesApp() {
  const { useEffect } = require('react');
  const { AppState, Platform } = require('react-native');
  useEffect(() => {
    if ((typeof __DEV__ !== 'undefined' && __DEV__) || Platform.OS === 'web') return undefined;
    const updates = require('expo-updates');
    const controlador = crearControladorActualizaciones({ updates, plataforma: Platform.OS,
      estadoAppInicial: AppState.currentState });
    const escucha = AppState.addEventListener('change', controlador.cambiarEstadoApp);
    return () => { escucha.remove(); controlador.detener(); };
  }, []);
}

module.exports = { crearControladorActualizaciones, useActualizacionesApp, INTERVALO_REVISION_MS };
