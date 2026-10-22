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

test('la página de mantenimiento responde 503 con su marca y deja pasar /android', async () => {
  /* Se carga como módulo desde su texto: así Node no avisa de que la
     carpeta no declara "type": "module" (y no se sube un package.json a Cloudflare). */
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'mantenimiento', '_worker.js'), 'utf8');
  const { default: trabajador } = await import(`data:text/javascript,${encodeURIComponent(codigo)}`);
  const html = fs.readFileSync(path.join(__dirname, '..', 'mantenimiento', 'index.html'), 'utf8');
  const env = { ASSETS: { fetch: async peticion => (new URL(peticion.url).pathname === '/' ? new Response(html) : new Response('', { status: 404 })) } };
  const portada = await trabajador.fetch(new Request('https://rwadar.pages.dev/'), env);
  assert.equal(portada.status, 503);
  assert.equal(portada.headers.get('retry-after'), '3600');
  assert.equal(portada.headers.get('x-rwadar-mantenimiento'), 'si');
  assert.match(await portada.text(), /Estamos haciendo mantenimiento/);
  const ficha = await trabajador.fetch(new Request('https://rwadar.pages.dev/ofertas/x'), env);
  assert.equal(ficha.status, 503);
  assert.match(await ficha.text(), /Estamos haciendo mantenimiento/);
  const android = await trabajador.fetch(new Request('https://rwadar.pages.dev/android'), env);
  assert.equal(android.status, 302);
  assert.match(android.headers.get('location'), /RWAdar-downloads\/releases\/latest$/);
});

test('el apagado llama a wrangler igual que rwadar-publicar.js', () => {
  const { comandoWrangler } = require('../lib/wrangler');
  const config = { versionWrangler: '4.125.0', wranglerFalso: '' };
  const [cmd, args] = comandoWrangler(config, ['pages', 'deploy', 'x', '--branch', 'main']);
  if (process.platform === 'win32') {
    assert.match(cmd, /cmd.exe$/i);
    assert.deepEqual(args.slice(0, 6), ['/d', '/s', '/c', 'npx.cmd', '--yes', 'wrangler@4.125.0']);
  } else {
    assert.equal(cmd, 'npx');
  }
  assert.deepEqual(args.slice(-5), ['pages', 'deploy', 'x', '--branch', 'main']);
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
