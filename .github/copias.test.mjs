// Pruebas sin red ni base de rwadar-app/copia-seguridad.sh (la copia de cada
// noche y la previa de «Aplicar catálogo» y de avisos-base) y de
// rwadar-app/ensayo-restauracion.sh. pg_dump, pg_restore, psql y gpg son
// dobles en el PATH que apuntan cada llamada y contestan lo que diga la prueba.
// Uso: node --test .github/copias.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const COPIA = path.join(raiz, 'rwadar-app/copia-seguridad.sh');
const ENSAYO = path.join(raiz, 'rwadar-app/ensayo-restauracion.sh');
const URL_DB = 'postgresql://postgres.abc:ContrasenaSecreta123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const CLAVE = 'clave-de-prueba-larga-0711';

/* Un solo doble para los cuatro programas: apunta argumentos, entrada y las
   variables PG* que recibe, y contesta según config.json. */
const DOBLE = String.raw`#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const yo = path.basename(process.argv[1]), args = process.argv.slice(2), dir = process.env.DOBLE_DIR;
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
let entrada = ''; try { entrada = fs.readFileSync(0, 'utf8'); } catch {}
fs.appendFileSync(path.join(dir, 'llamadas.jsonl'), JSON.stringify({ yo, args, entrada,
  PGOPTIONS: process.env.PGOPTIONS || '', PGSSLMODE: process.env.PGSSLMODE || '' }) + '\n');
const opcion = n => { const a = args.find(x => x.startsWith(n + '=')); return a === undefined ? undefined : a.slice(n.length + 1); };
const salir = (r = {}) => { if (r.salida) process.stdout.write(r.salida); if (r.error) process.stderr.write(r.error); process.exit(r.codigo || 0); };
const todo = args.join(' ') + '\n' + entrada;
const regla = lista => (lista || []).find(r => new RegExp(r.si).test(todo));
if (yo === 'psql') salir(regla(cfg.psql) || {});
if (yo === 'pg_dump') {
  const r = cfg.pgDump || {};
  if (!r.codigo) fs.writeFileSync(opcion('--file'), 'VOLCADO DE PRUEBA');
  salir(r);
}
if (yo === 'pg_restore') {
  if (args.includes('--list')) salir({ salida: cfg.indice });
  if (args.includes('--data-only')) {
    const esquema = opcion('--schema'), tabla = opcion('--table');
    if (esquema) salir({ salida: 'COPY ' + esquema + '.' + tabla + ' (a) FROM stdin;\n' + 'x\n'.repeat(cfg.filasCopia[esquema + '.' + tabla] || 0) + '\\.\n' });
    salir({ salida: cfg.datos });
  }
  salir(cfg.restaurar || {});
}
if (yo === 'gpg') {
  if (cfg.gpgFalla) salir({ codigo: 2, error: 'gpg: descifrado fallido\n' });
  fs.copyFileSync(args.at(-1), opcion('--output') || args[args.indexOf('--output') + 1]);
  salir();
}
salir({ codigo: 9, error: 'doble sin uso: ' + yo });
`;

function preparar(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-copias-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'doble.cjs'), DOBLE, { mode: 0o755 });
  for (const p of ['psql', 'pg_dump', 'pg_restore', 'gpg']) fs.symlinkSync(path.join(bin, 'doble.cjs'), path.join(bin, p));
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config));
  fs.writeFileSync(path.join(dir, 'llamadas.jsonl'), '');
  return dir;
}
function correr(script, argumentos, entorno, config) {
  const dir = preparar(config);
  const env = { PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`, HOME: dir, TMPDIR: dir, DOBLE_DIR: dir, ...entorno };
  const r = spawnSync('bash', [script, ...argumentos(dir)], { cwd: dir, env, encoding: 'utf8', timeout: 60000 });
  const llamadas = fs.readFileSync(path.join(dir, 'llamadas.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  const temporales = fs.readdirSync(dir).filter(n => n.startsWith('tmp.'));
  fs.rmSync(dir, { recursive: true, force: true });
  return { codigo: r.status, texto: `${r.stdout}${r.stderr}`, llamadas, temporales };
}

/* ---------- copia-seguridad.sh ---------- */
const INDICE_COPIA = [
  '; Archive created at 2026-11-07 02:43:00 UTC',
  '3901; 0 17001 TABLE DATA public plataformas postgres',
  '3902; 0 17002 TABLE DATA public fuentes postgres',
  '3903; 0 17003 TABLE DATA rwadar_catalogo revisiones postgres',
  '3904; 0 17004 TABLE DATA auth users postgres',
  '3905; 0 17005 TABLE DATA rwadar_cuentas_privadas carteras postgres', ''].join('\n');
const CARTERA = 'rwadar_cuentas_privadas\tcarteras\trwadar_cuentas_privadas.carteras\n';
const configCopia = ({ protegidas = '', salta = 'sí', enBase = '3', filas = 3, pgDump = {} } = {}) => ({
  psql: [
    { si: 'relforcerowsecurity', salida: protegidas },
    { si: 'rolbypassrls', salida: salta + '\n' },
    { si: 'set row_security = off', ...(enBase === null ? { codigo: 1, error: 'ERROR: query would be affected by row-level security policy\n' } : { salida: enBase + '\n' }) },
  ],
  pgDump, indice: INDICE_COPIA, filasCopia: { 'rwadar_cuentas_privadas.carteras': filas } });
const copia = (entorno = {}, config = configCopia()) => correr(COPIA, dir => [path.join(dir, 'salida')],
  { SUPABASE_DB_URL: URL_DB, COPIA_CLAVE: CLAVE, ...entorno }, config);
const pgDumpDe = r => r.llamadas.find(l => l.yo === 'pg_dump');

test('copia: hace, comprueba y cifra; nunca enseña la dirección ni la contraseña; TLS obligatorio', () => {
  const r = copia();
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /1\/4 · Copiando esquemas: public rwadar_catalogo auth rwadar_novedades\n/);
  assert.match(r.texto, /Hecho: .*salida\/rwadar-\d{8}-\d{4}\.dump\.gpg/);
  assert.doesNotMatch(r.texto, /ContrasenaSecreta|postgresql:\/\/|clave-de-prueba/);
  const dump = pgDumpDe(r);
  assert.equal(dump.args[0], URL_DB + '?sslmode=require', 'la dirección lleva sslmode=require');
  assert.deepEqual(dump.args.filter(a => a.startsWith('--schema=')),
    ['--schema=public', '--schema=rwadar_catalogo', '--schema=auth', '--schema=rwadar_novedades']);
  // Las suscripciones de las notificaciones web no pasan por GitHub (anexo, C3).
  assert.deepEqual(dump.args.filter(a => a.startsWith('--exclude-table-data=')),
    ['--exclude-table-data=rwadar_novedades.suscripciones_web', '--exclude-table-data=rwadar_novedades.envios_web']);
  assert.ok(!dump.args.some(a => a.startsWith('--exclude-table=') || a.startsWith('--exclude-schema=')), 'las tablas siguen en la copia, sin datos');
  for (const l of r.llamadas.filter(x => x.yo === 'psql')) assert.equal(l.args[0], URL_DB + '?sslmode=require');
  // Sin tablas con FORCE RLS no pregunta por BYPASSRLS ni cuenta filas en la base.
  assert.ok(!r.llamadas.some(l => /rolbypassrls|row_security/.test(l.args.join(' ') + l.entrada)));
  assert.equal(r.temporales.length, 0, 'borra su carpeta temporal');
  // Si la dirección ya trae sslmode, no se toca; un Postgres local no usa TLS.
  assert.equal(pgDumpDe(copia({ SUPABASE_DB_URL: URL_DB + '?sslmode=verify-full' })).args[0], URL_DB + '?sslmode=verify-full');
  assert.equal(pgDumpDe(copia({ SUPABASE_DB_URL: 'postgresql://postgres:x@localhost:5432/postgres' })).args[0],
    'postgresql://postgres:x@localhost:5432/postgres?sslmode=disable');
});

test('copia: rechaza nombres de esquema no válidos (sin tocar la base) y quita los repetidos', () => {
  for (const malo of ['public;drop', 'Mayus', 'con-guion', '1empieza', "rwadar' or 1=1"]) {
    const r = copia({ COPIA_ESQUEMAS_EXTRA: malo });
    assert.notEqual(r.codigo, 0, malo);
    assert.match(r.texto, /nombre de esquema no válido/, malo);
    assert.equal(r.llamadas.length, 0, `${malo}: no llega a llamar a psql ni a pg_dump`);
  }
  const r = copia({ COPIA_ESQUEMAS_EXTRA: 'public rwadar_cuentas_privadas rwadar_cuentas_privadas auth' });
  assert.equal(r.codigo, 0, r.texto);
  assert.deepEqual(pgDumpDe(r).args.filter(a => a.startsWith('--schema=')),
    ['--schema=public', '--schema=rwadar_catalogo', '--schema=auth', '--schema=rwadar_novedades', '--schema=rwadar_cuentas_privadas']);
});

test('copia: nunca pide --enable-row-security a pg_dump', () => {
  const r = copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' }, configCopia({ protegidas: CARTERA }));
  assert.equal(r.codigo, 0, r.texto);
  assert.ok(!pgDumpDe(r).args.some(a => /row-security/.test(a)));
  const codigo = fs.readFileSync(COPIA, 'utf8').split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert.doesNotMatch(codigo, /enable-row-security/);
});

test('copia: con FORCE RLS cuenta filas en la copia y en la base, y para si la copia sale vacía con la base llena', () => {
  const bien = copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' }, configCopia({ protegidas: CARTERA, enBase: '3', filas: 3 }));
  assert.equal(bien.codigo, 0, bien.texto);
  assert.match(bien.texto, /rwadar_cuentas_privadas\.carteras: 3 filas en la base, 3 en la copia\./);
  assert.match(bien.texto, /¿Puede el usuario de la copia saltársela \(superusuario o BYPASSRLS\)\? sí/);
  const vacia = copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' }, configCopia({ protegidas: CARTERA, enBase: '3', filas: 0 }));
  assert.notEqual(vacia.codigo, 0);
  assert.match(vacia.texto, /la copia de rwadar_cuentas_privadas\.carteras ha salido vacía y en la base tiene 3 filas/);
  assert.doesNotMatch(vacia.texto, /Hecho:/);
  assert.ok(!vacia.llamadas.some(l => l.yo === 'gpg'), 'no llega a cifrar una copia mala');
  // Vacía en la base y en la copia: es correcto.
  assert.equal(copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' }, configCopia({ protegidas: CARTERA, enBase: '0', filas: 0 })).codigo, 0);
  // Si el usuario no puede leer la tabla entera con row_security = off, para.
  const sinPermiso = copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' }, configCopia({ protegidas: CARTERA, enBase: null }));
  assert.notEqual(sinPermiso.codigo, 0);
  assert.match(sinPermiso.texto, /no puede leer entera rwadar_cuentas_privadas\.carteras \(le falta BYPASSRLS\)/);
});

test('copia: si pg_dump falla sin BYPASSRLS lo dice claro; si falla por otra cosa, no culpa a BYPASSRLS', () => {
  const sinBypass = copia({ COPIA_ESQUEMAS_EXTRA: 'rwadar_cuentas_privadas' },
    configCopia({ protegidas: CARTERA, salta: 'no', pgDump: { codigo: 1, error: 'pg_dump: error: query would be affected by row-level security policy\n' } }));
  assert.notEqual(sinBypass.codigo, 0);
  assert.match(sinBypass.texto, /¿Puede el usuario de la copia saltársela \(superusuario o BYPASSRLS\)\? no/);
  assert.match(sinBypass.texto, /le falta BYPASSRLS\)\. Quita esos esquemas de la copia/);
  const otro = copia({}, configCopia({ pgDump: { codigo: 1, error: 'pg_dump: error: connection failed\n' } }));
  assert.notEqual(otro.codigo, 0);
  assert.match(otro.texto, /ERROR: pg_dump no ha podido hacer la copia\n/);
  assert.doesNotMatch(otro.texto, /BYPASSRLS/);
});

/* ---------- flujo copia-seguridad.yml ---------- */
test('flujo de la copia: la cartera solo en modo prueba, y en prueba no se sube nada', () => {
  const flujo = fs.readFileSync(path.join(raiz, '.github/workflows/copia-seguridad.yml'), 'utf8');
  const pasos = flujo.split('\n      - name: ').slice(1).map(p => ({ nombre: p.split('\n')[0], texto: p }));
  const paso = nombre => pasos.find(p => p.nombre === nombre)?.texto || '';
  assert.equal(pasos[0].nombre, 'Comprobar lo elegido', 'lo primero es parar la cartera en modo normal');
  assert.match(paso('Comprobar lo elegido'), /\n {8}if: inputs\.esquemas == 'habituales-y-cartera' && inputs\.modo != 'prueba'\n/);
  assert.match(paso('Comprobar lo elegido'), /\n {10}exit 1\n/);
  assert.match(paso('Guardar la copia 35 días'), /\n {8}if: inputs\.modo != 'prueba'\n/);
  assert.match(paso('Guardar la copia 35 días'), /uses: actions\/upload-artifact@[0-9a-f]{40} /);
  assert.equal(pasos.filter(p => /upload-artifact/.test(p.texto)).length, 1, 'solo un paso sube algo');
  assert.match(paso('Prueba · borrar la copia sin guardarla'), /\n {8}if: always\(\) && inputs\.modo == 'prueba'\n/);
  assert.match(paso('Hacer, comprobar y cifrar la copia'),
    /COPIA_ESQUEMAS_EXTRA: \$\{\{ inputs\.esquemas == 'habituales-y-cartera' && 'rwadar_cuentas_privadas' \|\| '' \}\}/);
});

/* ---------- ensayo-restauracion.sh ---------- */
const INDICE_ENSAYO = [
  ';', '; Archive created at 2026-11-07 02:43:00 UTC', '; Dumped from database version: 17.6', ';',
  '3; 2615 16390 SCHEMA - auth postgres', '4; 2615 16391 SCHEMA - public postgres',
  '5; 2615 16392 SCHEMA - rwadar_catalogo postgres', ''].join('\n');
const DATOS = ['COPY auth.users (id, email) FROM stdin;', '1\tana@ejemplo.test', '\\.',
  'COPY public.plataformas (id) FROM stdin;', '1', '2', '\\.', 'COPY public.fuentes (id) FROM stdin;', '1', '\\.',
  'COPY rwadar_catalogo.revisiones (id) FROM stdin;', '1', '\\.', ''].join('\n');
const RESTAURADAS = 'auth.users\t1\npublic.fuentes\t1\npublic.plataformas\t2\nrwadar_catalogo.revisiones\t1\n';
const configEnsayo = ({ registro = 'panic panic', bdExiste = false, restaurar = {}, restauradas = RESTAURADAS } = {}) => ({
  psql: [
    { si: "current_setting\\('server_version'\\)", salida: '17.11\n' },
    { si: 'log_min_messages', salida: registro + '\n' },
    { si: 'supabase_admin', salida: '' },
    { si: 'pg_database where datname', salida: bdExiste ? '1\n' : '' },
    { si: 'query_to_xml', salida: restauradas },
  ],
  indice: INDICE_ENSAYO, datos: DATOS, restaurar });
const ensayo = (entorno = {}, config = configEnsayo()) => correr(ENSAYO, dir => {
  fs.mkdirSync(path.join(dir, 'copia'));
  fs.writeFileSync(path.join(dir, 'copia', 'rwadar-20261107-0243.dump.gpg'), 'CIFRADA');
  return [path.join(dir, 'copia')];
}, { COPIA_CLAVE: CLAVE, PGHOST: 'localhost', PGPORT: '5432', PGUSER: 'postgres', ...entorno }, config);
const ordenes = r => r.llamadas.filter(l => l.yo === 'psql').map(l => l.args.join(' ') + ' ' + l.entrada);

test('ensayo: restaura, cuenta y limpia; cada conexión pide al servidor que no registre errores', () => {
  const r = ensayo();
  assert.equal(r.codigo, 0, r.texto);
  assert.match(r.texto, /el servidor no apunta en su registro los errores de este ensayo\./);
  assert.match(r.texto, /4 tablas, 5 filas en total\./);
  assert.match(r.texto, /5\/5 · Ensayo correcto/);
  assert.match(r.texto, /base de ensayo rwadar_ensayo_restauracion borrada\./);
  assert.match(r.texto, /roles de imitación borrados: anon authenticated service_role\./);
  assert.doesNotMatch(r.texto, /ana@ejemplo/, 'nunca enseña filas');
  const conexiones = r.llamadas.filter(l => l.yo === 'psql' || (l.yo === 'pg_restore' && !l.args.includes('--list')));
  assert.ok(conexiones.length > 5);
  for (const l of conexiones) {
    assert.match(l.PGOPTIONS, /-c log_min_messages=panic -c log_min_error_statement=panic$/, `${l.yo} ${l.args.join(' ')}`);
  }
  assert.ok(ordenes(r).some(o => /drop database if exists "rwadar_ensayo_restauracion" with \(force\)/.test(o)));
  assert.equal(r.temporales.length, 0, 'borra el archivo descifrado y sus temporales');
});

test('ensayo: se niega si PGHOST no es esta máquina, lleva comas o hay variables que lo desvían, sin conectar', () => {
  const casos = [
    [{ PGHOST: 'db.exgpmjpaaebyoolpwced.supabase.co' }, /PGHOST tiene que ser esta máquina/],
    [{ PGHOST: 'aws-0-eu-west-1.pooler.supabase.com' }, /PGHOST tiene que ser esta máquina/],
    [{ PGHOST: '' }, /PGHOST tiene que ser esta máquina/],
    [{ PGHOST: '/tmp,db.supabase.co' }, /PGHOST no puede llevar varios servidores/],
    [{ PGHOSTADDR: '10.0.0.1' }, /quita PGHOSTADDR, PGSERVICE y PGSERVICEFILE/],
    [{ PGSERVICE: 'supabase' }, /quita PGHOSTADDR, PGSERVICE y PGSERVICEFILE/],
  ];
  for (const [entorno, mensaje] of casos) {
    const r = ensayo(entorno);
    assert.notEqual(r.codigo, 0, JSON.stringify(entorno));
    assert.match(r.texto, mensaje, JSON.stringify(entorno));
    assert.equal(r.llamadas.length, 0, `${JSON.stringify(entorno)}: no llama a psql, pg_restore ni gpg`);
  }
});

test('ensayo: se niega si la base de ensayo ya existe, y entonces no la borra', () => {
  const r = ensayo({}, configEnsayo({ bdExiste: true }));
  assert.notEqual(r.codigo, 0);
  assert.match(r.texto, /ya existe una base rwadar_ensayo_restauracion en este Postgres; no la toco/);
  assert.ok(!ordenes(r).some(o => /create database|drop database|create role|drop role/.test(o)));
  assert.match(r.texto, /Limpieza:\n {4}archivo descifrado y temporales borrados\./);
  assert.equal(r.temporales.length, 0);
});

test('ensayo: se niega si el servidor seguiría registrando los errores (con datos) de la carga', () => {
  const r = ensayo({}, configEnsayo({ registro: 'warning error' }));
  assert.notEqual(r.codigo, 0);
  assert.match(r.texto, /seguiría apuntando en su registro los errores de carga/);
  assert.ok(!r.llamadas.some(l => l.yo === 'pg_restore' && !l.args.includes('--list')), 'no restaura nada');
  assert.ok(!ordenes(r).some(o => /create database/.test(o)));
});

test('ensayo: si pg_restore falla, oculta el error de una carga de datos y limpia igual', () => {
  const log = ['pg_restore: creating TABLE "auth.users"',
    'pg_restore: processing data for table "auth.users"',
    'pg_restore: from TOC entry 3402; 0 16386 TABLE DATA users postgres',
    'pg_restore: error: COPY failed for table "users": ERROR:  new row violates check constraint',
    'DETAIL:  Failing row contains (1, ana@ejemplo.test, $2a$10$hash).',
    'pg_restore: warning: errors ignored on restore: 1', ''].join('\n');
  const r = ensayo({}, configEnsayo({ restaurar: { codigo: 1, error: log } }));
  assert.notEqual(r.codigo, 0);
  assert.match(r.texto, /pg_restore ha fallado \(1 errores\)/);
  assert.match(r.texto, /error: \(oculto: viene de una carga de datos\)/);
  assert.doesNotMatch(r.texto, /ana@ejemplo|\$2a\$10|Failing row/);
  assert.match(r.texto, /base de ensayo rwadar_ensayo_restauracion borrada\./);
  assert.match(r.texto, /roles de imitación borrados: anon authenticated service_role\./);
  assert.ok(ordenes(r).some(o => /drop role if exists "service_role"/.test(o)));
  assert.equal(r.temporales.length, 0);
});

test('ensayo: si lo restaurado no cuadra con la copia, falla diciendo qué tabla', () => {
  const r = ensayo({}, configEnsayo({ restauradas: RESTAURADAS.replace('public.plataformas\t2', 'public.plataformas\t1') }));
  assert.notEqual(r.codigo, 0);
  assert.match(r.texto, /lo restaurado no coincide con la copia:\n {6}public\.plataformas: 2 en la copia, 1 restauradas/);
});
