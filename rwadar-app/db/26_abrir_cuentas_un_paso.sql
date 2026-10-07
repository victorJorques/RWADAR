-- RWAdar · abrir cuentas, fase 1, en un solo paso (Supabase › SQL Editor › Run).
-- Es 26_reabrir_cuentas.sql seguido de su verificador en la MISMA transacción:
-- si el verificador encuentra algo de más o de menos, se deshace todo.
-- Marcha atrás: 25_servicios_editoriales_solo_lectura.sql.
-- =====================================================================
-- RWAdar 26 · reapertura de cuentas, fase 1
-- ---------------------------------------------------------------------
-- Es «la otra migración explícita» que pide 25 para reabrir servicios de
-- usuario, y solo reabre lo mínimo para que una cuenta sirva de algo:
--
--   · ver y editar el propio perfil (nombre y preferencia de correo),
--   · guardar y quitar plataformas de la propia lista de vigilancia,
--   · borrar la propia cuenta,
--   · anotar en el propio perfil que se descargó el manual de bienvenida
--     (solo la fecha de la primera vez; se borra con la cuenta).
--
-- Sigue cerrado: opiniones, denuncias, moderación, dispositivos de la app,
-- seguimiento por instalación, push y envío de correo. Cada uno necesitará
-- su propia migración y su propia prueba de extremo a extremo.
--
-- Las filas siguen protegidas por las políticas RLS de 07 (cada cual solo
-- ve y toca lo suyo); aquí solo se devuelven los permisos de tabla.
--
-- Se aplica DESPUÉS de comprobar el correo de confirmación de Auth (ver
-- docs/tareas/REABRIR-CUENTAS.md). Idempotente y transaccional.
-- Marcha atrás: volver a ejecutar 25_servicios_editoriales_solo_lectura.sql.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('public.perfiles') is null
     or to_regclass('public.vigilancia') is null
     or to_regclass('public.avisos_correo') is null
     or to_regclass('public.mi_perfil') is null
     or to_regprocedure('public.borrar_mi_cuenta()') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 26: faltan las tablas de cuentas (07, 08, 11 y 22)';
  end if;
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname in ('perfiles', 'vigilancia')
                    and c.relrowsecurity
                 having count(*) = 2) then
    raise exception using errcode = '55000',
      message = 'RWAdar 26: perfiles y vigilancia deben tener RLS activo antes de reabrir';
  end if;
end
$precondiciones$;

grant usage on schema public to authenticated;

-- Perfil propio. RLS «el perfil se ve/edita a sí mismo» filtra la fila;
-- solo se pueden escribir el nombre y la preferencia de correo (nunca
-- es_admin ni las fechas).
grant select on public.perfiles to authenticated;
grant update (nombre, avisos_correo) on public.perfiles to authenticated;

-- Lista de vigilancia propia: leer, añadir y quitar.
grant select, delete on table public.vigilancia to authenticated;
grant insert (usuario_id, plataforma_id) on public.vigilancia to authenticated;

-- mi_perfil es security_invoker y cuenta vigiladas y avisos propios.
grant select on public.avisos_correo to authenticated;
grant select on public.mi_perfil to authenticated;

-- Baja: borra la cuenta de Auth y, en cascada, perfil, vigilancia y avisos.
grant execute on function public.borrar_mi_cuenta() to authenticated;

-- Manual de bienvenida (docs/manual): Eric pide saber cuántos registrados
-- lo descargan. Se guarda solo la fecha de la primera descarga hecha con la
-- sesión iniciada, en el propio perfil. Ni IP ni navegador ni recuento por
-- persona. El cliente no puede escribir la columna: solo esta función.
alter table public.perfiles add column if not exists manual_descargado_el timestamptz;
create or replace function public.marcar_manual_descargado() returns void
  language sql security definer set search_path = public, pg_temp as $$
    update public.perfiles
       set manual_descargado_el = coalesce(manual_descargado_el, now())
     where id = auth.uid();
  $$;
revoke all on function public.marcar_manual_descargado() from public, anon;
grant execute on function public.marcar_manual_descargado() to authenticated;

-- Nada de esto llega a quien no ha entrado.
revoke all on public.perfiles, public.vigilancia, public.avisos_correo,
              public.mi_perfil from anon;
revoke all on function public.borrar_mi_cuenta() from public, anon;

notify pgrst, 'reload schema';

-- =====================================================================
-- RWAdar 26 · verificador de solo lectura
-- ---------------------------------------------------------------------
-- Se ejecuta después de 26 en el SQL Editor. No cambia nada. Si todo
-- cuadra termina con el aviso «RWAdar 26 OK»; si no, lanza una excepción
-- que dice qué falla.
-- =====================================================================
do $verificar$
declare
  t text;
  f text;
begin
  -- Lo que la fase 1 necesita.
  if not has_table_privilege('authenticated', 'public.perfiles', 'SELECT')
     or not has_column_privilege('authenticated', 'public.perfiles', 'nombre', 'UPDATE')
     or not has_column_privilege('authenticated', 'public.perfiles', 'avisos_correo', 'UPDATE')
     or not has_table_privilege('authenticated', 'public.vigilancia', 'SELECT')
     or not has_table_privilege('authenticated', 'public.vigilancia', 'DELETE')
     or not has_column_privilege('authenticated', 'public.vigilancia', 'usuario_id', 'INSERT')
     or not has_column_privilege('authenticated', 'public.vigilancia', 'plataforma_id', 'INSERT')
     or not has_table_privilege('authenticated', 'public.mi_perfil', 'SELECT')
     or not has_table_privilege('authenticated', 'public.avisos_correo', 'SELECT')
     or not has_function_privilege('authenticated', 'public.borrar_mi_cuenta()', 'EXECUTE')
     or to_regprocedure('public.marcar_manual_descargado()') is null
     or not has_function_privilege('authenticated', 'public.marcar_manual_descargado()', 'EXECUTE') then
    raise exception 'RWAdar 26: falta algún permiso de la fase 1 de cuentas';
  end if;

  -- Ni ascender a administrador ni tocar fechas desde el cliente.
  if has_column_privilege('authenticated', 'public.perfiles', 'es_admin', 'UPDATE')
     or has_column_privilege('authenticated', 'public.perfiles', 'id', 'UPDATE')
     or has_column_privilege('authenticated', 'public.perfiles', 'creado_el', 'UPDATE')
     or has_column_privilege('authenticated', 'public.perfiles', 'manual_descargado_el', 'UPDATE')
     or has_table_privilege('authenticated', 'public.perfiles', 'INSERT')
     or has_table_privilege('authenticated', 'public.perfiles', 'DELETE')
     or has_table_privilege('authenticated', 'public.avisos_correo', 'INSERT')
     or has_table_privilege('authenticated', 'public.vigilancia', 'UPDATE') then
    raise exception 'RWAdar 26: el cliente puede escribir columnas que no debe';
  end if;

  -- Quien no ha entrado no ve ni toca nada de cuentas.
  foreach t in array array['public.perfiles', 'public.vigilancia',
                           'public.avisos_correo', 'public.mi_perfil'] loop
    if has_table_privilege('anon', t, 'SELECT')
       or has_table_privilege('anon', t, 'INSERT')
       or has_table_privilege('anon', t, 'UPDATE')
       or has_table_privilege('anon', t, 'DELETE') then
      raise exception 'RWAdar 26: anon tiene permisos sobre %', t;
    end if;
  end loop;
  if has_function_privilege('anon', 'public.borrar_mi_cuenta()', 'EXECUTE')
     or has_function_privilege('anon', 'public.marcar_manual_descargado()', 'EXECUTE') then
    raise exception 'RWAdar 26: anon puede ejecutar funciones de cuenta';
  end if;

  -- Lo que sigue en pausa: opiniones, moderación, dispositivos y push.
  foreach t in array array['public.opiniones', 'public.denuncias', 'public.moderacion',
                           'public.dispositivos', 'public.seguimiento', 'public.avisos_push',
                           'public.opiniones_publicas', 'public.nota_media',
                           'public.mis_opiniones', 'public.cola_moderacion'] loop
    if to_regclass(t) is not null and (
         has_table_privilege('anon', t, 'SELECT') or has_table_privilege('authenticated', t, 'SELECT')
      or has_table_privilege('anon', t, 'INSERT') or has_table_privilege('authenticated', t, 'INSERT')
      or has_table_privilege('anon', t, 'DELETE') or has_table_privilege('authenticated', t, 'DELETE')) then
      raise exception 'RWAdar 26: % debería seguir cerrado', t;
    end if;
  end loop;
  foreach f in array array['public.guardar_opinion(uuid,integer,text)',
                           'public.borrar_mi_opinion(uuid)',
                           'public.denunciar_opinion(uuid,text)',
                           'public.moderar(uuid,text,text)',
                           'public.es_admin()', 'public.es_opinion_propia(uuid)',
                           'public.instalacion_actual()'] loop
    if to_regprocedure(f) is not null and (
         has_function_privilege('anon', f, 'EXECUTE')
      or has_function_privilege('authenticated', f, 'EXECUTE')) then
      raise exception 'RWAdar 26: % debería seguir cerrada', f;
    end if;
  end loop;

  -- Las filas siguen protegidas por RLS.
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relname in ('perfiles', 'vigilancia', 'avisos_correo')
                and not c.relrowsecurity) then
    raise exception 'RWAdar 26: RLS desactivado en una tabla de cuentas';
  end if;

  -- El catálogo público no se ha tocado.
  if not has_table_privilege('anon', 'public.radar_publico', 'SELECT') then
    raise exception 'RWAdar 26: el radar público ha dejado de ser legible';
  end if;

  raise notice 'RWAdar 26 OK: perfil, vigilancia y baja abiertos; opiniones, moderación, dispositivos y push siguen cerrados';
end
$verificar$;

commit;
