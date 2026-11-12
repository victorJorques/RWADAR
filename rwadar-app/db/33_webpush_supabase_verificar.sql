-- =====================================================================
-- RWAdar 33 · verificador: las notificaciones web salen desde Supabase
-- Solo lee: no envía, no agenda y no devuelve secretos. Cualquier
-- desviación aborta con una excepción. Pasa con todo apagado y con el push
-- encendido. Va junto a los verificadores 30, 31 y 32 (el 30 ya exige RLS y
-- ningún permiso en todas las tablas y funciones de rwadar_novedades,
-- también las de la 33).
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_dueno oid;
  v_firma text;
  v_rol text;
  v_procesar text;
  v_push text;
  v_encolar text;
  v_def text;
  v_funcion record;
  v_cfg record;
  v_secretos integer;
  v_en_curso integer;
  v_atascados integer;
begin
  if to_regclass('rwadar_novedades.envios_web') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null then
    raise exception '33: faltan la 30 y la 32 (aplicar 30, 31, 32 y 33 en ese orden)';
  end if;

  -- La petición de pg_net de cada envío.
  if (select count(*) from pg_attribute
       where attrelid = 'rwadar_novedades.envios_web'::regclass and not attisdropped and attnum > 0
         and ((attname = 'peticion_id' and atttypid = 'bigint'::regtype)
              or (attname = 'peticion_el' and atttypid = 'timestamptz'::regtype))) <> 2
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.envios_web'::regclass
                       and conname = 'envio_web_peticion_con_fecha' and contype = 'c' and convalidated) then
    raise exception '33: faltan las columnas de la petición en envios_web (aplicar 33_webpush_supabase.sql)';
  end if;

  -- Funciones internas: existen, solo el propietario (el mismo dueño que
  -- procesar()), security definer y search_path vacío.
  select p.proowner into v_dueno from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure;
  foreach v_firma in array array[
    'rwadar_novedades.procesar()',
    'rwadar_novedades.webpush_codigo(integer,text)',
    'rwadar_novedades.webpush_encolar(jsonb)',
    'rwadar_novedades.enviar_webpush(integer)',
    'rwadar_novedades.leer_webpush()',
    'rwadar_novedades.webpush_prueba_supabase()',
    'rwadar_novedades.webpush_prueba_supabase_resultado(jsonb)'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '33: falta la función % (aplicar 33_webpush_supabase.sql)', v_firma;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, v_firma, 'EXECUTE') then
        raise exception '33: % es ejecutable por %', v_firma, v_rol;
      end if;
    end loop;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                            and p.proowner = v_dueno
                       from pg_proc p where p.oid = to_regprocedure(v_firma)), false) then
      raise exception '33: % no es security definer con search_path vacío y el dueño de procesar()', v_firma;
    end if;
  end loop;

  -- procesar() envía las notificaciones web, en su sitio: dentro del bloque
  -- del push, después de Expo y antes de la limpieza final. Reaplicar la 30
  -- la devuelve a su versión sin ellas.
  v_procesar := pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure);
  if position('rwadar_novedades.leer_webpush()' in v_procesar) = 0
     or position('rwadar_novedades.enviar_webpush()' in v_procesar) = 0 then
    raise exception '33: procesar() no envía las notificaciones web (¿se reaplicó la 30? reaplicar 31, 32 y 33)';
  end if;
  v_push := substring(v_procesar from '\n  if v_cfg\.push_habilitado then\n(.*?)\n  end if;\n  begin\n    v_n := rwadar_novedades\.limpiar\(\);\n');
  if position('pg_try_advisory_xact_lock(20261105, 30)' in v_procesar) = 0
     or position('rwadar_novedades.rellenar()' in v_procesar) = 0
     or position('rwadar_novedades.repartir()' in v_procesar) = 0
     or position('rwadar_novedades.leer_correos()' in v_procesar) = 0
     or position('rwadar_novedades.enviar_correos()' in v_procesar) = 0
     or v_push is null
     or (length(v_procesar) - length(replace(v_procesar, 'rwadar_novedades.leer_webpush()', ''))) <> length('rwadar_novedades.leer_webpush()')
     or (length(v_procesar) - length(replace(v_procesar, 'rwadar_novedades.enviar_webpush()', ''))) <> length('rwadar_novedades.enviar_webpush()')
     or not (position('rwadar_novedades.leer_push()' in v_push) > 0
             and position('rwadar_novedades.leer_push()' in v_push) < position('rwadar_novedades.enviar_push()' in v_push)
             and position('rwadar_novedades.enviar_push()' in v_push) < position('rwadar_novedades.leer_webpush()' in v_push)
             and position('rwadar_novedades.leer_webpush()' in v_push) < position('rwadar_novedades.enviar_webpush()' in v_push)) then
    raise exception '33: procesar() no llama a leer_webpush() y enviar_webpush() en su sitio (dentro del bloque del push, después de Expo; reaplicar 33_webpush_supabase.sql)';
  end if;

  -- La única llamada al servidor de la web, con el contrato: su dirección,
  -- la privada solo en su cabecera, el cuerpo de cuatro campos y 10 segundos.
  v_encolar := pg_get_functiondef('rwadar_novedades.webpush_encolar(jsonb)'::regprocedure);
  if position('url := ''https://rwadar.pages.dev/api/interno/webpush''' in v_encolar) = 0
     or (length(v_encolar) - length(replace(v_encolar, 'net.http_post(', ''))) <> length('net.http_post(')
     or (length(v_encolar) - length(replace(v_encolar, 'url := ', ''))) <> length('url := ')
     or position('''x-rwadar-vapid-privada'', v_privada' in v_encolar) = 0
     or position('''x-rwadar-vapid-publica'', v_publica' in v_encolar) = 0
     or position('headers := v_cabeceras' in v_encolar) = 0
     or position('body := jsonb_build_object(''endpoint'', r.endpoint, ''p256dh'', r.p256dh, ''auth'', r.auth, ''carga'', r.carga)' in v_encolar) = 0
     or position('timeout_milliseconds := 10000' in v_encolar) = 0
     or position('s.name = ''RWADAR_VAPID_PRIVADA''' in v_encolar) = 0 then
    raise exception '33: webpush_encolar no pide al servidor de la web lo del contrato (reaplicar 33_webpush_supabase.sql)';
  end if;
  -- La privada solo se lee en webpush_encolar, y solo ella llama al
  -- servidor de la web: el envío y la prueba pasan por ella.
  if (select count(*) from pg_proc p
       where p.pronamespace = 'rwadar_novedades'::regnamespace and p.prosrc like '%RWADAR_VAPID_PRIVADA%') <> 1
     or (select count(*) from pg_proc p
          where p.prosrc like '%/api/interno/webpush%'
            and p.pronamespace not in ('pg_catalog'::regnamespace, 'information_schema'::regnamespace)) <> 1 then
    raise exception '33: la clave privada VAPID o el servidor de la web se usan fuera de webpush_encolar';
  end if;
  foreach v_firma in array array['rwadar_novedades.enviar_webpush(integer)', 'rwadar_novedades.webpush_prueba_supabase()'] loop
    v_def := pg_get_functiondef(to_regprocedure(v_firma));
    if position('rwadar_novedades.webpush_encolar(' in v_def) = 0 or position('net.http_post' in v_def) > 0 then
      raise exception '33: % no pide las notificaciones por webpush_encolar', v_firma;
    end if;
  end loop;
  -- El envío exige el interruptor y reutiliza las reglas de la 32; la
  -- lectura, las de webpush_resultado; la prueba, solo administración.
  v_def := pg_get_functiondef('rwadar_novedades.enviar_webpush(integer)'::regprocedure);
  if position('push_habilitado' in v_def) = 0 or position('rwadar_novedades.webpush_pendientes(' in v_def) = 0 then
    raise exception '33: enviar_webpush no comprueba el interruptor del push o no usa webpush_pendientes';
  end if;
  v_def := pg_get_functiondef('rwadar_novedades.leer_webpush()'::regprocedure);
  if position('rwadar_novedades.webpush_resultado(' in v_def) = 0 or position('rwadar_novedades.webpush_codigo(' in v_def) = 0
     or position('net.http_post' in v_def) > 0 then
    raise exception '33: leer_webpush no aplica las reglas de webpush_resultado';
  end if;
  v_def := pg_get_functiondef('rwadar_novedades.webpush_prueba_supabase()'::regprocedure);
  if position('rwadar_novedades.webpush_prueba()' in v_def) = 0
     or position('suscripciones_web' in v_def) > 0
     or position('es_admin' in pg_get_functiondef('rwadar_novedades.webpush_prueba()'::regprocedure)) = 0 then
    raise exception '33: la prueba desde Supabase no se limita a las cuentas de administración (webpush_prueba)';
  end if;

  -- La clave pública para el servidor de la web: anon y authenticated, nada
  -- más; definer, search_path vacío, stable, sin argumentos, texto, y solo
  -- esa columna.
  v_firma := 'public.clave_publica_webpush_anon()';
  if to_regprocedure(v_firma) is null then
    raise exception '33: falta %', v_firma;
  end if;
  if has_function_privilege('public', v_firma, 'EXECUTE')
     or has_function_privilege('service_role', v_firma, 'EXECUTE')
     or not has_function_privilege('anon', v_firma, 'EXECUTE')
     or not has_function_privilege('authenticated', v_firma, 'EXECUTE') then
    raise exception '33: permisos incorrectos en % (solo anon y authenticated)', v_firma;
  end if;
  select p.prosecdef, p.proconfig, p.provolatile, p.prorettype, p.pronargs, p.proretset, p.prosrc
    into v_funcion from pg_proc p where p.oid = to_regprocedure(v_firma);
  if not v_funcion.prosecdef or not coalesce(v_funcion.proconfig && array['search_path=""', 'search_path='], false)
     or v_funcion.provolatile <> 's' or v_funcion.prorettype <> 'text'::regtype or v_funcion.pronargs <> 0
     or v_funcion.proretset
     or v_funcion.prosrc !~ '^\s*select c\.webpush_clave_publica from rwadar_novedades\.configuracion c where c\.unica\s*$' then
    raise exception '33: % no es la de la 33 (solo devuelve la clave pública; reaplicar 33_webpush_supabase.sql)', v_firma;
  end if;

  -- Estado (solo cuentas): envíos esperando respuesta del servidor y los
  -- que llevan más de una hora así (con el push apagado se quedan hasta
  -- volver a encenderlo; con él encendido, el reloj los da por perdidos a
  -- los 10 minutos).
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  select count(*) into v_secretos from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  select count(*) filter (where e.estado = 'enviando' and e.peticion_id is not null),
         count(*) filter (where e.estado = 'enviando' and e.peticion_id is not null
                            and e.peticion_el < now() - interval '1 hour')
    into v_en_curso, v_atascados
    from rwadar_novedades.envios_web e;
  raise notice 'RWAdar 33 OK: las notificaciones web salen desde Supabase (pg_net al servidor de la web, en cada vuelta del reloj con el push encendido); % envío(s) esperando respuesta (% de hace más de una hora), clave VAPID %, push %',
    v_en_curso, v_atascados,
    case when v_cfg.webpush_clave_publica is not null and v_secretos = 1 then 'creada' else 'sin crear' end,
    case when v_cfg.push_habilitado then 'encendido' else 'apagado' end;
end
$verificador$;

rollback;
