const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const EX = process.argv[2] || __dirname; const SAL = process.argv[3] || path.join(EX, 'capturas'); fs.mkdirSync(SAL, { recursive: true });
const cuerpo = fs.readFileSync(path.join(EX, 'dist/hoja-a-hoja.html'), 'utf8');
const tmp = path.join(EX, 'dist/_v7.html');
fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${cuerpo}</body></html>`);
(async () => {
  const b = await chromium.launch(); const err = [];
  for (const [ancho, tema] of [[390, 'light'], [390, 'dark'], [1280, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: ancho < 600 ? 820 : 900 }, colorScheme: tema }); const p = await ctx.newPage();
    p.on('pageerror', (e) => err.push(e.message));
    const foto = async (t) => p.screenshot({ path: path.join(SAL, `${t}-${ancho}-${tema}.png`) });
    await p.goto('file://' + path.resolve(tmp));
    await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages, null, { timeout: 30000 }).catch(() => err.push('HF'));
    await p.waitForTimeout(500);
    if (ancho === 390 && tema === 'light') {
      await foto('b0');
      await p.fill('#bienvenida-nombre', 'Laura Martín'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
      await p.locator('.opcion').nth(1).click(); await p.locator('.barra-continuar button').click(); await p.waitForTimeout(200);
      await p.locator('.opcion').first().click(); await p.locator('.barra-continuar button').click(); await p.waitForTimeout(200);
      await p.locator('.opcion').first().click(); await foto('b3'); await p.locator('.barra-continuar button').click(); await p.waitForTimeout(1200);
      await foto('b4-tarjeta');
      // un fallo en una lección
      await p.evaluate(() => { location.hash = '#jugar-n0m2l1'; }); await p.waitForTimeout(400);
      for (let k = 0; k < 12; k++) { if (await p.locator('.pantalla-jugar section.ejercicio').count()) break; await p.locator('.barra-continuar button.primario').click(); await p.waitForTimeout(200); }
      await foto('ej-antes');
      const op = p.locator('.pantalla-jugar .opcion'); const inp = p.locator('.pantalla-jugar input[type=text]').first();
      if (await op.count()) await op.last().click(); else { await inp.fill('zz'); await p.locator('.barra-continuar button.primario').click(); }
      await p.waitForTimeout(450); await foto('ej-fallo');
    }
    // progreso de ejemplo: primer módulo terminado, cofre por abrir
    await p.evaluate(() => { const D = window.DATOS; const m = D.modulos[D.curso.niveles[0].modulos[0].id]; const P = JSON.parse(localStorage.getItem('hoja-a-hoja-progreso-v1') || '{}'); P.v = 1; P.bienvenida = P.bienvenida || '2026-11-20'; P.nombre = P.nombre || 'Laura Martín'; P.lecciones = {}; P.estrellas = {}; m.lecciones.forEach((l, i) => { P.lecciones[l.id] = { estado: 'hecha', t: 1 }; P.estrellas[l.id] = i % 2 ? 2 : 3; }); P.xp = 180; P.dias = { '2026-11-20': 40 }; P.actualizado = Date.now(); localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify(P)); });
    await p.reload(); await p.waitForTimeout(900); await p.evaluate(() => { location.hash = '#inicio'; }); await p.waitForTimeout(500);
    await p.evaluate(() => { const el = document.querySelector('.nodo.actual'); if (el) el.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300);
    await foto('mapa');
    await p.evaluate(() => { const el = document.querySelector('.nodo.actual a, .nodo.actual button'); el && el.click(); }); await p.waitForTimeout(500);
    await foto('cofre');
    const ab = p.locator('button', { hasText: 'Abrir el cofre' }); if (await ab.count()) { await ab.click(); await p.waitForTimeout(2300); await foto('cofre-abierto'); }
    await p.evaluate(() => { location.hash = '#perfil'; }); await p.waitForTimeout(500); await foto('perfil');
    await ctx.close();
  }
  console.log('errores:', err); await b.close();
})();
