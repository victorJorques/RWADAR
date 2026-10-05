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
commit;
