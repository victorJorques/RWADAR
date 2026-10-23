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

function entrada(id, nombre, fecha, que, ahora, avisoDias = AVISO_DIAS) {
  if (!fecha || Number.isNaN(new Date(fecha).getTime())) return { id, nombre, fecha: null, diasRestantes: null, estado: 'sin-datos', que };
  const dias = Math.ceil((new Date(fecha).getTime() - ahora) / DIA_MS);
  return { id, nombre, fecha: new Date(fecha).toISOString(), diasRestantes: dias, estado: dias < 0 ? 'fallo' : dias <= avisoDias ? 'aviso' : 'ok', que };
}

const sinCaducidad = (id, nombre) => ({ id, nombre, fecha: null, diasRestantes: null, estado: 'ok', que: 'No caduca.' });

/* catalogo: cualquier cosa con vigenciaCatalogo() (el cliente de Supabase o su caché). */
function crearFechas(config, catalogo) {
  async function securityTxt() {
    const r = await pedir(`${config.web}/.well-known/security.txt`);
    return r.ok ? (r.texto.match(/^Expires:\s*(\S+)/mi) || [])[1] || null : null;
  }

  async function caducidadGithub() {
    if (!config.githubToken) return { fecha: null, sinClave: true };
    const r = await pedir(`${config.githubApi}/rate_limit`, { headers: { Authorization: `Bearer ${config.githubToken}`, 'User-Agent': 'rwadar-panel' } });
    /* Formato de GitHub: «2027-10-23 00:00:00 UTC». */
    const valor = r.cabeceras.get('github-authentication-token-expiration');
    return { fecha: valor ? valor.replace(' UTC', 'Z').replace(' ', 'T') : null, sinCaducidad: r.ok && !valor };
  }

  async function caducidadCloudflare() {
    if (!config.cloudflareToken) return { fecha: null, sinClave: true };
    const r = await pedir(`${config.cloudflareApi}/user/tokens/verify`, { headers: { Authorization: `Bearer ${config.cloudflareToken}` } });
    const fecha = r.datos?.result?.expires_on || null;
    return { fecha, sinCaducidad: r.ok && !fecha };
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
    if (gh && !gh.sinClave) {
      items.push(gh.sinCaducidad ? sinCaducidad('github', 'Clave de GitHub del panel')
        : entrada('github', 'Clave de GitHub del panel', gh.fecha, 'Crea otra en github.com › Settings › Fine-grained tokens, pégala en el archivo de claves y vuelve a subir el panel.', ahora));
    }
    const cf = valor(cloudflare);
    if (cf && !cf.sinClave) {
      items.push(cf.sinCaducidad ? sinCaducidad('cloudflare', 'Clave de Cloudflare del panel')
        : entrada('cloudflare', 'Clave de Cloudflare del panel', cf.fecha, 'Crea otra en dash.cloudflare.com › API Tokens y vuelve a subir el panel.', ahora));
    }
    return items.sort((a, b) => (a.diasRestantes ?? 1e9) - (b.diasRestantes ?? 1e9));
  }

  return { lista };
}

module.exports = { crearFechas, entrada, AVISO_DIAS, AVISO_CATALOGO_DIAS };
