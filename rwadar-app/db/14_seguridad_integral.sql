-- =====================================================================
-- RWAdar · cierre integral de cuentas, opiniones y denuncias
-- ---------------------------------------------------------------------
-- Esta migración se puede aplicar aunque 13_envio_avisos.sql todavía no
-- esté instalada: no depende de pg_cron, pg_net ni de secretos externos.
-- Es idempotente y conserva las opiniones/denuncias que ya existan.
--
-- Objetivos:
--   * es_admin solo se cambia con una RPC reservada a service_role.
--   * el cliente nunca escribe estado ni el contador de denuncias.
--   * una denuncia recibe un opinion_id aleatorio, no el UUID del autor.
--   * las mutaciones pasan por RPCs pequeñas, con identidad servidor-side.
--   * las vistas públicas son security_invoker y no exponen usuario_id.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · Perfil: nombre de metadata y privilegio administrativo protegido
-- ---------------------------------------------------------------------
alter table perfiles add column if not exists es_admin boolean not null default false;

create or replace function crea_perfil() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

-- Completa perfiles anteriores creados por la versión que ignoraba la
-- metadata. Solo usa valores no vacíos y dentro del mismo límite que la
-- tabla; no pisa un nombre que la persona ya haya elegido.
update perfiles p
   set nombre = nullif(btrim(coalesce(
         u.raw_user_meta_data ->> 'nombre',
         u.raw_user_meta_data ->> 'name',
         u.raw_user_meta_data ->> 'full_name'
       )), '')
  from auth.users u
 where p.id = u.id
   and p.nombre is null
   and length(nullif(btrim(coalesce(
         u.raw_user_meta_data ->> 'nombre',
         u.raw_user_meta_data ->> 'name',
         u.raw_user_meta_data ->> 'full_name'
       )), '')) between 1 and 60;

-- Defensa en profundidad: aunque alguien vuelva a conceder UPDATE sobre
-- toda la tabla, anon/authenticated no pueden tocar el privilegio.
create or replace function protege_privilegio_admin() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.es_admin is distinct from old.es_admin
     and current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'es_admin solo se modifica mediante la operacion administrativa';
  end if;
  return new;
end $$;

drop trigger if exists perfiles_protegen_admin on perfiles;
create trigger perfiles_protegen_admin
  before update of es_admin on perfiles
  for each row execute function protege_privilegio_admin();

-- El grant de tabla de 07/10 incluía cualquier columna añadida después.
-- Se sustituye por una lista cerrada de campos editables por el titular.
revoke update on perfiles from anon, authenticated;
grant update (nombre, avisos_correo) on perfiles to authenticated;

-- Único camino API para conceder/revocar administración. No se concede a
-- usuarios finales; service_role no debe salir nunca del backend.
create or replace function establecer_admin(p_usuario uuid, p_es_admin boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update perfiles set es_admin = p_es_admin where id = p_usuario;
  if not found then
    raise exception using errcode = 'P0002', message = 'el perfil no existe';
  end if;
end $$;

revoke all on function establecer_admin(uuid, boolean) from public, anon, authenticated;
grant execute on function establecer_admin(uuid, boolean) to service_role;

-- ---------------------------------------------------------------------
-- 1 bis · Retención limitada de identificadores de instalación
-- ---------------------------------------------------------------------
-- No depende del reloj de 13: cada alta/uso de un dispositivo realiza una
-- limpieza oportunista y acotada. La cascada elimina su seguimiento. La
-- función también queda disponible a service_role para mantenimiento.
create or replace function limpiar_dispositivos_inactivos(p_limite integer default 100)
returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

create or replace function limpia_dispositivos_oportunista() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform limpiar_dispositivos_inactivos(100);
  return new;
end $$;

drop trigger if exists dispositivos_limpian_inactivos on dispositivos;
create trigger dispositivos_limpian_inactivos
  after insert or update of visto_el on dispositivos
  for each statement execute function limpia_dispositivos_oportunista();

revoke all on function limpiar_dispositivos_inactivos(integer)
  from public, anon, authenticated;
grant execute on function limpiar_dispositivos_inactivos(integer) to service_role;
revoke all on function limpia_dispositivos_oportunista()
  from public, anon, authenticated;
revoke all on function crea_perfil() from public, anon, authenticated;
revoke all on function protege_privilegio_admin() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2 · Identificador público opaco y firma pública desacoplada del usuario
-- ---------------------------------------------------------------------
alter table opiniones add column if not exists opinion_id uuid;
alter table opiniones add column if not exists autor_publico text;

update opiniones
   set opinion_id = gen_random_uuid()
 where opinion_id is null;

update opiniones o
   set autor_publico = coalesce(nullif(btrim(p.nombre), ''), 'Anónimo')
  from perfiles p
 where p.id = o.usuario_id
   and o.autor_publico is null;

update opiniones set autor_publico = 'Anónimo' where autor_publico is null;

alter table opiniones alter column opinion_id set default gen_random_uuid();
alter table opiniones alter column opinion_id set not null;
alter table opiniones alter column autor_publico set default 'Anónimo';
alter table opiniones alter column autor_publico set not null;

create unique index if not exists opiniones_opinion_id_unico
  on opiniones (opinion_id);

-- Solo una edición real del contenido cambia la marca «editada».
create or replace function toca_opinion() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if new.nota is distinct from old.nota or new.texto is distinct from old.texto then
    new.actualizado_el := now();
  else
    new.actualizado_el := old.actualizado_el;
  end if;
  return new;
end $$;

-- Mantiene el nombre público sincronizado sin dar UPDATE sobre opiniones
-- al usuario ni marcar la reseña como editada.
create or replace function sincroniza_autor_opiniones() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.nombre is distinct from old.nombre then
    update opiniones
       set autor_publico = coalesce(nullif(btrim(new.nombre), ''), 'Anónimo')
     where usuario_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists perfiles_sincronizan_autor on perfiles;
create trigger perfiles_sincronizan_autor
  after update of nombre on perfiles
  for each row execute function sincroniza_autor_opiniones();

-- Si una concesión accidental reaparece en el futuro, las escrituras
-- directas siguen fallando: las RPC security definer se ejecutan como su
-- propietario, no como anon/authenticated.
create or replace function protege_opiniones_directas() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'las opiniones se modifican mediante las operaciones publicadas';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists opiniones_solo_rpc on opiniones;
create trigger opiniones_solo_rpc
  before insert or update or delete on opiniones
  for each row execute function protege_opiniones_directas();
revoke all on function toca_opinion() from public, anon, authenticated;
revoke all on function sincroniza_autor_opiniones() from public, anon, authenticated;
revoke all on function protege_opiniones_directas() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3 · Denuncias: objetivo opaco e identidad del denunciante servidor-side
-- ---------------------------------------------------------------------
alter table denuncias add column if not exists opinion_id uuid;

update denuncias d
   set opinion_id = o.opinion_id
  from opiniones o
 where d.opinion_id is null
   and o.usuario_id = d.usuario_id
   and o.plataforma_id = d.plataforma_id;

-- Si el esquema anterior era coherente, todas las filas encuentran su
-- opinión por la FK compuesta. El bloque explícito evita dejar una
-- migración a medias ante una base previamente dañada.
do $$
begin
  if exists (select 1 from denuncias where opinion_id is null) then
    raise exception 'hay denuncias huérfanas; no se puede migrar con seguridad';
  end if;
end $$;

alter table denuncias alter column opinion_id set not null;
create unique index if not exists denuncias_una_por_opinion
  on denuncias (denunciante_id, opinion_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.denuncias'::regclass
       and conname = 'denuncias_opinion_id_fkey'
  ) then
    alter table denuncias
      add constraint denuncias_opinion_id_fkey
      foreign key (opinion_id) references opiniones(opinion_id) on delete cascade;
  end if;
end $$;

-- Corrige una vez cualquier contador heredado antes de pasar al modelo
-- incremental. La actualización toma bloqueo de fila, por lo que INSERTs
-- concurrentes serializan sus +1 y no pueden perder incrementos por MVCC.
update opiniones o
   set denuncias = (select count(*)::smallint from denuncias d
                     where d.opinion_id = o.opinion_id),
       estado = case
         when (select count(*) from denuncias d
                where d.opinion_id = o.opinion_id) >= 3 then 'oculta'
         else o.estado
       end;

create or replace function revisa_denuncias() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

drop trigger if exists denuncias_revisan on denuncias;
create trigger denuncias_revisan
  after insert or delete on denuncias
  for each row execute function revisa_denuncias();

create or replace function protege_denuncias_directas() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using errcode = '42501',
      message = 'las denuncias se crean mediante la operacion publicada';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists denuncias_solo_rpc on denuncias;
create trigger denuncias_solo_rpc
  before insert or update or delete on denuncias
  for each row execute function protege_denuncias_directas();
revoke all on function revisa_denuncias() from public, anon, authenticated;
revoke all on function protege_denuncias_directas() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4 · RPCs de usuario: el servidor decide siempre quién actúa
-- ---------------------------------------------------------------------
create or replace function guardar_opinion(
  p_plataforma uuid, p_nota integer, p_texto text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

create or replace function borrar_mi_opinion(p_opinion_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

create or replace function denunciar_opinion(
  p_opinion_id uuid, p_motivo text default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
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
end $$;

revoke all on function guardar_opinion(uuid, integer, text) from public, anon;
revoke all on function borrar_mi_opinion(uuid) from public, anon;
revoke all on function denunciar_opinion(uuid, text) from public, anon;
grant execute on function guardar_opinion(uuid, integer, text) to authenticated;
grant execute on function borrar_mi_opinion(uuid) to authenticated;
grant execute on function denunciar_opinion(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5 · Moderación por opinion_id; el historial no conserva usuario_id
-- ---------------------------------------------------------------------
drop view if exists cola_moderacion;
drop function if exists moderar(uuid, uuid, text, text);

alter table moderacion add column if not exists opinion_id uuid;
update moderacion m
   set opinion_id = o.opinion_id
  from opiniones o
 where m.opinion_id is null
   and o.usuario_id = m.usuario_id
   and o.plataforma_id = m.plataforma_id;

-- El UUID histórico no se publica. Pasa a NULL al borrar la cuenta para
-- que el derecho de supresión también anonimice el historial. Cualquier
-- huérfano previo se anonimiza antes de instalar y validar la FK.
alter table moderacion alter column usuario_id drop not null;
update moderacion m
   set usuario_id = null
 where usuario_id is not null
   and not exists (select 1 from auth.users u where u.id = m.usuario_id);
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.moderacion'::regclass
       and conname = 'moderacion_usuario_id_fkey'
  ) then
    alter table moderacion
      add constraint moderacion_usuario_id_fkey
      foreign key (usuario_id) references auth.users(id) on delete set null;
  end if;
end $$;
alter table moderacion validate constraint moderacion_usuario_id_fkey;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select p.es_admin from perfiles p where p.id = auth.uid()), false)
$$;

revoke all on function es_admin() from public, anon;
grant execute on function es_admin() to authenticated;

create or replace function moderar(
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

revoke all on function moderar(uuid, text, text) from public, anon;
grant execute on function moderar(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 6 · RLS, privilegios por columna y vistas invocadoras
-- ---------------------------------------------------------------------
drop policy if exists "opinar en nombre propio" on opiniones;
drop policy if exists "editar la propia" on opiniones;
drop policy if exists "borrar la propia" on opiniones;
drop policy if exists "denunciar" on denuncias;
drop policy if exists "ver las denuncias propias" on denuncias;

-- Elimina grants de tabla heredados; una concesión por columna solo
-- restringe de verdad cuando ya no existe el grant general.
revoke all on opiniones from anon, authenticated;
revoke all on denuncias from anon, authenticated;

grant select (opinion_id, plataforma_id, nota, texto, estado,
              creado_el, actualizado_el, autor_publico)
  on opiniones to anon;
grant select (opinion_id, plataforma_id, nota, texto, estado, denuncias,
              creado_el, actualizado_el, autor_publico)
  on opiniones to authenticated;

-- La cola de moderación solo necesita estos tres campos. RLS mantiene
-- cero filas para no administradores y ni siquiera un admin ve quién
-- denunció a través de la API.
grant select (opinion_id, motivo, creado_el) on denuncias to authenticated;

-- Mantener explícitas las políticas de lectura después de retirar las de
-- escritura. `el administrador...` ya existe desde 10; se recrea por si
-- una instalación intermedia quedó a medias.
drop policy if exists "las opiniones visibles se leen" on opiniones;
create policy "las opiniones visibles se leen" on opiniones
  for select to anon, authenticated using (estado = 'visible');
drop policy if exists "cada cual ve la suya" on opiniones;
create policy "cada cual ve la suya" on opiniones
  for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "el administrador lo ve todo" on opiniones;
create policy "el administrador lo ve todo" on opiniones
  for select to authenticated using (es_admin());
drop policy if exists "el administrador ve las denuncias" on denuncias;
create policy "el administrador ve las denuncias" on denuncias
  for select to authenticated using (es_admin());

-- Proyección pública: el identificador opaco permite denunciar sin
-- publicar el UUID del autor.
create or replace view opiniones_publicas
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         o.autor_publico as autor,
         o.nota, o.texto, o.creado_el,
         (o.actualizado_el > o.creado_el + interval '1 minute') as editada,
         o.opinion_id
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible';

create or replace view nota_media
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         count(*)::int as opiniones,
         case when count(*) >= 3 then round(avg(o.nota)::numeric, 1) end as media
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible'
   group by o.plataforma_id, p.nombre;

-- Predicado seguro para una vista invocadora de opiniones propias sin
-- conceder SELECT sobre opiniones.usuario_id.
create or replace function es_opinion_propia(p_opinion_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from opiniones
     where opinion_id = p_opinion_id and usuario_id = auth.uid()
  )
$$;
revoke all on function es_opinion_propia(uuid) from public, anon;
grant execute on function es_opinion_propia(uuid) to authenticated;

create or replace view mis_opiniones
with (security_invoker = true) as
  select o.opinion_id, o.plataforma_id, o.nota, o.texto,
         o.estado, o.denuncias, o.creado_el, o.actualizado_el
    from opiniones o
   where es_opinion_propia(o.opinion_id);

create view cola_moderacion
with (security_invoker = true) as
  select o.opinion_id, o.plataforma_id,
         p.nombre as plataforma,
         o.autor_publico as autor,
         o.nota, o.texto, o.estado, o.denuncias, o.creado_el,
         (select array_agg(coalesce(d.motivo, 'sin motivo') order by d.creado_el)
            from denuncias d where d.opinion_id = o.opinion_id) as motivos
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where (o.denuncias > 0 or o.estado = 'oculta')
     and es_admin()
   order by o.denuncias desc, o.creado_el desc;

grant select on opiniones_publicas, nota_media to anon, authenticated;
grant select on mis_opiniones, cola_moderacion to authenticated;

-- El historial se consulta por proyecciones administrativas, no mediante
-- un SELECT de tabla que revele el UUID del autor de la opinión.
revoke select on moderacion from authenticated;
grant select (id, moderador_id, opinion_id, plataforma_id,
              accion, motivo, creado_el)
  on moderacion to authenticated;

-- Todas las vistas del esquema público respetan los permisos/RLS del
-- invocador. Las privadas siguen sin grants a clientes.
alter view radar_publico set (security_invoker = true);
alter view descartadas_sin_fuente set (security_invoker = true);
alter view avisos_pendientes set (security_invoker = true);
alter view avisos_correo_pendientes set (security_invoker = true);
alter view mi_perfil set (security_invoker = true);

-- Pide a PostgREST que invalide su caché de relaciones/RPC al confirmar
-- la transacción. En clientes que no escuchan el canal no tiene efecto.
notify pgrst, 'reload schema';

commit;
