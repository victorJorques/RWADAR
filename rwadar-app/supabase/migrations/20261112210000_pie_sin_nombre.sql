-- =====================================================================
-- RWAdar 34 · el pie de los avisos por correo, sin el nombre del titular
-- ---------------------------------------------------------------------
-- Petición de Víctor (12/11/2026): «todo lo que puedas quitar mi nombre
-- hazlo». Su nombre completo queda solo donde la ley lo pide: el aviso legal
-- y la privacidad de la web (LSSI, art. 10; RGPD, art. 13). El pie de cada
-- correo de RWAdar (bienvenida y anuncios) llevaba su nombre completo tras
-- «Responsable:» y ahora dice «Responsable: el titular de RWAdar, Plaza
-- Generalitat, s/n, 46600 Alzira (Valencia), España», con el aviso legal
-- enlazado justo después (en texto, en la línea siguiente): quien envía
-- sigue siendo identificable (LSSI, art. 20.1) y la dirección física que
-- pide la política de uso de Lettermint sigue en cada correo. Es la misma frase que la información básica de los avisos en la
-- web y la app («Responsable: el titular de RWAdar …», 12/11/2026).
-- Copia idéntica: supabase/migrations/20261112210000_pie_sin_nombre.sql.
--
-- Va después de la 31 (aplicada; la 32 y la 33 no tocan el correo).
-- Aplicarla es tocar Supabase en línea: solo con orden expresa de Víctor,
-- con copia antes (flujo «Avisos a registrados (base)», acciones ensayo-34
-- y aplicar-34). Nunca con `supabase db push`.
--
-- Solo sustituye rwadar_novedades.correo_mensaje, con la misma firma, el
-- mismo dueño, `security definer`, `search_path` vacío y ningún permiso para
-- los clientes. Es la de la 31 letra por letra salvo el nombre del pie (en
-- HTML y en texto) y el comentario de encima. Lo demás del correo no cambia:
-- quién envía, la dirección, el aviso legal y la privacidad, por qué lo
-- recibe, la baja (enlace, mailto y List-Unsubscribe, que pone
-- enviar_correos) y sin seguimiento. No enciende nada, no cambia la
-- configuración ni ninguna fila, y no toca relojes, Vault ni el push.
--
-- Se niega si hay correos a medias con su clave idempotente (enviando, o
-- pendientes de reintento, de menos de 25 minutos): el reintento llevaría
-- otro cuerpo con la misma clave y Lettermint no lo trataría como el mismo
-- correo. Con el correo apagado (hoy) no hay ninguno; si los hay, basta
-- esperar a que terminen y volver a lanzarla.
--
-- OJO: reaplicar la 31 devuelve el nombre al pie (el verificador 34 lo
-- detecta): después hay que reaplicar la 34. Reaplicar la 30 devuelve el
-- correo a Brevo: después, la 31, la 32, la 33 y la 34, en ese orden (sin la
-- 31, la 34 se niega).
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('rwadar_novedades.correos') is null
     or to_regprocedure('rwadar_novedades.html(text)') is null
     or to_regprocedure('rwadar_novedades.correo_mensaje(text,text,text,text,boolean,uuid)') is null
     or to_regprocedure('rwadar_novedades.enviar_correos(integer)') is null
     or to_regprocedure('rwadar_novedades.procesar()') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 34: falta aplicar antes 30_avisos_registrados.sql y 31_correo_lettermint.sql';
  end if;
  -- El pie de la 34 es el de la 31 sin el nombre: sobre el código de Brevo
  -- (la 30 sin la 31, o reaplicada después) no se aplica.
  if position('https://api.lettermint.co/v1/send' in
              pg_get_functiondef('rwadar_novedades.enviar_correos(integer)'::regprocedure)) = 0 then
    raise exception using errcode = '55000',
      message = 'RWAdar 34: falta aplicar antes 31_correo_lettermint.sql (o se reaplicó la 30 después: aplica la 31 y después la 34)';
  end if;
end
$precondiciones$;

-- El mismo cerrojo que procesar() y limpiar(): ninguna vuelta del reloj
-- corre a medias con el pie viejo y el nuevo.
select pg_advisory_xact_lock(20261105, 30);

do $correos_a_medias$
begin
  if exists (select 1 from rwadar_novedades.correos c
              where c.estado in ('enviando', 'pendiente') and c.idempotencia is not null
                and c.idempotencia_el > now() - interval '25 minutes') then
    raise exception using errcode = '55000',
      message = 'RWAdar 34: hay correos a medias con su clave idempotente (enviando o pendientes de reintento): espera 25 minutos a que terminen y vuelve a lanzarla';
  end if;
end
$correos_a_medias$;

-- ---------------------------------------------------------------------
-- 1 · Texto de los correos: el pie, sin el nombre del titular
-- ---------------------------------------------------------------------
-- Devuelve {asunto, html, texto}. Igual que en la 31 salvo el nombre del
-- pie. Sin imágenes, sin píxel y sin enlaces de seguimiento: los enlaces van
-- directos a rwadar.pages.dev. Pie de cada aviso: quién envía (el titular de
-- RWAdar, con su dirección, aviso legal y privacidad), por qué lo recibe y
-- la baja (enlace y mailto). Un anuncio sin baja nunca se construye.
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
  v_mailto := 'mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar';
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
    v_cierre := v_parrafo || 'Si no creaste esta cuenta, <a href="mailto:rwadares@gmail.com" '
      || 'style="color:#0F7A57">escríbenos</a> y la borramos.</p>';
    v_cierre_txt := 'Si no creaste esta cuenta, escríbenos a rwadares@gmail.com y la borramos.';
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

  -- Titular identificable (LSSI art. 20.1): «el titular de RWAdar», con el
  -- enlace al aviso legal, que lo identifica con nombre, NIF y domicilio
  -- (desde la 34, sin su nombre aquí). Dirección física (política de uso de
  -- Lettermint): la misma que publica el aviso legal de la web.
  v_pie := '<p style="margin:0 0 8px">Te escribe RWAdar, un radar independiente de plataformas de '
    || 'tokenización. Responsable: el titular de RWAdar, Plaza Generalitat, s/n, '
    || '46600 Alzira (Valencia), España '
    || '(<a href="https://rwadar.pages.dev/privacidad#aviso-legal" style="color:#555">aviso legal</a>'
    || ' · <a href="https://rwadar.pages.dev/privacidad" style="color:#555">privacidad</a>).</p>'
    || '<p style="margin:0 0 8px">' || v_motivo || '</p>';
  v_pie_txt := 'Te escribe RWAdar, un radar independiente de plataformas de tokenización. '
    || 'Responsable: el titular de RWAdar, Plaza Generalitat, s/n, '
    || '46600 Alzira (Valencia), España.' || E'\n'
    || 'Aviso legal: https://rwadar.pages.dev/privacidad#aviso-legal' || E'\n'
    || 'Privacidad: https://rwadar.pages.dev/privacidad' || E'\n' || v_motivo;
  if v_baja is not null then
    v_pie := v_pie || '<p style="margin:0">Para darte de baja de los avisos: <a href="'
      || rwadar_novedades.html(v_baja) || '" style="color:#555">darme de baja</a>'
      || ' o escribe a <a href="' || rwadar_novedades.html(v_mailto)
      || '" style="color:#555">rwadares@gmail.com</a>. También puedes hacerlo en tu Perfil.</p>';
    v_pie_txt := v_pie_txt || E'\n' || 'Para darte de baja de los avisos: ' || v_baja
      || ' o escribe a rwadares@gmail.com. También puedes hacerlo en tu Perfil.';
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
-- 2 · Permisos: los mismos de la 30 y la 31 (solo el propietario)
-- ---------------------------------------------------------------------
revoke all on function rwadar_novedades.correo_mensaje(text, text, text, text, boolean, uuid)
  from public, anon, authenticated, service_role;

commit;
