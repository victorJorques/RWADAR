/* =====================================================================
   RWAdar · la regla del gráfico en directo (migración 35) = la de hoy
   ---------------------------------------------------------------------
   rwadar_mercado.serie() (SQL, en PGlite) frente a construirSerieFina
   (rwadar-movil/lib/tokenizacion.js) con las mismas entradas:
   1 · datos reales (un trozo de la ejecución grabada del 13/11:
       tokenizacion/prueba-directo-20261113.json), con sus decimales;
   2 · casos al azar con semilla fija (huecos, tokens nuevos, fuera, todos
       fuera, menos de 2 puntos, decimales): 45 en la CI; con
       MERCADO_DIRECTO_CASOS=300, los 300 de antes de encender;
   3 · casos límite fijos (hueco de 288/289 y 72/73 cubos, 0,99 % y 1,01 %
       fuera, «largo» de 60 y 65 minutos, redondeo de .5, orden de la suma);
   4 · los huecos del propio directo (revisión del 14/11/2026): un corte de
       2 h, 25 h o 73 h sin lecturas no deja a nadie fuera ni en «largos»
       (la regla de hoy sí lo haría) y va en «sinLectura»; un hueco de
       CoinGecko con lecturas buenas sí cuenta, como hoy.
       node probar-mercado-directo-regla.mjs
   ===================================================================== */
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import { baseDirecto, leer, filas, valor } from './mercado-directo-soporte.mjs';
import { informe } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const R = modelo.RESOLUCIONES;
const t0 = performance.now();

const db = await baseDirecto({ hostil: false });

/* Carga unas entradas de construirSerieFina en la base, como las guardaría
   el directo (un dato por token y cubo: el último; en empate de hora, el
   que va después), y pide la serie. sembrado: hasta dónde cubre la
   «siembra» (por defecto, todo: entonces la regla es la de hoy).
   lecturas: cubos de 5 minutos con lectura buena. */
async function serieSQL(entradas, clave, { sembrado = '2100-01-01T00:00:00Z', lecturas = [] } = {}) {
  const r = R[clave], tabla = clave === '5m' ? 'obs_5m' : 'obs_1h', otra = clave === '5m' ? 'obs_1h' : 'obs_5m';
  await db.exec('truncate rwadar_mercado.obs_5m, rwadar_mercado.obs_1h, rwadar_mercado.lecturas; delete from rwadar_mercado.tokens;');
  const filasObs = [], filasOtra = [];
  for (const e of entradas) {
    const id = await valor(db, 'insert into rwadar_mercado.tokens (cg_id, primera) values ($1, $2) returning id', [e.id, e.primera || null]);
    if (e.obs === null) { filasOtra.push(`(${id},${Math.floor(Date.UTC(2026, 10, 13) / 1000 / (clave === '5m' ? 3600 : 300))},to_timestamp(${Date.UTC(2026, 10, 13) / 1000}),${e.valor})`); continue; }
    const cubos = new Map();
    for (const [ms, v] of e.obs) cubos.set(Math.floor(ms / r.pasoMs), [ms, v]);
    for (const [c, [ms, v]] of cubos) filasObs.push(`(${id},${c},to_timestamp(${ms / 1000}),${v})`);
  }
  for (let k = 0; k < filasObs.length; k += 2000) await db.exec(`insert into rwadar_mercado.${tabla} (token, cubo, t, valor) values ${filasObs.slice(k, k + 2000).join(',')}`);
  if (filasOtra.length) await db.exec(`insert into rwadar_mercado.${otra} (token, cubo, t, valor) values ${filasOtra.join(',')}`);
  if (lecturas.length) await db.exec(`insert into rwadar_mercado.lecturas (cubo, leida_el) values ${lecturas.map(c => `(${c},to_timestamp(${c * 300}))`).join(',')}`);
  await db.query('update rwadar_mercado.configuracion set tokens = $1, sembrado_hasta = $2', [entradas.map(e => e.id), sembrado]);
  return (await db.query('select rwadar_mercado.serie($1) s', [clave])).rows[0].s;
}
/* De la serie compacta a { puntos, fuera, valorFuera, largos, arrastre } (lo que devuelve construirSerieFina). */
function expandir(x, clave) {
  if (!x) return null;
  const r = R[clave], desde = modelo.msMinuto(x.desde), puntos = [];
  let k = 0;
  for (const [veces, n] of x.n) for (let j = 0; j < veces; j++, k++) puntos.push([modelo.isoMinuto(desde + k * r.pasoMs), x.valores[k], n]);
  return { puntos, fuera: x.fuera, valorFuera: x.valorFuera, largos: x.largos, arrastre: x.arrastre };
}
async function comparar(entradas, clave, opciones) {
  let js = null;
  try { js = modelo.construirSerieFina(entradas, clave); } catch { js = null; }
  const sql = await serieSQL(entradas, clave, opciones);
  return { js, sql, igual: js ? isDeepStrictEqual(expandir(sql, clave), js) : sql === null };
}

/* 1 · Datos reales (con decimales) */
const PRUEBA = JSON.parse(leer('tokenizacion/prueba-directo-20261113.json'));
const deArchivo = s => ({ id: s.id, primera: s.primera, obs: s.v.map((v, i) => [s.t0 + s.dt.slice(0, i).reduce((a, b) => a + b, 0), v]) });
for (const clave of ['5m', '1h']) {
  const entradas = PRUEBA.series[clave].map(deArchivo);
  const t = performance.now();
  const c = await comparar(entradas, clave);
  paso(`datos reales del 13/11, ${clave}: SQL idéntico a construirSerieFina (${c.js?.puntos.length} puntos, largos ${c.js?.largos.join(', ')}; ${Math.round(performance.now() - t)} ms)`,
    c.igual && c.js && c.js.largos.includes('figure-heloc') && c.js.puntos.length === (clave === '5m' ? 289 : 721)
    && entradas.some(e => e.obs.some(([, v]) => !Number.isInteger(v))));
  if (!c.igual) console.log(clave, JSON.stringify(c.js).slice(0, 300), '\nSQL', JSON.stringify(expandir(c.sql, clave)).slice(0, 300));
}

// En local, antes de encender: la ejecución grabada entera (30 tokens), con
// MERCADO_DIRECTO_REAL=ruta a un JSON { capturas: [{ clave, entradas, salida }] }.
if (process.env.MERCADO_DIRECTO_REAL) {
  const { capturas } = JSON.parse((await import('node:fs')).readFileSync(process.env.MERCADO_DIRECTO_REAL, 'utf8'));
  for (const cap of capturas) {
    const c = await comparar(cap.entradas, cap.clave);
    paso(`ejecución grabada entera, ${cap.clave} (${cap.entradas.length} tokens): SQL idéntico (${c.js?.puntos.length} puntos, largos ${c.js?.largos.join(', ')})`,
      c.igual && isDeepStrictEqual(c.js, cap.salida));
  }
}

/* 2 · Casos al azar con semilla fija */
let semilla = 20261114;
const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
const CASOS = Number(process.env.MERCADO_DIRECTO_CASOS || 45);
let iguales = 0, distintos = 0;
const cuenta = { fuera: 0, largos: 0, nuevos: 0, sinLectura: 0, rechazadas: 0, decimales: 0 };
for (let n = 0; n < CASOS; n++) {
  const clave = azar() < 0.5 ? '5m' : '1h', r = R[clave];
  const fin = Date.UTC(2026, 10, 13, 21, 0) + Math.floor(azar() * 3600) * 1000;
  const k = 1 + Math.floor(azar() * 10), entradas = [];
  for (let i = 0; i < k; i++) {
    const id = 'tok-' + i;
    if (azar() < 0.05) { entradas.push({ id, obs: null, valor: 1e6 + azar() * 1e7 }); continue; }
    const base = (azar() < 0.2 ? 1e10 : 1e7) * (1 + azar());
    const inicio = fin - r.ventanaMs - r.arrastre * r.pasoMs * (azar() < 0.8 ? 1 : 0.3);
    const obs = [];
    let t = inicio + azar() * r.pasoMs, v = base;
    const hueco = azar() < 0.4 ? [fin - azar() * r.ventanaMs, r.pasoMs * (1 + azar() * r.arrastre * 1.4)] : null;
    while (t <= fin) {
      if (!(hueco && t > hueco[0] && t < hueco[0] + hueco[1])) { v *= 1 + (azar() - 0.5) * 0.004; obs.push([Math.floor(t), azar() < 0.3 ? Math.round(v) : v]); }
      t += r.pasoMs * (azar() < 0.1 ? 0.37 : 1) * (0.5 + azar());
    }
    if (!obs.length) obs.push([fin, base]);
    const primera = azar() < 0.15 ? new Date(fin - azar() * r.ventanaMs).toISOString().slice(0, 10) : '2025-11-14';
    entradas.push({ id, obs, primera });
  }
  const c = await comparar(entradas, clave);
  c.igual ? iguales++ : distintos++;
  if (!c.igual && distintos < 3) console.log('DISTINTO', n, clave, JSON.stringify(c.js).slice(0, 200), '\n SQL', JSON.stringify(expandir(c.sql, clave)).slice(0, 200));
  if (c.js?.fuera.length) cuenta.fuera++;
  if (c.js?.largos.length) cuenta.largos++;
  if (entradas.some(e => e.primera && e.primera !== '2025-11-14')) cuenta.nuevos++;
  if (entradas.some(e => e.obs === null)) cuenta.sinLectura++;
  if (!c.js) cuenta.rechazadas++;
  if (entradas.some(e => e.obs?.some(([, x]) => !Number.isInteger(x)))) cuenta.decimales++;
}
paso(`${CASOS} casos al azar (semilla fija): ${iguales} idénticos o rechazados por los dos, ${distintos} distintos (${JSON.stringify(cuenta)})`,
  distintos === 0 && iguales === CASOS && cuenta.fuera > 0 && cuenta.largos > 0 && cuenta.nuevos > 0 && cuenta.rechazadas > 0 && cuenta.decimales > 0);

/* 3 · Casos límite fijos */
const FIN5 = Date.UTC(2026, 10, 13, 22, 0), FIN1 = Date.UTC(2026, 10, 13, 22, 0);
// Un token con datos cada paso desde mucho antes, salvo un hueco de «cubos» cubos que acaba justo al final.
const continuo = (id, clave, valorBase, { hueco = 0, desdeFin = 0, fin = clave === '5m' ? FIN5 : FIN1 } = {}) => {
  const r = R[clave], obs = [];
  for (let ms = fin - r.ventanaMs - r.arrastre * r.pasoMs; ms <= fin; ms += r.pasoMs) {
    const atras = (fin - ms) / r.pasoMs;
    if (hueco && atras >= desdeFin && atras < desdeFin + hueco && ms !== fin) continue;
    obs.push([ms + 7000, valorBase + (fin - ms) / 1e6]);
  }
  return { id, obs, primera: '2025-11-14' };
};
const limite = [
  ['5m: hueco de 288 cubos (24 h justas) → dentro y en «largos»', '5m', [continuo('a', '5m', 5e9), continuo('b', '5m', 1e7, { hueco: 288, desdeFin: 1 })],
    js => js && js.fuera.length === 0 && js.largos.includes('b')],
  ['5m: hueco de 289 cubos → fuera', '5m', [continuo('a', '5m', 5e9), continuo('b', '5m', 1e7, { hueco: 289, desdeFin: 1 })],
    js => js && js.fuera.includes('b')],
  ['1h: hueco de 72 cubos → dentro', '1h', [continuo('a', '1h', 5e9), continuo('b', '1h', 1e7, { hueco: 72, desdeFin: 1 })],
    js => js && js.fuera.length === 0 && js.largos.includes('b')],
  ['1h: hueco de 73 cubos → fuera', '1h', [continuo('a', '1h', 5e9), continuo('b', '1h', 1e7, { hueco: 73, desdeFin: 1 })],
    js => js && js.fuera.includes('b')],
  ['fuera que pesa el 0,99 % → sale', '5m', [continuo('a', '5m', 1e9), { id: 'b', obs: null, valor: 1e9 * 0.99 / 99.01 }],
    js => js && js.fuera.includes('b')],
  ['fuera que pesa el 1,01 % → no sale (los dos)', '5m', [continuo('a', '5m', 1e9), { id: 'b', obs: null, valor: 1e9 * 1.01 / 98.99 }],
    js => js === null],
  ['«largo» de 60 minutos (12 cubos) → no; de 65 (13) → sí', '5m', [continuo('a', '5m', 5e9), continuo('b', '5m', 1e7, { hueco: 12, desdeFin: 10 }), continuo('c', '5m', 1e7, { hueco: 13, desdeFin: 10 })],
    js => js && !js.largos.includes('b') && js.largos.includes('c')],
  ['suma con .5 exacto: se redondea hacia arriba (Math.round), no al par', '5m',
    [{ id: 'a', obs: [[FIN5 - 3600000, 1.25], [FIN5, 1.25]], primera: '2026-11-13' }, { id: 'b', obs: [[FIN5 - 3600000, 1.25], [FIN5, 1.25]], primera: '2026-11-13' }],
    js => js && js.puntos.at(-1)[1] === 3],
  // 0,0039 + 0,0039 + (7e13 + 0,4921875) da 7e13 + 1 en este orden y 7e13 en el contrario.
  ['el orden de la suma es el de la diaria (decimales que no conmutan)', '5m',
    ['a', 'b'].map(id => ({ id, obs: [[FIN5 - 600000, 0.0039], [FIN5, 0.0039]], primera: '2026-11-13' }))
      .concat([{ id: 'c', obs: [[FIN5 - 600000, 7e13 + 0.4921875], [FIN5, 7e13 + 0.4921875]], primera: '2026-11-13' }]),
    js => js && js.puntos.at(-1)[1] === 7e13 + 1 && Math.round(7e13 + 0.4921875 + 0.0039 + 0.0039) === 7e13],
];
for (const [texto, clave, entradas, espera] of limite) {
  const c = await comparar(entradas, clave);
  paso(`${texto}: SQL = JS`, c.igual && espera(c.js));
  if (process.env.DEPURAR && !(c.igual && espera(c.js))) console.log(texto, c.igual, JSON.stringify(c.js && { ...c.js, puntos: c.js.puntos.slice(-3) }), JSON.stringify(c.sql && { ...c.sql, valores: c.sql.valores.slice(-3) }));
}

/* 4 · Huecos del propio directo */
// Tres tokens con dato cada 5 minutos hasta T0 (la siembra) y, tras un corte
// de «horas» sin lecturas, lecturas buenas cada 5 minutos hasta el final.
async function corte(clave, horas, { congelado = null } = {}) {
  const r = R[clave], fin = Date.UTC(2026, 11, 20, 12, 0), corteFin = fin - 2 * 3600000, corteIni = corteFin - horas * 3600000;
  const lecturas = [];
  for (let ms = corteFin; ms <= fin; ms += 300000) lecturas.push(ms / 300000);
  const entradas = ['g', 'h', 'i'].map((id, k) => {
    const obs = [];
    for (let ms = fin - 34 * 86400000; ms <= fin; ms += 300000) {
      if (ms > corteIni && ms < corteFin) continue;          // sin lecturas: no hay datos nuevos
      if (id === congelado && ms > fin - 90 * 60000) continue; // CoinGecko sin dato de este token con lecturas buenas
      if (clave === '1h' && (ms % 3600000) !== 3300000 && ms !== fin) continue;
      obs.push([ms + 50000, (k + 1) * 1e9 * (1 + ms / 1e15)]);
    }
    return { id, obs, primera: '2025-11-14' };
  });
  const js = modelo.construirSerieFina.length && (() => { try { return modelo.construirSerieFina(entradas, clave); } catch { return null; } })();
  const sql = await serieSQL(entradas, clave, { sembrado: new Date(corteIni).toISOString(), lecturas });
  return { js, sql, corteIni, corteFin };
}
for (const [clave, horas] of [['5m', 2], ['5m', 25], ['1h', 2], ['1h', 25], ['1h', 73]]) {
  const c = await corte(clave, horas);
  const tramos = c.sql?.sinLectura || [];
  paso(`corte del directo de ${horas} h (${clave}): nadie fuera ni en «largos» y el corte va en sinLectura${c.js && !c.js.largos.length && !c.js.fuera.length ? '' : ` (la regla de hoy los habría marcado: fuera ${c.js?.fuera.length ?? 'todos'}, largos ${c.js?.largos.length ?? '—'})`}`,
    !!c.sql && c.sql.fuera.length === 0 && c.sql.largos.length === 0 && tramos.length === 1
    && modelo.msMinuto(tramos[0][0]) <= Math.max(c.corteIni + R[clave].pasoMs, modelo.msMinuto(c.sql.desde))
    && modelo.msMinuto(tramos[0][1]) >= c.corteFin - 2 * R[clave].pasoMs
    && (!c.js || c.js.largos.length > 0 || c.js.fuera.length > 0));
}
{
  const c = await corte('5m', 2, { congelado: 'h' });
  paso('con lecturas buenas, un token sin dato de CoinGecko durante 90 minutos sigue yendo a «largos» (como hoy)',
    !!c.sql && c.sql.largos.includes('h') && !c.sql.largos.includes('g'));
}
// Sin siembra ni lecturas en un trozo del principio: tampoco cuenta ahí.
{
  const entradas = [continuo('a', '5m', 5e9), continuo('b', '5m', 1e7, { hueco: 40, desdeFin: 200 })];
  const todos = [];
  for (let ms = FIN5 - 86400000; ms <= FIN5; ms += 300000) { const atras = (FIN5 - ms) / 300000; if (!(atras >= 200 && atras < 240)) todos.push(ms / 300000); }
  const sql = await serieSQL(entradas, '5m', { sembrado: '2000-01-01T00:00:00Z', lecturas: todos });
  paso('un hueco que coincide con un rato sin lecturas no cuenta como «largo»; con lecturas, sí (la regla de hoy lo pone en «largos»)',
    !!sql && !sql.largos.includes('b') && sql.sinLectura.length === 1 && modelo.construirSerieFina(entradas, '5m').largos.includes('b'));
}
// La serie que no sale (todos fuera) devuelve null, no un error.
paso('serie() de una lista vacía o de una resolución que no existe: null o error claro',
  (await serieSQL([], '5m').catch(() => 'x')) === null
  && /resolucion_no_valida/.test(await db.query("select rwadar_mercado.serie('2h')").then(() => '', e => e.message)));

const segundos = (performance.now() - t0) / 1000;
paso(`dura menos de 25 s en esta máquina (${segundos.toFixed(1)} s; tope por archivo de la CI)`, segundos < 25 || CASOS > 45);
await db.close();
informe('Gráfico en directo: la regla de la suma en SQL (migración 35)', ok, fail);
