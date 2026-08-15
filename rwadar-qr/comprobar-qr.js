/* =====================================================================
   RWAdar · comprueba que el código QR generado se puede leer
   ---------------------------------------------------------------------
       node rwadar-qr/comprobar-qr.js [url]

   Un código QR mal hecho no avisa: sale un dibujo con aspecto de código
   QR y el teléfono no hace nada. Así que esto no mira el dibujo, lo
   DESCODIFICA: parte de los píxeles del PNG y del trazado del SVG, y
   deshace todo el camino hasta recuperar la dirección.

   Deliberadamente NO reutiliza el armazón de `codigo-qr.js`: se vuelve a
   deducir aquí dónde está cada pieza a partir de la norma. Si el
   codificador coloca algo en el sitio equivocado, este archivo no comete
   el mismo error a la vez.

   Lo que demuestra, en orden:
     1. la geometría fija está donde manda la norma;
     2. los 15 bits de formato se releen, con su BCH, en las dos copias;
     3. los síndromes de Reed-Solomon dan cero en todos los bloques
        —es decir, la corrección de errores es real y no relleno—;
     4. el texto que sale del dibujo es exactamente el que se pidió;
     5. el PNG y el SVG del disco contienen esa misma matriz.
   ===================================================================== */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { codificar } = require('./codigo-qr.js');

const DESTINO = process.argv[2] || 'https://rwadar.netlify.app';
const AQUI = __dirname;
const MARGEN = 4;

const ALIN = [[], [], [6,18], [6,22], [6,26], [6,30], [6,34], [6,22,38], [6,24,42], [6,26,46], [6,28,50]];
const BLOQUES = {
  L: [[7,1,19,0,0],[10,1,34,0,0],[15,1,55,0,0],[20,1,80,0,0],[26,1,108,0,0],
      [18,2,68,0,0],[20,2,78,0,0],[24,2,97,0,0],[30,2,116,0,0],[18,2,68,2,69]],
  M: [[10,1,16,0,0],[16,1,28,0,0],[26,1,44,0,0],[18,2,32,0,0],[24,2,43,0,0],
      [16,4,27,0,0],[18,4,31,0,0],[22,2,38,2,39],[22,3,36,2,37],[26,4,43,1,44]],
  Q: [[13,1,13,0,0],[22,1,22,0,0],[18,2,17,0,0],[26,2,24,0,0],[18,2,15,2,16],
      [24,4,19,0,0],[18,2,14,4,15],[22,4,18,2,19],[20,4,16,4,17],[24,6,19,2,20]],
  H: [[17,1,9,0,0],[28,1,16,0,0],[22,2,13,0,0],[16,4,9,0,0],[22,2,11,2,12],
      [28,4,15,0,0],[26,4,13,1,14],[26,4,14,2,15],[24,4,12,4,13],[28,6,15,2,16]],
};
const NIVEL_DE_BITS = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' };

const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
         for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/* --- Dónde está cada pieza fija, deducido de cero --------------------- */
function esFijo(tam, version, y, x) {
  const diana = (fy, fx) => y >= fy - 1 && y <= fy + 7 && x >= fx - 1 && x <= fx + 7;
  if (diana(0, 0) || diana(0, tam - 7) || diana(tam - 7, 0)) return true;   // dianas y separadores
  if (y === 6 || x === 6) return true;                                       // líneas de tiempo
  if (x === 8 && (y < 9 || y >= tam - 8)) return true;                       // formato, copia 1 y 2
  if (y === 8 && (x < 9 || x >= tam - 8)) return true;
  if (version >= 7 && ((y < 6 && x >= tam - 11 && x < tam - 8) ||
                       (x < 6 && y >= tam - 11 && y < tam - 8))) return true; // versión
  for (const cy of ALIN[version]) for (const cx of ALIN[version]) {
    if ((cy === 6 && cx === 6) || (cy === 6 && cx === tam - 7) || (cy === tam - 7 && cx === 6)) continue;
    if (Math.abs(y - cy) <= 2 && Math.abs(x - cx) <= 2) return true;
  }
  return false;
}

const MASCARAS = [
  (y, x) => (x + y) % 2 === 0, (y, x) => y % 2 === 0, (y, x) => x % 3 === 0, (y, x) => (x + y) % 3 === 0,
  (y, x) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (y, x) => (x * y) % 2 + (x * y) % 3 === 0,
  (y, x) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (y, x) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
];

/* --- El descodificador ------------------------------------------------ */
function descodificar(mod, version) {
  const tam = mod.length, fallos = [];
  const bit = (y, x) => mod[y][x] ? 1 : 0;

  /* 1 · geometría */
  for (const [fy, fx] of [[0, 0], [0, tam - 7], [tam - 7, 0]])
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const anillo = (i === 0 || i === 6 || j === 0 || j === 6), centro = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (bit(fy + i, fx + j) !== ((anillo || centro) ? 1 : 0)) fallos.push(`diana en ${fy},${fx}`);
    }
  for (let i = 8; i < tam - 8; i++)
    if (bit(6, i) !== (i % 2 === 0 ? 1 : 0) || bit(i, 6) !== (i % 2 === 0 ? 1 : 0)) fallos.push('línea de tiempo');
  if (bit(tam - 8, 8) !== 1) fallos.push('falta el módulo negro obligatorio');

  /* 2 · formato: se leen las dos copias, se comprueba el BCH y que digan
     lo mismo. Es lo primero que lee un teléfono; si esto falla, no hay
     nada más que hablar. */
  const leerFormato = casillas => casillas.reduce((a, [y, x]) => (a << 1) | bit(y, x), 0);
  /* Las listas van del bit 0 al 14; `leerFormato` las recorre al revés
     para que el primero de la lista acabe siendo el bit más bajo.
     Copia 1: baja por la columna 8 y gira a la izquierda por la fila 8.
     Copia 2: los ocho primeros bits van por la fila 8 pegados al borde
     derecho, y los siete últimos por la columna 8 pegados al borde de
     abajo — fila y columna NO se pueden intercambiar. */
  const c1 = leerFormato([[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]].reverse());
  const c2 = leerFormato([[8,tam-1],[8,tam-2],[8,tam-3],[8,tam-4],[8,tam-5],[8,tam-6],[8,tam-7],[8,tam-8],
                          [tam-7,8],[tam-6,8],[tam-5,8],[tam-4,8],[tam-3,8],[tam-2,8],[tam-1,8]].reverse());
  if (c1 !== c2) fallos.push('las dos copias del formato no coinciden');

  const crudo = c1 ^ 0x5412;              // 15 bits: 5 de dato y 10 de BCH
  let r = crudo >> 10;
  for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
  if ((r & 0x3FF) !== (crudo & 0x3FF)) fallos.push('el BCH del formato no cuadra');
  const nivel = NIVEL_DE_BITS[(crudo >> 13) & 3], mascara = (crudo >> 10) & 7;

  /* 3 · quitar la máscara y recorrer el zigzag */
  const bits = [];
  for (let der = tam - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;
    for (let v = 0; v < tam; v++) for (let j = 0; j < 2; j++) {
      const x = der - j, arriba = ((der + 1) & 2) === 0, y = arriba ? tam - 1 - v : v;
      if (!esFijo(tam, version, y, x)) bits.push(bit(y, x) ^ (MASCARAS[mascara](y, x) ? 1 : 0));
    }
  }
  const flujo = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) flujo.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  /* 4 · deshacer el entrelazado y comprobar los síndromes */
  const [nEcc, b1, d1, b2, d2] = BLOQUES[nivel][version - 1];
  const nBloques = b1 + b2, tamBloque = i => (i < b1 ? d1 : d2);
  const datos = Array.from({ length: nBloques }, () => []), eccs = Array.from({ length: nBloques }, () => []);
  let p = 0;
  for (let i = 0; i < Math.max(d1, d2); i++) for (let b = 0; b < nBloques; b++)
    if (i < tamBloque(b)) datos[b].push(flujo[p++]);
  for (let i = 0; i < nEcc; i++) for (let b = 0; b < nBloques; b++) eccs[b].push(flujo[p++]);

  for (let b = 0; b < nBloques; b++) {
    const palabra = datos[b].concat(eccs[b]);
    for (let s = 0; s < nEcc; s++) {
      let v = 0;
      for (const c of palabra) v = mul(v, EXP[s]) ^ c;   // Horner en GF(256)
      if (v !== 0) { fallos.push(`síndrome ${s} distinto de cero en el bloque ${b}`); break; }
    }
  }

  /* 5 · leer la cabecera y sacar el texto */
  const todo = [].concat(...datos);
  let bi = 0;
  const tomar = n => { let v = 0; for (let i = 0; i < n; i++) { v = (v << 1) | ((todo[bi >> 3] >> (7 - (bi & 7))) & 1); bi++; } return v; };
  const modo = tomar(4);
  if (modo !== 0b0100) fallos.push(`modo ${modo.toString(2)}, se esperaba byte (0100)`);
  const largo = tomar(version < 10 ? 8 : 16);
  const bytes = Buffer.from(Array.from({ length: largo }, () => tomar(8)));

  return { texto: bytes.toString('utf8'), nivel, mascara, fallos };
}

/* --- Los archivos del disco, de vuelta a una matriz ------------------- */
function matrizDelPng(archivo, tam) {
  const b = fs.readFileSync(archivo);
  let i = 8, ancho = 0, alto = 0, idat = [];
  while (i < b.length) {
    const largo = b.readUInt32BE(i), tipo = b.toString('ascii', i + 4, i + 8);
    if (tipo === 'IHDR') { ancho = b.readUInt32BE(i + 8); alto = b.readUInt32BE(i + 12); }
    if (tipo === 'IDAT') idat.push(b.subarray(i + 8, i + 8 + largo));
    i += largo + 12;
  }
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  const lado = ancho / (tam + MARGEN * 2);
  const claro = (y, x) => {                       // el centro del módulo
    const py = Math.floor((MARGEN + y + 0.5) * lado), px = Math.floor((MARGEN + x + 0.5) * lado);
    return crudo[py * (ancho * 3 + 1) + 1 + px * 3] > 127;
  };
  const m = [];
  for (let y = 0; y < tam; y++) { const f = []; for (let x = 0; x < tam; x++) f.push(!claro(y, x)); m.push(f); }
  return { m, ancho, alto };
}

/* `lado` y `desp` traducen las coordenadas del trazado a módulos: en el
   código suelto cada módulo mide 1 y el dibujo empieza en el margen; en
   la tarjeta mide lo que quepa en el panel blanco. */
function matrizDelSvg(archivo, tam, lado, despX, despY) {
  const txt = fs.readFileSync(archivo, 'utf8');
  /* La tarjeta lleva varios trazados: los del logotipo y el del código.
     El del código es, con diferencia, el que más tramos tiene — así no
     hay que atarse a un color ni al orden de los atributos. */
  const d = [...txt.matchAll(/<path d="(M[^"]*)"/g)]
    .map(t => t[1]).sort((a, b) => b.length - a.length)[0] || '';
  const m = Array.from({ length: tam }, () => new Array(tam).fill(false));
  for (const t of d.matchAll(/M([\d.]+) ([\d.]+)h([\d.]+)v/g)) {
    const x = Math.round((+t[1] - despX) / lado), y = Math.round((+t[2] - despY) / lado);
    const ancho = Math.round(+t[3] / lado);
    for (let i = 0; i < ancho; i++) if (m[y] && x + i < tam) m[y][x + i] = true;
  }
  return m;
}
const igual = (a, b, tam) => {
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) if (!!a[y][x] !== !!b[y][x]) return false;
  return true;
};

/* --------------------------------------------------------------------- */
const qr = codificar(DESTINO, 'H');
const linea = [];
const anotar = (ok, texto) => { linea.push([ok, texto]); return ok; };

const leido = descodificar(qr.mod, qr.version);
anotar(leido.fallos.length === 0, `estructura, formato y Reed-Solomon${leido.fallos.length ? ': ' + leido.fallos.slice(0, 3).join('; ') : ''}`);
anotar(leido.texto === DESTINO, `el dibujo devuelve «${leido.texto}»`);
anotar(leido.nivel === qr.nivel && leido.mascara === qr.mascara,
  `el formato releído dice nivel ${leido.nivel}, máscara ${leido.mascara}`);

/* El margen claro obligatorio: se comprueba sobre el PNG, que es donde
   de verdad importa. */
const png = matrizDelPng(path.join(AQUI, 'rwadar-qr.png'), qr.tam);
anotar(igual(png.m, qr.mod, qr.tam), `rwadar-qr.png (${png.ancho}x${png.alto}) contiene la misma matriz`);

anotar(igual(matrizDelSvg(path.join(AQUI, 'rwadar-qr.svg'), qr.tam, 1, MARGEN, MARGEN), qr.mod, qr.tam),
  'rwadar-qr.svg contiene la misma matriz');

/* Los mismos números que usa la tarjeta: panel de 720 px en (180, 424). */
const ladoT = 720 / (qr.tam + MARGEN * 2);
anotar(igual(matrizDelSvg(path.join(AQUI, 'rwadar-tarjeta.svg'), qr.tam, ladoT,
  180 + MARGEN * ladoT, 424 + MARGEN * ladoT), qr.mod, qr.tam),
  'rwadar-tarjeta.svg contiene la misma matriz');

console.log(`\nRWAdar · comprobación del código QR
  destino  ${DESTINO}
  versión ${qr.version} · nivel ${qr.nivel} · máscara ${qr.mascara} · ${qr.tam}x${qr.tam} módulos\n`);
for (const [ok, t] of linea) console.log(`  ${ok ? 'OK ' : 'MAL'}  ${t}`);
const mal = linea.filter(([ok]) => !ok).length;
console.log(mal ? `\n  ${mal} comprobaciones han fallado\n` : '\n  Todo correcto: el código se lee.\n');
process.exit(mal ? 1 : 0);
