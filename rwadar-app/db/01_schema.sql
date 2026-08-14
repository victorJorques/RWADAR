-- =====================================================================
-- RWAdar · esquema de datos
-- ---------------------------------------------------------------------
-- Principio de diseño: las reglas editoriales viven en la base de datos,
-- no en la cabeza de quien introduce los datos. Si una ficha es
-- incoherente, la base la rechaza en el momento de escribirla en lugar
-- de dejar que llegue a producción.
-- Postgres 14+. Portátil: no usa nada específico de Supabase.
-- =====================================================================

create type rwa_estado as enum ('en_radar', 'descartada');
create type rwa_acceso as enum ('Minorista', 'Acreditado', 'Institucional', 'Empresas');
create type rwa_ticket as enum ('Bajo', 'Medio', 'Alto', 'No aplica');
create type rwa_actor  as enum ('Marketplace', 'Emisor', 'Infraestructura');

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
create table categorias (
  slug   text     primary key,
  nombre text     not null unique,
  color  text     not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  orden  smallint not null unique
);

create table regiones (
  slug   text primary key,
  nombre text not null unique
);

-- ---------------------------------------------------------------------
-- Plataformas
-- ---------------------------------------------------------------------
create table plataformas (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre            text not null check (length(trim(nombre)) > 0),
  estado            rwa_estado not null,

  -- Solo para las que están en el radar
  categoria_slug    text references categorias(slug) on update cascade,
  region_slug       text references regiones(slug)   on update cascade,
  actor             rwa_actor,
  acceso            rwa_acceso,
  ticket            rwa_ticket,
  cadenas           text,
  web               text check (web is null or web ~ '^https://'),
  aval              text,   -- por qué supera el filtro
  nota              text,   -- qué hace

  -- Solo para las descartadas
  etiqueta_descarte text,   -- el distintivo corto: "Crisis", "Escala"…
  motivo_descarte   text,   -- la explicación

  verificada_el     date not null default current_date,
  creada_el         timestamptz not null default now(),
  actualizada_el    timestamptz not null default now(),

  -- Poka-yoke: una ficha en el radar está completa; una descartada
  -- explica por qué. Ninguna puede mezclar ambos mundos.
  constraint ficha_coherente check (
    case estado
      when 'en_radar' then
        categoria_slug is not null and region_slug is not null
        and actor is not null and acceso is not null and ticket is not null
        and web is not null and aval is not null and nota is not null
        and etiqueta_descarte is null and motivo_descarte is null
      when 'descartada' then
        etiqueta_descarte is not null and motivo_descarte is not null
        and length(trim(motivo_descarte)) >= 40
    end
  )
);

-- ---------------------------------------------------------------------
-- Fuentes: cada afirmación comprobable, con su respaldo
-- ---------------------------------------------------------------------
create table fuentes (
  id            uuid primary key default gen_random_uuid(),
  plataforma_id uuid not null references plataformas(id) on delete cascade,
  url           text not null check (url ~ '^https?://'),
  titulo        text,
  publicada_el  date,
  consultada_el date not null default current_date,
  unique (plataforma_id, url)
);

create index on fuentes (plataforma_id);
create index on plataformas (estado);
create index on plataformas (categoria_slug) where estado = 'en_radar';

-- ---------------------------------------------------------------------
-- Mantener actualizada_el sin depender de la aplicación
-- ---------------------------------------------------------------------
create function toca_actualizada_el() returns trigger language plpgsql as $$
begin
  new.actualizada_el = now();
  return new;
end $$;

create trigger plataformas_actualizada
  before update on plataformas
  for each row execute function toca_actualizada_el();

-- ---------------------------------------------------------------------
-- Control de calidad: acusar a una empresa sin fuente es el riesgo
-- legal más serio del proyecto. Esta vista lo hace visible.
-- ---------------------------------------------------------------------
create view descartadas_sin_fuente as
  select p.slug, p.nombre, p.etiqueta_descarte
  from plataformas p
  left join fuentes f on f.plataforma_id = p.id
  where p.estado = 'descartada'
  group by p.id, p.slug, p.nombre, p.etiqueta_descarte
  having count(f.id) = 0;

-- Lo que consume la web y las apps: una sola consulta, ya ordenada.
create view radar_publico as
  select p.slug, p.nombre, c.nombre as categoria, c.color, c.orden as categoria_orden,
         r.nombre as region, p.actor, p.acceso, p.ticket, p.cadenas, p.web,
         p.aval, p.nota, p.verificada_el,
         coalesce(
           (select json_agg(json_build_object('url', f.url, 'titulo', f.titulo)
                            order by f.consultada_el desc)
            from fuentes f where f.plataforma_id = p.id),
           '[]'::json) as fuentes,
         p.id as plataforma_id
  from plataformas p
  join categorias c on c.slug = p.categoria_slug
  join regiones   r on r.slug = p.region_slug
  where p.estado = 'en_radar'
  order by p.nombre;
