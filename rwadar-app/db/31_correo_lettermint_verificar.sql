-- =====================================================================
-- RWAdar 31 · verificador del correo con Lettermint
-- Solo lee: no envía, no agenda y no devuelve secretos (de Vault solo mira
-- la forma, con el correo encendido). Cualquier desviación aborta con una
-- excepción. Va junto al verificador 30, que sigue valiendo: pasan los dos
-- con todo apagado y con el correo encendido.
--
-- Comprueba que las tres funciones del correo que sustituye la 31 apuntan a
-- api.lettermint.co, sin rastro de Brevo; que piden no seguir aperturas ni
-- clics; que la clave idempotente de la fila va en la cabecera HTTP de
-- net.http_post (no en las del correo) y no se cambia al reintentar; que cada correo
-- lleva la dirección postal en el pie (con o sin el nombre del titular: desde
-- la 34 no lo lleva, y lo comprueba su verificador); y que conservan lo de la 30: security
-- definer, search_path vacío, el mismo dueño que el resto del esquema y
-- ningún permiso de ejecución para los clientes.
-- =====================================================================
begin transaction read only;

do $verificador_31$
declare
  v_firma text;
  v_funcion record;
  v_rol text;
  v_dueno oid;
  v_enviar text;
  v_leer text;
  v_mensaje text;
  v_cfg record;
  v_token text;
  v_remitente text;
  v_correo jsonb;
begin
  if to_regprocedure('rwadar_novedades.procesar()') is null then
    raise exception '31: falta la 30 (aplicar 30_avisos_registrados.sql y después 31_correo_lettermint.sql)';
  end if;
  select p.proowner into v_dueno from pg_proc p
   where p.oid = 'rwadar_novedades.procesar()'::regprocedure;

  -- Las tres funciones: misma firma, mismo tipo de resultado, plpgsql,
  -- security definer, search_path vacío, volatilidad de la 30 y mismo dueño.
  for v_funcion in
    select * from (values
      ('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)', 'jsonb', 's'),
      ('rwadar_novedades.leer_correos()', 'integer', 'v'),
      ('rwadar_novedades.enviar_correos(integer)', 'integer', 'v')
    ) as esperado(firma, resultado, volatilidad)
  loop
    if to_regprocedure(v_funcion.firma) is null then
      raise exception '31: falta la función % (aplicar 31_correo_lettermint.sql)', v_funcion.firma;
    end if;
    if not exists (
         select 1 from pg_proc p join pg_language l on l.oid = p.prolang
          where p.oid = to_regprocedure(v_funcion.firma)
            and p.prosecdef and p.proconfig && array['search_path=""', 'search_path=']
            and l.lanname = 'plpgsql'
            and p.prorettype = v_funcion.resultado::regtype
            and p.provolatile = v_funcion.volatilidad) then
      raise exception '31: % ya no es plpgsql security definer con search_path vacío, el mismo resultado y la misma volatilidad que en la 30',
        v_funcion.firma;
    end if;
    if (select p.proowner from pg_proc p where p.oid = to_regprocedure(v_funcion.firma)) <> v_dueno then
      raise exception '31: % no tiene el mismo dueño que rwadar_novedades.procesar()', v_funcion.firma;
    end if;
    foreach v_rol in array array['public', 'anon', 'authenticated', 'service_role'] loop
      if has_function_privilege(v_rol, v_funcion.firma, 'EXECUTE') then
        raise exception '31: % es ejecutable por % (en la 30 solo la ejecuta el propietario)', v_funcion.firma, v_rol;
      end if;
    end loop;
  end loop;

  -- Ninguna función del esquema habla ya con Brevo.
  for v_funcion in
    select p.oid::regprocedure::text as firma from pg_proc p
     where p.pronamespace = 'rwadar_novedades'::regnamespace and p.prokind = 'f'
       and lower(pg_get_functiondef(p.oid)) like '%api.brevo.com%'
  loop
    raise exception '31: % sigue llamando a api.brevo.com (¿se reaplicó la 30 después? Vuelve a aplicar 31_correo_lettermint.sql)',
      v_funcion.firma;
  end loop;

  v_enviar := pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure);
  v_leer := pg_get_functiondef('rwadar_novedades.leer_correos()'::regprocedure);
  v_mensaje := pg_get_functiondef('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)'::regprocedure);
  if lower(v_enviar || v_leer || v_mensaje) like '%brevo%' then
    raise exception '31: las funciones del correo aún mencionan Brevo (aplicar 31_correo_lettermint.sql)';
  end if;

  -- Envío: Lettermint, token de Vault en su cabecera, clave idempotente en la
  -- cabecera HTTP, sin seguimiento y cada tipo por su ruta.
  if position('url := ''https://api.lettermint.co/v1/send''' in v_enviar) = 0
     or (length(v_enviar) - length(replace(v_enviar, 'net.http_post(', ''))) / length('net.http_post(') <> 1 then
    raise exception '31: enviar_correos no envía con una sola llamada a https://api.lettermint.co/v1/send';
  end if;
  if position('''x-lettermint-token'', v_token' in v_enviar) = 0
     or position('''LETTERMINT_API_TOKEN''' in v_enviar) = 0
     or position('''RWADAR_REMITENTE''' in v_enviar) = 0
     or position('correo bloqueado: credenciales de Lettermint ausentes o no válidas en Vault' in v_enviar) = 0 then
    raise exception '31: enviar_correos no lee LETTERMINT_API_TOKEN y RWADAR_REMITENTE de Vault o no los manda en x-lettermint-token';
  end if;
  -- La forma entera de la llamada: la clave va en las cabeceras HTTP de
  -- net.http_post (no en las del correo, dentro del cuerpo) y el cuerpo es
  -- v_cuerpo, el que lleva `settings`. Y la clave es la de la fila: nunca se
  -- borra para que un reintento saque otra (Lettermint no lo deduplicaría).
  if v_enviar !~ ('net\.http_post\(\s*url := ''https://api\.lettermint\.co/v1/send'',\s*'
                  || 'headers := jsonb_build_object\(''x-lettermint-token'', v_token,\s*'
                  || '''Idempotency-Key'', v_idempotencia::text,\s*'
                  || '''content-type'', ''application/json'',\s*''accept'', ''application/json''\),\s*'
                  || 'body := v_cuerpo,\s*timeout_milliseconds := 10000\s*\)')
     or (length(v_enviar) - length(replace(v_enviar, 'Idempotency-Key', ''))) / length('Idempotency-Key') <> 1
     or position('v_idempotencia := coalesce(r.idempotencia, gen_random_uuid());' in v_enviar) = 0
     or (v_enviar || v_leer) ~* '\midempotencia\s*=\s*(null|gen_random_uuid)' then
    raise exception '31: enviar_correos no manda la clave idempotente de la fila (la misma en cada reintento) solo en la cabecera HTTP Idempotency-Key de net.http_post, con body := v_cuerpo';
  end if;
  if v_enviar !~ '''settings'',\s*jsonb_build_object\(''track_opens'',\s*false,\s*''track_clicks'',\s*false\)'
     or v_enviar ~* 'track_(opens|clicks)''\s*,\s*true' then
    raise exception '31: enviar_correos no pide track_opens false y track_clicks false (seguimiento de aperturas y clics)';
  end if;
  if v_enviar !~ 'if r\.tipo = ''anuncio'' then\s+v_cuerpo := v_cuerpo \|\| jsonb_build_object\(''route'', ''broadcast''\);'
     or (length(v_enviar) - length(replace(v_enviar, '''route''', ''))) / length('''route''') <> 1 then
    raise exception '31: solo los anuncios deben ir por la ruta broadcast; la bienvenida, por la de por defecto';
  end if;
  if position('''List-Unsubscribe-Post''' in v_enviar) > 0
     or v_enviar !~ 'if v_suscrito then\s+v_cuerpo := v_cuerpo \|\| jsonb_build_object\(''headers'', jsonb_build_object\(''List-Unsubscribe'',' then
    raise exception '31: List-Unsubscribe solo para quien está apuntado y sin List-Unsubscribe-Post';
  end if;
  if v_enviar ~* '''(tag|metadata)''' then
    raise exception '31: enviar_correos no debe mandar tag ni metadata (minimización)';
  end if;

  -- Lectura: 202 con message_id = aceptado; 409 = incierto; resto de 4xx
  -- (salvo 408 y 429) = fallido; lo demás, reintento.
  if position('r.status_code = 202 and v_mensaje_id is not null' in v_leer) = 0
     or position('->> ''message_id''' in v_leer) = 0
     or v_leer !~ 'elsif r\.status_code = 409 then\s+update rwadar_novedades\.correos\s+set estado = ''incierto'''
     or position('r.status_code between 400 and 499 and r.status_code not in (408, 429)' in v_leer) = 0 then
    raise exception '31: leer_correos no sigue las reglas de Lettermint (202 aceptado, 409 incierto, 4xx fallido salvo 408 y 429)';
  end if;

  -- Pie con la dirección postal (política de uso de Lettermint), comprobado
  -- con un correo de cada tipo construido de verdad (la función solo lee).
  -- Quién es el responsable no se mira aquí: la 31 lo nombra y la 34 dice
  -- «el titular de RWAdar» (sin su nombre); eso lo comprueba el verificador 34.
  v_correo := rwadar_novedades.correo_mensaje('bienvenida', null, null, null, false, null);
  if (v_correo ->> 'html') !~ 'Responsable: [^<]+, Plaza Generalitat, s/n, 46600 Alzira \(Valencia\), España \('
     or (v_correo ->> 'texto') !~ 'Responsable: [^\n]+, Plaza Generalitat, s/n, 46600 Alzira \(Valencia\), España\.'
     or position('baja?t=' in (v_correo ->> 'html') || (v_correo ->> 'texto')) > 0 then
    raise exception '31: la bienvenida no lleva la dirección postal en el pie o lleva baja sin estar apuntada';
  end if;
  v_correo := rwadar_novedades.correo_mensaje('anuncio', 'Prueba del verificador', 'Texto de prueba.',
                                              'https://rwadar.pages.dev/', true, gen_random_uuid());
  if position('46600 Alzira (Valencia), España' in v_correo ->> 'html') = 0
     or position('46600 Alzira (Valencia), España' in v_correo ->> 'texto') = 0
     or position('https://rwadar.pages.dev/baja?t=' in v_correo ->> 'html') = 0 then
    raise exception '31: un anuncio no lleva la dirección postal o la baja en el pie';
  end if;

  -- Con el correo encendido, las credenciales tienen que estar (solo forma).
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if found and v_cfg.correo_habilitado then
    select btrim(max(decrypted_secret) filter (where name = 'LETTERMINT_API_TOKEN')),
           btrim(max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE'))
      into v_token, v_remitente
      from vault.decrypted_secrets
     where name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE');
    if coalesce(v_token, '') !~ '^[!-~]+$' or length(v_token) not between 20 and 1024 then
      raise exception '31: correo encendido sin LETTERMINT_API_TOKEN válido en Vault';
    end if;
    if coalesce(v_remitente, '') !~*
       '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
      raise exception '31: correo encendido sin RWADAR_REMITENTE válido en Vault';
    end if;
  end if;

  raise notice 'RWAdar 31 OK: correo con Lettermint (api.lettermint.co), sin seguimiento de aperturas ni clics, bienvenida por la ruta transaccional, anuncios por «broadcast», dirección postal en el pie; correo %',
    case when coalesce(v_cfg.correo_habilitado, false) then 'encendido' else 'apagado' end;
end
$verificador_31$;

rollback;
