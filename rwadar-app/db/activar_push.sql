-- RWAdar - activación PUSH deliberada tras una validación E2E externa.
-- No forma parte de la cadena fresh-install ni de la migración 22.
begin;

do $$
begin
  if to_regclass('public.push_configuracion') is null
     or to_regprocedure('public.push_ciclo()') is null
     or to_regclass('public.retencion_dispositivos_estado') is null then
    raise exception 'push opt-in: falta aplicar y verificar 22';
  end if;
  if (select count(*) from public.push_configuracion where singleton) <> 1 then
    raise exception 'push opt-in: configuración singleton ausente o corrupta';
  end if;
end $$;

update public.push_configuracion
   set habilitado = true,
       activado_el = now(),
       activado_por = session_user
 where singleton;

select cron.unschedule('rwadar-push')
 where exists (select 1 from cron.job where jobname = 'rwadar-push');
select cron.schedule(
  'rwadar-push',
  '*/2 * * * *',
  $$ select push_ciclo() $$
);

notify pgrst, 'reload schema';
commit;
