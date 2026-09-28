-- =====================================================================
-- RWAdar · catálogo verificable para el relanzamiento
-- ---------------------------------------------------------------------
-- Migración de lanzamiento; el estado de aplicación se registra en INTERNO.md.
--
-- La fotografía de revisión de septiembre no puede vivir solo en un fixture:
-- si el publicador siguiera leyendo radar_publico/emisiones_publicas, una
-- sincronización remota podría volver a introducir afirmaciones anteriores a
-- la revisión. Esta migración añade un almacén editorial privado y dos vistas
-- públicas mínimas. Ambas fallan cerradas como lote: 26 plataformas y 28
-- ofertas, o ninguna fila.
--
-- Las tablas se mantienen fuera del esquema expuesto `public`. Las vistas son
-- security_invoker, RLS permanece activo como defensa en profundidad y los
-- roles cliente solo reciben SELECT. No existe ninguna política de escritura.
-- =====================================================================

create schema if not exists rwadar_catalogo;
revoke all on schema rwadar_catalogo from public;
grant usage on schema rwadar_catalogo to anon, authenticated;

create type rwadar_catalogo.estado_revision as enum
  ('borrador', 'aprobada', 'retirada');
create type rwadar_catalogo.estado_operativo as enum
  ('observada', 'no_verificable');
create type rwadar_catalogo.estado_licencia as enum
  ('confirmada_regulador', 'confirmada_documento_producto',
   'no_aplica_plataforma', 'no_verificable', 'sin_registro_declarado');
create type rwadar_catalogo.estado_acceso as enum
  ('confirmado_condicionado', 'no_aplica_plataforma', 'no_verificable');
create type rwadar_catalogo.campo_plataforma as enum
  ('estado_operativo', 'licencia_registro', 'acceso');
create type rwadar_catalogo.estado_oferta as enum
  ('actual', 'no_verificable', 'fuentes_en_conflicto');

create function rwadar_catalogo.es_array_json(valor jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(valor) = 'array'
$$;

create function rwadar_catalogo.es_array_texto_https(valor jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(valor) = 'array'
     and jsonb_array_length(valor) > 0
     and not exists (
       select 1
         from jsonb_array_elements(valor) elemento
        where jsonb_typeof(elemento) <> 'string'
           or trim(both '"' from elemento::text) !~ '^https://[^[:space:]]+$'
     )
$$;

revoke all on function rwadar_catalogo.es_array_json(jsonb) from public;
revoke all on function rwadar_catalogo.es_array_texto_https(jsonb) from public;

create table rwadar_catalogo.revisiones (
  id                    uuid primary key,
  version_esquema       smallint not null default 1 check (version_esquema = 1),
  verificado_el         date not null,
  vigencia_dias         smallint not null default 7 check (vigencia_dias between 1 and 7),
  estado                rwadar_catalogo.estado_revision not null default 'borrador',
  contenido_sha256      text not null unique check (contenido_sha256 ~ '^[a-f0-9]{64}$'),
  origen                text not null check (length(trim(origen)) between 20 and 500),
  plataformas_esperadas smallint not null default 26 check (plataformas_esperadas = 26),
  ofertas_esperadas     smallint not null default 28 check (ofertas_esperadas = 28),
  aprobada_el           timestamptz,
  aprobada_referencia   text,
  creada_el             timestamptz not null default now(),
  constraint aprobacion_documentada check (
    (estado = 'aprobada' and aprobada_el is not null
      and length(trim(aprobada_referencia)) >= 12)
    or (estado <> 'aprobada' and aprobada_el is null
      and aprobada_referencia is null)
  )
);

create table rwadar_catalogo.fuentes (
  revision_id  uuid not null references rwadar_catalogo.revisiones(id) on delete cascade,
  id           text not null check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  tipo         text not null check (length(trim(tipo)) between 3 and 60),
  titulo       text not null check (length(trim(titulo)) between 3 and 300),
  url          text not null check (url ~ '^https://[^[:space:]]+$'),
  primaria     boolean not null check (primaria),
  consultada_el date not null,
  primary key (revision_id, id)
);

create table rwadar_catalogo.plataformas (
  revision_id uuid not null references rwadar_catalogo.revisiones(id) on delete cascade,
  plataforma_id uuid not null references public.plataformas(id) on delete restrict,
  fecha_canonica_conservada date not null,
  estado_operativo rwadar_catalogo.estado_operativo not null,
  estado_operativo_detalle text not null
    check (length(trim(estado_operativo_detalle)) between 24 and 3000),
  licencia_registro rwadar_catalogo.estado_licencia not null,
  licencia_registro_detalle text not null
    check (length(trim(licencia_registro_detalle)) between 24 and 3000),
  acceso rwadar_catalogo.estado_acceso not null,
  acceso_detalle text not null
    check (length(trim(acceso_detalle)) between 24 and 3000),
  primary key (revision_id, plataforma_id)
);

create table rwadar_catalogo.plataforma_fuentes (
  revision_id uuid not null,
  plataforma_id uuid not null,
  campo rwadar_catalogo.campo_plataforma not null,
  fuente_id text not null,
  primary key (revision_id, plataforma_id, campo, fuente_id),
  foreign key (revision_id, plataforma_id)
    references rwadar_catalogo.plataformas(revision_id, plataforma_id)
    on delete cascade,
  foreign key (revision_id, fuente_id)
    references rwadar_catalogo.fuentes(revision_id, id)
    on delete restrict
);

create table rwadar_catalogo.alertas (
  revision_id uuid not null,
  plataforma_id uuid not null,
  codigo text not null check (codigo ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  detalle text not null check (length(trim(detalle)) between 24 and 3000),
  primary key (revision_id, plataforma_id, codigo),
  foreign key (revision_id, plataforma_id)
    references rwadar_catalogo.plataformas(revision_id, plataforma_id)
    on delete cascade
);

create table rwadar_catalogo.alerta_fuentes (
  revision_id uuid not null,
  plataforma_id uuid not null,
  alerta_codigo text not null,
  fuente_id text not null,
  primary key (revision_id, plataforma_id, alerta_codigo, fuente_id),
  foreign key (revision_id, plataforma_id, alerta_codigo)
    references rwadar_catalogo.alertas(revision_id, plataforma_id, codigo)
    on delete cascade,
  foreign key (revision_id, fuente_id)
    references rwadar_catalogo.fuentes(revision_id, id)
    on delete restrict
);

create table rwadar_catalogo.ofertas (
  revision_id       uuid not null references rwadar_catalogo.revisiones(id) on delete cascade,
  slug              text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  tipo              text not null check (tipo in ('rendimiento', 'valor')),
  titulo            text not null check (length(trim(titulo)) between 3 and 180),
  plataforma_slug   text not null check (plataforma_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  plataforma_nombre text not null check (length(trim(plataforma_nombre)) between 2 and 120),
  categoria_slug    text not null references public.categorias(slug) on update cascade,
  pais              text check (pais is null or length(trim(pais)) between 2 and 100),
  resumen           text not null check (length(trim(resumen)) between 20 and 3000),
  url               text not null check (url ~ '^https://[^[:space:]]+$'),
  verificada_el     date not null,
  vigencia_dias     smallint not null check (vigencia_dias between 1 and 7),
  permanente        boolean not null default false,
  disponible_es     boolean,
  eu                boolean,
  fuera_ladrillo    boolean not null default false,
  puntuacion        numeric(5,2),
  rentabilidad      jsonb,
  precio            jsonb,
  metricas          jsonb not null,
  avisos            jsonb not null,
  estado_revision   rwadar_catalogo.estado_oferta not null,
  fuentes_actuales  jsonb not null,
  patrocinada       boolean not null default false,
  primary key (revision_id, slug),
  constraint oferta_json_valido check (
    (rentabilidad is null or jsonb_typeof(rentabilidad) = 'object')
    and (precio is null or jsonb_typeof(precio) = 'object')
    and rwadar_catalogo.es_array_json(metricas)
    and jsonb_array_length(metricas) > 0
    and rwadar_catalogo.es_array_json(avisos)
    and jsonb_array_length(avisos) > 0
    and rwadar_catalogo.es_array_texto_https(fuentes_actuales)
  ),
  constraint oferta_bloqueada_sin_cifras check (
    estado_revision = 'actual' or (rentabilidad is null and precio is null)
  )
);

create index revisiones_publicables_idx
  on rwadar_catalogo.revisiones (verificado_el desc)
  where estado = 'aprobada';
create index ofertas_revision_idx on rwadar_catalogo.ofertas (revision_id, estado_revision);

alter table rwadar_catalogo.revisiones enable row level security;
alter table rwadar_catalogo.fuentes enable row level security;
alter table rwadar_catalogo.plataformas enable row level security;
alter table rwadar_catalogo.plataforma_fuentes enable row level security;
alter table rwadar_catalogo.alertas enable row level security;
alter table rwadar_catalogo.alerta_fuentes enable row level security;
alter table rwadar_catalogo.ofertas enable row level security;

create policy revisiones_aprobadas_vigentes on rwadar_catalogo.revisiones
  for select to anon, authenticated
  using (estado = 'aprobada'
    and verificado_el <= current_date
    and current_date <= verificado_el + vigencia_dias);

create policy fuentes_de_revision_vigente on rwadar_catalogo.fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));
create policy plataformas_de_revision_vigente on rwadar_catalogo.plataformas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));
create policy plataforma_fuentes_de_revision_vigente on rwadar_catalogo.plataforma_fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));
create policy alertas_de_revision_vigente on rwadar_catalogo.alertas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));
create policy alerta_fuentes_de_revision_vigente on rwadar_catalogo.alerta_fuentes
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));
create policy ofertas_de_revision_vigente on rwadar_catalogo.ofertas
  for select to anon, authenticated using (exists (
    select 1 from rwadar_catalogo.revisiones r
     where r.id = revision_id and r.estado = 'aprobada'
       and r.verificado_el <= current_date
       and current_date <= r.verificado_el + r.vigencia_dias));

revoke all on all tables in schema rwadar_catalogo from public, anon, authenticated;
grant select on rwadar_catalogo.revisiones, rwadar_catalogo.fuentes,
  rwadar_catalogo.plataformas, rwadar_catalogo.plataforma_fuentes,
  rwadar_catalogo.alertas, rwadar_catalogo.alerta_fuentes,
  rwadar_catalogo.ofertas to anon, authenticated;

-- El lote solo existe para las vistas si está completo y cada relación de
-- evidencia tiene al menos una fuente. Una fila dañada vacía las DOS vistas.
create view rwadar_catalogo.revision_publicable with (security_invoker = true) as
with candidatas as (
  select r.*
    from rwadar_catalogo.revisiones r
   where r.estado = 'aprobada'
     and r.verificado_el <= current_date
     and current_date <= r.verificado_el + r.vigencia_dias
     and (select count(*) from rwadar_catalogo.plataformas p
           where p.revision_id = r.id) = 26
     and (select count(*) from rwadar_catalogo.ofertas o
           where o.revision_id = r.id) = 28
     and not exists (
       select 1 from public.plataformas p
        where p.estado = 'en_radar'
          and not exists (
            select 1 from rwadar_catalogo.plataformas v
             where v.revision_id = r.id and v.plataforma_id = p.id))
     and not exists (
       select 1 from rwadar_catalogo.plataformas v
        join public.plataformas p on p.id = v.plataforma_id
       where v.revision_id = r.id
         and (p.estado <> 'en_radar'
           or v.fecha_canonica_conservada <> p.verificada_el
           or (select count(distinct pf.campo)
                 from rwadar_catalogo.plataforma_fuentes pf
                where pf.revision_id = v.revision_id
                  and pf.plataforma_id = v.plataforma_id) <> 3
           or not exists (
             select 1 from rwadar_catalogo.alertas a
              where a.revision_id = v.revision_id
                and a.plataforma_id = v.plataforma_id)
           or exists (
             select 1 from rwadar_catalogo.alertas a
              where a.revision_id = v.revision_id
                and a.plataforma_id = v.plataforma_id
                and not exists (
                  select 1 from rwadar_catalogo.alerta_fuentes af
                   where af.revision_id = a.revision_id
                     and af.plataforma_id = a.plataforma_id
                     and af.alerta_codigo = a.codigo))))
     and not exists (
       select 1 from rwadar_catalogo.fuentes f
        where f.revision_id = r.id and f.consultada_el <> r.verificado_el)
     and not exists (
       select 1 from rwadar_catalogo.ofertas o
        where o.revision_id = r.id
          and (o.verificada_el > current_date
            or o.verificada_el > r.verificado_el + r.vigencia_dias
            or o.vigencia_dias > r.vigencia_dias))
   order by r.verificado_el desc, r.creada_el desc
   limit 1
)
select * from candidatas;

revoke all on rwadar_catalogo.revision_publicable from public, anon, authenticated;
grant select on rwadar_catalogo.revision_publicable to anon, authenticated;

create view public.catalogo_plataformas_publicas with (security_invoker = true) as
select rev.id as revision_id, p.slug, p.nombre, c.nombre as categoria, c.color,
       c.orden as categoria_orden, r.nombre as region, p.actor, p.acceso,
       p.ticket, p.cadenas, p.web, p.aval, p.nota, p.verificada_el,
       p.id as plataforma_id,
       jsonb_build_object(
         'verificadoEl', rev.verificado_el,
         'conservaFechaCanonica', true,
         'estadoOperativo', jsonb_build_object(
           'estado', v.estado_operativo,
           'detalle', v.estado_operativo_detalle,
           'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
             'id', f.id, 'tipo', f.tipo, 'titulo', f.titulo, 'url', f.url,
             'primaria', f.primaria, 'consultadaEl', f.consultada_el) order by f.id)
             from rwadar_catalogo.plataforma_fuentes pf
             join rwadar_catalogo.fuentes f
               on f.revision_id = pf.revision_id and f.id = pf.fuente_id
            where pf.revision_id = v.revision_id
              and pf.plataforma_id = v.plataforma_id
              and pf.campo = 'estado_operativo'), '[]'::jsonb)),
         'licenciaRegistro', jsonb_build_object(
           'estado', v.licencia_registro,
           'detalle', v.licencia_registro_detalle,
           'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
             'id', f.id, 'tipo', f.tipo, 'titulo', f.titulo, 'url', f.url,
             'primaria', f.primaria, 'consultadaEl', f.consultada_el) order by f.id)
             from rwadar_catalogo.plataforma_fuentes pf
             join rwadar_catalogo.fuentes f
               on f.revision_id = pf.revision_id and f.id = pf.fuente_id
            where pf.revision_id = v.revision_id
              and pf.plataforma_id = v.plataforma_id
              and pf.campo = 'licencia_registro'), '[]'::jsonb)),
         'acceso', jsonb_build_object(
           'estado', v.acceso,
           'detalle', v.acceso_detalle,
           'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
             'id', f.id, 'tipo', f.tipo, 'titulo', f.titulo, 'url', f.url,
             'primaria', f.primaria, 'consultadaEl', f.consultada_el) order by f.id)
             from rwadar_catalogo.plataforma_fuentes pf
             join rwadar_catalogo.fuentes f
               on f.revision_id = pf.revision_id and f.id = pf.fuente_id
            where pf.revision_id = v.revision_id
              and pf.plataforma_id = v.plataforma_id
              and pf.campo = 'acceso'), '[]'::jsonb)),
         'alertasCriticas', coalesce((select jsonb_agg(jsonb_build_object(
           'codigo', a.codigo, 'detalle', a.detalle,
           'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
             'id', f.id, 'tipo', f.tipo, 'titulo', f.titulo, 'url', f.url,
             'primaria', f.primaria, 'consultadaEl', f.consultada_el) order by f.id)
             from rwadar_catalogo.alerta_fuentes af
             join rwadar_catalogo.fuentes f
               on f.revision_id = af.revision_id and f.id = af.fuente_id
            where af.revision_id = a.revision_id
              and af.plataforma_id = a.plataforma_id
              and af.alerta_codigo = a.codigo), '[]'::jsonb)) order by a.codigo)
           from rwadar_catalogo.alertas a
          where a.revision_id = v.revision_id
            and a.plataforma_id = v.plataforma_id), '[]'::jsonb)
       ) as verificacion_local
  from rwadar_catalogo.revision_publicable rev
  join rwadar_catalogo.plataformas v on v.revision_id = rev.id
  join public.plataformas p on p.id = v.plataforma_id
  join public.categorias c on c.slug = p.categoria_slug
  join public.regiones r on r.slug = p.region_slug
 order by p.nombre;

create view public.catalogo_ofertas_publicas with (security_invoker = true) as
with ofertas_del_lote as (
  select o.*,
         (o.estado_revision = 'actual'
           and o.verificada_el <= current_date
           and current_date <= o.verificada_el + o.vigencia_dias) as cifras_vigentes
    from rwadar_catalogo.revision_publicable rev
    join rwadar_catalogo.ofertas o on o.revision_id = rev.id
)
select o.revision_id, o.slug, o.tipo, o.titulo, o.plataforma_slug, o.plataforma_nombre,
       c.nombre as categoria, c.color, o.pais,
       case when o.cifras_vigentes then o.resumen
         else 'Condiciones pendientes de nueva revisión. Consulta la fuente oficial antes de tomar decisiones.' end as resumen,
       o.url, o.verificada_el, o.vigencia_dias, o.permanente,
       case when o.cifras_vigentes then o.disponible_es end as disponible_es,
       o.eu, o.fuera_ladrillo,
       case when o.cifras_vigentes then o.puntuacion end as puntuacion,
       case when o.cifras_vigentes then o.rentabilidad end as rentabilidad,
       case when o.cifras_vigentes then o.precio end as precio,
       case when o.cifras_vigentes then o.metricas
         else '[{"etiqueta":"Revisión","valor":"Cifras pendientes de nueva revisión"}]'::jsonb end as metricas,
       o.avisos, o.estado_revision, o.fuentes_actuales,
       o.patrocinada
  from ofertas_del_lote o
  join public.categorias c on c.slug = o.categoria_slug
 order by o.cifras_vigentes desc, o.plataforma_nombre, o.titulo;

revoke all on public.catalogo_plataformas_publicas from public, anon, authenticated;
revoke all on public.catalogo_ofertas_publicas from public, anon, authenticated;
grant select on public.catalogo_plataformas_publicas,
  public.catalogo_ofertas_publicas to anon, authenticated;

comment on view public.catalogo_plataformas_publicas is
  'Lote público fail-closed: exactamente 26 plataformas con verificación completa y vigente.';
comment on view public.catalogo_ofertas_publicas is
  'Lote completo de 28 ofertas. La vigencia individual retira cifras y condiciones comerciales sin borrar evidencia, fuentes ni advertencias. No depende de la interfaz.';
