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
-- interruptores y la casilla del alta con su fecha (cada columna, si existe:
-- este cierre no debe fallar con ninguna versión de la 30). No se borra
-- ninguna cola ni preferencia, ni el historial del permiso: su disparador de
-- borrado de cuentas sigue puesto (es la prueba del permiso y nunca impide
-- borrar una cuenta). Tras reparar: reaplicar la 30 (recrea el
-- reloj diario de limpieza) y, si la web o la app siguen enseñando la
-- casilla, 30_avisos_registrados_activar_casilla.sql.
do $novedades$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null then
    execute $sql$
      update rwadar_novedades.configuracion
         set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false,
             correo_activado_el = null, push_activado_el = null
       where unica
    $sql$;
    if exists (select 1 from pg_attribute
                where attrelid = to_regclass('rwadar_novedades.configuracion')
                  and attname = 'casilla_activa' and not attisdropped) then
      execute 'update rwadar_novedades.configuracion set casilla_activa = false where unica';
    end if;
    if exists (select 1 from pg_attribute
                where attrelid = to_regclass('rwadar_novedades.configuracion')
                  and attname = 'casilla_activada_el' and not attisdropped) then
      execute 'update rwadar_novedades.configuracion set casilla_activada_el = null where unica';
    end if;
    raise notice 'RWAdar 30: avisos y casilla del alta apagados. Tras reparar, reaplica 30_avisos_registrados.sql y, si la web o la app enseñan la casilla, 30_avisos_registrados_activar_casilla.sql';
  end if;
end
$novedades$;

-- Notificaciones sin cuenta (36): si existe su interruptor, se apaga con su
-- fecha. No se borra ninguna fila ni el historial sin cuenta. Sus RPC ya
-- quedaron cerradas arriba (todas las de public). Tras reparar: reaplicar la
-- 36 y, con orden de Víctor, 36_avisos_sin_cuenta_activar.sql.
do $sin_cuenta$
begin
  if to_regclass('rwadar_novedades.configuracion') is not null
     and exists (select 1 from pg_attribute
                  where attrelid = to_regclass('rwadar_novedades.configuracion')
                    and attname = 'sin_cuenta_activa' and not attisdropped) then
    execute 'update rwadar_novedades.configuracion set sin_cuenta_activa = false, sin_cuenta_activada_el = null where unica';
    raise notice 'RWAdar 36: notificaciones sin cuenta apagadas. Tras reparar, reaplica 36_avisos_sin_cuenta.sql y, con orden de Víctor, 36_avisos_sin_cuenta_activar.sql';
  end if;
end
$sin_cuenta$;

-- pg_cron ofrece unschedule(text) en Supabase. La rama bigint permite que el
-- cierre siga siendo util con instalaciones antiguas que solo tengan esa firma.
-- El reloj de retención de la 22 NO se detiene: no hace red y minimiza datos
-- personales. Los de la 30 sí, todos (también rwadar-novedades-limpieza, por
-- ser una emergencia); reaplicar la 30 vuelve a crear el de limpieza.
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
          where jobname in ('rwadar-avisos', 'rwadar-push', 'rwadar-novedades',
                            'rwadar-novedades-limpieza')
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
