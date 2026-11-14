/* GET /api/tokenizacion/directo (14/11/2026, migración 35): el servidor de la
   web lee public.tokenizacion_directo() de Supabase con la clave publicable,
   lo pasa al formato de la fina publicada, comprueba que casa con la diaria
   del despliegue y que es reciente, y lo sirve desde su memoria. Sin red: un
   Supabase de pega con los datos reales del 13/11 en compacto. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { crearAccesoServidor } from './servidor.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIARIA = fs.readFileSync(path.join(RAIZ, 'rwadar-app/tokenizacion/prueba-serie-20261113.json'), 'utf8');
const FINA = JSON.parse(fs.readFileSync(path.join(RAIZ, 'rwadar-app/tokenizacion/prueba-serie-fina-20261113.json'), 'utf8'));
const ENV = { SUPABASE_URL: 'https://exgpmjpaaebyoolpwced.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
const ORIGEN = 'https://rwadar.pages.dev';
const RPC = ENV.SUPABASE_URL + '/rest/v1/rpc/tokenizacion_directo';
const GENERADO = Date.parse(FINA.generado);
const MIN = 60000;

function compacta(x) {
  const n = [];
  for (const p of x.puntos) { if (n.length && n.at(-1)[1] === p[2]) n.at(-1)[0]++; else n.push([1, p[2]]); }
  return { desde: x.puntos[0][0], arrastre: x.arrastre, fuera: x.fuera, valorFuera: x.valorFuera, largos: x.largos, valores: x.puntos.map(p => p[1]), n, sinLectura: [] };
}
const DOC = { v: 1, generado: FINA.generado, diaria: '2026-11-13T15:10:06Z', diariaLeida: '2026-11-13T15:05:00Z', tokens: FINA.tokens,
  series: { '5m': compacta(FINA.series['5m']), '1h': compacta(FINA.series['1h']) } };
const ok = (doc = DOC) => new Response(JSON.stringify({ estado: 'ok', doc }), { status: 200, headers: { 'content-type': 'application/json' } });

function montar({ supabase = () => ok(), diaria = DIARIA, inicio = GENERADO + 3 * MIN } = {}) {
  const llamadas = [];
  let t = inicio;
  const servidor = crearAccesoServidor({ ahora: () => t, fetchImpl: async (url, init) => {
    llamadas.push({ url: String(url), init });
    if (String(url) !== RPC) throw new Error('petición inesperada: ' + url);
    return supabase(init);
  } });
  const pedir = (ruta = '/api/tokenizacion/directo', init = {}) => servidor.atender({ request: new Request(ORIGEN + ruta, init), env: ENV,
    activo: async () => (diaria === null ? new Response('No', { status: 404 }) : new Response(diaria)), waitUntil: () => {}, next: () => new Response('archivo') });
  return { pedir, llamadas, avanzar: ms => { t += ms; } };
}

test('200: el directo en el formato de la fina publicada (validado), sin cookies ni sesión de nadie, con su max-age', async () => {
  const m = montar();
  const r = await m.pedir('/api/tokenizacion/directo', { headers: { cookie: '__Host-rwadar-acceso=a.b.c', authorization: 'Bearer x.y.z' } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.deepEqual(modelo.validarDirecto(d).fina, modelo.validarSerieFina(FINA));
  // Hasta el siguiente dato: generado + 6,5 min, desde «ahora» (generado + 3 min) = 210 s.
  assert.equal(r.headers.get('cache-control'), 'public, max-age=210');
  assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(r.headers.get('vary'), null);
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
  const [{ init }] = m.llamadas;
  assert.equal(init.method, 'POST');
  assert.equal(init.body, '{}');
  assert.equal(init.redirect, 'manual');
  assert.equal(init.headers.apikey, 'sb_publishable_prueba');
  assert.equal(init.headers.Authorization, undefined, 'nunca la sesión del visitante');
  assert.equal(init.headers.cookie, undefined);
});

test('solo GET y sin parámetros (nadie se salta la memoria)', async () => {
  const m = montar();
  assert.equal((await m.pedir('/api/tokenizacion/directo', { method: 'POST', body: '{}', headers: { origin: ORIGEN, 'content-type': 'application/json' } })).status, 405);
  assert.equal((await m.pedir('/api/tokenizacion/directo?x=1')).status, 400);
  assert.equal(m.llamadas.length, 0);
});

test('memoria: diez peticiones a la vez, una lectura; hasta el siguiente dato no vuelve a leer', async () => {
  const m = montar();
  const rs = await Promise.all(Array.from({ length: 10 }, () => m.pedir()));
  assert.ok(rs.every(r => r.status === 200));
  assert.equal(m.llamadas.length, 1);
  m.avanzar(3 * MIN);
  await m.pedir();
  assert.equal(m.llamadas.length, 1, 'a los 6 min del dato, aún de memoria');
  m.avanzar(31000);
  await m.pedir();
  assert.equal(m.llamadas.length, 2, 'pasado generado + 6,5 min, vuelve a leer');
});

test('apagado (o sin la 35): 404 directo_apagado, recordado 5 minutos', async () => {
  for (const supabase of [() => new Response(JSON.stringify({ estado: 'apagado' }), { status: 200 }), () => new Response('{"code":"PGRST202"}', { status: 404 })]) {
    const m = montar({ supabase });
    const r = await m.pedir();
    assert.equal(r.status, 404);
    assert.deepEqual(await r.json(), { error: 'directo_apagado' });
    assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
    m.avanzar(4 * MIN);
    await m.pedir();
    assert.equal(m.llamadas.length, 1);
    m.avanzar(61000);
    await m.pedir();
    assert.equal(m.llamadas.length, 2);
  }
});

test('503 con su código: sin datos, roto, de otra lista, viejo, del futuro, la diaria sin leer en 45 min, más de 64 kB', async () => {
  const casos = [
    ['directo_sin_datos', { supabase: () => new Response('{"estado":"sin_datos"}') }],
    ['directo_no_valido', { supabase: () => ok({ ...DOC, v: 2 }) }],
    ['directo_no_valido', { supabase: () => new Response('[1,2]') }],
    ['directo_no_casa', { supabase: () => ok({ ...DOC, tokens: [...DOC.tokens.slice(0, 29), 'otro-token'] }) }],
    ['directo_no_casa', { diaria: null }],
    ['directo_atrasado', { inicio: GENERADO + 21 * MIN }],
    ['directo_atrasado', { inicio: GENERADO - 6 * MIN }],
    ['directo_atrasado', { supabase: () => ok({ ...DOC, diariaLeida: '2026-11-13T14:20:00Z' }) }],
    ['directo_atrasado', { supabase: () => ok({ ...DOC, diariaLeida: null }) }],
    // Un documento bueno, pero con más de 64 kB en la respuesta: no se lee entero.
    ['directo_no_responde', { supabase: () => new Response(JSON.stringify({ estado: 'ok', doc: DOC, relleno: 'x'.repeat(70 * 1024) })) }],
    ['directo_no_responde', { supabase: () => new Response('error', { status: 500 }) }],
    ['directo_no_responde', { supabase: () => { throw new Error('sin red'); } }],
  ];
  for (const [codigo, opciones] of casos) {
    const m = montar(opciones);
    const r = await m.pedir();
    assert.equal(r.status, 503, codigo);
    assert.deepEqual(await r.json(), { error: codigo }, JSON.stringify(Object.keys(opciones)));
    assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
  }
  // 20 minutos justos todavía vale.
  assert.equal((await montar({ inicio: GENERADO + 20 * MIN }).pedir()).status, 200);
});

test('Supabase cae con uno guardado de 10 minutos: sirve ese; sin nada, 503 y no vuelve a preguntar en 60 s', async () => {
  let cae = false;
  const m = montar({ supabase: () => { if (cae) throw new Error('caído'); return ok(); } });
  assert.equal((await m.pedir()).status, 200);
  cae = true;
  m.avanzar(7 * MIN);
  const r = await m.pedir();
  assert.equal(r.status, 200, 'el guardado (10 minutos del dato)');
  assert.equal(m.llamadas.length, 2);
  m.avanzar(30000);
  assert.equal((await m.pedir()).status, 200);
  assert.equal(m.llamadas.length, 2, 'no vuelve a preguntar en 60 s');
  m.avanzar(11 * MIN);
  assert.equal((await m.pedir()).status, 503, 'el guardado ya tiene más de 20 minutos');
  const vacio = montar({ supabase: () => { throw new Error('caído'); } });
  assert.equal((await vacio.pedir()).status, 503);
  vacio.avanzar(59000);
  await vacio.pedir();
  assert.equal(vacio.llamadas.length, 1);
  vacio.avanzar(2000);
  await vacio.pedir();
  assert.equal(vacio.llamadas.length, 2);
});

test('una racha de 429 en la base (documento de 7 a 20 minutos): se guarda al menos 60 s, no 15', async () => {
  const m = montar({ inicio: GENERADO + 8 * MIN });
  const r = await m.pedir();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('cache-control'), 'public, max-age=60');
  m.avanzar(50000);
  await m.pedir();
  assert.equal(m.llamadas.length, 1);
});

test('el _worker.js compilado lleva la ruta y el resto de /api/ sigue cerrado', async () => {
  const require2 = createRequire(import.meta.url);
  const { construirWorker } = require2('./compilar.cjs');
  const codigo = construirWorker();
  assert.match(codigo, /if \(path === '\/api\/tokenizacion\/directo'\)/);
  assert.match(codigo, /crearTokenizacionDirectoServidor\(\{ api, ahora, respuesta, leerTexto \}\)/);
  const m = montar();
  assert.equal((await m.pedir('/api/tokenizacion/directo/otra')).status, 404);
});
