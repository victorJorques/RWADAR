/* =====================================================================
   RWAdar Academy · candado de las lecciones sin cuenta (08/11/2026)
   ---------------------------------------------------------------------
   Petición de Víctor: sin cuenta, las lecciones salen difuminadas y con un
   candado; al registrarse y entrar, se desbloquean. Lo usan el índice
   /academy/ y el bloque de lecciones de la portada, con el mismo HTML
   (rwadar-academy.js, htmlCandado) y la misma hoja
   (academy-candado-20261108.css).

   El HTML nace BLOQUEADO: data-estado="bloqueado" y las tarjetas con inert y
   aria-hidden. Este script solo lo abre cuando el servidor confirma la sesión
   (window.RWADAR_ACCESO.verificar() de acceso-privado.js, que pregunta a
   /api/acceso/sesion). Sin script, sin la pasarela, sin sesión o con una
   respuesta rara, sigue bloqueado. Si la red o el servicio fallan, se dice en
   una línea y sigue bloqueado.

   No es la puerta de las lecciones: esa la pone el servidor, que sin sesión
   responde 303 a /acceso o 401. Esto es solo lo que se ve en el índice.
   ===================================================================== */
(function () {
  'use strict';
  const candados = [...document.querySelectorAll('[data-academy-candado]')];
  if (!candados.length) return;
  // Tutorial 3D dentro de la app (WebView en /#explain): como acceso-privado.js,
  // no se pregunta por la sesión. Allí solo se ve el tutorial.
  if (window.ReactNativeWebView && location.pathname === '/' && location.hash === '#explain') return;
  // Se traduce con el diccionario de la web (idioma-en, «No hemos podido…»).
  const FALLO = 'No hemos podido comprobar tu sesión. Recarga la página.';
  let abierto = false, comprobando = false;

  function abrir() {
    abierto = true;
    for (const candado of candados) {
      const contenido = candado.querySelector('[data-academy-candado-contenido]');
      const capa = candado.querySelector('[data-academy-candado-capa]');
      if (contenido) { contenido.removeAttribute('inert'); contenido.removeAttribute('aria-hidden'); }
      if (capa) capa.hidden = true;
      candado.setAttribute('data-estado', 'abierto');
    }
  }
  function avisar(texto) {
    for (const candado of candados) {
      const linea = candado.querySelector('[data-academy-candado-error]');
      if (linea && linea.textContent !== texto) linea.textContent = texto;
    }
  }

  async function comprobar() {
    if (abierto || comprobando) return;
    // Sin la pasarela de sesión (página a medio redirigir o sin construir) no
    // se puede comprobar nada: se queda bloqueado, sin más.
    const acceso = window.RWADAR_ACCESO;
    if (!acceso || typeof acceso.verificar !== 'function') return;
    comprobando = true;
    let cuenta = null;
    try { cuenta = await acceso.verificar(); }
    catch (error) {
      // Solo un fallo pasajero (red caída, 5xx, 429) merece la línea. Un «sin
      // sesión» (401/403) o una sesión que no cuadra dejan el candado tal cual.
      if (error && error.reintentable === true) avisar(FALLO);
      return;
    } finally { comprobando = false; }
    if (cuenta && typeof cuenta.id === 'string' && cuenta.id) { avisar(''); abrir(); }
  }

  // Vuelta con «Atrás» desde /acceso (caché del navegador): se pregunta otra vez.
  window.addEventListener('pageshow', evento => { if (evento && evento.persisted) comprobar(); });
  comprobar();
})();
