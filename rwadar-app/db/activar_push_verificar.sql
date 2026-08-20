-- Verificador fail-closed del opt-in PUSH. No cambia el estado comprobado.
begin transaction read only;

do $$
declare
  v_funcion text;
  v_rol text;
begin
  if to_regclass('public.push_configuracion') is null
     or (select count(*) from public.push_configuracion
          where singleton and habilitado and activado_el is not null
            and nullif(activado_por, '') is not null) <> 1 then
    raise exception 'push opt-in: interruptor no activado de forma auditable';
  end if;

  if (select count(*) from cron.job where jobname = 'rwadar-push') <> 1
     or exists (
       select 1 from cron.job
        where jobname = 'rwadar-push'
          and (schedule <> '*/2 * * * *' or command not like '%push_ciclo%')
     ) then
    raise exception 'push opt-in: reloj ausente, duplicado o alterado';
  end if;

  -- La retención de privacidad es independiente y debe continuar presente.
  if (select count(*) from cron.job
       where jobname = 'rwadar-retencion-dispositivos') <> 1 then
    raise exception 'push opt-in: falta el reloj independiente de retención';
  end if;

  if exists (
       select 1 from pg_class
        where oid = 'public.push_configuracion'::regclass and not relrowsecurity
     )
     or has_table_privilege('anon', 'push_configuracion', 'SELECT')
     or has_table_privilege('authenticated', 'push_configuracion', 'SELECT') then
    raise exception 'push opt-in: configuración expuesta a clientes';
  end if;

  foreach v_funcion in array array[
    'encola_avisos_push()', 'push_soltar(integer)',
    'push_confirmar()', 'push_ciclo()'
  ] loop
    if position('push_configuracion' in pg_get_functiondef(v_funcion::regprocedure)) = 0 then
      raise exception 'push opt-in: % no consulta el interruptor', v_funcion;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated'] loop
      if has_function_privilege(v_rol, v_funcion, 'EXECUTE') then
        raise exception 'push opt-in: % conserva EXECUTE para %', v_funcion, v_rol;
      end if;
    end loop;
  end loop;

  raise notice 'RWAdar push opt-in OK: interruptor, ACL, retención y reloj verificados';
end $$;

rollback;
