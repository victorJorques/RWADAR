-- Cierre de emergencia limitado al correo. No corta la API, no toca push,
-- no borra la cola y mantiene el reloj de retención de privacidad.
begin;

do $estado$
begin
  if to_regclass('public.correo_configuracion') is not null then
    execute $sql$
      update public.correo_configuracion
         set habilitado = false, activado_el = null, activado_por = null
       where singleton
    $sql$;
  end if;
end
$estado$;

do $relojes$
declare
  v_job record;
begin
  if to_regclass('cron.job') is null then return; end if;
  for v_job in
    select jobid, jobname
      from cron.job
     where jobname = 'rwadar-avisos'
        or lower(coalesce(command, '')) like '%avisos_ciclo%'
        or lower(coalesce(command, '')) like '%avisos_soltar%'
        or lower(coalesce(command, '')) like '%avisos_confirmar%'
  loop
    if to_regprocedure('cron.unschedule(text)') is not null then
      perform cron.unschedule(v_job.jobname);
    elsif to_regprocedure('cron.unschedule(bigint)') is not null then
      perform cron.unschedule(v_job.jobid);
    else
      raise exception 'correo cierre: cron.unschedule no está disponible';
    end if;
  end loop;
end
$relojes$;

create or replace function public.avisos_soltar(p_tanda integer default 20)
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $funcion$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre de emergencia';
end
$funcion$;

create or replace function public.avisos_confirmar()
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $funcion$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre de emergencia';
end
$funcion$;

create or replace function public.avisos_ciclo()
returns text
language plpgsql security definer set search_path = public, pg_temp
as $funcion$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre de emergencia';
end
$funcion$;

revoke all on function public.avisos_soltar(integer)
  from public, anon, authenticated;
revoke all on function public.avisos_confirmar()
  from public, anon, authenticated;
revoke all on function public.avisos_ciclo()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
