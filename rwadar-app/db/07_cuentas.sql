-- =====================================================================
-- RWAdar · cuentas, lista de vigilancia y avisos por correo
-- ---------------------------------------------------------------------
-- Por qué existe esto, que no es evidente:
--
-- La cuenta NO está para tener cuenta. RWAdar no vende nada ni guarda
-- una reserva, así que un "área de cliente" a la manera de una tienda
-- sería un cajón vacío. Lo que sí tiene RWAdar es el aviso: RealT y
-- Goldfinch se hundieron con gente dentro, y quien las siguiera debería
-- haberse enterado el mismo día. Para avisar por correo hace falta un
-- correo verificado. Ese, y no otro, es el motivo de la cuenta.
--
-- Tres reglas que sostienen el diseño:
--
--   1 · La cuenta es OPCIONAL. El registro se lee entero sin ella. La
--       app móvil sigue con su identificador anónimo de instalación,
--       que es lo que la justifica ante la directriz 4.2 de Apple.
--   2 · Nadie ve los datos de nadie. Todo pasa por auth.uid().
--   3 · Borrar la cuenta borra TODO. Cascada desde auth.users, sin
--       restos ni copias. Es un requisito del RGPD, no una cortesía.
--
-- Depende de: 01_schema.sql y 03_app.sql.  Es idempotente.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · Perfil
-- ---------------------------------------------------------------------
-- Solo lo imprescindible. Cuanto menos dato personal se guarde, menos
-- hay que proteger y menos hay que explicar. El correo NO se copia
-- aquí: ya vive en auth.users y duplicarlo solo crea dos verdades.
create table if not exists perfiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nombre         text check (nombre is null or length(trim(nombre)) between 1 and 60),
  avisos_correo  boolean not null default true,
  creado_el      timestamptz not null default now()
);

comment on table perfiles is
  'Datos mínimos de una cuenta. El correo vive en auth.users, no aquí.';

-- El perfil se crea solo al registrarse. Si dependiera de que la
-- aplicación lo llame, tarde o temprano habría usuarios sin perfil.
create or replace function crea_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists usuarios_alta_perfil on auth.users;
create trigger usuarios_alta_perfil
  after insert on auth.users
  for each row execute function crea_perfil();

-- ---------------------------------------------------------------------
-- 2 · Lista de vigilancia
-- ---------------------------------------------------------------------
create table if not exists vigilancia (
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  plataforma_id uuid not null references plataformas(id) on delete cascade,
  creado_el     timestamptz not null default now(),
  primary key (usuario_id, plataforma_id)
);

create index if not exists vigilancia_por_plataforma on vigilancia (plataforma_id);

-- ---------------------------------------------------------------------
-- 3 · Cola de avisos por correo
-- ---------------------------------------------------------------------
-- Misma idea que `avisos_pendientes` de la app: la base decide a quién
-- hay que avisar, y el proceso de envío solo lee y marca. Así el aviso
-- no depende de que nadie se acuerde de dispararlo.
create table if not exists avisos_correo (
  id           bigint generated always as identity primary key,
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  cambio_id    bigint not null references cambios_estado(id) on delete cascade,
  enviado_el   timestamptz,
  creado_el    timestamptz not null default now(),
  unique (usuario_id, cambio_id)
);

create index if not exists avisos_correo_cola on avisos_correo (creado_el) where enviado_el is null;

-- Cuando una plataforma cambia de estado, se encola un aviso para cada
-- persona que la vigilaba y que no los haya desactivado.
create or replace function encola_avisos_correo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into avisos_correo (usuario_id, cambio_id)
  select v.usuario_id, new.id
    from vigilancia v
    join perfiles p on p.id = v.usuario_id
   where v.plataforma_id = new.plataforma_id
     and p.avisos_correo
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists cambios_encolan_correo on cambios_estado;
create trigger cambios_encolan_correo
  after insert on cambios_estado
  for each row execute function encola_avisos_correo();

-- Lo que lee el proceso de envío. Trae ya el texto montado para que el
-- que envía no tenga que saber nada del dominio.
create or replace view avisos_correo_pendientes as
  select a.id,
         u.email,
         coalesce(pf.nombre, split_part(u.email, '@', 1)) as nombre,
         c.titular,
         c.detalle,
         c.ocurrido_el,
         pl.nombre as plataforma
    from avisos_correo a
    join auth.users u    on u.id = a.usuario_id
    join perfiles pf     on pf.id = a.usuario_id
    join cambios_estado c on c.id = a.cambio_id
    join plataformas pl  on pl.id = c.plataforma_id
   where a.enviado_el is null;

-- ---------------------------------------------------------------------
-- 4 · Seguridad por fila
-- ---------------------------------------------------------------------
-- Cada cual, y solo cada cual, ve y toca lo suyo.
alter table perfiles      enable row level security;
alter table vigilancia    enable row level security;
alter table avisos_correo enable row level security;

drop policy if exists "el perfil se ve a si mismo" on perfiles;
create policy "el perfil se ve a si mismo" on perfiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "el perfil se edita a si mismo" on perfiles;
create policy "el perfil se edita a si mismo" on perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "vigilancia propia visible" on vigilancia;
create policy "vigilancia propia visible" on vigilancia
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "vigilancia propia se anade" on vigilancia;
create policy "vigilancia propia se anade" on vigilancia
  for insert to authenticated with check (usuario_id = auth.uid());

drop policy if exists "vigilancia propia se quita" on vigilancia;
create policy "vigilancia propia se quita" on vigilancia
  for delete to authenticated using (usuario_id = auth.uid());

-- Los avisos se leen, no se escriben desde el cliente: los pone el
-- trigger y los marca el proceso de envío con la clave de servicio.
drop policy if exists "avisos propios visibles" on avisos_correo;
create policy "avisos propios visibles" on avisos_correo
  for select to authenticated using (usuario_id = auth.uid());

-- El navegador necesita leer estas tablas; sin permisos explícitos no
-- llega ni a evaluarse la política. (La exposición automática está
-- desactivada en este proyecto, por eso van tabla por tabla.)
grant select, update            on perfiles      to authenticated;
grant select, insert, delete    on vigilancia    to authenticated;
grant select                    on avisos_correo to authenticated;

commit;
