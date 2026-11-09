(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('formulario'); let vista = 'entrar', ocupado = false, enlace = null;
  let cierrePendiente = sessionStorage.getItem('rwadar.cierre.pendiente') === 'si', cierreEnCurso = null;
  const textos = { entrar: 'Entrar', registrar: 'Crear cuenta gratis', recuperar: 'Enviar enlace de recuperación', reenviar: 'Reenviar confirmación', 'nueva-clave': 'Guardar nueva contraseña' };
  // Cloudflare Turnstile before each request that tests a password or sends an
  // email. Empty: off and nothing external loads. Turning it on also needs the
  // CSP, the privacy text and Auth's CAPTCHA switch, in the order given in
  // docs/tareas/ANTI-ROBOTS-Y-LIMITES-2026-11-01.md, or Android sign-in breaks.
  const TURNSTILE_SITEKEY = '';
  const CON_ROBOT = ['entrar', 'registrar', 'recuperar', 'reenviar'];
  // Avisos de novedades (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md).
  // Apagado: la casilla no se ve y el alta no envía avisosNovedades. Se enciende
  // solo con la base (30), la plantilla de confirmación de Auth y la privacidad
  // al día, a la vez que el de rwadar-20260820.js y el de la app.
  const AVISOS_NOVEDADES_REMOTOS = false;
  // Vuelta a la lección tras confirmar el correo: se guarda 24 horas en este
  // navegador. Solo rutas de lecciones propias; nunca un token ni el correo.
  const CLAVE_VOLVER = 'rwadar.alta.volver', DURACION_VOLVER = 24 * 60 * 60 * 1000;
  let cargaTurnstile = null, widget = null, turnoRobot = 0;
  function mensaje(texto) { $('estado').textContent = texto; }
  // Una lección de la Academy de este mismo sitio: /academy/<slug>, /<slug>/ o
  // /<slug>.html. El índice /academy/ y cualquier otra ruta no cuentan.
  function rutaLeccion(valor) {
    if (typeof valor !== 'string' || valor.length > 200 || !valor.startsWith('/') || valor.startsWith('//') ||
      /[\\\r\n\u0000]/.test(valor)) return null;
    try {
      const destino = new URL(valor, location.origin);
      if (destino.origin !== location.origin || destino.search || destino.hash) return null;
      return /^\/academy\/(?!index(?:\.html)?$)[a-z0-9][a-z0-9-]*(?:\/|\.html)?$/i.test(destino.pathname) ? destino.pathname : null;
    } catch { return null; }
  }
  const volverPedido = new URLSearchParams(location.search).get('volver');
  const volverLeccion = rutaLeccion(volverPedido);
  // El índice de la Academy («Crea tu cuenta gratis») y la puerta del tutorial
  // 3D del móvil mandan a /acceso?volver=/academy/: también abren el alta, pero
  // no guardan vuelta (al confirmar ya se va a /academy/#cuenta-confirmada).
  const vieneDeAcademy = !!volverLeccion || ['/academy/', '/academy', '/academy/index.html'].includes(volverPedido);
  function guardarVolver(ruta) {
    try { localStorage.setItem(CLAVE_VOLVER, JSON.stringify({ ruta, hasta: Date.now() + DURACION_VOLVER })); }
    catch { /* Sin almacenamiento, al confirmar se va al índice de la Academy. */ }
  }
  // La lección de un destino guardado, o null si ha caducado, dura más de 24
  // horas (manipulado) o no es una lección propia.
  function volverVigente(guardado) {
    if (!guardado || typeof guardado.hasta !== 'number' || guardado.hasta < Date.now() ||
      guardado.hasta > Date.now() + DURACION_VOLVER) return null;
    return rutaLeccion(guardado.ruta);
  }
  // Lee y borra a la vez: el destino guardado sirve una sola vez.
  function tomarVolver() {
    try {
      const crudo = localStorage.getItem(CLAVE_VOLVER);
      localStorage.removeItem(CLAVE_VOLVER);
      return volverVigente(JSON.parse(crudo || 'null'));
    } catch { return null; }
  }
  // En cualquier carga de /acceso, un destino caducado o que no sirve se borra
  // ya, sin esperar a que se confirme el correo (RGPD, art. 5.1.e). Uno vigente
  // se queda para la vuelta tras confirmar.
  function limpiarVolver() {
    try {
      const crudo = localStorage.getItem(CLAVE_VOLVER);
      if (crudo === null) return;
      let ruta = null;
      try { ruta = volverVigente(JSON.parse(crudo)); } catch { /* ilegible: se borra */ }
      if (!ruta) localStorage.removeItem(CLAVE_VOLVER);
    } catch { /* Sin almacenamiento no hay nada que borrar. */ }
  }
  limpiarVolver();
  // Idioma en que se ve el texto de la casilla de avisos, para guardarlo con el
  // permiso. /acceso no carga el traductor de la web (idioma-web): se ve siempre
  // en castellano y su <html lang> es «es». Si algún día lo carga, idioma-web
  // pone lang="en" al traducir; aun así solo cuenta como inglés si el texto de
  // la casilla se ha traducido de verdad.
  function idiomaCasilla() {
    try {
      const ingles = /^en(?:-|$)/i.test(document.documentElement.lang || '');
      const texto = String($('campo-avisos-novedades').textContent || '').trim();
      return ingles && texto !== '' && !texto.startsWith('Quiero recibir avisos') ? 'en' : 'es';
    } catch { return 'es'; }
  }
  function cargarTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!cargaTurnstile) cargaTurnstile = new Promise((ok, mal) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
      const falla = () => { cargaTurnstile = null; script.remove(); mal(new Error('turnstile')); };
      script.onload = () => window.turnstile ? ok(window.turnstile) : falla();
      script.onerror = falla;
      document.head.appendChild(script);
    });
    return cargaTurnstile;
  }
  // Each request gets a fresh token: Turnstile tokens are single-use.
  async function comprobarRobot() {
    let ts;
    try { ts = await cargarTurnstile(); }
    catch { throw new Error('No se ha podido cargar la comprobación anti-robots. Revisa la conexión o permite este sitio en tu bloqueador y vuelve a intentarlo.'); }
    const caja = $('robot'), turno = ++turnoRobot;
    if (widget !== null) { try { ts.remove(widget); } catch { /* already removed */ } widget = null; }
    caja.hidden = false;
    return new Promise((ok, mal) => {
      let reloj = null;
      // A late callback from an earlier check must not settle or hide this one.
      const fin = (accion, valor) => { if (turno !== turnoRobot) return; turnoRobot++; clearTimeout(reloj); caja.hidden = true; accion(valor); };
      // Returning true tells Turnstile the error was handled here.
      const falla = () => { fin(mal, new Error('No hemos podido comprobar que no eres un robot. Vuelve a intentarlo.')); return true; };
      reloj = setTimeout(falla, 120000);
      try {
        widget = ts.render(caja, { sitekey: TURNSTILE_SITEKEY, language: 'es', appearance: 'interaction-only',
          callback: token => fin(ok, token), 'error-callback': falla, 'expired-callback': falla, 'timeout-callback': falla });
      } catch { falla(); }
    });
  }
  function cambiar(siguiente) {
    vista = siguiente; $('clave').value = ''; $('condiciones').checked = false; $('avisos-novedades').checked = false;
    $('siguiente-alta').hidden = true; $('acciones').hidden = false; form.hidden = false;
    const alta = vista === 'registrar', nueva = vista === 'nueva-clave';
    $('campo-nombre').hidden = !alta; $('campo-condiciones').hidden = !alta;
    // Casilla aparte, sin marcar y solo al crear la cuenta.
    $('campo-avisos-novedades').hidden = !(alta && AVISOS_NOVEDADES_REMOTOS);
    // La información básica sobre los datos va junto a la casilla, con ella.
    $('info-datos').hidden = !(alta && AVISOS_NOVEDADES_REMOTOS);
    $('campo-clave').hidden = !['entrar', 'registrar', 'nueva-clave'].includes(vista);
    $('clave').required = !$('campo-clave').hidden;
    $('clave').autocomplete = alta || nueva ? 'new-password' : 'current-password';
    $('correo').readOnly = nueva; $('enviar').textContent = textos[vista];
    // El botón de la vista abierta no se repite debajo del formulario: en «Entrar»
    // sobraba «Ya tengo cuenta» (QA 04/11/2026, n.º 27).
    for (const otro of document.querySelectorAll('#acciones [data-vista]')) if (otro.closest && otro.closest('#acciones')) otro.hidden = otro.dataset.vista === vista;
    $('titulo').textContent = nueva ? 'Elige tu nueva contraseña' : alta ? 'Crea tu cuenta gratuita' : vista === 'entrar' ? 'Tu radar, con tu cuenta' : 'Recupera tu acceso';
    mensaje('');
  }
  async function api(accion, data) {
    const abortar = new AbortController(); const reloj = setTimeout(() => abortar.abort(), 10000);
    try {
      const response = await fetch('/api/acceso/' + accion, { method: 'POST', credentials: 'same-origin',
        cache: 'no-store', redirect: 'error', signal: abortar.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) {
        const mensajes = { correo_invalido: 'Escribe un correo válido.', clave_corta: 'Usa una contraseña de al menos 12 caracteres.',
          condiciones: 'Confirma que tienes 18 años o más y acepta las condiciones y la privacidad para registrarte.', configuracion_pendiente: 'El acceso todavía necesita configuración. Inténtalo más tarde.',
          captcha_fallido: 'No hemos podido comprobar que no eres un robot. Vuelve a intentarlo.' };
        throw new Error(response.status === 429 ? 'Has hecho varios intentos. Espera antes de repetir.' :
          mensajes[result.error] || 'No se pudo comprobar el acceso. Revisa tus datos o solicita otro enlace.');
      }
      return result;
    } finally { clearTimeout(reloj); }
  }
  function errorSesion(codigo) {
    const error = new Error(codigo === 'S401'
      ? 'No se ha confirmado la sesión en este navegador. Vuelve a entrar. Código S401.'
      : codigo === 'S503'
        ? 'El servicio no ha podido comprobar tu sesión. Inténtalo de nuevo. Código S503.'
        : codigo === 'SID'
          ? 'La sesión no coincide con la cuenta que intentas abrir. Vuelve a entrar. Código SID.'
          : 'No se pudo comprobar tu sesión. Revisa la conexión e inténtalo de nuevo. Código SRED.');
    error.comprobacionSesion = true; return error;
  }
  async function confirmarSesion(resultado) {
    const uid = resultado?.usuario?.id;
    if (resultado?.autenticada !== true || typeof uid !== 'string' || !uid) throw errorSesion('SID');
    const abortar = new AbortController(); const reloj = setTimeout(() => abortar.abort(), 10000);
    try {
      const response = await fetch('/api/acceso/sesion', { method: 'GET', credentials: 'same-origin',
        cache: 'no-store', redirect: 'error', signal: abortar.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw errorSesion(response.status === 401 ? 'S401' : response.status === 503 ? 'S503' : 'SRED');
      const sesion = await response.json();
      if (sesion?.autenticada !== true || sesion?.usuario?.id !== uid) throw errorSesion('SID');
    } catch (error) {
      if (error.comprobacionSesion) throw error;
      throw errorSesion('SRED');
    } finally { clearTimeout(reloj); }
  }
  async function terminarCierre() {
    if (!cierrePendiente) return;
    // A delayed logout response must finish before a new login sets its cookie.
    // Page startup, form submission and email adoption share the same request.
    if (!cierreEnCurso) cierreEnCurso = (async () => {
      await api('salir', {});
      sessionStorage.removeItem('rwadar.cierre.pendiente'); cierrePendiente = false;
    })().finally(() => { cierreEnCurso = null; });
    await cierreEnCurso;
  }
  // Al confirmar el alta desde el correo (enlace sin «volver»), se vuelve a la
  // lección guardada al registrarse o, si no hay, al índice de la Academy con
  // el aviso «Cuenta confirmada: Academy desbloqueada» (#cuenta-confirmada).
  function regresarTrasConfirmar() {
    if (new URLSearchParams(location.search).has('volver')) { tomarVolver(); regresar(); return; }
    location.replace(tomarVolver() || '/academy/#cuenta-confirmada');
  }
  function regresar() {
    const value = new URLSearchParams(location.search).get('volver') || '/';
    let path = '/';
    // Se valida también la ruta ya normalizada: '/.//x', '/%2e//x' o '/a/..//x'
    // pasan la comprobación de la cadena, pero su pathname sale '//x', que
    // location.replace llevaría a otra web (revisión del 08/11/2026).
    try { const target = new URL(value, location.origin);
      if (value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n\u0000]/.test(value) && target.origin === location.origin &&
        target.pathname.startsWith('/') && !target.pathname.startsWith('//') && !target.pathname.includes('\\') &&
        !/^\/(?:api\/|acceso(?:\.html)?(?:\/|$))/.test(target.pathname)) path = target.pathname;
    } catch { /* Invalid destinations return to the protected home. */ }
    location.replace(path);
  }
  for (const button of document.querySelectorAll('[data-vista]')) button.addEventListener('click', () => {
    if (!ocupado) { enlace = null; $('identidad').hidden = true; form.hidden = false; cambiar(button.dataset.vista); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (ocupado || !form.reportValidity()) return;
    const data = { correo: $('correo').value, clave: $('clave').value, nombre: $('nombre').value,
      aceptaCondiciones: $('condiciones').checked };
    // Booleano estricto y solo en el alta, con el idioma del texto mostrado;
    // con el interruptor apagado no viaja ninguno de los dos.
    if (vista === 'registrar' && AVISOS_NOVEDADES_REMOTOS) {
      data.avisosNovedades = $('avisos-novedades').checked === true;
      data.idioma = idiomaCasilla();
    }
    if (vista === 'registrar' && !data.aceptaCondiciones) { mensaje('Confirma que tienes 18 años o más y acepta las condiciones y la privacidad para registrarte.'); return; }
    if (['registrar', 'nueva-clave'].includes(vista) && data.clave.length < 12) { mensaje('Usa una contraseña de al menos 12 caracteres.'); return; }
    if (vista === 'nueva-clave') data.access_token = enlace?.access_token;
    $('clave').value = ''; ocupado = true; $('enviar').disabled = true;
    try {
      await terminarCierre();
      if (TURNSTILE_SITEKEY && CON_ROBOT.includes(vista)) data.captcha = await comprobarRobot();
      const result = await api(vista, data);
      if (result.autenticada) { await confirmarSesion(result); regresar(); }
      else {
        if (vista === 'nueva-clave') { enlace = null; cambiar('entrar'); }
        mensaje(result.mensaje || 'Revisa tu correo para confirmar la cuenta.');
        if (vista === 'registrar') {
          if (volverLeccion) guardarVolver(volverLeccion);
          form.hidden = true; $('acciones').hidden = true; $('siguiente-alta').hidden = false;
          $('entrar-tras-alta').focus();
        }
      }
    } catch (error) { mensaje(error.name === 'AbortError' ? 'La conexión tarda demasiado. Inténtalo de nuevo.' : error.message); }
    finally { data.clave = ''; ocupado = false; $('enviar').disabled = false; }
  });
  $('adoptar').addEventListener('click', async () => {
    if (!enlace || ocupado) return;
    if (enlace.tipo === 'recovery') { form.hidden = false; $('identidad').hidden = true; cambiar('nueva-clave'); return; }
    ocupado = true; $('adoptar').disabled = true;
    try {
      await terminarCierre(); const result = await api('adoptar', { access_token: enlace.access_token, confirmarIdentidad: true });
      await confirmarSesion(result); const alta = enlace.tipo === 'signup'; enlace = null;
      if (alta) regresarTrasConfirmar(); else regresar();
    }
    catch (error) { mensaje(error.message); }
    finally { ocupado = false; $('adoptar').disabled = false; }
  });
  // The fragment never reaches the server or logs; scrub it before any call.
  const p = new URLSearchParams(location.hash.slice(1));
  const hayRetorno = ['access_token', 'error', 'error_code', 'error_description'].some(key => p.has(key));
  if (hayRetorno) {
    history.replaceState(null, '', location.pathname + location.search);
    if (p.has('error') || p.has('error_code') || p.has('error_description') || !['signup', 'recovery'].includes(p.get('type'))) {
      mensaje('El enlace no es válido o ha caducado. Solicita uno nuevo.');
    } else {
      enlace = { access_token: p.get('access_token'), tipo: p.get('type') }; form.hidden = true;
      api('inspeccionar', { access_token: enlace.access_token }).then(result => {
        $('correo').value = result.usuario.correo;
        $('correo-enlace').textContent = 'Este enlace corresponde a ' + result.usuario.correo + '. Continúa solo si es tu cuenta.';
        $('identidad').hidden = false;
      }).catch(() => { enlace = null; form.hidden = false; mensaje('El enlace no se pudo comprobar. Solicita uno nuevo.'); });
    }
  }
  // Llegada desde la Academy sin sesión: se abre «Crear cuenta gratis» o, con
  // vista=entrar («Ya tengo cuenta: entrar» del candado del índice), «Entrar».
  // Tras entrar, regresar() vuelve al «volver» de la dirección (/academy/).
  if (vieneDeAcademy && !hayRetorno) {
    $('introduccion').textContent = 'Las lecciones son gratis con cuenta. Si ya la tienes, entra.';
    cambiar(new URLSearchParams(location.search).get('vista') === 'entrar' ? 'entrar' : 'registrar');
  }
  if (cierrePendiente) {
    mensaje('El cierre anterior todavía no se confirmó. Necesitas conexión para terminarlo antes de entrar.');
    terminarCierre().then(() => mensaje('Sesión anterior cerrada. Ya puedes entrar.')).catch(() => {});
  }
})();
