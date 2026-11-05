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

function clavesPrivadasDispositivo(claves) {
  return claves.filter(key => /^rwadar:cartera:v1:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ||
    /^rwadar\.cache\.catalogo\.v2:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ||
    /^rwadar\.editorial\.(?:siguiendo|seguimiento\.pendiente|academy\.progreso\.v1|ofertas\.guardadas\.v1|avisos\.leidos\.v1|avisos\.push\.v1):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key));
}

module.exports = { cuentaAdmitida, clavesPrivadasDispositivo };
