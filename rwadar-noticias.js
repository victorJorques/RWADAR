/* =====================================================================
   RWAdar · Noticias de Inicio: de un archivo a la web y a la app
   ---------------------------------------------------------------------
   La fuente es rwadar-noticias/noticias.json: lo que RWAdar cuenta (y, si
   se publicó en redes, el enlace a esa publicación). Este script lo
   comprueba y escribe:

     rwadar-site/index.html                 el bloque de noticias de Inicio
     rwadar-movil/lib/noticias-contenido.js las mismas noticias para la app

   Uso:  node rwadar-noticias.js              genera
         node rwadar-noticias.js --comprobar  solo comprueba que está al día

   No toca la red. Una noticia mal formada para el script: mejor eso que
   publicar una fecha futura o un enlace que no lleva a ningún sitio.
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const FUENTE = path.join(RAIZ, 'rwadar-noticias', 'noticias.json');
const INDEX_WEB = path.join(RAIZ, 'rwadar-site', 'index.html');
const DATOS_APP = path.join(RAIZ, 'rwadar-movil', 'lib', 'noticias-contenido.js');
const MAX_NOTICIAS = 12;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

/* Adónde puede llevar una noticia. La web usa anclas reales de la portada
   (data-movil-ir abre la pestaña Buscar en el móvil); la app, sus pestañas. */
const DESTINOS = Object.freeze({
  academy: { texto: 'Abrir la Academy', href: '/academy/', movilIr: null, app: 'academy' },
  buscar: { texto: 'Ver el radar', href: '#tool', movilIr: 'tool', app: 'buscar' },
  ofertas: { texto: 'Ver las ofertas', href: '#emisiones', movilIr: 'emisiones', app: 'ofertas' },
  fuera: { texto: 'Ver los descartes', href: '#fuera', movilIr: 'fuera', app: 'fuera' },
});

class ErrorNoticias extends Error {}
const falla = (donde, mensaje) => { throw new ErrorNoticias(`${donde}: ${mensaje}`); };
const esc = valor => String(valor)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}
function fechaCorta(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}
function texto(valor, donde, campo, max) {
  if (typeof valor !== 'string' || !valor.trim()) falla(donde, `falta «${campo}»`);
  const limpio = valor.trim();
  if (limpio.length > max) falla(donde, `«${campo}» tiene ${limpio.length} caracteres (máximo ${max})`);
  if (/[<>]/.test(limpio)) falla(donde, `«${campo}» no puede llevar < ni >`);
  return limpio;
}

function cargarNoticias(hoy = new Date().toISOString().slice(0, 10)) {
  let datos;
  try { datos = JSON.parse(fs.readFileSync(FUENTE, 'utf8')); }
  catch (e) { falla('rwadar-noticias/noticias.json', `no se puede leer: ${e.message}`); }
  if (datos.version !== 1 || !Array.isArray(datos.noticias)) falla('noticias.json', 'formato desconocido');
  const vistos = new Set();
  const noticias = datos.noticias.map((n, i) => {
    const donde = `noticia ${i + 1}${n && n.id ? ` (${n.id})` : ''}`;
    if (!n || typeof n !== 'object') falla(donde, 'no es un objeto');
    const permitidos = new Set(['id', 'fecha', 'etiqueta', 'titulo', 'texto', 'destino', 'red']);
    for (const clave of Object.keys(n)) if (!permitidos.has(clave)) falla(donde, `campo desconocido «${clave}»`);
    if (typeof n.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,60}$/.test(n.id)) falla(donde, 'id no válido (minúsculas, números y guiones)');
    if (vistos.has(n.id)) falla(donde, 'id repetido');
    vistos.add(n.id);
    if (!fechaValida(n.fecha)) falla(donde, 'fecha no válida (AAAA-MM-DD)');
    if (n.fecha > hoy) falla(donde, `fecha futura (${n.fecha}): una noticia se publica cuando ya es verdad`);
    const salida = {
      id: n.id, fecha: n.fecha, fechaTexto: fechaCorta(n.fecha),
      etiqueta: texto(n.etiqueta, donde, 'etiqueta', 20),
      titulo: texto(n.titulo, donde, 'titulo', 90),
      texto: texto(n.texto, donde, 'texto', 320),
    };
    if (n.destino !== undefined) {
      if (!DESTINOS[n.destino]) falla(donde, `destino desconocido «${n.destino}» (${Object.keys(DESTINOS).join(', ')})`);
      salida.destino = n.destino;
    }
    if (n.red !== undefined) {
      const red = n.red;
      if (!red || typeof red !== 'object') falla(donde, '«red» debe ser {nombre, url}');
      let url;
      try { url = new URL(red.url); } catch { falla(donde, 'la url de «red» no es válida'); }
      if (url.protocol !== 'https:') falla(donde, 'la url de «red» debe empezar por https://');
      salida.red = { nombre: texto(red.nombre, donde, 'red.nombre', 30), url: url.href };
    }
    return salida;
  });
  noticias.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id));
  return noticias.slice(0, MAX_NOTICIAS);
}

function bloqueWeb(noticias) {
  const items = noticias.map(n => {
    const d = n.destino && DESTINOS[n.destino];
    const enlaces = [
      d ? `<a class="inicio-noticia-enlace" href="${d.href}"${d.movilIr ? ` data-movil-ir="${d.movilIr}"` : ''}>${esc(d.texto)} <span aria-hidden="true">→</span></a>` : '',
      n.red ? `<a class="inicio-noticia-red" href="${esc(n.red.url)}" target="_blank" rel="noopener">Ver en ${esc(n.red.nombre)} <span aria-hidden="true">↗</span></a>` : '',
    ].filter(Boolean).join('\n          ');
    return `      <li>
        <article class="inicio-noticia" aria-labelledby="noticia-${n.id}">
          <p class="inicio-noticia-meta"><span class="inicio-etiqueta">${esc(n.etiqueta)}</span><time datetime="${n.fecha}">${n.fechaTexto}</time></p>
          <h4 id="noticia-${n.id}">${esc(n.titulo)}</h4>
          <p>${esc(n.texto)}</p>${enlaces ? `\n          ${enlaces}` : ''}
        </article>
      </li>`;
  }).join('\n');
  return `    <!--noticias:ini-->
    <ol class="inicio-noticias" aria-label="Noticias de RWAdar">
${items}
    </ol>
    <!--noticias:fin-->`;
}

function moduloApp(noticias) {
  const destinos = Object.fromEntries(Object.entries(DESTINOS).map(([k, d]) => [k, { texto: d.texto, app: d.app }]));
  return `/* GENERADO por rwadar-noticias.js a partir de rwadar-noticias/noticias.json.
   No se edita a mano: cambia el JSON y ejecuta node rwadar-noticias.js. */
export const DESTINOS_NOTICIAS = ${JSON.stringify(destinos)};

export const NOTICIAS = [
${noticias.map(n => `  ${JSON.stringify(n)},`).join('\n')}
];
`;
}

function reemplazarEntreMarcas(textoActual, ini, fin, nuevo, donde) {
  const a = textoActual.indexOf(ini);
  const b = textoActual.indexOf(fin);
  if (a === -1 || b === -1 || b < a || textoActual.indexOf(ini, a + 1) !== -1) {
    throw new ErrorNoticias(`${donde}: faltan las marcas ${ini} … ${fin} (o están repetidas)`);
  }
  const lineaIni = textoActual.lastIndexOf('\n', a) + 1;
  return textoActual.slice(0, lineaIni) + nuevo + textoActual.slice(b + fin.length);
}

function construirSalidas(noticias = cargarNoticias()) {
  const index = fs.readFileSync(INDEX_WEB, 'utf8');
  return new Map([
    [INDEX_WEB, reemplazarEntreMarcas(index, '<!--noticias:ini-->', '<!--noticias:fin-->', bloqueWeb(noticias),
      'rwadar-site/index.html')],
    [DATOS_APP, moduloApp(noticias)],
  ]);
}

function comprobar(noticias = cargarNoticias()) {
  const diferencias = [];
  for (const [archivo, contenido] of construirSalidas(noticias)) {
    const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    if (actual !== contenido) diferencias.push(path.relative(RAIZ, archivo));
  }
  return diferencias;
}

function generar(noticias = cargarNoticias()) {
  const escritos = [];
  for (const [archivo, contenido] of construirSalidas(noticias)) {
    const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : null;
    if (actual !== contenido) { fs.writeFileSync(archivo, contenido, 'utf8'); escritos.push(path.relative(RAIZ, archivo)); }
  }
  return escritos;
}

module.exports = { DESTINOS, cargarNoticias, bloqueWeb, construirSalidas, comprobar, generar, ErrorNoticias };

if (require.main === module) {
  try {
    const noticias = cargarNoticias();
    if (process.argv.includes('--comprobar')) {
      const diferencias = comprobar(noticias);
      if (diferencias.length) {
        console.error('Las noticias no están al día. Ejecuta: node rwadar-noticias.js');
        for (const d of diferencias) console.error(`  - ${d}`);
        process.exit(1);
      }
      console.log(`Noticias al día: ${noticias.length}.`);
    } else {
      const escritos = generar(noticias);
      console.log(`Noticias: ${noticias.length}.`);
      console.log(escritos.length ? escritos.map(e => `  escrito: ${e}`).join('\n') : '  Nada que cambiar.');
    }
  } catch (e) {
    if (e instanceof ErrorNoticias) {
      console.error(`ERROR EN LAS NOTICIAS · ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
