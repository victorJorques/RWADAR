-- =====================================================================
-- RWAdar · tablas que dan valor propio a la app nativa
-- ---------------------------------------------------------------------
-- Estas tres tablas son las que justifican que exista una app y no solo
-- una web. Son la respuesta a la directriz 4.2 de Apple: sin ellas, la
-- app es la web envuelta y la rechazan.
--
--   cambios_estado  · el historial que dispara los avisos
--   dispositivos    · a quién hay que avisar
--   seguimiento     · qué le importa a cada persona
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1 · Historial de cambios
-- ---------------------------------------------------------------------
-- El caso de uso real: RealT y Goldfinch se hundieron mientras había
-- gente dentro. Quien siguiera esas plataformas debería haberse
-- enterado el mismo día, no al volver a entrar en la web.
create table cambios_estado (
  id              bigint generated always as identity primary key,
  plataforma_id   uuid not null references plataformas(id) on delete cascade,
  estado_anterior rwa_estado,
  estado_nuevo    rwa_estado not null,
  titular         text not null,
  detalle         text,
  notificado_el   timestamptz,
  ocurrido_el     timestamptz not null default now()
);

create index on cambios_estado (ocurrido_el desc);
create index on cambios_estado (plataforma_id, ocurrido_el desc);
-- Los que aún no se han enviado: la cola de trabajo del proceso de avisos
create index on cambios_estado (ocurrido_el) where notificado_el is null;

-- Registrar el cambio es responsabilidad de la base, no de quien edita.
-- Así es imposible mover una plataforma al descarte sin dejar rastro.
create function registra_cambio_estado() returns trigger language plpgsql as $$
begin
  if new.estado is distinct from old.estado then
    insert into cambios_estado (plataforma_id, estado_anterior, estado_nuevo, titular, detalle)
    values (
      new.id, old.estado, new.estado,
      case new.estado
        when 'descartada' then new.nombre || ' sale del radar'
        else new.nombre || ' entra en el radar'
      end,
      coalesce(new.motivo_descarte, new.aval)
    );
  end if;
  return new;
end $$;

create trigger plataformas_cambio_estado
  after update of estado on plataformas
  for each row execute function registra_cambio_estado();

-- ---------------------------------------------------------------------
-- 2 · Dispositivos para avisos push
-- ---------------------------------------------------------------------
-- Sin user_id: se permite seguir plataformas sin registrarse, que reduce
-- muchísimo el abandono en la primera pantalla de una app de consulta.
create table dispositivos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  instalacion   text not null unique,          -- identificador anónimo del dispositivo
  token_push    text unique,
  sistema       text not null check (sistema in ('ios', 'android', 'web')),
  version_app   text,
  visto_el      timestamptz not null default now(),
  creado_el     timestamptz not null default now()
);

create index on dispositivos (user_id) where user_id is not null;

-- ---------------------------------------------------------------------
-- 3 · Lista de seguimiento
-- ---------------------------------------------------------------------
create table seguimiento (
  instalacion   text not null,
  plataforma_id uuid not null references plataformas(id) on delete cascade,
  creado_el     timestamptz not null default now(),
  primary key (instalacion, plataforma_id),
  foreign key (instalacion) references dispositivos(instalacion) on delete cascade
);

create index on seguimiento (plataforma_id);

-- ---------------------------------------------------------------------
-- A quién avisar de un cambio concreto
-- ---------------------------------------------------------------------
create view avisos_pendientes as
  select c.id as cambio_id, c.titular, c.detalle, c.plataforma_id,
         d.token_push, d.sistema
  from cambios_estado c
  join seguimiento s on s.plataforma_id = c.plataforma_id
  join dispositivos d on d.instalacion = s.instalacion
  where c.notificado_el is null
    and d.token_push is not null;
