-- =====================================================================
-- RWAdar · verificación posterior de 15_acl_funciones.sql (solo lectura)
-- =====================================================================
begin transaction read only;

do $$
declare
  v_funcion text;
  v_rol text;
begin
  foreach v_funcion in array array[
    'crea_perfil()',
    'encola_avisos_correo()',
    'revisa_denuncias()',
    'sincroniza_autor_opiniones()'
  ] loop
    foreach v_rol in array array['public', 'anon', 'authenticated'] loop
      if has_function_privilege(v_rol, v_funcion, 'EXECUTE') then
        raise exception '% conserva EXECUTE para %', v_funcion, v_rol;
      end if;
    end loop;
  end loop;

  foreach v_funcion in array array[
    'toca_actualizada_el()',
    'registra_cambio_estado()',
    'instalacion_actual()'
  ] loop
    if not coalesce((
      select p.proconfig @> array['search_path=public, pg_temp']
        from pg_proc p
       where p.oid = v_funcion::regprocedure
    ), false) then
      raise exception '% no tiene search_path=public, pg_temp', v_funcion;
    end if;
  end loop;

  -- Estas RPC autenticadas son parte deliberada del producto. El cierre de
  -- helpers no debe retirarlas ni concederlas a anon/PUBLIC.
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
      raise exception 'ACL deliberada incorrecta en %', v_funcion;
    end if;
  end loop;

  raise notice 'RWAdar 15 OK: cuatro helpers cerrados, tres search_path fijos y RPC intactas';
end $$;

rollback;
