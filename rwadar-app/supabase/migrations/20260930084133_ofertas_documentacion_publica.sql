-- Documentación editorial separada de las condiciones comerciales.
-- Creada con Supabase CLI 2.115.0; aplicar después de las migraciones 24 y 25.
-- No refecha ofertas, no aprueba lotes y no cambia RLS, ACL ni vigencias.
begin;

alter table rwadar_catalogo.ofertas
  add column documentacion jsonb,
  add constraint oferta_documentacion_objeto check (
    documentacion is null or jsonb_typeof(documentacion) = 'object'
  );

comment on column rwadar_catalogo.ofertas.documentacion is
  'Descripción, características y referencias documentales fechadas. No renueva precios, rentabilidades ni disponibilidad; null conserva compatibilidad con lotes anteriores.';

-- CREATE OR REPLACE conserva propietario y ACL. Las columnas anteriores
-- mantienen su nombre, orden y tipo; documentacion se añade al final.
create or replace view public.catalogo_ofertas_publicas with (security_invoker = true) as
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
       o.patrocinada, o.documentacion
  from ofertas_del_lote o
  join public.categorias c on c.slug = o.categoria_slug
 order by o.cifras_vigentes desc, o.plataforma_nombre, o.titulo;

notify pgrst, 'reload schema';
commit;
