-- V2 editorial: manifiesto explícito y colecciones documentales.
-- V1 conserva sus vistas y sus conteos para los APK ya publicados.
begin;

alter table rwadar_catalogo.revisiones
  drop constraint revisiones_version_esquema_check,
  drop constraint revisiones_plataformas_esperadas_check,
  drop constraint revisiones_ofertas_esperadas_check,
  add column colecciones_esperadas jsonb,
  add constraint revisiones_manifiesto_versionado check (
    case when version_esquema = 1 then
      plataformas_esperadas = 26 and ofertas_esperadas = 28 and colecciones_esperadas is null
    when version_esquema = 2 then
      plataformas_esperadas > 0 and ofertas_esperadas > 0
      and colecciones_esperadas is not null
      and jsonb_typeof(colecciones_esperadas) = 'object'
      and colecciones_esperadas ?& array['principales','secundario','en_camino']
      and colecciones_esperadas - array['principales','secundario','en_camino'] = '{}'::jsonb
      and jsonb_typeof(colecciones_esperadas->'principales') = 'number'
      and jsonb_typeof(colecciones_esperadas->'secundario') = 'number'
      and jsonb_typeof(colecciones_esperadas->'en_camino') = 'number'
      and (colecciones_esperadas->>'principales') ~ '^[1-9][0-9]*$'
      and (colecciones_esperadas->>'secundario') ~ '^(0|[1-9][0-9]*)$'
      and (colecciones_esperadas->>'en_camino') ~ '^(0|[1-9][0-9]*)$'
      and (colecciones_esperadas->>'principales')::integer <= 32767
      and (colecciones_esperadas->>'secundario')::integer <= 32767
      and (colecciones_esperadas->>'en_camino')::integer <= 32767
      and (colecciones_esperadas->>'principales')::integer
        + (colecciones_esperadas->>'secundario')::integer
        + (colecciones_esperadas->>'en_camino')::integer = ofertas_esperadas
    else false end
  );

alter table rwadar_catalogo.ofertas
  add column coleccion text not null default 'principales',
  add constraint oferta_coleccion_valida check (coleccion in ('principales','secundario','en_camino')),
  add constraint oferta_coleccion_documental check (
    coleccion = 'principales' or (estado_revision = 'no_verificable'
      and precio is null and rentabilidad is null and puntuacion is null and disponible_es is null)
  );

-- El puntero sigue visible cuando la revisión caduca. Las políticas vigentes
-- de las tablas editoriales siguen ocultando sus detalles. Así una revisión
-- V2 caducada, incompleta o retirada vacía ambas vistas sin volver a otra.
create table rwadar_catalogo.publicacion_v2 (
  unica boolean primary key default true check (unica),
  revision_id uuid not null references rwadar_catalogo.revisiones(id) on delete restrict
);
alter table rwadar_catalogo.publicacion_v2 enable row level security;
create policy puntero_publicacion_v2 on rwadar_catalogo.publicacion_v2
  for select to anon, authenticated using (true);
revoke all on rwadar_catalogo.publicacion_v2 from public, anon, authenticated;
grant select on rwadar_catalogo.publicacion_v2 to anon, authenticated;

create function rwadar_catalogo.fijar_publicacion_v2() returns trigger
  language plpgsql security invoker set search_path = pg_catalog, rwadar_catalogo as $$
begin
  if new.version_esquema = 2 and new.estado = 'aprobada' then
    insert into rwadar_catalogo.publicacion_v2 (unica,revision_id)
      select true,r.id from rwadar_catalogo.revisiones r
       where r.version_esquema = 2 and r.estado = 'aprobada'
       order by r.aprobada_el desc,r.creada_el desc,r.id desc limit 1
    on conflict (unica) do update set revision_id = excluded.revision_id;
  end if;
  return new;
end $$;
revoke all on function rwadar_catalogo.fijar_publicacion_v2() from public, anon, authenticated;
create trigger fijar_publicacion_v2
  after insert or update of estado,aprobada_el,version_esquema on rwadar_catalogo.revisiones
  for each row execute function rwadar_catalogo.fijar_publicacion_v2();

insert into rwadar_catalogo.publicacion_v2 (unica,revision_id)
  select true,r.id from rwadar_catalogo.revisiones r
   where r.version_esquema = 2 and r.estado = 'aprobada'
   order by r.aprobada_el desc,r.creada_el desc,r.id desc limit 1;

comment on table rwadar_catalogo.publicacion_v2 is
  'Puntero a la última aprobación V2. Nunca selecciona una revisión anterior si esta deja de ser publicable.';

create or replace view rwadar_catalogo.revision_publicable with (security_invoker = true) as
with candidatas as (
  select r.*
    from rwadar_catalogo.revisiones r
   where r.version_esquema = 1 and r.estado = 'aprobada'
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


create view rwadar_catalogo.revision_publicable_v2 with (security_invoker = true) as
with candidatas as (
  select r.*
    from rwadar_catalogo.revisiones r
    join rwadar_catalogo.publicacion_v2 actual on actual.revision_id = r.id
   where r.version_esquema = 2 and r.estado = 'aprobada'
     and r.verificado_el <= current_date
     and current_date <= r.verificado_el + r.vigencia_dias
     and (select count(*) from rwadar_catalogo.plataformas p
           where p.revision_id = r.id) = r.plataformas_esperadas
     and (select count(*) from rwadar_catalogo.ofertas o
           where o.revision_id = r.id) = r.ofertas_esperadas
     and not exists (
       select 1 from jsonb_each_text(r.colecciones_esperadas) esperado
        where (select count(*) from rwadar_catalogo.ofertas o
                where o.revision_id = r.id and o.coleccion = esperado.key) <> esperado.value::integer)
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
          and (o.documentacion is null or o.verificada_el > current_date
            or o.verificada_el > r.verificado_el + r.vigencia_dias
            or o.vigencia_dias > r.vigencia_dias))
   order by r.verificado_el desc, r.creada_el desc
   limit 1
)
select * from candidatas;


create view public.catalogo_plataformas_publicas_v2 with (security_invoker = true) as
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
       ) as verificacion_local,
       rev.version_esquema,rev.plataformas_esperadas,rev.ofertas_esperadas,
       rev.colecciones_esperadas,rev.verificado_el as verificado_lote_el,
       rev.vigencia_dias as vigencia_lote_dias
  from rwadar_catalogo.revision_publicable_v2 rev
  join rwadar_catalogo.plataformas v on v.revision_id = rev.id
  join public.plataformas p on p.id = v.plataforma_id
  join public.categorias c on c.slug = p.categoria_slug
  join public.regiones r on r.slug = p.region_slug
 order by p.nombre;


create view public.catalogo_ofertas_publicas_v2 with (security_invoker = true) as
with ofertas_del_lote as (
  select o.*, rev.version_esquema,rev.plataformas_esperadas,rev.ofertas_esperadas,
         rev.colecciones_esperadas,rev.verificado_el as verificado_lote_el,
         rev.vigencia_dias as vigencia_lote_dias,
         (o.coleccion = 'principales' and o.estado_revision = 'actual'
           and o.verificada_el <= current_date
           and current_date <= o.verificada_el + o.vigencia_dias) as cifras_vigentes
    from rwadar_catalogo.revision_publicable_v2 rev
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
       o.patrocinada, o.documentacion, o.coleccion,
       o.version_esquema,o.plataformas_esperadas,o.ofertas_esperadas,
       o.colecciones_esperadas,o.verificado_lote_el,o.vigencia_lote_dias
  from ofertas_del_lote o
  join public.categorias c on c.slug = o.categoria_slug
 order by o.cifras_vigentes desc, o.plataforma_nombre, o.titulo;

notify pgrst, 'reload schema';

revoke all on rwadar_catalogo.revision_publicable_v2,
  public.catalogo_plataformas_publicas_v2,public.catalogo_ofertas_publicas_v2
  from public,anon,authenticated;
grant select on rwadar_catalogo.revision_publicable_v2,
  public.catalogo_plataformas_publicas_v2,public.catalogo_ofertas_publicas_v2
  to anon,authenticated;

commit;
