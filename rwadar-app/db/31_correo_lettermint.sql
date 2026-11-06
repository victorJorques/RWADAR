-- =====================================================================
-- RWAdar 31 · el correo de los avisos sale por Lettermint, no por Brevo
-- ---------------------------------------------------------------------
-- Por qué: la revisión legal (docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md)
-- descartó Brevo porque mete un píxel de apertura también en el correo
-- transaccional. Lettermint (Países Bajos, UE) no sigue aperturas ni clics
-- salvo que se pida, y aquí se le pide expresamente que no lo haga.
-- Contrato: docs/tareas/AVISOS-Y-ACADEMY-REGISTRO-2026-11-05.md.
-- Copia idéntica: supabase/migrations/20261106120000_correo_lettermint.sql.
--
-- Va después de la 30 (aplicada el 06/11/2026 con todo apagado), que NO se
-- toca. Aplicarla es tocar Supabase en línea: solo con permiso expreso de
-- Víctor, con copia antes (flujo «Avisos a registrados (base)», acciones
-- ensayo-31 y aplicar-31). Nunca con `supabase db push`.
--
-- Solo sustituye tres funciones del correo, con la misma firma, el mismo
-- dueño, `security definer`, `search_path` vacío y ningún permiso para los
-- clientes (create or replace conserva dueño y permisos; aun así se repiten
-- los revoke de la 30):
--   · correo_mensaje: el pie lleva la dirección postal del responsable (la
--     política de uso de Lettermint pide una dirección física en cada correo;
--     es la misma del aviso legal de la web).
--   · enviar_correos: POST a https://api.lettermint.co/v1/send con el token
--     de proyecto (Vault: LETTERMINT_API_TOKEN) en `x-lettermint-token`, la
--     clave idempotente de la fila en la cabecera HTTP `Idempotency-Key` (la
--     misma en cada reintento), `settings` sin seguimiento de aperturas ni de
--     clics, la bienvenida por la ruta transaccional (la de por defecto, sin
--     `route`) y los anuncios por la de difusión (`route` = 'broadcast').
--   · leer_correos: 202 con `message_id` = aceptado; 409 = incierto (nunca se
--     reenvía solo); otro 4xx salvo 408 y 429 = fallido; 5xx, 408, 429 o sin
--     respuesta = reintento con la misma clave, como en la 30.
--
-- No enciende nada, no cambia la configuración, no toca relojes, Vault ni el
-- push, y no borra filas. Solo al venir del código de Brevo (la 30 sin la
-- 31) cierra las peticiones que quedaran a medias: las que ya tienen la
-- respuesta de aceptación del proveedor (202 de Lettermint o 201 de Brevo)
-- quedan «aceptado», y las demás «inciertas». La primera vez no hay ninguna
-- (el correo nunca se ha encendido); sí puede haberlas si se reaplica la 30
-- (por ejemplo, tras fallo_cerrado.sql) con correos de Lettermint en curso.
-- Reaplicarla sobre sí misma no toca ninguna fila. OJO: reaplicar la 30
-- devuelve estas tres funciones a Brevo; después hay que reaplicar la 31
-- (30_avisos_registrados_activar_correo.sql se niega a encender sin ella).
--
-- Pendiente de la prueba real del paso 5 (correo propio, contrato,
-- «Activación»): que la ruta de difusión se llama `broadcast`, qué hace con
-- el `List-Unsubscribe` propio (Lettermint añade el suyo en esa ruta) y que
-- el correo llega sin píxel ni enlaces reescritos.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.configuracion') is null
     or to_regclass('rwadar_novedades.correos') is null
     or to_regclass('rwadar_novedades.preferencias') is null
     or to_regclass('rwadar_novedades.anuncios') is null
     or to_regprocedure('rwadar_novedades.html(text)') is null
     or to_regprocedure('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)') is null
     or to_regprocedure('rwadar_novedades.leer_correos()') is null
     or to_regprocedure('rwadar_novedades.enviar_correos(integer)') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null
     or to_regclass('vault.decrypted_secrets') is null
     or to_regclass('net._http_response') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 31: falta aplicar antes 30_avisos_registrados.sql (o faltan pg_net o Vault)';
  end if;
  -- Cambiar de proveedor con el correo encendido con Brevo dejaría peticiones
  -- a medias leídas con otras reglas. Primero se apaga. (Con la 31 ya
  -- aplicada, reaplicarla con el correo encendido no cambia nada y pasa.)
  if position('api.brevo.com' in
              pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure)) > 0
     and exists (select 1 from rwadar_novedades.configuracion c
                  where c.unica and c.correo_habilitado) then
    raise exception using errcode = '55000',
      message = 'RWAdar 31: el correo está encendido con Brevo: apágalo antes con 30_avisos_registrados_apagar.sql';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que procesar() y limpiar(): ninguna vuelta del reloj
-- corre a medias con las funciones viejas y las nuevas.
select pg_advisory_xact_lock(20261105, 30);

-- Peticiones ya hechas antes de esta aplicación y sin respuesta leída. Solo
-- cuando el código vigente es el de Brevo (la 30 sin la 31): la primera vez
-- o al reaplicar la 30 y después la 31. Pueden venir de Brevo o, si la 31 ya
-- estuvo aplicada, de Lettermint. Lo que ya tiene en net._http_response la
-- aceptación del proveedor queda «aceptado», como lo habría leído su
-- leer_correos(): 202 con message_id (Lettermint), 201 con messageId o 400
-- de duplicado (Brevo). Lo demás no se repite con otras reglas: se deja
-- «incierto» para revisarlo a mano. Reaplicar la 31 sobre sí misma no toca
-- ninguna fila.
do $peticiones_anteriores$
declare
  r record;
  v_mensaje_id text;
  v_codigo text;
begin
  if position('api.brevo.com' in
              pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure)) > 0 then
    for r in
      select c.id, x.status_code, x.content
        from rwadar_novedades.correos c
        join net._http_response x on x.id = c.peticion_id
       where c.estado = 'enviando' and x.status_code in (201, 202, 400)
       for update of c
    loop
      v_mensaje_id := null;
      v_codigo := null;
      begin
        v_mensaje_id := left(nullif(btrim(r.content::jsonb ->> case r.status_code
                          when 202 then 'message_id' else 'messageId' end), ''), 255);
        v_codigo := r.content::jsonb ->> 'code';
      exception when others then
        v_mensaje_id := null;
        v_codigo := null;
      end;
      if (r.status_code in (201, 202) and v_mensaje_id is not null)
         or (r.status_code = 400 and v_codigo in ('duplicate_parameter', 'duplicate_request')) then
        update rwadar_novedades.correos
           set estado = 'aceptado', terminado_el = now(), peticion_id = null, peticion_el = null,
               proveedor_mensaje_id = coalesce(proveedor_mensaje_id, v_mensaje_id), error = null
         where id = r.id;
      end if;
    end loop;
    update rwadar_novedades.correos
       set estado = 'incierto', terminado_el = now(), peticion_id = null, peticion_el = null,
           error = 'Entrega incierta: petición previa a la (re)aplicación de la 31; revisar en el panel del proveedor, no reenviar automáticamente'
     where estado = 'enviando' or (estado = 'pendiente' and idempotencia is not null);
  end if;
end
$peticiones_anteriores$;

-- ---------------------------------------------------------------------
-- 1 · Texto de los correos: el pie lleva la dirección postal
-- ---------------------------------------------------------------------
-- Devuelve {asunto, html, texto}. Igual que en la 30 salvo la primera línea
-- del pie, que ahora lleva la dirección del responsable. Sin imágenes, sin
-- píxel y sin enlaces de seguimiento: los enlaces van directos a
-- rwadar.pages.dev. Pie de cada aviso: quién envía (con su dirección, aviso
-- legal y privacidad), por qué lo recibe y la baja (enlace y mailto). Un
-- anuncio sin baja nunca se construye.
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
        || 'te avisaremos de las fichas nuevas que entren en el radar y de las novedades de la web y la app. '
        || 'Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.</p>';
      v_cuerpo_txt := v_cuerpo_txt || E'\n\n' || 'Además, te has apuntado a los avisos de novedades: '
        || 'te avisaremos de las fichas nuevas que entren en el radar y de las novedades de la web y la app. '
        || 'Puedes darte de baja cuando quieras con el enlace del final o en tu Perfil.';
    end if;
    v_cierre := v_parrafo || 'Si no creaste esta cuenta, <a href="mailto:RWAdar@protonmail.com" '
      || 'style="color:#0F7A57">escríbenos</a> y la borramos.</p>';
    v_cierre_txt := 'Si no creaste esta cuenta, escríbenos a RWAdar@protonmail.com y la borramos.';
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

  -- Titular identificable (LSSI art. 20.1) y dirección física (política de
  -- uso de Lettermint): la misma que publica el aviso legal de la web.
  v_pie := '<p style="margin:0 0 8px">Te escribe RWAdar, un radar independiente de plataformas de '
    || 'tokenización. Responsable: Víctor Manuel Jorques Granero, Plaza Generalitat, s/n, '
    || '46600 Alzira (Valencia), España '
    || '(<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a>'
    || ' · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>'
    || '<p style="margin:0 0 8px">' || v_motivo || '</p>';
  v_pie_txt := 'Te escribe RWAdar, un radar independiente de plataformas de tokenización. '
    || 'Responsable: Víctor Manuel Jorques Granero, Plaza Generalitat, s/n, '
    || '46600 Alzira (Valencia), España.' || E'\n'
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
-- 2 · Fase 1 del correo: lee las respuestas de Lettermint
-- ---------------------------------------------------------------------
-- Lo que ya devolvió pg_net. Lettermint responde 202 con
-- {"message_id": "…", "status": "pending"}: aceptación del proveedor, no
-- entrega en el buzón. Con la misma clave idempotente y el mismo cuerpo
-- devuelve el mismo 202 sin enviar otro; con la clave usada para otro cuerpo,
-- todavía en curso o tras un 5xx de resultado incierto, responde 409: ese
-- correo puede haber salido o no, así que queda «incierto» para revisarlo en
-- el panel y nunca se reenvía solo.
create or replace function rwadar_novedades.leer_correos()
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  r record;
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
    v_mensaje_id := null;
    begin
      v_mensaje_id := left(nullif(btrim(r.content::jsonb ->> 'message_id'), ''), 255);
    exception when others then
      v_mensaje_id := null;
    end;

    if r.status_code = 202 and v_mensaje_id is not null then
      update rwadar_novedades.correos
         set estado = 'aceptado', terminado_el = now(), peticion_id = null, peticion_el = null,
             proveedor_mensaje_id = coalesce(proveedor_mensaje_id, v_mensaje_id), error = null
       where id = r.id;
    elsif r.status_code = 409 then
      update rwadar_novedades.correos
         set estado = 'incierto', terminado_el = now(), peticion_id = null, peticion_el = null,
             error = 'Lettermint: clave idempotente ya usada o en curso; revisar en el panel, no reenviar automáticamente'
       where id = r.id;
    elsif r.status_code between 400 and 499 and r.status_code not in (408, 429) then
      -- Credenciales, permisos, carga o validación (401, 403, 413, 422…) no
      -- se arreglan repitiendo.
      update rwadar_novedades.correos
         set estado = 'fallido', terminado_el = now(), peticion_id = null, peticion_el = null,
             error = 'Lettermint rechazó la petición (HTTP ' || r.status_code::text || ')'
       where id = r.id;
    else
      -- 5xx, 408, 429, un 202 sin message_id o sin respuesta: vuelve a cola
      -- con la MISMA clave idempotente, hasta 5 intentos.
      update rwadar_novedades.correos
         set estado = case when r.intentos >= 5 then 'fallido' else 'pendiente' end,
             terminado_el = case when r.intentos >= 5 then now() end,
             peticion_id = null, peticion_el = null,
             error = coalesce(nullif(left(r.error_msg, 160), ''),
                              'Lettermint HTTP ' || coalesce(r.status_code::text, '?'))
       where id = r.id;
    end if;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

-- ---------------------------------------------------------------------
-- 3 · Fase 2 del correo: segunda comprobación y envío con Lettermint
-- ---------------------------------------------------------------------
create or replace function rwadar_novedades.enviar_correos(p_tanda integer default 20)
returns integer
language plpgsql security definer set search_path = ''
as $funcion$
declare
  v_cfg record;
  v_token text;
  v_remitente text;
  v_total integer;
  r record;
  v_suscrito boolean;
  v_mensaje jsonb;
  v_cuerpo jsonb;
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

  -- Token de proyecto y remitente, de Vault. El token va en una cabecera
  -- HTTP: solo caracteres visibles, sin espacios, de 20 a 1024.
  select btrim(max(s.decrypted_secret) filter (where s.name = 'LETTERMINT_API_TOKEN')),
         btrim(max(s.decrypted_secret) filter (where s.name = 'RWADAR_REMITENTE'))
    into v_token, v_remitente
    from vault.decrypted_secrets s
   where s.name in ('LETTERMINT_API_TOKEN', 'RWADAR_REMITENTE');
  if coalesce(v_token, '') !~ '^[!-~]+$'
     or length(v_token) not between 20 and 1024
     or coalesce(v_remitente, '') !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'correo bloqueado: credenciales de Lettermint ausentes o no válidas en Vault';
  end if;

  -- Igual que la 30: sin respuesta en 10 minutos vuelve a cola con la MISMA
  -- clave idempotente; a los 25 minutos del primer envío, «entrega incierta»
  -- para revisar a mano, nunca un segundo envío fuera de la deduplicación.
  update rwadar_novedades.correos c
     set estado = 'incierto', terminado_el = now(), peticion_id = null, peticion_el = null,
         error = 'Entrega incierta: revisar Lettermint, no reenviar automáticamente'
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
         error = 'Entrega incierta: revisar Lettermint, no reenviar automáticamente'
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

    -- Sin seguimiento de aperturas ni de clics, aunque alguien lo encienda
    -- en el panel del proyecto. Ni `tag` ni `metadata` (minimización).
    v_cuerpo := jsonb_build_object(
      'from', 'RWAdar <' || v_remitente || '>',
      'to', jsonb_build_array(btrim(r.email)),
      'reply_to', jsonb_build_array('RWAdar@protonmail.com'),
      'subject', v_mensaje ->> 'asunto',
      'html', v_mensaje ->> 'html',
      'text', v_mensaje ->> 'texto',
      'settings', jsonb_build_object('track_opens', false, 'track_clicks', false));
    -- List-Unsubscribe solo si la persona está apuntada. Sin
    -- List-Unsubscribe-Post: no se promete la baja «en un clic».
    if v_suscrito then
      v_cuerpo := v_cuerpo || jsonb_build_object('headers', jsonb_build_object('List-Unsubscribe',
        '<https://rwadar.pages.dev/baja?t=' || r.baja_token::text || '>, '
        || '<mailto:RWAdar@protonmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar>'));
    end if;
    -- La bienvenida (de servicio) va por la ruta transaccional, la que el
    -- proyecto usa si no se indica ninguna; los anuncios, por la de difusión.
    if r.tipo = 'anuncio' then
      v_cuerpo := v_cuerpo || jsonb_build_object('route', 'broadcast');
    end if;

    -- La clave idempotente va en la cabecera HTTP, la misma en cada
    -- reintento: con el mismo cuerpo, Lettermint devuelve el 202 guardado y
    -- no envía otro (24 horas por proyecto).
    select net.http_post(
      url := 'https://api.lettermint.co/v1/send',
      headers := jsonb_build_object('x-lettermint-token', v_token,
                                    'Idempotency-Key', v_idempotencia::text,
                                    'content-type', 'application/json',
                                    'accept', 'application/json'),
      body := v_cuerpo,
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

-- ---------------------------------------------------------------------
-- 4 · Permisos: los mismos de la 30 (solo el propietario)
-- ---------------------------------------------------------------------
revoke all on function rwadar_novedades.correo_mensaje(text, text, text, text, boolean, uuid)
  from public, anon, authenticated, service_role;
revoke all on function rwadar_novedades.leer_correos() from public, anon, authenticated, service_role;
revoke all on function rwadar_novedades.enviar_correos(integer) from public, anon, authenticated, service_role;

commit;
