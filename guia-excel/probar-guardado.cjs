const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const EX = process.argv[2] || __dirname; fs.mkdirSync(path.join(EX, 'capturas'), { recursive: true });
const cuerpo = fs.readFileSync(path.join(EX, 'dist/hoja-a-hoja.html'), 'utf8');
const tmp = path.join(EX, 'dist/_envuelto.html');
fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>${cuerpo}</body></html>`);
const progreso = { v: 1, actualizado: 1, xp: 120, lecciones: { n0m1l1: { estado: 'hecha', t: 1 } }, ej: { 'n0m1l1-e1': { ok: true, n: 1 } } };
function mock(modo) { // modo: 'lectora' (rechaza escrituras), 'editora' (acepta), 'ninguno'
  return `(() => { const modo = ${JSON.stringify(modo)}; if (modo === 'ninguno') return; window.__escrito = [];
    const db = { doc: (p) => ({ get: async () => ({ exists: false }), set: async (d) => { if (modo === 'lectora') throw { code: 'invalid_argument', message: 'below minimum' }; window.__escrito.push(p); } }) };
    const user = { id: async () => 'u123', can: async () => modo === 'editora' };
    const downloads = { save: async (o) => { window.__descarga = o.filename; } };
    const caps = { db, user, downloads, sample: null };
    window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(caps[n] || null), 50)) }; })();`;
}
(async () => {
  const b = await chromium.launch(); const errores = [];
  for (const modo of ['lectora', 'editora', 'ninguno']) {
    const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); const p = await ctx.newPage();
    p.on('pageerror', (e) => errores.push(modo + ': ' + e.message));
    await p.addInitScript(mock(modo));
    await p.addInitScript((g) => { try { localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify(g)); } catch (e) {} }, progreso);
    await p.goto('file://' + path.resolve(tmp)); await p.waitForTimeout(2500);
    const aviso = await p.evaluate(() => { const a = document.querySelector('.guardado-aviso, .guardado-linea'); return a ? a.innerText.replace(/\s+/g, ' ').slice(0, 160) : null; });
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(EX, 'capturas', `guardado-mapa-${modo}.png`), clip: { x: 0, y: 0, width: 1100, height: 760 } });
    let descarga = null;
    if (modo === 'lectora') { await p.click('.guardado-aviso button'); await p.waitForTimeout(600); descarga = await p.evaluate(() => window.__descarga); }
    const linea = await p.evaluate(() => { const a = document.querySelector('.guardado-linea'); return a ? a.innerText : null; });
    await p.evaluate(() => { location.hash = '#perfil'; }); await p.waitForTimeout(700);
    const perfil = await p.evaluate(() => { const h = [...document.querySelectorAll('h2')].find((x) => /Dónde se guarda/.test(x.textContent)); return h ? h.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 260) : null; });
    // guardado en la cuenta tras una acción
    const escrito = await p.evaluate(() => window.__escrito || null);
    console.log(JSON.stringify({ modo, avisoMapa: aviso, descarga, lineaTrasCopia: linea, perfil, escritoEnCuenta: escrito }, null, 1));
    await ctx.close();
  }
  console.log('errores:', errores);
  await b.close();
})();
