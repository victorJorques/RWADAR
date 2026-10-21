// Biblioteca de escenas: una por tipo de inversión. Cada función
// recibe el color de la categoría y opciones, y devuelve SVG en el lienzo de
// 1280×880. La escena ocupa la mitad derecha; la izquierda es para los pasos.
import { lienzo, MAT, tono, semilla } from './motor.mjs';

const CX = 980, CY = 515;   // centro de la plataforma en pantalla
const S = 40;

const num = (v, d) => (v === undefined ? d : Number(v));
const mat = (v, d) => MAT[v] || d;
const luces = (n, p = .35) => { const r = semilla(n); const m = new Map(); return (f, k) => { const q = `${f},${k}`; if (!m.has(q)) m.set(q, r() < p); return m.get(q); }; };

function nuevo({ s = S, dy = 0 } = {}) { return lienzo({ ox: CX, oy: CY + dy, s }); }
function base(L, c, { w = 8, d = 8, losetas = [] } = {}) {
  L.capa(-100);
  L.crudo(`<ellipse cx="${CX}" cy="${CY + 40}" rx="340" ry="150" fill="url(#charco)" filter="url(#suave)"/>`);
  L.plataforma(-w / 2, -d / 2, w, d, c, { losetas });
}
// Cubos de participación: [x, y, z, tamaño].
function cubos(L, c, lista) { for (const [x, y, z, t = .9] of lista) { L.capa(x + y + t + z * .01); L.cubo(x, y, z, t, c); } }
function arboles(L, lista) { for (const [x, y, t = .9] of lista) { L.capa(x + y + .4); L.arbol(x, y, 0, t); } }
// Palmera: tronco curvo con anillos y seis hojas.
function palmera(L, x, y, t = 1) {
  const [bx, by] = L.p(x, y, 0), [tx0, ty] = L.p(x, y, 2.6 * t), tx = tx0 + 10 * t;
  const hojas = [[-62, -10], [-44, 18], [-10, 30], [26, 22], [56, -4], [8, -26]].map(([dx, dy], i) =>
    `<path d="M${tx},${ty} Q${tx + dx * .5},${ty + dy * .2 - 26 * t} ${tx + dx * t},${ty + dy * t}" fill="none" stroke="${i % 2 ? '#5E9E52' : '#447C3E'}" stroke-width="${(9 * t).toFixed(1)}" stroke-linecap="round"/>`).join('');
  L.crudo(`<ellipse cx="${bx}" cy="${by}" rx="${(16 * t).toFixed(1)}" ry="${(7 * t).toFixed(1)}" fill="#000" opacity=".35"/>` +
    `<path d="M${bx},${by} Q${bx + 2},${(by + ty) / 2} ${tx},${ty}" fill="none" stroke="#7A5C3A" stroke-width="${(7 * t).toFixed(1)}" stroke-linecap="round"/>` +
    `<path d="M${bx},${by} Q${bx + 2},${(by + ty) / 2} ${tx},${ty}" fill="none" stroke="#A88458" stroke-width="${(7 * t).toFixed(1)}" stroke-dasharray="2 9"/>` + hojas);
}
function palmeras(L, lista) { for (const [x, y, t = 1] of lista) { L.capa(x + y + .5); palmera(L, x, y, t); } }
function vegetacion(L, op, lista) { if (op.palmeras) palmeras(L, lista.map(([x, y, t = .9]) => [x, y, t * 1.05])); else arboles(L, lista); }
// Piscina sobre la plataforma.
function piscina(L, x, y, w, d) {
  L.capa(-49);
  L.poli([[x, y, .02], [x + w, y, .02], [x + w, y + d, .02], [x, y + d, .02]], 'fill="#E8E2D6" stroke="rgba(255,255,255,.4)" stroke-width="1"');
  L.poli([[x + .15, y + .15, .03], [x + w - .15, y + .15, .03], [x + w - .15, y + d - .15, .03], [x + .15, y + d - .15, .03]], 'fill="#3BA9CF"');
  L.poli([[x + .3, y + .3, .04], [x + w * .55, y + .3, .04], [x + w * .35, y + d - .3, .04], [x + .3, y + d - .3, .04]], 'fill="#fff" opacity=".18"');
}
// Paisaje de fondo detrás de la plataforma: montaña, pirineo, colinas,
// desierto, mar o ciudad.
function fondo(L, tipo) {
  if (!tipo) return;
  L.capa(-200);
  const monte = (x, y, h, col, nieve = true) => `<path d="M${x - h * .95},${y} L${x},${y - h} L${x + h * .95},${y} Z" fill="${col}"/>` +
    (nieve ? `<path d="M${x - h * .26},${y - h * .73} L${x},${y - h} L${x + h * .26},${y - h * .73} L${x + h * .1},${y - h * .66} L${x - h * .05},${y - h * .72} L${x - h * .14},${y - h * .66} Z" fill="#F1EEE8"/>` : '');
  if (tipo === 'montaña') L.crudo(monte(1100, 470, 290, '#2A2C30') + monte(870, 470, 220, '#34373C') + monte(1230, 470, 200, '#24262A'));
  if (tipo === 'pirineo') L.crudo(monte(1110, 470, 250, '#263129') + monte(880, 470, 200, '#2E3A30', false) + monte(1240, 470, 180, '#222B24'));
  if (tipo === 'colinas') L.crudo('<path d="M640,470 C760,380 860,400 960,430 C1060,360 1170,380 1280,420 L1280,470 Z" fill="#22352A"/><path d="M700,470 C820,420 920,440 1010,450 C1110,410 1200,430 1280,445 L1280,470 Z" fill="#2B4433"/>');
  if (tipo === 'desierto') L.crudo('<path d="M640,470 C760,410 880,430 980,445 C1080,400 1180,415 1280,440 L1280,470 Z" fill="#5A4A36"/><path d="M700,470 C800,440 900,452 1000,458 C1100,436 1200,446 1280,456 L1280,470 Z" fill="#6E5A40"/>');
  if (tipo === 'mar') L.crudo('<linearGradient id="marFundido" x1="0" x2="1"><stop offset="0" stop-color="#173847" stop-opacity="0"/><stop offset=".25" stop-color="#173847"/></linearGradient>' +
    '<rect x="700" y="388" width="580" height="82" fill="url(#marFundido)"/><rect x="760" y="388" width="520" height="3" fill="#3E7E96"/>' +
    [0, 1, 2, 3].map(i => `<path d="M${700 + i * 140},${412 + (i % 2) * 22} q20,-6 40,0 t40,0" fill="none" stroke="#5FA3BA" stroke-width="2.5" opacity=".6"/>`).join(''));
  if (tipo === 'ciudad') L.crudo([[690, 90], [740, 150], [800, 110], [1140, 170], [1200, 120], [1240, 90]].map(([x, h], i) =>
    `<rect x="${x}" y="${470 - h}" width="${38 + (i % 3) * 8}" height="${h}" fill="#1D1C1A"/>` +
    Array.from({ length: Math.floor(h / 26) }, (_, k) => ((k + i) % 3 ? '' : `<rect x="${x + 10}" y="${470 - h + 12 + k * 26}" width="8" height="8" fill="#F3A945" opacity=".55"/>`)).join('')).join(''));
}
const CUBOS = [[-3.5, -3.4, 3.6], [2.6, -3.6, 4.8], [-3.8, 2.6, 2.4, .75]];

// Bloque de pisos. op: pisos, mat, semilla.
function bloque(L, x, y, w, d, pisos, m, sem, { atico = true } = {}) {
  const h = pisos * 1.05;
  L.caja(x, y, 0, w, d, h, m);
  L.ventanas('izq', x, y, 0, w, d, h, { filas: pisos, cols: Math.max(2, Math.round(w)), luz: luces(sem) });
  L.ventanas('der', x, y, 0, w, d, h, { filas: pisos, cols: Math.max(2, Math.round(d)), luz: luces(sem + 1, .25) });
  L.forjados(x, y, 0, w, d, h, pisos);
  if (atico) L.caja(x + w * .25, y + d * .25, h, w * .5, d * .5, .6, MAT.blanco);
  return h;
}
function casita(L, x, y, w, d, m, t, { plantas = 1, luz = 1 } = {}) {
  const h = plantas * 1.5;
  L.caja(x, y, 0, w, d, h, m);
  L.ventanas('izq', x, y, 0, w, d, h, { filas: plantas, cols: Math.max(2, Math.round(w / 1.4)), luz: (f, k) => k === luz, alto: .62 });
  L.ventanas('der', x, y, 0, w, d, h, { filas: plantas, cols: Math.max(1, Math.round(d / 1.6)), alto: .62 });
  L.tejado(x - .2, y - .2, h, w + .4, d + .4, Math.min(1.6, d * .45), t);
}
// Villa mediterránea o de costa: volúmenes blancos de cubierta plana,
// terraza y grandes ventanales.
function villaForma(L, x, y, m) {
  L.caja(x, y, 0, 4.2, 3, 1.5, m);
  L.ventanas('izq', x, y, 0, 4.2, 3, 1.5, { filas: 1, cols: 2, luz: () => true, alto: .95, margen: .4 });
  L.ventanas('der', x, y, 0, 4.2, 3, 1.5, { filas: 1, cols: 2, luz: (f, k) => k === 1, alto: .9, margen: .4 });
  L.caja(x + .6, y, 1.5, 2.8, 2.2, 1.35, m);
  L.ventanas('izq', x + .6, y, 1.5, 2.8, 2.2, 1.35, { filas: 1, cols: 2, luz: (f, k) => k === 0, alto: .85, margen: .35 });
  L.caja(x - .1, y - .1, 1.48, 4.4, 3.2, .1, MAT.grafito, { sombra: false });
  L.caja(x + .5, y - .1, 2.83, 3, 2.4, .1, MAT.grafito, { sombra: false });
}
// Edificio de apartamentos bajo y ancho con balcones corridos.
function condo(L, x, y, w, d, pisos, m, sem) {
  const h = bloque(L, x, y, w, d, pisos, m, sem, { atico: false });
  for (let i = 1; i <= pisos; i++) L.caja(x, y + d, i * 1.05 - .55, w, .35, .07, MAT.blanco, { sombra: false });
  L.caja(x - .1, y - .1, h, w + .2, d + .2, .16, MAT.piedra, { sombra: false });
  return h;
}
// Porche corrido delante de la fachada izquierda (casas de EE. UU.).
function porche(L, x, y, w) {
  L.caja(x, y, 0, w, .9, .12, MAT.madera, { sombra: false });
  for (const k of [.15, w / 2 - .06, w - .27]) L.caja(x + k, y + .72, .12, .12, .12, 1.2, MAT.blanco, { sombra: false });
  L.caja(x - .05, y, 1.32, w + .1, .95, .12, MAT.grafito, { sombra: false });
}
// Grúa de obra junto a un edificio en construcción.
function grua(L, x, y, h, c) {
  L.linea([x, y, 0], [x, y, h], `stroke="${c}" stroke-width="6"`);
  L.linea([x - 3.4, y, h], [x + 1.2, y, h], `stroke="${c}" stroke-width="5"`);
  L.linea([x, y, h + .9], [x - 3.4, y, h], `stroke="${c}" stroke-width="2"`);
  L.linea([x, y, h + .9], [x + 1.2, y, h], `stroke="${c}" stroke-width="2"`);
  L.linea([x - 2.4, y, h], [x - 2.4, y, h - 1.4], 'stroke="#B9B1A2" stroke-width="2"');
  L.caja(x + .6, y - .25, h - .45, .6, .5, .45, MAT.grafito, { sombra: false });
}
// Hotel: bloque con marquesina de entrada y, si se pide, piscina.
function hotelForma(L, x, y, w, d, pisos, m, op = {}) {
  const h = bloque(L, x, y, w, d, pisos, m, 37, { atico: true });
  L.caja(x + w * .3, y + d, 1.1, w * .4, .7, .12, MAT.grafito, { sombra: false });
  for (const k of [.32, .66]) L.caja(x + w * k, y + d + .55, 0, .1, .1, 1.1, MAT.blanco, { sombra: false });
  return h;
}
// Teléfono de pie con la app abierta: la pantalla mira al frente izquierdo.
function telefono(L, x, y, c) {
  L.caja(x, y, 0, 1.3, .24, 2.3, MAT.grafito, { borde: 'rgba(255,255,255,.3)' });
  const yy = y + .24, q = (a, b, z1, z2) => [[x + a, yy, z1], [x + b, yy, z1], [x + b, yy, z2], [x + a, yy, z2]];
  L.poli(q(.1, 1.2, .14, 2.12), `fill="#0E1418" stroke="${c}" stroke-width="2"`);
  L.poli(q(.25, 1.05, 1.15, 1.85), `fill="${c}" fill-opacity=".85" filter="url(#brillo)"`);
  L.poli(q(.25, .9, .78, .92), 'fill="#F7F5F0" opacity=".8"');
  L.poli(q(.25, .7, .5, .62), 'fill="#F7F5F0" opacity=".5"');
}

// Vivienda en un bloque de pisos (alquiler). op: pisos, mat, semilla,
// estilo='clasico' (zócalo, cornisa y mansarda, como un edificio antiguo de
// ciudad), fondo, palmeras, piscina.
export function edificio(c, op = {}) {
  const L = nuevo();
  fondo(L, op.fondo);
  base(L, c);
  const clasico = op.estilo === 'clasico';
  L.capa(0); const h = bloque(L, -2, -1.6, 4, 3.2, num(op.pisos, 6), mat(op.mat, MAT.piedra), num(op.semilla, 7), { atico: !clasico });
  if (clasico) {
    L.caja(-2.18, -1.78, h - .02, 4.36, 3.56, .26, MAT.blanco);
    L.tejado(-2.05, -1.65, h + .24, 4.1, 3.3, 1.1, MAT.pizarra);
  }
  if (op.piscina) piscina(L, 1.1, 2, 2.4, 1.4);
  vegetacion(L, op, [[-3, 2.5], [-1.1, 2.7], [2.8, op.piscina ? 3.6 : 2.3], [3, .3]]);
  cubos(L, c, CUBOS);
  return L.svg();
}
// Torre residencial alta (apartamentos en ciudad).
export function torre(c, op = {}) {
  const L = nuevo({ s: 36, dy: 40 });
  fondo(L, op.fondo);
  base(L, c, { w: 8.4, d: 8.4 });
  L.capa(0); bloque(L, -1.6, -1.4, 3.2, 2.8, num(op.pisos, 8), mat(op.mat, MAT.blanco), num(op.semilla, 3));
  L.capa(2); L.caja(1.9, -1.2, 0, 1.6, 2.4, 1.2, MAT.grafito);
  if (op.piscina) piscina(L, 1.3, 1.8, 2.4, 1.5);
  vegetacion(L, op, [[-3, 2.8, .8], [2.6, op.piscina ? 3.7 : 3, .8], [-1, 3.2, .7], [-3.4, .8, 1]]);
  cubos(L, c, [[-3.6, -3.6, 4.6], [2.8, -3.8, 6.4], [-3.9, 2.4, 2.6, .75]]);
  return L.svg();
}
// Casa unifamiliar con jardín. op: plantas, mat, tejado.
export function casa(c, op = {}) {
  const L = nuevo({ s: 44, dy: 10 });
  fondo(L, op.fondo);
  base(L, c, { w: 7.4, d: 7.4 });
  L.capa(-50); L.suelo(-3.2, 1.8, 6, 1.7, 'fill="#2F4A32" opacity=".75"');
  L.capa(0); casita(L, -2.4, -1.6, 4.4, 3.2, mat(op.mat, MAT.blanco), mat(op.tejado, MAT.pizarra), { plantas: num(op.plantas, 1) });
  L.caja(2.1, -1.2, 0, 1.2, 1.8, 1.1, MAT.grafito);
  if (op.piscina) piscina(L, .5, 2.1, 2.2, 1.2);
  vegetacion(L, op, [[-3, 2.6], [2.9, 2.6, .8], [3, -.8, 1], [-3.2, -1, 1]]);
  cubos(L, c, [[-3.4, -3.2, 3], [2.4, -3.4, 3.8], [3, 2.9, 1.8, .7]]);
  return L.svg();
}
// Hilera de casas adosadas (varias viviendas en una oferta).
export function adosados(c, op = {}) {
  const L = nuevo({ s: 40 });
  base(L, c);
  const m = mat(op.mat, MAT.arena), t = mat(op.tejado, MAT.teja);
  for (let i = 0; i < 3; i++) { L.capa(-2 + i * 2); casita(L, -3 + i * 2.1, -1.4, 1.9, 2.8, i === 1 ? MAT.blanco : m, t, { plantas: 2, luz: 0 }); }
  arboles(L, [[-3.2, 2.4], [0, 2.6, .8], [3.2, 2.2]]);
  cubos(L, c, [[-3.4, -3.6, 4.2], [2.8, -3.6, 4.8], [3.2, 3, 1.6, .7]]);
  return L.svg();
}
// Apartamento vacacional en los Alpes: chalé con montañas detrás.
export function chalet(c, op = {}) {
  const L = nuevo({ s: 42, dy: 20 });
  const monte = (x, y, h, col) => `<path d="M${x - h * .95},${y} L${x},${y - h} L${x + h * .95},${y} Z" fill="${col}"/>` +
    `<path d="M${x - h * .26},${y - h * .73} L${x},${y - h} L${x + h * .26},${y - h * .73} L${x + h * .1},${y - h * .66} L${x - h * .05},${y - h * .72} L${x - h * .14},${y - h * .66} Z" fill="#F1EEE8"/>`;
  L.capa(-200); L.crudo(monte(1080, 470, 300, '#2A2C30') + monte(850, 470, 230, '#34373C') + monte(1220, 470, 200, '#24262A'));
  base(L, c, { w: 7.6, d: 7.6 });
  L.capa(0);
  L.caja(-2.2, -1.6, 0, 4.2, 3.2, 1.4, MAT.piedra);
  L.caja(-2.2, -1.6, 1.4, 4.2, 3.2, 1.3, MAT.madera);
  L.ventanas('izq', -2.2, -1.6, 0, 4.2, 3.2, 2.7, { filas: 2, cols: 3, luz: (f, k) => f === 1 && k !== 2, alto: .6 });
  L.ventanas('der', -2.2, -1.6, 0, 4.2, 3.2, 2.7, { filas: 2, cols: 2, alto: .6 });
  L.tejado(-2.5, -1.9, 2.7, 4.8, 3.8, 1.9, MAT.pizarra);
  L.caja(-2.6, 1.6, 1.3, 4.8, .5, .14, MAT.madera);
  arboles(L, [[-3.2, 2.6, 1.1], [3, 2, 1.2], [2.9, -2.2, 1.3], [-.6, 3, .9]]);
  cubos(L, c, [[-3.4, -3.3, 3.6], [2.6, -3.5, 4.4], [3.1, 3, 1.8, .7]]);
  return L.svg();
}
// Local comercial en planta baja, con toldo.
export function local(c, op = {}) {
  const L = nuevo({ s: 42 });
  base(L, c, { w: 7.6, d: 7.6 });
  L.capa(0);
  L.caja(-2.4, -1.6, 0, 4.6, 3.2, 1.7, MAT.grafito);
  L.ventanas('izq', -2.4, -1.6, 0, 4.6, 3.2, 1.7, { filas: 1, cols: 2, luz: () => true, alto: .9, margen: .35 });
  L.ventanas('der', -2.4, -1.6, 0, 4.6, 3.2, 1.7, { filas: 1, cols: 2, luz: (f, k) => k === 0, alto: .9, margen: .35 });
  L.caja(-2.4, -1.6, 1.7, 4.6, 3.2, 3.2, MAT.arena);
  L.ventanas('izq', -2.4, -1.6, 1.7, 4.6, 3.2, 3.2, { filas: 3, cols: 4, luz: luces(11) });
  L.ventanas('der', -2.4, -1.6, 1.7, 4.6, 3.2, 3.2, { filas: 3, cols: 3, luz: luces(12, .2) });
  L.forjados(-2.4, -1.6, 1.7, 4.6, 3.2, 3.2, 3);
  L.poli([[-2.5, 1.6, 1.75], [2.3, 1.6, 1.75], [2.3, 2.5, 1.35], [-2.5, 2.5, 1.35]], `fill="${c}" stroke="${tono(c, .9)}" stroke-width="1"`);
  for (let i = 0; i < 6; i++) L.poli([[-2.5 + i * .8, 1.6, 1.75], [-2.1 + i * .8, 1.6, 1.75], [-2.1 + i * .8, 2.5, 1.35], [-2.5 + i * .8, 2.5, 1.35]], 'fill="#fff" opacity=".28"');
  arboles(L, [[-3.2, 2.8, .8], [3, 2.4, .9]]);
  cubos(L, c, CUBOS);
  return L.svg();
}
// Terreno arrendado a largo plazo a un supermercado.
export function terreno(c, op = {}) {
  const L = nuevo({ s: 38 });
  base(L, c, { w: 9, d: 8.4 });
  L.capa(-60); L.suelo(-4.5, -4.2, 9, 8.4, 'fill="#2B4A30" opacity=".55"');
  L.capa(-59);
  for (let i = 0; i < 6; i++) L.linea([-1 + i * .9, 1.6, .01], [-1 + i * .9, 3.4, .01], 'stroke="#F1EEE8" stroke-opacity=".55" stroke-width="2"');
  L.suelo(-1.6, 1.4, 6, 2.3, 'fill="#3A3936" opacity=".9"');
  for (let i = 0; i < 7; i++) L.linea([-1.2 + i * .85, 1.5, .01], [-1.2 + i * .85, 2.5, .01], 'stroke="#F1EEE8" stroke-opacity=".6" stroke-width="2"');
  L.capa(0);
  L.caja(-3, -3, 0, 6.4, 3.8, 1.6, MAT.blanco);
  L.caja(-3, .8, 1.1, 6.4, .5, .22, { top: c, izq: c, der: tono(c, .7) }, { sombra: false });
  L.ventanas('izq', -3, -3, 0, 6.4, 3.8, 1.05, { filas: 1, cols: 3, luz: (f, k) => k === 1, alto: 1.1 });
  // hito que marca el límite de la parcela
  for (const [x, y] of [[-4.2, -3.9], [4.2, -3.9], [-4.2, 3.9], [4.2, 3.9]]) { L.capa(x + y); L.linea([x, y, 0], [x, y, .9], `stroke="${c}" stroke-width="5" stroke-linecap="round"`); }
  arboles(L, [[-3.6, 3, .8], [3.6, 3.4, .8], [3.8, -1.4, .9]]);
  cubos(L, c, [[-3.8, -3.8, 3], [2.8, -3.9, 3.8], [-4, 2.2, 1.8, .7]]);
  return L.svg();
}
// Planta fotovoltaica. op: sobre=tejado|campo.
export function solar(c, op = {}) {
  const L = nuevo({ s: 40 });
  base(L, c);
  const panel = (x, y, z) => {
    const a = [x, y, z + .7], b = [x + 1.8, y, z + .7], cc = [x + 1.8, y + 1.1, z + .2], d = [x, y + 1.1, z + .2];
    L.poli([a, b, cc, d], 'fill="#1D3556" stroke="#8FB2E8" stroke-width="1.6"');
    for (let k = 1; k < 4; k++) L.linea([x + k * .45, y, z + .7], [x + k * .45, y + 1.1, z + .2], 'stroke="#8FB2E8" stroke-opacity=".55" stroke-width="1.2"');
    L.linea([x, y + .55, z + .45], [x + 1.8, y + .55, z + .45], 'stroke="#8FB2E8" stroke-opacity=".55" stroke-width="1.2"');
    L.poli([[x + .1, y + .05, z + .68], [x + .7, y + .05, z + .68], [x + .7, y + .4, z + .52], [x + .1, y + .4, z + .52]], 'fill="#fff" opacity=".18"');
    L.linea([x + .3, y + 1.1, z + .2], [x + .3, y + 1.1, z], 'stroke="#6A655C" stroke-width="3"');
    L.linea([x + 1.5, y + 1.1, z + .2], [x + 1.5, y + 1.1, z], 'stroke="#6A655C" stroke-width="3"');
  };
  if (op.sobre === 'tejado') {
    L.capa(0); L.caja(-3, -2.4, 0, 6, 4.4, 2.2, MAT.piedra);
    L.ventanas('izq', -3, -2.4, 0, 6, 4.4, 2.2, { filas: 2, cols: 5, luz: luces(5, .4) });
    L.ventanas('der', -3, -2.4, 0, 6, 4.4, 2.2, { filas: 2, cols: 4, luz: luces(6, .2) });
    for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) { L.capa(f + k + 1); panel(-2.8 + k * 1.95, -2.2 + f * 1.4, 2.2); }
    arboles(L, [[-3.4, 2.8], [3.4, 2.6, .8]]);
  } else {
    for (let f = 0; f < 4; f++) for (let k = 0; k < 3; k++) { L.capa(f + k); panel(-3.4 + k * 2.3, -3.5 + f * 1.8, 0); }
  }
  L.capa(-150);
  L.crudo(`<g filter="url(#brillo)"><circle cx="1150" cy="190" r="42" fill="#FFD36B"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${1150 + 58 * Math.cos(a)}" y1="${190 + 58 * Math.sin(a)}" x2="${1150 + 80 * Math.cos(a)}" y2="${190 + 80 * Math.sin(a)}" stroke="#FFD36B" stroke-width="7" stroke-linecap="round"/>`; }).join('')}</g>`);
  cubos(L, c, [[-3.9, -3.8, 3.8], [3.2, 3.1, 1.6, .7], [-4, 2.6, 2.2, .7]]);
  return L.svg();
}
// Hotel o edificio turístico.
export function hotel(c, op = {}) {
  const L = nuevo({ s: 38 });
  base(L, c);
  L.capa(0); bloque(L, -3, -1.6, 6, 3, num(op.pisos, 4), MAT.blanco, 21);
  L.capa(-50); L.suelo(-1.6, 2, 3.2, 1.4, 'fill="#3FA7C8" opacity=".8"');
  arboles(L, [[-3.2, 2.8, 1.1], [3.2, 2.6, 1.1], [3.2, .2, 1]]);
  cubos(L, c, CUBOS);
  return L.svg();
}
// Fondo de letras del Tesoro: edificio clásico y letras apiladas.
export function tesoro(c, op = {}) {
  const L = nuevo({ s: 40 });
  base(L, c);
  L.capa(0);
  L.caja(-3, -2.6, 0, 5.4, 3.6, .45, MAT.piedra);
  L.caja(-2.8, -2.4, .45, 5, 3.2, .3, MAT.piedra);
  for (let i = 0; i < 5; i++) L.caja(-2.55 + i * 1.08, .3, .75, .42, .42, 3.1, MAT.blanco);
  L.caja(-2.4, -2.2, .75, 4.4, 2.3, 3.1, MAT.arena);
  L.caja(-2.9, -2.5, 3.85, 5.2, 3.3, .4, MAT.piedra);
  L.poli([[-2.9, .8, 4.25], [2.3, .8, 4.25], [-.3, .8, 5.6]], `fill="${MAT.blanco.izq}" stroke="rgba(255,255,255,.3)" stroke-width="1"`);
  L.poli([[-.3, -2.5, 5.6], [-.3, .8, 5.6], [2.3, .8, 4.25], [2.3, -2.5, 4.25]], `fill="${MAT.blanco.der}" stroke="rgba(255,255,255,.2)" stroke-width="1"`);
  L.poli([[-.3, -2.5, 5.6], [-.3, .8, 5.6], [2.3, .8, 4.25], [2.3, -2.5, 4.25]], 'fill="url(#sombraT)"');
  for (let i = 0; i < 4; i++) { L.capa(4 + i * .01); L.hoja(-3.6 + i * .08, 1.7 - i * .06, .02 + i * .1, 2.2, 1.6, c, { lineas: 3 }); }
  cubos(L, c, [[-3.6, -3.6, 4], [2.8, -3.6, 5.2], [3.2, .4, 2.2, .7]]);
  return L.svg();
}
// Crédito privado: préstamo a empresas con contrato y garantía.
export function credito(c, op = {}) {
  const L = nuevo({ s: 40 });
  base(L, c);
  L.capa(0); bloque(L, -1.2, -2.8, 3.4, 3, num(op.pisos, 5), MAT.grafito, 13);
  L.capa(-3); L.caja(-3, -2.4, 0, 1.6, 2.4, 2.2, MAT.piedra);
  L.ventanas('izq', -3, -2.4, 0, 1.6, 2.4, 2.2, { filas: 2, cols: 1, luz: () => true });
  for (let i = 0; i < 3; i++) { L.capa(4 + i * .01); L.hoja(-2.9 + i * .1, 1.2 - i * .08, .02 + i * .1, 2.4, 1.8, c, { lineas: 3 }); }
  // escudo de garantía
  const [sx, sy] = L.p(2.8, -.4, 3.4); const r = 34;
  L.capa(3); L.crudo(`<g filter="url(#brillo)"><path d="M${sx},${sy - r} L${sx + r * .85},${sy - r * .62} L${sx + r * .85},${sy + r * .05} C${sx + r * .85},${sy + r * .62} ${sx + r * .42},${sy + r * .92} ${sx},${sy + r * 1.08} C${sx - r * .42},${sy + r * .92} ${sx - r * .85},${sy + r * .62} ${sx - r * .85},${sy + r * .05} L${sx - r * .85},${sy - r * .62} Z" fill="${tono(c, .18)}" stroke="${c}" stroke-width="4"/><path d="M${sx - r * .38},${sy + r * .02} L${sx - r * .08},${sy + r * .34} L${sx + r * .42},${sy - r * .28}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  cubos(L, c, [[-3.7, -3.7, 4], [3.2, 3, 1.6, .7]]);
  return L.svg();
}
// Fondo con cartera de préstamos diversificada (varias empresas y bonos).
export function cartera_credito(c, op = {}) {
  const L = nuevo({ s: 38 });
  base(L, c);
  const P = [[-3.2, -3.2, 3.2, MAT.grafito], [.4, -3.4, 4.6, MAT.piedra], [-3.4, .2, 2, MAT.arena], [.6, .4, 2.8, MAT.blanco]];
  for (const [x, y, h, m] of P) { L.capa(x + y); L.caja(x, y, 0, 2.4, 2.4, h, m); L.ventanas('izq', x, y, 0, 2.4, 2.4, h, { filas: Math.round(h / 1.1), cols: 2, luz: luces(x * 7 + y * 3 + 40) }); L.ventanas('der', x, y, 0, 2.4, 2.4, h, { filas: Math.round(h / 1.1), cols: 2, luz: luces(x + y + 90, .2) }); }
  for (let i = 0; i < 3; i++) { L.capa(6 + i * .01); L.hoja(1.4 + i * .08, 3.1 - i * .06, .02 + i * .1, 2.2, 1.5, c, { lineas: 3 }); }
  cubos(L, c, [[-1, -1, 5.6, 1.1], [3.3, -3.8, 5.4, .7], [-3.9, 3.2, 2, .7]]);
  return L.svg();
}
// Oro físico custodiado en cámara acorazada.
export function oro(c, op = {}) {
  const L = nuevo({ s: 42 });
  base(L, c);
  L.capa(-10);
  L.caja(-3.4, -3.4, 0, 6.6, 1.6, 4.4, MAT.grafito);
  const [px, py] = L.p(-.1, -1.8, 2.3);
  L.crudo(`<g transform="translate(${px},${py}) skewY(30) scale(.87,1)"><circle r="78" fill="#2A2926" stroke="#8E8678" stroke-width="5"/><circle r="62" fill="none" stroke="#6A655C" stroke-width="3" stroke-dasharray="8 8"/>${Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return `<line x1="0" y1="0" x2="${44 * Math.cos(a)}" y2="${44 * Math.sin(a)}" stroke="#B9B1A2" stroke-width="7" stroke-linecap="round"/>`; }).join('')}<circle r="15" fill="#3A3833" stroke="#B9B1A2" stroke-width="4"/></g>`);
  const barra = (x, y, z) => {
    const a = .18, w = 1.7, d = .85, h = .5;
    L.poli([[x, y + d, z], [x + w, y + d, z], [x + w - a, y + d - a, z + h], [x + a, y + d - a, z + h]], 'fill="#C9962F" stroke="#FFE3A0" stroke-width="1.2"');
    L.poli([[x + w, y, z], [x + w, y + d, z], [x + w - a, y + d - a, z + h], [x + w - a, y + a, z + h]], 'fill="#9A6E22" stroke="#FFE3A0" stroke-width="1.2"');
    L.poli([[x + a, y + a, z + h], [x + w - a, y + a, z + h], [x + w - a, y + d - a, z + h], [x + a, y + d - a, z + h]], 'fill="#F6CB5A" stroke="#FFF0C2" stroke-width="1.2"');
    L.poli([[x + a, y + a, z + h], [x + w * .5, y + a, z + h], [x + w * .35, y + d - a, z + h], [x + a, y + d - a, z + h]], 'fill="#fff" opacity=".22"');
  };
  const B = [[-2, .6, 0], [-.2, .6, 0], [-2, 1.55, 0], [-.2, 1.55, 0], [-1.1, 1.05, .5], [-1.1, 2.0, 0], [.7, 2.5, 0]];
  for (const [x, y, z] of B) { L.capa(x + y + z); barra(x, y, z); }
  cubos(L, c, [[2.4, .4, 1.8, .8], [2.8, 2.6, 1, .7], [-3.6, 2.4, 2.2, .75]]);
  return L.svg();
}
// Acciones de una empresa en forma de token. op: estilo=oficina|tienda|fabrica.
export function empresa(c, op = {}) {
  const L = nuevo({ s: 40 });
  base(L, c);
  L.capa(0);
  const forma = op.forma || 'oficina';
  if (forma === 'torre') {
    L.caja(-1.8, -2.4, 0, 3.2, 2.8, 6.2, MAT.grafito);
    L.ventanas('izq', -1.8, -2.4, 0, 3.2, 2.8, 6.2, { filas: 7, cols: 4, luz: luces(41, .45), margen: .16, alto: .78 });
    L.ventanas('der', -1.8, -2.4, 0, 3.2, 2.8, 6.2, { filas: 7, cols: 3, luz: luces(42, .25), margen: .16, alto: .78 });
    L.capa(-3); L.caja(-3.4, -2, 0, 1.4, 2.4, 2, MAT.piedra); L.ventanas('izq', -3.4, -2, 0, 1.4, 2.4, 2, { filas: 2, cols: 1, luz: () => true });
  } else if (forma === 'nave') {
    L.caja(-3, -2.4, 0, 5.4, 3.4, 2.2, MAT.piedra);
    L.ventanas('izq', -3, -2.4, 0, 5.4, 3.4, 2.2, { filas: 1, cols: 4, luz: luces(43, .6), alto: .8 });
    L.ventanas('der', -3, -2.4, 0, 5.4, 3.4, 2.2, { filas: 1, cols: 3, luz: luces(44, .3), alto: .8 });
    L.caja(-1.6, -1.6, 2.2, 2.4, 2, 1.4, MAT.grafito);
    L.ventanas('izq', -1.6, -1.6, 2.2, 2.4, 2, 1.4, { filas: 1, cols: 3, luz: () => true, margen: .16, alto: .8 });
  } else {
    L.caja(-2.6, -2.2, 0, 4.4, 3.4, 3.4, MAT.grafito);
    L.ventanas('izq', -2.6, -2.2, 0, 4.4, 3.4, 3.4, { filas: 3, cols: 5, luz: luces(31, .5), margen: .18, alto: .8 });
    L.ventanas('der', -2.6, -2.2, 0, 4.4, 3.4, 3.4, { filas: 3, cols: 4, luz: luces(32, .3), margen: .18, alto: .8 });
    L.caja(-1.6, -1.4, 3.4, 2.6, 2, 1.3, MAT.blanco);
    L.ventanas('izq', -1.6, -1.4, 3.4, 2.6, 2, 1.3, { filas: 1, cols: 3, luz: () => true, alto: .7 });
  }
  // gráfico de tarta (reparto del capital) tumbado sobre la plataforma
  L.capa(4);
  const [qx, qy] = L.p(2.7, 2.6, 0);
  const sect = [[0, .62, '#3E3B36'], [.62, .86, '#55524C'], [.86, 1, c]];
  L.crudo(`<g transform="translate(${qx},${qy}) scale(1,.58)"><circle r="62" fill="#0F0E0D" transform="translate(0,14)"/>${sect.map(([a, b, col]) => { const A = a * 2 * Math.PI - Math.PI / 2, Bb = b * 2 * Math.PI - Math.PI / 2; return `<path d="M0,0 L${62 * Math.cos(A)},${62 * Math.sin(A)} A62,62 0 ${b - a > .5 ? 1 : 0},1 ${62 * Math.cos(Bb)},${62 * Math.sin(Bb)} Z" fill="${col}" stroke="#0B0A0A" stroke-width="3"/>`; }).join('')}</g>`);
  arboles(L, [[-3.3, 2.4, .8], [-1.4, 2.8, .7]]);
  cubos(L, c, [[-3.6, -3.6, 4.2], [2.6, -3.6, 5], [-3.9, 3, 2, .7]]);
  return L.svg();
}
// Reventa entre inversores (mercado P2P): el activo y dos carteras que se
// pasan una participación. op: activo=casa|edificio|torre|adosados|obra|cartera
export function reventa(c, op = {}) {
  const a = op.activo || 'casa';
  // Los edificios altos se dibujan algo más pequeños para que quepan enteros.
  const alto = ['torre', 'hotel'].includes(a) && (num(op.pisos, 6) > 6 || op.grua);
  const L = nuevo({ s: alto ? 33 : 38, dy: alto ? 20 : -10 });
  base(L, c, { w: 8.4, d: 8.4 });
  fondo(L, op.fondo);
  if (op.piscina) piscina(L, -3.6, -.6, 1.8, 1.6);
  L.capa(0);
  if (a === 'edificio') bloque(L, -2, -2.4, 3.6, 3, num(op.pisos, 5), mat(op.mat, MAT.piedra), 17);
  else if (a === 'villa') villaForma(L, -2.4, -2.6, mat(op.mat, MAT.blanco));
  else if (a === 'condominio') condo(L, -2.6, -2.6, 4.6, 2.6, num(op.pisos, 3), mat(op.mat, MAT.blanco), 23);
  else if (a === 'conjunto') for (const [x, y, w] of [[-3.4, -3.6, 2.6], [0, -3.8, 2.8], [-3.6, -.6, 2]]) { L.capa(x + y); condo(L, x, y, w, 2, num(op.pisos, 4), mat(op.mat, MAT.gris), 31 + x); }
  else if (a === 'hotel') hotelForma(L, -2.2, -2.6, 4, 2.8, num(op.pisos, 6), mat(op.mat, MAT.arena), op);
  else if (a === 'torre') {
    const h = bloque(L, -1.4, -2.4, 2.8, 2.6, num(op.pisos, 6), mat(op.mat, MAT.blanco), 19, { atico: !op.grua });
    if (op.grua) grua(L, 1.8, -2.8, h + .9, c);
  } else if (a === 'adosados') for (let i = 0; i < 3; i++) { L.capa(-3 + i * 2); casita(L, -3.2 + i * 2, -2.6, 1.8, 2.6, i === 1 ? MAT.blanco : mat(op.mat, MAT.arena), mat(op.tejado, MAT.teja), { plantas: num(op.plantas, 2), luz: 0 }); }
  else if (a === 'obra') {
    L.caja(-2.2, -2.6, 0, 4, 3, 2.2, MAT.piedra);
    L.ventanas('izq', -2.2, -2.6, 0, 4, 3, 2.2, { filas: 2, cols: 3, alto: .6 });
    L.caja(-2.2, -2.6, 2.2, 4, 3, .14, MAT.grafito);
    for (const x of [-2.2, -.2, 1.8]) for (const y of [-2.6, .4]) L.linea([x, y, 2.34], [x, y, 3.8], 'stroke="#8E8678" stroke-width="4"');
    L.capa(3); L.linea([2.6, -2.2, 0], [2.6, -2.2, 7.2], `stroke="${c}" stroke-width="7"`);
    L.linea([-1.4, -2.2, 7.2], [3.6, -2.2, 7.2], `stroke="${c}" stroke-width="6"`);
    L.linea([0, -2.2, 7.2], [0, -2.2, 5.4], 'stroke="#B9B1A2" stroke-width="2"');
    L.caja(-.3, -2.5, 4.9, .6, .6, .5, MAT.arena);
  } else if (a === 'cartera') {
    const P = [[-3, -3, 3, MAT.blanco], [.2, -3.2, 2, MAT.arena], [-3.2, -.4, 1.6, MAT.piedra]];
    for (const [x, y, h, m] of P) { L.capa(x + y); L.caja(x, y, 0, 2.2, 2.2, h, m); L.ventanas('izq', x, y, 0, 2.2, 2.2, h, { filas: Math.round(h / 1), cols: 2, luz: luces(x * 5 + y + 60) }); }
    L.capa(0); casita(L, .2, -.4, 2.2, 2, MAT.blanco, MAT.teja);
  } else {
    casita(L, -2.4, -2.6, 4.2, 3, mat(op.mat, MAT.blanco), mat(op.tejado, MAT.pizarra), { plantas: num(op.plantas, 1) });
    if (op.porche) porche(L, -2.4, .4, 4.2);
  }
  vegetacion(L, op, [[3, -2.6, op.palmeras ? 1.1 : .9], [-3.6, op.piscina ? 1.4 : .6, op.palmeras ? 1.1 : .9]]);
  // dos inversores (sus teléfonos) que se pasan una participación
  L.capa(10); telefono(L, -3.9, 2.9, c); telefono(L, 2.5, 3.2, c);
  L.capa(11); L.arco([-2.7, 3.2, 2.5], [2.6, 3.4, 2.5], c, 1.6);
  L.capa(12); L.cubo(-.6, 2.9, 4.1, .95, c, { haz: false });
  cubos(L, c, [[2.8, -3.9, 4.6, .7], [-3.9, -3.6, 3.6, .7]]);
  return L.svg();
}
// Comprar, reformar y vender una vivienda.
export function reforma(c, op = {}) {
  const L = nuevo({ s: 42 });
  base(L, c, { w: 7.6, d: 7.6 });
  L.capa(0); casita(L, -2.6, -1.8, 4.4, 3.2, MAT.blanco, MAT.teja, { plantas: 2 });
  L.capa(2);
  for (let i = 0; i <= 2; i++) L.linea([2.2, -1.6 + i * 1.4, 0], [2.2, -1.6 + i * 1.4, 3.6], `stroke="${c}" stroke-width="4"`);
  for (let z = 1; z <= 3; z++) { L.linea([2.2, -1.6, z * 1.15], [2.2, 1.2, z * 1.15], `stroke="${c}" stroke-width="3"`); L.caja(1.9, -1.6, z * 1.15, .6, 2.8, .08, MAT.madera, { sombra: false }); }
  L.capa(5); L.caja(-3.2, 2, 0, 1.4, 1, .6, MAT.arena); L.caja(-3, 2.2, .6, .9, .7, .4, MAT.arena);
  cubos(L, c, [[-3.4, -3.4, 3.6], [2.4, -3.4, 4.4]]);
  return L.svg();
}
// Villa con piscina (costa). op: mat, fondo, palmeras.
export function villa(c, op = {}) {
  const L = nuevo({ s: 42 });
  fondo(L, op.fondo);
  base(L, c, { w: 7.6, d: 7.6 });
  piscina(L, -1.4, 1.9, 3, 1.4);
  L.capa(0); villaForma(L, -2.4, -2.2, mat(op.mat, MAT.blanco));
  vegetacion(L, { palmeras: op.palmeras !== 0, ...op }, [[-3.2, 2.4, 1], [2.9, 2.6, 1], [2.9, -1.8, 1.1]]);
  cubos(L, c, [[-3.4, -3.4, 3.4], [2.4, -3.5, 4.2], [3.1, 3.1, 1.6, .7]]);
  return L.svg();
}
// Edificio de apartamentos bajo con balcones. op: pisos, mat, fondo, palmeras, piscina.
export function condominio(c, op = {}) {
  const L = nuevo({ s: 40 });
  fondo(L, op.fondo);
  base(L, c);
  if (op.piscina) piscina(L, -1.2, 2, 2.8, 1.4);
  L.capa(0); condo(L, -2.8, -2, 5.4, 3, num(op.pisos, 4), mat(op.mat, MAT.blanco), num(op.semilla, 29));
  vegetacion(L, op, [[-3.4, 2.4], [2.9, 2.6], [3.2, -.2, 1]]);
  cubos(L, c, CUBOS);
  return L.svg();
}
// Bodega con viñedo en terrazas y casa de piedra (proyecto de vino y hotel rural).
export function bodega(c, op = {}) {
  const L = nuevo({ s: 40 });
  fondo(L, op.fondo || 'colinas');
  base(L, c);
  // terrazas de viñedo escalonadas delante
  for (let t = 0; t < 3; t++) {
    const y = .6 + t * 1.1, z = .02 + (2 - t) * .22;
    L.capa(-40 + t); L.caja(-3.9, y, 0, 7.8, 1.1, z, MAT.cesped, { sombra: false });
    for (let k = 0; k < 9; k++) {
      const [vx, vy] = L.p(-3.6 + k * .85, y + .55, z);
      L.crudo(`<line x1="${vx}" y1="${vy}" x2="${vx}" y2="${vy - 14}" stroke="#5A4632" stroke-width="2.5"/><circle cx="${vx}" cy="${vy - 18}" r="8" fill="#3E6E3A"/><circle cx="${vx + 5}" cy="${vy - 12}" r="4" fill="#6B2E4A"/>`);
    }
  }
  // casa solariega de piedra con tejado de pizarra y un torreón
  L.capa(0);
  L.caja(-2.6, -3.2, 0, 4.4, 2.8, 2.6, MAT.piedra);
  L.ventanas('izq', -2.6, -3.2, 0, 4.4, 2.8, 2.6, { filas: 2, cols: 3, luz: (f, k) => f === 0 && k === 1, alto: .55 });
  L.ventanas('der', -2.6, -3.2, 0, 4.4, 2.8, 2.6, { filas: 2, cols: 2, alto: .55 });
  L.tejado(-2.8, -3.4, 2.6, 4.8, 3.2, 1.4, MAT.pizarra);
  L.capa(1); L.caja(1.8, -3.2, 0, 1.4, 1.4, 4, MAT.piedra);
  L.ventanas('izq', 1.8, -3.2, 0, 1.4, 1.4, 4, { filas: 3, cols: 1, luz: (f) => f === 1, alto: .5 });
  L.tejadoY(1.7, -3.3, 4, 1.6, 1.6, .9, MAT.pizarra);
  // barricas junto a la casa
  for (let i = 0; i < 3; i++) {
    const [bx, by] = L.p(-3.4 + i * .7, -.2, 0);
    L.capa(-1 + i * .01);
    L.crudo(`<rect x="${bx - 14}" y="${by - 26}" width="28" height="26" rx="6" fill="#7A5232"/><ellipse cx="${bx}" cy="${by - 26}" rx="14" ry="6" fill="#9A6A42"/><line x1="${bx - 14}" y1="${by - 18}" x2="${bx + 14}" y2="${by - 18}" stroke="#3A2A1A" stroke-width="2"/><line x1="${bx - 14}" y1="${by - 8}" x2="${bx + 14}" y2="${by - 8}" stroke="#3A2A1A" stroke-width="2"/>`);
  }
  cubos(L, c, [[-3.6, -3.7, 4.2], [3.3, -.6, 3.4, .75]]);
  return L.svg();
}
// Catálogo de próximas emisiones: varios inmuebles y una lupa.
export function catalogo(c, op = {}) {
  const L = nuevo({ s: 38 });
  base(L, c);
  const P = [[-3.2, -3.2, 4, MAT.blanco], [.4, -3.4, 2.4, MAT.arena], [-3.4, .4, 1.8, MAT.piedra]];
  for (const [x, y, h, m] of P) { L.capa(x + y); L.caja(x, y, 0, 2.4, 2.4, h, m); L.ventanas('izq', x, y, 0, 2.4, 2.4, h, { filas: Math.round(h / 1), cols: 2, luz: luces(x * 9 + y + 70) }); L.ventanas('der', x, y, 0, 2.4, 2.4, h, { filas: Math.round(h / 1), cols: 2, luz: luces(x + 80, .2) }); }
  L.capa(1); casita(L, .6, .6, 2.4, 2.2, MAT.blanco, MAT.teja);
  L.capa(20);
  const [lx, ly] = L.p(2.4, 3.2, 3.6);
  L.crudo(`<g filter="url(#brillo)"><circle cx="${lx}" cy="${ly}" r="58" fill="${tono(c, .14)}" stroke="${c}" stroke-width="9"/><line x1="${lx + 42}" y1="${ly + 42}" x2="${lx + 96}" y2="${ly + 96}" stroke="${c}" stroke-width="16" stroke-linecap="round"/></g>`);
  cubos(L, c, [[2.8, -3.8, 4.6, .8], [-3.9, 3, 2, .7]]);
  return L.svg();
}
