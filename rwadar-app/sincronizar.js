/* =====================================================================
   RWAdar · sincroniza la web con la base de datos
   ---------------------------------------------------------------------
   Lee el contenido desde Supabase y reescribe los arrays P, FUERA y EMI
   dentro del JavaScript externo versionado de la web.

   Por qué así y no leyendo desde el navegador: si la página pidiera los
   datos al cargar, el robot de Google volvería a encontrarla vacía y
   perderíamos el pre-renderizado. Generando en tiempo de publicación,
   la base de datos manda y el HTML sigue pre-renderizado. Mantener los
   datos en un recurso externo permite una CSP sin JavaScript inline.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const {
  CUENTA_PLATAFORMAS,
  CUENTA_OFERTAS,
  validarLotePublico,
} = require('./catalogo-publico.js');

const URL_BASE = 'https://exgpmjpaaebyoolpwced.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_IjVAwxotgiimcVqI3Nnn3Q_dk7UOB5n';
const SITIO = path.join(__dirname, '..', 'rwadar-site');
const JS = path.join(SITIO, 'assets', 'rwadar-20260820.js');
const CSV = path.join(SITIO, 'rwadar.csv');

async function pedir(ruta, fetchFn = globalThis.fetch) {
  if (typeof fetchFn !== 'function') throw new Error('fetch no está disponible');
  const r = await fetchFn(`${URL_BASE}/${ruta}`, { headers: { apikey: CLAVE } });
  if (!r.ok) throw new Error(`${ruta} -> HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

/* Literal seguro para JavaScript externo. Aunque `</script>` no cierra un
   recurso externo, neutralizar los signos y separadores evita que el mismo
   dato se convierta en inyección si en el futuro se mueve de contexto. */
const j = (s) => JSON.stringify(s == null ? '' : String(s))
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const jsonSeguro = valor => JSON.stringify(valor)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const esHttps = (valor) => {
  try { return new URL(String(valor)).protocol === 'https:'; }
  catch { return false; }
};

function escribirAtomico(archivo, contenido) {
  const temporal = `${archivo}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, contenido, 'utf8');
  try { fs.renameSync(temporal, archivo); }
  finally { if (fs.existsSync(temporal)) fs.rmSync(temporal, { force: true }); }
}

/* Excel y otras hojas interpretan como fórmula las celdas que empiezan por
   =, +, - o @, incluso tras espacios/tabuladores. El apóstrofo fuerza texto
   antes de aplicar el escapado CSV normal. */
function celdaCSV(valor) {
  let texto = String(valor == null ? '' : valor);
  if (/^[\t\r\n ]*[=+\-@]/.test(texto)) texto = "'" + texto;
  return `"${texto.replace(/"/g, '""')}"`;
}

function textoObligatorio(valor, nombre, maximo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto || texto.length > maximo) throw new Error(`${nombre} no válido`);
  return texto;
}

function plataformaPublica(p) {
  const x = {
    revisionId: textoObligatorio(p.revision_id, 'revisión de plataforma', 36),
    slug: textoObligatorio(p.slug, 'slug de plataforma', 140),
    n: textoObligatorio(p.nombre, 'nombre de plataforma', 120),
    cat: textoObligatorio(p.categoria, 'categoría de plataforma', 80),
    tipo: textoObligatorio(p.actor, 'actor de plataforma', 80),
    reg: textoObligatorio(p.region, 'región de plataforma', 100),
    cadenas: textoObligatorio(p.cadenas, 'cadenas de plataforma', 160),
    ticket: textoObligatorio(p.ticket, 'ticket de plataforma', 40),
    acceso: textoObligatorio(p.acceso, 'acceso canónico', 40),
    web: textoObligatorio(p.web, 'web de plataforma', 500),
    aval: textoObligatorio(p.aval, 'aval de plataforma', 2000),
    nota: textoObligatorio(p.nota, 'descripción de plataforma', 3000),
    ver: textoObligatorio(p.verificada_el, 'fecha canónica', 10),
    verificacionLocal: p.verificacion_local,
  };
  if (!esHttps(x.web) || !/^\d{4}-\d{2}-\d{2}$/.test(x.ver)) {
    throw new Error(`plataforma pública inválida: ${x.slug}`);
  }
  return x;
}

function ofertaPublica(o) {
  const x = {
    catalogo: true,
    revisionId: textoObligatorio(o.revision_id, 'revisión de oferta', 36),
    slug: textoObligatorio(o.slug, 'slug de oferta', 180),
    tipo: textoObligatorio(o.tipo, 'tipo de oferta', 30),
    titulo: textoObligatorio(o.titulo, 'título de oferta', 180),
    plataformaSlug: textoObligatorio(o.plataforma_slug, 'slug de proveedor', 140),
    plataformaNombre: textoObligatorio(o.plataforma_nombre, 'proveedor', 120),
    categoria: textoObligatorio(o.categoria, 'categoría de oferta', 80),
    pais: o.pais == null ? null : textoObligatorio(o.pais, 'país de oferta', 100),
    resumen: textoObligatorio(o.resumen, 'resumen de oferta', 3000),
    url: textoObligatorio(o.url, 'URL de oferta', 1000),
    verificadaEl: textoObligatorio(o.verificada_el, 'fecha de oferta', 10),
    vigenciaDias: Number(o.vigencia_dias),
    permanente: o.permanente === true,
    disponibleEs: o.disponible_es == null ? null : o.disponible_es === true,
    eu: o.eu == null ? null : o.eu === true,
    fueraLadrillo: o.fuera_ladrillo === true,
    puntuacion: o.puntuacion == null ? null : Number(o.puntuacion),
    rentabilidad: o.rentabilidad == null ? null : o.rentabilidad,
    precio: o.precio == null ? null : o.precio,
    metricas: o.metricas,
    avisos: o.avisos,
    estadoRevision: textoObligatorio(o.estado_revision, 'estado de oferta', 40),
    fuentesActuales: o.fuentes_actuales,
    documentacion: o.documentacion ?? null,
    patrocinada: o.patrocinada === true,
  };
  if (!esHttps(x.url) || !Number.isInteger(x.vigenciaDias) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(x.verificadaEl)) {
    throw new Error(`oferta pública inválida: ${x.slug}`);
  }
  return x;
}

async function main({
  fetchFn = globalThis.fetch,
  jsPath = JS,
  csvPath = CSV,
  hoy = new Date(),
} = {}) {
  const [radar, fuera, emisiones] = await Promise.all([
    pedir('catalogo_plataformas_publicas?select=*', fetchFn),
    pedir('plataformas?estado=eq.descartada&select=nombre,etiqueta_descarte,motivo_descarte,' +
      'fuentes(url,titulo)&order=nombre', fetchFn),
    pedir('catalogo_ofertas_publicas?select=*', fetchFn),
  ]);

  if (!Array.isArray(fuera) || fuera.length !== 4) {
    throw new Error('el catálogo público debe contener exactamente 4 descartes documentados');
  }
  validarLotePublico(radar, emisiones, { hoy });
  const plataformas = radar.map(plataformaPublica);
  const ofertas = emisiones.map(ofertaPublica);
  if (plataformas.length !== CUENTA_PLATAFORMAS || ofertas.length !== CUENTA_OFERTAS) {
    throw new Error('el lote cambió durante la normalización');
  }

  const P = plataformas.map(p => ` ${jsonSeguro(p)},`).join('\n');

  const F = fuera.map(f => {
    const fuentes = (f.fuentes || [])
      .map(s => `{url:${j(s.url)},titulo:${j(s.titulo)}}`)
      .join(',');
    return ` {n:${j(f.nombre)},badge:${j(f.etiqueta_descarte)},why:${j(f.motivo_descarte)},` +
           `fuentes:[${fuentes}]},`;
  }).join('\n');

  let script = fs.readFileSync(jsPath, 'utf8');

  const sustituir = (nombre, cuerpo) => {
    const ini = script.indexOf(`const ${nombre}=[`);
    if (ini < 0) throw new Error(`no encuentro el array ${nombre}`);
    const fin = script.indexOf('\n];', ini);
    if (fin < 0) throw new Error(`no encuentro el cierre de ${nombre}`);
    script = script.slice(0, ini) + `const ${nombre}=[\n${cuerpo}` + script.slice(fin);
  };

  const E = ofertas.map(e => ` ${jsonSeguro(e)},`).join('\n');

  sustituir('P', P);
  sustituir('FUERA', F);
  sustituir('EMI', E);

  /* No sustituimos el archivo hasta haber generado y validado los tres
     bloques completos. Si el proceso cae antes, la fuente anterior queda. */
  new Function(script);
  escribirAtomico(jsPath, script);

  /* El mismo CSV que descarga el botón de la página, pero como archivo de
     verdad en una dirección estable. El botón exporta lo que el visitante
     tenga filtrado, que es mejor para él pero no existe para nadie más:
     un rastreador no puede pulsar un botón, y el `distribution` de los
     datos estructurados necesita una URL que se pueda abrir. Se genera
     aquí porque es donde ya están los datos en la mano. */
  const cabecera = ['Estado','Nombre','Categoria','Tipo','Region','Cadenas',
                    'Entrada','Acceso','Web','Descripcion','Por que','Fuentes'];
  const filas = [
    ...radar.map(p => ['En el radar', p.nombre, p.categoria, p.actor, p.region,
      p.cadenas, p.ticket, p.acceso, p.web, p.nota, p.aval, '']),
    ...fuera.map(f => ['Descartada', f.nombre, '', '', '', '', '', '', '', '',
      `${f.etiqueta_descarte}: ${f.motivo_descarte}`,
      (f.fuentes || []).map(s => s.url).join(' | ')]),
  ];
  /* El ﻿ de delante es la marca de orden de bytes. Sin ella, Excel en
     español abre el archivo como Windows-1252 y "Asia-Pacífico" se lee
     "Asia-PacÃ­fico". Los analizadores serios la descartan sin rechistar,
     así que sale gratis. El botón de la página hace lo mismo. */
  escribirAtomico(csvPath,
    '﻿' + [cabecera.join(','), ...filas.map(r => r.map(celdaCSV).join(','))].join('\n') + '\n');

  console.log(`Sincronizado desde Supabase: ${radar.length} plataformas verificadas, ${fuera.length} descartadas y ${emisiones.length} ofertas clasificadas.`);
  console.log(`rwadar.csv regenerado: ${filas.length} filas.`);
}

module.exports = {
  celdaCSV,
  jsonSeguro,
  plataformaPublica,
  ofertaPublica,
  sincronizar: main,
};
if (require.main === module) {
  main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
}
