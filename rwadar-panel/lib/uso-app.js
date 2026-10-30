/* =====================================================================
   RWAdar · panel · uso de la app (y de la web) según Supabase
   ---------------------------------------------------------------------
   La app no lleva analítica. Pero cada vez que se abre y carga el
   catálogo pide a Supabase la orden `catalogo_publicacion`, y la web
   también. Supabase apunta esas peticiones en sus registros, así que
   contándolas se sabe cuántas veces se abrió el catálogo desde la app
   y desde la web, hora a hora, sin cambiar la app.

   La app usa la librería oficial (cabecera x-client-info con
   «react-native», y en Android el motor okhttp); la web pide con fetch
   desde un navegador. «Conexiones distintas» cuenta direcciones de red
   distintas dentro de la consulta: no se guarda ninguna.

   Necesita SUPABASE_ACCESS_TOKEN (token de la API de administración con
   permiso de lectura de registros). Supabase solo deja consultar 24 h
   de golpe; el historial lo va guardando el panel de la nube cada hora.
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedir, mensajeRemoto } = require('./pedir');

const REF = /^https:\/\/([a-z0-9]{20})\.supabase\.co$/;
const HORA_MS = 3600000;

/* Comprobado contra la base real el 22/10/2026: la tabla es `logs`, la
   fuente va en `source` y los detalles en el mapa `log_attributes`
   (una clave que no existe devuelve texto vacío, no un error). */
const AGENTE = "log_attributes['request.headers.user_agent']";
const ES_APP = `(log_attributes['request.headers.x_client_info'] ILIKE '%react-native%' OR ${AGENTE} ILIKE 'okhttp%')`;
const ES_WEB = `(NOT ${ES_APP} AND ${AGENTE} ILIKE 'mozilla%')`;
const IP = "if(log_attributes['request.headers.cf_connecting_ip'] != '', log_attributes['request.headers.cf_connecting_ip'], log_attributes['request.headers.x_real_ip'])";

/* Desde la 1.4.1 (29/10/2026) la web, y con ella la app, piden el catálogo
   a través de rwadar.pages.dev (/api/acceso/catalogo/…, rwadar-acceso/
   servidor.mjs), que llama a Supabase sin agente: esas cargas llegan con el
   agente vacío y ya no se sabe si son de la app o de la web («pasarela»).
   El propio panel pide con agente «node» y no cuenta en ninguna. */
const CONSULTA = `SELECT toStartOfHour(timestamp) AS hora,
  countIf(${ES_APP}) AS app,
  countIf(${ES_WEB}) AS web,
  countIf(${AGENTE} = '') AS pasarela,
  uniqExactIf(${IP}, ${ES_APP} AND ${IP} != '') AS conexiones_app
FROM logs
WHERE source = 'edge_logs' AND log_attributes['request.path'] LIKE '%/rest/v1/catalogo_publicacion%'
GROUP BY hora ORDER BY hora`;

function isoMinuto(fecha) { return new Date(Math.floor(fecha.getTime() / 60000) * 60000).toISOString(); }

/* ClickHouse puede devolver la hora como texto («2026-10-22 18:00:00»)
   o como número (segundos, milisegundos o microsegundos). */
function aFecha(valor) {
  if (typeof valor === 'number' || /^\d+$/.test(String(valor))) {
    const n = Number(valor);
    return new Date(n > 1e14 ? n / 1000 : n > 1e11 ? n : n * 1000);
  }
  const texto = String(valor).trim().replace(' ', 'T');
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(texto) ? texto : `${texto}Z`);
}

function crearUsoApp(config) {
  function refProyecto() {
    if (config.supabaseApi !== 'https://api.supabase.com') return 'simulado';
    const m = config.supabase.match(REF);
    if (!m) throw new ErrorPanel('No reconozco el proyecto de Supabase', { estado: 500 });
    return m[1];
  }

  async function consultar(desde, hasta) {
    if (!config.supabaseAccessToken) throw new FaltaCredencial('Supabase (registros)', 'ver el uso de la app');
    const q = new URLSearchParams({ sql: CONSULTA, iso_timestamp_start: isoMinuto(desde), iso_timestamp_end: isoMinuto(hasta) });
    /* Suele tardar 2-3 s, pero a veces Supabase va lento: 25 s de margen. */
    const r = await pedir(`${config.supabaseApi}/v1/projects/${refProyecto()}/analytics/endpoints/logs?${q}`, {
      headers: { Authorization: `Bearer ${config.supabaseAccessToken}` }, espera: 25000,
    });
    /* Supabase frena las consultas de registros seguidas. */
    if (r.estado === 429) throw new ErrorPanel('Supabase pide esperar un minuto antes de volver a consultar sus registros', { estado: 503, codigo: 'espera' });
    if (!r.ok) throw new ErrorPanel(`api.supabase.com respondió ${r.estado}: ${mensajeRemoto(r.datos, r.texto)}`, { estado: 502 });
    if (r.datos?.error) {
      const e = typeof r.datos.error === 'string' ? r.datos.error : r.datos.error.message || JSON.stringify(r.datos.error);
      throw new ErrorPanel(`Supabase no aceptó la consulta de registros: ${String(e).slice(0, 200)}`, { estado: 502 });
    }
    return (Array.isArray(r.datos?.result) ? r.datos.result : []).filter(Boolean).map(f => ({
      hora: new Date(Math.floor(aFecha(f.hora).getTime() / HORA_MS) * HORA_MS).toISOString(),
      app: Number(f.app) || 0,
      web: Number(f.web) || 0,
      pasarela: Number(f.pasarela) || 0,
      conexionesApp: Number(f.conexiones_app) || 0,
    }));
  }

  /* Las últimas 24 horas, hora a hora, con las horas vacías a cero. */
  async function ultimas24h(ahora = new Date()) {
    const hasta = new Date(ahora);
    const desde = new Date(hasta.getTime() - 24 * HORA_MS);
    const filas = new Map((await consultar(desde, hasta)).map(f => [f.hora, f]));
    const serie = [];
    for (let t = Math.floor(desde.getTime() / HORA_MS) * HORA_MS + HORA_MS; t <= hasta.getTime(); t += HORA_MS) {
      const hora = new Date(t).toISOString();
      serie.push(filas.get(hora) || { hora, app: 0, web: 0, pasarela: 0, conexionesApp: 0 });
    }
    const suma = clave => serie.reduce((s, f) => s + (f[clave] || 0), 0);
    return { serie, app: suma('app'), web: suma('web'), pasarela: suma('pasarela'), conexionesApp: Math.max(0, ...serie.map(f => f.conexionesApp)) };
  }

  /* La hora que acaba de terminar, para el historial (la llama el
     cron del panel de la nube cada hora). */
  async function horaAnterior(ahora = new Date()) {
    const fin = new Date(Math.floor(ahora.getTime() / HORA_MS) * HORA_MS);
    const inicio = new Date(fin.getTime() - HORA_MS);
    const [fila] = await consultar(inicio, fin);
    return fila || { hora: inicio.toISOString(), app: 0, web: 0, pasarela: 0, conexionesApp: 0 };
  }

  return { ultimas24h, horaAnterior };
}

module.exports = { crearUsoApp, aFecha, CONSULTA };
