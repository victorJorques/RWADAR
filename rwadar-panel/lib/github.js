/* =====================================================================
   RWAdar · panel · GitHub: descargas de la app y tareas automáticas
   ---------------------------------------------------------------------
   Las descargas del APK salen de la API pública de RWAdar-downloads
   (sin clave). Cuentan descargas del archivo, incluidas las nuestras:
   no son instalaciones ni personas.

   Las tareas automáticas (copia de seguridad nocturna, CI, publicar)
   viven en el repositorio privado. En el ordenador se leen con `gh`,
   que ya tiene la sesión de Víctor (lo inyecta servidor.js); en la nube,
   con GITHUB_TOKEN (permiso de solo lectura de Actions). Sin ninguna de
   las dos, esa parte de la salud sale «sin datos».
   ===================================================================== */
'use strict';
const { FaltaCredencial, pedirJson } = require('./pedir');

const CABECERAS = { Accept: 'application/vnd.github+json', 'User-Agent': 'rwadar-panel' };

function crearGithub(config, { leerPrivado } = {}) {
  async function leerConToken(ruta) {
    if (!config.githubToken) throw new FaltaCredencial('GitHub', 'ver las tareas automáticas');
    return (await pedirJson(`${config.githubApi}${ruta}`, { headers: { ...CABECERAS, Authorization: `Bearer ${config.githubToken}` } })).datos;
  }
  const leer = async ruta => {
    if (leerPrivado) return leerPrivado(ruta);
    if (config.githubToken) return leerConToken(ruta);
    if (config.githubApi !== 'https://api.github.com') return (await pedirJson(`${config.githubApi}${ruta}`, { headers: CABECERAS })).datos;
    throw new FaltaCredencial('GitHub', 'ver las tareas automáticas');
  };

  async function descargasApp() {
    /* Sin clave GitHub deja 60 consultas por hora y por dirección; desde
       Cloudflare esa dirección la comparten muchos y se agota. Con
       GITHUB_TOKEN el límite es propio. */
    const cabeceras = config.githubToken ? { ...CABECERAS, Authorization: `Bearer ${config.githubToken}` } : CABECERAS;
    let r;
    try {
      r = await pedirJson(`${config.githubApi}/repos/${config.repoDescargas}/releases?per_page=100`, { headers: cabeceras });
    } catch (e) {
      if (!config.githubToken && /rate limit/i.test(e.message)) throw new FaltaCredencial('GitHub', 'ver las descargas (GitHub corta las consultas sin clave)');
      throw e;
    }
    const versiones = (Array.isArray(r.datos) ? r.datos : [])
      .filter(v => !v.draft)
      .map(v => {
        const apk = (v.assets || []).filter(a => /\.apk$/i.test(a.name));
        return {
          version: v.tag_name,
          nombre: v.name || v.tag_name,
          publicada: v.published_at,
          previa: Boolean(v.prerelease),
          descargasApk: apk.reduce((s, a) => s + (a.download_count || 0), 0),
          tieneApk: apk.length > 0,
          url: v.html_url,
        };
      })
      .sort((a, b) => String(b.publicada).localeCompare(String(a.publicada)));
    const ultima = versiones.find(v => !v.previa) || null;
    return { versiones, ultima, totalApk: versiones.reduce((s, v) => s + v.descargasApk, 0) };
  }

  async function tareasAutomaticas() {
    const datos = await leer(`/repos/${config.repoFuente}/actions/runs?per_page=60`);
    const ultimas = new Map();
    for (const run of datos?.workflow_runs || []) {
      const nombre = run.name || run.display_title || 'Sin nombre';
      if (ultimas.has(nombre)) continue;
      ultimas.set(nombre, {
        nombre,
        resultado: run.status === 'completed' ? (run.conclusion || 'desconocido') : 'en-curso',
        fecha: run.run_started_at || run.created_at,
        evento: run.event,
        rama: run.head_branch,
        url: run.html_url,
      });
    }
    return [...ultimas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  /* Todas las ejecuciones del repositorio privado desde un día (AAAA-MM-DD). */
  async function ejecucionesDesde(dia) {
    const todas = [];
    for (let pagina = 1; pagina <= 10; pagina++) {
      const datos = await leer(`/repos/${config.repoFuente}/actions/runs?created=${encodeURIComponent(`>=${dia}`)}&per_page=100&page=${pagina}`);
      const lote = datos?.workflow_runs || [];
      todas.push(...lote);
      if (lote.length < 100) break;
    }
    return todas.map(run => ({
      id: run.id,
      nombre: run.name || 'Sin nombre',
      ruta: run.path || '',
      terminada: run.status === 'completed',
      resultado: run.conclusion || null,
      inicio: run.run_started_at || run.created_at,
      fin: run.updated_at,
    }));
  }

  /* Minutos que GitHub cobra de una ejecución: cada trabajo por separado,
     redondeado al minuto hacia arriba; Windows cuenta doble y macOS por diez. */
  async function minutosDe(id) {
    const datos = await leer(`/repos/${config.repoFuente}/actions/runs/${Number(id)}/jobs?filter=all&per_page=100`);
    return (datos?.jobs || []).reduce((suma, t) => {
      if (!t.started_at || !t.completed_at) return suma;
      const etiquetas = (t.labels || []).join(' ').toLowerCase();
      const por = etiquetas.includes('macos') ? 10 : etiquetas.includes('windows') ? 2 : 1;
      return suma + Math.ceil(Math.max(0, new Date(t.completed_at) - new Date(t.started_at)) / 60000) * por;
    }, 0);
  }

  return { descargasApp, tareasAutomaticas, ejecucionesDesde, minutosDe };
}

module.exports = { crearGithub };
