/* =====================================================================
   RWAdar · codificador de códigos QR, sin dependencias
   ---------------------------------------------------------------------
   Devuelve la matriz de módulos de un QR según ISO/IEC 18004. Modo byte
   (UTF-8), versiones 1 a 10 — de sobra: la versión 10 con corrección
   media guarda 271 caracteres y aquí sólo metemos una dirección web.

       const { codificar } = require('./codigo-qr.js');
       const m = codificar('https://rwadar.netlify.app', 'H');
       m.tam        // lado en módulos
       m.mod[y][x]  // true = módulo oscuro

   Está escrito a mano y no con un paquete de npm por la misma razón que
   la web no usa ninguno: un archivo que se lee entero no se rompe solo
   dentro de tres años. La comprobación de que funciona no es la fe, es
   `node comprobar-qr.js`, que decodifica la imagen generada.
   ===================================================================== */

/* --- Aritmética del cuerpo finito GF(256), polinomio 0x11D ------------
   Reed-Solomon trabaja en un mundo donde sumar es XOR y multiplicar es
   sumar logaritmos. Estas dos tablas convierten una cosa en la otra. */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/* --- Tablas de la norma ----------------------------------------------
   Por versión (1-10) y nivel de corrección: cuántos bytes de corrección
   lleva cada bloque, y cómo se reparten los datos en bloques. El formato
   es [correccion, bloquesG1, datosG1, bloquesG2, datosG2]. */
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

/* Centros de los patrones de alineación, por versión. La 1 no tiene. */
const ALINEACION = [[], [], [6,18], [6,22], [6,26], [6,30], [6,34],
  [6,22,38], [6,24,42], [6,26,46], [6,28,50]];

/* Los dos bits que identifican cada nivel dentro de la cadena de formato.
   No siguen el orden L<M<Q<H: los fija la norma. */
const BITS_NIVEL = { L: 1, M: 0, Q: 3, H: 2 };

/* --- Reed-Solomon ----------------------------------------------------- */

/* Polinomio generador de grado n: el producto de (x - a^i) para i<n. */
function generador(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); }
    g = ng;
  }
  return g;
}

/* Los n bytes de corrección de un bloque: el resto de dividir el bloque
   (desplazado n posiciones) entre el polinomio generador. */
function correccion(datos, n) {
  const g = generador(n), r = new Uint8Array(datos.length + n);
  r.set(datos);
  for (let i = 0; i < datos.length; i++) {
    const f = r[i];
    if (f === 0) continue;
    for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], f);
  }
  return Array.from(r.slice(datos.length));
}

/* --- Los datos, de texto a bytes finales ------------------------------ */

/* Cabecera + texto + relleno, troceado en bloques, cada bloque con su
   corrección, y todo entrelazado como manda la norma: primero el byte 0
   de cada bloque, luego el byte 1 de cada bloque… Así una mancha en el
   papel estropea un poco de todos los bloques en vez de destrozar uno. */
function cuerpo(texto, version, nivel) {
  const bytes = Array.from(Buffer.from(texto, 'utf8'));
  const [nEcc, b1, d1, b2, d2] = BLOQUES[nivel][version - 1];
  const totalDatos = b1 * d1 + b2 * d2;

  const bits = [];
  const meter = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  meter(0b0100, 4);                       // modo byte
  meter(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) meter(b, 8);
  meter(0, Math.min(4, totalDatos * 8 - bits.length));   // terminador
  while (bits.length % 8) bits.push(0);
  const datos = [];
  for (let i = 0; i < bits.length; i += 8)
    datos.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  /* Relleno hasta llenar: 236 y 17 alternándose. Los elige la norma
     porque su patrón de bits no se parece a nada del resto. */
  for (let i = 0; datos.length < totalDatos; i++) datos.push(i % 2 ? 0x11 : 0xEC);

  const bloques = [], eccs = [];
  let p = 0;
  for (let i = 0; i < b1 + b2; i++) {
    const n = i < b1 ? d1 : d2;
    const bloque = datos.slice(p, p + n); p += n;
    bloques.push(bloque);
    eccs.push(correccion(bloque, nEcc));
  }

  const salida = [];
  for (let i = 0; i < Math.max(d1, d2); i++)
    for (const b of bloques) if (i < b.length) salida.push(b[i]);
  for (let i = 0; i < nEcc; i++) for (const e of eccs) salida.push(e[i]);
  return salida;
}

/* --- La retícula ------------------------------------------------------ */

/* Los módulos que no son datos: las tres dianas de las esquinas, sus
   separadores, las líneas de tiempo, los patrones de alineación y el
   módulo negro obligatorio. Se marcan en `fijo` para que ni la máscara
   ni el trazado de datos los toquen. */
function armazon(version) {
  const tam = version * 4 + 17;
  const mod = Array.from({ length: tam }, () => new Uint8Array(tam));
  const fijo = Array.from({ length: tam }, () => new Uint8Array(tam));
  const poner = (y, x, v) => { if (y >= 0 && x >= 0 && y < tam && x < tam) { mod[y][x] = v; fijo[y][x] = 1; } };

  for (const [fy, fx] of [[0, 0], [0, tam - 7], [tam - 7, 0]])
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const anillo = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6));
      poner(fy + i, fx + j, (anillo || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) ? 1 : 0);
    }

  for (let i = 8; i < tam - 8; i++) { const v = i % 2 === 0 ? 1 : 0; poner(6, i, v); poner(i, 6, v); }

  const pos = ALINEACION[version];
  for (const y of pos) for (const x of pos) {
    if ((y === 6 && x === 6) || (y === 6 && x === tam - 7) || (y === tam - 7 && x === 6)) continue;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++)
      poner(y + i, x + j, Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0);
  }

  /* Se reservan las casillas del formato; el valor real se escribe al
     final, cuando ya se sabe qué máscara gana. El 6 se salta: ahí cruzan
     las líneas de tiempo, que ya están puestas y no son del formato.
     Pisarlas deja dos módulos en blanco y el código, aun leyéndose, deja
     de ser idéntico al de la norma. */
  for (let i = 0; i < 9; i++) { if (i === 6) continue; poner(8, i, 0); poner(i, 8, 0); }
  for (let i = 0; i < 8; i++) { poner(8, tam - 1 - i, 0); poner(tam - 1 - i, 8, 0); }
  poner(tam - 8, 8, 1);

  if (version >= 7) {
    let r = version;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const bits = (version << 12) | r;
    for (let i = 0; i < 18; i++) {
      const b = (bits >> i) & 1, a = tam - 11 + i % 3, c = Math.floor(i / 3);
      poner(c, a, b); poner(a, c, b);
    }
  }
  return { tam, mod, fijo };
}

/* Los bytes se escriben en zigzag de dos columnas, de abajo a la derecha
   hacia arriba a la izquierda, saltándose la columna 6 (línea de tiempo)
   y cualquier módulo fijo. */
function trazar(r, bytes) {
  let i = 0;
  for (let der = r.tam - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;
    for (let v = 0; v < r.tam; v++) for (let j = 0; j < 2; j++) {
      const x = der - j, arriba = ((der + 1) & 2) === 0, y = arriba ? r.tam - 1 - v : v;
      if (!r.fijo[y][x] && i < bytes.length * 8) {
        r.mod[y][x] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
        i++;
      }
    }
  }
}

const MASCARAS = [
  (y, x) => (x + y) % 2 === 0,
  (y, x) => y % 2 === 0,
  (y, x) => x % 3 === 0,
  (y, x) => (x + y) % 3 === 0,
  (y, x) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (y, x) => (x * y) % 2 + (x * y) % 3 === 0,
  (y, x) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
  (y, x) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
];

/* --- Puntuación de una máscara ---------------------------------------
   La norma prueba las ocho y se queda con la que menos penalización
   saca. Se castiga lo que confunde a un lector: tiras largas del mismo
   color, cuadrados macizos, dibujos que se parecen a una diana y un
   reparto de negro muy lejos del 50 %. */
function penalizacion(r) {
  const { tam, mod } = r;
  let total = 0;

  /* 1 · Tiras de 5 o más módulos iguales seguidos: 3 puntos, y 1 más por
     cada módulo que pase de 5. Una tira larga se lee mal al sesgar. */
  const tiras = leer => {
    let ultimo = -1, largo = 0, p = 0;
    for (let i = 0; i < tam; i++) {
      const v = leer(i);
      if (v === ultimo) largo++;
      else { if (largo >= 5) p += 3 + (largo - 5); ultimo = v; largo = 1; }
    }
    return p + (largo >= 5 ? 3 + (largo - 5) : 0);
  };
  for (let i = 0; i < tam; i++) total += tiras(x => mod[i][x]) + tiras(y => mod[y][i]);

  /* 2 · Cada cuadrado macizo de 2x2 del mismo color: 3 puntos. */
  for (let y = 0; y < tam - 1; y++) for (let x = 0; x < tam - 1; x++)
    if (mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) total += 3;

  /* 3 · Cualquier tramo que imite una diana —proporción 1:1:3:1:1 con
     cuatro módulos claros a un lado— confunde al lector sobre dónde
     empieza el código: 40 puntos. Se busca la secuencia literal de 11
     módulos, en los dos sentidos, por filas y por columnas. */
  for (let i = 0; i < tam; i++) {
    let fila = 0, col = 0;
    for (let j = 0; j < tam; j++) {
      fila = ((fila << 1) & 0x7FF) | mod[i][j];
      col = ((col << 1) & 0x7FF) | mod[j][i];
      if (j >= 10) {
        if (fila === 0x5D0 || fila === 0x05D) total += 40;
        if (col === 0x5D0 || col === 0x05D) total += 40;
      }
    }
  }

  /* 4 · Desviarse del 50 % de módulos negros: 10 puntos por cada 5 % */
  let negros = 0;
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) negros += mod[y][x];
  total += Math.abs(Math.ceil((negros * 100 / (tam * tam)) / 5) - 10) * 10;
  return total;
}

/* Los 15 bits de formato: nivel y máscara, protegidos con BCH(15,5) y
   mezclados con 0x5412 para que un QR todo blanco no parezca válido. */
function escribirFormato(r, nivel, mascara) {
  const dato = (BITS_NIVEL[nivel] << 3) | mascara;
  let rem = dato;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((dato << 10) | rem) ^ 0x5412;
  const b = i => (bits >> i) & 1;
  const { tam, mod } = r;
  for (let i = 0; i <= 5; i++) mod[i][8] = b(i);
  mod[7][8] = b(6); mod[8][8] = b(7); mod[8][7] = b(8);
  for (let i = 9; i < 15; i++) mod[8][14 - i] = b(i);
  for (let i = 0; i < 8; i++) mod[8][tam - 1 - i] = b(i);
  for (let i = 8; i < 15; i++) mod[tam - 15 + i][8] = b(i);
  mod[tam - 8][8] = 1;
}

/* --- La única función que hace falta desde fuera ---------------------- */
function codificar(texto, nivel = 'H') {
  if (!BLOQUES[nivel]) throw new Error('nivel debe ser L, M, Q o H');
  const bytes = Buffer.from(texto, 'utf8').length;

  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const [, b1, d1, b2, d2] = BLOQUES[nivel][v - 1];
    if (4 + (v < 10 ? 8 : 16) + bytes * 8 <= (b1 * d1 + b2 * d2) * 8) { version = v; break; }
  }
  if (!version) throw new Error(`"${texto.slice(0, 40)}…" no cabe en nivel ${nivel} hasta la versión 10`);

  const datos = cuerpo(texto, version, nivel);
  let mejor = null;
  for (let m = 0; m < 8; m++) {
    const r = armazon(version);
    trazar(r, datos);
    for (let y = 0; y < r.tam; y++) for (let x = 0; x < r.tam; x++)
      if (!r.fijo[y][x] && MASCARAS[m](y, x)) r.mod[y][x] ^= 1;
    escribirFormato(r, nivel, m);
    const p = penalizacion(r);
    if (!mejor || p < mejor.p) mejor = { p, r, m };
  }

  return {
    tam: mejor.r.tam,
    version, nivel, mascara: mejor.m, texto,
    mod: mejor.r.mod.map(f => Array.from(f, v => !!v)),
  };
}

module.exports = { codificar };
