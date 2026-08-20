-- Cierre de emergencia limitado al PUSH. No corta la API ni la retención.
begin;

do $push_cierre$
begin
  if to_regclass('public.push_configuracion') is not null then
    execute $sql$
      update public.push_configuracion
         set habilitado = false, activado_el = null, activado_por = null
       where singleton
    $sql$;
  end if;

  if to_regclass('public.avisos_push') is not null
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_push'
          and column_name = 'token' and is_nullable = 'YES'
     ) then
    execute $sql$
      update public.avisos_push
         set intentos = 5,
             error = 'Push desactivado por cierre de emergencia',
             token = null,
             peticion_id = null,
             peticion_el = null
       where enviado_el is null and intentos < 5
    $sql$;
  end if;
end
$push_cierre$;

do $reloj$
declare v_job record;
begin
  if to_regclass('cron.job') is null then return; end if;
  for v_job in execute
    $sql$select jobid, jobname from cron.job where jobname = 'rwadar-push'$sql$
  loop
    if to_regprocedure('cron.unschedule(text)') is not null then
      execute 'select cron.unschedule($1)' using v_job.jobname;
    elsif to_regprocedure('cron.unschedule(bigint)') is not null then
      execute 'select cron.unschedule($1)' using v_job.jobid;
    else
      raise exception 'push cierre: cron.unschedule no está disponible';
    end if;
  end loop;
end
$reloj$;

notify pgrst, 'reload schema';
commit;
