// Prueba sin red ni agentes del flujo guardado .claude/workflows/investigacion-catalogo.js:
// con el vigía (vigia.json), el investigador parte de él (confirma lo que cambia, re-fecha lo que no
// cambia con la hora y la huella del vigía, abre a mano lo que no leyó) y el revisor independiente
// sigue reabriendo cada cambio crítico y además muestrea lo re-fechado con el vigía.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const FLUJO = fileURLToPath(new URL('../.claude/workflows/investigacion-catalogo.js', import.meta.url));
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

// Ejecuta el guion como lo hace el motor de flujos (cuerpo asíncrono con args, agent, pipeline…), con agentes simulados.
async function ejecutar(args) {
  const src = fs.readFileSync(FLUJO, 'utf8').replace(/^export const meta\s*=/m, 'const meta =');
  const llamadas = [];
  const agent = async (prompt, opts = {}) => {
    llamadas.push({ prompt, ...opts });
    if (opts.phase === 'Investigar') return { grupo: 'g', expedientes: [{ slug: 's', tipo: 'publicada', decision: 'actualizar', cambiosCriticos: ['80 € → 73 €'], resumen: 'r' }], bloqueos: [] };
    return { grupo: 'g', items: [], veredictoGlobal: 'aprobado' };
  };
  const pipeline = async (items, ...etapas) => Promise.all(items.map(async (it, i) => {
    let r = it;
    for (const [k, etapa] of etapas.entries()) r = await etapa(k === 0 ? it : r, it, i);
    return r;
  }));
  const parallel = async (fs_) => Promise.all(fs_.map((f) => f()));
  const resultado = await new AsyncFunction('args', 'agent', 'pipeline', 'parallel', 'log', 'phase', src)(args, agent, pipeline, parallel, () => {}, () => {});
  return { resultado, investigar: llamadas.filter((l) => l.phase === 'Investigar'), revisar: llamadas.filter((l) => l.phase === 'Revisar') };
}

const ARGS = {
  fecha: '2026-11-13', ciclo: 'rwadar-app/data/verificaciones/2026-11-13-v2', base: 'rwadar-app/data/verificaciones/2026-11-12-v2',
  grupos: [{ id: 'brickwise', slugs: ['vivienda-pottendorfer-stra-e-62-wr-neustadt'] }, { id: 'suiza', slugs: ['aktionariat'] }],
};

test('con vigía: el investigador parte de vigia.json y solo abre a mano lo que cambia o no se leyó', async () => {
  const { investigar, revisar, resultado } = await ejecutar(ARGS);
  assert.equal(investigar.length, 2);
  assert.equal(revisar.length, 2);
  assert.equal(resultado.resultados.length, 2);
  for (const { prompt } of investigar) {
    assert.match(prompt, /comprueba si existe rwadar-app\/data\/verificaciones\/2026-11-13-v2\/vigia\.json/);
    // Solo vale el vigía de hoy y sobre la publicada de la que parte el ciclo.
    assert.match(prompt, /«generadoUtc» no es del 2026-11-13/);
    assert.match(prompt, /«base» no es rwadar-app\/data\/verificaciones\/2026-11-12-v2/);
    // «cambia»: se confirma en la fuente; el vigía no es la fuente.
    assert.match(prompt, /Estado «cambia»: confirma tú hoy la cifra en su fuente primaria/);
    // «no cambia»: re-fecha con la hora y la huella del vigía, marcado para el revisor.
    assert.match(prompt, /Estado «no cambia»: re-fecha .* SIN volver a leerlos/);
    assert.match(prompt, /«horaUtc» del vigía y su «sha256»/);
    assert.match(prompt, /"segunVigia": true/);
    // «no se pudo leer» y lo no cubierto: a mano, sin re-fechar nada que el vigía no leyó.
    assert.match(prompt, /Estado «no se pudo leer», y todo lo que el vigía no cubre \(«noCubre»/);
    assert.match(prompt, /Nunca re-feches con el vigía algo que no leyó hoy/);
    // Las reglas de siempre siguen ahí.
    assert.match(prompt, /Una cifra que hoy no puedas leer en su fuente primaria queda en null/);
  }
  for (const { prompt } of revisar) {
    assert.match(prompt, /revisor INDEPENDIENTE/);
    assert.match(prompt, /1\. Cada cambio crítico/);
    assert.match(prompt, /El vigía no es una comprobación independiente: sigues reabriendo tú cada cambio crítico/);
    assert.match(prompt, /al menos 2 de lo re-fechado con el vigía en tu grupo, o todo si son ≤ 3/);
    assert.match(prompt, /rechazado cualquier dato con "segunVigia" que en vigia\.json esté como «cambia» o «no se pudo leer», o que no esté en él/);
  }
});

test('vigía en otra ruta o desactivado', async () => {
  const otra = await ejecutar({ ...ARGS, vigia: '/tmp/otro/vigia.json' });
  assert.match(otra.investigar[0].prompt, /comprueba si existe \/tmp\/otro\/vigia\.json/);
  assert.match(otra.revisar[0].prompt, /partir del vigía \(\/tmp\/otro\/vigia\.json\)/);
  const sin = await ejecutar({ ...ARGS, vigia: false });
  for (const l of [...sin.investigar, ...sin.revisar]) assert.doesNotMatch(l.prompt, /vigía|vigia\.json|segunVigia/);
  // Sin vigía, el revisor sigue reabriendo cada cambio crítico.
  assert.match(sin.revisar[0].prompt, /1\. Cada cambio crítico/);
});
