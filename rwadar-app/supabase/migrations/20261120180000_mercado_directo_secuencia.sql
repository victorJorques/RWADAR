-- =====================================================================
-- RWAdar 37 · el directo deja de gastar la secuencia de tokens
-- ---------------------------------------------------------------------
-- Corte del 16/11/2026 (03:33 UTC): cada lectura de CoinGecko respondía
-- 200 pero fallaba con error_2200h (SQLSTATE 2200H,
-- sequence_generator_limit_exceeded). rwadar_mercado.tokens.id es un
-- smallint identity (hasta 32.767) y «insert … on conflict (cg_id)» pide
-- un valor a la secuencia por cada fila propuesta aunque choque: unas 60
-- por lectura cada 5 minutos, agotada en unos dos días.
--
-- Arreglo: las cuatro altas de tokens de la 35 (guardar_diaria,
-- guardar_mercados, sembrar y cerrar_siembra) solo insertan los cg_id que
-- no existen («where not exists»: para los demás no se evalúa nextval) y
-- actualizan visto_el aparte. Todo lo demás, idéntico a la 35 (firmas,
-- security definer, search_path vacío y permisos). Después, la identidad
-- se reinicia en max(id) + 1. Idempotente: se puede aplicar dos veces.
-- Copia idéntica: supabase/migrations/20261120180000_mercado_directo_secuencia.sql.
--
-- Solo con orden expresa de la dirección y con el flujo «Mercado en
-- directo (base)» (ensayo-37, aplicar-37 y verificar-37). Si la 35 no
-- está, falla sin dejar nada. Verificador:
-- 37_mercado_directo_secuencia_verificar.sql. Contrato:
-- docs/tareas/MERCADO-DIRECTO-2026-11-14.md.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_mercado.tokens') is null
     or to_regprocedure('rwadar_mercado.guardar_diaria(text)') is null
     or to_regprocedure('rwadar_mercado.guardar_mercados(text,timestamp with time zone)') is null
     or to_regprocedure('rwadar_mercado.sembrar(jsonb)') is null
     or to_regprocedure('rwadar_mercado.cerrar_siembra(jsonb,timestamp with time zone,timestamp with time zone)') is null then
    raise exception using errcode = '55000', message = 'RWAdar 37: falta aplicar 35_mercado_directo.sql';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que toman pedir() y leer(): ninguna vuelta del reloj
-- corre a medias con las funciones viejas y las nuevas.
select pg_advisory_xact_lock(20261113, 35);

-- ---------------------------------------------------------------------
-- 1 · Las cuatro altas de tokens, sin gastar la secuencia
-- ---------------------------------------------------------------------

-- Valida /datos/tokenizacion-serie.json como validarSerie (lo que hace
-- falta aquí) y, si vale, guarda su lista y su «generado». true si cambió.
-- Si no vale, no toca nada (se queda la anterior y diaria_leida_el no
-- avanza: el servidor avisa si pasa de 45 minutos).
create or replace function rwadar_mercado.guardar_diaria(p_contenido text) returns boolean
language plpgsql security definer set search_path = '' as $funcion$
declare
  v jsonb;
  v_tokens text[];
  v_generado timestamptz;
  v_cambia boolean;
begin
  if p_contenido is null or octet_length(p_contenido) > 2097152 then return false; end if;
  begin
    v := p_contenido::jsonb;
  exception when others then
    return false;
  end;
  if jsonb_typeof(v) <> 'object' or v->'version' <> '1'::jsonb or v->>'fuente' is distinct from 'CoinGecko'
     or v->>'categoria' is distinct from 'tokenized-products' or jsonb_typeof(v->'tokens') is distinct from 'array'
     or jsonb_typeof(v->'incluidos') is distinct from 'number' then
    return false;
  end if;
  v_generado := rwadar_mercado.hora_iso(v->>'generado');
  if v_generado is null then return false; end if;
  if exists (select 1 from jsonb_array_elements(v->'tokens') e
              where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[a-z0-9][a-z0-9-]{0,99}$') then
    return false;
  end if;
  select coalesce(array_agg(e #>> '{}' order by o), '{}') into v_tokens
    from jsonb_array_elements(v->'tokens') with ordinality as x(e, o);
  if cardinality(v_tokens) not between 1 and 250
     or (select count(distinct t) from unnest(v_tokens) t) <> cardinality(v_tokens)
     or (v->>'incluidos') !~ '^\d{1,3}$' or (v->>'incluidos')::integer <> cardinality(v_tokens) then
    return false;
  end if;
  -- RWAdar 37: solo los cg_id nuevos piden id a la secuencia (corte del 16/11).
  insert into rwadar_mercado.tokens (cg_id)
  select t from unnest(v_tokens) t
   where not exists (select 1 from rwadar_mercado.tokens tk where tk.cg_id = t)
  on conflict (cg_id) do nothing;
  select tokens is distinct from v_tokens or diaria_generado is distinct from v_generado into v_cambia
    from rwadar_mercado.configuracion where unica;
  update rwadar_mercado.configuracion
     set tokens = v_tokens, diaria_generado = v_generado, diaria_leida_el = rwadar_mercado.reloj()
   where unica;
  return coalesce(v_cambia, false);
end
$funcion$;

-- Guarda una respuesta 200 de CoinGecko: los 60 mayores y los de la
-- diaria, un dato por token y cubo (el último). Sin red: se prueba sola.
-- Lanza 'demasiado_grande', 'json_roto', 'lista_no_valida' o
-- 'lista_corta' (menos de 25 válidos) y entonces no guarda nada. Si faltan
-- tokens de la diaria (figure-heloc en su hueco), guarda los demás: el que
-- falta se arrastra con la regla de siempre.
create or replace function rwadar_mercado.guardar_mercados(p_contenido text, p_respondido timestamptz) returns jsonb
language plpgsql security definer set search_path = '' as $funcion$
declare
  v_lista jsonb;
  v_tokens text[];
  v_validos integer;
  v_guardados integer;
begin
  if p_contenido is null or octet_length(p_contenido) > 4194304 then raise exception 'demasiado_grande'; end if;
  begin
    v_lista := p_contenido::jsonb;
  exception when others then
    raise exception 'json_roto';
  end;
  if jsonb_typeof(v_lista) <> 'array' or jsonb_array_length(v_lista) not between 1 and 1000 then
    raise exception 'lista_no_valida';
  end if;
  select count(*) into v_validos from rwadar_mercado.validos_mercados(v_lista, p_respondido);
  if v_validos < 25 then raise exception 'lista_corta'; end if;
  select tokens into v_tokens from rwadar_mercado.configuracion where unica;
  with v as (select * from rwadar_mercado.validos_mercados(v_lista, p_respondido)),
       e as (select * from (select v.*, row_number() over (order by v.valor desc, v.pos) as puesto from v) x
              where x.puesto <= 60 or x.cg_id = any (coalesce(v_tokens, '{}'))),
       -- RWAdar 37: solo los cg_id nuevos piden id a la secuencia (corte del 16/11);
       -- los que ya están, solo visto_el. Los dos grupos no se tocan (misma foto).
       nuevos as (insert into rwadar_mercado.tokens as tk (cg_id, visto_el)
                  select e.cg_id, p_respondido from e
                   where not exists (select 1 from rwadar_mercado.tokens t0 where t0.cg_id = e.cg_id)
                  on conflict (cg_id) do update set visto_el = excluded.visto_el
                  returning tk.id, tk.cg_id),
       vistos as (update rwadar_mercado.tokens as tk set visto_el = p_respondido
                    from e where tk.cg_id = e.cg_id
                  returning tk.id, tk.cg_id),
       alta as (select n.id, n.cg_id from nuevos n union all select w.id, w.cg_id from vistos w),
       o5 as (insert into rwadar_mercado.obs_5m as o (token, cubo, t, valor)
              select a.id, floor(extract(epoch from e.t) / 300)::integer, e.t, e.valor
                from e join alta a on a.cg_id = e.cg_id
               where e.t > p_respondido - interval '49 hours'
              on conflict (token, cubo) do update set t = excluded.t, valor = excluded.valor
               where excluded.t >= o.t and (excluded.t, excluded.valor) is distinct from (o.t, o.valor)
              returning 1),
       o1 as (insert into rwadar_mercado.obs_1h as o (token, cubo, t, valor)
              select a.id, floor(extract(epoch from e.t) / 3600)::integer, e.t, e.valor
                from e join alta a on a.cg_id = e.cg_id
               where e.t > p_respondido - interval '35 days'
              on conflict (token, cubo) do update set t = excluded.t, valor = excluded.valor
               where excluded.t >= o.t and (excluded.t, excluded.valor) is distinct from (o.t, o.valor)
              returning 1)
  select (select count(*) from o5) + (select count(*) from o1) into v_guardados;
  -- Este cubo de 5 minutos tuvo lectura buena.
  insert into rwadar_mercado.lecturas (cubo, leida_el)
  values (floor(extract(epoch from p_respondido) / 300)::integer, p_respondido)
  on conflict (cubo) do update set leida_el = greatest(rwadar_mercado.lecturas.leida_el, excluded.leida_el);
  return jsonb_build_object('validos', v_validos, 'guardados', v_guardados);
end
$funcion$;

-- Un token con su historia de market_chart (sembrar-directo.mjs):
-- {"id", "primera": "AAAA-MM-DD" | null, "obs5": [[ms, valor], …],
--  "obs1h": [[ms, valor], …]}. Mismas validaciones y misma inserción que
-- guardar_mercados (el último dato de cada cubo). Devuelve cuántos guardó.
create or replace function rwadar_mercado.sembrar(p_datos jsonb) returns integer
language plpgsql security definer set search_path = '' as $funcion$
declare
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_cg text := p_datos->>'id';
  v_primera date;
  v_id smallint;
  v_n integer := 0;
  v_m integer;
begin
  if jsonb_typeof(p_datos) <> 'object' or v_cg is null or v_cg !~ '^[a-z0-9][a-z0-9-]{0,99}$'
     or jsonb_typeof(p_datos->'obs5') is distinct from 'array' or jsonb_typeof(p_datos->'obs1h') is distinct from 'array'
     or jsonb_array_length(p_datos->'obs5') > 5000 or jsonb_array_length(p_datos->'obs1h') > 5000 then
    raise exception 'siembra_no_valida';
  end if;
  if jsonb_typeof(p_datos->'primera') = 'string' then
    if (p_datos->>'primera') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'siembra_no_valida'; end if;
    v_primera := (p_datos->>'primera')::date;
  end if;
  -- RWAdar 37: solo los cg_id nuevos piden id a la secuencia (corte del 16/11).
  update rwadar_mercado.tokens as tk set primera = v_primera, visto_el = v_ahora
   where tk.cg_id = v_cg
  returning tk.id into v_id;
  if v_id is null then
    insert into rwadar_mercado.tokens as tk (cg_id, primera, visto_el) values (v_cg, v_primera, v_ahora)
    on conflict (cg_id) do update set primera = excluded.primera, visto_el = excluded.visto_el
    returning tk.id into v_id;
  end if;
  -- Del mismo cubo, el último dato (en empate de hora, el que va después
  -- en la lista, como construirSerieFina). obs5 solo va a obs_5m y obs1h
  -- solo a obs_1h: así la siembra da exactamente lo que daría el flujo
  -- diario con las mismas lecturas.
  with p as (
    select s.tabla, s.o, to_timestamp((s.e->>0)::double precision / 1000) as t, (s.e->>1)::numeric as v
      from (select '5m' as tabla, x.e, x.o from jsonb_array_elements(p_datos->'obs5') with ordinality x(e, o)
            union all
            select '1h', x.e, x.o from jsonb_array_elements(p_datos->'obs1h') with ordinality x(e, o)) s
     where jsonb_typeof(s.e) = 'array' and jsonb_array_length(s.e) = 2
       and jsonb_typeof(s.e->0) = 'number' and jsonb_typeof(s.e->1) = 'number'
       and (s.e->>0)::numeric between 0 and 4102444800000),
   v as (select * from p where p.v > 0 and p.v < 1e14 and p.t > v_ahora - interval '40 days' and p.t <= v_ahora + interval '10 minutes'),
   o5 as (insert into rwadar_mercado.obs_5m as o (token, cubo, t, valor)
          select v_id, d.cubo, d.t, d.valor from (
            select distinct on (floor(extract(epoch from v.t) / 300)) floor(extract(epoch from v.t) / 300)::integer as cubo, v.t, v.v::double precision as valor
              from v where v.tabla = '5m' and v.t > v_ahora - interval '49 hours'
             order by floor(extract(epoch from v.t) / 300), v.t desc, v.o desc) d
          on conflict (token, cubo) do update set t = excluded.t, valor = excluded.valor
           where excluded.t >= o.t and (excluded.t, excluded.valor) is distinct from (o.t, o.valor)
          returning 1),
   o1 as (insert into rwadar_mercado.obs_1h as o (token, cubo, t, valor)
          select v_id, d.cubo, d.t, d.valor from (
            select distinct on (floor(extract(epoch from v.t) / 3600)) floor(extract(epoch from v.t) / 3600)::integer as cubo, v.t, v.v::double precision as valor
              from v where v.tabla = '1h' and v.t > v_ahora - interval '35 days'
             order by floor(extract(epoch from v.t) / 3600), v.t desc, v.o desc) d
          on conflict (token, cubo) do update set t = excluded.t, valor = excluded.valor
           where excluded.t >= o.t and (excluded.t, excluded.valor) is distinct from (o.t, o.valor)
          returning 1)
  select (select count(*) from o5) + (select count(*) from o1) into v_n;
  return v_n;
end
$funcion$;

-- El final de la siembra: la lista de la diaria que leyó, su «generado» y
-- hasta dónde llega la historia completa (el último dato de market_chart).
-- Rehace el documento con esa hora.
create or replace function rwadar_mercado.cerrar_siembra(p_tokens jsonb, p_diaria_generado timestamptz, p_hasta timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $funcion$
declare
  v_tokens text[];
  v_ahora timestamptz := rwadar_mercado.reloj();
begin
  if jsonb_typeof(p_tokens) is distinct from 'array' or jsonb_array_length(p_tokens) not between 1 and 250
     or exists (select 1 from jsonb_array_elements(p_tokens) e where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[a-z0-9][a-z0-9-]{0,99}$')
     or p_diaria_generado is null or p_hasta is null or p_hasta > v_ahora + interval '10 minutes' or p_hasta < v_ahora - interval '2 hours' then
    raise exception 'siembra_no_valida';
  end if;
  select array_agg(e #>> '{}' order by o) into v_tokens from jsonb_array_elements(p_tokens) with ordinality x(e, o);
  if (select count(distinct t) from unnest(v_tokens) t) <> cardinality(v_tokens) then raise exception 'siembra_no_valida'; end if;
  -- RWAdar 37: solo los cg_id nuevos piden id a la secuencia (corte del 16/11).
  insert into rwadar_mercado.tokens (cg_id)
  select t from unnest(v_tokens) t
   where not exists (select 1 from rwadar_mercado.tokens tk where tk.cg_id = t)
  on conflict (cg_id) do nothing;
  update rwadar_mercado.configuracion
     set tokens = v_tokens, diaria_generado = p_diaria_generado, diaria_leida_el = v_ahora,
         sembrado_hasta = greatest(coalesce(sembrado_hasta, p_hasta), p_hasta), sembrado_el = v_ahora
   where unica;
  return rwadar_mercado.construir(greatest(p_hasta, coalesce((select d.generado from rwadar_mercado.directo d where d.unica), p_hasta)));
end
$funcion$;

-- ---------------------------------------------------------------------
-- 2 · La identidad, en max(id) + 1 (la de producción estaba agotada)
-- ---------------------------------------------------------------------
do $secuencia$
declare
  v_siguiente integer;
begin
  select coalesce(max(id), 0) + 1 into v_siguiente from rwadar_mercado.tokens;
  execute format('alter table rwadar_mercado.tokens alter column id restart with %s', v_siguiente);
end
$secuencia$;

-- ---------------------------------------------------------------------
-- 3 · Permisos: los mismos de la 35 (nada para los clientes)
-- ---------------------------------------------------------------------
revoke all on all tables in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_mercado from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
