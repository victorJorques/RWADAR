-- RWAdar: aplicar DESPUÉS de 26, solo con permiso expreso del titular.
-- Preparada y probada en local. No abre cuentas, correo, opiniones ni push.
-- Las políticas existentes conservan la propiedad de cada fila. Este filtro
-- RESTRICTIVO añade correo confirmado y sesión vigente; nunca las sustituye.
begin;

do $precondiciones$
begin
  if to_regclass('auth.sessions') is null
     or to_regprocedure('auth.jwt()') is null
     or to_regclass('public.mi_perfil') is null
     or not has_table_privilege('authenticated', 'public.mi_perfil', 'SELECT')
     or not exists (select 1 from information_schema.columns where table_schema='auth'
                      and table_name='users' and column_name='is_anonymous')
     or not exists (select 1 from information_schema.columns where table_schema='auth'
                      and table_name='sessions' and column_name='not_after') then
    raise exception 'RWAdar cuentas: hacen falta Auth actual y la reapertura 26';
  end if;
  if exists (select 1 from pg_class where oid in (
       'public.perfiles'::regclass, 'public.vigilancia'::regclass,
       'public.avisos_correo'::regclass) and not relrowsecurity) then
    raise exception 'RWAdar cuentas: RLS debe seguir activo';
  end if;
end
$precondiciones$;

create schema if not exists rwadar_cuentas_privadas;
revoke all on schema rwadar_cuentas_privadas from public, anon;
grant usage on schema rwadar_cuentas_privadas to authenticated;

-- SECURITY DEFINER es necesario para comprobar auth.sessions/users sin
-- conceder acceso a esas tablas. Esquema no expuesto, sin argumentos ni datos
-- devueltos, search_path vacío y consultas totalmente cualificadas.
create or replace function rwadar_cuentas_privadas.sesion_confirmada()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  quien uuid := auth.uid();
  testigo jsonb := auth.jwt();
  sid text;
  vence text;
begin
  if not has_table_privilege('authenticated', 'public.mi_perfil', 'SELECT')
     or quien is null or testigo->>'role' is distinct from 'authenticated'
     or testigo->>'sub' is distinct from quien::text
     or testigo->>'is_anonymous' = 'true' then return false; end if;
  sid := testigo->>'session_id';
  vence := testigo->>'exp';
  if sid is null or sid !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or vence is null or vence !~ '^[0-9]{1,12}$' then return false; end if;
  if vence::numeric <= extract(epoch from now()) then return false; end if;
  return exists (
    select 1 from auth.users u join auth.sessions s on s.user_id = u.id
     where u.id = quien and u.email_confirmed_at is not null
       and u.is_anonymous is false and s.id = sid::uuid
       and (s.not_after is null or s.not_after > now())
  );
end
$$;
revoke all on function rwadar_cuentas_privadas.sesion_confirmada() from public, anon;
grant execute on function rwadar_cuentas_privadas.sesion_confirmada() to authenticated;

drop policy if exists cuenta_sesion_confirmada on public.perfiles;
create policy cuenta_sesion_confirmada on public.perfiles as restrictive
  for all to authenticated
  using ((select rwadar_cuentas_privadas.sesion_confirmada()))
  with check ((select rwadar_cuentas_privadas.sesion_confirmada()));
drop policy if exists cuenta_sesion_confirmada on public.vigilancia;
create policy cuenta_sesion_confirmada on public.vigilancia as restrictive
  for all to authenticated
  using ((select rwadar_cuentas_privadas.sesion_confirmada()))
  with check ((select rwadar_cuentas_privadas.sesion_confirmada()));
drop policy if exists cuenta_sesion_confirmada on public.avisos_correo;
create policy cuenta_sesion_confirmada on public.avisos_correo as restrictive
  for all to authenticated
  using ((select rwadar_cuentas_privadas.sesion_confirmada()))
  with check ((select rwadar_cuentas_privadas.sesion_confirmada()));

-- Una sesión de recuperación o un JWT aún no caducado tras salir NO basta.
-- La contraseña debe haberse comprobado en Auth durante los últimos 5 min.
create or replace function public.borrar_mi_cuenta() returns void
language plpgsql security definer set search_path = '' as $$
declare
  quien uuid := auth.uid();
  testigo jsonb := auth.jwt();
  prueba jsonb;
  instante text;
  reciente boolean := false;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode='42501', message='Se necesita una sesión confirmada y vigente';
  end if;
  if jsonb_typeof(testigo->'amr') = 'array' then
    for prueba in select value from jsonb_array_elements(testigo->'amr') loop
      instante := prueba->>'timestamp';
      if prueba->>'method' = 'password' and instante ~ '^[0-9]{1,12}(\.[0-9]{1,6})?$' then
        if instante::numeric between extract(epoch from now()) - 300
                                and extract(epoch from now()) + 30 then
          reciente := true;
        end if;
      end if;
    end loop;
  end if;
  if not reciente then
    raise exception using errcode='42501', message='Confirma de nuevo tu contraseña antes de borrar la cuenta';
  end if;
  -- Se revocan primero las sesiones. Todo ocurre en la misma transacción;
  -- si falla una cascada no se declara un borrado parcial como completado.
  delete from auth.sessions where user_id = quien;
  delete from auth.users where id = quien;
end
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;

create or replace function public.marcar_manual_descargado() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode='42501', message='Se necesita una sesión confirmada y vigente';
  end if;
  update public.perfiles set manual_descargado_el = coalesce(manual_descargado_el, now())
   where id = auth.uid();
end
$$;
revoke all on function public.marcar_manual_descargado() from public, anon;
grant execute on function public.marcar_manual_descargado() to authenticated;

-- Correo de cambios sigue apagado. Una instalación que conserve la RPC 23
-- no debe aceptar un JWT revocado por su antiguo SECURITY DEFINER.
-- La futura activación de avisos debe revisar esta RPC, no solo encender UI.
do $correo_cerrado$
begin
  if to_regprocedure('public.configurar_avisos_correo(boolean,text)') is not null then
    revoke all on function public.configurar_avisos_correo(boolean,text)
      from public, anon, authenticated;
  end if;
end
$correo_cerrado$;

-- Evita aceptar accidentalmente una vista propietaria que esquive RLS.
alter view public.mi_perfil set (security_invoker = true);
notify pgrst, 'reload schema';
commit;
