/* Service worker suicida.
   Sustituye al anterior en la misma ruta. El navegador comprueba este
   fichero cuando se abre la aplicación; al ver que ha cambiado, instala
   este, y este lo único que hace es borrar todas las cachés, darse de baja
   y recargar las ventanas abiertas para que no quede nada en pie.

   No cachea nada ni intercepta nada: si en algún aparato tarda en llegar,
   como mucho seguirá la copia vieja hasta la siguiente apertura. */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    try {
      const nombres = await caches.keys();
      await Promise.all(nombres.map((n) => caches.delete(n)));
    } catch (_) {}

    try { await self.registration.unregister(); } catch (_) {}

    try {
      const ventanas = await self.clients.matchAll({ type: 'window' });
      for (const v of ventanas) v.navigate(v.url);
    } catch (_) {}
  })());
});
