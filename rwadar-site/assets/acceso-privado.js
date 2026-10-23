(function () {
  'use strict';
  if (/(?:^|[#&])(?:access_token|error|error_code|error_description)=/.test(location.hash)) {
    location.replace('/acceso' + location.hash); return;
  }
  let usuario = null, comprobando = null;
  function cerrarPantalla() {
    usuario = null;
    // Remove rendered private data immediately, including on a network failure.
    document.documentElement.replaceChildren();
    location.replace('/acceso?volver=' + encodeURIComponent(location.pathname));
  }
  async function verificar() {
    if (comprobando) return comprobando;
    comprobando = (async () => {
      const response = await fetch('/api/acceso/sesion', { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (!response.ok) { usuario = null; cerrarPantalla(); throw new Error('Entra de nuevo para continuar.'); }
      const estado = await response.json();
      if (!estado.autenticada || !estado.usuario?.id) { usuario = null; cerrarPantalla(); throw new Error('Sesión no válida.'); }
      if (usuario && usuario.id !== estado.usuario.id) {
        cerrarPantalla(); throw new Error('La cuenta ha cambiado. Vuelve a entrar.');
      }
      usuario = estado.usuario; return { ...usuario };
    })().catch(error => { cerrarPantalla(); throw error; }).finally(() => { comprobando = null; });
    return comprobando;
  }
  async function catalogo(tabla, consulta = '') {
    if (!['catalogo_plataformas_publicas_v2', 'catalogo_ofertas_publicas_v2', 'catalogo_publicacion', 'plataformas'].includes(tabla)) throw new Error('Recurso no permitido');
    const response = await fetch('/api/acceso/catalogo/' + tabla + (consulta ? '?' + new URLSearchParams(consulta) : ''),
      { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    if (response.status === 401) cerrarPantalla();
    if (!response.ok) throw new Error('No se pudo consultar el catálogo con esta cuenta.');
    return response.json();
  }
  async function salir() {
    try {
      const response = await fetch('/api/acceso/salir', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok || result.cerrado !== true) throw new Error('Cierre no confirmado');
      sessionStorage.removeItem('rwadar.cierre.pendiente');
      cerrarPantalla();
    } catch (error) {
      // HttpOnly cookie cannot be erased offline. Block re-entry until the server clears it.
      sessionStorage.setItem('rwadar.cierre.pendiente', 'si');
      cerrarPantalla(); throw error;
    }
  }
  async function datos(ruta, opciones = {}) {
    const response = await fetch('/api/acceso/datos', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruta, metodo: opciones.method || 'GET',
        ...(opciones.body ? { cuerpo: JSON.parse(opciones.body) } : {}) }) });
    if (response.status === 401) cerrarPantalla();
    const value = await response.json();
    if (!response.ok) { const error = new Error('No se ha podido completar la operación con tu cuenta.'); error.status = response.status; throw error; }
    return value;
  }
  async function reautenticar(clave) {
    const response = await fetch('/api/acceso/reautenticar', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clave }) });
    const result = await response.json();
    if (!response.ok || !result.autenticada || result.usuario?.id !== usuario?.id) throw new Error('No se pudo confirmar tu contraseña.');
    usuario = result.usuario; return { ...usuario };
  }
  window.RWADAR_ACCESO = Object.freeze({ verificar, catalogo, datos, reautenticar, salir, usuario: () => usuario && { ...usuario } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar().catch(() => {}); });
  window.addEventListener('pageshow', () => verificar().catch(() => {}));
  setInterval(() => verificar().catch(() => {}), 60000);
  if (sessionStorage.getItem('rwadar.cierre.pendiente') === 'si') salir().catch(() => {});
  else verificar().catch(() => {});
})();
