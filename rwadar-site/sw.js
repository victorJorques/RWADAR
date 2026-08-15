/* =====================================================================
   RWAdar · el trabajador de segundo plano
   ---------------------------------------------------------------------
   Existe para una sola cosa: que rwadar.netlify.app se pueda INSTALAR y
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

const VERSION = 'rwadar-v1';

/* El armazón mínimo para que la aplicación abra sin red. Los datos no
   están aquí: la página los pide a Supabase al cargar y se repinta sola,
   y el HTML ya trae las fichas pre-renderizadas para poder leerse. */
const ARMAZON = [
  '/',
  '/icono-192.png',
  '/icono-512.png',
  '/icono-maskable-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', e => {
  /* addAll falla entero si un solo archivo falla, y un fallo aquí dejaría
     la instalación a medias sin decir nada. Se piden de uno en uno y se
     perdona al que no esté: el armazón es una comodidad, no un requisito. */
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(ARMAZON.map(u => c.add(u).catch(() => {})));
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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase y compañía, de largo

  /* La página: red primero, copia guardada solo si no hay red. */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (guardable(req, res)) (await caches.open(VERSION)).put('/', res.clone());
        return res;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  /* Lo estático: se sirve al momento lo guardado y se refresca por detrás,
     para que la segunda visita abra instantánea sin quedarse congelada. */
  e.respondWith((async () => {
    const guardada = await caches.match(req);
    const red = fetch(req).then(res => {
      if (guardable(req, res)) caches.open(VERSION).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => null);
    return guardada || (await red) || Response.error();
  })());
});
