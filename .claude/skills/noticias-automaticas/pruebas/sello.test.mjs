// La carpeta del día, el sello automático y la unión simulada, en una copia
// aparte del repositorio (git worktree de usar y tirar; no crea ramas):
// - «main» de prueba = HEAD + la guía fija + un sello revisado de hoy;
// - commit A = noticias (preparar); commit B = sello (sellar);
// - main + merge --no-ff B → LISTO; squash → COMMIT_NO_ANCESTRO; main movido
//   con contenido → CONTENIDO_NO_APROBADO (mutación 5).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { sellar, simularUnion } from '../lib/flujo.mjs';
import { cambiosDelSello, CAMBIOS_SELLO_PERMITIDOS } from '../lib/validar.mjs';
import { enlazarDependencias, Freno } from '../lib/comun.mjs';
import { RAIZ, GUIA, FECHA, BASE, tmp, montarDia, programa, gitEn, escribir } from './ayuda.mjs';

const require = createRequire(import.meta.url);
const ESTADO = 'rwadar-app/data/relanzamiento/estado.json';
const hoyUTC = new Date().toISOString().slice(0, 10);

function copiaConMainSellado() {
  const wt = path.join(tmp('sello'), 'repo');
  gitEn(RAIZ)('worktree', 'add', '--detach', '--force', wt, 'HEAD');
  enlazarDependencias(RAIZ, wt);
  const git = gitEn(wt);
  escribir(path.join(wt, 'rwadar-editorial-source/noticias/GUIA-TITULARES.md'), fs.readFileSync(GUIA));
  git('add', '-A'); git('commit', '-q', '-m', 'guía fija de prueba');
  const { huellaContenidoAprobado } = require(path.join(wt, 'rwadar-publicacion-segura.js'));
  const e = JSON.parse(fs.readFileSync(path.join(wt, ESTADO), 'utf8'));
  e.actualizadoEl = hoyUTC; e.nota = 'Sello revisado de prueba para la copia de usar y tirar de las pruebas';
  e.revisionAprobada.commit = git('rev-parse', 'HEAD'); e.revisionAprobada.contenidoSha256 = huellaContenidoAprobado(wt);
  fs.writeFileSync(path.join(wt, ESTADO), JSON.stringify(e, null, 2) + '\n');
  git('add', '-A'); git('commit', '-q', '-m', 'sello revisado de prueba');
  return { wt, git, main: git('rev-parse', 'HEAD'), quitar: () => { gitEn(RAIZ)('worktree', 'remove', '--force', wt); } };
}

test('un día bueno de punta a punta en la copia: preparar, commit A, sellar, commit B, comprobar-sello (LISTO) y validar --publicada', { timeout: 120000 }, () => {
  const c = copiaConMainSellado();
  try {
    const dia = montarDia();
    let r = programa(['preparar', '--raiz', c.wt, '--fecha', FECHA, '--trabajo', dia.trabajo, '--notas', dia.notas, '--base', c.main]);
    assert.equal(r.codigo, 0, r.salida);
    const carpeta = path.join(c.wt, 'rwadar-app/data/noticias-diarias', FECHA);
    assert.deepEqual(fs.readdirSync(carpeta).sort(), ['EDICION.md', 'VERIFICACION.md', 'barrido.json', 'inventario-fuentes.json', `noticias-${FECHA}.json`, 'titulares.json', 'validacion.json', 'verificacion.json']);
    assert.ok(fs.readFileSync(path.join(c.wt, 'rwadar-site/datos/noticias-v2.json')).equals(dia.bytes));
    assert.ok(!fs.readFileSync(path.join(c.wt, 'rwadar-site/datos/noticias.json'), 'utf8').includes('"imagen"'));
    c.git('add', '-A'); c.git('commit', '-q', '-m', 'Noticias del sector del 14/11/2026 (automáticas)');
    const antes = JSON.parse(fs.readFileSync(path.join(c.wt, ESTADO), 'utf8'));
    r = programa(['sellar', '--raiz', c.wt, '--fecha', FECHA, '--trabajo', dia.trabajo, '--base', c.main, '--revision', '434217eb']);
    assert.equal(r.codigo, 0, r.salida);
    const despues = JSON.parse(fs.readFileSync(path.join(c.wt, ESTADO), 'utf8'));
    assert.equal(despues.actualizadoEl, antes.actualizadoEl, 'el sello automático no puede tocar «actualizadoEl»');
    assert.deepEqual(cambiosDelSello(antes, despues).sort(), [...CAMBIOS_SELLO_PERMITIDOS].sort());
    c.git('add', '-A'); c.git('commit', '-q', '-m', 'Sello: noticias del 14/11/2026');
    r = programa(['comprobar-sello', '--raiz', c.wt, '--fecha', FECHA, '--trabajo', dia.trabajo, '--base', c.main]);
    assert.equal(r.codigo, 0, r.salida);
    assert.match(r.salida, /LISTO/);
    r = programa(['validar', '--publicada', '--raiz', c.wt]);
    assert.equal(r.codigo, 0, r.salida);
    assert.match(r.salida, /mañana del 2026-11-14: \d+ reglas bien/);
    const cabeza = c.git('rev-parse', 'HEAD');
    // Mutación 5: con «squash» la compuerta no lo deja publicar.
    const squash = simularUnion({ raiz: c.wt, base: c.main, cabeza, modo: 'squash' });
    assert.equal(squash.listo, false); assert.ok(squash.bloqueos.includes('COMMIT_NO_ANCESTRO') || /COMMIT_NO_ANCESTRO/.test(squash.salida), squash.salida);
    // main se movió con contenido sellado antes de unir: tampoco.
    c.git('checkout', '-q', '--detach', c.main);
    fs.appendFileSync(path.join(c.wt, 'rwadar-site/robots.txt'), '\n# cambio de otro\n');
    c.git('commit', '-q', '-am', 'otro cambio sellado');
    const movido = c.git('rev-parse', 'HEAD');
    const m = simularUnion({ raiz: c.wt, base: movido, cabeza, modo: 'merge' });
    assert.equal(m.listo, false); assert.ok(m.bloqueos.includes('CONTENIDO_NO_APROBADO') || /CONTENIDO_NO_APROBADO/.test(m.salida), m.salida);
    // Y la propia unión buena, otra vez, sí.
    assert.equal(simularUnion({ raiz: c.wt, base: c.main, cabeza, modo: 'merge' }).listo, true);
  } finally { c.quitar(); }
});

test('el sello automático frena si el contenido sellado cambia en algo más que las noticias (mutación 4), con el árbol sucio, o si cambia la fecha del sello', { timeout: 120000 }, () => {
  const c = copiaConMainSellado();
  try {
    fs.writeFileSync(path.join(c.wt, 'rwadar-site/datos/noticias-v2.json'), JSON.stringify(BASE));
    fs.appendFileSync(path.join(c.wt, 'rwadar-publicar.js'), '\n// otro cambio\n');
    c.git('add', '-A'); c.git('commit', '-q', '-m', 'noticias y código');
    assert.throws(() => sellar({ raiz: c.wt, fecha: FECHA, base: c.main, revisionCatalogo: 'x' }), e => e instanceof Freno && /solo puede aprobar las noticias/.test(e.motivo));
    c.git('reset', '-q', '--hard', c.main);
    fs.appendFileSync(path.join(c.wt, 'rwadar-site/datos/noticias.json'), ' ');
    assert.throws(() => sellar({ raiz: c.wt, fecha: FECHA, base: c.main, revisionCatalogo: 'x' }), e => e instanceof Freno && /árbol no está limpio/.test(e.motivo));
    c.git('checkout', '-q', '--', '.');
    // Un archivo fuera de la carpeta del día (aunque no esté sellado) tampoco.
    fs.writeFileSync(path.join(c.wt, 'rwadar-site/datos/noticias-v2.json'), JSON.stringify(BASE));
    fs.writeFileSync(path.join(c.wt, 'rwadar-site/datos/noticias.json'), JSON.stringify(BASE));
    escribir(path.join(c.wt, 'docs/otra-cosa.md'), 'x');
    c.git('add', '-A'); c.git('commit', '-q', '-m', 'noticias y un documento');
    assert.throws(() => sellar({ raiz: c.wt, fecha: FECHA, base: c.main, revisionCatalogo: 'x' }), e => e instanceof Freno && /docs\/otra-cosa\.md/.test(e.motivo));
  } finally { c.quitar(); }
  assert.deepEqual(cambiosDelSello({ actualizadoEl: '2026-11-13', nota: 'a' }, { actualizadoEl: '2026-11-14', nota: 'b' }), ['actualizadoEl', 'nota']);
});

test('fase final (V-14, V-15, V-16): verificación de otros bytes, un PDF o 201 kB en la carpeta y un archivo de más en la rama', { timeout: 120000 }, () => {
  const c = copiaConMainSellado();
  try {
    const dia = montarDia();
    assert.equal(programa(['preparar', '--raiz', c.wt, '--fecha', FECHA, '--trabajo', dia.trabajo, '--notas', dia.notas, '--base', c.main]).codigo, 0);
    const carpeta = path.join(c.wt, 'rwadar-app/data/noticias-diarias', FECHA);
    const validarFinal = () => programa(['validar', '--fase', 'final', '--raiz', c.wt, '--fecha', FECHA, '--trabajo', dia.trabajo, '--base', c.main]);
    assert.equal(validarFinal().codigo, 0);
    const ver = path.join(carpeta, 'verificacion.json');
    const original = fs.readFileSync(ver);
    const otra = JSON.parse(original); otra.edicionSha256 = '0'.repeat(64); fs.writeFileSync(ver, JSON.stringify(otra));
    let r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-14/);
    fs.writeFileSync(ver, original);
    fs.writeFileSync(path.join(carpeta, 'copia.pdf'), 'x');
    r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-15/);
    fs.rmSync(path.join(carpeta, 'copia.pdf'));
    fs.writeFileSync(path.join(carpeta, 'inventario-consultas.txt'), 'x'.repeat(201000));
    r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-15 la carpeta ocupa/);
    fs.writeFileSync(path.join(carpeta, 'inventario-consultas.txt'), 'una consulta\n');
    fs.writeFileSync(path.join(carpeta, 'EDICION.md'), '# Notas\n\nLo anunció la Sra. Ejemplo.\n');
    r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-11 EDICION\.md:3/);
    fs.writeFileSync(path.join(carpeta, 'EDICION.md'), '# Notas\n\nSin personas.\n');
    fs.appendFileSync(path.join(c.wt, 'rwadar-site/robots.txt'), '\n# de más\n');
    r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-16 cambia rwadar-site\/robots\.txt/);
    c.git('checkout', '-q', '--', 'rwadar-site/robots.txt');
    fs.writeFileSync(path.join(c.wt, 'rwadar-site/datos/noticias.json'), '{}');
    r = validarFinal(); assert.equal(r.codigo, 4); assert.match(r.salida, /V-15 rwadar-site\/datos\/noticias\.json no es la v2 sin «imagen»/);
  } finally { c.quitar(); }
});
