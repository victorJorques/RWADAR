-- =====================================================================
-- RWAdar 30 · avisos a registrados: bienvenida, novedades y ofertas
-- ---------------------------------------------------------------------
-- Contrato: docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md (versión 2).
-- PREPARADA Y PROBADA EN LOCAL; NO APLICADA. Aplicarla es tocar Supabase en
-- línea: solo con permiso expreso de Víctor, con una copia de seguridad
-- hecha antes y desde el SQL Editor. NUNCA con `supabase db push`, que
-- aplicaría también la 27 (comunidad), que nunca se ha aplicado.
--
-- Va después de 22; 24, 25 y las migraciones del catálogo; 26; el refuerzo
-- de sesión (supabase/migrations/20261011074218_…); 28 y 28_REVERTIR; 29.
-- Copia idéntica: supabase/migrations/20261105200000_avisos_registrados.sql.
--
-- Todo nace APAGADO: correo, push y el aviso automático de ofertas. Nada
-- sale hasta que Víctor da cada paso (30_avisos_registrados_activar_*.sql).
-- Reaplicar este archivo vuelve siempre al estado apagado y sin reloj, como
-- la 22: después hay que repetir la activación. No borra filas.
--
-- Por qué así:
--   · Esquema privado `rwadar_novedades`, sin `usage` para los clientes y
--     fuera de la API. Los `LIKE '%avisos_ciclo%'`/`'%push_soltar%'` de 22,
--     23, correo_fallo_cerrado y los verificadores no lo tocan: su reloj
--     solo llama a `rwadar_novedades.procesar()`.
--   · El permiso para los avisos es una casilla aparte y sin marcar (LSSI
--     art. 21, RGPD art. 7.4) con doble confirmación: solo cuenta cuando
--     `email_confirmed_at` pasa de vacío a una fecha y los metadatos del alta
--     traen `avisos_novedades` como booleano JSON `true` y la versión vigente.
--     Y solo con `casilla_activa` (nace false; la enciende
--     30_avisos_registrados_activar_casilla.sql junto con la plantilla de Auth):
--     antes, nadie puede apuntarse escribiendo los metadatos a mano.
--   · Los disparadores nunca tumban un alta, una confirmación ni la
--     aprobación del catálogo: capturan el error y dejan un `warning` con el
--     sqlstate, nunca el mensaje (podría llevar el correo).
--   · El catálogo no envía nada por su cuenta: una aprobación con ofertas
--     nuevas solo crea el anuncio del día, retenido salvo que Víctor encienda
--     `ofertas_automaticas`.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regprocedure('rwadar_cuentas_privadas.sesion_confirmada()') is null
     or to_regclass('auth.sessions') is null
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'auth' and table_name = 'users'
                       and column_name = 'is_anonymous') then
    raise exception using errcode = '55000',
      message = 'RWAdar 30: falta el refuerzo de sesión confirmada (20261011074218) o Auth actual';
  end if;
  if to_regprocedure('public.borrar_mi_cuenta()') is null
     or to_regclass('public.retencion_dispositivos_estado') is null
     or to_regclass('cron.job') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 30: falta el cierre 22 o pg_cron';
  end if;
  if to_regclass('rwadar_catalogo.revisiones') is null
     or to_regclass('rwadar_catalogo.ofertas') is null
     or to_regclass('rwadar_catalogo.publicacion_v2') is null
     or to_regprocedure('rwadar_catalogo.fijar_publicacion_v2()') is null
     or to_regclass('public.catalogo_publicacion') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 30: faltan 24 y las migraciones del catálogo V2';
  end if;
end
$precondiciones$;

create schema if not exists rwadar_novedades;
revoke all on schema rwadar_novedades from public, anon, authenticated, service_role;
comment on schema rwadar_novedades is
  'Avisos a registrados (30). Privado: sin usage para clientes ni exposición por REST.';

-- ---------------------------------------------------------------------
-- 1 · Tablas
-- ---------------------------------------------------------------------
create table if not exists rwadar_novedades.configuracion (
  unica                   boolean primary key default true check (unica),
  correo_habilitado       boolean not null default false,
  push_habilitado         boolean not null default false,
  ofertas_automaticas     boolean not null default false,
  -- Sin la casilla activa, los metadatos del alta no dan permiso.
  casilla_activa          boolean not null default false,
  correo_activado_el      timestamptz,
  push_activado_el        timestamptz,
  version_consentimiento  text not null,
  texto_consentimiento_es text not null,
  texto_consentimiento_en text not null,
  constraint correo_activado_con_fecha
    check (not correo_habilitado or correo_activado_el is not null),
  constraint push_activado_con_fecha
    check (not push_habilitado or push_activado_el is not null)
);

-- Una fila por cuenta. `novedades` es el permiso; la fila existe aunque sea
-- false, y entonces los metadatos del alta ya no se vuelven a leer.
create table if not exists rwadar_novedades.preferencias (
  usuario_id     uuid primary key references auth.users(id) on delete cascade,
  novedades      boolean not null default false,
  aceptado_el    timestamptz,
  version        text,
  origen         text constraint preferencia_origen_valido check (origen in ('alta', 'perfil')),
  canal          text constraint preferencia_canal_valido check (canal in ('web', 'app')),
  alta_el        timestamptz not null default now(),
  baja_token     uuid not null default gen_random_uuid() unique,
  baja_el        timestamptz,
  actualizado_el timestamptz not null default now(),
  -- Cuándo se encoló la bienvenida de cada canal. Con la marca puesta no se
  -- vuelve a encolar, aunque la limpieza ya haya borrado la fila de la cola.
  bienvenida_correo_el timestamptz,
  bienvenida_push_el   timestamptz,
  constraint permiso_documentado
    check (not novedades or (aceptado_el is not null and version is not null and origen is not null))
);

create table if not exists rwadar_novedades.anuncios (
  id                  bigint generated always as identity primary key,
  tipo                text not null
    constraint anuncio_tipo_valido check (tipo in ('ofertas', 'actualizacion', 'novedad')),
  clave               text not null unique
    constraint anuncio_clave_valida check (clave ~ '^[a-z0-9][a-z0-9:._-]{2,79}$'),
  estado              text not null default 'retenido'
    constraint anuncio_estado_valido check (estado in ('retenido', 'publicado')),
  titulo              text not null
    constraint anuncio_titulo_valido check (char_length(titulo) between 3 and 90
                                            and titulo !~ '[[:cntrl:]]'),
  texto               text not null
    constraint anuncio_texto_valido check (char_length(texto) between 3 and 400
                                           and texto !~ '[[:cntrl:]]'),
  enlace              text not null
    constraint anuncio_enlace_valido check (char_length(enlace) <= 200 and enlace ~
      '^https://rwadar\.pages\.dev(/[A-Za-z0-9._~%-]+)*/?([?#][A-Za-z0-9._~%=&-]*)?$'),
  revision_id         uuid,
  creado_el           timestamptz not null default now(),
  publicado_el        timestamptz,
  correo_repartido_el timestamptz,
  push_repartido_el   timestamptz,
  -- Filtro de palabras del contrato (§4). Se aplica también a la plantilla
  -- cerrada de ofertas, que no las usa: así ningún camino lo esquiva.
  constraint anuncio_sin_palabras_vetadas
    check ((titulo || ' ' || texto) !~* '(oportunidad|rentabilidad|garantiz|%)'),
  constraint anuncio_publicado_con_fecha
    check (estado <> 'publicado' or publicado_el is not null)
);
create index if not exists anuncios_publicados
  on rwadar_novedades.anuncios (publicado_el desc) where estado = 'publicado';

-- No reutiliza public.dispositivos (instalaciones antiguas), que sigue cerrada.
create table if not exists rwadar_novedades.dispositivos (
  token          text primary key
    constraint dispositivo_token_valido check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$'),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  plataforma     text not null
    constraint dispositivo_plataforma_valida check (plataforma in ('android', 'ios')),
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);
create index if not exists dispositivos_por_usuario
  on rwadar_novedades.dispositivos (usuario_id, actualizado_el);

-- Cola de correo. El correo NO se copia: se lee de auth.users justo antes de
-- enviar. `enviando` = petición en pg_net; `aceptado` = Brevo respondió 201
-- (aceptación del proveedor, no entrega en el buzón).
create table if not exists rwadar_novedades.correos (
  id                   bigint generated always as identity primary key,
  usuario_id           uuid not null references auth.users(id) on delete cascade,
  tipo                 text not null
    constraint correo_tipo_valido check (tipo in ('bienvenida', 'anuncio')),
  anuncio_id           bigint references rwadar_novedades.anuncios(id) on delete cascade,
  estado               text not null default 'pendiente'
    constraint correo_estado_valido check (estado in
      ('pendiente', 'enviando', 'aceptado', 'descartado', 'fallido', 'incierto')),
  intentos             smallint not null default 0
    constraint correo_intentos_validos check (intentos between 0 and 5),
  idempotencia         uuid unique,
  idempotencia_el      timestamptz,
  peticion_id          bigint,
  peticion_el          timestamptz,
  proveedor_mensaje_id text,
  error                text,
  creado_el            timestamptz not null default now(),
  terminado_el         timestamptz,
  constraint correo_anuncio_coherente check ((tipo = 'anuncio') = (anuncio_id is not null))
);
create unique index if not exists correos_una_bienvenida
  on rwadar_novedades.correos (usuario_id) where tipo = 'bienvenida';
create unique index if not exists correos_uno_por_anuncio
  on rwadar_novedades.correos (usuario_id, anuncio_id) where tipo = 'anuncio';
create index if not exists correos_por_enviar
  on rwadar_novedades.correos (creado_el, id) where estado = 'pendiente';

-- Cola de push. El token se borra al terminar (minimización). `ticket` =
-- Expo aceptó el envío; solo el recibo dice si FCM/APNs lo aceptaron.
create table if not exists rwadar_novedades.pushes (
  id                   bigint generated always as identity primary key,
  token                text,
  usuario_id           uuid not null references auth.users(id) on delete cascade,
  tipo                 text not null
    constraint push_tipo_valido check (tipo in ('bienvenida', 'anuncio')),
  anuncio_id           bigint references rwadar_novedades.anuncios(id) on delete cascade,
  estado               text not null default 'pendiente'
    constraint push_estado_valido check (estado in
      ('pendiente', 'enviando', 'ticket', 'consultando', 'aceptado', 'descartado', 'fallido')),
  intentos             smallint not null default 0
    constraint push_intentos_validos check (intentos between 0 and 5),
  peticion_id          bigint,
  peticion_el          timestamptz,
  ticket_id            text,
  ticket_el            timestamptz,
  recibo_consultado_el timestamptz,
  error                text,
  creado_el            timestamptz not null default now(),
  terminado_el         timestamptz,
  constraint push_anuncio_coherente check ((tipo = 'anuncio') = (anuncio_id is not null)),
  constraint push_token_solo_vivo
    check (estado in ('aceptado', 'descartado', 'fallido') or token is not null)
);
create unique index if not exists pushes_una_bienvenida
  on rwadar_novedades.pushes (usuario_id) where tipo = 'bienvenida';
create unique index if not exists pushes_uno_por_token_y_anuncio
  on rwadar_novedades.pushes (token, anuncio_id) where tipo = 'anuncio';
create unique index if not exists pushes_ticket_unico
  on rwadar_novedades.pushes (ticket_id) where ticket_id is not null;
create index if not exists pushes_por_enviar
  on rwadar_novedades.pushes (creado_el, id) where estado = 'pendiente';

-- Columnas añadidas tras la primera versión de la 30 (nunca aplicada): así
-- reaplicarla sobre esa versión también las crea.
alter table rwadar_novedades.configuracion
  add column if not exists casilla_activa boolean not null default false;
alter table rwadar_novedades.preferencias
  add column if not exists bienvenida_correo_el timestamptz,
  add column if not exists bienvenida_push_el timestamptz;

-- Reaplicar = estado seguro. Los textos de la casilla van con su versión:
-- cambiar una sola palabra obliga a crear una versión nueva.
insert into rwadar_novedades.configuracion as c
  (unica, correo_habilitado, push_habilitado, ofertas_automaticas, casilla_activa,
   correo_activado_el, push_activado_el,
   version_consentimiento, texto_consentimiento_es, texto_consentimiento_en)
values (true, false, false, false, false, null, null,
  'novedades-v1-2026-11-05',
  'Quiero recibir avisos de RWAdar por correo y, si los activo en mi móvil, como notificaciones: ofertas nuevas en el radar y novedades de la web y la app. Es opcional: la Academy se desbloquea igual. Puedes darte de baja en cada aviso o en Perfil. Más información en Privacidad.',
  'I want to receive RWAdar notices by email and, if I turn them on in my phone, as notifications: new offers on the radar and news about the website and the app. It''s optional: the Academy unlocks anyway. You can unsubscribe in every notice or in Profile. More information in Privacy.')
on conflict (unica) do update
  set correo_habilitado = false, push_habilitado = false, ofertas_automaticas = false,
      casilla_activa = false,
      correo_activado_el = null, push_activado_el = null,
      version_consentimiento = excluded.version_consentimiento,
      texto_consentimiento_es = excluded.texto_consentimiento_es,
      texto_consentimiento_en = excluded.texto_consentimiento_en;

-- Bienvenidas ya encoladas sin marca (colas anteriores a estas columnas):
-- la marca sale de la cola, para que la limpieza nunca haga repetirlas.
update rwadar_novedades.preferencias p
   set bienvenida_correo_el = c.creado_el
  from rwadar_novedades.correos c
 where c.usuario_id = p.usuario_id and c.tipo = 'bienvenida' and p.bienvenida_correo_el is null;
update rwadar_novedades.preferencias p
   set bienvenida_push_el = s.creado_el
  from rwadar_novedades.pushes s
 where s.usuario_id = p.usuario_id and s.tipo = 'bienvenida' and p.bienvenida_push_el is null;

-- ---------------------------------------------------------------------
-- 2 · Piezas internas: escapado, destino y textos de los correos
-- ---------------------------------------------------------------------
-- Primero &, para no volver a escapar las entidades (igual que 23).
create or replace function rwadar_novedades.html(p_texto text)
returns text
language sql immutable strict parallel safe security definer set search_path = ''
as $funcion$
  select replace(replace(replace(replace(replace(
           p_texto, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
$funcion$;

-- `data.destino` del push: solo inicio, buscar o academy (nunca un dato personal).
create or replace function rwadar_novedades.destino(p_tipo text, p_enlace text)
returns text
language sql immutable security definer set search_path = ''
as $funcion$
  select case
    when p_tipo = 'ofertas' then 'buscar'
    when p_tipo = 'bienvenida' then 'academy'
    when p_enlace like 'https://rwadar.pages.dev/academy%' then 'academy'
    else 'inicio'
  end
$funcion$;

-- Devuelve {asunto, html, texto}. Sin imágenes, sin píxel y sin enlaces de
-- seguimiento: los enlaces van directos a rwadar.pages.dev. Pie de cada aviso:
-- quién envía (con aviso legal y privacidad), por qué lo recibe y la baja
-- (enlace y mailto). Un anuncio sin baja nunca se construye.
create or replace function rwadar_novedades.correo_mensaje(
  p_tipo text, p_titulo text, p_texto text, p_enlace text,
  p_suscrito boolean, p_baja_token uuid
) returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_baja text;
  v_mailto text;
  v_asunto text;
  v_etiqueta text;
  v_cuerpo text;
  v_cuerpo_txt text;
  v_boton text;
  v_enlace text;
  v_cierre text;
  v_cierre_txt text;
  v_motivo text;
  v_pie text;
  v_pie_txt text;
  v_parrafo text;
begin
  v_parrafo := '<p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 18px">';
  v_mailto := 'mailto:RWAdar@protonmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';
  if coalesce(p_suscrito, false) and p_baja_token is not null then
    v_baja := 'https://rwadar.pages.dev/baja?t=' || p_baja_token::text;
  end if;

  if p_tipo = 'bienvenida' then
    v_asunto := 'Te damos la bienvenida a RWAdar';
    v_etiqueta := 'RWAdar · tu cuenta';
    v_enlace := 'https://rwadar.pages.dev/academy/';
    v_boton := 'Abrir la Academy';
    v_cuerpo := v_parrafo || 'Tu cuenta está confirmada y ya tienes gratis la RWAdar Academy: '
      || 'lecciones cortas para entender la tokenización de activos reales a tu ritmo.</p>';
    v_cuerpo_txt := 'Tu cuenta está confirmada y ya tienes gratis la RWAdar Academy: '
      || 'lecciones cortas para entender la tokenización de activos reales a tu ritmo.';
    if v_baja is not null then
      v_cuerpo := v_cuerpo || v_parrafo || 'Además, te has apuntado a los avisos de novedades: '
        || 'te escribiremos cuando haya ofertas nuevas en el radar o novedades en la web y la app. '
        || 'Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.</p>';
      v_cuerpo_txt := v_cuerpo_txt || E'\n\n' || 'Además, te has apuntado a los avisos de novedades: '
        || 'te escribiremos cuando haya ofertas nuevas en el radar o novedades en la web y la app. '
        || 'Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.';
    end if;
    v_cierre := v_parrafo || 'Si no creaste esta cuenta, <a href="mailto:RWAdar@protonmail.com" '
      || 'style="color:#0F7A57">escríbenos</a> o bórrala.</p>';
    v_cierre_txt := 'Si no creaste esta cuenta, escríbenos o bórrala: RWAdar@protonmail.com';
    v_motivo := 'Recibes este correo porque se ha confirmado una cuenta de RWAdar con esta dirección.';
  elsif p_tipo = 'anuncio' then
    if v_baja is null then
      raise exception using errcode = '22023',
        message = 'un anuncio solo se envía a quien está apuntado y con su enlace de baja';
    end if;
    v_asunto := p_titulo;
    v_etiqueta := 'RWAdar · aviso de novedades';
    v_enlace := p_enlace;
    v_boton := 'Ver en RWAdar';
    v_cuerpo := v_parrafo || rwadar_novedades.html(p_texto) || '</p>';
    v_cuerpo_txt := p_texto;
    v_cierre := '';
    v_cierre_txt := null;
    v_motivo := 'Recibes este aviso porque te apuntaste a los avisos de novedades de RWAdar.';
  else
    raise exception using errcode = '22023', message = 'tipo de correo no válido';
  end if;

  if v_enlace is null
     or v_enlace !~ '^https://rwadar\.pages\.dev(/[A-Za-z0-9._~%-]+)*/?([?#][A-Za-z0-9._~%=&-]*)?$' then
    raise exception using errcode = '22023', message = 'enlace fuera de rwadar.pages.dev';
  end if;

  v_pie := '<p style="margin:0 0 8px">Te escribe RWAdar, un radar independiente de plataformas de '
    || 'tokenización (<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a>'
    || ' · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>'
    || '<p style="margin:0 0 8px">' || v_motivo || '</p>';
  v_pie_txt := 'Te escribe RWAdar, un radar independiente de plataformas de tokenización.' || E'\n'
    || 'Aviso legal: https://rwadar.pages.dev/privacidad#aviso-legal' || E'\n'
    || 'Privacidad: https://rwadar.pages.dev/privacidad' || E'\n' || v_motivo;
  if v_baja is not null then
    v_pie := v_pie || '<p style="margin:0">Para darte de baja de los avisos: <a href="'
      || rwadar_novedades.html(v_baja) || '" style="color:#555">darme de baja</a>'
      || ' o escribe a <a href="' || rwadar_novedades.html(v_mailto)
      || '" style="color:#555">RWAdar@protonmail.com</a>. También puedes hacerlo en tu Perfil.</p>';
    v_pie_txt := v_pie_txt || E'\n' || 'Para darte de baja de los avisos: ' || v_baja
      || ' o escribe a RWAdar@protonmail.com. También puedes hacerlo en tu Perfil.';
  end if;

  return jsonb_build_object(
    'asunto', v_asunto,
    'html',
      '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">'
      || '<p style="font:600 13px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#0F7A57;margin:0 0 18px">'
      || rwadar_novedades.html(v_etiqueta) || '</p>'
      || '<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">'
      || rwadar_novedades.html(v_asunto) || '</h1>'
      || v_cuerpo
      || '<p style="margin:0 0 26px"><a href="' || rwadar_novedades.html(v_enlace)
      || '" style="background:#25E39A;color:#06231A;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:99px;display:inline-block">'
      || rwadar_novedades.html(v_boton) || '</a></p>'
      || v_cierre
      || '<div style="font-size:12px;line-height:1.55;color:#666;border-top:1px solid #e5e5e5;padding-top:16px;margin-top:8px">'
      || v_pie || '</div></div>',
    'texto',
      v_asunto || E'\n\n' || v_cuerpo_txt || E'\n\n' || v_boton || ': ' || v_enlace
      || coalesce(E'\n\n' || v_cierre_txt, '') || E'\n\n--\n' || v_pie_txt
  );
end
$funcion$;

-- ---------------------------------------------------------------------
-- 3 · Disparador de Auth: preferencias, permiso y bienvenida
-- ---------------------------------------------------------------------
-- after insert or update of email_confirmed_at on auth.users. Solo actúa si
-- el correo pasa de vacío a fecha (o la cuenta nace confirmada) y la cuenta
-- no es anónima. El permiso, solo en el UPDATE, con la casilla activa
-- (`casilla_activa`), booleano JSON estricto y la versión vigente. Nada de
-- conversiones en `declare`: todo error queda dentro de los bloques y nunca
-- impide el alta ni la confirmación.
create or replace function rwadar_novedades.al_confirmar_cuenta()
returns trigger
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_version text;
  v_correo boolean;
  v_casilla boolean;
  v_meta jsonb;
  v_permiso boolean;
  v_canal text;
begin
  begin
    if new.email_confirmed_at is null or new.is_anonymous is true then
      return null;
    end if;
    if tg_op = 'UPDATE' then
      if old.email_confirmed_at is not null then
        return null;
      end if;
    end if;

    select c.version_consentimiento, c.correo_habilitado and c.correo_activado_el is not null,
           c.casilla_activa
      into v_version, v_correo, v_casilla
      from rwadar_novedades.configuracion c
     where c.unica;

    v_permiso := false;
    -- Sin la casilla activa (plantilla de Auth puesta, paso 4 de la
    -- activación), los metadatos ni se leen.
    if tg_op = 'UPDATE' and v_version is not null and v_casilla is true then
      v_meta := new.raw_user_meta_data;
      if jsonb_typeof(v_meta) = 'object'
         and jsonb_typeof(v_meta -> 'avisos_novedades') = 'boolean'
         and (v_meta -> 'avisos_novedades') = 'true'::jsonb
         and jsonb_typeof(v_meta -> 'avisos_version') = 'string'
         and (v_meta ->> 'avisos_version') = v_version then
        v_permiso := true;
        if jsonb_typeof(v_meta -> 'avisos_canal') = 'string'
           and (v_meta ->> 'avisos_canal') in ('web', 'app') then
          v_canal := v_meta ->> 'avisos_canal';
        end if;
      end if;
    end if;

    -- Si ya hay preferencias no se toca nada: una baja no se deshace.
    insert into rwadar_novedades.preferencias
      (usuario_id, novedades, aceptado_el, version, origen, canal, alta_el)
    values (new.id, v_permiso,
            case when v_permiso then now() end,
            case when v_permiso then v_version end,
            case when v_permiso then 'alta' end,
            v_canal,
            coalesce(new.email_confirmed_at, now()))
    on conflict (usuario_id) do nothing;
  exception when others then
    raise warning 'rwadar_novedades: confirmación sin preferencias (sqlstate %)', sqlstate;
  end;

  begin
    -- Una sola vez por cuenta: la marca de preferencias manda, también
    -- cuando la limpieza ya borró la fila terminada de la cola. Sin fila de
    -- preferencias (avería del bloque anterior) no se encola.
    if v_correo then
      update rwadar_novedades.preferencias
         set bienvenida_correo_el = now()
       where usuario_id = new.id and bienvenida_correo_el is null;
      if found then
        insert into rwadar_novedades.correos (usuario_id, tipo)
        values (new.id, 'bienvenida')
        on conflict do nothing;
      end if;
    end if;
  exception when others then
    raise warning 'rwadar_novedades: bienvenida no encolada (sqlstate %)', sqlstate;
  end;
  return null;
end
$funcion$;

drop trigger if exists rwadar_novedades_confirmacion on auth.users;
create trigger rwadar_novedades_confirmacion
  after insert or update of email_confirmed_at on auth.users
  for each row execute function rwadar_novedades.al_confirmar_cuenta();

-- ---------------------------------------------------------------------
-- 4 · Disparador del catálogo: solo crea el anuncio del día
-- ---------------------------------------------------------------------
-- `avisar_ofertas_nuevas` va antes que `fijar_publicacion_v2` en orden
-- alfabético, así que todavía ve el puntero viejo. Compara los slug de la
-- revisión V2 recién aprobada con los de la publicada. Sin puntero o sin
-- altas, no hace nada. Con altas, un anuncio por día (`ofertas:AAAA-MM-DD`),
-- retenido salvo `ofertas_automaticas`. NO reparte nada.
create or replace function rwadar_novedades.avisar_ofertas_nuevas()
returns trigger
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_anterior uuid;
  v_altas integer;
  v_automaticas boolean;
begin
  begin
    if new.estado::text <> 'aprobada' or old.estado::text = 'aprobada'
       or new.version_esquema <> 2 then
      return null;
    end if;
    select p.revision_id into v_anterior
      from rwadar_catalogo.publicacion_v2 p where p.unica;
    if v_anterior is null or v_anterior = new.id then
      return null;
    end if;
    -- Solo si esta aprobación pasa a ser la publicada (mismo orden que
    -- fijar_publicacion_v2); una revisión vieja reaprobada no se anuncia.
    if exists (select 1 from rwadar_catalogo.revisiones r
                where r.version_esquema = 2 and r.estado = 'aprobada' and r.id <> new.id
                  and (r.aprobada_el, r.creada_el, r.id) > (new.aprobada_el, new.creada_el, new.id)) then
      return null;
    end if;
    select count(*) into v_altas
      from (select o.slug from rwadar_catalogo.ofertas o where o.revision_id = new.id
            except
            select o.slug from rwadar_catalogo.ofertas o where o.revision_id = v_anterior) altas;
    if coalesce(v_altas, 0) = 0 then
      return null;
    end if;
    select c.ofertas_automaticas into v_automaticas
      from rwadar_novedades.configuracion c where c.unica;
    v_automaticas := coalesce(v_automaticas, false);

    -- Plantilla cerrada: no nombra productos ni emisores, sin «oportunidad»
    -- ni cifras económicas, con el aviso fijo.
    insert into rwadar_novedades.anuncios
      (tipo, clave, estado, titulo, texto, enlace, revision_id, publicado_el)
    values ('ofertas',
            'ofertas:' || to_char(current_date, 'YYYY-MM-DD'),
            case when v_automaticas then 'publicado' else 'retenido' end,
            case when v_altas = 1 then '1 ficha nueva en el radar de RWAdar'
                 else v_altas::text || ' fichas nuevas en el radar de RWAdar' end,
            'Consulta en el radar qué ha entrado y con qué fuentes. RWAdar no intermedia ni '
              || 'recomienda. Aparecer en el radar no es un respaldo y se puede perder lo '
              || 'invertido. Nadie paga por aparecer en este aviso.',
            'https://rwadar.pages.dev/#emisiones',
            new.id,
            case when v_automaticas then now() end)
    on conflict (clave) do nothing;
  exception when others then
    raise warning 'rwadar_novedades: anuncio de ofertas no creado (sqlstate %)', sqlstate;
  end;
  return null;
end
$funcion$;

drop trigger if exists avisar_ofertas_nuevas on rwadar_catalogo.revisiones;
create trigger avisar_ofertas_nuevas
  after update of estado on rwadar_catalogo.revisiones
  for each row execute function rwadar_novedades.avisar_ofertas_nuevas();

-- ---------------------------------------------------------------------
-- 5 · Anuncios a mano (solo el propietario de la base, desde «Avisar novedad»)
-- ---------------------------------------------------------------------
create or replace function rwadar_novedades.anunciar(
  p_tipo text, p_clave text, p_titulo text, p_texto text, p_enlace text
) returns bigint
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_id bigint;
begin
  -- Las ofertas solo las anuncia el catálogo, con su plantilla cerrada.
  if p_tipo is null or p_tipo not in ('actualizacion', 'novedad') then
    raise exception using errcode = '22023',
      message = 'tipo de anuncio no válido: solo actualizacion o novedad';
  end if;
  if exists (select 1 from rwadar_novedades.anuncios a where a.clave = p_clave) then
    raise exception using errcode = '23505',
      message = 'ya existe un anuncio con esa clave: no se repite';
  end if;
  insert into rwadar_novedades.anuncios (tipo, clave, estado, titulo, texto, enlace, publicado_el)
  values (p_tipo, p_clave, 'publicado', btrim(p_titulo), btrim(p_texto), btrim(p_enlace), now())
  returning id into v_id;
  return v_id;
end
$funcion$;

create or replace function rwadar_novedades.publicar_anuncio(p_id bigint)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
begin
  update rwadar_novedades.anuncios
     set estado = 'publicado', publicado_el = now()
   where id = p_id and estado = 'retenido';
  if found then
    return true;
  end if;
  if not exists (select 1 from rwadar_novedades.anuncios a where a.id = p_id) then
    raise exception using errcode = 'P0002', message = 'no existe ese anuncio';
  end if;
  return false;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 6 · Reparto, envío y recogida (lo llama solo el reloj rwadar-novedades)
-- ---------------------------------------------------------------------
-- Cuentas confirmadas sin preferencias (p. ej., si el disparador falló):
-- se rellenan con novedades = false. Nunca se apunta a nadie.
create or replace function rwadar_novedades.rellenar()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_total integer;
begin
  insert into rwadar_novedades.preferencias (usuario_id, novedades, alta_el)
  select u.id, false, coalesce(u.email_confirmed_at, now())
    from auth.users u
   where u.email_confirmed_at is not null and u.is_anonymous is not true
  on conflict (usuario_id) do nothing;
  get diagnostics v_total = row_count;
  return v_total;
end
$funcion$;

-- Reparte los anuncios publicados y no repartidos cuya publicación es
-- posterior a la activación de cada canal, a las cuentas confirmadas con
-- permiso vigente. Cuenta la fecha de publicación, no la de creación: un
-- retenido creado antes de activar y publicado después también sale.
create or replace function rwadar_novedades.repartir()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_anuncio record;
  v_filas integer;
  v_total integer;
begin
  v_total := 0;
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if not found then
    return 0;
  end if;

  if v_cfg.correo_habilitado and v_cfg.correo_activado_el is not null then
    for v_anuncio in
      select a.id from rwadar_novedades.anuncios a
       where a.estado = 'publicado' and a.correo_repartido_el is null
         and coalesce(a.publicado_el, a.creado_el) > v_cfg.correo_activado_el
       order by a.id
       for update skip locked
    loop
      insert into rwadar_novedades.correos (usuario_id, tipo, anuncio_id)
      select p.usuario_id, 'anuncio', v_anuncio.id
        from rwadar_novedades.preferencias p
        join auth.users u on u.id = p.usuario_id
       where p.novedades and p.version = v_cfg.version_consentimiento
         and u.email_confirmed_at is not null and u.is_anonymous is not true
      on conflict do nothing;
      get diagnostics v_filas = row_count;
      v_total := v_total + v_filas;
      update rwadar_novedades.anuncios set correo_repartido_el = now() where id = v_anuncio.id;
    end loop;
  end if;

  if v_cfg.push_habilitado and v_cfg.push_activado_el is not null then
    for v_anuncio in
      select a.id from rwadar_novedades.anuncios a
       where a.estado = 'publicado' and a.push_repartido_el is null
         and coalesce(a.publicado_el, a.creado_el) > v_cfg.push_activado_el
       order by a.id
       for update skip locked
    loop
      insert into rwadar_novedades.pushes (token, usuario_id, tipo, anuncio_id)
      select d.token, d.usuario_id, 'anuncio', v_anuncio.id
        from rwadar_novedades.dispositivos d
        join rwadar_novedades.preferencias p on p.usuario_id = d.usuario_id
        join auth.users u on u.id = d.usuario_id
       where p.novedades and p.version = v_cfg.version_consentimiento
         and u.email_confirmed_at is not null and u.is_anonymous is not true
      on conflict do nothing;
      get diagnostics v_filas = row_count;
      v_total := v_total + v_filas;
      update rwadar_novedades.anuncios set push_repartido_el = now() where id = v_anuncio.id;
    end loop;
  end if;
  return v_total;
end
$funcion$;

-- Fase 1 del correo: lee las respuestas de Brevo que ya devolvió pg_net.
create or replace function rwadar_novedades.leer_correos()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_codigo text;
  v_mensaje_id text;
  v_total integer;
begin
  v_total := 0;
  for r in
    select c.id, c.intentos, x.status_code, x.content, x.error_msg
      from rwadar_novedades.correos c
      join net._http_response x on x.id = c.peticion_id
     where c.estado = 'enviando'
     for update of c skip locked
  loop
    v_codigo := null;
    v_mensaje_id := null;
    begin
      v_codigo := r.content::jsonb ->> 'code';
      v_mensaje_id := nullif(btrim(r.content::jsonb ->> 'messageId'), '');
    exception when others then
      v_codigo := null;
      v_mensaje_id := null;
    end;

    -- Un 400 con código de duplicado = Brevo ya tiene ese envío (misma clave
    -- idempotente). Acepta los dos nombres que usa Brevo. El nombre exacto de
    -- la cabecera de idempotencia, este código y si `List-Unsubscribe` llega
    -- al buzón se confirman en la prueba real del paso 5 de la activación.
    if (r.status_code = 201 and v_mensaje_id is not null)
       or (r.status_code = 400 and v_codigo in ('duplicate_parameter', 'duplicate_request')) then
      update rwadar_novedades.correos
         set estado = 'aceptado', terminado_el = now(), peticion_id = null, peticion_el = null,
             proveedor_mensaje_id = coalesce(proveedor_mensaje_id, v_mensaje_id), error = null
       where id = r.id;
    elsif r.status_code between 400 and 499 and r.status_code not in (408, 429) then
      -- Credenciales, carga o permisos no se arreglan repitiendo.
      update rwadar_novedades.correos
         set estado = 'fallido', terminado_el = now(), peticion_id = null, peticion_el = null,
             error = 'Brevo rechazó la petición (HTTP ' || r.status_code::text || ')'
       where id = r.id;
    else
      update rwadar_novedades.correos
         set estado = case when r.intentos >= 5 then 'fallido' else 'pendiente' end,
             terminado_el = case when r.intentos >= 5 then now() end,
             peticion_id = null, peticion_el = null,
             error = coalesce(nullif(left(r.error_msg, 160), ''),
                              'Brevo HTTP ' || coalesce(r.status_code::text, '?'))
       where id = r.id;
    end if;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- Fase 2 del correo: vuelve a comprobar el permiso y envía con Brevo.
create or replace function rwadar_novedades.enviar_correos(p_tanda integer default 20)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_clave text;
  v_remitente text;
  v_total integer;
  r record;
  v_suscrito boolean;
  v_mensaje jsonb;
  v_cabeceras jsonb;
  v_idempotencia uuid;
  v_idempotencia_el timestamptz;
  v_peticion bigint;
begin
  v_total := 0;
  if p_tanda is null or p_tanda not between 1 and 100 then
    raise exception using errcode = '22023', message = 'la tanda de correo debe estar entre 1 y 100';
  end if;
  select * into v_cfg from rwadar_novedades.configuracion
   where unica and correo_habilitado and correo_activado_el is not null;
  if not found then
    return 0;
  end if;

  select max(s.decrypted_secret) filter (where s.name = 'BREVO_API_KEY'),
         max(s.decrypted_secret) filter (where s.name = 'RWADAR_REMITENTE')
    into v_clave, v_remitente
    from vault.decrypted_secrets s
   where s.name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
  if length(btrim(coalesce(v_clave, ''))) < 20
     or btrim(coalesce(v_remitente, '')) !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'correo bloqueado: credenciales de Brevo ausentes o no válidas en Vault';
  end if;

  -- Igual que 23: sin respuesta en 10 minutos vuelve a cola con la MISMA
  -- clave idempotente; a los 25 minutos del primer envío, «entrega incierta»
  -- para revisar a mano, nunca un segundo envío fuera de la deduplicación.
  update rwadar_novedades.correos c
     set estado = 'incierto', terminado_el = now(), peticion_id = null, peticion_el = null,
         error = 'Entrega incierta: revisar Brevo, no reenviar automáticamente'
   where c.estado = 'enviando' and c.idempotencia_el <= now() - interval '25 minutes'
     and not exists (select 1 from net._http_response x where x.id = c.peticion_id);
  update rwadar_novedades.correos c
     set estado = 'pendiente', peticion_id = null, peticion_el = null,
         error = 'Respuesta del proveedor agotada'
   where c.estado = 'enviando' and c.peticion_el < now() - interval '10 minutes'
     and c.idempotencia_el > now() - interval '25 minutes'
     and not exists (select 1 from net._http_response x where x.id = c.peticion_id);
  update rwadar_novedades.correos
     set estado = 'incierto', terminado_el = now(),
         error = 'Entrega incierta: revisar Brevo, no reenviar automáticamente'
   where estado = 'pendiente' and idempotencia_el <= now() - interval '25 minutes';

  -- Lo encolado con el correo apagado nunca sale de golpe al activarlo.
  update rwadar_novedades.correos
     set estado = 'descartado', terminado_el = now(),
         error = 'No enviado: anterior a la activación del correo'
   where estado = 'pendiente' and creado_el < v_cfg.correo_activado_el;

  -- Segunda comprobación, justo antes de enviar: cuenta confirmada, no
  -- anónima y con correo; para un anuncio, además, permiso vigente.
  update rwadar_novedades.correos c
     set estado = 'descartado', terminado_el = now(),
         error = 'No enviado: sin permiso vigente o cuenta sin confirmar'
   where c.estado = 'pendiente'
     and (not exists (select 1 from auth.users u
                       where u.id = c.usuario_id and u.email_confirmed_at is not null
                         and u.is_anonymous is not true and nullif(btrim(u.email), '') is not null)
          or (c.tipo = 'anuncio' and not exists (
                select 1 from rwadar_novedades.preferencias p
                  join rwadar_novedades.anuncios a on a.id = c.anuncio_id
                 where p.usuario_id = c.usuario_id and p.novedades
                   and p.version = v_cfg.version_consentimiento and a.estado = 'publicado')));

  for r in
    select c.id, c.tipo, c.idempotencia, c.idempotencia_el, u.email,
           a.titulo, a.texto, a.enlace,
           coalesce(p.novedades and p.version = v_cfg.version_consentimiento, false) as suscrito,
           p.baja_token
      from rwadar_novedades.correos c
      join auth.users u on u.id = c.usuario_id
      left join rwadar_novedades.preferencias p on p.usuario_id = c.usuario_id
      left join rwadar_novedades.anuncios a on a.id = c.anuncio_id
     where c.estado = 'pendiente'
       and c.creado_el >= v_cfg.correo_activado_el
       and (c.idempotencia_el is null or c.idempotencia_el > now() - interval '25 minutes')
       and u.email_confirmed_at is not null and u.is_anonymous is not true
       and nullif(btrim(u.email), '') is not null
       and (c.tipo = 'bienvenida'
            or (a.estado = 'publicado' and p.novedades and p.version = v_cfg.version_consentimiento))
     order by c.creado_el, c.id
     limit p_tanda
     for update of c skip locked
  loop
    v_suscrito := r.suscrito and r.baja_token is not null;
    v_mensaje := rwadar_novedades.correo_mensaje(r.tipo, r.titulo, r.texto, r.enlace,
                                                 v_suscrito, r.baja_token);
    v_idempotencia := coalesce(r.idempotencia, gen_random_uuid());
    v_idempotencia_el := coalesce(r.idempotencia_el, clock_timestamp());
    update rwadar_novedades.correos
       set idempotencia = v_idempotencia, idempotencia_el = v_idempotencia_el
     where id = r.id;

    -- Pendiente de la prueba real del paso 5 (correo propio): que Brevo
    -- deduplique con esta cabecera tal como se llama aquí y que
    -- `List-Unsubscribe` llegue al buzón. Si no, se corrige antes de seguir.
    v_cabeceras := jsonb_build_object('Idempotency-Key', v_idempotencia::text);
    -- List-Unsubscribe solo si la persona está apuntada. Sin
    -- List-Unsubscribe-Post: no se promete la baja «en un clic».
    if v_suscrito then
      v_cabeceras := v_cabeceras || jsonb_build_object('List-Unsubscribe',
        '<https://rwadar.pages.dev/baja?t=' || r.baja_token::text || '>, '
        || '<mailto:RWAdar@protonmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar>');
    end if;

    select net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', btrim(v_clave),
                                    'content-type', 'application/json',
                                    'accept', 'application/json'),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'RWAdar', 'email', btrim(v_remitente)),
        'replyTo', jsonb_build_object('name', 'RWAdar', 'email', 'RWAdar@protonmail.com'),
        'to', jsonb_build_array(jsonb_build_object(
          'email', btrim(r.email), 'contactPixelTrackingConsent', false)),
        'headers', v_cabeceras,
        'subject', v_mensaje ->> 'asunto',
        'htmlContent', v_mensaje ->> 'html',
        'textContent', v_mensaje ->> 'texto'),
      timeout_milliseconds := 10000
    ) into v_peticion;
    if v_peticion is null then
      raise exception using errcode = '55000', message = 'pg_net no devolvió identificador de petición';
    end if;
    update rwadar_novedades.correos
       set estado = 'enviando', peticion_id = v_peticion, peticion_el = now(),
           intentos = intentos + 1, error = null
     where id = r.id;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- Fase 1 del push: tickets de envío y recibos de Expo.
create or replace function rwadar_novedades.leer_push()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
  v_total integer;
  v_carga jsonb;
  v_resultado jsonb;
  v_estado text;
  v_error text;
  v_ticket text;
begin
  v_total := 0;
  for r in
    select s.id, s.token, s.estado, s.intentos, s.ticket_id,
           x.status_code, x.content, x.error_msg
      from rwadar_novedades.pushes s
      join net._http_response x on x.id = s.peticion_id
     where s.estado in ('enviando', 'consultando')
     for update of s skip locked
  loop
    if r.status_code is null and r.error_msg is null then
      continue;
    end if;
    v_carga := null;
    v_resultado := null;
    v_estado := null;
    v_error := null;
    v_ticket := null;
    if r.status_code between 200 and 299 then
      begin
        v_carga := r.content::jsonb;
        if r.estado = 'enviando' then
          -- Expo admite para un destinatario tanto objeto como array de uno.
          v_resultado := case jsonb_typeof(v_carga -> 'data')
            when 'array' then v_carga -> 'data' -> 0 else v_carga -> 'data' end;
        else
          v_resultado := v_carga -> 'data' -> r.ticket_id;
        end if;
        v_estado := v_resultado ->> 'status';
        v_error := v_resultado -> 'details' ->> 'error';
        v_ticket := v_resultado ->> 'id';
      exception when others then
        v_estado := null;
      end;
    end if;

    if v_error = 'DeviceNotRegistered' then
      update rwadar_novedades.pushes
         set estado = 'fallido', token = null, terminado_el = now(),
             peticion_id = null, peticion_el = null, error = 'DeviceNotRegistered'
       where id = r.id;
      -- El móvil ya no existe: se borra el token (y lo pendiente para él se
      -- descarta en la segunda comprobación).
      delete from rwadar_novedades.dispositivos where token = r.token;
    elsif r.estado = 'enviando' then
      if v_estado = 'ok' and v_ticket is not null then
        update rwadar_novedades.pushes
           set estado = 'ticket', ticket_id = v_ticket, ticket_el = now(),
               peticion_id = null, peticion_el = null, error = null
         where id = r.id;
      else
        update rwadar_novedades.pushes
           set estado = case when r.intentos >= 5 then 'fallido' else 'pendiente' end,
               token = case when r.intentos >= 5 then null else token end,
               terminado_el = case when r.intentos >= 5 then now() end,
               peticion_id = null, peticion_el = null,
               error = left(coalesce(r.error_msg, v_error, v_estado,
                                     v_carga -> 'errors' -> 0 ->> 'code',
                                     'HTTP ' || coalesce(r.status_code::text, '?')), 160)
         where id = r.id;
      end if;
    else
      if v_estado = 'ok' then
        update rwadar_novedades.pushes
           set estado = 'aceptado', token = null, terminado_el = now(),
               peticion_id = null, peticion_el = null, error = null
         where id = r.id;
      elsif v_estado = 'error' then
        -- Un recibo negativo es definitivo: reenviar podría duplicar.
        update rwadar_novedades.pushes
           set estado = 'fallido', token = null, terminado_el = now(),
               peticion_id = null, peticion_el = null,
               error = left(coalesce(v_error, 'Error definitivo del recibo'), 160)
         where id = r.id;
      else
        -- Recibo aún ausente o ilegible: se vuelve a consultar, nunca a enviar.
        update rwadar_novedades.pushes
           set estado = 'ticket', peticion_id = null, peticion_el = null,
               error = case when r.status_code between 200 and 299 then 'Recibo pendiente'
                            else 'HTTP ' || coalesce(r.status_code::text, '?') end
         where id = r.id;
      end if;
    end if;
    v_total := v_total + 1;
  end loop;

  -- Defensa de privacidad independiente de las ramas anteriores.
  update rwadar_novedades.pushes set token = null
   where token is not null and estado in ('aceptado', 'descartado', 'fallido');
  return v_total;
end
$funcion$;

-- Fase 2 del push: recibos pendientes, segunda comprobación y envío.
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
    -- Canal `novedades`; `data` solo con {tipo, destino}: ningún dato personal.
    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := v_cabeceras,
      body := jsonb_build_object(
        'to', r.token,
        'title', case when r.tipo = 'bienvenida' then 'RWAdar' else r.titulo end,
        'body', case when r.tipo = 'bienvenida'
                     then 'Este móvil ya puede recibir notificaciones de RWAdar. Tu Academy gratis está desbloqueada.'
                     else r.texto end,
        'sound', 'default',
        'priority', 'default',
        'channelId', 'novedades',
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

-- Colas terminadas (anuncios y bienvenidas), a los 90 días; móviles sin
-- actualizar, a los 180. Las bienvenidas no se repiten porque su marca vive
-- en preferencias (bienvenida_correo_el, bienvenida_push_el) y se va con la
-- cuenta.
create or replace function rwadar_novedades.limpiar()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_filas integer;
  v_total integer;
begin
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
  return v_total;
end
$funcion$;

-- La única función que llama el reloj `rwadar-novedades` (cada 5 minutos;
-- solo lo crean los scripts de activación). Cada paso va en su propio bloque:
-- una caída de Vault o de red no deshace lo ya leído ni lo de otro canal.
-- Con todo apagado no envía nada, pero limpia igual (la retención no depende
-- de los canales). Sin reloj, nadie la llama: ver el contrato, «Limpieza».
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
-- 7 · Funciones para la web y la app (API pública mínima)
-- ---------------------------------------------------------------------
-- Todas exigen sesión confirmada salvo la baja. Ninguna devuelve ids de las
-- colas ni datos de otras cuentas.
create or replace function public.estado_mis_avisos()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
  v_cfg record;
  v_pref record;
  v_dispositivos integer;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  v_usuario := auth.uid();
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  select p.novedades, p.version, p.aceptado_el into v_pref
    from rwadar_novedades.preferencias p where p.usuario_id = v_usuario;
  select count(*) into v_dispositivos
    from rwadar_novedades.dispositivos d where d.usuario_id = v_usuario;
  return jsonb_build_object(
    -- `novedades` solo es true con la versión vigente del texto.
    'novedades', coalesce(v_pref.novedades and v_pref.version = v_cfg.version_consentimiento, false),
    'version', v_pref.version,
    'aceptado_el', v_pref.aceptado_el,
    'version_vigente', v_cfg.version_consentimiento,
    'texto_es', v_cfg.texto_consentimiento_es,
    'texto_en', v_cfg.texto_consentimiento_en,
    'dispositivos', coalesce(v_dispositivos, 0),
    'correo_activo', coalesce(v_cfg.correo_habilitado, false),
    'push_activo', coalesce(v_cfg.push_habilitado, false));
end
$funcion$;

create or replace function public.configurar_avisos_novedades(
  p_activar boolean, p_version text, p_canal text
) returns jsonb
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
  v_vigente text;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  if p_activar is null then
    raise exception using errcode = '22004', message = 'falta indicar si se activan los avisos';
  end if;
  if p_canal is not null and p_canal not in ('web', 'app') then
    raise exception using errcode = '22023', message = 'canal no válido';
  end if;
  v_usuario := auth.uid();
  select c.version_consentimiento into v_vigente from rwadar_novedades.configuracion c where c.unica;
  if p_activar and (p_version is distinct from v_vigente or p_canal is null) then
    raise exception using errcode = '22023',
      message = 'para activar hacen falta la versión vigente del texto y el canal';
  end if;

  insert into rwadar_novedades.preferencias (usuario_id, novedades, alta_el)
  select u.id, false, coalesce(u.email_confirmed_at, now()) from auth.users u where u.id = v_usuario
  on conflict (usuario_id) do nothing;

  if p_activar then
    update rwadar_novedades.preferencias
       set novedades = true, aceptado_el = now(), version = p_version, origen = 'perfil',
           canal = p_canal, baja_el = null, actualizado_el = now()
     where usuario_id = v_usuario;
  else
    update rwadar_novedades.preferencias
       set novedades = false, baja_el = case when novedades then now() else baja_el end,
           actualizado_el = now()
     where usuario_id = v_usuario;
  end if;
  return public.estado_mis_avisos();
end
$funcion$;

create or replace function public.registrar_aviso_push(p_token text, p_plataforma text)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
  v_cfg record;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{16,64}\]$' then
    raise exception using errcode = '22023', message = 'token de notificaciones no válido';
  end if;
  if p_plataforma is null or p_plataforma not in ('android', 'ios') then
    raise exception using errcode = '22023', message = 'plataforma no válida';
  end if;
  v_usuario := auth.uid();

  -- Una cuenta a la vez: la fila de preferencias sirve de cerrojo para el
  -- límite de 5 móviles.
  insert into rwadar_novedades.preferencias (usuario_id, novedades, alta_el)
  select u.id, false, coalesce(u.email_confirmed_at, now()) from auth.users u where u.id = v_usuario
  on conflict (usuario_id) do nothing;
  perform 1 from rwadar_novedades.preferencias where usuario_id = v_usuario for update;

  -- El último que registra un token se lo queda: lo pendiente de la cuenta
  -- anterior para ese token se borra.
  delete from rwadar_novedades.pushes
   where token = p_token and usuario_id <> v_usuario and estado = 'pendiente';

  -- Como mucho 5 por cuenta: un móvil nuevo sustituye al que lleva más
  -- tiempo sin actualizarse (desinstalar no avisa a la base).
  delete from rwadar_novedades.dispositivos
   where token in (select d.token from rwadar_novedades.dispositivos d
                    where d.usuario_id = v_usuario and d.token <> p_token
                    order by d.actualizado_el desc, d.creado_el desc
                    offset 4);

  insert into rwadar_novedades.dispositivos (token, usuario_id, plataforma)
  values (p_token, v_usuario, p_plataforma)
  on conflict (token) do update
    set usuario_id = excluded.usuario_id, plataforma = excluded.plataforma,
        actualizado_el = now();

  -- Bienvenida por push (de servicio): una sola vez por cuenta. La marca de
  -- preferencias lo garantiza también tras la limpieza de la cola y con la
  -- renovación diaria del móvil (la app volverá a llamar a esta función).
  select * into v_cfg from rwadar_novedades.configuracion where unica;
  if coalesce(v_cfg.push_habilitado, false) and v_cfg.push_activado_el is not null then
    update rwadar_novedades.preferencias
       set bienvenida_push_el = now()
     where usuario_id = v_usuario and bienvenida_push_el is null;
    if found then
      insert into rwadar_novedades.pushes (token, usuario_id, tipo)
      values (p_token, v_usuario, 'bienvenida')
      on conflict do nothing;
    end if;
  end if;
  return true;
end
$funcion$;

create or replace function public.quitar_aviso_push(p_token text)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  v_usuario := auth.uid();
  delete from rwadar_novedades.pushes
   where token = p_token and usuario_id = v_usuario and estado = 'pendiente';
  delete from rwadar_novedades.dispositivos where token = p_token and usuario_id = v_usuario;
  return found;
end
$funcion$;

-- ¿Sigue registrado ESTE móvil en mi cuenta? La app lo pregunta con su propio
-- token (p. ej., al abrir) para saber si debe volver a registrarlo: la base
-- borra los móviles sin renovar a los 180 días, los que Expo da por perdidos
-- y el más antiguo si la cuenta pasa de 5. Solo mira los tokens de la cuenta.
create or replace function public.mi_aviso_push_registrado(p_token text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $funcion$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  return exists (select 1 from rwadar_novedades.dispositivos d
                  where d.token = p_token and d.usuario_id = auth.uid());
end
$funcion$;

-- Anuncios publicados de los últimos 90 días y la bienvenida de la cuenta.
-- `creado_el` es la fecha en que el anuncio se publicó.
create or replace function public.mis_avisos_recientes(p_limite integer default 20)
returns setof jsonb
language plpgsql stable security definer set search_path = ''
as $funcion$
declare
  v_usuario uuid;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Se necesita una sesión confirmada y vigente';
  end if;
  if p_limite is null or p_limite not between 1 and 50 then
    raise exception using errcode = '22023', message = 'el límite debe estar entre 1 y 50';
  end if;
  v_usuario := auth.uid();
  return query
    select x.aviso from (
      select jsonb_build_object('id', a.id::text, 'tipo', a.tipo, 'titulo', a.titulo,
                                'texto', a.texto, 'enlace', a.enlace,
                                'creado_el', coalesce(a.publicado_el, a.creado_el)) as aviso,
             coalesce(a.publicado_el, a.creado_el) as fecha
        from rwadar_novedades.anuncios a
       where a.estado = 'publicado'
         and coalesce(a.publicado_el, a.creado_el) >= now() - interval '90 days'
      union all
      select jsonb_build_object('id', 'bienvenida', 'tipo', 'bienvenida',
               'titulo', 'Te damos la bienvenida a RWAdar',
               'texto', 'Tu cuenta está confirmada y la Academy ya está desbloqueada: es gratis con tu cuenta.',
               'enlace', 'https://rwadar.pages.dev/academy/',
               'creado_el', coalesce(p.alta_el, u.email_confirmed_at)),
             coalesce(p.alta_el, u.email_confirmed_at)
        from auth.users u
        left join rwadar_novedades.preferencias p on p.usuario_id = u.id
       where u.id = v_usuario
    ) x
    order by x.fecha desc nulls last
    limit p_limite;
end
$funcion$;

-- Baja sin cuenta, desde el enlace de cada aviso. Corta correo y push de
-- novedades. El token es aleatorio (gen_random_uuid) y único por cuenta.
create or replace function public.baja_avisos(p_token uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $funcion$
begin
  if p_token is null then
    return false;
  end if;
  update rwadar_novedades.preferencias
     set novedades = false, baja_el = now(), actualizado_el = now()
   where baja_token = p_token;
  return found;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 8 · Permisos: nada para los clientes salvo lo justo
-- ---------------------------------------------------------------------
alter table rwadar_novedades.configuracion enable row level security;
alter table rwadar_novedades.preferencias enable row level security;
alter table rwadar_novedades.anuncios enable row level security;
alter table rwadar_novedades.dispositivos enable row level security;
alter table rwadar_novedades.correos enable row level security;
alter table rwadar_novedades.pushes enable row level security;

revoke all on all tables in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all sequences in schema rwadar_novedades from public, anon, authenticated, service_role;
revoke all on all functions in schema rwadar_novedades from public, anon, authenticated, service_role;

revoke all on function public.estado_mis_avisos() from public, anon, authenticated, service_role;
revoke all on function public.configurar_avisos_novedades(boolean, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.registrar_aviso_push(text, text) from public, anon, authenticated, service_role;
revoke all on function public.quitar_aviso_push(text) from public, anon, authenticated, service_role;
revoke all on function public.mi_aviso_push_registrado(text) from public, anon, authenticated, service_role;
revoke all on function public.mis_avisos_recientes(integer) from public, anon, authenticated, service_role;
revoke all on function public.baja_avisos(uuid) from public, anon, authenticated, service_role;

grant execute on function public.estado_mis_avisos() to authenticated;
grant execute on function public.configurar_avisos_novedades(boolean, text, text) to authenticated;
grant execute on function public.registrar_aviso_push(text, text) to authenticated;
grant execute on function public.quitar_aviso_push(text) to authenticated;
grant execute on function public.mi_aviso_push_registrado(text) to authenticated;
grant execute on function public.mis_avisos_recientes(integer) to authenticated;
grant execute on function public.baja_avisos(uuid) to anon, authenticated;

-- Los mismos cierres de 23: ni Vault descifrado ni las colas de pg_net son
-- parte de la API cliente.
do $acl_vault_net$
begin
  if to_regclass('vault.decrypted_secrets') is not null then
    execute 'revoke all on table vault.decrypted_secrets from public, anon, authenticated';
  end if;
  if to_regclass('net.http_request_queue') is not null then
    execute 'revoke all on table net.http_request_queue from public, anon, authenticated';
  end if;
  if to_regclass('net._http_response') is not null then
    execute 'revoke all on table net._http_response from public, anon, authenticated';
  end if;
end
$acl_vault_net$;

-- ---------------------------------------------------------------------
-- 9 · Estado seguro: sin reloj y cuentas existentes rellenadas
-- ---------------------------------------------------------------------
-- El nombre del reloj no es una frontera de seguridad: se quita cualquiera
-- que llame a rwadar_novedades. Solo los scripts de activación lo crean.
do $relojes$
declare
  v_job record;
begin
  for v_job in
    select jobname from cron.job
     where jobname = 'rwadar-novedades'
        or lower(coalesce(command, '')) like '%rwadar_novedades.%'
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end
$relojes$;

-- Las cuentas ya confirmadas reciben sus preferencias con novedades = false:
-- nadie se apunta solo; lo activan en Perfil.
select rwadar_novedades.rellenar();

notify pgrst, 'reload schema';
commit;
