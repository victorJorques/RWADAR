-- =====================================================================
-- RWAdar 32 · verificador de las notificaciones (Expo con prioridad alta y
-- notificaciones web)
-- Solo lee: no envía, no agenda y no devuelve secretos. Cualquier
-- desviación aborta con una excepción. Pasa con todo apagado y con el push
-- encendido. Va junto a los verificadores 30 y 31 (el 30 ya exige RLS y
-- ningún permiso en todas las tablas y funciones de rwadar_novedades,
-- también las de la 32).
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_cfg record;
  v_funcion record;
  v_tabla text;
  v_rol text;
  v_firma text;
  v_dueno oid;
  v_envio text;
  v_privada text;
  v_secretos integer;
  v_suscripciones integer;
  v_cuentas integer;
begin
  if to_regclass('rwadar_novedades.suscripciones_web') is null
     or to_regclass('rwadar_novedades.envios_web') is null then
    raise exception '32: faltan las tablas de las notificaciones web (aplicar 32_notificaciones.sql)';
  end if;
  if (select count(*) from pg_attribute
       where not attisdropped and attnum > 0
         and ((attrelid = 'rwadar_novedades.suscripciones_web'::regclass
               and attname in ('id', 'usuario_id', 'endpoint', 'p256dh', 'auth', 'creado_el', 'actualizado_el'))
              or (attrelid = 'rwadar_novedades.envios_web'::regclass
                  and attname in ('id', 'anuncio_id', 'suscripcion_id', 'estado', 'codigo', 'intentos',
                                  'creado_el', 'actualizado_el', 'enviado_el'))
              or (attrelid = 'rwadar_novedades.configuracion'::regclass
                  and attname = 'webpush_clave_publica'))) <> 17 then
    raise exception '32: faltan columnas de las notificaciones web (reaplicar 32_notificaciones.sql)';
  end if;

  -- Push de Expo con prioridad alta: reaplicar la 30 la devuelve a 'default'.
  v_envio := pg_get_functiondef('rwadar_novedades.enviar_push(integer)'::regprocedure);
  if position('''priority'', ''high''' in v_envio) = 0
     or position('''priority'', ''default''' in v_envio) > 0 then
    raise exception '32: enviar_push no manda los push con prioridad alta (¿se reaplicó la 30? reaplicar 32_notificaciones.sql)';
  end if;

  -- Reglas de las tablas: servicios de push conocidos, claves con su forma,
  -- endpoint único, un envío por par y la clave pública con su forma.
  if not exists (select 1 from pg_constraint
                  where conrelid = 'rwadar_novedades.suscripciones_web'::regclass
                    and conname = 'suscripcion_web_endpoint_valido' and contype = 'c' and convalidated
                    and pg_get_constraintdef(oid) like '%^https://(fcm\\.googleapis\\.com|updates\\.push\\.services\\.mozilla\\.com|web\\.push\\.apple\\.com|%\\.notify\\.windows\\.com)/%')
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.suscripciones_web'::regclass
                       and conname = 'suscripcion_web_endpoint_unico' and contype = 'u')
     or (select count(*) from pg_constraint
          where conrelid = 'rwadar_novedades.suscripciones_web'::regclass and contype = 'c' and convalidated
            and conname in ('suscripcion_web_p256dh_valida', 'suscripcion_web_auth_valida')) <> 2
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.envios_web'::regclass
                       and conname = 'envio_web_uno_por_par' and contype = 'u')
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.configuracion'::regclass
                       and conname = 'webpush_clave_publica_valida' and contype = 'c' and convalidated) then
    raise exception '32: faltan o están cambiadas las reglas de las notificaciones web (reaplicar 32_notificaciones.sql)';
  end if;
  -- Se borran con la cuenta, con la suscripción y con el anuncio.
  if (select count(*) from pg_constraint
       where contype = 'f' and confdeltype = 'c'
         and ((conrelid = 'rwadar_novedades.suscripciones_web'::regclass and confrelid = 'auth.users'::regclass)
              or (conrelid = 'rwadar_novedades.envios_web'::regclass
                  and confrelid in ('rwadar_novedades.anuncios'::regclass,
                                    'rwadar_novedades.suscripciones_web'::regclass)))) <> 3 then
    raise exception '32: las notificaciones web no se borran en cascada con la cuenta, la suscripción o el anuncio';
  end if;

  -- Tablas privadas: RLS y ningún permiso, tampoco para service_role.
  foreach v_tabla in array array['rwadar_novedades.suscripciones_web', 'rwadar_novedades.envios_web'] loop
    if not (select c.relrowsecurity from pg_class c where c.oid = v_tabla::regclass) then
      raise exception '32: la tabla % no tiene RLS', v_tabla;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_table_privilege(v_rol, v_tabla, 'SELECT') or has_table_privilege(v_rol, v_tabla, 'INSERT')
         or has_table_privilege(v_rol, v_tabla, 'UPDATE') or has_table_privilege(v_rol, v_tabla, 'DELETE')
         or has_table_privilege(v_rol, v_tabla, 'TRUNCATE') or has_table_privilege(v_rol, v_tabla, 'REFERENCES')
         or has_table_privilege(v_rol, v_tabla, 'TRIGGER') then
        raise exception '32: % tiene permisos sobre %', v_rol, v_tabla;
      end if;
    end loop;
  end loop;

  -- Funciones internas: existen, solo el propietario (el mismo dueño que
  -- procesar()), security definer y search_path vacío.
  select p.proowner into v_dueno from pg_proc p where p.oid = 'rwadar_novedades.procesar()'::regprocedure;
  foreach v_firma in array array[
    'rwadar_novedades.enviar_push(integer)',
    'rwadar_novedades.webpush_carga(text,text,text,text)',
    'rwadar_novedades.webpush_pendientes(integer)',
    'rwadar_novedades.webpush_resultado(jsonb)',
    'rwadar_novedades.webpush_prueba()',
    'rwadar_novedades.webpush_limpiar()'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '32: falta la función %', v_firma;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, v_firma, 'EXECUTE') then
        raise exception '32: % es ejecutable por %', v_firma, v_rol;
      end if;
    end loop;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                            and p.proowner = v_dueno
                       from pg_proc p where p.oid = to_regprocedure(v_firma)), false) then
      raise exception '32: % no es security definer con search_path vacío y el dueño de procesar()', v_firma;
    end if;
  end loop;
  -- La prueba solo va a las cuentas de administración.
  if position('es_admin' in pg_get_functiondef('rwadar_novedades.webpush_prueba()'::regprocedure)) = 0 then
    raise exception '32: webpush_prueba no se limita a las cuentas de administración';
  end if;
  -- Lo pendiente exige el push encendido y el permiso vigente.
  if position('push_habilitado' in pg_get_functiondef('rwadar_novedades.webpush_pendientes(integer)'::regprocedure)) = 0
     or position('version_consentimiento' in pg_get_functiondef('rwadar_novedades.webpush_pendientes(integer)'::regprocedure)) = 0 then
    raise exception '32: webpush_pendientes no comprueba el interruptor del push o el permiso vigente';
  end if;

  -- API para la web: solo authenticated, definer, search_path vacío y sesión
  -- confirmada.
  foreach v_firma in array array[
    'public.registrar_aviso_webpush(text,text,text)',
    'public.quitar_aviso_webpush(text)',
    'public.mi_aviso_webpush_registrado(text)',
    'public.clave_publica_webpush()'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '32: falta la función %', v_firma;
    end if;
    if has_function_privilege('public', v_firma, 'EXECUTE')
       or has_function_privilege('anon', v_firma, 'EXECUTE')
       or has_function_privilege('service_role', v_firma, 'EXECUTE')
       or not has_function_privilege('authenticated', v_firma, 'EXECUTE') then
      raise exception '32: permisos incorrectos en %', v_firma;
    end if;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                       from pg_proc p where p.oid = to_regprocedure(v_firma)), false) then
      raise exception '32: % no es security definer con search_path vacío', v_firma;
    end if;
    if position('rwadar_cuentas_privadas.sesion_confirmada()' in pg_get_functiondef(to_regprocedure(v_firma))) = 0 then
      raise exception '32: % no exige sesión confirmada', v_firma;
    end if;
  end loop;

  -- Clave VAPID: o ninguna, o las dos (pública en la configuración y privada
  -- en Vault, una sola y con forma). Solo se mira la forma, nunca el valor.
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  select count(*), max(s.decrypted_secret) into v_secretos, v_privada
    from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if v_cfg.webpush_clave_publica is null and v_secretos > 0 then
    raise exception '32: hay RWADAR_VAPID_PRIVADA en Vault sin clave pública (repetir crear-vapid)';
  end if;
  if v_cfg.webpush_clave_publica is not null
     and (v_secretos <> 1 or coalesce(btrim(v_privada), '') !~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$') then
    raise exception '32: clave pública sin una RWADAR_VAPID_PRIVADA válida en Vault (repetir crear-vapid)';
  end if;

  -- Nunca más de 5 navegadores por cuenta.
  if exists (select 1 from rwadar_novedades.suscripciones_web s
              group by s.usuario_id having count(*) > 5) then
    raise exception '32: hay cuentas con más de 5 suscripciones web';
  end if;

  select count(*), count(distinct s.usuario_id) into v_suscripciones, v_cuentas
    from rwadar_novedades.suscripciones_web s;
  raise notice 'RWAdar 32 OK: push de Expo con prioridad alta; notificaciones web: % suscripción(es) en % cuenta(s), clave VAPID %, push % (el mismo interruptor para Expo y la web)',
    v_suscripciones, v_cuentas,
    case when v_cfg.webpush_clave_publica is null then 'sin crear' else 'creada' end,
    case when v_cfg.push_habilitado then 'encendido' else 'apagado' end;
end
$verificador$;

rollback;
