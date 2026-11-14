// El PR de las noticias automáticas solo lleva noticias (.github/noticias-pr.mjs),
// con la regla y en un repositorio git de usar y tirar, y su paso en ci.yml.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { esPrDeNoticias, fechaDelTitulo, comprobarPr } from './noticias-pr.mjs';
import { RUTAS } from '../.claude/skills/noticias-automaticas/lib/comun.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(raiz, '.github/noticias-pr.mjs');
const DIA = 'rwadar-app/data/noticias-diarias/2026-11-14';
// (el sello por RUTAS.sello: estas pruebas no leen el sello, solo nombran su ruta).
const BIEN = ['rwadar-site/datos/noticias-v2.json', 'rwadar-site/datos/noticias.json', RUTAS.sello,
  `${DIA}/noticias-2026-11-14.json`, `${DIA}/titulares.json`, `${DIA}/barrido.json`, `${DIA}/inventario-fuentes.json`,
  `${DIA}/verificacion.json`, `${DIA}/VERIFICACION.md`, `${DIA}/EDICION.md`, `${DIA}/verificacion-2.json`, `${DIA}/correcciones.json`];

test('noticias-pr: qué PR mira y qué fecha saca del título', () => {
  for (const t of ['Noticias automáticas del 14/11/2026', 'noticias automaticas del 14/11/2026', '  NOTICIAS AUTOMÁTICAS del 14/11/2026'])
    assert.equal(esPrDeNoticias(t), true, t);
  for (const t of ['Sello: main tras la limpieza (#138)', 'Ciclo del 14/11: noticias automáticas', '', undefined])
    assert.equal(esPrDeNoticias(t), false, String(t));
  assert.equal(fechaDelTitulo('Noticias automáticas del 14/11/2026'), '2026-11-14');
  assert.equal(fechaDelTitulo('Noticias automáticas del 31/02/2026'), null);
  assert.equal(fechaDelTitulo('Noticias automáticas de hoy'), null);
});

test('noticias-pr: solo las dos copias, la carpeta del día de su título y el sello', () => {
  const titulo = 'Noticias automáticas del 14/11/2026';
  assert.deepEqual(comprobarPr({ titulo, archivos: BIEN }), { aplica: true, fecha: '2026-11-14', fallos: [] });
  for (const malo of ['rwadar-publicar.js', '.github/workflows/ci.yml', '.github/noticias-pr.mjs', '.claude/skills/noticias-automaticas/lib/validar.mjs',
    'rwadar-site/robots.txt', 'rwadar-app/db/35_directo.sql', `${DIA}/copia.pdf`, 'rwadar-app/data/noticias-diarias/2026-11-13/titulares.json',
    'docs/tareas/PARA-CODEX.md']) {
    const r = comprobarPr({ titulo, archivos: [...BIEN, malo] });
    assert.deepEqual(r.fallos, [`cambia ${malo}, que una mañana no puede tocar`], malo);
  }
  assert.deepEqual(comprobarPr({ titulo: 'Noticias automáticas de hoy', archivos: BIEN }).fallos, ['el título no trae la fecha del día (DD/MM/AAAA)']);
  // Cualquier otro PR: no mira nada.
  assert.deepEqual(comprobarPr({ titulo: 'Gráfico en directo', archivos: ['rwadar-publicar.js'] }), { aplica: false, fecha: null, fallos: [] });
});

test('noticias-pr: el guion sobre un repositorio de verdad (sale con 1 si lleva código y con 0 si solo lleva noticias)', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-noticias-pr-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...a) => execFileSync('git', ['-c', 'user.name=Prueba', '-c', 'user.email=prueba@example.invalid', ...a], { cwd: dir, encoding: 'utf8' }).trim();
  const escribir = (rel, texto) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), texto); };
  git('init', '-q');
  escribir('rwadar-publicar.js', '// antes\n'); escribir('rwadar-site/datos/noticias-v2.json', '{}\n');
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  for (const rel of BIEN) escribir(rel, '{"x":1}\n');
  git('add', '-A'); git('commit', '-q', '-m', 'noticias y sello');
  const bien = git('rev-parse', 'HEAD');
  escribir('rwadar-publicar.js', '// colado\n');
  git('commit', '-q', '-am', 'código colado');
  const malo = git('rev-parse', 'HEAD');
  const correr = (titulo, ...args) => {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, TITULO: titulo } });
    return { codigo: r.status, texto: r.stdout + r.stderr };
  };
  let r = correr('Noticias automáticas del 14/11/2026', base, bien);
  assert.equal(r.codigo, 0, r.texto); assert.match(r.texto, /todos permitidos/);
  r = correr('Noticias automáticas del 14/11/2026', base, malo);
  assert.equal(r.codigo, 1, r.texto); assert.match(r.texto, /- cambia rwadar-publicar\.js, que una mañana no puede tocar/);
  // Por defecto compara HEAD^1 con HEAD (como en la CI): aquí, el commit del código colado.
  r = correr('Noticias automáticas del 14/11/2026');
  assert.equal(r.codigo, 1, r.texto);
  r = correr('Noticias automáticas del 14/11/2026', base, 'no-existe');
  assert.equal(r.codigo, 1, r.texto); assert.match(r.texto, /No se pudo ver qué cambia/);
  r = correr('Otro PR cualquiera', base, malo);
  assert.equal(r.codigo, 0, r.texto); assert.match(r.texto, /nada que mirar/);
});

test('ci.yml: el trabajo «secretos» corre la comprobación en cada PR, con el título por una variable', () => {
  const ci = fs.readFileSync(path.join(raiz, '.github/workflows/ci.yml'), 'utf8');
  const secretos = ci.slice(ci.indexOf('\n  secretos:\n'), ci.indexOf('\n  bateria:\n'));
  assert.match(secretos, /\n {6}- name: El PR de las noticias automáticas solo lleva noticias\n {8}if: \$\{\{ github\.event_name == 'pull_request' \}\}\n {8}env:\n {10}TITULO: \$\{\{ github\.event\.pull_request\.title \}\}\n {8}run: node \.github\/noticias-pr\.mjs\n/);
  // Va antes que el escáner (no depende de él) y el trabajo «pruebas» exige que «secretos» acabe bien.
  assert.ok(secretos.indexOf('noticias-pr.mjs') < secretos.indexOf('Preparar escáner verificado'));
  assert.match(ci, /\[ "\$SECRETOS" = success \] \|\| \{ echo "El escáner de secretos no ha terminado bien\."; mal=1; \}/);
  // El guion solo usa módulos de Node (en «secretos» no se instala nada).
  for (const archivo of ['.github/noticias-pr.mjs', '.claude/skills/noticias-automaticas/lib/validar.mjs',
    '.claude/skills/noticias-automaticas/lib/comun.mjs', '.claude/skills/noticias-automaticas/lib/personas.mjs']) {
    const fuente = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    for (const [, de] of fuente.matchAll(/^import .* from '([^']+)';$/gm)) assert.ok(de.startsWith('node:') || de.startsWith('.'), `${archivo} importa ${de}`);
  }
});
