-- =====================================================================
-- RWAdar 30 · verificador de los avisos a registrados
-- Solo lee: no envía, no agenda y no devuelve secretos. Cualquier
-- desviación aborta con una excepción. Pasa con todo apagado (estado de
-- instalación) y después de cada activación. Con la casilla del alta
-- inactiva avisa (WARNING) de que, si la web o la app la enseñan, hay que
-- ejecutar 30_avisos_registrados_activar_casilla.sql.
-- =====================================================================
begin transaction read only;

do $verificador$
declare
  v_cfg record;
  v_funcion record;
  v_tabla record;
  v_rol text;
  v_firma text;
  v_relojes integer;
  v_clave text;
  v_remitente text;
  v_expo text;
  v_retenidos integer;
  v_limpiar text;
  v_palabras text;
begin
  if to_regnamespace('rwadar_novedades') is null
     or to_regclass('rwadar_novedades.configuracion') is null then
    raise exception '30: falta el esquema rwadar_novedades (aplicar 30_avisos_registrados.sql)';
  end if;
  -- Columnas de la versión actual: casilla del alta con su fecha y marcas
  -- de bienvenida.
  if (select count(*) from pg_attribute
       where not attisdropped and attnum > 0
         and ((attrelid = to_regclass('rwadar_novedades.configuracion')
               and attname in ('casilla_activa', 'casilla_activada_el'))
              or (attrelid = to_regclass('rwadar_novedades.preferencias')
                  and attname in ('bienvenida_correo_el', 'bienvenida_push_el')))) <> 4 then
    raise exception '30: faltan casilla_activa, casilla_activada_el o las marcas de bienvenida (reaplicar 30_avisos_registrados.sql)';
  end if;
  -- Historial del permiso (revisión legal del 06/11/2026): existe, sin clave
  -- ajena a auth.users (sobrevive bloqueado al borrado de la cuenta), con la
  -- regla de la versión en las altas y solo de añadir.
  if to_regclass('rwadar_novedades.historial_permiso') is null
     or (select count(*) from pg_attribute
          where attrelid = to_regclass('rwadar_novedades.historial_permiso')
            and not attisdropped and attnum > 0
            and attname in ('usuario_id', 'correo', 'accion', 'version', 'idioma', 'origen',
                            'canal', 'creado_el', 'cuenta_borrada_el')) <> 9 then
    raise exception '30: falta rwadar_novedades.historial_permiso o alguna de sus columnas (reaplicar 30_avisos_registrados.sql)';
  end if;
  if exists (select 1 from pg_constraint
              where conrelid = 'rwadar_novedades.historial_permiso'::regclass and contype = 'f')
     or not exists (select 1 from pg_constraint
                     where conrelid = 'rwadar_novedades.historial_permiso'::regclass
                       and conname = 'historial_alta_con_version' and contype = 'c') then
    raise exception '30: el historial del permiso no debe tener clave ajena y sus altas exigen versión';
  end if;
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'rwadar_novedades.historial_permiso'::regclass and tgname = 'historial_solo_anadir'
          and tgenabled <> 'D' and not tgisinternal
          and tgfoid = 'rwadar_novedades.historial_solo_anadir()'::regprocedure) then
    raise exception '30: falta o está desactivado el disparador historial_solo_anadir';
  end if;
  foreach v_rol in array array['public', 'anon', 'authenticated'] loop
    if has_schema_privilege(v_rol, 'rwadar_novedades', 'USAGE')
       or has_schema_privilege(v_rol, 'rwadar_novedades', 'CREATE') then
      raise exception '30: % tiene acceso al esquema privado', v_rol;
    end if;
  end loop;

  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if not found then
    raise exception '30: falta la fila de configuración';
  end if;
  if v_cfg.version_consentimiento is distinct from 'novedades-v2-2026-11-06'
     or v_cfg.texto_consentimiento_es is distinct from
        'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: fichas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en Perfil o con el enlace de cada correo; las notificaciones también se quitan en los ajustes del móvil. Más información en Privacidad.'
     or v_cfg.texto_consentimiento_en is distinct from
        'I want to receive RWAdar notices by email and, if I enable them on my phone, as notifications: new listings on the radar and news about the website and the app. It''s optional: the Academy unlocks anyway. You can unsubscribe in Profile or with the link in every email; notifications can also be turned off in your phone settings. More information in Privacy.' then
    raise exception '30: la versión o los textos de la casilla no son los del contrato';
  end if;
  if (v_cfg.correo_habilitado and v_cfg.correo_activado_el is null)
     or (v_cfg.push_habilitado and v_cfg.push_activado_el is null) then
    raise exception '30: un canal encendido sin fecha de activación';
  end if;
  if v_cfg.casilla_activa and v_cfg.casilla_activada_el is null then
    raise exception '30: casilla del alta activa sin fecha (ejecutar 30_avisos_registrados_activar_casilla.sql)';
  end if;

  -- Reloj diario de limpieza: siempre, uno y tal como lo crea la 30 (la
  -- retención no depende de que haya algo encendido).
  if (select count(*) from cron.job where jobname = 'rwadar-novedades-limpieza') <> 1
     or not exists (
       select 1 from cron.job
        where jobname = 'rwadar-novedades-limpieza' and schedule = '41 4 * * *' and active
          and lower(btrim(command)) = 'select rwadar_novedades.limpiar()') then
    raise exception '30: falta, está duplicado o alterado el reloj diario de limpieza rwadar-novedades-limpieza (reaplicar 30_avisos_registrados.sql)';
  end if;
  v_limpiar := lower(pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure));
  if position('net.' in v_limpiar) > 0 or position('vault.' in v_limpiar) > 0 then
    raise exception '30: rwadar_novedades.limpiar() no debe hacer red ni leer Vault';
  end if;
  -- Limpia el historial de cuentas borradas a los 3 años y NUNCA los anuncios
  -- (copia de lo enviado, para posibles requerimientos).
  if position('rwadar_novedades.historial_permiso' in v_limpiar) = 0
     or position('interval ''3 years''' in v_limpiar) = 0
     or v_limpiar ~ 'delete\s+from\s+rwadar_novedades\.anuncios' then
    raise exception '30: limpiar() debe borrar el historial de cuentas borradas a los 3 años y nunca los anuncios (reaplicar 30_avisos_registrados.sql)';
  end if;
  -- Filtro de palabras de los anuncios, el ampliado tras la revisión legal.
  select pg_get_constraintdef(c.oid) into v_palabras from pg_constraint c
   where c.conrelid = 'rwadar_novedades.anuncios'::regclass and c.conname = 'anuncio_sin_palabras_vetadas';
  if v_palabras is null or v_palabras !~ 'rendimiento' or v_palabras !~ 'autorizad'
     or v_palabras !~ 'pierdas' or v_palabras !~ 'mgana' or v_palabras !~ 'mbono' then
    raise exception '30: falta el filtro de palabras ampliado de los anuncios (reaplicar 30_avisos_registrados.sql)';
  end if;

  -- Reloj de envío: uno solo y canónico con algo encendido; ninguno con todo
  -- apagado. Cuenta cualquier reloj que llame a rwadar_novedades salvo el de
  -- limpieza canónico.
  select count(*) into v_relojes from cron.job
   where (jobname = 'rwadar-novedades'
          or lower(coalesce(command, '')) like '%rwadar_novedades.%')
     and not (jobname = 'rwadar-novedades-limpieza'
              and lower(btrim(coalesce(command, ''))) = 'select rwadar_novedades.limpiar()');
  if v_cfg.correo_habilitado or v_cfg.push_habilitado then
    if v_relojes <> 1 or not exists (
         select 1 from cron.job
          where jobname = 'rwadar-novedades' and schedule = '*/5 * * * *' and active
            and lower(command) like '%rwadar_novedades.procesar()%') then
      raise exception '30: con avisos encendidos debe haber un solo reloj rwadar-novedades cada 5 minutos';
    end if;
  elsif v_relojes <> 0 then
    raise exception '30: con todo apagado no puede quedar ningún reloj de envío de rwadar_novedades';
  end if;
  if (select count(*) from cron.job where jobname = 'rwadar-retencion-dispositivos') <> 1 then
    raise exception '30: falta el reloj independiente de retención de la 22';
  end if;

  if v_cfg.correo_habilitado then
    select max(decrypted_secret) filter (where name = 'BREVO_API_KEY'),
           max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE')
      into v_clave, v_remitente
      from vault.decrypted_secrets
     where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
    if length(btrim(coalesce(v_clave, ''))) < 20
       or btrim(coalesce(v_remitente, '')) !~*
          '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
      raise exception '30: correo encendido sin BREVO_API_KEY y RWADAR_REMITENTE válidos en Vault';
    end if;
  end if;
  if v_cfg.push_habilitado then
    select nullif(btrim(max(decrypted_secret)), '') into v_expo
      from vault.decrypted_secrets where name = 'EXPO_ACCESS_TOKEN';
    if v_expo is not null and v_expo !~ '^[A-Za-z0-9._-]{20,255}$' then
      raise exception '30: EXPO_ACCESS_TOKEN tiene un formato no válido';
    end if;
  end if;

  -- Funciones internas: ninguna ejecutable por clientes; todas definer y
  -- con search_path vacío.
  foreach v_firma in array array[
    'rwadar_novedades.procesar()',
    'rwadar_novedades.repartir()',
    'rwadar_novedades.leer_correos()',
    'rwadar_novedades.enviar_correos(integer)',
    'rwadar_novedades.leer_push()',
    'rwadar_novedades.enviar_push(integer)',
    'rwadar_novedades.limpiar()',
    'rwadar_novedades.rellenar()',
    'rwadar_novedades.anunciar(text,text,text,text,text)',
    'rwadar_novedades.publicar_anuncio(bigint)',
    'rwadar_novedades.al_confirmar_cuenta()',
    'rwadar_novedades.al_borrar_cuenta()',
    'rwadar_novedades.historial_solo_anadir()',
    'rwadar_novedades.baja_por_correo(text)',
    'rwadar_novedades.avisar_ofertas_nuevas()',
    'rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)'
  ] loop
    if to_regprocedure(v_firma) is null then
      raise exception '30: falta la función %', v_firma;
    end if;
  end loop;
  for v_funcion in
    select p.oid::regprocedure::text as firma, p.prosecdef, p.proconfig
      from pg_proc p where p.pronamespace = 'rwadar_novedades'::regnamespace
  loop
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, v_funcion.firma, 'EXECUTE') then
        raise exception '30: % es ejecutable por %', v_funcion.firma, v_rol;
      end if;
    end loop;
    if not v_funcion.prosecdef
       or not coalesce(v_funcion.proconfig && array['search_path=""', 'search_path='], false) then
      raise exception '30: % no es security definer con search_path vacío', v_funcion.firma;
    end if;
  end loop;

  -- La baja por correo es solo del propietario (también se comprueba en el
  -- bucle anterior; aquí, con su nombre).
  foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
    if has_function_privilege(v_rol, 'rwadar_novedades.baja_por_correo(text)', 'EXECUTE') then
      raise exception '30: rwadar_novedades.baja_por_correo(text) es ejecutable por %', v_rol;
    end if;
  end loop;

  -- Tablas privadas: RLS y ningún permiso para los clientes.
  if (select count(*) from pg_class
       where relnamespace = 'rwadar_novedades'::regnamespace and relkind = 'r'
         and relname in ('configuracion', 'preferencias', 'anuncios',
                         'dispositivos', 'correos', 'pushes', 'historial_permiso')) <> 7 then
    raise exception '30: faltan tablas de rwadar_novedades';
  end if;
  for v_tabla in
    select c.oid, c.relname, c.relrowsecurity from pg_class c
     where c.relnamespace = 'rwadar_novedades'::regnamespace and c.relkind = 'r'
  loop
    if not v_tabla.relrowsecurity then
      raise exception '30: la tabla % no tiene RLS', v_tabla.relname;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated'] loop
      if has_table_privilege(v_rol, v_tabla.oid, 'SELECT')
         or has_table_privilege(v_rol, v_tabla.oid, 'INSERT')
         or has_table_privilege(v_rol, v_tabla.oid, 'UPDATE')
         or has_table_privilege(v_rol, v_tabla.oid, 'DELETE') then
        raise exception '30: % tiene permisos sobre %', v_rol, v_tabla.relname;
      end if;
    end loop;
  end loop;

  -- API pública: solo lo justo. anon, únicamente la baja.
  for v_funcion in
    select * from (values
      ('public.estado_mis_avisos()', false),
      ('public.configurar_avisos_novedades(boolean,text,text,text)', false),
      ('public.registrar_aviso_push(text,text)', false),
      ('public.quitar_aviso_push(text)', false),
      ('public.mi_aviso_push_registrado(text)', false),
      ('public.mis_avisos_recientes(integer)', false),
      ('public.baja_avisos(uuid)', true)
    ) as esperado(firma, para_anon)
  loop
    if to_regprocedure(v_funcion.firma) is null then
      raise exception '30: falta la función %', v_funcion.firma;
    end if;
    if has_function_privilege('public', v_funcion.firma, 'EXECUTE')
       or has_function_privilege('service_role', v_funcion.firma, 'EXECUTE')
       or has_function_privilege('anon', v_funcion.firma, 'EXECUTE') is distinct from v_funcion.para_anon
       or not has_function_privilege('authenticated', v_funcion.firma, 'EXECUTE') then
      raise exception '30: permisos incorrectos en %', v_funcion.firma;
    end if;
    if not coalesce((select p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
                       from pg_proc p where p.oid = to_regprocedure(v_funcion.firma)), false) then
      raise exception '30: % no es security definer con search_path vacío', v_funcion.firma;
    end if;
    if not v_funcion.para_anon
       and position('rwadar_cuentas_privadas.sesion_confirmada()' in
                    pg_get_functiondef(to_regprocedure(v_funcion.firma))) = 0 then
      raise exception '30: % no exige sesión confirmada', v_funcion.firma;
    end if;
  end loop;

  -- La firma antigua de tres argumentos no puede seguir: haría ambigua cada
  -- llamada de la web y la app.
  if to_regprocedure('public.configurar_avisos_novedades(boolean,text,text)') is not null then
    raise exception '30: sigue la firma antigua configurar_avisos_novedades(boolean,text,text) (reaplicar 30_avisos_registrados.sql)';
  end if;

  -- Disparadores: los dos de Auth y el del catálogo, activos; el del catálogo
  -- antes que fijar_publicacion_v2 (los AFTER se disparan por nombre).
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'auth.users'::regclass and tgname = 'rwadar_novedades_confirmacion'
          and tgenabled <> 'D' and not tgisinternal
          and tgfoid = 'rwadar_novedades.al_confirmar_cuenta()'::regprocedure) then
    raise exception '30: falta o está desactivado el disparador de confirmación en auth.users';
  end if;
  -- Antes de borrar una cuenta, su historial del permiso queda marcado
  -- (bloqueado, LOPDGDD art. 32).
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'auth.users'::regclass and tgname = 'rwadar_novedades_borrado'
          and tgenabled <> 'D' and not tgisinternal
          and (tgtype & 2) = 2 and (tgtype & 8) = 8
          and tgfoid = 'rwadar_novedades.al_borrar_cuenta()'::regprocedure) then
    raise exception '30: falta o está desactivado el disparador BEFORE DELETE rwadar_novedades_borrado en auth.users';
  end if;
  -- El permiso del alta solo se lee con la casilla activa y un correo de
  -- confirmación enviado después de activarla (versión actual).
  if position('casilla_activa' in pg_get_functiondef('rwadar_novedades.al_confirmar_cuenta()'::regprocedure)) = 0
     or position('casilla_activada_el' in pg_get_functiondef('rwadar_novedades.al_confirmar_cuenta()'::regprocedure)) = 0
     or position('confirmation_sent_at' in pg_get_functiondef('rwadar_novedades.al_confirmar_cuenta()'::regprocedure)) = 0 then
    raise exception '30: el disparador de confirmación no comprueba casilla_activa y confirmation_sent_at (reaplicar 30_avisos_registrados.sql)';
  end if;
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'rwadar_catalogo.revisiones'::regclass and tgname = 'avisar_ofertas_nuevas'
          and tgenabled <> 'D' and not tgisinternal
          and tgfoid = 'rwadar_novedades.avisar_ofertas_nuevas()'::regprocedure)
     or not exists (
       select 1 from pg_trigger
        where tgrelid = 'rwadar_catalogo.revisiones'::regclass and tgname = 'fijar_publicacion_v2'
          and ('avisar_ofertas_nuevas' collate "C") < (tgname::text collate "C")) then
    raise exception '30: el disparador avisar_ofertas_nuevas falta o no va antes que fijar_publicacion_v2';
  end if;

  if exists (
       select 1 from auth.users u
        where u.email_confirmed_at is not null and u.is_anonymous is not true
          and not exists (select 1 from rwadar_novedades.preferencias p where p.usuario_id = u.id)) then
    raise exception '30: hay cuentas confirmadas sin preferencias';
  end if;
  if exists (select 1 from rwadar_novedades.pushes
              where token is not null and estado in ('aceptado', 'descartado', 'fallido')) then
    raise exception '30: quedan tokens en avisos push terminados';
  end if;

  if has_table_privilege('anon', 'vault.decrypted_secrets', 'SELECT')
     or has_table_privilege('authenticated', 'vault.decrypted_secrets', 'SELECT')
     or (to_regclass('net._http_response') is not null
         and (has_table_privilege('anon', 'net._http_response', 'SELECT')
              or has_table_privilege('authenticated', 'net._http_response', 'SELECT')))
     or (to_regclass('net.http_request_queue') is not null
         and (has_table_privilege('anon', 'net.http_request_queue', 'SELECT')
              or has_table_privilege('authenticated', 'net.http_request_queue', 'SELECT'))) then
    raise exception '30: Vault o las colas de pg_net están expuestos a clientes';
  end if;

  -- fallo_cerrado.sql y reaplicar la 30 apagan la casilla: si la web o la
  -- app la siguen enseñando, marcarla no guardaría el permiso.
  if not v_cfg.casilla_activa then
    raise warning 'RWAdar 30: casilla del alta inactiva: si la web o la app enseñan la casilla, ejecuta 30_avisos_registrados_activar_casilla.sql (hasta entonces, marcarla no guarda el permiso)';
  end if;

  select count(*) into v_retenidos from rwadar_novedades.anuncios where estado = 'retenido';
  raise notice 'RWAdar 30 OK: casilla del alta %, correo %, push %, aviso automático de ofertas %, % anuncio(s) retenido(s), %, reloj diario de limpieza',
    case when v_cfg.casilla_activa then 'activa' else 'inactiva' end,
    case when v_cfg.correo_habilitado then 'encendido' else 'apagado' end,
    case when v_cfg.push_habilitado then 'encendido' else 'apagado' end,
    case when v_cfg.ofertas_automaticas then 'encendido' else 'apagado' end,
    v_retenidos,
    case when v_relojes = 1 then 'reloj rwadar-novedades cada 5 minutos' else 'sin reloj de envío' end;
end
$verificador$;

rollback;
