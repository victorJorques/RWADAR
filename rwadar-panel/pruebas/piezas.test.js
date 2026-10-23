/* RWAdar · panel · pruebas de piezas sueltas (sin red). */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { cargarConfig, leerEnv } = require('../lib/config');
const { seccionDe, serieCompleta, consultaTrafico } = require('../lib/cloudflare');
const { crearAlmacenArchivos } = require('../lib/almacen-archivos');

test('la configuración lee lo público del publicador y lo secreto de .env.local', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-env-'));
  const archivo = path.join(dir, '.env.local');
  fs.writeFileSync(archivo, '﻿# comentario\nCLOUDFLARE_API_TOKEN="abc"\nSUPABASE_SECRET_KEY = sb_secret_x \nBASURA\n');
  assert.deepEqual(leerEnv(archivo), { CLOUDFLARE_API_TOKEN: 'abc', SUPABASE_SECRET_KEY: 'sb_secret_x' });
  const c = cargarConfig({}, archivo);
  assert.equal(c.web, 'https://rwadar.pages.dev');
  assert.equal(c.proyecto, 'rwadar');
  assert.equal(c.supabase, 'https://exgpmjpaaebyoolpwced.supabase.co');
  assert.match(c.clavePublica, /^sb_publishable_/);
  assert.match(c.versionWrangler, /^\d+\.\d+\.\d+$/);
  assert.equal(c.cloudflareToken, 'abc');
  assert.equal(c.claveSecreta, 'sb_secret_x');
  assert.equal(c.githubPorCli, true);
  assert.equal(cargarConfig({ CLOUDFLARE_API_TOKEN: 'del-entorno' }, archivo).cloudflareToken, 'del-entorno');
});

test('el archivo de claves está fuera de Git y la plantilla no lleva claves', () => {
  const raiz = path.join(__dirname, '..', '..');
  const gitignore = fs.readFileSync(path.join(raiz, '.gitignore'), 'utf8');
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^rwadar-panel\/datos\/$/m);
  const plantilla = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
  assert.match(plantilla, /^CLOUDFLARE_API_TOKEN=$/m);
  assert.match(plantilla, /^SUPABASE_SECRET_KEY=$/m);
});

test('las rutas de la web caen en su sección', () => {
  assert.equal(seccionDe('/').id, 'portada');
  assert.equal(seccionDe('/index.html').id, 'portada');
  assert.equal(seccionDe('/ofertas/spiko-letras?x=1').id, 'ofertas');
  assert.equal(seccionDe('/plataformas/reental').id, 'plataformas');
  assert.equal(seccionDe('/academy/que-es').id, 'academy');
  assert.equal(seccionDe('/privacidad.html').id, 'legal');
  assert.equal(seccionDe('/raro').id, 'otras');
});

test('la serie rellena con ceros los días que Cloudflare no devuelve', () => {
  const desde = new Date('2026-10-15T10:00:00Z');
  const hasta = new Date('2026-10-18T10:00:00Z');
  const serie = serieCompleta([{ count: 9, sum: { visits: 4 }, dimensions: { date: '2026-10-16' } }], { desde, hasta, porHora: false });
  assert.deepEqual(serie.map(p => [p.momento, p.visitas]), [['2026-10-15', 0], ['2026-10-16', 4], ['2026-10-17', 0], ['2026-10-18', 0]]);
});

test('los periodos largos se piden en trozos de 7 días y se suman sin contar dos veces', () => {
  const { ventanas, unirTrozos } = require('../lib/cloudflare');
  const hasta = new Date('2026-10-23T12:00:00Z');
  const v = ventanas(new Date(hasta.getTime() - 30 * 86400000), hasta);
  assert.equal(v.length, 5);
  assert.ok(v.every(x => x.hasta - x.desde <= 7 * 86400000));
  assert.ok(v.slice(1).every((x, i) => x.desde.getTime() > v[i].hasta.getTime()), 'los trozos no se pisan');
  assert.equal(v.at(-1).hasta.getTime(), hasta.getTime());
  const trozo = (visitas, pais) => ({ total: [{ count: visitas * 2, sum: { visits: visitas }, avg: { sampleInterval: 1 } }],
    serie: [{ count: visitas, sum: { visits: visitas }, dimensions: { date: '2026-10-16' } }], paises: [{ count: visitas, sum: { visits: visitas }, dimensions: { countryName: pais } }] });
  const u = unirTrozos([trozo(3, 'ES'), trozo(4, 'ES'), trozo(1, 'US')]);
  assert.equal(u.total[0].sum.visits, 8);
  assert.equal(u.serie[0].sum.visits, 8, 'el mismo día partido en dos trozos se suma');
  assert.deepEqual(u.paises.map(x => [x.dimensions.countryName, x.sum.visits]), [['ES', 7], ['US', 1]]);
});

test('la consulta de visitas excluye bots y no acepta identificadores inventados', () => {
  const q = consultaTrafico({ cuenta: 'a'.repeat(32), sitio: 'b'.repeat(32), desde: new Date(0), hasta: new Date(86400000), porHora: false });
  assert.match(q, /\{bot: 0\}/);
  assert.match(q, /siteTag: "b{32}"/);
  assert.throws(() => consultaTrafico({ cuenta: '"}) { x', sitio: 'b'.repeat(32), desde: new Date(), hasta: new Date() }));
});

test('el almacén guarda estados y un registro en orden que sobrevive a una línea rota', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-reg-'));
  const a = crearAlmacenArchivos(dir);
  await a.anotar({ accion: 'uno', resultado: 'hecho', quien: 'eric@example.com' });
  fs.appendFileSync(a.archivoRegistro, '{roto\n');
  await a.anotar({ accion: 'dos', resultado: 'error', detalle: 'x' });
  assert.deepEqual((await a.registro()).map(e => [e.accion, e.quien]), [['dos', null], ['uno', 'eric@example.com']]);
  assert.equal(await a.leer('estado-web'), null);
  await a.guardar('estado-web', { x: 1 });
  assert.deepEqual(await a.leer('estado-web'), { x: 1 });
  await a.borrar('estado-web');
  assert.equal(await a.leer('estado-web'), null);
  await assert.rejects(() => a.guardar('../fuera', {}));
});

test('wrangler se lanza igual que en rwadar-publicar.js', () => {
  const { comandoWrangler } = require('../lib/wrangler');
  const [cmd, args] = comandoWrangler({ versionWrangler: '4.125.0' }, ['deploy', '--config', 'x.json']);
  if (process.platform === 'win32') {
    assert.match(cmd, /cmd.exe$/i);
    assert.deepEqual(args.slice(0, 6), ['/d', '/s', '/c', 'npx.cmd', '--yes', 'wrangler@4.125.0']);
  } else {
    assert.equal(cmd, 'npx');
  }
  assert.deepEqual(args.slice(-3), ['deploy', '--config', 'x.json']);
});

test('los archivos de la página no tienen errores de sintaxis', () => {
  const { execFileSync } = require('child_process');
  const dir = path.join(__dirname, '..', 'publico');
  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'rwadar-sintaxis-'));
  for (const archivo of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    /* Son módulos del navegador: se comprueban como .mjs. */
    const copia = path.join(temporal, archivo.replace(/\.js$/, '.mjs'));
    fs.copyFileSync(path.join(dir, archivo), copia);
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', copia], { stdio: 'pipe' }), archivo);
  }
});
