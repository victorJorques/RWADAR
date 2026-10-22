/* RWAdar · panel · gráficos en SVG, sin librerías.
   Líneas de 2 px, una sola escala vertical, leyenda siempre que hay
   más de una serie, globo al pasar el ratón y tabla con los datos. */
import { h, numero } from './util.js';

export const SERIE_1 = '#19a874';
export const SERIE_2 = '#3987e5';

const NS = 'http://www.w3.org/2000/svg';
const ALTO = 240;
const MARGEN = { arriba: 12, derecha: 12, abajo: 26, izquierda: 44 };

function s(etiqueta, atributos = {}) {
  const el = document.createElementNS(NS, etiqueta);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, String(v));
  return el;
}

function escalaBonita(maximo) {
  if (maximo <= 0) return { tope: 4, paso: 1 };
  const bruto = maximo / 4;
  const magnitud = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map(m => m * magnitud).find(p => p >= bruto);
  return { tope: Math.ceil(maximo / paso) * paso, paso };
}

function ejes(svg, { ancho, tope, paso, etiquetasX }) {
  const alto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const grupo = s('g', { class: 'eje' });
  for (let v = 0; v <= tope + 1e-9; v += paso) {
    const y = MARGEN.arriba + alto - (v / tope) * alto;
    grupo.append(s('line', { class: 'rejilla-linea', x1: MARGEN.izquierda, x2: ancho - MARGEN.derecha, y1: y, y2: y }));
    const t = s('text', { x: MARGEN.izquierda - 8, y: y + 4, 'text-anchor': 'end' });
    t.textContent = numero(v);
    grupo.append(t);
  }
  for (const { x, texto } of etiquetasX) {
    const t = s('text', { x, y: ALTO - 6, 'text-anchor': 'middle' });
    t.textContent = texto;
    grupo.append(t);
  }
  svg.append(grupo);
}

function etiquetasEspaciadas(n, xDe, textoDe, ancho) {
  const cabe = Math.max(2, Math.floor((ancho - MARGEN.izquierda) / 64));
  const cada = Math.max(1, Math.ceil(n / cabe));
  const lista = [];
  for (let i = 0; i < n; i += cada) lista.push({ x: xDe(i), texto: textoDe(i) });
  return lista;
}

function globo(caja) {
  const g = h('div', { class: 'globo', hidden: true });
  caja.append(g);
  return {
    mostrar(x, y, titulo, filas) {
      g.replaceChildren(h('b', {}, titulo), ...filas.map(f =>
        h('div', { class: 'fila' }, h('i', { style: `background:${f.color}` }), `${f.nombre}: `, h('strong', { class: 'num' }, numero(f.valor)))));
      g.style.left = `${x}px`;
      g.style.top = `${y}px`;
      g.hidden = false;
    },
    ocultar() { g.hidden = true; },
  };
}

function tablaDatos(columnas, filas) {
  return h('details', { class: 'datos-tabla' },
    h('summary', {}, 'Ver los datos en una tabla'),
    h('div', { class: 'tabla-caja' }, h('table', {},
      h('thead', {}, h('tr', {}, ...columnas.map(c => h('th', {}, c)))),
      h('tbody', {}, ...filas.map(f => h('tr', {}, ...f.map(v => h('td', { class: typeof v === 'number' ? 'num' : '' }, typeof v === 'number' ? numero(v) : v))))))));
}

/* puntos: [{etiqueta, corta, valores:{clave:n}}] · series: [{clave, nombre, color}] */
export function lineas(puntos, series) {
  const caja = h('div', { class: 'grafico' });
  const leyenda = h('div', { class: 'leyenda' }, ...series.map(se => h('span', {}, h('i', { style: `background:${se.color}` }), se.nombre)));
  const contenedor = h('div', {}, leyenda, caja, tablaDatos(['Momento', ...series.map(se => se.nombre)], puntos.map(p => [p.etiqueta, ...series.map(se => p.valores[se.clave])])));
  alCambiarAncho(caja, ancho => dibujarLineas(caja, puntos, series, ancho));
  return contenedor;
}

/* Se dibuja al ancho real y se vuelve a dibujar si cambia: así el texto
   de los ejes mide siempre lo mismo y no se estira con la ventana. */
function alCambiarAncho(caja, dibujar) {
  let previo = 0;
  new ResizeObserver(() => {
    const ancho = caja.clientWidth;
    if (!ancho || Math.abs(ancho - previo) < 4) return;
    previo = ancho;
    dibujar(Math.max(320, ancho));
  }).observe(caja);
}

function dibujarLineas(caja, puntos, series, ancho) {
  const svg = s('svg', { viewBox: `0 0 ${ancho} ${ALTO}`, role: 'img', 'aria-label': `Gráfico de ${series.map(x => x.nombre).join(' y ')}` });
  const maximo = Math.max(0, ...puntos.flatMap(p => series.map(se => p.valores[se.clave] || 0)));
  const { tope, paso } = escalaBonita(maximo);
  const alto = ALTO - MARGEN.arriba - MARGEN.abajo;
  const n = puntos.length;
  const xDe = i => MARGEN.izquierda + (n <= 1 ? 0 : (i / (n - 1)) * (ancho - MARGEN.izquierda - MARGEN.derecha));
  const yDe = v => MARGEN.arriba + alto - (v / tope) * alto;
  ejes(svg, { ancho, tope, paso, etiquetasX: etiquetasEspaciadas(n, xDe, i => puntos[i].corta, ancho) });
  for (const se of series) {
    const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${xDe(i).toFixed(1)},${yDe(p.valores[se.clave] || 0).toFixed(1)}`).join('');
    svg.append(s('path', { d, fill: 'none', stroke: se.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }
  const cruz = s('line', { class: 'cruz', y1: MARGEN.arriba, y2: MARGEN.arriba + alto, visibility: 'hidden' });
  const marcas = series.map(se => s('circle', { r: 4.5, fill: se.color, stroke: '#131211', 'stroke-width': 2, visibility: 'hidden' }));
  svg.append(cruz, ...marcas);
  const zona = s('rect', { x: MARGEN.izquierda, y: 0, width: ancho - MARGEN.izquierda - MARGEN.derecha, height: ALTO, fill: 'transparent' });
  svg.append(zona);
  caja.replaceChildren(svg);
  const g = globo(caja);
  zona.addEventListener('pointermove', ev => {
    const caja2 = svg.getBoundingClientRect();
    const xSvg = ((ev.clientX - caja2.left) / caja2.width) * ancho;
    const i = Math.max(0, Math.min(n - 1, Math.round(((xSvg - MARGEN.izquierda) / (ancho - MARGEN.izquierda - MARGEN.derecha)) * (n - 1))));
    const x = xDe(i);
    cruz.setAttribute('x1', x); cruz.setAttribute('x2', x); cruz.setAttribute('visibility', 'visible');
    series.forEach((se, k) => {
      marcas[k].setAttribute('cx', x); marcas[k].setAttribute('cy', yDe(puntos[i].valores[se.clave] || 0)); marcas[k].setAttribute('visibility', 'visible');
    });
    const escala = caja2.width / ancho;
    const yTop = Math.min(...series.map(se => yDe(puntos[i].valores[se.clave] || 0)));
    g.mostrar(x * escala, yTop * escala, puntos[i].etiqueta, series.map(se => ({ ...se, valor: puntos[i].valores[se.clave] || 0 })));
  });
  zona.addEventListener('pointerleave', () => {
    cruz.setAttribute('visibility', 'hidden');
    marcas.forEach(m => m.setAttribute('visibility', 'hidden'));
    g.ocultar();
  });
}

/* datos: [{etiqueta, corta, valor}] · una sola serie */
export function columnas(datos, { nombre, color = SERIE_1 }) {
  const caja = h('div', { class: 'grafico' });
  const contenedor = h('div', {}, caja, tablaDatos(['Día', nombre], datos.map(d => [d.etiqueta, d.valor])));
  alCambiarAncho(caja, ancho => {
    const svg = s('svg', { viewBox: `0 0 ${ancho} ${ALTO}`, role: 'img', 'aria-label': `Gráfico de ${nombre}` });
    const { tope, paso } = escalaBonita(Math.max(0, ...datos.map(d => d.valor)));
    const alto = ALTO - MARGEN.arriba - MARGEN.abajo;
    const util = ancho - MARGEN.izquierda - MARGEN.derecha;
    const banda = util / Math.max(1, datos.length);
    const anchoBarra = Math.max(3, Math.min(28, banda - 2));
    const xDe = i => MARGEN.izquierda + banda * i + banda / 2;
    ejes(svg, { ancho, tope, paso, etiquetasX: etiquetasEspaciadas(datos.length, xDe, i => datos[i].corta, ancho) });
    caja.replaceChildren(svg);
    const g = globo(caja);
    datos.forEach((d, i) => {
      const altoBarra = (d.valor / tope) * alto;
      const x = xDe(i) - anchoBarra / 2;
      const y = MARGEN.arriba + alto - altoBarra;
      const r = Math.min(4, anchoBarra / 2, altoBarra);
      if (d.valor > 0) {
        svg.append(s('path', { fill: color, d: `M${x},${y + altoBarra}V${y + r}Q${x},${y} ${x + r},${y}H${x + anchoBarra - r}Q${x + anchoBarra},${y} ${x + anchoBarra},${y + r}V${y + altoBarra}Z` }));
      }
      const zona = s('rect', { x: xDe(i) - banda / 2, y: MARGEN.arriba, width: banda, height: alto, fill: 'transparent' });
      zona.addEventListener('pointerenter', () => {
        const escala = svg.getBoundingClientRect().width / ancho;
        g.mostrar(xDe(i) * escala, y * escala, d.etiqueta, [{ nombre, valor: d.valor, color }]);
      });
      zona.addEventListener('pointerleave', () => g.ocultar());
      svg.append(zona);
    });
  });
  return contenedor;
}

/* filas: [{nombre, valor, extra?}] · barras horizontales en HTML */
export function barras(filas, { unidad = '', maximo, color } = {}) {
  if (!filas.length) return h('p', { class: 'vacio' }, 'Sin datos en este periodo.');
  const tope = maximo || Math.max(1, ...filas.map(f => f.valor));
  return h('div', { class: 'barras' }, ...filas.map(f => h('div', { class: 'barra', title: `${f.nombre}: ${numero(f.valor)} ${unidad}`.trim() },
    h('span', { class: 'barra-nombre' }, f.nombre),
    h('span', { class: 'barra-valor' }, `${numero(f.valor)}${f.extra ? ` · ${f.extra}` : ''}`),
    h('div', { class: 'barra-pista' }, h('span', { style: `width:${Math.max(1.5, (f.valor / tope) * 100)}%${color ? `;background:${color}` : ''}` })))));
}
