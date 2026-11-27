'use strict';
/* ---------------------------------------------------------------------
   País de residencia en la app (27/11/2026), como la web
   (rwadar-site/assets/pais-usuario-20261127.js):
   - el que elija el usuario manda y se guarda en el móvil;
   - si no eligió, el de la conexión (Cloudflare, https://rwadar.pages.dev/cdn-cgi/trace,
     sin permiso de ubicación), solo orientativo;
   - sin nada, España.
   Sin React ni almacenamiento propios: `almacen` (AsyncStorage) y `pedir` (fetch) llegan inyectados.
   --------------------------------------------------------------------- */
const D = require('./disponibilidad-pais');

const CLAVE_PAIS = 'rwadar-pais-residencia';
const TRACE = 'https://rwadar.pages.dev/cdn-cgi/trace';
let estado = { codigo: D.PAIS_POR_DEFECTO, origen: 'defecto' };
let solo = false;
let carga = null;
const oyentes = new Set();

function avisar() { for (const f of [...oyentes]) { try { f(estado); } catch (e) { /* un oyente no rompe a los demás */ } } }
function obtenerPais() { return estado.codigo; }
function origenPais() { return estado.origen; }
function soloAccesibles() { return solo; }
function ponerSoloAccesibles(v) { solo = !!v; avisar(); }
function suscribirPais(f) { oyentes.add(f); return () => oyentes.delete(f); }

async function elegirPais(codigo, almacen) {
  const c = D.normalizarCodigo(codigo);
  if (!c) return false;
  estado = { codigo: c, origen: 'elegido' };
  avisar();
  try { if (almacen) await almacen.setItem(CLAVE_PAIS, c); } catch (e) { /* vale para esta sesión */ }
  return true;
}

/* Una sola vez al abrir: el guardado; si no hay, el de la conexión. Nunca falla. */
function cargarPais(almacen, pedir) {
  if (carga) return carga;
  carga = (async () => {
    try {
      const guardado = almacen ? D.normalizarCodigo(await almacen.getItem(CLAVE_PAIS)) : '';
      if (guardado) { estado = { codigo: guardado, origen: 'elegido' }; avisar(); return estado; }
    } catch (e) { /* almacenamiento no disponible */ }
    try {
      if (typeof pedir === 'function') {
        const r = await pedir(TRACE, { cache: 'no-store', credentials: 'omit' });
        const c = D.paisDesdeTrace(r && r.ok ? await r.text() : '');
        if (c && estado.origen !== 'elegido') { estado = { codigo: c, origen: 'detectado' }; avisar(); }
      }
    } catch (e) { /* sin red: España por defecto */ }
    return estado;
  })();
  return carga;
}

/* Solo para las pruebas. */
function reiniciarPais() { estado = { codigo: D.PAIS_POR_DEFECTO, origen: 'defecto' }; solo = false; carga = null; oyentes.clear(); }

module.exports = { CLAVE_PAIS, TRACE, obtenerPais, origenPais, soloAccesibles, ponerSoloAccesibles, suscribirPais, elegirPais, cargarPais, reiniciarPais };
