/* RWAdar · panel · forma común de la configuración.
   La usan el panel del ordenador (config.js, que lee archivos) y el de la
   nube (nube/config-nube.js, que lee los secretos de Cloudflare). Aquí no
   se lee nada de disco: así también corre dentro de Cloudflare. */
'use strict';
const { CUENTA_CLOUDFLARE, SITIO_ANALITICA, REPO_DESCARGAS, REPO_FUENTE } = require('./constantes');

/* publicos: { web, supabaseAuth, clavePublica, proyecto, versionWrangler }
   v: lector de valores (entorno, .env.local o secretos de Cloudflare) */
function construirConfig(publicos, v, extra = {}) {
  const githubApi = v('RWADAR_PANEL_GITHUB_API');
  return Object.freeze({
    modo: v('RWADAR_PANEL_DEMO') === '1' ? 'demo' : 'local',
    modoDemo: v('RWADAR_PANEL_DEMO') === '1',
    web: (v('RWADAR_PANEL_WEB') || publicos.web).replace(/\/$/, ''),
    supabase: (v('RWADAR_PANEL_SUPABASE') || publicos.supabaseAuth.replace(/\/auth\/v1$/, '')).replace(/\/$/, ''),
    clavePublica: publicos.clavePublica,
    claveSecreta: v('SUPABASE_SECRET_KEY') || v('SUPABASE_SERVICE_ROLE_KEY'),
    /* API de administración de Supabase: solo para leer sus registros. */
    supabaseApi: (v('RWADAR_PANEL_SUPABASE_API') || 'https://api.supabase.com').replace(/\/$/, ''),
    supabaseAccessToken: v('SUPABASE_ACCESS_TOKEN'),
    cloudflareApi: v('RWADAR_PANEL_CLOUDFLARE_API') || 'https://api.cloudflare.com/client/v4',
    cloudflareToken: v('CLOUDFLARE_API_TOKEN'),
    cloudflareCuenta: v('CLOUDFLARE_ACCOUNT_ID') || CUENTA_CLOUDFLARE,
    sitioAnalitica: v('CLOUDFLARE_WEB_ANALYTICS_SITE') || SITIO_ANALITICA,
    proyecto: publicos.proyecto,
    versionWrangler: publicos.versionWrangler,
    githubApi: githubApi || 'https://api.github.com',
    githubToken: v('GITHUB_TOKEN'),
    repoDescargas: REPO_DESCARGAS,
    repoFuente: REPO_FUENTE,
    ...extra,
  });
}

module.exports = { construirConfig };
