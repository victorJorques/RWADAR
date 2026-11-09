#!/usr/bin/env node
/* =====================================================================
   RWAdar · números de la web y de la app (09/11/2026)
   ---------------------------------------------------------------------
   Solo lee y solo saca TOTALES: nunca un correo, un identificador ni una
   IP. Lo usa el flujo «Números de RWAdar» (.github/workflows/numeros.yml).

   1. Cuentas: de SUPABASE_DB_URL, en una transacción de solo lectura que
      se deshace al final (recuentos de auth.users y de los avisos).
   2. Descargas del APK: API pública de las releases de RWAdar-downloads.
   3. Visitas de la web: Cloudflare Web Analytics, solo si existe el secreto
      opcional CLOUDFLARE_ANALITICA_TOKEN (solo lectura de analítica). Sin él,
      el informe da el enlace del panel.

   Escribe el informe en Markdown en la salida estándar, en
   GITHUB_STEP_SUMMARY si existe y en el archivo de --salida si se pide.
   Pruebas: node --test .github/numeros.test.mjs
   ===================================================================== */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const RELEASES = 'https://api.github.com/repos/victorJorques/RWAdar-downloads/releases?per_page=100';
export const CLOUDFLARE_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';
export const CUENTA_CLOUDFLARE = '52d07be006e7a27f5f793c59e1796b13';
export const SITIO_ANALITICA = 'ddbd2a3f31ab43dfaf0c854a02ab34d8';
export const PANEL = `https://dash.cloudflare.com/${CUENTA_CLOUDFLARE}/web-analytics/overview?siteTag~in=${SITIO_ANALITICA}&excludeBots=Yes`;

/* Solo recuentos. Las tablas con protección forzada (FORCE RLS) solo se
   cuentan si el usuario puede saltársela; si no, sale null y el informe lo
   dice, en vez de dar un 0 que no es verdad. */
export const CONSULTA = `begin transaction read only;
select json_build_object(
  'cuentas', (select count(*) from auth.users where coalesce(is_anonymous, false) = false),
  'confirmadas', (select count(*) from auth.users where email_confirmed_at is not null and coalesce(is_anonymous, false) = false),
  'nuevas_7', (select count(*) from auth.users where created_at > now() - interval '7 days' and coalesce(is_anonymous, false) = false),
  'nuevas_30', (select count(*) from auth.users where created_at > now() - interval '30 days' and coalesce(is_anonymous, false) = false),
  'entraron_7', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
  'entraron_30', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
  'salta_rls', (select rolsuper or rolbypassrls from pg_roles where rolname = current_user),
  'avisos_correo', (select case when (select rolsuper or rolbypassrls from pg_roles where rolname = current_user)
                              or pg_has_role(current_user, (select relowner from pg_class where oid = 'rwadar_novedades.preferencias'::regclass), 'USAGE')
                           then (select count(*) from rwadar_novedades.preferencias where novedades and baja_el is null) end),
  'con_cartera', (select case when (select rolsuper or rolbypassrls from pg_roles where rolname = current_user)
                         then (select count(*) from rwadar_cuentas_privadas.carteras) end)
);
rollback;`;

const NUMERO = v => (Number.isInteger(v) && v >= 0 ? v : null);

export function leerCuentas(salida) {
  const linea = String(salida).split('\n').map(l => l.trim()).find(l => l.startsWith('{') && l.endsWith('}'));
  if (!linea) throw new Error('la base no devolvió los recuentos');
  const d = JSON.parse(linea);
  const r = {};
  for (const k of ['cuentas', 'confirmadas', 'nuevas_7', 'nuevas_30', 'entraron_7', 'entraron_30', 'avisos_correo', 'con_cartera']) r[k] = NUMERO(d[k]);
  if (r.cuentas === null) throw new Error('la base devolvió algo que no es un recuento');
  return r;
}

export function psqlReal(dbUrl, sql) {
  const r = spawnSync('psql', [dbUrl, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8', timeout: 60000,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, PGSSLMODE: process.env.PGSSLMODE === 'verify-full' ? 'verify-full' : 'require', PGCONNECT_TIMEOUT: '15' },
  });
  return { codigo: r.status ?? 1, salida: r.stdout || '', error: r.error ? String(r.error.message) : (r.stderr || '') };
}

export async function contarCuentas({ dbUrl, ejecutarPsql = psqlReal }) {
  if (!dbUrl) return { error: 'falta el secreto SUPABASE_DB_URL' };
  const r = ejecutarPsql(dbUrl, CONSULTA);
  // El mensaje de psql puede llevar la dirección: nunca se enseña.
  if (r.codigo !== 0) return { error: 'la base no respondió (el detalle no se muestra por si lleva datos de conexión)' };
  try { return { datos: leerCuentas(r.salida) }; } catch (e) { return { error: e.message }; }
}

export async function contarDescargas({ fetchImpl = globalThis.fetch } = {}) {
  try {
    const res = await fetchImpl(RELEASES, { headers: { 'User-Agent': 'rwadar-numeros/1', Accept: 'application/vnd.github+json' } });
    if (res.status !== 200) return { error: `GitHub respondió ${res.status}` };
    const releases = await res.json();
    if (!Array.isArray(releases)) return { error: 'GitHub no devolvió una lista' };
    const filas = [];
    for (const rel of releases) {
      const apk = (rel.assets || []).find(a => a && a.name === 'RWAdar.apk');
      if (apk && Number.isInteger(apk.download_count)) filas.push({ version: String(rel.tag_name || '').slice(0, 20), fecha: String(rel.published_at || '').slice(0, 10), descargas: apk.download_count });
    }
    return { datos: { filas, total: filas.reduce((s, f) => s + f.descargas, 0) } };
  } catch (e) { return { error: `GitHub no respondió (${e.name})` }; }
}

const fechaISO = ms => new Date(ms).toISOString().slice(0, 10);

export function consultaVisitas(ahora) {
  const desde = fechaISO(ahora - 30 * 24 * 3600 * 1000);
  const hasta = fechaISO(ahora + 24 * 3600 * 1000);
  const filtro = `{ siteTag: "${SITIO_ANALITICA}", date_geq: "${desde}", date_lt: "${hasta}", bot: 0 }`;
  return {
    query: `query { viewer { accounts(filter: { accountTag: "${CUENTA_CLOUDFLARE}" }) {
      dias: rumPageloadEventsAdaptiveGroups(limit: 40, filter: ${filtro}, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
      paises: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filtro}, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { countryName } }
      paginas: rumPageloadEventsAdaptiveGroups(limit: 5, filter: ${filtro}, orderBy: [count_DESC]) { count dimensions { requestPath } }
    } } }`,
  };
}

export async function contarVisitas({ token, fetchImpl = globalThis.fetch, ahora = Date.now() }) {
  if (!token) return { sinClave: true };
  try {
    const res = await fetchImpl(CLOUDFLARE_GRAPHQL, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(consultaVisitas(ahora)) });
    const cuerpo = await res.json().catch(() => null);
    if (res.status !== 200 || !cuerpo || (cuerpo.errors && cuerpo.errors.length)) return { error: 'Cloudflare no dejó leer las visitas (¿el token tiene «Account Analytics: Read»?)' };
    const cuenta = cuerpo.data?.viewer?.accounts?.[0];
    if (!cuenta) return { error: 'Cloudflare no devolvió la cuenta' };
    const limite7 = fechaISO(ahora - 7 * 24 * 3600 * 1000);
    let v7 = 0, p7 = 0, v30 = 0, p30 = 0;
    for (const d of cuenta.dias || []) {
      const v = Number(d.sum?.visits) || 0, p = Number(d.count) || 0;
      v30 += v; p30 += p;
      if (String(d.dimensions?.date) >= limite7) { v7 += v; p7 += p; }
    }
    const paises = (cuenta.paises || []).map(p => ({ nombre: String(p.dimensions?.countryName || '¿?').slice(0, 40), visitas: Number(p.sum?.visits) || 0 }));
    const paginas = (cuenta.paginas || []).map(p => ({ ruta: String(p.dimensions?.requestPath || '/').slice(0, 80), vistas: Number(p.count) || 0 }));
    return { datos: { v7, p7, v30, p30, paises, paginas } };
  } catch (e) { return { error: `Cloudflare no respondió (${e.name})` }; }
}

const n = v => (v === null || v === undefined ? '—' : String(v));

export function informe({ cuentas, descargas, visitas, ahora }) {
  const l = [`## Números de RWAdar · ${new Date(ahora).toISOString().slice(0, 16).replace('T', ' ')} UTC`, ''];
  l.push('### Cuentas');
  if (cuentas.error) l.push(`No se han podido contar: ${cuentas.error}.`);
  else {
    const c = cuentas.datos;
    l.push('| Qué | Número |', '|---|---|',
      `| Cuentas creadas en total | ${n(c.cuentas)} |`,
      `| Con el correo confirmado | ${n(c.confirmadas)} |`,
      `| Nuevas en los últimos 7 días | ${n(c.nuevas_7)} |`,
      `| Nuevas en los últimos 30 días | ${n(c.nuevas_30)} |`,
      `| Entraron con su cuenta en los últimos 7 días | ${n(c.entraron_7)} |`,
      `| Entraron con su cuenta en los últimos 30 días | ${n(c.entraron_30)} |`,
      `| Han pedido los avisos por correo | ${n(c.avisos_correo)} |`,
      `| Usan la cartera (inversiones registradas) | ${c.con_cartera === null ? '— (la protección de esos datos no deja contarlos)' : c.con_cartera} |`);
    l.push('', 'Son totales: no salen correos ni nombres. Incluyen las cuentas de prueba del equipo.');
  }
  l.push('', '### Visitas de la web (rwadar.pages.dev)');
  if (visitas.sinClave) l.push(`No las puedo leer: falta la clave de solo lectura de analítica (CLOUDFLARE_ANALITICA_TOKEN). Míralas en el [panel de Cloudflare](${PANEL}); se abre en el navegador del móvil con tu cuenta de Cloudflare.`);
  else if (visitas.error) l.push(`${visitas.error}. Míralas en el [panel de Cloudflare](${PANEL}).`);
  else {
    const v = visitas.datos;
    l.push('| Periodo | Visitas | Páginas vistas |', '|---|---|---|', `| Últimos 7 días | ${v.v7} | ${v.p7} |`, `| Últimos 30 días | ${v.v30} | ${v.p30} |`);
    if (v.paises.length) l.push('', `Países con más visitas (30 días): ${v.paises.map(p => `${p.nombre} (${p.visitas})`).join(', ')}.`);
    if (v.paginas.length) l.push('', `Páginas más vistas (30 días): ${v.paginas.map(p => `${p.ruta} (${p.vistas})`).join(', ')}.`);
    l.push('', 'Una visita no es una persona: alguien que entra dos veces cuenta dos. Incluye nuestras pruebas.');
  }
  l.push('', '### App de Android');
  if (descargas.error) l.push(`No se han podido contar las descargas: ${descargas.error}.`);
  else {
    const d = descargas.datos;
    l.push(`Descargas del APK, todas las versiones: **${d.total}**.`, '', '| Versión | Publicada | Descargas |', '|---|---|---|');
    for (const f of d.filas) l.push(`| ${f.version} | ${f.fecha} | ${f.descargas} |`);
    l.push('', 'Muchas son nuestras (pruebas en el emulador). La app no mide cuántas veces se abre.');
  }
  return l.join('\n') + '\n';
}

export async function main(argv = process.argv.slice(2), entorno = process.env, opciones = {}) {
  const ahora = opciones.ahora ?? Date.now();
  const [cuentas, descargas, visitas] = await Promise.all([
    contarCuentas({ dbUrl: entorno.SUPABASE_DB_URL, ejecutarPsql: opciones.ejecutarPsql }),
    contarDescargas({ fetchImpl: opciones.fetchImpl }),
    contarVisitas({ token: entorno.CLOUDFLARE_ANALITICA_TOKEN, fetchImpl: opciones.fetchImpl, ahora }),
  ]);
  const texto = informe({ cuentas, descargas, visitas, ahora });
  (opciones.escribir || (t => process.stdout.write(t)))(texto);
  if (entorno.GITHUB_STEP_SUMMARY) fs.appendFileSync(entorno.GITHUB_STEP_SUMMARY, texto);
  const i = argv.indexOf('--salida');
  if (i >= 0 && argv[i + 1]) fs.writeFileSync(argv[i + 1], texto);
  return cuentas.error ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main();
