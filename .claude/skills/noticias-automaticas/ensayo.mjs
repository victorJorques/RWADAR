#!/usr/bin/env node
// =====================================================================
// Ensayo completo EN LOCAL de las mañanas automáticas (sin publicar nada)
// ---------------------------------------------------------------------
//   node .claude/skills/noticias-automaticas/ensayo.mjs [--gitleaks RUTA] [--solo dia1,dia2]
//
// Monta un mundo de mentira y hace pasar por él un día bueno y los malos:
// - «GitHub» = un repositorio git desnudo en una carpeta temporal (origin);
//   el PR = una rama empujada ahí; unir = merge --no-ff; la CI = las
//   comprobaciones deterministas (cambios-ci.sh, validar --publicada y la
//   compuerta sobre la unión) o un resultado fijo («CI falla»);
// - «producción» y «revisión» = el worker de la web en 127.0.0.1
//   (rwadar-acceso/probar-worker-local.mjs) sirviendo una construcción local
//   (rwadar-publicar.js --local --sin-sincronizar);
// - las fuentes = un servidor local con copias fijas; el editor y el
//   verificador = archivos fijos (pruebas/ayuda.mjs).
// El repositorio de verdad no se toca: el ensayo trabaja en un clon
// («git clone --shared», con su propia configuración) y comprueba al final
// que las ramas de GitHub del repositorio de verdad no han cambiado.
// =====================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { enlazarDependencias, leerArgumentos, sha256 } from './lib/comun.mjs';
import { FECHA, BASE, GUIA, edicionBuena, noticiaDeHoy, titularesDe, inventarioDe, verificacionDe, escribir, servidor, copia } from './pruebas/ayuda.mjs';

const require = createRequire(import.meta.url);
const SKILL = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(SKILL, '..', '..', '..');
const PROGRAMA = path.join(SKILL, 'noticias-auto.mjs');
const args = leerArgumentos(process.argv.slice(2));
const SOLO = args.solo ? String(args.solo).split(',') : null;
const E = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-ensayo-noticias-'));
const REPO = path.join(E, 'repo'), ORIGIN = path.join(E, 'origin.git'), PROD = path.join(E, 'produccion'), REV = path.join(E, 'revision');
const ID = ['-c', 'user.name=Ensayo', '-c', 'user.email=ensayo@ejemplo.test', '-c', 'commit.gpgsign=false'];
const g = (...a) => execFileSync('git', [...ID, ...a], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 }).trim();
const gOrigin = (...a) => execFileSync('git', ['--git-dir', ORIGIN, ...a], { encoding: 'utf8' }).trim();
const log = t => process.stdout.write(t + '\n');
const inicio = Date.now();
const seg = () => `${((Date.now() - inicio) / 1000).toFixed(0)} s`;

/* El programa, en otro proceso y sin bloquear: los servidores de ensayo viven en este. */
function na(lista, { trabajo, extra = [] } = {}) {
  return new Promise(resolver => {
    const h = spawn(process.execPath, [PROGRAMA, ...lista, '--raiz', REPO, '--fecha', FECHA, ...(trabajo ? ['--trabajo', trabajo] : []), ...extra], { cwd: REPO });
    let salida = '';
    h.stdout.on('data', d => { salida += d; }); h.stderr.on('data', d => { salida += d; });
    h.on('close', codigo => resolver({ codigo, salida: salida.trim() }));
  });
}
function construir(ref, destino) {
  const dir = path.join(E, `obra-${sha256(ref + destino).slice(0, 8)}`);
  fs.rmSync(dir, { recursive: true, force: true });
  g('worktree', 'add', '--detach', '--force', dir, ref);
  enlazarDependencias(RAIZ, dir);
  const r = spawnSync(process.execPath, ['-r', path.join(SKILL, 'lib', 'reloj.cjs'), 'rwadar-publicar.js', '--local', '--sin-sincronizar'],
    { cwd: dir, encoding: 'utf8', env: { ...process.env, RWADAR_NOTICIAS_RELOJ: RELOJ }, maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`no se pudo construir ${ref}: ${(r.stderr || r.stdout).slice(-500)}`);
  const auditoria = spawnSync(process.execPath, ['rwadar-app/auditar-relanzamiento.mjs'], { cwd: dir, encoding: 'utf8' });
  fs.rmSync(destino, { recursive: true, force: true });
  fs.cpSync(path.join(dir, 'rwadar-publicado'), destino, { recursive: true });
  g('worktree', 'remove', '--force', dir);
  return { publicable: auditoria.status === 0, auditoria: auditoria.stdout.trim().split('\n').slice(-3).join(' | ') };
}

/* ---------------- El mundo ---------------- */
const RELOJ = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
log(`Ensayo en ${E}`);
const ramasAntes = execFileSync('git', ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/remotes'], { cwd: RAIZ, encoding: 'utf8' });
execFileSync('git', ['clone', '-q', '--shared', '--no-checkout', RAIZ, REPO]);
// El repositorio de verdad puede ser superficial (sin toda la historia): el clon lo sabe por su archivo «shallow».
const COMUN = path.resolve(RAIZ, execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: RAIZ, encoding: 'utf8' }).trim());
const SUPERFICIAL = path.join(COMUN, 'shallow');
if (fs.existsSync(SUPERFICIAL)) fs.copyFileSync(SUPERFICIAL, path.join(REPO, '.git', 'shallow'));
g('checkout', '-q', '--detach', execFileSync('git', ['rev-parse', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).trim());
enlazarDependencias(RAIZ, REPO);
// Lo que lleva la rama de trabajo y aún no está en un commit (la skill misma), para ensayar lo de hoy.
for (const rel of execFileSync('git', ['ls-files', '-mo', '--exclude-standard', '--', '.claude/skills/noticias-automaticas', 'rwadar-movil/tests'], { cwd: RAIZ, encoding: 'utf8' }).split('\n').filter(Boolean)) {
  escribir(path.join(REPO, rel), fs.readFileSync(path.join(RAIZ, rel)));
}
// «main publicado»: la guía (la escribe la mejora visual), las noticias fijas del 13/11 y un sello revisado de hoy.
escribir(path.join(REPO, 'rwadar-editorial-source/noticias/GUIA-TITULARES.md'), fs.readFileSync(GUIA));
const bytesBase = Buffer.from(JSON.stringify(BASE, null, 2) + '\n');
fs.writeFileSync(path.join(REPO, 'rwadar-site/datos/noticias-v2.json'), bytesBase);
fs.writeFileSync(path.join(REPO, 'rwadar-site/datos/noticias.json'), require(path.join(REPO, 'rwadar-app/noticias/noticias-v1.cjs')).derivarV1(bytesBase.toString()));
g('add', '-A'); g('commit', '-q', '-m', 'Ensayo: main con la guía y las noticias del 13/11');
function sellarComoPersona(nota) {
  const { huellaContenidoAprobado } = require(path.join(REPO, 'rwadar-publicacion-segura.js'));
  const ruta = path.join(REPO, 'rwadar-app/data/relanzamiento/estado.json');
  const e = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  e.actualizadoEl = new Date().toISOString().slice(0, 10); e.nota = nota;
  e.revisionAprobada.commit = g('rev-parse', 'HEAD'); e.revisionAprobada.contenidoSha256 = huellaContenidoAprobado(REPO);
  fs.writeFileSync(ruta, JSON.stringify(e, null, 2) + '\n');
  g('add', '-A'); g('commit', '-q', '-m', 'Ensayo: sello revisado');
}
sellarComoPersona('Sello revisado del ensayo de las noticias automáticas, sobre el catálogo de main');
const S = g('rev-parse', 'HEAD');
g('update-ref', 'refs/heads/main', S);
execFileSync('git', ['clone', '-q', '--bare', '--shared', REPO, ORIGIN]);
if (fs.existsSync(SUPERFICIAL)) fs.copyFileSync(SUPERFICIAL, path.join(ORIGIN, 'shallow'));
gOrigin('config', 'receive.shallowUpdate', 'true');
for (const r of gOrigin('for-each-ref', '--format=%(refname)', 'refs/heads').split('\n').filter(x => x && x !== 'refs/heads/main')) gOrigin('update-ref', '-d', r);
g('remote', 'set-url', 'origin', ORIGIN);
g('fetch', '-q', '--prune', 'origin');
const REVISION_CATALOGO = (/"revisionId":"([0-9a-f-]{36})"/.exec(fs.readFileSync(path.join(REPO, 'rwadar-site/assets/catalogo-publico-20261022.js'), 'utf8')) || [])[1];
log(`[${seg()}] main de ensayo ${S.slice(0, 7)}; construyendo «producción»…`);
const pS = construir(S, PROD);
if (!pS.publicable) throw new Error(`la compuerta no deja publicar el main de ensayo: ${pS.auditoria}`);
fs.cpSync(PROD, REV, { recursive: true });
const { arrancarWorkerLocal } = await import(path.join(RAIZ, 'rwadar-acceso/probar-worker-local.mjs'));
const prod = await arrancarWorkerLocal({ raiz: PROD, puerto: 0 });
const rev = await arrancarWorkerLocal({ raiz: REV, puerto: 0, vistaPrevia: true });
log(`[${seg()}] producción ${prod.url} · revisión ${rev.url}`);

// Las fuentes del barrido, en local.
const CNMV = `<div class="blocks-single"><span class="fecha-con-hora">13/11/2026</span><span class="time">13:00</span><a href="https://www.cnmv.es/x">Advertencias de entidades no registradas</a></div>`;
const RSS = '<rss><channel><item><title>ESMA publishes guidance on tokenised securities</title><link>https://www.esma.europa.eu/a</link><pubDate>Fri, 13 Nov 2026 09:00:00 +0100</pubDate></item></channel></rss>';
let cnmvCaida = false;
const fuentesSrv = await servidor({ '/cnmv': () => (cnmvCaida ? { estado: 503 } : { cuerpo: CNMV, tipo: 'text/html' }), '/esma': { cuerpo: RSS, tipo: 'application/rss+xml' } });
const FUENTES = path.join(E, 'fuentes-ensayo.json');
escribir(FUENTES, { version: 1, fuentes: [
  { id: 'cnmv-notas', nombre: 'CNMV', url: `${fuentesSrv.url}/cnmv`, lector: 'cnmv-lista', critica: true, todoDelSector: true },
  { id: 'esma-rss', nombre: 'ESMA', url: `${fuentesSrv.url}/esma`, lector: 'rss', critica: true }] });

/* ---------------- Un día ---------------- */
function reiniciar() {
  g('checkout', '-q', '-f', '--detach', S); g('clean', '-q', '-fd');
  gOrigin('update-ref', 'refs/heads/main', S);
  for (const r of gOrigin('for-each-ref', '--format=%(refname)', 'refs/heads').split('\n').filter(x => x && x !== 'refs/heads/main')) gOrigin('update-ref', '-d', r);
  g('fetch', '-q', '--prune', 'origin');
  fs.rmSync(PROD, { recursive: true, force: true }); fs.rmSync(REV, { recursive: true, force: true });
  fs.cpSync(PROD_S, PROD, { recursive: true }); fs.cpSync(PROD_S, REV, { recursive: true });
  cnmvCaida = false;
}
const PROD_S = path.join(E, 'produccion-S');
fs.cpSync(PROD, PROD_S, { recursive: true });

function entradasCerrojo(t, { prs = [], ejecuciones = [], ramas = [], revision = REVISION_CATALOGO } = {}) {
  escribir(path.join(t, 'cerrojo', 'prs.json'), prs);
  escribir(path.join(t, 'cerrojo', 'ejecuciones.json'), ejecuciones);
  escribir(path.join(t, 'cerrojo', 'ramas.json'), ramas);
  escribir(path.join(t, 'cerrojo', 'publicaciones.json'), [{ destino: 'produccion', conclusion: 'success', head_sha: S, created_at: RELOJ, started_at: RELOJ }]);
  escribir(path.join(t, 'cerrojo', 'lectura-publica', 'hora-lectura.txt'), `Lectura de ensayo\nResultado: ${JSON.stringify({ revision: [revision] })}\n`);
}
/* El editor y el verificador del ensayo: archivos fijos. */
function editor(t, edicion) {
  const bytes = Buffer.from(JSON.stringify(edicion, null, 2) + '\n');
  escribir(path.join(t, 'editor', `noticias-${FECHA}.json`), bytes);
  escribir(path.join(t, 'editor', 'titulares.json'), titularesDe(edicion, FECHA));
  return bytes;
}
function notas() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-notas-ensayo-')); escribir(path.join(d, 'EDICION.md'), '# Edición del ensayo\n\nLo que entra y por qué, sin personas.\n'); return d; }
function verificador(t, bytes, edicion, { pase = 1, ...cambios } = {}) {
  const dir = path.join(t, pase === 2 ? 'verificador-2' : 'verificador');
  escribir(path.join(dir, pase === 2 ? 'verificacion-2.json' : 'verificacion.json'), verificacionDe(bytes, edicion, FECHA, pase, cambios));
  escribir(path.join(dir, pase === 2 ? 'VERIFICACION-2.md' : 'VERIFICACION.md'), '# Verificación del ensayo\n\nSin personas.\n');
}

/* La mañana entera, con lo que cada día cambia. Devuelve {estado, paso, motivo}. */
async function manana(nombre, o = {}) {
  reiniciar();
  const t = fs.mkdtempSync(path.join(os.tmpdir(), `rwadar-ensayo-${nombre}-`));
  const frenar = (paso, r) => ({ estado: 'FRENADO', paso, motivo: r.salida.split('\n')[0] });
  await na(['iniciar'], { trabajo: t });
  if (o.antesDelCerrojo) o.antesDelCerrojo(t);
  entradasCerrojo(t, o.cerrojo || {});
  let r = await na(['cerrojo', ...(o.config ? ['--config', o.config] : [])], { trabajo: t, extra: ['--base', prod.url] });
  if (r.codigo === 3) return { estado: 'SIN_HACER_NADA', paso: 'cerrojo', motivo: r.salida.split('\n')[0] };
  if (r.codigo !== 0) return frenar('cerrojo', r);
  if (o.cnmvCaida) cnmvCaida = true;
  r = await na(['barrido', '--fuentes', FUENTES, '--rapido'], { trabajo: t });
  if (r.codigo !== 0) return frenar('barrido', r);
  const edicion = o.edicion ? o.edicion() : edicionBuena();
  const bytes = editor(t, edicion);
  escribir(path.join(t, 'fuentes', 'inventario-fuentes.json'), o.inventario ? o.inventario(edicion) : inventarioDe(edicion)); // comprobar-fuentes, sin red
  r = await na(['validar', '--fase', 'editor'], { trabajo: t });
  if (r.codigo !== 0) return frenar('validador', r);
  verificador(t, bytes, edicion, o.verificacion ? o.verificacion(edicion) : {});
  r = await na(['decidir'], { trabajo: t });
  if (r.codigo === 5) {
    if ((await na(['corregir'], { trabajo: t })).codigo !== 0) return { estado: 'FRENADO', paso: 'corregir' };
    if ((r = await na(['validar', '--fase', 'corregido'], { trabajo: t })).codigo !== 0) return frenar('validador', r);
    const corregida = fs.readFileSync(path.join(t, 'corregido', `noticias-${FECHA}.json`));
    verificador(t, corregida, JSON.parse(corregida), { pase: 2, ...(o.segundoPase || {}) });
    r = await na(['decidir', '--pase', '2'], { trabajo: t });
  }
  if (r.codigo !== 0) return frenar('verificador', r);
  const dirNotas = notas();
  r = await na(['preparar', '--notas', dirNotas], { trabajo: t });
  if (r.codigo === 3) return { estado: 'SIN_CAMBIOS', paso: 'preparar', motivo: r.salida.split('\n')[0] };
  if (r.codigo !== 0) return frenar('preparar', r);
  if (o.pruebas && args.gitleaks) {
    r = await na(['pruebas', '--gitleaks', path.resolve(args.gitleaks)], { trabajo: t });
    if (r.codigo !== 0) return frenar('pruebas', r);
    // Como dice SKILL.md (paso 7.3): si las pruebas tocaron algo versionado fuera de lo permitido, se deja como estaba.
    const permitido = rel => /^rwadar-site\/datos\/noticias(-v2)?\.json$/.test(rel) || rel.startsWith(`rwadar-app/data/noticias-diarias/${FECHA}/`);
    const tocados = g('-c', 'core.quotePath=false', 'status', '--porcelain=v1', '--untracked-files=all').split('\n').filter(Boolean).map(l => l.slice(3)).filter(rel => !permitido(rel));
    if (tocados.length) g('checkout', '-q', '--', ...tocados.filter(rel => g('ls-files', rel)));
  }
  g('add', '-A'); g('commit', '-q', '-m', `Noticias del sector del ${FECHA} (automáticas)`);
  r = await na(['sellar'], { trabajo: t });
  if (r.codigo !== 0) return frenar('sello', r);
  g('add', '-A'); g('commit', '-q', '-m', `Sello: noticias del ${FECHA}`);
  const B = g('rev-parse', 'HEAD');
  r = await na(['comprobar-sello'], { trabajo: t });
  if (r.codigo !== 0) return frenar('sello', r);
  if (o.ensayo) return { estado: 'ENSAYO', paso: 'sello', motivo: 'unión simulada LISTO' };
  // Repaso del cerrojo y «PR».
  r = await na(['cerrojo', '--rapido'], { trabajo: t, extra: ['--base', prod.url] });
  if (r.codigo === 3) return { estado: 'SIN_HACER_NADA', paso: 'repaso', motivo: r.salida.split('\n')[0] };
  g('push', '-q', 'origin', `${B}:refs/heads/claude/noticias-ensayo`);
  // «CI»: la decisión de cambios-ci.sh, validar --publicada y la compuerta sobre la unión.
  let ciBien = true;
  if (o.ciFalla) ciBien = false;
  else {
    const c = spawnSync('bash', ['.github/cambios-ci.sh', S, B], { cwd: REPO, encoding: 'utf8', env: { ...process.env, GITHUB_EVENT_NAME: 'pull_request' } });
    const v = await na(['validar', '--publicada']);
    ciBien = c.status === 0 && v.codigo === 0;
  }
  if (o.mainSeMueve) {
    g('checkout', '-q', '--detach', S); fs.appendFileSync(path.join(REPO, 'docs/INTERNO.md'), '\nOtro trabajo.\n');
    g('commit', '-q', '-am', 'otro trabajo'); g('push', '-q', 'origin', 'HEAD:refs/heads/main'); g('checkout', '-q', '--detach', B);
  }
  g('fetch', '-q', 'origin');
  const mainAhora = gOrigin('rev-parse', 'refs/heads/main');
  escribir(path.join(t, 'pr.json'), { state: 'open', merged: false, base: { ref: 'main', sha: S }, head: { sha: B }, commits: 2 });
  escribir(path.join(t, 'archivos.json'), g('diff', '--name-only', S, B).split('\n'));
  escribir(path.join(t, 'checks.json'), [{ name: 'pruebas', status: 'completed', conclusion: ciBien ? 'success' : 'failure', head_sha: B }]);
  r = await na(['antes-de-unir', '--pr', path.join(t, 'pr.json'), '--archivos', path.join(t, 'archivos.json'), '--checks', path.join(t, 'checks.json'), '--main', mainAhora, '--cabeza', B], { trabajo: t });
  if (r.codigo !== 0) { gOrigin('update-ref', '-d', 'refs/heads/claude/noticias-ensayo'); return frenar(ciBien ? 'unir' : 'CI', r); }
  // Unir con «merge» en el origin.
  g('checkout', '-q', '--detach', mainAhora); g('merge', '-q', '--no-ff', '-m', 'Unión del PR de las noticias', B);
  const M = g('rev-parse', 'HEAD');
  g('push', '-q', 'origin', 'HEAD:refs/heads/main'); gOrigin('update-ref', '-d', 'refs/heads/claude/noticias-ensayo');
  // «Publicar web» revisión: la compuerta y la construcción de M.
  escribir(path.join(t, 'ejecucion-revision.json'), { path: '.github/workflows/publicar.yml', event: 'workflow_dispatch', head_branch: 'main', head_sha: o.ejecucionAjena ? S : M });
  r = await na(['comprobar-ejecucion', '--ejecucion', path.join(t, 'ejecucion-revision.json'), '--union', M], { trabajo: t });
  if (r.codigo !== 0) return { estado: 'UNIDO_SIN_PUBLICAR', paso: 'publicar revisión', motivo: r.salida.split('\n')[0] };
  const pM = construir(M, path.join(E, 'construccion-M'));
  if (!pM.publicable) return { estado: 'UNIDO_SIN_PUBLICAR', paso: 'publicar revisión', motivo: `la compuerta no deja publicar M: ${pM.auditoria}` };
  if (!o.revisionMala) { fs.rmSync(REV, { recursive: true, force: true }); fs.cpSync(path.join(E, 'construccion-M'), REV, { recursive: true }); }
  r = await na(['comprobar-vivo', '--base', rev.url, '--intentos', '2', '--espera', '0'], { trabajo: t });
  if (r.codigo !== 0) return { estado: 'UNIDO_SIN_PUBLICAR', paso: 'revisión en vivo', motivo: r.salida.split('\n')[0] };
  // «Publicar web» producción.
  if (!o.produccionMala) { fs.rmSync(PROD, { recursive: true, force: true }); fs.cpSync(path.join(E, 'construccion-M'), PROD, { recursive: true }); }
  r = await na(['comprobar-vivo', '--base', prod.url, '--intentos', '2', '--espera', '0'], { trabajo: t });
  if (r.codigo !== 0) return { estado: 'PUBLICADO_CON_AVISO', paso: 'producción en vivo', motivo: r.salida.split('\n')[0] };
  const servido = Buffer.from(await (await fetch(`${prod.url}/datos/noticias-v2.json`)).arrayBuffer());
  const enRepo = fs.readFileSync(path.join(REPO, 'rwadar-site/datos/noticias-v2.json'));
  if (!servido.equals(enRepo)) return { estado: 'PUBLICADO_CON_AVISO', paso: 'comprobación final', motivo: 'producción no sirve el JSON nuevo' };
  if (o.capturar && args.capturas) { try { await capturar(prod.url, path.resolve(args.capturas), o.capturar); } catch (e) { log(`Capturas: no se pudieron hacer (${e.message.split('\n')[0]})`); } }
  return { estado: 'PUBLICADO', paso: 'producción', motivo: `${JSON.parse(enRepo).noticias.length} noticias, SHA-256 ${sha256(enRepo).slice(0, 12)}`, trabajo: t };
}

/* Capturas de la «producción» de ensayo (Inicio y /mercado/ a 390 y 1366, escala 2), si hay Playwright. */
async function capturar(base, dir, prefijo) {
  let playwright = null;
  for (const intento of [() => require('playwright'), () => createRequire(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'x.js'))('playwright')]) {
    try { playwright = intento(); break; } catch { /* siguiente */ }
  }
  if (!playwright) { log('Sin Playwright: no hay capturas.'); return; }
  fs.mkdirSync(dir, { recursive: true });
  const navegador = await playwright.chromium.launch();
  try {
    for (const ancho of [390, 1366]) {
      const pagina = await navegador.newPage({ viewport: { width: ancho, height: ancho === 390 ? 844 : 900 }, deviceScaleFactor: 2 });
      for (const [ruta, nombre] of [['/', 'inicio'], ['/mercado/', 'mercado']]) {
        await pagina.goto(base + ruta, { waitUntil: 'load' });
        await pagina.waitForSelector(ruta === '/' ? '[data-noticias="portada"] img' : '[data-noticias="lista"] img', { timeout: 15000 }).catch(() => {});
        await pagina.evaluate(() => { try { localStorage.setItem('rwadar-novedades-vistas', '99'); } catch { /* nada */ } document.querySelectorAll('dialog[open]').forEach(d => d.close()); });
        const bloque = await pagina.$(ruta === '/' ? '[data-noticias="portada"]' : '[data-noticias="lista"]');
        if (bloque) await bloque.scrollIntoViewIfNeeded();
        await pagina.waitForTimeout(600);
        const archivo = path.join(dir, `${prefijo}-${nombre}-${ancho}.png`);
        if (bloque) await bloque.screenshot({ path: archivo }); else await pagina.screenshot({ path: archivo });
        log(`Captura: ${archivo}`);
      }
      await pagina.close();
    }
  } finally { await navegador.close(); }
}

/* ---------------- Los días ---------------- */
const conHoy = () => { const e = edicionBuena(); e.noticias.unshift(noticiaDeHoy()); return e; };
const URL_HOY = noticiaDeHoy().fuente.url;
const DIAS = [
  ['bueno', 'PUBLICADO', { edicion: conHoy, pruebas: true, capturar: 'dia-bueno' }],
  ['ensayo (modo «MODO ENSAYO»)', 'ENSAYO', { ensayo: true }],
  ['verificador rechaza', 'FRENADO:verificador', { verificacion: () => ({ veredicto: 'rechazado' }) }],
  ['con cambios y 2.º pase conforme', 'PUBLICADO', { verificacion: e => ({ veredicto: 'con_cambios', correcciones: [{ id: e.noticias[0].id, campo: 'en.titulo', antes: e.noticias[0].en.titulo, despues: 'Corrected headline for the rehearsal', motivo: 'exagera' }] }) }],
  ['con cambios y 2.º pase no conforme', 'FRENADO:verificador', { verificacion: e => ({ veredicto: 'con_cambios', correcciones: [{ id: e.noticias[0].id, campo: 'resumen', antes: e.noticias[0].resumen, despues: 'Resumen corregido.', motivo: 'm' }] }), segundoPase: { veredicto: 'rechazado' } }],
  ['validador: titular de 75', 'FRENADO:validador', { edicion: () => { const e = conHoy(); e.noticias[0].titulo = 'x'.repeat(75); return e; } }],
  ['validador: foto repetida', 'FRENADO:validador', { edicion: () => { const e = edicionBuena(); e.noticias[1].imagen = e.noticias[0].imagen; return e; } }],
  ['validador: clave nueva', 'FRENADO:validador', { edicion: () => { const e = edicionBuena(); e.noticias[0].destacada = true; return e; } }],
  ['validador: «Hoy» de hace 3 días', 'FRENADO:validador', { edicion: () => { const e = conHoy(); e.noticias[0].fecha = '2026-11-11'; return e; } }],
  ['verificación de otros bytes', 'FRENADO:verificador', { verificacion: () => ({ edicionSha256: '0'.repeat(64) }) }],
  ['CI falla', 'FRENADO:CI', { ciFalla: true }],
  ['main se mueve antes de unir', 'FRENADO:unir', { mainSeMueve: true }],
  ['fuente crítica caída (CNMV 503)', 'FRENADO:barrido', { cnmvCaida: true }],
  ['fuente de una noticia caída (se queda como ayer)', 'PUBLICADO', { edicion: () => { const e = edicionBuena(); e.noticias[0] = copia(BASE.noticias[0]); return e; }, inventario: e => inventarioDe(e, FECHA, u => u !== BASE.noticias[0].fuente.url) }],
  ['fuente de una noticia caída y re-fechada', 'FRENADO:validador', { inventario: e => inventarioDe(e, FECHA, u => u !== BASE.noticias[0].fuente.url) }],
  ['cerrojo: pausa', 'SIN_HACER_NADA', { config: (() => { const c = path.join(E, 'pausa.json'); escribir(c, { ...JSON.parse(fs.readFileSync(path.join(SKILL, 'config.json'), 'utf8')), activo: false }); return c; })() }],
  ['cerrojo: rama del ciclo manual', 'SIN_HACER_NADA', { cerrojo: { ramas: [`claude/cerrojo-ciclo-${FECHA}`] } }],
  ['cerrojo: PR ajeno que toca la web', 'SIN_HACER_NADA', { cerrojo: { prs: [{ number: 200, title: 'Arreglo', files: ['rwadar-site/index.html'] }] } }],
  ['cerrojo: «Aplicar catálogo» corriendo', 'SIN_HACER_NADA', { cerrojo: { ejecuciones: [{ id: 1, name: 'Aplicar catálogo', path: '.github/workflows/aplicar-catalogo.yml', status: 'in_progress' }] } }],
  ['cerrojo: catálogo a medias en Supabase', 'SIN_HACER_NADA', { cerrojo: { revision: '00000000-0000-4000-8000-000000000000' } }],
  ['cerrojo: main con un cambio sellado sin publicar', 'SIN_HACER_NADA', { antesDelCerrojo: () => {
    g('checkout', '-q', '--detach', S); fs.appendFileSync(path.join(REPO, 'rwadar-site/robots.txt'), '\n# cambio sin publicar\n');
    g('commit', '-q', '-am', 'cambio sellado sin publicar'); sellarComoPersona('Sello revisado de un cambio que aún no se ha publicado en el ensayo');
    g('push', '-q', 'origin', 'HEAD:refs/heads/main'); g('fetch', '-q', 'origin'); } }],
  ['cerrojo: ya publicadas hoy', 'SIN_HACER_NADA', { antesDelCerrojo: () => {
    const e = edicionBuena(); fs.writeFileSync(path.join(PROD, 'datos', 'noticias-v2.json'), JSON.stringify(e)); } }],
  ['«Publicar web» publicaría otro commit', 'UNIDO_SIN_PUBLICAR', { ejecucionAjena: true }],
  ['revisión en vivo falla', 'UNIDO_SIN_PUBLICAR', { revisionMala: true }],
  ['producción en vivo falla', 'PUBLICADO_CON_AVISO', { produccionMala: true }],
];

const filas = [];
let mal = 0;
try {
  for (const [nombre, esperado, o] of DIAS) {
    if (SOLO && !SOLO.some(s => nombre.includes(s))) continue;
    let r;
    try { r = await manana(nombre.replace(/[^a-z0-9]+/gi, '-').slice(0, 30), o); }
    catch (e) { r = { estado: 'ERROR', paso: '-', motivo: e.message.split('\n')[0] }; }
    const obtenido = r.estado === 'FRENADO' ? `FRENADO:${r.paso}` : r.estado;
    const ok = obtenido === esperado;
    // Un día que no llega a unir no puede dejar nada en «main».
    const sinUnir = ['FRENADO', 'SIN_HACER_NADA', 'SIN_CAMBIOS', 'ENSAYO'].includes(r.estado) && !o.mainSeMueve && !o.antesDelCerrojo;
    const mainIntacto = !sinUnir || gOrigin('rev-parse', 'refs/heads/main') === S;
    if (!ok || !mainIntacto) mal++;
    filas.push(`${ok && mainIntacto ? 'BIEN' : 'MAL '}  ${nombre.padEnd(48)} → ${obtenido.padEnd(22)} ${r.motivo ? `(${String(r.motivo).slice(0, 110)})` : ''}`);
    log(`[${seg()}] ${filas.at(-1)}`);
  }
} finally {
  await prod.cerrar(); await rev.cerrar(); await fuentesSrv.cerrar();
}
const ramasDespues = execFileSync('git', ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/remotes'], { cwd: RAIZ, encoding: 'utf8' });
const intacto = ramasAntes === ramasDespues;
log('\n=== Resumen del ensayo ===');
filas.forEach(f => log(f));
log(`Ramas del repositorio de verdad: ${intacto ? 'sin cambios' : 'CAMBIARON'} · ningún push fuera del origin de ensayo (${ORIGIN}).`);
log(`${filas.length - mal}/${filas.length} días como se esperaba · ${seg()}`);
if (!args.conservar) fs.rmSync(E, { recursive: true, force: true });
process.exitCode = mal || !intacto ? 1 : 0;
