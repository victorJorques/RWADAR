-- =====================================================================
-- RWAdar 35 · verificador: «La tokenización en el mundo» en directo
-- Solo lee: no pide nada a CoinGecko, no agenda y no devuelve secretos.
-- Cualquier desviación aborta con una excepción. Pasa con el directo
-- apagado (sin relojes) y encendido (exactamente sus dos relojes).
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_tabla text;
  v_funcion record;
  v_cfg record;
  v_relojes integer;
  v_malos integer;
  v_doc jsonb;
  v_cerca integer;
  v_viejas integer;
begin
  if to_regnamespace('rwadar_mercado') is null or to_regprocedure('public.tokenizacion_directo()') is null then
    raise exception '35: falta aplicar 35_mercado_directo.sql';
  end if;

  -- Las tablas, con RLS y sin ninguna política.
  foreach v_tabla in array array['configuracion', 'tokens', 'obs_5m', 'obs_1h', 'lecturas', 'directo', 'registro'] loop
    if to_regclass('rwadar_mercado.' || v_tabla) is null then
      raise exception '35: falta la tabla rwadar_mercado.%', v_tabla;
    end if;
    if not (select c.relrowsecurity from pg_class c where c.oid = ('rwadar_mercado.' || v_tabla)::regclass) then
      raise exception '35: rwadar_mercado.% sin RLS', v_tabla;
    end if;
  end loop;
  if exists (select 1 from pg_policies where schemaname = 'rwadar_mercado') then
    raise exception '35: hay políticas en rwadar_mercado (no debe haber ninguna)';
  end if;
  -- Claves y comprobaciones de las observaciones (un dato por token y cubo).
  if (select count(*) from pg_constraint
       where conrelid in ('rwadar_mercado.obs_5m'::regclass, 'rwadar_mercado.obs_1h'::regclass)
         and ((contype = 'p' and pg_get_constraintdef(oid) = 'PRIMARY KEY (token, cubo)')
              or (contype = 'c' and pg_get_constraintdef(oid) like '%valor > (0)%'
                  and (pg_get_constraintdef(oid) like '%100000000000000%' or pg_get_constraintdef(oid) like '%1e+14%'))
              or (contype = 'c' and pg_get_constraintdef(oid) ~ 'cubo\)?(::numeric)? = floor\(\(EXTRACT\(epoch FROM t\) / \(?(300|3600)\)?'))) <> 6 then
    raise exception '35: las claves o comprobaciones de obs_5m y obs_1h no son las esperadas';
  end if;

  -- Ningún permiso para los clientes en el esquema, sus tablas, secuencias y funciones.
  if has_schema_privilege('anon', 'rwadar_mercado', 'usage') or has_schema_privilege('authenticated', 'rwadar_mercado', 'usage')
     or has_schema_privilege('public', 'rwadar_mercado', 'usage') or has_schema_privilege('service_role', 'rwadar_mercado', 'usage') then
    raise exception '35: el esquema rwadar_mercado tiene permiso de uso para algún cliente';
  end if;
  if exists (select 1 from information_schema.role_table_grants
              where table_schema = 'rwadar_mercado' and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')) then
    raise exception '35: alguna tabla de rwadar_mercado tiene permisos para los clientes';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace, unnest(coalesce(c.relacl, '{}')) a
              where n.nspname = 'rwadar_mercado' and c.relkind = 'S'
                and (a::text like 'anon=%' or a::text like 'authenticated=%' or a::text like '=%' or a::text like 'service_role=%')) then
    raise exception '35: alguna secuencia de rwadar_mercado tiene permisos para los clientes';
  end if;
  for v_funcion in
    select p.oid, p.proname, p.prosecdef, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'rwadar_mercado'
  loop
    if not v_funcion.prosecdef then
      raise exception '35: rwadar_mercado.% no es security definer', v_funcion.proname;
    end if;
    if v_funcion.proconfig is distinct from array['search_path=""'] then
      raise exception '35: rwadar_mercado.% sin search_path vacío', v_funcion.proname;
    end if;
    if has_function_privilege('anon', v_funcion.oid, 'execute') or has_function_privilege('authenticated', v_funcion.oid, 'execute')
       or has_function_privilege('service_role', v_funcion.oid, 'execute') then
      raise exception '35: rwadar_mercado.% ejecutable por algún cliente', v_funcion.proname;
    end if;
  end loop;
  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'rwadar_mercado') < 18 then
    raise exception '35: faltan funciones de rwadar_mercado';
  end if;
  -- La lectura pública: security definer, search_path vacío y solo anon y authenticated.
  if not (select prosecdef and proconfig = array['search_path=""'] from pg_proc where oid = 'public.tokenizacion_directo()'::regprocedure)
     or not has_function_privilege('anon', 'public.tokenizacion_directo()', 'execute')
     or not has_function_privilege('authenticated', 'public.tokenizacion_directo()', 'execute')
     or has_function_privilege('service_role', 'public.tokenizacion_directo()', 'execute')
     or exists (select 1 from pg_proc p, unnest(coalesce(p.proacl, '{}')) a
                 where p.oid = 'public.tokenizacion_directo()'::regprocedure and a::text like '=%') then
    raise exception '35: public.tokenizacion_directo() con permisos incorrectos';
  end if;

  -- La configuración y los relojes: con el directo encendido, exactamente los dos.
  select * into v_cfg from rwadar_mercado.configuracion where unica;
  if not found then raise exception '35: falta la fila de configuracion'; end if;
  select count(*) into v_relojes from cron.job where jobname like 'rwadar-mercado-%' or command ilike '%rwadar_mercado.%';
  if v_cfg.encendido then
    select count(*) into v_malos from cron.job
     where (jobname = 'rwadar-mercado-pedir' and schedule = '3,8,13,18,23,28,33,38,43,48,53,58 * * * *'
            and command = 'select rwadar_mercado.pedir()' and active)
        or (jobname = 'rwadar-mercado-leer' and schedule = '4,9,14,19,24,29,34,39,44,49,54,59 * * * *'
            and command = 'select rwadar_mercado.leer()' and active);
    if v_relojes <> 2 or v_malos <> 2 then
      raise exception '35: encendido, pero los relojes no son exactamente rwadar-mercado-pedir y rwadar-mercado-leer (% de 2)', v_malos;
    end if;
  elsif v_relojes <> 0 then
    raise exception '35: apagado, pero quedan % relojes del directo', v_relojes;
  end if;

  -- Nada fuera de su retención (con 1 hora de margen: limpiar() va una vez por hora).
  select (select count(*) from rwadar_mercado.obs_5m where cubo < floor(extract(epoch from rwadar_mercado.reloj() - interval '50 hours') / 300))
       + (select count(*) from rwadar_mercado.obs_1h where cubo < floor(extract(epoch from rwadar_mercado.reloj() - interval '35 days 1 hour') / 3600))
       + (select count(*) from rwadar_mercado.registro where pedido_el < rwadar_mercado.reloj() - interval '7 days 1 hour')
    into v_viejas;
  if v_viejas > 0 and v_cfg.encendido then
    raise exception '35: hay % filas fuera de su retención (¿no corre limpiar()?)', v_viejas;
  end if;
  -- Nunca dos llamadas a CoinGecko a menos de 240 s.
  select count(*) into v_cerca from (
    select pedido_el - lag(pedido_el) over (order by pedido_el) as hueco from rwadar_mercado.registro
     where pedido_el > rwadar_mercado.reloj() - interval '48 hours') x
   where x.hueco < interval '240 seconds';
  if v_cerca > 0 then
    raise exception '35: % llamadas a CoinGecko a menos de 240 s de la anterior', v_cerca;
  end if;

  -- El documento, si lo hay: sus claves y los tokens de la configuración.
  select doc into v_doc from rwadar_mercado.directo where unica;
  if v_doc is not null and ((select string_agg(k, ',' order by k) from jsonb_object_keys(v_doc) k) <> 'diaria,diariaLeida,generado,series,tokens,v'
     or v_doc->'tokens' <> to_jsonb(v_cfg.tokens) or v_doc->'v' <> '1'::jsonb) then
    raise exception '35: el documento del directo no tiene la forma esperada o no es de la lista de la configuración';
  end if;

  raise notice 'RWAdar 35 OK: directo %, % relojes, % tokens en la lista, documento %',
    case when v_cfg.encendido then 'encendido' else 'apagado' end, v_relojes, cardinality(v_cfg.tokens),
    coalesce('de las ' || to_char((select d.generado from rwadar_mercado.directo d where d.unica) at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC', 'sin hacer');
end
$verificador$;

rollback;
