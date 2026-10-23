/* =====================================================================
   RWAdar · panel · catálogo y Academy por dentro
   ---------------------------------------------------------------------
   Qué hay publicado:
     · plataformas y ofertas, de las vistas públicas del catálogo (clave
       publicable, lo mismo que ve cualquier visitante): por categoría,
       acceso, región, cuántas ofertas tiene cada plataforma y cuánto
       hace que se verificó cada cosa,
     · las lecciones publicadas de Academy, de su portada,
     · las fichas «fuera del radar», del mapa de la web.
   Y qué mira la gente, cruzado con las visitas de Cloudflare.

   Ojo: la web solo carga la analítica en la portada, las páginas legales
   y Academy (assets/analitica-*.js, decisión de privacidad). Las fichas
   de oferta y plataforma no se miden, así que de ellas no hay visitas;
   cuando se mida, el panel las cruza solo (fichasMedidas).
   Lo que se mira dentro de la app tampoco se apunta.
   ===================================================================== */
'use strict';
const { ErrorPanel, pedir, pedirJson } = require('./pedir');

const DIA_MS = 86400000;
const VIEJA_DIAS = 60;
const ENTIDADES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
const descodificar = texto => String(texto).replace(/&(amp|quot|#39|lt|gt|nbsp);/g, e => ENTIDADES[e]).trim();
const humanizar = slug => slug.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
const TIPOS = { valor: 'Precio de referencia', rendimiento: 'Rentabilidad' };

/* «/ofertas/abc.html?x=1» y «/ofertas/abc/» son la misma ficha. */
function rutaLimpia(ruta) {
  const r = String(ruta || '/').split(/[?#]/)[0].replace(/\.html$/, '').replace(/\/index$/, '/');
  return r.length > 1 ? r.replace(/\/$/, '') : '/';
}

/* Suma visitas y páginas vistas por ruta limpia. */
function vistasPorRuta(paginas) {
  const mapa = new Map();
  for (const p of paginas || []) {
    const r = rutaLimpia(p.nombre);
    const antes = mapa.get(r) || { paginas: 0, visitas: 0 };
    mapa.set(r, { paginas: antes.paginas + (p.paginas || 0), visitas: antes.visitas + (p.visitas || 0) });
  }
  return mapa;
}

function leccionesDeAcademy(html) {
  const lecciones = [];
  const patron = /<a[^>]*class="ac-tarjeta"[^>]*href="\/academy\/([a-z0-9-]+)"[^>]*>[\s\S]*?class="ac-tarjeta-tit"[^>]*>([^<]+)</g;
  for (const m of String(html).matchAll(patron)) {
    if (!lecciones.some(l => l.slug === m[1])) lecciones.push({ slug: m[1], nombre: descodificar(m[2]) });
  }
  return lecciones;
}

function descartesDelMapa(xml) {
  const slugs = [...String(xml).matchAll(/<loc>[^<]*\/fuera-del-radar\/([a-z0-9-]+)\/?<\/loc>/g)].map(m => m[1]);
  return [...new Set(slugs)].map(slug => ({ slug, nombre: humanizar(slug) }));
}

/* Pone a cada ficha sus vistas y separa las que nadie abrió. */
function cruzar(fichas, prefijo, vistas) {
  const lista = fichas
    .map(f => ({ ...f, ruta: `${prefijo}/${f.slug}`, ...(vistas.get(`${prefijo}/${f.slug}`) || { paginas: 0, visitas: 0 }) }))
    .sort((a, b) => b.paginas - a.paginas || a.nombre.localeCompare(b.nombre, 'es'));
  return {
    total: lista.length,
    abiertas: lista.filter(f => f.paginas > 0).length,
    vistas: lista.reduce((s, f) => s + f.paginas, 0),
    lista,
    nadie: lista.filter(f => f.paginas === 0).map(f => f.nombre),
  };
}

function contar(lista, campo, nombrar = v => v) {
  const mapa = new Map();
  for (const x of lista) {
    const clave = x[campo] ?? null;
    mapa.set(clave, (mapa.get(clave) || 0) + 1);
  }
  return [...mapa].map(([v, n]) => ({ nombre: v === null || v === '' ? 'Sin dato' : nombrar(v), n })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

/* Cuántas fichas se verificaron cada día, de la más antigua a la más nueva. */
function verificaciones(lista, ahora) {
  return contar(lista, 'verificadaEl')
    .map(v => ({ fecha: v.nombre, n: v.n, dias: Number.isNaN(Date.parse(v.nombre)) ? null : Math.floor((ahora - Date.parse(`${v.nombre}T00:00:00Z`)) / DIA_MS) }))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

function inventario({ plataformas, ofertas }, ahora) {
  const porPlataforma = new Map();
  for (const o of ofertas) porPlataforma.set(o.plataforma, (porPlataforma.get(o.plataforma) || 0) + 1);
  const nombrePlataforma = new Map(plataformas.map(p => [p.slug, p.nombre]));
  const verifP = verificaciones(plataformas, ahora);
  const verifO = verificaciones(ofertas, ahora);
  const viejas = lista => lista.filter(v => v.dias !== null && v.dias > VIEJA_DIAS).reduce((s, v) => s + v.n, 0);
  return {
    plataformas: {
      total: plataformas.length,
      porCategoria: contar(plataformas, 'categoria'),
      porAcceso: contar(plataformas, 'acceso'),
      porRegion: contar(plataformas, 'region'),
      /* Hay ofertas de proveedores sin ficha de plataforma propia: se marcan. */
      conMasOfertas: [...porPlataforma]
        .map(([slug, n]) => ({ nombre: nombrePlataforma.get(slug) || ofertas.find(o => o.plataforma === slug)?.de || humanizar(String(slug)), n, conFicha: nombrePlataforma.has(slug) }))
        .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es')),
      sinOfertas: plataformas.filter(p => !porPlataforma.has(p.slug)).map(p => p.nombre),
      verificadas: verifP,
      sinRevisarMasDe60: viejas(verifP),
    },
    ofertas: {
      total: ofertas.length,
      porCategoria: contar(ofertas, 'categoria'),
      porTipo: contar(ofertas, 'tipo', v => TIPOS[v] || v),
      verificadas: verifO,
      sinRevisarMasDe60: viejas(verifO),
    },
  };
}

function crearContenido({ config, trafico }) {
  const publica = { headers: { apikey: config.clavePublica } };

  async function catalogo() {
    const rest = `${config.supabase}/rest/v1`;
    const [plat, ofer] = await Promise.all([
      pedirJson(`${rest}/catalogo_plataformas_publicas_v2?select=slug,nombre,categoria,acceso,region,verificada_el`, publica),
      pedirJson(`${rest}/catalogo_ofertas_publicas_v2?select=slug,titulo,tipo,categoria,plataforma_slug,plataforma_nombre,verificada_el`, publica),
    ]);
    if (!Array.isArray(plat.datos) || !Array.isArray(ofer.datos)) throw new ErrorPanel('Supabase no devolvió el catálogo publicado', { estado: 502 });
    return {
      plataformas: plat.datos.filter(p => p.slug).map(p => ({
        slug: p.slug, nombre: p.nombre || humanizar(p.slug), categoria: p.categoria, acceso: p.acceso, region: p.region, verificadaEl: p.verificada_el || null,
      })),
      ofertas: ofer.datos.filter(o => o.slug).map(o => ({
        slug: o.slug, nombre: o.titulo || humanizar(o.slug), tipo: o.tipo, categoria: o.categoria,
        plataforma: o.plataforma_slug, de: o.plataforma_nombre || null, verificadaEl: o.verificada_el || null,
      })),
    };
  }

  async function deLaWeb(ruta) {
    const r = await pedir(`${config.web}${ruta}`);
    if (!r.ok) throw new ErrorPanel(`La web respondió ${r.estado} en ${ruta}`, { estado: 502 });
    return r.texto;
  }

  async function resumen(periodo = '30d', ahora = Date.now()) {
    const [cat, academy, mapa, visitas] = await Promise.allSettled([catalogo(), deLaWeb('/academy/'), deLaWeb('/sitemap.xml'), trafico(periodo)]);
    const t = visitas.status === 'fulfilled' ? visitas.value : null;
    const vistas = vistasPorRuta(t ? (t.paginasTodas || t.paginas) : []);
    const fichasMedidas = [...vistas.keys()].some(r => /^\/(ofertas|plataformas|fuera-del-radar)\/./.test(r));
    const fallo = x => ({ error: x.reason?.message || 'sin respuesta' });
    return {
      periodo, desde: t?.desde || null, hasta: t?.hasta || null, estimado: Boolean(t?.estimado),
      visitasError: visitas.status === 'rejected' ? visitas.reason?.message || 'sin respuesta' : null,
      fichasMedidas,
      catalogo: cat.status === 'fulfilled' ? inventario(cat.value, ahora) : fallo(cat),
      vistasFichas: cat.status === 'fulfilled' && fichasMedidas
        ? { plataformas: cruzar(cat.value.plataformas, '/plataformas', vistas), ofertas: cruzar(cat.value.ofertas, '/ofertas', vistas) }
        : null,
      academy: academy.status === 'fulfilled'
        ? { ...cruzar(leccionesDeAcademy(academy.value), '/academy', vistas), portada: vistas.get('/academy') || { paginas: 0, visitas: 0 }, medida: Boolean(t) }
        : fallo(academy),
      descartes: mapa.status === 'fulfilled' ? descartesDelMapa(mapa.value).map(d => d.nombre) : fallo(mapa),
    };
  }

  return { resumen };
}

module.exports = { crearContenido, rutaLimpia, vistasPorRuta, leccionesDeAcademy, descartesDelMapa, cruzar, inventario };
