/* RWAdar · panel · catálogo y Academy por dentro: qué hay publicado y
   qué mira la gente. Las fichas de oferta y plataforma no se miden en la
   web (solo portada, Academy y páginas legales), así que de ellas se
   enseña el inventario y no las visitas. */
import { api, h, poner, kpi, segmentos, numero, fecha, etiquetaEstado, bloqueError } from './util.js';
import { barras, SERIE_2 } from './graficos.js';

const PERIODOS = [['7d', '7 días'], ['30d', '30 días']];
const VIEJA_DIAS = 60;
let periodo = '30d';

const filas = lista => lista.map(x => ({ nombre: x.nombre, valor: x.n }));

function nombres(lista, vacio) {
  return lista.length ? h('div', { class: 'etiquetas' }, ...lista.map(n => h('span', { class: 'etiqueta' }, n))) : h('p', { class: 'vacio' }, vacio);
}

/* «Verificadas el 26 jul: 24 · el 8 ago: 2», con aviso si llevan más de dos meses. */
function verificacion(lista, viejas, total, que) {
  const hace = dias => dias === 0 ? ' (hoy)' : ` (hace ${numero(dias)} ${dias === 1 ? 'día' : 'días'})`;
  const texto = lista.map(v => `${numero(v.n)} el ${fecha(`${v.fecha}T12:00:00Z`, { hora: false })}${v.dias !== null ? hace(v.dias) : ''}`).join(' · ');
  return h('div', { class: `verificacion ${viejas ? 'aviso' : ''}` },
    etiquetaEstado(viejas ? 'aviso' : 'ok', viejas ? 'Revisar' : 'Al día'),
    h('div', {}, h('strong', {}, `Datos de ${que} verificados`), h('div', { class: 'nota' }, texto || 'Sin fecha'),
      viejas ? h('div', { class: 'nota' }, `${numero(viejas)} de ${numero(total)} llevan más de ${VIEJA_DIAS} días sin revisar: pide a Claude o a Codex que vuelvan a comprobarlas.`) : null));
}

function tarjetaPlataformas(p) {
  return h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Plataformas'), h('span', { class: 'nota' }, `${numero(p.total)} publicadas`)),
    verificacion(p.verificadas, p.sinRevisarMasDe60, p.total, 'plataformas'),
    h('div', { class: 'rejilla dos' },
      h('div', {}, h('h3', {}, 'Por categoría'), barras(filas(p.porCategoria), { unidad: 'plataformas' })),
      h('div', {}, h('h3', {}, 'Para quién'), barras(filas(p.porAcceso), { unidad: 'plataformas', color: SERIE_2 }))),
    h('div', { class: 'rejilla dos' },
      h('div', {}, h('h3', {}, 'Ofertas por proveedor'),
        barras(p.conMasOfertas.slice(0, 10).map(x => ({ nombre: x.conFicha ? x.nombre : `${x.nombre} · sin ficha de plataforma`, valor: x.n })), { unidad: 'ofertas' })),
      h('div', {}, h('h3', {}, 'Dónde operan'), barras(filas(p.porRegion), { unidad: 'plataformas', color: SERIE_2 }))),
    h('h3', {}, `Sin ninguna oferta publicada (${numero(p.sinOfertas.length)})`),
    nombres(p.sinOfertas, 'Todas tienen al menos una oferta.'));
}

function tarjetaOfertas(o) {
  return h('section', { class: 'tarjeta' },
    h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Ofertas'), h('span', { class: 'nota' }, `${numero(o.total)} publicadas`)),
    verificacion(o.verificadas, o.sinRevisarMasDe60, o.total, 'ofertas'),
    h('div', { class: 'rejilla dos' },
      h('div', {}, h('h3', {}, 'Por categoría'), barras(filas(o.porCategoria), { unidad: 'ofertas' })),
      h('div', {}, h('h3', {}, 'Qué cifra enseñan'), barras(filas(o.porTipo), { unidad: 'ofertas', color: SERIE_2 }))));
}

function tarjetaAcademy(a, d) {
  const cab = h('div', { class: 'tarjeta-cab' }, h('h2', {}, 'Academy · lecciones más leídas'),
    h('span', { class: 'nota' }, d.estimado ? 'Cifras aproximadas (más de 7 días)' : 'Páginas vistas'));
  if (a.error) return h('section', { class: 'tarjeta' }, cab, bloqueError({ message: a.error }));
  if (!a.medida) return h('section', { class: 'tarjeta' }, cab, bloqueError({ message: d.visitasError || 'No pude leer las visitas' }));
  return h('section', { class: 'tarjeta' }, cab,
    h('p', { class: 'nota' }, `La portada de Academy se abrió ${numero(a.portada.paginas)} veces. De ${numero(a.total)} lecciones, ${numero(a.abiertas)} se han leído.`),
    barras(a.lista.map(l => ({ nombre: l.nombre, valor: l.paginas })), { unidad: 'páginas vistas' }),
    a.nadie.length ? [h('h3', {}, `Nadie la ha abierto (${numero(a.nadie.length)})`), nombres(a.nadie, '')] : null);
}

function tarjetaQueSeMira(d) {
  if (d.fichasMedidas && d.vistasFichas) {
    const { plataformas, ofertas } = d.vistasFichas;
    const top = lista => barras(lista.lista.filter(f => f.paginas).slice(0, 10).map(f => ({ nombre: f.nombre, valor: f.paginas })), { unidad: 'páginas vistas' });
    return h('div', { class: 'rejilla dos' },
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Ofertas más vistas'), top(ofertas), h('h3', {}, `Nadie la abrió (${numero(ofertas.nadie.length)})`), nombres(ofertas.nadie, 'Todas se han abierto.')),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Plataformas más vistas'), top(plataformas), h('h3', {}, `Nadie la abrió (${numero(plataformas.nadie.length)})`), nombres(plataformas.nadie, 'Todas se han abierto.')));
  }
  return h('section', { class: 'tarjeta' }, h('h2', {}, 'Qué fichas mira la gente'),
    h('p', {}, 'Todavía no se puede saber. La web solo cuenta visitas en la portada, en Academy y en las páginas legales: las fichas de oferta y de plataforma se dejaron sin medir a propósito, por privacidad, y la app no apunta lo que se abre.'),
    h('p', { class: 'nota' }, 'Para saberlo (y también qué botones «Ir a la plataforma» se pulsan) hay que añadir a la web un contador anónimo, sin cookies. Es un cambio en la web, aparte de este panel. En cuanto exista, esta tarjeta enseñará las más vistas y las que nadie abre.'));
}

export async function contenido(raiz, recargar) {
  const cabecera = h('div', { class: 'filtros' }, segmentos(PERIODOS, periodo, v => { periodo = v; recargar(); }),
    h('span', { class: 'nota' }, 'El periodo cambia las visitas de Academy; el inventario es el de ahora'));
  let d;
  try { d = await api(`/api/contenido?periodo=${periodo}`); } catch (e) { poner(raiz, cabecera, bloqueError(e)); return; }
  const c = d.catalogo;
  poner(raiz, 
    cabecera,
    h('div', { class: 'rejilla kpis' },
      kpi('Plataformas', c.error ? '—' : numero(c.plataformas.total), c.error ? null : `${numero(c.plataformas.total - c.plataformas.sinOfertas.length)} con alguna oferta`),
      kpi('Ofertas', c.error ? '—' : numero(c.ofertas.total), c.error ? null : `${numero(c.ofertas.porCategoria.length)} categorías`),
      kpi('Lecciones de Academy', d.academy.error ? '—' : numero(d.academy.total), d.academy.error ? null : `${numero(d.academy.vistas)} lecturas en ${periodo === '7d' ? '7' : '30'} días`),
      kpi('Fuera del radar', Array.isArray(d.descartes) ? numero(d.descartes.length) : '—', 'Fichas de lo que se descartó')),
    c.error ? bloqueError({ message: `No pude leer el catálogo: ${c.error}` }) : [tarjetaPlataformas(c.plataformas), tarjetaOfertas(c.ofertas)],
    tarjetaQueSeMira(d),
    h('div', { class: 'rejilla dos' },
      tarjetaAcademy(d.academy, d),
      h('section', { class: 'tarjeta' }, h('h2', {}, 'Fuera del radar'),
        Array.isArray(d.descartes) ? nombres(d.descartes, 'No hay fichas de descartes.') : bloqueError({ message: d.descartes.error }),
        h('p', { class: 'nota' }, 'Plataformas que se estudiaron y no entran en el radar, con su ficha explicando por qué.'))),
  );
}
