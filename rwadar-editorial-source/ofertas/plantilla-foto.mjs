// Página de 1280×880 para las fotografías generadas: la foto ocupa todo el
// lienzo. Desde el 03/11/2026 (Víctor: «deja una foto limpia») la imagen no
// lleva rótulos: el lugar y los tres pasos van como texto en la ficha. Desde el
// 26/11/2026 («lo más realistas posibles sin mucha edición») la foto limpia va
// tal cual, sin graduar, sin viñeta y sin grano. Con rotulo:true se recupera el
// velo con el texto (y su graduación).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS_WEB = path.join(RAIZ, 'rwadar-site', 'assets', 'rwadar-20260820.css');
const FUENTES = (fs.readFileSync(CSS_WEB, 'utf8').match(/@font-face\{[^}]*\}/g) || []).join('\n');
if (!/Geist/.test(FUENTES)) throw new Error('no encuentro las fuentes Geist en la hoja de estilos de la web');

export const W = 1280, H = 880;
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// foto: data URL de la imagen ya retocada; encuadre: posición CSS del objeto
// (p. ej. '70% 50%') para dejar el activo a la derecha.
export function paginaFoto({ color, foto, encuadre = '68% 55%', pasos, lugar, rotulo = false }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FUENTES}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:#0B0A0A;font-family:Geist,sans-serif;color:#F7F5F0;overflow:hidden;position:relative}
  .foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${encuadre}}
  ${rotulo ? '.foto{filter:contrast(1.06) saturate(1.08) brightness(.97)}' : ''}
  /* velo de lectura a la izquierda, viñeta y una base oscura abajo */
  .velo{position:absolute;inset:0;background:
    linear-gradient(90deg,rgba(9,9,10,.94) 0%,rgba(9,9,10,.82) 26%,rgba(9,9,10,.42) 46%,rgba(9,9,10,0) 62%),
    linear-gradient(0deg,rgba(9,9,10,.55) 0%,rgba(9,9,10,0) 28%),
    radial-gradient(ellipse 85% 95% at 68% 48%,rgba(0,0,0,0) 55%,rgba(0,0,0,.42) 100%)}
  /* sin rótulo: solo una viñeta suave y una base algo más oscura abajo */
  .vineta{position:absolute;inset:0;background:
    linear-gradient(0deg,rgba(9,9,10,.32) 0%,rgba(9,9,10,0) 30%),
    radial-gradient(ellipse 90% 100% at 50% 48%,rgba(0,0,0,0) 60%,rgba(0,0,0,.34) 100%)}
  /* grano fino, para que la imagen respire como una foto */
  .grano{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay}
  .acento{position:absolute;left:44px;top:330px;width:64px;height:4px;border-radius:2px;background:${color};box-shadow:0 0 14px ${color}}
  .bloque{position:absolute;left:44px;top:368px;width:660px}
  .lugar{display:flex;align-items:center;gap:12px;margin:0 0 20px 4px;font:600 27px 'Geist Mono',monospace;color:#E4DED3;letter-spacing:.02em;text-shadow:0 2px 10px #000}
  .lugar i{width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color}}
  .pasos{list-style:none;display:flex;flex-direction:column;gap:18px}
  .pasos li{display:flex;align-items:center;gap:20px;font-size:48px;font-weight:680;line-height:1.05;letter-spacing:-.015em;text-shadow:0 2px 16px rgba(0,0,0,.9)}
  .pasos .n{flex:0 0 58px;height:58px;border-radius:50%;border:3.5px solid ${color};color:${color};display:grid;place-items:center;font:700 28px 'Geist Mono',monospace;background:rgba(9,9,10,.78);position:relative}
  .pasos li:not(:last-child) .n::after{content:'';position:absolute;left:50%;top:58px;width:3.5px;height:18px;background:${color};opacity:.55;transform:translateX(-50%)}
  </style></head><body>
  <img class="foto" src="${foto}" alt="">
  ${rotulo ? `<div class="velo"></div>
  <svg class="grano" width="${W}" height="${H}"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>
  <div class="acento"></div>
  <div class="bloque">${lugar ? `<div class="lugar"><i></i>${esc(lugar)}</div>` : ''}<ol class="pasos">${pasos.map((t, i) => `<li><span class="n">${i + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol></div>` : ''}
  </body></html>`;
}
