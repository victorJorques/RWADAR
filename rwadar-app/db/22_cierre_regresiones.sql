-- =====================================================================
-- RWAdar · cierre de regresiones posteriores a las migraciones 14 y 15
-- ---------------------------------------------------------------------
-- 16_reparacion.sql volvió a abrir permisos de tabla que 14 había
-- cerrado. 17_avisos_push.sql añadió funciones sin la ACL/search_path
-- explícita exigida por 15. Esta migración restaura esas invariantes sin
-- borrar opiniones, emisiones, dispositivos ni avisos pendientes.
--
-- Requiere 14, 15, 17 y 18-21. Es transaccional e idempotente.
-- =====================================================================
begin;

-- Fallar antes de tocar nada si la cadena previa está incompleta.
do $$
begin
  if to_regclass('public.opiniones') is null
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'opiniones'
          and column_name = 'opinion_id'
     )
     or to_regprocedure('public.limpiar_dispositivos_inactivos(integer)') is null then
    raise exception 'falta 14_seguridad_integral.sql';
  end if;
  if to_regclass('public.avisos_push') is null
     or to_regprocedure('public.push_confirmar()') is null then
    raise exception 'falta 17_avisos_push.sql';
  end if;
  if to_regclass('public.emisiones') is null
     or to_regclass('public.emisiones_publicas') is null
     or not exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'emisiones'
          and column_name = 'continua'
     ) then
    raise exception 'falta completar 18-21 de emisiones';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 1 · Revierte exactamente la reapertura accidental de la migración 16
-- ---------------------------------------------------------------------
drop function if exists public.moderar(uuid, uuid, text, text);

create or replace function public.moderar(
  p_opinion_id uuid, p_accion text, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

-- El grant general anula cualquier restricción por columna. Se retira
-- primero y solo después se recompone el contrato mínimo de lectura.
revoke all on table public.opiniones from anon, authenticated;
revoke all on table public.denuncias from anon, authenticated;

grant select (opinion_id, plataforma_id, nota, texto, estado,
              creado_el, actualizado_el, autor_publico)
  on public.opiniones to anon;
grant select (opinion_id, plataforma_id, nota, texto, estado, denuncias,
              creado_el, actualizado_el, autor_publico)
  on public.opiniones to authenticated;
grant select (opinion_id, motivo, creado_el)
  on public.denuncias to authenticated;

drop policy if exists "opinar en nombre propio" on public.opiniones;
drop policy if exists "editar la propia" on public.opiniones;
drop policy if exists "borrar la propia" on public.opiniones;
drop policy if exists "denunciar" on public.denuncias;
drop policy if exists "ver las denuncias propias" on public.denuncias;

drop policy if exists "las opiniones visibles se leen" on public.opiniones;
create policy "las opiniones visibles se leen" on public.opiniones
  for select to anon, authenticated using (estado = 'visible');
drop policy if exists "cada cual ve la suya" on public.opiniones;
create policy "cada cual ve la suya" on public.opiniones
  for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "el administrador lo ve todo" on public.opiniones;
create policy "el administrador lo ve todo" on public.opiniones
  for select to authenticated using (es_admin());
drop policy if exists "el administrador ve las denuncias" on public.denuncias;
create policy "el administrador ve las denuncias" on public.denuncias
  for select to authenticated using (es_admin());

revoke update on table public.perfiles from anon, authenticated;
grant update (nombre, avisos_correo) on public.perfiles to authenticated;

revoke select on table public.moderacion from authenticated;
grant select (id, moderador_id, opinion_id, plataforma_id,
              accion, motivo, creado_el)
  on public.moderacion to authenticated;

-- ---------------------------------------------------------------------
-- 2 · Proyecciones invocadoras sin identificadores personales
-- ---------------------------------------------------------------------
create or replace view public.opiniones_publicas
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         o.autor_publico as autor,
         o.nota, o.texto, o.creado_el,
         (o.actualizado_el > o.creado_el + interval '1 minute') as editada,
         o.opinion_id
    from public.opiniones o
    join public.plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible';

create or replace view public.nota_media
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         count(*)::int as opiniones,
         case when count(*) >= 3 then round(avg(o.nota)::numeric, 1) end as media
    from public.opiniones o
    join public.plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible'
   group by o.plataforma_id, p.nombre;

create or replace view public.mis_opiniones
with (security_invoker = true) as
  select o.opinion_id, o.plataforma_id, o.nota, o.texto,
         o.estado, o.denuncias, o.creado_el, o.actualizado_el
    from public.opiniones o
   where es_opinion_propia(o.opinion_id);

create or replace view public.cola_moderacion
with (security_invoker = true) as
  select o.opinion_id, o.plataforma_id,
         p.nombre as plataforma,
         o.autor_publico as autor,
         o.nota, o.texto, o.estado, o.denuncias, o.creado_el,
         (select array_agg(coalesce(d.motivo, 'sin motivo') order by d.creado_el)
            from public.denuncias d where d.opinion_id = o.opinion_id) as motivos
    from public.opiniones o
    join public.plataformas p on p.id = o.plataforma_id
   where (o.denuncias > 0 or o.estado = 'oculta')
     and es_admin()
   order by o.denuncias desc, o.creado_el desc;

grant select on public.opiniones_publicas, public.nota_media
  to anon, authenticated;
grant select on public.mis_opiniones, public.cola_moderacion
  to authenticated;

alter view public.radar_publico set (security_invoker = true);
alter view public.descartadas_sin_fuente set (security_invoker = true);
alter view public.avisos_pendientes set (security_invoker = true);
alter view public.avisos_correo_pendientes set (security_invoker = true);
alter view public.mi_perfil set (security_invoker = true);
alter view public.emisiones_publicas set (security_invoker = true);
alter view public.emisiones_rancias set (security_invoker = true);

-- ---------------------------------------------------------------------
-- 3 · Dispositivos: el identificador aleatorio actúa como credencial bearer
-- ---------------------------------------------------------------------
-- La app genera inst_ + UUID y lo guarda en Keychain/Keystore. Rechazar
-- cabeceras débiles evita que una instalación nueva elija identificadores
-- triviales; filas históricas quedan para la limpieza de 180 días.
create or replace function public.instalacion_actual() returns text
language sql stable set search_path = public, pg_temp as $$
  select case when v ~ '^inst_[A-Za-z0-9_-]{8,80}$' then v end
    from (select nullif(
      current_setting('request.headers', true)::json ->> 'x-instalacion',
      ''
    ) as v) cabecera
$$;

drop policy if exists "el dispositivo se ve a si mismo" on public.dispositivos;
create policy "el dispositivo se ve a si mismo" on public.dispositivos
  for select to anon, authenticated
  using (instalacion = instalacion_actual());

drop policy if exists "el dispositivo se registra" on public.dispositivos;
create policy "el dispositivo se registra" on public.dispositivos
  for insert to anon, authenticated
  with check (
    instalacion = instalacion_actual()
    and (token_push is null or token_push ~
      '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{8,220}\]$')
    and (version_app is null or length(version_app) between 1 and 50)
    and visto_el between now() - interval '1 day' and now() + interval '5 minutes'
  );

drop policy if exists "el dispositivo se actualiza" on public.dispositivos;
create policy "el dispositivo se actualiza" on public.dispositivos
  for update to anon, authenticated
  using (instalacion = instalacion_actual())
  with check (
    instalacion = instalacion_actual()
    and (token_push is null or token_push ~
      '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{8,220}\]$')
    and (version_app is null or length(version_app) between 1 and 50)
    and visto_el between now() - interval '1 day' and now() + interval '5 minutes'
  );

drop policy if exists "el dispositivo se borra" on public.dispositivos;
create policy "el dispositivo se borra" on public.dispositivos
  for delete to anon, authenticated
  using (instalacion = instalacion_actual());

drop policy if exists "seguimiento propio visible" on public.seguimiento;
create policy "seguimiento propio visible" on public.seguimiento
  for select to anon, authenticated
  using (instalacion = instalacion_actual());
drop policy if exists "seguimiento propio se anade" on public.seguimiento;
create policy "seguimiento propio se anade" on public.seguimiento
  for insert to anon, authenticated
  with check (instalacion = instalacion_actual());
drop policy if exists "seguimiento propio se quita" on public.seguimiento;
create policy "seguimiento propio se quita" on public.seguimiento
  for delete to anon, authenticated
  using (instalacion = instalacion_actual());

-- Los grants de tabla de 04 permitían escribir también columnas futuras.
-- Se conserva SELECT/DELETE de la fila propia y se enumeran las columnas de
-- alta/actualización que usa realmente la app.
revoke all on table public.dispositivos from anon, authenticated;
grant select, delete on table public.dispositivos to anon, authenticated;
grant insert (instalacion, token_push, sistema, version_app, visto_el)
  on public.dispositivos to anon, authenticated;
grant update (instalacion, token_push, sistema, version_app, visto_el)
  on public.dispositivos to anon, authenticated;

revoke all on table public.seguimiento from anon, authenticated;
grant select, delete on table public.seguimiento to anon, authenticated;
grant insert (instalacion, plataforma_id)
  on public.seguimiento to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4 · Push: ticket + recibo real, ACL cerrada y token mínimo
-- ---------------------------------------------------------------------
create table if not exists public.push_configuracion (
  singleton    boolean primary key default true check (singleton),
  habilitado   boolean not null default false,
  activado_el  timestamptz,
  activado_por text
);
-- Reaplicar el cierre siempre vuelve al estado seguro. La activación no forma
-- parte de esta migración y debe repetirse mediante su flujo opt-in.
insert into public.push_configuracion
  (singleton, habilitado, activado_el, activado_por)
values (true, false, null, null)
on conflict (singleton) do update
  set habilitado = false, activado_el = null, activado_por = null;
alter table public.push_configuracion enable row level security;
revoke all on table public.push_configuracion from public, anon, authenticated;

alter table public.avisos_push alter column token drop not null;
alter table public.avisos_push add column if not exists ticket_id text;
alter table public.avisos_push add column if not exists ticket_el timestamptz;
alter table public.avisos_push add column if not exists peticion_el timestamptz;
alter table public.avisos_push add column if not exists recibo_consultado_el timestamptz;
alter table public.avisos_push enable row level security;

create unique index if not exists avisos_push_ticket_unico
  on public.avisos_push (ticket_id) where ticket_id is not null;

-- Al pasar al estado apagado no se reanuda trabajo heredado sin una nueva
-- decisión E2E. Se minimizan también los tokens de filas pendientes.
update public.avisos_push
   set token = null,
       intentos = 5,
       error = 'Push desactivado por cierre 22',
       peticion_id = null,
       peticion_el = null
 where enviado_el is null and intentos < 5;
-- Filas antiguas ya terminales tampoco conservan una copia del token.
update public.avisos_push set token = null
 where token is not null and (enviado_el is not null or intentos >= 5);
update public.avisos_push set peticion_el = coalesce(peticion_el, creado_el)
 where peticion_id is not null and enviado_el is null and peticion_el is null;

create or replace function public.encola_avisos_push() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select habilitado from push_configuracion where singleton), false) then
    return new;
  end if;
  insert into avisos_push (cambio_id, instalacion, token)
  select new.id, d.instalacion, d.token_push
    from seguimiento s
    join dispositivos d on d.instalacion = s.instalacion
   where s.plataforma_id = new.plataforma_id
     and d.token_push is not null
  on conflict do nothing;
  return new;
end $$;

create or replace function public.push_soltar(p_tanda integer default 50)
returns integer
language plpgsql security definer set search_path = public, net, pg_temp as $$
declare r record; v_id bigint; n integer := 0;
begin
  if not coalesce((select habilitado from push_configuracion where singleton), false) then
    raise exception using errcode = '55000',
      message = 'push desactivado; requiere activar-push.cmd después de validar E2E';
  end if;
  if p_tanda is null or p_tanda not between 1 and 100 then
    raise exception using errcode = '22023', message = 'la tanda debe estar entre 1 y 100';
  end if;

  -- Una llamada de pg_net sin respuesta se libera para reintentar. En la
  -- fase de recibo nunca se reenvía el push: solo se vuelve a consultar el
  -- mismo ticket, evitando entregas duplicadas.
  update avisos_push a
     set peticion_id = null,
         peticion_el = null,
         error = case when a.ticket_id is null
                      then 'Sin respuesta de Expo al enviar'
                      else 'Sin respuesta de Expo al consultar el recibo' end,
         token = case when a.ticket_id is null and a.intentos >= 5
                      then null else a.token end
   where a.enviado_el is null and a.peticion_id is not null
     and a.peticion_el < now() - interval '15 minutes'
     and not exists (
       select 1 from net._http_response x where x.id = a.peticion_id
     );

  -- Expo elimina los recibos al cabo de 24 horas. Un ticket que agotó esa
  -- ventana termina con error explícito, nunca como una entrega inventada.
  update avisos_push
     set intentos = 5, error = 'Recibo de Expo caducado', token = null,
         peticion_id = null, peticion_el = null
   where enviado_el is null and ticket_id is not null
     and ticket_el < now() - interval '24 hours';

  -- Primero se consultan tickets aceptados hace al menos 15 minutos, tal y
  -- como recomienda Expo. Una petición contiene un único ticket para que la
  -- asociación fila/resultado sea inequívoca.
  for r in
    select a.id, a.ticket_id
      from avisos_push a
     where a.enviado_el is null and a.ticket_id is not null
       and a.peticion_id is null and a.intentos < 5
       and a.ticket_el <= now() - interval '15 minutes'
       and (a.recibo_consultado_el is null
            or a.recibo_consultado_el <= now() - interval '15 minutes')
     order by a.ticket_el
     limit p_tanda
     for update of a skip locked
  loop
    select net.http_post(
      url     := 'https://exp.host/--/api/v2/push/getReceipts',
      headers := jsonb_build_object('content-type', 'application/json',
                                    'accept', 'application/json'),
      body    := jsonb_build_object('ids', jsonb_build_array(r.ticket_id))
    ) into v_id;
    update avisos_push
       set peticion_id = v_id, peticion_el = now(),
           recibo_consultado_el = now(), error = null
     where id = r.id;
    n := n + 1;
  end loop;

  -- Un token puede desaparecer o rotar mientras el aviso espera. Para un
  -- envío todavía no aceptado se toma siempre el valor actual del dispositivo.
  update avisos_push a
     set intentos = 5, error = 'Sin token activo', token = null
   where a.enviado_el is null and a.peticion_id is null and a.intentos < 5
     and a.ticket_id is null
     and not exists (
       select 1 from dispositivos d
        where d.instalacion = a.instalacion and d.token_push is not null
     );

  for r in
    select a.id, d.token_push as token,
           c.titular, c.detalle, c.plataforma_id, p.slug
      from avisos_push a
      join dispositivos d on d.instalacion = a.instalacion
      join cambios_estado c on c.id = a.cambio_id
      join plataformas p on p.id = c.plataforma_id
     where a.enviado_el is null and a.peticion_id is null
       and a.ticket_id is null and a.intentos < 5
       and d.token_push is not null
     order by a.creado_el
     limit greatest(p_tanda - n, 0)
     for update of a skip locked
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
        'data',     jsonb_build_object('slug', r.slug, 'plataforma_id', r.plataforma_id))
    ) into v_id;
    update avisos_push
       set peticion_id = v_id, peticion_el = now(),
           intentos = intentos + 1, token = r.token, error = null
     where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.push_confirmar()
returns integer
language plpgsql security definer set search_path = public, net, pg_temp as $$
declare
  r record;
  n integer := 0;
  v_payload jsonb;
  v_resultado jsonb;
  v_estado text;
  v_error text;
  v_ticket_id text;
begin
  if not coalesce((select habilitado from push_configuracion where singleton), false) then
    raise exception using errcode = '55000',
      message = 'push desactivado; requiere activar-push.cmd después de validar E2E';
  end if;
  for r in
    select a.id, a.instalacion, a.token, a.ticket_id, a.peticion_id,
           x.status_code, x.content, x.error_msg
      from avisos_push a
      left join net._http_response x on x.id = a.peticion_id
     where a.enviado_el is null and a.peticion_id is not null
     for update of a skip locked
  loop
    if r.status_code is null and r.error_msg is null then
      continue;
    end if;

    v_payload := null;
    v_resultado := null;
    v_estado := null;
    v_error := null;
    v_ticket_id := null;
    if r.status_code between 200 and 299 then
      begin
        v_payload := r.content::jsonb;
        if r.ticket_id is null then
          -- Expo admite para un destinatario tanto objeto como array de uno.
          v_resultado := case jsonb_typeof(v_payload -> 'data')
            when 'array' then v_payload -> 'data' -> 0
            else v_payload -> 'data'
          end;
        else
          -- Los recibos son un mapa indexado por el identificador del ticket.
          v_resultado := v_payload -> 'data' -> r.ticket_id;
        end if;
        v_estado := v_resultado ->> 'status';
        v_error  := v_resultado -> 'details' ->> 'error';
        v_ticket_id := v_resultado ->> 'id';
      exception when others then
        v_estado := null;
      end;
    end if;

    if r.ticket_id is null then
      if v_estado = 'ok' and v_ticket_id is not null then
        -- Ticket aceptado != entrega. Se conserva el token solo hasta poder
        -- consultar el recibo real a FCM/APNs.
        update avisos_push
           set ticket_id = v_ticket_id, ticket_el = now(),
               peticion_id = null, peticion_el = null, error = null,
               -- Los intentos limitan reenvíos, no consultas del recibo. Si
               -- el quinto envío obtiene ticket, todavía debe poder verificarse.
               intentos = 0
         where id = r.id;
      elsif v_error = 'DeviceNotRegistered' then
        update avisos_push
           set intentos = 5, error = 'DeviceNotRegistered', token = null,
               peticion_id = null, peticion_el = null
         where id = r.id;
        -- No borrar un token nuevo que la app haya rotado mientras esta
        -- petición estaba en vuelo: solo se invalida el que recibió Expo.
        update dispositivos
           set token_push = null
         where instalacion = r.instalacion and token_push = r.token;
      else
        update avisos_push
           set peticion_id = null, peticion_el = null,
               error = coalesce(
                 r.error_msg, v_error, v_estado,
                 v_payload -> 'errors' -> 0 ->> 'code',
                 v_payload -> 'errors' -> 0 ->> 'message',
                 'HTTP ' || coalesce(r.status_code::text, '?')
               ),
               token = case when intentos >= 5 then null else token end
         where id = r.id;
      end if;
    else
      if v_estado = 'ok' then
        update avisos_push
           set enviado_el = now(), error = null, token = null,
               peticion_id = null, peticion_el = null
         where id = r.id;
        n := n + 1;
      elsif v_error = 'DeviceNotRegistered' then
        update avisos_push
           set intentos = 5, error = 'DeviceNotRegistered', token = null,
               peticion_id = null, peticion_el = null
         where id = r.id;
        update dispositivos
           set token_push = null
         where instalacion = r.instalacion and token_push = r.token;
      elsif v_estado = 'error' then
        -- Un recibo negativo es definitivo para esta notificación. Reenviarla
        -- podría duplicarla y no corrige credenciales/payload defectuosos.
        update avisos_push
           set intentos = 5,
               error = coalesce(v_error, 'Error definitivo del recibo'),
               token = null, peticion_id = null, peticion_el = null
         where id = r.id;
      else
        -- Recibo aún ausente, respuesta ilegible o fallo HTTP: se consulta de
        -- nuevo, pero nunca se vuelve a mandar la notificación.
        update avisos_push
           set peticion_id = null, peticion_el = null,
               error = coalesce(
                 r.error_msg,
                 v_payload -> 'errors' -> 0 ->> 'code',
                 v_payload -> 'errors' -> 0 ->> 'message',
                 case when r.status_code between 200 and 299
                      then 'Recibo pendiente'
                      else 'HTTP ' || coalesce(r.status_code::text, '?') end
               )
         where id = r.id;
      end if;
    end if;
  end loop;

  -- Defensa de privacidad independiente de todas las ramas anteriores.
  update avisos_push set token = null
   where token is not null and (enviado_el is not null or intentos >= 5);

  update cambios_estado c set notificado_el = now()
   where c.notificado_el is null
     and exists (select 1 from avisos_push a where a.cambio_id = c.id)
     and not exists (
       select 1 from avisos_push a
        where a.cambio_id = c.id and a.enviado_el is null and a.intentos < 5
     );

  -- El token ya se minimiza al finalizar; el resto del rastro operativo
  -- también desaparece cuando deja de ser útil.
  delete from avisos_push
   where (enviado_el is not null or intentos >= 5)
     and creado_el < now() - interval '30 days';
  return n;
end $$;

create or replace function public.push_ciclo() returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare c integer; s integer;
begin
  if not coalesce((select habilitado from push_configuracion where singleton), false) then
    raise exception using errcode = '55000',
      message = 'push desactivado; requiere activar-push.cmd después de validar E2E';
  end if;
  c := push_confirmar();
  s := push_soltar();
  return format('confirmados %s, soltados %s', c, s);
end $$;

-- El cierre y cualquier recuperación permanecen apagados. Solo el artefacto
-- opt-in agenda el cron después de una validación E2E explícita. Se retiran
-- también relojes renombrados: el nombre no es una frontera de seguridad.
do $$
declare v_job record;
begin
  for v_job in
    select jobname
      from cron.job
     where jobname = 'rwadar-push'
        or lower(coalesce(command, '')) like '%push_ciclo%'
        or lower(coalesce(command, '')) like '%push_soltar%'
        or lower(coalesce(command, '')) like '%push_confirmar%'
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5 · Correo heredado: capacidad conservada como bloqueo, salida apagada
-- ---------------------------------------------------------------------
-- 13/16 podían dejar un cron de Brevo activo. El acuerdo con el proveedor y
-- el consentimiento operativo siguen pendientes, así que 22 no debe confiar
-- ni en el nombre histórico del reloj ni en la ausencia de secretos del vault.
-- Las firmas se conservan para no romper dependencias, pero quedan fail-closed
-- y no tocan la cola ni realizan red. Reaplicar 22 restaura siempre este estado.
create or replace function public.avisos_soltar(p_tanda integer default 20)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre 22; requiere un opt-in separado';
end $$;

create or replace function public.avisos_confirmar()
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre 22; requiere un opt-in separado';
end $$;

create or replace function public.avisos_ciclo()
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  raise exception using errcode = '55000',
    message = 'correo desactivado por cierre 22; requiere un opt-in separado';
end $$;

-- Retira también relojes renombrados que invoquen cualquiera de las rutas
-- heredadas. No se elimina ni altera ninguna fila de avisos_correo.
do $$
declare v_job record;
begin
  for v_job in
    select jobname
      from cron.job
     where jobname = 'rwadar-avisos'
        or lower(coalesce(command, '')) like '%avisos_ciclo%'
        or lower(coalesce(command, '')) like '%avisos_soltar%'
        or lower(coalesce(command, '')) like '%avisos_confirmar%'
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end $$;

revoke all on function public.avisos_soltar(integer)
  from public, anon, authenticated;
revoke all on function public.avisos_confirmar()
  from public, anon, authenticated;
revoke all on function public.avisos_ciclo()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6 · Retención real: reloj diario independiente y ejecución acotada
-- ---------------------------------------------------------------------
create table if not exists public.retencion_dispositivos_estado (
  singleton        boolean primary key default true check (singleton),
  ultima_ejecucion timestamptz,
  ultimo_borrados  integer not null default 0 check (ultimo_borrados >= 0),
  total_borrados   bigint not null default 0 check (total_borrados >= 0),
  quedan_vencidos  boolean not null default false
);
insert into public.retencion_dispositivos_estado(singleton)
values (true) on conflict (singleton) do nothing;
alter table public.retencion_dispositivos_estado enable row level security;
revoke all on table public.retencion_dispositivos_estado
  from public, anon, authenticated;

create or replace function public.retencion_dispositivos_ciclo(
  p_lotes integer default 10,
  p_por_lote integer default 1000
) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_lote integer;
  v_total integer := 0;
  v_indice integer;
  v_quedan boolean;
begin
  if p_lotes is null or p_lotes not between 1 and 50 then
    raise exception using errcode = '22023',
      message = 'los lotes deben estar entre 1 y 50';
  end if;
  if p_por_lote is null or p_por_lote not between 1 and 1000 then
    raise exception using errcode = '22023',
      message = 'el tamaño de lote debe estar entre 1 y 1000';
  end if;

  for v_indice in 1..p_lotes loop
    v_lote := limpiar_dispositivos_inactivos(p_por_lote);
    v_total := v_total + v_lote;
    exit when v_lote < p_por_lote;
  end loop;

  select exists (
    select 1 from dispositivos
     where visto_el < now() - interval '180 days'
  ) into v_quedan;

  insert into retencion_dispositivos_estado
    (singleton, ultima_ejecucion, ultimo_borrados, total_borrados, quedan_vencidos)
  values (true, now(), v_total, v_total, v_quedan)
  on conflict (singleton) do update
    set ultima_ejecucion = excluded.ultima_ejecucion,
        ultimo_borrados = excluded.ultimo_borrados,
        total_borrados = retencion_dispositivos_estado.total_borrados
                         + excluded.ultimo_borrados,
        quedan_vencidos = excluded.quedan_vencidos;
  return v_total;
end $$;

-- Evita que un reloj renombrado convierta la limpieza acotada en varias
-- ejecuciones diarias. Tras este bloque queda exactamente el reloj canónico.
do $$
declare v_job record;
begin
  for v_job in
    select jobname
      from cron.job
     where jobname = 'rwadar-retencion-dispositivos'
        or lower(coalesce(command, '')) like '%retencion_dispositivos_ciclo%'
  loop
    perform cron.unschedule(v_job.jobname);
  end loop;
end $$;
select cron.schedule(
  'rwadar-retencion-dispositivos',
  '17 3 * * *',
  $$ select retencion_dispositivos_ciclo() $$
);

-- ---------------------------------------------------------------------
-- 7 · ACL explícita y search_path fijo para todo lo expuesto/interno
-- ---------------------------------------------------------------------
-- Recompone el contrato de lectura/escritura completo. Esto hace que 22 sea
-- también la salida verificable de un cierre de emergencia previo, sin
-- depender de reaplicar migraciones históricas no idempotentes.
grant usage on schema public to anon, authenticated;
grant select on public.categorias, public.regiones, public.plataformas,
                public.fuentes, public.cambios_estado
  to anon, authenticated;
grant select on public.radar_publico to anon, authenticated;

grant select on public.perfiles to authenticated;
revoke all on table public.vigilancia from anon, authenticated;
grant select, delete on table public.vigilancia to authenticated;
grant insert (usuario_id, plataforma_id)
  on public.vigilancia to authenticated;
grant select on public.avisos_correo to authenticated;
grant select on public.mi_perfil to authenticated;

grant select on public.emisiones, public.emisiones_publicas,
                public.emisiones_rancias
  to anon, authenticated;

alter function public.toca_actualizada_el() set search_path = public, pg_temp;
alter function public.registra_cambio_estado() set search_path = public, pg_temp;
alter function public.instalacion_actual() set search_path = public, pg_temp;
alter function public.encola_avisos_correo() set search_path = public, pg_temp;
alter function public.emision_de_plataforma_en_radar() set search_path = public, pg_temp;
alter function public.cerrar_emisiones_al_descartar() set search_path = public, pg_temp;
alter function public.retencion_dispositivos_ciclo(integer, integer)
  set search_path = public, pg_temp;
alter function public.borrar_mi_cuenta() set search_path = public, auth, pg_temp;

-- 22 conserva las firmas del correo como bloqueos fail-closed. No deben
-- recuperar `net` ni `vault` en el search_path al recomponer las ACL.
alter function public.avisos_soltar(integer)
  set search_path = public, pg_temp;
alter function public.avisos_confirmar()
  set search_path = public, pg_temp;
alter function public.avisos_ciclo()
  set search_path = public, pg_temp;
revoke all on function public.avisos_soltar(integer)
  from public, anon, authenticated;
revoke all on function public.avisos_confirmar()
  from public, anon, authenticated;
revoke all on function public.avisos_ciclo()
  from public, anon, authenticated;

revoke all on function public.crea_perfil() from public, anon, authenticated;
revoke all on function public.protege_privilegio_admin() from public, anon, authenticated;
revoke all on function public.toca_actualizada_el() from public, anon, authenticated;
revoke all on function public.registra_cambio_estado() from public, anon, authenticated;
revoke all on function public.encola_avisos_correo() from public, anon, authenticated;
revoke all on function public.toca_opinion() from public, anon, authenticated;
revoke all on function public.sincroniza_autor_opiniones() from public, anon, authenticated;
revoke all on function public.protege_opiniones_directas() from public, anon, authenticated;
revoke all on function public.revisa_denuncias() from public, anon, authenticated;
revoke all on function public.protege_denuncias_directas() from public, anon, authenticated;
revoke all on function public.limpia_dispositivos_oportunista() from public, anon, authenticated;
revoke all on function public.encola_avisos_push() from public, anon, authenticated;
revoke all on function public.push_soltar(integer) from public, anon, authenticated;
revoke all on function public.push_confirmar() from public, anon, authenticated;
revoke all on function public.push_ciclo() from public, anon, authenticated;
revoke all on function public.retencion_dispositivos_ciclo(integer, integer)
  from public, anon, authenticated;
revoke all on function public.emision_de_plataforma_en_radar() from public, anon, authenticated;
revoke all on function public.cerrar_emisiones_al_descartar() from public, anon, authenticated;

revoke all on function public.establecer_admin(uuid, boolean) from public, anon, authenticated;
grant execute on function public.establecer_admin(uuid, boolean) to service_role;
revoke all on function public.limpiar_dispositivos_inactivos(integer) from public, anon, authenticated;
grant execute on function public.limpiar_dispositivos_inactivos(integer) to service_role;
grant execute on function public.retencion_dispositivos_ciclo(integer, integer)
  to service_role;
grant select on table public.retencion_dispositivos_estado to service_role;

revoke all on function public.borrar_mi_cuenta() from public, anon;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.guardar_opinion(uuid, integer, text) from public, anon;
revoke all on function public.borrar_mi_opinion(uuid) from public, anon;
revoke all on function public.denunciar_opinion(uuid, text) from public, anon;
revoke all on function public.moderar(uuid, text, text) from public, anon;
revoke all on function public.es_opinion_propia(uuid) from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.guardar_opinion(uuid, integer, text) to authenticated;
grant execute on function public.borrar_mi_opinion(uuid) to authenticated;
grant execute on function public.denunciar_opinion(uuid, text) to authenticated;
grant execute on function public.moderar(uuid, text, text) to authenticated;
grant execute on function public.es_opinion_propia(uuid) to authenticated;

revoke all on function public.instalacion_actual() from public;
grant execute on function public.instalacion_actual() to anon, authenticated;

revoke all on table public.avisos_push from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
