-- =====================================================================
-- RWAdar 27 · comunidad: una publicación al día por cuenta
-- ---------------------------------------------------------------------
-- Inicio enseña lo que publica RWAdar y, con las cuentas abiertas (26),
-- lo que publican sus miembros. Reglas que pone la base de datos, no la
-- pantalla (un cliente modificado no se las salta):
--
--   · una publicación por cuenta y día natural de España,
--   · entre 10 y 500 caracteres, sin enlaces (lo primero que usaría una
--     estafa de inversión),
--   · se publica como «Miembro de RWAdar» salvo que la persona elija
--     mostrar el nombre de su perfil,
--   · cualquiera con cuenta puede denunciar una vez cada publicación ajena;
--     todas llegan a moderación; solo 3 cuentas con alta y correo ya
--     confirmados desde hace 7 días cuentan para ocultarla automáticamente,
--   · quien la escribió puede borrarla; al borrar la cuenta se borra todo.
--
-- La lectura es pública y no expone quién la escribió (ni su id) ni las
-- denuncias. Escribir solo se puede a través de las funciones de abajo.
--
-- Requiere 26 y el refuerzo de sesión confirmada del 11/10.
-- Preparada: NO aplicar sin autorizar la apertura. Idempotente y transaccional.
-- Marcha atrás: 27_comunidad_cerrar.sql (cierra sin borrar nada).
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('public.perfiles') is null or to_regprocedure('public.es_admin()') is null
     or to_regprocedure('rwadar_cuentas_privadas.sesion_confirmada()') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 27: aplica antes 26 y el refuerzo de sesión confirmada del 11/10';
  end if;
end
$precondiciones$;

create schema if not exists rwadar_comunidad_privada;
revoke all on schema rwadar_comunidad_privada from public, anon;
grant usage on schema rwadar_comunidad_privada to authenticated;

create or replace function rwadar_comunidad_privada.sin_enlaces(p_texto text)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(translate(p_texto, chr(8203)||chr(8204)||chr(8205)||chr(65279), '')
    !~* '(https?://|www\.|mailto:|tel:|([a-z0-9-]+\.)+[a-z]{2,63}([[:space:][:punct:]]|$))', false)
$$;

create table if not exists public.publicaciones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  autor       text not null default 'Miembro de RWAdar'
                check (length(btrim(autor)) between 1 and 60),
  texto       text not null
                check (char_length(btrim(texto)) between 10 and 500)
                check (texto !~* '(https?://|www\.|[a-z0-9-]+\.(com|es|net|org|io|xyz|app|finance|me|co)(/|\s|$))'),
  dia         date not null default ((now() at time zone 'Europe/Madrid')::date),
  creada_el   timestamptz not null default now(),
  estado      text not null default 'visible' check (estado in ('visible', 'oculta')),
  denuncias   integer not null default 0 check (denuncias >= 0),
  unique (usuario_id, dia)
);
create index if not exists publicaciones_recientes on public.publicaciones (creada_el desc)
  where estado = 'visible';

-- El cupo de «una al día» vive aparte: borrar la publicación no lo libera.
create table if not exists public.cupos_publicacion (
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  dia         date not null,
  primary key (usuario_id, dia)
);
-- Si se adapta una instalación anterior, borrar una publicación ya existente
-- tampoco libera el cupo. No cambia ni borra ninguna publicación.
insert into public.cupos_publicacion(usuario_id,dia)
  select p.usuario_id,p.dia from public.publicaciones p on conflict do nothing;
alter table public.cupos_publicacion enable row level security;
revoke all on public.cupos_publicacion from public, anon, authenticated;

create table if not exists public.denuncias_publicaciones (
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  usuario_id     uuid not null references public.perfiles(id) on delete cascade,
  motivo         text check (motivo is null or char_length(motivo) <= 300),
  creada_el      timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);

-- Conserva datos anteriores sin borrarlos: las restricciones NOT VALID
-- protegen cualquier escritura nueva, incluida una posible instalación antigua.
-- Moderación puede ocultar una fila antigua con enlace; no restaurarla sin
-- corregir antes su contenido. Así una fila heredada no bloquea su retirada.
do $enlaces$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.publicaciones'::regclass
                and conname='publicaciones_texto_sin_enlaces') then
    alter table public.publicaciones add constraint publicaciones_texto_sin_enlaces
      check(estado='oculta' or rwadar_comunidad_privada.sin_enlaces(texto)) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.publicaciones'::regclass
                and conname='publicaciones_autor_sin_enlaces') then
    alter table public.publicaciones add constraint publicaciones_autor_sin_enlaces
      check(estado='oculta' or rwadar_comunidad_privada.sin_enlaces(autor)) not valid;
  end if;
end
$enlaces$;
alter table public.denuncias_publicaciones add column if not exists apta_para_ocultar boolean not null default false;

alter table public.publicaciones enable row level security;
alter table public.denuncias_publicaciones enable row level security;

drop policy if exists "publicaciones visibles para todos" on public.publicaciones;
create policy "publicaciones visibles para todos" on public.publicaciones
  for select to anon, authenticated using (estado = 'visible');

-- Lectura: solo columnas sin datos personales. Nada de usuario_id ni denuncias.
revoke all on public.publicaciones, public.denuncias_publicaciones from public, anon, authenticated;
grant select (id, autor, texto, creada_el) on public.publicaciones to anon, authenticated;

-- ---------------------------------------------------------------------
-- Publicar
-- ---------------------------------------------------------------------
create or replace function rwadar_comunidad_privada.publicar(p_texto text, p_mostrar_nombre boolean default false)
  returns table (id uuid, autor text, texto text, creada_el timestamptz)
  language plpgsql security definer set search_path = '' as $$
declare
  yo uuid := auth.uid();
  nombre_perfil text;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Entra en tu cuenta para publicar.';
  end if;
  select p.nombre into nombre_perfil from public.perfiles p where p.id = yo;
  if not found then
    raise exception using errcode = '42501', message = 'Tu cuenta no tiene perfil.';
  end if;
  begin
    insert into public.cupos_publicacion (usuario_id, dia)
      values (yo, (now() at time zone 'Europe/Madrid')::date);
    return query
      insert into public.publicaciones as n (usuario_id, autor, texto)
      values (yo,
              case when p_mostrar_nombre and nombre_perfil is not null then btrim(nombre_perfil)
                   else 'Miembro de RWAdar' end,
              btrim(p_texto))
      returning n.id, n.autor, n.texto, n.creada_el;
  exception
    when unique_violation then
      raise exception using errcode = 'P0001', message = 'Ya has publicado hoy. Vuelve mañana.';
    when check_violation then
      raise exception using errcode = 'P0001',
        message = 'La publicación debe tener entre 10 y 500 caracteres y no puede llevar enlaces.';
  end;
end
$$;

-- ---------------------------------------------------------------------
-- Las propias (para poder borrarlas) y borrar
-- ---------------------------------------------------------------------
create or replace function rwadar_comunidad_privada.mis_publicaciones()
  returns table (id uuid, texto text, creada_el timestamptz, estado text)
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode='42501', message='Se necesita una sesión confirmada y vigente.';
  end if;
  return query select p.id, p.texto, p.creada_el, p.estado from public.publicaciones p
    where p.usuario_id = auth.uid() order by p.creada_el desc limit 50;
end
$$;

create or replace function rwadar_comunidad_privada.borrar_mi_publicacion(p_id uuid) returns boolean
  language plpgsql security definer set search_path = '' as $$
declare borrada boolean;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode='42501', message='Se necesita una sesión confirmada y vigente.';
  end if;
  with eliminada as (
      -- Una oculta por denuncias espera a moderación: su autor no la borra.
      delete from public.publicaciones p
       where p.id = p_id and p.usuario_id = auth.uid() and p.estado = 'visible' returning 1
    ) select exists (select 1 from eliminada) into borrada;
  return borrada;
end
$$;

-- ---------------------------------------------------------------------
-- Denunciar: una vez por cuenta y publicación, nunca la propia.
-- Con 3 denuncias de cuentas consolidadas se oculta; las nuevas van a la cola.
-- ---------------------------------------------------------------------
create or replace function rwadar_comunidad_privada.denunciar_publicacion(p_id uuid, p_motivo text default null)
  returns boolean
  language plpgsql security definer set search_path = '' as $$
declare
  yo uuid := auth.uid();
  autor_id uuid;
  apta boolean;
  consolidadas integer;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() then
    raise exception using errcode = '42501', message = 'Entra en tu cuenta para denunciar.';
  end if;
  -- El bloqueo serializa denuncias y moderación de esta publicación.
  select p.usuario_id into autor_id from public.publicaciones p where p.id = p_id for update;
  if not found then return false; end if;
  if autor_id = yo then
    raise exception using errcode = 'P0001', message = 'No puedes denunciar tu propia publicación.';
  end if;
  -- Aptitud fijada al denunciar: un reporte nuevo no gana peso solo por envejecer.
  select coalesce(u.created_at <= now()-interval '7 days'
    and u.email_confirmed_at <= now()-interval '7 days', false) into apta
    from auth.users u where u.id=yo and u.is_anonymous is false;
  insert into public.denuncias_publicaciones (publicacion_id, usuario_id, motivo, apta_para_ocultar)
    values (p_id, yo, nullif(left(btrim(coalesce(p_motivo, '')), 300), ''), coalesce(apta,false))
    on conflict do nothing;
  if found then
    select count(*)::integer into consolidadas from public.denuncias_publicaciones d
      where d.publicacion_id=p_id and d.apta_para_ocultar;
    update public.publicaciones p
       set denuncias = p.denuncias + 1,
           estado = case when consolidadas >= 3 then 'oculta' else p.estado end
     where p.id = p_id;
  end if;
  return true;
end
$$;

-- ---------------------------------------------------------------------
-- Moderar (solo administradores): ocultar o restaurar, y ver la cola.
-- ---------------------------------------------------------------------
create or replace function rwadar_comunidad_privada.moderar_publicacion(p_id uuid, p_accion text) returns boolean
  language plpgsql security definer set search_path = '' as $$
declare
  cambiadas integer;
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() or not public.es_admin() then
    raise exception using errcode = '42501', message = 'Solo un administrador puede moderar.';
  end if;
  if p_accion is null or p_accion not in ('ocultar', 'restaurar') then
    raise exception using errcode = '22023', message = 'Acción no válida.';
  end if;
  update public.publicaciones p
     set estado = case when p_accion = 'ocultar' then 'oculta' else 'visible' end,
         denuncias = case when p_accion = 'restaurar' then 0 else p.denuncias end
   where p.id = p_id;
  get diagnostics cambiadas = row_count;
  if p_accion = 'restaurar' then
    delete from public.denuncias_publicaciones d where d.publicacion_id = p_id;
  end if;
  return cambiadas > 0;
end
$$;

create or replace function rwadar_comunidad_privada.cola_publicaciones()
  returns table (id uuid, autor text, texto text, creada_el timestamptz, estado text, denuncias integer)
  language plpgsql stable security definer set search_path = '' as $$
begin
  if not rwadar_cuentas_privadas.sesion_confirmada() or not public.es_admin() then
    raise exception using errcode = '42501', message = 'Solo un administrador puede moderar.';
  end if;
  return query select p.id, p.autor, p.texto, p.creada_el, p.estado, p.denuncias
    from public.publicaciones p where p.denuncias > 0 or p.estado = 'oculta'
    order by p.denuncias desc, p.creada_el desc;
end
$$;

-- RPC públicas sin privilegios; implementación en esquema no expuesto.
create or replace function public.publicar(p_texto text,p_mostrar_nombre boolean default false)
returns table(id uuid,autor text,texto text,creada_el timestamptz)
language sql security invoker set search_path='' as $$ select * from rwadar_comunidad_privada.publicar(p_texto,p_mostrar_nombre) $$;
create or replace function public.mis_publicaciones()
returns table(id uuid,texto text,creada_el timestamptz,estado text)
language sql stable security invoker set search_path='' as $$ select * from rwadar_comunidad_privada.mis_publicaciones() $$;
create or replace function public.borrar_mi_publicacion(p_id uuid) returns boolean
language sql security invoker set search_path='' as $$ select rwadar_comunidad_privada.borrar_mi_publicacion(p_id) $$;
create or replace function public.denunciar_publicacion(p_id uuid,p_motivo text default null) returns boolean
language sql security invoker set search_path='' as $$ select rwadar_comunidad_privada.denunciar_publicacion(p_id,p_motivo) $$;
create or replace function public.moderar_publicacion(p_id uuid,p_accion text) returns boolean
language sql security invoker set search_path='' as $$ select rwadar_comunidad_privada.moderar_publicacion(p_id,p_accion) $$;
create or replace function public.cola_publicaciones()
returns table(id uuid,autor text,texto text,creada_el timestamptz,estado text,denuncias integer)
language sql stable security invoker set search_path='' as $$ select * from rwadar_comunidad_privada.cola_publicaciones() $$;
revoke all on all functions in schema rwadar_comunidad_privada from public,anon;
grant execute on all functions in schema rwadar_comunidad_privada to authenticated;

revoke all on function public.publicar(text, boolean), public.mis_publicaciones(),
  public.borrar_mi_publicacion(uuid), public.denunciar_publicacion(uuid, text),
  public.moderar_publicacion(uuid, text), public.cola_publicaciones()
  from public, anon;
grant execute on function public.publicar(text, boolean), public.mis_publicaciones(),
  public.borrar_mi_publicacion(uuid), public.denunciar_publicacion(uuid, text),
  public.moderar_publicacion(uuid, text), public.cola_publicaciones()
  to authenticated;

notify pgrst, 'reload schema';
commit;
