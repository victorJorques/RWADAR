/* La consulta es pública; la cuenta protege los datos privados. Sustituye
   el antiguo modo sin red: borra solo sus copias y no almacena páginas ni
   datos de cuenta. La página gestiona la recarga al cambiar el controlador;
   la activación no navega clientes ni espera una navegación. */
const VERSION = 'rwadar-vacceso-obligatorio-20261023';
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const anteriores = (await caches.keys()).filter(nombre => nombre.startsWith('rwadar-v'));
    await Promise.all(anteriores.map(nombre => caches.delete(nombre)));
    await self.clients.claim();
  })());
});
// Sin manejador fetch: consulta pública y comprobación de cuenta en sus endpoints.
