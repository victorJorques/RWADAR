/* =====================================================================
   RWAdar · el gráfico en directo en la base (migraciones 35, 37 y 39)
   ---------------------------------------------------------------------
   PGlite con dobles de pg_net, pg_cron y Vault (mercado-directo-soporte.mjs)
   y la 35, la 37 y la 39 aplicadas con privilegios por defecto hostiles,
   como en producción. Sin red.
   - La 39 (21/11): con la 35 sola, 40 fallos seguidos (o 40 429 seguidos)
     dan «interval out of range», como del 18 al 20/11; con la 39, la espera
     es de 60 minutos con 36, 40 y 576 fallos seguidos y con 40 429
     seguidos, y la siguiente respuesta buena pone los fallos a 0. Solo
     cambian los exponentes; su verificador falla sin ella y pasa con ella.
   - pedir(): apagado no pide; encendido, UNA llamada exacta por ranura de
     5 minutos y nunca dos a menos de 240 s; esperas; clave Demo opcional;
     la diaria publicada cada 15 minutos.
   - leer(): 200, 429 (Retry-After y esperas de 10, 20, 40 y 60 min contadas
     desde la petición), otros fallos (15, 30 y 60 min desde el tercero),
     JSON roto, listas cortas, horas del futuro, ids malos, el último dato
     de cada cubo, los 60 mayores y los de la diaria, la lista de la diaria.
   - La cadena con datos reales: siembra + 3 sondeos reales de /coins/markets
     → documento → directoAFina → validarSerieFina (el de hoy, sin cambios).
   - Retención, permisos (anon solo la lectura pública), encender, apagar,
     deshacer, el apagado de los avisos (30), y el verificador, que pasa y
     falla con cada estado roto.
       node probar-mercado-directo-base.mjs
   ===================================================================== */
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import {
  baseDirecto, leer, filas, una, valor, fijarReloj, peticiones, responder, SQL35, RELOJ_PRODUCCION, URL_MERCADOS, URL_DIARIA, HOSTIL,
} from './mercado-directo-soporte.mjs';
import { informe } from './pruebas-soporte.mjs';

const require = createRequire(import.meta.url);
const modelo = require('../rwadar-movil/lib/tokenizacion.js');
const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
// Si falla un script con su propio begin, la transacción queda abortada: se deshace.
let db;
const error = async (fn) => { try { await fn(); return ''; } catch (e) { await db?.exec('rollback').catch(() => {}); return e.message; } };
const t0 = performance.now();
const MIN = 60000;
const sinComentarios = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

/* ---------- 1 · Revisión estática ---------- */
const VERIFICAR = leer('db/35_mercado_directo_verificar.sql');
const ENCENDER = leer('db/35_mercado_directo_encender.sql');
const APAGAR = leer('db/35_mercado_directo_apagar.sql');
const DESHACER = leer('db/35_mercado_directo_deshacer.sql');
const ESTADO = leer('db/35_mercado_directo_estado.sql');
const APAGAR30 = leer('db/30_avisos_registrados_apagar.sql');
const SQL37 = leer('db/37_mercado_directo_secuencia.sql');
const SQL39 = leer('db/39_mercado_directo_espera.sql');
const VERIFICAR39 = leer('db/39_mercado_directo_espera_verificar.sql');
{
  const lineas = (t) => t.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la migración versionada 20261114090000 es una copia idéntica de db/35', leer('supabase/migrations/20261114090000_mercado_directo.sql') === SQL35);
  paso('la 35 empieza en «begin;» y acaba en su único «commit;»; el verificador y el estado son de solo lectura y acaban en «rollback;»',
    primera(SQL35) === 'begin;' && (SQL35.match(/^commit;$/gm) || []).length === 1 && lineas(SQL35).at(-1) === 'commit;'
    && [VERIFICAR, ESTADO].every((v) => primera(v) === 'begin transaction read only;' && lineas(v).at(-1) === 'rollback;'
      && (v.match(/^begin transaction read only;$/gm) || []).length === 1 && !/^commit;$/m.test(v)));
  paso('el reloj de la 35 es now() (las pruebas lo cambian; producción no)', SQL35.includes(RELOJ_PRODUCCION));
  paso('la dirección de CoinGecko de la 35 es exactamente la del flujo diario (modelo.SERIE.apiMercados) y la de la diaria, la publicada',
    URL_MERCADOS === modelo.SERIE.apiMercados && sinComentarios(SQL35).includes(`'${URL_MERCADOS}'`) && sinComentarios(SQL35).includes(`'${URL_DIARIA}'`));
  const codigo = sinComentarios(SQL35);
  paso('la 35 no toca nada de las migraciones 01-34 (ni rwadar_novedades, ni tablas de public) ni crea relojes',
    !/rwadar_novedades|rwadar_catalogo|public\.(?!tokenizacion_directo\(\))/.test(codigo) && !/(select|perform) cron\.schedule\(/.test(codigo));
  paso('la 35 solo da permiso a anon y authenticated para public.tokenizacion_directo()',
    (codigo.match(/\bgrant\b[^;]*;/gi) || []).join('|') === 'grant execute on function public.tokenizacion_directo() to anon, authenticated;');
  // La 39: copia idéntica, una sola transacción, verificador de solo lectura y solo cambian los exponentes.
  paso('la migración versionada 20261121120000 es una copia idéntica de db/39', leer('supabase/migrations/20261121120000_mercado_directo_espera.sql') === SQL39);
  paso('la 39 empieza en «begin;» y acaba en su único «commit;»; su verificador es de solo lectura y acaba en «rollback;»',
    primera(SQL39) === 'begin;' && (SQL39.match(/^commit;$/gm) || []).length === 1 && lineas(SQL39).at(-1) === 'commit;'
    && primera(VERIFICAR39) === 'begin transaction read only;' && lineas(VERIFICAR39).at(-1) === 'rollback;'
    && (VERIFICAR39.match(/^begin transaction read only;$/gm) || []).length === 1 && !/^commit;$/m.test(VERIFICAR39));
  const funcion = (sql, nombre) => (sql.match(new RegExp(`create or replace function rwadar_mercado\\.${nombre}\\([\\s\\S]*?\\n\\$funcion\\$;`, 'g')) || []);
  const codigo39 = sinComentarios(SQL39);
  const comoLa35 = (f) => f.split('\n').filter((l) => !/^\s*-- RWAdar 39:/.test(l)).join('\n')
    .replaceAll('power(2, least(fallos_seguidos + 1 - 3, 2))', 'power(2, fallos_seguidos + 1 - 3)').replaceAll('power(2, least(c.seguidos_429, 4))', 'power(2, c.seguidos_429)');
  paso('la 39 solo redefine pedir_coingecko y leer_respuesta, y son las de la 35 salvo los tres exponentes (con least dentro)',
    (codigo39.match(/create or replace function [\w.]+/g) || []).join('|') === 'create or replace function rwadar_mercado.pedir_coingecko|create or replace function rwadar_mercado.leer_respuesta'
    && ['pedir_coingecko', 'leer_respuesta'].every((n) => funcion(SQL39, n).length === 1 && funcion(SQL35, n).length === 1 && comoLa35(funcion(SQL39, n)[0]) === funcion(SQL35, n)[0])
    && (codigo39.match(/power\(2, least\(/g) || []).length === 3 && (codigo39.match(/power\s*\(/g) || []).length === 3);
  paso('la 39 no da permisos a nadie ni crea relojes', !/\bgrant\b/i.test(codigo39) && !/cron\.schedule\(/.test(codigo39));
}

/* ---------- 2 · Datos de prueba ---------- */
db = await baseDirecto();
/* La 35 sola: 40 fallos seguidos (o 40 429 seguidos) desbordan la espera,
   como del 18 al 20/11. Después, la 37 y la 39 con privilegios hostiles. */
{
  const verificar39 = await error(() => db.exec(VERIFICAR39));
  paso(`con la 35 sola, el verificador de la 39 falla (${verificar39.slice(0, 80)})`, /sigue con la espera de la 35/.test(verificar39));
  await fijarReloj(db, '2026-11-14T09:08:00Z');
  await db.exec(`update rwadar_mercado.configuracion set encendido = true, peticion_id = 987654, pedido_el = '2026-11-14T09:03:00Z',
    ultimo_pedido_el = '2026-11-14T09:03:00Z', fallos_seguidos = 40, diaria_leida_el = '2026-11-14T09:03:00Z'`);
  const pedir35 = await error(() => db.query('select rwadar_mercado.pedir()'));
  const fallos35 = (await una(db, 'select fallos_seguidos from rwadar_mercado.configuracion')).fallos_seguidos;
  await db.exec("update rwadar_mercado.configuracion set peticion_id = 987655, pedido_el = '2026-11-14T09:07:30Z', fallos_seguidos = 0, seguidos_429 = 40");
  await responder(db, 987655, { status: 429, contenido: '{}' });
  const leer35 = await valor(db, 'select rwadar_mercado.leer()');
  const seguidos35 = (await una(db, 'select seguidos_429 from rwadar_mercado.configuracion')).seguidos_429;
  paso(`con la 35 sola, 40 fallos seguidos: pedir() falla con «interval out of range» y no apunta el fallo (${pedir35.slice(0, 40)}); con 40 429 seguidos, leer() tampoco (${JSON.stringify(leer35)})`,
    /interval out of range/.test(pedir35) && fallos35 === 40 && leer35.fallo_coingecko === '22008' && seguidos35 === 40);
  await db.exec(`delete from net._http_response; update rwadar_mercado.configuracion set encendido = false, peticion_id = null, pedido_el = null,
    ultimo_pedido_el = null, fallos_seguidos = 0, seguidos_429 = 0, diaria_leida_el = null, reintentar_desde = null`);
  await db.exec(HOSTIL);
  await db.exec(SQL37);
  await db.exec(SQL39);
  await db.exec(SQL39);
  await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from '));
  const verificado = await error(() => db.exec(VERIFICAR39));
  paso(`la 37 y la 39 se aplican sobre la 35 (la 39, dos veces) y el verificador de la 39 pasa${verificado ? ' — ' + verificado : ''}`, verificado === '');
}
const TOKENS = Array.from({ length: 30 }, (_, i) => `tok-${i + 1}`);
const diariaJSON = (tokens = TOKENS, generado = '2026-11-14T06:30:00Z', cambios = {}) => JSON.stringify({ version: 1, fuente: 'CoinGecko', categoria: 'tokenized-products',
  generado, pedidos: 40, incluidos: tokens.length, discontinuos: 0, cobertura: 90, tokens, puntos: [], ...cambios });
// Una respuesta de /coins/markets: n tokens (tok-1 el mayor), con su hora 70 s antes de «ms».
const mercados = (ms, { n = 250, factor = 1, quitar = [], cambiar = {} } = {}) => JSON.stringify(Array.from({ length: n }, (_, i) => ({
  id: `tok-${i + 1}`, symbol: 'x', market_cap: Math.round((1e10 / (i + 1)) * factor) + 0.25, last_updated: new Date(ms - 70000).toISOString(), ...(cambiar[`tok-${i + 1}`] || {}),
})).filter((t) => !quitar.includes(t.id)));
let ultimaPeticion = 0;
const nuevas = async () => { const p = await peticiones(db, ultimaPeticion); if (p.length) ultimaPeticion = Number(p.at(-1).id); return p; };
const cfg = () => una(db, 'select * from rwadar_mercado.configuracion');
const pedir = () => valor(db, 'select rwadar_mercado.pedir()');
const leerBase = () => valor(db, 'select rwadar_mercado.leer()');
/* Un ciclo: pide en ms (minuto 3 de la ranura), responde lo que diga «coingecko»
   (y la diaria, si la pide) y lee un minuto después. */
async function ciclo(ms, coingecko = (m) => ({ contenido: mercados(m) }), diaria = () => ({ contenido: diariaJSON() })) {
  await fijarReloj(db, ms);
  const r = await pedir();
  const p = await nuevas();
  for (const x of p) {
    if (x.url === URL_DIARIA) await responder(db, x.id, { status: 200, ...diaria(ms) });
    else if (x.url === URL_MERCADOS) { const c = coingecko(ms); if (c) await responder(db, x.id, { status: 200, creado: ms + 1000, ...c }); }
  }
  await fijarReloj(db, ms + MIN);
  const l = await leerBase();
  return { pedir: r, peticiones: p, leer: l };
}
const H = (iso) => Date.parse(iso);

/* ---------- 3 · pedir() ---------- */
const T = H('2026-11-14T10:03:00Z');
await fijarReloj(db, T);
paso('apagado, pedir() no pide nada', (await pedir()) === 'apagado' && (await nuevas()).length === 0);
await db.exec('update rwadar_mercado.configuracion set encendido = true');
{
  const r = await pedir();
  const p = await nuevas();
  const cg = p.find((x) => x.url === URL_MERCADOS), di = p.find((x) => x.url === URL_DIARIA);
  paso('encendido: UNA petición a CoinGecko con la dirección exacta, 20 s y el agente fijo, sin clave; y una a la diaria publicada (10 s)',
    r === 'pedido' && p.length === 2 && cg && cg.timeout_milliseconds === 20000 && cg.method === 'GET'
    && isDeepStrictEqual(cg.headers, { accept: 'application/json', 'user-agent': 'RWAdar/1.0 (+https://rwadar.pages.dev)' })
    && isDeepStrictEqual(cg.params, {}) && di && di.timeout_milliseconds === 10000);
  await fijarReloj(db, T + 30000);
  paso('con la petición en vuelo, no pide otra', (await pedir()) === 'pronto' && (await nuevas()).length === 0);
  await responder(db, cg.id, { status: 200, contenido: mercados(T), creado: T + 1000 });
  await responder(db, di.id, { status: 200, contenido: diariaJSON() });
  await fijarReloj(db, T + MIN);
  const l = await leerBase();
  paso('leer(): 200 bueno → guarda observaciones (los 60 mayores ∪ los de la diaria), apunta la lectura, hace el documento y pone los fallos a 0',
    l.coingecko === 200 && l.validos === 250 && l.construido === true && (await valor(db, 'select count(distinct token) from rwadar_mercado.obs_5m')) === 60
    && (await valor(db, 'select count(*) from rwadar_mercado.lecturas')) === 1 && (await cfg()).fallos_seguidos === 0
    && isDeepStrictEqual((await cfg()).tokens, TOKENS) && (await valor(db, 'select count(*) from rwadar_mercado.directo')) === 1
    // La hora del documento es la de la respuesta de CoinGecko (10:03:01), no la de la lectura (10:04).
    && (await valor(db, "select doc->>'generado' from rwadar_mercado.directo")) === '2026-11-14T10:03:01Z');
  // Ranuras: un reloj que llega 50 s tarde no pierde su ranura; dos peticiones nunca a menos de 240 s.
  await fijarReloj(db, T + 4 * MIN + 59000);
  paso('a los 4 min 59 s (misma ranura de 5 minutos), ninguna', (await pedir()) === 'pronto' && (await nuevas()).length === 0);
  await fijarReloj(db, T + 5 * MIN + 50000);
  const r2 = await pedir();
  paso('en la ranura siguiente, aunque el reloj llegue 50 s tarde, otra (y la diaria no se repite antes de 15 min)',
    r2 === 'pedido' && (await nuevas()).map((x) => x.url).join() === URL_MERCADOS);
  await fijarReloj(db, T + 10 * MIN + 10000);
  await db.exec("update rwadar_mercado.configuracion set peticion_id = null, ultimo_pedido_el = (select t from public._reloj) - interval '239 seconds'");
  paso('nunca dos a menos de 240 s aunque cambie la ranura', (await pedir()) === 'pronto' && (await nuevas()).length === 0);
  await db.exec("update rwadar_mercado.configuracion set ultimo_pedido_el = (select t from public._reloj) - interval '241 seconds', reintentar_desde = (select t from public._reloj) + interval '1 minute'");
  paso('con una espera en marcha, ninguna', (await pedir()) === 'espera' && (await nuevas()).length === 0);
  await db.exec("update rwadar_mercado.configuracion set reintentar_desde = null; insert into vault.decrypted_secrets values ('RWADAR_COINGECKO_DEMO', 'CG-demo1234567890')");
  await pedir();
  const conClave = (await nuevas()).find((x) => x.url === URL_MERCADOS);
  paso('con la clave Demo en Vault, la manda en x-cg-demo-api-key (solo a CoinGecko)', conClave?.headers['x-cg-demo-api-key'] === 'CG-demo1234567890');
  await db.exec("delete from vault.decrypted_secrets; update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null");
}

/* ---------- 4 · leer(): fallos y esperas ---------- */
// Reinicia el estado del reloj y mide cada cuánto pide con 429 seguidos.
async function intervalos(respuesta, vueltas) {
  await db.exec('update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, seguidos_429 = 0');
  const pedidas = [];
  let ms = H('2026-11-15T00:03:00Z');
  for (let v = 0; v < vueltas * 30 && pedidas.length < vueltas + 1; v++, ms += 5 * MIN) {
    const c = await ciclo(ms, () => respuesta);
    if (c.pedir === 'pedido') pedidas.push(ms);
  }
  return pedidas.slice(1).map((x, i) => (x - pedidas[i]) / MIN);
}
paso('429 seguidos: entre peticiones 5 (el primero solo espera a la ranura siguiente), 10, 20, 40 y 60 minutos (tope), contados desde la petición',
  isDeepStrictEqual(await intervalos({ status: 429, contenido: '{}', headers: { 'Retry-After': '40' } }, 6), [5, 10, 20, 40, 60, 60]));
{
  await db.exec('update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, seguidos_429 = 0');
  const ms = H('2026-11-16T00:03:00Z');
  await ciclo(ms, () => ({ status: 429, contenido: '{}', headers: { 'retry-after': '900' } }));
  const esperas = [];
  for (let k = 1; k <= 4; k++) { const c = await ciclo(ms + k * 5 * MIN); esperas.push(c.pedir); }
  paso('un 429 con Retry-After: 900 espera 15 minutos justos desde la petición (no 20)', isDeepStrictEqual(esperas.slice(0, 3), ['espera', 'espera', 'pedido']));
}
paso('503 seguidos: cada 5 minutos hasta el tercero; después 15, 30 y 60', isDeepStrictEqual(await intervalos({ status: 503, contenido: 'no' }, 6), [5, 5, 15, 30, 60, 60]));
{
  // Una petición que nunca responde se da por perdida (y cuenta como fallo).
  await db.exec('update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, seguidos_429 = 0');
  const ms = H('2026-11-17T00:03:00Z');
  await ciclo(ms, () => null);
  const c = await ciclo(ms + 5 * MIN);
  const reg = await filas(db, "select error from rwadar_mercado.registro where pedido_el = $1", [new Date(ms).toISOString()]);
  paso('una petición sin respuesta en 2 minutos se da por perdida (sin_respuesta) y se pide otra en la ranura siguiente',
    c.pedir === 'pedido' && reg[0]?.error === 'sin_respuesta');
}
// Lo que no se guarda.
let vuelta = 0;
async function noGuarda(contenido, error) {
  // Sin limpiar() de por medio: solo cuenta lo que guarde la lectura.
  await db.exec("update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, limpiado_el = '2100-01-01'");
  const antes = await valor(db, 'select count(*) + coalesce(sum(valor), 0) from rwadar_mercado.obs_5m');
  const lect = await valor(db, 'select count(*) from rwadar_mercado.lecturas');
  vuelta += 1;
  const c = await ciclo(H('2026-11-18T00:03:00Z') + vuelta * 60 * MIN, () => ({ contenido }));
  const despues = await valor(db, 'select count(*) + coalesce(sum(valor), 0) from rwadar_mercado.obs_5m');
  if (process.env.DEPURAR) console.log(error, c.pedir, JSON.stringify(c.leer), antes, despues, (await cfg()).fallos_seguidos);
  return c.leer.error === error && antes === despues && (await valor(db, 'select count(*) from rwadar_mercado.lecturas')) === lect && (await cfg()).fallos_seguidos === 1;
}
paso('JSON roto → nada guardado, ni la lectura (json_roto, cuenta como fallo)', await noGuarda('[{"id": ', 'json_roto'));
paso('más de 4 MB → nada guardado (demasiado_grande)', await noGuarda('[' + ' '.repeat(4 * 1024 * 1024) + ']', 'demasiado_grande'));
paso('lista vacía u objeto → nada (lista_no_valida)', (await noGuarda('[]', 'lista_no_valida')) && (await noGuarda('{"a":1}', 'lista_no_valida')));
paso('24 válidos → nada (lista_corta)', await noGuarda(mercados(H('2026-11-18T00:03:00Z'), { n: 24 }), 'lista_corta'));
{
  // Faltan tokens de la diaria (figure-heloc en su hueco): se guardan los demás.
  await db.exec('update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0');
  const ms = H('2026-11-19T00:03:00Z');
  const c = await ciclo(ms, (m) => ({ contenido: mercados(m, { quitar: ['tok-1'], cambiar: { 'tok-2': { market_cap: null }, 'tok-3': { market_cap: -5 },
    'tok-4': { market_cap: '123' }, 'tok-5': { id: 'TOK-5' }, 'tok-6': { last_updated: '2030-01-01T00:00:00.000Z' }, 'tok-7': { last_updated: 'ayer' } } }) }));
  const ids = (await filas(db, `select tk.cg_id, o.t from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token
    where o.cubo = floor(extract(epoch from $1::timestamptz) / 300)`, [new Date(ms - 70000).toISOString()])).map((x) => x.cg_id);
  const t6 = await valor(db, `select max(o.t) from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token where tk.cg_id = 'tok-6'`);
  paso('sin figure-heloc (o con su valor nulo) se guardan los demás: el que falta se arrastra; ids con mayúsculas, market_cap negativo o de texto y horas que no son ISO se ignoran',
    c.leer.coingecko === 200 && !c.leer.error && c.leer.validos === 244 && !ids.includes('tok-1') && !ids.includes('tok-2') && !ids.includes('tok-3')
    && !ids.includes('tok-4') && !ids.includes('tok-7') && ids.includes('tok-8') && !(await valor(db, "select count(*) from rwadar_mercado.tokens where cg_id = 'TOK-5'")));
  paso('una hora del futuro (reloj de CoinGecko adelantado) se guarda con la hora de la respuesta', new Date(t6).getTime() === ms + 1000);
  // El mismo last_updated dos veces: una fila; dos datos en el mismo cubo: el último.
  await valor(db, `select rwadar_mercado.guardar_mercados($1, $2)`, [mercados(ms), new Date(ms + 1000).toISOString()]);
  const n1 = await valor(db, 'select count(*) from rwadar_mercado.obs_5m');
  const r1 = await valor(db, `select rwadar_mercado.guardar_mercados($1, $2)`, [mercados(ms), new Date(ms + 1000).toISOString()]);
  const n2 = await valor(db, 'select count(*) from rwadar_mercado.obs_5m');
  await valor(db, `select rwadar_mercado.guardar_mercados($1, $2)`, [mercados(ms + 60000, { factor: 2 }), new Date(ms + 61000).toISOString()]);
  const v8 = await valor(db, `select o.valor from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token where tk.cg_id = 'tok-8' order by o.cubo desc limit 1`);
  await valor(db, `select rwadar_mercado.guardar_mercados($1, $2)`, [mercados(ms + 30000, { factor: 3 }), new Date(ms + 61000).toISOString()]);
  const v8b = await valor(db, `select o.valor from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token where tk.cg_id = 'tok-8' order by o.cubo desc limit 1`);
  paso('la misma hora dos veces deja una sola fila; en el mismo cubo vale el dato más reciente (uno anterior que llega después no lo pisa)',
    n1 === n2 && r1.guardados === 0 && v8 === Math.round(2e10 / 8) + 0.25 && v8b === v8 && r1.validos === 250);
}
{
  // Los 60 mayores ∪ los de la diaria: un token del puesto 70 en la diaria se guarda; el 61 sin estar, no.
  const ms = H('2026-11-19T01:03:00Z');
  await db.query('update rwadar_mercado.configuracion set tokens = $1', [[...TOKENS, 'tok-70']]);
  await valor(db, 'select rwadar_mercado.guardar_mercados($1, $2)', [mercados(ms), new Date(ms).toISOString()]);
  const guardados = (await filas(db, `select tk.cg_id from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token
    where o.cubo = floor(extract(epoch from $1::timestamptz) / 300)`, [new Date(ms - 70000).toISOString()])).map((x) => x.cg_id);
  paso('se guardan los 60 mayores y los de la diaria (el del puesto 70 sí; el 61, no)', guardados.length === 61 && guardados.includes('tok-70') && !guardados.includes('tok-61'));
  await db.query('update rwadar_mercado.configuracion set tokens = $1', [TOKENS]);
}

{
  // La 39: con muchos fallos seguidos la espera sigue siendo de 60 minutos (con la 35, «interval out of range»).
  const limpio = "update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, seguidos_429 = 0";
  const resultados = [];
  let ms = H('2026-11-19T02:03:00Z');
  for (const n of [36, 40, 576]) {
    // Una petición perdida (pedir() la da por fallida) con n fallos seguidos.
    await db.exec(limpio);
    await db.query(`update rwadar_mercado.configuracion set peticion_id = 987000 + $1, pedido_el = $2, ultimo_pedido_el = $2, fallos_seguidos = $1`, [n, new Date(ms - 5 * MIN).toISOString()]);
    await fijarReloj(db, ms);
    let r = '';
    const fallo = await error(async () => { r = await pedir(); });
    await nuevas();
    const c1 = await cfg();
    resultados.push([`perdida ${n}`, fallo === '' && r === 'espera' && c1.fallos_seguidos === n + 1
      && c1.reintentar_desde.getTime() === ms - 5 * MIN + 59.5 * MIN]);
    // Un 503 con n fallos seguidos: leer() lo apunta sin fallo_coingecko.
    ms += 2 * 60 * MIN;
    await db.exec(limpio);
    await db.query('update rwadar_mercado.configuracion set fallos_seguidos = $1', [n]);
    const c = await ciclo(ms, () => ({ status: 503, contenido: 'no' }));
    const c2 = await cfg();
    resultados.push([`503 ${n}`, c.pedir === 'pedido' && c.leer.coingecko === 503 && !('fallo_coingecko' in c.leer) && c2.fallos_seguidos === n + 1
      && c2.reintentar_desde.getTime() === ms + 59.5 * MIN]);
    if (n === 576) {
      // Hasta la hora no pide; a la hora, pide y la respuesta buena pone los fallos a 0.
      const antes = await ciclo(ms + 55 * MIN);
      const despues = await ciclo(ms + 60 * MIN);
      resultados.push(['576 y después bien', antes.pedir === 'espera' && despues.pedir === 'pedido' && despues.leer.coingecko === 200
        && (await cfg()).fallos_seguidos === 0 && (await cfg()).reintentar_desde === null]);
    }
    ms += 2 * 60 * MIN;
  }
  // 40 429 seguidos: 60 minutos (Retry-After más corto no la acorta).
  await db.exec(limpio);
  await db.exec('update rwadar_mercado.configuracion set seguidos_429 = 40');
  const c429 = await ciclo(ms, () => ({ status: 429, contenido: '{}', headers: { 'Retry-After': '40' } }));
  const c3 = await cfg();
  resultados.push(['429 40', c429.leer.coingecko === 429 && c429.leer.espera_s === 3600 && !('fallo_coingecko' in c429.leer)
    && c3.seguidos_429 === 41 && c3.reintentar_desde.getTime() === ms + 59.5 * MIN]);
  await db.exec(limpio);
  const mal = resultados.filter(([, b]) => b !== true).map(([k]) => k);
  paso(`con la 39, una petición perdida o un 503 con 36, 40 y 576 fallos seguidos y un 429 con 40 seguidos apuntan el fallo y esperan 60 minutos desde la petición, sin «interval out of range»; después, la respuesta buena pone los fallos a 0${mal.length ? ' — ' + mal.join(', ') : ''}`,
    mal.length === 0 && resultados.length === 8);
}

/* ---------- 5 · La lista de la diaria ---------- */
{
  const g = (texto) => valor(db, 'select rwadar_mercado.guardar_diaria($1)', [texto]);
  const otra = [...TOKENS.slice(1), 'tok-31'];
  paso('una diaria válida con otra lista se guarda (en su orden) y avisa de que cambió', (await g(diariaJSON(otra, '2026-11-14T08:00:00Z'))) === true
    && isDeepStrictEqual((await cfg()).tokens, otra));
  const malas = {
    'otra categoría': diariaJSON(TOKENS, '2026-11-14T09:00:00Z', { categoria: 'tokenized-gold' }),
    'otra fuente': diariaJSON(TOKENS, '2026-11-14T09:00:00Z', { fuente: 'Otra' }),
    'otra versión': diariaJSON(TOKENS, '2026-11-14T09:00:00Z', { version: 2 }),
    '0 tokens': diariaJSON([], '2026-11-14T09:00:00Z'),
    'ids repetidos': diariaJSON(['tok-1', 'tok-1'], '2026-11-14T09:00:00Z'),
    'id no válido': diariaJSON(['Tok 1'], '2026-11-14T09:00:00Z'),
    'incluidos que no cuadra': diariaJSON(TOKENS, '2026-11-14T09:00:00Z', { incluidos: 29 }),
    'hora no válida': diariaJSON(TOKENS, '14/11/2026'),
    'JSON roto': '{"version": 1,',
  };
  const res = [];
  for (const [k, texto] of Object.entries(malas)) res.push([k, await g(texto), isDeepStrictEqual((await cfg()).tokens, otra)]);
  paso(`una diaria no válida se ignora y se queda la anterior (${res.filter((x) => x[1] || !x[2]).map((x) => x[0]).join(', ') || 'todas'})`,
    res.every(([, cambio, igual]) => cambio === false && igual));
  const leida = (await cfg()).diaria_leida_el;
  await fijarReloj(db, H('2026-11-20T00:03:00Z'));
  await db.exec('update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, ultimo_pedido_el = null, reintentar_desde = null, fallos_seguidos = 0, seguidos_429 = 0, diaria_leida_el = null, diaria_pedida_el = null');
  await pedir();
  const p = (await nuevas()).find((x) => x.url === URL_DIARIA);
  await responder(db, p.id, { status: 404, contenido: 'no' });
  await fijarReloj(db, H('2026-11-20T00:04:00Z'));
  await leerBase();
  paso('una diaria que responde 404 no cambia la lista ni la hora de lectura (el servidor avisa si pasa de 45 min)',
    isDeepStrictEqual((await cfg()).tokens, otra) && (await cfg()).diaria_leida_el === null && leida !== null);
  await valor(db, 'select rwadar_mercado.guardar_diaria($1)', [diariaJSON()]);
}

/* ---------- 6 · La cadena con datos reales ---------- */
{
  const PRUEBA = JSON.parse(leer('tokenizacion/prueba-directo-20261113.json'));
  const deArchivo = (s) => s.v.map((v, i) => [s.t0 + s.dt.slice(0, i).reduce((a, b) => a + b, 0), v]);
  // Los tres tokens con las dos historias en el archivo (figure-heloc, el 64 % del total, entre ellos).
  const ids = PRUEBA.series['1h'].map((s) => s.id);
  const db2 = await baseDirecto({ hostil: false });
  const ultimoSondeo = PRUEBA.sondeos.at(-1);
  await fijarReloj(db2, PRUEBA.series['5m'][0].t0 + 26 * 3600000);
  const sembrado = Math.max(...PRUEBA.series['5m'].map((s) => deArchivo(s).at(-1)[0]));
  await fijarReloj(db2, sembrado + 60000);
  for (const id of ids) {
    const s = PRUEBA.series['5m'].find((x) => x.id === id), h = PRUEBA.series['1h'].find((x) => x.id === id);
    await valor(db2, 'select rwadar_mercado.sembrar($1)', [JSON.stringify({ id, primera: null, obs5: deArchivo(s), obs1h: deArchivo(h) })]);
  }
  await valor(db2, 'select rwadar_mercado.cerrar_siembra($1, $2, $3)', [JSON.stringify(ids), '2026-11-13T21:05:00Z', new Date(sembrado).toISOString()]);
  const docSiembra = await valor(db2, 'select doc from rwadar_mercado.directo');
  for (const s of PRUEBA.sondeos) {
    await fijarReloj(db2, s.respondido + 30000);
    await valor(db2, 'select rwadar_mercado.guardar_mercados($1, $2)', [JSON.stringify(s.lista), new Date(s.respondido).toISOString()]);
  }
  await valor(db2, 'select rwadar_mercado.construir($1)', [new Date(ultimoSondeo.respondido).toISOString()]);
  const doc = await valor(db2, 'select doc from rwadar_mercado.directo');
  let d = null, err = '';
  try { d = modelo.directoAFina(doc); } catch (e) { err = e.message; }
  // Lo mismo en JS: construirSerieFina con la siembra y los sondeos (hora = last_updated, como mucho la respuesta).
  const obs = new Map(ids.map((id) => [id, { '5m': deArchivo(PRUEBA.series['5m'].find((s) => s.id === id)), '1h': deArchivo(PRUEBA.series['1h'].find((s) => s.id === id)) }]));
  for (const s of PRUEBA.sondeos) for (const t of s.lista) if (obs.has(t.id)) for (const c of ['5m', '1h']) obs.get(t.id)[c].push([Math.min(Date.parse(t.last_updated), s.respondido), t.market_cap]);
  const js = Object.fromEntries(['5m', '1h'].map((c) => [c, modelo.construirSerieFina(ids.map((id) => ({ id, obs: obs.get(id)[c].sort((a, b) => a[0] - b[0]), primera: null })), c)]));
  // La siembra (market_chart) acaba a las 14:47 y el primer sondeo es de las 22:17: entre medias el
  // directo no leyó, así que ahí no culpa a nadie de no tener dato (la regla de hoy pone en «largos» a
  // tether-gold y theo por ese rato) y lo dice en sinLectura. Lo demás, idéntico.
  const igual = d && ['5m', '1h'].every((c) => isDeepStrictEqual({ ...d.fina.series[c], paso: undefined, largos: undefined }, { ...js[c], paso: undefined, largos: undefined })
    && d.fina.series[c].largos.every((t) => js[c].largos.includes(t)))
    && isDeepStrictEqual(d.fina.series['5m'].largos, ['figure-heloc']) && isDeepStrictEqual(d.fina.series['1h'].largos, ['figure-heloc', 'theo-short-duration-us-treasury-fund'])
    && d.sinLectura['5m'].length === 1 && d.sinLectura['5m'][0][0] > '2026-11-13T14:45Z' && d.sinLectura['5m'][0][0] < '2026-11-13T15:15Z'
    && d.sinLectura['5m'][0][1] === '2026-11-13T22:10Z';
  if (process.env.DEPURAR) for (const c of ['5m', '1h']) console.log(c, JSON.stringify({ ...d?.fina.series[c], puntos: d?.fina.series[c]?.puntos.slice(-2) }), JSON.stringify({ ...js[c], puntos: js[c].puntos.slice(-2) }), d?.fina.generado, err);
  paso(`cadena con datos reales: siembra (market_chart del 13/11) + 3 sondeos reales de /coins/markets → documento → directoAFina → validarSerieFina tal cual, y = construirSerieFina (5m ${d?.fina.series['5m']?.puntos.length} y 1h ${d?.fina.series['1h']?.puntos.length} puntos; último ${d?.fina.series['5m']?.puntos.at(-1)?.[0]})${err ? ' — ' + err : ''}`,
    !!d && igual && d.fina.series['5m'].puntos.at(-1)[0] === '2026-11-13T22:25Z' && docSiembra.series['5m'] && d.fina.generado === modelo.isoMinuto(ultimoSondeo.respondido).slice(0, 16) + new Date(ultimoSondeo.respondido).toISOString().slice(16, 19) + 'Z');
  paso(`el documento compacto ocupa poco (${JSON.stringify(doc).length} B; el formato de hoy, ${modelo.serializarSerieFina(d.fina).length} B)`,
    JSON.stringify(doc).length < 20000);
  // La lectura pública: apagado hasta encender; después, el documento.
  await db2.exec('set role anon');
  const apagado = await valor(db2, 'select public.tokenizacion_directo()');
  await db2.exec('reset role');
  await db2.exec('update rwadar_mercado.configuracion set encendido = true');
  await db2.exec('set role anon');
  const encendida = await valor(db2, 'select public.tokenizacion_directo()');
  await db2.exec('reset role');
  paso('anon lee public.tokenizacion_directo(): {estado: apagado} hasta encender y {estado: ok, doc} después', apagado.estado === 'apagado' && encendida.estado === 'ok' && isDeepStrictEqual(encendida.doc, doc));
  await db2.close();
}

/* ---------- 7 · Retención ---------- */
{
  const ms = H('2026-11-25T12:00:00Z');
  await fijarReloj(db, ms);
  await db.exec(`insert into rwadar_mercado.tokens (cg_id) select 'ret-' || g from generate_series(1, 60) g on conflict do nothing`);
  // 3 días cada 5 minutos y 40 días cada hora, de 60 tokens, en bloque.
  await db.exec(`insert into rwadar_mercado.obs_5m (token, cubo, t, valor)
    select tk.id, floor(extract(epoch from s) / 300), s, 1e9 from rwadar_mercado.tokens tk, generate_series('2026-11-22T12:00:00Z'::timestamptz, '2026-11-25T12:00:00Z', interval '5 minutes') s
    where tk.cg_id like 'ret-%' on conflict do nothing;
    insert into rwadar_mercado.obs_1h (token, cubo, t, valor)
    select tk.id, floor(extract(epoch from s) / 3600), s, 1e9 from rwadar_mercado.tokens tk, generate_series('2026-10-16T12:00:00Z'::timestamptz, '2026-11-25T12:00:00Z', interval '1 hour') s
    where tk.cg_id like 'ret-%' on conflict do nothing;
    insert into rwadar_mercado.registro (pedido_el) select s from generate_series('2026-11-15T12:00:00Z'::timestamptz, '2026-11-25T12:00:00Z', interval '5 minutes') s;
    insert into rwadar_mercado.lecturas (cubo, leida_el) select floor(extract(epoch from s) / 300), s from generate_series('2026-10-16T12:00:00Z'::timestamptz, '2026-11-25T12:00:00Z', interval '5 minutes') s on conflict do nothing;`);
  const tam = async () => Number(await valor(db, "select pg_total_relation_size('rwadar_mercado.obs_5m') + pg_total_relation_size('rwadar_mercado.obs_1h')"));
  await db.exec('select rwadar_mercado.limpiar()');
  const viejas = await una(db, `select
    (select count(*) from rwadar_mercado.obs_5m where t < '2026-11-23T11:00:00Z') o5,
    (select count(*) from rwadar_mercado.obs_1h where t < '2026-10-21T12:00:00Z') o1,
    (select count(*) from rwadar_mercado.registro where pedido_el < '2026-11-18T12:00:00Z') r,
    (select count(*) from rwadar_mercado.lecturas where leida_el < '2026-10-21T12:00:00Z') l,
    (select count(*) from rwadar_mercado.obs_5m where t >= '2026-11-24T12:00:00Z') o5_dia`);
  const bytes = await tam();
  paso(`retención tras 3 días de 60 tokens cada 5 minutos: nada de obs_5m de más de 49 h, de obs_1h de más de 35 días, de registro de más de 7 días; las de 5 minutos y la horaria ocupan ${(bytes / 1048576).toFixed(1)} MB`,
    Number(viejas.o5) === 0 && Number(viejas.o1) === 0 && Number(viejas.r) === 0 && Number(viejas.l) === 0 && Number(viejas.o5_dia) > 60 * 280 && bytes < 15 * 1048576);
  await db.exec("delete from rwadar_mercado.tokens where cg_id like 'ret-%'; delete from rwadar_mercado.registro; delete from rwadar_mercado.lecturas");
}

/* ---------- 8 · Permisos ---------- */
{
  const tablas = ['configuracion', 'tokens', 'obs_5m', 'obs_1h', 'lecturas', 'directo', 'registro'];
  const funciones = (await filas(db, `select p.oid::regprocedure::text f from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'rwadar_mercado'`)).map((x) => x.f);
  const resultados = [];
  for (const rol of ['anon', 'authenticated']) {
    await db.exec(`set role ${rol}`);
    for (const t of tablas) resultados.push([`${rol} lee ${t}`, await error(() => db.query(`select * from rwadar_mercado.${t}`))]);
    for (const f of funciones.filter((x) => /\(\)$/.test(x))) resultados.push([`${rol} ejecuta ${f}`, await error(() => db.query(`select ${f}`))]);
    const lectura = await valor(db, 'select public.tokenizacion_directo()').catch((e) => e.message);
    resultados.push([`${rol} lee el directo`, lectura?.estado ? '' : 'falla']);
    await db.exec('reset role');
  }
  const mal = resultados.filter(([k, e]) => (k.endsWith('lee el directo') ? e !== '' : !/permission denied/.test(e)));
  paso(`con privilegios por defecto hostiles al aplicar: anon y authenticated no leen ninguna tabla ni ejecutan ninguna función de rwadar_mercado (${funciones.length} funciones), y sí la lectura pública${mal.length ? ' — ' + mal.map((x) => x[0]).join(', ') : ''}`,
    mal.length === 0 && funciones.length >= 18);
}

/* ---------- 9 · Encender, apagar, deshacer y verificador ---------- */
const relojes = () => filas(db, 'select jobname, schedule, command from cron.job order by jobname');
const verificar = () => error(() => db.exec(VERIFICAR));
{
  await db.exec("update rwadar_mercado.configuracion set encendido = false, sembrado_el = null; delete from rwadar_mercado.registro");
  paso('encender sin siembra (o con una de más de 30 minutos) no hace nada', /siembra falta o tiene más de 30 minutos/.test(await error(() => db.exec(ENCENDER)))
    && (await relojes()).length === 0);
  await db.exec('update rwadar_mercado.configuracion set sembrado_el = (select t from public._reloj) - interval \'5 minutes\'');
  await db.exec("select cron.schedule('rwadar-novedades', '*/5 * * * *', 'select rwadar_novedades.procesar()')");
  await db.exec(ENCENDER);
  await db.exec(ENCENDER);
  const r = (await relojes()).filter((x) => x.jobname.startsWith('rwadar-mercado'));
  paso('encender dos veces deja exactamente los dos relojes, con su horario y su orden, y encendido = true',
    isDeepStrictEqual(r, [
      { jobname: 'rwadar-mercado-leer', schedule: '4,9,14,19,24,29,34,39,44,49,54,59 * * * *', command: 'select rwadar_mercado.leer()' },
      { jobname: 'rwadar-mercado-pedir', schedule: '3,8,13,18,23,28,33,38,43,48,53,58 * * * *', command: 'select rwadar_mercado.pedir()' },
    ]) && (await cfg()).encendido === true);
  paso(`el verificador pasa encendido (${await verificar() || 'OK'})`, (await verificar()) === '');
  await db.exec(APAGAR30);
  paso('el apagado de los avisos (30) no toca los relojes del directo', (await relojes()).filter((x) => x.jobname.startsWith('rwadar-mercado')).length === 2
    && !(await relojes()).some((x) => x.jobname === 'rwadar-novedades'));
  await db.exec("select cron.schedule('rwadar-novedades', '*/5 * * * *', 'select rwadar_novedades.procesar()')");
  // El verificador falla con cada estado roto (y se deshace cada cambio).
  const rompe = async (romper, arreglar) => { await db.exec(romper); const e = await verificar(); await db.exec(arreglar); return e; };
  const casos = {
    'una tabla para anon': [await rompe('grant select on rwadar_mercado.obs_5m to anon', 'revoke select on rwadar_mercado.obs_5m from anon'), /permisos para los clientes/],
    'el esquema para anon': [await rompe('grant usage on schema rwadar_mercado to anon', 'revoke usage on schema rwadar_mercado from anon'), /permiso de uso/],
    'una función para anon': [await rompe('grant execute on function rwadar_mercado.pedir() to anon', 'revoke execute on function rwadar_mercado.pedir() from anon'), /ejecutable por algún cliente/],
    'una función invoker': [await rompe('alter function rwadar_mercado.leer() security invoker', 'alter function rwadar_mercado.leer() security definer'), /no es security definer/],
    'una función sin search_path': [await rompe('alter function rwadar_mercado.leer() reset search_path', "alter function rwadar_mercado.leer() set search_path = ''"), /search_path/],
    'sin RLS': [await rompe('alter table rwadar_mercado.directo disable row level security', 'alter table rwadar_mercado.directo enable row level security'), /sin RLS/],
    'una política': [await rompe('create policy p on rwadar_mercado.directo for select using (true)', 'drop policy p on rwadar_mercado.directo'), /políticas/],
    'la lectura para public': [await rompe('grant execute on function public.tokenizacion_directo() to public', 'revoke execute on function public.tokenizacion_directo() from public'), /permisos incorrectos/],
    'la lectura sin anon': [await rompe('revoke execute on function public.tokenizacion_directo() from anon', 'grant execute on function public.tokenizacion_directo() to anon'), /permisos incorrectos/],
    'un reloj con otro horario': [await rompe("update cron.job set schedule = '*/5 * * * *' where jobname = 'rwadar-mercado-pedir'", "update cron.job set schedule = '3,8,13,18,23,28,33,38,43,48,53,58 * * * *' where jobname = 'rwadar-mercado-pedir'"), /relojes no son exactamente/],
    'un reloj con otra orden': [await rompe("update cron.job set command = 'select rwadar_mercado.leer()' where jobname = 'rwadar-mercado-pedir'", "update cron.job set command = 'select rwadar_mercado.pedir()' where jobname = 'rwadar-mercado-pedir'"), /relojes no son exactamente/],
    'un tercer reloj': [await rompe("select cron.schedule('rwadar-mercado-otro', '* * * * *', 'select 1')", "select cron.unschedule('rwadar-mercado-otro')"), /relojes no son exactamente/],
    'apagado con relojes': [await rompe('update rwadar_mercado.configuracion set encendido = false', 'update rwadar_mercado.configuracion set encendido = true'), /apagado, pero quedan/],
    'dos llamadas a 200 s': [await rompe("insert into rwadar_mercado.registro (pedido_el) values ((select t from public._reloj) - interval '400 seconds'), ((select t from public._reloj) - interval '200 seconds')", 'delete from rwadar_mercado.registro'), /a menos de 240 s/],
    'datos fuera de su retención': [await rompe("insert into rwadar_mercado.obs_5m select id, floor(extract(epoch from (select t from public._reloj) - interval '3 days') / 300), (select t from public._reloj) - interval '3 days', 1 from rwadar_mercado.tokens limit 1", "delete from rwadar_mercado.obs_5m where t < (select t from public._reloj) - interval '2 days'"), /fuera de su retención/],
    'un documento de otra lista': [await rompe("update rwadar_mercado.directo set doc = jsonb_set(doc, '{tokens}', '[\"otro\"]')", "update rwadar_mercado.directo set doc = jsonb_set(doc, '{tokens}', to_jsonb((select tokens from rwadar_mercado.configuracion)))"), /documento del directo/],
  };
  const fallan = Object.entries(casos).filter(([, [e, re]]) => !re.test(e)).map(([k, [e]]) => `${k}: ${e || 'pasa'}`);
  paso(`el verificador falla con cada estado roto (${Object.keys(casos).length} casos)${fallan.length ? ' — ' + fallan.join('; ') : ''}`, fallan.length === 0);
  paso('y vuelve a pasar con todo arreglado', (await verificar()) === '');
  await db.exec(APAGAR);
  paso('apagar quita los dos relojes, pone encendido = false, no toca rwadar-novedades y guarda los datos; el verificador pasa apagado',
    (await relojes()).map((x) => x.jobname).join() === 'rwadar-novedades' && (await cfg()).encendido === false
    && (await valor(db, 'select count(*) from rwadar_mercado.obs_1h')) > 0 && (await verificar()) === '');
  await db.exec('set role anon');
  const apagado = await valor(db, 'select public.tokenizacion_directo()');
  await db.exec('reset role');
  paso('apagado, la lectura pública dice «apagado» al momento', apagado.estado === 'apagado');
  // estado.sql corre y no enseña secretos.
  await db.exec("insert into vault.decrypted_secrets values ('RWADAR_COINGECKO_DEMO', 'CG-secreto-de-prueba')");
  const estado = await db.exec(ESTADO.replace(/^begin transaction read only;$/m, '').replace(/^rollback;$/m, ''));
  const textoEstado = JSON.stringify(estado.map((x) => x.rows));
  paso('el estado se lee sin errores, cuenta las llamadas del mes y no enseña la clave', textoEstado.includes('llamadas a CoinGecko del mes') && !textoEstado.includes('CG-secreto'));
  await db.exec(DESHACER);
  paso('deshacer quita el esquema, la función pública y los relojes del directo (y deja los demás)',
    (await valor(db, "select to_regnamespace('rwadar_mercado') is null and to_regprocedure('public.tokenizacion_directo()') is null"))
    && (await relojes()).map((x) => x.jobname).join() === 'rwadar-novedades');
  await db.exec(SQL35);
  await db.exec(SQL35);
  paso('la 35 se puede volver a aplicar (dos veces) tras deshacer', (await valor(db, "select count(*) from rwadar_mercado.configuracion")) === 1);
}

const segundos = (performance.now() - t0) / 1000;
paso(`dura menos de 25 s en esta máquina (${segundos.toFixed(1)} s; tope por archivo de la CI)`, segundos < 25);
await db.close();
informe('Gráfico en directo: la base (migraciones 35, 37 y 39)', ok, fail);
