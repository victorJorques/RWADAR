const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const archivo = process.argv[2]; const salida = process.argv[3] || 'capturas'; const rutas = (process.argv[4] || '#inicio').split(',');
const ancho = +(process.env.ANCHO || 1280); const tema = process.env.TEMA || 'light';
(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const cuerpo = fs.readFileSync(archivo, 'utf8');
  const envuelto = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${cuerpo}</body></html>`;
  const tmp = path.join(path.dirname(archivo), '_envuelto.html'); fs.writeFileSync(tmp, envuelto);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: ancho, height: 900 }, colorScheme: tema });
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  await p.goto('file://' + path.resolve(tmp));
  await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages && window.HyperFormula.languages.esES, null, { timeout: 30000 }).catch(() => errores.push('HF no cargó'));
  await p.waitForTimeout(800);
  for (const r of rutas) {
    await p.evaluate((h) => { location.hash = h; }, r); await p.waitForTimeout(700);
    const n = r.replace(/[^\w-]/g, '') || 'inicio';
    await p.screenshot({ path: `${salida}/${n}-${ancho}-${tema}.png`, fullPage: true });
    const ancho_doc = await p.evaluate(() => document.documentElement.scrollWidth);
    if (ancho_doc > ancho + 1) errores.push(`${r}: desbordamiento horizontal ${ancho_doc}px`);
  }
  if (process.env.INTERACTUAR) { await eval(fs.readFileSync(process.env.INTERACTUAR, 'utf8'))(p, salida); }
  console.log(JSON.stringify({ errores }, null, 1));
  await b.close();
})();
