/* Robot de QA: juega cada lección (y examen de nivel) contestando bien con los datos del contenido.
   Uso: node robot.cjs dist/hoja-a-hoja.html [idLeccion,...]   → informe de fallos */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const archivo = process.argv[2]; const solo = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const cuerpo = fs.readFileSync(archivo, 'utf8');
  const tmp = path.join(path.dirname(archivo), '_robot.html');
  fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${cuerpo}</body></html>`);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errores = []; p.on('pageerror', (e) => errores.push('PAGEERROR ' + e.message));
  await p.goto('file://' + path.resolve(tmp));
  await p.evaluate(() => { localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify({ v: 1, bienvenida: '2026-11-19', actualizado: 1, sonido: false })); });
  await p.reload(); await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages && window.HyperFormula.languages.esES, null, { timeout: 30000 });
  const D = await p.evaluate(() => ({ lec: Object.values(window.DATOS.modulos).flatMap((m) => m.lecciones.map((l) => l.id)), ex: Object.keys(window.DATOS.examenes_nivel || {}) }));
  const ejDe = async (id) => p.evaluate((id) => { for (const m of Object.values(window.DATOS.modulos)) { for (const e of m.repaso_inicial || []) if (e.id === id) return e; for (const l of m.lecciones) for (const e of [...l.bloques, ...(l.recuerda || [])]) if (e.id === id) return e; } for (const x of Object.values(window.DATOS.examenes_nivel || {})) for (const e of x.preguntas) if (id.startsWith('ex-') && id.endsWith(e.id)) return e; return null; }, id);
  async function resolver(ejId, informe) {
    const sec = p.locator('.pantalla-jugar section.ejercicio').first();
    const e = await ejDe(ejId.replace(/^ej-/, '')); if (!e) { informe.push(`${ejId}: no encuentro el ejercicio en DATOS`); return; }
    try {
      if (e.modo === 'formula') { const inp = sec.locator('.entrada-formula'); await inp.fill(e.solucion); await inp.press('Enter'); }
      else if (e.modo === 'test') { const ops = sec.locator('.opcion'); const n = await ops.count(); for (let k = 0; k < n; k++) if (e.opciones[k].correcta) await ops.nth(k).click(); if (e.multiple) await sec.locator('button.primario').click(); }
      else if (e.modo === 'predice') { await sec.locator('input.entrada-corta').fill(String(e.respuesta)); await sec.locator('button.primario').click(); }
      else if (e.modo === 'respuesta_corta') { await sec.locator('input.entrada-corta').fill(e.aceptadas[0]); await sec.locator('button.primario').click(); }
      else if (e.modo === 'cinta') { await sec.locator('.cinta-pestanas button', { hasText: new RegExp('^' + e.ruta[0].replace(/[()]/g, '.') + '$') }).click(); await sec.locator('.cinta-grupo').filter({ has: p.locator('.nombre-grupo', { hasText: new RegExp('^' + e.ruta[1].replace(/[()+]/g, '.') + '$') }) }).locator('button', { hasText: new RegExp('^' + e.ruta[2].replace(/[()+/]/g, '.') + '$') }).first().click(); }
      else if (e.modo === 'senala') { await sec.locator(`[data-zona="${e.zona}"]`).first().click(); }
      else if (e.modo === 'ordenar') {
        for (let pase = 0; pase < 12; pase++) { const textos = await sec.locator('.lista-ordenar li span:nth-child(2)').allInnerTexts(); const objetivo = await p.evaluate((pp) => pp.map((x) => { const d = document.createElement('div'); d.innerHTML = x; return d.textContent; }), e.pasos.map((x) => x.replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/\*\*|`/g, '')));
          const k = textos.findIndex((t, i) => t.replace(/\s+/g, ' ').trim() !== objetivo[i].replace(/\s+/g, ' ').trim()); if (k < 0) break; const j = textos.findIndex((t) => t.replace(/\s+/g, ' ').trim() === objetivo[k].replace(/\s+/g, ' ').trim()); if (j < 0) { informe.push(`${e.id}: no encuentro el paso «${objetivo[k].slice(0, 40)}»`); break; }
          for (let m = j; m > k; m--) { await sec.locator('.lista-ordenar li').nth(m).locator('button[aria-label="Subir"]').click(); } }
        await sec.locator('button.primario').click(); }
      else if (e.modo === 'abierta') { await sec.locator('textarea').fill('Respuesta de prueba del robot con varias ideas.'); await sec.locator('button', { hasText: 'Ver respuesta modelo' }).click(); }
      else if (e.modo === 'excel') { const s = p.locator('.barra-continuar button', { hasText: 'Hacerlo luego' }); if (await s.count()) { await s.click(); return 'saltado'; } }
      await p.waitForTimeout(120);
      const msj = await p.locator('.barra-continuar .msj-barra').innerText();
      const clase = await p.locator('.barra-continuar').getAttribute('class');
      if (!['abierta', 'excel'].includes(e.modo) && !/bien/.test(clase)) { const fb = await sec.locator('.respuesta').allInnerTexts().catch(() => []); informe.push(`${e.id} (${e.modo}): NO se da por buena la respuesta correcta → «${msj}» ${fb.join(' | ').slice(0, 220)}`); }
    } catch (err) { informe.push(`${e.id} (${e.modo}): ${err.message.split('\n')[0].slice(0, 200)}`); }
  }
  const informe = []; let jugadas = 0;
  for (const id of (process.env.SOLO_EXAMENES ? [] : (solo || D.lec))) {
    await p.evaluate((h) => { location.hash = '#inicio'; location.hash = h; }, '#jugar-' + id); await p.waitForTimeout(250);
    const btn = p.locator('.barra-continuar button.primario');
    for (let k = 0; k < 80; k++) {
      if (await p.locator('.resultado').count()) break;
      const ej = p.locator('.pantalla-jugar section.ejercicio');
      if (await ej.count()) { const r = await resolver(await ej.first().getAttribute('id'), informe); if (r === 'saltado') continue; }
      if (await btn.isDisabled()) { informe.push(`${id}: bloqueada en la pantalla ${k}`); break; }
      await btn.click(); await p.waitForTimeout(80);
    }
    const est = await p.locator('.estrellas-grandes').getAttribute('aria-label').catch(() => 'sin resultado');
    if (!/3 de 3/.test(est || '')) informe.push(`${id}: terminó con ${est}`);
    jugadas++;
  }
  for (const n of (process.env.SOLO_EXAMENES ? process.env.SOLO_EXAMENES.split(',') : (solo ? [] : D.ex))) {
    await p.evaluate((h) => { location.hash = '#inicio'; location.hash = h; }, '#examen-' + n); await p.waitForTimeout(300);
    await p.locator('button', { hasText: /Empezar el examen|Repetir el examen/ }).click(); await p.waitForTimeout(200);
    for (let k = 0; k < 40; k++) {
      if (await p.locator('.resultado').count()) break;
      const ej = p.locator('.pantalla-jugar section.ejercicio'); if (await ej.count()) await resolver(await ej.first().getAttribute('id'), informe);
      const btn = p.locator('.barra-continuar button.primario'); if (await btn.isDisabled()) { informe.push(`examen ${n}: bloqueado en ${k}`); break; } await btn.click(); await p.waitForTimeout(80);
    }
    informe.push(`examen ${n}: ${await p.locator('.resultado h1').innerText().catch(() => '—')}`);
  }
  console.log(`Lecciones jugadas: ${jugadas}\n` + [...informe, ...errores].join('\n'));
  await b.close();
})();
