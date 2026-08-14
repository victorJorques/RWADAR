-- =====================================================================
-- RWAdar · recuperar las migraciones 14 y 15
-- ---------------------------------------------------------------------
-- ESTO NO CAMBIA NADA. Solo lee y devuelve un texto.
--
-- QUÉ PROBLEMA RESUELVE
--
-- A producción se le aplicaron dos migraciones que no existen como
-- fichero en `db/`. Por eso el repositorio ya no describe la base, y por
-- eso el 14 de agosto la web estuvo rota para todo el mundo sin que se
-- viera en el código: producción prohíbe escribir opiniones directamente
-- y publica funciones para ello, y el repositorio no sabe nada de eso.
--
-- Mientras no se recuperen, nadie puede reconstruir este proyecto desde
-- cero — que es justo lo que se estuvo cuidando durante semanas.
--
-- CÓMO SE USA
--
--   1. Pégalo entero en el editor SQL del panel y dale a Run.
--   2. La consulta devuelve UNA celda con mucho texto dentro.
--   3. Cópiala y pásamela. Con eso escribo `14_*.sql` y `15_*.sql` tal y
--      como están en producción, y el repositorio vuelve a describir la
--      base.
--
-- Ojo: el editor a veces no pinta el resultado aunque la consulta haya
-- ido bien. Si la celda no aparece, la respuesta está igualmente en la
-- pestaña de red del navegador (`/pg-meta/…/query`).
-- =====================================================================

select string_agg(bloque, E'\n\n' order by orden, nombre) as esquema_real
from (

  -- 1 · Todas las funciones de public, con su cuerpo entero
  select 1 as orden, p.proname as nombre,
         pg_get_functiondef(p.oid) || ';' as bloque
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prokind = 'f'

  union all

  -- 2 · Las vistas, con su definición y si respetan el RLS de origen
  select 2, c.relname,
         '-- vista ' || c.relname ||
         case when c.reloptions::text like '%security_invoker%'
              then '  (security_invoker: respeta el RLS de las tablas de origen)'
              else '  (SIN security_invoker: se salta el RLS — revisar)' end ||
         E'\ncreate or replace view ' || c.relname || ' as ' ||
         pg_get_viewdef(c.oid, true)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'

  union all

  -- 3 · Las políticas de seguridad por fila
  select 3, tablename || '.' || policyname,
         '-- politica sobre ' || tablename || E'\ncreate policy "' || policyname ||
         '" on ' || tablename || ' for ' || cmd ||
         ' to ' || array_to_string(roles, ', ') ||
         coalesce(' using (' || qual || ')', '') ||
         coalesce(' with check (' || with_check || ')', '') || ';'
    from pg_policies
   where schemaname = 'public'

  union all

  -- 4 · Los permisos de tabla, que es lo que se perdió sin que nadie lo viera
  select 4, table_name || '.' || grantee,
         '-- grant  ' || rpad(table_name, 24) || ' → ' || rpad(grantee, 15) ||
         ' : ' || string_agg(privilege_type, ', ' order by privilege_type)
    from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee in ('anon', 'authenticated')
   group by table_name, grantee

  union all

  -- 5 · Columnas de las tablas que más han cambiado
  select 5, table_name,
         '-- columnas de ' || table_name || ': ' ||
         string_agg(column_name || ' ' || data_type, ', ' order by ordinal_position)
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('opiniones', 'denuncias', 'moderacion', 'perfiles',
                        'vigilancia', 'avisos_correo', 'dispositivos', 'seguimiento')
   group by table_name

  union all

  -- 6 · Los relojes programados
  select 6, jobname,
         '-- cron ' || jobname || '  (' || schedule || ')  ' || command
    from cron.job

) t;
