/* =====================================================================
   RWAdar · el trabajador de segundo plano
   ---------------------------------------------------------------------
   Existe para una sola cosa: que rwadar.pages.dev se pueda INSTALAR y
   se comporte como una aplicación de verdad —icono propio, ventana sin
   barra de navegador, y el registro legible aunque no haya cobertura—.
   Una única dirección para la web y para la app, que era el problema.

   Un trabajador mal escrito no da un error visible: deja servida para
   siempre una versión vieja y parece que la web dejó de actualizarse.
   Por eso las cuatro reglas de abajo no se tocan sin pensarlo.

   1. LA PÁGINA SIEMPRE SE PIDE A LA RED PRIMERO. La copia guardada solo
      sale si la red falla. Así nunca se sirve una versión vieja teniendo
      cobertura, que es el fallo clásico de estas cosas.
   2. NO SE TOCA NADA QUE NO SEA DE ESTA CASA. Las consultas a Supabase
      pasan de largo: son datos vivos y además llevan sesión. Guardar una
      respuesta con sesión dentro sería un fallo de privacidad, no una
      optimización.
   3. SOLO GET, SOLO RESPUESTAS 200 PROPIAS. Nada de opacas, nada de
      parciales: guardar un 206 o un 404 envenena la caché.
   4. LA VERSIÓN MANDA. Al cambiar VERSION se borra todo lo anterior en
      cuanto el trabajador nuevo toma el control, y toma el control de
      inmediato (skipWaiting + claim) para que nadie se quede atrás.

   Para desactivarlo del todo: publicar este archivo con solo
   `self.registration.unregister()` dentro. La siguiente visita lo quita.
   ===================================================================== */

const VERSION = 'rwadar-v20260821-movil';

/* El armazón mínimo para que la aplicación abra sin red. Los datos no
   están aquí: la página los pide a Supabase al cargar y se repinta sola,
   y el HTML ya trae las fichas pre-renderizadas para poder leerse. */
const ARMAZON = [
  '/',
  '/privacidad',
  '/assets/rwadar-20260820.css',
  '/assets/rwadar-20260820.js',
  '/assets/privacidad-20260820.css',
  '/icono-192.png',
  '/icono-512.png',
  '/icono-maskable-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', e => {
  /* El armazón es un contrato atómico: si falta un solo recurso, addAll
     rechaza la instalación. En ese caso no se llama a skipWaiting, no llega
     activate y la caché anterior continúa sirviendo la versión completa. */
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(ARMAZON);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n !== VERSION).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* Solo se guarda lo que es nuestro, estático y sano. */
const guardable = (req, res) =>
  req.method === 'GET' &&
  new URL(req.url).origin === self.location.origin &&
  res && res.status === 200 && res.type === 'basic';

const esEstaticoPublico = url =>
  url.pathname.startsWith('/assets/') ||
  ['/icono-192.png','/icono-512.png','/icono-maskable-512.png',
   '/manifest.webmanifest','/og.png','/rwadar.csv'].includes(url.pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase y compañía, de largo

  /* La página: red primero, copia guardada solo si no hay red. */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const clave = url.pathname === '/index.html' ? '/' : url.pathname;
      try {
        const res = await fetch(req);
        /* Una escritura de caché puede fallar por cuota o modo privado.
           La respuesta de red ya es válida y debe llegar igualmente. */
        if (guardable(req, res)) {
          try { await cache.put(clave, res.clone()); } catch (_) {}
        }
        return res;
      } catch (_) {
        return (await cache.match(clave)) || (await cache.match('/')) || Response.error();
      }
    })());
    return;
  }

  /* Ninguna respuesta arbitraria se convierte en persistente. Solo entran
     los recursos públicos de la aplicación; las API ya quedaron fuera por
     origen y aquí se excluye también cualquier futura ruta dinámica. */
  if (!esEstaticoPublico(url)) return;

  /* Lo estático versionado: caché primero. Los nombres de los assets y
     VERSION cambian con cada entrega, así que no hay que lanzar una tarea
     en segundo plano que el navegador podría cortar antes de escribir. */
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const guardada = await cache.match(req);
    if (guardada) return guardada;
    try {
      const res = await fetch(req);
      if (guardable(req, res)) {
        try { await cache.put(req, res.clone()); } catch (_) {}
      }
      return res;
    } catch (_) { return Response.error(); }
  })());
});
