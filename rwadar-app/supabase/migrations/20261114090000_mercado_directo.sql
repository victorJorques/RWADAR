-- =====================================================================
-- RWAdar 35 · «La tokenización en el mundo» en directo
-- ---------------------------------------------------------------------
-- Decisión de la dirección (13/11/2026): «Supabase pregunta a CoinGecko
-- cada 5 minutos (una sola consulta para los 250 tokens) y guarda el punto.
-- La web y la app lo leen directamente, sin publicar nada.»
-- Copia idéntica: supabase/migrations/20261114090000_mercado_directo.sql.
--
-- Aplicarla es tocar Supabase en línea: solo con orden expresa de la dirección,
-- con el flujo «Mercado en directo (base)» (ensayo-35, aplicar-35 y
-- verificar-35). Nunca con `supabase db push`. No depende de las
-- migraciones 01-34 ni toca nada suyo: solo crea el esquema
-- rwadar_mercado y la función pública tokenizacion_directo().
--
-- No enciende nada ni crea relojes: eso es 35_mercado_directo_encender.sql
-- (exige una siembra de menos de 30 minutos). Apagar:
-- 35_mercado_directo_apagar.sql. Quitarlo todo:
-- 35_mercado_directo_deshacer.sql. Contrato completo:
-- docs/tareas/MERCADO-DIRECTO-2026-11-14.md.
--
-- Cómo funciona, en llano:
--   1 · pedir() (reloj rwadar-mercado-pedir, minutos 3, 8, 13…): como mucho
--       UNA llamada a CoinGecko por ranura de 5 minutos y nunca dos a menos
--       de 240 s (/coins/markets de la categoría, 250 tokens). Cada 15
--       minutos pide además la serie diaria publicada (rwadar.pages.dev),
--       de la que saca la lista de tokens que suma la web.
--   2 · leer() (reloj rwadar-mercado-leer, un minuto después): lee la
--       respuesta que guardó pg_net, guarda el dato de cada token (los 60
--       mayores y los de la diaria), apunta que en ese cubo de 5 minutos
--       hubo lectura buena, rehace las dos series con la misma regla que
--       construirSerieFina (rwadar-movil/lib/tokenizacion.js) y limpia lo
--       viejo una vez por hora. Ante un 429 o un fallo, espera (contada
--       desde la petición, no desde la lectura).
--   3 · La regla cuenta la edad del dato de cada token SOLO en los cubos
--       en que el directo leyó bien (o que cubre la siembra): si el que
--       falla es el propio directo (Supabase parado, una racha de 429),
--       no se culpa a CoinGecko ni se deja a nadie fuera; esos cubos van en
--       «sinLectura» y la web lo dice.
--   4 · public.tokenizacion_directo(): lo único que pueden llamar anon y
--       authenticated. Devuelve {"estado":"apagado"}, {"estado":"sin_datos"}
--       o {"estado":"ok","doc":…} con el documento compacto (§3.6 del
--       contrato). La lee el servidor de la web (/api/tokenizacion/directo).
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('net._http_response') is null
     or to_regprocedure('net.http_get(text,jsonb,jsonb,integer)') is null
     or (select count(*) from pg_attribute
          where attrelid = to_regclass('net._http_response') and not attisdropped and attnum > 0
            and attname in ('id', 'status_code', 'headers', 'content', 'timed_out', 'error_msg', 'created')) <> 7 then
    raise exception using errcode = '55000', message = 'RWAdar 35: faltan pg_net o pg_cron (net.http_get y net._http_response)';
  end if;
  if to_regclass('cron.job') is null
     or to_regprocedure('cron.schedule(text,text,text)') is null then
    raise exception using errcode = '55000', message = 'RWAdar 35: faltan pg_net o pg_cron (cron.schedule y cron.job)';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que toman pedir() y leer(): ninguna vuelta del reloj
-- corre a medias con las funciones viejas y las nuevas.
select pg_advisory_xact_lock(20261113, 35);

-- ---------------------------------------------------------------------
-- 1 · Esquema y tablas (sin ningún permiso para los clientes)
-- ---------------------------------------------------------------------
create schema if not exists rwadar_mercado;
revoke all on schema rwadar_mercado from public, anon, authenticated, service_role;

-- Una sola fila: el interruptor, la lista de la diaria y el estado del reloj.
create table if not exists rwadar_mercado.configuracion (
  unica boolean primary key default true check (unica),
  encendido boolean not null default false,
  -- Los tokens de la diaria publicada, en su orden (el de la suma).
  tokens text[] not null default '{}' check (cardinality(tokens) <= 250),
  diaria_generado timestamptz,
  diaria_leida_el timestamptz,
  diaria_peticion bigint,
  diaria_pedida_el timestamptz,
  -- La petición a CoinGecko en vuelo.
  peticion_id bigint,
  pedido_el timestamptz,
  ultimo_pedido_el timestamptz,
  reintentar_desde timestamptz,
  fallos_seguidos integer not null default 0 check (fallos_seguidos >= 0),
  seguidos_429 integer not null default 0 check (seguidos_429 >= 0),
  -- Hasta dónde llega la historia completa de la siembra (market_chart).
  sembrado_hasta timestamptz,
  sembrado_el timestamptz,
  limpiado_el timestamptz,
  -- Llamadas a CoinGecko del mes (por si un día se usa la clave Demo).
  mes date,
  llamadas_mes integer not null default 0 check (llamadas_mes >= 0)
);
insert into rwadar_mercado.configuracion (unica) values (true) on conflict (unica) do nothing;

-- Ids cortos para las observaciones.
create table if not exists rwadar_mercado.tokens (
  id smallint generated always as identity primary key,
  cg_id text not null unique check (cg_id ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  -- Solo si la siembra vio que CoinGecko lo sigue desde dentro de la ventana.
  primera date,
  visto_el timestamptz
);

-- Un dato por token y cubo de 5 minutos: el último. 49 horas.
create table if not exists rwadar_mercado.obs_5m (
  token smallint not null references rwadar_mercado.tokens (id) on delete cascade,
  cubo integer not null,
  t timestamptz not null,
  valor double precision not null check (valor > 0 and valor < 1e14),
  primary key (token, cubo),
  check (cubo = floor(extract(epoch from t) / 300))
);
-- Un dato por token y hora: el último de la hora. 35 días.
create table if not exists rwadar_mercado.obs_1h (
  token smallint not null references rwadar_mercado.tokens (id) on delete cascade,
  cubo integer not null,
  t timestamptz not null,
  valor double precision not null check (valor > 0 and valor < 1e14),
  primary key (token, cubo),
  check (cubo = floor(extract(epoch from t) / 3600))
);
-- Los cubos de 5 minutos en que el directo leyó bien a CoinGecko (la hora
-- de su respuesta). Solo en ellos (y en lo que cubre la siembra) cuenta la
-- edad del dato de cada token. 35 días.
create table if not exists rwadar_mercado.lecturas (
  cubo integer primary key,
  leida_el timestamptz not null
);
-- El documento que se sirve (§3.6 del contrato).
create table if not exists rwadar_mercado.directo (
  unica boolean primary key default true check (unica),
  generado timestamptz not null,
  doc jsonb not null check (octet_length(doc::text) <= 65536)
);
-- Una fila por llamada a CoinGecko, 7 días: el verificador comprueba con
-- ella que nunca hubo dos a menos de 240 s.
create table if not exists rwadar_mercado.registro (
  id bigint generated always as identity primary key,
  peticion bigint,
  pedido_el timestamptz not null,
  leido_el timestamptz,
  estado integer,
  bytes integer,
  validos integer,
  guardados integer,
  prueba boolean not null default false,
  error text check (error ~ '^[a-z_0-9]{1,40}$')
);
create index if not exists registro_pedido_el on rwadar_mercado.registro (pedido_el);

alter table rwadar_mercado.configuracion enable row level security;
alter table rwadar_mercado.tokens enable row level security;
alter table rwadar_mercado.obs_5m enable row level security;
alter table rwadar_mercado.obs_1h enable row level security;
alter table rwadar_mercado.lecturas enable row level security;
alter table rwadar_mercado.directo enable row level security;
alter table rwadar_mercado.registro enable row level security;

-- ---------------------------------------------------------------------
-- 2 · Ayudas
-- ---------------------------------------------------------------------
-- La hora. Una sola función para que las pruebas puedan mover el reloj.
create or replace function rwadar_mercado.reloj() returns timestamptz
language sql stable security definer set search_path = '' as $funcion$
  select now()
$funcion$;

-- «AAAA-MM-DDTHH:MMZ» y «AAAA-MM-DDTHH:MM:SSZ» en UTC.
create or replace function rwadar_mercado.iso_minuto(p_segundos bigint) returns text
language sql immutable security definer set search_path = '' as $funcion$
  select to_char(to_timestamp(p_segundos) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"')
$funcion$;
create or replace function rwadar_mercado.iso_segundo(p_hora timestamptz) returns text
language sql immutable security definer set search_path = '' as $funcion$
  select to_char(p_hora at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
$funcion$;

-- Una hora ISO en UTC (como la manda CoinGecko) o null si no lo es.
create or replace function rwadar_mercado.hora_iso(p_texto text) returns timestamptz
language plpgsql immutable security definer set search_path = '' as $funcion$
begin
  if p_texto is null or p_texto !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$' then return null; end if;
  return p_texto::timestamptz;
exception when others then
  return null;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 3 · La lista de la diaria publicada
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
  insert into rwadar_mercado.tokens (cg_id) select t from unnest(v_tokens) t on conflict (cg_id) do nothing;
  select tokens is distinct from v_tokens or diaria_generado is distinct from v_generado into v_cambia
    from rwadar_mercado.configuracion where unica;
  update rwadar_mercado.configuracion
     set tokens = v_tokens, diaria_generado = v_generado, diaria_leida_el = rwadar_mercado.reloj()
   where unica;
  return coalesce(v_cambia, false);
end
$funcion$;

-- ---------------------------------------------------------------------
-- 4 · La lista de CoinGecko (/coins/markets)
-- ---------------------------------------------------------------------
-- Los elementos válidos de la lista: id, market_cap (número entre 0 y
-- 1e14) y last_updated (ISO en UTC); de un id repetido, el primero. La hora
-- del dato es last_updated, y nunca posterior a la respuesta.
create or replace function rwadar_mercado.validos_mercados(p_lista jsonb, p_respondido timestamptz)
returns table (cg_id text, valor double precision, t timestamptz, pos bigint)
language sql stable security definer set search_path = '' as $funcion$
  select distinct on (x.id) x.id, x.mc::double precision, least(x.lu, p_respondido), x.pos
    from (select e.value->>'id' as id,
                 case when jsonb_typeof(e.value->'market_cap') = 'number' then (e.value->'market_cap')::numeric end as mc,
                 rwadar_mercado.hora_iso(e.value->>'last_updated') as lu, e.ordinality as pos
            from jsonb_array_elements(case when jsonb_typeof(p_lista) = 'array' then p_lista else '[]'::jsonb end)
                 with ordinality as e
           where jsonb_typeof(e.value) = 'object') x
   where x.id ~ '^[a-z0-9][a-z0-9-]{0,99}$' and x.mc > 0 and x.mc < 1e14 and x.lu is not null
   order by x.id, x.pos
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
       alta as (insert into rwadar_mercado.tokens as tk (cg_id, visto_el)
                select e.cg_id, p_respondido from e
                on conflict (cg_id) do update set visto_el = excluded.visto_el
                returning tk.id, tk.cg_id),
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

-- ---------------------------------------------------------------------
-- 5 · La regla de la suma (la misma que construirSerieFina)
-- ---------------------------------------------------------------------
-- p_clave: '5m' (cubos de 300 s, ventana de 24 h, arrastre de 288 cubos)
-- o '1h' (3600 s, 30 días, 72 cubos). Tokens: los de configuracion, en su
-- orden. Devuelve la serie compacta o null si ese día no sale (pocos
-- puntos, todos fuera o los de fuera pesan más del 1 %).
--   - hasta: el cubo más reciente de cualquier token; desde: una ventana
--     antes; primer día: el día UTC de desde.
--   - Un token «nuevo» (primera ≥ primer día) empieza en su primer dato.
--   - Edad del dato que vale en cada cubo (b menos el cubo de su último
--     dato ≤ b; sin dato anterior, infinita), SOLO en los cubos con
--     lectura buena del directo o cubiertos por la siembra. Más que el
--     arrastre: fuera de la serie. Más de 1 hora: «largos».
--   - Cada cubo: suma, en el orden de los tokens, del último dato ≤ b de
--     los de dentro; redondeo floor(x + 0.5) (Math.round en positivos).
--   - valorFuera: suma del último valor de los de fuera (si un token no
--     tiene ningún dato en esta tabla, el último de la otra; si tampoco,
--     la serie no sale).
create or replace function rwadar_mercado.serie(p_clave text) returns jsonb
language plpgsql stable security definer set search_path = '' as $funcion$
declare
  v_paso integer; v_ventana integer; v_arrastre integer; v_largo integer;
  v_tokens text[]; v_k integer; v_sembrado bigint;
  v_cubos integer[] := '{}'; v_valores double precision[] := '{}';
  v_ini integer[] := '{}'; v_fin integer[] := '{}'; v_primera date[] := '{}'; v_ultimo_externo double precision[] := '{}';
  v_c integer[]; v_v double precision[]; v_id smallint; v_prim date; v_ext double precision;
  v_hasta integer; v_desde integer; v_primer_dia bigint;
  v_cubierto boolean[]; v_lect integer[];
  v_fuera boolean[]; v_largo_tok boolean[]; v_nuevo boolean[]; v_j integer[];
  i integer; b integer; j integer; v_edad bigint; v_edad_max bigint; v_inicio integer;
  v_suma double precision; v_n integer; v_hay_dentro boolean := false;
  v_puntos bigint[] := '{}'; v_ns integer[] := '{}'; v_desde_puntos integer;
  v_vf double precision := 0; v_ultimo bigint; v_pct double precision;
  v_lista_fuera text[] := '{}'; v_lista_largos text[] := '{}';
  v_tramos jsonb := '[]'; v_hueco integer; v_n_json jsonb := '[]'; v_veces integer; v_tok_n integer;
begin
  if p_clave = '5m' then v_paso := 300; v_ventana := 288; v_arrastre := 288; v_largo := 12;
  elsif p_clave = '1h' then v_paso := 3600; v_ventana := 720; v_arrastre := 72; v_largo := 1;
  else raise exception 'resolucion_no_valida';
  end if;
  select c.tokens, floor(extract(epoch from c.sembrado_hasta))::bigint into v_tokens, v_sembrado
    from rwadar_mercado.configuracion c where c.unica;
  v_k := coalesce(cardinality(v_tokens), 0);
  if v_k = 0 then return null; end if;

  -- Los datos de cada token, seguidos en dos listas planas (ini..fin).
  for i in 1 .. v_k loop
    select tk.id, tk.primera into v_id, v_prim from rwadar_mercado.tokens tk where tk.cg_id = v_tokens[i];
    v_c := null; v_v := null; v_ext := null;
    if v_id is not null then
      if p_clave = '5m' then
        select array_agg(o.cubo order by o.cubo), array_agg(o.valor order by o.cubo) into v_c, v_v
          from rwadar_mercado.obs_5m o where o.token = v_id;
        if v_c is null then
          select o.valor into v_ext from rwadar_mercado.obs_1h o where o.token = v_id order by o.cubo desc limit 1;
        end if;
      else
        select array_agg(o.cubo order by o.cubo), array_agg(o.valor order by o.cubo) into v_c, v_v
          from rwadar_mercado.obs_1h o where o.token = v_id;
        if v_c is null then
          select o.valor into v_ext from rwadar_mercado.obs_5m o where o.token = v_id order by o.cubo desc limit 1;
        end if;
      end if;
    end if;
    v_primera := v_primera || v_prim;
    v_ultimo_externo := v_ultimo_externo || v_ext;
    if v_c is null then
      -- Sin ningún dato en esta tabla: fuera, con el último de la otra.
      if v_ext is null then return null; end if;
      v_ini := v_ini || 0; v_fin := v_fin || -1;
    else
      v_ini := v_ini || (cardinality(v_cubos) + 1);
      v_cubos := v_cubos || v_c; v_valores := v_valores || v_v;
      v_fin := v_fin || cardinality(v_cubos);
    end if;
    v_id := null; v_prim := null;
  end loop;

  v_hasta := null;
  for i in 1 .. v_k loop
    if v_fin[i] >= 1 and (v_hasta is null or v_cubos[v_fin[i]] > v_hasta) then v_hasta := v_cubos[v_fin[i]]; end if;
  end loop;
  if v_hasta is null then return null; end if;
  v_desde := v_hasta - v_ventana;
  v_primer_dia := floor(v_desde::bigint * v_paso / 86400) * 86400;

  -- Cubos con lectura buena del directo o cubiertos por la siembra.
  select coalesce(array_agg(distinct (l.cubo::bigint * 300 / v_paso)::integer), '{}') into v_lect
    from rwadar_mercado.lecturas l
   where l.cubo::bigint * 300 >= v_desde::bigint * v_paso and l.cubo::bigint * 300 < (v_hasta::bigint + 1) * v_paso;
  v_cubierto := array_fill(false, array[v_hasta - v_desde + 1]);
  for b in v_desde .. v_hasta loop
    if (v_sembrado is not null and b::bigint <= v_sembrado / v_paso) then v_cubierto[b - v_desde + 1] := true; end if;
  end loop;
  foreach b in array v_lect loop
    if b between v_desde and v_hasta then v_cubierto[b - v_desde + 1] := true; end if;
  end loop;

  -- La edad del dato de cada token, cubo a cubo (solo los cubiertos).
  v_fuera := array_fill(false, array[v_k]); v_largo_tok := array_fill(false, array[v_k]);
  v_nuevo := array_fill(false, array[v_k]); v_j := array_fill(0, array[v_k]);
  for i in 1 .. v_k loop
    if v_fin[i] < 1 then v_fuera[i] := true; continue; end if;
    v_nuevo[i] := v_primera[i] is not null and extract(epoch from v_primera[i])::bigint >= v_primer_dia;
    v_inicio := case when v_nuevo[i] then greatest(v_desde, v_cubos[v_ini[i]]) else v_desde end;
    j := v_ini[i] - 1; v_edad_max := 0;
    for b in v_desde .. v_hasta loop
      while j + 1 <= v_fin[i] and v_cubos[j + 1] <= b loop j := j + 1; end loop;
      continue when b < v_inicio or not v_cubierto[b - v_desde + 1];
      if j < v_ini[i] then v_edad_max := 9223372036854775807; exit; end if;
      v_edad := b - v_cubos[j];
      if v_edad > v_edad_max then v_edad_max := v_edad; end if;
    end loop;
    v_fuera[i] := v_edad_max > v_arrastre;
    v_largo_tok[i] := not v_fuera[i] and v_edad_max > v_largo;
    if not v_fuera[i] then v_hay_dentro := true; end if;
  end loop;
  if not v_hay_dentro then return null; end if;

  -- Cada cubo: la suma, en el orden de los tokens, de los de dentro.
  for i in 1 .. v_k loop v_j[i] := v_ini[i] - 1; end loop;
  for b in v_desde .. v_hasta loop
    v_suma := 0; v_n := 0;
    for i in 1 .. v_k loop
      continue when v_fuera[i];
      j := v_j[i];
      while j + 1 <= v_fin[i] and v_cubos[j + 1] <= b loop j := j + 1; end loop;
      v_j[i] := j;
      continue when j < v_ini[i] or (v_nuevo[i] and b < v_cubos[v_ini[i]]);
      v_suma := v_suma + v_valores[j]; v_n := v_n + 1;
    end loop;
    if v_n > 0 then
      if cardinality(v_puntos) = 0 then v_desde_puntos := b; end if;
      v_puntos := v_puntos || floor(v_suma + 0.5)::bigint;
      v_ns := v_ns || v_n;
    end if;
  end loop;
  if cardinality(v_puntos) < 2 then return null; end if;

  for i in 1 .. v_k loop
    if v_fuera[i] then
      v_lista_fuera := v_lista_fuera || v_tokens[i];
      v_vf := v_vf + case when v_fin[i] >= 1 then v_valores[v_fin[i]] else v_ultimo_externo[i] end;
    elsif v_largo_tok[i] then
      v_lista_largos := v_lista_largos || v_tokens[i];
    end if;
  end loop;
  v_vf := floor(v_vf + 0.5);
  v_ultimo := v_puntos[cardinality(v_puntos)];
  v_pct := floor(v_vf / (v_ultimo + v_vf) * 100 * 100 + 0.5) / 100;
  if v_pct > 1 then return null; end if;

  -- Tramos [veces, tokens] de n, y los tramos sin lectura del directo.
  v_veces := 0; v_tok_n := null;
  for i in 1 .. cardinality(v_ns) loop
    if v_ns[i] = v_tok_n then v_veces := v_veces + 1;
    else
      if v_tok_n is not null then v_n_json := v_n_json || jsonb_build_array(jsonb_build_array(v_veces, v_tok_n)); end if;
      v_tok_n := v_ns[i]; v_veces := 1;
    end if;
  end loop;
  v_n_json := v_n_json || jsonb_build_array(jsonb_build_array(v_veces, v_tok_n));
  v_hueco := null;
  for b in v_desde_puntos .. v_hasta + 1 loop
    if b <= v_hasta and not v_cubierto[b - v_desde + 1] then
      if v_hueco is null then v_hueco := b; end if;
    elsif v_hueco is not null then
      v_tramos := v_tramos || jsonb_build_array(jsonb_build_array(
        rwadar_mercado.iso_minuto(v_hueco::bigint * v_paso), rwadar_mercado.iso_minuto((b - 1)::bigint * v_paso)));
      v_hueco := null;
    end if;
  end loop;
  if jsonb_array_length(v_tramos) > 20 then
    v_tramos := (select jsonb_agg(x.e order by x.o) from jsonb_array_elements(v_tramos) with ordinality x(e, o)
                  where x.o > jsonb_array_length(v_tramos) - 20);
  end if;

  return jsonb_build_object(
    'desde', rwadar_mercado.iso_minuto(v_desde_puntos::bigint * v_paso),
    'arrastre', v_arrastre,
    'fuera', to_jsonb(v_lista_fuera),
    'valorFuera', v_vf::bigint,
    'largos', to_jsonb(v_lista_largos),
    'valores', to_jsonb(v_puntos),
    'n', v_n_json,
    'sinLectura', v_tramos);
end
$funcion$;

-- El documento compacto, con la hora del dato (la de la respuesta de
-- CoinGecko o la del último dato de la siembra), nunca now(). true si se
-- guardó.
create or replace function rwadar_mercado.construir(p_generado timestamptz) returns boolean
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  v_doc jsonb;
begin
  select * into c from rwadar_mercado.configuracion where unica;
  if not found or cardinality(c.tokens) = 0 or c.diaria_generado is null or p_generado is null then return false; end if;
  v_doc := jsonb_build_object(
    'v', 1,
    'generado', rwadar_mercado.iso_segundo(p_generado),
    'diaria', rwadar_mercado.iso_segundo(c.diaria_generado),
    'diariaLeida', rwadar_mercado.iso_segundo(c.diaria_leida_el),
    'tokens', to_jsonb(c.tokens),
    'series', jsonb_build_object('5m', rwadar_mercado.serie('5m'), '1h', rwadar_mercado.serie('1h')));
  insert into rwadar_mercado.directo (unica, generado, doc) values (true, p_generado, v_doc)
  on conflict (unica) do update set generado = excluded.generado, doc = excluded.doc;
  return true;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 6 · Pedir y leer (los dos relojes)
-- ---------------------------------------------------------------------
-- Una petición a CoinGecko, si toca: nunca dos en la misma ranura de 5
-- minutos (las que empiezan en el minuto 3, 8, 13…) ni a menos de 240 s,
-- ni durante una espera tras fallos, ni con otra en vuelo de menos de 2
-- minutos. Una en vuelo más vieja se da por perdida y cuenta como fallo.
create or replace function rwadar_mercado.pedir_coingecko(p_prueba boolean) returns text
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_cabeceras jsonb := '{"accept": "application/json", "user-agent": "RWAdar/1.0 (+https://rwadar.pages.dev)"}';
  v_clave text;
  v_id bigint;
  v_mes date := date_trunc('month', v_ahora at time zone 'UTC')::date;
begin
  select * into c from rwadar_mercado.configuracion where unica for update;
  -- Nunca dos en la misma ranura ni a menos de 240 s (sin tocar nada).
  if c.ultimo_pedido_el is not null
     and (floor((extract(epoch from c.ultimo_pedido_el) - 180) / 300) >= floor((extract(epoch from v_ahora) - 180) / 300)
          or c.ultimo_pedido_el > v_ahora - interval '240 seconds') then
    return 'pronto';
  end if;
  if c.peticion_id is not null then
    if c.pedido_el > v_ahora - interval '2 minutes' then return 'pendiente'; end if;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = 0, error = 'sin_respuesta'
     where peticion = c.peticion_id and leido_el is null;
    update rwadar_mercado.configuracion
       set peticion_id = null, pedido_el = null, seguidos_429 = 0,
           fallos_seguidos = fallos_seguidos + 1,
           reintentar_desde = case when fallos_seguidos + 1 >= 3
             then c.pedido_el + least(interval '15 minutes' * power(2, fallos_seguidos + 1 - 3), interval '60 minutes') - interval '30 seconds'
             else reintentar_desde end
     where unica
     returning * into c;
  end if;
  if c.reintentar_desde > v_ahora then return 'espera'; end if;
  -- La clave Demo de CoinGecko, solo si existe en Vault (§3.7 del contrato).
  begin
    select s.decrypted_secret into v_clave from vault.decrypted_secrets s where s.name = 'RWADAR_COINGECKO_DEMO' limit 1;
  exception when others then
    v_clave := null;
  end;
  if v_clave ~ '^[A-Za-z0-9_-]{10,100}$' then
    v_cabeceras := v_cabeceras || jsonb_build_object('x-cg-demo-api-key', v_clave);
  end if;
  v_id := net.http_get(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=tokenized-products&order=market_cap_desc&per_page=250',
    '{}'::jsonb, v_cabeceras, 20000);
  update rwadar_mercado.configuracion
     set peticion_id = v_id, pedido_el = v_ahora, ultimo_pedido_el = v_ahora,
         llamadas_mes = case when mes = v_mes then llamadas_mes + 1 else 1 end, mes = v_mes
   where unica;
  insert into rwadar_mercado.registro (peticion, pedido_el, prueba) values (v_id, v_ahora, p_prueba);
  return 'pedido';
end
$funcion$;

-- Reloj rwadar-mercado-pedir (minutos 3, 8, 13…).
create or replace function rwadar_mercado.pedir() returns text
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_id bigint;
begin
  perform pg_advisory_xact_lock(20261113, 35);
  select * into c from rwadar_mercado.configuracion where unica for update;
  if not found or not c.encendido then return 'apagado'; end if;
  -- La lista de la diaria publicada, cada 15 minutos (no es CoinGecko).
  if (c.diaria_leida_el is null or c.diaria_leida_el < v_ahora - interval '15 minutes')
     and (c.diaria_pedida_el is null or c.diaria_pedida_el < v_ahora - interval '2 minutes') then
    v_id := net.http_get('https://rwadar.pages.dev/datos/tokenizacion-serie.json', '{}'::jsonb,
      '{"accept": "application/json", "user-agent": "RWAdar/1.0 (+https://rwadar.pages.dev)"}'::jsonb, 10000);
    update rwadar_mercado.configuracion set diaria_peticion = v_id, diaria_pedida_el = v_ahora where unica;
  end if;
  return rwadar_mercado.pedir_coingecko(false);
end
$funcion$;

-- Lo que respondió CoinGecko a la petición en vuelo (si ya llegó): 429,
-- otro fallo o 200 (se guarda). Las esperas se cuentan desde la petición
-- (menos 30 s de margen para el reloj), no desde esta lectura:
--   429: el primero solo espera a la ranura siguiente, salvo que
--        Retry-After pida más; desde el segundo seguido, 10, 20, 40 y 60
--        minutos (o Retry-After, hasta 1 hora, si es más).
--   otro fallo (sin respuesta, 5xx, 4xx, JSON roto, lista corta…): desde
--        el tercero seguido, 15, 30 y 60 minutos.
create or replace function rwadar_mercado.leer_respuesta(p_guardar boolean) returns jsonb
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  r record;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_retry text;
  v_espera interval;
  v_estado integer;
  v_bytes integer;
  v_res jsonb;
  v_error text;
begin
  select * into c from rwadar_mercado.configuracion where unica for update;
  if c.peticion_id is null then return jsonb_build_object('coingecko', 'nada'); end if;
  select h.status_code, h.headers, h.content, h.timed_out, h.error_msg, h.created into r
    from net._http_response h where h.id = c.peticion_id;
  if not found then return jsonb_build_object('coingecko', 'esperando'); end if;
  v_estado := coalesce(r.status_code, 0);
  v_bytes := octet_length(r.content);
  if v_estado = 429 then
    select e.value into v_retry from jsonb_each_text(coalesce(r.headers, '{}')) e where lower(e.key) = 'retry-after' limit 1;
    v_espera := case when v_retry ~ '^\d{1,6}$' then make_interval(secs => least(v_retry::integer, 3600)) else interval '0' end;
    if c.seguidos_429 + 1 >= 2 then
      v_espera := greatest(v_espera, least(interval '5 minutes' * power(2, c.seguidos_429), interval '60 minutes'));
    end if;
    update rwadar_mercado.configuracion
       set peticion_id = null, pedido_el = null, seguidos_429 = seguidos_429 + 1,
           reintentar_desde = case when v_espera > interval '5 minutes' then c.pedido_el + v_espera - interval '30 seconds' else null end
     where unica;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = 429, bytes = v_bytes, error = 'demasiadas_peticiones'
     where peticion = c.peticion_id;
    return jsonb_build_object('coingecko', 429, 'espera_s', extract(epoch from v_espera)::integer, 'bytes', v_bytes);
  end if;
  if v_estado = 200 then
    begin
      if p_guardar then
        v_res := rwadar_mercado.guardar_mercados(r.content, coalesce(r.created, v_ahora));
      else
        -- La prueba (probar-coingecko) no guarda nada: solo cuenta.
        if octet_length(r.content) > 4194304 then raise exception 'demasiado_grande'; end if;
        select jsonb_build_object('validos', count(*), 'guardados', 0,
                 'mas_reciente', rwadar_mercado.iso_segundo(max(m.t)),
                 'primero', (array_agg(m.cg_id order by m.valor desc))[1])
          into v_res from rwadar_mercado.validos_mercados(r.content::jsonb, coalesce(r.created, v_ahora)) m;
      end if;
    exception when others then
      v_error := case when sqlerrm ~ '^[a-z_]{1,40}$' then sqlerrm else 'error_' || lower(sqlstate) end;
    end;
  else
    v_error := case when r.timed_out then 'sin_respuesta' when v_estado = 0 then 'sin_respuesta' else 'http_' || v_estado end;
  end if;
  if v_error is null then
    update rwadar_mercado.configuracion set peticion_id = null, pedido_el = null, fallos_seguidos = 0, seguidos_429 = 0,
           reintentar_desde = null where unica;
    update rwadar_mercado.registro set leido_el = v_ahora, estado = v_estado, bytes = v_bytes,
           validos = (v_res->>'validos')::integer, guardados = (v_res->>'guardados')::integer
     where peticion = c.peticion_id;
    return jsonb_build_object('coingecko', 200) || v_res || jsonb_build_object('respondido', coalesce(r.created, v_ahora), 'bytes', v_bytes);
  end if;
  update rwadar_mercado.configuracion
     set peticion_id = null, pedido_el = null, seguidos_429 = 0, fallos_seguidos = fallos_seguidos + 1,
         reintentar_desde = case when fallos_seguidos + 1 >= 3
           then c.pedido_el + least(interval '15 minutes' * power(2, fallos_seguidos + 1 - 3), interval '60 minutes') - interval '30 seconds'
           else null end
   where unica;
  update rwadar_mercado.registro set leido_el = v_ahora, estado = v_estado, bytes = v_bytes, error = v_error
   where peticion = c.peticion_id;
  return jsonb_build_object('coingecko', v_estado, 'error', v_error, 'bytes', v_bytes);
end
$funcion$;

-- Reloj rwadar-mercado-leer (minutos 4, 9, 14…). Cada paso en su propio
-- bloque: un fallo de uno no tumba los demás.
create or replace function rwadar_mercado.leer() returns jsonb
language plpgsql security definer set search_path = '' as $funcion$
declare
  c rwadar_mercado.configuracion%rowtype;
  v_ahora timestamptz := rwadar_mercado.reloj();
  v_res jsonb := '{}';
  v_paso jsonb;
  v_cambio boolean := false;
  v_contenido text;
  v_estado integer;
begin
  perform pg_advisory_xact_lock(20261113, 35);
  select * into c from rwadar_mercado.configuracion where unica;
  if not found then return '{"estado":"sin_configuracion"}'; end if;
  -- 1 · La diaria publicada (su lista de tokens).
  if c.diaria_peticion is not null then
    begin
      select h.status_code, h.content into v_estado, v_contenido from net._http_response h where h.id = c.diaria_peticion;
      if found then
        if v_estado = 200 and rwadar_mercado.guardar_diaria(v_contenido) then v_cambio := true; end if;
        update rwadar_mercado.configuracion set diaria_peticion = null where unica;
        v_res := v_res || jsonb_build_object('diaria', coalesce(v_estado, 0));
      elsif c.diaria_pedida_el < v_ahora - interval '2 minutes' then
        update rwadar_mercado.configuracion set diaria_peticion = null where unica;
      end if;
    exception when others then
      v_res := v_res || jsonb_build_object('fallo_diaria', sqlstate);
    end;
  end if;
  -- 2 · CoinGecko.
  begin
    v_paso := rwadar_mercado.leer_respuesta(true);
    v_res := v_res || v_paso;
  exception when others then
    v_res := v_res || jsonb_build_object('fallo_coingecko', sqlstate);
  end;
  -- 3 · Rehacer el documento con la hora de la respuesta buena (o, si solo
  --     cambió la lista, con la del documento que había).
  begin
    if v_paso->>'coingecko' = '200' and not v_paso ? 'error' then
      perform rwadar_mercado.construir((v_paso->>'respondido')::timestamptz);
      v_res := v_res || '{"construido": true}';
    elsif v_cambio then
      perform rwadar_mercado.construir((select d.generado from rwadar_mercado.directo d where d.unica));
      v_res := v_res || '{"construido": true}';
    end if;
  exception when others then
    v_res := v_res || jsonb_build_object('fallo_construir', sqlstate);
  end;
  -- 4 · Limpiar, una vez por hora.
  begin
    select * into c from rwadar_mercado.configuracion where unica;
    if c.limpiado_el is null or c.limpiado_el < v_ahora - interval '1 hour' then
      perform rwadar_mercado.limpiar();
      v_res := v_res || '{"limpiado": true}';
    end if;
  exception when others then
    v_res := v_res || jsonb_build_object('fallo_limpiar', sqlstate);
  end;
  return v_res;
end
$funcion$;

-- Borra lo que pasa de su retención: obs_5m 49 h, obs_1h y lecturas 35
-- días, registro 7 días y, de cron.job_run_details, solo las filas de los
-- dos relojes del directo de más de 7 días.
create or replace function rwadar_mercado.limpiar() returns void
language plpgsql security definer set search_path = '' as $funcion$
declare
  v_ahora timestamptz := rwadar_mercado.reloj();
begin
  delete from rwadar_mercado.obs_5m where cubo < floor(extract(epoch from v_ahora - interval '49 hours') / 300);
  delete from rwadar_mercado.obs_1h where cubo < floor(extract(epoch from v_ahora - interval '35 days') / 3600);
  delete from rwadar_mercado.lecturas where cubo < floor(extract(epoch from v_ahora - interval '35 days') / 300);
  delete from rwadar_mercado.registro where pedido_el < v_ahora - interval '7 days';
  update rwadar_mercado.configuracion set limpiado_el = v_ahora where unica;
  begin
    delete from cron.job_run_details d
     where d.jobid in (select j.jobid from cron.job j where j.jobname in ('rwadar-mercado-pedir', 'rwadar-mercado-leer'))
       and d.end_time < v_ahora - interval '7 days';
  exception when others then
    null;
  end;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 7 · La siembra (una vez, y tras un corte de más de 1 hora)
-- ---------------------------------------------------------------------
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
  insert into rwadar_mercado.tokens as tk (cg_id, primera, visto_el) values (v_cg, v_primera, v_ahora)
  on conflict (cg_id) do update set primera = excluded.primera, visto_el = excluded.visto_el
  returning tk.id into v_id;
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
  insert into rwadar_mercado.tokens (cg_id) select t from unnest(v_tokens) t on conflict (cg_id) do nothing;
  update rwadar_mercado.configuracion
     set tokens = v_tokens, diaria_generado = p_diaria_generado, diaria_leida_el = v_ahora,
         sembrado_hasta = greatest(coalesce(sembrado_hasta, p_hasta), p_hasta), sembrado_el = v_ahora
   where unica;
  return rwadar_mercado.construir(greatest(p_hasta, coalesce((select d.generado from rwadar_mercado.directo d where d.unica), p_hasta)));
end
$funcion$;

-- ---------------------------------------------------------------------
-- 8 · Probar CoinGecko desde la red de Supabase (con todo apagado)
-- ---------------------------------------------------------------------
-- Acción «probar-coingecko» del flujo: una sola llamada (con las mismas
-- reglas de ranura y espera) y, en otra transacción, qué respondió. No
-- guarda observaciones. Solo con el directo apagado (encendido, ya lo
-- hace el reloj).
create or replace function rwadar_mercado.probar_pedir() returns text
language plpgsql security definer set search_path = '' as $funcion$
begin
  perform pg_advisory_xact_lock(20261113, 35);
  if (select encendido from rwadar_mercado.configuracion where unica) then return 'encendido'; end if;
  return rwadar_mercado.pedir_coingecko(true);
end
$funcion$;
create or replace function rwadar_mercado.probar_leer() returns jsonb
language plpgsql security definer set search_path = '' as $funcion$
begin
  perform pg_advisory_xact_lock(20261113, 35);
  if (select encendido from rwadar_mercado.configuracion where unica) then return '{"coingecko":"encendido"}'; end if;
  return rwadar_mercado.leer_respuesta(false);
end
$funcion$;

-- ---------------------------------------------------------------------
-- 9 · La lectura pública (anon y authenticated)
-- ---------------------------------------------------------------------
create or replace function public.tokenizacion_directo() returns jsonb
language sql stable security definer set search_path = '' as $funcion$
  select case
    when not coalesce((select c.encendido from rwadar_mercado.configuracion c where c.unica), false) then '{"estado":"apagado"}'::jsonb
    when not exists (select 1 from rwadar_mercado.directo d where d.unica) then '{"estado":"sin_datos"}'::jsonb
    else jsonb_build_object('estado', 'ok', 'doc', (select d.doc from rwadar_mercado.directo d where d.unica))
  end
$funcion$;

-- ---------------------------------------------------------------------
-- 10 · Permisos: nada para los clientes salvo la lectura pública
-- ---------------------------------------------------------------------
revoke all on all tables in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_mercado from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_mercado from public, anon, authenticated, service_role;

revoke all on function public.tokenizacion_directo() from public, anon, authenticated, service_role;
grant execute on function public.tokenizacion_directo() to anon, authenticated;

notify pgrst, 'reload schema';
commit;
