'use strict';
/* Inglés de la campana de avisos y de «Notificaciones en este móvil» de la
   web (12/11/2026). Va aparte del diccionario común (idioma-en-20261022.js,
   copia exacta del de la app) porque estos textos solo existen en la web.
   Se carga justo después de él y antes del motor (idioma-20261022.js), que
   lee window.RWAdarEnglish al cargarse: aquí se le suman estas entradas sin
   cambiar ninguna de las que ya tenía. Las etiquetas con número (la de la
   campana, la del globo de Perfil) las escribe rwadar-20260820.js en el
   idioma de la página. */
(function(raiz){const extra={
  // Campana de la cabecera y su diálogo.
  "Avisos, ninguno sin leer": "Notices, none unread",
  "Tus avisos": "Your notices",
  "Ver tus avisos": "See your notices",
  "Notificaciones y avisos en Perfil": "Notifications and notices in Profile",
  "Avisos marcados como leídos.": "Notices marked as read.",
  "Entra en tu cuenta para ver tus avisos. ¿No quieres estos avisos? Desactívalos en Perfil o en los ajustes del móvil.": "Sign in to see your notices. Don't want these notices? Turn them off in Profile or in your phone settings.",
  "El envío por correo y al móvil todavía no está activo. Mientras tanto, los avisos se ven en la campana.": "Sending by email and to phones is not active yet. Meanwhile, notices are shown under the bell.",
  // Información básica de Perfil › Avisos (12/11/2026): en la web, «aviso legal» y
  // «Privacidad» son enlaces, así que el texto llega en tres trozos (el común
  // del diccionario de la app es el texto entero, sin enlaces).
  "Información básica sobre tus datos. Responsable: el titular de RWAdar, identificado en el": "Basic information about your data. Controller: the owner of RWAdar, identified in the",
  "aviso legal": "legal notice",
  ". Datos: tu correo, tu contraseña y, si lo das, tu nombre; con los avisos, además, tu permiso y, si activas las notificaciones, un identificador de entrega de tu móvil. Para qué: tu cuenta, con la que también abres la Academy, y, solo si marcas la casilla de avisos, enviarte esos avisos. Base: el servicio que pides (cuenta) y tu consentimiento (avisos), que puedes retirar cuando quieras sin que afecte a lo anterior. Proveedores: Supabase, Cloudflare y Google; para los avisos, Lettermint y Expo. Algunos tratan datos fuera de la UE con garantías. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en Perfil o en rwadares@gmail.com; también puedes reclamar ante la AEPD. Más información en": ". Data: your email, your password and, if you give it, your name; with notices, also your consent and, if you turn on notifications, a delivery identifier for your phone. Purpose: your account, which also opens the Academy, and, only if you tick the notices box, sending you those notices. Legal basis: the service you request (account) and your consent (notices), which you can withdraw at any time without affecting what came before. Providers: Supabase, Cloudflare and Google; for notices, Lettermint and Expo. Some process data outside the EU with safeguards. Rights: access, rectification, erasure, objection, restriction and portability, in Profile or at rwadares@gmail.com; you can also complain to the AEPD (Spanish Data Protection Agency). More information in",
  // Notificaciones en este móvil (Web Push).
  "Activar notificaciones en este móvil": "Turn on notifications on this phone",
  "Desactivar las notificaciones de este móvil": "Turn off notifications on this phone",
  "Ver cómo añadirla": "See how to add it",
  "Pulsa el botón Compartir (un cuadrado con una flecha hacia arriba).": "Tap the Share button (a square with an arrow pointing up).",
  "Elige «Añadir a pantalla de inicio» y pulsa Añadir.": "Choose «Add to Home Screen» and tap Add.",
  "Abre RWAdar desde el icono nuevo, entra en tu cuenta y vuelve a Perfil › Avisos.": "Open RWAdar from the new icon, sign in and come back to Profile › Notices.",
  "Un momento…": "One moment…",
  "Las notificaciones se activan desde el móvil o la tableta: abre RWAdar allí, entra en tu cuenta y ve a Perfil › Avisos.": "Notifications are turned on from your phone or tablet: open RWAdar there, sign in and go to Profile › Notices.",
  "En iPhone y iPad las notificaciones solo funcionan con RWAdar en la pantalla de inicio (iOS o iPadOS 16.4 o posterior):": "On iPhone and iPad, notifications only work with RWAdar on the home screen (iOS or iPadOS 16.4 or later):",
  "Este navegador no puede recibir notificaciones de RWAdar. En iPhone hace falta iOS 16.4 o posterior; en Android, Chrome, Firefox, Edge o Samsung Internet.": "This browser cannot receive RWAdar notifications. On iPhone you need iOS 16.4 or later; on Android, Chrome, Firefox, Edge or Samsung Internet.",
  "Has bloqueado las notificaciones de RWAdar en este navegador. Para permitirlas: en iPhone, Ajustes › Notificaciones › RWAdar; en Android, mantén pulsado el icono de RWAdar › Información de la aplicación › Notificaciones. Después vuelve aquí.": "You have blocked RWAdar notifications in this browser. To allow them: on iPhone, Settings › Notifications › RWAdar; on Android, press and hold the RWAdar icon › App info › Notifications. Then come back here.",
  "Has bloqueado las notificaciones de RWAdar en este navegador. Para permitirlas, toca el icono que hay a la izquierda de la dirección › Permisos › Notificaciones (en Chrome también: Ajustes › Configuración de sitios › Notificaciones). Después vuelve aquí.": "You have blocked RWAdar notifications in this browser. To allow them, tap the icon to the left of the address › Permissions › Notifications (in Chrome also: Settings › Site settings › Notifications). Then come back here.",
  "Comprobando las notificaciones de este móvil…": "Checking notifications on this phone…",
  "Las notificaciones en este móvil todavía no están disponibles; te lo diremos aquí cuando empecemos a enviarlas. Mientras tanto, verás los avisos en la campana.": "Notifications on this phone are not available yet; we will tell you here when we start sending them. Meanwhile, you will see notices under the bell.",
  "Para recibirlas, activa antes «Avisos de novedades».": "To receive them, first turn on «News notices».",
  // Junto al botón (anexo legal, 2.4): va antes del enlace a Privacidad.
  "El servicio de tu navegador puede estar fuera de la UE: ve la hora de cada aviso, pero no puede leer su texto. Si no las activas, seguirás viendo los avisos en la campana. Más en": "Your browser's service may be outside the EU: it sees when each notice is sent, but cannot read its text. If you don't turn them on, you will still see your notices under the bell. More in",
  "Al activarlas, el navegador te pedirá permiso. Guardamos en tu cuenta la dirección de entrega de este navegador y sus claves; las notificaciones viajan cifradas por el servicio de Apple, Google, Mozilla o Microsoft, según el navegador. Se borra al desactivarlas, al cerrar sesión o al borrar la cuenta.": "When you turn them on, the browser will ask for permission. We store in your account this browser's delivery address and its keys; notifications travel encrypted through Apple's, Google's, Mozilla's or Microsoft's service, depending on the browser. It is deleted when you turn them off, sign out or delete your account.",
  "Todavía no hemos empezado a enviarlas: puedes activarlas ya y te llegarán cuando empecemos. Al activarlas, el navegador te pedirá permiso. Guardamos en tu cuenta la dirección de entrega de este navegador y sus claves; las notificaciones viajan cifradas por el servicio de Apple, Google, Mozilla o Microsoft, según el navegador. Se borra al desactivarlas, al cerrar sesión o al borrar la cuenta.": "We have not started sending them yet: you can turn them on now and they will reach you once we start. When you turn them on, the browser will ask for permission. We store in your account this browser's delivery address and its keys; notifications travel encrypted through Apple's, Google's, Mozilla's or Microsoft's service, depending on the browser. It is deleted when you turn them off, sign out or delete your account.",
  "Activadas: este móvil recibe las notificaciones de RWAdar.": "On: this phone receives RWAdar notifications.",
  "Activadas en este móvil. Ahora mismo no estamos enviando notificaciones: te llegarán en cuanto empecemos. Puedes desactivarlas aquí.": "On for this phone. We are not sending notifications right now: they will reach you as soon as we start. You can turn them off here.",
  "Notificaciones activadas en este móvil. Te llegarán cuando empecemos a enviarlas.": "Notifications turned on for this phone. They will reach you once we start sending them.",
  "Con «Avisos de novedades» desactivado, este móvil no recibe notificaciones de RWAdar. Actívalo para volver a recibirlas, o desactívalas aquí.": "With «News notices» turned off, this phone does not receive RWAdar notifications. Turn it on to receive them again, or turn them off here.",
  "No has dado permiso. Puedes volver a intentarlo cuando quieras.": "You did not give permission. You can try again whenever you like.",
  "No se han podido activar las notificaciones en este móvil. Vuelve a intentarlo.": "Notifications could not be turned on for this phone. Please try again.",
  "Hemos quitado las notificaciones de este navegador, pero no hemos podido confirmarlo con tu cuenta. Se borrará sola en el próximo envío.": "We have removed notifications from this browser, but could not confirm it with your account. It will be deleted automatically on the next send.",
  "No se han podido desactivar las notificaciones. Vuelve a intentarlo.": "Notifications could not be turned off. Please try again."
};
if(typeof module==='object'&&module.exports){module.exports=Object.freeze(extra);return;}
const base=raiz.RWAdarEnglish||{};
const suma=Object.assign({},extra,base);
raiz.RWAdarEnglish=Object.freeze(suma);
})(typeof globalThis==='object'?globalThis:this);
