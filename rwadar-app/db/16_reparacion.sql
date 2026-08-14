-- =====================================================================
-- RWAdar · reparación para la presentación
-- ---------------------------------------------------------------------
-- Junta lo único que falta en producción. Pégalo entero en el editor SQL
-- del panel y dale a Run. Es idempotente: se puede repetir sin miedo.
--
-- Contiene dos cosas:
--   1 · Devuelve moderar() a una firma que encaja con la tabla.
--   2 · El envío real de los avisos por correo (la migración 13).
--
-- QUÉ PASÓ CON moderar()
--
-- En producción quedó una versión que espera `p_opinion_id`, pero la
-- tabla `opiniones` no tiene columna `id`: su clave es (usuario_id,
-- plataforma_id). Función y tabla no encajan, y la pantalla de
-- moderación fallaba. Aquí se recrea la versión que sí corresponde.
-- La otra se deja donde está —borrarla a ciegas sin conocer sus tipos
-- exactos es más arriesgado que dejarla sin usar— y la web ya prueba
-- ambas firmas, así que funciona con cualquiera de las dos.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · moderar() coherente con la tabla
-- ---------------------------------------------------------------------
create or replace function moderar(
  p_usuario uuid, p_plataforma uuid, p_accion text, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public as $$
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
end $$;

revoke all on function moderar(uuid,uuid,text,text) from public, anon;
grant execute on function moderar(uuid,uuid,text,text) to authenticated;

-- ---------------------------------------------------------------------
-- 2 · El envío de los avisos por correo
-- ---------------------------------------------------------------------
-- La web promete «te avisamos si una plataforma cae del radar» y hoy ese
-- correo no sale nunca: la base encola bien y nadie lee la cola.
--
-- No se marca un aviso como enviado al soltarlo. pg_net es asíncrono:
-- devuelve un identificador y responde después. Dar por enviado lo que
-- solo está encolado perdería avisos en silencio, justo en el producto
-- cuyo valor entero es avisar. Por eso va en dos pasos y solo se marca
-- cuando el proveedor responde 2xx. Lo que falla vuelve a la cola.
--
-- Sin clave configurada en el vault no hace nada y no da error.
create extension if not exists pg_net;
create extension if not exists pg_cron;

alter table avisos_correo add column if not exists peticion_id bigint;
alter table avisos_correo add column if not exists intentos smallint not null default 0;
alter table avisos_correo add column if not exists error text;

create index if not exists avisos_correo_por_enviar
  on avisos_correo (creado_el)
  where enviado_el is null and peticion_id is null and intentos < 5;

create or replace function avisos_soltar(p_tanda int default 20)
returns int language plpgsql security definer set search_path = public, net, vault as $$
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
end $$;

create or replace function avisos_confirmar()
returns int language plpgsql security definer set search_path = public, net as $$
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
end $$;

create or replace function avisos_ciclo() returns text
language plpgsql security definer set search_path = public as $$
declare c int; s int;
begin
  c := avisos_confirmar(); s := avisos_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $$;

revoke all on function avisos_soltar(int)  from public, anon, authenticated;
revoke all on function avisos_confirmar()  from public, anon, authenticated;
revoke all on function avisos_ciclo()      from public, anon, authenticated;

select cron.unschedule('rwadar-avisos') where exists (select 1 from cron.job where jobname = 'rwadar-avisos');
select cron.schedule('rwadar-avisos', '*/5 * * * *', $$ select avisos_ciclo() $$);

-- ---------------------------------------------------------------------
-- 3 · Los permisos de tabla que producción había perdido
-- ---------------------------------------------------------------------
-- Encontrado midiendo contra la base en línea, no leyendo código
-- (`node probar-produccion.mjs`): al rol `authenticated` le faltaban los
-- GRANT sobre `opiniones` y `denuncias`, así que la web devolvía
--
--     403 · 42501 · permission denied for table opiniones
--
-- a cualquiera que intentara publicar una opinión o denunciar otra. La
-- función entera estaba muerta en producción y no se notaba desde el
-- código: el repositorio sí los concede (09_opiniones.sql), y por eso
-- las pruebas contra el Postgres embebido pasaban en verde.
--
-- Un GRANT no abre nada por su cuenta: estas tablas tienen RLS activo y
-- son las políticas las que deciden qué filas se ven. Sin el GRANT, en
-- cambio, la política no llega ni a evaluarse.
--
-- Se vuelve a declarar el juego completo de 09, 10 y 11 —no solo las dos
-- que faltaban— para que producción y repositorio digan lo mismo.
grant select                 on opiniones          to anon, authenticated;
grant insert, update, delete on opiniones          to authenticated;
grant select, insert         on denuncias          to authenticated;
grant select                 on opiniones_publicas to anon, authenticated;
grant select                 on nota_media         to anon, authenticated;
grant select                 on moderacion         to authenticated;
grant select                 on cola_moderacion    to authenticated;
grant select                 on mi_perfil          to authenticated;

commit;
