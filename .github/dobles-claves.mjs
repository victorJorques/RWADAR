/* =====================================================================
   RWAdar · dobles de Cloudflare, Lettermint y Supabase (SOLO PRUEBAS)
   ---------------------------------------------------------------------
   Lo carga .github/claves.test.mjs con `node --import` delante de
   rwadar-app/dominio-correo.mjs y rwadar-app/supabase-gestion.mjs: cambia el
   fetch global por uno que nunca sale a la red y contesta como las APIs de
   verdad (formas de sus referencias oficiales: Team API de Lettermint,
   Cloudflare v4 y Management API de Supabase), guardando su estado en
   $DOBLE_DIR/estado.json entre una ejecución y la siguiente.

   Cada petición se apunta en $DOBLE_DIR/peticiones.jsonl con la cabecera de
   autorización reducida a una huella y los tokens que ha creado el doble
   tapados ([token:huella]). Nada de esto lee ni escribe fuera de $DOBLE_DIR.
   ===================================================================== */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.env.DOBLE_DIR;
if (!DIR) throw new Error('dobles-claves: falta DOBLE_DIR');
const ESTADO = path.join(DIR, 'estado.json');
const PETICIONES = path.join(DIR, 'peticiones.jsonl');
export const huellaDoble = (v) => crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);
const ahora = () => '2026-11-08T10:00:00.000000Z';

/* Sin esperas reales en los reintentos. */
const esperaReal = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...a) => esperaReal(fn, Math.min(Number(ms) || 0, 5), ...a);

function tapar(valor, tokens) {
  if (typeof valor === 'string') {
    let v = valor;
    for (const t of tokens) if (t && v.includes(t)) v = v.split(t).join(`[token:${huellaDoble(t)}]`);
    return v;
  }
  if (Array.isArray(valor)) return valor.map((x) => tapar(x, tokens));
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, x]) => [k, tapar(x, tokens)]));
  return valor;
}
const paginar = (lista) => ({ data: lista, path: null, per_page: 100, next_cursor: null, next_page_url: null, prev_cursor: null, prev_page_url: null });
const nombreDNS = (n) => String(n ?? '').trim().toLowerCase().replace(/\.$/, '');
const textoTXT = (c) => {
  const t = String(c ?? '').trim();
  if (/^".*"$/s.test(t)) return [...t.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join('');
  return t;
};

/* ---------------------------------------------------------------- Lettermint */
function lettermint(e, metodo, u, cab, cuerpo) {
  const lm = e.lm;
  if (cab.authorization !== `Bearer ${lm.clave}`) return [401, { message: 'Unauthenticated.' }];
  const ruta = u.pathname.replace(/^\/v1/, '');
  const sinPermiso = (lm.sinPermiso || []).find((p) => new RegExp(p).test(`${metodo} ${ruta}`));
  if (sinPermiso) return [403, { error: { code: 'ABILITY_NOT_HELD', message: 'The team API token does not have the required ability.' } }];
  const proyecto = (id) => lm.proyectos.find((p) => p.id === id);
  const dominio = (id) => lm.dominios.find((d) => d.id === id);
  const ruta1 = (id) => lm.rutas.find((r) => r.id === id);
  const datosDominio = (d, incluir) => ({
    id: d.id, domain: d.domain, status: d.status, dkim_mode: 'managed_cname', rotation_ready: false, status_changed_at: null, created_at: ahora(),
    ...(incluir.includes('dnsRecords') ? { dns_records: d.dns_records } : {}),
    ...(incluir.includes('projects') ? { projects: d.project_ids.map((id) => ({ id, name: proyecto(id)?.name || '?' })) } : {}),
  });
  const datosRuta = (r) => {
    const s = { ...r.settings };
    if (!lm.seguimientoDisponible) { delete s.track_opens; delete s.track_clicks; }
    if (!lm.desuscripcionDisponible || r.route_type !== 'broadcast') delete s.disable_hosted_unsubscribe;
    return { id: r.id, project_id: r.project_id, slug: r.slug, name: r.name, route_type: r.route_type, is_default: r.is_default, settings: s, created_at: ahora(), updated_at: ahora() };
  };
  const datosProyecto = (p) => ({ id: p.id, name: p.name, delivery_mode: p.delivery_mode, smtp_enabled: p.smtp_enabled, redact_email_content: false,
    default_route_id: null, token_generated_at: null, token_last_used_at: null, token_last_used_ip: null, created_at: ahora(), updated_at: ahora() });
  let m;
  if (metodo === 'GET' && ruta === '/team') {
    return [200, { id: 'equipo-1', name: 'RWAdar', type: 'personal', plan: lm.equipo.plan, included_volume: 300, tier: 300, verified_at: lm.equipo.verified_at, created_at: ahora() }];
  }
  if (metodo === 'GET' && ruta === '/projects') {
    const busca = (u.searchParams.get('filter[search]') || '').toLowerCase();
    return [200, paginar(lm.proyectos.filter((p) => p.name.toLowerCase().includes(busca)).map((p) => ({ ...datosProyecto(p), routes_count: 2, domains_count: 0, last_28_days: {} })))];
  }
  if ((m = /^\/projects\/([^/]+)$/.exec(ruta))) {
    const p = proyecto(m[1]);
    if (!p) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    if (metodo === 'GET') return [200, datosProyecto(p)];
    if (metodo === 'PUT') { if (typeof cuerpo?.smtp_enabled === 'boolean') p.smtp_enabled = cuerpo.smtp_enabled; return [200, { data: datosProyecto(p), message: 'Project updated.' }]; }
  }
  if (metodo === 'GET' && (m = /^\/projects\/([^/]+)\/routes$/.exec(ruta))) {
    return [200, paginar(lm.rutas.filter((r) => r.project_id === m[1]).map((r) => ({ id: r.id, slug: r.slug, name: r.name, route_type: r.route_type, is_default: r.is_default })))];
  }
  if ((m = /^\/routes\/([^/]+)$/.exec(ruta))) {
    const r = ruta1(m[1]);
    if (!r) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    if (metodo === 'GET') return [200, datosRuta(r)];
    if (metodo === 'PUT') {
      const s = cuerpo?.settings || {};
      if (('track_opens' in s || 'track_clicks' in s) && !lm.seguimientoDisponible) {
        return [422, { message: 'Email tracking is available on paid plans.', errors: { 'settings.track_opens': ['Requires email tracking access.'] } }];
      }
      if ('disable_hosted_unsubscribe' in s && !lm.desuscripcionDisponible) {
        return [422, { message: 'Disabling hosted unsubscribe is not enabled for this team.', errors: { 'settings.disable_hosted_unsubscribe': ['Not available.'] } }];
      }
      Object.assign(r.settings, s);
      return [200, { data: datosRuta(r), message: 'Route updated.' }];
    }
  }
  if (metodo === 'GET' && ruta === '/domains') {
    const busca = (u.searchParams.get('filter[domain]') || '').toLowerCase();
    return [200, paginar(lm.dominios.filter((d) => d.domain.includes(busca)).map((d) => ({ id: d.id, domain: d.domain, status: d.status, dkim_mode: 'managed_cname', status_changed_at: null, created_at: ahora() })))];
  }
  if (metodo === 'POST' && ruta === '/domains') {
    if (lm.dominios.some((d) => d.domain === cuerpo?.domain)) return [422, { message: 'The domain has already been taken.', errors: { domain: ['taken'] } }];
    const d = { id: `dom-${lm.dominios.length + 1}`, domain: cuerpo.domain, status: 'pending_verification', project_ids: [],
      dns_records: (lm.registrosAlCrear || []).map((r, i) => ({ id: `reg-${i + 1}`, status: 'pending', verified_at: null, last_checked_at: null,
        required_for_verification: r.verification_scope === 'required', ...r })) };
    lm.dominios.push(d);
    return [201, datosDominio(d, ['dnsRecords'])];
  }
  if ((m = /^\/domains\/([^/]+)$/.exec(ruta)) && metodo === 'GET') {
    const d = dominio(m[1]);
    if (!d) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    return [200, datosDominio(d, (u.searchParams.get('include') || '').split(','))];
  }
  if ((m = /^\/domains\/([^/]+)\/projects$/.exec(ruta)) && metodo === 'PUT') {
    const d = dominio(m[1]);
    if (!d) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    if (!Array.isArray(cuerpo?.project_ids) || !cuerpo.project_ids.length || cuerpo.project_ids.some((id) => !proyecto(id))) {
      return [422, { error: { code: 'INVALID_PROJECT_IDS', message: 'Invalid project ids' } }];
    }
    d.project_ids = cuerpo.project_ids;
    return [200, { data: datosDominio(d, ['projects']), message: 'Domain projects updated.' }];
  }
  if ((m = /^\/domains\/([^/]+)\/dns-records\/verify$/.exec(ruta)) && metodo === 'POST') {
    const d = dominio(m[1]);
    if (!d) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    // Un registro sale verificado si Cloudflare tiene uno igual (y el CNAME sin proxy).
    for (const r of d.dns_records) {
      const nombre = nombreDNS(r.fqdn);
      const igual = e.cf.registros.some((c) => nombreDNS(c.name) === nombre && c.type === r.type && !c.proxied
        && (r.type === 'TXT' ? textoTXT(c.content) === r.content : nombreDNS(c.content) === nombreDNS(r.content)));
      r.status = igual ? 'active' : 'failed';
    }
    const necesarios = d.dns_records.filter((r) => r.verification_scope === 'required');
    const fallan = necesarios.filter((r) => r.status !== 'active');
    d.status = !fallan.length ? 'verified' : (fallan.length < necesarios.length ? 'partially_verified' : 'failed_verification');
    if (!fallan.length) return [200, { message: 'All required DNS records are verified.', recommended_failed_records: [] }];
    return [422, { message: 'One or more required DNS records failed verification.', failed_records: fallan.map((r) => ({ id: r.id, type: r.type, name: r.hostname })),
      errors: fallan.map((r) => ({ record_id: r.id, error: 'Record not found' })), failed_count: fallan.length, total_count: necesarios.length }];
  }
  if ((m = /^\/projects\/([^/]+)\/api-tokens$/.exec(ruta))) {
    const p = proyecto(m[1]);
    if (!p) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    const sinValor = ({ token, ...resto }) => resto;
    if (metodo === 'GET') return [200, paginar(lm.tokens.filter((t) => t.project_id === p.id).map(sinValor))];
    if (metodo === 'POST') {
      const token = lm.tokenRaro || `lm_doble_${crypto.randomBytes(18).toString('hex')}`;
      const t = { id: `tok-${++lm.contador}`, project_id: p.id, name: cuerpo.name, short_token: false, created_via: 'api', allowed_ips: [], last_used_at: null, created_at: ahora(), token };
      lm.tokens.push(t);
      lm.historial.push(token);
      return [201, { data: t, smtp: p.smtp_enabled ? (lm.smtpRespuesta || { host: 'smtp.lettermint.co', ports: [465, 587], username: 'lettermint' }) : null, message: 'Project API token created.' }];
    }
  }
  if ((m = /^\/projects\/([^/]+)\/api-tokens\/([^/]+)$/.exec(ruta)) && metodo === 'DELETE') {
    const i = lm.tokens.findIndex((t) => t.project_id === m[1] && t.id === m[2]);
    if (i < 0) return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } }];
    lm.tokens.splice(i, 1);
    return [200, { message: 'Project API token deleted.' }];
  }
  return [404, { error: { code: 'RESOURCE_NOT_FOUND', message: `doble: ${metodo} ${ruta} no previsto` } }];
}

/* ---------------------------------------------------------------- Cloudflare */
function cloudflare(e, metodo, u, cab, cuerpo) {
  const cf = e.cf;
  const sobre = (result, extra = {}) => ({ success: true, errors: [], messages: [], result, ...extra });
  const error = (estado, code, message) => [estado, { success: false, errors: [{ code, message }], messages: [], result: null }];
  if (cab.authorization !== `Bearer ${cf.clave}`) return error(401, 10000, 'Authentication error');
  const ruta = u.pathname.replace(/^\/client\/v4/, '');
  let m;
  if (metodo === 'GET' && ruta === '/zones') {
    const z = cf.zonas.filter((x) => x.name === u.searchParams.get('name'));
    return [200, sobre(z, { result_info: { page: 1, per_page: 20, count: z.length, total_count: z.length, total_pages: 1 } })];
  }
  if ((m = /^\/zones\/([^/]+)\/dns_records$/.exec(ruta))) {
    if (!cf.zonas.some((z) => z.id === m[1])) return error(404, 7003, 'Could not route to /zones/x/dns_records');
    if (metodo === 'GET') {
      const pagina = Number(u.searchParams.get('page') || 1), porPagina = Number(u.searchParams.get('per_page') || 100);
      const lote = cf.registros.slice((pagina - 1) * porPagina, pagina * porPagina);
      return [200, sobre(lote, { result_info: { page: pagina, per_page: porPagina, count: lote.length, total_count: cf.registros.length, total_pages: Math.max(1, Math.ceil(cf.registros.length / porPagina)) } })];
    }
    if (metodo === 'POST') {
      if (cf.crearFalla) return error(400, 9005, 'Content for CNAME record is invalid.');
      const nombre = nombreDNS(cuerpo.name);
      const mismos = cf.registros.filter((r) => nombreDNS(r.name) === nombre);
      if ((cuerpo.type === 'CNAME' && mismos.length) || mismos.some((r) => r.type === 'CNAME')) return error(400, 81053, 'An A, AAAA, or CNAME record with that host already exists.');
      if (mismos.some((r) => r.type === cuerpo.type && r.content === cuerpo.content)) return error(400, 81058, 'An identical record already exists.');
      const r = { id: `cf-${++cf.contador}`, name: nombre, type: cuerpo.type, content: cuerpo.content, proxied: cuerpo.proxied === true, ttl: cuerpo.ttl, comment: cuerpo.comment, ...(cuerpo.priority !== undefined ? { priority: cuerpo.priority } : {}) };
      cf.registros.push(r);
      return [200, sobre(r)];
    }
  }
  return error(404, 7000, `doble: ${metodo} ${ruta} no previsto`);
}

/* ---------------------------------------------------------------- Supabase */
function supabase(e, metodo, u, cab, cuerpo) {
  const s = e.supa;
  if (cab.authorization !== `Bearer ${s.clave}`) return [401, { message: 'Unauthorized' }];
  const base = `/v1/projects/${s.ref}`;
  if (metodo === 'GET' && u.pathname === base) return [200, s.proyecto];
  if (metodo === 'GET' && u.pathname === `${base}/upgrade/eligibility`) return s.elegibilidad ? [200, s.elegibilidad] : [404, { message: 'Not found' }];
  if (u.pathname === `${base}/config/auth`) {
    if (metodo === 'GET') return [200, s.auth];
    if (metodo === 'PATCH') {
      if (s.patchFalla) return [s.patchFalla, { message: 'Failed to update auth config' }];
      Object.assign(s.auth, cuerpo);
      return [200, s.auth];
    }
  }
  return [404, { message: `doble: ${metodo} ${u.pathname} no previsto` }];
}
function authPublica(e, metodo, u, cab, cuerpo) {
  if (metodo === 'POST' && u.pathname === '/auth/v1/recover') {
    if (!/^sb_publishable_/.test(cab.apikey || '')) return [401, { message: 'Invalid API key' }];
    e.supa.recuperaciones.push(cuerpo?.email);
    return [e.supa.recuperar || 200, {}];
  }
  return [404, { message: 'no previsto' }];
}

globalThis.fetch = async (url, op = {}) => {
  const e = JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
  const u = new URL(String(url));
  const metodo = String(op.method || 'GET').toUpperCase();
  const cab = Object.fromEntries(Object.entries(op.headers || {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
  let cuerpo = null;
  try { cuerpo = op.body ? JSON.parse(op.body) : null; } catch { cuerpo = op.body; }
  const tokens = e.lm.historial;
  fs.appendFileSync(PETICIONES, `${JSON.stringify({ host: u.host, metodo, ruta: u.pathname, consulta: u.search,
    auth: cab.authorization ? huellaDoble(cab.authorization) : '', apikey: cab.apikey ? 'si' : '', cuerpo: tapar(cuerpo, tokens) })}\n`);
  // Orden común con el doble de psql, para ver qué pasa antes que qué.
  fs.appendFileSync(path.join(DIR, 'orden.log'), `http ${metodo} ${u.host}${u.pathname}\n`);
  if (u.protocol !== 'https:') return new Response('solo https', { status: 400 });
  const fallo = (e.fallos || []).find((f) => f.veces > 0 && f.host === u.host && f.metodo === metodo && new RegExp(f.ruta).test(u.pathname));
  let r;
  if (fallo) { fallo.veces--; r = [fallo.estado, fallo.cuerpo || { message: 'Fallo simulado' }]; }
  else if (u.host === 'api.lettermint.co') r = lettermint(e, metodo, u, cab, cuerpo);
  else if (u.host === 'api.cloudflare.com') r = cloudflare(e, metodo, u, cab, cuerpo);
  else if (u.host === 'api.supabase.com') r = supabase(e, metodo, u, cab, cuerpo);
  else if (u.host === `${e.supa.ref}.supabase.co`) r = authPublica(e, metodo, u, cab, cuerpo);
  else if (u.host === 'rwadar.pages.dev' && u.pathname === '/privacidad') r = [200, e.web.privacidad];
  else throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
  fs.writeFileSync(ESTADO, JSON.stringify(e, null, 1));
  if (r[0] === 0) throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
  const texto = typeof r[1] === 'string' ? r[1] : JSON.stringify(r[1]);
  return new Response(texto, { status: r[0], headers: { 'content-type': typeof r[1] === 'string' ? 'text/html' : 'application/json' } });
};
