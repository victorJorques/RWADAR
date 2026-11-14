-- =====================================================================
-- RWAdar 35 · apagar el gráfico en directo
-- Quita sus dos relojes y pone encendido = false. Guarda los datos.
-- public.tokenizacion_directo() responde «apagado» al momento y el
-- servidor de la web, en 5 minutos como mucho: la web y la app vuelven al
-- archivo publicado, sin aviso (está apagado a propósito). Para volver a
-- encender: la acción «encender» (siembra otra vez antes). No toca ningún
-- otro reloj (los de los avisos siguen como estén).
-- =====================================================================
begin;

do $apagar$
begin
  if to_regclass('rwadar_mercado.configuracion') is not null then
    perform pg_advisory_xact_lock(20261113, 35);
    update rwadar_mercado.configuracion set encendido = false, peticion_id = null, pedido_el = null where unica;
  end if;
end
$apagar$;

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

commit;
