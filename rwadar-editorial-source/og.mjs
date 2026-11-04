// Dibuja rwadar-site/og.png (1200×630), la imagen que enseñan las redes y los
// chats al compartir un enlace de RWAdar. Sin cifras que caduquen y con la
// dirección pública vigente.
//
//   node rwadar-editorial-source/og.mjs
//
// Necesita Playwright con Chromium (RWADAR_CHROMIUM indica el ejecutable).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { ORIGEN_PUBLICO } = require('../rwadar-publicacion-segura.js');
// Las fuentes de la hoja de la web apuntan a /assets/fuentes/: aquí no hay
// servidor, así que se incrustan en base64 (si no, sale una letra de sustitución).
const FUENTES = (fs.readFileSync(path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.css'), 'utf8').match(/@font-face\{[^}]*\}/g) || [])
  .map((regla) => regla.replace(/url\((\/assets\/fuentes\/[^)]+\.woff2)\)/g, (_, ruta) =>
    `url(data:font/woff2;base64,${fs.readFileSync(path.join(RAIZ, 'rwadar-site', ruta)).toString('base64')})`))
  .join('\n');
if (!/Geist/.test(FUENTES)) throw new Error('no encuentro las fuentes Geist en la hoja de estilos de la web');

const W = 1200, H = 630, CX = 935, CY = 322, R = 150;
// Las categorías y sus nombres cortos, como el radar de la web (CATMETA y
// catCorta de rwadar-20260820.js); antes decía «Inmuebles» y «Deuda pública».
const SECTORES = [
  ['INMOBILIARIO', '#F2B23C', -90, 'Inmobiliario'], ['CRÉDITO', '#5B8CFF', -30, 'Crédito privado'],
  ['TESORO', '#32C9F5', 30, 'Tesoro y fondos'], ['ACCIONES', '#B583FF', 90, 'Acciones y capital privado'],
  ['MATERIAS\nPRIMAS', '#FF8A5B', 150, 'Materias primas'], ['INFRAESTRUCTURA', '#9AA6BF', 210, 'Infraestructura'],
];
// Un punto por plataforma del catálogo publicado, en el sector de su
// categoría (antes eran 18 puntos fijos de adorno). La posición dentro del
// sector es determinista: la misma lista da siempre la misma imagen.
const { leerCatalogo } = require('../rwadar-fichas.js');
const PLATAFORMAS = leerCatalogo(RAIZ).plataformas;
const sinSector = PLATAFORMAS.filter((p) => !SECTORES.some(([, , , cat]) => cat === p.cat));
if (sinSector.length) throw new Error('categoría sin sector en og.png: ' + sinSector.map((p) => p.cat).join(', '));
const PUNTOS = SECTORES.flatMap(([, , , cat], s) => {
  const n = PLATAFORMAS.filter((p) => p.cat === cat).length;
  return Array.from({ length: n }, (_, k) => [s, -22 + 44 * (k + .5) / n, .32 + .62 * ((k * .618034 + s * .37) % 1)]);
});
const pol = (a, r) => [CX + Math.cos(a * Math.PI / 180) * r, CY + Math.sin(a * Math.PI / 180) * r];

const radar = [
  ...[1, .75, .5, .25].map((k, i) => `<circle cx="${CX}" cy="${CY}" r="${R * k}" fill="none" stroke="#25E39A" stroke-opacity="${.34 - i * .05}" stroke-width="1.4"/>`),
  ...SECTORES.map(([, , a]) => { const [x, y] = pol(a - 30, R); return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#25E39A" stroke-opacity=".12"/>`; }),
  `<path d="M${CX} ${CY} L${pol(-60, R).join(' ')} A${R} ${R} 0 0 1 ${pol(0, R).join(' ')} Z" fill="url(#barrido)"/>`,
  `<line x1="${CX}" y1="${CY}" x2="${pol(0, R)[0]}" y2="${pol(0, R)[1]}" stroke="#25E39A" stroke-width="2" stroke-opacity=".8"/>`,
  ...PUNTOS.map(([s, d, k]) => { const [, c, a] = SECTORES[s]; const [x, y] = pol(a + d, R * k); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${c}" stroke="#0B0A0A" stroke-width="2"/>`; }),
  // Los nombres largos van en dos líneas para no tapar los puntos del borde.
  ...SECTORES.map(([t, c, a]) => {
    const [x, y] = pol(a, R + 34); const lineas = t.split('\n'); const y0 = y + 4 - (lineas.length - 1) * 7.5;
    return `<text fill="${c}" fill-opacity=".9" font-family="Geist Mono" font-size="12" letter-spacing="1.5" text-anchor="middle">${lineas.map((l, i) => `<tspan x="${x.toFixed(1)}" y="${(y0 + i * 15).toFixed(1)}">${l}</tspan>`).join('')}</text>`;
  }),
  `<circle cx="${CX}" cy="${CY}" r="3.5" fill="#25E39A"/>`,
].join('');

const MARCA = `<svg width="62" height="62" viewBox="0 0 104 104"><g fill="none" stroke="#25E39A" stroke-width="2.6" opacity=".55"><circle cx="52" cy="52" r="40"/><circle cx="52" cy="52" r="28"/></g><path d="M52 52 L64.74 20.48 A34 34 0 0 1 83.52 39.26 Z" fill="#25E39A" opacity=".45"/><path d="M65 52L58.5 63.26L45.5 63.26L39 52L45.5 40.74L58.5 40.74Z" fill="#25E39A"/><path d="M65 52L58.5 63.26L45.5 63.26L39 52Z" fill="#0F7A57"/></svg>`;
const dominio = ORIGEN_PUBLICO.replace(/^https:\/\//, '');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:Geist,sans-serif;color:#F7F5F0;
  background:radial-gradient(ellipse 60% 80% at 78% 50%,#10301f 0%,rgba(16,48,31,0) 70%),linear-gradient(180deg,#0E1110,#0B0A0A)}
.marca{position:absolute;left:62px;top:48px;display:flex;align-items:center;gap:18px}
.wm{font-weight:800;font-size:38px;letter-spacing:-.03em;line-height:1}.wm span{color:#25E39A}
.wm small{display:block;font:500 12px 'Geist Mono',monospace;letter-spacing:.32em;color:#9C978D;margin-top:9px}
.texto{position:absolute;left:62px;top:168px;width:660px}
h1{font-weight:800;font-size:56px;line-height:1.04;letter-spacing:-.045em}
h1 em{font-style:normal;color:#25E39A;display:block;text-shadow:0 0 40px rgba(37,227,154,.25)}
p{margin-top:26px;width:560px;font-size:21px;line-height:1.45;color:#B9B3A8}
.pie{position:absolute;left:62px;right:62px;bottom:42px;border-top:1px solid #23272A;padding-top:18px;display:flex;justify-content:space-between;
  font:500 13px 'Geist Mono',monospace;letter-spacing:.14em;color:#7C776E}
.pie b{color:#25E39A;font-weight:600;letter-spacing:.04em;font-size:16px}
svg.r{position:absolute;inset:0}
</style></head><body>
<svg class="r" width="${W}" height="${H}"><defs><radialGradient id="barrido" cx="${CX}" cy="${CY}" r="${R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#25E39A" stop-opacity=".05"/><stop offset="1" stop-color="#25E39A" stop-opacity=".32"/></radialGradient></defs>${radar}</svg>
<div class="marca">${MARCA}<div class="wm">RWA<span>dar</span><small>OFERTAS Y PLATAFORMAS TOKENIZADAS</small></div></div>
<div class="texto"><h1>Plataformas de activos tokenizados, <em>con sus fuentes<br>y sus riesgos.</em></h1>
<p>Quién opera, qué permisos constan y qué condiciones publica cada plataforma, y de dónde sale cada dato.</p></div>
<div class="pie"><b>${dominio}</b><span>CATÁLOGO INDEPENDIENTE · NO ES ASESORAMIENTO FINANCIERO</span></div>
</body></html>`;

function cargarPlaywright() {
  for (const intento of [() => require('playwright'), () => createRequire(path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js'))('playwright')]) {
    try { return intento(); } catch { /* siguiente */ }
  }
  throw new Error('hace falta Playwright (npm i -g playwright)');
}
const { chromium } = cargarPlaywright();
const nav = await chromium.launch(process.env.RWADAR_CHROMIUM ? { executablePath: process.env.RWADAR_CHROMIUM } : {});
try {
  const pag = await nav.newPage({ viewport: { width: W, height: H } });
  await pag.setContent(html, { waitUntil: 'load' });
  await pag.evaluate(() => document.fonts.ready);
  const png = await pag.screenshot({ type: 'png' });
  const destino = path.join(RAIZ, 'rwadar-site', 'og.png');
  await sharp(png).removeAlpha().png({ palette: true, quality: 92, effort: 10, dither: 0.6 }).toFile(destino);
  console.log(`og.png: ${fs.statSync(destino).size} bytes`);
} finally { await nav.close(); }
