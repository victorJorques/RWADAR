// Pruebas sin red de los flujos que usan las claves de Víctor:
// «Dominio de correo» (.github/workflows/dominio-correo.yml, rwadar-app/dominio-correo.mjs)
// y «Supabase (gestión de Auth)» (.github/workflows/supabase-gestion.yml,
// rwadar-app/supabase-gestion.mjs).
//
// Los scripts corren de verdad, en otro proceso, con dos dobles que nunca
// salen a la red: un fetch falso que hace de Cloudflare, Lettermint y Supabase
// (.github/dobles-claves.mjs, cargado con `node --import`) y un psql falso en
// el PATH que hace de Vault. Cada prueba tiene dos carpetas: «servidor» (el
// estado de los dobles, que sí guarda los tokens que «crea» Lettermint) y
// «runner» (HOME, temporales, GITHUB_ENV, GITHUB_OUTPUT y el resumen, como en
// GitHub). Que ningún token aparezca se mira en stdout, stderr y en TODOS los
// archivos de «runner».
// Uso: node --test .github/claves.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ACCIONES as ACCIONES_DOMINIO, planificar, registrosPedidos, registroCF, textoTXT } from '../rwadar-app/dominio-correo.mjs';
import { ACCIONES as ACCIONES_SUPABASE, CAMPOS_ESTADO, leerPlantillas } from '../rwadar-app/supabase-gestion.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (relativa) => fs.readFileSync(path.join(raiz, relativa), 'utf8');
const SCRIPT_DOMINIO = path.join(raiz, 'rwadar-app/dominio-correo.mjs');
const SCRIPT_SUPABASE = path.join(raiz, 'rwadar-app/supabase-gestion.mjs');
const DOBLES = pathToFileURL(path.join(raiz, '.github/dobles-claves.mjs')).href;
const huellaDoble = (v) => crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);

// Claves inventadas para los dobles (no son de nadie y no tienen la forma de ninguna real).
const CLAVE_LM = ['lm', 'equipo', 'ficticio', 'para', 'probar', 'claves'].join('-');
const CLAVE_CF = ['cf', 'dns', 'ficticio', 'para', 'probar', 'claves'].join('-');
const CLAVE_SB = ['supa', 'gestion', 'ficticio', 'para', 'probar'].join('-');
const URL_DB = 'postgresql://postgres.abc:ContrasenaSecreta123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const GMAIL = ['contrasena', 'aplicacion', 'gmail', 'ficticia'].join('-');
const OTRO_SECRETO = ['secreto', 'google', 'ficticio', '0811'].join('-');
const SECRETOS_DE_ENTRADA = [CLAVE_LM, CLAVE_CF, CLAVE_SB, URL_DB, 'ContrasenaSecreta123', GMAIL, OTRO_SECRETO];
const PLANTILLA_CONFIRMAR = leer('rwadar-app/plantillas-auth/confirmar-alta.html');
const PLANTILLA_RECUPERAR = leer('rwadar-app/plantillas-auth/recuperar-acceso.html');
const PRIVACIDAD_HOY = leer('rwadar-site/privacidad.html');
const PRIVACIDAD_LETTERMINT = PRIVACIDAD_HOY.replace(/a través de una cuenta de Gmail de RWAdar \(apartado 8\)/, 'a través de Lettermint (apartado 8)');

/* Los registros que pide Lettermint al añadir el dominio, como los describe
   su guía de Cloudflare: dos DKIM por CNAME, el de rebotes y el DMARC. */
const REGISTROS_LM = [
  { type: 'CNAME', hostname: 'lm1._domainkey', fqdn: 'lm1._domainkey.rwadar.app', content: 'lm1.rwadar-app.dkim.lmta.net', purpose: 'dkim_primary', verification_scope: 'required' },
  { type: 'CNAME', hostname: 'lm2._domainkey', fqdn: 'lm2._domainkey.rwadar.app', content: 'lm2.rwadar-app.dkim.lmta.net', purpose: 'dkim_secondary', verification_scope: 'required' },
  { type: 'CNAME', hostname: 'lm-bounces', fqdn: 'lm-bounces.rwadar.app', content: 'bounces.lmta.net', purpose: 'return_path', verification_scope: 'required' },
  { type: 'TXT', hostname: '_dmarc', fqdn: '_dmarc.rwadar.app', content: 'v=DMARC1; p=none', purpose: 'dmarc', verification_scope: 'required' },
];
const SPF_LM = { type: 'TXT', hostname: '@', fqdn: 'rwadar.app', content: 'v=spf1 include:spf.lmta.net ~all', purpose: 'return_path', verification_scope: 'required' };
const AUTH_GMAIL = {
  smtp_host: 'smtp.gmail.com', smtp_port: '465', smtp_user: 'rwadares@gmail.com', smtp_pass: GMAIL, smtp_admin_email: 'rwadares@gmail.com',
  smtp_sender_name: 'RWAdar', smtp_max_frequency: 60, rate_limit_email_sent: 30,
  mailer_subjects_confirmation: 'Confirma tu cuenta de RWAdar', mailer_subjects_recovery: 'Reset Your Password',
  mailer_templates_confirmation_content: '<h2>Confirma tu cuenta</h2><p><a href="{{ .ConfirmationURL }}">Confirmar</a></p>',
  mailer_templates_recovery_content: '<h2>Reset Password</h2><p><a href="{{ .ConfirmationURL }}">Reset</a></p>',
  mailer_templates_magic_link_content: '<h2>Magic Link</h2><p><a href="{{ .ConfirmationURL }}">Log In</a></p>',
  external_google_secret: OTRO_SECRETO,
};
const AUTH_CON_PLANTILLAS = {
  ...AUTH_GMAIL, mailer_subjects_confirmation: 'Confirma tu correo y desbloquea gratis la Academy', mailer_subjects_recovery: 'Recupera tu acceso a RWAdar',
  mailer_templates_confirmation_content: PLANTILLA_CONFIRMAR, mailer_templates_recovery_content: PLANTILLA_RECUPERAR,
};

function estadoInicial(cambiar = () => {}) {
  const e = {
    lm: {
      clave: CLAVE_LM, equipo: { plan: 'free', verified_at: null },
      proyectos: [{ id: 'p-1', name: 'RWAdar', delivery_mode: 'live', smtp_enabled: false }],
      dominios: [], registrosAlCrear: structuredClone(REGISTROS_LM),
      rutas: [
        { id: 'r-1', project_id: 'p-1', slug: 'transactional', name: 'Transactional', route_type: 'transactional', is_default: true, settings: { track_opens: false, track_clicks: false } },
        { id: 'r-2', project_id: 'p-1', slug: 'broadcast', name: 'Broadcast', route_type: 'broadcast', is_default: false, settings: { track_opens: false, track_clicks: false, disable_hosted_unsubscribe: false } },
      ],
      tokens: [], historial: [], contador: 0, seguimientoDisponible: false, desuscripcionDisponible: false, sinPermiso: [],
    },
    cf: { clave: CLAVE_CF, zonas: [{ id: 'z-1', name: 'rwadar.app', status: 'active' }], registros: [], contador: 0 },
    supa: {
      clave: CLAVE_SB, ref: 'exgpmjpaaebyoolpwced',
      proyecto: { id: 'exgpmjpaaebyoolpwced', ref: 'exgpmjpaaebyoolpwced', name: 'RWAdar', region: 'eu-west-1', status: 'ACTIVE_HEALTHY',
        database: { host: 'db.exgpmjpaaebyoolpwced.supabase.co', version: '17.4.1.054', postgres_engine: '17', release_channel: 'ga' } },
      elegibilidad: { eligible: true, current_app_version: '17.4.1.054', current_app_version_release_channel: 'ga', latest_app_version: '17.6.1.011',
        target_upgrade_versions: [{ postgres_version: '17', release_channel: 'ga', app_version: '17.6.1.011' }], duration_estimate_hours: 1,
        legacy_auth_custom_roles: [], objects_to_be_dropped: [], unsupported_extensions: [], user_defined_objects_in_internal_schemas: [], validation_errors: [], warnings: [] },
      auth: structuredClone(AUTH_GMAIL), recuperaciones: [],
    },
    web: { privacidad: PRIVACIDAD_HOY },
    fallos: [],
  };
  cambiar(e);
  return e;
}

/* psql falso: comprueba la forma de la llamada y hace de Vault. Apunta en
   psql.jsonl cada llamada, con el token reducido a una huella. */
const PSQL_DOBLE = String.raw`#!/usr/bin/env node
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const dir = path.join(path.dirname(fs.realpathSync(process.argv[1])), '..');
const cfgRuta = path.join(dir, 'psql.json');
const cfg = JSON.parse(fs.readFileSync(cfgRuta, 'utf8'));
const args = process.argv.slice(2);
let entrada = ''; try { entrada = fs.readFileSync(0, 'utf8'); } catch {}
const h = (v) => crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);
const variables = {};
for (let i = 0; i < args.length; i++) if (args[i] === '-v') { const [k, ...v] = args[i + 1].split('='); variables[k] = v.join('='); }
const f = args.includes('-f') ? args[args.indexOf('-f') + 1] : '';
const archivo = f === '-' ? 'stdin' : path.basename(f);
fs.appendFileSync(path.join(dir, 'psql.jsonl'), JSON.stringify({ primero: args[0] === cfg.dbUrl ? 'dbUrl' : 'otro', PGSSLMODE: process.env.PGSSLMODE || '',
  archivo, token: variables.token ? h(variables.token) : '', remitente: variables.remitente || '',
  heredaClaves: Object.keys(process.env).filter((k) => /TOKEN|DB_URL|DOBLE/.test(k)), soloLectura: /begin transaction read only;[\s\S]*rollback;/.test(entrada) }) + '\n');
fs.appendFileSync(path.join(dir, 'orden.log'), 'psql ' + archivo + '\n');
if (cfg.conectarFalla) { process.stderr.write('psql: error: connection to server at "aws-0-eu-west-1.pooler.supabase.com" failed: timeout expired\n'); process.exit(2); }
if (archivo === 'stdin' && /vault\.secrets/.test(entrada)) { process.stdout.write((cfg.sinVault ? 'false' : 'true') + '|' + (cfg.vault.LETTERMINT_API_TOKEN ? 1 : 0) + '\n'); process.exit(0); }
if (archivo === '31_correo_lettermint_guardar.sql') {
  if (cfg.guardarFalla) { process.stderr.write('psql:rwadar-app/db/31_correo_lettermint_guardar.sql:44: ERROR:  could not serialize access due to concurrent update\n'); process.exit(3); }
  if (!/^[!-~]{20,1024}$/.test(variables.token || '')) { process.stderr.write('ERROR:  avisos 31: el token de Lettermint falta o no tiene forma de token\n'); process.exit(3); }
  cfg.vault.LETTERMINT_API_TOKEN = variables.token; cfg.vault.RWADAR_REMITENTE = variables.remitente;
  fs.writeFileSync(cfgRuta, JSON.stringify(cfg));
  process.stdout.write('t\n');
  process.stderr.write('psql:rwadar-app/db/31_correo_lettermint_guardar.sql:92: NOTICE:  avisos 31: LETTERMINT_API_TOKEN y RWADAR_REMITENTE guardados en Vault con forma válida. El correo sigue como estaba (para encenderlo: 30_avisos_registrados_activar_correo.sql).\n');
  process.exit(0);
}
process.stderr.write('psql doble: llamada no prevista\n'); process.exit(9);
`;

/* Un «mundo»: los dobles con su estado, y una función para lanzar el script
   como lo lanza GitHub. El estado se conserva entre lanzamientos. */
function mundo(t, estado = estadoInicial(), psql = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-claves-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const servidor = path.join(base, 'servidor'), runner = path.join(base, 'runner');
  for (const d of [path.join(servidor, 'bin'), path.join(runner, 'tmp'), path.join(runner, 'temp')]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(servidor, 'estado.json'), JSON.stringify(estado));
  fs.writeFileSync(path.join(servidor, 'psql.json'), JSON.stringify({ dbUrl: URL_DB, vault: {}, ...psql }));
  fs.writeFileSync(path.join(servidor, 'bin', 'psql'), PSQL_DOBLE, { mode: 0o755 });
  const lineas = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean) : []);
  const m = {
    servidor, runner,
    estado: () => JSON.parse(fs.readFileSync(path.join(servidor, 'estado.json'), 'utf8')),
    psqlConfig: () => JSON.parse(fs.readFileSync(path.join(servidor, 'psql.json'), 'utf8')),
    cambiar(fn) { const e = m.estado(); fn(e); fs.writeFileSync(path.join(servidor, 'estado.json'), JSON.stringify(e)); },
    cambiarPsql(fn) { const c = m.psqlConfig(); fn(c); fs.writeFileSync(path.join(servidor, 'psql.json'), JSON.stringify(c)); },
    correr(script, entorno = {}, orden = 'ejecutar') {
      for (const f of ['peticiones.jsonl', 'psql.jsonl', 'orden.log']) fs.rmSync(path.join(servidor, f), { force: true });
      const archivosGH = { GITHUB_ENV: path.join(runner, 'github_env'), GITHUB_OUTPUT: path.join(runner, 'github_output'), GITHUB_STEP_SUMMARY: path.join(runner, 'resumen.md') };
      for (const f of Object.values(archivosGH)) if (!fs.existsSync(f)) fs.writeFileSync(f, '');
      const env = Object.fromEntries(Object.entries({
        PATH: `${path.join(servidor, 'bin')}:${process.env.PATH}`, HOME: runner, TMPDIR: path.join(runner, 'tmp'), RUNNER_TEMP: path.join(runner, 'temp'),
        GITHUB_REF: 'refs/heads/main', GITHUB_ACTIONS: 'true', DOBLE_DIR: servidor, PGSSLMODE: 'require', ...archivosGH, ...entorno,
      }).filter(([, v]) => v !== undefined));
      const r = spawnSync(process.execPath, ['--import', DOBLES, script, orden], { cwd: runner, env, encoding: 'utf8', timeout: 60000 });
      const archivos = {};
      const recorrer = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) recorrer(p); else archivos[path.relative(runner, p)] = fs.readFileSync(p, 'utf8'); } };
      recorrer(runner);
      return {
        codigo: r.status, stdout: r.stdout, stderr: r.stderr, texto: `${r.stdout}${r.stderr}`, archivos,
        peticiones: lineas(path.join(servidor, 'peticiones.jsonl')).map((l) => JSON.parse(l)),
        psql: lineas(path.join(servidor, 'psql.jsonl')).map((l) => JSON.parse(l)),
        orden: lineas(path.join(servidor, 'orden.log')),
        githubEnv: fs.readFileSync(archivosGH.GITHUB_ENV, 'utf8'), githubOutput: fs.readFileSync(archivosGH.GITHUB_OUTPUT, 'utf8'),
        resumen: fs.readFileSync(archivosGH.GITHUB_STEP_SUMMARY, 'utf8'),
      };
    },
  };
  return m;
}
const dominio = (accion, extra = {}) => ({ ACCION: accion, CONFIRMAR: 'CORREO', CLOUDFLARE_DNS_TOKEN: CLAVE_CF, LETTERMINT_TEAM_TOKEN: CLAVE_LM, ...extra });
const supabase = (accion, extra = {}) => ({ ACCION: accion, CONFIRMAR: 'SUPABASE', SUPABASE_ACCESS_TOKEN: CLAVE_SB, LETTERMINT_TEAM_TOKEN: CLAVE_LM, ...extra });
const BASE = { REMITENTE: 'avisos@rwadar.app', SUPABASE_DB_URL: URL_DB };
const SMTP_OK = { CUENTA_VERIFICADA: 'SI', REMITENTE: 'avisos@rwadar.app' };
const de = (r, metodo, patron, host) => r.peticiones.filter((p) => p.metodo === metodo && (!host || p.host === host) && (!patron || patron.test(p.ruta)));
const lugar = (r, patron) => r.orden.findIndex((l) => patron.test(l));

/* Ningún token ni clave aparece en ningún sitio: solo una vez cada token
   nuevo, en su propia línea ::add-mask::, que GitHub se queda y no enseña. */
function sinFugas(r, tokens) {
  const sinMascaras = r.stdout.split('\n').filter((l) => !l.startsWith('::add-mask::')).join('\n');
  for (const s of [...SECRETOS_DE_ENTRADA, ...tokens]) {
    const corto = `${s.slice(0, 12)}…`;
    assert.ok(!sinMascaras.includes(s), `stdout enseña ${corto}`);
    assert.ok(!r.stderr.includes(s), `stderr enseña ${corto}`);
    assert.ok(!r.githubOutput.includes(s) && !r.githubEnv.includes(s) && !r.resumen.includes(s), `GITHUB_OUTPUT/ENV/resumen llevan ${corto}`);
    for (const [archivo, contenido] of Object.entries(r.archivos)) assert.ok(!contenido.includes(s), `${archivo} lleva ${corto}`);
  }
  for (const tk of tokens) assert.equal(r.stdout.split('\n').filter((l) => l === `::add-mask::${tk}`).length, 1, 'el token nuevo se enmascara una vez');
  assert.equal(r.githubOutput, '', 'nada a GITHUB_OUTPUT');
  for (const p of r.psql) assert.deepEqual(p.heredaClaves, [], 'psql no hereda las claves de las APIs');
}

/* ======================================================= los flujos, leídos */
function leerFlujo(nombre) {
  const texto = leer(`.github/workflows/${nombre}`);
  const pasos = texto.split('\n      - name: ').slice(1).map((p) => ({ nombre: p.split('\n')[0], texto: p }));
  const opciones = texto.match(/ {6}accion:\n(?: {8}.*\n)*? {8}options:\n((?: {10}- .*\n)+)/)?.[1].trim().split('\n').map((l) => l.trim().slice(2));
  return { texto, pasos, opciones, paso: (n) => pasos.find((p) => p.nombre === n)?.texto || '' };
}
const SHA_DE_LA_CASA = new Set(fs.readdirSync(path.join(raiz, '.github/workflows'))
  .filter((n) => !['dominio-correo.yml', 'supabase-gestion.yml'].includes(n))
  .flatMap((n) => [...leer(`.github/workflows/${n}`).matchAll(/uses: ([\w./-]+@[0-9a-f]{40})/g)].map((m) => m[1])));

for (const [nombre, acciones, script, secretosPorPaso, palabra] of [
  ['dominio-correo.yml', ACCIONES_DOMINIO, 'rwadar-app/dominio-correo.mjs', {
    CLOUDFLARE_DNS_TOKEN: ['estado', 'preparar-dominio'],
    LETTERMINT_TEAM_TOKEN: ['estado', 'preparar-dominio', 'verificar-dominio', 'ajustar-rutas', 'crear-token-base'],
    SUPABASE_DB_URL: ['crear-token-base'],
  }, 'CORREO'],
  ['supabase-gestion.yml', ACCIONES_SUPABASE, 'rwadar-app/supabase-gestion.mjs', {
    SUPABASE_ACCESS_TOKEN: ['estado', 'plantillas', 'smtp-lettermint'],
    LETTERMINT_TEAM_TOKEN: ['smtp-lettermint'],
  }, 'SUPABASE'],
]) {
  test(`${nombre}: solo a mano y desde main, permisos de lectura, cola propia, acciones fijadas y cada secreto solo en su paso`, () => {
    const f = leerFlujo(nombre);
    assert.match(f.texto, /^on:\n {2}workflow_dispatch:\n {4}inputs:\n/m);
    assert.doesNotMatch(f.texto, /^ {2}(schedule|push|pull_request|pull_request_target|workflow_run|repository_dispatch|workflow_call):/m);
    assert.deepEqual(f.opciones, acciones, 'las mismas acciones que el script');
    assert.match(f.texto, /^ {6}confirmar:\n {8}description: .*\n {8}required: false\n {8}type: string$/m);
    assert.match(f.texto, new RegExp(`description: 'Escribe ${palabra} `));
    assert.match(f.texto, /^permissions:\n {2}contents: read$/m);
    assert.equal((f.texto.match(/permissions:/g) || []).length, 1);
    assert.doesNotMatch(f.texto.replace(/^\s*#.*$/gm, ''), /write/);
    assert.match(f.texto, /^concurrency:\n {2}group: .+\n {2}cancel-in-progress: false$/m);
    assert.match(f.texto, /^ {4}timeout-minutes: \d+$/m);
    const usos = [...f.texto.matchAll(/uses: (\S+)/g)].map((m) => m[1]);
    assert.ok(usos.length >= 2);
    for (const u of usos) {
      assert.match(u, /@[0-9a-f]{40}$/, `${u}: fijada por su SHA completo`);
      assert.ok(SHA_DE_LA_CASA.has(u), `${u}: el mismo SHA que ya usan los demás flujos`);
    }
    assert.equal(f.pasos[0].nombre, 'Solo desde main');
    assert.match(f.pasos[0].texto, /\n {8}if: github\.ref != 'refs\/heads\/main'\n/);
    assert.match(f.pasos[0].texto, /\n {10}exit 1\n/);
    assert.match(f.paso('Descargar el código'), /persist-credentials: false/);
    // Nunca ${{ … }} dentro de un run:, ni rastreo de bash.
    const runs = [...f.texto.matchAll(/^ {8}run: (.*)$/gm)].map((m) => m[1])
      .concat([...f.texto.matchAll(/^( +)run: \|\n((?:\1 {2}.*\n|\s*\n)*)/gm)].map((m) => m[2]));
    assert.ok(runs.length >= 5);
    for (const r of runs) assert.ok(!r.includes('${{'), `run con \${{ }}: ${r}`);
    assert.doesNotMatch(f.texto, /set -[a-z]*x|xtrace/);
    // Cada paso de acción: su condición, el script y solo los secretos que usa.
    assert.match(f.paso('Comprobar la acción'), new RegExp(`\\n {8}run: node ${script.replace(/[./]/g, '\\$&')} comprobar\\n?$`));
    assert.doesNotMatch(f.paso('Comprobar la acción'), /secrets\./);
    for (const accion of acciones) {
      const pasos = f.pasos.filter((p) => p.texto.includes(`\n        if: inputs.accion == '${accion}'\n`) && p.texto.includes(`run: node ${script} ejecutar`));
      assert.equal(pasos.length, 1, `${accion}: un paso que la hace`);
      const secretos = [...pasos[0].texto.matchAll(/\$\{\{ secrets\.([A-Z_]+) \}\}/g)].map((m) => m[1]).sort();
      const esperados = Object.entries(secretosPorPaso).filter(([, a]) => a.includes(accion)).map(([s]) => s).sort();
      assert.deepEqual(secretos, esperados, `${accion}: solo sus secretos`);
    }
    const todos = [...f.texto.matchAll(/\$\{\{ secrets\.([A-Z_]+) \}\}/g)].length;
    assert.equal(todos, Object.values(secretosPorPaso).flat().length, 'ningún secreto fuera de los pasos de acción');
    // La descarga trae todo lo que usa el script (y nada de npm).
    const sparse = f.paso('Descargar el código').match(/sparse-checkout: \|\n((?: {12}.*\n)+)/)[1].trim().split('\n').map((l) => l.trim());
    for (const archivo of [script, 'rwadar-app/claves-comun.mjs', 'rwadar-node-seguro.js']) assert.ok(sparse.includes(archivo), archivo);
    for (const archivo of sparse) assert.ok(fs.existsSync(path.join(raiz, archivo)), `${archivo} existe`);
    assert.doesNotMatch(f.texto, /npm (ci|install)/);
    assert.match(f.paso('Preparar Node.js'), /node-version: 22\.23\.4/);
    assert.match(f.paso('Comprobar que Node lleva el parche de seguridad'), /run: node rwadar-node-seguro\.js/);
  });
}

test('dominio-correo.yml: crear-token-base va en la cola de las escrituras a la base, con psql y TLS', () => {
  const f = leerFlujo('dominio-correo.yml');
  assert.match(f.texto, /^ {2}group: \$\{\{ inputs\.accion == 'crear-token-base' && 'rwadar-aplicar-catalogo' \|\| 'rwadar-dominio-correo' \}\}$/m);
  assert.match(f.texto, /^env:\n {2}PGSSLMODE: require\n/m);
  assert.match(f.paso('Instalar psql 17 (misma versión que Supabase)'), /\n {8}if: inputs\.accion == 'crear-token-base'\n/);
  assert.ok(leerFlujo('dominio-correo.yml').paso('Descargar el código').includes('rwadar-app/db/31_correo_lettermint_guardar.sql'));
  const g = leerFlujo('supabase-gestion.yml');
  assert.doesNotMatch(g.texto.replace(/^\s*#.*$/gm, ''), /SUPABASE_DB_URL|psql/, 'la gestión de Auth no usa la base');
  assert.match(g.paso('Guardar las plantillas anteriores 35 días (vuelta atrás)'),
    /\n {8}if: always\(\) && inputs\.accion == 'plantillas' && env\.PLANTILLAS_ANTERIORES != ''\n {8}uses: actions\/upload-artifact@[0-9a-f]{40} /);
});

/* ======================================================= compuertas */
test('compuertas: la rama, la palabra de confirmar y las entradas se miran antes de tocar ninguna API', (t) => {
  const m = mundo(t);
  const rama = m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio', { GITHUB_REF: 'refs/heads/claude/prueba' }));
  assert.equal(rama.codigo, 1);
  assert.match(rama.texto, /solo se lanza desde main \(se pidió desde refs\/heads\/claude\/prueba\)/);
  assert.equal(rama.peticiones.length, 0);
  const ramaSb = m.correr(SCRIPT_SUPABASE, supabase('estado', { GITHUB_REF: undefined }));
  assert.equal(ramaSb.codigo, 1);
  assert.match(ramaSb.texto, /solo se lanza desde main/);
  for (const accion of ['preparar-dominio', 'ajustar-rutas', 'crear-token-base']) {
    const r = m.correr(SCRIPT_DOMINIO, dominio(accion, { CONFIRMAR: 'correo', ...BASE }));
    assert.equal(r.codigo, 1, accion);
    assert.match(r.texto, /escribe CORREO en «confirmar»/);
    assert.equal(r.peticiones.length + r.psql.length, 0, `${accion}: nada antes de confirmar`);
  }
  for (const accion of ['estado', 'verificar-dominio']) assert.equal(m.correr(SCRIPT_DOMINIO, { ACCION: accion }, 'comprobar').codigo, 0, `${accion} no pide confirmar`);
  assert.equal(m.correr(SCRIPT_SUPABASE, { ACCION: 'estado' }, 'comprobar').codigo, 0);
  for (const accion of ['plantillas', 'smtp-lettermint']) {
    const r = m.correr(SCRIPT_SUPABASE, supabase(accion, { CONFIRMAR: '', ...SMTP_OK }));
    assert.equal(r.codigo, 1);
    assert.match(r.texto, /escribe SUPABASE en «confirmar»/);
    assert.equal(r.peticiones.length, 0);
  }
  const malas = [
    [SCRIPT_DOMINIO, dominio('borrar-todo'), /Acción no válida/],
    [SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, REMITENTE: 'avisos@otro-dominio.com' }), /del dominio rwadar\.app/],
    [SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, REMITENTE: 'RWAdar <avisos@rwadar.app>' }), /sin nombre ni <>/],
    [SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, ROTAR: 'si' }), /«rotar» solo admite SI/],
    [SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, CUENTA_VERIFICADA: '' }), /APROBADO la verificación de la cuenta/],
    [SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, CUENTA_VERIFICADA: 'si' }), /escribe SI en «cuenta_verificada»/],
    [SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, REMITENTE: 'rwadares@gmail.com' }), /del dominio rwadar\.app/],
    [SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, CORREO_PRUEBA: 'no es un correo' }), /«correo_prueba» debe ser/],
  ];
  for (const [script, entorno, esperado] of malas) {
    const r = m.correr(script, entorno);
    assert.equal(r.codigo, 1, String(esperado));
    assert.match(r.texto, esperado);
    assert.equal(r.peticiones.length + r.psql.length, 0, `${esperado}: nada antes de validar`);
    assert.match(r.stdout, /^::error::/m, 'sale como error de GitHub');
  }
});

test('si falta un secreto, o está mal pegado, lo dice en llano antes de tocar nada', (t) => {
  const m = mundo(t);
  const casos = [
    [SCRIPT_DOMINIO, dominio('preparar-dominio', { CLOUDFLARE_DNS_TOKEN: '' }), /Falta el secreto de GitHub CLOUDFLARE_DNS_TOKEN \(token de la API de Cloudflare con Zone:Read y DNS:Edit solo sobre rwadar\.app\)/],
    [SCRIPT_DOMINIO, dominio('preparar-dominio', { LETTERMINT_TEAM_TOKEN: undefined }), /Falta el secreto de GitHub LETTERMINT_TEAM_TOKEN \(token DE EQUIPO/],
    [SCRIPT_DOMINIO, dominio('verificar-dominio', { LETTERMINT_TEAM_TOKEN: `${CLAVE_LM}\n` }), /LETTERMINT_TEAM_TOKEN no tiene forma de token .*¿Se pegó con un espacio o un salto de línea/],
    [SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, SUPABASE_DB_URL: '' }), /Falta el secreto de GitHub SUPABASE_DB_URL .*no se crea ninguno/],
    [SCRIPT_SUPABASE, supabase('estado', { SUPABASE_ACCESS_TOKEN: '' }), /Falta el secreto de GitHub SUPABASE_ACCESS_TOKEN \(token personal de Supabase/],
    [SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, LETTERMINT_TEAM_TOKEN: '' }), /Falta el secreto de GitHub LETTERMINT_TEAM_TOKEN/],
  ];
  for (const [script, entorno, esperado] of casos) {
    const r = m.correr(script, entorno);
    assert.equal(r.codigo, 1, String(esperado));
    assert.match(r.texto, esperado);
    assert.match(r.texto, /Settings › Secrets and variables › Actions|SUPABASE_DB_URL/);
    assert.equal(r.peticiones.length + r.psql.length, 0, `${esperado}: nada antes de tener las claves`);
    sinFugas(r, []);
  }
  // estado enseña lo que puede con una sola clave y acaba en rojo diciendo cuál falta.
  const media = m.correr(SCRIPT_DOMINIO, dominio('estado', { CLOUDFLARE_DNS_TOKEN: '' }));
  assert.equal(media.codigo, 1);
  assert.match(media.texto, /Proyecto «RWAdar»: existe/);
  assert.match(media.texto, /\(sin CLOUDFLARE_DNS_TOKEN: no se mira Cloudflare\)/);
  assert.match(media.texto, /PARADO: Falta el secreto de GitHub CLOUDFLARE_DNS_TOKEN/);
  assert.ok(media.peticiones.every((p) => p.host === 'api.lettermint.co' && p.metodo === 'GET'));
});

/* ======================================================= preparar-dominio */
test('preparar-dominio: desde cero crea el dominio, lo asocia, pone solo los registros que faltan (DNS only) y verifica; repetirlo no cambia nada', (t) => {
  const m = mundo(t);
  const r = m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r.codigo, 0, r.texto);
  assert.equal(de(r, 'POST', /^\/v1\/domains$/).length, 1);
  assert.deepEqual(de(r, 'POST', /^\/v1\/domains$/)[0].cuerpo, { domain: 'rwadar.app' });
  assert.deepEqual(de(r, 'PUT', /^\/v1\/domains\/dom-1\/projects$/)[0].cuerpo, { project_ids: ['p-1'] });
  const creados = de(r, 'POST', /dns_records$/, 'api.cloudflare.com').map((p) => p.cuerpo);
  assert.equal(creados.length, 4);
  for (const c of creados.filter((x) => x.type === 'CNAME')) assert.equal(c.proxied, false, `${c.name}: DNS only`);
  assert.deepEqual(creados.find((c) => c.type === 'TXT'),
    { type: 'TXT', name: '_dmarc.rwadar.app', ttl: 1, comment: 'Lettermint (flujo «Dominio de correo» de RWAdar)', content: 'v=DMARC1; p=none' });
  assert.equal(de(r, 'POST', /dns-records\/verify$/).length, 1);
  assert.match(r.texto, /Necesarios verificados: 4 de 4\./);
  assert.match(r.texto, /rwadar\.app verificado en Lettermint\./);
  assert.equal(m.estado().lm.dominios[0].status, 'verified');
  // Nunca se borra ni se cambia nada en Cloudflare.
  assert.equal(r.peticiones.filter((p) => p.host === 'api.cloudflare.com' && !['GET', 'POST'].includes(p.metodo)).length, 0);
  sinFugas(r, []);

  const otra = m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(otra.codigo, 0, otra.texto);
  assert.equal(otra.peticiones.filter((p) => p.metodo !== 'GET' && !/dns-records\/verify$/.test(p.ruta)).length, 0, 'la segunda vez solo lee y verifica');
  assert.match(otra.texto, /El dominio rwadar\.app ya estaba en Lettermint\./);
  assert.match(otra.texto, /Ya estaba asociado al proyecto «RWAdar»\./);
  assert.equal((otra.texto.match(/: ya está, igual/g) || []).length, 4);
  assert.match(otra.texto, /Ninguno: ya estaban todos\./);
  assert.equal(m.estado().cf.registros.length, 4);
});

test('preparar-dominio: al asociar el dominio suma el proyecto a los que ya tuviera, sin quitar ninguno', (t) => {
  const m = mundo(t, estadoInicial((e) => {
    e.lm.proyectos.push({ id: 'p-2', name: 'Otro', delivery_mode: 'live', smtp_enabled: false });
    e.lm.dominios.push({ id: 'dom-9', domain: 'rwadar.app', status: 'pending_verification', project_ids: ['p-2'],
      dns_records: REGISTROS_LM.map((x, i) => ({ id: `reg-${i}`, status: 'pending', required_for_verification: true, ...x })) });
  }));
  const r = m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r.codigo, 0, r.texto);
  assert.equal(de(r, 'POST', /^\/v1\/domains$/).length, 0);
  assert.deepEqual(de(r, 'PUT', /projects$/)[0].cuerpo, { project_ids: ['p-2', 'p-1'] });
});

test('preparar-dominio: si un registro choca con lo que hay, para ANTES de crear nada y no toca el que existe', (t) => {
  const casos = [
    [{ name: 'lm1._domainkey.rwadar.app', type: 'CNAME', content: 'clave.otro-proveedor.example', proxied: false },
      /CONFLICTO[\s\S]*ya hay un CNAME que apunta a clave\.otro-proveedor\.example, y Lettermint pide que apunte a lm1\.rwadar-app\.dkim\.lmta\.net\. No se cambia/],
    [{ name: 'lm-bounces.rwadar.app', type: 'A', content: '192.0.2.10', proxied: false }, /ya hay otros registros en ese nombre \(A\) y un CNAME no puede convivir con ninguno/],
    [{ name: 'lm2._domainkey.rwadar.app', type: 'CNAME', content: 'lm2.rwadar-app.dkim.lmta.net', proxied: true }, /en naranja \(«Proxied»\)[\s\S]*«DNS only» \(nube gris\)/],
    [{ name: '_dmarc.rwadar.app', type: 'CNAME', content: 'dmarc.otro.example', proxied: false }, /ya hay un CNAME en ese nombre \(apunta a dmarc\.otro\.example\) y no puede convivir con un TXT/],
  ];
  for (const [existente, esperado] of casos) {
    const m = mundo(t, estadoInicial((e) => { e.cf.registros.push({ id: 'cf-propio', ttl: 1, ...existente }); }));
    const r = m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
    assert.equal(r.codigo, 1, existente.name);
    assert.match(r.texto, esperado);
    assert.match(r.texto, /PARADO: No se ha creado ningún registro en Cloudflare: hay un registro que choca con lo que pide Lettermint, y este flujo nunca borra ni cambia lo que ya existe\./);
    assert.equal(de(r, 'POST', /dns_records$/, 'api.cloudflare.com').length, 0, 'ni siquiera los que no chocan');
    assert.equal(r.peticiones.filter((p) => p.host === 'api.cloudflare.com' && p.metodo !== 'GET').length, 0);
    assert.deepEqual(m.estado().cf.registros, [{ id: 'cf-propio', ttl: 1, ...existente }], 'el registro que había, intacto');
    assert.equal(de(r, 'POST', /dns-records\/verify$/).length, 0);
  }
});

test('preparar-dominio: SPF que ya existe (se explica cómo fusionarlo), TXT con comillas, varios TXT en el mismo nombre y un DMARC propio', (t) => {
  const conSpf = (registros) => estadoInicial((e) => { e.lm.registrosAlCrear.push(structuredClone(SPF_LM)); e.cf.registros.push(...registros); });
  const verificacion = { id: 'cf-v', name: 'rwadar.app', type: 'TXT', content: '"google-site-verification=abc123"', proxied: false, ttl: 1 };
  // Otro SPF en la raíz: para, sin duplicarlo ni cambiarlo, y dice qué añadir.
  const otroSpf = { id: 'cf-s', name: 'rwadar.app', type: 'TXT', content: '"v=spf1 include:_spf.google.com ~all"', proxied: false, ttl: 1 };
  const m1 = mundo(t, conSpf([verificacion, otroSpf]));
  const r1 = m1.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r1.codigo, 1);
  assert.match(r1.texto, /ya hay un SPF en ese nombre \(«v=spf1 include:_spf\.google\.com ~all»\) y solo puede haber uno/);
  assert.match(r1.texto, /déjalo así: «v=spf1 include:_spf\.google\.com include:spf\.lmta\.net ~all» \(se añade include:spf\.lmta\.net\)/);
  assert.equal(de(r1, 'POST', /dns_records$/).length, 0);
  assert.equal(m1.estado().cf.registros.length, 2);
  // El mismo SPF, entre comillas como lo devuelve Cloudflare, junto a otro TXT: ya está.
  const m2 = mundo(t, conSpf([verificacion, { ...otroSpf, content: '"v=spf1 include:spf.lmta.net ~all"' }]));
  const r2 = m2.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r2.codigo, 0, r2.texto);
  assert.match(r2.texto, /TXT {3}rwadar\.app: ya está, igual/);
  assert.ok(!de(r2, 'POST', /dns_records$/).some((p) => p.cuerpo.name === 'rwadar.app'));
  // Solo hay otro TXT en la raíz: el SPF se añade a su lado (se compara por contenido).
  const m3 = mundo(t, conSpf([verificacion]));
  const r3 = m3.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r3.codigo, 0, r3.texto);
  assert.deepEqual(de(r3, 'POST', /dns_records$/).filter((p) => p.cuerpo.name === 'rwadar.app').map((p) => p.cuerpo.content), ['v=spf1 include:spf.lmta.net ~all']);
  assert.equal(m3.estado().cf.registros.filter((x) => x.name === 'rwadar.app' && x.type === 'TXT').length, 2);
  // Un SPF que ya incluye lo de Lettermint (y más) vale y no se toca.
  const m4 = mundo(t, conSpf([{ ...otroSpf, content: 'v=spf1 include:_spf.google.com include:spf.lmta.net -all' }]));
  const r4 = m4.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r4.codigo, 0, r4.texto);
  assert.match(r4.texto, /hay uno propio que vale: no se toca \(el SPF que ya hay incluye ya lo que pide Lettermint/);
  // Un DMARC propio distinto: no se añade un segundo ni se cambia.
  const m5 = mundo(t, estadoInicial((e) => { e.cf.registros.push({ id: 'cf-d', name: '_dmarc.rwadar.app', type: 'TXT', content: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@rwadar.app', proxied: false, ttl: 1 }); }));
  const r5 = m5.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.match(r5.texto, /_dmarc\.rwadar\.app: hay uno propio que vale: no se toca \(ya hay un DMARC propio/);
  assert.ok(!de(r5, 'POST', /dns_records$/).some((p) => p.cuerpo.name === '_dmarc.rwadar.app'));
  assert.equal(m5.estado().cf.registros.filter((x) => x.name === '_dmarc.rwadar.app').length, 1);
});

test('preparar-dominio: sin zona en Cloudflare o sin proyecto en Lettermint, para sin crear nada', (t) => {
  const sinZona = mundo(t, estadoInicial((e) => { e.cf.zonas = []; }));
  const r1 = sinZona.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r1.codigo, 1);
  assert.match(r1.texto, /Cloudflare no tiene la zona rwadar\.app\. Primero hay que comprar el dominio/);
  assert.equal(r1.peticiones.filter((p) => p.metodo !== 'GET').length, 0);
  const sinProyecto = mundo(t, estadoInicial((e) => { e.lm.proyectos[0].name = 'rwadar'; }));
  const r2 = sinProyecto.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r2.codigo, 1);
  assert.match(r2.texto, /No encuentro en Lettermint el proyecto «RWAdar»\. Hay uno llamado «rwadar»: renómbralo/);
  assert.equal(r2.peticiones.filter((p) => p.metodo !== 'GET').length, 0);
  const claveMala = mundo(t, estadoInicial((e) => { e.cf.clave = 'otra-clave-distinta-de-la-buena'; }));
  const r3 = claveMala.correr(SCRIPT_DOMINIO, dominio('preparar-dominio'));
  assert.equal(r3.codigo, 1);
  assert.match(r3.texto, /Cloudflare rechaza la clave \(HTTP 401\)/);
  sinFugas(r3, []);
});

test('las funciones de comparación: comillas de TXT, nombres con punto final y registros raros de Lettermint', () => {
  assert.equal(textoTXT('"v=DKIM1; k=rsa; p=MIGf" "MA0GCSqGSIb3"'), 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3');
  assert.deepEqual(registroCF({ id: 'x', name: 'LM1._domainkey.rwadar.app.', type: 'cname', content: 'Lm1.Ejemplo.NET.' }),
    { id: 'x', tipo: 'CNAME', nombre: 'lm1._domainkey.rwadar.app', valor: 'lm1.ejemplo.net', proxied: false });
  assert.equal(registroCF({ name: 'rwadar.app', type: 'MX', content: 'mx.ejemplo.net', priority: 10 }).valor, '10 mx.ejemplo.net');
  const dom = (r) => ({ dns_records: [{ id: 'a', status: 'pending', verification_scope: 'required', ...r }] });
  assert.equal(registrosPedidos(dom({ type: 'CNAME', hostname: 'lm1._domainkey', content: 'x.lmta.net' }))[0].nombre, 'lm1._domainkey.rwadar.app', 'sin fqdn, con hostname');
  assert.throws(() => registrosPedidos(dom({ type: 'A', fqdn: 'rwadar.app', content: '1.2.3.4' })), /tipo «A»/);
  assert.throws(() => registrosPedidos(dom({ type: 'TXT', fqdn: 'rwadar.app.evil.example', content: 'x' })), /fuera de rwadar\.app/);
  assert.throws(() => registrosPedidos(dom({ type: 'MX', fqdn: 'rwadar.app', content: 'mx.lmta.net' })), /no adivina la prioridad/);
  assert.throws(() => registrosPedidos(dom({ type: 'TXT', fqdn: 'rwadar.app', content: 'v=spf1\ninclude:x' })), /forma rara/);
  const viejo = registrosPedidos(dom({ type: 'TXT', fqdn: 'lm._domainkey.rwadar.app', content: 'v=DKIM1; p=abc', verification_scope: 'deprecated' }));
  assert.deepEqual(planificar(viejo, []), [], 'los «deprecated» no se ponen');
  const mx = registrosPedidos(dom({ type: 'MX', fqdn: 'lm-bounces.rwadar.app', content: '10 feedback.lmta.net' }));
  assert.equal(planificar(mx, [{ tipo: 'MX', nombre: 'lm-bounces.rwadar.app', valor: '20 otro.example', proxied: false }])[0].decision, 'conflicto');
  assert.equal(planificar(mx, [])[0].decision, 'crear');
});

/* ======================================================= estado y verificar-dominio */
test('estado (dominio): solo lee y lo cuenta todo, con los valores acortados y lo que haría preparar-dominio', (t) => {
  const m = mundo(t, estadoInicial((e) => {
    e.cf.registros.push({ id: 'cf-1', name: 'lm1._domainkey.rwadar.app', type: 'CNAME', content: 'clave.otro-proveedor.example', proxied: false, ttl: 1 },
      { id: 'cf-2', name: 'rwadar.app', type: 'TXT', content: `"google-site-verification=${'x'.repeat(60)}"`, proxied: false, ttl: 1 },
      { id: 'cf-3', name: 'www.rwadar.app', type: 'CNAME', content: 'rwadar.pages.dev', proxied: true, ttl: 1 });
    e.lm.tokens.push({ id: 'tok-0', project_id: 'p-1', name: 'RWAdar base (API)', token: 'lm_valor_que_nunca_se_ve_0001', created_at: '2026-11-07T09:00:00Z', last_used_at: null });
    e.lm.historial.push('lm_valor_que_nunca_se_ve_0001');
  }));
  m.correr(SCRIPT_DOMINIO, dominio('preparar-dominio')); // para con el conflicto, pero deja el dominio añadido
  const r = m.correr(SCRIPT_DOMINIO, dominio('estado', { CONFIRMAR: '' }));
  assert.equal(r.codigo, 0, r.texto);
  assert.ok(r.peticiones.every((p) => p.metodo === 'GET'), 'solo lee');
  assert.match(r.texto, /Zona rwadar\.app: activa\./);
  assert.match(r.texto, /Equipo: plan free; verificación de la cuenta: sin aprobar todavía/);
  assert.match(r.texto, /Dominio rwadar\.app: pendiente de verificar; asociado al proyecto «RWAdar»\./);
  assert.match(r.texto, /CNAME lm1\._domainkey\.rwadar\.app: pendiente \(necesario\)/);
  assert.match(r.texto, /«transactional» \(transactional, la de por defecto\): seguimiento: no existe en este plan \(correcto: nada que apagar\)/);
  assert.match(r.texto, /«broadcast» \(broadcast\): .*enlace de baja de Lettermint: puesto \(lo normal en el plan gratis\)/);
  assert.match(r.texto, /«RWAdar base \(API\)»: creado 2026-11-07, último uso nunca/);
  assert.match(r.texto, /\(no hay ninguno «RWAdar Auth \(SMTP\)»\)/);
  assert.match(r.texto, /TXT {3}rwadar\.app → google-site-verification=x{15}… \(85 caracteres\)/);
  assert.doesNotMatch(r.texto, /www\.rwadar\.app/, 'solo los registros del correo');
  assert.match(r.texto, /Lo que haría preparar-dominio \(sin hacerlo\): crear 3 · ya están 0 · conflictos 1\./);
  sinFugas(r, []);
  // El token que ya había no es nuevo (no se enmascara), pero su valor tampoco aparece nunca.
  assert.ok(!r.texto.includes('lm_valor_que_nunca_se_ve_0001'));
});

test('verificar-dominio: cuenta cada registro y sale en rojo mientras falte alguno; en verde cuando están', (t) => {
  const m = mundo(t);
  const sin = m.correr(SCRIPT_DOMINIO, dominio('verificar-dominio', { CONFIRMAR: '' }));
  assert.equal(sin.codigo, 1);
  assert.match(sin.texto, /El dominio rwadar\.app no está en Lettermint: lanza antes preparar-dominio\./);
  m.cambiar((e) => {
    e.lm.dominios.push({ id: 'dom-1', domain: 'rwadar.app', status: 'pending_verification', project_ids: ['p-1'],
      dns_records: REGISTROS_LM.map((x, i) => ({ id: `reg-${i}`, status: 'pending', required_for_verification: true, ...x })) });
    e.cf.registros.push({ id: 'cf-1', name: 'lm1._domainkey.rwadar.app', type: 'CNAME', content: 'lm1.rwadar-app.dkim.lmta.net', proxied: false, ttl: 1 });
  });
  const mal = m.correr(SCRIPT_DOMINIO, dominio('verificar-dominio', { CONFIRMAR: '' }));
  assert.equal(mal.codigo, 1);
  assert.match(mal.texto, /Verificación de rwadar\.app en Lettermint: verificado a medias\./);
  assert.match(mal.texto, /CNAME lm1\._domainkey\.rwadar\.app: verificado \(necesario\)/);
  assert.match(mal.texto, /CNAME lm-bounces\.rwadar\.app: falla \(necesario\)/);
  assert.match(mal.texto, /todavía no está verificado del todo \(1 de 4 registros necesarios\)/);
  assert.match(mal.texto, /Lettermint dice: «One or more required DNS records failed verification\.»/);
  assert.ok(mal.peticiones.every((p) => p.host === 'api.lettermint.co'), 'no necesita Cloudflare');
  m.cambiar((e) => { e.cf.registros = REGISTROS_LM.map((x, i) => ({ id: `cf-${i}`, name: x.fqdn, type: x.type, content: x.content, proxied: false, ttl: 1 })); });
  const bien = m.correr(SCRIPT_DOMINIO, dominio('verificar-dominio', { CONFIRMAR: '' }));
  assert.equal(bien.codigo, 0, bien.texto);
  assert.match(bien.texto, /Necesarios verificados: 4 de 4\./);
  assert.match(bien.texto, /rwadar\.app verificado: ya se puede enviar desde él\./);
});

/* ======================================================= ajustar-rutas */
test('ajustar-rutas: en el plan gratis el seguimiento no existe (correcto) y el enlace de baja se rechaza (lo esperable); no es un fallo', (t) => {
  const m = mundo(t);
  const r = m.correr(SCRIPT_DOMINIO, dominio('ajustar-rutas'));
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /«transactional» .*: el seguimiento de aperturas y clics no existe en este plan\. Correcto: no hay nada que apagar\./);
  assert.match(r.texto, /«broadcast» .*: Lettermint NO deja quitar su enlace de baja \(HTTP 422: «Disabling hosted unsubscribe is not enabled for this team\.»\)\. Es lo esperable en el plan gratis/);
  assert.match(r.texto, /las pasa a RWAdar el flujo «Correo Lettermint» \(sincronizar-bajas\)/);
  const puts = de(r, 'PUT', /^\/v1\/routes\//);
  assert.deepEqual(puts.map((p) => [p.ruta, p.cuerpo]), [['/v1/routes/r-2', { settings: { disable_hosted_unsubscribe: true } }]], 'no intenta tocar un seguimiento que no existe');
});

test('ajustar-rutas: con seguimiento encendido lo apaga y quita el enlace de baja si el plan lo deja; repetirlo no cambia nada', (t) => {
  const m = mundo(t, estadoInicial((e) => {
    e.lm.seguimientoDisponible = true; e.lm.desuscripcionDisponible = true;
    e.lm.rutas[0].settings.track_opens = true; e.lm.rutas[1].settings.track_clicks = true;
  }));
  const r = m.correr(SCRIPT_DOMINIO, dominio('ajustar-rutas'));
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /«transactional» .*: seguimiento APAGADO ahora\./);
  assert.match(r.texto, /«broadcast» .*: seguimiento APAGADO ahora\./);
  assert.match(r.texto, /«broadcast» .*: enlace de baja de Lettermint QUITADO\./);
  const e = m.estado();
  assert.deepEqual(e.lm.rutas.map((x) => [x.settings.track_opens, x.settings.track_clicks]), [[false, false], [false, false]]);
  assert.equal(e.lm.rutas[1].settings.disable_hosted_unsubscribe, true);
  const otra = m.correr(SCRIPT_DOMINIO, dominio('ajustar-rutas'));
  assert.equal(otra.codigo, 0);
  assert.equal(de(otra, 'PUT', /routes/).length, 0);
  assert.match(otra.texto, /seguimiento ya apagado/);
  assert.match(otra.texto, /el enlace de baja de Lettermint ya estaba quitado/);
});

test('ajustar-rutas: si el token no tiene permiso, o el seguimiento sigue encendido, sale en rojo', (t) => {
  const sinPermiso = mundo(t, estadoInicial((e) => { e.lm.sinPermiso = ['^PUT /routes/']; }));
  const r1 = sinPermiso.correr(SCRIPT_DOMINIO, dominio('ajustar-rutas'));
  assert.equal(r1.codigo, 1);
  assert.match(r1.texto, /A la clave le falta un permiso \(HTTP 403\)\. Lettermint dice: «ABILITY_NOT_HELD/);
  const encendido = mundo(t, estadoInicial((e) => { e.lm.seguimientoDisponible = true; e.lm.rutas[0].settings.track_clicks = true; e.lm.sinPermiso = ['^PUT /routes/r-1']; }));
  const r2 = encendido.correr(SCRIPT_DOMINIO, dominio('ajustar-rutas'));
  assert.equal(r2.codigo, 1);
  assert.match(r2.texto, /El seguimiento sigue encendido en «transactional»/);
});

/* ======================================================= crear-token-base */
test('crear-token-base: comprueba la base, crea el token, lo enmascara, lo guarda en Vault y nunca lo deja ver', (t) => {
  const m = mundo(t);
  const r = m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(r.codigo, 0, r.texto);
  const e = m.estado();
  assert.equal(e.lm.tokens.length, 1);
  assert.equal(e.lm.tokens[0].name, 'RWAdar base (API)');
  const token = e.lm.tokens[0].token;
  const vault = m.psqlConfig().vault;
  assert.equal(vault.LETTERMINT_API_TOKEN, token, 'el de Vault es el que se acaba de crear');
  assert.equal(vault.RWADAR_REMITENTE, 'avisos@rwadar.app');
  // Primero la base (solo lee), después crear, después guardar.
  assert.ok(lugar(r, /^psql stdin$/) < lugar(r, /^http POST api\.lettermint\.co\/v1\/projects\/p-1\/api-tokens$/));
  assert.ok(lugar(r, /^http POST .*api-tokens$/) < lugar(r, /^psql 31_correo_lettermint_guardar\.sql$/));
  assert.equal(r.psql.length, 2);
  assert.ok(r.psql[0].soloLectura, 'la comprobación es una transacción de solo lectura');
  for (const p of r.psql) { assert.equal(p.primero, 'dbUrl'); assert.equal(p.PGSSLMODE, 'require'); }
  assert.equal(r.psql[1].token, huellaDoble(token), 'a psql le llega el token, como variable');
  assert.equal(r.psql[1].remitente, 'avisos@rwadar.app');
  assert.match(r.texto, /Guardado en Vault: LETTERMINT_API_TOKEN y RWADAR_REMITENTE \(avisos@rwadar\.app\)\. El correo sigue apagado/);
  sinFugas(r, [token]);
  // TLS obligatorio aunque el entorno no lo diga.
  const sinTls = m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, PGSSLMODE: undefined }));
  assert.equal(sinTls.psql[0].PGSSLMODE, 'require');
});

test('crear-token-base: no crea otro sin rotar = SI; al rotar, borra el viejo solo después de guardar el nuevo', (t) => {
  const m = mundo(t);
  assert.equal(m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE)).codigo, 0);
  const viejo = m.estado().lm.tokens[0];
  const otra = m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(otra.codigo, 0, otra.texto);
  assert.match(otra.texto, /Ya está hecho: hay un token «RWAdar base \(API\)» y Vault guarda un LETTERMINT_API_TOKEN\. No se crea otro\./);
  assert.equal(de(otra, 'POST', /api-tokens$/).length, 0);
  assert.equal(otra.psql.filter((p) => p.archivo !== 'stdin').length, 0);
  const rotar = m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, ROTAR: 'SI' }));
  assert.equal(rotar.codigo, 0, rotar.texto);
  const e = m.estado();
  assert.equal(e.lm.tokens.length, 1, 'sin tokens sin dueño');
  assert.notEqual(e.lm.tokens[0].id, viejo.id);
  assert.equal(m.psqlConfig().vault.LETTERMINT_API_TOKEN, e.lm.tokens[0].token);
  assert.ok(lugar(rotar, /^psql 31_correo_lettermint_guardar\.sql$/) < lugar(rotar, new RegExp(`^http DELETE .*api-tokens/${viejo.id}$`)), 'el viejo se borra después de guardar el nuevo');
  assert.match(rotar.texto, /Borrado el token anterior \(creado 2026-11-08\)\./);
  sinFugas(rotar, [e.lm.tokens[0].token]);
  assert.ok(!rotar.texto.includes(viejo.token));
});

test('crear-token-base: si guardar en Vault falla, borra el token recién creado y deja el viejo como estaba (sin tokens huérfanos)', (t) => {
  const m = mundo(t);
  assert.equal(m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE)).codigo, 0);
  const viejo = m.estado().lm.tokens[0];
  m.cambiarPsql((c) => { c.guardarFalla = true; });
  const r = m.correr(SCRIPT_DOMINIO, dominio('crear-token-base', { ...BASE, ROTAR: 'SI' }));
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /No se pudo guardar el token nuevo en el Vault \(psql:.*could not serialize access.*\)\. Se ha borrado el token recién creado en Lettermint: no queda ninguno sin usar\. El token anterior sigue como estaba/);
  const e = m.estado();
  assert.deepEqual(e.lm.tokens.map((x) => x.id), [viejo.id]);
  assert.equal(m.psqlConfig().vault.LETTERMINT_API_TOKEN, viejo.token);
  const nuevo = e.lm.historial.at(-1);
  assert.notEqual(nuevo, viejo.token);
  sinFugas(r, [nuevo]);
});

test('crear-token-base: sin base que responda, o con un token o un Vault ya puestos, no crea ningún token', (t) => {
  const caida = mundo(t, estadoInicial(), { conectarFalla: true });
  const r1 = caida.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(r1.codigo, 1);
  assert.match(r1.texto, /No se pudo comprobar la base antes de crear nada \(psql: error: connection to server .* failed: timeout expired\)\. No se ha creado ningún token\./);
  assert.equal(r1.peticiones.length, 0);
  assert.equal(caida.estado().lm.tokens.length, 0);
  sinFugas(r1, []);
  const sinVault = mundo(t, estadoInicial(), { sinVault: true });
  assert.match(sinVault.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE)).texto, /La base no tiene Vault/);
  assert.equal(sinVault.estado().lm.tokens.length, 0);
  const tokenSinVault = mundo(t, estadoInicial((e) => {
    e.lm.tokens.push({ id: 'tok-a', project_id: 'p-1', name: 'RWAdar base (API)', token: 'lm_a_mano_por_victor_000001', created_at: '2026-11-07T09:00:00Z' });
  }));
  const r2 = tokenSinVault.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(r2.codigo, 1);
  assert.match(r2.texto, /Ya hay un token «RWAdar base \(API\)» en Lettermint, pero Vault no guarda ninguno\. No se crea otro sin permiso: relanza con «rotar» = SI/);
  assert.equal(de(r2, 'POST', /api-tokens$/).length, 0);
  const vaultSinToken = mundo(t, estadoInicial(), { vault: { LETTERMINT_API_TOKEN: 'lm_guardado_con_guardar_correo_01' } });
  const r3 = vaultSinToken.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(r3.codigo, 1);
  assert.match(r3.texto, /Vault ya guarda un LETTERMINT_API_TOKEN \(quizá de «guardar-correo»/);
  assert.equal(de(r3, 'POST', /api-tokens$/).length, 0);
  // Un token con forma rara no se escribe (ni en ::add-mask::) y se borra.
  const raro = mundo(t, estadoInicial((e) => { e.lm.tokenRaro = 'token con espacios que partiria la mascara'; }));
  const r4 = raro.correr(SCRIPT_DOMINIO, dominio('crear-token-base', BASE));
  assert.equal(r4.codigo, 1);
  assert.match(r4.texto, /devolvió el token «RWAdar base \(API\)» con una forma inesperada: no se ha usado ni guardado y se ha intentado borrar/);
  assert.ok(!r4.texto.includes('token con espacios'));
  assert.doesNotMatch(r4.stdout, /::add-mask::/);
  assert.equal(raro.estado().lm.tokens.length, 0);
  assert.equal(r4.psql.filter((p) => p.archivo !== 'stdin').length, 0);
});

/* ======================================================= Supabase · estado y plantillas */
test('estado (Supabase): proyecto, versión, si se puede actualizar, solo los campos de Auth que no son secretos y las plantillas por SHA-256', (t) => {
  const m = mundo(t);
  const r = m.correr(SCRIPT_SUPABASE, supabase('estado', { CONFIRMAR: '', LETTERMINT_TEAM_TOKEN: undefined }));
  assert.equal(r.codigo, 0, r.texto);
  assert.ok(r.peticiones.every((p) => p.metodo === 'GET' && p.host === 'api.supabase.com'), 'solo lee, y solo Supabase');
  assert.match(r.texto, /Proyecto exgpmjpaaebyoolpwced: ACTIVE_HEALTHY\./);
  assert.match(r.texto, /Postgres: 17\.4\.1\.054 \(motor 17, canal ga\)\./);
  assert.match(r.texto, /¿Se puede actualizar Postgres\?: sí\./);
  assert.match(r.texto, /la última: 17\.6\.1\.011/);
  for (const c of CAMPOS_ESTADO) assert.match(r.texto, new RegExp(`\\n  ${c}: `), c);
  assert.match(r.texto, /smtp_host: smtp\.gmail\.com/);
  assert.doesNotMatch(r.texto, /smtp_pass|external_google|smtp_max_frequency/, 'ningún otro campo');
  assert.match(r.texto, /Plantilla de confirmación: distinta que rwadar-app\/plantillas-auth\/confirmar-alta\.html · asunto distinto\./);
  assert.match(r.texto, /Otras plantillas de Auth sin la dirección postal en el pie: enlace mágico/);
  sinFugas(r, []);
  m.cambiar((e) => { e.supa.auth = { ...structuredClone(AUTH_CON_PLANTILLAS), mailer_templates_recovery_content: `${PLANTILLA_RECUPERAR}\r\n\r\n` }; e.supa.elegibilidad = null; });
  const igual = m.correr(SCRIPT_SUPABASE, supabase('estado', { CONFIRMAR: '' }));
  assert.equal(igual.codigo, 0, igual.texto);
  assert.match(igual.texto, /Plantilla de confirmación: igual .* · asunto igual\./);
  assert.match(igual.texto, /Plantilla de recuperación: igual .* · asunto igual\./, 'sin contar \\r ni saltos de línea al final');
  assert.match(igual.texto, /¿Se puede actualizar Postgres\?: no se pudo consultar \(Supabase no lo encuentra \(HTTP 404\)/);
});

test('plantillas: pone los asuntos del LEEME y las dos plantillas, guarda antes las que había y, si ya están, no cambia nada', (t) => {
  const pl = leerPlantillas();
  assert.equal(pl.asuntoConfirmacion, 'Confirma tu correo y desbloquea gratis la Academy');
  assert.equal(pl.asuntoRecuperacion, 'Recupera tu acceso a RWAdar');
  const m = mundo(t);
  const r = m.correr(SCRIPT_SUPABASE, supabase('plantillas', { LETTERMINT_TEAM_TOKEN: undefined }));
  assert.equal(r.codigo, 0, r.texto);
  const patch = de(r, 'PATCH', /config\/auth$/);
  assert.equal(patch.length, 1);
  assert.deepEqual(patch[0].cuerpo, {
    mailer_subjects_confirmation: pl.asuntoConfirmacion, mailer_subjects_recovery: pl.asuntoRecuperacion,
    mailer_templates_confirmation_content: PLANTILLA_CONFIRMAR, mailer_templates_recovery_content: PLANTILLA_RECUPERAR,
  });
  const dir = /^PLANTILLAS_ANTERIORES=(.+)$/m.exec(r.githubEnv)?.[1];
  assert.ok(dir && dir.startsWith(m.runner), 'la carpeta de la vuelta atrás, en RUNNER_TEMP');
  assert.equal(fs.readFileSync(path.join(dir, 'confirmar-alta.anterior.html'), 'utf8'), AUTH_GMAIL.mailer_templates_confirmation_content);
  assert.equal(fs.readFileSync(path.join(dir, 'asuntos.anteriores.txt'), 'utf8'), 'Confirm signup: Confirma tu cuenta de RWAdar\nReset password: Reset Your Password\n');
  assert.match(r.texto, /Puestas: «Confirma tu correo y desbloquea gratis la Academy» \(Confirm signup\) y «Recupera tu acceso a RWAdar» \(Reset password\)/);
  assert.equal(m.estado().supa.auth.smtp_host, 'smtp.gmail.com', 'no toca el SMTP');
  sinFugas(r, []);
  const otra = m.correr(SCRIPT_SUPABASE, supabase('plantillas'));
  assert.equal(otra.codigo, 0);
  assert.equal(de(otra, 'PATCH', /./).length, 0);
  assert.match(otra.texto, /Ya están: .* No se cambia nada\./);
});

/* ======================================================= Supabase · smtp-lettermint */
const listoParaSmtp = (cambiar = () => {}) => estadoInicial((e) => {
  e.supa.auth = structuredClone(AUTH_CON_PLANTILLAS);
  e.web.privacidad = PRIVACIDAD_LETTERMINT;
  e.lm.equipo.verified_at = '2026-11-10T08:00:00Z';
  e.lm.dominios.push({ id: 'dom-1', domain: 'rwadar.app', status: 'verified', project_ids: ['p-1'],
    dns_records: REGISTROS_LM.map((x, i) => ({ id: `reg-${i}`, status: 'active', required_for_verification: true, ...x })) });
  cambiar(e);
});

test('smtp-lettermint: no cambia nada ni crea ningún token si falta algo de lo que exige el plan', (t) => {
  const casos = [
    [(e) => { e.supa.auth = structuredClone(AUTH_GMAIL); }, /Las plantillas de Supabase todavía no son las del repositorio .* Lanza antes la acción «plantillas»/],
    [(e) => { e.web.privacidad = PRIVACIDAD_HOY; }, /La privacidad publicada \(https:\/\/rwadar\.pages\.dev\/privacidad, §6\) todavía no dice que los correos de la cuenta salen por Lettermint/],
    [(e) => { e.lm.equipo.verified_at = null; }, /la API de Lettermint dice que el equipo aún no está verificado \(verified_at vacío\)/],
    [(e) => { e.lm.dominios[0].status = 'partially_verified'; }, /El dominio rwadar\.app aún no está verificado en Lettermint: lanza «verificar-dominio»/],
    [(e) => { e.lm.proyectos[0].delivery_mode = 'sandbox'; }, /está en modo Sandbox/],
  ];
  for (const [cambiar, esperado] of casos) {
    const m = mundo(t, listoParaSmtp(cambiar));
    const r = m.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
    assert.equal(r.codigo, 1, String(esperado));
    assert.match(r.texto, esperado);
    assert.equal(de(r, 'POST', /api-tokens$/).length + de(r, 'PATCH', /./).length + de(r, 'PUT', /./).length, 0, `${esperado}: nada cambiado`);
    assert.equal(m.estado().lm.tokens.length, 0);
    assert.equal(m.estado().supa.auth.smtp_host, 'smtp.gmail.com');
  }
  // La privacidad de hoy del repositorio es justo la que no deja pasar.
  assert.match(PRIVACIDAD_HOY.replace(/\s+/g, ' '), /a través de una cuenta de Gmail de RWAdar/);
});

test('smtp-lettermint: activa el SMTP del proyecto, crea el token sin enseñarlo, enseña el SMTP de antes, cambia el de Auth y manda la prueba', (t) => {
  const m = mundo(t, listoParaSmtp());
  const r = m.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, CORREO_PRUEBA: 'victor@ejemplo.test' }));
  assert.equal(r.codigo, 0, r.texto);
  const e = m.estado();
  assert.equal(e.lm.proyectos[0].smtp_enabled, true);
  assert.deepEqual(de(r, 'PUT', /^\/v1\/projects\/p-1$/)[0].cuerpo, { smtp_enabled: true });
  assert.deepEqual(e.lm.tokens.map((x) => x.name), ['RWAdar Auth (SMTP)']);
  const token = e.lm.tokens[0].token;
  assert.deepEqual(de(r, 'PATCH', /config\/auth$/)[0].cuerpo, {
    smtp_host: 'smtp.lettermint.co', smtp_port: '587', smtp_user: 'lettermint', smtp_pass: `[token:${huellaDoble(token)}]`,
    smtp_admin_email: 'avisos@rwadar.app', smtp_sender_name: 'RWAdar',
  });
  assert.equal(e.supa.auth.smtp_pass, token);
  // El SMTP de antes se enseña ANTES de cambiarlo (vuelta atrás), sin la contraseña.
  const antes = r.stdout.indexOf('  smtp_host: smtp.gmail.com'), cambio = r.stdout.indexOf('7/7 · Supabase: cambiar el SMTP');
  assert.ok(antes > 0 && antes < cambio);
  assert.match(r.resumen, /\*\*SMTP antes del cambio \(vuelta atrás\):\*\*\n- smtp_host: smtp\.gmail\.com\n- smtp_port: 465\n- smtp_user: rwadares@gmail\.com/);
  assert.match(r.stdout, /SMTP de ahora:\n {4}smtp_host: smtp\.lettermint\.co\n {4}smtp_port: 587\n {4}smtp_user: lettermint\n {4}smtp_admin_email: avisos@rwadar\.app\n {4}smtp_sender_name: RWAdar/);
  // La prueba: con la clave publicable de la web, y solo el código HTTP.
  const prueba = de(r, 'POST', /^\/auth\/v1\/recover$/, 'exgpmjpaaebyoolpwced.supabase.co');
  assert.equal(prueba.length, 1);
  assert.deepEqual(prueba[0].cuerpo, { email: 'victor@ejemplo.test' });
  assert.equal(prueba[0].apikey, 'si');
  assert.match(r.texto, /Correo de recuperación de prueba a victor@ejemplo\.test: HTTP 200\./);
  assert.ok(lugar(r, /config\/auth$/) < lugar(r, /recover$/));
  sinFugas(r, [token]);
});

test('smtp-lettermint: no crea otro token sin rotar = SI; al rotar, borra el viejo solo después de que Supabase acepte el nuevo', (t) => {
  const m = mundo(t, listoParaSmtp());
  assert.equal(m.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK)).codigo, 0);
  const viejo = m.estado().lm.tokens[0];
  const otra = m.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
  assert.equal(otra.codigo, 0, otra.texto);
  assert.match(otra.texto, /Ya está hecho: Supabase usa el SMTP de Lettermint y hay un token «RWAdar Auth \(SMTP\)»\. No se crea otro\./);
  assert.equal(de(otra, 'POST', /api-tokens$/).length + de(otra, 'PATCH', /./).length, 0);
  const rotar = m.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, ROTAR: 'SI' }));
  assert.equal(rotar.codigo, 0, rotar.texto);
  const e = m.estado();
  assert.equal(e.lm.tokens.length, 1);
  assert.notEqual(e.lm.tokens[0].id, viejo.id);
  assert.equal(e.supa.auth.smtp_pass, e.lm.tokens[0].token);
  assert.ok(lugar(rotar, /^http PATCH .*config\/auth$/) < lugar(rotar, new RegExp(`^http DELETE .*api-tokens/${viejo.id}$`)));
  sinFugas(rotar, [e.lm.tokens[0].token]);
  // Un token del mismo nombre con Supabase todavía en Gmail: pide rotar.
  const raro = mundo(t, listoParaSmtp((x) => { x.lm.tokens.push({ id: 'tok-a', project_id: 'p-1', name: 'RWAdar Auth (SMTP)', token: 'lm_pegado_a_mano_0000000001', created_at: '2026-11-09T09:00:00Z' }); }));
  const r2 = raro.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
  assert.equal(r2.codigo, 1);
  assert.match(r2.texto, /pero Supabase no usa el SMTP de Lettermint\. No se crea otro sin permiso: relanza con «rotar» = SI/);
});

test('smtp-lettermint: si Supabase rechaza el cambio se borra el token nuevo; si no se sabe, no se borra nada', (t) => {
  const rechazo = mundo(t, listoParaSmtp((e) => { e.supa.patchFalla = 422; }));
  const r1 = rechazo.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
  assert.equal(r1.codigo, 1);
  assert.match(r1.texto, /Supabase rechazó el cambio: el SMTP sigue como estaba\..*Se ha borrado el token nuevo: no queda ninguno sin usar\./);
  assert.equal(rechazo.estado().lm.tokens.length, 0);
  sinFugas(r1, [rechazo.estado().lm.historial.at(-1)]);
  const dudoso = mundo(t, listoParaSmtp((e) => { e.supa.patchFalla = 502; }));
  const r2 = dudoso.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
  assert.equal(r2.codigo, 1);
  assert.match(r2.texto, /No se sabe si Supabase aplicó el cambio .* No se borra ningún token, para no dejar Auth sin contraseña/);
  assert.equal(de(r2, 'PATCH', /./).length, 1, 'una escritura nunca se repite sola');
  assert.equal(dudoso.estado().lm.tokens.length, 1);
  // Si Lettermint dice otro SMTP que su guía, no se cambia nada y el token se borra.
  const otroSmtp = mundo(t, listoParaSmtp((e) => { e.lm.smtpRespuesta = { host: 'smtp.eu.lettermint.co', ports: [587], username: 'lettermint' }; }));
  const r3 = otroSmtp.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', SMTP_OK));
  assert.equal(r3.codigo, 1);
  assert.match(r3.texto, /Lettermint dice que su SMTP es smtp\.eu\.lettermint\.co.*No se cambia nada en Supabase y se ha borrado el token nuevo/);
  assert.equal(de(r3, 'PATCH', /./).length, 0);
  assert.equal(otroSmtp.estado().lm.tokens.length, 0);
  // Si la prueba de recuperación falla, lo dice con el código y cómo volver atrás.
  const prueba = mundo(t, listoParaSmtp((e) => { e.supa.recuperar = 500; }));
  const r4 = prueba.correr(SCRIPT_SUPABASE, supabase('smtp-lettermint', { ...SMTP_OK, CORREO_PRUEBA: 'victor@ejemplo.test' }));
  assert.equal(r4.codigo, 1);
  assert.match(r4.texto, /Supabase no pudo mandar el correo de prueba \(HTTP 500\)/);
  sinFugas(r4, [prueba.estado().lm.tokens[0].token]);
});
