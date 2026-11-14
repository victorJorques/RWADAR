-- =====================================================================
-- RWAdar 36 · notificaciones sin cuenta (web en iPhone y Android, y app de
-- Android)
-- ---------------------------------------------------------------------
-- Encargo de la dirección (14/11/2026): «que salga tanto en iPhone como en
-- Android; muy importante que funcionen las notificaciones y los avisos
-- aunque no tengan cuenta o no hayan iniciado sesión: que puedan
-- activarlas». Estudio y plan: docs/tareas/AVISOS-SIN-CUENTA-2026-11-14.md
-- (contrato de la API del servidor de la web incluido).
-- Copia idéntica: supabase/migrations/20261114180000_avisos_sin_cuenta.sql.
--
-- Va después de la 30, la 31, la 32, la 33 y la 34 (todas aplicadas).
-- Aplicarla es tocar Supabase en línea: solo con orden expresa de Víctor,
-- con copia antes (flujo «Avisos a registrados (base)», acciones ensayo-36 y
-- aplicar-36). Nunca con `supabase db push`.
--
-- Solo añade y redefine con create or replace. NACE APAGADA: no toca ninguna
-- tabla de cuentas (preferencias, dispositivos, suscripciones_web, pushes…),
-- ni relojes, ni Vault, y no enciende nada. Lo enciende aparte
-- 36_avisos_sin_cuenta_activar.sql (acción activar-sin-cuenta), que exige el
-- push encendido y la clave VAPID. Lo apaga 36_avisos_sin_cuenta_apagar.sql
-- (y fallo_cerrado.sql).
--   1 · configuracion: el interruptor sin_cuenta_activa con su fecha, la
--       versión y los textos del permiso sin cuenta (castellano e inglés) y
--       dos cupos (altas nuevas por hora y máximo total, por canal).
--   2 · Tablas aparte, sin usuario: sin_cuenta_web (un navegador),
--       sin_cuenta_movil (un móvil de Android con la app), sus colas
--       (envios_sin_cuenta_web y pushes_sin_cuenta) y historial_sin_cuenta
--       (solo añadir: la prueba del permiso, RGPD art. 7.1; se borra a los 3
--       años de la baja). RLS y ningún permiso para los clientes.
--   3 · API para anon y authenticated (la llaman el servidor de la web, con
--       la clave publicable, y en teoría cualquiera con ella): el texto, el
--       alta, la baja y el estado, de la web y del móvil, y los avisos
--       publicados. Son la barrera de verdad: interruptor, versión vigente,
--       forma de cada dato, cupos, «la misma dirección con otra clave auth se
--       rechaza» y la baja, que funciona siempre.
--   4 · Envío desde procesar() (mismo reloj, mismo interruptor del push y
--       además sin_cuenta_activa): la web por webpush_encolar (33) y Expo con
--       las mismas cabeceras, el canal `novedades` y prioridad alta. Solo
--       anuncios publicados de los últimos 7 días, posteriores al alta y a la
--       activación. Si la dirección o el token también están en una cuenta
--       que los va a recibir, no sale el de sin cuenta (no llegan dos).
--       404/410 de la web, DeviceNotRegistered de Expo o tres fallos
--       seguidos borran la fila y apuntan la baja.
--   5 · procesar() (la de la 33 letra por letra más cuatro bloques sin
--       cuenta al final del bloque del push) y limpiar() (la de la 32 letra
--       por letra más sin_cuenta_limpiar()). El verificador 30 no admite un
--       segundo reloj: todo va por el de siempre.
--   6 · La prueba («Prueba de RWAdar» solo con 5 suscripciones sin cuenta o
--       menos) y sus resultados.
--
-- Cerrojos: el de la 30 (procesar y limpiar) y después, dentro, el de la 32
-- (webpush_limpiar) y el de la 36 (20261114, 36); nada toma el de la 36 y
-- después el de la 30 o el de la 32. Las altas tienen el suyo (20261114,
-- 361), solo para contar los cupos de una en una.
--
-- OJO: reaplicar la 30 (procesar y limpiar), la 32 (limpiar) o la 33
-- (procesar) quita el envío o la limpieza sin cuenta: después hay que
-- reaplicar la 36. El verificador 36 lo detecta. La cadena queda
-- 30 → 31 → 32 → 33 → 34 → 36.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.configuracion') is null
     or to_regclass('rwadar_novedades.anuncios') is null
     or to_regclass('rwadar_novedades.suscripciones_web') is null
     or to_regclass('rwadar_novedades.envios_web') is null
     or to_regclass('rwadar_novedades.dispositivos') is null
     or to_regprocedure('rwadar_novedades.destino(text,text)') is null
     or to_regprocedure('rwadar_novedades.webpush_carga(text,text,text,text)') is null
     or to_regprocedure('rwadar_novedades.webpush_codigo(integer,text)') is null
     or to_regprocedure('rwadar_novedades.webpush_encolar(jsonb)') is null
     or to_regprocedure('rwadar_novedades.webpush_limpiar()') is null
     or to_regprocedure('rwadar_novedades.leer_webpush()') is null
     or to_regprocedure('rwadar_novedades.enviar_webpush(integer)') is null
     or to_regprocedure('rwadar_novedades.limpiar()') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 36: falta aplicar antes 33_webpush_supabase.sql (con la 30, la 31 y la 32)';
  end if;
  -- procesar() tiene que ser la de la 33 y limpiar() la de la 32: sobre las
  -- de la 30 (reaplicada después) se perderían las notificaciones web.
  if position('rwadar_novedades.enviar_webpush()' in
              pg_get_functiondef('rwadar_novedades.procesar()'::regprocedure)) = 0
     or position('rwadar_novedades.webpush_limpiar()' in
                 pg_get_functiondef('rwadar_novedades.limpiar()'::regprocedure)) = 0 then
    raise exception using errcode = '55000',
      message = 'RWAdar 36: procesar() o limpiar() no son las de la 33 y la 32 (¿se reaplicó la 30? reaplicar 31, 32, 33 y 34 antes)';
  end if;
  if to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null
     or not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                     where n.nspname = 'net' and p.proname = 'http_post') then
    raise exception using errcode = '55000', message = 'RWAdar 36: faltan pg_net o Vault';
  end if;
end
$precondiciones$;

-- Los cerrojos de procesar() y limpiar() (30), de la web (32) y el de la 36,
-- en ese orden, como los toman ellas: ninguna vuelta del reloj corre a
-- medias con el procesar() viejo y el nuevo.
select pg_advisory_xact_lock(20261105, 30);
select pg_advisory_xact_lock(20261112, 32);
select pg_advisory_xact_lock(20261114, 36);

-- ---------------------------------------------------------------------
-- 1 · Configuración: interruptor, texto versionado y cupos
-- ---------------------------------------------------------------------
-- Nace apagado. Reaplicar la 36 no lo enciende ni lo apaga: solo vuelve a
-- poner la versión y los textos de este archivo (cambiar una palabra obliga
-- a otra versión, y las altas con la anterior dejan de recibir hasta que la
-- web o la app las renueven con la nueva). Reaplicar la 30 no toca estas
-- columnas (su insert solo reinicia las suyas).
alter table rwadar_novedades.configuracion
  add column if not exists sin_cuenta_activa boolean not null default false,
  add column if not exists sin_cuenta_activada_el timestamptz,
  add column if not exists sin_cuenta_version text,
  add column if not exists sin_cuenta_texto_es text,
  add column if not exists sin_cuenta_texto_en text,
  add column if not exists sin_cuenta_cupo_hora integer not null default 300,
  add column if not exists sin_cuenta_maximo integer not null default 20000;

update rwadar_novedades.configuracion
   set sin_cuenta_version = 'sin-cuenta-v1-2026-11-14',
       sin_cuenta_texto_es = 'Quiero recibir en este móvil notificaciones de RWAdar: fichas nuevas en el radar y novedades de la web y la app. Es opcional y no necesita cuenta. Las quitas cuando quieras aquí o en los ajustes del móvil. Solo para mayores de 18 años. Más información en Privacidad.',
       sin_cuenta_texto_en = 'I want to receive RWAdar notifications on this phone: new listings on the radar and news about the website and the app. It''s optional and doesn''t need an account. You can turn them off whenever you like here or in your phone settings. Only for people aged 18 or over. More information in Privacy.'
 where unica;

alter table rwadar_novedades.configuracion drop constraint if exists sin_cuenta_activada_con_fecha;
alter table rwadar_novedades.configuracion add constraint sin_cuenta_activada_con_fecha
  check (not sin_cuenta_activa or (sin_cuenta_activada_el is not null and sin_cuenta_version is not null
                                   and sin_cuenta_texto_es is not null and sin_cuenta_texto_en is not null));
alter table rwadar_novedades.configuracion drop constraint if exists sin_cuenta_cupos_validos;
alter table rwadar_novedades.configuracion add constraint sin_cuenta_cupos_validos
  check (sin_cuenta_cupo_hora between 1 and 5000 and sin_cuenta_maximo between 1 and 100000);

-- ---------------------------------------------------------------------
-- 2 · Tablas sin cuenta (sin usuario, sin correo)
-- ---------------------------------------------------------------------
-- Un navegador (PushSubscription.toJSON()). Las mismas reglas que
-- suscripciones_web (32): solo https y los servicios de push conocidos;
-- p256dh y auth con su forma. `ref` es un número al azar que enlaza la fila
-- con su historial sin guardar allí la dirección. `fallos` cuenta los fallos
-- seguidos que no se arreglan reintentando: al tercero se borra.
create table if not exists rwadar_novedades.sin_cuenta_web (
  id             bigint generated always as identity primary key,
  ref            uuid not null default gen_random_uuid()
    constraint sin_cuenta_web_ref_unica unique,
  endpoint       text not null
    constraint sin_cuenta_web_endpoint_unico unique
    constraint sin_cuenta_web_endpoint_valido check (char_length(endpoint) <= 2048 and endpoint ~
      '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$'),
  p256dh         text not null
    constraint sin_cuenta_web_p256dh_valida check (p256dh ~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$'),
  auth           text not null
    constraint sin_cuenta_web_auth_valida check (auth ~ '^[A-Za-z0-9_-]{21}[AQgw]$'),
  version        text not null,
  idioma         text not null
    constraint sin_cuenta_web_idioma_valido check (idioma in ('es', 'en')),
  origen         text not null
    constraint sin_cuenta_web_origen_valido check (origen in ('novedades', 'perfil', 'avisos')),
  fallos         smallint not null default 0
    constraint sin_cuenta_web_fallos_validos check (fallos between 0 and 3),
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);
create index if not exists sin_cuenta_web_por_renovar
  on rwadar_novedades.sin_cuenta_web (actualizado_el);

-- Un móvil con la app de Android (token de Expo). No hay app de iPhone: en
-- iPhone las notificaciones van por la web añadida a la pantalla de inicio.
create table if not exists rwadar_novedades.sin_cuenta_movil (
  id             bigint generated always as identity primary key,
  ref            uuid not null default gen_random_uuid()
    constraint sin_cuenta_movil_ref_unica unique,
  token          text not null
    constraint sin_cuenta_movil_token_unico unique
    constraint sin_cuenta_movil_token_valido check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$'),
  plataforma     text not null
    constraint sin_cuenta_movil_plataforma_valida check (plataforma = 'android'),
  version        text not null,
  idioma         text not null
    constraint sin_cuenta_movil_idioma_valido check (idioma in ('es', 'en')),
  origen         text not null
    constraint sin_cuenta_movil_origen_valido check (origen in ('novedades', 'perfil', 'avisos')),
  fallos         smallint not null default 0
    constraint sin_cuenta_movil_fallos_validos check (fallos between 0 and 3),
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);
create index if not exists sin_cuenta_movil_por_renovar
  on rwadar_novedades.sin_cuenta_movil (actualizado_el);

-- Un envío web por anuncio y navegador, con los estados de envios_web (32 y
-- 33). Sin datos personales; se borra con el navegador y con el anuncio, y a
-- los 90 días.
create table if not exists rwadar_novedades.envios_sin_cuenta_web (
  id             bigint generated always as identity primary key,
  anuncio_id     bigint not null references rwadar_novedades.anuncios(id) on delete cascade,
  suscripcion_id bigint not null references rwadar_novedades.sin_cuenta_web(id) on delete cascade,
  estado         text not null default 'enviando'
    constraint envio_sin_cuenta_web_estado_valido check (estado in ('enviando', 'enviado', 'reintentar', 'fallido', 'descartado')),
  codigo         smallint
    constraint envio_sin_cuenta_web_codigo_valido check (codigo is null or codigo between -1 and 599),
  intentos       smallint not null default 0
    constraint envio_sin_cuenta_web_intentos_validos check (intentos between 0 and 3),
  peticion_id    bigint,
  peticion_el    timestamptz,
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now(),
  enviado_el     timestamptz,
  constraint envio_sin_cuenta_web_uno_por_par unique (anuncio_id, suscripcion_id),
  constraint envio_sin_cuenta_web_enviado_con_fecha check (estado <> 'enviado' or enviado_el is not null),
  constraint envio_sin_cuenta_web_peticion_con_fecha check ((peticion_id is null) = (peticion_el is null))
);
create index if not exists envios_sin_cuenta_web_por_suscripcion
  on rwadar_novedades.envios_sin_cuenta_web (suscripcion_id);

-- Un push de Expo por anuncio y móvil. El token no se copia: se lee de
-- sin_cuenta_movil al enviar. `ticket` = Expo lo aceptó; el recibo (a los
-- 15 minutos) dice si FCM lo aceptó.
create table if not exists rwadar_novedades.pushes_sin_cuenta (
  id                   bigint generated always as identity primary key,
  anuncio_id           bigint not null references rwadar_novedades.anuncios(id) on delete cascade,
  movil_id             bigint not null references rwadar_novedades.sin_cuenta_movil(id) on delete cascade,
  estado               text not null default 'enviando'
    constraint push_sin_cuenta_estado_valido check (estado in
      ('enviando', 'reintentar', 'ticket', 'consultando', 'aceptado', 'fallido', 'descartado')),
  intentos             smallint not null default 0
    constraint push_sin_cuenta_intentos_validos check (intentos between 0 and 3),
  peticion_id          bigint,
  peticion_el          timestamptz,
  ticket_id            text,
  ticket_el            timestamptz,
  recibo_consultado_el timestamptz,
  error                text
    constraint push_sin_cuenta_error_corto check (error is null or char_length(error) <= 160),
  creado_el            timestamptz not null default now(),
  actualizado_el       timestamptz not null default now(),
  terminado_el         timestamptz,
  constraint push_sin_cuenta_uno_por_par unique (anuncio_id, movil_id),
  constraint push_sin_cuenta_peticion_con_fecha check ((peticion_id is null) = (peticion_el is null))
);
create unique index if not exists pushes_sin_cuenta_ticket_unico
  on rwadar_novedades.pushes_sin_cuenta (ticket_id) where ticket_id is not null;
create index if not exists pushes_sin_cuenta_por_movil
  on rwadar_novedades.pushes_sin_cuenta (movil_id);

-- Historial del permiso sin cuenta, solo de añadir: cada alta (nueva o con
-- una versión nueva del texto) y cada baja, con la versión, el idioma y el
-- origen, sin la dirección ni el token (solo `ref`). Prueba del
-- consentimiento (RGPD art. 7.1). limpiar() borra los de una `ref` cuya baja
-- tiene más de 3 años; el disparador no deja cambiar nada ni borrar antes.
-- Motivo de un alta: nueva o version. De una baja: boton (la persona),
-- servicio (404/410 o DeviceNotRegistered), fallos (tres seguidos) o
-- caducada (180 días sin renovar).
create table if not exists rwadar_novedades.historial_sin_cuenta (
  id        bigint generated always as identity primary key,
  ref       uuid not null,
  canal     text not null
    constraint historial_sin_cuenta_canal_valido check (canal in ('web', 'movil')),
  accion    text not null
    constraint historial_sin_cuenta_accion_valida check (accion in ('alta', 'baja')),
  motivo    text not null
    constraint historial_sin_cuenta_motivo_valido check (
      (accion = 'alta' and motivo in ('nueva', 'version'))
      or (accion = 'baja' and motivo in ('boton', 'servicio', 'fallos', 'caducada'))),
  version   text,
  idioma    text
    constraint historial_sin_cuenta_idioma_valido check (idioma is null or idioma in ('es', 'en')),
  origen    text
    constraint historial_sin_cuenta_origen_valido check (origen is null or origen in ('novedades', 'perfil', 'avisos')),
  creado_el timestamptz not null default now(),
  constraint historial_sin_cuenta_alta_con_version
    check (accion = 'baja' or (version is not null and idioma is not null and origen is not null))
);
create index if not exists historial_sin_cuenta_por_ref
  on rwadar_novedades.historial_sin_cuenta (ref, creado_el);
create index if not exists historial_sin_cuenta_altas_nuevas
  on rwadar_novedades.historial_sin_cuenta (canal, creado_el) where accion = 'alta' and motivo = 'nueva';
create index if not exists historial_sin_cuenta_bajas
  on rwadar_novedades.historial_sin_cuenta (creado_el) where accion = 'baja';

create or replace function rwadar_novedades.historial_sin_cuenta_solo_anadir()
returns trigger
language plpgsql security definer set search_path = ''
as $funcion$
begin
  -- Solo se borran filas de hace más de 3 años (limpiar() solo borra las de
  -- una ref dada de baja hace más de 3 años); nada se cambia.
  if tg_op = 'DELETE' and old.creado_el < now() - interval '3 years' then
    return old;
  end if;
  raise exception using errcode = '42501',
    message = 'el historial sin cuenta solo admite añadir filas';
end
$funcion$;

drop trigger if exists historial_sin_cuenta_solo_anadir on rwadar_novedades.historial_sin_cuenta;
create trigger historial_sin_cuenta_solo_anadir
  before update or delete on rwadar_novedades.historial_sin_cuenta
  for each row execute function rwadar_novedades.historial_sin_cuenta_solo_anadir();

-- ---------------------------------------------------------------------
-- 3 · Piezas internas (solo el propietario)
-- ---------------------------------------------------------------------
-- Quita un navegador o un móvil sin cuenta (con sus envíos) y apunta la
-- baja con su motivo. Devuelve si había algo que quitar.
create or replace function rwadar_novedades.sin_cuenta_quitar(p_canal text, p_id bigint, p_motivo text)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_ref uuid;
begin
  if p_canal = 'web' then
    delete from rwadar_novedades.sin_cuenta_web where id = p_id returning ref into v_ref;
  elsif p_canal = 'movil' then
    delete from rwadar_novedades.sin_cuenta_movil where id = p_id returning ref into v_ref;
  else
    raise exception using errcode = '22023', message = 'canal sin cuenta no válido';
  end if;
  if v_ref is null then
    return false;
  end if;
  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo)
  values (v_ref, p_canal, 'baja', p_motivo);
  return true;
end
$funcion$;

-- Un fallo que no se arregla reintentando: al tercero seguido, fuera.
create or replace function rwadar_novedades.sin_cuenta_fallo(p_canal text, p_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_fallos integer;
begin
  if p_canal = 'web' then
    update rwadar_novedades.sin_cuenta_web set fallos = least(fallos + 1, 3)
     where id = p_id returning fallos into v_fallos;
  else
    update rwadar_novedades.sin_cuenta_movil set fallos = least(fallos + 1, 3)
     where id = p_id returning fallos into v_fallos;
  end if;
  if v_fallos >= 3 then
    perform rwadar_novedades.sin_cuenta_quitar(p_canal, p_id, 'fallos');
  end if;
end
$funcion$;

-- Las cabeceras de Expo, como enviar_push (30 y 32): EXPO_ACCESS_TOKEN es
-- opcional y, si está en Vault, va como Authorization.
create or replace function rwadar_novedades.sin_cuenta_expo_cabeceras()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_expo text;
  v_cabeceras jsonb;
begin
  select nullif(btrim(max(s.decrypted_secret)), '') into v_expo
    from vault.decrypted_secrets s where s.name = 'EXPO_ACCESS_TOKEN';
  if v_expo is not null and v_expo !~ '^[A-Za-z0-9._-]{20,255}$' then
    raise exception using errcode = '55000', message = 'push bloqueado: EXPO_ACCESS_TOKEN no válido en Vault';
  end if;
  v_cabeceras := jsonb_build_object('content-type', 'application/json', 'accept', 'application/json');
  if v_expo is not null then
    v_cabeceras := v_cabeceras || jsonb_build_object('authorization', 'Bearer ' || v_expo);
  end if;
  return v_cabeceras;
end
$funcion$;

-- La parte útil de una respuesta de Expo (send o getReceipts): {status,
-- error, id}, o null si no se puede leer. Nunca guarda la respuesta.
create or replace function rwadar_novedades.sin_cuenta_expo_leer(p_contenido text, p_ticket text)
returns jsonb
language plpgsql immutable security definer set search_path = ''
as $funcion$
declare
  v_carga jsonb;
  v_resultado jsonb;
begin
  if p_contenido is null or char_length(p_contenido) > 20000 then
    return null;
  end if;
  begin
    v_carga := p_contenido::jsonb;
  exception when others then
    return null;
  end;
  if jsonb_typeof(v_carga) is distinct from 'object' then
    return null;
  end if;
  if p_ticket is null then
    -- Expo admite para un destinatario tanto objeto como lista de uno.
    v_resultado := case jsonb_typeof(v_carga -> 'data')
      when 'array' then v_carga -> 'data' -> 0 else v_carga -> 'data' end;
  else
    v_resultado := v_carga -> 'data' -> p_ticket;
  end if;
  if jsonb_typeof(v_resultado) is distinct from 'object' then
    return null;
  end if;
  return jsonb_build_object('status', v_resultado ->> 'status',
                            'error', v_resultado -> 'details' ->> 'error',
                            'id', v_resultado ->> 'id');
end
$funcion$;

-- ---------------------------------------------------------------------
-- 4 · API para anon y authenticated
-- ---------------------------------------------------------------------
-- El texto que se enseña junto al botón, su versión, si se puede activar
-- ahora y la clave pública VAPID (la de clave_publica_webpush_anon). activo
-- solo es true con el interruptor sin cuenta, el push encendido y la clave.
create or replace function public.avisos_sin_cuenta_texto()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
begin
  select * into v_cfg from rwadar_novedades.configuracion c where c.unica;
  if not found then
    return jsonb_build_object('v', 1, 'activo', false, 'version', null, 'texto_es', null,
                              'texto_en', null, 'clave_publica', null);
  end if;
  return jsonb_build_object(
    'v', 1,
    'activo', coalesce(v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is not null
                       and v_cfg.push_habilitado and v_cfg.push_activado_el is not null
                       and v_cfg.webpush_clave_publica is not null, false),
    'version', v_cfg.sin_cuenta_version,
    'texto_es', v_cfg.sin_cuenta_texto_es,
    'texto_en', v_cfg.sin_cuenta_texto_en,
    'clave_publica', v_cfg.webpush_clave_publica);
end
$funcion$;

-- Alta (o renovación) de un navegador sin cuenta. Errores de forma: 22023.
-- Lo demás va en la respuesta, sin excepción:
--   {"ok": true, "estado": "activa", "nueva": true|false}
--   {"ok": false, "error": "apagado"|"version"|"en_uso"|"cupo"|"lleno"}
-- en_uso: esa dirección ya está dada de alta con otra clave auth (solo la
-- conocen el navegador y RWAdar): no se toca. Renovar no gasta cupo.
create or replace function public.alta_aviso_sin_cuenta_web(
  p_endpoint text, p_p256dh text, p_auth text, p_version text, p_idioma text, p_origen text
) returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_fila record;
  v_p256dh text;
  v_auth text;
  v_ref uuid;
begin
  if p_endpoint is null or char_length(p_endpoint) > 2048 or p_endpoint !~
     '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.notify\.windows\.com)/[A-Za-z0-9._~:/?=&%+-]+$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida: servicio de push desconocido';
  end if;
  v_p256dh := rtrim(translate(coalesce(p_p256dh, ''), '+/', '-_'), '=');
  v_auth := rtrim(translate(coalesce(p_auth, ''), '+/', '-_'), '=');
  if v_p256dh !~ '^B[A-Za-z0-9_-]{85}[AEIMQUYcgkosw048]$' or v_auth !~ '^[A-Za-z0-9_-]{21}[AQgw]$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida: claves';
  end if;
  if p_version is null or p_version !~ '^[a-z0-9][a-z0-9.-]{2,79}$'
     or p_idioma is null or p_idioma not in ('es', 'en')
     or p_origen is null or p_origen not in ('novedades', 'perfil', 'avisos') then
    raise exception using errcode = '22023', message = 'versión, idioma u origen no válidos';
  end if;

  -- Una alta a la vez: los cupos se cuentan sin carreras.
  perform pg_advisory_xact_lock(20261114, 361);
  select * into v_cfg from rwadar_novedades.configuracion c where c.unica;
  if not coalesce(v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is not null
                  and v_cfg.push_habilitado and v_cfg.push_activado_el is not null
                  and v_cfg.webpush_clave_publica is not null, false) then
    return jsonb_build_object('ok', false, 'error', 'apagado');
  end if;
  if p_version is distinct from v_cfg.sin_cuenta_version then
    return jsonb_build_object('ok', false, 'error', 'version');
  end if;

  select w.id, w.ref, w.auth, w.version into v_fila
    from rwadar_novedades.sin_cuenta_web w where w.endpoint = p_endpoint for update;
  if found then
    if v_fila.auth is distinct from v_auth then
      return jsonb_build_object('ok', false, 'error', 'en_uso');
    end if;
    update rwadar_novedades.sin_cuenta_web
       set p256dh = v_p256dh, version = p_version, idioma = p_idioma, origen = p_origen,
           actualizado_el = now()
     where id = v_fila.id;
    if v_fila.version is distinct from p_version then
      insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo, version, idioma, origen)
      values (v_fila.ref, 'web', 'alta', 'version', p_version, p_idioma, p_origen);
    end if;
    return jsonb_build_object('ok', true, 'estado', 'activa', 'nueva', false);
  end if;

  if (select count(*) from rwadar_novedades.historial_sin_cuenta h
       where h.canal = 'web' and h.accion = 'alta' and h.motivo = 'nueva'
         and h.creado_el > now() - interval '1 hour') >= v_cfg.sin_cuenta_cupo_hora then
    return jsonb_build_object('ok', false, 'error', 'cupo');
  end if;
  if (select count(*) from rwadar_novedades.sin_cuenta_web) >= v_cfg.sin_cuenta_maximo then
    return jsonb_build_object('ok', false, 'error', 'lleno');
  end if;
  insert into rwadar_novedades.sin_cuenta_web (endpoint, p256dh, auth, version, idioma, origen)
  values (p_endpoint, v_p256dh, v_auth, p_version, p_idioma, p_origen)
  returning ref into v_ref;
  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo, version, idioma, origen)
  values (v_ref, 'web', 'alta', 'nueva', p_version, p_idioma, p_origen);
  return jsonb_build_object('ok', true, 'estado', 'activa', 'nueva', true);
end
$funcion$;

-- Baja de un navegador sin cuenta: con su dirección y su clave auth.
-- Funciona siempre, también con el interruptor apagado. {"ok": true,
-- "borrada": true|false} (false: no estaba, o con otra clave).
create or replace function public.baja_aviso_sin_cuenta_web(p_endpoint text, p_auth text)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_auth text;
  v_id bigint;
begin
  if p_endpoint is null or char_length(p_endpoint) > 2048 then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida';
  end if;
  v_auth := rtrim(translate(coalesce(p_auth, ''), '+/', '-_'), '=');
  if v_auth !~ '^[A-Za-z0-9_-]{21}[AQgw]$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida: claves';
  end if;
  select w.id into v_id from rwadar_novedades.sin_cuenta_web w
   where w.endpoint = p_endpoint and w.auth = v_auth for update;
  if v_id is null then
    return jsonb_build_object('ok', true, 'borrada', false);
  end if;
  return jsonb_build_object('ok', true, 'borrada', rwadar_novedades.sin_cuenta_quitar('web', v_id, 'boton'));
end
$funcion$;

-- ¿Sigue dado de alta ESTE navegador (dirección y clave auth)? {"ok": true,
-- "activa", "vigente" (con la versión actual del texto), "servicio" (se
-- envía ahora)}. La web lo pregunta al abrir y renueva con el alta como
-- mucho cada 12 horas.
create or replace function public.aviso_sin_cuenta_web_activo(p_endpoint text, p_auth text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_auth text;
  v_version text;
  v_cfg record;
begin
  v_auth := rtrim(translate(coalesce(p_auth, ''), '+/', '-_'), '=');
  if p_endpoint is null or char_length(p_endpoint) > 2048 or v_auth !~ '^[A-Za-z0-9_-]{21}[AQgw]$' then
    raise exception using errcode = '22023', message = 'suscripción de notificaciones no válida';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion c where c.unica;
  select w.version into v_version from rwadar_novedades.sin_cuenta_web w
   where w.endpoint = p_endpoint and w.auth = v_auth;
  return jsonb_build_object('ok', true, 'activa', found,
    'vigente', found and v_version is not distinct from v_cfg.sin_cuenta_version,
    'servicio', coalesce(v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is not null
                         and v_cfg.push_habilitado and v_cfg.push_activado_el is not null
                         and v_cfg.webpush_clave_publica is not null, false));
end
$funcion$;

-- Alta (o renovación) de un móvil sin cuenta (app de Android). Las mismas
-- respuestas que la de la web, sin en_uso: el token de Expo es del móvil.
create or replace function public.alta_aviso_sin_cuenta_movil(
  p_token text, p_plataforma text, p_version text, p_idioma text, p_origen text
) returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_fila record;
  v_ref uuid;
begin
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$' then
    raise exception using errcode = '22023', message = 'token de notificaciones no válido';
  end if;
  if p_plataforma is distinct from 'android' then
    raise exception using errcode = '22023', message = 'plataforma no válida';
  end if;
  if p_version is null or p_version !~ '^[a-z0-9][a-z0-9.-]{2,79}$'
     or p_idioma is null or p_idioma not in ('es', 'en')
     or p_origen is null or p_origen not in ('novedades', 'perfil', 'avisos') then
    raise exception using errcode = '22023', message = 'versión, idioma u origen no válidos';
  end if;

  perform pg_advisory_xact_lock(20261114, 361);
  select * into v_cfg from rwadar_novedades.configuracion c where c.unica;
  if not coalesce(v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is not null
                  and v_cfg.push_habilitado and v_cfg.push_activado_el is not null
                  and v_cfg.webpush_clave_publica is not null, false) then
    return jsonb_build_object('ok', false, 'error', 'apagado');
  end if;
  if p_version is distinct from v_cfg.sin_cuenta_version then
    return jsonb_build_object('ok', false, 'error', 'version');
  end if;

  select m.id, m.ref, m.version into v_fila
    from rwadar_novedades.sin_cuenta_movil m where m.token = p_token for update;
  if found then
    update rwadar_novedades.sin_cuenta_movil
       set version = p_version, idioma = p_idioma, origen = p_origen, actualizado_el = now()
     where id = v_fila.id;
    if v_fila.version is distinct from p_version then
      insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo, version, idioma, origen)
      values (v_fila.ref, 'movil', 'alta', 'version', p_version, p_idioma, p_origen);
    end if;
    return jsonb_build_object('ok', true, 'estado', 'activa', 'nueva', false);
  end if;

  if (select count(*) from rwadar_novedades.historial_sin_cuenta h
       where h.canal = 'movil' and h.accion = 'alta' and h.motivo = 'nueva'
         and h.creado_el > now() - interval '1 hour') >= v_cfg.sin_cuenta_cupo_hora then
    return jsonb_build_object('ok', false, 'error', 'cupo');
  end if;
  if (select count(*) from rwadar_novedades.sin_cuenta_movil) >= v_cfg.sin_cuenta_maximo then
    return jsonb_build_object('ok', false, 'error', 'lleno');
  end if;
  insert into rwadar_novedades.sin_cuenta_movil (token, plataforma, version, idioma, origen)
  values (p_token, p_plataforma, p_version, p_idioma, p_origen)
  returning ref into v_ref;
  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo, version, idioma, origen)
  values (v_ref, 'movil', 'alta', 'nueva', p_version, p_idioma, p_origen);
  return jsonb_build_object('ok', true, 'estado', 'activa', 'nueva', true);
end
$funcion$;

-- Baja de un móvil sin cuenta. Funciona siempre. {"ok": true, "borrada"}.
create or replace function public.baja_aviso_sin_cuenta_movil(p_token text)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_id bigint;
begin
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$' then
    raise exception using errcode = '22023', message = 'token de notificaciones no válido';
  end if;
  select m.id into v_id from rwadar_novedades.sin_cuenta_movil m where m.token = p_token for update;
  if v_id is null then
    return jsonb_build_object('ok', true, 'borrada', false);
  end if;
  return jsonb_build_object('ok', true, 'borrada', rwadar_novedades.sin_cuenta_quitar('movil', v_id, 'boton'));
end
$funcion$;

-- ¿Sigue dado de alta ESTE móvil? Como aviso_sin_cuenta_web_activo.
create or replace function public.aviso_sin_cuenta_movil_activo(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_version text;
  v_cfg record;
begin
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$' then
    raise exception using errcode = '22023', message = 'token de notificaciones no válido';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion c where c.unica;
  select m.version into v_version from rwadar_novedades.sin_cuenta_movil m where m.token = p_token;
  return jsonb_build_object('ok', true, 'activa', found,
    'vigente', found and v_version is not distinct from v_cfg.sin_cuenta_version,
    'servicio', coalesce(v_cfg.sin_cuenta_activa and v_cfg.sin_cuenta_activada_el is not null
                         and v_cfg.push_habilitado and v_cfg.push_activado_el is not null
                         and v_cfg.webpush_clave_publica is not null, false));
end
$funcion$;

-- Los anuncios publicados de los últimos 90 días, del más nuevo al más
-- viejo, sin la bienvenida (es de las cuentas): lo que enseña la lista de
-- avisos sin sesión. Sin datos personales. Una lista JSON:
-- [{id, tipo, titulo, texto, enlace, creado_el}]; creado_el es la fecha en
-- que se publicó, como en mis_avisos_recientes (30).
create or replace function public.avisos_publicos(p_limite integer default 20)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
begin
  if p_limite is null or p_limite not between 1 and 50 then
    raise exception using errcode = '22023', message = 'el límite debe estar entre 1 y 50';
  end if;
  return coalesce((
    select jsonb_agg(x.aviso order by x.fecha desc, x.id desc)
      from (select a.id, coalesce(a.publicado_el, a.creado_el) as fecha,
                   jsonb_build_object('id', a.id::text, 'tipo', a.tipo, 'titulo', a.titulo,
                                      'texto', a.texto, 'enlace', a.enlace,
                                      'creado_el', coalesce(a.publicado_el, a.creado_el)) as aviso
              from rwadar_novedades.anuncios a
             where a.estado = 'publicado'
               and coalesce(a.publicado_el, a.creado_el) >= now() - interval '90 days'
             order by coalesce(a.publicado_el, a.creado_el) desc, a.id desc
             limit p_limite) x), '[]'::jsonb);
end
$funcion$;

-- ---------------------------------------------------------------------
-- 5 · Envío y lectura (desde procesar(), con el push encendido)
-- ---------------------------------------------------------------------
-- Notificaciones web sin cuenta: lo que toca ahora (anuncios publicados en
-- los últimos 7 días, después de encender el push, de activar sin cuenta y
-- del alta; con la versión vigente del texto; sin repetir; los reintentos a
-- sus 5 minutos, hasta 3 intentos), salvo si esa misma dirección está en una
-- cuenta que lo va a recibir. Ya marcados «enviando», se piden al servidor
-- de la web con webpush_encolar (33), con ids «e» y el número del envío de
-- esta tabla. Si algo falla (Vault, pg_net), procesar() deshace el bloque.
create or replace function rwadar_novedades.sin_cuenta_enviar_webpush(p_tanda integer default 200)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  r record;
  v_envio bigint;
  v_lote jsonb;
  v_peticiones jsonb;
  v_suscripcion bigint;
  v_total integer;
begin
  v_total := 0;
  if p_tanda is null or p_tanda not between 1 and 500 then
    raise exception using errcode = '22023', message = 'la tanda sin cuenta debe estar entre 1 y 500';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion c
   where c.unica and c.push_habilitado and c.push_activado_el is not null
     and c.sin_cuenta_activa and c.sin_cuenta_activada_el is not null
     and c.webpush_clave_publica is not null;
  if not found then
    return 0;
  end if;
  perform pg_advisory_xact_lock(20261114, 36);

  -- Un reintento de un anuncio de hace más de 7 días ya no sale.
  update rwadar_novedades.envios_sin_cuenta_web e
     set estado = 'descartado', actualizado_el = now()
    from rwadar_novedades.anuncios a
   where a.id = e.anuncio_id and e.estado = 'reintentar'
     and coalesce(a.publicado_el, a.creado_el) < now() - interval '7 days';

  v_lote := '[]'::jsonb;
  for r in
    select a.id as anuncio_id, a.tipo, a.titulo, a.texto, a.enlace,
           w.id as suscripcion_id, w.endpoint, w.p256dh, w.auth
      from rwadar_novedades.anuncios a
      join rwadar_novedades.sin_cuenta_web w
        on coalesce(a.publicado_el, a.creado_el) > w.creado_el
      left join rwadar_novedades.envios_sin_cuenta_web e
        on e.anuncio_id = a.id and e.suscripcion_id = w.id
     where a.estado = 'publicado'
       and coalesce(a.publicado_el, a.creado_el) >= now() - interval '7 days'
       and coalesce(a.publicado_el, a.creado_el) > v_cfg.push_activado_el
       and coalesce(a.publicado_el, a.creado_el) > v_cfg.sin_cuenta_activada_el
       and w.version = v_cfg.sin_cuenta_version
       and (e.id is null
            or (e.estado = 'reintentar' and e.intentos < 3
                and e.actualizado_el <= now() - interval '5 minutes'))
       -- No llegan dos: la cuenta con esa misma dirección ya lo recibe.
       and not exists (
             select 1 from rwadar_novedades.suscripciones_web s
               join rwadar_novedades.preferencias p on p.usuario_id = s.usuario_id
               join auth.users u on u.id = s.usuario_id
              where s.endpoint = w.endpoint
                and p.novedades and p.version = v_cfg.version_consentimiento
                and u.email_confirmed_at is not null and u.is_anonymous is not true
                and coalesce(a.publicado_el, a.creado_el) > s.creado_el)
     order by coalesce(a.publicado_el, a.creado_el), a.id, w.id
     limit p_tanda
  loop
    v_envio := null;
    insert into rwadar_novedades.envios_sin_cuenta_web as e (anuncio_id, suscripcion_id, estado, intentos)
    values (r.anuncio_id, r.suscripcion_id, 'enviando', 1)
    on conflict (anuncio_id, suscripcion_id) do update
      set estado = 'enviando', intentos = e.intentos + 1, codigo = null, actualizado_el = now()
      where e.estado = 'reintentar' and e.intentos < 3
    returning e.id into v_envio;
    if v_envio is not null then
      v_lote := v_lote || jsonb_build_array(jsonb_build_object(
        'id', 'e' || v_envio,
        'endpoint', r.endpoint,
        'p256dh', r.p256dh,
        'auth', r.auth,
        'carga', rwadar_novedades.webpush_carga(r.anuncio_id::text, r.titulo, r.texto,
                                                 rwadar_novedades.destino(r.tipo, r.enlace))));
    end if;
  end loop;
  if jsonb_array_length(v_lote) = 0 then
    return 0;
  end if;

  v_peticiones := rwadar_novedades.webpush_encolar(v_lote);
  for r in
    select substr(x.valor ->> 'id', 2)::bigint as id, (x.valor ->> 'peticion')::bigint as peticion
      from jsonb_array_elements(v_peticiones) as x(valor)
  loop
    if r.peticion is null then
      -- No se pudo pedir (no pasa con lo que sale de las tablas): fallido.
      update rwadar_novedades.envios_sin_cuenta_web
         set estado = 'fallido', codigo = -1, actualizado_el = now()
       where id = r.id
      returning suscripcion_id into v_suscripcion;
      perform rwadar_novedades.sin_cuenta_fallo('web', v_suscripcion);
    else
      update rwadar_novedades.envios_sin_cuenta_web
         set peticion_id = r.peticion, peticion_el = now()
       where id = r.id and estado = 'enviando';
      v_total := v_total + 1;
    end if;
  end loop;
  return v_total;
end
$funcion$;

-- Las respuestas del servidor de la web (como leer_webpush, 33): 200 con
-- {"codigo": n} → 2xx enviado; 404 o 410 borra el navegador (baja por el
-- servicio); 0, 429 o 5xx, a reintentar a los 5 minutos (al tercero,
-- fallido); -1 u otro código, fallido y cuenta un fallo (al tercero seguido,
-- fuera). Cualquier otra respuesta del servidor y una petición sin
-- respuesta a los 10 minutos: a reintentar, contando el intento. Devuelve
-- cuántos leyó.
create or replace function rwadar_novedades.sin_cuenta_leer_webpush()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_codigo integer;
  v_total integer;
begin
  perform pg_advisory_xact_lock(20261114, 36);
  v_total := 0;
  for r in
    select e.id, e.suscripcion_id, e.intentos, e.peticion_el,
           x.id as respuesta, x.status_code, x.content, x.error_msg
      from rwadar_novedades.envios_sin_cuenta_web e
      left join net._http_response x on x.id = e.peticion_id
     where e.estado = 'enviando' and e.peticion_id is not null
     order by e.id
     limit 500
     for update of e skip locked
  loop
    if r.respuesta is null or (r.status_code is null and r.error_msg is null) then
      if r.peticion_el >= now() - interval '10 minutes' then
        continue;
      end if;
      v_codigo := null;
    else
      v_codigo := rwadar_novedades.webpush_codigo(r.status_code, r.content);
    end if;
    if v_codigo between 200 and 299 then
      update rwadar_novedades.envios_sin_cuenta_web
         set estado = 'enviado', codigo = v_codigo, enviado_el = now(), actualizado_el = now(),
             peticion_id = null, peticion_el = null
       where id = r.id;
      update rwadar_novedades.sin_cuenta_web set fallos = 0 where id = r.suscripcion_id and fallos > 0;
    elsif v_codigo in (404, 410) then
      perform rwadar_novedades.sin_cuenta_quitar('web', r.suscripcion_id, 'servicio');
    elsif v_codigo is null or v_codigo in (0, 429) or v_codigo between 500 and 599 then
      update rwadar_novedades.envios_sin_cuenta_web
         set estado = case when intentos >= 3 then 'fallido' else 'reintentar' end,
             codigo = v_codigo, peticion_id = null, peticion_el = null, actualizado_el = now()
       where id = r.id;
    else
      update rwadar_novedades.envios_sin_cuenta_web
         set estado = 'fallido', codigo = v_codigo, peticion_id = null, peticion_el = null,
             actualizado_el = now()
       where id = r.id;
      perform rwadar_novedades.sin_cuenta_fallo('web', r.suscripcion_id);
    end if;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- Push de Expo sin cuenta: recibos pendientes y envíos nuevos, con las
-- mismas cabeceras que enviar_push, prioridad alta y el canal `novedades`
-- de Android; `data` solo con {tipo, destino}. Las mismas reglas que la web
-- (7 días, después del alta y de las dos activaciones, versión vigente, sin
-- repetir) y, si el token está en una cuenta que lo va a recibir, no sale.
-- Devuelve cuántas peticiones hizo (envíos y recibos).
create or replace function rwadar_novedades.sin_cuenta_enviar_push(p_tanda integer default 200)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_cabeceras jsonb;
  r record;
  v_push bigint;
  v_peticion bigint;
  v_total integer;
  v_tipo text;
begin
  v_total := 0;
  if p_tanda is null or p_tanda not between 1 and 500 then
    raise exception using errcode = '22023', message = 'la tanda sin cuenta debe estar entre 1 y 500';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion c
   where c.unica and c.push_habilitado and c.push_activado_el is not null
     and c.sin_cuenta_activa and c.sin_cuenta_activada_el is not null;
  if not found then
    return 0;
  end if;
  perform pg_advisory_xact_lock(20261114, 36);
  v_cabeceras := rwadar_novedades.sin_cuenta_expo_cabeceras();

  -- Peticiones sin respuesta a los 15 minutos: un envío vuelve a intentarse
  -- (contando el intento); una consulta de recibo vuelve a `ticket`.
  update rwadar_novedades.pushes_sin_cuenta s
     set estado = case when s.estado = 'consultando' then 'ticket'
                       when s.intentos >= 3 then 'fallido' else 'reintentar' end,
         terminado_el = case when s.estado = 'enviando' and s.intentos >= 3 then now() end,
         peticion_id = null, peticion_el = null, actualizado_el = now(),
         error = case when s.estado = 'consultando' then 'Sin respuesta de Expo al consultar el recibo'
                      else 'Sin respuesta de Expo al enviar' end
   where s.estado in ('enviando', 'consultando')
     and s.peticion_el < now() - interval '15 minutes'
     and not exists (select 1 from net._http_response x where x.id = s.peticion_id);
  -- Expo borra los recibos a las 24 horas.
  update rwadar_novedades.pushes_sin_cuenta
     set estado = 'fallido', terminado_el = now(), actualizado_el = now(), error = 'Recibo de Expo caducado'
   where estado = 'ticket' and ticket_el < now() - interval '24 hours';
  -- Un reintento de un anuncio de hace más de 7 días ya no sale.
  update rwadar_novedades.pushes_sin_cuenta s
     set estado = 'descartado', terminado_el = now(), actualizado_el = now()
    from rwadar_novedades.anuncios a
   where a.id = s.anuncio_id and s.estado = 'reintentar'
     and coalesce(a.publicado_el, a.creado_el) < now() - interval '7 days';

  -- Recibos de tickets aceptados hace al menos 15 minutos.
  for r in
    select s.id, s.ticket_id
      from rwadar_novedades.pushes_sin_cuenta s
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
    update rwadar_novedades.pushes_sin_cuenta
       set estado = 'consultando', peticion_id = v_peticion, peticion_el = now(),
           recibo_consultado_el = now(), actualizado_el = now(), error = null
     where id = r.id;
    v_total := v_total + 1;
  end loop;

  for r in
    select a.id as anuncio_id, a.tipo, a.titulo, a.texto, a.enlace, m.id as movil_id, m.token
      from rwadar_novedades.anuncios a
      join rwadar_novedades.sin_cuenta_movil m
        on coalesce(a.publicado_el, a.creado_el) > m.creado_el
      left join rwadar_novedades.pushes_sin_cuenta s
        on s.anuncio_id = a.id and s.movil_id = m.id
     where a.estado = 'publicado'
       and coalesce(a.publicado_el, a.creado_el) >= now() - interval '7 days'
       and coalesce(a.publicado_el, a.creado_el) > v_cfg.push_activado_el
       and coalesce(a.publicado_el, a.creado_el) > v_cfg.sin_cuenta_activada_el
       and m.version = v_cfg.sin_cuenta_version
       and (s.id is null
            or (s.estado = 'reintentar' and s.intentos < 3
                and s.actualizado_el <= now() - interval '5 minutes'))
       -- No llegan dos: ese móvil está en una cuenta con el permiso vigente
       -- desde antes de publicarse el anuncio (repartir() de la 30 se lo da).
       and not exists (
             select 1 from rwadar_novedades.dispositivos d
               join rwadar_novedades.preferencias p on p.usuario_id = d.usuario_id
               join auth.users u on u.id = d.usuario_id
              where d.token = m.token
                and p.novedades and p.version = v_cfg.version_consentimiento
                and u.email_confirmed_at is not null and u.is_anonymous is not true
                and coalesce(a.publicado_el, a.creado_el) > d.creado_el)
     order by coalesce(a.publicado_el, a.creado_el), a.id, m.id
     limit greatest(p_tanda - v_total, 0)
  loop
    v_push := null;
    insert into rwadar_novedades.pushes_sin_cuenta as s (anuncio_id, movil_id, estado, intentos)
    values (r.anuncio_id, r.movil_id, 'enviando', 1)
    on conflict (anuncio_id, movil_id) do update
      set estado = 'enviando', intentos = s.intentos + 1, error = null, actualizado_el = now()
      where s.estado = 'reintentar' and s.intentos < 3
    returning s.id into v_push;
    if v_push is null then
      continue;
    end if;
    v_tipo := r.tipo;
    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := v_cabeceras,
      body := jsonb_build_object(
        'to', r.token,
        'title', r.titulo,
        'body', r.texto,
        'sound', 'default',
        'priority', 'high',
        'channelId', 'novedades',
        'data', jsonb_build_object('tipo', v_tipo,
                                   'destino', rwadar_novedades.destino(v_tipo, r.enlace))),
      timeout_milliseconds := 10000
    ) into v_peticion;
    if v_peticion is null then
      raise exception using errcode = '55000', message = 'pg_net no devolvió identificador de petición';
    end if;
    update rwadar_novedades.pushes_sin_cuenta
       set peticion_id = v_peticion, peticion_el = now()
     where id = v_push;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- Respuestas de Expo (envíos y recibos). DeviceNotRegistered borra el móvil
-- (baja por el servicio); MismatchSenderId cuenta un fallo (al tercero
-- seguido, fuera); otro error es definitivo para ese aviso; una respuesta
-- ilegible o sin éxito, a reintentar (un recibo, a volver a consultar).
create or replace function rwadar_novedades.sin_cuenta_leer_push()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_total integer;
  v_lectura jsonb;
  v_estado text;
  v_error text;
  v_ticket text;
begin
  perform pg_advisory_xact_lock(20261114, 36);
  v_total := 0;
  for r in
    select s.id, s.movil_id, s.estado, s.intentos, s.ticket_id,
           x.status_code, x.content, x.error_msg
      from rwadar_novedades.pushes_sin_cuenta s
      join net._http_response x on x.id = s.peticion_id
     where s.estado in ('enviando', 'consultando')
     order by s.id
     for update of s skip locked
  loop
    if r.status_code is null and r.error_msg is null then
      continue;
    end if;
    v_lectura := null;
    if r.status_code between 200 and 299 then
      v_lectura := rwadar_novedades.sin_cuenta_expo_leer(r.content,
                     case when r.estado = 'consultando' then r.ticket_id end);
    end if;
    v_estado := v_lectura ->> 'status';
    v_error := v_lectura ->> 'error';
    v_ticket := v_lectura ->> 'id';

    if v_error = 'DeviceNotRegistered' then
      perform rwadar_novedades.sin_cuenta_quitar('movil', r.movil_id, 'servicio');
    elsif r.estado = 'enviando' then
      if v_estado = 'ok' and v_ticket is not null and char_length(v_ticket) <= 200 then
        update rwadar_novedades.pushes_sin_cuenta
           set estado = 'ticket', ticket_id = v_ticket, ticket_el = now(),
               peticion_id = null, peticion_el = null, actualizado_el = now(), error = null
         where id = r.id;
      elsif v_estado = 'error' and v_error is distinct from 'MessageRateExceeded' then
        update rwadar_novedades.pushes_sin_cuenta
           set estado = 'fallido', terminado_el = now(), peticion_id = null, peticion_el = null,
               actualizado_el = now(), error = left(coalesce(v_error, 'Error de Expo'), 160)
         where id = r.id;
        if v_error = 'MismatchSenderId' then
          perform rwadar_novedades.sin_cuenta_fallo('movil', r.movil_id);
        end if;
      else
        update rwadar_novedades.pushes_sin_cuenta
           set estado = case when r.intentos >= 3 then 'fallido' else 'reintentar' end,
               terminado_el = case when r.intentos >= 3 then now() end,
               peticion_id = null, peticion_el = null, actualizado_el = now(),
               error = left(coalesce(r.error_msg, v_error, v_estado,
                                     'HTTP ' || coalesce(r.status_code::text, '?')), 160)
         where id = r.id;
      end if;
    else
      if v_estado = 'ok' then
        update rwadar_novedades.pushes_sin_cuenta
           set estado = 'aceptado', terminado_el = now(), peticion_id = null, peticion_el = null,
               actualizado_el = now(), error = null
         where id = r.id;
        update rwadar_novedades.sin_cuenta_movil set fallos = 0 where id = r.movil_id and fallos > 0;
      elsif v_estado = 'error' then
        -- Un recibo negativo es definitivo: reenviar podría duplicar.
        update rwadar_novedades.pushes_sin_cuenta
           set estado = 'fallido', terminado_el = now(), peticion_id = null, peticion_el = null,
               actualizado_el = now(), error = left(coalesce(v_error, 'Error definitivo del recibo'), 160)
         where id = r.id;
        if v_error = 'MismatchSenderId' then
          perform rwadar_novedades.sin_cuenta_fallo('movil', r.movil_id);
        end if;
      else
        update rwadar_novedades.pushes_sin_cuenta
           set estado = 'ticket', peticion_id = null, peticion_el = null, actualizado_el = now(),
               error = case when r.status_code between 200 and 299 then 'Recibo pendiente'
                            else 'HTTP ' || coalesce(r.status_code::text, '?') end
         where id = r.id;
      end if;
    end if;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- Limpieza sin cuenta (sin red ni Vault), desde limpiar(): envíos y pushes
-- de hace más de 90 días; navegadores y móviles sin renovar en 180 días
-- (baja «caducada»); una ref sin fila ni baja apuntada recibe hoy su baja
-- (el plazo cuenta desde ahora); y fuera el historial de las refs dadas de
-- baja hace más de 3 años.
create or replace function rwadar_novedades.sin_cuenta_limpiar()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_total integer;
  v_filas integer;
begin
  perform pg_advisory_xact_lock(20261114, 36);
  delete from rwadar_novedades.envios_sin_cuenta_web where creado_el < now() - interval '90 days';
  get diagnostics v_total = row_count;
  delete from rwadar_novedades.pushes_sin_cuenta where creado_el < now() - interval '90 days';
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;

  with fuera as (
    delete from rwadar_novedades.sin_cuenta_web
     where actualizado_el < now() - interval '180 days' returning ref)
  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo)
  select ref, 'web', 'baja', 'caducada' from fuera;
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;
  with fuera as (
    delete from rwadar_novedades.sin_cuenta_movil
     where actualizado_el < now() - interval '180 days' returning ref)
  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo)
  select ref, 'movil', 'baja', 'caducada' from fuera;
  get diagnostics v_filas = row_count;
  v_total := v_total + v_filas;

  insert into rwadar_novedades.historial_sin_cuenta (ref, canal, accion, motivo)
  select distinct h.ref, h.canal, 'baja', 'caducada'
    from rwadar_novedades.historial_sin_cuenta h
   where not exists (select 1 from rwadar_novedades.historial_sin_cuenta b
                      where b.ref = h.ref and b.accion = 'baja')
     and not exists (select 1 from rwadar_novedades.sin_cuenta_web w where w.ref = h.ref)
     and not exists (select 1 from rwadar_novedades.sin_cuenta_movil m where m.ref = h.ref);

  delete from rwadar_novedades.historial_sin_cuenta h
   where exists (select 1 from rwadar_novedades.historial_sin_cuenta b
                  where b.ref = h.ref and b.accion = 'baja'
                    and b.creado_el < now() - interval '3 years')
     and not exists (select 1 from rwadar_novedades.sin_cuenta_web w where w.ref = h.ref)
     and not exists (select 1 from rwadar_novedades.sin_cuenta_movil m where m.ref = h.ref);
  get diagnostics v_filas = row_count;
  return v_total + v_filas;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 6 · procesar() y limpiar()
-- ---------------------------------------------------------------------
-- procesar(): la de la 33 letra por letra; solo añade, al final del bloque
-- del push (después de las notificaciones web de las cuentas), cuatro
-- bloques sin cuenta: lectura y envío de Expo y lectura y envío de la web.
-- Cada uno en su bloque: un fallo deshace solo el suyo. Reaplicar la 30 o la
-- 33 la devuelve a su versión: el verificador 36 lo detecta.
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
    -- Sin cuenta (36): con el mismo interruptor y además sin_cuenta_activa
    -- (lo miran sus funciones), su cerrojo y su tanda. Expo y después la
    -- web; en cada uno, primero lo que respondió y después lo nuevo.
    begin
      v_n := rwadar_novedades.sin_cuenta_leer_push();
      v_resultado := v_resultado || jsonb_build_object('sin_cuenta_push_leidos', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_sin_cuenta_lectura_push', sqlstate);
      raise warning 'rwadar_novedades: lectura de push sin cuenta omitida (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.sin_cuenta_enviar_push();
      v_resultado := v_resultado || jsonb_build_object('sin_cuenta_push_enviados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_sin_cuenta_envio_push', sqlstate);
      raise warning 'rwadar_novedades: envío de push sin cuenta omitido (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.sin_cuenta_leer_webpush();
      v_resultado := v_resultado || jsonb_build_object('sin_cuenta_webpush_leidos', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_sin_cuenta_lectura_webpush', sqlstate);
      raise warning 'rwadar_novedades: lectura de notificaciones web sin cuenta omitida (sqlstate %)', sqlstate;
    end;
    begin
      v_n := rwadar_novedades.sin_cuenta_enviar_webpush();
      v_resultado := v_resultado || jsonb_build_object('sin_cuenta_webpush_enviados', v_n);
    exception when others then
      v_resultado := v_resultado || jsonb_build_object('fallo_sin_cuenta_envio_webpush', sqlstate);
      raise warning 'rwadar_novedades: envío de notificaciones web sin cuenta omitido (sqlstate %)', sqlstate;
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

-- limpiar(): la de la 32 letra por letra más la limpieza sin cuenta al
-- final. El reloj diario `rwadar-novedades-limpieza` y procesar() la llaman:
-- los plazos sin cuenta (90 días, 180 días y 3 años) se cumplen aunque no se
-- envíe nada. Primero el cerrojo de la 30, después el de la 32 y el de la
-- 36. Reaplicar la 30 o la 32 la devuelve a su versión: el verificador 36 lo
-- detecta.
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
  -- Sin cuenta (36): sus plazos, los mismos cada día.
  v_total := v_total + rwadar_novedades.sin_cuenta_limpiar();
  return v_total;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 7 · La prueba (acción prueba-sin-cuenta)
-- ---------------------------------------------------------------------
-- «Prueba de RWAdar» a cada navegador y móvil sin cuenta, solo si hay 5 o
-- menos entre los dos (la dirección la manda tras activarlo en su iPhone y
-- en un Android, antes de que se apunte nadie más). No depende de los
-- interruptores y no guarda nada: devuelve [[petición, número, canal], …]
-- (canal 1 = web, por webpush_encolar; 2 = móvil, por Expo), solo números.
create or replace function rwadar_novedades.sin_cuenta_prueba()
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_web integer;
  v_movil integer;
  v_lote jsonb;
  v_lista jsonb;
  v_cabeceras jsonb;
  v_peticion bigint;
  r record;
begin
  select count(*) into v_web from rwadar_novedades.sin_cuenta_web;
  select count(*) into v_movil from rwadar_novedades.sin_cuenta_movil;
  if v_web + v_movil > 5 then
    raise exception using errcode = '55000',
      message = format('prueba sin cuenta: hay %s suscripciones sin cuenta y la prueba solo sale con 5 o menos', v_web + v_movil);
  end if;
  v_lista := '[]'::jsonb;
  if v_web > 0 then
    select jsonb_agg(jsonb_build_object(
             'id', 'p' || w.id, 'endpoint', w.endpoint, 'p256dh', w.p256dh, 'auth', w.auth,
             'carga', rwadar_novedades.webpush_carga('prueba', 'Prueba de RWAdar',
                        'Si ves esto, las notificaciones funcionan en este móvil.', 'inicio'))
           order by w.id)
      into v_lote from rwadar_novedades.sin_cuenta_web w;
    select coalesce(jsonb_agg(jsonb_build_array((x.valor ->> 'peticion')::bigint,
                                                substr(x.valor ->> 'id', 2)::bigint, 1) order by x.orden), '[]'::jsonb)
      into v_lista
      from jsonb_array_elements(rwadar_novedades.webpush_encolar(v_lote)) with ordinality as x(valor, orden)
     where x.valor ->> 'peticion' is not null;
  end if;
  if v_movil > 0 then
    v_cabeceras := rwadar_novedades.sin_cuenta_expo_cabeceras();
    for r in select m.id, m.token from rwadar_novedades.sin_cuenta_movil m order by m.id loop
      select net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := v_cabeceras,
        body := jsonb_build_object(
          'to', r.token,
          'title', 'Prueba de RWAdar',
          'body', 'Si ves esto, las notificaciones funcionan en este móvil.',
          'sound', 'default',
          'priority', 'high',
          'channelId', 'novedades',
          'data', jsonb_build_object('tipo', 'prueba', 'destino', 'inicio')),
        timeout_milliseconds := 10000
      ) into v_peticion;
      if v_peticion is null then
        raise exception using errcode = '55000', message = 'pg_net no devolvió identificador de petición';
      end if;
      v_lista := v_lista || jsonb_build_array(jsonb_build_array(v_peticion, r.id, 2));
    end loop;
  end if;
  return v_lista;
end
$funcion$;

-- Lo que respondió cada petición de la prueba, solo con cuentas y códigos,
-- como webpush_prueba_supabase_resultado (33): {envios, esperando,
-- enviados, caducadas, fallidos, servidor, codigos, codigos_servidor}. Web:
-- codigos = los de los servicios de push. Móvil: el estado HTTP de Expo
-- cuando aceptó el envío. 404/410 o DeviceNotRegistered borran esa
-- suscripción (baja por el servicio). Se puede llamar varias veces.
create or replace function rwadar_novedades.sin_cuenta_prueba_resultado(p jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_valido boolean;
  v_peticion bigint;
  v_numero bigint;
  v_canal integer;
  v_respuesta record;
  v_codigo integer;
  v_lectura jsonb;
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
  if jsonb_array_length(p) > 5 then
    raise exception using errcode = '22023', message = 'la prueba sin cuenta lleva como mucho 5 peticiones';
  end if;
  perform pg_advisory_xact_lock(20261114, 36);
  v_esperando := 0; v_enviados := 0; v_caducadas := 0; v_fallidos := 0; v_servidor := 0;
  v_codigos := '{}'::integer[];
  v_codigos_servidor := '{}'::integer[];
  for r in select x.valor from jsonb_array_elements(p) as x(valor) loop
    v_valido := jsonb_typeof(r.valor) = 'array';
    if v_valido then
      v_valido := jsonb_array_length(r.valor) = 3
        and jsonb_typeof(r.valor -> 0) = 'number' and jsonb_typeof(r.valor -> 1) = 'number'
        and jsonb_typeof(r.valor -> 2) = 'number';
    end if;
    if v_valido then
      v_valido := (r.valor ->> 0) ~ '^[1-9][0-9]{0,17}$' and (r.valor ->> 1) ~ '^[1-9][0-9]{0,17}$'
        and (r.valor ->> 2) in ('1', '2');
    end if;
    if not v_valido then
      raise exception using errcode = '22023', message = 'petición de prueba no válida';
    end if;
    v_peticion := (r.valor ->> 0)::bigint;
    v_numero := (r.valor ->> 1)::bigint;
    v_canal := (r.valor ->> 2)::integer;

    select x.status_code, x.content, x.error_msg into v_respuesta
      from net._http_response x where x.id = v_peticion;
    if not found or (v_respuesta.status_code is null and v_respuesta.error_msg is null) then
      v_esperando := v_esperando + 1;
      continue;
    end if;
    if v_canal = 1 then
      v_codigo := rwadar_novedades.webpush_codigo(v_respuesta.status_code, v_respuesta.content);
      if v_codigo is null then
        v_servidor := v_servidor + 1;
        v_codigos_servidor := v_codigos_servidor || coalesce(v_respuesta.status_code, 0);
      else
        v_codigos := v_codigos || v_codigo;
        if v_codigo between 200 and 299 then
          v_enviados := v_enviados + 1;
        elsif v_codigo in (404, 410) then
          perform rwadar_novedades.sin_cuenta_quitar('web', v_numero, 'servicio');
          v_caducadas := v_caducadas + 1;
        else
          v_fallidos := v_fallidos + 1;
        end if;
      end if;
    else
      if v_respuesta.status_code is null or v_respuesta.status_code not between 200 and 299 then
        v_servidor := v_servidor + 1;
        v_codigos_servidor := v_codigos_servidor || coalesce(v_respuesta.status_code, 0);
        continue;
      end if;
      v_lectura := rwadar_novedades.sin_cuenta_expo_leer(v_respuesta.content, null);
      v_codigos := v_codigos || v_respuesta.status_code;
      if v_lectura ->> 'error' = 'DeviceNotRegistered' then
        perform rwadar_novedades.sin_cuenta_quitar('movil', v_numero, 'servicio');
        v_caducadas := v_caducadas + 1;
      elsif v_lectura ->> 'status' = 'ok' then
        v_enviados := v_enviados + 1;
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
-- 8 · Permisos: nada para los clientes salvo la API sin cuenta
-- ---------------------------------------------------------------------
alter table rwadar_novedades.sin_cuenta_web enable row level security;
alter table rwadar_novedades.sin_cuenta_movil enable row level security;
alter table rwadar_novedades.envios_sin_cuenta_web enable row level security;
alter table rwadar_novedades.pushes_sin_cuenta enable row level security;
alter table rwadar_novedades.historial_sin_cuenta enable row level security;

-- Los mismos cierres de la 30, la 32 y la 33 para todo el esquema (también
-- lo nuevo, aunque los privilegios por defecto lo abrieran al crearlo).
revoke all on all tables in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;

revoke all on function public.avisos_sin_cuenta_texto() from public, anon, authenticated, service_role;
revoke all on function public.alta_aviso_sin_cuenta_web(text, text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.baja_aviso_sin_cuenta_web(text, text) from public, anon, authenticated, service_role;
revoke all on function public.aviso_sin_cuenta_web_activo(text, text) from public, anon, authenticated, service_role;
revoke all on function public.alta_aviso_sin_cuenta_movil(text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.baja_aviso_sin_cuenta_movil(text) from public, anon, authenticated, service_role;
revoke all on function public.aviso_sin_cuenta_movil_activo(text) from public, anon, authenticated, service_role;
revoke all on function public.avisos_publicos(integer) from public, anon, authenticated, service_role;

grant execute on function public.avisos_sin_cuenta_texto() to anon, authenticated;
grant execute on function public.alta_aviso_sin_cuenta_web(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.baja_aviso_sin_cuenta_web(text, text) to anon, authenticated;
grant execute on function public.aviso_sin_cuenta_web_activo(text, text) to anon, authenticated;
grant execute on function public.alta_aviso_sin_cuenta_movil(text, text, text, text, text) to anon, authenticated;
grant execute on function public.baja_aviso_sin_cuenta_movil(text) to anon, authenticated;
grant execute on function public.aviso_sin_cuenta_movil_activo(text) to anon, authenticated;
grant execute on function public.avisos_publicos(integer) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
