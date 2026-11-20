/* =====================================================================
   RWAdar · el directo y la secuencia de tokens (migración 37)
   ---------------------------------------------------------------------
   El corte del 16/11/2026: con la 35, cada lectura de CoinGecko pedía un
   id a la secuencia de rwadar_mercado.tokens (smallint, tope 32.767) por
   cada token propuesto, aunque ya existiera (~60 por lectura cada 5 min),
   hasta agotarla (error 2200H). PGlite con los dobles de siempre:
   - con la 35 sola, la secuencia avanza ~60 por lectura y, cerca del tope,
     la lectura falla con 2200H (el corte);
   - con la 37, no avanza para los tokens que ya están y sí (uno) para uno
     nuevo; guarda exactamente lo mismo que la 35 (observaciones, tokens,
     visto_el y primera); reinicia la identidad en max(id) + 1; se aplica
     dos veces; sin la 35 falla sin dejar nada; los permisos no cambian;
     el verificador de la 35 sigue pasando y el de la 37 pasa y falla.
       node probar-mercado-directo-secuencia.mjs
   ===================================================================== */
import { PGlite } from '@electric-sql/pglite';
import { isDeepStrictEqual } from 'node:util';
import { baseDirecto, leer, filas, valor, fijarReloj, SUPABASE, HOSTIL } from './mercado-directo-soporte.mjs';
import { informe } from './pruebas-soporte.mjs';

const ok = [], fail = [];
const paso = (texto, condicion) => (condicion ? ok : fail).push(texto);
const t0 = performance.now();
const SQL37 = leer('db/37_mercado_directo_secuencia.sql');
const VERIFICAR35 = leer('db/35_mercado_directo_verificar.sql');
const VERIFICAR37 = leer('db/37_mercado_directo_secuencia_verificar.sql');
const sinComentarios = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');

/* ---------- 1 · Revisión estática ---------- */
{
  const lineas = SQL37.replace(/\n$/, '').split('\n');
  const primera = (t) => sinComentarios(t).split('\n').find((l) => l.trim() !== '');
  paso('la migración versionada 20261120180000 es una copia idéntica de db/37', leer('supabase/migrations/20261120180000_mercado_directo_secuencia.sql') === SQL37);
  paso('la 37 empieza en «begin;» y acaba en su único «commit;»; su verificador es de solo lectura y acaba en «rollback;»',
    primera(SQL37) === 'begin;' && (SQL37.match(/^commit;$/gm) || []).length === 1 && lineas.at(-1) === 'commit;'
    && primera(VERIFICAR37) === 'begin transaction read only;' && VERIFICAR37.trimEnd().endsWith('rollback;') && !/^commit;$/m.test(VERIFICAR37));
  const codigo = sinComentarios(SQL37);
  paso('la 37 no da ningún permiso, no crea relojes y solo toca rwadar_mercado',
    !/\bgrant\b/i.test(codigo) && !/cron\.schedule\(/.test(codigo) && !/rwadar_novedades|rwadar_catalogo|public\./.test(codigo)
    && (codigo.match(/create or replace function rwadar_mercado\.(\w+)\(/g) || []).join('|')
      === 'create or replace function rwadar_mercado.guardar_diaria(|create or replace function rwadar_mercado.guardar_mercados(|create or replace function rwadar_mercado.sembrar(|create or replace function rwadar_mercado.cerrar_siembra(');
}

/* ---------- 2 · Datos de prueba ---------- */
const T = Date.parse('2026-11-16T03:03:00Z');
const MIN = 60000;
// n tokens (tok-1 el mayor), con su hora 70 s antes de ms; «subir» pone ese token el primero.
const lista = (ms, { n = 250, factor = 1, subir = null } = {}) => JSON.stringify(Array.from({ length: n }, (_, i) => ({
  id: `tok-${i + 1}`, market_cap: (`tok-${i + 1}` === subir ? 1e11 : Math.round((1e10 / (i + 1)) * factor)) + 0.25, last_updated: new Date(ms - 70000).toISOString(),
})));
const DIARIA = JSON.stringify({ version: 1, fuente: 'CoinGecko', categoria: 'tokenized-products', generado: '2026-11-16T02:30:00Z', pedidos: 40,
  incluidos: 30, discontinuos: 0, cobertura: 90, tokens: Array.from({ length: 30 }, (_, i) => `tok-${i + 1}`), puntos: [] });
const secuencia = async (db) => {
  const nombre = await valor(db, "select pg_get_serial_sequence('rwadar_mercado.tokens', 'id')");
  const r = (await filas(db, `select last_value, is_called from ${nombre}`))[0];
  return Number(r.last_value) + (r.is_called ? 1 : 0); // el siguiente id que daría
};
const mercados = (db, ms, opciones) => valor(db, 'select rwadar_mercado.guardar_mercados($1, $2)', [lista(ms, opciones), new Date(ms + 1000).toISOString()]);
const sembrar = (db, id, primera = null) => valor(db, 'select rwadar_mercado.sembrar($1::jsonb)',
  [JSON.stringify({ id, primera, obs5: [[T - 10 * MIN, 5e9]], obs1h: [[T - 2 * 3600000, 5e9]] })]);
const verificar = async (db, sql) => {
  const avisos = [];
  try { await db.exec(sql, { onNotice: (n) => avisos.push(n.message) }); return { ok: true, texto: avisos.join(' | ') }; }
  catch (e) { await db.exec('rollback').catch(() => {}); return { ok: false, texto: e.message }; }
};
const aplicar37 = async (db) => { await db.exec(HOSTIL); await db.exec(SQL37); await db.exec(HOSTIL.replace(/ grant /g, ' revoke ').replace(/ to /g, ' from ')); };
// Lo que deja guardado una serie de llamadas (sin los ids: con la 35 y la 37 pueden ser otros).
const foto = async (db) => ({
  tokens: await filas(db, 'select cg_id, primera::text, visto_el::text from rwadar_mercado.tokens order by cg_id'),
  o5: await filas(db, 'select tk.cg_id, o.cubo, o.t::text, o.valor from rwadar_mercado.obs_5m o join rwadar_mercado.tokens tk on tk.id = o.token order by 1, 2'),
  o1: await filas(db, 'select tk.cg_id, o.cubo, o.t::text, o.valor from rwadar_mercado.obs_1h o join rwadar_mercado.tokens tk on tk.id = o.token order by 1, 2'),
  cfg: await filas(db, 'select tokens, diaria_generado::text from rwadar_mercado.configuracion'),
});
/* La misma serie de llamadas que hace el directo, con la 35 o con la 37. */
async function serie(db) {
  const r = [];
  await fijarReloj(db, T);
  r.push(await valor(db, 'select rwadar_mercado.guardar_diaria($1)', [DIARIA]));
  for (let i = 0; i < 4; i++) r.push(await mercados(db, T + i * 5 * MIN, { factor: 1 + i / 1000 }));
  r.push(await mercados(db, T + 20 * MIN, { subir: 'tok-200' })); // uno nuevo entra entre los 60 mayores
  r.push(await valor(db, 'select rwadar_mercado.guardar_diaria($1)', [DIARIA]));
  r.push(await sembrar(db, 'tok-3', '2026-11-01'), await sembrar(db, 'tok-201'));
  await fijarReloj(db, T + 25 * MIN);
  r.push(await valor(db, "select rwadar_mercado.cerrar_siembra($1::jsonb, '2026-11-16T02:30:00Z', $2)", [JSON.stringify(Array.from({ length: 30 }, (_, i) => `tok-${i + 1}`)), new Date(T + 24 * MIN).toISOString()]));
  return r;
}

/* ---------- 3 · Con la 35 sola: la secuencia se gasta (el corte) ---------- */
const db35 = await baseDirecto();
let gasto35;
{
  await fijarReloj(db35, T);
  await mercados(db35, T);
  const s1 = await secuencia(db35);
  await mercados(db35, T + 5 * MIN);
  const s2 = await secuencia(db35);
  await mercados(db35, T + 10 * MIN);
  const s3 = await secuencia(db35);
  gasto35 = s3 - s2;
  paso(`con la 35 sola, cada lectura gasta un id por token propuesto aunque ya exista: la secuencia avanza ${s2 - s1} y ${s3 - s2} con los mismos 60 tokens`,
    s1 === 61 && s2 - s1 === 60 && s3 - s2 === 60 && (await valor(db35, 'select count(*)::int from rwadar_mercado.tokens')) === 60);
  // Cerca del tope (como el 16/11 a las 03:33): la lectura falla con 2200H aunque todos los tokens existan.
  await db35.exec('alter table rwadar_mercado.tokens alter column id restart with 32760');
  let codigo = '';
  try { await mercados(db35, T + 15 * MIN); } catch (e) { codigo = e.code; }
  paso(`con la 35 y la secuencia cerca del tope, la lectura falla con 2200H (sequence_generator_limit_exceeded) y no guarda nada (${codigo})`,
    codigo === '2200H' && (await valor(db35, 'select count(*)::int from rwadar_mercado.lecturas')) === 3);
  const v37 = await verificar(db35, VERIFICAR37);
  paso(`el verificador de la 37 falla con la 35 sola (${v37.texto})`, !v37.ok && /sigue con el alta de la 35/.test(v37.texto));
  // La 37 sobre la base agotada: reinicia la identidad y la misma lectura vuelve a guardar.
  await aplicar37(db35);
  const sig = await secuencia(db35);
  const r = await mercados(db35, T + 15 * MIN);
  paso(`la 37 sobre la base agotada reinicia la identidad en max(id) + 1 (${sig}) y la misma lectura vuelve a guardar (${JSON.stringify(r)})`,
    sig === 61 && r.validos === 250 && r.guardados > 0 && (await secuencia(db35)) === 61);
}

/* ---------- 4 · Con la 37: no gasta para los que están; uno por cada nuevo ---------- */
const db37 = await baseDirecto();
await aplicar37(db37);
{
  await fijarReloj(db37, T);
  await mercados(db37, T);
  const s1 = await secuencia(db37);
  await mercados(db37, T + 5 * MIN);
  await mercados(db37, T + 10 * MIN);
  const s3 = await secuencia(db37);
  await valor(db37, 'select rwadar_mercado.guardar_diaria($1)', [DIARIA]);
  const s4 = await secuencia(db37);
  paso(`con la 37, dos lecturas más y la diaria con los mismos tokens no gastan ningún id (siguiente: ${s1}, ${s3}, ${s4}; con la 35, ${gasto35} por lectura)`,
    s1 === 61 && s3 === 61 && s4 === 61);
  const visto = await valor(db37, "select count(*)::int from rwadar_mercado.tokens where visto_el = '2026-11-16T03:13:01Z'");
  paso(`con la 37, visto_el se actualiza igual en los 60 que ya estaban (${visto})`, visto === 60);
  const r = await mercados(db37, T + 15 * MIN, { subir: 'tok-200' });
  const nuevo = (await filas(db37, "select id, visto_el::text from rwadar_mercado.tokens where cg_id = 'tok-200'"))[0];
  paso(`con la 37, un token nuevo entre los 60 mayores gasta exactamente un id (el ${nuevo?.id}), con su visto_el y sus observaciones`,
    (await secuencia(db37)) === 62 && nuevo?.id === 61 && nuevo.visto_el.startsWith('2026-11-16 03:18:01') && r.guardados > 0
    && (await valor(db37, 'select count(*)::int from rwadar_mercado.obs_5m where token = 61')) === 1);
  await fijarReloj(db37, T + 20 * MIN);
  await sembrar(db37, 'tok-5', '2026-11-02');
  const s5 = await secuencia(db37);
  await sembrar(db37, 'tok-300');
  paso('con la 37, sembrar un token que ya está no gasta id (y guarda su «primera»); uno nuevo, uno',
    s5 === 62 && (await secuencia(db37)) === 63 && (await valor(db37, "select primera::text from rwadar_mercado.tokens where cg_id = 'tok-5'")) === '2026-11-02'
    && (await valor(db37, "select id from rwadar_mercado.tokens where cg_id = 'tok-300'")) === 62);
}

/* ---------- 5 · La 37 guarda exactamente lo mismo que la 35 ---------- */
{
  const a = await baseDirecto({ hostil: false });
  const b = await baseDirecto({ hostil: false });
  await aplicar37(b);
  const ra = await serie(a), rb = await serie(b);
  const fa = await foto(a), fb = await foto(b);
  paso(`la misma serie (diaria, 5 lecturas, un token nuevo, siembra y cierre) da lo mismo con la 35 y con la 37: respuestas, tokens, visto_el, primera, ${fa.o5.length} obs_5m y ${fa.o1.length} obs_1h`,
    isDeepStrictEqual(ra, rb) && isDeepStrictEqual(fa, fb) && fa.o5.length > 60 && fa.tokens.length === 62);
  paso(`y gasta mucho menos: siguiente id ${await secuencia(a)} con la 35 y ${await secuencia(b)} con la 37 (62 tokens)`,
    (await secuencia(b)) === 63 && (await secuencia(a)) > 300);
  await a.close(); await b.close();
}

/* ---------- 6 · Idempotente, permisos y verificadores ---------- */
{
  await aplicar37(db37);
  paso('la 37 se aplica dos veces y la identidad sigue en max(id) + 1', (await secuencia(db37)) === 63);
  const funciones = ['guardar_diaria(text)', 'guardar_mercados(text,timestamp with time zone)', 'sembrar(jsonb)', 'cerrar_siembra(jsonb,timestamp with time zone,timestamp with time zone)'];
  const mal = [];
  for (const f of funciones) {
    const p = (await filas(db37, `select prosecdef, proconfig, has_function_privilege('anon', oid, 'execute') as anon,
      has_function_privilege('authenticated', oid, 'execute') as aut, has_function_privilege('service_role', oid, 'execute') as serv
      from pg_proc where oid = to_regprocedure($1)`, [`rwadar_mercado.${f}`]))[0];
    if (!p || !p.prosecdef || !isDeepStrictEqual(p.proconfig, ['search_path=""']) || p.anon || p.aut || p.serv) mal.push(f);
  }
  paso(`con privilegios por defecto hostiles al aplicar la 37: las cuatro siguen security definer, con search_path vacío y sin permiso para los clientes${mal.length ? ' — ' + mal.join(', ') : ''}`,
    mal.length === 0 && !(await valor(db37, "select has_sequence_privilege('anon', pg_get_serial_sequence('rwadar_mercado.tokens', 'id'), 'usage')")));
  const v35 = await verificar(db37, VERIFICAR35);
  const v37 = await verificar(db37, VERIFICAR37);
  paso(`tras la 37, el verificador de la 35 sigue pasando (${v35.texto})`, v35.ok && /RWAdar 35 OK/.test(v35.texto));
  paso(`el verificador de la 37 pasa (${v37.texto})`, v37.ok && /RWAdar 37 OK: .*62 tokens, siguiente id 63/.test(v37.texto));
  await db37.exec('alter table rwadar_mercado.tokens alter column id restart with 30000');
  const corta = await verificar(db37, VERIFICAR37);
  await db37.exec('alter table rwadar_mercado.tokens alter column id restart with 62');
  const detras = await verificar(db37, VERIFICAR37);
  paso(`el verificador de la 37 falla con poco margen o con la secuencia por detrás del mayor id (${corta.texto}; ${detras.texto})`,
    !corta.ok && /le quedan 2768 ids/.test(corta.texto) && !detras.ok && /no va por delante/.test(detras.texto));
}

/* ---------- 7 · Sin la 35, falla sin dejar nada ---------- */
{
  const db = await new PGlite();
  await db.exec(SUPABASE);
  let texto = '';
  try { await db.exec(SQL37); } catch (e) { texto = e.message; await db.exec('rollback').catch(() => {}); }
  paso(`sin la 35, la 37 falla y no deja nada (${texto})`, /RWAdar 37: falta aplicar 35_mercado_directo\.sql/.test(texto)
    && (await valor(db, "select to_regnamespace('rwadar_mercado') is null")));
  await db.close();
}

await db35.close(); await db37.close();
const segundos = (performance.now() - t0) / 1000;
paso(`dura menos de 25 s en esta máquina (${segundos.toFixed(1)} s; tope por archivo de la CI)`, segundos < 25);
informe('Gráfico en directo: la secuencia de tokens (migración 37)', ok, fail);
