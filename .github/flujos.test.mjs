// Pruebas sin red de reglas comunes a los flujos de GitHub:
// - todo flujo que se conecta a Supabase exige TLS (PGSSLMODE=require);
// - la detección de «solo documentación» de ci.yml (.github/cambios-ci.sh),
//   en repositorios git de usar y tirar;
// - que las pruebas escriban entera la ruta de cada documento que leen (si
//   no, cambios-ci.sh no las vería y un PR de documentación se saltaría
//   pruebas que sí lo leen);
// - que el ensayo de restauración no confunda un fallo de gh con «no hay copias».
// Uso: node --test .github/flujos.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const FLUJOS = path.join(raiz, '.github/workflows');
const leer = relativa => fs.readFileSync(path.join(raiz, relativa), 'utf8');
const sinComentarios = texto => texto.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

/* ---------- TLS en las conexiones a Supabase ---------- */
test('todo flujo que usa SUPABASE_DB_URL exige TLS con PGSSLMODE=require para todo el trabajo', () => {
  const conBase = fs.readdirSync(FLUJOS).filter(n => /\.ya?ml$/.test(n))
    .filter(n => /secrets\.SUPABASE_DB_URL/.test(fs.readFileSync(path.join(FLUJOS, n), 'utf8'))).sort();
  assert.deepEqual(conBase, ['aplicar-catalogo.yml', 'avisar-novedad.yml', 'avisos-base.yml', 'copia-seguridad.yml',
    'correo-lettermint.yml', 'vigilante.yml'], 'si se añade un flujo con la base, que entre en esta regla');
  for (const n of conBase) {
    const flujo = fs.readFileSync(path.join(FLUJOS, n), 'utf8');
    assert.match(flujo, /^env:\n {2}PGSSLMODE: require\n/m, `${n}: env de nivel de flujo con PGSSLMODE: require`);
    assert.equal((sinComentarios(flujo).match(/PGSSLMODE/g) || []).length, 1, `${n}: ningún paso lo cambia`);
    assert.doesNotMatch(sinComentarios(flujo), /sslmode=(disable|allow|prefer)/, `${n}: ningún psql rebaja el TLS`);
  }
  // El ensayo de restauración usa un Postgres local sin TLS y nunca la base de verdad.
  const ensayo = leer('.github/workflows/ensayo-restauracion.yml');
  assert.doesNotMatch(ensayo, /SUPABASE_DB_URL|PGSSLMODE/);
  // Los scripts también lo exigen por su cuenta, por si se lanzan fuera de esos flujos.
  assert.match(leer('rwadar-app/correo-lettermint.sh'), /^export PGSSLMODE="\$\{PGSSLMODE:-require\}"$/m);
  assert.match(leer('rwadar-app/copia-seguridad.sh'), /URL="\$URL\?sslmode=require"/);
  assert.match(leer('.github/vigilante.mjs'), /PGSSLMODE: entorno\.PGSSLMODE \|\| 'require'/);
});

/* ---------- .github/cambios-ci.sh ---------- */
const SCRIPT_CAMBIOS = path.join(raiz, '.github/cambios-ci.sh');
function repoDePrueba() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-cambios-ci-'));
  const git = (...a) => execFileSync('git', ['-c', 'user.name=Prueba', '-c', 'user.email=prueba@ejemplo.test',
    '-c', 'commit.gpgsign=false', '-c', 'init.defaultBranch=main', ...a], { cwd: dir, encoding: 'utf8' });
  const escribir = (archivo, texto) => {
    fs.mkdirSync(path.dirname(path.join(dir, archivo)), { recursive: true });
    fs.writeFileSync(path.join(dir, archivo), texto);
  };
  git('init', '-q');
  // Lo mínimo de RWAdar: pruebas que leen documentos con la ruta entera, la compuerta y su estado.
  // Nombres inventados a propósito: este archivo también es un *.test.* en el que
  // busca cambios-ci.sh, y con nombres de documentos reales haría correr la
  // batería en PR que solo cambian esos documentos.
  escribir('probar-web.mjs', "for (const f of ['GUIA-PRUEBA.md', 'docs/prueba/ESTADO-PRUEBA.md']) leer(f);\n");
  escribir('rwadar-app/probar-cobro-seguro.mjs', "leer('docs/prueba/legal/COBRO-PRUEBA.md');\n");
  escribir('rwadar-movil/tests/avisos.test.cjs', "leer('../../docs/prueba/CONTRATO-PRUEBA.md');\n");
  escribir('rwadar-app/data/relanzamiento/estado.json', '{"informe": "docs/prueba/INFORME-PRUEBA.md"}\n');
  escribir('rwadar-publicar.js', '// compuerta\n');
  for (const f of ['GUIA-PRUEBA.md', 'LEEME-PRUEBA.md', 'docs/prueba/ESTADO-PRUEBA.md', 'docs/prueba/legal/COBRO-PRUEBA.md',
    'docs/prueba/CONTRATO-PRUEBA.md', 'docs/prueba/TRASPASO-PRUEBA.md', 'docs/prueba/INFORME-PRUEBA.md', 'docs/prueba/SUELTO-PRUEBA.md',
    'rwadar-academy/lecciones/prueba.md']) escribir(f, '# ' + f + '\n');
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  return {
    dir, git, escribir,
    // Un PR: commit sobre la base; el script compara HEAD^1 con HEAD, como en CI.
    pr(cambios, { borrar = [], mover = [] } = {}) {
      git('checkout', '-q', '--detach', 'main');
      for (const [f, t] of Object.entries(cambios)) escribir(f, t);
      for (const f of borrar) git('rm', '-q', f);
      for (const [de, a] of mover) { fs.mkdirSync(path.dirname(path.join(dir, a)), { recursive: true }); git('mv', de, a); }
      git('add', '-A'); git('commit', '-q', '--allow-empty', '-m', 'pr');
      return this.decidir();
    },
    decidir(entorno = { GITHUB_EVENT_NAME: 'pull_request' }) {
      const salida = path.join(dir, '..', path.basename(dir) + '-salida');
      fs.writeFileSync(salida, '');
      const r = spawnSync('bash', [SCRIPT_CAMBIOS], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: dir, GITHUB_OUTPUT: salida, ...entorno } });
      const out = fs.readFileSync(salida, 'utf8'); fs.rmSync(salida);
      return { codigo: r.status, texto: r.stdout + r.stderr, stdout: r.stdout, salida: out };
    },
  };
}

test('cambios-ci: solo se salta la batería si el PR cambia documentación que ninguna prueba lee', (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const casos = [
    ['un traspaso que no lee ninguna prueba (como PARA-CODEX.md)', { 'docs/prueba/TRASPASO-PRUEBA.md': 'cambio\n' }, false],
    ['un .md de la raíz y un documento suelto', { 'LEEME-PRUEBA.md': 'cambio\n', 'docs/prueba/SUELTO-PRUEBA.md': 'cambio\n' }, false],
    ['un .md de la raíz que lee probar-web (como AGENTS.md)', { 'GUIA-PRUEBA.md': 'cambio\n' }, true],
    ['un documento que lee probar-web (como docs/INTERNO.md)', { 'docs/prueba/ESTADO-PRUEBA.md': 'cambio\n' }, true],
    ['un documento que lee otra prueba', { 'docs/prueba/legal/COBRO-PRUEBA.md': 'cambio\n' }, true],
    ['documento leído con ../../ (como avisos-cuenta.test.cjs)', { 'docs/prueba/CONTRATO-PRUEBA.md': 'cambio\n' }, true],
    ['informe citado en estado.json', { 'docs/prueba/INFORME-PRUEBA.md': 'cambio\n' }, true],
    ['lección .md fuera de docs/', { 'rwadar-academy/lecciones/prueba.md': 'cambio\n' }, true],
    ['un .md nuevo dentro de una carpeta que no es docs/', { 'rwadar-app/NOTAS.md': 'x\n' }, true],
    ['un archivo de la raíz que no es .md', { 'package.json': '{}\n' }, true],
    ['el propio flujo de CI', { '.github/workflows/ci.yml': 'x\n' }, true],
  ];
  for (const [nombre, cambios, esperado] of casos) {
    const r = repo.pr(cambios);
    assert.equal(r.codigo, 0, nombre + ': ' + r.texto);
    assert.equal(r.salida, `pruebas=${esperado}\n`, `${nombre}: ${r.texto}`);
    assert.match(r.stdout, new RegExp(`pruebas=${esperado}\\n$`), nombre);
  }
  // Renombrar un documento a código: con --no-renames salen los dos y corre todo.
  assert.equal(repo.pr({}, { mover: [['docs/prueba/SUELTO-PRUEBA.md', 'rwadar-app/suelto.js']] }).salida, 'pruebas=true\n');
  // Borrar un documento que ninguna prueba lee: se salta.
  assert.equal(repo.pr({}, { borrar: ['docs/prueba/SUELTO-PRUEBA.md'] }).salida, 'pruebas=false\n');
  // PR vacío: nada que probar.
  const vacio = repo.pr({});
  assert.equal(vacio.salida, 'pruebas=false\n');
  assert.match(vacio.texto, /Solo documentación: se salta la batería de pruebas\./);
  // Si la prueba que lo lee está en el propio PR, también cuenta (se busca en la cabeza del PR).
  assert.equal(repo.pr({ 'docs/prueba/SUELTO-PRUEBA.md': 'cambio\n', 'probar-otra.mjs': "leer('docs/prueba/SUELTO-PRUEBA.md');\n" }).salida, 'pruebas=true\n');
});

test('cambios-ci: lanzado a mano, o si no se puede ver qué cambia, se pasa todo', (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  repo.pr({ 'docs/prueba/TRASPASO-PRUEBA.md': 'cambio\n' });
  const aMano = repo.decidir({ GITHUB_EVENT_NAME: 'workflow_dispatch' });
  assert.equal(aMano.salida, 'pruebas=true\n');
  assert.match(aMano.texto, /Lanzado a mano: se pasa todo\./);
  // Un solo commit (sin HEAD^1): no se sabe qué cambia.
  const solo = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-cambios-ci-solo-'));
  t.after(() => fs.rmSync(solo, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: solo });
  fs.writeFileSync(path.join(solo, 'LEEME-PRUEBA.md'), 'x\n');
  execFileSync('git', ['-c', 'user.name=P', '-c', 'user.email=p@ejemplo.test', '-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', 'uno'], { cwd: solo });
  const r = spawnSync('bash', [SCRIPT_CAMBIOS], { cwd: solo, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: solo, GITHUB_EVENT_NAME: 'pull_request' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, 'pruebas=true\n');
  assert.match(r.stderr, /No se pudo ver qué cambia: se pasa todo\./);
});

test('ci.yml usa cambios-ci.sh y la batería entera (con las pruebas de .github/) va en npm test', () => {
  const ci = leer('.github/workflows/ci.yml');
  assert.match(ci, /id: cambios\n {8}shell: bash\n(?: {8}#.*\n)* {8}run: bash \.github\/cambios-ci\.sh\n/);
  assert.match(ci, /fetch-depth: 2/);
  assert.match(ci, /needs\.secretos\.outputs\.pruebas == 'true'/);
  assert.match(ci, /\n {8}run: npm test\n/);
  // Las pruebas de .github/ van dentro de npm test, al final de la batería de rwadar-app
  // (el package.json de la raíz lo vigila el guardián de la OTA: tocarlo pediría otro APK).
  const raizPaquete = JSON.parse(leer('package.json'));
  assert.match(raizPaquete.scripts.test, /^npm run test:db && /);
  assert.equal(raizPaquete.scripts['test:db'], 'npm --prefix rwadar-app test');
  assert.match(JSON.parse(leer('rwadar-app/package.json')).scripts.test, / && node --test \.\.\/\.github\/\*\.test\.mjs$/);
  assert.doesNotMatch(ci, /vigilante\.test\.mjs/, 'sin un paso suelto que dependa de que npm test pase antes');
});

/* ---------- las pruebas escriben entera la ruta de cada documento ---------- */
// Los mismos archivos en los que busca cambios-ci.sh.
const ARCHIVOS_QUE_LEEN = [':(glob)**/probar-*', ':(glob)**/*.test.*', 'rwadar-app/auditar-relanzamiento.mjs',
  'rwadar-app/data/relanzamiento/estado.json', 'rwadar-publicar.js', 'rwadar-publicacion-segura.js'];
export function rutasDeDocumentosArmadas(texto, { documentos, carpetas, rastreados }) {
  const problemas = [];
  const sinPuntos = v => v.replace(/^(?:\.{1,2}\/)+/, '');
  for (const m of texto.matchAll(/(['"`])((?:(?!\1)[^\\\n])*)\1/g)) {
    const valor = m[2], limpio = sinPuntos(valor).replace(/\/$/, '');
    if (/^docs$/.test(limpio)) problemas.push(`«${valor}»: la carpeta docs/ por piezas (path.join(…, 'docs', …))`);
    else if (carpetas.has(limpio)) problemas.push(`«${valor}»: una carpeta de documentos entera (se leería cualquiera)`);
    else if (/\$\{/.test(valor) && /(?:^|\/)docs\//.test(valor)) {
      // Con trozos variables dentro de una carpeta de documentos que existe
      // (docs/evidencias/${id}.md, que no existe, es un nombre de ejemplo).
      const carpeta = sinPuntos(valor.slice(0, valor.indexOf('${'))).replace(/\/[^/]*$/, '');
      if (carpeta === 'docs' || carpetas.has(carpeta)) problemas.push(`«${valor}»: ruta de documento con trozos variables`);
    }
    else if (/\.md$/.test(valor) && !/\$\{/.test(valor) && !rastreados.has(limpio) && documentos.has(limpio.split('/').pop())) {
      problemas.push(`«${valor}»: nombre de un documento sin su ruta entera`);
    }
  }
  if (/['"`]docs\/['"`]\s*\+/.test(texto)) problemas.push('«docs/» + …: ruta armada sumando trozos');
  return problemas;
}

test('las pruebas escriben entera la ruta de cada documento que leen (si no, cambios-ci.sh no lo vería)', () => {
  const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
  const rastreados = new Set(git('ls-files', '-co', '--exclude-standard').filter(f => !f.includes('node_modules/')));
  const docs = [...rastreados].filter(f => f.startsWith('docs/') || (!f.includes('/') && f.endsWith('.md')));
  const contexto = {
    rastreados,
    documentos: new Set(docs.filter(f => f.endsWith('.md')).map(f => f.split('/').pop())),
    carpetas: new Set(docs.flatMap(f => f.split('/').slice(0, -1).map((_, i, p) => p.slice(0, i + 1).join('/'))).filter(c => c !== 'docs')),
  };
  // El detector caza las formas peligrosas…
  for (const malo of ["path.join(raiz, 'docs', 'RUNBOOK.md')", "fs.readdirSync('docs/legal')", 'leer(`docs/${nombre}`)',
    "leer('RUNBOOK.md')", "leer('docs/' + nombre)", "path.resolve('../docs/tareas/', n)", "f.startsWith('docs/')"]) {
    assert.ok(rutasDeDocumentosArmadas(malo, contexto).length > 0, `no caza: ${malo}`);
  }
  // …y deja pasar las rutas enteras.
  for (const bueno of ["leer('docs/prueba/ESTADO-PRUEBA.md')", "['GUIA-PRUEBA.md', 'LEEME-PRUEBA.md']",
    "leer('../../docs/prueba/CONTRATO-PRUEBA.md')", "leer('rwadar-movil/LEEME.md')"]) {
    assert.deepEqual(rutasDeDocumentosArmadas(bueno, contexto), [], `caza de más: ${bueno}`);
  }
  // Este archivo no: sus ejemplos de rutas malas no leen nada.
  const archivos = git('ls-files', '-co', '--exclude-standard', '--', ...ARCHIVOS_QUE_LEEN)
    .filter(f => !f.includes('node_modules/') && f !== '.github/flujos.test.mjs' && fs.existsSync(path.join(raiz, f)));
  assert.ok(archivos.length > 50, `solo ${archivos.length} archivos de pruebas`);
  const problemas = archivos.flatMap(f => rutasDeDocumentosArmadas(fs.readFileSync(path.join(raiz, f), 'utf8'), contexto).map(p => `${f}: ${p}`));
  assert.deepEqual(problemas, [], 'Escribe entera la ruta (p. ej. \'docs/RUNBOOK.md\'):\n' + problemas.join('\n'));
});

/* ---------- ensayo de restauración ---------- */
test('ensayo-restauracion.yml: un fallo de gh al listar las copias no se confunde con «no hay copias»', () => {
  const flujo = leer('.github/workflows/ensayo-restauracion.yml');
  const inicio = flujo.indexOf('- name: Descargar la última copia correcta');
  const bloque = flujo.slice(flujo.indexOf('run: |', inicio) + 7, flujo.indexOf('\n      - name:', inicio + 10))
    .split('\n').map(l => l.replace(/^ {10}/, '')).join('\n');
  assert.doesNotMatch(bloque.replace(/^\s*#.*$/gm, ''), /< <\(/, 'nada de sustitución de procesos: set -e no ve sus fallos');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-ensayo-gh-'));
  try {
    fs.mkdirSync(path.join(dir, 'bin'));
    fs.writeFileSync(path.join(dir, 'paso.sh'), bloque);
    fs.writeFileSync(path.join(dir, 'bin', 'gh'), [
      '#!/bin/bash',
      'case "$MODO:$1 $2" in',
      '  falla:"run list") echo "HTTP 403: Resource not accessible by integration" >&2; exit 1;;',
      '  vacia:"run list") exit 0;;',
      '  *:"run list") printf \'111\\t2026-11-07T02:43:00Z\\n\';;',
      '  *:"api repos/o/r/actions/runs/111/artifacts") echo copia-rwadar-5;;',
      '  *:"run download") mkdir -p "$9"; echo x > "$9/rwadar-20261107-0243.dump.gpg";;',
      '  *) echo "gh inesperado: $*" >&2; exit 9;;',
      'esac', ''].join('\n'), { mode: 0o755 });
    const correr = modo => {
      const env = { PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`, MODO: modo, GITHUB_REPOSITORY: 'o/r',
        RUNNER_TEMP: path.join(dir, 'tmp-' + modo), GITHUB_ENV: path.join(dir, 'env-' + modo), GITHUB_STEP_SUMMARY: path.join(dir, 'resumen-' + modo) };
      const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', path.join(dir, 'paso.sh')], { env, encoding: 'utf8' });
      return { codigo: r.status, texto: r.stdout + r.stderr, entorno: fs.existsSync(env.GITHUB_ENV) ? fs.readFileSync(env.GITHUB_ENV, 'utf8') : '' };
    };
    const falla = correr('falla');
    assert.notEqual(falla.codigo, 0);
    assert.match(falla.texto, /No se han podido leer las ejecuciones de «Copia de seguridad»/);
    assert.doesNotMatch(falla.texto, /No hay ninguna copia correcta/);
    const vacia = correr('vacia');
    assert.notEqual(vacia.codigo, 0);
    assert.match(vacia.texto, /No hay ninguna copia correcta sin caducar/);
    assert.doesNotMatch(vacia.texto, /gh inesperado/, 'con la lista vacía no llama a gh con un id vacío');
    const buena = correr('buena');
    assert.equal(buena.codigo, 0, buena.texto);
    assert.match(buena.texto, /Copia elegida: copia-rwadar-5 \(ejecución del 2026-11-07 02:43:00 UTC\)\./);
    assert.match(buena.entorno, /^CARPETA_COPIA=.*tmp-buena\/copia$/m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
