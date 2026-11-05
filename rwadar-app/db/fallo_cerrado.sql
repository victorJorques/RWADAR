-- RWAdar - cierre de emergencia para una instalacion/actualizacion incompleta.
--
-- Este fichero NO revierte datos ni intenta adivinar que migraciones llegaron
-- a aplicarse. Sacrifica disponibilidad: corta todo acceso de los clientes a
-- las relaciones, secuencias y funciones de public, activa RLS en las tablas
-- conocidas que existan y detiene los ciclos de correo/push. service_role y el
-- propietario conservan acceso para diagnosticar y reparar de forma controlada.

begin;

revoke all privileges on all tables in schema public
  from public, anon, authenticated;
revoke all privileges on all sequences in schema public
  from public, anon, authenticated;
revoke execute on all functions in schema public
  from public, anon, authenticated;

-- Evita que un objeto creado despues del fallo recupere los privilegios
-- implicitos de PUBLIC antes de completar la reparacion.
alter default privileges in schema public
  revoke all privileges on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all privileges on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

do $cierre$
declare
  v_tabla text;
begin
  foreach v_tabla in array array[
    'categorias', 'regiones', 'plataformas', 'fuentes',
    'cambios_estado', 'dispositivos', 'seguimiento',
    'perfiles', 'vigilancia', 'avisos_correo',
    'opiniones', 'denuncias', 'moderacion',
    'avisos_push', 'push_configuracion', 'retencion_dispositivos_estado',
    'emisiones'
  ]
  loop
    if to_regclass(format('public.%I', v_tabla)) is not null then
      execute format('alter table public.%I enable row level security', v_tabla);
    end if;
  end loop;
end
$cierre$;

-- El interruptor impide envíos incluso si alguien invoca una función como
-- propietario. Se minimizan copias de tokens pendientes sin borrar contenido.
do $push$
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
         set token = null, intentos = 5,
             error = 'API cerrada; push desactivado',
             peticion_id = null, peticion_el = null
       where enviado_el is null and intentos < 5
    $sql$;
  end if;
end
$push$;

-- Avisos a registrados (30): si existe el esquema, se apagan sus tres
-- interruptores. No se borra ninguna cola ni preferencia.
do $novedades$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null then
    execute $sql$
      update rwadar_novedades.configuracion
         set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false,
             correo_activado_el = null, push_activado_el = null
       where unica
    $sql$;
  end if;
end
$novedades$;

-- pg_cron ofrece unschedule(text) en Supabase. La rama bigint permite que el
-- cierre siga siendo util con instalaciones antiguas que solo tengan esa firma.
-- El reloj de retención NO se detiene: no hace red y minimiza datos personales.
do $relojes$
declare
  v_job record;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  -- También cualquier reloj que llame a rwadar_novedades (30), se llame como se llame.
  for v_job in execute
    $sql$select jobid, jobname
           from cron.job
          where jobname in ('rwadar-avisos', 'rwadar-push', 'rwadar-novedades')
             or lower(coalesce(command, '')) like '%rwadar_novedades.%'$sql$
  loop
    if to_regprocedure('cron.unschedule(text)') is not null then
      execute 'select cron.unschedule($1)' using v_job.jobname;
    elsif to_regprocedure('cron.unschedule(bigint)') is not null then
      execute 'select cron.unschedule($1)' using v_job.jobid;
    else
      raise warning 'No existe cron.unschedule; hay que detener manualmente %',
        v_job.jobname;
    end if;
  end loop;
end
$relojes$;

notify pgrst, 'reload schema';
commit;
