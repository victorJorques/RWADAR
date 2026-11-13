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
  assert.match(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), /\[\[ "\$FECHA" =~ \^\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}\$ \]\]/);
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
      guardar = bash(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), { DATOS, FECHA: outputs.fecha });
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
  assert.equal(repo.rama('log', '-1', '--format=%s', 'datos-tokenizacion').trim(), 'Foto y serie de la tokenización del 2026-11-10 (datos: CoinGecko)');
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
  // El 11/11/2026 CoinGecko daba +124 % en 24 h para toda la categoría con el mercado plano: la foto lo guarda como null (CAMBIO_24H_MAX).
  const disparate = async () => new Response(JSON.stringify(JSON.parse(COINGECKO).map(c => ({ ...c, updated_at: '2026-11-10T15:25:40.000Z',
    ...(c.id === 'tokenized-products' ? { market_cap_change_24h: 124.415 } : {}) }))), { status: 200 });
  assert.equal(await principal([path.join(dir, 'disparate.json')], { ...base, fetchImpl: disparate }), 0);
  const guardada = modelo.validarHistorico(JSON.parse(fs.readFileSync(path.join(dir, 'disparate.json'), 'utf8'))).fotos[0];
  assert.equal(guardada.total.cambio24h, null, `nunca se guarda un cambio de ±${modelo.CAMBIO_24H_MAX} % o más en un día`);
  assert.equal(guardada.total.valor, 49683537033);
});

/* ---- La serie de un año del gráfico «estilo bolsa» (11/11/2026) ---- */
const { principal: principalSerie } = await import('../rwadar-app/tokenizacion/serie-diaria.mjs');
const DIA_MS = 86400000;
/* CoinGecko simulado: el total de la categoría, la lista de 45 tokens y un año y un día de market_caps de
   cada uno. Con «pesos», el valor de cada token de la lista (por defecto, (100 − i) × 1e8). */
const TOTAL_CATEGORIA = 4000e8;
/* Las finas (13/11/2026): con days=1, un punto cada 5 minutos en punto desde hace 24 horas y otro con la hora
   de la lectura («ahora»); con days=31, uno cada hora. «fallanFinas»: [id, '5m' | '1h'] que responden 429;
   «pesoFino(n)»: el valor del token n en las finas; «huecosFinos»: { id: [[desde, hasta], …] } sin datos. */
function coingeckoSerie({ fallan = [], listaFalla = false, conHueco = [], categoriaFalla = false, pesos = i => (100 - i) * 1e8, totalCategoria = TOTAL_CATEGORIA,
  fallanFinas = [], ahora = () => Date.parse('2026-11-11T07:03:20Z'), pesoFino = n => (100 - n) * 1e8 * 1.1, huecosFinos = {} } = {}) {
  const llamadas = [];
  const fin = Date.parse('2026-11-11T00:00:00Z');
  const fetchImpl = async (url) => {
    llamadas.push(url);
    if (url === modelo.FUENTE.api) {
      if (categoriaFalla) return new Response('{}', { status: 503 });
      return new Response(JSON.stringify([{ id: 'otra', market_cap: 1e12 }, { id: 'tokenized-products', market_cap: totalCategoria }]), { status: 200 });
    }
    if (url.includes('/coins/markets')) {
      if (listaFalla) return new Response('{}', { status: 503 });
      return new Response(JSON.stringify([...Array(45)].map((_, i) => ({ id: 'token-' + i, market_cap: pesos(i) }))), { status: 200 });
    }
    const id = url.match(/\/coins\/([a-z0-9-]+)\/market_chart/)[1];
    if (fallan.includes(id)) return new Response('{}', { status: 429, headers: { 'retry-after': '1' } });
    const n = Number(id.split('-')[1]);
    const fina = /days=1$/.test(url) ? '5m' : /days=31$/.test(url) ? '1h' : null;
    if (fina) {
      if (fallanFinas.some(([i, r]) => i === id && r === fina)) return new Response('Throttled', { status: 429, headers: { 'retry-after': '120' } });
      const lectura = ahora(), paso = fina === '5m' ? 300000 : 3600000, desde = lectura - (fina === '5m' ? 1 : 31) * DIA_MS;
      const valor = ms => Math.round(pesoFino(n) * (1 + Math.sin(ms / 7e6 + n) / 500));
      const puntos = [], sin = huecosFinos[id] || [];
      for (let ms = Math.ceil(desde / paso) * paso; ms <= lectura; ms += paso) if (!sin.some(([a, b]) => ms >= a && ms < b)) puntos.push([ms, valor(ms)]);
      puntos.push([lectura, valor(lectura)]);
      return new Response(JSON.stringify({ prices: puntos, market_caps: puntos, total_volumes: puntos }), { status: 200 });
    }
    // Con hueco: CoinGecko no da 12 días seguidos de su historia (del día 200 al 211).
    // Como la API pública con days=365: del día de hace 364 a hoy (a days=366 responde 401).
    const puntos = [...Array(365)].map((_, k) => [fin - (364 - k) * DIA_MS, (100 - n) * 1e8 * (1 + k / 3650)]).filter((_, k) => !conHueco.includes(id) || k < 201 || k > 212);
    return new Response(JSON.stringify({ market_caps: puntos }), { status: 200 });
  };
  return { fetchImpl, llamadas };
}

test('serie diaria: 42 llamadas con pausa (el total de la categoría, la lista y los 40 mayores), un punto por día y su resumen; exige TLS', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-serie-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'tokenizacion-serie.json'), salida = path.join(dir, 'salida');
  fs.writeFileSync(salida, '');
  const { fetchImpl, llamadas } = coingeckoSerie();
  const pausas = [], registro = [];
  const codigo = await principalSerie([destino], { entorno: { GITHUB_OUTPUT: salida }, fetchImpl, esperar: async ms => { pausas.push(ms); },
    ahora: () => Date.parse('2026-11-11T07:00:00Z'), log: m => registro.push(m), error: m => registro.push(m) });
  assert.equal(codigo, 0, registro.join('\n'));
  assert.equal(llamadas.length, 42);
  assert.equal(llamadas[0], modelo.FUENTE.api, 'primero, el total de la categoría: el denominador de las cuotas');
  assert.match(llamadas[1], /category=tokenized-products&order=market_cap_desc&per_page=250$/);
  assert.ok(llamadas.slice(2).every(u => /\/market_chart\?vs_currency=usd&days=365&interval=daily$/.test(u)), 'un año: la API pública no da más (401 a days=366)');
  assert.equal(pausas.filter(ms => ms === 13000).length, 41, '13 s entre llamadas');
  const serie = modelo.validarSerie(JSON.parse(fs.readFileSync(destino, 'utf8')));
  assert.equal(fs.readFileSync(destino, 'utf8'), modelo.serializarSerie(serie));
  assert.deepEqual([serie.pedidos, serie.incluidos, serie.discontinuos, serie.puntos.length, serie.puntos.at(-1).fecha], [40, 40, 0, 365, '2026-11-11']);
  assert.equal(serie.puntos[0].fecha, '2025-11-12', '«1 A»: los 365 días que da la API pública');
  const sumaMayores = [...Array(40)].reduce((s, _, i) => s + (100 - i) * 1e8, 0);
  assert.equal(serie.cobertura, Math.round(sumaMayores / TOTAL_CATEGORIA * 1000) / 10, 'la cuota, sobre el total de la categoría');
  assert.equal(fs.readFileSync(salida, 'utf8'), 'serie=true\n');
  assert.match(registro.at(-1), /^Serie del mercado: 365 días, del 12\/11\/2025 al 11\/11\/2026; 40 de 40 tokens .*0 fuera por huecos/);
  assert.equal(await principalSerie([destino], { entorno: { NODE_TLS_REJECT_UNAUTHORIZED: '0' }, error: () => {} }), 1);
  // Sin el total de la categoría, la cuota usa la suma de la lista y el registro lo dice; la serie sale igual.
  const sinCategoria = [];
  assert.equal(await principalSerie([destino], { entorno: {}, fetchImpl: coingeckoSerie({ categoriaFalla: true }).fetchImpl, esperar: async () => {},
    ahora: () => Date.parse('2026-11-11T07:00:00Z'), log: m => sinCategoria.push(m), error: m => sinCategoria.push(m) }), 0);
  assert.ok(sinCategoria.some(l => /Total de la categoría: no se pudo leer .*la suma de la lista/.test(l)), sinCategoria.join('\n'));
});

test('serie diaria: si falla un token de menos del 1 % entra sin él y lo dice; si falla la lista o los que fallan pesan más del 1 %, conserva la anterior (código 3)', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-serie-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'tokenizacion-serie.json');
  const opciones = (fetchImpl, salida) => ({ entorno: { GITHUB_OUTPUT: salida }, fetchImpl, esperar: async () => {}, ahora: () => Date.parse('2026-11-11T07:00:00Z'), log: () => {}, error: () => {} });
  const salida = path.join(dir, 'salida');
  fs.writeFileSync(salida, '');
  // token-39 pesa 61e8 de un total de 4.000e8: el 1,5 %. Con un 1 % de tope, no entra sin él (QA del 11/11/2026: con un 5 %,
  // si fallaba Ondo, del 4,8 %, salía una serie con un −5,6 % de golpe que el mercado no había tenido).
  assert.equal(await principalSerie([destino], opciones(coingeckoSerie({ fallan: ['token-39'] }).fetchImpl, salida)), 3);
  assert.equal(fs.existsSync(destino), false, 'nada escrito');
  fs.writeFileSync(salida, '');
  // Un token mayor muy grande y los demás pequeños: token-39 pesa el 0,25 % y la serie entra sin él.
  const pesos = i => (i === 0 ? 2000e8 : (100 - i) * 1e8 / 10);
  assert.equal(await principalSerie([destino], opciones(coingeckoSerie({ fallan: ['token-39'], pesos, totalCategoria: 2400e8 }).fetchImpl, salida)), 0);
  const serie = modelo.validarSerie(JSON.parse(fs.readFileSync(destino, 'utf8')));
  assert.deepEqual([serie.pedidos, serie.incluidos], [40, 39]);
  assert.ok(!serie.tokens.includes('token-39'));
  assert.match(modelo.notaSerie(serie), /^Suma de 39 de los 40 mayores .* No se pudo leer 1\.$/);
  const antes = fs.readFileSync(destino, 'utf8');
  fs.writeFileSync(salida, '');
  assert.equal(await principalSerie([destino], opciones(coingeckoSerie({ listaFalla: true }).fetchImpl, salida)), 3);
  assert.equal(await principalSerie([destino], opciones(coingeckoSerie({ fallan: ['token-0', 'token-1'] }).fetchImpl, salida)), 3);
  // Uno de entre el 1 % y el 5 % (como Ondo, el 4,8 %): también se conserva la anterior.
  assert.equal(await principalSerie([destino], opciones(coingeckoSerie({ fallan: ['token-20'], pesos: i => (i === 20 ? 190e8 : (100 - i) * 1e8) }).fetchImpl, salida)), 3);
  assert.equal(fs.readFileSync(destino, 'utf8'), antes, 'la serie anterior se conserva');
  assert.equal(fs.readFileSync(salida, 'utf8'), 'serie=false\nserie=false\nserie=false\n');
});

test('el flujo rehace la serie y las finas sin bloquear la foto y publicar.yml las trae de la rama', () => {
  const pasoSerie = paso(FLUJO, 'Rehacer la serie de un año y las finas (cada 5 minutos y cada hora)');
  assert.match(pasoSerie, /continue-on-error: true/);
  const limitePaso = Number(pasoSerie.match(/^\s*timeout-minutes: (\d+)\s*$/m)?.[1]);
  const limiteTrabajo = Number(FLUJO.match(/^    timeout-minutes: (\d+)\s*$/m)?.[1]);
  assert.ok(limitePaso > 0, 'el paso de la serie tiene su propio timeout-minutes');
  // Las constantes del script, las del encargo: 13 s entre llamadas (con 3 s CoinGecko daba 429), un 1 % de pérdida como
  // mucho y sus dos plazos: la diaria no empieza llamadas pasados 20 minutos ni las finas pasados 34.
  const script = leer('rwadar-app/tokenizacion/serie-diaria.mjs');
  assert.match(script, /^const PAUSA_MS = 13000;$/m);
  assert.match(script, /^const PERDIDA_MAX_PCT = 1;$/m);
  const plazo = nombre => Number(script.match(new RegExp(`^const ${nombre} = (\\d+) \\* 60000;$`, 'm'))?.[1]);
  const [diaria, finas] = [plazo('PLAZO_DIARIA_MS'), plazo('PLAZO_FINA_MS')];
  // Unas 102 llamadas (42 de la diaria y dos por cada uno de los ~30 que entran) con 13 s: unos 9 + 13 minutos.
  assert.ok(diaria >= 14 && diaria < finas, `la diaria tiene de 14 minutos en adelante (${diaria}) y menos que las finas`);
  assert.ok(finas >= 9 + 2 * 40 * 13 / 60, `las finas caben con 40 tokens que entren (${finas} min)`);
  // Una llamada con sus reintentos dura como mucho 5 minutos (3 de 20 s y dos esperas de 2 minutos): cabe antes del límite del paso.
  assert.ok(limitePaso >= finas + 5 + 1, `el paso (${limitePaso}) deja acabar la última llamada de las finas (${finas} + 5)`);
  assert.ok(limitePaso + 5 <= limiteTrabajo, `el paso (${limitePaso}) deja tiempo a la foto y a guardar en el trabajo (${limiteTrabajo})`);
  assert.ok(limiteTrabajo <= 60, `el trabajo, una hora como mucho (${limiteTrabajo})`);
  assert.match(pasoSerie, /node rwadar-app\/tokenizacion\/serie-diaria\.mjs "\$DATOS\/tokenizacion-serie\.json"\n\s+--fina "\$DATOS\/tokenizacion-serie-fina\.json"/);
  // Guardar: siempre que la foto haya ido bien (si el paso de las series se cortó, la diaria ya escrita se guarda igual).
  assert.doesNotMatch(paso(FLUJO, 'Guardar la foto y la serie (un commit por día)'), /^\s+if:/m);
  assert.match(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), /git add tokenizacion-serie\.json/);
  assert.match(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), /if \[ -f tokenizacion-serie-fina\.json \]; then git add tokenizacion-serie-fina\.json; fi/);
  assert.match(PUBLICAR, /git show FETCH_HEAD:tokenizacion-serie\.json > "\$RUNNER_TEMP\/tokenizacion-serie\.json"/);
  assert.match(PUBLICAR, /RWADAR_TOKENIZACION_SERIE=\$RUNNER_TEMP\/tokenizacion-serie\.json/);
  assert.match(PUBLICAR, /git show FETCH_HEAD:tokenizacion-serie-fina\.json > "\$RUNNER_TEMP\/tokenizacion-serie-fina\.json"/);
  assert.match(PUBLICAR, /RWADAR_TOKENIZACION_SERIE_FINA=\$RUNNER_TEMP\/tokenizacion-serie-fina\.json/);
});

test('serie diaria: un token al que CoinGecko le faltan más de 3 días queda fuera de toda la serie (sin días cortados ni hundimientos) y la nota lo dice', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-serie-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const destino = path.join(dir, 'tokenizacion-serie.json'), registro = [];
  const codigo = await principalSerie([destino], { entorno: {}, fetchImpl: coingeckoSerie({ conHueco: ['token-5'] }).fetchImpl, esperar: async () => {},
    ahora: () => Date.parse('2026-11-11T07:00:00Z'), log: m => registro.push(m), error: m => registro.push(m) });
  assert.equal(codigo, 0, registro.join('\n'));
  const serie = modelo.validarSerie(JSON.parse(fs.readFileSync(destino, 'utf8')));
  assert.deepEqual([serie.incluidos, serie.discontinuos, serie.puntos.length], [39, 1, 365]);
  assert.ok(!serie.tokens.includes('token-5'));
  assert.ok(registro.some(l => /token-5: fuera, le faltan 9 días en CoinGecko/.test(l)), registro.join('\n'));
  assert.match(modelo.notaSerie(serie), /Quedan fuera 1 a los que les faltan días en CoinGecko\.$/);
  // Sin días cortados: cada día suma los mismos 39.
  assert.ok(serie.puntos.every(p => p.tokens === 39));
});

/* ---- Las series finas (13/11/2026): cada 5 minutos (24 h) y cada hora (30 días) ---- */
const LECTURA_FINA = Date.parse('2026-11-11T07:03:20Z');
const ejecutarFina = async (dir, opciones = {}, { fetch: f = coingeckoSerie(opciones).fetchImpl, ahora = () => LECTURA_FINA, esperar = async () => {} } = {}) => {
  const salida = path.join(dir, 'salida'), registro = [];
  fs.writeFileSync(salida, '');
  const codigo = await principalSerie([path.join(dir, 'tokenizacion-serie.json'), '--fina', path.join(dir, 'tokenizacion-serie-fina.json')],
    { entorno: { GITHUB_OUTPUT: salida }, fetchImpl: f, esperar, ahora, log: m => registro.push(m), error: m => registro.push(m) });
  return { codigo, registro, outputs: fs.readFileSync(salida, 'utf8') };
};

test('series finas: con --fina, 42 llamadas de la diaria y 80 más (las de cada hora y después, seguidas, las de 5 minutos), con 13 s; los mismos tokens y las tres acaban en el mismo punto', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fina-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const { fetchImpl, llamadas } = coingeckoSerie();
  const pausas = [];
  const r = await ejecutarFina(dir, {}, { fetch: fetchImpl, esperar: async ms => { pausas.push(ms); } });
  assert.equal(r.codigo, 0, r.registro.join('\n'));
  assert.equal(llamadas.length, 42 + 80);
  assert.ok(llamadas.slice(2, 42).every(u => /days=365&interval=daily$/.test(u)));
  assert.ok(llamadas.slice(42, 82).every(u => /\/market_chart\?vs_currency=usd&days=31$/.test(u)), 'primero, las de cada hora');
  assert.ok(llamadas.slice(82).every(u => /\/market_chart\?vs_currency=usd&days=1$/.test(u)), 'al final y seguidas, las de 5 minutos');
  assert.deepEqual(llamadas.slice(82).map(u => u.match(/coins\/([^/]+)/)[1]), llamadas.slice(2, 42).map(u => u.match(/coins\/([^/]+)/)[1]), 'los mismos tokens, en el mismo orden');
  assert.equal(pausas.filter(ms => ms === 13000).length, 41 + 80, '13 s entre todas las llamadas');
  const serie = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8')));
  const textoFina = fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8');
  const fina = modelo.validarSerieFina(JSON.parse(textoFina));
  assert.equal(textoFina, modelo.serializarSerieFina(fina));
  assert.equal(fina.generado, serie.generado, 'de la misma ejecución');
  assert.deepEqual(fina.tokens, serie.tokens, 'los mismos tokens que la diaria');
  // 24 horas justas hasta el cubo de la lectura (07:03:20, cubo de las 07:00). CoinGecko con days=1 empieza a las 07:05:
  // el cubo de las 07:00 de ayer sale del dato de esa hora de la lectura horaria.
  assert.deepEqual([fina.series['5m'].puntos.length, fina.series['1h'].puntos.length], [289, 721]);
  assert.deepEqual([fina.series['5m'].puntos[0][0], fina.series['5m'].puntos.at(-1)[0]], ['2026-11-10T07:00Z', '2026-11-11T07:00Z']);
  assert.deepEqual(['5m', '1h'].map(r => [fina.series[r].fuera, fina.series[r].valorFuera, fina.series[r].largos, fina.series[r].arrastre]),
    [[[], 0, [], 288], [[], 0, [], 72]]);
  assert.deepEqual([fina.series['1h'].puntos[0][0], fina.series['1h'].puntos.at(-1)[0]], ['2026-10-12T07:00Z', '2026-11-11T07:00Z']);
  // Las tres acaban en el mismo valor exacto: el último dato de cada token (el de la lectura de 5 minutos), también la diaria.
  const fin = serie.puntos.at(-1);
  assert.equal(fin.fecha, '2026-11-11');
  assert.equal(fina.series['5m'].puntos.at(-1)[1], fin.valor);
  assert.equal(fina.series['1h'].puntos.at(-1)[1], fin.valor);
  const valorLectura = n => Math.round((100 - n) * 1e8 * 1.1 * (1 + Math.sin(LECTURA_FINA / 7e6 + n) / 500));
  assert.equal(fin.valor, Math.round([...Array(40)].reduce((s, _, n) => s + valorLectura(n), 0)), 'la diaria, rehecha con el último dato de cada token');
  assert.deepEqual(Object.keys(modelo.seriesEnlazadas(serie, fina)), ['5m', '1h']);
  const unida = modelo.unirSerieFina(serie, fina);
  assert.equal(modelo.cifraGrande(unida).valor, fin.valor);
  for (const p of modelo.PESTANAS) assert.equal(modelo.graficoPestana(unida, p.clave).estadisticas.fin, fin.valor, `${p.clave}: acaba en la cifra grande`);
  assert.equal(r.outputs, 'serie=true\nfina=true\n');
  assert.match(r.registro.at(-1), /^Series finas: cada 5 minutos, 289 puntos; cada hora, 721 puntos; 40 tokens, los de la diaria; \d+\.\d kB\. Las tres acaban en /);
  assert.ok(r.registro.includes('Serie de 5m: 289 puntos, del 2026-11-10 07:00 UTC al 2026-11-11 07:00 UTC; fuera: ninguno; más de una hora sin dato: ninguno.'), r.registro.join('\n'));
  assert.ok(Buffer.byteLength(textoFina) < 64 * 1024, `${(Buffer.byteLength(textoFina) / 1024).toFixed(1)} kB`);
});

test('series finas: si falla una, se guarda la otra; si fallan las dos, queda la diaria nueva y la fina anterior, que ya no casa y no se usa', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fina-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Un token del 2,9 % sin su historia de 5 minutos: quedaría fuera y pesa más del 1 %: la de 5 minutos no se guarda; la horaria, sí.
  let r = await ejecutarFina(dir, { fallanFinas: [['token-7', '5m']] });
  assert.equal(r.codigo, 0, r.registro.join('\n'));
  let fina = modelo.validarSerieFina(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8')));
  assert.equal(fina.series['5m'], null);
  assert.equal(fina.series['1h'].puntos.length, 721);
  assert.ok(r.registro.some(l => /Serie de 5m: no se guarda \(serie fina 5m: los que quedan fuera \(token-7\) pesan el 2\.89 % \(como mucho 1 %\)\)\./.test(l)), r.registro.join('\n'));
  let serie = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8')));
  assert.deepEqual(Object.keys(modelo.seriesEnlazadas(serie, fina)), ['1h']);
  // Sin la de 5 minutos, 24 h sale de la horaria (25 puntos), no de la diaria (que serían dos).
  assert.deepEqual(['1d', '1s', '1m', '3m'].map(c => modelo.seriePestana(modelo.unirSerieFina(serie, fina), c).resolucion), ['1h', '1h', '1h', '1d']);
  assert.equal(modelo.seriePestana(modelo.unirSerieFina(serie, fina), '1d').puntos.length, 25);
  // Las dos fallan: la diaria de esta ejecución se escribe igual; la fina de antes se queda tal cual y ya no casa con ella.
  const finaAntes = fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8');
  r = await ejecutarFina(dir, { fallanFinas: [['token-3', '5m'], ['token-3', '1h']] }, { ahora: () => LECTURA_FINA + 3600000 });
  assert.equal(r.codigo, 0, 'la diaria salió: el paso no falla');
  assert.equal(r.outputs, 'serie=true\nfina=false\n');
  assert.match(r.registro.join('\n'), /Series finas: no se pudieron rehacer \(no sale ninguna serie fina\)\. Queda la anterior; la diaria ya está guardada\./);
  assert.equal(fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8'), finaAntes, 'nada escrito a medias');
  serie = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8')));
  assert.equal(serie.generado, '2026-11-11T08:03:20Z', 'la diaria nueva');
  assert.deepEqual(modelo.seriesEnlazadas(serie, JSON.parse(finaAntes)), {});
  assert.equal(modelo.unirSerieFina(serie, JSON.parse(finaAntes)).fina, undefined, 'el gráfico usa la diaria');
  // Si falla la diaria, no se piden las finas ni se escribe nada (código 3, como siempre).
  const { fetchImpl, llamadas } = coingeckoSerie({ listaFalla: true });
  const diariaAntes = fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8');
  r = await ejecutarFina(dir, {}, { fetch: fetchImpl });
  assert.equal(r.codigo, 3);
  assert.ok(!llamadas.some(u => /days=(1|31)$/.test(u)));
  assert.equal(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8'), diariaAntes);
  assert.equal(fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8'), finaAntes);
  // Uso: --fina necesita su ruta .json y no puede ser la de la diaria.
  const a = path.join(dir, 'a.json');
  for (const argv of [[a, '--fina'], [a, '--fina', path.join(dir, 'b.txt')], [a, '--fina', a]]) {
    assert.equal(await principalSerie(argv, { entorno: {}, error: () => {} }), 2, argv.join(' '));
  }
});

test('series finas: con datos como los reales (el mayor, horas sin datos; uno pequeño, sin leer), salen las dos, con los mismos tokens, y casan con la diaria', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fina-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // token-0 (el mayor, como figure-heloc el 13/11/2026): 3 h 35 min sin datos en las dos lecturas finas y 23 horas
  // en la horaria (un fin de semana). token-39: 50 M$ (un 0,01 %) y su lectura de 5 minutos falla.
  const huecosFinos = { 'token-0': [[Date.parse('2026-11-10T20:20:00Z'), Date.parse('2026-11-10T23:55:00Z')],
    [Date.parse('2026-11-01T14:00:00Z'), Date.parse('2026-11-02T13:00:00Z')]] };
  const pesoFino = n => (n === 39 ? 50e6 : (100 - n) * 1e8 * 1.1);
  // Un reloj que avanza 13 s con cada pausa, como de verdad: la lectura horaria de cada token es unos 9 minutos
  // anterior a la de 5 minutos, y las tres series tienen que acabar en el dato más reciente de cada uno.
  let ms = LECTURA_FINA;
  const reloj = { ahora: () => ms, esperar: async e => { ms += e; } };
  const r = await ejecutarFina(dir, { huecosFinos, pesoFino, fallanFinas: [['token-39', '5m']], ahora: reloj.ahora },
    { ...reloj, fetch: coingeckoSerie({ huecosFinos, pesoFino, fallanFinas: [['token-39', '5m']], ahora: reloj.ahora }).fetchImpl });
  assert.equal(r.codigo, 0, r.registro.join('\n'));
  assert.equal(r.outputs, 'serie=true\nfina=true\n');
  const serie = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8')));
  const fina = modelo.validarSerieFina(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8')));
  assert.deepEqual(fina.tokens, serie.tokens, 'los mismos 40 tokens que la diaria');
  const f5 = fina.series['5m'], f1 = fina.series['1h'];
  assert.deepEqual([f5.fuera, f5.largos, f1.fuera, f1.largos], [['token-39'], ['token-0'], [], ['token-0']]);
  assert.deepEqual([f5.puntos.length, f1.puntos.length], [289, 721]);
  assert.ok(f5.puntos.every(p => p[2] === 39) && f1.puntos.every(p => p[2] === 40), 'cada serie, siempre con los mismos');
  // Las tres acaban en el último dato de cada token: la de 5 minutos, menos lo que vale token-39 (su dato de la horaria).
  const fin = serie.puntos.at(-1).valor;
  assert.equal(f1.puntos.at(-1)[1], fin);
  assert.ok(f5.valorFuera > 49e6 && f5.valorFuera < 51e6, String(f5.valorFuera));
  assert.ok(Math.abs(f5.puntos.at(-1)[1] + f5.valorFuera - fin) <= 1, 'la de 5 minutos más los de fuera: la diaria');
  assert.deepEqual(Object.keys(modelo.seriesEnlazadas(serie, fina)), ['5m', '1h']);
  const unida = modelo.unirSerieFina(serie, fina);
  assert.equal(modelo.cifraGrande(unida).valor, fin);
  assert.equal(modelo.graficoPestana(unida, '1d').estadisticas.fin, f5.puntos.at(-1)[1]);
  assert.match(modelo.graficoPestana(unida, '1d').avisoFuera, /^la línea suma 39 de los 40: queda fuera 1 token/);
  assert.ok(r.registro.some(l => /^Serie de 5m: 289 puntos, .+; fuera: token-39 \(50,\d.M\$\); más de una hora sin dato: token-0\.$/.test(l)), r.registro.join('\n'));
  assert.ok(r.registro.includes('Serie de 1h: 721 puntos, del 2026-10-12 07:00 UTC al 2026-11-11 07:00 UTC; fuera: ninguno; más de una hora sin dato: token-0.'), r.registro.join('\n'));
  assert.ok(r.registro.some(l => /^· token-39 \(5m\): no se pudo leer \(CoinGecko respondió 429\); queda fuera de esa serie$/.test(l)));
});

test('series finas: plazos; la diaria no empieza llamadas pasados 20 minutos (código 3, nada escrito) y las finas, pasados 34 (queda la diaria)', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fina-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Un reloj que avanza con cada espera: 13 s por pausa y 2 minutos por cada 429 con Retry-After.
  const reloj = () => { let ms = LECTURA_FINA; return { ahora: () => ms, esperar: async e => { ms += e; } }; };
  // Con todo bien: unos 26 minutos de pausas (121 × 13 s), dentro de los plazos.
  let c = reloj();
  let r = await ejecutarFina(dir, {}, { ...c, fetch: coingeckoSerie({ ahora: c.ahora }).fetchImpl });
  assert.equal(r.outputs, 'serie=true\nfina=true\n', r.registro.join('\n'));
  assert.ok(c.ahora() - LECTURA_FINA < 27 * 60000);
  // Los de 5 minutos de 30 tokens con 429 (dos esperas de 2 minutos cada uno): las finas pasan de 34 minutos y se paran.
  const diaria = fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8'), fina = fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8');
  c = reloj();
  const lentas = [...Array(30)].map((_, i) => ['token-' + i, '5m']);
  r = await ejecutarFina(dir, {}, { ...c, fetch: coingeckoSerie({ ahora: c.ahora, fallanFinas: lentas }).fetchImpl });
  assert.equal(r.codigo, 0);
  assert.equal(r.outputs, 'serie=true\nfina=false\n');
  assert.match(r.registro.join('\n'), /Series finas: no se pudieron rehacer \(se acabó el tiempo para las series finas\)/);
  assert.notEqual(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8'), diaria, 'la diaria de esta ejecución, guardada');
  assert.equal(fs.readFileSync(path.join(dir, 'tokenizacion-serie-fina.json'), 'utf8'), fina, 'la fina anterior, intacta');
  // La diaria con 6 tokens lentos (también 429): pasados 20 minutos no empieza más llamadas y no escribe nada.
  const antes = fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8');
  c = reloj();
  const cuenta = coingeckoSerie({ ahora: c.ahora });
  const lenta = async url => (/coins\/token-[0-5]\/market_chart/.test(url) && /days=365/.test(url)
    ? new Response('Throttled', { status: 429, headers: { 'retry-after': '120' } }) : cuenta.fetchImpl(url));
  r = await ejecutarFina(dir, {}, { ...c, fetch: lenta });
  assert.equal(r.codigo, 3);
  assert.match(r.registro.join('\n'), /No se pudo reconstruir la serie: se acabó el tiempo para la serie diaria\. Se conserva la anterior\./);
  assert.equal(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8'), antes);
});

test('el generador de la web: la fina de la rama solo se publica si casa con la diaria publicada; si no, «sin serie fina» y el gráfico usa la diaria', async (t) => {
  const { serieFinaTokenizacion } = require('../rwadar-tokenizacion-historico.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-fina-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  await ejecutarFina(dir);
  const diaria = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dir, 'tokenizacion-serie.json'), 'utf8')));
  const archivo = path.join(dir, 'tokenizacion-serie-fina.json'), texto = fs.readFileSync(archivo, 'utf8');
  const dirSitio = path.join(raiz, 'rwadar-site');
  const avisos = [];
  const generar = (entorno = {}, extra = {}) => serieFinaTokenizacion({ dirSitio, diaria, entorno, avisar: m => avisos.push(m), leerRama: () => { throw new Error('sin rama'); }, ...extra });
  // La de publicar.yml, que casa: tal cual.
  let r = generar({ RWADAR_TOKENIZACION_SERIE_FINA: archivo });
  assert.deepEqual(r.enlazadas, ['5m', '1h']);
  assert.equal(modelo.serializarSerieFina(r.fina), texto);
  assert.equal(r.origen, 'la rama datos-tokenizacion');
  // Sin variable, la ref; sin ref, «sin serie fina» para esta diaria.
  r = generar({}, { leerRama: () => texto });
  assert.equal(r.origen, 'origin/datos-tokenizacion');
  r = generar();
  assert.deepEqual([r.enlazadas, r.fina.series, r.fina.generado], [[], { '5m': null, '1h': null }, diaria.generado]);
  // La de otra ejecución (la diaria publicada es la semilla de main): «sin serie fina», con aviso.
  const semilla = modelo.validarSerie(JSON.parse(fs.readFileSync(path.join(dirSitio, 'datos/tokenizacion-serie.json'), 'utf8')));
  r = serieFinaTokenizacion({ dirSitio, diaria: semilla, entorno: { RWADAR_TOKENIZACION_SERIE_FINA: archivo }, avisar: m => avisos.push(m) });
  assert.deepEqual(r.fina, modelo.serieFinaVacia(semilla));
  assert.match(avisos.at(-1), /no casa con la diaria que se publica/);
  // La semilla de main es «sin serie fina» de la diaria semilla, escrita con serializarSerieFina.
  const textoSemilla = fs.readFileSync(path.join(dirSitio, 'datos/tokenizacion-serie-fina.json'), 'utf8');
  assert.equal(textoSemilla, modelo.serializarSerieFina(modelo.serieFinaVacia(semilla)));
  // Rota, un enlace o demasiado grande: «sin serie fina», con aviso; nunca bloquea.
  const roto = path.join(dir, 'roto.json');
  fs.writeFileSync(roto, '{"version":1}');
  r = generar({ RWADAR_TOKENIZACION_SERIE_FINA: roto });
  assert.deepEqual(r.enlazadas, []);
  assert.match(avisos.at(-1), /no vale \(serie fina: forma no válida\); se publica sin serie fina/);
  const enlace = path.join(dir, 'enlace.json');
  fs.symlinkSync(archivo, enlace);
  generar({ RWADAR_TOKENIZACION_SERIE_FINA: enlace });
  assert.match(avisos.at(-1), /no es un archivo normal/);
  // Solo una casa: se publica esa y la otra, null.
  const f = JSON.parse(texto);
  f.series['5m'].puntos.at(-1)[1] += 1e9;
  r = generar({}, { leerRama: () => JSON.stringify(f) });
  assert.deepEqual(r.enlazadas, ['1h']);
  assert.equal(r.fina.series['5m'], null);
  // rwadar-publicar.js la escribe en /datos/ junto a la diaria, y está en la lista de lo publicable.
  const publicador = leer('rwadar-publicar.js');
  assert.match(publicador, /serieFinaTokenizacion\(\{ dirSitio: DIR, diaria: serie\.serie \}\)[\s\S]{0,200}'tokenizacion-serie-fina\.json'\), textoFina/);
  const { ARCHIVOS_PUBLICABLES } = require('../rwadar-publicacion-segura.js');
  assert.ok(ARCHIVOS_PUBLICABLES.includes('datos/tokenizacion-serie-fina.json'));
  assert.match(leer('.github/comprobar-publicado.mjs'), /\/datos\/tokenizacion-serie-fina\.json es el del build y casa con la diaria/);
});

test('guardar: con la fina en la carpeta de datos, el commit del día la lleva', async (t) => {
  const repo = repoDePrueba();
  t.after(() => fs.rmSync(repo.dir, { recursive: true, force: true }));
  const { preparar } = await repo.ejecutar({ fetchImpl: coingecko(), ahora: AHORA });
  const DATOS = preparar.entorno.match(/^DATOS=(.+)$/m)[1];
  await ejecutarFina(DATOS);
  const guardar = repo.bash(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), { DATOS, FECHA: '2026-11-11' });
  assert.equal(guardar.codigo, 0, guardar.texto);
  assert.deepEqual(repo.rama('ls-tree', '--name-only', 'datos-tokenizacion').trim().split('\n'),
    ['tokenizacion-historico.json', 'tokenizacion-serie-fina.json', 'tokenizacion-serie.json']);
  assert.equal(modelo.serieFinaValida(JSON.parse(repo.rama('show', 'datos-tokenizacion:tokenizacion-serie-fina.json'))), true);
  // Otra vez sin cambios: nada que guardar.
  const otra = repo.bash(bloque(FLUJO, 'Guardar la foto y la serie (un commit por día)'), { DATOS, FECHA: '2026-11-11' });
  assert.match(otra.texto, /Nada nuevo que guardar\./);
});
