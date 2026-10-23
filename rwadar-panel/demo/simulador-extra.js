/* RWAdar · panel · simulador: respuestas de correos, fechas, velocidad,
   planes gratis y catálogo por dentro. Datos inventados; mismo formato
   que los servicios reales (comprobado contra ellos el 23/10/2026). */
'use strict';

const DIA = 86400000;
const CATEGORIAS = ['Inmobiliario', 'Tesoro y fondos', 'Acciones y capital privado', 'Crédito privado', 'Materias primas', 'Infraestructura'];
const LECCIONES = [['que-es-tokenizar', 'Qué significa tokenizar un activo'], ['quien-es-quien', 'Quién es quién en una tokenización'],
  ['cuanto-cuesta', 'Cuánto cuesta y cuánto tarda'], ['como-leer-el-radar', 'Cómo leer el radar']];
const DESCARTES = ['toucan-protocol', 'goldfinch', 'realt'];

const paginaAcademy = () => `<!doctype html><title>Academy</title>${LECCIONES.map(([slug, titulo]) =>
  `<a class="ac-tarjeta" href="/academy/${slug}" data-academy-tarjeta="${slug}"><span class="ac-tarjeta-tit">${titulo}</span></a>`).join('')}
  <article class="ac-tarjeta"><span class="ac-tarjeta-tit">Próximamente: después de emitir</span></article>`;

const mapaWeb = base => `<?xml version="1.0"?><urlset>${['/', '/academy/', ...DESCARTES.map(d => `/fuera-del-radar/${d}`)]
  .map(r => `<url><loc>${base}${r}</loc></url>`).join('')}</urlset>`;

const securityTxt = ahora => `Contact: mailto:seguridad@example.com\nExpires: ${new Date(ahora + 200 * DIA).toISOString()}\n`;

/* Filas de las vistas públicas del catálogo: lo de la vigencia y lo del inventario. */
function catalogoPublico(tipo, plataformas, ofertas, ahora) {
  const lote = { verificado_lote_el: new Date(ahora - 0.5 * DIA).toISOString().slice(0, 10), vigencia_lote_dias: 7, plataformas_esperadas: 26, ofertas_esperadas: 49 };
  const nombre = slug => slug.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
  if (tipo === 'plataformas') {
    return Array.from({ length: 26 }, (_, i) => {
      const slug = plataformas[i] || `plataforma-${i + 1}`;
      return { ...lote, slug, nombre: nombre(slug), categoria: CATEGORIAS[i % CATEGORIAS.length], acceso: ['Minorista', 'Institucional', 'Acreditado'][i % 3],
        region: ['Unión Europea', 'EE. UU.', 'España', 'Suiza'][i % 4], verificada_el: new Date(ahora - (i < 20 ? 80 : 12) * DIA).toISOString().slice(0, 10) };
    });
  }
  return Array.from({ length: 49 }, (_, i) => {
    const slug = ofertas[i] || `oferta-${i + 1}`;
    const plataforma = plataformas[i % 4];
    return { ...lote, slug, titulo: nombre(slug), tipo: i % 6 ? 'rendimiento' : 'valor', categoria: CATEGORIAS[i % 3], plataforma_slug: plataforma,
      plataforma_nombre: nombre(plataforma), verificada_el: lote.verificado_lote_el };
  });
}

function velocidadCf() {
  const grupo = (deviceType, count, lcp, inp, cls) => ({ count, dimensions: { deviceType }, quantiles: { largestContentfulPaintP75: lcp, interactionToNextPaintP75: inp, cumulativeLayoutShiftP75: cls } });
  const carga = (deviceType, count, p50, p75) => ({ count, dimensions: { deviceType }, quantiles: { pageLoadTimeP50: p50, pageLoadTimeP75: p75 } });
  return { data: { viewer: { accounts: [{
    vitales: [grupo('mobile', 212, 1840000, 168000, 0.04), grupo('desktop', 96, 1120000, 72000, 0.13)],
    carga: [carga('mobile', 212, 1310000, 2050000), carga('desktop', 96, 820000, 1260000)],
  }] } } };
}

function usoCf() {
  return { data: { viewer: { accounts: [{
    workers: [{ sum: { requests: 1840 }, dimensions: { scriptName: 'rwadar-panel' } }],
    kv: [{ sum: { requests: 3120 }, dimensions: { actionType: 'read' } }, { sum: { requests: 212 }, dimensions: { actionType: 'write' } }, { sum: { requests: 14 }, dimensions: { actionType: 'list' } }],
  }] } } };
}

/* Ejecuciones de GitHub Actions, con su ruta y su duración. */
function ejecuciones(ahora) {
  return [['Copia de seguridad', 'copia-seguridad', 'success', 0.3, 'schedule', 3], ['Compilar app Android', 'compilar-app', 'failure', 1.6, 'workflow_dispatch', 9],
    ['Verificación', 'ci', 'success', 0.9, 'push', 4], ['Publicar web', 'publicar', 'success', 1.1, 'workflow_dispatch', 2],
    ['Copia de seguridad', 'copia-seguridad', 'success', 1.3, 'schedule', 3], ['Aplicar catálogo', 'aplicar-catalogo', 'success', 2, 'workflow_dispatch', 1],
    ['Compilar app Android', 'compilar-app', 'success', 2.5, 'workflow_dispatch', 11]]
    .map(([name, archivo, conclusion, dias, event, minutos], i) => {
      const inicio = ahora - dias * DIA;
      return { id: i + 1, name, path: `.github/workflows/${archivo}.yml`, status: 'completed', conclusion, event, head_branch: 'main',
        run_started_at: new Date(inicio).toISOString(), created_at: new Date(inicio).toISOString(), updated_at: new Date(inicio + minutos * 60000 - 20000).toISOString(),
        html_url: `https://github.com/victorJorques/RWADAR/actions/runs/${1000 + i}` };
    });
}

/* Trabajos de una ejecución: dos por cada una, el segundo más corto. */
function trabajos(id, ahora) {
  const run = ejecuciones(ahora).find(e => e.id === Number(id));
  if (!run) return null;
  const inicio = Date.parse(run.run_started_at);
  const fin = Date.parse(run.updated_at);
  const medio = inicio + Math.round((fin - inicio) * 0.7);
  return { total_count: 2, jobs: [
    { id: id * 10, started_at: new Date(inicio).toISOString(), completed_at: new Date(medio).toISOString(), labels: ['ubuntu-latest'] },
    { id: id * 10 + 1, started_at: new Date(medio).toISOString(), completed_at: new Date(fin).toISOString(), labels: ['ubuntu-latest'] },
  ] };
}

/* API de administración de Supabase (salvo los registros de uso de la app). */
function supabaseApi(ruta, ahora) {
  if (ruta === '/v1/projects/simulado') return { id: 'simulado', organization_slug: 'org-demo', status: 'ACTIVE_HEALTHY' };
  if (ruta === '/v1/organizations/org-demo') return { id: 'org-demo', plan: 'free' };
  if (ruta === '/v1/projects/simulado/health') return ['db', 'auth', 'rest'].map(name => ({ name, healthy: true, status: 'ACTIVE_HEALTHY' }));
  if (ruta === '/v1/projects/simulado/analytics/endpoints/usage.api-counts') {
    return { result: Array.from({ length: 7 }, (_, i) => ({ timestamp: `${new Date(ahora - (6 - i) * DIA).toISOString().slice(0, 10)}T00:00:00`,
      total_auth_requests: 20 + i * 3, total_rest_requests: 300 + i * 41, total_storage_requests: 0, total_realtime_requests: 0 })) };
  }
  /* Solo campos que no son secretos, como lee el panel. */
  if (ruta === '/v1/projects/simulado/config/auth') return { smtp_host: 'smtp.example.com', smtp_sender_name: 'RWAdar', rate_limit_email_sent: 30, mailer_autoconfirm: false, disable_signup: false };
  return null;
}

/* Registros de Auth agrupados como los pide lib/correos.js. */
function registrosCorreo(roto) {
  const filas = [{ ruta: '/signup', estado: '200', nivel: 'info', error: '', n: 3 }, { ruta: '/recover', estado: '200', nivel: 'info', error: '', n: 1 },
    { ruta: '/verify', estado: '303', nivel: 'info', error: '', n: 2 }];
  if (roto) filas.push({ ruta: '/signup', estado: '500', nivel: 'error', error: '535 5.7.8 Username and Password not accepted for ana@example.com', n: 2 });
  return { result: filas };
}

module.exports = { paginaAcademy, mapaWeb, securityTxt, catalogoPublico, velocidadCf, usoCf, ejecuciones, trabajos, supabaseApi, registrosCorreo };
