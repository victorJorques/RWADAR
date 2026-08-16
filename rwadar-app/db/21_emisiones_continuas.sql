-- =====================================================================
-- RWAdar · productos continuos, y si un español puede comprarlos
-- ---------------------------------------------------------------------
-- Dos cosas que no se ven mirando el mercado español y sí mirando el
-- registro entero:
--
-- 1. EN TOKENIZACIÓN, LA MAYORÍA DE LO MINORISTA NO CIERRA. Oro
--    tokenizado, un fondo del Tesoro, una acción tokenizada: están
--    abiertos siempre. No son «una habitación para esta noche», son «un
--    hotel que siempre tiene sitio». Booking enseña las dos cosas, pero
--    no las cuenta igual: a un producto continuo ponerle un contador de
--    días es mentir, y dejarlo sin nada lo hace parecer caducado.
--
-- 2. Y LA PREGUNTA QUE DE VERDAD IMPORTA AQUÍ: ¿puede comprarlo alguien
--    que vive en España? Media tokenización minorista del mundo está
--    cerrada a residentes en la UE, o solo para acreditados de EE. UU.
--    Un escaparate lleno de cosas que el visitante no puede comprar no
--    es un escaparate, es una pérdida de tiempo — y de las peores, la
--    que se descubre después de tres clics.
--
--    Se guarda en tres estados a propósito, no en un sí/no: `null`
--    significa «no lo hemos comprobado todavía», que NO es lo mismo que
--    «no se puede». Dar por cerrado lo que no se ha mirado es tan malo
--    como darlo por abierto.
-- =====================================================================

alter table emisiones add column if not exists continua boolean not null default false;
comment on column emisiones.continua is
  'true = producto de oferta continua (oro tokenizado, fondo del Tesoro, acción tokenizada). No tiene cierre ni objetivo: no se le pinta contador ni barra.';

alter table emisiones add column if not exists disponible_es boolean;
comment on column emisiones.disponible_es is
  '¿Puede comprarlo alguien residente en España? null = sin comprobar, que no es lo mismo que false.';

-- Un producto continuo no tiene fecha de cierre ni objetivo: si los
-- tuviera, es que no era continuo y alguien se equivocó al cargarlo.
alter table emisiones add constraint continua_sin_calendario
  check (not continua or (cierra_el is null and objetivo is null));

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
         e.estado, e.continua, e.disponible_es,
         e.url, e.verificada_el,
         e.acceso_restringido, e.vinculante,
         e.rentabilidad_real, e.resultado_nota, e.patrocinada
  from emisiones e
  join plataformas p  on p.id = e.plataforma_id
  join categorias  c  on c.slug = e.categoria_slug
  /* Lo que se puede comprar desde España, primero. Es el visitante que
     tenemos, y ordenar por otra cosa sería un escaparate para nadie. */
  order by (e.estado = 'abierta') desc,
           (e.disponible_es is not false) desc,
           e.abre_en asc nulls last,
           e.cierra_el asc nulls last,
           e.verificada_el desc;

grant select on emisiones_publicas to anon, authenticated;
