// Pruebas sin red de «Limpiar ramas» (.github/limpiar-ramas.mjs y
// .github/workflows/limpiar-ramas.yml): las guardas de elegir(), que sin
// BORRAR no se borra nada, el flujo (solo a mano, permisos, un único
// git push y con --delete) y una pasada entera en un repositorio de usar y
// tirar, con un gh simulado y el mismo paso de borrar del flujo.
// Uso: node --test .github/limpiar-ramas.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { elegir, listaParaBorrar, resumen, PROTEGIDAS, PALABRA } from './limpiar-ramas.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const SCRIPT = path.join(raiz, '.github/limpiar-ramas.mjs');
const FLUJO = fs.readFileSync(path.join(raiz, '.github/workflows/limpiar-ramas.yml'), 'utf8');
const sinComentarios = texto => texto.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

const sha = c => c.repeat(40);
const rama = (nombre, punta = sha('a'), propios = 0) => ({ nombre, punta, propios });
const pr = (number, ref, punta) => ({ number, head: { ref, sha: punta } });
const decidir = (opciones) => {
  const dentro = new Set(opciones.dentro || []);
  return Object.fromEntries(elegir({ esAncestroDeMain: n => dentro.has(n), ...opciones }).map(d => [d.rama, d]));
};

/* ---------- elegir() ---------- */
test('main y datos-tokenizacion no se borran nunca, aunque estén en main, tengan un PR unido y se incluyan los cerrojos', () => {
  assert.deepEqual([...PROTEGIDAS], ['main', 'datos-tokenizacion']);
  const d = decidir({
    ramas: [rama('main'), rama('datos-tokenizacion', sha('b'), 3)],
    dentro: ['main', 'datos-tokenizacion'],
    prsUnidos: [pr(1, 'main', sha('a')), pr(2, 'datos-tokenizacion', sha('b'))],
    incluirCerrojos: true,
  });
  for (const n of PROTEGIDAS) {
    assert.equal(d[n].accion, 'conservar', n);
    assert.match(d[n].motivo, /nunca se borra/);
  }
  assert.deepEqual(listaParaBorrar(Object.values(d), PALABRA), []);
});

test('una rama cuya punta ya está en la historia de main se borra', () => {
  const d = decidir({ ramas: [rama('claude/hecha')], dentro: ['claude/hecha'] });
  assert.equal(d['claude/hecha'].accion, 'borrar');
  assert.match(d['claude/hecha'].motivo, /ya está en la historia de main/);
});

test('squash: se borra si el PR unido tiene la misma punta; con otra punta se queda, con sus commits propios', () => {
  const d = decidir({
    ramas: [rama('claude/squash', sha('c'), 2), rama('claude/despues', sha('d'), 3), rama('claude/sin-pr', sha('e'), 1)],
    prsUnidos: [pr(40, 'claude/squash', sha('c')), pr(41, 'claude/despues', sha('9'))],
  });
  assert.equal(d['claude/squash'].accion, 'borrar');
  assert.match(d['claude/squash'].motivo, /PR #40 se unió con esta misma punta/);
  assert.equal(d['claude/despues'].accion, 'conservar');
  assert.match(d['claude/despues'].motivo, /^3 commits propios que no están en main; el PR #41 se unió con otra punta$/);
  assert.equal(d['claude/sin-pr'].accion, 'conservar');
  assert.equal(d['claude/sin-pr'].motivo, '1 commit propio que no está en main');
});

test('una rama con un PR abierto se queda, aunque esté en main o tenga otro PR unido con su punta', () => {
  const d = decidir({
    ramas: [rama('claude/abierta', sha('f')), rama('claude/cerrojo-ciclo-2026-11-21', sha('f'))],
    dentro: ['claude/abierta', 'claude/cerrojo-ciclo-2026-11-21'],
    prsUnidos: [pr(50, 'claude/abierta', sha('f'))],
    prsAbiertos: [pr(51, 'claude/abierta', sha('f')), pr(52, 'claude/cerrojo-ciclo-2026-11-21', sha('f'))],
    incluirCerrojos: true,
  });
  assert.equal(d['claude/abierta'].accion, 'conservar');
  assert.match(d['claude/abierta'].motivo, /PR #51 abierto/);
  assert.equal(d['claude/cerrojo-ciclo-2026-11-21'].accion, 'conservar');
});

test('cerrojo dentro de main: se queda sin incluir_cerrojos; con «si» se borra, y si no está en main se queda igual', () => {
  const ramas = [rama('claude/cerrojo-ciclo-2026-11-20'), rama('claude/cerrojo-ciclo-2026-11-21', sha('b'), 1)];
  const dentro = ['claude/cerrojo-ciclo-2026-11-20'];
  for (const incluirCerrojos of [false, undefined, 'si']) {
    const sin = decidir({ ramas, dentro, incluirCerrojos });
    assert.equal(sin['claude/cerrojo-ciclo-2026-11-20'].accion, 'conservar', `incluirCerrojos=${incluirCerrojos}`);
    assert.match(sin['claude/cerrojo-ciclo-2026-11-20'].motivo, /incluir_cerrojos=si/);
  }
  const con = decidir({ ramas, dentro, incluirCerrojos: true });
  assert.equal(con['claude/cerrojo-ciclo-2026-11-20'].accion, 'borrar');
  assert.equal(con['claude/cerrojo-ciclo-2026-11-21'].accion, 'conservar');
});

test('un nombre o una punta que no se entienden no se tocan', () => {
  const d = decidir({ ramas: [rama('-x'), rama('a b'), rama('claude/punta-rara', 'zzz')], dentro: ['-x', 'a b', 'claude/punta-rara'] });
  for (const d1 of Object.values(d)) assert.equal(d1.accion, 'conservar', d1.rama);
});

test('sin la palabra BORRAR exacta, la lista de borradas queda vacía', () => {
  const decisiones = elegir({ ramas: [rama('claude/hecha'), rama('main')], esAncestroDeMain: () => true });
  for (const confirmar of [undefined, '', 'borrar', 'Borrar', ' BORRAR', 'BORRAR ', 'si', 'BORRA']) {
    assert.deepEqual(listaParaBorrar(decisiones, confirmar), [], `confirmar=${JSON.stringify(confirmar)}`);
  }
  assert.deepEqual(listaParaBorrar(decisiones, 'BORRAR').map(d => d.rama), ['claude/hecha']);
  // Aunque una decisión mal hecha marcara main para borrar, la lista la quita.
  assert.deepEqual(listaParaBorrar([{ rama: 'main', accion: 'borrar' }, { rama: 'datos-tokenizacion', accion: 'borrar' }], 'BORRAR'), []);
});

test('el resumen: lo borrado y lo que se queda, con su motivo; sin BORRAR dice que no se borró nada', () => {
  const decisiones = elegir({
    ramas: [rama('claude/hecha'), rama('claude/viva', sha('b'), 2), rama('main')],
    esAncestroDeMain: n => n !== 'claude/viva',
  });
  const lista = resumen({ decisiones, confirmar: '' });
  assert.match(lista, /solo lista \(no se ha borrado nada\)/);
  assert.match(lista, /### Se borrarían \(1\)\n\n- `claude\/hecha` · su punta ya está en la historia de main/);
  assert.match(lista, /### Se quedan \(2\)\n\n- `claude\/viva` · 2 commits propios que no están en main\n- `main` · rama fija: nunca se borra/);
  assert.doesNotMatch(lista, /### Borradas/);
  const hecho = resumen({ decisiones, confirmar: 'BORRAR', borradas: ['claude/hecha'] });
  assert.match(hecho, /### Borradas \(1\)\n\n- `claude\/hecha` · su punta ya está en la historia de main/);
  assert.match(hecho, /### Se quedan \(2\)/);
  assert.doesNotMatch(hecho, /No se pudieron borrar/);
  assert.match(resumen({ decisiones, confirmar: 'BORRAR', fallidas: ['claude/hecha'] }), /### Borradas \(0\)\n\nNinguna\.[\s\S]*### No se pudieron borrar \(1\)/);
});

/* ---------- El flujo ---------- */
test('el flujo: solo a mano, lectura arriba y en el trabajo escribir contenido y leer PR, toda la historia y un único git push con --delete', () => {
  const limpio = sinComentarios(FLUJO);
  assert.match(FLUJO, /^on:\n {2}workflow_dispatch:\n {4}inputs:\n/m);
  const disparadores = limpio.slice(limpio.indexOf('\non:\n'), limpio.indexOf('\npermissions:'));
  assert.deepEqual([...disparadores.matchAll(/^ {2}(\S+):/gm)].map(m => m[1]), ['workflow_dispatch'], 'ningún otro disparador');
  assert.match(FLUJO, /^ {6}confirmar:\n {8}description: 'Escribe BORRAR .*\n {8}required: false\n {8}type: string\n/m);
  assert.match(FLUJO, /^ {6}incluir_cerrojos:\n(?: {8}.*\n)*? {8}options:\n {10}- 'no'\n {10}- 'si'\n {8}default: 'no'\n/m);
  const permisos = [...limpio.matchAll(/\n( *)permissions:\n((?:\1 {2}\S.*\n)+)/g)].map(m => [m[1].length, m[2].trim().split('\n').map(l => l.trim())]);
  assert.deepEqual(permisos, [[0, ['contents: read']], [4, ['contents: write', 'pull-requests: read']]]);
  assert.match(FLUJO, /\n {10}fetch-depth: 0\n/);
  assert.doesNotMatch(limpio, /persist-credentials: false/, 'las credenciales hacen falta para borrar');
  const empujes = limpio.match(/git push[^\n]*/g);
  assert.equal(empujes.length, 1, 'un único git push');
  assert.match(empujes[0], /^git push --force-with-lease="refs\/heads\/\$rama:\$punta" origin --delete "refs\/heads\/\$rama"; then$/);
  assert.doesNotMatch(limpio, /--force(?!-with-lease)|\bpush -f\b|--mirror/);
  // El primer paso: solo desde main.
  const pasos = [...limpio.matchAll(/\n {6}- name: (.+)/g)].map(m => m[1]);
  assert.equal(pasos[0], 'Solo desde main');
  assert.match(FLUJO, /- name: Solo desde main\n {8}if: github\.ref != 'refs\/heads\/main'\n/);
  // Sin claves ni base; las entradas llegan por env, nunca ${{ }} dentro de un run.
  assert.doesNotMatch(FLUJO, /secrets\.|SUPABASE|CLOUDFLARE|wrangler|eas /i);
  for (const r of [...FLUJO.matchAll(/^ {8}run: (.*)$/gm)].map(m => m[1])
    .concat([...FLUJO.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map(m => m[2]))) {
    assert.ok(!r.includes('${{'), `run con \${{ }}: ${r}`);
  }
  assert.match(FLUJO, /^ {6}CONFIRMAR: \$\{\{ inputs\.confirmar \}\}$/m);
  assert.match(FLUJO, /^ {6}INCLUIR_CERROJOS: \$\{\{ inputs\.incluir_cerrojos \}\}$/m);
  // Las acciones, por su SHA y el mismo que los demás flujos.
  const casa = new Set(fs.readdirSync(path.join(raiz, '.github/workflows')).filter(n => n !== 'limpiar-ramas.yml')
    .flatMap(n => [...fs.readFileSync(path.join(raiz, '.github/workflows', n), 'utf8').matchAll(/uses: ([\w./-]+@[0-9a-f]{40})/g)].map(m => m[1])));
  for (const usa of limpio.match(/uses: \S+/g)) assert.ok(casa.has(usa.slice(6)), `${usa}: el mismo SHA que los demás flujos`);
  assert.match(FLUJO, /node rwadar-node-seguro\.js/);
});

/* ---------- Una pasada entera, en un repositorio de usar y tirar ---------- */
function bloqueBorrar() {
  const inicio = FLUJO.indexOf('- name: Borrar las ramas elegidas');
  const fin = FLUJO.indexOf('\n      - name:', inicio + 10);
  const paso = FLUJO.slice(inicio, fin);
  return paso.slice(paso.indexOf('run: |') + 7).split('\n').map(l => l.replace(/^ {10}/, '')).join('\n');
}

test('pasada entera: sin BORRAR no se borra nada; con BORRAR, solo lo que toca, y una punta que cambió se queda', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-limpiar-ramas-'));
  try {
    const entornoGit = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(dir, 'gitconfig') };
    fs.writeFileSync(entornoGit.GIT_CONFIG_GLOBAL, '[user]\n\tname = Prueba\n\temail = prueba@ejemplo.test\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n');
    const origen = path.join(dir, 'origen.git'), copia = path.join(dir, 'copia');
    const git = (cwd, ...a) => execFileSync('git', a, { cwd, env: entornoGit, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git(dir, 'init', '-q', '--bare', origen);
    git(dir, 'clone', '-q', origen, copia);
    const commit = (texto) => { fs.writeFileSync(path.join(copia, 'f.txt'), texto); git(copia, 'add', '-A'); git(copia, 'commit', '-q', '-m', texto); return git(copia, 'rev-parse', 'HEAD'); };
    const base = commit('base');
    git(copia, 'push', '-q', 'origin', 'HEAD:refs/heads/main', 'HEAD:refs/heads/datos-tokenizacion',
      'HEAD:refs/heads/claude/hecha', 'HEAD:refs/heads/claude/abierta', 'HEAD:refs/heads/claude/cerrojo-ciclo-2026-11-21');
    const viva = commit('viva');
    const squash = commit('squash');
    const cambiada = commit('cambiada');
    git(copia, 'push', '-q', 'origin', `${viva}:refs/heads/claude/viva`, `${squash}:refs/heads/claude/squash`, `${cambiada}:refs/heads/claude/cambiada`);
    git(copia, 'checkout', '-q', '--detach', base);
    // gh simulado: un PR abierto y dos unidos con «squash» (uno con la misma punta).
    fs.mkdirSync(path.join(dir, 'bin'));
    fs.writeFileSync(path.join(dir, 'bin', 'gh'), [
      '#!/bin/bash',
      'case "$3" in',
      `  "repos/o/r/pulls?state=open&per_page=100") printf '7\\tclaude/abierta\\t${base}\\t\\n';;`,
      `  "repos/o/r/pulls?state=closed&per_page=100") printf '5\\tclaude/squash\\t${squash}\\t2026-11-20T10:00:00Z\\n6\\tclaude/cambiada\\t${cambiada}\\t2026-11-20T11:00:00Z\\n8\\tclaude/viva\\t${viva}\\t\\n';;`,
      '  *) echo "gh inesperado: $*" >&2; exit 9;;',
      'esac', ''].join('\n'), { mode: 0o755 });
    fs.writeFileSync(path.join(dir, 'paso.sh'), bloqueBorrar());
    const pasada = (confirmar, incluir, antesDeBorrar = () => {}) => {
      const temp = fs.mkdtempSync(path.join(dir, 'runner-'));
      const env = { ...entornoGit, PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`, GITHUB_REPOSITORY: 'o/r',
        CONFIRMAR: confirmar, INCLUIR_CERROJOS: incluir, RUNNER_TEMP: temp, GITHUB_STEP_SUMMARY: path.join(temp, 'resumen.md') };
      const correr = (orden, args) => spawnSync(orden, args, { cwd: copia, env, encoding: 'utf8' });
      const decide = correr('node', [SCRIPT, 'decidir', path.join(temp, 'limpiar-ramas')]);
      assert.equal(decide.status, 0, decide.stderr);
      antesDeBorrar();
      const borra = correr('bash', ['--noprofile', '--norc', '-eo', 'pipefail', path.join(dir, 'paso.sh')]);
      assert.equal(borra.status, 0, borra.stdout + borra.stderr);
      const fin = correr('node', [SCRIPT, 'resumen', path.join(temp, 'limpiar-ramas')]);
      return { codigo: fin.status, resumen: fs.readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8'),
        ramas: git(copia, 'ls-remote', '--heads', 'origin').split('\n').map(l => l.split('refs/heads/')[1]).sort() };
    };
    const todas = ['claude/abierta', 'claude/cambiada', 'claude/cerrojo-ciclo-2026-11-21', 'claude/hecha', 'claude/squash', 'claude/viva', 'datos-tokenizacion', 'main'];

    // Sin BORRAR (y con una palabra parecida): no se borra nada y se dice lo que se borraría.
    for (const confirmar of ['', 'borrar']) {
      const r = pasada(confirmar, 'si');
      assert.equal(r.codigo, 0);
      assert.deepEqual(r.ramas, todas, `confirmar=${confirmar}`);
      assert.match(r.resumen, /solo lista \(no se ha borrado nada\)/);
      assert.match(r.resumen, /### Se borrarían \(4\)/);
    }

    // Con BORRAR y sin cerrojos; claude/cambiada recibe un commit entre decidir y borrar.
    const r = pasada('BORRAR', 'no', () => {
      git(copia, 'checkout', '-q', '--detach', cambiada);
      git(copia, 'push', '-q', 'origin', `${commit('otro más')}:refs/heads/claude/cambiada`);
      git(copia, 'checkout', '-q', '--detach', base);
    });
    assert.equal(r.codigo, 1, 'una rama que no se pudo borrar hace fallar el resumen');
    assert.deepEqual(r.ramas, ['claude/abierta', 'claude/cambiada', 'claude/cerrojo-ciclo-2026-11-21', 'claude/viva', 'datos-tokenizacion', 'main']);
    assert.match(r.resumen, /### Borradas \(2\)\n\n- `claude\/hecha` · su punta ya está en la historia de main\n- `claude\/squash` · el PR #5 se unió con esta misma punta/);
    assert.match(r.resumen, /### No se pudieron borrar \(1\)[\s\S]*- `claude\/cambiada`/);
    assert.match(r.resumen, /- `claude\/abierta` · tiene el PR #7 abierto/);
    assert.match(r.resumen, /- `claude\/cerrojo-ciclo-2026-11-21` · cerrojo de las noticias automáticas/);
    assert.match(r.resumen, /- `claude\/viva` · 1 commit propio que no está en main/);
    assert.match(r.resumen, /- `main` · rama fija: nunca se borra/);
    assert.match(r.resumen, /- `datos-tokenizacion` · rama fija: nunca se borra/);

    // Con BORRAR y con cerrojos: cae el cerrojo, que está en main.
    const r2 = pasada('BORRAR', 'si');
    assert.equal(r2.codigo, 0);
    assert.deepEqual(r2.ramas, ['claude/abierta', 'claude/cambiada', 'claude/viva', 'datos-tokenizacion', 'main']);
    assert.match(r2.resumen, /### Borradas \(1\)\n\n- `claude\/cerrojo-ciclo-2026-11-21` · su punta ya está en la historia de main/);

    // Una entrada de incluir_cerrojos que no es si/no: no decide nada.
    const mala = spawnSync('node', [SCRIPT, 'decidir', path.join(dir, 'mala')], { cwd: copia, encoding: 'utf8',
      env: { ...entornoGit, PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`, GITHUB_REPOSITORY: 'o/r', INCLUIR_CERROJOS: 'quizá' } });
    assert.equal(mala.status, 1);
    assert.match(mala.stderr, /incluir_cerrojos tiene que ser «si» o «no»/);
    assert.ok(!fs.existsSync(path.join(dir, 'mala', 'borrar.tsv')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
