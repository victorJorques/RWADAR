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
  let cargaTurnstile = null, widget = null;
  function mensaje(texto) { $('estado').textContent = texto; }
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
    const caja = $('robot');
    if (widget !== null) { try { ts.remove(widget); } catch { /* already removed */ } widget = null; }
    caja.hidden = false;
    return new Promise((ok, mal) => {
      let reloj = null;
      const fin = (accion, valor) => { clearTimeout(reloj); caja.hidden = true; accion(valor); };
      const falla = () => fin(mal, new Error('No hemos podido comprobar que no eres un robot. Vuelve a intentarlo.'));
      reloj = setTimeout(falla, 120000);
      try {
        widget = ts.render(caja, { sitekey: TURNSTILE_SITEKEY, language: 'es', appearance: 'interaction-only',
          callback: token => fin(ok, token), 'error-callback': falla, 'expired-callback': falla, 'timeout-callback': falla });
      } catch { falla(); }
    });
  }
  function cambiar(siguiente) {
    vista = siguiente; $('clave').value = ''; $('condiciones').checked = false;
    $('siguiente-alta').hidden = true; $('acciones').hidden = false; form.hidden = false;
    const alta = vista === 'registrar', nueva = vista === 'nueva-clave';
    $('campo-nombre').hidden = !alta; $('campo-condiciones').hidden = !alta;
    $('campo-clave').hidden = !['entrar', 'registrar', 'nueva-clave'].includes(vista);
    $('clave').required = !$('campo-clave').hidden;
    $('clave').autocomplete = alta || nueva ? 'new-password' : 'current-password';
    $('correo').readOnly = nueva; $('enviar').textContent = textos[vista];
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
          condiciones: 'Acepta las condiciones y la privacidad para registrarte.', configuracion_pendiente: 'El acceso todavía necesita configuración. Inténtalo más tarde.',
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
  function regresar() {
    const value = new URLSearchParams(location.search).get('volver') || '/';
    let path = '/';
    try { const target = new URL(value, location.origin);
      if (value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n\u0000]/.test(value) && target.origin === location.origin &&
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
    if (vista === 'registrar' && !data.aceptaCondiciones) { mensaje('Acepta las condiciones y la privacidad para registrarte.'); return; }
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
    try { await terminarCierre(); const result = await api('adoptar', { access_token: enlace.access_token, confirmarIdentidad: true }); await confirmarSesion(result); enlace = null; regresar(); }
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
  if (cierrePendiente) {
    mensaje('El cierre anterior todavía no se confirmó. Necesitas conexión para terminarlo antes de entrar.');
    terminarCierre().then(() => mensaje('Sesión anterior cerrada. Ya puedes entrar.')).catch(() => {});
  }
})();
