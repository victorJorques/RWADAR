'use strict';

// Presentation eligibility only. The server must also deny anonymous catalog
// reads and validate the confirmed current session for every protected query.
function cuentaAdmitida(estado) {
  return estado?.disponible === true && estado.estado === 'autenticada' &&
    typeof estado.usuario?.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(estado.usuario.id) &&
    typeof estado.usuario.correo === 'string' && !!estado.usuario.correo &&
    estado.perfil?.id === estado.usuario.id;
}

/* Lo que «Borrar datos del dispositivo» elimina sin más. El token de avisos
   de este móvil (rwadar.editorial.avisos.push.v1:<UUID>) no está aquí a
   propósito: lib/datos.js lo borra solo después de quitarlo de la base. Lo
   mismo con el de las notificaciones sin cuenta
   (rwadar.editorial.avisos.sin-cuenta.v1, sin UUID): primero la baja en el
   servidor y después la clave (claveSinCuentaQuitada de lib/datos.js).
   Desde el 21/11/2026 también los leídos de los avisos públicos de la
   campana y hasta cuándo se vieron los cambios de lo que sigues. */
function clavesPrivadasDispositivo(claves) {
  return claves.filter(key => /^rwadar:cartera:v1:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ||
    /^rwadar\.cache\.catalogo\.v2:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ||
    /^rwadar\.editorial\.(?:siguiendo|seguimiento\.pendiente|academy\.progreso\.v1|ofertas\.guardadas\.v1|avisos\.leidos\.v1|avisos\.renovado\.v1|avisos\.publicos\.leidos\.v1|cambios\.vistos\.v1):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key));
}

module.exports = { cuentaAdmitida, clavesPrivadasDispositivo };
