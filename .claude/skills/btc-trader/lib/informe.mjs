// Página HTML del informe de «BTC en papel»: lo último de «todo» (escáner,
// noticias, máquina del tiempo, presupuesto, riesgo y cartera de papel) en una
// sola página sin JavaScript, en claro y en oscuro, que se lee bien a 390 px.
// paginaInforme() da el fragmento para publicarlo como artefacto;
// documentoInforme(), el documento completo para abrirlo en local.
import { AVISO, fmtBtc, fmtDinero, fmtHora, fmtPct } from './comun.mjs';

const esNum = x => typeof x === 'number' && Number.isFinite(x);
const DIA = 86_400_000;

// ---------------------------------------------------------------- escapar

// '#' también se escapa: así ningún texto de fuera puede parecer un color literal.
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;', '#': '&num;' };
/** Texto seguro para HTML (contenido y atributos). */
export function esc(x) {
  // Espacio duro antes de % y €: que «0,23 %» no se parta en dos líneas.
  return String(x ?? '').replace(/[&<>"'#]/g, c => ENTIDADES[c]).replace(/ (?=[%€$])/g, '\u00a0');
}

// El escáner junta en un nombre los niveles que caen casi en el mismo precio («a + b + c…»).
function nombreCorto(nombre) {
  const partes = String(nombre ?? '').split(' + ');
  return partes.length > 2 ? `${partes.slice(0, 2).join(' + ')} y ${partes.length - 2} más` : partes.join(' + ');
}

const enlaceSeguro = u => (typeof u === 'string' && /^https?:\/\/[^\s]+$/i.test(u.trim()) ? esc(u.trim()) : null);

// ---------------------------------------------------------------- formatos

const formatos = new Map();
function numero(x, dec = 0) {
  if (!esNum(x)) return '—';
  if (!formatos.has(dec)) formatos.set(dec, new Intl.NumberFormat('es-ES', { maximumFractionDigits: dec, minimumFractionDigits: 0, useGrouping: 'always' }));
  return formatos.get(dec).format(x);
}
// Precios de BTC sin céntimos (por encima de 100 no dicen nada), con su moneda.
const precio = (x, moneda) => (esNum(x) ? fmtDinero(Math.abs(x) >= 100 ? Math.round(x) : x, moneda).replace(/,00(?=\s)/, '') : '—');
const hora = t => (esNum(t) ? fmtHora(t) : '—');
const horaUtc = t => (esNum(t) ? fmtHora(t, { utc: true }) : '—');
const pctSigno = (x, dec = 1) => fmtPct(x, dec, { signo: true });
const claseSigno = x => (esNum(x) ? (x > 0 ? 'sube' : x < 0 ? 'baja' : 'neutro') : 'neutro');
const NOMBRE_FUENTE = { coinbase: 'Coinbase', binance: 'Binance', kraken: 'Kraken', bitstamp: 'Bitstamp', sintetica: 'datos sintéticos' };
const fuente = f => esc(NOMBRE_FUENTE[f] ?? f ?? '—');
const valido = paso => paso && typeof paso === 'object' && !paso.omitido;

// ---------------------------------------------------------------- colores

// Un solo sitio para los colores: los dos temas tienen los mismos nombres.
const CLARO = Object.freeze({
  fondo: '#f3f4f6', superficie: '#ffffff', tinta: '#14181d', 'tinta-2': '#434b56', 'tinta-3': '#677080',
  linea: '#d4d9e0', 'linea-suave': '#e6e9ed', acento: '#f7931a', 'acento-tinta': '#9e5200', 'acento-suave': '#fdf0df',
  'sobre-acento': '#14181d', sube: '#0d7a47', 'sube-suave': '#e1f2e8', baja: '#bf2f39', 'baja-suave': '#fbe5e6',
  neutro: '#78808b', 'neutro-suave': '#eceef1', ema20: '#2760c4', ema50: '#7c4bbf', vwap: '#56616e', rejilla: '#e4e7eb',
});
const OSCURO = Object.freeze({
  fondo: '#12161b', superficie: '#191e25', tinta: '#e6e8eb', 'tinta-2': '#b3b9c2', 'tinta-3': '#8d95a0',
  linea: '#2d343d', 'linea-suave': '#232930', acento: '#f7931a', 'acento-tinta': '#f6a54a', 'acento-suave': '#33261a',
  'sobre-acento': '#14181d', sube: '#3cba7b', 'sube-suave': '#14301f', baja: '#ef6871', 'baja-suave': '#3b1d21',
  neutro: '#8f97a2', 'neutro-suave': '#242a32', ema20: '#6f9ffc', ema50: '#b68cf0', vwap: '#9ba6b2', rejilla: '#252b33',
});
const variables = obj => Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join('\n');

const FUENTES_GOOGLE = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap';

const CSS = `:root {
${variables(CLARO)}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${variables(OSCURO)}
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
${variables(OSCURO)}
  color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--fondo);
  color: var(--tinta);
  font-family: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}
.pagina {
  max-width: 1040px;
  margin: 0 auto;
  padding-block: 28px 56px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
  font-variant-numeric: tabular-nums;
}
p, li, dd, td { overflow-wrap: anywhere; }
a { color: var(--tinta); text-decoration-color: var(--acento); text-underline-offset: 3px; }
a:hover { color: var(--acento-tinta); }
.mono, .eje, .etiqueta, .ticket, .marca, .num { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.cifra { font-variant-numeric: tabular-nums; white-space: nowrap; }
.sube { color: var(--sube); }
.baja { color: var(--baja); }
.neutro { color: var(--tinta-3); }
.suave { color: var(--tinta-2); }
.pequeno { font-size: 13px; color: var(--tinta-3); }
.vacio { color: var(--tinta-3); font-style: italic; }

/* cabecera */
.marca { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--tinta-3); }
.marca::before { content: ""; width: 11px; height: 11px; background: var(--acento); flex: none; }
.conclusion { margin: 12px 0 8px; font-size: clamp(24px, 4.4vw, 38px); line-height: 1.15; font-weight: 600; letter-spacing: -0.012em; max-width: 26em; text-wrap: balance; }
.detalle { margin: 0 0 18px; max-width: 70ch; color: var(--tinta-2); }
.precio-linea { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; margin: 0 0 16px; }
.precio-grande { font-size: clamp(30px, 6vw, 44px); font-weight: 500; letter-spacing: -0.02em; }
.datos-cabecera { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; margin: 0; background: var(--linea); border: 1px solid var(--linea); }
.datos-cabecera div { background: var(--superficie); padding: 10px 12px; }
.datos-cabecera dt { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--tinta-3); }
.datos-cabecera dd { margin: 2px 0 0; font-size: 17px; font-weight: 500; }
.datos-cabecera .chapa { margin-top: 2px; white-space: normal; text-transform: none; letter-spacing: 0; font-family: inherit; font-size: 14px; }
.franja-hipotetica { margin: 0 0 18px; padding: 10px 14px; border-left: 4px solid var(--acento); background: var(--acento-suave); font-weight: 500; }
.franja-hipotetica strong { color: var(--acento-tinta); letter-spacing: .04em; }

/* secciones */
.bloque { margin-top: 32px; padding-top: 18px; border-top: 1px solid var(--linea); }
.bloque > h2 { display: flex; align-items: baseline; gap: 12px; margin: 0 0 14px; font-size: 14px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; }
.bloque > h2 .num { color: var(--acento-tinta); font-weight: 500; }
.bloque p { max-width: 72ch; }
h3 { margin: 22px 0 8px; font-size: 16px; font-weight: 600; }

/* gráfico */
.grafico { overflow-x: auto; background: var(--superficie); border: 1px solid var(--linea); }
.grafico svg { display: block; width: 100%; height: auto; }
.grafico .estrecho { display: none; }
@media (max-width: 680px) {
  .grafico .ancho { display: none; }
  .grafico .estrecho { display: block; }
}
.leyenda { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0 0; padding: 0; list-style: none; font-size: 13px; color: var(--tinta-2); }
.leyenda li { display: flex; align-items: center; gap: 6px; }
.leyenda i { display: inline-block; width: 16px; height: 3px; }
.l-ema20 { background: var(--ema20); }
.l-ema50 { background: var(--ema50); }
.l-vwap { background: var(--vwap); }
.l-entrada { background: var(--acento); }
.l-stop { background: var(--baja); }
.l-objetivo { background: var(--sube); }
.l-nivel { background: var(--tinta-3); }
svg .rejilla { stroke: var(--rejilla); stroke-width: 1; }
svg .eje { fill: var(--tinta-3); }
svg .mecha { stroke-width: 1; }
svg .vela-sube { fill: var(--sube); stroke: var(--sube); }
svg .vela-baja { fill: var(--baja); stroke: var(--baja); }
svg .linea { fill: none; stroke-width: 1.6; stroke-linejoin: round; }
svg .linea-ema20 { stroke: var(--ema20); }
svg .linea-ema50 { stroke: var(--ema50); }
svg .linea-vwap { stroke: var(--vwap); stroke-dasharray: 4 3; }
svg .nivel { stroke-width: 1.4; }
svg .nivel-entrada { stroke: var(--acento); }
svg .nivel-stop { stroke: var(--baja); stroke-dasharray: 6 4; }
svg .nivel-objetivo { stroke: var(--sube); stroke-dasharray: 6 4; }
svg .nivel-resistencia, svg .nivel-soporte { stroke: var(--tinta-3); stroke-dasharray: 2 4; }
svg .etiqueta { font-weight: 500; }
svg .fondo-etiqueta { fill: var(--superficie); opacity: .92; }
svg .etiqueta-entrada { fill: var(--acento-tinta); }
svg .etiqueta-stop { fill: var(--baja); }
svg .etiqueta-objetivo { fill: var(--sube); }
svg .etiqueta-resistencia, svg .etiqueta-soporte { fill: var(--tinta-2); }
svg .marca-ahora { fill: var(--acento); }
svg .texto-ahora { fill: var(--sobre-acento); font-weight: 500; }
svg .barra-sube { fill: var(--sube); }
svg .barra-baja { fill: var(--baja); }
svg .barra-cero { fill: var(--neutro); }
svg .base { stroke: var(--linea); stroke-width: 1; }
svg .cero { stroke: var(--tinta-2); stroke-width: 1; stroke-dasharray: 3 3; }

/* rejillas de datos */
.tendencias { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--linea); border: 1px solid var(--linea); }
.tendencias > div { background: var(--superficie); padding: 12px; min-width: 0; }
.tendencias .iv { font-size: 13px; color: var(--tinta-3); }
.tendencias .t { margin: 2px 0 6px; font-size: 20px; font-weight: 600; }
.tendencias p { margin: 0; font-size: 13px; color: var(--tinta-2); }
.cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px 24px; margin: 14px 0; }
.cifras dt { font-size: 13px; color: var(--tinta-3); }
.cifras dd { margin: 2px 0 0; font-size: 20px; font-weight: 500; }
.cifras dd.texto { font-size: 16px; white-space: normal; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.tabla { overflow-x: auto; }
table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 14px; }
table.compacta { min-width: 0; font-size: 13px; }
th { padding: 6px 12px 6px 0; border-bottom: 1px solid var(--linea); text-align: left; font-weight: 500; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; color: var(--tinta-3); }
td { padding: 9px 12px 9px 0; border-bottom: 1px solid var(--linea-suave); vertical-align: top; }
td.n, th.n { text-align: right; white-space: nowrap; }
.setups { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--linea); }
.setups li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; padding: 12px 0; border-bottom: 1px solid var(--linea-suave); }
.setups .nombre { font-weight: 500; }
.setups .fuerza { text-align: right; font-size: 14px; color: var(--tinta-2); white-space: nowrap; }
.setups .niveles { grid-column: 1 / -1; font-size: 14px; color: var(--tinta-2); }
.setups .por-que { grid-column: 1 / -1; font-size: 13px; color: var(--tinta-3); }
.lista-niveles { margin: 0; padding: 0; list-style: none; }
.lista-niveles li { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--linea-suave); font-size: 14px; }
.lista-niveles .cifra { white-space: nowrap; }

/* marcas de estado */
.chapa { display: inline-block; padding: 1px 7px; font-family: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace; font-size: 12px; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; white-space: nowrap; }
.chapa-pasa { color: var(--sube); background: var(--sube-suave); }
.chapa-bloquea { color: var(--baja); background: var(--baja-suave); }
.chapa-neutra { color: var(--tinta-2); background: var(--neutro-suave); }
.chapa-acento { color: var(--acento-tinta); background: var(--acento-suave); }

/* noticias */
.noticias { margin: 0; padding: 0; list-style: none; }
.noticias li { padding: 12px 0; border-bottom: 1px solid var(--linea-suave); }
.noticias .meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; color: var(--tinta-3); }
.noticias a, .noticias .titular { display: block; margin-top: 3px; font-weight: 500; }
.impacto-alto { color: var(--acento-tinta); font-weight: 600; }
.termometro { position: relative; height: 10px; margin: 26px 0 6px; background: linear-gradient(90deg, var(--baja), var(--acento) 50%, var(--sube)); }
.termometro span { position: absolute; top: -6px; width: 3px; height: 22px; margin-left: -1px; background: var(--tinta); }
.termometro-ejes { display: flex; justify-content: space-between; font-size: 12px; color: var(--tinta-3); }

/* máquina del tiempo */
.apilada { display: flex; height: 30px; border: 1px solid var(--linea); background: var(--superficie); }
.apilada span { display: block; height: 100%; }
.seg-objetivo { background: var(--sube); }
.seg-abierta { background: var(--neutro); }
.seg-stop { background: var(--baja); }
.apilada-leyenda { display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 8px 0 0; padding: 0; list-style: none; font-size: 14px; }
.apilada-leyenda i { display: inline-block; width: 10px; height: 10px; margin-right: 6px; }
.histograma { max-width: 560px; overflow-x: auto; margin-top: 14px; }
.histograma svg { display: block; width: 100%; height: auto; }

/* riesgo y ticket */
.veredicto { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin: 0 0 10px; font-size: 18px; font-weight: 600; }
.veredicto .chapa { font-size: 15px; padding: 3px 10px; }
.reglas { margin: 0; padding: 0; list-style: none; }
.reglas li { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 2px 12px; padding: 10px 0; border-bottom: 1px solid var(--linea-suave); }
.reglas .nombre { font-weight: 500; }
.reglas .det { grid-column: 2; font-size: 14px; color: var(--tinta-2); }
.ticket { margin: 16px 0 0; padding: 14px 16px; background: var(--superficie); border: 1px solid var(--linea); border-left: 4px solid var(--acento); font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }

/* pie */
.pie { margin-top: 44px; padding-top: 16px; border-top: 2px solid var(--tinta); font-size: 14px; color: var(--tinta-2); }
.pie .aviso { color: var(--tinta); font-weight: 600; max-width: 72ch; }
.pie ul { margin: 6px 0 0; padding-left: 18px; }

@media (max-width: 680px) {
  .tendencias { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dos { grid-template-columns: 1fr; gap: 8px; }
  .reglas li { grid-template-columns: 76px minmax(0, 1fr); }
}`;

// ---------------------------------------------------------------- SVG

const r1 = x => Math.round(x * 10) / 10;

function pasoBonito(bruto) {
  if (!(bruto > 0)) return 1;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  return ([1, 2, 2.5, 5, 10].find(s => s * mag >= bruto) ?? 10) * mag;
}

// Separa en tramos las etiquetas que caerían una encima de otra (de arriba abajo).
function separar(etiquetas, minimo, arriba, abajo) {
  const orden = [...etiquetas].sort((a, b) => a.y - b.y);
  for (let k = 0; k < orden.length; k++) {
    orden[k].y = Math.max(orden[k].y, arriba);
    if (k > 0 && orden[k].y - orden[k - 1].y < minimo) orden[k].y = orden[k - 1].y + minimo;
  }
  for (let k = orden.length - 1; k >= 0; k--) {
    if (orden[k].y > abajo) orden[k].y = abajo;
    if (k < orden.length - 1 && orden[k + 1].y - orden[k].y < minimo) orden[k].y = orden[k + 1].y - minimo;
  }
  return orden;
}

const diaMadridCorto = t => fmtHora(t).slice(0, 5); // 'dd/mm'
const diaUtc = t => Math.floor(t / DIA);

/**
 * Gráfico de velas a escala con EMA20, EMA50, VWAP y líneas de niveles.
 * g = { velas: [[t, o, h, l, c]], ema20, ema50, vwap } (alineados con las velas).
 */
function svgVelas(g, niveles, { ancho, alto, letra, clase, moneda, titulo }) {
  const velas = Array.isArray(g?.velas) ? g.velas : [];
  const ok = v => Array.isArray(v) && v.length >= 5 && v.slice(0, 5).every(esNum);
  const n = velas.length;
  if (n < 2 || !velas.some(ok)) return '';
  const der = Math.round(letra * 4.6);
  const x0 = 4;
  const x1 = ancho - der;
  const y0 = 10;
  const y1 = alto - Math.round(letra * 2.1);
  let min = Infinity;
  let max = -Infinity;
  for (const v of velas) if (ok(v)) { min = Math.min(min, v[3]); max = Math.max(max, v[2]); }
  const lineas = ['ema20', 'ema50', 'vwap'].map(k => ({ k, val: Array.isArray(g[k]) && g[k].length === n ? g[k] : [] }));
  const dentro = niveles.filter(x => esNum(x.precio) && x.precio > 0);
  for (const x of dentro) { min = Math.min(min, x.precio); max = Math.max(max, x.precio); }
  // Las medias entran en la escala solo si no la estiran demasiado (al principio pueden ir lejos).
  const rango0 = max - min;
  for (const { val } of lineas) for (const x of val) if (esNum(x) && x > min - rango0 * 0.3 && x < max + rango0 * 0.3) { min = Math.min(min, x); max = Math.max(max, x); }
  const pad = (max - min) * 0.05 || max * 0.005;
  min -= pad;
  max += pad;
  const Y = p => r1(y1 - ((p - min) / (max - min)) * (y1 - y0));
  const paso = (x1 - x0) / n;
  const X = k => r1(x0 + paso * (k + 0.5));
  const w = r1(Math.max(0.8, paso * 0.64));
  const partes = [];

  // Rejilla de precios.
  const ultima = [...velas].reverse().find(ok);
  const yAhora = ultima ? Y(ultima[4]) : null;
  const step = pasoBonito((max - min) / 5);
  for (let p = Math.ceil(min / step) * step; p <= max; p += step) {
    const y = Y(p);
    partes.push(`<line class="rejilla" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}"/>`);
    if (yAhora === null || Math.abs(y - yAhora) > letra * 1.1) {
      partes.push(`<text class="eje" x="${x1 + 6}" y="${r1(y + letra * 0.35)}" font-size="${letra}">${esc(numero(p, step < 1 ? 2 : 0))}</text>`);
    }
  }
  // Días (en Madrid) en el eje de abajo.
  let antes = null;
  velas.forEach((v, k) => {
    if (!ok(v)) return;
    const d = diaMadridCorto(v[0]);
    if (antes !== null && d !== antes) {
      const x = r1(x0 + paso * k);
      partes.push(`<line class="rejilla" x1="${x}" x2="${x}" y1="${y0}" y2="${y1}"/>`);
      partes.push(`<text class="eje" x="${r1(x + 3)}" y="${r1(y1 + letra * 1.45)}" font-size="${letra}">${esc(d)}</text>`);
    }
    antes = d;
  });
  // Velas.
  velas.forEach((v, k) => {
    if (!ok(v)) return;
    const [, o, h, l, c] = v;
    const cls = c >= o ? 'vela-sube' : 'vela-baja';
    const x = X(k);
    const arriba = Y(Math.max(o, c));
    const alto2 = Math.max(0.8, r1(Math.abs(Y(o) - Y(c))));
    partes.push(`<line class="mecha ${cls}" x1="${x}" x2="${x}" y1="${Y(h)}" y2="${Y(l)}"/>`);
    partes.push(`<rect class="${cls}" x="${r1(x - w / 2)}" y="${arriba}" width="${w}" height="${alto2}"/>`);
  });
  // Medias y VWAP (el VWAP empieza de cero cada día UTC: se corta ahí).
  for (const { k, val } of lineas) {
    let d = '';
    let abierto = false;
    val.forEach((x, i) => {
      const corte = k === 'vwap' && i > 0 && ok(velas[i]) && ok(velas[i - 1]) && diaUtc(velas[i][0]) !== diaUtc(velas[i - 1][0]);
      if (!esNum(x) || x < min || x > max || corte) abierto = false;
      if (!esNum(x) || x < min || x > max) return;
      d += `${abierto ? 'L' : 'M'}${X(i)} ${Y(x)}`;
      abierto = true;
    });
    if (d) partes.push(`<path class="linea linea-${k}" d="${d}"/>`);
  }
  // Niveles con su etiqueta y cifra.
  const etiquetas = dentro.map(x => ({ ...x, yLinea: Y(x.precio), y: r1(Y(x.precio) - 5) }));
  for (const e of etiquetas) partes.push(`<line class="nivel nivel-${e.clave}" x1="${x0}" x2="${x1}" y1="${e.yLinea}" y2="${e.yLinea}"/>`);
  for (const e of separar(etiquetas, letra + 5, y0 + letra, y1 - 3)) {
    const texto = `${e.nombre} ${precio(e.precio, moneda)}`;
    // Fuente monoespaciada: cada letra mide unos 0,6 em, así que el fondo se puede calcular.
    const anchoTexto = r1(texto.length * letra * 0.6 + 8);
    partes.push(`<rect class="fondo-etiqueta" x="${r1(x1 - 2 - anchoTexto)}" y="${r1(e.y - letra * 0.95)}" width="${anchoTexto}" height="${r1(letra * 1.3)}"/>`);
    partes.push(`<text class="etiqueta etiqueta-${e.clave}" x="${x1 - 6}" y="${r1(e.y)}" font-size="${letra}" text-anchor="end">${esc(texto)}</text>`);
  }
  // Último precio en el eje.
  if (ultima) {
    const alto3 = letra + 6;
    partes.push(`<rect class="marca-ahora" x="${x1 + 2}" y="${r1(yAhora - alto3 / 2)}" width="${der - 4}" height="${alto3}"/>`);
    partes.push(`<text class="texto-ahora" x="${x1 + 6}" y="${r1(yAhora + letra * 0.35)}" font-size="${letra}">${esc(numero(ultima[4], 0))}</text>`);
  }
  return `<svg class="${clase}" viewBox="0 0 ${ancho} ${alto}" width="100%" role="img" aria-label="${esc(titulo)}" font-family="'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace"><title>${esc(titulo)}</title>${partes.join('')}</svg>`;
}

function svgHistograma(hist, { ancho = 420, alto = 200, letra = 13 } = {}) {
  const tramos = (Array.isArray(hist) ? hist : []).filter(b => b && esNum(b.desde) && esNum(b.hasta) && esNum(b.n));
  if (!tramos.length) return '';
  const maxN = Math.max(...tramos.map(b => b.n));
  if (!(maxN > 0)) return '';
  const x0 = 4;
  const x1 = ancho - 4;
  const y0 = 6;
  const y1 = alto - letra * 2 - 4;
  const lo = tramos[0].desde;
  const hi = tramos.at(-1).hasta;
  const bw = (x1 - x0) / tramos.length;
  const partes = [];
  tramos.forEach((b, k) => {
    const h = (b.n / maxN) * (y1 - y0);
    const cls = b.hasta <= 0 ? 'barra-baja' : b.desde >= 0 ? 'barra-sube' : 'barra-cero';
    if (b.n > 0) partes.push(`<rect class="${cls}" x="${r1(x0 + k * bw + 1)}" y="${r1(y1 - Math.max(1, h))}" width="${r1(Math.max(1, bw - 2))}" height="${r1(Math.max(1, h))}"/>`);
  });
  partes.push(`<line class="base" x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}"/>`);
  const yTexto = r1(y1 + letra * 1.5);
  partes.push(`<text class="eje" x="${x0}" y="${yTexto}" font-size="${letra}">${esc(pctSigno(lo, 1))}</text>`);
  partes.push(`<text class="eje" x="${x1}" y="${yTexto}" font-size="${letra}" text-anchor="end">${esc(pctSigno(hi, 1))}</text>`);
  if (lo < 0 && hi > 0) {
    const xz = r1(x0 + ((0 - lo) / (hi - lo)) * (x1 - x0));
    partes.push(`<line class="cero" x1="${xz}" x2="${xz}" y1="${y0}" y2="${y1}"/>`);
    if (xz - x0 > letra * 4 && x1 - xz > letra * 4) partes.push(`<text class="eje" x="${xz}" y="${yTexto}" font-size="${letra}" text-anchor="middle">0 %</text>`);
  }
  const titulo = `Reparto del resultado neto de las simulaciones, de ${pctSigno(lo, 1)} a ${pctSigno(hi, 1)}`;
  return `<svg viewBox="0 0 ${ancho} ${alto}" width="100%" role="img" aria-label="${esc(titulo)}" font-family="'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace"><title>${esc(titulo)}</title>${partes.join('')}</svg>`;
}

// ---------------------------------------------------------------- secciones

const bloque = (num, titulo, cuerpo) => `<section class="bloque"><h2><span class="num">${num}</span>${esc(titulo)}</h2>${cuerpo}</section>`;
const cifras = pares => `<dl class="cifras">${pares.filter(Boolean).map(([k, v, texto]) => `<div><dt>${esc(k)}</dt><dd class="${texto ? 'texto' : 'cifra'}">${v}</dd></div>`).join('')}</dl>`;
const parrafo = (texto, clase = '') => (texto ? `<p${clase ? ` class="${clase}"` : ''}>${esc(texto)}</p>` : '');

// En la cabecera va el estado del ticket y no el PASA del riesgo: un PASA en verde
// junto a «no es momento de entrar» empujaría a operar.
function estadoTicket(d) {
  const t = valido(d.pasos?.ticket) ? d.pasos.ticket : null;
  const ent = valido(d.pasos?.entrada) ? d.pasos.entrada : null;
  const chapa = (cls, texto) => `<span class="chapa ${cls}">${esc(texto)}</span>`;
  if (!t || !t.texto) return chapa('chapa-neutra', 'sin orden');
  if (t.usado) return chapa('chapa-neutra', `abierto como ${t.usado}`);
  if (t.vigente) return chapa('chapa-acento', d.hipotetica ? 'hipotético · falta tu «sí»' : 'listo · falta tu «sí»');
  if (t.veredicto && t.veredicto !== 'PASA') return chapa('chapa-bloquea', 'bloqueado por tus reglas');
  if (ent?.estado === 'esperar') return chapa('chapa-neutra', 'esperando la entrada');
  return chapa('chapa-neutra', 'no se puede abrir');
}

function cabecera(d) {
  const esc0 = d.pasos?.escanear ?? {};
  const moneda = d.moneda ?? esc0.moneda ?? 'EUR';
  const pa = esc0.precio_actual;
  const c = d.conclusion ?? { frase: 'Sin conclusión: el flujo no llegó a la entrada.' };
  const ctx = esc0.contexto ?? {};
  const mc = d.pasos?.noticias?.miedo_codicia;
  const datos = [
    ['24 h', esNum(ctx.cambio_24h_pct) ? `<span class="${claseSigno(ctx.cambio_24h_pct)}">${esc(pctSigno(ctx.cambio_24h_pct))}</span>` : '—'],
    ['72 h', esNum(ctx.cambio_72h_pct) ? `<span class="${claseSigno(ctx.cambio_72h_pct)}">${esc(pctSigno(ctx.cambio_72h_pct))}</span>` : '—'],
    ['Miedo y codicia', mc ? `${esc(numero(mc.valor))} <span class="suave">· ${esc(mc.clase)}</span>` : '—'],
    ['Ticket', estadoTicket(d)],
  ];
  const franja = d.hipotetica
    ? '<p class="franja-hipotetica"><strong>HIPOTÉTICA</strong> · No hay setup: la entrada de abajo es inventada al precio de ahora, solo para ver el flujo entero. No es una señal.</p>'
    : '';
  const pre = pa
    ? `<p class="precio-linea"><span class="precio-grande cifra">${esc(fmtDinero(pa.precio, moneda))}</span><span class="suave">${esc(d.par ?? esc0.par ?? 'BTC-EUR')} · ${esc(horaUtc(pa.hora ?? d.hora))} · ${fuente(pa.fuente)}</span></p>`
    : '<p class="precio-linea vacio">Sin precio de ahora.</p>';
  return `<header>
<p class="marca">BTC en papel · ${esc(horaUtc(d.hora))}</p>
<h1 class="conclusion">${esc(c.frase)}</h1>
${c.detalle ? `<p class="detalle">${esc(c.detalle)}</p>` : ''}
${franja}
${pre}
<dl class="datos-cabecera">${datos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
</header>`;
}

function nivelesGrafico(d) {
  const plan = valido(d.pasos?.salida) ? d.pasos.salida : null;
  if (plan && esNum(plan.entrada)) {
    return [
      { clave: 'objetivo', nombre: 'Objetivo', precio: plan.objetivo },
      { clave: 'entrada', nombre: d.hipotetica ? 'Entrada hipotética' : 'Entrada', precio: plan.entrada },
      { clave: 'stop', nombre: 'Stop', precio: plan.stop },
    ];
  }
  const nk = d.pasos?.escanear?.niveles_clave ?? {};
  return [
    nk.resistencia && { clave: 'resistencia', nombre: 'Resistencia', precio: nk.resistencia.precio },
    nk.soporte && { clave: 'soporte', nombre: 'Soporte', precio: nk.soporte.precio },
  ].filter(Boolean);
}

function seccionGrafico(d) {
  const g = d.pasos?.escanear?.grafico;
  const moneda = d.moneda ?? 'EUR';
  const niveles = nivelesGrafico(d);
  const dias = g?.velas?.length ? Math.round(g.velas.length / 24) : 0;
  const titulo = `Velas de 1 hora de BTC, últimos ${dias} días, con EMA20, EMA50, VWAP y ${niveles.map(n => n.nombre.toLowerCase()).join(', ') || 'sin niveles'}`;
  const ancho = svgVelas(g, niveles, { ancho: 960, alto: 380, letra: 12, clase: 'ancho', moneda, titulo });
  const estrecho = svgVelas(g, niveles, { ancho: 420, alto: 340, letra: 13, clase: 'estrecho', moneda, titulo });
  if (!ancho) return bloque('01', 'Gráfico de 1 hora', '<p class="vacio">No hay velas de 1 h para dibujar.</p>');
  const leyenda = [
    '<li><i class="l-ema20"></i>EMA20</li>', '<li><i class="l-ema50"></i>EMA50</li>', '<li><i class="l-vwap"></i>VWAP del día</li>',
    ...niveles.map(n => `<li><i class="l-${['entrada', 'stop', 'objetivo'].includes(n.clave) ? n.clave : 'nivel'}"></i>${esc(n.nombre)} <span class="cifra">${esc(precio(n.precio, moneda))}</span></li>`),
  ];
  const fin = g.velas.at(-1)?.[0];
  const pie = `Velas de ${fuente(g.fuente)}, una por hora (hora de Madrid en el eje); la última cerró a las ${esc(esNum(fin) ? hora(fin + 3_600_000) : '—')}.`;
  return bloque('01', `Gráfico de 1 hora · ${dias} días`, `<div class="grafico">${ancho}${estrecho}</div><ul class="leyenda">${leyenda.join('')}</ul><p class="pequeno">${pie}</p>`);
}

function seccionTendencias(d) {
  const e = d.pasos?.escanear ?? {};
  const ivs = Object.keys(e.tendencias ?? {});
  if (!ivs.length) return bloque('02', 'Tendencia por temporalidad', '<p class="vacio">Sin datos.</p>');
  const celdas = ivs.map(iv => {
    const t = e.tendencias[iv];
    const info = e.contexto?.intervalos?.[iv] ?? {};
    const cls = t === 'alcista' ? 'sube' : t === 'bajista' ? 'baja' : 'neutro';
    const extra = [esNum(info.rsi) ? `RSI ${numero(info.rsi, 1)}` : null, esNum(info.atr_pct) ? `ATR ${fmtPct(info.atr_pct, 2)}` : null].filter(Boolean).join(' · ');
    return `<div><div class="iv mono">${esc(iv)}</div><div class="t ${cls}">${esc(t)}</div><p class="cifra">${esc(extra)}</p><p>${esc(e.tendencias_motivo?.[iv] ?? '')}</p></div>`;
  });
  const c = e.contexto ?? {};
  const ema = esNum(c.ema200_diaria)
    ? `<p class="suave">EMA200 diaria en <span class="cifra">${esc(precio(c.ema200_diaria, d.moneda))}</span>: el precio está a un <span class="cifra ${claseSigno(c.distancia_ema200_diaria_pct)}">${esc(pctSigno(c.distancia_ema200_diaria_pct))}</span>.</p>`
    : '';
  return bloque('02', 'Tendencia por temporalidad', `<div class="tendencias">${celdas.join('')}</div>${ema}`);
}

function seccionSetups(d) {
  const e = d.pasos?.escanear ?? {};
  const moneda = d.moneda ?? 'EUR';
  const setups = Array.isArray(e.setups) ? e.setups : [];
  const partes = [];
  if (setups.length) {
    const filas = setups.map(s => {
      const corto = s.direccion === 'corta';
      const chapa = !s.operable ? '<span class="chapa chapa-neutra">solo informativo</span>'
        : s.estado === 'activo' ? '<span class="chapa chapa-pasa">activo</span>' : '<span class="chapa chapa-acento">formándose</span>';
      return `<li><span><span class="nombre">${esc(s.nombre)}</span> <span class="mono suave">${esc(s.intervalo)}</span> ${chapa}</span>` +
        `<span class="fuerza">fuerza <strong class="cifra">${esc(numero(s.fuerza))}</strong>/100</span>` +
        `<span class="niveles">Entrada ${corto ? 'por debajo' : 'por encima'} de <strong class="cifra">${esc(precio(s.nivel_entrada, moneda))}</strong> · ` +
        `deja de valer ${corto ? 'por encima' : 'por debajo'} de <strong class="cifra">${esc(precio(s.nivel_invalidacion, moneda))}</strong></span>` +
        `<span class="por-que">${esc(s.motivo)}</span></li>`;
    });
    partes.push(`<ul class="setups">${filas.join('')}</ul>`);
  } else {
    partes.push('<p>El escáner no ve ningún setup ahora mismo.</p>');
  }
  const ent = valido(d.pasos?.entrada) ? d.pasos.entrada : null;
  if (ent) {
    const chapa = ent.estado === 'disparo' ? 'chapa-pasa' : ent.estado === 'esperar' ? 'chapa-acento' : 'chapa-neutra';
    const nombre = { esperar: 'esperar', disparo: 'disparo', invalidado: 'invalidada', caducado: 'caducada', demasiado_lejos: 'demasiado lejos', hipotetica: 'hipotética', sin_jugada: 'sin jugada' }[ent.estado] ?? ent.estado;
    partes.push(`<h3>Entrada <span class="chapa ${chapa}">${esc(nombre)}</span></h3>${parrafo(ent.motivo)}`);
  }
  const nk = e.niveles_clave ?? {};
  const lista = arr => (Array.isArray(arr) && arr.length
    ? `<ul class="lista-niveles">${arr.map(x => `<li><span>${esc(nombreCorto(x.nombre))}</span><span class="cifra">${esc(precio(x.precio, moneda))} <span class="${claseSigno(x.distancia_pct)}">${esc(pctSigno(x.distancia_pct))}</span></span></li>`).join('')}</ul>`
    : '<p class="vacio">Ninguno cerca.</p>');
  const vigilar = String(d.conclusion?.vigilar || (nk.que_vigilar ?? e.resumen ?? '')).replace(/^Qué vigilar:\s*/, '');
  partes.push(`<h3>Qué vigilar</h3>${parrafo(vigilar)}<div class="dos"><div><p class="pequeno">Por arriba</p>${lista(nk.arriba)}</div><div><p class="pequeno">Por abajo</p>${lista(nk.abajo)}</div></div>`);
  return bloque('03', setups.length ? 'Setups' : 'Setups · qué vigilar', partes.join(''));
}

const SENTIDO = { positivo: 'a favor', negativo: 'en contra', neutro: 'neutro' };
const IMPACTO = { alto: 'impacto alto', medio: 'impacto medio', bajo: 'impacto bajo' };

function seccionNoticias(d) {
  const n = d.pasos?.noticias;
  if (!valido(n)) return bloque('04', 'Noticias', '<p class="vacio">No se leyeron noticias en esta pasada.</p>');
  const mc = n.miedo_codicia;
  const termometro = mc && esNum(mc.valor)
    ? `<div class="termometro" role="img" aria-label="${esc(`Índice de miedo y codicia: ${numero(mc.valor)} de 100, ${mc.clase}`)}"><span style="left: ${Math.max(0, Math.min(100, mc.valor))}%"></span></div>` +
      '<div class="termometro-ejes"><span>0 · miedo extremo</span><span>100 · codicia extrema</span></div>' +
      `<p>Índice de miedo y codicia: <strong class="cifra">${esc(numero(mc.valor))}</strong> de 100, <strong>${esc(mc.clase)}</strong>${mc.fecha ? ` <span class="pequeno">(alternative.me, ${esc(hora(Date.parse(mc.fecha)))})</span>` : ''}.</p>`
    : `<p class="vacio">Sin índice de miedo y codicia${n.miedo_codicia_error ? `: ${esc(n.miedo_codicia_error)}` : ''}.</p>`;
  const lista = Array.isArray(n.noticias) ? n.noticias : [];
  // Primero las de más impacto; dentro de cada grupo, de la más nueva a la más vieja (como llegan).
  const peso = { alto: 0, medio: 1, bajo: 2 };
  const orden = lista.map((x, k) => ({ x, k })).sort((a, b) => ((peso[a.x?.impacto] ?? 3) - (peso[b.x?.impacto] ?? 3)) || a.k - b.k).map(o => o.x);
  const items = orden.slice(0, 12).map(x => {
    const url = enlaceSeguro(x.enlace);
    const titular = url
      ? `<a href="${url}" target="_blank" rel="noopener">${esc(x.titulo)}</a>`
      : `<span class="titular">${esc(x.titulo)}</span>`;
    const sentido = x.sentido === 'positivo' ? 'sube' : x.sentido === 'negativo' ? 'baja' : 'neutro';
    return `<li><div class="meta"><span>${esc(x.fuente)}</span><span class="cifra">${esc(hora(Date.parse(x.fecha)))}</span>` +
      `<span class="${x.impacto === 'alto' ? 'impacto-alto' : ''}">${esc(IMPACTO[x.impacto] ?? x.impacto)}</span><span class="${sentido}">${esc(SENTIDO[x.sentido] ?? x.sentido)}</span></div>${titular}</li>`;
  });
  const ok = (n.fuentes ?? []).filter(f => f.ok).length;
  const cuerpo = lista.length
    ? `<ul class="noticias">${items.join('')}</ul>${lista.length > 12 ? `<p class="pequeno">Y ${lista.length - 12} más en estado/noticias.json.</p>` : ''}<p class="pequeno">Titulares en el idioma original de cada medio. «A favor» y «en contra» es lo que suelen hacer con el precio, no una predicción.</p>`
    : '<p>Ninguna noticia que mueva BTC en ese tiempo.</p>';
  return bloque('04', `Noticias · últimas ${numero(n.horas)} h`, `${termometro}<p class="pequeno">${esc(`${ok} de ${(n.fuentes ?? []).length} medios leídos.`)}</p>${cuerpo}`);
}

function seccionMaquina(d) {
  const m = d.pasos?.maquina;
  if (!valido(m)) return bloque('05', 'Máquina del tiempo', `<p class="vacio">${esc(m?.motivo ?? 'No se ha corrido en esta pasada.')}</p>`);
  const partes = [];
  const s = m.simulacion;
  if (s) {
    const seg = (cls, pct) => (esNum(pct) && pct > 0 ? `<span class="${cls}" style="width: ${numeroCss(pct)}%"></span>` : '');
    partes.push(`<p>${esc(`${numero(s.simulaciones)} futuros de las próximas ${numero(s.horas)} h, rehechos con velas reales de 5 minutos de ${numero(s.dias_usados)} días a esta misma hora.`)}</p>`);
    partes.push(`<div class="apilada" role="img" aria-label="${esc(`Objetivo primero ${fmtPct(s.objetivo_primero_pct, 1)}, sin tocar ${fmtPct(s.abierta_pct, 1)}, stop primero ${fmtPct(s.stop_primero_pct, 1)}`)}">` +
      `${seg('seg-objetivo', s.objetivo_primero_pct)}${seg('seg-abierta', s.abierta_pct)}${seg('seg-stop', s.stop_primero_pct)}</div>`);
    partes.push(`<ul class="apilada-leyenda"><li><i class="seg-objetivo"></i>Objetivo primero <strong class="cifra">${esc(fmtPct(s.objetivo_primero_pct, 1))}</strong></li>` +
      `<li><i class="seg-abierta"></i>Sin tocar ninguno <strong class="cifra">${esc(fmtPct(s.abierta_pct, 1))}</strong></li>` +
      `<li><i class="seg-stop"></i>Stop primero <strong class="cifra">${esc(fmtPct(s.stop_primero_pct, 1))}</strong></li></ul>`);
    const r = s.resultado_pct ?? {};
    partes.push(cifras([
      ['Resultado mediano', `<span class="${claseSigno(r.mediana)}">${esc(pctSigno(r.mediana, 2))}</span>`],
      ['9 de cada 10, entre', `${esc(pctSigno(r.p5, 1))} y ${esc(pctSigno(r.p95, 1))}`],
      ['Esperanza por operación', `<span class="${claseSigno(s.esperanza_R)}">${esc(numero(s.esperanza_R, 2))} R</span>`],
      ['Ajuste de volatilidad', esc(`× ${numero(s.k_volatilidad, 2)}`)],
    ]));
    const hist = svgHistograma(s.histograma);
    if (hist) partes.push(`<div class="histograma">${hist}</div><p class="pequeno">Reparto del resultado neto de cada futuro simulado (en rojo, los que pierden; en verde, los que ganan).</p>`);
    partes.push(parrafo(s.metodo, 'pequeno'));
    for (const a of (s.avisos ?? []).slice(0, 3)) partes.push(parrafo(`Aviso: ${a}`, 'pequeno'));
  } else {
    partes.push(parrafo(`La simulación no se ha podido hacer: ${m.error_simulacion ?? 'sin datos'}.`, 'vacio'));
  }
  const h = m.historico;
  partes.push('<h3>Histórico de la regla</h3>');
  if (h) {
    partes.push(`<p>${esc(`«${h.nombre}» repetida en el pasado real con velas de 1 h, ${numero(Math.round(((h.hasta ?? 0) - (h.desde ?? h.hasta ?? 0)) / DIA))} días, una operación a la vez.`)}</p>`);
    partes.push(cifras([
      ['Operaciones', esc(numero(h.senales))],
      ['Al objetivo / al stop / sin tocar', esc(`${numero(h.objetivo)} / ${numero(h.stop)} / ${numero(h.abiertas)}`)],
      ['Acierto', esc(fmtPct(h.acierto_pct, 1))],
      ['Esperanza', `<span class="${claseSigno(h.esperanza_R)}">${esc(`${numero(h.esperanza_R, 2)} R`)}</span>`],
      ['Total', `<span class="${claseSigno(h.R_total)}">${esc(`${numero(h.R_total, 2)} R`)}</span>`],
    ]));
    const ultimas = (h.lista ?? []).slice(-8).reverse();
    if (ultimas.length) {
      const filas = ultimas.map(o => `<tr><td class="cifra">${esc(hora(o.t_entrada).replace(/\/\d{4}/, ''))}</td><td class="n">${esc(precio(o.entrada, d.moneda))}</td><td class="n">${esc(precio(o.salida, d.moneda))}</td>` +
        `<td>${esc({ objetivo: 'objetivo', stop: 'stop', abierta: 'sin tocar' }[o.resultado] ?? o.resultado)}</td><td class="n ${claseSigno(o.R)}">${esc(numero(o.R, 2))} R</td></tr>`);
      partes.push(`<div class="tabla"><table class="compacta"><thead><tr><th>Entrada</th><th class="n">Precio</th><th class="n">Salida</th><th>Fin</th><th class="n">R</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>`);
    }
  } else {
    partes.push(parrafo(m.sin_regla ?? (m.error_historico ? `No se ha podido hacer: ${m.error_historico}` : 'Sin datos.')));
  }
  partes.push(parrafo('La simulación dice qué pasaría si las próximas horas se movieran como los últimos días a esta hora; el histórico, cómo le fue a esta misma regla cuando salió de verdad. Ninguna de las dos predice: no ven las noticias que vengan ni las rachas largas.', 'suave'));
  return bloque('05', 'Máquina del tiempo', partes.join(''));
}

// Anchuras en CSS con punto decimal (no coma).
const numeroCss = x => String(Math.round(x * 100) / 100);

function seccionPresupuesto(d) {
  const p = d.pasos?.presupuesto;
  const plan = valido(d.pasos?.salida) ? d.pasos.salida : null;
  if (!valido(p)) return bloque('06', 'Presupuesto', `<p class="vacio">${esc(p?.motivo ?? 'Sin orden: no hay nada que dimensionar.')}</p>`);
  const moneda = d.moneda ?? 'EUR';
  const MANDA = { perdida_max: 'tu pérdida máxima por operación', posicion_max: 'el tamaño máximo de la posición', efectivo: 'el efectivo libre', minimo: 'el mínimo de orden' };
  const partes = [];
  if (plan) {
    partes.push(cifras([
      ['Entrada', esc(precio(plan.entrada, moneda))],
      ['Stop', `<span class="baja">${esc(precio(plan.stop, moneda))}</span>`],
      ['Objetivo', `<span class="sube">${esc(precio(plan.objetivo, moneda))}</span>`],
      ['R:R (con costes)', esc(`${numero(plan.rr, 2)} (${numero(plan.rr_neto, 2)})`)],
    ]));
  }
  partes.push(cifras([
    ['BTC', esc(fmtBtc(p.btc))],
    ['Coste con comisión', esc(fmtDinero(p.coste, moneda))],
    ['Si salta el stop', `<span class="baja">${esc(fmtDinero(-p.perdida_si_stop, moneda))}</span>`],
    ['Manda', esc(MANDA[p.limitado_por] ?? p.limitado_por), true],
  ]));
  partes.push(parrafo(p.motivo));
  if (plan?.salida_por_tiempo) partes.push(parrafo(`Si no toca stop ni objetivo, se sale a mercado el ${horaUtc(plan.salida_por_tiempo)}.`, 'suave'));
  for (const a of plan?.avisos ?? []) partes.push(parrafo(`Aviso: ${a}`, 'pequeno'));
  return bloque('06', d.hipotetica ? 'Presupuesto · orden hipotética' : 'Presupuesto', partes.join(''));
}

function seccionRiesgo(d) {
  const r = d.pasos?.riesgo;
  const t = d.pasos?.ticket;
  if (!valido(r)) return bloque('07', 'Riesgo', `<p class="vacio">${esc(r?.motivo ?? 'Sin orden: no hay nada que comprobar.')}</p>`);
  const pasa = r.veredicto === 'PASA';
  const ok = r.comprobaciones.filter(c => c.ok).length;
  const reglas = r.comprobaciones.map(c => `<li><span><span class="chapa ${c.ok ? 'chapa-pasa' : 'chapa-bloquea'}">${c.ok ? 'PASA' : 'BLOQUEA'}</span></span>` +
    `<span class="nombre">${esc(c.nombre ?? c.regla)}</span><span class="det">${esc(c.detalle)}</span></li>`);
  const partes = [`<p class="veredicto"><span class="chapa ${pasa ? 'chapa-pasa' : 'chapa-bloquea'}">${esc(r.veredicto)}</span><span>${esc(`${ok} de ${r.comprobaciones.length} reglas pasan${d.hipotetica ? ' · orden HIPOTÉTICA' : ''}`)}</span></p>`];
  partes.push(`<ul class="reglas">${reglas.join('')}</ul>`);
  for (const a of r.avisos ?? []) partes.push(parrafo(`Aviso: ${a}`, 'pequeno'));
  if (valido(t)) {
    partes.push('<h3>Ticket</h3>');
    if (t.texto) partes.push(`<div class="ticket">${esc(t.texto)}</div>`);
    partes.push(parrafo(t.vigente
      ? 'Aquí se para: no se abre nada sin un «sí» expreso a este ticket concreto (papel abrir --confirmar sí).'
      : `No se puede abrir: ${t.motivo_no_vigente ?? ''}`, 'suave'));
  }
  return bloque('07', 'Riesgo', partes.join(''));
}

function seccionCartera(d) {
  if (!d.cartera) return bloque('08', 'Cartera de papel', `<p class="vacio">${esc(d.error_cartera ?? 'Sin cartera.')}</p>`);
  const { resumen: c, historial = [], precio_de: pr } = d.cartera;
  const moneda = c.moneda ?? d.moneda ?? 'EUR';
  const partes = [cifras([
    ['Capital', esc(fmtDinero(c.capital, moneda))],
    ['Efectivo', esc(fmtDinero(c.efectivo, moneda))],
    ['Desde el inicio', `<span class="${claseSigno(c.pnl_total)}">${esc(`${fmtDinero(c.pnl_total, moneda)} (${pctSigno(c.pnl_total_pct, 2)})`)}</span>`],
    ['Hoy cerrado', `<span class="${claseSigno(c.pnl_hoy)}">${esc(fmtDinero(c.pnl_hoy, moneda))}</span>`],
  ])];
  if (c.posiciones?.length) {
    const filas = c.posiciones.map(p => `<tr><td class="mono">${esc(p.id)}</td><td class="n">${esc(fmtBtc(p.btc))}</td><td class="n">${esc(precio(p.precio_entrada, moneda))}</td>` +
      `<td class="n">${esc(precio(p.stop, moneda))}</td><td class="n">${esc(precio(p.objetivo, moneda))}</td><td class="n ${claseSigno(p.pnl_latente)}">${esc(fmtDinero(p.pnl_latente, moneda))}</td><td class="cifra">${esc(hora(p.salida_por_tiempo))}</td></tr>`);
    partes.push(`<h3>Abiertas</h3><div class="tabla"><table><thead><tr><th>Id</th><th class="n">BTC</th><th class="n">Entrada</th><th class="n">Stop</th><th class="n">Objetivo</th><th class="n">Latente</th><th>Se cierra sola</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>`);
  } else {
    partes.push('<p>Sin posiciones abiertas.</p>');
  }
  if (historial.length) {
    const MOTIVO = { stop: 'stop', objetivo: 'objetivo', tiempo: 'hora de salida', manual: 'a mano' };
    const filas = historial.map(h => `<tr><td class="mono">${esc(h.id)}</td><td>${esc(MOTIVO[h.motivo] ?? h.motivo)}</td><td class="n">${esc(precio(h.precio_entrada, moneda))}</td>` +
      `<td class="n">${esc(precio(h.precio_salida, moneda))}</td><td class="n ${claseSigno(h.pnl)}">${esc(fmtDinero(h.pnl, moneda))}</td><td class="cifra">${esc(hora(h.cerrada))}</td></tr>`);
    partes.push(`<h3>Últimas cerradas</h3><div class="tabla"><table><thead><tr><th>Id</th><th>Motivo</th><th class="n">Entrada</th><th class="n">Salida</th><th class="n">Resultado</th><th>Cerrada</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>`);
  }
  partes.push(parrafo(`Dinero de mentira: empezó con ${fmtDinero(c.saldo_inicial, moneda)}. Valorada a ${pr ? `${precio(pr.precio, moneda)} (${NOMBRE_FUENTE[pr.fuente] ?? pr.fuente ?? '—'}, ${hora(pr.hora)})` : 'su precio de entrada'}.`, 'pequeno'));
  return bloque('08', 'Cartera de papel', partes.join(''));
}

function pie(d) {
  const e = d.pasos?.escanear ?? {};
  const fuentesVelas = Object.entries(e.fuentes_velas ?? {}).map(([iv, f]) => `${iv}: ${NOMBRE_FUENTE[f.fuente] ?? f.fuente}`).join(' · ');
  const px = e.precios_exchanges;
  const precios = (px?.precios ?? []).map(p => `${NOMBRE_FUENTE[p.fuente] ?? p.fuente} ${precio(p.precio, d.moneda)}`).join(' · ');
  const div = esNum(px?.divergencia_pct) && (px?.precios?.length ?? 0) >= 2 ? ` (se separan un ${fmtPct(px.divergencia_pct, 3)})` : '';
  const n = d.pasos?.noticias;
  const medios = valido(n) ? (n.fuentes ?? []).map(f => `${f.nombre}${f.ok ? '' : ' (sin respuesta)'}`).join(', ') : '';
  const items = [
    fuentesVelas && `Velas: ${fuentesVelas}.`,
    precios && `Precios de los exchanges: ${precios}${div}.`,
    medios && `Noticias: ${medios}. Índice de miedo y codicia: alternative.me.`,
    'Datos públicos y gratuitos: pueden fallar o ir con retraso.',
  ].filter(Boolean);
  return `<footer class="pie"><p class="aviso">${esc(AVISO)}</p><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` +
    `<p class="pequeno">Datos de ${esc(horaUtc(d.hora))}; página generada el ${esc(horaUtc(d.generado ?? d.hora))}.</p></footer>`;
}

function cuerpo(datos) {
  const d = datos && typeof datos === 'object' ? datos : {};
  if (!d.pasos) d.pasos = {};
  return `<main class="pagina">
${cabecera(d)}
${seccionGrafico(d)}
${seccionTendencias(d)}
${seccionSetups(d)}
${seccionNoticias(d)}
${seccionMaquina(d)}
${seccionPresupuesto(d)}
${seccionRiesgo(d)}
${seccionCartera(d)}
${pie(d)}
</main>`;
}

const cabezaComun = () => `<title>BTC en papel</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FUENTES_GOOGLE}">
<style>
${CSS}
</style>`;

/**
 * Fragmento para publicar como artefacto: <title>, la meta de los bordes,
 * <style> y el contenido (sin doctype, html, head ni body).
 */
export function paginaInforme(datos) {
  return `${cabezaComun()}
<meta name="claude:viewport-fit-sides" content="cover">
${cuerpo(datos)}
`;
}

/** Documento completo para abrirlo en local. */
export function documentoInforme(datos) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${cabezaComun()}
</head>
<body>
${cuerpo(datos)}
</body>
</html>
`;
}
