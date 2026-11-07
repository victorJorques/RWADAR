/* ---------------------------------------------------------------------
   Corte editorial conectado
   ---------------------------------------------------------------------
   Solo el valor literal catalogo-editorial permite consultar el catálogo.
   La bandera es una decisión de código explícita, no una variable de entorno que pueda
   faltar o interpretarse de forma distinta entre Metro, Expo Go y un test.

   El corte de publicación se valida antes de compilar la entrega. Un valor
   desconocido falla hacia «local»; nunca habilita servicios de usuario.
   --------------------------------------------------------------------- */

export const MODO_DATOS = 'catalogo-editorial';
export const MODO_LOCAL = MODO_DATOS !== 'catalogo-editorial';

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
   Solo lo enciende Víctor, con la base 30 aplicada y la plantilla de Auth
   puesta. No toca SERVICIOS_USUARIO_REMOTOS ni pushDeliveryEnabled. */
export const AVISOS_NOVEDADES_REMOTOS = false;

/* Bandeja de avisos sin correo ni push (07/11/2026). Interruptor aparte del
   anterior: encendido, Inicio enseña SOLO la tarjeta «Avisos» con los avisos
   recibidos, que la base ya da a cualquier cuenta confirmada (la bienvenida y
   los anuncios publicados, rpc mis_avisos_recientes de db/30). No enseña la
   casilla del alta ni Perfil › Avisos, no pide ni guarda ningún permiso, no
   envía correo ni toca el push. Qué avisos has leído se guarda solo en el
   móvil. Es solo JS: llega por OTA a la 1.4.2. Con AVISOS_NOVEDADES_REMOTOS
   encendido no hace nada (esos avisos ya traen la tarjeta). Se enciende a la
   vez que el de la web (assets/rwadar-20260820.js), con orden de Víctor. */
export const AVISOS_BANDEJA_REMOTA = false;

export function modoLocalActivo() {
  return MODO_LOCAL === true;
}

export function exigirModoLocal() {
  if (!modoLocalActivo()) {
    throw new Error('Esta copia de RWAdar solo admite datos locales');
  }
  return true;
}
