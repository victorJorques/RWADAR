(function () {
  'use strict';
  if (/(?:^|[#&])(?:access_token|error|error_code|error_description)=/.test(location.hash)) {
    location.replace('/acceso' + location.hash); return;
  }
  // sinSesion: el servidor ya dijo «sin sesión» en esta carga. Con las cuentas en
  // pausa casi nadie tiene sesión: no se vuelve a preguntar (ni cada 60 s) para
  // no llenar la consola de 401; entrar siempre pasa por /acceso y recarga.
  let usuario = null, comprobando = null, sinSesion = false;
  function entrar() {
    location.assign('/acceso?volver=' + encodeURIComponent(location.pathname));
  }
  function limpiarCuenta() {
    const habiaCuenta = !!usuario;
    usuario = null;
    if (habiaCuenta) {
      // Erase account data immediately. Reload the public page without keeping
      // profile, watchlist or another account's favorites in memory or the DOM.
      document.documentElement.replaceChildren();
      location.replace(location.pathname + location.search);
    }
  }
  function errorTemporal(status = 0) {
    const error = new Error('No se pudo comprobar tu sesión ahora. Reintenta en unos instantes; conservamos tu sesión.');
    error.reintentable = true; error.status = status; return error;
  }
  async function verificar() {
    if (comprobando) return comprobando;
    if (sinSesion && !usuario) throw new Error('Entra para gestionar tu cuenta.');
    comprobando = (async () => {
      if (sessionStorage.getItem('rwadar.cierre.pendiente') === 'si') throw new Error('Confirma el cierre antes de entrar.');
      let response;
      try { response = await fetch('/api/acceso/sesion', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' }); }
      catch (_) { throw errorTemporal(); }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { sinSesion = true; throw new Error('Entra para gestionar tu cuenta.'); }
        throw errorTemporal(response.status);
      }
      let estado;
      try { estado = await response.json(); }
      catch (error) {
        if (error.name === 'SyntaxError') throw new Error('Respuesta de sesión no válida.');
        throw errorTemporal();
      }
      if (estado?.autenticada !== true || typeof estado.usuario?.id !== 'string' || !estado.usuario.id) throw new Error('Sesión no válida.');
      if (usuario && usuario.id !== estado.usuario.id) {
        throw new Error('La cuenta ha cambiado. Vuelve a entrar.');
      }
      usuario = estado.usuario; sinSesion = false; return { ...usuario };
    })().catch(error => {
      // A failed verification blocks the pending operation without discarding
      // the last confirmed identity. Definitive rejection still erases it.
      if (error.reintentable !== true) limpiarCuenta();
      throw error;
    }).finally(() => { comprobando = null; });
    return comprobando;
  }
  async function catalogo(tabla, consulta = '') {
    if (!['catalogo_plataformas_publicas_v2', 'catalogo_ofertas_publicas_v2', 'catalogo_publicacion', 'plataformas'].includes(tabla)) throw new Error('Recurso no permitido');
    const response = await fetch('/api/acceso/catalogo/' + tabla + (consulta ? '?' + new URLSearchParams(consulta) : ''),
      { credentials: 'omit', cache: 'no-store', redirect: 'error' });
    if (!response.ok) throw new Error('No se pudo actualizar el catálogo público.');
    return response.json();
  }
  async function salir() {
    // Suppress account operations before the request finishes, including offline.
    sessionStorage.setItem('rwadar.cierre.pendiente', 'si');
    try {
      const response = await fetch('/api/acceso/salir', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok || result.cerrado !== true) throw new Error('Cierre no confirmado');
      sessionStorage.removeItem('rwadar.cierre.pendiente');
      limpiarCuenta();
    } catch (error) {
      // HttpOnly cookie cannot be erased offline. Public reading stays available.
      limpiarCuenta(); throw error;
    }
  }
  async function datos(ruta, opciones = {}) {
    if (opciones === null || opciones === undefined) opciones = {};
    try { await verificar(); } catch (error) { if (error.reintentable !== true) entrar(); throw error; }
    let response;
    try {
      response = await fetch('/api/acceso/datos', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruta, metodo: opciones.method || 'GET',
          ...(opciones.body ? { cuerpo: JSON.parse(opciones.body) } : {}) }) });
    } catch (_) { throw errorTemporal(); }
    if (response.status === 401) {
      limpiarCuenta(); entrar(); const error = new Error('Entra para gestionar tu cuenta.'); error.status = response.status; throw error;
    }
    if (response.status === 429 || response.status >= 500) throw errorTemporal(response.status);
    const value = await response.json();
    if (!response.ok && value?.error === 'sesion_necesaria') {
      limpiarCuenta(); entrar(); const error = new Error('Entra para gestionar tu cuenta.'); error.status = response.status; throw error;
    }
    if (!response.ok) { const error = new Error('No se ha podido completar la operación con tu cuenta.'); error.status = response.status; throw error; }
    return value;
  }
  // captcha: the page's Turnstile token, forwarded to Auth once its CAPTCHA is on.
  async function reautenticar(clave, captcha) {
    await verificar();
    const response = await fetch('/api/acceso/reautenticar', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(captcha ? { clave, captcha } : { clave }) });
    const result = await response.json();
    if (!response.ok || !result.autenticada || result.usuario?.id !== usuario?.id) throw new Error('No se pudo confirmar tu contraseña.');
    usuario = result.usuario; return { ...usuario };
  }
  window.RWADAR_ACCESO = Object.freeze({ verificar, catalogo, datos, reautenticar, salir, entrar, usuario: () => usuario && { ...usuario } });
  // El tutorial nativo es publico; los metodos privados siguen verificando al usarse.
  const tutorialNativoPublico = !!window.ReactNativeWebView && location.pathname === '/' && location.hash === '#explain';
  if (!tutorialNativoPublico) {
    // Las comprobaciones periódicas solo tienen sentido con una cuenta abierta.
    document.addEventListener('visibilitychange', () => { if (usuario && document.visibilityState === 'visible') verificar().catch(() => {}); });
    window.addEventListener('pageshow', evento => {
      if (evento && evento.persisted) sinSesion = false; // vuelta desde la caché del navegador: preguntar de nuevo
      if (usuario || (evento && evento.persisted)) verificar().catch(() => {});
    });
    setInterval(() => { if (usuario) verificar().catch(() => {}); }, 60000);
    if (sessionStorage.getItem('rwadar.cierre.pendiente') === 'si') salir().catch(() => {});
    else verificar().catch(() => {});
  }
})();
