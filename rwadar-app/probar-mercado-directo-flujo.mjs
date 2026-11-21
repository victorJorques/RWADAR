/* =====================================================================
   RWAdar · el flujo «Mercado en directo (base)» y la siembra, de verdad
   ---------------------------------------------------------------------
   - sembrar-directo.mjs con un CoinGecko y una web de pega: qué pide (y
     con qué pausa), qué SQL escribe (lo mismo que el flujo diario pasaría a
     construirSerieFina), qué hace si un token o la diaria fallan.
   - Los pasos de .github/workflows/mercado-directo-base.yml se ejecutan con
     bash tal cual salen del YAML, con un doble de psql que pasa cada orden
     a PGlite (y después hace de pg_net), y dobles de node (la siembra),
     sleep y curl: ensayo-35 (no deja nada), aplicar-35, verificar-35,
     ensayo-37 (no deja nada), aplicar-37, verificar-37 (el arreglo de la
     secuencia de tokens, 20/11), ensayo-39 (no deja nada), aplicar-39,
     verificar-39 (las esperas sin desbordarse, 21/11), probar-coingecko,
     sembrar, encender, estado, apagar y deshacer; sin DIRECTO, las que
     cambian no hacen nada; con las dos copias de la 35 (o de la 37 o de la
     39) distintas, para.
   - El paso nuevo del flujo diario («Comprobar el gráfico en directo»).
       node probar-mercado-directo-flujo.mjs
   ===================================================================== */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { baseDirecto, leer, valor, filas, URL_MERCADOS, URL_DIARIA, RELOJ_PRUEBA } from './mercado-directo-soporte.mjs';
import { informe } from './pruebas-soporte.mjs';
import { sembrar, principal as principalSiembra, observacionesSiembra } from './tokenizacion/sembrar-directo.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const raiz = path.dirname(fileURLToPath(import.meta.url));
const raizRepo = path.join(raiz, '..');
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const t0 = performance.now();
const FLUJO = fs.readFileSync(path.join(raizRepo, '.github/workflows/mercado-directo-base.yml'), 'utf8');
const DIARIO = fs.readFileSync(path.join(raizRepo, '.github/workflows/tokenizacion-diaria.yml'), 'utf8');
const sinAlmohadillas = (t) => t.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-mercado-directo-'));

/* ---------- 1 · La siembra con un CoinGecko de pega ---------- */
const AHORA = Date.parse('2026-11-14T10:00:00Z');
const DIARIA = JSON.parse(leer('tokenizacion/prueba-serie-20261113.json'));
const caps = (desde, paso, n, base) => Array.from({ length: n }, (_, i) => [desde + i * paso, base * (1 + i / 1e5) + 0.5]);
// 50 tokens: los 30 de la diaria y 20 más; los 40 mayores son los 30 de la diaria y tok-31..tok-40.
const LISTA = [...DIARIA.tokens, ...Array.from({ length: 20 }, (_, i) => `otro-${i + 1}`)].map((id, i) => ({ id, market_cap: 1e10 / (i + 1), last_updated: new Date(AHORA - 70000).toISOString() }));
const pedidas = [];
// falla: los ids que fallan en days=31 y days=1; falla5m: solo en days=1.
const fetchPega = ({ falla = [], falla5m = [], sinDiaria = false } = {}) => async (url) => {
  pedidas.push(url);
  const json = (x, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'content-type': 'application/json' } });
  if (url === URL_DIARIA) return sinDiaria ? json({}, 503) : json(DIARIA);
  if (url === modelo.SERIE.apiMercados) return json(LISTA);
  const m = /\/coins\/([a-z0-9-]+)\/market_chart\?vs_currency=usd&days=(31|1)$/.exec(url);
  if (!m) return json({}, 404);
  if (falla.includes(m[1]) || (m[2] === '1' && falla5m.includes(m[1]))) return json({ error: 'no' }, 500);
  const i = LISTA.findIndex((t) => t.id === m[1]);
  // Menos puntos que los de verdad (cada 3 horas y cada 30 minutos): la regla es la misma y la prueba va más deprisa.
  return json({ market_caps: m[2] === '31' ? caps(AHORA - 31 * 86400000 + (m[1] === 'otro-1' ? 20 * 86400000 : 0), 3 * 3600000, m[1] === 'otro-1' ? 88 : 249, 1e10 / (i + 1))
    : caps(AHORA - 86400000 - 30000, 1800000, 49, 1e10 / (i + 1)) });
};
{
  const pausas = [];
  const r = await sembrar({ fetchImpl: fetchPega({ falla: ['otro-5'] }), esperar: async (ms) => { pausas.push(ms); }, ahora: () => AHORA, avisar: () => {} });
  const lineas = r.sql.trim().split('\n');
  const tokensSembrados = lineas.filter((l) => l.startsWith('select rwadar_mercado.sembrar(')).map((l) => JSON.parse(l.slice(l.indexOf('$siembra$') + 9, l.lastIndexOf('$siembra$'))));
  const pausasOk = pausas.filter((x) => x === 13000).length === 1 + 2 * 40;
  paso(`siembra: la diaria, la lista y market_chart days=31 y days=1 de los 40 (la diaria ∪ los 40 mayores): ${pedidas.length} llamadas (4 son los reintentos del que falla), 13 s entre ellas`,
    pedidas.length === 2 + 2 * 40 + 4 && pedidas[0] === URL_DIARIA && pedidas[1] === modelo.SERIE.apiMercados && pausasOk
    && pedidas.slice(2).every((u) => /market_chart\?vs_currency=usd&days=(31|1)$/.test(u)) && r.tokens === 40);
  const fh = tokensSembrados.find((t) => t.id === DIARIA.tokens[0]);
  const esperado = observacionesSiembra(caps(AHORA - 31 * 86400000, 3 * 3600000, 249, 1e10), caps(AHORA - 86400000 - 30000, 1800000, 49, 1e10));
  paso('siembra: de cada token, la horaria (days=31) y la de 5 minutos con, delante, los horarios anteriores (lo que el flujo diario pasa a construirSerieFina)',
    isDeepStrictEqual(fh.obs1h, esperado.obs1h) && isDeepStrictEqual(fh.obs5, esperado.obs5) && fh.obs5[0][0] < AHORA - 86400000 - 30000
    && fh.obs5.length === esperado.obs5.length && fh.primera === null && tokensSembrados.find((t) => t.id === 'otro-1').primera === '2026-11-03');
  const o5 = tokensSembrados.find((t) => t.id === 'otro-5');
  paso('siembra: un token que no se puede leer se siembra con su valor de /coins/markets (quedará fuera con su valor) y se avisa',
    r.fallos.includes('otro-5') && o5.obs5.length === 1 && o5.obs5[0][1] === LISTA.find((t) => t.id === 'otro-5').market_cap);
  const cierre = lineas.at(-1);
  paso('siembra: termina con cerrar_siembra(lista de la diaria en su orden, su generado, la hora del último dato) y el JSON solo va entre $siembra$',
    cierre.startsWith('select rwadar_mercado.cerrar_siembra($siembra$' + JSON.stringify(DIARIA.tokens) + '$siembra$::jsonb, \'2026-11-13T15:10:06Z\'::timestamptz, ')
    && lineas.every((l) => (l.match(/\$siembra\$/g) || []).length === 2 || (l.match(/\$siembra\$/g) || []).length === 2));
  const salida = [], errores = [];
  const codigo = await principalSiembra({ fetchImpl: fetchPega({ sinDiaria: true }), esperar: async () => {}, ahora: () => AHORA, salida: (t) => salida.push(t), error: (m) => errores.push(m), entorno: {} });
  paso('siembra: sin la diaria publicada no escribe nada y sale con 3', codigo === 3 && salida.length === 0 && /No se pudo sembrar/.test(errores.join('\n')));
  // Un token de la diaria sin historia (el mayor, o uno pequeño solo en days=1) quedaría «fuera» en toda la ventana
  // sembrada: con figure-heloc, ni 5m ni 1h en 24 h y 30 días (revisión del 14/11). Se para y no escribe nada.
  for (const [nombre, opciones] of [['el mayor, en las dos', { falla: [DIARIA.tokens[0]] }], ['uno pequeño, solo en days=1', { falla5m: [DIARIA.tokens.at(-1)] }]]) {
    const s = [], e = [];
    const c = await principalSiembra({ fetchImpl: fetchPega(opciones), esperar: async () => {}, ahora: () => AHORA, salida: (t) => s.push(t), error: (m) => e.push(m), entorno: {} });
    paso(`siembra: un token de la diaria sin su historia (${nombre}) la para: no escribe nada y sale con 3`,
      c === 3 && s.length === 0 && new RegExp(`No se pudo sembrar: ${(opciones.falla || opciones.falla5m)[0]} es de la diaria`).test(e.join('\n')));
  }
  paso('siembra: con TLS desactivado no lee nada', (await principalSiembra({ fetchImpl: () => { throw new Error('no'); }, entorno: { NODE_TLS_REJECT_UNAUTHORIZED: '0' }, error: () => {}, salida: () => {} })) === 1);
  fs.writeFileSync(path.join(temporal, 'siembra.sql'), r.sql);
}

/* ---------- 2 · Revisión del flujo ---------- */
{
  const opciones = FLUJO.match(/options:\n((?: {10}- .+\n)+)/)[1].trim().split('\n').map((l) => l.trim().slice(2));
  paso('el flujo tiene exactamente sus 15 acciones', isDeepStrictEqual(opciones, ['ensayo-35', 'verificar-35', 'aplicar-35', 'ensayo-37', 'verificar-37', 'aplicar-37',
    'ensayo-39', 'verificar-39', 'aplicar-39', 'probar-coingecko', 'sembrar', 'encender', 'apagar', 'deshacer', 'estado']));
  const codigo = sinAlmohadillas(FLUJO);
  const pasos = [...codigo.matchAll(/\n {6}- name: (.+)/g)].map((m) => m[1]);
  paso('primero «Solo desde main»; solo lectura del repositorio; la cola de las escrituras; TLS; acciones por SHA; sin credenciales de git',
    pasos[0] === 'Solo desde main' && /\npermissions:\n {2}contents: read\n/.test(FLUJO) && /group: rwadar-aplicar-catalogo/.test(FLUJO)
    && /^env:\n {2}PGSSLMODE: require\n/m.test(FLUJO) && (codigo.match(/uses: \S+/g) || []).every((u) => /@[0-9a-f]{40}$/.test(u))
    && /persist-credentials: false/.test(FLUJO) && !/workflow_run|pull_request|schedule:/.test(codigo));
  const secretos = [...new Set(codigo.match(/secrets\.[A-Z_]+/g))].sort();
  paso('solo usa SUPABASE_DB_URL y COPIA_CLAVE', isDeepStrictEqual(secretos, ['secrets.COPIA_CLAVE', 'secrets.SUPABASE_DB_URL']));
}

/* ---------- 2b · La vigilancia de la fase 2 (comparar-directo.mjs) ---------- */
{
  const { compararDirecto } = await import('./tokenizacion/comparar-directo.mjs');
  const fina = JSON.parse(leer('tokenizacion/prueba-serie-fina-20261113.json'));
  const igual = compararDirecto({ version: 1, fina, sinLectura: { '5m': [], '1h': [] } }, fina);
  // El directo un 0,05 % por encima en todo: dentro; un 0,2 % en la mitad de los cubos: fuera de la compuerta.
  const mueve = (f, factor, cada = 1) => { const x = JSON.parse(JSON.stringify(f)); x.series['5m'].puntos = x.series['5m'].puntos.map((p, i) => (i % cada ? p : [p[0], Math.round(p[1] * factor), p[2]])); return x; };
  const poco = compararDirecto({ version: 1, fina: mueve(fina, 1.0005), sinLectura: { '5m': [], '1h': [] } }, fina);
  const mucho = compararDirecto({ version: 1, fina: mueve(fina, 1.002, 2), sinLectura: { '5m': [], '1h': [] } }, fina);
  paso(`comparar-directo: el mismo instante (cada punto de la fina con el cubo de 5 minutos del directo que lo contiene); la compuerta de la fase 2 (≥ 95 % dentro del 0,1 %) pasa con un 0,05 % y no con un 0,2 % en la mitad (${igual.comparables} comparables)`,
    igual.pasa && igual.maximo < 0.001 && igual.mismosFuera && igual.mismosLargos && igual.comparables > 289 && poco.pasa && !mucho.pasa);
}

/* ---------- 3 · Dobles: psql (PGlite + pg_net), node, sleep y curl ---------- */
const db = await baseDirecto({ aplicar: false });
const llamadas = [];
let respuestasCG = [];
let respuestaDiaria = 200;
const atenderPgNet = async () => {
  if (!(await valor(db, "select to_regclass('net.http_request_queue') is not null"))) return;
  const nuevas = await filas(db, 'select q.* from net.http_request_queue q left join net._http_response r on r.id = q.id where r.id is null order by q.id');
  for (const p of nuevas) {
    if (p.url === URL_MERCADOS) {
      const r = respuestasCG.shift() || { status: 200, contenido: JSON.stringify(LISTA) };
      await db.query("insert into net._http_response(id, status_code, headers, content, timed_out, created) values ($1, $2, $3, $4, false, now())",
        [p.id, r.status, JSON.stringify(r.headers || {}), r.contenido]);
    } else if (p.url === URL_DIARIA) {
      await db.query("insert into net._http_response(id, status_code, headers, content, timed_out, created) values ($1, $2, '{}', $3, false, now())",
        [p.id, respuestaDiaria, respuestaDiaria === 200 ? JSON.stringify(DIARIA) : '<html>bloqueado</html>']);
    }
  }
};
const formato = (v) => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 't' : 'f') : typeof v === 'object' ? JSON.stringify(v).replace(/":/g, '": ').replace(/,"/g, ', "') : String(v));
const psqlDoble = async (argv) => {
  llamadas.push(argv);
  const i = argv.indexOf('-c'), j = argv.indexOf('-f');
  const archivo = j >= 0 ? path.resolve(raizRepo, argv[j + 1]) : null;
  let sql = archivo ? fs.readFileSync(archivo, 'utf8') : argv[i + 1];
  if (argv.includes('-1')) sql = `begin;\n${sql}\ncommit;`;
  const avisos = [];
  try {
    const res = await db.exec(sql, { rowMode: 'array', onNotice: (n) => avisos.push(`${n.severity}:  ${n.message}\n`) });
    // Tras aplicar la 35, el reloj de prueba (now() de PGlite es el de verdad: sirve tal cual).
    if (archivo && /35_mercado_directo\.sql$/.test(archivo) && !/rollback;\s*$/.test(sql)) await db.exec(RELOJ_PRUEBA.replace('insert into public._reloj select now()', 'insert into public._reloj select now()'));
    await atenderPgNet();
    // Como psql: cada resultado con columnas, uno detrás de otro.
    const conFilas = res.filter((r) => r.fields?.length);
    return { estado: 0, stdout: conFilas.map((r) => r.rows.map((f) => f.map(formato).join('|')).join('\n') + '\n').join(''), stderr: avisos.join('') };
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    return { estado: archivo ? 3 : 1, stdout: '', stderr: `${avisos.join('')}ERROR:  ${e.message}\n` };
  }
};
const servidor = http.createServer(async (req, res) => {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  res.end(JSON.stringify(await psqlDoble(JSON.parse(Buffer.concat(trozos)).argv)));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const DOBLE_PSQL = `#!/usr/bin/env node
const http = require('node:http');
const p = http.request(process.env.PSQL_DOBLE_URL, { method: 'POST' }, (res) => { let d = ''; res.setEncoding('utf8');
  res.on('data', (t) => { d += t; }); res.on('end', () => { const r = JSON.parse(d); process.stdout.write(r.stdout); process.stderr.write(r.stderr); process.exitCode = r.estado; }); });
p.end(JSON.stringify({ argv: process.argv.slice(2) }));
`;
const NODE = process.execPath;
// node: rwadar-node-seguro.js pasa; la siembra escribe el SQL preparado (sin red).
const DOBLE_NODE = `#!/bin/sh
case "$1" in
  rwadar-node-seguro.js) exit 0 ;;
  rwadar-app/tokenizacion/sembrar-directo.mjs) cat "${temporal}/siembra.sql"; exit 0 ;;
  *) exec "${NODE}" "$@" ;;
esac
`;
let respuestaCurl = { codigo: '404', cuerpo: '{"error":"directo_apagado"}' };
const DOBLE_CURL = `#!/bin/sh
salida=""
while [ $# -gt 0 ]; do case "$1" in -o) salida="$2"; shift 2 ;; *) shift ;; esac; done
cat "${temporal}/curl-cuerpo" > "$salida"
cat "${temporal}/curl-codigo"
`;
const pasoDe = (yaml, nombre) => {
  const lineas = yaml.split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === `- name: ${nombre}`);
  if (inicio < 0) return null;
  const fin = lineas.findIndex((l, i) => i > inicio && /^ {6}(- |# )/.test(l));
  return lineas.slice(inicio, fin < 0 ? undefined : fin).join('\n');
};
const scriptDe = (bloque) => {
  const lineas = bloque.split('\n');
  const i = lineas.findIndex((l) => /^ {8}run: \|$/.test(l));
  if (i < 0) { const una = lineas.find((l) => /^ {8}run: /.test(l)); return una.replace(/^ {8}run: /, ''); }
  return lineas.slice(i + 1).map((l) => l.replace(/^ {10}/, '')).join('\n');
};
const correPaso = async (yaml, nombre, entorno = {}, cwd = raizRepo) => {
  const dir = fs.mkdtempSync(path.join(temporal, 'paso-'));
  fs.writeFileSync(path.join(dir, 'psql'), DOBLE_PSQL, { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'node'), DOBLE_NODE, { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(dir, 'curl'), DOBLE_CURL, { mode: 0o755 });
  fs.writeFileSync(path.join(temporal, 'curl-cuerpo'), respuestaCurl.cuerpo);
  fs.writeFileSync(path.join(temporal, 'curl-codigo'), respuestaCurl.codigo);
  const githubEnv = path.join(dir, 'env'), resumen = path.join(dir, 'resumen.md');
  fs.writeFileSync(githubEnv, ''); fs.writeFileSync(resumen, '');
  const bloque = pasoDe(yaml, nombre);
  if (!bloque) throw new Error(`el flujo no tiene el paso «${nombre}»`);
  const desde = llamadas.length;
  const r = await new Promise((resolver) => {
    const hijo = spawn('bash', ['--noprofile', '--norc', '-e', '-c', scriptDe(bloque)], { cwd, env: { PATH: `${dir}:${process.env.PATH}`, HOME: dir,
      GITHUB_ENV: githubEnv, GITHUB_STEP_SUMMARY: resumen, RUNNER_TEMP: dir, PSQL_DOBLE_URL: `http://127.0.0.1:${servidor.address().port}`,
      SUPABASE_DB_URL: 'postgresql://doble-local/sin-red', ...entorno } });
    let stdout = '', stderr = '';
    hijo.stdout.on('data', (t) => { stdout += t; }); hijo.stderr.on('data', (t) => { stderr += t; });
    hijo.on('close', (estado) => resolver({ estado, stdout, stderr }));
  });
  const salida = Object.fromEntries(fs.readFileSync(githubEnv, 'utf8').split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return { ...r, texto: r.stdout + r.stderr, salida, resumen: fs.readFileSync(resumen, 'utf8'), llamadas: llamadas.slice(desde) };
};
/* Una acción entera, en el orden del flujo y con sus condiciones (if:). */
const PASOS = ['Ensayo sin cambiar nada (se deshace al final)', 'Sembrar la historia (unos 18 minutos)', 'Aplicar', 'Probar CoinGecko desde Supabase',
  'Estado (solo lee)', 'Comprobar que no queda nada (deshacer)', 'Verificar'];
async function accion(nombre, confirmar = 'DIRECTO') {
  const c = await correPaso(FLUJO, 'Comprobar la acción', { ACCION: nombre, CONFIRMAR: confirmar });
  if (c.estado !== 0) return { comprobar: c, pasos: [] };
  const e = c.salida;
  const toca = {
    'Ensayo sin cambiar nada (se deshace al final)': e.ENSAYO === 'si',
    'Sembrar la historia (unos 18 minutos)': e.SIEMBRA === 'si',
    Aplicar: e.CAMBIA === 'si' && e.SQL !== '',
    'Probar CoinGecko desde Supabase': nombre === 'probar-coingecko',
    'Estado (solo lee)': nombre === 'estado',
    'Comprobar que no queda nada (deshacer)': nombre === 'deshacer',
    Verificar: e.ENSAYO !== 'si' && nombre !== 'deshacer',
  };
  const pasos = [];
  for (const p of PASOS) {
    if (!toca[p]) continue;
    const r = await correPaso(FLUJO, p, { ...e });
    pasos.push({ paso: p, ...r });
    if (r.estado !== 0) break;
  }
  return { comprobar: c, pasos, bien: pasos.every((p) => p.estado === 0) };
}
const hayBash = spawnSync('bash', ['--version']).status === 0;
const esquema = () => valor(db, "select to_regnamespace('rwadar_mercado') is not null");

if (hayBash) {
  /* ---------- 4 · Las acciones, de verdad ---------- */
  for (const a of ['aplicar-35', 'aplicar-37', 'aplicar-39', 'probar-coingecko', 'sembrar', 'encender', 'apagar', 'deshacer']) {
    const r = await accion(a, '');
    paso(`sin DIRECTO, «${a}» se para antes de tocar nada`, r.comprobar.estado !== 0 && /escribe DIRECTO/.test(r.comprobar.texto) && r.comprobar.llamadas.length === 0);
  }
  {
    const copia = fs.mkdtempSync(path.join(temporal, 'repo-'));
    fs.mkdirSync(path.join(copia, 'rwadar-app/db'), { recursive: true });
    fs.mkdirSync(path.join(copia, 'rwadar-app/supabase/migrations'), { recursive: true });
    for (const f of fs.readdirSync(path.join(raiz, 'db')).filter((n) => n.startsWith('35_'))) fs.copyFileSync(path.join(raiz, 'db', f), path.join(copia, 'rwadar-app/db', f));
    fs.writeFileSync(path.join(copia, 'rwadar-app/supabase/migrations/20261114090000_mercado_directo.sql'), leer('db/35_mercado_directo.sql') + '-- otra\n');
    const r = await correPaso(FLUJO, 'Comprobar la acción', { ACCION: 'verificar-35', CONFIRMAR: '' }, copia);
    paso('con las dos copias de la 35 distintas, se para', r.estado !== 0 && /no coinciden/.test(r.texto));
    // Las de la 35 iguales y las de la 37 distintas: también se para.
    fs.copyFileSync(path.join(raiz, 'db/35_mercado_directo.sql'), path.join(copia, 'rwadar-app/supabase/migrations/20261114090000_mercado_directo.sql'));
    for (const f of fs.readdirSync(path.join(raiz, 'db')).filter((n) => n.startsWith('37_'))) fs.copyFileSync(path.join(raiz, 'db', f), path.join(copia, 'rwadar-app/db', f));
    fs.writeFileSync(path.join(copia, 'rwadar-app/supabase/migrations/20261120180000_mercado_directo_secuencia.sql'), leer('db/37_mercado_directo_secuencia.sql') + '-- otra\n');
    const r37 = await correPaso(FLUJO, 'Comprobar la acción', { ACCION: 'verificar-37', CONFIRMAR: '' }, copia);
    paso('con las dos copias de la 37 distintas, se para', r37.estado !== 0 && /copias de la 37 no coinciden/.test(r37.texto));
    // Las de la 35 y la 37 iguales y las de la 39 distintas: también se para.
    fs.copyFileSync(path.join(raiz, 'db/37_mercado_directo_secuencia.sql'), path.join(copia, 'rwadar-app/supabase/migrations/20261120180000_mercado_directo_secuencia.sql'));
    for (const f of fs.readdirSync(path.join(raiz, 'db')).filter((n) => n.startsWith('39_'))) fs.copyFileSync(path.join(raiz, 'db', f), path.join(copia, 'rwadar-app/db', f));
    fs.writeFileSync(path.join(copia, 'rwadar-app/supabase/migrations/20261121120000_mercado_directo_espera.sql'), leer('db/39_mercado_directo_espera.sql') + '-- otra\n');
    const r39 = await correPaso(FLUJO, 'Comprobar la acción', { ACCION: 'verificar-39', CONFIRMAR: '' }, copia);
    paso('con las dos copias de la 39 distintas, se para', r39.estado !== 0 && /copias de la 39 no coinciden/.test(r39.texto));
  }
  const ensayo = await accion('ensayo-35', '');
  paso(`ensayo-35: la 35 y su verificador pasan y no queda nada (${ensayo.pasos.map((p) => p.estado).join(',')})`,
    ensayo.bien && ensayo.pasos.length === 1 && /ENSAYO CORRECTO/.test(ensayo.pasos[0].texto) && /RWAdar 35 OK/.test(ensayo.pasos[0].texto) && !(await esquema()));
  const aplicar = await accion('aplicar-35');
  paso('aplicar-35 (con DIRECTO): aplica y el verificador pasa (apagado, sin relojes)', aplicar.bien && aplicar.comprobar.salida.COPIA === 'si' && (await esquema())
    && /RWAdar 35 OK: directo apagado, 0 relojes/.test(aplicar.pasos.at(-1).texto));
  // La 37 (el arreglo de la secuencia de tokens): ensayo sin dejar nada, aplicar con copia y verificar.
  const cuerpo37 = () => valor(db, "select position('RWAdar 37' in prosrc) > 0 from pg_proc where oid = to_regprocedure('rwadar_mercado.guardar_mercados(text,timestamp with time zone)')");
  const ensayo37 = await accion('ensayo-37', '');
  paso(`ensayo-37: la 37 y su verificador pasan y no queda nada (${ensayo37.pasos.map((p) => p.estado).join(',')})`,
    ensayo37.bien && ensayo37.pasos.length === 1 && /ENSAYO CORRECTO: 37_mercado_directo_secuencia\.sql/.test(ensayo37.pasos[0].texto)
    && /RWAdar 37 OK/.test(ensayo37.pasos[0].texto) && !(await cuerpo37()));
  const verificar37antes = await accion('verificar-37', '');
  paso('verificar-37 antes de aplicarla: falla (sigue el alta de la 35) y no cambia nada', !verificar37antes.bien
    && /sigue con el alta de la 35/.test(verificar37antes.pasos.at(-1).texto) && !(await cuerpo37()));
  const aplicar37 = await accion('aplicar-37');
  paso('aplicar-37 (con DIRECTO): copia antes, aplica y pasan los verificadores de la 35 y de la 37',
    aplicar37.bien && aplicar37.comprobar.salida.COPIA === 'si' && aplicar37.pasos.map((p) => p.paso).join('|') === 'Aplicar|Verificar'
    && /RWAdar 35 OK/.test(aplicar37.pasos.at(-1).texto) && /RWAdar 37 OK/.test(aplicar37.pasos.at(-1).texto) && (await cuerpo37()));
  const verificar37 = await accion('verificar-37', '');
  paso('verificar-37: solo lee y pasan los dos verificadores', verificar37.bien && verificar37.pasos.map((p) => p.paso).join('|') === 'Verificar'
    && /RWAdar 35 OK/.test(verificar37.pasos[0].texto) && /RWAdar 37 OK/.test(verificar37.pasos[0].texto));
  // La 39 (las esperas sin desbordarse): ensayo sin dejar nada, aplicar con copia y verificar.
  const cuerpo39 = () => valor(db, "select position('least(fallos_seguidos + 1 - 3, 2)' in prosrc) > 0 from pg_proc where oid = to_regprocedure('rwadar_mercado.leer_respuesta(boolean)')");
  const ensayo39 = await accion('ensayo-39', '');
  paso(`ensayo-39: la 39 y su verificador pasan y no queda nada (${ensayo39.pasos.map((p) => p.estado).join(',')})`,
    ensayo39.bien && ensayo39.pasos.length === 1 && /ENSAYO CORRECTO: 39_mercado_directo_espera\.sql/.test(ensayo39.pasos[0].texto)
    && /RWAdar 39 OK/.test(ensayo39.pasos[0].texto) && !(await cuerpo39()));
  const verificar39antes = await accion('verificar-39', '');
  paso('verificar-39 antes de aplicarla: falla (sigue la espera de la 35) y no cambia nada', !verificar39antes.bien
    && /sigue con la espera de la 35/.test(verificar39antes.pasos.at(-1).texto) && !(await cuerpo39()));
  const aplicar39 = await accion('aplicar-39');
  paso('aplicar-39 (con DIRECTO): copia antes, aplica y pasan los verificadores de la 35 y de la 39',
    aplicar39.bien && aplicar39.comprobar.salida.COPIA === 'si' && aplicar39.pasos.map((p) => p.paso).join('|') === 'Aplicar|Verificar'
    && /RWAdar 35 OK/.test(aplicar39.pasos.at(-1).texto) && /RWAdar 39 OK/.test(aplicar39.pasos.at(-1).texto) && (await cuerpo39()));
  const verificar39 = await accion('verificar-39', '');
  paso('verificar-39: solo lee y pasan los dos verificadores', verificar39.bien && verificar39.pasos.map((p) => p.paso).join('|') === 'Verificar'
    && /RWAdar 35 OK/.test(verificar39.pasos[0].texto) && /RWAdar 39 OK/.test(verificar39.pasos[0].texto));
  respuestasCG = [{ status: 429, contenido: '{}', headers: { 'retry-after': '40' } }];
  const prueba = await accion('probar-coingecko');
  paso(`probar-coingecko: una llamada desde la base, apagada, y dice qué respondió, también de la diaria publicada (${prueba.pasos[0]?.stdout.trim()})`,
    prueba.bien && /"coingecko": 429/.test(prueba.pasos[0].stdout) && /"diaria": 200[,}]/.test(prueba.pasos[0].stdout) && /CoinGecko desde la red de Supabase/.test(prueba.pasos[0].resumen)
    && (await valor(db, 'select count(*) from rwadar_mercado.registro where prueba')) === 1 && (await valor(db, 'select count(*) from rwadar_mercado.obs_5m')) === 0
    && (await valor(db, 'select diaria_peticion is null and diaria_leida_el is null and cardinality(tokens) = 0 from rwadar_mercado.configuracion')));
  const otra = await accion('probar-coingecko');
  paso('probar-coingecko otra vez en la misma ranura: no pide (como mucho una cada 5 minutos)', otra.bien && /No toca pedir todavía \(pronto\)/.test(otra.pasos[0].texto)
    && (await valor(db, 'select count(*) from rwadar_mercado.registro')) === 1);
  // Si Supabase no puede leer la diaria publicada (Cloudflare la bloquea), falla y lo dice: así no se enciende
  // (a los 45 minutos la web pasaría a «atrasado» con aviso para todos; revisión del 14/11).
  await db.query("update public._reloj set t = t + interval '5 minutes'");
  respuestaDiaria = 403;
  const bloqueada = await accion('probar-coingecko');
  respuestaDiaria = 200;
  paso(`probar-coingecko con la diaria bloqueada desde Supabase: falla y dice que no se encienda (${bloqueada.pasos[0]?.stdout.trim().split('\n')[0]})`,
    !bloqueada.bien && bloqueada.pasos[0].estado === 1 && /"diaria": 403/.test(bloqueada.pasos[0].stdout)
    && /Supabase no pudo leer la diaria publicada/.test(bloqueada.pasos[0].texto) && /no enciendas/.test(bloqueada.pasos[0].resumen)
    && (await valor(db, 'select diaria_peticion is null and diaria_leida_el is null from rwadar_mercado.configuracion')));
  // La siembra del apartado 1 tiene la hora de AHORA: el reloj de la base, a esa hora.
  await db.query('update public._reloj set t = $1', [new Date(AHORA + 5 * 60000).toISOString()]);
  const sembrada = await accion('sembrar');
  paso(`sembrar: el SQL entra en una transacción y deja la historia y el documento (${sembrada.pasos[0]?.stdout.trim()})`,
    sembrada.bien && /Siembra guardada: 40 tokens/.test(sembrada.pasos[0].stdout) && sembrada.pasos[0].llamadas[0].includes('-1')
    && (await valor(db, "select doc->'series'->'5m' is not null and doc->'series'->'1h' is not null from rwadar_mercado.directo")));
  const encendida = await accion('encender');
  paso('encender: siembra otra vez en la misma ejecución, enciende, crea los dos relojes y el verificador pasa',
    encendida.bien && encendida.pasos.map((p) => p.paso).join('|') === 'Sembrar la historia (unos 18 minutos)|Aplicar|Verificar'
    && (await valor(db, "select count(*) from cron.job where jobname like 'rwadar-mercado-%'")) === 2 && /directo encendido, 2 relojes/.test(encendida.pasos.at(-1).texto));
  respuestaCurl = { codigo: '200', cuerpo: '{"version":1}' };
  const estado = await accion('estado', '');
  if (process.env.DEPURAR) console.log(estado.pasos.map((p) => p.paso + ' ' + p.estado + ' ' + p.texto.slice(0, 1500)).join('\n'));
  paso('estado: solo lee y dice qué sirve la web', estado.bien && /La web sirve \/api\/tokenizacion\/directo con 200/.test(estado.pasos[0].texto) && /encendido/.test(estado.pasos[0].texto));
  const apagada = await accion('apagar');
  paso('apagar: sin relojes, apagado y el verificador pasa', apagada.bien && (await valor(db, "select count(*) from cron.job where jobname like 'rwadar-mercado-%'")) === 0
    && /directo apagado, 0 relojes/.test(apagada.pasos.at(-1).texto));
  const deshecha = await accion('deshacer');
  paso('deshacer (con copia antes): no queda nada y lo comprueba', deshecha.bien && deshecha.comprobar.salida.COPIA === 'si' && !(await esquema())
    && /Deshecho: ni esquema/.test(deshecha.pasos.at(-1).texto));

  /* ---------- 5 · El aviso en el flujo diario ---------- */
  const diario = async (codigo, cuerpo) => { respuestaCurl = { codigo, cuerpo }; return correPaso(DIARIO, 'Comprobar el gráfico en directo'); };
  const r200 = await diario('200', '{"version":1}');
  const r404 = await diario('404', '{"error":"directo_apagado"}');
  const rNoCasa = await diario('503', '{"error":"directo_no_casa"}');
  const rAtrasado = await diario('503', '{"error":"directo_atrasado"}');
  const rRed = await diario('000', '');
  const r404Otro = await diario('404', '{"error":"ruta_no_permitida"}');
  if (process.env.DEPURAR) console.log([r200, r404, rNoCasa, rAtrasado, rRed, r404Otro].map((r) => r.estado + ' ' + r.texto.slice(0, 300) + ' | ' + r.resumen).join('\n'));
  paso('flujo diario: con el directo bien, apagado o «no casa» no falla; atrasado, sin red o con otra respuesta, falla y lo apunta en el resumen (para el aviso de GitHub)',
    r200.estado === 0 && r404.estado === 0 && rNoCasa.estado === 0 && rAtrasado.estado === 1 && rRed.estado === 1 && r404Otro.estado === 1
    && /no responde bien \(503 directo_atrasado\)/.test(rAtrasado.resumen) && /Intento 2/.test(rAtrasado.texto));
} else {
  paso('bash no está: no se pueden ejecutar los pasos del flujo', false);
}

servidor.close();
await db.close();
fs.rmSync(temporal, { recursive: true, force: true });
const segundos = (performance.now() - t0) / 1000;
paso(`dura menos de 25 s en esta máquina (${segundos.toFixed(1)} s; tope por archivo de la CI)`, segundos < 25);
informe('Gráfico en directo: el flujo «Mercado en directo (base)» y la siembra', ok, fail);
