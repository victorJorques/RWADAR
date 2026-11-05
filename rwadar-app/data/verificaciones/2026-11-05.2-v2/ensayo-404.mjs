// Uso (en la copia del ensayo o, después de aplicar, en la carpeta de trabajo con el historial completo):
//   node rwadar-app/data/verificaciones/2026-11-05.2-v2/ensayo-404.mjs <raíz del repositorio>
// Ensayo: la misma lista de fichas e ilustraciones retiradas que calcula .github/comprobar-publicado.mjs
// (historial de Git de la copia), contra el worker compilado con la lista cerrada de la copia.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const RAIZ = process.argv[2];
const require = createRequire(path.join(RAIZ, 'x.js'));
const paginasFichas = require(path.join(RAIZ, 'rwadar-fichas-manifiesto.js'));
const { construirWorker } = require(path.join(RAIZ, 'rwadar-acceso/compilar.cjs'));
const retiradas = [...new Set(execFileSync('git', ['log', '--diff-filter=D', '--name-only', '--format=', '--',
  'rwadar-site/ofertas/*.html', 'rwadar-site/plataformas/*.html', 'rwadar-site/fuera-del-radar/*.html'], { cwd: RAIZ, encoding: 'utf8' })
  .split('\n').map(l => l.trim().replace(/^rwadar-site\//, '')).filter(Boolean))].filter(f => !paginasFichas.includes(f)).sort();
const vivas = new Set();
for (const dir of ['rwadar-movil/assets/ofertas-editoriales', 'rwadar-editorial-source/ofertas/precargas']) {
  const d = path.join(RAIZ, dir); if (fs.existsSync(d)) for (const e of fs.readdirSync(d, { recursive: true })) vivas.add(path.basename(String(e)));
}
const imagenes = [...new Set(execFileSync('git', ['log', '--diff-filter=D', '--name-only', '--format=', '--',
  'rwadar-movil/assets/ofertas-editoriales/oferta-*.webp'], { cwd: RAIZ, encoding: 'utf8' })
  .split('\n').map(l => path.basename(l.trim())).filter(Boolean))].filter(n => !vivas.has(n)).sort();
const worker = (await import('data:text/javascript;base64,' + Buffer.from(construirWorker(path.join(RAIZ, 'rwadar-acceso'))).toString('base64'))).default;
const PAGINA_404 = '<title>Fuera de cobertura · RWAdar</title>';
const res = { fichas: [], imagenes: [] };
for (const ficha of retiradas) {
  const ruta = '/' + ficha.replace(/\.html$/, '');
  const pedidas = [];
  // Pages con su copia de conservación: el worker no debe pedirla.
  const env = { ASSETS: { fetch: async r => { const p = new URL(r.url ?? r).pathname; pedidas.push(p);
    return p === '/404' ? new Response(PAGINA_404) : new Response('copia', { headers: { 'CF-Cache-Status': 'HIT' } }); } } };
  const r = await worker.fetch(new Request('https://rwadar.pages.dev' + ruta), env, { waitUntil() {} });
  const delWorker = r.status === 404 && r.headers.get('x-robots-tag') === 'noindex, nofollow' && r.headers.get('cache-control') === 'no-store';
  // Como en comprobar-publicado.mjs: una plataforma que cambió de carpeta redirige (301) a la publicada.
  const [carpeta, archivo] = ficha.split('/');
  const otra = { plataformas: 'fuera-del-radar', 'fuera-del-radar': 'plataformas' }[carpeta];
  const destino = otra && paginasFichas.includes(`${otra}/${archivo}`) ? `/${otra}/${archivo.replace(/\.html$/, '')}` : null;
  const correcta = destino ? r.status === 301 && r.headers.get('location') === destino && r.headers.get('cache-control') === 'no-store' : delWorker;
  res.fichas.push({ ruta, estado: r.status, delWorker, trasladadaA: destino, correcta, pedidas });
}
for (const nombre of imagenes) {
  const estados = [];
  for (const cab of [{ 'CF-Cache-Status': 'HIT', 'X-Robots-Tag': 'noindex' }, null]) {
    const env = { ASSETS: { fetch: async r => { const p = new URL(r.url ?? r).pathname;
      return p === '/404' ? new Response(PAGINA_404) : cab ? new Response('copia', { headers: cab }) : new Response('no', { status: 404 }); } } };
    for (const h of [{}, { 'If-None-Match': '"rwadar-comprobacion"' }])
      estados.push((await worker.fetch(new Request('https://rwadar.pages.dev/ofertas-editoriales/' + nombre, { method: 'HEAD', headers: h }), env, { waitUntil() {} })).status);
  }
  res.imagenes.push({ nombre, estados });
}
console.log(JSON.stringify(res));
const nuevas = ['/ofertas/casa-de-outeiro', '/ofertas/terreno-con-arrendamiento-billa'];
if (!nuevas.every(r => res.fichas.some(f => f.ruta === r && f.delWorker && f.pedidas.join() === '/404'))) process.exit(1);
if (!['oferta-casa-de-outeiro.webp', 'oferta-terreno-con-arrendamiento-billa.webp'].every(n => res.imagenes.some(i => i.nombre === n && i.estados.every(e => e === 404)))) process.exit(1);
if (!res.fichas.every(f => f.correcta) || !res.imagenes.every(i => i.estados.every(e => e === 404))) process.exit(1);
console.error(`OK: ${res.fichas.length} fichas retiradas o trasladadas como exige comprobar-publicado.mjs (las dos de hoy, con el 404 del worker) y ${res.imagenes.length} ilustraciones retiradas con 404`);
