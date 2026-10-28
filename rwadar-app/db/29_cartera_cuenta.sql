-- PREPARADO LOCAL. Aplicar solo con permiso expreso de Víctor para SQL remoto.
-- Registro manual privado; no obtiene cotizaciones ni mueve dinero.
begin;

do $precondicion$
begin
  if to_regprocedure('rwadar_cuentas_privadas.sesion_confirmada()') is null
     or to_regclass('auth.users') is null then
    raise exception 'Cartera: hace falta la protección de sesión confirmada';
  end if;
end
$precondicion$;

-- Esquema privado no expuesto por PostgREST. Las funciones son INVOKER;
-- RLS sigue comprobándose incluso en las llamadas directas a la RPC.
create schema if not exists rwadar_cuentas_privadas;
revoke all on schema rwadar_cuentas_privadas from public, anon;
grant usage on schema rwadar_cuentas_privadas to authenticated;

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
         or p->'valoracion' - array['precio','fecha','origen'] <> '{}'::jsonb
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
revoke all on function rwadar_cuentas_privadas.documento_cartera_valido(jsonb) from public, anon;
grant execute on function rwadar_cuentas_privadas.documento_cartera_valido(jsonb) to authenticated;

create table if not exists rwadar_cuentas_privadas.carteras (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  version integer not null check (version between 1 and 2147483647),
  documento jsonb not null check (rwadar_cuentas_privadas.documento_cartera_valido(documento)),
  actualizada_el timestamptz not null default now()
);
alter table rwadar_cuentas_privadas.carteras enable row level security;
alter table rwadar_cuentas_privadas.carteras force row level security;
revoke all on rwadar_cuentas_privadas.carteras from public, anon, authenticated;
grant select, insert on rwadar_cuentas_privadas.carteras to authenticated;
grant update(version,documento,actualizada_el) on rwadar_cuentas_privadas.carteras to authenticated;
drop policy if exists cartera_propietaria on rwadar_cuentas_privadas.carteras;
create policy cartera_propietaria on rwadar_cuentas_privadas.carteras for all to authenticated
  using (usuario_id=(select auth.uid()) and (select rwadar_cuentas_privadas.sesion_confirmada()))
  with check (usuario_id=(select auth.uid()) and (select rwadar_cuentas_privadas.sesion_confirmada()));

create or replace view public.mi_cartera with (security_invoker=true) as
  select version, documento from rwadar_cuentas_privadas.carteras
  where usuario_id=(select auth.uid()) and (select rwadar_cuentas_privadas.sesion_confirmada());
revoke all on public.mi_cartera from public, anon, authenticated;
grant select on public.mi_cartera to authenticated;

create or replace function public.guardar_mi_cartera(p_documento jsonb,p_version integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare quien uuid := auth.uid(); r rwadar_cuentas_privadas.carteras%rowtype;
begin
  if quien is null or not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode='42501',message='Se necesita una sesión confirmada y vigente';
  end if;
  if p_version is null or p_version<0 or p_version>=2147483647
     or not rwadar_cuentas_privadas.documento_cartera_valido(p_documento) then
    raise exception using errcode='22023',message='Registro manual no válido';
  end if;
  if p_version=0 then
    insert into rwadar_cuentas_privadas.carteras(usuario_id,version,documento)
      values(quien,1,p_documento) on conflict(usuario_id) do nothing returning * into r;
  else
    update rwadar_cuentas_privadas.carteras set documento=p_documento,version=version+1,actualizada_el=now()
      where usuario_id=quien and version=p_version returning * into r;
  end if;
  if r.usuario_id is null then
    raise exception using errcode='PT409',message='cartera_conflicto';
  end if;
  return jsonb_build_object('version',r.version,'posiciones',r.documento->'posiciones');
end
$$;
revoke all on function public.guardar_mi_cartera(jsonb,integer) from public, anon;
grant execute on function public.guardar_mi_cartera(jsonb,integer) to authenticated;
notify pgrst,'reload schema';
commit;
