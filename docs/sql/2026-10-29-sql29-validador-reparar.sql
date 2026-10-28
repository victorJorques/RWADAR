do $rwadar29_guard$
declare f pg_proc%rowtype;
begin
  select * into f from pg_proc
    where oid=to_regprocedure('rwadar_cuentas_privadas.documento_cartera_valido(jsonb)');
  if f.oid is null then raise exception 'RWAdar29: no existe el validador esperado'; end if;
  if f.prosecdef is distinct from false or f.provolatile is distinct from 'i'
     or (f.proconfig is distinct from array['search_path=""']::text[]
         and f.proconfig is distinct from array['search_path=']::text[])
     or md5(pg_get_functiondef(f.oid)) is distinct from '246caa185809e4afaa6b5cdd3b6174d7' then
    raise exception 'RWAdar29: definicion o atributos distintos del corte remoto revisado';
  end if;
end
$rwadar29_guard$;

create or replace function rwadar_cuentas_privadas.documento_cartera_valido(d jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare p jsonb; m jsonb; ids text[] := '{}'; mids text[]; campo text;
begin
  if jsonb_typeof(d) is distinct from 'object' or d->'version' is distinct from '1'::jsonb
     or jsonb_typeof(d->'posiciones') is distinct from 'array'
     or octet_length(d::text) > 2000000
     or d - 'version' - 'posiciones' <> '{}'::jsonb then return false; end if;
  if jsonb_array_length(d->'posiciones') > 100 then return false; end if;
  for p in select value from jsonb_array_elements(d->'posiciones') loop
    if jsonb_typeof(p) is distinct from 'object'
       or not (p ?& array['id','nombre','proveedor','ofertaSlug','moneda','creadaEl','movimientos','valoracion'])
       or p - array['id','nombre','proveedor','ofertaSlug','moneda','creadaEl','movimientos','valoracion'] <> '{}'::jsonb then return false; end if;
    foreach campo in array array['id','nombre','proveedor','ofertaSlug','moneda','creadaEl'] loop
      if jsonb_typeof(p->campo) is distinct from 'string' or p->>campo ~ '[[:cntrl:]]' then return false; end if;
    end loop;
    if length(p->>'id') not between 1 and 100 or p->>'id'=any(ids)
       or length(p->>'nombre') not between 1 and 160 or length(p->>'proveedor')>120
       or length(p->>'ofertaSlug')>160 or p->>'moneda' not in ('EUR','USD','CHF','GBP','USDC','USDT')
       or p->>'creadaEl' !~ '^\d{4}-\d{2}-\d{2}$'
       or jsonb_typeof(p->'movimientos') is distinct from 'array' then return false; end if;
    ids := array_append(ids,p->>'id');
    if jsonb_array_length(p->'movimientos')>1000 then return false; end if;
    if p->'valoracion' <> 'null'::jsonb then
      if jsonb_typeof(p->'valoracion') is distinct from 'object'
         or not (p->'valoracion' ?& array['precio','fecha','origen'])
         or (p->'valoracion') - array['precio','fecha','origen'] <> '{}'::jsonb
         or p->'valoracion'->>'origen' is distinct from 'manual'
         or jsonb_typeof(p->'valoracion'->'precio') is distinct from 'string'
         or p->'valoracion'->>'precio' !~ '^\d{1,13}(\.\d{1,6})?$'
         or jsonb_typeof(p->'valoracion'->'fecha') is distinct from 'string'
         or p->'valoracion'->>'fecha' !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
    end if;
    mids := '{}';
    for m in select value from jsonb_array_elements(p->'movimientos') loop
      if jsonb_typeof(m) is distinct from 'object'
         or not (m ?& array['id','tipo','fecha']) then return false; end if;
      foreach campo in array array['id','tipo','fecha'] loop
        if jsonb_typeof(m->campo) is distinct from 'string' or m->>campo ~ '[[:cntrl:]]' then return false; end if;
      end loop;
      if length(m->>'id') not between 1 and 100 or m->>'id'=any(mids)
         or m->>'fecha' !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
      mids := array_append(mids,m->>'id');
      if m->>'tipo' in ('compra','venta') then
        if not (m ?& array['cantidad','precio','comision'])
           or m - array['id','tipo','fecha','cantidad','precio','comision'] <> '{}'::jsonb then return false; end if;
        foreach campo in array array['cantidad','precio','comision'] loop
          if jsonb_typeof(m->campo) is distinct from 'string' or length(m->>campo)>30
             or m->>campo !~ '^\d{1,13}(\.\d{1,6})?$' then return false; end if;
        end loop;
      elsif m->>'tipo' in ('cobro','gasto') then
        if m - array['id','tipo','fecha','importe'] <> '{}'::jsonb
           or jsonb_typeof(m->'importe') is distinct from 'string'
           or m->>'importe' !~ '^\d{1,13}(\.\d{1,2})?$' then return false; end if;
      else return false;
      end if;
    end loop;
  end loop;
  return true;
end
$$;
