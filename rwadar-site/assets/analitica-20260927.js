/* Medición agregada para la web/PWA pública. El identificador del sitio es
   público; no concede acceso al panel ni a la cuenta de Cloudflare. */
(() => {
  'use strict';
  const entrada = new URL(location.href);
  const paginas = new Set([
    '/', '/index.html', '/privacidad', '/privacidad.html',
    '/transparencia-comercial', '/transparencia-comercial.html',
    '/para-empresas', '/para-empresas.html',
  ]);
  // RWAdar Academy: el índice y cada lección, siempre con su URL limpia.
  const academy = /^\/academy\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
  // Se ejecuta antes del cliente Auth: un callback no debe medirse aunque
  // la aplicación limpie después el token o código de la barra de dirección.
  if (entrada.origin !== 'https://rwadar.pages.dev' ||
      (!paginas.has(entrada.pathname) && !academy.test(entrada.pathname)) ||
      entrada.search || entrada.hash || entrada.username || entrada.password) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true ||
      navigator.onLine === false) return;
  if (document.referrer) {
    try {
      const anterior = new URL(document.referrer);
      if (anterior.search || anterior.hash || anterior.username || anterior.password) return;
    } catch (_) { return; }
  }
  if (document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.referrerPolicy = 'no-referrer';
  script.setAttribute('data-cf-beacon', JSON.stringify({
    token: '104ff4d825364641952c49aef4c94fb1', spa: false,
  }));
  document.head.appendChild(script);
})();
