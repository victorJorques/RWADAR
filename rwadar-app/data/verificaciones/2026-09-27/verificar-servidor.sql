-- Consultas de lectura para contrastar el catálogo del proyecto RWAdar
-- exgpmjpaaebyoolpwced. No cambian tablas, datos, permisos ni configuración.
-- Ejecutar únicamente con autorización explícita de SQL remoto de lectura.

select table_schema, table_name, column_name, data_type
from information_schema.columns
where table_schema in ('public', 'rwadar_catalogo')
  and table_name in (
    'radar_publico', 'emisiones_publicas',
    'catalogo_plataformas_publicas', 'catalogo_ofertas_publicas',
    'revisiones'
  )
order by table_schema, table_name, ordinal_position;

select n.nspname as esquema, c.relname as objeto,
       c.relkind as tipo, c.relrowsecurity as rls,
       c.relforcerowsecurity as rls_forzada, c.reloptions as opciones
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'rwadar_catalogo')
  and c.relkind in ('r', 'v', 'm', 'p')
order by n.nspname, c.relname;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'rwadar_catalogo')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_schema, table_name, grantee, privilege_type;
