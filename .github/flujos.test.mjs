// Pruebas sin red de reglas comunes a los flujos de GitHub:
// - todo flujo que se conecta a Supabase exige TLS (PGSSLMODE=require; el
//   psql de claves-comun.mjs, verify-full con la CA de Supabase);
// - la detección de «solo documentación» y de «solo el sello» de ci.yml
//   (.github/cambios-ci.sh), en repositorios git de usar y tirar;
// - ci.yml: la batería repartida en partes a la vez (.github/partes-ci.mjs),
//   el trabajo «sello» y el último trabajo, «pruebas», que espera a todos;
// - que las pruebas escriban entera la ruta de cada documento que leen (si
//   no, cambios-ci.sh no las vería y un PR de documentación se saltaría
//   pruebas que sí lo leen);
// - que el ensayo de restauración no confunda un fallo de gh con «no hay copias».
// - «Avisos a registrados (base)»: cada acción de la lista tiene su caso y su
//   SQL, y las que cambian la base piden AVISOS (también las de la 36).
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
    'correo-lettermint.yml', 'dominio-correo.yml', 'mercado-directo-base.yml', 'notificaciones-web.yml', 'numeros.yml', 'textos-radar-base.yml',
    'vigilante.yml'],
    'si se añade un flujo con la base, que entre en esta regla');
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
  // dominio-correo.mjs (crear-token-base) llama a psql desde rwadar-app/claves-comun.mjs,
  // y como manda un token, va más allá: comprueba el certificado con la CA de
  // Supabase (verify-full), siempre, sin que el entorno lo pueda rebajar.
  assert.match(leer('rwadar-app/claves-comun.mjs'), /PGSSLMODE: 'verify-full', PGSSLROOTCERT: ca,/);
  assert.doesNotMatch(leer('rwadar-app/claves-comun.mjs'), /entorno\.PGSSLMODE/, 'claves-comun.mjs no deja que el entorno rebaje el TLS');
  assert.doesNotMatch(leer('rwadar-app/claves-comun.mjs').replace(/^\s*(\/\/|\*|\/\*).*$/gm, ''), /sslmode=(disable|allow|prefer)/);
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

const salidaCambios = (pruebas, sello) => `pruebas=${pruebas}\nsello=${sello}\n`;
const SELLO_JSON = 'rwadar-app/data/relanzamiento/estado.json';
// Un sello nuevo: el commit y la huella que pone sellar.cjs.
const selloNuevo = n => `{"informe": "docs/prueba/INFORME-PRUEBA.md", "commit": "${String(n).repeat(40).slice(0, 40)}"}\n`;

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
    assert.equal(r.salida, salidaCambios(esperado, false), `${nombre}: ${r.texto}`);
    assert.match(r.stdout, new RegExp(`pruebas=${esperado}\\nsello=false\\n$`), nombre);
  }
  // Renombrar un documento a código: con --no-renames salen los dos y corre todo.
  assert.equal(repo.pr({}, { mover: [['docs/prueba/SUELTO-PRUEBA.md', 'rwadar-app/suelto.js']] }).salida, salidaCambios(true, false));
  // Borrar un documento que ninguna prueba lee: se salta.
  assert.equal(repo.pr({}, { borrar: ['docs/prueba/SUELTO-PRUEBA.md'] }).salida, salidaCambios(false, false));
  // PR vacío: nada que probar.
  const vacio = repo.pr({});
  assert.equal(vacio.salida, salidaCambios(false, false));
  assert.match(vacio.texto, /Solo documentación: se salta la batería de pruebas\./);
  // Si la prueba que lo lee está en el propio PR, también cuenta (se busca en la cabeza del PR).
  assert.equal(repo.pr({ 'docs/prueba/SUELTO-PRUEBA.md': 'cambio\n', 'probar-otra.mjs': "leer('docs/prueba/SUELTO-PRUEBA.md');\n" }).salida, salidaCambios(true, false));
});

test('cambios-ci: el PR que solo cambia el sello se salta la batería, pero pide el trabajo «sello»', (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const casos = [
    ['solo el sello (como «Sello de main para publicar»)', { [SELLO_JSON]: selloNuevo(1) }, false, true],
    ['el sello y un traspaso que no lee ninguna prueba', { [SELLO_JSON]: selloNuevo(2), 'docs/prueba/TRASPASO-PRUEBA.md': 'cambio\n' }, false, true],
    ['el sello y un documento que leen las pruebas', { [SELLO_JSON]: selloNuevo(3), 'docs/prueba/ESTADO-PRUEBA.md': 'cambio\n' }, true, false],
    ['el sello y un informe nuevo que cita el propio sello', { [SELLO_JSON]: '{"informe": "docs/prueba/NUEVO-PRUEBA.md"}\n', 'docs/prueba/NUEVO-PRUEBA.md': 'x\n' }, true, false],
    ['el sello y código', { [SELLO_JSON]: selloNuevo(4), 'rwadar-publicar.js': '// otra compuerta\n' }, true, false],
    ['el sello y el propio flujo de CI', { [SELLO_JSON]: selloNuevo(5), '.github/workflows/ci.yml': 'x\n' }, true, false],
    ['otro archivo junto al sello', { 'rwadar-app/data/relanzamiento/otro.json': '{}\n' }, true, false],
    ['un estado.json en otra carpeta', { 'rwadar-app/data/estado.json': '{}\n' }, true, false],
  ];
  for (const [nombre, cambios, pruebas, sello] of casos) {
    const r = repo.pr(cambios);
    assert.equal(r.codigo, 0, nombre + ': ' + r.texto);
    assert.equal(r.salida, salidaCambios(pruebas, sello), `${nombre}: ${r.texto}`);
    assert.match(r.stdout, new RegExp(`pruebas=${pruebas}\\nsello=${sello}\\n$`), nombre);
  }
  const soloSello = repo.pr({ [SELLO_JSON]: selloNuevo(6) });
  assert.match(soloSello.texto, /Cambia el sello: rwadar-app\/data\/relanzamiento\/estado\.json/);
  assert.match(soloSello.texto, /Solo el sello \(y documentación\): en vez de la batería, el trabajo «sello»\./);
  // Borrarlo también pide el trabajo «sello», que entonces falla (sin sello no hay compuerta que pase).
  assert.equal(repo.pr({}, { borrar: [SELLO_JSON] }).salida, salidaCambios(false, true));
  // Renombrarlo: el nombre nuevo es otro archivo, así que corre todo.
  assert.equal(repo.pr({}, { mover: [[SELLO_JSON, 'rwadar-app/data/relanzamiento/estado-viejo.json']] }).salida, salidaCambios(true, false));
});

test('cambios-ci: lanzado a mano, o si no se puede ver qué cambia, se pasa todo', (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  repo.pr({ [SELLO_JSON]: selloNuevo(7) });
  const aMano = repo.decidir({ GITHUB_EVENT_NAME: 'workflow_dispatch' });
  assert.equal(aMano.salida, salidaCambios(true, false));
  assert.match(aMano.texto, /Lanzado a mano: se pasa todo\./);
  // Un solo commit (sin HEAD^1): no se sabe qué cambia.
  const solo = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-cambios-ci-solo-'));
  t.after(() => fs.rmSync(solo, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: solo });
  fs.writeFileSync(path.join(solo, 'LEEME-PRUEBA.md'), 'x\n');
  execFileSync('git', ['-c', 'user.name=P', '-c', 'user.email=p@ejemplo.test', '-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', 'uno'], { cwd: solo });
  const r = spawnSync('bash', [SCRIPT_CAMBIOS], { cwd: solo, encoding: 'utf8', env: { PATH: process.env.PATH, HOME: solo, GITHUB_EVENT_NAME: 'pull_request' } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, salidaCambios(true, false));
  assert.match(r.stderr, /No se pudo ver qué cambia: se pasa todo\./);
});

/* ---------- ci.yml: la batería en partes a la vez y el trabajo final «pruebas» ---------- */
// Un trabajo de ci.yml (desde «  nombre:» hasta el siguiente trabajo).
function trabajoCI(ci, nombre) {
  ci = ci.slice(ci.indexOf('\njobs:\n'));
  const inicio = ci.indexOf(`\n  ${nombre}:\n`);
  assert.ok(inicio >= 0, `ci.yml sin el trabajo ${nombre}`);
  const resto = ci.slice(inicio + 1);
  const fin = resto.slice(1).search(/\n(?: {2}#.*\n)* {2}[\w-]+:\n/);
  return fin < 0 ? resto : resto.slice(0, fin + 1);
}
// El bloque «run: |» de un paso, sin la sangría.
function bloqueRun(trabajo, paso) {
  const i = trabajo.indexOf(`- name: ${paso}`);
  assert.ok(i >= 0, `sin el paso «${paso}»`);
  const desde = trabajo.indexOf('run: |\n', i) + 'run: |\n'.length;
  const lineas = [];
  for (const l of trabajo.slice(desde).split('\n')) {
    if (l.trim() && !l.startsWith(' '.repeat(10))) break;
    lineas.push(l.slice(10));
  }
  return lineas.join('\n');
}

test('ci.yml: la batería va en partes a la vez y el último trabajo, «pruebas», espera a todas', async () => {
  const { PARTES_BATERIA } = await import('./partes-ci.mjs');
  const ci = leer('.github/workflows/ci.yml');
  // Solo estos cuatro trabajos: nadie más se llama «pruebas».
  const trabajos = ci.slice(ci.indexOf('\njobs:\n'));
  assert.deepEqual([...trabajos.matchAll(/^ {2}([\w-]+):\n/gm)].map(m => m[1]), ['secretos', 'bateria', 'sello', 'pruebas']);
  const secretos = trabajoCI(ci, 'secretos');
  assert.match(secretos, /id: cambios\n {8}shell: bash\n(?: {8}#.*\n)* {8}run: bash \.github\/cambios-ci\.sh\n/);
  assert.match(secretos, /fetch-depth: 2/);
  assert.match(secretos, /outputs:\n {6}pruebas: \$\{\{ steps\.cambios\.outputs\.pruebas \}\}\n {6}sello: \$\{\{ steps\.cambios\.outputs\.sello \}\}\n/);

  // Las partes: tantas como dice partes-ci.mjs, más la app móvil, todas a la vez y sin cortarse entre sí.
  const bateria = trabajoCI(ci, 'bateria');
  assert.match(bateria, /\n {4}name: \$\{\{ matrix\.nombre \}\}\n {4}needs: secretos\n/);
  assert.match(bateria, /\n {4}if: \$\{\{ !cancelled\(\) && needs\.secretos\.outputs\.pruebas == 'true' \}\}\n/);
  assert.match(bateria, /\n {6}fail-fast: false\n/);
  const filas = [...bateria.matchAll(/^ {10}- \{ parte: ([\w-]+), nombre: '([^']+)', base: (true|false), movil: (true|false), auditar: ([\w-]+|'') \}$/gm)]
    .map(([, parte, nombre, base, movil, auditar]) => ({ parte, nombre, base, movil, auditar }));
  assert.deepEqual(filas.map(f => f.parte), [...PARTES_BATERIA, 'movil']);
  assert.equal(new Set(filas.map(f => f.nombre)).size, filas.length);
  assert.ok(filas.every(f => f.nombre !== 'pruebas' && f.nombre !== 'Sello'), 'ninguna parte se llama como otra comprobación');
  for (const f of filas) {
    // Las partes de la batería necesitan rwadar-app (y no la app); la móvil, al revés.
    assert.equal(f.base, f.parte === 'movil' ? 'false' : 'true', f.parte);
    assert.equal(f.movil, f.parte === 'movil' ? 'true' : 'false', f.parte);
  }
  assert.deepEqual(filas.filter(f => f.auditar !== "''").map(f => f.auditar).sort(), ['rwadar-app', 'rwadar-movil'],
    'npm audit de los dos paquetes, una vez cada uno');
  assert.match(bateria, /- name: Instalar dependencias de base de datos\n {8}if: \$\{\{ matrix\.base \}\}\n {8}run: npm ci --prefix rwadar-app --ignore-scripts\n/);
  assert.match(bateria, /- name: Instalar dependencias móviles\n {8}if: \$\{\{ matrix\.movil \}\}\n {8}run: npm ci --prefix rwadar-movil --ignore-scripts\n/);
  assert.match(bateria, /if: \$\{\{ matrix\.movil \}\}\n {8}run: npm --prefix rwadar-movil run postinstall\n/);
  assert.match(bateria, /env:\n {10}PARTE: \$\{\{ matrix\.parte \}\}\n {8}run: node \.github\/partes-ci\.mjs "\$PARTE"\n/);
  assert.match(bateria, /run: npm audit --prefix "\$PAQUETE" --omit=dev --audit-level=critical\n/);
  assert.match(bateria, /node-version: 22\.23\.4\n/);
  assert.match(bateria, /run: node rwadar-node-seguro\.js\n/);
  // La batería ya no corre entera en ningún sitio (correría dos veces).
  assert.doesNotMatch(ci, /run: npm (?:run )?test\b/);
  assert.doesNotMatch(ci, /vigilante\.test\.mjs/, 'sin un paso suelto que dependa de que npm test pase antes');

  // El último: se sigue llamando «pruebas», espera a todos y corre aunque algo falle o se cancele.
  const final = trabajoCI(ci, 'pruebas');
  assert.doesNotMatch(final, /\n {4}name:/, 'sin «name»: la comprobación se llama «pruebas», como piden las reglas de la rama');
  assert.match(final, /\n {4}needs: \[secretos, bateria, sello\]\n/);
  assert.match(final, /\n {4}if: \$\{\{ always\(\) && !\(needs\.secretos\.result == 'success' && needs\.secretos\.outputs\.pruebas == 'false' && needs\.secretos\.outputs\.sello == 'false'\) \}\}\n/);
  for (const [variable, valor] of [['SECRETOS', 'needs.secretos.result'], ['BATERIA', 'needs.bateria.result'], ['SELLO', 'needs.sello.result'],
    ['TOCA_PRUEBAS', 'needs.secretos.outputs.pruebas'], ['TOCA_SELLO', 'needs.secretos.outputs.sello']]) {
    assert.match(final, new RegExp(`\\n {10}${variable}: \\$\\{\\{ ${valor.replace(/\./g, '\\.')} \\}\\}\\n`), variable);
  }

  // Las pruebas de .github/ van dentro de npm test, al final de la batería de rwadar-app
  // (el package.json de la raíz lo vigila el guardián de la OTA: tocarlo pediría otro APK).
  const raizPaquete = JSON.parse(leer('package.json'));
  assert.match(raizPaquete.scripts.test, /^npm run test:db && /);
  assert.equal(raizPaquete.scripts['test:db'], 'npm --prefix rwadar-app test');
  assert.match(JSON.parse(leer('rwadar-app/package.json')).scripts.test, / && node --test \.\.\/\.github\/\*\.test\.mjs$/);
});

test('trabajo «pruebas»: falla si algo falla o se cancela, o si no corrió lo que tocaba', () => {
  const paso = bloqueRun(trabajoCI(leer('.github/workflows/ci.yml'), 'pruebas'), 'Comprobar que ha pasado todo lo que tocaba');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-ci-final-'));
  try {
    fs.writeFileSync(path.join(dir, 'paso.sh'), paso);
    const correr = ([SECRETOS, BATERIA, SELLO, TOCA_PRUEBAS, TOCA_SELLO]) => {
      const r = spawnSync('bash', ['--noprofile', '--norc', '-e', path.join(dir, 'paso.sh')],
        { env: { PATH: process.env.PATH, SECRETOS, BATERIA, SELLO, TOCA_PRUEBAS, TOCA_SELLO }, encoding: 'utf8' });
      return { codigo: r.status, texto: r.stdout + r.stderr };
    };
    const casos = [
      // [secretos, batería, sello, pruebas?, sello?] → 0 bien, 1 mal
      [['success', 'success', 'skipped', 'true', 'false'], 0, 'PR con código: la batería entera en verde'],
      [['success', 'failure', 'skipped', 'true', 'false'], 1, 'una parte de la batería falla'],
      [['success', 'cancelled', 'skipped', 'true', 'false'], 1, 'una parte se cancela (o se pasa de tiempo)'],
      [['success', 'skipped', 'skipped', 'true', 'false'], 1, 'tocaba la batería y no corrió'],
      [['success', 'success', 'failure', 'true', 'false'], 1, 'el sello falla aunque la batería pase'],
      [['success', 'skipped', 'success', 'false', 'true'], 0, 'PR del sello: el trabajo «sello» en verde'],
      [['success', 'skipped', 'failure', 'false', 'true'], 1, 'PR del sello: el sello no pasa la compuerta'],
      [['success', 'skipped', 'cancelled', 'false', 'true'], 1, 'PR del sello: se cancela'],
      [['success', 'skipped', 'skipped', 'false', 'true'], 1, 'PR del sello: el trabajo «sello» no corrió'],
      [['success', 'failure', 'success', 'false', 'true'], 1, 'PR del sello: algo más falla'],
      [['success', 'cancelled', 'success', 'false', 'true'], 1, 'PR del sello: algo más se cancela'],
      [['success', 'skipped', 'success', 'false', 'false'], 0, 'documentación (si llegara a correr)'],
      [['success', 'skipped', 'skipped', 'false', 'false'], 0, 'solo documentación'],
      [['failure', 'success', 'skipped', 'true', 'false'], 1, 'el escáner encuentra un secreto'],
      [['failure', 'skipped', 'skipped', 'false', 'false'], 1, 'documentación con un secreto'],
      [['cancelled', 'skipped', 'skipped', '', ''], 1, 'cancelado antes de decidir'],
      [['failure', 'skipped', 'skipped', '', ''], 1, 'cambios-ci.sh no llegó a decidir'],
      [['success', 'success', 'success', 'true', 'true'], 1, 'decisión imposible'],
      [['success', 'success', 'skipped', 'si', 'no'], 1, 'decisión desconocida'],
    ];
    for (const [entrada, esperado, nombre] of casos) {
      const r = correr(entrada);
      assert.equal(r.codigo, esperado, `${nombre}: ${r.texto}`);
    }
    assert.match(correr(['success', 'cancelled', 'skipped', 'true', 'false']).texto, /Algo ha fallado o se ha cancelado/);
    assert.match(correr(['success', 'skipped', 'success', 'false', 'true']).texto, /Todo lo que tocaba ha pasado\./);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

/* ---------- .github/partes-ci.mjs: el reparto de la batería ---------- */
test('partes-ci: las partes cubren «npm test» entero, cada orden una vez y en su orden', async () => {
  const { bateria, plan, PARTES_BATERIA, PESOS, PESO_DESCONOCIDO } = await import('./partes-ci.mjs');
  const b = bateria(raiz), p = plan(raiz);
  assert.deepEqual(Object.keys(p), [...PARTES_BATERIA, 'movil', 'sello']);
  // Lo que corre «npm test», orden a orden, sale de los package.json.
  const raizG = JSON.parse(leer('package.json')).scripts, appG = JSON.parse(leer('rwadar-app/package.json')).scripts;
  assert.deepEqual(b.app, appG.test.split(' && '));
  assert.deepEqual([...b.web, ...b.movil].sort(), raizG.test.split(' && ').map(s => s.replace(/^npm run /, '')).filter(s => s !== 'test:db').sort());
  assert.deepEqual(b.movil, ['test:mobile']);
  const esperadas = [...b.app.map(o => `rwadar-app: ${o}`), ...b.web.map(g => `.: npm run ${g}`), ...b.movil.map(g => `.: npm run ${g}`)];
  const repartidas = [...PARTES_BATERIA, 'movil'].flatMap(n => p[n].map(x => `${x.dir}: ${x.orden}`));
  assert.deepEqual([...repartidas].sort(), [...esperadas].sort(), 'ni falta ni sobra ninguna');
  assert.equal(new Set(repartidas).size, repartidas.length, 'ninguna corre dos veces');
  for (const n of PARTES_BATERIA) {
    assert.ok(p[n].length > 0, `${n} vacía`);
    const posiciones = p[n].map(x => esperadas.indexOf(`${x.dir}: ${x.orden}`));
    assert.deepEqual(posiciones, [...posiciones].sort((x, y) => x - y), `${n}: en el orden de npm test`);
  }
  // El bloque web va entero, seguido y en su orden en una sola parte (acceso y
  // probar-orden leen el rwadar-publicado/ que genera test:web).
  const conWeb = PARTES_BATERIA.filter(n => p[n].some(x => x.orden === 'npm run test:web'));
  assert.equal(conWeb.length, 1);
  assert.deepEqual(p[conWeb[0]].filter(x => x.dir === '.').map(x => x.orden), b.web.map(g => `npm run ${g}`));
  const iWeb = p[conWeb[0]].findIndex(x => x.dir === '.');
  assert.ok(p[conWeb[0]].slice(iWeb).every(x => x.dir === '.'), 'nada de rwadar-app en medio del bloque web');
  assert.ok(b.web.includes('test:acceso') && b.web.indexOf('test:web') < b.web.indexOf('test:acceso') && b.web.indexOf('test:web') < b.web.indexOf('test:tools'));
  // Repartidas por lo que tardan: ninguna lleva más de la media más la orden más larga.
  const peso = c => (Object.hasOwn(PESOS, c) ? PESOS[c] : PESO_DESCONOCIDO);
  const carga = n => p[n].reduce((s, x) => s + peso(x.dir === '.' ? x.orden.replace(/^npm run /, '') : x.orden), 0);
  const cargas = PARTES_BATERIA.map(carga), media = cargas.reduce((s, c) => s + c, 0) / cargas.length;
  const mayor = Math.max(...b.app.map(peso), b.web.reduce((s, g) => s + peso(g), 0));
  assert.ok(Math.max(...cargas) <= media + mayor, `reparto desigual: ${cargas.join(', ')}`);
  // Y ninguna pasa de 40 s estimados: con la preparación del trabajo (unos 10 s)
  // queda bajo el minuto, que es lo que cobra GitHub por trabajo. Si las pruebas
  // crecen y esto falla, añade una parte (PARTES_BATERIA y la matriz de ci.yml).
  assert.ok(Math.max(...cargas) <= 40, `una parte pasa de 40 s estimados (${cargas.map(c => c.toFixed(1)).join(', ')}): añade otra parte`);
});

function bateriaDePrueba(app) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-partes-ci-'));
  const escribir = (archivo, texto) => {
    fs.mkdirSync(path.dirname(path.join(dir, archivo)), { recursive: true });
    fs.writeFileSync(path.join(dir, archivo), texto);
  };
  // Cada orden apunta su nombre y su carpeta en «traza»; «falla.mjs» sale con 3.
  const apuntar = "import fs from 'node:fs'; import path from 'node:path';\n" +
    "fs.appendFileSync(path.join(process.env.TRAZA), path.basename(process.argv[1]) + ' en ' + path.basename(process.cwd()) + '\\n');\n";
  for (const orden of app) {
    const m = /^node (?:--test )?([\w.-]+)$/.exec(orden);
    if (m) escribir(path.join('rwadar-app', m[1]), apuntar + (m[1] === 'falla.mjs' ? 'process.exit(3);\n' : ''));
    // «node --test ../carpeta/*.test.mjs» (las pruebas de las noticias automáticas): una prueba de mentira en esa carpeta.
    const g = /^node --test \.\.\/(?!\.github\/)(.+)\/\*\.test\.mjs$/.exec(orden);
    if (g) escribir(path.join(g[1], 'carpeta.test.mjs'), apuntar);
  }
  escribir('.github/flujos.test.mjs', apuntar);
  escribir('package.json', JSON.stringify({ scripts: {
    test: 'npm run test:db && npm run test:web && npm run test:mobile && npm run test:acceso',
    'test:db': 'npm --prefix rwadar-app test',
    'test:web': 'node rwadar-app/web.mjs', 'test:mobile': 'node rwadar-app/movil.mjs', 'test:acceso': 'node rwadar-app/acceso.mjs',
  } }));
  for (const f of ['web.mjs', 'movil.mjs', 'acceso.mjs']) escribir(path.join('rwadar-app', f), apuntar);
  escribir('rwadar-app/package.json', JSON.stringify({ scripts: { test: app.join(' && ') } }));
  return dir;
}
const SCRIPT_PARTES = path.join(raiz, '.github/partes-ci.mjs');
const correrParte = (dir, ...args) => {
  const traza = path.join(dir, 'traza');
  fs.rmSync(traza, { force: true });
  // Como en CI: sin el NODE_TEST_CONTEXT de este node --test (con él, el node --test de dentro no corre los archivos).
  const env = { ...process.env, TRAZA: traza };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [SCRIPT_PARTES, `--raiz=${dir}`, ...args], { encoding: 'utf8', env });
  return { codigo: r.status, texto: r.stdout + r.stderr, traza: fs.existsSync(traza) ? fs.readFileSync(traza, 'utf8').trim().split('\n') : [] };
};

test('partes-ci: ejecuta una parte en su orden, dentro de rwadar-app, y para en el primer fallo', async (t) => {
  const { plan, PARTES_BATERIA } = await import('./partes-ci.mjs');
  const SELLO_APP = ['node probar-transparencia-comercial.mjs', 'node probar-cobro-seguro.mjs', 'node probar-auditoria-relanzamiento.mjs'];
  // Una orden «node --test ../carpeta/*.test.mjs» (como las de las noticias automáticas) también corre en su parte.
  const app = ['node probar-comunidad.mjs', 'node uno.mjs', ...SELLO_APP, 'node --test ../.claude/skills/noticias-automaticas/pruebas/*.test.mjs',
    'node probar-admin-huella.mjs', 'node dos.mjs',
    'node probar-reabrir-cuentas.mjs', 'node --test ../.github/*.test.mjs'];
  const dir = bateriaDePrueba(app);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const p = plan(dir);
  // Todas las partes, una a una: cada orden corre una vez, en su carpeta.
  const vistas = [];
  for (const n of [...PARTES_BATERIA, 'movil']) {
    const r = correrParte(dir, n);
    assert.equal(r.codigo, 0, `${n}: ${r.texto}`);
    assert.match(r.texto, new RegExp(`✓ Parte ${n}: ${p[n].length} órdenes bien`));
    vistas.push(...r.traza);
  }
  // (la de ../.github/*.test.mjs corre el flujos.test.mjs de mentira).
  assert.deepEqual(vistas.filter(v => / en rwadar-app$/.test(v)).sort(),
    app.map(o => (o.includes('../.github/*') ? 'flujos.test.mjs' : o.includes('*') ? 'carpeta.test.mjs' : o.replace(/^node /, '')) + ' en rwadar-app').sort());
  // Los guiones de la raíz corren desde la raíz.
  assert.ok(vistas.includes(`web.mjs en ${path.basename(dir)}`) && vistas.includes(`movil.mjs en ${path.basename(dir)}`), vistas.join('\n'));
  // El sello: sus cuatro órdenes, en este orden.
  const sello = correrParte(dir, 'sello');
  assert.equal(sello.codigo, 0, sello.texto);
  assert.deepEqual(sello.traza, ['probar-transparencia-comercial.mjs en rwadar-app', 'probar-cobro-seguro.mjs en rwadar-app',
    'probar-auditoria-relanzamiento.mjs en rwadar-app', 'flujos.test.mjs en rwadar-app']);

  // Una orden que falla: la parte devuelve su código y no sigue (como «&&»).
  // Detrás, varias más del mismo peso, para que alguna caiga en su parte.
  const tras = Array.from({ length: 8 }, (_, i) => `node tras-${i + 1}.mjs`);
  const conFallo = [...app.slice(0, 2), 'node falla.mjs', ...tras, ...app.slice(2)];
  const dir2 = bateriaDePrueba(conFallo);
  t.after(() => fs.rmSync(dir2, { recursive: true, force: true }));
  const p2 = plan(dir2);
  const parte = PARTES_BATERIA.find(n => p2[n].some(x => x.orden === 'node falla.mjs'));
  const iFalla = p2[parte].findIndex(x => x.orden === 'node falla.mjs');
  assert.ok(p2[parte].length > iFalla + 1, 'la prueba necesita algo detrás de la orden que falla');
  const r = correrParte(dir2, parte);
  assert.equal(r.codigo, 3, r.texto);
  assert.match(r.texto, /✗ Falla «node falla\.mjs» \(código 3\)/);
  assert.deepEqual(r.traza, p2[parte].slice(0, iFalla + 1).map(x => `${x.orden.replace(/^node /, '')} en rwadar-app`), 'no sigue tras el fallo');
  assert.doesNotMatch(r.texto, /✓ Parte/);

  // Errores de uso y package.json que no sabe repartir: código 2, sin correr nada.
  assert.equal(correrParte(dir, 'inventada').codigo, 2);
  assert.equal(correrParte(dir).codigo, 2);
  const listado = JSON.parse(correrParte(dir, '--listar').texto);
  assert.deepEqual(Object.keys(listado), [...PARTES_BATERIA, 'movil', 'sello']);
  for (const malo of ['node uno.mjs; rm -rf ..', 'node uno.mjs | tee x', 'npm run otra', 'node $(echo uno.mjs)']) {
    const dir3 = bateriaDePrueba(['node probar-comunidad.mjs', malo, ...SELLO_APP, 'node --test ../.github/*.test.mjs']);
    try {
      const r3 = correrParte(dir3, 'bateria-1');
      assert.equal(r3.codigo, 2, `${malo}: ${r3.texto}`);
      assert.match(r3.texto, /no es una orden «node …» sencilla/);
      assert.deepEqual(r3.traza, []);
    } finally { fs.rmSync(dir3, { recursive: true, force: true }); }
  }
  // Si una prueba del sello desaparece de npm test, el reparto se niega.
  const dir4 = bateriaDePrueba(['node probar-comunidad.mjs', ...SELLO_APP.slice(1), 'node --test ../.github/*.test.mjs']);
  t.after(() => fs.rmSync(dir4, { recursive: true, force: true }));
  const r4 = correrParte(dir4, 'sello');
  assert.equal(r4.codigo, 2);
  assert.match(r4.texto, /probar-transparencia-comercial\.mjs» ya no está en npm test/);
});

/* ---------- el PR del sello: lo que la batería comprueba del sello, sin la batería ---------- */
test('sello: todo lo que la batería comprueba de estado.json lo comprueba el trabajo «sello»', async () => {
  const { SELLO, plan } = await import('./partes-ci.mjs');
  const ci = leer('.github/workflows/ci.yml');
  const sello = trabajoCI(ci, 'sello');
  assert.match(sello, /\n {4}needs: secretos\n {4}if: \$\{\{ !cancelled\(\) && needs\.secretos\.outputs\.sello == 'true' \}\}\n/);
  assert.match(sello, /fetch-depth: 0\n/, 'con historial: la compuerta busca el commit aprobado');
  assert.match(sello, /run: node rwadar-node-seguro\.js\n/);
  assert.match(sello, /run: npm ci --prefix rwadar-app --ignore-scripts\n/);
  const pasos = [...sello.matchAll(/\n {8}run: (.+)\n/g)].map(m => m[1]);
  assert.deepEqual(pasos.slice(-2), ['node .github/partes-ci.mjs sello', 'node rwadar-app/auditar-relanzamiento.mjs'],
    'primero las pruebas de la batería que leen el sello y después la compuerta');
  // Es la misma compuerta con la que empieza «Publicar web».
  assert.match(leer('.github/workflows/publicar.yml'), /- name: Comprobar la aprobación antes de tocar la red\n {8}run: node rwadar-app\/auditar-relanzamiento\.mjs\n/);

  // Vigía: cada prueba de la batería que lee el sello corre en el trabajo «sello»…
  const archivoDe = orden => orden === 'node --test ../.github/flujos.test.mjs' ? '.github/flujos.test.mjs' : `rwadar-app/${orden.replace(/^node /, '')}`;
  assert.deepEqual(plan(raiz).sello.map(x => x.orden), [...SELLO]);
  const enSello = new Set(SELLO.map(archivoDe));
  for (const f of enSello) assert.ok(fs.existsSync(path.join(raiz, f)), f);
  // …o lo que comprueba del sello lo cubre la compuerta. probar-web.mjs lee del
  // sello la versión 3 y los controles (los clona y cambia uno): la compuerta
  // rechaza otra versión (VERSION_NO_RECONOCIDA) o un control ausente (CONTROL_AUSENTE).
  const CUBIERTO_POR_LA_COMPUERTA = new Set(['probar-web.mjs']);
  const leen = execFileSync('git', ['grep', '--untracked', '-l', '-e', 'relanzamiento', '--', ':(glob)**/probar-*', ':(glob)**/*.test.*'], { cwd: raiz, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter(f => !f.includes('node_modules/'));
  const sinCubrir = leen.filter(f => !enSello.has(f) && !CUBIERTO_POR_LA_COMPUERTA.has(f));
  assert.deepEqual(sinCubrir, [], 'Estas pruebas leen el sello y el PR del sello se las saltaría: añádelas a SELLO en .github/partes-ci.mjs (o comprueba que la compuerta cubre lo que miran):\n' + sinCubrir.join('\n'));
  const web = leer('probar-web.mjs');
  assert.equal((web.match(/relanzamiento/g) || []).length, 1, 'probar-web.mjs lee el sello en un solo sitio');
  assert.equal((web.match(/estadoRelanzamiento/g) || []).length, 7,
    'probar-web.mjs usa el sello de otra forma: revisa si la compuerta lo cubre (si no, el PR del sello se lo saltaría) y actualiza este número');
  assert.match(web, /estadoRelanzamiento\.version===3/);
  const seguridad = leer('rwadar-publicacion-segura.js');
  assert.match(seguridad, /fallo\('VERSION_NO_RECONOCIDA'/);
  assert.match(seguridad, /fallo\('CONTROL_AUSENTE', `falta el control \$\{id\}`\)/);
  assert.match(seguridad, /'catalogo_actual_y_citable',\n/);
  // …y ningún guion que corra la batería empieza a leer el sello sin que se note:
  // estos son los únicos archivos de código que lo nombran. Si aparece otro, mira
  // si la batería lo corre y si el trabajo «Sello» cubre lo que mira, y añádelo aquí.
  const codigo = execFileSync('git', ['grep', '--untracked', '-l', '-e', 'relanzamiento', '--', '*.js', '*.mjs', '*.cjs'], { cwd: raiz, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('node_modules/')).sort();
  // Las noticias automáticas (14/11/2026) sellan solo las noticias y sin tocar «actualizadoEl». La batería no lee el
  // sello del repositorio con ellas: sus pruebas hacen su «main» con un estado.json fijo (pruebas/fijos/estado.json),
  // «validar --publicada» no mira el sello (V-16 es de la fase final) y ensayo.mjs no lo corre la batería. Por eso
  // no van en el trabajo «Sello» (ahorra un minuto en cada PR de sello: el trabajo se quedaba cerca de 60 s).
  assert.deepEqual(codigo, ['.claude/skills/investigacion-catalogo/sellar.cjs',
    '.claude/skills/noticias-automaticas/ensayo.mjs', '.claude/skills/noticias-automaticas/lib/cerrojo.mjs',
    '.claude/skills/noticias-automaticas/lib/comun.mjs', '.claude/skills/noticias-automaticas/lib/flujo.mjs',
    '.github/flujos.test.mjs', '.github/partes-ci.mjs',
    'probar-web.mjs', 'rwadar-app/auditar-relanzamiento.mjs', 'rwadar-app/probar-auditoria-relanzamiento.mjs',
    'rwadar-app/probar-cobro-seguro.mjs', 'rwadar-app/probar-transparencia-comercial.mjs', 'rwadar-precargar-imagenes.js',
    'rwadar-publicacion-segura.js', 'rwadar-publicar.js'], 'Otro archivo de código nombra el sello: revisa si la batería lo corre y si el trabajo «Sello» lo cubre');
  assert.ok(!SELLO.some(o => o.includes('noticias-automaticas')), 'las pruebas de las noticias automáticas no leen el sello del repositorio');
  assert.match(leer('.claude/skills/noticias-automaticas/pruebas/sello.test.mjs'), /JSON\.parse\(fs\.readFileSync\(ESTADO_FIJO, 'utf8'\)\)/,
    'sello.test.mjs tiene que hacer su «main» con el estado.json fijo: si lee el del repositorio, va en SELLO');
  // rwadar-publicar.js lee el sello solo en modo remoto; test:web lo corre con --local.
  const publicar = leer('rwadar-publicar.js'), iRemoto = publicar.indexOf('\nif (remoto) {\n');
  assert.equal((publicar.match(/'relanzamiento'/g) || []).length, 1, 'rwadar-publicar.js lee el sello en otro sitio');
  assert.ok(iRemoto >= 0 && publicar.indexOf("'relanzamiento'") > iRemoto, 'rwadar-publicar.js lee el sello fuera del modo remoto');
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

/* ---------- avisos-base.yml: acciones, casos y AVISOS ---------- */
test('avisos-base.yml: cada acción de la lista tiene su caso con un SQL que existe, y al revés; las que cambian la base piden AVISOS', () => {
  const flujo = leer('.github/workflows/avisos-base.yml');
  const opciones = flujo.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map(l => l.trim().slice(2));
  const casos = [...flujo.matchAll(/^ {12}([a-z0-9-]+)\)\s+SQL="([^"]+)";\s+CAMBIA=(si|no)/gm)].map(m => ({ accion: m[1], sql: m[2], cambia: m[3] }));
  assert.deepEqual(casos.map(c => c.accion).sort(), [...opciones].sort(), 'las mismas acciones en la lista y en «Comprobar la acción»');
  const D = 'rwadar-app/db';
  const variables = Object.fromEntries([...flujo.matchAll(/^ {10}(V3[0-9])="\$D\/([^"]+)"$/gm)].map(m => [m[1], `${D}/${m[2]}`]));
  for (const c of casos) {
    const ruta = c.sql.replace(/^\$D\//, D + '/').replace(/^\$(V3[0-9])$/, (_, v) => variables[v]);
    assert.ok(fs.existsSync(path.join(raiz, ruta)), `${c.accion}: no existe ${ruta}`);
  }
  // Las de la 36 (notificaciones sin cuenta): aplicar, activar y apagar cambian la base; la prueba pide AVISOS sin copia.
  const de36 = Object.fromEntries(casos.filter(c => /-36$|sin-cuenta$/.test(c.accion)).map(c => [c.accion, c.cambia]));
  assert.deepEqual(de36, { 'ensayo-36': 'no', 'verificar-36': 'no', 'aplicar-36': 'si', 'activar-sin-cuenta': 'si', 'apagar-sin-cuenta': 'si', 'prueba-sin-cuenta': 'no' });
  assert.match(flujo, /if \[ "\$CAMBIA" = si \] && \[ "\$CONFIRMAR" != "AVISOS" \]; then/);
  assert.match(flujo, /if \[ "\$ACCION" = prueba-sin-cuenta \] && \[ "\$CONFIRMAR" != "AVISOS" \]; then/);
});

/* ---------- textos-radar-base.yml: la 38, con las garantías de los demás ---------- */
test('textos-radar-base.yml: acciones fijas de la 38, solo desde main, en la cola del catálogo, TEXTOS y copia antes de aplicar', () => {
  const flujo = leer('.github/workflows/textos-radar-base.yml');
  assert.match(flujo, /^name: Textos del radar \(base\)$/m);
  const opciones = flujo.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map(l => l.trim().slice(2));
  assert.deepEqual(opciones, ['ensayo-38', 'verificar-38', 'aplicar-38']);
  const casos = [...flujo.matchAll(/^ {12}([a-z0-9-]+)\)\s+SQL="([^"]+)";\s+CAMBIA=(si|no)(.*)$/gm)]
    .map(m => ({ accion: m[1], sql: m[2], cambia: m[3], resto: m[4] }));
  assert.deepEqual(casos.map(c => [c.accion, c.sql, c.cambia]), [
    ['ensayo-38', '$D/38_textos_radar.sql', 'no'],
    ['verificar-38', '$V38', 'no'],
    ['aplicar-38', '$D/38_textos_radar.sql', 'si']]);
  assert.match(casos[2].resto, /COPIA=si/, 'aplicar-38 hace la copia cifrada antes');
  assert.ok(fs.existsSync(path.join(raiz, 'rwadar-app/db/38_textos_radar.sql')));
  assert.match(flujo, /^ {10}V38="\$D\/38_textos_radar_verificar\.sql"$/m);
  assert.ok(fs.existsSync(path.join(raiz, 'rwadar-app/db/38_textos_radar_verificar.sql')));
  assert.match(flujo, /if \[ "\$CAMBIA" = si \] && \[ "\$CONFIRMAR" != "TEXTOS" \]; then/);
  assert.match(flujo, /- name: Solo desde main\n {8}if: github\.ref != 'refs\/heads\/main'\n/);
  assert.match(flujo, /^concurrency:\n {2}group: rwadar-aplicar-catalogo\n {2}cancel-in-progress: false$/m);
  assert.match(flujo, /^permissions:\n {2}contents: read$/m);
  // La copia va antes de aplicar, y con la clave de cifrado.
  const copia = flujo.indexOf('- name: Copia de seguridad antes de cambiar nada');
  const aplicar = flujo.indexOf('- name: Aplicar');
  assert.ok(copia > 0 && aplicar > copia, 'la copia, antes de aplicar');
  assert.match(flujo.slice(copia, aplicar), /if: env\.COPIA == 'si'[\s\S]*COPIA_CLAVE: \$\{\{ secrets\.COPIA_CLAVE \}\}[\s\S]*copia-seguridad\.sh/);
  assert.doesNotMatch(sinComentarios(flujo), /inputs\.(archivo|sql|fichero)/, 'no se puede pasar un archivo cualquiera');
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
