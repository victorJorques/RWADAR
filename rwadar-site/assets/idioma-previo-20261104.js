'use strict';
// Va en <head>, sin defer, antes de pintar nada. En escritorio, si la
// preferencia guardada es inglés, la página nace oculta (clase idioma-previo,
// en idioma-20261022.css) hasta que idioma-web termina de traducirla. Así no se
// ve primero en castellano y salta al traducirse (QA 04/11/2026, n.º 7).
// En el móvil no saltaba (CLS 0): ocultarla solo retrasaba la primera pintura,
// así que allí no se hace nada.
// No toca lang: lo pone idioma-web al traducir. Si idioma-web no llega a
// cargar, la página sigue en castellano y con lang="es".
// Tope de 1,5 s contados desde el inicio de la navegación. El temporizador no
// puede cortar el JS diferido ni la traducción: con la CPU ocupada, la página
// sale en cuanto el hilo queda libre (unos 2 s con la CPU x4), pero nunca se
// queda en blanco para siempre.
// Sin red, sin innerHTML y sin estilos en línea (CSP).
(() => {
  let guardado = null;
  try { guardado = localStorage.getItem('rwadar.idioma'); } catch { return; }
  if (guardado !== 'en') return;
  // El mismo corte que la vista móvil de la web (rwadar-20260820.js).
  const movil = '(max-width:767px),(max-width:960px) and (max-height:540px) and (hover:none) and (pointer:coarse)';
  if (typeof matchMedia !== 'function' || matchMedia(movil).matches) return;
  const ahora = typeof performance === 'object' && performance && typeof performance.now === 'function' ? performance.now() : 0;
  const restante = 1500 - ahora;
  if (!(restante > 0)) return;
  const raiz = document.documentElement;
  raiz.classList.add('idioma-previo');
  let traducida = false, cargada = false;
  const mostrar = () => raiz.classList.remove('idioma-previo');
  const intentar = () => { if (traducida && cargada) mostrar(); };
  // Se enseña cuando idioma-web ha traducido y todos los scripts diferidos
  // han pintado lo suyo (DOMContentLoaded), o al vencer el tope.
  document.addEventListener('DOMContentLoaded', () => { cargada = true; intentar(); }, { once: true });
  globalThis.RWAdarIdiomaListo = () => { traducida = true; intentar(); };
  setTimeout(mostrar, restante);
})();
