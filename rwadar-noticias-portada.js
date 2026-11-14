'use strict';
/* =====================================================================
   RWAdar · las noticias de Inicio, ya escritas en el HTML (14/11/2026)
   ---------------------------------------------------------------------
   «Noticias que entran por los ojos»: la primera noticia es una portada con
   foto grande. En una tableta o una pantalla grande esa foto es lo más
   grande de la primera pantalla (el LCP), y si la pintara el JavaScript
   llegaría después del JS y del JSON: la carga tardaría el triple (medido el
   13/11). Por eso el publicador escribe en el index.html PUBLICADO la portada
   y las dos tarjetas en castellano, con el mismo marcado que pinta
   assets/noticias-sector-20261110.js, y el JS solo las rehace si hace falta
   (otro idioma u otra edición: modelo.debeRepintar).

   - Nunca se escribe en rwadar-site/index.html: allí la lista sigue vacía y
     con hidden. Así una edición nueva de noticias solo cambia los JSON.
   - Funciones puras: sin reloj, sin Intl y sin leer nada del entorno. La
     misma edición da los mismos bytes en cualquier máquina; sin «Hoy» ni
     «Ayer», que dependen del día de quien mira (los pone el JS).
   - Todo texto va escapado (& < > " ' y =): validarNoticias() ya rechaza < y
     >, pero esto no se fía. El = escapado impide que un titular dispare la
     regla de la CSP (validaMarcadoEstricto busca «on…=» en todo el HTML).
   - Sin atributos style (la CSP es style-src 'self'): el color de la
     categoría va en una clase.
   - validaMarcadoEstricto vive aquí (antes estaba dentro del publicador) para
     que las noticias automáticas hagan, antes de abrir su PR, el mismo camino
     que el publicador: prepararInicioPublicado(html real, edición).
   - sinNoticiasInicio(html) deja el index.html publicado como si no llevara
     noticias: para comparar `main` con producción aunque las noticias de una
     y otra sean de días distintos.
   ===================================================================== */
const modelo = require('./rwadar-movil/lib/noticias-sector');

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '=': '&#61;' };
const esc = valor => String(valor).replace(/[&<>"'=]/g, c => ESCAPES[c]);
const atributos = obj => Object.entries(obj).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');

/* La regla de la CSP de las páginas: sin <style>, sin style= ni on…= y sin
   scripts en línea salvo JSON-LD. */
function validaMarcadoEstricto(nombre, contenido) {
  if (/<style\b/i.test(contenido) || /\sstyle\s*=/i.test(contenido) ||
      /\son[a-z]+\s*=/i.test(contenido)) {
    throw new Error(`${nombre} contiene CSS o manejadores inline incompatibles con la CSP`);
  }
  for (const m of contenido.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    throw new Error(`${nombre} contiene un script ejecutable inline`);
  }
}

/* La foto con los atributos del modelo (los mismos que pone el JS). */
function foto(n, clase, papel) {
  const a = modelo.atributosFoto(n, papel);
  if (!a) return `<span class="${clase} nt-foto--sin" aria-hidden="true"></span>`;
  const { src, srcset, sizes, width, height, decoding, loading } = a;
  const img = { alt: '', width, height, decoding, ...(loading ? { loading } : {}), src, srcset, sizes };
  return `<span class="${clase}" aria-hidden="true"><img${atributos(img)}></span>`;
}
/* «CNMV · 11/11/2026», como metaFuente del JS. */
function meta(n) {
  const traducida = modelo.fuenteTraducida(n, 'es');
  return `<span class="nt-meta"><span class="nt-fuente-corta" lang="${traducida ? 'en' : 'es'}" translate="no">${esc(modelo.fuenteCorta(n, 'es'))}</span>` +
    ` · <time translate="no" lang="es" datetime="${esc(n.fecha)}">${esc(modelo.fechaCorta(n.fecha, 'es'))}</time></span>`;
}

/* La portada y las dos tarjetas de Inicio, en castellano. Recibe la edición
   (la valida otra vez: misma entrada, misma salida). */
function htmlNoticiasInicio(datos) {
  const limpios = modelo.validarNoticias(datos);
  const lista = limpios.noticias.slice(0, modelo.EN_INICIO);
  return lista.map((n, i) => {
    const href = '/mercado/#' + encodeURIComponent(n.id);
    const titular = `<span class="${i === 0 ? 'nt-p-tit' : 'nt-t-tit'}" translate="no" lang="es">${esc(n.titulo)}</span>`;
    if (i === 0) {
      return `<li class="nt-v-portada"><a class="nt-p" href="${esc(href)}" data-nt-id="${esc(n.id)}">${foto(n, 'nt-p-foto', 'portada')}` +
        `<span class="nt-p-txt"><span class="nt-p-cat nt-cat--${esc(n.categoria)}" aria-hidden="true">${esc(modelo.etiquetaCategoria(n.categoria, 'es'))}</span>` +
        `${titular}${meta(n)}</span></a></li>`;
    }
    const ancha = modelo.esAncha(i, lista.length);
    return `<li${ancha ? ' class="nt-v-ancha"' : ''}><a class="nt-t" href="${esc(href)}" data-nt-id="${esc(n.id)}">${foto(n, 'nt-t-foto', modelo.papelTarjeta(i, lista.length))}` +
      `<span class="nt-t-txt">${titular}${meta(n)}</span></a></li>`;
  }).join('');
}

const LISTA = /<ul class="nt-v" id="ntLista"([^>]*)><\/ul>/g;
const ESTADO = '<p class="nt-estado" id="ntEstado" role="status">Cargando las noticias…</p>';
const NOTA = '<p class="nt-nota" id="ntNota" hidden>';
function unaVez(html, buscado, que) {
  const n = html.split(buscado).length - 1;
  if (n !== 1) throw new Error(`index.html: ${que} aparece ${n} veces (se espera 1)`);
}
/* Mete las noticias en la lista de Inicio (vacía y con hidden en la fuente),
   le quita hidden, le pone la firma, oculta «Cargando las noticias…» y
   enseña la nota de las fotos. Si algo no está como se espera, lanza (el
   publicador se para). */
function inyectarNoticiasInicio(html, datos) {
  const listas = [...html.matchAll(LISTA)];
  if (listas.length !== 1) throw new Error(`index.html: la lista de noticias vacía (<ul class="nt-v" id="ntLista" … hidden>) aparece ${listas.length} veces (se espera 1)`);
  const attrs = listas[0][1];
  if (!/\shidden(?=\s|$)/.test(attrs) || /data-nt-prepintado/.test(attrs)) throw new Error('index.html: la lista de noticias de la fuente debe estar vacía y con hidden');
  unaVez(html, ESTADO, '«Cargando las noticias…»');
  unaVez(html, NOTA, 'la nota de las fotos');
  const firma = modelo.firmaPrepintado(modelo.validarNoticias(datos));
  const items = htmlNoticiasInicio(datos);
  return html
    .replace(LISTA, () => `<ul class="nt-v" id="ntLista"${attrs.replace(/\shidden(?=\s|$)/, '')} data-nt-prepintado="${firma}">${items}</ul>`)
    .replace(ESTADO, ESTADO.replace('role="status"', 'role="status" hidden'))
    .replace(NOTA, '<p class="nt-nota" id="ntNota">');
}
/* El camino del publicador entero: inyectar y pasar la regla de la CSP. */
function prepararInicioPublicado(html, datos) {
  const salida = inyectarNoticiasInicio(html, datos);
  validaMarcadoEstricto('index.html con las noticias', salida);
  return salida;
}
/* El index.html publicado, sin las noticias (como lo deja la fuente). */
function sinNoticiasInicio(html) {
  return String(html)
    .replace(/<ul class="nt-v" id="ntLista"([^>]*?) data-nt-prepintado="[0-9a-f]{8}">[\s\S]*?<\/ul>/, '<ul class="nt-v" id="ntLista"$1 hidden></ul>')
    .replace(ESTADO.replace('role="status"', 'role="status" hidden'), ESTADO)
    .replace('<p class="nt-nota" id="ntNota">', NOTA);
}

module.exports = { esc, validaMarcadoEstricto, htmlNoticiasInicio, inyectarNoticiasInicio, prepararInicioPublicado, sinNoticiasInicio };
