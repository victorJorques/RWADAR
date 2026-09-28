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

export function modoLocalActivo() {
  return MODO_LOCAL === true;
}

export function exigirModoLocal() {
  if (!modoLocalActivo()) {
    throw new Error('Esta copia de RWAdar solo admite datos locales');
  }
  return true;
}
