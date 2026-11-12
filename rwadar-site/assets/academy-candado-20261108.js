/* =====================================================================
   RWAdar Academy · candado de las lecciones sin cuenta (08/11/2026)
   ---------------------------------------------------------------------
   Petición: sin cuenta, las lecciones salen difuminadas y con un
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

   Va en <head>, sin defer: marca html.candado-comprobando antes de pintar y
   el recuadro dice «Comprobando tu sesión…» en vez de invitar a crear una
   cuenta que quizá ya se tiene. Los botones salen cuando el servidor dice
   «sin sesión», si falla o a los 8 s; sin JavaScript se ven desde el
   principio. Con sesión, el recuadro se ve durante esa ida y vuelta (unos
   0,2-0,5 s) y luego se desvanece.

   No es la puerta de las lecciones: esa la pone el servidor, que sin sesión
   responde 303 a /acceso o 401. Esto es solo lo que se ve en el índice.
   ===================================================================== */
(function () {
  'use strict';
  const raiz = document.documentElement;
  // Se traduce con el diccionario de la web (idioma-en, «No hemos podido…»).
  const FALLO = 'No hemos podido comprobar tu sesión. Recarga la página.';
  let abierto = false, comprobando = false;
  raiz.classList.add('candado-comprobando');
  // Fin de «Comprobando tu sesión…»: se ven los botones (o ya está abierto).
  const decidido = () => raiz.classList.remove('candado-comprobando');
  const candados = () => [...document.querySelectorAll('[data-academy-candado]')];
  // Lo que solo tiene sentido sin cuenta (invitaciones) o con ella («desbloqueadas»).
  const marcados = sel => [...document.querySelectorAll(sel)];

  function abrir() {
    abierto = true;
    const foco = document.activeElement;
    for (const candado of candados()) {
      const contenido = candado.querySelector('[data-academy-candado-contenido]');
      const capa = candado.querySelector('[data-academy-candado-capa]');
      // Si el foco estaba en el recuadro, pasa al primer enlace de lo que se abre.
      const enRecuadro = !!(capa && foco && typeof capa.contains === 'function' && capa.contains(foco));
      if (contenido) { contenido.removeAttribute('inert'); contenido.removeAttribute('aria-hidden'); }
      if (capa) capa.hidden = true;
      candado.setAttribute('data-estado', 'abierto');
      const primero = enRecuadro && contenido && contenido.querySelector('a[href]');
      if (primero) primero.focus();
    }
    for (const el of marcados('[data-academy-sin-cuenta]')) el.hidden = true;
    for (const el of marcados('[data-academy-con-cuenta]')) el.hidden = false;
    decidido();
  }
  function avisar(texto) {
    for (const candado of candados()) {
      const linea = candado.querySelector('[data-academy-candado-error]');
      if (linea && linea.textContent !== texto) linea.textContent = texto;
    }
  }
  // Confirmado que sigue cerrado. Si se llegó con un ancla a algo de dentro
  // (/academy/#intermedio), el foco pasa al título del recuadro: si no, el Tab
  // seguiría desde lo bloqueado y se saltaría «Crear cuenta gratis».
  function enfocarRecuadro() {
    if (abierto) return;
    let destino = null;
    try { destino = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch (_) { destino = null; }
    const activo = document.activeElement;
    if (!destino || (activo && activo !== document.body && activo !== raiz)) return;
    for (const candado of candados()) {
      const contenido = candado.querySelector('[data-academy-candado-contenido]');
      const titulo = candado.querySelector('.candado-tit');
      if (contenido && titulo && typeof contenido.contains === 'function' && contenido.contains(destino)) {
        titulo.setAttribute('tabindex', '-1');
        titulo.focus();
        return;
      }
    }
  }
  function cerrado() {
    decidido();
    // Chromium aplica el ancla al terminar de cargar y entonces quita el foco:
    // el recuadro se enfoca después, con la página ya cargada y pintada.
    const luego = () => requestAnimationFrame(() => requestAnimationFrame(enfocarRecuadro));
    if (document.readyState === 'complete') luego();
    else window.addEventListener('load', luego, { once: true });
  }

  async function comprobar() {
    if (abierto || comprobando) return;
    // Sin la pasarela de sesión (página a medio redirigir o sin construir) no
    // se puede comprobar nada: se queda bloqueado, con los botones.
    const acceso = window.RWADAR_ACCESO;
    if (!acceso || typeof acceso.verificar !== 'function') { cerrado(); return; }
    comprobando = true;
    let cuenta = null;
    try { cuenta = await acceso.verificar(); }
    catch (error) {
      // Solo un fallo pasajero (red caída, 5xx, 429) merece la línea. Un «sin
      // sesión» (401/403) o una sesión que no cuadra dejan el candado tal cual.
      if (error && error.reintentable === true) avisar(FALLO);
      cerrado();
      return;
    } finally { comprobando = false; }
    if (cuenta && typeof cuenta.id === 'string' && cuenta.id) { avisar(''); abrir(); }
    else cerrado();
  }

  function iniciar() {
    if (!candados().length) { decidido(); return; }
    // Tutorial 3D dentro de la app (WebView en /#explain): como acceso-privado.js,
    // no se pregunta por la sesión. Allí solo se ve el tutorial.
    if (window.ReactNativeWebView && location.pathname === '/' && location.hash === '#explain') { decidido(); return; }
    // Vuelta con «Atrás» desde /acceso (caché del navegador): se pregunta otra
    // vez. Se registra aquí, después que el de la pasarela, que antes olvida su
    // «sin sesión».
    window.addEventListener('pageshow', evento => { if (evento && evento.persisted) comprobar(); });
    // Si la respuesta no llega, a los 8 s se ven igual los botones.
    setTimeout(decidido, 8000);
    comprobar();
  }
  // Con todo el HTML y los scripts diferidos (la pasarela) ya cargados.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
