-- =====================================================================
-- RWAdar · comprobación posterior, solo lectura
-- Ejecutar inmediatamente después de 14_seguridad_integral.sql.
-- Termina con excepción si falta cualquier invariante de producción.
-- =====================================================================
begin transaction read only;

do $$
declare
  v_activas integer;
  v_descartadas integer;
begin
  select count(*) into v_activas from plataformas where estado = 'en_radar';
  select count(*) into v_descartadas from plataformas where estado = 'descartada';
  if v_activas <> 26 or v_descartadas <> 4 then
    raise exception 'recuento inesperado: % activas, % descartadas', v_activas, v_descartadas;
  end if;
  if exists (select 1 from descartadas_sin_fuente) then
    raise exception 'hay plataformas descartadas sin fuente';
  end if;

  if has_table_privilege('authenticated', 'perfiles', 'UPDATE')
     or has_column_privilege('authenticated', 'perfiles', 'es_admin', 'UPDATE')
     or not has_column_privilege('authenticated', 'perfiles', 'nombre', 'UPDATE')
     or not has_column_privilege('authenticated', 'perfiles', 'avisos_correo', 'UPDATE') then
    raise exception 'privilegios de perfiles incorrectos';
  end if;

  if has_table_privilege('authenticated', 'opiniones', 'INSERT')
     or has_table_privilege('authenticated', 'opiniones', 'UPDATE')
     or has_table_privilege('authenticated', 'opiniones', 'DELETE')
     or has_column_privilege('authenticated', 'opiniones', 'estado', 'UPDATE')
     or has_column_privilege('authenticated', 'opiniones', 'denuncias', 'UPDATE')
     or has_table_privilege('authenticated', 'denuncias', 'INSERT')
     or has_table_privilege('authenticated', 'denuncias', 'UPDATE')
     or has_table_privilege('authenticated', 'denuncias', 'DELETE') then
    raise exception 'queda escritura directa sobre opiniones o denuncias';
  end if;

  if has_function_privilege('anon', 'guardar_opinion(uuid,integer,text)', 'EXECUTE')
     or has_function_privilege('anon', 'denunciar_opinion(uuid,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'establecer_admin(uuid,boolean)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'guardar_opinion(uuid,integer,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'denunciar_opinion(uuid,text)', 'EXECUTE')
     or not has_function_privilege('service_role', 'establecer_admin(uuid,boolean)', 'EXECUTE') then
    raise exception 'permisos de RPC incorrectos';
  end if;

  if exists (
    select 1 from pg_class
     where relname in ('radar_publico','opiniones_publicas','nota_media',
                       'mi_perfil','mis_opiniones','cola_moderacion')
       and not (coalesce(reloptions, array[]::text[]) @> array['security_invoker=true'])
  ) then
    raise exception 'hay una vista expuesta sin security_invoker';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name in ('opiniones_publicas','mis_opiniones','cola_moderacion')
       and column_name in ('usuario_id','user_id','email','correo','denunciante_id')
  ) then
    raise exception 'una vista de opiniones expone un identificador personal';
  end if;

  if exists (
    select 1 from opiniones o
     where o.denuncias <> (select count(*) from denuncias d
                            where d.opinion_id = o.opinion_id)
  ) then
    raise exception 'contador de denuncias desincronizado';
  end if;

  if exists (
    select 1 from moderacion m
     where m.usuario_id is not null
       and not exists (select 1 from auth.users u where u.id = m.usuario_id)
  ) then
    raise exception 'el historial conserva UUID de usuarios inexistentes';
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'moderacion'::regclass
       and conname = 'moderacion_usuario_id_fkey'
       and convalidated
  ) then
    raise exception 'la anonimización del historial no tiene FK validada';
  end if;

  if not exists (
    select 1 from pg_trigger
     where tgrelid = 'denuncias'::regclass
       and tgname = 'denuncias_revisan' and tgenabled <> 'D'
  ) or not exists (
    select 1 from pg_trigger
     where tgrelid = 'dispositivos'::regclass
       and tgname = 'dispositivos_limpian_inactivos' and tgenabled <> 'D'
  ) then
    raise exception 'falta un trigger de integridad o retención';
  end if;

  raise notice 'RWAdar 14 OK: % activas, % descartadas; permisos, vistas, RPC, contadores y retención verificados',
    v_activas, v_descartadas;
end $$;

rollback;
