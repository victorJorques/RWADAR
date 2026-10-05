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
