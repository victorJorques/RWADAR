# Acceso web: activación sin recargas bloqueantes · 29/10/2026

La navegación automática de todas las ventanas dentro de `activate.waitUntil` bloqueaba la página en Chrome real, incluso sin cuenta. La misma preview responde y muestra las 49 tarjetas al bloquear únicamente el service worker; desactivar WebGL no resuelve el bloqueo. Esto separa la causa de la animación 3D y del acceso.

Se elimina esa navegación del trabajador. Se conservan `skipWaiting`, la limpieza exclusiva de cachés `rwadar-v*`, `clients.claim` y la ausencia de caché de respuestas privadas. La página mantiene su gestión de cambio de controlador. Dos pruebas dirigidas pasan, incluida la activación con una navegación que nunca termina; revisión independiente aprobada.

Los arreglos del BFF y SQL29 ya documentados se conservan. `npm test` se intentó por el alcance transversal y se detuvo antes de la web en una prueba de borrado de cuenta que no acredita sesión confirmada vigente; no se declara aprobada la suite completa. Comprobación web dirigida, preview real y producción pendientes al escribir esta entrada. APK23 conservado; investigación pausada.
