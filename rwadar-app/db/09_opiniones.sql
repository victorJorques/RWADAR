-- =====================================================================
-- RWAdar · opiniones de usuarios sobre las plataformas
-- ---------------------------------------------------------------------
-- Esto es lo más delicado que tiene el proyecto, y conviene entender por
-- qué antes de tocarlo.
--
-- RWAdar señala empresas por su nombre y hasta hoy solo publicaba lo que
-- podía respaldar con una fuente citable. Una opinión de usuario NO tiene
-- fuente: es una vivencia. Si se mezclan, se contamina lo único que da
-- credibilidad al registro. De ahí tres decisiones que no son opcionales:
--
--   1 · SEPARACIÓN. La opinión vive en su propia tabla y se muestra
--       aparte de la verificación editorial. Nunca se promedian ni se
--       presentan como si fueran lo mismo.
--   2 · RESPONSABILIDAD. Cada opinión tiene autor identificable, se
--       puede denunciar, y con 3 denuncias se oculta sola a la espera
--       de revisión. Sin ese circuito, alojar acusaciones de terceros
--       deja de estar amparado.
--   3 · HONESTIDAD. No se comprueba que quien opina haya sido cliente,
--       y la web lo dice con esas palabras. La normativa europea de
--       reseñas obliga a declarar si se verifica y cómo; mentir ahí es
--       una infracción de consumo, no un detalle.
--
-- Depende de 01_schema.sql y 07_cuentas.sql.  Es idempotente.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1 · La opinión
-- ---------------------------------------------------------------------
-- Una por persona y plataforma: la clave primaria lo impide sin más
-- lógica. Se puede editar y borrar, pero no acumular.
create table if not exists opiniones (
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  plataforma_id  uuid not null references plataformas(id) on delete cascade,
  nota           smallint not null check (nota between 1 and 10),
  texto          text not null check (length(trim(texto)) between 20 and 1200),
  estado         text not null default 'visible' check (estado in ('visible','oculta')),
  denuncias      smallint not null default 0,
  creado_el      timestamptz not null default now(),
  actualizado_el timestamptz not null default now(),
  primary key (usuario_id, plataforma_id)
);

create index if not exists opiniones_por_plataforma
  on opiniones (plataforma_id, creado_el desc) where estado = 'visible';

-- Editar deja rastro de cuándo, para poder mostrar «editada».
create or replace function toca_opinion() returns trigger
language plpgsql as $$
begin new.actualizado_el := now(); return new; end $$;

drop trigger if exists opiniones_tocadas on opiniones;
create trigger opiniones_tocadas before update on opiniones
  for each row execute function toca_opinion();

-- ---------------------------------------------------------------------
-- 2 · Denuncias
-- ---------------------------------------------------------------------
-- Una por persona y opinión, para que no se pueda hundir a alguien
-- pulsando el botón cincuenta veces.
create table if not exists denuncias (
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  usuario_id     uuid not null,
  plataforma_id  uuid not null,
  motivo         text check (motivo is null or length(trim(motivo)) <= 300),
  creado_el      timestamptz not null default now(),
  primary key (denunciante_id, usuario_id, plataforma_id),
  foreign key (usuario_id, plataforma_id) references opiniones (usuario_id, plataforma_id) on delete cascade
);

-- Tres denuncias distintas y la opinión se retira sola hasta que alguien
-- la mire. Es preferible ocultar de más que dejar publicada una acusación
-- que varias personas señalan como falsa.
create or replace function revisa_denuncias() returns trigger
language plpgsql security definer set search_path = public as $$
declare n smallint;
begin
  select count(*) into n from denuncias d
    where d.usuario_id = new.usuario_id and d.plataforma_id = new.plataforma_id;
  update opiniones o set denuncias = n,
         estado = case when n >= 3 then 'oculta' else o.estado end
   where o.usuario_id = new.usuario_id and o.plataforma_id = new.plataforma_id;
  return new;
end $$;

drop trigger if exists denuncias_revisan on denuncias;
create trigger denuncias_revisan after insert on denuncias
  for each row execute function revisa_denuncias();

-- ---------------------------------------------------------------------
-- 3 · Lo que se publica
-- ---------------------------------------------------------------------
-- El correo NO sale nunca. Sale el nombre que la persona haya puesto, y
-- si no puso ninguno, «Anónimo»: mejor eso que exponer media dirección.
create or replace view opiniones_publicas as
  select o.plataforma_id,
         p.nombre                                   as plataforma,
         coalesce(nullif(trim(pf.nombre), ''), 'Anónimo') as autor,
         o.nota, o.texto, o.creado_el,
         (o.actualizado_el > o.creado_el + interval '1 minute') as editada
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
    left join perfiles pf on pf.id = o.usuario_id
   where o.estado = 'visible';

-- La media, redondeada a un decimal, y cuántas la sostienen. Con menos de
-- tres opiniones no se publica media: un solo enfadado no es una nota.
create or replace view nota_media as
  select o.plataforma_id,
         p.nombre as plataforma,
         count(*)::int as opiniones,
         case when count(*) >= 3 then round(avg(o.nota)::numeric, 1) end as media
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible'
   group by o.plataforma_id, p.nombre;

-- ---------------------------------------------------------------------
-- 4 · Seguridad por fila
-- ---------------------------------------------------------------------
alter table opiniones enable row level security;
alter table denuncias enable row level security;

-- Leer, cualquiera: son públicas por definición.
drop policy if exists "las opiniones visibles se leen" on opiniones;
create policy "las opiniones visibles se leen" on opiniones
  for select to anon, authenticated using (estado = 'visible');

-- Quien ha entrado ve también la suya aunque esté oculta, para saber
-- que se ha retirado y poder corregirla.
drop policy if exists "cada cual ve la suya" on opiniones;
create policy "cada cual ve la suya" on opiniones
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "opinar en nombre propio" on opiniones;
create policy "opinar en nombre propio" on opiniones
  for insert to authenticated with check (usuario_id = auth.uid());

drop policy if exists "editar la propia" on opiniones;
create policy "editar la propia" on opiniones
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "borrar la propia" on opiniones;
create policy "borrar la propia" on opiniones
  for delete to authenticated using (usuario_id = auth.uid());

drop policy if exists "denunciar" on denuncias;
create policy "denunciar" on denuncias
  for insert to authenticated with check (denunciante_id = auth.uid());

drop policy if exists "ver las denuncias propias" on denuncias;
create policy "ver las denuncias propias" on denuncias
  for select to authenticated using (denunciante_id = auth.uid());

grant select                          on opiniones         to anon, authenticated;
grant insert, update, delete          on opiniones         to authenticated;
grant select, insert                  on denuncias         to authenticated;
grant select                          on opiniones_publicas to anon, authenticated;
grant select                          on nota_media         to anon, authenticated;

commit;
