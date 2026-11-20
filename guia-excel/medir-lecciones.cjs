// Medidas por lección: pantallas, palabras de explicación, ejercicios por tipo, ejemplo resuelto, pistas, variantes, etc.
const fs = require('fs'); const path = require('path'); const EX = process.argv[2] || __dirname;
const pal = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
const filas = [];
for (const f of fs.readdirSync(path.join(EX, 'contenido')).filter((f) => /^n\d+m\d+\.json$/.test(f)).sort()) {
  const m = JSON.parse(fs.readFileSync(path.join(EX, 'contenido', f), 'utf8'));
  for (const l of m.lecciones) {
    const ejs = l.bloques.filter((b) => b.tipo === 'ejercicio'); const exp = l.bloques.filter((b) => b.tipo !== 'ejercicio');
    const modos = {}; for (const e of [...ejs, ...(l.recuerda || [])]) modos[e.modo] = (modos[e.modo] || 0) + 1;
    let seguidas = 0, maxSeg = 0; for (const b of l.bloques) { if (b.tipo === 'ejercicio') seguidas = 0; else maxSeg = Math.max(maxSeg, ++seguidas); }
    const primero = l.bloques[0] ? l.bloques[0].tipo + (l.bloques[0].modo ? ':' + l.bloques[0].modo : '') : '';
    const formulas = ejs.filter((e) => e.modo === 'formula');
    filas.push({ id: l.id, titulo: l.titulo, min: l.minutos, bloques_explicacion: exp.length, palabras_explicacion: exp.reduce((a, b) => a + pal(b.md) + (b.pasos || []).reduce((x, p) => x + pal(p.md), 0), 0), max_explicaciones_seguidas: maxSeg, primer_bloque: primero, ejemplo_resuelto: exp.some((b) => b.tipo === 'pasos'), ejercicios: ejs.length, recuerda: (l.recuerda || []).length, modos, formulas: formulas.length, formulas_con_pistas: formulas.filter((e) => (e.pistas || []).length).length, formulas_con_variantes: formulas.filter((e) => (e.variantes || []).length).length, formulas_con_errores_tipicos: formulas.filter((e) => (e.errores_tipicos || []).length).length, tarjetas: (l.tarjetas || []).length, mision: !!l.mision });
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify(filas, null, 0).replace(/},{/g, '},\n{'));
const t = (k) => filas.reduce((a, f) => a + (f[k] || 0), 0);
console.log(`lecciones ${filas.length} · ejercicios ${t('ejercicios')} + recuerda ${t('recuerda')} · fórmulas ${t('formulas')} (con variantes ${t('formulas_con_variantes')}, con errores típicos ${t('formulas_con_errores_tipicos')}) · sin ejemplo resuelto ${filas.filter((f) => !f.ejemplo_resuelto).length} · empiezan con ejercicio ${filas.filter((f) => f.primer_bloque.startsWith('ejercicio')).length} · palabras de explicación media ${Math.round(t('palabras_explicacion') / filas.length)} (máx ${Math.max(...filas.map((f) => f.palabras_explicacion))})`);
const mod = {}; for (const f of filas) for (const [k, v] of Object.entries(f.modos)) mod[k] = (mod[k] || 0) + v; console.log('tipos de ejercicio:', JSON.stringify(mod));
