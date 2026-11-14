'use strict';
// Diccionario inglés solo para quien lo usa (limpieza de la web, 13/11/2026).
// Antes, cada página lo pedía con <script defer> y quien navega en castellano
// se descargaba 226 kB (57 kB comprimidos) que no usaba. Ahora las páginas lo
// apuntan en data-idioma-en de este mismo <script> (rutas separadas por un
// espacio; el publicador les pone la huella como a cualquier otra) y:
// - Con «en» guardado, aquí mismo se escriben sus <script defer> con
//   document.write. Quedan en <head>, antes del motor (idioma-20261022.js), y
//   se ejecutan en el mismo orden y momento que antes: el motor arma su mapa
//   con el diccionario completo y la página entra en inglés como siempre
//   (también /#explain en la app).
// - En castellano, el motor carga sin diccionario. RWAdarIdioma es entonces
//   una fachada del motor: al elegir «English», carga el diccionario y vuelve
//   a ejecutar el motor (el mismo archivo, ya en la caché) para usar su
//   traducción completa. El idioma actual y las suscripciones se quedan en el
//   primer motor, así que para el resto de la web no cambia nada. Sin red,
//   cambia igual (sin diccionario) y lo vuelve a intentar la próxima vez.
// El motor es copia exacta del de la app (rwadar-movil/lib/idioma.js): no se
// toca; esto vive solo en la web.
(() => {
  const yo = document.currentScript;
  const lista = String((yo && yo.dataset && yo.dataset.idiomaEn) || '').split(/\s+/)
    .filter(ruta => /^\/assets\/[\w.-]+\.js$/.test(ruta));
  if (!lista.length) return;
  let guardado = null;
  try { guardado = localStorage.getItem('rwadar.idioma'); } catch { /* sin almacenamiento: castellano */ }
  if (guardado === 'en' && document.readyState === 'loading') {
    document.write(lista.map(ruta => '<script src="' + ruta + '" defer><\/script>').join(''));
  }
  let motor = null, completo = null, fachada, rutaMotor = '', conDiccionario = false, carga = null, cambios = 0;
  const listo = () => conDiccionario || !!completo;
  // Diccionarios y motor, en este orden (async=false respeta el orden de inserción).
  const cargarIngles = () => carga || (carga = new Promise((ok, mal) => {
    if (listo()) { ok(); return; }
    if (!rutaMotor) { mal(new Error('sin motor')); return; }
    let fallo = false;
    const scripts = [...lista, rutaMotor].map(ruta => {
      const s = document.createElement('script');
      s.src = ruta; s.async = false;
      s.addEventListener('error', () => { fallo = true; }, { once: true });
      return s;
    });
    const ultimo = scripts[scripts.length - 1];
    ultimo.addEventListener('load', () => {
      if (fallo || !completo) { completo = null; mal(new Error('sin diccionario')); } else ok();
    }, { once: true });
    ultimo.addEventListener('error', () => mal(new Error('sin motor')), { once: true });
    for (const s of scripts) document.head.appendChild(s);
  }).catch(e => { carga = null; throw e; }));
  Object.defineProperty(globalThis, 'RWAdarIdioma', {
    configurable: true, enumerable: true,
    get: () => fachada,
    set(api) {
      if (motor) { completo = api; return; }
      motor = api;
      conDiccionario = !!globalThis.RWAdarEnglish;
      rutaMotor = (document.currentScript && document.currentScript.src) || '';
      fachada = Object.freeze({ ...api,
        ingles: (texto, profundidad) => (completo || motor).ingles(texto, profundidad),
        traducir: (texto, idioma = motor.obtenerIdioma()) => idioma === 'en' ? (completo || motor).ingles(texto) : texto,
        cambiarIdioma(idioma) {
          // Gana la última elección: si mientras llega el diccionario se elige
          // otra vez «Español», el inglés que llega tarde no se aplica.
          const turno = ++cambios;
          if (idioma !== 'en' || listo()) return motor.cambiarIdioma(idioma);
          return cargarIngles().catch(() => {})
            .then(() => (cambios === turno ? motor.cambiarIdioma(idioma) : motor.obtenerIdioma()));
        },
        cargarIdioma(entrada) {
          if (listo()) return motor.cargarIdioma(entrada);
          const antes = cambios;
          return Promise.resolve().then(() => entrada.getItem(motor.CLAVE_IDIOMA)).catch(() => null)
            .then(valor => (valor === 'en' ? cargarIngles().catch(() => {}) : null))
            .then(() => (cambios === antes ? motor.cargarIdioma(entrada) : motor.obtenerIdioma()));
        },
      });
    },
  });
})();
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
// Este bloque: sin red, sin innerHTML y sin estilos en línea (CSP).
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
