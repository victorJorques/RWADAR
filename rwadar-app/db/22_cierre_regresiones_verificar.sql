-- =====================================================================
-- RWAdar · verificación posterior de 22_cierre_regresiones.sql
-- Solo lectura: cualquier desviación aborta con una excepción.
-- =====================================================================
begin transaction read only;

do $$
declare
  v_funcion text;
  v_rol text;
  v_fila record;
begin
  if has_table_privilege('anon', 'opiniones', 'SELECT')
     or has_column_privilege('anon', 'opiniones', 'usuario_id', 'SELECT')
     or has_column_privilege('authenticated', 'opiniones', 'usuario_id', 'SELECT')
     or has_table_privilege('authenticated', 'opiniones', 'INSERT')
     or has_table_privilege('authenticated', 'opiniones', 'UPDATE')
     or has_table_privilege('authenticated', 'opiniones', 'DELETE')
     or has_table_privilege('authenticated', 'denuncias', 'INSERT')
     or has_table_privilege('authenticated', 'denuncias', 'UPDATE')
     or has_table_privilege('authenticated', 'denuncias', 'DELETE') then
    raise exception '22: reapareció lectura de UUID o escritura directa';
  end if;

  if has_table_privilege('authenticated', 'perfiles', 'UPDATE')
     or has_column_privilege('authenticated', 'perfiles', 'es_admin', 'UPDATE')
     or not has_column_privilege('authenticated', 'perfiles', 'nombre', 'UPDATE')
     or not has_column_privilege('authenticated', 'perfiles', 'avisos_correo', 'UPDATE') then
    raise exception '22: privilegios de perfil incorrectos';
  end if;

  if has_table_privilege('anon', 'dispositivos', 'INSERT')
     or has_table_privilege('anon', 'dispositivos', 'UPDATE')
     or not has_column_privilege('anon', 'dispositivos', 'instalacion', 'INSERT')
     or not has_column_privilege('anon', 'dispositivos', 'token_push', 'UPDATE')
     or has_column_privilege('anon', 'dispositivos', 'user_id', 'INSERT')
     or has_column_privilege('anon', 'dispositivos', 'user_id', 'UPDATE')
     or has_column_privilege('anon', 'dispositivos', 'creado_el', 'INSERT')
     or has_column_privilege('anon', 'dispositivos', 'creado_el', 'UPDATE')
     or has_table_privilege('anon', 'seguimiento', 'INSERT')
     or not has_column_privilege('anon', 'seguimiento', 'plataforma_id', 'INSERT')
     or has_column_privilege('anon', 'seguimiento', 'creado_el', 'INSERT')
     or exists (
       select 1 from pg_class
        where oid in ('public.dispositivos'::regclass,
                      'public.seguimiento'::regclass)
          and not relrowsecurity
     )
     or position('inst_' in pg_get_functiondef(
       'public.instalacion_actual()'::regprocedure
     )) = 0 then
    raise exception '22: frontera de dispositivo demasiado amplia';
  end if;

  if not has_schema_privilege('anon', 'public', 'USAGE')
     or not has_table_privilege('anon', 'categorias', 'SELECT')
     or not has_table_privilege('anon', 'plataformas', 'SELECT')
     or not has_table_privilege('anon', 'radar_publico', 'SELECT')
     or not has_table_privilege('authenticated', 'perfiles', 'SELECT')
     or not has_table_privilege('authenticated', 'vigilancia', 'SELECT')
     or not has_column_privilege(
       'authenticated', 'vigilancia', 'usuario_id', 'INSERT'
     )
     or has_column_privilege(
       'authenticated', 'vigilancia', 'creado_el', 'INSERT'
     )
     or not has_table_privilege('authenticated', 'avisos_correo', 'SELECT')
     or not has_table_privilege('authenticated', 'mi_perfil', 'SELECT')
     or not has_table_privilege('anon', 'emisiones', 'SELECT')
     or not has_table_privilege('anon', 'emisiones_publicas', 'SELECT')
     or not has_table_privilege('anon', 'emisiones_rancias', 'SELECT') then
    raise exception '22: contrato funcional de la API no está recompuesto';
  end if;

  if to_regprocedure('public.moderar(uuid,uuid,text,text)') is not null
     or to_regprocedure('public.moderar(uuid,text,text)') is null then
    raise exception '22: firma de moderación incorrecta';
  end if;

  foreach v_funcion in array array[
    'crea_perfil()',
    'protege_privilegio_admin()',
    'toca_actualizada_el()',
    'registra_cambio_estado()',
    'encola_avisos_correo()',
    'toca_opinion()',
    'sincroniza_autor_opiniones()',
    'protege_opiniones_directas()',
    'revisa_denuncias()',
    'protege_denuncias_directas()',
    'limpia_dispositivos_oportunista()',
    'encola_avisos_push()',
    'push_soltar(integer)',
    'push_confirmar()',
    'push_ciclo()',
    'retencion_dispositivos_ciclo(integer,integer)',
    'emision_de_plataforma_en_radar()',
    'cerrar_emisiones_al_descartar()'
  ] loop
    foreach v_rol in array array['public', 'anon', 'authenticated'] loop
      if has_function_privilege(v_rol, v_funcion, 'EXECUTE') then
        raise exception '22: % conserva EXECUTE para %', v_funcion, v_rol;
      end if;
    end loop;
  end loop;

  foreach v_funcion in array array[
    'borrar_mi_cuenta()',
    'es_admin()',
    'guardar_opinion(uuid,integer,text)',
    'borrar_mi_opinion(uuid)',
    'denunciar_opinion(uuid,text)',
    'moderar(uuid,text,text)',
    'es_opinion_propia(uuid)'
  ] loop
    if has_function_privilege('public', v_funcion, 'EXECUTE')
       or has_function_privilege('anon', v_funcion, 'EXECUTE')
       or not has_function_privilege('authenticated', v_funcion, 'EXECUTE') then
      raise exception '22: ACL deliberada incorrecta en %', v_funcion;
    end if;
  end loop;

  if has_function_privilege('authenticated', 'establecer_admin(uuid,boolean)', 'EXECUTE')
     or has_function_privilege('anon', 'establecer_admin(uuid,boolean)', 'EXECUTE')
     or not has_function_privilege('service_role', 'establecer_admin(uuid,boolean)', 'EXECUTE') then
    raise exception '22: establecer_admin no está reservado a service_role';
  end if;

  if has_table_privilege('anon', 'avisos_push', 'SELECT')
     or has_table_privilege('authenticated', 'avisos_push', 'SELECT')
     or has_table_privilege('anon', 'push_configuracion', 'SELECT')
     or has_table_privilege('authenticated', 'push_configuracion', 'SELECT')
     or has_table_privilege('anon', 'retencion_dispositivos_estado', 'SELECT')
     or has_table_privilege('authenticated', 'retencion_dispositivos_estado', 'SELECT')
     or exists (
       select 1 from pg_class
        where oid = 'public.avisos_push'::regclass and not relrowsecurity
     )
     or exists (
       select 1 from pg_class
        where oid in (
          'public.push_configuracion'::regclass,
          'public.retencion_dispositivos_estado'::regclass
        ) and not relrowsecurity
     )
     or exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_push'
          and column_name = 'token' and is_nullable <> 'YES'
     )
     or (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'avisos_push'
            and column_name in (
              'ticket_id', 'ticket_el', 'peticion_el', 'recibo_consultado_el'
            )) <> 4
     or exists (
       select 1 from public.avisos_push
        where token is not null and (enviado_el is not null or intentos >= 5)
     ) then
    raise exception '22: cola push expuesta, incompleta o sin minimización';
  end if;

  if position('/push/getReceipts' in pg_get_functiondef(
       'public.push_soltar(integer)'::regprocedure
     )) = 0
     or position('ticket_id' in pg_get_functiondef(
       'public.push_confirmar()'::regprocedure
     )) = 0
     or position('push_configuracion' in pg_get_functiondef(
       'public.encola_avisos_push()'::regprocedure
     )) = 0
     or position('push_configuracion' in pg_get_functiondef(
       'public.push_soltar(integer)'::regprocedure
     )) = 0
     or position('push_configuracion' in pg_get_functiondef(
       'public.push_confirmar()'::regprocedure
     )) = 0
     or position('push_configuracion' in pg_get_functiondef(
       'public.push_ciclo()'::regprocedure
     )) = 0 then
    raise exception '22: push no verifica recibos o no respeta el interruptor';
  end if;

  if to_regclass('public.push_configuracion') is null
     or (select count(*) from public.push_configuracion
          where singleton and not habilitado and activado_el is null
            and activado_por is null) <> 1
     or (select count(*) from cron.job where jobname = 'rwadar-push') <> 0 then
    raise exception '22: push no quedó fail-closed y sin reloj';
  end if;

  if to_regclass('public.retencion_dispositivos_estado') is null
     or (select count(*) from public.retencion_dispositivos_estado
          where singleton) <> 1
     or (select count(*) from cron.job
          where jobname = 'rwadar-retencion-dispositivos') <> 1
     or exists (
       select 1 from cron.job
        where jobname = 'rwadar-retencion-dispositivos'
          and (schedule <> '17 3 * * *'
               or command not like '%retencion_dispositivos_ciclo%')
     ) then
    raise exception '22: retención diaria ausente, duplicada o alterada';
  end if;

  if not has_function_privilege(
       'service_role', 'retencion_dispositivos_ciclo(integer,integer)', 'EXECUTE'
     )
     or not has_table_privilege(
       'service_role', 'retencion_dispositivos_estado', 'SELECT'
     ) then
    raise exception '22: monitorización de retención no disponible a service_role';
  end if;

  if exists (
    select 1 from pg_class
     where relname in (
       'radar_publico', 'descartadas_sin_fuente', 'avisos_pendientes',
       'avisos_correo_pendientes', 'mi_perfil', 'opiniones_publicas',
       'nota_media', 'mis_opiniones', 'cola_moderacion',
       'emisiones_publicas', 'emisiones_rancias'
     )
       and relkind = 'v'
       and not (coalesce(reloptions, array[]::text[]) @> array['security_invoker=true'])
  ) then
    raise exception '22: existe una vista expuesta sin security_invoker';
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name in ('opiniones_publicas', 'mis_opiniones', 'cola_moderacion')
       and column_name in ('usuario_id', 'moderador_id', 'denunciante_id')
  ) then
    raise exception '22: una vista de opiniones expone identificadores personales';
  end if;

  for v_fila in
    select * from (values
      ('toca_actualizada_el()', 'search_path=public, pg_temp'),
      ('registra_cambio_estado()', 'search_path=public, pg_temp'),
      ('instalacion_actual()', 'search_path=public, pg_temp'),
      ('encola_avisos_correo()', 'search_path=public, pg_temp'),
      ('encola_avisos_push()', 'search_path=public, pg_temp'),
      ('push_soltar(integer)', 'search_path=public, net, pg_temp'),
      ('push_confirmar()', 'search_path=public, net, pg_temp'),
      ('push_ciclo()', 'search_path=public, pg_temp'),
      ('retencion_dispositivos_ciclo(integer,integer)', 'search_path=public, pg_temp'),
      ('emision_de_plataforma_en_radar()', 'search_path=public, pg_temp'),
      ('cerrar_emisiones_al_descartar()', 'search_path=public, pg_temp')
    ) as esperado(funcion, configuracion)
  loop
    if not coalesce((
      select p.proconfig @> array[v_fila.configuracion]
        from pg_proc p where p.oid = v_fila.funcion::regprocedure
    ), false) then
      raise exception '22: search_path incorrecto en %', v_fila.funcion;
    end if;
  end loop;

  for v_fila in
    select * from (values
      ('avisos_soltar(integer)', 'search_path=public, net, vault, pg_temp'),
      ('avisos_confirmar()', 'search_path=public, net, pg_temp'),
      ('avisos_ciclo()', 'search_path=public, pg_temp')
    ) as opcional(funcion, configuracion)
  loop
    if to_regprocedure(v_fila.funcion) is not null then
      foreach v_rol in array array['public', 'anon', 'authenticated'] loop
        if has_function_privilege(v_rol, v_fila.funcion, 'EXECUTE') then
          raise exception '22: % opcional conserva EXECUTE para %',
            v_fila.funcion, v_rol;
        end if;
      end loop;
      if not coalesce((
        select p.proconfig @> array[v_fila.configuracion]
          from pg_proc p where p.oid = to_regprocedure(v_fila.funcion)
      ), false) then
        raise exception '22: search_path incorrecto en %', v_fila.funcion;
      end if;
    end if;
  end loop;

  raise notice 'RWAdar 22 OK: permisos, RPC, push apagado y retención diaria verificados';
end $$;

rollback;
