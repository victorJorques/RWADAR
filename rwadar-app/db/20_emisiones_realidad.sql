-- =====================================================================
-- RWAdar · las emisiones, corregidas contra la realidad (2 de 2)
-- ---------------------------------------------------------------------
-- Requiere db/19_emisiones_estados.sql aplicado ANTES y en su propia
-- transacción. El porqué de cada cambio está en la cabecera del 19.
-- =====================================================================

-- 1 · una emisión abierta ya no necesita fecha de cierre
alter table emisiones drop constraint if exists abierta_tiene_cierre;

-- 2 · el ticket mínimo puede no estar publicado
alter table emisiones alter column ticket_minimo drop not null;
alter table emisiones drop constraint if exists emisiones_ticket_minimo_check;
alter table emisiones add constraint ticket_positivo
  check (ticket_minimo is null or ticket_minimo > 0);

-- 3 · el plazo, como rango
alter table emisiones add column if not exists plazo_meses_max smallint;
alter table emisiones add constraint plazo_coherente
  check (plazo_meses_max is null or plazo_meses is null or plazo_meses_max >= plazo_meses);
comment on column emisiones.plazo_meses is
  'Plazo en meses. Si la plataforma publica un rango ("30-34"), este es el mínimo y plazo_meses_max el máximo.';

-- 4b · cuándo abre, con hora: "el martes a las 12:00" es la mitad del producto
alter table emisiones add column if not exists abre_en timestamptz;

-- 5 · distinguir "no lo publican nunca" de "no lo hemos mirado"
alter table emisiones add column if not exists rentabilidad_no_publicada boolean not null default false;
alter table emisiones add constraint rentabilidad_coherente
  check (not (rentabilidad_no_publicada and rentabilidad is not null));
comment on column emisiones.rentabilidad_no_publicada is
  'La plataforma no publica rentabilidad por criterio del supervisor (caso Urbanitae en equity). No es un hueco pendiente: es permanente.';

-- Honradez sobre quién puede entrar de verdad
alter table emisiones add column if not exists acceso_restringido text;
alter table emisiones add column if not exists vinculante boolean not null default true;
comment on column emisiones.acceso_restringido is
  'Si no la puede suscribir cualquiera, aquí se dice quién sí. Ej: "solo empadronados en Flix y la Ribera d Ebre con 2 años de antigüedad".';
comment on column emisiones.vinculante is
  'false = es una reserva sin desembolso, no una suscripción. Las cinco de Flix lo son.';

-- ---------------------------------------------------------------------
-- La vista de calidad, revisada: sin fecha de cierre, lo que envejece es
-- la comprobación. Y el inventario rota en días -tres de las nueve
-- cambian de estado esta semana-, así que 14 días era demasiado
-- generoso. Se baja a 7.
-- ---------------------------------------------------------------------
drop view if exists emisiones_rancias;
create view emisiones_rancias as
  select e.slug, p.nombre as plataforma, e.titulo, e.verificada_el, e.cierra_el,
         case
           when e.cierra_el is not null and e.cierra_el < current_date then 'la fecha de cierre ya pasó'
           when e.abre_en is not null and e.abre_en < now() and e.estado <> 'abierta' then 'ya debería haber abierto'
           else 'sin comprobar desde hace ' || (current_date - e.verificada_el) || ' días'
         end as motivo
  from emisiones e
  join plataformas p on p.id = e.plataforma_id
  where e.estado in ('abierta', 'programada')
    and ((e.cierra_el is not null and e.cierra_el < current_date)
      or (e.abre_en is not null and e.abre_en < now() and e.estado <> 'abierta')
      or e.verificada_el < current_date - 7);

-- ---------------------------------------------------------------------
-- Y la vista pública, con lo nuevo. Se mantienen los nombres de antes
-- para no romper la web que ya los lee.
-- ---------------------------------------------------------------------
drop view if exists emisiones_publicas;
create view emisiones_publicas as
  select e.slug, e.titulo, e.resumen, e.ubicacion,
         p.slug as plataforma_slug, p.nombre as plataforma, p.web as plataforma_web,
         c.nombre as categoria, c.color,
         e.moneda, e.ticket_minimo, e.objetivo, e.captado,
         case when e.objetivo > 0 then round(100 * coalesce(e.captado,0) / e.objetivo, 1) end as porcentaje,
         e.rentabilidad, e.rentabilidad_no_publicada,
         e.plazo_meses, e.plazo_meses_max, e.tipo_rendimiento,
         e.abre_el, e.abre_en, e.cierra_el,
         case when e.cierra_el is not null then e.cierra_el - current_date end as dias_para_cerrar,
         e.estado, e.url, e.verificada_el,
         e.acceso_restringido, e.vinculante,
         e.rentabilidad_real, e.resultado_nota, e.patrocinada
  from emisiones e
  join plataformas p  on p.id = e.plataforma_id
  join categorias  c  on c.slug = e.categoria_slug
  order by (e.estado = 'abierta') desc,
           e.abre_en asc nulls last,
           e.cierra_el asc nulls last,
           e.verificada_el desc;

grant select on emisiones_publicas to anon, authenticated;
grant select on emisiones_rancias to anon, authenticated;
