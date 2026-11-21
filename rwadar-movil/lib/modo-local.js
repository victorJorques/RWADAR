/* ---------------------------------------------------------------------
   Interruptores de la app
   ---------------------------------------------------------------------
   Son decisiones de código explícitas, no variables de entorno que puedan
   faltar o interpretarse de forma distinta entre Metro, Expo Go y un test.
   La app consulta siempre el catálogo editorial conectado: el antiguo modo
   local, con el escaparate de agosto incluido, se quitó el 21/11/2026.
   --------------------------------------------------------------------- */

export const MODO_DATOS = 'catalogo-editorial';

/* Consultar el catálogo conectado no autoriza a registrar instalaciones,
   sincronizar favoritos o preparar push. Requieren un corte y E2E propios.
   Esta compuerta de cliente no sustituye permisos ni RLS en el servidor. */
export const SERVICIOS_USUARIO_REMOTOS = false;

/* Candidato Android 1.3.0 autorizado el 11/10: alta confirmada y entrega de
   recuperación comprobadas en la web. El APK necesita su propia revisión.
   Estas cuentas no habilitan instalación, push, opiniones, avisos ni cobros. */
export const CUENTAS_REMOTAS = true;
export const CORREO_AUTH_E2E = true;

/* Avisos de novedades a cuentas registradas (contrato del 05/11/2026,
   docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md). Apagado: la app no
   enseña la casilla del alta, ni la tarjeta de Inicio, ni Perfil › Avisos, ni
   llama a ninguna función de avisos; sus textos de hoy siguen siendo ciertos.
   Encendido el 12/11/2026 por orden de Víctor («que las notificaciones
   salten al móvil tipo WhatsApp»): Perfil › Avisos (permiso con el texto
   versionado y «Notificaciones en este móvil») y la tarjeta de Inicio. La
   casilla del alta va aparte (AVISOS_CASILLA_ALTA_REMOTA), porque depende del
   correo, que aún no sale. No toca SERVICIOS_USUARIO_REMOTOS ni
   pushDeliveryEnabled. */
export const AVISOS_NOVEDADES_REMOTOS = true;

/* Casilla de avisos en el alta (12/11/2026). Separada de la anterior: la
   casilla cuenta con el correo de confirmación de Auth y con activar-casilla
   en la base, y el correo aún no sale (sin dominio ni Lettermint). Apagada,
   el alta no la enseña ni manda avisos_novedades en los metadatos; el permiso
   se da en Perfil › Avisos. Se enciende con la ronda del correo. */
export const AVISOS_CASILLA_ALTA_REMOTA = false;

/* Bandeja de avisos sin correo ni push (07/11/2026). Interruptor aparte del
   anterior: encendido, Inicio enseña SOLO la tarjeta «Avisos» con los avisos
   recibidos, que la base ya da a cualquier cuenta confirmada (la bienvenida y
   los anuncios publicados, rpc mis_avisos_recientes de db/30). No enseña la
   casilla del alta ni Perfil › Avisos, no pide ni guarda ningún permiso, no
   envía correo ni toca el push. Qué avisos has leído se guarda solo en el
   móvil. Es solo JS: llega por OTA a la 1.4.2. Con AVISOS_NOVEDADES_REMOTOS
   encendido no hace nada (esos avisos ya traen la tarjeta). Se enciende a la
   vez que el de la web (assets/rwadar-20260820.js), con orden de Víctor.
   Encendido el 12/11/2026. */
export const AVISOS_BANDEJA_REMOTA = true;

/* Notificaciones sin cuenta (14/11/2026, docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md).
   Encendido en el código por decisión de la dirección: la pantalla de acceso
   (la única sin sesión) enseña «Notificaciones en este móvil» sin cuenta,
   que hablan solo con https://rwadar.pages.dev/api/avisos/*. La base nace
   apagada y se enciende aparte (activar-sin-cuenta): mientras tanto el
   bloque dice que todavía no está disponible y no pide nada. Es solo JS:
   llega por OTA a la 1.4.2 (con la 1.4.1 dice que llega con la 1.4.2). */
export const AVISOS_SIN_CUENTA_REMOTOS = true;

