-- =====================================================================
-- RWAdar 30 · APAGAR los avisos a registrados
-- ---------------------------------------------------------------------
-- Apaga el correo, el push, el aviso automático de ofertas y la casilla del
-- alta (los metadatos dejan de dar permiso) y quita el reloj. No corta la
-- API, no borra filas y no toca la 22, la 23 ni la retención. Las colas
-- quedan como estaban: al volver a encender, lo anterior a la nueva
-- activación se descarta y nada sale de golpe.
-- =====================================================================
begin;

do $apagar$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null then
    update rwadar_novedades.configuracion
       set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false,
           casilla_activa = false, correo_activado_el = null, push_activado_el = null
     where unica;
  end if;
end
$apagar$;

do $relojes$
declare
  v_job record;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;
  for v_job in
    select jobid, jobname from cron.job
     where jobname = 'rwadar-novedades'
        or lower(coalesce(command, '')) like '%rwadar_novedades.%'
  loop
    if to_regprocedure('cron.unschedule(text)') is not null then
      perform cron.unschedule(v_job.jobname);
    elsif to_regprocedure('cron.unschedule(bigint)') is not null then
      perform cron.unschedule(v_job.jobid);
    else
      raise exception 'avisos 30: cron.unschedule no está disponible';
    end if;
  end loop;
end
$relojes$;

commit;
