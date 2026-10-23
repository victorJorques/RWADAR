/* =====================================================================
   RWAdar · panel · Cloudflare: visitas de la web
   ---------------------------------------------------------------------
   Visitas: Web Analytics (sin cookies) por la API GraphQL, conjunto
   rumPageloadEventsAdaptiveGroups, sin bots. «Visita» es una llegada
   desde fuera; «página vista» es cada carga. No son personas.

   El token solo necesita «Account Analytics: Read». El panel ya no
   apaga ni enciende la web (decisión de Víctor del 22/10/2026).
   ===================================================================== */
'use strict';
const { ErrorPanel, FaltaCredencial, pedir, pedirJson, mensajeRemoto } = require('./pedir');

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
      total: rumPageloadEventsAdaptiveGroups(filter: ${filtro}, limit: 1) { count sum { visits } avg { sampleInterval } }
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

/* Cloudflare da el país como código («ES»): se enseña su nombre. */
const REGIONES = (() => { try { return new Intl.DisplayNames(['es'], { type: 'region' }); } catch { return null; } })();
function nombrePais(codigo) {
  if (!codigo) return '(desconocido)';
  if (!/^[A-Z]{2}$/.test(codigo) || !REGIONES) return codigo;
  try { return REGIONES.of(codigo) || codigo; } catch { return codigo; }
}

/* Cloudflare cuenta visita a visita hasta 7 días; en periodos más largos
   apunta 1 de cada 10 y multiplica (comprobado el 23/10/2026: con pocas
   visitas eso da cifras falsas). Así que un periodo largo se pide en
   trozos de 7 días como mucho y se suman. */
const VENTANA_MS = 7 * 86400000;

function ventanas(desde, hasta) {
  const lista = [];
  for (let inicio = desde.getTime(); inicio < hasta.getTime(); inicio += VENTANA_MS) {
    const fin = Math.min(inicio + VENTANA_MS, hasta.getTime());
    /* Un segundo antes del siguiente trozo, para no contar dos veces el borde. */
    lista.push({ desde: new Date(inicio), hasta: new Date(fin === hasta.getTime() ? fin : fin - 1000) });
  }
  return lista;
}

/* Junta los resultados de varios trozos sumando por cada dimensión. */
function unirTrozos(trozos) {
  const sumar = filas => {
    const porClave = new Map();
    for (const f of filas) {
      const clave = JSON.stringify(f.dimensions || {});
      const actual = porClave.get(clave) || { count: 0, sum: { visits: 0 }, dimensions: f.dimensions };
      porClave.set(clave, { ...actual, count: actual.count + (f.count || 0), sum: { visits: actual.sum.visits + (f.sum?.visits || 0) } });
    }
    return [...porClave.values()].sort((a, b) => b.sum.visits - a.sum.visits || b.count - a.count);
  };
  const unido = {};
  for (const alias of ['serie', 'paginas', 'procedencia', 'paises', 'dispositivos', 'navegadores', 'sistemas']) {
    unido[alias] = sumar(trozos.flatMap(t => t[alias] || []));
  }
  const totales = trozos.map(t => t.total?.[0] || {});
  unido.total = [{
    count: totales.reduce((s, t) => s + (t.count || 0), 0),
    sum: { visits: totales.reduce((s, t) => s + (t.sum?.visits || 0), 0) },
    avg: { sampleInterval: Math.max(1, ...totales.map(t => t.avg?.sampleInterval || 1)) },
  }];
  return unido;
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
  function cabeceras(para) {
    if (!config.cloudflareToken) throw new FaltaCredencial('Cloudflare', para);
    return { Authorization: `Bearer ${config.cloudflareToken}` };
  }

  async function trafico(periodo = '7d', ahora = new Date()) {
    const dias = PERIODOS[periodo];
    if (!dias) throw new ErrorPanel('Periodo no válido', { estado: 400 });
    const porHora = dias === 1;
    const hasta = new Date(ahora);
    const desde = new Date(hasta.getTime() - dias * 86400000);
    const consultar = async v => {
      const query = consultaTrafico({ cuenta: config.cloudflareCuenta, sitio: config.sitioAnalitica, desde: v.desde, hasta: v.hasta, porHora });
      const r = await pedirJson(`${config.cloudflareApi}/graphql`, {
        method: 'POST', headers: cabeceras('leer las visitas de la web'), cuerpo: { query },
      });
      if (r.datos?.errors?.length) throw new ErrorPanel(`Cloudflare: ${r.datos.errors[0].message}`, { estado: 502 });
      const cuenta = r.datos?.data?.viewer?.accounts?.[0];
      if (!cuenta) throw new ErrorPanel('Cloudflare no devolvió la cuenta: revisa CLOUDFLARE_ACCOUNT_ID', { estado: 502 });
      return cuenta;
    };
    const c = unirTrozos(await Promise.all(ventanas(desde, hasta).map(consultar)));
    const paginas = lista(c.paginas, 'requestPath', v => v || '/');
    const visitas = c.total?.[0]?.sum?.visits || 0;
    const vistas = c.total?.[0]?.count || 0;
    return {
      periodo, porHora, desde: isoSinMs(desde), hasta: isoSinMs(hasta),
      /* Si aun así Cloudflare muestreó, las cifras son estimadas: se avisa. */
      estimado: (c.total[0].avg?.sampleInterval || 1) > 1,
      visitas, paginasVistas: vistas, paginasPorVisita: visitas ? Math.round((vistas / visitas) * 10) / 10 : 0,
      serie: serieCompleta(c.serie || [], { desde, hasta, porHora }),
      paginas: paginas.slice(0, 15),
      /* Todas, para cruzarlas con el catálogo y Academy (no viajan al navegador). */
      paginasTodas: paginas,
      flujo: resumirFlujo(paginas),
      /* Las páginas de la propia web no son «procedencia»: son gente moviéndose dentro. */
      procedencia: lista(c.procedencia, 'refererHost', v => v || 'Directo o sin dato')
        .filter(p => p.visitas > 0 && p.nombre !== new URL(config.web).host),
      paises: lista(c.paises, 'countryName', nombrePais),
      dispositivos: lista(c.dispositivos, 'deviceType'),
      navegadores: lista(c.navegadores, 'userAgentBrowser'),
      sistemas: lista(c.sistemas, 'userAgentOS'),
    };
  }

  return { trafico };
}

module.exports = { crearCloudflare, seccionDe, serieCompleta, resumirFlujo, consultaTrafico, ventanas, unirTrozos, PERIODOS };
