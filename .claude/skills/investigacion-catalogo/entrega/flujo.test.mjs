// Pruebas del flujo .claude/workflows/entrega-catalogo.js (sin agentes de verdad: agent(), parallel(), phase() y log()
// simulados). Comprueban el orden rápido: el montador escribe decisiones.json y usa el motor (esfuerzo «high»); los tres
// revisores siguen siendo independientes y se pueden lanzar uno por flujo para que revisen a la vez; tras corregir, la
// comprobación determinista del SQL sustituye al auditor si el SQL no cambió, y el auditor sigue si cambió.
//   node --test .claude/skills/investigacion-catalogo/entrega/flujo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FLUJO = path.resolve(AQUI, '../../../workflows/entrega-catalogo.js');
const TEXTO = fs.readFileSync(FLUJO, 'utf8');
const AsyncFunction = (async () => {}).constructor;
const cuerpo = TEXTO.replace(/^export const meta =/m, 'const meta =');
assert.notEqual(cuerpo, TEXTO, 'el flujo empieza por «export const meta =»');
const guion = new AsyncFunction('args', 'agent', 'parallel', 'phase', 'log', cuerpo);

const BASE = {
  etiqueta: '2026-11-14', fecha: '2026-11-14', ciclo: 'rwadar-app/data/verificaciones/2026-11-14-v2', desde: '2026-11-13',
  previa: { revisionId: 'r-13', hash: 'h-13' }, ultimoDia: '2026-11-21', scratch: '/tmp/rwadar-scratch',
};
const SHA1 = 'a'.repeat(64), SHA2 = 'b'.repeat(64);
const montaje = sha => ({ revisionId: 'r-14', huella: 'h-14', sha256AplicarYAprobar: sha, sentencias: 288, ofertas: 22, plataformas: 25,
  colecciones: '8/13/1', pruebas: ['preparar --repetir: mismos SHA-256'], pendientes: [], noAplicado: [] });
const rev = (lente, veredicto = 'aprobado', obligatorias = [], recomendadas = []) =>
  ({ lente, veredicto, obligatorias, recomendadas, informe: `REVISION-ENTREGA-${lente}.md` });
const comprobacion = (extra = {}) => ({ orden: 'motor.mjs auditar', salida: 0, veredicto: 'conforme_sin_cambios_en_el_sql', sqlCambia: false,
  mismoInventario: true, copiaEsLaRevisada: true, sha256Final: SHA2, pglite: 'correcto', secretos: 'sin hallazgos', diferencias: [],
  hallazgos: [], obligatoriasSinSql: [], ...extra });

// Ejecuta el flujo con respuestas fijas por etiqueta de agente; devuelve el resultado y los agentes lanzados.
async function ejecutar(args, respuestas = {}) {
  const lanzados = [], fases = [], avisos = [];
  const agent = async (prompt, opciones = {}) => {
    lanzados.push({ prompt, ...opciones });
    const r = respuestas[opciones.label];
    if (r === undefined) throw new Error(`agente inesperado: ${opciones.label}`);
    return typeof r === 'function' ? r(prompt) : structuredClone(r);
  };
  const parallel = thunks => Promise.all(thunks.map(t => t().catch(() => null)));
  const resultado = await guion(args, agent, parallel, f => fases.push(f), m => avisos.push(m));
  return { resultado, lanzados, fases, avisos, de: label => lanzados.find(l => l.label === label) };
}
// Una revisión tal como la devuelve la fase «revisar» (con su marca).
const marcar = async r => (await ejecutar({ ...BASE, fase: 'revisar', lentes: [r.lente], montaje: montaje(SHA1) }, { [`revisar:${r.lente}`]: r })).resultado.revisiones[0];
const marcar3 = lista => Promise.all(lista.map(marcar));
const REVISORES = { 'revisar:sql': rev('sql'), 'revisar:contenido': rev('contenido'), 'revisar:cumplimiento': rev('cumplimiento') };

test('meta: nombre, y las fases de meta son las de phase()', () => {
  const meta = TEXTO.match(/^export const meta = (\{[\s\S]*?\n\})\n/m);
  assert.ok(meta, 'meta literal');
  const titulos = [...meta[1].matchAll(/title: '([^']+)'/g)].map(m => m[1]);
  const llamadas = [...new Set([...TEXTO.matchAll(/phase\('([^']+)'\)/g)].map(m => m[1]))];
  assert.deepEqual(llamadas.sort(), [...titulos].sort());
  assert.match(meta[1], /name: 'entrega-catalogo'/);
  assert.doesNotMatch(meta[1], /\$\{|\.\.\./, 'meta es un literal puro');
});

test('montar: el montador escribe decisiones.json y ejecuta el motor, con esfuerzo high', async () => {
  const { resultado, lanzados, de } = await ejecutar({ ...BASE, fase: 'montar' }, { montar: montaje(SHA1) });
  assert.equal(lanzados.length, 1);
  assert.equal(resultado.estado, 'montada');
  const m = de('montar');
  assert.equal(m.effort, 'high');
  for (const t of ['decisiones.json', 'FORMATO.md', 'motor.mjs guiones 2026-11-14', 'motor.mjs preparar 2026-11-14 --repetir',
    'motor.mjs comprobar 2026-11-14', 'motor.mjs revisar 2026-11-14', 'DIFF-ENTREGA.md', '/tmp/rwadar-scratch/sql-revisado-2026-11-14', 'npm test'])
    assert.ok(m.prompt.includes(t), `el encargo del montador dice «${t}»`);
  assert.doesNotMatch(m.prompt, /Modelo de una entrega completa/, 'ya no copia los guiones del día anterior');
});

test('sin motor (altas o retiradas): el montador de siempre, con el modelo y esfuerzo xhigh', async () => {
  await assert.rejects(ejecutar({ ...BASE, fase: 'montar', motor: false }, {}), /args\.modelo/);
  const { de } = await ejecutar({ ...BASE, fase: 'montar', motor: false, modelo: 'rwadar-app/data/verificaciones/2026-11-05.2-v2' }, { montar: montaje(SHA1) });
  assert.equal(de('montar').effort, 'xhigh');
  assert.match(de('montar').prompt, /preparar-entrega\.mjs: sin red, reproducible/);
  assert.match(de('montar').prompt, /2026-11-05\.2-v2/);
});

test('revisar: una lente por lanzamiento (los tres a la vez en flujos aparte), independientes y empezando por el diff', async () => {
  for (const lente of ['sql', 'contenido', 'cumplimiento']) {
    const { resultado, lanzados, avisos } = await ejecutar({ ...BASE, fase: 'revisar', lentes: [lente], montaje: montaje(SHA1) }, REVISORES);
    assert.deepEqual(lanzados.map(l => [l.label, l.effort]), [[`revisar:${lente}`, 'max']]);
    assert.equal(resultado.revisiones.length, 1);
    assert.match(lanzados[0].prompt, /No montaste esta entrega/);
    assert.match(lanzados[0].prompt, /Empieza por .*DIFF-ENTREGA\.md/);
    assert.match(lanzados[0].prompt, /compruébalo tú/);
    assert.deepEqual(avisos.filter(a => /2 agentes/.test(a)), []);
  }
  // La lente la pone el flujo aunque el revisor la escriba a su manera.
  const libre = await ejecutar({ ...BASE, fase: 'revisar', lentes: ['sql'], montaje: montaje(SHA1) }, { 'revisar:sql': rev('SQL e integridad') });
  assert.equal(libre.resultado.revisiones[0].lente, 'sql');
  // Las tres en un solo flujo funcionan, pero avisa de que el tercero espera.
  const { lanzados, avisos } = await ejecutar({ ...BASE, fase: 'revisar', montaje: montaje(SHA1) }, REVISORES);
  assert.equal(lanzados.length, 3);
  assert.ok(avisos.some(a => /2 agentes a la vez/.test(a)));
  await assert.rejects(ejecutar({ ...BASE, fase: 'revisar', lentes: ['estilo'], montaje: montaje(SHA1) }, REVISORES), /lente desconocida/);
  await assert.rejects(ejecutar({ ...BASE, fase: 'revisar', lentes: ['sql'] }, REVISORES), /args\.montaje/);
});

test('cerrar sin correcciones: aprobada sin más agentes; con un rechazo: rechazada; sin las tres revisiones: falla', async () => {
  const tres = await marcar3([rev('sql'), rev('contenido'), rev('cumplimiento')]);
  const a = await ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: tres });
  assert.deepEqual([a.resultado.estado, a.lanzados.length], ['aprobada', 0]);
  const r = await ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: [await marcar(rev('sql', 'rechazado')), tres[1], tres[2]] });
  assert.deepEqual([r.resultado.estado, r.lanzados.length], ['rechazada', 0]);
  await assert.rejects(ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: tres.slice(0, 2) }), /falta la revisión de cumplimiento/);
});

const O1 = { id: 'O1', problema: 'nombre de persona en una copia', correccion: 'recortar «consejero X» en noticias/copia.html', cambiaSql: false };
const R1 = { id: 'R1', problema: 'frase de Hausera', correccion: '«El 14/11/2026 aún no se podía invertir»', cambiaSql: true };
const conCorreccion = async (obligatorias, comp, extra = {}) => ejecutar(
  { ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: await marcar3([rev('sql'), rev('contenido'), rev('cumplimiento', 'aprobado_con_cambios', obligatorias)]) },
  { corregir: montaje(SHA2), comprobar: comp, ...extra });

test('cerrar: si la corrección no cambia el SQL, basta la comprobación determinista (sin auditor)', async () => {
  const { resultado, lanzados, de } = await conCorreccion([O1], comprobacion({ obligatoriasSinSql: [{ id: 'O1', aplicada: true, evidencia: 'noticias/copia.html' }] }));
  assert.equal(resultado.estado, 'aprobada_con_correcciones');
  assert.deepEqual(lanzados.map(l => [l.label, l.effort]), [['corregir', 'high'], ['comprobar', 'medium']]);
  const c = de('comprobar').prompt;
  for (const t of [`motor.mjs auditar 2026-11-14 --antes=/tmp/rwadar-scratch/sql-revisado-2026-11-14 --revisado=${SHA1}`, '--exigir-secretos', '--escribir', '"id":"O1"'])
    assert.ok(c.includes(t), `la comprobación lleva «${t}»`);
  assert.match(de('corregir').prompt, /SOLO en .*decisiones\.json/);
  assert.match(de('corregir').prompt, /No toques \/tmp\/rwadar-scratch\/sql-revisado-2026-11-14/);
});

test('cerrar: si la corrección cambia el SQL, sigue el auditor (agente, esfuerzo max) con el diff de la comprobación', async () => {
  const comp = comprobacion({ veredicto: 'sql_cambiado_falta_auditor', sqlCambia: true, diferencias: ['ofertas hausera: «Hoy » → «El 14/11/2026 aún »'] });
  const v = { veredicto: 'conforme', sha256Final: SHA2, revisionIdFinal: 'r-14', hallazgos: [] };
  const { resultado, lanzados, de } = await conCorreccion([R1], comp, { auditar: v });
  assert.deepEqual(lanzados.map(l => [l.label, l.effort]), [['corregir', 'high'], ['comprobar', 'medium'], ['auditar', 'max']]);
  assert.equal(resultado.estado, 'aprobada_con_correcciones');
  assert.match(de('auditar').prompt, /La corrección CAMBIÓ el SQL/);
  assert.ok(de('auditar').prompt.includes('«Hoy » → «El 14/11/2026 aún »'), 'el auditor recibe el diff');
  const no = await conCorreccion([R1], comp, { auditar: { ...v, veredicto: 'no_conforme', hallazgos: ['otra frase'] } });
  assert.equal(no.resultado.estado, 'pendiente_de_verificacion');
  // Datos incoherentes de la comprobación (dice que no cambió, pero lista diferencias o su veredicto dice que sí): auditor.
  for (const raro of [{ ...comp, sqlCambia: false }, { ...comp, sqlCambia: false, veredicto: 'conforme_sin_cambios_en_el_sql' }]) {
    const r = await conCorreccion([O1], { ...raro, obligatoriasSinSql: [{ id: 'O1', aplicada: true, evidencia: 'copia.html' }] }, { auditar: v });
    assert.ok(r.lanzados.some(l => l.label === 'auditar'), JSON.stringify(raro));
  }
});

test('cerrar: lo que la comprobación determinista no deja pasar (y nunca se aprueba sin auditor)', async () => {
  const casos = [
    ['no conforme', comprobacion({ salida: 1, veredicto: 'no_conforme', hallazgos: ['falta el escáner de secretos'] }), [O1], /escáner|no es conforme/],
    ['copia que no es la revisada', comprobacion({ copiaEsLaRevisada: false }), [], /no es el SQL que vieron/],
    ['inventario distinto', comprobacion({ mismoInventario: false }), [], /inventario/],
    ['SHA-256 distinto del corrector', comprobacion({ sha256Final: 'c'.repeat(64) }), [], /no es el que dice el corrector/],
    ['pedían cambiar el SQL y no cambió', comprobacion(), [R1], /pedían cambiar el SQL \(R1\)/],
    ['corrección sin SQL no aplicada', comprobacion({ obligatoriasSinSql: [{ id: 'O1', aplicada: false, evidencia: 'sigue el nombre' }] }), [O1], /O1 sin aplicar/],
    ['corrección sin SQL sin mirar', comprobacion(), [O1], /no miró las correcciones O1/],
    ['PGlite que no da correcto', comprobacion({ pglite: 'falla' }), [], /PGlite/],
    ['escáner que no da sin hallazgos', comprobacion({ secretos: 'no ejecutado' }), [], /escáner de secretos/],
  ];
  for (const [nombre, comp, obligatorias, motivo] of casos) {
    const recomendadas = obligatorias.length ? [] : ['una recomendada'];
    const { resultado, lanzados } = await ejecutar(
      { ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: await marcar3([rev('sql'), rev('contenido'), rev('cumplimiento', 'aprobado_con_cambios', obligatorias, recomendadas)]) },
      { corregir: montaje(SHA2), comprobar: comp });
    assert.equal(resultado.estado, 'pendiente_de_verificacion', nombre);
    assert.ok(resultado.hallazgos.some(h => motivo.test(h)), `${nombre}: ${resultado.hallazgos.join(' | ')}`);
    assert.ok(!lanzados.some(l => l.label === 'auditar'), `${nombre}: no se aprueba ni se audita con hallazgos`);
  }
});

test('todo en un flujo: montar → tres revisores → corregir → comprobar', async () => {
  const { resultado, lanzados } = await ejecutar(BASE, { montar: montaje(SHA1), ...REVISORES,
    'revisar:cumplimiento': rev('cumplimiento', 'aprobado_con_cambios', [O1]), corregir: montaje(SHA2),
    comprobar: comprobacion({ obligatoriasSinSql: [{ id: 'O1', aplicada: true, evidencia: 'copia.html' }] }) });
  assert.deepEqual(lanzados.map(l => l.label), ['montar', 'revisar:sql', 'revisar:contenido', 'revisar:cumplimiento', 'corregir', 'comprobar']);
  assert.equal(resultado.estado, 'aprobada_con_correcciones');
  await assert.rejects(ejecutar({ ...BASE, fase: 'otra' }), /args\.fase/);
  await assert.rejects(ejecutar({ ...BASE, scratch: undefined }), /args\.scratch/);
});

test('cerrar: una revisión que no es la que devolvió su revisor (sin marca, o con una corrección perdida al copiarla) no se cierra', async () => {
  const O = { id: 'O1', problema: 'p', correccion: 'c', cambiaSql: false };
  const tres = await marcar3([rev('sql'), rev('contenido'), rev('cumplimiento', 'aprobado_con_cambios', [O])]);
  const perdida = { ...tres[2], veredicto: 'aprobado', obligatorias: [] };
  await assert.rejects(ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: [tres[0], tres[1], perdida] }), /no es la que devolvió su revisor/);
  await assert.rejects(ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: [rev('sql'), rev('contenido'), rev('cumplimiento')] }), /sin marca/);
  // Copiada con las claves en otro orden: vale.
  const reordenada = Object.fromEntries(Object.entries(tres[0]).reverse());
  const ok = await ejecutar({ ...BASE, fase: 'cerrar', montaje: montaje(SHA1), revisiones: [reordenada, tres[1], { ...tres[2] }] },
    { corregir: montaje(SHA2), comprobar: comprobacion({ sha256Final: SHA2, obligatoriasSinSql: [{ id: 'O1', aplicada: true, evidencia: 'x' }] }) });
  assert.equal(ok.resultado.estado, 'aprobada_con_correcciones');
});

test('sin motor (altas o retiradas) y con correcciones: verifica el auditor de siempre (max), no «motor.mjs auditar»', async () => {
  const R1 = { id: 'R1', problema: 'cifra', correccion: 'otra cifra', cambiaSql: true };
  const v = { veredicto: 'conforme', sha256Final: SHA2, revisionIdFinal: 'r-14', hallazgos: [] };
  const { resultado, lanzados, de } = await ejecutar({ ...BASE, motor: false, modelo: 'rwadar-app/data/verificaciones/2026-11-05.2-v2' },
    { montar: montaje(SHA1), ...REVISORES, 'revisar:sql': rev('sql', 'aprobado_con_cambios', [R1]), corregir: montaje(SHA2), auditar: v });
  assert.deepEqual(lanzados.map(l => l.label), ['montar', 'revisar:sql', 'revisar:contenido', 'revisar:cumplimiento', 'corregir', 'auditar']);
  assert.equal(de('auditar').effort, 'max');
  assert.doesNotMatch(de('auditar').prompt, /motor\.mjs auditar/);
  assert.match(de('auditar').prompt, /sql-revisado-2026-11-14\/aplicar-y-aprobar\.sql/);
  assert.equal(resultado.estado, 'aprobada_con_correcciones');
});
