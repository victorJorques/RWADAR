'use strict';

/* Motor de cuentas, separado del catálogo y del seguimiento por instalación.
   La sesión vive solo en la instancia del SDK: no usa AsyncStorage, Keychain,
   cookies ni URLs de entrada. Confirmación y recuperación abren la web oficial;
   una vez terminado ese paso, la persona vuelve a entrar en la app. */
const REDIRECT_CUENTAS = 'https://rwadar.pages.dev/';
const URL_CUENTAS = 'https://exgpmjpaaebyoolpwced.supabase.co';
// Clave publicable, igual que la del lector de catálogo. No es una credencial.
const CLAVE_PUBLICABLE = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';
const PLAZO_CUENTAS = 8000;
const MAX_RESPUESTA = 128 * 1024;
// El lote documentado completo supera el límite de una respuesta de cuentas.
// Solo estas dos lecturas de catálogo admiten un cuerpo y plazo mayores.
const MAX_RESPUESTA_CATALOGO = 2 * 1024 * 1024;
const PLAZO_CATALOGO = 15000;
const LECTURAS_CATALOGO = new Set([
  '/rest/v1/catalogo_plataformas_publicas_v2',
  '/rest/v1/catalogo_ofertas_publicas_v2',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let instanciaCliente = 0;

function fallo(codigo) {
  const error = new Error(codigo);
  error.code = codigo;
  return error;
}

function mensajeError(error) {
  const codigo = error?.code;
  if (codigo === 'cuentas_cerradas') return 'Las cuentas todavía no están abiertas en esta versión.';
  if (codigo === 'correo_invalido') return 'Escribe un correo válido.';
  if (codigo === 'clave_corta') return 'Usa una contraseña de al menos 12 caracteres.';
  if (codigo === 'clave_vacia') return 'Escribe tu contraseña.';
  if (codigo === 'nombre_invalido') return 'El nombre debe tener entre 1 y 60 caracteres.';
  if (codigo === 'condiciones') return 'Acepta las condiciones y la política de privacidad para crear la cuenta.';
  if (codigo === 'confirmar_borrado') return 'Escribe BORRAR y tu contraseña actual para borrar la cuenta.';
  if (codigo === 'sin_sesion' || codigo === 'identidad_invalida') return 'La sesión no se ha podido verificar. Vuelve a entrar.';
  if (codigo === 'email_not_confirmed' || codigo === 'correo_no_confirmado') return 'Confirma tu correo antes de entrar. Puedes pedir otro enlace.';
  if (codigo === 'invalid_credentials') return 'El correo o la contraseña no son correctos.';
  if (codigo === 'weak_password') return 'Usa una contraseña segura de al menos 12 caracteres.';
  if (codigo === 'captcha_failed') return 'No se ha podido comprobar el acceso. Inténtalo en la web oficial.';
  if (error?.status === 429 || /rate_limit/.test(codigo || '')) return 'Has hecho varios intentos. Espera un momento antes de repetir.';
  if (codigo === 'plazo' || error?.name === 'AbortError') return 'La conexión tarda demasiado. Comprueba tu red y vuelve a intentarlo.';
  if (codigo === 'plataforma_invalida') return 'No se ha podido identificar esa plataforma. Prueba a actualizar el radar.';
  // No mostrar mensajes arbitrarios del servidor, datos de la cuenta o tokens.
  return 'No se ha podido completar la operación. Inténtalo de nuevo más tarde.';
}

function correoValido(valor) {
  const correo = typeof valor === 'string' ? valor.trim() : '';
  if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw fallo('correo_invalido');
  return correo;
}

function nombreValido(valor, opcional = false) {
  const nombre = typeof valor === 'string' ? valor.trim() : '';
  if ((!nombre && !opcional) || nombre.length > 60 || /[\u0000-\u001f\u007f]/.test(nombre)) throw fallo('nombre_invalido');
  return nombre;
}

/* El plazo cubre también el cuerpo de la respuesta, no solo sus cabeceras.
   Los límites se aplican a todas las llamadas del SDK y el modelo añade una
   segunda cota para clientes simulados o un fetch que no respete AbortSignal. */
function crearTransporteCuentas({ fetchImpl = (...args) => fetch(...args), plazoMs = PLAZO_CUENTAS } = {}) {
  return async function transporte(url, opciones = {}) {
    const destino = new URL(typeof url === 'string' ? url : url.url);
    if (destino.origin !== URL_CUENTAS || !/^\/(auth|rest)\/v1\//.test(destino.pathname)) throw fallo('destino_invalido');
    const metodo = String(opciones.method || (typeof url === 'object' && url.method) || 'GET').toUpperCase();
    const catalogo = metodo === 'GET' && !destino.username && !destino.password && LECTURAS_CATALOGO.has(destino.pathname);
    const maxRespuesta = catalogo ? MAX_RESPUESTA_CATALOGO : MAX_RESPUESTA;
    const plazo = catalogo ? PLAZO_CATALOGO : plazoMs;
    const corte = new AbortController();
    const abortar = () => corte.abort();
    if (opciones.signal?.aborted) corte.abort();
    else opciones.signal?.addEventListener?.('abort', abortar);
    let reloj;
    try {
      return await Promise.race([
        (async () => {
          const respuesta = await fetchImpl(url, { ...opciones, signal: corte.signal,
            redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
          if (respuesta.url && new URL(respuesta.url).origin !== URL_CUENTAS) throw fallo('destino_invalido');
          const longitud = Number(respuesta.headers.get('content-length'));
          if (Number.isFinite(longitud) && longitud > maxRespuesta) throw fallo('respuesta_excesiva');
          let cuerpo;
          if (respuesta.body?.getReader && typeof TextDecoder === 'function') {
            const lector = respuesta.body.getReader(), partes = [];
            let recibidos = 0;
            try {
              while (true) {
                const { value, done } = await lector.read();
                if (done) break;
                recibidos += value.byteLength;
                if (recibidos > maxRespuesta) {
                  lector.cancel().catch(() => {});
                  throw fallo('respuesta_excesiva');
                }
                partes.push(value);
              }
            } finally { lector.releaseLock(); }
            const unidos = new Uint8Array(recibidos);
            let posicion = 0;
            for (const parte of partes) { unidos.set(parte, posicion); posicion += parte.byteLength; }
            cuerpo = new TextDecoder().decode(unidos);
          } else cuerpo = await respuesta.text();
          const bytes = typeof TextEncoder === 'function' ? new TextEncoder().encode(cuerpo).length : cuerpo.length * 3;
          if (bytes > maxRespuesta) throw fallo('respuesta_excesiva');
          return new Response([204, 205, 304].includes(respuesta.status) ? null : cuerpo,
            { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
        })(),
        new Promise((_, rechazar) => { reloj = setTimeout(() => { corte.abort(); rechazar(fallo('plazo')); }, plazo); }),
      ]);
    } finally {
      clearTimeout(reloj);
      opciones.signal?.removeEventListener?.('abort', abortar);
    }
  };
}

function crearClienteCuentas({ fetchImpl, plazoMs = PLAZO_CUENTAS, createClient: fabrica } = {}) {
  const crear = fabrica || require('@supabase/supabase-js').createClient;
  return crear(URL_CUENTAS, CLAVE_PUBLICABLE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'implicit',
      storageKey: `rwadar.cuenta.memoria.${++instanciaCliente}` },
    global: { fetch: crearTransporteCuentas({ fetchImpl, plazoMs }) },
  });
}

function crearControladorCuentas({ modoLocal = true, cuentasRemotas = false, correoVerificado = false,
  cliente: clientePrueba, crearCliente = crearClienteCuentas, plazoMs = PLAZO_CUENTAS } = {}) {
  const disponible = modoLocal === false && cuentasRemotas === true && correoVerificado === true;
  let revision = 0, destruido = false, clienteActual = null;
  const oyentes = new Set(), clientesTemporales = new Set();
  let vista = { disponible, estado: disponible ? 'sin-sesion' : 'pausa', usuario: null, perfil: null,
    vigiladas: [], procesando: false, accion: null, error: null, mensaje: null };
  function estado() {
    return { ...vista, usuario: vista.usuario && { ...vista.usuario }, perfil: vista.perfil && { ...vista.perfil },
      vigiladas: vista.vigiladas.map(fila => ({ ...fila })) };
  }
  function pintar(cambios) {
    vista = { ...vista, ...cambios };
    for (const oyente of oyentes) { try { oyente(estado()); } catch (_) { /* Un componente no rompe el motor. */ } }
  }
  function purgar() {
    const anterior = clienteActual;
    clienteActual = null;
    liberarCliente(anterior);
    pintar({ estado: disponible ? 'sin-sesion' : 'pausa', usuario: null, perfil: null, vigiladas: [] });
  }
  function liberarCliente(cliente) {
    if (!cliente) return;
    // Supabase 2.112.1 permite retirar listeners y trabajo en segundo plano.
    // No intenta revocar sesiones: el logout explícito hace ese envío aparte.
    const cierre = cliente.auth?.dispose ? cliente.auth.dispose() : cliente.auth?.stopAutoRefresh?.();
    cierre?.catch?.(() => {});
  }
  function liberarTemporales(inicio) {
    for (const registro of clientesTemporales) {
      if (registro.revision !== inicio) continue;
      if (registro.cliente !== clienteActual) liberarCliente(registro.cliente);
      clientesTemporales.delete(registro);
    }
  }
  function contexto(inicio) {
    return () => { if (destruido || inicio !== revision) throw fallo('cancelada'); };
  }
  async function pedir(promesa, actual) {
    let reloj;
    try {
      const resultado = await Promise.race([promesa,
        new Promise((_, rechazar) => { reloj = setTimeout(() => rechazar(fallo('plazo')), plazoMs); })]);
      actual();
      if (resultado?.error) throw resultado.error;
      return resultado?.data;
    } finally { clearTimeout(reloj); }
  }
  async function ejecutar(accion, tarea, { nueva = false } = {}) {
    if (!disponible || destruido) return { ok: false, error: mensajeError(fallo('cuentas_cerradas')) };
    if (vista.procesando) return { ok: false, error: 'Espera a que termine la operación anterior.' };
    const inicio = ++revision, actual = contexto(inicio);
    if (nueva) purgar();
    pintar({ procesando: true, accion, error: null, mensaje: null });
    try {
      const resultado = await tarea(actual);
      actual();
      return { ok: true, ...resultado };
    } catch (error) {
      if (inicio !== revision || destruido || error?.code === 'cancelada') return { ok: false, cancelada: true };
      if (nueva || ['sin_sesion', 'identidad_invalida', 'correo_no_confirmado'].includes(error?.code) || error?.status === 401) purgar();
      const mensaje = mensajeError(error);
      pintar({ error: mensaje, ...(['email_not_confirmed', 'correo_no_confirmado'].includes(error?.code)
        ? { estado: 'confirmacion' } : {}) });
      return { ok: false, error: mensaje };
    } finally {
      liberarTemporales(inicio);
      if (inicio === revision && !destruido) pintar({ procesando: false, accion: null });
    }
  }
  function clienteNuevo() {
    const cliente = clientePrueba || crearCliente({ plazoMs });
    clientesTemporales.add({ cliente, revision });
    return cliente;
  }
  async function identidad(cliente, actual, esperada) {
    let usuario;
    try { usuario = (await pedir(cliente.auth.getUser(), actual))?.user; }
    catch (error) { actual(); purgar(); throw error; }
    if (!usuario || !UUID.test(usuario.id) || (esperada && usuario.id !== esperada) || usuario.is_anonymous === true) throw fallo('identidad_invalida');
    if (!usuario.email || !usuario.email_confirmed_at || !Number.isFinite(Date.parse(usuario.email_confirmed_at))) throw fallo('correo_no_confirmado');
    return { id: usuario.id, correo: correoValido(usuario.email) };
  }
  async function datosPropios(cliente, usuario, actual) {
    const perfiles = await pedir(cliente.from('mi_perfil').select('id,nombre').eq('id', usuario.id).limit(1), actual);
    if (!Array.isArray(perfiles) || perfiles.length !== 1 || perfiles[0].id !== usuario.id) throw fallo('identidad_invalida');
    const vigiladas = await pedir(cliente.from('vigilancia').select('usuario_id,plataforma_id,plataformas(nombre)')
      .eq('usuario_id', usuario.id).limit(1000), actual);
    if (!Array.isArray(vigiladas) || vigiladas.some(fila => fila.usuario_id !== usuario.id || !UUID.test(fila.plataforma_id)
      || typeof fila.plataformas?.nombre !== 'string')) throw fallo('identidad_invalida');
    return { perfil: { id: usuario.id, nombre: nombreValido(perfiles[0].nombre, true) },
      vigiladas: vigiladas.map(fila => ({ id: fila.plataforma_id, nombre: fila.plataformas.nombre })) };
  }
  async function accesoActual(actual) {
    const cliente = clienteActual, uid = vista.usuario?.id;
    if (!cliente || !uid) throw fallo('sin_sesion');
    const usuario = await identidad(cliente, actual, uid);
    actual();
    return { cliente, usuario };
  }
  const acciones = {
    estado,
    async accesoTutorial() {
      const cliente = await acciones.clienteCatalogo(), uid = vista.usuario?.id;
      const actual = () => {
        if (destruido || clienteActual !== cliente || !uid || vista.usuario?.id !== uid) throw fallo('sin_sesion');
      };
      const sesion = (await pedir(cliente.auth.getSession(), actual))?.session;
      const token = sesion?.access_token;
      if (typeof token !== 'string' || token.length > 3800 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw fallo('sin_sesion');
      actual();
      return { uri: 'https://rwadar.pages.dev/api/acceso/tutorial', headers: { Authorization: 'Bearer ' + token } };
    },
    async clienteCatalogo() {
      const cliente = clienteActual, uid = vista.usuario?.id;
      const actual = () => {
        if (destruido || !cliente || clienteActual !== cliente || vista.usuario?.id !== uid) throw fallo('sin_sesion');
      };
      try {
        actual();
        await identidad(cliente, actual, uid);
        await datosPropios(cliente, { id: uid }, actual);
        actual();
        return cliente;
      } catch (error) {
        // Never purge a newer account when an older request finishes late.
        if (clienteActual === cliente && vista.usuario?.id === uid) purgar();
        throw error;
      }
    },
    suscribir(oyente) {
      if (typeof oyente !== 'function') throw new TypeError('La suscripción necesita una función.');
      if (!destruido) { oyentes.add(oyente); oyente(estado()); }
      return () => oyentes.delete(oyente);
    },
    registrar({ correo, clave, nombre = '', aceptaCondiciones } = {}) {
      return ejecutar('registrar', async actual => {
        const email = correoValido(correo), nombreLimpio = nombreValido(nombre, true);
        if (typeof clave !== 'string' || clave.length < 12 || clave.length > 256) throw fallo('clave_corta');
        if (aceptaCondiciones !== true) throw fallo('condiciones');
        const cliente = clienteNuevo();
        await pedir(cliente.auth.signUp({ email, password: clave,
          options: { emailRedirectTo: REDIRECT_CUENTAS, data: { nombre: nombreLimpio } } }), actual);
        // Ni siquiera una configuración accidental de autoconfirmación inicia
        // una sesión aquí: siempre se pide confirmar y después entrar.
        pintar({ estado: 'confirmacion', mensaje: 'Si el registro se ha completado, recibirás un enlace. Confirma tu correo en la web y después entra en la app.' });
      }, { nueva: true });
    },
    entrar({ correo, clave } = {}) {
      return ejecutar('entrar', async actual => {
        const email = correoValido(correo);
        if (typeof clave !== 'string' || !clave || clave.length > 256) throw fallo('clave_vacia');
        const cliente = clienteNuevo();
        const acceso = await pedir(cliente.auth.signInWithPassword({ email, password: clave }), actual);
        if (!acceso?.session?.access_token) throw fallo('sin_sesion');
        const usuario = await identidad(cliente, actual, acceso.user?.id);
        const propios = await datosPropios(cliente, usuario, actual);
        actual();
        clienteActual = cliente;
        pintar({ estado: 'autenticada', usuario, ...propios, mensaje: 'Ya has entrado. Tu vigilancia se guarda con esta cuenta.' });
      }, { nueva: true });
    },
    reenviar({ correo } = {}) {
      return ejecutar('reenviar', async actual => {
        const email = correoValido(correo);
        await pedir(clienteNuevo().auth.resend({ type: 'signup', email, options: { emailRedirectTo: REDIRECT_CUENTAS } }), actual);
        pintar({ mensaje: 'Si hay una cuenta pendiente, recibirás un nuevo enlace de confirmación. Revisa también el correo no deseado.' });
      });
    },
    recuperar({ correo } = {}) {
      return ejecutar('recuperar', async actual => {
        const email = correoValido(correo);
        await pedir(clienteNuevo().auth.resetPasswordForEmail(email, { redirectTo: REDIRECT_CUENTAS }), actual);
        pintar({ mensaje: 'Si ese correo tiene una cuenta, recibirás un enlace para cambiar la contraseña en la web. Después vuelve a entrar en la app.' });
      });
    },
    refrescar() {
      return ejecutar('refrescar', async actual => {
        try {
          const { cliente, usuario } = await accesoActual(actual);
          const propios = await datosPropios(cliente, usuario, actual);
          pintar({ usuario, ...propios });
        } catch (error) {
          actual(); purgar(); throw error;
        }
      });
    },
    guardarPerfil({ nombre } = {}) {
      return ejecutar('perfil', async actual => {
        const limpio = nombreValido(nombre, true);
        const { cliente, usuario } = await accesoActual(actual);
        const filas = await pedir(cliente.from('perfiles').update({ nombre: limpio || null }).eq('id', usuario.id).select('id,nombre'), actual);
        if (!Array.isArray(filas) || filas.length !== 1 || filas[0].id !== usuario.id || (filas[0].nombre || '') !== limpio) throw fallo('identidad_invalida');
        pintar({ perfil: { id: usuario.id, nombre: limpio }, mensaje: 'Nombre guardado.' });
      });
    },
    alternarVigilancia(nombre) {
      return ejecutar('vigilancia', async actual => {
        if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 180) throw fallo('plataforma_invalida');
        const { cliente, usuario } = await accesoActual(actual);
        const anterior = vista.vigiladas.find(fila => fila.nombre === nombre);
        if (anterior) {
          await pedir(cliente.from('vigilancia').delete().eq('usuario_id', usuario.id).eq('plataforma_id', anterior.id), actual);
        } else {
          const plataformas = await pedir(cliente.from('plataformas').select('id,nombre').eq('nombre', nombre).limit(1), actual);
          if (!Array.isArray(plataformas) || plataformas.length !== 1 || !UUID.test(plataformas[0].id) || plataformas[0].nombre !== nombre) throw fallo('plataforma_invalida');
          await pedir(cliente.from('vigilancia').insert({ usuario_id: usuario.id, plataforma_id: plataformas[0].id }), actual);
        }
        const propios = await datosPropios(cliente, usuario, actual);
        pintar({ ...propios, mensaje: anterior ? 'Plataforma retirada de tu vigilancia.' : 'Plataforma guardada en tu vigilancia. Los avisos siguen sin estar activos.' });
      });
    },
    async salir() {
      if (destruido) return { ok: true };
      const anterior = clienteActual;
      ++revision;
      purgar();
      pintar({ procesando: false, accion: null, error: null, mensaje: 'Has salido. La sesión no se conserva en el dispositivo.' });
      if (!disponible || !anterior) return { ok: true };
      const inicio = revision;
      try { await pedir(anterior.auth.signOut({ scope: 'local' }), contexto(inicio)); return { ok: true }; }
      catch (error) {
        if (revision !== inicio || destruido) return { ok: false, cancelada: true };
        // La memoria local se borra incluso sin cobertura. No afirmar que se ha
        // revocado en el servidor si el envío de logout no quedó confirmado.
        const mensaje = 'Has salido de este dispositivo, pero no se pudo confirmar el cierre remoto. Vuelve a conectarte para entrar de nuevo.';
        pintar({ error: mensaje });
        return { ok: false, error: mensaje };
      }
    },
    borrarCuenta({ clave, confirmacion } = {}) {
      return ejecutar('borrar', async actual => {
        if (confirmacion !== 'BORRAR' || typeof clave !== 'string' || !clave || clave.length > 256) throw fallo('confirmar_borrado');
        const original = vista.usuario;
        if (!original) throw fallo('sin_sesion');
        // Nuevo login: el cliente no conserva contraseñas ni acepta un token de
        // recuperación como confirmación de una operación irreversible.
        const cliente = clienteNuevo();
        const acceso = await pedir(cliente.auth.signInWithPassword({ email: original.correo, password: clave }), actual);
        if (!acceso?.session?.access_token) throw fallo('sin_sesion');
        await identidad(cliente, actual, original.id);
        actual();
        await pedir(cliente.rpc('borrar_mi_cuenta'), actual);
        purgar();
        pintar({ mensaje: 'Tu cuenta y su lista de vigilancia se han borrado. Los favoritos locales se conservan hasta que los borres desde Perfil.' });
      });
    },
    cancelar() {
      const anterior = revision;
      ++revision;
      liberarTemporales(anterior);
      // Cancelar una pantalla o desmontar el componente no conserva una sesión
      // que aún no terminó de validarse, ni permite que su respuesta reaparezca.
      pintar({ procesando: false, accion: null, error: null, mensaje: null });
    },
    destruir() {
      const anterior = revision;
      ++revision;
      liberarTemporales(anterior);
      purgar();
      destruido = true;
      oyentes.clear();
    },
  };
  return acciones;
}

module.exports = { crearControladorCuentas, crearClienteCuentas, crearTransporteCuentas,
  REDIRECT_CUENTAS, PLAZO_CUENTAS, MAX_RESPUESTA, MAX_RESPUESTA_CATALOGO, PLAZO_CATALOGO, mensajeError };
