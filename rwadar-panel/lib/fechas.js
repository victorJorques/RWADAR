/* =====================================================================
   RWAdar · panel · fechas que caducan
   ---------------------------------------------------------------------
   Lo que deja de funcionar solo si nadie se acuerda:
     · el catálogo publicado (la web avisa y quita las cifras vencidas),
     · el security.txt de la web (campo Expires),
     · la clave de GitHub del panel (GitHub la manda en una cabecera),
     · la clave de Cloudflare del panel (si se le puso caducidad).
   Cada una con los días que quedan. Aviso a 14 días (el catálogo, que
   se renueva cada semana, a 2), fallo si pasó.
   ===================================================================== */
'use strict';
const { pedir } = require('./pedir');

const DIA_MS = 86400000;
const AVISO_DIAS = 14;
const AVISO_CATALOGO_DIAS = 2;

/* Días que quedan: hacia arriba si aún vale, hacia abajo si ya pasó (así
   lo que caducó hace dos horas es -1 y no un «-0» que parece «hoy»). */
function diasHasta(fecha, ahora) {
  const ms = new Date(fecha).getTime() - ahora;
  return ms < 0 ? Math.floor(ms / DIA_MS) : Math.ceil(ms / DIA_MS);
}

function entrada(id, nombre, fecha, que, ahora, avisoDias = AVISO_DIAS) {
  if (!fecha || Number.isNaN(new Date(fecha).getTime())) return { id, nombre, fecha: null, diasRestantes: null, estado: 'sin-datos', que };
  const dias = diasHasta(fecha, ahora);
  return { id, nombre, fecha: new Date(fecha).toISOString(), diasRestantes: dias, estado: dias < 0 ? 'fallo' : dias <= avisoDias ? 'aviso' : 'ok', que };
}

const sinFecha = (id, nombre, estado, que) => ({ id, nombre, fecha: null, diasRestantes: null, estado, que });

/* Una clave del panel: no caduca, caduca tal día, ya no vale o no se pudo mirar. */
function entradaClave(id, nombre, leido, que, ahora) {
  if (!leido) return sinFecha(id, nombre, 'sin-datos', 'No pude comprobarla ahora; se vuelve a intentar en un minuto.');
  if (leido.noVale) return sinFecha(id, nombre, 'fallo', `Ya no vale (caducada o borrada). ${que}`);
  if (leido.sinCaducidad) return sinFecha(id, nombre, 'ok', 'No caduca.');
  return entrada(id, nombre, leido.fecha, que, ahora);
}

/* catalogo: cualquier cosa con vigenciaCatalogo() (el cliente de Supabase o su caché). */
function crearFechas(config, catalogo) {
  async function securityTxt() {
    const r = await pedir(`${config.web}/.well-known/security.txt`);
    return r.ok ? (r.texto.match(/^Expires:\s*(\S+)/mi) || [])[1] || null : null;
  }

  /* Cada una devuelve { sinClave } | { noVale } | { sinCaducidad } | { fecha }.
     Si el servicio no contesta, lanza: la lista lo enseña como «sin datos». */
  async function caducidadGithub() {
    if (!config.githubToken) return { sinClave: true };
    const r = await pedir(`${config.githubApi}/rate_limit`, { headers: { Authorization: `Bearer ${config.githubToken}`, 'User-Agent': 'rwadar-panel' } });
    if (r.estado === 401) return { noVale: true };
    if (!r.ok) throw new Error(`GitHub respondió ${r.estado}`);
    /* Formato de GitHub: «2027-10-23 00:00:00 UTC». */
    const valor = r.cabeceras.get('github-authentication-token-expiration');
    return valor ? { fecha: valor.replace(' UTC', 'Z').replace(' ', 'T') } : { sinCaducidad: true };
  }

  async function caducidadCloudflare() {
    if (!config.cloudflareToken) return { sinClave: true };
    const r = await pedir(`${config.cloudflareApi}/user/tokens/verify`, { headers: { Authorization: `Bearer ${config.cloudflareToken}` } });
    if (r.estado === 401 || r.estado === 403 || (r.ok && r.datos?.result?.status && r.datos.result.status !== 'active')) return { noVale: true };
    if (!r.ok) throw new Error(`Cloudflare respondió ${r.estado}`);
    const fecha = r.datos?.result?.expires_on || null;
    return fecha ? { fecha } : { sinCaducidad: true };
  }

  async function lista(ahora = Date.now()) {
    const [vigencia, security, github, cloudflare] = await Promise.allSettled([catalogo.vigenciaCatalogo(ahora), securityTxt(), caducidadGithub(), caducidadCloudflare()]);
    const valor = x => x.status === 'fulfilled' ? x.value : null;
    const v = valor(vigencia);
    const items = [
      entrada('catalogo', 'Revisión del catálogo', v?.caducaEl ? `${v.caducaEl}T00:00:00Z` : null, 'Pide «haz la investigación» antes de que caduque. Si vence, la web sigue enseñándolo con aviso.', ahora, AVISO_CATALOGO_DIAS),
      entrada('security', 'security.txt de la web', valor(security), 'Pídele a Claude o a Codex que renueven la fecha de /.well-known/security.txt.', ahora),
    ];
    const gh = valor(github);
    if (!gh?.sinClave) items.push(entradaClave('github', 'Clave de GitHub del panel', gh, 'Crea otra en github.com › Settings › Fine-grained tokens, pégala en el archivo de claves y vuelve a subir el panel.', ahora));
    const cf = valor(cloudflare);
    if (!cf?.sinClave) items.push(entradaClave('cloudflare', 'Clave de Cloudflare del panel', cf, 'Crea otra en dash.cloudflare.com › API Tokens y vuelve a subir el panel.', ahora));
    return items.sort((a, b) => (a.diasRestantes ?? 1e9) - (b.diasRestantes ?? 1e9));
  }

  return { lista };
}

module.exports = { crearFechas, entrada, entradaClave, diasHasta, AVISO_DIAS, AVISO_CATALOGO_DIAS };
