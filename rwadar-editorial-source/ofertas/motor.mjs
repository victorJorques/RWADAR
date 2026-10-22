// Motor isométrico en SVG para las ilustraciones de las ofertas.
// Maqueta clara sobre fondo grafito, plataforma con borde luminoso del color de
// la categoría y cubos de cristal que representan las participaciones.
// Sin fotos, marcas, personas ni cifras.

const COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6);
export const tono = (c, a) => `${c}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
const f1 = v => v.toFixed(1);

// Materiales: techo, cara izquierda (iluminada) y cara derecha (en sombra).
export const MAT = {
  piedra: { top: '#EAE3D6', izq: '#C4BBAB', der: '#8E8678' },
  arena: { top: '#E3D2B4', izq: '#C9B490', der: '#94815F' },
  blanco: { top: '#F1EEE8', izq: '#D2CEC6', der: '#9C9890' },
  grafito: { top: '#55524C', izq: '#3E3B36', der: '#2B2926' },
  teja: { top: '#B4664A', izq: '#9A543B', der: '#6E3A28' },
  pizarra: { top: '#5B5F66', izq: '#4A4E55', der: '#34373C' },
  madera: { top: '#A77B52', izq: '#8C6440', der: '#62452B' },
  cesped: { top: '#3F6B45', izq: '#2F5034', der: '#223A26' },
  ladrillo: { top: '#B87A5E', izq: '#A0624A', der: '#704232' },
  mostaza: { top: '#E2BC63', izq: '#C99C3E', der: '#8E6C2A' },
  gris: { top: '#C9D0D6', izq: '#A7B1BA', der: '#737D86' },
  cristal: { top: '#9DB4C8', izq: '#5F7F9C', der: '#3E566D' },
  base: { top: '#1A1917', izq: '#121110', der: '#0D0C0B' },
};

export function defs(c) {
  return `<defs>
  <filter id="brillo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="suave" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>
  <linearGradient id="sombraV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".6" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".30"/></linearGradient>
  <linearGradient id="sombraT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient>
  <linearGradient id="cristal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA3B8" stop-opacity=".9"/><stop offset="1" stop-color="#2A3440"/></linearGradient>
  <radialGradient id="luzVentana" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#FFE2A6"/><stop offset="1" stop-color="#F3A945"/></radialGradient>
  <radialGradient id="copa" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#7DB46E"/><stop offset="1" stop-color="#2F5A30"/></radialGradient>
  <radialGradient id="halo" cx="0.70" cy="0.58" r="0.55"><stop offset="0" stop-color="${c}" stop-opacity=".26"/><stop offset=".5" stop-color="${c}" stop-opacity=".07"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
  <radialGradient id="charco" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
</defs>`;
}

// Lienzo con capas: cada parte lleva una profundidad (x + y del objeto) y se
// pinta de atrás adelante. Dentro de una misma profundidad, en orden de llegada.
export function lienzo({ ox = 880, oy = 600, s = 40 } = {}) {
  const p = (x, y, z) => [ox + (x - y) * COS * s, oy + (x + y) * SIN * s - z * s];
  const pts = arr => arr.map(([x, y, z]) => p(x, y, z).map(f1).join(',')).join(' ');
  const partes = [];
  let prof = 0;
  const capa = d => { prof = d; };
  const crudo = t => partes.push({ d: prof, i: partes.length, t });
  const poli = (arr, estilo) => crudo(`<polygon points="${pts(arr)}" ${estilo}/>`);
  const linea = (a, b, estilo) => { const [x1, y1] = p(...a), [x2, y2] = p(...b); crudo(`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" ${estilo}/>`); };

  // Caja: esquina (x,y,z), w a lo largo de x, d a lo largo de y, h de alto.
  function caja(x, y, z, w, d, h, m = MAT.piedra, { borde = 'rgba(255,255,255,.18)', sombra = true } = {}) {
    const est = col => `fill="${col}" stroke="${borde}" stroke-width="1" stroke-linejoin="round"`;
    const izq = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
    const der = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
    const top = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
    poli(izq, est(m.izq)); if (sombra) poli(izq, 'fill="url(#sombraV)"');
    poli(der, est(m.der)); if (sombra) poli(der, 'fill="url(#sombraV)"');
    poli(top, est(m.top)); if (sombra) poli(top, 'fill="url(#sombraT)"');
  }
  // Ventanas en una cara: 'izq' (plano y = y+d) o 'der' (plano x = x+w).
  // luz: función (fila, col) => true si la ventana está encendida.
  function ventanas(lado, x, y, z, w, d, h, { filas, cols, luz = () => false, margen = .3, alto = .62, marco = 'rgba(0,0,0,.35)' }) {
    const largo = lado === 'izq' ? w : d;
    const pw = (largo - margen * (cols + 1)) / cols, paso = (h - margen) / filas, ph = paso * alto;
    for (let f = 0; f < filas; f++) for (let k = 0; k < cols; k++) {
      const a = margen + k * (pw + margen), vz = z + margen + f * paso;
      const q = lado === 'izq'
        ? [[x + a, y + d, vz], [x + a + pw, y + d, vz], [x + a + pw, y + d, vz + ph], [x + a, y + d, vz + ph]]
        : [[x + w, y + a, vz], [x + w, y + a + pw, vz], [x + w, y + a + pw, vz + ph], [x + w, y + a, vz + ph]];
      const on = luz(f, k);
      poli(q, on ? `fill="url(#luzVentana)" stroke="${marco}" stroke-width="1"` : `fill="url(#cristal)" opacity="${lado === 'izq' ? .95 : .75}" stroke="${marco}" stroke-width="1"`);
    }
  }
  // Líneas de forjado entre plantas, para el aire de maqueta de arquitecto.
  function forjados(x, y, z, w, d, h, n, color = 'rgba(255,255,255,.35)') {
    for (let i = 1; i < n; i++) {
      const zz = z + i * h / n;
      linea([x, y + d, zz], [x + w, y + d, zz], `stroke="${color}" stroke-width="1.6"`);
      linea([x + w, y + d, zz], [x + w, y, zz], `stroke="${color}" stroke-width="1.2" opacity=".6"`);
    }
  }
  // Tejado a dos aguas (cumbrera a lo largo de x).
  function tejado(x, y, z, w, d, h, m = MAT.teja) {
    const b = 'stroke="rgba(255,255,255,.18)" stroke-width="1" stroke-linejoin="round"';
    poli([[x, y + d, z], [x + w, y + d, z], [x + w, y + d / 2, z + h], [x, y + d / 2, z + h]], `fill="${m.izq}" ${b}`);
    poli([[x, y + d, z], [x + w, y + d, z], [x + w, y + d / 2, z + h], [x, y + d / 2, z + h]], 'fill="url(#sombraT)"');
    poli([[x + w, y, z], [x + w, y + d, z], [x + w, y + d / 2, z + h]], `fill="${m.der}" ${b}`);
  }
  // Tejado a dos aguas con cumbrera a lo largo de y (hastial hacia la izquierda).
  function tejadoY(x, y, z, w, d, h, m = MAT.teja) {
    const b = 'stroke="rgba(255,255,255,.18)" stroke-width="1" stroke-linejoin="round"';
    poli([[x, y + d, z], [x + w, y + d, z], [x + w / 2, y + d, z + h]], `fill="${m.izq}" ${b}`);
    poli([[x + w, y, z], [x + w, y + d, z], [x + w / 2, y + d, z + h], [x + w / 2, y, z + h]], `fill="${m.der}" ${b}`);
    poli([[x + w, y, z], [x + w, y + d, z], [x + w / 2, y + d, z + h], [x + w / 2, y, z + h]], 'fill="url(#sombraT)"');
  }
  // Plataforma: losa oscura con rejilla y borde luminoso.
  function plataforma(x, y, w, d, c, { h = .4, rejilla = 1, losetas = [] } = {}) {
    const z = -h;
    caja(x, y, z, w, d, h, MAT.base, { borde: 'rgba(255,255,255,.06)', sombra: false });
    for (let i = rejilla; i < w; i += rejilla) linea([x + i, y, 0], [x + i, y + d, 0], `stroke="${c}" stroke-opacity=".16" stroke-width="1.2"`);
    for (let j = rejilla; j < d; j += rejilla) linea([x, y + j, 0], [x + w, y + j, 0], `stroke="${c}" stroke-opacity=".16" stroke-width="1.2"`);
    for (const [i, j] of losetas) poli([[i, j, 0], [i + rejilla, j, 0], [i + rejilla, j + rejilla, 0], [i, j + rejilla, 0]], `fill="${c}" fill-opacity=".28" stroke="${c}" stroke-width="1.5"`);
    const borde = `stroke="${c}" stroke-width="2.5" stroke-linecap="round" filter="url(#brillo)"`;
    linea([x, y + d, 0], [x + w, y + d, 0], borde);
    linea([x + w, y + d, 0], [x + w, y, 0], borde);
    linea([x, y, 0], [x, y + d, 0], `stroke="${c}" stroke-opacity=".5" stroke-width="1.5"`);
    linea([x, y, 0], [x + w, y, 0], `stroke="${c}" stroke-opacity=".5" stroke-width="1.5"`);
  }
  // Cubo de cristal (una participación): caras translúcidas, aristas
  // luminosas y núcleo sólido.
  function cubo(x, y, z, t, c, { nucleo = true, haz = true } = {}) {
    if (haz && z > 0) {
      linea([x + t / 2, y + t / 2, 0], [x + t / 2, y + t / 2, z], `stroke="${c}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="3 5"`);
      poli([[x, y, 0], [x + t, y, 0], [x + t, y + t, 0], [x, y + t, 0]], `fill="${c}" fill-opacity=".25" stroke="${c}" stroke-opacity=".7" stroke-width="1.2"`);
    }
    const a = `stroke="${c}" stroke-opacity=".35" stroke-width="1"`;
    linea([x, y, z], [x, y, z + t], a); linea([x, y, z], [x + t, y, z], a); linea([x, y, z], [x, y + t, z], a);
    if (nucleo) {
      const n = t * .36, o = (t - n) / 2;
      const est = `fill="${c}" stroke="none"`;
      poli([[x + o, y + o + n, z + o], [x + o + n, y + o + n, z + o], [x + o + n, y + o + n, z + o + n], [x + o, y + o + n, z + o + n]], est + ' opacity=".85"');
      poli([[x + o + n, y + o, z + o], [x + o + n, y + o + n, z + o], [x + o + n, y + o + n, z + o + n], [x + o + n, y + o, z + o + n]], est + ' opacity=".6"');
      poli([[x + o, y + o, z + o + n], [x + o + n, y + o, z + o + n], [x + o + n, y + o + n, z + o + n], [x + o, y + o + n, z + o + n]], `fill="#fff" opacity=".9" filter="url(#brillo)"`);
    }
    const cara = (q, op) => poli(q, `fill="${c}" fill-opacity="${op}" stroke="${c}" stroke-width="2" stroke-linejoin="round"`);
    cara([[x, y + t, z], [x + t, y + t, z], [x + t, y + t, z + t], [x, y + t, z + t]], .10);
    cara([[x + t, y, z], [x + t, y + t, z], [x + t, y + t, z + t], [x + t, y, z + t]], .06);
    cara([[x, y, z + t], [x + t, y, z + t], [x + t, y + t, z + t], [x, y + t, z + t]], .16);
  }
  function arbol(x, y, z = 0, t = 1) {
    const [bx, by] = p(x, y, z), [tx, ty] = p(x, y, z + t * 1.1);
    crudo(`<ellipse cx="${f1(bx)}" cy="${f1(by)}" rx="${f1(t * s * .45)}" ry="${f1(t * s * .2)}" fill="#000" opacity=".35"/>` +
      `<line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="#5A4632" stroke-width="${f1(t * 5)}" stroke-linecap="round"/>` +
      `<circle cx="${f1(tx)}" cy="${f1(ty - t * s * .35)}" r="${f1(t * s * .5)}" fill="url(#copa)"/>`);
  }
  function suelo(x, y, w, d, estilo = 'fill="rgba(255,255,255,.03)"') {
    poli([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]], estilo);
  }
  // Monedas apiladas en (x, y, z).
  function monedas(x, y, z, n = 3, r = .42) {
    const [cx, cy] = p(x, y, z), R = r * s;
    let t = '';
    for (let i = 0; i < n; i++) {
      const yy = cy - i * R * .34;
      t += `<ellipse cx="${f1(cx)}" cy="${f1(yy + R * .16)}" rx="${f1(R)}" ry="${f1(R * .5)}" fill="#8A6420"/>` +
        `<ellipse cx="${f1(cx)}" cy="${f1(yy)}" rx="${f1(R)}" ry="${f1(R * .5)}" fill="#F2C14E" stroke="#FFE7A3" stroke-width="1.2"/>` +
        `<ellipse cx="${f1(cx)}" cy="${f1(yy)}" rx="${f1(R * .6)}" ry="${f1(R * .3)}" fill="none" stroke="#C08F2E" stroke-width="1.6"/>`;
    }
    crudo(t);
  }
  // Hoja (documento) tumbada: lámina blanca con líneas y sello del color.
  function hoja(x, y, z, w, d, c, { lineas = 4 } = {}) {
    caja(x, y, z, w, d, .08, MAT.blanco, { borde: 'rgba(0,0,0,.25)' });
    const zz = z + .081;
    poli([[x + .25, y + .25, zz], [x + .25 + w * .45, y + .25, zz], [x + .25 + w * .45, y + .45, zz], [x + .25, y + .45, zz]], `fill="${c}"`);
    for (let i = 0; i < lineas; i++) { const yy = y + .7 + i * (d - 1.3) / Math.max(1, lineas - 1); linea([x + .25, yy, zz], [x + w - .3 - (i % 2) * .5, yy, zz], 'stroke="#9A958C" stroke-width="2.2" stroke-linecap="round"'); }
    const [sx, sy] = p(x + w - .55, y + d - .5, zz);
    crudo(`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(s * .32)}" ry="${f1(s * .18)}" fill="none" stroke="${c}" stroke-width="3"/>`);
  }
  // Arco discontinuo con punta de flecha entre dos puntos del espacio.
  function arco(a, b, c, alto = 1.5) {
    const [x1, y1] = p(...a), [x2, y2] = p(...b), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - alto * s;
    const ang = Math.atan2(y2 - my, x2 - mx), l = 16;
    crudo(`<path d="M${f1(x1)},${f1(y1)} Q${f1(mx)},${f1(my)} ${f1(x2)},${f1(y2)}" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="2 11" stroke-linecap="round"/>` +
      `<path d="M${f1(x2 - l * Math.cos(ang - .5))},${f1(y2 - l * Math.sin(ang - .5))} L${f1(x2)},${f1(y2)} L${f1(x2 - l * Math.cos(ang + .5))},${f1(y2 - l * Math.sin(ang + .5))}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  const svg = () => partes.slice().sort((a, b) => a.d - b.d || a.i - b.i).map(q => q.t).join('\n');
  return { p, s, poli, linea, crudo, capa, caja, ventanas, forjados, tejado, tejadoY, plataforma, cubo, arbol, suelo, monedas, hoja, arco, svg };
}

// Pseudoaleatorio estable para repartir luces de ventanas.
export function semilla(n) { let x = n >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
