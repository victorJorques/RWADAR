-- =====================================================================
-- RWAdar 30 · verificador de los avisos a registrados
-- Solo lee: no envía, no agenda y no devuelve secretos. Cualquier
-- desviación aborta con una excepción. Pasa con todo apagado (estado de
-- instalación) y después de cada activación.
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
begin
  if to_regnamespace('rwadar_novedades') is null
     or to_regclass('rwadar_novedades.configuracion') is null then
    raise exception '30: falta el esquema rwadar_novedades (aplicar 30_avisos_registrados.sql)';
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
  if v_cfg.version_consentimiento is distinct from 'novedades-v1-2026-11-05'
     or v_cfg.texto_consentimiento_es is distinct from
        'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.'
     or v_cfg.texto_consentimiento_en is distinct from
        'I want to receive RWAdar notices by email and, if I turn them on in my phone, as notifications: new offers on the radar and news about the website and the app. It''s optional: the Academy unlocks anyway. You can unsubscribe in every notice or in Profile. More information in Privacy.' then
    raise exception '30: la versión o los textos de la casilla no son los del contrato';
  end if;
  if (v_cfg.correo_habilitado and v_cfg.correo_activado_el is null)
     or (v_cfg.push_habilitado and v_cfg.push_activado_el is null) then
    raise exception '30: un canal encendido sin fecha de activación';
  end if;

  -- Reloj: uno solo y canónico con algo encendido; ninguno con todo apagado.
  select count(*) into v_relojes from cron.job
   where jobname = 'rwadar-novedades'
      or lower(coalesce(command, '')) like '%rwadar_novedades.%';
  if v_cfg.correo_habilitado or v_cfg.push_habilitado then
    if v_relojes <> 1 or not exists (
         select 1 from cron.job
          where jobname = 'rwadar-novedades' and schedule = '*/5 * * * *' and active
            and lower(command) like '%rwadar_novedades.procesar()%') then
      raise exception '30: con avisos encendidos debe haber un solo reloj rwadar-novedades cada 5 minutos';
    end if;
  elsif v_relojes <> 0 then
    raise exception '30: con todo apagado no puede quedar ningún reloj de rwadar_novedades';
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

  -- Tablas privadas: RLS y ningún permiso para los clientes.
  if (select count(*) from pg_class
       where relnamespace = 'rwadar_novedades'::regnamespace and relkind = 'r'
         and relname in ('configuracion', 'preferencias', 'anuncios',
                         'dispositivos', 'correos', 'pushes')) <> 6 then
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
      ('public.configurar_avisos_novedades(boolean,text,text)', false),
      ('public.registrar_aviso_push(text,text)', false),
      ('public.quitar_aviso_push(text)', false),
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

  -- Disparadores: el de Auth y el del catálogo, activos; el del catálogo
  -- antes que fijar_publicacion_v2 (los AFTER se disparan por nombre).
  if not exists (
       select 1 from pg_trigger
        where tgrelid = 'auth.users'::regclass and tgname = 'rwadar_novedades_confirmacion'
          and tgenabled <> 'D' and not tgisinternal
          and tgfoid = 'rwadar_novedades.al_confirmar_cuenta()'::regprocedure) then
    raise exception '30: falta o está desactivado el disparador de confirmación en auth.users';
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

  select count(*) into v_retenidos from rwadar_novedades.anuncios where estado = 'retenido';
  raise notice 'RWAdar 30 OK: correo %, push %, aviso automático de ofertas %, % anuncio(s) retenido(s), %',
    case when v_cfg.correo_habilitado then 'encendido' else 'apagado' end,
    case when v_cfg.push_habilitado then 'encendido' else 'apagado' end,
    case when v_cfg.ofertas_automaticas then 'encendido' else 'apagado' end,
    v_retenidos,
    case when v_relojes = 1 then 'reloj rwadar-novedades cada 5 minutos' else 'sin reloj' end;
end
$verificador$;

rollback;
