// Chrome de escritorio: ¿se puede escribir pulsando la celda y tecleando, como en Excel?
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 860 } })).newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2] || 'dist/_v9.html')); await p.evaluate(() => localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify({ v: 1, bienvenida: '2026-11-10', nombre: 'L', actualizado: Date.now(), sonido: false }))); await p.reload();
  await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages, null, { timeout: 30000 });
  const ejs = await p.evaluate(() => { const out = []; for (const n of window.DATOS.curso.niveles.slice(1, 2)) for (const m of n.modulos) for (const l of window.DATOS.modulos[m.id].lecciones) for (const e of l.bloques) if (e.tipo === 'ejercicio' && e.modo === 'formula') out.push({ l: l.id, id: e.id, obj: e.objetivo }); return out; });
  let celdaOk = 0, celdaMal = []; let barraOk = 0, barraMal = [];
  for (const e of ejs) {
    await p.evaluate((l) => { location.hash = '#inicio'; location.hash = '#leccion-' + l; }, e.l); await p.waitForTimeout(250);
    const sec = p.locator('#ej-' + e.id); await sec.scrollIntoViewIfNeeded();
    const inp = sec.locator('.entrada-formula'); await inp.fill('');
    // 1) como en Excel: clic en la celda objetivo y teclear
    await sec.locator('td.objetivo').first().click(); await p.keyboard.type('=1+1');
    const v1 = await inp.inputValue(); if (v1 === '=1+1') celdaOk++; else celdaMal.push(`${e.id} (${e.obj}) → «${v1}»`);
    // 2) clic en la barra de fórmulas y teclear
    await inp.fill(''); await inp.click(); await p.keyboard.type('=2+2');
    const v2 = await inp.inputValue(); if (v2 === '=2+2') barraOk++; else barraMal.push(`${e.id} → «${v2}»`);
  }
  console.log(`ejercicios de fórmula del nivel 1: ${ejs.length}`);
  console.log(`clic en la celda + teclear: ${celdaOk} bien, ${celdaMal.length} mal`, celdaMal.slice(0, 6));
  console.log(`clic en la barra + teclear: ${barraOk} bien, ${barraMal.length} mal`, barraMal.slice(0, 6));
  console.log('errores:', err); await b.close(); })();
