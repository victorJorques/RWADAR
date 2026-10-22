/* =====================================================================
   RWAdar · panel · Cloudflare: visitas de la web y despliegues
   ---------------------------------------------------------------------
   Visitas: Web Analytics (sin cookies) por la API GraphQL, conjunto
   rumPageloadEventsAdaptiveGroups, sin bots. «Visita» es una llegada
   desde fuera; «página vista» es cada carga. No son personas.

   Despliegues: la API de Pages, para saber qué está en producción y
   volver a un despliegue anterior (así se enciende la web otra vez).
   El token necesita «Account Analytics: Read» y «Cloudflare Pages: Edit».
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedirJson } = require('./pedir');

const PERIODOS = Object.freeze({ '24h': 1, '7d': 7, '30d': 30 });
const HEX = /^[0-9a-f]{32}$/i;

/* Cómo se agrupan las rutas de la web para ver por dónde se mueve la gente. */
const SECCIONES = Object.freeze([
  { id: 'portada', nombre: 'Portada', prueba: r => r === '/' || r === '/index' },
  { id: 'ofertas', nombre: 'Fichas de oferta', prueba: r => r.startsWith('/ofertas') },
  { id: 'plataformas', nombre: 'Fichas de plataforma', prueba: r => r.startsWith('/plataformas') },
  { id: 'descartes', nombre: 'Fuera del radar', prueba: r => r.startsWith('/fuera-del-radar') },
  { id: 'academy', nombre: 'Academy', prueba: r => r.startsWith('/academy') },
  { id: 'metodo', nombre: 'Metodología y cambios', prueba: r => /^\/(metodologia|cambios)/.test(r) },
  { id: 'empresas', nombre: 'Para empresas', prueba: r => r.startsWith('/para-empresas') },
  { id: 'descargas', nombre: 'Descargas', prueba: r => r.startsWith('/descargas') || r === '/android' },
  { id: 'legal', nombre: 'Privacidad y legal', prueba: r => /^\/(privacidad|transparencia-comercial)/.test(r) },
]);

function seccionDe(ruta) {
  const limpia = String(ruta || '/').split(/[?#]/)[0].replace(/\.html$/, '') || '/';
  return SECCIONES.find(s => s.prueba(limpia)) || { id: 'otras', nombre: 'Otras páginas' };
}

function isoSinMs(fecha) { return fecha.toISOString().replace(/\.\d{3}Z$/, 'Z'); }

function consultaTrafico({ cuenta, sitio, desde, hasta, porHora }) {
  if (!HEX.test(cuenta) || !HEX.test(sitio)) throw new ErrorPanel('Cuenta o sitio de Cloudflare no válidos', { estado: 400 });
  const filtro = `{AND: [{datetime_geq: "${isoSinMs(desde)}"}, {datetime_leq: "${isoSinMs(hasta)}"}, {siteTag: "${sitio}"}, {bot: 0}]}`;
  const tiempo = porHora ? 'datetimeHour' : 'date';
  const grupo = (alias, limite, orden, dim) =>
    `${alias}: rumPageloadEventsAdaptiveGroups(filter: ${filtro}, limit: ${limite}, orderBy: [${orden}]) { count sum { visits } dimensions { ${dim} } }`;
  return `query {
  viewer {
    accounts(filter: {accountTag: "${cuenta}"}) {
      total: rumPageloadEventsAdaptiveGroups(filter: ${filtro}, limit: 1) { count sum { visits } }
      ${grupo('serie', 1000, `${tiempo}_ASC`, tiempo)}
      ${grupo('paginas', 300, 'count_DESC', 'requestPath')}
      ${grupo('procedencia', 15, 'sum_visits_DESC', 'refererHost')}
      ${grupo('paises', 15, 'sum_visits_DESC', 'countryName')}
      ${grupo('dispositivos', 6, 'sum_visits_DESC', 'deviceType')}
      ${grupo('navegadores', 8, 'sum_visits_DESC', 'userAgentBrowser')}
      ${grupo('sistemas', 8, 'sum_visits_DESC', 'userAgentOS')}
    }
  }
}`;
}

/* Rellena las horas o días sin visitas para que la gráfica no mienta. */
function serieCompleta(filas, { desde, hasta, porHora }) {
  const paso = porHora ? 3600000 : 86400000;
  const clave = d => porHora ? isoSinMs(new Date(Math.floor(d / paso) * paso)) : new Date(d).toISOString().slice(0, 10);
  const valores = new Map(filas.map(f => {
    const t = f.dimensions?.datetimeHour || f.dimensions?.date;
    return [clave(new Date(t).getTime()), { visitas: f.sum?.visits || 0, paginas: f.count || 0 }];
  }));
  const serie = [];
  for (let t = Math.floor(desde.getTime() / paso) * paso; t <= hasta.getTime(); t += paso) {
    const k = clave(t);
    serie.push({ momento: k, ...(valores.get(k) || { visitas: 0, paginas: 0 }) });
  }
  return serie;
}

function lista(filas, dim, nombrar = v => v || '(desconocido)') {
  return (filas || []).map(f => ({ nombre: nombrar(f.dimensions?.[dim]), visitas: f.sum?.visits || 0, paginas: f.count || 0 }));
}

function resumirFlujo(paginas) {
  const porSeccion = new Map();
  for (const p of paginas) {
    const s = seccionDe(p.nombre);
    const actual = porSeccion.get(s.id) || { id: s.id, nombre: s.nombre, paginas: 0, visitas: 0 };
    porSeccion.set(s.id, { ...actual, paginas: actual.paginas + p.paginas, visitas: actual.visitas + p.visitas });
  }
  const fichas = paginas
    .filter(p => /^\/(ofertas|plataformas)\/[^/]+/.test(p.nombre))
    .slice(0, 10)
    .map(p => ({ ...p, tipo: p.nombre.startsWith('/ofertas') ? 'Oferta' : 'Plataforma' }));
  return { secciones: [...porSeccion.values()].sort((a, b) => b.paginas - a.paginas), fichas };
}

function crearCloudflare(config) {
  const cuentaUrl = `${config.cloudflareApi}/accounts/${config.cloudflareCuenta}`;

  function cabeceras(para) {
    if (!config.cloudflareToken) throw new FaltaCredencial('Cloudflare', para);
    return { Authorization: `Bearer ${config.cloudflareToken}` };
  }

  async function api(ruta, { method = 'GET', para }) {
    const r = await pedirJson(`${cuentaUrl}${ruta}`, { method, headers: cabeceras(para) });
    if (r.datos?.success === false) {
      throw new ErrorPanel(`Cloudflare: ${r.datos.errors?.[0]?.message || 'error sin detalle'}`, { estado: 502 });
    }
    return r.datos?.result;
  }

  async function trafico(periodo = '7d', ahora = new Date()) {
    const dias = PERIODOS[periodo];
    if (!dias) throw new ErrorPanel('Periodo no válido', { estado: 400 });
    const porHora = dias === 1;
    const hasta = new Date(ahora);
    const desde = new Date(hasta.getTime() - dias * 86400000);
    const query = consultaTrafico({ cuenta: config.cloudflareCuenta, sitio: config.sitioAnalitica, desde, hasta, porHora });
    const r = await pedirJson(`${config.cloudflareApi}/graphql`, {
      method: 'POST', headers: cabeceras('leer las visitas de la web'), cuerpo: { query },
    });
    if (r.datos?.errors?.length) throw new ErrorPanel(`Cloudflare: ${r.datos.errors[0].message}`, { estado: 502 });
    const c = r.datos?.data?.viewer?.accounts?.[0];
    if (!c) throw new ErrorPanel('Cloudflare no devolvió la cuenta: revisa CLOUDFLARE_ACCOUNT_ID', { estado: 502 });
    const paginas = lista(c.paginas, 'requestPath', v => v || '/');
    const visitas = c.total?.[0]?.sum?.visits || 0;
    const vistas = c.total?.[0]?.count || 0;
    return {
      periodo, porHora, desde: isoSinMs(desde), hasta: isoSinMs(hasta),
      visitas, paginasVistas: vistas, paginasPorVisita: visitas ? Math.round((vistas / visitas) * 10) / 10 : 0,
      serie: serieCompleta(c.serie || [], { desde, hasta, porHora }),
      paginas: paginas.slice(0, 15),
      flujo: resumirFlujo(paginas),
      procedencia: lista(c.procedencia, 'refererHost', v => v || 'Directo o sin dato'),
      paises: lista(c.paises, 'countryName'),
      dispositivos: lista(c.dispositivos, 'deviceType'),
      navegadores: lista(c.navegadores, 'userAgentBrowser'),
      sistemas: lista(c.sistemas, 'userAgentOS'),
    };
  }

  const resumirDespliegue = d => ({
    id: d.id,
    corto: d.short_id || String(d.id).slice(0, 8),
    creado: d.created_on,
    estado: d.latest_stage?.status || 'desconocido',
    mensaje: d.deployment_trigger?.metadata?.commit_message || '',
    url: d.url,
  });

  async function desplieguesProduccion(pagina = 1) {
    const result = await api(`/pages/projects/${config.proyecto}/deployments?env=production&per_page=15&page=${pagina}`,
      { para: 'ver los despliegues de la web' });
    return (Array.isArray(result) ? result : []).map(resumirDespliegue);
  }

  /* El despliegue que Cloudflare sirve ahora mismo en producción. Tras
     una vuelta atrás no tiene por qué ser el más reciente de la lista. */
  async function produccionActual() {
    const proyecto = await api(`/pages/projects/${config.proyecto}`, { para: 'ver qué está publicado' });
    return proyecto?.canonical_deployment ? resumirDespliegue(proyecto.canonical_deployment) : null;
  }

  /* La página de mantenimiento ya subida alguna vez (puede estar atrás
     en la lista si después se ha publicado mucho). */
  async function buscarMantenimiento(marca, paginas = 10) {
    for (let pagina = 1; pagina <= paginas; pagina++) {
      const lista = await desplieguesProduccion(pagina);
      const encontrado = lista.find(d => d.estado === 'success' && d.mensaje.includes(marca));
      if (encontrado || lista.length < 15) return encontrado || null;
    }
    return null;
  }

  async function volverA(id) {
    if (!/^[0-9a-f-]{8,64}$/i.test(String(id))) throw new ErrorPanel('Despliegue no válido', { estado: 400 });
    const d = await api(`/pages/projects/${config.proyecto}/deployments/${id}/rollback`,
      { method: 'POST', para: 'encender la web' });
    return { id: d?.id || id, url: d?.url || null };
  }

  return { trafico, desplieguesProduccion, produccionActual, buscarMantenimiento, volverA };
}

module.exports = { crearCloudflare, seccionDe, serieCompleta, resumirFlujo, consultaTrafico, PERIODOS };
