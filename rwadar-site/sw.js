/* La consulta es pública; la cuenta protege los datos privados. Sustituye
   el antiguo modo sin red: borra solo sus copias y no almacena páginas ni
   datos de cuenta. La página gestiona la recarga al cambiar el controlador;
   la activación no navega clientes ni espera una navegación.
   Desde el 12/11/2026 recibe también las notificaciones (Web Push): el
   navegador descifra cada una; aquí se enseña SIEMPRE (Apple retira la
   suscripción si un push no muestra nada) y se sube el número del icono,
   que se guarda en IndexedDB y la página pone a 0 al ver los avisos. */
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

/* --- notificaciones ------------------------------------------------
   Carga (JSON, UTF-8): {"v":1,"titulo":"…","texto":"…","url":"https://rwadar.pages.dev/…","etiqueta":"rwadar-<id>"}.
   Lo que no cumple se sustituye por un texto propio; un enlace solo se
   abre si es de rwadar.pages.dev o de este mismo origen. */
/* Sin «badge»: Chrome en Android usa esa imagen como icono pequeño de la barra
   de estado y solo pinta su silueta; con un icono opaco sale un cuadrado
   blanco. Sin ella, el navegador pone la suya. */
const ICONO = '/icono-192.png';
const ORIGENES_PROPIOS = ['https://rwadar.pages.dev'];
const SIN_CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;
function textoSeguro(valor, maximo) {
  if (typeof valor !== 'string') return '';
  const limpio = valor.replace(SIN_CONTROL, ' ').trim();
  return limpio.length > maximo ? limpio.slice(0, maximo - 1) + '…' : limpio;
}
function urlSegura(valor) {
  const inicio = self.location.origin + '/';
  if (typeof valor !== 'string' || !valor || valor.length > 500) return inicio;
  try {
    const url = new URL(valor, self.location.origin);
    const propio = url.origin === self.location.origin || ORIGENES_PROPIOS.includes(url.origin);
    if (!propio || url.username || url.password || !/^https?:$/.test(url.protocol)) return inicio;
    return url.href;
  } catch { return inicio; }
}
function leerAviso(datos) {
  let carga = null;
  try { carga = datos ? datos.json() : null; } catch { carga = null; }
  const valida = carga && typeof carga === 'object' && !Array.isArray(carga) && carga.v === 1;
  const ingles = typeof self.navigator === 'object' && /^en\b/i.test(self.navigator.language || '');
  const titulo = (valida && textoSeguro(carga.titulo, 120)) || 'RWAdar';
  const texto = (valida && textoSeguro(carga.texto, 600)) ||
    (ingles ? 'You have a new notice on RWAdar.' : 'Tienes un aviso nuevo en RWAdar.');
  const etiqueta = valida && typeof carga.etiqueta === 'string' && /^rwadar-[A-Za-z0-9_-]{1,40}$/.test(carga.etiqueta)
    ? carga.etiqueta : 'rwadar-aviso';
  return { titulo, texto, etiqueta, url: urlSegura(valida ? carga.url : '') };
}

/* El contador del icono, en IndexedDB (sobrevive a que el navegador pare el
   service worker entre notificaciones). cambio(actual) devuelve el nuevo. */
const BASE = 'rwadar-avisos', ALMACEN = 'contador', CLAVE = 'sin-leer';
function abrirBase() {
  return new Promise((ok, mal) => {
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => { peticion.result.createObjectStore(ALMACEN); };
    peticion.onsuccess = () => ok(peticion.result);
    peticion.onerror = () => mal(peticion.error);
  });
}
async function cambiarContador(cambio) {
  const base = await abrirBase();
  try {
    return await new Promise((ok, mal) => {
      const tx = base.transaction(ALMACEN, 'readwrite'), almacen = tx.objectStore(ALMACEN);
      let nuevo = 0;
      const leer = almacen.get(CLAVE);
      leer.onsuccess = () => {
        const actual = Number.isInteger(leer.result) && leer.result > 0 ? leer.result : 0;
        nuevo = Math.max(0, Math.min(99, Math.trunc(cambio(actual)) || 0));
        almacen.put(nuevo, CLAVE);
      };
      tx.oncomplete = () => ok(nuevo);
      tx.onerror = tx.onabort = () => mal(tx.error);
    });
  } finally { base.close(); }
}
async function ponerInsignia(n) {
  try {
    const nav = self.navigator;
    if (n > 0 && nav && typeof nav.setAppBadge === 'function') await nav.setAppBadge(n);
    else if (n <= 0 && nav && typeof nav.clearAppBadge === 'function') await nav.clearAppBadge();
  } catch { /* Sin Badging API (Android, Firefox): no pasa nada. */ }
}

self.addEventListener('push', event => {
  const aviso = leerAviso(event.data);
  event.waitUntil((async () => {
    // Primero la notificación: siempre, pase lo que pase con el contador.
    await self.registration.showNotification(aviso.titulo, {
      body: aviso.texto, icon: ICONO, tag: aviso.etiqueta, data: { url: aviso.url },
    });
    let n = 0;
    try { n = await cambiarContador(actual => actual + 1); } catch { n = 0; }
    if (n > 0) await ponerInsignia(n);
    // Con la web abierta, la campana se actualiza sin recargar.
    try {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const ventana of ventanas) ventana.postMessage({ tipo: 'aviso-nuevo' });
    } catch { /* sin ventanas */ }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destino = urlSegura(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mismoOrigen = new URL(destino).origin === self.location.origin;
    const propia = ventanas.find(v => { try { return new URL(v.url).origin === self.location.origin; } catch { return false; } });
    if (propia && mismoOrigen) {
      let ventana = null;
      try { ventana = (await propia.focus()) || propia; } catch { ventana = null; }
      if (ventana) {
        // La portada ya abierta: que abra ella la lista de avisos (con la baja),
        // sin recargar. Así también en una pestaña que no se puede navegar.
        const pedida = new URL(destino);
        let enPortada = false;
        try { enPortada = new URL(ventana.url).pathname === '/'; } catch { enPortada = false; }
        if (enPortada && pedida.pathname === '/' && pedida.searchParams.get('avisos') === '1') {
          try { ventana.postMessage({ tipo: 'abrir-avisos' }); return; } catch { /* se navega */ }
        }
        // Una pestaña sin controlar no se puede llevar a otra página: se queda enfocada.
        if (ventana.url !== destino && typeof ventana.navigate === 'function') {
          try { await ventana.navigate(destino); } catch { /* se queda donde estaba */ }
        }
        return;
      }
    }
    await self.clients.openWindow(destino);
  })());
});

/* La página, al ver los avisos (abrir la campana): «avisos-vistos» pone el contador a 0, quita
   el número del icono y las notificaciones de RWAdar que sigan a la vista;
   «avisos-pendientes» lo pone al número de avisos sin leer que ve la página
   (el número del icono ya lo pone la propia página: aquí no se repite, y así
   el service worker solo toca la insignia al llegar un push o al verse todo). */
self.addEventListener('message', event => {
  const m = event.data;
  if (!m || typeof m !== 'object') return;
  const n = m.tipo === 'avisos-vistos' ? 0
    : m.tipo === 'avisos-pendientes' && Number.isInteger(m.n) && m.n >= 0 ? Math.min(99, m.n) : -1;
  if (n < 0) return;
  event.waitUntil((async () => {
    try { await cambiarContador(() => n); } catch { /* sin IndexedDB */ }
    if (n === 0) {
      await ponerInsignia(0);
      try {
        const abiertas = await self.registration.getNotifications();
        for (const notificacion of abiertas) if (/^rwadar-/.test(notificacion.tag || '')) notificacion.close();
      } catch { /* nada que cerrar */ }
    }
  })());
});
