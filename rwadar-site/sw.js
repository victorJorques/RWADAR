/* RWAdar requiere sesión. Sustituye el antiguo modo sin red: borra sus
   copias y nunca almacena páginas ni datos de una cuenta. Se sirve sin
   sesión para actualizar las instalaciones anteriores. */
const VERSION = 'rwadar-vacceso-obligatorio-20261023';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const anteriores = (await caches.keys()).filter(nombre => nombre.startsWith('rwadar-v'));
    await Promise.all(anteriores.map(nombre => caches.delete(nombre)));
    await self.clients.claim();
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(ventanas.map(async ventana => {
      try { await ventana.navigate(ventana.url); } catch (_) { /* la próxima visita verificará la sesión */ }
    }));
  })());
});
// Sin manejador fetch: cada solicitud verifica la sesión en el servidor.
