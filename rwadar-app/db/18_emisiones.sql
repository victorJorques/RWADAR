-- =====================================================================
-- RWAdar · las emisiones abiertas
-- ---------------------------------------------------------------------
-- Hasta aquí el registro listaba PLATAFORMAS. Esto es la guía de
-- hoteles: se consulta una vez y no se vuelve.
--
-- Una emisión es la habitación libre: *este* edificio en Málaga, desde
-- 100 €, 6,2% anual, cierra el día 12. Es lo que hace que alguien vuelva
-- cada semana, lo que un medio enlaza, y lo único por lo que una empresa
-- pagaría algún día. Sin esto, cobrar por aparecer es vender un anuncio
-- en una valla que no mira nadie.
--
-- CUATRO REGLAS QUE LA BASE HACE CUMPLIR, no la buena voluntad de quien
-- escribe. Aquí se manejan cifras de dinero ajeno, así que el listón
-- sube respecto al resto del esquema:
--
--   1. NINGUNA EMISIÓN SIN ENLACE A SU ORIGEN. `url` es obligatoria y
--      https. La cifra que publicamos es siempre la que dice la
--      plataforma, y cualquiera tiene que poder ir a comprobarla en un
--      clic. Es la misma regla que «ninguna descartada sin fuente», que
--      ya evitó el mayor riesgo legal del proyecto.
--   2. NADA SE PUBLICA SIN FECHA DE COMPROBACIÓN. `verificada_el` es
--      obligatoria. Una rentabilidad de hace tres meses presentada como
--      actual es peor que no publicar nada: la vista
--      `emisiones_rancias` las saca a la luz para que no se cuelen.
--   3. NO SE PROMOCIONA A QUIEN NO PASA EL FILTRO. Una emisión solo
--      puede colgar de una plataforma `en_radar`. Si una plataforma cae
--      del radar, sus emisiones abiertas se cierran solas.
--   4. LO PAGADO SE MARCA COMO PAGADO. `patrocinada` existe desde el
--      primer día, aunque hoy no cobremos: el día que se cobre, la web
--      ya lo sabrá etiquetar. Booking marca los anuncios; el veredicto
--      editorial —en el radar o descartada— NO se vende nunca, y esa
--      separación es lo único que hace que el resto se crea.
-- =====================================================================

create type rwa_emision as enum ('abierta', 'cerrada', 'completada', 'cancelada');
create type rwa_rendimiento as enum ('Alquiler', 'Plusvalía', 'Interés', 'Mixto');

create table emisiones (
  id            uuid primary key default gen_random_uuid(),
  plataforma_id uuid not null references plataformas(id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9-]+$'),

  -- Qué se ofrece
  titulo        text not null check (length(trim(titulo)) between 8 and 120),
  resumen       text check (resumen is null or length(trim(resumen)) between 20 and 400),
  categoria_slug text not null references categorias(slug) on update cascade,
  ubicacion     text,          -- "Málaga, España". Libre: no todo es inmueble.

  -- Los números. Todos opcionales salvo el ticket: hay emisiones que no
  -- publican objetivo, y preferimos listarlas con un hueco antes que
  -- inventarnos la cifra.
  moneda            text not null default 'EUR' check (moneda ~ '^[A-Z]{3}$'),
  ticket_minimo     numeric(14,2) not null check (ticket_minimo > 0),
  objetivo          numeric(14,2) check (objetivo is null or objetivo > 0),
  captado           numeric(14,2) check (captado is null or captado >= 0),
  rentabilidad      numeric(5,2)  check (rentabilidad is null or rentabilidad between 0 and 100),
  plazo_meses       smallint      check (plazo_meses is null or plazo_meses between 1 and 600),
  tipo_rendimiento  rwa_rendimiento,

  -- El calendario, que es lo que da urgencia y lo que ordena la lista
  abre_el   date,
  cierra_el date,

  estado rwa_emision not null default 'abierta',

  -- De dónde sale todo lo de arriba
  url           text not null check (url ~ '^https://'),
  verificada_el date not null default current_date,

  -- Lo que convierte esto en un producto que nadie puede copiar: qué se
  -- prometió y qué se acabó pagando. Se rellena al cerrar.
  rentabilidad_real numeric(5,2) check (rentabilidad_real is null or rentabilidad_real between -100 and 100),
  resultado_nota    text,

  -- Booking marca los anuncios. Nosotros también, desde el primer día.
  patrocinada boolean not null default false,

  creada_el      timestamptz not null default now(),
  actualizada_el timestamptz not null default now(),

  -- Una emisión no puede cerrar antes de abrir.
  constraint fechas_coherentes check (
    abre_el is null or cierra_el is null or cierra_el >= abre_el
  ),

  -- Si está abierta, decimos cuándo cierra. Sin fecha de cierre no hay
  -- urgencia, y sin urgencia esto vuelve a ser un directorio.
  constraint abierta_tiene_cierre check (
    estado <> 'abierta' or cierra_el is not null
  ),

  -- Lo pagado solo se cuenta cuando ya se sabe.
  constraint resultado_solo_al_final check (
    rentabilidad_real is null or estado in ('completada', 'cancelada')
  )
);

create index on emisiones (estado, cierra_el);
create index on emisiones (plataforma_id);
create index on emisiones (categoria_slug);
create index on emisiones (cierra_el) where estado = 'abierta';

create trigger emisiones_actualizada
  before update on emisiones
  for each row execute function toca_actualizada_el();

-- ---------------------------------------------------------------------
-- Regla 3, la que no se puede escribir como CHECK porque mira otra
-- tabla: solo se promociona lo que pasa el filtro.
-- ---------------------------------------------------------------------
create function emision_de_plataforma_en_radar() returns trigger
language plpgsql as $$
declare e rwa_estado;
begin
  select estado into e from plataformas where id = new.plataforma_id;
  if e is distinct from 'en_radar' then
    raise exception 'no se listan emisiones de una plataforma que no está en el radar (%)', e;
  end if;
  return new;
end $$;

create trigger emisiones_solo_en_radar
  before insert or update of plataforma_id on emisiones
  for each row execute function emision_de_plataforma_en_radar();

-- Y si una plataforma cae del radar, sus emisiones abiertas dejan de
-- estarlo en el mismo instante. Sin esto quedaría promocionando dinero
-- de una plataforma que acabamos de descartar, que es el peor escenario
-- imaginable para la credibilidad del registro.
create function cerrar_emisiones_al_descartar() returns trigger
language plpgsql as $$
begin
  if new.estado = 'descartada' and old.estado is distinct from 'descartada' then
    update emisiones
       set estado = 'cancelada',
           resultado_nota = coalesce(resultado_nota, '') ||
             'Cerrada automáticamente: la plataforma salió del radar el ' || current_date || '.'
     where plataforma_id = new.id and estado = 'abierta';
  end if;
  return new;
end $$;

create trigger plataformas_arrastran_emisiones
  after update of estado on plataformas
  for each row execute function cerrar_emisiones_al_descartar();

-- ---------------------------------------------------------------------
-- Control de calidad. El equivalente a `descartadas_sin_fuente`, pero
-- para dinero: una emisión abierta cuya comprobación ha envejecido, o
-- cuya fecha de cierre ya pasó y sigue anunciándose como abierta.
-- ---------------------------------------------------------------------
create view emisiones_rancias as
  select e.slug, p.nombre as plataforma, e.titulo, e.verificada_el, e.cierra_el,
         case
           when e.cierra_el < current_date then 'la fecha de cierre ya pasó'
           else 'sin comprobar desde hace ' || (current_date - e.verificada_el) || ' días'
         end as motivo
  from emisiones e
  join plataformas p on p.id = e.plataforma_id
  where e.estado = 'abierta'
    and (e.cierra_el < current_date or e.verificada_el < current_date - 14);

-- ---------------------------------------------------------------------
-- Lo que consume la web: una sola consulta, ya ordenada por lo que
-- cierra antes, que es como se mira esto.
-- ---------------------------------------------------------------------
create view emisiones_publicas as
  select e.slug, e.titulo, e.resumen, e.ubicacion,
         p.slug as plataforma_slug, p.nombre as plataforma, p.web as plataforma_web,
         c.nombre as categoria, c.color,
         e.moneda, e.ticket_minimo, e.objetivo, e.captado,
         case when e.objetivo > 0 then round(100 * coalesce(e.captado,0) / e.objetivo, 1) end as porcentaje,
         e.rentabilidad, e.plazo_meses, e.tipo_rendimiento,
         e.abre_el, e.cierra_el,
         case when e.cierra_el is not null then e.cierra_el - current_date end as dias_para_cerrar,
         e.estado, e.url, e.verificada_el,
         e.rentabilidad_real, e.resultado_nota, e.patrocinada
  from emisiones e
  join plataformas p  on p.id = e.plataforma_id
  join categorias  c  on c.slug = e.categoria_slug
  order by (e.estado = 'abierta') desc, e.cierra_el asc nulls last, e.verificada_el desc;

-- ---------------------------------------------------------------------
-- Seguridad: igual que el resto del contenido editorial. Se lee desde
-- el navegador, se escribe solo con la clave de servicio.
-- ---------------------------------------------------------------------
alter table emisiones enable row level security;

create policy "emisiones visibles" on emisiones
  for select to anon, authenticated using (true);

grant select on emisiones to anon, authenticated;
grant select on emisiones_publicas to anon, authenticated;
