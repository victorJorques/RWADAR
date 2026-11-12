-- =====================================================================
-- RWAdar 33 · las notificaciones web salen desde Supabase
-- ---------------------------------------------------------------------
-- Encargo de Víctor (12/11/2026): «hazlo en Supabase mientras y ya haremos
-- el cambio». Hasta ahora las enviaba GitHub Actions (flujo «Notificaciones
-- web», acción enviar, que lanzaba «Avisar novedad»). Con la cuenta
-- gratuita, GitHub no firma contrato de encargo del tratamiento y sus
-- máquinas verían las suscripciones de todos. Desde la 33 las pide Supabase
-- (encargado con contrato) con pg_net, desde el mismo reloj que el push de
-- Expo; el cifrado (RFC 8291) y la firma VAPID (RFC 8292) los hace el
-- servidor de la web en Cloudflare (también encargado con contrato, y ya
-- maneja las sesiones), porque Postgres no tiene curvas elípticas.
-- Copia idéntica: supabase/migrations/20261112170000_webpush_supabase.sql.
--
-- Va después de la 30, la 31 y la 32 (las tres aplicadas). Aplicarla es
-- tocar Supabase en línea: solo con orden expresa de Víctor, con copia antes
-- (flujo «Avisos a registrados (base)», acciones ensayo-33 y aplicar-33).
-- Nunca con `supabase db push`.
--
-- Solo añade y redefine con create or replace. No enciende nada, no toca
-- relojes ni Vault y no reinicia la configuración:
--   1 · envios_web.peticion_id y peticion_el: la petición de pg_net de cada
--       envío, para leer después su respuesta.
--   2 · webpush_codigo(estado, contenido): lee la respuesta del servidor.
--   3 · webpush_encolar(envíos): la única función que llama al servidor de
--       la web. Lee la clave privada de Vault (RWADAR_VAPID_PRIVADA) y la
--       manda solo en una cabecera, nunca en el cuerpo ni en la dirección.
--   4 · enviar_webpush(tanda) y leer_webpush(): lo que hacían el flujo y
--       enviar-webpush.mjs, con las mismas reglas, porque reutilizan
--       webpush_pendientes y webpush_resultado de la 32.
--   5 · procesar(): la de la 30 letra por letra, más leer_webpush() y
--       enviar_webpush() dentro del bloque del push, después de Expo. El
--       reloj `rwadar-novedades` (cada 5 minutos; solo existe con algo
--       encendido) no cambia: sigue llamando a procesar().
--   6 · public.clave_publica_webpush_anon(): la clave pública VAPID para
--       anon y authenticated (es pública: viaja en cada notificación). El
--       servidor de la web la pide con la clave publicable para comprobar
--       que quien le llama tiene la privada de RWAdar.
--   7 · webpush_prueba_supabase() y webpush_prueba_supabase_resultado(): la
--       prueba de administración (webpush_prueba de la 32) por este mismo
--       camino (acción prueba-webpush de «Avisos a registrados (base)»).
--
-- Contrato con el servidor de la web (rwadar-acceso/servidor.mjs):
--   POST https://rwadar.pages.dev/api/interno/webpush, sin redirecciones.
--   Cabeceras: content-type: application/json; accept: application/json;
--     x-rwadar-vapid-privada: la privada (d de 32 octetos, 43 caracteres
--       base64url), leída de Vault;
--     x-rwadar-vapid-publica: la pública (punto de 65 octetos, 87 caracteres
--       base64url), la de configuracion.webpush_clave_publica.
--   Cuerpo: {"endpoint", "p256dh", "auth", "carga":
--     {"v": 1, "titulo", "texto", "url", "etiqueta"}}; la carga es la de
--     webpush_carga (32), siempre con url de https://rwadar.pages.dev/.
--   pg_net espera la respuesta 25 segundos como mucho: el servidor tarda
--   como mucho 8 s en comprobar la clave con Supabase y 10 s con el servicio
--   de push, así que su respuesta (también el 0) llega antes y nada sale dos
--   veces por cortar pg_net antes de tiempo.
--   Respuesta: 200 con {"codigo": n}: n es el código HTTP del servicio de
--   push, 0 si no respondió y -1 si la entrada no sirve. Cualquier otra
--   respuesta (otro estado, sin esa forma, o ninguna) es un fallo del
--   servidor y se reintenta, contando el intento.
--   El servidor comprueba que la privada y la pública casan y que la pública
--   es la de RWAdar (clave_publica_webpush_anon): sin la privada de RWAdar
--   nadie puede usarlo para enviar. Nunca registra endpoints, claves ni
--   cargas.
--
-- El interruptor sigue siendo uno para Expo y la web:
-- configuracion.push_habilitado (activar-push). Con el push apagado no sale
-- ninguna notificación web, salvo la prueba de administración, que lanza
-- Víctor a mano. Apagar (30_avisos_registrados_apagar.sql o
-- fallo_cerrado.sql) también la para: quita el reloj de procesar().
--
-- OJO: reaplicar la 30 devuelve procesar() a su versión sin las
-- notificaciones web (y enviar_push, limpiar() y el correo, a las suyas):
-- después hay que reaplicar la 31, la 32 y la 33, en ese orden. El
-- verificador 33 lo detecta. Reaplicar la 31 o la 32 no toca nada de la 33.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.envios_web') is null
     or to_regclass('rwadar_novedades.suscripciones_web') is null
     or to_regprocedure('rwadar_novedades.webpush_carga(text,text,text,text)') is null
     or to_regprocedure('rwadar_novedades.webpush_pendientes(integer)') is null
     or to_regprocedure('rwadar_novedades.webpush_resultado(jsonb)') is null
     or to_regprocedure('rwadar_novedades.webpush_prueba()') is null
     or to_regprocedure('rwadar_novedades.leer_push()') is null
     or to_regprocedure('rwadar_novedades.enviar_push(integer)') is null
     or to_regprocedure('rwadar_novedades.rellenar()') is null
     or to_regprocedure('rwadar_novedades.repartir()') is null
     or to_regprocedure('rwadar_novedades.leer_correos()') is null
     or to_regprocedure('rwadar_novedades.enviar_correos(integer)') is null
     or to_regprocedure('rwadar_novedades.limpiar()') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null
     or not exists (select 1 from pg_attribute
                     where attrelid = to_regclass('rwadar_novedades.configuracion')
                       and attname = 'webpush_clave_publica' and not attisdropped and attnum > 0) then
    raise exception using errcode = '55000',
      message = 'RWAdar 33: falta aplicar antes 32_notificaciones.sql (con la 30 y la 31)';
  end if;
  if position('api.lettermint.co' in
              pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure)) = 0 then
    raise exception using errcode = '55000',
      message = 'RWAdar 33: falta aplicar antes 31_correo_lettermint.sql (¿se reaplicó la 30? reaplicar 31 y 32)';
  end if;
  if to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'net' and p.proname = 'http_post') then
    raise exception using errcode = '55000', message = 'RWAdar 33: faltan pg_net o Vault';
  end if;
end
$precondiciones$;

-- Los cerrojos de procesar() y limpiar() (30) y de las funciones de la web
-- (32), en ese orden, como los toman ellas: ninguna vuelta del reloj corre a
-- medias con el procesar() viejo y el nuevo.
select pg_advisory_xact_lock(20261105, 30);
select pg_advisory_xact_lock(20261112, 32);

-- ---------------------------------------------------------------------
-- 1 · La petición de pg_net de cada envío
-- ---------------------------------------------------------------------
-- Con el envío «enviando»: el número de la petición (net.http_post) y
-- cuándo se pidió. Se vacían al guardar el resultado. Sin datos personales.
alter table rwadar_novedades.envios_web
  add column if not exists peticion_id bigint,
  add column if not exists peticion_el timestamptz;
alter table rwadar_novedades.envios_web drop constraint if exists envio_web_peticion_con_fecha;
alter table rwadar_novedades.envios_web add constraint envio_web_peticion_con_fecha
  check ((peticion_id is null) = (peticion_el is null));

-- ---------------------------------------------------------------------
-- 2 · La respuesta del servidor de la web
-- ---------------------------------------------------------------------
-- 200 con {"codigo": n} y n entero entre -1 y 599 → n. Cualquier otra
-- cosa (otro estado, sin JSON, sin esa forma, demasiado larga) → null, que
-- quiere decir «falló el servidor de la web, no el servicio de push».
-- Cada comprobación va en su propio paso: SQL no garantiza el orden de los
-- «or» y un texto que no es número no puede llegar al cast.
create or replace function rwadar_novedades.webpush_codigo(p_estado integer, p_contenido text)
returns integer
language plpgsql immutable security definer set search_path = ''
as $funcion$
declare
  v_respuesta jsonb;
  v_texto text;
begin
  if p_estado is distinct from 200 or p_contenido is null or char_length(p_contenido) > 200 then
    return null;
  end if;
  begin
    v_respuesta := p_contenido::jsonb;
  exception when others then
    return null;
  end;
  if jsonb_typeof(v_respuesta) is distinct from 'object' then
    return null;
  end if;
  if jsonb_typeof(v_respuesta -> 'codigo') is distinct from 'number' then
    return null;
  end if;
  v_texto := v_respuesta ->> 'codigo';
  if v_texto !~ '^-?[0-9]{1,3}$' then
    return null;
  end if;
  if v_texto::integer not between -1 and 599 then
    return null;
  end if;
  return v_texto::integer;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 3 · La única llamada al servidor de la web
-- ---------------------------------------------------------------------
-- Recibe los envíos con la forma de webpush_pendientes y webpush_prueba
-- ([{id, endpoint, p256dh, auth, carga}]) y pide cada uno al servidor de la
-- web por pg_net (que lo manda al terminar la transacción). Devuelve
-- [{"id", "peticion"}]; peticion null = el envío no tiene forma y no se
-- pidió (no pasa con lo que sale de las tablas, que ya tienen esas reglas).
-- Sin una clave VAPID válida (la pública en la configuración y una sola
-- privada en Vault, con forma) se para sin pedir nada; el mensaje nunca
-- lleva los valores. La privada solo se lee aquí y solo va en su cabecera.
create or replace function rwadar_novedades.webpush_encolar(p_envios jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_publica text;
  v_privada text;
  v_secretos integer;
  v_cabeceras jsonb;
  r record;
  v_peticion bigint;
  v_lista jsonb;
begin
  if p_envios is null or jsonb_typeof(p_envios) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'los envíos de notificaciones web deben ser una lista';
  end if;
  if jsonb_array_length(p_envios) > 500 then
    raise exception using errcode = '22023', message = 'como mucho 500 notificaciones web por tanda';
  end if;
  select c.webpush_clave_publica into v_publica from rwadar_novedades.configuracion c where c.unica;
  select count(*), btrim(max(s.decrypted_secret)) into v_secretos, v_privada
    from vault.decrypted_secrets s where s.name = 'RWADAR_VAPID_PRIVADA';
  if coalesce(v_publica, '') !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$'
     or v_secretos <> 1
     or coalesce(v_privada, '') !~ '^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$' then
    raise exception using errcode = '55000',
      message = 'notificaciones web bloqueadas: falta la clave VAPID o no es válida (crear-vapid)';
  end if;
  v_cabeceras := jsonb_build_object(
    'content-type', 'application/json',
    'accept', 'application/json',
    'x-rwadar-vapid-privada', v_privada,
    'x-rwadar-vapid-publica', v_publica);

  v_lista := '[]'::jsonb;
  for r in
    select x.valor ->> 'id' as id, x.valor ->> 'endpoint' as endpoint, x.valor ->> 'p256dh' as p256dh,
           x.valor ->> 'auth' as auth, x.valor -> 'carga' as carga
      from jsonb_array_elements(p_envios) with ordinality as x(valor, orden)
     order by x.orden
  loop
    if coalesce(r.id, '') !~ '^[ep][1-9][0-9]{0,17}$' then
      raise exception using errcode = '22023', message = 'notificación web sin id válido';
    end if;
    -- Las mismas reglas que las tablas (32) y que el servidor de la web.
    if coalesce(char_length(r.endpoint), 0) not between 1 and 2048
       or r.endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$'
       or coalesce(r.p256dh, '') !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$'
       or coalesce(r.auth, '') !~ '^[A-Za-z0-9_-]{21}[AQgw]$'
       or jsonb_typeof(r.carga) is distinct from 'object'
       or (r.carga -> 'v') is distinct from '1'::jsonb
       or jsonb_typeof(r.carga -> 'titulo') is distinct from 'string'
       or jsonb_typeof(r.carga -> 'texto') is distinct from 'string'
       or jsonb_typeof(r.carga -> 'url') is distinct from 'string'
       or jsonb_typeof(r.carga -> 'etiqueta') is distinct from 'string'
       or coalesce(r.carga ->> 'url', '') !~ '^https://rwadar\.pages\.dev/'
       or octet_length(r.carga::text) > 3993 then
      v_lista := v_lista || jsonb_build_array(jsonb_build_object('id', r.id, 'peticion', null));
      continue;
    end if;
    select net.http_post(
      url := 'https://rwadar.pages.dev/api/interno/webpush',
      headers := v_cabeceras,
      body := jsonb_build_object('endpoint', r.endpoint, 'p256dh', r.p256dh, 'auth', r.auth, 'carga', r.carga),
      timeout_milliseconds := 25000
    ) into v_peticion;
    if v_peticion is null then
      raise exception using errcode = '55000', message = 'pg_net no devolvió identificador de petición';
    end if;
    v_lista := v_lista || jsonb_build_array(jsonb_build_object('id', r.id, 'peticion', v_peticion));
  end loop;
  return v_lista;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 4 · Envío y lectura (desde procesar(), con el push encendido)
-- ---------------------------------------------------------------------
-- Lo que toca ahora, con las reglas de webpush_pendientes (32): anuncios
-- publicados en los últimos 7 días, después de encender el push y de
-- crearse la suscripción, a cuentas confirmadas con el permiso vigente, sin
-- repetir, y los reintentos a sus 5 minutos (hasta 3 intentos). Ya marcados
-- «enviando», se piden al servidor de la web y se guarda el número de cada
-- petición. Sin el push encendido o sin clave pública VAPID no marca ni
-- pide nada. Si algo falla (Vault, pg_net), procesar() deshace el bloque
-- entero: nada se queda «enviando» sin su petición. Devuelve cuántos pidió.
create or replace function rwadar_novedades.enviar_webpush(p_tanda integer default 50)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_lote jsonb;
  v_peticiones jsonb;
  v_sin_forma jsonb;
  r record;
  v_total integer;
begin
  v_total := 0;
  if p_tanda is null or p_tanda not between 1 and 100 then
    raise exception using errcode = '22023', message = 'la tanda de notificaciones web debe estar entre 1 y 100';
  end if;
  if not exists (select 1 from rwadar_novedades.configuracion c
                  where c.unica and c.push_habilitado and c.push_activado_el is not null
                    and c.webpush_clave_publica is not null) then
    return 0;
  end if;
  v_lote := rwadar_novedades.webpush_pendientes(p_tanda);
  if coalesce(jsonb_array_length(v_lote -> 'envios'), 0) = 0 then
    return 0;
  end if;
  v_peticiones := rwadar_novedades.webpush_encolar(v_lote -> 'envios');
  v_sin_forma := '[]'::jsonb;
  for r in
    select x.valor ->> 'id' as id, (x.valor ->> 'peticion')::bigint as peticion
      from jsonb_array_elements(v_peticiones) as x(valor)
  loop
    if r.peticion is null then
      v_sin_forma := v_sin_forma || jsonb_build_array(jsonb_build_object('id', r.id, 'codigo', -1));
    else
      update rwadar_novedades.envios_web
         set peticion_id = r.peticion, peticion_el = now()
       where id = substr(r.id, 2)::bigint and estado = 'enviando';
      v_total := v_total + 1;
    end if;
  end loop;
  -- Lo que no se pudo pedir queda fallido (-1), como con el remitente.
  if jsonb_array_length(v_sin_forma) > 0 then
    perform rwadar_novedades.webpush_resultado(v_sin_forma);
  end if;
  return v_total;
end
$funcion$;

-- Las respuestas del servidor de la web (net._http_response, como
-- leer_push con Expo). 200 con {"codigo": n} → las reglas de
-- webpush_resultado (32): 2xx enviado; 404 o 410 borra la suscripción (y sus
-- envíos); 0, 429 o 5xx, a reintentar a los 5 minutos; -1 u otro código,
-- fallido. Cualquier otra respuesta del servidor (otro estado, sin esa
-- forma, sin conexión o el tiempo agotado) y una petición sin respuesta a
-- los 10 minutos: a reintentar, contando el intento (al tercero, fallido).
-- Nunca guarda ni enseña la respuesta. Devuelve cuántos leyó.
create or replace function rwadar_novedades.leer_webpush()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_codigo integer;
  v_resultados jsonb;
  v_leidos bigint[];
  v_total integer;
begin
  -- El de las funciones de la web (32), como webpush_resultado.
  perform pg_advisory_xact_lock(20261112, 32);
  v_total := 0;
  v_resultados := '[]'::jsonb;
  v_leidos := '{}'::bigint[];
  for r in
    select e.id, e.peticion_el, x.id as respuesta, x.status_code, x.content, x.error_msg
      from rwadar_novedades.envios_web e
      left join net._http_response x on x.id = e.peticion_id
     where e.estado = 'enviando' and e.peticion_id is not null
     order by e.id
     limit 500
     for update of e skip locked
  loop
    if r.respuesta is null or (r.status_code is null and r.error_msg is null) then
      -- pg_net corta a los 25 segundos; a los 10 minutos se da por perdida.
      if r.peticion_el >= now() - interval '10 minutes' then
        continue;
      end if;
      v_codigo := null;
    else
      v_codigo := rwadar_novedades.webpush_codigo(r.status_code, r.content);
    end if;
    if v_codigo is null then
      update rwadar_novedades.envios_web
         set estado = case when intentos >= 3 then 'fallido' else 'reintentar' end,
             codigo = null, peticion_id = null, peticion_el = null, actualizado_el = now()
       where id = r.id;
    else
      v_resultados := v_resultados || jsonb_build_array(jsonb_build_object('id', 'e' || r.id, 'codigo', v_codigo));
      v_leidos := v_leidos || r.id;
    end if;
    v_total := v_total + 1;
  end loop;
  if jsonb_array_length(v_resultados) > 0 then
    perform rwadar_novedades.webpush_resultado(v_resultados);
    update rwadar_novedades.envios_web
       set peticion_id = null, peticion_el = null
     where id = any(v_leidos) and estado <> 'enviando';
  end if;
  return v_total;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 5 · procesar(): la de la 30 más las notificaciones web
-- ---------------------------------------------------------------------
-- La de la 30 letra por letra; solo añade, dentro del bloque del push y
-- después de Expo, leer_webpush() y enviar_webpush() (tanda de 50), cada
-- una en su bloque. El mismo cerrojo: dos vueltas nunca se pisan.
-- Reaplicar la 30 la devuelve a su versión: el verificador 33 lo detecta.
create or replace function rwadar_novedades.procesar()
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_resultado jsonb;
  v_n integer;
begin
  if not pg_try_advisory_xact_lock(20261105, 30) then
    return jsonb_build_object('estado', 'ocupado');
  end if;
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if not found or not (v_cfg.correo_habilitado or v_cfg.push_habilitado) then
    v_resultado := jsonb_build_object('estado', 'apagado');
    begin
      v_n := rwadar_novedades.limpiar();
      v_resultado := v_resultado || jsonb_build_object('limpiados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_limpieza', sqlstate);
      raise warning 'rwadar_novedades: limpieza omitida (sqlstate %)', sqlstate;
    end;
    return v_resultado;
  end if;
  v_resultado := jsonb_build_object('estado', 'encendido',
    'correo', v_cfg.correo_habilitado, 'push', v_cfg.push_habilitado);

  begin
    v_n := rwadar_novedades.rellenar();
    v_resultado := v_resultado || jsonb_build_object('preferencias_rellenadas', v_n);
  exception when others then
    v_resultado := v_resultado || jsonb_build_object('fallo_relleno', sqlstate);
    raise warning 'rwadar_novedades: relleno omitido (sqlstate %)', sqlstate;
  end;
  begin
    v_n := rwadar_novedades.repartir();
    v_resultado := v_resultado || jsonb_build_object('repartidos', v_n);
  exception when others then
    v_resultado := v_resultado || jsonb_build_object('fallo_reparto', sqlstate);
    raise warning 'rwadar_novedades: reparto omitido (sqlstate %)', sqlstate;
  end;
  if v_cfg.correo_habilitado then
    begin
      v_n := rwadar_novedades.leer_correos();
      v_resultado := v_resultado || jsonb_build_object('correos_leidos', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_lectura_correo', sqlstate);
      raise warning 'rwadar_novedades: lectura de correo omitida (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.enviar_correos();
      v_resultado := v_resultado || jsonb_build_object('correos_enviados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_envio_correo', sqlstate);
      raise warning 'rwadar_novedades: envío de correo omitido (sqlstate %)', sqlstate;
    end;
  end if;
  if v_cfg.push_habilitado then
    begin
      v_n := rwadar_novedades.leer_push();
      v_resultado := v_resultado || jsonb_build_object('push_leidos', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_lectura_push', sqlstate);
      raise warning 'rwadar_novedades: lectura de push omitida (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.enviar_push();
      v_resultado := v_resultado || jsonb_build_object('push_enviados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_envio_push', sqlstate);
      raise warning 'rwadar_novedades: envío de push omitido (sqlstate %)', sqlstate;
    end;
    -- Notificaciones web (33): con el mismo interruptor, el mismo cerrojo y
    -- su propia tanda. Primero lo que respondió el servidor de la web y
    -- después lo nuevo; cada paso en su bloque, como los de Expo.
    begin
      v_n := rwadar_novedades.leer_webpush();
      v_resultado := v_resultado || jsonb_build_object('webpush_leidos', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_lectura_webpush', sqlstate);
      raise warning 'rwadar_novedades: lectura de notificaciones web omitida (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.enviar_webpush();
      v_resultado := v_resultado || jsonb_build_object('webpush_enviados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_envio_webpush', sqlstate);
      raise warning 'rwadar_novedades: envío de notificaciones web omitido (sqlstate %)', sqlstate;
    end;
  end if;
  begin
    v_n := rwadar_novedades.limpiar();
    v_resultado := v_resultado || jsonb_build_object('limpiados', v_n);
  exception when others then
    v_resultado := v_resultado || jsonb_build_object('fallo_limpieza', sqlstate);
    raise warning 'rwadar_novedades: limpieza omitida (sqlstate %)', sqlstate;
  end;
  return v_resultado;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 6 · La clave pública VAPID para el servidor de la web
-- ---------------------------------------------------------------------
-- Para anon y authenticated, o null si aún no se ha creado (crear-vapid).
-- Es pública: viaja en cada notificación y la web la usa para suscribirse.
-- El servidor de la web la pide con la clave publicable (con una caché
-- corta) para comprobar que la pública que le llega es la de RWAdar. Solo
-- devuelve esa columna; la privada nunca sale de Vault por aquí.
create or replace function public.clave_publica_webpush_anon()
returns text
language sql stable security definer set search_path = ''
as $funcion$
  select c.webpush_clave_publica from rwadar_novedades.configuracion c where c.unica
$funcion$;

-- ---------------------------------------------------------------------
-- 7 · Prueba de administración por el mismo camino
-- ---------------------------------------------------------------------
-- Los navegadores de webpush_prueba() (32: solo cuentas con
-- perfiles.es_admin, confirmadas, con «Prueba de RWAdar»; no depende del
-- interruptor) se piden al servidor de la web con webpush_encolar, como los
-- envíos de verdad. No guarda nada: devuelve [[petición, suscripción], …]
-- (solo números) para leer después lo que respondió cada una con
-- webpush_prueba_supabase_resultado. pg_net manda las peticiones al
-- terminar la transacción. La lanza Víctor a mano (prueba-webpush).
create or replace function rwadar_novedades.webpush_prueba_supabase()
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_peticiones jsonb;
begin
  v_peticiones := rwadar_novedades.webpush_encolar(
    coalesce(rwadar_novedades.webpush_prueba() -> 'envios', '[]'::jsonb));
  return coalesce((select jsonb_agg(jsonb_build_array((x.valor ->> 'peticion')::bigint,
                                                      substr(x.valor ->> 'id', 2)::bigint) order by x.orden)
                     from jsonb_array_elements(v_peticiones) with ordinality as x(valor, orden)
                    where x.valor ->> 'peticion' is not null), '[]'::jsonb);
end
$funcion$;

-- Lo que respondió cada petición de la prueba, solo con cuentas y códigos:
-- {envios, esperando, enviados, caducadas, fallidos, servidor, codigos,
-- codigos_servidor}. codigos = los de los servicios de push (de menor a
-- mayor); codigos_servidor = el estado HTTP del servidor de la web cuando
-- no respondió 200 con {"codigo": n} (0 = sin conexión o tiempo agotado).
-- 404 o 410 borran esa suscripción si es de una cuenta de administración,
-- como en la prueba de la 32. Se puede llamar varias veces mientras pg_net
-- responde: el resultado no cambia.
create or replace function rwadar_novedades.webpush_prueba_supabase_resultado(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_valido boolean;
  v_peticion bigint;
  v_suscripcion bigint;
  v_respuesta record;
  v_codigo integer;
  v_esperando integer;
  v_enviados integer;
  v_caducadas integer;
  v_fallidos integer;
  v_servidor integer;
  v_codigos integer[];
  v_codigos_servidor integer[];
begin
  if p is null or jsonb_typeof(p) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'la prueba debe ser una lista de peticiones';
  end if;
  if jsonb_array_length(p) > 50 then
    raise exception using errcode = '22023', message = 'la prueba lleva como mucho 50 peticiones';
  end if;
  -- El de las funciones de la web (32), como webpush_resultado.
  perform pg_advisory_xact_lock(20261112, 32);
  v_esperando := 0; v_enviados := 0; v_caducadas := 0; v_fallidos := 0; v_servidor := 0;
  v_codigos := '{}'::integer[];
  v_codigos_servidor := '{}'::integer[];
  for r in select x.valor from jsonb_array_elements(p) as x(valor) loop
    v_valido := jsonb_typeof(r.valor) = 'array';
    if v_valido then
      v_valido := jsonb_array_length(r.valor) = 2
        and jsonb_typeof(r.valor -> 0) = 'number' and jsonb_typeof(r.valor -> 1) = 'number';
    end if;
    if v_valido then
      v_valido := (r.valor ->> 0) ~ '^[1-9][0-9]{0,17}$' and (r.valor ->> 1) ~ '^[1-9][0-9]{0,17}$';
    end if;
    if not v_valido then
      raise exception using errcode = '22023', message = 'petición de prueba no válida';
    end if;
    v_peticion := (r.valor ->> 0)::bigint;
    v_suscripcion := (r.valor ->> 1)::bigint;

    select x.status_code, x.content, x.error_msg into v_respuesta
      from net._http_response x where x.id = v_peticion;
    if not found or (v_respuesta.status_code is null and v_respuesta.error_msg is null) then
      v_esperando := v_esperando + 1;
      continue;
    end if;
    v_codigo := rwadar_novedades.webpush_codigo(v_respuesta.status_code, v_respuesta.content);
    if v_codigo is null then
      v_servidor := v_servidor + 1;
      v_codigos_servidor := v_codigos_servidor || coalesce(v_respuesta.status_code, 0);
    else
      v_codigos := v_codigos || v_codigo;
      if v_codigo between 200 and 299 then
        v_enviados := v_enviados + 1;
      elsif v_codigo in (404, 410) then
        delete from rwadar_novedades.suscripciones_web s
         using public.perfiles pf
         where s.id = v_suscripcion and pf.id = s.usuario_id and pf.es_admin;
        v_caducadas := v_caducadas + 1;
      else
        v_fallidos := v_fallidos + 1;
      end if;
    end if;
  end loop;
  return jsonb_build_object(
    'envios', jsonb_array_length(p), 'esperando', v_esperando, 'enviados', v_enviados,
    'caducadas', v_caducadas, 'fallidos', v_fallidos, 'servidor', v_servidor,
    'codigos', coalesce((select jsonb_agg(c order by c) from unnest(v_codigos) as c), '[]'::jsonb),
    'codigos_servidor', coalesce((select jsonb_agg(c order by c) from unnest(v_codigos_servidor) as c), '[]'::jsonb));
end
$funcion$;

-- ---------------------------------------------------------------------
-- 8 · Permisos: nada para los clientes salvo la clave pública
-- ---------------------------------------------------------------------
-- Los mismos cierres de la 30 y la 32 para todo el esquema (también lo
-- nuevo, aunque los privilegios por defecto lo abrieran al crearlo).
revoke all on all tables in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;

revoke all on function public.clave_publica_webpush_anon() from public, anon, authenticated, service_role;
grant execute on function public.clave_publica_webpush_anon() to anon, authenticated;

notify pgrst, 'reload schema';
commit;
