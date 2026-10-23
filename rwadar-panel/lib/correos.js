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
const RUTAS = { '/signup': 'altas', '/resend': 'reenvios', '/recover': 'recuperaciones', '/otp': 'otp', '/verify': 'verificaciones' };
const tapar = texto => String(texto || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<correo>').replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, '<ip>').slice(0, 200);

const CONSULTA = `SELECT log_attributes['path'] AS ruta, log_attributes['status'] AS estado, log_attributes['level'] AS nivel,
  if(log_attributes['level'] = 'error', log_attributes['msg'], '') AS error, count() AS n
FROM logs
WHERE source = 'auth_logs' AND (log_attributes['path'] IN ('/signup', '/resend', '/recover', '/otp', '/verify') OR log_attributes['level'] = 'error')
GROUP BY ruta, estado, nivel, error`;

/* De la lista de cuentas: altas, confirmaciones y posibles correos perdidos. */
function resumirCuentas(cuentas, ahora = Date.now()) {
  const desde = ahora - 30 * DIA_MS;
  const recientes = cuentas.filter(c => c.correoAltaEnviado && new Date(c.correoAltaEnviado).getTime() >= desde);
  const sinConfirmar24h = recientes.filter(c => !c.confirmada && ahora - new Date(c.correoAltaEnviado).getTime() > DIA_MS);
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
  const ref = () => config.supabaseApi !== 'https://api.supabase.com' ? 'simulado' : (config.supabase.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co$/) || [])[1];
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
    const resultado = { altas: 0, reenvios: 0, recuperaciones: 0, otp: 0, verificaciones: 0, rechazadas: 0, frenadas: 0, errores: 0, ultimosErrores: [] };
    for (const f of r.datos?.result || []) {
      const n = Number(f.n) || 0;
      const clave = RUTAS[f.ruta];
      if (clave) resultado[clave] += n;
      if (clave && Number(f.estado) >= 400) resultado.rechazadas += n;
      /* 429: Supabase no manda el correo porque se pasó del límite por hora. */
      if (clave && Number(f.estado) === 429) resultado.frenadas += n;
      if (f.nivel === 'error') {
        resultado.errores += n;
        if (f.error) resultado.ultimosErrores.push({ mensaje: tapar(f.error), veces: n });
      }
    }
    resultado.ultimosErrores.sort((a, b) => b.veces - a.veces).splice(5);
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

module.exports = { crearCorreos, resumirCuentas, CONSULTA };
