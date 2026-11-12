-- =====================================================================
-- RWAdar 32 · notificaciones que saltan en el móvil (Expo y web)
-- ---------------------------------------------------------------------
-- Encargo de Víctor (12/11/2026): «que las notificaciones salten al móvil
-- tipo WhatsApp y además salga un 1 en la app».
-- Copia idéntica: supabase/migrations/20261112130000_notificaciones.sql.
--
-- Va después de la 30 y la 31 (las dos aplicadas), que NO se tocan salvo
-- enviar_push y limpiar(). Aplicarla es tocar Supabase en línea: solo con
-- orden expresa de Víctor, con copia antes (flujo «Avisos a registrados
-- (base)», acciones ensayo-32 y aplicar-32). Nunca con `supabase db push`.
--
-- Solo añade. No enciende nada, no toca relojes ni Vault y no reinicia la
-- configuración (reaplicar la 30 sí la reinicia: aquí no se hace):
--   1 · enviar_push (Expo): la misma función de la 30, con la misma firma,
--       dueño, `security definer`, `search_path` vacío y ningún permiso para
--       clientes, salvo 'priority' 'high' en vez de 'default'. Con 'default',
--       Android no despierta a un móvil en reposo y el aviso llega tarde.
--   2 · configuracion.webpush_clave_publica: la clave pública VAPID (P-256
--       sin comprimir, base64url de 87 caracteres). La privada vive en Vault
--       (RWADAR_VAPID_PRIVADA) y nunca en Git: la crea la acción crear-vapid
--       (32_notificaciones_vapid.sql).
--   3 · Notificaciones web (Web Push): suscripciones_web (una por navegador,
--       como mucho 5 por cuenta, solo de los servicios de push conocidos) y
--       envios_web (un envío por anuncio y suscripción). Esquema privado:
--       ningún permiso para clientes.
--   4 · API para la web: registrar_aviso_webpush, quitar_aviso_webpush,
--       mi_aviso_webpush_registrado y clave_publica_webpush. Exigen sesión
--       confirmada, como las de la 30, y ninguna devuelve datos de otras
--       cuentas. Registrar no envía nada.
--   5 · Para el remitente (rwadar-app/enviar-webpush.mjs, flujo
--       «Notificaciones web»), solo el propietario de la base:
--       webpush_pendientes, webpush_resultado, webpush_prueba y
--       webpush_limpiar.
--   6 · limpiar() (la del reloj diario `rwadar-novedades-limpieza`): la
--       misma de la 30 letra por letra, más una llamada a webpush_limpiar()
--       al final. Así los plazos de la web (envíos a los 90 días,
--       suscripciones sin renovar a los 180) se cumplen cada día aunque no
--       se envíe nada. El reloj no cambia: sigue llamando a limpiar().
--
-- El interruptor de envío es el mismo para Expo y la web:
-- configuracion.push_habilitado (activar-push). Con el push apagado no sale
-- ninguna notificación web salvo la de prueba, que solo va a las cuentas de
-- administración (perfiles.es_admin) y la lanza Víctor a mano. Suscribirse
-- (registrar_aviso_webpush) no depende del interruptor: la web deja activar
-- las notificaciones aunque el envío esté apagado, y así Víctor puede
-- probarlas en su móvil antes de encender el envío para todos.
--
-- Cada notificación web lleva a https://rwadar.pages.dev/?avisos=1, que
-- abre la lista de avisos de la campana con la baja a la vista («¿No quieres
-- estos avisos? Desactívalos en Perfil o en los ajustes del móvil.»): la
-- LSSI (art. 21.2, párr. 2) pide la baja en cada comunicación comercial.
--
-- OJO: reaplicar la 30 devuelve enviar_push a 'default' y limpiar() a la
-- versión sin las notificaciones web (y el correo a Brevo): después hay que
-- reaplicar la 31 y la 32. El verificador 32 lo detecta.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.configuracion') is null
     or to_regclass('rwadar_novedades.anuncios') is null
     or to_regclass('rwadar_novedades.preferencias') is null
     or to_regprocedure('rwadar_novedades.enviar_push(integer)') is null
     or to_regprocedure('rwadar_novedades.destino(text,text)') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null
     or to_regprocedure('rwadar_cuentas_privadas.sesion_confirmada()') is null
     or to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 32: falta aplicar antes 30_avisos_registrados.sql (o faltan pg_net o Vault)';
  end if;
  if not exists (select 1 from pg_attribute
                  where attrelid = to_regclass('public.perfiles') and attname = 'es_admin'
                    and not attisdropped and attnum > 0) then
    raise exception using errcode = '55000',
      message = 'RWAdar 32: falta public.perfiles.es_admin (10_moderacion.sql)';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que procesar() y limpiar(): ninguna vuelta del reloj de
-- envío corre a medias con el enviar_push viejo y el nuevo.
select pg_advisory_xact_lock(20261105, 30);

-- ---------------------------------------------------------------------
-- 1 · Push de Expo con prioridad alta
-- ---------------------------------------------------------------------
-- Copia literal de la 30 salvo una línea: 'priority', 'high'. Según la
-- documentación de Expo, 'default' es la prioridad normal de Android (no
-- despierta un móvil dormido) y 'high' la de una notificación visible.
-- create or replace conserva el dueño y los permisos; aun así se repite el
-- revoke de la 30 (sección 8).
create or replace function rwadar_novedades.enviar_push(p_tanda integer default 50)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_expo text;
  v_cabeceras jsonb;
  r record;
  v_peticion bigint;
  v_total integer;
  v_tipo text;
begin
  v_total := 0;
  if p_tanda is null or p_tanda not between 1 and 100 then
    raise exception using errcode = '22023', message = 'la tanda de push debe estar entre 1 y 100';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion
   where unica and push_habilitado and push_activado_el is not null;
  if not found then
    return 0;
  end if;

  -- EXPO_ACCESS_TOKEN es opcional; si está en el Vault, va como Authorization.
  select nullif(btrim(max(s.decrypted_secret)), '') into v_expo
    from vault.decrypted_secrets s where s.name = 'EXPO_ACCESS_TOKEN';
  if v_expo is not null and v_expo !~ '^[A-Za-z0-9._-]{20,255}$' then
    raise exception using errcode = '55000', message = 'push bloqueado: EXPO_ACCESS_TOKEN no válido en Vault';
  end if;
  v_cabeceras := jsonb_build_object('content-type', 'application/json', 'accept', 'application/json');
  if v_expo is not null then
    v_cabeceras := v_cabeceras || jsonb_build_object('authorization', 'Bearer ' || v_expo);
  end if;

  -- Peticiones sin respuesta: un envío vuelve a cola (contando intentos); una
  -- consulta de recibo vuelve a `ticket` y nunca reenvía la notificación.
  update rwadar_novedades.pushes s
     set estado = case when s.estado = 'consultando' then 'ticket'
                       when s.intentos >= 5 then 'fallido' else 'pendiente' end,
         token = case when s.estado = 'enviando' and s.intentos >= 5 then null else s.token end,
         terminado_el = case when s.estado = 'enviando' and s.intentos >= 5 then now() end,
         peticion_id = null, peticion_el = null,
         error = case when s.estado = 'consultando' then 'Sin respuesta de Expo al consultar el recibo'
                      else 'Sin respuesta de Expo al enviar' end
   where s.estado in ('enviando', 'consultando')
     and s.peticion_el < now() - interval '15 minutes'
     and not exists (select 1 from net._http_response x where x.id = s.peticion_id);

  -- Expo borra los recibos a las 24 horas: termina con error explícito.
  update rwadar_novedades.pushes
     set estado = 'fallido', token = null, terminado_el = now(), error = 'Recibo de Expo caducado'
   where estado = 'ticket' and ticket_el < now() - interval '24 hours';

  -- Recibos de tickets aceptados hace al menos 15 minutos, uno por petición.
  for r in
    select s.id, s.ticket_id
      from rwadar_novedades.pushes s
     where s.estado = 'ticket' and s.ticket_el <= now() - interval '15 minutes'
       and (s.recibo_consultado_el is null or s.recibo_consultado_el <= now() - interval '15 minutes')
     order by s.ticket_el
     limit p_tanda
     for update of s skip locked
  loop
    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/getReceipts',
      headers := v_cabeceras,
      body := jsonb_build_object('ids', jsonb_build_array(r.ticket_id)),
      timeout_milliseconds := 10000
    ) into v_peticion;
    update rwadar_novedades.pushes
       set estado = 'consultando', peticion_id = v_peticion, peticion_el = now(),
           recibo_consultado_el = now(), error = null
     where id = r.id;
    v_total := v_total + 1;
  end loop;

  update rwadar_novedades.pushes
     set estado = 'descartado', token = null, terminado_el = now(),
         error = 'No enviado: anterior a la activación del push'
   where estado = 'pendiente' and creado_el < v_cfg.push_activado_el;

  -- Segunda comprobación: el token sigue siendo de esa cuenta, la cuenta
  -- sigue confirmada y, para un anuncio, con permiso vigente.
  update rwadar_novedades.pushes s
     set estado = 'descartado', token = null, terminado_el = now(),
         error = 'No enviado: sin móvil registrado, sin permiso vigente o cuenta sin confirmar'
   where s.estado = 'pendiente'
     and (not exists (select 1 from rwadar_novedades.dispositivos d
                       where d.token = s.token and d.usuario_id = s.usuario_id)
          or not exists (select 1 from auth.users u
                          where u.id = s.usuario_id and u.email_confirmed_at is not null
                            and u.is_anonymous is not true)
          or (s.tipo = 'anuncio' and not exists (
                select 1 from rwadar_novedades.preferencias p
                  join rwadar_novedades.anuncios a on a.id = s.anuncio_id
                 where p.usuario_id = s.usuario_id and p.novedades
                   and p.version = v_cfg.version_consentimiento and a.estado = 'publicado')));

  for r in
    select s.id, s.token, s.tipo, a.tipo as anuncio_tipo, a.titulo, a.texto, a.enlace
      from rwadar_novedades.pushes s
      join rwadar_novedades.dispositivos d on d.token = s.token and d.usuario_id = s.usuario_id
      join auth.users u on u.id = s.usuario_id
      left join rwadar_novedades.preferencias p on p.usuario_id = s.usuario_id
      left join rwadar_novedades.anuncios a on a.id = s.anuncio_id
     where s.estado = 'pendiente' and s.creado_el >= v_cfg.push_activado_el
       and u.email_confirmed_at is not null and u.is_anonymous is not true
       and (s.tipo = 'bienvenida'
            or (a.estado = 'publicado' and p.novedades and p.version = v_cfg.version_consentimiento))
     order by s.creado_el, s.id
     limit greatest(p_tanda - v_total, 0)
     for update of s skip locked
  loop
    v_tipo := coalesce(r.anuncio_tipo, 'bienvenida');
    -- Canales de Android separados: la bienvenida (de servicio) por `cuenta` y
    -- los anuncios por `novedades`, para que quitar el canal de novedades
    -- desde la propia notificación corte solo los anuncios. `data` solo con
    -- {tipo, destino}: ningún dato personal.
    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := v_cabeceras,
      body := jsonb_build_object(
        'to', r.token,
        'title', case when r.tipo = 'bienvenida' then 'RWAdar' else r.titulo end,
        'body', case when r.tipo = 'bienvenida'
                     then 'Notificaciones activadas en este móvil. Las de novedades solo llegan si las tienes activadas en Perfil.'
                     else r.texto end,
        'sound', 'default',
        'priority', 'high',
        'channelId', case when r.tipo = 'bienvenida' then 'cuenta' else 'novedades' end,
        'data', jsonb_build_object('tipo', v_tipo,
                                   'destino', rwadar_novedades.destino(v_tipo, r.enlace))),
      timeout_milliseconds := 10000
    ) into v_peticion;
    if v_peticion is null then
      raise exception using errcode = '55000', message = 'pg_net no devolvió identificador de petición';
    end if;
    update rwadar_novedades.pushes
       set estado = 'enviando', peticion_id = v_peticion, peticion_el = now(),
           intentos = intentos + 1, error = null
     where id = r.id;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 2 · Clave pública VAPID
-- ---------------------------------------------------------------------
-- Punto P-256 sin comprimir (65 octetos: 0x04, X e Y) en base64url sin
-- relleno: 87 caracteres, el primero «B» y el último uno de los 16 que
-- dejan a cero los dos bits sobrantes. Nula hasta crear-vapid. Reaplicar la
-- 30 no la toca (su insert solo reinicia sus propias columnas).
alter table rwadar_novedades.configuracion
  add column if not exists webpush_clave_publica text;
alter table rwadar_novedades.configuracion drop constraint if exists webpush_clave_publica_valida;
alter table rwadar_novedades.configuracion add constraint webpush_clave_publica_valida
  check (webpush_clave_publica is null
         or webpush_clave_publica ~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$');

-- ---------------------------------------------------------------------
-- 3 · Tablas de las notificaciones web
-- ---------------------------------------------------------------------
-- Una fila por navegador suscrito (PushSubscription). El endpoint es la
-- dirección del servicio de push del navegador: solo https y solo los
-- conocidos (Google, Mozilla, Apple y Microsoft), sin puerto ni usuario.
-- p256dh y auth son las claves públicas del navegador para cifrar (65 y 16
-- octetos en base64url). Se borra con la cuenta, cuando el servicio
-- responde 404 o 410, al pasar de 5 por cuenta y a los 180 días sin
-- renovarse (webpush_limpiar), como los móviles de Expo.
create table if not exists rwadar_novedades.suscripciones_web (
  id             bigint generated always as identity primary key,
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  endpoint       text not null
    constraint suscripcion_web_endpoint_unico unique
    constraint suscripcion_web_endpoint_valido check (char_length(endpoint) <= 2048 and endpoint ~
      '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$'),
  p256dh         text not null
    constraint suscripcion_web_p256dh_valida check (p256dh ~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$'),
  auth           text not null
    constraint suscripcion_web_auth_valida check (auth ~ '^[A-Za-z0-9_-]{21}[AQgw]$'),
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);
create index if not exists suscripciones_web_por_usuario
  on rwadar_novedades.suscripciones_web (usuario_id, actualizado_el);

-- Un envío por anuncio y suscripción, para no repetir. `enviando` = pedido
-- al remitente y aún sin resultado; `enviado` = el servicio de push lo
-- aceptó (2xx; no es la entrega en el móvil); `reintentar` = 429, 5xx o sin
-- respuesta, hasta 3 intentos; `fallido` = otro 4xx o el tercer intento;
-- `descartado` = el anuncio pasó de 7 días sin poder reintentarse. 404 y
-- 410 borran la suscripción (y con ella sus envíos). Sin datos personales.
create table if not exists rwadar_novedades.envios_web (
  id             bigint generated always as identity primary key,
  anuncio_id     bigint not null references rwadar_novedades.anuncios(id) on delete cascade,
  suscripcion_id bigint not null references rwadar_novedades.suscripciones_web(id) on delete cascade,
  estado         text not null default 'enviando'
    constraint envio_web_estado_valido check (estado in ('enviando', 'enviado', 'reintentar', 'fallido', 'descartado')),
  codigo         smallint
    constraint envio_web_codigo_valido check (codigo is null or codigo between -1 and 599),
  intentos       smallint not null default 0
    constraint envio_web_intentos_validos check (intentos between 0 and 3),
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now(),
  enviado_el     timestamptz,
  constraint envio_web_uno_por_par unique (anuncio_id, suscripcion_id),
  constraint envio_web_enviado_con_fecha check (estado <> 'enviado' or enviado_el is not null)
);
create index if not exists envios_web_por_suscripcion
  on rwadar_novedades.envios_web (suscripcion_id);

-- ---------------------------------------------------------------------
-- 4 · API para la web (sesión confirmada; nada de otras cuentas)
-- ---------------------------------------------------------------------
-- La suscripción del navegador (PushSubscription.toJSON()): endpoint y las
-- claves p256dh y auth en base64url (se admite también el relleno «=» y el
-- alfabeto «+/», que se normalizan). Si el endpoint era de otra cuenta, pasa
-- a esta como suscripción nueva (sin los envíos de la anterior). Como mucho
-- 5 por cuenta: una nueva sustituye a la que lleva más tiempo sin renovarse.
-- Volver a registrar la misma la renueva. No envía nada.
create or replace function public.registrar_aviso_webpush(p_endpoint text, p_p256dh text, p_auth text)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
  v_p256dh text;
  v_auth text;
  v_id bigint;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  if p_endpoint is null or char_length(p_endpoint) > 2048 or p_endpoint !~
     '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida: servicio de push desconocido';
  end if;
  v_p256dh := rtrim(translate(coalesce(p_p256dh, ''), '+/', '-_'), '=');
  v_auth := rtrim(translate(coalesce(p_auth, ''), '+/', '-_'), '=');
  if v_p256dh !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$' or v_auth !~ '^[A-Za-z0-9_-]{21}[AQgw]$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida: claves';
  end if;
  v_usuario := auth.uid();

  -- Una cuenta a la vez: la fila de preferencias sirve de cerrojo para el
  -- límite de 5, como en registrar_aviso_push.
  insert into rwadar_novedades.preferencias (usuario_id, novedades, alta_el)
  select u.id, false, coalesce(u.email_confirmed_at, now()) from auth.users u where u.id = v_usuario
  on conflict (usuario_id) do nothing;
  perform 1 from rwadar_novedades.preferencias where usuario_id = v_usuario for update;

  -- El endpoint de otra cuenta se borra (con sus envíos) y se crea de nuevo
  -- para esta: cuenta desde ahora y con el permiso de esta cuenta.
  delete from rwadar_novedades.suscripciones_web
   where endpoint = p_endpoint and usuario_id <> v_usuario;

  delete from rwadar_novedades.suscripciones_web
   where id in (select s.id from rwadar_novedades.suscripciones_web s
                 where s.usuario_id = v_usuario and s.endpoint <> p_endpoint
                 order by s.actualizado_el desc, s.creado_el desc, s.id desc
                 offset 4);

  insert into rwadar_novedades.suscripciones_web as s (usuario_id, endpoint, p256dh, auth)
  values (v_usuario, p_endpoint, v_p256dh, v_auth)
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh, auth = excluded.auth, actualizado_el = now()
    where s.usuario_id = excluded.usuario_id
  returning s.id into v_id;
  -- Otra cuenta lo registró a la vez entre el borrado y el alta.
  if v_id is null then
    raise exception using errcode = '40001', message = 'suscripción en uso: inténtalo de nuevo';
  end if;
  return true;
end
$funcion$;

-- Quita la suscripción de este navegador de la cuenta (al desactivar las
-- notificaciones o al cerrar sesión). Solo mira las de la cuenta.
create or replace function public.quitar_aviso_webpush(p_endpoint text)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  delete from rwadar_novedades.suscripciones_web
   where endpoint = p_endpoint and usuario_id = auth.uid();
  return found;
end
$funcion$;

-- ¿Sigue registrado ESTE navegador en mi cuenta? La web lo pregunta con su
-- propio endpoint al abrir: la base borra las suscripciones que el servicio
-- da por perdidas (404/410), la más antigua si la cuenta pasa de 5 y las que
-- llevan 180 días sin renovarse. Si dice true, la web la renueva con
-- registrar_aviso_webpush (como mucho cada 12 horas); si dice false, vuelve a
-- ofrecer «Activar», que hace una suscripción nueva con la clave vigente.
create or replace function public.mi_aviso_webpush_registrado(p_endpoint text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $funcion$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  return exists (select 1 from rwadar_novedades.suscripciones_web s
                  where s.endpoint = p_endpoint and s.usuario_id = auth.uid());
end
$funcion$;

-- La clave pública VAPID (applicationServerKey de pushManager.subscribe), o
-- null si aún no se ha creado (crear-vapid).
create or replace function public.clave_publica_webpush()
returns text
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_clave text;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  select c.webpush_clave_publica into v_clave from rwadar_novedades.configuracion c where c.unica;
  return v_clave;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 5 · Para el remitente (solo el propietario: flujo «Notificaciones web»)
-- ---------------------------------------------------------------------
-- La carga que va cifrada en cada notificación web (JSON, UTF-8):
-- {"v":1,"titulo","texto","url","etiqueta"}. La url siempre abre la lista de
-- avisos de la campana (?avisos=1), donde se ve la baja (LSSI, art. 21.2,
-- párr. 2); con el destino «buscar», sobre la lista del radar (#emisiones).
-- El destino «academy» va también a la portada: la página de la Academy no
-- tiene campana, y la lista lleva el enlace de cada aviso. Nunca un dato
-- personal. El número del icono no viaja aquí: lo lleva el service worker de
-- la web.
create or replace function rwadar_novedades.webpush_carga(
  p_etiqueta text, p_titulo text, p_texto text, p_destino text
) returns jsonb
language sql stable security definer set search_path = ''
as $funcion$
  select jsonb_build_object(
    'v', 1,
    'titulo', p_titulo,
    'texto', p_texto,
    'url', case p_destino
             when 'buscar' then 'https://rwadar.pages.dev/?avisos=1#emisiones'
             else 'https://rwadar.pages.dev/?avisos=1'
           end,
    'etiqueta', 'rwadar-' || p_etiqueta)
$funcion$;

-- Los envíos que tocan ahora, ya marcados `enviando` (así dos vueltas no
-- mandan lo mismo). Solo con el push encendido y solo:
--   · anuncios publicados en los últimos 7 días, después de encender el
--     push y después de crearse la suscripción (nada viejo de golpe);
--   · a cuentas confirmadas con el permiso de avisos vigente (novedades y la
--     versión actual del texto);
--   · sin envío previo, o con un reintento pendiente de hace 5 minutos o más.
-- Devuelve {"v":1,"push":true|false,"envios":[{id,endpoint,p256dh,auth,carga}]};
-- id = 'e' y el número del envío, para webpush_resultado.
create or replace function rwadar_novedades.webpush_pendientes(p_tanda integer default 200)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  r record;
  v_envio bigint;
  v_envios jsonb;
begin
  if p_tanda is null or p_tanda not between 1 and 500 then
    raise exception using errcode = '22023', message = 'la tanda de notificaciones web debe estar entre 1 y 500';
  end if;
  -- Una vuelta a la vez (el flujo ya va en cola; así también en la base).
  perform pg_advisory_xact_lock(20261112, 32);
  select * into v_cfg from rwadar_novedades.configuracion
   where unica and push_habilitado and push_activado_el is not null;
  if not found then
    return jsonb_build_object('v', 1, 'push', false, 'envios', '[]'::jsonb);
  end if;

  -- Sin resultado guardado (el flujo se cortó): a reintentar ya, contando
  -- el intento hecho (el trabajo del flujo dura como mucho 10 minutos).
  update rwadar_novedades.envios_web
     set estado = case when intentos >= 3 then 'fallido' else 'reintentar' end
   where estado = 'enviando' and actualizado_el < now() - interval '15 minutes';
  -- Un reintento de un anuncio de hace más de 7 días ya no sale.
  update rwadar_novedades.envios_web e
     set estado = 'descartado', actualizado_el = now()
    from rwadar_novedades.anuncios a
   where a.id = e.anuncio_id and e.estado = 'reintentar'
     and coalesce(a.publicado_el, a.creado_el) < now() - interval '7 days';

  v_envios := '[]'::jsonb;
  for r in
    select a.id as anuncio_id, a.tipo, a.titulo, a.texto, a.enlace,
           s.id as suscripcion_id, s.endpoint, s.p256dh, s.auth
      from rwadar_novedades.anuncios a
      join rwadar_novedades.suscripciones_web s
        on coalesce(a.publicado_el, a.creado_el) > s.creado_el
      join rwadar_novedades.preferencias p on p.usuario_id = s.usuario_id
      join auth.users u on u.id = s.usuario_id
      left join rwadar_novedades.envios_web e on e.anuncio_id = a.id and e.suscripcion_id = s.id
     where a.estado = 'publicado'
       and coalesce(a.publicado_el, a.creado_el) >= now() - interval '7 days'
       and coalesce(a.publicado_el, a.creado_el) > v_cfg.push_activado_el
       and p.novedades and p.version = v_cfg.version_consentimiento
       and u.email_confirmed_at is not null and u.is_anonymous is not true
       and (e.id is null
            or (e.estado = 'reintentar' and e.intentos < 3
                and e.actualizado_el <= now() - interval '5 minutes'))
     order by coalesce(a.publicado_el, a.creado_el), a.id, s.id
     limit p_tanda
  loop
    v_envio := null;
    insert into rwadar_novedades.envios_web as e (anuncio_id, suscripcion_id, estado, intentos)
    values (r.anuncio_id, r.suscripcion_id, 'enviando', 1)
    on conflict (anuncio_id, suscripcion_id) do update
      set estado = 'enviando', intentos = e.intentos + 1, codigo = null, actualizado_el = now()
      where e.estado = 'reintentar' and e.intentos < 3
    returning e.id into v_envio;
    if v_envio is not null then
      v_envios := v_envios || jsonb_build_array(jsonb_build_object(
        'id', 'e' || v_envio,
        'endpoint', r.endpoint,
        'p256dh', r.p256dh,
        'auth', r.auth,
        'carga', rwadar_novedades.webpush_carga(r.anuncio_id::text, r.titulo, r.texto,
                                                 rwadar_novedades.destino(r.tipo, r.enlace))));
    end if;
  end loop;
  return jsonb_build_object('v', 1, 'push', true, 'envios', v_envios);
end
$funcion$;

-- Guarda lo que respondió cada servicio de push: [{"id":"e12","codigo":201}].
-- codigo = estado HTTP; 0 = sin respuesta; -1 = el remitente no pudo
-- prepararlo. 2xx = enviado; 404 o 410 = la suscripción ya no existe y se
-- borra; 429, 5xx o 0 = reintentar (hasta 3 intentos); lo demás = fallido.
-- Los de prueba ('p' y el número de la suscripción) solo borran la
-- suscripción con 404 o 410. Un id desconocido o ya guardado no cambia
-- nada. Devuelve solo cuentas.
create or replace function rwadar_novedades.webpush_resultado(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_codigo integer;
  v_envio record;
  v_enviados integer;
  v_reintentar integer;
  v_fallidos integer;
  v_borradas integer;
  v_ignorados integer;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 1000 then
    raise exception using errcode = '22023', message = 'los resultados deben ser una lista de 1000 como mucho';
  end if;
  perform pg_advisory_xact_lock(20261112, 32);
  v_enviados := 0; v_reintentar := 0; v_fallidos := 0; v_borradas := 0; v_ignorados := 0;
  for r in select x.valor ->> 'id' as id, x.valor -> 'codigo' as codigo
             from jsonb_array_elements(p) as x(valor) loop
    if r.id is null or r.id !~ '^[ep][1-9][0-9]{0,17}$'
       or jsonb_typeof(r.codigo) is distinct from 'number' or r.codigo::text !~ '^-?[0-9]{1,3}$' then
      raise exception using errcode = '22023', message = 'resultado de notificación web no válido';
    end if;
    v_codigo := r.codigo::text::integer;
    if v_codigo not between -1 and 599 then
      raise exception using errcode = '22023', message = 'resultado de notificación web no válido';
    end if;

    if left(r.id, 1) = 'p' then
      if not exists (select 1 from rwadar_novedades.suscripciones_web s where s.id = substr(r.id, 2)::bigint) then
        v_ignorados := v_ignorados + 1;
      elsif v_codigo between 200 and 299 then
        v_enviados := v_enviados + 1;
      elsif v_codigo in (404, 410) then
        delete from rwadar_novedades.suscripciones_web where id = substr(r.id, 2)::bigint;
        v_borradas := v_borradas + 1;
      else
        v_fallidos := v_fallidos + 1;
      end if;
      continue;
    end if;

    select e.id, e.suscripcion_id, e.intentos into v_envio
      from rwadar_novedades.envios_web e
     where e.id = substr(r.id, 2)::bigint and e.estado = 'enviando'
       for update;
    if not found then
      v_ignorados := v_ignorados + 1;
    elsif v_codigo between 200 and 299 then
      update rwadar_novedades.envios_web
         set estado = 'enviado', codigo = v_codigo, enviado_el = now(), actualizado_el = now()
       where id = v_envio.id;
      v_enviados := v_enviados + 1;
    elsif v_codigo in (404, 410) then
      delete from rwadar_novedades.suscripciones_web where id = v_envio.suscripcion_id;
      v_borradas := v_borradas + 1;
    elsif v_codigo in (0, 429) or v_codigo between 500 and 599 then
      update rwadar_novedades.envios_web
         set estado = case when v_envio.intentos >= 3 then 'fallido' else 'reintentar' end,
             codigo = v_codigo, actualizado_el = now()
       where id = v_envio.id;
      if v_envio.intentos >= 3 then
        v_fallidos := v_fallidos + 1;
      else
        v_reintentar := v_reintentar + 1;
      end if;
    else
      update rwadar_novedades.envios_web
         set estado = 'fallido', codigo = v_codigo, actualizado_el = now()
       where id = v_envio.id;
      v_fallidos := v_fallidos + 1;
    end if;
  end loop;
  return jsonb_build_object('enviados', v_enviados, 'reintentar', v_reintentar, 'fallidos', v_fallidos,
                            'borradas', v_borradas, 'ignorados', v_ignorados);
end
$funcion$;

-- Prueba: una notificación a cada navegador suscrito de las cuentas de
-- administración (perfiles.es_admin) confirmadas, sin anuncio y sin guardar
-- nada. No depende del interruptor del push: la lanza Víctor a mano para
-- comprobar su móvil antes de encenderlo para todos (la web deja activar las
-- notificaciones con el envío apagado). Mismo formato que
-- webpush_pendientes; id = 'p' y el número de la suscripción.
create or replace function rwadar_novedades.webpush_prueba()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_push boolean;
  v_envios jsonb;
begin
  select coalesce(c.push_habilitado and c.push_activado_el is not null, false) into v_push
    from rwadar_novedades.configuracion c where c.unica;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', 'p' || x.id, 'endpoint', x.endpoint, 'p256dh', x.p256dh, 'auth', x.auth,
           'carga', rwadar_novedades.webpush_carga('prueba', 'Prueba de RWAdar',
                      'Si ves esto, las notificaciones funcionan en este móvil.', 'inicio'))
           order by x.id), '[]'::jsonb)
    into v_envios
    from (select s.id, s.endpoint, s.p256dh, s.auth
            from rwadar_novedades.suscripciones_web s
            join public.perfiles pf on pf.id = s.usuario_id and pf.es_admin
            join auth.users u on u.id = s.usuario_id
           where u.email_confirmed_at is not null and u.is_anonymous is not true
           order by s.id
           limit 50) x;
  return jsonb_build_object('v', 1, 'push', coalesce(v_push, false), 'envios', v_envios);
end
$funcion$;

-- Limpieza de las notificaciones web: envíos de hace más de 90 días (los
-- anuncios solo salen sus primeros 7 días, así que no se repiten) y
-- suscripciones sin renovar en 180 días. Sin red ni Vault. La llaman
-- limpiar() (el reloj diario `rwadar-novedades-limpieza` y cada vuelta de
-- procesar()) y el flujo «Notificaciones web» al terminar cada vuelta.
create or replace function rwadar_novedades.webpush_limpiar()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_total integer;
  v_filas integer;
begin
  perform pg_advisory_xact_lock(20261112, 32);
  delete from rwadar_novedades.envios_web where creado_el < now() - interval '90 days';
  get diagnostics v_total = row_count;
  delete from rwadar_novedades.suscripciones_web where actualizado_el < now() - interval '180 days';
  get diagnostics v_filas = row_count;
  return v_total + v_filas;
end
$funcion$;

-- limpiar() de la 30, letra por letra, más la limpieza de las notificaciones
-- web al final. El reloj diario `rwadar-novedades-limpieza` (04:41 UTC, existe
-- también con todo apagado) y procesar() la llaman: así la privacidad
-- («tras 180 días sin entrar en tu cuenta desde ese navegador») se cumple
-- aunque no haya anuncios ni el push esté encendido. Primero el cerrojo de
-- la 30 y después, dentro de webpush_limpiar(), el de la 32; nada toma el
-- de la 32 y después el de la 30, así que no pueden esperarse en cruz.
-- Reaplicar la 30 la devuelve a su versión: el verificador 32 lo detecta.
create or replace function rwadar_novedades.limpiar()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_filas integer;
  v_total integer;
begin
  -- El mismo cerrojo que procesar(): desde ella lo vuelve a tomar sin
  -- esperar; desde el reloj diario espera a que acabe la vuelta en curso.
  perform pg_advisory_xact_lock(20261105, 30);
  delete from rwadar_novedades.correos
   where estado in ('aceptado', 'descartado', 'fallido', 'incierto')
     and coalesce(terminado_el, creado_el) < now() - interval '90 days';
  get diagnostics v_total = row_count;
  delete from rwadar_novedades.pushes
   where estado in ('aceptado', 'descartado', 'fallido')
     and coalesce(terminado_el, creado_el) < now() - interval '90 days';
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;
  delete from rwadar_novedades.dispositivos where actualizado_el < now() - interval '180 days';
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;
  update rwadar_novedades.pushes set token = null
   where token is not null and estado in ('aceptado', 'descartado', 'fallido');

  -- Historial del permiso. Si el disparador de borrado falló, las filas de
  -- una cuenta que ya no existe se marcan hoy (el plazo cuenta desde ahora,
  -- nunca antes). Después, fuera las de cuentas borradas hace más de 3 años.
  update rwadar_novedades.historial_permiso h
     set cuenta_borrada_el = now()
   where h.cuenta_borrada_el is null
     and not exists (select 1 from auth.users u where u.id = h.usuario_id);
  delete from rwadar_novedades.historial_permiso h
   where h.cuenta_borrada_el < now() - interval '3 years'
     and not exists (select 1 from auth.users u where u.id = h.usuario_id);
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;
  -- Notificaciones web (32): el mismo plazo cada día, se envíe o no.
  v_total := v_total + rwadar_novedades.webpush_limpiar();
  return v_total;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 6 · Permisos: nada para los clientes salvo lo justo
-- ---------------------------------------------------------------------
alter table rwadar_novedades.suscripciones_web enable row level security;
alter table rwadar_novedades.envios_web enable row level security;

-- Los mismos cierres de la 30 para todo el esquema (también lo nuevo).
revoke all on all tables in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on function rwadar_novedades.enviar_push(integer) from public, anon, authenticated, service_role;

revoke all on function public.registrar_aviso_webpush(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.quitar_aviso_webpush(text) from public, anon, authenticated, service_role;
revoke all on function public.mi_aviso_webpush_registrado(text) from public, anon, authenticated, service_role;
revoke all on function public.clave_publica_webpush() from public, anon, authenticated, service_role;

grant execute on function public.registrar_aviso_webpush(text, text, text) to authenticated;
grant execute on function public.quitar_aviso_webpush(text) to authenticated;
grant execute on function public.mi_aviso_webpush_registrado(text) to authenticated;
grant execute on function public.clave_publica_webpush() to authenticated;

notify pgrst, 'reload schema';
commit;
