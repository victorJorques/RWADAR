(function () {
  'use strict';
  // Baja de los avisos de novedades sin entrar en la cuenta
  // (docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md). Cada aviso enlaza a
  // /baja?t=<token>. El token se lee una vez y se quita de la dirección antes de
  // cualquier petición, para que no quede en el historial ni en los marcadores.
  // La CSP no admite scripts en la página ni formularios (form-action 'none'):
  // por eso hay un botón y una petición fetch al mismo origen.
  const $ = id => document.getElementById(id);
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ALTERNATIVA = 'Escribe a RWAdar@protonmail.com con el asunto «baja» y la tramitamos a mano.';
  const parametros = new URLSearchParams(location.search);
  let token = parametros.get('t');
  if (parametros.has('t')) {
    parametros.delete('t');
    const resto = parametros.toString();
    try { history.replaceState(null, '', location.pathname + (resto ? '?' + resto : '')); }
    catch { /* Sin history no se bloquea la baja. */ }
  }
  token = typeof token === 'string' && UUID.test(token.trim()) ? token.trim().toLowerCase() : null;
  const boton = $('baja');
  function mensaje(texto) { $('estado').textContent = texto; }
  if (!token) {
    mensaje('Este enlace de baja no es válido o está incompleto. ' + ALTERNATIVA);
    return;
  }
  mensaje('Pulsa el botón para dejar de recibir los avisos de novedades de RWAdar.');
  boton.hidden = false;
  let ocupado = false;
  boton.addEventListener('click', async () => {
    if (ocupado || !token) return;
    ocupado = true; boton.disabled = true;
    const abortar = new AbortController(); const reloj = setTimeout(() => abortar.abort(), 10000);
    try {
      // Sin cookie de sesión: la baja solo necesita el token del enlace.
      const respuesta = await fetch('/api/acceso/baja', { method: 'POST', credentials: 'omit', cache: 'no-store',
        redirect: 'error', referrerPolicy: 'no-referrer', signal: abortar.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (respuesta.status === 429) { mensaje('Has hecho varios intentos. Espera unos minutos y vuelve a intentarlo.'); return; }
      if (!respuesta.ok) throw new Error('baja');
      // El servidor responde lo mismo exista o no el token: el mensaje no puede
      // afirmar que había una suscripción.
      token = null; boton.hidden = true;
      mensaje('Hecho. Si este enlace correspondía a una suscripción, ya no recibirás avisos de novedades de RWAdar, ni por correo ni en el móvil.');
    } catch {
      mensaje('No se ha podido completar la baja ahora. Vuelve a intentarlo. ' + ALTERNATIVA);
    } finally {
      clearTimeout(reloj); ocupado = false;
      if (token) boton.disabled = false;
    }
  });
})();
