// Prueba lenta del motor (unos 35 s): el ensayo en PGlite de la entrega real del 12/11 da lo mismo que dio ese día
// (pruebas-locales.json): inventario, cambios comprobados, las 22 tarjetas, las fichas que cambian, lo que lee el
// sincronizador y los 6 casos de fallo. Se ensaya con el reloj en el 13/11 (dentro de su vigencia), así vale cualquier día.
//   node --test .claude/skills/investigacion-catalogo/entrega/pglite.test.mjs
// No va en «npm test» para no alargarlo: el ensayo lo corre cada ciclo (comprobar) y el auditor determinista.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../../../..');
const CICLO = path.join(RAIZ, 'rwadar-app/data/verificaciones/2026-11-12-v2');
const { comprobar } = await import('./comprobar.mjs');

test('comprobar (PGlite) sobre la entrega del 12/11 da lo mismo que el ensayo de ese día', { timeout: 180_000 }, async () => {
  const r = await comprobar({ raiz: RAIZ, ciclo: CICLO, hoy: '2026-11-13', silencio: true, escribirInforme: false });
  const real = JSON.parse(fs.readFileSync(path.join(CICLO, 'pruebas-locales.json'), 'utf8'));
  assert.equal(r.resultado, 'correcto');
  assert.equal(r.sha256, real.sha256AplicarYAprobar);
  assert.equal(r.casosDeFallo, 6);
  const caso = c => ({ ...c, caso: c.caso.replace(/tope movido al \d{4}-\d{2}-\d{2}/, 'tope movido al día anterior') });
  for (const k of ['inventario', 'sentencias', 'cambiosComprobados', 'tarjetas', 'fichasQueCambian', 'lecturasDelSincronizador', 'revisionAnterior', 'revisionNueva'])
    assert.deepEqual(r.informe[k], real[k], k);
  assert.deepEqual(r.informe.casos.map(caso), real.casos.map(caso), 'los mismos casos de fallo, con los mismos errores');
  assert.equal(r.informe.pruebas.length - (r.informe.relojSimulado ? 1 : 0), real.pruebas.length - 1, 'las mismas comprobaciones (sin la exportación)');
});
