-- =====================================================================
-- RWAdar · el envío de los avisos por correo
-- ---------------------------------------------------------------------
-- Hasta ahora la base encolaba correctamente a quién había que avisar,
-- y nadie leía esa cola. La web prometía «te avisamos si una plataforma
-- cae del radar» y ese correo no salía nunca. Esto lo arregla.
--
-- POR QUÉ DESDE POSTGRES Y NO CON UNA FUNCIÓN DESPLEGADA
--
-- Una Edge Function haría lo mismo, pero hay que desplegarla con el CLI
-- y un token cada vez que cambie. Con `pg_cron` + `pg_net` todo vive en
-- la base: se aplica como cualquier migración y no depende de que nadie
-- tenga el portátil encendido.
--
-- LO QUE NO SE HACE, Y ES DELIBERADO
--
-- No se marca un aviso como enviado al soltarlo. `pg_net` es asíncrono:
-- devuelve un identificador y responde después. Si diéramos por enviado
-- lo que solo está encolado, un fallo del proveedor perdería el aviso en
-- silencio — justo en el producto cuyo valor entero es avisar. Por eso
-- va en dos pasos: primero se encola y se guarda el identificador,
-- después se comprueba la respuesta y solo entonces se marca. Lo que
-- falla se reintenta hasta cinco veces.
--
-- LA CLAVE DEL PROVEEDOR va en el vault de Supabase, cifrada. Si no
-- está puesta, esto no hace nada y no da error: la web sigue igual.
--
-- Depende de 07_cuentas.sql.  Es idempotente.
-- =====================================================================
begin;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------
-- 1 · Qué hace falta saber de cada envío
-- ---------------------------------------------------------------------
alter table avisos_correo add column if not exists peticion_id bigint;
alter table avisos_correo add column if not exists intentos smallint not null default 0;
alter table avisos_correo add column if not exists error text;

-- La cola de trabajo real: pendientes, sin petición en vuelo y que no
-- hayan agotado los reintentos.
create index if not exists avisos_correo_por_enviar
  on avisos_correo (creado_el)
  where enviado_el is null and peticion_id is null and intentos < 5;

-- ---------------------------------------------------------------------
-- 2 · Paso uno: soltar los correos pendientes
-- ---------------------------------------------------------------------
create or replace function avisos_soltar(p_tanda int default 20)
returns int language plpgsql security definer set search_path = public, net, vault as $$
declare
  v_clave text;
  v_de    text;
  r       record;
  v_id    bigint;
  n       int := 0;
begin
  -- La clave y el remitente salen del vault. Sin clave, no se hace nada:
  -- es el estado normal hasta que alguien la configure.
  select decrypted_secret into v_clave from vault.decrypted_secrets where name = 'BREVO_API_KEY';
  select decrypted_secret into v_de    from vault.decrypted_secrets where name = 'RWADAR_REMITENTE';
  if v_clave is null or v_de is null then return 0; end if;

  for r in
    select a.id, v.email, v.nombre, v.titular, v.detalle, v.plataforma
      from avisos_correo a
      join avisos_correo_pendientes v on v.id = a.id
     where a.enviado_el is null and a.peticion_id is null and a.intentos < 5
     order by a.creado_el
     limit p_tanda
  loop
    select net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', v_clave, 'content-type', 'application/json'),
      body    := jsonb_build_object(
        'sender',  jsonb_build_object('name','RWAdar','email', v_de),
        'to',      jsonb_build_array(jsonb_build_object('email', r.email, 'name', r.nombre)),
        'subject', r.titular,
        'htmlContent',
          '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">'
          || '<p style="font:600 13px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#0F7A57;margin:0 0 18px">RWAdar · aviso del radar</p>'
          || '<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">' || r.titular || '</h1>'
          || case when r.detalle is null then ''
                  else '<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">' || r.detalle || '</p>' end
          || '<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Vigilabas <b>' || r.plataforma
          || '</b>. Te escribimos porque ha cambiado de estado en el registro.</p>'
          || '<p style="margin:0 0 26px"><a href="https://rwadar.netlify.app/" style="background:#25E39A;color:#06231A;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:99px;display:inline-block">Ver el radar</a></p>'
          || '<p style="font-size:12px;line-height:1.55;color:#888;border-top:1px solid #e5e5e5;padding-top:16px;margin:0">'
          || 'Recibes esto porque vigilas esa plataforma en RWAdar. Puedes desactivar los avisos desde tu perfil. '
          || 'RWAdar es un registro independiente y <b>no es asesoramiento financiero</b>.</p></div>'
      )
    ) into v_id;

    update avisos_correo set peticion_id = v_id, intentos = intentos + 1 where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- 3 · Paso dos: comprobar qué llegó de verdad
-- ---------------------------------------------------------------------
-- Solo aquí se marca un aviso como enviado, y solo si el proveedor
-- respondió 2xx. Lo demás vuelve a la cola.
create or replace function avisos_confirmar()
returns int language plpgsql security definer set search_path = public, net as $$
declare r record; n int := 0;
begin
  for r in
    select a.id, a.peticion_id, a.intentos, x.status_code, x.content, x.error_msg
      from avisos_correo a
      left join net._http_response x on x.id = a.peticion_id
     where a.enviado_el is null and a.peticion_id is not null
  loop
    if r.status_code is null and r.error_msg is null then
      continue;                                  -- todavía en vuelo
    elsif r.status_code between 200 and 299 then
      update avisos_correo set enviado_el = now(), error = null where id = r.id;
      n := n + 1;
    else
      -- Falló: se suelta la petición para que la próxima pasada reintente.
      update avisos_correo
         set peticion_id = null,
             error = coalesce(r.error_msg, 'HTTP ' || r.status_code || ' ' || left(coalesce(r.content,''), 200))
       where id = r.id;
    end if;
  end loop;
  return n;
end $$;

-- Una sola llamada para el reloj: confirma lo anterior y suelta lo nuevo.
create or replace function avisos_ciclo() returns text
language plpgsql security definer set search_path = public as $$
declare c int; s int;
begin
  c := avisos_confirmar();
  s := avisos_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $$;

revoke all on function avisos_soltar(int)  from public, anon, authenticated;
revoke all on function avisos_confirmar()  from public, anon, authenticated;
revoke all on function avisos_ciclo()      from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4 · El reloj
-- ---------------------------------------------------------------------
-- Cada cinco minutos. Un aviso de que una plataforma se ha hundido no
-- puede esperar a mañana, y cinco minutos son de sobra: los cambios de
-- estado en este registro se cuentan con los dedos de una mano al año.
select cron.unschedule('rwadar-avisos') where exists (select 1 from cron.job where jobname = 'rwadar-avisos');
select cron.schedule('rwadar-avisos', '*/5 * * * *', $$ select avisos_ciclo() $$);

commit;
