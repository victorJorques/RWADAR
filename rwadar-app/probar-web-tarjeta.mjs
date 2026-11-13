// La tarjeta sencilla de Ofertas (revisión del 05/11/2026), en dos pruebas
// de comportamiento que viven aparte para no engordar probar-web.mjs (aviso 5S
// de probar-orden.mjs):
// - en inglés: ejecuta el traductor real de la web (idioma-en, idioma e
//   idioma-web) sobre el HTML real de las tarjetas, en un DOM mínimo, y
//   comprueba lo que se lee: el país traducido y la ciudad tal cual,
//   «Important ·» delante del aviso crítico sin tocar el texto del catálogo y
//   el nombre del botón;
// - con el teclado: al cerrar la ficha, el foco vuelve a la tarjeta.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const activo = nombre => fs.readFileSync(path.join(raiz, 'rwadar-site', 'assets', nombre), 'utf8');

// ---- DOM mínimo: nodos, atributos y los selectores que usa idioma-web ----
const VACIOS = new Set(['IMG', 'BR', 'INPUT', 'HR', 'META', 'LINK', 'SOURCE', 'WBR']);
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decodificar = t => t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] !== '#' ? ENTIDADES[e] ?? m :
  String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : Number(e.slice(1))));
const atributoDeDato = k => 'data-' + k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());

class Texto {
  constructor(valor) { this.nodeType = 3; this.nodeValue = valor; this.parentNode = null; }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get textContent() { return this.nodeValue; }
}
class Elemento {
  constructor(etiqueta) {
    const el = this;
    this.nodeType = 1; this.tagName = etiqueta.toUpperCase(); this.atributos = new Map();
    this.childNodes = []; this.parentNode = null;
    this.dataset = new Proxy({}, {
      get: (_, k) => typeof k === 'string' ? el.getAttribute(atributoDeDato(k)) ?? undefined : undefined,
      set: (_, k, v) => { el.setAttribute(atributoDeDato(k), v); return true; },
    });
    this.classList = { contains: c => (el.getAttribute('class') || '').split(/\s+/).includes(c) };
  }
  get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
  get lang() { return this.getAttribute('lang') || ''; }
  set lang(v) { this.setAttribute('lang', v); }
  get firstChild() { return this.childNodes[0] || null; }
  get textContent() { return this.childNodes.map(n => n.textContent).join(''); }
  set textContent(v) { this.childNodes = []; this.appendChild(new Texto(String(v))); }
  hasAttribute(k) { return this.atributos.has(k); }
  getAttribute(k) { return this.atributos.has(k) ? this.atributos.get(k) : null; }
  setAttribute(k, v) { this.atributos.set(k, String(v)); }
  removeAttribute(k) { this.atributos.delete(k); }
  appendChild(n) { n.parentNode = this; this.childNodes.push(n); return n; }
  insertBefore(n, ref) { const i = this.childNodes.indexOf(ref); n.parentNode = this; this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, n); return n; }
  addEventListener() {}
  matches(s) { return selectores(s).some(partes => cumpleComplejo(this, partes, partes.length - 1)); }
  closest(s) { for (let n = this; n; n = n.parentElement) if (n.matches(s)) return n; return null; }
  querySelectorAll(s) {
    const r = [], recorre = n => { for (const h of n.childNodes) if (h.nodeType === 1) { if (h.matches(s)) r.push(h); recorre(h); } };
    recorre(this); return r;
  }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
}
// Parte por comas o por combinadores sin entrar en () ni [].
function partirComas(s) {
  const r = []; let d = 0, ini = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    else if (ch === ',' && !d) { r.push(s.slice(ini, i).trim()); ini = i + 1; }
  }
  r.push(s.slice(ini).trim()); return r.filter(Boolean);
}
function partirComplejo(s) {
  const partes = []; let d = 0, actual = '', comb = ' ';
  for (const ch of s) {
    if (!d && (ch === ' ' || ch === '>')) {
      if (actual) { partes.push({ comb, sel: actual }); actual = ''; comb = ' '; }
      if (ch === '>') comb = '>'; continue;
    }
    if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    actual += ch;
  }
  if (actual) partes.push({ comb, sel: actual });
  return partes;
}
const cache = new Map();
const selectores = s => { if (!cache.has(s)) cache.set(s, partirComas(s).map(partirComplejo)); return cache.get(s); };
function cumpleCompuesto(el, sel) {
  for (let i = 0; i < sel.length;) {
    const resto = sel.slice(i); let m;
    if (!i && (m = /^(\*|[a-z][\w-]*)/i.exec(resto))) { if (m[1] !== '*' && el.tagName !== m[1].toUpperCase()) return false; }
    else if ((m = /^#([\w-]+)/.exec(resto))) { if (el.getAttribute('id') !== m[1]) return false; }
    else if ((m = /^\.([\w-]+)/.exec(resto))) { if (!el.classList.contains(m[1])) return false; }
    else if ((m = /^\[([\w-]+)(?:="([^"]*)")?\]/.exec(resto))) {
      if (!el.hasAttribute(m[1]) || (m[2] !== undefined && el.getAttribute(m[1]) !== m[2])) return false;
    } else if ((m = /^:(not|is|has)\(/.exec(resto))) {
      let d = 1, j = m[0].length;
      for (; j < resto.length && d; j++) { if (resto[j] === '(') d++; else if (resto[j] === ')') d--; }
      const dentro = resto.slice(m[0].length, j - 1);
      const cumple = m[1] === 'not' ? !el.matches(dentro) : m[1] === 'is' ? el.matches(dentro) : el.querySelectorAll(dentro).length > 0;
      if (!cumple) return false;
      i += j; continue;
    } else throw new Error('Selector no admitido en el DOM de prueba: ' + sel);
    i += m[0].length;
  }
  return true;
}
function cumpleComplejo(el, partes, k) {
  if (!cumpleCompuesto(el, partes[k].sel)) return false;
  if (!k) return true;
  if (partes[k].comb === '>') return !!el.parentElement && cumpleComplejo(el.parentElement, partes, k - 1);
  for (let p = el.parentElement; p; p = p.parentElement) if (cumpleComplejo(p, partes, k - 1)) return true;
  return false;
}
function analizar(html, padre) {
  const pila = [padre];
  const re = /<!--[\s\S]*?-->|<\/([a-z][\w-]*)\s*>|<([a-z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>|([^<]+)/gi;
  for (const m of html.matchAll(re)) {
    const arriba = pila[pila.length - 1];
    if (m[1]) { const i = pila.map(n => n.tagName).lastIndexOf(m[1].toUpperCase()); if (i > 0) pila.length = i; }
    else if (m[2]) {
      const el = arriba.appendChild(new Elemento(m[2]));
      for (const a of m[3].matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
        el.setAttribute(a[1].toLowerCase(), decodificar(a[2] ?? a[3] ?? a[4] ?? ''));
      if (!VACIOS.has(el.tagName)) pila.push(el);
    } else if (m[4]) arriba.appendChild(new Texto(decodificar(m[4])));
  }
}
// Pinta el HTML en un documento, carga los tres archivos reales del idioma y
// espera a que idioma-web lo traduzca como en el navegador.
async function traducirHtml(html, idioma, { EMI, P }) {
  const documento = { nodeType: 9, readyState: 'complete', head: { querySelector: () => null }, addEventListener() {} };
  const raizHtml = new Elemento('html'); raizHtml.parentNode = documento;
  const body = raizHtml.appendChild(new Elemento('body'));
  analizar(html, body);
  Object.assign(documento, {
    documentElement: raizHtml, body,
    createElement: etiqueta => new Elemento(etiqueta),
    querySelectorAll: s => [...(raizHtml.matches(s) ? [raizHtml] : []), ...raizHtml.querySelectorAll(s)],
    querySelector: s => documento.querySelectorAll(s)[0] || null,
    contains: n => { for (; n; n = n.parentNode) if (n === raizHtml) return true; return false; },
  });
  const contexto = vm.createContext({
    document: documento, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3, DOCUMENT_NODE: 9 },
    MutationObserver: class { observe() {} }, localStorage: { getItem: () => idioma, setItem() {} }, EMI, P,
  });
  for (const nombre of ['idioma-en-20261022.js', 'idioma-20261022.js', 'idioma-web-20261022.js'])
    vm.runInContext(activo(nombre), contexto, { filename: nombre });
  await new Promise(resolver => setImmediate(resolver));
  return { body, html: raizHtml };
}

export async function probarTarjetaEnIngles({ c, prueba }) {
  const { ingles } = require('../rwadar-movil/lib/idioma.js');
  // Un aviso crítico de ensayo cuyo texto coincide con una frase del
  // diccionario: si dejara de protegerse, saldría en inglés.
  const avisoEnsayo = 'Puedes perder parte o todo lo que inviertas.';
  const datos = JSON.parse(vm.runInContext(`(()=>{
    const lugar=o=>(imagenOfertaLocal(o)||{}).lugar||'';
    const conCiudad=EMI.find(o=>lugar(o).includes(' · ')),ensayo={...conCiudad,avisos:[{tono:'stop',texto:${JSON.stringify(avisoEnsayo)}}]};
    return JSON.stringify({EMI,P,
      ofertas:EMI.map(o=>({titulo:o.titulo,plataforma:o.plataformaNombre,lugar:lugar(o)})),
      lista:'<div id="emiLista">'+EMI.map(o=>tarjetaOfertaLocal(o)).join('')+'</div>',
      ensayo:'<div id="emiLista">'+tarjetaOfertaLocal(ensayo)+'</div>'});
  })()`, c));
  const [en, es] = await Promise.all(['en', 'es'].map(idioma => traducirHtml(datos.lista, idioma, datos)));
  const tarjetas = d => d.body.querySelectorAll('#emiLista article');
  const lugares = d => tarjetas(d).map(a => (a.querySelector('.emi-lugar') || { textContent: '' }).textContent);
  const esperado = lugar => { const partes = lugar.split(' · '), pais = partes.pop(); return [...partes, ingles(pais)].join(' · '); };
  const lugaresEn = lugares(en), lugaresEs = lugares(es);
  // La ciudad es un dato: se queda en castellano y el lector la pronuncia como tal; el país va en inglés.
  const marcado = tarjetas(en).every(a => {
    const lugar = a.querySelector('.emi-lugar'); if (!lugar) return true;
    const partes = lugar.querySelector('.rel-lugar'), pais = partes && partes.childNodes.at(-1);
    return !!pais && pais.nodeType === 1 && lugar.querySelectorAll('[lang="es"]').every(x => x.getAttribute('translate') === 'no') &&
      pais.closest('[lang]') === en.html && en.html.lang === 'en';
  });
  prueba('inglés: cada tarjeta de Ofertas traduce el país y deja la ciudad como está (Limasol · Cyprus)',
    lugaresEn.length === datos.ofertas.length && lugaresEn.every((t, i) => t === esperado(datos.ofertas[i].lugar)) &&
    lugaresEs.every((t, i) => t === datos.ofertas[i].lugar) && lugaresEn.filter((t, i) => t !== lugaresEs[i]).length >= 3 &&
    lugaresEn.every(t => !/Estados Unidos|Zona euro|Suiza|Chipre|Francia/.test(t)) && marcado);
  const nombres = tarjetas(en).map(a => a.querySelector('[data-oferta-detalle]').getAttribute('aria-label'));
  prueba('inglés: el botón de cada tarjeta se llama «View details for <título> from <plataforma>», sin partir los títulos con «en»',
    nombres.length === datos.ofertas.length && datos.ofertas.some(o => / en /.test(o.titulo)) &&
    nombres.every((n, i) => n === `View details for ${datos.ofertas[i].titulo} from ${datos.ofertas[i].plataforma}`));
  const [ensayoEn, ensayoEs] = await Promise.all(['en', 'es'].map(idioma => traducirHtml(datos.ensayo, idioma, datos)));
  // «Recién añadidas» (tarjetaNuevaHtml) ya no se pinta desde el rediseño de Inicio del 10/11/2026 y se quitó
  // el 13/11/2026: el aviso crítico se comprueba en la tarjeta de Ofertas, la que se ve.
  const avisos = d => ['#emiLista .escaparate-aviso-bloqueo'].map(s => (d.body.querySelector(s) || {}).textContent);
  prueba('inglés: el aviso crítico dice «Important ·» y deja el texto del catálogo en castellano, en Ofertas',
    avisos(ensayoEn).every(t => t === 'Important · ' + avisoEnsayo) && avisos(ensayoEs).every(t => t === 'Importante · ' + avisoEnsayo) &&
    ensayoEn.body.querySelectorAll('.escaparate-aviso-bloqueo [lang="es"]').map(x => x.textContent).join('|') === avisoEnsayo);
}

// Cerrar la ficha con Escape o × retira su paso del historial. Al volver
// atrás, Chrome aplica otra vez el #fragmento (#emisiones) y deja el foco en
// <body>: la tarjeta lo recupera, salvo que la persona ya lo haya movido.
export function probarFocoAlCerrarFicha({ p, prueba }) {
  const c = p.contexto, escuchas = {}, focos = [];
  const escuchar = (evento, fn, opciones) => (escuchas[evento] ||= []).push({ fn, una: !!(opciones && opciones.once) });
  const lanzar = evento => { const lista = escuchas[evento] || []; escuchas[evento] = lista.filter(x => !x.una); lista.forEach(x => x.fn()); };
  const tarjeta = { dataset: { ofertaDetalle: 'ensayo' }, getClientRects: () => [{}], focus(o) { focos.push(o); c.document.activeElement = tarjeta; } };
  const dialogo = { setAttribute() {}, getAttribute: () => 'ensayo', addEventListener: escuchar, close() { lanzar('close'); } };
  const anterior = c.document.getElementById;
  Object.assign(c.document, { getElementById: id => id === 'escaparateDetalleLocal' ? null : anterior(id), createElement: () => dialogo,
    contains: n => n === tarjeta });
  c.document.body.appendChild = () => {};
  c.window.addEventListener = escuchar;
  c.history.back = function () { this.state = null; c.document.activeElement = c.document.body; lanzar('popstate'); };
  vm.runInContext('dialogoOfertaLocal()', c);
  const cerrar = moverAntes => {
    Object.assign(dialogo, { rwadarOrigen: tarjeta, rwadarHistorial: true });
    c.history.state = { rwadarOferta: 'ensayo' };
    const desde = p.tiempos.length;
    dialogo.close();
    if (moverAntes) c.document.activeElement = moverAntes;
    p.tiempos.splice(desde).forEach(t => t.fn());
    return c.document.activeElement;
  };
  const otro = { otro: true };
  prueba('cerrar la ficha con Escape o × devuelve el foco a la tarjeta aunque volver atrás lo deje en <body>',
    cerrar(null) === tarjeta && focos.length === 2 && focos.every(o => o && o.preventScroll === true) && c.history.state === null &&
    cerrar(otro) === otro && focos.length === 3);
}
