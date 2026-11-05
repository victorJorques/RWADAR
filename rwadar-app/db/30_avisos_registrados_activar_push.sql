-- =====================================================================
-- RWAdar 30 · ENCENDER las notificaciones push de los avisos (Expo)
-- ---------------------------------------------------------------------
-- Solo con permiso expreso de Víctor y después de (contrato, «Activación»):
-- proyecto de Firebase y credencial FCM V1 en EAS; APK 1.4.2 publicado
-- (docs/tareas/APK-1.4.2-NOTIFICACIONES.md). Después: el verificador 30 y
-- una prueba en un móvil real.
--
-- EXPO_ACCESS_TOKEN en Vault es opcional: si está, va como Authorization
-- (obligatorio si el proyecto de Expo tiene la seguridad reforzada de push).
--
-- Transaccional: si falta algo no queda ni el interruptor encendido ni el
-- reloj. Lo encolado antes de encender se descarta: nada sale de golpe.
-- Apagar: 30_avisos_registrados_apagar.sql (o fallo_cerrado.sql). El reloj
-- diario de limpieza (rwadar-novedades-limpieza) lo crea la 30 y no se toca.
-- =====================================================================
begin;

do $precondiciones$
declare
  v_expo text;
begin
  if to_regclass('rwadar_novedades.configuracion') is null then
    raise exception using errcode = '55000', message = 'avisos 30: falta aplicar 30_avisos_registrados.sql';
  end if;
  if to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'net' and p.proname = 'http_post')
     or to_regclass('cron.job') is null then
    raise exception using errcode = '55000', message = 'avisos 30: faltan pg_net, pg_cron o Vault';
  end if;
  select nullif(btrim(max(decrypted_secret)), '') into v_expo
    from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN';
  if v_expo is not null and v_expo !~ '^[A-Za-z0-9._-]{20,255}$' then
    raise exception using errcode = '55000', message = 'avisos 30: EXPO_ACCESS_TOKEN no tiene un formato válido';
  end if;
end
$precondiciones$;

update rwadar_novedades.configuracion
   set push_activado_el = case when push_habilitado and push_activado_el is not null
                               then push_activado_el else clock_timestamp() end,
       push_habilitado = true
 where unica;

update rwadar_novedades.pushes
   set estado = 'descartado', token = null, terminado_el = now(),
       error = 'No enviado: anterior a la activación del push'
 where estado = 'pendiente'
   and creado_el < (select push_activado_el from rwadar_novedades.configuracion where unica);

do $relojes$
declare
  v_job record;
begin
  -- Cualquier reloj que llame a rwadar_novedades, salvo el diario de
  -- limpieza de la 30 tal cual (ese se queda siempre).
  for v_job in
    select jobname from cron.job
     where (jobname = 'rwadar-novedades'
            or lower(coalesce(command, '')) like '%rwadar_novedades.%')
       and not (jobname = 'rwadar-novedades-limpieza'
                and lower(btrim(coalesce(command, ''))) = 'select rwadar_novedades.limpiar()')
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end
$relojes$;

select cron.schedule('rwadar-novedades', '*/5 * * * *', $$ select rwadar_novedades.procesar() $$);

commit;
