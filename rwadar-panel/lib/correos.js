/* =====================================================================
   RWAdar · panel · correos de las cuentas
   ---------------------------------------------------------------------
   ¿Salen y llegan los correos de alta y de recuperar contraseña?
     · De cada cuenta, Supabase guarda cuándo se le mandó el correo de
       alta y cuándo lo confirmó. Si pasan 24 h sin confirmar, lo más
       probable es que no le llegara o que acabara en spam.
     · En sus registros (auth_logs) apunta cada petición de alta, reenvío
       o recuperación con su resultado, y los errores al enviar (por
       ejemplo, el 534 de Gmail). Solo deja ver 24 horas.
     · De su configuración se lee solo lo que no es secreto: servidor de
       correo, nombre del remitente y el límite de correos por hora.
   Nada de esto enseña direcciones de correo: los mensajes se tapan.
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedir, mensajeRemoto } = require('./pedir');

const DIA_MS = 86400000;
const ATASCADA_HASTA_DIAS = 7;
const RUTAS = { '/signup': 'altas', '/resend': 'reenvios', '/recover': 'recuperaciones', '/otp': 'otp', '/verify': 'verificaciones' };

/* Quita direcciones de correo (también con tildes o %40) e IP (v4 y v6). */
const tapar = texto => String(texto || '')
  .replace(/[^\s@<>"'(),;:]+(?:@|%40)[^\s@<>"'(),;:]+\.[^\s<>"'(),;:]+/gi, '<correo>')
  .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>')
  /* IPv6: con alguna letra o «::», para no confundirla con una hora (18:00:00). */
  .replace(/\b[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){2,7}\b/gi, m => (/[a-f]/i.test(m) || m.includes('::') ? '<ip>' : m))
  .slice(0, 200);

/* Errores: los de las rutas de correo y, de las demás, solo los que hablan
   de correo o SMTP (un fallo cualquiera de Auth no es un correo perdido). */
const CONSULTA = `SELECT log_attributes['path'] AS ruta, log_attributes['status'] AS estado, log_attributes['level'] AS nivel,
  if(log_attributes['level'] = 'error', log_attributes['msg'], '') AS error, count() AS n, max(timestamp) AS ultimo
FROM logs
WHERE source = 'auth_logs' AND (log_attributes['path'] IN ('/signup', '/resend', '/recover', '/otp', '/verify')
  OR (log_attributes['level'] = 'error' AND (lower(log_attributes['msg']) LIKE '%smtp%' OR lower(log_attributes['msg']) LIKE '%mail%')))
GROUP BY ruta, estado, nivel, error`;

/* ClickHouse da la hora como texto («2026-10-23 18:00:00») o en microsegundos. */
function aFecha(valor) {
  if (typeof valor === 'number') return new Date(valor > 1e14 ? valor / 1000 : valor);
  const d = new Date(String(valor || '').replace(' ', 'T').replace(/(T[\d:.]+)$/, '$1Z'));
  return Number.isNaN(d.getTime()) ? null : d;
}

/* De la lista de cuentas: altas, confirmaciones y posibles correos perdidos.
   «Atascadas» son las altas de entre 1 y 7 días sin confirmar: más viejas
   ya no son un aviso, son gente que no siguió. */
function resumirCuentas(cuentas, ahora = Date.now()) {
  const desde = ahora - 30 * DIA_MS;
  const recientes = cuentas.filter(c => c.correoAltaEnviado && new Date(c.correoAltaEnviado).getTime() >= desde);
  const edad = c => ahora - new Date(c.correoAltaEnviado).getTime();
  const sinConfirmar24h = recientes.filter(c => !c.confirmada && edad(c) > DIA_MS && edad(c) <= ATASCADA_HASTA_DIAS * DIA_MS);
  const tiempos = recientes.filter(c => c.confirmadaEl).map(c => (new Date(c.confirmadaEl) - new Date(c.correoAltaEnviado)) / 60000).filter(m => m >= 0).sort((a, b) => a - b);
  return {
    altas30d: recientes.length,
    confirmadas30d: recientes.filter(c => c.confirmada).length,
    sinConfirmar24h: sinConfirmar24h.length,
    recuperaciones30d: cuentas.filter(c => c.correoRecuperacionEnviado && new Date(c.correoRecuperacionEnviado).getTime() >= desde).length,
    minutosHastaConfirmar: tiempos.length ? Math.round(tiempos[Math.floor(tiempos.length / 2)]) : null,
    ultimoEnviado: [...cuentas.map(c => c.correoAltaEnviado), ...cuentas.map(c => c.correoRecuperacionEnviado)].filter(Boolean).sort().at(-1) || null,
  };
}

/* fuente: cualquier cosa con listarCuentas() (el cliente de Supabase o su caché). */
function crearCorreos(config, fuente) {
  const ref = () => {
    const r = config.supabaseApi !== 'https://api.supabase.com' ? 'simulado' : (config.supabase.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co$/) || [])[1];
    if (!r) throw new ErrorPanel('No reconozco el proyecto de Supabase', { estado: 400 });
    return r;
  };
  const cabeceras = () => {
    if (!config.supabaseAccessToken) throw new FaltaCredencial('Supabase (registros)', 'ver los correos');
    return { Authorization: `Bearer ${config.supabaseAccessToken}` };
  };

  async function registros24h(ahora = new Date()) {
    const fin = new Date(Math.floor(ahora.getTime() / 60000) * 60000);
    const q = new URLSearchParams({ sql: CONSULTA, iso_timestamp_start: new Date(fin - DIA_MS).toISOString(), iso_timestamp_end: fin.toISOString() });
    const r = await pedir(`${config.supabaseApi}/v1/projects/${ref()}/analytics/endpoints/logs?${q}`, { headers: cabeceras(), espera: 25000 });
    if (r.estado === 429) throw new ErrorPanel('Supabase pide esperar un minuto antes de volver a consultar sus registros', { estado: 503, codigo: 'espera' });
    if (!r.ok) throw new ErrorPanel(`api.supabase.com respondió ${r.estado}: ${mensajeRemoto(r.datos, r.texto)}`, { estado: 502 });
    if (r.datos?.error) throw new ErrorPanel(`Supabase no aceptó la consulta de registros: ${tapar(typeof r.datos.error === 'string' ? r.datos.error : JSON.stringify(r.datos.error))}`, { estado: 502 });
    const resultado = { altas: 0, reenvios: 0, recuperaciones: 0, otp: 0, verificaciones: 0, rechazadas: 0, frenadas: 0, errores: 0, ultimoError: null, ultimosErrores: [] };
    const porMensaje = new Map();
    for (const f of r.datos?.result || []) {
      const n = Number(f.n) || 0;
      const clave = RUTAS[f.ruta];
      if (clave) resultado[clave] += n;
      if (clave && Number(f.estado) >= 400) resultado.rechazadas += n;
      /* 429: Supabase no manda el correo porque se pasó del límite por hora. */
      if (clave && Number(f.estado) === 429) resultado.frenadas += n;
      if (f.nivel !== 'error') continue;
      resultado.errores += n;
      const cuando = aFecha(f.ultimo);
      if (cuando && (!resultado.ultimoError || cuando > new Date(resultado.ultimoError))) resultado.ultimoError = cuando.toISOString();
      /* Se tapa antes de agrupar: el mismo fallo con correos distintos es una sola línea. */
      if (f.error) {
        const mensaje = tapar(f.error);
        porMensaje.set(mensaje, (porMensaje.get(mensaje) || 0) + n);
      }
    }
    resultado.ultimosErrores = [...porMensaje].map(([mensaje, veces]) => ({ mensaje, veces })).sort((a, b) => b.veces - a.veces).slice(0, 5);
    return resultado;
  }

  async function remitente() {
    const r = await pedir(`${config.supabaseApi}/v1/projects/${ref()}/config/auth`, { headers: cabeceras() });
    if (!r.ok) throw new ErrorPanel(`No pude leer la configuración del correo (${r.estado})`, { estado: 502 });
    const c = r.datos || {};
    /* Solo campos que no son secretos: nunca la contraseña del correo. */
    return {
      servidor: c.smtp_host || 'el de Supabase (limitado)',
      nombre: c.smtp_sender_name || null,
      limiteHora: Number(c.rate_limit_email_sent) || null,
      confirmacionObligatoria: c.mailer_autoconfirm === false,
      altasAbiertas: c.disable_signup === false,
    };
  }

  async function resumen(ahora = Date.now()) {
    const [cuentas, registros, conf] = await Promise.allSettled([fuente.listarCuentas(ahora), registros24h(new Date(ahora)), remitente()]);
    const leer = x => x.status === 'fulfilled' ? { datos: x.value } : { error: x.reason?.message || 'sin respuesta', codigo: x.reason?.codigo || 'error' };
    return {
      cuentas: cuentas.status === 'fulfilled' ? { datos: resumirCuentas(cuentas.value.cuentas, ahora) } : leer(cuentas),
      registros: leer(registros),
      remitente: leer(conf),
    };
  }

  return { resumen };
}

module.exports = { crearCorreos, resumirCuentas, tapar, aFecha, CONSULTA };
