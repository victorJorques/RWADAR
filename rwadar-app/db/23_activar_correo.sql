-- =====================================================================
-- RWAdar · opt-in de correo por Brevo posterior al cierre 22
-- ---------------------------------------------------------------------
-- Esta migración opcional NO forma parte del fresh-install. Solo se aplica
-- cuando Brevo, Vault, privacidad y la prueba operativa han sido aprobados.
-- Es transaccional e idempotente: si falta cualquier requisito no queda ni
-- el interruptor encendido ni un reloj parcial.
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('public.retencion_dispositivos_estado') is null
     or to_regclass('public.avisos_correo') is null
     or to_regprocedure('public.avisos_soltar(integer)') is null
     or to_regclass('cron.job') is null
     or to_regclass('vault.decrypted_secrets') is null
     or not exists (
       select 1 from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'net' and p.proname = 'http_post'
     ) then
    raise exception using errcode = '55000',
      message = 'correo opt-in: falta aplicar y verificar el cierre 22 o sus extensiones';
  end if;
end
$precondiciones$;

-- El estado operativo no contiene claves. Solo registra la decisión explícita,
-- el proveedor y el único origen autorizado para enlaces de los mensajes.
create table if not exists public.correo_configuracion (
  singleton     boolean primary key default true check (singleton),
  habilitado    boolean not null default false,
  proveedor     text not null default 'brevo' check (proveedor = 'brevo'),
  origen_https  text not null default 'https://rwadar.pages.dev'
    check (origen_https = 'https://rwadar.pages.dev'),
  activado_el   timestamptz,
  activado_por  text,
  consentimiento_version text not null default 'correo-v1-2026-08-22'
    check (consentimiento_version = 'correo-v1-2026-08-22'),
  legado_cerrado_el timestamptz,
  check (not habilitado or
         (activado_el is not null and nullif(activado_por, '') is not null))
);
insert into public.correo_configuracion(singleton)
values (true) on conflict (singleton) do nothing;
alter table public.correo_configuracion
  add column if not exists consentimiento_version text
    not null default 'correo-v1-2026-08-22';
alter table public.correo_configuracion
  add column if not exists legado_cerrado_el timestamptz;

alter table public.correo_configuracion enable row level security;
revoke all on table public.correo_configuracion
  from public, anon, authenticated, service_role;
grant select on table public.correo_configuracion to service_role;

-- El booleano histórico nacía true y no demuestra una elección afirmativa.
-- La primera aplicación de 23 lo invalida una sola vez; las reaplicaciones
-- conservan los consentimientos nuevos registrados por la RPC versionada.
alter table public.perfiles
  add column if not exists avisos_correo_aceptado_el timestamptz;
alter table public.perfiles
  add column if not exists avisos_correo_version text;
alter table public.perfiles alter column avisos_correo set default false;
do $cierra_legacy$
begin
  if (select legado_cerrado_el is null
        from public.correo_configuracion where singleton) then
    update public.perfiles
       set avisos_correo = false,
           avisos_correo_aceptado_el = null,
           avisos_correo_version = null;
    update public.correo_configuracion
       set legado_cerrado_el = clock_timestamp()
     where singleton;
  end if;
end
$cierra_legacy$;

revoke update on table public.perfiles from authenticated;
revoke update (avisos_correo, avisos_correo_aceptado_el, avisos_correo_version)
  on public.perfiles from authenticated;
grant update (nombre) on public.perfiles to authenticated;

create or replace function public.configurar_avisos_correo(
  p_habilitado boolean,
  p_version text default null
) returns table (
  habilitado boolean,
  aceptado_el timestamptz,
  version text
)
language plpgsql security definer
set search_path = public, auth, pg_temp
as $funcion$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception using errcode = '28000',
      message = 'se requiere una sesión autenticada';
  end if;
  if p_habilitado is null then
    raise exception using errcode = '22004',
      message = 'la preferencia de correo es obligatoria';
  end if;
  if p_habilitado and p_version is distinct from 'correo-v1-2026-08-22' then
    raise exception using errcode = '22023',
      message = 'versión de consentimiento de correo no válida';
  end if;

  update public.perfiles p
     set avisos_correo = p_habilitado,
         avisos_correo_aceptado_el = case when p_habilitado then now() else null end,
         avisos_correo_version = case when p_habilitado then p_version else null end
   where p.id = v_usuario;
  if not found then
    raise exception using errcode = 'P0002', message = 'perfil no encontrado';
  end if;

  return query
    select p.avisos_correo, p.avisos_correo_aceptado_el,
           p.avisos_correo_version
      from public.perfiles p where p.id = v_usuario;
end
$funcion$;
revoke all on function public.configurar_avisos_correo(boolean, text)
  from public, anon, authenticated, service_role;
grant execute on function public.configurar_avisos_correo(boolean, text)
  to authenticated;

-- La vista descifrada de Vault y las colas internas de pg_net nunca forman
-- parte de la API cliente. Las funciones SECURITY DEFINER conservan acceso
-- como propietarias; anon/authenticated no pueden leer claves ni cabeceras.
revoke all on table vault.decrypted_secrets
  from public, anon, authenticated;
do $acl_net$
begin
  if to_regclass('net.http_request_queue') is not null then
    execute 'revoke all on table net.http_request_queue from public, anon, authenticated';
  end if;
  if to_regclass('net._http_response') is not null then
    execute 'revoke all on table net._http_response from public, anon, authenticated';
  end if;
end
$acl_net$;

-- La cadena vigente excluye la migración histórica 13, así que 23 crea de
-- forma explícita las columnas operativas que necesita. peticion_el permite
-- recuperar peticiones atascadas sin reenviar inmediatamente.
alter table public.avisos_correo
  add column if not exists peticion_id bigint;
alter table public.avisos_correo
  add column if not exists peticion_el timestamptz;
alter table public.avisos_correo
  add column if not exists intentos smallint not null default 0;
alter table public.avisos_correo
  add column if not exists error text;
alter table public.avisos_correo
  add column if not exists idempotencia uuid;
alter table public.avisos_correo
  add column if not exists idempotencia_el timestamptz;
alter table public.avisos_correo
  add column if not exists proveedor_mensaje_id text;

do $limites_intentos$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.avisos_correo'::regclass
       and conname = 'avisos_correo_intentos_validos'
  ) then
    alter table public.avisos_correo
      add constraint avisos_correo_intentos_validos
      check (intentos between 0 and 5) not valid;
    alter table public.avisos_correo
      validate constraint avisos_correo_intentos_validos;
  end if;
end
$limites_intentos$;

create index if not exists avisos_correo_por_enviar_23
  on public.avisos_correo (creado_el, id)
  where enviado_el is null and peticion_id is null and intentos < 5;
create unique index if not exists avisos_correo_idempotencia_unica
  on public.avisos_correo (idempotencia) where idempotencia is not null;

-- Escapa datos editoriales o de perfil antes de interpolarlos en HTML. El
-- orden es importante: primero &, para no volver a escapar las entidades.
create or replace function public.correo_html_escapar(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = pg_catalog, pg_temp
as $funcion$
  select replace(
           replace(
             replace(
               replace(
                 replace(p_texto, '&', '&amp;'),
                 '<', '&lt;'),
               '>', '&gt;'),
             '"', '&quot;'),
           '''', '&#39;')
$funcion$;

-- Las credenciales se leen dentro de la función SECURITY DEFINER y nunca se
-- devuelven ni se copian a tablas públicas. Cada ruta de salida consulta el
-- interruptor antes de tocar Vault, net o la cola.
create or replace function public.avisos_soltar(p_tanda integer default 20)
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $funcion$
declare
  v_clave text;
  v_remitente text;
  v_origen text;
  v_activado_el timestamptz;
  v_peticion bigint;
  v_idempotencia uuid;
  v_idempotencia_el timestamptz;
  v_total integer := 0;
  r record;
begin
  if p_tanda is null or p_tanda not between 1 and 100 then
    raise exception using errcode = '22023',
      message = 'la tanda de correo debe estar entre 1 y 100';
  end if;

  select origen_https, activado_el
    into v_origen, v_activado_el
    from public.correo_configuracion
   where singleton and habilitado;
  if not found or v_activado_el is null then
    raise exception using errcode = '55000',
      message = 'correo desactivado; requiere el opt-in 23 verificado';
  end if;
  if v_origen <> 'https://rwadar.pages.dev' then
    raise exception using errcode = '55000',
      message = 'correo bloqueado: origen HTTPS no autorizado';
  end if;

  select max(decrypted_secret) filter (where name = 'BREVO_API_KEY'),
         max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE')
    into v_clave, v_remitente
    from vault.decrypted_secrets
   where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
  if length(trim(coalesce(v_clave, ''))) < 20
     or trim(coalesce(v_remitente, '')) !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'correo bloqueado: credenciales Brevo/Vault ausentes o inválidas';
  end if;

  -- Nunca se dispara de golpe la cola creada mientras el servicio estaba
  -- apagado. Se conserva el rastro, pero queda terminal y auditable.
  update public.avisos_correo
     set intentos = 5,
         peticion_id = null,
         peticion_el = null,
         error = 'No enviado: anterior a la activación de correo'
   where enviado_el is null and intentos < 5
     and creado_el < v_activado_el;

  -- Respeta una baja posterior al encolado y evita entregar a una dirección
  -- que Auth todavía no haya confirmado.
  update public.avisos_correo a
     set intentos = 5,
         peticion_id = null,
         peticion_el = null,
         error = 'No enviado: avisos desactivados o correo sin confirmar'
   where a.enviado_el is null and a.intentos < 5
     and (
       not exists (
         select 1 from public.perfiles p
          where p.id = a.usuario_id and p.avisos_correo
            and p.avisos_correo_aceptado_el is not null
            and p.avisos_correo_version = 'correo-v1-2026-08-22'
       )
       or not exists (
         select 1 from auth.users u
          where u.id = a.usuario_id
            and u.email_confirmed_at is not null
            and nullif(trim(u.email), '') is not null
       )
       or not exists (
         select 1
           from public.cambios_estado c
           join public.vigilancia v
             on v.usuario_id = a.usuario_id
            and v.plataforma_id = c.plataforma_id
          where c.id = a.cambio_id
       )
     );

  -- Una petición de pg_net sin respuesta durante 10 minutos vuelve a cola con
  -- la MISMA clave idempotente. Así el reintento cae dentro del TTL actual de
  -- Brevo (30 minutos) y no duplica un correo que sí hubiese sido aceptado.
  -- Si tampoco llegan las respuestas de los reintentos, jamás se vuelve a
  -- enviar al alcanzar 25 minutos desde el primer POST. Queda como entrega
  -- incierta para revisión manual antes de que expire la deduplicación.
  update public.avisos_correo a
     set intentos = 5,
         peticion_id = null,
         peticion_el = null,
         error = 'Entrega incierta: revisar Brevo, no reenviar automáticamente'
   where a.enviado_el is null and a.peticion_id is not null
     and a.idempotencia_el <= now() - interval '25 minutes'
     and not exists (
       select 1 from net._http_response x where x.id = a.peticion_id
     );

  update public.avisos_correo a
     set peticion_id = null,
         peticion_el = null,
         error = 'Respuesta del proveedor agotada'
   where a.enviado_el is null and a.peticion_id is not null
     and a.peticion_el < now() - interval '10 minutes'
     and a.idempotencia_el > now() - interval '25 minutes'
     and not exists (
       select 1 from net._http_response x where x.id = a.peticion_id
     );

  -- Una respuesta transitoria puede haber limpiado peticion_id cerca del TTL.
  -- Al vencer el margen, esa fila también termina de forma auditable: jamás
  -- queda pendiente para siempre ni vuelve a POSTear fuera de deduplicación.
  update public.avisos_correo
     set intentos = 5,
         error = 'Entrega incierta: revisar Brevo, no reenviar automáticamente'
   where enviado_el is null and peticion_id is null and intentos < 5
     and idempotencia_el <= now() - interval '25 minutes';

  for r in
    select a.id, a.idempotencia, a.idempotencia_el, u.email,
           c.titular, c.detalle, pl.nombre plataforma
      from public.avisos_correo a
      join auth.users u on u.id = a.usuario_id
      join public.perfiles pf on pf.id = a.usuario_id
        and pf.avisos_correo
        and pf.avisos_correo_aceptado_el is not null
        and pf.avisos_correo_version = 'correo-v1-2026-08-22'
      join public.cambios_estado c on c.id = a.cambio_id
      join public.vigilancia v
        on v.usuario_id = a.usuario_id and v.plataforma_id = c.plataforma_id
      join public.plataformas pl on pl.id = c.plataforma_id
     where a.enviado_el is null
       and a.peticion_id is null
       and a.intentos < 5
       and a.creado_el >= v_activado_el
       and (a.idempotencia_el is null
            or a.idempotencia_el > now() - interval '25 minutes')
       and u.email_confirmed_at is not null
       and nullif(trim(u.email), '') is not null
     order by a.creado_el, a.id
     limit p_tanda
     for update of a skip locked
  loop
    v_idempotencia := coalesce(r.idempotencia, gen_random_uuid());
    v_idempotencia_el := coalesce(r.idempotencia_el, clock_timestamp());
    update public.avisos_correo
       set idempotencia = v_idempotencia,
           idempotencia_el = v_idempotencia_el
     where id = r.id;

    select net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object(
        'api-key', v_clave,
        'content-type', 'application/json',
        'accept', 'application/json'
      ),
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'RWAdar', 'email', trim(v_remitente)),
        'to', jsonb_build_array(jsonb_build_object(
          'email', trim(r.email),
          'contactPixelTrackingConsent', false
        )),
        'headers', jsonb_build_object(
          'Idempotency-Key', v_idempotencia::text
        ),
        'subject', left(r.titular, 180),
        'htmlContent',
          '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">'
          || '<p style="font:600 13px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#0F7A57;margin:0 0 18px">RWAdar · aviso del radar</p>'
          || '<h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">'
          || public.correo_html_escapar(r.titular) || '</h1>'
          || case when nullif(trim(r.detalle), '') is null then '' else
               '<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">'
               || public.correo_html_escapar(r.detalle) || '</p>' end
          || '<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Vigilabas <b>'
          || public.correo_html_escapar(r.plataforma)
          || '</b>. Te escribimos porque ha cambiado de estado en el registro.</p>'
          || '<p style="margin:0 0 26px"><a href="' || v_origen
          || '/" style="background:#25E39A;color:#06231A;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:99px;display:inline-block">Ver el radar</a></p>'
          || '<p style="font-size:12px;line-height:1.55;color:#888;border-top:1px solid #e5e5e5;padding-top:16px;margin:0">'
          || 'Recibes esto porque vigilas esa plataforma en RWAdar. Puedes desactivar los avisos desde tu perfil. '
          || 'RWAdar es un registro independiente y <b>no es asesoramiento financiero</b>.</p></div>'
      ),
      timeout_milliseconds := 10000
    ) into v_peticion;

    if v_peticion is null then
      raise exception using errcode = '55000',
        message = 'Brevo no devolvió identificador de petición';
    end if;
    update public.avisos_correo
       set peticion_id = v_peticion,
           peticion_el = now(),
           intentos = intentos + 1,
           error = null
     where id = r.id;
    v_total := v_total + 1;
  end loop;
  return v_total;
end
$funcion$;

create or replace function public.avisos_confirmar()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $funcion$
declare
  r record;
  v_total integer := 0;
  v_codigo text;
  v_mensaje_id text;
begin
  if not coalesce((
    select habilitado from public.correo_configuracion where singleton
  ), false) then
    raise exception using errcode = '55000',
      message = 'correo desactivado; requiere el opt-in 23 verificado';
  end if;

  for r in
    select a.id, a.intentos, x.status_code, x.content, x.error_msg
      from public.avisos_correo a
      join net._http_response x on x.id = a.peticion_id
     where a.enviado_el is null and a.peticion_id is not null
     for update of a skip locked
  loop
    v_codigo := null;
    v_mensaje_id := null;
    begin
      v_codigo := r.content::jsonb ->> 'code';
      v_mensaje_id := nullif(trim(r.content::jsonb ->> 'messageId'), '');
    exception when others then
      v_codigo := null;
      v_mensaje_id := null;
    end;

    -- Brevo documenta 201 + messageId como aceptación. enviado_el conserva el
    -- nombre histórico de la columna: no significa entrega en el buzón.
    if (r.status_code = 201 and v_mensaje_id is not null)
       or (r.status_code = 400 and v_codigo = 'duplicate_parameter') then
      update public.avisos_correo
         set enviado_el = now(), peticion_id = null, peticion_el = null,
             proveedor_mensaje_id = coalesce(proveedor_mensaje_id, v_mensaje_id),
             error = null
       where id = r.id;
      v_total := v_total + 1;
    elsif r.status_code between 400 and 499
          and r.status_code not in (408, 429) then
      -- Credenciales, payload y permisos no se arreglan repitiendo. Se cierra
      -- de forma terminal para evitar gasto y ruido; 408/429 sí son transitorios.
      update public.avisos_correo
         set intentos = 5,
             peticion_id = null,
             peticion_el = null,
             error = 'Brevo rechazó permanentemente la petición (HTTP '
                     || r.status_code::text || ')'
       where id = r.id;
    else
      update public.avisos_correo
         set peticion_id = null,
             peticion_el = null,
             error = coalesce(
               nullif(left(r.error_msg, 160), ''),
               'Brevo HTTP ' || coalesce(r.status_code::text, '?')
             )
       where id = r.id;
    end if;
  end loop;
  return v_total;
end
$funcion$;

create or replace function public.avisos_ciclo()
returns text
language plpgsql security definer
set search_path = public, pg_temp
as $funcion$
declare
  v_confirmados integer;
  v_soltados integer;
begin
  if not coalesce((
    select habilitado from public.correo_configuracion where singleton
  ), false) then
    raise exception using errcode = '55000',
      message = 'correo desactivado; requiere el opt-in 23 verificado';
  end if;
  v_confirmados := public.avisos_confirmar();
  -- Confirmar y soltar comparten la transacción del cron. El subbloque evita
  -- que una caída posterior de Vault/red deshaga confirmaciones 2xx ya leídas.
  begin
    v_soltados := public.avisos_soltar();
  exception when others then
    v_soltados := -1;
    raise warning 'correo ciclo: confirmaciones conservadas; envío omitido (%)',
      sqlstate;
  end;
  return format('confirmados %s, soltados %s', v_confirmados, v_soltados);
end
$funcion$;

revoke all on function public.correo_html_escapar(text)
  from public, anon, authenticated, service_role;
revoke all on function public.avisos_soltar(integer)
  from public, anon, authenticated, service_role;
revoke all on function public.avisos_confirmar()
  from public, anon, authenticated, service_role;
revoke all on function public.avisos_ciclo()
  from public, anon, authenticated, service_role;

-- Comprobar los secretos dentro de la transacción evita dejar funciones o
-- cron activos si Vault contiene un placeholder. El mensaje no revela valores.
do $vault$
declare
  v_clave text;
  v_remitente text;
begin
  select max(decrypted_secret) filter (where name = 'BREVO_API_KEY'),
         max(decrypted_secret) filter (where name = 'RWADAR_REMITENTE')
    into v_clave, v_remitente
    from vault.decrypted_secrets
   where name in ('BREVO_API_KEY', 'RWADAR_REMITENTE');
  if length(trim(coalesce(v_clave, ''))) < 20
     or trim(coalesce(v_remitente, '')) !~*
        '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$' then
    raise exception using errcode = '55000',
      message = 'correo opt-in: configura BREVO_API_KEY y RWADAR_REMITENTE válidos en Vault';
  end if;
end
$vault$;

-- La primera activación fija una frontera. Reaplicar 23 conserva esa fecha y
-- no convierte avisos posteriores ya encolados en histórico descartado.
update public.correo_configuracion
   set proveedor = 'brevo',
       origen_https = 'https://rwadar.pages.dev',
       consentimiento_version = 'correo-v1-2026-08-22',
       habilitado = true,
       activado_el = coalesce(activado_el, clock_timestamp()),
       activado_por = coalesce(nullif(activado_por, ''), session_user)
 where singleton;

update public.avisos_correo
   set intentos = 5,
       peticion_id = null,
       peticion_el = null,
       error = 'No enviado: anterior a la activación de correo'
 where enviado_el is null and intentos < 5
   and creado_el < (
     select activado_el from public.correo_configuracion where singleton
   );

-- El nombre del reloj no es una frontera de seguridad: se retira cualquier
-- alias que invoque las rutas de correo y después se crea uno solo canónico.
do $relojes$
declare
  v_job record;
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
end
$relojes$;

select cron.schedule(
  'rwadar-avisos',
  '*/5 * * * *',
  $$ select public.avisos_ciclo() $$
);

notify pgrst, 'reload schema';
commit;
