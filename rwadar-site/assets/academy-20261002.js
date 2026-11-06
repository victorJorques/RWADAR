/* =====================================================================
   RWAdar Academy · test de cada lección y progreso del alumno
   ---------------------------------------------------------------------
   Con una cuenta confirmada: el progreso (lecciones leídas y tests
   hechos) vive en el localStorage de este navegador separado por cuenta. Si el
   navegador no deja guardar (modo privado, almacenamiento bloqueado),
   la lección se lee igual y el test funciona; solo se oculta el botón
   de «Marcar como leída» para no prometer algo que no se cumplirá.

   La página funciona sin este script: el índice se despliega y cada
   respuesta del test se puede abrir con «Ver respuesta».
   ===================================================================== */
(async () => {
  'use strict';
  /* Sin cuenta (las cuentas están en pausa) la lección y el test funcionan
     igual; solo no se guarda el progreso. El test no espera a la cuenta. */
  let CLAVE = '';
  const cuentaLista = (async () => {
    try {
      const cuenta = await window.RWADAR_ACCESO.verificar();
      if (cuenta && cuenta.id) CLAVE = 'rwadar.academy.v1:' + cuenta.id;
    } catch (_) { CLAVE = ''; }
  })();
  const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const vacio = () => ({ leidas: [], tests: {} });

  function leer() {
    if (!CLAVE) return vacio();
    try {
      const valor = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return vacio();
      const leidas = Array.isArray(valor.leidas)
        ? [...new Set(valor.leidas.filter(s => typeof s === 'string' && SLUG.test(s)))] : [];
      const tests = {};
      if (valor.tests && typeof valor.tests === 'object' && !Array.isArray(valor.tests)) {
        for (const [slug, t] of Object.entries(valor.tests)) {
          if (SLUG.test(slug) && t && Number.isInteger(t.aciertos) && Number.isInteger(t.total) &&
              t.aciertos >= 0 && t.total > 0 && t.aciertos <= t.total) {
            tests[slug] = { aciertos: t.aciertos, total: t.total };
          }
        }
      }
      return { leidas, tests };
    } catch (_) { return vacio(); }
  }

  function guardar(estado) {
    if (!CLAVE) return false;
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); return true; }
    catch (_) { return false; }
  }

  function sePuedeGuardar() {
    if (!CLAVE) return false;
    try {
      const prueba = CLAVE + '.prueba';
      localStorage.setItem(prueba, '1');
      localStorage.removeItem(prueba);
      return true;
    } catch (_) { return false; }
  }

  /* ---- página de lección ---- */
  const leccion = document.querySelector('[data-academy-leccion]');
  if (leccion) {
    const slug = leccion.getAttribute('data-academy-leccion');
    const guardable = () => SLUG.test(slug) && sePuedeGuardar();

    const caja = document.querySelector('[data-academy-marcar-caja]');
    const boton = document.querySelector('[data-academy-marcar]');
    const aviso = document.querySelector('[data-academy-leida-aviso]');
    const pintarLeida = () => {
      const leida = leer().leidas.includes(slug);
      boton.setAttribute('aria-pressed', String(leida));
      boton.textContent = leida ? '✓ Leída · quitar la marca' : 'Marcar como leída';
      aviso.hidden = !leida;
    };
    cuentaLista.then(() => {
      if (!guardable() || !caja || !boton || !aviso) return;
      caja.hidden = false;
      pintarLeida();
      boton.addEventListener('click', () => {
        const estado = leer();
        estado.leidas = estado.leidas.includes(slug)
          ? estado.leidas.filter(s => s !== slug) : [...estado.leidas, slug];
        guardar(estado);
        pintarLeida();
      });
    });

    /* Test: al elegir una opción se corrige, se bloquea la pregunta y se
       abre siempre la explicación, aciertes o no. El test enseña. */
    const preguntas = [...document.querySelectorAll('[data-academy-pregunta]')];
    const resumen = document.querySelector('[data-academy-resumen]');
    const textoAciertos = document.querySelector('[data-academy-aciertos]');
    const resultados = new Map();
    const letras = 'ABCD';
    preguntas.forEach((pregunta, indice) => {
      const correcta = Number(pregunta.getAttribute('data-correcta'));
      const opciones = [...pregunta.querySelectorAll('input[type="radio"]')];
      const veredicto = pregunta.querySelector('[data-academy-veredicto]');
      const explicacion = pregunta.querySelector('[data-academy-explicacion]');
      opciones.forEach(opcion => opcion.addEventListener('change', () => {
        if (resultados.has(indice)) return;
        const elegida = Number(opcion.value);
        const acierto = elegida === correcta;
        resultados.set(indice, acierto);
        pregunta.classList.add('ac-respondida');
        opciones.forEach(o => {
          o.disabled = true;
          const etiqueta = o.closest('.ac-opcion');
          if (Number(o.value) === correcta) etiqueta.classList.add('ac-opcion-correcta');
          else if (o === opcion) etiqueta.classList.add('ac-opcion-incorrecta');
        });
        veredicto.textContent = acierto
          ? '✓ Correcto. Lee la explicación para fijarlo.'
          : `✕ No es esa. La correcta es la ${letras[correcta]}: aquí tienes por qué.`;
        veredicto.classList.add(acierto ? 'ac-bien' : 'ac-mal');
        veredicto.hidden = false;
        if (explicacion) explicacion.open = true;

        if (resultados.size === preguntas.length && resumen && textoAciertos) {
          const aciertos = [...resultados.values()].filter(Boolean).length;
          textoAciertos.textContent = `Has acertado ${aciertos} de ${preguntas.length}.` +
            (aciertos === preguntas.length ? ' Lección dominada.' : ' Repasa las explicaciones de las que fallaste.');
          resumen.hidden = false;
          if (guardable()) {
            const estado = leer();
            estado.tests[slug] = { aciertos, total: preguntas.length };
            guardar(estado);
          }
        }
      }));
    });

    /* Índice: abierto en escritorio (es lateral), plegado en el móvil. */
    const indicePlegable = document.querySelector('[data-academy-indice]');
    const estrecha = window.matchMedia('(max-width: 999px)');
    if (indicePlegable) {
      if (estrecha.matches) indicePlegable.open = false;
      indicePlegable.addEventListener('click', e => {
        if (estrecha.matches && e.target.closest('a')) indicePlegable.open = false;
      });
      /* Marca la sección que se está leyendo. */
      const enlaces = [...indicePlegable.querySelectorAll('a[href^="#"]')];
      const secciones = enlaces.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
      if ('IntersectionObserver' in window && secciones.length) {
        const observador = new IntersectionObserver(entradas => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            const id = entrada.target.id;
            enlaces.forEach(a => a.classList.toggle('ac-activa', a.getAttribute('href') === '#' + id));
          }
        }, { rootMargin: '0px 0px -70% 0px' });
        secciones.forEach(s => observador.observe(s));
      }
    }
  }

  /* ---- índice de la Academy ---- */
  const portada = document.querySelector('[data-academy-indice-pagina]');
  /* Vuelta del correo de confirmación sin lección guardada (acceso.js):
     /academy/#cuenta-confirmada. Se avisa una vez y se quita el fragmento. */
  if (portada && location.hash === '#cuenta-confirmada') {
    const cab = portada.querySelector('.ac-portada-cab');
    if (cab) {
      const aviso = document.createElement('p');
      aviso.className = 'ac-confirmada';
      aviso.setAttribute('role', 'status');
      aviso.textContent = 'Cuenta confirmada: Academy desbloqueada';
      cab.insertBefore(aviso, cab.firstChild);
    }
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (_) {}
  }
  if (portada) await cuentaLista;
  /* Con sesión, la invitación a crear cuenta ya no tiene sentido. */
  if (portada && CLAVE) {
    portada.querySelectorAll('.ac-acciones a[href^="/acceso"]').forEach(a => {
      const fila = a.closest('.ac-acciones');
      if (fila) fila.hidden = true;
    });
  }
  if (portada && sePuedeGuardar()) {
    const estado = leer();
    const tarjetas = [...document.querySelectorAll('[data-academy-tarjeta]')];
    let leidas = 0;
    tarjetas.forEach(tarjeta => {
      const slug = tarjeta.getAttribute('data-academy-tarjeta');
      const marca = tarjeta.querySelector('[data-academy-leida]');
      const leida = estado.leidas.includes(slug);
      const test = estado.tests[slug];
      if (leida) leidas++;
      if (marca && (leida || test)) {
        marca.textContent = [leida ? '✓ Leída' : '', test ? `Test ${test.aciertos}/${test.total}` : '']
          .filter(Boolean).join(' · ');
        marca.hidden = false;
      }
    });
    const progreso = document.querySelector('[data-academy-progreso]');
    const barra = progreso && progreso.querySelector('progress');
    const numero = document.querySelector('[data-academy-progreso-n]');
    if (progreso && barra && numero && tarjetas.length) {
      barra.value = leidas;
      numero.textContent = String(leidas);
      progreso.hidden = false;
    }
  }
})();
