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

test('la caché junta las peticiones que llegan a la vez y no guarda los errores', async () => {
  const { crearCache } = require('../lib/pedir');
  const cache = crearCache();
  let veces = 0;
  const lento = () => new Promise(r => setTimeout(() => r(++veces), 20));
  const [a, b] = await Promise.all([cache.obtener('x', 60, lento), cache.obtener('x', 60, lento)]);
  assert.deepEqual([a, b, veces], [1, 1, 1]);
  await assert.rejects(cache.obtener('y', 60, () => { throw new Error('caído'); }));
  assert.equal(await cache.obtener('y', 60, () => 'vuelve'), 'vuelve');
});

test('los correos cuentan altas, confirmaciones y cuentas atascadas de los últimos 30 días', () => {
  const { resumirCuentas, CONSULTA } = require('../lib/correos');
  const ahora = Date.parse('2026-10-23T12:00:00Z');
  const hace = h => new Date(ahora - h * 3600000).toISOString();
  const cuentas = [
    { confirmada: true, correoAltaEnviado: hace(48), confirmadaEl: hace(47.9), correoRecuperacionEnviado: hace(5) },
    { confirmada: true, correoAltaEnviado: hace(30), confirmadaEl: hace(29.5) },
    { confirmada: false, correoAltaEnviado: hace(30) },
    { confirmada: false, correoAltaEnviado: hace(3) },
    { confirmada: false, correoAltaEnviado: hace(24 * 10) },
    { confirmada: false, correoAltaEnviado: hace(24 * 40) },
  ];
  assert.deepEqual(resumirCuentas(cuentas, ahora), {
    altas30d: 5, confirmadas30d: 2, sinConfirmar24h: 1, recuperaciones30d: 1,
    minutosHastaConfirmar: 30, ultimoEnviado: hace(3),
  }, 'atascada es la de 30 horas; la de 10 días ya no avisa');
  assert.match(CONSULTA, /source = 'auth_logs'/);
  assert.match(CONSULTA, /LIKE '%smtp%'/, 'de otras rutas solo cuentan los errores de correo');
  assert.doesNotMatch(CONSULTA, /email'|remote_addr/, 'la consulta no pide direcciones');
});

test('los errores de correo se enseñan sin direcciones ni IP, pero con sus horas', () => {
  const { tapar, aFecha } = require('../lib/correos');
  assert.equal(tapar('535 not accepted for josé@ejemplo.es at 18:00:00'), '535 not accepted for <correo> at 18:00:00');
  assert.equal(tapar('user ana%40example.com from 2a01:4f8:c0c:1::1 and 10.0.0.1'), 'user <correo> from <ip> and <ip>');
  assert.equal(aFecha('2026-10-23 18:00:00').toISOString(), '2026-10-23T18:00:00.000Z');
  assert.equal(aFecha(1761242400000000).toISOString(), '2025-10-23T18:00:00.000Z', 'microsegundos');
});

test('una clave del panel que ya no vale es fallo, y una que no se pudo mirar no se esconde', () => {
  const { entradaClave, diasHasta } = require('../lib/fechas');
  const ahora = Date.parse('2026-10-23T12:00:00Z');
  assert.equal(entradaClave('g', 'G', { noVale: true }, 'Crea otra.', ahora).estado, 'fallo');
  assert.equal(entradaClave('g', 'G', null, '', ahora).estado, 'sin-datos');
  assert.equal(entradaClave('g', 'G', { sinCaducidad: true }, '', ahora).que, 'No caduca.');
  assert.equal(entradaClave('g', 'G', { fecha: '2026-10-30T12:00:00Z' }, '', ahora).estado, 'aviso');
  assert.equal(diasHasta('2026-10-23T10:00:00Z', ahora), -1, 'caducada hace dos horas: -1, no «-0»');
  assert.equal(diasHasta('2026-10-23T14:00:00Z', ahora), 1);
});

test('el historial de la app solo escribe si algo cambió', async () => {
  const { anotarDescargas, anotarHoras } = require('../lib/historial-app');
  const datos = new Map();
  let escrituras = 0;
  const almacen = { leer: async k => datos.get(k) ?? null, guardar: async (k, v) => { escrituras++; datos.set(k, JSON.parse(JSON.stringify(v))); } };
  const descargas = { totalApk: 17, versiones: [{ version: 'v1', descargasApk: 17 }] };
  const horas = [{ hora: '2026-10-23 18:00:00', app: 3, web: 2, conexionesApp: 1 }];
  for (let i = 0; i < 3; i++) {
    await anotarDescargas(almacen, descargas, new Date('2026-10-23T19:00:00Z'));
    await anotarHoras(almacen, horas);
  }
  assert.equal(escrituras, 2, 'tres vueltas iguales: una escritura de cada');
  await anotarHoras(almacen, [{ ...horas[0], app: 4 }]);
  assert.equal(escrituras, 3);
});

test('las fechas avisan a 14 días, el catálogo a 2, y lo caducado es fallo', () => {
  const { entrada, AVISO_CATALOGO_DIAS } = require('../lib/fechas');
  const ahora = Date.parse('2026-10-23T12:00:00Z');
  const en = dias => new Date(ahora + dias * 86400000).toISOString();
  assert.equal(entrada('x', 'X', en(20), '', ahora).estado, 'ok');
  assert.equal(entrada('x', 'X', en(10), '', ahora).estado, 'aviso');
  assert.equal(entrada('x', 'X', en(-1), '', ahora).estado, 'fallo');
  assert.equal(entrada('c', 'Catálogo', en(6), '', ahora, AVISO_CATALOGO_DIAS).estado, 'ok');
  assert.equal(entrada('c', 'Catálogo', en(1.5), '', ahora, AVISO_CATALOGO_DIAS).estado, 'aviso');
  assert.equal(entrada('x', 'X', null, '', ahora).estado, 'sin-datos');
});

test('un medidor del plan gratis avisa al 80 % y falla al llegar al tope', () => {
  const { medidor } = require('../lib/planes');
  assert.equal(medidor('m', 79, 100).estado, 'ok');
  assert.equal(medidor('m', 80, 100).estado, 'aviso');
  assert.equal(medidor('m', 1000, 1000).estado, 'fallo');
  assert.equal(medidor('m', 108, 100000).porcentaje, 0.1);
});

test('el catálogo por dentro junta rutas iguales, lee Academy y separa lo que nadie abrió', () => {
  const { rutaLimpia, vistasPorRuta, leccionesDeAcademy, descartesDelMapa, cruzar, inventario } = require('../lib/contenido');
  assert.equal(rutaLimpia('/ofertas/abc.html?x=1'), '/ofertas/abc');
  assert.equal(rutaLimpia('/academy/'), '/academy');
  assert.equal(rutaLimpia('/'), '/');
  const vistas = vistasPorRuta([{ nombre: '/academy/uno', paginas: 3, visitas: 1 }, { nombre: '/academy/uno.html', paginas: 2, visitas: 1 }]);
  assert.deepEqual(vistas.get('/academy/uno'), { paginas: 5, visitas: 2 });
  const html = '<a class="ac-tarjeta" href="/academy/uno"><span class="ac-tarjeta-tit">Uno &amp; más</span></a>'
    + '<a class="ac-tarjeta" href="/academy/dos"><span class="ac-tarjeta-tit">Dos</span></a>'
    + '<article class="ac-tarjeta"><span class="ac-tarjeta-tit">Pronto</span></article>';
  const lecciones = leccionesDeAcademy(html);
  assert.deepEqual(lecciones, [{ slug: 'uno', nombre: 'Uno & más' }, { slug: 'dos', nombre: 'Dos' }]);
  const c = cruzar(lecciones, '/academy', vistas);
  assert.deepEqual([c.abiertas, c.vistas, c.lista[0].slug, c.nadie], [1, 5, 'uno', ['Dos']]);
  assert.deepEqual(descartesDelMapa('<loc>https://w/fuera-del-radar/realt</loc><loc>https://w/ofertas/x</loc>'), [{ slug: 'realt', nombre: 'Realt' }]);
  const ahora = Date.parse('2026-10-23T12:00:00Z');
  const inv = inventario({
    plataformas: [{ slug: 'a', nombre: 'A', categoria: 'Inmobiliario', verificadaEl: '2026-07-26' }, { slug: 'b', nombre: 'B', categoria: 'Inmobiliario', verificadaEl: '2026-10-20' }],
    ofertas: [{ slug: 'o1', nombre: 'O1', tipo: 'valor', categoria: 'Inmobiliario', plataforma: 'a', verificadaEl: '2026-10-22' }],
  }, ahora);
  assert.deepEqual(inv.plataformas.sinOfertas, ['B']);
  assert.equal(inv.plataformas.sinRevisarMasDe60, 1);
  assert.deepEqual(inv.plataformas.conMasOfertas, [{ nombre: 'A', n: 1, conFicha: true }]);
  assert.deepEqual(inv.ofertas.porTipo, [{ nombre: 'Precio de referencia', n: 1 }]);
});
