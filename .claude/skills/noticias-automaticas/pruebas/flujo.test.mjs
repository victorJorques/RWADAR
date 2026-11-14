// El freno después del editor: veredicto del verificador (decidir), las
// correcciones (corregir), los encargos literales, lo que se mira antes de
// unir y de publicar, y el resumen final. Por la línea de órdenes, como la
// sesión de la mañana.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decidir, corregir, antesDeUnir, comprobarEjecucion, primeraLinea, hayQueAvisar } from '../lib/flujo.mjs';
import { Freno, RUTAS, sha256 } from '../lib/comun.mjs';
import { FECHA, BASE, montarDia, verificacionDe, programa, escribir, edicionBuena, copia, tmp, RAIZ } from './ayuda.mjs';

const ids = e => e.noticias.map(n => n.id);
const freno = fn => assert.throws(fn, e => e instanceof Freno);

test('decidir: «conforme» atado a los bytes → preparar; cualquier otra cosa → freno', () => {
  const e = edicionBuena(); const bytes = Buffer.from(JSON.stringify(e));
  const v = verificacionDe(bytes, e);
  assert.equal(decidir({ verificacion: v, bytes, ids: ids(e), fecha: FECHA, pase: 1 }).siguiente, 'preparar');
  freno(() => decidir({ verificacion: null, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  freno(() => decidir({ verificacion: { ...v, veredicto: 'rechazado' }, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  freno(() => decidir({ verificacion: { ...v, veredicto: 'quizá' }, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  // Mutación 2: el veredicto no vale para otros bytes (un espacio de más).
  freno(() => decidir({ verificacion: v, bytes: Buffer.concat([bytes, Buffer.from(' ')]), ids: ids(e), fecha: FECHA, pase: 1 }));
  // «conforme» con una noticia sin confirmar, sin cita, con personas o sin entrada: freno.
  for (const cambio of [n => { n.veredicto = 'corregir'; }, n => { n.literal = ''; }, n => { n.personas = true; }, n => { n.titularRespaldado = false; }, n => { n.fuente.http = 404; }]) {
    const w = copia(v); cambio(w.noticias[0]);
    freno(() => decidir({ verificacion: w, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  }
  const w = copia(v); w.noticias.pop();
  freno(() => decidir({ verificacion: w, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  const conCorr = { ...copia(v), correcciones: [{ id: 'x' }] };
  freno(() => decidir({ verificacion: conCorr, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
});

test('decidir: «con_cambios» → corregir (código 5); en el segundo pase solo vale «conforme» (mutación 3)', () => {
  const e = edicionBuena(); const bytes = Buffer.from(JSON.stringify(e));
  const v = verificacionDe(bytes, e, FECHA, 1, { veredicto: 'con_cambios', correcciones: [{ id: e.noticias[0].id, campo: 'titulo', antes: e.noticias[0].titulo, despues: 'Titular corregido', motivo: 'm' }] });
  assert.equal(decidir({ verificacion: v, bytes, ids: ids(e), fecha: FECHA, pase: 1 }).siguiente, 'corregir');
  freno(() => decidir({ verificacion: { ...v, correcciones: [] }, bytes, ids: ids(e), fecha: FECHA, pase: 1 }));
  // Pase 2 con «con_cambios» otra vez: freno (una sola ronda).
  freno(() => decidir({ verificacion: { ...v, pase: 2 }, bytes, ids: ids(e), fecha: FECHA, pase: 2 }));
  assert.equal(decidir({ verificacion: verificacionDe(bytes, e, FECHA, 2), bytes, ids: ids(e), fecha: FECHA, pase: 2 }).siguiente, 'preparar');
});

test('corregir: aplica el campo exacto, quita una noticia, y frena si el «antes» no coincide o el campo no se puede tocar (mutación 20)', () => {
  const e = edicionBuena(); const tit = { noticias: e.noticias.map(n => ({ id: n.id, propuestas: { es: [n.titulo, 'b', 'c'], en: [n.en.titulo, 'b', 'c'] }, elegido: { es: n.titulo, en: n.en.titulo }, foto: { clave: n.imagen } })) };
  const vb = Buffer.from('{}');
  const r = corregir({ edicion: e, titulares: tit, verificacionBytes: vb, verificacion: { correcciones: [
    { id: e.noticias[0].id, campo: 'en.titulo', antes: e.noticias[0].en.titulo, despues: 'Fixed English headline', motivo: 'exagera' },
    { id: e.noticias[1].id, quitar: true, motivo: 'la fuente ya no lo dice' }] } });
  assert.equal(r.edicion.noticias[0].en.titulo, 'Fixed English headline');
  assert.equal(r.titulares.noticias[0].elegido.en, 'Fixed English headline');
  assert.ok(r.titulares.noticias[0].propuestas.en.includes('Fixed English headline'));
  assert.equal(r.edicion.noticias.length, e.noticias.length - 1);
  assert.equal(r.registro.verificacionSha256, sha256(vb));
  freno(() => corregir({ edicion: e, titulares: tit, verificacionBytes: vb, verificacion: { correcciones: [{ id: e.noticias[0].id, campo: 'titulo', antes: 'otro texto', despues: 'x' }] } }));
  freno(() => corregir({ edicion: e, titulares: tit, verificacionBytes: vb, verificacion: { correcciones: [{ id: e.noticias[0].id, campo: 'fuente.url', antes: e.noticias[0].fuente.url, despues: 'https://x' }] } }));
  freno(() => corregir({ edicion: e, titulares: tit, verificacionBytes: vb, verificacion: { correcciones: [{ id: 'no-esta', campo: 'titulo', antes: 'a', despues: 'b' }] } }));
});

test('por la línea de órdenes: decidir 0 / 5 / 4, corregir y segundo pase, con su diario', () => {
  const bien = montarDia();
  assert.equal(programa(['decidir', '--fecha', FECHA, '--trabajo', bien.trabajo]).codigo, 0);
  const malo = montarDia({ verificacion: { veredicto: 'rechazado', version: 1, pase: 1, fecha: FECHA, noticias: [] } });
  const r = programa(['decidir', '--fecha', FECHA, '--trabajo', malo.trabajo]);
  assert.equal(r.codigo, 4); assert.match(r.salida, /FRENO · verificador: el verificador ha rechazado la edición/);
  const diario = fs.readFileSync(path.join(malo.trabajo, 'diario.jsonl'), 'utf8');
  assert.match(diario, /"codigo":4/);
  // Con cambios: 5, corregir, y el segundo pase.
  const e = edicionBuena(); const bytes = Buffer.from(JSON.stringify(e, null, 2) + '\n');
  const cambios = montarDia({ edicion: e, verificacion: verificacionDe(bytes, e, FECHA, 1, { veredicto: 'con_cambios',
    correcciones: [{ id: e.noticias[0].id, campo: 'resumen', antes: e.noticias[0].resumen, despues: 'Resumen corregido por el verificador.', motivo: 'm' }] }) });
  assert.equal(programa(['decidir', '--fecha', FECHA, '--trabajo', cambios.trabajo]).codigo, 5);
  assert.equal(programa(['corregir', '--fecha', FECHA, '--trabajo', cambios.trabajo]).codigo, 0);
  const corregida = fs.readFileSync(path.join(cambios.trabajo, 'corregido', `noticias-${FECHA}.json`));
  assert.match(corregida.toString(), /Resumen corregido por el verificador/);
  // Sin segundo pase: freno.
  assert.equal(programa(['decidir', '--pase', '2', '--fecha', FECHA, '--trabajo', cambios.trabajo]).codigo, 4);
  const e2 = JSON.parse(corregida.toString());
  escribir(path.join(cambios.trabajo, 'verificador-2', 'verificacion-2.json'), verificacionDe(corregida, e2, FECHA, 2));
  escribir(path.join(cambios.trabajo, 'verificador-2', 'VERIFICACION-2.md'), '# Segundo pase\n\nConforme, sin personas.\n');
  assert.equal(programa(['decidir', '--pase', '2', '--fecha', FECHA, '--trabajo', cambios.trabajo]).codigo, 0);
  // Pase 2 sobre otros bytes (el JSON corregido cambió después): freno.
  fs.appendFileSync(path.join(cambios.trabajo, 'corregido', `noticias-${FECHA}.json`), ' ');
  assert.equal(programa(['decidir', '--pase', '2', '--fecha', FECHA, '--trabajo', cambios.trabajo]).codigo, 4);
});

test('encargos literales: el del verificador no nombra las notas del editor ni lleva nada suyo', () => {
  const dia = montarDia();
  fs.writeFileSync(path.join(dia.notas, 'EDICION.md'), 'RAZONAMIENTO-SECRETO-DEL-EDITOR: elegí esta por intuición.\n');
  const ed = programa(['encargo', '--rol', 'editor', '--fecha', FECHA, '--trabajo', dia.trabajo, '--notas', dia.notas]);
  assert.equal(ed.codigo, 0); assert.ok(ed.salida.includes(dia.notas));
  for (const rol of ['verificador', 'verificador-2']) {
    const v = programa(['encargo', '--rol', rol, '--fecha', FECHA, '--trabajo', dia.trabajo, '--notas', dia.notas]);
    assert.equal(v.codigo, 0, v.salida);
    assert.ok(!v.salida.includes(dia.notas), 'nombra la carpeta de notas');
    assert.ok(!v.salida.includes('RAZONAMIENTO-SECRETO'), 'lleva texto de EDICION.md');
    assert.ok(!/\{[A-Z_]+\}/.test(v.salida));
    assert.match(v.salida, rol === 'verificador' ? /verificacion\.json/ : /verificacion-2\.json/);
  }
  assert.equal(programa(['encargo', '--rol', 'editor', '--fecha', FECHA, '--trabajo', dia.trabajo]).codigo, 1);
});

test('antes de unir: base = main, cabeza = sello, 2 commits, solo archivos permitidos y «pruebas» en verde (mutación 6)', () => {
  const cabeza = 'b'.repeat(40), main = 'a'.repeat(40);
  const pr = { state: 'open', merged: false, base: { ref: 'main', sha: main }, head: { sha: cabeza }, commits: 2 };
  const archivos = ['rwadar-site/datos/noticias-v2.json', 'rwadar-site/datos/noticias.json', RUTAS.sello,
    `rwadar-app/data/noticias-diarias/${FECHA}/noticias-${FECHA}.json`, `rwadar-app/data/noticias-diarias/${FECHA}/verificacion.json`];
  const checks = [{ name: 'pruebas', status: 'completed', conclusion: 'success', head_sha: cabeza }];
  assert.deepEqual(antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos, checks }), { ok: true });
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: 'c'.repeat(40), cabeza, archivos, checks }));
  freno(() => antesDeUnir({ fecha: FECHA, pr: { ...pr, head: { sha: main } }, mainSha: main, cabeza, archivos, checks }));
  freno(() => antesDeUnir({ fecha: FECHA, pr: { ...pr, commits: 3 }, mainSha: main, cabeza, archivos, checks }));
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos: [...archivos, 'rwadar-publicar.js'], checks }));
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos: [...archivos, `rwadar-app/data/noticias-diarias/${FECHA}/copia.pdf`], checks }));
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos, checks: [{ ...checks[0], conclusion: 'failure' }] }));
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos, checks: [{ ...checks[0], status: 'in_progress', conclusion: null }] }));
  freno(() => antesDeUnir({ fecha: FECHA, pr, mainSha: main, cabeza, archivos, checks: [] }));
});

test('«Publicar web» tiene que publicar el commit de unión; si no, se cancela y se frena', () => {
  const union = 'd'.repeat(40);
  const ej = { path: '.github/workflows/publicar.yml', event: 'workflow_dispatch', head_branch: 'main', head_sha: union };
  assert.deepEqual(comprobarEjecucion({ ejecucion: ej, union }), { ok: true });
  assert.throws(() => comprobarEjecucion({ ejecucion: { ...ej, head_sha: 'e'.repeat(40) }, union }), /CANCÉLALA/);
  freno(() => comprobarEjecucion({ ejecucion: { ...ej, path: '.github/workflows/ci.yml' }, union }));
});

test('el resumen: primera línea de cada estado y cuándo se avisa', () => {
  const n = BASE.noticias;
  assert.match(primeraLinea({ fecha: FECHA, estado: 'PUBLICADO', noticias: n, hoyCuantas: 0, hora: '09:31' }), /^Noticias 14\/11: PUBLICADAS \(5; 0 de hoy\) · web y app comprobadas 09:31$/);
  assert.match(primeraLinea({ fecha: FECHA, estado: 'FRENADO', paso: 'verificador', motivo: 'rechazada' }), /^Noticias 14\/11: NO publicadas · verificador: rechazada\. La web sigue como estaba\.$/);
  assert.match(primeraLinea({ fecha: FECHA, estado: 'SIN_HACER_NADA', motivo: 'main tiene cambios sin sellar', accion: 'Séllalos y publícalos.' }), /no hice nada · main tiene cambios sin sellar\. Séllalos/);
  assert.match(primeraLinea({ fecha: FECHA, estado: 'UNIDO_SIN_PUBLICAR', paso: 'revisión', motivo: 'x' }), /UNIDAS SIN PUBLICAR/);
  assert.match(primeraLinea({ fecha: FECHA, estado: 'PUBLICADO_CON_AVISO', motivo: 'x' }), /PUBLICADAS CON AVISO/);
  assert.equal(hayQueAvisar({ estado: 'PUBLICADO' }), false);
  assert.equal(hayQueAvisar({ estado: 'FRENADO' }), true);
  assert.equal(hayQueAvisar({ estado: 'UNIDO_SIN_PUBLICAR' }), true);
  assert.equal(hayQueAvisar({ estado: 'SIN_HACER_NADA', avisarCerrojo: true }), true);
  assert.equal(hayQueAvisar({ estado: 'SIN_HACER_NADA', avisarCerrojo: false }), false);
  // Por la línea de órdenes: un día frenado dice qué frenó y pide avisar.
  const malo = montarDia({ verificacion: { veredicto: 'rechazado', version: 1, pase: 1, fecha: FECHA, noticias: [] } });
  programa(['decidir', '--fecha', FECHA, '--trabajo', malo.trabajo]);
  const r = programa(['resumen', '--estado', 'FRENADO', '--paso', 'verificador', '--motivo', 'el verificador ha rechazado la edición', '--fecha', FECHA, '--trabajo', malo.trabajo]);
  assert.equal(r.codigo, 0);
  assert.match(r.salida, /^Noticias 14\/11: NO publicadas · verificador/);
  assert.match(r.salida, /Qué frenó:\n- decidir: el verificador ha rechazado la edición/);
  assert.match(r.salida, /AVISAR: sí/);
});

test('config: «activo»: false → no hace nada (código 3) (mutación 11)', () => {
  const dir = tmp('config');
  const c = JSON.parse(fs.readFileSync(path.join(RAIZ, '.claude/skills/noticias-automaticas/config.json'), 'utf8'));
  escribir(path.join(dir, 'config.json'), { ...c, activo: false });
  assert.equal(programa(['config', '--config', path.join(dir, 'config.json')]).codigo, 3);
  assert.equal(programa(['config']).codigo, 0);
  escribir(path.join(dir, 'mal.json'), { ...c, selloHumanoMaxDias: 30 });
  assert.equal(programa(['config', '--config', path.join(dir, 'mal.json')]).codigo, 1);
});
