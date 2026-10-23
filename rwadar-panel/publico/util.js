/* RWAdar · panel · utilidades de la página.
   Todo el texto que viene de fuera (correos, nombres, rutas) entra con
   textContent a través de h(): nunca con innerHTML. */
const TOKEN = document.querySelector('meta[name="panel-token"]')?.content || '';
const ZONA = 'Europe/Madrid';

/* Lo que el servidor contó al arrancar (modo, quién ha entrado…). */
export const sesion = { ajustes: null };

export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  let res;
  try {
    res = await fetch(ruta, {
      method: metodo,
      headers: { 'X-Panel-Token': TOKEN, ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw Object.assign(new Error('El panel no responde. ¿Has cerrado su ventana negra?'), { codigo: 'sin-panel' });
  }
  const datos = await res.json().catch(() => ({ ok: false, error: `Respuesta no válida (${res.status})` }));
  if (!datos.ok) throw Object.assign(new Error(datos.error || 'Error'), { codigo: datos.codigo, detalle: datos.detalle });
  return datos.datos;
}

export function h(etiqueta, props = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v; // CSSOM: permitido por la CSP, el atributo no
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'hidden' || k === 'disabled') el[k] = Boolean(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

/* Rellena una caja como h(): aplana listas y se salta lo vacío. Con
   replaceChildren a secas, un null sale escrito como «null». */
export function poner(caja, ...hijos) {
  caja.replaceChildren(...hijos.flat(Infinity).filter(x => x !== null && x !== undefined && x !== false));
}

export const numero = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(Number(n) || 0);

export function kpi(etiqueta, valor, extra) {
  return h('div', { class: 'kpi' }, h('span', { class: 'kpi-etiqueta' }, etiqueta), h('span', { class: 'kpi-valor' }, valor), extra ? h('span', { class: 'kpi-extra' }, extra) : null);
}

/* Botones de «elige uno» (periodo, filtro…). */
export function segmentos(opciones, actual, alElegir, etiqueta = 'Periodo') {
  return h('div', { class: 'segmentos', role: 'group', 'aria-label': etiqueta }, ...opciones.map(([valor, texto]) =>
    h('button', { type: 'button', 'aria-pressed': String(valor === actual), onclick: () => alElegir(valor) }, texto)));
}

export function fecha(iso, { hora = true } = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('es-ES', hora ? { timeZone: ZONA, dateStyle: 'medium', timeStyle: 'short' } : { timeZone: ZONA, dateStyle: 'medium' });
}

export function haceCuanto(iso) {
  if (!iso) return 'nunca';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} días`;
}

const NS = 'http://www.w3.org/2000/svg';
const ICONOS = {
  ok: ['M4.5 8.2l2.3 2.3 4.7-5'],
  aviso: ['M8 2.2l6.2 11H1.8z', 'M8 6.4v3', 'M8 11.4v.1'],
  fallo: ['M5 5l6 6', 'M11 5l-6 6'],
  'sin-datos': ['M5 8h6'],
};
const NOMBRES = { ok: 'Bien', aviso: 'Aviso', fallo: 'Fallo', 'sin-datos': 'Sin datos' };

export function etiquetaEstado(estado, texto = NOMBRES[estado] || estado) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  if (estado !== 'aviso') {
    const c = document.createElementNS(NS, 'circle');
    for (const [k, v] of Object.entries({ cx: 8, cy: 8, r: 6.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 })) c.setAttribute(k, v);
    svg.append(c);
  }
  for (const d of ICONOS[estado] || []) {
    const p = document.createElementNS(NS, 'path');
    for (const [k, v] of Object.entries({ d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) p.setAttribute(k, v);
    svg.append(p);
  }
  return h('span', { class: `estado ${estado}` }, svg, texto);
}

export function bloqueError(e) {
  if (e?.codigo === 'falta-credencial') {
    return h('div', { class: 'falta-clave' }, e.message.replace(' Mira la pestaña Ajustes.', ' '), h('a', { href: '#ajustes' }, 'Cómo configurarla'));
  }
  return h('div', { class: 'error-bloque' }, e?.message || 'Algo ha fallado', e?.detalle ? h('pre', { class: 'tenue' }, String(e.detalle)) : null);
}

let temporizador;
export function tostada(texto, { error = false } = {}) {
  const el = document.getElementById('tostada');
  el.textContent = texto;
  el.className = `tostada${error ? ' error' : ''}`;
  el.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { el.hidden = true; }, error ? 9000 : 5000);
}

/* Ventana de confirmación. `accion` recibe los valores escritos; si
   falla, el error se ve dentro de la ventana y no se cierra. */
export function confirmar({ titulo, texto, campos = [], aceptar = 'Aceptar', peligro = false, esperando = 'Un momento…', accion }) {
  const dialogo = document.getElementById('dialogo');
  const form = document.getElementById('dialogo-form');
  const boton = document.getElementById('dialogo-aceptar');
  const error = document.getElementById('dialogo-error');
  document.getElementById('dialogo-titulo').textContent = titulo;
  const entradas = campos.map(c => c.tipo === 'texto-largo'
    ? h('textarea', { name: c.nombre, rows: 3, maxlength: 300, placeholder: c.ejemplo || '' })
    : h('input', { name: c.nombre, autocomplete: 'off', spellcheck: 'false', placeholder: c.ejemplo || '' }));
  document.getElementById('dialogo-cuerpo').replaceChildren(
    ...[].concat(texto).filter(Boolean).map(t => h('p', {}, t)),
    ...campos.map((c, i) => h('label', {}, c.etiqueta, entradas[i])));
  error.textContent = '';
  boton.textContent = aceptar;
  boton.className = `boton${peligro ? ' peligro' : ''}`;
  boton.disabled = false;
  return new Promise(resolver => {
    const cerrar = valor => { dialogo.close(); form.onsubmit = null; resolver(valor); };
    document.getElementById('dialogo-cancelar').onclick = () => cerrar(null);
    dialogo.oncancel = ev => { if (boton.disabled) ev.preventDefault(); else resolver(null); };
    form.onsubmit = async ev => {
      ev.preventDefault();
      const valores = Object.fromEntries(campos.map((c, i) => [c.nombre, entradas[i].value.trim()]));
      boton.disabled = true;
      boton.textContent = esperando;
      error.textContent = '';
      try {
        cerrar(await accion(valores));
      } catch (e) {
        error.textContent = e.message;
        boton.disabled = false;
        boton.textContent = aceptar;
      }
    };
    dialogo.showModal();
    (entradas[0] || boton).focus();
  });
}
