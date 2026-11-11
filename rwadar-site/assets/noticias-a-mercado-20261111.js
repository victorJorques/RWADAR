'use strict';
/* /noticias/ y /noticias/#<id> llevan a /mercado/ (11/11/2026): las noticias
   van ahora en «Mercado y noticias», debajo del gráfico. El enlace de cada
   noticia se conserva: /noticias/#<id> abre /mercado/#<id>, donde
   noticias-sector-20261110.js abre su detalle. Sin ancla, a la parte de
   noticias (#noticias). Solo se aceptan anclas [a-z0-9-]. */
(() => {
  const ancla = /^#[a-z0-9-]{1,80}$/.test(location.hash || '') ? location.hash : '#noticias';
  location.replace('/mercado/' + ancla);
})();
