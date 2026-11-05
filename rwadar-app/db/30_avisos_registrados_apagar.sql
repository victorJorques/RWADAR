-- =====================================================================
-- RWAdar 30 · APAGAR el envío de los avisos a registrados
-- ---------------------------------------------------------------------
-- Apaga el correo, el push y el aviso automático de ofertas y quita el reloj
-- de envío (`rwadar-novedades` y cualquier otro que llame a
-- rwadar_novedades, salvo el de limpieza). No corta la API, no borra filas y
-- no toca la 22, la 23 ni la retención.
--
-- NO toca la casilla del alta (`casilla_activa`, `casilla_activada_el`): la
-- web y la app la siguen enseñando y quien la marca sigue guardando su
-- permiso, aunque ahora no salga ningún aviso. Para retirarla (al quitar la
-- plantilla de Auth): 30_avisos_registrados_apagar_casilla.sql.
--
-- Tampoco quita el reloj diario de limpieza (`rwadar-novedades-limpieza`):
-- la retención prometida en la privacidad (colas a los 90 días, móviles a
-- los 180) se cumple también con todo apagado. limpiar() no hace red.
--
-- Las colas quedan como estaban: al volver a encender, lo anterior a la
-- nueva activación se descarta y nada sale de golpe.
-- =====================================================================
begin;

do $apagar$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null then
    update rwadar_novedades.configuracion
       set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false,
           correo_activado_el = null, push_activado_el = null
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
     where (jobname = 'rwadar-novedades'
            or lower(coalesce(command, '')) like '%rwadar_novedades.%')
       -- El de limpieza se queda, solo si es exactamente el de la 30.
       and not (jobname = 'rwadar-novedades-limpieza'
                and lower(btrim(coalesce(command, ''))) = 'select rwadar_novedades.limpiar()')
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
