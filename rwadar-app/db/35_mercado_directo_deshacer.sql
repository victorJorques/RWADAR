-- =====================================================================
-- RWAdar 35 · deshacer del todo el gráfico en directo
-- Lo de apagar, más borrar la función pública y el esquema entero
-- (tablas, datos y funciones). No queda nada: las respuestas pendientes de
-- pg_net se borran solas a las 6 horas. El servidor de la web recibe 404
-- de PostgREST y responde «directo_apagado»: la web y la app siguen con el
-- archivo publicado, sin aviso. Volver: aplicar-35 y «encender».
-- =====================================================================
begin;

do $relojes$
declare
  v_job record;
begin
  if to_regclass('cron.job') is null then return; end if;
  for v_job in select jobname from cron.job where jobname like 'rwadar-mercado-%' or command ilike '%rwadar_mercado.%' loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end
$relojes$;

select pg_advisory_xact_lock(20261113, 35);
drop function if exists public.tokenizacion_directo();
drop schema if exists rwadar_mercado cascade;

notify pgrst, 'reload schema';
commit;
