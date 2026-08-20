-- =====================================================================
-- RWAdar · rollback operativo SEGURO de la migración 14
-- ---------------------------------------------------------------------
-- No restaura los grants vulnerables anteriores. Si la nueva interfaz de
-- PostgREST falla, este interruptor deja opiniones/denuncias en solo
-- lectura y conserva todos los datos. El catálogo continúa funcionando.
-- Para reactivar, se reaplica 14_seguridad_integral.sql.
-- =====================================================================
begin;

revoke execute on function guardar_opinion(uuid, integer, text) from authenticated;
revoke execute on function borrar_mi_opinion(uuid) from authenticated;
revoke execute on function denunciar_opinion(uuid, text) from authenticated;
revoke execute on function moderar(uuid, text, text) from authenticated;
revoke select on mis_opiniones, cola_moderacion from authenticated;

-- Conserva lectura pública con el contrato anterior (sin opinion_id),
-- siempre como security_invoker. No devuelve usuario_id ni correo.
drop view opiniones_publicas;
create view opiniones_publicas
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         o.autor_publico as autor,
         o.nota, o.texto, o.creado_el,
         (o.actualizado_el > o.creado_el + interval '1 minute') as editada
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible';

create or replace view nota_media
with (security_invoker = true) as
  select o.plataforma_id,
         p.nombre as plataforma,
         count(*)::int as opiniones,
         case when count(*) >= 3 then round(avg(o.nota)::numeric, 1) end as media
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
   where o.estado = 'visible'
   group by o.plataforma_id, p.nombre;

grant select on opiniones_publicas, nota_media to anon, authenticated;

-- Los cierres críticos permanecen: nadie recupera UPDATE de es_admin,
-- estado/denuncias ni INSERT directo de denuncias.
revoke update on perfiles from anon, authenticated;
grant update (nombre, avisos_correo) on perfiles to authenticated;
revoke insert, update, delete on opiniones, denuncias from anon, authenticated;

notify pgrst, 'reload schema';
commit;
