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
--     con 3 denuncias se oculta sola hasta que la revise un administrador,
--   · quien la escribió puede borrarla; al borrar la cuenta se borra todo.
--
-- La lectura es pública y no expone quién la escribió (ni su id) ni las
-- denuncias. Escribir solo se puede a través de las funciones de abajo.
--
-- Requiere 26. Idempotente y transaccional.
-- Marcha atrás: 27_comunidad_cerrar.sql (cierra sin borrar nada).
-- =====================================================================
begin;

do $precondiciones$
begin
  if to_regclass('public.perfiles') is null or to_regprocedure('public.es_admin()') is null
     or to_regprocedure('public.marcar_manual_descargado()') is null then
    raise exception using errcode = '55000',
      message = 'RWAdar 27: aplica antes 26_reabrir_cuentas.sql';
  end if;
end
$precondiciones$;

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

create table if not exists public.denuncias_publicaciones (
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  usuario_id     uuid not null references public.perfiles(id) on delete cascade,
  motivo         text check (motivo is null or char_length(motivo) <= 300),
  creada_el      timestamptz not null default now(),
  primary key (publicacion_id, usuario_id)
);

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
create or replace function public.publicar(p_texto text, p_mostrar_nombre boolean default false)
  returns table (id uuid, autor text, texto text, creada_el timestamptz)
  language plpgsql security definer set search_path = public, pg_temp as $$
declare
  yo uuid := auth.uid();
  nombre_perfil text;
begin
  if yo is null then
    raise exception using errcode = '42501', message = 'Entra en tu cuenta para publicar.';
  end if;
  select p.nombre into nombre_perfil from perfiles p where p.id = yo;
  if not found then
    raise exception using errcode = '42501', message = 'Tu cuenta no tiene perfil.';
  end if;
  begin
    return query
      insert into publicaciones as n (usuario_id, autor, texto)
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
create or replace function public.mis_publicaciones()
  returns table (id uuid, texto text, creada_el timestamptz, estado text)
  language sql stable security definer set search_path = public, pg_temp as $$
    select p.id, p.texto, p.creada_el, p.estado from publicaciones p
     where p.usuario_id = auth.uid() order by p.creada_el desc limit 50
  $$;

create or replace function public.borrar_mi_publicacion(p_id uuid) returns boolean
  language sql security definer set search_path = public, pg_temp as $$
    with borrada as (
      delete from publicaciones p where p.id = p_id and p.usuario_id = auth.uid() returning 1
    ) select exists (select 1 from borrada)
  $$;

-- ---------------------------------------------------------------------
-- Denunciar: una vez por cuenta y publicación, nunca la propia.
-- Con 3 denuncias la publicación se oculta sola.
-- ---------------------------------------------------------------------
create or replace function public.denunciar_publicacion(p_id uuid, p_motivo text default null)
  returns boolean
  language plpgsql security definer set search_path = public, pg_temp as $$
declare
  yo uuid := auth.uid();
  autor_id uuid;
begin
  if yo is null then
    raise exception using errcode = '42501', message = 'Entra en tu cuenta para denunciar.';
  end if;
  select p.usuario_id into autor_id from publicaciones p where p.id = p_id;
  if not found then return false; end if;
  if autor_id = yo then
    raise exception using errcode = 'P0001', message = 'No puedes denunciar tu propia publicación.';
  end if;
  insert into denuncias_publicaciones (publicacion_id, usuario_id, motivo)
    values (p_id, yo, nullif(left(btrim(coalesce(p_motivo, '')), 300), ''))
    on conflict do nothing;
  if found then
    update publicaciones p
       set denuncias = p.denuncias + 1,
           estado = case when p.denuncias + 1 >= 3 then 'oculta' else p.estado end
     where p.id = p_id;
  end if;
  return true;
end
$$;

-- ---------------------------------------------------------------------
-- Moderar (solo administradores): ocultar o restaurar, y ver la cola.
-- ---------------------------------------------------------------------
create or replace function public.moderar_publicacion(p_id uuid, p_accion text) returns boolean
  language plpgsql security definer set search_path = public, pg_temp as $$
declare
  cambiadas integer;
begin
  if not es_admin() then
    raise exception using errcode = '42501', message = 'Solo un administrador puede moderar.';
  end if;
  if p_accion not in ('ocultar', 'restaurar') then
    raise exception using errcode = '22023', message = 'Acción no válida.';
  end if;
  update publicaciones p
     set estado = case when p_accion = 'ocultar' then 'oculta' else 'visible' end,
         denuncias = case when p_accion = 'restaurar' then 0 else p.denuncias end
   where p.id = p_id;
  get diagnostics cambiadas = row_count;
  if p_accion = 'restaurar' then
    delete from denuncias_publicaciones d where d.publicacion_id = p_id;
  end if;
  return cambiadas > 0;
end
$$;

create or replace function public.cola_publicaciones()
  returns table (id uuid, autor text, texto text, creada_el timestamptz, estado text, denuncias integer)
  language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not es_admin() then
    raise exception using errcode = '42501', message = 'Solo un administrador puede moderar.';
  end if;
  return query select p.id, p.autor, p.texto, p.creada_el, p.estado, p.denuncias
    from publicaciones p where p.denuncias > 0 or p.estado = 'oculta'
    order by p.denuncias desc, p.creada_el desc;
end
$$;

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
