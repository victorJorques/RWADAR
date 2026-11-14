'use strict';

/* ---------------------------------------------------------------------
   Notificaciones sin cuenta en la app de Android (14/11/2026)
   ---------------------------------------------------------------------
   Encargo de la dirección: «que salga tanto en iPhone como en Android; muy
   importante que funcionen las notificaciones y los avisos aunque no tengan
   cuenta o no hayan iniciado sesión: que puedan activarlas». Contrato:
   docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md.

   La app habla SOLO con el servidor de la web (https://rwadar.pages.dev
   /api/avisos/texto y /api/avisos/movil), sin cookies ni sesión, como
   lib/tokenizacion-remota.js; nunca con Supabase para esto. Lo que contesta
   se valida aquí con tipos estrictos.

   Este archivo no importa React Native, el SDK de notificaciones ni el
   almacenamiento: `push` y `almacen` llegan inyectados (los mismos que usa
   la cuenta, lib/avisos.js), y `fetchImpl` y `ahora` también, para probarlo
   sin red (tests/avisos-sin-cuenta.test.cjs).
   - push.capacidad: binario con código >= 24 (1.4.2); sin eso no se toca el SDK;
   - push.consultar(): el permiso del sistema, sin pedirlo;
   - push.obtenerToken({ solicitarPermiso }): permiso y token de Expo (solo
     pide el permiso tras una pulsación);
   - almacen.leer() / guardar(datos) / borrar(): lo de este móvil
     (rwadar.editorial.avisos.sin-cuenta.v1, lib/datos.js): el token, la
     versión y el idioma del texto aceptado, dónde se activó y el día de la
     última renovación. El token no sale de aquí salvo hacia /api/avisos/movil.
   --------------------------------------------------------------------- */
const { tokenPushValido } = require('./avisos-cuenta');

const URL_AVISOS = 'https://rwadar.pages.dev/api/avisos';
const PLAZO_MS = 15000;
const MAX_CARACTERES = 8 * 1024;
const VERSION = /^[a-z0-9][a-z0-9.-]{2,79}$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const IDIOMAS = Object.freeze(['es', 'en']);
const ORIGENES = Object.freeze(['novedades', 'perfil', 'avisos']);
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
// Lo que el servidor dice que no se ha podido hacer, en el estado que la pantalla entiende.
const RECHAZOS = Object.freeze({ apagado: 'apagado', no_disponible: 'apagado', version: 'version', lleno: 'lleno',
  cupo: 'cupo', intentos_excedidos: 'cupo' });
const NO_DISPONIBLE = Object.freeze(['no-compatible', 'emulador', 'expo-go', 'configuracion-pendiente', 'desactivados', 'requiere-version']);

function fallo(code, extra = {}) {
  return Object.assign(new Error(code), { code }, extra);
}
function esObjeto(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const prototipo = Object.getPrototypeOf(valor);
  return prototipo === Object.prototype || prototipo === null;
}
function textoPermisoValido(t) {
  return typeof t === 'string' && t.length >= 20 && t.length <= 1000 && !CONTROL.test(t) && !/[<>]/.test(t);
}

/* GET /api/avisos/texto. activo solo si se puede activar ahora (la base, el
   push, la clave y el servidor). Sin la migración 36: todo null y apagado. */
function validarTexto(j) {
  if (!esObjeto(j) || j.v !== 1 || typeof j.activo !== 'boolean') throw fallo('sin_cuenta_respuesta_invalida');
  if (j.version === null && j.texto === null) return { activo: false, version: null, texto: null };
  if (typeof j.version !== 'string' || !VERSION.test(j.version) || !esObjeto(j.texto)
    || !textoPermisoValido(j.texto.es) || !textoPermisoValido(j.texto.en)) throw fallo('sin_cuenta_respuesta_invalida');
  return { activo: j.activo, version: j.version, texto: { es: j.texto.es, en: j.texto.en } };
}

/* Lo guardado en este móvil, limpio; o null. */
function validarGuardado(d) {
  if (!esObjeto(d) || d.v !== 1 || !tokenPushValido(d.token) || typeof d.version !== 'string' || !VERSION.test(d.version)
    || !IDIOMAS.includes(d.idioma) || !ORIGENES.includes(d.origen) || !(d.renovado === null || (typeof d.renovado === 'string' && DIA.test(d.renovado)))) return null;
  return { v: 1, token: d.token, version: d.version, idioma: d.idioma, origen: d.origen, renovado: d.renovado };
}

function crearAvisosSinCuenta({ push, almacen, fetchImpl = (...a) => fetch(...a), plazoMs = PLAZO_MS, ahora = () => new Date(),
  plataforma = 'android' } = {}) {
  if (!push || !almacen) throw fallo('sin_cuenta_parametros');
  const capacidad = push.capacidad === true;
  const hoy = () => ahora().toISOString().slice(0, 10);
  // Activar, desactivar y renovar van de una en una (como en la cuenta).
  let cola = Promise.resolve();
  function enCola(tarea) {
    const resultado = cola.then(tarea, tarea);
    cola = resultado.catch(() => {});
    return resultado;
  }

  async function pedir(ruta, cuerpo) {
    const abort = typeof AbortController === 'function' ? new AbortController() : null;
    const reloj = setTimeout(() => abort?.abort(), plazoMs);
    try {
      const r = await fetchImpl(URL_AVISOS + ruta, cuerpo
        ? { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(cuerpo), ...(abort ? { signal: abort.signal } : {}) }
        : { method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' }, ...(abort ? { signal: abort.signal } : {}) });
      if (!r || typeof r.status !== 'number') throw fallo('red');
      let j = null;
      try {
        const t = await r.text();
        if (typeof t === 'string' && t.length <= MAX_CARACTERES) j = JSON.parse(t);
      } catch { j = null; }
      return { status: r.status, j: esObjeto(j) ? j : null };
    } catch (error) {
      throw error?.code ? error : fallo('red');
    } finally { clearTimeout(reloj); }
  }
  const leer = async () => {
    try { return validarGuardado(await almacen.leer()); } catch { return null; }
  };
  const movil = (cuerpo) => pedir('/movil', cuerpo);

  /* El texto versionado del permiso (GET /api/avisos/texto). Lanza sin red o con una respuesta rara. */
  async function texto() {
    const { status, j } = await pedir('/texto');
    if (status !== 200) throw fallo('servicio', { status });
    return validarTexto(j);
  }

  /* Qué enseña la pantalla, sin pedir nada al sistema ni a la red. */
  async function estado(textoServidor) {
    if (!capacidad) return { estado: 'requiere-version', activo: false };
    const guardado = await leer();
    const sistema = (await push.consultar())?.estado;
    if (NO_DISPONIBLE.includes(sistema) || plataforma !== 'android') {
      return { estado: 'no-disponible', motivo: sistema, activo: !!guardado };
    }
    if (guardado && sistema === 'permitido') {
      // La base solo envía con el texto vigente: con otro texto en el servidor,
      // dejan de llegar hasta aceptarlo (activar() con el mismo token lo renueva).
      if (textoServidor?.activo === true && typeof textoServidor.version === 'string' && textoServidor.version !== guardado.version) {
        return { estado: 'texto-nuevo', activo: true };
      }
      return { estado: 'activo', activo: true };
    }
    // Activadas, pero el permiso del sistema se quitó: se pueden quitar del todo.
    if (guardado) return { estado: 'sin-permiso', activo: true };
    if (sistema === 'denegado') return { estado: 'denegado', activo: false };
    if (textoServidor === undefined) return { estado: 'comprobando', activo: false };
    if (!textoServidor) return { estado: 'error', activo: false };
    if (!textoServidor.activo) return { estado: 'apagado', activo: false };
    return { estado: 'disponible', activo: false };
  }

  /* Solo tras pulsar «Activar notificaciones en este móvil», con el texto que
     se ha enseñado (su versión y su idioma). */
  function activar(textoServidor, { idioma = 'es', origen = 'perfil' } = {}) {
    return enCola(async () => {
      if (!capacidad) return { ok: false, estado: 'requiere-version' };
      if (plataforma !== 'android') return { ok: false, estado: 'no-disponible' };
      if (!textoServidor?.activo || !VERSION.test(textoServidor.version || '')) return { ok: false, estado: 'apagado' };
      const lengua = IDIOMAS.includes(idioma) ? idioma : 'es', donde = ORIGENES.includes(origen) ? origen : 'perfil';
      const r = await push.obtenerToken({ solicitarPermiso: true });
      if (!r?.ok || !tokenPushValido(r.token)) return { ok: false, estado: r?.estado || 'error' };
      const anterior = await leer();
      let respuesta;
      try {
        respuesta = await movil({ accion: 'alta', token: r.token, plataforma: 'android', version: textoServidor.version, idioma: lengua, origen: donde });
      } catch { return { ok: false, estado: 'sin-red' }; }
      const { status, j } = respuesta;
      if (!(status === 200 && j?.ok === true && j.estado === 'activa')) {
        const motivo = j && RECHAZOS[j.error];
        return { ok: false, estado: motivo || (status >= 500 || status === 0 ? 'sin-red' : 'error') };
      }
      await almacen.guardar({ v: 1, token: r.token, version: textoServidor.version, idioma: lengua, origen: donde, renovado: hoy() });
      // Si el sistema cambió el token, el anterior deja de servir.
      if (anterior && anterior.token !== r.token) { try { await movil({ accion: 'baja', token: anterior.token }); } catch { /* Lo limpia la base. */ } }
      return { ok: true, estado: 'activo' };
    });
  }

  /* Baja en el servidor y fuera lo guardado. Sin conexión, lo guardado se
     conserva para reintentarlo (la base borra a los 180 días sin renovar). */
  function desactivar() {
    return enCola(async () => {
      const guardado = await leer();
      if (!guardado) { try { await almacen.borrar(); } catch { /* nada */ } return { ok: true, confirmada: true }; }
      let confirmada = false;
      try {
        const { status, j } = await movil({ accion: 'baja', token: guardado.token });
        confirmada = status === 200 && j?.ok === true;
      } catch { confirmada = false; }
      if (!confirmada) return { ok: false, confirmada: false };
      await almacen.borrar();
      return { ok: true, confirmada: true };
    });
  }

  /* Una vez al día al abrir la app: si el permiso del sistema se quitó, baja;
     si no, estado y, si sigue activa con el texto vigente, alta otra vez (la
     base borra a los 180 días sin renovar). Nunca pide permiso. */
  function renovar() {
    return enCola(async () => {
      if (!capacidad) return { renovado: false, motivo: 'requiere-version' };
      const guardado = await leer();
      if (!guardado) return { renovado: false, motivo: 'sin-token' };
      const dia = hoy();
      if (guardado.renovado === dia) return { renovado: false, motivo: 'hecho-hoy' };
      const sistema = (await push.consultar())?.estado;
      if (sistema === 'denegado' || sistema === 'disponible') {
        // El permiso ya no está: se da de baja (y se olvida aquí si el servidor lo confirma).
        try {
          const { status, j } = await movil({ accion: 'baja', token: guardado.token });
          if (status === 200 && j?.ok === true) { await almacen.borrar(); return { renovado: false, motivo: 'sin-permiso' }; }
        } catch { /* Otro día. */ }
        return { renovado: false, motivo: 'sin-permiso' };
      }
      if (sistema !== 'permitido') return { renovado: false, motivo: sistema || 'error' };
      // Se apunta antes de llamar: un intento al día como mucho, salga como salga.
      await almacen.guardar({ ...guardado, renovado: dia });
      let e;
      try { e = await movil({ accion: 'estado', token: guardado.token }); } catch { return { renovado: false, motivo: 'sin-red' }; }
      if (!(e.status === 200 && e.j?.ok === true)) return { renovado: false, motivo: 'error' };
      if (e.j.activa !== true) { await almacen.borrar(); return { renovado: false, motivo: 'caducada' }; }
      if (e.j.vigente !== true) return { renovado: false, motivo: 'texto-nuevo' };
      const r = await push.obtenerToken({ solicitarPermiso: false });
      const token = r?.ok && tokenPushValido(r.token) ? r.token : guardado.token;
      let alta;
      try {
        alta = await movil({ accion: 'alta', token, plataforma: 'android', version: guardado.version, idioma: guardado.idioma, origen: guardado.origen });
      } catch { return { renovado: false, motivo: 'sin-red' }; }
      if (!(alta.status === 200 && alta.j?.ok === true)) return { renovado: false, motivo: 'error' };
      if (token !== guardado.token) {
        await almacen.guardar({ ...guardado, token, renovado: dia });
        try { await movil({ accion: 'baja', token: guardado.token }); } catch { /* Lo limpia la base. */ }
      }
      return { renovado: true };
    });
  }

  async function activo() {
    return !!(await leer());
  }

  return { capacidad, texto, estado, activar, desactivar, renovar, activo };
}

/* Para «Borrar datos del dispositivo»: baja con el token guardado, sin la
   cola de arriba y con plazo. true si ya no queda nada que quitar. */
async function bajaSinCuenta(token, { fetchImpl = (...a) => fetch(...a), plazoMs = PLAZO_MS } = {}) {
  if (!tokenPushValido(token)) return true;
  const abort = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = setTimeout(() => abort?.abort(), plazoMs);
  try {
    const r = await fetchImpl(URL_AVISOS + '/movil', { method: 'POST', credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ accion: 'baja', token }),
      ...(abort ? { signal: abort.signal } : {}) });
    if (!r || r.status !== 200) return false;
    const j = JSON.parse(await r.text());
    return esObjeto(j) && j.ok === true;
  } catch {
    return false;
  } finally { clearTimeout(reloj); }
}

module.exports = { URL_AVISOS, validarTexto, validarGuardado, crearAvisosSinCuenta, bajaSinCuenta };
