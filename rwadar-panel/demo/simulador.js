/* =====================================================================
   RWAdar · panel · simulador de servicios
   ---------------------------------------------------------------------
   Imita, en un solo servidor local, lo que el panel habla con fuera:
     /web         rwadar.pages.dev (portada, rutas, /android)
     /supabase    REST y Auth (incluida la API de administrador)
     /supabase-api  registros de Supabase (uso de la app)
     /cloudflare  GraphQL de Web Analytics
     /github      versiones de RWAdar-downloads y tareas de Actions
   Lo usan las pruebas y `npm run panel:demo`. Exige las mismas claves
   que el servicio real para que las pruebas cacen un panel que se las
   olvide. Todos los datos son inventados (correos @example.com).
   ===================================================================== */
'use strict';
const http = require('http');
const crypto = require('crypto');
const extra = require('./simulador-extra');

const CLAVE_SECRETA = 'sb_secret_demo_no_es_real';
const TOKEN_CLOUDFLARE = 'demo-token-cloudflare-no-es-real';
const TOKEN_SUPABASE_API = 'demo-token-registros-no-es-real';

/* Registros de Supabase: aperturas del catálogo por hora, más por la
   tarde, con la app algo por debajo de la web. Mismo formato que
   devuelve ClickHouse («2026-10-22 18:00:00»). */
function registrosUso(desde, hasta) {
  const HORA = 3600000;
  const filas = [];
  for (let t = Math.ceil(desde / HORA) * HORA; t < hasta; t += HORA) {
    const h = new Date(t).getUTCHours();
    const r = azar(Math.floor(t / HORA));
    const curva = Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2));
    const app = Math.round(curva * 9 + r() * 4);
    /* «pasarela»: cargas que llegan por /api/acceso de la web, sin saber si son app o web. */
    filas.push({ hora: new Date(t).toISOString().replace('T', ' ').slice(0, 19), app, web: Math.round(curva * 14 + r() * 6), pasarela: Math.round(curva * 6), conexiones_app: Math.max(0, app - Math.round(r() * 3)) });
  }
  return filas;
}
const DIA = 86400000;

function azar(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const NOMBRES = ['lucia', 'marcos', 'ana', 'javier', 'carmen', 'pablo', 'sara', 'diego', 'elena', 'hugo', 'irene', 'alvaro', 'nuria', 'raul', 'marta', 'ivan', 'laura', 'sergio', 'paula', 'adrian'];
const OFERTAS = ['spiko-letras-tesoro-eur', 'reental-piso-valencia', 'brickwise-local-madrid', 'aktionariat-acciones', 'midas-fondo-monetario', 'prosegur-oro-tokenizado', 'hausera-vivienda-alquiler', 'alius-credito-pyme'];
const PLATAFORMAS = ['spiko', 'reental', 'brickwise', 'aktionariat', 'midas', 'prosegur-crypto', 'hausera'];

function datosIniciales(ahora = Date.now()) {
  const r = azar(20261022);
  const cuentas = [];
  for (let i = 0; i < 38; i++) {
    const nombre = NOMBRES[i % NOMBRES.length];
    const creada = ahora - Math.floor(r() * 45 * DIA) - 3600000;
    const confirmada = r() > 0.2;
    const entro = confirmada && r() > 0.3 ? creada + Math.floor(r() * (ahora - creada)) : null;
    cuentas.push({
      id: crypto.randomUUID(), email: `${nombre}${i > 19 ? i : ''}@example.com`, created_at: new Date(creada).toISOString(),
      last_sign_in_at: entro ? new Date(entro).toISOString() : null,
      confirmation_sent_at: new Date(creada).toISOString(),
      recovery_sent_at: i % 9 === 4 ? new Date(creada + 5 * DIA < ahora ? creada + 5 * DIA : creada).toISOString() : null,
      email_confirmed_at: confirmada ? new Date(creada + 600000).toISOString() : null,
      banned_until: i === 7 ? new Date(ahora + 3650 * DIA).toISOString() : null,
      app_metadata: { provider: 'email' }, user_metadata: { nombre: r() > 0.4 ? nombre[0].toUpperCase() + nombre.slice(1) : undefined },
      is_anonymous: false,
    });
  }
  /* webCaida: las pruebas la ponen a true para ver qué dice la salud. */
  /* Interruptores para las pruebas: web caída, base sin permiso sobre el
     catálogo (como producción el 22/10) y GitHub cortando sin clave. */
  return { cuentas, webCaida: false, sinPermisoCatalogo: false, githubLimitado: false, correoRoto: false, retirado: false, motivo: null, actualizado: new Date(ahora - 5 * DIA).toISOString(), ahora };
}

function analitica(query, ahora) {
  const desde = Date.parse(query.match(/datetime_geq: "([^"]+)"/)?.[1] || new Date(ahora - 7 * DIA).toISOString());
  const hasta = Date.parse(query.match(/datetime_leq: "([^"]+)"/)?.[1] || new Date(ahora).toISOString());
  const porHora = /datetimeHour/.test(query);
  const paso = porHora ? 3600000 : DIA;
  const r = azar(Math.floor(desde / DIA));
  const serie = [];
  for (let t = Math.floor(desde / paso) * paso; t <= hasta; t += paso) {
    const d = new Date(t);
    const base = porHora ? Math.max(0, Math.round(4 * Math.sin(((d.getUTCHours() - 6) / 24) * Math.PI * 2) + 3 + r() * 3))
      : Math.round(34 + (t - desde) / DIA * 0.8 + (d.getUTCDay() % 6 === 0 ? -10 : 6) + r() * 22);
    const visits = Math.max(0, base);
    serie.push({ count: Math.round(visits * (2.1 + r() * 0.8)), sum: { visits }, dimensions: porHora ? { datetimeHour: d.toISOString().replace(/\.\d{3}Z$/, 'Z') } : { date: d.toISOString().slice(0, 10) } });
  }
  const visitas = serie.reduce((s, x) => s + x.sum.visits, 0);
  const vistas = serie.reduce((s, x) => s + x.count, 0);
  const reparto = (pares, total) => pares.map(([valor, peso]) => [valor, Math.round(total * peso)]);
  const grupos = (dim, pares, campo = 'visits') => pares.map(([valor, n]) => ({ count: campo === 'count' ? n : Math.round(n * 2.3), sum: { visits: campo === 'count' ? Math.round(n / 2.3) : n }, dimensions: { [dim]: valor } }));
  const rutas = [['/', 0.31], ...OFERTAS.map((o, i) => [`/ofertas/${o}`, 0.07 - i * 0.006]), ...PLATAFORMAS.map((p, i) => [`/plataformas/${p}`, 0.04 - i * 0.004]),
    ['/academy/', 0.06], ['/academy/que-es-tokenizar', 0.04], ['/metodologia', 0.03], ['/fuera-del-radar/toucan-protocol', 0.012], ['/para-empresas', 0.012], ['/privacidad', 0.008], ['/descargas/', 0.01]];
  return { data: { viewer: { accounts: [{
    total: [{ count: vistas, sum: { visits: visitas } }],
    serie,
    paginas: grupos('requestPath', reparto(rutas, vistas), 'count'),
    procedencia: grupos('refererHost', reparto([['', 0.46], ['www.google.com', 0.24], ['t.co', 0.09], ['www.linkedin.com', 0.08], ['github.com', 0.05], ['duckduckgo.com', 0.03], ['forocoches.com', 0.02]], visitas)),
    paises: grupos('countryName', reparto([['España', 0.71], ['México', 0.07], ['Argentina', 0.05], ['Estados Unidos', 0.04], ['Portugal', 0.03], ['Colombia', 0.03], ['Francia', 0.02]], visitas)),
    dispositivos: grupos('deviceType', reparto([['mobile', 0.64], ['desktop', 0.33], ['tablet', 0.03]], visitas)),
    navegadores: grupos('userAgentBrowser', reparto([['Chrome', 0.48], ['Mobile Safari', 0.27], ['Samsung Internet', 0.08], ['Firefox', 0.06], ['Edge', 0.06]], visitas)),
    sistemas: grupos('userAgentOS', reparto([['Android', 0.39], ['iOS', 0.29], ['Windows', 0.21], ['Mac OS X', 0.09], ['Linux', 0.02]], visitas)),
  }] } } };
}

function versiones(ahora) {
  return [['v1.4.0-rc1', 0, 3, true], ['v1.3.2', 0.4, 41], ['v1.3.1', 2, 18], ['v1.3.0', 11, 57], ['v1.2.0', 15, 88], ['v1.1.2', 22, 64], ['v1.1.0', 30, 23]]
    .map(([tag, dias, n, previa]) => ({ tag_name: tag, name: `RWAdar ${tag.slice(1)}`, published_at: new Date(ahora - dias * DIA - 7200000).toISOString(), prerelease: Boolean(previa), draft: false,
      html_url: `https://github.com/victorJorques/RWAdar-downloads/releases/tag/${tag}`, assets: [{ name: 'RWAdar.apk', download_count: n }, { name: 'SHA256SUMS.txt', download_count: 4 }] }));
}

function tareas(ahora) {
  return { total_count: 7, workflow_runs: extra.ejecuciones(ahora) };
}

/* opciones.jwks: claves públicas que servirá como si fuera Cloudflare
   Access (/access/cdn-cgi/access/certs), para probar el panel de la nube. */
function crearSimulador(opciones = {}) {
  const estado = datosIniciales();
  const enviar = (res, codigo, cuerpo, cabeceras = {}) => {
    res.writeHead(codigo, { 'Content-Type': 'application/json', ...cabeceras });
    res.end(cuerpo === undefined ? '' : JSON.stringify(cuerpo));
  };
  const secreta = req => req.headers.apikey === CLAVE_SECRETA;
  const cf = req => req.headers.authorization === `Bearer ${TOKEN_CLOUDFLARE}`;

  function web(req, res, ruta) {
    if (estado.webCaida && ruta !== '/android') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      return res.end('<h1>No disponible</h1>');
    }
    if (ruta === '/android') { res.writeHead(302, { Location: 'https://github.com/victorJorques/RWAdar-downloads/releases/latest' }); return res.end(); }
    const texto = { '/academy/': extra.paginaAcademy(), '/sitemap.xml': extra.mapaWeb('https://rwadar.pages.dev'), '/.well-known/security.txt': extra.securityTxt(estado.ahora) }[ruta];
    if (texto) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com", 'Strict-Transport-Security': 'max-age=31536000' });
      return res.end(texto);
    }
    if (['/', '/academy/', '/privacidad', '/metodologia', '/sitemap.xml', '/novedades.xml', '/sw.js', '/manifest.webmanifest'].includes(ruta)) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com", 'Strict-Transport-Security': 'max-age=31536000' });
      return res.end('<!doctype html><title>RWAdar</title>');
    }
    res.writeHead(404); res.end('no existe');
  }

  async function supabase(req, res, url, ruta, cuerpo) {
    const m = ruta.match(/^\/auth\/v1\/admin\/users\/([0-9a-f-]{36})$/);
    if (ruta === '/auth/v1/health') return enviar(res, 200, { name: 'GoTrue', version: 'demo' });
    if (ruta === '/rest/v1/catalogo_publicacion' && req.method === 'GET') return enviar(res, 200, [{ retirado: estado.retirado, motivo: estado.motivo, actualizado_el: estado.actualizado }]);
    if (/^\/rest\/v1\/catalogo_(plataformas|ofertas)_publicas_v2$/.test(ruta)) {
      return enviar(res, 200, extra.catalogoPublico(ruta.includes('plataformas') ? 'plataformas' : 'ofertas', PLATAFORMAS, OFERTAS, estado.ahora));
    }
    if (!secreta(req)) return enviar(res, 401, { message: 'Invalid API key' });
    if (ruta === '/rest/v1/catalogo_publicacion' && req.method === 'PATCH') {
      if (estado.sinPermisoCatalogo) return enviar(res, 403, { code: '42501', message: 'permission denied for table catalogo_publicacion' });
      if (url.searchParams.get('unica') === 'eq.false') return enviar(res, 200, []);
      if (url.searchParams.get('unica') !== 'eq.true') return enviar(res, 400, { message: 'falta el filtro' });
      Object.assign(estado, { retirado: cuerpo.retirado === true, motivo: cuerpo.motivo ?? null, actualizado: cuerpo.actualizado_el });
      return enviar(res, 200, [{ unica: true, retirado: estado.retirado, motivo: estado.motivo }]);
    }
    if (ruta === '/rest/v1/perfiles') return enviar(res, 200, estado.cuentas.map(c => ({ id: c.id, nombre: c.user_metadata.nombre || null, avisos_correo: true })));
    if (ruta === '/rest/v1/vigilancia') return enviar(res, 200, estado.cuentas.flatMap(c => Array.from({ length: parseInt(c.id[0], 16) % 4 }, () => ({ usuario_id: c.id }))));
    if (ruta === '/auth/v1/admin/users') {
      const pagina = Number(url.searchParams.get('page') || 1), por = Number(url.searchParams.get('per_page') || 50);
      return enviar(res, 200, { users: estado.cuentas.slice((pagina - 1) * por, pagina * por), aud: 'authenticated' });
    }
    if (m) {
      const i = estado.cuentas.findIndex(c => c.id === m[1]);
      if (i < 0) return enviar(res, 404, { msg: 'User not found' });
      if (req.method === 'GET') return enviar(res, 200, estado.cuentas[i]);
      if (req.method === 'DELETE') { estado.cuentas.splice(i, 1); return enviar(res, 200, {}); }
      if (req.method === 'PUT') {
        const c = estado.cuentas[i];
        if (cuerpo.ban_duration) c.banned_until = cuerpo.ban_duration === 'none' ? null : new Date(Date.now() + 3650 * DIA).toISOString();
        if (cuerpo.email_confirm) c.email_confirmed_at = new Date().toISOString();
        return enviar(res, 200, c);
      }
    }
    return enviar(res, 404, { message: 'no existe' });
  }

  function cloudflare(req, res, url, ruta, cuerpo) {
    if (!cf(req)) return enviar(res, 403, { success: false, errors: [{ code: 10000, message: 'Authentication error' }] });
    if (ruta === '/graphql') {
      const query = String(cuerpo.query || '');
      if (query.includes('rumWebVitalsEventsAdaptiveGroups')) return enviar(res, 200, extra.velocidadCf());
      if (query.includes('workersInvocationsAdaptive')) return enviar(res, 200, extra.usoCf());
      return enviar(res, 200, analitica(query, Date.now()));
    }
    /* La clave del simulador no tiene fecha de caducidad, como la real. */
    if (ruta === '/user/tokens/verify') return enviar(res, 200, { success: true, result: { id: 'demo', status: 'active' } });
    return enviar(res, 404, { success: false, errors: [{ message: 'no existe' }] });
  }

  function github(req, res, ruta) {
    if (estado.githubLimitado && !req.headers.authorization) return enviar(res, 403, { message: 'API rate limit exceeded for 104.22.136.70.' });
    if (ruta === '/repos/victorJorques/RWAdar-downloads/releases') return enviar(res, 200, versiones(estado.ahora));
    if (ruta === '/repos/victorJorques/RWADAR/actions/runs') return enviar(res, 200, tareas(estado.ahora));
    const trabajos = ruta.match(/^\/repos\/victorJorques\/RWADAR\/actions\/runs\/(\d+)\/jobs$/);
    if (trabajos) return enviar(res, 200, extra.trabajos(trabajos[1], estado.ahora) || { total_count: 0, jobs: [] });
    if (ruta === '/rate_limit') {
      const caduca = req.headers.authorization ? { 'github-authentication-token-expiration': new Date(estado.ahora + 40 * DIA).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' } : {};
      return enviar(res, 200, { resources: {} }, caduca);
    }
    return enviar(res, 404, { message: 'Not Found' });
  }

  const servidor = http.createServer((req, res) => {
    const trozos = [];
    req.on('data', t => trozos.push(t));
    req.on('end', async () => {
      let cuerpo = {};
      try { cuerpo = trozos.length ? JSON.parse(Buffer.concat(trozos).toString('utf8')) : {}; } catch { return enviar(res, 400, { message: 'JSON roto' }); }
      const url = new URL(req.url, 'http://simulador');
      const [, servicio, ...resto] = url.pathname.split('/');
      const ruta = `/${resto.join('/')}`;
      if (servicio === 'web') return web(req, res, ruta);
      if (servicio === 'supabase') return supabase(req, res, url, ruta, cuerpo);
      if (servicio === 'cloudflare') return cloudflare(req, res, url, ruta, cuerpo);
      if (servicio === 'github') return github(req, res, ruta);
      if (servicio === 'access' && ruta === '/cdn-cgi/access/certs') return enviar(res, 200, { keys: opciones.jwks || [] });
      if (servicio === 'supabase-api' && req.headers.authorization !== `Bearer ${TOKEN_SUPABASE_API}`) return enviar(res, 401, { message: 'Unauthorized' });
      if (servicio === 'supabase-api' && ruta === '/v1/projects/simulado/analytics/endpoints/logs') {
        const desde = Date.parse(url.searchParams.get('iso_timestamp_start')), hasta = Date.parse(url.searchParams.get('iso_timestamp_end'));
        if (!(hasta > desde) || hasta - desde > 24 * 3600000) return enviar(res, 400, { message: 'Time range must be no more than 24 hours' });
        const sql = url.searchParams.get('sql') || '';
        if (!/FROM logs/.test(sql)) return enviar(res, 200, { result: [], error: 'Unknown table' });
        if (sql.includes("'auth_logs'")) return enviar(res, 200, extra.registrosCorreo(estado.correoRoto));
        return enviar(res, 200, { result: registrosUso(desde, hasta) });
      }
      if (servicio === 'supabase-api') {
        const respuesta = extra.supabaseApi(ruta, estado.ahora);
        return respuesta ? enviar(res, 200, respuesta) : enviar(res, 404, { message: 'Cannot GET ' + ruta });
      }
      return enviar(res, 404, { message: 'servicio desconocido' });
    });
  });
  return { servidor, estado };
}

/* Variables para que el panel hable con el simulador y no con producción. */
function entornoPanel(base) {
  return {
    RWADAR_PANEL_DEMO: '1',
    RWADAR_PANEL_WEB: `${base}/web`,
    RWADAR_PANEL_SUPABASE: `${base}/supabase`,
    RWADAR_PANEL_CLOUDFLARE_API: `${base}/cloudflare`,
    RWADAR_PANEL_GITHUB_API: `${base}/github`,
    CLOUDFLARE_API_TOKEN: TOKEN_CLOUDFLARE,
    RWADAR_PANEL_SUPABASE_API: `${base}/supabase-api`,
    SUPABASE_ACCESS_TOKEN: TOKEN_SUPABASE_API,
    SUPABASE_SECRET_KEY: CLAVE_SECRETA,
  };
}

module.exports = { crearSimulador, entornoPanel, CLAVE_SECRETA, TOKEN_CLOUDFLARE };
