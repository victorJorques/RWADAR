const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 820 } }); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForTimeout(800);
  await p.evaluate(() => { const ids = ['n0m3l1-e1', 'n0m3l1-e2', 'n0m3l1-e3', 'n0m3l2-e1', 'n0m3l2-e2']; const P = { v: 1, bienvenida: '2026-11-10', nombre: 'Laura', lecciones: { n0m3l1: { estado: 'hecha' }, n0m3l2: { estado: 'hecha' } }, mem: {}, actualizado: Date.now(), sonido: false }; ids.forEach((i) => { P.mem[i] = { caja: 1, prox: '2026-11-01' }; }); localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify(P)); });
  await p.reload(); await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages, null, { timeout: 30000 }); await p.evaluate(() => { location.hash = '#entrenar'; }); await p.waitForTimeout(600);
  const pasos = [];
  for (let k = 0; k < 12; k++) {
    if (await p.locator('.resultado').count()) { pasos.push('RESULTADO: ' + (await p.locator('.resultado h1').innerText())); break; }
    const btn = p.locator('.barra-continuar button.primario'); const t0 = await btn.innerText(); const des = await btn.isDisabled();
    const inp = p.locator('.pantalla-jugar input[type=text]:not([readonly])').first(); const op = p.locator('.pantalla-jugar .opcion');
    if (await inp.count()) { await inp.fill('zz'); await btn.click(); } else if (await op.count()) { await op.first().click(); } else { const z = p.locator('.pantalla-jugar [data-zona]').first(); if (await z.count()) await z.click(); }
    await p.waitForTimeout(250);
    const estado = await p.locator('.barra-continuar').getAttribute('class'); const t1 = await btn.innerText();
    pasos.push(`${k + 1}: botón «${t0}»${des ? ' (desactivado)' : ''} → ${estado.replace('barra-continuar', '').trim() || 'neutro'}, «${t1}» · ${(await p.locator('.msj-tit').innerText()).trim()}`);
    if (/Comprobar|Ver qué pasa/.test(t1)) { const sol = p.locator('button', { hasText: /solución/i }).first(); if (await sol.count() && await sol.isEnabled()) await sol.click(); else { for (let j = 0; j < 4; j++) { const pi = p.locator('button', { hasText: /pista/i }).first(); if (await pi.count() && await pi.isEnabled()) await pi.click(); } const s2 = p.locator('button', { hasText: /solución/i }).first(); if (await s2.count()) await s2.click(); } await p.waitForTimeout(200); }
    await btn.click(); await p.waitForTimeout(250);
  }
  console.log(pasos.join('\n')); console.log('errores:', err); await b.close(); })();
