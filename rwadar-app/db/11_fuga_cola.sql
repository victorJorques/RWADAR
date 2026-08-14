-- =====================================================================
-- RWAdar · cierra una fuga en la cola de moderación
-- ---------------------------------------------------------------------
-- QUÉ PASABA
--
-- `cola_moderacion` es una VISTA, y en Postgres una vista se ejecuta por
-- defecto con los permisos de quien la creó, no de quien la consulta.
-- Resultado: el RLS de `opiniones` y `denuncias` no se aplicaba al mirar
-- por ahí. Cualquier persona registrada podía pedir la cola entera y ver
-- opiniones ocultas, quién las firma y **el motivo que otro escribió al
-- denunciar**. Comprobado contra producción con tres cuentas reales: el
-- usuario C leía el motivo que había escrito el usuario B.
--
-- Las tablas de verdad (`denuncias`, `moderacion`) sí filtraban. Solo
-- fallaba la vista. Es el aviso "UNRESTRICTED" que el panel de Supabase
-- pone al lado de las vistas, y que conviene no ignorar.
--
-- CÓMO SE CIERRA, con dos cierres independientes:
--   1 · security_invoker = true  -> la vista pasa a ejecutarse con los
--       permisos de quien consulta, así que el RLS vuelve a aplicarse.
--   2 · un filtro explícito es_admin() dentro de la propia vista, por si
--       algún día alguien recrea la vista y olvida lo anterior.
--
-- Depende de 09_opiniones.sql y 10_moderacion.sql.  Es idempotente.
-- =====================================================================
begin;

drop view if exists cola_moderacion;

create view cola_moderacion
with (security_invoker = true) as
  select o.usuario_id, o.plataforma_id,
         p.nombre  as plataforma,
         coalesce(nullif(trim(pf.nombre), ''), 'Anónimo') as autor,
         o.nota, o.texto, o.estado, o.denuncias, o.creado_el,
         (select array_agg(coalesce(d.motivo,'sin motivo') order by d.creado_el)
            from denuncias d
           where d.usuario_id = o.usuario_id and d.plataforma_id = o.plataforma_id) as motivos
    from opiniones o
    join plataformas p on p.id = o.plataforma_id
    left join perfiles pf on pf.id = o.usuario_id
   where (o.denuncias > 0 or o.estado = 'oculta')
     and es_admin()                       -- el segundo cierre
   order by o.denuncias desc, o.creado_el desc;

grant select on cola_moderacion to authenticated;

-- Misma cautela con el resumen del perfil. Ya se filtraba solo por
-- auth.uid(), así que no había fuga, pero que dependa de una sola cosa
-- es justo lo que ha fallado arriba.
drop view if exists mi_perfil;

create view mi_perfil
with (security_invoker = true) as
  select p.id, p.nombre, p.avisos_correo, p.es_admin,
         p.creado_el                        as miembro_desde,
         (current_date - p.creado_el::date) as dias_de_miembro,
         (select count(*) from vigilancia v    where v.usuario_id = p.id) as plataformas_vigiladas,
         (select count(*) from avisos_correo a where a.usuario_id = p.id) as avisos_recibidos
    from perfiles p
   where p.id = auth.uid();

grant select on mi_perfil to authenticated;

-- ---------------------------------------------------------------------
-- Y de paso: quién modera
-- ---------------------------------------------------------------------
-- Se concede por correo y no por identificador para que se lea sin tener
-- que buscar nada. Si esa cuenta no existe, no hace nada y no falla.
update perfiles set es_admin = true
 where id = (select u.id from auth.users u
              where lower(u.email) = 'rwadar@protonmail.com');

commit;
