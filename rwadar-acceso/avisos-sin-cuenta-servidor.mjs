/* =====================================================================
   /api/avisos/* · notificaciones sin cuenta (web y app de Android)
   ---------------------------------------------------------------------
   Encargo de la dirección (14/11/2026): «que salga tanto en iPhone como en
   Android; muy importante que funcionen las notificaciones y los avisos
   aunque no tengan cuenta o no hayan iniciado sesión: que puedan
   activarlas». Contrato completo (para la web y la app):
   docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md. La base es la migración 36
   (rwadar-app/db/36_avisos_sin_cuenta.sql), que nace apagada.

   Rutas (sin sesión, sin cookies, con la clave publicable de Supabase,
   como /api/acceso/baja):
     POST /api/avisos/web     {accion: alta|baja|estado, …}  un navegador
     POST /api/avisos/movil   {accion: alta|baja|estado, …}  la app
     GET  /api/avisos/texto      el texto del permiso, su versión, si se
                                 puede activar ahora y la clave VAPID
     GET  /api/avisos/recientes  los avisos publicados (90 días)
   Los dos GET se guardan 60 segundos en la memoria de este isolate.

   Reglas: si llega Origin, tiene que ser el mismo origen (la app nativa no
   lo manda); sec-fetch-site: cross-site da 403. Solo application/json,
   como mucho 4 kB y exactamente las claves de cada acción, con las mismas
   reglas de forma que la base. Nunca lee ni escribe cookies, ni manda a
   Supabase otra cosa que la clave publicable. Nunca registra direcciones,
   claves ni tokens. Límites por visitante (servidor.mjs, LIMITES): altas,
   bajas y consultas de estado, cada grupo con su cupo; son de mejor
   esfuerzo (memoria de cada isolate): la barrera de verdad son los cupos de
   la base. El interruptor (AVISOS_SIN_CUENTA de servidor.mjs) apagado: el
   alta da 404 y el texto dice activo = false; la baja, el estado y los
   avisos siguen funcionando.

   Autónomo (compilar.cjs lo mete en _worker.js en su propio ámbito): sin
   importaciones y solo exporta crearAvisosSinCuentaServidor.
   ===================================================================== */
const PREFIJO = '/api/avisos/';
const MAX_CUERPO = 4096;
const MEMORIA_MS = 60000;
const MEMORIA_FALLO_MS = 15000;
const LIMITE_RECIENTES = 20;
const ESPERA_CUPO_S = '900';
// Las mismas reglas que la base (sin_cuenta_web y sin_cuenta_movil, 36).
const ENDPOINT_SC = /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)\/[A-Za-z0-9._~:/?=&%+-]+$/;
const P256DH_SC = /^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$/;
const AUTH_SC = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const TOKEN_SC = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$/;
const VERSION_SC = /^[a-z0-9][a-z0-9.-]{2,79}$/;
const CLAVE_VAPID_SC = /^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$/;
const IDIOMAS_SC = Object.freeze(['es', 'en']);
const ORIGENES_SC = Object.freeze(['novedades', 'perfil', 'avisos']);
const TIPOS_SC = Object.freeze(['ofertas', 'actualizacion', 'novedad']);
// Las claves exactas de cada acción (ni una más ni una menos).
const CLAVES_SC = Object.freeze({
  web: Object.freeze({ alta: ['accion', 'auth', 'endpoint', 'idioma', 'origen', 'p256dh', 'version'],
    baja: ['accion', 'auth', 'endpoint'], estado: ['accion', 'auth', 'endpoint'] }),
  movil: Object.freeze({ alta: ['accion', 'idioma', 'origen', 'plataforma', 'token', 'version'],
    baja: ['accion', 'token'], estado: ['accion', 'token'] }),
});
// Lo que la base puede contestar a un alta que no se hace, y su estado HTTP.
const RECHAZOS_ALTA = Object.freeze({ apagado: 409, version: 409, en_uso: 409, lleno: 409, cupo: 429 });

function fallo(mensaje, estado) { const e = new Error(mensaje); e.estadoSinCuenta = estado; return e; }
// Base64 con «+/» y relleno → base64url, como hace la base.
function base64url(valor) { return typeof valor === 'string' ? valor.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : ''; }

async function cuerpoPequeno(request) {
  const tipo = (request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (tipo !== 'application/json') throw fallo('solicitud_invalida', 400);
  if (Number(request.headers.get('content-length')) > MAX_CUERPO) throw fallo('solicitud_excesiva', 413);
  const lector = request.body?.getReader();
  if (!lector) throw fallo('solicitud_invalida', 400);
  const trozos = []; let tamano = 0;
  try {
    while (true) {
      const parte = await lector.read(); if (parte.done) break;
      tamano += parte.value.byteLength;
      if (tamano > MAX_CUERPO) { await lector.cancel(); throw fallo('solicitud_excesiva', 413); }
      trozos.push(parte.value);
    }
  } finally { lector.releaseLock(); }
  const bytes = new Uint8Array(tamano); let en = 0;
  for (const t of trozos) { bytes.set(t, en); en += t.length; }
  let datos;
  try { datos = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw fallo('solicitud_invalida', 400); }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw fallo('solicitud_invalida', 400);
  return datos;
}

// Comprueba la forma y devuelve los parámetros de la RPC (p_…).
function parametros(canal, datos) {
  const accion = datos.accion;
  const esperadas = CLAVES_SC[canal][accion];
  if (!esperadas || Object.keys(datos).sort().join() !== esperadas.join()) throw fallo('solicitud_invalida', 400);
  if (accion === 'alta' && (typeof datos.version !== 'string' || !VERSION_SC.test(datos.version)
    || !IDIOMAS_SC.includes(datos.idioma) || !ORIGENES_SC.includes(datos.origen))) throw fallo('solicitud_invalida', 400);
  if (canal === 'web') {
    const auth = base64url(datos.auth);
    if (typeof datos.endpoint !== 'string' || datos.endpoint.length > 2048 || !ENDPOINT_SC.test(datos.endpoint) || !AUTH_SC.test(auth)) throw fallo('solicitud_invalida', 400);
    if (accion !== 'alta') return { accion, datos: { p_endpoint: datos.endpoint, p_auth: auth } };
    const p256dh = base64url(datos.p256dh);
    if (!P256DH_SC.test(p256dh)) throw fallo('solicitud_invalida', 400);
    return { accion, datos: { p_endpoint: datos.endpoint, p_p256dh: p256dh, p_auth: auth, p_version: datos.version,
      p_idioma: datos.idioma, p_origen: datos.origen } };
  }
  if (typeof datos.token !== 'string' || !TOKEN_SC.test(datos.token)) throw fallo('solicitud_invalida', 400);
  if (accion !== 'alta') return { accion, datos: { p_token: datos.token } };
  if (datos.plataforma !== 'android') throw fallo('solicitud_invalida', 400);
  return { accion, datos: { p_token: datos.token, p_plataforma: 'android', p_version: datos.version,
    p_idioma: datos.idioma, p_origen: datos.origen } };
}

const RPC = Object.freeze({
  web: Object.freeze({ alta: 'alta_aviso_sin_cuenta_web', baja: 'baja_aviso_sin_cuenta_web', estado: 'aviso_sin_cuenta_web_activo' }),
  movil: Object.freeze({ alta: 'alta_aviso_sin_cuenta_movil', baja: 'baja_aviso_sin_cuenta_movil', estado: 'aviso_sin_cuenta_movil_activo' }),
});

// La base sin la 36, con la API cerrada (fallo_cerrado) o sin permiso:
// PostgREST da 401, 403 o 404. Para la web y la app es «todavía no».
function noInstalada(error) { return error?.message === 'auth_rechazado' && [401, 403, 404].includes(error.status); }
const esBooleano = (v) => typeof v === 'boolean';

export function crearAvisosSinCuentaServidor({ api, ahora = Date.now, respuesta, reservarIntento, activo = true }) {
  if (typeof activo !== 'boolean') throw new Error('avisos_sin_cuenta_invalidos');
  // Memoria de los dos GET: { valor, estado, hasta } y la lectura en vuelo.
  const memoria = new Map();
  const enVuelo = new Map();

  function textoSeguro(r) {
    const textoValido = (t) => typeof t === 'string' && t.length >= 20 && t.length <= 1000;
    if (!r || typeof r !== 'object' || Array.isArray(r) || r.v !== 1 || !esBooleano(r.activo)) return null;
    if (r.version === null && r.texto_es === null && r.texto_en === null) {
      return { v: 1, activo: false, version: null, texto: null, clavePublica: null };
    }
    if (typeof r.version !== 'string' || !VERSION_SC.test(r.version) || !textoValido(r.texto_es) || !textoValido(r.texto_en)) return null;
    const clave = typeof r.clave_publica === 'string' && CLAVE_VAPID_SC.test(r.clave_publica) ? r.clave_publica : null;
    return { v: 1, activo: activo && r.activo && clave !== null, version: r.version, texto: { es: r.texto_es, en: r.texto_en }, clavePublica: clave };
  }
  function avisoSeguro(a) {
    if (!a || typeof a !== 'object' || typeof a.id !== 'string' || !/^[1-9][0-9]{0,18}$/.test(a.id) || !TIPOS_SC.includes(a.tipo)
      || typeof a.titulo !== 'string' || a.titulo.length < 1 || a.titulo.length > 90
      || typeof a.texto !== 'string' || a.texto.length < 1 || a.texto.length > 400
      || typeof a.enlace !== 'string' || a.enlace.length > 200 || !/^https:\/\/rwadar\.pages\.dev(?:[/?#]|$)/.test(a.enlace)
      || typeof a.creado_el !== 'string' || !Number.isFinite(Date.parse(a.creado_el))) return null;
    return { id: a.id, tipo: a.tipo, titulo: a.titulo, texto: a.texto, enlace: a.enlace, creado_el: a.creado_el };
  }

  async function leerTexto(env) {
    try {
      const t = textoSeguro(await api(env, '/rest/v1/rpc/avisos_sin_cuenta_texto', { method: 'POST', data: {}, maxBytes: 8192 }));
      return t ? { estado: 200, valor: t } : { estado: 503, valor: { error: 'servicio_no_disponible' } };
    } catch (error) {
      if (noInstalada(error)) return { estado: 200, valor: { v: 1, activo: false, version: null, texto: null, clavePublica: null } };
      if (error?.message === 'configuracion_pendiente') return { estado: 503, valor: { error: 'configuracion_pendiente' } };
      return { estado: 503, valor: { error: 'servicio_no_disponible' } };
    }
  }
  async function leerRecientes(env) {
    try {
      const r = await api(env, '/rest/v1/rpc/avisos_publicos', { method: 'POST', data: { p_limite: LIMITE_RECIENTES }, maxBytes: 64 * 1024 });
      if (!Array.isArray(r)) return { estado: 503, valor: { error: 'servicio_no_disponible' } };
      return { estado: 200, valor: { v: 1, avisos: r.map(avisoSeguro).filter(Boolean).slice(0, LIMITE_RECIENTES) } };
    } catch (error) {
      if (noInstalada(error)) return { estado: 200, valor: { v: 1, avisos: [] } };
      if (error?.message === 'configuracion_pendiente') return { estado: 503, valor: { error: 'configuracion_pendiente' } };
      return { estado: 503, valor: { error: 'servicio_no_disponible' } };
    }
  }
  async function servirGuardado(nombre, env, leer) {
    const t = ahora();
    let e = memoria.get(nombre);
    if (!e || e.hasta <= t) {
      if (!enVuelo.has(nombre)) {
        enVuelo.set(nombre, leer(env).then((r) => {
          const guardado = { ...r, hasta: ahora() + (r.estado === 200 ? MEMORIA_MS : MEMORIA_FALLO_MS) };
          memoria.set(nombre, guardado);
          return guardado;
        }).finally(() => enVuelo.delete(nombre)));
      }
      e = await enVuelo.get(nombre);
    }
    if (e.estado === 200) return respuesta(e.valor, 200, { 'Cache-Control': 'public, max-age=60' });
    return respuesta(e.valor, e.estado, { 'Retry-After': '30' });
  }

  async function cambiar(canal, request, env) {
    const { accion, datos } = parametros(canal, await cuerpoPequeno(request));
    if (accion === 'alta' && !activo) return respuesta({ ok: false, error: 'no_disponible' }, 404);
    reservarIntento('/api/avisos:' + accion, request);
    let r;
    try {
      r = await api(env, '/rest/v1/rpc/' + RPC[canal][accion], { method: 'POST', data: datos, maxBytes: 1024 });
    } catch (error) {
      if (noInstalada(error)) {
        if (accion === 'alta') return respuesta({ ok: false, error: 'apagado' }, 409);
        if (accion === 'baja') return respuesta({ ok: true, borrada: false });
        return respuesta({ ok: true, activa: false, vigente: false, servicio: false });
      }
      // 400 de la base: la forma (22023), que ya se comprobó aquí.
      if (error?.message === 'auth_rechazado' && error.status === 400) throw fallo('solicitud_invalida', 400);
      throw error;
    }
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('servicio_no_disponible');
    if (accion === 'alta') {
      if (r.ok === true && r.estado === 'activa' && esBooleano(r.nueva)) return respuesta({ ok: true, estado: 'activa', nueva: r.nueva });
      if (r.ok === false && Object.hasOwn(RECHAZOS_ALTA, r.error)) {
        return respuesta({ ok: false, error: r.error }, RECHAZOS_ALTA[r.error], r.error === 'cupo' ? { 'Retry-After': ESPERA_CUPO_S } : {});
      }
    } else if (accion === 'baja') {
      if (r.ok === true && esBooleano(r.borrada)) return respuesta({ ok: true, borrada: r.borrada });
    } else if (r.ok === true && esBooleano(r.activa) && esBooleano(r.vigente) && esBooleano(r.servicio)) {
      return respuesta({ ok: true, activa: r.activa, vigente: r.vigente, servicio: activo && r.servicio });
    }
    throw new Error('servicio_no_disponible');
  }

  return async function atenderAvisosSinCuenta({ request, env, url, path }) {
    const ruta = path.startsWith(PREFIJO) ? path.slice(PREFIJO.length) : '';
    if (!['web', 'movil', 'texto', 'recientes'].includes(ruta)) return respuesta({ ok: false, error: 'ruta_no_permitida' }, 404);
    const origen = request.headers.get('origin');
    if ((origen !== null && origen !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return respuesta({ ok: false, error: 'origen_no_permitido' }, 403);
    }
    const lectura = ruta === 'texto' || ruta === 'recientes';
    if (request.method !== (lectura ? 'GET' : 'POST')) {
      return respuesta({ ok: false, error: 'metodo_no_permitido' }, 405, { Allow: lectura ? 'GET' : 'POST' });
    }
    if (url.search) return respuesta({ ok: false, error: 'solicitud_invalida' }, 400);
    try {
      if (ruta === 'texto') return await servirGuardado('texto', env, leerTexto);
      if (ruta === 'recientes') return await servirGuardado('recientes', env, leerRecientes);
      return await cambiar(ruta, request, env);
    } catch (error) {
      if (error?.estadoSinCuenta) return respuesta({ ok: false, error: error.message }, error.estadoSinCuenta);
      if (error?.message === 'configuracion_pendiente') return respuesta({ ok: false, error: 'configuracion_pendiente' }, 503, { 'Retry-After': '30' });
      if (error?.status === 429) return respuesta({ ok: false, error: 'intentos_excedidos' }, 429, { 'Retry-After': error.reintentarTras || '60' });
      return respuesta({ ok: false, error: 'servicio_no_disponible' }, 503, { 'Retry-After': '30' });
    }
  };
}
