// El cerrojo: ¿puede trabajar hoy la mañana? Una mañana libre y, por cada
// señal, la que la bloquea. Y la comparación archivo a archivo de main con
// producción, contra un servidor local.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { decidirCerrojo, lineaSinHacerNada, ultimaPublicacion, rutaBloqueante, FLUJOS_MANUALES } from '../lib/cerrojo.mjs';
import { compararArchivos, rutaPublica } from '../lib/produccion.mjs';
import { sha256 } from '../lib/comun.mjs';
import { FECHA, tmp, escribir, servidor } from './ayuda.mjs';

const REV = '434217eb-0000-4000-8000-000000000000';
const libre = () => ({
  hoy: FECHA, config: { activo: true, selloHumanoMaxDias: 7 }, rutasSelladas: ['rwadar-site', 'rwadar-publicar.js'],
  ramasCerrojo: [], github: true, prs: [], ejecuciones: [],
  publicado: { sha: 'a'.repeat(40) }, cambiosSellados: { ancestro: true, cambios: [] }, comparacion: { distintas: [], iguales: ['index.html'] },
  produccion: { noticiasActualizadoEl: '2026-11-13', noticiasSha256: 'n'.repeat(64) },
  main: { sha: 'b'.repeat(40), noticiasSha256: 'n'.repeat(64), noticiasActualizadoEl: '2026-11-13', estadoActualizadoEl: '2026-11-13', revisionCatalogo: REV },
  noticiasVerificadas: [], lecturaPublica: { revision: [REV] }, auditoria: { publicable: true, bloqueos: [] },
});
const codigos = d => d.motivos.map(m => m.codigo);

test('una mañana sin nada raro: libre', () => {
  const d = decidirCerrojo(libre());
  assert.equal(d.libre, true, JSON.stringify(d.motivos));
  assert.deepEqual(d.motivos, []);
});

const CASOS = [
  ['PAUSADA', 'mutación 11: «activo»: false', h => { h.config.activo = false; }, false],
  ['RAMA_CERROJO', 'mutación 10: rama de cerrojo de hoy', h => { h.ramasCerrojo = [`claude/cerrojo-ciclo-${FECHA}`]; }, true],
  ['RAMA_CERROJO', 'rama de cerrojo de ayer', h => { h.ramasCerrojo = ['claude/cerrojo-ciclo-2026-11-13']; }, true],
  ['SIN_GITHUB', 'sin poder leer GitHub', h => { h.github = false; }, true],
  ['PR_AJENO', 'mutación 7: PR ajeno que toca rwadar-site/', h => { h.prs = [{ number: 140, title: 'Arreglo de la web', files: ['rwadar-site/index.html'] }]; }, true],
  ['PR_AJENO', 'PR ajeno que toca el catálogo (rwadar-app/data/)', h => { h.prs = [{ number: 141, title: 'Ciclo', files: ['rwadar-app/data/verificaciones/x.json'] }]; }, true],
  ['OTRA_MANANA', 'ya hay un PR de las noticias de hoy', h => { h.prs = [{ number: 142, title: 'Noticias automáticas del 14/11/2026', files: [] }]; }, true],
  ['EJECUCION', '«Aplicar catálogo» corriendo', h => { h.ejecuciones = [{ id: 1, name: 'Aplicar catálogo', path: '.github/workflows/aplicar-catalogo.yml', status: 'in_progress' }]; }, true],
  ['EJECUCION', '«Publicar web» en cola', h => { h.ejecuciones = [{ id: 2, name: 'Publicar web', path: '.github/workflows/publicar.yml', status: 'queued' }]; }, true],
  ['EJECUCION', 'la verificación de otro PR', h => { h.ejecuciones = [{ id: 3, name: 'Verificación', path: '.github/workflows/ci.yml', status: 'in_progress', head_branch: 'otra', pull_requests: [{ number: 150 }] }]; }, true],
  ['YA_PUBLICADAS', 'mutación 8: producción ya tiene las de hoy', h => { h.produccion.noticiasActualizadoEl = FECHA; }, false],
  ['UNIDAS_SIN_PUBLICAR', 'main ya tiene las de hoy y producción no', h => { h.main.noticiasActualizadoEl = FECHA; h.main.noticiasSha256 = 'x'.repeat(64); }, true],
  ['SIN_PUBLICACION', 'sin una publicación en producción conocida', h => { h.publicado = null; }, true],
  ['MAIN_SIN_PUBLICAR', 'main con un cambio sellado sin publicar (un JS de /mercado/)', h => { h.cambiosSellados.cambios = ['rwadar-site/assets/mercado-20261111.js']; }, true],
  ['MAIN_SIN_PUBLICAR', 'lo publicado no es antepasado de main', h => { h.cambiosSellados = { ancestro: false, cambios: null }; }, true],
  ['WEB_DISTINTA', 'mutación 9: producción sirve otro JS que el de main', h => { h.comparacion.distintas = [{ archivo: 'assets/mercado-20261111.1694eda17e6e.js' }]; }, true],
  ['WEB_SIN_COMPARAR', 'no se pudo construir main', h => { h.comparacion = null; }, true],
  ['NOTICIAS_AJENAS', 'main tiene noticias sin publicar que no son de una mañana verificada', h => { h.main.noticiasSha256 = 'm'.repeat(64); }, true],
  ['CATALOGO_A_MEDIAS', 'el catálogo publicado no es el de main', h => { h.lecturaPublica = { revision: ['otra'] }; }, true],
  ['CATALOGO_SIN_LEER', 'no se pudo leer el catálogo', h => { h.lecturaPublica = null; }, true],
  ['SELLO_HUMANO_CADUCADO', 'el último sello revisado es de hace 8 días', h => { h.main.estadoActualizadoEl = '2026-11-06'; }, true],
  ['SELLO_HUMANO_CADUCADO', 'la compuerta ya da MANIFIESTO_CADUCADO', h => { h.auditoria.bloqueos = [{ codigo: 'MANIFIESTO_CADUCADO' }]; }, true],
  ['COMPUERTA_MAIN', 'main no pasa la compuerta (#138 sin sellar)', h => { h.auditoria = { publicable: false, bloqueos: [{ codigo: 'CONTENIDO_NO_APROBADO' }] }; }, true],
];
for (const [codigo, nombre, cambiar, avisa] of CASOS) {
  test(`bloquea: ${nombre} → ${codigo}${avisa ? ' (avisa)' : ' (sin aviso)'}`, () => {
    const h = libre(); cambiar(h);
    const d = decidirCerrojo(h);
    assert.equal(d.libre, false);
    assert.ok(codigos(d).includes(codigo), `esperaba ${codigo} y da ${codigos(d).join(', ')}`);
    assert.equal(d.avisar, avisa);
    assert.ok(d.motivos.every(m => m.accion), 'cada motivo dice qué hacer');
  });
}

test('lo que NO bloquea: PR solo de docs/.github/.claude, rama de cerrojo vieja, flujos programados, noticias verificadas sin publicar', () => {
  const h = libre();
  h.prs = [{ number: 160, title: 'Docs', files: ['docs/INTERNO.md', '.github/flujos.test.mjs', '.claude/skills/x/SKILL.md'] },
    { number: 161, title: 'Noticias automáticas del 12/11/2026', files: [] }];
  h.ramasCerrojo = ['claude/cerrojo-ciclo-2026-11-01'];
  h.ejecuciones = [{ id: 9, name: 'Tokenización diaria', path: '.github/workflows/tokenizacion.yml', status: 'in_progress' },
    { id: 10, name: 'Publicar web', path: '.github/workflows/publicar.yml', status: 'completed' }];
  h.main.noticiasSha256 = 'v'.repeat(64); h.noticiasVerificadas = ['v'.repeat(64)];
  h.main.estadoActualizadoEl = '2026-11-08';
  const d = decidirCerrojo(h);
  assert.equal(d.libre, true, JSON.stringify(d.motivos));
  assert.deepEqual(d.cerrarPRs, [161]);
  assert.ok(d.avisos.some(a => /cerrojo vieja/.test(a)));
  assert.ok(d.avisos.some(a => /caduca el 15\/11\/2026/.test(a)), d.avisos.join(' | '));
});

test('la línea de «no hice nada» dice qué hacer, y cuántos días van sin noticias', () => {
  const h = libre(); h.auditoria = { bloqueos: [{ codigo: 'CONTENIDO_NO_APROBADO' }] }; h.produccion.noticiasActualizadoEl = '2026-11-12';
  const linea = lineaSinHacerNada(decidirCerrojo(h));
  assert.match(linea, /^Noticias 14\/11: no hice nada · main no pasa la compuerta de publicación \(CONTENIDO_NO_APROBADO\)\. main tiene cambios sin sellar: séllalos y publícalos, o la mañana seguirá parada\. Van 2 días sin noticias nuevas\.$/);
});

test('rutas que bloquean y última publicación en producción', () => {
  assert.equal(rutaBloqueante('rwadar-site/x.html', ['rwadar-site']), true);
  assert.equal(rutaBloqueante('rwadar-movil/App.js', []), true);
  assert.equal(rutaBloqueante('docs/INTERNO.md', ['rwadar-site']), false);
  assert.ok(FLUJOS_MANUALES.includes('publicar.yml'));
  const p = ultimaPublicacion([
    { destino: 'preview', conclusion: 'success', head_sha: '1'.repeat(40), created_at: '2026-11-13T10:00:00Z' },
    { destino: 'produccion', conclusion: 'failure', head_sha: '2'.repeat(40), created_at: '2026-11-13T11:00:00Z' },
    { destino: 'produccion', conclusion: 'success', head_sha: '3'.repeat(40), created_at: '2026-11-13T09:00:00Z' }]);
  assert.equal(p.sha, '3'.repeat(40));
});

test('comparación archivo a archivo: igual, un JS distinto, una página que falta, la clave del sw.js y las noticias aparte', async () => {
  const pub = tmp('publicado');
  escribir(path.join(pub, 'index.html'), '<html>inicio</html>');
  escribir(path.join(pub, 'mercado', 'index.html'), '<html>mercado</html>');
  escribir(path.join(pub, 'assets', 'mercado-1.js'), 'console.log(1)');
  escribir(path.join(pub, 'sw.js'), "const VERSION = 'rwadar-v111';\nself.x = 1;");
  escribir(path.join(pub, 'datos', 'noticias-v2.json'), '{"a":1}');
  escribir(path.join(pub, 'datos', 'tokenizacion-serie.json'), '{}');
  escribir(path.join(pub, '_headers'), '/*\n  x: y');
  const prod = { '/': { cuerpo: '<html>inicio</html>', tipo: 'text/html' }, '/mercado/': { cuerpo: '<html>mercado</html>', tipo: 'text/html' },
    '/assets/mercado-1.js': { cuerpo: 'console.log(1)' }, '/sw.js': { cuerpo: "const VERSION = 'rwadar-v222';\nself.x = 1;" },
    '/datos/noticias-v2.json': { cuerpo: '{"a":0}', tipo: 'application/json' } };
  const s = await servidor(prod);
  try {
    let r = await compararArchivos({ publicado: pub, base: s.url });
    assert.deepEqual(r.distintas, []);
    assert.deepEqual(r.iguales.sort(), ['assets/mercado-1.js', 'index.html', 'mercado/index.html', 'sw.js']);
    assert.equal(r.noticias['datos/noticias-v2.json'].local, sha256('{"a":1}'));
    assert.ok(r.excluidas.some(x => x.archivo === '_headers') && r.excluidas.some(x => x.archivo === 'datos/tokenizacion-serie.json'));
    // Un JS cambiado en main y sin publicar: se ve.
    escribir(path.join(pub, 'assets', 'mercado-1.js'), 'console.log(2)');
    escribir(path.join(pub, 'assets', 'nuevo.js'), 'x');
    r = await compararArchivos({ publicado: pub, base: s.url });
    assert.deepEqual(r.distintas.map(d => d.archivo).sort(), ['assets/mercado-1.js', 'assets/nuevo.js']);
  } finally { await s.cerrar(); }
  assert.equal(rutaPublica('academy/index.html'), '/academy/');
  assert.equal(rutaPublica('privacidad.html'), '/privacidad');
});
