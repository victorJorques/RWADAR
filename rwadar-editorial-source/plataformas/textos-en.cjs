'use strict';
/* Textos del radar en inglés (27/11/2026): el aval, la nota, el acceso, el ticket y la verificación local (licencia,
   actividad, acceso y alertas) de cada plataforma los escribe
   RWAdar en castellano; su versión inglesa vive en textos-en.json (clave = el texto exacto del catálogo) y este
   guion la escribe en el diccionario común ES→EN (rwadar-movil/lib/idioma-en.js, entre «radar:inicio» y
   «radar:fin»), que la web y la app usan para traducir.

     node rwadar-editorial-source/plataformas/textos-en.cjs              (escribe el bloque; después
                                                                          node rwadar-movil/scripts/copiar-idiomas-web.cjs)
     node rwadar-editorial-source/plataformas/textos-en.cjs --comprobar  (solo mira; lo llama probar-web.mjs)

   --comprobar falla si el bloque no es el del JSON y AVISA (sin fallar) de los textos del catálogo sin inglés:
   en cada ciclo del catálogo con plataformas nuevas o textos cambiados, se añaden aquí. */
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '../..');
const FUENTE = path.join(__dirname, 'textos-en.json');
const DICCIONARIO = path.join(raiz, 'rwadar-movil/lib/idioma-en.js');
const CATALOGO = path.join(raiz, 'rwadar-site/assets/catalogo-publico-20261022.js');
const INI = '  // radar:inicio (GENERADO por rwadar-editorial-source/plataformas/textos-en.cjs)\n', FIN = '  // radar:fin\n';
const ANCLA = '  // paises:inicio';

function leerTextos() {
  const d = JSON.parse(fs.readFileSync(FUENTE, 'utf8'));
  const t = d && d.textos;
  if (!t || typeof t !== 'object') throw new Error('textos-en.json sin «textos»');
  for (const [es, en] of Object.entries(t)) {
    if (typeof en !== 'string' || !en.trim() || en === es) throw new Error(`sin traducción válida: ${es.slice(0, 60)}`);
  }
  return t;
}

function bloque(t) {
  return INI + Object.entries(t).map(([es, en]) => '  ' + JSON.stringify(es) + ': ' + JSON.stringify(en) + ',\n').join('') + FIN;
}

function diccionarioNuevo(t) {
  const d = fs.readFileSync(DICCIONARIO, 'utf8');
  const i = d.indexOf(INI), j = d.indexOf(FIN);
  if (i >= 0 && j > i) return d.slice(0, i) + bloque(t) + d.slice(j + FIN.length);
  const a = d.indexOf(ANCLA);
  if (a < 0) throw new Error('no encuentro dónde poner el bloque en idioma-en.js');
  return d.slice(0, a) + bloque(t) + d.slice(a);
}

/* Los textos del catálogo publicado (aval, nota, acceso, ticket) que aún no tienen inglés. */
function sinIngles(t) {
  const { leerBloquesCatalogo } = require(path.join(raiz, 'rwadar-fichas.js'));
  const c = leerBloquesCatalogo(fs.readFileSync(CATALOGO, 'utf8'));
  const dic = require(DICCIONARIO);
  const falta = new Set();
  const mira = (slug, k, valor) => { const v = typeof valor === 'string' ? valor.trim() : ''; if (v && !t[v] && !dic[v]) falta.add(`${slug} · ${k}: ${v.slice(0, 80)}`); };
  for (const p of [...c.plataformas, ...(c.fuera || [])]) {
    for (const k of ['aval', 'nota', 'acceso', 'ticket']) mira(p.slug, k, p[k]);
    // Lo que enseña la ficha cuando hay verificación local: licencia, actividad, acceso y alertas.
    const v = p.verificacionLocal || {};
    for (const k of ['licenciaRegistro', 'estadoOperativo', 'acceso']) mira(p.slug, k, v[k] && v[k].detalle);
    for (const a of v.alertasCriticas || []) mira(p.slug, 'alerta', a && a.detalle);
  }
  return [...falta];
}

if (require.main === module) {
  const t = leerTextos();
  if (process.argv.includes('--comprobar')) {
    if (fs.readFileSync(DICCIONARIO, 'utf8') !== diccionarioNuevo(t)) {
      console.error('El diccionario no lleva los textos del radar de textos-en.json: node rwadar-editorial-source/plataformas/textos-en.cjs');
      process.exit(1);
    }
    const falta = sinIngles(t);
    if (falta.length) console.warn(`AVISO: ${falta.length} textos del radar sin inglés (añádelos a textos-en.json):\n  ` + falta.join('\n  '));
    console.log(`Textos del radar en inglés: ${Object.keys(t).length}, al día en el diccionario.`);
  } else {
    fs.writeFileSync(DICCIONARIO, diccionarioNuevo(t));
    console.log(`Escrito el bloque del radar (${Object.keys(t).length} textos) en rwadar-movil/lib/idioma-en.js. Ahora: node rwadar-movil/scripts/copiar-idiomas-web.cjs`);
  }
}

module.exports = { leerTextos, sinIngles };
