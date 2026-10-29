'use strict';

const INTERVALO_REVISION_MS = 6 * 60 * 60 * 1000;
// Cada versión Android publica junto a RWAdar.apk un version-android.json con
// su versión y código nativo. «latest» siempre apunta a la última publicada.
const URL_VERSION_PUBLICADA = 'https://github.com/victorJorques/RWAdar-downloads/releases/latest/download/version-android.json';
const PREFIJO_APK = 'https://github.com/victorJorques/RWAdar-downloads/releases/download/v';
const MAX_VERSION_BYTES = 4096;
const PLAZO_VERSION_MS = 8000;

// runtimeVersion usa la política nativeVersion: «1.4.1(23)».
function codigoNativoInstalado(runtimeVersion) {
  const partes = /^\d{1,3}\.\d{1,3}\.\d{1,3}\((\d{1,7})\)$/.exec(String(runtimeVersion || ''));
  return partes ? Number(partes[1]) : null;
}

// Solo se acepta un APK de la página de descargas de RWAdar y de la misma
// versión anunciada; cualquier otra forma se ignora sin avisar al usuario.
function validarVersionPublicada(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null;
  const { plataforma, version, versionCode, apk } = datos;
  if (plataforma !== 'android' || typeof version !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version) ||
    !Number.isInteger(versionCode) || versionCode < 1 || versionCode > 9999999 ||
    apk !== `${PREFIJO_APK}${version}/RWAdar.apk`) return null;
  return { version, versionCode, apk };
}

async function consultarVersionPublicada({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_VERSION_MS } = {}) {
  const corte = new AbortController();
  const temporizador = setTimeout(() => corte.abort(), plazoMs);
  try {
    const respuesta = await fetchImpl(URL_VERSION_PUBLICADA, { cache: 'no-store', credentials: 'omit', signal: corte.signal });
    if (!respuesta?.ok || Number(respuesta.headers?.get?.('content-length')) > MAX_VERSION_BYTES) return null;
    const texto = await respuesta.text();
    return texto.length > MAX_VERSION_BYTES ? null : validarVersionPublicada(JSON.parse(texto));
  } catch {
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}

// Un único aviso: primero la mejora ya descargada (se aplica al instante) y
// después una versión Android nueva (descarga el APK).
function resumirActualizacion({ mejoraLista, versionPublicada, codigoInstalado, comprobando, resultado }) {
  if (mejoraLista) return { tipo: 'mejora' };
  if (versionPublicada && codigoInstalado && versionPublicada.versionCode > codigoInstalado) {
    return { tipo: 'version', ...versionPublicada };
  }
  if (comprobando) return { tipo: 'comprobando' };
  return { tipo: resultado === 'al-dia' || resultado === 'error' ? resultado : 'reposo' };
}

// Los textos se eligen aquí por idioma para no tocar el diccionario
// compartido con la web.
function textosActualizacion(resumen, { idioma = 'es', versionInstalada = '' } = {}) {
  const en = idioma === 'en';
  const instalada = versionInstalada ? (en ? `Version ${versionInstalada}. ` : `Versión ${versionInstalada}. `) : '';
  switch (resumen.tipo) {
    case 'mejora': return en
      ? { aviso: 'An improvement is ready', boton: 'Apply', titulo: 'Apply the improvement now',
        detalle: 'Already downloaded. The app restarts in a moment: you stay signed in, but anything half-written is lost.',
        falloTitulo: 'Could not restart', fallo: 'Close the app and open it again to apply the improvement.' }
      : { aviso: 'Hay una mejora lista', boton: 'Aplicar', titulo: 'Aplicar la mejora ahora',
        detalle: 'Ya está descargada. La app se reinicia en un momento: conservas tu sesión, pero se pierde lo que tengas a medio escribir.',
        falloTitulo: 'No se pudo reiniciar', fallo: 'Cierra la app y vuelve a abrirla para aplicar la mejora.' };
    case 'version': return en
      ? { aviso: `New version ${resumen.version}`, boton: 'Update', titulo: `Update to version ${resumen.version}`,
        detalle: 'Download it and tap «Update». Do not uninstall the app.',
        confirmar: 'RWAdar.apk will download. Open it and tap «Update». If Android asks you to allow installs from the browser, accept. Do not uninstall the app: you keep your account and your data.',
        aceptar: 'Download', cancelar: 'Not now' }
      : { aviso: `Nueva versión ${resumen.version}`, boton: 'Actualizar', titulo: `Actualizar a la versión ${resumen.version}`,
        detalle: 'Descárgala y pulsa «Actualizar». No desinstales la app.',
        confirmar: 'Se descargará RWAdar.apk. Ábrelo y pulsa «Actualizar». Si Android te pide permitir instalar desde el navegador, acéptalo. No desinstales la app: conservas tu cuenta y tus datos.',
        aceptar: 'Descargar', cancelar: 'Ahora no' };
    case 'comprobando': return en
      ? { titulo: 'Checking for updates…', detalle: `${instalada}This takes a few seconds.` }
      : { titulo: 'Buscando actualizaciones…', detalle: `${instalada}Tarda unos segundos.` };
    case 'al-dia': return en
      ? { titulo: 'You have the latest version', detalle: `${instalada}Improvements install by themselves.` }
      : { titulo: 'Tienes la última versión', detalle: `${instalada}Las mejoras se instalan solas.` };
    case 'error': return en
      ? { titulo: 'Check for updates', detalle: 'Could not check. Check your connection and try again.' }
      : { titulo: 'Buscar actualizaciones', detalle: 'No se pudo comprobar. Revisa la conexión y vuelve a intentarlo.' };
    default: return en
      ? { titulo: 'Check for updates', detalle: `${instalada}Improvements install by themselves.` }
      : { titulo: 'Buscar actualizaciones', detalle: `${instalada}Las mejoras se instalan solas.` };
  }
}

// Comprobación pedida por el usuario: busca la mejora compatible (y la deja
// descargada) y, solo en Android, la versión publicada. Nunca reinicia sola.
function crearComprobadorActualizaciones({ updates, consultarVersion = consultarVersionPublicada,
  conVersionAndroid = true } = {}) {
  let enCurso = null;
  let aplicando = null;
  async function buscarMejora() {
    try {
      const revision = await updates.checkForUpdateAsync();
      if (revision?.isAvailable || revision?.isRollBackToEmbedded) await updates.fetchUpdateAsync();
      return true;
    } catch {
      return false;
    }
  }
  function comprobar() {
    if (!enCurso) {
      enCurso = Promise.all([conVersionAndroid ? consultarVersion() : null, buscarMejora()])
        .then(([versionPublicada, mejoraConsultada]) => ({ versionPublicada: versionPublicada || null,
          // «Al día» solo si se pudo consultar todo lo que aplica a esta plataforma.
          resultado: mejoraConsultada && (!conVersionAndroid || versionPublicada) ? 'al-dia' : 'error' }))
        .finally(() => { enCurso = null; });
    }
    return enCurso;
  }
  // reloadAsync resuelve antes del reinicio: otra pulsación reutiliza la misma.
  function aplicarMejora() {
    if (!aplicando) {
      aplicando = Promise.resolve().then(() => updates.reloadAsync())
        .then(() => true, () => { aplicando = null; return false; });
    }
    return aplicando;
  }
  return { comprobar, aplicarMejora };
}

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

const SIN_UPDATES_NATIVO = Object.freeze({ isUpdatePending: false });

function useEstadoActualizaciones() {
  const { useEffect, useMemo, useRef, useState } = require('react');
  const { Platform } = require('react-native');
  const updates = require('expo-updates');
  // Constante durante toda la vida del proceso: el orden de hooks no cambia.
  const activo = !(typeof __DEV__ !== 'undefined' && __DEV__) && Platform.OS !== 'web' && updates.isEnabled === true;
  // El APK solo se ofrece en Android; la mejora compatible vale para todos.
  const android = Platform.OS === 'android';
  const nativo = activo ? updates.useUpdates() : SIN_UPDATES_NATIVO;
  const comprobador = useMemo(() => crearComprobadorActualizaciones({ updates, conVersionAndroid: android }),
    [updates, android]);
  const [versionPublicada, setVersionPublicada] = useState(null);
  const [comprobando, setComprobando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    if (activo && android) {
      consultarVersionPublicada().then(version => { if (vivo.current && version) setVersionPublicada(version); });
    }
    return () => { vivo.current = false; };
  }, [activo, android]);
  async function comprobar() {
    if (!activo || comprobando) return;
    setComprobando(true);
    setResultado(null);
    const salida = await comprobador.comprobar();
    if (!vivo.current) return;
    if (salida.versionPublicada) setVersionPublicada(salida.versionPublicada);
    setResultado(salida.resultado);
    setComprobando(false);
  }
  const codigoInstalado = android ? codigoNativoInstalado(updates.runtimeVersion) : null;
  const resumen = resumirActualizacion({ mejoraLista: nativo.isUpdatePending === true, versionPublicada,
    codigoInstalado, comprobando, resultado });
  const versionInstalada = String(updates.runtimeVersion || '').replace(/\(\d+\)$/, '');
  return { activo, resumen, versionInstalada, comprobar, aplicarMejora: comprobador.aplicarMejora };
}

module.exports = {
  crearControladorActualizaciones, useActualizacionesApp, INTERVALO_REVISION_MS,
  URL_VERSION_PUBLICADA, codigoNativoInstalado, validarVersionPublicada, consultarVersionPublicada,
  resumirActualizacion, textosActualizacion, crearComprobadorActualizaciones, useEstadoActualizaciones,
};
