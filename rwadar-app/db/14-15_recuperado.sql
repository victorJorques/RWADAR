-- =====================================================================
-- RWAdar · el esquema REAL de producción, recuperado
-- ---------------------------------------------------------------------
-- QUÉ ES ESTE FICHERO
--
-- Un retrato de la base de datos en línea, leído de ella misma el 14 de
-- agosto de 2026. No está escrito a mano: sale de `pg_get_functiondef`,
-- `pg_get_viewdef` y `pg_get_triggerdef`, así que es literalmente lo que
-- hay, no lo que creemos que hay.
--
-- POR QUÉ EXISTE
--
-- A producción se le aplicaron dos migraciones —las que habrían sido la
-- 14 y la 15— que nunca se guardaron como fichero. El repositorio dejó
-- de describir la base, y eso costó caro: el 14 de agosto la web estuvo
-- rota para todo el mundo y no se veía en el código. Las pruebas locales
-- pasaban en verde porque aplican el esquema del repositorio, que estaba
-- bien; lo que estaba mal era la base de verdad.
--
-- QUÉ TRAÍAN ESAS DOS MIGRACIONES PERDIDAS
--
-- Mucho más de lo que nadie recordaba, y casi todo bueno:
--
--   · `opiniones` gana una columna `opinion_id`, y con ella las
--     operaciones pueden referirse a una opinión concreta;
--   · se publican tres operaciones —`guardar_opinion`,
--     `denunciar_opinion` y `borrar_mi_opinion`— y se PROHIBE escribir en
--     esas tablas directamente, con los disparadores
--     `opiniones_solo_rpc` y `denuncias_solo_rpc`. Es defensa en
--     profundidad: aunque alguien tuviera permiso de tabla, no puede
--     saltarse las reglas del dominio;
--   · `protege_privilegio_admin` impide que un usuario se haga
--     administrador a sí mismo editando su perfil;
--   · `dispositivos` gana `user_id`: enlaza el móvil con la cuenta;
--   · `limpiar_dispositivos_inactivos` y su versión oportunista, para que
--     la tabla de tokens no crezca sin fin;
--   · `sincroniza_autor_opiniones`, para que cambiar tu nombre cambie la
--     firma de lo que ya escribiste.
--
-- LO QUE ESTE FICHERO NO ES
--
-- **No es una migración replayable.** Es un retrato. Los bloques de
-- permisos y de columnas van como comentarios, y el orden no garantiza
-- que aplicarlo de cero funcione. Sirve para dos cosas, que son las que
-- importaban: que el repositorio vuelva a describir la base, y que
-- cualquiera pueda leer aquí por qué la web hace lo que hace.
--
-- Si algún día hay que reconstruir desde cero, esto es la referencia
-- contra la que escribir las migraciones limpias.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1 · Funciones, vistas, políticas, permisos y columnas
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.avisos_ciclo()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c int; s int;
begin
  c := avisos_confirmar(); s := avisos_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $function$
;

CREATE OR REPLACE FUNCTION public.avisos_confirmar()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
declare r record; n int := 0;
begin
  for r in
    select a.id, a.peticion_id, x.status_code, x.content, x.error_msg
      from avisos_correo a
      left join net._http_response x on x.id = a.peticion_id
     where a.enviado_el is null and a.peticion_id is not null
  loop
    if r.status_code is null and r.error_msg is null then
      continue;                                   -- todavía en vuelo
    elsif r.status_code between 200 and 299 then
      update avisos_correo set enviado_el = now(), error = null where id = r.id;
      n := n + 1;
    else
      update avisos_correo set peticion_id = null,
             error = coalesce(r.error_msg, 'HTTP ' || r.status_code || ' ' || left(coalesce(r.content,''), 200))
       where id = r.id;
    end if;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.avisos_soltar(p_tanda integer DEFAULT 20)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'vault'
AS $function$
declare v_clave text; v_de text; r record; v_id bigint; n int := 0;
begin
  select decrypted_secret into v_clave from vault.decrypted_secrets where name = 'BREVO_API_KEY';
  select decrypted_secret into v_de    from vault.decrypted_secrets where name = 'RWADAR_REMITENTE';
  if v_clave is null or v_de is null then return 0; end if;
  for r in
    select a.id, v.email, v.nombre, v.titular, v.detalle, v.plataforma
      from avisos_correo a
      join avisos_correo_pendientes v on v.id = a.id
     where a.enviado_el is null and a.peticion_id is null and a.intentos < 5
     order by a.creado_el limit p_tanda
  loop
    select net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', v_clave, 'content-type', 'application/json'),
      body    := jsonb_build_object(
        'sender',  jsonb_build_object('name','RWAdar','email', v_de),
        'to',      jsonb_build_array(jsonb_build_object('email', r.email, 'name', r.nombre)),
        'subject', r.titular,
        'htmlContent',
          '<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">'
          || '<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">' || r.titular || '</h1>'
          || coalesce('<p style="font-size:15px;line-height:1.6;color:#444">' || r.detalle || '</p>', '')
          || '<p style="font-size:15px;line-height:1.6;color:#444">Vigilabas <b>' || r.plataforma
          || '</b>. Te escribimos porque ha cambiado de estado en el registro.</p>'
          || '<p style="margin:22px 0"><a href="https://rwadar.netlify.app/" style="background:#25E39A;color:#06231A;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:99px;display:inline-block">Ver el radar</a></p>'
          || '<p style="font-size:12px;color:#888;border-top:1px solid #e5e5e5;padding-top:16px">'
          || 'Recibes esto porque vigilas esa plataforma en RWAdar. Puedes desactivar los avisos desde tu perfil. '
          || 'RWAdar es un registro independiente y <b>no es asesoramiento financiero</b>.</p></div>')
    ) into v_id;
    update avisos_correo set peticion_id = v_id, intentos = intentos + 1 where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.borrar_mi_cuenta()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$ declare quien uuid := auth.uid(); begin if quien is null then raise exception 'hay que haber iniciado sesion'; end if; delete from auth.users where id = quien; end $function$
;

CREATE OR REPLACE FUNCTION public.borrar_mi_opinion(p_opinion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception using errcode = '28000', message = 'hay que haber iniciado sesión';
  end if;

  delete from opiniones
   where opinion_id = p_opinion_id and usuario_id = v_usuario;
  if not found then
    raise exception using errcode = 'P0002', message = 'la opinión propia no existe';
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.crea_perfil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_nombre text;
begin
  -- La interfaz manda `nombre`; los otros dos nombres permiten altas de
  -- proveedores OAuth. Metadata inválida nunca debe impedir el registro.
  if jsonb_typeof(coalesce(new.raw_user_meta_data, '{}'::jsonb)) = 'object' then
    v_nombre := nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    )), '');
  end if;
  if v_nombre is not null and length(v_nombre) > 60 then
    v_nombre := null;
  end if;

  insert into perfiles (id, nombre)
  values (new.id, v_nombre)
  on conflict (id) do nothing;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.denunciar_opinion(p_opinion_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_denunciante uuid := auth.uid();
  v_usuario uuid;
  v_plataforma uuid;
  v_motivo text := nullif(btrim(p_motivo), '');
begin
  if v_denunciante is null then
    raise exception using errcode = '28000', message = 'hay que haber iniciado sesión';
  end if;
  if v_motivo is not null and length(v_motivo) > 300 then
    raise exception using errcode = '22023', message = 'el motivo no puede superar 300 caracteres';
  end if;

  select usuario_id, plataforma_id into v_usuario, v_plataforma
    from opiniones
   where opinion_id = p_opinion_id and estado = 'visible';
  if not found then
    raise exception using errcode = 'P0002', message = 'la opinión no está disponible';
  end if;
  if v_usuario = v_denunciante then
    raise exception using errcode = 'P0001', message = 'no puedes denunciar tu propia opinión';
  end if;

  -- No se acepta denunciante_id ni usuario_id del cliente. La restricción
  -- única devuelve 23505 al repetir una denuncia, señal inequívoca para UI.
  insert into denuncias
    (denunciante_id, usuario_id, plataforma_id, opinion_id, motivo)
  values
    (v_denunciante, v_usuario, v_plataforma, p_opinion_id, v_motivo);
end $function$
;

CREATE OR REPLACE FUNCTION public.encola_avisos_correo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin insert into avisos_correo (usuario_id, cambio_id) select v.usuario_id, new.id from vigilancia v join perfiles p on p.id = v.usuario_id where v.plataforma_id = new.plataforma_id and p.avisos_correo on conflict do nothing; return new; end $function$
;

CREATE OR REPLACE FUNCTION public.encola_avisos_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into avisos_push (cambio_id, instalacion, token)
  select new.id, d.instalacion, d.token_push
    from seguimiento s
    join dispositivos d on d.instalacion = s.instalacion
   where s.plataforma_id = new.plataforma_id
     and d.token_push is not null
  on conflict do nothing;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.es_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce((select p.es_admin from perfiles p where p.id = auth.uid()), false)
$function$
;

CREATE OR REPLACE FUNCTION public.es_opinion_propia(p_opinion_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from opiniones
     where opinion_id = p_opinion_id and usuario_id = auth.uid()
  )
$function$
;

CREATE OR REPLACE FUNCTION public.establecer_admin(p_usuario uuid, p_es_admin boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  update perfiles set es_admin = p_es_admin where id = p_usuario;
  if not found then
    raise exception using errcode = 'P0002', message = 'el perfil no existe';
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.guardar_opinion(p_plataforma uuid, p_nota integer, p_texto text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_usuario uuid := auth.uid();
  v_texto text := btrim(p_texto);
  v_autor text;
  v_opinion uuid;
begin
  if v_usuario is null then
    raise exception using errcode = '28000', message = 'hay que haber iniciado sesión';
  end if;
  if p_nota is null or p_nota not between 1 and 10 then
    raise exception using errcode = '22023', message = 'la nota debe estar entre 1 y 10';
  end if;
  if v_texto is null or length(v_texto) not between 20 and 1200 then
    raise exception using errcode = '22023', message = 'el texto debe tener entre 20 y 1200 caracteres';
  end if;
  if not exists (select 1 from plataformas where id = p_plataforma) then
    raise exception using errcode = 'P0002', message = 'la plataforma no existe';
  end if;

  select coalesce(nullif(btrim(nombre), ''), 'Anónimo') into v_autor
    from perfiles where id = v_usuario;
  v_autor := coalesce(v_autor, 'Anónimo');

  insert into opiniones (usuario_id, plataforma_id, nota, texto, autor_publico)
  values (v_usuario, p_plataforma, p_nota, v_texto, v_autor)
  on conflict (usuario_id, plataforma_id) do update
    set nota = excluded.nota,
        texto = excluded.texto,
        autor_publico = excluded.autor_publico
  returning opinion_id into v_opinion;

  return v_opinion;
end $function$
;

CREATE OR REPLACE FUNCTION public.instalacion_actual()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select nullif(current_setting('request.headers', true)::json ->> 'x-instalacion', '')
$function$
;

CREATE OR REPLACE FUNCTION public.limpia_dispositivos_oportunista()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  perform limpiar_dispositivos_inactivos(100);
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.limpiar_dispositivos_inactivos(p_limite integer DEFAULT 100)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_borrados integer;
begin
  if p_limite is null or p_limite not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'el límite debe estar entre 1 y 1000';
  end if;

  with candidatos as (
    select id from dispositivos
     where visto_el < now() - interval '180 days'
     order by visto_el
     limit p_limite
     for update skip locked
  )
  delete from dispositivos d
   using candidatos c
   where d.id = c.id;
  get diagnostics v_borrados = row_count;
  return v_borrados;
end $function$
;

CREATE OR REPLACE FUNCTION public.moderar(p_opinion_id uuid, p_accion text, p_motivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_usuario uuid;
  v_plataforma uuid;
begin
  if not es_admin() then
    raise exception using errcode = '42501', message = 'solo un administrador puede moderar';
  end if;
  if p_accion not in ('ocultar', 'restaurar') then
    raise exception using errcode = '22023', message = 'acción de moderación no válida';
  end if;
  if p_motivo is not null and length(btrim(p_motivo)) > 500 then
    raise exception using errcode = '22023', message = 'el motivo no puede superar 500 caracteres';
  end if;

  update opiniones
     set estado = case when p_accion = 'ocultar' then 'oculta' else 'visible' end,
         denuncias = case when p_accion = 'restaurar' then 0 else denuncias end
   where opinion_id = p_opinion_id
  returning usuario_id, plataforma_id into v_usuario, v_plataforma;
  if not found then
    raise exception using errcode = 'P0002', message = 'la opinión no existe';
  end if;

  if p_accion = 'restaurar' then
    delete from denuncias where opinion_id = p_opinion_id;
  end if;

  insert into moderacion
    (moderador_id, usuario_id, opinion_id, plataforma_id, accion, motivo)
  values
    (auth.uid(), v_usuario, p_opinion_id, v_plataforma, p_accion,
     nullif(btrim(p_motivo), ''));
end $function$
;

CREATE OR REPLACE FUNCTION public.moderar(p_usuario uuid, p_plataforma uuid, p_accion text, p_motivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not es_admin() then
    raise exception 'solo un administrador puede moderar';
  end if;
  if p_accion not in ('ocultar','restaurar') then
    raise exception 'accion no valida: %', p_accion;
  end if;

  update opiniones
     set estado    = case when p_accion = 'ocultar' then 'oculta' else 'visible' end,
         denuncias = case when p_accion = 'restaurar' then 0 else denuncias end
   where usuario_id = p_usuario and plataforma_id = p_plataforma;

  if not found then raise exception 'esa opinion no existe'; end if;

  -- Restaurar limpia las denuncias: si no, las viejas la volverían a
  -- tumbar en cuanto llegara una nueva.
  if p_accion = 'restaurar' then
    delete from denuncias where usuario_id = p_usuario and plataforma_id = p_plataforma;
  end if;

  insert into moderacion (moderador_id, usuario_id, plataforma_id, accion, motivo)
  values (auth.uid(), p_usuario, p_plataforma, p_accion, p_motivo);
end $function$
;

CREATE OR REPLACE FUNCTION public.protege_denuncias_directas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'las denuncias se crean mediante la operacion publicada';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $function$
;

CREATE OR REPLACE FUNCTION public.protege_opiniones_directas()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'las opiniones se modifican mediante las operaciones publicadas';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $function$
;

CREATE OR REPLACE FUNCTION public.protege_privilegio_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.es_admin is distinct from old.es_admin
     and current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'es_admin solo se modifica mediante la operacion administrativa';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.push_ciclo()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c int; s int;
begin
  c := push_confirmar(); s := push_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $function$
;

CREATE OR REPLACE FUNCTION public.push_confirmar()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
declare r record; n int := 0; v_estado text; v_error text;
begin
  for r in
    select a.id, a.instalacion, a.peticion_id, x.status_code, x.content, x.error_msg
      from avisos_push a
      left join net._http_response x on x.id = a.peticion_id
     where a.enviado_el is null and a.peticion_id is not null
  loop
    if r.status_code is null and r.error_msg is null then
      continue;                                    -- todavía en vuelo
    end if;

    v_estado := null; v_error := null;
    if r.status_code between 200 and 299 then
      begin
        v_estado := r.content::jsonb -> 'data' ->> 'status';
        v_error  := r.content::jsonb -> 'data' -> 'details' ->> 'error';
      exception when others then
        v_estado := null;                          -- respuesta ilegible
      end;
    end if;

    if v_estado = 'ok' then
      update avisos_push set enviado_el = now(), error = null where id = r.id;
      n := n + 1;
    elsif v_error = 'DeviceNotRegistered' then
      -- El móvil ya no existe. Se deja de insistir y se limpia el token,
      -- que además evita que futuros avisos lo vuelvan a encolar.
      update avisos_push set intentos = 5, error = 'DeviceNotRegistered' where id = r.id;
      update dispositivos set token_push = null where instalacion = r.instalacion;
    else
      update avisos_push set peticion_id = null,
             error = coalesce(r.error_msg, v_error, v_estado,
                              'HTTP ' || coalesce(r.status_code::text, '?'))
       where id = r.id;
    end if;
  end loop;

  -- Un cambio queda «notificado» cuando ya no le queda nada por entregar.
  -- Es lo que consulta `avisos_pendientes`, así que si no se marcara, esa
  -- vista seguiría enseñando trabajo ya hecho.
  update cambios_estado c set notificado_el = now()
   where c.notificado_el is null
     and exists (select 1 from avisos_push a where a.cambio_id = c.id)
     and not exists (
       select 1 from avisos_push a
        where a.cambio_id = c.id and a.enviado_el is null and a.intentos < 5);

  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.push_soltar(p_tanda integer DEFAULT 50)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
declare r record; v_id bigint; n int := 0;
begin
  for r in
    select a.id, a.token, c.titular, c.detalle, c.plataforma_id, p.slug
      from avisos_push a
      join cambios_estado c on c.id = a.cambio_id
      join plataformas p    on p.id = c.plataforma_id
     where a.enviado_el is null and a.peticion_id is null and a.intentos < 5
     order by a.creado_el limit p_tanda
  loop
    select net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('content-type', 'application/json',
                                    'accept', 'application/json'),
      body    := jsonb_build_object(
        'to',       r.token,
        'title',    r.titular,
        'body',     coalesce(r.detalle, 'Una plataforma que vigilas ha cambiado de estado.'),
        'sound',    'default',
        'priority', 'high',
        -- `data` es lo que recibe la app al abrirse desde el aviso: con el
        -- slug puede llevarte directamente a la ficha en vez de a la lista.
        'data',     jsonb_build_object('slug', r.slug, 'plataforma_id', r.plataforma_id))
    ) into v_id;
    update avisos_push set peticion_id = v_id, intentos = intentos + 1 where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.registra_cambio_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.estado is distinct from old.estado then
    insert into cambios_estado (plataforma_id, estado_anterior, estado_nuevo, titular, detalle)
    values (
      new.id, old.estado, new.estado,
      case new.estado
        when 'descartada' then new.nombre || ' sale del radar'
        else new.nombre || ' entra en el radar'
      end,
      coalesce(new.motivo_descarte, new.aval)
    );
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.revisa_denuncias()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if tg_op = 'INSERT' then
    update opiniones
       set denuncias = denuncias + 1,
           estado = case when denuncias + 1 >= 3 then 'oculta' else estado end
     where opinion_id = new.opinion_id;
    return new;
  end if;

  -- Una cascada al borrar una cuenta corrige el contador, pero no vuelve
  -- a publicar contenido: restaurar exige una decisión de moderación.
  update opiniones
     set denuncias = greatest(denuncias - 1, 0)
   where opinion_id = old.opinion_id;
  return old;
end $function$
;

CREATE OR REPLACE FUNCTION public.sincroniza_autor_opiniones()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.nombre is distinct from old.nombre then
    update opiniones
       set autor_publico = coalesce(nullif(btrim(new.nombre), ''), 'Anónimo')
     where usuario_id = new.id;
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.toca_actualizada_el()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.actualizada_el = now();
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.toca_opinion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.nota is distinct from old.nota or new.texto is distinct from old.texto then
    new.actualizado_el := now();
  else
    new.actualizado_el := old.actualizado_el;
  end if;
  return new;
end $function$
;

-- vista avisos_correo_pendientes  [security_invoker: respeta el RLS]
create or replace view avisos_correo_pendientes as  SELECT a.id,
    u.email,
    COALESCE(pf.nombre, split_part(u.email::text, '@'::text, 1)) AS nombre,
    c.titular,
    c.detalle,
    c.ocurrido_el,
    pl.nombre AS plataforma
   FROM avisos_correo a
     JOIN auth.users u ON u.id = a.usuario_id
     JOIN perfiles pf ON pf.id = a.usuario_id
     JOIN cambios_estado c ON c.id = a.cambio_id
     JOIN plataformas pl ON pl.id = c.plataforma_id
  WHERE a.enviado_el IS NULL;

-- vista avisos_pendientes  [security_invoker: respeta el RLS]
create or replace view avisos_pendientes as  SELECT c.id AS cambio_id,
    c.titular,
    c.detalle,
    c.plataforma_id,
    d.token_push,
    d.sistema
   FROM cambios_estado c
     JOIN seguimiento s ON s.plataforma_id = c.plataforma_id
     JOIN dispositivos d ON d.instalacion = s.instalacion
  WHERE c.notificado_el IS NULL AND d.token_push IS NOT NULL;

-- vista cola_moderacion  [security_invoker: respeta el RLS]
create or replace view cola_moderacion as  SELECT o.opinion_id,
    o.plataforma_id,
    p.nombre AS plataforma,
    o.autor_publico AS autor,
    o.nota,
    o.texto,
    o.estado,
    o.denuncias,
    o.creado_el,
    ( SELECT array_agg(COALESCE(d.motivo, 'sin motivo'::text) ORDER BY d.creado_el) AS array_agg
           FROM denuncias d
          WHERE d.opinion_id = o.opinion_id) AS motivos
   FROM opiniones o
     JOIN plataformas p ON p.id = o.plataforma_id
  WHERE (o.denuncias > 0 OR o.estado = 'oculta'::text) AND es_admin()
  ORDER BY o.denuncias DESC, o.creado_el DESC;

-- vista descartadas_sin_fuente  [security_invoker: respeta el RLS]
create or replace view descartadas_sin_fuente as  SELECT p.slug,
    p.nombre,
    p.etiqueta_descarte
   FROM plataformas p
     LEFT JOIN fuentes f ON f.plataforma_id = p.id
  WHERE p.estado = 'descartada'::rwa_estado
  GROUP BY p.id, p.slug, p.nombre, p.etiqueta_descarte
 HAVING count(f.id) = 0;

-- vista mi_perfil  [security_invoker: respeta el RLS]
create or replace view mi_perfil as  SELECT id,
    nombre,
    avisos_correo,
    es_admin,
    creado_el AS miembro_desde,
    CURRENT_DATE - creado_el::date AS dias_de_miembro,
    ( SELECT count(*) AS count
           FROM vigilancia v
          WHERE v.usuario_id = p.id) AS plataformas_vigiladas,
    ( SELECT count(*) AS count
           FROM avisos_correo a
          WHERE a.usuario_id = p.id) AS avisos_recibidos
   FROM perfiles p
  WHERE id = auth.uid();

-- vista mis_opiniones  [security_invoker: respeta el RLS]
create or replace view mis_opiniones as  SELECT opinion_id,
    plataforma_id,
    nota,
    texto,
    estado,
    denuncias,
    creado_el,
    actualizado_el
   FROM opiniones o
  WHERE es_opinion_propia(opinion_id);

-- vista nota_media  [security_invoker: respeta el RLS]
create or replace view nota_media as  SELECT o.plataforma_id,
    p.nombre AS plataforma,
    count(*)::integer AS opiniones,
        CASE
            WHEN count(*) >= 3 THEN round(avg(o.nota), 1)
            ELSE NULL::numeric
        END AS media
   FROM opiniones o
     JOIN plataformas p ON p.id = o.plataforma_id
  WHERE o.estado = 'visible'::text
  GROUP BY o.plataforma_id, p.nombre;

-- vista opiniones_publicas  [security_invoker: respeta el RLS]
create or replace view opiniones_publicas as  SELECT o.plataforma_id,
    p.nombre AS plataforma,
    o.autor_publico AS autor,
    o.nota,
    o.texto,
    o.creado_el,
    o.actualizado_el > (o.creado_el + '00:01:00'::interval) AS editada,
    o.opinion_id
   FROM opiniones o
     JOIN plataformas p ON p.id = o.plataforma_id
  WHERE o.estado = 'visible'::text;

-- vista radar_publico  [security_invoker: respeta el RLS]
create or replace view radar_publico as  SELECT p.slug,
    p.nombre,
    c.nombre AS categoria,
    c.color,
    c.orden AS categoria_orden,
    r.nombre AS region,
    p.actor,
    p.acceso,
    p.ticket,
    p.cadenas,
    p.web,
    p.aval,
    p.nota,
    p.verificada_el,
    COALESCE(( SELECT json_agg(json_build_object('url', f.url, 'titulo', f.titulo) ORDER BY f.consultada_el DESC) AS json_agg
           FROM fuentes f
          WHERE f.plataforma_id = p.id), '[]'::json) AS fuentes,
    p.id AS plataforma_id
   FROM plataformas p
     JOIN categorias c ON c.slug = p.categoria_slug
     JOIN regiones r ON r.slug = p.region_slug
  WHERE p.estado = 'en_radar'::rwa_estado
  ORDER BY p.nombre;

-- politica sobre avisos_correo
create policy "avisos propios visibles" on avisos_correo for SELECT to authenticated using ((usuario_id = auth.uid()));

-- politica sobre cambios_estado
create policy "historial visible" on cambios_estado for SELECT to anon, authenticated using (true);

-- politica sobre categorias
create policy "catalogo visible" on categorias for SELECT to anon, authenticated using (true);

-- politica sobre denuncias
create policy "el administrador ve las denuncias" on denuncias for SELECT to authenticated using (es_admin());

-- politica sobre dispositivos
create policy "el dispositivo se actualiza" on dispositivos for UPDATE to anon, authenticated using ((instalacion = instalacion_actual())) with check ((instalacion = instalacion_actual()));

-- politica sobre dispositivos
create policy "el dispositivo se borra" on dispositivos for DELETE to anon, authenticated using ((instalacion = instalacion_actual()));

-- politica sobre dispositivos
create policy "el dispositivo se registra" on dispositivos for INSERT to anon, authenticated with check ((instalacion = instalacion_actual()));

-- politica sobre dispositivos
create policy "el dispositivo se ve a si mismo" on dispositivos for SELECT to anon, authenticated using ((instalacion = instalacion_actual()));

-- politica sobre fuentes
create policy "fuentes visibles" on fuentes for SELECT to anon, authenticated using (true);

-- politica sobre moderacion
create policy "el historial de moderacion es para administradores" on moderacion for SELECT to authenticated using (es_admin());

-- politica sobre opiniones
create policy "cada cual ve la suya" on opiniones for SELECT to authenticated using ((usuario_id = auth.uid()));

-- politica sobre opiniones
create policy "el administrador lo ve todo" on opiniones for SELECT to authenticated using (es_admin());

-- politica sobre opiniones
create policy "las opiniones visibles se leen" on opiniones for SELECT to anon, authenticated using ((estado = 'visible'::text));

-- politica sobre perfiles
create policy "el perfil se edita a si mismo" on perfiles for UPDATE to authenticated using ((id = auth.uid())) with check ((id = auth.uid()));

-- politica sobre perfiles
create policy "el perfil se ve a si mismo" on perfiles for SELECT to authenticated using ((id = auth.uid()));

-- politica sobre plataformas
create policy "plataformas visibles" on plataformas for SELECT to anon, authenticated using (true);

-- politica sobre regiones
create policy "regiones visibles" on regiones for SELECT to anon, authenticated using (true);

-- politica sobre seguimiento
create policy "seguimiento propio se anade" on seguimiento for INSERT to anon, authenticated with check ((instalacion = instalacion_actual()));

-- politica sobre seguimiento
create policy "seguimiento propio se quita" on seguimiento for DELETE to anon, authenticated using ((instalacion = instalacion_actual()));

-- politica sobre seguimiento
create policy "seguimiento propio visible" on seguimiento for SELECT to anon, authenticated using ((instalacion = instalacion_actual()));

-- politica sobre vigilancia
create policy "vigilancia propia se anade" on vigilancia for INSERT to authenticated with check ((usuario_id = auth.uid()));

-- politica sobre vigilancia
create policy "vigilancia propia se quita" on vigilancia for DELETE to authenticated using ((usuario_id = auth.uid()));

-- politica sobre vigilancia
create policy "vigilancia propia visible" on vigilancia for SELECT to authenticated using ((usuario_id = auth.uid()));

-- grant  avisos_correo          -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  avisos_correo          -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  avisos_correo_pendient -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  avisos_correo_pendient -> authenticated  : REFERENCES, TRIGGER, TRUNCATE

-- grant  avisos_pendientes      -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  avisos_pendientes      -> authenticated  : REFERENCES, TRIGGER, TRUNCATE

-- grant  cambios_estado         -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  cambios_estado         -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  categorias             -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  categorias             -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  cola_moderacion        -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  cola_moderacion        -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  denuncias              -> authenticated  : INSERT, SELECT

-- grant  descartadas_sin_fuente -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  descartadas_sin_fuente -> authenticated  : REFERENCES, TRIGGER, TRUNCATE

-- grant  dispositivos           -> anon           : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

-- grant  dispositivos           -> authenticated  : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

-- grant  fuentes                -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  fuentes                -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  mi_perfil              -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  mi_perfil              -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  mis_opiniones          -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  mis_opiniones          -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  moderacion             -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  moderacion             -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  nota_media             -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  nota_media             -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  opiniones              -> anon           : SELECT

-- grant  opiniones              -> authenticated  : DELETE, INSERT, SELECT, UPDATE

-- grant  opiniones_publicas     -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  opiniones_publicas     -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  perfiles               -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  perfiles               -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  plataformas            -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  plataformas            -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  radar_publico          -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  radar_publico          -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  regiones               -> anon           : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  regiones               -> authenticated  : REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  seguimiento            -> anon           : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  seguimiento            -> authenticated  : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE

-- grant  vigilancia             -> anon           : REFERENCES, TRIGGER, TRUNCATE

-- grant  vigilancia             -> authenticated  : DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE

-- columnas de avisos_correo: id bigint, usuario_id uuid, cambio_id bigint, enviado_el timestamp with time zone, creado_el timestamp with time zone, peticion_id bigint, intentos smallint, error text

-- columnas de avisos_push: id bigint, cambio_id bigint, instalacion text, token text, enviado_el timestamp with time zone, peticion_id bigint, intentos smallint, error text, creado_el timestamp with time zone

-- columnas de denuncias: denunciante_id uuid, usuario_id uuid, plataforma_id uuid, motivo text, creado_el timestamp with time zone, opinion_id uuid

-- columnas de dispositivos: id uuid, user_id uuid, instalacion text, token_push text, sistema text, version_app text, visto_el timestamp with time zone, creado_el timestamp with time zone

-- columnas de moderacion: id bigint, moderador_id uuid, usuario_id uuid, plataforma_id uuid, accion text, motivo text, creado_el timestamp with time zone, opinion_id uuid

-- columnas de opiniones: usuario_id uuid, plataforma_id uuid, nota smallint, texto text, estado text, denuncias smallint, creado_el timestamp with time zone, actualizado_el timestamp with time zone, opinion_id uuid, autor_publico text

-- columnas de perfiles: id uuid, nombre text, avisos_correo boolean, creado_el timestamp with time zone, es_admin boolean

-- columnas de seguimiento: instalacion text, plataforma_id uuid, creado_el timestamp with time zone

-- columnas de vigilancia: usuario_id uuid, plataforma_id uuid, creado_el timestamp with time zone

-- cron rwadar-avisos  (*/5 * * * *)   select avisos_ciclo() 

-- cron rwadar-push  (*/2 * * * *)   select push_ciclo()

-- ---------------------------------------------------------------------
-- 2 · Disparadores y estructura de tablas
-- ---------------------------------------------------------------------
-- Aquí están los dos guardianes que explican el fallo del 14 de agosto:
-- `opiniones_solo_rpc` y `denuncias_solo_rpc`.

-- tabla avisos_correo (id bigint, usuario_id uuid, cambio_id bigint, enviado_el timestamp with time zone, creado_el timestamp with time zone, peticion_id bigint, intentos smallint, error text)
-- tabla avisos_push (id bigint, cambio_id bigint, instalacion text, token text, enviado_el timestamp with time zone, peticion_id bigint, intentos smallint, error text, creado_el timestamp with time zone)
-- tabla cambios_estado (id bigint, plataforma_id uuid, estado_anterior rwa_estado, estado_nuevo rwa_estado, titular text, detalle text, notificado_el timestamp with time zone, ocurrido_el timestamp with time zone)
-- tabla categorias (slug text, nombre text, color text, orden smallint)
-- tabla denuncias (denunciante_id uuid, usuario_id uuid, plataforma_id uuid, motivo text, creado_el timestamp with time zone, opinion_id uuid)
-- tabla dispositivos (id uuid, user_id uuid, instalacion text, token_push text, sistema text, version_app text, visto_el timestamp with time zone, creado_el timestamp with time zone)
-- tabla fuentes (id uuid, plataforma_id uuid, url text, titulo text, publicada_el date, consultada_el date)
-- tabla moderacion (id bigint, moderador_id uuid, usuario_id uuid, plataforma_id uuid, accion text, motivo text, creado_el timestamp with time zone, opinion_id uuid)
-- tabla opiniones (usuario_id uuid, plataforma_id uuid, nota smallint, texto text, estado text, denuncias smallint, creado_el timestamp with time zone, actualizado_el timestamp with time zone, opinion_id uuid, autor_publico text)
-- tabla perfiles (id uuid, nombre text, avisos_correo boolean, creado_el timestamp with time zone, es_admin boolean)
-- tabla plataformas (id uuid, slug text, nombre text, estado rwa_estado, categoria_slug text, region_slug text, actor rwa_actor, acceso rwa_acceso, ticket rwa_ticket, cadenas text, web text, aval text, nota text, etiqueta_descarte text, motivo_descarte text, verificada_el date, creada_el timestamp with time zone, actualizada_el timestamp with time zone)
-- tabla regiones (slug text, nombre text)
-- tabla seguimiento (instalacion text, plataforma_id uuid, creado_el timestamp with time zone)
-- tabla vigilancia (usuario_id uuid, plataforma_id uuid, creado_el timestamp with time zone)
CREATE TRIGGER cambios_encolan_correo AFTER INSERT ON public.cambios_estado FOR EACH ROW EXECUTE FUNCTION encola_avisos_correo();
CREATE TRIGGER cambios_encolan_push AFTER INSERT ON public.cambios_estado FOR EACH ROW EXECUTE FUNCTION encola_avisos_push();
CREATE TRIGGER denuncias_revisan AFTER INSERT OR DELETE ON public.denuncias FOR EACH ROW EXECUTE FUNCTION revisa_denuncias();
CREATE TRIGGER denuncias_solo_rpc BEFORE INSERT OR DELETE OR UPDATE ON public.denuncias FOR EACH ROW EXECUTE FUNCTION protege_denuncias_directas();
CREATE TRIGGER dispositivos_limpian_inactivos AFTER INSERT OR UPDATE OF visto_el ON public.dispositivos FOR EACH STATEMENT EXECUTE FUNCTION limpia_dispositivos_oportunista();
CREATE TRIGGER opiniones_solo_rpc BEFORE INSERT OR DELETE OR UPDATE ON public.opiniones FOR EACH ROW EXECUTE FUNCTION protege_opiniones_directas();
CREATE TRIGGER opiniones_tocadas BEFORE UPDATE ON public.opiniones FOR EACH ROW EXECUTE FUNCTION toca_opinion();
CREATE TRIGGER perfiles_protegen_admin BEFORE UPDATE OF es_admin ON public.perfiles FOR EACH ROW EXECUTE FUNCTION protege_privilegio_admin();
CREATE TRIGGER perfiles_sincronizan_autor AFTER UPDATE OF nombre ON public.perfiles FOR EACH ROW EXECUTE FUNCTION sincroniza_autor_opiniones();
CREATE TRIGGER plataformas_actualizada BEFORE UPDATE ON public.plataformas FOR EACH ROW EXECUTE FUNCTION toca_actualizada_el();
CREATE TRIGGER plataformas_cambio_estado AFTER UPDATE OF estado ON public.plataformas FOR EACH ROW EXECUTE FUNCTION registra_cambio_estado();
