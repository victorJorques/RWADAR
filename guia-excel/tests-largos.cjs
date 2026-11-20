// Test de una respuesta cuya correcta mide más de 1,3 veces la incorrecta más larga (se adivina por la longitud).
const fs = require('fs'); const path = require('path'); const EX = process.argv[2] || __dirname;
const quitar = (t) => String(t || '').replace(/[*`_]/g, '');
const out = {};
function revisa(e, archivo) {
  if (!e || e.modo !== 'test' || e.multiple || !Array.isArray(e.opciones)) return;
  const c = e.opciones.filter((o) => o.correcta); const d = e.opciones.filter((o) => !o.correcta);
  if (c.length !== 1 || !d.length) return;
  const lc = quitar(c[0].texto).length; const ld = Math.max(...d.map((o) => quitar(o.texto).length));
  if (lc > 1.3 * ld) (out[archivo] = out[archivo] || []).push(`${e.id} (${lc} frente a ${ld})`);
}
const recorre = (x, archivo) => { if (Array.isArray(x)) x.forEach((y) => recorre(y, archivo)); else if (x && typeof x === 'object') { if (x.modo === 'test') revisa(x, archivo); for (const v of Object.values(x)) if (v && typeof v === 'object') recorre(v, archivo); } };
for (const dir of ['contenido', 'proyectos']) for (const f of fs.readdirSync(path.join(EX, dir)).filter((f) => f.endsWith('.json'))) recorre(JSON.parse(fs.readFileSync(path.join(EX, dir, f), 'utf8')), dir + '/' + f);
const total = Object.values(out).reduce((a, l) => a + l.length, 0);
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('test que se delatan por la longitud:', total); for (const [f, l] of Object.entries(out)) console.log(f, l.length);
