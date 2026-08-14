-- =====================================================================
-- RWAdar · el envío de los avisos PUSH
-- ---------------------------------------------------------------------
-- Esta es *la* función que justifica que exista la app, y hasta hoy era
-- la única pieza que faltaba: la base ya sabía a quién avisar
-- (`avisos_pendientes`, en 03_app.sql) y no había nadie que lo mandara.
--
-- POR QUÉ AHORA Y NO ANTES
--
-- Hacía falta el `projectId` de EAS: sin él la app no puede pedir un
-- token push, así que `dispositivos.token_push` estaba siempre vacío y
-- esto no habría tenido a quién escribir. El projectId existe desde el
-- 14 de agosto de 2026.
--
-- POR QUÉ PUSH ANTES QUE CORREO
--
-- El push no depende de nadie: la API de Expo no exige clave para un
-- proyecto normal, así que esto funciona **sin cuentas de terceros y sin
-- configurar nada**. El correo (16_reparacion.sql) necesita Brevo. Los
-- dos caminos conviven: al móvil por push, a quien solo usa la web por
-- correo.
--
-- MISMA ARQUITECTURA DE DOS FASES QUE EL CORREO, Y POR EL MISMO MOTIVO
--
-- `pg_net` es asíncrono: devuelve un identificador y responde después.
-- Dar por enviado lo que solo está encolado perdería avisos en silencio,
-- justo en el producto cuyo valor entero es avisar. Se marca solo cuando
-- el proveedor responde 2xx; lo que falla vuelve a la cola.
--
-- Depende de 01_schema.sql y 03_app.sql. Es idempotente.
-- =====================================================================
begin;

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------
-- 1 · La cola, una fila por dispositivo y cambio
-- ---------------------------------------------------------------------
-- No basta con marcar el cambio como «notificado»: si hay diez móviles
-- siguiendo una plataforma y falla el envío a uno, hay que reintentar
-- ese y no los diez. Por eso la unidad es (cambio, dispositivo).
create table if not exists avisos_push (
  id           bigint generated always as identity primary key,
  cambio_id    bigint not null references cambios_estado(id) on delete cascade,
  instalacion  text   not null references dispositivos(instalacion) on delete cascade,
  token        text   not null,
  enviado_el   timestamptz,
  peticion_id  bigint,
  intentos     smallint not null default 0,
  error        text,
  creado_el    timestamptz not null default now(),
  unique (cambio_id, instalacion)
);

create index if not exists avisos_push_por_enviar
  on avisos_push (creado_el)
  where enviado_el is null and peticion_id is null and intentos < 5;

-- ---------------------------------------------------------------------
-- 2 · Encolar solo: nadie tiene que acordarse de disparar el aviso
-- ---------------------------------------------------------------------
create or replace function encola_avisos_push() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into avisos_push (cambio_id, instalacion, token)
  select new.id, d.instalacion, d.token_push
    from seguimiento s
    join dispositivos d on d.instalacion = s.instalacion
   where s.plataforma_id = new.plataforma_id
     and d.token_push is not null
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists cambios_encolan_push on cambios_estado;
create trigger cambios_encolan_push
  after insert on cambios_estado
  for each row execute function encola_avisos_push();

-- ---------------------------------------------------------------------
-- 3 · Paso uno: soltar
-- ---------------------------------------------------------------------
-- Una petición por dispositivo. Expo admite lotes de hasta 100 mensajes
-- y sería más eficiente, pero con un lote un solo token caducado
-- devuelve un error en mitad de la respuesta y hay que desenredar cuál
-- de los cien falló. Los cambios de estado de este registro se cuentan
-- con los dedos de una mano al año: la simplicidad vale más que el
-- ahorro de peticiones.
create or replace function push_soltar(p_tanda int default 50)
returns int language plpgsql security definer set search_path = public, net as $$
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
end $$;

-- ---------------------------------------------------------------------
-- 4 · Paso dos: comprobar qué llegó de verdad
-- ---------------------------------------------------------------------
-- Expo puede responder 200 y aun así haber fallado: el estado real viene
-- dentro del cuerpo, en data.status. Y si dice DeviceNotRegistered, ese
-- token está muerto —app desinstalada, permisos revocados— y hay que
-- borrarlo o se reintentará eternamente contra un móvil que ya no está.
create or replace function push_confirmar()
returns int language plpgsql security definer set search_path = public, net as $$
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
end $$;

create or replace function push_ciclo() returns text
language plpgsql security definer set search_path = public as $$
declare c int; s int;
begin
  c := push_confirmar(); s := push_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $$;

revoke all on function push_soltar(int)   from public, anon, authenticated;
revoke all on function push_confirmar()   from public, anon, authenticated;
revoke all on function push_ciclo()       from public, anon, authenticated;

-- La cola es cosa del servidor: un dispositivo no tiene por qué saber a
-- cuántos más se está avisando.
revoke all on table avisos_push from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5 · El reloj
-- ---------------------------------------------------------------------
-- Cada dos minutos, no cada cinco como el correo: un push es inmediato
-- por definición y es la promesa que hace la ficha de la tienda.
select cron.unschedule('rwadar-push') where exists (select 1 from cron.job where jobname = 'rwadar-push');
select cron.schedule('rwadar-push', '*/2 * * * *', $$ select push_ciclo() $$);

commit;
