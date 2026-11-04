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
// Inicio sin salto al cargar (remates 04/11/2026). Va aparte, después del
// bloque del idioma, para que sus `return` no la corten. Solo en Inicio («/»).
// - Tableta y escritorio (768 px o más, salvo un móvil apaisado): marca
//   html.escritorio-relato y la historia va arriba desde la primera pintura.
// - Móvil sin ancla: marca html.movil-relato y el CSS enseña ya Inicio, que es
//   la pestaña con la que abre. Se quita en DOMContentLoaded, cuando el JS ya ha
//   elegido pestaña; si el JS no llega, vuelve el catálogo sin JS.
// La consulta del móvil es la misma de Movil en rwadar-20260820.js, que luego
// mantiene escritorio-relato al cambiar el tamaño.
(() => {
  try {
    if (typeof location === 'undefined' || location.pathname !== '/' || typeof globalThis.matchMedia !== 'function') return;
    const raiz = document.documentElement;
    if (!globalThis.matchMedia('(max-width: 767px), (max-width: 960px) and (max-height: 540px) and (hover: none) and (pointer: coarse)').matches) {
      if (globalThis.matchMedia('(min-width: 768px)').matches) raiz.classList.add('escritorio-relato');
      return;
    }
    if (location.hash && location.hash.length > 1) return;
    raiz.classList.add('movil-relato');
    document.addEventListener('DOMContentLoaded', () => raiz.classList.remove('movil-relato'), { once: true });
  } catch {}
})();
