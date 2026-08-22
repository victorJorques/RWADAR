-- Verificador read-only del opt-in de correo. No envía, no agenda y no toca
-- secretos: solo comprueba su presencia/forma sin devolver sus valores.
begin transaction read only;

do $verificador$
declare
  v_funcion text;
  v_rol text;
  v_definicion text;
  v_clave text;
  v_remitente text;
  v_tabla regclass;
begin
  if to_regclass('public.correo_configuracion') is null
     or (select count(*) from public.correo_configuracion
          where singleton and habilitado and proveedor = 'brevo'
            and origen_https = 'https://rwadar.pages.dev'
            and consentimiento_version = 'correo-v1-2026-08-22'
            and legado_cerrado_el is not null
            and activado_el is not null
            and nullif(activado_por, '') is not null) <> 1 then
    raise exception 'correo opt-in: interruptor ausente, apagado o no auditable';
  end if;

  if exists (
       select 1 from pg_class
        where oid = 'public.correo_configuracion'::regclass and not relrowsecurity
     )
     or has_table_privilege('anon', 'correo_configuracion', 'SELECT')
     or has_table_privilege('authenticated', 'correo_configuracion', 'SELECT') then
    raise exception 'correo opt-in: configuración expuesta a clientes';
  end if;

  if has_table_privilege('anon', 'vault.decrypted_secrets', 'SELECT')
     or has_table_privilege('authenticated', 'vault.decrypted_secrets', 'SELECT') then
    raise exception 'correo opt-in: Vault expuesto a clientes';
  end if;
  foreach v_tabla in array array[
    to_regclass('net.http_request_queue'), to_regclass('net._http_response')
  ] loop
    if v_tabla is not null then
      if has_table_privilege('anon', v_tabla, 'SELECT')
         or has_table_privilege('authenticated', v_tabla, 'SELECT') then
        raise exception 'correo opt-in: cola pg_net % expuesta a clientes', v_tabla;
      end if;
    end if;
  end loop;

  if to_regprocedure('public.configurar_avisos_correo(boolean,text)') is null
     or has_function_privilege('public',
          'public.configurar_avisos_correo(boolean,text)', 'EXECUTE')
     or has_function_privilege('anon',
          'public.configurar_avisos_correo(boolean,text)', 'EXECUTE')
     or has_function_privilege('service_role',
          'public.configurar_avisos_correo(boolean,text)', 'EXECUTE')
     or not has_function_privilege('authenticated',
          'public.configurar_avisos_correo(boolean,text)', 'EXECUTE')
     or position('auth.uid()' in pg_get_functiondef(
          'public.configurar_avisos_correo(boolean,text)'::regprocedure)) = 0
     or position('correo-v1-2026-08-22' in pg_get_functiondef(
          'public.configurar_avisos_correo(boolean,text)'::regprocedure)) = 0 then
    raise exception 'correo opt-in: RPC de consentimiento ausente o insegura';
  end if;

  if has_column_privilege('authenticated', 'perfiles',
                          'avisos_correo', 'UPDATE')
     or has_column_privilege('authenticated', 'perfiles',
                             'avisos_correo_aceptado_el', 'UPDATE')
     or has_column_privilege('authenticated', 'perfiles',
                             'avisos_correo_version', 'UPDATE')
     or not has_column_privilege('authenticated', 'perfiles', 'nombre', 'UPDATE')
     or position('false' in lower(coalesce((
       select column_default from information_schema.columns
        where table_schema = 'public' and table_name = 'perfiles'
          and column_name = 'avisos_correo'
     ), ''))) = 0
     or exists (
       select 1 from public.perfiles
        where avisos_correo and (
          avisos_correo_aceptado_el is null
          or avisos_correo_version <> 'correo-v1-2026-08-22'
        )
     ) then
    raise exception 'correo opt-in: consentimiento explícito no está cerrado';
  end if;

  if not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_correo'
          and column_name = 'peticion_el'
     )
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_correo'
          and column_name = 'intentos' and is_nullable = 'NO'
     )
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_correo'
          and column_name = 'idempotencia' and data_type = 'uuid'
     )
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_correo'
          and column_name = 'idempotencia_el'
          and data_type = 'timestamp with time zone'
     )
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'avisos_correo'
          and column_name = 'proveedor_mensaje_id' and data_type = 'text'
     ) then
    raise exception 'correo opt-in: cola sin columnas operativas de 23';
  end if;

  if public.correo_html_escapar('<&>"''') <> '&lt;&amp;&gt;&quot;&#39;' then
    raise exception 'correo opt-in: escape HTML incompleto';
  end if;

  foreach v_funcion in array array[
    'correo_html_escapar(text)', 'avisos_soltar(integer)',
    'avisos_confirmar()', 'avisos_ciclo()'
  ] loop
    if to_regprocedure('public.' || v_funcion) is null then
      raise exception 'correo opt-in: falta función %', v_funcion;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, 'public.' || v_funcion, 'EXECUTE') then
        raise exception 'correo opt-in: % conserva EXECUTE para %', v_funcion, v_rol;
      end if;
    end loop;
  end loop;

  foreach v_funcion in array array[
    'avisos_soltar(integer)', 'avisos_confirmar()', 'avisos_ciclo()'
  ] loop
    v_definicion := pg_get_functiondef(('public.' || v_funcion)::regprocedure);
    if position('correo_configuracion' in v_definicion) = 0 then
      raise exception 'correo opt-in: % no consulta el interruptor', v_funcion;
    end if;
    if position('search_path=public, pg_temp' in coalesce(array_to_string(
         (select proconfig from pg_proc where oid = ('public.' || v_funcion)::regprocedure),
         ','), '')) = 0 then
      raise exception 'correo opt-in: search_path inseguro en %', v_funcion;
    end if;
  end loop;

  v_definicion := pg_get_functiondef('public.avisos_soltar(integer)'::regprocedure);
  if position('https://rwadar.pages.dev' in v_definicion) = 0
     or position('https://api.brevo.com/v3/smtp/email' in v_definicion) = 0
     or position('correo_html_escapar' in v_definicion) = 0
     or position('email_confirmed_at is not null' in lower(v_definicion)) = 0
     or position('vigilancia' in lower(v_definicion)) = 0
     or position('avisos_correo_aceptado_el' in v_definicion) = 0
     or position('correo-v1-2026-08-22' in v_definicion) = 0
     or position('Idempotency-Key' in v_definicion) = 0
     or position('timeout_milliseconds := 10000' in v_definicion) = 0
     or position($texto$interval '10 minutes'$texto$ in v_definicion) = 0
     or position($texto$interval '25 minutes'$texto$ in v_definicion) = 0
     or position('contactPixelTrackingConsent' in v_definicion) = 0
     or position('netlify' in lower(v_definicion)) > 0 then
    raise exception 'correo opt-in: destino, escape, idempotencia o filtros alterados';
  end if;

  if not exists (
    select 1 from pg_index i
     where i.indrelid = 'public.avisos_correo'::regclass
       and i.indisunique
       and pg_get_indexdef(i.indexrelid) like '%(idempotencia)%'
  ) then
    raise exception 'correo opt-in: falta unicidad de la clave idempotente';
  end if;

  if (select count(*) from cron.job
       where jobname = 'rwadar-avisos'
          or lower(coalesce(command, '')) like '%avisos_ciclo%'
          or lower(coalesce(command, '')) like '%avisos_soltar%'
          or lower(coalesce(command, '')) like '%avisos_confirmar%') <> 1
     or not exists (
       select 1 from cron.job
        where jobname = 'rwadar-avisos'
          and schedule = '*/5 * * * *'
          and active
          and lower(command) like '%public.avisos_ciclo%'
     ) then
    raise exception 'correo opt-in: reloj ausente, duplicado o alterado';
  end if;

  if not has_table_privilege('service_role', 'correo_configuracion', 'SELECT')
     or has_table_privilege('service_role', 'correo_configuracion', 'INSERT')
     or has_table_privilege('service_role', 'correo_configuracion', 'UPDATE')
     or has_table_privilege('service_role', 'correo_configuracion', 'DELETE')
     or has_table_privilege('service_role', 'correo_configuracion', 'TRUNCATE')
     or has_table_privilege('service_role', 'correo_configuracion', 'REFERENCES')
     or has_table_privilege('service_role', 'correo_configuracion', 'TRIGGER') then
    raise exception 'correo opt-in: ACL de service_role sobre configuración alterada';
  end if;

  -- La retención de privacidad debe seguir independiente del correo.
  if (select count(*) from cron.job
       where jobname = 'rwadar-retencion-dispositivos') <> 1 then
    raise exception 'correo opt-in: falta el reloj independiente de retención';
  end if;

  select max(decrypted_secret) filter (where name = 'BREVO_API_KEY'),
         max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE')
    into v_clave, v_remitente
    from vault.decrypted_secrets
   where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
  if length(trim(coalesce(v_clave, ''))) < 20
     or trim(coalesce(v_remitente, '')) !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception 'correo opt-in: Vault no contiene las dos credenciales válidas';
  end if;

  raise notice 'RWAdar correo opt-in OK: flag, Vault, HTML, ACL, origen y reloj verificados';
end
$verificador$;

rollback;
