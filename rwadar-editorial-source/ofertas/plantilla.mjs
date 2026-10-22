// Página de 1280×880 que se fotografía y se reduce a 960×660. La escena va a
// la derecha y el lugar y los tres pasos, a la izquierda, en la franja que se
// ve en todas las tarjetas: arriba quedan el tipo y, en la ficha, el estado;
// abajo, la etiqueta «Ilustración editorial» y el degradado de la tarjeta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defs } from './motor.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS_WEB = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.css');
// Las mismas Geist y Geist Mono de la web, incrustadas en su hoja de estilos.
const FUENTES = (fs.readFileSync(CSS_WEB, 'utf8').match(/@font-face\{[^}]*\}/g) || []).join('\n');
if (!/Geist/.test(FUENTES)) throw new Error('no encuentro las fuentes Geist en la hoja de estilos de la web');

export const W = 1280, H = 880;

const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const VELO = '<linearGradient id="velo" x1="0" x2="1"><stop offset="0" stop-color="#0B0A0A" stop-opacity=".94"/>' +
  '<stop offset=".40" stop-color="#0B0A0A" stop-opacity=".6"/><stop offset=".56" stop-color="#0B0A0A" stop-opacity="0"/></linearGradient>';
const RADAR = (c, cx, cy) => [150, 250, 350, 450].map((r, i) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-opacity="${.12 - i * .02}" stroke-width="2" ${i % 2 ? 'stroke-dasharray="4 10"' : ''}/>`).join('');

export function pagina({ color, escena, pasos, lugar }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:#0B0A0A;font-family:Geist,sans-serif;color:#F7F5F0;overflow:hidden}
  .l{position:absolute;inset:0}
  .bloque{position:absolute;left:44px;top:368px;width:660px}
  .lugar{display:flex;align-items:center;gap:12px;margin:0 0 20px 4px;font:600 27px 'Geist Mono',monospace;color:#D9D3C8;letter-spacing:.02em;text-shadow:0 2px 10px #0B0A0A}
  .lugar i{width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color}}
  .pasos{list-style:none;display:flex;flex-direction:column;gap:18px}
  .pasos li{display:flex;align-items:center;gap:20px;font-size:48px;font-weight:680;line-height:1.05;letter-spacing:-.015em;text-shadow:0 2px 14px #0B0A0A}
  .pasos .n{flex:0 0 58px;height:58px;border-radius:50%;border:3.5px solid ${color};color:${color};display:grid;place-items:center;font:700 28px 'Geist Mono',monospace;background:#0B0A0A;position:relative}
  .pasos li:not(:last-child) .n::after{content:'';position:absolute;left:50%;top:58px;width:3.5px;height:18px;background:${color};opacity:.5;transform:translateX(-50%)}
  </style></head><body>
  <svg class="l" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs(color).replace('</defs>', `${VELO}</defs>`)}<rect width="${W}" height="${H}" fill="url(#halo)"/>${RADAR(color, 960, 470)}${escena(color)}<rect width="${W}" height="${H}" fill="url(#velo)"/></svg>
  <div class="bloque">${lugar ? `<div class="lugar"><i></i>${esc(lugar)}</div>` : ''}<ol class="pasos">${pasos.map((t, i) => `<li><span class="n">${i + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol></div>
  </body></html>`;
}
