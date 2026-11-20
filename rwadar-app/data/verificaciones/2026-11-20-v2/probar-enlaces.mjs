// Prueba cada URL de las fichas (escaparate + documentación): GET normal, sigue redirecciones, 20 s.
import fs from 'node:fs';
const [esc, doc, salida] = process.argv.slice(2);
const urls = new Map();
const recoger = (v, slug, donde) => {
  if (typeof v === 'string' && /^https?:\/\//.test(v)) { if (!urls.has(v)) urls.set(v, new Set()); urls.get(v).add(`${slug}·${donde}`); }
  else if (Array.isArray(v)) v.forEach((x, i) => recoger(x, slug, donde));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) recoger(x, slug, k);
};
const E = JSON.parse(fs.readFileSync(esc, 'utf8')), D = JSON.parse(fs.readFileSync(doc, 'utf8'));
const ofertas = Array.isArray(E) ? E : (E.ofertas || []);
for (const o of ofertas) recoger(o, o.slug, 'escaparate');
const docs = Array.isArray(D) ? D : (D.ofertas || Object.entries(D).map(([slug, v]) => ({ slug, ...v })));
for (const d of docs) recoger(d, d.slug, 'documentacion');
const lista = [...urls.keys()];
const res = [];
const una = async u => {
  const t0 = Date.now();
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (RWAdar comprobador de enlaces)' } });
    const b = await r.arrayBuffer();
    return { url: u, estado: r.status, bytes: b.byteLength, final: r.url, ms: Date.now() - t0, cf: r.headers.get('cf-mitigated') || '' };
  } catch (e) { return { url: u, estado: 0, error: String(e.cause?.code || e.name || e), ms: Date.now() - t0 }; }
};
const hosts = new Map();
for (const u of lista) { const h = new URL(u).host; if (!hosts.has(h)) hosts.set(h, []); hosts.get(h).push(u); }
await Promise.all([...hosts.values()].map(async us => { for (const u of us) { res.push(await una(u)); await new Promise(r => setTimeout(r, 400)); } }));
for (const r of res) r.usadoEn = [...urls.get(r.url)].slice(0, 6);
fs.writeFileSync(salida, JSON.stringify(res, null, 1));
const malos = res.filter(r => !(r.estado >= 200 && r.estado < 400));
console.log(`${res.length} URL; bien ${res.length - malos.length}; con problema ${malos.length}`);
for (const r of malos.sort((a, b) => a.estado - b.estado)) console.log(`  ${r.estado}${r.cf ? ' (' + r.cf + ')' : ''}${r.error ? ' ' + r.error : ''}  ${r.url}  ← ${r.usadoEn.join(', ')}`);
