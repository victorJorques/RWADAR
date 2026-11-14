-- =====================================================================
-- RWAdar 36 · verificador de las notificaciones sin cuenta
-- Solo lee: no envía, no agenda y no devuelve secretos. Cualquier
-- desviación aborta con una excepción. Pasa con el interruptor sin cuenta
-- apagado (como nace) y encendido. Va junto a los verificadores 30 a 34 (el
-- 30 ya exige RLS y ningún permiso en todas las tablas y funciones de
-- rwadar_novedades, también las de la 36; el 33, que la clave privada VAPID y
-- el servidor de la web solo se usen en webpush_encolar).
-- Detecta que se reaplicó la 30, la 32 o la 33 después de la 36 (procesar()
-- o limpiar() sin lo de sin cuenta): entonces hay que reaplicar la 36.
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_cfg record;
  v_dueno oid;
  v_firma text;
  v_rol text;
  v_tabla text;
  v_procesar text;
  v_push text;
  v_limpiar text;
  v_def text;
  v_llamada text;
  v_pos integer;
  v_anterior integer;
  v_web integer;
  v_movil integer;
  v_historial integer;
begin
  if to_regclass('rwadar_novedades.sin_cuenta_web') is null
     or to_regclass('rwadar_novedades.sin_cuenta_movil') is null
     or to_regclass('rwadar_novedades.envios_sin_cuenta_web') is null
     or to_regclass('rwadar_novedades.pushes_sin_cuenta') is null
     or to_regclass('rwadar_novedades.historial_sin_cuenta') is null then
    raise exception '36: faltan las tablas sin cuenta (aplicar 36_avisos_sin_cuenta.sql)';
  end if;
  if (select count(*) from pg_attribute
       where attrelid = 'rwadar_novedades.configuracion'::regclass and not attisdropped and attnum > 0
         and attname in ('sin_cuenta_activa', 'sin_cuenta_activada_el', 'sin_cuenta_version', 'sin_cuenta_texto_es',
                         'sin_cuenta_texto_en', 'sin_cuenta_cupo_hora', 'sin_cuenta_maximo')) <> 7
     or (select count(*) from pg_constraint
          where conrelid = 'rwadar_novedades.configuracion'::regclass and contype = 'c' and convalidated
            and conname in ('sin_cuenta_activada_con_fecha', 'sin_cuenta_cupos_validos')) <> 2 then
    raise exception '36: faltan columnas o reglas sin cuenta en la configuración (reaplicar 36_avisos_sin_cuenta.sql)';
  end if;

  -- El texto versionado del contrato (castellano e inglés).
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if v_cfg.sin_cuenta_version is distinct from 'sin-cuenta-v1-2026-11-14'
     or v_cfg.sin_cuenta_texto_es is distinct from
        'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.'
     or v_cfg.sin_cuenta_texto_en is distinct from
        'I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It''s optional and doesn''t need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.' then
    raise exception '36: la versión o los textos del permiso sin cuenta no son los del contrato (reaplicar 36_avisos_sin_cuenta.sql)';
  end if;
  if v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is null then
    raise exception '36: sin cuenta activo sin fecha de activación';
  end if;

  -- Las mismas reglas que las tablas de las cuentas (32): servicios de push
  -- conocidos, claves con su forma, dirección única y token de Expo.
  if (select pg_get_constraintdef(c.oid) from pg_constraint c
       where c.conrelid = 'rwadar_novedades.sin_cuenta_web'::regclass and c.conname = 'sin_cuenta_web_endpoint_valido'
         and c.contype = 'c' and c.convalidated)
     is distinct from
     (select pg_get_constraintdef(c.oid) from pg_constraint c
       where c.conrelid = 'rwadar_novedades.suscripciones_web'::regclass and c.conname = 'suscripcion_web_endpoint_valido')
     or (select count(*) from pg_constraint
          where conrelid = 'rwadar_novedades.sin_cuenta_web'::regclass and contype in ('c', 'u') and convalidated
            and conname in ('sin_cuenta_web_endpoint_unico', 'sin_cuenta_web_p256dh_valida', 'sin_cuenta_web_auth_valida',
                            'sin_cuenta_web_idioma_valido', 'sin_cuenta_web_origen_valido', 'sin_cuenta_web_fallos_validos')) <> 6
     or (select count(*) from pg_constraint
          where conrelid = 'rwadar_novedades.sin_cuenta_movil'::regclass and contype in ('c', 'u') and convalidated
            and conname in ('sin_cuenta_movil_token_unico', 'sin_cuenta_movil_token_valido', 'sin_cuenta_movil_plataforma_valida',
                            'sin_cuenta_movil_idioma_valido', 'sin_cuenta_movil_origen_valido', 'sin_cuenta_movil_fallos_validos')) <> 6
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.envios_sin_cuenta_web'::regclass
                       and conname = 'envio_sin_cuenta_web_uno_por_par' and contype = 'u')
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.pushes_sin_cuenta'::regclass
                       and conname = 'push_sin_cuenta_uno_por_par' and contype = 'u') then
    raise exception '36: faltan o están cambiadas las reglas de las tablas sin cuenta (reaplicar 36_avisos_sin_cuenta.sql)';
  end if;
  -- Sin usuario: ninguna clave ajena a auth.users. Las colas se borran con
  -- el anuncio y con su navegador o móvil; el historial no tiene ninguna.
  if exists (select 1 from pg_constraint
              where contype = 'f' and confrelid = 'auth.users'::regclass
                and conrelid in ('rwadar_novedades.sin_cuenta_web'::regclass, 'rwadar_novedades.sin_cuenta_movil'::regclass,
                                 'rwadar_novedades.envios_sin_cuenta_web'::regclass, 'rwadar_novedades.pushes_sin_cuenta'::regclass,
                                 'rwadar_novedades.historial_sin_cuenta'::regclass))
     or exists (select 1 from pg_constraint
                 where contype = 'f' and conrelid = 'rwadar_novedades.historial_sin_cuenta'::regclass)
     or (select count(*) from pg_constraint
          where contype = 'f' and confdeltype = 'c'
            and ((conrelid = 'rwadar_novedades.envios_sin_cuenta_web'::regclass
                  and confrelid in ('rwadar_novedades.anuncios'::regclass, 'rwadar_novedades.sin_cuenta_web'::regclass))
                 or (conrelid = 'rwadar_novedades.pushes_sin_cuenta'::regclass
                     and confrelid in ('rwadar_novedades.anuncios'::regclass, 'rwadar_novedades.sin_cuenta_movil'::regclass)))) <> 4 then
    raise exception '36: las tablas sin cuenta no tienen las claves ajenas del contrato';
  end if;
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'rwadar_novedades.historial_sin_cuenta'::regclass and tgname = 'historial_sin_cuenta_solo_anadir'
          and tgenabled <> 'D' and not tgisinternal and (tgtype & 2) = 2
          and tgfoid = 'rwadar_novedades.historial_sin_cuenta_solo_anadir()'::regprocedure) then
    raise exception '36: falta o está desactivado el disparador historial_sin_cuenta_solo_anadir';
  end if;

  -- Tablas privadas: RLS y ningún permiso, tampoco para service_role.
  foreach v_tabla in array array['rwadar_novedades.sin_cuenta_web', 'rwadar_novedades.sin_cuenta_movil',
    'rwadar_novedades.envios_sin_cuenta_web', 'rwadar_novedades.pushes_sin_cuenta', 'rwadar_novedades.historial_sin_cuenta'] loop
    if not (select c.relrowsecurity from pg_class c where c.oid = v_tabla::regclass) then
      raise exception '36: la tabla % no tiene RLS', v_tabla;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_table_privilege(v_rol, v_tabla, 'SELECT') or has_table_privilege(v_rol, v_tabla, 'INSERT')
         or has_table_privilege(v_rol, v_tabla, 'UPDATE') or has_table_privilege(v_rol, v_tabla, 'DELETE')
         or has_table_privilege(v_rol, v_tabla, 'TRUNCATE') or has_table_privilege(v_rol, v_tabla, 'REFERENCES')
         or has_table_privilege(v_rol, v_tabla, 'TRIGGER') then
        raise exception '36: % tiene permisos sobre %', v_rol, v_tabla;
      end if;
    end loop;
  end loop;

  -- Funciones internas: existen, solo el propietario (el dueño de
  -- procesar()), security definer y search_path vacío.
  select p.proowner into v_dueno from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure;
  foreach v_firma in array array[
    'rwadar_novedades.historial_sin_cuenta_solo_anadir()',
    'rwadar_novedades.sin_cuenta_quitar(text,bigint,text)',
    'rwadar_novedades.sin_cuenta_fallo(text,bigint)',
    'rwadar_novedades.sin_cuenta_expo_cabeceras()',
    'rwadar_novedades.sin_cuenta_expo_leer(text,text)',
    'rwadar_novedades.sin_cuenta_enviar_webpush(integer)',
    'rwadar_novedades.sin_cuenta_leer_webpush()',
    'rwadar_novedades.sin_cuenta_enviar_push(integer)',
    'rwadar_novedades.sin_cuenta_leer_push()',
    'rwadar_novedades.sin_cuenta_limpiar()',
    'rwadar_novedades.sin_cuenta_prueba()',
    'rwadar_novedades.sin_cuenta_prueba_resultado(jsonb)',
    'rwadar_novedades.procesar()',
    'rwadar_novedades.limpiar()'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '36: falta la función % (aplicar 36_avisos_sin_cuenta.sql)', v_firma;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, v_firma, 'EXECUTE') then
        raise exception '36: % es ejecutable por %', v_firma, v_rol;
      end if;
    end loop;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                            and p.proowner = v_dueno
                       from pg_proc p where p.oid = to_regprocedure(v_firma)), false) then
      raise exception '36: % no es security definer con search_path vacío y el dueño de procesar()', v_firma;
    end if;
  end loop;

  -- API sin cuenta: anon y authenticated, nada más; definer, search_path
  -- vacío, sin pedir sesión, devuelve jsonb.
  foreach v_firma in array array[
    'public.avisos_sin_cuenta_texto()',
    'public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)',
    'public.baja_aviso_sin_cuenta_web(text,text)',
    'public.aviso_sin_cuenta_web_activo(text,text)',
    'public.alta_aviso_sin_cuenta_movil(text,text,text,text,text)',
    'public.baja_aviso_sin_cuenta_movil(text)',
    'public.aviso_sin_cuenta_movil_activo(text)',
    'public.avisos_publicos(integer)'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '36: falta la función % (aplicar 36_avisos_sin_cuenta.sql)', v_firma;
    end if;
    if has_function_privilege('public', v_firma, 'EXECUTE')
       or has_function_privilege('service_role', v_firma, 'EXECUTE')
       or not has_function_privilege('anon', v_firma, 'EXECUTE')
       or not has_function_privilege('authenticated', v_firma, 'EXECUTE') then
      raise exception '36: permisos incorrectos en % (solo anon y authenticated)', v_firma;
    end if;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                            and p.prorettype = 'jsonb'::regtype and not p.proretset
                       from pg_proc p where p.oid = to_regprocedure(v_firma)), false) then
      raise exception '36: % no es security definer con search_path vacío y una respuesta jsonb', v_firma;
    end if;
  end loop;
  -- Las altas exigen el interruptor, la versión vigente y los cupos; la
  -- baja no mira el interruptor.
  foreach v_firma in array array['public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)',
                                 'public.alta_aviso_sin_cuenta_movil(text,text,text,text,text)'] loop
    v_def := pg_get_functiondef(to_regprocedure(v_firma));
    if position('sin_cuenta_activa' in v_def) = 0 or position('push_habilitado' in v_def) = 0
       or position('sin_cuenta_version' in v_def) = 0 or position('sin_cuenta_cupo_hora' in v_def) = 0
       or position('sin_cuenta_maximo' in v_def) = 0 or position('pg_advisory_xact_lock(20261114, 361)' in v_def) = 0 then
      raise exception '36: % no comprueba el interruptor, la versión o los cupos', v_firma;
    end if;
  end loop;
  if position('en_uso' in pg_get_functiondef('public.alta_aviso_sin_cuenta_web(text,text,text,text,text,text)'::regprocedure)) = 0 then
    raise exception '36: el alta web no rechaza una dirección con otra clave auth';
  end if;
  foreach v_firma in array array['public.baja_aviso_sin_cuenta_web(text,text)', 'public.baja_aviso_sin_cuenta_movil(text)'] loop
    if position('sin_cuenta_activa' in pg_get_functiondef(to_regprocedure(v_firma))) > 0 then
      raise exception '36: la baja % depende del interruptor (tiene que funcionar siempre)', v_firma;
    end if;
  end loop;

  -- El envío exige los dos interruptores y no duplica con las cuentas; la
  -- web pasa por webpush_encolar (33) y nunca llama a nadie por su cuenta.
  v_def := pg_get_functiondef('rwadar_novedades.sin_cuenta_enviar_webpush(integer)'::regprocedure);
  if position('push_habilitado' in v_def) = 0 or position('sin_cuenta_activa' in v_def) = 0
     or position('rwadar_novedades.webpush_encolar(' in v_def) = 0 or position('net.http_post' in v_def) > 0
     or position('rwadar_novedades.suscripciones_web' in v_def) = 0 or position('interval ''7 days''' in v_def) = 0 then
    raise exception '36: sin_cuenta_enviar_webpush no comprueba los interruptores, los 7 días o las cuentas, o no usa webpush_encolar';
  end if;
  v_def := pg_get_functiondef('rwadar_novedades.sin_cuenta_enviar_push(integer)'::regprocedure);
  if position('push_habilitado' in v_def) = 0 or position('sin_cuenta_activa' in v_def) = 0
     or position('rwadar_novedades.dispositivos' in v_def) = 0 or position('interval ''7 days''' in v_def) = 0
     or position('''priority'', ''high''' in v_def) = 0 or position('''channelId'', ''novedades''' in v_def) = 0 then
    raise exception '36: sin_cuenta_enviar_push no comprueba los interruptores, los 7 días o las cuentas, o no usa prioridad alta y el canal novedades';
  end if;
  if position('rwadar_novedades.webpush_codigo(' in pg_get_functiondef('rwadar_novedades.sin_cuenta_leer_webpush()'::regprocedure)) = 0
     or position('net.http_post' in pg_get_functiondef('rwadar_novedades.sin_cuenta_leer_webpush()'::regprocedure)) > 0
     or position('DeviceNotRegistered' in pg_get_functiondef('rwadar_novedades.sin_cuenta_leer_push()'::regprocedure)) = 0 then
    raise exception '36: la lectura sin cuenta no aplica las reglas del contrato';
  end if;

  -- procesar(): los cuatro bloques sin cuenta, una vez cada uno, dentro del
  -- bloque del push y después de las notificaciones web de las cuentas.
  -- Reaplicar la 30 o la 33 la devuelve a su versión sin ellos.
  v_procesar := pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure);
  v_push := substring(v_procesar from '\n  if v_cfg\.push_habilitado then\n(.*?)\n  end if;\n  begin\n    v_n := rwadar_novedades\.limpiar\(\);\n');
  if v_push is null then
    raise exception '36: procesar() no envía las notificaciones sin cuenta (¿se reaplicó la 30 o la 33? reaplicar 36_avisos_sin_cuenta.sql)';
  end if;
  v_anterior := position('rwadar_novedades.enviar_webpush()' in v_push);
  foreach v_llamada in array array['rwadar_novedades.sin_cuenta_leer_push()', 'rwadar_novedades.sin_cuenta_enviar_push()',
                                   'rwadar_novedades.sin_cuenta_leer_webpush()', 'rwadar_novedades.sin_cuenta_enviar_webpush()'] loop
    v_pos := position(v_llamada in v_push);
    if v_anterior = 0 or v_pos <= v_anterior
       or (length(v_procesar) - length(replace(v_procesar, v_llamada, ''))) <> length(v_llamada) then
      raise exception '36: procesar() no envía las notificaciones sin cuenta (¿se reaplicó la 30 o la 33? reaplicar 36_avisos_sin_cuenta.sql)';
    end if;
    v_anterior := v_pos;
  end loop;

  -- limpiar(): la de la 32 con la limpieza sin cuenta (reaplicar la 30 o
  -- la 32 la quita). Sin red ni Vault.
  v_limpiar := pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure);
  if position('rwadar_novedades.webpush_limpiar()' in v_limpiar) = 0
     or position('rwadar_novedades.sin_cuenta_limpiar()' in v_limpiar) = 0 then
    raise exception '36: limpiar() no borra lo de sin cuenta (¿se reaplicó la 30 o la 32? reaplicar 36_avisos_sin_cuenta.sql)';
  end if;
  v_def := lower(pg_get_functiondef('rwadar_novedades.sin_cuenta_limpiar()'::regprocedure));
  if position('net.' in v_def) > 0 or position('vault.' in v_def) > 0
     or position('interval ''90 days''' in v_def) = 0 or position('interval ''180 days''' in v_def) = 0
     or position('interval ''3 years''' in v_def) = 0 then
    raise exception '36: sin_cuenta_limpiar() no cumple los plazos (90 días, 180 días y 3 años) o hace red';
  end if;

  -- La prueba solo sale con 5 suscripciones sin cuenta o menos.
  if position('if v_web + v_movil > 5 then' in pg_get_functiondef('rwadar_novedades.sin_cuenta_prueba()'::regprocedure)) = 0 then
    raise exception '36: la prueba sin cuenta no se limita a 5 suscripciones';
  end if;

  select count(*) into v_web from rwadar_novedades.sin_cuenta_web;
  select count(*) into v_movil from rwadar_novedades.sin_cuenta_movil;
  select count(*) into v_historial from rwadar_novedades.historial_sin_cuenta;
  if v_cfg.sin_cuenta_activa and not (v_cfg.push_habilitado and v_cfg.webpush_clave_publica is not null) then
    raise warning 'RWAdar 36: sin cuenta activo, pero con el push apagado o sin clave VAPID no sale nada ni se admiten altas (activar-push y crear-vapid)';
  end if;
  raise notice 'RWAdar 36 OK: sin cuenta %, % navegador(es) y % móvil(es) sin cuenta, % fila(s) en su historial, cupos % por hora y % en total por canal, push %',
    case when v_cfg.sin_cuenta_activa then 'activo' else 'apagado' end,
    v_web, v_movil, v_historial, v_cfg.sin_cuenta_cupo_hora, v_cfg.sin_cuenta_maximo,
    case when v_cfg.push_habilitado then 'encendido' else 'apagado' end;
end
$verificador$;

rollback;
