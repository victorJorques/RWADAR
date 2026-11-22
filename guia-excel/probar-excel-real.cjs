const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const EX = process.argv[2] || __dirname; const env = path.join(EX, 'dist/_v9.html');
fs.writeFileSync(env, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${fs.readFileSync(path.join(EX, 'dist/hoja-a-hoja.html'), 'utf8')}</body></html>`);
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 } }); const p = await ctx.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await ctx.addInitScript(() => { window.__descargas = []; const caps = { downloads: { save: async (o) => { const ab = o.data instanceof Blob ? await o.data.arrayBuffer() : o.data; window.__descargas.push({ nombre: o.filename, bytes: Array.from(new Uint8Array(ab)) }); } } }; window.claude = { use: (n) => Promise.resolve(caps[n] || null) }; });
  await p.goto('file://' + env); await p.evaluate(() => localStorage.setItem('hoja-a-hoja-progreso-v1', JSON.stringify({ v: 1, bienvenida: '2026-11-10', nombre: 'L', actualizado: Date.now(), sonido: false }))); await p.reload();
  await p.waitForFunction(() => window.HyperFormula && window.HyperFormula.languages && window.HojaAHoja, null, { timeout: 30000 }); await p.waitForTimeout(400);
  // 1) traducción ida y vuelta de todas las fórmulas del curso (datos y soluciones)
  const ida = await p.evaluate(() => { const T = window.HojaAHoja; let n = 0; const mal = []; const sin = [];
    const norm = (f) => f.replace(/\s+/g, '').toUpperCase();
    for (const m of Object.values(window.DATOS.modulos)) for (const l of m.lecciones) for (const e of [...l.bloques, ...(l.recuerda || [])]) if (e.modo === 'formula') for (const f of [e.solucion, ...Object.values(e.hoja.celdas).filter((v) => typeof v === 'string' && v.startsWith('='))]) {
      n++; const en = T.formulaAIngles(f); if (en === null) { sin.push(f); continue; } const vuelta = T.formulaAEspanol(en); if (norm(vuelta) !== norm(f)) mal.push(`${f}  →  ${en}  →  ${vuelta}`); }
    return { n, mal: mal.slice(0, 8), nMal: mal.length, sin: sin.slice(0, 6), nSin: sin.length }; });
  console.log('traducción:', JSON.stringify(ida, null, 1));
  // 2) escribir como en Excel: clic en la celda, =, clic en B2, *, clic en C2
  await p.evaluate(() => { location.hash = '#leccion-n1m1l1'; }); await p.waitForTimeout(500);
  const S = p.locator('#ej-n1m1l1-e3'); await S.scrollIntoViewIfNeeded();
  const ej = await p.evaluate(() => { for (const m of Object.values(window.DATOS.modulos)) for (const l of m.lecciones) for (const e of l.bloques) if (e.id === 'n1m1l1-e3') return e; });
  console.log('ejercicio:', ej.id, ej.objetivo, 'solución', ej.solucion);
  await S.locator('td.objetivo').click(); await p.keyboard.type('=');
  const refs = (ej.solucion.match(/\$?[A-Z]+\$?\d+/g) || []).map((r) => r.replace(/\$/g, ''));
  // reproducir la solución tecleando operadores y pinchando celdas
  const trozos = ej.solucion.slice(1).split(/(\$?[A-Z]+\$?\d+)/).filter(Boolean);
  for (const t of trozos) { if (/^\$?[A-Z]+\$?\d+$/.test(t)) { const r = t.replace(/\$/g, ''); await S.locator(`td[data-ref="${r}"]`).click(); if (t.includes('$')) { await p.keyboard.press('F4'); } } else await p.keyboard.type(t); }
  const escrito = await S.locator('.entrada-formula').inputValue();
  const enCelda = await S.locator('td.objetivo').innerText();
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  console.log('tecleado con clics:', escrito, '| se ve en la celda:', enCelda, '| corrección:', (await S.locator('.respuesta').first().innerText()).split('\n')[0]);
  // 3) arrastrar un rango en una suma
  await p.evaluate(() => { location.hash = '#hoja'; }); await p.waitForTimeout(400);
  await p.locator('td[data-ref="D2"]').click(); await p.keyboard.type('=SUMA(');
  const a = await p.locator('td[data-ref="B2"]').boundingBox(); const z = await p.locator('td[data-ref="B4"]').boundingBox();
  await p.mouse.move(a.x + 5, a.y + 5); await p.mouse.down(); await p.mouse.move(z.x + 5, z.y + 5, { steps: 6 }); await p.mouse.up();
  console.log('arrastrar B2→B4:', await p.locator('.entrada-formula').inputValue());
  // 4) «Hazlo en tu Excel»: descargar, poner la fórmula como la guarda Excel (en inglés) y subir
  await p.evaluate(() => { location.hash = '#leccion-n1m1l2'; }); await p.waitForTimeout(500);
  const id2 = await p.evaluate(() => { for (const n of window.DATOS.curso.niveles.slice(1, 2)) for (const m of n.modulos) for (const l of window.DATOS.modulos[m.id].lecciones) for (const e of l.bloques) if (e.modo === 'formula' && Object.values(e.hoja.celdas).some((v) => typeof v === 'string' && v.startsWith('='))) return e.id; });
  await p.evaluate((id) => { location.hash = '#leccion-' + id.replace(/-e\d+$/, ''); }, id2); await p.waitForTimeout(500); const sec2 = p.locator('#ej-' + id2); await sec2.scrollIntoViewIfNeeded();
  await sec2.locator('.en-mi-excel button').click(); await p.waitForTimeout(1500);
  const res = await p.evaluate(async (id2) => { let fs0; const d = window.__descargas.pop(); if (!d) return { error: 'sin descarga' }; const X = window.XLSX; const wb = X.read(new Uint8Array(d.bytes), { cellFormula: true }); const ws = wb.Sheets.Ejercicio;
    let ej; for (const m of Object.values(window.DATOS.modulos)) for (const l of m.lecciones) for (const e of l.bloques) if (e.id === id2) ej = e;
    const info = { nombre: d.nombre, hojas: wb.SheetNames, comentario: (ws[ej.objetivo].c || [])[0]?.t, formulas: Object.entries(ws).filter(([k, c]) => c && c.f).map(([k, c]) => k + ': ' + c.f).slice(0, 4), solucionEn: window.HojaAHoja.formulaAIngles(ej.solucion) };
    info.original = d.bytes; ws[ej.objetivo] = { t: 'n', v: 0, f: info.solucionEn }; const out = X.write(wb, { bookType: 'xlsx', type: 'array' }); info.subir = Array.from(new Uint8Array(out)); return info; }, id2);
  const subir = Buffer.from(res.subir || []); delete res.subir; fs.writeFileSync(path.join(EX, '..', 'prueba-original.xlsx'), Buffer.from(res.original || [])); delete res.original; console.log('archivo descargado:', JSON.stringify(res));
  fs.writeFileSync(path.join(EX, '..', 'prueba-descarga.xlsx'), subir);
  await sec2.locator('input[type=file]').setInputFiles({ name: 'mi-ejercicio.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: subir }); await p.waitForTimeout(1200);
  console.log('al subirlo:', (await sec2.locator('.respuesta').first().innerText()).replace(/\s+/g, ' ').slice(0, 120), '|', (await sec2.locator('p.tenue code').innerText().catch(() => '')));
  console.log('errores:', err); await b.close(); })();
