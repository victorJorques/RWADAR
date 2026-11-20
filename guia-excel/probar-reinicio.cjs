const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 820 } }); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForTimeout(700);
  // progreso de alguien que pulsó «Saltar» en la bienvenida y avanzó
  await p.evaluate(() => localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify({ v: 1, bienvenida: '2026-11-18', nombre: 'saltar', xp: 340, lecciones: { n0m1l1: { estado: 'hecha', t: 1 } }, ej: { 'n0m1l1-e1': { ok: true, n: 1 } }, actualizado: Date.now() - 5000 })));
  await p.reload(); await p.waitForTimeout(600);
  const antes = await p.evaluate(() => ({ vista: document.querySelector('h1')?.textContent, xp: document.querySelector('#hud-xp b')?.textContent }));
  await p.evaluate(() => { location.hash = '#perfil'; }); await p.waitForTimeout(400);
  await p.click('#empezar-de-cero'); await p.waitForTimeout(200);
  const aviso = await p.locator('[role=alertdialog]').innerText();
  await p.click('#borrar-todo'); await p.waitForTimeout(600);
  const despues = await p.evaluate(() => ({ hash: location.hash, vista: document.querySelector('h1')?.textContent, xp: document.querySelector('#hud-xp b')?.textContent, guardado: JSON.parse(localStorage.getItem('hoja-a-hoja-progreso-v1')) }));
  // nombre obligatorio: con una letra no deja seguir
  await p.fill('#bienvenida-nombre', 'L'); const conUna = await p.locator('.barra-continuar button').isDisabled();
  await p.fill('#bienvenida-nombre', 'Laura'); const conNombre = await p.locator('.barra-continuar button').isDisabled();
  const saltar = await p.locator('button', { hasText: 'Saltar' }).count();
  // una copia antigua del progreso no vuelve a colarse al recargar
  await p.reload(); await p.waitForTimeout(600); const trasRecargar = await p.evaluate(() => document.querySelector('h1')?.textContent);
  console.log(JSON.stringify({ antes, aviso: aviso.replace(/\s+/g, ' '), despues: { hash: despues.hash, vista: despues.vista, xp: despues.xp, lecciones: Object.keys(despues.guardado.lecciones).length, nombre: despues.guardado.nombre, reinicio: !!despues.guardado.reinicio }, botonConUnaLetraDesactivado: conUna, botonConNombreDesactivado: conNombre, botonesSaltar: saltar, trasRecargar, errores: err }, null, 1));
  await b.close(); })();
