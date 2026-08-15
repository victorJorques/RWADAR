/* =====================================================================
   RWAdar · genera el código QR de entrada
   ---------------------------------------------------------------------
       node rwadar-qr/hacer-qr.js                     # a rwadar.netlify.app
       node rwadar-qr/hacer-qr.js https://otra.cosa   # a donde le digas

   Escribe tres archivos junto a este:

       rwadar-qr.svg        el código solo, vectorial, para imprimir
       rwadar-qr.png        el código solo, ~1024 px, para pegar
       rwadar-tarjeta.svg   tarjeta de marca con el código dentro

   El cuarto, `rwadar-tarjeta.png`, es esa misma tarjeta rasterizada a
   2160x2700 abriendo el SVG en un navegador y capturándolo. Se guarda ya
   hecha porque es lo que se manda por WhatsApp o se mete en una
   presentación; para imprimir, mejor el SVG, que no tiene resolución.

   Sin dependencias: el codificador es `codigo-qr.js` y el PNG se escribe
   aquí mismo con el zlib de Node. Igual que la web, esto se puede abrir
   dentro de tres años y seguirá funcionando sin instalar nada.

   La tarjeta lleva la tipografía Geist incrustada, sacada del propio
   `rwadar-site/index.html`, así que se ve igual en cualquier ordenador
   sin pedirle un archivo a nadie.
   ===================================================================== */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { codificar } = require('./codigo-qr.js');

const DESTINO = process.argv[2] || 'https://rwadar.netlify.app';
const AQUI = __dirname;

/* Los colores salen de la sección «1 · TOKENS» de la web. Si allí cambian,
   cámbialos aquí: son la misma marca. */
const NOCHE = '#0B0A0A', SUP = '#171614', LINEA = '#26241F';
const TX = '#F7F5F0', TX2 = '#BBB5AB', TX3 = '#8A8378', SENAL = '#25E39A';

/* Nivel H: aguanta que se estropee el 30 % del dibujo y sigue leyéndose.
   Es el que hay que usar en algo que se va a imprimir, doblar y fotocopiar,
   o a poner en una pantalla que alguien fotografía de lado. */
const qr = codificar(DESTINO, 'H');

/* ---------------------------------------------------------------------
   Los módulos, como un único trazado SVG
   ------------------------------------------------------------------ */

/* Un `path` con todos los cuadrados en vez de miles de `rect` sueltos:
   el archivo baja de 60 kB a 6 kB y el navegador lo pinta de una vez.
   Los módulos contiguos de una fila se funden en un solo rectángulo. */
function trazado(m, lado, dx = 0, dy = 0) {
  let d = '';
  for (let y = 0; y < m.tam; y++) {
    let x = 0;
    while (x < m.tam) {
      if (!m.mod[y][x]) { x++; continue; }
      let ancho = 1;
      while (x + ancho < m.tam && m.mod[y][x + ancho]) ancho++;
      const px = dx + x * lado, py = dy + y * lado;
      d += `M${+px.toFixed(2)} ${+py.toFixed(2)}h${+(ancho * lado).toFixed(2)}v${+lado.toFixed(2)}h-${+(ancho * lado).toFixed(2)}z`;
      x += ancho;
    }
  }
  return d;
}

/* La «zona tranquila»: cuatro módulos de margen claro alrededor. No es
   decoración, la exige la norma — sin ella el lector no encuentra dónde
   empieza el código. */
const MARGEN = 4;

function svgSuelto() {
  const total = qr.tam + MARGEN * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 16}" height="${total * 16}" shape-rendering="crispEdges" role="img" aria-label="Código QR que lleva a ${DESTINO}">
<title>RWAdar · ${DESTINO}</title>
<rect width="${total}" height="${total}" fill="#FFFFFF"/>
<path d="${trazado(qr, 1, MARGEN, MARGEN)}" fill="${NOCHE}"/>
</svg>
`;
}

/* ---------------------------------------------------------------------
   PNG a mano: firma, IHDR, IDAT, IEND
   ------------------------------------------------------------------ */
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = buf => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};
function trozo(tipo, datos) {
  const cab = Buffer.alloc(4); cab.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([cab, cuerpo, crc]);
}
/* rgb: un Buffer de ancho*alto*3. Cada fila lleva delante su byte de
   filtro (0 = sin filtro): es lo que espera el formato. */
function png(ancho, alto, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const crudo = Buffer.alloc(alto * (ancho * 3 + 1));
  for (let y = 0; y < alto; y++) {
    crudo[y * (ancho * 3 + 1)] = 0;
    rgb.copy(crudo, y * (ancho * 3 + 1) + 1, y * ancho * 3, (y + 1) * ancho * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

function pngSuelto() {
  const total = qr.tam + MARGEN * 2;
  const lado = Math.max(1, Math.round(1024 / total));
  const px = total * lado;
  const rgb = Buffer.alloc(px * px * 3, 0xFF);
  const [r, g, b] = [0x0B, 0x0A, 0x0A];
  for (let y = 0; y < qr.tam; y++) for (let x = 0; x < qr.tam; x++) {
    if (!qr.mod[y][x]) continue;
    for (let dy = 0; dy < lado; dy++) {
      let i = (((MARGEN + y) * lado + dy) * px + (MARGEN + x) * lado) * 3;
      for (let dx = 0; dx < lado; dx++) { rgb[i++] = r; rgb[i++] = g; rgb[i++] = b; }
    }
  }
  return { buf: png(px, px, rgb), px };
}

/* ---------------------------------------------------------------------
   La tarjeta
   ------------------------------------------------------------------ */

/* El logotipo real, copiado de `const MARK=` de la web. Si allí cambia,
   este se queda viejo: es una copia a propósito, para que la tarjeta se
   pueda generar sin depender de un archivo de 246 kB. */
const MARCA = `
<g fill="none" stroke="${SENAL}" stroke-width="1.6">
 <circle cx="52" cy="52" r="46"/><circle cx="52" cy="52" r="35"/><circle cx="52" cy="52" r="24"/></g>
<g fill="none" stroke="${SENAL}" stroke-width="1.4" stroke-linecap="round">
 <path d="M52 4v14M52 86v14M4 52h14M86 52h14"/></g>
<path d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill="${SENAL}" opacity=".38"/>
<g>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="${SENAL}"/>
 <path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57"/>
 <path d="M58.5 40.74L65 52L58.5 63.26" fill="none" stroke="#6BF0C0" stroke-width="1.6" stroke-linejoin="round"/></g>
<g fill="${SENAL}">
 <circle cx="22" cy="30" r="3.1"/><circle cx="25" cy="78" r="2.6"/><circle cx="82" cy="76" r="2.9"/></g>`;

/* Saca las dos declaraciones @font-face de la web para incrustarlas aquí.
   Si no se encuentra el archivo, la tarjeta usa la tipografía del sistema
   en vez de romperse. */
function tipografias() {
  const f = path.join(AQUI, '..', 'rwadar-site', 'index.html');
  if (!fs.existsSync(f)) return '';
  const html = fs.readFileSync(f, 'utf8');
  return (html.match(/@font-face\{[^}]*?src:url\(data:font\/woff2;base64,[^)]*\)[^}]*\}/g) || []).join('\n');
}

function tarjeta() {
  const A = 1080, AL = 1350;
  const PX = 180, PY = 424, PS = 720;          // panel blanco del código
  const lado = PS / (qr.tam + MARGEN * 2);     // el margen claro sale exacto
  const dib = trazado(qr, lado, PX + MARGEN * lado, PY + MARGEN * lado);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A} ${AL}" width="${A}" height="${AL}" role="img" aria-label="Tarjeta de RWAdar con un código QR que lleva a ${DESTINO}">
<title>RWAdar · escanea para entrar</title>
<style>
${tipografias()}
.t{font-family:'Geist',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
.m{font-family:'Geist Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace}
</style>
<rect width="${A}" height="${AL}" fill="${NOCHE}"/>

<!-- Ecos de radar de fondo. Muy bajos de opacidad: dan textura sin
     competir con el código, que es lo único que hay que mirar. -->
<g fill="none" stroke="${SENAL}" opacity=".07">
 <circle cx="${A / 2}" cy="${PY + PS / 2}" r="300" stroke-width="1"/>
 <circle cx="${A / 2}" cy="${PY + PS / 2}" r="430" stroke-width="1"/>
 <circle cx="${A / 2}" cy="${PY + PS / 2}" r="560" stroke-width="1"/>
 <circle cx="${A / 2}" cy="${PY + PS / 2}" r="690" stroke-width="1"/></g>
<rect x="14" y="14" width="${A - 28}" height="${AL - 28}" rx="30" fill="none" stroke="${LINEA}" stroke-width="2"/>

<g transform="translate(${A / 2 - 66} 96) scale(1.27)">${MARCA}</g>

<text class="t" x="${A / 2}" y="352" text-anchor="middle" fill="${TX}" font-size="76" font-weight="700" letter-spacing="-2.4">RWAdar</text>
<text class="t" x="${A / 2}" y="398" text-anchor="middle" fill="${TX2}" font-size="27" letter-spacing="-.2">Registro de plataformas de tokenización</text>

<rect x="${PX}" y="${PY}" width="${PS}" height="${PS}" rx="34" fill="#FFFFFF"/>
<path d="${dib}" fill="${NOCHE}" shape-rendering="crispEdges"/>

<text class="m" x="${A / 2}" y="1224" text-anchor="middle" fill="${SENAL}" font-size="35" letter-spacing="-.5">rwadar.netlify.app</text>
<text class="t" x="${A / 2}" y="1280" text-anchor="middle" fill="${TX3}" font-size="24" letter-spacing="2.6">ESCANEA PARA ENTRAR</text>
</svg>
`;
}

/* --------------------------------------------------------------------- */
const suelto = pngSuelto();
const salidas = [
  ['rwadar-qr.svg', svgSuelto()],
  ['rwadar-qr.png', suelto.buf],
  ['rwadar-tarjeta.svg', tarjeta()],
];
for (const [nombre, datos] of salidas) fs.writeFileSync(path.join(AQUI, nombre), datos);

console.log(`RWAdar · código QR
  destino    ${DESTINO}
  versión    ${qr.version} · nivel ${qr.nivel} · máscara ${qr.mascara}
  módulos    ${qr.tam}x${qr.tam} (+${MARGEN} de margen a cada lado)
  tolerancia hasta un 30 % del dibujo dañado
`);
for (const [nombre] of salidas) {
  const t = fs.statSync(path.join(AQUI, nombre)).size;
  console.log(`  ${nombre.padEnd(20)} ${String(Math.round(t / 102.4) / 10).padStart(6)} kB` +
    (nombre === 'rwadar-qr.png' ? `   ${suelto.px}x${suelto.px} px` : ''));
}
console.log(`
  rwadar-tarjeta.png no se regenera aquí: se saca abriendo el SVG en el
  navegador y capturándolo. El SVG ya es autónomo —lleva la tipografía
  dentro— y sirve para imprimir a cualquier tamaño.

  Comprueba que el código se lee de verdad:
      node rwadar-qr/comprobar-qr.js`);
