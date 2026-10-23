/* =====================================================================
   RWAdar · panel · Supabase: catálogo y cuentas
   ---------------------------------------------------------------------
   Lo que lee cualquier visitante (si el catálogo está retirado, su
   vigencia) se pide con la clave publicable. Lo de administrador
   (cuentas, retirar el catálogo) exige la clave secreta de .env.local.

   Borrar una cuenta en auth.users arrastra en cascada su perfil, su
   lista de vigilancia, sus avisos y sus opiniones (07_cuentas.sql y
   09_opiniones.sql): no hay que limpiar nada a mano.
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedirJson, pedir } = require('./pedir');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POR_PAGINA = 200;
const MAX_PAGINAS = 50;
const BLOQUEO_INDEFINIDO = '876000h'; // cien años: Supabase no tiene «para siempre»
const DIA_MS = 86400000;

function crearSupabase(config) {
  const rest = `${config.supabase}/rest/v1`;
  const auth = `${config.supabase}/auth/v1`;
  const publica = { apikey: config.clavePublica };

  function secreta(para) {
    const clave = config.claveSecreta;
    if (!clave) throw new FaltaCredencial('Supabase', para);
    /* Las claves nuevas (sb_secret_…) van solo en apikey; las antiguas
       service_role son un JWT y también viajan como Bearer. */
    return clave.startsWith('eyJ') ? { apikey: clave, Authorization: `Bearer ${clave}` } : { apikey: clave };
  }

  function comprobarId(id) {
    if (!UUID.test(String(id))) throw new ErrorPanel('Identificador de cuenta no válido', { estado: 400 });
    return String(id);
  }

  async function estadoCatalogo() {
    const r = await pedirJson(`${rest}/catalogo_publicacion?select=retirado,motivo,actualizado_el`, { headers: publica });
    const fila = Array.isArray(r.datos) ? r.datos[0] : null;
    if (!fila) throw new ErrorPanel('Supabase no devolvió la orden de publicación del catálogo', { estado: 502 });
    return { retirado: fila.retirado === true, motivo: fila.motivo || null, actualizadoEl: fila.actualizado_el || null, ms: r.ms };
  }

  async function vigenciaCatalogo(ahora = Date.now()) {
    const campos = 'select=verificado_lote_el,vigencia_lote_dias,plataformas_esperadas,ofertas_esperadas';
    const [plat, ofer] = await Promise.all([
      pedirJson(`${rest}/catalogo_plataformas_publicas_v2?${campos}`, { headers: publica }),
      pedirJson(`${rest}/catalogo_ofertas_publicas_v2?${campos}`, { headers: publica }),
    ]);
    const plataformas = Array.isArray(plat.datos) ? plat.datos : [];
    const ofertas = Array.isArray(ofer.datos) ? ofer.datos : [];
    const primera = plataformas[0] || ofertas[0];
    if (!primera) return { plataformas: 0, ofertas: 0, plataformasEsperadas: null, ofertasEsperadas: null, caducaEl: null, diasRestantes: null };
    const verificado = new Date(primera.verificado_lote_el);
    const caduca = new Date(verificado.getTime() + Number(primera.vigencia_lote_dias || 0) * DIA_MS);
    return {
      verificadoEl: primera.verificado_lote_el,
      caducaEl: caduca.toISOString().slice(0, 10),
      diasRestantes: Math.ceil((caduca.getTime() - ahora) / DIA_MS),
      plataformas: plataformas.length,
      ofertas: ofertas.length,
      plataformasEsperadas: primera.plataformas_esperadas ?? null,
      ofertasEsperadas: primera.ofertas_esperadas ?? null,
    };
  }

  async function saludAuth() {
    const r = await pedir(`${auth}/health`, { headers: publica });
    return { ok: r.ok, estado: r.estado, ms: r.ms };
  }

  async function cambiarCatalogo({ retirado, motivo }) {
    const cabeceras = secreta('retirar o mostrar el catálogo');
    const texto = String(motivo || '').trim();
    if (retirado && (texto.length < 3 || texto.length > 300)) {
      throw new ErrorPanel('Escribe un motivo de entre 3 y 300 letras', { estado: 400 });
    }
    const r = await pedirJson(`${rest}/catalogo_publicacion?unica=eq.true`, {
      method: 'PATCH',
      headers: { ...cabeceras, Prefer: 'return=representation' },
      cuerpo: { retirado: Boolean(retirado), motivo: retirado ? texto : null, actualizado_el: new Date().toISOString() },
    });
    if (!Array.isArray(r.datos) || r.datos.length !== 1) {
      throw new ErrorPanel('Supabase no confirmó el cambio del catálogo', { estado: 502 });
    }
    return { retirado: r.datos[0].retirado === true, motivo: r.datos[0].motivo || null };
  }

  /* ¿Deja la base cambiar la orden del catálogo? Se prueba con un filtro
     que no coincide con ninguna fila (la única es unica=true): no cambia
     nada, pero la base comprueba el permiso igual. */
  async function puedeCambiarCatalogo() {
    if (!config.claveSecreta) return { puede: false, motivo: 'falta-clave' };
    const r = await pedir(`${rest}/catalogo_publicacion?unica=eq.false`, {
      method: 'PATCH', headers: { ...secreta('comprobar el permiso del catálogo'), Prefer: 'return=minimal' }, cuerpo: { motivo: null },
    });
    if (r.ok) return { puede: true, motivo: null };
    return { puede: false, motivo: r.estado === 401 || r.estado === 403 ? 'sin-permiso' : `error-${r.estado}` };
  }

  async function usuariosAuth(cabeceras) {
    const todos = [];
    for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
      const r = await pedirJson(`${auth}/admin/users?page=${pagina}&per_page=${POR_PAGINA}`, { headers: cabeceras });
      const lote = Array.isArray(r.datos?.users) ? r.datos.users : [];
      todos.push(...lote);
      if (lote.length < POR_PAGINA) break;
    }
    return todos;
  }

  /* Perfil y vigilancia son complementos: si fallan, la lista sale igual. */
  async function tablaOpcional(ruta, cabeceras) {
    try { return (await pedirJson(`${rest}/${ruta}`, { headers: cabeceras })).datos || []; } catch { return null; }
  }

  async function listarCuentas(ahora = Date.now()) {
    const cabeceras = secreta('ver las cuentas');
    const [usuarios, perfiles, vigilancia] = await Promise.all([
      usuariosAuth(cabeceras),
      tablaOpcional('perfiles?select=id,nombre,avisos_correo', cabeceras),
      tablaOpcional('vigilancia?select=usuario_id', cabeceras),
    ]);
    const perfilPorId = new Map((perfiles || []).map(p => [p.id, p]));
    const vigiladas = new Map();
    for (const v of vigilancia || []) vigiladas.set(v.usuario_id, (vigiladas.get(v.usuario_id) || 0) + 1);
    const cuentas = usuarios.filter(u => !u.is_anonymous).map(u => normalizar(u, perfilPorId.get(u.id), vigiladas.get(u.id), ahora));
    cuentas.sort((a, b) => String(b.creada).localeCompare(String(a.creada)));
    return { cuentas, resumen: resumir(cuentas, ahora), perfilesLeidos: perfiles !== null };
  }

  async function cuenta(id, cabeceras) {
    const r = await pedirJson(`${auth}/admin/users/${comprobarId(id)}`, { headers: cabeceras });
    return r.datos;
  }

  async function borrarCuenta(id, confirmacion) {
    const cabeceras = secreta('borrar cuentas');
    const usuario = await cuenta(id, cabeceras);
    const correo = String(usuario?.email || '').toLowerCase();
    if (!correo || String(confirmacion || '').trim().toLowerCase() !== correo) {
      throw new ErrorPanel('Para borrar, escribe exactamente el correo de la cuenta', { estado: 400 });
    }
    await pedirJson(`${auth}/admin/users/${comprobarId(id)}`, { method: 'DELETE', headers: cabeceras });
    return { id, correo };
  }

  async function bloquearCuenta(id, bloquear) {
    const cabeceras = secreta(bloquear ? 'bloquear cuentas' : 'desbloquear cuentas');
    const r = await pedirJson(`${auth}/admin/users/${comprobarId(id)}`, {
      method: 'PUT', headers: cabeceras, cuerpo: { ban_duration: bloquear ? BLOQUEO_INDEFINIDO : 'none' },
    });
    return { id, correo: r.datos?.email || null, bloqueada: Boolean(bloquear) };
  }

  async function confirmarCuenta(id) {
    const cabeceras = secreta('confirmar cuentas');
    const r = await pedirJson(`${auth}/admin/users/${comprobarId(id)}`, {
      method: 'PUT', headers: cabeceras, cuerpo: { email_confirm: true },
    });
    return { id, correo: r.datos?.email || null };
  }

  return { estadoCatalogo, vigenciaCatalogo, saludAuth, cambiarCatalogo, puedeCambiarCatalogo, listarCuentas, borrarCuenta, bloquearCuenta, confirmarCuenta };
}

function normalizar(u, perfil, vigiladas, ahora) {
  const bloqueoHasta = u.banned_until && new Date(u.banned_until).getTime() > ahora ? u.banned_until : null;
  return {
    id: u.id,
    correo: u.email || u.phone || '(sin correo)',
    nombre: perfil?.nombre || u.user_metadata?.nombre || null,
    creada: u.created_at || null,
    ultimaEntrada: u.last_sign_in_at || null,
    confirmada: Boolean(u.email_confirmed_at || u.confirmed_at),
    confirmadaEl: u.email_confirmed_at || u.confirmed_at || null,
    correoAltaEnviado: u.confirmation_sent_at || null,
    correoRecuperacionEnviado: u.recovery_sent_at || null,
    bloqueadaHasta: bloqueoHasta,
    proveedor: u.app_metadata?.provider || 'email',
    vigiladas: vigiladas || 0,
    avisosCorreo: perfil ? perfil.avisos_correo !== false : null,
  };
}

function resumir(cuentas, ahora) {
  const hace = dias => ahora - dias * DIA_MS;
  const desde = (fecha, dias) => fecha && new Date(fecha).getTime() >= hace(dias);
  const altasPorDia = new Map();
  for (let i = 29; i >= 0; i--) altasPorDia.set(new Date(hace(i)).toISOString().slice(0, 10), 0);
  for (const c of cuentas) {
    const dia = String(c.creada || '').slice(0, 10);
    if (altasPorDia.has(dia)) altasPorDia.set(dia, altasPorDia.get(dia) + 1);
  }
  return {
    total: cuentas.length,
    confirmadas: cuentas.filter(c => c.confirmada).length,
    sinConfirmar: cuentas.filter(c => !c.confirmada).length,
    bloqueadas: cuentas.filter(c => c.bloqueadaHasta).length,
    nuevas7d: cuentas.filter(c => desde(c.creada, 7)).length,
    nuevas30d: cuentas.filter(c => desde(c.creada, 30)).length,
    activas30d: cuentas.filter(c => desde(c.ultimaEntrada, 30)).length,
    altasPorDia: [...altasPorDia].map(([fecha, altas]) => ({ fecha, altas })),
  };
}

module.exports = { crearSupabase, UUID };
