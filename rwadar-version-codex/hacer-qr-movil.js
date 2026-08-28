/* =====================================================================
   Genera el QR para abrir esta copia privada desde el móvil.
   ---------------------------------------------------------------------
       node hacer-qr-movil.js

   Escribe `qr-movil.png` aquí al lado. El QR lleva dentro la IP de este
   ordenador en tu red y la clave de `.clave-local`.

   Si cambias de WiFi la IP cambia y hay que volver a generarlo. Si borras
   `.clave-local` el QR anterior deja de valer, que es justo lo que
   quieres si alguna vez lo enseñas sin querer.

   Reusa el codificador de `rwadar-qr/codigo-qr.js` (sin dependencias) y
   escribe el PNG con el zlib de Node, igual que `rwadar-qr/hacer-qr.js`.
   No toca los QR de marca de esa carpeta.
   ===================================================================== */
const fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os');
const { codificar } = require('../rwadar-qr/codigo-qr.js');

const PUERTO = 4174;
const AQUI = __dirname;

const ficheroClave = path.join(AQUI, '.clave-local');
if (!fs.existsSync(ficheroClave)) {
  console.error('Falta la clave. Arranca primero: node servir.js --movil');
  process.exit(1);
}
const clave = fs.readFileSync(ficheroClave, 'utf8').trim();

const ips = [];
for (const lista of Object.values(os.networkInterfaces())) {
  for (const i of lista || []) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
}
if (!ips.length) {
  console.error('Este ordenador no esta en ninguna red. Conectate al WiFi.');
  process.exit(1);
}

const destino = `http://${ips[0]}:${PUERTO}/?clave=${clave}`;
const qr = codificar(destino, 'H');
const MARGEN = 4;

const TABLA = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = TABLA[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};
function trozo(tipo, datos) {
  const cab = Buffer.alloc(4); cab.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([cab, cuerpo, crc]);
}
function png(ancho, alto, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 2;
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

const total = qr.tam + MARGEN * 2;
const lado = Math.max(1, Math.round(900 / total));
const px = total * lado;
const rgb = Buffer.alloc(px * px * 3, 0xFF);
for (let y = 0; y < qr.tam; y++) for (let x = 0; x < qr.tam; x++) {
  if (!qr.mod[y][x]) continue;
  for (let dy = 0; dy < lado; dy++) {
    let i = (((MARGEN + y) * lado + dy) * px + (MARGEN + x) * lado) * 3;
    for (let dx = 0; dx < lado; dx++) { rgb[i++] = 0x0B; rgb[i++] = 0x0A; rgb[i++] = 0x0A; }
  }
}

fs.writeFileSync(path.join(AQUI, 'qr-movil.png'), png(px, px, rgb));
console.log('QR escrito: qr-movil.png  (' + px + 'x' + px + ')');
console.log('Apunta a:   ' + destino);
