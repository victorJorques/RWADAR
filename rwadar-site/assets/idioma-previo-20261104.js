'use strict';
// Va en <head>, sin defer, antes de pintar nada. Si la preferencia guardada es
// inglés, la página nace con lang="en" y oculta (clase idioma-previo, en
// idioma-20261022.css) hasta que idioma-web termina de traducirla. Así no se ve
// primero en castellano y salta al traducirse (QA 04/11/2026, n.º 7).
// Tope de 1,5 s: pase lo que pase, la página nunca se queda en blanco.
// Sin red, sin innerHTML y sin estilos en línea (CSP).
(() => {
  let guardado = null;
  try { guardado = localStorage.getItem('rwadar.idioma'); } catch { return; }
  if (guardado !== 'en') return;
  const raiz = document.documentElement;
  raiz.lang = 'en';
  raiz.classList.add('idioma-previo');
  let traducida = false, cargada = false;
  const mostrar = () => raiz.classList.remove('idioma-previo');
  const intentar = () => { if (traducida && cargada) mostrar(); };
  // Se enseña cuando idioma-web ha traducido y todos los scripts diferidos
  // han pintado lo suyo (DOMContentLoaded), o a los 1,5 s.
  document.addEventListener('DOMContentLoaded', () => { cargada = true; intentar(); }, { once: true });
  globalThis.RWAdarIdiomaListo = () => { traducida = true; intentar(); };
  setTimeout(mostrar, 1500);
})();
