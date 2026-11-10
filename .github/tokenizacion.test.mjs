// «Foto diaria de la tokenización» (10/11/2026): el flujo, su script y el
// paso de publicar.yml que lleva el histórico a la web. Sin red: CoinGecko es
// la respuesta real del 10/11/2026 recortada, y «origin» un repositorio git
// de usar y tirar. Los pasos de bash se ejecutan tal cual salen del YAML.
// Uso: node --test .github/tokenizacion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { principal, pedirFoto } from '../rwadar-app/tokenizacion/foto-diaria.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = relativa => fs.readFileSync(path.join(raiz, relativa), 'utf8');
const FLUJO = leer('.github/workflows/tokenizacion-diaria.yml');
const PUBLICAR = leer('.github/workflows/publicar.yml');
const COINGECKO = leer('rwadar-app/tokenizacion/prueba-coingecko-20261110.json');
const SEMILLA = path.join(raiz, 'rwadar-site/datos/tokenizacion-historico.json');
const AHORA = Date.parse('2026-11-10T15:31:37Z');
const sinComentarios = texto => texto.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

/* El bloque «run: |» (o «run: >») de un paso, sin la sangría del YAML. */
function paso(flujo, nombre) {
  const inicio = flujo.indexOf(`- name: ${nombre}`);
  assert.ok(inicio >= 0, `falta el paso «${nombre}»`);
  const fin = flujo.indexOf('\n      - name:', inicio + 10);
  return flujo.slice(inicio, fin < 0 ? undefined : fin);
}
function bloque(flujo, nombre) {
  const p = paso(flujo, nombre);
  return p.slice(p.indexOf('run: |') + 7).split('\n').map(l => l.replace(/^ {10}/, '')).join('\n');
}
/* CoinGecko simulado: la respuesta real con la hora del dato cambiada. */
const coingecko = (actualizado = '2026-11-10T15:25:40.000Z', factor = 1) => async () =>
  new Response(JSON.stringify(JSON.parse(COINGECKO).map(c => ({ ...c, updated_at: actualizado, market_cap: c.market_cap * factor }))), { status: 200 });

test('el flujo: a diario a un minuto no redondo y a mano; lectura por defecto y escritura solo en su trabajo; acciones por SHA; sin claves', () => {
  const cron = FLUJO.match(/- cron: '(\d+) (\d+) \* \* \*'/);
  assert.ok(cron, 'un horario diario');
  assert.ok(![0, 30].includes(Number(cron[1])), 'minuto no redondo');
  assert.match(FLUJO, /\n {2}workflow_dispatch:\n/);
  assert.doesNotMatch(sinComentarios(FLUJO), /\n {2}(?:push|pull_request|pull_request_target|workflow_run):/);
  assert.match(FLUJO, /\npermissions:\n {2}contents: read\n/);
  const permisos = [...sinComentarios(FLUJO).matchAll(/\n( *)permissions:\n((?:\1 {2}\S.*\n)+)/g)].map(m => [m[1].length, m[2].trim()]);
  assert.deepEqual(permisos, [[0, 'contents: read'], [4, 'contents: write']], 'el único permiso de más es escribir contenido, en el trabajo');
  assert.equal((sinComentarios(FLUJO).match(/permissions:/g) || []).length, 2);
  assert.match(FLUJO, /timeout-minutes: \d+/);
  // A mano, solo desde main: es el primer paso, antes de descargar el código.
  const pasos = [...sinComentarios(FLUJO).matchAll(/\n {6}- name: (.+)/g)].map(m => m[1]);
  assert.equal(pasos[0], 'Solo desde main');
  assert.match(paso(FLUJO, 'Solo desde main'), /if: github\.ref != 'refs\/heads\/main'[\s\S]*exit 1/);
  const casa = new Set(fs.readdirSync(path.join(raiz, '.github/workflows')).filter(n => n !== 'tokenizacion-diaria.yml')
    .flatMap(n => [...leer(`.github/workflows/${n}`).matchAll(/uses: ([\w./-]+@[0-9a-f]{40})/g)].map(m => m[1])));
  for (const usa of sinComentarios(FLUJO).match(/uses: \S+/g)) {
    assert.match(usa, /@[0-9a-f]{40}$/, `${usa}: fijada por su SHA`);
    assert.ok(casa.has(usa.slice(6)), `${usa}: el mismo SHA que los demás flujos`);
  }
  assert.doesNotMatch(FLUJO, /secrets\.|SUPABASE|CLOUDFLARE|wrangler|eas /i, 'ni claves, ni base, ni publicar');
  // Solo empuja a la rama de datos, y nunca con --force.
  assert.deepEqual(sinComentarios(FLUJO).match(/git push[^\n]*/g), ['git push origin HEAD:refs/heads/datos-tokenizacion']);
  assert.doesNotMatch(FLUJO, /--force|-f\b.*push/);
  assert.match(FLUJO, /node rwadar-node-seguro\.js/);
  assert.match(FLUJO, /node-version: 22\.23\.4/);
  // La fecha que llega al mensaje del commit se comprueba antes.
  assert.match(bloque(FLUJO, 'Guardar la foto (un commit por día)'), /\[\[ "\$FECHA" =~ \^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$ \]\]/);
});

/* ---- El flujo de verdad contra un «origin» de usar y tirar ---- */
function repoDePrueba() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-tokenizacion-'));
  const entorno = { PATH: process.env.PATH, HOME: dir, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_DATE: '2026-11-10T06:23:00Z', GIT_COMMITTER_DATE: '2026-11-10T06:23:00Z' };
  const git = (cwd, ...a) => execFileSync('git', ['-c', 'init.defaultBranch=main', '-c', 'commit.gpgsign=false', ...a], { cwd, encoding: 'utf8', env: entorno });
  const origen = path.join(dir, 'origen.git'), trabajo = path.join(dir, 'trabajo');
  git(dir, 'init', '-q', '--bare', origen);
  git(dir, 'clone', '-q', origen, trabajo);
  fs.mkdirSync(path.join(trabajo, 'rwadar-site/datos'), { recursive: true });
  fs.copyFileSync(SEMILLA, path.join(trabajo, 'rwadar-site/datos/tokenizacion-historico.json'));
  fs.writeFileSync(path.join(trabajo, 'LEEME-PRUEBA.txt'), 'código\n');
  git(trabajo, 'add', '-A'); git(trabajo, '-c', 'user.name=P', '-c', 'user.email=p@ejemplo.test', 'commit', '-q', '-m', 'main');
  git(trabajo, 'push', '-q', 'origin', 'main');
  let vuelta = 0;
  function bash(script, extra = {}) {
    const temporal = path.join(dir, 'runner-' + (++vuelta));
    fs.mkdirSync(temporal);
    const env = { ...entorno, RUNNER_TEMP: path.join(dir, 'runner'), GITHUB_ENV: path.join(temporal, 'env'), ...extra };
    fs.mkdirSync(env.RUNNER_TEMP, { recursive: true });
    const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], { cwd: trabajo, env, encoding: 'utf8' });
    return { codigo: r.status, texto: r.stdout + r.stderr, entorno: fs.existsSync(env.GITHUB_ENV) ? fs.readFileSync(env.GITHUB_ENV, 'utf8') : '' };
  }
  /* Una ejecución del flujo: preparar la rama, la foto (con CoinGecko simulado) y guardar. */
  async function ejecutar({ fetchImpl, ahora }) {
    // Cada ejecución empieza en un runner limpio (el checkout de main es nuevo).
    fs.rmSync(path.join(dir, 'runner'), { recursive: true, force: true });
    git(trabajo, 'worktree', 'prune');
    const preparar = bash(bloque(FLUJO, 'Preparar la rama de datos'));
    assert.equal(preparar.codigo, 0, preparar.texto);
    const DATOS = preparar.entorno.match(/^DATOS=(.+)$/m)[1];
    const salida = path.join(dir, 'salida-' + vuelta);
    fs.writeFileSync(salida, '');
    const registro = [];
    const codigo = await principal([path.join(DATOS, 'tokenizacion-historico.json'), '--semilla', 'rwadar-site/datos/tokenizacion-historico.json'].map(
      (a, i) => (i === 2 ? path.join(trabajo, a) : a)), { entorno: { GITHUB_OUTPUT: salida }, fetchImpl, esperar: async () => {}, ahora: () => ahora,
      log: m => registro.push(m), error: m => registro.push(m) });
    const outputs = Object.fromEntries(fs.readFileSync(salida, 'utf8').trim().split('\n').filter(Boolean).map(l => l.split('=')));
    let guardar = null;
    if (codigo === 0 && outputs.cambiado === 'true') {
      guardar = bash(bloque(FLUJO, 'Guardar la foto (un commit por día)'), { DATOS, FECHA: outputs.fecha });
      assert.equal(guardar.codigo, 0, guardar.texto);
    }
    return { codigo, outputs, registro, preparar, guardar };
  }
  const rama = (...a) => git(origen, ...a);
  return { dir, trabajo, origen, git, bash, ejecutar, rama };
}

test('flujo: crea la rama huérfana con la semilla, una foto por día, idempotente, y sin tocar main', async (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const mainAntes = repo.rama('rev-parse', 'main').trim();
  // Día 1: no hay rama. La foto del 10/11 ya está en la semilla: se crea el histórico con ella.
  let r = await repo.ejecutar({ fetchImpl: coingecko(), ahora: AHORA });
  assert.equal(r.codigo, 0, r.registro.join('\n'));
  assert.match(r.preparar.texto, /No existe la rama datos-tokenizacion: se crea a partir de la semilla de main\./);
  assert.deepEqual(r.outputs, { cambiado: 'true', fecha: '2026-11-10' });
  assert.equal(repo.rama('rev-list', '--count', 'datos-tokenizacion').trim(), '1');
  assert.equal(repo.rama('log', '-1', '--format=%P', 'datos-tokenizacion').trim(), '', 'huérfana: sin padre');
  assert.equal(repo.rama('ls-tree', '--name-only', 'datos-tokenizacion').trim(), 'tokenizacion-historico.json', 'solo el histórico, sin el código');
  assert.equal(repo.rama('log', '-1', '--format=%s', 'datos-tokenizacion').trim(), 'Foto de la tokenización del 2026-11-10 (datos: CoinGecko)');
  assert.equal(repo.rama('show', 'datos-tokenizacion:tokenizacion-historico.json'), fs.readFileSync(SEMILLA, 'utf8'));
  // Otra vez el mismo día: no cambia nada ni hace commit.
  r = await repo.ejecutar({ fetchImpl: coingecko('2026-11-10T18:00:00.000Z', 2), ahora: AHORA + 3 * 3600000 });
  assert.match(r.preparar.texto, /Rama datos-tokenizacion encontrada\./);
  assert.deepEqual(r.outputs, { cambiado: 'false', fecha: '2026-11-10' });
  assert.equal(r.guardar, null);
  assert.equal(repo.rama('rev-list', '--count', 'datos-tokenizacion').trim(), '1');
  // Día 2: una foto más, un commit más, encima del anterior.
  r = await repo.ejecutar({ fetchImpl: coingecko('2026-11-11T06:20:00.000Z', 1.01), ahora: Date.parse('2026-11-11T06:23:30Z') });
  assert.deepEqual(r.outputs, { cambiado: 'true', fecha: '2026-11-11' });
  assert.equal(repo.rama('rev-list', '--count', 'datos-tokenizacion').trim(), '2');
  const h = modelo.validarHistorico(JSON.parse(repo.rama('show', 'datos-tokenizacion:tokenizacion-historico.json')));
  assert.deepEqual(h.fotos.map(f => f.fecha), ['2026-11-10', '2026-11-11']);
  assert.equal(h.fotos[1].total.valor, Math.round(49683537033.1498 * 1.01));
  // Con dos fotos, la web ya dibuja la línea; los periodos siguen sin datos.
  const resumen = modelo.resumir({ historico: h });
  assert.equal(resumen.serie.length, 2);
  assert.equal(resumen.periodos[4].estado, 'ok');
  assert.equal(resumen.periodos[1].estado, 'sin-datos');
  assert.equal(repo.rama('rev-parse', 'main').trim(), mainAntes, 'main no cambia');
  // CoinGecko caído: termina con error y la rama no cambia.
  r = await repo.ejecutar({ fetchImpl: async () => new Response('{}', { status: 503 }), ahora: Date.parse('2026-11-12T06:23:30Z') });
  assert.equal(r.codigo, 1);
  assert.equal(repo.rama('rev-list', '--count', 'datos-tokenizacion').trim(), '2');
});

test('publicar.yml lleva el histórico de la rama fuera del árbol; sin rama, la semilla', async (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const traer = bloque(PUBLICAR, 'Traer el histórico de la tokenización');
  let r = repo.bash(traer);
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /Sin la rama datos-tokenizacion: se publica la semilla de main\./);
  assert.equal(r.entorno, '');
  await repo.ejecutar({ fetchImpl: coingecko(), ahora: AHORA });
  r = repo.bash(traer);
  assert.equal(r.codigo, 0, r.texto);
  const ruta = r.entorno.match(/^RWADAR_TOKENIZACION_HISTORICO=(.+)$/m)[1];
  assert.ok(!ruta.startsWith(repo.trabajo), 'fuera del repositorio: el árbol sigue limpio');
  assert.equal(fs.readFileSync(ruta, 'utf8'), fs.readFileSync(SEMILLA, 'utf8'));
  assert.equal(repo.git(repo.trabajo, 'status', '--porcelain').trim(), '');
  // El paso va antes de publicar y no toca nada más del flujo.
  assert.ok(PUBLICAR.indexOf('- name: Traer el histórico de la tokenización') < PUBLICAR.indexOf('- name: Publicar en'));
  assert.match(leer('rwadar-tokenizacion-historico.js'), /entorno\.RWADAR_TOKENIZACION_HISTORICO/);
  assert.match(PUBLICAR, /echo "datos-tokenizacion: \$\(git rev-parse FETCH_HEAD\)"/, 'el commit de la rama queda en el registro');
});

test('el generador de la web: variable de publicar.yml; sin ella, origin/datos-tokenizacion; si no, la semilla y aviso', async (t) => {
  const { historicoTokenizacion } = require('../rwadar-tokenizacion-historico.js');
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const dirSitio = path.join(repo.trabajo, 'rwadar-site');
  const semilla = fs.readFileSync(SEMILLA, 'utf8');
  const avisos = [];
  const generar = (entorno = {}, extra = {}) => historicoTokenizacion({ dirSitio, entorno, cwd: repo.trabajo, avisar: m => avisos.push(m), ...extra });
  // Sin variable ni rama: la semilla, marcada para el aviso de --preview/--produccion.
  let r = generar();
  assert.equal(r.soloSemilla, true);
  assert.equal(modelo.serializarHistorico(r.historico), semilla);
  assert.deepEqual(avisos, []);
  // La rama con dos días, y el clon la trae con «git fetch» (como en un ordenador).
  await repo.ejecutar({ fetchImpl: coingecko(), ahora: AHORA });
  await repo.ejecutar({ fetchImpl: coingecko('2026-11-11T06:20:00.000Z', 1.01), ahora: Date.parse('2026-11-11T06:23:30Z') });
  repo.git(repo.trabajo, 'update-ref', '-d', 'refs/remotes/origin/datos-tokenizacion');
  r = generar();
  assert.equal(r.soloSemilla, true, 'sin la ref local: la semilla');
  repo.git(repo.trabajo, 'fetch', '-q', 'origin', 'datos-tokenizacion');
  r = generar();
  assert.equal(r.origen, 'origin/datos-tokenizacion');
  assert.equal(r.soloSemilla, false);
  assert.deepEqual(r.historico.fotos.map(f => f.fecha), ['2026-11-10', '2026-11-11']);
  // La variable de publicar.yml manda sobre la ref.
  const archivo = path.join(repo.dir, 'h.json');
  fs.writeFileSync(archivo, semilla);
  r = generar({ RWADAR_TOKENIZACION_HISTORICO: archivo });
  assert.equal(r.origen, 'la rama datos-tokenizacion');
  assert.equal(r.historico.fotos.length, 1);
  // Un enlace simbólico no vale: la semilla, con aviso.
  const enlace = path.join(repo.dir, 'enlace.json');
  fs.symlinkSync(archivo, enlace);
  r = generar({ RWADAR_TOKENIZACION_HISTORICO: enlace });
  assert.equal(r.soloSemilla, true);
  assert.match(avisos.at(-1), /no es un archivo normal/);
  // Una ref con un histórico roto: la semilla, con aviso; nunca bloquea.
  r = generar({}, { leerRama: () => '{"roto": true}' });
  assert.equal(r.soloSemilla, true);
  assert.match(avisos.at(-1), /origin\/datos-tokenizacion no vale/);
  r = generar({}, { leerRama: () => '{"version":1,"fuente":"CoinGecko","fotos":[]}' });
  assert.equal(r.soloSemilla, true);
  assert.match(avisos.at(-1), /no tiene ninguna foto/);
  // Y el generador avisa bien alto si un destino remoto lleva solo la semilla.
  assert.match(leer('rwadar-publicar.js'), /soloSemilla && \(preview \|\| produccion\)[\s\S]{0,200}se publica solo la semilla[\s\S]{0,200}git fetch origin datos-tokenizacion/);
});

test('foto-diaria.mjs: reintentos con espera (Retry-After hasta 2 min), nada escrito si falla, histórico roto intacto, exige TLS', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-foto-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const esperas = []; let llamadas = 0;
  const foto = await pedirFoto({ ahora: () => AHORA, esperar: async ms => { esperas.push(ms); }, fetchImpl: async () => {
    llamadas++;
    if (llamadas === 1) return new Response('{}', { status: 429, headers: { 'Retry-After': '600' } });
    if (llamadas === 2) throw new TypeError('fetch failed');
    return coingecko()();
  } });
  assert.equal(foto.total.valor, 49683537033);
  assert.deepEqual(esperas, [120000, 45000]);
  const destino = path.join(dir, 'h.json');
  const registro = [];
  const base = { esperar: async () => {}, ahora: () => AHORA, log: m => registro.push(m), error: m => registro.push(m), entorno: {} };
  assert.equal(await principal([destino], { ...base, fetchImpl: async () => new Response('[]') }), 1);
  assert.match(registro.join('\n'), /Intento 3 de 3: CoinGecko: la respuesta no es una lista de categorías[\s\S]*No se escribe nada\./);
  assert.equal(fs.existsSync(destino), false);
  fs.writeFileSync(destino, '{"roto": true}');
  assert.equal(await principal([destino], { ...base, fetchImpl: coingecko() }), 1);
  assert.equal(fs.readFileSync(destino, 'utf8'), '{"roto": true}');
  assert.equal(await principal([path.join(dir, 'nuevo.json')], { ...base, fetchImpl: coingecko(), entorno: { NODE_TLS_REJECT_UNAUTHORIZED: '0' } }), 1);
  assert.equal(fs.existsSync(path.join(dir, 'nuevo.json')), false);
  assert.equal(await principal([], { ...base, fetchImpl: coingecko() }), 2);
  // Sin semilla ni histórico: empieza vacío y guarda la foto del día.
  assert.equal(await principal([path.join(dir, 'vacio.json')], { ...base, fetchImpl: coingecko() }), 0);
  assert.equal(modelo.validarHistorico(JSON.parse(fs.readFileSync(path.join(dir, 'vacio.json'), 'utf8'))).fotos.length, 1);
});
